/**
 * POST /api/v1/mpp/simulate
 * Stochastic matrix calc — server mirror of generateStochasticSeries.
 * Spec: docs/mpp-backend-architecture.md §2A
 */
import { NextRequest, NextResponse } from "next/server";
import { generateStochasticSeries } from "@/lib/mpp-math";
import { enforceRateLimit } from "@/lib/rate-limit";

// PUBLIC-ROUTE: pure calculator, no DB (see below). Rate-limited, and
// simulatedEpochs is clamped — it was previously an unbounded client-supplied
// number driving simulation work server-side.
const MAX_SIMULATED_EPOCHS = 10_000;

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "mpp-simulate", 30, 60_000);
  if (limited) return limited;

  try {
    const b = await req.json();
    const required = ["baseThreshold", "currentStake", "userMultiplier", "alpha", "governanceWeight", "simulatedEpochs", "bondingPriceFloor", "pricingSlope", "elasticity"];
    for (const k of required) if (typeof b[k] !== "number") return NextResponse.json({ success: false, error: `Missing/invalid '${k}'` }, { status: 400 });
    if (b.alpha < 0 || b.alpha > 1) return NextResponse.json({ success: false, error: "alpha must be in [0,1]" }, { status: 400 });
    if (b.simulatedEpochs < 0 || b.simulatedEpochs > MAX_SIMULATED_EPOCHS) {
      return NextResponse.json({ success: false, error: `simulatedEpochs must be between 0 and ${MAX_SIMULATED_EPOCHS}` }, { status: 400 });
    }
    const data = generateStochasticSeries(b);
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    console.error("mpp/simulate error:", e);
    return NextResponse.json({ success: false, error: "Simulation failed" }, { status: 400 });
  }
}
