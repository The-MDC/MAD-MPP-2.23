/**
 * MAD Gambit — commit-and-freeze (FIVE FACES §4.5).
 * ────────────────────────────────────────────────────────────────
 * The decomposition is parameterised by ρ⃗ (persistence), γ⃗ (asymmetry) and
 * α⃗ (reaction). Those parameters decide who gets crowned. If the house can
 * change them mid-leg, the house decides the outcome — so a market carries a
 * COMMITMENT to the exact parameter vector it settles under, hashed at leg
 * open, and the leg settles against that commitment or not at all.
 *
 * The rules, and why each one is there:
 *
 *   1. Hash at OPEN, reveal at CLOSE. A trader entering a leg can check the
 *      commitment matches the published defaults before staking.
 *   2. A new commitment can only take effect at a LEG BOUNDARY, never mid-leg.
 *      `param_epoch` bumps with it, so a change is visible in the row itself.
 *   3. The nonce exists so two markets running identical parameters don't share
 *      a commitment hash — otherwise a reveal on one market reveals the other's,
 *      and "frozen" stops meaning anything per-market.
 *   4. Serialisation is fixed-precision and fixed-order. A commitment nobody can
 *      independently reproduce is decoration, not a commitment.
 *
 * Server-side. Uses viem's keccak256 — the same hash the eventual on-chain
 * verifier would use, so the off-chain and on-chain commitments agree.
 */
import { keccak256, stringToHex } from "viem";
import { FACE_ORDER, ALPHA_VECTOR, GAMMA_VECTOR, RHO_VECTOR } from "@/lib/persona-codex";

/** Fixed precision for serialisation — 12dp is well inside float64's exact range. */
const PRECISION = 12;

export interface ParamSet {
  rho: readonly number[];
  gamma: readonly number[];
  alpha: readonly number[];
  /** Bumped when the SHAPE of the parameterisation changes, not its values. */
  version: string;
  /** Per-market, so identical parameters still produce distinct commitments. */
  nonce: string;
}

export interface ParamCommitment {
  commit: `0x${string}`;
  canonical: string;
  paramEpoch: number;
}

const fixed = (n: number): string => (Number.isFinite(n) ? n : 0).toFixed(PRECISION);

/**
 * Canonical serialisation. Deliberately boring and reproducible: the face order
 * is the codex order, every number is fixed-precision, and the field order never
 * changes. Anyone with the product sheet can rebuild this string by hand.
 */
export function canonicalise(params: ParamSet): string {
  const vec = (v: readonly number[]) =>
    FACE_ORDER.map((_, i) => fixed(v[i] ?? 0)).join(",");
  return [
    `v=${params.version}`,
    `faces=${FACE_ORDER.join(",")}`,
    `rho=${vec(params.rho)}`,
    `gamma=${vec(params.gamma)}`,
    `alpha=${vec(params.alpha)}`,
    `nonce=${params.nonce}`,
  ].join("|");
}

export function commitParams(params: ParamSet, paramEpoch = 0): ParamCommitment {
  const canonical = canonicalise(params);
  return { commit: keccak256(stringToHex(canonical)), canonical, paramEpoch };
}

/** The published defaults — what a market commits to unless it says otherwise. */
export const CODEX_PARAM_VERSION = "faces-1";

export function codexParams(nonce: string): ParamSet {
  return {
    rho: RHO_VECTOR,
    gamma: GAMMA_VECTOR,
    alpha: ALPHA_VECTOR,
    version: CODEX_PARAM_VERSION,
    nonce,
  };
}

/** Verify a revealed parameter set against the commitment a leg opened under. */
export function verifyCommitment(params: ParamSet, commit: string): boolean {
  if (!commit) return false;
  return commitParams(params).commit.toLowerCase() === commit.toLowerCase();
}

export type ParamChangeVerdict =
  | { allowed: true; nextEpoch: number }
  | { allowed: false; reason: string };

/**
 * Rule 2, enforced. A recommitment is legal only at a leg boundary — and only
 * strictly forward, so a rewrite can't be backdated into a leg that has already
 * traded.
 */
export function canRecommit(input: {
  legClosesAtMs: number;
  currentEpoch: number;
  nowMs?: number;
}): ParamChangeVerdict {
  const now = input.nowMs ?? Date.now();
  if (now < input.legClosesAtMs) {
    return {
      allowed: false,
      reason: "parameters are frozen until the current leg closes",
    };
  }
  return { allowed: true, nextEpoch: input.currentEpoch + 1 };
}
