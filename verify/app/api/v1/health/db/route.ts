import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/lib/storage-health";

export const dynamic = "force-dynamic";

/** GET /api/v1/health/db — safe Neon/Postgres readiness signal. */
export async function GET() {
  const database = await checkDatabaseHealth();
  if (!database.configured) {
    return NextResponse.json({ ok: false, database, error: "database url not configured" }, { status: 503 });
  }
  if (!database.available) {
    return NextResponse.json({ ok: false, database, error: "database check failed" }, { status: 503 });
  }
  return NextResponse.json({ ok: true, database });
}
