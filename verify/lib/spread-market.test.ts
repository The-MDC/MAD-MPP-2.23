import { describe, expect, it } from "vitest";
import {
  MAX_COHORTS, buildCohortDispersion, buildPerceivedVsActual, canOpen, logit, spread, validateSpreadSpec,
  type Evidence, type SpreadSpec,
} from "./spread-market";

/**
 * One family, three instantiations. A spec that cannot be defended must be refused: dependent channels, discretion,
 * a fourth cohort, a hand-weighted book, or no exposure gate.
 *
 * THIS FILE MUST STAY UNDER `lib/` — vitest's `include` is `lib/**\/*.test.ts`.
 */
const ev = (name: string, group: string, url = `https://example.com/${name}`): Evidence => ({ name, group, url });
const pva = (): SpreadSpec => buildPerceivedVsActual({ question: "Did the claim spread because people believed it?", belief: ev("poll", "survey"), record: ev("filings", "registry") });

describe("the spread transform", () => {
  it("is zero when the legs agree and antisymmetric when swapped", () => {
    expect(spread(0.4, 0.4)).toBeCloseTo(0, 9);
    expect(spread(0.7, 0.3)).toBeCloseTo(-spread(0.3, 0.7), 9);
  });

  it("matches logit(p_A) − logit(p_B) in the body", () => {
    expect(spread(0.7, 0.5)).toBeCloseTo(Math.log(0.7 / 0.3), 6);
  });

  it("stays finite at the probability edges (no Infinity to trade against)", () => {
    for (const p of [0, 1, -0.1, 1.1]) expect(Number.isFinite(logit(p))).toBe(true);
    expect(Number.isFinite(spread(0, 1))).toBe(true);
  });

  it("is strictly increasing in p_A", () => {
    let prev = -Infinity;
    for (let p = 0; p <= 1.0000001; p += 0.01) {
      const s = spread(p, 0.5);
      expect(s).toBeGreaterThan(prev);
      prev = s;
    }
  });
});

describe("perceived versus actual", () => {
  it("a spec with independent channels and mechanical resolution is valid", () => {
    expect(validateSpreadSpec(pva())).toEqual({ ok: true, errors: [] });
  });

  it("is refused when the record is derived from the crowd (same evidence group)", () => {
    const s = buildPerceivedVsActual({ question: "q?", belief: ev("poll", "same"), record: ev("tally", "same") });
    expect(validateSpreadSpec(s).errors.join(" ")).toMatch(/not independent/);
  });

  it("is refused when both legs read the same source", () => {
    const s = buildPerceivedVsActual({ question: "q?", belief: ev("a", "g1", "https://x.test/1"), record: ev("b", "g2", "https://x.test/1") });
    expect(validateSpreadSpec(s).errors.join(" ")).toMatch(/same source/);
  });

  it("is refused if either leg resolves by discretion", () => {
    const s = pva();
    s.legs[1] = { ...s.legs[1], resolution: "discretionary" };
    expect(validateSpreadSpec(s).errors.join(" ")).toMatch(/discretion/);
  });

  it("is refused without the exposure gate", () => {
    expect(validateSpreadSpec({ ...pva(), exposureGate: false }).errors.join(" ")).toMatch(/exposure gate/);
  });

  it("needs a checkable evidence URL on each leg", () => {
    const s = buildPerceivedVsActual({ question: "q?", belief: ev("a", "g1", "not a url"), record: ev("b", "g2") });
    expect(validateSpreadSpec(s).errors.join(" ")).toMatch(/evidence URL/);
  });
});

describe("cohort dispersion is the same family with cohorts as legs", () => {
  const cohort = (id: string) => ({ id, label: id, evidence: ev(id, `grp-${id}`) });

  it("three cohorts make three pairwise spreads, all valid", () => {
    const specs = buildCohortDispersion({ question: "Will it resolve YES?", cohorts: [cohort("creators"), cohort("traders"), cohort("public")] });
    expect(specs).toHaveLength(3);
    for (const s of specs) expect(validateSpreadSpec(s).ok).toBe(true);
    expect(new Set(specs.map((s) => s.legs.map((l) => l.id).join("|"))).size).toBe(3);
  });

  it("refuses a fourth cohort, and fewer than two", () => {
    const four = ["a", "b", "c", "d"].map(cohort);
    expect(() => buildCohortDispersion({ question: "q?", cohorts: four })).toThrow(new RegExp(`at most ${MAX_COHORTS}`));
    expect(() => buildCohortDispersion({ question: "q?", cohorts: [cohort("a")] })).toThrow(/at least two/);
  });

  it("refuses a weighted single book, and unpublished parameters", () => {
    const [s] = buildCohortDispersion({ question: "q?", cohorts: [cohort("a"), cohort("b")] });
    expect(validateSpreadSpec({ ...s, funding: "weighted-single-book" }).errors.join(" ")).toMatch(/separately funded/);
    expect(validateSpreadSpec({ ...s, parametersPublished: false }).errors.join(" ")).toMatch(/published/);
  });
});

describe("VERSUS and the kind check", () => {
  it("VERSUS legs must be storylines", () => {
    const s: SpreadSpec = { ...pva(), instantiation: "versus" };
    expect(validateSpreadSpec(s).errors.join(" ")).toMatch(/storylines/);
  });
});

describe("opening a market", () => {
  it("a valid spec still cannot open while the gate is not wired into trading", () => {
    const r = canOpen(pva(), { exposureGateWired: false });
    expect(r.ok).toBe(false);
    expect(r.errors.join(" ")).toMatch(/not wired/);
    expect(canOpen(pva(), { exposureGateWired: true }).ok).toBe(true);
  });
});
