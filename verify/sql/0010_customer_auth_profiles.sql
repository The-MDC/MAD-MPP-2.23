-- MAD Gambit — Customer auth/profile backbone (SIWE + Neon)
--
-- Secure customer login/profile storage for the current repo architecture:
-- wallet-first SIWE auth, signed httpOnly sessions, and Neon as the canonical
-- durable store. No passwords or raw session tokens are stored here.
-- Idempotent: safe to re-run.

-- Durable SIWE nonce store used by verify/lib/nonce-store.ts.
CREATE TABLE IF NOT EXISTS siwe_nonces (
  nonce      TEXT PRIMARY KEY,
  issued_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_siwe_nonces_issued ON siwe_nonces (issued_at);

-- One row per customer wallet. Profile/preferences are JSONB so the product can
-- evolve without a migration for every profile field, while keeping the wallet
-- identity and lifecycle indexed.
CREATE TABLE IF NOT EXISTS customer_accounts (
  wallet_address VARCHAR(42) PRIMARY KEY,
  chain_id       INTEGER NOT NULL,
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  profile        JSONB NOT NULL DEFAULT '{}',
  preferences    JSONB NOT NULL DEFAULT '{}',
  first_seen     TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at  TIMESTAMPTZ,
  login_count    BIGINT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT customer_accounts_wallet_format CHECK (wallet_address ~ '^0x[0-9a-f]{40}$')
);
CREATE INDEX IF NOT EXISTS idx_customer_accounts_status ON customer_accounts (status);
CREATE INDEX IF NOT EXISTS idx_customer_accounts_last_login ON customer_accounts (last_login_at DESC);

-- Append-only successful login audit. Store only coarse metadata and hashes; do
-- not persist raw IP addresses, auth headers, signatures, or session tokens.
CREATE TABLE IF NOT EXISTS customer_login_events (
  id              BIGSERIAL PRIMARY KEY,
  wallet_address  VARCHAR(42) NOT NULL,
  chain_id        INTEGER NOT NULL,
  domain          TEXT,
  user_agent_hash TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_customer_login_events_wallet ON customer_login_events (wallet_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_login_events_created ON customer_login_events (created_at DESC);

-- Append-only profile-change audit. The application can write field-level diffs
-- here when profile editing ships; keeping this table now reserves the secure
-- structure without exposing sensitive profile details in logs.
CREATE TABLE IF NOT EXISTS customer_profile_audit (
  id              BIGSERIAL PRIMARY KEY,
  wallet_address  VARCHAR(42) NOT NULL,
  actor_wallet    VARCHAR(42),
  action          TEXT NOT NULL,
  changes         JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_customer_profile_audit_wallet ON customer_profile_audit (wallet_address, created_at DESC);
