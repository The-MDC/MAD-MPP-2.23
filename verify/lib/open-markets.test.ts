import { describe, it, expect } from "vitest";
import { seedMarkets, policyViolation, sellQuote, quote, prices } from "@/lib/open-markets";
describe("demo engine", () => {
  it("seeds pass policy", () => {
    const bad = seedMarkets(Date.now()).filter((m) => policyViolation(m.title, ...m.outcomes.map((o) => o.label)));
    expect(bad.map((m) => m.title)).toEqual([]);
  });
  it("blocks harm", () => {
    expect(policyViolation("Will the CEO be assassinated?")).not.toBeNull();
    expect(policyViolation("Will the market crash this quarter?")).toBeNull();
  });
  it("buy then sell round-trips minus two fees", () => {
    const m = seedMarkets(Date.now())[0];
    const q = quote(m, 0, 100);
    const after = { ...m, outcomes: m.outcomes.map((o, i) => (i === 0 ? { ...o, q: o.q + q.shares } : o)) };
    const s = sellQuote(after, 0, q.shares);
    expect(Math.abs(s.gross - q.net)).toBeLessThan(0.02);
    expect(s.net).toBeLessThan(100);
    expect(Math.abs(s.priceAfter - prices(m.outcomes, m.b)[0])).toBeLessThan(1e-9);
  });
});
