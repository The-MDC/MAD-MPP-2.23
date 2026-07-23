import { NextResponse } from "next/server";
import { STAKING_TIERS, getStakingTier } from "@/lib/gambit-game-math";

/**
 * GET /api/v1/staking
 * Server mirror of the on-chain MADStaking tier math (contracts/src/MADStaking.sol).
 * Returns the canonical tier ladder, and — when a staked amount is supplied —
 * the current tier, next-tier gap, and projected $MADx yield at that tier APY.
 *
 * Query: ?staked=<madx>  (alias ?balance=)
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = url.searchParams.get("staked") ?? url.searchParams.get("balance");

  const tiers = STAKING_TIERS.map((t) => ({
    name: t.name,
    minMadx: t.minMadx,
    apyPct: +(t.apy * 100).toFixed(2),
  }));

  const staked = raw != null ? Number(raw) : null;
  if (staked == null || Number.isNaN(staked) || staked < 0) {
    return NextResponse.json({ success: true, tiers });
  }

  const tier = getStakingTier(staked);
  const idx = tier ? STAKING_TIERS.findIndex((t) => t.name === tier.name) : -1;
  const nextTier = idx >= 0 ? STAKING_TIERS[idx + 1] ?? null : STAKING_TIERS[0];
  const apy = tier?.apy ?? 0;
  const annual = staked * apy;

  return NextResponse.json({
    success: true,
    staked,
    tier: tier ? { name: tier.name, apyPct: +(apy * 100).toFixed(2) } : null,
    nextTier: nextTier
      ? {
          name: nextTier.name,
          minMadx: nextTier.minMadx,
          madxToNext: Math.max(0, nextTier.minMadx - staked),
        }
      : null,
    projectedYield: {
      annual: +annual.toFixed(2),
      monthly: +(annual / 12).toFixed(2),
      daily: +(annual / 365).toFixed(4),
    },
    tiers,
  });
}
