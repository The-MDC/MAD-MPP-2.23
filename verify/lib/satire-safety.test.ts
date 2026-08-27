import { describe, it, expect } from "vitest";
import { satireMetrics, assertionRiskOf, ASSERTION_REVIEW_THRESHOLD } from "./satire-metrics";
import { localSatireConfig, isLocalRoast, fitRoast, MAX_ROAST_CHARS } from "./local-satire";

describe("the gate that used to lie", () => {
  it("entertainmentGrade is the JUICINESS bar — it needs a high Z-Liar, by design", () => {
    // This is the exact behaviour that was shipping under the name `brandSafe`.
    // It is legitimate as a quality bar and indefensible as a safety one.
    const juicy = satireMetrics("Scandal feud meltdown bombshell betrayal");
    expect(juicy.entertainmentGrade).toBe(true);
    expect(juicy.zLiarScore).toBeGreaterThanOrEqual(60);
  });

  it("brandSafe still equals entertainmentGrade — the alias did not change value", () => {
    const m = satireMetrics("Scandal feud meltdown bombshell betrayal");
    expect(m.brandSafe).toBe(m.entertainmentGrade);
  });

  it("safety and juiciness are now separable signals, not one field", () => {
    const m = satireMetrics("Scandal feud meltdown bombshell betrayal");
    expect(typeof m.assertionRisk).toBe("number");
    expect(typeof m.lowAssertionRisk).toBe("boolean");
    expect(m.lowAssertionRisk).toBe(m.assertionRisk < ASSERTION_REVIEW_THRESHOLD);
  });
});

describe("assertionRiskOf", () => {
  it("fails CLOSED on an empty or unscoreable line", () => {
    expect(assertionRiskOf("")).toBe(100);
    expect(assertionRiskOf("   ")).toBe(100);
  });

  it("a named party plus an assertive verb scores high enough for review", () => {
    const risky = assertionRiskOf("Jordan Fairweather was arrested for fraud last night");
    expect(risky).toBeGreaterThanOrEqual(ASSERTION_REVIEW_THRESHOLD);
  });

  it("counterfactual mood pulls the same sentence back down", () => {
    const bare = assertionRiskOf("Jordan Fairweather was arrested for fraud");
    const hedged = assertionRiskOf("What if Jordan Fairweather had been arrested for fraud");
    expect(hedged).toBeLessThan(bare);
  });

  it("a joke about a situation carries little assertion risk", () => {
    expect(assertionRiskOf("The quarterly meeting achieved sentience and adjourned itself"))
      .toBeLessThan(ASSERTION_REVIEW_THRESHOLD);
  });

  it("is bounded to 0..100", () => {
    const lines = ["", "x", "Jordan Fairweather Chris Bannerman arrested indicted convicted fraud stole"];
    for (const l of lines) {
      const r = assertionRiskOf(l);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(100);
    }
  });
});

describe("local satire client", () => {
  it("is unconfigured unless BOTH base URL and model are set", () => {
    const prevBase = process.env.OLLAMA_BASE_URL;
    const prevModel = process.env.OLLAMA_MODEL;
    try {
      delete process.env.OLLAMA_MODEL;
      process.env.OLLAMA_BASE_URL = "http://127.0.0.1:11434";
      expect(localSatireConfig().configured).toBe(false);

      process.env.OLLAMA_MODEL = "some-model";
      expect(localSatireConfig().configured).toBe(true);

      // A non-http scheme is refused rather than passed to fetch.
      process.env.OLLAMA_BASE_URL = "file:///etc/passwd";
      expect(localSatireConfig().configured).toBe(false);

      process.env.OLLAMA_BASE_URL = "not a url";
      expect(localSatireConfig().configured).toBe(false);
    } finally {
      if (prevBase === undefined) delete process.env.OLLAMA_BASE_URL;
      else process.env.OLLAMA_BASE_URL = prevBase;
      if (prevModel === undefined) delete process.env.OLLAMA_MODEL;
      else process.env.OLLAMA_MODEL = prevModel;
    }
  });

  it("validates the model's JSON shape before trusting it", () => {
    expect(isLocalRoast({ satire_take: "a", scandal_velocity: 5, z_liar_index: 5 })).toBe(true);
    expect(isLocalRoast({ satire_take: "", scandal_velocity: 5, z_liar_index: 5 })).toBe(false);
    expect(isLocalRoast({ satire_take: "a", scandal_velocity: "x", z_liar_index: 5 })).toBe(false);
    expect(isLocalRoast(null)).toBe(false);
    expect(isLocalRoast("a string")).toBe(false);
  });

  it("fits a roast to the render contract, on a word boundary", () => {
    const long = "The quarterly earnings call achieved sentience, unionised, and then filed a grievance against its own shareholders for emotional damages";
    const out = fitRoast(long);
    expect(out.length).toBeLessThanOrEqual(MAX_ROAST_CHARS + 1); // +1 for the ellipsis
    expect(out.endsWith("…")).toBe(true);
    expect(out).not.toContain("  ");
  });

  it("strips the quotes models love to wrap output in", () => {
    expect(fitRoast('"a roast"')).toBe("a roast");
    expect(fitRoast("  spaced   out  ")).toBe("spaced out");
  });
});
