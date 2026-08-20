-- MAD Gambit — ZEITGEIST slot auction (§11.3).
--
-- Nomination pool, sealed bids, reveals, and the cleared result. One auction per
-- Turning; it runs inside the last leg before the slate reseeds.
--
-- WHY THE COMMITMENT IS THE UNIQUE KEY AND NOT (auction, bidder): a bidder may
-- legitimately hold several sealed bids on different trends, and the auction
-- cannot tell which is which until reveal — that is the entire point of sealing
-- them. Keying on the bidder would leak the bid count, which is itself a signal.

CREATE TABLE IF NOT EXISTS slot_auctions (
  id             BIGSERIAL PRIMARY KEY,
  vintage        INTEGER NOT NULL,                -- the slate this auction fills
  slots          INTEGER NOT NULL DEFAULT 3,      -- VOI-driven 2-or-3
  start_price    NUMERIC NOT NULL,
  reserve_price  NUMERIC NOT NULL,
  shape          TEXT NOT NULL DEFAULT 'exponential', -- exponential | linear
  opens_at       TIMESTAMPTZ NOT NULL,
  commit_opens_at TIMESTAMPTZ NOT NULL,
  reveal_opens_at TIMESTAMPTZ NOT NULL,
  closes_at      TIMESTAMPTZ NOT NULL,
  -- Set only once the auction has cleared. Null is "not cleared", which is
  -- distinguishable from "cleared at zero" — a distinction a boolean would lose.
  clearing_price NUMERIC,
  cleared_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_auction_vintage ON slot_auctions (vintage);
CREATE INDEX IF NOT EXISTS idx_auction_open ON slot_auctions (closes_at) WHERE cleared_at IS NULL;

-- ── Nomination pool — EigenTrust-weighted ───────────────────────────────────
CREATE TABLE IF NOT EXISTS slot_nominations (
  id             BIGSERIAL PRIMARY KEY,
  auction_id     BIGINT NOT NULL,
  trend_key      TEXT NOT NULL,
  trend_name     TEXT NOT NULL,
  nominator      VARCHAR(42) NOT NULL,
  -- Computed at write time from the nominator's engagement history. Stored
  -- because it is the weight the pool was actually built with — recomputing it
  -- later against a changed history would silently rewrite a past auction.
  trust_weight   NUMERIC NOT NULL DEFAULT 0,
  corpus         JSONB NOT NULL DEFAULT '[]',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- One nomination per nominator per trend. Re-nominating is not extra weight.
CREATE UNIQUE INDEX IF NOT EXISTS idx_nomination_unique
  ON slot_nominations (auction_id, trend_key, nominator);
CREATE INDEX IF NOT EXISTS idx_nomination_auction ON slot_nominations (auction_id, trust_weight DESC);

-- ── Sealed bids ─────────────────────────────────────────────────────────────
-- Holds the COMMITMENT only. No amount column, deliberately: an amount stored
-- here before reveal would make the seal decorative, and an operator who can
-- read the database could front-run the auction they are running.
CREATE TABLE IF NOT EXISTS slot_bids (
  id             BIGSERIAL PRIMARY KEY,
  auction_id     BIGINT NOT NULL,
  bidder         VARCHAR(42) NOT NULL,
  trend_key      TEXT NOT NULL,
  commitment     TEXT NOT NULL,                   -- sha256(bidder|trend|amount|salt)
  deposit        NUMERIC NOT NULL DEFAULT 0,
  committed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Reveal fields, all null until the reveal phase.
  revealed_amount NUMERIC,
  revealed_salt  TEXT,
  revealed_at    TIMESTAMPTZ,
  status         TEXT NOT NULL DEFAULT 'sealed',  -- sealed | revealed | invalid | forfeited | won
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bid_commitment ON slot_bids (auction_id, commitment);
CREATE INDEX IF NOT EXISTS idx_bid_auction ON slot_bids (auction_id, status);
CREATE INDEX IF NOT EXISTS idx_bid_bidder ON slot_bids (bidder);
