# MADBit → MAD Gambit — Precision Integration Plan (Outlier-Ready)

**Date:** 2026-07-05 · **Target:** whole app complete + demo-ready for Outlier Ventures tonight
**Repo:** `MADdegen/MAD-MPP-2.23` · **Branch:** `claude/mad-gambit-integration-plan-nbbqg8`
**Prime directive (from thread history):** the Vercel design/layout is locked "unequivocally." Every step is additive or a wiring/correctness fix. No shipped component is restyled. Canonical numbers never change without sign-off: fee **1.88%**, community **28.8%**, creator **40%**, $MADx **888,888,888**, seed **$1.24M–$2.48M @ $12M pre**.

This plan dispositions **every file** in the Drive `MADGit` folder (the "MADBit" folder) and its subfolders. Nothing that belongs in the app is left out; everything that doesn't is explicitly declared noise so it's a closed ledger.

---

## Legend
`✅ DONE` already in repo · `🔨 BUILD` code work this session · `🎨 ASSET` binary to stage · `📄 DOC` doc-only · `🅿️ PARK` separate project/workstream · `🗑️ NOISE` excluded with reason

---

## A. Root of MADGit — top-level items

| Drive item | Disp. | Action |
|---|---|---|
| `For Claude/` (curated payload) | — | See section B — the authoritative source folder |
| `mad-gambit-fullstack/` (June 29 + July 1) | ✅ DONE | 13-file package + v2 upgrades already committed at `fb42450`. Verified: OV_DECKS, `calculateDeltaLimit`, `shieldPhiRatio`, SKIN_TOKENS, sections 16–20 all present in `verify/lib/gambit-game-math.ts` |
| `mad-gambit-fullstack/docs/BACKEND_PLACEHOLDERS.md` | 🔨 BUILD | Copy into `verify/docs/` (versioned) as the 8-item production-wiring backlog → section D |
| `MADHATs_Gambit_AI_Studio_NFT_Brief` (57 KB doc) | 🎨 ASSET | 900+ card generation brief. Drives CARD_ART_PIPELINE (§D). Parallel — non-blocking for demo |
| `MADGambit_Website_Scope_v1` | 🅿️ PARK | Spec for the **separate** madgambit.fun marketing site (wallet-optional, Lighthouse >95, JWT handoff). Distinct Vercel project — not merged into `mpp2.23` |
| `New MAD Gambit_OV-Final.pdf` (Feb brief) | 📄 DOC | Stale seed ask $1–2M → reissue at $1.24M–$2.48M if still circulating to OV |
| `O-V/` (deck mhtml, Conviction-Markets PDF, Dimi OV html) | 📄 DOC | Inputs to deck consistency (§E). OV talks live — **nothing deleted** |
| `120655 MAD-GAMBIT LLC_NewMexico-AO FILED.pdf` | 🗑️ NOISE (app) / 📄 FLAG | Authoritative LLC source (New Mexico, filed Mar 25 2026). Not app code. Recommend moving it + legal docs out of this broadly-synced folder |
| `refs/`, `resources/`, `Reference/`, `Licenses/` | 🎨 ASSET | Brand/theme reference images (logos, theme_mockup_1/2_dopamine_gold, MAD Gambit Logo1A.jpg). Design source-of-truth for the locked look; stage the logo (§C) |
| `1777157708067.png`, `theme_mockup_*_dopamine_gold.png` | 🎨 ASSET | The dopamine-gold hub mockups the Seiko hub was carbon-copied from. Reference only — hub already built |
| `base.apk`, `gpt4all`/installer binaries, `maintenancetool.*`, `.vsix`, `.exmu-cfg1.data` | 🗑️ NOISE | Installers/binaries — not app source |
| git internals (`HEAD`, `config`, `objects/`, `hooks/`, `info/`, `description`, `git`) | 🗑️ NOISE | Raw Drive-synced `.git` internals — not files |
| `.trashed-*` resumes, `applet_access_history.json` | 🗑️ NOISE | Personal/trashed — exclude |
| `Ollama_OpenClaw Agentic Orchestration` | 🅿️ PARK | Agent-infra note — informs §D persona routing, not app code |
| `madgambit code/`, `mad-gambit-marketdown2/` (gradle/Android trees) | 🅿️ PARK | Android companion app — out of scope for the Vercel MPP; mirrored in repo `ANDROID_*_HANDOFF.md` |

## B. `For Claude/` — the curated integration payload (authoritative)

| File | Disp. | Action |
|---|---|---|
| `MATH_AND_FORMULAS_REFERENCE.md` | ✅ DONE | Implemented 1:1 in `gambit-game-math.ts` (Dutch auction, LMSR, BPS splits, rarity/APY, streak, evolution burn). No drift |
| `mad-gambit-fullstack/` (nested) | ✅ DONE | Same package as §A |
| `HANDOFF_MAD_GAMBIT.md` | 📄 DOC | §5 lists the 7 real RSS feeds now live in `lib/rss-feeds.ts`. Reference |
| `AGENTS.md` | 🔨 BUILD | MADHAT'r system instruction — the persona for TRI_AGENT_LLM wiring (§D.3) |
| `claude.md` / `GEMINI.md` / `qwen.md` / `gemma.md` / `nemotron-3Super.md` / `Manus.md` / `Cowork.md` | 🗑️ NOISE | Per-model scratch context files — superseded by the repo's own `CLAUDE.md`/`ANTIGRAVITY_HANDOFF.md` |
| `README.md`, `CHAT_SUMMARY_AND_TODO.md`, `border_usages` | 📄 DOC | Historical context — folded into this plan |
| `remix_-mad-gambit-pitch-deck/`, `MAD Gambit Presentation/` | 📄 DOC | Deck sources — §E |
| Android scaffolding (`gradle/`, `app/`, `*.gradle.kts`, `gradle.properties`, `settings.gradle.kts`, `replace_fonts.mjs`, `override_shapes.sh`, `metadata.json`) | 🅿️ PARK | Android build — out of MPP scope |
| `NFTCards*.png` (4), `mad_logo.png.png`, `Generate_MAD_Gambit.py` | 🎨 ASSET | Real card art samples + neon logo + card-gen script → CARD_ART_PIPELINE (§D.2, §C) |

## C. Asset staging (🎨 — parallel, non-blocking for demo)

The app renders working procedural SVG card art today, so none of this blocks the Outlier demo. Stage when a low-context binary path is available (drag-drop into repo, or `git` from a machine with Drive access):
1. `mad_logo.png.png` / `MAD Gambit Logo1A.jpg` → `verify/public/brand/mad-gambit-logo.png` (join/replace `madhatr-logo.png`).
2. `NFTCards*_card_*.png` (4 samples) → `verify/public/cards/` keyed by serial; drop into `nft-card.tsx`'s "ART PLACEHOLDER" slot.
3. Full 900+ set → generate per `MADHATs_Gambit_AI_Studio_NFT_Brief`, host CDN/IPFS, key by serial.

## D. Backend wiring backlog (from BACKEND_PLACEHOLDERS.md — 🔨/🅿️)

Every placeholder is functional-now (simulated/local) and demo-safe. Order = auth before value. **These are diligence items, not demo-blockers — do NOT rush the money-touching ones for tonight.**
1. **SIWE signature verification** 🔨 — wire `siwe` verify + server nonce into `auth-modal`/`wallet-gateway`. Pre-money-critical; gate before any real-value path.
2. **CARD_ART_PIPELINE** 🎨 — §C.
3. **WALLET_NFT_READ** 🅿️ — ERC-1155/721 balances via `EVM_RPC_URL` + Alchemy AA-SDK.
4. **PROFILE_DB** 🔨 — Postgres behind `DATABASE_URL`; schema per `docs/mpp-backend-architecture.md §3`.
5. **TRI_AGENT_LLM** 🔨 — persona routing (Host Core → Sentinel/Strategist/Decay) per `AGENTS.md`; `GEMINI_API_KEY` server-side. Depends on Phase-1 redeploy.
6. **ORACLE** 🅿️ — Chainlink VRF/price feeds + News API.
7. **PVP_MATCHMAKING** 🅿️ — MMR-band pairing (Elomatic math already real).
8. **SAGA_FEED / FEED_EXPANSION** 🅿️ — live chained markets + expand RSS breadth.
9. **`MADStaking.sol` + Foundry tests** 🅿️ — TS `STAKING_TIERS` has no on-chain counterpart yet; first tests for Card contracts. Security-review skill before merge.

## E. Deck / data-room consistency (📄 — before any Outlier send)

1. **Presentation repo:** push the 1.88% revert (HEAD still shows 1.888% ×12 in `index.html`).
2. Fix the 7 known inconsistencies: Y3 revenue (one number), the 2 remaining $1M–$2M seed spots incl. "THE ASK" slide, team roster vs. LLC filing, chain table vs. `foundry.toml` (Arbitrum One is built), one pack-pricing formula (code = flat 4.88), Golden Ticket 2,488 vs 888, founder tenure.
3. **`ov-pitch-deck.html`** — **patch, never delete** (OV talks live): strip AI-Studio editor chrome, align ask/valuation to canonical, add key features + canonical numbers.

## F. Design-brief alignment (Shaheryar) — constraints locked from his Q&A
No rebrand · hub first · basic card game next · mobile post-MVP · **email/social sign-in first, wallet required to bet/earn**. Screen mapping unchanged from `MAD_GAMBIT_INTEGRATION_PLAN.md §Phase 7`.

---

## TONIGHT — execution sequence (concrete, code, additive)

Ordered by demo value × safety. Each ships to the branch; the app stays deployable throughout.

1. **🔨 Ticker triple-mode** (`live-ticker.tsx`) — the explicit ask. Perpetual right-to-left NYSE marquee, **double-tap cycles three modes**: (1) Stocks & commodities, (2) RSS-fed satirical news, (3) Platform stats. Mode persisted in `localStorage`; `prefers-reduced-motion` static fallback; existing Live-Wire aesthetic preserved (design-locked). **← building now**
2. **🔨 Six session files** — `main-nav.tsx` (sticky nav + Framer command drawer: Futarchy/Predictions/Profile), `bottom-nav.tsx` (mobile action bar, active-pulse + scale haptics), `bayesian-logic.ts` (additive; header cross-refs the other two math sources), `decision-tree.tsx`, `futarchy-board.tsx` (governance guard: never wires `FEE_BPS`/`CREATOR_SHARE_BPS`; demo proposal tunes Shield premium). All import `INK` tokens — no stock Tailwind neon.
3. **🔨 Seiko hero verification** — confirm `seiko-dopamine-hub.tsx` slot in `app/gambit/page.tsx` matches the dopamine-gold mockup hierarchy (ticker top → clock hero → carousel → featured market cards). Placement check only.
4. **🔨 BACKEND_PLACEHOLDERS.md → `verify/docs/`** + `bayesian-logic` math-source cross-ref headers.
5. **📄 Deck 1.88% revert + 7 fixes** (separate presentation repo) — before the deck is sent.
6. **Gate each:** `tsc` 0 errors · `next build` green · 0 new raw hex · deploy READY.

**Deferred, explicitly, from "tonight" (money-safety — rushing these is the bad outcome for a raise):** SIWE, PROFILE_DB, contracts. They are diligence-stage, not demo-stage; the app demos fully without them via the existing functional-now placeholders.

**Definition of done (Outlier-ready):** prod SHA == main HEAD · ticker triple-mode live · six session files merged · Seiko hero verified against mockup · deck internally consistent at 1.88%/one seed figure · every MADBit file dispositioned above (integrated / parked / declared noise).
