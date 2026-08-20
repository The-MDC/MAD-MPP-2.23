import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { claim } from "@/lib/madx-web2";
import { isAuthResponse, requireMadxRouteAuth } from "@/lib/madx-route-auth";
import { hasDatabaseUrl } from "@/lib/database-url";

/** POST /api/v1/madx/claim — claim signed-in wallet accrued staking rewards to balance. */
export async function POST(req: Request) {
  const auth = requireMadxRouteAuth(req, "madx-claim", 30, 60_000);
  if (isAuthResponse(auth)) return auth;

  if (!hasDatabaseUrl()) {
    return NextResponse.json({ success: false, error: "MADx credits need DATABASE_URL" }, { status: 503 });
  }
  try {
    const { account, claimed } = await claim(getDbPool(), auth.owner);
    return NextResponse.json({ success: true, account, claimed });
  } catch (e) {
    console.error("madx/claim error:", e);
    return NextResponse.json({ success: false, error: "failed" }, { status: 500 });
  }
}
