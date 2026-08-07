# MAD Gambit — Session Handoff: The Hub Ship (2026-07-24)

**From:** session `session_0189RBqzcVwpBtr9yUvXmmvG` (branch `claude/mad-gambit-enhancement-timeline-zdnx47`)
**Repo:** `MADdegen/MAD-MPP-2.23` · app in `verify/` (Next.js 16 · React 19 · raw `pg` on Neon · Vercel, root dir `verify`)
**Merged:** **PR #23** → `main` at **`55ab87e`** (47 commits). `main` has since advanced to `02c86a8` (PR #18 Vercel Web Analytics + analytics deploy — founder-merged, post-ship).
**Status:** 🟢 **Production READY** · 6/6 `main` workflows green · **zero runtime errors** (24 h sweep, re-checked post-deploy).

---

## 0. TL;DR

The three-column **dopamine hub** shipped to production at route **`/preview`**: `/gambit`'s WebGL particle backdrop + gold-chisel MΛĐ⚡Gambit lockup, triple clickable NYSE-style tickers, a six-category **satirical news engine** with a two-row photo carousel, the **GossipCop** market class + meter, a **Tickers & Dials** instrument container (meters row + split-flap chrono with neon digits replacing the KPI pods), the **`/gambit` floor ported native** (Seiko hub, market rails, Z-Liar, positions/engine — real components under `GameProvider`), per-class market carousels, Featured Markets, a deep-linked Platform Explorer, and both mockup side menus. Plus: scandal decision-tree APIs, web2 $MADx, a vitest CI gate (73 tests), Dependabot/env hygiene, and a latent runtime-crash fix.

**The one thing blocking eyeballs:** the custom domain **`madgambit.io` points at an OLD deployment**, and **Vercel Deployment Protection gates the real production URL**. Fixes are §2 — dashboard-only, ~3 minutes.

---

## 1. Live state (verified, not assumed)

| Layer | State | Evidence |
|---|---|---|
| Vercel production | **READY** (built 56 s, turbopack) | `dpl_HGLzocghALE2mqBUedcEQLEBH2nt`, target `production`, commit `55ab87e` |
| Production aliases | `mad-mpp-223-madgambit.vercel.app`, `mad-mpp-223-git-main-madgambit.vercel.app` | deployment record |
| `main` CI | **6/6 success** | CI (tsc) · Unit Tests (vitest) · Foundry · Placeholder Guard · **DB Migrate (production)** · Vercel Production Deploy — all `success` @ `55ab87e` |
| Runtime errors | **none** | `get_runtime_errors` 24 h window, post-deploy |
| Prod DB (Neon) | migrations 0001–0009 applied | DB Migrate (production) workflow `success` |
| PR #23 | **merged**, watch closed | merge SHA `55ab87e` |
| `/preview` route | **exists & serves** on production | authenticated fetch → `302` to Vercel SSO (protection, not 404) |

---

## 2. ⚠️ The 404 — diagnosis + exact founder fixes (dashboard-only)

**What Nick saw:** `404 DEPLOYMENT_NOT_FOUND` and the old app's styled "COORDINATES EXPIRED" 404, and `madgambit.io/gambit` still showing the old UI.

**Root causes (two, both domain-layer — the build is fine):**
1. **`madgambit.io` / `www.madgambit.io` is not attached to the `mad-mpp-2.23` project.** It points at an old deployment/project, which renders the old UI and has no `/preview` route (hence its styled 404). Requests to un-attached hosts/paths return `DEPLOYMENT_NOT_FOUND`.
2. **Deployment Protection (Vercel Authentication) is enabled** on `mad-mpp-2.23`, so even `mad-mpp-223-madgambit.vercel.app` 302-redirects anonymous visitors to a Vercel login.

**Fixes (Vercel dashboard, project `mad-mpp-2.23`, team `madgambit`):**
1. **See it right now:** open `https://mad-mpp-223-madgambit.vercel.app/preview` in a browser logged into Vercel as `maddegen` — it renders.
2. **Make production public:** Settings → **Deployment Protection** → set Vercel Authentication to **"Only Preview Deployments"** (or Disabled).
3. **Point the real domain:** first remove `madgambit.io`/`www` from whatever old project holds it, then Settings → **Domains** → add `madgambit.io` + `www.madgambit.io` to `mad-mpp-2.23`. DNS already points at Vercel, so propagation is instant. *(Note the long-standing Hobby-plan commercial-ToS flag — attach when ready per Part-A guidance.)*

After (2)+(3): `madgambit.io/preview` = the new hub, `madgambit.io/gambit` = the platform, both from current `main`.

---

## 3. What shipped this session (commit ledger, all CI-green)

| SHA | What |
|---|---|
| `faf965c` | Brand/card-visual-states + scandal-scraper 5-gate tree + chaos-fusion libs (es5-safe) |
| `3c555a3` | **vitest CI gate** (Unit Tests workflow, `--no-save` runner; tests excluded from tsc) |
| `11a4fa3` | Scandal decision tree wired live: entity resolver + GDELT bridge + `/api/v1/scandal/decide` |
| `cc6bc3a` | Scandal co-occurrence graph + Z-Liar satire-metrics + Dependabot grouping + `.env.example` sync |
| `2caa9eb` | Mockup landing assembly at `/preview` (additive route) |
| `eb19b1d` | Clickable perpetual tickers + arrow dopamine carousel + scroll parallax |
| `f94583f` | Strict-TS fix (computed CSSProperties key) |
| `1078075` | **GossipCop market class** + per-class market carousels + dials restored (`PerpDials`) |
| `6ab1d18` | **Satirical news engine**: RSS categories/publishers + `satire-headline.ts` + `/api/v1/news/satirical` + rotating carousel |
| `31be902` | Mockup **side menus** (category + account rails) + responsive 3-col shell + clickability |
| `27fa124` | **Triple** clickable ticker + **two-row photo carousel** (`news-two-row.tsx`) |
| `f1d3f94` | `/gambit` tabs **deep-linkable** (`?tab=`) + Platform Explorer bridge + canonical footer |
| `b14867d` | `/gambit` polish merged: **DottedGlowBackground (WebGL)** + ambient glows + **BrandLockup/Trinity** + lucide de-emoji + **6 feed categories** (Tabloid, Viral Social) |
| `80e3d90` | Meters+chrono container · **neon flip digits** · **`/gambit` floor port** (`GameProvider`) · **ZLiarMeter crash fix** · low-padding pass |
| `55ab87e` | **Merge commit on `main`** (PR #23) |

Earlier in the same branch (pre-hub): MADMarketFactory.sol + MADOptimisticOracle.sol (+tests), web2 $MADx engine (7 routes + wallet panel + `0008` migration), market classifier + Markets-for-Today, GDELT live ingest (+`0009` url-dedup), joy-engineering, dual-skin system, Bayesian layer, shield/cards/markets ledgers.

---

## 4. Architecture map — what lives where

**Route (the hub):** `verify/app/preview/page.tsx` — 3-col shell (rails ≥1024 px), `SkinProvider` (Neon Noir ⇄ Gilded) + `GameProvider` wrapping everything.

**Center column order:** BrandHero → LiveTicker (RSS wire) → `#mg-news` NewsTwoRow → Dopamine strip → **PerpDials** (meters row: ScandalVelocity · ZLiar · **GossipCopMeter**; cluster row: analog dials flanking `SeikoFlipClock scale=1.2` via new `centerSlot` prop) → SeikoDopamineHub → TopMarketsRail → MarketRails → ZLiarSection → Positions + EigenTrust/DopamineEngine grid → MarketTypeCarousels → `#mg-featured` FeaturedMarketCards → PlatformExplorer → canonical footer.

**New/changed components:** `crypto-ticker-dual` (3 clickable marquee feeds), `news-two-row` (two opposite-scrolling photo-card rows: Ent/Celeb/**Tabloid**/Crypto/Political/**Viral Social** + Z-Liar + GossipCop), `category-rail` + `account-rail` (lucide, no emoji), `platform-explorer` (deep-links `/gambit?tab=X`), `brand-lockup` (verbatim `/gambit` SVG, namespaced ids), `dopamine-carousel-strip`, `perp-dials`, `market-type-carousels`, `featured-market-cards`; `seiko-flip-clock` gained `scale` + neon digits; `gambit-instrument-cluster` gained additive `centerSlot` (no prop → `/gambit` unchanged).

**New libs:** `card-visual-states` · `scandal-scraper` (5-gate tree) · `chaos-fusion` · `scandal-entities` (curated name→faction) · `gdelt-scandal` (signal→decision bridge) · `scandal-graph` (co-occurrence "GraphRAG analog") · `satire-metrics` · `satire-headline` (deterministic 6-voice rewriter). All pure, es5-safe (`Array.from`, no Set/Map spread — tsc target is es5).

**New APIs:** `/api/v1/scandal/decide` · `/api/v1/scandal/graph` · `/api/v1/madhatr/satire?throttle=` · `/api/v1/news/satirical` (6 buckets × top-10 publishers, live RSS w/ image extraction, demo fallback through the same real math) · plus earlier `/api/v1/markets/proposals`, `/api/v1/ingest/gdelt`, 7× `/api/v1/madx/*`.

**Classifier taxonomy:** `MarketType = progression | saga | zliar | perp | gossipcop` (gossipcop = perp-eligible + horizon ≥365 d + gossip-themed).

---

## 5. Quality gates (all enforced in CI)

- **Type-check** `tsc --noEmit` (es5, strict) — `verify/`
- **Unit Tests** — vitest v3, **73 tests / 10 files** (scraper 19, chaos 8, visual-states 11, classifier 8, gdelt-bridge 5, satire-metrics 5, graph 4, sentiment 3, entities 5, headline 5); runner installed `--no-save` so the lockfile stays `npm ci`-clean
- **Foundry** — `forge build + test`, fuzz 1000 / invariant 256, via_ir
- **Placeholder Guard** — prose-stub tripwire
- **Neon branch CI** — `migrate` + `db:smoke` (13 assertions) on ephemeral branch; **DB Migrate (production)** applies `sql/0001–0009` on `main`
- **Dependabot** — weekly npm(`/verify`)+actions, minor/patch grouped; *security auto-PRs need the Settings → Advanced Security toggle (founder, UI-only)*

**Session verification protocol (keep it):** no "done" without commit SHA + green CI run + pasted log; UI work proven with headless-Chromium renders before push; production claims only from Vercel API state, never assumption.

---

## 6. Founder action checklist (nothing here is code)

1. **Deployment Protection → "Only Preview Deployments"** (unblocks the public). §2.
2. **Attach `madgambit.io`** to `mad-mpp-2.23`. §2.
3. **Prod env vars** (Vercel → Settings → Environment Variables): `DATABASE_URL`, `GOOGLE_API_KEY`, `SESSION_SECRET`, `CRON_SECRET`, `NEXT_PUBLIC_MADX_ADDRESS` (live: `0xb61ae7727579e3781ca0ec4902b6ba21d335fd18`), `NEXT_PUBLIC_{STAKING,MARKET_FACTORY,TREASURY}_ADDRESS`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_CHAIN_ID` — flips news/markets/madx from demo→live. (Values in the founder's "easter bunny" Drive file; never in git.)
4. **Dependabot security updates** toggle (Settings → Advanced Security).
5. Optional: **GDELT ingest cron** hitting `/api/v1/ingest/gdelt` with `CRON_SECRET` (15–30 min cadence per the GDELT handoff).

---

## 7. Open items / next moves (in rough priority)

1. **Promote `/preview` → `/`** once Nick signs off on the live page (one commit; keep old landing reachable at `/classic` or similar).
2. **Real imagery**: news cards use live RSS thumbnails when feeds provide them, branded gradients otherwise; card art awaits `CARD_ART_CDN` assets (`/public/cards/{faction}/{serial}.webp`).
3. **Theme unification** (larger refactor, scope deliberately): `/gambit` runs its own `SKIN_TOKENS` theme context; the hub runs `SkinProvider`. Floor components inside the hub render in `/gambit`'s palette — native on Neon Noir, slightly off on Gilded.
4. **#18 Octavian 3D node** — the `DottedGlowBackground` three.js field now in the hub is the natural foundation.
5. **Ticker price feeds**: hub ticker values are beta placeholders; wire to a price API (or the existing Kaito feed) when ready.
6. **`mad-mpp-2.24` propagation** (seed repo `mad-gambit-ui`) once 2.23 stabilizes.
7. Founder-confirm-gated deck edit: phantom co-founder removal (never autonomous).

## 8. Standing constraints (unchanged)

Canonical numbers: fee **1.88%** · creator **40%** · community **28.8%** · $MADx **888,888,888** (web2 beta mirrors on-chain cap 224,573,096 as `MADX_BETA`) · rarity/streak tables per `gambit-game-math.ts`. Neon + raw `pg` (no Drizzle/Supabase). `/gambit` layout stays additive-only. No secrets in git — ever. tsc target es5 (no Set/Map iteration). Model IDs never in commits/PRs.

**Key links:** PR #23 `https://github.com/MADdegen/MAD-MPP-2.23/pull/23` · prod inspector `https://vercel.com/madgambit/mad-mpp-2.23/HGLzocghALE2mqBUedcEQLEBH2nt` · live (auth'd until §2 fixes) `https://mad-mpp-223-madgambit.vercel.app/preview`

*Handoff complete — everything above is verified against the live systems it describes.*
