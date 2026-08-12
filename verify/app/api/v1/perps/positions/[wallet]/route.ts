import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { listPositionsByWallet, type PerpPosition } from "@/lib/perp-store";
import { hasDatabaseUrl } from "@/lib/database-url";

/**
 * GET /api/v1/perps/positions/<wallet> — a wallet's conviction positions
 * across every family (FIVE FACES, ZEITGEIST, EPIPHANY). Mirrors
 * shield/positions/[wallet] — that route answers "what's my Shield
 * exposure," this one answers "what have I convicted on," and neither
 * existed for the other's family before this pair. Without it a user (or
 * the UI) needs to already know which market IDs to ask about; this is the
 * "show me everything I hold" view. Public by design, same as Shield's —
 * positions are inherently visible platform state, not private data.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ wallet: string }> }) {
  const { wallet } = await params;
  if (!/^0x[0-9a-fA-F]{40}$/.test(wallet)) {
    return NextResponse.json({ success: false, error: "invalid wallet" }, { status: 400 });
  }

  const empty: PerpPosition[] = [];
  if (!hasDatabaseUrl()) {
    return NextResponse.json({ success: true, positions: empty, source: "demo" });
  }

  try {
    const pool = getDbPool();
    const positions = await listPositionsByWallet(pool, wallet);
    return NextResponse.json({ success: true, positions, source: "live" });
  } catch (e) {
    console.error("perps/positions error:", e);
    return NextResponse.json({ success: true, positions: empty, source: "demo" });
  }
}
