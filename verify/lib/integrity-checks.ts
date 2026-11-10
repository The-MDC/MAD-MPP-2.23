/**
 * Platform integrity checks — real ones (CF5).
 *
 * `components/logic-lab.tsx` used to carry a "Platform Integrity Checker" that played a hard-coded
 * list of fifteen log lines on a timer — "[MADx] Supply 888,888,888 — immutable ✓", "[Tournament]
 * 8-tier prize distribution → verified", "ALL SYSTEMS GREEN. Platform integrity: 100%" — whatever
 * the engine did. Nothing was checked. The supply line was also false (the deployed contract is
 * mutable and mint-on-purchase; MASTER PART 0 §3) and the prize line was never true as worded (the
 * ten published rank shares sum to 9,200 bps, not 10,000). A UI that prints "verified" without
 * verifying is the defect this repo keeps finding in its gates, so this module replaces it.
 *
 * Each check calls the same pure functions the server uses (`lib/gambit-game-math.ts`) and asserts a
 * property that is true by the canon — a conservation law, a monotonic ladder, a band — or a constant
 * that is locked. It deliberately does NOT assert anything the canon leaves open: the Shield's 60%
 * whale rung (removal awaits the founder), the $MADx sale figure, or the beta ledger's mint cap
 * (`lib/madx-supply-canon.test.ts` owns those).
 *
 * Pure and synchronous: safe to run on every click, in the browser or in a test.
 */
import {
  PHI,
  PLATFORM,
  RARITY_ORDER,
  RARITY_TABLE,
  STAKING_TIERS,
  TOURNAMENT_PRIZES_BPS,
  calculateDeltaLimit,
  kellyFraction,
  shieldPhiRatio,
  shieldPremium,
  splitFee,
} from "@/lib/gambit-game-math";

export interface IntegrityCheck {
  id: string;
  label: string;
  ok: boolean;
  /** What was actually compared — specific enough to act on when it fails. */
  detail: string;
}

type Outcome = { ok: boolean; detail: string };

/** A check that throws is a failed check, never a crashed page. */
function check(id: string, label: string, fn: () => Outcome): IntegrityCheck {
  try {
    const { ok, detail } = fn();
    return { id, label, ok, detail };
  } catch (e) {
    return { id, label, ok: false, detail: `threw: ${e instanceof Error ? e.message : String(e)}` };
  }
}

const close = (a: number, b: number, rel = 1e-9) => Math.abs(a - b) <= rel * Math.max(1, Math.abs(a), Math.abs(b));
const strictlyAscending = (xs: readonly number[]) => xs.every((x, i) => i === 0 || x > xs[i - 1]);

export function runIntegrityChecks(): IntegrityCheck[] {
  return [
    check("fee-rate", "Platform fee is 1.88% (188 bps)", () => ({
      ok: PLATFORM.FEE_BPS === 188,
      detail: `FEE_BPS = ${PLATFORM.FEE_BPS}`,
    })),

    check("fee-waterfall", "Fee waterfall conserves: creator + community + protocol = gross", () => {
      let worst = 0;
      let bad = "";
      for (const volume of [1, 1000, 123_456.78]) {
        for (const bps of [0, 2880, 4000, 6000]) {
          const s = splitFee(volume, bps);
          const drift = Math.abs(s.creatorCut + s.communityCut + s.protocolCut - s.grossFee);
          worst = Math.max(worst, drift / Math.max(1, s.grossFee));
          // Community is a share OF THE PLATFORM NET, not of the gross (the 2026-10 correction).
          if (!close(s.communityCut, s.platformNet * (PLATFORM.COMMUNITY_SHARE_BPS / 10_000))) {
            bad = `community cut is not ${PLATFORM.COMMUNITY_SHARE_BPS / 100}% of platform net at volume ${volume}, creator ${bps} bps`;
          }
        }
      }
      return { ok: worst < 1e-12 && !bad, detail: bad || `worst relative drift ${worst.toExponential(1)} over 12 splits` };
    }),

    check("shield-premium-band", "Shield premium stays inside 2–4% of stake", () => {
      const stake = 1000;
      let lo = Infinity;
      let hi = -Infinity;
      for (const p of [0.05, 0.5, 0.95]) {
        for (const v of [0, 0.01, 0.25, 4]) {
          const prem = shieldPremium(stake, p, v) / stake;
          lo = Math.min(lo, prem);
          hi = Math.max(hi, prem);
        }
      }
      return {
        ok: lo >= PLATFORM.SHIELD_PREMIUM_MIN - 1e-12 && hi <= PLATFORM.SHIELD_PREMIUM_MAX + 1e-12,
        detail: `observed ${(lo * 100).toFixed(2)}%–${(hi * 100).toFixed(2)}% over 12 (P, σ²) points`,
      };
    }),

    check("staking-ladder", "Staking tiers ascend, and Shield recovery tops out at 40%", () => {
      const ascending =
        strictlyAscending(STAKING_TIERS.map((t) => t.minMadx)) &&
        strictlyAscending(STAKING_TIERS.map((t) => t.apy)) &&
        strictlyAscending(STAKING_TIERS.map((t) => t.shieldRecoveryPct));
      const top = STAKING_TIERS[STAKING_TIERS.length - 1].shieldRecoveryPct;
      return { ok: ascending && top === 0.4, detail: `${STAKING_TIERS.length} tiers; top recovery ${top}` };
    }),

    check("rarity-ladder", "Rarity tiers ascend in power, clout and APY", () => {
      const t = RARITY_ORDER.map((r) => RARITY_TABLE[r]);
      return {
        ok:
          strictlyAscending(t.map((x) => x.powerScore)) &&
          strictlyAscending(t.map((x) => x.cloutMultiplier)) &&
          strictlyAscending(t.map((x) => x.stakingApy)),
        detail: `${RARITY_ORDER.length} tiers, ${RARITY_ORDER[0]} → ${RARITY_ORDER[RARITY_ORDER.length - 1]}`,
      };
    }),

    check("pack", "Card pack is 4.88 $MADx for 5 cards", () => ({
      ok: PLATFORM.CARD_PACK_COST === 4.88 && PLATFORM.CARD_PACK_SIZE === 5,
      detail: `${PLATFORM.CARD_PACK_COST} $MADx × ${PLATFORM.CARD_PACK_SIZE} cards`,
    })),

    check("supply-total", "Total $MADx supply constant is 888,888,888", () => ({
      ok: PLATFORM.MADX_FIXED_SUPPLY === 888_888_888,
      detail: `MADX_FIXED_SUPPLY = ${PLATFORM.MADX_FIXED_SUPPLY.toLocaleString("en-US")} (the total; the ledger's mint cap is a separate number)`,
    })),

    check("kelly", "Kelly fraction is 0 without an edge and never above 1", () => {
      const noEdge = kellyFraction(0.5, 1);
      const negative = kellyFraction(0.3, 1);
      const noOdds = kellyFraction(0.9, 0);
      const edge = kellyFraction(0.6, 1);
      return {
        ok: noEdge === 0 && negative === 0 && noOdds === 0 && edge > 0 && edge <= 1,
        detail: `no edge ${noEdge}, negative ${negative}, zero odds ${noOdds}, 60/40 at evens ${edge.toFixed(3)}`,
      };
    }),

    check("delta-limit", "δ-limit = π × multiplier × √stake, and grows with both", () => {
      const exact = calculateDeltaLimit(2, 400); // π · 2 · 20
      return {
        ok:
          close(exact, 2 * Math.PI * 20) &&
          calculateDeltaLimit(1, 0) === 0 &&
          calculateDeltaLimit(1, 100) < calculateDeltaLimit(1, 400) &&
          calculateDeltaLimit(1, 100) < calculateDeltaLimit(2, 100),
        detail: `δ(2, 400) = ${exact.toFixed(4)}`,
      };
    }),

    check("phi-recovery", "φ-shield recovery runs from tier×loss to tier×φ×loss, rising with volatility", () => {
      const loss = 1000;
      const flat = shieldPhiRatio(loss, 0, false);
      const full = shieldPhiRatio(loss, 1, false);
      const mid = shieldPhiRatio(loss, 0.5, false);
      return {
        ok: close(flat, 400) && close(full, 400 * PHI) && flat < mid && mid < full,
        detail: `standard: ${flat.toFixed(1)} → ${mid.toFixed(1)} → ${full.toFixed(1)} on a ${loss} loss`,
      };
    }),

    check("tournament-pool", "Tournament rank shares never exceed the pool", () => {
      const shares = Object.values(TOURNAMENT_PRIZES_BPS);
      const total = shares.reduce((s, n) => s + n, 0);
      return {
        ok: shares.every((n) => n >= 0) && total <= 10_000,
        detail: `${shares.length} ranks sum to ${total} bps of 10,000`,
      };
    }),
  ];
}
