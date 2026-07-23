import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import { RARITY_ORDER, type Rarity } from "@/lib/gambit-game-math";
import { insertCard } from "@/lib/cards";

interface CollectBody {
  walletAddress?: unknown;
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

function isRarity(v: unknown): v is Rarity {
  return typeof v === "string" && (RARITY_ORDER as string[]).includes(v);
}

/**
 * POST /api/v1/cards/collect — persist a collected card to a wallet's ledger
 * (Part Q). Pack generation happens in /api/v1/cards/open-pack; this stores the
 * result so a card enters the owned collection (own → wear → evolve). No token
 * value moves — the on-chain mint (MadhatCard / MAD Card) is Phase-3 gated.
 * Degrades to a non-persisted echo without DATABASE_URL.
 */
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "cards-collect", 30, 60_000);
  if (limited) return limited;

  const body = (await req.json().catch(() => null)) as CollectBody | null;
  if (!body) return NextResponse.json({ success: false, error: "invalid JSON" }, { status: 400 });

  const wallet = String(body.walletAddress ?? "");
  if (!/^0x[0-9a-fA-F]{40}$/.test(wallet)) {
    return NextResponse.json({ success: false, error: "invalid wallet" }, { status: 400 });
  }
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

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ success: true, persisted: false, card });
  }

  try {
    const pool = getDbPool();
    const row = await insertCard(pool, card);
    return NextResponse.json({ success: true, persisted: true, card: row });
  } catch (e) {
    console.error("cards/collect error:", e);
    return NextResponse.json({ success: true, persisted: false, card });
  }
}
