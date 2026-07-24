import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { claim } from "@/lib/madx-web2";

/** POST /api/v1/madx/claim { owner } — claim accrued staking rewards to balance. */
export async function POST(req: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ success: false, error: "MADx credits need DATABASE_URL" }, { status: 503 });
  }
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const owner = typeof body.owner === "string" ? body.owner : "";
    if (!owner.trim()) return NextResponse.json({ success: false, error: "owner required" }, { status: 400 });
    const { account, claimed } = await claim(getDbPool(), owner);
    return NextResponse.json({ success: true, account, claimed });
  } catch (e) {
    console.error("madx/claim error:", e);
    return NextResponse.json({ success: false, error: "failed" }, { status: 500 });
  }
}
