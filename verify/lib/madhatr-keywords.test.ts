import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseKnowledge, retrieve } from "@/lib/madhatr-knowledge";

const kb = parseKnowledge(readFileSync(join(__dirname, "..", "content", "madhatr", "knowledge.md"), "utf8"));

describe("the MDC topic keeps the keywords it had before it grew", () => {
  const mdc = kb.sections.find((s) => s.title === "The MDC and the MADdegens")!;
  it("still answers to the original words, and to the new ones", () => {
    for (const k of ["mdc", "the mdc", "maddegens", "mad degens", "degens", "dao", "maddao", "community", "history", "origin", "megalomaniac", "madforge"]) {
      expect(mdc.keywords, k).toContain(k);
    }
  });
  it("answers governance and community questions in no-model mode", () => {
    for (const q of ["what is the MADDAO?", "tell me about the dao", "who are the degens?", "what is the MDC community?"]) {
      expect(retrieve(q, [], kb)?.topic, q).toBe("The MDC and the MADdegens");
    }
  });
  it("no keyword line ends in a dangling comma (a sign it was cut short)", () => {
    for (const s of kb.sections) for (const k of s.keywords) expect(k, s.title).not.toBe("");
    expect(readFileSync(join(__dirname, "..", "content", "madhatr", "knowledge.md"), "utf8")).not.toMatch(/^Keywords:.*,\s*$/m);
  });
});
