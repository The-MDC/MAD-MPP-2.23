/**
 * The resolution state machine — pure, clock-passed-in, no I/O.
 *
 *     open ──(closes_at)──► closed ──assert──► asserted ──(liveness, no dispute)──► resolved
 *                              │                   │
 *                              │                   └──dispute──► disputed ──vote(quorum)──► resolved
 *                              │                                    │
 *                              │                                    └──(no quorum)──► founder fallback ──► resolved
 *                              └─────────(deadline + fallback_after, nobody decided)─────────► cancelled (refund)
 *
 * What the 2026-11-10 map found, and the rule that answers each:
 *   • `resolve()` was owner-only with any value and no deadline      → anyone may ASSERT, but only with a bond that
 *     covers the pot; the owner is a named fallback after a vote, not the first resort.
 *   • funds locked forever if the owner never acted                   → past deadline + fallback_after the market
 *     CANCELS and refunds on its own (`expire`). It can never lock.
 *   • double resolution                                               → a final state rejects every event.
 *   • resolution before the close                                     → rejected until `closes_at`.
 *   • the disputer won whenever the owner's value matched neither side → an outcome is one of the two CLAIMS (or
 *     CANCEL), never a third value.
 *
 * Every function returns a NEW state or a reason; none mutates its input. Times are epoch milliseconds.
 */
import { requiredChallengeBond, requiredResolverBond, type Outcome, type ResolutionSpec } from "./resolution-spec";

/** MADDisputeVoting: 24 h commit + 12 h reveal. A vote is not decidable before this has passed. */
export const VOTE_WINDOW_SECONDS = 36 * 60 * 60;

export type Phase = "open" | "closed" | "asserted" | "disputed" | "resolved" | "cancelled";
export type ResolvedBy = "liveness" | "community-vote" | "founder-fallback" | "expiry" | "no-evidence";

export interface Assertion {
  outcome: Outcome;
  bond: number;
  by: string;
  at: number;
}
export interface Dispute {
  /** The disputer's own claim of the correct outcome. */
  counter: Outcome;
  bond: number;
  by: string;
  at: number;
}

export interface ResolutionState {
  phase: Phase;
  /** Final outcome of a resolved market. `null` while pending and for cancelled markets (refund). */
  outcome: "YES" | "NO" | null;
  assertion: Assertion | null;
  dispute: Dispute | null;
  /** True once a community vote finished without quorum, which is what opens the founder fallback. */
  voteFailed: boolean;
  resolvedAt: number | null;
  resolvedBy: ResolvedBy | null;
}

export type Result = { ok: true; state: ResolutionState } | { ok: false; reason: string };

export const initialState = (): ResolutionState => ({
  phase: "open",
  outcome: null,
  assertion: null,
  dispute: null,
  voteFailed: false,
  resolvedAt: null,
  resolvedBy: null,
});

const fail = (reason: string): Result => ({ ok: false, reason });
const done = (state: ResolutionState): Result => ({ ok: true, state });
const isFinal = (s: ResolutionState) => s.phase === "resolved" || s.phase === "cancelled";
const ms = (iso: string) => Date.parse(iso);

/** A resolving family's timeline, or `null` for one that never settles. */
function timeline(spec: ResolutionSpec) {
  if (spec.settlement !== "resolves" || !spec.decision || !spec.dispute || !spec.resolver) return null;
  const closesAt = ms(spec.decision.closes_at);
  const deadline = ms(spec.decision.deadline);
  return { closesAt, deadline, expiresAt: deadline + spec.dispute.fallback_after_seconds * 1000, livenessMs: spec.dispute.liveness_seconds * 1000 };
}

/**
 * The phase the market is in AT `now`: the stored phase, advanced by the clock where the clock alone decides.
 * (`open` becomes `closed` at the close; any unresolved phase becomes `cancelled` at deadline + fallback_after.)
 */
export function phaseAt(state: ResolutionState, spec: ResolutionSpec, now: number): Phase {
  if (isFinal(state)) return state.phase;
  const t = timeline(spec);
  if (!t) return state.phase;
  if (now >= t.expiresAt) return "cancelled";
  if (state.phase === "open" && now >= t.closesAt) return "closed";
  return state.phase;
}

/** Trading is allowed only while the market is open, before its close, and no clarification has paused it. */
export function tradingAllowed(state: ResolutionState, spec: ResolutionSpec, now: number, pausedByClarification = false): boolean {
  if (pausedByClarification) return false;
  const t = timeline(spec);
  if (!t) return false; // a never-settling family is priced by its own book; nothing here opens or closes it
  return phaseAt(state, spec, now) === "open" && now < t.closesAt;
}

/** The edge-case outcome a spec decided in advance, or `null` if the spec does not mention that state. */
export function boundaryOutcome(spec: ResolutionSpec, state: string): Outcome | null {
  const key = state.trim().toLowerCase();
  const hit = spec.boundaries.find((b) => b.state.trim().toLowerCase() === key);
  return hit ? hit.outcome : null;
}

/** What is owed: winners paid, everyone refunded, or nothing yet. */
export function payoutKind(state: ResolutionState): "winners" | "refund" | "pending" {
  if (state.phase === "resolved") return "winners";
  if (state.phase === "cancelled") return "refund";
  return "pending";
}

/** Apply the clock: if the market has expired unresolved, it is cancelled and refundable. Idempotent. */
export function expire(state: ResolutionState, spec: ResolutionSpec, now: number): Result {
  if (isFinal(state)) return done(state);
  const t = timeline(spec);
  if (!t) return fail("this family does not settle, so it cannot expire");
  if (now < t.expiresAt) return fail("not expired yet");
  return done({ ...state, phase: "cancelled", outcome: null, resolvedAt: t.expiresAt, resolvedBy: "expiry" });
}

export interface AssertInput {
  outcome: Outcome;
  bond: number;
  by: string;
  /** The market's current pot, for the bond rule. */
  pot: number;
}

export function assertOutcome(state: ResolutionState, spec: ResolutionSpec, input: AssertInput, now: number): Result {
  const t = timeline(spec);
  if (!t) return fail("this family does not settle; there is nothing to assert");
  if (isFinal(state)) return fail(`already ${state.phase}; the outcome is final`);
  const phase = phaseAt(state, spec, now);
  if (phase === "cancelled") return fail("the market has expired and is cancelled");
  if (phase === "open") return fail("the market has not closed; an outcome cannot be asserted before the close");
  if (phase !== "closed") return fail(`an outcome is already ${phase === "asserted" ? "asserted" : "under dispute"}`);
  if (input.outcome !== "YES" && input.outcome !== "NO" && input.outcome !== "CANCEL") return fail("outcome must be YES, NO or CANCEL");
  if (!input.by || !input.by.trim()) return fail("an asserter is required");
  if (!Number.isFinite(input.bond) || input.bond <= 0) return fail("a bond is required");
  const need = requiredResolverBond(spec, input.pot);
  if (input.bond < need) return fail(`bond ${input.bond} is below the required ${need}`);
  return done({ ...state, phase: "asserted", assertion: { outcome: input.outcome, bond: input.bond, by: input.by, at: now } });
}

export interface DisputeInput {
  counter: Outcome;
  bond: number;
  by: string;
}

export function disputeAssertion(state: ResolutionState, spec: ResolutionSpec, input: DisputeInput, now: number): Result {
  const t = timeline(spec);
  if (!t || !spec.dispute) return fail("this family does not settle; there is nothing to dispute");
  if (isFinal(state)) return fail(`already ${state.phase}; the outcome is final`);
  if (phaseAt(state, spec, now) === "cancelled") return fail("the market has expired and is cancelled");
  if (state.phase !== "asserted" || !state.assertion) return fail("there is no standing assertion to dispute");
  if (now >= state.assertion.at + t.livenessMs) return fail("the dispute window has closed");
  if (!input.by || input.by === state.assertion.by) return fail("an asserter cannot dispute their own assertion");
  if (input.counter !== "YES" && input.counter !== "NO" && input.counter !== "CANCEL") return fail("counter must be YES, NO or CANCEL");
  if (input.counter === state.assertion.outcome) return fail("a dispute must claim a different outcome");
  const need = requiredChallengeBond(spec, state.assertion.bond);
  if (!Number.isFinite(input.bond) || input.bond < need) return fail(`a challenge needs a bond of at least ${need}`);
  return done({ ...state, phase: "disputed", dispute: { counter: input.counter, bond: input.bond, by: input.by, at: now } });
}

/** Resolve a market to a final claim: YES/NO resolves it, CANCEL cancels it for a refund. */
function conclude(state: ResolutionState, outcome: Outcome, by: ResolvedBy, now: number): ResolutionState {
  if (outcome === "CANCEL") return { ...state, phase: "cancelled", outcome: null, resolvedAt: now, resolvedBy: by };
  return { ...state, phase: "resolved", outcome, resolvedAt: now, resolvedBy: by };
}

/** An undisputed assertion stands after its liveness: anyone may settle it. */
export function settleUndisputed(state: ResolutionState, spec: ResolutionSpec, now: number): Result {
  const t = timeline(spec);
  if (!t) return fail("this family does not settle");
  if (isFinal(state)) return fail(`already ${state.phase}; the outcome is final`);
  if (state.phase !== "asserted" || !state.assertion) return fail("there is no undisputed assertion to settle");
  if (now < state.assertion.at + t.livenessMs) return fail("the dispute window is still open");
  return done(conclude(state, state.assertion.outcome, state.assertion.outcome === "CANCEL" ? "no-evidence" : "liveness", now));
}

/** The community vote finished. With quorum its winning CLAIM decides; without it the founder fallback opens. */
export function resolveByVote(state: ResolutionState, spec: ResolutionSpec, vote: { quorumMet: boolean; winner: "asserter" | "disputer" }, now: number): Result {
  const t = timeline(spec);
  if (!t) return fail("this family does not settle");
  if (isFinal(state)) return fail(`already ${state.phase}; the outcome is final`);
  if (phaseAt(state, spec, now) === "cancelled") return fail("the market has expired and is cancelled");
  if (state.phase !== "disputed" || !state.assertion || !state.dispute) return fail("there is no disputed assertion to decide");
  if (now < state.dispute.at + VOTE_WINDOW_SECONDS * 1000) return fail("the vote window is still running");
  if (!vote.quorumMet) return done({ ...state, voteFailed: true });
  const claim = vote.winner === "asserter" ? state.assertion.outcome : state.dispute.counter;
  return done(conclude(state, claim, "community-vote", now));
}

/**
 * The named fallback. Only after a vote has failed to reach quorum, and only to one of the two CLAIMS — the owner
 * cannot invent a third value (the old `resolveDispute` let the disputer win on a value matching neither claim).
 */
export function resolveByFallback(state: ResolutionState, spec: ResolutionSpec, pick: { claim: "asserter" | "disputer"; by: string }, now: number): Result {
  const t = timeline(spec);
  if (!t) return fail("this family does not settle");
  if (isFinal(state)) return fail(`already ${state.phase}; the outcome is final`);
  if (phaseAt(state, spec, now) === "cancelled") return fail("the market has expired and is cancelled");
  if (state.phase !== "disputed" || !state.assertion || !state.dispute) return fail("there is no disputed assertion to decide");
  if (!state.voteFailed) return fail("the fallback opens only after a community vote has failed to reach quorum");
  if (!pick.by || !pick.by.trim()) return fail("the fallback decider must be named");
  if (pick.claim !== "asserter" && pick.claim !== "disputer") return fail("the fallback must choose one of the two claims");
  const claim = pick.claim === "asserter" ? state.assertion.outcome : state.dispute.counter;
  return done(conclude(state, claim, "founder-fallback", now));
}

/** Map a phase onto the `markets.status` column (free text; `cancelled` is new in 0027's world). */
export function statusFor(phase: Phase): "open" | "resolving" | "disputed" | "resolved" | "cancelled" {
  switch (phase) {
    case "open":
      return "open";
    case "closed":
    case "asserted":
      return "resolving";
    case "disputed":
      return "disputed";
    case "resolved":
      return "resolved";
    case "cancelled":
      return "cancelled";
  }
}
