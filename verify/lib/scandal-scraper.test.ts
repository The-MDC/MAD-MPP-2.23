import { describe, it, expect } from "vitest";
import {
  DEFAULT_CONFIG,
  analyzeMultiParty,
  computeScandalScore,
  extractChaosTheme,
  decideTrigger,
  canGenerateChaos,
  type ScandalEvent,
  type ScandalEntity,
  type FactionKey,
} from "./scandal-scraper";

function entity(id: string, faction: FactionKey, confidence: number): ScandalEntity {
  return { rawName: id, normalizedName: id.toLowerCase(), characterId: id, faction, confidence };
}

function baseEvent(overrides: Partial<ScandalEvent> = {}): ScandalEvent {
  return {
    id: "evt",
    source: "gdelt",
    headline: "A divorce feud erupts between three camps",
    publishedAt: new Date("2026-07-24T00:00:00Z"),
    entities: [],
    themes: ["celebrity"],
    viralityScore: 0,
    ...overrides,
  };
}

const fiveFactions = [
  entity("c1", "politicos", 0.9),
  entity("c2", "athletes", 0.85),
  entity("c3", "popIcons", 0.82),
  entity("c4", "memes", 0.81),
  entity("c5", "villains", 0.83),
];

describe("DEFAULT_CONFIG", () => {
  it("carries the documented brand-safety + scarcity thresholds", () => {
    expect(DEFAULT_CONFIG.chaosScoreThreshold).toBe(72);
    expect(DEFAULT_CONFIG.minZLiarQuality).toBe(0.55);
    expect(DEFAULT_CONFIG.maxChaosPerDay).toBe(2);
    expect(DEFAULT_CONFIG.minHoursBetweenChaos).toBe(18);
  });
});

describe("computeScandalScore", () => {
  it("maxes at ~100 for a maximal event", () => {
    const ev = baseEvent({ viralityScore: 100, gcamScore: 100, zLiarScore: 1, entities: fiveFactions });
    expect(computeScandalScore(ev)).toBeCloseTo(100);
  });

  it("computes the documented weighted blend for a mixed event", () => {
    // entityScore = min(5/5,1)*100 = 100; 0.35*80 + 0.25*60 + 0.2*90 + 0.2*100 = 81
    const ev = baseEvent({ viralityScore: 80, gcamScore: 60, zLiarScore: 0.9, entities: fiveFactions });
    expect(computeScandalScore(ev)).toBeCloseTo(81);
  });
});

describe("analyzeMultiParty", () => {
  it("counts distinct factions above the confidence floor", () => {
    const ev = baseEvent({
      entities: [
        entity("c1", "politicos", 0.9),
        entity("c2", "athletes", 0.8),
        entity("c3", "popIcons", 0.75),
        entity("c4", "memes", 0.5), // below the 0.72 floor -> dropped
      ],
    });
    const r = analyzeMultiParty(ev);
    expect(r.distinctFactions).toHaveLength(3);
    expect(r.resolvedCharacters).toHaveLength(3);
    expect(r.isChaosCandidate).toBe(true);
    expect(r.isCrossoverCandidate).toBe(false);
  });

  it("flags exactly two factions as a crossover candidate", () => {
    const ev = baseEvent({ entities: [entity("c1", "politicos", 0.9), entity("c2", "athletes", 0.9)] });
    const r = analyzeMultiParty(ev);
    expect(r.isCrossoverCandidate).toBe(true);
    expect(r.isChaosCandidate).toBe(false);
  });

  it("de-duplicates repeated factions", () => {
    const ev = baseEvent({
      entities: [
        entity("c1", "politicos", 0.9),
        entity("c2", "politicos", 0.9),
        entity("c3", "athletes", 0.9),
      ],
    });
    const r = analyzeMultiParty(ev);
    expect(r.distinctFactions).toHaveLength(2);
    expect(r.resolvedCharacters).toHaveLength(3);
  });
});

describe("extractChaosTheme", () => {
  it("maps a known keyword to its satirical banner", () => {
    expect(extractChaosTheme(baseEvent({ headline: "Their divorce shocks fans" }))).toBe(
      "THE GREAT UNRAVELING",
    );
    expect(extractChaosTheme(baseEvent({ headline: "A bitter lawsuit begins", themes: [] }))).toBe(
      "COURTROOM CHAOS",
    );
  });

  it("falls back to a themed affair when no keyword matches", () => {
    expect(extractChaosTheme(baseEvent({ headline: "quiet gathering", themes: ["gala"] }))).toBe(
      "THE GALA AFFAIR",
    );
  });
});

describe("decideTrigger — the 5-gate tree", () => {
  it("gate 1: ignores anything that fails the Z-Liar brand-safety gate", () => {
    const d = decideTrigger(baseEvent({ zLiarScore: 0.3, viralityScore: 100, entities: fiveFactions }));
    expect(d.type).toBe("ignore");
  });

  it("gate 2: fires a Chaos Fusion for >=3 factions above threshold", () => {
    const d = decideTrigger(
      baseEvent({ viralityScore: 80, gcamScore: 60, zLiarScore: 0.9, entities: fiveFactions }),
    );
    expect(d.type).toBe("chaos_fusion");
    if (d.type === "chaos_fusion") {
      expect(d.characters).toEqual(["c1", "c2", "c3", "c4", "c5"]);
      expect(d.theme).toBe("THE GREAT UNRAVELING");
      expect(d.rarityHint).toBe("epic"); // score 81 < 88
    }
  });

  it("gate 2: escalates rarity as score climbs", () => {
    const d = decideTrigger(
      baseEvent({ viralityScore: 100, gcamScore: 100, zLiarScore: 1, entities: fiveFactions }),
    );
    expect(d.type).toBe("chaos_fusion");
    if (d.type === "chaos_fusion") expect(d.rarityHint).toBe("golden_hand"); // score 100 >= 95
  });

  it("gate 3: fires a Crossover for exactly two factions", () => {
    const d = decideTrigger(
      baseEvent({
        viralityScore: 80,
        gcamScore: 60,
        zLiarScore: 0.9,
        entities: [entity("c1", "politicos", 0.9), entity("c2", "athletes", 0.9)],
      }),
    );
    expect(d.type).toBe("crossover");
    if (d.type === "crossover") expect(d.characters).toEqual(["c1", "c2"]);
  });

  it("gate 4: fires a Scandal Pack for a single resolved faction above the pack floor", () => {
    const d = decideTrigger(
      baseEvent({
        viralityScore: 70,
        gcamScore: 50,
        zLiarScore: 0.8,
        entities: [entity("c1", "politicos", 0.9)],
      }),
    );
    expect(d.type).toBe("scandal_pack");
    if (d.type === "scandal_pack") expect(d.primaryCharacter).toBe("c1");
  });

  it("gate 5: falls to a live ticker when the score is modest and no character resolves", () => {
    const d = decideTrigger(
      baseEvent({
        viralityScore: 80,
        gcamScore: 50,
        zLiarScore: 0.8,
        entities: [entity("c1", "politicos", 0.5)], // below floor -> unresolved
      }),
    );
    expect(d.type).toBe("live_ticker_only");
  });

  it("ignores a low-score event", () => {
    const d = decideTrigger(baseEvent({ viralityScore: 10, gcamScore: 10, zLiarScore: 0.6 }));
    expect(d.type).toBe("ignore");
  });
});

describe("canGenerateChaos — scarcity guard", () => {
  const guard = {
    lastChaosFusionAt: null as Date | null,
    dailyChaosCount: 0,
    maxChaosPerDay: 2,
    minHoursBetweenChaos: 18,
  };

  it("allows generation when under the cap and past the cooldown", () => {
    expect(canGenerateChaos({ ...guard }).allowed).toBe(true);
  });

  it("blocks when the daily cap is hit", () => {
    expect(canGenerateChaos({ ...guard, dailyChaosCount: 2 }).allowed).toBe(false);
  });

  it("blocks while the cooldown is active", () => {
    const now = new Date("2026-07-24T12:00:00Z");
    const oneHourAgo = new Date("2026-07-24T11:00:00Z");
    expect(canGenerateChaos({ ...guard, lastChaosFusionAt: oneHourAgo }, now).allowed).toBe(false);
  });

  it("allows once the cooldown has elapsed", () => {
    const now = new Date("2026-07-24T12:00:00Z");
    const yesterday = new Date("2026-07-23T12:00:00Z"); // 24h ago > 18h cooldown
    expect(canGenerateChaos({ ...guard, lastChaosFusionAt: yesterday }, now).allowed).toBe(true);
  });
});
