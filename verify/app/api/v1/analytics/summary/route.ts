import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import type { PlatformSummary } from "@/lib/data-platform/types";
import { hasDatabaseUrl } from "@/lib/database-url";

const DEMO: PlatformSummary = {
  windowHours: 24,
  totalEvents: 0,
  uniqueWallets: 0,
  byType: {},
  hourly: [],
  source: "demo",
};

/**
 * GET /api/v1/analytics/summary — platform KPIs over the last 24h, read
 * straight from events_stream. Degrades to an empty "demo" summary when the DB
 * or the migration isn't present, so the dashboard always renders.
 */
export async function GET() {
  if (!hasDatabaseUrl()) return NextResponse.json({ success: true, summary: DEMO });

  try {
    const pool = getDbPool();
    const [totals, types, hours] = await Promise.all([
      pool.query(
        `SELECT count(*)::text AS total, count(DISTINCT wallet_address)::text AS wallets
         FROM events_stream WHERE created_at > now() - interval '24 hours'`,
      ),
      pool.query(
        `SELECT event_type, count(*)::text AS cnt
         FROM events_stream WHERE created_at > now() - interval '24 hours'
         GROUP BY event_type ORDER BY count(*) DESC LIMIT 12`,
      ),
      pool.query(
        `SELECT date_trunc('hour', created_at) AS bucket, count(*)::text AS events
         FROM events_stream WHERE created_at > now() - interval '24 hours'
         GROUP BY 1 ORDER BY 1 ASC`,
      ),
    ]);

    const byType: Record<string, number> = {};
    for (const r of types.rows) byType[r.event_type] = Number(r.cnt);

    const hourly = hours.rows.map((r) => ({
      bucket: r.bucket instanceof Date ? r.bucket.toISOString() : String(r.bucket),
      events: Number(r.events),
    }));

    const summary: PlatformSummary = {
      windowHours: 24,
      totalEvents: Number(totals.rows[0]?.total ?? 0),
      uniqueWallets: Number(totals.rows[0]?.wallets ?? 0),
      byType,
      hourly,
      source: "live",
    };
    return NextResponse.json({ success: true, summary });
  } catch (e) {
    console.error("analytics/summary error:", e);
    return NextResponse.json({ success: true, summary: DEMO });
  }
}
