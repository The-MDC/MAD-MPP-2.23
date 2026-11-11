/**
 * The sell path: an exit that executes against the SAME cost function the entry did.
 *
 * Until now the book could only be bought into (lib/lmsr-book.ts `quote`), and an exit paid `conviction × lockedPrice`
 * out of the house, a promise made at one price and honoured at that price whatever the book said later. A market maker
 * quotes two sides. This is the second side, and it is the whole design:
 *
 *   Selling s shares of outcome i returns them to the book. The seller receives the book's own cost difference,
 *       gross = C(q) − C(q − s·eᵢ)  =  α·b·ln( S / (S − Eᵢ + Eᵢ·e^(−s/b)) ),   S = Σ e^(q_j/b), Eᵢ = e^(q_i/b)
 *   minus the same 1.88% fee, charged on the proceeds. The price afterwards is the book's price afterwards. Nothing is
 *   promised: a seller can lose money on the way out, and a large seller moves the price against themselves. That is
 *   the market telling them something, not a defect.
 *
 * ONE EXIT, NOT TWO. Offering this beside a locked-price redemption gives every trader the better of the two on every
 * position, and the gap between a stale promise and live state is a free option the house funds. So the locked price
 * stops being a payment promise and becomes a record of what was paid. A reserve backstop for a book too thin to clear
 * is deliberately NOT here: it ships only with a funded reserve behind it, at a price strictly worse than this one.
 *
 * α AND THE ROUND TRIP. `quote()` holds α(V) at the pre-trade volume, and volume only rises. Selling back at a LATER,
 * higher α would pay out more than the position cost (a free profit that grows with the size of a first trade into a
 * thin book). So a sale uses α = min(α now, the α the position was bought at). A position with no known entry α is
 * sold at α = 1, the lowest the scaling ever takes, which can only be worse for the seller, never better.
 *
 * Pure and isomorphic, like lmsr-book: no I/O, so the server settles with the exact function the client previews with.
 */
import { calculateDLLMSRPrice, calculateVolumeScalingAlpha, splitFee } from "@/lib/gambit-game-math";
import { isUsableBook, type BookState } from "@/lib/lmsr-book";

export interface SellQuote {
  outcomeIndex: number;
  outcome: string;
  shares: number;
  /** What the book returns for the shares, before the fee. */
  grossProceeds: number;
  fee: number;
  /** `grossProceeds − fee`: what the seller receives. */
  netProceeds: number;
  priceBefore: number;
  priceAfter: number;
  /** |after − before| / before. A large seller sees this large; it is information, not an error. */
  impact: number;
  /** The α actually used (never above the α the position was bought at). */
  alpha: number;
  qAfter: number[];
  pricesAfter: number[];
}

export interface SellOptions {
  /** The α(V) the position was bought at. Omit when unknown: the sale then uses α = 1 (never in the seller's favour). */
  entryAlpha?: number;
  /** The creator's CREATOR_LADDER rung. Splits the fee; never changes what the seller receives. */
  creatorShareBps?: number;
}

/** Price a sale of `shares` of outcome `outcomeIndex`. Null on unusable input or more shares than the book holds. */
export function sellQuote(book: BookState, outcomeIndex: number, shares: number, opts: SellOptions = {}): SellQuote | null {
  if (!isUsableBook(book)) return null;
  if (!Number.isInteger(outcomeIndex) || outcomeIndex < 0 || outcomeIndex >= book.q.length) return null;
  if (!Number.isFinite(shares) || shares <= 0) return null;
  if (shares > book.q[outcomeIndex]) return null; // cannot return more than is outstanding

  const alphaNow = calculateVolumeScalingAlpha(book.cumVolume);
  const alphaFloor = calculateVolumeScalingAlpha(0);
  const entry = opts.entryAlpha !== undefined && Number.isFinite(opts.entryAlpha) ? Math.max(alphaFloor, opts.entryAlpha) : alphaFloor;
  const alpha = Math.min(alphaNow, entry);
  const b = book.b;

  // Work in LOG space. The proceeds are  α·b·(ln Σ e^(q_j/b) − ln Σ e^(q'_j/b))  with q' = q − s·eᵢ, and both sums are
  // log-sum-exps. Two things this avoids, both found by the round-trip test: (1) computing the 'after' sum as
  // S − Eᵢ + Eᵢ·e^(−s/b) subtracts two nearly equal numbers on a lopsided book and loses the other outcomes' mass
  // (a 0.6% overpayment, which is a free profit); (2) e^(−s/b) underflows to 0 when a big sale is made from a deep
  // book, which made a legitimate sale unquotable.
  const lse = (xs: number[]): number => {
    const mx = xs.reduce((acc, x) => (x > acc ? x : acc), -Infinity);
    if (!Number.isFinite(mx)) return mx;
    return mx + Math.log(xs.reduce((acc, x) => acc + Math.exp(x - mx), 0));
  };
  const logsBefore = book.q.map((qi) => qi / b);
  const logsAfter = book.q.map((qi, j) => (j === outcomeIndex ? qi - shares : qi) / b);
  const grossProceeds = alpha * b * (lse(logsBefore) - lse(logsAfter));
  if (!Number.isFinite(grossProceeds) || grossProceeds <= 0) return null;

  const fee = splitFee(grossProceeds, opts.creatorShareBps ?? 0).grossFee;
  const priceBefore = calculateDLLMSRPrice(book.q[outcomeIndex], book.q, b);
  const qAfter = book.q.slice();
  qAfter[outcomeIndex] = qAfter[outcomeIndex] - shares;
  const pricesAfter = qAfter.map((qi) => calculateDLLMSRPrice(qi, qAfter, b));
  const priceAfter = pricesAfter[outcomeIndex];

  return {
    outcomeIndex,
    outcome: book.outcomes[outcomeIndex],
    shares,
    grossProceeds,
    fee,
    netProceeds: grossProceeds - fee,
    priceBefore,
    priceAfter,
    impact: priceBefore > 0 ? Math.abs(priceAfter - priceBefore) / priceBefore : 0,
    alpha,
    qAfter,
    pricesAfter,
  };
}

/** The book after a sale. Turnover rises by the gross proceeds, like a buy raises it by the spend. */
export function bookAfterSell(book: BookState, q: SellQuote): BookState {
  return { ...book, q: q.qAfter, cumVolume: book.cumVolume + q.grossProceeds };
}
