import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";

interface AuditEntry {
  id: number;
  entityType: string;
  entityId: string;
  action: string;
  details: Record<string, unknown>;
  wallet: string | null;
  createdAt: string;
}

/**
 * GET /api/v1/audit?limit= — recent platform decision/action ledger from
 * audit_log (market creates, bets, resolutions, …). This is the real,
 * stack-native basis for the activity timeline (the honest nuance of a
 * "reflexion" cycle view). Demo-empty without the DB.
 */
export async function GET(req: Request) {
  const limit = Math.max(1, Math.min(100, Math.floor(Number(new URL(req.url).searchParams.get("limit")) || 20)));
  const empty: AuditEntry[] = [];
  if (!hasDatabaseUrl()) {
    return NextResponse.json({ success: true, entries: empty, source: "demo" });
  }
  try {
    const pool = getDbPool();
    const res = await pool.query(
      `SELECT id, entity_type, entity_id, action, details, wallet_address, created_at
       FROM audit_log ORDER BY created_at DESC LIMIT $1`,
      [limit],
    );
    const entries: AuditEntry[] = res.rows.map((r) => ({
      id: Number(r.id),
      entityType: r.entity_type,
      entityId: r.entity_id,
      action: r.action,
      details: (r.details as Record<string, unknown>) ?? {},
      wallet: r.wallet_address,
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    }));
    return NextResponse.json({ success: true, entries, source: "live" });
  } catch (e) {
    console.error("audit error:", e);
    return NextResponse.json({ success: true, entries: empty, source: "demo" });
  }
}
