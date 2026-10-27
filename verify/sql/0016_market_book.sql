-- MAD Gambit — the market book: DL-LMSR state, the price tape, and priced fills.
--
-- WHY THIS EXISTS
--
-- The pricing engine has been correct and unused. `calculateDLLMSRCost` and
-- `calculateDLLMSRPrice` (lib/gambit-game-math.ts) implement a volume-scaled
-- DL-LMSR properly, and until now their ONLY caller in the entire repo was a
-- client-side preview widget. No route, no cron and no write path had ever
-- invoked them, because there was nowhere to put the result: no share vector,
-- no liquidity parameter and no volume were persisted for any market.
--
-- The visible consequences were all downstream of that one gap:
--
--   * `markets.yes_odds` / `no_odds` default to 2.0 (0007) and NO code path
--     anywhere issued `UPDATE markets SET yes_odds`. Every market showed
--     2.00x / 2.00x forever, and `deVig([2.0, 2.0])` is exactly 50/50, so
--     every card read as a coin flip.
--   * There was no price history, so lib/market-view.ts derived `series` from
--     a seeded FNV-1a random walk and said so in its own header.
--   * Open interest was not a column. It was read from a JSONB key that only a
--     hard-coded component array ever wrote.
--
-- This migration adds the missing state. It does not change any maths.
--
-- SHAPE NOTES
--
-- `q` is JSONB rather than NUMERIC[] to match the house convention for ordered
-- open-ended vectors (`corpus`, `sources`, `face_scores` in 0012), and because
-- outcome arity is per-market: binary today, n-ary when a market has more than
-- two outcomes. `outcomes` carries the labels in the same order, so index i in
-- `q` is always outcome i — nothing infers position from a name.
--
-- `sigma` / `last_shock` carry GARCH(1,1) filter state forward across fills the
-- same way `faces_simplex.filter_state` carries it across legs (0012). Without
-- it, volatility restarts from the floor on every trade.
--
-- TWO DIFFERENT MEANINGS OF "VOLUME", DELIBERATELY KEPT APART:
--   `market_book.cum_volume` is MONOTONIC TURNOVER — it only ever increases,
--   because it feeds alpha(V) = 1 + 0.05*log10(1+V), which must not fall when
--   someone exits. It matches `markets.volume` (0007), also cumulative.
--   `perp_markets.volume` (0012) is NET OPEN CONVICTION and is decremented by
--   `redeemPosition`. They are not the same quantity. Do not sum them.
--
-- `bets` gains the priced-fill columns rather than a parallel `market_fills`
-- table: a swap IS a bet that also records how many shares it bought and what
-- it moved the price to. Reusing the table means `listBetsByWallet` already
-- reads fills, and the existing real aggregate in api/v1/dopamine/metrics
-- (`SELECT sum(amount) FROM bets WHERE created_at > now() - interval '24 hours'`)
-- starts returning a true number instead of zero. Nullable on purpose — rows
-- written by `placeBet` before this migration have no share leg, and backfilling
-- one would be inventing history.
--
-- FK-free and app-enforced, consistent with 0007 and 0012: `market_id` may point
-- at `markets.id` or `perp_markets.id`, which is what `venue` disambiguates.
--
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS market_book (
  market_id      TEXT PRIMARY KEY,                  -- → markets.id | perp_markets.id (app-enforced)
  venue          TEXT NOT NULL DEFAULT 'binary',    -- binary | perp — which table market_id refers to
  outcomes       JSONB NOT NULL DEFAULT '["YES","NO"]'::jsonb,  -- ordered labels; index-aligned with q
  q              JSONB NOT NULL DEFAULT '[0,0]'::jsonb,         -- share vector; q[i] ↔ outcomes[i]
  b              NUMERIC NOT NULL DEFAULT 1200,     -- DL-LMSR liquidity (PLATFORM.LMSR_DEFAULT_B)
  cum_volume     NUMERIC NOT NULL DEFAULT 0,        -- MONOTONIC turnover — feeds α(V), never decremented
  open_interest  NUMERIC NOT NULL DEFAULT 0,        -- Σq, shares outstanding
  sigma          NUMERIC NOT NULL DEFAULT 0.09,     -- GARCH σ, carried across fills (PLATFORM.SIGMA_MIN)
  last_shock     NUMERIC NOT NULL DEFAULT 0,        -- GARCH previous shock
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_market_book_venue ON market_book (venue);

-- Append-only tape. One row per fill, so the series a chart draws is the actual
-- sequence of prices the book traded at — not a reconstruction.
CREATE TABLE IF NOT EXISTS market_prices (
  id             BIGSERIAL PRIMARY KEY,
  market_id      TEXT NOT NULL,
  ts             TIMESTAMPTZ NOT NULL DEFAULT now(),
  prices         JSONB NOT NULL,                    -- {"YES":0.53,"NO":0.47} — keyed by OUTCOME LABEL, not index,
                                                    --   so a stored row stays readable if a book's arity changes
  mark           NUMERIC NOT NULL,                  -- headline probability 0..1 (outcome 0) — what `series` plots
  cum_volume     NUMERIC NOT NULL DEFAULT 0,
  open_interest  NUMERIC NOT NULL DEFAULT 0,
  sigma          NUMERIC
);
CREATE INDEX IF NOT EXISTS idx_market_prices_market_ts ON market_prices (market_id, ts DESC);

-- The share leg of a fill. Nullable: pre-existing rows have no share leg.
ALTER TABLE bets
  ADD COLUMN IF NOT EXISTS shares      NUMERIC,
  ADD COLUMN IF NOT EXISTS cost        NUMERIC,
  ADD COLUMN IF NOT EXISTS fee         NUMERIC,
  ADD COLUMN IF NOT EXISTS price_after NUMERIC;
