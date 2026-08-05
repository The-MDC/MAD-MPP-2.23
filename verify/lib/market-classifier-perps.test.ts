import { describe, it, expect } from "vitest";
import {
  classifySignal,
  proposalsForToday,
  emptyTypeTally,
  MARKET_TYPES,
  type Signal,
} from "@/lib/market-classifier";

const perp = (headline: string): Signal => ({ headline, perpProbability: 0.9 });

describe("classifier — the three new perp families", () => {
  it("routes a persona-bearing perpetual subject to FIVE FACES", () => {
    expect(classifySignal(perp("a decade-long saga of the founder's public conduct")).type).toBe(
      "faces",
    );
    expect(classifySignal(perp("the senator's permanent legacy over the years")).type).toBe("faces");
  });

  it("routes FIVE FACES ahead of gossipcop when both could match", () => {
    // celebrity (gossip) AND ceo (persona) — persona must win, because the
    // interesting question is which face, not whether the storyline is alive.
    const p = classifySignal(perp("celebrity ceo feud drags on for years"));
    expect(p.type).toBe("faces");
  });

  it("routes a trend subject to ZEITGEIST", () => {
    expect(classifySignal(perp("creator economy shifts over the coming decade")).type).toBe(
      "zeitgeist",
    );
    expect(classifySignal(perp("social commerce adoption for years to come")).type).toBe("zeitgeist");
  });

  it("routes a mental model to EPIPHANY regardless of horizon", () => {
    expect(classifySignal({ headline: "Murphy's Law in software delivery" }).type).toBe("epiphany");
    expect(classifySignal({ headline: "does the Peter principle still hold" }).type).toBe("epiphany");
    expect(classifySignal({ headline: "an urban legend about cold weather" }).type).toBe("epiphany");
  });

  it("gives every new type a title and resolution copy", () => {
    for (const h of [
      "a decade-long saga of the founder's public conduct",
      "creator economy shifts over the coming decade",
      "Murphy's Law in software delivery",
    ]) {
      const p = classifySignal(perp(h));
      expect(p.title.length).toBeGreaterThan(0);
      expect(p.resolutionCriteria.length).toBeGreaterThan(0);
      expect(p.title).not.toContain("undefined");
    }
  });
});

describe("MARKET_TYPES — the guard against hand-listed type maps rotting", () => {
  it("has no duplicates", () => {
    expect(new Set(MARKET_TYPES).size).toBe(MARKET_TYPES.length);
  });

  it("covers all eight families including the three new ones", () => {
    expect(MARKET_TYPES).toContain("faces");
    expect(MARKET_TYPES).toContain("zeitgeist");
    expect(MARKET_TYPES).toContain("epiphany");
    expect(MARKET_TYPES.length).toBe(8);
  });

  it("emptyTypeTally returns a zeroed key for every market type", () => {
    const tally = emptyTypeTally();
    expect(Object.keys(tally).sort()).toEqual([...MARKET_TYPES].sort());
    expect(Object.values(tally).every((v) => v === 0)).toBe(true);
  });

  it("never emits a type outside MARKET_TYPES", () => {
    const headlines = [
      "a decade-long saga of the founder's public conduct",
      "creator economy shifts over the coming decade",
      "Murphy's Law in software delivery",
      "a decade-long celebrity feud saga",
      "a decade-long empire saga",
      "quiet update today",
      "Rumor could escalate soon",
      "celebrity lawsuit escalates over the years",
    ];
    for (const p of proposalsForToday(headlines.map((headline) => ({ headline })), 50)) {
      expect(MARKET_TYPES).toContain(p.type);
    }
  });
});

describe("classifier — regressions the new terms must not cause", () => {
  it("does not let a bare 'law' substring hijack legal headlines", () => {
    // "lawsuit"/"lawyer"/"lawmaker" must NOT become epiphany — epiphany is
    // evaluated first, so a greedy term here would capture the whole feed.
    for (const h of [
      "celebrity lawsuit escalates over the years",
      "the lawyer for the estate responds",
      "a lawmaker weighs in on the decade-long feud",
      "an outlaw country revival",
    ]) {
      expect(classifySignal(perp(h)).type).not.toBe("epiphany");
    }
  });

  it("keeps a generic empire saga as a plain perp", () => {
    // "empire" is deliberately NOT a persona term — it over-captures.
    expect(classifySignal(perp("a decade-long empire saga")).type).toBe("perp");
  });

  it("keeps a celebrity saga with no persona role as gossipcop", () => {
    expect(classifySignal(perp("a decade-long celebrity feud saga")).type).toBe("gossipcop");
  });

  it("leaves short-horizon and low-probability signals untouched", () => {
    expect(classifySignal({ headline: "quiet update today", perpProbability: 0.1 }).type).toBe(
      "progression",
    );
    expect(classifySignal({ headline: "a decade-long empire saga", perpProbability: 0.1 }).type).toBe(
      "saga",
    );
  });
});
