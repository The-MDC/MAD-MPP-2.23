import { NextResponse } from "next/server";
import { dbQuery, isDenied, requireAdmin } from "@/lib/admin-guard";
import { audit } from "@/lib/admin-store";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import { enforceRateLimit } from "@/lib/rate-limit";
import { runDailyLog, yesterday } from "@/lib/information-market/daily-log";

const noStore = { "cache-control": "no-store" };

/**
 * GET /api/admin/logs — the information market's daily log files (folders: platform, users).
 *   ?folder=platform|users&day=YYYY-MM-DD   download one file (.jsonl), audited
 */
export async function GET(req: Request) {
  const s = await requireAdmin(req, "reports:export");
  if (isDenied(s)) return s;
  if (!hasDatabaseUrl()) return NextResponse.json({ success: true, files: [], source: "demo" }, { headers: noStore });
  const p = new URL(req.url).searchParams;
  const folder = p.get("folder"), day = p.get("day");
  const q = dbQuery();
  try {
    if ((folder === "platform" || folder === "users") && day && /^\d{4}-\d{2}-\d{2}$/.test(day)) {
      const r = await q(`SELECT path, body FROM im_log_files WHERE folder = $1 AND day = $2`, [folder, day]);
      if (!r[0]) return NextResponse.json({ success: false, error: "No such log." }, { status: 404 });
      await audit(getDbPool(), s.sub, "log-download", String(r[0].path));
      return new Response(String(r[0].body), { headers: { "content-type": "application/x-ndjson; charset=utf-8", "content-disposition": `attachment; filename="madgambit-${folder}-${day}.jsonl"`, ...noStore } });
    }
    const files = await q(`SELECT folder, day::text AS day, path, records, bytes, sha256, initiated_by, created_at FROM im_log_files ORDER BY day DESC, folder LIMIT 120`);
    return NextResponse.json({ success: true, files }, { headers: noStore });
  } catch {
    return NextResponse.json({ success: false, error: "Could not read the logs (has sql/0024 been applied?)." }, { status: 503 });
  }
}

/** POST /api/admin/logs — { day? } run (or re-run) a day's log now. Master and admins only. */
export async function POST(req: Request) {
  const s = await requireAdmin(req, "beta:manage");
  if (isDenied(s)) return s;
  const limited = enforceRateLimit(req, "admin-logs-run", 6, 60_000);
  if (limited) return limited;
  if (!hasDatabaseUrl()) return NextResponse.json({ success: false, error: "No database is configured." }, { status: 503 });
  const body = (await req.json().catch(() => ({}))) as { day?: unknown };
  const day = typeof body.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.day) && Date.parse(body.day) < Date.now() ? body.day : yesterday();
  try {
    const out = await runDailyLog(dbQuery(), day);
    await audit(getDbPool(), s.sub, "log-run", day);
    return NextResponse.json({ success: true, ...out }, { headers: noStore });
  } catch {
    return NextResponse.json({ success: false, error: "The log run failed (has sql/0024 been applied?)." }, { status: 503 });
  }
}
