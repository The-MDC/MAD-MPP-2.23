/**
 * MAD Gambit — Bayesian conviction engine (Part T build).
 *
 * TypeScript port of the Bayesian / decision-tree / sequential-reasoning maths
 * from the unified handoff (Master Maths v2.24.1, Parts A–C): stable Bayesian
 * updates, log-odds sequencing, the hybrid MADConv update, backward-induction
 * tree propagation with conviction bonuses, VOI, edge detection, proper scoring
 * (Brier/Log), and EGARCH/CGARCH volatility extensions.
 *
 * Pure + deterministic; no DB, no side effects — safe to run at the edge.
 * Kelly sizing already lives in gambit-game-math.ts — re-exported here so the
 * conviction toolkit is a single import.
 */
export { kellyFraction } from "./gambit-game-math";

const EPS = 1e-9;
const clampProb = (p: number): number => Math.min(1 - EPS, Math.max(EPS, p));

/** Stable probability update via odds form. prior ∈ (0,1). */
export function bayesianUpdate(prior: number, likelihoodRatio: number): number {
  const p = clampProb(prior);
  const odds = p / (1 - p);
  const newOdds = odds * Math.max(0, likelihoodRatio);
  return newOdds / (1 + newOdds);
}

/** probability → log-odds and back. */
export function toLogOdds(p: number): number {
  const x = clampProb(p);
  return Math.log(x / (1 - x));
}
export function fromLogOdds(lambda: number): number {
  return 1 / (1 + Math.exp(-lambda));
}

/** Additive log-odds accumulation over a sequence of likelihood ratios. */
export function sequentialLogOddsUpdate(initialLambda: number, likelihoodRatios: number[]): number {
  let current = initialLambda;
  for (const L of likelihoodRatios) {
    if (Number.isFinite(L) && L > 0) current += Math.log(L);
  }
  return current;
}

/** Hybrid MADConv update: MADConv₊₁ = MADConvₜ^0.85 · (1 + β·bayesFactor). */
export function madconvHybridUpdate(currentMadconv: number, bayesFactor: number, beta = 0.4): number {
  const base = Math.max(0, currentMadconv);
  return Math.pow(base, 0.85) * (1 + beta * bayesFactor);
}

export interface TreeNode {
  name: string;
  isLeaf?: boolean;
  probability?: number; // leaf value (ProjectedImpact × MADConv multiplier) or resolved prob
  convictionBonus?: number;
  children?: { child: TreeNode; conditionalProb: number }[];
}

function propagateAt(node: TreeNode, depth: number, maxDepth: number): number {
  const bonus = node.convictionBonus ?? 0;
  if (depth >= maxDepth || node.isLeaf || !node.children || node.children.length === 0) {
    return (node.probability ?? 0) * (1 + bonus);
  }
  let total = 0;
  for (const edge of node.children) {
    if (!edge || typeof edge !== "object" || !edge.child) continue;
    const cp = Number(edge.conditionalProb);
    total += (Number.isFinite(cp) ? cp : 0) * propagateAt(edge.child, depth + 1, maxDepth);
  }
  return total * (1 + bonus);
}

/** Backward-induction propagation with conviction weighting (depth-bounded).
 *  V_leaf = probability·(1+bonus); V_n = Σ P(c|n)·V_c ·(1+bonus_n).
 *
 *  NOTE: this does NOT check that a node's `conditionalProb` edges sum to 1 —
 *  it computes whatever weighted sum it is handed. That is fine for a caller
 *  whose edges are conserved by construction (see `frontierPrices` in
 *  lib/paseome.ts, where DL-LMSR guarantees it), and unsafe for one that
 *  accepts a tree from outside. Validate with `treeConservationError` first
 *  when the tree did not come from your own maths. */
export function propagateTree(node: TreeNode, maxDepth = 64): number {
  return propagateAt(node, 0, maxDepth);
}

/** How far a node's edges may sum from 1 before the tree is judged unsound. */
export const CONSERVATION_TOLERANCE = 1e-6;

/**
 * First node whose children's `conditionalProb` do not sum to 1, described as
 * a path — or `null` if the whole tree conserves.
 *
 * A branch market that mints or destroys value at a fork is arbitrageable
 * within a day, and a node whose edges total 0.8 silently misprices every
 * position beneath it. Nothing enforced this, and the one caller of
 * `propagateTree` takes its tree from a request body.
 *
 * Iterative with an explicit stack: no recursion depth risk, and no `for...of`
 * over anything but an array — this file compiles at target es5.
 */
export function treeConservationError(node: TreeNode, maxDepth = 64): string | null {
  const stack: { n: TreeNode; d: number; path: string }[] = [{ n: node, d: 0, path: node?.name || "root" }];
  while (stack.length > 0) {
    const top = stack.pop();
    if (!top) break;
    const n = top.n;
    if (!n || top.d >= maxDepth || n.isLeaf || !n.children || n.children.length === 0) continue;
    let sum = 0;
    for (let i = 0; i < n.children.length; i++) {
      const edge = n.children[i];
      if (!edge || typeof edge !== "object" || !edge.child) continue;
      const cp = Number(edge.conditionalProb);
      sum += Number.isFinite(cp) ? cp : 0;
      stack.push({ n: edge.child, d: top.d + 1, path: `${top.path} › ${edge.child.name || "?"}` });
    }
    if (Math.abs(sum - 1) > CONSERVATION_TOLERANCE) {
      return `${top.path}: children sum to ${sum.toFixed(6)}, expected 1`;
    }
  }
  return null;
}

/** Conviction-modulated absolute edge. */
export function computeEdge(personalPosterior: number, marketPrice: number, conviction: number): number {
  return Math.abs(personalPosterior - marketPrice) * Math.max(0, conviction);
}

/** Dynamic threshold that rises as conviction drops (stricter for low-C users). */
export function shouldAct(edge: number, thresholdBase = 0.05, conviction = 1): boolean {
  const tau = thresholdBase / Math.max(conviction, 0.1);
  return edge > tau;
}

/** Simplified platform VOI: expected gain after − before − cost. */
export function voiEstimate(expectedGainAfter: number, expectedGainBefore: number, cost: number): number {
  return expectedGainAfter - expectedGainBefore - cost;
}

/** Brier score (lower is better). */
export function brierScore(forecasts: number[], outcomes: number[]): number {
  const n = Math.min(forecasts.length, outcomes.length);
  if (n === 0) return 0;
  let s = 0;
  for (let i = 0; i < n; i++) s += (forecasts[i] - outcomes[i]) ** 2;
  return s / n;
}

/** Logarithmic score (higher is better). */
export function logScore(forecasts: number[], outcomes: number[], eps = 1e-12): number {
  const n = Math.min(forecasts.length, outcomes.length);
  if (n === 0) return 0;
  let total = 0;
  for (let i = 0; i < n; i++) {
    const f = Math.max(Math.min(forecasts[i], 1 - eps), eps);
    total += outcomes[i] * Math.log(f) + (1 - outcomes[i]) * Math.log(1 - f);
  }
  return total / n;
}

/** EGARCH(1,1) log-variance step — asymmetric shocks (bad news spikes vol more).
 *  ln σ²ₜ = ω + β·ln σ²₋₁ + α·(|z| − E|z|) + γ·z,  z = ε/σ, E|z| = √(2/π). */
export function egarchLogVar(params: {
  prevLogVar: number;
  z: number;
  omega?: number;
  alpha?: number;
  beta?: number;
  gamma?: number;
}): number {
  const omega = params.omega ?? -0.1;
  const alpha = params.alpha ?? 0.1;
  const beta = params.beta ?? 0.9;
  const gamma = params.gamma ?? -0.08; // negative → leverage: bad news raises vol
  const eAbsZ = Math.sqrt(2 / Math.PI);
  return omega + beta * params.prevLogVar + alpha * (Math.abs(params.z) - eAbsZ) + gamma * params.z;
}

/** CGARCH(1,1) — separates long-run (permanent) from short-run variance.
 *  qₜ = ω + ρ(q₋₁ − ω) + φ(ε² − σ²);  σ²ₜ = qₜ + α(ε² − q₋₁) + β(σ²₋₁ − q₋₁). */
export function cgarchUpdate(params: {
  prevVar: number;
  prevPermanent: number;
  epsSq: number;
  omega?: number;
  rho?: number;
  phi?: number;
  alpha?: number;
  beta?: number;
}): { variance: number; permanent: number } {
  const omega = params.omega ?? 0.0001;
  const rho = params.rho ?? 0.99;
  const phi = params.phi ?? 0.05;
  const alpha = params.alpha ?? 0.05;
  const beta = params.beta ?? 0.9;
  const permanent = omega + rho * (params.prevPermanent - omega) + phi * (params.epsSq - params.prevVar);
  const variance =
    permanent + alpha * (params.epsSq - params.prevPermanent) + beta * (params.prevVar - params.prevPermanent);
  return { variance: Math.max(0, variance), permanent: Math.max(0, permanent) };
}
