import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { unstake } from "@/lib/madx-web2";
import { isAuthResponse, requireMadxRouteAuth } from "@/lib/madx-route-auth";
import { hasDatabaseUrl } from "@/lib/database-url";

/** POST /api/v1/madx/unstake { amount } — unstake signed-in wallet beta credits to balance. */
export async function POST(req: Request) {
  const auth = requireMadxRouteAuth(req, "madx-unstake", 30, 60_000);
  if (isAuthResponse(auth)) return auth;

  if (!hasDatabaseUrl()) {
    return NextResponse.json({ success: false, error: "MADx credits need DATABASE_URL" }, { status: 503 });
  }
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: "positive amount required" }, { status: 400 });
    }
    const account = await unstake(getDbPool(), auth.owner, amount);
    if (!account) return NextResponse.json({ success: false, error: "insufficient staked balance" }, { status: 400 });
    return NextResponse.json({ success: true, account });
  } catch (e) {
    console.error("madx/unstake error:", e);
    return NextResponse.json({ success: false, error: "failed" }, { status: 500 });
  }
}
