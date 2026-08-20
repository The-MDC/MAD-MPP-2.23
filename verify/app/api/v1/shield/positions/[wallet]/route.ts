import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { listShieldPositions, type ShieldPositionRow } from "@/lib/shield";
import { hasDatabaseUrl } from "@/lib/database-url";

/**
 * GET /api/v1/shield/positions/<wallet> — a wallet's Shield positions (Part P,
 * P-3). Reads the `shield_positions` ledger. Degrades to an empty "demo"
 * response when the DB or migration is absent, so the panel always renders.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ wallet: string }> }) {
  const { wallet } = await params;
  if (!/^0x[0-9a-fA-F]{40}$/.test(wallet)) {
    return NextResponse.json({ success: false, error: "invalid wallet" }, { status: 400 });
  }

  const empty: ShieldPositionRow[] = [];
  if (!hasDatabaseUrl()) {
    return NextResponse.json({ success: true, positions: empty, source: "demo" });
  }

  try {
    const pool = getDbPool();
    const positions = await listShieldPositions(pool, wallet);
    return NextResponse.json({ success: true, positions, source: "live" });
  } catch (e) {
    console.error("shield/positions error:", e);
    return NextResponse.json({ success: true, positions: empty, source: "demo" });
  }
}
