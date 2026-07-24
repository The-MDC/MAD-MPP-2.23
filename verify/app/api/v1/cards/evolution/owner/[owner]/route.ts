import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { listCardStatsByOwner, type CardStats } from "@/lib/card-evolution";

/**
 * GET /api/v1/cards/evolution/owner/<owner> — a wallet/user's living-card
 * collection with evolution progress (Part V). Demo-empty without DATABASE_URL.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ owner: string }> }) {
  const { owner } = await params;
  if (!owner || owner.trim() === "") {
    return NextResponse.json({ success: false, error: "owner required" }, { status: 400 });
  }

  const empty: CardStats[] = [];
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ success: true, cards: empty, source: "demo" });
  }

  try {
    const pool = getDbPool();
    const cards = await listCardStatsByOwner(pool, decodeURIComponent(owner));
    return NextResponse.json({ success: true, cards, source: "live" });
  } catch (e) {
    console.error("card-evolution/owner error:", e);
    return NextResponse.json({ success: true, cards: empty, source: "demo" });
  }
}
