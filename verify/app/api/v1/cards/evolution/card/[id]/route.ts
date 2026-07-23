import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getCardStats, evolve } from "@/lib/card-evolution";

/**
 * GET /api/v1/cards/evolution/card/<id>?madconv= — a card's stats plus a live
 * evolution preview (score/level/mint-gate) at the given owner MADConv (Part V).
 * Demo-null without DATABASE_URL.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const madconv = Math.max(0, Number(new URL(req.url).searchParams.get("madconv")) || 0);

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ success: true, card: null, preview: null, source: "demo" });
  }

  try {
    const pool = getDbPool();
    const card = await getCardStats(pool, id);
    if (!card) return NextResponse.json({ success: false, error: "card not found" }, { status: 404 });
    return NextResponse.json({ success: true, card, preview: evolve(card, madconv), source: "live" });
  } catch (e) {
    console.error("card-evolution/card error:", e);
    return NextResponse.json({ success: true, card: null, preview: null, source: "demo" });
  }
}
