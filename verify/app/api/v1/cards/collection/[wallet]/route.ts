import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { listCards, type CardRow } from "@/lib/cards";

/**
 * GET /api/v1/cards/collection/<wallet> — a wallet's owned cards (Part Q).
 * Reads the `cards` ledger. Degrades to an empty "demo" response when the DB or
 * migration is absent, so the collection panel always renders.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ wallet: string }> }) {
  const { wallet } = await params;
  if (!/^0x[0-9a-fA-F]{40}$/.test(wallet)) {
    return NextResponse.json({ success: false, error: "invalid wallet" }, { status: 400 });
  }

  const empty: CardRow[] = [];
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ success: true, cards: empty, source: "demo" });
  }

  try {
    const pool = getDbPool();
    const cards = await listCards(pool, wallet);
    return NextResponse.json({ success: true, cards, source: "live" });
  } catch (e) {
    console.error("cards/collection error:", e);
    return NextResponse.json({ success: true, cards: empty, source: "demo" });
  }
}
