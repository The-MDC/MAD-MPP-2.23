import { describe, expect, it } from "vitest";
import {
  VOTE_WINDOW_SECONDS,
  assertOutcome,
  boundaryOutcome,
  disputeAssertion,
  expire,
  initialState,
  payoutKind,
  phaseAt,
  resolveByFallback,
  resolveByVote,
  settleUndisputed,
  statusFor,
  tradingAllowed,
  type Phase,
  type ResolutionState,
  type Result,
} from "./market-resolution";
import { buildSpec, type BuildInput, type ResolutionSpec } from "./resolution-spec";

/**
 * The state machine's rules, one `it` per rule, each at the exact millisecond where the rule bites; then a model test
 * that throws random event sequences at it and checks the invariants that must hold whatever happens.
 *
 * THIS FILE MUST STAY UNDER `lib/` — vitest's `include` is `lib/**\/*.test.ts`.
 */
const T0 = Date.parse("2026-12-20T00:00:00Z"); // closes_at
const DEADLINE = Date.parse("2026-12-27T00:00:00Z");
const HOUR = 3_600_000;
const LIVENESS = 2 * HOUR; // spec default
const FALLBACK_AFTER = 72 * HOUR; // spec default
const EXPIRES = DEADLINE + FALLBACK_AFTER;

const input = (): BuildInput => ({
  question: "Will the stated result be reported by the league within the window?",
  evidence: [
    { name: "League API", url: "https://example.com/league", group: "league" },
    { name: "Wire service", url: "https://example.com/wire", group: "wire" },
  ],
  predicate: { inputs: [{ name: "result", source: "League API", version: "1" }], expression: "result.winner == team_a" },
  boundaries: [
    { state: "Game postponed without a declared result", outcome: "CANCEL" },
    { state: "Score revised after settlement", outcome: "YES" },
  ],
  closes_at: "2026-12-20T00:00:00Z",
  deadline: "2026-12-27T00:00:00Z",
});
const spec: ResolutionSpec = buildSpec("binary-event", input());
const hindsight = buildSpec("paseome-hindsight", { ...input(), closes_at: undefined, deadline: undefined });

const ok = (r: Result): ResolutionState => {
  if (!r.ok) throw new Error(`expected ok, got: ${r.reason}`);
  return r.state;
};
const reason = (r: Result): string => (r.ok ? "" : r.reason);

const asserted = (outcome: "YES" | "NO" | "CANCEL" = "YES", at = T0 + HOUR, bond = 100, pot = 50) =>
  ok(assertOutcome(initialState(), spec, { outcome, bond, by: "0xaaa", pot }, at));
const disputed = (at = T0 + 2 * HOUR) => ok(disputeAssertion(asserted("YES", T0 + HOUR), spec, { counter: "NO", bond: 200, by: "0xbbb" }, at));
const voteEnd = (d: ResolutionState) => d.dispute!.at + VOTE_WINDOW_SECONDS * 1000;

describe("the clock", () => {
  it("open until the close, closed from the close, cancelled from the expiry", () => {
    const s = initialState();
    expect(phaseAt(s, spec, T0 - 1)).toBe("open");
    expect(phaseAt(s, spec, T0)).toBe("closed");
    expect(phaseAt(s, spec, EXPIRES - 1)).toBe("closed");
    expect(phaseAt(s, spec, EXPIRES)).toBe("cancelled");
  });

  it("trading stops at the close, to the millisecond", () => {
    expect(tradingAllowed(initialState(), spec, T0 - 1)).toBe(true);
    expect(tradingAllowed(initialState(), spec, T0)).toBe(false);
  });

  it("a clarification can pause trading but nothing else", () => {
    expect(tradingAllowed(initialState(), spec, T0 - 1, true)).toBe(false);
  });

  it("a family that never settles never opens or closes here", () => {
    expect(tradingAllowed(initialState(), hindsight, T0 - 1)).toBe(false);
    expect(phaseAt(initialState(), hindsight, T0 + 1e12)).toBe("open");
  });
});

describe("asserting an outcome", () => {
  it("is refused before the close", () => {
    expect(reason(assertOutcome(initialState(), spec, { outcome: "YES", bond: 100, by: "a", pot: 0 }, T0 - 1))).toContain("before the close");
  });

  it("needs a bond that covers the pot: one unit short fails, exactly enough passes", () => {
    const pot = 10_000; // required bond = 10,000 × 1
    expect(reason(assertOutcome(initialState(), spec, { outcome: "YES", bond: 9_999, by: "a", pot }, T0))).toContain("below the required 10000");
    expect(assertOutcome(initialState(), spec, { outcome: "YES", bond: 10_000, by: "a", pot }, T0).ok).toBe(true);
  });

  it("a zero, negative, NaN or missing bond is refused even on an empty market", () => {
    for (const bond of [0, -1, Number.NaN, Infinity * 0]) {
      expect(assertOutcome(initialState(), spec, { outcome: "YES", bond, by: "a", pot: 0 }, T0).ok).toBe(false);
    }
  });

  it("the minimum bond applies even when the pot is tiny", () => {
    expect(reason(assertOutcome(initialState(), spec, { outcome: "YES", bond: 87, by: "a", pot: 1 }, T0))).toContain("below the required 88");
    expect(assertOutcome(initialState(), spec, { outcome: "YES", bond: 88, by: "a", pot: 1 }, T0).ok).toBe(true);
  });

  it("only YES, NO or CANCEL, by a named asserter", () => {
    expect(assertOutcome(initialState(), spec, { outcome: "MAYBE" as never, bond: 100, by: "a", pot: 0 }, T0).ok).toBe(false);
    expect(assertOutcome(initialState(), spec, { outcome: "YES", bond: 100, by: "  ", pot: 0 }, T0).ok).toBe(false);
  });

  it("only one assertion stands", () => {
    expect(reason(assertOutcome(asserted(), spec, { outcome: "NO", bond: 100, by: "b", pot: 0 }, T0 + 2 * HOUR))).toContain("already asserted");
  });

  it("is refused once the market has expired", () => {
    expect(reason(assertOutcome(initialState(), spec, { outcome: "YES", bond: 100, by: "a", pot: 0 }, EXPIRES))).toContain("expired");
  });

  it("is refused for a family that never settles", () => {
    expect(reason(assertOutcome(initialState(), hindsight, { outcome: "YES", bond: 100, by: "a", pot: 0 }, T0))).toContain("does not settle");
  });
});

describe("disputing an assertion", () => {
  const a = asserted("YES", T0 + HOUR, 100);

  it("needs a bond that at least doubles the standing one: 199 fails, 200 passes", () => {
    expect(reason(disputeAssertion(a, spec, { counter: "NO", bond: 199, by: "b" }, T0 + 2 * HOUR))).toContain("at least 200");
    expect(disputeAssertion(a, spec, { counter: "NO", bond: 200, by: "b" }, T0 + 2 * HOUR).ok).toBe(true);
  });

  it("the window closes at assertion + liveness, to the millisecond", () => {
    const end = a.assertion!.at + LIVENESS;
    expect(disputeAssertion(a, spec, { counter: "NO", bond: 200, by: "b" }, end - 1).ok).toBe(true);
    expect(reason(disputeAssertion(a, spec, { counter: "NO", bond: 200, by: "b" }, end))).toContain("window has closed");
  });

  it("an asserter cannot dispute themselves, and a dispute must claim something different", () => {
    expect(reason(disputeAssertion(a, spec, { counter: "NO", bond: 200, by: "0xaaa" }, T0 + 2 * HOUR))).toContain("their own");
    expect(reason(disputeAssertion(a, spec, { counter: "YES", bond: 200, by: "b" }, T0 + 2 * HOUR))).toContain("different outcome");
  });

  it("needs a standing assertion", () => {
    expect(reason(disputeAssertion(initialState(), spec, { counter: "NO", bond: 200, by: "b" }, T0 + HOUR))).toContain("no standing assertion");
  });

  it("only one dispute", () => {
    expect(reason(disputeAssertion(disputed(), spec, { counter: "CANCEL", bond: 999, by: "c" }, T0 + 3 * HOUR))).toContain("no standing assertion");
  });
});

describe("settling an undisputed assertion", () => {
  const a = asserted("YES", T0 + HOUR);
  const end = a.assertion!.at + LIVENESS;

  it("is refused while the window is open, and allowed at the millisecond it closes", () => {
    expect(reason(settleUndisputed(a, spec, end - 1))).toContain("still open");
    const s = ok(settleUndisputed(a, spec, end));
    expect(s.phase).toBe("resolved");
    expect(s.outcome).toBe("YES");
    expect(s.resolvedBy).toBe("liveness");
  });

  it("an asserted CANCEL (no evidence) refunds rather than pays", () => {
    const c = asserted("CANCEL", T0 + HOUR);
    const s = ok(settleUndisputed(c, spec, c.assertion!.at + LIVENESS));
    expect(s.phase).toBe("cancelled");
    expect(s.outcome).toBeNull();
    expect(s.resolvedBy).toBe("no-evidence");
    expect(payoutKind(s)).toBe("refund");
  });

  it("a disputed assertion cannot be settled this way", () => {
    expect(reason(settleUndisputed(disputed(), spec, T0 + 99 * HOUR))).toContain("no undisputed assertion");
  });
});

describe("the community vote and the founder fallback", () => {
  it("a vote is not decidable before its 36 h window has passed", () => {
    const d = disputed();
    expect(reason(resolveByVote(d, spec, { quorumMet: true, winner: "asserter" }, voteEnd(d) - 1))).toContain("still running");
    expect(resolveByVote(d, spec, { quorumMet: true, winner: "asserter" }, voteEnd(d)).ok).toBe(true);
  });

  it("with quorum the winning CLAIM decides: asserter's claim or disputer's, never a third value", () => {
    const d = disputed();
    expect(ok(resolveByVote(d, spec, { quorumMet: true, winner: "asserter" }, voteEnd(d))).outcome).toBe("YES");
    expect(ok(resolveByVote(d, spec, { quorumMet: true, winner: "disputer" }, voteEnd(d))).outcome).toBe("NO");
    expect(ok(resolveByVote(d, spec, { quorumMet: true, winner: "asserter" }, voteEnd(d))).resolvedBy).toBe("community-vote");
  });

  it("a winning CANCEL claim cancels for a refund", () => {
    const a = asserted("YES", T0 + HOUR);
    const d = ok(disputeAssertion(a, spec, { counter: "CANCEL", bond: 200, by: "b" }, T0 + 2 * HOUR));
    const s = ok(resolveByVote(d, spec, { quorumMet: true, winner: "disputer" }, voteEnd(d)));
    expect(s.phase).toBe("cancelled");
    expect(s.outcome).toBeNull();
  });

  it("without quorum it stays disputed and opens the fallback — and ONLY then", () => {
    const d = disputed();
    expect(reason(resolveByFallback(d, spec, { claim: "asserter", by: "founder" }, voteEnd(d)))).toContain("only after a community vote");
    const failed = ok(resolveByVote(d, spec, { quorumMet: false, winner: "asserter" }, voteEnd(d)));
    expect(failed.phase).toBe("disputed");
    expect(failed.voteFailed).toBe(true);
    const s = ok(resolveByFallback(failed, spec, { claim: "disputer", by: "founder" }, voteEnd(d) + 1));
    expect(s.outcome).toBe("NO");
    expect(s.resolvedBy).toBe("founder-fallback");
  });

  it("the fallback must be named and must pick one of the two claims", () => {
    const d = disputed();
    const failed = ok(resolveByVote(d, spec, { quorumMet: false, winner: "asserter" }, voteEnd(d)));
    expect(reason(resolveByFallback(failed, spec, { claim: "asserter", by: " " }, voteEnd(d) + 1))).toContain("must be named");
    expect(reason(resolveByFallback(failed, spec, { claim: "third" as never, by: "founder" }, voteEnd(d) + 1))).toContain("one of the two claims");
  });

  it("nothing can be decided after the market has expired — funds are refunded instead", () => {
    const d = disputed();
    expect(reason(resolveByVote(d, spec, { quorumMet: true, winner: "asserter" }, EXPIRES))).toContain("expired");
    const failed = ok(resolveByVote(d, spec, { quorumMet: false, winner: "asserter" }, voteEnd(d)));
    expect(reason(resolveByFallback(failed, spec, { claim: "asserter", by: "founder" }, EXPIRES))).toContain("expired");
  });
});

describe("expiry: a market can never lock funds", () => {
  it("is refused before deadline + fallback_after, and cancels exactly at it", () => {
    expect(reason(expire(initialState(), spec, EXPIRES - 1))).toContain("not expired yet");
    const s = ok(expire(initialState(), spec, EXPIRES));
    expect(s.phase).toBe("cancelled");
    expect(payoutKind(s)).toBe("refund");
    expect(s.resolvedBy).toBe("expiry");
  });

  it("applies from every pending phase", () => {
    for (const st of [initialState(), asserted(), disputed()]) {
      expect(ok(expire(st, spec, EXPIRES)).phase).toBe("cancelled");
    }
  });

  it("is idempotent, and leaves a final market exactly as it was", () => {
    const once = ok(expire(initialState(), spec, EXPIRES));
    expect(ok(expire(once, spec, EXPIRES + 1e9))).toEqual(once);
    const resolved = ok(settleUndisputed(asserted(), spec, T0 + 99 * HOUR));
    expect(ok(expire(resolved, spec, EXPIRES + 1e9))).toEqual(resolved);
  });

  it("a family that never settles has no expiry", () => {
    expect(reason(expire(initialState(), hindsight, 1e15))).toContain("does not settle");
  });
});

describe("double resolution, on every final path", () => {
  const finals: Array<[string, ResolutionState]> = [
    ["resolved by liveness", ok(settleUndisputed(asserted(), spec, T0 + 99 * HOUR))],
    ["resolved by vote", (() => { const d = disputed(); return ok(resolveByVote(d, spec, { quorumMet: true, winner: "asserter" }, voteEnd(d))); })()],
    ["resolved by fallback", (() => { const d = disputed(); const f = ok(resolveByVote(d, spec, { quorumMet: false, winner: "asserter" }, voteEnd(d))); return ok(resolveByFallback(f, spec, { claim: "asserter", by: "founder" }, voteEnd(d) + 1)); })()],
    ["cancelled by expiry", ok(expire(initialState(), spec, EXPIRES))],
  ];

  for (const [name, fin] of finals) {
    it(`${name}: every further event is refused and the state is untouched`, () => {
      const before = JSON.parse(JSON.stringify(fin));
      const at = EXPIRES + 1e6;
      // The reason must say WHY: a resolved market is not "under dispute".
      expect(reason(assertOutcome(fin, spec, { outcome: "NO", bond: 1e9, by: "z", pot: 0 }, at))).toMatch(/final|expired/);
      expect(reason(assertOutcome(fin, spec, { outcome: "NO", bond: 1e9, by: "z", pot: 0 }, at))).not.toContain("under dispute");
      expect(reason(disputeAssertion(fin, spec, { counter: "NO", bond: 1e9, by: "z" }, at))).toMatch(/final|expired/);
      expect(settleUndisputed(fin, spec, at).ok).toBe(false);
      expect(resolveByVote(fin, spec, { quorumMet: true, winner: "disputer" }, at).ok).toBe(false);
      expect(resolveByFallback(fin, spec, { claim: "disputer", by: "founder" }, at).ok).toBe(false);
      expect(fin).toEqual(before);
    });
  }
});

describe("pure functions: inputs are never mutated", () => {
  it("a deep-frozen state survives every transition", () => {
    const freeze = <T,>(o: T): T => {
      Object.freeze(o);
      for (const v of Object.values(o as object)) if (v && typeof v === "object") freeze(v);
      return o;
    };
    const s0 = freeze(initialState());
    const s1 = freeze(ok(assertOutcome(s0, spec, { outcome: "YES", bond: 100, by: "a", pot: 0 }, T0)));
    const s2 = freeze(ok(disputeAssertion(s1, spec, { counter: "NO", bond: 200, by: "b" }, T0 + HOUR)));
    expect(() => resolveByVote(s2, spec, { quorumMet: false, winner: "asserter" }, voteEnd(s2))).not.toThrow();
  });
});

describe("edge cases decided in advance", () => {
  it("looks up a boundary case-insensitively, and says nothing for an unlisted state", () => {
    expect(boundaryOutcome(spec, "game postponed without a declared result")).toBe("CANCEL");
    expect(boundaryOutcome(spec, "  SCORE REVISED AFTER SETTLEMENT ")).toBe("YES");
    expect(boundaryOutcome(spec, "the moon explodes")).toBeNull();
  });

  it("every boundary the spec lists is answerable", () => {
    for (const b of spec.boundaries) expect(boundaryOutcome(spec, b.state)).toBe(b.outcome);
  });
});

describe("status and payout mapping", () => {
  it("maps every phase to a market status, and only final phases owe anything", () => {
    const all: Phase[] = ["open", "closed", "asserted", "disputed", "resolved", "cancelled"];
    expect(all.map(statusFor)).toEqual(["open", "resolving", "resolving", "disputed", "resolved", "cancelled"]);
    expect(payoutKind({ ...initialState(), phase: "resolved", outcome: "YES" })).toBe("winners");
    expect(payoutKind({ ...initialState(), phase: "cancelled" })).toBe("refund");
    for (const p of ["open", "closed", "asserted", "disputed"] as Phase[]) expect(payoutKind({ ...initialState(), phase: p })).toBe("pending");
  });
});

describe("model test: random event sequences never break the invariants", () => {
  // A tiny seeded generator, so a failure is reproducible.
  const rng = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 0x100000000);

  it("2,000 random runs", () => {
    const order: Record<Phase, number> = { open: 0, closed: 1, asserted: 2, disputed: 3, resolved: 4, cancelled: 4 };
    for (let run = 0; run < 2000; run++) {
      const r = rng(run + 1);
      let state = initialState();
      let now = T0 - 5 * HOUR;
      let assertions = 0;
      for (let step = 0; step < 14; step++) {
        now += Math.floor(r() * 60 * HOUR);
        const before = JSON.stringify(state);
        const wasFinal = state.phase === "resolved" || state.phase === "cancelled";
        const pick = Math.floor(r() * 6);
        const by = r() < 0.5 ? "0xaaa" : "0xbbb";
        const bond = Math.floor(r() * 400);
        const outcome = (["YES", "NO", "CANCEL"] as const)[Math.floor(r() * 3)];
        let res: Result;
        if (pick === 0) res = assertOutcome(state, spec, { outcome, bond, by, pot: Math.floor(r() * 200) }, now);
        else if (pick === 1) res = disputeAssertion(state, spec, { counter: outcome, bond, by }, now);
        else if (pick === 2) res = settleUndisputed(state, spec, now);
        else if (pick === 3) res = resolveByVote(state, spec, { quorumMet: r() < 0.5, winner: r() < 0.5 ? "asserter" : "disputer" }, now);
        else if (pick === 4) res = resolveByFallback(state, spec, { claim: r() < 0.5 ? "asserter" : "disputer", by: "founder" }, now);
        else res = expire(state, spec, now);

        if (!res.ok) {
          expect(JSON.stringify(state), `run ${run}: a refused event changed the state`).toBe(before);
          continue;
        }
        const next = res.state;
        if (wasFinal) expect(JSON.stringify(next), `run ${run}: a final market changed`).toBe(before);
        expect(order[next.phase], `run ${run}: phase went backwards ${state.phase} → ${next.phase}`).toBeGreaterThanOrEqual(order[state.phase]);
        if (next.phase === "resolved") expect(["YES", "NO"]).toContain(next.outcome);
        if (next.phase === "cancelled") expect(next.outcome).toBeNull();
        if (next.assertion && !state.assertion) assertions++;
        expect(assertions, `run ${run}: more than one assertion`).toBeLessThanOrEqual(1);
        if (next.dispute) expect(next.dispute.counter).not.toBe(next.assertion!.outcome);
        if (next.assertion) expect(next.assertion.bond).toBeGreaterThanOrEqual(88);
        state = next;
      }
    }
  });
});
