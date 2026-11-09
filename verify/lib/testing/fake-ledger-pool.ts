/**
 * An in-memory stand-in for `pg.Pool`, for tests of code that moves $MADx.
 *
 * WHY THIS EXISTS. The money paths in this app — `market-book.fill()`, the perp
 * conviction debit, the Shield premium, the slot-auction deposit — each run as one
 * SQL transaction, and CI has no database (`ci.yml` says so on its db-smoke step).
 * `lib/perp-store.test.ts` states the consequence plainly: "the transactional half
 * needs a live Pool and cannot run here", and splits the pure arithmetic out so at
 * least that is tested. That leaves the thing a ledger bug lives in — the ORDER of
 * the statements, and whether a failure half-way rolls everything back — unreached.
 *
 * This fake reaches it. It keeps the rows of `madx_accounts`, `madx_ledger`,
 * `slot_auctions` and `slot_bids` in memory, and gives `BEGIN` / `COMMIT` /
 * `ROLLBACK` real meaning: `BEGIN` snapshots the state, `ROLLBACK` restores it. A
 * test can therefore make a statement fail in the middle of a transaction and
 * assert that NOTHING moved.
 *
 * WHAT IT IS NOT. It is not Postgres. It recognises exactly the statements the
 * code under test emits, matched by shape (whitespace-normalised), and THROWS on
 * any other — so a change to the SQL fails loudly here and forces this file to be
 * updated, rather than the test passing over a query it never understood. It does
 * not check that the SQL is valid Postgres, that a column exists, or that an index
 * is used; a typo in a column name passes here and fails on the first real
 * database. It proves the ledger LOGIC, not the SQL. Say so in any PR that leans
 * on it.
 *
 * Numeric columns are returned as STRINGS, the way `pg` returns `NUMERIC`, so a
 * missing `Number()` in the code under test shows up here instead of in production.
 */
import type { Pool } from "pg";

export interface LedgerRow {
  owner: string;
  counterparty: string | null;
  kind: string;
  amount: number;
  note: string | null;
}

export interface AuctionRow {
  id: number;
  vintage: number;
  slots: number;
  reserve_price: number;
  closes_at: Date;
  clearing_price: number | null;
  cleared_at: Date | null;
}

export interface BidRowState {
  id: number;
  auction_id: number;
  bidder: string;
  trend_key: string;
  commitment: string;
  deposit: number;
  committed_at: Date;
  revealed_amount: number | null;
  revealed_salt: string | null;
  revealed_at: Date | null;
  status: string;
}

export interface FakeState {
  accounts: Map<string, number>;
  ledger: LedgerRow[];
  auctions: AuctionRow[];
  bids: BidRowState[];
  nextBidId: number;
}

export interface FakeLedgerPool {
  pool: Pool;
  state: FakeState;
  /** Statements seen, in order, normalised — for asserting ordering. */
  log: string[];
  /** The same statements with their bound parameters — for asserting what a query was scoped by. */
  calls: Array<{ sql: string; params: unknown[] }>;
  /** Make the next statement matching `when` throw, once, to test rollback. */
  failOnce(when: (sql: string, params: unknown[]) => boolean): void;
  /** Clients checked out and not yet released. A leak here is a leak in production. */
  openClients(): number;
}

const norm = (sql: string) => sql.replace(/\s+/g, " ").trim();

function fresh(): FakeState {
  return { accounts: new Map(), ledger: [], auctions: [], bids: [], nextBidId: 1 };
}

function clone(s: FakeState): FakeState {
  return {
    accounts: new Map(s.accounts),
    ledger: s.ledger.map((l) => ({ ...l })),
    auctions: s.auctions.map((a) => ({ ...a })),
    bids: s.bids.map((b) => ({ ...b })),
    nextBidId: s.nextBidId,
  };
}

export function createFakeLedgerPool(): FakeLedgerPool {
  let state = fresh();
  let snapshot: FakeState | null = null;
  const log: string[] = [];
  const calls: Array<{ sql: string; params: unknown[] }> = [];
  let open = 0;
  let failure: ((sql: string, params: unknown[]) => boolean) | null = null;

  function exec(rawSql: string, params: unknown[] = []): { rows: unknown[]; rowCount: number } {
    const sql = norm(rawSql);
    log.push(sql);
    calls.push({ sql, params: [...params] });
    if (failure && failure(sql, params)) {
      failure = null;
      throw new Error(`fake pg: injected failure on: ${sql}`);
    }

    if (sql === "BEGIN") {
      snapshot = clone(state);
      return { rows: [], rowCount: 0 };
    }
    if (sql === "COMMIT") {
      snapshot = null;
      return { rows: [], rowCount: 0 };
    }
    if (sql === "ROLLBACK") {
      if (snapshot) state = snapshot;
      snapshot = null;
      return { rows: [], rowCount: 0 };
    }

    // ── slot_auctions ──────────────────────────────────────────────────────
    if (sql === "SELECT id, cleared_at FROM slot_auctions WHERE vintage = $1 FOR SHARE") {
      const a = state.auctions.find((x) => x.vintage === Number(params[0]));
      return a ? { rows: [{ id: a.id, cleared_at: a.cleared_at }], rowCount: 1 } : { rows: [], rowCount: 0 };
    }
    if (
      sql ===
      "SELECT * FROM slot_auctions WHERE cleared_at IS NULL AND closes_at <= $1 ORDER BY closes_at, id LIMIT 1 FOR UPDATE"
    ) {
      const now = (params[0] as Date).getTime();
      const due = state.auctions
        .filter((x) => x.cleared_at === null && x.closes_at.getTime() <= now)
        .sort((a, b) => a.closes_at.getTime() - b.closes_at.getTime() || a.id - b.id)[0];
      return due
        ? { rows: [{ ...due, slots: String(due.slots), reserve_price: String(due.reserve_price) }], rowCount: 1 }
        : { rows: [], rowCount: 0 };
    }
    if (sql === "SELECT * FROM slot_auctions WHERE vintage = $1 FOR UPDATE") {
      const a = state.auctions.find((x) => x.vintage === Number(params[0]));
      return a
        ? { rows: [{ ...a, slots: String(a.slots), reserve_price: String(a.reserve_price) }], rowCount: 1 }
        : { rows: [], rowCount: 0 };
    }
    if (sql === "UPDATE slot_auctions SET clearing_price = $2, cleared_at = now() WHERE id = $1") {
      const a = state.auctions.find((x) => x.id === Number(params[0]));
      if (!a) return { rows: [], rowCount: 0 };
      a.clearing_price = Number(params[1]);
      a.cleared_at = new Date();
      return { rows: [], rowCount: 1 };
    }

    // ── slot_bids ──────────────────────────────────────────────────────────
    if (
      sql ===
      "INSERT INTO slot_bids (auction_id, bidder, trend_key, commitment, deposit) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (auction_id, commitment) DO NOTHING RETURNING id"
    ) {
      const [auctionId, bidder, trendKey, commitment, deposit] = params as [number, string, string, string, number];
      if (state.bids.some((b) => b.auction_id === auctionId && b.commitment === commitment)) {
        return { rows: [], rowCount: 0 };
      }
      const id = state.nextBidId++;
      state.bids.push({
        id,
        auction_id: auctionId,
        bidder,
        trend_key: trendKey,
        commitment,
        deposit: Number(deposit),
        committed_at: new Date(),
        revealed_amount: null,
        revealed_salt: null,
        revealed_at: null,
        status: "sealed",
      });
      return { rows: [{ id }], rowCount: 1 };
    }
    if (sql === "SELECT * FROM slot_bids WHERE auction_id = $1 ORDER BY id FOR UPDATE") {
      const rows = state.bids
        .filter((b) => b.auction_id === Number(params[0]))
        .sort((a, b) => a.id - b.id)
        .map((b) => ({
          ...b,
          deposit: String(b.deposit),
          revealed_amount: b.revealed_amount == null ? null : String(b.revealed_amount),
        }));
      return { rows, rowCount: rows.length };
    }
    if (sql === "UPDATE slot_bids SET status = $2 WHERE id = $1") {
      const b = state.bids.find((x) => x.id === Number(params[0]));
      if (!b) return { rows: [], rowCount: 0 };
      b.status = String(params[1]);
      return { rows: [], rowCount: 1 };
    }

    // ── madx_accounts / madx_ledger ────────────────────────────────────────
    if (
      sql ===
      "UPDATE madx_accounts SET balance = balance - $2, updated_at = now() WHERE owner = $1 AND balance >= $2 RETURNING owner"
    ) {
      const owner = String(params[0]);
      const amt = Number(params[1]);
      const bal = state.accounts.get(owner);
      if (bal === undefined || bal < amt) return { rows: [], rowCount: 0 };
      state.accounts.set(owner, Math.round((bal - amt) * 1e6) / 1e6);
      return { rows: [{ owner }], rowCount: 1 };
    }
    if (sql === "INSERT INTO madx_accounts (owner) VALUES ($1) ON CONFLICT (owner) DO NOTHING") {
      const owner = String(params[0]);
      if (!state.accounts.has(owner)) state.accounts.set(owner, 0);
      return { rows: [], rowCount: 1 };
    }
    if (sql === "UPDATE madx_accounts SET balance = balance + $2, updated_at = now() WHERE owner = $1") {
      const owner = String(params[0]);
      const bal = state.accounts.get(owner);
      if (bal === undefined) return { rows: [], rowCount: 0 };
      state.accounts.set(owner, Math.round((bal + Number(params[1])) * 1e6) / 1e6);
      return { rows: [], rowCount: 1 };
    }
    if (sql === "INSERT INTO madx_ledger (owner, counterparty, kind, amount, note) VALUES ($1, $2, $3, $4, $5)") {
      const [owner, counterparty, kind, amount, note] = params as [string, string | null, string, number, string | null];
      state.ledger.push({ owner, counterparty, kind, amount: Number(amount), note });
      return { rows: [], rowCount: 1 };
    }
    if (
      sql ===
      "SELECT kind, note, amount FROM madx_ledger WHERE owner = ANY($1::text[]) AND kind IN ('spend','refund') AND note = ANY($2::text[])"
    ) {
      const owners = new Set(params[0] as string[]);
      const notes = new Set(params[1] as string[]);
      const rows = state.ledger
        .filter(
          (l) =>
            owners.has(l.owner) && (l.kind === "spend" || l.kind === "refund") && l.note != null && notes.has(l.note),
        )
        .map((l) => ({ kind: l.kind, note: l.note, amount: String(l.amount) }));
      return { rows, rowCount: rows.length };
    }

    throw new Error(`fake pg: unhandled SQL — teach lib/testing/fake-ledger-pool.ts about it: ${sql}`);
  }

  const pool = {
    async connect() {
      open += 1;
      let released = false;
      return {
        async query(sql: string, params?: unknown[]) {
          return exec(sql, params);
        },
        release() {
          if (!released) {
            released = true;
            open -= 1;
          }
        },
      };
    },
  } as unknown as Pool;

  return {
    pool,
    get state() {
      return state;
    },
    log,
    calls,
    failOnce(when) {
      failure = when;
    },
    openClients: () => open,
  };
}
