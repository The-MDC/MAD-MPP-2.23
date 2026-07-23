import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getMarket } from "@/lib/markets";

/** GET /api/v1/markets/<id> — a single prediction market (Part W). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ success: true, market: null, source: "demo" });
  }
  try {
    const pool = getDbPool();
    const market = await getMarket(pool, id);
    if (!market) return NextResponse.json({ success: false, error: "market not found" }, { status: 404 });
    return NextResponse.json({ success: true, market, source: "live" });
  } catch (e) {
    console.error("markets/[id] error:", e);
    return NextResponse.json({ success: true, market: null, source: "demo" });
  }
}
