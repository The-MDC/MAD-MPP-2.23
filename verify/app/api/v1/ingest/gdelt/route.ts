import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { ingestGdelt, fetchGdeltDoc, scoreArticle } from "@/lib/gdelt-ingest";
import { hasDatabaseUrl } from "@/lib/database-url";

/**
 * GET|POST /api/v1/ingest/gdelt — pull the latest celebrity chaos from GDELT DOC
 * 2.0, score it, and persist to gdelt_signals (feeding "Markets for Today").
 * Trigger from a Vercel cron (every ~30 min) or on demand.
 *
 * Degrades gracefully: with no DATABASE_URL it still fetches + scores and returns
 * a preview (persisting nothing), so the route is useful and inspectable anywhere.
 */
export const dynamic = "force-dynamic"; // a live scrape must never be cached

async function run() {
  if (!hasDatabaseUrl()) {
    const articles = await fetchGdeltDoc().catch(() => []);
    const sample = articles.slice(0, 5).map((a) => scoreArticle(a.title, a.url, new Set<string>()));
    return { success: true, source: "demo", fetched: articles.length, inserted: 0, sample };
  }
  const { fetched, inserted } = await ingestGdelt(getDbPool());
  return { success: true, source: "live", fetched, inserted };
}

export async function GET() {
  try {
    return NextResponse.json(await run());
  } catch (e) {
    console.error("ingest/gdelt error:", e);
    return NextResponse.json({ success: false, error: "ingest failed" }, { status: 502 });
  }
}

export async function POST() {
  return GET();
}
