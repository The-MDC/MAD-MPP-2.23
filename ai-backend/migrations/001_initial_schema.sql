-- MAD Gambit — Initial Postgres Schema
-- ════════════════════════════════════════════════════════════════════
-- Cloud SQL Postgres (local dev via docker-compose Postgres container).
-- No RLS here (that was a Supabase-specific feature) — row-level access
-- control now lives in the FastAPI backend service/repository layer.
-- Auth is NOT wired yet — see PLACEHOLDER note at bottom.
-- ════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT UNIQUE NOT NULL,
    xp INTEGER NOT NULL DEFAULT 0,
    eigen_trust_score NUMERIC(5,2) NOT NULL DEFAULT 10.0,
    saver_tokens INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    on_chain_token_id NUMERIC, -- NULL until minted on-chain; matches MADCard1155/721 tokenId
    contract_address TEXT,     -- which contract (1155 vs 721) once minted
    rarity TEXT NOT NULL CHECK (rarity IN ('Common','Uncommon','Rare','Epic','Legendary','Golden Hand','Mythic')),
    faction TEXT NOT NULL,
    canonical_faction_id TEXT NOT NULL,
    serial INTEGER NOT NULL,
    stage SMALLINT NOT NULL DEFAULT 1 CHECK (stage BETWEEN 1 AND 3),
    durability NUMERIC(5,4) NOT NULL DEFAULT 1.0 CHECK (durability BETWEEN 0 AND 1),
    xp INTEGER NOT NULL DEFAULT 0,
    apy_boost NUMERIC(5,4) NOT NULL DEFAULT 0,
    edge_multiplier NUMERIC(5,4) NOT NULL DEFAULT 1.0,
    earns_count NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_cards_owner ON cards(owner_id);
CREATE INDEX idx_cards_rarity ON cards(rarity);

CREATE TABLE positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scenario_id TEXT NOT NULL,
    scenario_title TEXT NOT NULL,
    stake NUMERIC(18,4) NOT NULL,
    deck_version TEXT NOT NULL,
    delta_limit NUMERIC(18,4) NOT NULL,
    conviction_score NUMERIC(6,2) NOT NULL,
    -- Shield state machine — mirrors ShieldStakeInfo in gambit-game-math.ts exactly
    shield_status TEXT NOT NULL DEFAULT 'none' CHECK (shield_status IN ('none','active','unstaking','returned')),
    shield_tier TEXT CHECK (shield_tier IN ('standard','shielded','whale')),
    shield_premium_tier NUMERIC(4,3),
    shield_premium_paid NUMERIC(18,4),
    shield_staked_at TIMESTAMPTZ,
    shield_unstake_requested_at TIMESTAMPTZ,
    shield_estimated_return_at TIMESTAMPTZ,
    resolved BOOLEAN NOT NULL DEFAULT false,
    outcome TEXT NOT NULL DEFAULT 'pending' CHECK (outcome IN ('pending','won','lost')),
    payout NUMERIC(18,4),
    opened_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_positions_user ON positions(user_id);
CREATE INDEX idx_positions_unresolved ON positions(user_id) WHERE resolved = false;

CREATE TABLE tournament_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tier SMALLINT NOT NULL CHECK (tier BETWEEN 1 AND 8),
    card_id UUID REFERENCES cards(id),
    rating_delta INTEGER,
    madx_payout NUMERIC(18,4),
    structural_strain NUMERIC(5,4),
    rank INTEGER,
    entered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tournament_user ON tournament_entries(user_id);

CREATE TABLE pack_opens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pack_number INTEGER NOT NULL,
    cost NUMERIC(18,4) NOT NULL,
    cards_json JSONB NOT NULL, -- audit trail of exactly what was generated
    opened_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_pack_opens_user ON pack_opens(user_id);

CREATE TABLE zliar_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    statement TEXT NOT NULL,
    bs_index NUMERIC(5,2) NOT NULL,
    verdict TEXT NOT NULL,
    reasoning TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE concierge_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    role TEXT NOT NULL CHECK (role IN ('user','assistant')),
    content TEXT NOT NULL,
    tone TEXT,
    risk NUMERIC(4,3),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_concierge_user ON concierge_conversations(user_id, created_at);

-- ════════════════════════════════════════════════════════════════════
-- PLACEHOLDER — no auth wired yet. `users.wallet_address` is the
-- identity key, but nothing currently verifies wallet ownership (no
-- SIWE/signature check). Before this schema is production-safe:
--   1. Add a real auth layer (SIWE — sign-in with Ethereum — is the
--      natural fit given wallet_address is the identity key)
--   2. Every FastAPI route that touches user-scoped data must verify
--      the authenticated user matches the user_id in the request
--   3. Consider Cloud SQL IAM auth instead of the password in
--      DATABASE_URL for the deployed (non-local) environment
-- ════════════════════════════════════════════════════════════════════
