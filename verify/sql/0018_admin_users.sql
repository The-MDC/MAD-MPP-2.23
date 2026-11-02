-- MAD Gambit — admin suite.
--
-- The MASTER admin is not stored here: it lives in the environment (ADMIN_MASTER_EMAIL / ADMIN_MASTER_PASSWORD_HASH),
-- so a database problem can never lock the owner out. This table holds the SUBORDINATE admins the master creates.
-- Passwords are scrypt hashes (lib/admin-auth.ts); the plaintext is shown to the master once at creation and never stored.

CREATE TABLE IF NOT EXISTS admin_users (
  id            BIGSERIAL PRIMARY KEY,
  email         TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('admin','support','dev','viewer')),
  password_hash TEXT NOT NULL,
  disabled      BOOLEAN NOT NULL DEFAULT FALSE,
  created_by    TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_sign_in  TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS admin_users_email_lower ON admin_users (lower(email));

-- Who did what in the admin suite: sign-ins, failed sign-ins, exports, admin changes, assistant use. No secrets, no payloads.
CREATE TABLE IF NOT EXISTS admin_audit (
  id         BIGSERIAL PRIMARY KEY,
  actor      TEXT NOT NULL,
  action     TEXT NOT NULL,
  detail     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_audit_created ON admin_audit (created_at DESC);
