import { describe, it, expect } from "vitest";
import { cannedQuip, fitQuip, MAX_QUIP_CHARS, quipPrompt, rank, temperOf, TEMPERS } from "@/lib/octavian-voice";

describe("temper tracks the creature's tiers", () => {
  it("calm below 2 prods, ruffled 2-3, annoyed 4-5, furious 6+", () => {
    expect([0, 1, 2, 3, 4, 5, 6, 8].map(temperOf)).toEqual(["calm", "calm", "ruffled", "ruffled", "annoyed", "annoyed", "furious", "furious"]);
    expect(temperOf(NaN)).toBe("calm");
  });
  it("ranks calm lowest and furious highest", () => {
    expect(TEMPERS.map(rank)).toEqual([0, 1, 2, 3]);
  });
});

describe("the written bank", () => {
  it("has lines for every temper, each short enough to show", () => {
    for (const t of TEMPERS) {
      for (const r of [0, 0.3, 0.6, 0.99]) {
        const line = cannedQuip(t, () => r);
        expect(line.length).toBeGreaterThan(10);
        expect(line.length).toBeLessThanOrEqual(MAX_QUIP_CHARS);
      }
    }
  });
});

describe("fitQuip cleans model output", () => {
  it("strips quotes, markdown and reasoning, and caps the length", () => {
    expect(fitQuip('"**Easy** with the poking."')).toBe("Easy with the poking.");
    expect(fitQuip("<think>plan</think> Fine. Red it is.")).toBe("Fine. Red it is.");
    const long = fitQuip("word ".repeat(80))!;
    expect(long.length).toBeLessThanOrEqual(MAX_QUIP_CHARS + 1);
    expect(long.endsWith("…")).toBe(true);
  });
  it("refuses empty, non-text and key-shaped output", () => {
    expect(fitQuip("")).toBeNull();
    expect(fitQuip(42)).toBeNull();
    expect(fitQuip("my key is nvapi-AbCdEf1234567890")).toBeNull();
  });
});

describe("the prompt", () => {
  it("states the temper, names the node as context only, and forbids advice", () => {
    const p = quipPrompt("annoyed", "Z-Liar Meter");
    expect(p.input).toContain("annoyed");
    expect(p.input).toContain("Z-Liar Meter");
    expect(p.system).toMatch(/do not give advice or facts/i);
    expect(quipPrompt("calm", null).input).not.toContain("looking at");
  });
});
