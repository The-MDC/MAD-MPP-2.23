/**
 * Staking as a REVENUE SHARE, not a promised rate (remediation item 6, 2026-11-10).
 *
 * The old `STAKING_TIERS` in gambit-game-math.ts publish APYs of 8.8% to 38.8% against a 1.88% rake: a rate with no
 * revenue behind it is a promise that compounds from day one. This module is the funded replacement:
 *
 *   budget      = 8.88% of NET protocol revenue for the period (net = after the rake, creator share, community share)
 *   weight      = 0.88 / 1.88 / 2.88 / 3.88 by lock length, which also sets governance weight (1x, 2x, 3x, 5x)
 *   payout_i    = budget · (w_i · s_i) / Σ(w_j · s_j)
 *   rate_i      = budget / Σ(w_j · s_j) · w_i          (the same for everyone in a tier; falls as total weighted stake rises)
 *
 * INVARIANT: total distributions in a period ≤ 8.88% of net revenue for that period. Never a fixed rate, never a floor,
 * never paid from reserve to make a number look stable. A period with zero (or negative) net revenue distributes nothing.
 *
 * A rate is only ever quoted together with the weighted stake base it was computed at (`impliedRate` returns both).
 *
 * Pure and dependency-free. Not wired into any route or UI: it replaces `STAKING_TIERS` when you choose to switch.
 */
export const STAKING_BUDGET_SHARE = 0.0888;

export interface StakeTier {
  readonly tier: 1 | 2 | 3 | 4;
  readonly name: string;
  /** Lock length in lunar legs; 0 = flexible. */
  readonly lockLegs: number;
  readonly weight: number;
  /** Governance multiplier: 1x, 2x, 3x, 5x. */
  readonly governance: number;
}

export const STAKE_TIERS: readonly StakeTier[] = [
  { tier: 1, name: "Flexible", lockLegs: 0, weight: 0.88, governance: 1 },
  { tier: 2, name: "3 lunar legs", lockLegs: 3, weight: 1.88, governance: 2 },
  { tier: 3, name: "6 legs, one Turning", lockLegs: 6, weight: 2.88, governance: 3 },
  { tier: 4, name: "12 legs, two Turnings", lockLegs: 12, weight: 3.88, governance: 5 },
];

export interface Staker {
  id: string;
  tier: 1 | 2 | 3 | 4;
  /** Staked amount, in MADx. */
  amount: number;
}

const tierOf = (n: number): StakeTier | undefined => STAKE_TIERS.find((t) => t.tier === n);
const clean = (n: number): number => (Number.isFinite(n) && n > 0 ? n : 0);

/** The staking budget for a period: 8.88% of net revenue, never negative. */
export function stakingBudget(netRevenue: number): number {
  return clean(netRevenue) * STAKING_BUDGET_SHARE;
}

/** Σ(w_j · s_j) over all valid stakers: the weighted stake base. */
export function weightedStake(stakers: readonly Staker[]): number {
  let w = 0;
  for (const s of stakers) {
    const t = tierOf(s.tier);
    if (t) w += t.weight * clean(s.amount);
  }
  return w;
}

export interface Distribution {
  budget: number;
  weightedStake: number;
  /** Budget paid per weighted token this period. Identical for every tier. */
  perWeightedToken: number;
  payouts: Record<string, number>;
  /** Σ payouts. Always ≤ budget. */
  distributed: number;
}

/** Split one period's budget across stakers. Distributes nothing when there is no net revenue or no stake. */
export function distribute(netRevenue: number, stakers: readonly Staker[]): Distribution {
  const budget = stakingBudget(netRevenue);
  const base = weightedStake(stakers);
  const payouts: Record<string, number> = {};
  if (!(budget > 0) || !(base > 0)) {
    for (const s of stakers) payouts[s.id] = 0;
    return { budget, weightedStake: base, perWeightedToken: 0, payouts, distributed: 0 };
  }
  const per = budget / base;
  let total = 0;
  for (const s of stakers) {
    const t = tierOf(s.tier);
    const p = t ? per * t.weight * clean(s.amount) : 0;
    payouts[s.id] = (payouts[s.id] ?? 0) + p;
    total += p;
  }
  // Floating-point can leave the sum a hair over the budget; the invariant is a hard ceiling, so scale back.
  if (total > budget) {
    const k = budget / total;
    for (const id of Object.keys(payouts)) payouts[id] *= k;
    total = budget;
  }
  return { budget, weightedStake: base, perWeightedToken: per, payouts, distributed: total };
}

export interface ImpliedRate {
  tier: 1 | 2 | 3 | 4;
  /** Annualised if `netRevenue` is annual. Quote it only together with `weightedStake`. */
  rate: number;
  weightedStake: number;
}

/** The rate a tier earns at a stated stake base: budget / Σ(w·s) · w_tier. Publish `weightedStake` in the same sentence. */
export function impliedRate(netRevenue: number, stakers: readonly Staker[], tier: 1 | 2 | 3 | 4): ImpliedRate {
  const t = tierOf(tier);
  const base = weightedStake(stakers);
  const rate = t && base > 0 ? (stakingBudget(netRevenue) / base) * t.weight : 0;
  return { tier, rate, weightedStake: base };
}
