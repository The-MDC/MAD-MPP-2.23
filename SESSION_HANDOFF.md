# MAD Gambit (MPP-2.23) — Session Handoff

**Date:** 2026-07-11 · **Repo:** `maddegen/MAD-MPP-2.23` · **Default branch:** `main`
**main HEAD at handoff:** `623328c` (both session PRs merged) · **App root:** `verify/` (Next.js) · **Vercel project:** `mpp2.23` (team `madgambit`)

> New agent: read this top-to-bottom first. Everything below is verified against the repo/deploys in this session, not assumed.

---

## 0. How to preview (Vercel URL nuance — important)
- **Unified production (all features):** **https://mpp223-git-main-madgambit.vercel.app/** — this `git-main` alias always tracks the latest `main` deploy.
- Every **specific** deployment URL (e.g. `mpp223-bynxe6tn0-…`, `mpp223-jps3cvmxr-…`) is **immutable/frozen** to its commit — it never updates. Don't judge current state by those.
- Per-branch previews live at `mpp223-git-<branch-slug>-madgambit.vercel.app`.
- `node_modules` is NOT installed in the web session, so `tsc`/`next build` can't run locally — **the Vercel preview build is the authoritative green gate.** Push, then watch the deploy.

## 1. Canonical numbers (LOCKED — never change without founder sign-off)
`fee 1.88%` (188 bps) · `creator share 40%` (of fee, 4000 bps) · `community 28.8%` (2880 bps) · `MAD Shield recovery 28.8%` (premium 2–4%) · `$MADx supply 888,888,888` · `seed $1.24M–$2.48M @ $12M pre-money` · `Y3 $154.5M gross on $3.6B–$4.2B volume` (streams 51/31/12/6: fees/NFT/staking/shield) · `LLC = New Mexico` (filed; NOT Wyoming — verified against the filing PDF in Drive) · **chain: Arbitrum Nova launch/gameplay (42170), Arbitrum One (42161) for MAD Shield vaults + $MADx.**
Source of truth: `gambit-game-math.ts` (`PLATFORM`), `MAD_GAMBIT_INTEGRATION_PLAN.md`, `MADBIT_PRECISION_INTEGRATION_PLAN.md`, `ANTIGRAVITY_HANDOFF.md`, `verify/docs/CARD_CANONICAL_REFERENCE.md`.

## 2. What shipped this session (all merged to `main`)
- **PR #5** (earlier): deck data-conflict reconciliation + 8-tier Scandal Pack bonding curve + Nova-primary migration + tenure/fee/LLC fixes.
- **PR #6 — Real NFT card art pipeline** (merged `34782c2`):
  - `verify/lib/card-art.ts` → `cardArtUrl(serial)` tiles real art across the 992 deck; `CARD_ART_COUNT` regen'd by `verify/scripts/gen-card-art.mjs`.
  - `verify/components/nft-card.tsx` → `href = card.artUrl ?? cardArtUrl(card.serial) ?? CARD_ART_LOGO`; **rarity-aware treatment**: holographic (rarest) tiers show pure art, lower tiers get a faction-color wash, top-border glyph is a gold-leaf faction emblem.
  - `verify/public/cards/` → **25 of 152** real cards committed (`001–025.png`, 196×292) + `manifest.json`.
- **PR #7 — Ultra dashboard** (merged `623328c`):
  - `verify/context/theme-context.tsx` → **global ThemeProvider**: writes SKIN_TOKENS as CSS vars (`--mg-*`) on `<html>`, persisted; wraps app in `app/layout.tsx`; body bg is `var(--mg-bg)`.
  - `verify/components/main-nav.tsx` → **hamburger command drawer** inside DeviceFrame (7 tabs + Whitepaper link + global theme button).
  - `verify/components/market-factory.tsx` → **Market Factory** create-market UI (6 categories, DL-LMSR live pricing, creation-fee→treasury, 40% creator), mounted in The Floor.
  - `verify/components/whitepaper-sheet.tsx` → **abbreviated whitepaper / master product sheet** (replaces the old "Sandbox Documentation" stub on `app/page.tsx`).
  - Surfaced 2 orphaned components into the Logic tab: `FutarchyBoard`, `BayesianDecisionTree`.
  - Docs: `MAD_GAMBIT_ULTRA_DASHBOARD_PLAN.md`, `verify/docs/AUDIT_2026-07-11.md`.

## 3. App architecture (quick map)
- **Single app route** `verify/app/gambit/page.tsx` with 7 tabs: **Floor · Saga · Arena · Packs · Portal · Casino · Logic**. Wrapped by `components/device-frame.tsx` (responsive "phone on a workbench" shell; on desktop `.mg-device` has a `transform` → it's the containing block for `position:fixed` descendants, so nav/overlays anchor to the phone).
- **Root `/`** `verify/app/page.tsx` = a separate "workspace" landing dashboard. NOTE: it has its **own** legacy `theme` (dark/neon) from `mpp-context` — NOT unified with the global SKIN theme yet (see §5).
- **Design tokens:** `verify/lib/gambit-design-tokens.ts` (`INK`), `SKIN_TOKENS` in `gambit-game-math.ts` (3 skins: HolographicGoldLaser/CyberOnyx/QuantumCobalt). Rule: use tokens, no raw hex in new code.
- **Backend:** 13 API routes under `verify/app/api/**` (agents/scraper+trader = LangGraph; auth/nonce+verify = SIWE chain 42170; feeds; cards+open-pack; madhatr/zliar; mpp/simulate+profiles; tournament/match; concierge/chat; satire-engine). Mostly functional-now (simulated/local), demo-safe; live paths need env vars per `verify/docs/mpp-backend-architecture.md`.
- **Math:** `verify/lib/gambit-game-math.ts` — DL-LMSR (`calculateDLLMSRPrice/Cost`, volume-scaled α), Scandal Pack `SCANDAL_PACK_TIERS`/`scandalPackPrice`, shield tiers, GARCH, streak, evolution, `splitFee`. Verified matches the Drive `MATH_AND_FORMULAS_REFERENCE.md`.

## 4. Feature completeness (verified this session)
- **Dutch Auction** ✅ `dutch-auction-panel.tsx` (Packs tab). **Z-Liar Meter** ✅ `zliar-meter.tsx` (Portal) + API + wired across 8 surfaces. **Market Factory** ✅ frontend now exists (The Floor).
- The **on-chain** MarketFactory/DutchAuction contracts live in a **different repo** — see §6.

## 5. OPEN / TODO (next session)
1. **Confirm the unified `main` production build went green** (commit `623328c`, `mpp223-git-main-…`). A 3-min self-check was armed at handoff; verify via Vercel `get_deployment`.
2. **Card art: 127 of 152 remaining.** Sets still to pull from Google Drive `Product & DEV / _MΛĐHATs Gambit DEV`: **NFTCards 8, 11, 12, 13, 14, 15, 17, 18**. Method: `mcp__Google_Drive__download_file_content` per file (base64 → decode to `verify/public/cards/NNN.png`), then run `node verify/scripts/gen-card-art.mjs`, commit. IDs are enumerable via `mcp__Google_Drive__search_files` `title contains 'NFTCards<N>_card_'`. Batches of ~12 worked well.
3. **Parallax scroll layer** inside DeviceFrame (explicitly requested; deferred because it needs visual iteration — can't see the preview from the agent). Keep it reduced-motion-aware and don't break the `.mg-device` fixed-anchor.
4. **Unify the root `/` dashboard theme** — it still uses the legacy dark/neon toggle instead of the global SKIN ThemeProvider. Founder wants theme global; this is the last piece. (Design decision: replacing dark/neon changes the landing page's look — confirm before ripping it out.)
5. **P5 polish:** ~339 raw-hex token-debt refactor in components (zero-visual-delta), external/`/pitch` link crawl, mobile/reduced-motion QOL sweep. Also `roast-share.tsx` is still orphaned (it's a win/loss reward overlay — needs resolution-event wiring, not a static mount).

## 6. CROSS-REPO — the smart contracts (`The-MDC/demo-repository`)
- A **separate session** built `MarketFactory.sol`, `DutchAuction.sol`, and expanded `Errors.sol` (77 errors) on branch `claude/complete-auction-contracts-23vLW` in **`The-MDC/demo-repository`** (Foundry, `05-smart-contracts/madhat-core/`). Architecture: Solidity ^0.8.28, UUPS upgradeable, RolesRegistry access, manual reentrancy guard, DL-LMSR via `BondingCurve.sol`.
- ⚠️ **Those files were "staged but not committed."** If that session ended without committing+pushing, they are GONE (ephemeral container). **First action if pursuing contracts: verify they're actually on the remote branch.**
- **This session could NOT reach that repo:** `add_repo The-MDC/demo-repository` fails — **cross-owner adds aren't supported** (this session is rooted on owner `maddegen`). To work on the contracts you MUST **start a new Claude Code session with `The-MDC/demo-repository` as the initial source.**
- Contract TODOs (from that session's handoff): commit/push the 3 files; add DutchAuction + MarketFactory to `DeployCoreContracts.s.sol`; write tests; `forge build`; missing `EvolutionEngine.sol` / `GambitAMM.sol` (referenced, no source); then wire the mpp2.23 `market-factory.tsx` frontend to the deployed addresses.

## 7. Workflow notes / gotchas
- **Branch discipline:** develop on a fresh branch off `main`, push with `-u`, open a **draft** PR, let the Vercel preview validate, then merge. Never push straight to `main`.
- **PR webhooks** arrive as `<github-webhook-activity>`; they DON'T cover plain `main`/production builds — check those manually via Vercel MCP.
- **MCP connectors flap** intermittently (github/Google_Drive/Vercel drop and reconnect) — retry; use `ToolSearch "select:<tool>"` to (re)load tool schemas.
- **Large tool outputs** (Drive listings, base64 downloads, Actions lists) save to a tool-results file instead of returning inline — parse with `jq`/`python`.
- **Scope:** GitHub access is limited to `maddegen/MAD-MPP-2.23`. Do not read/write other repos unless added via `add_repo` (same-owner only).
- **Actions:** the only non-green runs are **cancelled Dependabot** background jobs — noise, not failures.

## 8. Key file index
```
verify/app/gambit/page.tsx          # 7-tab hub (mounts MainNav, MarketFactory, orphans)
verify/app/page.tsx                 # root workspace dashboard (legacy dark/neon theme)
verify/app/layout.tsx               # ThemeProvider wrap + var(--mg-bg) body
verify/context/theme-context.tsx    # GLOBAL theme (CSS vars)
verify/components/main-nav.tsx      # hamburger drawer + global theme button
verify/components/market-factory.tsx# create-market (DL-LMSR)
verify/components/whitepaper-sheet.tsx # abbreviated whitepaper modal
verify/components/nft-card.tsx      # card SVG + real-art + rarity/faction treatment
verify/lib/card-art.ts              # cardArtUrl(serial) tiling resolver (CARD_ART_COUNT=25)
verify/lib/gambit-game-math.ts      # PLATFORM consts, DL-LMSR, SCANDAL_PACK, SKIN_TOKENS
verify/scripts/gen-card-art.mjs     # regen CARD_ART_COUNT from public/cards
verify/public/cards/                # 25/152 real card PNGs + manifest.json
verify/docs/AUDIT_2026-07-11.md     # Phase-0 audit findings
MAD_GAMBIT_ULTRA_DASHBOARD_PLAN.md  # dashboard workstream plan (P0–P5)
```
