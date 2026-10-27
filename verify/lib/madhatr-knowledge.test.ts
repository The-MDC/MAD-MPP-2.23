import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { greetingReply, isGreeting, parseKnowledge, payGradeReply, retrieve, type Turn } from "@/lib/madhatr-knowledge";

const kb = parseKnowledge(readFileSync(path.join(__dirname, "..", "content", "madhatr", "knowledge.md"), "utf8"));
const user = (content: string): Turn => ({ role: "user", content });
const bot = (content: string): Turn => ({ role: "assistant", content });

describe("MADHAT'r knowledge base", () => {
  it("parses the ladder (2 fixed + 12–14 placeholders) and both brush-offs", () => {
    expect(kb.ladder[0]).toBe("That's above my pay grade.");
    expect(kb.ladder[1]).toBe("Like I said, Compadre, way above my pay grade.");
    expect(kb.ladder.length - 2).toBeGreaterThanOrEqual(12);
    expect(kb.ladder.length - 2).toBeLessThanOrEqual(14);
    expect(kb.brushOffs).toEqual(["Don't you have somewhere to be?!", "Please, go bother some other caged digital AI…"]);
    expect(kb.sections.filter((s) => s.say.length).length).toBeGreaterThanOrEqual(18);
  });

  it("echoes greetings and brushes off every 5th", () => {
    expect(isGreeting("Hey there!", kb)).toBe(true);
    expect(isGreeting("hey what's the fee?", kb)).toBe(false);
    expect(greetingReply("Yo MADHAT'r", [], kb)).toBe("Yo MADHAT'r");
    const four = [user("hi"), bot("hi"), user("hey"), bot("hey"), user("hello"), bot("hello"), user("yo"), bot("yo")];
    expect(greetingReply("sup", four, kb)).toBe("Don't you have somewhere to be?!");
    const nine = [...four, user("sup"), bot("x"), user("hi"), bot("hi"), user("hi"), bot("hi"), user("hi"), bot("hi"), user("hi"), bot("hi")];
    expect(greetingReply("hello", nine, kb)).toBe("Please, go bother some other caged digital AI…");
  });

  it("walks the pay-grade ladder, then rotates the placeholders", () => {
    expect(payGradeReply([], kb)).toBe(kb.ladder[0]);
    expect(payGradeReply([bot(kb.ladder[0])], kb)).toBe(kb.ladder[1]);
    expect(payGradeReply([bot(kb.ladder[0]), bot(kb.ladder[1])], kb)).toBe(kb.ladder[2]);
    const all = kb.ladder.map((l) => bot(l));
    expect(payGradeReply(all, kb)).toBe(kb.ladder[2 + ((kb.ladder.length - 2) % (kb.ladder.length - 2))]);
  });

  it("answers from the file and falls through when it has nothing", () => {
    expect(retrieve("what's the fee?", [], kb)?.topic).toBe("Fees");
    expect(retrieve("who is the founder?", [], kb)?.topic).toMatch(/founder/i);
    expect(retrieve("tell me about Mark Carney", [], kb)?.topic).toMatch(/Politics/);
    expect(retrieve("what is the Paseome?", [], kb)?.topic).toMatch(/Paseome/);
    expect(retrieve("best pizza in Brooklyn", [], kb)).toBeNull();
    const first = retrieve("what's the fee?", [], kb)!.reply;
    expect(retrieve("and the fee again?", [bot(first)], kb)!.reply).not.toBe(first);
  });
});
