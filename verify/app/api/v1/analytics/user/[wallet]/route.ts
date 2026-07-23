import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getProfile } from "@/lib/data-platform/cdp";
import type { UserIntelligence } from "@/lib/data-platform/types";

/** GET /api/v1/analytics/user/<wallet> — per-wallet intelligence from the CDP + daily rollups. */
export async function GET(_req: Request, { params }: { params: Promise<{ wallet: string }> }) {
  const { wallet } = await params;
  if (!/^0x[0-9a-fA-F]{40}$/.test(wallet))
    return NextResponse.json({ success: false, error: "invalid wallet" }, { status: 400 });

  const demo: UserIntelligence = {
    walletAddress: wallet.toLowerCase(),
    eventCount: 0,
    firstSeen: null,
    lastSeen: null,
    segments: [],
    daily: [],
    source: "demo",
  };
  if (!process.env.DATABASE_URL) return NextResponse.json({ success: true, intelligence: demo });

  try {
    const pool = getDbPool();
    const profile = await getProfile(pool, wallet);
    const daily = await pool.query(
      `SELECT day, events::text AS events FROM agg_user_daily
       WHERE wallet_address = $1 ORDER BY day DESC LIMIT 30`,
      [wallet.toLowerCase()],
    );

    const intelligence: UserIntelligence = {
      walletAddress: wallet.toLowerCase(),
      eventCount: profile?.eventCount ?? 0,
      firstSeen: profile?.firstSeen ?? null,
      lastSeen: profile?.lastSeen ?? null,
      segments: profile?.segments ?? [],
      daily: daily.rows.map((r) => ({
        day: r.day instanceof Date ? r.day.toISOString().slice(0, 10) : String(r.day),
        events: Number(r.events),
      })),
      source: "live",
    };
    return NextResponse.json({ success: true, intelligence });
  } catch (e) {
    console.error("analytics/user error:", e);
    return NextResponse.json({ success: true, intelligence: demo });
  }
}
