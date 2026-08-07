import { describe, it, expect } from "vitest";
import {
  auctionWindow,
  clearAuction,
  clockPriceAt,
  commitmentHash,
  phaseAt,
  poolNominations,
  requiredDeposit,
  verifyReveal,
  REVEAL_DEPOSIT_SHARE,
  SETTLEMENT_MS,
  type RevealedBid,
  type SealedBid,
} from "@/lib/slot-auction";
import { LEG_MS } from "@/lib/lunar-legs";

const T0 = Date.UTC(2026, 8, 1);
const W = auctionWindow(T0);
const CLOCK = { startPrice: 25_000, reservePrice: 2_500 };

const sealed = (bidder: string, trendKey: string, amount: number, salt: string, at = T0): SealedBid => ({
  bidder,
  trendKey,
  commitment: commitmentHash(bidder, trendKey, amount, salt),
  committedAt: at,
  deposit: requiredDeposit(amount),
});
const reveal = (bidder: string, trendKey: string, amount: number, salt: string, at = T0): RevealedBid => ({
  bidder,
  trendKey,
  amount,
  salt,
  revealedAt: at,
});

describe("auction window and phases", () => {
  it("runs nomination → commit → reveal → cleared, inside one leg", () => {
    expect(phaseAt(W, T0)).toBe("nomination");
    expect(phaseAt(W, W.commitOpensAt)).toBe("commit");
    expect(phaseAt(W, W.revealOpensAt)).toBe("reveal");
    expect(phaseAt(W, W.closesAt)).toBe("cleared");
  });

  it("leaves a settlement tail INSIDE the leg, so 'cleared' is reachable", () => {
    // The bug this guards: the route anchors the window to the CURRENT leg, so
    // if the three active phases summed to a whole leg then `now` would always
    // fall before closesAt, "cleared" could never be the live phase, and every
    // bidder's deposit would sit behind a phase that never arrives.
    expect(W.closesAt - W.opensAt).toBeLessThan(LEG_MS);
    expect(SETTLEMENT_MS).toBeGreaterThan(0);
    expect(W.closesAt - W.opensAt + SETTLEMENT_MS).toBeCloseTo(LEG_MS, 0);

    // Concretely: somewhere inside the leg, the live phase is "cleared".
    const insideTheTail = W.closesAt + SETTLEMENT_MS / 2;
    expect(insideTheTail).toBeLessThan(W.opensAt + LEG_MS);
    expect(phaseAt(W, insideTheTail)).toBe("cleared");
  });

  it("has no gap or overlap between phases", () => {
    // A one-millisecond gap is a millisecond in which no action is legal, and a
    // one-millisecond overlap is a millisecond in which a bid can be revealed
    // while others can still commit against it.
    expect(phaseAt(W, W.commitOpensAt - 1)).toBe("nomination");
    expect(phaseAt(W, W.revealOpensAt - 1)).toBe("commit");
    expect(phaseAt(W, W.closesAt - 1)).toBe("reveal");
  });
});

describe("the Dutch clock", () => {
  it("descends monotonically from start to reserve", () => {
    let prev = Infinity;
    for (let i = 0; i <= 20; i++) {
      const p = clockPriceAt(W, CLOCK, W.opensAt + ((W.closesAt - W.opensAt) * i) / 20);
      expect(p).toBeLessThanOrEqual(prev + 1e-6);
      expect(p).toBeGreaterThanOrEqual(CLOCK.reservePrice - 1e-6);
      expect(p).toBeLessThanOrEqual(CLOCK.startPrice + 1e-6);
      prev = p;
    }
    expect(clockPriceAt(W, CLOCK, W.opensAt)).toBeCloseTo(CLOCK.startPrice, 6);
    expect(clockPriceAt(W, CLOCK, W.closesAt)).toBeCloseTo(CLOCK.reservePrice, 6);
  });

  it("spends most of the window in the plausible range, unlike a linear clock", () => {
    // The whole reason for the exponential shape: at the halfway point a linear
    // clock is still at the midpoint of a range nobody will pay, which pushes
    // every real decision into the last minutes.
    const mid = W.opensAt + (W.closesAt - W.opensAt) / 2;
    const expo = clockPriceAt(W, CLOCK, mid);
    const linear = clockPriceAt(W, { ...CLOCK, shape: "linear" }, mid);
    expect(expo).toBeLessThan(linear);
    expect(expo).toBeLessThan((CLOCK.startPrice + CLOCK.reservePrice) / 2);
  });

  it("never returns below the reserve, even outside the window", () => {
    expect(clockPriceAt(W, CLOCK, W.closesAt + LEG_MS)).toBeCloseTo(CLOCK.reservePrice, 6);
    expect(clockPriceAt(W, CLOCK, W.opensAt - LEG_MS)).toBeCloseTo(CLOCK.startPrice, 6);
  });
});

describe("commit–reveal", () => {
  it("binds the bidder, so a commitment cannot be stolen from the mempool", () => {
    const mine = commitmentHash("0xAAA", "trend", 100, "salt");
    const theirs = commitmentHash("0xBBB", "trend", 100, "salt");
    expect(mine).not.toBe(theirs);
    // The theft: someone copies my commitment and reveals it as their own.
    const s = sealed("0xAAA", "trend", 100, "salt");
    expect(verifyReveal(s, reveal("0xBBB", "trend", 100, "salt"))).toBe(false);
    expect(verifyReveal(s, reveal("0xAAA", "trend", 100, "salt"))).toBe(true);
  });

  it("is case-insensitive on the address but not on anything else", () => {
    expect(commitmentHash("0xAbC", "t", 1, "s")).toBe(commitmentHash("0xabc", "t", 1, "s"));
    expect(commitmentHash("0xabc", "t", 1, "s")).not.toBe(commitmentHash("0xabc", "T", 1, "s"));
    expect(commitmentHash("0xabc", "t", 1, "s")).not.toBe(commitmentHash("0xabc", "t", 2, "s"));
  });

  it("rejects a reveal with the wrong amount or salt", () => {
    const s = sealed("0xAAA", "trend", 100, "salt");
    expect(verifyReveal(s, reveal("0xAAA", "trend", 999, "salt"))).toBe(false);
    expect(verifyReveal(s, reveal("0xAAA", "trend", 100, "other"))).toBe(false);
    expect(verifyReveal(s, reveal("0xAAA", "other", 100, "salt"))).toBe(false);
  });
});

describe("clearing", () => {
  it("clears at a uniform price — the lowest winning bid", () => {
    const bids = [
      ["0xA", "alpha", 9_000],
      ["0xB", "bravo", 7_000],
      ["0xC", "charlie", 5_000],
      ["0xD", "delta", 3_000],
    ] as const;
    const r = clearAuction({
      sealed: bids.map(([b, t, a]) => sealed(b, t, a, "s")),
      reveals: bids.map(([b, t, a]) => reveal(b, t, a, "s")),
      slots: 3,
      reservePrice: 2_500,
    });
    expect(r.winners.map((w) => w.trendKey)).toEqual(["alpha", "bravo", "charlie"]);
    // Everyone pays 5,000 — including the bidder who said 9,000. That is what
    // makes bidding your true value close to optimal.
    expect(r.clearingPrice).toBe(5_000);
    expect(r.underSubscribed).toBe(false);
  });

  it("gives one slot per trend, so a single trend cannot take the slate", () => {
    const bids = [
      ["0xA", "alpha", 9_000],
      ["0xB", "alpha", 8_000],
      ["0xC", "alpha", 7_000],
      ["0xD", "bravo", 4_000],
    ] as const;
    const r = clearAuction({
      sealed: bids.map(([b, t, a]) => sealed(b, t, a, "s")),
      reveals: bids.map(([b, t, a]) => reveal(b, t, a, "s")),
      slots: 3,
      reservePrice: 2_500,
    });
    const keys = r.winners.map((w) => w.trendKey);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain("alpha");
    expect(keys).toContain("bravo");
    // Only two distinct trends existed, so the third slot goes unfilled.
    expect(r.underSubscribed).toBe(true);
  });

  it("forfeits the deposit of a commit that is never revealed", () => {
    // The attack: commit high to scare rivals off, then never reveal. Free
    // option unless it costs something.
    const honest = sealed("0xA", "alpha", 5_000, "s");
    const ghost = sealed("0xGHOST", "bravo", 90_000, "s");
    const r = clearAuction({
      sealed: [honest, ghost],
      reveals: [reveal("0xA", "alpha", 5_000, "s")],
      slots: 2,
      reservePrice: 2_500,
    });
    expect(r.forfeited).toHaveLength(1);
    expect(r.forfeited[0].bidder).toBe("0xGHOST");
    expect(r.forfeited[0].deposit).toBeCloseTo(90_000 * REVEAL_DEPOSIT_SHARE, 6);
    expect(r.winners.map((w) => w.bidder)).toEqual(["0xA"]);
  });

  it("discards a reveal that does not match its commitment", () => {
    const s = sealed("0xA", "alpha", 5_000, "s");
    const r = clearAuction({
      sealed: [s],
      reveals: [reveal("0xA", "alpha", 50_000, "s")], // amount changed after sealing
      slots: 2,
      reservePrice: 2_500,
    });
    expect(r.invalid).toContain("0xA");
    expect(r.winners).toHaveLength(0);
    // Unrevealed as far as the auction is concerned, so the deposit is forfeit.
    expect(r.forfeited.map((f) => f.bidder)).toContain("0xA");
  });

  it("returns the deposit on an honest bid that simply loses below the reserve", () => {
    // Punishing a low bid teaches people not to bid at all.
    const low = sealed("0xLOW", "alpha", 100, "s");
    const r = clearAuction({
      sealed: [low],
      reveals: [reveal("0xLOW", "alpha", 100, "s")],
      slots: 2,
      reservePrice: 2_500,
    });
    expect(r.forfeited).toHaveLength(0);
    expect(r.invalid).toHaveLength(0);
    expect(r.winners).toHaveLength(0);
    expect(r.clearingPrice).toBe(2_500);
  });

  it("floors the clearing price at the reserve when under-subscribed", () => {
    const r = clearAuction({ sealed: [], reveals: [], slots: 3, reservePrice: 2_500 });
    expect(r.clearingPrice).toBe(2_500);
    expect(r.underSubscribed).toBe(true);
    expect(r.winners).toHaveLength(0);
  });

  it("clamps the slot count into the 2..3 band", () => {
    expect(clearAuction({ sealed: [], reveals: [], slots: 9, reservePrice: 0 }).slots).toBe(3);
    expect(clearAuction({ sealed: [], reveals: [], slots: 0, reservePrice: 0 }).slots).toBe(2);
  });
});

describe("nomination pool — EigenTrust weighting", () => {
  it("gives a brigade of fresh wallets approximately no weight", () => {
    const brigade = Array.from({ length: 50 }, (_, i) => ({
      trendKey: "astroturf",
      trendName: "ASTROTURF",
      nominator: `0x${i}`,
      engagements: [], // no history → score 0
    }));
    const real = {
      trendKey: "genuine",
      trendName: "GENUINE",
      nominator: "0xREAL",
      engagements: [{ impact: 60, trustScore: 1 }],
    };
    const pooled = poolNominations([...brigade, real]);
    expect(pooled[0].trendKey).toBe("genuine");
    const astro = pooled.find((p) => p.trendKey === "astroturf");
    expect(astro?.weight).toBe(0);
    expect(astro?.nominators).toBe(50);
  });

  it("stacks weight and merges corpora across nominators of the same trend", () => {
    const pooled = poolNominations([
      { trendKey: "t", trendName: "T", nominator: "0x1", engagements: [{ impact: 30, trustScore: 0.8 }], corpus: ["a"] },
      { trendKey: "t", trendName: "T", nominator: "0x2", engagements: [{ impact: 30, trustScore: 0.8 }], corpus: ["a", "b"] },
    ]);
    expect(pooled).toHaveLength(1);
    expect(pooled[0].nominators).toBe(2);
    expect(pooled[0].corpus.sort()).toEqual(["a", "b"]);
    expect(pooled[0].weight).toBeGreaterThan(0);
  });

  it("keys on the trend key, not the display name", () => {
    const pooled = poolNominations([
      { trendKey: "t", trendName: "The Thing", nominator: "0x1" },
      { trendKey: "t", trendName: "THE THING", nominator: "0x2" },
    ]);
    expect(pooled).toHaveLength(1);
  });
});
