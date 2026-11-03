/**
 * MAD Gambit — brand symbol registry.
 * ───────────────────────────────────
 * The symbols on the founder's logo-and-symbol sheets (Drive: MAD Gambit › Branding › LOGOs) are unique to
 * MAD Gambit. This file is the one place that says which symbol stands for what, so every surface uses the
 * same vocabulary: the platform tabs, the market classes, the perpetual families and the user → creator tiers.
 *
 * Files live in /public/brand. `heartThorn`, `bolt`, `target`, `scales`, `ball` and `heartCracked` shipped
 * earlier (card-*.png / sym-*.png); `coins`, `gavel`, `chain` and `ballPurple` are in /public/brand/symbols.
 *
 * Meanings are the design proposal for founder sign-off — change them here and everything follows.
 */
import { CREATOR_LADDER, creatorStatus } from "@/lib/gambit-game-math";

export type SymbolId =
  | "ball" | "ballPurple" | "scales" | "coins" | "gavel" | "chain"
  | "bolt" | "target" | "heartCracked" | "heartThorn";

export interface BrandSymbol {
  readonly id: SymbolId;
  readonly src: string;
  readonly name: string;
  /** What it stands for in the product. */
  readonly meaning: string;
}

export const BRAND_SYMBOLS: Readonly<Record<SymbolId, BrandSymbol>> = {
  ball:         { id: "ball",         src: "/brand/sym-prediction.png",      name: "Crystal ball",   meaning: "Foresight — prediction" },
  ballPurple:   { id: "ballPurple",   src: "/brand/symbols/ball-purple.webp", name: "Purple ball",    meaning: "Rare foresight — the mythic tier" },
  scales:       { id: "scales",       src: "/brand/sym-conviction.png",      name: "Scales",         meaning: "Judgement — conviction" },
  coins:        { id: "coins",        src: "/brand/symbols/coins.webp",       name: "Coins",          meaning: "Capital — what you put behind a belief" },
  gavel:        { id: "gavel",        src: "/brand/symbols/gavel.webp",       name: "Gavel",          meaning: "Authority — you rule your own markets" },
  chain:        { id: "chain",        src: "/brand/symbols/chain.webp",       name: "Broken chain",   meaning: "Links and bridges — staking, portals, cross-chain" },
  bolt:         { id: "bolt",         src: "/brand/card-scandal.png",        name: "Lightning bolt", meaning: "Scandal velocity — speed" },
  target:       { id: "target",       src: "/brand/card-zliar.png",          name: "Target",         meaning: "Precision — the claim, not the speaker" },
  heartCracked: { id: "heartCracked", src: "/brand/sym-affliction.png",      name: "Cracked heart",  meaning: "Affliction — the loss you keep" },
  heartThorn:   { id: "heartThorn",   src: "/brand/card-gossip.png",         name: "Thorned heart",  meaning: "Deep affliction — the saga that won't end" },
};

/** One symbol per platform tab (keys match lib/platform-features.ts). */
export const SECTION_SYMBOL = {
  floor: "scales",
  saga: "ballPurple",
  arena: "gavel",
  packs: "coins",
  portal: "chain",
  casino: "bolt",
  logic: "target",
} as const satisfies Record<string, SymbolId>;

/** The three words of the brand. */
export const CLASS_SYMBOL = {
  prediction: "ball",
  conviction: "scales",
  affliction: "heartCracked",
} as const satisfies Record<string, SymbolId>;

/** Perpetual families (lib/open-markets.ts OMPerp). */
export const FAMILY_SYMBOL = {
  scandal: "bolt",
  zliar: "target",
  gossip: "heartThorn",
  epiphany: "ball",
  faces: "heartCracked",
  zeitgeist: "scales",
} as const satisfies Record<string, SymbolId>;

/* ------------------------------------------------------------------------------------------------
 * The user → creator ladder, as symbols.
 *   User → Minor Creator → CR8TR  : traction rungs, straight from CREATOR_LADDER
 *   VIP                            : capital-side status (a holder, never a creator rung)
 *   Creator VIP                    : the limited, invitation-only profit-share seat
 * ---------------------------------------------------------------------------------------------- */
export type TierId = "user" | "minor" | "cr8tr" | "vip" | "creatorVip";

export interface Tier {
  readonly id: TierId;
  readonly name: string;
  readonly symbol: SymbolId;
  readonly how: string;
}

export const TIERS: readonly Tier[] = [
  { id: "user",       name: "User",         symbol: "ball",       how: "Everyone starts here." },
  { id: "minor",      name: "Minor Creator", symbol: "scales",     how: "12 tractioned markets." },
  { id: "cr8tr",      name: "CR8TR",         symbol: "gavel",      how: "34 tractioned markets and 888 followers." },
  { id: "vip",        name: "VIP",           symbol: "coins",      how: "Capital-side status: a Golden Hand or Mythic holder." },
  { id: "creatorVip", name: "Creator VIP",   symbol: "ballPurple", how: "A limited, invitation-only profit-share seat." },
];

const BY_ID = new Map(TIERS.map((t) => [t.id, t] as const));
export const tierById = (id: TierId): Tier => BY_ID.get(id) ?? TIERS[0];

export interface TierInput {
  tractionedMarkets: number;
  followers: number;
  /** Holds a Golden Hand or Mythic card. */
  isVip?: boolean;
  /** Holds one of the limited Creator VIP seats. */
  hasVipSeat?: boolean;
}

/**
 * The tier a person is on. Traction rungs come from CREATOR_LADDER via creatorStatus (the engine), so the
 * thresholds can never drift from the payout maths; VIP and Creator VIP are status flags, not thresholds.
 */
export function tierFor(i: TierInput): Tier {
  if (i.hasVipSeat) return tierById("creatorVip");
  const rung = creatorStatus(i.tractionedMarkets, i.followers).status;
  if (rung === "CR8TR") return tierById("cr8tr");
  if (i.isVip) return tierById("vip");
  if (rung === "MinorCreator") return tierById("minor");
  return tierById("user");
}

/** The ladder rung names the tiers lean on — exported so a test can pin them to CREATOR_LADDER. */
export const LADDER_RUNG_NAMES: readonly string[] = CREATOR_LADDER.map((r) => r.status);
