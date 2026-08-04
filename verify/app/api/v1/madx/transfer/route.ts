import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { transfer } from "@/lib/madx-web2";
import { isAuthResponse, requireMadxRouteAuth } from "@/lib/madx-route-auth";

/** POST /api/v1/madx/transfer { to, amount } — move signed-in wallet beta credits P2P. */
export async function POST(req: Request) {
  const auth = requireMadxRouteAuth(req, "madx-transfer", 30, 60_000);
  if (isAuthResponse(auth)) return auth;

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ success: false, error: "MADx credits need DATABASE_URL" }, { status: 503 });
  }
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const to = typeof body.to === "string" ? body.to : "";
    const amount = Number(body.amount);
    if (!to.trim() || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: "to + positive amount required" }, { status: 400 });
    }
    const ok = await transfer(getDbPool(), auth.owner, to, amount);
    if (!ok) return NextResponse.json({ success: false, error: "insufficient balance or invalid recipient" }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("madx/transfer error:", e);
    return NextResponse.json({ success: false, error: "failed" }, { status: 500 });
  }
}
