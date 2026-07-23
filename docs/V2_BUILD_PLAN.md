# MAD Gambit — v2 Feature Build Plan (front + back on Vercel + Neon)

_Deep dive + precision build plan for the "v2" feature surface. Companion to `MAD_GAMBIT_MASTER_ACTION_PLAN.md`._

## Part 0 — Corrected finding: the "v2 layer" is a STUB scaffold, not built code

An earlier pass over-called this: the ~40 files in `feature/nft-card-system-v2` (and the identical sets on `feat/supergrok-skills-guardrails`, `production-optimizations-and-env`) are **13–263-byte prose stubs**, not implementations. Direct reads:

- `api/information-market/create/route.ts` → `"file_content from create route"`
- `lib/data-platform/types.ts` → `"file_content from types.ts"`
- `app/dashboard/page.tsx` (83 B) → `"Integrated full UserProfile + P2PMarketLite... All features connected."` (empty file, false claim)
- `SeamlessWalletOnboarding.tsx` → a skeleton returning an empty `<div>`
- `api/realtime/ws/route.ts` (19 B) → `"WebSocket API route"`

This is the **fabricated-completion pattern** the `placeholder-guard` CI now blocks. **There is nothing to incorporate** — the scaffold is a *blueprint only*. Every v2 feature is therefore **uncoded** and this document is a build plan, not a merge plan.

## Part 1 — Architecture decisions (Vercel + Neon constraints)

1. **Realtime → SSE, not WebSockets.** Vercel serverless/edge functions cannot hold a long-lived WebSocket server, so the stubbed `api/realtime/ws` is a dead end. Use a **streaming Route Handler (SSE)** that tails `events_stream` on Neon by cursor (poll ~2 s, or `LISTEN/NOTIFY` within the request) and streams `text/event-stream`. (A managed service — Pusher/Ably — is the only alternative if SSE latency is insufficient; default to SSE to stay "within Vercel + Neon".)
2. **DB → raw `pg` on Neon.** New tables from `docs/imported/specs/MADHATS_DATABASE_SCHEMA.md` §1–5, applied as **plain-SQL migrations** committed under `verify/drizzle/migrations/` (or `verify/sql/`) and run against the PR's **ephemeral Neon branch** (the existing `neon-pr-branch.yml`). Drizzle stays deferred.
3. **Auth → reuse, don't duplicate.** Use `lib/siwe-verify.ts` + the Phase-2 signed session + `getSessionFromRequest()` guard. **Drop** the v2 `lib/auth/siwe.ts` stub (would be a second SIWE).
4. **Design → reuse `gambit-design-tokens.ts` (INK).** Drop the v2 `lib/design-tokens.ts`. New components live in `verify/components/` (kebab-case) — **not** `app/components/` (PascalCase). **Additive only** — the live `/gambit` layout is the locked baseline (design law).
5. **No stub-first scaffolding.** The guard rejects prose-stub files, so each PR ships *real, complete* files for its slice.
6. **The nav already has the slots.** `main-nav.tsx` advertises **Analytics, Reports, P2P Market, Personal Marketplace, Profile, Wallet, Leaderboard, Admin** — today they just switch existing `/gambit` tabs. Incorporation = turn those labels into real features (new tabs/panels/routes) + add the missing ones (Dashboard, Information Markets, Referrals, Session Keys, UGC, Creator/VIP).
7. **Contracts behind an adapter seam.** On-chain pieces (`P2PEscrowMarket`, `ReferralRewards`, `SessionKeyManager`, `MarketplacePlus`) are Foundry-gated (can't compile in the web sandbox). Build the Vercel+Neon layer first behind a thin contract-adapter interface; on-chain settlement lands in the Cursor/Foundry pass.

## Part 2 — Feature build plan (dependency-ordered slices)

Each slice = one PR. Format: **[data]** Neon · **[back]** Vercel API · **[front]** UI · **[env]** · **[DoD]**.

### V1 — Data Platform foundation _(unblocks dashboard, realtime, info-markets)_
- **[data]** `events_stream` (§3, monthly-partitioned), `cdp_profiles` (§4), `agg_platform_hourly` + `agg_user_daily` (§5). One SQL migration.
- **[back]** `lib/data-platform/{types,events,cdp}.ts` on raw `pg`: `emitEvent()`, `queryEvents(cursor)`, `upsertProfile()`, `getProfile()`. Routes: `api/v1/data/events` (POST emit / GET by cursor), `api/v1/data/cdp/[wallet]` (GET). A `api/v1/cron/rollup` route (Vercel Cron) fills the agg tables.
- **[DoD]** events persist to Neon; CDP profile computed; agg tables populated on schedule.

### V2 — Analytics Dashboard _(fills nav "Analytics"/"Reports")_
- **[back]** `api/v1/analytics/summary` (platform KPIs from agg tables), `api/v1/analytics/user/[wallet]` (from CDP).
- **[front]** `components/analytics-dashboard.tsx` — MetricCard grid + MarketsTable + UserIntelligencePanel (reuse `recharts`, already a dep). New `/gambit` "analytics" panel or a `/dashboard` route.
- **[DoD]** live KPIs from Neon render; wired into the existing "Analytics" nav entry.

### V3 — Realtime (SSE)
- **[back]** `api/v1/realtime/stream` — SSE GET; tails `events_stream` by cursor, heartbeats, closes cleanly.
- **[front]** `lib/realtime/use-live-stream.ts` (`EventSource` hook, auto-reconnect) + `components/live-metric-card.tsx` + `components/agent-signals-panel.tsx`; mount in the dashboard.
- **[DoD]** dashboard tiles update live from Neon via SSE; reduced-motion safe.

### V4 — Information Markets
- **[data]** `information_markets` (question, outcomes JSONB, creator_id, closes_at, resolution) — mirrors the existing `markets` shape.
- **[back]** `api/v1/information-market/{create,list,resolve}` — create is auth-gated + rate-limited; fees via `splitFee` (creator 40%).
- **[front]** `components/information-markets-panel.tsx` (list + create modal).
- **[DoD]** create → Neon → list → resolve, end-to-end; creator cut routed.

### V5 — Referrals _(fills nav "Profile")_
- **[data]** `referrals` (already specced §1:617 — referrer/referee/code/status/rewards).
- **[back]** `api/v1/referrals/{code,track,claim}`; rewards accrue via `meth_transactions`.
- **[front]** `components/referral-suite.tsx` (share code, referees, claim).
- **[contract]** `ReferralRewards.sol` (stub today) — on-chain payout later; off-chain ledger first.
- **[DoD]** code → attribution → reward credit, all on Neon.

### V6 — Session Keys (ERC-4337 AA) + Seamless Onboarding _(fills nav "Wallet")_
- **[data]** `session_keys` (owner, pubkey, scope, permissions JSONB, expires_at, revoked_at).
- **[back]** `api/v1/session-keys/{create,revoke,validate}` + presets (P2P Trading / Staking / Creator Mode). Alchemy AA-SDK.
- **[front]** `components/session-key-manager.tsx` (grants + presets) + `components/seamless-wallet-onboarding.tsx` (Web2-style silent AA smart-wallet).
- **[env]** `ALCHEMY_API_KEY`.
- **[contract]** `SessionKeyManager.sol` (stub) — on-chain validation later.
- **[DoD]** create/revoke/validate persisted to Neon; onboarding mints an AA wallet; presets scope permissions.

### V7 — P2P Market + Personal Marketplace + micro-loans _(fills nav "P2P Market"/"Personal Marketplace")_
- **[data]** `marketplace_listings`, `p2p_orders` (escrow-state machine), `micro_loans`.
- **[back]** `api/v1/marketplace/{assets,list,buy}`, `api/v1/p2p/{orders,match}`, `api/v1/loans/*` — auth + parameterized pg.
- **[front]** `components/p2p-market.tsx` (behavioral nudges: suggested price, live counters, scarcity — client logic) + marketplace panel.
- **[contract]** `P2PEscrowMarket.sol` + `MarketplacePlus` (Foundry-gated) — escrow settlement; off-chain order book + optimistic UI first.
- **[DoD]** list/buy/sell cards on Neon; P2P order state machine; nudges render.

### V8 — UGC Feed + Creator / Profile / VIP
- **[data]** `ugc_posts` (author, body, media_url, reactions JSONB, moderation_state); reuse `degen_nominations`.
- **[back]** `api/v1/ugc/{feed,post,react}` — auth + rate-limit + moderation; sanitized render.
- **[front]** `components/ugc-feed.tsx` + creator/profile/vip panels (or `/creator`, `/profile`, `/vip` routes).
- **[DoD]** post → moderate → feed on Neon, sanitized; creator/profile/vip live.

## Part 3 — Cross-cutting build standards (every slice)
- Mutating routes: `getSessionFromRequest()` auth + `lib/rate-limit` + **parameterized** `pg` + generic error bodies (the Phase-2 security patterns; no `e.message` leaks).
- Every file is real code (placeholder-guard) — no scaffolding-first.
- Per PR gate: **type-check + placeholder-guard + `next build`** green, and any new Neon table ships as a committed SQL migration validated against the PR's ephemeral Neon branch.
- Additive only — never alter the live `/gambit` layout; add tabs/panels/routes and fill the existing nav slots.

## Part 4 — Build order (each is one PR-sized slice)
**V1 Data Platform → V2 Dashboard → V3 Realtime(SSE) → V4 Information Markets → V5 Referrals → V6 Session Keys/Onboarding → V7 P2P/Marketplace/Loans → V8 UGC/Creator/Profile/VIP.**

V1 is the backbone (V2/V3/V4 depend on it). V5/V6 are independent identity/growth slices. V7/V8 carry the only new contracts (all Foundry-gated). Nothing here reuses the stub files — they are discarded; their filenames/descriptions served only as the blueprint captured above.
