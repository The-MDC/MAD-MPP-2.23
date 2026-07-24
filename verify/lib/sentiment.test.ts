import { describe, it, expect } from "vitest";
import { scoreSentiment } from "./sentiment";

describe("scoreSentiment", () => {
  it("returns a flat neutral for empty / whitespace input", () => {
    expect(scoreSentiment("")).toEqual({ valence: 0, intensity: 0, dopaminePotential: false });
    expect(scoreSentiment("   ")).toEqual({ valence: 0, intensity: 0, dopaminePotential: false });
  });

  it("drives valence negative on pure drama, but does not flag it bettable without future language", () => {
    // neg = 3 (scandal, feud, arrest) -> valence clamps to -1; intensity 0.75; no future terms
    const s = scoreSentiment("Celebrity scandal feud arrest");
    expect(s.valence).toBe(-1);
    expect(s.intensity).toBeCloseTo(0.75);
    expect(s.dopaminePotential).toBe(false);
  });

  it("flags forward-looking, energetic headlines as dopamine-bettable", () => {
    // future = 4 (rumor, could, escalat, soon) -> valence 0.8, intensity 0.8, bettable
    const s = scoreSentiment("Rumor could escalate soon");
    expect(s.valence).toBeCloseTo(0.8);
    expect(s.intensity).toBeCloseTo(0.8);
    expect(s.dopaminePotential).toBe(true);
  });
});
