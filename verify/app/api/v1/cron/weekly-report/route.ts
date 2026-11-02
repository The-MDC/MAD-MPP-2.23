import { NextResponse } from "next/server";
import { poolQ } from "@/lib/admin-reports";
import { requireBearerSecret } from "@/lib/bearer-secret";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import { buildWeekly, runIntelScan } from "@/lib/insights-run";
import { sendReport } from "@/lib/mailer";
import { toMarkdown, toPdf, toText } from "@/lib/report-render";

/**
 * GET /api/v1/cron/weekly-report — Mondays: build the anomalies and recommendations report, keep it, and email it
 * (text body plus a PDF) to the owner. Bearer CRON_SECRET. Safe to re-run: one stored row per week, and a week already
 * emailed is not sent twice unless ?force=1.
 */
export async function GET(req: Request) {
  const denied = requireBearerSecret(req, "CRON_SECRET");
  if (denied) return denied;
  if (!hasDatabaseUrl()) return NextResponse.json({ success: true, skipped: "no database" });

  const force = new URL(req.url).searchParams.get("force") === "1";
  const pool = getDbPool();
  const q = poolQ(pool);
  try {
    const now = new Date();
    const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - ((now.getUTCDay() + 6) % 7)));
    const weekStart = monday.toISOString().slice(0, 10);

    const prior = await q(`SELECT email_status FROM insight_reports WHERE week_start = $1`, [weekStart]);
    if (prior[0]?.email_status === "sent" && !force) return NextResponse.json({ success: true, weekStart, skipped: "already sent" });

    // The weekly scan of the most active public sources for proven security upgrades, then the report that includes it.
    const intel = await runIntelScan(q, now);
    const report = await buildWeekly(q, now, undefined, intel);
    const status = await sendReport({
      subject: `MAD Gambit weekly: ${report.summary[1]?.[1] ?? "0"} anomalies, ${report.summary[2]?.[1] ?? "0"} recommendations`,
      text: toText(report),
      attachment: { filename: `madgambit-weekly-${weekStart}.pdf`, content: toPdf(report), type: "application/pdf" },
    });
    await q(
      `INSERT INTO insight_reports (week_start, body_md, email_status, emailed_at) VALUES ($1,$2,$3, CASE WHEN $3 = 'sent' THEN now() END)
       ON CONFLICT (week_start) DO UPDATE SET body_md = EXCLUDED.body_md, email_status = EXCLUDED.email_status, emailed_at = EXCLUDED.emailed_at`,
      [weekStart, toMarkdown(report), status],
    );
    return NextResponse.json({ success: true, weekStart, email: status });
  } catch (e) {
    console.error("cron/weekly-report error:", e);
    return NextResponse.json({ success: false, error: "weekly report failed (has sql/0019 been applied?)" }, { status: 500 });
  }
}
