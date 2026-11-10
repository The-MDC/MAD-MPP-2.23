import { randomBytes } from "node:crypto";
import { Pool } from "pg";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { commitmentHash } from "./slot-auction";
import { clearAndSettle, commitSealedBid, depositFor, depositNote } from "./slot-auction-store";

/**
 * The slot auction's money path against REAL Postgres.
 *
 * `slot-auction-store.test.ts` runs the same logic against an in-memory pool. That pool proves the
 * ledger arithmetic and the order of statements, but it is not Postgres: it has no row locks, no
 * unique-index conflicts between concurrent transactions, and it would accept a column typo. Every
 * claim the code makes about concurrency — "insert-then-debit lets the unique index serialise a
 * replay", "a clear takes the auction row FOR UPDATE so a commit cannot slip in behind it", "a second
 * clear waits, then sees cleared_at" — was therefore untested. This file tests them.
 *
 * It runs only where a database is provided (`DATABASE_URL_TEST`) — in CI that is the `Database`
 * workflow's Postgres service — and is SKIPPED everywhere else, so `npx vitest run` stays hermetic.
 * Everything it creates uses random addresses and far-future vintages and is deleted afterwards.
 *
 * THIS FILE MUST STAY UNDER `lib/` — vitest's `include` is `lib/**\/*.test.ts`.
 */
const DB_URL = process.env.DATABASE_URL_TEST;

const DAY = 86_400_000;

describe.skipIf(!DB_URL)("slot auction money path — real Postgres", () => {
  let pool: Pool;
  const auctionIds: string[] = [];
  const owners = new Set<string>();

  beforeAll(async () => {
    pool = new Pool({ connectionString: DB_URL, max: 8 });
    // Fail with an instruction, not a stack trace, if the schema is not there.
    const t = await pool.query(
      `SELECT count(*)::int AS n FROM pg_tables WHERE schemaname = 'public' AND tablename = ANY($1::text[])`,
      [["slot_auctions", "slot_bids", "madx_accounts", "madx_ledger"]],
    );
    if (t.rows[0].n !== 4) throw new Error("migrations 0008 and 0014 are not applied to DATABASE_URL_TEST — run `node scripts/migrate.mjs` first");
  });

  afterEach(async () => {
    if (auctionIds.length) {
      await pool.query(`DELETE FROM slot_bids WHERE auction_id = ANY($1::bigint[])`, [auctionIds]);
      await pool.query(`DELETE FROM slot_auctions WHERE id = ANY($1::bigint[])`, [auctionIds]);
      auctionIds.length = 0;
    }
    if (owners.size) {
      const list = [...owners];
      await pool.query(`DELETE FROM madx_ledger WHERE owner = ANY($1::text[])`, [list]);
      await pool.query(`DELETE FROM madx_accounts WHERE owner = ANY($1::text[])`, [list]);
      owners.clear();
    }
  });

  afterAll(async () => {
    await pool?.end();
  });

  /* ───────────── helpers ───────────── */

  const addr = () => `0x${randomBytes(20).toString("hex")}`;
  let nextVintage = 1_000_000 + Math.floor(Math.random() * 500_000);

  /** A closed auction (reveal ended) — `agoMs` before now it closed. Far-future vintage, unique per call. */
  async function auction(opts: { agoMs?: number; slots?: number; closesAtOverride?: string } = {}) {
    const vintage = nextVintage++;
    const ago = opts.agoMs ?? 60 * 60 * 1000;
    const res = await pool.query(
      `INSERT INTO slot_auctions (vintage, slots, start_price, reserve_price, opens_at, commit_opens_at, reveal_opens_at, closes_at)
       VALUES ($1, $2, 25000, 100,
               now() - ($3::bigint * interval '1 millisecond') - interval '3 days',
               now() - ($3::bigint * interval '1 millisecond') - interval '2 days',
               now() - ($3::bigint * interval '1 millisecond') - interval '1 day',
               ${opts.closesAtOverride ? "$4::timestamptz" : "now() - ($3::bigint * interval '1 millisecond')"})
       RETURNING id`,
      opts.closesAtOverride ? [vintage, opts.slots ?? 2, ago, opts.closesAtOverride] : [vintage, opts.slots ?? 2, ago],
    );
    const id = String(res.rows[0].id);
    auctionIds.push(id);
    return { id, vintage };
  }

  async function fund(owner: string, amount: number) {
    owners.add(owner);
    await pool.query(`INSERT INTO madx_accounts (owner, balance) VALUES ($1, $2) ON CONFLICT (owner) DO UPDATE SET balance = $2`, [owner, amount]);
  }

  async function balance(owner: string): Promise<number> {
    const r = await pool.query(`SELECT balance FROM madx_accounts WHERE owner = $1`, [owner]);
    return Number(r.rows[0]?.balance ?? 0);
  }

  async function commit(vintage: number, bidder: string, trendKey: string, amount: number, salt: string) {
    owners.add(bidder);
    const commitment = commitmentHash(bidder, trendKey, amount, salt);
    const out = await commitSealedBid(pool, { vintage, bidder, trendKey, commitment, deposit: depositFor(amount) });
    return { commitment, out };
  }

  /** What the route's reveal action does: a plain UPDATE, no money. */
  async function reveal(auctionId: string, commitment: string, amount: number, salt: string) {
    const r = await pool.query(
      `UPDATE slot_bids SET revealed_amount = $3, revealed_salt = $4, revealed_at = clock_timestamp(), status = 'revealed'
        WHERE auction_id = $1 AND commitment = $2 AND status = 'sealed' RETURNING id`,
      [auctionId, commitment, amount, salt],
    );
    expect(r.rowCount).toBe(1);
  }

  const status = async (commitment: string) => (await pool.query(`SELECT status FROM slot_bids WHERE commitment = $1`, [commitment])).rows[0]?.status as string | undefined;
  const ledger = async (owner: string, kind: string) => (await pool.query(`SELECT amount, note FROM madx_ledger WHERE owner = $1 AND kind = $2 ORDER BY id`, [owner, kind])).rows;
  const sum = async (list: string[]) => (await Promise.all(list.map(balance))).reduce((s, n) => s + n, 0);

  /* ───────────── commit ───────────── */

  it("commit debits the deposit and writes the ledger row that names the bid", async () => {
    const a = await auction();
    const bidder = addr();
    await fund(bidder, 1000);

    const { commitment, out } = await commit(a.vintage, bidder, "x", 1000, "s");

    expect(out).toEqual({ charged: true });
    expect(await balance(bidder)).toBe(900);
    const spends = await ledger(bidder, "spend");
    expect(spends).toHaveLength(1);
    expect(spends[0].note).toBe(depositNote(a.id, commitment));
    expect(Number(spends[0].amount)).toBe(100);
  });

  it("a short wallet is refused and NOTHING is written (the insert rolls back with the failed debit)", async () => {
    const a = await auction();
    const bidder = addr();
    await fund(bidder, 99.99);

    const { commitment, out } = await commit(a.vintage, bidder, "x", 1000, "s");

    expect(out).toBe("insufficient-balance");
    expect(await balance(bidder)).toBe(99.99);
    expect(await status(commitment)).toBeUndefined();
    expect(await ledger(bidder, "spend")).toHaveLength(0);
  });

  it("a replayed commitment is charged once", async () => {
    const a = await auction();
    const bidder = addr();
    await fund(bidder, 1000);
    await commit(a.vintage, bidder, "x", 1000, "s");
    const again = await commit(a.vintage, bidder, "x", 1000, "s");
    expect(again.out).toEqual({ charged: false });
    expect(await balance(bidder)).toBe(900);
    expect(await ledger(bidder, "spend")).toHaveLength(1);
  });

  it("CONCURRENT identical commits are charged once — the unique index serialises them", async () => {
    const a = await auction();
    const bidder = addr();
    await fund(bidder, 1000);
    const commitment = commitmentHash(bidder, "x", 1000, "s");
    owners.add(bidder);

    const results = await Promise.all(
      Array.from({ length: 5 }, () => commitSealedBid(pool, { vintage: a.vintage, bidder, trendKey: "x", commitment, deposit: depositFor(1000) })),
    );

    const charged = results.filter((r) => typeof r === "object" && r.charged).length;
    expect(charged).toBe(1);
    expect(results.filter((r) => typeof r === "object" && !r.charged)).toHaveLength(4);
    expect(await balance(bidder)).toBe(900);
    expect(await ledger(bidder, "spend")).toHaveLength(1);
  });

  it("CONCURRENT commits from one wallet cannot overdraw it", async () => {
    const a = await auction();
    const bidder = addr();
    await fund(bidder, 250); // enough for two 100-deposits, not three
    owners.add(bidder);

    const outs = await Promise.all(
      ["a", "b", "c", "d"].map((salt) => commit(a.vintage, bidder, "x", 1000, salt).then((r) => r.out)),
    );

    expect(outs.filter((o) => typeof o === "object" && o.charged)).toHaveLength(2);
    expect(outs.filter((o) => o === "insufficient-balance")).toHaveLength(2);
    expect(await balance(bidder)).toBe(50);
  });

  /* ───────────── clear: the three terminal states, conserved ───────────── */

  it("clear settles won / refunded / forfeited and conserves every credit", async () => {
    const a = await auction({ slots: 2 });
    const [A, B, C, D] = [addr(), addr(), addr(), addr()];
    for (const o of [A, B, C, D]) await fund(o, 10_000);
    const bidsIn = await Promise.all([
      commit(a.vintage, A, "x", 1000, "a"),
      commit(a.vintage, B, "y", 900, "b"),
      commit(a.vintage, C, "z", 500, "c"),
      commit(a.vintage, D, "w", 2000, "d"),
    ]);
    await reveal(a.id, bidsIn[0].commitment, 1000, "a");
    await reveal(a.id, bidsIn[1].commitment, 900, "b");
    await reveal(a.id, bidsIn[2].commitment, 500, "c");
    // D never reveals.
    expect(await sum([A, B, C, D])).toBe(40_000 - (100 + 90 + 50 + 200));

    const out = await clearAndSettle(pool, { vintage: a.vintage, currentVintage: a.vintage }, Date.now());

    if ("refused" in out) throw new Error(`expected a clear, got ${JSON.stringify(out)}`);
    expect(out.settlement).toMatchObject({ won: 2, refunded: 1, forfeited: 1, undebited: 0 });
    expect(out.result.clearingPrice).toBe(900);
    expect(await status(bidsIn[0].commitment)).toBe("won");
    expect(await status(bidsIn[2].commitment)).toBe("refunded");
    expect(await status(bidsIn[3].commitment)).toBe("forfeited");
    // A, B and C are whole again; D forfeited exactly its deposit.
    expect(await balance(A)).toBe(10_000);
    expect(await balance(B)).toBe(10_000);
    expect(await balance(C)).toBe(10_000);
    expect(await balance(D)).toBe(10_000 - 200);
    expect(await sum([A, B, C, D])).toBe(40_000 - 200);
    expect(await ledger(D, "refund")).toHaveLength(0);
    expect((await ledger(C, "refund"))[0].note).toContain(a.id);
  });

  it("clearing twice refunds nobody twice", async () => {
    const a = await auction();
    const bidder = addr();
    await fund(bidder, 1000);
    const { commitment } = await commit(a.vintage, bidder, "x", 1000, "s");
    await reveal(a.id, commitment, 1000, "s");

    const first = await clearAndSettle(pool, { vintage: a.vintage, currentVintage: a.vintage }, Date.now());
    const second = await clearAndSettle(pool, { vintage: a.vintage, currentVintage: a.vintage }, Date.now());

    expect("refused" in first).toBe(false);
    expect(second).toEqual({ refused: "already-cleared" });
    expect(await balance(bidder)).toBe(1000);
    expect(await ledger(bidder, "refund")).toHaveLength(1);
  });

  it("CONCURRENT clears settle the auction exactly once — the second waits on FOR UPDATE, then sees cleared_at", async () => {
    const a = await auction();
    const bidder = addr();
    await fund(bidder, 1000);
    const { commitment } = await commit(a.vintage, bidder, "x", 1000, "s");
    await reveal(a.id, commitment, 1000, "s");

    const outs = await Promise.all(
      Array.from({ length: 4 }, () => clearAndSettle(pool, { vintage: a.vintage, currentVintage: a.vintage }, Date.now())),
    );

    const settled = outs.filter((o) => !("refused" in o));
    expect(settled).toHaveLength(1);
    expect(outs.filter((o) => "refused" in o && o.refused === "already-cleared")).toHaveLength(3);
    expect(await balance(bidder)).toBe(1000);
    expect(await ledger(bidder, "refund")).toHaveLength(1);
  });

  it("an auction that has not closed is refused, and moves nothing", async () => {
    const a = await auction({ agoMs: -2 * DAY }); // closes two days from now
    const bidder = addr();
    await fund(bidder, 1000);
    await commit(a.vintage, bidder, "x", 1000, "s");

    const out = await clearAndSettle(pool, { vintage: a.vintage, currentVintage: a.vintage }, Date.now());

    expect(out).toMatchObject({ refused: "still-open" });
    expect(await balance(bidder)).toBe(900);
  });

  /* ───────────── commit vs clear ───────────── */

  it("a commit after settlement is refused and charges nothing", async () => {
    const a = await auction();
    await clearAndSettle(pool, { vintage: a.vintage, currentVintage: a.vintage }, Date.now());
    const late = addr();
    await fund(late, 500);

    const { commitment, out } = await commit(a.vintage, late, "q", 500, "late");

    expect(out).toBe("auction-cleared");
    expect(await balance(late)).toBe(500);
    expect(await status(commitment)).toBeUndefined();
  });

  it("RACE: a commit and a clear started together never strand a deposit (FOR SHARE vs FOR UPDATE)", async () => {
    // Either the commit lands first and the clear settles it (forfeited — it was never revealed), or the
    // clear lands first and the commit is refused. What must NEVER happen: a bid left 'sealed' with its
    // deposit debited. Repeated, because a race is only exercised by running it more than once.
    for (let i = 0; i < 12; i++) {
      const a = await auction();
      const settled = addr();
      const racer = addr();
      await fund(settled, 1000);
      await fund(racer, 1000);
      const first = await commit(a.vintage, settled, "x", 1000, "s");
      await reveal(a.id, first.commitment, 1000, "s");

      const racerCommitment = commitmentHash(racer, "y", 800, "r");
      const [cleared, committed] = await Promise.all([
        clearAndSettle(pool, { vintage: a.vintage, currentVintage: a.vintage }, Date.now()),
        commitSealedBid(pool, { vintage: a.vintage, bidder: racer, trendKey: "y", commitment: racerCommitment, deposit: depositFor(800) }),
      ]);

      expect("refused" in cleared, `iteration ${i}: the clear itself must succeed`).toBe(false);
      const sealed = await pool.query(`SELECT count(*)::int AS n FROM slot_bids WHERE auction_id = $1 AND status = 'sealed'`, [a.id]);
      expect(sealed.rows[0].n, `iteration ${i}: a bid was left sealed after the clear`).toBe(0);

      if (typeof committed === "object" && committed.charged) {
        // The commit won the race: its deposit was taken AND settled (never revealed ⇒ forfeited).
        expect(await status(racerCommitment), `iteration ${i}`).toBe("forfeited");
        expect(await balance(racer), `iteration ${i}`).toBe(1000 - 80);
      } else {
        // The clear won: the commit was refused and charged nothing.
        expect(committed, `iteration ${i}`).toBe("auction-cleared");
        expect(await balance(racer), `iteration ${i}`).toBe(1000);
        expect(await status(racerCommitment), `iteration ${i}`).toBeUndefined();
      }
      expect(await balance(settled), `iteration ${i}: the revealed bidder is made whole`).toBe(1000);
    }
  });

  /* ───────────── clear targeting ───────────── */

  it("a plain clear settles the OLDEST closed, uncleared auction — even after the clock has moved on", async () => {
    // Dated 1970 so these are older than anything else that could be in the table.
    const older = await auction({ closesAtOverride: "1970-01-02T00:00:00Z" });
    const newer = await auction({ closesAtOverride: "1970-01-03T00:00:00Z" });
    const [o, n] = [addr(), addr()];
    await fund(o, 1000);
    await fund(n, 1000);
    const co = await commit(older.vintage, o, "x", 1000, "o");
    const cn = await commit(newer.vintage, n, "y", 1000, "n");
    await reveal(older.id, co.commitment, 1000, "o");
    await reveal(newer.id, cn.commitment, 1000, "n");

    // The clock's vintage is somewhere else entirely — the old route cleared THAT one and found nothing.
    const first = await clearAndSettle(pool, { currentVintage: older.vintage + 100_000 }, Date.now());
    if ("refused" in first) throw new Error(`expected a clear, got ${JSON.stringify(first)}`);
    expect(first.vintage).toBe(older.vintage);
    expect(await balance(o)).toBe(1000);
    expect(await balance(n)).toBe(900); // the newer auction is untouched

    const second = await clearAndSettle(pool, { currentVintage: older.vintage + 100_000 }, Date.now());
    if ("refused" in second) throw new Error(`expected a clear, got ${JSON.stringify(second)}`);
    expect(second.vintage).toBe(newer.vintage);
    expect(await balance(n)).toBe(1000);
  });
});
