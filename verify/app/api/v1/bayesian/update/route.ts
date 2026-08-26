import { NextResponse } from "next/server";
import {
  toLogOdds,
  fromLogOdds,
  sequentialLogOddsUpdate,
  madconvHybridUpdate,
} from "@/lib/bayesian-conviction";
import { enforceRateLimit } from "@/lib/rate-limit";

interface UpdateBody {
  prior?: unknown;
  likelihoodRatio?: unknown;
  likelihoodRatios?: unknown;
  madconv?: unknown;
  bayesFactor?: unknown;
  beta?: unknown;
}

/**
 * POST /api/v1/bayesian/update — sequential Bayesian belief update (Part T, pure).
 * Given a prior + one or more likelihood ratios, returns the log-odds and
 * posterior. Optionally applies the hybrid MADConv update. No DB.
 */
// PUBLIC-ROUTE: Posterior update — pure maths, no DB, no external call.
// Rate-limited, because open still needs a cost ceiling.
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "bayesian-update", 60, 60_000);
  if (limited) return limited;

  const body = (await req.json().catch(() => null)) as UpdateBody | null;
  if (!body) return NextResponse.json({ success: false, error: "invalid JSON" }, { status: 400 });

  let posterior: number | null = null;
  let lambda: number | null = null;
  const prior = Number(body.prior);
  if (Number.isFinite(prior)) {
    const ratios = Array.isArray(body.likelihoodRatios)
      ? body.likelihoodRatios.map(Number).filter((n) => Number.isFinite(n) && n > 0)
      : Number.isFinite(Number(body.likelihoodRatio))
        ? [Number(body.likelihoodRatio)]
        : [];
    lambda = sequentialLogOddsUpdate(toLogOdds(prior), ratios);
    posterior = fromLogOdds(lambda);
  }

  let madconvNext: number | null = null;
  const madconv = Number(body.madconv);
  const bayesFactor = Number(body.bayesFactor);
  if (Number.isFinite(madconv) && Number.isFinite(bayesFactor)) {
    const beta = Number.isFinite(Number(body.beta)) ? Number(body.beta) : 0.4;
    madconvNext = madconvHybridUpdate(madconv, bayesFactor, beta);
  }

  if (posterior === null && madconvNext === null) {
    return NextResponse.json(
      { success: false, error: "provide `prior` (+ likelihoodRatio[s]) and/or `madconv`+`bayesFactor`" },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true, result: { posterior, lambda, madconvNext } });
}
