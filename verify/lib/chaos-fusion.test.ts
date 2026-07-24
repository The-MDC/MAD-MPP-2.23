import { describe, it, expect } from "vitest";
import {
  CHAOS_INVARIANTS,
  compositionFor,
  selectChaosCharacters,
  buildChaosFusionPrompt,
  nextChaosSerial,
  buildChaosFusionMetadata,
  type ChaosCharacter,
} from "./chaos-fusion";

const roster: ChaosCharacter[] = [
  { id: "a", name: "Apex", faction: "politicos", satiricalFeature: "nose", recentScandalScore: 90 },
  { id: "b", name: "Bench", faction: "politicos", satiricalFeature: "nose", recentScandalScore: 50 },
  { id: "c", name: "Cross", faction: "athletes", satiricalFeature: "bat", recentScandalScore: 80 },
  { id: "d", name: "Dank", faction: "memes", satiricalFeature: "frog", recentScandalScore: 70 },
];

describe("compositionFor", () => {
  it("is triangular for three, radial for four, layered beyond", () => {
    expect(compositionFor(3)).toBe("triangular");
    expect(compositionFor(4)).toBe("radial");
    expect(compositionFor(5)).toBe("layered");
  });
});

describe("selectChaosCharacters", () => {
  it("picks the apex champion per distinct faction, hottest first", () => {
    const picked = selectChaosCharacters(roster, 3);
    // one champion per faction (a beats b in politicos), then sorted by heat: a(90) c(80) d(70)
    expect(picked.map((c) => c.id)).toEqual(["a", "c", "d"]);
    expect(picked[0].id).toBe("a");
  });

  it("enforces the >=3 distinct-faction invariant", () => {
    const twoFactions = roster.filter((c) => c.faction !== "memes");
    expect(() => selectChaosCharacters(twoFactions, 3)).toThrow(/Insufficient factions/);
  });

  it("clamps a below-minimum request up to the 3-character floor", () => {
    expect(CHAOS_INVARIANTS.minCharacters).toBe(3);
    const twoFactions = roster.filter((c) => c.faction !== "memes");
    // asking for 2 is clamped to 3, so 2 distinct factions still throws
    expect(() => selectChaosCharacters(twoFactions, 2)).toThrow();
  });
});

describe("buildChaosFusionPrompt", () => {
  it("names the theme and every fused character", () => {
    const prompt = buildChaosFusionPrompt(
      [
        { name: "Apex", faction: "politicos", satiricalFeature: "nose" },
        { name: "Cross", faction: "athletes", satiricalFeature: "bat" },
        { name: "Dank", faction: "memes", satiricalFeature: "frog" },
      ],
      "THE GREAT UNRAVELING",
      "legendary",
    );
    expect(prompt).toContain("THE GREAT UNRAVELING");
    expect(prompt).toContain("Apex");
    expect(prompt).toContain("Cross");
    expect(prompt).toContain("Chaos Fusion");
  });
});

describe("nextChaosSerial", () => {
  it("emits CF-namespaced, zero-padded, strictly increasing serials", () => {
    const s1 = nextChaosSerial();
    const s2 = nextChaosSerial();
    expect(s1).toMatch(/^CF-\d{4}$/);
    expect(s2).toMatch(/^CF-\d{4}$/);
    expect(s1).not.toBe(s2);
  });

  it("honors a custom prefix", () => {
    expect(nextChaosSerial("XO")).toMatch(/^XO-\d{4}$/);
  });
});

describe("buildChaosFusionMetadata", () => {
  it("assembles apex-ordered metadata with a deterministic generation seed", () => {
    const decision = {
      type: "chaos_fusion" as const,
      characters: ["b", "c", "a"], // deliberately unordered
      theme: "THE GREAT UNRAVELING",
      rarityHint: "epic" as const,
    };
    const meta = buildChaosFusionMetadata(decision, "evt-42", roster);
    // apex ordering re-sorts by recent scandal desc: a(90) > c(80) > b(50)
    expect(meta.characters).toEqual(["a", "c", "b"]);
    expect(meta.factions).toEqual(["politicos", "athletes", "politicos"]);
    expect(meta.composition).toBe("triangular");
    // seed preserves the decision's original character order
    expect(meta.generationSeed).toBe("evt-42:b+c+a");
    expect(meta.trigger).toBe("event");
    expect(meta.type).toBe("chaos_fusion");
    expect(meta.serial).toMatch(/^CF-\d{4}$/);
  });
});
