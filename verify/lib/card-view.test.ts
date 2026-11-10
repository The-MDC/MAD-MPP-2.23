import { describe, expect, it } from "vitest";
import type { NftCard } from "@/context/game-context";
import type { CardRow } from "./cards";
import { cardRowToNft, cardRowsToNft, mergeOwnedCards, persistableCards, reconcileOwnedCards, resolveFaction } from "./card-view";
import { RARITY_TABLE } from "./gambit-game-math";

/**
 * CF4 — owned cards (`CardRow`, from the ledger) → what the card UI renders (`NftCard`).
 *
 * THIS FILE MUST STAY UNDER `lib/` — vitest's `include` is `lib/**\/*.test.ts`.
 */
const row = (over: Partial<CardRow> = {}): CardRow => ({
  id: 1,
  walletAddress: "0x1234567890123456789012345678901234567890",
  cardUid: "card_1_99",
  name: "Card #42",
  rarity: "Epic",
  faction: "Politicos",
  serial: 42,
  durability: 0.9,
  evolutionStage: 2,
  xp: 120,
  earnsCount: 7,
  uses: 3,
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z",
  ...over,
});

describe("cardRowToNft — what the ledger stores survives", () => {
  const c = cardRowToNft(row());

  it("keeps identity and state exactly", () => {
    expect(c.id).toBe("card_1_99");
    expect(c.name).toBe("Card #42");
    expect(c.serial).toBe(42);
    expect(c.rarity).toBe("Epic");
    expect(c.faction).toBe("Politicos");
    expect(c.xp).toBe(120);
    expect(c.durability).toBe(0.9);
    expect(c.stage).toBe(2);
    expect(c.earnsCount).toBe(7);
  });

  it("takes clout and APY boost from the rarity tier, not from a guess", () => {
    expect(c.cloutPct).toBe(Math.round(RARITY_TABLE.Epic.cloutMultiplier * 100)); // 320
    expect(c.cloutPct).toBe(320);
    expect(c.apyBoost).toBe(0.31);
  });

  it("derives the display-only fields in the ranges generateCard uses, and says nothing it did not store", () => {
    expect(c.volatility).toBeGreaterThanOrEqual(0);
    expect(c.volatility).toBeLessThanOrEqual(100);
    expect(c.odds).toBeGreaterThanOrEqual(1);
    expect(c.odds).toBeLessThanOrEqual(3);
    expect(c.edgeMultiplier).toBeGreaterThanOrEqual(1);
    expect(c.edgeMultiplier).toBeLessThanOrEqual(1.5);
    expect(c.caption).toBe("The scandal writes itself.");
  });

  it("is pinned: a given card looks the same on every load (the display draws are seeded by its uid)", () => {
    // Literals — `f(x) === f(x)` would pass for a clock-seeded draw (see CF7).
    expect({ volatility: c.volatility, odds: c.odds, edgeMultiplier: c.edgeMultiplier }).toEqual({
      volatility: 17,
      odds: 1.39,
      edgeMultiplier: 1.35,
    });
  });

  it("different cards get different display draws", () => {
    const a = cardRowToNft(row({ cardUid: "card_a" }));
    const b = cardRowToNft(row({ cardUid: "card_b" }));
    expect([a.volatility, a.odds]).not.toEqual([b.volatility, b.odds]);
  });

  it("points at real art by serial", () => {
    expect(c.artUrl).toMatch(/^\/cards\/\d{3}\.png$/);
  });
});

describe("cardRowToNft — it does not trust a row", () => {
  it("clamps durability to 0..1 and stage to 1..3", () => {
    expect(cardRowToNft(row({ durability: 7 })).durability).toBe(1);
    expect(cardRowToNft(row({ durability: -1 })).durability).toBe(0);
    expect(cardRowToNft(row({ evolutionStage: 99 })).stage).toBe(3);
    expect(cardRowToNft(row({ evolutionStage: 0 })).stage).toBe(1);
  });

  it("falls back to Common for a rarity the table does not know, rather than crashing the card", () => {
    const c = cardRowToNft(row({ rarity: "Ultra" as never }));
    expect(c.rarity).toBe("Common");
    expect(c.cloutPct).toBe(Math.round(RARITY_TABLE.Common.cloutMultiplier * 100));
  });

  it("names a nameless card by its serial", () => {
    expect(cardRowToNft(row({ name: "", serial: 7 })).name).toBe("Card #7");
  });

  it("never emits NaN", () => {
    const c = cardRowToNft(row({ xp: Number.NaN, durability: Number.NaN, earnsCount: Number.NaN, serial: Number.NaN }));
    for (const v of [c.xp, c.durability, c.earnsCount, c.serial, c.stage, c.volatility, c.odds, c.edgeMultiplier]) {
      expect(Number.isFinite(v)).toBe(true);
    }
  });
});

describe("resolveFaction — the ledger stores either spelling", () => {
  it("accepts a display name (what open-pack writes)", () => {
    expect(resolveFaction("Politicos")).toEqual({ faction: "Politicos", canonicalFactionId: "mad-council" });
  });

  it("accepts an on-chain id", () => {
    expect(resolveFaction("mad-council")).toEqual({ faction: "Politicos", canonicalFactionId: "mad-council" });
    expect(resolveFaction("degens")).toEqual({ faction: "The Memes", canonicalFactionId: "degens" });
  });

  it("falls back to the generateCard default for anything else, including the empty string the column defaults to", () => {
    expect(resolveFaction("")).toEqual({ faction: "The Memes", canonicalFactionId: "degens" });
    expect(resolveFaction("Nonsense")).toEqual({ faction: "The Memes", canonicalFactionId: "degens" });
  });
});

describe("cardRowsToNft — a route response is untrusted input", () => {
  it("maps good rows and skips junk without throwing", () => {
    const out = cardRowsToNft([row({ cardUid: "a" }), null, 7, {}, { cardUid: "" }, row({ cardUid: "b" })]);
    expect(out.map((c) => c.id)).toEqual(["a", "b"]);
  });

  it("is empty for a non-array", () => {
    expect(cardRowsToNft(undefined)).toEqual([]);
    expect(cardRowsToNft({ cards: [] })).toEqual([]);
  });
});

describe("mergeOwnedCards", () => {
  const seed = (id: string): NftCard => ({ ...cardRowToNft(row({ cardUid: id })), name: `seed ${id}` });

  it("puts owned cards first and keeps the rest", () => {
    const merged = mergeOwnedCards([seed("s1"), seed("s2")], [cardRowToNft(row({ cardUid: "owned" }))]);
    expect(merged.map((c) => c.id)).toEqual(["owned", "s1", "s2"]);
  });

  it("de-duplicates by id, preferring the owned version", () => {
    const owned = cardRowToNft(row({ cardUid: "same", name: "the real one" }));
    const merged = mergeOwnedCards([seed("same"), seed("other")], [owned]);
    expect(merged.map((c) => c.id)).toEqual(["same", "other"]);
    expect(merged[0].name).toBe("the real one");
  });

  it("is idempotent — a re-fetch cannot stack copies", () => {
    const owned = [cardRowToNft(row({ cardUid: "o1" })), cardRowToNft(row({ cardUid: "o2" }))];
    const once = mergeOwnedCards([seed("s1")], owned);
    expect(mergeOwnedCards(once, owned)).toEqual(once);
  });

  it("with nothing owned, changes nothing", () => {
    const existing = [seed("s1")];
    expect(mergeOwnedCards(existing, [])).toEqual(existing);
  });
});

describe("inherited property names are not tiers or factions", () => {
  // `key in obj` is true for "constructor" / "toString" / "__proto__"; the ledger's rarity and faction
  // columns are free TEXT. The first version of this module used `in` and produced NaN and functions.
  it.each(["constructor", "__proto__", "toString", "hasOwnProperty", "valueOf"])("rarity %s falls back to Common with real numbers", (bad) => {
    const c = cardRowToNft(row({ rarity: bad as never }));
    expect(c.rarity).toBe("Common");
    expect(c.cloutPct).toBe(Math.round(RARITY_TABLE.Common.cloutMultiplier * 100));
    expect(Number.isFinite(c.apyBoost)).toBe(true);
  });

  it.each(["constructor", "__proto__", "toString"])("faction %s falls back to the default string faction", (bad) => {
    const f = resolveFaction(bad);
    expect(typeof f.faction).toBe("string");
    expect(f).toEqual({ faction: "The Memes", canonicalFactionId: "degens" });
  });
});

describe("ownerWallet — a ledger card remembers whose it is", () => {
  const A = "0xAAAAaaaaAAAAaaaaAAAAaaaaAAAAaaaaAAAAaaaa";
  const B = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
  const mine = (uid: string, wallet: string) => cardRowToNft(row({ cardUid: uid, walletAddress: wallet }));
  const seed = (id: string): NftCard => ({ ...cardRowToNft(row({ cardUid: id })), ownerWallet: undefined });

  it("is set, lower-cased, by the mapper", () => {
    expect(mine("x", A).ownerWallet).toBe(A.toLowerCase());
  });

  it("REGRESSION: wallet A's cards do not appear for wallet B", () => {
    // A signs in, A's cards are merged; A signs out and B signs in on the same browser.
    const afterA = reconcileOwnedCards([seed("s1")], [mine("a1", A), mine("a2", A)], A);
    expect(afterA.map((c) => c.id)).toEqual(["a1", "a2", "s1"]);

    const asB = reconcileOwnedCards(afterA, [mine("b1", B)], B);
    expect(asB.map((c) => c.id)).toEqual(["b1", "s1"]);
    expect(asB.some((c) => c.ownerWallet === A.toLowerCase())).toBe(false);
  });

  it("signing out drops every ledger card and keeps the demo/session ones", () => {
    const signedIn = reconcileOwnedCards([seed("s1")], [mine("a1", A)], A);
    expect(reconcileOwnedCards(signedIn, [], null).map((c) => c.id)).toEqual(["s1"]);
  });

  it("is idempotent for the same wallet — a reconnect cannot stack copies", () => {
    const once = reconcileOwnedCards([seed("s1")], [mine("a1", A)], A);
    expect(reconcileOwnedCards(once, [mine("a1", A)], A)).toEqual(once);
  });

  it("compares wallets case-insensitively (a checksummed address is the same wallet)", () => {
    const list = reconcileOwnedCards([], [mine("a1", A)], A);
    expect(reconcileOwnedCards(list, [], A.toLowerCase()).map((c) => c.id)).toEqual(["a1"]);
  });

  it("persistableCards never writes a ledger card to localStorage", () => {
    const list = reconcileOwnedCards([seed("s1")], [mine("a1", A)], A);
    expect(persistableCards(list).map((c) => c.id)).toEqual(["s1"]);
  });
});
