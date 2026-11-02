import { NextResponse } from "next/server";
import { dbQuery, isDenied, requireAdmin } from "@/lib/admin-guard";
import { audit } from "@/lib/admin-store";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import { buildWeekly, loadSkills } from "@/lib/insights-run";
import { proficiency } from "@/lib/insights";
import { enforceRateLimit } from "@/lib/rate-limit";

const noStore = { "cache-control": "no-store" };

/** GET /api/admin/insights — this week's recommendations, anomalies and the skill ledger (no model call). */
export async function GET(req: Request) {
  const s = await requireAdmin(req, "reports:read");
  if (isDenied(s)) return s;
  const q = dbQuery();
  const [report, skills] = await Promise.all([buildWeekly(q, new Date(), async () => null), loadSkills(q)]);
  return NextResponse.json({
    success: true,
    recommendations: (report.tables[0]?.rows ?? []).map((r) => ({ text: String(r[1]), priority: Number(r[2]), rule: String(r[3]) })),
    anomalies: report.tables[1]?.rows ?? [],
    skills: skills.map((k) => ({ ...k, proficiency: proficiency(k) })),
    daysOfHistory: Number(report.summary[0]?.[1] ?? 0),
  }, { headers: noStore });
}

/**
 * POST /api/admin/insights — teach the engine.
 *   { action: "feedback", rule, verdict: "useful" | "dismiss" }   re-weights that recommendation rule
 *   { action: "skill", id, decision: "approve" | "retire" | "hit" | "miss" }   approve a proposed skill, retire one, or score a flag
 */
export async function POST(req: Request) {
  const s = await requireAdmin(req, "reports:export");
  if (isDenied(s)) return s;
  const limited = enforceRateLimit(req, "admin-insights", 60, 60_000);
  if (limited) return limited;
  if (!hasDatabaseUrl()) return NextResponse.json({ success: false, error: "No database is configured." }, { status: 503 });

  let body: { action?: unknown; rule?: unknown; verdict?: unknown; id?: unknown; decision?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 }); }
  const pool = getDbPool();
  try {
    if (body.action === "feedback") {
      const rule = typeof body.rule === "string" && /^[a-z0-9-]{1,40}$/.test(body.rule) ? body.rule : null;
      if (!rule || (body.verdict !== "useful" && body.verdict !== "dismiss")) return NextResponse.json({ success: false, error: "Bad feedback." }, { status: 400 });
      const col = body.verdict === "useful" ? "useful" : "dismissed";
      await pool.query(`INSERT INTO insight_feedback (rule, ${col}) VALUES ($1, 1) ON CONFLICT (rule) DO UPDATE SET ${col} = insight_feedback.${col} + 1`, [rule]);
      await audit(pool, s.sub, "insight-feedback", `${rule}: ${body.verdict}`);
      return NextResponse.json({ success: true }, { headers: noStore });
    }
    if (body.action === "skill") {
      const id = typeof body.id === "string" && /^[a-z]+:[\w:.\-]{1,80}$/.test(body.id) ? body.id : null;
      if (!id) return NextResponse.json({ success: false, error: "Bad skill id." }, { status: 400 });
      const d = body.decision;
      const sql =
        d === "approve" ? `UPDATE insight_skills SET status = 'active', updated_at = now() WHERE id = $1 AND status = 'proposed'`
        : d === "retire" ? `UPDATE insight_skills SET status = 'retired', updated_at = now() WHERE id = $1`
        : d === "hit" ? `UPDATE insight_skills SET hits = hits + 1, uses = uses + 1, updated_at = now() WHERE id = $1`
        : d === "miss" ? `UPDATE insight_skills SET misses = misses + 1, uses = uses + 1, updated_at = now() WHERE id = $1`
        : null;
      if (!sql) return NextResponse.json({ success: false, error: "Bad decision." }, { status: 400 });
      const r = await pool.query(sql, [id]);
      if (!r.rowCount) return NextResponse.json({ success: false, error: "No such skill (or not in that state)." }, { status: 404 });
      await audit(pool, s.sub, "insight-skill", `${id}: ${String(d)}`);
      return NextResponse.json({ success: true }, { headers: noStore });
    }
    return NextResponse.json({ success: false, error: "Unknown action." }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: "Could not save (has sql/0019 been applied?)." }, { status: 503 });
  }
}
