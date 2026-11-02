import { NextResponse } from "next/server";
import { poolQ } from "@/lib/admin-reports";
import { requireBearerSecret } from "@/lib/bearer-secret";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import { purgeUserMemory } from "@/lib/concierge-memory";
import { purgeExpiredFiles } from "@/lib/file-shield/store";
import { del, list } from "@vercel/blob";

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
    const user = await purgeUserMemory(q);
    const files = await purgeExpiredFiles(q);
    // Anything still in the upload quarantine after an hour was never scanned (an abandoned upload): remove it.
    let quarantine = 0;
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { blobs } = await list({ prefix: "chat-quarantine/", limit: 1000 });
        const stale = blobs.filter((b) => Date.now() - new Date(b.uploadedAt).getTime() > 3600_000).map((b) => b.url);
        if (stale.length) await del(stale);
        quarantine = stale.length;
      } catch { quarantine = -1; }
    }
    return NextResponse.json({ success: true, user, files, quarantine });
  } catch (e) {
    console.error("cron/memory error:", e);
    return NextResponse.json({ success: false, error: "memory purge failed (has sql/0023 been applied?)" }, { status: 500 });
  }
}
