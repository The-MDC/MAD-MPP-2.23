import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";

export const dynamic = "force-dynamic";

/** GET /api/v1/health/db — verify the configured Neon/Postgres backend. */
export async function GET() {
  if (!hasDatabaseUrl()) {
    return NextResponse.json(
      { ok: false, error: "database url not configured" },
      { status: 503 },
    );
  }

  const started = performance.now();
  try {
    await getDbPool().query("SELECT 1");
    return NextResponse.json({ ok: true, latencyMs: Math.round(performance.now() - started) });
  } catch (error) {
    console.error("health/db error:", error);
    return NextResponse.json(
      { ok: false, latencyMs: Math.round(performance.now() - started), error: "database check failed" },
      { status: 503 },
    );
  }
}
