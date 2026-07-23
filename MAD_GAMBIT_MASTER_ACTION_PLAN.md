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

**Stage 6 — post-consolidation iterative build (Jul 21–23).** PR #20 consolidated the parallel threads onto green `main` (`d60f24f`→`cd7f02d`); Phases 0–3 landed (reconciliation · flip-clock/tokens · signed-session + durable-Neon-nonce + rate-limits · test-backed `MADStaking` + staking API/UI). The **v2 branches were then audited and found to be a stub scaffold** (13–263-byte prose placeholders — the fabricated-completion pattern the guard now blocks), so the "v2 surface" is a *blueprint*, not code (`docs/V2_BUILD_PLAN.md`). Iterative build resumed against it: **Phase 4** 5-stream revenue engine (`splitFee` model + API + panel), then **V1** Data Platform (events / CDP / aggregates on Neon), then **V2** Analytics Dashboard (`/dashboard`). (Ledger: Part M.)

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

- **Per PR (CI-enforced):** `placeholder-guard.yml` (no prose-stub source — real code required) · `tsc --noEmit` clean · `forge test` green for touched contracts · `security-review` on auth/value/contract changes · canonical-number grep · no new stock-neon literals.
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

---

## PART L — Consolidation with the vercel-audit thread (2026-07-23)

Merged the parallel `mad-gambit-vercel-audit-ocof1b` thread into this one per its handoff, ending the two-agent fragmentation. **One effort is now canonical.**

**Current ground truth:** `main` = **`d60f24f`**, **production GREEN** → https://mad-mpp-223-madgambit.vercel.app. Build root `verify/`, Next 16 + Turbopack, Node 22.x. Vercel team **`madgambit`**; project `mad-mpp-2.23` = `prj_XJ1OqBGYZMrg5eqJAZQQLnt1GYC9`. **Preview/branch deploys are skipped by an Ignored Build Step — only `main` builds production** (this is why every feature-branch commit shows Vercel "Ignored" — a policy skip, not a failure).

**PR #20 reconciled onto `main`** (merge `43347ab`) — brought in from the audit thread's merged PRs #17/#19/#21:
- **`.github/workflows/placeholder-guard.yml`** — CI tripwire: fails if any `verify/**` TS/TSX lacks code tokens, any `contracts/{src,test}/*.sol` lacks a pragma, or a known placeholder phrase appears. **Operationalizes the Part G anti-hallucination rule** — the guard against the prose-stub regression that once overwrote the app (48 one-line "descriptions" instead of code).
- **`contracts/test/MADStaking.t.sol`** — real Foundry suite (tier boundaries · 1-yr accrual · claim-from-reserve · unstake-keeps-rewards). *The concrete rebuttal to Grok's "MADStaking done with 12 fuzz tests" lie — real tests now exist.*
- **futarchy-board fee-lock fix** — the "raise creator fee to 42%" demo proposal is gone; canonical fee/creator/community are never governable.

**MADStaking.sol resolution — kept `main`'s version** (not this branch's `b1655c5`), reversing the handoff's default on the merits: main's is **test-backed** (co-designed with the suite above) and **hardcodes the canonical tiers in-constructor** (deploy-safe). This branch's staking **API (`/api/v1/staking`) + panel projection** are contract-agnostic (mirror `STAKING_TIERS`) and are retained.

**Design law (carry everywhere):** *maintain the Vercel design/layout unequivocally* — every change is correctness/wiring or purely additive; **no visual regressions**. Hex→token refactors swap only a literal that **exactly equals** a token value.

**`mad-mpp-2.24`** is the **`mad-mpp-2.24` branch of `MADdegen/mad-gambit-ui`** (not a repo). After PR #20 lands on `main`, re-propagate the reconciled `verify/` there. Its Vercel project `mad-gambit-2.24` (`prj_TEVVoLDuzpx7YmPkJhcs67t3lLtR`) needs **manual** settings (no API): Root Directory = `verify`, Production Branch = `mad-mpp-2.24`, Node 22.x, install-override OFF; env **values** live in the founder's Drive file (never printed) — keys are in `verify/.env.example`.

**Audit reference:** `docs/VERCEL_PRODUCTION_AUDIT.md` (+ published artifact) — byte-level debunk of the SuperGrok "everything is complete" claim. Same lesson as Part B2, now CI-enforced: **Grok output is unverified until byte-checked.**

**Remaining gaps (small; after PR #20 lands):**
- **Hex→token sweep, zero visual change:** `nft-card.tsx` (~48 raw hex), `positions-dashboard`, `staking-tiers-panel`, `tournament-arena`, `casino-panel` → import `INK`/`GOLD_CHISEL_STOPS`, swapping only literals that exactly equal a token.
- `lib/bayesian-logic.ts` — named in old docs, referenced nowhere; optional.
- **Do NOT re-merge to `main` unilaterally** — mark PR #20 ready for the founder's call; then the 2.24 propagation + its manual Vercel settings.

**This session's Phase 1–3 (already on the branch):** flip-clock + token adoption (Phase 1) · signed-session + durable-Neon-nonce + rate-limits (Phase 2) · staking API/UI atop the test-backed contract (Phase 3). All type-check green in CI.

---

## PART M — Build progress ledger (iterative; PR #22)

Executed as small, verifiable slices — each one **real code** (the placeholder-guard forbids stubs), CI-gated (`tsc` · guard · `next build`), **additive** to the locked `/gambit` layout, on **Vercel + Neon** (raw `pg`; Drizzle deferred; realtime via **SSE**, never WebSockets on serverless). Full v2 slice spec: `docs/V2_BUILD_PLAN.md`.

| Slice | State | Front | Back | Neon |
|---|---|---|---|---|
| **Phase 4 — 5-Stream Revenue Engine** | ✅ built | `revenue-streams-panel` | `/api/v1/revenue` | — (`splitFee` + Furnace) |
| **V1 — Data Platform** | ✅ built | — | `/api/v1/data/{events,cdp/[wallet]}` · `/api/v1/cron/rollup` · `lib/data-platform/{types,events,cdp}` | `sql/0001_data_platform.sql` → `events_stream`, `cdp_profiles`, `agg_platform_hourly`, `agg_user_daily` |
| **V2 — Analytics Dashboard** | ✅ built | `analytics-dashboard` · `/dashboard` route | `/api/v1/analytics/{summary,user/[wallet]}` | reads V1 tables |
| **V3 — Realtime (SSE)** | planned | live tiles | `/api/v1/realtime/stream` | tails `events_stream` |
| **V4–V8** | planned | — | — | see `docs/V2_BUILD_PLAN.md` |

**Evolutionary discipline:** V1 is the backbone (V2/V3/V4 read it); every route **degrades to a clean demo/empty state** when `DATABASE_URL` or a migration is absent, so the build and the demo never break before the SQL is applied. Migrations ship as committed SQL under `verify/sql/`, validated against the ephemeral Neon PR branch.

---

## PART N — MPP-2.0 parallel-repo handoff ingest (2026-07-23)

A handoff arrived from a parallel thread working on **`The-MDC/MPP-2.0`** — a **distinct, Prisma-based** production build, separate from both this repo (`MAD-MPP-2.23`, Neon + raw `pg`) and `The-MDC/demo-repository` (already consolidated in **Part K**). Analyzed against ground truth: **most of its concepts are already in this plan.** Only the genuinely-new/relevant items are captured below, each cross-referenced so nothing duplicates. **No Prisma/Supabase is adopted — Neon stays canonical (Part I / J-K line 261).**

**⚠️ SECURITY — verify (likely non-genuine):** a **PAT-formatted string** appeared in the handoff. Its value is **deliberately not recorded here or anywhere in the repo/commits** (repo-wide scan for `ghp_` is clean). Founder review (2026-07-23): the string **does not appear in the Grok materials and looks like spam / non-genuine**. Action: check it against GitHub → Settings → Developer settings → Personal access tokens — **if no live token matches, no action is needed**; revoke only if a real, unrecognized token is actually listed. Related: the older exposed-`ghp_…` flag at **J-C line 221**.

### N-A — Parallel-repo reconciliation (NEW flag)
- **`The-MDC/MPP-2.0`** is a parallel production build on **Prisma v7.6.0 + Postgres (Supabase-style)**, with recent work: Foundry v1.6.0 compilation, ~60+ TypeScript fixes, **161/164 tests passing (3 failing)**. This repo (`MAD-MPP-2.23`) is **Neon + raw `pg`**; Prisma/Supabase are suppressed (**J-K line 261**).
- **DECISION NEEDED — which is canonical production?** Recommendation: keep **`MAD-MPP-2.23` (Neon) canonical** per the locked stack (Part I). Treat MPP-2.0 as a **source of on-chain/staking logic to port**, not a stack to adopt. Port **schema *intent*** (not Prisma migrations) into `verify/sql/*.sql`; **do not import Prisma/Supabase**. The **3 failing tests + Prisma TS fixes are MPP-2.0-internal** — they stay in that repo's thread, not portable here.

### N-B — On-chain NFT-boosted staking → fold into madhat-core `StakingPool` (extends Part K)
MPP-2.0 exposes an on-chain **`createStake(amount, nftId)` with a clout boost** `M_nft = 1.0 + Clout/200`. Ground-truth state in *this* repo:
- **TS already implements the formula:** `verify/lib/gambit-game-math.ts` → `calculateStakingYield(apyBase, nftClout) = apyBase · (1 + max(nftClout,0)/200)` (**line 1076**). ✅ present.
- **madhat-core Solidity already has `createStake`:** `contracts/madhat-core/src/staking/StakingPool.sol` (**line 236**) — pulled in Part K, not yet compiling.
- **`contracts/src/MADStaking.sol` intentionally uses the per-tier clout/APY *table*, NOT `1+Clout/200`** (**J-D line 227**) — that stays.
- **Reconciliation:** fold MPP-2.0's `createStake(nftId, clout)` semantics into **madhat-core `StakingPool.sol`** as part of the **Part K checklist item 5**, *not* into `MADStaking.sol`. Two staking models coexist **by design**: (a) `MADStaking.sol` fixed-tier table (deploy-safe, canonical); (b) madhat-core `StakingPool` NFT-clout-boosted (advanced). Founder picks which fronts production before mainnet.

### N-C — Foundry CI on GitHub Actions (NEW — actionable now)
Today's workflows — `ci.yml` (tsc), `neon-pr-branch.yml`, `placeholder-guard.yml`, `vercel-deploy.yml` — run **no `forge build`/`forge test`**. Unlike the web sandbox (where `forge`/`npm`/RPCs are network-blocked), **GitHub Actions runners are NOT blocked**, so Foundry can compile and test there.
- **Action:** add **`.github/workflows/foundry.yml`** using `foundry-rs/foundry-toolchain` → `forge fmt --check` + `forge build` + `forge test -vvv` against `contracts/` (and `contracts/madhat-core/` once the Part K checklist lands). This operationalizes the **Part H** "`forge test` green for touched contracts" gate that currently cannot run in-session, and is the **CI-enforced rebuttal** to Grok's "12 fuzz tests pass" claim (Part B2).

### N-D — Staking-economics reconciliation flags (NEW; canon wins unless founder overrides)
- **Loyalty time bonuses** (MPP-2.0): **+2% (30d) / +5% (90d) / +8% (365d)** on staking APY. **Not in app, not in canon.** If founder approves, add to **Part E** as `STAKING_LOYALTY_BONUS_BPS = {30d:200, 90d:500, 365d:800}`, additive on top of tier APY (no yield "printing" — funded from fees/Shield premiums per J-D).
- **Card-rarity staking-APY conflict:** MPP-2.0 = **Common 8% … Golden Hand 60%**; **app/canon (Part E) = Common 12% … Golden Hand 68% … Mythic 88%.** Canon wins — **flag, do not silently change.**
- **Card CONDITION power-scaling** (MPP-2.0): **Pristine 100% → Wrecked 10%** yield/power multiplier — distinct from the app's per-tier `RARITY_WEAR_PCT` *durability loss* (**J-I line 252**). If adopted, fold into the card-wear state machine under **J-C PROFILE_DB**, not as a rarity-table edit.

### N-E — Already covered / no new action (prevents rework)
`EvolutionEngine.sol` lost → already **J-D line 224**. `M_nft = 1+Clout/200` → already **J-D line 227** + TS line 1076. `demo-repository` contracts → already **Part K**. Prisma 60+ TS fixes / 161-164 tests / 3 failures → **MPP-2.0-internal**, not portable to the Neon stack. Exposed PAT → **J-C line 221** (reinforced above).

---

## PART O — Production Gap Inventory (refreshed 2026-07-23; supersedes the Part C backlog snapshot)

Full repo scan vs the **production `verify/` app on `main`** (4 pages: `/ · /gambit · /dashboard · /workbench` · 21 API routes · 47 components). Since V1/V2/Phase-4 shipped, the Part C "genuinely open backlog" is stale — this is current ground truth, sorted by **how real the code is**.

### O-1 — REAL code, coded but NOT surfaced (wire-up candidates — the valuable pool)
- **Contracts — `contracts/madhat-core/` = 15 real `.sol`, none integrated** (compile via **Part K** checklist): `prediction/{game,BondingCurve}`, `staking/StakingPool` (the Part N-B clout `createStake`), `insurance/RiskOracle`, `tokens/{MADxToken,MADDEXToken,MadhatCard,MadhatCardOptimized}`, `treasury/{Madhat,Community}Treasury`, `registries/{roles,assets}`, `errors/Errors`, `events/{Evolution,Staking}Events`. Plus **5 empty root stubs** (`MADStakingCore`, `MADStakingOrchestrator`, `P2PEscrowMarket`, `ReferralRewards`, `SessionKeyManager`).
- **TS logic — 43 of 85 `gambit-game-math.ts` exports have zero production surface** (only `calculateFurnaceBurnPercent` is live, via `revenue-engine.ts`). By theme:
  - **MAD Shield engine** (flagship loss-protection; highest value): `createShieldOptIn`, `calculateShieldPremium`, `calculateShieldPayoutFull`/`Tiered`, `calculateShieldReturnWindow`, `requestShieldUnstake`, `isShieldUnstakeComplete`, `shieldReturnCountdown`, `isWhaleShieldEligible`, `WHALE_SHIELD_ELIGIBILITY`. **→ Part P surfaces this.**
  - **Card lifecycle:** `generateCard`, `rollRarity`, `attemptEvolution` + `EVOLUTION_BURN_COSTS`, `applyUsageWear`/`calculateUsageWear` + `RARITY_WEAR_PCT`.
  - **Pack pricing:** `scandalPackPrice`, `SCANDAL_PACK_TIERS`/`CAP`/`FLOOR`, `getAuctionPrice` (Dutch auction).
  - **Staking yield:** `calculateStakingYield` (the `1+clout/200` boost, Part N-B).
  - **Governance:** `quadraticMatch`, `calculateGovernanceThreshold` (`mpp-math.ts`). `futarchy-board.tsx` exists but doesn't call these.
  - **Behavioral / virality:** `lossAversionWeight`, `temporalDecay`, `stochasticDecay`, `attentionDecay`, `calculateUserDopamineIndex`, `viralityScore`, `getFibonacciReward`.
  - **Trust / risk:** `assignTrustScore` (EigenTrust), `kellyFraction`, `calculateConvictionSafe`.

### O-2 — INTENT only (prose stubs, NOT built — need real coding, not merging)
The **"v2 layer"** on `feature/nft-card-system-v2` ≡ `feat/supergrok-skills-guardrails` ≡ `production-optimizations-and-env` (identical **19–125-byte prose stubs**; e.g. `P2PMarket.tsx` = *"P2P Escrow Market component"*, `api/realtime/ws/route.ts` = *"WebSocket API route"*): pages `marketplace/creator/vip/profile`; APIs `data/events`, `information-market/create`, `marketplace/assets`, `realtime/ws`, `referrals/track`, `session-keys`; modules P2P + behavioral-econ, Referral Suite, Session Keys (AA), UGC Feed, Information Markets, User Intelligence (CDP), realtime provider. **These are the Part J-D/J-G roadmap — real as *plan*, unbuilt as *code*.** The `placeholder-guard` blocks merging them until real. *(Same fabricated-completion pattern as the Grok "it's built" claims — Part B2.)*

### O-3 — Orphaned (ignore)
Root `/app/` (`octavian-master`, `maddegens-presentation`) — not the production app; `verify/` is canonical.

**Surface order for O-1:** **MAD Shield (Part P — flagship, code exists)** → card lifecycle → staking-yield clout → governance math → pack pricing. Contracts follow the Part K reconciliation + Part N-C Foundry CI.

---

## PART P — MAD Shield surfacing: step-by-step build (front + back, Vercel + Neon)

Surface the **already-coded** MAD Shield engine as a live product surface — the flagship loss-protection mechanic — **additively** on `/dashboard`, degrade-to-demo, **no real value movement yet** (on-chain vault deposit/charge is a later gated slice). All math already exists in `gambit-game-math.ts`; this is wiring, not new economics.

**Canonical (already in code — do not change):** Standard **28.8%** · Shielded **28.8→40%** dial · Whale **60%** (gated: ≥250k lifetime vol + ≥90d age + ≥85 trust + ≥1 Golden Hand). Premium **2–4%** of stake (whale flat 3%). Return window **2–24h** by stake size.

| Slice | Layer | Work | DoD |
|---|---|---|---|
| **P-1** | back (no DB) | `/api/v1/shield/quote` — pure calculator wrapping `calculateShieldPremium` + `calculateShieldPayoutFull` + `calculateShieldReturnWindow` | POST `{stake,tier,premiumTier,eligibility?,requestWhaleTier?}` → `{premium,payout,effectivePct,tier,returnWindowHours}`; works with no DB |
| **P-2** | Neon | `sql/0002_shield.sql` → `shield_positions`; `lib/shield.ts` DB helpers (insert / list / complete) via untyped `pool.query` + typed mappers | migration idempotent; helpers typed; no generic-constraint TS errors |
| **P-3** | back (DB) | `/api/v1/shield/opt-in` (POST, rate-limited, records opt-in via `createShieldOptIn`; 503 without DB) + `/api/v1/shield/positions/[wallet]` (GET; demo-empty without DB) | validated inputs; degrade clean; rate-limited write |
| **P-4** | front | `components/shield-panel.tsx` (INK; 3 tier cards + live premium/payout calculator hitting `/quote`; return-window) → mount on `/dashboard` | renders always (calculator needs no DB); no visual regression to existing dashboard |
| **P-5** | GATED (later) | wire to `MADShieldVault.sol` for real `$MADx` premium charge + recovery payout | Phase-3 testnet; `security-review` skill; no unsigned-value trust at the boundary |

**This session builds P-1…P-4** (safe, additive, no real value). **P-5 stays gated** behind the Phase-3 contract work. Verification: `tsc` + `placeholder-guard` green; canonical 28.8/40/60 + 2–4% unchanged; `/dashboard` gains a working Shield calculator alongside Analytics + Revenue panels.

---

## PART Q — Card lifecycle surface (built 2026-07-23)

Second **O-1** engine surfaced (after Shield). Pack **generation** already existed (`openCardPack` → `/api/v1/cards/open-pack`); this closes the **post-acquisition** lifecycle — **own → wear → evolve** — which was entirely unsurfaced. Additive on `/dashboard`, degrade-to-demo, no value movement.

**Naming note (answers a founder question):** `contracts/madhat-core/` is the **platform-core** contract set (prediction market, staking, treasury, tokens — *and* `tokens/MadhatCard.sol`), not "the card game," and **"MADHAT" is neither the platform nor the card-game name** — it is legacy branding on that demo-repository set, slated for `Madhat* → MAD*` rename (Part K item 4). The card game is one module within it.

| Slice | Layer | What | State |
|---|---|---|---|
| **Q-1** | Neon | `sql/0003_cards.sql` → `cards` ledger; `lib/cards.ts` (insert/list, typed mappers) | ✅ |
| **Q-2** | back (DB) | `/api/v1/cards/collect` (persist to wallet; rate-limited; demo echo) + `/api/v1/cards/collection/[wallet]` (read; demo-empty) | ✅ |
| **Q-3** | back (pure) | `/api/v1/cards/wear` — `calculateUsageWear`/`applyUsageWear` (2–16%/use, floored at 0) | ✅ |
| **Q-4** | back (pure) | `/api/v1/cards/evolve` — burn-ladder requirements (`nextEvolution`) + VRF **simulate** (`attemptEvolution`, non-authoritative) | ✅ |
| **Q-5** | front | `components/card-lifecycle-panel.tsx` (rarity selector · durability/wear calculator · evolution ladder + VRF simulate) → `/dashboard` | ✅ |
| **Q-6** | GATED | on-chain `MAD Card` mint + real burn-ladder + Chainlink-VRF evolution | Phase 3 |

Canonical unchanged: wear **2/2/10/11.5/13/14.5/16%** (`RARITY_WEAR_PCT`); burn ladder **C→U 100/100 · U→R 250/200 · R→E 500/500 · E→L 1000/2500**; VRF stage cap **3**, oracle clamp **[5,95]/[10,90]** (the house-edge security boundary — never remove).

**O-1 surface progress:** Shield ✅ (Part P) · Card lifecycle ✅ (Part Q) · next: staking-yield clout → governance math → pack pricing.
