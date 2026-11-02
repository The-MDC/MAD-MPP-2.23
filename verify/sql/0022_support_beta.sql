-- MAD Gambit — first-line support, triage and the beta programme (lib/support).
--
-- support_tickets      one row per ticket. `lane` separates the queues: 'user' (support staff), 'dev' (bugs and
--                      security, for developers) and 'staff' (internal platform/ops issues, never visible to users).
--                      `summary` and `excerpt` are REDACTED before insert (lib/support/triage.ts). The status token is
--                      stored only as a hash. `contact` is an email the user chose to give for replies, nothing else.
-- support_events       the ticket's history: status changes, assignments, internal notes and public updates.
-- beta_invites         single- or multi-use invite codes, hashed, with a cohort (wave) label and an expiry.
-- beta_known_issues    the public known-issues list the concierge and the beta page read.
-- beta_signups         gains admission columns for the extended open beta and invite waves.
-- Idempotent.

CREATE TABLE IF NOT EXISTS support_tickets (
  id          BIGSERIAL PRIMARY KEY,
  ref         TEXT NOT NULL UNIQUE,
  token_hash  TEXT NOT NULL,
  lane        TEXT NOT NULL CHECK (lane IN ('user','dev','staff')),
  channel     TEXT NOT NULL CHECK (channel IN ('concierge','form','staff')),
  category    TEXT NOT NULL,
  severity    TEXT NOT NULL CHECK (severity IN ('P1','P2','P3','P4')),
  status      TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','triaged','in-progress','waiting-user','resolved','closed')),
  summary     TEXT NOT NULL,
  excerpt     TEXT,
  requester   TEXT,
  contact     TEXT,
  assignee    TEXT,
  beta_phase  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS support_tickets_queue ON support_tickets (lane, status, severity, created_at);

CREATE TABLE IF NOT EXISTS support_events (
  id         BIGSERIAL PRIMARY KEY,
  ticket_id  BIGINT NOT NULL,
  actor      TEXT NOT NULL,
  kind       TEXT NOT NULL CHECK (kind IN ('status','assign','note','public')),
  body       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS support_events_ticket ON support_events (ticket_id, created_at);

CREATE TABLE IF NOT EXISTS beta_invites (
  id          BIGSERIAL PRIMARY KEY,
  code_hash   TEXT NOT NULL UNIQUE,
  cohort      TEXT NOT NULL DEFAULT 'wave-1',
  uses_left   INTEGER NOT NULL DEFAULT 1 CHECK (uses_left >= 0),
  expires_at  TIMESTAMPTZ NOT NULL,
  created_by  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS beta_known_issues (
  id          BIGSERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'investigating' CHECK (status IN ('investigating','identified','fixing','fixed')),
  public_note TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE beta_signups ADD COLUMN IF NOT EXISTS invited_at  TIMESTAMPTZ;
ALTER TABLE beta_signups ADD COLUMN IF NOT EXISTS admitted_at TIMESTAMPTZ;
ALTER TABLE beta_signups ADD COLUMN IF NOT EXISTS cohort      TEXT;
