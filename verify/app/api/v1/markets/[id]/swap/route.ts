import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getSessionFromRequest } from "@/lib/session";
import { ensureBook, fill, type FillFailure } from "@/lib/market-book";

/**
 * POST /api/v1/markets/<id>/swap  { outcome | outcomeIndex, amount }
 *
 * Buy shares of an outcome against the market's DL-LMSR book. This is the first
 * write path in the repo that calls the pricing engine — before it, the LMSR
 * functions had exactly one caller, a client-side preview widget, and nothing
 * ever recomputed `markets.yes_odds` from a trade.
 *
 * THE WALLET COMES FROM THE SESSION, NEVER THE BODY. `POST /api/v1/bets` takes
 * a body-supplied `walletAddress` behind nothing but a rate limit, which was
 * harmless only because no bet moved value. This route debits `madx_accounts`,
 * so a body-supplied wallet would be a way to spend someone else's balance.
 *
 * The client's quote is a preview. `fill()` locks the book row and re-prices
 * against it, so a stale or forged quote cannot dictate what the buyer gets —
 * the number returned here is the settled one, and the UI should render it
 * rather than its own optimistic guess.
 *
 * `withRouteGuard` is the newer wrapper, but it does not thread Next's dynamic
 * `params` through to the handler; the guard functions it calls are invoked
 * directly here in the same order (rate limit, then session).
 */
const BUCKET = "market-swap";

const FAILURE_STATUS: Record<FillFailure, number> = {
  "no-book": 404,
  "unusable-book": 409,
  "bad-outcome": 400,
  "bad-amount": 400,
  "insufficient-balance": 402,
};

const FAILURE_MESSAGE: Record<FillFailure, string> = {
  "no-book": "market has no book",
  "unusable-book": "market book is not tradeable",
  "bad-outcome": "unknown outcome",
  "bad-amount": "amount must be positive",
  "insufficient-balance": "insufficient $MADx balance",
};

interface SwapBody {
  outcome?: unknown;
  outcomeIndex?: unknown;
  amount?: unknown;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const limited = enforceRateLimit(req, BUCKET, 30, 60_000);
  if (limited) return limited;

  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as SwapBody | null;
  if (!body) return NextResponse.json({ success: false, error: "invalid JSON" }, { status: 400 });

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ success: false, error: "amount must be positive" }, { status: 400 });
  }

  if (!hasDatabaseUrl()) {
    return NextResponse.json({ success: false, error: "swaps need DATABASE_URL" }, { status: 503 });
  }

  try {
    const pool = getDbPool();

    // A market that has never traded has no book row yet. Opening one is
    // idempotent and never overwrites an existing vector.
    const book = await ensureBook(pool, id);

    // Accept either a label ("YES") or an index. The label is resolved against
    // the book's own `outcomes` so ordering is never assumed from a name.
    let outcomeIndex = -1;
    if (typeof body.outcome === "string") {
      outcomeIndex = book.outcomes.indexOf(body.outcome);
    } else if (Number.isInteger(Number(body.outcomeIndex))) {
      outcomeIndex = Number(body.outcomeIndex);
    }
    if (outcomeIndex < 0 || outcomeIndex >= book.outcomes.length) {
      return NextResponse.json(
        { success: false, error: "outcome must be one of: " + book.outcomes.join(", ") },
        { status: 400 },
      );
    }

    const result = await fill(pool, {
      marketId: id,
      walletAddress: session.address,
      outcomeIndex,
      spend: amount,
    });

    if (typeof result === "string") {
      return NextResponse.json(
        { success: false, error: FAILURE_MESSAGE[result] },
        { status: FAILURE_STATUS[result] },
      );
    }

    return NextResponse.json({
      success: true,
      source: "live",
      fill: {
        betId: result.betId,
        outcome: result.quote.outcome,
        outcomeIndex: result.quote.outcomeIndex,
        spend: result.quote.spend,
        fee: result.quote.fee,
        netIn: result.quote.netIn,
        shares: result.quote.shares,
        priceBefore: result.quote.priceBefore,
        priceAfter: result.quote.priceAfter,
        impact: result.quote.impact,
      },
      book: {
        marketId: result.book.marketId,
        outcomes: result.book.outcomes,
        q: result.book.q,
        b: result.book.b,
        cumVolume: result.book.cumVolume,
        openInterest: result.book.openInterest,
        sigma: result.book.sigma,
      },
      prices: result.prices,
    });
  } catch (e) {
    console.error("markets/[id]/swap error:", e);
    return NextResponse.json({ success: false, error: "swap failed" }, { status: 500 });
  }
}
