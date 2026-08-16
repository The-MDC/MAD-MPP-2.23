/**
 * AGENT-BETA — POST /api/v1/cards/open-pack
 * Opens a 5-card pack. Slot 0 guaranteed Uncommon+.
 * Source: Card Game Logic Code Reference §4 (pick_pack_cards).
 */
import { NextRequest, NextResponse } from "next/server";
import { randomInt } from "node:crypto";
import { openCardPack, RARITY_TABLE } from "@/lib/gambit-game-math";
import { requireMadxRouteAuth, isAuthResponse } from "@/lib/madx-route-auth";
import { derivePackNonce } from "@/lib/pack-nonce";
import { hasDatabaseUrl } from "@/lib/database-url";
import { getDbPool } from "@/lib/db";

export const dynamic = "force-dynamic";

// SECURITY NOTE: fairness fix (Part 0 §2.2). Two prior issues, both closed:
//
// 1. userNonce and packNumber were both read straight from the request body
//    — a client could pick either freely and retry until the roll it liked
//    came up, at zero cost, since nothing was persisted. Both are now
//    derived server-side from the caller's own wallet plus
//    customer_accounts.pack_open_count, a persisted counter that only moves
//    forward (same upsert-and-increment pattern as login_count). Retrying
//    now always consumes the next counter value — a new roll, not a free
//    reroll of the same one. This is NOT the VRF work (Part V Phase 3):
//    it closes free rerolls, not general unpredictability of a single roll.
//
// 2. The balance check was decorative — madxBalance came from the request
//    body with no server-side balance source behind it, so it could never
//    actually block anyone. Removed rather than left in place implying a
//    guarantee it didn't provide; a real check needs a server-side MADx
//    balance source (on-chain read or ledger table) this route has no
//    visibility into, owned by whoever builds the actual spend flow.
export async function POST(req: NextRequest) {
  const auth = requireMadxRouteAuth(req, "cards-open-pack", 20, 60_000);
  if (isAuthResponse(auth)) return auth;

  try {
    const packOpenCount = await nextPackOpenCount(auth.owner, auth.session.chainId);
    const userNonce = derivePackNonce(auth.owner, packOpenCount);
    const result = openCardPack(userNonce, packOpenCount);

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
      slot0Guarantee: `${slot0Rarity} (≥Uncommon) ✓`,
      packNumber: packOpenCount,
      totalCards: result.cards.length,
    });
  } catch (e) {
    return NextResponse.json({ error: "Pack opening failed" }, { status: 500 });
  }
}

/**
 * The persisted, monotonic per-wallet pack counter. Falls back to a
 * CSPRNG-derived one-off count when there's no database (demo/local) rather
 * than hard-failing the route — there's no persisted state to grind against
 * either way in that mode.
 */
async function nextPackOpenCount(owner: string, chainId: number): Promise<number> {
  if (!hasDatabaseUrl()) return randomInt(1, 1_000_000);

  const pool = getDbPool();
  const { rows } = await pool.query<{ pack_open_count: string }>(
    `INSERT INTO customer_accounts (wallet_address, chain_id, first_seen, pack_open_count)
     VALUES ($1, $2, now(), 1)
     ON CONFLICT (wallet_address) DO UPDATE
       SET pack_open_count = customer_accounts.pack_open_count + 1,
           updated_at = now()
     RETURNING pack_open_count`,
    [owner, chainId],
  );
  return Number(rows[0].pack_open_count);
}
