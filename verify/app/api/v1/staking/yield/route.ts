import { NextResponse } from "next/server";
import { calculateStakingYield } from "@/lib/gambit-game-math";
import { enforceRateLimit } from "@/lib/rate-limit";

interface Body {
  apyBase?: unknown;
  nftClout?: unknown;
}

/**
 * POST /api/v1/staking/yield — NFT-clout-boosted staking yield (Part X —
 * surfaces calculateStakingYield: APY_user = APY_base · (1 + clout/200)).
 * Pure, no DB.
 */
// PUBLIC-ROUTE: Yield projection — pure maths, no DB.
// Rate-limited, because open still needs a cost ceiling.
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "staking-yield", 60, 60_000);
  if (limited) return limited;

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return NextResponse.json({ success: false, error: "invalid JSON" }, { status: 400 });

  const apyBase = Number(body.apyBase);
  if (!Number.isFinite(apyBase) || apyBase < 0) {
    return NextResponse.json({ success: false, error: "apyBase (>=0) required" }, { status: 400 });
  }
  const nftClout = Math.max(0, Number(body.nftClout) || 0);

  return NextResponse.json({
    success: true,
    staking: { apyBase, nftClout, boostedYield: calculateStakingYield(apyBase, nftClout) },
  });
}
