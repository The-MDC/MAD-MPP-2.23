import { NextResponse } from "next/server";
import { isDenied, requireAdmin } from "@/lib/admin-guard";
import { recentAudit } from "@/lib/admin-store";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";

/** GET /api/admin/audit — the last admin actions (master only). */
export async function GET(req: Request) {
  const s = await requireAdmin(req, "audit:read");
  if (isDenied(s)) return s;
  if (!hasDatabaseUrl()) return NextResponse.json({ success: true, entries: [], source: "demo" }, { headers: { "cache-control": "no-store" } });
  try {
    return NextResponse.json({ success: true, entries: await recentAudit(getDbPool(), 100), source: "live" }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ success: true, entries: [], source: "demo" }, { headers: { "cache-control": "no-store" } });
  }
}
