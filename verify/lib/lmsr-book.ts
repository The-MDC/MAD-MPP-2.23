/**
 * MAD Gambit — DL-LMSR book maths.
 * ────────────────────────────────────────────────────────────────
 * Pure, isomorphic, zero side effects. No `pg`, no fetch, no DOM — same
 * contract as lib/gambit-game-math.ts, and for the same reason: the SERVER
 * settles a fill with these functions and the CLIENT previews it with the
 * identical call, so the number a user is shown before committing is the
 * number the book actually gives them. A preview computed a different way is
 * a preview that lies, and swap-interface used to do exactly that — its
 * `netIn / (price * b)` approximation is not the LMSR inverse.
 *
 * This module adds ONE thing to gambit-game-math: the inverse. That file can
 * price a book and cost a book; it cannot answer "how many shares does 100
 * $MADx buy?", which is the only question a trade actually asks.
 *
 * THE CLOSED FORM
 *
 *   C(q) = α·b·ln Σ e^(q_j/b)          (calculateDLLMSRCost)
 *   P_i  = e^(q_i/b) / Σ e^(q_j/b)     (calculateDLLMSRPrice)
 *
 * Buying s shares of outcome i costs C(q + s·eᵢ) − C(q). Setting that equal to
 * the net spend and solving for s:
 *
 *   netIn = α·b·ln( (S − Eᵢ + Eᵢ·e^(s/b)) / S ),   S = Σ e^(q_j/b), Eᵢ = e^(q_i/b)
 *   ⇒  s = b·ln( ( S·(K − 1) + Eᵢ ) / Eᵢ ),        K = e^(netIn/(α·b))
 *
 * Exact, not iterative.
 *
 * α IS HELD AT THE PRE-TRADE VOLUME, deliberately. α(V) = 1 + 0.05·log₁₀(1+V)
 * depends on cumulative volume, which this very trade increases — so solving
 * with α varying inside the trade needs a fixed point. α moves by ~0.05 per
 * decade of volume, so holding it across a single fill is far below the noise
 * of the price move itself, and it makes the quote a closed form the client
 * can reproduce exactly. The book's α advances on the NEXT trade.
 *
 * OVERFLOW: e^(q/b) overflows once q/b passes ~709. The solve therefore works
 * in exponentials shifted by max(q) — the shift cancels in the ratio, so the
 * result is identical and the intermediate values stay finite. gambit-game-math's
 * own sumExp is the unshifted canon form and is left alone; at b = 1200 it is
 * exact until a single outcome holds ~850,000 shares.
 */
import {
  calculateDLLMSRPrice,
  calculateVolumeScalingAlpha,
  splitFee,
} from "@/lib/gambit-game-math";

export interface BookState {
  /** Ordered outcome labels. Index-aligned with `q`. */
  outcomes: string[];
  /** Share vector. `q[i]` is the quantity outstanding of `outcomes[i]`. */
  q: number[];
  /** Liquidity parameter b. */
  b: number;
  /** Cumulative turnover — monotonic, feeds α(V). */
  cumVolume: number;
}

export interface Quote {
  outcomeIndex: number;
  outcome: string;
  /** Gross amount the buyer pays. */
  spend: number;
  /** 1.88% of `spend`. */
  fee: number;
  /** `spend − fee`, the amount that actually reaches the book. */
  netIn: number;
  /** Shares received — the exact LMSR inverse. */
  shares: number;
  priceBefore: number;
  priceAfter: number;
  /** |after − before| / before. Compare against 0.05 for the slippage warning. */
  impact: number;
  /** α(V) at the PRE-trade volume, held across this fill. */
  alpha: number;
  /** The share vector after the fill. */
  qAfter: number[];
  /** Every outcome's price after the fill, index-aligned with `outcomes`. */
  pricesAfter: number[];
}

/** Every outcome's current price, index-aligned with `book.outcomes`. */
export function bookPrices(book: BookState): number[] {
  return book.q.map((qi) => calculateDLLMSRPrice(qi, book.q, book.b));
}

/**
 * The headline probability a chart plots: outcome 0's price.
 * `market_prices.mark` stores exactly this, so a stored tape and a live book
 * always mean the same thing.
 */
export function markOf(prices: number[]): number {
  return prices.length > 0 ? prices[0] : 0;
}

/** A book is only usable if its vectors agree and b is positive. */
export function isUsableBook(book: BookState): boolean {
  return (
    Array.isArray(book.q) &&
    Array.isArray(book.outcomes) &&
    book.q.length > 0 &&
    book.q.length === book.outcomes.length &&
    book.b > 0 &&
    book.q.every((n) => Number.isFinite(n)) &&
    Number.isFinite(book.b) &&
    Number.isFinite(book.cumVolume)
  );
}

/**
 * Price a buy of `spend` on outcome `outcomeIndex`.
 *
 * Returns null rather than throwing on unusable input — callers are a route
 * handler (which owes the client a 400) and a render path (which owes it a
 * disabled button), and neither wants an exception.
 *
 * `creatorShareBps` is the market creator's CREATOR_LADDER rung and affects
 * only how the fee is split downstream, never what the buyer pays.
 */
export function quote(
  book: BookState,
  outcomeIndex: number,
  spend: number,
  creatorShareBps = 0,
): Quote | null {
  if (!isUsableBook(book)) return null;
  if (!Number.isInteger(outcomeIndex) || outcomeIndex < 0 || outcomeIndex >= book.q.length) return null;
  if (!Number.isFinite(spend) || spend <= 0) return null;

  const fees = splitFee(spend, creatorShareBps);
  const netIn = spend - fees.grossFee;
  if (netIn <= 0) return null;

  const alpha = calculateVolumeScalingAlpha(book.cumVolume);
  const b = book.b;

  // Shifted exponentials: the e^(m/b) factor cancels in the ratio below, so
  // this is the same number as the unshifted form without the overflow.
  // reduce, not Math.max(...q) or .apply — spread on a long vector blows the
  // argument limit, and `apply(null, …)` fails strictBindCallApply.
  const m = book.q.reduce((a, x) => (x > a ? x : a), -Infinity);
  const shifted = book.q.map((qi) => Math.exp((qi - m) / b));
  const sumShifted = shifted.reduce((s, e) => s + e, 0);
  const eI = shifted[outcomeIndex];
  if (!(eI > 0) || !Number.isFinite(sumShifted)) return null;

  //   s = b·ln( ( S·(K − 1) + Eᵢ ) / Eᵢ )
  const k = Math.exp(netIn / (alpha * b));
  const numerator = sumShifted * (k - 1) + eI;
  if (!(numerator > 0) || !Number.isFinite(numerator)) return null;

  const shares = b * Math.log(numerator / eI);
  if (!Number.isFinite(shares) || shares <= 0) return null;

  const priceBefore = calculateDLLMSRPrice(book.q[outcomeIndex], book.q, b);
  const qAfter = book.q.slice();
  qAfter[outcomeIndex] = qAfter[outcomeIndex] + shares;
  const pricesAfter = qAfter.map((qi) => calculateDLLMSRPrice(qi, qAfter, b));
  const priceAfter = pricesAfter[outcomeIndex];

  return {
    outcomeIndex,
    outcome: book.outcomes[outcomeIndex],
    spend,
    fee: fees.grossFee,
    netIn,
    shares,
    priceBefore,
    priceAfter,
    impact: priceBefore > 0 ? Math.abs(priceAfter - priceBefore) / priceBefore : 0,
    alpha,
    qAfter,
    pricesAfter,
  };
}

/**
 * Decimal odds from a probability, as `markets.yes_odds` / `no_odds` store them.
 *
 * This is the write-back that makes every existing odds surface true. Those two
 * columns default to 2.0 and, before the book existed, nothing ever issued
 * `UPDATE markets SET yes_odds` — so every market read 2.00× / 2.00× forever and
 * `deVig([2.0, 2.0])` de-vigged to a flat 50/50 on every card.
 *
 * Payout is NOT net of the platform fee here: `market-view.ts` applies the
 * 1.88% itself in `payoutFor`, and charging it twice would understate every
 * multiplier on every card.
 */
export function oddsFromPrice(p: number): number {
  if (!Number.isFinite(p) || p <= 0) return 0;
  return 1 / p;
}

/** A fresh, perfectly balanced book. Equal q ⇒ equal prices, whatever b is. */
export function emptyBook(outcomes: string[], b: number): BookState {
  return { outcomes: outcomes.slice(), q: outcomes.map(() => 0), b, cumVolume: 0 };
}
