# 🤖 MADHAT'S GAMBIT: CLAUDE CODE IMPLEMENTATION GUIDE
## Complete Build Instructions for AI-Assisted Development
## Version 2.0 | January 20, 2026

---

# 📋 OVERVIEW

This document provides step-by-step instructions for Claude Code to implement MADHAT's Gambit. All specifications reference the complete build document and card roster.

## Key Implementation Files
1. `MADHATS_GAMBIT_COMPLETE_BUILD_V2.md` - Full platform specification
2. `CARD_ROSTER_ARTIST_GUIDE.md` - All 992 cards with traits
3. This file - Claude Code instructions

---

# 🏗️ PHASE 1: PROJECT INITIALIZATION

## Step 1.1: Create Monorepo Structure

```bash
# Initialize project
mkdir madhats-gambit && cd madhats-gambit
pnpm init

# Install Turborepo
pnpm add -D turbo

# Create folder structure
mkdir -p apps/web/src/{components,hooks,lib,pages,stores}
mkdir -p apps/api/src/{routers,services,db,utils}
mkdir -p packages/contracts/{src,test,script}
mkdir -p packages/shared/{types,constants,utils}
mkdir -p packages/db/prisma
```

## Step 1.2: Root package.json

```json
{
  "name": "madhats-gambit",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "db:push": "pnpm --filter @madhats/db db:push",
    "db:generate": "pnpm --filter @madhats/db generate",
    "contracts:compile": "pnpm --filter @madhats/contracts compile",
    "contracts:test": "pnpm --filter @madhats/contracts test",
    "contracts:deploy": "pnpm --filter @madhats/contracts deploy"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.3.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

## Step 1.3: turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"]
    },
    "lint": {}
  }
}
```

---

# 🔗 PHASE 2: SMART CONTRACTS

## Step 2.1: Foundry Setup

```bash
cd packages/contracts
forge init --no-commit

# Install dependencies
forge install OpenZeppelin/openzeppelin-contracts
forge install smartcontractkit/chainlink
```

## Step 2.2: foundry.toml

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc = "0.8.20"
optimizer = true
optimizer_runs = 200

[profile.default.fuzz]
runs = 1000

[rpc_endpoints]
base_sepolia = "${BASE_SEPOLIA_RPC_URL}"
base_mainnet = "${BASE_MAINNET_RPC_URL}"

[etherscan]
base_sepolia = { key = "${BASESCAN_API_KEY}" }
base_mainnet = { key = "${BASESCAN_API_KEY}" }
```

## Step 2.3: Contract Implementation Order

Implement contracts in this order (dependencies first):

### 2.3.1 MADDEXToken.sol
```
Location: packages/contracts/src/token/MADDEXToken.sol
Reference: Section 4.2 of COMPLETE_BUILD_V2.md
Key Features:
- 888,888,888 max supply
- 4.9% burn cap per period
- 0.15% transfer burn (LP exempt)
- Minter/Burner roles
```

### 2.3.2 CommunityTreasury.sol ⭐ CRITICAL - NEW
```
Location: packages/contracts/src/treasury/CommunityTreasury.sol
Reference: Section 4.2 of COMPLETE_BUILD_V2.md
Key Features:
- 40% revenue distribution
- 20% to player rewards pool
- 12% to DAO treasury
- 8% to member rewards
```

### 2.3.3 RevenueShare.sol ⭐ CRITICAL - NEW
```
Location: packages/contracts/src/treasury/RevenueShare.sol
Reference: Section 4.3 of COMPLETE_BUILD_V2.md
Key Features:
- Level 16+ revenue share (0.5% - 5%)
- Volume tracking per player
- Weekly claim periods
```

### 2.3.4 PrizePoolVault.sol ⭐ CRITICAL - NEW
```
Location: packages/contracts/src/treasury/PrizePoolVault.sol
Reference: Section 4.4 of COMPLETE_BUILD_V2.md
Key Features:
- Tournament prize funding
- Guaranteed minimums from community pool
- Year of Snake pricing (88, 888, 8888)
```

### 2.3.5 ScandalCards.sol
```
Location: packages/contracts/src/nft/ScandalCards.sol
Reference: Section 4.3 of original spec
Key Features:
- ERC-1155 multi-token
- 7 rarity tiers
- 6 condition states
- Evolution mechanics
- 112 base characters (expandable to 992)
```

### 2.3.6 GambitAMM.sol (Updated with Community Revenue)
```
Location: packages/contracts/src/markets/GambitAMM.sol
Reference: Section 4.5 of COMPLETE_BUILD_V2.md
Key Features:
- DL-LMSR pricing
- 1.88% total fee
- 40% to CommunityTreasury
- 35% to operations
- 15% to TeaBag
- 10% burned
- Volume tracking for revenue share
```

### 2.3.7 ConvictionMarket.sol
```
Location: packages/contracts/src/markets/ConvictionMarket.sol
Key Features:
- Time-weighted voting
- Conviction accumulation
- Threshold-based resolution
```

### 2.3.8 DutchAuction.sol
```
Location: packages/contracts/src/auctions/DutchAuction.sol
Key Features:
- Declining price mechanism
- Pack sales
- Year of Snake pricing
- 40% revenue to community
```

### 2.3.9 TeaBagVault.sol
```
Location: packages/contracts/src/insurance/TeaBagVault.sol
Key Features:
- 60% loss protection
- 5% base premium
- GARCH volatility adjustment
- 15% of fees fund pool
```

### 2.3.10 SagaController.sol
```
Location: packages/contracts/src/saga/SagaController.sol
Key Features:
- 90-day seasons
- 3 acts + finale
- Global accuracy gating
- Act unlock thresholds
```

### 2.3.11 DAOGovernance.sol
```
Location: packages/contracts/src/governance/DAOGovernance.sol
Key Features:
- OpenZeppelin Governor
- 12% treasury control
- Card holder voting bonus
- Proposal categories
```

## Step 2.4: Deployment Script

```solidity
// packages/contracts/script/Deploy.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/token/MADDEXToken.sol";
import "../src/treasury/CommunityTreasury.sol";
import "../src/treasury/RevenueShare.sol";
import "../src/treasury/PrizePoolVault.sol";
import "../src/nft/ScandalCards.sol";
import "../src/markets/GambitAMM.sol";
import "../src/insurance/TeaBagVault.sol";
import "../src/saga/SagaController.sol";

contract DeployAll is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Token
        MADDEXToken token = new MADDEXToken();
        
        // 2. Deploy Community Treasury
        CommunityTreasury treasury = new CommunityTreasury(address(token));
        
        // 3. Deploy Revenue Share
        RevenueShare revenueShare = new RevenueShare(
            address(token), 
            address(treasury)
        );
        
        // 4. Deploy Prize Pool
        PrizePoolVault prizePool = new PrizePoolVault(address(token));
        
        // 5. Deploy Insurance
        TeaBagVault teaBag = new TeaBagVault(address(token), address(0)); // Oracle later
        
        // 6. Deploy NFT Cards
        ScandalCards cards = new ScandalCards("ipfs://base-uri/");
        
        // 7. Deploy AMM with community revenue
        GambitAMM amm = new GambitAMM(address(token));
        amm.setAddresses(
            address(treasury),
            msg.sender, // Platform operations
            address(teaBag),
            address(revenueShare)
        );
        
        // 8. Deploy Saga Controller
        SagaController saga = new SagaController();
        
        // 9. Set up roles
        treasury.grantRole(treasury.REVENUE_DEPOSITOR_ROLE(), address(amm));
        treasury.setPrizePoolVault(address(prizePool));
        revenueShare.grantRole(revenueShare.TRACKER_ROLE(), address(amm));
        
        vm.stopBroadcast();
        
        // Log addresses
        console.log("MADDEXToken:", address(token));
        console.log("CommunityTreasury:", address(treasury));
        console.log("RevenueShare:", address(revenueShare));
        console.log("PrizePoolVault:", address(prizePool));
        console.log("TeaBagVault:", address(teaBag));
        console.log("ScandalCards:", address(cards));
        console.log("GambitAMM:", address(amm));
        console.log("SagaController:", address(saga));
    }
}
```

---

# 💻 PHASE 3: BACKEND API

## Step 3.1: API Setup

```bash
cd apps/api
pnpm init
pnpm add @trpc/server @trpc/client zod prisma @prisma/client
pnpm add -D typescript ts-node @types/node
```

## Step 3.2: tRPC Router Structure

```typescript
// apps/api/src/routers/index.ts
import { router } from '../trpc';
import { marketRouter } from './market';
import { cardRouter } from './card';
import { userRouter } from './user';
import { tournamentRouter } from './tournament';
import { revenueRouter } from './revenue';
import { sagaRouter } from './saga';

export const appRouter = router({
  market: marketRouter,
  card: cardRouter,
  user: userRouter,
  tournament: tournamentRouter,
  revenue: revenueRouter,
  saga: sagaRouter,
});

export type AppRouter = typeof appRouter;
```

## Step 3.3: Revenue Router (Community-First) ⭐ NEW

```typescript
// apps/api/src/routers/revenue.ts
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { z } from 'zod';

export const revenueRouter = router({
  // Get community pool stats
  getCommunityPools: publicProcedure.query(async ({ ctx }) => {
    const pools = await ctx.contracts.communityTreasury.getCommunityPools();
    return {
      playerRewardsPool: pools[0].toString(),
      daoTreasury: pools[1].toString(),
      memberRewardsPool: pools[2].toString(),
      totalReceived: pools[3].toString(),
    };
  }),

  // Get user's revenue share status
  getMyRevenueShare: protectedProcedure.query(async ({ ctx }) => {
    const status = await ctx.contracts.revenueShare.getPlayerStatus(ctx.user.address);
    return {
      level: Number(status[0]),
      periodVolume: status[1].toString(),
      pendingEarnings: status[2].toString(),
      totalEarned: status[3].toString(),
      eligible: status[4],
    };
  }),

  // Claim revenue share
  claimRevenueShare: protectedProcedure.mutation(async ({ ctx }) => {
    const tx = await ctx.contracts.revenueShare.claimRevenueShare();
    return { txHash: tx.hash };
  }),

  // Get lifetime distribution stats
  getLifetimeDistributions: publicProcedure.query(async ({ ctx }) => {
    const stats = await ctx.contracts.communityTreasury.getLifetimeDistributions();
    return {
      toPlayers: stats[0].toString(),
      toDAO: stats[1].toString(),
      toMembers: stats[2].toString(),
    };
  }),

  // Get fee breakdown for transparency
  getFeeBreakdown: publicProcedure
    .input(z.object({ betAmount: z.number() }))
    .query(({ input }) => {
      const totalFee = input.betAmount * 0.0488;
      return {
        totalFee,
        toCommunity: totalFee * 0.40,
        toOperations: totalFee * 0.35,
        toInsurance: totalFee * 0.15,
        toBurn: totalFee * 0.10,
        message: `$${(totalFee * 0.40).toFixed(2)} of your fee funds player prizes!`,
      };
    }),
});
```

## Step 3.4: Market Router

```typescript
// apps/api/src/routers/market.ts
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { z } from 'zod';

export const marketRouter = router({
  // Get all active markets
  getActiveMarkets: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.market.findMany({
      where: { resolved: false, paused: false },
      include: { outcomes: true },
      orderBy: { createdAt: 'desc' },
    });
  }),

  // Get market by ID
  getMarket: publicProcedure
    .input(z.object({ marketId: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.market.findUnique({
        where: { id: input.marketId },
        include: { outcomes: true, predictions: true },
      });
    }),

  // Get market prices
  getMarketPrices: publicProcedure
    .input(z.object({ marketId: z.number() }))
    .query(async ({ ctx, input }) => {
      const market = await ctx.contracts.gambitAMM.markets(input.marketId);
      const prices = [];
      for (let i = 0; i < market.outcomes.length; i++) {
        const price = await ctx.contracts.gambitAMM.getPrice(input.marketId, i);
        prices.push({ outcome: i, price: price.toString() });
      }
      return prices;
    }),

  // Buy shares
  buyShares: protectedProcedure
    .input(z.object({
      marketId: z.number(),
      outcome: z.number(),
      amount: z.string(),
      maxCost: z.string(),
      withInsurance: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const tx = await ctx.contracts.gambitAMM.buyShares(
        input.marketId,
        input.outcome,
        input.amount,
        input.maxCost,
        input.withInsurance
      );
      return { txHash: tx.hash };
    }),

  // Get user positions
  getMyPositions: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.position.findMany({
      where: { userId: ctx.user.id },
      include: { market: true },
    });
  }),
});
```

---

# 🎨 PHASE 4: FRONTEND

## Step 4.1: Frontend Setup

```bash
cd apps/web
pnpm create vite . --template react-ts
pnpm add wagmi viem @tanstack/react-query zustand
pnpm add @trpc/client @trpc/react-query
pnpm add tailwindcss postcss autoprefixer
pnpm add framer-motion lucide-react
```

## Step 4.2: Key Components to Build

### 4.2.1 CommunityRevenueTracker.tsx ⭐ NEW
```
Location: apps/web/src/components/revenue/CommunityRevenueTracker.tsx
Purpose: Display 40% community revenue in real-time
Features:
- Live pool balances
- Lifetime distribution stats
- Revenue event feed
Reference: Section 6.1 of COMPLETE_BUILD_V2.md
```

### 4.2.2 TransactionFeeBreakdown.tsx ⭐ NEW
```
Location: apps/web/src/components/revenue/TransactionFeeBreakdown.tsx
Purpose: Show fee transparency on every bet
Features:
- 1.88% total fee breakdown
- 40% community highlight
- Educational messaging
Reference: Section 6.2 of COMPLETE_BUILD_V2.md
```

### 4.2.3 RevenueShareDashboard.tsx ⭐ NEW
```
Location: apps/web/src/components/revenue/RevenueShareDashboard.tsx
Purpose: Level 16+ player earnings dashboard
Features:
- Current level and share rate
- Pending earnings
- Claim button
- Progress to next level
```

### 4.2.4 Card Components
```
CardDisplay.tsx - Single card rendering
CardCollection.tsx - User's card collection
CardEvolution.tsx - Evolution UI with near-miss
PackOpening.tsx - Dutch auction pack open animation
```

### 4.2.5 Market Components
```
MarketList.tsx - Active markets display
MarketDetail.tsx - Single market betting UI
PredictionPanel.tsx - Place bet interface
ConvictionMarket.tsx - Long-term voting UI
```

### 4.2.6 Tournament Components
```
TournamentList.tsx - Available tournaments
TournamentEntry.tsx - Entry with prize pool display
TournamentLeaderboard.tsx - Live rankings
PrizePoolDisplay.tsx - Community-funded prizes
```

### 4.2.7 Saga Components
```
SagaProgress.tsx - 90-day season progress
ActTimeline.tsx - 3 acts visualization
NarrativeDisplay.tsx - Story elements
GlobalAccuracy.tsx - Community unlock progress
```

### 4.2.8 Dopamine Components
```
NearMissAnimation.tsx - Evolution tease
StreakCounter.tsx - Daily login streak
ActivityFeed.tsx - Live social proof
RewardAnimation.tsx - Win celebrations
```

## Step 4.3: Zustand Store

```typescript
// apps/web/src/stores/index.ts
import { create } from 'zustand';

interface GameStore {
  // User state
  user: {
    address: string | null;
    level: number;
    revenueShareEligible: boolean;
    streak: number;
  };
  
  // Revenue tracking
  revenue: {
    pendingEarnings: string;
    lifetimeEarned: string;
    communityPoolTotal: string;
  };
  
  // Active session
  session: {
    betsPlaced: number;
    feesContributed: string;
    communityContribution: string;
  };
  
  // Actions
  setUser: (user: Partial<GameStore['user']>) => void;
  updateRevenue: (revenue: Partial<GameStore['revenue']>) => void;
  recordBet: (amount: number, fee: number) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  user: {
    address: null,
    level: 1,
    revenueShareEligible: false,
    streak: 0,
  },
  revenue: {
    pendingEarnings: '0',
    lifetimeEarned: '0',
    communityPoolTotal: '0',
  },
  session: {
    betsPlaced: 0,
    feesContributed: '0',
    communityContribution: '0',
  },
  setUser: (user) => set((state) => ({ user: { ...state.user, ...user } })),
  updateRevenue: (revenue) => set((state) => ({ revenue: { ...state.revenue, ...revenue } })),
  recordBet: (amount, fee) => set((state) => ({
    session: {
      betsPlaced: state.session.betsPlaced + 1,
      feesContributed: (parseFloat(state.session.feesContributed) + fee).toString(),
      communityContribution: (parseFloat(state.session.communityContribution) + fee * 0.4).toString(),
    },
  })),
}));
```

---

# 🗄️ PHASE 5: DATABASE

## Step 5.1: Prisma Schema

```prisma
// packages/db/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Users
model User {
  id            String    @id @default(cuid())
  address       String    @unique
  level         Int       @default(1)
  xp            Int       @default(0)
  loginStreak   Int       @default(0)
  lastLogin     DateTime?
  factionId     Int?
  createdAt     DateTime  @default(now())
  
  // Revenue share tracking
  totalVolume           Decimal @default(0)
  periodVolume          Decimal @default(0)
  revenueShareEarned    Decimal @default(0)
  revenueShareClaimed   Decimal @default(0)
  
  // Relations
  cards         Card[]
  positions     Position[]
  predictions   Prediction[]
  achievements  Achievement[]
}

// Cards (NFTs)
model Card {
  id            String   @id @default(cuid())
  tokenId       String   @unique
  characterId   Int
  factionId     Int
  rarity        Rarity
  condition     Condition @default(PRISTINE)
  evolutionStage Int     @default(0)
  wins          Int      @default(0)
  xp            Int      @default(0)
  isCrossover   Boolean  @default(false)
  crossoverFactionId Int?
  mintedAt      DateTime @default(now())
  
  userId        String
  user          User     @relation(fields: [userId], references: [id])
}

enum Rarity {
  COMMON
  UNCOMMON
  UNCOMMON_RARE
  RARE
  SUPER_RARE
  LEGENDARY
  GOLDEN_HAND
}

enum Condition {
  PRISTINE
  GOOD
  WORN
  DAMAGED
  BROKEN
  WRECKED
}

// Markets
model Market {
  id              Int       @id @default(autoincrement())
  question        String
  description     String?
  marketType      MarketType
  createdAt       DateTime  @default(now())
  resolutionTime  DateTime
  resolved        Boolean   @default(false)
  resolvedOutcome Int?
  paused          Boolean   @default(false)
  totalVolume     Decimal   @default(0)
  totalFees       Decimal   @default(0)
  communityFees   Decimal   @default(0)
  
  outcomes        Outcome[]
  positions       Position[]
  predictions     Prediction[]
}

enum MarketType {
  BINARY
  MULTI_CHOICE
  OVER_UNDER
  CONVICTION
}

model Outcome {
  id        Int     @id @default(autoincrement())
  marketId  Int
  market    Market  @relation(fields: [marketId], references: [id])
  name      String
  shares    Decimal @default(0)
}

// Positions
model Position {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  marketId      Int
  market        Market   @relation(fields: [marketId], references: [id])
  outcome       Int
  shares        Decimal
  costBasis     Decimal
  hasInsurance  Boolean  @default(false)
  createdAt     DateTime @default(now())
}

// Predictions
model Prediction {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  marketId  Int
  market    Market   @relation(fields: [marketId], references: [id])
  outcome   Int
  amount    Decimal
  won       Boolean?
  payout    Decimal?
  createdAt DateTime @default(now())
}

// Tournaments
model Tournament {
  id              Int            @id @default(autoincrement())
  name            String
  type            TournamentType
  entryFee        Decimal
  prizePool       Decimal        // From community
  entryFeesCollected Decimal     @default(0)
  maxParticipants Int
  startTime       DateTime
  endTime         DateTime
  active          Boolean        @default(true)
  finalized       Boolean        @default(false)
  
  participants    TournamentParticipant[]
}

enum TournamentType {
  DAILY
  WEEKLY
  SEASONAL
  SPECIAL
}

model TournamentParticipant {
  id            String     @id @default(cuid())
  tournamentId  Int
  tournament    Tournament @relation(fields: [tournamentId], references: [id])
  userId        String
  rank          Int?
  prize         Decimal?
  joinedAt      DateTime   @default(now())
}

// Sagas (Seasons)
model Saga {
  id              Int       @id @default(autoincrement())
  title           String
  narrativeTheme  String
  startTime       DateTime
  endTime         DateTime
  currentAct      Int       @default(1)
  globalAccuracy  Decimal   @default(0)
  active          Boolean   @default(true)
  completed       Boolean   @default(false)
  
  acts            Act[]
}

model Act {
  id                Int       @id @default(autoincrement())
  sagaId            Int
  saga              Saga      @relation(fields: [sagaId], references: [id])
  actNumber         Int
  title             String
  description       String
  accuracyThreshold Int       // Basis points
  status            ActStatus @default(LOCKED)
  unlockedAt        DateTime?
  completedAt       DateTime?
}

enum ActStatus {
  LOCKED
  ACTIVE
  COMPLETED
}

// Achievements
model Achievement {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  achievementType String
  earnedAt    DateTime @default(now())
  points      Int
}

// Revenue tracking
model RevenueEvent {
  id            String   @id @default(cuid())
  source        String   // 'GambitAMM', 'DutchAuction', etc.
  totalAmount   Decimal
  communityAmount Decimal
  operationsAmount Decimal
  insuranceAmount Decimal
  burnAmount    Decimal
  createdAt     DateTime @default(now())
}
```

---

# 🚀 PHASE 6: DEPLOYMENT

## Step 6.1: Environment Variables

```bash
# .env.example

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/madhats"

# Blockchain
PRIVATE_KEY="your-deployer-private-key"
BASE_SEPOLIA_RPC_URL="https://sepolia.base.org"
BASE_MAINNET_RPC_URL="https://mainnet.base.org"
BASESCAN_API_KEY="your-basescan-key"

# Contract Addresses (after deployment)
MADDEX_TOKEN_ADDRESS=""
COMMUNITY_TREASURY_ADDRESS=""
REVENUE_SHARE_ADDRESS=""
PRIZE_POOL_ADDRESS=""
GAMBIT_AMM_ADDRESS=""
SCANDAL_CARDS_ADDRESS=""
TEABAG_VAULT_ADDRESS=""
SAGA_CONTROLLER_ADDRESS=""

# Frontend
NEXT_PUBLIC_WALLET_CONNECT_ID=""
NEXT_PUBLIC_ALCHEMY_ID=""

# API
API_SECRET=""
```

## Step 6.2: Deployment Order

1. **Testnet (Base Sepolia)**
   - Deploy all contracts
   - Verify on Basescan
   - Run integration tests
   - Test community revenue flow

2. **Staging**
   - Deploy to staging environment
   - Full E2E testing
   - Security audit
   - Load testing

3. **Mainnet (Base)**
   - Deploy contracts
   - Initialize with proper roles
   - Fund TeaBag pool
   - Launch first saga

## Step 6.3: Post-Deployment Checklist

```
[ ] All contracts deployed and verified
[ ] CommunityTreasury receiving 40% of fees
[ ] RevenueShare tracking user volumes
[ ] PrizePoolVault funded for first tournament
[ ] Frontend displaying revenue transparency
[ ] Activity feed showing community contributions
[ ] Level 16+ users can claim revenue share
[ ] DAO governance active for treasury
```

---

# 📊 IMPLEMENTATION PRIORITY

## Critical Path (Week 1-2)
1. ✅ MADDEXToken.sol
2. ✅ CommunityTreasury.sol (40% revenue)
3. ✅ RevenueShare.sol
4. ✅ GambitAMM.sol (with fee routing)
5. ✅ Basic frontend with revenue display

## High Priority (Week 3-4)
1. ScandalCards.sol
2. DutchAuction.sol
3. TeaBagVault.sol
4. Card collection UI
5. Market betting UI

## Medium Priority (Week 5-6)
1. PrizePoolVault.sol
2. Tournament system
3. Conviction markets
4. Achievement system

## Lower Priority (Week 7-8)
1. SagaController.sol
2. DAOGovernance.sol
3. Advanced dopamine features
4. Social features

---

# ✅ VERIFICATION TESTS

## Community Revenue Tests

```typescript
describe('Community Revenue', () => {
  it('should distribute 40% of fees to community', async () => {
    const betAmount = ethers.parseEther('100');
    const fee = betAmount * 188n / 10000n; // 1.88%
    const communityShare = fee * 4000n / 10000n; // 40%
    
    await gambitAMM.buyShares(marketId, 0, shares, maxCost, false);
    
    const pools = await communityTreasury.getCommunityPools();
    expect(pools.playerPool).to.be.gte(communityShare * 2000n / 4000n); // 20%
    expect(pools.daoPool).to.be.gte(communityShare * 1200n / 4000n); // 12%
    expect(pools.memberPool).to.be.gte(communityShare * 800n / 4000n); // 8%
  });

  it('should track volume for Level 16+ revenue share', async () => {
    await revenueShare.updatePlayerLevel(user.address, 16);
    await gambitAMM.buyShares(marketId, 0, shares, maxCost, false);
    
    const status = await revenueShare.getPlayerStatus(user.address);
    expect(status.eligible).to.be.true;
    expect(status.periodVolume).to.be.gt(0);
  });

  it('should allow Level 16+ to claim revenue share', async () => {
    // Setup: user at level 18 with volume
    await revenueShare.updatePlayerLevel(user.address, 18);
    await gambitAMM.buyShares(marketId, 0, shares, maxCost, false);
    
    const statusBefore = await revenueShare.getPlayerStatus(user.address);
    const pending = statusBefore.pendingEarnings;
    
    await revenueShare.connect(user).claimRevenueShare();
    
    const balance = await maddexToken.balanceOf(user.address);
    expect(balance).to.be.gte(pending);
  });
});
```

---

**Document Version:** 2.0
**Last Updated:** January 20, 2026
**Status:** READY FOR CLAUDE CODE IMPLEMENTATION
