# MAD Gambit — Master Coding Action Plan & Chronological Progression

> Source-of-truth planning doc synthesized from the Grok/AI conversation export (recovered from Drive), the `MADGit` Drive folder, the live repos, and the investor materials. Grounded in real artifacts — see the hallucination log (Part B2) for what was fabricated and must be distrusted.

## Context

Collate the MAD Gambit AI-session history into a **chronological progression**, separate signal from a **week of hallucinations** (chiefly Grok's), and produce a complete, phased **coding action plan**.

**Source access reality (verified):**
- Grok project link → **403** (authenticated; unfetchable).
- The 3 attached `.zip` files → **empty** (folder markers only).
- Google Drive (`MADGit` + docs) → **mined fully**.
- 8 cloned repos → **ground-truthed by direct inspection**.
- Grok conversation history → **recovered from Drive**: `MADGit/For Claude` is a full Grok/X account export; `64e784 d` (36) + `64e784  b` (47) hold the conversations (a mix of Grok, Claude, "Claude Fable"). The `64e784a1-…` account/PII sub-export (login IPs, sessions, birth date) was **deliberately not opened**; two ~4.8 MB canonical whitepapers inside it were left unread.

**Working defaults (override any):** (1) deliverable = this doc; (2) keep & extend the current stack (Viem + custom SIWE + Neon via raw `pg`), treat wagmi/RainbowKit as optional and Drizzle as deferred (persistence + hosting settled on Neon + Vercel); (3) Phase 1 = Outlier Ventures demo polish; (4) theme = gold + neon-ink hybrid.

---

## PART A — Reconciled Canonical Facts (single source of truth)

| Fact | Canonical value | Conflict to fix |
|---|---|---|
| Platform fee | **1.88%** (`FEE_BPS 188`) | Deck shows `1.888%` (10 hits) → fix |
| Community profit share | **28.8%** (`COMMUNITY_SHARE_BPS 2880`) | of **net profit, platform-wide** |
| Creator revenue share | **40%** (`CREATOR_SHARE_BPS 4000`) | **per-market gross**, creator-made markets only |
| $MADx supply | **888,888,888** fixed (EVM/SOL hybrid) | MAD Upshot's "$MAD 1 B ERC-20" is retired |
| Seed ask | **$1.24M–$2.48M @ $12M pre** | `CLAUDE.md` stale ($1–2M); deck partly stale |
| Y3 gross revenue | **pick ONE** | Deck has $154.5M / $121.4M / $86–154M |
| Golden Genesis Founders NFT | **2,488** | (the old "888" was a different product's number) |
| Card rarity | Common 88 → Mythic **99,999 (1-of-1)** | 7 tiers (see Part E) |
| MAD Shield recovery | **28.8%** (premium 2–4% of bet) | — |
| Primary chain | **Arbitrum Nova `42170`** + One `42161` + Sepolia `421614` | `foundry.toml` + SIWE bind Nova; "Base L2" skill note is **wrong** |
| Brand | **"MAD Gambit"** (platform) | Deck mixes "MADHAT's Gambit" |
| Design | **Gold-chisel chrome + INK neon** (cyan `#00e5ff`, pink `#ff007f`, gold `#ffd700`) | "Vercel production is the locked design baseline" |

> **Revenue-split nuance — do NOT stack these:** 40% creator (per-market gross) and 28.8% community (of net platform profit) are **non-additive by design** (`beta.html` spec). Never wire governance to `FEE_BPS` / `CREATOR_SHARE_BPS`.

---

## PART B — Chronological Progression

**Stage 1 — "MAD Upshot" (Ethereum era, ~Feb–spring 2026).** Satirical NFT-card prediction market. Ethereum + Polygon/Base; **$MAD ERC-20, 1 Billion**; ERC-721 "Scandal Packs" (10K drops, evolve/degenerate); Chainlink + news/X oracles; Uniswap/Aave/Zora. "The Great Unraveling" saga; 50+ degenerate cards. Seed drifted $1M@12% ↔ $2M@20%. Teased "personal tokenized smart agents." Feb-2026 `OV-Final.pdf` introduced the 5-stream model, $154.5M Y3, 750K DAU, LTV $1,440 / CAC $20–50, 94% Monte-Carlo-positive.

**Stage 2 — legal + rebrand (Mar 2026).** **MAD Gambit LLC, New Mexico, filed March 25, 2026.** MADHAT's Gambit → MAD Gambit; "card game" → "entertainment-first prediction-conviction market" on Arbitrum; token → **$MADx, fixed 888,888,888**.

**Stage 3 — conviction-market math (by Jul 13).** MAD HAT Math Spec v1.0: **MADConv** conviction, **GARCH(1,1)**, **Liar Meter / Lie Impact**, **non-binary CIRO markets** (Continuous DL-LMSR + Over/Under), **Conviction Saga** rolling legs. (Part E.)

**Stage 4 — the build `MAD-MPP-2.23` (early–mid Jul).** App in `verify/`, Next.js, deployed `mpp223-madgambit.vercel.app`. Canonical constants in `gambit-game-math.ts`. Contracts: MADCard1155/721, MADShieldVault (+test), FounderRegistry. New: triple-mode 3D live-ticker, dashboard suite, Information Market + Warehouse + CDP on Postgres, futarchy-board / seiko-dopamine-hub, main-nav / bottom-nav, quadratic-DAO + Futarchy exploration. Since the stale handoffs: Next 15→16, SIWE wired, MADShieldVault written + tested, concierge → live Gemini, AI moved FastAPI → Next routes.

**Stage 5 — parallel deliverables (Jul 10–13).** "Claude Fable" shipped `beta.html` (Jul 10). Grok's Thread Summary (Jul 13) declared staking + dashboards complete (false — Part B2). Agents in play: Antigravity, Fable, Claude, Grok. Deck at `the-mdc.github.io/MADHATs-Gambit-Presentation/`; domains kept off Vercel (Hobby ToS). HEAD `2308d09` on `claude/mad-gambit-enhancement-timeline-zdnx47`.

---

## PART B2 — Grok / AI Hallucination Log (distrust & verify)

The export mixes assistants: **Grok** made the "it's built" claims; the **Claude** sessions were the reliable auditors. Guard against *fabricated completion.*

**Grok "Super Grok" Thread Summary (Jul 13):**
- ❌ "`MADStaking.sol` complete + full Foundry fuzz-test suite (`MADStaking.t.sol`, 12+ tests), **Completed**." → **28-byte stub; does not compile.** *The central lie.*
- ❌ On-chain `P2PEscrowMarket.sol` exists. → **Invented.**
- ❌ Mis-stated the persistence layer. → **Neon Postgres on Vercel (raw `pg` for now; Drizzle deferred).**
- ❌ "Next.js 14+." → **Next.js 16.**

**Cross-document contradictions:** chain (Ethereum+Base vs 5-chain deck vs Arbitrum-only foundry → canonical **Nova + One, not Base**); token ($MAD 1 B → **$MADx 888,888,888**); seed ($1M/$2M → **$1.24M–$2.48M @ $12M**).

**Deck fabrications (caught by Claude, Jul 5):** phantom co-founders (Isabella H., Parphul B. — not on LLC filing; only Carlo Fernandez Benedetto is); Y3 revenue disagrees with itself ($154.5M/$121.4M/$86–154M); 3 pack-pricing formulas; founder NFT "2,488" vs "888"; `futarchy-board.tsx` demo "creator fee 42%" (locked 40%); `ov-pitch-deck.html` buried $2.888M/30% pitch + cap table → **patch/keep OV decks, don't delete**.

**Phantom "built" claims:** Antigravity's `middleware.ts` host-router (no such file); prod ran retired `gemini-1.5-pro` while the fix sat undeployed (now resolved: `gemini-flash-latest`).

**⚠️ Compliance:** scrub "dopamine engineering / VRS / anticipation circuits / novelty-seeking" from any doc that leaves the machine — keep the mechanic, cut the neuroscience framing (MAD Shield is marketed as loss-protection → regulatory exposure).

---

## PART C — Current-State Inventory (`MAD-MPP-2.23`)

App in **`verify/`** (root `next.config.mjs` broken stub; second `/app/` `octavian-*` orphaned — ignore both).

- **Stack:** Next.js `16.2.9` · React `19.2.1` · App Router · Tailwind v4 · npm.
- **Web3:** `viem` + `siwe`. No wagmi/RainbowKit/ethers.
- **DB:** Neon Postgres via `pg` (node-postgres) + `pgvector`. *(`drizzle-orm` is installed but unused — Drizzle deferred.)*
- **AI:** `@langchain/google-genai` (`gemini-flash-latest`) + `langgraph`. Also three/r3f, recharts, rss-parser, redux-toolkit, framer-motion.
- **Routes:** `/`, `/gambit` (7-tab: floor/saga/arena/packs/portal/casino/logic), `/workbench`. API: `concierge/chat`, `satire-engine`, `v1/auth/{nonce,verify}`, `v1/agents/{scraper,trader}`, `v1/cards[/open-pack]`, `v1/feeds`, `v1/lobby`, `v1/madhatr/zliar`, `v1/mpp/{profiles,simulate}`, `v1/tournament/match`.
- **Math (`verify/lib/`):** `gambit-game-math.ts` (canonical constants confirmed), `mpp-math.ts`, `gambit-design-tokens.ts` (INK/GOLD_CHISEL). `bayesian-logic.ts` **missing**.
- **Contracts (`contracts/src/`, Foundry solc 0.8.24):** MADCard1155, MADCard721, MADShieldVault, FounderRegistry + tests + MockMADx. Chains Nova/One/Sepolia.
- **SIWE:** real crypto verify (`lib/siwe-verify.ts`, single-use nonce, Nova binding, httpOnly cookie).

**Open backlog:** `MADStaking` + escrow set (stubs); session cookie = plaintext (not signed JWT), nonce in-memory; design tokens 17/44 (`#ec4899` in 10, `seiko-dopamine-hub` local palette); Seiko **flip**-clock (digital only); `bayesian-logic.ts`; `.env.example` inconsistent; deck reconciliation; `mad-gambit-core` empty scaffold.

---

## PART D — Feature → Code Map

| Utility | Status | Home / to build |
|---|---|---|
| NFT card game (packs, Dutch auction, evolution, 8 factions, 992 deck, Mythic 1-of-1) | Partial | `MADCard1155/721`, `pack-shop/opening`, `dutch-auction-panel`; needs `DutchAuction.sol`, `MarketFactory.sol` |
| Perps for Convictions (non-binary CIRO markets) | Partial | `gambit-game-math`, `conviction-charts`; needs settlement contract |
| Predictions + Liar Meter | ✅ core | `zliar-meter`, `zLiarMeter()`, `satire-engine` |
| DeFi dashboards (staking, Dutch auction, micro-loans) | Partial | `staking-tiers-panel`; needs `MADStaking.sol` + micro-loan contract |
| DAO interface, voting (quadratic + Futarchy) | Partial | `futarchy-board`, `quadraticMatch()`; needs governance contract |
| UGC (anyone creates a market, 40% creator) | Partial | `market-factory`; needs `MarketFactory.sol` |
| RSS + scrapers → MEME Headlines Engine (MAD Mag / South Park) | ✅ v1 | `satire-engine`, `rss-feeds.ts`, `v1/agents/scraper` → full Scandal Scraper AI |
| MADHATr Agent Swarm (Sentinel/Strategist/Decay/Concierge/Challenger) | Partial | `madhatr-concierge`; build other tiers |
| Data platform (Information Market + Warehouse + CDP) | Partial | Postgres (raw `pg`); formalize `data-platform/` |
| MAD Shield (28.8% recovery) | ✅ | `MADShieldVault.sol`, `shieldPhiRatio()` |
| Golden Hand Casino | UI only | `casino-panel`; needs Chainlink VRF contract |
| MADFORGE MoonPad (launchpad + quadratic funding) | Not started | new workstream |

---

## PART E — Math Canon (verify vs `gambit-game-math.ts`; implement gaps)

Most already in TS (`calculateConviction` Cobb-Douglas, `garchUpdate`, `zLiarMeter`, DL-LMSR, Kelly, EigenTrust). Jul-13 Math Spec = acceptance reference.

- **MADConv:** `t^1.35 · c^0.75 · d^1.45 · ψ^1.15 · (1+π^0.9) · m_meme · satire · liar · garch_amp`.
- **GARCH(1,1):** `σ²ₜ = ω + α·ε²ₜ₋₁ + β·σ²ₜ₋₁` (ω=0.0001, α=0.05, β=0.90); `garch_amp = 1+0.8σ`; `0.09 ≤ σ ≤ 0.68`.
- **Liar Meter:** `LieScore(0–100)=Σ wᵢ·(LinguisticDeception, ContextualContradiction, SentimentShift, VocalAnomaly)`; `LieImpact = LieScore × EconMult × ψ_agg × VolAmp`.
- **Non-binary CIRO markets only:** Continuous (DL-LMSR) + Over/Under; legs 45–90 days, never <30. *(Reconcile deck "Binary/PvP" — confirm binary is out.)*
- **Conviction Saga:** master narrative; rolling legs auto-launch on resolution; MADConv persists/compounds.
- **Rarity:** Common 88/1.1×/12% · Uncommon 256/1.8×/16% · Rare 488/2.4×/22% · Epic 1,888/3.2×/31% · Legendary 4,888/5.5×/48% · Golden Hand 7,888/8.8×/68% · **Mythic 99,999/99.9×/88% (1-of-1)**.
- **Streaks:** 3→1.3× · 5→1.8×+free pack · 7→2.4×+savage · 10+→3.2×+HAT-trick. **Dutch:** 0.5→0.05 ETH. **Tournament:** 40/20/12/5×2/2×5.

---

## PART F — Step-by-Step Coding Action Plan (phased)

### Phase 0 — Reconciliation & hygiene *(first; near-zero risk)*
Fix `CLAUDE.md` seed → `$1.24M–$2.48M`; fix chain skill note → Nova; pick ONE Y3 figure everywhere. Deck (`madhats-gambit.html`): `1.888%→1.88%`, normalize branding, remove phantom co-founders, single Y3, "888"→2,488 (MAD Gambit Golden Genesis Founders NFT) — **patch OV decks, don't delete**. Rewrite `verify/.env.example`. Decide `mad-gambit-core` (recommend archive).
- **DoD:** every canonical number identical across repo + deck + skills; `.env.example` matches code; no fabricated team.

### Phase 1 — Outlier Ventures demo polish
Design-token sweep (27 components → import tokens; kill 10 `#ec4899`; `seiko-dopamine-hub` imports `INK`). Seiko **flip-clock** (split-flap `rotateX`, reduced-motion). Hub polish to mockups; scrub dopamine/VRS language. Redeploy `mpp2.23` from HEAD.
- **DoD:** single-file theme swap; no addiction language; prod on current commit; deck numbers match canon.

### Phase 2 — Security & auth hardening
Signed **JWT** session (address+exp+chainId), verified per route. Durable **nonce store** (Redis/KV). Rate limits. `security-review` skill.
- **DoD:** tamper-evident sessions; multi-instance nonce; security skill green.

### Phase 3 — Smart contracts → Nova testnet
`MADStaking.sol` (from `STAKING_TIERS`, 12–68% APY, no printing). `MarketFactory.sol` (40% creator) + `DutchAuction.sol`. Non-binary settlement (Continuous/Over-Under, DL-LMSR + GARCH). Promote escrow/referral/session-key stubs (or ticket). Foundry tests (fuzz 1000/invariant) + skills. Deploy Nova Sepolia; Viem reads.
- **DoD:** compile in `src/`, ≥90% coverage, on Nova testnet, addresses in frontend config. *(Closes the Grok "staking is done" lie.)*

### Phase 4 — 5-Stream Revenue Engine
(1) Prediction Markets (settlement, Shield opt-in, creator payout via `splitFee`) → (2) Golden Hand Casino (Chainlink VRF) → (3) Marketplace+ (secondary, micro-loans, SOL/EVM bridge) → (4) MADFORGE MoonPad (launchpad + quadratic funding) → (5) MADDAO Staking (real yield; quadratic DAO + Futarchy).
- **DoD:** each = contract + API + UI tab + tests; fees via `splitFee()` (1.88% / 40% / 25% burn).

### Phase 5 — AI / Agents & MEME Headlines Engine
LangGraph **Scandal Scraper** (RSS/social → 10K-mentions/hr → auto-draft market → review). **MADHATr Agent Swarm** (Sentinel/Strategist/Decay/Concierge/Challenger). `trader` triple-threat resolution. Formalize data platform (Information Market + Warehouse + CDP). Satire voice = MAD Magazine / South Park.
- **DoD:** scraper → reviewable market end-to-end; Liar Meter scores live; AI output sanitized.

### Phase 6 — Marketing site `madgambit.fun` *(separate Web2 app)*
Per `MADGambit_Website_Scope_v1`: Next.js + Tailwind + Framer Motion, no wallet, NextAuth on the app's Neon, Resend, subdomain provisioning, JWT handoff to `app.madgambit.io`. Override stock-neon with `INK`. Lighthouse >95, LCP <1.8s, bundle <100KB.
- **DoD:** landing + auth + profile + redirect; perf met; domains off Vercel Hobby.

### Phase 7 — Multi-chain expansion
Arbitrum One → HyperEVM → other EVMs → Solana. Per-chain configs, bridge, deploy scripts. After Nova mainnet.
- **DoD:** each chain has deploy script + network switch + tests.

---

## PART G — Multi-Model Tool Assignment

| Workstream | Tool | Model |
|---|---|---|
| Frontend UI/UX (flip-clock, hub, marketing site) | v0 by Vercel + Claude (+ Lovable optional) | Opus 4.8 |
| Web3 + smart contracts | Cursor / Claude Code | Opus 4.8 / Sonnet 5 |
| Backend (API routes, SQL, indexing) | Claude Code (Replit/Bolt scaffolds) | Sonnet 5 / Fable-5 |
| AI agents (scraper, LangGraph swarm, oracle) | Claude Code + `mad-gambit-ai-agents` skill | Opus 4.8 |
| Deck / investor materials | Claude Code + `investor-materials` skill | Opus 4.8 |

**Anti-hallucination rule:** no change is "done" without a file diff + a passing check. Never accept "it's built" — verify it compiles/tests.

---

## PART H — Verification & Definition of Done

- **Per PR:** `npm build` + `tsc` clean · `forge test` green for touched contracts · `security-review` on auth/value/contract changes · canonical-number grep · no new stock-neon literals.
- **Demo gate (P1):** `/gambit` matches mockups mobile+desktop; ticker 3-mode; concierge answers; deck reconciled.
- **Testnet gate (P3):** contracts on Nova Sepolia; frontend reads live addresses; no unsigned-value trust at auth boundary.

## PART I — Locked decisions

- **Stack (canonical):** GitHub + Vercel + Neon (Postgres, raw `pg` for now — Drizzle deferred) + custom SIWE. **Supabase is not in the stack.**
- **Y3 revenue → $154.5M** headline ($121.4M kept only as a labeled conservative base case).
- **Markets → non-binary only** (Continuous DL-LMSR + Over/Under); binary is out.
- **Chain → Arbitrum Nova (42170) launch/gameplay · One (42161) Shield vaults + $MADx · Sepolia (421614) testnet; HyperEVM then all EVMs planned.**
- **`mad-gambit-core` → archive** (monolith stays in `MAD-MPP-2.23`).
- **wagmi/RainbowKit → defer** in favor of the Two-Tier Auth path (Part J-C); keep viem + SIWE through Phase 1.
- **Team → Nick McLeod (Founder/CEO) · Carlo Fernandez (Co-Founder/COO) · Zena Shah (Co-Founder, Head of Economics & Governance).**

---

## PART J — Build detail ingested from the prior audit + plan docs

*Merged from `MAD_GAMBIT_MASTER_PLAN`, `MADBIT_PRECISION_INTEGRATION_PLAN`, `MAD_GAMBIT_INTEGRATION_PLAN`, the `ULTRA_DASHBOARD`/`PHONE_LAYOUT` execution plans, `ANTIGRAVITY_HANDOFF`, `SESSION_HANDOFF`, `docs/VERCEL_PRODUCTION_AUDIT`, and the "MAD-MPP production review" Drive thread. The empty root `*_ARCHITECTURE/DEPLOYMENT/READINESS.md` stubs are captured here.*

### J0 — Critical reconciliation flags (resolve BEFORE building)
1. **`main`-overwrite incident (2026-07-15):** `main` was overwritten with ~48 placeholder files; the real 82-file app was recovered from `claude/mad-mpp-ci-cd-fixes-r0f76v`, keeping 3 newer files (`SeamlessWalletOnboarding.tsx`, `lib/data-platform/schemas.ts`, `lib/tags.ts`). Part C reflects the **post-recovery** `verify/`. Confirm the working branch descends from the recovery, not the placeholder push.
2. **AI-provider fork:** mainline = **Gemini** (`GOOGLE_API_KEY`, `gemini-flash-latest`, `@langchain/google-genai`) + **SIWE**. The placeholder branch carried **Grok xAI** (`XAI_API_KEY`) + **NextAuth/GitHub-OAuth** — the divergent variant (and the source of the stale `.env.example` cruft), not the target.
3. **Contracts live in a *different* repo:** `The-MDC/demo-repository` — see J-D.

### J-A — Reconciliation (Phase 0)
- **Tracked backlog "8 BACKEND_PLACEHOLDERS":** `TRI_AGENT_LLM · CARD_ART_PIPELINE · WALLET_NFT_READ · PROFILE_DB · PVP_MATCHMAKING · ORACLE · SAGA_FEED · FEED_EXPANSION` (+ SIWE enforcement + `MADStaking.sol`+tests). Version into `verify/docs/`.
- **Deck = remaining itemized fixes** (team/Y3 already done in PR #3): remaining `$1M–$2M` incl. **"THE ASK" slide 15/15**; one pack-pricing formula; founder tenure (pick 14/15/16+); fee `1.888%→1.88%` = **22 instances** across `index.html`+`madhats-gambit.html` (has derived `0.7552%` → careful multi-number pass).
- **OV deck (`ov-pitch-deck.html`): patch, never delete** — strip AI-Studio editor chrome; correct the buried **$2.888M/30%-equity (~$6.7M pre)** pitch + public cap table (McLeod 54.09% Class A / 65.3% voting, 32% Class B, 11.59% to DAO) to canonical.
- Canonical deck URL = `the-mdc.github.io/MADHATs-Gambit-Presentation/` (`maddegen.github.io` is stale).

### J-B — Demo polish / UI (Phase 1)
- **Build `carousel.tsx` primitive FIRST**, reuse ×4 (props `children/gap/snap/peek`, INK edge-fade, `aria-roledescription="carousel"`, reduced-motion→wrap).
- **Phone render order:** `LiveTicker → MainNav → SeikoHub(hero) → ZLiarSection → PackShop → MarketRails`. `pack-shop` uses `use-rip-sound.ts` (Web Audio rip synth — no binary asset).
- **Ticker triple-mode wiring:** Mode1 stocks/commodities (extend `KaitoPriceTicker`) · Mode2 RSS satire (`/api/v1/feeds`→`/api/satire-engine`, depends on redeploy) · Mode3 platform stats; double-tap cycles, `localStorage`-persisted, **marquee swaps content mid-scroll (never stops)**, reduced-motion→static.
- **Design-token refactor, worst-first:** `nft-card.tsx` (56 hex) → `positions-dashboard` (9) → `staking-tiers-panel` (9) → `tournament-arena` (8) → `casino-panel` (7) → remaining 21; ≈**339 raw-hex** total; screenshot-diff for byte-identical output; enables seasonal skins via `SKIN_TOKENS`.
- Parallax layer inside `DeviceFrame` (GPU transforms only; don't break `.mg-device` containing block); `joy-layer.celebrate()` + `navigator.vibrate` on reward beats; wire `roast-share.tsx` to resolution events.

### J-C — Security & Two-Tier Auth (Phase 2)
- **Two-Tier Auth (already prototyped):** Tier 1 social sign-in (Google/Apple/Telegram/Discord/Meta/Email) via `auth-modal.tsx` with smart interception on gated actions; Tier 2 `wallet-gateway.tsx` gates finance — `positions-dashboard` blurs P&L behind "Vault Locked" until wallet linked. **Rule: email/social first, wallet only to bet/earn.** Production path: **Privy.io** (embedded wallets + social) or NextAuth+RainbowKit.
- **Auth contracts:** `GET /api/v1/auth/nonce`→nonce; `POST /api/v1/auth/verify {message,signature}`→`{JWT, walletAddress}`.
- **PROFILE_DB:** 6-table Postgres schema, `migrations/001_initial_schema.sql` (shield state machine + card-wear fields); spec at `verify/docs/mpp-backend-architecture.md §3`.
- **Revoke the exposed `ghp_…` PAT** (reissue fine-grained); clear Dependabot alerts (esbuild/postcss in `verify`, OZ in `contracts/lib`); fix `next ^16` vs `eslint-config-next 15` mismatch.

### J-D — Smart contracts (Phase 3) — biggest gap
- **VERIFIED 2026-07-21 — the auction branch is GONE.** `The-MDC/demo-repository` has **no** `claude/complete-auction-contracts-23vLW` branch on remote (present: `The-MDC` default, `MADdegen-patch-1`, `add-badges-to-readme`, `claude/{add-plugins-feature,connect-supabase,connect-vercel,fix-vercel-deployment,handoff-package-review,port-mvp-files,remove-vercel-config}`). **`MarketFactory.sol` / `DutchAuction.sol` / `EvolutionEngine.sol` / `GambitAMM.sol` exist nowhere in the repo** → that work was **lost (never pushed) and must be rebuilt.**
- **A fuller Foundry monorepo DID survive** on the default branch at `05-smart-contracts/madhat-core/src/`: `prediction/BondingCurve.sol` (DL-LMSR — rebuild the auctions on top of this), `prediction/game.sol`, `errors/Errors.sol`, `registries/roles.sol` (RolesRegistry) + `assets.sol`, `tokens/{MADxToken,MADDEXToken,MadhatCard,MadhatCardOptimized}.sol`, `staking/StakingPool.sol`, `treasury/{MadhatTreasury,CommunityTreasury}.sol`, `insurance/RiskOracle.sol`, `script/DeployCoreContracts.s.sol`, `foundry.toml`, `test/`. **This is a fuller set than `MAD-MPP-2.23/contracts/`** (MADCard1155/721, MADShieldVault, FounderRegistry only). **DECISION NEEDED: which is the canonical contract source** — consolidate the two, then rebuild only MarketFactory + DutchAuction. (Original design intent: Solidity ^0.8.28, UUPS upgradeable, RolesRegistry access control, manual reentrancy guard, `Errors.sol` 77-error set.)
- `MADShieldVault.sol` = **verbatim TS→Solidity port** of `createShieldOptIn`/`requestShieldUnstake`/`calculateShieldPayoutFull` from `lib/gambit-game-math.ts` (done).
- **`MADStaking.sol` implements the canonical per-tier clout/APY table** (Part E) — **NOT** the MPP-2.0 `1.0 + Clout/200` formula; "no printing" of yield.
- `foundry.toml` needs `${ARBITRUM_ONE_RPC_URL}`, `${ARBISCAN_API_KEY}`; add DutchAuction+MarketFactory to `DeployCoreContracts.s.sol`.

### J-E — 5-Stream engine (Phase 4)
- **Y3 = $154.5M on $3.6B–$4.2B volume; stream split 51/31/12/6 = fees / NFT / staking / shield.**
- `market-factory.tsx` frontend already exists (The Floor tab; 6 categories, DL-LMSR pricing, creation-fee→treasury, 40% creator) — wire to deployed addresses.

### J-F — AI / agents (Phase 5)
- **LangGraph blueprint (founder-approved):** **Scandal Scraper** — Discovery Node (tabloids/crypto/Polymarket) → Reasoning Node (Gemini: entities + Scandal Velocity + Z-Liar) → **Vector Node → Postgres `pgvector`**. **Copy-Trading "Alpha Filter"** — Surveillance (Polymarket whales via **`clob-client`**) → Validation (query `pgvector`: does real news support the trade?) → Execution (sign via **CTF exchange contracts**).
- **MADHATr routing:** Host Core → Sentinel/Strategist/Decay via `AGENTS.md`; `GEMINI_SYSTEM_INSTRUCTION` is **verbatim from `GEMINI.md` — do not paraphrase**; Gemma-first for background (satirize/Z-Liar), Gemini fallback.
- **SuperGrok skills pack (in-repo, PR #14):** `.agents/skills/` — 11 skills (madhatr-concierge, mad-gambit-math, solidity-foundry-security, dopamine-ui-design-system, nft-card-pipeline, mad-shield-tokenomics, multi-agent-swarm, production-readiness-gate, scandal-corpus-graphrag, whitepaper-pr-gtm, brand-enforcer) + `SUPERGROK_GUARDRAILS_AND_SKILLS.md`.

### J-G — Data platform & product surfaces (Phase 5)
- **Files:** `lib/data-platform/{cdp,events,information-market,schemas,types}.ts`; routes `data/events`, `information-market/create`, `marketplace/assets`, `referrals/track`, `session-keys`; realtime `lib/realtime/{RealtimeProvider.tsx,useRealTimeMarket.ts}` + `api/realtime/ws`; panels `InformationMarketsPanel`, `UserIntelligencePanel` (CDP), `AgentSignalsPanel`, `LiveMetricCard`.
- **Product surfaces (on the divergent branch — confirm survival):** VIP Lounge (`app/vip`), Creator Hub (`app/creator`, Grok-assisted market form), UGC feed, P2P market+escrow UI (`P2PMarket*.tsx`) + **Behavioral Economics layer** (`P2PBehavioralEnhancements.tsx` — anchoring/decoy/social-proof/scarcity/regret), Referral Suite, Session Key Manager, `SeamlessWalletOnboarding.tsx`.
- **Telemetry surface:** `state-machine-view.tsx` (SCRAPER/TRADER graphs) + `gambit-instrument-cluster.tsx` (Z-Liar/Conviction/Scandal σ²), live/SIMULATED badges, from hamburger + Logic tab.

### J-H — Deployment / Ops (fills the empty stubs)
- **Vercel:** project **`mpp2.23`** · id **`prj_4IdDBNaVoeUWutoEGbCc2zyzYpc7`** · org **`team_TgoOJAiilwZ3I3LPyD2FcNZm`** · **Root Directory = `verify`** · `next.config.ts` `output:"standalone"` · region `iad1`. **Two projects exist** (`mad-mpp-2.23` + `mad-gambit-ui`) — pick one, pause the other.
- **Env vars (mainline):** `GOOGLE_API_KEY` (NOT `GEMINI_API_KEY`), `AUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`, `NEXT_PUBLIC_CHAIN_ID=42170`, `DATABASE_URL`; `ANTHROPIC_API_KEY` optional. Keep `FIREBASE_*`/`GOOGLE_SERVICES_JSON` (Android) OUT of Vercel. Automate via `docs/vercel/mpp-vercel-setup.ps1`.
- **Dashboard-only actions (API can't set):** Root Directory→`verify`; **clear the `cd verify && npm ci` install-command override** (caused `ERESOLVE`); framework-default build/output. The deploy-pipeline failure was a **stray Deployment Check gate (now removed)**, not build/env.
- **Green gate = the Vercel preview build** (`node_modules` isn't installed in web sessions → `tsc`/`next build` can't run locally). Branch discipline: fresh branch off `main` → draft PR → preview validates → merge; never push `main`.
- **Vercel Hobby/commercial risk** (LLC + raise) sits under the live app; **$20/mo Pro before any investor surface**; domains stay off Vercel.

### J-I — Math canon additions (extend Part E)
- **`RARITY_WEAR_PCT` = 2/2/10/11.5/13/14.5/16%** (per-tier durability loss); **`RARITY_DROP_WEIGHTS` = 568/236/120/60/10/6 per 1000**. Port to Solidity verbatim.
- **VRS Fibonacci [5,8,13,21,34]; loss-aversion 2.5×** (keep mechanic, scrub wording). **Evolution burn: C→U 100 / U→R 250 / R→E 500 / E→L 1000.**
- **Pack-pricing 3-way divergence is a real bug:** deck `4.88×(1+0.5·ln(1+n/1000))` cap $8.78 vs Drive Dutch `0.5→0.05 ETH` vs shipped flat `4.88`; also `SCANDAL_PACK_TIERS`/`scandalPackPrice()` (8-tier bonding curve, PR #5). Pick one; make code+deck+contract match.
- Preserve in the canon: `splitFee()` (1.88%/40%/25%-burn), `shieldPhiRatio`, `calculateDeltaLimit`, `SKIN_TOKENS` (HolographicGoldLaser/CyberOnyx/QuantumCobalt), `OV_DECKS`, Elomatic MMR (PvP), `calculateEigenTrustScore`. Shield defences: **Bayesian Anomaly Detection + Commit-Reveal Oracle + stress tests.**

### J-J — Financials
- **LTV $1,440 / CAC $20–50, 750K DAU Y3, 94%-positive Monte Carlo** (Feb OV brief). `DATA_HOUSE_FULL` = month-by-month 1–18 teaser (Month 1 = 8K users / $42K), Conservative/Base/Bull; drivers = MADConv retention 4.8× industry + GARCH premium + 888-raffle virality. Reissue the OV PDF's stale `$1M–$2M` ask → `$1.24M–$2.48M`.

### J-K — Suppress (never reintroduce)
$MAD 1B ERC-20 (→ $MADx 888,888,888) · 888-as-MAD-Gambit-founders (→ 2,488) · Y3 $121.4M / $86–154M (→ $154.5M) · creator fee 42% (→ 40%) · phantom co-founders Isabella H./Parphul B. · **Supabase** / Base-as-primary / the XAI+NextAuth env set · "dopamine / VRS / novelty-seeking" neuroscience framing in any external doc.

---

## PART K — demo-repository consolidation (v2.24 pull, 2026-07-21)

Pulled the P1/P2 value from `The-MDC/demo-repository` into this repo. The wider MDC monorepo stays on GitHub as source of record (only the local clone was removed). **None of the pulled contracts compile yet — this is a raw pull + safe canonical fixes; the checklist below is the integration work.**

**Pulled in:**
- **`contracts/madhat-core/`** — 16 Solidity contracts (`src/`), 6 Foundry tests, `DeployCoreContracts.s.sol`, `foundry.toml`, `remappings.txt`, ABIs, `DEPLOYED_ADDRESSES.md`, refactor/security docs. Highlights: `staking/StakingPool.sol` (fills the empty `MADStaking` stub), `prediction/game.sol` (pooled prediction market), `prediction/BondingCurve.sol` (DL-LMSR), `tokens/MADxToken.sol` (**$MADx — was absent from `contracts/src/`**), `insurance/RiskOracle.sol` (GARCH Shield premiums), `treasury/{Madhat,Community}Treasury.sol`, `registries/{roles,assets}.sol`, `errors/Errors.sol`.
- **`docs/imported/`** — specs (`MADHATS_DATABASE_SCHEMA` 839L, `MADHATS_API_SPECIFICATION` 890L, game/NFT/tokenomics specs, EVM-Arbitrum guide), whitepaper v1.8, business/VC docs, `CANONICAL_NUMBERS.md`, pitch, and the MAD Gambit stream scopes (MADDAO, MADforge Labs). *(A separate MDC marketplace product + the MDC-ecosystem map were removed — they belong in The-MDC, not MAD Gambit.)*
- **`verify/public/brand/`** — official logo set.

**Safe fixes applied on pull:** `game.sol PLATFORM_FEE 25→188` (0.25% → canonical 1.88%); **Supabase fully stripped** from `MADHATS_DATABASE_SCHEMA.md` → Neon + Pusher/Ably.

**Reconciliation checklist (before `contracts/madhat-core` compiles + integrates):**
1. **Deps:** `forge install` OZ-upgradeable + `abdk-libraries-solidity` + `chainlink-brownie-contracts`; wire `remappings.txt` (app foundry only has `openzeppelin-contracts` + `forge-std`).
2. **Pragma:** `^0.8.28` (madhat-core) vs `0.8.24` (app `contracts/src`) — pick one.
3. **`Errors.sol` bug:** the DutchAuction/MarketFactory error set is declared **outside** the `library {}` brace → breaks `Errors.X` refs; move inside.
4. **Naming:** `Madhat*` → `MAD*` (MadhatCard, MadhatTreasury) to match app convention.
5. **StakingPool:** staking token `MADDEX` → **$MADx**; confirm APY tiers = canonical **8.8 / 18.8 / 28.8 / 68%**.
6. **$MADx address:** `0xb61ae7727579e3781ca0ec4902b6ba21d335fd18` (Arbitrum One, per `DEPLOYED_ADDRESSES.md`) is canonical; the `0x6972…` comment in `MADxToken.sol` is wrong.
7. **`game.sol`:** switch `transfer()` → `safeTransfer()` (audit-flagged); fee fix confirmed.
8. **Rebuild the lost `MarketFactory` + `DutchAuction`** on `BondingCurve.sol` (`Errors.sol` already carries their error types; `evm-implementation-guide-arbitrum.md` + `README_REFACTORING.md` are the blueprints).
9. **API spec** uses `JWT + Wallet` → reconcile to the app's **SIWE**.
10. **DB schema** → raw SQL against Neon for now (Drizzle deferred); Supabase already stripped.
11. **`MADDEXToken` (100M supply)** is a **distinct legacy token** — do NOT merge into $MADx (888,888,888).
12. **Canonical-source decision:** `contracts/madhat-core` kept as a separate Foundry project (not merged into `contracts/src`) pending your call on which is canonical.

**✅ Resolved (founder-confirmed 2026-07-21):** the MAD Gambit **Golden Genesis Founders NFT = 2,488**. Deck corrected in PR #3; plan + suppress-list updated to match.
