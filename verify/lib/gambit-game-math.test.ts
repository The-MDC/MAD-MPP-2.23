/**
 * MAD Gambit — canon-lock test suite for the game math engine (S1.6).
 * ------------------------------------------------------------------
 * Acceptance from the master build: "test file asserts every canon
 * constant." If a number in here fails, someone changed canon without
 * founder sign-off — that is the bug, not the test.
 */
import { describe, it, expect } from "vitest";
import {
  PLATFORM,
  STAKING_TIERS,
  VIP_STATUS_MIN_MADX,
  CREATOR_LADDER,
  TRACTION_MIN_CONVICTION_MADX,
  creatorStatus,
  getStakingTier,
  VRS_TRIGGERS,
  VRS_REWARDS,
  LOSS_AVERSION,
  LUNAR_CYCLE_MS,
  IMMACULATE_CONCEPTION_EPOCH_MS,
  PHI,
  splitFee,
  shieldPremium,
  garchUpdate,
  garchSigma,
  garchAmplification,
  votingPower,
  zLiarMeter,
  isVrsTrigger,
} from "./gambit-game-math";

describe("canon lock — locked platform constants", () => {
  it("fee is 1.88% (188 bps) — never 1.888", () => {
    expect(PLATFORM.FEE_BPS).toBe(188);
  });
  it("community share is 28.8%", () => {
    expect(PLATFORM.COMMUNITY_SHARE_BPS).toBe(2880);
  });
  it("$MADx fixed supply is 888,888,888", () => {
    expect(PLATFORM.MADX_FIXED_SUPPLY).toBe(888_888_888);
  });
  it("Furnace burn cap is 4.9%", () => {
    expect(PLATFORM.FURNACE_BURN_CAP).toBe(0.049);
  });
  it("card pack is 4.88 $MADx for 5 cards", () => {
    expect(PLATFORM.CARD_PACK_COST).toBe(4.88);
    expect(PLATFORM.CARD_PACK_SIZE).toBe(5);
  });
  it("LMSR default b is 1200 (17-corrections #3)", () => {
    expect(PLATFORM.LMSR_DEFAULT_B).toBe(1200);
  });
  it("perp trigger threshold is 0.60 (17-corrections #2)", () => {
    expect(PLATFORM.PERP_TRIGGER_THRESHOLD).toBe(0.6);
  });
  it("Shield safety margin is 0.35 (17-corrections #4)", () => {
    expect(PLATFORM.SHIELD_SAFETY_MARGIN).toBe(0.35);
  });
  it("Shield opt-in fee clamp is 2%–4% of stake", () => {
    expect(PLATFORM.SHIELD_PREMIUM_MIN).toBe(0.02);
    expect(PLATFORM.SHIELD_PREMIUM_MAX).toBe(0.04);
  });
  it("GARCH canon: omega 0.0001, alpha 0.05, beta 0.90, amp 0.8, sigma in [0.09, 0.68]", () => {
    expect(PLATFORM.GARCH_OMEGA).toBe(0.0001);
    expect(PLATFORM.GARCH_ALPHA).toBe(0.05);
    expect(PLATFORM.GARCH_BETA).toBe(0.9);
    expect(PLATFORM.GARCH_AMP_COEFF).toBe(0.8);
    expect(PLATFORM.SIGMA_MIN).toBe(0.09);
    expect(PLATFORM.SIGMA_MAX).toBe(0.68);
  });
  it("vote power cap is 240 (not 24x)", () => {
    expect(PLATFORM.VOTE_POWER_CAP).toBe(240);
  });
  it("phi is the golden ratio", () => {
    expect(PHI).toBeCloseTo(1.618, 3);
  });
  it("lunar engine: cycle 2,551,442,877ms from the 1979-12-08 epoch", () => {
    expect(LUNAR_CYCLE_MS).toBe(2_551_442_877);
    expect(IMMACULATE_CONCEPTION_EPOCH_MS).toBe(313_459_200_000);
  });
});

describe("staking — 4-tier eights ladder (founder sign-off 31 Jul 2026)", () => {
  it("has exactly 4 tiers", () => {
    expect(STAKING_TIERS.length).toBe(4);
  });
  it("Bronze 88 / 8.88% APY / 28.8% recovery / no stoploss", () => {
    expect(STAKING_TIERS[0]).toMatchObject({ name: "Bronze", minMadx: 88, apy: 0.088, shieldRecoveryPct: 0.288, stoplossPct: 0.00 });
  });
  it("Silver 888 / 19.2% / 32.8% / 15% stoploss", () => {
    expect(STAKING_TIERS[1]).toMatchObject({ name: "Silver", minMadx: 888, apy: 0.192, shieldRecoveryPct: 0.328, stoplossPct: 0.15 });
  });
  it("Gold 8,888 / 29.6% / 36.8% / 10% stoploss", () => {
    expect(STAKING_TIERS[2]).toMatchObject({ name: "Gold", minMadx: 8_888, apy: 0.296, shieldRecoveryPct: 0.368, stoplossPct: 0.10 });
  });
  it("MAD Tier 88,888 / 40.0% / 40.0% / 5% stoploss — the Shield ceiling", () => {
    expect(STAKING_TIERS[3]).toMatchObject({ name: "MAD Tier", minMadx: 88_888, apy: 0.400, shieldRecoveryPct: 0.40, stoplossPct: 0.05 });
  });
  it("getStakingTier returns stoploss activation status", () => {
    // Bronze (first level): no stoploss protection
    const bronze = getStakingTier(100); // Bronze starts at 88 $MADx; 50 is below every tier (returns null)
    expect(bronze?.stoplossActive).toBe(false);
    // Silver: 15% stoploss threshold
    const silver = getStakingTier(2000);
    expect(silver?.stoplossActive).toBe(true);
    expect(silver?.stoplossPct).toBe(0.15);
    // Gold: 10% stoploss threshold
    const gold = getStakingTier(10000);
    expect(gold?.stoplossActive).toBe(true);
    expect(gold?.stoplossPct).toBe(0.10);
    // MAD Tier: 5% stoploss threshold
    const madTier = getStakingTier(100000);
    expect(madTier?.stoplossActive).toBe(true);
    expect(madTier?.stoplossPct).toBe(0.05);
  });
  it("VIP status gate is 888,888 $MADx with 60% recovery above the ladder", () => {
    expect(VIP_STATUS_MIN_MADX).toBe(888_888);
    expect(PLATFORM.SHIELD_RECOVERY_WHALE_PCT).toBe(0.6);
  });
});

describe("creator ladder — 28.8% → 40% → 60% on the creator's own markets", () => {
  it("three rungs with canonical shares and unlocks", () => {
    expect(CREATOR_LADDER.length).toBe(3);
    expect(CREATOR_LADDER[0]).toMatchObject({ status: "User", shareBps: 2880, unlockMarkets: 0 });
    expect(CREATOR_LADDER[1]).toMatchObject({ status: "MinorCreator", shareBps: 4000, unlockMarkets: 12 });
    expect(CREATOR_LADDER[2]).toMatchObject({ status: "CR8TR", shareBps: 6000, unlockMarkets: 34, unlockFollowers: 888 });
  });
  it("traction gate equals the LMSR b (1,200 $MADx conviction)", () => {
    expect(TRACTION_MIN_CONVICTION_MADX).toBe(PLATFORM.LMSR_DEFAULT_B);
  });
  it("creatorStatus climbs the ladder correctly", () => {
    expect(creatorStatus(0, 0).status).toBe("User");
    expect(creatorStatus(12, 0).status).toBe("MinorCreator");
    expect(creatorStatus(34, 887).status).toBe("MinorCreator"); // followers gate holds
    expect(creatorStatus(34, 888).status).toBe("CR8TR");
  });
});

describe("splitFee — ladder-aware non-additive split", () => {
  it("platform market: no creator cut, 28.8% community", () => {
    const s = splitFee(10_000, 0);
    expect(s.grossFee).toBeCloseTo(188, 6);
    expect(s.creatorCut).toBe(0);
    expect(s.communityCut).toBeCloseTo(188 * 0.288, 6);
    expect(s.protocolCut).toBeCloseTo(188 - 188 * 0.288, 6);
  });
  it("creator cut follows the rung passed in (User / MinorCreator / CR8TR)", () => {
    expect(splitFee(10_000, CREATOR_LADDER[0].shareBps).creatorCut).toBeCloseTo(188 * 0.288, 6);
    expect(splitFee(10_000, CREATOR_LADDER[1].shareBps).creatorCut).toBeCloseTo(188 * 0.4, 6);
    expect(splitFee(10_000, CREATOR_LADDER[2].shareBps).creatorCut).toBeCloseTo(188 * 0.6, 6);
  });
  it("cuts never exceed the gross fee", () => {
    const s = splitFee(10_000, 6000);
    expect(s.creatorCut + s.communityCut).toBeLessThanOrEqual(s.grossFee + 1e-9);
  });
});

describe("shieldPremium — Stake · P(win) · sigma · 0.35, clamped 2%–4% of stake", () => {
  it("mid-range inputs land inside the clamp untouched", () => {
    // stake 1000, pWin 0.5, sigma 0.2 (variance 0.04) -> 1000*0.5*0.2*0.35 = 35 (3.5%)
    expect(shieldPremium(1000, 0.5, 0.04)).toBeCloseTo(35, 6);
  });
  it("clamps low to 2% of stake", () => {
    // tiny sigma -> raw far below 2%
    expect(shieldPremium(1000, 0.5, 0.0001)).toBeCloseTo(20, 6);
  });
  it("clamps high to 4% of stake", () => {
    // big sigma + high pWin -> raw above 4%
    expect(shieldPremium(1000, 0.9, 0.45)).toBeCloseTo(40, 6);
  });
  it("uses 0.35, not the retired 1.05 multiplier", () => {
    const raw = 1000 * 0.5 * Math.sqrt(0.04);
    expect(shieldPremium(1000, 0.5, 0.04)).toBeCloseTo(raw * 0.35, 6);
  });
});

describe("GARCH — canonical parameters, sigma-space clamp, amplification", () => {
  it("garchUpdate falls back to canon params on bad input", () => {
    const v = garchUpdate(NaN, NaN, NaN, 0.04, 0.1);
    expect(v).toBeCloseTo(0.0001 + 0.05 * 0.01 + 0.9 * 0.04, 9);
  });
  it("garchSigma stays clamped to [0.09, 0.68]", () => {
    expect(garchSigma(0.0, 0.0)).toBeCloseTo(0.09, 9); // floor
    expect(garchSigma(5, 5)).toBeCloseTo(0.68, 9); // ceiling
    const mid = garchSigma(0.3, 0.1);
    expect(mid).toBeGreaterThanOrEqual(0.09);
    expect(mid).toBeLessThanOrEqual(0.68);
  });
  it("amplification is 1 + 0.8·sigma, capped at 1.544", () => {
    expect(garchAmplification(0.3)).toBeCloseTo(1.24, 9);
    expect(garchAmplification(99)).toBeCloseTo(1 + 0.8 * 0.68, 9); // 1.544
  });
});

describe("Z-Liar — canonical verdict bands", () => {
  it("band ladder is STRAIGHT SHOOTER / MOSTLY CANDID / SLIPPERY / SERIAL EMBELLISHER / TOTAL FABRICATION", () => {
    // nowMs pinned to the epoch (lunar tilt 0) + zero variance so the band
    // read is deterministic regardless of the real moon.
    const low = zLiarMeter({
      narrativeVariance: 0, sourceCredibility: 1, corroboration: 1,
      prevVariance: 0, nowMs: IMMACULATE_CONCEPTION_EPOCH_MS,
    });
    expect(low.verdict).toBe("STRAIGHT SHOOTER");
    const high = zLiarMeter({ narrativeVariance: 1, sourceCredibility: 0, corroboration: 0 });
    expect(high.verdict).toBe("TOTAL FABRICATION");
    // Mid-band names must be the canonical trio — never SPIN ZONE / SUS / CAP DETECTED.
    const mids: string[] = [];
    for (let v = 0; v <= 1; v += 0.05) {
      mids.push(zLiarMeter({ narrativeVariance: v, sourceCredibility: 1 - v, corroboration: 0.5 }).verdict);
    }
    expect(mids).not.toContain("SPIN ZONE");
    expect(mids).not.toContain("SUS");
    expect(mids).not.toContain("CAP DETECTED");
  });
});

describe("VRS — Fibonacci reward schedule", () => {
  it("triggers are [5, 8, 13, 21, 34]", () => {
    expect([...VRS_TRIGGERS]).toEqual([5, 8, 13, 21, 34]);
  });
  it("rewards map Fibonacci in → Fibonacci out", () => {
    expect(VRS_REWARDS).toEqual({ 5: 8, 8: 13, 13: 21, 21: 34, 34: 55 });
  });
  it("isVrsTrigger fires only on the sequence", () => {
    expect(isVrsTrigger(5)).toBe(true);
    expect(isVrsTrigger(6)).toBe(false);
    expect(isVrsTrigger(34)).toBe(true);
  });
  it("loss aversion is 2.5", () => {
    expect(LOSS_AVERSION).toBe(2.5);
  });
});

describe("votingPower — min(√stake, 240)", () => {
  it("square-roots small stakes", () => {
    expect(votingPower(10_000)).toBe(100);
  });
  it("caps at 240", () => {
    expect(votingPower(100_000_000)).toBe(240);
  });
  it("handles junk safely", () => {
    expect(votingPower(-5)).toBe(0);
    expect(votingPower(NaN)).toBe(0);
  });
});
