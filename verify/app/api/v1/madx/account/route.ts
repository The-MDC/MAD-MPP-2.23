import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getAccount, getSupply, MADX_BETA } from "@/lib/madx-web2";

/**
 * GET /api/v1/madx/account?owner=<id> — web2 $MADx (Beta) account + supply.
 * Degrades to a zeroed demo account so the wallet UI always renders.
 */
export async function GET(req: Request) {
  const owner = new URL(req.url).searchParams.get("owner")?.trim() ?? "";
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      success: true,
      source: "demo",
      meta: MADX_BETA,
      account: {
        owner,
        balance: 0,
        staked: 0,
        rewardAccrued: 0,
        pendingRewards: 0,
        tier: null,
        onboarded: false,
        onboardedAt: null,
        updatedAt: null,
      },
      supply: { minted: 0, cap: MADX_BETA.cap, remaining: MADX_BETA.cap },
    });
  }
  try {
    const pool = getDbPool();
    const supply = await getSupply(pool);
    const account = owner ? await getAccount(pool, owner) : null;
    return NextResponse.json({ success: true, source: "live", meta: MADX_BETA, account, supply });
  } catch (e) {
    console.error("madx/account error:", e);
    return NextResponse.json({ success: false, error: "failed" }, { status: 500 });
  }
}
