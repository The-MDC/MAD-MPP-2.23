# MΛDHAT'S GAMBIT — CONSOLIDATED PRODUCT SHEET & DEVELOPMENT SCOPE
## Single Source of Truth (Cross-Referenced Against Live Presentation)

> **Version:** vFinal Consolidated | March 20, 2026
> **Author:** Nicholas J. McLeod (Mr. madDegen)
> **Live Presentation:** https://the-mdc.github.io/MADHATs-Gambit-Presentation/
> **Sources Consolidated:**
> - Development Bible (Feb 24, 2026) — MVP→MAP Blueprint
> - Envazia Development Agreement (Dec 5, 2025) — Phase 1 Deliverables
> - GAP Analysis Build 3 vs Builds 1&2 (Jan 29, 2026) — Feature Completeness
> - MADGambit Website Scope v1 (Feb 2026) — Marketing Site
> - Data Monetization Scope (Dec 2024, updated Jan 2026)
> - WhitePaper v1.8 (Feb 2026) — 548KB Full Whitepaper
> - Tokenomics Document vFinal (Mar 2026) — Financial Architecture
> - 47K-word Dev Scope (Oct 2025) — Original EVM Architecture
> - Presentation HTML (Feb 25, 2026) — Canonical Feature Set

---

## 1. PRODUCT OVERVIEW

**What:** An entertainment-first prediction-conviction marketplace where users collect satirical NFT cards of public figures and bet on their next scandals — wrapped in RPG progression, dopamine-engineered UX, and on-chain loss protection.

**Tagline:** "Predict the Degeneracy. Get the Gossip. Hedge Your Bet."

**Core Loop:** COLLECT → PREDICT → RESOLVE → EVOLVE

| Step | Action | Mechanism |
|------|--------|-----------|
| 01. MINT | Acquire Card | Dutch Auction: price decays until sold |
| 02. STAKE | Place Bet | Binary/Multi/Over-Under via Bond Curve |
| 03. SHIELD | Opt-In Protection | Pay 2-4% premium, 28.8% recovery guaranteed |
| 04. ORACLE | Market Settles | Triple-Threat: Chainlink → News APIs → 66% vote |
| 05. OUTCOME | Win or Lose | Winner: Payout + Evolution + Saga Points |
| 06. SOCIAL | Roast / Lore | Attach memes → community vote → viral loop |

---

## 2. CANONICAL NUMBERS (Corrected March 20, 2026)

| Parameter | Value |
|-----------|-------|
| Platform Fee | **1.88%** globally |
| Community Profit Share | **28.8%** (display as 28%) |
| Creator Market Revenue | **40%** to creator (on creator-made markets ONLY) |
| MAD Shield Recovery | **28.8%** |
| Token Supply | 888,888,888 $MADx (fixed, immutable) |
| Seed Ask | $1M–$2M at $12M pre-money |
| Max Staking APY | 68% (MAD Tier) |
| Y3 Revenue Target | $154.5M Gross (Base Case Bull) |
| Y3 Volume Target | $4.2B annualized |
| TGE Hard Cap | $24M (Q2 2026) |

---

## 3. PLATFORM ARCHITECTURE

### 3.1 Tech Stack (from Dev Bible + Envazia Agreement)

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 19, TypeScript, Tailwind 4, Framer Motion, wagmi/viem |
| Backend | Node.js 20, NestJS 10+, TypeScript, Prisma/PostgreSQL, Redis, Kafka, GraphQL + REST |
| Smart Contracts | Solidity 0.8.20+, Foundry (primary), Hardhat (backup), OpenZeppelin |
| Oracles | Chainlink VRF + Automation, News API Layer, Community Vote |
| Data | PostgreSQL (game state), MongoDB (scraper), Redis (cache/real-time) |
| AI | Python, OpenAI/Custom LLM, Celery/Kafka task queuing |
| Infra | Docker/Kubernetes, AWS EKS, GitHub Actions CI/CD |
| Privacy | OpenFHE stub (Phase 1), Full FHE (Phase 2) |

### 3.2 Multi-Chain Architecture (from Presentation)

| Chain | Role | TX Cost | Use Cases |
|-------|------|---------|-----------|
| Arbitrum Nova | Primary Gameplay | <$0.0001 | Card minting, Evolution, Voting, Small bets |
| Arbitrum One | Liquidity & Vaults | <$0.01 | MAD Shield Vaults, High-value staking, Treasury |
| Ethereum L1 | Governance Anchor | Variable | MADDAO Proposals, Major Protocol Upgrades |
| Base L2 | Expansion (Phase 3) | <$0.001 | Retail Onboarding, Coinbase Wallet Integration |
| HyperEVM | AI Agent Settlement | Near-Zero | High-Frequency Trading, AI Arena |
| Sei Network | Ecosystem Expansion | <$0.001 | Cross-chain bridges |

---

## 4. SMART CONTRACT DELIVERABLES

### 4.1 Core Contracts (Referenced in Presentation)

| Contract | Status | Description |
|----------|--------|-------------|
| **PredictionMarket.sol** (game.sol) | ✅ Exists | Binary + multi-outcome markets, stake/resolve/claim |
| **BondingCurve.sol** | ✅ Exists | DL-LMSR instant liquidity, dynamic b parameter |
| **RiskOracle.sol** | ✅ Exists | GARCH(1,1) volatility, MAD Shield premium calculation |
| **StakingPool.sol** | ✅ Exists | 6-tier conviction staking (Bronze→MAD), Clout multipliers |
| **EvolutionEngine** | ⚠️ Referenced in deploy script | Card evolution, XP, rarity upgrades, burn mechanics |
| **MADDEXToken.sol** | ✅ Exists | ERC-20 + Permit, 888.88M supply, burn cap |
| **MadhatCard.sol** | ✅ Exists | ERC-1155 NFT cards, dynamic metadata |
| **MadhatTreasury.sol** | ✅ Exists | Revenue distribution, fee allocation |
| **CommunityTreasury.sol** | ✅ Exists | 28.8% community profit share distribution |

### 4.2 Contracts Needed (from Bible + Gap Analysis)

| Contract | Priority | Description |
|----------|----------|-------------|
| **MarketFactory.sol** | P0 | Deploys new prediction markets (binary, multi, scalar) |
| **DutchAuction.sol** | P0 | Scandal Pack price-discovery auctions (ref: Presentation #dutch-markets) |
| **SagaController.sol** | P1 | 90-day seasonal progression, 3 Acts per Saga (ref: Presentation #sagas-tab) |
| **ConvictionMarket.sol** | P1 | Time-weighted staking, longer lock = higher multiplier (ref: Presentation conviction) |
| **OracleIntegration.sol** | P1 | Triple-Threat wrapper: Chainlink → News API → Community 66% vote |
| **QuadraticVoting.sol** | P2 | MADDAO governance, 100K $MADx deposit for proposals (ref: Presentation #maddao) |
| **FactionWars.sol** | P2 | 8-faction competitive system (ref: Presentation #cards faction tags) |

### 4.3 Backend Microservices (from Envazia Agreement)

| Service | Function |
|---------|----------|
| Auth Service | Wallet + email/social login, JWT sessions |
| User Service | Profiles, levels, XP, rankings |
| Prediction Service | Market lifecycle, odds, resolution |
| NFT & Marketplace Service | Pack minting, card gallery, evolution |
| Wallet & DeFi Service | Staking, Shield premiums, yield distribution |
| Event Indexer Service | On-chain event monitoring, analytics stubs |

---

## 5. NFT CARD SYSTEM (from Presentation + Bible + Gap Analysis)

### 5.1 Card Specification

| Attribute | Value |
|-----------|-------|
| Total Cards | 992+ |
| Standard | ERC-1155 |
| Categories | Politics, Tech, Celebrity, Memes, Sports, Crypto, Entertainment, Influencer |
| Factions | 8 (Hollywood Hellraisers, Political Circus, Tech Titans, Sports Sinners, Music Mayhem, Influencer Inferno, Wall Street Wolves, Royal Ruckus) |
| Art Style | Pixar-style satirical caricatures |
| Metadata | Dynamic on-chain, updated by Chainlink Automation |
| Evolution | Winners get Golden Aura + yield boost; losers get Affliction |
| Drops | Weekly Scandal Packs synced with global news cycles |

### 5.2 Rarity Tiers (from Presentation)

| Rarity | Distribution | Staking APY | Clout Range | Evolution Burn |
|--------|-------------|-------------|-------------|---------------|
| Common | 60% | 8% | 0-30 | 100 $MADx |
| Uncommon | 25% | 10% | 31-60 | 250 $MADx |
| Rare | 10% | 13% | 61-100 | 500 $MADx |
| Epic | 4% | 20% | 101-140 | 1,000 $MADx |
| Legendary | 1% | 28% | 141-180 | 1,500 $MADx |
| Golden Hand / Mythic | <1% | 68% | 181-200 | 2,500 $MADx |

### 5.3 Card Breakdown (from Gap Analysis)

| Type | Count | Source |
|------|-------|--------|
| Base Cards | 112 | 8 factions × 14 characters |
| Crossover Cards | 784 | 112 × 7 other factions |
| Chaos Fusions | 56 | Merged characters (e.g., "TrumpYe") |
| Legendary Crossovers | 32 | "What If?" variants |
| Golden Panderverse | 8 | Ultra-rare, <0.01% drop |
| **Total** | **992** | |

---

## 6. GAME MECHANICS (from Presentation + Bible)

### 6.1 Prediction Market Types
- **Binary**: YES/NO outcomes (e.g., "Will X resign before Friday?")
- **Multi-Outcome**: Categorical (e.g., "Which celebrity?")
- **Over/Under**: Scalar ranges (e.g., "BTC price at midnight?")

### 6.2 Saga System (from Presentation #sagas-tab)
- 90-day seasons with 3 Acts (30 days each)
- Themed progression (e.g., "Year of the Snake")
- 10 themed markets per Act
- Season-specific rewards and storyline
- SagaController.sol manages lifecycle

### 6.3 Dutch Auction Scandal Packs (from Presentation #dutch-markets)
- Weekly drops synced to news cycles
- Price decays over time until sold (fair distribution)
- DutchAuction.sol contract
- $MADx exclusive medium

### 6.4 Scandal Scraper AI (from Presentation + Bible)
- Auto-proposes markets from trending cultural events
- Prioritizes by: Geolocation, Popularity, Comment volume, Celebrity relevance
- Feeds: Reuters/AP, social media APIs, crypto news aggregators
- Powers both market creation and NFT card generation

### 6.5 Conviction Markets (from Presentation)
- Time-weighted staking on outcomes
- Lock duration: 7-day minimum, 90-day maximum
- Multipliers: 1x (7d) → 3x (90d)
- Higher conviction = more insurance + yield
- Early unlock penalty: 50%

### 6.6 Tournaments & Quests (from Presentation #tournaments-tab)
- Competitive prediction events with entry fees
- Daily/weekly quest chains
- Leaderboard with seasonal rewards
- Guild/team battles (Phase 2)

### 6.7 Faction Wars (from Presentation)
- 8 factions compete across markets
- Cross-faction card mechanics
- Faction leaderboards and tournaments
- Loyalty rewards per faction

---

## 7. TRIPLE-THREAT ORACLE SYSTEM (from Presentation #oracle)

| Tier | Source | Latency | Purpose |
|------|--------|---------|---------|
| 1 | Chainlink (PRIMARY) | <5 min | On-chain verifiable data, API feeds, price feeds |
| 2 | News API Layer (SECONDARY) | 10-30 min | Reuters/AP keyword scan, triggered on dispute |
| 3 | Community Vote (TERTIARY) | 48 hours | Staked $MADx quadratic voting, 66% supermajority |

**Security:** Soft-Close on >500% volume spike. Commit-Reveal scheme prevents MEV/frontrunning.
**Audit:** CertiK / Trail of Bits scheduled pre-mainnet.

---

## 8. REVENUE MODEL (1.88% Fee)

### 8.1 Fee Distribution

**Platform-Made Markets:** 100% → Platform (1.88% of volume)
**Creator-Made Markets:** 40% ($0.752 per $100 bet) → Creator | 60% → Platform

**Platform Revenue Allocation:**
| Allocation | % | Purpose |
|-----------|---|---------|
| Operations | 35% | Team, infrastructure, development |
| MAD Shield Pool | 25% | Insurance fund capitalization |
| Token Burn | 10% | Deflationary buyback and burn |
| Community Rewards | 30% | Staking rewards, quests, tournaments |

### 8.2 Revenue Streams (from Presentation + Bible)
1. Transaction Fees (35%) — 1.88% on all prediction volume
2. NFT Sales (20%) — Dutch Auction weekly Scandal Packs
3. Staking Rewards Spread (25%) — DeFi yield spread on staked assets
4. Premium Features (20%) — AI Assistants (Elite/Pro/Basic), VIP tiers, data access
5. Data Monetization (future) — Cultural event dataset licensing to media/entertainment companies

### 8.3 AI Subscription Tiers (from Bible)
| Tier | Name | Features |
|------|------|----------|
| 1 | Basic | Portfolio monitoring, standard scanning, basic LLM Q&A |
| 2 | Degen (Pro) | 2 copy trading sources, smart assistant, custom flows |
| 3 | MADHATTER (Elite) | Max automations, 5 copy sources, 3 signals, unlimited LLM |

---

## 9. NEURODESIGN / DOPAMINE ENGINEERING (from Bible)

| Principle | Implementation | Trigger |
|-----------|---------------|---------|
| Variable Rewards | Card pack opening animation, mystery rewards, burn outcomes | Unpredictability encourages repetition |
| Progress & Mastery | XP bars, ranking tiers, "Saga Completed" milestones | Continuous sense of competence |
| Social Validation | Leaderboards, public bet wins, NFT showcase, sharing | Peer recognition |
| Loss Aversion | Staking lock-ups, daily login streaks, limited-time chaos markets | FOMO encourages daily engagement |
| Near-Miss | 30% base evolution chance, +15% near-miss bonus | Dopamine spike on almost-winning |
| Sunk Cost | Evolution chains, card leveling investment | Prevents churn from invested users |

### Key Components (from Bible + Gap Analysis Build 2)
- **NeuroTicker** — Scrolling breaking news banner
- **WhaleWatcher** — Real-time large-trade activity feed
- **GlobalChat** — Community chat sidebar
- **MysteryPack** — Animated pack reveal with fireworks
- **ChaosMeter** — Real-time scandal velocity indicator
- **DopaminePopup** — Achievement celebration modals
- **BetSlip** — Cart system for multi-bet placement

---

## 10. FRONTEND DELIVERABLES

### 10.1 Marketing Website (MADGambit.fun) — from Website Scope v1
- Single-page scrolling landing (6 sections)
- Email/social auth (NO Web3 required)
- Supabase integration
- Subdomain provisioning system
- Dashboard redirect to app.MADGambit.fun
- Target: Lighthouse >95, LCP <1.8s, <100KB bundle

### 10.2 Platform Dashboard (app.MADGambit.fun) — from Bible + Envazia
| Page | Description |
|------|-------------|
| Dashboard | Intel feed, portfolio overview, active bets |
| Marketplace | Pack minting, NFT gallery, Dutch auctions |
| Prediction Parlor | Market browsing, bet placement, odds display |
| Cards | Collection view, evolution, staking |
| Staking Vault | Conviction tier management, MAD Shield opt-in |
| Leaderboard | Global rankings, faction standings |
| Sagas | 90-day season tracker, Act progression |
| Tournaments | Entry, brackets, prizes |
| Profile | Stats, achievements, referrals |
| Settings | Wallet management, notifications |

---

## 11. DEVELOPMENT PHASES (Aligned: Envazia + Bible + Presentation Roadmap)

### Phase 1: MPP / Foundation (Q1 2026 — Envazia Scope)
- Core smart contracts deployed on testnet (Base Sepolia / Arbitrum Sepolia)
- Landing page + Dashboard + Marketplace + Prediction Parlor
- 6 backend microservices (Auth, User, Prediction, NFT, Wallet, Indexer)
- Basic card minting, binary markets, staking skeleton
- Target: Functional testnet deployment for testing

### Phase 2: MAP / Core Game (Q2 2026)
- $MADx TGE, DEX listings (Uniswap/Camelot)
- Scandal Scraper V1 feeding Chaos Markets
- NFT card evolution + leveling system
- Triple-Threat Oracle integration
- MAD Shield Pool activation
- Saga Season 1 launch
- Target: Product-market fit, 50K DAU

### Phase 3: Expansion (Q3 2026)
- Mobile app (iOS + Android)
- AI Agent Arena Beta
- Tier 2 (Degen) AI automation
- Creator market creation tools
- Base L2 integration
- Target: 150K DAU, $9.6M revenue

### Phase 4: Ecosystem (Q4 2026+)
- Full DAO governance (QuadraticVoting.sol)
- HyperEVM + Sei deployment
- Tier 3 (MADHATTER) AI automation
- Cross-chain bridges
- Data monetization layer
- Target: 750K DAU, full decentralization path

---

## 12. DATA MONETIZATION LAYER (from Data Management Scope)

Future revenue stream: The platform's proprietary cultural event dataset becomes licensable infrastructure.

| Component | Purpose |
|-----------|---------|
| Data Ingestion | Scandal Scraper feeds into BigQuery or proprietary warehouse |
| Visualization | Advanced analytics dashboard (Tableau/Looker-style) |
| ML Analysis | Sentiment analysis, trend prediction, market correlation |
| Licensing | API access for media companies, entertainment studios, marketing agencies |

This aligns with the VC stress-test recommendation to become the "Cultural API" — embed prediction widgets on gossip sites and license cultural sentiment data.

---

## 13. ENVAZIA PARTNERSHIP TERMS (from Agreement Dec 5, 2025)

| Term | Value |
|------|-------|
| Developer | Envazia Technologies (Ahmed Ali, CEO) |
| Phase 1 (MPP) | Fixed price, all-inclusive |
| Phase 2 (MAP) | Funded by $250K round |
| Payment | $100K pre-TGE, $50K post-TGE |
| Revenue Share | 5% net revenue to Envazia (ongoing) |
| IP | Client owns all deliverables (vests with Dev Studio until final payment) |
| Tech Stack | Next.js 14, React 19, NestJS 10+, Solidity 0.8.20+, Prisma/PostgreSQL |
| Sprint Structure | 6 sprints: Setup → Contracts → Backend → Frontend → Integration → QA |

---

*This consolidated product sheet supersedes all previous dev scopes, bibles, and specifications. For canonical numbers, see `02-tokenomics/CANONICAL_NUMBERS.md`. For the live source of truth, see https://the-mdc.github.io/MADHATs-Gambit-Presentation/*
