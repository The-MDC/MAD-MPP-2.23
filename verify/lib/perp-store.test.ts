import { describe, expect, it } from "vitest";
import { convictionCost } from "./perp-store";
import { PLATFORM, splitFee } from "./gambit-game-math";
import { round6 } from "./madx-web2";

/**
 * Conviction used to be free.
 *
 * `stakeConviction` wrote `perp_positions.conviction`, bumped
 * `perp_markets.volume`, and debited nothing — on every perp family, for every
 * wallet. `market-book.fill()` debited the ledger for a market swap, so the
 * platform ran two kinds of money and the perp deck used the imaginary one.
 *
 * These lock the arithmetic now that it costs something. They test
 * `convictionCost`, the pure half, because the transactional half needs a live
 * `Pool` and cannot run here — which is exactly why the fee maths was split out
 * rather than left inside the transaction where no test could reach it.
 *
 * THIS FILE MUST STAY UNDER `lib/`. vitest's `include` is
 * `["lib/**\/*.test.ts"]`, so the same file one directory up would silently
 * never run, and a money test that does not run is worse than no test.
 */
describe("convictionCost — the §6 fee on a perp stake", () => {
  it("charges the canonical 1.88% and nothing else", () => {
    const c = convictionCost(1000);
    expect(c).not.toBeNull();
    // 1.88% of 1000. Written as a literal on purpose: if PLATFORM.FEE_BPS moves
    // without founder sign-off, this fails loudly rather than tracking it.
    expect(c!.fee).toBe(18.8);
    expect(c!.net).toBe(981.2);
    expect(c!.spend).toBe(1000);
  });

  it("derives the fee from §6's splitFee, not a second fee model", () => {
    // The whole point of T1: one fee engine. If someone reimplements the cut
    // locally, this diverges.
    for (const amount of [1, 7.5, 250, 8888, 1_000_000]) {
      const c = convictionCost(amount)!;
      expect(c.fee).toBe(round6(splitFee(amount, 0).grossFee));
      expect(c.split).toEqual(splitFee(amount, 0));
    }
  });

  it("conserves value exactly — net + fee is the gross, to ledger precision", () => {
    // The residue check. The ledger rounds to 6dp; if net and fee were rounded
    // independently against an unrounded gross, the difference would land
    // nowhere and only surface as a reconciliation mismatch much later.
    for (const amount of [1, 3.33, 19.99, 1234.567891, 99_999.999999]) {
      const c = convictionCost(amount)!;
      expect(round6(c.net + c.fee)).toBe(round6(c.spend));
    }
  });

  it("takes no creator cut, because a perp slot has no per-market creator", () => {
    // ZEITGEIST slots and EPIPHANY models are platform-authored. When
    // creator-authored perps land, creatorShareBps is the one argument that
    // changes — and this test is what will catch it being forgotten.
    const c = convictionCost(1000)!;
    expect(c.split.creatorCut).toBe(0);
    expect(c.split.platformNet).toBe(c.split.grossFee);
  });

  it("splits the platform net 28.8% community / remainder protocol", () => {
    const c = convictionCost(1000)!;
    const net = c.split.platformNet;
    expect(c.split.communityCut).toBeCloseTo(net * 0.288, 9);
    expect(c.split.protocolCut).toBeCloseTo(net - c.split.communityCut, 9);
    // Recorded, never distributed: §13 item 7 — whether 28.8% community means
    // "of the fee" or "of platform net" — is an open founder question, and this
    // layer must not decide it by writing a destination.
    expect(c.split.communityCut + c.split.protocolCut).toBeCloseTo(net, 9);
  });

  it("refuses anything that is not a positive finite amount", () => {
    for (const bad of [0, -1, -0.000001, NaN, Infinity, -Infinity]) {
      expect(convictionCost(bad)).toBeNull();
    }
  });

  it("refuses a stake so small the fee would consume all of it", () => {
    // Without this, a dust stake writes a zero-conviction position and still
    // takes the money — the worst of both outcomes.
    expect(convictionCost(0.0000001)).toBeNull();
  });

  it("refuses the band where the fee itself rounds away to nothing", () => {
    // Found by writing this suite, not by reading the code: at 0.00001 the net
    // survives round6 but 1.88% of it does not, so the stake would land having
    // paid NO fee. A fee-free band at the bottom is a second money model with
    // extra steps, which is the exact thing T1 exists to remove.
    expect(convictionCost(0.00001)).toBeNull();
    // Just above the floor it works, and the fee is real.
    const ok = convictionCost(0.0001)!;
    expect(ok).not.toBeNull();
    expect(ok.fee).toBeGreaterThan(0);
  });

  it("is monotonic — more conviction never buys less net", () => {
    let prev = 0;
    for (const amount of [1, 2, 10, 100, 1000, 10_000]) {
      const net = convictionCost(amount)!.net;
      expect(net).toBeGreaterThan(prev);
      prev = net;
    }
  });
});

describe("the fee rate is canon, not a local choice", () => {
  it("reads PLATFORM.FEE_BPS as 188 bps", () => {
    // gambit-game-math.test.ts is the canon-lock suite; this is the one
    // assertion repeated here, because every number above depends on it and a
    // silent change would make the rest of this file pass while being wrong.
    expect(PLATFORM.FEE_BPS).toBe(188);
  });
});
