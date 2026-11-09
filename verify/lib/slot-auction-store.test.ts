import { describe, expect, it } from "vitest";
import {
  clearAuction,
  commitmentHash,
  REVEAL_DEPOSIT_SHARE,
  type RevealedBid,
  type SealedBid,
} from "./slot-auction";
import {
  clearAndSettle,
  commitSealedBid,
  depositFor,
  depositNote,
  hasValidReveal,
  planSettlement,
  refundNote,
  type BidRow,
} from "./slot-auction-store";
import { createFakeLedgerPool, type FakeLedgerPool } from "./testing/fake-ledger-pool";

/**
 * The sealed-bid deposit's lifecycle (T1 phase 2b).
 *
 * It used to be recorded in `slot_bids.deposit` and never charged, so the rule
 * "an unrevealed commit forfeits its deposit" had nothing to forfeit. These lock
 * the three terminal states — WON/REFUNDED get the deposit back, FORFEITED does
 * not — and the property that makes them safe to ship together: money in equals
 * money out, per auction, to the micro-credit.
 *
 * THE FAKE IS NOT POSTGRES. `createFakeLedgerPool` proves the ledger LOGIC (the
 * order of statements, atomicity, idempotency) but cannot catch a SQL typo; see
 * its header. CI has no database, so this is the strongest check available there.
 *
 * THIS FILE MUST STAY UNDER `lib/` — vitest's `include` is `lib/**\/*.test.ts`.
 */

const VINTAGE = 7;
const CLOSES_AT = Date.UTC(2026, 10, 1);
const AFTER = CLOSES_AT + 60_000;
const BEFORE = CLOSES_AT - 60_000;

/** What the route passes for a plain `clear`: no explicit vintage, the clock's vintage for diagnostics. */
const CURRENT = { currentVintage: VINTAGE };

const A = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const B = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const C = "0xcccccccccccccccccccccccccccccccccccccccc";
const D = "0xdddddddddddddddddddddddddddddddddddddddd";

function setup(opts: { slots?: number; reserve?: number; balances?: Record<string, number> } = {}) {
  const fake = createFakeLedgerPool();
  fake.state.auctions.push({
    id: 1,
    vintage: VINTAGE,
    slots: opts.slots ?? 2,
    reserve_price: opts.reserve ?? 100,
    closes_at: new Date(CLOSES_AT),
    clearing_price: null,
    cleared_at: null,
  });
  for (const [owner, bal] of Object.entries(opts.balances ?? { [A]: 10_000, [B]: 10_000, [C]: 10_000, [D]: 10_000 })) {
    fake.state.accounts.set(owner, bal);
  }
  return fake;
}

async function commit(fake: FakeLedgerPool, bidder: string, trendKey: string, amount: number, salt: string) {
  const commitment = commitmentHash(bidder, trendKey, amount, salt);
  const out = await commitSealedBid(fake.pool, {
    vintage: VINTAGE,
    bidder,
    trendKey,
    commitment,
    deposit: depositFor(amount),
  });
  return { commitment, out };
}

/** What the route's `reveal` action does: a plain UPDATE, no money. */
function reveal(fake: FakeLedgerPool, commitment: string, amount: number, salt: string, at = CLOSES_AT - 1000) {
  const b = fake.state.bids.find((x) => x.commitment === commitment)!;
  b.revealed_amount = amount;
  b.revealed_salt = salt;
  b.revealed_at = new Date(at);
  b.status = "revealed";
}

const bal = (fake: FakeLedgerPool, owner: string) => fake.state.accounts.get(owner) ?? 0;
const sumBalances = (fake: FakeLedgerPool) =>
  Math.round(Array.from(fake.state.accounts.values()).reduce((s, n) => s + n, 0) * 1e6) / 1e6;
const statusOf = (fake: FakeLedgerPool, commitment: string) =>
  fake.state.bids.find((b) => b.commitment === commitment)!.status;
const ledgerOf = (fake: FakeLedgerPool, kind: string) => fake.state.ledger.filter((l) => l.kind === kind);

/* ────────────────────────────────────────────────────────────────
 * The pure half
 * ──────────────────────────────────────────────────────────────── */

describe("depositFor — the amount the ledger will carry", () => {
  it("is 10% of the bid, rounded the ledger's way", () => {
    // A literal, so a change to REVEAL_DEPOSIT_SHARE has to be made on purpose.
    expect(REVEAL_DEPOSIT_SHARE).toBe(0.1);
    expect(depositFor(1000)).toBe(100);
    expect(depositFor(0.3)).toBe(0.03);
    // 10% of 1/3 is 0.0333… — six places, not seventeen digits of float.
    expect(depositFor(1 / 3)).toBe(0.033333);
  });

  it("rounds a vanishing bid to zero, which the commit refuses rather than 'charging' nothing", () => {
    expect(depositFor(1e-9)).toBe(0);
  });
});

describe("the join key between a bid and its debit", () => {
  it("names the auction and the commitment, and the refund note differs from the deposit note", () => {
    const c = commitmentHash(A, "t", 5, "s");
    expect(depositNote(3, c)).toBe(`slot-deposit a3 ${c}`);
    expect(refundNote(3, c)).toBe(`slot-deposit-refund a3 ${c}`);
    expect(depositNote(3, c)).not.toBe(depositNote(4, c));
  });
});

function bidRow(id: number, bidder: string, trendKey: string, amount: number, salt: string, revealed: boolean, at = 1): BidRow {
  return {
    id,
    bidder,
    trendKey,
    commitment: commitmentHash(bidder, trendKey, amount, salt),
    deposit: depositFor(amount),
    revealedAmount: revealed ? amount : null,
    revealedSalt: revealed ? salt : null,
    revealedAt: revealed ? at : null,
  };
}

function resultFor(rows: BidRow[], slots: number, reserve: number) {
  const sealed: SealedBid[] = rows.map((r) => ({
    bidder: r.bidder,
    trendKey: r.trendKey,
    commitment: r.commitment,
    committedAt: 0,
    deposit: r.deposit,
  }));
  const reveals: RevealedBid[] = rows
    .filter((r) => r.revealedAt != null)
    .map((r) => ({
      bidder: r.bidder,
      trendKey: r.trendKey,
      amount: r.revealedAmount as number,
      salt: r.revealedSalt as string,
      revealedAt: r.revealedAt as number,
    }));
  return clearAuction({ sealed, reveals, slots, reservePrice: reserve });
}

describe("planSettlement — each bid ends in exactly one of three states", () => {
  const rows: BidRow[] = [
    bidRow(1, A, "x", 1000, "a", true),
    bidRow(2, B, "y", 900, "b", true),
    bidRow(3, C, "z", 500, "c", true), // revealed, outbid
    bidRow(4, D, "w", 2000, "d", false), // never revealed
  ];

  it("maps winners, outbid reveals and no-shows to won / refunded / forfeited", () => {
    const plan = planSettlement(rows, resultFor(rows, 2, 100));
    expect(plan.map((p) => [p.id, p.outcome])).toEqual([
      [1, "won"],
      [2, "won"],
      [3, "refunded"],
      [4, "forfeited"],
    ]);
  });

  it("agrees with clearAuction about who forfeits", () => {
    const result = resultFor(rows, 2, 100);
    const plan = planSettlement(rows, result);
    const forfeitedBidders = plan.filter((p) => p.outcome === "forfeited").map((p) => p.bidder);
    expect(forfeitedBidders).toEqual(result.forfeited.map((f) => f.bidder));
    expect(plan.filter((p) => p.outcome === "won")).toHaveLength(result.winners.length);
  });

  it("a reveal below the reserve loses and is REFUNDED, not forfeited", () => {
    const low: BidRow[] = [bidRow(1, A, "x", 50, "a", true), bidRow(2, B, "y", 900, "b", true)];
    const plan = planSettlement(low, resultFor(low, 2, 100));
    expect(plan.find((p) => p.id === 1)!.outcome).toBe("refunded");
    expect(plan.find((p) => p.id === 2)!.outcome).toBe("won");
  });

  it("settles per BID: one bidder's winning bid does not drag their second bid along", () => {
    // Same bidder, same trend, two commitments. Only the higher can win the trend;
    // the other is a valid reveal that lost, so it is refunded rather than marked won.
    const two: BidRow[] = [bidRow(1, A, "x", 400, "s1", true, 1), bidRow(2, A, "x", 800, "s2", true, 2)];
    const plan = planSettlement(two, resultFor(two, 2, 100));
    expect(plan.map((p) => [p.id, p.outcome])).toEqual([
      [1, "refunded"],
      [2, "won"],
    ]);
  });

  it("treats a reveal that does not open its commitment as no reveal at all — deposit kept", () => {
    const tampered: BidRow = { ...bidRow(1, A, "x", 1000, "a", true), revealedAmount: 5000 };
    expect(hasValidReveal(tampered)).toBe(false);
    expect(planSettlement([tampered], resultFor([tampered], 2, 100))[0].outcome).toBe("forfeited");
  });

  it("refuses to settle an auction whose winner it cannot find — a defect, not an outcome", () => {
    const result = resultFor(rows, 2, 100);
    const ghost = { ...result, winners: [{ bidder: "0xnobody", trendKey: "q", amount: 9 }] };
    expect(() => planSettlement(rows, ghost)).toThrow(/matches no revealed bid/);
  });
});

/* ────────────────────────────────────────────────────────────────
 * Terminal state 0: the commit
 * ──────────────────────────────────────────────────────────────── */

describe("commit — the deposit is charged with the bid, or neither happens", () => {
  it("debits the deposit and writes one `spend` row that names the bid", async () => {
    const fake = setup();
    const { commitment, out } = await commit(fake, A, "x", 1000, "s");

    expect(out).toEqual({ charged: true });
    expect(bal(fake, A)).toBe(10_000 - 100);
    const spends = ledgerOf(fake, "spend");
    expect(spends).toHaveLength(1);
    expect(spends[0]).toMatchObject({ owner: A, amount: 100, note: depositNote(1, commitment) });
    expect(fake.state.bids).toHaveLength(1);
    expect(fake.state.bids[0].deposit).toBe(100);
    expect(fake.openClients()).toBe(0);
  });

  it("a wallet that cannot cover the deposit gets no bid and loses nothing", async () => {
    const fake = setup({ balances: { [A]: 99.99 } });
    const { out } = await commit(fake, A, "x", 1000, "s");

    expect(out).toBe("insufficient-balance");
    expect(bal(fake, A)).toBe(99.99);
    expect(fake.state.bids).toHaveLength(0);
    expect(fake.state.ledger).toHaveLength(0);
    expect(fake.openClients()).toBe(0);
  });

  it("an exactly-sufficient wallet is charged to zero", async () => {
    const fake = setup({ balances: { [A]: 100 } });
    expect((await commit(fake, A, "x", 1000, "s")).out).toEqual({ charged: true });
    expect(bal(fake, A)).toBe(0);
  });

  it("a replayed commitment is not charged twice", async () => {
    const fake = setup();
    await commit(fake, A, "x", 1000, "s");
    const second = await commit(fake, A, "x", 1000, "s");

    expect(second.out).toEqual({ charged: false });
    expect(bal(fake, A)).toBe(10_000 - 100);
    expect(ledgerOf(fake, "spend")).toHaveLength(1);
    expect(fake.state.bids).toHaveLength(1);
  });

  it("inserts the bid BEFORE it debits, so the unique index is what serialises a replay", async () => {
    const fake = setup();
    await commit(fake, A, "x", 1000, "s");
    const insertAt = fake.log.findIndex((q) => q.startsWith("INSERT INTO slot_bids"));
    const debitAt = fake.log.findIndex((q) => q.startsWith("UPDATE madx_accounts SET balance = balance - $2"));
    expect(insertAt).toBeGreaterThan(-1);
    expect(debitAt).toBeGreaterThan(insertAt);
  });

  it("answers no-auction before touching the ledger", async () => {
    const fake = createFakeLedgerPool();
    fake.state.accounts.set(A, 500);
    const out = await commitSealedBid(fake.pool, {
      vintage: 99,
      bidder: A,
      trendKey: "x",
      commitment: "c",
      deposit: 10,
    });
    expect(out).toBe("no-auction");
    expect(bal(fake, A)).toBe(500);
    expect(fake.state.ledger).toHaveLength(0);
  });

  it("refuses a bid so small its deposit is zero, instead of recording a free seal", async () => {
    const fake = setup();
    const { out } = await commit(fake, A, "x", 1e-9, "s");
    expect(out).toBe("bad-deposit");
    expect(fake.state.bids).toHaveLength(0);
  });

  it("rolls the bid back if the ledger write itself fails", async () => {
    const fake = setup();
    fake.failOnce((sql) => sql.startsWith("INSERT INTO madx_ledger"));
    await expect(commit(fake, A, "x", 1000, "s")).rejects.toThrow(/injected failure/);
    expect(fake.state.bids).toHaveLength(0);
    expect(bal(fake, A)).toBe(10_000);
    expect(fake.openClients()).toBe(0);
  });
});

/* ────────────────────────────────────────────────────────────────
 * Terminal states 1–3: clear
 * ──────────────────────────────────────────────────────────────── */

/** Four bidders, two slots: A and B win, C is outbid, D commits high and never reveals. */
async function fourBidders() {
  const fake = setup();
  const a = await commit(fake, A, "x", 1000, "a");
  const b = await commit(fake, B, "y", 900, "b");
  const c = await commit(fake, C, "z", 500, "c");
  const d = await commit(fake, D, "w", 2000, "d");
  reveal(fake, a.commitment, 1000, "a");
  reveal(fake, b.commitment, 900, "b");
  reveal(fake, c.commitment, 500, "c");
  // D never reveals.
  return { fake, a, b, c, d };
}

describe("clear — the three terminal states", () => {
  it("REVEAL-AND-LOSE: the deposit comes back, as a `refund` row", async () => {
    const { fake, c } = await fourBidders();
    expect(bal(fake, C)).toBe(10_000 - 50);

    const out = await clearAndSettle(fake.pool, CURRENT, AFTER);

    expect("refused" in out).toBe(false);
    expect(bal(fake, C)).toBe(10_000);
    expect(statusOf(fake, c.commitment)).toBe("refunded");
    const refund = ledgerOf(fake, "refund").find((l) => l.owner === C)!;
    expect(refund).toMatchObject({ amount: 50, note: refundNote(1, c.commitment) });
  });

  it("NO-REVEAL: the deposit is forfeited — no refund row, the balance stays down", async () => {
    const { fake, d } = await fourBidders();
    expect(bal(fake, D)).toBe(10_000 - 200);

    const out = await clearAndSettle(fake.pool, CURRENT, AFTER);

    expect(bal(fake, D)).toBe(10_000 - 200);
    expect(statusOf(fake, d.commitment)).toBe("forfeited");
    expect(ledgerOf(fake, "refund").some((l) => l.owner === D)).toBe(false);
    if ("refused" in out) throw new Error("expected a clear");
    expect(out.settlement.forfeited).toBe(1);
    // The platform keeps what D actually paid at commit — read from the ledger.
    expect(out.settlement.depositsForfeited).toBe(200);
  });

  it("WIN: the bond is returned too, and the slot is recorded as won", async () => {
    const { fake, a, b } = await fourBidders();
    const out = await clearAndSettle(fake.pool, CURRENT, AFTER);

    expect(bal(fake, A)).toBe(10_000);
    expect(bal(fake, B)).toBe(10_000);
    expect(statusOf(fake, a.commitment)).toBe("won");
    expect(statusOf(fake, b.commitment)).toBe("won");
    if ("refused" in out) throw new Error("expected a clear");
    expect(out.result.winners.map((w) => w.bidder).sort()).toEqual([A, B]);
    expect(out.result.clearingPrice).toBe(900);
  });

  it("CONSERVES: balances plus what the platform kept equal what the bidders started with", async () => {
    const { fake } = await fourBidders();
    const before = 40_000;
    expect(sumBalances(fake) + 0).toBe(before - (100 + 90 + 50 + 200)); // everything committed is out

    const out = await clearAndSettle(fake.pool, CURRENT, AFTER);
    if ("refused" in out) throw new Error("expected a clear");

    const s = out.settlement;
    expect(s).toMatchObject({ won: 2, refunded: 1, forfeited: 1, undebited: 0 });
    expect(s.depositsReturned).toBe(100 + 90 + 50);
    expect(s.depositsForfeited).toBe(200);
    expect(sumBalances(fake) + s.depositsForfeited).toBe(before);
    // A refund is not a mint: no `welcome`/`buy`/`claim` row appears from clearing.
    expect(ledgerOf(fake, "refund")).toHaveLength(3);
    expect(fake.state.ledger.filter((l) => !["spend", "refund"].includes(l.kind))).toHaveLength(0);
  });

  it("stamps the auction cleared, with the clearing price", async () => {
    const { fake } = await fourBidders();
    await clearAndSettle(fake.pool, CURRENT, AFTER);
    expect(fake.state.auctions[0].cleared_at).not.toBeNull();
    expect(fake.state.auctions[0].clearing_price).toBe(900);
    expect(fake.openClients()).toBe(0);
  });

  it("clearing twice refunds nobody twice", async () => {
    const { fake } = await fourBidders();
    await clearAndSettle(fake.pool, CURRENT, AFTER);
    const balancesAfterFirst = new Map(fake.state.accounts);
    const refundsAfterFirst = ledgerOf(fake, "refund").length;

    const second = await clearAndSettle(fake.pool, CURRENT, AFTER);

    expect(second).toEqual({ refused: "already-cleared" });
    expect(fake.state.accounts).toEqual(balancesAfterFirst);
    expect(ledgerOf(fake, "refund")).toHaveLength(refundsAfterFirst);
  });

  it("refuses to clear before the auction's own closing time, and moves nothing", async () => {
    const { fake } = await fourBidders();
    const before = sumBalances(fake);

    const out = await clearAndSettle(fake.pool, CURRENT, BEFORE);

    expect(out).toMatchObject({ refused: "still-open", closesAt: new Date(CLOSES_AT).toISOString() });
    expect(sumBalances(fake)).toBe(before);
    expect(fake.state.auctions[0].cleared_at).toBeNull();
  });

  it("answers no-auction for a vintage with no row", async () => {
    const fake = setup();
    // Explicit vintage, so the closed auction that IS on file (vintage 7) is not picked up instead.
    expect(await clearAndSettle(fake.pool, { vintage: 12345, currentVintage: 12345 }, AFTER)).toEqual({
      refused: "no-auction",
    });
  });

  it("is ATOMIC: a failure part-way through the refunds rolls the whole clear back", async () => {
    const { fake } = await fourBidders();
    const balancesBefore = new Map(fake.state.accounts);
    const ledgerBefore = fake.state.ledger.length;

    // Let the first refund through, then fail on the second `refund` ledger write —
    // exactly the half-settled state the old four-query loop could leave behind.
    let refundWrites = 0;
    fake.failOnce((sql, params) => {
      if (sql.startsWith("INSERT INTO madx_ledger") && (params as unknown[])[2] === "refund") {
        refundWrites += 1;
        return refundWrites === 2;
      }
      return false;
    });

    await expect(clearAndSettle(fake.pool, CURRENT, AFTER)).rejects.toThrow(/injected failure/);

    expect(refundWrites).toBe(2);
    expect(fake.state.accounts).toEqual(balancesBefore);
    expect(fake.state.ledger).toHaveLength(ledgerBefore);
    expect(fake.state.auctions[0].cleared_at).toBeNull();
    expect(fake.state.bids.every((b) => b.status === "sealed" || b.status === "revealed")).toBe(true);
    expect(fake.openClients()).toBe(0);

    // And because nothing was left half-done, a retry clears cleanly.
    const retry = await clearAndSettle(fake.pool, CURRENT, AFTER);
    expect("refused" in retry).toBe(false);
    expect(ledgerOf(fake, "refund")).toHaveLength(3);
  });

  it("NEVER MINTS: a bid committed before deposits were charged settles its status and moves no money", async () => {
    const fake = setup();
    // A legacy row: the old route wrote the bid and its `deposit` and debited nothing.
    const commitment = commitmentHash(A, "x", 1000, "a");
    fake.state.bids.push({
      id: fake.state.nextBidId++,
      auction_id: 1,
      bidder: A,
      trend_key: "x",
      commitment,
      deposit: 100,
      committed_at: new Date(),
      revealed_amount: 1000,
      revealed_salt: "a",
      revealed_at: new Date(CLOSES_AT - 1000),
      status: "revealed",
    });

    const out = await clearAndSettle(fake.pool, CURRENT, AFTER);

    if ("refused" in out) throw new Error("expected a clear");
    expect(bal(fake, A)).toBe(10_000); // not 10_100
    expect(ledgerOf(fake, "refund")).toHaveLength(0);
    expect(out.settlement.undebited).toBe(1);
    expect(statusOf(fake, commitment)).toBe("won");
  });

  it("refunds what the ledger actually took, even if the stored deposit column disagrees", async () => {
    const { fake, c } = await fourBidders();
    // Tamper with the column. The refund must follow the `spend` row, not this.
    fake.state.bids.find((x) => x.commitment === c.commitment)!.deposit = 9_999;

    await clearAndSettle(fake.pool, CURRENT, AFTER);

    expect(bal(fake, C)).toBe(10_000);
  });

  it("an auction nobody bid in clears with nothing to settle", async () => {
    const fake = setup();
    const out = await clearAndSettle(fake.pool, CURRENT, AFTER);
    if ("refused" in out) throw new Error("expected a clear");
    expect(out.settlement).toMatchObject({ won: 0, refunded: 0, forfeited: 0, undebited: 0 });
    expect(fake.state.auctions[0].cleared_at).not.toBeNull();
  });
});

/* ────────────────────────────────────────────────────────────────
 * Follow-up to #200: the three defects found reviewing it
 * ──────────────────────────────────────────────────────────────── */

const DAY = 86_400_000;

/** A second auction, closing `closesAt`, for vintage `vintage`. */
function addAuction(fake: FakeLedgerPool, id: number, vintage: number, closesAt: number) {
  fake.state.auctions.push({
    id,
    vintage,
    slots: 2,
    reserve_price: 100,
    closes_at: new Date(closesAt),
    clearing_price: null,
    cleared_at: null,
  });
}

async function commitTo(fake: FakeLedgerPool, vintage: number, bidder: string, trendKey: string, amount: number, salt: string) {
  const commitment = commitmentHash(bidder, trendKey, amount, salt);
  const out = await commitSealedBid(fake.pool, { vintage, bidder, trendKey, commitment, deposit: depositFor(amount) });
  return { commitment, out };
}

describe("clear targeting — a missed settlement tail no longer strands deposits", () => {
  it("REGRESSION: after the Turning rolls over, a plain clear still settles the auction that closed", async () => {
    const { fake, c, d } = await fourBidders();
    expect(bal(fake, C)).toBe(10_000 - 50); // the deposits are really out
    expect(bal(fake, D)).toBe(10_000 - 200);

    // Nobody cleared during the tail. The clock has moved into the NEXT Turning, so the live-clock
    // vintage is now VINTAGE + 1. The old route cleared `vintageAt(now) + 1` — i.e. that one.
    const nextTurning = { currentVintage: VINTAGE + 1 };
    const out = await clearAndSettle(fake.pool, nextTurning, CLOSES_AT + 30 * DAY);

    if ("refused" in out) throw new Error(`expected a clear, got ${JSON.stringify(out)}`);
    expect(out.vintage).toBe(VINTAGE); // read from the row it cleared, not assumed
    expect(bal(fake, C)).toBe(10_000); // refunded
    expect(bal(fake, D)).toBe(10_000 - 200); // forfeited
    expect(statusOf(fake, c.commitment)).toBe("refunded");
    expect(statusOf(fake, d.commitment)).toBe("forfeited");
  });

  it("…and this is what the OLD behaviour did: naming the clock's vintage finds nothing, deposits stay out", async () => {
    const { fake } = await fourBidders();
    const before = sumBalances(fake);
    const out = await clearAndSettle(fake.pool, { vintage: VINTAGE + 1, currentVintage: VINTAGE + 1 }, CLOSES_AT + 30 * DAY);
    expect(out).toEqual({ refused: "no-auction" });
    expect(sumBalances(fake)).toBe(before);
    expect(fake.state.auctions[0].cleared_at).toBeNull();
  });

  it("an explicit vintage clears exactly that auction, even when an older one is also due", async () => {
    const fake = setup();
    addAuction(fake, 2, VINTAGE + 1, CLOSES_AT + 10 * DAY);
    const out = await clearAndSettle(fake.pool, { vintage: VINTAGE + 1, currentVintage: VINTAGE + 2 }, CLOSES_AT + 30 * DAY);
    if ("refused" in out) throw new Error("expected a clear");
    expect(out.vintage).toBe(VINTAGE + 1);
    expect(fake.state.auctions.find((a) => a.vintage === VINTAGE)!.cleared_at).toBeNull();
    expect(fake.state.auctions.find((a) => a.vintage === VINTAGE + 1)!.cleared_at).not.toBeNull();
  });

  it("without a vintage it drains a backlog oldest first, one auction per call", async () => {
    const fake = setup();
    addAuction(fake, 2, VINTAGE + 1, CLOSES_AT + 10 * DAY);
    const now = CLOSES_AT + 30 * DAY;
    const cur = { currentVintage: VINTAGE + 5 };

    const first = await clearAndSettle(fake.pool, cur, now);
    const second = await clearAndSettle(fake.pool, cur, now);
    const third = await clearAndSettle(fake.pool, cur, now);

    expect("refused" in first ? -1 : first.vintage).toBe(VINTAGE);
    expect("refused" in second ? -1 : second.vintage).toBe(VINTAGE + 1);
    expect(third).toEqual({ refused: "no-auction" }); // nothing due, and none on file for the clock's vintage
  });

  it("an auction that has not closed is never picked up, even when it is the oldest uncleared", async () => {
    const fake = setup(); // closes at CLOSES_AT
    const out = await clearAndSettle(fake.pool, CURRENT, BEFORE);
    expect(out).toMatchObject({ refused: "still-open" });
    expect(fake.state.auctions[0].cleared_at).toBeNull();
  });

  it("two simultaneous plain clears cannot settle the same auction twice", async () => {
    // The fake has no row locks, so this models the SEQUENCE the lock produces: the second clear's
    // `cleared_at IS NULL` predicate no longer matches, and it falls through to the diagnostics.
    const { fake } = await fourBidders();
    const a = await clearAndSettle(fake.pool, CURRENT, AFTER);
    const b = await clearAndSettle(fake.pool, CURRENT, AFTER);
    expect("refused" in a).toBe(false);
    expect(b).toEqual({ refused: "already-cleared" });
    expect(ledgerOf(fake, "refund")).toHaveLength(3);
  });
});

describe("commit after the auction has settled", () => {
  it("is refused, charges nothing and writes no bid — it could never be refunded", async () => {
    const { fake } = await fourBidders();
    await clearAndSettle(fake.pool, CURRENT, AFTER);
    const bidsBefore = fake.state.bids.length;
    const ledgerBefore = fake.state.ledger.length;
    const balanceBefore = bal(fake, A);

    const late = await commit(fake, A, "q", 500, "late");

    expect(late.out).toBe("auction-cleared");
    expect(bal(fake, A)).toBe(balanceBefore);
    expect(fake.state.bids).toHaveLength(bidsBefore);
    expect(fake.state.ledger).toHaveLength(ledgerBefore);
    expect(fake.openClients()).toBe(0);
  });

  it("takes a SHARED lock on the auction row before inserting, so a clear in flight excludes it", async () => {
    const fake = setup();
    await commit(fake, A, "x", 1000, "s");
    const lockAt = fake.log.findIndex((q) => q.includes("FROM slot_auctions") && q.endsWith("FOR SHARE"));
    const insertAt = fake.log.findIndex((q) => q.startsWith("INSERT INTO slot_bids"));
    expect(lockAt).toBeGreaterThan(-1);
    expect(insertAt).toBeGreaterThan(lockAt);
  });

  it("while clearAndSettle locks the same row FOR UPDATE before it reads a single bid", async () => {
    const { fake } = await fourBidders();
    fake.log.length = 0;
    await clearAndSettle(fake.pool, CURRENT, AFTER);
    const lockAt = fake.log.findIndex((q) => q.includes("FROM slot_auctions") && q.endsWith("FOR UPDATE"));
    const bidsAt = fake.log.findIndex((q) => q.startsWith("SELECT * FROM slot_bids"));
    expect(lockAt).toBeGreaterThan(-1);
    expect(bidsAt).toBeGreaterThan(lockAt);
  });
});

describe("the refund-proof lookup is scoped by owner, so it can use the ledger's index", () => {
  it("passes the distinct, lower-cased bidders as the owner filter", async () => {
    const { fake } = await fourBidders();
    await clearAndSettle(fake.pool, CURRENT, AFTER);
    const q = fake.calls.find((c) => c.sql.startsWith("SELECT kind, note, amount FROM madx_ledger"));
    expect(q).toBeDefined();
    expect(q!.sql).toContain("owner = ANY($1::text[])");
    expect((q!.params[0] as string[]).slice().sort()).toEqual([A, B, C, D]);
  });

  it("still finds a debit made under a checksummed (mixed-case) bidder address", async () => {
    const MIXED = "0xAbCdEfAbCdEfAbCdEfAbCdEfAbCdEfAbCdEfAbCd";
    const fake = setup({ balances: { [MIXED.toLowerCase()]: 10_000 } });
    const { commitment } = await commit(fake, MIXED, "x", 1000, "s");
    reveal(fake, commitment, 1000, "s");
    expect(bal(fake, MIXED.toLowerCase())).toBe(10_000 - 100);

    const out = await clearAndSettle(fake.pool, CURRENT, AFTER);

    if ("refused" in out) throw new Error("expected a clear");
    // Had the owner filter used the bidder as stored, it would miss the lower-cased ledger row,
    // treat the bid as undebited, and quietly refund nothing.
    expect(out.settlement.undebited).toBe(0);
    expect(bal(fake, MIXED.toLowerCase())).toBe(10_000);
  });

  it("does not refund a deposit that was debited to a different owner under the same note", async () => {
    const { fake, c } = await fourBidders();
    // Re-attribute C's debit to someone else: the owner scope must not match it.
    const spend = fake.state.ledger.find((l) => l.note === depositNote(1, c.commitment))!;
    spend.owner = "0x0000000000000000000000000000000000000bad";
    const out = await clearAndSettle(fake.pool, CURRENT, AFTER);
    if ("refused" in out) throw new Error("expected a clear");
    expect(out.settlement.undebited).toBe(1);
    expect(bal(fake, C)).toBe(10_000 - 50); // nothing minted for a debit that is not C's
  });
});

describe("commits to a later vintage are unaffected by an earlier auction's clear", () => {
  it("settles per auction", async () => {
    const fake = setup();
    addAuction(fake, 2, VINTAGE + 1, CLOSES_AT + 10 * DAY);
    const first = await commitTo(fake, VINTAGE, A, "x", 1000, "a");
    const second = await commitTo(fake, VINTAGE + 1, B, "y", 1000, "b");
    reveal(fake, first.commitment, 1000, "a");
    reveal(fake, second.commitment, 1000, "b", CLOSES_AT + 10 * DAY - 1000);

    await clearAndSettle(fake.pool, { vintage: VINTAGE, currentVintage: VINTAGE }, AFTER);

    expect(bal(fake, A)).toBe(10_000); // refunded
    expect(bal(fake, B)).toBe(10_000 - 100); // the other auction's deposit is untouched
    expect(statusOf(fake, second.commitment)).toBe("revealed");
  });
});
