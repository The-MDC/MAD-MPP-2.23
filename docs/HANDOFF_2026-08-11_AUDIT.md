# MAD Gambit — Audit & Handoff · 2026-08-11

**Read this before touching the repo.** It supersedes the status sections of
`MAD_GAMBIT_OMNIBUS_COMPLETE_HANDOFF.md` and `MADGAMBITHANDOFF.md` where they
conflict — several items those docs list as open are **already shipped**, and
re-planning them is the most likely way to waste a session (§4).

Every item below carries a **Fix** — the actual resolution, not a restatement of
the problem. Items marked **founder** cannot be done by an agent: the agent proxy
refuses repository-settings writes, and no agent here holds Neon/Vercel dashboard
credentials.

---

## 1 · State of play

| | |
|---|---|
| `origin/main` | `af7e5bd` — "market surfaces restored, auto-showcase carousels, Seiko case + programmable stat chrono (#68)" |
| **Production is serving** | **`33988a82` — NOT an ancestor of `main`** (see P0-1) |
| Open PRs | **#69** only — draft, all CI green, on `claude/maths-engine-room-ship-ai67e6` |
| Recently merged | #68 (this session's work), #67, #66 (the app restore), #64 |
| App root | `verify/` · Next 16 + Turbopack + Node 22 |
| Hub | `/` redirects to `/preview`. `/mpp2.23` is the legacy theme (retiring), `/workbench` the telemetry portal |

---

## 2 · 🔴 P0 — production is broken in two independent ways

### P0-1 · Production is not running `main`

The live production deployment is `dpl_DcHmGgcVZGAyJw94ANfRoTMSURE2`, commit
`33988a82` ("feat: SIWE verification (EIP-4361) + Foundry test suites…"), with
`gitDirty: "1"` and creator `fable@madgambit.local`. That commit is **not an
ancestor of `origin/main`** — it survives only on six stale feature branches
(`feature/nft-card-system-v2`, `claude/session-handoff`, and four others).

It was promoted **79 minutes after** the `af7e5bd` (#68) production deploy, so
production was effectively rolled back off `main` onto an older, dirty tree.
Anyone reading `main` and assuming it is what users see is wrong.

**Verify:**
```powershell
git fetch origin main
git merge-base --is-ancestor 33988a82 origin/main   # non-zero exit = not on main
```

**Fix — promote a real `main` build, then stop CLI deploys from overwriting it:**
```powershell
# 1. Redeploy the newest main commit to production (Vercel dashboard →
#    Deployments → the af7e5bd build → Promote to Production), or:
cd C:\Users\Aaron\MAD-MPP-2.23
git checkout main; git pull
vercel --prod                      # only from a CLEAN main checkout
git status --porcelain             # must be empty BEFORE deploying
```
**Root-cause fix (do this, not just the redeploy):** a `vercel --prod` from a
local dirty tree can silently beat a git-push deploy. Either stop deploying to
production from the CLI entirely and rely on the Git integration, or gate it —
Vercel Project → Settings → Git → **only `main` deploys to production** — and
treat any `gitDirty: "1"` production deployment as an incident.

---

### P0-2 · The production database has no schema

**This is the root cause of most "incomplete features" on the hub.** They are not
incomplete; they are starved. Every DB-backed route falls back to demo data, which
is why the hub shows `demo` badges everywhere.

Vercel runtime errors, 7-day window, live production:

| Missing relation | Count | Route |
|---|---|---|
| `gdelt_signals` | 66 | `/api/v1/markets/proposals` |
| `perp_markets` | 20 | `/api/v1/faces` |
| `epiphany_models` | 20 | `/api/v1/epiphany/models` |
| `zeitgeist_slates` | 20 | `/api/v1/zeitgeist/slate` |
| `pause_state` | 8 | `/api/v1/registrar/status` |
| `registrar_queue` | 6 | `/api/v1/registrar/status` |
| `subject_complaints` | 4 | `/api/v1/registrar/status` |
| `registry_readiness` | 2 | `/api/v1/registrar/status` |
| `events_stream` | 1 | `/api/v1/analytics/summary` |
| `madx_supply` | 1 | `/api/v1/madx/account` |
| `bets` | 1 | `/api/v1/dopamine/metrics` |

`verify/sql/0001…0014_*.sql` have **never been applied to production**.

**Fix — rehearse on a branch first, never migrate prod blind.** Neon branches are
copy-on-write pointers, so this costs effectively nothing:
```powershell
neonctl branches create --project-id <REAL_ID> --name schema-audit --parent main
neonctl connection-string schema-audit --project-id <REAL_ID>

cd C:\Users\Aaron\MAD-MPP-2.23\verify
$env:DATABASE_URL = "<connection-string-from-above>"
npm run migrate     # whatever it APPLIES is what prod is missing
npm run db:smoke    # writes+reads every table, rolled back

# only once that is green, repeat against the production DATABASE_URL
neonctl branches delete schema-audit --project-id <REAL_ID>
```
The runner is idempotent — every migration is tracked in a `_migrations` table,
so re-runs are no-ops and running it against an already-current DB is safe.

**Related, same window:** `Connection terminated due to connection timeout` on
five routes (last 2026-08-10 08:46), and 27× `password authentication failed for
user 'neondb_owner'` on Aug 4. Both point at the credential problems in P0-3;
re-check after fixing those before treating them as a separate pooling issue.

---

### P0-3 · Neon credentials are wrong in two distinct ways · **founder**

`Create Neon Branch` fails on every PR. The job log shows:
```
project_id: <PROJECT_ID>
api_key: ***
##[error]Failed to create branch. AxiosError: Request failed with status code 401
```

1. **`NEON_PROJECT_ID` is the literal string `<PROJECT_ID>`.** Actions masks
   secrets (hence `***` for the key) but **never masks repository variables**, so
   that is the genuine stored value — a placeholder pasted unsubstituted. It is
   non-empty, so the job's `if: vars.NEON_PROJECT_ID != ''` gate passes and the
   job runs against a nonsense project.
2. **The API key is separately invalid.** A bad project id under a good key would
   return 404; the 401 means authentication itself failed.

**Fix — real id first, then rotate:**
```powershell
neonctl projects list      # copy the actual id — do not paste a placeholder
gh variable set NEON_PROJECT_ID --repo MADdegen/MAD-MPP-2.23 --body "PASTE_REAL_ID"
gh secret   set NEON_API_KEY    --repo MADdegen/MAD-MPP-2.23   # prompts; new key from console.neon.tech
```

⚠️ **`NEON_PROJECT_ID` must stay a repository _variable_, not a secret.** As a
secret, `vars.NEON_PROJECT_ID` reads empty and both Neon jobs **silently skip**
— which looks green and is strictly worse than failing.

**Verify properly:** close and reopen a PR, then confirm the job **ran** and that
its `Apply migrations` and `Live DB smoke` steps executed. Both jobs are
`continue-on-error: true` by design, so a still-broken credential presents as a
green PR with a dead job inside it. **A skipped job is not a pass.**

**Read the status code before acting on a future failure:** `401` = rotate the
key. `422` = the key is fine and the project has hit its branch quota from
orphaned branches — rotating costs you a working credential and fixes nothing.
For 422, list branches and delete the orphans instead.

---

## 3 · P1 — silent breakage

### P1-1 · `SESSION_SECRET` fails closed · **founder**

`verify/lib/session.ts` reads `process.env.SESSION_SECRET` and **fails closed**:
with it unset, sessions are neither issued nor accepted. Auth is not degraded —
it is dead, with nothing in the UI to say so. Prior audit docs list this as a
"recommended addition"; it is in fact already wired and load-bearing.

**Fix:**
```powershell
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$bytes = New-Object byte[] 48; $rng.GetBytes($bytes)
$s = [Convert]::ToBase64String($bytes)
$s | vercel env add SESSION_SECRET production
$s | vercel env add SESSION_SECRET preview
```

### P1-2 · The env surface is much smaller than the docs claim

The app reads **13** variables. Enumerated from source, not from docs:

**Read and load-bearing:** `DATABASE_URL` (fallbacks `NEON_SKY_PARK_DATABASE_URL`,
`NEO_DATABASE_URL` — for Vercel's project-prefixed Neon string) · `SESSION_SECRET`
· `GOOGLE_API_KEY` · `PAUSE_GUARDIAN_TOKEN` · `CRON_SECRET` (via
`lib/bearer-secret.ts`) · `GDELT_QUERY` (optional) · `GUEST_USER`/`GUEST_PASS`
(optional, `proxy.ts`) · `NEXT_PUBLIC_MADX_ADDRESS`,
`NEXT_PUBLIC_MARKET_FACTORY_ADDRESS`, `NEXT_PUBLIC_STAKING_ADDRESS`,
`NEXT_PUBLIC_TREASURY_ADDRESS`.

**Listed in the audit docs but read by NO code — setting them today is a no-op:**
`GEMINI_API_KEY` (the code reads `GOOGLE_API_KEY`), `ALLOWED_WALLETS`,
`NEXT_PUBLIC_SITE_URL`, `WIRE_LIVE`, `UPSTASH_REDIS_REST_URL`/`_TOKEN`,
`SENTRY_DSN`, `FEATURE_FLAG_GAMBIT_NODES`, `CORS_ALLOWED_ORIGINS`,
`LUNAR_PHASE_OVERRIDE`, `NEXT_PUBLIC_VERCEL_ANALYTICS_ID`.

**Fix:** set the load-bearing list; ignore the aspirational one until the feature
that reads it exists. Don't treat the docs' list as a checklist.

### P1-3 · `pg` SSL deprecation — 104 occurrences

> SSL modes 'prefer', 'require', 'verify-ca' are treated as aliases for
> 'verify-full'. In pg-connection-string v3 / pg v9 these adopt libpq semantics.

Noise today, breakage on upgrade. **Fix:** make it explicit in `DATABASE_URL` —
append `?sslmode=verify-full` (current behaviour, keeps the strong guarantee) or
`?uselibpqcompat=true&sslmode=require` (libpq semantics now). Env change, not code.

---

## 4 · ⚠️ Corrections to the existing handoff docs

**Do not re-plan these. They are done.** An earlier revision of PR #68's
description repeated the docs' stale claims before this was checked.

| Doc claim | Reality |
|---|---|
| "N3 — Migrations-as-code" outstanding; "retire the paste-SQL-into-the-console pattern" | **Shipped.** `verify/sql/0001…0014_*.sql`, applied by `verify/scripts/migrate.mjs` in sorted order, each in its own transaction, tracked in `_migrations` so re-runs are no-ops. `neon-pr-branch.yml` runs `npm run migrate` **and** `npm run db:smoke` against every fresh PR branch. Path is `verify/sql/`, **not** `db/migrations/` — a naive directory check reads it as absent. |
| `SESSION_SECRET` — "recommended addition" | **Already read**, and fails closed. See P1-1. |
| `MADGAMBITHANDOFF` §7 design queue, items 1–9 | **Every component exists.** Crypto dual ticker, news flow, dopamine carousel, Seiko hub, rails, positions dashboard, faces/zeitgeist/epiphany/registrar, featured cards, wallet + bottom nav. The gaps are backend, not UI. |
| PR #34/#35 "open, blocked"; NEON_API_KEY 401 as a new finding | Long superseded. Current PR state is §1. The 401 persists but with a different root cause — see P0-3. |

---

## 5 · Shipped this session (merged in #68, or open in #69)

**#68 — merged into `main` as `af7e5bd`:**
- `lib/market-view.ts` — one view-model over `Market` / `MarketProposal` /
  `PerpMarket`; the three market cards; `market-deck` + `/markets`. (Rescued from
  the closed #65.)
- `components/carousel.tsx` — `useAutoShowcase` (advance one item, wrap at end)
  and `AutoShowcaseBadge`. Pauses on hover, focus, touch, wheel, off-screen and
  hidden tab; never runs under `prefers-reduced-motion`; a manual scroll buys 6s.
- Seiko case rebuild — milled gold case, recessed well, hinge pins, chisel-struck
  numerals.
- Programmable stat chrono — the three digit-pairs are independent user-selectable
  readouts driven by `DEFAULT_PAIR_PRESETS`, **exported from
  `gambit-instrument-cluster` rather than copied**, so the chrono and the cluster's
  pods cannot drift.

**#69 — open draft, all CI green:**
- Dopamine carousel: 4 → 34 tiles across four desks (Platform, vibe, Conviction,
  Market).
- `components/dopamine-glyphs.tsx` — six bespoke CSS-3D glyphs, one per platform
  stat, CSS-only, killed by one `prefers-reduced-motion` declaration.
- Five Faces, Zeitgeist slate and the mental-model catalog converted from grids to
  auto-showcasing rails; the Z-Liar rail now auto-advances.
- `lib/demo-markets.ts` — see §6-1.

---

## 6 · Audit findings and corrections

### 6-1 · Duplicated demo book — **FIXED in #69**

The same three demo markets were hardcoded in `featured-market-cards`,
`market-rails` **and** `seiko-dopamine-hub`. They had already drifted: the Elon
market read **"in 2024"** in two components and **"in 2026"** in the third, so the
hub advertised a market that resolved two years ago beside the same market dated
correctly. A second inconsistency fell out of it — the identical `3.0` book
rendered `"3.0x"` on the featured cards and `"3x"` on the prediction rail.

**Fix applied:** `verify/lib/demo-markets.ts` is the only copy. Two rules keep it
from re-diverging, and both are load-bearing rather than stylistic:
1. Questions stored in **sentence case**; surfaces apply `textTransform`. A
   display choice baked into data is one the next surface has to guess at — that
   is exactly how the caps/non-caps variants appeared.
2. Odds stored as **numbers**, rendered through `odds()`. Hand-formatting is what
   produced `3x` and `3.0x` for one book.

### 6-2 · Four dead components — **decision needed**

Defined, never imported anywhere: `news-carousel`, `news-flow-section`,
`roast-share`, `wallet-gateway`. The first two are superseded by `news-two-row` on
`/preview`.

**Fix:** delete them, or mount them. I left them in place because removing four
components is destructive and intent isn't inferable from code. If they are
superseded, `git rm` is the honest resolution — dead components accrue lint,
type-check and review cost forever.

### 6-3 · Apparent redundancy that is NOT redundancy

Checked before touching. Do not "consolidate" these:

| Pair | Verdict |
|---|---|
| `live-ticker` vs `crypto-ticker-dual` | Route-scoped. `/preview` mounts only `crypto-ticker-dual`; the `MARKETS · NYSE` panel was already removed with a comment saying why. `live-ticker` (325 lines) serves **only** `/mpp2.23`, which is retiring — it dies with that route, not before. |
| `dopamine-metrics-carousel` vs `dopamine-carousel-strip` | Deliberate. Metrics is the data-wired variant (`/profile`, `/reports`, `/dashboard`); strip is the pixel-faithful landing rail (`/preview`). |
| `markets-panel` vs `markets-for-today-panel` | Both on `/dashboard`, different jobs (live book vs classified proposals). |
| `zliar-meter` vs `zliar-section` | Composition — the section renders the meter. |

### 6-4 · `GDELT_QUERY` starves four of six categories

`DEFAULT_QUERY` in `lib/gdelt-ingest.ts` is celebrity-only:
`(feud OR scandal OR …) (celebrity OR hollywood OR star OR singer OR actor OR
influencer OR rapper OR model)`. The category rail has **six** canonical
categories — `headlines`, `entertainment`, `sports`, `viraltech`, `crypto`,
`tabloid`. The firehose feeds entertainment and tabloid and never points at the
other four.

**Do not** set `GDELT_QUERY` to the current default — an override shadows
`DEFAULT_QUERY` permanently, so future improvements to that constant stop reaching
production. Set it only to *change* the query.

**Fix (config, immediate):**
```powershell
$q = '(scandal OR feud OR lawsuit OR arrest OR indicted OR resigns OR fraud OR leaked OR backlash OR meltdown OR breakup OR divorce OR fired OR cheating OR "clap back") (celebrity OR hollywood OR singer OR actor OR influencer OR rapper OR senator OR congress OR president OR election OR athlete OR nfl OR nba OR olympic OR crypto OR bitcoin OR ethereum OR exchange OR startup OR "artificial intelligence" OR tiktok OR streamer OR viral) sourcelang:english'
$q | vercel env add GDELT_QUERY preview
curl.exe "https://<preview-url>/api/v1/ingest/gdelt" | ConvertFrom-Json   # fetched > 0 = it parses
```
GDELT DOC 2.0 has undocumented limits on query length and OR-clause count, and
over-long queries return **zero results rather than an error** — so that `fetched`
count is the real test. `/api/v1/ingest/gdelt` is an unauthenticated GET.

**Fix (structural, better):** one query *per* category, ingest looping them and
tagging each signal with its `NewsCategory` on the way into `gdelt_signals`. A
single env var cannot serve six categories without losing precision.

---

## 7 · Open implementation work

### 7-1 · Backend endpoints the UI already implies

| Endpoint | Consumer today | Notes |
|---|---|---|
| `GET /api/v1/perps/:family/report` | perp cards call `/api/v1/markets/proposals` instead | Implied price + spread vs engine, conviction flow, model reading. `app/api/v1/perps/` currently holds only `convict`, `roll`. |
| `GET /api/v1/perps/:family/reading` | client-side drift in the mock | Replaces simulated instrument values. |
| `GET /api/v1/octavian/state` | none — **the mesh pulses are decorative** | Per-node health + link throughput. |
| Implied share | computed client-side from displayed odds | Derive server-side. |

### 7-2 · The Wire — ingestion is still demo

`/api/v1/news/satirical` serves `DEMO` rows. There is no `lib/wire-sources.ts` and
no ingest cron. The satire conversion and heat ranking are live and correct; only
the headline ingestion feeding them is missing. Full scope: `SCOPE_THE_WIRE_v1.md`
(W1–W6). Vercel Pro allows the `*/15 * * * *` cadence this needs.

### 7-3 · Performance items, none started

- **`next/font` for Outfit + Allerta Stencil** — no `next/font` import anywhere in
  `app/`. Highest perceived-speed win available for a typography-forward brand;
  eliminates FOUT/layout shift on first paint.
- **Edge runtime** on `/api/v1/platform/intel` and `/api/v1/news/satirical` —
  read-heavy and cacheable.
- **Turbopack `.next/cache` in CI** — confirm it persists between runs; without it
  every PR pays a full cold build.

---

## 8 · Data-model decisions needed before more UI

These block work regardless of how much frontend gets built. **Answer them before
wiring the dopamine desks.**

### 8-1 · There is no benchmark series

Six of the twelve conviction stats are **defined relative to a benchmark**:
Active Share, Tracking Error, Information Ratio, R-Squared, Upside Capture,
Downside Capture. The platform carries nothing to difference against, so these
cannot be computed at all — not "are hard to compute".

**Decision required:** what does MAD Gambit benchmark against? A broad market
index, a per-category baseline, or the platform-wide conviction average? Each
gives a different — and defensible — reading of "active share" for a prediction
market. Until it is chosen, those six tiles cannot leave placeholder.

### 8-2 · Impressions has no source

`Impressions · 24h` on the platform desk needs an analytics event stream the
platform does not emit. `events_stream` exists in the schema but the table isn't
in production (P0-2) and nothing writes impressions to it.

**Fix:** decide between Vercel Web Analytics custom events and a first-party
write into `events_stream`, then instrument card/market/headline surfacing.

### 8-3 · Placeholder data, stated plainly

`dopamine-carousel-strip.tsx` has **no fetch**. All 34 tile values are shaped demo
constants; the file header says so. `DopamineMetricsCarousel` is the data-wired
variant. **Do not read those numbers as platform metrics**, and do not wire them
piecemeal — §8-1 and §8-2 gate two of the four desks.

---

## 9 · Design / UX open items

- **Hub section order.** `/preview` currently orders `#mg-markets` (top-50 +
  market rails) **before** `ZLiarSection`; the founder's reference flow puts the
  Z-Liar/perp block first, then unpacked cards, then the market rails. Not changed
  — reordering `/preview` touches the Sacred Eleven 5-zone layout and needs an
  explicit go-ahead.
- **`module-shelf` left as an accordion.** It is a vertical stack of collapsible
  bays, not a card row; a horizontal rail would break the expand-in-place
  interaction it exists for. Converting it was declined deliberately.
- **The circled blue arrow is now a contract.** It means *this rail advances on
  its own*. `AutoShowcaseBadge` and `useAutoShowcase` ship together — do not add
  one without the other, in either direction.
- **Full market listings stay grids** — `market-deck`'s three sections,
  `markets-panel`, `markets-for-today-panel`. They are directory views;
  auto-advancing a list someone is reading works against them.

---

## 10 · Environment gotchas for the next agent session

Discovered the hard way. Each cost real time.

| Constraint | Consequence | What to do |
|---|---|---|
| `npm install` fails — proxy returns **403** on `registry.npmjs.org/.../zustand-5.0.14.tgz`, not in cache | **No local `tsc` / `eslint` / `vitest` / `next build`.** CI is the only gate. | Do not retry or route around it (egress policy). Use `/opt/node22/bin/tsc --noEmit --jsx react-jsx --skipLibCheck <files>` and grep for `TS1xxx` — catches syntax and unbalanced JSX, which is what most edits break. Then push and let CI verify. |
| `api.gdeltproject.org` blocked — 403 at the proxy | Cannot test a GDELT query from an agent session | Test via the deployed preview: `/api/v1/ingest/gdelt`. |
| Repository-settings writes refused by the proxy | Cannot set Actions secrets/variables | All of P0-3 is a founder action. |
| Vercel MCP has **no env-var tool** | Cannot set `DATABASE_URL` etc. | `vercel env add` from the founder's machine. |
| `Create Neon Branch` is `continue-on-error` | A broken credential shows as a **green PR with a dead job inside it** | Never infer Neon health from PR colour. Open the job. |

---

## 11 · Verification playbook

```powershell
cd C:\Users\Aaron\MAD-MPP-2.23\verify
npm run type-check
npm run lint
npm test
npm run build
```

**Production health, in order:**
1. `git merge-base --is-ancestor <deployed-sha> origin/main` — is production even on `main`? (P0-1)
2. Vercel → Runtime Errors, 24h — any `relation … does not exist` means the schema regressed. (P0-2)
3. Open a PR; confirm `Create Neon Branch` **ran** and its migrate + smoke steps executed. (P0-3)
4. `curl /api/v1/ingest/gdelt` — `fetched > 0`.
5. `curl /api/v1/markets/proposals` — `source: "live"`, not `"demo"`.

Item 5 is the single best one-line signal that P0-2 is actually fixed.

---

## 12 · Suggested order

1. **P0-1** — get production back onto `main` and stop CLI deploys overwriting it.
2. **P0-3** — real `NEON_PROJECT_ID` + rotated key. Unblocks preview DBs and CI migration proof.
3. **P0-2** — migrations onto a Neon branch, verified, then production. Most of the hub stops being demo the moment this lands.
4. **P1-1** — `SESSION_SECRET`, or auth stays silently dead.
5. **§8-1** — pick the benchmark. It blocks half the conviction desk and is a decision, not work.
6. **§7-2** — the Wire. Ends the DEMO-rows era.
7. **§7-3** — `next/font` first; best ratio of perceived speed to effort on the list.

---

*Compiled 2026-08-11 from: Vercel runtime errors (7d) and deployment list, the
GitHub Actions job logs, and a source audit of `verify/`. Prior docs corrected in
§4. Everything in §2–§3 was verified against the live project, not inferred.*
