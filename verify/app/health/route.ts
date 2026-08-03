import { NextResponse } from "next/server";

/**
 * Liveness endpoint for the container HEALTHCHECK and uptime probes.
 * Unguarded on purpose — middleware's PUBLIC_PATHS exempts /health — and
 * dependency-free (no DB call) so it reports process liveness only.
 *
 * Not a re-export of ../api/health/route: Turbopack's route-segment-config
 * parser requires `dynamic` to be a literal declaration in this file, not
 * re-exported from elsewhere (build error otherwise — confirmed on main
 * after #37 merged). Kept in sync by hand with the sibling route below.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ ok: true, service: "mad-gambit-mpp", ts: Date.now() });
}
