import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getProfile } from "@/lib/data-platform/cdp";

/** GET /api/v1/data/cdp/<wallet> — the wallet's CDP profile. */
export async function GET(_req: Request, { params }: { params: Promise<{ wallet: string }> }) {
  const { wallet } = await params;
  if (!/^0x[0-9a-fA-F]{40}$/.test(wallet))
    return NextResponse.json({ success: false, error: "invalid wallet" }, { status: 400 });
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ success: false, error: "DATABASE_URL not set" }, { status: 503 });

  try {
    const profile = await getProfile(getDbPool(), wallet);
    return NextResponse.json({ success: true, profile });
  } catch (e) {
    console.error("data/cdp GET error:", e);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
