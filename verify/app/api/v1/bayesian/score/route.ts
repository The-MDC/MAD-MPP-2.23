import { NextResponse } from "next/server";
import { brierScore, logScore } from "@/lib/bayesian-conviction";
import { enforceRateLimit } from "@/lib/rate-limit";

interface Body {
  forecasts?: unknown;
  outcomes?: unknown;
}

const nums = (v: unknown): number[] =>
  Array.isArray(v) ? v.map(Number).filter((n) => Number.isFinite(n)) : [];

/**
 * POST /api/v1/bayesian/score — proper-scoring calibration (Part X — surfaces
 * brierScore + logScore). Forecasts vs outcomes → Brier (lower better) + Log
 * (higher better). Pure, no DB. Feeds the "Master Forecaster" meta-reward.
 */
// PUBLIC-ROUTE: Bayesian scoring — pure maths, no DB, no external call.
// Rate-limited, because open still needs a cost ceiling.
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "bayesian-score", 60, 60_000);
  if (limited) return limited;

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return NextResponse.json({ success: false, error: "invalid JSON" }, { status: 400 });

  const forecasts = nums(body.forecasts);
  const outcomes = nums(body.outcomes);
  const n = Math.min(forecasts.length, outcomes.length);
  if (n === 0) {
    return NextResponse.json({ success: false, error: "forecasts and outcomes arrays required" }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    scores: { n, brier: brierScore(forecasts, outcomes), log: logScore(forecasts, outcomes) },
  });
}
