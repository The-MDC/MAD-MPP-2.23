/**
 * MAD Gambit — persistence for the market book.
 * ────────────────────────────────────────────────────────────────
 * Raw `pg` + typed mappers, no ORM — ADR-008. Follows lib/markets.ts and
 * lib/perp-store.ts: the Pool is passed in rather than imported, so this module
 * stays testable and the route handler owns the connection.
 *
 * The maths lives next door in lib/lmsr-book.ts, which is pure and has no `pg`
 * import at all. That split is deliberate: the CLIENT imports the solver to
 * preview a trade, and only the server imports this file to settle one. A
 * single module would drag `pg` types into the browser bundle and let the
 * preview drift from the fill.
 *
 * ONE INVARIANT THIS LAYER OWNS, because SQL cannot express it:
 *
 *   A FILL IS ONE TRANSACTION. Debiting the buyer, advancing the share vector,
 *   recording the bet, appending to the tape and writing the odds back are the
 *   same event. The book row is taken with SELECT … FOR UPDATE and the quote is
 *   recomputed against the LOCKED state — never against whatever the client was
 *   shown — so two concurrent fills serialise instead of both pricing off the
 *   same stale q. The client's quote is a preview; this is the settlement.
 */
import type { Pool, PoolClient } from "pg";
import { PLATFORM, garchSigma } from "@/lib/gambit-game-math";
import { spendWithin } from "@/lib/madx-web2";
import {
  bookPrices,
  isUsableBook,
  markOf,
  oddsFromPrice,
  quote,
  type BookState,
  type Quote,
} from "@/lib/lmsr-book";

export type BookVenue = "binary" | "perp";

export interface MarketBook extends BookState {
  marketId: string;
  venue: BookVenue;
  openInterest: number;
  sigma: number;
  lastShock: number;
  updatedAt: string | null;
}

export interface FillResult {
  quote: Quote;
  book: MarketBook;
  betId: number;
  /** Every outcome's price after the fill, index-aligned with `book.outcomes`. */
  prices: number[];
}

export type FillFailure =
  | "no-book"
  | "unusable-book"
  | "bad-outcome"
  | "bad-amount"
  | "insufficient-balance";

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const toIso = (v: Date | string | null): string | null =>
  v == null ? null : v instanceof Date ? v.toISOString() : String(v);

/** `pg` hands back JSONB already parsed; be defensive about the string case. */
function jsonArray(v: unknown): unknown[] {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

interface RawBookRow {
  market_id: string;
  venue: string;
  outcomes: unknown;
  q: unknown;
  b: unknown;
  cum_volume: unknown;
  open_interest: unknown;
  sigma: unknown;
  last_shock: unknown;
  updated_at: Date | string | null;
}

function mapBook(r: RawBookRow): MarketBook {
  return {
    marketId: r.market_id,
    venue: r.venue === "perp" ? "perp" : "binary",
    outcomes: jsonArray(r.outcomes).map((o) => String(o)),
    q: jsonArray(r.q).map((n) => num(n)),
    b: num(r.b),
    cumVolume: num(r.cum_volume),
    openInterest: num(r.open_interest),
    sigma: num(r.sigma),
    lastShock: num(r.last_shock),
    updatedAt: toIso(r.updated_at),
  };
}

const SELECT_BOOK = `SELECT * FROM market_book WHERE market_id = $1`;

export async function getBook(pool: Pool, marketId: string): Promise<MarketBook | null> {
  const res = await pool.query(SELECT_BOOK, [marketId]);
  return res.rows[0] ? mapBook(res.rows[0] as RawBookRow) : null;
}

/**
 * Open a book for a market, or return the one it already has.
 *
 * `ON CONFLICT DO NOTHING` then re-select, rather than DO UPDATE: re-seeding a
 * book that already has trades on it would silently erase the share vector, and
 * "make sure this market has a book" must never be able to do that.
 */
export async function ensureBook(
  pool: Pool,
  marketId: string,
  opts: { venue?: BookVenue; outcomes?: string[]; b?: number } = {},
): Promise<MarketBook> {
  const outcomes = opts.outcomes && opts.outcomes.length > 0 ? opts.outcomes : ["YES", "NO"];
  const b = opts.b && opts.b > 0 ? opts.b : PLATFORM.LMSR_DEFAULT_B;
  await pool.query(
    `INSERT INTO market_book (market_id, venue, outcomes, q, b, sigma)
     VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, $6)
     ON CONFLICT (market_id) DO NOTHING`,
    [
      marketId,
      opts.venue ?? "binary",
      JSON.stringify(outcomes),
      JSON.stringify(outcomes.map(() => 0)),
      b,
      PLATFORM.SIGMA_MIN,
    ],
  );
  const book = await getBook(pool, marketId);
  if (!book) throw new Error("market book create failed");
  return book;
}

/**
 * The price tape, oldest → newest, capped at `points`.
 *
 * Inner DESC + LIMIT then outer ASC — the shape lib/perp-store.ts:simplexHistory
 * already uses. Ordering ASC first and limiting would return the OLDEST n rows
 * and pin every chart to the market's opening week forever.
 */
export async function priceHistory(pool: Pool, marketId: string, points = 24): Promise<number[]> {
  const limit = Math.max(1, Math.min(500, Math.floor(points)));
  const res = await pool.query(
    `SELECT mark FROM (
       SELECT mark, ts FROM market_prices WHERE market_id = $1 ORDER BY ts DESC LIMIT $2
     ) t ORDER BY ts ASC`,
    [marketId, limit],
  );
  return res.rows.map((r) => num((r as { mark: unknown }).mark));
}

/** Latest tape row per market, for a rail that renders many cards at once. */
export async function priceHistoryFor(
  pool: Pool,
  marketIds: string[],
  points = 24,
): Promise<Map<string, number[]>> {
  const out = new Map<string, number[]>();
  if (marketIds.length === 0) return out;
  const limit = Math.max(1, Math.min(500, Math.floor(points)));
  const res = await pool.query(
    `SELECT market_id, mark FROM (
       SELECT market_id, mark, ts,
              row_number() OVER (PARTITION BY market_id ORDER BY ts DESC) AS rn
       FROM market_prices WHERE market_id = ANY($1::text[])
     ) t WHERE rn <= $2 ORDER BY market_id, ts ASC`,
    [marketIds, limit],
  );
  for (const row of res.rows as Array<{ market_id: string; mark: unknown }>) {
    const list = out.get(row.market_id) ?? [];
    list.push(num(row.mark));
    out.set(row.market_id, list);
  }
  return out;
}

export interface FillInput {
  marketId: string;
  walletAddress: string;
  outcomeIndex: number;
  /** Gross $MADx the buyer pays, fee inclusive. */
  spend: number;
  /** The creator's CREATOR_LADDER rung. Splits the fee; never changes the price. */
  creatorShareBps?: number;
}

/**
 * Settle a buy against the book. One transaction, or nothing.
 *
 * Returns a `FillFailure` string rather than throwing for the outcomes a caller
 * must turn into a 4xx — a short balance is not a server error, and throwing
 * would make it a 500.
 */
export async function fill(pool: Pool, input: FillInput): Promise<FillResult | FillFailure> {
  const wallet = input.walletAddress.trim().toLowerCase();
  if (!Number.isFinite(input.spend) || input.spend <= 0) return "bad-amount";

  const client: PoolClient = await pool.connect();
  try {
    await client.query("BEGIN");

    // Lock the book. Everything below prices against THIS row, not against
    // whatever the client had on screen.
    const locked = await client.query(`${SELECT_BOOK} FOR UPDATE`, [input.marketId]);
    if (!locked.rows[0]) {
      await client.query("ROLLBACK");
      return "no-book";
    }
    const book = mapBook(locked.rows[0] as RawBookRow);
    if (!isUsableBook(book)) {
      await client.query("ROLLBACK");
      return "unusable-book";
    }

    const q = quote(book, input.outcomeIndex, input.spend, input.creatorShareBps ?? 0);
    if (!q) {
      await client.query("ROLLBACK");
      return "bad-outcome";
    }

    const paid = await spendWithin(
      client,
      wallet,
      input.spend,
      `swap ${input.marketId} ${q.outcome}`,
    );
    if (!paid) {
      await client.query("ROLLBACK");
      return "insufficient-balance";
    }

    const openInterest = q.qAfter.reduce((s, n) => s + n, 0);
    const cumVolume = book.cumVolume + input.spend;

    // GARCH σ advances on the realised price move, so volatility reflects what
    // the book actually did rather than restarting from the floor each trade.
    // `garchSigma` is the canon σ→σ tick with the canon (ω, α, β) and clamp —
    // do not re-derive it here, the canon-lock suite asserts those constants.
    const shock = q.priceAfter - q.priceBefore;
    const sigma = garchSigma(book.sigma, shock);

    const updated = await client.query(
      `UPDATE market_book
          SET q = $2::jsonb, cum_volume = $3, open_interest = $4,
              sigma = $5, last_shock = $6, updated_at = now()
        WHERE market_id = $1
      RETURNING *`,
      [input.marketId, JSON.stringify(q.qAfter), cumVolume, openInterest, sigma, shock],
    );

    const bet = await client.query(
      `INSERT INTO bets (market_id, wallet_address, side, amount, odds_at_bet,
                         shares, cost, fee, price_after)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        input.marketId,
        wallet,
        q.outcome,
        input.spend,
        oddsFromPrice(q.priceBefore),
        q.shares,
        q.netIn,
        q.fee,
        q.priceAfter,
      ],
    );

    const priceMap: Record<string, number> = {};
    book.outcomes.forEach((label, i) => {
      priceMap[label] = q.pricesAfter[i];
    });
    await client.query(
      `INSERT INTO market_prices (market_id, prices, mark, cum_volume, open_interest, sigma)
       VALUES ($1, $2::jsonb, $3, $4, $5, $6)`,
      [
        input.marketId,
        JSON.stringify(priceMap),
        markOf(q.pricesAfter),
        cumVolume,
        openInterest,
        sigma,
      ],
    );

    // Write the odds back so every surface that already reads `markets.yes_odds`
    // starts telling the truth with no change of its own. Binary books only —
    // a perp has no yes/no columns to write.
    if (book.venue === "binary" && q.pricesAfter.length >= 2) {
      await client.query(
        `UPDATE markets
            SET yes_odds = $2, no_odds = $3, volume = volume + $4, updated_at = now()
          WHERE id = $1`,
        [
          input.marketId,
          oddsFromPrice(q.pricesAfter[0]),
          oddsFromPrice(q.pricesAfter[1]),
          input.spend,
        ],
      );
    }

    await client.query("COMMIT");

    const after = mapBook(updated.rows[0] as RawBookRow);
    return {
      quote: q,
      book: after,
      betId: Number((bet.rows[0] as { id: unknown }).id),
      prices: bookPrices(after),
    };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

