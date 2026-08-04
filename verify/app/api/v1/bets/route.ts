import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import { placeBet, listBetsByWallet, type Bet, type BetSide } from "@/lib/markets";
import { hasDatabaseUrl } from "@/lib/database-url";

interface BetBody {
  marketId?: unknown;
  walletAddress?: unknown;
  side?: unknown;
  amount?: unknown;
}

/** GET /api/v1/bets?wallet= — a wallet's bets (Part W). Demo-empty without DB. */
export async function GET(req: Request) {
  const wallet = new URL(req.url).searchParams.get("wallet") ?? "";
  if (!/^0x[0-9a-fA-F]{40}$/.test(wallet)) {
    return NextResponse.json({ success: false, error: "valid ?wallet= required" }, { status: 400 });
  }
  const empty: Bet[] = [];
  if (!hasDatabaseUrl()) {
    return NextResponse.json({ success: true, bets: empty, source: "demo" });
  }
  try {
    const pool = getDbPool();
    const bets = await listBetsByWallet(pool, wallet);
    return NextResponse.json({ success: true, bets, source: "live" });
  } catch (e) {
    console.error("bets GET error:", e);
    return NextResponse.json({ success: true, bets: empty, source: "demo" });
  }
}

/**
 * POST /api/v1/bets — place a bet on an open market (Part W). Records the bet at
 * current odds + bumps market volume. No real value moves — on-chain settlement
 * is the gated slice. 503 without DB.
 */
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "bets-place", 40, 60_000);
  if (limited) return limited;

  const body = (await req.json().catch(() => null)) as BetBody | null;
  if (!body) return NextResponse.json({ success: false, error: "invalid JSON" }, { status: 400 });

  const marketId = typeof body.marketId === "string" ? body.marketId.trim() : "";
  const wallet = typeof body.walletAddress === "string" ? body.walletAddress : "";
  const side: BetSide | null = body.side === "YES" || body.side === "NO" ? body.side : null;
  const amount = Number(body.amount);

  if (!marketId) return NextResponse.json({ success: false, error: "marketId required" }, { status: 400 });
  if (!/^0x[0-9a-fA-F]{40}$/.test(wallet))
    return NextResponse.json({ success: false, error: "invalid wallet" }, { status: 400 });
  if (!side) return NextResponse.json({ success: false, error: "side must be YES or NO" }, { status: 400 });
  if (!Number.isFinite(amount) || amount <= 0)
    return NextResponse.json({ success: false, error: "amount must be positive" }, { status: 400 });

  if (!hasDatabaseUrl()) {
    return NextResponse.json({ success: false, error: "bets need DATABASE_URL" }, { status: 503 });
  }

  try {
    const pool = getDbPool();
    const bet = await placeBet(pool, { marketId, walletAddress: wallet, side, amount });
    if (!bet) return NextResponse.json({ success: false, error: "market not open or not found" }, { status: 409 });
    return NextResponse.json({ success: true, bet });
  } catch (e) {
    console.error("bets POST error:", e);
    return NextResponse.json({ success: false, error: "bet failed" }, { status: 500 });
  }
}
