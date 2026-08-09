import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import { enforceRateLimit } from "@/lib/rate-limit";
import { isAuthResponse, requireMadxRouteAuth } from "@/lib/madx-route-auth";
import {
  DELISTING_SLA_HOURS,
  TRUSTED_FLAGGER_SLA_HOURS,
  fileComplaint,
  substantiateComplaint,
} from "@/lib/registrar-queue";
import { setMarketStatus } from "@/lib/perp-store";

const KINDS = ["delist_request", "appeal", "notice_and_action"] as const;
type Kind = (typeof KINDS)[number];

/**
 * §9.1 delisting, appeals, and the DSA notice-and-action mechanism.
 *
 * POST /api/v1/registrar/complaint          → file one (open to anyone)
 * POST /api/v1/registrar/complaint?resolve=1 → substantiate (authed reviewer)
 *
 * FILING IS UNAUTHENTICATED on purpose. A subject who wants a market about
 * their character reviewed should not first have to create an account on the
 * platform running it. Rate limiting is the abuse control; the SLA clock starts
 * regardless.
 *
 * Trusted flaggers get the priority lane — the DSA requirement, and also the
 * thing that keeps the median case honest.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const resolving = url.searchParams.get("resolve") === "1";

  if (resolving) {
    const auth = requireMadxRouteAuth(req, "registrar-resolve", 30, 60_000);
    if (isAuthResponse(auth)) return auth;
    if (!hasDatabaseUrl()) {
      return NextResponse.json({ success: false, error: "resolution needs DATABASE_URL" }, { status: 503 });
    }
    try {
      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
      const complaintId = Number(body.complaintId);
      const settlePrice = Number(body.settlePrice);
      const settleLeg = Number(body.settleLeg);
      const marketId = body.marketId ? String(body.marketId) : null;
      if (!Number.isFinite(complaintId) || !Number.isFinite(settlePrice) || !Number.isFinite(settleLeg)) {
        return NextResponse.json(
          { success: false, error: "complaintId, settlePrice and settleLeg required" },
          { status: 400 },
        );
      }

      const pool = getDbPool();
      const ok = await substantiateComplaint(pool, {
        complaintId,
        settlePrice,
        settleLeg,
        note: body.note ? String(body.note) : undefined,
      });
      if (!ok) {
        return NextResponse.json({ success: false, error: "complaint not open" }, { status: 409 });
      }
      // A substantiated complaint halts NEW conviction immediately. Open
      // positions settle at the last Crowning price rather than being voided:
      // voiding would erase the gains of holders who read the market correctly
      // and would hand the platform an incentive to void whenever a market runs
      // against it.
      if (marketId) await setMarketStatus(pool, marketId, "paused");
      return NextResponse.json({ success: true, complaintId, settlePrice, settleLeg, halted: Boolean(marketId) });
    } catch (e) {
      console.error("registrar/complaint resolve error:", e);
      return NextResponse.json({ success: false, error: "resolution failed" }, { status: 500 });
    }
  }

  const limited = enforceRateLimit(req, "registrar-complaint", 10, 60_000);
  if (limited) return limited;

  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const subjectRef = String(body.subjectRef ?? "");
    const kind = String(body.kind ?? "");
    const grounds = String(body.grounds ?? "").trim();
    const trustedFlagger = Boolean(body.trustedFlagger);

    if (!subjectRef || !grounds) {
      return NextResponse.json({ success: false, error: "subjectRef and grounds required" }, { status: 400 });
    }
    if (!KINDS.includes(kind as Kind)) {
      return NextResponse.json(
        { success: false, error: `kind must be one of ${KINDS.join(", ")}` },
        { status: 400 },
      );
    }

    const slaHours = trustedFlagger ? TRUSTED_FLAGGER_SLA_HOURS : DELISTING_SLA_HOURS;
    if (!hasDatabaseUrl()) {
      return NextResponse.json({ success: true, source: "demo", complaintId: null, slaHours });
    }

    const complaintId = await fileComplaint(getDbPool(), {
      subjectRef,
      marketId: body.marketId ? String(body.marketId) : null,
      kind: kind as Kind,
      grounds,
      trustedFlagger,
    });
    return NextResponse.json({ success: true, source: "live", complaintId, slaHours });
  } catch (e) {
    console.error("registrar/complaint error:", e);
    return NextResponse.json({ success: false, error: "filing failed" }, { status: 500 });
  }
}
