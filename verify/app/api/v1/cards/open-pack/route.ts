/**
 * AGENT-BETA — POST /api/v1/cards/open-pack
 * Opens a 5-card pack. Slot 0 guaranteed Uncommon+.
 * Source: Card Game Logic Code Reference §4 (pick_pack_cards).
 */
import { NextRequest, NextResponse } from "next/server";
import { openCardPack, PLATFORM, RARITY_TABLE } from "@/lib/gambit-game-math";
import { requireMadxRouteAuth, isAuthResponse } from "@/lib/madx-route-auth";

export const dynamic = "force-dynamic";

// SECURITY NOTE (partial fix, flagged not solved): this route had no auth at
// all, and its "balance check" is decorative — madxBalance is read straight
// from the request body, there's no DATABASE_URL/getDbPool import in this
// file, and nothing here persists a pack or debits anything. Requiring a
// session at least ties every pack-open to an accountable wallet instead of
// an anonymous caller. It does NOT make the balance check real — that needs
// a server-side balance source (on-chain read or a ledger table) wired in by
// whoever owns the actual MADx purchase/spend flow, which this route doesn't
// have visibility into.
export async function POST(req: NextRequest) {
  const auth = requireMadxRouteAuth(req, "cards-open-pack", 20, 60_000);
  if (isAuthResponse(auth)) return auth;

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
