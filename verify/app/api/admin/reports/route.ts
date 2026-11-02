import { NextResponse } from "next/server";
import { REPORTS } from "@/lib/admin-reports";
import { isDenied, requireAdmin } from "@/lib/admin-guard";

/** GET /api/admin/reports — the report catalogue. */
export async function GET(req: Request) {
  const s = await requireAdmin(req, "reports:read");
  if (isDenied(s)) return s;
  return NextResponse.json(
    { success: true, reports: [...REPORTS.map((r) => ({ id: r.id, title: r.title, blurb: r.blurb })), { id: "all", title: "Full platform report", blurb: "Every report in one document." }], formats: ["json", "md", "txt", "pdf", "csv"] },
    { headers: { "cache-control": "no-store" } },
  );
}
