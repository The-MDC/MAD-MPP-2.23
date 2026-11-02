import { NextResponse } from "next/server";
import { poolQ } from "@/lib/admin-reports";
import { requireBearerSecret } from "@/lib/bearer-secret";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import { runDailyLog, yesterday } from "@/lib/information-market/daily-log";

/**
 * GET /api/v1/cron/daily-log[?day=YYYY-MM-DD] — the concierge's daily log run for the information market (default:
 * yesterday, UTC): logs/platform/<day>.jsonl, logs/users/<day>.jsonl and the warehouse load. Bearer CRON_SECRET.
 */
export async function GET(req: Request) {
  const denied = requireBearerSecret(req, "CRON_SECRET");
  if (denied) return denied;
  if (!hasDatabaseUrl()) return NextResponse.json({ success: true, skipped: "no database" });
  const want = new URL(req.url).searchParams.get("day");
  const day = want && /^\d{4}-\d{2}-\d{2}$/.test(want) && Date.parse(want) < Date.now() ? want : yesterday();
  try {
    return NextResponse.json({ success: true, ...(await runDailyLog(poolQ(getDbPool()), day)) });
  } catch (e) {
    console.error("cron/daily-log error:", e);
    return NextResponse.json({ success: false, error: "daily log failed (has sql/0024 been applied?)" }, { status: 500 });
  }
}
