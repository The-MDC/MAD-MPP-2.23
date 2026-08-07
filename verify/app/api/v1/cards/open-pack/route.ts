/**
 * AGENT-BETA — POST /api/v1/cards/open-pack
 * Opens a 5-card pack. Slot 0 guaranteed Uncommon+.
 * Source: Card Game Logic Code Reference §4 (pick_pack_cards).
 */
import { NextRequest, NextResponse } from "next/server";
import { openCardPack, PLATFORM, RARITY_TABLE } from "@/lib/gambit-game-math";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const userNonce = typeof body.userNonce === "number" ? body.userNonce : Math.floor(Math.random() * 999999);
    const packNumber = typeof body.packNumber === "number" ? body.packNumber : 1;
    const madxBalance = typeof body.madxBalance === "number" ? body.madxBalance : 0;

    if (madxBalance < PLATFORM.CARD_PACK_COST) {
      return NextResponse.json(
        { error: `Insufficient balance. Pack costs ${PLATFORM.CARD_PACK_COST} MADx.`, required: PLATFORM.CARD_PACK_COST },
        { status: 400 }
      );
    }

    const result = openCardPack(userNonce, packNumber);

    // Verify slot 0 guarantee server-side
    const slot0Rarity = result.cards[0].rarity;
    const slot0Valid = RARITY_TABLE[slot0Rarity].powerScore >= RARITY_TABLE["Uncommon"].powerScore;
    if (!slot0Valid) {
      return NextResponse.json(
        { error: "Pack generation integrity failure — slot 0 guarantee violated" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      cards: result.cards,
      cost: result.cost,
      newBalance: madxBalance - result.cost,
      slot0Guarantee: `${slot0Rarity} (≥Uncommon) ✓`,
      packNumber,
      totalCards: result.cards.length,
    });
  } catch (e) {
    return NextResponse.json({ error: "Pack opening failed" }, { status: 500 });
  }
}
