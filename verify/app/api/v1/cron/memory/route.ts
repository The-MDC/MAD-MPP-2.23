import { NextResponse } from "next/server";
import { poolQ } from "@/lib/admin-reports";
import { requireBearerSecret } from "@/lib/bearer-secret";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import { purgeUserMemory } from "@/lib/concierge-memory";

/**
 * GET /api/v1/cron/memory — daily: dump user memory past 48 hours (counts logged). Bearer CRON_SECRET.
 * The weekly staff/admin/dev/VIP dump, with its log, is /api/v1/cron/memory-weekly.
 */
export async function GET(req: Request) {
  const denied = requireBearerSecret(req, "CRON_SECRET");
  if (denied) return denied;
  if (!hasDatabaseUrl()) return NextResponse.json({ success: true, skipped: "no database" });
  const q = poolQ(getDbPool());
  try {
    return NextResponse.json({ success: true, user: await purgeUserMemory(q) });
  } catch (e) {
    console.error("cron/memory error:", e);
    return NextResponse.json({ success: false, error: "memory purge failed (has sql/0023 been applied?)" }, { status: 500 });
  }
}
