/**
 * MAD Gambit — application database schema (Neon Postgres via Drizzle ORM).
 *
 * Ported from docs/imported/specs/MADHATS_DATABASE_SCHEMA.md (Section 1 — the
 * application DB; sections 2–5 are the analytics warehouse, a separate system).
 *
 * Workflow: `npm run db:generate` (SQL migration) → `npm run db:migrate` (apply
 * to Neon). Runs in CI against the ephemeral Neon PR branch, or in Cursor/local.
 */
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  bigint,
  boolean,
  timestamp,
  numeric,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// ── USERS & AUTH ─────────────────────────────────────────────────────
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    walletAddress: varchar('wallet_address', { length: 42 }).notNull().unique(),

    displayName: varchar('display_name', { length: 100 }),
    avatarUrl: text('avatar_url'),
    bio: text('bio'),

    verificationTier: integer('verification_tier').default(0),
    email: varchar('email', { length: 255 }).unique(),
    emailVerified: boolean('email_verified').default(false),

    accountStatus: varchar('account_status', { length: 20 }).default('ACTIVE'),
    bannedUntil: timestamp('banned_until'),
    banReason: text('ban_reason'),

    balanceCents: bigint('balance_cents', { mode: 'number' }).default(0),
    methBalance: bigint('meth_balance', { mode: 'number' }).default(0),

    totalBetsPlaced: integer('total_bets_placed').default(0),
    totalBetsWon: integer('total_bets_won').default(0),
    winRate: numeric('win_rate', { precision: 5, scale: 4 }),
    totalWageredCents: bigint('total_wagered_cents', { mode: 'number' }).default(0),
    totalWonCents: bigint('total_won_cents', { mode: 'number' }).default(0),
    netProfitCents: bigint('net_profit_cents', { mode: 'number' }).default(0),

    totalXp: bigint('total_xp', { mode: 'number' }).default(0),
    currentRank: varchar('current_rank', { length: 20 }).default('ROOKIE'),

    preferredCurrency: varchar('preferred_currency', { length: 10 }).default('USDC'),
    notificationSettings: jsonb('notification_settings'),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    lastLoginAt: timestamp('last_login_at'),
    lastActivityAt: timestamp('last_activity_at'),
  },
  (t) => [
    // wallet_address is already indexed by its UNIQUE constraint.
    index('idx_users_verification_tier').on(t.verificationTier),
    index('idx_users_total_xp').on(t.totalXp),
    index('idx_users_created_at').on(t.createdAt),
  ],
);

// ── CARDS (NFT catalog) ──────────────────────────────────────────────
export const cards = pgTable(
  'cards',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tokenId: bigint('token_id', { mode: 'number' }).notNull().unique(),

    cardName: varchar('card_name', { length: 100 }).notNull(),
    subtitle: varchar('subtitle', { length: 200 }),
    faction: varchar('faction', { length: 50 }).notNull(),
    rarity: varchar('rarity', { length: 20 }).notNull(),
    tier: integer('tier').notNull(),

    volatility: integer('volatility'),
    clout: integer('clout'),
    cancelRisk: integer('cancel_risk'),

    abilityName: varchar('ability_name', { length: 100 }),
    abilityDescription: text('ability_description'),
    abilityTrigger: varchar('ability_trigger', { length: 50 }),

    totalMinted: integer('total_minted').default(0),
    maxSupply: integer('max_supply'),
    burnedCount: integer('burned_count').default(0),

    imageUrl: text('image_url'),
    animationUrl: text('animation_url'),
    metadataUri: text('metadata_uri'),

    isLimitedEdition: boolean('is_limited_edition').default(false),
    isDegenOfMonth: boolean('is_degen_of_month').default(false),
    eventMonth: varchar('event_month', { length: 20 }),

    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => [
    // token_id is already indexed by its UNIQUE constraint.
    index('idx_cards_faction').on(t.faction),
    index('idx_cards_rarity').on(t.rarity),
    index('idx_cards_tier').on(t.tier),
  ],
);

// ── TOURNAMENTS ──────────────────────────────────────────────────────
export const tournaments = pgTable(
  'tournaments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tier: varchar('tier', { length: 50 }).notNull(),
    entryFeeCents: integer('entry_fee_cents').notNull(),

    startTime: timestamp('start_time').notNull(),
    endTime: timestamp('end_time').notNull(),
    durationSeconds: integer('duration_seconds').notNull(),

    prizePoolCents: bigint('prize_pool_cents', { mode: 'number' }).default(0),
    platformRakeCents: bigint('platform_rake_cents', { mode: 'number' }).default(0),
    guaranteedMinimumCents: bigint('guaranteed_minimum_cents', { mode: 'number' }).default(0),

    playerCount: integer('player_count').default(0),
    maxPlayers: integer('max_players'),

    status: varchar('status', { length: 20 }).default('UPCOMING'),
    settings: jsonb('settings'),

    finalizedAt: timestamp('finalized_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => [
    index('idx_tournaments_tier').on(t.tier),
    index('idx_tournaments_status').on(t.status),
    index('idx_tournaments_start_time').on(t.startTime),
    index('idx_tournaments_created_at').on(t.createdAt),
  ],
);

// ── USER CARD OWNERSHIP ──────────────────────────────────────────────
export const userCards = pgTable(
  'user_cards',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    cardId: uuid('card_id')
      .notNull()
      .references(() => cards.id),

    tokenId: bigint('token_id', { mode: 'number' }).notNull(),
    quantity: integer('quantity').default(1),

    condition: varchar('condition', { length: 20 }).default('PRISTINE'),
    conditionLastChanged: timestamp('condition_last_changed'),

    timesUsed: integer('times_used').default(0),
    totalXpEarned: bigint('total_xp_earned', { mode: 'number' }).default(0),
    evolutionProgress: numeric('evolution_progress', { precision: 5, scale: 4 }).default('0'),

    isInRepair: boolean('is_in_repair').default(false),
    repairStartedAt: timestamp('repair_started_at'),
    repairEndsAt: timestamp('repair_ends_at'),
    repairMethod: varchar('repair_method', { length: 20 }),

    isStaked: boolean('is_staked').default(false),
    stakedAt: timestamp('staked_at'),
    stakedFor: varchar('staked_for', { length: 50 }),

    acquiredAt: timestamp('acquired_at').defaultNow(),
    lastUsedAt: timestamp('last_used_at'),
  },
  (t) => [
    index('idx_user_cards_user').on(t.userId),
    index('idx_user_cards_card').on(t.cardId),
    index('idx_user_cards_condition').on(t.condition),
    index('idx_user_cards_staked').on(t.isStaked),
  ],
);

// ── PREDICTION MARKETS ───────────────────────────────────────────────
export const markets = pgTable(
  'markets',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    question: text('question').notNull(),
    description: text('description'),
    category: varchar('category', { length: 50 }).notNull(),
    marketType: varchar('market_type', { length: 20 }).notNull(),

    outcomes: jsonb('outcomes').notNull(),

    createdAt: timestamp('created_at').defaultNow(),
    closesAt: timestamp('closes_at').notNull(),
    resolvesAt: timestamp('resolves_at'),

    resolutionSource: varchar('resolution_source', { length: 255 }),
    resolvedOutcome: varchar('resolved_outcome', { length: 100 }),
    resolvedAt: timestamp('resolved_at'),
    resolutionNotes: text('resolution_notes'),

    liquidityParameter: numeric('liquidity_parameter', { precision: 18, scale: 6 }).default('100'),
    outstandingShares: jsonb('outstanding_shares'),

    tournamentId: uuid('tournament_id').references(() => tournaments.id),
    eventId: uuid('event_id'),

    totalVolumeCents: bigint('total_volume_cents', { mode: 'number' }).default(0),
    uniqueBettors: integer('unique_bettors').default(0),

    status: varchar('status', { length: 20 }).default('OPEN'),

    creatorId: uuid('creator_id').references(() => users.id),
    difficulty: varchar('difficulty', { length: 20 }),
    tags: jsonb('tags'),
  },
  (t) => [
    index('idx_markets_category').on(t.category),
    index('idx_markets_status').on(t.status),
    index('idx_markets_closes_at').on(t.closesAt),
    index('idx_markets_tournament').on(t.tournamentId),
  ],
);

// ── TOURNAMENT ENTRIES ───────────────────────────────────────────────
export const tournamentEntries = pgTable(
  'tournament_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tournamentId: uuid('tournament_id')
      .notNull()
      .references(() => tournaments.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    entryFeePaidCents: integer('entry_fee_paid_cents').notNull(),
    paymentCurrency: varchar('payment_currency', { length: 10 }).notNull(),
    paymentTxHash: varchar('payment_tx_hash', { length: 66 }),

    betsPlaced: integer('bets_placed').default(0),
    betsWon: integer('bets_won').default(0),
    betsLost: integer('bets_lost').default(0),
    totalWageredCents: bigint('total_wagered_cents', { mode: 'number' }).default(0),
    totalWonCents: bigint('total_won_cents', { mode: 'number' }).default(0),
    netProfitCents: bigint('net_profit_cents', { mode: 'number' }).default(0),

    finalRank: integer('final_rank'),
    percentile: numeric('percentile', { precision: 5, scale: 4 }),

    prizeWonCents: bigint('prize_won_cents', { mode: 'number' }).default(0),
    prizeClaimed: boolean('prize_claimed').default(false),
    prizeClaimedAt: timestamp('prize_claimed_at'),

    cardsUsed: jsonb('cards_used'),
    enteredAt: timestamp('entered_at').defaultNow(),
  },
  (t) => [
    index('idx_tournament_entries_tournament').on(t.tournamentId),
    index('idx_tournament_entries_user').on(t.userId),
    index('idx_tournament_entries_final_rank').on(t.finalRank),
  ],
);

// ── BETS ─────────────────────────────────────────────────────────────
export const bets = pgTable(
  'bets',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    marketId: uuid('market_id')
      .notNull()
      .references(() => markets.id),
    tournamentId: uuid('tournament_id').references(() => tournaments.id),
    cardId: uuid('card_id').references(() => cards.id),

    outcomeIndex: integer('outcome_index').notNull(),
    outcomeLabel: varchar('outcome_label', { length: 100 }),
    amountCents: bigint('amount_cents', { mode: 'number' }).notNull(),
    sharesPurchased: numeric('shares_purchased', { precision: 18, scale: 6 }),

    priceAtPurchase: numeric('price_at_purchase', { precision: 10, scale: 6 }),
    costBasisCents: bigint('cost_basis_cents', { mode: 'number' }),

    hasInsurance: boolean('has_insurance').default(false),
    insurancePremiumCents: bigint('insurance_premium_cents', { mode: 'number' }).default(0),

    placedAt: timestamp('placed_at').defaultNow(),
    secondsAfterMarketOpen: integer('seconds_after_market_open'),

    won: boolean('won'),
    payoutCents: bigint('payout_cents', { mode: 'number' }).default(0),
    netProfitCents: bigint('net_profit_cents', { mode: 'number' }),
    claimed: boolean('claimed').default(false),
    claimedAt: timestamp('claimed_at'),

    deviceType: varchar('device_type', { length: 20 }),
    sessionId: uuid('session_id'),
  },
  (t) => [
    index('idx_bets_user').on(t.userId),
    index('idx_bets_market').on(t.marketId),
    index('idx_bets_tournament').on(t.tournamentId),
    index('idx_bets_placed_at').on(t.placedAt),
  ],
);

// ── CARD EVOLUTIONS ──────────────────────────────────────────────────
export const cardEvolutions = pgTable(
  'card_evolutions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    sourceCardId: uuid('source_card_id')
      .notNull()
      .references(() => cards.id),
    resultCardId: uuid('result_card_id').references(() => cards.id),

    attemptedAt: timestamp('attempted_at').defaultNow(),
    success: boolean('success').notNull(),
    nearMiss: boolean('near_miss').default(false),

    madBurned: bigint('mad_burned', { mode: 'number' }).default(0),
    methSpent: bigint('meth_spent', { mode: 'number' }).default(0),
    cardsSacrificed: jsonb('cards_sacrificed'),

    sourceTier: integer('source_tier').notNull(),
    sourceCondition: varchar('source_condition', { length: 20 }),
    buzzScore: integer('buzz_score'),

    resultTier: integer('result_tier'),
    resultCondition: varchar('result_condition', { length: 20 }),

    timeToRetrySeconds: integer('time_to_retry_seconds'),
    sharedToSocial: boolean('shared_to_social').default(false),
  },
  (t) => [
    index('idx_card_evolutions_user').on(t.userId),
    index('idx_card_evolutions_attempted_at').on(t.attemptedAt),
    index('idx_card_evolutions_success').on(t.success),
    index('idx_card_evolutions_near_miss').on(t.nearMiss),
  ],
);

// ── mETH TRANSACTIONS (in-game currency ledger) ──────────────────────
export const methTransactions = pgTable(
  'meth_transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    transactionType: varchar('transaction_type', { length: 50 }).notNull(),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    balanceBefore: bigint('balance_before', { mode: 'number' }).notNull(),
    balanceAfter: bigint('balance_after', { mode: 'number' }).notNull(),

    source: varchar('source', { length: 100 }),
    referenceId: uuid('reference_id'),
    description: text('description'),

    recipientId: uuid('recipient_id').references(() => users.id),

    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => [
    index('idx_meth_transactions_user').on(t.userId),
    index('idx_meth_transactions_type').on(t.transactionType),
    index('idx_meth_transactions_created_at').on(t.createdAt),
  ],
);

// ── EVENTS (special weekly/monthly events) ───────────────────────────
export const events = pgTable(
  'events',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    eventType: varchar('event_type', { length: 50 }).notNull(),
    name: varchar('name', { length: 200 }).notNull(),
    description: text('description'),

    registrationOpens: timestamp('registration_opens'),
    registrationCloses: timestamp('registration_closes'),
    eventStarts: timestamp('event_starts'),
    eventEnds: timestamp('event_ends'),

    entryFeeMeth: bigint('entry_fee_meth', { mode: 'number' }).default(0),
    entryFeeMadCents: integer('entry_fee_mad_cents').default(0),
    requiredTier: integer('required_tier').default(0),

    prizePoolCents: bigint('prize_pool_cents', { mode: 'number' }).default(0),
    prizeDistribution: jsonb('prize_distribution'),

    participantCount: integer('participant_count').default(0),
    maxParticipants: integer('max_participants'),

    config: jsonb('config'),
    status: varchar('status', { length: 20 }).default('UPCOMING'),

    winners: jsonb('winners'),
    finalizedAt: timestamp('finalized_at'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => [
    index('idx_events_event_type').on(t.eventType),
    index('idx_events_status').on(t.status),
    index('idx_events_event_starts').on(t.eventStarts),
  ],
);

// ── EVENT ENTRIES ────────────────────────────────────────────────────
export const eventEntries = pgTable(
  'event_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    entryFeePaidMeth: bigint('entry_fee_paid_meth', { mode: 'number' }).default(0),
    entryFeePaidMadCents: integer('entry_fee_paid_mad_cents').default(0),

    score: bigint('score', { mode: 'number' }).default(0),
    rank: integer('rank'),

    progress: jsonb('progress'),

    prizeWonCents: bigint('prize_won_cents', { mode: 'number' }).default(0),
    prizeClaimed: boolean('prize_claimed').default(false),
    prizeClaimedAt: timestamp('prize_claimed_at'),

    enteredAt: timestamp('entered_at').defaultNow(),
  },
  (t) => [
    uniqueIndex('uq_event_entries_event_user').on(t.eventId, t.userId),
    index('idx_event_entries_user').on(t.userId),
    index('idx_event_entries_rank').on(t.rank),
  ],
);

// ── DEGEN OF MONTH NOMINATIONS ───────────────────────────────────────
export const degenNominations = pgTable(
  'degen_nominations',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    eventMonth: varchar('event_month', { length: 20 }).notNull(),
    category: varchar('category', { length: 50 }).notNull(),

    nomineeName: varchar('nominee_name', { length: 200 }).notNull(),
    realName: varchar('real_name', { length: 200 }),
    incidentDate: timestamp('incident_date'),
    description: text('description'),
    evidenceLinks: jsonb('evidence_links'),

    nominatedBy: uuid('nominated_by').references(() => users.id),
    nominationCostMeth: bigint('nomination_cost_meth', { mode: 'number' }).default(88),

    upvotes: integer('upvotes').default(0),
    comments: integer('comments').default(0),

    advancedToVoting: boolean('advanced_to_voting').default(false),
    votes: bigint('votes', { mode: 'number' }).default(0),
    totalVoters: integer('total_voters').default(0),

    won: boolean('won').default(false),
    cardGenerated: boolean('card_generated').default(false),
    cardId: uuid('card_id').references(() => cards.id),

    nominatedAt: timestamp('nominated_at').defaultNow(),
  },
  (t) => [
    index('idx_degen_nominations_event_month').on(t.eventMonth),
    index('idx_degen_nominations_category').on(t.category),
    index('idx_degen_nominations_votes').on(t.votes),
  ],
);

// ── SESSIONS (analytics session tracking; distinct from SIWE auth) ────
export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),

    sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
    anonymousId: uuid('anonymous_id'),

    deviceType: varchar('device_type', { length: 20 }),
    browser: varchar('browser', { length: 50 }),
    os: varchar('os', { length: 50 }),
    ipAddressHash: varchar('ip_address_hash', { length: 64 }),
    countryCode: varchar('country_code', { length: 2 }),

    pagesViewed: integer('pages_viewed').default(0),
    betsPlaced: integer('bets_placed').default(0),

    startedAt: timestamp('started_at').defaultNow(),
    lastActivityAt: timestamp('last_activity_at').defaultNow(),
    endedAt: timestamp('ended_at'),

    entryPage: text('entry_page'),
    exitPage: text('exit_page'),
    referrer: text('referrer'),
    utmSource: varchar('utm_source', { length: 100 }),
    utmMedium: varchar('utm_medium', { length: 100 }),
    utmCampaign: varchar('utm_campaign', { length: 100 }),
  },
  (t) => [
    index('idx_sessions_user').on(t.userId),
    index('idx_sessions_started_at').on(t.startedAt),
  ],
);

// ── REFERRALS ────────────────────────────────────────────────────────
export const referrals = pgTable(
  'referrals',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    referrerId: uuid('referrer_id')
      .notNull()
      .references(() => users.id),
    refereeId: uuid('referee_id').references(() => users.id),

    referralCode: varchar('referral_code', { length: 20 }).notNull().unique(),

    status: varchar('status', { length: 20 }).default('PENDING'),

    referrerRewardMeth: bigint('referrer_reward_meth', { mode: 'number' }).default(10000),
    refereeRewardMeth: bigint('referee_reward_meth', { mode: 'number' }).default(10000),
    rewardsClaimed: boolean('rewards_claimed').default(false),

    createdAt: timestamp('created_at').defaultNow(),
    completedAt: timestamp('completed_at'),
  },
  (t) => [
    index('idx_referrals_referrer').on(t.referrerId),
  ],
);

// ── ADMIN LOGS ───────────────────────────────────────────────────────
export const adminLogs = pgTable(
  'admin_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    adminId: uuid('admin_id')
      .notNull()
      .references(() => users.id),

    action: varchar('action', { length: 100 }).notNull(),
    targetType: varchar('target_type', { length: 50 }),
    targetId: uuid('target_id'),

    details: jsonb('details'),

    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => [
    index('idx_admin_logs_admin').on(t.adminId),
    index('idx_admin_logs_action').on(t.action),
    index('idx_admin_logs_created_at').on(t.createdAt),
  ],
);

// Section-1 (application DB) is complete: 15 tables. Sections 2–5 of
// MADHATS_DATABASE_SCHEMA.md (warehouse / event stream / aggregates / CDP)
// are a separate analytics system and are intentionally not modeled here.
