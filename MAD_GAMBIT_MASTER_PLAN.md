# MAD Gambit — Master Build Plan

*Synthesis of all four session handoffs into one ordered, scope-aware plan.*
*Ethos: ultra-max high-fidelity "platform of joy" — build forward, latest versions, never strip functionality.*

---

## 0. Guardrails (never change without Nick's approval)

| Canonical number | Value |
|---|---|
| Platform fee | **1.88%** |
| Community / MAD Shield profit share | **28.8%** (shown as 28% in decks) |
| Creator market revenue share | **40%** |
| Seed target | **$1–2M** |
| Pre-money valuation | **$12M** |
| $MADx fixed supply | **888,888,888** |
| Rarity tiers | Common 60 · Uncommon 25 · Rare 10 · Epic 4 · Legendary 1 · Golden Hand <1 · Mythic 1-of-1 |

**Branding:** *MAD Gambit* = the prediction platform · *MADHAT's Gambit* = the card game.

---

## 1. Repo & scope map (critical — dictates which session can do what)

| Repo | Role | What lives here | Reachable from *this* session? |
|---|---|---|---|
| **`MADdegen/MAD-MPP-2.23`** | **Primary live app** | `verify/` (Next.js app), `contracts/` (Foundry), plan docs | ✅ **YES** |
| `The-MDC/MADHATs-Gambit-Presentation` | Investor decks (GitHub Pages) | `index.html` (Data House), `madhats-gambit.html` (OV deck) | ❌ needs its own scope |
| `The-MDC/demo-repository` | Dev monorepo | `06-frontend/mpp-v2.2`, whitepaper, specs | ❌ needs its own scope |
| `The-MDC/MPP-2.0` | Prod mirror of demo-repo | `src/`, `prisma/`, `05-smart-contracts/` | ❌ needs its own scope + PAT |

> **Reality:** three of four repos are out of scope in the current session. Each cross-repo phase below is tagged with the session/scope it requires. Do not stack unrelated repos into one session — it wastes context.

---

## 2. Phase P0 — Security & unblock (do first, cheap, high-leverage)

1. **Revoke the leaked PAT** `ghp_sLT2KaN…W5Kc` (The-MDC/MPP-2.0) — it was pasted in plaintext. Reissue as a fine-grained token, store as an Actions secret, never in chat.
2. **Set GitHub Actions secrets** on `MAD-MPP-2.23` (unblocks Firebase pipeline):
   `GEMINI_API_KEY`, `FIREBASE_APP_ID`, `FIREBASE_SERVICE_ACCOUNT` (b64), `GOOGLE_SERVICES_JSON` (b64).
3. **Set Vercel env vars** for `verify/`: `DATABASE_URL`, `GEMINI_API_KEY`, realtime/storage keys.
4. **Decide hosting posture:** Vercel Hobby = commercial-use exposure. Park Pro/custom-domain decision but log it.

*Owner: Nick (secrets/tokens) — I can't set these; I can verify they took effect.*

---

## 3. Phase P1 — `MAD-MPP-2.23` go-live backend  *(scope: THIS session)*

Turn the 14 `PLACEHOLDER` stubs in `verify/` into real services. Ordered by demo-to-live impact:

| # | Module | Files | Work |
|---|---|---|---|
| P1.1 | **PROFILE_DB** | `api/v1/mpp/profiles`, `api/v1/lobby` | Postgres schema (Prisma), wire profiles + lobby to `DATABASE_URL` |
| P1.2 | **TRI_AGENT_LLM** | `api/v1/madhatr/zliar`, `api/concierge/chat`, `api/satire-engine` | Swap local reply banks → Gemini (`GEMINI_API_KEY`) |
| P1.3 | **Lobby realtime** | `api/v1/lobby`, `components/game-lobby` | WebSocket/Supabase Realtime + image storage + rate-limit + moderation |
| P1.4 | **ORACLE** | `kaito-and-circus`, `casino-panel`, `dopamine-engine` | Chainlink/Pyth price feeds + VRF for ticker/RNG/outcome resolution |
| P1.5 | **WALLET_NFT_READ** | `nft-card`, `nft-saga`, `swap-interface` | Real on-chain ERC-1155/721 balance reads |
| P1.6 | **SAGA / FEED** | `lib/rss-feeds`, `api/v1/feeds` | Live chained markets + expanded RSS |

**Design-token cleanup (parallel, low-risk):** finish migrating legacy raw-hex components (`nft-card`, others) to tokens defined in `globals.css`.

---

## 4. Phase P2 — `MAD-MPP-2.23` contracts  *(scope: THIS session)*

Current `contracts/src/`: `FounderRegistry`, `MADCard1155`, `MADCard721`, `MADShieldVault`. **No staking contract here.**

| # | Task |
|---|---|
| P2.1 | **Write `MADStaking.sol`** — port the NFT-boosted design proven in MPP-2.0: clout multiplier `M_nft = 1.0 + Clout/200` (1.0×→2.0× at Clout 200), `createStake(nftId, amount, tierId, compounded)`, `getEffectiveRewardRate`, `setMadhatCard`. Enable `via_ir` + optimizer. |
| P2.2 | **Foundry tests** for `MADCard1155/721`, `MADShieldVault`, and new `MADStaking` (verify clout formula, ownership gating, no-NFT revert). |
| P2.3 | **CI: Foundry job** — `forge build && forge test` in GitHub Actions (pin solc 0.8.28). |
| P2.4 | **Roadmap contracts** (later): MarketFactory, DutchAuction, OracleIntegration, SagaController, QuadraticVoting, FactionWars, ConvictionMarket, EvolutionEngine. |

---

## 5. Phase P3 — Assets  *(scope: THIS session + art pipeline)*

1. **Card art** — generate the 900+ AI-Studio card binaries (FLUX LoRA pipeline from `MAD-Card-Art-Generator`).
2. **Logo** — swap the neon MAD Gambit logo into `verify/public/brand/madhatr-logo.png`.

---

## 6. Phase P4 — Investor decks  *(scope: `MADHATs-Gambit-Presentation` session)*

PR #2 is open (draft). Remaining edits before merge:
1. **1.88% fee revert** (ensure both decks show canonical fee).
2. **7 consistency fixes:** Y3 revenue, 2 seed spots, team-vs-LLC naming, chain table (`$MADx · BASE L2 · ARBITRUM · HYPERVM`), pack formula, Golden Ticket count (2,488 vs 888), founder tenure.
3. Confirm seed ask reads **$1–2M** everywhere (prior `$2.4–3.0M` bug).
4. Merge PR #2.

---

## 7. Phase P5 — Big-platform build  *(scope: `demo-repository` / `MPP-2.0` session)*

Larger monorepo track — deferred, separate session with proper scope + reissued PAT.

**Infra prerequisites:** Prisma v7.6.0 (`prisma.config.ts`, no downgrades) · Foundry v1.6.0 (`/tmp/foundry-bin`) · solc 0.8.28.

| # | Task | Stack pick |
|---|---|---|
| P5.1 | Push `05-smart-contracts/madhat-core/` to MPP-2.0 (never synced) | — |
| P5.2 | Fix 3 pre-existing test failures (Treasury emergency withdraw; 2× insurance prediction) | — |
| P5.3 | Implement `updateInsurancePool(address)` on StakingPool (currently stubbed) | — |
| P5.4 | Staking depth: loyalty time bonuses (30d +2/90d +5/365d +8%), rarity APY tiers, condition modifier | — |
| P5.5 | Admin portal | **Refine** |
| P5.6 | Chat | **XMTP** |
| P5.7 | Social graph / profiles | **Lens V3** |
| P5.8 | Marketplace + P2P swap | **Seaport** (Arbitrum) |
| P5.9 | CDP + analytics | **RudderStack → Postgres → Apache Superset** |
| P5.10 | Profile+Gallery page, Turborepo restructure, NestJS services, TheGraph subgraph, Unkey rate-limit, WebSocket layer | per original 24-item backlog |

---

## 8. Token-efficient execution rules

1. **One repo per session.** Don't reopen out-of-scope repos in this one — request the right scope instead.
2. **Verify, don't re-derive.** Trust this file + a targeted `grep`/scan over re-reading whole handoffs.
3. **Batch by module,** not by file — land P1.1 fully (schema→route→test) before P1.2.
4. **Placeholder-driven:** `grep -rn PLACEHOLDER verify/` is the live backlog; delete each marker as it's replaced.
5. **Ask only at real forks;** otherwise take the obvious canonical-compliant default.

---

## 9. Suggested critical path (this session)

**P0 (Nick: secrets) → P1.1 PROFILE_DB → P1.2 Gemini → P1.3 lobby realtime → P2.1 MADStaking.sol → P2.2 tests.**
Everything else (P3 assets, P4 decks, P5 platform) fans out into dedicated, correctly-scoped sessions.
