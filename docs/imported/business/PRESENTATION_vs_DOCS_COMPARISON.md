# PRESENTATION vs DOCUMENTS — DETAILED COMPARISON & SUGGESTIONS
## Findings from Cross-Referencing 13 Source Documents Against Live Presentation
> Live Presentation: https://the-mdc.github.io/MADHATs-Gambit-Presentation/
> Date: March 20, 2026

---

## TOKENOMICS DIFFERENCES

| # | Item | Presentation Says | Documents Say | Severity | Suggestion |
|---|------|------------------|---------------|----------|------------|
| T1 | **Platform Fee** | 1.88% (in corrected canonical, but older HTML may still show 2.88%) | Tokenomics Doc: 2.88% (pre-correction). CANONICAL_NUMBERS: 1.88% | 🔴 | **Update the presentation HTML to show 1.88% everywhere.** Verify the live presentation CTA and fee slides match 1.88%. |
| T2 | **Community Profit Share** | Shown as "28%" in presentation | Tokenomics Doc: 28.8% precisely | 🟡 | **Acceptable rounding for presentation.** Keep 28% in deck, 28.8% in technical docs. Document this as intentional. |
| T3 | **40% Creator Share** | Presentation shows "40% Lifetime OnChain" in creator section | WhitePaper v1.8 references "40% Community Revenue Share" broadly | 🔴 | **Clarify in whitepaper that 40% is ONLY for creator-made markets to creators.** The whitepaper's "40% community revenue share" language is misleading — it implies all users get 40%. |
| T4 | **Shield % display** | Presentation says "28%" (rounded) | Some older sections of WhitePaper v1.8 say "40%" or even "60%" TeaBag | 🔴 | **Already corrected in CANONICAL_NUMBERS.md.** But the WhitePaper v1.8 extraction still contains older draft figures. Add a prominent watermark/header to the whitepaper extraction. |
| T5 | **Revenue Y3 figure** | $154.5M (Base Case Bull) on VC hotsheet | Tokenomics Doc midpoint: $121.4M. Conservative: $62.5M | 🟡 | **Add scenario label to every revenue reference.** The $154.5M headline is defensible as "bull case" but VCs will push for the midpoint. Prepare to defend both. |
| T6 | **DeFi yield source** | Presentation references "Lido/Aave integration on idle treasury" | No Lido/Aave integration exists in contracts or dev scope | 🟡 | **Add to Phase 2 dev scope:** Integrate Morpho Blue (already referenced in Azuro analysis) or Aave V3 on Arbitrum for idle treasury yield. Or remove from presentation until built. |
| T7 | **"4.88% platform fee"** | NOT in current presentation | WhitePaper v1.8 (older sections) references 4.88% extensively | 🔴 | **This is a legacy figure from earlier drafts.** Already flagged in CANONICAL_NUMBERS.md as superseded. The full whitepaper extraction needs the header warning prominently displayed. |

---

## PRODUCT SHEET DIFFERENCES

| # | Item | Presentation Says | Documents Say | Severity | Suggestion |
|---|------|------------------|---------------|----------|------------|
| P1 | **Scandal Scraper AI** | Referenced in presentation (#scandal-scraper) | No implementation exists in any codebase or dev scope sprint | 🟡 | **Add to Phase 2 dev scope Sprint 1.** Define: data sources (Reuters/AP/X API), NLP model, market proposal pipeline, human review queue. CPS WebScraper.tsx could be adapted as starting point. |
| P2 | **AI Agent Arena** | Referenced in presentation (AI Agent section) | Bible defines 3 tiers (Basic/Degen/MADHATTER) but no code | 🟡 | **Add to Phase 3 dev scope.** Define: agent framework (LangChain/AutoGPT), subscription billing, copy trading mechanics, signal generation pipeline. |
| P3 | **Faction Wars (8 factions)** | Presentation shows faction tags on cards, faction leaderboards | No FactionWars.sol or backend service exists | 🟡 | **Add FactionWars.sol to P2 contracts.** Define: faction assignment on mint, cross-faction card mechanics, faction leaderboard API endpoint, seasonal faction rewards. |
| P4 | **Dutch Auction** | Presentation has dedicated #dutch-markets section | No DutchAuction.sol exists | 🔴 | **Add DutchAuction.sol to P0 contracts.** This is core to the weekly Scandal Pack drop mechanic — the primary NFT distribution mechanism. Without it, the COLLECT step of the core loop is broken. |
| P5 | **Saga System** | Presentation has #sagas-tab with 90-day seasons | No SagaController.sol or backend service | 🟡 | **Add to Phase 2.** Define: season creation, 3 Acts per season, themed market templates, progression XP, seasonal rewards distribution. |
| P6 | **ChaosMeter** | Prominently featured in presentation UI | No backend service or data pipeline defined | 🟡 | **Add to Phase 1 frontend.** It's a real-time aggregation widget — can be built as a Redis pub/sub consumer displaying market velocity metrics. Low effort, high visual impact. |
| P7 | **FHE Privacy (Zama)** | NOT in presentation | Azuro Analysis contains full Zama fhEVM integration code | 🟢 | **Good Phase 2 differentiator.** Keep as planned. The Azuro Analysis has verified Arbitrum-compatible code samples. Reference in updated dev scope. |
| P8 | **Privy Auth** | NOT explicitly in presentation | Azuro Analysis has complete Privy + wagmi integration code | 🟢 | **Include in Phase 1 Sprint 4 (Frontend).** The code is ready — layout.tsx and MadWallet.tsx from Azuro Analysis are production-ready. |
| P9 | **Mobile App** | Presentation roadmap shows Q3 2026 "Mobile" | No mobile dev scope exists anywhere | 🟡 | **Create mobile scope document.** Define: React Native vs Flutter vs PWA decision, feature parity with web, push notifications, biometric login. Kalshi/DraftKings have polished apps — this is table stakes. |
| P10 | **Data Monetization** | NOT in presentation | Data Management scope doc (Dec 2024) describes Cultural API | 🟢 | **Future feature.** Keep in long-term roadmap but don't add to presentation until closer to implementation. The VC stress-test "Cultural API" suggestion validates this direction. |

---

## DEV SCOPE DIFFERENCES

| # | Item | Presentation Says | Documents Say | Severity | Suggestion |
|---|------|------------------|---------------|----------|------------|
| D1 | **Hardhat vs Foundry** | Not specified | Azuro Analysis uses Hardhat. Existing contracts use Foundry. | 🟡 | **Standardize on Foundry** (faster compilation, native fuzzing, better Solidity testing). The Hardhat deployment script from Azuro Analysis should be ported to Foundry scripts. |
| D2 | **Morpho Blue integration** | Presentation references "DeFi yield" for Shield | EVM Guide describes detailed Morpho Blue adapter for StakingPool | 🟡 | **Add Morpho Blue integration to Phase 2 Sprint 2.** The EVM Guide has the architecture: StakingPool.sol acts as Morpho Blue Adapter, managing deposits/withdrawals/yield harvesting. This makes the Shield self-funding. |
| D3 | **TheGraph indexer** | Not in presentation | Azuro Analysis specifies TheGraph subgraph for market/card indexing | 🟡 | **Add to Phase 1 Sprint 5 (Integration).** Essential for frontend to query on-chain events efficiently. Define: schema (markets, bets, cards, staking), deployment to Arbitrum subgraph. |
| D4 | **Azuro Protocol evaluation** | Not in presentation | Azuro Analysis provides exhaustive comparison — recommends custom build but evaluate for expansion | 🟢 | **Document as "Evaluated, Custom Chosen."** Azuro's shared liquidity is powerful but would reduce MAD Gambit's differentiation. Keep as potential Phase 4 integration for sports/generic markets. |
| D5 | **CI/CD pipeline** | Not in presentation | Bible references GitHub Actions but no workflow exists in .github/ | 🔴 | **Add immediately.** Create: `.github/workflows/test.yml` with Foundry `forge test`, Slither static analysis, and coverage report. This is engineering hygiene — VCs check for it. |
| D6 | **Testnet deployment** | Not in presentation (no live contracts) | Envazia Agreement targets "functional testnet on Base Sepolia or Arbitrum Sepolia" | 🔴 | **Deploy to testnet ASAP.** The Azuro Analysis has verified Arbitrum Sepolia addresses and a complete deployment script. Zero deployed contracts is the #1 VC weakness. |
| D7 | **GenAI Methodology** | Not in presentation | Nick's GenAI Methodology doc (Dec 2025) describes pitchdeck→productsheet→devscope→promptguide pipeline | 🟢 | **This is your personal IP.** The methodology doc should be preserved as a reference in 04-technical-specs/ but is not a platform feature. Interesting for advisor/consulting positioning. |

---

## SUMMARY: CRITICAL ACTIONS

### Must Fix Before Next VC Meeting (P0)
1. **T1:** Verify live presentation shows 1.88% fee (not 2.88%)
2. **T3:** Clarify 40% is creator markets only — update whitepaper language
3. **P4:** Scaffold DutchAuction.sol (core loop dependency)
4. **D5:** Add CI/CD pipeline (.github/workflows/test.yml)
5. **D6:** Deploy contracts to Arbitrum Sepolia testnet

### Should Fix Within 2 Weeks (P1)
6. **T6:** Define DeFi yield integration (Morpho Blue or remove claim)
7. **P1:** Define Scandal Scraper AI architecture
8. **P6:** Build ChaosMeter widget (low effort, high impact)
9. **P8:** Integrate Privy auth (code ready from Azuro Analysis)
10. **D3:** Deploy TheGraph subgraph

### Future Roadmap (P2)
11. **P2:** AI Agent Arena architecture
12. **P3:** FactionWars.sol
13. **P5:** SagaController.sol
14. **P7:** FHE privacy integration
15. **P9:** Mobile app scope document

---

*This comparison was generated from exhaustive analysis of: Development Bible, Envazia Agreement, EVM Implementation Guide, Azuro/PredictOS Deep Analysis, 47K Dev Scope, WhitePaper v1.8, Tokenomics Document vFinal, Website Scope, GenAI Methodology, GAP Analysis Build3 vs Builds 1&2, Data Monetization Scope, Shooting Holes in My Thesis, and the live Presentation HTML.*

---

## ADDITIONAL FINDINGS (Deep Sweep Round 2)

### NEW DOCUMENTS DISCOVERED

| Document | Key Content | In Presentation? | Action |
|----------|------------|------------------|--------|
| Customer Segments (Oct 2025, updated Mar 2026) | 4 segments with ARPU, CAC, regional data | ⚠️ Partially — segments referenced but numbers not shown | Add to VC data room as standalone doc |
| Neuroscience Systems Summary (Oct 2025) | 6 TypeScript modules with production code | ⚠️ Concepts in presentation (ChaosMeter, etc.) but code not integrated | Integrate into Phase 1 frontend sprint |
| Tokenomics In Detail v1.0 (Nov 2024) | ORIGINAL tokenomics: 1B supply, ERC-1155, Base L2, 888/222 model | 🔴 SUPERSEDED — but contains risk analysis framework still valid | Extract risk analysis, deprecate old numbers |
| Shooting Holes in My Thesis (Feb-Mar 2026) | 4 independent VC analyses (3 PASS, 1 FAIL) | ❌ Not in presentation | Add key metrics to VC hotsheet |

### TOKENOMICS: ORIGINAL vs CURRENT

| Parameter | v1.0 (Nov 2024) | vFinal (Mar 2026) | Delta | Suggestion |
|-----------|-----------------|-------------------|-------|------------|
| Supply | 1,000,000,000 | 888,888,888 | -11.1% | ✅ Good — culturally significant, scarcity narrative |
| Standard | ERC-1155 | ERC-20 + Permit | Changed | ✅ Good — separated fungible from NFT |
| Chain | Base L2 | Arbitrum Nova/One | Changed | ✅ Good — better DeFi ecosystem |
| Fee | 2-5% variable | 1.88% flat | Simplified | ✅ Good — competitive vs Kalshi 1.2% |
| Shield | 40-60% | 28.8% | Reduced | ✅ Good — actuarially sustainable |
| Distribution | 35/25/15/10/10/5 (6 buckets) | 45/15/15/15/10 (5 buckets) | Simplified | ✅ Good — community-first |
| Revenue to treasury | 40% | 35% ops + 25% shield + 30% community + 10% burn | Restructured | ✅ Good — transparent allocation |
| Buyback model | 15% of revenue → slow burn | 10% of fee → direct burn + evolution burns | Changed | ✅ Good — multiple burn vectors |
| Governance | Quadratic (same) | Quadratic (same) | Same | ✅ Consistent |

**Key Finding:** The v1.0 risk analysis framework (market risks, governance risks, technical risks, regulatory risks) is MORE comprehensive than what's in the current tokenomics doc. **Suggestion:** Port the risk analysis tables from v1.0 into the vFinal tokenomics doc.

### PRODUCT SHEET: NEWLY DISCOVERED GAPS

| # | Item | In Docs | In Presentation | Suggestion |
|---|------|---------|----------------|------------|
| P11 | **Customer segment ARPU data** | ✅ $100+ (Gen Z), $30-50 (Gen X) | ❌ Not shown | Add to VC hotsheet — VCs will ask for unit economics |
| P12 | **Neuro TypeScript modules** | ✅ 6 production-ready modules | ⚠️ Concepts only | Include in Phase 1 Sprint 4 frontend integration |
| P13 | **"Cultural API" embed concept** | ✅ VC stress test recommends it | ❌ Not in presentation | Add to roadmap as Phase 3 — this is the 10x play |
| P14 | **AI Agent Leagues (bots compete)** | ✅ VC analysis #4 suggests this | ⚠️ AI Agent Arena referenced | Expand AI Arena to include bot-vs-bot leagues |
| P15 | **Physical NFC cards** | ✅ VC analysis #4 suggests it | ❌ Not in presentation | Consider as Phase 4 physical-to-digital bridge |

### DEV SCOPE: NEWLY DISCOVERED GAPS

| # | Item | In Docs | In Presentation | Suggestion |
|---|------|---------|----------------|------------|
| D8 | **Neuroscience hook (useNeuroscience)** | ✅ Full TypeScript code | ❌ No code integrated | Port to frontend codebase in Phase 1 |
| D9 | **Customer acquisition funnel by segment** | ✅ 4 segment-specific flows | ❌ Only generic GTM phases | Add segment-specific onboarding to dev scope |
| D10 | **GTM experiments from VC stress test** | ✅ 12 experiments defined | ❌ Not in presentation | Execute top 3 experiments pre-TGE |
| D11 | **Original v1.0 governance model** | ✅ Detailed QV + timelock + multisig | ⚠️ QV referenced but no timelock/multisig detail | Add timelock and multisig specs to QuadraticVoting.sol scope |

---

## UPDATED PRIORITY SUMMARY

### P0 — Before Next VC Meeting
1. Verify live presentation shows 1.88% (not 2.88%)
2. Scaffold DutchAuction.sol (core loop dependency)
3. Deploy to Arbitrum Sepolia testnet
4. Add CI/CD pipeline
5. **NEW:** Port v1.0 risk analysis framework to current tokenomics

### P1 — Within 2 Weeks
6. Integrate Privy auth (code ready)
7. Build ChaosMeter widget
8. Define Scandal Scraper architecture
9. **NEW:** Add customer segment ARPU data to VC hotsheet
10. **NEW:** Integrate neuroscience TypeScript modules into frontend

### P2 — Within 1 Month
11. Execute top 3 GTM experiments from stress test
12. FactionWars.sol + SagaController.sol
13. Mobile app scope document
14. **NEW:** Build "Cultural API" embed widget prototype
15. **NEW:** Expand AI Arena to include bot leagues

---

*Total documents analyzed: 17 (Dev Bible, Envazia Agreement, EVM Guide, Azuro Analysis, 47K Dev Scope, WhitePaper v1.8, Tokenomics vFinal, Tokenomics v1.0, Website Scope, GenAI Methodology, GAP Analysis, Data Monetization Scope, Customer Segments, Neuroscience Systems, Shooting Holes in My Thesis, MAD Upshot Game Outline, Presentation HTML)*
