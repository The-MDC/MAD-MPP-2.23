/**
 * GET /api/v1/feeds — LIVE RSS aggregation (real feeds, no key).
 * Source list is defined in lib/rss-feeds.ts.
 */
import { NextResponse } from "next/server";
import { fetchAllFeeds } from "@/lib/rss-feeds";

export const revalidate = 300;

export async function GET() {
  const items = await fetchAllFeeds();
  return NextResponse.json({ success: true, count: items.length, items });
}
