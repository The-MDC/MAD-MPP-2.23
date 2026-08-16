# MAD Gambit — Master Document

> **Single source of truth for the current Vercel + Neon + GitHub + Claude Code iteration.**
> Consolidated 2026-08-16 from ~150 scattered planning documents, which were deleted in the
> same commit. Git history retains every one of them if something here proves thin.
>
> **Still standalone, deliberately:** `docs/MASTER_MATHS_AND_ALGORITHMS.md` (the one canonical
> maths & algorithms doc) and its single companion `docs/MATHS_ENGINE_FORMULAS.md` (the engine
> room); `docs/PITCH_DECK_VERSION_TRACKER.md` (deck lineage) and the decks themselves
> (`verify/public/pitch/*.html`); plus each subproject's own docs (`verify/docs/`,
> `contracts/madhat-core/`, `master-maths/`) and live tooling config (`.claude/`, `.agents/`).

---

## PART I — CHRONOLOGY

Lightly detailed. Dates are from document headers or git history, not inferred.

### 2024 — origins (fully superseded)
- **2024-09-30** — Founding MDC/MADdegens whitepaper. Solana, 6,666 "Megalomaniac" NFTs. Later migrated CrossFi → EVM.
- **2024-11-23** — Original brand guidelines (Crimson/Jet Black/Metallic Gold, "MAD Upshot"). Superseded.
- **2024-11** — $MADx v1.0 concept: 1,000,000,000 supply, ERC-1155, Base L2, 2–5% fee. All four values later changed.

### 2025–early 2026 — the plan that didn't ship
- **2025-12-09** — Strategic investor offer: $2.4M–$3M seed ask.
- **2026-01-20** — "Version 3.0 FINAL" spec trio (game spec, tokenomics, NFT design): flat 40% community model, "TeaBag" 60% loss protection, Base L2. Entirely superseded.
- **2026-01-26** — Claude Code Master Implementation Guide v5.0: Prisma + NestJS + Privy. Never built.
- **2026-01/02** — Tokenomics v1.5: renamed MAD Gambit, moved to Arbitrum, fixed 888,888,888 supply, fee 2.88%, shield 40%.
- **2026-02** — Whitepaper v1.8: fee raised to 4.88%, shield 40–60%.
- **2026-02-26** — VC stress-test ("Shooting Holes in My Thesis"): 4 reviews, 3 PASS / 1 FAIL.

### 2026-03 — the numbers get locked
- **2026-03-05** — Founder's Golden Ticket supply corrected 888 → 2,488.
- **2026-03-19** — Kalshi raises $1B at $22B valuation; cited throughout as urgency driver.
- **2026-03-20** — **Canonical numbers locked**: 1.88% fee, 28.8% community/Shield, 40% creator share, 888,888,888 fixed supply, $1M–$2M seed at $12M pre. Pitch deck v1.2 (18 slides) + Hi-Fi PAD2. A ~17-document data-integrity audit lands the same day.
- **2026-03-22** — GitHub capabilities audit: 91 repos inventoried across The-MDC + MADdegen. Mostly unbuilt wishlist.
- **2026-03-25** — MAD Gambit LLC filed (New Mexico).

### 2026-04/06 — consolidation and a dead end
- **2026-04-05** — `CANONICAL_NUMBERS.md` last updated — still the numeric source of truth today.
- **2026-06** — Android/Kotlin (Jetpack Compose) client era. Abandoned; survives only as `master-maths/`.

### 2026-07 — the current app takes shape
- **2026-07-01** — Multi-agent swarm run (`.agents/`): 4 milestones — SIWE auth, `MADShieldVault.sol` + Foundry tests, concierge wiring, local Gemma endpoint. All returned CLEAN verdicts. **Caveat: every shell command in that run timed out on permission prompts, so all four were _statically reviewed, never executed_.** Treat the verdicts accordingly.
- **2026-07-05** — Vercel production found 3 commits stale hours before an Outlier Ventures demo. Fixed.
- **2026-07-10** — Chain choice locked: Arbitrum Nova (gameplay) + Arbitrum One (Shield vaults, $MADx).
- **2026-07-11** — PR #6 (NFT card art), PR #7 (ultra dashboard) merged.
- **2026-07-13** — Seed ask signed off $1.24M–$2.48M @ $12M pre. Grok falsely claimed `MADStaking.sol` complete; it wasn't yet.
- **2026-07-15** — **Main-overwrite incident**: `main` briefly replaced with ~48 placeholder files, recovered from another branch. This is the origin of the `placeholder-guard.yml` CI gate.
- **2026-07-21→25** — PRs #20–#30: `MADStaking.sol` and `MADMarketFactory.sol` actually ship. Theme routing splits into `/preview` and `/mpp2.23`. Guest Basic-auth gate added.
- **2026-07-24** — Dopamine hub ships at `/preview` (PR #23), 73 vitest tests. On-chain $MADx found deployed with a **mutable, mint-on-purchase** supply — conflicts with the fixed-888,888,888 canon. Still unreconciled (see Part II §9).
- **2026-07-25/26** — `MASTER_MATHS_AND_ALGORITHMS.md` consolidated (Shield/Vulkan/GARCH docs reduced to redirect stubs). CI gates added; `SECURITY.md` + `SECURITY_LAYERS.md` written.

### 2026-08 — reconciliation, near-disaster, and the current line
- **2026-08-05** — **ADR-008 accepted**: `pg` Pool + Route Handlers settled as the only data pattern; `@neondatabase/serverless` explicitly rejected. Marked *"Settled. Do not reopen."* Five Faces + Zeitgeist product sheets finalized.
- **2026-08-06** — Perp families ship (PRs #57→#60): Five Faces, Zeitgeist, Perpetual Epiphanies, `MADPortrait`/`MADPortraitKeyRegistry`, slot auction.
- **2026-08-07** — Commit `8c7a195` ("standardize AI persona and configure Gemini") **accidentally deletes `verify/`, `contracts/`, and all CI** — 307,305 deletions.
- **2026-08-09** — PR #66 restores the app.
- **2026-08-10** — Neon database hits free-tier quota ceiling; compute suspended. Data intact.
- **2026-08-11** — Audit finds prod serving a stale commit, prod DB schema-less, `NEON_PROJECT_ID` a literal placeholder.
- **2026-08-12** — PR #72: full-stack reconciliation + new Vercel project standup (`VERCEL_PROJECT_SETUP.md`). Same day: #73 (manual prod deploys), #74 (dark theme + Blob portraits), #75 (SafeERC20, 3 open routes closed), #76 (ERC-2771 gasless relayer), #77 (`MADDisputeVoting.sol`).
- **2026-08-13** — O-V Conviction State Node HUD shipped.
- **2026-08-14** — PR #80 merged (O-V HUD + stale-Supabase doc cleanup). Neon project split resolved to a concrete cause: **three** live Postgres databases under one integration, needing a founder-run merge (Part II.5). Migrations removed from the Vercel build in favour of a controlled `migrate:deploy`; `main` auto-deploy disabled; two advisory AI review gates added via gh-aw.
- **2026-08-16** — This consolidation; frontend QOL benchmark and Chainlink VRF audit (Parts III–V).

---

## PART II — CURRENT STATE

Everything below is believed true as of 2026-08-16. Where something is stale or contested it says so.

### 1. Stack

| Layer | Choice |
|---|---|
| App | Next.js 16, React 19.2.1, Tailwind v4 — in **`verify/`** (Vercel root directory) |
| Database | **Neon Postgres** via raw `pg` (node-postgres). No ORM. |
| Storage | Vercel Blob |
| Hosting | Vercel, GitHub-integrated, preview deploy per PR |
| Contracts | Solidity + Foundry in `contracts/`, Arbitrum One (42161) |
| Auth | Custom **SIWE** (`lib/siwe-verify.ts` + `verify/proxy.ts`) |
| AI | `@langchain/google-genai` + `langgraph`, **inside Next.js API routes** |
| Dev | Claude Code against GitHub PRs |

**Explicitly rejected, do not reintroduce:** Supabase · Drizzle · Prisma · NestJS · MongoDB · Privy · NextAuth · tRPC · a separate Python/FastAPI backend · "mEth" secondary currency.

Next 16 renamed `middleware.ts` → **`proxy.ts`**; confirmed on disk. The guest Basic-auth gate covers pages *and* `/api` (except `/api/health` and `/api/v1/health/db`).

### 2. Environment & secrets

Read by real code — set these:

| Var | Purpose |
|---|---|
| `GOOGLE_API_KEY` | Gemini — concierge, satire engine, embeddings. **Not** `GEMINI_API_KEY`. |
| `SESSION_SECRET` | HMAC for signed session cookies. Unset ⇒ SIWE verifies but issues no cookie ⇒ all wallet routes 401. |
| `CRON_SECRET` | Bearer for scheduled jobs. Routes 503 when unset. |
| `PAUSE_GUARDIAN_TOKEN` | `x-pause-guardian` header for emergency halt. |
| `SUBJECT_MAP_PEPPER` | HMAC pepper for identity index. Writes **throw** when unset. (`REGISTRAR_PEPPER` = legacy alias.) |
| `RELAYER_PRIVATE_KEY` | ERC-2771 meta-tx relayer hot wallet. |
| `GUEST_USER` / `GUEST_PASS` | Optional extra guest login. |
| `GDELT_QUERY` | Optional GDELT query override. |
| `NEXT_PUBLIC_*_ADDRESS` (4) | Optional; `lib/contracts.ts` has fallbacks on 42161. |

**Integration-injected — never hand-set:** `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`.
`lib/database-url.ts` also accepts `NEON_SKY_PARK_DATABASE_URL` and `NEO_DATABASE_URL`.

**Confirmed dead** (read by no code — do not re-add): `GEMINI_API_KEY`, `ALLOWED_WALLETS`, `NEXT_PUBLIC_SITE_URL`, `WIRE_LIVE`, the Upstash pair, `SENTRY_DSN`, `FEATURE_FLAG_GAMBIT_NODES`, `CORS_ALLOWED_ORIGINS`, `LUNAR_PHASE_OVERRIDE`, `NEXT_PUBLIC_VERCEL_ANALYTICS_ID`.

### 3. Deployment

Project **`mad-gambit-2.23`** (team `madgambit`, Pro), replacing the dead `mpp2.23`.

- Root Directory: `verify`
- Build: **`next build`** only. Migrations were removed from the build — they now run as a controlled, manual `npm run migrate:deploy` (with `npm run schema:verify` alongside). `SKIP_MIGRATIONS` is a legacy escape hatch; do **not** set it on Vercel, since normal builds no longer migrate.
- **`main` does not auto-deploy** — `vercel.json` sets `git.deploymentEnabled.main = false`; production deploys are manual/promoted.
- Neon connected via Vercel Marketplace ("connectable existing account"), branch-per-preview on
- Crons: rollup hourly · `perps/roll` 00:00 UTC · `registrar/lapse` 00:30 UTC. `proxy.ts` bearer-passes these three around the guest gate; both handlers export `GET`.
- **Deployment Protection must stay OFF** — `proxy.ts` is the real gate
- Ignored Build Step allows `main`, `feat/*`, `claude/*` only
- GitHub secrets `DATABASE_URL` / `NEON_API_KEY` / `NEON_PROJECT_ID` are now unused and deletable
- Also injected by integrations: Upstash Redis (`REDIS_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`) — no Redis client exists in the app yet — and `BLOB_STORE_ID` alongside `BLOB_READ_WRITE_TOKEN`

### 4. CI

`.github/workflows/`: `ci.yml`, `unit-tests.yml`, `foundry.yml`, `placeholder-guard.yml`, `secret-scan.yml`, `dependency-review.yml`, plus `agentic-compile.yml` and the two gh-aw AI-review sources (`agentic-security-review.md`, `agentic-quality-review.md`). No Neon-branch workflow exists any more — that plumbing was retired.

| Gate | Status |
|---|---|
| Type-check (`tsc --noEmit`) | enforcing |
| Unit tests (vitest) | enforcing |
| Build (`next build`) | enforcing |
| Route-guard check | enforcing |
| Placeholder Guard | enforcing |
| Secret Scan (TruffleHog) | enforcing |
| Lint (eslint) | **report-only** — needs Next-16 realignment |
| Slither | **report-only** — 135 findings on `src/` awaiting triage |
| Dependency Review | **report-only** — needs Dependency Graph + GHAS |
| AI Security Review (gh-aw + Claude Code) | **advisory** — authz / business-logic / oracle-risk commentary; posts one PR comment, does not gate |
| AI Quality Review (gh-aw + Claude Code) | **advisory** — reuse / simplification commentary; does not gate |

Nothing blocks merge until branch protection actually requires these checks on `main`. The two AI review gates are deliberately non-blocking while they prove out; their `.lock.yml` files are generated by `gh aw compile` and only the `.md` sources are checked in so far.

### 5. Database & migrations

14 migrations, `verify/sql/0001–0014_*.sql`, applied by `verify/scripts/migrate.mjs` — one transaction each, tracked in a `_migrations` ledger, idempotent (`CREATE ... IF NOT EXISTS`). Schema lands **only** via reviewed numbered migrations; interactive `psql` is both discouraged and network-blocked in-container.

**Current blocker — three Neon databases, one app (2026-08-14).** Under the same Neon-via-Vercel integration there are three live Postgres databases:

| Role | Name |
|---|---|
| **Target** | `mad-mpp-2-23-postgres` (confirmed attached, Neon Free) |
| Source | `Neon-DB-MADMPP` — compare, then retire |
| Source | `neon-sky-park` — compare, then retire (the "sky park" project) |

`/api/v1/health/db` returning 503 with a ~10s connection timeout is the signature of a host that never answers — almost certainly this split rather than the earlier "quota suspension" or "wrong project" diagnoses, both of which are superseded.

**Founder-driven sequence, in order — do not skip ahead to the delete:**
1. Run the read-only inspection query (below) in each of the three Neon SQL Editors.
2. Diff the three outputs; decide a conflict policy per overlapping table.
3. Author the merge migration as `verify/sql/00NN_neon_merge.sql`, following the existing migrations-as-code convention.
4. Validate row counts and app behaviour against the merged result.
5. **Only then** delete `Neon-DB-MADMPP` and `neon-sky-park`.

Blob (`mad-mpp-2-23-blob`) is explicitly out of scope.

**Why an agent session cannot do step 1:** egress to `*.neon.tech` and TCP 5432 is deliberately blocked in the agent container (verified: `console.neon.tech` and `api.neon.tech` both 403 through the proxy; 5432 unreachable). Either the founder runs the query and pastes results back, or a read-only Neon MCP server is connected to a future session (`.claude/skills/neon-db`) — which needs an interactive OAuth/API-key flow an agent can't perform for itself. **No agent should get write access for this task.**

```sql
-- A: every table in the public schema
select table_name from information_schema.tables
where table_schema = 'public' and table_type = 'BASE TABLE' order by table_name;

-- B: column fingerprint per table
select table_name, ordinal_position, column_name, data_type, is_nullable, column_default
from information_schema.columns where table_schema = 'public'
order by table_name, ordinal_position;

-- C: primary keys — defines what "conflict" means per table
select tc.table_name, kcu.column_name
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
where tc.constraint_type = 'PRIMARY KEY' and tc.table_schema = 'public'
order by tc.table_name, kcu.ordinal_position;

-- D: approximate row counts (planner stats, not a full scan)
select relname as table_name, n_live_tup as approx_row_count
from pg_stat_user_tables order by n_live_tup desc;
```

### 6. Security

Eight layers (full map was `SECURITY_LAYERS.md`, folded in here):

1. **Edge headers** — `proxy.ts` + `vercel.json`: `X-Frame-Options: DENY`, `nosniff`, `strict-origin-when-cross-origin`. **No CSP yet** — genuine gap.
2. **SIWE wallet auth**
3. **Sessions/secrets** — `SESSION_SECRET`, guest pair, `CRON_SECRET`
4. **Rate limiting** — `lib/rate-limit.ts`; audit that every public route uses it
5. **Shield domain guards**
6. **Contracts** — Foundry + Slither; external audit vendor on file: **Hacken.io**, engage before mainnet
7. **Supply chain** — Secret Scan enforcing; Slither / Dependency Review / Lint report-only
8. **Governance/review** — skill lives in the separate `MADHATs-Claude-Enhancement` repo

**Do not restore** (placeholder stubs): `lib/auth/siwe.ts`, `app/api/session-keys/*`, `SessionKeyManager.tsx`, root `middleware.ts`. **Do not re-add** `ai-backend/.../auth.py` — deliberately migrated off; restoring it forks a second auth path.

**Genuine gaps to build fresh:** ERC-4337 session keys · CSP header.

Since the security map was written: SafeERC20 added and 3 open routes closed (#75); the `$MADx` transfer vulnerability is **fixed** (all 7 `madx` routes now use `lib/madx-route-auth.ts` — *do not re-fix it*, a stale-tree review reported it as open); **35 of 53 mutating routes still lack a wallet-session check** (privilege separation, not anonymous access — the guest gate covers them); `npm audit` has never been run.

### 7. Canonical numbers

Locked, from `CANONICAL_NUMBERS.md` (2026-04-05) and implemented + unit-tested in `verify/lib/gambit-game-math.ts` (`FEE_BPS 188`, `COMMUNITY_SHARE_BPS 2880`, `MADX_FIXED_SUPPLY 888_888_888`):

| Parameter | Value |
|---|---|
| Platform fee | **1.88%** global |
| Community profit share | **28.8%** (displays as 28%) |
| Creator revenue share | **40%** — creator-made markets **only** |
| MAD Shield loss recovery | **28.8%**, premium-funded (not a subsidy) |
| Token supply | **888,888,888** fixed |
| Seed ask | $1M–$2M @ $12M pre · min viable raise $688K |
| Staking APY | 8.8% (1mo) · 18.8% (12mo) · 28.8% (24mo) · **68%** MAD tier (250K $MADx / 365d) |
| MADDAO quadratic cap | 24x |
| Founder's Golden Ticket | 2,488 ERC-1155 |

**Fee distribution.** Platform markets: $100 bet → $1.88 fee → 35% Ops / 25% Shield / 10% Burn / 30% Community. Creator markets: 40% to creator (lifetime, on-chain) / 60% to platform, allocated as above.

**Never use again:** fee 1.66% / 2.88% / 4.88% · Shield 40% / 60% · "TeaBag" (old Shield name — banned in investor/public comms) · "MAD Upshot" · seed $2.4M–$3M · Y3 $42M · Base-L2-as-primary · $MAD 1B supply · 888-as-founders-NFT · creator fee 42% · phantom co-founders Isabella H. / Parphul B.

**Brand rules:** "MAD Gambit" = the platform, always. "MADHAT's Gambit" = card-game line + character, full name always. "MADHATs" alone = never.

> **Token distribution is contested.** `CANONICAL_NUMBERS.md` (April) says 35% Public / 20% Liquidity / 15% DAO & Community / 10% Team / 10% Staking / 10% Reserve. The March "vFinal" whitepaper set says 45/15/15/15/10. April is later and this doc treats it as canonical — but the two have never been explicitly reconciled.

### 8. Contracts

`contracts/src/` — 11 files: `MADMarketFactory`, `MADOptimisticOracle`, `MADDisputeVoting`, `MADShieldVault`, `MADStaking`, `MADCard1155`, `MADCard721`, `MADPortrait`, `MADPortraitKeyRegistry`, `FounderRegistry`.

Market makers: parimutuel (`MADMarketFactory`, live) + MPP bonding curve for perp families. LS-LMSR proposed, not built. Oracle: `MADOptimisticOracle` + `MADDisputeVoting` (Phase A commit-reveal staked-$MADx voting, 5,000-$MADx threshold) — **merged, but merged ≠ deployed on-chain**.

Perp families live under `/api/v1/{faces,zeitgeist,epiphany,perps,registrar}`. Named-individual markets stay inert until the Phase-4 gate opens.

### 9. Open items & unresolved contradictions

**Founder-only decisions:**
- Promote `main` to production
- Neon quota — reset or upgrade plan, then remove `SKIP_MIGRATIONS`
- Attach `madgambit.io`
- npm registry egress allowlist (blocks dependency work in agent sessions — see Part V)
- GitHub Advanced Security toggles
- Push `v2.24-constellation` tag (git-proxy blocked in-session)
- Phase-4 named-subject gate: KMS choice, `MADPortraitKeyRegistry` deploy, 6 signed-off `registry_readiness` rows

**Unresolved contradictions — worth closing:**
1. **$MADx supply.** Canon says 888,888,888 fixed. The deployed Arbitrum One contract has a **mutable, mint-on-purchase** supply, cap 224,573,096, Pausable. Two candidate addresses appear across the archive (`0xb61ae772…fd18` Crystex fair-launch, and `0x6972370e…151f` used as the `lib/contracts.ts` fallback). This needs an on-chain check and one written answer.
2. **Chain topology.** Current work targets Arbitrum One (42161) only, but `CANONICAL_NUMBERS.md` restates Nova (gameplay) + One (vaults/$MADx) + HyperLiquid as founder-locked, and `contracts/foundry.toml` still configures an `arbitrum_nova` RPC. Either Nova is retired and the config is cruft, or it isn't.
3. **Token distribution split** — see §7.
4. **Card rarity taxonomy** — NFT docs use 7 tiers / 992 cards; later tokenomics docs use 6 tiers with different distributions. Relabel or genuine divergence, unknown.
5. **Auth history.** The entire business/pitch archive plans Privy + Alchemy AA-SDK; the app shipped custom SIWE. The pivot was never written down. Noted here so it stops resurfacing.

**Product backlog:** THE WIRE still demo-row · raw-hex design-token scrub (~82 values, 5 panels) not started · 4 dead components undecided · benchmark series undefined · slot-auction clearing still manual.

---

## PART III — FRONTEND QOL BENCHMARK (top 12)

Benchmarked 2026-08-16 against `verify/`. **SHIPPED** (done well) · **PARTIAL** (exists, gaps) · **ABSENT** (nothing in tree). Evidence is a real grep, not an estimate.

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 1 | Variable-reward schedule on a non-linear ladder | **SHIPPED** | `gambit-game-math.ts` `VRS_TRIGGERS=[5,8,13,21,34]`, `streakReward` 1.3x→3.2x; `session-vrs.ts` persists streak, Fibonacci-ms durations (610/987/1597/2584/4181), Fibonacci particle counts (24/48/88/144/233) |
| 2 | Celebration / juice layer | **SHIPPED** | `joy-layer.tsx`, `vrs-toast.tsx`, `dopamine-glyphs.tsx`, shared `animate-vrs-burst` + `animate-gold-jackpot` keyframes |
| 3 | Reduced-motion accessibility | **SHIPPED** | 20+ call sites honor `prefers-reduced-motion`. Genuinely well done — usually the first thing teams skip |
| 4 | Haptics | **PARTIAL** | `navigator.vibrate` in `main-nav` (6ms), `bottom-nav` (8ms), `zliar-section` (12ms) only. Missing on pack open, VRS trigger, bet confirm, evolve |
| 5 | Audio | **PARTIAL** | Web Audio in `joy-layer.tsx` + `use-rip-sound.ts`. **No global mute/volume, no persistence** |
| 6 | Optimistic UI | **ABSENT** | **Zero** `useOptimistic`/`useTransition`/`startTransition`. Every mutation waits a full round-trip |
| 7 | Streaming / Suspense + skeletons | **ABSENT** | **Zero** `<Suspense>`, zero `loading.tsx`, zero skeletons. App Router streaming unused |
| 8 | Error boundaries | **ABSENT** | **Zero** `error.tsx`. Any server-component throw → default Next error page |
| 9 | Route-level code splitting | **ABSENT** | **Zero** `next/dynamic`/`React.lazy` across 93 components / 19,455 lines. `conviction-charts.tsx` is 1,965 lines + `recharts`; `three` + `@react-three/fiber` eagerly bundled |
| 10 | Font optimization | **ABSENT** | **Zero** `next/font`. Orbitron/Rajdhani not preloaded → FOUT + CLS on first paint |
| 11 | Image optimization | **PARTIAL** | 2 `next/image` importers vs 4 raw `<img>`; 25 card PNGs + brand assets unoptimized |
| 12 | View Transitions | **ABSENT** | **Zero** `startViewTransition`. Route changes are hard cuts — card→detail morph is the obvious unclaimed win |

**Read of the result.** The reward/celebration layer (1–3) is stronger than most production apps. The *engineering* QOL layer (6–12) is almost entirely unbuilt. **The app feels good once rendered, and slow getting there.** Every gap in 6–12 is standard React 19 / Next 16 surface the project already has dependencies for — no new libraries needed.

### Compliance boundary — read before actioning 1–5

Two standing constraints govern this area and were written deliberately:

- Master-plan suppress-list: *"'dopamine / VRS / novelty-seeking' neuroscience framing in any external doc"* — never reintroduce.
- `lib/joy-engineering.ts` header: *"This module adds NO new hidden mechanics and NO neuroscience framing… we keep the game-economy mechanic and drop the clinical 'dopamine / anticipation-circuit' language."*

The mechanics stay; the clinical framing stays out of anything user- or investor-facing. This document is internal and names them plainly — the moment any of it reaches a deck, whitepaper, or marketing surface, it must be reworded to game-economy language.

**One mechanic needs a decision, not silent expansion.** `dopamine-engine.tsx` implements a near-miss band (`const isNear = !won && roll < 0.58`) — a loss rendered as an almost-win. On free-play credits that is ordinary game feel. On a **real-money** market it is the single most regulated pattern in this space: near-miss recruits the same reward circuitry as a win while the user actually lost money, and it is precisely what gambling regulators and the dark-pattern literature target. **Recommendation:** confine near-miss to `madCredits`/demo surfaces, never render it against real `$MADx` stakes, and make that boundary explicit in code. Unchanged pending your call.

---

## PART IV — CHAINLINK VRF AUDIT

`vrf.chain.link` and `docs.chain.link` are both blocked by this environment's egress policy. This audit is built from the VRF v2.5 documentation surface via search plus a direct read of `contracts/`. Nothing was routed around the block; concrete on-chain constants (coordinator address, key hash) are marked **‹verify›** and must be read off live docs before implementation.

### What the subscription page is

`vrf.chain.link/<network>/new` is the VRF Subscription Manager: it creates a **subscription** — a funded account paying for randomness requests, holding balances in LINK and (v2.5) native gas token. You fund it, register **consumer** contracts against its numeric ID, call `requestRandomWords(...)`, and the coordinator calls back `fulfillRandomWords(requestId, randomWords)`. Sepolia is the rehearsal for the identical mainnet flow.

### The gap is real

No VRF anywhere in `contracts/src/` — 11 contracts, zero VRF imports. Randomness that *should* be provable is `Math.random()`:

| Call site | Decides | Exposure |
|---|---|---|
| `gambit-game-math.ts:615` — `const vrfResult = Math.random() * 100 + fibReward` | Card evolution | The variable is literally named `vrfResult`; the intent was always VRF |
| `api/v1/cards/evolve/route.ts:34` | — | Comment concedes: *"uses Math.random; the real roll is on-chain VRF, Phase-3 gated"* |
| `api/v1/cards/open-pack/route.ts` | Pack rarity, slot-0 guarantee | **`userNonce` read from the request body** — grindable |
| `api/v1/tournament/match/route.ts:50-65` | Match outcome, opponent power, rank | Server-side `Math.random()` |
| `gambit-game-math.ts:733-734, 970` | Shield premium band, scenarios | Server-side `Math.random()` |

### Value assessment — medium-high and above only

**HIGH — provable pack/card randomness.** Packs and evolution are the monetized RNG surface; "provably fair" is a marketable property, and the code already anticipates it. Requires the mint/evolve path to settle on-chain (`MADCard1155`/`MADCard721` exist) — VRF behind a route that writes only to Postgres proves nothing to a user.

**HIGH — VRF v2.5 native-token payment.** v2.5 subscriptions hold two balances (LINK and native), and premium moved from a flat fee to a percentage of callback gas. On Arbitrum One the whole flow can be funded in ETH — no LINK acquisition or treasury management.

**MEDIUM-HIGH — random juror selection in `MADDisputeVoting.sol`.** The most defensible non-obvious use: it removes "who resolves this market" as a manipulation surface on the optimistic oracle. Worth doing *before* tournament randomness.

**MEDIUM-HIGH — tournament seeding.** One VRF draw per round, per-match outcomes derived deterministically from that seed. Per-match requests are not economical.

**Explicitly not worth it:** VRF for market *resolution* (factual events — that's the oracle's job) · cosmetic randomness · anything settling only to Postgres.

### Cost & latency reality

Arbitrum callback cost is dominated by L1 calldata posting, and v2.5 prices premium as a percentage of callback gas — so cost per request is **variable and must be estimated on the target lane**, not assumed. Budget for subscription funding, a per-consumer callback gas limit, and 3+ block confirmations of latency. **Pack opening therefore cannot stay synchronous** — which is why the async-UX gaps below are prerequisites, not parallel work.

---

## PART V — TACTICAL IMPLEMENTATION PLAN

Sequenced by dependency. Governing constraint: **VRF makes pack-opening asynchronous**. Shipping it onto today's synchronous UI would replace an instant pack-open with an unexplained multi-second freeze — a downgrade. So QOL items 6/7/8 come first. Effort is engineer-days. Each phase is independently shippable and revertible.

### Phase 0 — Fairness bug (0.5 day, no dependencies)

Do this regardless of everything else; it is a live grindable-RNG hole.

1. `api/v1/cards/open-pack/route.ts` — stop trusting `body.userNonce`. Derive it server-side from `auth.owner` + a persisted per-wallet pack counter.
2. Same file — `madxBalance` is read from the request body (the route's own comment calls the check "decorative"). Either wire it to a real server-side balance source or delete it so it stops implying a guarantee it doesn't provide.
3. Add a regression test asserting two calls with an identical client-supplied nonce don't produce identical rarities.

**Exit:** pack outcomes are not caller-influenced. No UI change.

### Phase 1 — Perceived-performance foundations (2–3 days)

4. **Error boundaries** — `app/error.tsx` + `app/global-error.tsx`. On a money-handling product, the default Next error page reads as "site is broken."
5. **Streaming + skeletons** — `app/loading.tsx`, then per-route for `dashboard`, `markets`, `workbench`, `octavian`. Wrap slow data-dependent subtrees in `<Suspense>`; size skeletons to final layout so nothing shifts on hydrate.
6. **Font pipeline** — move Orbitron/Rajdhani to `next/font` in `app/layout.tsx`. These are brand-identity fonts currently causing FOUT on every cold load.
7. **Code splitting** — `next/dynamic` for `conviction-charts.tsx` (1,965 lines + `recharts`), `octavian-mesh.tsx` and anything pulling `three`, `perp-dials.tsx` (980 lines). `ssr: false` only where genuinely client-only (WebGL).
8. **Images** — convert the 4 raw `<img>`; route `public/cards/*` and `public/brand/*` through the optimizer with explicit dimensions.

**Exit:** measurably better LCP/CLS on the Speed Insights already wired in `app/layout.tsx`. **Take a before/after reading — this phase is worth nothing unmeasured.**

### Phase 2 — Interaction feel (2 days)

9. **Optimistic UI** — `useOptimistic` + `startTransition` on bet placement, `$MADx` transfer, card evolve, conviction tap. React reverts automatically on failure; pair each with a rejection toast reusing `vrs-toast.tsx` rather than adding a second toast system.
10. **Haptics coverage** — promote the 3-site `navigator.vibrate` pattern into one helper; fire on VRS node hit, pack rip, evolve result, bet confirm. Gate on `prefers-reduced-motion` for consistency.
11. **Audio** — add persisted global mute/volume, **defaulting to off**. Today `joy-layer` and `use-rip-sound` can make noise with no user control, the most common cause of a closed tab.
12. **Keyboard/focus** — only 3 `focus-visible` treatments against 92 `aria-` attributes. Add visible focus rings to the shared primitives in `components/ui/`.

**Exit:** every mutation echoes instantly; nothing makes sound without consent.

### Phase 3 — VRF on Sepolia (3–5 days)

Start only once Phases 1–2 provide a pending state worth showing.

13. **Read live config ‹verify›** — Arbitrum Sepolia VRF v2.5 coordinator address, key hash, min confirmations, max gas limit, from Chainlink docs. Do not hardcode from memory.
14. **Create + fund the subscription** for Sepolia; note the ID. Fund with testnet LINK *and* native to rehearse the v2.5 dual-balance model.
15. **Consumer contract** — new `contracts/src/MADRandomness.sol`: inherit `VRFConsumerBaseV2Plus`, import `VRFCoordinatorV2_5`, implement `fulfillRandomWords(uint256, uint256[] calldata)`, use `VRFV2PlusClient.RandomWordsRequest` with `extraArgs` setting `nativePayment` explicitly. Keep it a **generic seed provider** with per-consumer request accounting — do not fold pack logic in.
16. **Seed-parameterize the rarity math** — the key refactor. `openCardPack` / `attemptEvolution` become pure functions taking `seed: bigint`, so the identical function runs off a VRF word on-chain and a server seed in demo mode. `gambit-game-math.ts:615` becomes `seedToUnitInterval(seed) * 100 + fibReward`.
17. **Foundry tests** with a mock coordinator: request→fulfil happy path, fulfil-twice rejection, callback-gas exhaustion, and the slot-0 ≥Uncommon guarantee holding across a large sampled seed space. `foundry.yml` + Slither gate these automatically.
18. **Async pack UX** — request (optimistic "sealed pack shaking") → pending → reveal on callback. The existing `use-rip-sound` + `pack-opening.tsx` choreography suits covering the wait; the anticipation gap is a feature *provided it's shown*, not a frozen button.

**Exit:** provably-fair pack open demonstrable end-to-end on Sepolia.

### Phase 4 — Mainnet + the higher-value oracle use

19. Re-run step 13 against **Arbitrum One**; budget subscription funding against real callback-gas premium — estimate on the actual lane, don't extrapolate from Sepolia.
20. **Random juror selection** in `MADDisputeVoting.sol` — do this before tournament randomness.
21. **Tournament seeding** — one draw per round, matches derived deterministically.

---

## WORKSTREAM B — Exterior Workbench Experience

Independent of Phases 0–4 above; touches the desktop-only space *outside* the phone frame. Numbered separately to avoid colliding with the VRF/QOL phase numbers.

### B-Phase 1 — Octavian mesh: size, shared state, firefly anomalies (2–3 days)

Target: `components/ov-conviction-state-node.tsx` → the `OctavianOrb` sub-component (shipped in PR #80), plus `lib/instrument-chrome.ts` and `components/octavian-mesh.tsx`.

**B1.1 — Resize to the perps-deck container idiom.**
The perps deck container (`perp-dials.tsx:714`) is the size/shape reference: `borderRadius: 24`, `padding: clamp(10px, 1.4vw, 16px)`, gradient `--pn`→`--bg` background, 1px `--tx`-mix border, dual box-shadow (gold rim + cyan bloom). Its instruments size off `maxWidth: calc(252px * var(--dial, 1))` with `aspectRatio: 280/168`. Lift that container into a shared primitive rather than copy-pasting the literals a third time — `instrument-chrome.ts` already exists precisely for this kind of extraction (it took `fibonacciSphere`/`resolveColor`/`P3` out of `octavian-mesh.tsx` in PR #80). Give the exterior orb the same container and a `--dial`-equivalent scale variable.

**B1.2 — Share container state + zoom.** ⚠️ *This reverses a deliberate decision — read before implementing.*
`ov-conviction-state-node.tsx` is currently rendered as a **sibling** of `.mg-device`, explicitly so it is *not* affected by `--mg-device-zoom` (its header documents this, following the `.mg-zoombar` convention). Making it share the phone's zoom means either:
- **(a)** consume `--mg-device-zoom` in the orb's own container while staying a sibling — keeps `position: fixed` and safe-area insets working, scales with the phone; **recommended**; or
- **(b)** move it inside the zoomed subtree — simpler conceptually, but it inherits phone clipping and its fixed-position/safe-area layout stops behaving.

Take (a). Then unify the state: the full `/octavian` mesh keeps orbit state in a ref (`orbit = { yaw, pitch, spin, dragging, lx, ly }`) so pointer moves don't re-render; the corner orb has only `yaw` and auto-spin. Hoist that orbit state into one shared hook (`hooks/use-octavian-orbit.ts`) consumed by both, so drag/zoom in one is reflected in the other. Keep `NODE_IDS`/`EDGE_STEPS`/`fibonacciSphere` as the single source of node placement — do not fork the geometry.

**B1.3 — Spheres → firefly star anomalies.**
Today each node renders as a uniform circle at a fixed `fibonacciSphere` point. Wanted: varied, bright, natural star-like bodies that drift and dart like fireflies. Implementation shape:
- **Per-node identity** — derive a stable seed per `NodeId` (hash the id, don't `Math.random()` — it must survive re-render and match server paint). From it derive size, hue offset within the active skin's accents (`resolveColor` against `--ac`/`--a2`/`--gd`), corona spread, and base brightness. Variety comes from the seed, not from randomness at draw time.
- **Star rendering** — replace the flat circle with a layered radial-gradient core + 4/6-point diffraction spikes + soft bloom, sized off the seed. Cheap in 2D canvas: one `createRadialGradient` per node plus two crossed gradient strokes for spikes.
- **Firefly motion** — offset each node from its Fibonacci anchor by a small wander vector: two summed sine terms at incommensurate frequencies (per-node phase from the seed) gives organic drift without a physics step. Layer an occasional "dart": a low-probability per-node impulse eased over ~400–700ms toward a nearby point, then relax back to the anchor. Anchors stay authoritative so the mesh never structurally deforms and edges keep meaning.
- **Bioluminescent pulse** — brightness on its own slow sine, *desynchronised* per node (again seed-phased). Fireflies read as alive because they're out of phase; synchronised blinking reads as a loading spinner.
- **Reduced motion** — `prefers-reduced-motion` must pin every node to its anchor at constant brightness. Non-negotiable: the codebase honours this at 20+ sites and this is the most motion-heavy thing in it.
- **Perf budget** — 20 nodes × (gradient + spikes + bloom) per frame on the existing `runInstrumentLoop`. Profile it; if it costs, pre-render each distinct star to a small offscreen canvas once and blit per frame.

**Exit:** exterior orb matches perps-deck container sizing, tracks phone zoom, and reads as a living constellation rather than a dot-graph — with motion fully suppressed under reduced-motion.

### B-Phase 2 — O-V deck → interactive exterior experience (4–6 days)

Source: `verify/public/pitch/ov-pitch-deck.html` (182KB, the O-V deck; `index.html` and `madhats-gambit.html` are the other two preserved decks).

**B2.1 — Its 12 sections, as scanned:**
1. MΛĐ Gambit llc. (hero) · 2. MΛĐĐΞX ($MΛĐx) Launch · 3. Production & Speculation · 4. MAD Upshot: The Card Economy · 5. MAD Shield Protection · 6. Triple-Threat Oracle Cascade · 7. $MADx Tokenomics · 8. Defensible IP & Cap Table · 9. The Golden Stack: $0 Infrastructure · 10. Vanguard Synergy & Co-Building · 11. The Ask: Strategic Partnership Offer · 12. Claim Your Co-Development Pass

**B2.2 — Two blockers to resolve before building.** Both are content problems, not engineering ones:
- **Slides 8, 10, 11, 12 are investor-facing** (cap table, co-building, the ask, co-dev pass). The exterior workbench is a *user* surface. Surfacing fundraising material there leaks it to every visitor. **Recommendation: map only slides 2–7 and 9** to the exterior; keep 1 as ambient branding; gate 8/10/11/12 behind an explicit investor route or drop them.
- **Slide 4 says "MAD Upshot"** — a name `CANONICAL_NUMBERS.md` marks **deprecated, do not use**. The deck predates that rule. Retitle to the card-economy language before it reaches a user surface, or the app will contradict its own canon.

**B2.3 — Bind sections to registry nodes, don't invent state.**
`lib/node-registry.ts` (20 nodes) is already the state source the HUD reads, and several deck sections map straight onto existing node IDs — `tokenomics`, `fee-waterfall`, `staking`, `madconv`, `markets-all` are already used by `LEGEND_IDS`. Map each retained deck section to its corresponding node; where a section has no node, add one to the registry rather than special-casing the component. The registry is a synchronous import, so this stays fetch-free like the current HUD.

**B2.4 — Interaction model.**
Position section panels around the phone exterior on the same convention as `.mg-zoombar` and the existing HUD: `position: fixed`, safe-area insets, `z-index: 50`, glass panel, self-gated on `isDesktop` (`DESKTOP_MIN = 1024`) — there is no exterior space below that width, and the whole feature must no-op on mobile. Selecting a firefly node in B-Phase 1's mesh focuses its corresponding section; selecting a section highlights its node. That reciprocal link is what makes it a *secondary experience* rather than a sidebar — one shared selection state, two representations.

**B2.5 — Content extraction.**
Do not parse 182KB of Angular-generated HTML at runtime. Extract the 7–8 retained sections into a typed module (`lib/ov-deck-content.ts`) at build/author time — headline, 2–4 synthesized bullets, the node ID it binds to, accent. Synthesize the copy against Part II §7 canonical numbers, not the deck's own figures: the deck is older than the April canon and several of its numbers are in the superseded table.

**B2.6 — Reuse, don't duplicate.** `components/ov-deck-selector.tsx` already exists (3 named deck versions driving live conviction math via `OV_DECKS`/`calculateDeltaLimit`). Check whether the new selector should extend it rather than adding a second deck concept with the same name.

**Exit:** a desktop-only exterior experience where the Octavian constellation and the deck sections are two views of one selection state, carrying only user-appropriate content at canonical numbers.

### Explicitly not doing

VRF for market resolution · VRF for cosmetic randomness · VRF behind Postgres-only routes · expanding near-miss onto real-money surfaces (founder decision, see Part III) · surfacing investor-only deck slides on a user surface (B2.2).
