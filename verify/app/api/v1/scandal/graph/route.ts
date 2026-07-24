import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { buildScandalGraph, type GraphSignal } from "@/lib/scandal-graph";

/**
 * GET /api/v1/scandal/graph — the scandal co-occurrence graph (in-app GraphRAG
 * analog): who showed up together in scandals, weighted by frequency + heat, with
 * the marquee cross-faction rivalry surfaced. Neon-backed when configured; demo
 * rows through the SAME real graph builder otherwise.
 */
export const dynamic = "force-dynamic";

const DEMO: GraphSignal[] = [
  { persons: ["elon musk", "taylor swift"], scandalVelocity: 2.6 },
  { persons: ["elon musk", "taylor swift", "donald trump"], scandalVelocity: 3.0 },
  { persons: ["kim kardashian", "drake"], scandalVelocity: 1.8 },
  { persons: ["elon musk", "lebron james"], scandalVelocity: 1.2 },
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

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ success: true, source: "demo", graph: buildScandalGraph(DEMO) });
  }
  try {
    const pool = getDbPool();
    const res = await pool.query(
      `SELECT persons, scandal_velocity::float8 AS sv
       FROM gdelt_signals ORDER BY created_at DESC LIMIT 300`,
    );
    const signals: GraphSignal[] = res.rows.map((r) => ({
      persons: asStringArray(r.persons),
      scandalVelocity: Number(r.sv) || 0,
    }));
    const graph = buildScandalGraph(signals.length ? signals : DEMO);
    return NextResponse.json({ success: true, source: signals.length ? "live" : "demo", graph });
  } catch (e) {
    console.error("scandal/graph error:", e);
    return NextResponse.json({ success: true, source: "demo", graph: buildScandalGraph(DEMO) });
  }
}
