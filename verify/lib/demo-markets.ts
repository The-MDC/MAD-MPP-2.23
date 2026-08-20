/**
 * MAD Gambit — the demo prediction book.
 * ══════════════════════════════════════════════════════════════════
 * ONE source for the demo markets the hub shows before a live book
 * exists. Three surfaces render these — the featured cards, the
 * prediction rail, and the Seiko hub's featured panel — and until this
 * file they each carried their own copy of the same three questions.
 *
 * That drift was not hypothetical: the Elon market read "in 2024" in two
 * components and "in 2026" in the third, so the hub simultaneously
 * advertised a market that had already resolved two years earlier and
 * one that had not. Copy lives here now; surfaces format it.
 *
 * Two rules keep it from re-diverging:
 *   1. Questions are stored in SENTENCE case. A surface that wants caps
 *      applies `textTransform`, because a display choice baked into the
 *      data is a display choice the next surface has to guess at.
 *   2. Odds are numbers, rendered through `odds()`. Formatting them by
 *      hand is what produced "3x" on one rail and "3.0x" on another for
 *      the identical book.
 */

export interface DemoMarket {
  id: string;
  /** Sentence case — surfaces uppercase at the display layer, never here. */
  question: string;
  /** Decimal odds. */
  yes: number;
  no: number;
  /** Demo pool size, for the surfaces that show one. */
  pool?: string;
  hot?: boolean;
}

/** Decimal odds to one place: "3x" and "3.0x" must not be the same book twice. */
export function odds(n: number): string {
  return `${n.toFixed(1)}x`;
}

export const DEMO_PREDICTION_MARKETS: DemoMarket[] = [
  { id: "em1", question: "Will Elon buy another company in 2026?", yes: 2.5, no: 1.4, pool: "142.9K", hot: true },
  { id: "em2", question: "Bitcoin to hit $100K by EOY?", yes: 1.9, no: 1.8, pool: "88.5K", hot: false },
  { id: "em3", question: "AI surpasses human IQ by 2030?", yes: 3.0, no: 1.2, pool: "51.2K", hot: true },
  { id: "em4", question: "Major exchange fails this quarter?", yes: 3.4, no: 1.2 },
  { id: "em5", question: "New meme coin cracks top 10?", yes: 2.1, no: 1.7 },
];

/** The three the hub features up front. */
export const FEATURED_DEMO_MARKETS: DemoMarket[] = DEMO_PREDICTION_MARKETS.slice(0, 3);
