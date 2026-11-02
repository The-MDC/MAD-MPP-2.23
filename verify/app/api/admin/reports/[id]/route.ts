import { NextResponse } from "next/server";
import { buildAll, findReport } from "@/lib/admin-reports";
import { dbQuery, isDenied, requireAdmin } from "@/lib/admin-guard";
import { audit } from "@/lib/admin-store";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import { enforceRateLimit } from "@/lib/rate-limit";
import { FORMATS, parseFormat, toCsv, toMarkdown, toPdf, toText } from "@/lib/report-render";

/**
 * GET /api/admin/reports/:id?format=json|md|txt|pdf|csv[&table=N]
 * `json` is a read (reports:read); every file format is an extract (reports:export) and is written to the audit log.
 * `csv` exports one table: `table` is its zero-based index (default 0).
 */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const url = new URL(req.url);
  const format = parseFormat(url.searchParams.get("format"));
  const s = await requireAdmin(req, format === "json" ? "reports:read" : "reports:export");
  if (isDenied(s)) return s;
  const limited = enforceRateLimit(req, "admin-report", 40, 60_000);
  if (limited) return limited;

  const { id } = await ctx.params;
  const q = dbQuery();
  const report = id === "all" ? await buildAll(q) : await findReport(id)?.build(q);
  if (!report) return NextResponse.json({ success: false, error: "No such report." }, { status: 404 });

  if (format !== "json") await audit(hasDatabaseUrl() ? getDbPool() : null, s.sub, "report-export", `${id}.${format}`);
  if (format === "json") return NextResponse.json({ success: true, report }, { headers: { "cache-control": "no-store" } });

  const stamp = report.generatedAt.slice(0, 16).replace(/[-:T]/g, "");
  const name = `madgambit-${report.id}-${stamp}.${FORMATS[format].ext}`;
  let body: BodyInit;
  if (format === "md") body = toMarkdown(report);
  else if (format === "txt") body = toText(report);
  else if (format === "pdf") body = toPdf(report) as BodyInit;
  else {
    const idx = Math.max(0, Math.floor(Number(url.searchParams.get("table")) || 0));
    const table = report.tables[idx];
    if (!table) return NextResponse.json({ success: false, error: "No such table." }, { status: 404 });
    body = toCsv(table);
  }
  return new Response(body, {
    headers: {
      "content-type": FORMATS[format].mime,
      "content-disposition": `attachment; filename="${name}"`,
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
