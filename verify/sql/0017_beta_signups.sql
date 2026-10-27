-- MAD Gambit — private-beta waitlist.
--
-- Written by POST /api/v1/beta/signup from the /beta gate page. One row per
-- email (unique on lower(email)); re-submitting is a no-op. The email is the
-- only personal data kept: no IP, no user agent. `role` is what the person
-- says they came for, so the first creator cohort can be hand-picked.

CREATE TABLE IF NOT EXISTS beta_signups (
  id          BIGSERIAL PRIMARY KEY,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'trader' CHECK (role IN ('trader','creator','collector')),
  handle      TEXT,
  source      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS beta_signups_email_lower ON beta_signups (lower(email));
