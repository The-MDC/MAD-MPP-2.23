import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/admin-guard";
import { getTickerFeed } from "@/lib/ticker-feed";

/**
 * GET /api/v1/tickers — the once-a-minute analytics + markets snapshot with the MoE's wire caption.
 * Aggregates only (no wallets, no emails), cached per instance for 60 seconds. Tickers and market cards poll this.
 */
export async function GET() {
  const snap = await getTickerFeed(dbQuery());
  return NextResponse.json({ success: true, ...snap }, { headers: { "cache-control": "public, max-age=30, s-maxage=30, stale-while-revalidate=60" } });
}
