-- MAD Gambit — concierge file uploads, verified profile email and passive account flags.
--
-- chat_files           what the concierge may read from an uploaded file: the SANITISED TEXT only (layer 2 output), never
--                      the original bytes, which are deleted from quarantine right after scanning. Owned by a peppered
--                      subject hash; expires with the owner's memory tier (48 h users, 7 days staff/VIP).
-- chat_file_scans      every scan verdict, including refused files (no content, just the hash, reasons and who).
-- file_hash_blocklist  SHA-256 hashes the platform refuses on sight.
-- email_verifications  pending email proofs: a hashed six-digit code, an expiry and an attempt counter.
-- account_flags        PASSIVE flags: suspicious activity is recorded for staff review and changes nothing for the user.
-- Idempotent.

CREATE TABLE IF NOT EXISTS chat_files (
  id          BIGSERIAL PRIMARY KEY,
  public_id   TEXT NOT NULL UNIQUE,
  subject     TEXT NOT NULL,
  tier        TEXT NOT NULL CHECK (tier IN ('user','vip','staff')),
  name        TEXT NOT NULL,
  kind        TEXT NOT NULL CHECK (kind IN ('pdf','markdown','text')),
  bytes       INTEGER NOT NULL,
  sha256      TEXT NOT NULL,
  risk        TEXT NOT NULL CHECK (risk IN ('low','medium','high')),
  notes       JSONB NOT NULL DEFAULT '[]',
  text        TEXT NOT NULL,
  chars       INTEGER NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS chat_files_subject ON chat_files (subject, created_at DESC);
CREATE INDEX IF NOT EXISTS chat_files_expiry ON chat_files (expires_at);

CREATE TABLE IF NOT EXISTS chat_file_scans (
  id          BIGSERIAL PRIMARY KEY,
  subject     TEXT NOT NULL,
  sha256      TEXT NOT NULL,
  kind        TEXT,
  bytes       INTEGER NOT NULL DEFAULT 0,
  verdict     TEXT NOT NULL CHECK (verdict IN ('accepted','refused','quarantined')),
  reasons     JSONB NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS chat_file_scans_created ON chat_file_scans (created_at DESC);

CREATE TABLE IF NOT EXISTS file_hash_blocklist (
  sha256      TEXT PRIMARY KEY,
  reason      TEXT NOT NULL,
  added_by    TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_verifications (
  wallet_address VARCHAR(42) PRIMARY KEY,
  email          TEXT NOT NULL,
  code_hash      TEXT NOT NULL,
  attempts       INTEGER NOT NULL DEFAULT 0,
  expires_at     TIMESTAMPTZ NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS account_flags (
  id          BIGSERIAL PRIMARY KEY,
  subject     TEXT NOT NULL,
  wallet      VARCHAR(42),
  reason      TEXT NOT NULL,
  severity    TEXT NOT NULL CHECK (severity IN ('low','medium','high')),
  source      TEXT NOT NULL,
  hits        INTEGER NOT NULL DEFAULT 1,
  status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewed','dismissed')),
  first_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (subject, reason, source)
);
CREATE INDEX IF NOT EXISTS account_flags_open ON account_flags (status, severity, last_at DESC);

-- user_profiles (0010) already has display_name, avatar_url, bio, email and email_verified_at.
