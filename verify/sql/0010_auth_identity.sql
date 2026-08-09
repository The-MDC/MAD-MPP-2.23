-- MAD Gambit — Auth identity & customer profiles — Neon Postgres migration
--
-- Two things:
--   1. siwe_nonces — the SIWE replay-protection store. lib/nonce-store.ts has
--      written to this table since it was added, but its schema only ever
--      existed as a doc-comment ("One-time schema (run as a migration)") and
--      never became one. Consequence: useDb() is true whenever DATABASE_URL is
--      set, so issueNonce() runs INSERT INTO siwe_nonces and throws on every
--      environment where the table was not hand-created — i.e. every ephemeral
--      Neon preview branch this repo provisions. The in-memory fallback does
--      NOT engage, because DATABASE_URL is set; it only covers the no-DB case.
--      GET /api/v1/auth/nonce 500s, and SIWE sign-in is dead on previews.
--   2. user_profiles — user-supplied identity/profile data, keyed on wallet.
--
-- Auth model, for anyone extending this: authentication is SIWE (EIP-4361,
-- lib/siwe-verify.ts) — a wallet signature, domain-bound and chain-bound to
-- Arbitrum Nova (42170). There are NO passwords and NO OAuth providers, so
-- there is deliberately no password/hash column and no accounts table here.
-- Sessions are stateless HMAC tokens (lib/session.ts, SESSION_SECRET, 8h TTL);
-- there is no sessions table and one is not needed. Do not import an
-- Auth.js/NextAuth schema on top of this — it would key identity on a SERIAL
-- integer while every table in this schema keys on VARCHAR(42), creating a
-- second parallel identity system.
--
-- Conventions match the rest of verify/sql: wallet-keyed, FK-free
-- (app-enforced), JSONB for open-ended shape, TIMESTAMPTZ, NUMERIC for money.
-- Idempotent: safe to re-run.

-- ── SIWE nonces (replay protection) ──────────────────────────────────
-- Single-use, server-issued, 5-minute TTL. consumeNonce() does a DELETE ...
-- RETURNING so a nonce is burned atomically exactly once, even under
-- concurrent requests. issueNonce() opportunistically prunes expired rows,
-- so this table stays small without a cron.
CREATE TABLE IF NOT EXISTS siwe_nonces (
  nonce     TEXT PRIMARY KEY,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_siwe_nonces_issued ON siwe_nonces (issued_at);

-- ── Customer profiles (user-supplied identity) ───────────────────────
-- Distinct from cdp_profiles (0001), which is the *behavioural* CDP record
-- (first_seen/last_seen/event_count/traits/segments, written by the event
-- pipeline). This table is what the customer themselves provides and edits.
-- Keeping them separate means analytics writes never contend with profile
-- edits, and a CDP rebuild can never clobber user-entered data.
--
-- PII note: `email` is the only genuinely personal field here and is OPTIONAL
-- — the product works fully without it (wallet is the identity). Collect it
-- only where there is a stated purpose (notifications), and treat it as the
-- field that governs this table's data-deletion obligations.
CREATE TABLE IF NOT EXISTS user_profiles (
  wallet_address    VARCHAR(42) PRIMARY KEY,   -- lowercased, matches session.ts
  display_name      TEXT,
  avatar_url        TEXT,
  bio               TEXT,
  email             TEXT,                      -- optional; the only PII here
  email_verified_at TIMESTAMPTZ,               -- null = unverified, never trust for auth
  notification_prefs JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partial unique on email so two wallets can't claim the same address, while
-- leaving unlimited NULLs. Same pattern as 0009's gdelt url index — Postgres
-- treats NULLs as distinct, so the WHERE clause is about intent, not necessity.
-- lower() so casing can't be used to register a duplicate.
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_email_uniq
  ON user_profiles (lower(email)) WHERE email IS NOT NULL;

-- Display names are shown publicly; enforce uniqueness case-insensitively so
-- they can't be used to impersonate another player.
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_display_name_uniq
  ON user_profiles (lower(display_name)) WHERE display_name IS NOT NULL;
