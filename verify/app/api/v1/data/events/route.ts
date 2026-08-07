import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/session";
import { enforceRateLimit } from "@/lib/rate-limit";
import { emitEvent, queryEvents } from "@/lib/data-platform/events";
import { upsertProfileFromEvent } from "@/lib/data-platform/cdp";
import type { PlatformEvent } from "@/lib/data-platform/types";
import { hasDatabaseUrl } from "@/lib/database-url";

/**
 * POST /api/v1/data/events  — append one event to the stream (rate-limited).
 * GET  /api/v1/data/events?since=<id>&type=&limit=  — cursor tail (auth required).
 */
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "data-events", 120, 60_000);
  if (limited) return limited;
  if (!hasDatabaseUrl())
    return NextResponse.json({ success: false, error: "DATABASE_URL not set" }, { status: 503 });

  const body = await req.json().catch(() => ({}));
  const eventType = typeof body?.eventType === "string" ? body.eventType.slice(0, 80) : "";
  if (!eventType)
    return NextResponse.json({ success: false, error: "eventType required" }, { status: 400 });

  const session = getSessionFromRequest(req);
  const event: PlatformEvent = {
    eventType,
    walletAddress:
      session?.address ?? (typeof body?.walletAddress === "string" ? body.walletAddress : null),
    sessionId: typeof body?.sessionId === "string" ? body.sessionId.slice(0, 100) : null,
    payload: body?.payload && typeof body.payload === "object" ? body.payload : {},
  };

  try {
    const pool = getDbPool();
    const id = await emitEvent(pool, event);
    await upsertProfileFromEvent(pool, event).catch(() => {});
    return NextResponse.json({ success: true, id });
  } catch (e) {
    console.error("data/events POST error:", e);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  if (!hasDatabaseUrl())
    return NextResponse.json({ success: false, error: "DATABASE_URL not set" }, { status: 503 });
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const sinceId = Number(url.searchParams.get("since") ?? 0);
  const type = url.searchParams.get("type") ?? undefined;
  const limit = Number(url.searchParams.get("limit") ?? 100);

  try {
    const events = await queryEvents(getDbPool(), { sinceId, type, limit });
    const cursor = events.length ? events[events.length - 1].id : sinceId;
    return NextResponse.json({ success: true, events, cursor });
  } catch (e) {
    console.error("data/events GET error:", e);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
