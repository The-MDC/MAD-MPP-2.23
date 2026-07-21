# ∑n:tangled Marketplace+ — Product Scope & Outline
> Source: Google Drive DEV Scope docs (March 2025) + Notion ecosystem context
> Last updated: April 5, 2026

---

## Identity

**Full Name:** ∑n:tangled Marketplace+
**Short Name:** En:tangled / Entangled
**Product type:** Decentralized multi-chain digital asset marketplace + MDC ecosystem hub
**Status:** Active — separate product within The MDC (not deprecated)
**Ecosystem position:** Standalone MDC product — peer to MAD Gambit, MADDAO, and MADforge Labs. All four form the MDC circular economy.

---

## Vision & Mission

**Vision:** Become a leading Web3 marketplace uniting digital and real-world assets with decentralized community-driven innovation.

**Mission:** Deliver a secure, intuitive platform for asset trading, launching, and management — rewarding community participation across all EVMs, Solana, and eventually TON.

---

## Core Product Areas

### 1. Digital Asset Marketplace
- NFTs (ERC-721, ERC-1155), utility tokens ($MADx), RWAs (Real World Assets), SBTs, POAPs, collectibles
- Non-custodial wallet support (Phantom + MetaMask)
- Low-fee trading UI with real-time dashboards
- Cross-chain asset listings and transfers

### 2. Quadratic Launchpad
- Community-driven IDOs (Initial Dex Offerings)
- MADforge Labs project incubation and drops
- Token/Coin/NFT launch infrastructure
- Quadratic funding model for fair distribution

### 3. Staking & Rewards
- $MADx liquid staking: 5–10% APY (base tier)
- Tokenized loyalty program (redeemable for NFTs, $MADx, casino credits)
- Gamified quest system with tiered XP
- Example quests: "Trade 10 NFTs," "Stake $MADx," "Level 10 unlocks NFT minting tools"

### 4. MĐC Casino Integration (Ethical Casino / Golden Hands)
- Profit-sharing between casino and marketplace pools
- Casino credits usable across En:tangled
- Anti-fraud via Chainlink VRF for gaming fairness
- Shared rewards pool with MADforge Labs

### 5. MADDAO Governance Integration (Circular Economy Touchpoint)
- Snapshot voting for $MADx and NFT holders
- Community controls: fee structures, partnerships, launchpad curation
- Quadratic voting capped at **24x** (prevents whale capture — same cap as MAD Gambit)
- CrowdundDAO and micro-lending integration

### 6. MADforge Labs Integration Point
- MADforge Labs is its own standalone MDC product — **not a sub-component of En:tangled**
- En:tangled's Quadratic Launchpad is the primary **distribution channel** for MADforge-incubated projects
- Token/NFT drops from MADforge projects launch via En:tangled's launchpad infrastructure
- Shared rewards pool connects the two — circular economy touchpoint

---

## Multi-Chain Architecture

| Chain | Role |
|---|---|
| **Arbitrum** | Primary EVM (aligns with $MADx deployment) |
| **ApeChain** | Key integration — ApeCoin ecosystem extension |
| **Polygon** | EVM liquidity layer |
| **Base** | EVM expansion |
| **Solana** | High-speed transactions, Phantom wallet native |
| **TON** | Future expansion |
| **ETH** | Base layer reference |

**Supported assets:** $MADx, ARB, APE, POLY, ETH, USDT, USDC

**Cross-chain:** Chainlink CCIP for Solana↔EVM NFT and $MADx transfers

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (web), React Native (mobile — Phase 3+) |
| Smart contracts | Solidity (ERC-1155, ERC-20, ERC-721), audited via OpenZeppelin |
| Data | PostgreSQL + The Graph |
| Storage | IPFS |
| Cross-chain | Chainlink CCIP |
| Randomness | Chainlink VRF (casino + quests) |
| Governance | Snapshot |
| AI/ML | TensorFlow.js — predictive NFT analytics, anti-fraud bots (Phase 3) |
| Security | CertiK audits, Immunefi bug bounty, basic KYC/AML (Civic) |

---

## Genesis NFT: GENESIS 888 FoundersMFT
- **888 ERC-1155 Founder NFTs** (distinct from MAD Gambit's 2,488 Golden Ticket)
- Exclusive access: quests, casino bonuses, governance voting power
- "Degen Pass" — gated perks, partner project airdrops, collab unlocks

---

## 4-Phase Roadmap

### Phase 1: Foundation & Core Launch (Q2–Q3 2025)
**Budget: $5,500**
- Deploy on Solana + Arbitrum + Polygon + Base + ApeChain
- Smart contracts: $MADx ERC-20, NFTs ERC-721/1155 (OpenZeppelin templates)
- Asset listings, trading UI, staking (5–10% APY)
- Non-custodial wallet (Phantom + MetaMask)
- Initial CertiK audit, basic KYC/AML
- 500-user beta test

### Phase 2: Ecosystem & Community Launch (Q4 2025–Q1 2026)
**Budget: $8,000**
- Launch $MADx as casino/marketplace utility token
- GENESIS 888 FoundersMFT drop (ERC-1155 Degen Pass)
- Gamified quest system with tiered XP and loyalty rewards
- Quadratic Launchpad live for IDOs
- MADforge Labs incubation pipeline integrated
- MĐC Casino profit-sharing pool connected
- MADDAO Snapshot voting live (MADDAO is its own standalone MDC product — governs the full circular economy)
- 2–3 external partnerships onboarded

### Phase 3: Interoperability & Scaling (Q2–Q3 2026) ← CURRENT
**Budget: $6,000**
- Chainlink CCIP: Solana↔EVM cross-chain transfers
- Cross-chain staking (stake Solana NFTs, earn $MADx on Polygon)
- AI/ML analytics: NFT trend prediction + anti-fraud bots (TensorFlow.js)
- Real-time dashboards (Wagmi.sh integration)
- Immunefi bug bounty launched
- Multi-language support
- Load test: 10,000+ users

### Phase 4: Governance & Long-term Growth (Q4 2026+)
**Budget: $4,000 + reinvested revenue**
- Full DAO governance via Aragon
- Options trading on digital assets
- Optional metaverse spaces (virtual NFT galleries, RWA fractionalization)
- 5+ ecosystem partners, target 50,000 users
- AI-driven adaptive UI
- MiCA/SEC compliance frameworks

---

## Revenue Streams

| Source | Share |
|---|---|
| Trading fees | 40% |
| Staking rewards pool | 30% |
| Casino profit-sharing | 20% |
| Micro-lending fees | 10% |

**20% of revenue reinvested into R&D**

---

## Key Differentiators vs. Generic Marketplaces

1. **MDC Ecosystem Integration** — $MADx utility flows across MAD Gambit + En:tangled + Casino
2. **Quadratic Launchpad** — community-driven IDOs, not VC-controlled token launches
3. **MADforge Labs incubation** — deal flow built into the platform
4. **Ethical Casino layer** — shared rewards pool creates retention loop
5. **True cross-chain** — Solana + EVM + future TON via CCIP
6. **MADDAO governance** — community controls fee structure and curation

---

## MDC Ecosystem Position

∑n:tangled Marketplace+ is one of four standalone MDC products. For circular economy flows and cross-product architecture, see `00-mdc-ecosystem/MDC_CIRCULAR_ECONOMY.md`.

**En:tangled's touchpoints with peer products:**
- **MADDAO** (`12-maddao/`): Governs En:tangled fee structures, curation standards, and reserve spending via Snapshot voting
- **MADforge Labs** (`13-madforge-labs/`): En:tangled's Quadratic Launchpad is the primary distribution channel for MADforge-incubated project launches
- **MAD Gambit** (`01-whitepaper/`): Shared $MADx economy; MADHAT's Gambit card NFTs tradeable on En:tangled

---

## Open Questions (as of April 2026)

1. Phase 2 status — was the Quadratic Launchpad + GENESIS 888 drop completed on schedule (Q4 2025–Q1 2026)?
2. ApeChain integration progress — any active partnerships with ApeCoin ecosystem projects?
3. MĐC Casino (Golden Hands) — built, in development, or still conceptual?
4. MADforge Labs — any incubated projects ready for launchpad?
5. Budget: $30K total — was this external dev budget or internal? Current funding status?
6. TON integration — still on the roadmap?

