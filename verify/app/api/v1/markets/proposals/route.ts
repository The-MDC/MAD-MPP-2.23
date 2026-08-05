import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { proposalsForToday, type MarketType, type Signal } from "@/lib/market-classifier";
import { hasDatabaseUrl } from "@/lib/database-url";

/**
 * GET /api/v1/markets/proposals — auto-generated, classified market proposals
 * ("Markets for Today") from recent scandal signals. Reads gdelt_signals from
 * Neon when configured; otherwise runs a few demo headlines through the SAME real
 * classifier so the surface always renders (demo DATA, real math).
 *
 * Each proposal is typed progression / saga / zliar / perp and ranked by score.
 */
const DEMO_HEADLINES = [
  "Breaking: pop star couple's public spat sparks breakup rumors, statement expected soon",
  "Long-running influencer empire braces for multi-year regulatory scrutiny",
  "Exclusive: tech CEO scandal could trigger board shakeup within days",
  "Rumor: reality star feud might escalate into a lawsuit this month",
  "Ongoing cancellation wave engulfs another streamer as drama keeps developing",
];

function countByType(proposals: { type: MarketType }[]): Record<MarketType, number> {
  const c: Record<MarketType, number> = { progression: 0, saga: 0, zliar: 0, perp: 0, gossipcop: 0 };
  for (const p of proposals) c[p.type] += 1;
  return c;
}

export async function GET(req: Request) {
  const limit = Math.min(30, Math.max(1, Number(new URL(req.url).searchParams.get("limit")) || 12));

  if (!hasDatabaseUrl()) {
    const proposals = proposalsForToday(DEMO_HEADLINES.map((headline) => ({ headline })), limit);
    return NextResponse.json({ success: true, source: "demo", proposals, byType: countByType(proposals) });
  }

  try {
    const pool = getDbPool();
    const res = await pool.query(
      `SELECT headline, scandal_velocity::float8 AS sv, perp_probability::float8 AS perp
       FROM gdelt_signals ORDER BY created_at DESC LIMIT 200`,
    );
    const signals: Signal[] = res.rows.map((r) => ({
      headline: String(r.headline ?? ""),
      scandalVelocity: Number(r.sv) || 0,
      perpProbability: Number.isFinite(Number(r.perp)) ? Number(r.perp) : undefined,
    }));
    const proposals = proposalsForToday(
      signals.length ? signals : DEMO_HEADLINES.map((headline) => ({ headline })),
      limit,
    );
    return NextResponse.json({
      success: true,
      source: signals.length ? "live" : "demo",
      proposals,
      byType: countByType(proposals),
    });
  } catch (e) {
    console.error("markets/proposals error:", e);
    const proposals = proposalsForToday(DEMO_HEADLINES.map((headline) => ({ headline })), limit);
    return NextResponse.json({ success: true, source: "demo", proposals, byType: countByType(proposals) });
  }
}
