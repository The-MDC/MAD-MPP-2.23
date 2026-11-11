/**
 * One spread-market family, three instantiations (maths document Part 1.4):
 *
 *   VERSUS                  S = logit(p_A) − logit(p_B)   two storylines
 *   PERCEIVED vs ACTUAL     the same S, leg A resolves on what the crowd believed, leg B on what the record shows
 *   COHORT DISPERSION       the same S, leg A and leg B are cohorts (creators, traders, public) on ONE question
 *
 * Same transform, same book, same funding logic. They differ only in what the legs are, so they are ONE family with
 * parameterised legs, not three families (building three is how the engine reaches fourteen sections and stops being
 * auditable). This file is the specification and its validator: it refuses a market that cannot be defended.
 *
 * What a valid spec must show:
 *   - two distinct legs, BOTH resolved mechanically (any discretion turns the spread into an agency problem);
 *   - for perceived-vs-actual, two evidence channels that are genuinely independent (different source and group);
 *   - for cohort dispersion, at most three cohorts, separately funded books, parameters published (a weighted single
 *     book makes dispersion synthetic: the weights are a number you chose);
 *   - the per-subject exposure gate (lib/exposure-gate.ts), without which two legs are a donation.
 *
 * Nothing here touches the database, and no spec is sold to a user: it is the design a market must satisfy to open.
 */
import { softClamp } from "./gambit-game-math";

/** Probability kept strictly inside (0, 1) so the logit is always finite. Identity everywhere except the last 1e-6. */
const P_WIDTH = 1e-6;
export function logit(p: number): number {
  // A probability outside [0, 1] is not a probability; bring it to the nearest edge first, so the smooth bound
  // below never has to act on an input far enough outside to underflow (it only guarantees finiteness near the edges).
  const q = softClamp(Math.min(1, Math.max(0, Number.isFinite(p) ? p : 0.5)), 0, 1, P_WIDTH);
  return Math.log(q / (1 - q));
}

/** S = logit(p_A) − logit(p_B). Antisymmetric: swapping the legs flips the sign. Zero when the legs agree. */
export function spread(pA: number, pB: number): number {
  return logit(pA) - logit(pB);
}

export type Instantiation = "versus" | "perceived-vs-actual" | "cohort-dispersion";
export type LegKind = "storyline" | "belief" | "record" | "cohort";

export interface Evidence {
  name: string;
  url: string;
  /** Sources that share an owner or derive from one another share a group. Independence means different groups. */
  group: string;
}

export interface Leg {
  id: string;
  label: string;
  kind: LegKind;
  evidence: Evidence;
  resolution: "mechanical" | "discretionary";
}

export interface SpreadSpec {
  family: "spread";
  instantiation: Instantiation;
  question: string;
  legs: [Leg, Leg];
  funding: "separate-books" | "weighted-single-book";
  /** Cohort parameters (and weights, if any) are published, not chosen quietly. */
  parametersPublished: boolean;
  /** The per-subject exposure gate (lib/exposure-gate.ts) is in force for this market. */
  exposureGate: boolean;
}

export const MAX_COHORTS = 3;

export function validateSpreadSpec(spec: SpreadSpec): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const [a, b] = spec.legs;
  if (!spec.question.trim()) errors.push("the question is empty");
  if (a.id === b.id) errors.push("the two legs must be different");
  for (const leg of spec.legs) {
    if (leg.resolution !== "mechanical") errors.push(`leg ${leg.id} resolves by discretion; whoever holds the discretion holds the edge`);
    if (!/^https?:\/\//.test(leg.evidence.url)) errors.push(`leg ${leg.id} has no checkable evidence URL`);
  }
  if (!spec.exposureGate) errors.push("the per-subject exposure gate is not in force; with two legs one account can hold both sides risk free");

  if (spec.instantiation === "versus") {
    if (a.kind !== "storyline" || b.kind !== "storyline") errors.push("VERSUS legs must both be storylines");
  } else if (spec.instantiation === "perceived-vs-actual") {
    if (!(a.kind === "belief" && b.kind === "record")) errors.push("perceived-vs-actual needs leg A = belief and leg B = record");
    if (a.evidence.group === b.evidence.group) errors.push("the belief and record channels share an evidence group, so they are not independent and the spread is noise");
    if (a.evidence.url === b.evidence.url) errors.push("the belief and record channels use the same source");
  } else if (spec.instantiation === "cohort-dispersion") {
    if (a.kind !== "cohort" || b.kind !== "cohort") errors.push("cohort dispersion legs must both be cohorts");
    if (spec.funding !== "separate-books") errors.push("cohort dispersion needs separately funded books; a weighted single book makes the dispersion synthetic");
    if (!spec.parametersPublished) errors.push("cohort parameters must be published");
  }
  return { ok: errors.length === 0, errors };
}

/** A market may open only if its spec validates AND the gate is wired in the running system. */
export function canOpen(spec: SpreadSpec, runtime: { exposureGateWired: boolean }): { ok: boolean; errors: string[] } {
  const v = validateSpreadSpec(spec);
  const errors = [...v.errors];
  if (!runtime.exposureGateWired) errors.push("the exposure gate is not wired into trading yet");
  return { ok: errors.length === 0, errors };
}

const mech = "mechanical" as const;

export function buildPerceivedVsActual(input: { question: string; belief: Evidence; record: Evidence }): SpreadSpec {
  return {
    family: "spread",
    instantiation: "perceived-vs-actual",
    question: input.question,
    legs: [
      { id: "belief", label: "What the crowd believed", kind: "belief", evidence: input.belief, resolution: mech },
      { id: "record", label: "What the record shows", kind: "record", evidence: input.record, resolution: mech },
    ],
    funding: "separate-books",
    parametersPublished: true,
    exposureGate: true,
  };
}

/** Every pair of cohorts on one question. Three cohorts give three spreads; a fourth is refused until each has depth. */
export function buildCohortDispersion(input: { question: string; cohorts: Array<{ id: string; label: string; evidence: Evidence }> }): SpreadSpec[] {
  if (input.cohorts.length < 2) throw new Error("cohort dispersion needs at least two cohorts");
  if (input.cohorts.length > MAX_COHORTS) throw new Error(`start with at most ${MAX_COHORTS} cohorts: a cohort with no depth produces a dispersion reading that is pure noise`);
  const out: SpreadSpec[] = [];
  for (let i = 0; i < input.cohorts.length; i++) {
    for (let j = i + 1; j < input.cohorts.length; j++) {
      const [x, y] = [input.cohorts[i], input.cohorts[j]];
      out.push({
        family: "spread",
        instantiation: "cohort-dispersion",
        question: input.question,
        legs: [
          { id: x.id, label: x.label, kind: "cohort", evidence: x.evidence, resolution: mech },
          { id: y.id, label: y.label, kind: "cohort", evidence: y.evidence, resolution: mech },
        ],
        funding: "separate-books",
        parametersPublished: true,
        exposureGate: true,
      });
    }
  }
  return out;
}
