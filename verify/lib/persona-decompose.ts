/**
 * MAD Gambit — PERSONA DECOMPOSITION (FIVE FACES §4.1)
 * ------------------------------------------------------------------
 * Runs CGARCH PER FACE and splits the simplex into a permanent layer and a
 * transitory shell:
 *
 *     p⃗(t) = p⃗_perm(t) + p⃗_trans(t)
 *
 * The bet is not which mask. It is the gap between the mask worn today and the
 * one that is permanently theirs — priced as THE DIVERGENCE (persona-simplex.ts).
 *
 * PERPETUAL BY CONSTRUCTION, not by fiat: ρ < 1 means the permanent component
 * mean-reverts toward ω asymptotically and never arrives in finite time. There is
 * no terminal value, therefore no terminal market. That is the mathematics, and
 * it is the cleanest compliance position available to a perpetual.
 *
 * Reuses `cgarchUpdate` and `egarchLogVar` from bayesian-conviction.ts unchanged.
 */

import { cgarchUpdate, egarchLogVar } from "@/lib/bayesian-conviction";
import {
  FACE_ORDER,
  FACE_COUNT,
  RHO_VECTOR,
  GAMMA_VECTOR,
  type FaceId,
} from "@/lib/persona-codex";
import {
  projectCappedSimplex,
  divergence,
  impliedTau,
  crownedFace,
  toFaceRecord,
  type FaceVector,
  type DivergenceReading,
} from "@/lib/persona-simplex";

/** Rolling per-face filter state. Persisted between legs. */
export interface FaceFilterState {
  /** σ² — total conditional variance. */
  variance: number;
  /** q — the permanent (long-run) component. */
  permanent: number;
  /** ln σ² for the asymmetric EGARCH track. */
  logVar: number;
}

export type SimplexState = Record<FaceId, FaceFilterState>;

/** A neutral starting state — used when a subject has no filter history. */
export function initialSimplexState(): SimplexState {
  const out = {} as SimplexState;
  for (const f of FACE_ORDER) {
    out[f] = { variance: 0.02, permanent: 0.02, logVar: Math.log(0.02) };
  }
  return out;
}

export interface DecompositionInput {
  /** Raw crowd-implied weight per face, in FACE_ORDER. Need not sum to 1. */
  observed: readonly number[];
  /** Prior filter state; omit for a cold start. */
  state?: SimplexState;
  /**
   * Per-face innovation ε (surprise this leg). Positive = the face was
   * confirmed harder than expected. Drives the asymmetric γ response.
   */
  shocks?: readonly number[];
}

export interface Decomposition {
  /** The permanent simplex — who they are. Σ = 1, every face in band. */
  permanent: FaceVector;
  /** The transitory shell — who they are being this leg. Σ = 1, in band. */
  transitory: FaceVector;
  /** Entropies + THE DIVERGENCE. */
  reading: DivergenceReading;
  /** Two-factor implied temperature. */
  tauPerm: number;
  tauTrans: number;
  /** The face crowned at leg close — the dominant PERMANENT face. */
  crowned: FaceId;
  /** Filter state to carry into the next leg. */
  nextState: SimplexState;
  /** Keyed views for API payloads. */
  permanentByFace: Record<FaceId, number>;
  transitoryByFace: Record<FaceId, number>;
}

/**
 * One decomposition step.
 *
 * 1. Normalise the observation onto the capped simplex (exact projection).
 * 2. Run CGARCH per face with that face's ρ, splitting variance into permanent
 *    q and transitory σ² − q.
 * 3. Apply the EGARCH leverage term γ so bad news moves the permanent component
 *    harder than equivalent good news — redemption is slower than disgrace.
 * 4. Re-project BOTH layers back onto the capped simplex, so Σp = 1 and the
 *    perpetual band survive the decomposition.
 */
export function decompose(input: DecompositionInput): Decomposition {
  const state = input.state ?? initialSimplexState();
  const observed = projectCappedSimplex(input.observed.slice(0, FACE_COUNT));
  const shocks = input.shocks ?? FACE_ORDER.map(() => 0);

  const permRaw: number[] = [];
  const transRaw: number[] = [];
  const nextState = {} as SimplexState;

  FACE_ORDER.forEach((face, i) => {
    const prior = state[face] ?? { variance: 0.02, permanent: 0.02, logVar: Math.log(0.02) };
    const eps = Number.isFinite(shocks[i]) ? shocks[i] : 0;

    // Long-run vs short-run split, with this face's own persistence.
    const { variance, permanent } = cgarchUpdate({
      prevVar: prior.variance,
      prevPermanent: prior.permanent,
      epsSq: eps * eps,
      rho: RHO_VECTOR[i],
    });

    // Asymmetric track: γ < 0 means a negative shock raises variance more.
    const sigma = Math.sqrt(Math.max(prior.variance, 1e-12));
    const logVar = egarchLogVar({
      prevLogVar: prior.logVar,
      z: eps / sigma,
      gamma: GAMMA_VECTOR[i],
    });

    // The permanent share of this face's variance is how much of today's
    // observed weight is structural rather than noise.
    const permShare = variance > 0 ? Math.min(1, Math.max(0, permanent / variance)) : 0.5;

    // Leverage tilts the permanent share: an elevated asymmetric track means
    // the bad news is embedding, so more of the reading is permanent.
    const leverageTilt = Math.tanh((logVar - Math.log(Math.max(variance, 1e-12))) * 0.5);
    const tilted = Math.min(1, Math.max(0, permShare + 0.15 * leverageTilt));

    permRaw.push(observed[i] * tilted);
    transRaw.push(observed[i] * (1 - tilted));

    nextState[face] = { variance, permanent, logVar };
  });

  // Both layers are distributions in their own right, so both get re-projected.
  const permanent = projectCappedSimplex(permRaw);
  const transitory = projectCappedSimplex(transRaw);

  return {
    permanent,
    transitory,
    reading: divergence(permanent, transitory),
    tauPerm: impliedTau(permanent, observed),
    tauTrans: impliedTau(transitory, observed),
    crowned: crownedFace(permanent),
    nextState,
    permanentByFace: toFaceRecord(permanent),
    transitoryByFace: toFaceRecord(transitory),
  };
}

/* ====================================================================
 * THE SLIP — a Divergence blowout.
 * Fires when today's mask has detached from the core. Math-native trigger;
 * no verdict oracle involved.
 * ==================================================================== */

/** |D| beyond this share of ln(5) is a Slip. */
export const SLIP_THRESHOLD = 0.34;

export interface SlipReading {
  isSlip: boolean;
  /** |normalised D| at evaluation time. */
  magnitude: number;
  direction: "mask-detached" | "core-unstable" | null;
}

export function detectSlip(reading: DivergenceReading): SlipReading {
  const magnitude = Math.abs(reading.normalised);
  if (magnitude < SLIP_THRESHOLD) {
    return { isSlip: false, magnitude, direction: null };
  }
  return {
    isSlip: true,
    magnitude,
    // D > 0: the shell is noisier than the core — the mask has come loose.
    // D < 0: the core is noisier than the shell — the crowd is confidently
    // agreed about somebody who has no stable centre.
    direction: reading.divergence > 0 ? "mask-detached" : "core-unstable",
  };
}
