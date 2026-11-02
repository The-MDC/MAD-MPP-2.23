-- MAD Gambit — the information market's daily logs and data warehouse (lib/information-market/daily-log.ts).
--
-- Every day the concierge's back end writes two log files for the day before, each in its own folder:
--   logs/platform/YYYY-MM-DD.jsonl   everything the platform recorded that day, one JSON record per line
--   logs/users/YYYY-MM-DD.jsonl      one line per active (pseudonymous) user: what they did, never what they said
-- The files live in im_log_files. Their data is ALSO loaded, structured, into the warehouse tables below, which is what
-- reports, the insights engine and the admin assistant query.
--
-- Users are identified only by a peppered hash (subject). No emails, no message text, no raw wallets in the files.
-- Idempotent: re-running a day replaces that day's files and rows.

CREATE TABLE IF NOT EXISTS im_log_files (
  id          BIGSERIAL PRIMARY KEY,
  folder      TEXT NOT NULL CHECK (folder IN ('platform','users')),
  day         DATE NOT NULL,
  path        TEXT NOT NULL,
  records     INTEGER NOT NULL DEFAULT 0,
  bytes       INTEGER NOT NULL DEFAULT 0,
  sha256      TEXT NOT NULL,
  body        TEXT NOT NULL,
  initiated_by TEXT NOT NULL DEFAULT 'madhatr-concierge',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (folder, day)
);

-- The warehouse: the "nuanced" structured dump of each day's logs.
CREATE TABLE IF NOT EXISTS im_daily_platform (
  day    DATE NOT NULL,
  metric TEXT NOT NULL,
  value  NUMERIC NOT NULL DEFAULT 0,
  PRIMARY KEY (day, metric)
);

CREATE TABLE IF NOT EXISTS im_daily_users (
  day          DATE NOT NULL,
  subject      TEXT NOT NULL,
  events       INTEGER NOT NULL DEFAULT 0,
  event_types  JSONB NOT NULL DEFAULT '{}',
  bets         INTEGER NOT NULL DEFAULT 0,
  wagered      NUMERIC NOT NULL DEFAULT 0,
  cards_minted INTEGER NOT NULL DEFAULT 0,
  tickets      INTEGER NOT NULL DEFAULT 0,
  first_seen   TIMESTAMPTZ,
  last_seen    TIMESTAMPTZ,
  PRIMARY KEY (day, subject)
);
CREATE INDEX IF NOT EXISTS im_daily_users_day ON im_daily_users (day);
