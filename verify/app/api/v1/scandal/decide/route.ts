import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { decideForRows, summarizeDecisions, type SignalRow } from "@/lib/gdelt-scandal";
import { hasDatabaseUrl } from "@/lib/database-url";

/**
 * GET /api/v1/scandal/decide — runs the Scandal Scraper 5-gate decision tree over
 * recent gdelt_signals and returns the triggers (chaos_fusion / crossover /
 * scandal_pack / live_ticker_only / ignore), with Chaos Fusion metadata attached
 * to the chaos hits. Reads Neon when configured; otherwise runs the SAME real
 * decision tree over demo rows so the surface always renders (demo DATA, real math).
 */
export const dynamic = "force-dynamic";

const DEMO_ROWS: SignalRow[] = [
  {
    headline: "Feud erupts: Elon Musk, Taylor Swift, LeBron James and Donald Trump all pile in",
    persons: ["elon musk", "taylor swift", "lebron james", "donald trump"],
    themes: ["feud", "celebrity"],
    scandalVelocity: 3.0,
  },
  {
    headline: "Lawsuit rumors swirl around Kim Kardashian and LeBron James collab",
    persons: ["kim kardashian", "lebron james"],
    themes: ["lawsuit"],
    scandalVelocity: 2.2,
  },
  {
    headline: "LeBron James contract drama keeps developing",
    persons: ["lebron james"],
    themes: ["drama"],
    scandalVelocity: 2.0,
  },
  {
    headline: "Quiet news day across tech and entertainment",
    persons: [],
    themes: [],
    scandalVelocity: 0.2,
  },
];

function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x));
  if (typeof v === "string" && v.trim()) {
    try {
      const p = JSON.parse(v);
      return Array.isArray(p) ? p.map((x) => String(x)) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export async function GET(req: Request) {
  const limit = Math.min(50, Math.max(1, Number(new URL(req.url).searchParams.get("limit")) || 20));

  if (!hasDatabaseUrl()) {
    const decisions = decideForRows(DEMO_ROWS).slice(0, limit);
    return NextResponse.json({
      success: true,
      source: "demo",
      decisions,
      byType: summarizeDecisions(decisions),
    });
  }

  try {
    const pool = getDbPool();
    const res = await pool.query(
      `SELECT headline, url, persons, themes,
              scandal_velocity::float8 AS sv, perp_probability::float8 AS perp
       FROM gdelt_signals ORDER BY created_at DESC LIMIT 200`,
    );
    const rows: SignalRow[] = res.rows.map((r) => ({
      headline: String(r.headline ?? ""),
      url: r.url ? String(r.url) : null,
      persons: asStringArray(r.persons),
      themes: asStringArray(r.themes),
      scandalVelocity: Number(r.sv) || 0,
      perpProbability: Number.isFinite(Number(r.perp)) ? Number(r.perp) : undefined,
    }));
    const decisions = decideForRows(rows.length ? rows : DEMO_ROWS).slice(0, limit);
    return NextResponse.json({
      success: true,
      source: rows.length ? "live" : "demo",
      decisions,
      byType: summarizeDecisions(decisions),
    });
  } catch (e) {
    console.error("scandal/decide error:", e);
    const decisions = decideForRows(DEMO_ROWS).slice(0, limit);
    return NextResponse.json({
      success: true,
      source: "demo",
      decisions,
      byType: summarizeDecisions(decisions),
    });
  }
}
