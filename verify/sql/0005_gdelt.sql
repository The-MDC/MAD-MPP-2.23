-- MAD Gambit — GDELT signal pipeline (Part S build) — Neon Postgres migration
-- Serverless-native replacement for the (impossible-on-Vercel) eBPF/chokidar
-- file watcher: the celebrity whitelist lives here and is read per-request.
-- gdelt_signals stores scored scandal signals that can trigger Perp markets.
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS celebrity_whitelist (
  name         TEXT PRIMARY KEY,          -- lowercased, normalized
  display_name TEXT,
  added_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gdelt_signals (
  id                   BIGSERIAL PRIMARY KEY,
  headline             TEXT,
  url                  TEXT,
  persons              JSONB NOT NULL DEFAULT '[]',   -- matched whitelisted celebs
  themes               JSONB NOT NULL DEFAULT '[]',
  person_matches       INTEGER NOT NULL DEFAULT 0,
  theme_scandal_weight NUMERIC NOT NULL DEFAULT 0,
  scandal_velocity     NUMERIC NOT NULL DEFAULT 0,
  perp_probability     NUMERIC NOT NULL DEFAULT 0,    -- 0..1 Perp-market trigger
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gdelt_signals_created ON gdelt_signals (created_at);
CREATE INDEX IF NOT EXISTS idx_gdelt_signals_perp    ON gdelt_signals (perp_probability);
