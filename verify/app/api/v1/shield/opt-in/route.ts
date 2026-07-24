import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  createShieldOptIn,
  calculateShieldReturnWindow,
  type ShieldTier,
  type WhaleEligibilityInput,
} from "@/lib/gambit-game-math";
import { insertShieldPosition } from "@/lib/shield";

interface OptInBody {
  walletAddress?: unknown;
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
 */
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "shield-optin", 20, 60_000);
  if (limited) return limited;

  const body = (await req.json().catch(() => null)) as OptInBody | null;
  if (!body) {
    return NextResponse.json({ success: false, error: "invalid JSON" }, { status: 400 });
  }

  const wallet = String(body.walletAddress ?? "");
  if (!/^0x[0-9a-fA-F]{40}$/.test(wallet)) {
    return NextResponse.json({ success: false, error: "invalid wallet" }, { status: 400 });
  }

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

  if (!process.env.DATABASE_URL) {
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
    return NextResponse.json({ success: true, persisted: false, info });
  }
}
