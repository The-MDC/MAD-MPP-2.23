/**
 * Pitch canon — every worked number in the founder's "One Engine, 13 Sections
 * of Maths" brief (2026-10-27), recomputed from the engine. If a slide and the
 * code ever disagree again, this file goes red instead of the meeting.
 */
import { describe, it, expect } from "vitest";
import {
  PLATFORM,
  STAKING_TIERS,
  CREATOR_LADDER,
  VIP_PROFIT_SHARE_BPS,
  VIP_PROFIT_SHARE_SEATS,
  RARITY_DROP_WEIGHTS,
  RARITY_TABLE,
  DECK_COMPOSITION,
  MAX_NFT_CLOUT,
  splitFee,
  shieldPremium,
  garchAmplification,
  calculateStakingYield,
  getLunarPhaseMultiplier,
  LUNAR_CYCLE_MS,
  IMMACULATE_CONCEPTION_EPOCH_MS,
  calculateVictoryProbability,
  votingPower,
  quadraticMatch,
  bsIndex,
} from "@/lib/gambit-game-math";
import { perpTriggerProbability, EMOTION_WEIGHTS } from "@/lib/gdelt";
import { maxMakerLoss } from "@/lib/open-markets";
import { FRONTIER_B, FRONTIER_MIN, FRONTIER_MAX } from "@/lib/paseome";
import { LEG_DAYS, LEGS_PER_TURNING } from "@/lib/lunar-legs";

const r2 = (x: number) => Math.round(x * 100) / 100;

describe("§1 canonical constants", () => {
  it("fee, shares, supply, burn, packs", () => {
    expect(PLATFORM.FEE_BPS).toBe(188);
    expect(CREATOR_LADDER[0].shareBps).toBe(2880);
    expect(CREATOR_LADDER[1].shareBps).toBe(4000);
    expect(VIP_PROFIT_SHARE_BPS).toBe(6000);
    expect(VIP_PROFIT_SHARE_SEATS).toBe(4888);
    expect(PLATFORM.COMMUNITY_SHARE_BPS).toBe(2880);
    expect(PLATFORM.SHIELD_RECOVERY_PCT).toBe(0.288);
    expect(PLATFORM.SHIELD_RECOVERY_PREMIUM_PCT).toBe(0.4);
    expect([PLATFORM.SHIELD_PREMIUM_MIN, PLATFORM.SHIELD_PREMIUM_MAX]).toEqual([0.02, 0.04]);
    expect(PLATFORM.MADX_FIXED_SUPPLY).toBe(888_888_888);
    expect(PLATFORM.FURNACE_BURN_CAP).toBe(0.049);
    expect([PLATFORM.CARD_PACK_COST, PLATFORM.CARD_PACK_SIZE]).toEqual([4.88, 5]);
    expect([PLATFORM.TOTAL_DECK_SIZE, PLATFORM.CARD_GENERATION_SEED]).toEqual([992, 8888]);
  });

  it("the eights ladder and its Shield caps", () => {
    expect(STAKING_TIERS.map((t) => [t.minMadx, t.apy, t.shieldRecoveryPct])).toEqual([
      [88, 0.088, 0.288],
      [888, 0.188, 0.328],
      [8_888, 0.288, 0.368],
      [88_888, 0.388, 0.4],
    ]);
  });
});

describe("§2 conviction, GARCH, Paseome", () => {
  it("GARCH clamp maps to 1.07× – 1.54× amplification", () => {
    expect(r2(garchAmplification(PLATFORM.SIGMA_MIN))).toBe(1.07);
    expect(r2(garchAmplification(PLATFORM.SIGMA_MAX))).toBe(1.54);
  });

  it("maker worst case b·ln n = 1,318 / 1,664 / 1,931 at b = 1,200, for 3–5 branches", () => {
    expect(FRONTIER_B).toBe(1200);
    expect([FRONTIER_MIN, FRONTIER_MAX]).toEqual([3, 5]);
    expect([3, 4, 5].map((n) => Math.round(maxMakerLoss(n, FRONTIER_B)))).toEqual([1318, 1664, 1931]);
  });

  it("a leg is 59.061 days and six legs make a Turning", () => {
    expect(LEG_DAYS).toBeCloseTo(59.061, 3);
    expect(LEGS_PER_TURNING).toBe(6);
    expect(LUNAR_CYCLE_MS / 86_400_000).toBeCloseTo(29.530588853, 6);
  });
});

describe("§3 Z-Liar and the perp trigger", () => {
  it("BS index weights", () => {
    expect(bsIndex(1, 0, 0)).toBe(100);
    expect(r2(bsIndex(0.5, 0.5, 0))).toBe(50);
    expect(bsIndex(0, 1, 1)).toBe(0);
  });

  it("emotion weights", () => {
    expect(EMOTION_WEIGHTS).toEqual({ shame: 1.8, anger: 1.4, disgust: 1.3, fear: 1.2, sadness: 1.0, joy: -0.5 });
  });

  it("eight matches give 0.865, twelve give 0.950", () => {
    const p = (m: number) => perpTriggerProbability({ personMatches: m, themeScandalWeight: 1, scandalVelocity: 0 });
    expect(Math.round(p(8) * 1000) / 1000).toBe(0.865);
    expect(Math.round(p(12) * 1000) / 1000).toBe(0.95);
  });
});

describe("§5 MAD Shield", () => {
  it("stake 100, P(win) 0.5, σ 0.20 → 3.5 $MADx, inside 2–4%", () => {
    expect(r2(shieldPremium(100, 0.5, 0.2 * 0.2))).toBe(3.5);
    expect(shieldPremium(100, 0.99, 0.68 * 0.68)).toBe(4); // ceiling
    expect(shieldPremium(100, 0.01, 0.09 * 0.09)).toBe(2); // floor
  });
});

describe("§6 fee waterfall — per 10,000 $MADx, every row sums to 188.00", () => {
  const rows: Array<[string, number, number, number, number]> = [
    ["platform-offered", 0, 0.0, 54.14, 133.86],
    ["User rung 28.8%", 2880, 54.14, 38.55, 95.31],
    ["MinorCreator rung 40%", 4000, 75.2, 32.49, 80.31],
    ["VIP seat 60%", 6000, 112.8, 21.66, 53.54],
  ];
  for (const [name, bps, creator, community, protocol] of rows) {
    it(name, () => {
      const s = splitFee(10_000, bps);
      expect(r2(s.grossFee)).toBe(188);
      expect(r2(s.creatorCut)).toBe(creator);
      expect(r2(s.communityCut)).toBe(community);
      expect(r2(s.protocolCut)).toBe(protocol);
      expect(r2(s.creatorCut + s.communityCut + s.protocolCut)).toBe(188);
    });
  }

  it("$100K of monthly volume at the 40% rung pays its creator $752", () => {
    expect(r2(splitFee(100_000, 4000).creatorCut)).toBe(752);
  });
});

describe("§7 staking yield", () => {
  it("clout lifts the tier rate up to 2×: MAD Tier tops out at 77.6%, not 68.6%", () => {
    expect(r2(calculateStakingYield(38.8, MAX_NFT_CLOUT))).toBe(77.6);
    expect(r2(calculateStakingYield(38.8, 100))).toBe(58.2);
    expect(calculateStakingYield(38.8, 0)).toBe(38.8);
  });

  it("clout is clamped to 0–200, so no caller can quote more than 2×", () => {
    expect(r2(calculateStakingYield(38.8, 10_000))).toBe(77.6);
    expect(calculateStakingYield(38.8, -50)).toBe(38.8);
    expect(calculateStakingYield(38.8, Number.NaN)).toBe(38.8);
  });
});

describe("§8 card economy", () => {
  it("the deck composition sums to 992, 8 factions × 14 base", () => {
    const d = DECK_COMPOSITION;
    expect(d.base).toBe(d.factions * 14);
    expect(d.base + d.crossovers + d.chaosFusions + d.legendaryCrossovers + d.goldenPanderverse).toBe(PLATFORM.TOTAL_DECK_SIZE);
  });

  it("drop weights per 1,000 and the 1,136× power span", () => {
    expect(RARITY_DROP_WEIGHTS).toEqual({ Common: 568, Uncommon: 236, Rare: 120, Epic: 60, Legendary: 10, "Golden Hand": 6 });
    expect(Object.values(RARITY_DROP_WEIGHTS).reduce((a, b) => a + b, 0)).toBe(1000);
    expect(RARITY_TABLE.Common.powerScore).toBe(88);
    expect(RARITY_TABLE.Mythic.powerScore).toBe(99_999);
    expect(Math.floor(RARITY_TABLE.Mythic.powerScore / RARITY_TABLE.Common.powerScore)).toBe(1136);
  });
});

describe("§9 governance", () => {
  it("voting power is √stake capped at 240 — at most 24× a 100-$MADx holder", () => {
    expect(votingPower(100)).toBe(10);
    expect(votingPower(1e12)).toBe(240);
    expect(votingPower(1e12) / votingPower(100)).toBe(24);
  });

  it("quadratic funding: total (Σ√c)², the match is that minus what was given", () => {
    // four people giving 1 each → total 16, match 12
    expect(quadraticMatch([1, 1, 1, 1])).toBe(12);
    // one whale giving 4 → total 4, match 0
    expect(quadraticMatch([4])).toBe(0);
  });
});

describe("§11 PvP and §12 lunar", () => {
  it("PvP win chance is held to 0.12–0.88", () => {
    const c = { powerLevel: 0, stage: 1, durability: 1, cloutMultiplier: 1 };
    expect(calculateVictoryProbability(c, c)).toBe(0.5);
    expect(calculateVictoryProbability({ ...c, powerLevel: 99_999 }, c)).toBe(0.88);
    expect(calculateVictoryProbability(c, { ...c, powerLevel: 99_999 })).toBe(0.12);
  });

  it("the moon runs 1.00 at new to 1.15 at full", () => {
    expect(getLunarPhaseMultiplier(IMMACULATE_CONCEPTION_EPOCH_MS)).toBeCloseTo(1.0, 10);
    expect(getLunarPhaseMultiplier(IMMACULATE_CONCEPTION_EPOCH_MS + LUNAR_CYCLE_MS / 2)).toBeCloseTo(1.15, 10);
  });
});
