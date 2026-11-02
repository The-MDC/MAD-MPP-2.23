import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { signupStatus } from "@/lib/support/eligibility";
import { betaPhase, PHASE_COPY } from "@/lib/support/beta";

/** GET /api/v1/support/eligibility — which signup steps are done, so the concierge knows whether to show Support and Knowledge base. */
export async function GET(req: Request) {
  const limited = enforceRateLimit(req, "support-eligibility", 30, 60_000);
  if (limited) return limited;
  const s = await signupStatus(req);
  const phase = betaPhase();
  return NextResponse.json(
    { success: true, complete: s.complete, steps: { beta: s.beta, wallet: s.wallet, profile: s.profile }, profileRequired: s.profileRequired, phase, phaseName: PHASE_COPY[phase].name },
    { headers: { "cache-control": "no-store" } },
  );
}
