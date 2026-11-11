import { describe, expect, it } from "vitest";
import { bestBinaryReport, brierScore, expectedScore, linearScore, logScore } from "./scoring-rules";

/**
 * Properness: reporting your true belief uniquely maximises your expected score. Checked on a grid of beliefs, for both
 * canonical rules, and shown to FAIL for an improper rule, so the test would catch a rule that quietly is not proper.
 *
 * THIS FILE MUST STAY UNDER `lib/` — vitest's `include` is `lib/**\/*.test.ts`.
 */
const beliefs = [0.05, 0.2, 0.35, 0.5, 0.65, 0.8, 0.95];

describe("strictly proper rules", () => {
  for (const [name, rule] of [["log", logScore], ["Brier", brierScore]] as const) {
    it(`${name}: the best report is the true belief (to the grid resolution)`, () => {
      for (const q of beliefs) {
        const best = bestBinaryReport(rule, [q, 1 - q], 1000);
        expect(Math.abs(best.report - q)).toBeLessThanOrEqual(0.002);
      }
    });

    it(`${name}: any other report scores strictly worse in expectation`, () => {
      for (const q of beliefs) {
        const truthful = expectedScore(rule, [q, 1 - q], [q, 1 - q]);
        for (const r of [0.01, 0.1, 0.3, 0.5, 0.7, 0.9, 0.99]) {
          if (Math.abs(r - q) < 0.02) continue;
          expect(expectedScore(rule, [r, 1 - r], [q, 1 - q])).toBeLessThan(truthful);
        }
      }
    });
  }

  it("works for three outcomes too (Brier)", () => {
    const q = [0.5, 0.3, 0.2];
    const truthful = expectedScore(brierScore, q, q);
    expect(expectedScore(brierScore, [0.6, 0.3, 0.1], q)).toBeLessThan(truthful);
    expect(expectedScore(brierScore, [0.4, 0.4, 0.2], q)).toBeLessThan(truthful);
  });
});

describe("the two rules differ exactly where the document says", () => {
  it("a confident miss costs the log rule far more than Brier", () => {
    const miss = [0.001, 0.999]; // reported 0.1% for the outcome that happened
    expect(logScore(miss, 0)).toBeLessThan(-6);
    expect(brierScore(miss, 0)).toBeGreaterThan(-2.01); // Brier is bounded below by -2 for two outcomes
  });

  it("the log rule stays finite on a zero report (a floor, not -Infinity)", () => {
    expect(Number.isFinite(logScore([0, 1], 0))).toBe(true);
  });

  it("a perfect report scores the maximum (log 0, Brier 0)", () => {
    expect(logScore([1, 0], 0)).toBeCloseTo(0, 9);
    expect(brierScore([1, 0], 0)).toBeCloseTo(0, 9);
  });
});

describe("the test can fail: an improper rule is caught", () => {
  it("paying the probability you gave is not proper: the best report is all-in, not the belief", () => {
    const best = bestBinaryReport(linearScore, [0.3, 0.7], 1000);
    expect(best.report).toBe(0);
    expect(Math.abs(best.report - 0.3)).toBeGreaterThan(0.25);
  });
});
