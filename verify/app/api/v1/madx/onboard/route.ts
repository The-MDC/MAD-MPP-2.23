import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { onboard } from "@/lib/madx-web2";
import { isAuthResponse, requireMadxRouteAuth } from "@/lib/madx-route-auth";

/** POST /api/v1/madx/onboard — idempotent beta welcome grant for the signed-in wallet. */
export async function POST(req: Request) {
  const auth = requireMadxRouteAuth(req, "madx-onboard", 10, 60_000);
  if (isAuthResponse(auth)) return auth;

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ success: false, error: "MADx credits need DATABASE_URL" }, { status: 503 });
  }
  try {
    const account = await onboard(getDbPool(), auth.owner);
    return NextResponse.json({ success: true, account });
  } catch (e) {
    console.error("madx/onboard error:", e);
    return NextResponse.json({ success: false, error: "failed" }, { status: 500 });
  }
}
