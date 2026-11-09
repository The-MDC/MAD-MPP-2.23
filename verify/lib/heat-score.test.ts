import { describe, it, expect } from "vitest";
import { computeHeatForPool, HEAT_WEIGHTS, HEAT_EXPLAINER, type HeatInput } from "./heat-score";

const NOW = Date.UTC(2026, 6, 26, 12, 0, 0); // fixed clock for deterministic velocity

function item(over: Partial<HeatInput> & { id: string; title: string }): HeatInput {
  return {
    sourceId: over.id,
    publishedMs: NOW,
    trustScore: 6,
    viralityWeight: 1.5,
    satireScore: 50,
    ...over,
  };
}

describe("computeHeatForPool", () => {
  it("returns one result per input, in order", () => {
    const pool = [item({ id: "a", title: "Alpha beta gamma delta" }), item({ id: "b", title: "Zeta eta theta iota" })];
    const out = computeHeatForPool(pool, NOW);
    expect(out).toHaveLength(2);
    out.forEach((r) => {
      expect(r.heat).toBeGreaterThanOrEqual(0);
      expect(r.heat).toBeLessThanOrEqual(100);
    });
  });

  it("weights sum to 1", () => {
    const sum = Object.values(HEAT_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 6);
  });

  it("counts cross-publisher pickup: a story run by many distinct sources scores higher crossSource", () => {
    const shared = "Mega celebrity yacht scandal photos surface overnight";
    const pool: HeatInput[] = [
      item({ id: "tmz", sourceId: "tmz", title: shared }),
      item({ id: "pagesix", sourceId: "pagesix", title: shared }),
      item({ id: "people", sourceId: "people", title: shared }),
      item({ id: "lonely", sourceId: "obscure", title: "Local library extends weekend hours slightly" }),
    ];
    const out = computeHeatForPool(pool, NOW);
    // the three matching publishers see crossSource = 3, the lonely one = 1
    expect(out[0].signals.crossSource).toBe(3);
    expect(out[3].signals.crossSource).toBe(1);
    // and the widely-picked-up story out-heats the lonely one
    expect(out[0].heat).toBeGreaterThan(out[3].heat);
  });

  it("does NOT merge distinct stories from the same-shaped titles (needs 2+ shared tokens)", () => {
    const pool: HeatInput[] = [
      item({ id: "x", sourceId: "aaa", title: "Bitcoin rallies hard today" }),
      item({ id: "y", sourceId: "bbb", title: "Senate debates farming subsidies" }),
    ];
    const out = computeHeatForPool(pool, NOW);
    expect(out[0].signals.crossSource).toBe(1);
    expect(out[1].signals.crossSource).toBe(1);
  });

  it("is pinned: one lone item at a fixed clock scores exactly these signals", () => {
    // Was `expect(f(x)).toEqual(f(x))`, which holds for any deterministic function and
    // pins nothing. These are the values the weights in HEAT_WEIGHTS produce today.
    const pool = [item({ id: "a", title: "Alpha beta gamma delta" })];
    expect(computeHeatForPool(pool, NOW)).toEqual([
      {
        heat: 45,
        signals: { crossSource: 1, velocity: 100, authority: 60, virality: 25, satire: 50, engagementEst: 44 },
      },
    ]);
    // …and repeats exactly.
    expect(computeHeatForPool(pool, NOW)).toEqual(computeHeatForPool(pool, NOW));
  });

  it("rewards freshness: a newer item out-scores an identical older one on velocity", () => {
    const title = "Standalone unique headline about nothing";
    const fresh = computeHeatForPool([item({ id: "f", sourceId: "s1", title, publishedMs: NOW })], NOW)[0];
    const stale = computeHeatForPool([item({ id: "s", sourceId: "s1", title, publishedMs: NOW - 5 * 24 * 3600_000 })], NOW)[0];
    expect(fresh.signals.velocity).toBeGreaterThan(stale.signals.velocity);
  });

  it("treats a missing date as neutral (velocity 50), not zero", () => {
    const out = computeHeatForPool([item({ id: "n", sourceId: "s1", title: "No date here at all", publishedMs: null })], NOW)[0];
    expect(out.signals.velocity).toBe(50);
  });

  it("explainer covers every signal and labels measured vs estimated", () => {
    const keys = HEAT_EXPLAINER.signals.map((s) => s.key).sort();
    expect(keys).toEqual(["authority", "crossSource", "engagementEst", "satire", "velocity", "virality"]);
    // engagement is the only estimated signal; the rest are measured
    const estimated = HEAT_EXPLAINER.signals.filter((s) => s.kind === "estimated").map((s) => s.key);
    expect(estimated).toEqual(["engagementEst"]);
  });
});
