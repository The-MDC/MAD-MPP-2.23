# Comprehensive MVP vs Current State Report
> Scanned: MPP-2.0 repo (203 files), demo-repository (15 contracts), Live Presentation
> Date: March 23, 2026

---

## EXECUTIVE SUMMARY

The old MVP (MPP-2.0) built 9 working frontend pages with a FastAPI backend and 17+ API endpoints covering Dutch Auctions, Prediction Markets, Conviction Markets, Insurance/Shield, Story Sagas, Card Play, Staking, Tournaments, and Leaderboards. The current codebase has 8 production smart contracts but ZERO of the old MVP's page functionality is wired to them. The presentation describes a 7-step loop that the old MVP partially implements at the UI level but the contracts don't support yet.

**The gap:** The old MVP has proven UI patterns for DutchAuction, MarketFactory, and InsuranceShield that need to be formalized into the missing smart contracts.

---

## OLD MVP (MPP-2.0) — What Was Built

### Architecture
- **Frontend:** React (CRA + Craco + Tailwind) on port 3000
- **Backend:** FastAPI + Motor (MongoDB async) on port 8001
- **Database:** MongoDB (Emergent-managed)
- **Auth:** Google OAuth + demo social logins
- **Wallet:** MetaMask detection + simulated wallets
- **Prices:** CoinGecko API (30s cache, 30 coins live)

### 9 Implemented Pages

| Page | File | Lines | Mechanics Implemented |
|------|------|-------|----------------------|
| **Dutch Auction** | DutchAuctionPage.jsx | 6,833B | Auction cards with current/base/remaining display. Price rises logarithmically with demand. Bid panel with quantity selector. Progress bar (sold/total). BID NOW CTA at current price. |
| **Prediction Markets** | PredictionMarketsPage.jsx | 7,955B | Binary YES/NO markets. Category filters (all, crypto, entertainment, politics, etc.). Dynamic odds display. Bet panel with side selector + amount. Participant count per market. |
| **Conviction Markets** | ConvictionMarketsPage.jsx | 5,837B | Time-weighted staking. Support/Oppose sides. Conviction score with decay rate per hour. Scores decay unless reinforced — unique mechanic. |
| **Insurance/Shield** | InsurancePage.jsx | 7,059B | 3 product types: Stop Loss, TeaBag Shield, Full Insurance. Premium calculation based on position amount. Purchase flow with confirmation. |
| **Card Play** | CardPlayPage.jsx | 11,070B | 7 rarity tiers (common→mythic). 8 factions (Disruptors, Elites, Chaos, Drama Guild, Degens, Royalists, Masses, MAD Council). Card evolution with XP/level. Pack opening with animation. PvP card battles with wager. |
| **Saga Seasons** | SagaPage.jsx | 11,735B | 3 sagas with 8 factions. Chapter timelines with weekly progression. Faction selection + joining. Per-chapter predictions with amounts. Saga XP tracking. |
| **Staking** | StakingPage.jsx | 5,730B | Tier-based staking with lock durations. APY display. Stake/unstake flow. |
| **Tournament** | TournamentPage.jsx | 4,985B | 8-tier bracket system (Baby Yoda → Mega Balls). Tournament progression. |
| **Dashboard** | DashboardPage.jsx | 4,797B | Portfolio overview, position tracking, P&L. |

### 17+ Backend API Endpoints
```
/api/markets/prediction    — List prediction markets
/api/markets/conviction    — List conviction markets  
/api/markets/dutch-auction — List dutch auctions
/api/markets/bet           — Place bet (shared endpoint)
/api/insurance/products    — List insurance products
/api/insurance/purchase    — Purchase insurance
/api/saga/list             — List sagas + factions
/api/saga/predict          — Make saga prediction
/api/saga/join-faction     — Join a faction
/api/cards/deck            — Get user's card deck
/api/cards/play            — Play a card (PvP battle)
/api/cards/evolve          — Evolve a card
/api/cards/open-pack       — Open a scandal pack
/api/staking/*             — Staking endpoints
/api/user/*                — User data endpoints
```

### Next.js Version (Newer Attempt)
A parallel Next.js app exists in `src/` with:
- Contract stubs (`contracts.ts`) — all functions throw `ContractsNotReadyError`
- Feature flags (`features.ts`) — `SMART_CONTRACTS_ENABLED=false` gates all Web3
- API routes: `/api/contracts/status`, `/api/health`, `/api/wager`
- Pages: arena, dashboard, leaderboard, wager
- Supabase integration stub

### 3 Iterations Completed
1. **Iteration 1:** Core MVP (17 endpoints, 9 pages, neon theme)
2. **Iteration 2:** Presentation-grade aesthetic (frozen header, 56+ ticker assets, glassmorphism)
3. **Iteration 3:** Google OAuth live, MetaMask detection, CoinGecko live, Card evolution, Tournaments, Saga Seasons

---

## CURRENT STATE — Smart Contracts (demo-repository)

### 8 Built Contracts (4,344 lines total)
| Contract | Lines | What It Does |
|----------|-------|-------------|
| MADDEXToken.sol | 319 | ERC-20 $MADx token |
| MadhatCard.sol | 663 | ERC-1155 NFT cards, 4 rarity tiers, evolution |
| BondingCurve.sol | 119 | DL-LMSR pricing, FEE_BPS=188, CREATOR_SHARE=4000 |
| OnChainPrediction (game.sol) | 605 | Binary prediction markets, YES/NO betting |
| RiskOracle.sol | 114 | GARCH volatility model, premium calculation |
| StakingPool.sol | 661 | 6-tier staking with NFT multipliers |
| MadhatTreasury.sol | 597 | Fee distribution (35/25/10/30 split) |
| CommunityTreasury.sol | 135 | 28.8% community share distribution |

### 7 Missing Contracts (Referenced in Presentation)
| Contract | Priority | Old MVP Had UI? |
|----------|----------|-----------------|
| **DutchAuction.sol** | P0 | ✅ YES — DutchAuctionPage.jsx |
| **MarketFactory.sol** | P0 | ✅ YES — PredictionMarketsPage creates markets |
| **OracleIntegration.sol** | P1 | ❌ No — was simulated |
| **SagaController.sol** | P1 | ✅ YES — SagaPage.jsx |
| **QuadraticVoting.sol** | P2 | ❌ No |
| **FactionWars.sol** | P2 | ✅ YES — CardPlayPage has 8 factions |
| **ConvictionMarket.sol** | P2 | ✅ YES — ConvictionMarketsPage.jsx |

---

## COMPARISON: Old MVP vs Presentation vs Contracts

### Core Loop Evolution

| Step | Original 4-Step | Old MVP (9 pages) | Presentation (7-Step) | Smart Contracts |
|------|----------------|--------------------|-----------------------|-----------------|
| 1. COLLECT | Collect | ✅ DutchAuctionPage + CardPlay pack opener | Mint Scandal Packs via Dutch Auction | ❌ No DutchAuction.sol |
| 2. PREDICT | Predict | ✅ PredictionMarketsPage + ConvictionMarketsPage | Predict & Stake (5 market types) | ✅ OnChainPrediction (binary only) |
| 3. SHIELD | — | ✅ InsurancePage (3 types: StopLoss, TeaBag, Full) | Activate MAD Shield (2-4% premium, 28.8% recovery) | ⚠️ RiskOracle.sol (calc only, no shield pool) |
| 4. RESOLVE | Resolve | ❌ Simulated outcomes | Triple-Threat Oracle | ❌ No OracleIntegration.sol |
| 5. EVOLVE | Evolve | ✅ CardPlayPage (XP, level, power progression) | Card Evolution (Common→Legendary) | ⚠️ MadhatCard has tiers but no evolution engine |
| 6. ROAST | — | ❌ Not implemented | Roast & Create (Scandal Scraper AI) | ❌ No MarketFactory.sol |
| 7. STAKE | — | ✅ StakingPage (tier-based) | Stake & Govern (6 tiers, 12-68% APY) | ✅ StakingPool.sol |

### Market Types

| Type | Old MVP | Presentation | Contracts |
|------|---------|-------------|-----------|
| Binary (YES/NO) | ✅ PredictionMarketsPage | ✅ | ✅ OnChainPrediction |
| Multi-Outcome | ❌ | ✅ | ❌ |
| Over/Under (Scalar) | ❌ | ✅ | ❌ |
| Conviction (Time-Weighted) | ✅ ConvictionMarketsPage | ✅ | ❌ |
| PvP | ✅ CardPlayPage battles | ✅ | ❌ |
| Chaos | ❌ | ✅ | ❌ |

### Card/NFT System

| Feature | Old MVP | Presentation | Contracts |
|---------|---------|-------------|-----------|
| Rarity tiers | 7 (common→mythic) | 6 (Common→Golden Hand) | 4 (Common→Ultimate) |
| Factions | 8 (Disruptors, Elites, Chaos, Drama Guild, Degens, Royalists, Masses, MAD Council) | 8 (Hollywood, Political, Tech, Sports, Music, Influencer, WallStreet, Royal) | ❌ Not in contract |
| Evolution | ✅ XP + level + power | ✅ Win streaks trigger evolution | ⚠️ Tier enum exists, no evolution logic |
| Pack Opening | ✅ Animated reveal | ✅ Dutch Auction packs | ❌ No DutchAuction.sol |
| Card Battles | ✅ PvP with wager | ❌ Not in current scope | ❌ |

### Insurance/Shield

| Feature | Old MVP | Presentation | Contracts |
|---------|---------|-------------|-----------|
| Stop Loss | ✅ | Merged into MAD Shield | ❌ |
| TeaBag Shield | ✅ | Merged into MAD Shield | ❌ |
| Full Insurance | ✅ | Merged into MAD Shield | ❌ |
| Premium | Simulated | 2-4% of position | ⚠️ RiskOracle calculates but no pool |
| Recovery | Simulated | 28.8% of losses | ⚠️ Constant exists, no payout mechanism |

### Saga/Season System

| Feature | Old MVP | Presentation | Contracts |
|---------|---------|-------------|-----------|
| Seasons | ✅ 3 sagas | ✅ 90-day, 3 Acts | ❌ No SagaController.sol |
| Factions | ✅ 8 + join mechanic | ✅ 8 factions | ❌ |
| Chapter progression | ✅ Weekly chapters | ✅ 10 themed markets per Act | ❌ |
| Faction XP | ✅ Saga XP tracking | ✅ | ❌ |

---

## KEY FINDINGS

### 1. The Old MVP Has MORE Features Than Current Contracts Support
The MVP built working UI for 6 of the 7 missing contracts. This means the frontend patterns exist — we just need contracts to back them.

### 2. Faction System Renamed But Same Structure
Old: Disruptors, Elites, Chaos, Drama Guild, Degens, Royalists, Masses, MAD Council
New: Hollywood, Political, Tech, Sports, Music, Influencer, WallStreet, Royal
Same 8-faction structure — just renamed for the entertainment prediction market pivot.

### 3. Insurance Products Consolidated
The old MVP had 3 separate insurance products (Stop Loss, TeaBag Shield, Full Insurance). The presentation merges all three into "MAD Shield" with a single 2-4% premium and 28.8% recovery guarantee. The contract just needs one mechanism, not three.

### 4. Card Rarity Tiers Need Updating
- Old MVP: 7 tiers (common, uncommon, rare, epic, legendary, golden_hand, mythic)
- Presentation: 6 tiers (Common 60%, Uncommon 25%, Rare 10%, Epic 4%, Legendary 1%, Golden Hand <1%)
- Contract: 4 tiers (Common, Uncommon, Rare, Ultimate)
**Action:** Update MadhatCard.sol to match presentation's 6-tier system.

### 5. Conviction Markets Are a Unique Mechanic
The conviction scoring with time-decay ("scores decay over time unless reinforced") is NOT in any competitor. This was in the old MVP but isn't mentioned in the current contract spec. Consider adding ConvictionMarket.sol to P1.

### 6. Contract Stubs Prove the Gap Was Known
The Next.js version has explicit `ContractsNotReadyError` — confirming that the team knew contracts were the blocker. Feature flags gate all Web3 functionality behind `SMART_CONTRACTS_ENABLED=false`.

---

## URL STATUS

| URL | Status | Content |
|-----|--------|---------|
| `mad-upshot.apisdor.com` | ❌ DNS dead | Was the Apisdor dev staging environment — completely offline |
| `the-mdc.github.io/MADHATs-Gambit-Presentation/` | ⚠️ Private repo now | Was the live presentation (292KB HTML) — may need to be made public for investors |
| Two "Loading..." URLs | ❌ Not received | Nick: please re-paste these as plain text |

---

## RECOMMENDATIONS FOR DutchAuction.sol + MarketFactory.sol

Based on the old MVP mechanics, the contracts should implement:

### DutchAuction.sol (from DutchAuctionPage.jsx)
- `createAuction(title, description, basePrice, itemsTotal, duration)`
- `purchase(auctionId, quantity)` — price rises logarithmically with demand (NOT decays — the MVP used bonding curve pricing, presentation says decay)
- **DECISION NEEDED:** Old MVP uses ascending price (bonding curve). Presentation says "price decays until sold." These are opposite mechanics. Recommend: **Use presentation's descending Dutch Auction** (standard, fair distribution).
- Track: items_sold, items_total, current_price, base_price
- Integrate: MadhatCard.sol mint on purchase, Chainlink VRF for rarity randomization

### MarketFactory.sol (from PredictionMarketsPage.jsx + ConvictionMarketsPage.jsx)
- `createBinaryMarket(question, category, endTime)` — from PredictionMarketsPage
- `createConvictionMarket(question, category, decayRate)` — from ConvictionMarketsPage
- `createMultiOutcomeMarket(question, outcomes[], endTime)` — from presentation
- Creator fee routing: 40% of 1.88% to creator address (from BondingCurve constants)
- Category filter system (crypto, entertainment, politics, sports, etc.)

---

*Comprehensive scan of 203 files in MPP-2.0, 15 contracts + 6 ABIs in demo-repository, and the full 292KB live presentation HTML.*
