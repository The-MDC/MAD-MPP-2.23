/**
 * Owned cards → the shape the card UI renders (CF4).
 *
 * `GET /api/v1/cards/collection/<wallet>` returns `CardRow`s — what the `cards` ledger
 * stores (lib/cards.ts). `components/nft-card.tsx` renders `NftCard`s — what the game
 * context carries (context/game-context.tsx). Nothing mapped one to the other, and nothing
 * called the route, so a card a wallet had really minted never appeared in its own
 * collection: the panel showed the demo seed cards and whatever the session had opened.
 *
 * WHAT IS STORED VS WHAT IS DERIVED. The ledger keeps identity and state: uid, name,
 * rarity, faction, serial, durability, stage, xp, earnings. `NftCard` also wants display
 * fields the ledger has no column for — caption, volatility, odds, edge multiplier. Those
 * are derived here and are DISPLAY VALUES, not stored facts: rarity-driven where the
 * canon defines them (clout, APY boost), and otherwise a stable pseudo-random draw seeded
 * by the card's uid, in the same ranges `generateCard` uses, so a given card looks the
 * same on every load without anything being persisted. Do not read a stored fact into them.
 *
 * Pure and isomorphic: no I/O, no clock, no `Math.random`.
 */
import type { NftCard } from "@/context/game-context";
import type { CardRow } from "@/lib/cards";
import { cardArtUrl } from "@/lib/card-art";
import { FACTION_CANONICAL_IDS, FACTION_DISPLAY_TO_ID, RARITY_TABLE, type Rarity } from "@/lib/gambit-game-math";

/** What `generateCard` falls back to for an unrecognised faction. */
const FALLBACK_FACTION = { faction: "The Memes", canonicalFactionId: "degens" } as const;

/** Same caption `generateCard` gives a card with no authored one. */
const DEFAULT_CAPTION = "The scandal writes itself.";

/** FNV-1a, 32-bit → a float in [0, 1). Stable across engines and runs. */
function unit(seed: string, salt: string): number {
  let h = 0x811c9dc5;
  const s = `${seed}|${salt}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 0x100000000;
}

/**
 * Own-property lookup. `key in obj` is TRUE for inherited names — `constructor`, `toString`,
 * `__proto__` — so a row with rarity "constructor" passed an `in` check and then indexed into
 * Object.prototype, yielding a function where a tier belongs (NaN clout, a function as the faction).
 * The ledger's rarity and faction columns are free TEXT, so they are untrusted.
 */
const has = (obj: object, key: string) => Object.prototype.hasOwnProperty.call(obj, key);

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : lo));
const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * The ledger stores either the on-chain snake_case faction id (`mad-council`) or the display
 * name (`Politicos`) — `open-pack` writes the display name. Accept both; anything else gets
 * the same fallback `generateCard` uses rather than a faction the UI has no accent for.
 */
export function resolveFaction(raw: string): { faction: NftCard["faction"]; canonicalFactionId: string } {
  const key = String(raw ?? "").trim();
  if (has(FACTION_CANONICAL_IDS, key)) {
    return { faction: FACTION_CANONICAL_IDS[key] as NftCard["faction"], canonicalFactionId: key };
  }
  if (has(FACTION_DISPLAY_TO_ID, key)) {
    return { faction: key as NftCard["faction"], canonicalFactionId: FACTION_DISPLAY_TO_ID[key] };
  }
  return { ...FALLBACK_FACTION };
}

function resolveRarity(raw: string): Rarity {
  return (has(RARITY_TABLE, raw) ? raw : "Common") as Rarity;
}

/** One owned card, shaped for `NftCardView`. */
export function cardRowToNft(row: CardRow): NftCard {
  const rarity = resolveRarity(row.rarity);
  const tier = RARITY_TABLE[rarity];
  const { faction, canonicalFactionId } = resolveFaction(row.faction);
  const serial = Math.trunc(Number(row.serial)) || 0;
  return {
    id: row.cardUid,
    name: row.name || `Card #${serial}`,
    faction,
    canonicalFactionId,
    rarity,
    serial,
    caption: DEFAULT_CAPTION,
    // Stored facts:
    xp: Math.max(0, Number(row.xp) || 0),
    durability: clamp(Number(row.durability), 0, 1),
    stage: clamp(Math.trunc(Number(row.evolutionStage)), 1, 3),
    earnsCount: Math.max(0, Number(row.earnsCount) || 0),
    // Canon, from the rarity tier:
    cloutPct: Math.round(tier.cloutMultiplier * 100),
    apyBoost: tier.stakingApy / 100,
    // Display-only, seeded by the uid (see the header):
    volatility: Math.round(unit(row.cardUid, "volatility") * 100),
    odds: round2(1 + unit(row.cardUid, "odds") * 2),
    edgeMultiplier: round2(1 + unit(row.cardUid, "edge") * 0.5),
    artUrl: cardArtUrl(serial),
    // Whose ledger this card came from. Lets the UI drop it when a different wallet signs in (see reconcileOwnedCards).
    ownerWallet: String(row.walletAddress ?? "").trim().toLowerCase() || undefined,
  };
}

/** Map a route response's `cards`, skipping (not throwing on) anything that is not a card row. */
export function cardRowsToNft(rows: unknown): NftCard[] {
  if (!Array.isArray(rows)) return [];
  const out: NftCard[] = [];
  for (const r of rows) {
    if (r && typeof r === "object" && typeof (r as CardRow).cardUid === "string" && (r as CardRow).cardUid) {
      out.push(cardRowToNft(r as CardRow));
    }
  }
  return out;
}

/**
 * Bring the card list in line with who is signed in.
 *
 * Cards read from the server ledger carry `ownerWallet`. Those that belong to a DIFFERENT wallet than
 * `address` are dropped, then `owned` is merged in. Without this, wallet A's cards — saved to
 * localStorage with the rest of the game state — appeared in wallet B's collection when B signed in on
 * the same browser. Cards with no `ownerWallet` (the demo seed, a pack opened this session) are
 * untouched. `address` null means signed out: every ledger card goes.
 */
export function reconcileOwnedCards(
  existing: readonly NftCard[],
  owned: readonly NftCard[],
  address: string | null,
): NftCard[] {
  const me = address ? address.trim().toLowerCase() : null;
  const kept = existing.filter((c) => !c.ownerWallet || (me !== null && c.ownerWallet === me));
  return mergeOwnedCards(kept, owned);
}

/**
 * What to write to localStorage. Ledger cards are NEVER persisted: they are re-read from the server
 * after sign-in, and persisting them is what let one wallet's collection reach another's.
 */
export function persistableCards(cards: readonly NftCard[]): NftCard[] {
  return cards.filter((c) => !c.ownerWallet);
}

/**
 * Put owned cards first and keep everything else, de-duplicated by id. Idempotent — merging
 * the same collection twice changes nothing — so a re-fetch on reconnect cannot stack copies.
 * It does not drop the demo/local cards: removing them is a product call, and a session that
 * has opened a demo pack should not lose it because a wallet connected.
 */
export function mergeOwnedCards(existing: readonly NftCard[], owned: readonly NftCard[]): NftCard[] {
  const ids = new Set(owned.map((c) => c.id));
  return [...owned, ...existing.filter((c) => !ids.has(c.id))];
}
