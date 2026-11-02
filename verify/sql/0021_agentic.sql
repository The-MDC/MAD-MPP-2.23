-- MAD Gambit — agentic root (lib/agentic). Tables exist so the feature can be wired without a schema change; nothing
-- writes trades yet. One subscription and one mandate per wallet; every agent intent is kept as an audit trail.
-- Idempotent.

CREATE TABLE IF NOT EXISTS agent_subscriptions (
  wallet_address VARCHAR(42) PRIMARY KEY,
  tier           TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free','analyst','copilot','autopilot')),
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','cancelled')),
  started_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  renews_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS agent_mandates (
  wallet_address VARCHAR(42) PRIMARY KEY,
  max_order      NUMERIC NOT NULL DEFAULT 0,
  daily_budget   NUMERIC NOT NULL DEFAULT 0,
  market_kinds   JSONB NOT NULL DEFAULT '[]',
  categories     JSONB NOT NULL DEFAULT '[]',
  expires_at     TIMESTAMPTZ NOT NULL,
  revoked        BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_intents (
  id             BIGSERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  agent_id       TEXT NOT NULL,
  market_id      TEXT NOT NULL,
  side           TEXT NOT NULL,
  amount         NUMERIC NOT NULL,
  rationale      TEXT,
  nonce          TEXT NOT NULL UNIQUE,
  status         TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed','approved','rejected','executed','expired')),
  reasons        JSONB NOT NULL DEFAULT '[]',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS agent_intents_wallet ON agent_intents (wallet_address, created_at DESC);
