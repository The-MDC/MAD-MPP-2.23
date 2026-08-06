/**
 * MAD Gambit — portrait metadata builder. INTERLOCK layer 2 (§6.2.4).
 * ────────────────────────────────────────────────────────────────
 * The two-track split from §6.2.1, expressed as a discriminated union so the
 * type checker enforces it rather than a reviewer.
 *
 *   INSTITUTIONAL — brands, institutions, models, industries, indices.
 *   Full payload on-chain, verifiable forever. No personal data, no GDPR
 *   surface, emergent rarity works exactly as specified.
 *
 *   NAMED INDIVIDUAL — on-chain: opaque subjectRef, leg index, ciphertext
 *   pointer, token id. Nothing else. No name, no likeness, no persona label,
 *   no persona values.
 *
 * The named variant requires a `CiphertextPointer`, which only portrait-vault.ts
 * can construct and only after a confirmed key write. A named portrait built
 * without one does not compile.
 *
 * WHY THE BUILDER RETURNS A NARROW TYPE FOR THE NAMED CASE, rather than
 * stripping fields from a wide one: a strip is a runtime operation that can be
 * forgotten, reordered, or defeated by a later `...spread`. A separate return
 * type means there is no field to forget — the persona values never enter the
 * named payload's shape at all.
 */
import type { CiphertextPointer } from "@/lib/portrait-vault";
import type { FaceId } from "@/lib/persona-codex";

export interface InstitutionalSubject {
  kind: "institution";
  subjectRef: string;
  /** Safe here: an institution is not a person. */
  displayName: string;
  legIndex: number;
  crownedFace: FaceId;
  permanent: Record<FaceId, number>;
  transitory: Record<FaceId, number>;
  divergence: number;
  isSlip: boolean;
}

export interface NamedIndividualSubject {
  kind: "named_individual";
  subjectRef: string;
  legIndex: number;
  /** Only portrait-vault.ts can produce this. */
  ciphertext: CiphertextPointer;
  /**
   * Market events, recorded on-chain independently of the payload. Emergent
   * rarity survives erasure precisely because these are not personal data — a
   * Slip-leg portrait stays provably a Slip-leg portrait once the key is gone.
   */
  isSlip: boolean;
}

export type PortraitSubject = InstitutionalSubject | NamedIndividualSubject;

// Declared as type aliases rather than interfaces on purpose: only an alias of
// an object literal type gets an implicit index signature, which is what lets
// `personalDataLeaks` enumerate the payload's own keys without a double cast.
export type InstitutionalPayload = {
  track: "institutional";
  subjectRef: string;
  name: string;
  legIndex: number;
  crowned: FaceId;
  permanent: Record<FaceId, number>;
  transitory: Record<FaceId, number>;
  divergence: number;
  slip: boolean;
};

/**
 * The named on-chain payload. Note what this type does NOT have a field for:
 * name, persona label, persona values. There is nothing to strip because there
 * is nothing to set.
 */
export type NamedPayload = {
  track: "named";
  subjectRef: string;
  legIndex: number;
  ciphertextRef: string;
  slip: boolean;
};

export type OnChainPayload = InstitutionalPayload | NamedPayload;

export function buildOnChainPayload(subject: PortraitSubject): OnChainPayload {
  if (subject.kind === "named_individual") {
    return {
      track: "named",
      subjectRef: subject.subjectRef,
      legIndex: subject.legIndex,
      ciphertextRef: subject.ciphertext,
      slip: subject.isSlip,
    };
  }
  return {
    track: "institutional",
    subjectRef: subject.subjectRef,
    name: subject.displayName,
    legIndex: subject.legIndex,
    crowned: subject.crownedFace,
    permanent: subject.permanent,
    transitory: subject.transitory,
    divergence: subject.divergence,
    slip: subject.isSlip,
  };
}

/**
 * INTERLOCK layer 3, the assertable half. CI runs this over every
 * named-individual fixture; it is exported rather than inlined in the test so
 * the same predicate can also guard the mint path at runtime.
 *
 * Returns the offending keys rather than a boolean — a failure that names the
 * leak is a failure somebody can fix without bisecting.
 */
export function personalDataLeaks(payload: OnChainPayload): string[] {
  if (payload.track !== "named") return [];
  const allowed = new Set(["track", "subjectRef", "legIndex", "ciphertextRef", "slip"]);
  const leaks = Object.keys(payload as Record<string, unknown>).filter((k) => !allowed.has(k));
  // Belt and braces: a persona label smuggled into a permitted string field is
  // still a leak, and it is the shape a careless refactor actually produces.
  const forbidden = /saint|white[_ ]?rice|megalomaniac|narcissist|prostitute|sellout|sell[- ]out|thermostat|too big to fail/i;
  for (const [k, v] of Object.entries(payload as Record<string, unknown>)) {
    if (typeof v === "string" && forbidden.test(v)) leaks.push(`${k}:persona-label`);
  }
  return leaks;
}

/**
 * The honest qualifier (§6.2.1). Verifiability copy differs by track, and the
 * named track's claim is narrower on purpose — a collector who discovers the
 * limitation later is a collector who stops trusting the whole series.
 */
export function verifiabilityCopy(payload: OnChainPayload): string {
  return payload.track === "institutional"
    ? "Independently verifiable against chain history, permanently."
    : "Provably part of the series and provably minted at this leg. The character reading is readable only while the subject's key lives; after an upheld erasure the token remains verifiable as a series member and is permanently unreadable.";
}
