import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { buy } from "@/lib/madx-web2";

/**
 * POST /api/v1/madx/buy { owner, amount } — PLACEHOLDER beta purchase. Mints beta
 * credits instantly (no real payment) against the shared cap. Clearly labelled
 * beta in the UI; real fiat/on-ramp checkout is a later integration.
 */
export async function POST(req: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ success: false, error: "MADx credits need DATABASE_URL" }, { status: 503 });
  }
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const owner = typeof body.owner === "string" ? body.owner : "";
    const amount = Number(body.amount);
    if (!owner.trim() || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: "owner + positive amount required" }, { status: 400 });
    }
    const { account, minted } = await buy(getDbPool(), owner, amount);
    return NextResponse.json({ success: true, account, minted, note: minted ? "beta placeholder purchase" : "supply cap reached" });
  } catch (e) {
    console.error("madx/buy error:", e);
    return NextResponse.json({ success: false, error: "failed" }, { status: 500 });
  }
}
