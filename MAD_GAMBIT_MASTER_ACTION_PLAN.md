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

**Working defaults (override any):** (1) deliverable = this doc; (2) keep & extend the current stack (Viem + custom SIWE + Neon/Drizzle), treat wagmi/RainbowKit + Supabase/Convex as optional; (3) Phase 1 = Outlier Ventures demo polish; (4) theme = gold + neon-ink hybrid.

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
| Golden Genesis Founders NFT | **888** | "2,488" is an error |
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
- ❌ Persistence = "Vercel Postgres" (first assumed Supabase). → **Neon + Drizzle.**
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
- **DB:** Neon Postgres + `drizzle-orm` + `pgvector`.
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
| Data platform (Information Market + Warehouse + CDP) | Partial | Postgres + Drizzle; formalize `data-platform/` |
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
Fix `CLAUDE.md` seed → `$1.24M–$2.48M`; fix chain skill note → Nova; pick ONE Y3 figure everywhere. Deck (`madhats-gambit.html`): `1.888%→1.88%`, normalize branding, remove phantom co-founders, single Y3, "2,488"→888 — **patch OV decks, don't delete**. Rewrite `verify/.env.example`. Decide `mad-gambit-core` (recommend archive).
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
Per `MADGambit_Website_Scope_v1`: Next.js + Tailwind + Framer Motion, no wallet, Supabase/NextAuth or Neon, Resend, subdomain provisioning, JWT handoff to `app.madgambit.io`. Override stock-neon with `INK`. Lighthouse >95, LCP <1.8s, bundle <100KB.
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
| Backend (Drizzle, API routes, indexing) | Claude Code (Replit/Bolt scaffolds) | Sonnet 5 / Fable-5 |
| AI agents (scraper, LangGraph swarm, oracle) | Claude Code + `mad-gambit-ai-agents` skill | Opus 4.8 |
| Deck / investor materials | Claude Code + `investor-materials` skill | Opus 4.8 |

**Anti-hallucination rule:** no change is "done" without a file diff + a passing check. Never accept "it's built" — verify it compiles/tests.

---

## PART H — Verification & Definition of Done

- **Per PR:** `npm build` + `tsc` clean · `forge test` green for touched contracts · `security-review` on auth/value/contract changes · canonical-number grep · no new stock-neon literals.
- **Demo gate (P1):** `/gambit` matches mockups mobile+desktop; ticker 3-mode; concierge answers; deck reconciled.
- **Testnet gate (P3):** contracts on Nova Sepolia; frontend reads live addresses; no unsigned-value trust at auth boundary.

## PART I — Open decisions (non-blocking)

- The single **Y3 revenue** figure to standardize on.
- Is the **binary** market type out (CIRO non-binary only)?
- `mad-gambit-core`: archive vs populate.
- Add wagmi/RainbowKit in Phase 1 (wallet UX) or defer.
