import { describe, it, expect } from "vitest";
import {
  impliedProb, deVig, deriveSeries, toView, CLASS_OF_TYPE, PERP_FAMILIES, FAMILY_META,
  fmtCompact, fmtChange,
} from "./market-view";
import { MARKET_TYPES } from "./market-classifier";
import type { Market } from "./markets";
import type { MarketProposal } from "./market-classifier";
import type { PerpMarket } from "./perp-store";

const market = (over: Partial<Market> = {}): Market => ({
  id: "mkt-1", title: "Will it hold?", category: "culture", description: "a test",
  creatorWallet: null, yesOdds: 2, noOdds: 2, status: "open", outcome: null,
  volume: 1000, resolutionAt: "2026-09-01T00:00:00.000Z",
  createdAt: "2026-08-01T00:00:00.000Z", updatedAt: "2026-08-01T00:00:00.000Z",
  ...over,
});

const perp = (over: Partial<PerpMarket> = {}): PerpMarket => ({
  id: "perp-1", family: "faces", subjectRef: "subject-alpha", subjectClass: "index",
  title: "Five Faces: subject-alpha", status: "open", legIndex: 3,
  legOpenedAt: "2026-07-01T00:00:00.000Z", legClosesAt: "2026-08-29T00:00:00.000Z",
  paramCommit: null, paramEpoch: 1, volume: 500, details: {},
  createdAt: "2026-07-01T00:00:00.000Z", updatedAt: "2026-08-01T00:00:00.000Z",
  ...over,
});

const proposal = (over: Partial<MarketProposal> = {}): MarketProposal => ({
  type: "faces", zliarEligible: false, perpEligible: true, title: "Five Faces: x",
  headline: "x", horizonDays: 540, resolutionCriteria: "never", zliarScore: 40,
  perpProbability: 0.6, sentiment: { valence: 0, intensity: 0.5, dopaminePotential: false },
  convictionPrior: 0.5, score: 0.7,
  ...over,
});

describe("impliedProb", () => {
  it("inverts decimal odds", () => {
    expect(impliedProb(2)).toBeCloseTo(0.5);
    expect(impliedProb(4)).toBeCloseTo(0.25);
  });

  // The whole reason this helper exists: a bare 1/odds anywhere in a component
  // would have produced Infinity here and poisoned every downstream percentage.
  it("refuses to divide by zero or nonsense", () => {
    expect(impliedProb(0)).toBe(0);
    expect(impliedProb(-3)).toBe(0);
    expect(impliedProb(Number.NaN)).toBe(0);
    expect(impliedProb(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("deVig", () => {
  it("normalises an overround book to exactly 1", () => {
    // 1/1.9 + 1/1.9 = 1.052… — the 5.2% is the margin, and showing 53%/53%
    // on a card is the bug this removes.
    const [a, b] = deVig([1.9, 1.9]);
    expect(a + b).toBeCloseTo(1);
    expect(a).toBeCloseTo(0.5);
  });

  it("preserves the skew of an uneven book", () => {
    const [a, b] = deVig([1.5, 3]);
    expect(a + b).toBeCloseTo(1);
    expect(a).toBeGreaterThan(b);
  });

  it("falls back to a flat book rather than NaN when odds are unusable", () => {
    const out = deVig([0, 0]);
    expect(out).toEqual([0.5, 0.5]);
    expect(out.every(Number.isFinite)).toBe(true);
  });
});

describe("deriveSeries", () => {
  it("is deterministic — the same id yields THIS walk", () => {
    // Load-bearing for SSR: a random walk would differ between the server and
    // client render and break hydration. `f(x)` equalling `f(x)` proves only that
    // two calls agreed (a Math.random seeded per render would still pass if both
    // calls shared a seed); pinning the points proves the walk itself is the one
    // the server and the client both draw.
    const round = (xs: number[]) => xs.map((n) => Math.round(n * 1e6) / 1e6);
    expect(round(deriveSeries("abc", 0.6))).toEqual([
      0.451042, 0.75777, 0.61557, 0.512503, 0.573573, 0.482457, 0.603415, 0.700481, 0.681755, 0.576961, 0.591082,
      0.655276, 0.601502, 0.516163, 0.569525, 0.557395, 0.610733, 0.568942, 0.573105, 0.607814, 0.568464, 0.563684,
      0.629633, 0.6,
    ]);
    expect(round(deriveSeries("xyz", 0.6))).toEqual([
      0.7, 0.642461, 0.472793, 0.565877, 0.540577, 0.726915, 0.524697, 0.625904, 0.639618, 0.581221, 0.504048,
      0.61594, 0.58882, 0.547905, 0.541953, 0.556899, 0.604256, 0.592527, 0.645411, 0.576071, 0.577748, 0.61226,
      0.59674, 0.6,
    ]);
  });

  it("differs across ids so a grid of cards does not read as one line", () => {
    expect(deriveSeries("abc", 0.6)).not.toEqual(deriveSeries("xyz", 0.6));
  });

  it("lands exactly on the live reading and stays in range", () => {
    const s = deriveSeries("abc", 0.6);
    expect(s[s.length - 1]).toBeCloseTo(0.6);
    expect(s.every((n) => n >= 0 && n <= 1)).toBe(true);
  });

  it("clamps an out-of-range reading instead of drawing off-canvas", () => {
    expect(deriveSeries("abc", 9).every((n) => n <= 1)).toBe(true);
    expect(deriveSeries("abc", -9).every((n) => n >= 0)).toBe(true);
  });
});

describe("CLASS_OF_TYPE", () => {
  it("classifies every market type — no silent gaps", () => {
    for (const t of MARKET_TYPES) expect(CLASS_OF_TYPE[t]).toBeTruthy();
  });
});

describe("FAMILY_META", () => {
  it("covers all six deck families", () => {
    for (const f of PERP_FAMILIES) expect(FAMILY_META[f].label).toBeTruthy();
  });
});

describe("fmtCompact", () => {
  it("abbreviates at each magnitude", () => {
    expect(fmtCompact(912)).toBe("912");
    expect(fmtCompact(48300)).toBe("48.3K");
    expect(fmtCompact(1_200_000)).toBe("1.2M");
    expect(fmtCompact(3_400_000_000)).toBe("3.4B");
  });

  it("handles negatives and nonsense without emitting NaN onto a card", () => {
    expect(fmtCompact(-48300)).toBe("-48.3K");
    expect(fmtCompact(Number.NaN)).toBe("—");
    expect(fmtCompact(Number.POSITIVE_INFINITY)).toBe("—");
  });
});

describe("fmtChange", () => {
  it("always carries an explicit sign", () => {
    expect(fmtChange(4.25)).toBe("+4.3%");
    expect(fmtChange(-4.25)).toBe("-4.3%");
    expect(fmtChange(0)).toBe("+0.0%");
  });
});

describe("toView", () => {
  it("normalises a ledger market into a de-vigged prediction", () => {
    const v = toView(market({ yesOdds: 1.5, noOdds: 3 }));
    expect(v.cls).toBe("prediction");
    expect(v.outcomes).toHaveLength(2);
    expect(v.outcomes[0].prob + v.outcomes[1].prob).toBeCloseTo(1);
    expect(v.tradeable).toBe(true);
  });

  it("marks a non-open market untradeable", () => {
    expect(toView(market({ status: "resolved" })).tradeable).toBe(false);
    expect(toView(market({ status: "disputed" })).tradeable).toBe(false);
  });

  it("normalises a perp and keeps its leg close", () => {
    const v = toView(perp());
    expect(v.cls).toBe("perp");
    expect(v.family).toBe("faces");
    expect(v.outcomes).toHaveLength(0);
    expect(v.closesAt).toBe("2026-08-29T00:00:00.000Z");
    expect(v.tradeable).toBe(true);
  });

  // The mismatch the view-model exists to make visible rather than hide:
  // three of the six families have no perp_markets row behind them.
  it("marks a signal-only family untradeable even when open", () => {
    const v = toView(perp({ family: "scandal" as PerpMarket["family"], status: "open" }));
    expect(v.family).toBe("scandal");
    expect(v.tradeable).toBe(false);
  });

  it("reads open interest out of the untyped details blob, defensively", () => {
    expect(toView(perp({ details: { openInterest: 4200 } })).oi).toBe(4200);
    expect(toView(perp({ details: { openInterest: "lots" } })).oi).toBeUndefined();
    expect(toView(perp({ details: {} })).oi).toBeUndefined();
  });

  it("routes a proposal to its class and never marks it tradeable", () => {
    expect(toView(proposal({ type: "faces" }), "p1").cls).toBe("perp");
    expect(toView(proposal({ type: "saga" }), "p2").cls).toBe("prediction");
    expect(toView(proposal({ type: "zliar" }), "p3").cls).toBe("conviction");
    // A proposal is a classifier candidate, not a row — nothing to trade.
    expect(toView(proposal(), "p4").tradeable).toBe(false);
  });

  it("reads each class off the signal that means something for it", () => {
    const perpView = toView(proposal({ type: "faces", perpProbability: 0.8 }), "p5");
    expect(perpView.upPct).toBe(80);
    const convView = toView(proposal({ type: "zliar", zliarScore: 30 }), "p6");
    expect(convView.upPct).toBe(30);
  });

  it("discriminates all three input types without a shared tag", () => {
    expect(toView(market()).cls).toBe("prediction");
    expect(toView(perp()).cls).toBe("perp");
    expect(toView(proposal(), "p7").cls).toBe("perp");
  });
});
