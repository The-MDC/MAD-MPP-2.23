import { NextResponse } from "next/server";
import { dbQuery, isDenied, requireAdmin } from "@/lib/admin-guard";
import { audit } from "@/lib/admin-store";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import { enforceRateLimit } from "@/lib/rate-limit";
import { listFlags } from "@/lib/account-flags";

const noStore = { "cache-control": "no-store" };

/** GET /api/admin/flags[?status=open|reviewed|dismissed|all] — passive account flags for review (developers and admins). */
export async function GET(req: Request) {
  const s = await requireAdmin(req, "support:dev");
  if (isDenied(s)) return s;
  if (!hasDatabaseUrl()) return NextResponse.json({ success: true, flags: [] }, { headers: noStore });
  const st = new URL(req.url).searchParams.get("status");
  try {
    return NextResponse.json({ success: true, flags: await listFlags(dbQuery(), st === "all" ? null : st && ["open", "reviewed", "dismissed"].includes(st) ? st : "open") }, { headers: noStore });
  } catch {
    return NextResponse.json({ success: false, error: "Could not read flags (has sql/0025 been applied?)." }, { status: 503 });
  }
}

/** PATCH /api/admin/flags — { id, status: "reviewed" | "dismissed" | "open" }, or { sha256, reason } to blocklist a file hash. */
export async function PATCH(req: Request) {
  const s = await requireAdmin(req, "support:dev");
  if (isDenied(s)) return s;
  const limited = enforceRateLimit(req, "admin-flags", 60, 60_000);
  if (limited) return limited;
  if (!hasDatabaseUrl()) return NextResponse.json({ success: false, error: "No database is configured." }, { status: 503 });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const pool = getDbPool();
  try {
    if (typeof body?.sha256 === "string") {
      if (!/^[a-f0-9]{64}$/.test(body.sha256)) return NextResponse.json({ success: false, error: "A SHA-256 is 64 hex characters." }, { status: 400 });
      await pool.query(`INSERT INTO file_hash_blocklist (sha256, reason, added_by) VALUES ($1,$2,$3) ON CONFLICT (sha256) DO NOTHING`, [body.sha256, String(body.reason ?? "blocked by staff").slice(0, 200), s.sub]);
      await audit(pool, s.sub, "file-blocklist", body.sha256.slice(0, 16));
      return NextResponse.json({ success: true }, { headers: noStore });
    }
    const id = Number(body?.id);
    if (!Number.isInteger(id) || !["open", "reviewed", "dismissed"].includes(String(body?.status))) return NextResponse.json({ success: false, error: "id and a valid status are required." }, { status: 400 });
    await pool.query(`UPDATE account_flags SET status = $2 WHERE id = $1`, [id, body!.status]);
    await audit(pool, s.sub, "flag-update", `#${id} ${String(body!.status)}`);
    return NextResponse.json({ success: true }, { headers: noStore });
  } catch {
    return NextResponse.json({ success: false, error: "Could not update." }, { status: 503 });
  }
}
