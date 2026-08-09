# MAD Gambit — Dual-Ingestion & Entertainment-Intelligence Coding Action Plan

**Date:** 2026-07-24 · **Target:** `mad-mpp-2.23/verify` (Next.js 16 + Neon) + `MAD-Scandal-Corpus` (Python)
**Source:** synthesis of the Grok thread (GDELT, GossipCop++/Vault, Z-Liar, sentiment, dual-ingestion, market classification, gilded dopamine journey, "Markets for Today", agent tandem).

Every item below is a concrete, codeable step mapped to files. Status: ✅ shipped · 🟡 partial · ⬜ todo. "Gated" = needs founder infra (API key, external service, deploy).

---

## Phase 0 — Foundation (✅ shipped)
Already built and CI-green in this repo — the base the rest plugs into.

| Piece | File(s) | Status |
|---|---|---|
| GDELT parsers + scandal scoring | `verify/lib/gdelt.ts` (`parseGdeltField`, `parseGcam`, `scandalVelocity`, `themeScandalWeight`, `perpTriggerProbability`, `scoreGdeltRecord`) | ✅ |
| Z-Liar Meter math | `verify/lib/gambit-game-math.ts` (`zLiarMeter`, `bsIndex`, `garchUpdate`) | ✅ |
| Celebrity whitelist (Neon) | `verify/lib/whitelist.ts` | ✅ |
| Signal persistence | `verify/sql/0005_gdelt.sql` (`gdelt_signals`) | ✅ |
| Lexicon sentiment | `verify/lib/sentiment.ts` (`scoreSentiment` → valence/intensity/dopaminePotential) | ✅ |
| Market classifier | `verify/lib/market-classifier.ts` (`classifySignal` → Progression/Saga/Z-Liar/Perp, `proposalsForToday`) | ✅ |
| "Markets for Today" API + UI | `app/api/v1/markets/proposals/route.ts` · `components/markets-for-today-panel.tsx` | ✅ |
| Live pulse (chaos/momentum) | `app/api/v1/dopamine/metrics` · `components/dopamine-metrics-carousel.tsx` | ✅ |

---

## Phase 1 — Real dual ingestion (RSS + GDELT) → Neon (🟡/⬜)
Turn the classifier's inputs into a live, deduped feed.

1. **GDELT DOC 2.0 fetch route** — ⬜ `app/api/v1/ingest/gdelt/route.ts`
   - Call `https://api.gdeltproject.org/api/v2/doc/doc` with `query=(theme filters + scandal terms)`, `timespan=15min..24h`, `mode=ArtList`, `format=json`, `sort=datedesc`, `maxrecords=250`.
   - Parse → `{ headline, url, seendate, domain, themes, persons, tone }`; score with `scoreGdeltRecord` + `scoreSentiment`.
   - Upsert into `gdelt_signals` (dedupe by url). No key required for DOC; add polite rate limiting.
2. **RSS branch** — 🟡 extend existing `verify/lib/rss-feeds.ts` + `app/api/v1/feeds` to emit the same normalized signal shape.
3. **Dedup + merge layer** — ⬜ `verify/lib/ingest.ts` (`normalizeSignal`, `dedupeByUrlAndTitle`) merging both branches → one `Signal[]`.
4. **Scheduled trigger** — ⬜ Vercel Cron (`vercel.json` `crons`) hitting `/api/v1/ingest/gdelt` every 15–30 min. *(Gated: prod cron on Vercel.)*
   - **DoD:** a cron run writes fresh `gdelt_signals`; `/api/v1/markets/proposals` returns `source:"live"` with real classified proposals.

---

## Phase 2 — GossipCop++ "MAD Gossip Vault" historical priors (⬜, split repo)
Historical pattern layer that boosts Saga/Perp classification.

1. **Python (MAD-Scandal-Corpus):** ⬜ `scrapers/gossipcop_loader.py` (parse FakeNewsNet JSON/CSV → normalized records), ⬜ `indexer/build_graph.py` (entity/relationship + community summaries). *(Gated: dataset download + optional GraphRAG compute.)*
2. **Neon bridge (this repo):** ⬜ `verify/sql/0009_vault.sql` (`vault_patterns`: cluster_id, entities, era, resolution_days, virality) + `verify/lib/vault.ts` (`matchVaultPattern(headline) → { clusterId, horizonHint, similarity }`).
3. **Classifier hook:** ⬜ feed `vault.horizonHint` into `estimateHorizonDays` and `similarity` into `corroboration` in `classifySignal`.
   - **DoD:** a headline matching a stored cluster shifts toward Saga/Perp with a higher `convictionPrior`.

---

## Phase 3 — Z-Liar Meter enhancement (🟡)
1. ⬜ Extend `app/api/v1/madhatr/zliar/route.ts` to accept a signal, call `zLiarMeter` + `scoreSentiment` + optional `matchVaultPattern`, and return `{ reading, sentiment, vaultEcho, verdict }` with a 3s timeout guard on the vault lookup (graceful fallback).
2. 🟡 Surface the reading in `components/zliar-meter.tsx` with skin tokens (no raw hex).
   - **DoD:** posting a headline returns a Z-Liar score + optional vault echo; timeout falls back cleanly.

---

## Phase 4 — Unified gilded market-creation popup (⬜)
The "dopamine journey": Convictions → Predictions → Z-Liar → Make Your Own.

1. ⬜ `components/unified-market-creation-popup.tsx` — a `DashboardShell`-skinned modal with 4 tabs; each tab lists the relevant classified proposals (`type` filter) from `/api/v1/markets/proposals`.
2. ⬜ "Make Your Own" tab → posts to existing `/api/v1/markets` (creates a market in the ledger); optional `MADMarketFactory` path when on-chain.
3. ⬜ Entry points: a CTA in `MarketsForTodayPanel` + the dashboard hamburger. Reduced-motion aware; skin-aware.
   - **DoD:** open popup → pick a proposal → publish to `markets` → appears in `MarketsPanel`.

---

## Phase 5 — Persistence + auto-promotion (⬜)
1. ⬜ `verify/sql/0010_proposals.sql` (`market_proposals`: type, title, horizon_days, zliar_score, perp_prob, score, status) + persist top-N each ingest cycle.
2. ⬜ Auto-promote `score >= threshold` proposals into `markets` (status `suggested`) for "Markets for Today"/top-rail.
   - **DoD:** highest-scoring scandalous signals auto-appear as suggested markets; DB-smoke covers `market_proposals`.

---

## Phase 6 — Grok + Claude tandem orchestration (⬜, gated)
1. ⬜ `verify/lib/classification-assessor.ts` — a structured rubric prompt (Progression vs Saga vs Perp + Z-Liar overlay) callable against an LLM; falls back to the deterministic `classifySignal` when no key.
2. ⬜ `app/api/v1/agents/dual-ingest/route.ts` — orchestrator: ingest → deterministic classify → (optional) LLM validate → persist proposals. *(Gated: LLM API key; keep the deterministic path as the always-on default.)*
   - **DoD:** with a key, proposals carry an LLM-validated confidence; without one, the deterministic classifier still produces proposals.

---

## Phase 7 — Optional external ML sentiment service (⬜, separate service)
Only if lexicon sentiment proves insufficient. **Not in the Next app.**
1. ⬜ A small Python microservice (VADER → optionally DistilBERT) exposing `POST /sentiment`; the ingest route calls it when `SENTIMENT_SERVICE_URL` is set, else uses `lib/sentiment.ts`.
   - Note: transformer training/quantization (QAT/STE/etc.) lives here, if ever — never inside the serverless webapp.
   - **DoD:** `SENTIMENT_SERVICE_URL` swaps the scorer with zero change to the classifier.

---

## Execution order (recommended)
Phase 1 (live ingestion) → Phase 4 (popup, the visible win) → Phase 5 (persistence/promotion) → Phase 3 (Z-Liar polish) → Phase 2 (Vault) → Phase 6/7 (LLM/ML, gated).

## Global DoD (every phase)
`tsc --noEmit` green · new Neon tables covered by `db-smoke` · degrade-to-demo on missing DB/keys · skin-aware + reduced-motion UI · every "done" claim tied to a commit SHA + CI log.
