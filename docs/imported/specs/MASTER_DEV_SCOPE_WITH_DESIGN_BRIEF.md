# MΛDHAT'S GAMBIT — MASTER DEVELOPMENT SCOPE
## With Full Design Brief Integration | Modular · Containerized · Benchmarked
> Version: vFinal-Design | March 20, 2026
> Source of Truth: https://the-mdc.github.io/MADHATs-Gambit-Presentation/
> Design Brief Author: Shaheryar Butt (UI/UX Designer, 8+ Years)
> Platform Fee: 1.88% | Community Share: 28.8% | Creator Markets: 40% to Creator

---

## 0. DESIGN PHILOSOPHY

**"Top-shelf Web2 wrapper over Web3/DeFi rails."**

Users never see wallets, gas fees, chain IDs, or transaction hashes. Every interaction — betting, minting, staking, evolving — feels like tapping a button in a premium consumer app. The blockchain is infrastructure, not interface.

### Visual Identity (from Design Brief)

| Element | Specification |
|---------|--------------|
| Primary Background | Deep black / near-black (#0A0A0F) |
| Core Accent #1 | Electric purple / neon violet — dominant brand color |
| Core Accent #2 | Neon teal / hot signal color — secondary highlight |
| Brand Gold | #FFD700 — card surfaces, premium UI elements |
| Text Primary | Near-white (#F5F0E8) on dark backgrounds |
| Card Surfaces | Semi-dark with subtle gold glow + glassmorphism treatment |
| Display Font | Bold, condensed, commanding — Orbitron (from presentation CSS) |
| Body Font | Clean sans-serif, high legibility — Rajdhani |
| Numeric/Ticker | Monospace / mechanical — ShareTechMono |
| Aesthetic | 1980s analog instrument panel × modern DeFi terminal × high-stakes card room |
| Logo | MAD_G_Official_Logo2.png — "The Economic Engine of Entertainment Prediction Markets" |

### Design Principles
- **Dark, immersive, and unlike anything in prediction markets** — not a Polymarket clone
- **Culturally confident and irreverent** — not meme-childish
- **Retro-futuristic with brass/gold foil accents** — premium feel
- **Every component reusable** — design tokens → component library → page composition

---

## 1. ARCHITECTURE OVERVIEW

### 1.1 Monorepo Structure (Turborepo)

```
madhats-gambit/
├── apps/
│   ├── web/                    # Next.js 14 — Marketing site + Platform
│   ├── api/                    # NestJS 10+ — API Gateway
│   └── scraper/                # Python — Scandal Scraper AI
├── packages/
│   ├── ui/                     # Shared component library (design system)
│   ├── contracts/              # Solidity (Foundry)
│   ├── database/               # Prisma schema + migrations
│   ├── shared/                 # Types, constants, utils
│   └── neuroscience/           # Dopamine/engagement modules
├── services/
│   ├── auth/                   # NestJS microservice
│   ├── users/                  # NestJS microservice
│   ├── predictions/            # NestJS microservice
│   ├── nft/                    # NestJS microservice
│   ├── wallet/                 # NestJS microservice
│   └── indexer/                # NestJS microservice
├── infra/
│   ├── docker/                 # Dockerfiles per service
│   ├── k8s/                    # Helm charts
│   └── terraform/              # AWS infra
├── .github/workflows/          # CI/CD
├── turbo.json
├── docker-compose.yml
└── foundry.toml
```

### 1.2 Tech Stack

| Layer | Technology | Benchmark |
|-------|-----------|-----------|
| Frontend | Next.js 14 (App Router), React 19, TypeScript 5.4, Tailwind 4 | Lighthouse ≥95, LCP <1.8s |
| Animation | Framer Motion 11, GSAP (clock/ticker), Lottie (pack reveals) | 60fps on mobile |
| Auth | Privy (email/social/wallet → auto wallet creation) | <30s signup flow |
| State | Zustand (client), TanStack Query (server state) | <100ms cache hits |
| API Gateway | NestJS 10+, GraphQL (Apollo) + REST, rate limiting | P99 <200ms |
| Databases | PostgreSQL 16, MongoDB 7, Redis 7 | <10ms cache reads |
| ORM | Prisma 5 (PG), Mongoose (Mongo), ioredis | Type-safe migrations |
| Contracts | Solidity 0.8.20+, Foundry (forge/cast/anvil), OpenZeppelin 5.x | <150K gas per bet |
| Oracles | Chainlink VRF v2.5 + Automation 2.1 | <5min resolution |
| Indexing | TheGraph subgraph | <2s event propagation |
| AI | Python 3.12, LangChain, OpenAI/Anthropic | <10s market proposal |
| CI/CD | GitHub Actions, Foundry tests, Slither, Docker | <8min pipeline |
| Infra | Docker, Kubernetes (EKS), Terraform, CloudFront | 99.9% uptime |
| Monitoring | Datadog APM, Sentry, Grafana | <5min alert latency |

---

## 2. SCREEN-BY-SCREEN DEVELOPMENT (Design Brief Mapped to Sprints)

Each screen from the design brief is mapped to a specific sprint, with components, data sources, and smart contract interactions defined.

### Screen 1: Landing Page (Public / Pre-Login) — Sprint 4

**Design Brief:** First impression. Sets tone before signup.

| Component | Implementation | Data Source |
|-----------|---------------|-------------|
| Hero Section | Full-width dark bg, animated particles (GSAP), bold headline in Orbitron | Static |
| Live Stats Bar | Total volume, active predictions, users online | Redis pub/sub → WebSocket |
| Feature Highlights | 3-4 glassmorphism cards with gold borders | Static |
| CTA: "Start Predicting" | Privy modal → email/social signup | Privy SDK |
| Background Pulse | CSS animation with subtle data pulse effect | CSS keyframes |
| Footer | Links, socials, legal, chain badges | Static |

**Benchmark:** Lighthouse ≥95, LCP <1.8s, <100KB JS bundle (code-split).

### Screen 2: Main Hub / Core Dashboard — Sprint 4-5

**Design Brief:** "Central control room — retro clock, collapsible trays, live market data."

| Component | Implementation | Data Source |
|-----------|---------------|-------------|
| Retro Analog Clock | GSAP-animated Seiko-style clock, center-top | `Date.now()` + CSS |
| Custom Ticker Bar | 4-unit display (portfolio value, $MADx price, active bets, ChaosMeter) | WebSocket real-time |
| Left Tray (Collapsible) | Framer Motion slide drawer: Nav, Markets, Portfolio, History, Settings | Zustand UI state |
| Right Tray (Collapsible) | Active predictions, live feed, notifications | Redis pub/sub |
| Featured Predictions | Glassmorphism cards with gold-glow borders, quick-entry CTAs | Prediction Service API |
| Status Bar | Wallet balance, chain, user tier/rank badge | Wallet Service + User Service |
| NeuroTicker | Scrolling breaking news banner (scandal headlines) | Scraper Service → Redis |
| WhaleWatcher | Real-time large-trade feed | Event Indexer → WebSocket |

**Collapsible Tray Pattern:**
```tsx
// Framer Motion slide drawer
<motion.div
  initial={{ x: -300 }}
  animate={{ x: isOpen ? 0 : -300 }}
  transition={{ type: "spring", stiffness: 300, damping: 30 }}
  className="fixed left-0 top-0 h-full w-72 bg-dark-900/95 backdrop-blur-xl border-r border-gold/20"
>
  {/* Nav items */}
</motion.div>
```

### Screen 3: Prediction Market Feed — Sprint 4-5

**Design Brief:** "Full list of active markets — filterable, sortable, with quick-entry."

| Component | Implementation | Data Source |
|-----------|---------------|-------------|
| Filter Bar | Category, closing time, volume, trending toggles | Client-side + API params |
| Prediction Cards | Market title, outcomes (Yes/No/multi), odds, volume, time left | Prediction Service |
| Quick-Entry | Inline bet placement without navigating away | BondingCurve.sol via wagmi |
| Featured Market | Pinned at top with expanded view, live odds | Prediction Service (featured flag) |
| Card Hover State | Expands: liquidity depth, recent activity, prediction input | Framer Motion layoutId |
| Infinite Scroll | Intersection Observer + TanStack Query pagination | Cursor-based API |
| ChaosMeter Badge | Scandal velocity indicator on each card | Scraper Service metric |

### Screen 4: Individual Market Detail — Sprint 5

**Design Brief:** "Deep-dive view for a single prediction market."

| Component | Implementation | Data Source |
|-----------|---------------|-------------|
| Market Header | Title, category, creator badge, live countdown (Seiko-style) | Prediction Service |
| Odds Display | Real-time probability bars (Recharts) or DL-LMSR price | BondingCurve.sol view |
| Position Entry Panel | Amount input, outcome selector, MAD Shield opt-in toggle | BondingCurve.sol + RiskOracle.sol |
| Liquidity Chart | Historical odds movement (Recharts area chart) | TheGraph historical |
| Activity Feed | Recent bets (anonymized usernames + amounts) | Event Indexer |
| Resolution Rules | Clear explanation of Triple-Threat oracle process | Static from market metadata |
| Related Markets | 3-4 similar predictions (ML recommendation or tag-based) | Prediction Service |
| Share/Embed | One-click share card for X/Telegram + embed code | Frontend utility |

### Screen 5: Card Game Hub — Sprint 6 (Phase 1) + Phase 2

**Design Brief:** "Distinct aesthetic — feels like entering a different room."

| Component | Implementation | Data Source |
|-----------|---------------|-------------|
| Entry Transition | Full-screen animation (Framer Motion page transition) | CSS + Framer |
| Card Deck Display | Hand-style layout, drag-to-reorder | React DnD Kit + MadhatCard.sol |
| MysteryPack Opener | Animated reveal (Lottie/GSAP), fireworks, rarity reveal | DutchAuction.sol → mint event |
| Card Detail | Full-screen modal: stats, Clout, Volatility, evolution history | MadhatCard.sol metadata |
| Evolution UI | Progress bar, burn cost display, "Evolve" CTA with confirmation | EvolutionEngine |
| Leaderboard Strip | Top 10 players visible at all times (horizontal scroll) | User Service rankings |
| Faction Badge | Color-coded faction indicator on each card | Card metadata |
| Staking Panel | Stake card → select tier → confirm lock duration | StakingPool.sol |

### Screen 6: User Portfolio & Profile — Sprint 5-6

**Design Brief:** "Personal command center."

| Component | Implementation | Data Source |
|-----------|---------------|-------------|
| Stats Header | Total wagered, total won, win rate, tier badge (Gold/Diamond/MAD) | User Service aggregation |
| Active Positions | List of open bets with current value + P&L indicator | Prediction Service + BondingCurve.sol |
| History | Resolved markets, win/loss breakdown with amounts | Event Indexer historical |
| Earnings Chart | P&L over time (Recharts line chart, dark theme) | User Service + TheGraph |
| Achievements/Badges | Gamification: "First Bet", "10-Win Streak", "Golden Hand" | User Service achievements |
| Card Collection | Grid of owned NFT cards with rarity filters | MadhatCard.sol balanceOf |
| Wallet Section | Connected wallets, $MADx balance, transaction history | Wallet Service |

### Screen 7: Onboarding Flow — Sprint 4

**Design Brief:** "Multi-step entry experience."

| Step | Screen | Implementation |
|------|--------|---------------|
| 1 | Welcome | Brand animation (Lottie), "MAD Gambit is..." tagline, 10s auto-advance |
| 2 | Sign Up | Privy modal: email, Google, Apple, or wallet connect |
| 3 | Quick Explainer | 3 swipeable frames: Predict → Collect → Earn (Framer Motion) |
| 4 | Choose Interests | Category selector (Politics, Tech, Celebrity, Memes, Sports, Crypto) |
| 5 | First Prediction | Guided bet on a featured market with $1 tutorial credit |
| 6 | Hub Entry | Redirect to Main Hub with "Welcome" state + tutorial tooltips |

**Design Brief Confirms:** Email/social signin FIRST → wallet required only when betting/earning. This aligns with Privy's embedded wallet pattern.

### Screen 8: Creator Dashboard — Phase 2

| Component | Implementation | Data Source |
|-----------|---------------|-------------|
| Market Wizard | Step-by-step: question → outcomes → resolution criteria → end time | MarketFactory.sol |
| Earnings Tracker | Real-time 40% fee revenue display, lifetime total | Event Indexer + Treasury |
| Analytics | Volume on your markets, unique bettors, conversion rate | Prediction Service |
| Embed Kit | One-click embed code for gossip sites + social media share cards | Frontend utility |
| Audience Insights | Demographics of bettors on your markets | User Service aggregation |

---

## 3. SMART CONTRACT ARCHITECTURE

### 3.1 Core Contracts (15 Total)

| # | Contract | Status | Sprint | Design Brief Screen |
|---|----------|--------|--------|-------------------|
| 1 | MADDEXToken.sol | ✅ Built | Sprint 2 | All (currency) |
| 2 | MadhatCard.sol | ✅ Built | Sprint 2 | Screen 5 (Card Hub) |
| 3 | BondingCurve.sol | ✅ Built | Sprint 2 | Screen 3-4 (Markets) |
| 4 | PredictionMarket.sol | ✅ Built | Sprint 2 | Screen 3-4 (Markets) |
| 5 | RiskOracle.sol | ✅ Built | Sprint 2 | Screen 4 (Shield opt-in) |
| 6 | StakingPool.sol | ✅ Built | Sprint 2 | Screen 5-6 (Staking) |
| 7 | MadhatTreasury.sol | ✅ Built | Sprint 2 | Backend (fee distribution) |
| 8 | CommunityTreasury.sol | ✅ Built | Sprint 2 | Backend (28.8% share) |
| 9 | MarketFactory.sol | 🔨 Build | Sprint 2 | Screen 3 + Creator Dashboard |
| 10 | DutchAuction.sol | 🔨 Build | Sprint 2 | Screen 5 (Pack opener) |
| 11 | OracleIntegration.sol | 🔨 Build | Sprint 3 | Screen 4 (Resolution) |
| 12 | SagaController.sol | 🔨 Build | Phase 2 | Screen 3 (Saga tab) |
| 13 | QuadraticVoting.sol | 🔨 Build | Phase 2 | MADDAO section |
| 14 | FactionWars.sol | 🔨 Build | Phase 2 | Screen 5 (Faction leaderboard) |
| 15 | ConvictionMarket.sol | 🔨 Build | Phase 2 | Screen 4 (Lock duration) |

### 3.2 Fee Constants (1.88% Canonical)

```solidity
// All contracts use these canonical constants
uint256 public constant PLATFORM_FEE_BPS = 188;     // 1.88%
uint256 public constant CREATOR_SHARE_BPS = 4000;    // 40% of fee to creator
uint256 public constant COMMUNITY_SHARE_BPS = 2880;  // 28.8% community profit
uint256 public constant BURN_SHARE_BPS = 1000;        // 10% of platform revenue
uint256 public constant MAX_MONTHLY_BURN_BPS = 490;   // 4.9% supply cap
```

---

## 4. BACKEND MICROSERVICES (Containerized)

Each service runs in its own Docker container with independent health checks, resource limits, and horizontal auto-scaling.

### 4.1 Docker Compose (Local Development)

```yaml
version: "3.9"
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: madhats
      POSTGRES_PASSWORD: ${DB_PASS}
    volumes: [pgdata:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s

  mongodb:
    image: mongo:7
    volumes: [mongodata:/data/db]

  redis:
    image: redis:7-alpine
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru

  auth-service:
    build: { context: ., dockerfile: infra/docker/Dockerfile.service, args: { SERVICE: auth } }
    environment: { PORT: 3001, DATABASE_URL: "postgresql://..." }
    depends_on: { postgres: { condition: service_healthy } }
    healthcheck: { test: ["CMD", "curl", "-f", "http://localhost:3001/health"] }

  user-service:
    build: { context: ., dockerfile: infra/docker/Dockerfile.service, args: { SERVICE: users } }
    environment: { PORT: 3002 }
    depends_on: [postgres, redis]

  prediction-service:
    build: { context: ., dockerfile: infra/docker/Dockerfile.service, args: { SERVICE: predictions } }
    environment: { PORT: 3003 }
    depends_on: [postgres, redis]

  nft-service:
    build: { context: ., dockerfile: infra/docker/Dockerfile.service, args: { SERVICE: nft } }
    environment: { PORT: 3004 }
    depends_on: [postgres]

  wallet-service:
    build: { context: ., dockerfile: infra/docker/Dockerfile.service, args: { SERVICE: wallet } }
    environment: { PORT: 3005 }
    depends_on: [postgres, redis]

  indexer-service:
    build: { context: ., dockerfile: infra/docker/Dockerfile.service, args: { SERVICE: indexer } }
    environment: { PORT: 3006 }
    depends_on: [mongodb, redis]

  scraper-service:
    build: { context: ., dockerfile: infra/docker/Dockerfile.python }
    environment: { PORT: 3007 }
    depends_on: [mongodb, redis]

  api-gateway:
    build: { context: ., dockerfile: infra/docker/Dockerfile.gateway }
    ports: ["4000:4000"]
    depends_on: [auth-service, user-service, prediction-service]

  frontend:
    build: { context: ., dockerfile: infra/docker/Dockerfile.frontend }
    ports: ["3000:3000"]
    depends_on: [api-gateway]
```

### 4.2 Service API Contracts

| Service | Port | Key Endpoints | DB |
|---------|------|--------------|-----|
| Auth | 3001 | POST /auth/login, POST /auth/verify, POST /auth/wallet-link | PG |
| Users | 3002 | GET /users/:id, PATCH /users/level, GET /users/leaderboard | PG |
| Predictions | 3003 | GET /markets, POST /markets, POST /bets, POST /resolve | PG+Redis |
| NFT | 3004 | GET /packs, POST /packs/purchase, POST /cards/evolve, GET /cards | PG+IPFS |
| Wallet | 3005 | POST /stake, POST /shield/opt-in, GET /yield, GET /balance | PG+Redis |
| Indexer | 3006 | Internal: sync on-chain events → MongoDB + broadcast via Redis | Mongo |
| Scraper | 3007 | GET /trends, POST /propose-market, GET /chaos-meter | Mongo+Redis |

---

## 5. SPRINT-BY-SPRINT DEVELOPMENT PLAN

### Phase 1: MPP (12 Weeks / 6 Sprints)

#### Sprint 1: Foundation (Week 1-2)
**Goal:** Monorepo scaffolded, CI/CD live, databases provisioned.

| Task | Detail | Owner |
|------|--------|-------|
| Monorepo setup | Turborepo with apps/, packages/, services/, infra/ | Lead Dev |
| Docker Compose | All 10 services + 3 databases + gateway + frontend | DevOps |
| CI/CD Pipeline | `.github/workflows/test.yml` — Foundry build + test + Slither | DevOps |
| Database schemas | Prisma schema for PG (users, markets, bets, cards, stakes) | Backend |
| Foundry config | foundry.toml, remappings, OpenZeppelin 5.x imports | Solidity |
| Design tokens | CSS variables, Tailwind config, component primitives | Frontend |
| Privy setup | App registration, login methods config | Frontend |

**Design Brief Integration:** Establish the design token system — colors (#0A0A0F bg, neon violet, neon teal, #FFD700 gold), typography (Orbitron/Rajdhani/ShareTechMono), glassmorphism card component, gold-glow border utility. These tokens inform every component built in subsequent sprints.

#### Sprint 2: Smart Contracts (Week 3-4)
**Goal:** All core contracts deployed to Arbitrum Sepolia testnet.

| Task | Detail | Gas Target |
|------|--------|-----------|
| Deploy MADDEXToken | ERC-20 + Permit, 888.88M supply, FEE_BPS=188 | <100K |
| Deploy BondingCurve | DL-LMSR, dynamic b parameter | <150K per trade |
| Deploy PredictionMarket | createMarket, placeBet, resolveMarket, claimWinnings | <200K per bet |
| Deploy StakingPool | 6 conviction tiers, Clout multipliers, yield distribution | <180K per stake |
| Deploy MadhatCard | ERC-1155, dynamic metadata, mint/evolve functions | <200K per mint |
| Deploy MadhatTreasury | Fee distribution (35/25/10/30 split) | <120K |
| Build MarketFactory | createBinary, createMulti, creator fee routing (40%) | <250K |
| Build DutchAuction | createAuction, purchase, price decay | <200K |
| Write tests | 100% function coverage, fuzz tests for BondingCurve | forge test -vvv |
| Deploy to testnet | Arbitrum Sepolia, verify on Arbiscan | forge script |

**Design Brief Integration:** DutchAuction.sol powers the MysteryPack opener animation in Screen 5. MarketFactory.sol enables the Creator Dashboard in Screen 8. Every contract event maps to a frontend UI update.

#### Sprint 3: Backend Services (Week 5-6)
**Goal:** All 7 microservices operational with health checks.

| Task | Detail |
|------|--------|
| Auth Service | Privy webhook receiver, JWT issuance (15min access + 7d refresh), wallet linking |
| User Service | Profile CRUD, XP/level calculation, achievement triggers, leaderboard query |
| Prediction Service | Market CRUD, odds calculation (read BondingCurve), bet placement queue, resolution pipeline |
| NFT Service | Pack creation, DutchAuction integration, card gallery queries, evolution triggers |
| Wallet Service | $MADx balance, staking tier management, Shield opt-in, yield calculation |
| Event Indexer | TheGraph subgraph deploy, on-chain event sync to MongoDB, Redis broadcast |
| API Gateway | NestJS gateway with GraphQL schema stitching, rate limiting (100 req/min/IP), RBAC |

**Design Brief Integration:** Every service maps to a Design Brief screen — Auth→Screen 7 (Onboarding), Prediction→Screen 3-4, NFT→Screen 5, Wallet→Screen 6, Indexer→all real-time components.

#### Sprint 4: Frontend Core (Week 7-8)
**Goal:** Landing page + Main Hub + Prediction Feed + Onboarding operational.

| Task | Design Brief Screen | Key Components |
|------|-------------------|----------------|
| Landing Page | Screen 1 | Hero (Orbitron headline, particle bg), Stats Bar (live volume), CTA (Privy modal) |
| Onboarding Flow | Screen 7 | 6-step wizard: Welcome → Signup → Explainer → Interests → First Bet → Hub |
| Main Hub | Screen 2 | Retro clock (GSAP), ticker bar (WebSocket), collapsible trays (Framer), featured cards |
| Prediction Feed | Screen 3 | Filter bar, prediction cards (glassmorphism), quick-entry, infinite scroll |
| Component Library | All screens | Button system, card component, nav style, input fields, modals — all with design tokens |

**Design Brief Integration:** This sprint directly implements Shaheryar's screens 1, 2, 3, and 7. The retro analog clock is centerpiece of the Main Hub. Collapsible trays fold in/out as sliding drawers. Dark, immersive aesthetic throughout.

#### Sprint 5: Integration + Market Detail (Week 9-10)
**Goal:** Contract↔backend↔frontend wired. Market detail page complete.

| Task | Design Brief Screen |
|------|-------------------|
| Market Detail Page | Screen 4 — Full market view with odds, position entry, Shield opt-in, activity feed |
| Portfolio/Profile | Screen 6 — Stats, active positions, history, P&L chart, achievements |
| Contract hooks | wagmi hooks for: placeBet, claimWinnings, stake, unstake, buyPack |
| TheGraph integration | Subgraph deployed, frontend queries for historical data |
| WebSocket layer | Real-time odds updates, NeuroTicker feed, WhaleWatcher stream |
| ChaosMeter | Backend aggregation → Redis → WebSocket → animated gauge component |

#### Sprint 6: QA + Testnet Deploy (Week 11-12)
**Goal:** Production-quality testnet deployment.

| Task | Benchmark |
|------|-----------|
| E2E tests | Playwright: signup → first bet → claim winnings → view portfolio |
| Performance audit | Lighthouse ≥95, LCP <1.8s, FID <100ms |
| Security review | Slither static analysis on all .sol files, dependency audit |
| Testnet deployment | All contracts on Arbitrum Sepolia with verified source |
| API load test | Artillery: 1000 concurrent users, P99 <200ms |
| Mobile responsiveness | All screens tested on iPhone 14 Pro + Pixel 7 viewports |
| Documentation | API docs (Swagger), contract docs (NatSpec), component Storybook |

### Phase 2: MAP (Q2 2026) — Post-Seed

| Sprint | Focus | Design Brief Screen |
|--------|-------|-------------------|
| 7-8 | Card Game Hub (Screen 5) — Evolution UI, MysteryPack animation, faction system | Screen 5 |
| 9-10 | Creator Dashboard (Screen 8) — Market wizard, earnings tracker, embed kit | Screen 8 |
| 11-12 | Saga Season 1 — SagaController.sol, themed markets, Act progression | Screen 3 (Sagas tab) |
| 13-14 | Triple-Threat Oracle — OracleIntegration.sol, Chainlink + News API + Community vote | Screen 4 (Resolution) |
| 15-16 | MAD Shield activation — Premium collection, payout automation, solvency monitoring | Screen 4 (Shield) |
| TGE | $MADx launch, DEX listings (Uniswap/Camelot), Saga Season 1 | All |

### Phase 3: Expansion (Q3 2026)

| Feature | Implementation |
|---------|---------------|
| Mobile PWA | Service worker, push notifications, home screen, biometric login |
| AI Agent Arena | LangChain agents, copy trading, 3-tier subscriptions |
| Base L2 | Token bridge, Coinbase Wallet onboarding |
| Neurodesign modules | 6 TypeScript modules integrated into frontend |

### Phase 4: Ecosystem (Q4 2026+)

| Feature | Implementation |
|---------|---------------|
| Full DAO | QuadraticVoting.sol, timelock, multisig governance |
| HyperEVM + Sei | Cross-chain deployment, bridge contracts |
| FHE Privacy | Zama fhEVM encrypted bets on Arbitrum |
| Data API | Cultural event dataset licensing to media companies |

---

## 6. INFRASTRUCTURE

### 6.1 Kubernetes (Production)

```yaml
# Helm values per service
replicaCount: 2
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 20
  targetCPUUtilizationPercentage: 70
resources:
  requests: { cpu: 250m, memory: 256Mi }
  limits: { cpu: 1000m, memory: 1Gi }
```

### 6.2 Security Stack

| Layer | Implementation |
|-------|---------------|
| Smart Contracts | CertiK + Trail of Bits dual audit, OpenZeppelin 5.x, Foundry fuzz |
| Backend | Helmet.js, CORS whitelist, input sanitization, rate limiting |
| Auth | Privy + JWT (15min/7d), MFA, hardware wallet support |
| Infra | WAF (CloudFront), DDoS protection, VPC isolation, encryption at rest+transit |
| Keys | Multi-sig (3-of-5), hardware wallets, geographic distribution |
| Monitoring | Datadog APM, Sentry errors, PagerDuty alerts |

### 6.3 Performance Benchmarks

| Metric | Target | Tool |
|--------|--------|------|
| Lighthouse | ≥95 | Chrome DevTools |
| LCP | <1.8s | Web Vitals |
| FID | <100ms | Web Vitals |
| API P99 | <200ms | Datadog |
| Contract gas (bet) | <150K | Foundry snapshot |
| Contract gas (mint) | <200K | Foundry snapshot |
| WebSocket latency | <500ms | Custom |
| Onboarding completion | >60% | Analytics |

---

## 7. CUSTOMER SEGMENT–DRIVEN FEATURES

Each feature prioritization maps to the validated customer segments:

| Feature | Segment Served | Why |
|---------|---------------|-----|
| TikTok/X meme share cards | Gen Z (60-70%) | 67% prefer memes, 82% TikTok |
| Privy email/social login | Gen Z + Creators | Zero crypto friction |
| Premium analytics dashboard | Gen X (30-40%) | Favor yields, narratives |
| 40% creator fee share + tools | Creators (5-10%) | $6.50 ROI/$1, 5-10x viral |
| DeFi yield integration | Crypto Natives (34-40%) | 80% daily DeFi |
| MAD Shield opt-in | Gen X + Gen Z | Loss aversion drives bet size 3x |
| Faction Wars | Gen Z | Social clans, competitive leaderboards |
| Scandal Scraper AI | All segments | Automated market supply |

---

## 8. ENVAZIA PARTNERSHIP

| Term | Value |
|------|-------|
| Developer | Envazia Technologies (Ahmed Ali, CEO) |
| Phase 1 (MPP) | Fixed price, all-inclusive |
| Phase 2 (MAP) | Funded by $250K round |
| Payment | $100K pre-TGE, $50K post-TGE |
| Revenue Share | 5% net revenue (ongoing) |
| IP | Client owns all deliverables |

---

*This scope synthesizes: Design Brief (Shaheryar Butt, 8 screens), Customer Segments (4 profiles), Development Bible, Envazia Agreement, EVM Implementation Guide, Azuro Analysis, Neuroscience Systems, and the live Presentation as source of truth.*

---

## 9. CURRENT BUILD STATUS & LAUNCH PIPELINE

### Governance Token — LIVE
Contract `0xb61ae7727579e3781ca0ec4902b6ba21d335fd18` deployed on Arbitrum via Crystex fair launch.

### Launch Pipeline
```
[✅ Token Live] → [🔨 MPP Build] → [Closed Beta] → [Open Beta] → [Pre-Launch] → [TGE Q2 2026]
```

### MPP → Beta Transition Plan
| Phase | Duration | Gate Criteria | Users |
|-------|----------|--------------|-------|
| MPP Release | — | Core markets, minting, basic staking functional on testnet | Internal QA |
| Closed Beta | 2-4 weeks | Invited community (888 Genesis holders priority) | 100-500 |
| Open Beta | 4-6 weeks | Public access, bug bounty, stress testing | 1,000-5,000 |
| Pre-Launch | 2 weeks | Feature freeze, audit completion, liquidity seeded | 5,000-10,000 |
| TGE | Q2 2026 | $MADx DEX listings (Uniswap/Camelot), Saga Season 1 | 50,000 target |

### Global Distribution (Confirmed Partners)
| Region | Partner | Integration Point |
|--------|---------|-------------------|
| NA | Alpha Growth | User acquisition, growth marketing, influencer campaigns |
| EMEA | Dvrse / Code Cage | European + Middle East distribution, compliance |
| SEA | All Access Anonymous (Marvin Das) | Southeast Asia penetration, TikTok/social |
| Africa | DAO Network (Violet) | African market development, mobile-first |
| Artists | Superluxe.io | Creator onboarding, NFT art partnerships |
| India | In Progress | Subcontinent expansion |
| South America | In Progress | LATAM market development |

### Arbitrum Ecosystem Funding
Actively seeking Arbitrum Foundation grants. The governance token is already deployed on Arbitrum, demonstrating ecosystem commitment. Alignment: MAD Gambit is Arbitrum-native (Nova for gameplay, One for liquidity/governance).
