/**
 * MAD Gambit — PERSONA SIMPLEX (FIVE FACES core maths)
 * ------------------------------------------------------------------
 * Exact projection onto the CAPPED simplex, plus the derived quantities the
 * product actually trades: entropy per layer, THE DIVERGENCE, and implied τ.
 *
 * WHY EXACT PROJECTION AND NOT CLAMP-THEN-RENORMALISE.
 * Clamping to [lo, hi] and then renormalising is NOT idempotent: renormalisation
 * pushes clamped coordinates back outside the band, and iterating the pair is not
 * guaranteed to converge. The correct primitive is a single projection onto
 *     { p : Σp = 1,  lo ≤ pᵢ ≤ hi }
 * solved by bisection on the water-filling level ν, per Wang & Carreira-Perpiñán,
 * "Projection onto the capped simplex" (arXiv:1503.01002). At D = 5 the cost is
 * irrelevant, so exactness is free and there is no argument for approximating.
 *
 * Product sheet: docs/FIVE_FACES_Product_Sheet.md §4.1, §4.2, §4.4
 */

import { FACE_COUNT, FACE_FLOOR, FACE_CEILING, FACE_ORDER, type FaceId } from "@/lib/persona-codex";

/** A distribution over the five faces, in FACE_ORDER. */
export type FaceVector = number[];

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/**
 * Exact Euclidean projection of `v` onto { p : Σp = total, lo ≤ pᵢ ≤ hi }.
 *
 * The projection has the water-filling form pᵢ = clamp(vᵢ − ν, lo, hi) for a
 * single scalar ν. Σ clamp(vᵢ − ν) is continuous and monotonically decreasing
 * in ν, so bisection converges on the unique ν satisfying the sum constraint.
 *
 * Feasibility: requires D·lo ≤ total ≤ D·hi. With D=5, lo=0.02, hi=0.88 the
 * feasible band is [0.10, 4.40] — comfortably containing total = 1.
 */
export function projectCappedSimplex(
  v: readonly number[],
  lo: number = FACE_FLOOR,
  hi: number = FACE_CEILING,
  total = 1,
): FaceVector {
  const d = v.length;
  if (d === 0) return [];
  if (!(lo * d <= total + 1e-12 && total - 1e-12 <= hi * d)) {
    throw new RangeError(
      `capped simplex infeasible: need ${lo}*${d} <= ${total} <= ${hi}*${d}`,
    );
  }

  const safe = v.map((x) => (Number.isFinite(x) ? x : 0));
  const sumAt = (nu: number) => safe.reduce((acc, x) => acc + clamp(x - nu, lo, hi), 0);

  // Bracket ν. At ν = min(v) − hi every coordinate is at its ceiling (sum = d·hi
  // ≥ total); at ν = max(v) − lo every coordinate is at its floor (sum = d·lo
  // ≤ total). So the root is bracketed by construction.
  let left = Math.min(...safe) - hi;
  let right = Math.max(...safe) - lo;

  // 100 halvings takes a bracket of any realistic width below 1e-15.
  for (let i = 0; i < 100; i++) {
    const mid = (left + right) / 2;
    if (sumAt(mid) > total) left = mid;
    else right = mid;
  }
  const nu = (left + right) / 2;

  const out = safe.map((x) => clamp(x - nu, lo, hi));

  // Bisection leaves a residual of order 1e-15; place it on the coordinate with
  // the most headroom so the sum is exact without pushing anything out of band.
  const residual = total - out.reduce((a, b) => a + b, 0);
  if (residual !== 0) {
    let bestIdx = 0;
    let bestRoom = -Infinity;
    for (let i = 0; i < out.length; i++) {
      const room = residual > 0 ? hi - out[i] : out[i] - lo;
      if (room > bestRoom) {
        bestRoom = room;
        bestIdx = i;
      }
    }
    out[bestIdx] = clamp(out[bestIdx] + residual, lo, hi);
  }
  return out;
}

/** Shannon entropy in nats. Bounded [0, ln D] — for D=5, [0, 1.6094]. */
export function entropy(p: readonly number[]): number {
  let h = 0;
  for (const x of p) {
    if (x > 0) h -= x * Math.log(x);
  }
  return h;
}

/** Maximum attainable entropy for the face count — ln 5. */
export const MAX_ENTROPY = Math.log(FACE_COUNT);

export interface DivergenceReading {
  /** Entropy of the permanent simplex — "is there a stable person under there?" */
  hPerm: number;
  /** Entropy of the transitory shell — how noisy this leg is. */
  hTrans: number;
  /**
   * D = H_trans − H_perm. The money object.
   * D > 0 wide: the crowd is loudly confused about someone whose core is
   *   consistent — the mean-reversion trade.
   * D < 0: the crowd is confidently agreed about someone whose core is
   *   unstable — the crash trade.
   * Bounded [−ln D, +ln D].
   */
  divergence: number;
  /** D normalised to [-1, 1] for display. */
  normalised: number;
}

export function divergence(perm: readonly number[], trans: readonly number[]): DivergenceReading {
  const hPerm = entropy(perm);
  const hTrans = entropy(trans);
  const d = hTrans - hPerm;
  return {
    hPerm,
    hTrans,
    divergence: d,
    normalised: MAX_ENTROPY > 0 ? clamp(d / MAX_ENTROPY, -1, 1) : 0,
  };
}

/**
 * Implied temperature — τ inverted from an observed distribution.
 *
 * Forward: P(i) = e^(vᵢ/τ) / Σ e^(vⱼ/τ). As τ → 0 the distribution sharpens to
 * a point mass; as τ → ∞ it flattens to uniform. So entropy is monotonically
 * increasing in τ, which makes the inversion a clean 1-D bisection on entropy.
 *
 * This is implied volatility for persona markets: given where the book sits and
 * the underlying scores, what decisiveness does the crowd imply?
 */
export function impliedTau(
  observed: readonly number[],
  scores: readonly number[],
  loTau = 1e-4,
  hiTau = 1e4,
): number {
  const targetH = entropy(observed);
  const softmaxAt = (tau: number) => {
    const t = Math.max(tau, 1e-12);
    const m = Math.max(...scores);
    const exps = scores.map((s) => Math.exp((s - m) / t));
    const sum = exps.reduce((a, b) => a + b, 0);
    return sum > 0 ? exps.map((e) => e / sum) : scores.map(() => 1 / scores.length);
  };

  let lo = loTau;
  let hi = hiTau;
  // Entropy increases with τ, so bisect on H(τ) − targetH.
  for (let i = 0; i < 200; i++) {
    const mid = Math.sqrt(lo * hi); // geometric — τ spans orders of magnitude
    if (entropy(softmaxAt(mid)) < targetH) lo = mid;
    else hi = mid;
  }
  return Math.sqrt(lo * hi);
}

/** Convenience: a FaceVector as a keyed record, for API payloads. */
export function toFaceRecord(v: readonly number[]): Record<FaceId, number> {
  const out = {} as Record<FaceId, number>;
  FACE_ORDER.forEach((f, i) => {
    out[f] = v[i] ?? 0;
  });
  return out;
}

/** Inverse of toFaceRecord — a record back to canonical order. */
export function fromFaceRecord(rec: Partial<Record<FaceId, number>>): FaceVector {
  return FACE_ORDER.map((f) => {
    const n = Number(rec[f]);
    return Number.isFinite(n) ? n : 0;
  });
}

/** The crowned face — highest weight in the given (permanent) layer. */
export function crownedFace(perm: readonly number[]): FaceId {
  let best = 0;
  for (let i = 1; i < perm.length; i++) if (perm[i] > perm[best]) best = i;
  return FACE_ORDER[best];
}
