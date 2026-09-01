import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { ingestGdelt, fetchGdeltDoc, scoreArticle } from "@/lib/gdelt-ingest";
import { hasDatabaseUrl } from "@/lib/database-url";
import { enforceRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/v1/markets/proposals/refresh — public, rate-limited counterpart to
 * /api/v1/ingest/gdelt for the "⚡ Pull fresh" button in markets-for-today-panel.tsx.
 *
 * That route is intentionally CRON_SECRET-gated for the scheduled/automated path —
 * a browser can never supply that header, so the button calling it directly always
 * 401s or 503s and silently no-ops (the click spins, then just reloads the same
 * proposals). This route does the same ingest work, protected by IP rate-limiting
 * instead of a secret, which is the appropriate guard for a public, human-triggered
 * "refresh" action rather than a trusted scheduled job. Conservative limit (5/10min)
 * since each call hits GDELT and, when configured, writes to the DB.
 */
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "proposals-refresh", 5, 10 * 60_000);
  if (limited) return limited;

  try {
    if (!hasDatabaseUrl()) {
      const articles = await fetchGdeltDoc().catch(() => []);
      const sample = articles.slice(0, 5).map((a) => scoreArticle(a.title, a.url, new Set<string>()));
      return NextResponse.json({ success: true, source: "demo", fetched: articles.length, inserted: 0, sample });
    }
    const { fetched, inserted } = await ingestGdelt(getDbPool());
    return NextResponse.json({ success: true, source: "live", fetched, inserted });
  } catch (e) {
    console.error("markets/proposals/refresh error:", e);
    return NextResponse.json({ success: false, error: "refresh failed" }, { status: 502 });
  }
}
