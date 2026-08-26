import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { withRouteGuard } from "@/lib/with-route-guard";
import { RARITY_DROP_WEIGHTS, type Rarity } from "@/lib/gambit-game-math";
import { insertCard } from "@/lib/cards";
import { hasDatabaseUrl } from "@/lib/database-url";

interface CollectBody {
  cardUid?: unknown;
  name?: unknown;
  rarity?: unknown;
  faction?: unknown;
  serial?: unknown;
  durability?: unknown;
  evolutionStage?: unknown;
  xp?: unknown;
  earnsCount?: unknown;
}

/**
 * Cross-checked against the maths engine, and the two lists are NOT the same.
 *
 * This validated against `RARITY_ORDER`, which enumerates every rarity that
 * EXISTS — including **Mythic**. gambit-game-math is explicit that Mythic is
 * out of scope for packs:
 *
 *     // Note: Mythic (1-of-1) is never in packs — only obtainable via
 *     // special events
 *
 * and RARITY_TABLE gives it powerScore 99999, cloutMultiplier 99.9, stakingApy
 * 88. So the single most valuable card class in the game — one the pack engine
 * can never roll — was accepted from a request body.
 *
 * `RARITY_DROP_WEIGHTS` is the engine's authority on what a pack can actually
 * produce (Common 56.8% … Legendary 1%, Golden Hand 0.6%), so it is the correct
 * list to validate against. Deriving the check from the weights table rather
 * than restating its keys means a change to the drop table cannot leave this
 * validator behind.
 */
const PACK_OBTAINABLE = Object.keys(RARITY_DROP_WEIGHTS) as readonly string[];

function isRarity(v: unknown): v is Rarity {
  return typeof v === "string" && PACK_OBTAINABLE.includes(v);
}

/**
 * POST /api/v1/cards/collect — persist a collected card to the CALLER'S ledger
 * (Part Q). Pack generation happens in /api/v1/cards/open-pack; this stores the
 * result so a card enters the owned collection (own → wear → evolve). No token
 * value moves — the on-chain mint (MadhatCard / MAD Card) is Phase-3 gated.
 * Degrades to a non-persisted echo without DATABASE_URL.
 *
 * ── This route used to be unauthenticated, and that was the whole economy ──
 * It previously read `walletAddress` AND `rarity` from the request body behind
 * nothing but a 30/min/IP rate limit, validating only that the wallet LOOKED
 * like an address. So any anonymous caller could POST a Legendary into any
 * wallet — their own or someone else's — as fast as the limiter allowed.
 *
 * The paid path, /api/v1/cards/open-pack, has always authenticated and charged
 * the ledger. Both write the `cards` table. A guarded door and an open door
 * onto the same room is not a smaller problem than no door: openCardPack()'s
 * weighted-rarity engine, pack pricing and the 992-card deck were all
 * bypassable by one request.
 *
 * The wallet now comes from the session and CANNOT be supplied by the caller —
 * that is the fix, not the rate limit. A rate limit governs how fast an
 * anonymous caller acts; it never establishes who they are.
 */
export const POST = withRouteGuard(
  { mode: "session", bucket: "cards-collect", limit: 30, windowMs: 60_000 },
  async (req, { owner }) => {
  const body = (await req.json().catch(() => null)) as CollectBody | null;
  if (!body) return NextResponse.json({ success: false, error: "invalid JSON" }, { status: 400 });

  // Session-derived, never body-derived. `owner` is the verified SIWE address,
  // already lowercased by the guard.
  const wallet = owner;
  if (!isRarity(body.rarity)) {
    return NextResponse.json({ success: false, error: "invalid rarity" }, { status: 400 });
  }

  const card = {
    walletAddress: wallet,
    cardUid: typeof body.cardUid === "string" && body.cardUid ? body.cardUid : `card_${Date.now()}`,
    name: typeof body.name === "string" ? body.name : "",
    rarity: body.rarity,
    faction: typeof body.faction === "string" ? body.faction : "",
    serial: Number.isFinite(Number(body.serial)) ? Math.max(0, Math.floor(Number(body.serial))) : 0,
    durability: body.durability == null ? 1 : Math.min(1, Math.max(0, Number(body.durability) || 0)),
    evolutionStage: Math.min(3, Math.max(1, Math.floor(Number(body.evolutionStage) || 1))),
    xp: Math.max(0, Math.floor(Number(body.xp) || 0)),
    earnsCount: Math.max(0, Number(body.earnsCount) || 0),
  };

  if (!hasDatabaseUrl()) {
    return NextResponse.json({ success: true, persisted: false, card });
  }

  try {
    const pool = getDbPool();
    const row = await insertCard(pool, card);
    return NextResponse.json({ success: true, persisted: true, card: row });
  } catch (e) {
    console.error("cards/collect error:", e);
    // 500, not `success: true`. The previous form returned success with
    // persisted:false on a thrown insert, which is indistinguishable from the
    // deliberate no-DATABASE_URL echo above — so a real write failure reached
    // the client as a success and the card silently did not exist. A database
    // that answered with an error is not the same as a database that was never
    // configured, and the response must not claim it is.
    return NextResponse.json(
      { success: false, persisted: false, error: "could not persist card" },
      { status: 500 },
    );
  }
  },
);
