-- MAD Gambit — Data Platform (V1) — Neon Postgres migration
-- Applied via the Neon PR-branch workflow / Cursor (raw SQL; Drizzle deferred).
-- Idempotent: safe to re-run.

-- ── Real-time event stream (DB spec §3) ──────────────────────────────
CREATE TABLE IF NOT EXISTS events_stream (
  id             BIGSERIAL PRIMARY KEY,
  event_type     TEXT NOT NULL,
  wallet_address VARCHAR(42),
  session_id     TEXT,
  payload        JSONB NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_events_stream_created ON events_stream (created_at);
CREATE INDEX IF NOT EXISTS idx_events_stream_type    ON events_stream (event_type);
CREATE INDEX IF NOT EXISTS idx_events_stream_wallet  ON events_stream (wallet_address);

-- ── CDP profiles (DB spec §4) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cdp_profiles (
  wallet_address VARCHAR(42) PRIMARY KEY,
  first_seen     TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen      TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_count    BIGINT NOT NULL DEFAULT 0,
  traits         JSONB NOT NULL DEFAULT '{}',
  segments       JSONB NOT NULL DEFAULT '[]'
);

-- ── Analytics aggregation (DB spec §5) ───────────────────────────────
CREATE TABLE IF NOT EXISTS agg_platform_hourly (
  bucket         TIMESTAMPTZ PRIMARY KEY,     -- hour, truncated
  events         BIGINT NOT NULL DEFAULT 0,
  unique_wallets BIGINT NOT NULL DEFAULT 0,
  by_type        JSONB NOT NULL DEFAULT '{}',
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agg_user_daily (
  wallet_address VARCHAR(42) NOT NULL,
  day            DATE NOT NULL,
  events         BIGINT NOT NULL DEFAULT 0,
  by_type        JSONB NOT NULL DEFAULT '{}',
  PRIMARY KEY (wallet_address, day)
);
