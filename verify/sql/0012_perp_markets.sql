-- MAD Gambit — Custom perpetual families: FIVE FACES · ZEITGEIST · EPIPHANY
--
-- Schema for the three perp families specified in
--   docs/FIVE_FACES_Product_Sheet.md
--   docs/ZEITGEIST_Product_Sheet.md
-- and the Perpetual Epiphanies sheet.
--
-- Follows the house conventions: raw SQL on Neon (no ORM), wallet-keyed,
-- FK-free (app-enforced), JSONB for open-ended detail, idempotent so
-- scripts/migrate.mjs can re-run it safely. Driver is pg Pool per ADR-008.
--
-- TWO STRUCTURAL RULES ENCODED HERE, both from the product sheets:
--
--   1. LEGS, NOT EXPIRIES. Every perp position belongs to a lunar leg
--      (2 synodic months = 59.061d). Positions roll; they never terminally
--      resolve. There is deliberately no `resolved_at` on a perp market.
--
--   2. NO PERSONAL DATA ON A PERSISTED PERSONA SUBJECT. Named-individual
--      subjects are stored under an opaque subject_ref with the human-readable
--      binding held separately (§6.2.1 / §6.2.2). This table never holds a
--      name, likeness or persona label for a named individual.

-- ── Shared: the perp market itself ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS perp_markets (
  id             TEXT PRIMARY KEY,                -- slug / cuid
  family         TEXT NOT NULL,                   -- 'faces' | 'zeitgeist' | 'epiphany'
  subject_ref    TEXT NOT NULL,                   -- opaque; NEVER a person's name
  subject_class  TEXT NOT NULL DEFAULT 'institution', -- institution | brand | model | index | named_individual
  title          TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'open',    -- open | paused | delisted
  -- Lunar leg cadence. leg_index counts from the market's first leg.
  leg_index      INTEGER NOT NULL DEFAULT 0,
  leg_opened_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  leg_closes_at  TIMESTAMPTZ NOT NULL,            -- opened_at + 59.061d
  -- §4.5 commit-and-freeze: the parameter commitment this market settles under.
  param_commit   TEXT,                            -- keccak256(rho, gamma, alpha, version, nonce)
  param_epoch    INTEGER NOT NULL DEFAULT 0,      -- bumps only on a new commitment
  volume         NUMERIC NOT NULL DEFAULT 0,
  details        JSONB NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_perp_markets_family ON perp_markets (family, status);
CREATE INDEX IF NOT EXISTS idx_perp_markets_subject ON perp_markets (subject_ref);
CREATE INDEX IF NOT EXISTS idx_perp_markets_leg_close ON perp_markets (leg_closes_at);

-- ── FIVE FACES: the decomposed simplex, one row per market per leg ──────────
-- Permanent and transitory layers are stored separately because they trade
-- separately. Both are five-element vectors in FACE_ORDER, each summing to 1
-- and each coordinate inside [0.02, 0.88] — the perpetual invariant.
CREATE TABLE IF NOT EXISTS faces_simplex (
  id             BIGSERIAL PRIMARY KEY,
  market_id      TEXT NOT NULL,                   -- → perp_markets.id
  leg_index      INTEGER NOT NULL,
  permanent      JSONB NOT NULL,                  -- {saint, white_rice, megalomaniac, narcissist, prostitute}
  transitory     JSONB NOT NULL,
  h_perm         NUMERIC NOT NULL,                -- entropy of the permanent layer
  h_trans        NUMERIC NOT NULL,
  divergence     NUMERIC NOT NULL,                -- D = h_trans - h_perm — the money object
  tau_perm       NUMERIC,                         -- two-factor implied temperature
  tau_trans      NUMERIC,
  crowned_face   TEXT,                            -- dominant PERMANENT face at leg close
  is_slip        BOOLEAN NOT NULL DEFAULT FALSE,  -- Divergence blowout (§5.2)
  filter_state   JSONB NOT NULL DEFAULT '{}',     -- per-face CGARCH carry-forward
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_faces_simplex_leg ON faces_simplex (market_id, leg_index);
CREATE INDEX IF NOT EXISTS idx_faces_simplex_slip ON faces_simplex (is_slip) WHERE is_slip;

-- ── ZEITGEIST: annual slate + the Turning ───────────────────────────────────
CREATE TABLE IF NOT EXISTS zeitgeist_slates (
  id             BIGSERIAL PRIMARY KEY,
  vintage        INTEGER NOT NULL,                -- the lunar year this slate belongs to
  slot_index     INTEGER NOT NULL,                -- 0..2 (VOI-driven 2-or-3 slots)
  trend_key      TEXT NOT NULL,
  trend_name     TEXT NOT NULL,
  -- Sourcing transparency (§10): a slate nobody can audit is one nobody should trade.
  corpus         JSONB NOT NULL DEFAULT '[]',     -- headlines backing the trend
  sources        JSONB NOT NULL DEFAULT '[]',     -- every figure carries its source
  face_scores    JSONB NOT NULL DEFAULT '{}',     -- the five-face reading of this trend
  status         TEXT NOT NULL DEFAULT 'active',  -- active | retired
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_zg_slate_slot ON zeitgeist_slates (vintage, slot_index);
CREATE INDEX IF NOT EXISTS idx_zg_slate_status ON zeitgeist_slates (status);

-- One row per (retiring slot -> new slot) edge of the succession matrix S.
-- Row-normalised at write time, so conviction is conserved across a Turning.
CREATE TABLE IF NOT EXISTS zeitgeist_succession (
  id             BIGSERIAL PRIMARY KEY,
  from_vintage   INTEGER NOT NULL,
  to_vintage     INTEGER NOT NULL,
  from_slot      INTEGER NOT NULL,
  to_slot        INTEGER NOT NULL,
  measured       NUMERIC NOT NULL,                -- corpus-lineage component
  voted          NUMERIC NOT NULL,                -- quadratic-vote component
  share          NUMERIC NOT NULL,                -- blended, row-normalised S[i][j]
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_zg_succ_edge
  ON zeitgeist_succession (from_vintage, from_slot, to_vintage, to_slot);

-- ── EPIPHANY: mental-model markets ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS epiphany_models (
  id             TEXT PRIMARY KEY,                -- mental-model catalog id
  name           TEXT NOT NULL,
  statement      TEXT NOT NULL,
  region         TEXT NOT NULL,                   -- west | east | mena | europe | global
  original       TEXT,                            -- native script, where one exists
  persistence    NUMERIC NOT NULL DEFAULT 0.5,    -- live cultural-persistence reading
  domains        JSONB NOT NULL DEFAULT '[]',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_epiphany_region ON epiphany_models (region);

-- ── Shared: positions and the exit valve ────────────────────────────────────
-- One row per holder per market per layer. `layer` distinguishes the FIVE FACES
-- permanent/transitory books; other families use 'single'.
CREATE TABLE IF NOT EXISTS perp_positions (
  id             BIGSERIAL PRIMARY KEY,
  market_id      TEXT NOT NULL,
  wallet_address VARCHAR(42) NOT NULL,
  face           TEXT,                            -- FIVE FACES only; null elsewhere
  layer          TEXT NOT NULL DEFAULT 'single',  -- permanent | transitory | single
  conviction     NUMERIC NOT NULL DEFAULT 0,
  entry_leg      INTEGER NOT NULL DEFAULT 0,
  vintage        INTEGER,                         -- ZEITGEIST provenance
  -- §5.1 exit valve. Mirrors the Shield unstake lifecycle deliberately.
  exit_status    TEXT NOT NULL DEFAULT 'active',  -- active | cooling | redeemed
  exit_requested_at TIMESTAMPTZ,
  exit_ready_at  TIMESTAMPTZ,                     -- request + size-scaled cooldown
  exit_price     NUMERIC,                         -- locked at request time
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_perp_pos_market ON perp_positions (market_id);
CREATE INDEX IF NOT EXISTS idx_perp_pos_wallet ON perp_positions (wallet_address);
CREATE INDEX IF NOT EXISTS idx_perp_pos_exit ON perp_positions (exit_status)
  WHERE exit_status <> 'active';

-- ── §6.2.2 portrait key registry — REFERENCES AND EVENTS ONLY ───────────────
-- Deliberately holds no key material and no payload. The ciphertext lives in
-- deletable object storage; the key lives in an HSM-backed KMS. This table
-- records only what is needed for the audit trail and THE LAPSE scheduler.
--
-- THE LAPSE (§6.2.3): keys are born with a TTL and renewed per leg while the
-- subject stays eligible. Silence destroys — a key that stops being renewed
-- expires on schedule, which is also what makes the abandonment case safe.
CREATE TABLE IF NOT EXISTS portrait_keys (
  subject_ref    TEXT PRIMARY KEY,                -- opaque; never a person's name
  key_ref        TEXT NOT NULL,                   -- KMS handle, NOT key material
  ciphertext_ref TEXT,                            -- object-store pointer, NOT the payload
  status         TEXT NOT NULL DEFAULT 'held',    -- held | lapsed | destroyed
  ttl_expires_at TIMESTAMPTZ NOT NULL,            -- destruction fires without renewal
  renewed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  renewed_leg    INTEGER NOT NULL DEFAULT 0,
  destroyed_at   TIMESTAMPTZ,                     -- irreversible-destruction time
  destroy_reason TEXT,                            -- ttl_lapse | delisted | erasure_upheld | renewal_failure
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- The scheduler scans this: anything past TTL and still held must be destroyed.
CREATE INDEX IF NOT EXISTS idx_portrait_keys_ttl ON portrait_keys (ttl_expires_at)
  WHERE status = 'held';
CREATE INDEX IF NOT EXISTS idx_portrait_keys_status ON portrait_keys (status);

-- Append-only destruction log. Records BOTH request and irreversible-destruction
-- time, because managed KMS destroy carries a mandatory waiting period (~7-30d
-- AWS, 24h GCP) that cannot be removed — so the SLA states a window, and the
-- audit trail has to show both ends of it (§6.2.2).
CREATE TABLE IF NOT EXISTS portrait_key_destructions (
  id             BIGSERIAL PRIMARY KEY,
  subject_ref    TEXT NOT NULL,
  requested_at   TIMESTAMPTZ NOT NULL,
  destroyed_at   TIMESTAMPTZ,
  reason         TEXT NOT NULL,
  actor          TEXT,                            -- registrar / scheduler / subject request
  details        JSONB NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pk_destruct_subject ON portrait_key_destructions (subject_ref);
