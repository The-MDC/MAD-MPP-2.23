/**
 * The database side of market resolution (needs migration 0027).
 *
 *   saveSpec / getSpec          a spec is stored once, by content hash, and re-hashed on every read, so a row that
 *                               was ever edited out-of-band is refused instead of trusted.
 *   createMarketWithSpec        a market and its spec are written in ONE transaction; there is no way to create one
 *                               without the other (the 0027 trigger enforces the same rule a second time).
 *   transition                  every state change runs under a row lock: read the market's state, apply a pure
 *                               function from lib/market-resolution.ts, write the new state, the market's status and
 *                               outcome, and an audit event — all or nothing.
 *   sweepDue                    the cron entry: closes markets whose time has passed and cancels (refunds) the ones
 *                               nobody resolved before deadline + fallback_after. Idempotent.
 *
 * Not wired into a route yet. Production still runs the Neon database, which has no 0027, so nothing imports this
 * until the Supabase cutover. SERVER ONLY.
 */
import type { Pool, PoolClient } from "pg";
import {
  expire, initialState, phaseAt, statusFor,
  type Phase, type ResolutionState, type Result,
} from "./market-resolution";
import { hashSpec, specId, validateResolutionSpec, type ResolutionSpec } from "./resolution-spec";

type Db = Pick<Pool, "query"> | Pick<PoolClient, "query">;

export interface StoredSpec { id: string; hash: string; spec: ResolutionSpec }

/** Store a spec (idempotent: the same content is the same row). Throws with the reasons if it does not validate. */
export async function saveSpec(db: Db, spec: unknown, now: Date = new Date()): Promise<StoredSpec> {
  const v = validateResolutionSpec(spec, { now });
  if (!v.ok) throw new Error(`invalid resolution spec: ${v.errors.join("; ")}`);
  const s = spec as ResolutionSpec;
  const hash = hashSpec(s);
  const id = specId(hash);
  await db.query(
    `INSERT INTO resolution_specs (id, family, schema_version, spec, spec_hash)
     VALUES ($1, $2, $3, $4::jsonb, $5)
     ON CONFLICT (spec_hash) DO NOTHING`,
    [id, s.family, s.schema, JSON.stringify(s), hash],
  );
  return { id, hash, spec: s };
}

/** Read a spec back and confirm it still hashes to its id. Returns null if absent; throws if it was tampered with. */
export async function getSpec(db: Db, id: string): Promise<StoredSpec | null> {
  const res = await db.query(`SELECT spec, spec_hash FROM resolution_specs WHERE id = $1`, [id]);
  const row = res.rows[0] as { spec: ResolutionSpec; spec_hash: string } | undefined;
  if (!row) return null;
  const actual = hashSpec(row.spec);
  if (actual !== row.spec_hash || specId(actual) !== id) throw new Error(`resolution spec ${id} does not match its hash`);
  return { id, hash: actual, spec: row.spec };
}

export interface NewMarket {
  id: string;
  title: string;
  category?: string;
  description?: string | null;
  creatorWallet?: string | null;
  yesOdds?: number;
  noOdds?: number;
  spec: unknown;
}

/** Create a market and its spec together. Returns the market id and spec id; a repeat of the same id is a no-op. */
export async function createMarketWithSpec(pool: Pool, m: NewMarket, now: Date = new Date()): Promise<{ marketId: string; specId: string; created: boolean }> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const stored = await saveSpec(client, m.spec, now);
    const closes = stored.spec.decision?.closes_at ?? null;
    const res = await client.query(
      `INSERT INTO markets (id, title, category, description, creator_wallet, yes_odds, no_odds, resolution_at, closes_at, resolution_spec_id, resolution_state)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $9, $10::jsonb)
       ON CONFLICT (id) DO NOTHING
       RETURNING id`,
      [
        m.id, m.title, m.category ?? "general", m.description ?? null,
        m.creatorWallet ? m.creatorWallet.toLowerCase() : null,
        m.yesOdds ?? 2.0, m.noOdds ?? 2.0, closes, stored.id, JSON.stringify(initialState()),
      ],
    );
    await client.query("COMMIT");
    return { marketId: m.id, specId: stored.id, created: res.rows.length > 0 };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

export type TransitionFn = (state: ResolutionState, spec: ResolutionSpec, nowMs: number) => Result;

export interface TransitionOutcome { ok: boolean; reason?: string; phase?: Phase; changed?: boolean }

/**
 * Apply one pure transition to one market under a row lock. `event` names it in the audit trail
 * (assert | dispute | vote | resolve | fallback | cancel | expire). A refusal changes nothing and is reported, not thrown.
 */
export async function transition(pool: Pool, marketId: string, event: string, actor: string | null, payload: unknown, fn: TransitionFn, now: Date = new Date()): Promise<TransitionOutcome> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const cur = await client.query(
      `SELECT m.resolution_state AS state, s.spec AS spec
         FROM markets m JOIN resolution_specs s ON s.id = m.resolution_spec_id
        WHERE m.id = $1 FOR UPDATE OF m`,
      [marketId],
    );
    const row = cur.rows[0] as { state: Partial<ResolutionState>; spec: ResolutionSpec } | undefined;
    if (!row) { await client.query("ROLLBACK"); return { ok: false, reason: "market not found, or it has no resolution spec" }; }
    const before: ResolutionState = { ...initialState(), ...row.state };
    const result = fn(before, row.spec, now.getTime());
    if (!result.ok) { await client.query("ROLLBACK"); return { ok: false, reason: result.reason }; }
    const next = result.state;
    const changed = JSON.stringify(next) !== JSON.stringify(before);
    if (changed) {
      await client.query(
        `UPDATE markets SET resolution_state = $2::jsonb, status = $3, outcome = $4, updated_at = now() WHERE id = $1`,
        [marketId, JSON.stringify(next), statusFor(next.phase), next.outcome],
      );
      await client.query(
        `INSERT INTO resolution_events (market_id, event, actor, payload, state_after) VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)`,
        [marketId, event, actor, JSON.stringify(payload ?? {}), JSON.stringify(next)],
      );
    }
    await client.query("COMMIT");
    return { ok: true, phase: next.phase, changed };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

export interface SweepReport { scanned: number; closed: number; cancelled: number; failed: number }

/**
 * Cron entry. For each unresolved market with a spec: move `open` to `closed` once `closes_at` has passed, and cancel
 * (so holders are refunded) the ones past deadline + fallback_after. Safe to run any number of times.
 */
export async function sweepDue(pool: Pool, now: Date = new Date(), limit = 200): Promise<SweepReport> {
  const due = await pool.query(
    `SELECT id FROM markets
      WHERE resolution_spec_id IS NOT NULL AND status NOT IN ('resolved','cancelled')
      ORDER BY closes_at NULLS LAST LIMIT $1`,
    [limit],
  );
  const report: SweepReport = { scanned: due.rows.length, closed: 0, cancelled: 0, failed: 0 };
  for (const r of due.rows as { id: string }[]) {
    try {
      const out = await transition(pool, r.id, "sweep", "cron", {}, (state, spec, t) => {
        const phase = phaseAt(state, spec, t);
        if (phase === "cancelled") return expire(state, spec, t);
        if (phase === "closed" && state.phase === "open") return { ok: true, state: { ...state, phase: "closed" } };
        return { ok: true, state };
      }, now);
      if (out.ok && out.changed) { if (out.phase === "cancelled") report.cancelled++; else report.closed++; }
      else if (!out.ok) report.failed++;
    } catch {
      report.failed++;
    }
  }
  return report;
}
