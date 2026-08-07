-- MAD Gambit — Card Lifecycle (Part Q) — Neon Postgres migration
-- Card ownership ledger: persists collected cards + their lifecycle state
-- (durability wear + evolution stage). Pack GENERATION already exists
-- (openCardPack / /api/v1/cards/open-pack); this closes the gap after
-- acquisition — own → wear → evolve. Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS cards (
  id              BIGSERIAL PRIMARY KEY,
  wallet_address  VARCHAR(42) NOT NULL,
  card_uid        TEXT NOT NULL,               -- generateCard id, e.g. "card_5_888"
  name            TEXT NOT NULL DEFAULT '',
  rarity          TEXT NOT NULL,               -- Common..Mythic (RARITY_ORDER)
  faction         TEXT NOT NULL DEFAULT '',
  serial          INTEGER NOT NULL DEFAULT 0,
  durability      NUMERIC NOT NULL DEFAULT 1,  -- 0..1 (usage wear floors at 0)
  evolution_stage INTEGER NOT NULL DEFAULT 1,  -- 1..3 (attemptEvolution hard cap)
  xp              INTEGER NOT NULL DEFAULT 0,
  earns_count     NUMERIC NOT NULL DEFAULT 0,  -- lifetime $MADx earned by this card
  uses            INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cards_wallet ON cards (wallet_address);
CREATE INDEX IF NOT EXISTS idx_cards_rarity ON cards (rarity);
