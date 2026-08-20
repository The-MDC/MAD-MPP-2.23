-- MAD Gambit — Prediction-market ledger (Part W) — Neon Postgres migration
-- The actual markets/bets backbone: user-created prediction markets, the bets
-- placed on them, and an append-only audit log. Raw SQL on Neon (no Prisma/ORM),
-- consistent with the rest of the schema (wallet-keyed, FK-free, JSONB details).
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS markets (
  id             TEXT PRIMARY KEY,               -- slug / cuid
  title          TEXT NOT NULL,
  category       TEXT NOT NULL DEFAULT 'general',
  description    TEXT,
  creator_wallet VARCHAR(42),
  yes_odds       NUMERIC NOT NULL DEFAULT 2.0,   -- decimal odds
  no_odds        NUMERIC NOT NULL DEFAULT 2.0,
  status         TEXT NOT NULL DEFAULT 'open',   -- open | resolving | resolved | disputed
  outcome        TEXT,                           -- 'YES' | 'NO' | null (until resolved)
  volume         NUMERIC NOT NULL DEFAULT 0,     -- cumulative $MADx wagered
  resolution_at  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_markets_status   ON markets (status);
CREATE INDEX IF NOT EXISTS idx_markets_category ON markets (category);

CREATE TABLE IF NOT EXISTS bets (
  id             BIGSERIAL PRIMARY KEY,
  market_id      TEXT NOT NULL,                  -- → markets.id (FK-free, app-enforced)
  wallet_address VARCHAR(42) NOT NULL,
  side           TEXT NOT NULL,                  -- 'YES' | 'NO'
  amount         NUMERIC NOT NULL,
  odds_at_bet    NUMERIC NOT NULL DEFAULT 0,     -- decimal odds captured at bet time
  status         TEXT NOT NULL DEFAULT 'pending',-- pending | won | lost | cancelled
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bets_market ON bets (market_id);
CREATE INDEX IF NOT EXISTS idx_bets_wallet ON bets (wallet_address);

CREATE TABLE IF NOT EXISTS audit_log (
  id             BIGSERIAL PRIMARY KEY,
  entity_type    TEXT NOT NULL,                  -- 'market' | 'bet' | ...
  entity_id      TEXT NOT NULL,
  action         TEXT NOT NULL,                  -- 'create' | 'bet' | 'resolve' | ...
  details        JSONB NOT NULL DEFAULT '{}',
  wallet_address VARCHAR(42),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log (entity_type, entity_id);
