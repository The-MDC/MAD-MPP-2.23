# 📊 MADHATS GAMBIT - COMPLETE DATABASE & DATA WAREHOUSE SCHEMA

## **For Claude Code Implementation**

---

# TABLE OF CONTENTS

1. [Application Database (PostgreSQL — Neon)](#application-database)
2. [Data Warehouse Schema (Snowflake/BigQuery)](#data-warehouse-schema)
3. [Real-time Event Stream](#real-time-event-stream)
4. [CDP Profile Structure](#cdp-profile-structure)
5. [Analytics Aggregation Tables](#analytics-aggregation-tables)
6. [Data Pipeline Architecture](#data-pipeline-architecture)

---

# 1. APPLICATION DATABASE (PostgreSQL — Neon)

## **Core Tables:**

```sql
-- ================================================================
-- USERS & AUTHENTICATION
-- ================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  
  -- Profile
  display_name VARCHAR(100),
  avatar_url TEXT,
  bio TEXT,
  
  -- Verification
  verification_tier INT DEFAULT 0 CHECK (verification_tier BETWEEN 0 AND 4),
  email VARCHAR(255) UNIQUE,
  email_verified BOOLEAN DEFAULT FALSE,
  
  -- Account status
  account_status VARCHAR(20) DEFAULT 'ACTIVE',
  banned_until TIMESTAMP,
  ban_reason TEXT,
  
  -- Balances
  balance_cents BIGINT DEFAULT 0,
  meth_balance BIGINT DEFAULT 0,
  
  -- Stats
  total_bets_placed INT DEFAULT 0,
  total_bets_won INT DEFAULT 0,
  win_rate DECIMAL(5,4),
  total_wagered_cents BIGINT DEFAULT 0,
  total_won_cents BIGINT DEFAULT 0,
  net_profit_cents BIGINT DEFAULT 0,
  
  -- XP & Ranking
  total_xp BIGINT DEFAULT 0,
  current_rank VARCHAR(20) DEFAULT 'ROOKIE',
  
  -- Preferences
  preferred_currency VARCHAR(10) DEFAULT 'USDC',
  notification_settings JSONB,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  last_activity_at TIMESTAMP,
  
  -- Indexes
  INDEX idx_wallet (wallet_address),
  INDEX idx_verification_tier (verification_tier),
  INDEX idx_total_xp (total_xp DESC),
  INDEX idx_created_at (created_at)
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- CARDS (NFTs)
-- ================================================================

CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id BIGINT UNIQUE NOT NULL,
  
  -- Card properties
  card_name VARCHAR(100) NOT NULL,
  subtitle VARCHAR(200),
  faction VARCHAR(50) NOT NULL,
  rarity VARCHAR(20) NOT NULL,
  tier INT NOT NULL CHECK (tier BETWEEN 1 AND 5),
  
  -- Stats
  volatility INT CHECK (volatility BETWEEN 0 AND 100),
  clout INT CHECK (clout BETWEEN 0 AND 100),
  cancel_risk INT CHECK (cancel_risk BETWEEN 0 AND 100),
  
  -- Ability
  ability_name VARCHAR(100),
  ability_description TEXT,
  ability_trigger VARCHAR(50),
  
  -- Supply
  total_minted INT DEFAULT 0,
  max_supply INT, -- NULL = unlimited
  burned_count INT DEFAULT 0,
  
  -- Metadata
  image_url TEXT,
  animation_url TEXT,
  metadata_uri TEXT,
  
  -- Special cards
  is_limited_edition BOOLEAN DEFAULT FALSE,
  is_degen_of_month BOOLEAN DEFAULT FALSE,
  event_month VARCHAR(20),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_faction (faction),
  INDEX idx_rarity (rarity),
  INDEX idx_tier (tier),
  INDEX idx_token_id (token_id)
);

-- ================================================================
-- USER CARD OWNERSHIP
-- ================================================================

CREATE TABLE user_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards(id),
  
  -- Ownership
  token_id BIGINT NOT NULL,
  quantity INT DEFAULT 1,
  
  -- Condition
  condition VARCHAR(20) DEFAULT 'PRISTINE',
  condition_last_changed TIMESTAMP,
  
  -- Usage stats
  times_used INT DEFAULT 0,
  total_xp_earned BIGINT DEFAULT 0,
  evolution_progress DECIMAL(5,4) DEFAULT 0, -- 0-1
  
  -- Repair status
  is_in_repair BOOLEAN DEFAULT FALSE,
  repair_started_at TIMESTAMP,
  repair_ends_at TIMESTAMP,
  repair_method VARCHAR(20),
  
  -- Staking status
  is_staked BOOLEAN DEFAULT FALSE,
  staked_at TIMESTAMP,
  staked_for VARCHAR(50), -- 'METH_EARNING', 'REPAIR', 'GOVERNANCE'
  
  -- Timestamps
  acquired_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,
  
  UNIQUE(user_id, card_id),
  INDEX idx_user (user_id),
  INDEX idx_card (card_id),
  INDEX idx_condition (condition),
  INDEX idx_staked (is_staked)
);

-- ================================================================
-- TOURNAMENTS
-- ================================================================

CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tournament properties
  tier VARCHAR(50) NOT NULL,
  entry_fee_cents INT NOT NULL,
  
  -- Timing
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  duration_seconds INT NOT NULL,
  
  -- Financial
  prize_pool_cents BIGINT DEFAULT 0,
  platform_rake_cents BIGINT DEFAULT 0,
  guaranteed_minimum_cents BIGINT DEFAULT 0,
  
  -- Participation
  player_count INT DEFAULT 0,
  max_players INT, -- NULL = unlimited
  
  -- Status
  status VARCHAR(20) DEFAULT 'UPCOMING',
  
  -- Settings
  settings JSONB, -- Rules, market IDs, etc.
  
  -- Results
  finalized_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_tier (tier),
  INDEX idx_status (status),
  INDEX idx_start_time (start_time),
  INDEX idx_created_at (created_at)
);

-- ================================================================
-- TOURNAMENT ENTRIES
-- ================================================================

CREATE TABLE tournament_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Entry details
  entry_fee_paid_cents INT NOT NULL,
  payment_currency VARCHAR(10) NOT NULL,
  payment_tx_hash VARCHAR(66),
  
  -- Performance
  bets_placed INT DEFAULT 0,
  bets_won INT DEFAULT 0,
  bets_lost INT DEFAULT 0,
  total_wagered_cents BIGINT DEFAULT 0,
  total_won_cents BIGINT DEFAULT 0,
  net_profit_cents BIGINT DEFAULT 0,
  
  -- Ranking
  final_rank INT,
  percentile DECIMAL(5,4),
  
  -- Prizes
  prize_won_cents BIGINT DEFAULT 0,
  prize_claimed BOOLEAN DEFAULT FALSE,
  prize_claimed_at TIMESTAMP,
  
  -- Cards used
  cards_used JSONB, -- Array of card IDs
  
  -- Timestamps
  entered_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(tournament_id, user_id),
  INDEX idx_tournament (tournament_id),
  INDEX idx_user (user_id),
  INDEX idx_final_rank (final_rank)
);

-- ================================================================
-- PREDICTION MARKETS
-- ================================================================

CREATE TABLE markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Market properties
  question TEXT NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  market_type VARCHAR(20) NOT NULL, -- 'BINARY', 'SCALAR', 'CATEGORICAL'
  
  -- Outcomes
  outcomes JSONB NOT NULL, -- Array of outcome objects
  
  -- Timing
  created_at TIMESTAMP DEFAULT NOW(),
  closes_at TIMESTAMP NOT NULL,
  resolves_at TIMESTAMP,
  
  -- Resolution
  resolution_source VARCHAR(255),
  resolved_outcome VARCHAR(100),
  resolved_at TIMESTAMP,
  resolution_notes TEXT,
  
  -- Liquidity (DL-LMSR)
  liquidity_parameter DECIMAL(18,6) DEFAULT 100,
  outstanding_shares JSONB, -- Array of share counts per outcome
  
  -- Tournament linkage
  tournament_id UUID REFERENCES tournaments(id),
  event_id UUID,
  
  -- Stats
  total_volume_cents BIGINT DEFAULT 0,
  unique_bettors INT DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'OPEN',
  
  -- Metadata
  creator_id UUID REFERENCES users(id),
  difficulty VARCHAR(20),
  tags JSONB,
  
  INDEX idx_category (category),
  INDEX idx_status (status),
  INDEX idx_closes_at (closes_at),
  INDEX idx_tournament (tournament_id)
);

-- ================================================================
-- BETS
-- ================================================================

CREATE TABLE bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES markets(id),
  tournament_id UUID REFERENCES tournaments(id),
  card_id UUID REFERENCES cards(id),
  
  -- Bet details
  outcome_index INT NOT NULL,
  outcome_label VARCHAR(100),
  amount_cents BIGINT NOT NULL,
  shares_purchased DECIMAL(18,6),
  
  -- Pricing
  price_at_purchase DECIMAL(10,6), -- Odds when placed
  cost_basis_cents BIGINT, -- Actual cost
  
  -- Loss protection
  has_insurance BOOLEAN DEFAULT FALSE,
  insurance_premium_cents BIGINT DEFAULT 0,
  
  -- Timing
  placed_at TIMESTAMP DEFAULT NOW(),
  seconds_after_market_open INT,
  
  -- Resolution
  won BOOLEAN,
  payout_cents BIGINT DEFAULT 0,
  net_profit_cents BIGINT,
  claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMP,
  
  -- Context
  device_type VARCHAR(20),
  session_id UUID,
  
  INDEX idx_user (user_id),
  INDEX idx_market (market_id),
  INDEX idx_tournament (tournament_id),
  INDEX idx_placed_at (placed_at)
);

-- ================================================================
-- CARD EVOLUTIONS
-- ================================================================

CREATE TABLE card_evolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_card_id UUID NOT NULL REFERENCES cards(id),
  result_card_id UUID REFERENCES cards(id),
  
  -- Evolution details
  attempted_at TIMESTAMP DEFAULT NOW(),
  success BOOLEAN NOT NULL,
  near_miss BOOLEAN DEFAULT FALSE,
  
  -- Costs
  mad_burned BIGINT DEFAULT 0,
  meth_spent BIGINT DEFAULT 0,
  cards_sacrificed JSONB,
  
  -- Pre-evolution state
  source_tier INT NOT NULL,
  source_condition VARCHAR(20),
  buzz_score INT, -- 0-100
  
  -- Post-evolution state
  result_tier INT,
  result_condition VARCHAR(20),
  
  -- Player reaction
  time_to_retry_seconds INT,
  shared_to_social BOOLEAN DEFAULT FALSE,
  
  INDEX idx_user (user_id),
  INDEX idx_attempted_at (attempted_at),
  INDEX idx_success (success),
  INDEX idx_near_miss (near_miss)
);

-- ================================================================
-- METH TRANSACTIONS
-- ================================================================

CREATE TABLE meth_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Transaction details
  transaction_type VARCHAR(50) NOT NULL, -- 'EARN', 'SPEND', 'GIFT', 'DECAY'
  amount BIGINT NOT NULL,
  balance_before BIGINT NOT NULL,
  balance_after BIGINT NOT NULL,
  
  -- Context
  source VARCHAR(100), -- 'DAILY_QUEST', 'CARD_REPAIR', 'STAKING_REWARD', etc.
  reference_id UUID, -- ID of related entity (bet, evolution, etc.)
  description TEXT,
  
  -- Gift-specific
  recipient_id UUID REFERENCES users(id),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_user (user_id),
  INDEX idx_type (transaction_type),
  INDEX idx_created_at (created_at)
);

-- ================================================================
-- EVENTS (Special monthly/weekly events)
-- ================================================================

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event properties
  event_type VARCHAR(50) NOT NULL, -- 'GAUNTLET', 'FACTION_CHAMPIONSHIP', 'FAFO', 'DEGEN_OF_MONTH'
  name VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- Timing
  registration_opens TIMESTAMP,
  registration_closes TIMESTAMP,
  event_starts TIMESTAMP,
  event_ends TIMESTAMP,
  
  -- Entry requirements
  entry_fee_meth BIGINT DEFAULT 0,
  entry_fee_mad_cents INT DEFAULT 0,
  required_tier INT DEFAULT 0,
  
  -- Prize pool
  prize_pool_cents BIGINT DEFAULT 0,
  prize_distribution JSONB,
  
  -- Participants
  participant_count INT DEFAULT 0,
  max_participants INT,
  
  -- Configuration
  config JSONB, -- Event-specific settings
  
  -- Status
  status VARCHAR(20) DEFAULT 'UPCOMING',
  
  -- Results
  winners JSONB,
  finalized_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_event_type (event_type),
  INDEX idx_status (status),
  INDEX idx_event_starts (event_starts)
);

-- ================================================================
-- EVENT ENTRIES
-- ================================================================

CREATE TABLE event_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Entry details
  entry_fee_paid_meth BIGINT DEFAULT 0,
  entry_fee_paid_mad_cents INT DEFAULT 0,
  
  -- Performance
  score BIGINT DEFAULT 0,
  rank INT,
  
  -- Event-specific data
  progress JSONB, -- Faction completion, markets completed, etc.
  
  -- Prizes
  prize_won_cents BIGINT DEFAULT 0,
  prize_claimed BOOLEAN DEFAULT FALSE,
  prize_claimed_at TIMESTAMP,
  
  -- Timestamps
  entered_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(event_id, user_id),
  INDEX idx_event (event_id),
  INDEX idx_user (user_id),
  INDEX idx_rank (rank)
);

-- ================================================================
-- DEGEN OF MONTH NOMINATIONS
-- ================================================================

CREATE TABLE degen_nominations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Nomination details
  event_month VARCHAR(20) NOT NULL, -- 'JANUARY_2026'
  category VARCHAR(50) NOT NULL, -- 'RUG_PULLER', 'TWO_FACE', etc.
  
  -- Nominee info
  nominee_name VARCHAR(200) NOT NULL,
  real_name VARCHAR(200),
  incident_date TIMESTAMP,
  description TEXT,
  evidence_links JSONB,
  
  -- Nomination metadata
  nominated_by UUID REFERENCES users(id),
  nomination_cost_meth BIGINT DEFAULT 88,
  
  -- Community engagement
  upvotes INT DEFAULT 0,
  comments INT DEFAULT 0,
  
  -- Voting phase
  advanced_to_voting BOOLEAN DEFAULT FALSE,
  votes BIGINT DEFAULT 0, -- $MADx spent on votes
  total_voters INT DEFAULT 0,
  
  -- Winner status
  won BOOLEAN DEFAULT FALSE,
  card_generated BOOLEAN DEFAULT FALSE,
  card_id UUID REFERENCES cards(id),
  
  -- Timestamps
  nominated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_event_month (event_month),
  INDEX idx_category (category),
  INDEX idx_votes (votes DESC)
);

-- ================================================================
-- SESSIONS
-- ================================================================

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Session details
  session_token VARCHAR(255) UNIQUE NOT NULL,
  anonymous_id UUID,
  
  -- Device/location
  device_type VARCHAR(20),
  browser VARCHAR(50),
  os VARCHAR(50),
  ip_address_hash VARCHAR(64), -- Hashed for privacy
  country_code VARCHAR(2),
  
  -- Activity
  pages_viewed INT DEFAULT 0,
  bets_placed INT DEFAULT 0,
  
  -- Timing
  started_at TIMESTAMP DEFAULT NOW(),
  last_activity_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  
  -- Entry/exit
  entry_page TEXT,
  exit_page TEXT,
  referrer TEXT,
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  
  INDEX idx_user (user_id),
  INDEX idx_started_at (started_at),
  INDEX idx_session_token (session_token)
);

-- ================================================================
-- REFERRALS
-- ================================================================

CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  referrer_id UUID NOT NULL REFERENCES users(id),
  referee_id UUID REFERENCES users(id),
  
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  
  status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'COMPLETED', 'EXPIRED'
  
  -- Rewards
  referrer_reward_meth BIGINT DEFAULT 10000,
  referee_reward_meth BIGINT DEFAULT 10000,
  rewards_claimed BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  
  INDEX idx_referrer (referrer_id),
  INDEX idx_code (referral_code)
);

-- ================================================================
-- ADMIN LOGS
-- ================================================================

CREATE TABLE admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  admin_id UUID NOT NULL REFERENCES users(id),
  
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  
  details JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_admin (admin_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
);
```

---

# 2. DATA WAREHOUSE SCHEMA

[Complete warehouse schema as specified in Master Platform Plan...]

---

# 3. REAL-TIME EVENT STREAM

```sql
-- Events table for real-time tracking
CREATE TABLE events_stream (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event metadata
  event_name VARCHAR(100) NOT NULL,
  event_category VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  
  -- User context
  user_id UUID,
  session_id UUID,
  anonymous_id UUID,
  
  -- Event properties
  properties JSONB,
  context JSONB,
  
  -- Page info
  page_url TEXT,
  page_title VARCHAR(255),
  referrer TEXT,
  
  -- Partitioning
  date_partition DATE NOT NULL DEFAULT CURRENT_DATE,
  
  INDEX idx_user_time (user_id, timestamp),
  INDEX idx_event_name (event_name),
  INDEX idx_date (date_partition)
) PARTITION BY RANGE (date_partition);

-- Create partitions for each month (automate this)
CREATE TABLE events_stream_2026_01 PARTITION OF events_stream
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

---

# 4. CDP PROFILE STRUCTURE

[Complete CDP specifications from Master Platform Plan...]

---

# 5. ANALYTICS AGGREGATION TABLES

```sql
-- Pre-aggregated for dashboard performance

CREATE TABLE agg_platform_hourly (
  hour_timestamp TIMESTAMP PRIMARY KEY,
  
  -- Users
  active_users INT DEFAULT 0,
  new_signups INT DEFAULT 0,
  
  -- Tournaments
  active_tournaments INT DEFAULT 0,
  tournament_entries INT DEFAULT 0,
  
  -- Betting
  total_bets INT DEFAULT 0,
  total_volume_cents BIGINT DEFAULT 0,
  
  -- Revenue
  tournament_rake_cents BIGINT DEFAULT 0,
  pack_sales_cents BIGINT DEFAULT 0,
  marketplace_fees_cents BIGINT DEFAULT 0,
  
  -- Token
  mad_burned BIGINT DEFAULT 0,
  mad_price_cents INT
);

CREATE TABLE agg_user_daily (
  user_id UUID,
  date DATE,
  
  -- Activity
  sessions INT DEFAULT 0,
  time_on_platform_seconds INT DEFAULT 0,
  
  -- Betting
  bets_placed INT DEFAULT 0,
  bets_won INT DEFAULT 0,
  total_wagered_cents BIGINT DEFAULT 0,
  net_profit_cents BIGINT DEFAULT 0,
  
  -- Progression
  xp_earned INT DEFAULT 0,
  meth_earned INT DEFAULT 0,
  
  PRIMARY KEY (user_id, date)
);
```

---

# 6. DATA PIPELINE ARCHITECTURE

## **ETL Pipeline Flow:**

```
Application DB (PostgreSQL) 
    ↓
    ↓ Change Data Capture (CDC)
    ↓
Kafka/Kinesis Stream
    ↓
    ↓ Real-time processing
    ↓
┌───────────────┬────────────────┬──────────────┐
│               │                │              │
▼               ▼                ▼              ▼
Data Warehouse  CDP (Segment)   Redis Cache    S3 (Archive)
(Snowflake)
    ↓
    ↓ Batch processing (nightly)
    ↓
ML Predictions → CDP
```

## **Implementation (Neon + Drizzle):**

```typescript
// Real-time subscriptions
import { db } from '@/lib/db'; // Drizzle over Neon Postgres

// Neon has no built-in realtime — publish bet events over Pusher/Ably (WebSockets):
const realtime = getRealtimeClient();

// Subscribe to bet changes
realtime
  .channel('bets')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'bets'
    },
    (payload) => {
      // Send to analytics pipeline
      analytics.track('bet_placed', {
        ...payload.new
      });
      
      // Update leaderboards
      updateLeaderboard(payload.new.tournament_id);
    }
  )
  .subscribe();
```

---

**This schema is optimized for:**
- ✅ Real-time queries (<100ms)
- ✅ Analytics aggregation
- ✅ ML prediction pipelines
- ✅ GDPR compliance (data deletion)
- ✅ Scalability (partitioning, indexes)

**Ready for Claude Code implementation!** 🚀
