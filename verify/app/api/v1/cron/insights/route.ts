import { NextResponse } from "next/server";
import { poolQ } from "@/lib/admin-reports";
import { requireBearerSecret } from "@/lib/bearer-secret";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import { runDaily } from "@/lib/insights-run";

/** GET /api/v1/cron/insights — daily: record today's metrics, learn the baselines, acquire skills. Bearer CRON_SECRET. */
export async function GET(req: Request) {
  const denied = requireBearerSecret(req, "CRON_SECRET");
  if (denied) return denied;
  if (!hasDatabaseUrl()) return NextResponse.json({ success: true, skipped: "no database" });
  try {
    return NextResponse.json({ success: true, ...(await runDaily(poolQ(getDbPool()))) });
  } catch (e) {
    console.error("cron/insights error:", e);
    return NextResponse.json({ success: false, error: "insights run failed (has sql/0019 been applied?)" }, { status: 500 });
  }
}
