-- MAD Gambit — the self-learning insights engine (lib/insights.ts).
--
-- insight_metrics   one value per metric per day. The engine learns "normal" from this history (median + MAD), so an
--                   anomaly is judged against what THIS platform usually does, not a hand-set threshold.
-- insight_skills    capabilities the engine has acquired. Read-only monitors ("watch:*") are acquired automatically once
--                   the evidence is there; knowledge-gap skills ("gap:*") are proposed and wait for an admin's yes.
-- insight_feedback  what the owner found useful or dismissed, per recommendation rule: the engine re-weights by it.
-- insight_reports   each weekly report as sent (one per week), with its email status.
--
-- Counts and names of public topics only: no message text, no wallets, no emails. Idempotent.

CREATE TABLE IF NOT EXISTS insight_metrics (
  day    DATE NOT NULL,
  metric TEXT NOT NULL,
  value  NUMERIC NOT NULL DEFAULT 0,
  PRIMARY KEY (day, metric)
);
CREATE INDEX IF NOT EXISTS insight_metrics_metric_day ON insight_metrics (metric, day DESC);

CREATE TABLE IF NOT EXISTS insight_skills (
  id         TEXT PRIMARY KEY,
  kind       TEXT NOT NULL CHECK (kind IN ('watch','gap')),
  title      TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed','active','retired')),
  evidence   TEXT NOT NULL DEFAULT '',
  uses       INTEGER NOT NULL DEFAULT 0,
  hits       INTEGER NOT NULL DEFAULT 0,
  misses     INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS insight_feedback (
  rule      TEXT PRIMARY KEY,
  useful    INTEGER NOT NULL DEFAULT 0,
  dismissed INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS insight_reports (
  id           BIGSERIAL PRIMARY KEY,
  week_start   DATE NOT NULL UNIQUE,
  body_md      TEXT NOT NULL,
  email_status TEXT NOT NULL DEFAULT 'pending',
  emailed_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Weekly security-intel scan results (lib/security-intel.ts): advisories, exploited-in-the-wild vulnerabilities and
-- maintainer security releases for the stack. Public information only.
CREATE TABLE IF NOT EXISTS insight_intel (
  week_start DATE PRIMARY KEY,
  items      JSONB NOT NULL DEFAULT '[]',
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
