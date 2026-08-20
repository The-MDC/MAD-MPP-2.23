import { describe, it, expect } from "vitest";
import {
  FACTION_KEYS,
  CHAOS_BORDER_CYCLE,
  FACTION_COLORS,
  applyOutcomeVisualState,
  clownNoseIntensity,
  buildCardPrompt,
} from "./card-visual-states";

describe("faction constants", () => {
  it("has exactly 8 factions and 8 border colors", () => {
    expect(FACTION_KEYS).toHaveLength(8);
    expect(CHAOS_BORDER_CYCLE).toHaveLength(8);
  });

  it("each faction's primary color equals its slot in the chaos border cycle", () => {
    FACTION_KEYS.forEach((key, i) => {
      expect(FACTION_COLORS[key].color).toBe(CHAOS_BORDER_CYCLE[i]);
    });
  });

  it("each faction border is the primary color plus 55 alpha", () => {
    FACTION_KEYS.forEach((key) => {
      expect(FACTION_COLORS[key].border).toBe(`${FACTION_COLORS[key].color}55`);
    });
  });
});

describe("applyOutcomeVisualState", () => {
  it("climbs base -> evolved on a win", () => {
    expect(applyOutcomeVisualState("base", "win")).toBe("evolved");
  });
  it("recovers degenerated -> base on a win", () => {
    expect(applyOutcomeVisualState("degenerated", "win")).toBe("base");
  });
  it("slides base -> degenerated on a loss", () => {
    expect(applyOutcomeVisualState("base", "loss")).toBe("degenerated");
  });
  it("steps evolved -> base on a loss", () => {
    expect(applyOutcomeVisualState("evolved", "loss")).toBe("base");
  });
  it("always degenerates on scandal, from any state", () => {
    expect(applyOutcomeVisualState("holographic", "scandal")).toBe("degenerated");
    expect(applyOutcomeVisualState("evolved", "scandal")).toBe("degenerated");
  });
  it("redeem recovers only from degenerated", () => {
    expect(applyOutcomeVisualState("degenerated", "redeem")).toBe("base");
    expect(applyOutcomeVisualState("evolved", "redeem")).toBe("evolved");
  });
});

describe("clownNoseIntensity", () => {
  it("is 0 at depth 0, ramps linearly and clamps within [0,1]", () => {
    expect(clownNoseIntensity(0)).toBe(0);
    expect(clownNoseIntensity(2)).toBeCloseTo(0.4);
    expect(clownNoseIntensity(5)).toBe(1);
    expect(clownNoseIntensity(9)).toBe(1);
    expect(clownNoseIntensity(-3)).toBe(0);
  });
});

describe("buildCardPrompt", () => {
  it("includes the character name, faction name and rarity", () => {
    const prompt = buildCardPrompt({
      name: "Senator Snakeoil",
      faction: "politicos",
      satiricalFeature: "an ever-growing nose",
      state: "base",
      rarity: "legendary",
    });
    expect(prompt).toContain("Senator Snakeoil");
    expect(prompt).toContain("Politicos");
    expect(prompt).toContain("legendary");
  });
});
