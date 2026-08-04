import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { stake } from "@/lib/madx-web2";
import { isAuthResponse, requireMadxRouteAuth } from "@/lib/madx-route-auth";

/** POST /api/v1/madx/stake { amount } — stake signed-in wallet beta credits into STAKING_TIERS. */
export async function POST(req: Request) {
  const auth = requireMadxRouteAuth(req, "madx-stake", 30, 60_000);
  if (isAuthResponse(auth)) return auth;

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ success: false, error: "MADx credits need DATABASE_URL" }, { status: 503 });
  }
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: "positive amount required" }, { status: 400 });
    }
    const account = await stake(getDbPool(), auth.owner, amount);
    if (!account) return NextResponse.json({ success: false, error: "insufficient balance" }, { status: 400 });
    return NextResponse.json({ success: true, account });
  } catch (e) {
    console.error("madx/stake error:", e);
    return NextResponse.json({ success: false, error: "failed" }, { status: 500 });
  }
}
