/**
 * The madgambit.io fee calculator (site/calc.js) must equal the engine's splitFee
 * on every input, or the public site could quote a number the product does not pay.
 */
import { describe, it, expect } from "vitest";
import { splitFee, PLATFORM } from "@/lib/gambit-game-math";
import { splitFee as siteSplitFee, CREATOR_RUNGS, FEE_BPS, COMMUNITY_SHARE_BPS } from "../../site/calc.js";

describe("site fee calculator mirrors splitFee", () => {
  it("uses the canonical constants", () => {
    expect(FEE_BPS).toBe(PLATFORM.FEE_BPS);
    expect(COMMUNITY_SHARE_BPS).toBe(PLATFORM.COMMUNITY_SHARE_BPS);
  });

  it("matches the engine across volumes and every public rung", () => {
    const volumes = [0, 1, 10, 188, 1_000, 10_000, 123_456.78, 5_000_000];
    for (const v of volumes) {
      for (const rung of CREATOR_RUNGS) {
        const a = splitFee(v, rung.bps);
        const b = siteSplitFee(v, rung.bps);
        expect(b.grossFee).toBeCloseTo(a.grossFee, 9);
        expect(b.creatorCut).toBeCloseTo(a.creatorCut, 9);
        expect(b.platformNet).toBeCloseTo(a.platformNet, 9);
        expect(b.communityCut).toBeCloseTo(a.communityCut, 9);
        expect(b.protocolCut).toBeCloseTo(a.protocolCut, 9);
      }
    }
  });

  it("the headline figure: $18.80 per $1,000", () => {
    expect(siteSplitFee(1_000).grossFee).toBeCloseTo(18.8, 9);
  });

  it("conserves the fee on every rung", () => {
    for (const rung of CREATOR_RUNGS) {
      const s = siteSplitFee(10_000, rung.bps);
      expect(s.creatorCut + s.communityCut + s.protocolCut).toBeCloseTo(s.grossFee, 9);
    }
  });
});
