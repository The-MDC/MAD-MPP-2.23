/**
 * ResolutionSpec — the rule that decides a market, written down BEFORE the first bet and immutable after.
 *
 * Why this exists: a map of the codebase (2026-11-10) found no code that resolved a database market, an owner-only
 * `resolve()` on-chain with no deadline, an optimistic oracle nothing read, and a `questionId` bound to nothing. A
 * market whose rule is not fixed in advance has a price that is a guess about the resolver's mood. So:
 *
 *   • ONE source of truth. `renderSpecJson` (machine) and `renderSpecPage` (customer) are both derived from the same
 *     object here; neither is hand-written separately. Two sources of truth on settlement is the same bug in HTML.
 *   • FAIL CLOSED. `validateResolutionSpec` returns every problem it finds; a spec with any problem is not a spec and
 *     no market may point at it. A market that opens with a broken rule is worse than one that never opens.
 *   • CONTENT-ADDRESSED. `hashSpec` is sha256 of the canonical JSON, so a claim cannot be swapped under a market. UMA's
 *     Optimistic Oracle V3 binds its assertion id to claim, bond, liveness and callback for the same reason.
 *   • PER FAMILY, INHERITED. `buildSpec` merges a family's defaults with the few parameters a market supplies, so there
 *     are a handful of rules to audit, not hundreds.
 *
 * SERVER ONLY (uses node:crypto). Do not import this from a client component; render from the JSON/page model.
 */
import { createHash } from "node:crypto";

/* ── Types ──────────────────────────────────────────────────────── */

export const SPEC_SCHEMA_VERSION = 1 as const;

export type SettlementKind = "resolves" | "never_settles";
export type Outcome = "YES" | "NO" | "CANCEL";
export type ConflictRule = "escalate" | "cancel_refund" | "majority_independent";

export interface EvidenceSource {
  /** Human name of the source ("Associated Press results API"). */
  name: string;
  /** Where the reader can check it. https only. */
  url: string;
  /** Independence group. Two feeds from the SAME provider share a group and count as ONE source. */
  group: string;
}

export interface PredicateInput {
  /** The named, versioned input the rule reads. */
  name: string;
  /** Which evidence source supplies it (by `EvidenceSource.name`). */
  source: string;
  version: string;
}

export interface Boundary {
  /** A state an adversary can create that sits exactly on the edge of the rule. */
  state: string;
  /** What the spec says happens in it. */
  outcome: Outcome;
}

export interface ResolutionSpec {
  schema: typeof SPEC_SCHEMA_VERSION;
  family: string;
  settlement: SettlementKind;
  /** The rule in plain language. This is the sentence a customer reads. */
  question_template: string;
  predicate: { inputs: PredicateInput[]; expression: string };
  evidence: EvidenceSource[];
  /** `null` only for `never_settles` families (a counterfactual has no deadline). */
  decision: { closes_at: string; deadline: string; min_tenor_days: number } | null;
  resolver: {
    /** Smallest bond that may assert an outcome. Always above zero (UMA refuses a zero minimum too). */
    min_bond_madx: number;
    /** The bond must also be at least this multiple of the market's pot, so lying never pays. */
    bond_pot_multiple: number;
  } | null;
  dispute: {
    /** How long an assertion stands before it can be settled. */
    liveness_seconds: number;
    /** Each challenger must post at least this multiple of the standing bond (reality.eth doubles). */
    challenge_bond_multiple: number;
    escalation: "community-vote";
    /** Who decides if the vote does not reach quorum. Named, not implied. */
    fallback: "founder";
    /** If nobody has resolved this long after the deadline, the market cancels and refunds — never locks. */
    fallback_after_seconds: number;
  } | null;
  on_no_evidence: "cancel_refund";
  on_conflict: { rule: ConflictRule };
  boundaries: Boundary[];
  /** Risks the founder has knowingly accepted, e.g. "single-evidence-group". */
  accepted_risks: string[];
  finality: { immutable: true; clarifications: "append-only" };
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

/* ── Limits (every array and string a caller can grow is bounded) ── */

export const LIMITS = {
  MIN_LIVENESS_SECONDS: 2 * 60 * 60, // 2 h: the floor UMA and our own oracle default to
  MAX_LIVENESS_SECONDS: 14 * 24 * 60 * 60,
  MIN_CHALLENGE_MULTIPLE: 2, // reality.eth: every challenge at least doubles the bond
  // commit (24 h) + reveal (12 h) of MADDisputeVoting, so the fallback can never fire mid-vote.
  MIN_FALLBACK_SECONDS: 36 * 60 * 60,
  MAX_FALLBACK_SECONDS: 30 * 24 * 60 * 60,
  MIN_TENOR_DAYS_FLOOR: 30, // MASTER §12b (CIRO): legs are never shorter than 30 days
  QUESTION_MIN: 20,
  QUESTION_MAX: 2000,
  NAME_MAX: 100,
  EXPR_MAX: 500,
  MAX_EVIDENCE: 12,
  MAX_INPUTS: 12,
  MAX_BOUNDARIES: 24,
  MAX_RISKS: 12,
} as const;

const SLUG = /^[a-z][a-z0-9-]{1,47}$/;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
const OUTCOMES: ReadonlySet<string> = new Set(["YES", "NO", "CANCEL"]);
const CONFLICT_RULES: ReadonlySet<string> = new Set(["escalate", "cancel_refund", "majority_independent"]);

/** The one risk that lets a spec rely on fewer than two independent evidence groups. */
export const SINGLE_SOURCE_RISK = "single-evidence-group";

/* ── Validation ─────────────────────────────────────────────────── */

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown, min: number, max: number): v is string => typeof v === "string" && v.trim().length >= min && v.length <= max;
const isPosFinite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v > 0;
const isHttps = (v: unknown): boolean => {
  if (typeof v !== "string" || v.length > 500) return false;
  try {
    return new URL(v).protocol === "https:";
  } catch {
    return false;
  }
};

/**
 * Every problem with `spec`, or none. `now` is only needed for the minimum-tenor rule, which is a property of
 * CREATING a market ("it must run at least 30 days"), not of the spec's shape.
 */
export function validateResolutionSpec(spec: unknown, opts: { now?: Date } = {}): ValidationResult {
  const errors: string[] = [];
  const err = (m: string) => errors.push(m);

  if (!isObj(spec)) return { ok: false, errors: ["spec must be an object"] };
  const s = spec as Record<string, unknown>;

  if (s.schema !== SPEC_SCHEMA_VERSION) err(`schema must be ${SPEC_SCHEMA_VERSION}`);
  if (typeof s.family !== "string" || !SLUG.test(s.family)) err("family must be a lowercase slug (a-z, 0-9, -)");
  if (s.settlement !== "resolves" && s.settlement !== "never_settles") err('settlement must be "resolves" or "never_settles"');
  if (!isStr(s.question_template, LIMITS.QUESTION_MIN, LIMITS.QUESTION_MAX)) {
    err(`question_template must be ${LIMITS.QUESTION_MIN}-${LIMITS.QUESTION_MAX} characters of plain language`);
  }

  // Evidence + independence.
  const evidence = Array.isArray(s.evidence) ? s.evidence : null;
  const groups = new Set<string>();
  const sourceNames = new Set<string>();
  if (!evidence || evidence.length < 1 || evidence.length > LIMITS.MAX_EVIDENCE) {
    err(`evidence must list 1-${LIMITS.MAX_EVIDENCE} sources`);
  } else {
    evidence.forEach((e, i) => {
      if (!isObj(e)) return err(`evidence[${i}] must be an object`);
      if (!isStr(e.name, 1, LIMITS.NAME_MAX)) err(`evidence[${i}].name is required (max ${LIMITS.NAME_MAX})`);
      if (!isHttps(e.url)) err(`evidence[${i}].url must be an https URL`);
      if (!isStr(e.group, 1, LIMITS.NAME_MAX)) err(`evidence[${i}].group is required (two feeds from one provider share a group)`);
      else groups.add(String(e.group).trim().toLowerCase());
      if (typeof e.name === "string") {
        if (sourceNames.has(e.name)) err(`evidence[${i}].name "${e.name}" is duplicated`);
        sourceNames.add(e.name);
      }
    });
  }
  const risks = Array.isArray(s.accepted_risks) ? s.accepted_risks : null;
  if (!risks || risks.length > LIMITS.MAX_RISKS || risks.some((r) => !isStr(r, 1, 200))) {
    err(`accepted_risks must be an array of up to ${LIMITS.MAX_RISKS} short strings (may be empty)`);
  }
  if (evidence && groups.size < 2 && !(risks ?? []).includes(SINGLE_SOURCE_RISK)) {
    err(`only ${groups.size} independent evidence group(s): list a second independent source, or accept the risk explicitly with "${SINGLE_SOURCE_RISK}"`);
  }

  // Predicate: named, versioned inputs that each point at a real source.
  const pred = s.predicate;
  if (!isObj(pred)) err("predicate is required");
  else {
    if (!isStr(pred.expression, 3, LIMITS.EXPR_MAX)) err(`predicate.expression is required (max ${LIMITS.EXPR_MAX})`);
    const inputs = Array.isArray(pred.inputs) ? pred.inputs : null;
    if (!inputs || inputs.length < 1 || inputs.length > LIMITS.MAX_INPUTS) err(`predicate.inputs must list 1-${LIMITS.MAX_INPUTS} named inputs`);
    else {
      inputs.forEach((p, i) => {
        if (!isObj(p)) return err(`predicate.inputs[${i}] must be an object`);
        if (!isStr(p.name, 1, LIMITS.NAME_MAX)) err(`predicate.inputs[${i}].name is required`);
        if (!isStr(p.version, 1, 40)) err(`predicate.inputs[${i}].version is required (inputs are versioned)`);
        if (typeof p.source !== "string" || !sourceNames.has(p.source)) err(`predicate.inputs[${i}].source "${String(p.source)}" is not one of the evidence sources`);
      });
    }
  }

  // Failure handling: disagreement, not just silence.
  if (s.on_no_evidence !== "cancel_refund") err('on_no_evidence must be "cancel_refund" (a market with no evidence is refunded, never guessed)');
  if (!isObj(s.on_conflict) || typeof s.on_conflict.rule !== "string" || !CONFLICT_RULES.has(s.on_conflict.rule)) {
    err("on_conflict.rule must be escalate, cancel_refund or majority_independent (what happens when sources DISAGREE)");
  } else if (s.on_conflict.rule === "majority_independent" && groups.size < 3) {
    err("on_conflict.rule majority_independent needs at least 3 independent evidence groups");
  }

  // Boundaries: every edge an adversary can sit on says which way it resolves.
  const bounds = Array.isArray(s.boundaries) ? s.boundaries : null;
  if (!bounds || bounds.length < 1 || bounds.length > LIMITS.MAX_BOUNDARIES) err(`boundaries must list 1-${LIMITS.MAX_BOUNDARIES} edge cases`);
  else {
    const seen = new Set<string>();
    bounds.forEach((b, i) => {
      if (!isObj(b)) return err(`boundaries[${i}] must be an object`);
      if (!isStr(b.state, 3, 200)) err(`boundaries[${i}].state is required`);
      else {
        const k = String(b.state).trim().toLowerCase();
        if (seen.has(k)) err(`boundaries[${i}].state "${b.state}" is duplicated`);
        seen.add(k);
      }
      if (typeof b.outcome !== "string" || !OUTCOMES.has(b.outcome)) err(`boundaries[${i}].outcome must be YES, NO or CANCEL`);
    });
  }

  // Finality.
  if (!isObj(s.finality) || s.finality.immutable !== true || s.finality.clarifications !== "append-only") {
    err('finality must be { immutable: true, clarifications: "append-only" }');
  }

  // Settlement-specific: a family that resolves needs a decision window, a resolver and a dispute path.
  if (s.settlement === "resolves") {
    const d = s.decision;
    if (!isObj(d)) err("a family that resolves needs a decision window");
    else {
      const okTimes = typeof d.closes_at === "string" && ISO.test(d.closes_at) && typeof d.deadline === "string" && ISO.test(d.deadline);
      if (!okTimes) err("decision.closes_at and decision.deadline must be UTC ISO-8601 (…Z)");
      else {
        const closes = Date.parse(d.closes_at as string);
        const deadline = Date.parse(d.deadline as string);
        if (!(closes < deadline)) err("decision.deadline must be after decision.closes_at");
        if (opts.now && typeof d.min_tenor_days === "number" && closes - opts.now.getTime() < d.min_tenor_days * 86_400_000) {
          err(`the market must run at least ${d.min_tenor_days} days before it closes`);
        }
      }
      if (typeof d.min_tenor_days !== "number" || !Number.isFinite(d.min_tenor_days) || d.min_tenor_days < LIMITS.MIN_TENOR_DAYS_FLOOR) {
        err(`decision.min_tenor_days must be at least ${LIMITS.MIN_TENOR_DAYS_FLOOR} (MASTER §12b: legs are never shorter than 30 days)`);
      }
    }

    const r = s.resolver;
    if (!isObj(r)) err("a family that resolves needs a resolver bond rule");
    else {
      if (!isPosFinite(r.min_bond_madx)) err("resolver.min_bond_madx must be above zero");
      if (!isPosFinite(r.bond_pot_multiple) || (r.bond_pot_multiple as number) < 1) err("resolver.bond_pot_multiple must be at least 1 (the bond must cover the gain from lying)");
    }

    const x = s.dispute;
    if (!isObj(x)) err("a family that resolves needs a dispute rule");
    else {
      if (typeof x.liveness_seconds !== "number" || !Number.isFinite(x.liveness_seconds) || x.liveness_seconds < LIMITS.MIN_LIVENESS_SECONDS || x.liveness_seconds > LIMITS.MAX_LIVENESS_SECONDS) {
        err(`dispute.liveness_seconds must be ${LIMITS.MIN_LIVENESS_SECONDS}-${LIMITS.MAX_LIVENESS_SECONDS}`);
      }
      if (typeof x.challenge_bond_multiple !== "number" || !Number.isFinite(x.challenge_bond_multiple) || x.challenge_bond_multiple < LIMITS.MIN_CHALLENGE_MULTIPLE) {
        err(`dispute.challenge_bond_multiple must be at least ${LIMITS.MIN_CHALLENGE_MULTIPLE}`);
      }
      if (x.escalation !== "community-vote") err('dispute.escalation must be "community-vote"');
      if (x.fallback !== "founder") err('dispute.fallback must be "founder" (name who decides when the vote has no quorum)');
      if (typeof x.fallback_after_seconds !== "number" || !Number.isFinite(x.fallback_after_seconds) || x.fallback_after_seconds < LIMITS.MIN_FALLBACK_SECONDS || x.fallback_after_seconds > LIMITS.MAX_FALLBACK_SECONDS) {
        err(`dispute.fallback_after_seconds must be ${LIMITS.MIN_FALLBACK_SECONDS}-${LIMITS.MAX_FALLBACK_SECONDS} (after the vote window, before it can lock funds)`);
      }
    }
  } else if (s.settlement === "never_settles") {
    if (s.decision !== null) err("a never_settles family has no decision window (decision must be null)");
    if (s.resolver !== null) err("a never_settles family has no resolver (resolver must be null)");
    if (s.dispute !== null) err("a never_settles family has no dispute path (dispute must be null)");
  }

  return { ok: errors.length === 0, errors };
}

/* ── Canonical JSON + hash ──────────────────────────────────────── */

/** Stable JSON: object keys sorted at every depth, no whitespace. The same spec always hashes the same. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`)
    .join(",")}}`;
}

export function hashSpec(spec: ResolutionSpec): string {
  return createHash("sha256").update(canonicalJson(spec)).digest("hex");
}

/** The id a spec is stored under. Derived from the hash, so two identical specs are one row. */
export function specId(hash: string): string {
  return `rs_${hash.slice(0, 16)}`;
}

/* ── Money rules ────────────────────────────────────────────────── */

/**
 * The smallest bond that may assert an outcome for a market holding `pot`. Always above zero, and never below the
 * pot times the spec's multiple, so that an asserter who also holds positions cannot profit from lying.
 */
export function requiredResolverBond(spec: ResolutionSpec, pot: number): number {
  if (!spec.resolver) return 0;
  const safePot = Number.isFinite(pot) && pot > 0 ? pot : 0;
  return Math.max(spec.resolver.min_bond_madx, spec.resolver.bond_pot_multiple * safePot);
}

/** What a challenger must post to dispute a standing bond. */
export function requiredChallengeBond(spec: ResolutionSpec, standingBond: number): number {
  if (!spec.dispute) return 0;
  return spec.dispute.challenge_bond_multiple * Math.max(0, standingBond);
}

/* ── Families: defaults a market inherits ───────────────────────── */

const COMMON = {
  schema: SPEC_SCHEMA_VERSION,
  on_no_evidence: "cancel_refund",
  finality: { immutable: true, clarifications: "append-only" },
} as const;

const RESOLVING_DEFAULTS = {
  resolver: { min_bond_madx: 88, bond_pot_multiple: 1 },
  dispute: {
    liveness_seconds: LIMITS.MIN_LIVENESS_SECONDS,
    challenge_bond_multiple: LIMITS.MIN_CHALLENGE_MULTIPLE,
    escalation: "community-vote",
    fallback: "founder",
    fallback_after_seconds: 72 * 60 * 60,
  },
} as const;

export type FamilyId = "binary-event" | "scalar-threshold" | "subjective-claim" | "paseome-foresight" | "paseome-hindsight";

export const FAMILIES: ReadonlyArray<FamilyId> = ["binary-event", "scalar-threshold", "subjective-claim", "paseome-foresight", "paseome-hindsight"];

export interface BuildInput {
  question: string;
  evidence: EvidenceSource[];
  predicate: ResolutionSpec["predicate"];
  boundaries: Boundary[];
  /** UTC ISO. Required for families that resolve. */
  closes_at?: string;
  deadline?: string;
  /** Conflict rule; defaults to escalating to the community vote. */
  on_conflict?: ConflictRule;
  accepted_risks?: string[];
}

/**
 * A family's defaults plus the market's own few parameters. Does NOT validate: call `validateResolutionSpec` on the
 * result (the store does), so there is exactly one place that decides whether a spec is acceptable.
 */
export function buildSpec(family: FamilyId, input: BuildInput): ResolutionSpec {
  const never = family === "paseome-hindsight";
  return {
    ...COMMON,
    family,
    settlement: never ? "never_settles" : "resolves",
    question_template: input.question,
    predicate: input.predicate,
    evidence: input.evidence,
    decision: never ? null : { closes_at: input.closes_at ?? "", deadline: input.deadline ?? "", min_tenor_days: LIMITS.MIN_TENOR_DAYS_FLOOR },
    resolver: never ? null : { ...RESOLVING_DEFAULTS.resolver },
    dispute: never ? null : { ...RESOLVING_DEFAULTS.dispute },
    on_conflict: { rule: input.on_conflict ?? "escalate" },
    boundaries: input.boundaries,
    accepted_risks: input.accepted_risks ?? [],
  };
}

/* ── One source of truth, two renderings ────────────────────────── */

export interface SpecJson {
  spec_id: string;
  spec_hash: string;
  schema: number;
  spec: ResolutionSpec;
}

/** The machine-readable object. `GET /api/v1/markets/:id/resolution` returns exactly this. */
export function renderSpecJson(spec: ResolutionSpec): SpecJson {
  const spec_hash = hashSpec(spec);
  return { spec_id: specId(spec_hash), spec_hash, schema: spec.schema, spec };
}

export interface SpecPageRow {
  label: string;
  value: string;
}
export interface SpecPage {
  title: string;
  specHash: string;
  sections: Array<{ heading: string; rows: SpecPageRow[] }>;
}

const days = (seconds: number) => (seconds >= 86_400 ? `${Math.round((seconds / 86_400) * 10) / 10} days` : `${Math.round(seconds / 3600)} hours`);

/**
 * The customer-facing page model, derived from the SAME object as the JSON. A renderer draws this; it never adds a
 * fact the spec does not contain.
 */
export function renderSpecPage(spec: ResolutionSpec): SpecPage {
  const json = renderSpecJson(spec);
  const sections: SpecPage["sections"] = [];

  sections.push({
    heading: "What decides it",
    rows: [
      { label: "The rule", value: spec.question_template },
      { label: "In symbols", value: spec.predicate.expression },
      { label: "Settles", value: spec.settlement === "resolves" ? "Yes — this market resolves." : "Never — this market is priced continuously and does not settle." },
    ],
  });

  sections.push({
    heading: "Who reports it",
    rows: [
      ...spec.evidence.map((e) => ({ label: e.name, value: `${e.url} (independence group: ${e.group})` })),
      { label: "Independent sources", value: String(new Set(spec.evidence.map((e) => e.group.trim().toLowerCase())).size) },
      { label: "If sources disagree", value: spec.on_conflict.rule.replace(/_/g, " ") },
      { label: "If there is no evidence", value: "The market is cancelled and every stake is refunded." },
    ],
  });

  if (spec.settlement === "resolves" && spec.decision && spec.resolver && spec.dispute) {
    sections.push({
      heading: "When, and what it costs to be wrong",
      rows: [
        { label: "Trading closes", value: spec.decision.closes_at },
        { label: "Resolve by", value: spec.decision.deadline },
        { label: "Reporter's bond", value: `at least ${spec.resolver.min_bond_madx} $MADx and ${spec.resolver.bond_pot_multiple}× the market's pot` },
        { label: "Dispute window", value: days(spec.dispute.liveness_seconds) },
        { label: "To challenge", value: `post ${spec.dispute.challenge_bond_multiple}× the standing bond` },
        { label: "If disputed", value: "a community vote of staked $MADx holders decides" },
        { label: "If the vote has no quorum", value: `the founder decides, after ${days(spec.dispute.fallback_after_seconds)}` },
        { label: "If nobody decides", value: "the market is cancelled and every stake is refunded — funds are never locked" },
      ],
    });
  }

  sections.push({
    heading: "Edge cases, decided in advance",
    rows: spec.boundaries.map((b) => ({ label: b.state, value: b.outcome === "CANCEL" ? "Cancelled and refunded" : `Resolves ${b.outcome}` })),
  });

  if (spec.accepted_risks.length) {
    sections.push({ heading: "Risks we accept, in the open", rows: spec.accepted_risks.map((r) => ({ label: r, value: "accepted by the founder" })) });
  }

  sections.push({
    heading: "Finality",
    rows: [
      { label: "Rule changes", value: "None. This rule is fixed before trading opens. Clarifications can be added and are dated; they cannot edit it." },
      { label: "Fingerprint (sha256)", value: json.spec_hash },
    ],
  });

  return { title: spec.question_template.length > 120 ? `${spec.question_template.slice(0, 117)}…` : spec.question_template, specHash: json.spec_hash, sections };
}
