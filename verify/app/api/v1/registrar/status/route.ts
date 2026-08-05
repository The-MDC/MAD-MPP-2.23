import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import {
  DELISTING_SLA_HOURS,
  LISTING_SLA_HOURS,
  READINESS_WORKSTREAMS,
  TRUSTED_FLAGGER_SLA_HOURS,
  evaluateReadiness,
  getPauseState,
  moderationStats,
  readReadiness,
} from "@/lib/registrar-queue";
import { hasPepper } from "@/lib/subject-identity-map";

/**
 * GET /api/v1/registrar/status — the Phase-4 gate, in public.
 *
 * Returns whether the portrait key registry is live, which of the six §6.2.2
 * workstreams are outstanding, the platform pause state, the published SLAs,
 * and the moderation statistics INCLUDING the error rate.
 *
 * This is a public surface on purpose. §9.1 asks for published moderation
 * statistics before the DSA thresholds bind, for two reasons beyond compliance:
 * the EU becomes a switch-flip rather than a re-architecture, and the
 * transparency report doubles as the contemporaneous audit trail that defends
 * the product if a complaint escalates.
 *
 * Without a database the answer is NOT LIVE with everything outstanding. That
 * is the correct default: a readiness check that returns "fine" when it cannot
 * see the checklist is worse than no check.
 */
export async function GET() {
  const slas = {
    listingHours: LISTING_SLA_HOURS,
    delistingHours: DELISTING_SLA_HOURS,
    trustedFlaggerHours: TRUSTED_FLAGGER_SLA_HOURS,
  };

  if (!hasDatabaseUrl()) {
    return NextResponse.json({
      success: true,
      source: "demo",
      registry: evaluateReadiness([]),
      pause: { paused: false, reason: null, actor: null, changedAt: "" },
      pepperConfigured: hasPepper(),
      workstreams: READINESS_WORKSTREAMS,
      slas,
      stats: null,
    });
  }

  try {
    const pool = getDbPool();
    const [registry, pause, stats] = await Promise.all([
      readReadiness(pool),
      getPauseState(pool),
      moderationStats(pool),
    ]);
    return NextResponse.json({
      success: true,
      source: "live",
      registry,
      pause,
      // Reported, never returned: the pepper itself must not leave the runtime.
      pepperConfigured: hasPepper(),
      workstreams: READINESS_WORKSTREAMS,
      slas,
      stats,
    });
  } catch (e) {
    console.error("registrar/status error:", e);
    return NextResponse.json({
      success: true,
      source: "demo",
      registry: evaluateReadiness([]),
      pause: { paused: false, reason: null, actor: null, changedAt: "" },
      pepperConfigured: hasPepper(),
      workstreams: READINESS_WORKSTREAMS,
      slas,
      stats: null,
    });
  }
}
