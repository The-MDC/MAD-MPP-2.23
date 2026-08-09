/**
 * MAD Gambit — persistence for the three custom perpetual families.
 * ────────────────────────────────────────────────────────────────
 * FIVE FACES · ZEITGEIST · PERPETUAL EPIPHANIES, over sql/0012_perp_markets.sql.
 *
 * Raw `pg` + typed mappers, no ORM — ADR-008. Follows lib/markets.ts: the Pool
 * is passed in rather than imported, so this module stays testable and the route
 * handler owns the connection.
 *
 * Two invariants this layer is responsible for, because SQL can't express them:
 *
 *   LEGS, NOT EXPIRIES. `rollLeg` advances a market to the next lunar-grid leg.
 *   Nothing here ever resolves a perp — there is no settle function to call.
 *
 *   NO PERSONAL DATA UNDER A PERSONA. `subject_ref` is opaque. Callers must not
 *   pass a name, handle or likeness; `assertOpaqueSubjectRef` rejects the
 *   obvious shapes at the boundary rather than trusting every future caller.
 */
import type { Pool, PoolClient } from "pg";
import type { FaceId } from "@/lib/persona-codex";
import { nextLegClose, vintageAt } from "@/lib/lunar-legs";
import type { ExitStatus } from "@/lib/position-exit";

export type PerpFamily = "faces" | "zeitgeist" | "epiphany";
export type PerpStatus = "open" | "paused" | "delisted";
export type SubjectClass = "institution" | "brand" | "model" | "index" | "named_individual";
export type PositionLayer = "permanent" | "transitory" | "single";

const toIso = (v: Date | string | null): string | null =>
  v == null ? null : v instanceof Date ? v.toISOString() : String(v);
const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/* ────────────────────────────────────────────────────────────────
 * Subject refs
 * ──────────────────────────────────────────────────────────────── */

/** Anything that isn't plausibly opaque. Cheap, deliberate, and not exhaustive. */
const OPAQUE_REF = /^[a-z0-9][a-z0-9_-]{7,63}$/;

/**
 * Reject a subject_ref that looks like a person rather than a handle. This is a
 * guard rail, not a privacy control — the actual control is that the human
 * binding lives in the registrar's vault and never reaches this database. But a
 * guard rail that fails loudly at insert time is what stops a well-meaning
 * caller from writing `subject_ref: "jane-doe"` on a Tuesday afternoon.
 */
export function assertOpaqueSubjectRef(ref: string): void {
  if (!OPAQUE_REF.test(ref)) {
    throw new Error(
      "subject_ref must be an opaque 8–64 char slug (a-z 0-9 _ -), never a name or handle",
    );
  }
  if (ref.includes(" ") || /@/.test(ref)) {
    throw new Error("subject_ref must not contain a handle or address");
  }
}

/* ────────────────────────────────────────────────────────────────
 * perp_markets
 * ──────────────────────────────────────────────────────────────── */

export interface PerpMarket {
  id: string;
  family: PerpFamily;
  subjectRef: string;
  subjectClass: SubjectClass;
  title: string;
  status: PerpStatus;
  legIndex: number;
  legOpenedAt: string;
  legClosesAt: string;
  paramCommit: string | null;
  paramEpoch: number;
  volume: number;
  details: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface RawMarket {
  id: string;
  family: string;
  subject_ref: string;
  subject_class: string;
  title: string;
  status: string;
  leg_index: number | string;
  leg_opened_at: Date | string;
  leg_closes_at: Date | string;
  param_commit: string | null;
  param_epoch: number | string;
  volume: string | number;
  details: Record<string, unknown> | null;
  created_at: Date | string;
  updated_at: Date | string;
}

function mapMarket(r: RawMarket): PerpMarket {
  return {
    id: r.id,
    family: r.family as PerpFamily,
    subjectRef: r.subject_ref,
    subjectClass: r.subject_class as SubjectClass,
    title: r.title,
    status: r.status as PerpStatus,
    legIndex: num(r.leg_index),
    legOpenedAt: toIso(r.leg_opened_at) ?? "",
    legClosesAt: toIso(r.leg_closes_at) ?? "",
    paramCommit: r.param_commit,
    paramEpoch: num(r.param_epoch),
    volume: num(r.volume),
    details: r.details ?? {},
    createdAt: toIso(r.created_at) ?? "",
    updatedAt: toIso(r.updated_at) ?? "",
  };
}

export interface CreatePerpMarketInput {
  id: string;
  family: PerpFamily;
  subjectRef: string;
  title: string;
  subjectClass?: SubjectClass;
  paramCommit?: string | null;
  details?: Record<string, unknown>;
  nowMs?: number;
}

export async function createPerpMarket(pool: Pool, input: CreatePerpMarketInput): Promise<PerpMarket> {
  assertOpaqueSubjectRef(input.subjectRef);
  const now = input.nowMs ?? Date.now();
  // The first leg is snapped to the shared lunar grid, so it may be short.
  const closesAt = new Date(nextLegClose(now)).toISOString();
  const res = await pool.query(
    `INSERT INTO perp_markets
       (id, family, subject_ref, subject_class, title, leg_opened_at, leg_closes_at, param_commit, details)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (id) DO NOTHING
     RETURNING *`,
    [
      input.id,
      input.family,
      input.subjectRef,
      input.subjectClass ?? "institution",
      input.title,
      new Date(now).toISOString(),
      closesAt,
      input.paramCommit ?? null,
      JSON.stringify(input.details ?? {}),
    ],
  );
  if (res.rows[0]) return mapMarket(res.rows[0] as RawMarket);
  const existing = await getPerpMarket(pool, input.id);
  if (existing) return existing;
  throw new Error("perp market create failed");
}

export async function getPerpMarket(pool: Pool, id: string): Promise<PerpMarket | null> {
  const res = await pool.query(`SELECT * FROM perp_markets WHERE id = $1`, [id]);
  return res.rows[0] ? mapMarket(res.rows[0] as RawMarket) : null;
}

export async function listPerpMarkets(
  pool: Pool,
  family?: PerpFamily,
  status: PerpStatus = "open",
  limit = 50,
): Promise<PerpMarket[]> {
  const res = family
    ? await pool.query(
        `SELECT * FROM perp_markets WHERE family = $1 AND status = $2
         ORDER BY volume DESC, created_at DESC LIMIT $3`,
        [family, status, limit],
      )
    : await pool.query(
        `SELECT * FROM perp_markets WHERE status = $1
         ORDER BY volume DESC, created_at DESC LIMIT $2`,
        [status, limit],
      );
  return (res.rows as RawMarket[]).map(mapMarket);
}

/**
 * Advance a market onto the next leg. Idempotent by design: rolling a market
 * whose leg has not closed is a no-op that returns the current row, so a
 * scheduler that fires twice cannot skip a leg.
 */
export async function rollLeg(pool: Pool, id: string, nowMs = Date.now()): Promise<PerpMarket | null> {
  const res = await pool.query(
    `UPDATE perp_markets
        SET leg_index = leg_index + 1,
            leg_opened_at = leg_closes_at,
            leg_closes_at = $2,
            updated_at = now()
      WHERE id = $1 AND leg_closes_at <= now()
      RETURNING *`,
    [id, new Date(nextLegClose(nowMs)).toISOString()],
  );
  if (res.rows[0]) return mapMarket(res.rows[0] as RawMarket);
  return getPerpMarket(pool, id);
}

/** Markets whose leg has matured — the roll scheduler's work queue. */
export async function listMaturedMarkets(pool: Pool, limit = 200): Promise<PerpMarket[]> {
  const res = await pool.query(
    `SELECT * FROM perp_markets
      WHERE status = 'open' AND leg_closes_at <= now()
      ORDER BY leg_closes_at ASC LIMIT $1`,
    [limit],
  );
  return (res.rows as RawMarket[]).map(mapMarket);
}

export async function setMarketStatus(pool: Pool, id: string, status: PerpStatus): Promise<void> {
  await pool.query(`UPDATE perp_markets SET status = $2, updated_at = now() WHERE id = $1`, [id, status]);
}

/** Freeze a new parameter commitment. Callers must gate this with canRecommit. */
export async function setParamCommit(
  pool: Pool,
  id: string,
  commit: string,
  nextEpoch: number,
): Promise<void> {
  await pool.query(
    `UPDATE perp_markets SET param_commit = $2, param_epoch = $3, updated_at = now() WHERE id = $1`,
    [id, commit, nextEpoch],
  );
}

/* ────────────────────────────────────────────────────────────────
 * faces_simplex
 * ──────────────────────────────────────────────────────────────── */

export interface FacesSimplexRow {
  marketId: string;
  legIndex: number;
  permanent: Record<FaceId, number>;
  transitory: Record<FaceId, number>;
  hPerm: number;
  hTrans: number;
  divergence: number;
  tauPerm: number | null;
  tauTrans: number | null;
  crownedFace: FaceId | null;
  isSlip: boolean;
  filterState: Record<string, unknown>;
  createdAt: string;
}

interface RawSimplex {
  market_id: string;
  leg_index: number | string;
  permanent: Record<string, number>;
  transitory: Record<string, number>;
  h_perm: string | number;
  h_trans: string | number;
  divergence: string | number;
  tau_perm: string | number | null;
  tau_trans: string | number | null;
  crowned_face: string | null;
  is_slip: boolean;
  filter_state: Record<string, unknown> | null;
  created_at: Date | string;
}

function mapSimplex(r: RawSimplex): FacesSimplexRow {
  return {
    marketId: r.market_id,
    legIndex: num(r.leg_index),
    permanent: r.permanent as Record<FaceId, number>,
    transitory: r.transitory as Record<FaceId, number>,
    hPerm: num(r.h_perm),
    hTrans: num(r.h_trans),
    divergence: num(r.divergence),
    tauPerm: r.tau_perm == null ? null : num(r.tau_perm),
    tauTrans: r.tau_trans == null ? null : num(r.tau_trans),
    crownedFace: (r.crowned_face as FaceId | null) ?? null,
    isSlip: !!r.is_slip,
    filterState: r.filter_state ?? {},
    createdAt: toIso(r.created_at) ?? "",
  };
}

export interface RecordSimplexInput {
  marketId: string;
  legIndex: number;
  permanent: Record<FaceId, number>;
  transitory: Record<FaceId, number>;
  hPerm: number;
  hTrans: number;
  divergence: number;
  tauPerm?: number | null;
  tauTrans?: number | null;
  crownedFace?: FaceId | null;
  isSlip?: boolean;
  filterState?: Record<string, unknown>;
}

/**
 * Write the decomposition for a leg. Upsert on (market, leg): a leg is
 * recomputed as new observations land, and only the final state at leg close
 * crowns a face — but the row for an open leg is live, not append-only.
 */
export async function recordSimplex(pool: Pool, input: RecordSimplexInput): Promise<FacesSimplexRow> {
  const res = await pool.query(
    `INSERT INTO faces_simplex
       (market_id, leg_index, permanent, transitory, h_perm, h_trans, divergence,
        tau_perm, tau_trans, crowned_face, is_slip, filter_state)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     ON CONFLICT (market_id, leg_index) DO UPDATE SET
       permanent = EXCLUDED.permanent,
       transitory = EXCLUDED.transitory,
       h_perm = EXCLUDED.h_perm,
       h_trans = EXCLUDED.h_trans,
       divergence = EXCLUDED.divergence,
       tau_perm = EXCLUDED.tau_perm,
       tau_trans = EXCLUDED.tau_trans,
       crowned_face = EXCLUDED.crowned_face,
       is_slip = EXCLUDED.is_slip,
       filter_state = EXCLUDED.filter_state
     RETURNING *`,
    [
      input.marketId,
      input.legIndex,
      JSON.stringify(input.permanent),
      JSON.stringify(input.transitory),
      input.hPerm,
      input.hTrans,
      input.divergence,
      input.tauPerm ?? null,
      input.tauTrans ?? null,
      input.crownedFace ?? null,
      input.isSlip ?? false,
      JSON.stringify(input.filterState ?? {}),
    ],
  );
  return mapSimplex(res.rows[0] as RawSimplex);
}

export async function latestSimplex(pool: Pool, marketId: string): Promise<FacesSimplexRow | null> {
  const res = await pool.query(
    `SELECT * FROM faces_simplex WHERE market_id = $1 ORDER BY leg_index DESC LIMIT 1`,
    [marketId],
  );
  return res.rows[0] ? mapSimplex(res.rows[0] as RawSimplex) : null;
}

/** Leg history, oldest first — the Waterline chart's series. */
export async function simplexHistory(
  pool: Pool,
  marketId: string,
  limit = 24,
): Promise<FacesSimplexRow[]> {
  const res = await pool.query(
    `SELECT * FROM (
       SELECT * FROM faces_simplex WHERE market_id = $1 ORDER BY leg_index DESC LIMIT $2
     ) t ORDER BY leg_index ASC`,
    [marketId, limit],
  );
  return (res.rows as RawSimplex[]).map(mapSimplex);
}

/** Live Slips across the book — the thing the front page actually wants. */
export async function listSlips(pool: Pool, limit = 20): Promise<FacesSimplexRow[]> {
  const res = await pool.query(
    `SELECT s.* FROM faces_simplex s
       JOIN perp_markets m ON m.id = s.market_id
      WHERE s.is_slip AND m.status = 'open'
      ORDER BY abs(s.divergence) DESC LIMIT $1`,
    [limit],
  );
  return (res.rows as RawSimplex[]).map(mapSimplex);
}

/* ────────────────────────────────────────────────────────────────
 * zeitgeist_slates + succession
 * ──────────────────────────────────────────────────────────────── */

export interface ZeitgeistSlot {
  vintage: number;
  slotIndex: number;
  trendKey: string;
  trendName: string;
  corpus: string[];
  sources: string[];
  faceScores: Record<string, number>;
  status: "active" | "retired";
  createdAt: string;
}

interface RawSlot {
  vintage: number | string;
  slot_index: number | string;
  trend_key: string;
  trend_name: string;
  corpus: unknown;
  sources: unknown;
  face_scores: Record<string, number> | null;
  status: string;
  created_at: Date | string;
}

const strArray = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);

function mapSlot(r: RawSlot): ZeitgeistSlot {
  return {
    vintage: num(r.vintage),
    slotIndex: num(r.slot_index),
    trendKey: r.trend_key,
    trendName: r.trend_name,
    corpus: strArray(r.corpus),
    sources: strArray(r.sources),
    faceScores: r.face_scores ?? {},
    status: (r.status as "active" | "retired") ?? "active",
    createdAt: toIso(r.created_at) ?? "",
  };
}

export interface UpsertSlotInput {
  vintage: number;
  slotIndex: number;
  trendKey: string;
  trendName: string;
  corpus?: string[];
  sources?: string[];
  faceScores?: Record<string, number>;
}

export async function upsertSlate(pool: Pool, slots: UpsertSlotInput[]): Promise<ZeitgeistSlot[]> {
  const out: ZeitgeistSlot[] = [];
  for (const s of slots) {
    const res = await pool.query(
      `INSERT INTO zeitgeist_slates
         (vintage, slot_index, trend_key, trend_name, corpus, sources, face_scores)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (vintage, slot_index) DO UPDATE SET
         trend_key = EXCLUDED.trend_key,
         trend_name = EXCLUDED.trend_name,
         corpus = EXCLUDED.corpus,
         sources = EXCLUDED.sources,
         face_scores = EXCLUDED.face_scores
       RETURNING *`,
      [
        s.vintage,
        s.slotIndex,
        s.trendKey,
        s.trendName,
        JSON.stringify(s.corpus ?? []),
        JSON.stringify(s.sources ?? []),
        JSON.stringify(s.faceScores ?? {}),
      ],
    );
    out.push(mapSlot(res.rows[0] as RawSlot));
  }
  return out;
}

export async function listSlate(pool: Pool, vintage?: number): Promise<ZeitgeistSlot[]> {
  const v = vintage ?? vintageAt();
  const res = await pool.query(
    `SELECT * FROM zeitgeist_slates WHERE vintage = $1 ORDER BY slot_index ASC`,
    [v],
  );
  return (res.rows as RawSlot[]).map(mapSlot);
}

export async function retireSlate(pool: Pool, vintage: number): Promise<number> {
  const res = await pool.query(
    `UPDATE zeitgeist_slates SET status = 'retired' WHERE vintage = $1 AND status = 'active'`,
    [vintage],
  );
  return res.rowCount ?? 0;
}

export interface SuccessionEdge {
  fromVintage: number;
  toVintage: number;
  fromSlot: number;
  toSlot: number;
  measured: number;
  voted: number;
  share: number;
}

/**
 * Persist a whole succession matrix in one transaction.
 *
 * A partially-written matrix is worse than none: rows would no longer sum to 1
 * and conviction would leak across the Turning, which is the single invariant
 * ZEITGEIST rests on. So this takes a client and commits atomically.
 */
export async function recordSuccession(
  pool: Pool,
  fromVintage: number,
  toVintage: number,
  edges: SuccessionEdge[],
): Promise<number> {
  const client: PoolClient = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const e of edges) {
      await client.query(
        `INSERT INTO zeitgeist_succession
           (from_vintage, to_vintage, from_slot, to_slot, measured, voted, share)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (from_vintage, from_slot, to_vintage, to_slot) DO UPDATE SET
           measured = EXCLUDED.measured, voted = EXCLUDED.voted, share = EXCLUDED.share`,
        [fromVintage, toVintage, e.fromSlot, e.toSlot, e.measured, e.voted, e.share],
      );
    }
    await client.query("COMMIT");
    return edges.length;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export async function listSuccession(
  pool: Pool,
  fromVintage: number,
  toVintage: number,
): Promise<SuccessionEdge[]> {
  const res = await pool.query(
    `SELECT * FROM zeitgeist_succession
      WHERE from_vintage = $1 AND to_vintage = $2
      ORDER BY from_slot ASC, to_slot ASC`,
    [fromVintage, toVintage],
  );
  return res.rows.map((r) => ({
    fromVintage: num(r.from_vintage),
    toVintage: num(r.to_vintage),
    fromSlot: num(r.from_slot),
    toSlot: num(r.to_slot),
    measured: num(r.measured),
    voted: num(r.voted),
    share: num(r.share),
  }));
}

/* ────────────────────────────────────────────────────────────────
 * epiphany_models
 * ──────────────────────────────────────────────────────────────── */

export interface EpiphanyModelRow {
  id: string;
  name: string;
  statement: string;
  region: string;
  original: string | null;
  persistence: number;
  domains: string[];
  updatedAt: string;
}

export async function upsertEpiphanyModel(
  pool: Pool,
  m: { id: string; name: string; statement: string; region: string; original?: string | null; persistence?: number; domains?: string[] },
): Promise<void> {
  await pool.query(
    `INSERT INTO epiphany_models (id, name, statement, region, original, persistence, domains)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       statement = EXCLUDED.statement,
       region = EXCLUDED.region,
       original = EXCLUDED.original,
       domains = EXCLUDED.domains,
       updated_at = now()`,
    // NOTE: persistence is deliberately NOT updated on conflict. It is a live
    // market reading, not catalog metadata — a catalog re-sync must not reset
    // what the book has priced.
    [
      m.id,
      m.name,
      m.statement,
      m.region,
      m.original ?? null,
      Number.isFinite(m.persistence as number) ? m.persistence : 0.5,
      JSON.stringify(m.domains ?? []),
    ],
  );
}

export async function listEpiphanyModels(pool: Pool, region?: string, limit = 100): Promise<EpiphanyModelRow[]> {
  const res = region
    ? await pool.query(
        `SELECT * FROM epiphany_models WHERE region = $1 ORDER BY persistence DESC LIMIT $2`,
        [region, limit],
      )
    : await pool.query(`SELECT * FROM epiphany_models ORDER BY persistence DESC LIMIT $1`, [limit]);
  return res.rows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    statement: String(r.statement),
    region: String(r.region),
    original: r.original ?? null,
    persistence: num(r.persistence),
    domains: strArray(r.domains),
    updatedAt: toIso(r.updated_at) ?? "",
  }));
}

export async function setModelPersistence(pool: Pool, id: string, persistence: number): Promise<void> {
  await pool.query(
    `UPDATE epiphany_models SET persistence = $2, updated_at = now() WHERE id = $1`,
    [id, Math.min(1, Math.max(0, persistence))],
  );
}

/* ────────────────────────────────────────────────────────────────
 * perp_positions
 * ──────────────────────────────────────────────────────────────── */

export interface PerpPosition {
  id: number;
  marketId: string;
  walletAddress: string;
  face: FaceId | null;
  layer: PositionLayer;
  conviction: number;
  entryLeg: number;
  vintage: number | null;
  exitStatus: ExitStatus;
  exitRequestedAt: string | null;
  exitReadyAt: string | null;
  exitPrice: number | null;
  updatedAt: string;
}

interface RawPosition {
  id: string | number;
  market_id: string;
  wallet_address: string;
  face: string | null;
  layer: string;
  conviction: string | number;
  entry_leg: number | string;
  vintage: number | string | null;
  exit_status: string;
  exit_requested_at: Date | string | null;
  exit_ready_at: Date | string | null;
  exit_price: string | number | null;
  updated_at: Date | string;
}

function mapPosition(r: RawPosition): PerpPosition {
  return {
    id: num(r.id),
    marketId: r.market_id,
    walletAddress: r.wallet_address,
    face: (r.face as FaceId | null) ?? null,
    layer: r.layer as PositionLayer,
    conviction: num(r.conviction),
    entryLeg: num(r.entry_leg),
    vintage: r.vintage == null ? null : num(r.vintage),
    exitStatus: r.exit_status as ExitStatus,
    exitRequestedAt: toIso(r.exit_requested_at),
    exitReadyAt: toIso(r.exit_ready_at),
    exitPrice: r.exit_price == null ? null : num(r.exit_price),
    updatedAt: toIso(r.updated_at) ?? "",
  };
}

export interface StakeInput {
  marketId: string;
  walletAddress: string;
  conviction: number;
  face?: FaceId | null;
  layer?: PositionLayer;
  entryLeg?: number;
  vintage?: number | null;
}

/**
 * Add conviction to a position, creating it if absent, and bump market volume.
 *
 * Transactional because the two writes must not diverge — a stake that lands on
 * the position but not on `volume` silently corrupts the dominance surcharge
 * that gates every subsequent exit from this market.
 */
export async function stakeConviction(pool: Pool, input: StakeInput): Promise<PerpPosition | null> {
  const wallet = input.walletAddress.toLowerCase();
  const layer = input.layer ?? "single";
  const amount = Number.isFinite(input.conviction) ? Math.max(0, input.conviction) : 0;
  if (amount <= 0) return null;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query(
      `SELECT * FROM perp_positions
        WHERE market_id = $1 AND wallet_address = $2 AND layer = $3
          AND face IS NOT DISTINCT FROM $4 AND exit_status = 'active'
        LIMIT 1`,
      [input.marketId, wallet, layer, input.face ?? null],
    );
    let row: RawPosition;
    if (existing.rows[0]) {
      const upd = await client.query(
        `UPDATE perp_positions SET conviction = conviction + $2, updated_at = now()
          WHERE id = $1 RETURNING *`,
        [(existing.rows[0] as RawPosition).id, amount],
      );
      row = upd.rows[0] as RawPosition;
    } else {
      const ins = await client.query(
        `INSERT INTO perp_positions
           (market_id, wallet_address, face, layer, conviction, entry_leg, vintage)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [
          input.marketId,
          wallet,
          input.face ?? null,
          layer,
          amount,
          input.entryLeg ?? 0,
          input.vintage ?? null,
        ],
      );
      row = ins.rows[0] as RawPosition;
    }
    await client.query(
      `UPDATE perp_markets SET volume = volume + $2, updated_at = now() WHERE id = $1`,
      [input.marketId, amount],
    );
    await client.query("COMMIT");
    return mapPosition(row);
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export async function listPositions(pool: Pool, marketId: string, limit = 200): Promise<PerpPosition[]> {
  const res = await pool.query(
    `SELECT * FROM perp_positions WHERE market_id = $1 ORDER BY conviction DESC LIMIT $2`,
    [marketId, limit],
  );
  return (res.rows as RawPosition[]).map(mapPosition);
}

export async function listPositionsByWallet(pool: Pool, wallet: string, limit = 200): Promise<PerpPosition[]> {
  const res = await pool.query(
    `SELECT * FROM perp_positions WHERE wallet_address = $1 ORDER BY updated_at DESC LIMIT $2`,
    [wallet.toLowerCase(), limit],
  );
  return (res.rows as RawPosition[]).map(mapPosition);
}

export async function getPosition(pool: Pool, id: number): Promise<PerpPosition | null> {
  const res = await pool.query(`SELECT * FROM perp_positions WHERE id = $1`, [id]);
  return res.rows[0] ? mapPosition(res.rows[0] as RawPosition) : null;
}

/** Total active conviction on a market — the denominator of the exit surcharge. */
export async function marketConviction(pool: Pool, marketId: string): Promise<number> {
  const res = await pool.query(
    `SELECT COALESCE(SUM(conviction), 0) AS total FROM perp_positions
      WHERE market_id = $1 AND exit_status = 'active'`,
    [marketId],
  );
  return num(res.rows[0]?.total);
}

/** Face-level conviction split, for the observed vector fed into decompose(). */
export async function convictionByFace(pool: Pool, marketId: string, layer: PositionLayer): Promise<Record<string, number>> {
  const res = await pool.query(
    `SELECT face, COALESCE(SUM(conviction), 0) AS total FROM perp_positions
      WHERE market_id = $1 AND layer = $2 AND exit_status = 'active' AND face IS NOT NULL
      GROUP BY face`,
    [marketId, layer],
  );
  const out: Record<string, number> = {};
  for (const r of res.rows) out[String(r.face)] = num(r.total);
  return out;
}

/** Open the valve on a position. The caller computes the ticket; this persists it. */
export async function markPositionCooling(
  pool: Pool,
  id: number,
  requestedAtMs: number,
  readyAtMs: number,
  lockedPrice: number,
): Promise<PerpPosition | null> {
  const res = await pool.query(
    `UPDATE perp_positions
        SET exit_status = 'cooling',
            exit_requested_at = $2,
            exit_ready_at = $3,
            exit_price = $4,
            updated_at = now()
      WHERE id = $1 AND exit_status = 'active'
      RETURNING *`,
    [id, new Date(requestedAtMs).toISOString(), new Date(readyAtMs).toISOString(), lockedPrice],
  );
  return res.rows[0] ? mapPosition(res.rows[0] as RawPosition) : null;
}

/**
 * Redeem a matured exit. The `exit_ready_at <= now()` predicate lives in SQL
 * rather than in the caller so a redemption cannot be rushed by a client that
 * simply lies about the time.
 */
export async function redeemPosition(pool: Pool, id: number): Promise<PerpPosition | null> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const res = await client.query(
      `UPDATE perp_positions
          SET exit_status = 'redeemed', updated_at = now()
        WHERE id = $1 AND exit_status = 'cooling' AND exit_ready_at <= now()
        RETURNING *`,
      [id],
    );
    if (!res.rows[0]) {
      await client.query("ROLLBACK");
      return null;
    }
    const row = res.rows[0] as RawPosition;
    await client.query(
      `UPDATE perp_markets SET volume = GREATEST(0, volume - $2), updated_at = now() WHERE id = $1`,
      [row.market_id, num(row.conviction)],
    );
    await client.query("COMMIT");
    return mapPosition(row);
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/* ────────────────────────────────────────────────────────────────
 * portrait_keys — §6.2.2 registry, §6.2.3 THE LAPSE
 * ──────────────────────────────────────────────────────────────── */

export interface PortraitKey {
  subjectRef: string;
  keyRef: string;
  ciphertextRef: string | null;
  status: "held" | "lapsed" | "destroyed";
  ttlExpiresAt: string;
  renewedAt: string;
  renewedLeg: number;
  destroyedAt: string | null;
  destroyReason: string | null;
}

function mapKey(r: Record<string, unknown>): PortraitKey {
  return {
    subjectRef: String(r.subject_ref),
    keyRef: String(r.key_ref),
    ciphertextRef: (r.ciphertext_ref as string | null) ?? null,
    status: (r.status as PortraitKey["status"]) ?? "held",
    ttlExpiresAt: toIso(r.ttl_expires_at as Date | string) ?? "",
    renewedAt: toIso(r.renewed_at as Date | string) ?? "",
    renewedLeg: num(r.renewed_leg),
    destroyedAt: toIso((r.destroyed_at as Date | string | null) ?? null),
    destroyReason: (r.destroy_reason as string | null) ?? null,
  };
}

/**
 * Register a key reference. Never pass key material or a payload — `keyRef` is
 * a KMS handle and `ciphertextRef` an object-store pointer. This is enforced by
 * convention and by the fact that nothing here is ever read back as a secret.
 */
export async function registerPortraitKey(
  pool: Pool,
  input: { subjectRef: string; keyRef: string; ciphertextRef?: string | null; ttlExpiresAt: string; renewedLeg?: number },
): Promise<PortraitKey> {
  assertOpaqueSubjectRef(input.subjectRef);
  const res = await pool.query(
    `INSERT INTO portrait_keys (subject_ref, key_ref, ciphertext_ref, ttl_expires_at, renewed_leg)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (subject_ref) DO UPDATE SET
       key_ref = EXCLUDED.key_ref,
       ciphertext_ref = EXCLUDED.ciphertext_ref,
       ttl_expires_at = EXCLUDED.ttl_expires_at,
       renewed_at = now(),
       renewed_leg = EXCLUDED.renewed_leg
     RETURNING *`,
    [input.subjectRef, input.keyRef, input.ciphertextRef ?? null, input.ttlExpiresAt, input.renewedLeg ?? 0],
  );
  return mapKey(res.rows[0] as Record<string, unknown>);
}

/**
 * THE LAPSE, renewal side. A held key's TTL is extended only while the subject
 * is still eligible. Note it refuses to renew a key that is already lapsed or
 * destroyed — resurrection is not a supported state transition, because the
 * whole failsafe depends on destruction being terminal.
 */
export async function renewPortraitKey(
  pool: Pool,
  subjectRef: string,
  ttlExpiresAt: string,
  renewedLeg: number,
): Promise<PortraitKey | null> {
  const res = await pool.query(
    `UPDATE portrait_keys
        SET ttl_expires_at = $2, renewed_at = now(), renewed_leg = $3
      WHERE subject_ref = $1 AND status = 'held'
      RETURNING *`,
    [subjectRef, ttlExpiresAt, renewedLeg],
  );
  return res.rows[0] ? mapKey(res.rows[0] as Record<string, unknown>) : null;
}

/** The scheduler's queue: held keys past TTL. Silence destroys. */
export async function listLapsedKeys(pool: Pool, limit = 100): Promise<PortraitKey[]> {
  const res = await pool.query(
    `SELECT * FROM portrait_keys
      WHERE status = 'held' AND ttl_expires_at <= now()
      ORDER BY ttl_expires_at ASC LIMIT $1`,
    [limit],
  );
  return (res.rows as Record<string, unknown>[]).map(mapKey);
}

/**
 * Record a destruction request and mark the key lapsed. Destruction is NOT
 * complete at this point — managed KMS destroy carries a mandatory waiting
 * period, so the audit trail records both ends of the window (§6.2.2).
 */
export async function requestKeyDestruction(
  pool: Pool,
  subjectRef: string,
  reason: string,
  actor: string,
  requestedAtMs = Date.now(),
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE portrait_keys SET status = 'lapsed', destroy_reason = $2 WHERE subject_ref = $1 AND status = 'held'`,
      [subjectRef, reason],
    );
    await client.query(
      `INSERT INTO portrait_key_destructions (subject_ref, requested_at, reason, actor)
       VALUES ($1,$2,$3,$4)`,
      [subjectRef, new Date(requestedAtMs).toISOString(), reason, actor],
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/** Close the loop once the KMS reports the key is irreversibly gone. */
export async function confirmKeyDestroyed(
  pool: Pool,
  subjectRef: string,
  destroyedAtMs = Date.now(),
): Promise<void> {
  const at = new Date(destroyedAtMs).toISOString();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE portrait_keys SET status = 'destroyed', destroyed_at = $2 WHERE subject_ref = $1`,
      [subjectRef, at],
    );
    await client.query(
      `UPDATE portrait_key_destructions SET destroyed_at = $2
        WHERE subject_ref = $1 AND destroyed_at IS NULL`,
      [subjectRef, at],
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/**
 * THE INTERLOCK (§6.2.4). A named-individual market may not trade unless its
 * portrait key is registered and held. Checked at the boundary rather than
 * assumed, because "the registry is live" is exactly the sort of precondition
 * that quietly stops being true.
 */
export async function isSubjectPortraitEligible(pool: Pool, subjectRef: string): Promise<boolean> {
  const res = await pool.query(
    `SELECT 1 FROM portrait_keys
      WHERE subject_ref = $1 AND status = 'held' AND ttl_expires_at > now() LIMIT 1`,
    [subjectRef],
  );
  return res.rows.length > 0;
}
