import { describe, it, expect } from "vitest";
import { satirizeHeadline } from "./satire-headline";

describe("satirizeHeadline", () => {
  it("is deterministic for the same input", () => {
    const a = satirizeHeadline("Pop star spotted leaving mansion", "celebrity");
    const b = satirizeHeadline("Pop star spotted leaving mansion", "celebrity");
    expect(a).toBe(b);
  });

  it("wraps the original headline with a prefix and a suffix", () => {
    const out = satirizeHeadline("Bitcoin dips below key level", "crypto");
    expect(out).toContain("Bitcoin dips below key level");
    expect(out.length).toBeGreaterThan("Bitcoin dips below key level".length);
  });

  it("varies the voice by category", () => {
    const ent = satirizeHeadline("Same headline here", "entertainment");
    const pol = satirizeHeadline("Same headline here", "political");
    // different category pools → the wrapper differs even for identical text
    expect(ent).not.toBe(pol);
  });

  it("returns empty string for blank input", () => {
    expect(satirizeHeadline("", "crypto")).toBe("");
    expect(satirizeHeadline("   ", "crypto")).toBe("");
  });
});
