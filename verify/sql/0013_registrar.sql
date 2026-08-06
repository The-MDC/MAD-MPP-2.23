-- MAD Gambit — THE CODEX REGISTRAR (FIVE FACES §9.1) and the Phase-4 gate.
--
-- Named subjects are the one perp family on this platform that is NOT
-- classified algorithmically. §9.1 is explicit about why: "none of them says
-- who decides that a named subject clears the bar, at volume, with legal
-- consequence... pretending otherwise is how the queue ends up owned by
-- nobody." So the queue is a real table with a real SLA on it.
--
-- Triage architecture (§9.1): classifier pre-screen on the objective criteria →
-- LLM-as-judge on the ambiguous remainder → humans on the genuinely hard cases
-- and on EVERY appeal. `lane` records which of the three decided, because a
-- moderation statistic you cannot break down by decider is not a statistic.
--
-- NOTHING HERE HOLDS PERSONAL DATA. The queue is keyed by opaque subject_ref.
-- The real-person binding lives only as ciphertext in deletable object storage
-- (§6.2.2 workstream 4) — the identity map has its own erasure path, because
-- destroying the payload key while retaining the identity map still leaves
-- personal data on the books.

-- ── The listing queue ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS registrar_queue (
  id             BIGSERIAL PRIMARY KEY,
  subject_ref    TEXT NOT NULL,                   -- opaque; NEVER a person's name
  market_id      TEXT,                            -- set once listed
  status         TEXT NOT NULL DEFAULT 'pending', -- pending | approved | denied | delisted | withdrawn
  -- Which triage lane produced the decision. Humans decide every appeal.
  lane           TEXT NOT NULL DEFAULT 'classifier', -- classifier | judge | human
  -- §9.1 eligibility bar. Exactly one of these must be true and evidenced.
  bar            TEXT,                            -- public_office | public_company_officer | sustained_national_media
  evidence       JSONB NOT NULL DEFAULT '[]',     -- published, stored with the market criteria
  -- Hard blocks, recorded so a denial is auditable rather than a shrug.
  block_reason   TEXT,                            -- private_individual | minor | protected_class_mapping | outside_public_role
  -- LISTING SLA — the counterpart to the delisting SLA. Both are published.
  submitted_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  sla_due_at     TIMESTAMPTZ NOT NULL,
  decided_at     TIMESTAMPTZ,
  decided_by     TEXT,                            -- role, not a person's name
  notes          JSONB NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_registrar_subject ON registrar_queue (subject_ref);
CREATE INDEX IF NOT EXISTS idx_registrar_open ON registrar_queue (status, sla_due_at)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_registrar_lane ON registrar_queue (lane, status);

-- ── §9.1 RIGHT OF REPLY ─────────────────────────────────────────────────────
-- Standing and UNMODERATED. The column set deliberately has no `approved` and
-- no `hidden`: a moderated right of reply is not a right of reply, and the
-- product that reads someone's character while filtering their answer is the
-- version that gets sued.
CREATE TABLE IF NOT EXISTS subject_replies (
  id             BIGSERIAL PRIMARY KEY,
  subject_ref    TEXT NOT NULL,
  market_id      TEXT,
  body           TEXT NOT NULL,
  -- How the poster proved they are the subject or their representative.
  verification   TEXT NOT NULL,                   -- domain | press_office | legal_rep | platform_verified
  posted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Retracted BY THE SUBJECT only. Not a moderation hook.
  retracted_at   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_replies_subject ON subject_replies (subject_ref, posted_at DESC);

-- ── §9.1 delisting, appeals, and the notice-and-action mechanism ────────────
-- DSA-shaped from day one: notice-and-action, a trusted-flagger priority lane,
-- and published statistics including error rates, before the thresholds bind.
CREATE TABLE IF NOT EXISTS subject_complaints (
  id             BIGSERIAL PRIMARY KEY,
  subject_ref    TEXT NOT NULL,
  market_id      TEXT,
  kind           TEXT NOT NULL,                   -- delist_request | appeal | notice_and_action
  -- Trusted flaggers jump the queue. That lane is the DSA requirement and also
  -- the one that keeps the median case honest.
  trusted_flagger BOOLEAN NOT NULL DEFAULT FALSE,
  grounds        TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'open',    -- open | substantiated | rejected | withdrawn
  -- A substantiated complaint halts new conviction IMMEDIATELY and settles open
  -- positions at the last Crowning price rather than voiding them.
  halted_at      TIMESTAMPTZ,
  settle_price   NUMERIC,
  settle_leg     INTEGER,
  filed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  sla_due_at     TIMESTAMPTZ NOT NULL,
  resolved_at    TIMESTAMPTZ,
  outcome_note   TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_complaints_subject ON subject_complaints (subject_ref);
CREATE INDEX IF NOT EXISTS idx_complaints_open ON subject_complaints (status, sla_due_at)
  WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_complaints_flagger ON subject_complaints (trusted_flagger, status);

-- ── §6.2.2 workstream 4 — the subject identity map ──────────────────────────
-- The real-person ↔ subject_ref binding. Off-chain, mutable, WITH ITS OWN
-- ERASURE PATH. Only a pointer and a lookup index live here; the binding itself
-- is ciphertext in deletable object storage under the same per-subject key as
-- the portrait payload, so one destruction erases both.
--
-- `lookup_hmac` is an HMAC under a server-side pepper, NOT a plain hash. A bare
-- hash of a name is reversible by dictionary attack in seconds and would be
-- personal data sitting in this table under a thin disguise.
CREATE TABLE IF NOT EXISTS subject_identity_map (
  subject_ref    TEXT PRIMARY KEY,
  lookup_hmac    TEXT NOT NULL,                   -- HMAC(pepper, normalised identity)
  binding_ref    TEXT,                            -- object-store pointer, NOT the binding
  key_ref        TEXT NOT NULL,                   -- same per-subject key as the portrait
  status         TEXT NOT NULL DEFAULT 'held',    -- held | erased
  erased_at      TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_identity_lookup ON subject_identity_map (lookup_hmac);
CREATE INDEX IF NOT EXISTS idx_identity_status ON subject_identity_map (status);

-- ── §9.1 PAUSE_GUARDIAN ─────────────────────────────────────────────────────
-- A halt on new conviction, platform-wide. Deliberately NOT behind the
-- governance timelock: timelocks exist so the community can react to parameter
-- changes, and an emergency stop must not be delayed for the same reason a fire
-- alarm is not on a timer.
--
-- Single-row table by construction (`id` is pinned to TRUE), so "is the platform
-- paused" has exactly one answer and cannot drift between replicas of a flag.
CREATE TABLE IF NOT EXISTS pause_state (
  id             BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id),
  paused         BOOLEAN NOT NULL DEFAULT FALSE,
  reason         TEXT,
  actor          TEXT,                            -- the guardian ROLE, separate from owner
  changed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO pause_state (id, paused) VALUES (TRUE, FALSE) ON CONFLICT (id) DO NOTHING;

-- Append-only. A pause log that can be edited is a pause log that proves nothing.
CREATE TABLE IF NOT EXISTS pause_events (
  id             BIGSERIAL PRIMARY KEY,
  paused         BOOLEAN NOT NULL,
  reason         TEXT,
  actor          TEXT,
  at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── §6.2.2 go-live checklist — six workstreams, signed off individually ─────
-- The registry gates Phase 4, so "live" needs a definition somebody can sign
-- off against rather than a vibe. Readiness is computed from these rows; there
-- is no boolean anywhere that a deploy script can simply be told to trust.
CREATE TABLE IF NOT EXISTS registry_readiness (
  workstream     TEXT PRIMARY KEY,                -- key_custody | ciphertext_store | registry_contract
                                                  -- | identity_map | legal_instruments | destruction_drill
  complete       BOOLEAN NOT NULL DEFAULT FALSE,
  tested         BOOLEAN NOT NULL DEFAULT FALSE,  -- untested destruction is not destruction
  evidence       JSONB NOT NULL DEFAULT '{}',
  signed_off_by  TEXT,
  signed_off_at  TIMESTAMPTZ,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO registry_readiness (workstream) VALUES
  ('key_custody'), ('ciphertext_store'), ('registry_contract'),
  ('identity_map'), ('legal_instruments'), ('destruction_drill')
ON CONFLICT (workstream) DO NOTHING;
