-- MAD Gambit — Card Evolution (Part V) — Neon Postgres migration
-- Living MADCards: virtual, off-chain stats that evolve through battles /
-- predictions / saga contributions, only minted on-chain at max level (L3+).
-- Raw-SQL port of the handoff's Drizzle schema (we run raw pg, no ORM).
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS card_stats (
  id                 TEXT PRIMARY KEY,           -- UUID / serial / card_uid
  owner              TEXT NOT NULL,              -- wallet or userId
  name               TEXT,
  faction            TEXT,
  evolution_level    INTEGER NOT NULL DEFAULT 1, -- 1..4 (4 = Mythic/Saga-Legendary)
  wins               INTEGER NOT NULL DEFAULT 0,
  losses             INTEGER NOT NULL DEFAULT 0,
  net_performance    NUMERIC NOT NULL DEFAULT 0, -- wins − losses·1.2
  scandal_meter      NUMERIC NOT NULL DEFAULT 0, -- 0..100
  buzz_score         NUMERIC NOT NULL DEFAULT 0, -- 0..1000+
  special_abilities  JSONB   NOT NULL DEFAULT '[]',
  is_clown           BOOLEAN NOT NULL DEFAULT false, -- temporary degeneration
  clown_until        TIMESTAMPTZ,
  is_minted          BOOLEAN NOT NULL DEFAULT false, -- hard gate: mint only at L3+
  token_id           TEXT,
  metadata_uri       TEXT,
  saga_contributions JSONB   NOT NULL DEFAULT '{}',
  last_evolution_ts  TIMESTAMPTZ,
  virtual_seed       TEXT,                       -- from pack open (VRF)
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_card_stats_owner ON card_stats (owner);
CREATE INDEX IF NOT EXISTS idx_card_stats_level ON card_stats (evolution_level);
