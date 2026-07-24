-- Web2 $MADx (Beta) credit ledger.
-- Mirrors the on-chain fair-launch token (MADDEX / "MADx", 18-dec, hard cap
-- 224,573,096, mint-on-demand — see docs/MECHANISM_ORACLE_MADX_RESEARCH.md) as
-- an off-chain, Neon-backed credit system so the beta is fully functional before
-- the on-chain token has circulating supply. These are BETA CREDITS (labelled as
-- such in the UI), intended to redeem 1:1 for on-chain $MADx at TGE (placeholder).

CREATE TABLE IF NOT EXISTS madx_accounts (
  owner            TEXT PRIMARY KEY,
  balance          NUMERIC(30, 6) NOT NULL DEFAULT 0,   -- liquid beta credits
  staked           NUMERIC(30, 6) NOT NULL DEFAULT 0,   -- staked (drives tier + APY)
  reward_accrued   NUMERIC(30, 6) NOT NULL DEFAULT 0,   -- settled, unclaimed rewards
  last_accrual_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  onboarded_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS madx_ledger (
  id            BIGSERIAL PRIMARY KEY,
  owner         TEXT NOT NULL,
  counterparty  TEXT,
  kind          TEXT NOT NULL CHECK (kind IN
                  ('welcome','buy','transfer_in','transfer_out','stake','unstake','claim','spend','refund')),
  amount        NUMERIC(30, 6) NOT NULL,
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_madx_ledger_owner ON madx_ledger (owner, created_at DESC);

-- Singleton mint-to-cap tracker (mirrors the on-chain maxTotalSupply semantics).
CREATE TABLE IF NOT EXISTS madx_supply (
  id            INT PRIMARY KEY DEFAULT 1,
  total_minted  NUMERIC(30, 6) NOT NULL DEFAULT 0,
  CONSTRAINT madx_supply_singleton CHECK (id = 1)
);
INSERT INTO madx_supply (id, total_minted) VALUES (1, 0) ON CONFLICT (id) DO NOTHING;
