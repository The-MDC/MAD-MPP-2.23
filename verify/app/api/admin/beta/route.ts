import { NextResponse } from "next/server";
import { dbQuery, isDenied, requireAdmin } from "@/lib/admin-guard";
import { audit } from "@/lib/admin-store";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import { enforceRateLimit } from "@/lib/rate-limit";
import { cleanInput } from "@/lib/agent-defense";
import { betaCapacity, betaPhase, hashCode, newInviteCode, PHASE_COPY } from "@/lib/support/beta";
import { knownIssues } from "@/lib/support/store";

const noStore = { "cache-control": "no-store" };

/** GET /api/admin/beta — phase, capacity, waitlist and admission counts, outstanding invites by cohort, known issues. */
export async function GET(req: Request) {
  const s = await requireAdmin(req, "beta:manage");
  if (isDenied(s)) return s;
  const phase = betaPhase();
  const base = { success: true, phase, phaseName: PHASE_COPY[phase].name, capacity: betaCapacity(), invitesDisabled: process.env.BETA_INVITES_DISABLED === "1" };
  if (!hasDatabaseUrl()) return NextResponse.json({ ...base, counts: null, cohorts: [], issues: [] }, { headers: noStore });
  const q = dbQuery();
  try {
    const [counts, cohorts, issues] = await Promise.all([
      q(`SELECT count(*)::int AS waitlist, count(*) FILTER (WHERE invited_at IS NOT NULL)::int AS invited, count(*) FILTER (WHERE admitted_at IS NOT NULL)::int AS admitted,
                count(*) FILTER (WHERE role = 'creator' AND invited_at IS NULL)::int AS creators_waiting FROM beta_signups`),
      q(`SELECT cohort, count(*)::int AS codes, sum(uses_left)::int AS uses_left FROM beta_invites WHERE expires_at > now() GROUP BY cohort ORDER BY cohort`),
      knownIssues(q, true),
    ]);
    return NextResponse.json({ ...base, counts: counts[0] ?? null, cohorts, issues }, { headers: noStore });
  } catch {
    return NextResponse.json({ ...base, counts: null, cohorts: [], issues: [], error: "Has sql/0022 been applied?" }, { headers: noStore });
  }
}

/**
 * POST /api/admin/beta — beta programme actions.
 *   { action: "invites", count, cohort, uses?, days? }   new codes (plaintext returned ONCE, stored hashed)
 *   { action: "wave", count, cohort, creatorsFirst? }     invite the next N from the waitlist: returns email + code pairs to send
 *   { action: "issue", title, status?, note? }            add a known issue
 *   { action: "issue-update", id, status, note? }         update one
 */
export async function POST(req: Request) {
  const s = await requireAdmin(req, "beta:manage");
  if (isDenied(s)) return s;
  const limited = enforceRateLimit(req, "admin-beta", 30, 60_000);
  if (limited) return limited;
  if (!hasDatabaseUrl()) return NextResponse.json({ success: false, error: "No database is configured." }, { status: 503 });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const pool = getDbPool();
  const cohort = typeof body?.cohort === "string" ? body.cohort.replace(/[^\w-]/g, "").slice(0, 24) || "wave-1" : "wave-1";
  const count = Math.max(1, Math.min(500, Math.floor(Number(body?.count) || 1)));
  const days = Math.max(1, Math.min(60, Math.floor(Number(body?.days) || 14)));
  try {
    if (body?.action === "invites") {
      const uses = Math.max(1, Math.min(100, Math.floor(Number(body?.uses) || 1)));
      const codes: string[] = [];
      for (let i = 0; i < count; i++) {
        const code = newInviteCode();
        await pool.query(`INSERT INTO beta_invites (code_hash, cohort, uses_left, expires_at, created_by) VALUES ($1,$2,$3, now() + make_interval(days => $4), $5)`, [hashCode(code), cohort, uses, days, s.sub]);
        codes.push(code);
      }
      await audit(pool, s.sub, "beta-invites", `${count} x ${uses}-use in ${cohort}`);
      return NextResponse.json({ success: true, codes, cohort, expiresInDays: days }, { headers: noStore });
    }
    if (body?.action === "wave") {
      const order = body?.creatorsFirst === false ? "created_at" : "(role = 'creator') DESC, created_at";
      const rows = await pool.query(`SELECT id, email FROM beta_signups WHERE invited_at IS NULL AND admitted_at IS NULL ORDER BY ${order} LIMIT $1`, [count]);
      const out: { email: string; code: string }[] = [];
      for (const r of rows.rows) {
        const code = newInviteCode();
        await pool.query(`INSERT INTO beta_invites (code_hash, cohort, uses_left, expires_at, created_by) VALUES ($1,$2,1, now() + make_interval(days => $3), $4)`, [hashCode(code), cohort, days, s.sub]);
        await pool.query(`UPDATE beta_signups SET invited_at = now(), cohort = $2 WHERE id = $1`, [r.id, cohort]);
        out.push({ email: String(r.email), code });
      }
      await audit(pool, s.sub, "beta-wave", `${out.length} invited in ${cohort}`);
      return NextResponse.json({ success: true, cohort, invited: out }, { headers: noStore });
    }
    if (body?.action === "issue") {
      const title = cleanInput(body?.title, 160);
      if (!title) return NextResponse.json({ success: false, error: "A title is required." }, { status: 400 });
      await pool.query(`INSERT INTO beta_known_issues (title, status, public_note) VALUES ($1, $2, $3)`, [title, ["investigating", "identified", "fixing", "fixed"].includes(String(body?.status)) ? body!.status : "investigating", body?.note ? cleanInput(body.note, 400) : null]);
      await audit(pool, s.sub, "known-issue", title);
      return NextResponse.json({ success: true }, { headers: noStore });
    }
    if (body?.action === "issue-update") {
      const id = Number(body?.id);
      if (!Number.isInteger(id) || !["investigating", "identified", "fixing", "fixed"].includes(String(body?.status))) return NextResponse.json({ success: false, error: "id and a valid status are required." }, { status: 400 });
      await pool.query(`UPDATE beta_known_issues SET status = $2, public_note = coalesce($3, public_note), updated_at = now() WHERE id = $1`, [id, body!.status, body?.note ? cleanInput(body.note, 400) : null]);
      await audit(pool, s.sub, "known-issue-update", `#${id} ${String(body!.status)}`);
      return NextResponse.json({ success: true }, { headers: noStore });
    }
    return NextResponse.json({ success: false, error: "Unknown action." }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: "Could not complete that (has sql/0022 been applied?)." }, { status: 503 });
  }
}
