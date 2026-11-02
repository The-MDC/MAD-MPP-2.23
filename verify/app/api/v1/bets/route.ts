import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { isAuthResponse, requireMadxRouteAuth } from "@/lib/madx-route-auth";
import { placeBet, listBetsByWallet, type Bet, type BetSide } from "@/lib/markets";
import { hasDatabaseUrl } from "@/lib/database-url";
import { checkTrade, tradeRefusal } from "@/lib/trade-guard";
import { flagAccount } from "@/lib/account-flags";
import { poolQ } from "@/lib/admin-reports";

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
 * current odds + bumps market volume. 503 without DB.
 *
 * THE WALLET COMES FROM THE SESSION. It used to be read from the request body
 * behind nothing but a rate limit, so any caller could record a bet against any
 * address. That was survivable only while a bet moved no value. It no longer is:
 * `markets.yes_odds` is now written by the book (lib/market-book.ts), so a
 * forged bet is a way to move a real price, and the sibling swap route debits
 * `madx_accounts` outright.
 *
 * Note this is exactly the class of hole scripts/check-route-guards.mjs cannot
 * see — it accepts a bare `enforceRateLimit(` as a guard, so this route passed
 * the gate the whole time it was trusting a body-supplied wallet.
 *
 * `body.walletAddress` is still accepted, but only to reject a mismatch loudly
 * rather than silently betting as someone else.
 */
export async function POST(req: Request) {
  const auth = requireMadxRouteAuth(req, "bets-place", 40, 60_000);
  if (isAuthResponse(auth)) return auth;

  const body = (await req.json().catch(() => null)) as BetBody | null;
  if (!body) return NextResponse.json({ success: false, error: "invalid JSON" }, { status: 400 });

  const marketId = typeof body.marketId === "string" ? body.marketId.trim() : "";
  const wallet = auth.owner;
  const side: BetSide | null = body.side === "YES" || body.side === "NO" ? body.side : null;
  const amount = Number(body.amount);

  if (!marketId) return NextResponse.json({ success: false, error: "marketId required" }, { status: 400 });
  if (
    typeof body.walletAddress === "string" &&
    body.walletAddress.trim() !== "" &&
    body.walletAddress.trim().toLowerCase() !== wallet
  ) {
    return NextResponse.json(
      { success: false, error: "walletAddress does not match the authenticated session" },
      { status: 403 },
    );
  }
  if (!side) return NextResponse.json({ success: false, error: "side must be YES or NO" }, { status: 400 });
  if (!Number.isFinite(amount) || amount <= 0)
    return NextResponse.json({ success: false, error: "amount must be positive" }, { status: 400 });

  // Anti-bot / anti-quant: per-wallet velocity, spacing, side-flip and size limits (lib/trade-guard.ts).
  const verdict = checkTrade(wallet, marketId, side, amount);
  if (!verdict.ok) {
    if (hasDatabaseUrl() && verdict.reason !== "too-fast") void flagAccount(poolQ(getDbPool()), { wallet }, `trade guard: ${verdict.reason}`, verdict.reason === "flip" || verdict.reason === "metronome" ? "high" : "medium", "trade-guard");
    return tradeRefusal(verdict);
  }

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
