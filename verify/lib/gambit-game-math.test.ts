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
  zLiarVerdictFor,
  ZLIAR_BANDS,
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
  it("Bronze 88 / 8.8% APY / 28.8% recovery", () => {
    expect(STAKING_TIERS[0]).toMatchObject({ name: "Bronze", minMadx: 88, apy: 0.088, shieldRecoveryPct: 0.288 });
  });
  it("Silver 888 / 18.8% / 32.8%", () => {
    expect(STAKING_TIERS[1]).toMatchObject({ name: "Silver", minMadx: 888, apy: 0.188, shieldRecoveryPct: 0.328 });
  });
  it("Gold 8,888 / 28.8% / 36.8%", () => {
    expect(STAKING_TIERS[2]).toMatchObject({ name: "Gold", minMadx: 8_888, apy: 0.288, shieldRecoveryPct: 0.368 });
  });
  it("MAD Tier 88,888 / 38.8% / 40.0% — the Shield ceiling", () => {
    expect(STAKING_TIERS[3]).toMatchObject({ name: "MAD Tier", minMadx: 88_888, apy: 0.388, shieldRecoveryPct: 0.4 });
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
    // Platform-made market: no creator, so net == gross and the community
    // takes 28.8% of the whole rake.
    const s = splitFee(10_000, 0);
    expect(s.grossFee).toBeCloseTo(188, 6);
    expect(s.creatorCut).toBe(0);
    expect(s.platformNet).toBeCloseTo(188, 6);
    expect(s.communityCut).toBeCloseTo(188 * 0.288, 6);
    expect(s.protocolCut).toBeCloseTo(188 - 188 * 0.288, 6);
  });

  it("creator cut follows the rung passed in (User / MinorCreator / CR8TR)", () => {
    expect(splitFee(10_000, CREATOR_LADDER[0].shareBps).creatorCut).toBeCloseTo(188 * 0.288, 6);
    expect(splitFee(10_000, CREATOR_LADDER[1].shareBps).creatorCut).toBeCloseTo(188 * 0.4, 6);
    expect(splitFee(10_000, CREATOR_LADDER[2].shareBps).creatorCut).toBeCloseTo(188 * 0.6, 6);
  });

  it("community is 28.8% of NET, not of gross — the two-stage waterfall", () => {
    // Founder, 2026-08-27: flat 1.88% rake; community is 28.8% of NET profits;
    // creator earns only on their own markets. The worked example canon gives:
    // 10,000 volume at the 40% rung -> gross 188, creator 75.20, net 112.80,
    // community 32.4864, protocol 80.3136.
    const s = splitFee(10_000, 4000);
    expect(s.grossFee).toBeCloseTo(188, 6);
    expect(s.creatorCut).toBeCloseTo(75.2, 6);
    expect(s.platformNet).toBeCloseTo(112.8, 6);
    expect(s.communityCut).toBeCloseTo(32.4864, 6);
    expect(s.protocolCut).toBeCloseTo(80.3136, 6);
  });

  it("the community cut is 17.28% of gross on a 40% creator market", () => {
    const s = splitFee(10_000, 4000);
    expect((s.communityCut / s.grossFee) * 100).toBeCloseTo(17.28, 6);
  });

  it("REGRESSION: the old gross-based cut over-allocated by 11.52pp of gross", () => {
    // Guards the exact bug docs/boardy/CANONICAL_NUMBERS_2026-08-19.md logged.
    // If someone reverts the base to grossFee, this is the number that moves.
    const s = splitFee(10_000, 4000);
    const oldCommunity = s.grossFee * 0.288;
    expect(((oldCommunity - s.communityCut) / s.grossFee) * 100).toBeCloseTo(11.52, 6);
  });

  it("every part reconciles back to the gross fee, at every rung", () => {
    for (const bps of [0, 2880, 4000, 6000]) {
      const s = splitFee(10_000, bps);
      expect(s.creatorCut + s.platformNet).toBeCloseTo(s.grossFee, 9);
      expect(s.communityCut + s.protocolCut).toBeCloseTo(s.platformNet, 9);
      expect(s.creatorCut + s.communityCut + s.protocolCut).toBeCloseTo(s.grossFee, 9);
    }
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

describe("canon lock — the numbers the product quotes in public", () => {
  // MUTATION-DRIVEN. A sweep over every numeric in PLATFORM found these five
  // unguarded: each could be changed to any value and the whole suite stayed
  // green. They are not internal tuning knobs — node-registry.ts prints them
  // to users ("888,888,888 fixed", "the deck is 992 deep", "seed 8888",
  // "Recovery 28.8 / 40 / 60%"), so a silent drift here is a silent lie on a
  // card. Pinned to literals, deliberately duplicating the source: that
  // duplication IS the lock.
  it("Shield recovery tiers are 28.8% / 40% / 60%", () => {
    expect(PLATFORM.SHIELD_RECOVERY_PCT).toBe(0.288);
    expect(PLATFORM.SHIELD_RECOVERY_PREMIUM_PCT).toBe(0.40);
    expect(PLATFORM.SHIELD_RECOVERY_WHALE_PCT).toBe(0.60);
  });

  it("the deck is 992 deep, seeded 8888, and slot 0 is the guarantee", () => {
    expect(PLATFORM.TOTAL_DECK_SIZE).toBe(992);
    expect(PLATFORM.CARD_GENERATION_SEED).toBe(8888);
    expect(PLATFORM.PACK_GUARANTEE_SLOT).toBe(0);
  });

  it("CREATOR_SHARE_BPS is the MinorCreator rung and agrees with the ladder", () => {
    // Legacy default, still exported and still reachable. It must not drift
    // away from the rung it claims to mirror.
    expect(PLATFORM.CREATOR_SHARE_BPS).toBe(4000);
    const minor = CREATOR_LADDER.find((r) => r.status === "MinorCreator");
    expect(minor?.shareBps).toBe(PLATFORM.CREATOR_SHARE_BPS);
  });
});

describe("Z-Liar — band boundaries are canon, not just the names", () => {
  // MUTATION-DRIVEN. The suite pinned the two EXTREMES and the band NAMES, so
  // moving a boundary (60 -> 55, 80 -> 70, 40 -> 30) changed no test at all.
  // That is exactly how perp-dials.tsx came to carry its own ladder with the
  // thresholds at 38 and 84 — a score of 39 printing "Mostly candid" over a
  // needle the engine called SLIPPERY. Every edge is pinned to a literal now.
  it("opens each band at exactly 20 / 40 / 60 / 80", () => {
    expect(zLiarVerdictFor(0)).toBe("STRAIGHT SHOOTER");
    expect(zLiarVerdictFor(19.999)).toBe("STRAIGHT SHOOTER");
    expect(zLiarVerdictFor(20)).toBe("MOSTLY CANDID");
    expect(zLiarVerdictFor(39.999)).toBe("MOSTLY CANDID");
    expect(zLiarVerdictFor(40)).toBe("SLIPPERY");
    expect(zLiarVerdictFor(59.999)).toBe("SLIPPERY");
    expect(zLiarVerdictFor(60)).toBe("SERIAL EMBELLISHER");
    expect(zLiarVerdictFor(79.999)).toBe("SERIAL EMBELLISHER");
    expect(zLiarVerdictFor(80)).toBe("TOTAL FABRICATION");
    expect(zLiarVerdictFor(100)).toBe("TOTAL FABRICATION");
  });

  it("ZLIAR_BANDS is the single table, descending, with those exact edges", () => {
    expect(ZLIAR_BANDS.map((b) => b.min)).toEqual([80, 60, 40, 20, 0]);
    expect(ZLIAR_BANDS.map((b) => b.verdict)).toEqual([
      "TOTAL FABRICATION", "SERIAL EMBELLISHER", "SLIPPERY", "MOSTLY CANDID", "STRAIGHT SHOOTER",
    ]);
  });

  it("zLiarMeter's own verdict agrees with the table for the same score", () => {
    const r = zLiarMeter({ narrativeVariance: 1, sourceCredibility: 0, corroboration: 0 });
    expect(r.verdict).toBe(zLiarVerdictFor(r.score));
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
