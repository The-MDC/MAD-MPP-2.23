/**
 * MAD Gambit — Joy Engineering (engagement mechanics)
 * ------------------------------------------------------------------
 * A single, honest surface that COMPOSES the platform's already-defined
 * engagement math (all pure functions in `gambit-game-math`) into
 * higher-level, product-usable signals:
 *
 *   - Virality index    — content spread × conviction × card multiplier,
 *                         gently age-decayed (viralityIndex)
 *   - Attention momentum — time-weighted aggregate of live contributions
 *                         (attentionDecay), plus a recency-weighted mean
 *                         index (momentumIndex) as a companion to a flat
 *                         average
 *   - Reward curve      — Fibonacci tenure/rank reward (getFibonacciReward
 *                         ∘ calculateUserDopamineIndex) — a transparent,
 *                         monotonic loyalty curve, NOT a slot-machine
 *   - Retention factor  — plain exponential attention persistence
 *                         (temporalDecay) at a content's age
 *
 * This module adds NO new hidden mechanics and NO neuroscience framing.
 * Per the platform compliance guidance we keep the game-economy mechanic
 * and drop the clinical "dopamine / anticipation-circuit" language; every
 * value here is a deterministic function of explicit inputs.
 */
import {
  viralityIndex,
  attentionDecay,
  temporalDecay,
  getFibonacciReward,
  calculateUserDopamineIndex,
  type ViralityParams,
} from "@/lib/gambit-game-math";

const round = (n: number, dp = 2) => {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
};
const clamp0to100 = (n: number) => Math.min(100, Math.max(0, n));

/** A single timed contribution — an amount (weight) and how old it is. */
export interface TimedSignal {
  amount: number;
  ageHours: number;
}

export interface TenureInput {
  evolutionStage: number;
  xp: number;
  socialStanding: number;
}

export interface JoyInput {
  virality: ViralityParams;
  /** Age of the content whose virality we're scoring. */
  contentAgeHours: number;
  /** Live engagement contributions (e.g., recent bets/mentions) with ages. */
  contributions: TimedSignal[];
  /** The acting user's tenure/rank, for the loyalty reward curve. */
  tenure: TenureInput;
  /** Decay rate λ (default 0.08 → ~8.7h half-life), shared across signals. */
  decayRate?: number;
}

export interface JoyState {
  /** 0..100 composite spread signal, age-decayed. */
  viralityIndex: number;
  /** Raw time-weighted contribution weight (Σ amount·e^(−λ·age)). */
  attentionMomentum: number;
  /** 0..100 recency-weighted MEAN of the contributions (freshness-biased). */
  momentumIndex: number;
  /** Position on the Fibonacci loyalty curve for this user. */
  rewardIndex: number;
  /** Fibonacci reward value at that index. */
  rewardValue: number;
  /** 0..1 fraction of attention persisting at the content's age. */
  retention: number;
}

/**
 * Fibonacci loyalty reward for a user's tenure/rank. Transparent and
 * monotonic — longer tenure / higher rank ⇒ a higher, but bounded, curve
 * position. Returns both the curve index and its reward value.
 */
export function rewardForTenure(t: TenureInput): { index: number; value: number } {
  const index = calculateUserDopamineIndex(t.evolutionStage, t.xp, t.socialStanding);
  return { index, value: getFibonacciReward(index) };
}

/**
 * Recency-weighted mean of timed signals, scaled to 0..100. This is the
 * exponentially-recency-weighted companion to a flat average: fresher
 * signals dominate. Reuses `attentionDecay` for both the weighted sum and
 * the decay-weighted count.
 */
export function momentumIndex(
  signals: TimedSignal[],
  decayRate = 0.08,
  scale = 20,
): number {
  if (!signals.length) return 0;
  const weightedSum = attentionDecay(signals, decayRate);
  const weightCount = attentionDecay(
    signals.map((s) => ({ amount: 1, ageHours: s.ageHours })),
    decayRate,
  );
  const mean = weightCount > 0 ? weightedSum / weightCount : 0;
  return clamp0to100(Math.round(mean * scale));
}

/** Compose all engagement primitives into one snapshot. */
export function computeJoyState(input: JoyInput): JoyState {
  const rate = input.decayRate ?? 0.08;
  const { index, value } = rewardForTenure(input.tenure);
  return {
    viralityIndex: round(viralityIndex(input.virality, input.contentAgeHours)),
    attentionMomentum: round(attentionDecay(input.contributions, rate)),
    momentumIndex: momentumIndex(input.contributions, rate),
    rewardIndex: index,
    rewardValue: value,
    retention: round(temporalDecay(rate, input.contentAgeHours), 4),
  };
}
