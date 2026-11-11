-- 0027 — resolution specs: every market states, in advance and immutably, who decides it and what happens if they fail.
--
-- WHY. A map of the codebase (2026-11-10) found that nothing in it resolved a database market at all: `markets.status`,
-- `outcome` and `resolution_at` existed, no code wrote them, and trading never stopped at the stated close. On-chain,
-- `MADMarketFactory.resolve` is owner-only with no deadline. A market whose rule is not fixed before the first bet
-- is a market whose price is a guess about the resolver's mood. This migration makes the rule a first-class,
-- immutable record and makes a market without one impossible to create.
--
-- DESIGN (checked against UMA Optimistic Oracle V3 and reality.eth, both forked into The-MDC):
--   * the spec is content-addressed (`spec_hash` = sha256 of its canonical JSON), so a claim cannot be swapped under
--     a market — UMA binds its assertion id to the claim, bond, liveness and callback for the same reason;
--   * specs, clarifications and events are APPEND-ONLY, enforced by the database, not by convention;
--   * a clarification can pause trading (as an exchange's can) but can never edit the spec;
--   * a market's spec is fixed at creation and its final status is final.
--
-- Additive and idempotent. Existing rows are marked `legacy_no_spec` once; no new row may ever be.

CREATE TABLE IF NOT EXISTS resolution_specs (
  id             TEXT PRIMARY KEY,                -- 'rs_' + first 16 hex chars of spec_hash
  family         TEXT NOT NULL,
  schema_version INTEGER NOT NULL,
  spec           JSONB NOT NULL,                  -- the full spec; what the page and the JSON endpoint render
  spec_hash      TEXT NOT NULL UNIQUE,            -- sha256 hex of the canonical JSON of `spec`
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT resolution_specs_hash_shape CHECK (spec_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT resolution_specs_id_matches_hash CHECK (id = 'rs_' || left(spec_hash, 16))
);
CREATE INDEX IF NOT EXISTS idx_resolution_specs_family ON resolution_specs (family);

-- Dated, append-only notes on a spec. They may pause trading (e.g. an unclear source) but never change the spec.
CREATE TABLE IF NOT EXISTS resolution_clarifications (
  id             BIGSERIAL PRIMARY KEY,
  spec_id        TEXT NOT NULL,                   -- → resolution_specs.id (FK-free like the rest; app-enforced)
  market_id      TEXT,
  note           TEXT NOT NULL CHECK (length(note) BETWEEN 1 AND 2000),
  pauses_trading BOOLEAN NOT NULL DEFAULT false,
  posted_by      TEXT NOT NULL,
  posted_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_resolution_clar_spec ON resolution_clarifications (spec_id);
CREATE INDEX IF NOT EXISTS idx_resolution_clar_market ON resolution_clarifications (market_id);

-- Every step of a market's resolution, in order. The audit trail the public page links to.
CREATE TABLE IF NOT EXISTS resolution_events (
  id          BIGSERIAL PRIMARY KEY,
  market_id   TEXT NOT NULL,
  event       TEXT NOT NULL,                      -- assert | dispute | vote | resolve | fallback | cancel | expire
  actor       TEXT,
  payload     JSONB NOT NULL DEFAULT '{}'::jsonb,
  state_after JSONB NOT NULL DEFAULT '{}'::jsonb,
  at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_resolution_events_market ON resolution_events (market_id, id);

-- The three tables above are append-only. A trigger, not a policy, so even the owner connection cannot rewrite history
-- by accident (a deliberate rewrite must drop the trigger first, which leaves its own trace in the migration ledger).
-- search_path is pinned on both functions (Supabase's linter flags a mutable one: a role that can create objects
-- in a schema earlier on the path could otherwise shadow what these functions call).
CREATE OR REPLACE FUNCTION forbid_mutation() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  RAISE EXCEPTION '% on % is not allowed: this table is append-only', TG_OP, TG_TABLE_NAME
    USING ERRCODE = 'integrity_constraint_violation';
END $$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['resolution_specs', 'resolution_clarifications', 'resolution_events'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', t || '_append_only', t);
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION forbid_mutation()', t || '_append_only', t);
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', t || '_no_truncate', t);
    EXECUTE format('CREATE TRIGGER %I BEFORE TRUNCATE ON %I FOR EACH STATEMENT EXECUTE FUNCTION forbid_mutation()', t || '_no_truncate', t);
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- Markets point at their spec and carry their own resolution state.
ALTER TABLE markets ADD COLUMN IF NOT EXISTS resolution_spec_id TEXT;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS closes_at          TIMESTAMPTZ;   -- trading stops here (from the spec)
ALTER TABLE markets ADD COLUMN IF NOT EXISTS resolution_state   JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS legacy_no_spec     BOOLEAN NOT NULL DEFAULT false;

-- Rows that exist today were created before this rule. Mark them once, BEFORE the guard below exists.
UPDATE markets SET legacy_no_spec = true WHERE resolution_spec_id IS NULL AND legacy_no_spec = false;

CREATE OR REPLACE FUNCTION markets_resolution_guard() RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.legacy_no_spec THEN
      RAISE EXCEPTION 'a market cannot be created as legacy_no_spec; give it a resolution spec' USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.resolution_spec_id IS NULL THEN
      RAISE EXCEPTION 'a market needs a resolution spec before it can exist' USING ERRCODE = 'check_violation';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM resolution_specs WHERE id = NEW.resolution_spec_id) THEN
      RAISE EXCEPTION 'resolution spec % does not exist', NEW.resolution_spec_id USING ERRCODE = 'foreign_key_violation';
    END IF;
    IF NEW.status IN ('resolved', 'cancelled') THEN
      RAISE EXCEPTION 'a market cannot be created already %', NEW.status USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE
  IF OLD.resolution_spec_id IS NOT NULL AND NEW.resolution_spec_id IS DISTINCT FROM OLD.resolution_spec_id THEN
    RAISE EXCEPTION 'a market''s resolution spec is fixed at creation' USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  IF OLD.legacy_no_spec = false AND NEW.legacy_no_spec = true THEN
    RAISE EXCEPTION 'a market cannot be reclassified as legacy_no_spec' USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  IF OLD.status IN ('resolved', 'cancelled')
     AND (NEW.status IS DISTINCT FROM OLD.status OR NEW.outcome IS DISTINCT FROM OLD.outcome) THEN
    RAISE EXCEPTION 'market % is %; its outcome is final', OLD.id, OLD.status USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  IF NEW.status = 'resolved' AND NEW.outcome IS NULL THEN
    RAISE EXCEPTION 'a resolved market needs an outcome' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS markets_resolution_guard ON markets;
CREATE TRIGGER markets_resolution_guard BEFORE INSERT OR UPDATE ON markets
  FOR EACH ROW EXECUTE FUNCTION markets_resolution_guard();

-- Lockdown, as in 0026: the new tables take the same stance (RLS on, no policies, nothing for the API roles).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON resolution_specs, resolution_clarifications, resolution_events FROM anon';
    EXECUTE 'REVOKE ALL ON SEQUENCE resolution_clarifications_id_seq, resolution_events_id_seq FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON resolution_specs, resolution_clarifications, resolution_events FROM authenticated';
    EXECUTE 'REVOKE ALL ON SEQUENCE resolution_clarifications_id_seq, resolution_events_id_seq FROM authenticated';
  END IF;
END $$;
