-- MAD Gambit — the concierge's short-term memory and its purge log (lib/concierge-memory.ts).
--
-- concierge_memory   the last turns of each conversation, REDACTED before insert, keyed by a peppered hash of the
--                    person (never the raw wallet or IP). Retention by tier, enforced on every read and purged by cron:
--                      user                       48 hours
--                      staff, admin, dev, vip     7 days, written to the purge log before the weekly purge
-- memory_purge_logs  one row per purge run: what was removed (tier, counts, time span) and, for the weekly privileged
--                    purge, a markdown log of the redacted excerpts, so staff can review before the memory is gone.
-- Idempotent.

CREATE TABLE IF NOT EXISTS concierge_memory (
  id         BIGSERIAL PRIMARY KEY,
  subject    TEXT NOT NULL,
  tier       TEXT NOT NULL CHECK (tier IN ('user','vip','staff')),
  role       TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS concierge_memory_subject ON concierge_memory (subject, created_at DESC);
CREATE INDEX IF NOT EXISTS concierge_memory_expiry ON concierge_memory (tier, expires_at);

CREATE TABLE IF NOT EXISTS memory_purge_logs (
  id        BIGSERIAL PRIMARY KEY,
  scope     TEXT NOT NULL CHECK (scope IN ('daily-user','weekly-privileged')),
  rows      INTEGER NOT NULL DEFAULT 0,
  subjects  INTEGER NOT NULL DEFAULT 0,
  body_md   TEXT NOT NULL DEFAULT '',
  run_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS memory_purge_logs_run ON memory_purge_logs (run_at DESC);
