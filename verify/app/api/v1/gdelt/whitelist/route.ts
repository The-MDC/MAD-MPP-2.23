import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getWhitelist, addToWhitelist } from "@/lib/whitelist";

interface WhitelistBody {
  name?: unknown;
  displayName?: unknown;
}

/** GET /api/v1/gdelt/whitelist — list the celebrity whitelist (Part S). */
export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ success: true, whitelist: [], source: "demo" });
  }
  try {
    const pool = getDbPool();
    const set = await getWhitelist(pool, true);
    return NextResponse.json({ success: true, whitelist: Array.from(set).sort(), source: "live" });
  } catch (e) {
    console.error("gdelt/whitelist GET error:", e);
    return NextResponse.json({ success: true, whitelist: [], source: "demo" });
  }
}

/**
 * POST /api/v1/gdelt/whitelist — add/update a celebrity (Part S). This is the
 * serverless-native "hot reload": the write busts the in-memory cache so the
 * next read re-queries Neon — no file watcher, no eBPF, no kernel probe.
 */
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "gdelt-whitelist", 20, 60_000);
  if (limited) return limited;

  const body = (await req.json().catch(() => null)) as WhitelistBody | null;
  if (!body || typeof body.name !== "string" || body.name.trim() === "") {
    return NextResponse.json({ success: false, error: "name required" }, { status: 400 });
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { success: false, error: "whitelist unavailable (needs DATABASE_URL)" },
      { status: 503 },
    );
  }
  try {
    const pool = getDbPool();
    const name = await addToWhitelist(
      pool,
      body.name,
      typeof body.displayName === "string" ? body.displayName : undefined,
    );
    return NextResponse.json({ success: true, name });
  } catch (e) {
    console.error("gdelt/whitelist POST error:", e);
    return NextResponse.json({ success: false, error: "add failed" }, { status: 500 });
  }
}
