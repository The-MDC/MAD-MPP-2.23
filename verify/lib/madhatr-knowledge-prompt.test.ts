import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { knowledgePromptFor, parseKnowledge, pickWelcome, rankSections, retrieve } from "@/lib/madhatr-knowledge";

const kb = parseKnowledge(readFileSync(join(__dirname, "..", "content", "madhatr", "knowledge.md"), "utf8"));

describe("the lean prompt for a small model", () => {
  it("is a fraction of the whole file but keeps the house rules and the basics", () => {
    const p = knowledgePromptFor(kb, "what does the gavel tier mean?");
    expect(p.length).toBeLessThan(kb.raw.length / 2);
    expect(p).toMatch(/House rules/);
    expect(p).toMatch(/Never quote fundraising terms/);
    expect(p).toMatch(/## Fees/);
  });

  it("pulls in the topic that matches the question, and not unrelated ones", () => {
    const tiers = knowledgePromptFor(kb, "what does the gavel tier mean?");
    expect(tiers).toMatch(/## Standing, tiers and symbols/);
    expect(tiers).not.toMatch(/## Crypto regulation/);
    const create = knowledgePromptFor(kb, "how do I create a market?");
    expect(create).toMatch(/## Making a market/);
  });

  it("still works when nothing matches", () => {
    const p = knowledgePromptFor(kb, "zzzz qqqq");
    expect(p).toMatch(/House rules/);
  });

  it("ranks the best topic first", () => {
    expect(rankSections("how does a market resolve and settle?", kb)[0].sec.title).toBe("How a market resolves");
  });
});

describe("the platform-wide topics are in the file and answer in no-model mode", () => {
  it.each([
    ["what are the seven rooms of the app?", /rooms/i],
    ["what are the six market formats?", /formats/i],
    ["how do i create a market?", /market/i],
    ["what is market+?", /Market\+/],
    ["where do the headlines come from?", /RSS/],
    ["is it live or a demo?", /Demo|Live/],
  ])("%s", (q, re) => {
    const hit = retrieve(q, [], kb);
    expect(hit, q).not.toBeNull();
    expect(hit!.reply).toMatch(re);
  });
});

describe("the welcome", () => {
  it("picks a humorous line from the file, deterministically for a given roll", () => {
    const a = pickWelcome(kb, () => 0);
    const b = pickWelcome(kb, () => 0.999);
    expect(a && b).toBeTruthy();
    expect(a).not.toBe(b);
    const sec = kb.sections.find((s) => s.title === "Welcome")!;
    expect(sec.say.length).toBeGreaterThanOrEqual(6);
    expect(sec.say).toContain(a!);
  });
  it("never retrieves as a normal answer (it has no keywords)", () => {
    expect(kb.sections.find((s) => s.title === "Welcome")!.keywords).toEqual([]);
  });
});
