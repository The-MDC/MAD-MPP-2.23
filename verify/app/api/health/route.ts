import { NextResponse } from "next/server";

/**
 * Liveness endpoint for the container HEALTHCHECK and uptime probes.
 * Unguarded on purpose — the Basic-Auth middleware matcher excludes /api — and
 * dependency-free (no DB call) so it reports process liveness only.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ ok: true, service: "mad-gambit-mpp", ts: Date.now() });
}
