import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { withRouteGuard } from "@/lib/with-route-guard";
import {
  createShieldOptIn,
  calculateShieldReturnWindow,
  type ShieldTier,
  type WhaleEligibilityInput,
} from "@/lib/gambit-game-math";
import { insertShieldPosition } from "@/lib/shield";
import { hasDatabaseUrl } from "@/lib/database-url";

interface OptInBody {
  stake?: unknown;
  tier?: unknown;
  premiumTier?: unknown;
  requestWhaleTier?: unknown;
  positionRef?: unknown;
  eligibility?: Record<string, unknown>;
}

/**
 * POST /api/v1/shield/opt-in — record a Shield opt-in (Part P, P-3).
 * Computes the opt-in via the canonical `createShieldOptIn` and persists intent
 * to Neon. No real value moves here — the $MADx premium charge + vault deposit
 * is the on-chain Phase-3 slice (P-5). Degrades to a non-persisted echo when
 * `DATABASE_URL` is absent so the flow never hard-fails in a demo build.
 *
 * The wallet comes from the SESSION. It was previously read from the request
 * body behind a rate limit alone, so an anonymous caller could open a Shield
 * position — a financial instrument with a premium, a tier and a return window
 * — against any address they cared to name. Nothing about a stake figure is
 * meaningful if the party it is recorded against is caller-supplied.
 */
export const POST = withRouteGuard(
  { mode: "session", bucket: "shield-optin", limit: 20, windowMs: 60_000 },
  async (req, { owner }) => {
  const body = (await req.json().catch(() => null)) as OptInBody | null;
  if (!body) {
    return NextResponse.json({ success: false, error: "invalid JSON" }, { status: 400 });
  }

  const wallet = owner;

  const stake = Number(body.stake);
  if (!Number.isFinite(stake) || stake <= 0) {
    return NextResponse.json(
      { success: false, error: "stake must be a positive number" },
      { status: 400 },
    );
  }

  const tierRaw = body.tier;
  const tier: ShieldTier =
    tierRaw === "shielded" || tierRaw === "whale" ? tierRaw : "standard";
  const premiumTier = Math.min(1, Math.max(0, Number(body.premiumTier) || 0));
  const requestWhaleTier = Boolean(body.requestWhaleTier);
  const eligibility: WhaleEligibilityInput = {
    lifetimeVolume: Number(body.eligibility?.lifetimeVolume) || 0,
    accountAgeDays: Number(body.eligibility?.accountAgeDays) || 0,
    trustScore: Number(body.eligibility?.trustScore) || 0,
    goldenHandCardsStaked: Number(body.eligibility?.goldenHandCardsStaked) || 0,
  };

  const info = createShieldOptIn(stake, tier, premiumTier, eligibility, requestWhaleTier);
  if (!info) {
    return NextResponse.json(
      { success: false, error: "whale tier not eligible" },
      { status: 403 },
    );
  }

  if (!hasDatabaseUrl()) {
    return NextResponse.json({ success: true, persisted: false, info });
  }

  try {
    const pool = getDbPool();
    const position = await insertShieldPosition(pool, {
      walletAddress: wallet,
      positionRef: typeof body.positionRef === "string" ? body.positionRef : null,
      tier,
      premiumTier: info.premiumTier,
      stakeAmount: stake,
      premiumPaid: info.premiumPaid,
      status: info.status,
      stakedAt: info.stakedAt,
      returnWindowHours: calculateShieldReturnWindow(stake),
    });
    return NextResponse.json({ success: true, persisted: true, position });
  } catch (e) {
    console.error("shield/opt-in error:", e);
    // 500 rather than `success: true` — see the same correction in
    // cards/collect. A failed write must not read as a completed opt-in.
    return NextResponse.json(
      { success: false, persisted: false, error: "could not record opt-in" },
      { status: 500 },
    );
  }
  },
);
