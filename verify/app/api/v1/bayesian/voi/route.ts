import { NextResponse } from "next/server";
import { computeEdge, shouldAct, voiEstimate, kellyFraction } from "@/lib/bayesian-conviction";
import { enforceRateLimit } from "@/lib/rate-limit";

interface VoiBody {
  personal?: unknown;
  market?: unknown;
  conviction?: unknown;
  thresholdBase?: unknown;
  gainAfter?: unknown;
  gainBefore?: unknown;
  cost?: unknown;
  netOdds?: unknown;
  kellyScale?: unknown;
}

/**
 * POST /api/v1/bayesian/voi — edge / act-signal / VOI / Kelly calculator
 * (Part T, pure). `personal` posterior vs `market` price + `conviction` →
 * edge + act signal; optional gains/cost → VOI; optional `netOdds` → conviction
 * Kelly fraction. No DB.
 */
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "bayesian-voi", 60, 60_000);
  if (limited) return limited;

  const body = (await req.json().catch(() => null)) as VoiBody | null;
  if (!body) return NextResponse.json({ success: false, error: "invalid JSON" }, { status: 400 });

  const personal = Math.min(1, Math.max(0, Number(body.personal) || 0));
  const market = Math.min(1, Math.max(0, Number(body.market) || 0));
  const conviction = Math.max(0, Number(body.conviction) || 1);
  const thresholdBase = Number.isFinite(Number(body.thresholdBase)) ? Number(body.thresholdBase) : 0.05;

  const edge = computeEdge(personal, market, conviction);
  const act = shouldAct(edge, thresholdBase, conviction);

  let voi: number | null = null;
  if ([body.gainAfter, body.gainBefore, body.cost].some((v) => v != null)) {
    voi = voiEstimate(Number(body.gainAfter) || 0, Number(body.gainBefore) || 0, Number(body.cost) || 0);
  }

  let kelly: number | null = null;
  const netOdds = Number(body.netOdds);
  if (Number.isFinite(netOdds) && netOdds > 0) {
    const scale = Number.isFinite(Number(body.kellyScale)) ? Number(body.kellyScale) : 0.5;
    kelly = kellyFraction(personal, netOdds, scale);
  }

  return NextResponse.json({ success: true, result: { edge, shouldAct: act, voi, kelly } });
}
