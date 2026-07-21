# SYNTHESIZED ACTION PLAN — PRIORITIZED ENHANCEMENT ROADMAP
## MAD GAMBIT: From Current State to Investor-Ready Platform
> Source of Truth: https://the-mdc.github.io/MADHATs-Gambit-Presentation/
> Date: March 20, 2026
> Derived from: 17 source documents, 11 competitor analyses, 4 VC stress tests

---

## EXECUTIVE SUMMARY

After cross-referencing 17 internal documents against the live presentation and the competitive landscape (Kalshi at $22B, Polymarket at $9B, 5 new entrants), this plan identifies **28 specific actions** organized into 4 tiers. Each action includes what it is, why it matters, the step-by-step implementation plan, and the expected impact on fundraising or product strength.

---

## TIER 1: DATA INTEGRITY FIXES (Do Today)
*These are errors that actively undermine VC credibility if discovered.*

---

### 1. UPDATE LIVE PRESENTATION FEE TO 1.88%

**What:** The live presentation HTML at https://the-mdc.github.io/MADHATs-Gambit-Presentation/ still contains **8 references to 2.88%** and **4 references to 4.88%**, with only 2 references to the correct 1.88%.

**Why this matters:** A VC who reads the tokenomics doc (1.88%) and then opens the presentation (2.88%) will immediately question data integrity across all documents. This is the single fastest way to lose trust in a meeting.

**Step-by-step:**
1. Clone `MADHATs-Gambit-Presentation` repo
2. Open `madhats-gambit.html`, find-replace: `2.88%` → `1.88%`, `4.88%` → `1.88%`
3. Verify the fee math tables update correctly (creator share = 40% of 1.88% = 0.752%)
4. Update the "Revenue" section (#revenue) projections if they use the old fee
5. Commit, push, verify GitHub Pages rebuilds
6. Cross-check the `vc-hotsheet` section inside the HTML

**Impact:** Eliminates the #1 credibility risk across all investor materials.

---

### 2. CLARIFY "40% CREATOR SHARE" LANGUAGE EVERYWHERE

**What:** The presentation, whitepaper, and multiple docs reference "40%" in different contexts — sometimes as "40% Community Revenue Share" (WhitePaper v1.8 line 316), sometimes as "40% to Creator" (correct), and sometimes as "40% loss protection" (superseded). A VC reading across documents will see three different meanings for the same percentage.

**Why this matters:** The 40% creator share is your #1 competitive differentiator — zero of 11 competitors offer it. If a VC thinks it means "40% of all revenue goes to the community" (which is how the whitepaper reads), your unit economics look broken. The correct interpretation (40% of the 1.88% fee on creator-made markets goes to the creator) is dramatically different.

**Step-by-step:**
1. In the live presentation HTML, ensure every "40%" reference specifies "on creator-made markets"
2. In the whitepaper extraction header, add clarification that "40% community revenue share" language from older drafts is superseded
3. Create a one-line canonical definition: "Creators who launch markets earn 40% of the 1.88% platform fee ($0.752 per $100 bet) as lifetime on-chain revenue. This applies ONLY to creator-made markets."
4. Verify the tokenomics doc, investor hotsheet, and VC data room all use this exact definition

**Impact:** Prevents the most common misinterpretation of your strongest competitive moat.

---

### 3. LABEL PITCH DECK v1.5 AS SUPERSEDED

**What:** The v1.5 deck shows $2.4M-$3M seed ask, 1.66% fee, and 40% Shield — all superseded by the v1.2 canonical numbers ($1M-$2M, 1.88%, 28.8%). Both PDFs are in the repo and data room.

**Why this matters:** A VC doing due diligence will find both files. If they open v1.5 first, every subsequent number in v1.2 looks like it was changed to look better. Label it clearly so it's obviously historical.

**Step-by-step:**
1. The v1.5 PDF is already in `_REVIEW_BEFORE_DELETE/` — confirm it stays there
2. If any copy remains in `03-pitch-materials/`, add "SUPERSEDED_" prefix to filename
3. Update `PITCH_DECK_VERSION_TRACKER.md` to mark v1.5 status as "ARCHIVED — DO NOT DISTRIBUTE"
4. Verify the VC Data Room Index does not link to v1.5

**Impact:** Prevents the #2 most common VC trust failure (contradictory documents).

---

### 4. RECONCILE TAM: $192.1B vs $2.9T

**What:** The presentation shows TAM as $192.1B (Global Sports Betting + Online Gambling). The whitepaper uses $2.9T (adds broader entertainment). Both are defensible but using different numbers in different contexts looks sloppy.

**Why this matters:** TAM is the first number many VCs look at. Inconsistency here suggests the founder hasn't thought carefully about market sizing.

**Step-by-step:**
1. Choose ONE framing: $192.1B as the primary TAM (sports betting + gambling — this is what Kalshi and Polymarket use for comparability)
2. Reference $2.9T as the "TAM + Adjacent Market Opportunity" in a supporting slide or footnote
3. Update the whitepaper synthesis and any docs using $2.9T to match

**Impact:** Clean, consistent market sizing across all materials.

---

## TIER 2: CRITICAL FEATURE GAPS (This Week)
*Features referenced in the presentation that have zero implementation. A technical VC will ask to see these.*

---

### 5. SCAFFOLD DutchAuction.sol

**What:** The presentation has a dedicated `#dutch-markets` section describing weekly Scandal Pack drops via Dutch Auction. No contract exists.

**Why this matters:** This is Step 1 of the core loop (COLLECT). Without it, users cannot acquire cards, and the entire gameplay cycle is broken. Every other feature depends on cards existing in user wallets.

**Step-by-step:**
1. Create `05-smart-contracts/madhat-core/src/markets/DutchAuction.sol`
2. Define interface: `createAuction(packId, startPrice, decayRate, minPrice, duration)`
3. Implement linear price decay: `currentPrice = startPrice - (decayRate × elapsed)`
4. Add `purchase(auctionId, quantity)` with $MADx-only payment
5. Emit events: `AuctionCreated`, `PackPurchased`, `AuctionEnded`
6. Add NatSpec documentation referencing the presentation section
7. Write basic Foundry test: `test_priceDecaysCorrectly`, `test_purchaseAtCurrentPrice`
8. Add to `DeployCoreContracts.s.sol` deployment sequence

**Impact:** Completes the core loop. Demonstrates the primary NFT distribution mechanism to investors.

---

### 6. SCAFFOLD MarketFactory.sol

**What:** The presentation `#markets` section shows multiple market types (binary, multi, scalar). No factory contract exists to create and manage markets.

**Why this matters:** Without a factory, markets must be manually deployed — impossible to scale. The Scandal Scraper AI (also in the presentation) needs a programmatic way to create markets.

**Step-by-step:**
1. Create `05-smart-contracts/madhat-core/src/markets/MarketFactory.sol`
2. Define: `createBinaryMarket(question, endTime, resolutionSource, creatorAddress)`
3. Define: `createMultiOutcomeMarket(question, outcomes[], endTime, resolutionSource)`
4. Implement creator fee routing: if `creatorAddress != address(0)`, route 40% of fee to creator
5. Track all markets: `mapping(uint256 => address) public markets`
6. Emit: `MarketCreated(id, type, question, creator, endTime)`
7. Add access control: anyone can create (permissionless), but emergency pause by admin

**Impact:** Enables both platform-created and creator-created markets — the entire creator economy feature.

---

### 7. DEPLOY CONTRACTS TO ARBITRUM SEPOLIA TESTNET

**What:** Zero smart contracts are deployed anywhere. Every competitor has live products. Kalshi has $22B in volume.

**Why this matters:** The #1 VC weakness identified across all 4 stress-test analyses. "Show me the code running" is the baseline bar for any Web3 seed round in 2026. Without it, you're pitching a whitepaper, not a platform.

**Step-by-step:**
1. Configure Foundry for Arbitrum Sepolia: `foundry.toml` → `[profile.sepolia]`
2. Create `.env` with deployer private key (use a fresh testnet wallet)
3. Get Sepolia ETH from faucet: https://faucet.quicknode.com/arbitrum/sepolia
4. Run: `forge script script/DeployCoreContracts.s.sol --rpc-url $ARBITRUM_SEPOLIA_RPC --broadcast`
5. Verify on Arbiscan: `forge verify-contract $ADDRESS --chain arbitrum-sepolia`
6. Document deployed addresses in `05-smart-contracts/DEPLOYED_ADDRESSES.md`
7. Add testnet link to the presentation's data room section

**Impact:** Transforms the project from "whitepaper" to "working prototype." Dramatically increases VC confidence.

---

### 8. ADD CI/CD PIPELINE

**What:** The `.github/workflows/` directory exists but is empty. No automated testing.

**Why this matters:** Any technical VC or due diligence engineer will check the GitHub repo. An empty CI/CD directory signals "this code hasn't been tested." In the context of smart contracts handling money, this is a red flag.

**Step-by-step:**
1. Create `.github/workflows/test.yml`:
   - Trigger on push to `main` and `The-MDC` branches
   - Install Foundry: `uses: foundry-rs/foundry-toolchain@v1`
   - Run: `forge build`, `forge test -vvv`, `forge coverage`
2. Create `.github/workflows/lint.yml`:
   - Run Slither static analysis on all .sol files
   - Report findings as PR comments
3. Add status badges to README.md
4. Ensure all existing tests pass before enabling

**Impact:** Professional engineering standard. Shows the code is tested and maintained.

---

## TIER 3: VALUE-ADDING FEATURE ENHANCEMENTS (Next 2 Weeks)
*Features that exist in source documents but aren't yet in the presentation or codebase. Each adds measurable value.*

---

### 9. BUILD ChaosMeter WIDGET

**What:** The presentation prominently features ChaosMeter as a real-time scandal velocity indicator. No backend data pipeline or frontend component exists.

**Why this matters:** ChaosMeter is one of the most visually distinctive features in the presentation — it's the equivalent of a "trending" indicator but for scandals. It's low effort to build but creates high perceived product maturity. It feeds the dopamine loop (anticipation engineering from the Neuroscience Systems doc).

**Step-by-step:**
1. Backend: Create a Redis pub/sub channel `chaos:velocity`
2. Backend: Build a lightweight aggregator that scores scandal velocity from: active market count, bet volume in last hour, social mention rate
3. Formula: `ChaosMeter = (ActiveMarkets × BetVolume1hr × SocialMentions) / normalizer`
4. Frontend: Build `<ChaosMeter />` React component with animated gauge (0-100)
5. Connect via WebSocket for real-time updates
6. Display on Dashboard and Prediction Parlor pages

**Impact:** Differentiating UX element that no competitor has. Demo-ready for investor meetings.

---

### 10. INTEGRATE PRIVY AUTH (Code Ready)

**What:** The Azuro/PredictOS analysis doc contains complete, production-ready Privy integration code (layout.tsx + MadWallet.tsx) for email/social/wallet authentication with gasless Account Abstraction.

**Why this matters:** Web2-smooth onboarding is the #1 differentiator vs Polymarket (requires crypto wallet + USDC). Privy enables email/Google login → automatic wallet creation → gasless transactions. This directly enables the "Web2-smooth wrapper" claim in the presentation's elevator pitch.

**Step-by-step:**
1. Sign up for Privy dashboard: https://privy.io
2. Create app, get App ID
3. Install: `npm install @privy-io/react-auth @privy-io/wagmi`
4. Port `layout.tsx` from Azuro Analysis (PrivyProvider wrapper with Arbitrum config)
5. Port `MadWallet.tsx` (wallet display + embedded wallet creation)
6. Configure supported login methods: email, Google, Apple, wallet
7. Test: email login → wallet auto-created → can sign transactions
8. Update the marketing website scope to use Privy instead of Supabase Auth

**Impact:** Enables the "sign up in <30 seconds" claim from the presentation. Removes the #1 barrier to mainstream adoption.

---

### 11. DEFINE SCANDAL SCRAPER AI ARCHITECTURE

**What:** The presentation has 11 references to "Scandal Scraper" as an AI system that auto-proposes markets from trending cultural events. No architecture, data pipeline, or implementation plan exists.

**Why this matters:** The Scandal Scraper is what makes MAD Gambit's market supply self-sustaining. Without it, someone must manually create every market — which doesn't scale. The VC stress test identified "What happens when you run out of scandals?" as a key question.

**Step-by-step:**
1. Define data sources: Reuters/AP API, X/Twitter API, Reddit API, Google Trends, TikTok trending
2. Define NLP pipeline: Event extraction → Entity recognition → Scandal scoring → Market proposal
3. Define scandal scoring: `ScandalScore = Celebrity_Fame × Event_Severity × Social_Velocity × Controversy_Index`
4. Define market template engine: scandal → question + outcomes + resolution criteria + end time
5. Define human review queue: AI proposes → moderator approves → MarketFactory.sol creates
6. Technology: Python, LangChain or custom LLM pipeline, Celery for async processing
7. Phase 1: Manual + AI-assisted (human picks from AI suggestions)
8. Phase 2: Fully autonomous with human override

**Impact:** Answers the "market supply" question for VCs. Demonstrates AI integration beyond buzzwords.

---

### 12. INTEGRATE NEUROSCIENCE TYPESCRIPT MODULES

**What:** Six production-ready TypeScript modules exist in Google Drive (dopamine optimization, social mirroring, anticipation engineering, loss aversion, sunk cost reinforcement, recovery pathways) with a `useNeuroscience()` React hook. None are integrated into the codebase.

**Why this matters:** These modules implement the "iGaming-grade retention" claim from the presentation. They're the technical implementation of the "70%+ D30 retention" target. Having them in the repo (even as a library) demonstrates engineering depth far beyond competitors who have zero gamification.

**Step-by-step:**
1. Create `06-frontend/libs/neuroscience/` directory
2. Port all 6 TypeScript modules from Google Drive
3. Create `useNeuroscience.ts` hook that initializes all modules
4. Define integration points:
   - `dopamineOptimizer` → MysteryPack component (pack opening animation)
   - `socialMirroring` → WhaleWatcher component (real-time activity feed)
   - `anticipationEngine` → ChaosMeter + market countdown timers
   - `lossAversionEngine` → BetSlip Shield opt-in prompt
   - `sunkCostReinforcement` → Card evolution progress bars
   - `recoveryPathways` → Post-loss recovery modal
5. Add unit tests for each module
6. Document the behavioral psychology principles in a README

**Impact:** Turns a competitive claim ("iGaming-grade retention") into verifiable code. Impressive to technical VCs.

---

### 13. ADD CUSTOMER SEGMENT UNIT ECONOMICS TO HOTSHEET

**What:** Detailed customer segment data exists (4 segments with ARPU, CAC, regional targeting) but none of it appears in the presentation's VC hotsheet or investor materials.

**Why this matters:** "What's your CAC? What's your LTV? What's your payback period?" are top-5 VC questions. Currently, the only answer is the competitive matrix and the revenue projection table. Having segment-specific unit economics (Gen Z ARPU $100+, Creator $6.50 ROI per $1) makes the revenue model credible.

**Step-by-step:**
1. Add to presentation VC hotsheet section:
   - Gen Z segment: ARPU $100+, target CAC $5-15, payback <2 months
   - Creator segment: Near-zero CAC (organic), 5-10x viral multiplier
   - Crypto Native: ARPU variable, CAC $10-20, high staking conversion
2. Calculate blended LTV: using D30 retention target (70%) and average bet frequency
3. Add LTV/CAC ratio to investor hotsheet (target: >10x)
4. Reference Kalshi comp: their revenue per monthly active user ≈ $4.25 ($260M / 5.1M × 12mo adjustment)

**Impact:** Answers the #1 VC unit economics question with data, not handwaving.

---

### 14. SCAFFOLD OracleIntegration.sol (TRIPLE-THREAT)

**What:** The presentation has a dedicated `#oracle` section describing the Triple-Threat system (Chainlink → News APIs → 66% Community Vote). No wrapper contract exists.

**Why this matters:** The A16z patent assessment (89% patentability) identifies the oracle resolution workflow as the strongest patent angle alongside the MAD Shield. Having this as a contract — even scaffolded — strengthens both the patent filing and VC due diligence.

**Step-by-step:**
1. Create `05-smart-contracts/madhat-core/src/oracle/OracleIntegration.sol`
2. Define 3-tier resolution state machine:
   - State 1: `AWAITING_CHAINLINK` → auto-resolve if data feed confirms
   - State 2: `AWAITING_NEWS_API` → triggered if Chainlink disputed, 10-30min window
   - State 3: `AWAITING_COMMUNITY_VOTE` → 48-hour quadratic vote, 66% supermajority
3. Implement commit-reveal for community vote (prevents frontrunning)
4. Add soft-close trigger: if volume spikes >500%, pause betting
5. Emit events for each resolution tier transition
6. Add Chainlink VRF import for verifiable randomness

**Impact:** Strengthens patent filing. Demonstrates the oracle innovation that differentiates from Polymarket (UMA only) and Kalshi (CFTC-approved, centralized).

---

### 15. PORT v1.0 RISK ANALYSIS FRAMEWORK TO CURRENT DOCS

**What:** The original tokenomics v1.0 (Nov 2024) contains a comprehensive risk analysis covering market risks, governance risks, technical risks, and regulatory risks with specific mitigations. This framework is MORE detailed than what's in the current tokenomics doc.

**Why this matters:** The VC stress test's single FAIL analysis cited "the economic model is unsustainable and likely a regulatory liability." Having a pre-existing, detailed risk framework shows you've already thought through these concerns — it's not defensive, it's proactive.

**Step-by-step:**
1. Extract risk tables from the Master Tokenomics (already added in evolution history)
2. Expand each risk with current mitigations:
   - Market risk: Bond Curve protocol-owned liquidity ($7.5M+)
   - Governance risk: Quadratic voting, 100K deposit, timelock
   - Technical risk: CertiK/Trail of Bits dual audit, OpenZeppelin
   - Regulatory risk: Entertainment classification + patent IP + potential CFTC dialogue
3. Add to the presentation's data room section as "Risk Mitigation Framework"
4. Cross-reference with the 12/12 stress test already in the tokenomics doc

**Impact:** Proactively addresses the #1 VC concern (regulatory) before they ask.

---

## TIER 4: STRATEGIC ENHANCEMENTS (Next 30 Days)
*Features that create competitive distance and address the biggest threats identified in competitor analysis.*

---

### 16. CREATE MOBILE PWA (Progressive Web App)

**What:** The presentation roadmap shows "Mobile" in Q3 2026. Kalshi, DraftKings, Robinhood, and Fanatics ALL have polished mobile apps today.

**Why this matters:** Mobile is table stakes in 2026. A PWA is achievable in 2-3 weeks and provides 80% of native app functionality (push notifications, offline caching, home screen icon) without App Store approval delays.

**Step-by-step:**
1. Add PWA manifest to Next.js app: `manifest.json` with MAD Gambit branding
2. Add service worker for offline caching of static assets
3. Enable push notifications via Web Push API
4. Implement responsive breakpoints already defined in presentation CSS
5. Add "Add to Home Screen" prompt on mobile browsers
6. Test on iOS Safari and Chrome Android
7. Update roadmap: "Mobile PWA Q2 2026" / "Native Apps Q3 2026"

**Impact:** Eliminates the mobile gap vs competitors. Accelerates from Q3 to Q2.

---

### 17. BUILD CREATOR MARKET TOOLS

**What:** The 40% creator revenue share is your strongest feature, but no creator-facing tools exist — no market creation UI, no earnings dashboard, no analytics.

**Why this matters:** The VC stress test's #1 validated strength was the creator economy model. But Analysis #3 warned: "the Creator Profit Share combined with culture-native prediction rails is the first credible plan — IF creators actually use it." Without tools, they won't.

**Step-by-step:**
1. Create `/creator-dashboard` page with:
   - Market creation wizard (question → outcomes → resolution criteria → end time)
   - Real-time earnings tracker (fees earned, volume on your markets)
   - Analytics: which markets performed best, audience demographics
2. Build share/embed kit: one-click embed code for gossip sites and social media
3. Create "Creator Onboarding" flow: apply → approved → tools unlocked
4. Pilot with 3-5 crypto Twitter influencers

**Impact:** Validates the creator thesis before TGE. Creates proof of creator demand for VCs.

---

### 18. SCAFFOLD SagaController.sol

**What:** The presentation has a `#sagas-tab` section showing 90-day seasonal progression with 3 Acts. No contract or backend service exists.

**Why this matters:** Sagas are the "live service" engagement model that creates recurring revenue (like battle passes in gaming). This is what drives the "70%+ D30 retention" claim — users return to complete the season.

**Step-by-step:**
1. Create `05-smart-contracts/madhat-core/src/game/SagaController.sol`
2. Define: `startSeason(name, duration, themeMarketIds[])`
3. Define: `advanceAct()` — triggered every 30 days, opens new themed markets
4. Define: `claimSeasonRewards(userId)` — distributes XP, cards, $MADx based on progression
5. Backend: SagaService manages season state, progression tracking, reward calculation
6. Frontend: Season tracker component with Act progression bars

**Impact:** Creates the recurring engagement loop that justifies the retention metrics in the deck.

---

### 19. FILE PROVISIONAL PATENT (MAD Shield + Oracle)

**What:** The A16z patent assessment scored 89% patentability. The strongest angles are: (1) the on-chain risk-shield reserve-locking protocol, and (2) the multi-tier oracle resolution workflow.

**Why this matters:** Patents create defensible moats. When Polymarket or Kalshi eventually copy the creator model or loss protection, a patent gives you negotiating power. The A16z assessment specifically recommends filing NOW while the provisional window is open.

**Step-by-step:**
1. Engage patent counsel (the A16z assessment is the ammunition — share it)
2. Convert branded terms to technical modules:
   - "MAD Shield" → "On-chain risk-shield pool with GARCH-based dynamic premium computation"
   - "Triple-Threat Oracle" → "Multi-tier dispute resolution with commit-reveal and threshold voting"
3. Draft provisional with 3 claim sets:
   - Claim 1: Loss-shield reserve-locking and payout gating protocol
   - Claim 2: Multi-tier oracle with state machine transitions
   - Claim 3: Combined system (prediction market + shield + oracle)
4. File provisional (12 months to convert to full patent)
5. Add "Patent Pending" to investor materials

**Impact:** Creates defensible IP. Transforms from "anyone can copy this" to "we own this."

---

### 20. BUILD DISTRIBUTION PARTNERSHIPS

**What:** Kalshi is embedded in Robinhood + Coinbase + CNN + CNBC. Polymarket has X integration + ICE data feeds. MAD Gambit has zero distribution partnerships.

**Why this matters:** The best product doesn't win — the best distributed product wins. Kalshi's 5.1M users came primarily from Robinhood integration, not organic growth.

**Step-by-step:**
1. **Telegram Mini App** (highest ROI for crypto-native): Build a Telegram bot that shows trending scandal markets, allows quick bets, links to full platform
2. **Phantom Wallet integration**: Partner with Phantom for Solana-native users (future chain expansion)
3. **Gossip site embeds**: Build `<script>` widget that gossip sites can embed — shows real-time odds for featured scandals. This was recommended in the VC stress test.
4. **X/Twitter integration**: Build a bot that auto-posts new scandal markets with odds cards

**Impact:** Addresses the distribution gap vs Kalshi/Polymarket. Creates organic user acquisition channels.

---

### 21. EXECUTE TOP 3 GTM EXPERIMENTS (from VC Stress Test)

**What:** The "Shooting Holes" doc defines 12 GTM experiments. The top 3 by expected impact are testable pre-TGE.

**Why this matters:** VCs want to see traction, not plans. Running even small experiments generates data that proves the model works.

**Step-by-step:**
1. **"Influencer Vig" Beta** (30 days): Give 5 crypto influencers access to create markets. Track: do they create markets? Do their followers bet? What's the creator retention rate?
2. **Shield A/B Test** (14 days): Run two identical markets, one with Shield opt-in, one without. Measure: does Shield increase average bet size by 3x? (Hypothesis from VC analysis)
3. **"Comment Section" Widget** (30 days): Embed a prediction widget on 3 gossip sites. Track: CTR, wallet connects, first bets

**Impact:** Generates real data for VC meetings. Transforms "we believe" into "we tested."

---

### 22-28. ADDITIONAL ENHANCEMENTS (Prioritized)

| # | Enhancement | Why It Matters | Effort | Phase |
|---|------------|---------------|--------|-------|
| 22 | **Morpho Blue DeFi integration** | Makes MAD Shield self-funding from idle treasury yield. Referenced in EVM Guide. | 2-3 days | Phase 2 |
| 23 | **TheGraph subgraph** | Essential for frontend to query on-chain events efficiently. Ready code in Azuro Analysis. | 1-2 days | Phase 1 |
| 24 | **FactionWars.sol** | 8-faction system creates tribal loyalty and competitive engagement. Presentation #cards shows faction tags. | 2-3 days | Phase 2 |
| 25 | **Parlay mechanics** | Kalshi generated $947.8M from parlays alone. "Scandal Parlay Packs" = unique product. | 3-5 days | Phase 3 |
| 26 | **AI Agent Leagues** | VC Analysis #4 suggested bot-vs-bot leagues. Differentiator vs all competitors. | 1-2 weeks | Phase 3 |
| 27 | **FHE encrypted bets (Zama)** | Privacy-first betting. Complete code in Azuro Analysis. No competitor has this. | 1-2 weeks | Phase 4 |
| 28 | **Physical NFC cards** | VC Analysis #4 suggested physical-to-digital bridge. Conference marketing tool. | 2-4 weeks | Phase 4 |

---

## IMPLEMENTATION TIMELINE

```
WEEK 1 (Tier 1 + Tier 2 Start)
├── Day 1-2: Fix presentation fee (1.88%), clarify 40%, label v1.5, reconcile TAM
├── Day 3-4: Scaffold DutchAuction.sol + MarketFactory.sol
├── Day 5: Deploy to Arbitrum Sepolia, add CI/CD pipeline
└── Weekend: Port risk analysis framework, update VC hotsheet

WEEK 2 (Tier 2 Complete + Tier 3 Start)
├── Day 1-2: Build ChaosMeter widget + integrate Privy auth
├── Day 3-4: Define Scandal Scraper architecture + scaffold OracleIntegration.sol
├── Day 5: Port neuroscience TypeScript modules to codebase
└── Weekend: Add unit economics to hotsheet, file provisional patent (engage counsel)

WEEK 3-4 (Tier 3 Complete + Tier 4 Start)
├── Create mobile PWA
├── Build creator market tools + pilot with 3-5 influencers
├── Scaffold SagaController.sol
├── Launch "Influencer Vig" beta experiment
└── Build Telegram Mini App prototype

MONTH 2 (Tier 4)
├── Execute remaining GTM experiments
├── Morpho Blue integration
├── FactionWars.sol + parlay mechanics
├── Gossip site embed widget
└── Physical NFC card design
```

---

## SUCCESS METRICS

After completing Tiers 1-3 (2 weeks), the project should have:
- Zero data inconsistencies across all documents
- 4 new smart contracts scaffolded (DutchAuction, MarketFactory, OracleIntegration, SagaController)
- Live testnet deployment with verified contract addresses
- CI/CD pipeline with passing tests
- Privy auth integrated (email/social → wallet)
- ChaosMeter widget demo-ready
- Provisional patent filed
- Customer unit economics in VC hotsheet
- Neuroscience modules in codebase

This transforms the project from "compelling whitepaper" to "working prototype with IP protection" — the threshold for a credible $1M-$2M seed round in the current market where Kalshi just raised at $22B.

---

*Synthesized from: 17 source documents, 11 competitor analyses (Polymarket, Kalshi, DraftKings, PredictIt, Pump.Fun, Limitless, Augur, Hedgehog, Zeitgeist, SanR, Stake.com + 5 new entrants), 4 independent VC stress tests, and the complete live presentation.*
