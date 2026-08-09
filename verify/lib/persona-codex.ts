/**
 * MAD Gambit — PERSONA CODEX (shared by FIVE FACES + ZEITGEIST)
 * ------------------------------------------------------------------
 * The five-face axis and its governing constants. This module is the single
 * source of truth for face identity; nothing else may hard-code a face name.
 *
 * THREE NAME LAYERS, and the distinction is load-bearing:
 *   codexName     — canon. Ships on-chain with the market criteria. Never changes.
 *   broadcastName — display alias for app stores / ad networks / restrictive
 *                   jurisdictions. Swapped by PERSONA_DISPLAY_MODE. Cosmetic.
 *   catchphrase   — flavour ONLY. Renders in the roast feed, on card art and in
 *                   the MADHAT'r voice. NEVER on a stakeable label, never in
 *                   resolution copy, never on-chain. It therefore sits outside
 *                   the compliance surface entirely, which is what allows it to
 *                   be funny. `stakeableLabel()` is the enforcement point.
 *
 * Product sheet: docs/FIVE_FACES_Product_Sheet.md §2, §2.1, §4.3
 * Maths home:    docs/MASTER_MATHS_AND_ALGORITHMS.md
 */

export type FaceId = "saint" | "white_rice" | "megalomaniac" | "narcissist" | "prostitute";

/** Canonical iteration order. Every vector in this family is indexed by it. */
export const FACE_ORDER: readonly FaceId[] = [
  "saint",
  "white_rice",
  "megalomaniac",
  "narcissist",
  "prostitute",
] as const;

export const FACE_COUNT = FACE_ORDER.length; // 5 — the D in the capped simplex

export type PersonaDisplayMode = "codex" | "broadcast";

export interface FaceDefinition {
  id: FaceId;
  /** Canon. On-chain. Never varies by display mode. */
  codexName: string;
  /** Display alias, or null where the codex name ships everywhere. */
  broadcastName: string | null;
  /** The compliance primitive — renders bound to the price, never alone. */
  definition: string;
  /** Flavour only. Excluded from every stakeable surface by construction. */
  catchphrase: string;
  /**
   * ρ — CGARCH permanent-component persistence for this face.
   * Implied half-life in legs = ln(0.5)/ln(ρ). Virtue is forgotten fastest;
   * a sell-out never is. Proprietary tuning — server-side only.
   */
  rho: number;
  /**
   * γ — EGARCH leverage. Negative means bad news moves the permanent
   * component harder than equivalent good news, i.e. redemption is
   * mathematically slower than disgrace.
   */
  gamma: number;
  /** α — conviction accrual rate, C(t) = C_max·(1 − e^(−αt)). */
  alpha: number;
}

export const FACES: Readonly<Record<FaceId, FaceDefinition>> = {
  saint: {
    id: "saint",
    codexName: "THE SAINT",
    broadcastName: null,
    definition:
      "Performed virtue. Claims the moral high ground and invites the halo — sincerity neither assumed nor denied.",
    catchphrase: "I'd like to thank myself for being so brave.",
    rho: 0.94,
    gamma: -0.08,
    alpha: 0.055,
  },
  white_rice: {
    id: "white_rice",
    codexName: "WHITE RICE",
    broadcastName: "THE THERMOSTAT",
    definition:
      "Flavourless by strategy. Offends no one, commits to nothing, survives everything.",
    catchphrase: "I think everyone makes a great point.",
    rho: 0.96,
    gamma: -0.04,
    alpha: 0.035,
  },
  megalomaniac: {
    id: "megalomaniac",
    codexName: "THE MEGALOMANIAC",
    broadcastName: "TOO BIG TO FAIL",
    definition:
      "Empire over everything. Scale, dominion, and the certainty that the rules were priced for other people. Aimed at office-holders, boardrooms and the structurally entitled — the face that expects exemption.",
    catchphrase: "Aaaand it's gone.",
    rho: 0.99,
    gamma: -0.1,
    alpha: 0.07,
  },
  narcissist: {
    id: "narcissist",
    codexName: "THE NARCISSIST",
    broadcastName: null,
    definition: "The mirror is the audience. Cannot act unless the room is watching.",
    catchphrase: "Anyway, back to me.",
    rho: 0.985,
    gamma: -0.09,
    alpha: 0.065,
  },
  prostitute: {
    id: "prostitute",
    codexName: "THE PROSTITUTE",
    broadcastName: "THE SELLOUT",
    definition:
      "The Sell-Out archetype: monetises access, principle, platform or endorsement to the highest bidder. Never a claim about anyone's sexual conduct.",
    catchphrase: "This roast is sponsored by—",
    rho: 0.995,
    gamma: -0.12,
    alpha: 0.05,
  },
} as const;

/** ρ⃗ in canonical order — feeds the per-face CGARCH decomposition. */
export const RHO_VECTOR: readonly number[] = FACE_ORDER.map((f) => FACES[f].rho);
/** γ⃗ in canonical order — the asymmetry vector. */
export const GAMMA_VECTOR: readonly number[] = FACE_ORDER.map((f) => FACES[f].gamma);
/** α⃗ in canonical order — per-face conviction accrual. */
export const ALPHA_VECTOR: readonly number[] = FACE_ORDER.map((f) => FACES[f].alpha);

/* ====================================================================
 * PERPETUAL INVARIANT — the face price band.
 * A persona market that fully resolves has stopped being perpetual, so
 * no face may ever price at 0 or 1. These bounds are locked at canonical
 * -constant governance tier (founder sign-off Aug 2026).
 * ==================================================================== */
export const FACE_FLOOR = 0.02;
export const FACE_CEILING = 0.88;

/** Implied half-life of a face's permanent component, in legs. */
export function faceHalfLifeLegs(face: FaceId): number {
  const rho = FACES[face].rho;
  if (!(rho > 0 && rho < 1)) return Infinity;
  return Math.log(0.5) / Math.log(rho);
}

/** The name to render, given the active display mode. */
export function displayName(face: FaceId, mode: PersonaDisplayMode = "codex"): string {
  const def = FACES[face];
  return mode === "broadcast" && def.broadcastName ? def.broadcastName : def.codexName;
}

/**
 * A price and its Codex definition, as ONE indivisible unit.
 *
 * This is the §2 compliance mechanism in code: the quantification is the
 * actionable assertion, so the disclaimer binds to the NUMBER, not the label.
 * There is deliberately no way to obtain a formatted price from this module
 * without the definition travelling with it — callers that want only the digits
 * must reach for the raw probability themselves and own that decision.
 *
 * Note the absence of `catchphrase`: flavour never reaches a stakeable surface.
 */
export interface StakeableLabel {
  face: FaceId;
  name: string;
  /** Rendered price, e.g. "68%". */
  price: string;
  /** MUST render adjacent, at no less than the label's visual weight. */
  definition: string;
}

export function stakeableLabel(
  face: FaceId,
  probability: number,
  mode: PersonaDisplayMode = "codex",
): StakeableLabel {
  const p = Number.isFinite(probability) ? Math.min(1, Math.max(0, probability)) : 0;
  return {
    face,
    name: displayName(face, mode),
    price: `${Math.round(p * 100)}%`,
    definition: FACES[face].definition,
  };
}

/** Flavour accessor — kept separate so it can never be mistaken for label copy. */
export function catchphrase(face: FaceId): string {
  return FACES[face].catchphrase;
}

/** Resolve a loose string to a FaceId. Accepts id, codex name or broadcast name. */
export function toFaceId(value: string): FaceId | null {
  const v = (value ?? "").trim().toLowerCase();
  if (!v) return null;
  for (const id of FACE_ORDER) {
    const def = FACES[id];
    if (
      v === id ||
      v === def.codexName.toLowerCase() ||
      (def.broadcastName && v === def.broadcastName.toLowerCase())
    ) {
      return id;
    }
  }
  return null;
}
