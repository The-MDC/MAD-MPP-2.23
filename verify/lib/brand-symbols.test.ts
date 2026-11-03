/**
 * The brand symbol registry must stay true to the product: every file exists, every platform tab and perpetual
 * family has a symbol, and the user → Creator VIP tiers sit exactly on the engine's creator ladder.
 */
import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  BRAND_SYMBOLS, SECTION_SYMBOL, CLASS_SYMBOL, FAMILY_SYMBOL, TIERS, tierFor, LADDER_RUNG_NAMES, type SymbolId,
} from "@/lib/brand-symbols";
import { PLATFORM_TAB_KEYS } from "@/lib/platform-features";
import { PERPS } from "@/lib/open-markets";
import { CREATOR_LADDER } from "@/lib/gambit-game-math";

const PUBLIC = join(__dirname, "..", "public");

describe("brand symbols", () => {
  it("every symbol file exists in /public", () => {
    for (const s of Object.values(BRAND_SYMBOLS)) {
      expect(existsSync(join(PUBLIC, s.src)), s.src).toBe(true);
    }
  });

  it("every platform tab has a symbol, and nothing extra", () => {
    expect(Object.keys(SECTION_SYMBOL).sort()).toEqual([...PLATFORM_TAB_KEYS].sort());
  });

  it("every perpetual family has a symbol", () => {
    expect(Object.keys(FAMILY_SYMBOL).sort()).toEqual([...PERPS].sort());
  });

  it("every mapping points at a symbol that exists", () => {
    const ids = new Set(Object.keys(BRAND_SYMBOLS));
    const all: SymbolId[] = [
      ...Object.values(SECTION_SYMBOL), ...Object.values(CLASS_SYMBOL), ...Object.values(FAMILY_SYMBOL), ...TIERS.map((t) => t.symbol),
    ];
    for (const id of all) expect(ids.has(id), id).toBe(true);
  });

  it("each tier has its own symbol", () => {
    expect(new Set(TIERS.map((t) => t.symbol)).size).toBe(TIERS.length);
  });
});

describe("tiers ride the engine's creator ladder", () => {
  it("the rung names the tiers lean on are the ladder's", () => {
    expect(LADDER_RUNG_NAMES).toEqual(["User", "MinorCreator", "CR8TR"]);
  });

  it("thresholds come from CREATOR_LADDER, not from this file", () => {
    const minor = CREATOR_LADDER[1];
    const cr8tr = CREATOR_LADDER[2];
    expect(tierFor({ tractionedMarkets: 0, followers: 0 }).id).toBe("user");
    expect(tierFor({ tractionedMarkets: minor.unlockMarkets - 1, followers: 0 }).id).toBe("user");
    expect(tierFor({ tractionedMarkets: minor.unlockMarkets, followers: 0 }).id).toBe("minor");
    expect(tierFor({ tractionedMarkets: cr8tr.unlockMarkets, followers: cr8tr.unlockFollowers - 1 }).id).toBe("minor");
    expect(tierFor({ tractionedMarkets: cr8tr.unlockMarkets, followers: cr8tr.unlockFollowers }).id).toBe("cr8tr");
  });

  it("VIP is a capital-side flag and Creator VIP is a seat", () => {
    expect(tierFor({ tractionedMarkets: 0, followers: 0, isVip: true }).id).toBe("vip");
    expect(tierFor({ tractionedMarkets: 0, followers: 0, hasVipSeat: true }).id).toBe("creatorVip");
    // a seat outranks everything; traction outranks a bare VIP flag
    expect(tierFor({ tractionedMarkets: 40, followers: 900, isVip: true, hasVipSeat: true }).id).toBe("creatorVip");
    expect(tierFor({ tractionedMarkets: 40, followers: 900, isVip: true }).id).toBe("cr8tr");
  });
});
