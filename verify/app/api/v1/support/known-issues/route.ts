import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/admin-guard";
import { enforceRateLimit } from "@/lib/rate-limit";
import { knownIssues } from "@/lib/support/store";
import { betaPhase, PHASE_COPY } from "@/lib/support/beta";

/** GET /api/v1/support/known-issues — the public known-issues list and beta phase (what the concierge reads before filing a duplicate). */
export async function GET(req: Request) {
  const limited = enforceRateLimit(req, "known-issues", 60, 60_000);
  if (limited) return limited;
  const phase = betaPhase();
  return NextResponse.json(
    { success: true, phase, phaseName: PHASE_COPY[phase].name, howToJoin: PHASE_COPY[phase].howToJoin, issues: await knownIssues(dbQuery()) },
    { headers: { "cache-control": "public, max-age=60" } },
  );
}
