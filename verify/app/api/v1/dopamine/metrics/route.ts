import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";

interface DopamineMetrics {
  activeMarkets: number;
  openBets: number;
  volume24h: number;
  chaos: number; // 0..100, derived from recent GCAM scandal velocity
  events24h: number;
  topScandals: { headline: string; perp: number }[];
  source: "live" | "demo";
}

const DEMO: DopamineMetrics = {
  activeMarkets: 0,
  openBets: 0,
  volume24h: 0,
  chaos: 0,
  events24h: 0,
  topScandals: [],
  source: "demo",
};

/**
 * GET /api/v1/dopamine/metrics — real platform pulse aggregated from Neon:
 * open markets, pending bets, 24h volume, a Chaos Meter from recent GCAM scandal
 * velocity (gdelt_signals), 24h event count, and the hottest scandal signals.
 * Degrades to a zeroed "demo" object so the carousel always renders.
 */
export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ success: true, metrics: DEMO });
  }
  try {
    const pool = getDbPool();
    const [markets, bets, vol, chaos, events, scandals] = await Promise.all([
      pool.query(`SELECT count(*)::int AS n FROM markets WHERE status='open'`),
      pool.query(`SELECT count(*)::int AS n FROM bets WHERE status='pending'`),
      pool.query(`SELECT COALESCE(sum(amount),0)::float8 AS v FROM bets WHERE created_at > now() - interval '24 hours'`),
      pool.query(`SELECT COALESCE(avg(scandal_velocity),0)::float8 AS c FROM gdelt_signals WHERE created_at > now() - interval '24 hours'`),
      pool.query(`SELECT count(*)::int AS n FROM events_stream WHERE created_at > now() - interval '24 hours'`),
      pool.query(`SELECT headline, perp_probability::float8 AS perp FROM gdelt_signals ORDER BY created_at DESC LIMIT 5`),
    ]);
    const chaosRaw = Number(chaos.rows[0]?.c ?? 0); // scandal velocity ~0..5
    const metrics: DopamineMetrics = {
      activeMarkets: Number(markets.rows[0]?.n ?? 0),
      openBets: Number(bets.rows[0]?.n ?? 0),
      volume24h: Number(vol.rows[0]?.v ?? 0),
      chaos: Math.min(100, Math.max(0, Math.round(chaosRaw * 20))),
      events24h: Number(events.rows[0]?.n ?? 0),
      topScandals: scandals.rows.map((r) => ({ headline: r.headline ?? "—", perp: Number(r.perp) || 0 })),
      source: "live",
    };
    return NextResponse.json({ success: true, metrics });
  } catch (e) {
    console.error("dopamine/metrics error:", e);
    return NextResponse.json({ success: true, metrics: DEMO });
  }
}
