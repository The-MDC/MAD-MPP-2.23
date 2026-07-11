# MAD Gambit — Ultra-Fidelity Dashboard Merge · Execution Plan

**Branch:** `claude/mad-gambit-ultra-dashboard` (fresh, off `main` `345c0c1`) · **Own PR** (distinct from card-art PR #6)
**Date:** 2026-07-11

## Base & sources (decoded from the Vercel URLs)

| URL | Commit / branch | Role |
|---|---|---|
| `mpp223-jps3cvmxr` | `345c0c1` = **current `main`** | **BASE — keep everything intact** |
| `mpp223-1rzlf9a8c/gambit` | `e6c95ce` (Phase 3, older than main) | Additive source for hub |
| `…-nbbqg8/gambit` | PR #4 branch — **already merged into main** | Additive source for hub |

**Key fact:** both "merge" sources are already contained in `main` (nbbqg8 merged; e6c95ce predates it). So this is an **assemble-and-upgrade** workstream on the current base, not a git merge. Where any feature appears in more than one place, the tie-breaker order is: **live `main` code → `nbbqg8` build → `1rzlf9a8c` build**, and on genuine ambiguity we reference the in-repo docs (`MAD_GAMBIT_INTEGRATION_PLAN.md`, `MADBIT_PRECISION_INTEGRATION_PLAN.md`, `ANTIGRAVITY_HANDOFF.md`, `verify/docs/*`, `verify/README.md`) — the canonical numbers never move without sign-off (fee 1.88% · community 28.8% · creator 40% · $MADx 888,888,888 · seed $1.24M–$2.48M @ $12M pre).

Prime directive (unchanged): **the shipped Vercel layout is locked; every step is additive or a wiring/correctness fix.** No shipped component is restyled without an explicit visual-parity check.

---

## Phase 0 — Audit (item 5): top-down / bottom-up, front↔back, math, links, QOL, UX

Non-destructive discovery first; findings gate every later phase. Deliverable: `verify/docs/AUDIT_2026-07-11.md`.

1. **Build/type gate** — `tsc --noEmit` + `next build` on the base; record route count + any warnings.
2. **Frontend inventory** — enumerate all 35 components, the `/gambit` tab set, the root `/` dashboard, and the `DeviceFrame` render tree; map which are mounted vs orphaned.
3. **Backend inventory** — every route under `app/api/**` (concierge, satire-engine, v1/*), env-var dependencies, and simulated-vs-live status per `verify/docs/mpp-backend-architecture.md`.
4. **Math check** — reconcile `gambit-game-math.ts` / `mpp-math.ts` / `bayesian-logic.ts` against `MATH_AND_FORMULAS_REFERENCE` and the canonical constants; verify Scandal-Pack curve, shield tiers, BPS splits, APY, streak, evolution burn.
5. **Link check** — crawl internal hrefs/route targets + external links in the app and `/pitch/*`; flag any 404/dead anchors.
6. **QOL/UX deep dive** — reduced-motion, focus/keyboard nav, safe-area on the phone frame, tab-transition consistency, tap-target sizes, contrast (WCAG), loading/empty states.

Output: a ranked findings table (severity × area) that seeds Phases 1–5.

## Phase 1 — Navigation framework: hamburger + parallax within the phone

1. **`main-nav.tsx`** (the missing piece the integration plan specified) — a hamburger control docked in the `DeviceFrame` top bar; opens a Framer-Motion command drawer listing **all** hub destinations: Floor · Saga · Arena · Packs · Portal · Casino · Logic · Profile, plus Dashboard, Whitepaper/Docs, Theme. Active-state indicators; `localStorage`-persisted last route; `prefers-reduced-motion` static fallback.
2. **Parallax scroll** — layered scroll (background dopamine-gold field, mid ticker strip, foreground content) inside the phone viewport; GPU-cheap transforms only, disabled under reduced-motion. Must not break `DeviceFrame`'s fixed-descendant containing block (bottom-nav/concierge stay anchored).
3. **Theme button** — light/dark (+ optional SKIN_TOKENS seasonal skins) toggle wired to `gambit-design-tokens.ts`; persisted; no raw hex introduced.

## Phase 2 — Main landing hub (additive merge, precision)

1. Diff the hub hierarchy across the three sources; produce a single hub that keeps **all** `main` items intact and folds in anything unique from `1rzlf9a8c`/`nbbqg8` `/gambit` (e.g., state-machine surfacing, instrument cluster, joy-layer, featured-market grid) without duplication.
2. Hierarchy target (from both mockups + design brief): ticker strip → Seiko clock hero → dopamine carousel → featured market cards → tab rail. Screenshot-diff against base before merge.

## Phase 3 — Unified telemetry / state-node dashboard

1. Assemble `state-machine-view.tsx` (SCRAPER/TRADER node graphs), `gambit-instrument-cluster.tsx` (Z-Liar / Conviction / Scandal σ²), and live platform stats into **one** dashboard surface with consistent node indicators (status dots, live/simulated badges), reachable from the hamburger and the Logic tab.
2. Wire real endpoints where present; clearly-badged SIMULATED fallback on the preview.

## Phase 4 — Sandbox → abbreviated whitepaper / master product sheet (item 3)

1. Convert the sandbox info section into an in-app **abbreviated whitepaper / master product sheet**: problem → product (Conviction/Prediction/Affliction) → card economy → MAD Shield math → tokenomics ($MADx, 8-tier Scandal Pack) → chain (Nova launch / One vaults) → traction/projections ($154.5M Y3) → the ask ($1.24M–$2.48M @ $12M pre). Sourced verbatim from canonical docs; links to `/pitch` data-room.
2. Reachable from the hamburger ("Whitepaper") and root dashboard.

## Phase 5 — Verify, QOL polish, and close-out

1. Fix every Phase-0 finding by severity; re-run build/type/link checks.
2. Visual-parity screenshots vs. base for each touched surface; reduced-motion + mobile-emulation pass.
3. Update docs; open/keep the dashboard PR green on the Vercel preview.

---

## Execution order & gating

```
P0 audit ──► P1 nav/theme ──► P2 hub merge ──► P3 telemetry dashboard
                                     └► P4 whitepaper (parallel) ──► P5 verify+polish
```

**Definition of done:** base features 100% intact; hamburger + parallax + theme live in the phone render; one coherent hub folding all three sources with no duplication; unified telemetry/state-node dashboard; sandbox is an abbreviated whitepaper; audit findings resolved; preview READY; canonical numbers unmoved.

## Cadence

Each phase is its own commit on this branch; the app stays deployable throughout; the PR preview validates every push. Card-art work continues independently on PR #6.
