import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { buy } from "@/lib/madx-web2";
import { isAuthResponse, requireMadxRouteAuth } from "@/lib/madx-route-auth";
import { hasDatabaseUrl } from "@/lib/database-url";

/**
 * POST /api/v1/madx/buy { amount } — PLACEHOLDER beta purchase for the signed-in wallet.
 * Mints beta credits instantly (no real payment) against the shared cap. Clearly labelled
 * beta in the UI; real fiat/on-ramp checkout is a later integration.
 */
export async function POST(req: Request) {
  const auth = requireMadxRouteAuth(req, "madx-buy", 10, 60_000);
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
    const { account, minted } = await buy(getDbPool(), auth.owner, amount);
    return NextResponse.json({ success: true, account, minted, note: minted ? "beta placeholder purchase" : "supply cap reached" });
  } catch (e) {
    console.error("madx/buy error:", e);
    return NextResponse.json({ success: false, error: "failed" }, { status: 500 });
  }
}
