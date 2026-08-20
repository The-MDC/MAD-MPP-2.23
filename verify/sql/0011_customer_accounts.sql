-- MAD Gambit — Customer account state + auth/profile ledgers
--
-- The system-owned half of customer identity. Identity itself is the wallet
-- address, established by SIWE in 0010_auth_identity.sql; this file adds what
-- the *system* observes and asserts about an account, kept separate from what
-- the *user* asserts about themselves (user_profiles, 0010).
--
-- The split is by write authority, not by identity:
--
--   user_profiles       user-written, mutable   display_name, avatar, bio,
--                                               email, notification_prefs
--   customer_accounts   system-written, mutable chain_id, status, first_seen,
--                                               last_login_at, login_count
--   customer_login_events   system, append-only auth event ledger
--   customer_profile_audit  system, append-only who mutated user_profiles
--
-- A user may assert their display name. A user may not assert their own
-- login_count, and must not be able to assert status='active' when an operator
-- set 'suspended'. Same identity, same VARCHAR(42) key, different writers.
--
-- Deliberately NOT here: profile/preferences JSONB. Those would duplicate
-- user_profiles and create a second source of truth for the same fields.
-- Profile data has exactly one home: user_profiles.
--
-- Idempotent: safe to re-run.

-- One row per customer wallet, created by the SIWE verify path on first login.
-- May exist without a user_profiles row (a player who never filled anything in).
CREATE TABLE IF NOT EXISTS customer_accounts (
  wallet_address VARCHAR(42) PRIMARY KEY,
  chain_id       INTEGER NOT NULL,
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
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

-- Append-only audit of mutations to user_profiles. actor_wallet is who made the
-- change (self-service edits: actor = subject; operator actions differ), so a
-- profile edit is always attributable.
CREATE TABLE IF NOT EXISTS customer_profile_audit (
  id              BIGSERIAL PRIMARY KEY,
  wallet_address  VARCHAR(42) NOT NULL,
  actor_wallet    VARCHAR(42),
  action          TEXT NOT NULL,
  changes         JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_customer_profile_audit_wallet ON customer_profile_audit (wallet_address, created_at DESC);

-- The FK-free design leans entirely on wallet_address being a lowercased 0x
-- address everywhere. customer_accounts enforces that above; user_profiles
-- (0010) predates the constraint, so add it here.
--
-- NOT VALID: enforced for all new and updated rows immediately, without
-- scanning existing rows. A pre-existing malformed row would otherwise fail
-- this migration on a branch that already has data. To enforce retroactively
-- once the data is known clean:
--   ALTER TABLE user_profiles VALIDATE CONSTRAINT user_profiles_wallet_format;
DO $$
BEGIN
  IF to_regclass('public.user_profiles') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'user_profiles_wallet_format'
         AND conrelid = to_regclass('public.user_profiles')
     )
  THEN
    ALTER TABLE user_profiles
      ADD CONSTRAINT user_profiles_wallet_format
      CHECK (wallet_address ~ '^0x[0-9a-f]{40}$') NOT VALID;
  END IF;
END $$;
