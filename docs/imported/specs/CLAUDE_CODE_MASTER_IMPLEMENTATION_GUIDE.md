# 🤖 MADHATS GAMBIT - CLAUDE CODE MASTER IMPLEMENTATION GUIDE
## Complete Build Instructions for AI-Assisted Development
**Version 5.0 | January 26, 2026**

---

# 📋 WHAT THIS DOCUMENT IS

This is the **MASTER REFERENCE DOCUMENT** for Claude Code to build the complete MADHATs Gambit platform.

## What Claude Code Will Build:
✅ Complete frontend (React + Next.js 15)
✅ Complete backend (API + Database)
✅ Complete smart contracts (Solidity)
✅ All 992 NFT cards
✅ All game mechanics
✅ All 45+ features

## Supporting Documents (Reference These):
1. `/mnt/user-data/outputs/MADHATS_MASTER_PLATFORM_PLAN_v5.md` - Complete platform specification
2. `/mnt/user-data/outputs/MADHATS_DATABASE_SCHEMA.md` - Database schema
3. `/mnt/user-data/outputs/MADHATS_API_SPECIFICATION.md` - API endpoints
4. `/mnt/user-data/outputs/GAP_ANALYSIS_BUILD3_vs_BUILDS12.md` - Feature gaps
5. `/mnt/user-data/outputs/MVP_GAMBIT_EXHAUSTIVE_GAP_ANALYSIS.md` - MVP analysis
6. `/mnt/user-data/outputs/SEAMLESS_FRONTEND_INTEGRATION_PLAN.md` - Frontend integration
7. `/mnt/user-data/outputs/COMPREHENSIVE_ADDITIONAL_FEATURE_RECOMMENDATIONS.md` - 45 additional features
8. `/mnt/user-data/uploads/mad-gambit.zip` - Existing frontend code
9. `/mnt/user-data/uploads/MADHATS_GAMBIT_MASTER_BUILD_FINAL.md` - Build 1 (992 cards, revenue share)
10. `/mnt/user-data/uploads/COMPREHENSIVE_MERGE_PLAN.md` - Build 2 (design system, components)

---

# 🎯 IMPLEMENTATION STRATEGY

## Phase-Based Approach:

### **PHASE 1: Foundation (Weeks 1-4)**
Build core infrastructure that everything else depends on.

### **PHASE 2: Smart Contracts (Weeks 5-6)**
Deploy all blockchain contracts with proper revenue distribution.

### **PHASE 3: Backend & Database (Weeks 7-9)**
Create API server, database, and game logic.

### **PHASE 4: Frontend Integration (Weeks 10-12)**
Merge existing frontend with new features.

### **PHASE 5: Additional Features (Weeks 13-16)**
Add the 45 recommended high-value features.

### **PHASE 6: Testing & Launch (Weeks 17-20)**
Comprehensive testing, security audit, launch.

---

# 🏗️ PHASE 1: FOUNDATION (WEEKS 1-4)

## 1.1 Project Structure

### Create Monorepo:
```bash
mkdir madhats-gambit && cd madhats-gambit

# Initialize pnpm workspace
pnpm init

# Create folder structure
mkdir -p apps/web/src/{components,contexts,lib,pages,hooks,styles}
mkdir -p apps/api/src/{routes,controllers,services,middleware,utils}
mkdir -p packages/contracts/{src,test,script}
mkdir -p packages/database/{prisma,migrations,seeds}
mkdir -p packages/shared/{types,constants,utils}
mkdir -p packages/ui/{components,styles,assets}
```

### Root package.json:
```json
{
  "name": "madhats-gambit",
  "version": "5.0.0",
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
    "db:push": "pnpm --filter @madhats/database db:push",
    "db:migrate": "pnpm --filter @madhats/database db:migrate",
    "db:seed": "pnpm --filter @madhats/database db:seed",
    "contracts:compile": "pnpm --filter @madhats/contracts compile",
    "contracts:test": "pnpm --filter @madhats/contracts test",
    "contracts:deploy": "pnpm --filter @madhats/contracts deploy"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.8.0",
    "@types/node": "^22.0.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  }
}
```

---

## 1.2 Technology Stack

### Frontend (apps/web):
```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "viem": "^2.0.0",
    "wagmi": "^2.0.0",
    "@rainbow-me/rainbowkit": "^2.0.0",
    "framer-motion": "^11.0.0",
    "recharts": "^2.12.0",
    "lucide-react": "^0.408.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.5.0",
    "tailwindcss": "^3.4.0"
  }
}
```

### Backend (apps/api):
```json
{
  "dependencies": {
    "next": "^15.0.0",
    "prisma": "^5.0.0",
    "@prisma/client": "^5.0.0",
    "zod": "^3.23.0",
    "jose": "^5.0.0",
    "ioredis": "^5.4.0",
    "bull": "^4.12.0"
  }
}
```

### Smart Contracts (packages/contracts):
```json
{
  "dependencies": {
    "@openzeppelin/contracts": "^5.0.0",
    "@chainlink/contracts": "^1.0.0"
  },
  "devDependencies": {
    "foundry": "latest",
    "hardhat": "^2.20.0"
  }
}
```

---

## 1.3 Key Configuration Files

### turbo.json:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "out/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    },
    "db:push": {
      "cache": false
    },
    "db:migrate": {
      "cache": false
    }
  }
}
```

### .env.example:
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/madhats"
REDIS_URL="redis://localhost:6379"

# Blockchain
PRIVATE_KEY="your-private-key"
BASE_RPC_URL="https://mainnet.base.org"
BASE_SEPOLIA_RPC_URL="https://sepolia.base.org"
BASESCAN_API_KEY="your-api-key"

# Contract Addresses (fill after deployment)
MADDEX_TOKEN_ADDRESS=""
COMMUNITY_TREASURY_ADDRESS=""
SCANDAL_CARDS_ADDRESS=""
GAMBIT_AMM_ADDRESS=""
TEABAG_VAULT_ADDRESS=""

# Auth
JWT_SECRET="your-secret-key"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# External APIs
COINMARKETCAP_API_KEY=""
TWITTER_API_KEY=""
DISCORD_WEBHOOK_URL=""
```

---

# 🔗 PHASE 2: SMART CONTRACTS (WEEKS 5-6)

## 2.1 Contract Architecture

**CRITICAL**: Reference `/mnt/user-data/uploads/MADHATS_GAMBIT_MASTER_BUILD_FINAL.md` for complete specifications.

### Contract Deployment Order:
```
1. MADxToken.sol (ERC-20 with burn mechanics)
2. CommunityTreasury.sol (40% revenue distribution)
3. RevenueShare.sol (Level 16+ earnings)
4. PrizePoolVault.sol (Tournament prizes)
5. ScandalCards.sol (ERC-1155, 992 cards)
6. CardEvolution.sol (Chainlink VRF evolution)
7. CardCondition.sol (6 condition states)
8. GambitAMM.sol (DL-LMSR with 1.88% fee)
9. ConvictionMarket.sol (Time-weighted staking)
10. TeaBagVault.sol (60% loss protection)
11. DutchAuction.sol (Pack sales)
12. SagaController.sol (90-day seasons)
```

---

## 2.2 MADxToken.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title MADxToken
 * @notice ERC-20 token with controlled supply and burn mechanics
 * 
 * Max Supply: 888,888,888 tokens
 * Transfer Burn: 0.15% (LP pools exempt)
 * Max Burn Per Period: 4.9% of supply
 */
contract MADxToken is ERC20, ERC20Burnable, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    uint256 public constant MAX_SUPPLY = 888_888_888 ether;
    uint256 public constant TRANSFER_BURN_BPS = 15; // 0.15%
    uint256 public constant MAX_BURN_PERIOD_BPS = 490; // 4.9%
    uint256 public constant BURN_PERIOD = 30 days;
    
    mapping(address => bool) public isLPPool;
    uint256 public lastBurnReset;
    uint256 public burnedThisPeriod;
    
    constructor() ERC20("MADx Token", "MADx") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        lastBurnReset = block.timestamp;
    }
    
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }
    
    function setLPPool(address pool, bool status) external onlyRole(DEFAULT_ADMIN_ROLE) {
        isLPPool[pool] = status;
    }
    
    function _update(address from, address to, uint256 amount) internal override {
        // Reset burn period if needed
        if (block.timestamp >= lastBurnReset + BURN_PERIOD) {
            burnedThisPeriod = 0;
            lastBurnReset = block.timestamp;
        }
        
        // Apply transfer burn (except minting, burning, LP)
        if (from != address(0) && to != address(0) && !isLPPool[from] && !isLPPool[to]) {
            uint256 burnAmount = (amount * TRANSFER_BURN_BPS) / 10000;
            
            // Check if burn exceeds period limit
            uint256 maxBurnThisPeriod = (totalSupply() * MAX_BURN_PERIOD_BPS) / 10000;
            if (burnedThisPeriod + burnAmount > maxBurnThisPeriod) {
                burnAmount = maxBurnThisPeriod - burnedThisPeriod;
            }
            
            if (burnAmount > 0) {
                burnedThisPeriod += burnAmount;
                super._update(from, address(0), burnAmount);
                amount -= burnAmount;
            }
        }
        
        super._update(from, to, amount);
    }
}
```

---

## 2.3 CommunityTreasury.sol (CRITICAL)

**Reference:** Section 4.2 of MADHATS_GAMBIT_MASTER_BUILD_FINAL.md

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title CommunityTreasury
 * @notice Manages 40% of platform revenue distribution
 * 
 * Distribution:
 * - 20% → Player Rewards Pool (tournament prizes)
 * - 12% → DAO Treasury (governance controlled)
 * - 8% → Member Rewards (Level 16+ revenue share)
 */
contract CommunityTreasury is AccessControl {
    bytes32 public constant REVENUE_DEPOSITOR_ROLE = keccak256("REVENUE_DEPOSITOR");
    
    IERC20 public immutable maddexToken;
    
    // Pool allocations (basis points, total = 10000)
    uint256 public constant PLAYER_POOL_BPS = 5000;   // 50% of 40% = 20% total
    uint256 public constant DAO_POOL_BPS = 3000;      // 30% of 40% = 12% total
    uint256 public constant MEMBER_POOL_BPS = 2000;   // 20% of 40% = 8% total
    
    uint256 public playerPoolBalance;
    uint256 public daoPoolBalance;
    uint256 public memberPoolBalance;
    
    address public prizePoolVault;
    address public daoGovernance;
    address public revenueShare;
    
    event RevenueDeposited(uint256 amount, uint256 playerShare, uint256 daoShare, uint256 memberShare);
    event PoolWithdrawal(string poolType, address to, uint256 amount);
    
    constructor(address _maddexToken) {
        maddexToken = IERC20(_maddexToken);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @notice Deposit revenue and split into 3 pools
     * @param amount Total amount to deposit (40% of platform fees)
     */
    function depositRevenue(uint256 amount) external onlyRole(REVENUE_DEPOSITOR_ROLE) {
        require(maddexToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        uint256 playerShare = (amount * PLAYER_POOL_BPS) / 10000;
        uint256 daoShare = (amount * DAO_POOL_BPS) / 10000;
        uint256 memberShare = amount - playerShare - daoShare;
        
        playerPoolBalance += playerShare;
        daoPoolBalance += daoShare;
        memberPoolBalance += memberShare;
        
        emit RevenueDeposited(amount, playerShare, daoShare, memberShare);
    }
    
    /**
     * @notice Transfer funds from player pool to prize vault
     */
    function fundTournamentPrizes(uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(prizePoolVault != address(0), "Prize vault not set");
        require(amount <= playerPoolBalance, "Insufficient balance");
        
        playerPoolBalance -= amount;
        require(maddexToken.transfer(prizePoolVault, amount), "Transfer failed");
        
        emit PoolWithdrawal("PLAYER", prizePoolVault, amount);
    }
    
    /**
     * @notice Transfer funds from member pool to revenue share contract
     */
    function fundRevenueShare(uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(revenueShare != address(0), "Revenue share not set");
        require(amount <= memberPoolBalance, "Insufficient balance");
        
        memberPoolBalance -= amount;
        require(maddexToken.transfer(revenueShare, amount), "Transfer failed");
        
        emit PoolWithdrawal("MEMBER", revenueShare, amount);
    }
    
    /**
     * @notice DAO governance can withdraw from DAO pool
     */
    function daoWithdraw(address to, uint256 amount) external {
        require(msg.sender == daoGovernance, "Only DAO");
        require(amount <= daoPoolBalance, "Insufficient balance");
        
        daoPoolBalance -= amount;
        require(maddexToken.transfer(to, amount), "Transfer failed");
        
        emit PoolWithdrawal("DAO", to, amount);
    }
    
    function setPrizePoolVault(address _prizePoolVault) external onlyRole(DEFAULT_ADMIN_ROLE) {
        prizePoolVault = _prizePoolVault;
    }
    
    function setDAOGovernance(address _daoGovernance) external onlyRole(DEFAULT_ADMIN_ROLE) {
        daoGovernance = _daoGovernance;
    }
    
    function setRevenueShare(address _revenueShare) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revenueShare = _revenueShare;
    }
    
    function getCommunityPools() external view returns (
        uint256 playerPool,
        uint256 daoPool,
        uint256 memberPool
    ) {
        return (playerPoolBalance, daoPoolBalance, memberPoolBalance);
    }
}
```

---

## 2.4 Complete Contract Implementation Guide

**Claude Code**: For EVERY remaining contract (RevenueShare.sol, PrizePoolVault.sol, ScandalCards.sol, etc.):

1. **Read the specification** from `/mnt/user-data/uploads/MADHATS_GAMBIT_MASTER_BUILD_FINAL.md`
2. **Implement the contract** following OpenZeppelin best practices
3. **Write comprehensive tests** (95%+ coverage required)
4. **Add NatSpec documentation** for all public functions
5. **Gas optimization** where applicable

**Key Contracts to Implement:**
- ✅ RevenueShare.sol (Level 16+ earnings tracking)
- ✅ PrizePoolVault.sol (Tournament prize management)
- ✅ ScandalCards.sol (ERC-1155, 992 cards, 7 rarities, 6 conditions)
- ✅ CardEvolution.sol (Chainlink VRF, near-miss mechanics)
- ✅ GambitAMM.sol (DL-LMSR with 1.88% fee split)
- ✅ TeaBagVault.sol (60% loss insurance)
- ✅ DutchAuction.sol (Pack sales with declining price)
- ✅ SagaController.sol (90-day seasons, 3 acts)

---

# 💾 PHASE 3: DATABASE & BACKEND (WEEKS 7-9)

## 3.1 Database Schema

**Reference:** `/mnt/user-data/outputs/MADHATS_DATABASE_SCHEMA.md`

**Claude Code**: Implement this EXACT schema in Prisma.

### Key Tables:
```prisma
// Users & Authentication
model User {
  id            String   @id @default(cuid())
  wallet        String   @unique
  username      String?  @unique
  level         Int      @default(1)
  xp            Int      @default(0)
  createdAt     DateTime @default(now())
  
  // Relationships
  cards         UserCard[]
  bets          Bet[]
  tournaments   TournamentEntry[]
  achievements  Achievement[]
}

// 992 Cards
model Card {
  id          Int      @id @default(autoincrement())
  tokenId     Int      @unique
  name        String
  faction     Faction
  rarity      Rarity
  tier        Int
  // ... 20+ more fields (see full schema)
}

// User Card Ownership
model UserCard {
  id          String    @id @default(cuid())
  userId      String
  cardId      Int
  condition   Condition @default(PRISTINE)
  evolutionLevel Int    @default(1)
  // ... more fields
}

// Markets & Betting
model Market {
  id              Int       @id @default(autoincrement())
  question        String
  description     String?
  marketType      MarketType
  totalVolume     Decimal   @default(0)
  totalFees       Decimal   @default(0)
  communityFees   Decimal   @default(0)  // 40% goes here
  // ... more fields
}

// Tournaments
model Tournament {
  id              Int            @id @default(autoincrement())
  name            String
  type            TournamentType
  entryFee        Decimal
  prizePool       Decimal        // From community treasury
  // ... more fields
}

// Revenue Tracking
model RevenueEvent {
  id              String   @id @default(cuid())
  source          String
  totalAmount     Decimal
  communityAmount Decimal  // 40%
  operationsAmount Decimal // 35%
  insuranceAmount Decimal  // 15%
  burnAmount      Decimal  // 10%
  createdAt       DateTime @default(now())
}
```

---

## 3.2 API Routes (Next.js 15 App Router)

**Reference:** `/mnt/user-data/outputs/MADHATS_API_SPECIFICATION.md`

### API Structure:
```
apps/api/src/app/api/
├── auth/
│   ├── connect-wallet/route.ts
│   ├── verify-signature/route.ts
│   └── logout/route.ts
├── users/
│   ├── me/route.ts
│   ├── [id]/route.ts
│   └── [id]/stats/route.ts
├── cards/
│   ├── route.ts (GET list, POST mint)
│   ├── [id]/route.ts
│   ├── [id]/evolve/route.ts
│   └── my-collection/route.ts
├── markets/
│   ├── route.ts
│   ├── [id]/route.ts
│   ├── [id]/bet/route.ts
│   └── [id]/resolve/route.ts
├── tournaments/
│   ├── route.ts
│   ├── [id]/route.ts
│   ├── [id]/enter/route.ts
│   └── [id]/leaderboard/route.ts
├── revenue/
│   ├── stats/route.ts
│   ├── my-earnings/route.ts
│   └── claim/route.ts
└── admin/
    ├── markets/create/route.ts
    ├── markets/[id]/resolve/route.ts
    └── analytics/route.ts
```

### Example API Route:

```typescript
// apps/api/src/app/api/cards/[id]/evolve/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@madhats/database';
import { verifyAuth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user's card
    const userCard = await prisma.userCard.findFirst({
      where: {
        userId: user.id,
        cardId: parseInt(params.id),
      },
      include: { card: true },
    });
    
    if (!userCard) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }
    
    // Check if card can evolve
    if (userCard.evolutionLevel >= 5) {
      return NextResponse.json({ error: 'Max evolution reached' }, { status: 400 });
    }
    
    // Call smart contract for evolution
    // This triggers Chainlink VRF for randomness
    const result = await evolveCardOnChain(userCard.id);
    
    // Update database
    if (result.success) {
      await prisma.userCard.update({
        where: { id: userCard.id },
        data: {
          evolutionLevel: { increment: 1 },
          tier: { increment: 1 },
        },
      });
      
      return NextResponse.json({
        success: true,
        newLevel: userCard.evolutionLevel + 1,
        newTier: userCard.card.tier + 1,
      });
    } else {
      return NextResponse.json({
        success: false,
        nearMiss: result.nearMiss,
        message: result.message,
      });
    }
  } catch (error) {
    console.error('Evolution error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

# 🎨 PHASE 4: FRONTEND INTEGRATION (WEEKS 10-12)

## 4.1 Merge Existing Frontend

**Reference:** `/mnt/user-data/outputs/SEAMLESS_FRONTEND_INTEGRATION_PLAN.md`

### Step 1: Extract Existing Frontend
```bash
cd /tmp
unzip /mnt/user-data/uploads/mad-gambit.zip -d mad-gambit-existing
cd mad-gambit-existing

# Copy to new monorepo
cp -r ./components ../../madhats-gambit/apps/web/src/
cp -r ./contexts ../../madhats-gambit/apps/web/src/
cp -r ./data ../../madhats-gambit/apps/web/src/lib/
cp ./index.css ../../madhats-gambit/apps/web/src/styles/
```

### Step 2: Update Navigation
**Reference:** Section 3 of SEAMLESS_FRONTEND_INTEGRATION_PLAN.md

```typescript
// apps/web/src/contexts/NavigationContext.tsx (UPDATED)

export type Tab = 
  // ═══ EXISTING (14 tabs) ═══
  | 'MADHAT' | 'DASHBOARD' | 'MARKETS' | 'SCANDALS' 
  | 'AUCTIONS' | 'SWAP' | 'GAMES' | 'ARENA' 
  | 'FACTIONS' | 'STAKING' | 'REFERRALS' 
  | 'LEADERBOARD' | 'GOVERNANCE' | 'SETTINGS'
  
  // ═══ NEW (12 tabs) ═══
  | 'CARDS' | 'DECKS' | 'SAGAS' | 'SHOP'           // Game
  | 'TOURNAMENTS' | 'MY_TOURNAMENTS' | 'EVENTS'     // Tournaments
  | 'CONVICTION' | 'TEABAG' | 'REVENUE'             // Advanced
  | 'DEGEN_OF_MONTH' | 'PACK_OPENING';              // Special
```

### Step 3: Extend Existing Pages
**Reference:** Section 4 of SEAMLESS_FRONTEND_INTEGRATION_PLAN.md

**Claude Code**: For each existing page (MadHatHubView, MarketTerminalView, GameHubView):
1. Keep 100% of existing content
2. Add gold divider at bottom
3. Append new sections with matching design
4. Test that old content still works

---

## 4.2 Create New Components

**Reference:** Section 6 of SEAMLESS_FRONTEND_INTEGRATION_PLAN.md

### New Components to Create (15 files):
```
apps/web/src/components/
├── CardCollectionView.tsx      (992-card grid with filters)
├── CardDetailModal.tsx          (individual card view)
├── CardEvolutionView.tsx        (evolution interface)
├── DeckBuilderView.tsx          (deck construction)
├── PackShopView.tsx             (pack shop)
├── PackOpeningModal.tsx         (animated reveal)
├── TournamentBrowserView.tsx    (tournament list)
├── TournamentDetailView.tsx     (live tournament)
├── MyTournamentsView.tsx        (user's tournaments)
├── MonthlyEventsView.tsx        (special events)
├── SagaProgressView.tsx         (90-day seasons)
├── ConvictionMarketsView.tsx    (conviction markets)
├── TeaBagInsuranceView.tsx      (loss protection)
├── RevenueShareView.tsx         (earnings dashboard)
└── DegenOfMonthView.tsx         (degen awards)
```

### Component Template:
```typescript
// Example: CardCollectionView.tsx

import React, { useState, useEffect } from 'react';
import { Layers, Search, Filter } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';

export const CardCollectionView = () => {
  const { address } = useWallet();
  const [cards, setCards] = useState([]);
  const [filter, setFilter] = useState({ faction: 'all', rarity: 'all' });
  const [search, setSearch] = useState('');
  
  useEffect(() => {
    fetchUserCards();
  }, [address, filter, search]);
  
  async function fetchUserCards() {
    const res = await fetch(`/api/cards/my-collection?wallet=${address}`);
    const data = await res.json();
    setCards(data.cards);
  }
  
  return (
    <div className="space-y-16 w-full animate-in fade-in duration-1000">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter text-white mb-4">
            CARD <span className="text-gold-gradient">COLLECTION</span>
          </h1>
          <p className="text-zinc-500 font-mono uppercase tracking-[0.3em] text-sm">
            {cards.length} / 992 CARDS OWNED
          </p>
        </div>
        
        {/* Filters */}
        <div className="flex gap-4">
          <select 
            value={filter.faction}
            onChange={(e) => setFilter({...filter, faction: e.target.value})}
            className="bg-phi-panel border border-white/10 rounded-lg px-4 py-2 text-white"
          >
            <option value="all">All Factions</option>
            <option value="tech">Tech Titans</option>
            {/* ... all 8 factions */}
          </select>
          
          <select 
            value={filter.rarity}
            onChange={(e) => setFilter({...filter, rarity: e.target.value})}
            className="bg-phi-panel border border-white/10 rounded-lg px-4 py-2 text-white"
          >
            <option value="all">All Rarities</option>
            <option value="common">Common</option>
            {/* ... all 7 rarities */}
          </select>
        </div>
      </div>
      
      {/* Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {cards.map(card => (
          <CardItem key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
};
```

---

# 🚀 PHASE 5: ADDITIONAL FEATURES (WEEKS 13-16)

**Reference:** `/mnt/user-data/outputs/COMPREHENSIVE_ADDITIONAL_FEATURE_RECOMMENDATIONS.md`

## 5.1 Priority Features

### Week 13: Quick Wins
- ✅ Social Sharing (1 day)
- ✅ Daily Quests (2 days)
- ✅ Leaderboards (2 days)
- ✅ Referral Program (3 days)

### Week 14: Engagement
- ✅ Battle Pass System
- ✅ Achievement System
- ✅ Social Profiles & Following

### Week 15: Monetization
- ✅ Subscription Tiers
- ✅ Virtual Currency Bundles
- ✅ NFT Cosmetics

### Week 16: Advanced
- ✅ Mobile Apps (start)
- ✅ DAO Governance
- ✅ Transparency Dashboard

**Claude Code**: For each feature:
1. Read the specification in COMPREHENSIVE_ADDITIONAL_FEATURE_RECOMMENDATIONS.md
2. Create database tables (if needed)
3. Create API routes
4. Create frontend components
5. Test thoroughly

---

# ✅ PHASE 6: TESTING & LAUNCH (WEEKS 17-20)

## 6.1 Testing Checklist

### Smart Contract Tests:
```bash
cd packages/contracts
forge test --gas-report

# Target: 95%+ coverage
# All critical paths tested
# Gas optimization verified
```

### API Tests:
```bash
cd apps/api
pnpm test

# Target: 90%+ coverage
# All endpoints tested
# Error handling verified
```

### E2E Tests:
```bash
cd apps/web
pnpm test:e2e

# Playwright tests
# Critical user journeys
# Cross-browser testing
```

---

## 6.2 Deployment Checklist

```
[ ] All contracts deployed to testnet
[ ] All contracts verified on Basescan
[ ] Database migrations run
[ ] API endpoints tested
[ ] Frontend deployed to Vercel
[ ] CommunityTreasury receiving 40% fees
[ ] RevenueShare tracking volumes
[ ] Security audit completed
[ ] Bug bounty program live
[ ] Documentation complete
```

---

# 📚 REFERENCE DOCUMENTS

## Must-Read Before Coding:

1. **Platform Specification**: `/mnt/user-data/outputs/MADHATS_MASTER_PLATFORM_PLAN_v5.md`
2. **Database Schema**: `/mnt/user-data/outputs/MADHATS_DATABASE_SCHEMA.md`
3. **API Spec**: `/mnt/user-data/outputs/MADHATS_API_SPECIFICATION.md`
4. **Gap Analysis**: `/mnt/user-data/outputs/GAP_ANALYSIS_BUILD3_vs_BUILDS12.md`
5. **Frontend Integration**: `/mnt/user-data/outputs/SEAMLESS_FRONTEND_INTEGRATION_PLAN.md`
6. **Additional Features**: `/mnt/user-data/outputs/COMPREHENSIVE_ADDITIONAL_FEATURE_RECOMMENDATIONS.md`
7. **Build 1 (992 cards)**: `/mnt/user-data/uploads/MADHATS_GAMBIT_MASTER_BUILD_FINAL.md`
8. **Build 2 (Design)**: `/mnt/user-data/uploads/COMPREHENSIVE_MERGE_PLAN.md`

---

# 🎯 IMPLEMENTATION PRIORITIES

## Critical Path (Must Do First):
1. ✅ MADxToken.sol
2. ✅ CommunityTreasury.sol (40% revenue)
3. ✅ RevenueShare.sol (Level 16+)
4. ✅ GambitAMM.sol (with revenue routing)
5. ✅ Basic frontend with revenue display

## High Priority:
6. ✅ ScandalCards.sol (992 cards)
7. ✅ Database schema
8. ✅ API routes
9. ✅ Frontend integration
10. ✅ Quick Win features

## Medium Priority:
11. ✅ Additional smart contracts
12. ✅ Advanced features
13. ✅ Mobile apps
14. ✅ Testing

---

# 💡 TIPS FOR CLAUDE CODE

## Best Practices:

1. **Read references first**: Always check the reference documents before implementing
2. **Follow existing patterns**: Match the design system and code style
3. **Test as you go**: Write tests alongside features
4. **Document everything**: Add comments and NatSpec
5. **Gas optimize**: Smart contracts should be efficient
6. **Error handling**: Graceful failures with helpful messages
7. **Security first**: Validate all inputs, check permissions

## Common Pitfalls to Avoid:

- ❌ Don't change existing frontend design
- ❌ Don't skip smart contract tests
- ❌ Don't forget revenue distribution (40% to community!)
- ❌ Don't hard-code values
- ❌ Don't skip error handling
- ❌ Don't forget to seed 992 cards

---

# 🚀 READY TO BUILD!

**This document contains everything Claude Code needs to build the complete MADHATs Gambit platform.**

## What to Build:
✅ Complete monorepo
✅ 11+ smart contracts
✅ Full database (20+ tables)
✅ 50+ API endpoints
✅ 40+ frontend components
✅ 992 NFT cards
✅ All game mechanics
✅ 45+ additional features

## Timeline: 20 weeks (5 months)

## Team: Claude Code + 2-3 developers

## Result: Production-ready prediction market platform with:
- $154.5M annual revenue potential
- 750k user capacity
- 70% retention rate
- Full feature parity with competitors
- Unique community ownership model

---

**LET'S BUILD! 🎮🚀**

**Version:** 5.0  
**Last Updated:** January 26, 2026  
**Status:** ✅ CLAUDE CODE READY
