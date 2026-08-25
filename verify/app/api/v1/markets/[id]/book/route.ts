import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import { getBook, priceHistory } from "@/lib/market-book";
import { bookPrices, emptyBook, markOf } from "@/lib/lmsr-book";
import { PLATFORM } from "@/lib/gambit-game-math";

/**
 * GET /api/v1/markets/<id>/book — the live DL-LMSR book plus its price tape.
 *
 * `?points=` caps the tape (default 24, the width market-view's `series` expects).
 *
 * Demo fallback returns a FRESH, EVEN book rather than invented depth. That is
 * the honest shape: with no database there genuinely is no book, and a balanced
 * one priced by the real solver is the only thing that is true. It is flagged
 * `source: "demo"` so the client can badge it — the repo convention that
 * separates its honest surfaces from the ones that just assert "LIVE".
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const points = Number(new URL(req.url).searchParams.get("points") ?? 24);

  const demo = () => {
    const book = emptyBook(["YES", "NO"], PLATFORM.LMSR_DEFAULT_B);
    const prices = bookPrices(book);
    return NextResponse.json({
      success: true,
      source: "demo",
      book: {
        marketId: id,
        venue: "binary",
        outcomes: book.outcomes,
        q: book.q,
        b: book.b,
        cumVolume: 0,
        openInterest: 0,
        sigma: PLATFORM.SIGMA_MIN,
      },
      prices,
      mark: markOf(prices),
      series: [] as number[],
    });
  };

  if (!hasDatabaseUrl()) return demo();

  try {
    const pool = getDbPool();
    const book = await getBook(pool, id);
    if (!book) return demo();

    const series = await priceHistory(pool, id, points);
    const prices = bookPrices(book);
    return NextResponse.json({
      success: true,
      source: "live",
      book: {
        marketId: book.marketId,
        venue: book.venue,
        outcomes: book.outcomes,
        q: book.q,
        b: book.b,
        cumVolume: book.cumVolume,
        openInterest: book.openInterest,
        sigma: book.sigma,
      },
      prices,
      mark: markOf(prices),
      series,
    });
  } catch (e) {
    console.error("markets/[id]/book error:", e);
    return demo();
  }
}
