/**
 * Proper scoring rules (maths document, item 2.1).
 *
 * A scoring rule pays a forecaster who reports distribution p when outcome ω occurs. It is STRICTLY PROPER when the
 * unique best report is the forecaster's true belief q:  E_{ω~q}[S(p, ω)] ≤ E_{ω~q}[S(q, ω)], equality iff p = q.
 * Paying on forecast accuracy rather than on price movement is what makes "we reward accurate information" a theorem
 * instead of an intention. LMSR is the market implementation of the logarithmic rule, with worst-case loss b·ln n.
 *
 * The two canonical rules: logarithmic (punishes a confident miss without limit) and Brier (quadratic, gentler on a
 * confident miss, which may retain unsophisticated participants better). The choice becomes an explicit design decision
 * here; this file does not make it. Pure functions, no I/O.
 */
export type Dist = readonly number[];
export type ScoringRule = (report: Dist, outcome: number) => number;

/** The smallest probability the log score will look at, so a zero report is a large finite loss and not -Infinity. */
export const LOG_FLOOR = 1e-12;

export const logScore: ScoringRule = (p, w) => Math.log(Math.max(p[w] ?? 0, LOG_FLOOR));

export const brierScore: ScoringRule = (p, w) => -p.reduce((acc, pi, i) => acc + (pi - (i === w ? 1 : 0)) ** 2, 0);

/** The simplest IMPROPER rule (pay the probability you gave the outcome): its best report is always all-in. For tests. */
export const linearScore: ScoringRule = (p, w) => p[w] ?? 0;

/** Expected score of reporting `report` when the truth is distributed as `belief`. */
export function expectedScore(rule: ScoringRule, report: Dist, belief: Dist): number {
  let e = 0;
  for (let w = 0; w < belief.length; w++) e += belief[w] * rule(report, w);
  return e;
}

/** The best report on a grid of two-outcome reports, and the score it earns. Used to show properness numerically. */
export function bestBinaryReport(rule: ScoringRule, belief: Dist, steps = 1000): { report: number; score: number } {
  let best = { report: 0, score: -Infinity };
  for (let k = 0; k <= steps; k++) {
    const r = k / steps;
    const s = expectedScore(rule, [r, 1 - r], belief);
    if (s > best.score) best = { report: r, score: s };
  }
  return best;
}
