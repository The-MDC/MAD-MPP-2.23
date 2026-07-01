/**
 * GET /api/v1/feeds — LIVE RSS aggregation (real feeds, no key).
 * Source list per HANDOFF_MAD_GAMBIT.md §5.
 */
import { NextResponse } from "next/server";
import { fetchAllFeeds } from "@/lib/rss-feeds";

export const revalidate = 300;

export async function GET() {
  const items = await fetchAllFeeds();
  return NextResponse.json({ success: true, count: items.length, items });
}
