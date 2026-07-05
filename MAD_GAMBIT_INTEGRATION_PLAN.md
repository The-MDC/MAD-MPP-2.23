# MAD Gambit — Master Integration Plan (MPP Completion)

**Date:** 2026-07-05
**Scope:** Incorporate every production-relevant asset from the Google Drive `MADGit` folder, the Shaheryar design brief, the theme mockups/renderings, and the outstanding session work into the live Vercel production (`mpp2.23`, project `prj_4IdDBNaVoeUWutoEGbCc2zyzYpc7`) — surgically, without touching the locked design/layout.
**Prime directive:** What is rendering in Vercel production is the design baseline. Locked. Every step below is either (a) invisible correctness/wiring work, or (b) additive content that slots into the existing layout. No step restyles a shipped component.

---

## Ground Truth (verified 2026-07-05, not assumed)

| Fact | State |
|---|---|
| GitHub `main` HEAD | `a7f0bd5` — healthy: Gemini fix in (`model: "gemini-flash-latest"`), `vercel.json` clean, v2 math (OV_DECKS, `calculateDeltaLimit`, `shieldPhiRatio`, SKIN_TOKENS) present |
| Vercel production | **STALE** — serving `fb42450`, 3 commits behind. Live concierge + satire routes still carry the retired-model bug |
| Deploy pipeline | Broken: GitHub-triggered deploys of `a7f0bd5` ERROR'd twice (Jul 4); only dirty `vercel --prod` CLI deploys (actor: antigravity) reach READY |
| Drive `mad-gambit-fullstack` 13-file package | **Already integrated** into repo (commit `fb42450`), including all 5 v2 components and math sections 16–20. No re-import needed |
| Phase 2/3 session files (`main-nav.tsx`, `bottom-nav.tsx`, `bayesian-logic.ts`, `decision-tree.tsx`, `futarchy-board.tsx`) | **Not on GitHub.** Only `live-ticker.tsx` exists. Corrected versions (INK tokens, 40%-creator-share guard) were delivered in-session but never committed |
| Ticker triple-mode (stocks/commodities → RSS satire → platform stats, double-tap cycle) | **Not implemented.** `live-ticker.tsx` has zero mode-switching code |
| Design tokens | 4 of 30 components import `gambit-design-tokens.ts`. `nft-card.tsx` alone carries ~56 raw hex literals |
| Presentation repo (`The-MDC/MADHATs-Gambit-Presentation`) | HEAD `b23df31` still says **1.888%** (12× in `index.html`, 23 "MAD Gambit" mentions OK). The confirmed 1.88% revert was never pushed |
| SIWE | `siwe` in package.json; no signature verification wired. Pre-money blocker |
| Contracts | `MADCard1155/721.sol`, `MADShieldVault.sol` exist. `MADStaking.sol` missing. Card contracts have 0 tests |

**Canonical numbers (locked):** fee **1.88%** · community **28.8%** · creator **40%** · $MADx supply **888,888,888** · seed **$1.24M–$2.48M @ $12M pre** (deck-corrected figure; root `CLAUDE.md` still shows $1–2M — reconcile in Phase 6).

---

## Phase 1 — Unblock production (highest severity, ~1 hour)

The concierge and satire engine are dead in prod right now. Nothing else ships until this does.

1. **Redeploy `main` (`a7f0bd5`) to production.** The proven path is the CLI bypass: clean checkout of `a7f0bd5` → `vercel --prod` from `verify/`. Do NOT deploy from a dirty tree this time — the current READY deploy has `gitDirty: 1`, which means prod may contain untracked local edits nobody can reproduce.
2. **Verify:** `POST /api/concierge/chat` and `POST /api/satire-engine` return 200 with live Gemini output; build log no longer shows the legacy `builds` warning; all 12 routes compile.
3. **Root-cause the GitHub→Vercel pipeline. — RESOLVED 2026-07-05.** Diagnosis confirmed by this PR's own preview deploys: build compiled clean (11/11 routes), deployment reached READY, cache uploaded — yet the "Vercel" commit status reported **"Checks for Deployment have failed."** The failure was a **registered Deployment Check on the Vercel project**, not build/env/root-directory config (Root Directory was already correctly `verify`; builds never failed). Nick removed the failing Deployment Check in the Vercel dashboard (project → Settings → Git). This unblocks the Git-integration deploy path — future pushes to a branch/`main` deploy through the connected project and report status honestly, retiring the dirty `vercel --prod` CLI workaround that caused the stale-prod condition.
4. **Gate:** production commit SHA == GitHub `main` HEAD. This gate re-applies after every phase below.

## Phase 2 — Land the missing session files (GitHub, ~half day)

These exist only in chat transcripts / the Antigravity workspace. They are design-law-corrected and drop-in ready; they just never got committed.

1. Commit to `verify/`: `components/main-nav.tsx`, `components/bottom-nav.tsx`, `components/decision-tree.tsx`, `components/futarchy-board.tsx`, `lib/bayesian-logic.ts`, plus the corrected `live-ticker.tsx`. All six import `INK` from `gambit-design-tokens.ts` (no stock Tailwind neon), and `futarchy-board.tsx` keeps the guard comment: governance never wires to `FEE_BPS`/`CREATOR_SHARE_BPS`.
2. If the Antigravity local copies are gone, regenerate from the session spec — the acceptance criteria are in this repo's `ANTIGRAVITY_HANDOFF.md` plus the design-token rule above.
3. `bayesian-logic.ts` is additive — it must not modify `gambit-game-math.ts` or `mpp-math.ts`. Three math sources now exist; add a header comment in each pointing to the other two so they don't silently fork.
4. **Gate:** `tsc` 0 errors, `next build` green, 0 new raw hex values (`grep -c '#[0-9a-f]\{6\}'` on the six files ≈ 0).

## Phase 3 — Hero + ticker completion (the two explicit UX mandates)

Both slot inside the locked layout — the Seiko hub and ticker strip already occupy these positions in prod.

1. **Perpetual NYSE ticker, right-to-left, with three double-tap-cycled modes** in `live-ticker.tsx`:
   - Mode 1 — Stocks & commodities (extend `KaitoPriceTicker` data source or a market-data feed).
   - Mode 2 — RSS-fed satirical news (`/api/v1/feeds` → `/api/satire-engine`). **Depends on Phase 1** — this route is dead in prod today.
   - Mode 3 — Platform stats (volume, active predictions, chaos %, MADx — the top-strip values from the theme mockups).
   - Double-tap (`onDoubleClick` + mobile `touchend` double-tap detection) cycles 1→2→3→1. Persist last mode in `localStorage` (guard `typeof window`). Marquee never stops on mode switch — swap content mid-scroll.
   - `prefers-reduced-motion`: fall back to a static, paginated strip.
2. **Seiko clock as hero.** `seiko-dopamine-hub.tsx` already renders the flip-clock + dopamine carousel (carbon-copy of `theme_mockup_2New_dopamine_gold.png`). Confirm its slot in `app/gambit/page.tsx` matches the mockup hierarchy: ticker strip on top, clock as the dominant hero element, carousel and featured market cards below. This is placement verification, not redesign — the design brief (§Screen 2) and both mockups agree on this hierarchy.
3. **Gate:** visual parity screenshot vs. the two attached renderings; double-tap cycle works on desktop + mobile emulation; reduced-motion verified.

## Phase 4 — Drive (`MADGit`) file-by-file disposition

The folder was crawled completely. Disposition of every item that matters:

| Drive item | Disposition |
|---|---|
| `mad-gambit-fullstack/` (13-file package + v2 upgrades) | ✅ Already in repo. Close. |
| `For Claude/MATH_AND_FORMULAS_REFERENCE.md` | ✅ Implemented 1:1 in `gambit-game-math.ts`. Close. |
| `mad-gambit-fullstack/docs/BACKEND_PLACEHOLDERS.md` | **Adopt as the production-wiring backlog** (Phase 5 input). Copy into `verify/docs/` so it's versioned. 8 tracked placeholders: TRI_AGENT_LLM, CARD_ART_PIPELINE, WALLET_NFT_READ, PROFILE_DB, PVP_MATCHMAKING, ORACLE, SAGA_FEED, FEED_EXPANSION. |
| `MADHATs_Gambit_AI_Studio_NFT_Brief` | Feed the CARD_ART_PIPELINE placeholder: generate art per brief, host CDN/IPFS, key by serial into `nft-card.tsx`'s "ART PLACEHOLDER" slot. Parallel workstream — not blocking. |
| `For Claude/NFTCards*.png` (4 samples) + `mad_logo.png.png` | Commit to `verify/public/brand/` and `verify/public/cards/` as the first real art drops. The logo render (MΛĐ⚡Gambit neon) replaces/joins `madhatr-logo.png`. |
| `MADGambit_Website_Scope_v1` | Brief for the **separate** madgambit.fun marketing site (wallet-optional, Lighthouse >95, JWT handoff). Distinct project — do not merge into `mpp2.23`. Parked until the domain/Pro decision (Phase 6.4). |
| `New MAD Gambit_OV-Final.pdf` (Feb investor brief) | Stale seed ask ($1–2M). If still circulating, reissue with $1.24M–$2.48M. Doc task, not code. |
| `O-V/` (deck mhtml, Conviction-Markets PDF) | Inputs to Phase 6 deck patching. OV talks are live — **nothing gets deleted.** |
| LLC filing PDF, resumes, `.trashed-*`, git internals (`HEAD`, `objects/`, `hooks/`), gpt4all/installer binaries, `base.apk`, `.vsix` | Noise. No integration. **Recommendation:** move the LLC filing + legal docs out of this broadly-synced folder. |
| `madgambit code/`, `mad-gambit-marketdown2/` (Android/gradle trees) | Android companion app source — out of scope for the Vercel MPP. Leave in Drive; already mirrored in `ANDROID_*_HANDOFF.md` docs. |

## Phase 5 — Production wiring + money-safety (the "complete MPP" core)

Order matters: auth before anything that moves value.

1. **SIWE signature verification** — wire `siwe` verify into `auth-modal.tsx` flow + a server-side nonce route. A bare wallet address is currently trusted with no signature check. Blocks any real-money path; do it before staking/contracts work.
2. **PROFILE_DB** — replace in-memory/localStorage profiles with Postgres (Supabase is already in the stack) behind `DATABASE_URL`; schema per `verify/docs/mpp-backend-architecture.md §3`. This makes streaks, MMR, and collections real across devices.
3. **TRI_AGENT_LLM** — the zliar/concierge/satire routes work after Phase 1; upgrade to persona routing (Host Core → Sentinel/Strategist/Decay) per the agent brief. Keep `GEMINI_API_KEY` server-side only.
4. **ORACLE + PVP_MATCHMAKING + SAGA_FEED + FEED_EXPANSION** — in that order, each per the BACKEND_PLACEHOLDERS spec. Elomatic math is already real; only pairing and persistence are simulated.
5. **`MADStaking.sol`** — the TS `STAKING_TIERS` math has no on-chain counterpart. Write it + Foundry tests, plus first tests for `MADCard1155/721`. Apply the security-review skill before any contract merge (project rule).
6. **Language scrub** — remove "dopaminergic / anticipation circuits / VRS" neuroscience framing from any doc or comment that ships. Keep the mechanics, cut the liability wording.
7. **Gate per item:** endpoint 200s with persisted state; `forge test` green; no secrets in client bundles.

## Phase 6 — Design-law + data-room consolidation (zero visual delta)

1. **Token refactor, worst-first:** `nft-card.tsx` (56 hex) → `positions-dashboard` (9) → `staking-tiers-panel` (9) → `tournament-arena` (8) → `casino-panel` (7) → remaining 21. Rule: rendered output byte-identical; screenshot-diff each component before merge. Payoff: SKIN_TOKENS runtime skins become a single-file swap — a sellable seasonal-theme lever.
2. **Presentation repo — push the 1.88% revert.** `index.html` has 12 instances of 1.888% at HEAD; the revert was decided but never landed. Also apply the 7 consistency fixes already itemized: Y3 revenue (one number, everywhere), the 2 remaining $1M–$2M seed spots (incl. "THE ASK" slide 15/15), team roster vs. LLC filing, chain table vs. `foundry.toml` (Arbitrum One is what's built — make docs match code), one pack-pricing formula (shipped code says flat 4.88 — deck must match or code must change, pick one), Golden Ticket 2,488 vs 888, founder tenure (pick one of 14/15/16+).
3. **`ov-pitch-deck.html` — patch, never delete** (OV talks live): strip the AI-Studio editor chrome, align the ask/valuation to canonical, and decide deliberately whether the cap-table figures stay public.
4. **Domains/Pro:** stays parked per your call — Hobby-plan commercial exposure exists regardless of domains. When ready: Pro upgrade → both domains on `mpp2.23` → `middleware.ts` host routing (`madgambit.io` → hub, `madgambit.fun` → marketing surface per Website Scope doc). Confirm `madgambit.io` ownership first (still unanswered).
5. **Reconcile `CLAUDE.md` seed figure** ($1–2M → $1.24M–$2.48M) once you explicitly approve — it's a locked canonical requiring sign-off.

## Phase 7 — Design-brief alignment (Shaheryar) — mapping, not rebuilding

Your brief answers set the constraints: **no rebrand · hub first · then basic card game · mobile post-MVP · email/social sign-in first, wallet required to bet/earn.**

| Brief screen | Existing coverage | Gap to close |
|---|---|---|
| 1 — Landing (public) | None in `mpp2.23` | Belongs to the madgambit.fun marketing site (Website Scope doc) — Phase 6.4, separate project |
| 2 — Main Hub (clock, trays, ticker) | `/gambit` + `seiko-dopamine-hub` + `main-nav`/`bottom-nav` (Phase 2) | Collapsible left/right trays = the command-drawer pattern already in `main-nav.tsx`; verify right-tray contextual panel exists |
| 3 — Prediction feed | `dopamine-engine`, `positions-dashboard`, featured market cards | Quick-entry from card without navigation |
| 4 — Market detail | Partial (charts, entry panels exist as components) | Dedicated route with resolution rules + activity feed — schedule after Phase 5.2 (needs PROFILE_DB) |
| 5 — Card Game Hub (PvE/PvP/tournament) | `nft-saga`, `tournament-arena`, `pack-opening`, `casino-panel` | Entry-transition cue ("different room" feel) — additive animation only |
| 6 — Portfolio/Profile | `positions-dashboard`, `staking-tiers-panel` | P&L chart + achievements once PROFILE_DB is live |
| 7 — Onboarding | `auth-modal` | Email/social first → wallet-gate at bet/earn (matches your answer); add the 3-frame skippable explainer |

## Execution order & dependencies

```
P1 (redeploy+pipeline) ──► P3.1 Mode 2 (satire ticker)
P2 (session files)     ──► P3 (ticker/hero)  ──► P7 gaps
P5.1 (SIWE) ──► P5.2 (DB) ──► P5.4/P7.4/P7.6 ──► P5.5 (staking contract)
P4 (Drive dispositions) — parallel, no code dependencies
P6 (tokens + deck) — parallel; deck fixes before ANY investor send
```

**Definition of done for "complete MPP":** prod SHA == main HEAD; ticker triple-mode live; all six session files merged; 8 BACKEND_PLACEHOLDERS wired or explicitly deferred; SIWE enforced; 30/30 components on design tokens; deck internally consistent at 1.88% and one seed figure; every MADGit file dispositioned (integrated, parked, or declared noise) — this document is that ledger.
