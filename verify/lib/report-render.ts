/**
 * Reporting suite — one report model, three renderers: Markdown, plain text and PDF (plus CSV for a single table).
 * No dependencies. The PDF writer is deliberately small (A4, monospace, paginated, Latin-1): enough for a clean,
 * archivable extract that opens anywhere, without pulling a rendering library into the server bundle.
 */
export type Cell = string | number | null;
export interface ReportTable { title: string; columns: string[]; rows: Cell[][] }
export interface Report {
  id: string;
  title: string;
  generatedAt: string;
  source: "live" | "demo";
  summary: [string, string][];
  tables: ReportTable[];
  notes: string[];
}
export type ReportFormat = "json" | "md" | "txt" | "pdf" | "csv";

const show = (c: Cell): string => (c === null || c === undefined ? "" : typeof c === "number" ? (Number.isInteger(c) ? String(c) : String(Math.round(c * 1000) / 1000)) : c);
const oneLine = (s: string) => s.replace(/\s+/g, " ").trim();

/* ── Markdown ───────────────────────────────────────────────────────── */

const mdCell = (c: Cell) => oneLine(show(c)).replace(/\|/g, "\\|");

export function toMarkdown(r: Report): string {
  const out: string[] = [`# ${r.title}`, "", `_Generated ${r.generatedAt} · data source: ${r.source}_`, ""];
  if (r.summary.length) {
    out.push("## Summary", "", "| Measure | Value |", "| --- | --- |");
    for (const [k, v] of r.summary) out.push(`| ${mdCell(k)} | ${mdCell(v)} |`);
    out.push("");
  }
  for (const t of r.tables) {
    out.push(`## ${t.title}`, "");
    if (!t.rows.length) { out.push("_No rows._", ""); continue; }
    out.push(`| ${t.columns.map(mdCell).join(" | ")} |`, `| ${t.columns.map(() => "---").join(" | ")} |`);
    for (const row of t.rows) out.push(`| ${row.map(mdCell).join(" | ")} |`);
    out.push("");
  }
  if (r.notes.length) out.push("## Notes", "", ...r.notes.map((n) => `- ${oneLine(n)}`), "");
  return out.join("\n");
}

/* ── plain text ─────────────────────────────────────────────────────── */

const WIDTH = 100;
const clip = (s: string, n: number) => (s.length <= n ? s.padEnd(n) : `${s.slice(0, Math.max(1, n - 1))}…`);

export function toText(r: Report): string {
  const out: string[] = [r.title.toUpperCase(), "=".repeat(Math.min(WIDTH, r.title.length)), `Generated ${r.generatedAt} · data source: ${r.source}`, ""];
  if (r.summary.length) {
    const kw = Math.min(34, Math.max(...r.summary.map(([k]) => k.length)));
    out.push("SUMMARY", "-------");
    for (const [k, v] of r.summary) out.push(`${clip(k, kw)}  ${oneLine(v)}`);
    out.push("");
  }
  for (const t of r.tables) {
    out.push(t.title.toUpperCase(), "-".repeat(Math.min(WIDTH, t.title.length)));
    if (!t.rows.length) { out.push("(no rows)", ""); continue; }
    const n = t.columns.length;
    const budget = WIDTH - 2 * (n - 1);
    const natural = t.columns.map((c, i) => Math.max(c.length, ...t.rows.map((row) => show(row[i] ?? null).length)));
    let widths = natural.map((w) => Math.min(w, 40));
    while (widths.reduce((a, b) => a + b, 0) > budget) {
      const i = widths.indexOf(Math.max(...widths));
      if (widths[i] <= 6) break;
      widths[i] -= 1;
    }
    widths = widths.map((w) => Math.max(w, 4));
    out.push(t.columns.map((c, i) => clip(c, widths[i])).join("  ").trimEnd());
    out.push(widths.map((w) => "-".repeat(w)).join("  "));
    for (const row of t.rows) out.push(row.map((c, i) => clip(oneLine(show(c)), widths[i])).join("  ").trimEnd());
    out.push("");
  }
  if (r.notes.length) out.push("NOTES", "-----", ...r.notes.map((x) => `* ${oneLine(x)}`), "");
  return out.join("\n");
}

/* ── CSV (one table, for spreadsheets) ──────────────────────────────── */

const csvCell = (c: Cell): string => {
  const s = show(c);
  // A leading = + - @ would run as a formula in a spreadsheet; prefix it so exported data cannot execute.
  const safe = /^[=+\-@\t\r]/.test(s) && Number.isNaN(Number(s)) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};
export function toCsv(t: ReportTable): string {
  return [t.columns, ...t.rows].map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

/* ── PDF ────────────────────────────────────────────────────────────── */

const PAGE_W = 595, PAGE_H = 842, MARGIN = 40, FONT = 8.2, LEADING = 10.6;
const LINES_PER_PAGE = Math.floor((PAGE_H - 2 * MARGIN - 18) / LEADING);

/** Latin-1 only (WinAnsi): anything else becomes "?", and the PDF string specials are escaped. */
const pdfEsc = (s: string) =>
  s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-").replace(/…/g, "...")
    .replace(/[^\x20-\x7e\xa1-\xff]/g, "?").replace(/([\\()])/g, "\\$1");

function wrapLine(line: string, width = 105): string[] {
  if (line.length <= width) return [line];
  const out: string[] = [];
  for (let i = 0; i < line.length; i += width) out.push(line.slice(i, i + width));
  return out;
}

export function toPdf(r: Report): Uint8Array {
  const lines = toText(r).split("\n").flatMap((l) => wrapLine(l));
  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += LINES_PER_PAGE) pages.push(lines.slice(i, i + LINES_PER_PAGE));
  if (!pages.length) pages.push([""]);

  const objs: string[] = [];
  const add = (body: string) => { objs.push(body); return objs.length; };
  add("<< /Type /Catalog /Pages 2 0 R >>");
  add("<< >>"); // the page tree, filled in once the page objects exist
  const fRegular = add("<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>");
  const fBold = add("<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>");

  const kids: number[] = [];
  pages.forEach((pg, pi) => {
    const ops: string[] = ["BT", `/F1 ${FONT} Tf`, `${LEADING} TL`, `${MARGIN} ${PAGE_H - MARGIN} Td`];
    pg.forEach((l, li) => {
      const heading = pi === 0 && li === 0;
      if (heading) ops.push(`/F2 ${FONT + 3} Tf`);
      ops.push(`(${pdfEsc(l)}) Tj`);
      if (heading) ops.push(`/F1 ${FONT} Tf`);
      ops.push("T*");
    });
    ops.push("ET", "BT", "/F1 7 Tf", `${MARGIN} ${MARGIN - 18} Td`, `(${pdfEsc(`MAD Gambit - ${r.title} - page ${pi + 1} of ${pages.length} - confidential`)}) Tj`, "ET");
    const stream = ops.join("\n");
    const contentId = add(`<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`);
    const pageId = add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 ${fRegular} 0 R /F2 ${fBold} 0 R >> >> /Contents ${contentId} 0 R >>`);
    kids.push(pageId);
  });
  objs[1] = `<< /Type /Pages /Kids [${kids.map((k) => `${k} 0 R`).join(" ")}] /Count ${kids.length} >>`;
  const infoId = add(`<< /Title (${pdfEsc(r.title)}) /Producer (MAD Gambit admin suite) >>`);

  let body = "%PDF-1.4\n";
  const offsets: number[] = [];
  objs.forEach((o, i) => { offsets.push(Buffer.byteLength(body, "latin1")); body += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = Buffer.byteLength(body, "latin1");
  body += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`;
  body += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R /Info ${infoId} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new Uint8Array(Buffer.from(body, "latin1"));
}

export const FORMATS: Record<Exclude<ReportFormat, "json">, { mime: string; ext: string }> = {
  md: { mime: "text/markdown; charset=utf-8", ext: "md" },
  txt: { mime: "text/plain; charset=utf-8", ext: "txt" },
  pdf: { mime: "application/pdf", ext: "pdf" },
  csv: { mime: "text/csv; charset=utf-8", ext: "csv" },
};
export const parseFormat = (v: string | null): ReportFormat => (v === "md" || v === "txt" || v === "pdf" || v === "csv" ? v : "json");
