import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/admin-guard";
import { requireBearerSecret } from "@/lib/bearer-secret";
import { getTickerFeed } from "@/lib/ticker-feed";

/**
 * GET /api/v1/cron/tickers — force the minute poll now. Bearer CRON_SECRET.
 * Vercel Cron runs sub-daily schedules only on Pro; on any plan an external scheduler (or the open tickers themselves,
 * which poll /api/v1/tickers every 60s) keeps the snapshot fresh.
 */
export async function GET(req: Request) {
  const denied = requireBearerSecret(req, "CRON_SECRET");
  if (denied) return denied;
  const snap = await getTickerFeed(dbQuery(), { force: true });
  return NextResponse.json({ success: true, at: snap.at, source: snap.source, markets: snap.markets.length, captionBy: snap.captionBy });
}
