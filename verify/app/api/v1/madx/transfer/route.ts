import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { transfer } from "@/lib/madx-web2";

/** POST /api/v1/madx/transfer { from, to, amount } — move beta credits P2P. */
export async function POST(req: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ success: false, error: "MADx credits need DATABASE_URL" }, { status: 503 });
  }
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const from = typeof body.from === "string" ? body.from : "";
    const to = typeof body.to === "string" ? body.to : "";
    const amount = Number(body.amount);
    if (!from.trim() || !to.trim() || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: "from + to + positive amount required" }, { status: 400 });
    }
    const ok = await transfer(getDbPool(), from, to, amount);
    if (!ok) return NextResponse.json({ success: false, error: "insufficient balance or invalid recipient" }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("madx/transfer error:", e);
    return NextResponse.json({ success: false, error: "failed" }, { status: 500 });
  }
}
