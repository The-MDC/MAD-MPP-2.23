import { describe, it, expect } from "vitest";
import {
  estimateHorizonDays,
  classifySignal,
  proposalsForToday,
  type Signal,
} from "./market-classifier";

describe("estimateHorizonDays", () => {
  it("reads time-horizon language deterministically", () => {
    expect(estimateHorizonDays("a decade-long empire saga")).toBe(540);
    expect(estimateHorizonDays("resolves next month")).toBe(120);
    expect(estimateHorizonDays("blows up in three weeks")).toBe(21);
    expect(estimateHorizonDays("breaking today")).toBe(7);
    expect(estimateHorizonDays("no time words here")).toBe(30);
  });
});

describe("classifySignal", () => {
  it("labels a long-horizon, high-perp signal as a perp", () => {
    const sig: Signal = { headline: "a decade-long empire saga", perpProbability: 0.9 };
    const p = classifySignal(sig);
    expect(p.type).toBe("perp");
    expect(p.perpEligible).toBe(true);
    expect(p.horizonDays).toBe(540);
  });

  it("labels a long-horizon, low-perp signal as a saga", () => {
    const sig: Signal = { headline: "a decade-long empire saga", perpProbability: 0.1 };
    const p = classifySignal(sig);
    expect(p.type).toBe("saga");
    expect(p.perpEligible).toBe(false);
  });

  it("labels a short, quiet signal as a progression", () => {
    const sig: Signal = { headline: "quiet update today", perpProbability: 0.1 };
    const p = classifySignal(sig);
    expect(p.type).toBe("progression");
    expect(p.horizonDays).toBe(7);
  });

  it("always returns rank score and conviction prior within [0,1]", () => {
    const p = classifySignal({ headline: "Rumor could escalate soon" });
    expect(p.score).toBeGreaterThanOrEqual(0);
    expect(p.score).toBeLessThanOrEqual(1);
    expect(p.convictionPrior).toBeGreaterThanOrEqual(0);
    expect(p.convictionPrior).toBeLessThanOrEqual(1);
  });
});

describe("proposalsForToday", () => {
  it("drops empty headlines, ranks by score desc and respects the limit", () => {
    const signals: Signal[] = [
      { headline: "" },
      { headline: "   " },
      { headline: "Rumor could escalate soon", perpProbability: 0.2 },
      { headline: "a decade-long empire saga", perpProbability: 0.9 },
      { headline: "quiet update today" },
    ];
    const out = proposalsForToday(signals, 2);
    expect(out).toHaveLength(2);
    expect(out[0].score).toBeGreaterThanOrEqual(out[1].score);
    expect(out.every((p) => p.headline.trim().length > 0)).toBe(true);
  });
});
