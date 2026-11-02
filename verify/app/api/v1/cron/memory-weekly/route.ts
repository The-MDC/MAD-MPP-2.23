import { NextResponse } from "next/server";
import { poolQ } from "@/lib/admin-reports";
import { requireBearerSecret } from "@/lib/bearer-secret";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import { purgePrivilegedMemory } from "@/lib/concierge-memory";

/** GET /api/v1/cron/memory-weekly — Mondays: log, then dump, staff/admin/dev/VIP memory past 7 days. Bearer CRON_SECRET. */
export async function GET(req: Request) {
  const denied = requireBearerSecret(req, "CRON_SECRET");
  if (denied) return denied;
  if (!hasDatabaseUrl()) return NextResponse.json({ success: true, skipped: "no database" });
  try {
    return NextResponse.json({ success: true, weekly: await purgePrivilegedMemory(poolQ(getDbPool())) });
  } catch (e) {
    console.error("cron/memory-weekly error:", e);
    return NextResponse.json({ success: false, error: "weekly memory purge failed (has sql/0023 been applied?)" }, { status: 500 });
  }
}
