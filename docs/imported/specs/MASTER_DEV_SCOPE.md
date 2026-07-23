# MΛDHAT'S GAMBIT — MASTER DEVELOPMENT SCOPE
## Consolidated from 13 Source Documents | March 20, 2026
> Live Presentation (Source of Truth): https://the-mdc.github.io/MADHATs-Gambit-Presentation/

---

## 1. ARCHITECTURE OVERVIEW

### 1.1 Tech Stack (from Dev Bible + Envazia Agreement + Azuro Analysis)

| Layer | Technology | Source |
|-------|-----------|--------|
| Frontend | Next.js 14, React 19, TypeScript, Tailwind 4, Framer Motion, wagmi/viem | Envazia Agreement |
| Auth | Privy (email/social/wallet), gasless AA, JWT sessions | Azuro Analysis / Bible |
| Backend | Node.js 20, NestJS 10+, TypeScript, Prisma ORM, GraphQL + REST | Envazia Agreement |
| Database | PostgreSQL (game state), MongoDB (scraper), Redis (cache/pubsub) | Bible |
| Smart Contracts | Solidity 0.8.20+, Foundry (primary), OpenZeppelin 5.x | Envazia + Core repo |
| Oracles | Chainlink VRF + Automation, News API Layer, Community Vote | EVM Guide |
| AI/ML | Python, OpenAI/Custom LLM, Celery/Kafka task queuing | Bible |
| Privacy | Zama fhEVM (encrypted bets, Phase 2) | Azuro Analysis |
| Infra | Docker/Kubernetes, AWS EKS, GitHub Actions CI/CD | Bible |
| Indexing | TheGraph subgraph for on-chain events | Azuro Analysis |

### 1.2 Multi-Chain Deployment

| Chain | Role | Contracts | TX Cost |
|-------|------|-----------|---------|
| Arbitrum Nova | Primary Gameplay | All core contracts | <$0.0001 |
| Arbitrum One | Liquidity Vaults | StakingPool, Treasury | <$0.01 |
| Arbitrum Sepolia | Testnet | All (deployment target) | Free |
| Base L2 (Phase 3) | Retail Expansion | Token bridge + markets | <$0.001 |
| HyperEVM (Phase 4) | AI Settlement | AI Agent Arena | Near-zero |
| Sei Network (Phase 4) | Ecosystem | Cross-chain bridges | <$0.001 |

---

## 2. SMART CONTRACT ARCHITECTURE

### 2.1 Core Contracts (9 Existing + 7 Needed)

**EXISTING (in repo):**

| Contract | File | Lines | Function |
|----------|------|-------|----------|
| PredictionMarket | game.sol | — | Market lifecycle: create, bet, resolve, claim |
| BondingCurve | BondingCurve.sol | 120 | DL-LMSR instant liquidity, FEE_BPS=188 |
| RiskOracle | RiskOracle.sol | — | GARCH(1,1) volatility, Shield premium calc |
| StakingPool | StakingPool.sol | — | 6-tier conviction staking, Clout multipliers |
| MADDEXToken | MADDEXToken.sol | — | ERC-20 + Permit, 888.88M supply |
| MADxToken | MADxToken.sol | — | Alternate token implementation |
| MadhatCard | MadhatCard.sol | — | ERC-1155 NFT cards |
| MadhatCardOptimized | MadhatCardOptimized.sol | — | Gas-optimized card variant |
| MadhatTreasury | MadhatTreasury.sol | — | Revenue distribution |
| CommunityTreasury | CommunityTreasury.sol | — | 28.8% community profit share |
| DeployCoreContracts | DeployCoreContracts.s.sol | — | Foundry deployment script |

**NEEDED (referenced in presentation/whitepaper):**

| Contract | Priority | Presentation Ref | Interface Spec |
|----------|----------|------------------|----------------|
| MarketFactory.sol | P0 | #markets | createMarket(scandalId, outcomes, endTime, resolutionSource) |
| DutchAuction.sol | P0 | #dutch-markets | createAuction(packId, startPrice, decayRate, minPrice) |
| OracleIntegration.sol | P1 | #oracle | resolveWithChainlink(), resolveWithNewsAPI(), resolveWithVote() |
| SagaController.sol | P1 | #sagas-tab | startSeason(name, duration), advanceAct(), endSeason() |
| ConvictionMarket.sol | P1 | conviction refs | stake(marketId, amount, lockDuration), getMultiplier(duration) |
| QuadraticVoting.sol | P2 | #maddao | createProposal(100K deposit), vote(sqrt(tokens)), execute() |
| FactionWars.sol | P2 | #cards factions | joinFaction(factionId), submitScore(), getLeaderboard() |

### 2.2 Contract Interfaces (from EVM Guide)

```solidity
// PredictionMarket.sol
interface IPredictionMarket {
    function createMarket(bytes32 scandalId, bytes32[] outcomes, uint256 endTime, address resolutionSource) external returns (uint256);
    function placeBet(uint256 marketId, bytes32 outcome, uint256 amount) external;
    function resolveMarket(uint256 marketId, bytes32 winningOutcome, bytes memory proof) external;
    function claimWinnings(uint256 marketId) external;
}

// BondingCurve.sol
interface IBondingCurve {
    function buyShares(uint256 marketId, bytes32 outcome, uint256 amount) external returns (uint256);
    function sellShares(uint256 marketId, bytes32 outcome, uint256 shares) external returns (uint256);
    function calculateBuyPrice(uint256 marketId, bytes32 outcome, uint256 amount) external view returns (uint256);
}
```

### 2.3 Deployment Sequence (from Azuro Analysis)

```bash
# 1. Setup
mkdir madhats-gambit-contracts && cd madhats-gambit-contracts
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts @chainlink/contracts dotenv

# 2. Deploy (Arbitrum Sepolia)
npx hardhat run scripts/deployAll.ts --network arbitrumSepolia

# Sequence: MADDEXToken → BondingCurve → StakingPool → PredictionMarket → Verify → Seed
```

### 2.4 Key Addresses (from Azuro Analysis — Verified Jan 2026)
- Chainlink VRF Arbitrum Sepolia: `0x5CE8D9A8dD9e5b0cE0eC3c6bB2A9fD4a5b0f6D87`
- Morpho Blue Arbitrum Core: `0x870aCB5B5e4A0A5f8D8c7E8e0F9B7B5d5f5b5f5b`
- Arbitrum Sepolia RPC: `https://sepolia-rollup.arbitrum.io/rpc`

---

## 3. BACKEND MICROSERVICES (from Envazia Agreement)

| Service | Endpoints | Database | Key Functions |
|---------|-----------|----------|---------------|
| Auth Service | /auth/login, /auth/verify, /auth/wallet | PostgreSQL | Privy integration, JWT, wallet linking |
| User Service | /users/profile, /users/level, /users/xp | PostgreSQL | Profiles, XP, rankings, achievements |
| Prediction Service | /markets/*, /bets/*, /resolve/* | PostgreSQL + Redis | Market CRUD, odds calc, settlement queue |
| NFT Service | /packs/*, /cards/*, /evolve/* | PostgreSQL + IPFS | Pack minting, gallery, evolution triggers |
| Wallet Service | /stake/*, /shield/*, /yield/* | PostgreSQL + Redis | Staking tiers, Shield opt-in, yield distribution |
| Event Indexer | Internal only | MongoDB | On-chain event monitoring, TheGraph sync |
| Scandal Scraper | /scraper/trends, /scraper/propose | MongoDB | AI content pipeline, Reuters/AP/social feeds |

---

## 4. FRONTEND PAGES (from Bible + Envazia)

| Page | Route | Key Components |
|------|-------|---------------|
| Landing (Marketing) | madgambit.fun/ | Hero, Features, CTA, Auth |
| Dashboard | app.madgambit.fun/ | IntelFeed, Portfolio, ActiveBets, NeuroTicker |
| Marketplace | /marketplace | PackOpener, DutchAuction, CardGallery |
| Prediction Parlor | /markets | MarketBrowser, BetSlip, OddsDisplay, ChaosMeter |
| Cards | /cards | CollectionView, EvolutionUI, StakingPanel |
| Staking Vault | /staking | TierManager, ShieldOptIn, YieldDashboard |
| Leaderboard | /leaderboard | GlobalRanks, FactionStandings, SeasonalRewards |
| Sagas | /sagas | SeasonTracker, ActProgression, ThemeMarkets |
| Tournaments | /tournaments | EntryForm, Brackets, LiveTracker, Prizes |
| Profile | /profile | Stats, Achievements, Referrals, Settings |

### 4.1 Neurodesign Components (from Bible)
- NeuroTicker: Scrolling breaking news banner
- WhaleWatcher: Large-trade activity feed
- ChaosMeter: Real-time scandal velocity
- MysteryPack: Animated pack opening reveal
- DopaminePopup: Achievement celebration modals
- BetSlip: Multi-bet cart system

---

## 5. DEVELOPMENT PHASES

### Phase 1: MPP (Q1 2026) — Envazia Scope
- Sprint 1 (2wk): Repo setup, CI/CD, Foundry config, Arbitrum Sepolia
- Sprint 2 (2wk): Core contracts deploy + test (Token, Market, Curve, Staking)
- Sprint 3 (2wk): Backend microservices (Auth, User, Prediction, NFT, Wallet, Indexer)
- Sprint 4 (2wk): Frontend (Landing + Dashboard + Marketplace + Parlor)
- Sprint 5 (2wk): Integration (contract↔backend↔frontend, TheGraph)
- Sprint 6 (2wk): QA, security review, testnet deployment
- **Deliverable:** Functional testnet with binary markets, card minting, basic staking

### Phase 2: MAP (Q2 2026) — Post-Seed
- TGE ($MADx launch, DEX listings)
- Scandal Scraper V1
- Card evolution + leveling system
- Triple-Threat Oracle integration
- MAD Shield Pool activation
- Saga Season 1
- **Target:** 50K DAU, product-market fit

### Phase 3: Expansion (Q3 2026)
- Mobile (iOS + Android)
- AI Agent Arena Beta
- Creator market tools
- Base L2 integration
- **Target:** 150K DAU

### Phase 4: Ecosystem (Q4 2026+)
- Full DAO governance
- HyperEVM + Sei deployment
- FHE privacy (Zama fhEVM)
- Cross-chain bridges
- Data monetization API
- **Target:** 750K DAU

---

## 6. INFRASTRUCTURE CONSIDERATIONS (from Azuro Analysis)

### 6.1 Build vs Buy Decision
Azuro Protocol ($530M+ volume, 40+ apps) offers ready-made prediction infrastructure with shared liquidity. **Decision:** Build custom (DL-LMSR bond curve) for differentiation, but evaluate Azuro SDK for sports/generic markets as expansion path.

### 6.2 Alternative Protocols Evaluated
- Azuro: Best EVM infra, shared liquidity, but loss of differentiation
- Polyport (Solana): Speed-optimized, potential Solana expansion path
- PredictOS: AI agent toolkit, potential integration for Scandal Scraper
- Gnosis Conditional Tokens: Composable, potential for complex market types

---

*Sources: Dev Bible, Envazia Agreement, EVM Implementation Guide, Azuro/PredictOS Analysis, 47K Dev Scope, WhitePaper v1.8, Presentation HTML, CLAUDE_CODE instructions, API Spec, DB Schema*

---

## 7. NEURODESIGN IMPLEMENTATION (from Neuroscience Systems Doc)

### 7.1 TypeScript Modules (Production-Ready)

```typescript
// Integration hook
const { neuroscienceSystem, metrics, session } = useNeuroscience(userProfile, config);

// Process prediction with full optimization
const results = await neuroscienceSystem.processPrediction({
  type: 'price', stake: 25, complexity: 7, multiplier: 2.5
});

// Handle recovery after loss
if (results.lossScenario) {
  const recovery = await neuroscienceSystem.executeRecovery(opportunityId, action);
}
```

### 7.2 Module Integration Points

| Module | Backend Service | Frontend Component | Phase |
|--------|---------------|-------------------|-------|
| dopamineOptimizer | Prediction Service | MysteryPack, DopaminePopup | Phase 1 |
| socialMirroring | User Service + Redis PubSub | WhaleWatcher, GlobalChat | Phase 1 |
| anticipationEngine | Prediction Service | ChaosMeter, countdown UIs | Phase 1 |
| lossAversionEngine | Wallet Service + RiskOracle | BetSlip, Shield opt-in | Phase 2 |
| sunkCostReinforcement | NFT Service | Evolution UI, card leveling | Phase 2 |
| recoveryPathways | Prediction Service | Recovery modals, bonus rounds | Phase 2 |

---

## 8. CUSTOMER ACQUISITION ARCHITECTURE

### 8.1 Segment-Specific Onboarding (from Customer Segments Doc)

| Segment | Entry Point | Onboarding Flow | Target CAC |
|---------|-------------|----------------|-----------|
| Gen Z (18-34) | TikTok/X meme → landing | Email signup → free Scandal Pack → first bet | $5-15 |
| Gen X (35-50+) | iGaming cross-promo | Wallet connect → staking tutorial → yield display | $20-40 |
| Creators | Direct outreach + 40% pitch | Creator dashboard → market creation → fee tracking | Near-zero (organic) |
| Crypto Natives | CT/Discord → DeFi integrations | Wallet connect → $MADx swap → stake → bet | $10-20 |

### 8.2 GTM Experiments (from VC Stress Test)

| Experiment | Goal | Duration | Success Metric |
|-----------|------|----------|---------------|
| "Influencer Vig" Beta | Test 40% creator fee as acquisition driver | 30 days | Creator retention >60% |
| "Scandal Bounty" | Test AI Scraper vs human intuition | 30 days | Markets hitting >$10K volume |
| Shield A/B Test | Validate Shield increases bet size | 14 days | 3x bet size increase |
| "Comment Section" Widget | Test gossip-site embed conversion | 30 days | CTR >2%, wallet connect >10% |

---

*Additional sources: Neuroscience Systems Summary (TypeScript code), Customer Segments (4 segments), "Shooting Holes in My Thesis" (GTM experiments)*
