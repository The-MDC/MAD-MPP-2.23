# MAD Gambit MPP-2.23 — Full-Stack Handoff & Reconciliation
**Date:** 2026-08-12 · **Verified against:** `origin/main` @ `779ef04` (#70)
**Supersedes:** the *status* sections of `docs/HANDOFF_2026-08-11_AUDIT.md` and
`docs/TACTICAL_PLAN_REMAINING.md` where they conflict. Their **Fix** blocks remain correct
and are referenced rather than duplicated.

> **Read §0 first.** It contains a correction to a critical security finding raised in the
> 12-Aug session that was based on a stale tree. Acting on the stale version would waste a
> session re-fixing something already fixed.

---

## 0 · Corrections to prior reporting

### 0.1 The `$MADx` transfer vulnerability is **FIXED** — do not re-fix it

A 12-Aug review reported `POST /api/v1/madx/transfer` as taking a caller-supplied `from`,
allowing anyone to drain any balance. **That review ran against a stale `origin/main`.**

On current `main`, `verify/app/api/v1/madx/transfer/route.ts` reads:

    const auth = requireMadxRouteAuth(req, "madx-transfer", 30, 60_000);
    if (isAuthResponse(auth)) return auth;
    ...
    const ok = await transfer(getDbPool(), auth.owner, to, amount);

`from` is now derived from `auth.owner`. The body supplies only `to` and `amount`. Auth and
rate limiting (30 req / 60s) are both applied via `lib/madx-route-auth.ts`. All seven `madx`
routes were remediated together. **Closed.**

### 0.2 The guest gate has been removed from `main`

`verify/middleware.ts` **no longer exists**. The HTTP Basic "MAD Gambit Guest Access" gate is
gone from the tree.

Production still returns `401 Guest access required` — because production is **not running
`main`** (§1.1). The moment a real `main` build is promoted, **the guest gate disappears and
the site becomes fully public.** Decide before promoting whether that is intended.

### 0.3 Auth coverage — accurate numbers as of `779ef04`

**53 mutating routes · 35 still unauthenticated.** Improved from 39/41, but the long tail
remains. See §5.2.

---

## 1 · State of play (verified today)

| | |
|---|---|
| `origin/main` | `779ef04` — "pinned chrome, draggable concierge, cluster row, header desks, +20% phone (#70)" |
| **Production serving** | **`33988a82` — NOT an ancestor of `main`** (see §1.1) |
| App root | `verify/` · Next 16 · Turbopack · Node 22 · `strict: true` |
| Hub entry | `/` → redirects to `/preview` |
| Routes (pages) | 10 — `preview` `markets` `octavian` `dashboard` `profile` `reports` `settings` `mpp2.23` (legacy) `workbench` (telemetry) |
| Components | **94** |
| API routes | **88** |
| Migrations | `0001`–`0014` — **none applied to production** |
| Vercel project | `mad-mpp-2.23` (team `madgambit`) |
| Custom domain | **none attached** — only `*.vercel.app` |

### 1.1 🔴 Production is not running `main`

Live production is commit `33988a82` with `gitDirty: "1"`, promoted **79 minutes after** the
`af7e5bd` (#68) build — i.e. production was rolled back off `main` onto an older, dirty tree.
That commit survives only on stale feature branches.

**Anyone reading `main` and assuming it is what users see is wrong.** This invalidates
front-end review done against the live site.

Verify: `git merge-base --is-ancestor 33988a82 origin/main` → non-zero exit = not on main.
Full fix in `docs/HANDOFF_2026-08-11_AUDIT.md` §P0-1.

### 1.2 🔴 Production database has no schema

`0001`–`0014` have never been applied to production. Every DB-backed route falls back to demo
data. **Features are not incomplete — they are starved.** Vercel runtime errors show missing
`gdelt_signals` (66×), `perp_markets` (20×), `epiphany_models` (20×), `zeitgeist_slates` (20×),
`registrar_*`, `events_stream`, `madx_supply`, `bets`.

Full rehearse-on-a-branch procedure in `docs/HANDOFF_2026-08-11_AUDIT.md` §P0-2. Do not
migrate production blind.

---

## 2 · What was supposed to be built

### 2.1 Frontend — the MPP hub

A single-origin, phone-shaped prediction-market hub rendered inside a device frame, with:

- **Seven hub tabs** — Floor · Saga · Arena · Packs · Portal · Casino · Logic
- **Instrument cluster** — Z-Liar Meter, retention/cognition dial, sentiment equalizer,
  perp dials, scandal-velocity meter, virality eigen, Seiko flip-clock chrono
- **Six canonical news categories** (founder taxonomy, 31 Jul) — Headlines & Politics ·
  Entertainment & Celebrity · Athletes & Sports · Viral Media & Tech · Crypto & Finance ·
  Tabloids & Gossip
- **Market surfaces** — market factory, rails, featured cards, top-markets rail, futarchy
  board, dutch-auction panel, tournament arena, game lobby
- **Card economy** — pack shop, pack opening, NFT saga, card lifecycle/evolution, unpacked
  carousel
- **Economy panels** — MADx wallet, staking tiers (4-tier eights ladder: Bronze 88/8.8% ·
  Silver 888/18.8% · Gold 8,888/28.8% · MAD Tier 88,888/38.8%), Shield panel, revenue streams
- **Joy layer** — VRS celebrations at Fibonacci triggers, dopamine hub/carousels, VRS toast
- **Theme system** — INK design tokens + SKIN_TOKENS, two hub themes converging

### 2.2 Backend

- **Postgres on Neon** — provider-agnostic `DATABASE_URL`, plain `pg`, migrations-as-code
- **SIWE auth (EIP-4361)** — wallet identity, domain- and chain-bound to Arbitrum Nova
  (42170); stateless HMAC sessions; no passwords, no OAuth, no `sessions` table
- **Identity model** — one wallet key, four projections split by write authority
  (`user_profiles` user-written · `customer_accounts` system-written ·
  `customer_login_events` / `customer_profile_audit` append-only)
- **Market engine** — DL-LMSR pricing, Bayesian conviction, GARCH volatility, heat scoring
- **Perpetual families** (Phase P, shipped) — Five Faces, Zeitgeist, Perpetual Epiphanies,
  Registrar; `0012`–`0014`; routes under `/api/v1/{faces,zeitgeist,epiphany,perps,registrar}`
- **Satire engine** — 6-category voice pools, ~15% South-Park edge, deterministic hashing
- **Chain layer** — Arbitrum Nova gameplay, Arbitrum One vaults; `MADPortraitKeyRegistry.sol`,
  `MADPortrait.sol`

---

## 3 · What shipped

- Phase P complete (#57–#60) — perpetual families, contracts, slot auction, succession ribbon
- Six canonical categories replacing the 10-cat rail (#34)
- Migrations-as-code — `0001`–`0014` + `migrate.mjs` + `db-migrate.yml`; console-paste retired
- SIWE + `siwe_nonces` + `user_profiles` (#43); customer identity split (#45)
- Ultra-fidelity Z-Liar dial + Sentiment Equalizer (#36)
- Design system applied globally (#64); hub theme unification (#69); shell polish (#70)
- App restore after accidental deletion (#66 — recovering from `8c7a195`)
- `madx` route auth + rate limiting (§0.1)
- CI: Build · Type-check · Lint · Vitest · TruffleHog · placeholder guard — all green
- Neon branch-cleanup workflow (#44)

---

## 4 · What was missed

| Miss | Consequence |
|---|---|
| **Production never migrated** | Entire hub shows demo badges; looks half-built when it is only starved |
| **Production drifted off `main`** | Reviews of the live site describe code nobody is maintaining |
| **CLI `--prod` from a dirty tree** | Silently beat the Git deploy; no guard existed |
| **Guest gate deleted without a decision** | Next promotion makes the site public unannounced |
| **35 mutating routes still unauthenticated** | `madx` was fixed; the tail was not |
| **Two Neon projects** | CI targeted `patient-wave-95491458`; app targets sky park — preview branches validated a DB the app never reads |
| **`NEON_PROJECT_ID` unset** | Branch-cleanup workflow silently `skipped` twice |
| **`madgambit.io` attached to no project** | DNS reaches Vercel's edge, no project owns the host → 404 |
| **Git webhook not firing** | Merges to `main` produce zero deployments; every release is manual |
| **No `/api/v1/health/db`** | "Is production working" has been guesswork all along |
| **No dependency CVE audit** | `npm audit` blocked by egress policy; **still not performed** |
| **70 of 79 components had no breakpoint** | Fixed-layout by design (device frame), unverified outside it |
| **Joy disclaimer vs VRS** | `joy-engineering.ts` disclaims a mechanic `session-vrs.ts` implements |
| **No data-erasure path** | `user_profiles.email` + login events collected; `status='deleted'` is a soft flag |
| **No takedown route** | Named individuals scored by scandal velocity with no appeal path |

---

## 5 · Next steps — in order

### STEP 1 🔴 · Get production onto `main` (founder)

1. Decide the guest-gate question (§0.2) — public, or restore a gate, before promoting.
2. Vercel → Deployments → newest `main` build → **Promote to Production**.
3. Verify: `git merge-base --is-ancestor <prod-sha> origin/main` exits **0**.
4. Root-cause: Vercel → Settings → Git → restrict production to `main`; stop CLI `--prod`
   deploys, or require `git status --porcelain` empty first. Treat any `gitDirty: "1"`
   production deployment as an incident.

### STEP 2 🔴 · Apply migrations to production (founder + agent)

Rehearse on a Neon branch first — copy-on-write, costs nothing:

    neonctl branches create --project-id <REAL_ID> --name schema-audit --parent main
    # set DATABASE_URL to that branch, then:
    npm run migrate && npm run db:smoke
    # only when green, repeat against production DATABASE_URL
    neonctl branches delete schema-audit --project-id <REAL_ID>

Runner is idempotent (`_migrations` table); re-runs are no-ops.

### STEP 3 🔴 · Resolve the Neon project split (founder)

1. Read the host in `NEON_SKY_PARK_DATABASE_URL`; confirm which project owns it.
2. Set repo **Variable** (not Secret) `NEON_PROJECT_ID` to the canonical project ID.
3. Decommission the legacy project, or sweep its orphaned `preview/*` branches once.
4. Update `.claude/skills/neon-db` + `neon-vercel-integration` — both still name
   `patient-wave-95491458` as canonical.

### STEP 4 🟠 · `DATABASE_URL` wiring (founder)

Use the **Neon-managed integration** to emit `DATABASE_URL` per environment (Neon Console →
Integrations → Manage → Settings). **Do not** paste a static production string — previews
would then write to the live `$MADx` ledger, markets and bets. Pooled string only
(host contains `-pooler`, ends `?sslmode=require`). Redeploy after.

### STEP 5 🟠 · Fix the deploy webhook (founder)

GitHub → Settings → Webhooks → Vercel hook → **Recent Deliveries**. Green tick = GitHub sent,
Vercel didn't act (check Vercel Usage/Billing — two deploys died on `Resource provisioning
timed out`). No entry = hook not firing; reconnect at Vercel → Settings → Git.

### STEP 6 🟠 · Attach `madgambit.io` (founder)

Vercel → `mad-mpp-2.23` → Settings → Domains → add `madgambit.io` + `www.madgambit.io`.
DNS already resolves to Vercel. **No wildcard** — it would collide with
`datahouse.madgambit.io` on `datahouse_mathsengine`.

### STEP 7 🟠 · Gate the remaining 35 mutating routes (agent)

Follow the `lib/madx-route-auth.ts` pattern already proven on `madx`. Priority order:

1. **Cost-exposed:** `concierge/chat` (Gemini), `vector/embed`, `vector/search`
2. **Integrity-exposed:** `bets`, `cards/*`, `governance`, `markets`, `lobby`
3. **Content-control:** `gdelt/whitelist` — controls who enters the satire pipeline
4. Add a CI grep gate so new mutating routes cannot land unauthenticated

### STEP 8 🟡 · Observability (agent)

Add `GET /api/v1/health/db` — borrow the existing pool, `SELECT 1`, return
`{ ok, latencyMs, migrationsApplied }`. ~15 lines. This is what makes STEP 1 and STEP 2
verifiable instead of hopeful.

### STEP 9 🟡 · Unblock the tooling (founder)

Add **`registry.npmjs.org`** to the environment's network egress allowlist. Single
highest-leverage change: unblocks `npm ci` → `npm audit` (**the dependency CVE review that
has never been run**), local build/test, and Playwright screenshots. Then `*.vercel.app`.

Also: Settings → Advanced Security → enable **Dependabot alerts**, **security updates**,
**secret scanning**. A config file cannot enable these; an empty alert list may mean "off",
not "clean".

### STEP 10 🟡 · Sprint 1 backlog (agent) — from `docs/TACTICAL_PLAN_REMAINING.md`

- **B0** env & settings hardening — `images.remotePatterns`, `NEXT_PUBLIC_SITE_URL`,
  `WIRE_LIVE`, `FEATURE_FLAG_GAMBIT_NODES`, `LUNAR_PHASE_OVERRIDE`, plus `SUBJECT_MAP_PEPPER`,
  `PAUSE_GUARDIAN_TOKEN`, `CRON_SECRET`
- **B1** `/story` route · **B2** `/engine` + `/portal` datahouse fold
- **B4** hub consolidation — blocked on the founder naming the second-theme repo
- **B5** design-debt pass — raw-hex gate + Playwright baseline (five Phase-P surfaces landed
  with no visual baseline)
- **B6** THE WIRE (S1.8) — `wire-sources.ts` + `cron/wire-ingest`; scope now supplied
- **B7** PWA — manifest + service worker

### STEP 11 🟢 · Product / ethics

- Reconcile `joy-engineering.ts:20` disclaimer with `session-vrs.ts` VRS implementation —
  narrow the comment, or bring VRS under the same transparent/bounded standard *(founder call)*
- Data-erasure path + retention policy for `user_profiles.email`, `customer_login_events`
- Takedown/appeal route for named individuals in `celebrity_whitelist` / `gdelt_signals`
- **P5 Phase-4 gate** — named-subject markets stay inert until `SUBJECT_MAP_PEPPER`,
  `PAUSE_GUARDIAN_TOKEN` (non-owner key), six `registry_readiness` rows signed off, a real
  HSM-backed `KmsAdapter`, and `MADPortraitKeyRegistry` deployed

---

## 6 · Founder-only (no agent can do these)

- [ ] Promote a clean `main` build to production; restrict prod deploys to `main`
- [ ] Apply `0001`–`0014` to the production database
- [ ] Guest-gate decision before promotion
- [ ] `NEON_PROJECT_ID` repo **Variable**; canonical Neon project; decommission the legacy one
- [ ] `DATABASE_URL` via the Neon-managed integration
- [ ] Vercel↔GitHub webhook / Git connection
- [ ] Attach `madgambit.io` + `www`
- [ ] Egress allowlist: `registry.npmjs.org`, then `*.vercel.app`
- [ ] Advanced Security toggles
- [ ] `git tag -a v2.24-constellation b49a007` — the git proxy fails tag pushes; run locally
- [ ] Name the second-theme repo (blocks B4)

---

## 7 · Verification

    git fetch origin main
    git log --oneline origin/main -1
    git merge-base --is-ancestor <prod-sha> origin/main   # 0 = production on main

    cd verify
    npm ci && npm run build && npx tsc --noEmit && npm test
    npm audit                                              # never yet run
    npm run migrate && npm run db:smoke                    # against a Neon branch first

**Definition of done for this handoff:** production serves a `main` commit · `db:smoke` passes
against production's database · `/api/v1/health/db` returns `ok:true` · zero unauthenticated
mutating routes · `npm audit` has been run at least once.

---

## 8 · Provenance

Everything above was verified by reading `origin/main` at `779ef04` and querying the Vercel
and GitHub APIs. **Not verified:** nothing was executed — `npm` and `*.vercel.app` are blocked
by this environment's egress policy, so no build, test, query, or screenshot backs any claim
here. Items sourced from `docs/HANDOFF_2026-08-11_AUDIT.md` (production drift, missing schema,
runtime error counts) are that document's findings, cited not re-derived.

Treat §4 and §5 as a reconciliation of plan against tree, not as observed runtime behaviour.
