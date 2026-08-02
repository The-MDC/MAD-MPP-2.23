import { describe, it, expect } from "vitest";
import { satirizeHeadline, type NewsCategory } from "./satire-headline";

const ALL_CATEGORIES: NewsCategory[] = [
  "headlines", "entertainment", "sports", "viraltech", "crypto", "tabloid",
];

describe("satirizeHeadline", () => {
  it("is deterministic for the same input", () => {
    const a = satirizeHeadline("Pop star spotted leaving mansion", "entertainment");
    const b = satirizeHeadline("Pop star spotted leaving mansion", "entertainment");
    expect(a).toBe(b);
  });

  it("wraps the original headline with a prefix and a suffix", () => {
    const out = satirizeHeadline("Bitcoin dips below key level", "crypto");
    expect(out).toContain("Bitcoin dips below key level");
    expect(out.length).toBeGreaterThan("Bitcoin dips below key level".length);
  });

  it("varies the voice by category", () => {
    const ent = satirizeHeadline("Same headline here", "entertainment");
    const pol = satirizeHeadline("Same headline here", "headlines");
    // different category pools → the wrapper differs even for identical text
    expect(ent).not.toBe(pol);
  });

  it("returns empty string for blank input", () => {
    expect(satirizeHeadline("", "crypto")).toBe("");
    expect(satirizeHeadline("   ", "crypto")).toBe("");
  });

  it("supports the tabloid and viraltech voices distinctly", () => {
    const tab = satirizeHeadline("Mystery yacht photos surface", "tabloid");
    const vir = satirizeHeadline("Mystery yacht photos surface", "viraltech");
    expect(tab).toContain("Mystery yacht photos surface");
    expect(vir).toContain("Mystery yacht photos surface");
    expect(tab).not.toBe(vir);
  });

  it("supports all 6 canonical categories (wraps and preserves the headline)", () => {
    for (const cat of ALL_CATEGORIES) {
      const out = satirizeHeadline("A perfectly ordinary Tuesday", cat);
      expect(out).toContain("A perfectly ordinary Tuesday");
      expect(out.length).toBeGreaterThan("A perfectly ordinary Tuesday".length);
    }
  });

  it("applies the South-Park edge voice to roughly 15% of headlines", () => {
    // The edge voice is chosen deterministically for ~15 in 100 items. Over a
    // large deterministic sample the share should sit near 15% (10%–20% band).
    const EDGE_MARKERS = [
      "OH MY GOD, THEY:",
      "IN AN EPISODE THAT WRITES ITSELF:",
      "BREAKING (respectfully, insanely):",
      "SOMEHOW STILL LEGAL:",
      "A CHILD COULD SEE THIS COMING:",
    ];
    const N = 2000;
    let edged = 0;
    for (let i = 0; i < N; i++) {
      const out = satirizeHeadline(`Headline number ${i}`, "crypto");
      if (EDGE_MARKERS.some((m) => out.startsWith(m))) edged++;
    }
    const pct = (edged / N) * 100;
    expect(pct).toBeGreaterThan(10);
    expect(pct).toBeLessThan(20);
  });
});
