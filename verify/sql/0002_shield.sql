-- MAD Gambit — MAD Shield (Part P) — Neon Postgres migration
-- Records Shield opt-in intent + return-window state. Value movement itself is
-- on-chain (MADShieldVault.sol, Phase-3 gated) — this table is the off-chain
-- ledger the product surface reads. Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS shield_positions (
  id                   BIGSERIAL PRIMARY KEY,
  wallet_address       VARCHAR(42) NOT NULL,
  position_ref         TEXT,                       -- optional link to a market/position
  tier                 TEXT NOT NULL,              -- 'standard' | 'shielded' | 'whale'
  premium_tier         NUMERIC NOT NULL DEFAULT 0, -- 0..1 dial (shielded tier)
  stake_amount         NUMERIC NOT NULL,
  premium_paid         NUMERIC NOT NULL DEFAULT 0, -- $MADx premium charged at opt-in
  status               TEXT NOT NULL DEFAULT 'active', -- 'active'|'unstaking'|'returned'
  staked_at            TIMESTAMPTZ,
  unstake_requested_at TIMESTAMPTZ,
  estimated_return_at  TIMESTAMPTZ,
  return_window_hours  INTEGER NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shield_positions_wallet ON shield_positions (wallet_address);
CREATE INDEX IF NOT EXISTS idx_shield_positions_status ON shield_positions (status);
