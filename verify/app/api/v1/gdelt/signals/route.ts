import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";

/**
 * GET /api/v1/gdelt/signals — recent scored GDELT scandal signals (Part S),
 * newest first. `?min=` filters by Perp-trigger probability (0..1); `?limit=`
 * caps results. Degrades to an empty "demo" feed without the DB/migration.
 */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const min = Math.max(0, Math.min(1, Number(params.get("min")) || 0));
  const limit = Math.max(1, Math.min(100, Math.floor(Number(params.get("limit")) || 25)));

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ success: true, signals: [], source: "demo" });
  }

  try {
    const pool = getDbPool();
    const res = await pool.query(
      `SELECT id, headline, url, persons, themes, person_matches,
              theme_scandal_weight::float8 AS theme_scandal_weight,
              scandal_velocity::float8     AS scandal_velocity,
              perp_probability::float8     AS perp_probability,
              created_at
       FROM gdelt_signals
       WHERE perp_probability >= $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [min, limit],
    );
    const signals = res.rows.map((r) => ({
      id: Number(r.id),
      headline: r.headline,
      url: r.url,
      persons: Array.isArray(r.persons) ? r.persons : [],
      themes: Array.isArray(r.themes) ? r.themes : [],
      personMatches: Number(r.person_matches),
      themeScandalWeight: Number(r.theme_scandal_weight),
      scandalVelocity: Number(r.scandal_velocity),
      perpProbability: Number(r.perp_probability),
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    }));
    return NextResponse.json({ success: true, signals, source: "live" });
  } catch (e) {
    console.error("gdelt/signals error:", e);
    return NextResponse.json({ success: true, signals: [], source: "demo" });
  }
}
