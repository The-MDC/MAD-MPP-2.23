import { describe, it, expect } from "vitest";
import { satirizeHeadline, type NewsCategory } from "./satire-headline";

const ALL_CATEGORIES: NewsCategory[] = [
  "headlines", "entertainment", "sports", "viraltech", "crypto", "tabloid",
];

/**
 * These assertions used to require the bug.
 *
 * Six of them asserted `toContain(<the original headline>)`, because the old
 * implementation returned `PREFIX + <untouched source> + SUFFIX`. That is
 * exactly the defect — every news card rendered a raw newsroom headline — so
 * the suite was pinning the behaviour it should have been catching. They are
 * inverted here: the contract is now that the source must NOT survive into the
 * output.
 */
describe("satirizeHeadline", () => {
  it("is deterministic for the same input", () => {
    // Not a nicety. This renders on the server and again on the client; any
    // divergence is a React hydration error in production.
    const a = satirizeHeadline("Pop star spotted leaving mansion", "entertainment");
    const b = satirizeHeadline("Pop star spotted leaving mansion", "entertainment");
    expect(a).toBe(b);
  });

  it("REWRITES rather than wrapping — the source never survives", () => {
    const src = "Bitcoin dips below key level";
    const out = satirizeHeadline(src, "crypto");
    expect(out).not.toContain(src);
    expect(out.length).toBeGreaterThan(0);
  });

  it("never embeds the source, in any category", () => {
    const src = "Senate committee delays vote on infrastructure package again";
    for (const cat of ALL_CATEGORIES) {
      expect(satirizeHeadline(src, cat)).not.toContain(src);
    }
  });

  it("caps length so cards stop truncating mid-sentence", () => {
    // The old output was `source + ~45 chars`, which is why long tabloid
    // titles were cut off in the UI.
    const long =
      "Inside Cristiano Ronaldo and Georgina Rodríguez's low-key living-room wedding, with more details still to come";
    for (const cat of ALL_CATEGORIES) {
      expect(satirizeHeadline(long, cat).length).toBeLessThanOrEqual(70);
    }
  });

  it("varies the voice by category", () => {
    const ent = satirizeHeadline("Apple unveils something again", "entertainment");
    const pol = satirizeHeadline("Apple unveils something again", "headlines");
    expect(ent).not.toBe(pol);
  });

  it("returns empty string for blank input", () => {
    expect(satirizeHeadline("", "crypto")).toBe("");
    expect(satirizeHeadline("   ", "crypto")).toBe("");
  });

  it("still produces a line when no subject can be extracted", () => {
    // A one-word headline is its own subject; embedding it would breach the
    // no-source contract, so the subjectless frame takes over.
    const out = satirizeHeadline("Ronaldo", "tabloid");
    expect(out.length).toBeGreaterThan(0);
    expect(out).not.toContain("Ronaldo");
  });

  it("does not SHOUT when the source feed is all-caps", () => {
    const out = satirizeHeadline("SHOCK AS LOCAL MAN EATS ENTIRE CAKE", "tabloid");
    expect(out).not.toBe(out.toUpperCase());
  });

  it("produces distinct lines for tabloid vs viraltech", () => {
    const tab = satirizeHeadline("Mystery yacht photos surface", "tabloid");
    const vir = satirizeHeadline("Mystery yacht photos surface", "viraltech");
    expect(tab).not.toBe(vir);
  });

  it("applies the South-Park edge voice to roughly 15% of headlines", () => {
    const EDGE_MARKERS = [
      "learned a valuable lesson",
      "still completely legal",
      "but make it a town meeting",
      "very concerned anchor",
      "With witnesses",
    ];
    const N = 2000;
    let edged = 0;
    for (let i = 0; i < N; i++) {
      const out = satirizeHeadline(`Story number ${i} about Someone Notable`, "crypto");
      if (EDGE_MARKERS.some((m) => out.includes(m))) edged++;
    }
    const pct = (edged / N) * 100;
    expect(pct).toBeGreaterThan(10);
    expect(pct).toBeLessThan(20);
  });
});
