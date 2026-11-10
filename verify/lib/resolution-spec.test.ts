import { describe, expect, it } from "vitest";
import {
  FAMILIES,
  LIMITS,
  SINGLE_SOURCE_RISK,
  buildSpec,
  canonicalJson,
  hashSpec,
  renderSpecJson,
  renderSpecPage,
  requiredChallengeBond,
  requiredResolverBond,
  specId,
  validateResolutionSpec,
  type BuildInput,
  type ResolutionSpec,
} from "./resolution-spec";

/**
 * Every rule in resolution-spec.ts has a test that fails without it. The shape of this file mirrors the shape of
 * the validator: one `it` per way a spec can be wrong, then hashing, then money, then rendering.
 *
 * THIS FILE MUST STAY UNDER `lib/` — vitest's `include` is `lib/**\/*.test.ts`.
 */
const NOW = new Date("2026-11-10T00:00:00.000Z");
const CLOSES = "2026-12-20T00:00:00Z"; // 40 days after NOW
const DEADLINE = "2026-12-27T00:00:00Z";

const input = (over: Partial<BuildInput> = {}): BuildInput => ({
  question: "Will the 2026 B1G conference champion be decided in the Dec 4 game, as reported by the league?",
  evidence: [
    { name: "League results API", url: "https://example.com/league/results", group: "league" },
    { name: "Wire service final scores", url: "https://example.com/wire/scores", group: "wire" },
  ],
  predicate: { inputs: [{ name: "final_result", source: "League results API", version: "1" }], expression: "final_result.winner == team_a" },
  boundaries: [
    { state: "game postponed without a declared result", outcome: "CANCEL" },
    { state: "result revised after settlement", outcome: "YES" },
  ],
  closes_at: CLOSES,
  deadline: DEADLINE,
  ...over,
});

const good = (over: Partial<BuildInput> = {}): ResolutionSpec => buildSpec("binary-event", input(over));
const bad = (mut: (s: Record<string, unknown>) => void, base: ResolutionSpec = good()) => {
  const clone = JSON.parse(JSON.stringify(base)) as Record<string, unknown>;
  mut(clone);
  return validateResolutionSpec(clone, { now: NOW });
};
const hasError = (r: { errors: string[] }, fragment: string) => r.errors.some((e) => e.includes(fragment));

describe("a good spec", () => {
  it("passes, for every resolving family", () => {
    for (const f of FAMILIES.filter((x) => x !== "paseome-hindsight")) {
      const r = validateResolutionSpec(buildSpec(f, input()), { now: NOW });
      expect(r.errors, `${f}: ${r.errors.join("; ")}`).toEqual([]);
      expect(r.ok).toBe(true);
    }
  });

  it("the never_settles family has no decision window, resolver or dispute path, and passes", () => {
    const s = buildSpec("paseome-hindsight", input({ closes_at: undefined, deadline: undefined }));
    expect(s.settlement).toBe("never_settles");
    expect(s.decision).toBeNull();
    expect(s.resolver).toBeNull();
    expect(s.dispute).toBeNull();
    expect(validateResolutionSpec(s, { now: NOW }).ok).toBe(true);
  });
});

describe("it fails closed on garbage", () => {
  const garbage: unknown[] = [null, undefined, 0, 1, "spec", true, [], {}, [[]], { schema: 1 }, "{}", Symbol.for("x"), () => 1, NaN];

  it("never throws and never passes", () => {
    for (const g of garbage) {
      let r: { ok: boolean } | undefined;
      expect(() => {
        r = validateResolutionSpec(g as never);
      }).not.toThrow();
      expect(r?.ok).toBe(false);
    }
  });

  it("survives prototype-pollution-shaped input", () => {
    const evil = JSON.parse('{"__proto__": {"polluted": true}, "constructor": {"prototype": {"x": 1}}, "schema": 1}');
    expect(validateResolutionSpec(evil).ok).toBe(false);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it("random mutations of a good spec never throw", () => {
    const base = good();
    const swaps: unknown[] = [null, 0, -1, "", "x".repeat(5000), [], {}, [null], { a: 1 }, Number.NaN, Infinity, true];
    for (const key of Object.keys(base)) {
      for (const v of swaps) {
        const clone = { ...(base as unknown as Record<string, unknown>), [key]: v };
        expect(() => validateResolutionSpec(clone, { now: NOW })).not.toThrow();
      }
    }
  });
});

describe("what the spec must say", () => {
  it("schema and family", () => {
    expect(hasError(bad((s) => (s.schema = 2)), "schema must be 1")).toBe(true);
    expect(hasError(bad((s) => (s.family = "Bad Family!")), "family must be a lowercase slug")).toBe(true);
    expect(hasError(bad((s) => (s.settlement = "maybe")), "settlement must be")).toBe(true);
  });

  it("the rule is plain language of a sane length", () => {
    expect(hasError(bad((s) => (s.question_template = "short")), "question_template")).toBe(true);
    expect(hasError(bad((s) => (s.question_template = "x".repeat(LIMITS.QUESTION_MAX + 1))), "question_template")).toBe(true);
  });

  it("evidence: https only, named, bounded, with an independence group", () => {
    expect(hasError(bad((s) => ((s.evidence as unknown[])[0] as Record<string, unknown>).url = "http://example.com"), "https URL")).toBe(true);
    expect(hasError(bad((s) => ((s.evidence as unknown[])[0] as Record<string, unknown>).url = "javascript:alert(1)"), "https URL")).toBe(true);
    expect(hasError(bad((s) => ((s.evidence as unknown[])[0] as Record<string, unknown>).group = ""), ".group is required")).toBe(true);
    expect(hasError(bad((s) => (s.evidence = [])), "evidence must list")).toBe(true);
    const many = Array.from({ length: LIMITS.MAX_EVIDENCE + 1 }, (_, i) => ({ name: `s${i}`, url: "https://example.com", group: `g${i}` }));
    expect(hasError(bad((s) => (s.evidence = many)), "evidence must list")).toBe(true);
  });

  it("independence is counted in fact, not in name: two feeds from one provider are ONE source", () => {
    const r = bad((s) => {
      s.evidence = [
        { name: "Feed A", url: "https://example.com/a", group: "same-provider" },
        { name: "Feed B", url: "https://example.com/b", group: "Same-Provider" },
      ];
      (s.predicate as { inputs: Array<{ source: string }> }).inputs[0].source = "Feed A";
    });
    expect(hasError(r, "only 1 independent evidence group")).toBe(true);
  });

  it("a single source is allowed only as an explicit, named, accepted risk", () => {
    const one = good({ evidence: [{ name: "League results API", url: "https://example.com/league/results", group: "league" }], accepted_risks: [SINGLE_SOURCE_RISK] });
    expect(validateResolutionSpec(one, { now: NOW }).ok).toBe(true);
    const silent = good({ evidence: [{ name: "League results API", url: "https://example.com/league/results", group: "league" }] });
    expect(validateResolutionSpec(silent, { now: NOW }).ok).toBe(false);
  });

  it("predicate inputs are named, versioned, and point at a real source", () => {
    expect(hasError(bad((s) => ((s.predicate as { inputs: Array<Record<string, unknown>> }).inputs[0].source = "Nobody")), "is not one of the evidence sources")).toBe(true);
    expect(hasError(bad((s) => ((s.predicate as { inputs: Array<Record<string, unknown>> }).inputs[0].version = "")), "is required (inputs are versioned)")).toBe(true);
    expect(hasError(bad((s) => ((s.predicate as { inputs: unknown[] }).inputs = [])), "predicate.inputs must list")).toBe(true);
  });

  it("disagreement is handled, not only silence", () => {
    expect(hasError(bad((s) => delete s.on_conflict), "on_conflict.rule")).toBe(true);
    expect(hasError(bad((s) => (s.on_conflict = { rule: "pick-one" })), "on_conflict.rule")).toBe(true);
    // majority only makes sense with at least three independent voices.
    expect(hasError(bad((s) => (s.on_conflict = { rule: "majority_independent" })), "needs at least 3 independent")).toBe(true);
  });

  it("no evidence means refund, never a guess", () => {
    expect(hasError(bad((s) => (s.on_no_evidence = "resolve_no")), "on_no_evidence must be")).toBe(true);
  });

  it("edge cases are decided: at least one, no duplicates, each with a valid outcome", () => {
    expect(hasError(bad((s) => (s.boundaries = [])), "boundaries must list")).toBe(true);
    expect(
      hasError(
        bad((s) => (s.boundaries = [{ state: "tie game", outcome: "YES" }, { state: "Tie Game", outcome: "NO" }])),
        "is duplicated",
      ),
    ).toBe(true);
    expect(hasError(bad((s) => (s.boundaries = [{ state: "tie game", outcome: "MAYBE" }])), "outcome must be YES, NO or CANCEL")).toBe(true);
  });

  it("finality is part of the spec", () => {
    expect(hasError(bad((s) => (s.finality = { immutable: false, clarifications: "append-only" })), "finality must be")).toBe(true);
    expect(hasError(bad((s) => (s.finality = { immutable: true, clarifications: "editable" })), "finality must be")).toBe(true);
  });
});

describe("the decision window, the resolver's bond, and the dispute path", () => {
  it("a resolving family needs all three", () => {
    expect(hasError(bad((s) => (s.decision = null)), "needs a decision window")).toBe(true);
    expect(hasError(bad((s) => (s.resolver = null)), "needs a resolver bond rule")).toBe(true);
    expect(hasError(bad((s) => (s.dispute = null)), "needs a dispute rule")).toBe(true);
  });

  it("times are UTC ISO and ordered", () => {
    expect(hasError(bad((s) => ((s.decision as Record<string, unknown>).closes_at = "tomorrow")), "UTC ISO-8601")).toBe(true);
    expect(hasError(bad((s) => ((s.decision as Record<string, unknown>).deadline = "2026-12-01T00:00:00Z")), "deadline must be after")).toBe(true);
  });

  it("MASTER §12b: a market must run at least 30 days (the floor cannot be lowered in the spec)", () => {
    expect(hasError(bad((s) => ((s.decision as Record<string, unknown>).min_tenor_days = 7)), "min_tenor_days must be at least 30")).toBe(true);
    // 10 days from NOW is shorter than the 30 the spec declares.
    const short = good({ closes_at: "2026-11-20T00:00:00Z", deadline: "2026-11-27T00:00:00Z" });
    expect(hasError(validateResolutionSpec(short, { now: NOW }), "must run at least 30 days")).toBe(true);
    // Exactly 30 days is allowed — the boundary is inclusive.
    const exact = good({ closes_at: "2026-12-10T00:00:00Z", deadline: "2026-12-17T00:00:00Z" });
    expect(validateResolutionSpec(exact, { now: NOW }).ok).toBe(true);
  });

  it("the resolver's bond is above zero and covers the pot (UMA refuses a zero minimum; lying must not pay)", () => {
    expect(hasError(bad((s) => ((s.resolver as Record<string, unknown>).min_bond_madx = 0)), "above zero")).toBe(true);
    expect(hasError(bad((s) => ((s.resolver as Record<string, unknown>).min_bond_madx = -5)), "above zero")).toBe(true);
    expect(hasError(bad((s) => ((s.resolver as Record<string, unknown>).bond_pot_multiple = 0.5)), "at least 1")).toBe(true);
  });

  it("dispute: a real window, doubling challenges, a named fallback, and a deadline after which nothing locks", () => {
    const d = (k: string, v: unknown) => bad((s) => ((s.dispute as Record<string, unknown>)[k] = v));
    expect(hasError(d("liveness_seconds", 0), "liveness_seconds")).toBe(true);
    expect(hasError(d("liveness_seconds", LIMITS.MIN_LIVENESS_SECONDS - 1), "liveness_seconds")).toBe(true);
    expect(hasError(d("liveness_seconds", LIMITS.MAX_LIVENESS_SECONDS + 1), "liveness_seconds")).toBe(true);
    expect(hasError(d("challenge_bond_multiple", 1), "at least 2")).toBe(true);
    expect(hasError(d("escalation", "founder"), 'must be "community-vote"')).toBe(true);
    expect(hasError(d("fallback", "anyone"), 'must be "founder"')).toBe(true);
    // The fallback may not fire while the 36 h commit/reveal vote is still running...
    expect(hasError(d("fallback_after_seconds", LIMITS.MIN_FALLBACK_SECONDS - 1), "fallback_after_seconds")).toBe(true);
    // ...and must exist: no spec may leave a disputed market undecided forever.
    expect(hasError(d("fallback_after_seconds", undefined), "fallback_after_seconds")).toBe(true);
    expect(hasError(d("fallback_after_seconds", LIMITS.MAX_FALLBACK_SECONDS + 1), "fallback_after_seconds")).toBe(true);
  });

  it("a never_settles family must not carry a resolver or dispute path", () => {
    const s = JSON.parse(JSON.stringify(buildSpec("paseome-hindsight", input({ closes_at: undefined, deadline: undefined })))) as Record<string, unknown>;
    s.resolver = { min_bond_madx: 1, bond_pot_multiple: 1 };
    expect(hasError(validateResolutionSpec(s), "has no resolver")).toBe(true);
  });
});

describe("hashing: content-addressed", () => {
  it("is independent of key order, and stable", () => {
    const a = good();
    const reordered = JSON.parse(JSON.stringify(a), (_k, v) => (v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).reverse()) : v)) as ResolutionSpec;
    expect(canonicalJson(reordered)).toBe(canonicalJson(a));
    expect(hashSpec(reordered)).toBe(hashSpec(a));
    expect(hashSpec(a)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("changes when ANY field changes — a claim cannot be swapped under a market", () => {
    const base = good();
    const h0 = hashSpec(base);
    const variants: Array<(s: ResolutionSpec) => void> = [
      (s) => (s.question_template += " "),
      (s) => (s.evidence[0].url = "https://example.com/other"),
      (s) => (s.evidence[0].group = "other"),
      (s) => (s.predicate.expression += "!"),
      (s) => (s.boundaries[0].outcome = "NO"),
      (s) => (s.decision!.deadline = "2026-12-28T00:00:00Z"),
      (s) => (s.resolver!.min_bond_madx += 1),
      (s) => (s.dispute!.liveness_seconds += 1),
      (s) => (s.accepted_risks = ["x"]),
      (s) => (s.on_conflict = { rule: "cancel_refund" }),
    ];
    for (const [i, mutate] of variants.entries()) {
      const clone = JSON.parse(JSON.stringify(base)) as ResolutionSpec;
      mutate(clone);
      expect(hashSpec(clone), `variant ${i} did not change the hash`).not.toBe(h0);
    }
  });

  it("the id is derived from the hash, so identical specs are one row", () => {
    const h = hashSpec(good());
    expect(specId(h)).toBe(`rs_${h.slice(0, 16)}`);
    expect(specId(hashSpec(good()))).toBe(specId(h));
  });

  it("pins a literal, so a change to canonicalisation is noticed", () => {
    expect(canonicalJson({ b: [2, { z: 1, a: null }], a: "x", u: undefined })).toBe('{"a":"x","b":[2,{"a":null,"z":1}]}');
  });
});

describe("money", () => {
  const spec = good();

  it("the reporter's bond is never zero, and never below the pot times the multiple", () => {
    expect(requiredResolverBond(spec, 0)).toBe(88);
    expect(requiredResolverBond(spec, 50)).toBe(88);
    expect(requiredResolverBond(spec, 10_000)).toBe(10_000);
    expect(requiredResolverBond(spec, -5)).toBe(88);
    expect(requiredResolverBond(spec, Number.NaN)).toBe(88);
    const strict = JSON.parse(JSON.stringify(spec)) as ResolutionSpec;
    strict.resolver!.bond_pot_multiple = 3;
    expect(requiredResolverBond(strict, 1000)).toBe(3000);
  });

  it("each challenge at least doubles the standing bond", () => {
    expect(requiredChallengeBond(spec, 100)).toBe(200);
    expect(requiredChallengeBond(spec, 0)).toBe(0);
    expect(requiredChallengeBond(spec, -4)).toBe(0);
  });

  it("a never_settles family needs no bond", () => {
    const h = buildSpec("paseome-hindsight", input({ closes_at: undefined, deadline: undefined }));
    expect(requiredResolverBond(h, 1000)).toBe(0);
    expect(requiredChallengeBond(h, 1000)).toBe(0);
  });
});

describe("one source of truth, two renderings", () => {
  const spec = good();

  it("the JSON is the spec plus its hash and id", () => {
    const j = renderSpecJson(spec);
    expect(j.spec).toEqual(spec);
    expect(j.spec_hash).toBe(hashSpec(spec));
    expect(j.spec_id).toBe(specId(j.spec_hash));
  });

  it("the page carries the same fingerprint, and states every edge case the spec decided", () => {
    const p = renderSpecPage(spec);
    expect(p.specHash).toBe(renderSpecJson(spec).spec_hash);
    const all = JSON.stringify(p);
    for (const b of spec.boundaries) expect(all).toContain(b.state);
    for (const e of spec.evidence) expect(all).toContain(e.url);
    expect(all).toContain(spec.predicate.expression);
  });

  it("the page states who decides, what it costs, and that funds are never locked", () => {
    const text = JSON.stringify(renderSpecPage(spec));
    expect(text).toContain("Reporter's bond");
    expect(text).toContain("community vote");
    expect(text).toContain("the founder decides");
    expect(text).toContain("funds are never locked");
  });

  it("a never_settles page says so and shows no bond or dispute rows", () => {
    const p = renderSpecPage(buildSpec("paseome-hindsight", input({ closes_at: undefined, deadline: undefined })));
    const text = JSON.stringify(p);
    expect(text).toContain("does not settle");
    expect(text).not.toContain("Reporter's bond");
  });

  it("changing the spec changes the fingerprint on the page", () => {
    const other = good({ question: "Will a different thing happen by the stated date, as reported by the league?" });
    expect(renderSpecPage(other).specHash).not.toBe(renderSpecPage(spec).specHash);
  });
});
