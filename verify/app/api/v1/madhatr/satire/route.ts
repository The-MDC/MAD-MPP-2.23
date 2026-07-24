import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { rankBySatire } from "@/lib/satire-metrics";

/**
 * GET /api/v1/madhatr/satire — ranks recent headlines by satire metrics
 * (Z-Liar Meter + lexicon sentiment composition). Powers the Neon Noir Tabloid /
 * Scandal Sheet feed ordering + roast-severity throttle. Neon-backed when
 * configured; demo headlines through the SAME real scorer otherwise.
 *
 * Optional query: ?throttle=0..1 to preview roast-severity throttling.
 */
export const dynamic = "force-dynamic";

const DEMO_HEADLINES = [
  "Shocking bombshell: celebrity couple's explosive feud erupts into public meltdown",
  "Royal family scandal deepens as leaked messages spark outrage",
  "Tech CEO's controversial statement could trigger board revolt within days",
  "Pop star's cryptic post fuels breakup rumors, statement expected soon",
  "Quarterly logistics report released on schedule",
];

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(30, Math.max(1, Number(url.searchParams.get("limit")) || 12));
  const throttleRaw = Number(url.searchParams.get("throttle"));
  const roastThrottle = Number.isFinite(throttleRaw) ? Math.min(1, Math.max(0, throttleRaw)) : 1;

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      success: true,
      source: "demo",
      metrics: rankBySatire(DEMO_HEADLINES, { roastThrottle }).slice(0, limit),
    });
  }
  try {
    const pool = getDbPool();
    const res = await pool.query(
      `SELECT headline FROM gdelt_signals ORDER BY created_at DESC LIMIT 100`,
    );
    const headlines = res.rows.map((r) => String(r.headline ?? "")).filter((h) => h.trim().length > 0);
    const metrics = rankBySatire(headlines.length ? headlines : DEMO_HEADLINES, { roastThrottle }).slice(0, limit);
    return NextResponse.json({ success: true, source: headlines.length ? "live" : "demo", metrics });
  } catch (e) {
    console.error("madhatr/satire error:", e);
    return NextResponse.json({
      success: true,
      source: "demo",
      metrics: rankBySatire(DEMO_HEADLINES, { roastThrottle }).slice(0, limit),
    });
  }
}
