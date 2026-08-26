import { NextResponse } from "next/server";
import { egarchLogVar, cgarchUpdate } from "@/lib/bayesian-conviction";
import { enforceRateLimit } from "@/lib/rate-limit";

interface Body {
  egarch?: { prevLogVar?: unknown; z?: unknown; omega?: unknown; alpha?: unknown; beta?: unknown; gamma?: unknown };
  cgarch?: {
    prevVar?: unknown;
    prevPermanent?: unknown;
    epsSq?: unknown;
    omega?: unknown;
    rho?: unknown;
    phi?: unknown;
    alpha?: unknown;
    beta?: unknown;
  };
}

const num = (v: unknown, d = 0): number => (Number.isFinite(Number(v)) ? Number(v) : d);
const opt = (v: unknown): number | undefined => (Number.isFinite(Number(v)) ? Number(v) : undefined);

/**
 * POST /api/v1/bayesian/garch — EGARCH (asymmetric) + CGARCH (long/short split)
 * volatility steps (Part X — surfaces egarchLogVar + cgarchUpdate). Pure, no DB.
 */
// PUBLIC-ROUTE: GARCH variance update — pure maths, no DB, no external call.
// Rate-limited, because open still needs a cost ceiling.
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "bayesian-garch", 60, 60_000);
  if (limited) return limited;

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body || (!body.egarch && !body.cgarch)) {
    return NextResponse.json({ success: false, error: "provide `egarch` and/or `cgarch`" }, { status: 400 });
  }

  const result: Record<string, unknown> = {};

  if (body.egarch) {
    const e = body.egarch;
    const logVar = egarchLogVar({
      prevLogVar: num(e.prevLogVar, Math.log(0.04)),
      z: num(e.z),
      omega: opt(e.omega),
      alpha: opt(e.alpha),
      beta: opt(e.beta),
      gamma: opt(e.gamma),
    });
    result.egarch = { logVariance: logVar, variance: Math.exp(logVar), sigma: Math.sqrt(Math.exp(logVar)) };
  }

  if (body.cgarch) {
    const c = body.cgarch;
    result.cgarch = cgarchUpdate({
      prevVar: num(c.prevVar, 0.04),
      prevPermanent: num(c.prevPermanent, 0.04),
      epsSq: num(c.epsSq),
      omega: opt(c.omega),
      rho: opt(c.rho),
      phi: opt(c.phi),
      alpha: opt(c.alpha),
      beta: opt(c.beta),
    });
  }

  return NextResponse.json({ success: true, garch: result });
}
