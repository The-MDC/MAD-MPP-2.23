# MAD Gambit — Session Handoff

**From:** `claude/mad-gambit-vercel-audit-ocof1b` (session `session_01SiYK27sK2BdHKNhsRqjDKe`)
**Into:** `claude/mad-gambit-enhancement-timeline-zdnx47` — **PR #20 "MAD Gambit master coding action plan"** (session `session_0189RBqzcVwpBtr9yUvXmmvG`)
**Purpose:** consolidate everything this ("vercel-audit") thread did into the comprehensive enhancement-timeline thread, so ONE effort is canonical. Stop the two-parallel-agent fragmentation.
**Date:** 2026-07-23

---

## 0. TL;DR for the consolidating session
- `main` is at **`d60f24f`** and **production is GREEN** (`mad-mpp-2.23` → https://mad-mpp-223-madgambit.vercel.app , deploy `dpl_6WxenFt…` READY). Everything below is already merged to `main` unless stated.
- This thread got the app **from fully broken → green**, then seeded a **`mad-mpp-2.24`** branch, then landed a small consolidation batch (**PR #21**) that **overlaps PR #20** — notably **both wrote `contracts/src/MADStaking.sol`**. That is the one real conflict to resolve.
- **Action for you:** rebase PR #20 onto current `main` (`d60f24f`), resolve the `MADStaking.sol` overlap (keep PR #20's more-integrated version), **keep** this thread's additive `.github/workflows/placeholder-guard.yml`, land PR #20, then propagate once to `mad-mpp-2.24`.

---

## 1. What this thread did (chronological)
1. **Diagnosed the dead Vercel deploys.** Both projects (`mad-mpp-2.23`, then-existing `mad-gambit-ui`) failed every build. Root causes: dashboard install override `cd verify && npm ci`; `verify/vercel.json`, `verify/next.config.js`, `verify/middleware.ts` were **prose placeholders**; and **48 files in `verify/` were one-line prose stubs**, not code (the app is in the **`verify/`** subdir; Root Directory must be `verify`).
2. **Recovered the real app.** The real source survived on branch `claude/mad-mpp-ci-cd-fixes-r0f76v` (== `…integration-plan-nbbqg8`). Restored `verify/` from it → **PR #17** (merged). Then **PR #19** removed the broken repo-root `middleware.ts` (Next 16/Turbopack was picking it up) + an invalid `eslint` key. **Result: `mad-mpp-2.23` production went GREEN.**
3. **Seeded `mad-mpp-2.24`.** "2.24" is **not a repo** — it's the **`mad-mpp-2.24` branch of `MADdegen/mad-gambit-ui`** (was empty: only README+SKILL "Phase 0"). Seeded it with the green `verify/` app → `mad-gambit-ui` **PR #1** (merged). Vercel project **`mad-gambit-2.24`** (`prj_TEVVoLDuzpx7YmPkJhcs67t3lLtR`) still needs manual settings (see §5).
4. **Published an audit report** debunking a SuperGrok "everything is complete" claim with byte-level evidence: https://claude.ai/code/artifact/54b246df-ef87-443a-940c-26a715226325 (also `docs/VERCEL_PRODUCTION_AUDIT.md`).
5. **Re-grounded against current `main`** using the Drive doc *"MAD-MPP production review and integration (3).md"*. Finding: **most of that (July-5) backlog is ALREADY in `main`** — see §3.
6. **Batch 1 → PR #21 (MERGED, `d60f24f`):** real `contracts/src/MADStaking.sol`, futarchy fee-lock fix, and a placeholder-guard CI. **This is what overlaps PR #20.**
7. **Discovered PR #20** (this handoff's target) and stopped, to avoid a third parallel edit stream.

---

## 2. Current ground truth (`main` = `d60f24f`)
- Production **GREEN**; build root = `verify/`, Next 16 + Turbopack, Node 22.x, framework nextjs.
- Vercel team **`madgambit`** (`team_TgoOJAiilwZ3I3LPyD2FcNZm`); project `mad-mpp-2.23` = `prj_XJ1OqBGYZMrg5eqJAZQQLnt1GYC9`.
- Preview (branch) deploys are skipped by an **Ignored Build Step**; only `main` builds production. CodeQL workflow was removed by the user earlier.

---

## 3. Evolution audit — ALREADY in `main` (do NOT re-add)
Verified present & real in current `verify/`:
- AI concierge + satire routes on **`gemini-flash-latest`** (the retired-gemini bug is fixed).
- **SIWE wired**: `app/api/v1/auth/nonce` + `…/verify` verify the signature and set an httpOnly `mg_session` cookie via `lib/siwe-verify.ts`. *(Note: PR #20 hardens this further — HMAC-signed sessions, durable nonce store, rate limits — keep PR #20's version.)*
- **Perpetual NYSE ticker, 3× double-tap cycle** (markets→satire→stats), localStorage-persisted, reduced-motion fallback (`components/live-ticker.tsx`).
- **Seiko hub** (`components/seiko-dopamine-hub.tsx`, 28KB), `main-nav.tsx` (Framer command drawer), `bottom-nav.tsx`.
- Canonical numbers in `lib/gambit-game-math.ts`: `FEE_BPS 188`, `CREATOR_SHARE_BPS 4000`, `COMMUNITY_SHARE_BPS 2880`, `MADX_FIXED_SUPPLY 888_888_888`; `STAKING_TIERS` Bronze→MAD Tier (12–68%).
- `lib/gambit-design-tokens.ts` (INK palette; cyan `#00e5ff`, pink `#ff007f`) imported by ~17 components; `vercel.json` clean (no legacy `builds`); no addiction/VRS language in repo.

---

## 4. What THIS thread added (reconcile into PR #20)
| File | What | Conflict with PR #20? | Recommended action |
|---|---|---|---|
| `contracts/src/MADStaking.sol` | Real tier-staking contract (SafeERC20 + ReentrancyGuard + Ownable; owner-funded reward reserve isolated from principal) + `contracts/test/MADStaking.t.sol` | **YES** — PR #20 has its own `MADStaking.sol` (commit `b1655c5`, integrated with `madhat-core`/StakingPool). Also removed the root `contracts/MADStaking.sol` stub. | **Keep PR #20's version** (more integrated). Drop this one on rebase. Salvage the Foundry test cases if PR #20's tests are thinner. |
| `verify/components/futarchy-board.tsx` | Fixed demo proposal "Increase Creator Fee to 42%" → tunable MAD Shield premium band (canonical fee/creator/community are never governable) | Maybe | Keep the fix (either version); the 40% fee lock must hold. |
| `.github/workflows/placeholder-guard.yml` | CI tripwire: fails build if any `verify/**` TS/TSX lacks code tokens, any `src/test` `.sol` lacks a pragma, or known placeholder phrases appear | **No — additive** | **KEEP.** This is the guard against the exact prose-placeholder regression that started this whole saga. |

Also from this thread (outside `MAD-MPP-2.23`):
- `mad-gambit-ui` @ `mad-mpp-2.24` branch = green `verify/` app (PR #1 merged). Re-propagate from the final reconciled `main` after PR #20 lands.
- Audit artifact + `docs/VERCEL_PRODUCTION_AUDIT.md`.

---

## 5. `mad-mpp-2.24` — pending MANUAL Vercel settings (no API; user does these)
Project `mad-gambit-2.24` (`prj_TEVVoLDuzpx7YmPkJhcs67t3lLtR`) currently errors `NEXT_NO_VERSION` because it isn't pointed at the seeded app:
1. Settings → Git: connect to `MADdegen/mad-gambit-ui`; **Production Branch = `mad-mpp-2.24`**.
2. Settings → Build & Deployment: **Root Directory = `verify`**; Install Command override OFF; **Node 22.x**.
3. Settings → Environment Variables: keys are in `verify/.env.example`; **values live in the user's "easter bunny" Google Drive file (ebooks)** — never printed.
4. Redeploy → should build green like `2.23`.

---

## 6. Canonical facts & laws (must hold across the consolidation)
- Platform fee **1.88%** (`FEE_BPS 188`); creator lifetime share **40%**; community **28.8%**; `$MADx` fixed supply **888,888,888**.
- **INK** tokens cyan `#00e5ff`, pink `#ff007f`; design law = import `gambit-design-tokens.ts`, no raw hex / Tailwind stock neon.
- **"Maintain the Vercel design/layout unequivocally"** — changes are correctness/wiring or purely additive; no visual regressions.
- Golden Genesis Founders NFT = **2,488** (888 = the separate En:tangled Founders NFT) — per PR #20's reconciliation.
- Deck = `The-MDC/MADHATs-Gambit-Presentation`; **patch O-V decks, never delete** (still in talks). Keep official domains **off** Vercel (Hobby commercial-ToS risk) until Pro.
- Stack locked: **GitHub + Vercel + Neon** (no Supabase). Grok output is unverified until byte-checked (the placeholder guard enforces this).

---

## 7. Remaining genuine gaps (small; after PR #20 lands)
- `verify/components/nft-card.tsx`: 48 raw hex → refactor to `INK`/`GOLD_CHISEL_STOPS` **with zero visual change** (only swap hex that exactly equals a token). Same for `positions-dashboard`, `staking-tiers-panel`, `tournament-arena`, `casino-panel`.
- `lib/bayesian-logic.ts` — named in old docs, referenced nowhere; optional.

---

## 8. Recommended steps for the enhancement-timeline session
1. Confirm this ("vercel-audit") session is idle (it is, after this handoff).
2. `git fetch`; rebase PR #20 (`b1655c5`) onto current `main` (`d60f24f`).
3. Resolve conflicts: **keep PR #20's `MADStaking.sol`**; keep `placeholder-guard.yml`; keep the futarchy fee-lock fix.
4. Run placeholder-guard + `tsc --noEmit` (GitHub runners have registry access; `forge`/`npm` are network-blocked in the web sandbox).
5. Mark PR #20 ready → merge → verify `mad-mpp-2.23` production READY (no 404).
6. Propagate reconciled `verify/` → `mad-mpp-2.24`; verify green.
7. Then the §7 follow-ups.

## Key links
- This session: `https://claude.ai/code/session_01SiYK27sK2BdHKNhsRqjDKe`
- Target PR: https://github.com/MADdegen/MAD-MPP-2.23/pull/20
- Audit report: https://claude.ai/code/artifact/54b246df-ef87-443a-940c-26a715226325
- Green production: https://mad-mpp-223-madgambit.vercel.app
