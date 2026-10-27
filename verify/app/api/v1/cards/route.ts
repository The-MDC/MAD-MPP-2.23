/**
 * AGENT-BETA — GET /api/v1/cards
 * Returns deck metadata and the first page of generated cards.
 * Source: Card Game Logic Code Reference §4, §2
 */
import { NextResponse } from "next/server";
import {
  PLATFORM, RARITY_TABLE, RARITY_DROP_WEIGHTS,
  STAKING_TIERS, FACTION_CANONICAL_IDS,
} from "@/lib/gambit-game-math";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rarityMeta = Object.entries(RARITY_TABLE).map(([key, tier]) => ({
      rarity: key,
      powerScore: tier.powerScore,
      cloutMultiplier: tier.cloutMultiplier,
      stakingApy: `${tier.stakingApy}%`,
      holographic: tier.holographic,
      accent: tier.accent,
      dropWeight: RARITY_DROP_WEIGHTS[key as keyof typeof RARITY_DROP_WEIGHTS] ?? 0,
      dropPct: `${((RARITY_DROP_WEIGHTS[key as keyof typeof RARITY_DROP_WEIGHTS] ?? 0) / 10).toFixed(1)}%`,
    }));

    return NextResponse.json({
      deckSize: PLATFORM.TOTAL_DECK_SIZE,
      packCost: PLATFORM.CARD_PACK_COST,
      packSize: PLATFORM.CARD_PACK_SIZE,
      generationSeed: PLATFORM.CARD_GENERATION_SEED,
      packGuarantee: "Slot 0 always Uncommon or better",
      factions: FACTION_CANONICAL_IDS,
      rarityTiers: rarityMeta,
      stakingTiers: STAKING_TIERS,
      tokenAddress: "0x6972370e1caAA3624F37D7e87C28e1089D00151f",
      chain: "Arbitrum Nova",
    });
  } catch (e) {
    return NextResponse.json({ error: "Card metadata unavailable" }, { status: 500 });
  }
}
