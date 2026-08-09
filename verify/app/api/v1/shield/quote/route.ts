import { NextResponse } from "next/server";
import {
  calculateShieldPremium,
  calculateShieldPayoutFull,
  calculateShieldReturnWindow,
  isWhaleShieldEligible,
  WHALE_SHIELD_ELIGIBILITY,
  type ShieldTier,
  type WhaleEligibilityInput,
} from "@/lib/gambit-game-math";
import { enforceRateLimit } from "@/lib/rate-limit";

interface QuoteBody {
  stake?: unknown;
  tier?: unknown;
  premiumTier?: unknown;
  requestWhaleTier?: unknown;
  eligibility?: Record<string, unknown>;
}

const ZERO_ELIG: WhaleEligibilityInput = {
  lifetimeVolume: 0,
  accountAgeDays: 0,
  trustScore: 0,
  goldenHandCardsStaked: 0,
};

/**
 * POST /api/v1/shield/quote — pure MAD Shield calculator (Part P, P-1).
 * Wraps the canonical Shield math (Standard 28.8% / Shielded 28.8→40% dial /
 * Whale 60%; premium 2–4% of stake; return window 2–24h). No DB and no value
 * movement — always available, safe to call from the marketing surface.
 */
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "shield-quote", 60, 60_000);
  if (limited) return limited;

  const body = (await req.json().catch(() => null)) as QuoteBody | null;
  if (!body) {
    return NextResponse.json({ success: false, error: "invalid JSON" }, { status: 400 });
  }

  const stake = Number(body.stake);
  if (!Number.isFinite(stake) || stake < 0) {
    return NextResponse.json(
      { success: false, error: "stake must be a non-negative number" },
      { status: 400 },
    );
  }

  const tierRaw = body.tier;
  const tier: ShieldTier =
    tierRaw === "shielded" || tierRaw === "whale" ? tierRaw : "standard";
  const premiumTier = Math.min(1, Math.max(0, Number(body.premiumTier) || 0));
  const requestWhaleTier = Boolean(body.requestWhaleTier);

  const eligibility: WhaleEligibilityInput = body.eligibility
    ? {
        lifetimeVolume: Number(body.eligibility.lifetimeVolume) || 0,
        accountAgeDays: Number(body.eligibility.accountAgeDays) || 0,
        trustScore: Number(body.eligibility.trustScore) || 0,
        goldenHandCardsStaked: Number(body.eligibility.goldenHandCardsStaked) || 0,
      }
    : ZERO_ELIG;

  const premium = calculateShieldPremium(stake, tier, premiumTier);
  const result = calculateShieldPayoutFull(stake, premiumTier, eligibility, requestWhaleTier);
  const returnWindowHours = calculateShieldReturnWindow(stake);

  return NextResponse.json({
    success: true,
    quote: {
      stake,
      requestedTier: tier,
      appliedTier: result.tier,
      premium,
      payout: result.payout,
      effectivePct: result.effectivePct,
      returnWindowHours,
      whaleEligible: isWhaleShieldEligible(eligibility),
      whaleRequirements: WHALE_SHIELD_ELIGIBILITY,
    },
  });
}
