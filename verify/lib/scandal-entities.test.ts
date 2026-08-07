import { describe, it, expect } from "vitest";
import { resolveEntity, resolveEntities, KNOWN_ENTITY_COUNT } from "./scandal-entities";

describe("resolveEntity", () => {
  it("resolves a curated name to its faction with a stable id", () => {
    const r = resolveEntity("Elon Musk");
    expect(r).not.toBeNull();
    expect(r?.faction).toBe("disruptors");
    expect(r?.characterId).toBe("char:elon-musk");
    expect(r?.confidence).toBeGreaterThan(0.8);
  });

  it("is case- and whitespace-insensitive", () => {
    expect(resolveEntity("  TAYLOR SWIFT ")?.faction).toBe("popIcons");
  });

  it("returns null for an unknown name (brand-safe)", () => {
    expect(resolveEntity("Some Nobody")).toBeNull();
  });
});

describe("resolveEntities", () => {
  it("drops unknowns and de-duplicates by character id", () => {
    const out = resolveEntities(["Elon Musk", "elon musk", "Nobody", "LeBron James"]);
    expect(out.map((e) => e.characterId)).toEqual(["char:elon-musk", "char:lebron-james"]);
  });

  it("exposes a positive roster count", () => {
    expect(KNOWN_ENTITY_COUNT).toBeGreaterThan(10);
  });
});
