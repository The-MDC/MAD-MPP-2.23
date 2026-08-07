import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import { isAuthResponse, requireMadxRouteAuth } from "@/lib/madx-route-auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  listQueue,
  listSlaBreaches,
  preScreen,
  submitForListing,
  type EligibilityClaim,
  type QueueStatus,
} from "@/lib/registrar-queue";
import { assertOpaqueSubjectRef } from "@/lib/perp-store";

const STATUSES: readonly QueueStatus[] = ["pending", "approved", "denied", "delisted", "withdrawn"];

/** GET /api/v1/registrar/queue?status= — the listing queue and its SLA breaches. */
export async function GET(req: Request) {
  const limited = enforceRateLimit(req, "registrar-queue", 60, 60_000);
  if (limited) return limited;

  const raw = new URL(req.url).searchParams.get("status");
  const status: QueueStatus = STATUSES.includes(raw as QueueStatus) ? (raw as QueueStatus) : "pending";

  if (!hasDatabaseUrl()) {
    return NextResponse.json({ success: true, source: "demo", status, entries: [], breaches: [] });
  }
  try {
    const pool = getDbPool();
    const [entries, breaches] = await Promise.all([listQueue(pool, status, 100), listSlaBreaches(pool, 50)]);
    return NextResponse.json({ success: true, source: "live", status, entries, breaches });
  } catch (e) {
    console.error("registrar/queue GET error:", e);
    return NextResponse.json({ success: true, source: "demo", status, entries: [], breaches: [] });
  }
}

/**
 * POST /api/v1/registrar/queue — submit a named subject for listing.
 *
 * Runs the §9.1 triage: hard blocks first with no override, then the objective
 * eligibility bar, then a lane assignment. A hard-blocked subject is recorded
 * as DENIED immediately rather than parked in the queue — a categorical
 * prohibition sitting in a backlog is a categorical prohibition somebody can
 * approve by working through it.
 *
 * Without a database the triage still runs and the verdict is returned, so the
 * decision logic is inspectable without standing up infrastructure.
 */
export async function POST(req: Request) {
  const auth = requireMadxRouteAuth(req, "registrar-submit", 20, 60_000);
  if (isAuthResponse(auth)) return auth;

  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const subjectRef = String(body.subjectRef ?? "");
    try {
      assertOpaqueSubjectRef(subjectRef);
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err instanceof Error ? err.message : "invalid subjectRef" },
        { status: 400 },
      );
    }

    const claim = (body.claim ?? {}) as EligibilityClaim;
    const highestRiskCell = Boolean(body.highestRiskCell);

    if (!hasDatabaseUrl()) {
      return NextResponse.json({ success: true, source: "demo", triage: preScreen(claim), entry: null });
    }

    const result = await submitForListing(getDbPool(), { subjectRef, claim, highestRiskCell });
    return NextResponse.json({ success: true, source: "live", ...result });
  } catch (e) {
    console.error("registrar/queue POST error:", e);
    return NextResponse.json({ success: false, error: "submission failed" }, { status: 500 });
  }
}
