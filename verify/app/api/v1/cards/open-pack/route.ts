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
import { spendWithin } from "@/lib/madx-web2";
import { insertCard, type CardRow } from "@/lib/cards";
import type { PoolClient } from "pg";

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
//
//    THAT SPEND FLOW NOW EXISTS. lib/madx-web2.ts holds a real double-entry
//    ledger, and `spendWithin` performs the debit on a caller-owned
//    transaction. So the pack is charged for: PLATFORM.CARD_PACK_COST is
//    debited from madx_accounts, the five cards are written to `cards`, and
//    the counter advances -- all in ONE transaction. A crash between them
//    would otherwise either charge for nothing or mint for free, and neither
//    is recoverable from the ledger because there would be nothing in it to
//    reverse.
//
//    The route previously only GENERATED cards. Nothing persisted them and
//    nothing paid for them, so "Buy & Rip" in pack-shop cost nothing and
//    minted nothing.
export async function POST(req: NextRequest) {
  const auth = requireMadxRouteAuth(req, "cards-open-pack", 20, 60_000);
  if (isAuthResponse(auth)) return auth;

  // Without a database there is no counter, no ledger and nowhere to mint. The
  // route still opens a pack so the UI works offline, but it is explicitly
  // unpaid and unpersisted, and says so — a free pack must never be presented
  // as an owned one.
  if (!hasDatabaseUrl()) {
    const packOpenCount = randomInt(1, 1_000_000);
    const result = openCardPack(derivePackNonce(auth.owner, packOpenCount), packOpenCount);
    const slot0Rarity = result.cards[0].rarity;
    return NextResponse.json({
      cards: result.cards,
      cost: result.cost,
      charged: false,
      persisted: false,
      source: "demo",
      slot0Guarantee: `${slot0Rarity} (≥Uncommon) ✓`,
      packNumber: packOpenCount,
      totalCards: result.cards.length,
    });
  }

  const pool = getDbPool();
  const client: PoolClient = await pool.connect();
  try {
    await client.query("BEGIN");

    // The counter advances inside the transaction, so a failed charge rolls it
    // back too — otherwise a user with no balance could burn counter values.
    const { rows } = await client.query<{ pack_open_count: string }>(
      `INSERT INTO customer_accounts (wallet_address, chain_id, first_seen, pack_open_count)
       VALUES ($1, $2, now(), 1)
       ON CONFLICT (wallet_address) DO UPDATE
         SET pack_open_count = customer_accounts.pack_open_count + 1,
             updated_at = now()
       RETURNING pack_open_count`,
      [auth.owner, auth.session.chainId],
    );
    const packOpenCount = Number(rows[0].pack_open_count);

    const userNonce = derivePackNonce(auth.owner, packOpenCount);
    const result = openCardPack(userNonce, packOpenCount);

    // Verify slot 0 guarantee server-side
    const slot0Rarity = result.cards[0].rarity;
    const slot0Valid = RARITY_TABLE[slot0Rarity].powerScore >= RARITY_TABLE["Uncommon"].powerScore;
    if (!slot0Valid) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Pack generation integrity failure — slot 0 guarantee violated" },
        { status: 500 }
      );
    }

    const paid = await spendWithin(client, auth.owner, result.cost, `pack #${packOpenCount}`);
    if (!paid) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: `insufficient $MADx — a pack costs ${result.cost}` },
        { status: 402 },
      );
    }

    const owned: CardRow[] = [];
    for (const c of result.cards) {
      owned.push(
        await insertCard(client, {
          walletAddress: auth.owner,
          cardUid: c.id,
          name: c.name,
          rarity: c.rarity,
          faction: c.faction,
          serial: c.serial,
        }),
      );
    }

    await client.query("COMMIT");

    return NextResponse.json({
      cards: result.cards,
      owned,
      cost: result.cost,
      charged: true,
      persisted: true,
      source: "live",
      slot0Guarantee: `${slot0Rarity} (≥Uncommon) ✓`,
      packNumber: packOpenCount,
      totalCards: result.cards.length,
    });
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("cards/open-pack error:", e);
    return NextResponse.json({ error: "Pack opening failed" }, { status: 500 });
  } finally {
    client.release();
  }
}
