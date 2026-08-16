# MAD Gambit — Master Document

> **Single source of truth for the current Vercel + Neon + GitHub + Claude Code iteration.**
> Consolidated 2026-08-16 from ~150 scattered planning documents, which were deleted in the
> same commit. Git history retains every one of them if something here proves thin.
>
> **Outstanding work is PART 0, immediately below** — decisions, blockers and the build queue,
> ordered by who can act. Everything after it is reference.
>
> **This is the only planning document.** Maths (Part VI), the tokenomics engine room (Part VII)
> and the deck lineage (Appendix A) were folded in on 2026-08-16 — there is no second file to
> check. Do not create one.
>
> Outside its scope by design, and untouched: each subproject's own docs (`verify/docs/`,
> `contracts/madhat-core/`, `master-maths/`), live tooling config (`.claude/`, `.agents/`), and
> the decks themselves (`verify/public/pitch/*.html`).

---

## PART 0 — START HERE: OUTSTANDING WORK

*Everything currently open, ordered by who can act. The rest of this document is the reference
this part points back to. When an item here is done, delete it from here — don't let this grow
into a second changelog.*

## 1 · Where things stand

Merged and live on `main`:

| Area | State |
|---|---|
| **Docs** | ~150 planning docs consolidated into `MAD_GAMBIT_MASTER.md`. 114 files / ~36.5k lines removed, inbound links repaired. |
| **Maths** | Part VI (canonical algorithms, code-bound) + Part VII (the tokenomics engine room). Both live in this file. Do not create a separate maths doc. |
| **Octavian** | One creature across all mounts (`octavian-creature.tsx` + `lib/octavian-state.ts`): shared mood/orbit/zoom/selection, firefly star swarm, live platform-activity feed, reduced-motion. |
| **CI** | 11 checks. `actions/checkout` on v6. Agentic-compile false-green fixed. |
| **Repo** | Verified complete: working tree fully committed; `.gitignore` excludes only secrets, Vercel link artifacts and build products. |

**Verified green at merge:** Type-check, Lint, Build, Unit tests, Route-guard, guard, Secret scan,
Dependency review, forge build + test, Slither, Vercel Preview — plus both Vercel previews Ready.

**But green ≠ done.** Lint, Slither and Dependency Review are **report-only** (Slither has ~135
untriaged findings — green means "ran"). Nothing blocks merge until branch protection requires
these checks on `main`. And the Octavian creature **merged without any human ever looking at it**.

---

## 2 · Do these first

### 2.1 — Visual pass on the Octavian creature 🔴 *it's live and unreviewed*
It compiles, lints, type-checks, builds and passes tests. None of that catches a canvas that
renders wrong. Look at `/octavian`, the `/preview` inline mesh, and the desktop corner HUD.

Three tuning constants, all one-liners in `components/octavian-creature.tsx`:
- `bloomR` — bloom scale. Most likely too generous at HUD size, where the orb is small.
- `reach` — diffraction-spike length. Watch for "noise" rather than "star".
- `swarm` (in the draw loop) — firefly drift amplitude. Should read alive, not jittery.

Also confirm `prefers-reduced-motion` actually pins the swarm.

### 2.2 — `open-pack` fairness bug 🔴 *live, exploitable, half a day*
`verify/app/api/v1/cards/open-pack/route.ts` reads `userNonce` **from the request body** (default
`Math.random()`), so pack rarity is grindable by retrying nonces. Derive it server-side from
`auth.owner` + a persisted per-wallet pack counter. Same file: the `madxBalance` check also reads
from the body — the route's own comment calls it "decorative". Either wire it to a real
server-side balance or delete it so it stops implying a guarantee. Add a regression test asserting
two identical client nonces don't produce identical rarities.

---

## 3 · Decisions only you can make

| Item | The tension |
|---|---|
| **`@neondatabase/serverless`** | You asked to install it + add a `neon()` helper. **ADR-008 (2026-08-05) explicitly evaluated and rejected exactly that**, mandates `pg` Pool + Route Handlers, and is marked *"Settled. Do not reopen without a new ADR superseding this one."* Options: (a) drop it, ADR stands — **my recommendation**; (b) write a superseding ADR; (c) use the ADR's own escape hatch — one edge-latency-sensitive route, its own ADR, never the default. |
| **Near-miss on real-money surfaces** | `dopamine-engine.tsx` renders some losses as almost-wins (`isNear = !won && roll < 0.58`). Ordinary game feel on free-play `madCredits`; on real `$MADx` stakes it is the single most regulated pattern in this space. Recommendation: confine to credits/demo, make the boundary explicit in code. Unchanged pending your call. |
| **Promote `main` to production** | `vercel.json` sets `git.deploymentEnabled.main = false`; production deploys are manual. |
| **`$MADx` supply** | Canon says 888,888,888 fixed. The deployed Arbitrum One contract is mutable/mint-on-purchase, cap 224,573,096, Pausable. Two candidate addresses in the archive (`0xb61ae772…fd18`, `0x6972370e…151f`). Needs an on-chain check and one written answer. |
| **Chain topology** | Work targets Arbitrum One only, but canon restates Nova + One + HyperLiquid as founder-locked and `contracts/foundry.toml` still configures `arbitrum_nova`. |
| **Token distribution split** | April canon (35/20/15/10/10/10) vs March "vFinal" (45/15/15/15/10). |
| **O-V deck — 2 canon conflicts** | `MADdegen/OV-Deck-2026` says **"Wyoming L.C."** (slides 0, 7) against a **New Mexico** formation record filed 2026-03-25 — a legal-entity fact on an investor slide. And slide 3 reintroduces **"MAD Upshot"**, which canon bans; the deck is *newer* than the ban. *(A third conflict — the Creator Ladder — turned out to be the master doc's error, not the deck's; already corrected.)* |
| **React18 / Hono / HonoX** | Never clarified. `verify/` is already Next.js 16 + React **19.2.1** + Tailwind v4, live. Hono/HonoX appears once in the whole archive as a speculative Phase-4 API-gateway idea — not a frontend, not tied to React 18. |
| **Containerizing the platform** | Asked for, deliberately not started: an architectural reversal for a Vercel-native Next.js app. I'd want your reasoning first. |

---

## 4 · Blocked on access no agent has

| Item | Blocker |
|---|---|
| **Neon three-database merge** | `mad-mpp-2-23-postgres` (target), `Neon-DB-MADMPP`, `neon-sky-park`. Ordered procedure + read-only inspection SQL in **Part II.5 below**. Agents cannot reach `*.neon.tech` (403) or TCP 5432. Until this completes there is **no single source database**, so "sync the DBs" has no well-defined target. Correct sequence: merge → `npm run schema:verify` → commit any drift as `verify/sql/0015_*.sql`. Schema-as-code is already complete: 14 migrations + `schema-verify.mjs` checking the ledger, pgvector and 39 named tables. |
| **Generate the two `.lock.yml` files** | `gh aw compile`, then commit `agentic-security-review.lock.yml` + `agentic-quality-review.lock.yml`. Until then **both AI review gates are configured but never run**. The Actions `GITHUB_TOKEN` is *correctly* forbidden from writing `.github/workflows/` — needs a human push or a session with real push credentials. |
| **eslint / eslint-config-next / @types/node realignment** | `eslint-config-next` is pinned at **15.4.5** while `next` resolves to **16.2.9** (and it's the only dep without a caret); `eslint` is **8.x, EOL** — config 16.x wants ESLint 9 + flat config, so those two move together; `@types/node` is **20.x** against `engines.node: 22.x`. Needs a lockfile regen — the sandbox 403s the npm registry, and hand-editing `package-lock.json` breaks `npm ci` on every job. Because Lint is report-only, the stale config is silently under-checking a Next 16 codebase rather than failing. |
| **Founder-gated ops** | Rotate/confirm `NEON_API_KEY` · attach `madgambit.io` · GitHub Advanced Security toggles · push `v2.24-constellation` · Phase-4 named-subject gate (KMS choice, `MADPortraitKeyRegistry` deploy, 6 signed `registry_readiness` rows). |

---

## 5 · Build queue, in dependency order

Full detail — file paths, exit criteria — in ****Parts III–V + Workstream B below****.

| Phase | Item | Effort |
|---|---|---|
| **0** | `open-pack` fairness bug (Part 0 §2.2) | 0.5d |
| **B1-rest** | Octavian perps-deck container sizing — adopt the `perp-dials.tsx:714` idiom (`borderRadius: 24`, `clamp(10px,1.4vw,16px)` padding, a `--dial`-style scale var) and lift it into `lib/instrument-chrome.ts` rather than copy-pasting a third time. Plus the visual pass (Part 0 §2.1). | 0.5d |
| **1** | Perceived-performance foundations: `error.tsx` + `global-error.tsx`, `loading.tsx`/Suspense + skeletons, `next/font`, `next/dynamic` code splitting (93 components / 19,455 lines ship eagerly today), image optimization. **Measure LCP/CLS before and after or it's worthless.** | 2–3d |
| **2** | Interaction feel: `useOptimistic` on mutations, haptics on the moments that matter, persisted audio mute (**default off**), focus rings (only 3 `focus-visible` vs 92 `aria-`). | 2d |
| **3** | VRF on Sepolia: seed-parameterize `openCardPack`/`attemptEvolution`, `contracts/src/MADRandomness.sol` on `VRFConsumerBaseV2Plus`, Foundry tests with a mock coordinator, async pack UX. Coordinator address + key hash marked **‹verify›** — read off live Chainlink docs, they were egress-blocked here. | 3–5d |
| **4** | VRF mainnet + **random juror selection** in `MADDisputeVoting.sol` (the most defensible non-obvious use — removes "who resolves this market" as a manipulation surface). | — |
| **B2** | O-V deck → exterior interactive experience, bound to `node-registry` state. Source is the **`MADdegen/OV-Deck-2026` repo** (`src/slidesData.ts`, structured, plus 8 ready-built interactive components) — *not* the older HTML export. Blocked on Part 0 §3's deck conflicts. | 4–6d |
| **—** | Security gaps: **CSP header** and **ERC-4337 session keys** — the two genuine holes in the 8-layer map. | — |
| **—** | Promote Lint / Slither / Dependency Review from report-only to blocking, once their backlogs are worked. | — |
| **—** | Carried from the repo: THE WIRE demo-row · raw-hex design-token scrub (~82 values, 5 panels) · 4 dead components · slot-auction clearing is manual. | — |

**Sequencing constraint:** VRF makes pack-opening asynchronous (request → 3+ confirmations →
callback). Shipping it onto today's synchronous UI replaces an instant pack-open with an
unexplained freeze. **Phases 1–2 are prerequisites for Phase 3, not parallel work.**

---

## 6 · Environment constraints — these will hit the next session too

| Blocked | Evidence | Consequence |
|---|---|---|
| `registry.npmjs.org` | direct `curl` → **403** (host is in `no_proxy`, so it's egress policy, not the proxy) | No `npm install`, no local typecheck. **Never hand-edit `package-lock.json`** — CI runs `npm ci`. |
| `vrf.chain.link`, `docs.chain.link` | proxy `EGRESS_BLOCKED` | VRF constants marked **‹verify›** must be read off live docs. |
| `*.neon.tech`, TCP 5432 | 403 / unreachable | No agent can inspect or merge the databases. |
| `github.com` (WebFetch) | `EGRESS_BLOCKED` | Can't check action release notes — why `setup-node@v4`, `upload-artifact@v4`, `dependency-review-action@v4` were left alone. WebSearch still works. |
| Cross-org `add_repo` | *"cross-tier adds are not supported"* | Session scoped to `maddegen`; `The-MDC/*` repos unreachable. |
| v0 MCP server | disconnected | Couldn't query v0 chats (Part 0 §7). |

---

## 7 · Things a future session will get wrong without this

- **`octavian-mesh.tsx` does not exist.** Merged into `octavian-creature.tsx` (`compact`/`full` variants). Zoom, two-axis orbit, click-select, pop-out, mood system, shared state and the firefly swarm **all already ship** — don't rebuild them.
- **The build no longer runs migrations.** `next build` only; migrations are a controlled `npm run migrate:deploy`. Don't set `SKIP_MIGRATIONS` on Vercel.
- **The `$MADx` transfer vulnerability is FIXED.** A stale-tree review reported it open; all seven `madx` routes use `lib/madx-route-auth.ts`. **Do not re-fix it.**
- **The `.agents/` swarm verdicts are static-only.** All four 2026-07-01 milestones returned CLEAN, but every shell command in that run timed out — nothing was ever executed.
- **Placeholder stubs — do not restore:** `lib/auth/siwe.ts`, `app/api/session-keys/*`, `SessionKeyManager.tsx`, root `middleware.ts`. Do **not** re-add `ai-backend/.../auth.py` — it forks a second auth path.
- **Next 16 renamed `middleware.ts` → `proxy.ts`.**
- **Creator Ladder (28.8/40/60% by status) is canon**, not the flat 40% — founder sign-off 31 Jul 2026, recorded in `verify/lib/node-registry.ts`, implemented as `CREATOR_LADDER`.
- **Octavian's origin is Google AI Studio lineage, not Vercel v0.** Zero v0 fingerprints anywhere; three `metadata.json` files carry the AI Studio app-builder schema. Unverified only because v0 chats and `The-MDC/v0-open-in-v0-023b047d` were unreachable — to close it, start a session with that repo as the initial source and diff against `octavian-creature.tsx`.
- **Compliance:** the mechanics stay, the clinical neuroscience framing stays out of anything user- or investor-facing. Internal docs may name them plainly; decks and marketing may not.
- **Morpho / Aerodrome:** no such repos. Morpho returned zero across ~190; the Aerodrome lookup needed approval and never ran.

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
- **2026-08-14** — The Octavian visual becomes a *living* mesh. Lineage: a 2026-07-13 Three.js/R3F/WebGPU "Master Octavian" experiment (Vulkan-derived pipeline notes, shader + bundle optimization) → the 2D-canvas `octavian-mesh.tsx` shipped 2026-08-07 in PR #63 → `72dccda` static high-fidelity orb → `fb73122` two-axis weave → **`11b8a6f` the living-mesh moment**: a three-tier pointer-driven mood system (idle cool topaz/emerald/cyan → agitated yellow/green/blue → yellow/orange/red, fastest spin, pitch tipping away as if not wanting to be bothered), decaying back to idle on its own. The palette layering is explicitly modelled on **cephalopod chromatophore-over-iridophore skin** — cool/structural at rest, pigment-dominant when agitated — not an arbitrary colour pick. `bb99269` then merged both visuals into one engine. Note: no trace of this originates in the O-V deck repo; it is native to this codebase.
- **2026-08-14** — PR #80 merged (O-V HUD + stale-Supabase doc cleanup). Neon project split resolved to a concrete cause: **three** live Postgres databases under one integration, needing a founder-run merge (Part II.5). Migrations removed from the Vercel build in favour of a controlled `migrate:deploy`; `main` auto-deploy disabled; two advisory AI review gates added via gh-aw.
- **2026-08-16** — This consolidation; frontend QOL benchmark and Chainlink VRF audit (Parts III–V). Later the same day: PR #91 merged (Octavian cephalopod creature + CI fixes), then the session handoff, the maths master, the engine-room formulas and the deck lineage were all folded in here as PART 0, Parts VI–VII and Appendix A — leaving this as the single planning document.

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
| Creator revenue share | **Creator Ladder 28.8% → 40% → 60%** by status (User / MinorCreator / CR8TR), creator-made markets **only**. Supersedes the flat 40% — founder sign-off 31 Jul 2026, recorded in `verify/lib/node-registry.ts` and implemented as `CREATOR_LADDER` in `gambit-game-math.ts`. |
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

### B-Phase 1 — Octavian mesh: size, shared state, firefly anomalies (1.5–2 days)

> **Re-scoped 2026-08-16 against current `main`.** `octavian-mesh.tsx` **no longer exists**: commit `bb99269` merged both visuals into one engine, `components/octavian-creature.tsx`, with `variant="compact"` (workbench corner HUD) and `variant="full"` (`/octavian` + inline on `/preview`). Two of the three things originally scoped here already shipped — see below — so this phase is smaller than first written.

**Already shipped, do not rebuild:** wheel + pinch zoom (`ZOOM_MIN = 1/6`, `ZOOM_MAX = 4`), two-axis drag-to-orbit, click-to-select, double-click pop-out overlay, and the three-tier creature-mood system. The container is already a "3D box" (layered shadow/inset, glass sheen, gold backing) at 3× the old 256px base, clamped 280–768px.

**B1.1 — Resize to the perps-deck container idiom.**
The perps deck container (`perp-dials.tsx:714`) is the size/shape reference: `borderRadius: 24`, `padding: clamp(10px, 1.4vw, 16px)`, gradient `--pn`→`--bg` background, 1px `--tx`-mix border, dual box-shadow (gold rim + cyan bloom); its instruments size off `maxWidth: calc(252px * var(--dial, 1))` with `aspectRatio: 280/168`. Replace the creature's current 280–768px clamp with that container and a `--dial`-equivalent scale variable. Lift the container into a shared primitive in `lib/instrument-chrome.ts` rather than copy-pasting the literals a third time — that module already exists for exactly this (it absorbed `fibonacciSphere`/`resolveColor`/`P3` in PR #80). Note the creature deliberately **never resizes its box on zoom** — only the rendered mesh scales (`R = min(w,h) * 0.42 * zoom * (1 - 0.05 * tierBlend)`); preserve that separation.

**B1.2 — Share state across mounts.** The remaining real gap. Zoom, orbit and mood all live in refs *inside* `OctavianCanvasPanel`, so every mount is independent — the header comment states plainly that "the popped-out instance is a separate mount with its own mood/orbit." Compact, full, and popped-out therefore drift apart. Hoist that state (`zoomRef`, orbit yaw/pitch, mood tier + decay clock) into one shared store — a module-level store with `useSyncExternalStore`, or context — so all mounts read and write the same values and prodding the corner orb is visible on `/octavian`. Keep `NODE_IDS`/`EDGE_STEPS`/`fibonacciSphere` as the single source of node placement; do not fork the geometry.

*Note on the phone zoom:* the HUD is a deliberate **sibling** of `.mg-device` so `--mg-device-zoom` does not scale it (documented in its header, following the `.mg-zoombar` convention). If you also want it to track phone zoom, consume `--mg-device-zoom` in the creature's own container **while staying a sibling** — moving it inside the zoomed subtree inherits phone clipping and breaks its fixed-position/safe-area layout.

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

**Source — use the repo, not the HTML.** The latest O-V deck is the private repo **`MADdegen/OV-Deck-2026`** (Vite + React, last commit 2026-07-31 `079fce0`), *not* `verify/public/pitch/ov-pitch-deck.html` — that HTML is an older Angular-generated export. The repo gives structured slide data in `src/slidesData.ts` (212 lines: `id`, `title`, `subtitle`, bullet arrays) so no HTML parsing is needed at all, and it already ships eight interactive components worth mining rather than reinventing: `CardDeckViewer`, `TokenomicsVisualizer`, `TripleThreatOracleVisualizer`, `DutchAuctionBooster`, `InteractiveSimulator`, `DataRoomDashboard`, `InteractiveCodePlayground`, `PresenterControls`.

**B2.1 — Its 12 slides (from `slidesData.ts`):**
0. MΛĐ Gambit L.C. (hero) · 1. MΛĐĐΞX ($MΛĐx) Launch · 2. Production & Speculation · 3. MAD Upshot: The Card Economy · 4. MAD Shield Protection · 5. Triple-Threat Oracle Cascade · 6. $MADx Tokenomics · 7. Defensible IP & Cap Table · 8. The Golden Stack: $0 Infrastructure · 9. Vanguard Synergy & Co-Building · 10. The Ask: Alignment and Runway · 11. Claim Your Co-Development Pass

**B2.1a — Three canon conflicts found in the deck. Resolve before any of it reaches a user surface:**
- **Wyoming vs New Mexico.** Slides 0 and 7 say "Wyoming L.C." twice. The formation record in this repo's archive says **MAD Gambit LLC was filed in New Mexico on 2026-03-25**. One of the two is wrong; this is a legal-entity fact on an investor slide, so it needs a definitive answer, not a merge.
- **"MAD Upshot"** (slide 3) is banned by the canonical brand rules (Part II.7) — and the deck is *newer* than the ban, so it was reintroduced rather than simply left stale.
- **Creator Ladder — RESOLVED, the deck is correct.** The deck's tiered creator fee "28.8–60% by status (User / MinorCreator / CR8TR)" is canon: `verify/lib/node-registry.ts` records a founder sign-off dated **31 Jul 2026** adopting the ladder over the flat 40%, and it is implemented as `CREATOR_LADDER` in `gambit-game-math.ts`. Part II.7 has been corrected — the master doc was stale here, not the deck. Two conflicts remain (Wyoming/New Mexico, "MAD Upshot").

**B2.2 — Two blockers to resolve before building.** Both are content problems, not engineering ones:
- **Slides 8, 10, 11, 12 are investor-facing** (cap table, co-building, the ask, co-dev pass). The exterior workbench is a *user* surface. Surfacing fundraising material there leaks it to every visitor. **Recommendation: map only slides 2–7 and 9** to the exterior; keep 1 as ambient branding; gate 8/10/11/12 behind an explicit investor route or drop them.
- **Slide 4 says "MAD Upshot"** — a name `CANONICAL_NUMBERS.md` marks **deprecated, do not use**. The deck predates that rule. Retitle to the card-economy language before it reaches a user surface, or the app will contradict its own canon.

**B2.3 — Bind sections to registry nodes, don't invent state.**
`lib/node-registry.ts` (20 nodes) is already the state source the HUD reads, and several deck sections map straight onto existing node IDs — `tokenomics`, `fee-waterfall`, `staking`, `madconv`, `markets-all` are already used by `LEGEND_IDS`. Map each retained deck section to its corresponding node; where a section has no node, add one to the registry rather than special-casing the component. The registry is a synchronous import, so this stays fetch-free like the current HUD.

**B2.4 — Interaction model.**
Position section panels around the phone exterior on the same convention as `.mg-zoombar` and the existing HUD: `position: fixed`, safe-area insets, `z-index: 50`, glass panel, self-gated on `isDesktop` (`DESKTOP_MIN = 1024`) — there is no exterior space below that width, and the whole feature must no-op on mobile. Selecting a firefly node in B-Phase 1's mesh focuses its corresponding section; selecting a section highlights its node. That reciprocal link is what makes it a *secondary experience* rather than a sidebar — one shared selection state, two representations.

**B2.5 — Content extraction.**
Port `slidesData.ts`'s retained slides into a typed module (`lib/ov-deck-content.ts`) at author time — headline, 2–4 bullets, bound node ID, accent. Do **not** fetch from the deck repo at runtime and do **not** parse the old HTML export. Reconcile every number against Part II.7 canon first (see B2.1a); where deck and canon disagree and the conflict is unresolved, omit the figure rather than shipping a contradiction.

**B2.6 — Reuse, don't duplicate.** `components/ov-deck-selector.tsx` already exists (3 named deck versions driving live conviction math via `OV_DECKS`/`calculateDeltaLimit`). Check whether the new selector should extend it rather than adding a second deck concept with the same name.

**Exit:** a desktop-only exterior experience where the Octavian constellation and the deck sections are two views of one selection state, carrying only user-appropriate content at canonical numbers.

### Explicitly not doing

VRF for market resolution · VRF for cosmetic randomness · VRF behind Postgres-only routes · expanding near-miss onto real-money surfaces (founder decision, see Part III) · surfacing investor-only deck slides on a user surface (B2.2).

---

## PART VI — MASTER MATHS & ALGORITHMS

*The canonical algorithm set. **The code is the authority** — every formula cites its
implementation home (`file#symbol`), and where a doc and the code disagreed, the code won.
Canonical libs: `verify/lib/gambit-game-math.ts` · `mpp-math.ts` · `bayesian-conviction.ts` ·
`gdelt.ts` · `card-evolution.ts` · `sentiment.ts` · `market-classifier.ts` · `joy-engineering.ts`.
Numeric source of truth is Part II.7; unresolved contradictions are §13 below.*

>
> **It has exactly one companion: **PART VII below****
> — the engine room. The split is deliberate and is the only one: *this* file is the
> canonical algorithm set with each formula bound to its implementation
> (`file#symbol`); the companion holds the tokenomics engine formulas (sell-pressure,
> emission, absorption models) in narrative form. The two are numerically consistent;
> if they ever disagree, **this file and the code win**. Do not create a third maths doc.
>
> Platform state, canonical numbers, deployment and security context live in
> this document.
>
> **The code is the authority.** Every formula below cites its implementation home
> (`file#symbol`). Where a doc and the code disagreed, **the code wins** and the
> conflict is logged in §13. The canonical libs are:
> `verify/lib/gambit-game-math.ts` · `mpp-math.ts` · `bayesian-conviction.ts` ·
> `gdelt.ts` · `card-evolution.ts` · `sentiment.ts` · `market-classifier.ts` ·
> `joy-engineering.ts`.
>
> **Governance rule:** any change to a canonical constant here requires explicit
> founder sign-off (mirrors `.agents/skills/mad-gambit-math/references/canonical-numbers.md`).
> Coefficients marked proprietary stay server-side — never in external materials.

---

### §1 — Canonical constants (authoritative: `gambit-game-math.ts#PLATFORM`, `#STAKING_TIERS`)

| Constant | Value | Code home |
|---|---|---|
| Platform fee | **1.88%** (`FEE_BPS 188`) — never changes | `PLATFORM.FEE_BPS` |
| Creator share of fee | **40%** (`CREATOR_SHARE_BPS 4000`) — creator-made markets only | `PLATFORM.CREATOR_SHARE_BPS` |
| Community share of fee | **28.8%** (`COMMUNITY_SHARE_BPS 2880`) | `PLATFORM.COMMUNITY_SHARE_BPS` |
| Shield recovery — standard | **28.8%** | `PLATFORM.SHIELD_RECOVERY_PCT` |
| Shield recovery — shielded ceiling | **40%** | `PLATFORM.SHIELD_RECOVERY_PREMIUM_PCT` |
| Shield recovery — Whale/VIP | **60%** | `PLATFORM.SHIELD_RECOVERY_WHALE_PCT` |
| Shield premium band | **2%–4%** of bet | `PLATFORM.SHIELD_PREMIUM_MIN/MAX` |
| $MADx fixed supply | **888,888,888** | `PLATFORM.MADX_FIXED_SUPPLY` |
| Furnace burn cap | **≤4.9%** / 30d | `PLATFORM.FURNACE_BURN_CAP` |
| Card pack cost / size | **4.88 $MADx** / **5** cards | `PLATFORM.CARD_PACK_COST/SIZE` |
| Canonical deck size / seed | **992** / **8888** | `PLATFORM.TOTAL_DECK_SIZE/CARD_GENERATION_SEED` |

**Staking tiers** (stake-amount thresholds — `STAKING_TIERS`, authoritative; mirrored on-chain by `contracts/src/MADStaking.sol`):

| Tier | Min $MADx | APY |
|---|---|---|
| Bronze | 100 | 12% |
| Silver | 500 | 18% |
| Gold | 2,500 | 28% |
| Platinum | 10,000 | 42% |
| Diamond | 50,000 | 58% |
| MAD Tier | 100,000 | 68% |

> ⚠️ Two *other* staking models appear in the tokenomics docs (lock-duration APY 8.8/18.8/28.8/68; rarity-multiplier 8/10/13/20/28/68). The **code + contract use the stake-amount tiers above.** See §13.

---

### §2 — Conviction & continuous markets

- **MADConv (conviction):** `M = t^1.35 · c^0.75 · d^1.45 · ψ^1.15 · (1+π^0.9) · m_meme · satire · liar · garch_amp` — Cobb-Douglas core. Home: `gambit-game-math.ts#calculateConviction`. Safe wrapper: `#calculateConvictionSafe`.
- **GARCH(1,1) volatility:** `σ²ₜ = ω + α·ε²ₜ₋₁ + β·σ²ₜ₋₁` (ω=0.0001, α=0.05, β=0.90); `garch_amp = 1 + 0.8σ`, clamped `0.09 ≤ σ ≤ 0.68`. Home: `#garchUpdate`. Asymmetric extensions: `bayesian-conviction.ts#egarchLogVar`, `#cgarchUpdate`.
- **DL-LMSR (continuous market maker):** cost `C(q) = b·ln Σ e^(qᵢ/b)`; price `P(i) = e^(qᵢ/b) / Σ e^(qⱼ/b)`. Homes: `#calculateDLLMSRCost`, `#calculateDLLMSRPrice`. Liquidity `b` scales with volume via `#calculateVolumeScalingAlpha`.
- **Kelly sizing:** `f* = (p·(b+1) − 1) / b`, half-Kelly default (`scale=0.5`). Home: `#kellyFraction`.
- **δ-limit (position cap):** `#calculateDeltaLimit(multiplier, convictionStake)`.
- **Market classification** (Progression / Saga / Z-Liar / Perp taxonomy): `market-classifier.ts` composing `zLiarMeter` + perp-trigger + sentiment.

### §3 — Liar meter & scandal signal

- **Z-Liar meter:** `LieScore(0–100) = Σ wᵢ·(LinguisticDeception, ContextualContradiction, SentimentShift, VocalAnomaly)`; verdict bands STRAIGHT SHOOTER → TOTAL FABRICATION. Home: `#zLiarMeter`.
- **Lie impact:** `LieImpact = LieScore × EconMult × ψ_agg × VolAmp`.
- **Scandal velocity (GDELT):** `Σ EMOTION_WEIGHTS·e` (shame 1.8 · anger 1.4 · disgust 1.3 · fear 1.2 · sadness 1.0 · joy −0.5), clamped ≥0. Home: `gdelt.ts`.
- **Perp trigger probability:** `P = 1 − exp(−0.25 · matches · themeWeight · (1+velocity))`, bounded 0..1. Home: `gdelt.ts`. *(The handoff's "r²=0.94" is an unverified Grok claim — decorative until measured on real data.)*
- **Sentiment:** lexicon (VADER-style) scorer — `sentiment.ts` (explicitly not a transformer).

### §4 — Bayesian conviction layer (`bayesian-conviction.ts`)

`bayesianUpdate` · log-odds `toLogOdds`/`fromLogOdds`/`sequentialLogOddsUpdate` · hybrid `madconvHybridUpdate` (`M^0.85·(1+β·bayes)`) · decision tree `propagateTree` (depth-bounded 64) · `voiEstimate` · `computeEdge` · `shouldAct` · proper scoring `brierScore`/`logScore`. Surfaced at `POST /api/v1/bayesian/{update,tree,voi,score,garch}`.

### §5 — MAD Shield engine (`gambit-game-math.ts`)

- **Premium:** `Stake × P(win) × √Volatility × SafetyMargin`, clamped to the 2–4% band. Home: `#calculateShieldPremium` / `#shieldPremium`.
- **Recovery:** 28.8% standard · 40% shielded ceiling · 60% Whale. Homes: `#shieldRecovery`, `#calculateShieldPayoutFull`/`Tiered`.
- **φ-shield ratio:** golden-ratio-weighted (`PHI = 1.618…`). Home: `#shieldPhiRatio`.
- **Lifecycle:** `#createShieldOptIn` · `#requestShieldUnstake` · `#calculateShieldReturnWindow` · `#isShieldUnstakeComplete` · `#shieldReturnCountdown`. Whale gate: `#WHALE_SHIELD_ELIGIBILITY`.
- **Compliance:** MAD Shield is **loss mitigation, never insurance/subsidy** — keep framing server-side and in canon.

### §6 — Fee & revenue split

`splitFee(volume, isCreatorMarket)`: `grossFee = volume·1.88%`; `creatorCut = isCreator ? grossFee·40% : 0`; `communityCut = grossFee·28.8%`. Home: `#splitFee`. **Furnace burn** ≤4.9%/30d: `#calculateFurnaceBurnPercent` (live via `revenue-engine.ts`).

> ⚠️ The 40% creator and 28.8% community are **non-additive by design** (creator = per-market gross; community = platform-net). Never wire governance to `FEE_BPS`/`CREATOR_SHARE_BPS`. §13.

### §7 — Staking yield

`calculateStakingYield` — base tier APY (§1) × NFT-clout boost `1 + clout/200`. Home: `gambit-game-math.ts`. Surfaced `POST /api/v1/staking/yield`. On-chain: `MADStaking.sol` (rewards from a separately-funded reserve — a stake never funds another's rewards).

### §8 — Card economy

- **Rarity table & drop weights:** `#RARITY_TABLE`, `#RARITY_DROP_WEIGHTS`, `#RARITY_ORDER` (Common 88 → Mythic 99,999 1-of-1).
- **Evolution:** ladder `#EVOLUTION_LADDER`, `#nextEvolution`, `#attemptEvolution`; burn costs `#EVOLUTION_BURN_COSTS`.
- **Wear:** `#calculateUsageWear`/`#applyUsageWear` + `#RARITY_WEAR_PCT`.
- **Pack pricing:** `#scandalPackPrice` + `#SCANDAL_PACK_TIERS`/`CAP`/`FLOOR`; Dutch auction `#getAuctionPrice`. Surfaced `POST /api/v1/packs/price`.
- **Streaks:** `#streakReward`.

### §9 — Governance

`#quadraticMatch(contributions)` (quadratic funding) + `mpp-math.ts#calculateGovernanceThreshold`. Surfaced `POST /api/v1/governance`. MADDAO quadratic voting-power cap **24×**.

### §10 — Behavioural / joy layer (`joy-engineering.ts`)

VRS Fibonacci triggers `#VRS_TRIGGERS = [5,8,13,21,34]`, `#isVrsTrigger`; `#LOSS_AVERSION = 2.5`, `#lossAversionWeight`; decays `#temporalDecay`/`#stochasticDecay`/`attentionDecay`; `viralityIndex`, `getFibonacciReward`, `calculateUserDopamineIndex` composed into `computeJoyState`/`rewardForTenure`/`momentumIndex`. Surfaced `POST /api/v1/joy/state`.

> **Compliance:** framed as game-economy engagement — never "dopamine/addiction/VRS-as-addiction" in external materials (keep the mechanic, cut the neuroscience framing).

### §11 — Tournament / PvP

Victory probability `#calculateVictoryProbability`; Elo-style `#mmrDelta` (K=32); prize bands `#PRIZE_BANDS`/`#prizeForRank`; tournament scoring `#calculateTournamentScores`; `#TOURNAMENT_PRIZES_BPS`.

### §12 — Thematic / temporal

Lunar phase multiplier `#getLunarPhaseMultiplier` / illumination `#getLunarIllumination` (`LUNAR_CYCLE_MS`, `IMMACULATE_CONCEPTION_EPOCH_MS`); golden ratio `#PHI`; EigenTrust `#assignTrustScore`.

### §12b — Economic-impact & virality dynamics (MAD HAT Math Spec v1.0, Drive handoff)

Folded in from `MAD_HAT_Mathematical_Handoff_Document.md` (Drive). These are the pieces of the spec that were **not** already covered above; status tagged against the code.

- **Projected stock/brand move:** `ProjectedStockMove_t = LieScore · σ_t · k_category` (k ≈ 0.019 baseline, per asset class/virality). ⚠️ **Spec only — NOT in code yet.**
- **Ad-revenue / brand erosion:** `AdRevenueLoss_t = LieScore · σ_t · 0.9` ($M); confidence band `58 + LieScore · 0.32`. ⚠️ **Spec only — NOT in code yet.**
- **Virality ODE (impressions growth):** `dI/dt = β · E_agg(t) · (M − I(t)) · (1 + η · Conv̄(t))`. Code ships **discrete approximations** — `gambit-game-math.ts#viralityScore` / `#viralityIndex` — not the literal ODE integrator.
- **Effective-time / attention decay (integral form):** `t_eff = ∫₀ᵀ a(u) · e^(−λ(T−u)) du`. Code ships the discrete `#attentionDecay` / `#temporalDecay` / `#stochasticDecay`. Meme drops + high-LieScore events recharge attention.
- **Non-binary market structure (CIRO):** Continuous (DL-LMSR) + Over/Under only; legs **45–90 days, never < 30** (30-day minimum-maturity compliance); Conviction Saga auto-relaunches next leg, MADConv profile compounds across legs. (Structure/compliance rule — enforced in market config, not a standalone formula.)

> The three ⚠️ items are the only maths from the Drive handoff **not yet implemented** — they belong in the Liar-Impact / market-projection surface (Part T-B of the plan). Everything else in the handoff is already in code (§2–§4).

---

### §13 — ⚠️ Contradictions requiring founder sign-off (do NOT silently resolve)

These conflicts exist **across the old docs**; the maths/formulas are reconciled to code above, but these **numbers/decisions are the founder's to lock**:

1. **$MADx token distribution — two different splits.** `CANONICAL_NUMBERS.md` (Public 35% / Liquidity 20% / DAO 15% / Team 10% / Staking 10% / Reserve 10%) vs `madx-token-system.md` (Community&Gameplay 45% / DAO 15% / Liquidity 15% / Team 15% / Seed&Private 10%). **Pick one.**
2. **$MADx contract address — two values.** `CANONICAL_NUMBERS.md` → `0xb61ae7727579e3781ca0ec4902b6ba21d335fd18`; master action plan (Part AB, on-chain-verified as symbol MADx / name MADDEX) → `0x6972370e1caAA3624F37D7e87C28e1089D00151f`. **Confirm the live one.**
3. **Staking model framing** — stake-amount tiers (code/contract, §1) vs lock-duration APY (8.8/18.8/28.8/68) vs rarity-multiplier (8→68). Code is authoritative; confirm the marketing framing matches.
4. ~~**Primary chain**~~ — ✅ **RESOLVED, founder sign-off August 2026.** The chain story is locked as:
   - **Arbitrum Nova (42170)** — launch and gameplay chain
   - **Arbitrum One (42161)** — MAD Shield vaults, liquidity and $MADx
   - **HyperLiquid (HyperEVM)** — secondary distribution/liquidity venue, never the canonical record
   - **Arbitrum Sepolia (421614)** — testnet

   Two notes on how this resolved. First, `contracts/foundry.toml` was already the ground truth and already said exactly this (`arbitrum_nova` "launch/gameplay chain (42170)", `arbitrum_one` "MAD Shield vaults / liquidity (42161)"), so the ruling ratifies the code rather than overriding it. Second, one leg of the stated three-way conflict was **phantom**: there is no `CLAUDE.md` anywhere in this repository, so the "Base L2" position it was credited with had no source here. Where "Base L2" does still appear it is either explicitly flagged as wrong (`MAD_GAMBIT_MASTER_ACTION_PLAN.md`), explicitly flagged as aspirational (`MAD_GAMBIT_MASTER_PLAN.md`), or in superseded 2024 material. `CANONICAL_NUMBERS.md`'s "Arbitrum One is primary" was not wrong so much as **incomplete** — One is primary for vaults and $MADx; Nova is primary for gameplay. Both rows are corrected in this change.
5. **Seed range** — `$1M–$2M` (CANONICAL_NUMBERS) vs `$1.24M–$2.48M @ $12M pre` (skill + master plan). **Pick one public range.**
6. **Y3 revenue** — $154.5M / $121.4M / $86–154M across decks. **Pick one.** (Carried from master action plan Part A.)
7. **Community 28.8% semantics** — code comment says "of the fee"; master plan Part A says "of net platform profit, platform-wide, non-additive with the 40% creator." Confirm which the contracts should implement.

---

### Appendix — superseded documents (now pointers to this file)

- `docs/imported/tokenomics/engine-room-math-formulas.md`
- `REPORTS/GARCH_VULKAN_ADVANCED.md`
- `docs/VULKAN_MAD_MAPPING.md`
- `docs/SHIELD_RISK_DEFENCES.md`

**Canonical numbers** now live in **Part II.7 above** (consolidated 2026-08-16 from the former `docs/imported/tokenomics/CANONICAL_NUMBERS.md`) — cross-checked against §1 here; resolve §13 under founder sign-off. The unresolved splits noted in §13 are carried forward in the master doc's Part II.9. **Engine-room formulas** are the companion **PART VII below**. The former `MASTER_TOKENOMICS.md` narrative and `docs/MECHANISM_ORACLE_MADX_RESEARCH.md` were consolidated into the master doc; their originals are in git history.

---

## PART VII — THE ENGINE ROOM: TOKENOMICS FORMULAS

*Companion to Part VI: the tokenomics engine in narrative form (sell-pressure, emission,
absorption, burn). Numerically consistent with Part VI and Part II.7 — if they ever
disagree, **Part VI and the code win**.*

> Extracted from: Whitepaper Section 09, GitHub Presentation, EVM Implementation Guide

---

### 1. SELL PRESSURE MODEL

```
SellPressure(USD) = UnlockedTokens × SellThroughRate × (1 − StakingAbsorption) × TokenPrice
```

| Parameter | Base | Bear | Bull | Stress (5%) |
|-----------|------|------|------|-------------|
| Price Multiplier | 1.00× | 0.30× | 2.00× | 0.15× |
| Volume Multiplier | 1.00× | 0.50× | 2.00× | 0.25× |
| Sell-Through Adj. | 0 | +1.75 | -0.75 | +2.50 |
| Staking Absorption Adj. | 0 | -0.60 | +1.20 | -0.80 |
| Shield Pool Impact (Y1) | +$1.8M | +$0.4M | +$5.2M | +$0.1M |

StakingAbsorption: 82–85% (driven by NFT staking requirement)
Initial Depth: $7.5M+ absorbs 3× Day-1 bear pressure at <1.5% slippage

### 2. MAD SHIELD PREMIUM — RISK ALGORITHM

```
Φ = S × P(win) × √σ²(t+1) × λ(SafetyMargin)
```

Worked Example: $100 stake on 50/50 market
→ Premium = $3.00 (3%)
→ Pool collects $3. If LOSE → Pool pays $28.80
→ Monte Carlo: Year 1 Net Pool +$1.8M (94% positive across 1,000 scenarios)

### 3. GARCH(1,1) VOLATILITY ORACLE

```
σ²(t+1) = ω + α·ε²(t) + β·σ²(t)
```

- Calculated on-chain via fixed-point arithmetic
- Parameters seeded per card at mint time, updated via Chainlink Automation
- Calm markets = cheap Shield; volatile markets = expensive Shield

### 4. DL-LMSR BONDING CURVE — INSTANT LIQUIDITY

```
P(i) = e^(q(i)/b) / Σ e^(q(j)/b)
```

- Every position always tradeable — protocol is counterparty
- Dynamic b parameter scales with volume
- Popular markets self-deepen liquidity
- Eliminates external market makers

### 5. STAKING REWARD DISTRIBUTION

```
R(u) = Y(pool) × (Stake(u) × M(nft)) / Σ(Stake(j) × M(j))
M(nft) = 1.0 + (Clout / 200)
Max APY: 68%
```

- Clout stat (0–200) determined by card rarity
- Golden Hand Clout=200 → M_nft=2.0× multiplier
- Yield pool funded by: 25% platform fees + Shield premiums + DeFi yield

### 6. REVENUE DISTRIBUTION FORMULA

```
Creator-Made Market: 40% of Fee (0.752% of Vol) → Creator → Creator | 60% → Platform
Platform-Made Market: 100% → Platform (1.88% of Vol)
Platform Allocation: 35% Ops | 25% Shield | 10% Burn | 30% Community
```

### 7. CARD EVOLUTION BURN SCHEDULE

| Rarity | $MADx Burned Per Evolution | Clout Range |
|--------|---------------------------|-------------|
| Common | 100 | 0-30 |
| Uncommon | 250 | 31-60 |
| Rare | 500 | 61-100 |
| Epic | 1,000 | 101-140 |
| Legendary | 1,500 | 141-180 |
| Golden Hand / Mythic | 2,500 | 181-200 |

### 8. MONTHLY BURN CAP

```
MaxBurn(30d) = TotalSupply × 0.049 = 43,555,555 $MADx
```

Prevents deflationary death spiral. Hard-coded in contract.

---

## APPENDIX A — PITCH DECK VERSION LINEAGE

| Version | File | Date | Slides | Seed Ask | Fee | Shield | Y3 Revenue | Key Changes |
|---------|------|------|--------|----------|-----|--------|------------|-------------|
| v1.5 (OLDER) | MAD_Gambit_PitchDeck_v1.5_OLDER.pdf | ~Feb 2026 | 15 | $2.4M-$3M | 1.66% | 40% | $16.5M-$42M | Original deck, older financial model |
| v1.2 (CURRENT) | MAD_Gambit_PitchDeck_v1.2_18slides.pdf | Mar 2026 | 18 | $1M-$2M | 1.88% | 28.8% | $154.5M | Updated financials, 45/15/15/15/10 distribution |
| Hi-Fi PAD2 | MADGambit_HiFi_PAD2_PitchDeck.pdf | Mar 2026 | 18 | $1M-$2M | 1.88% | 28.8% | $154.5M | Orbitron/Rajdhani fonts, gold foil |

### Data Evolution Between Versions

#### v1.5 → v1.2 Changes (CRITICAL)
- **Seed Ask:** $2.4M-$3M → **$1M-$2M** (reduced)
- **Platform Fee:** 1.66% → **1.88%** (increased)
- **MAD Shield:** 40% → **28.8%** (corrected for actuarial solvency)
- **Y3 Revenue:** $42M → **$154.5M** (updated model with more aggressive DAU growth)
- **Distribution:** 40/20/15/15/10 → **45/15/15/15/10** (more to community)
- **TAM:** $192.1B (unchanged)
- **Team slide:** Added photos and advisor details
- **Token supply:** 888,888,888 (unchanged)
- **Competitors:** Added Pump.Fun, Limitless, PredictIt to comparison matrix

#### v1.5 Still Contains (NOT in v1.2)
- "Base Stake Yield: 40%, VIP: 60%" (v1.2 uses tiered 8-68%)
- "Yield Bond Insurance" language (v1.2 uses "MAD Shield")
- "$37B+ monthly volume expected" market timing data
- Circular economy butterfly model infographic (v1.2 references but different layout)
