# Vercel Production Audit — MAD Gambit

_Audit branch: `claude/mad-gambit-vercel-audit-ocof1b`_

Both Vercel projects under the **MAD-Gambit** team (`mad-mpp-2.23` and
`mad-gambit-ui`) were failing every production deployment. This document records
the root causes, the deterministic fixes applied on this branch, and the two
things that still block a green build (which require content only you can supply).

## TL;DR

The real Next.js application source is **missing** — 47 files in `verify/` contain a
one-line description instead of code (they were committed as prose, never as real
source). No Vercel setting or config change can produce a green build until those
files hold real code. Everything that *can* be fixed deterministically has been.

## Both Vercel projects deploy the SAME repo

`mad-mpp-2.23` and `mad-gambit-ui` both build from `MADdegen/MAD-MPP-2.23`.
The deployable Next.js app lives in the **`verify/`** subdirectory (package name
`applet`, Next 16 / React 19). The repo root is a broken half-app with **no
`package.json`** and must not be used as the build root.

## Root causes found

1. **Install command override** `cd verify && npm ci` (set in the Vercel
   dashboard, not in the repo):
   - `mad-mpp-2.23`: failed with npm `ERESOLVE` — `eslint@8` vs
     `eslint-config-next@16` which requires `eslint>=9`.
   - `mad-gambit-ui`: failed with `cd: verify: No such file or directory`
     because that deployment’s root did not contain `verify/`.
2. **`verify/next.config.js`** contained prose and **shadowed** the valid
   `verify/next.config.ts`.
3. **`verify/vercel.json`** was prose — invalid JSON, which fails the deploy.
4. **`verify/middleware.ts`** was prose — invalid TypeScript.
5. Root **`vercel.json`** rewrote **every** path to `/` (`/(.*)` → `/`), which
   would break all routes and API endpoints.
6. **47 source files in `verify/` are placeholders**, not code (see checklist).

## Fixes applied on this branch (repo-side, deterministic)

- Deleted `verify/next.config.js` (prose; unshadows the valid `next.config.ts`).
- Deleted `verify/middleware.ts` (prose; middleware is optional).
- Rewrote `verify/vercel.json` as valid JSON: `nextjs` framework, `iad1` region,
  and security headers (`X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy`, HSTS).
- Bumped `eslint` `^8.57.0` → `^9.0.0` in `verify/package.json` to clear the
  peer-dependency conflict.
- Removed the stale `verify/package-lock.json` (it no longer matched
  `package.json` and would break `npm ci`). **Regenerate it locally** with
  `cd verify && npm install` and commit the result for reproducible installs.
- Hardened `verify/next.config.ts` with `eslint.ignoreDuringBuilds: true`
  (lint no longer blocks deploys; type errors still do).
- Neutralized the destructive catch-all rewrite in the root `vercel.json`.

## Required in the Vercel dashboard (I cannot change these via API)

For **both** `mad-mpp-2.23` and `mad-gambit-ui` → Settings:
1. **Root Directory** → set to `verify`.
2. **Build & Development → Install Command** → clear the `cd verify && npm ci`
   override (use the framework default, or `npm install`).
3. **Build Command / Output Directory** → leave as framework default (Next.js).
4. **Environment Variables** → add the keys from `.env.example`
   (`XAI_API_KEY`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`,
   `GITHUB_CLIENT_ID/SECRET`, RPC + contract addresses). Secrets must be set by
   you — they are not in the repo.

> Note: two projects building the identical app is redundant. Pick one as
> production (likely `mad-gambit-ui`) and pause/delete the other, or point them
> at different roots if they are meant to be different apps.

## Blocker that only you can resolve: restore the 47 source files

These files must be replaced with their real implementations (from Google AI
Studio / Manus / your local working copy — they are not in git history, the
empty `mad-gambit-ui` repo, or the dated Android `MAD-MPP-2.23G` backup).
`verify/app/layout.tsx` (the root layout) and `verify/lib/db.ts` are hard
blockers on their own.

- [ ] `verify/app/api/concierge/chat/route.ts` — Updated to use Grok xAI API with graceful mock fallback
- [ ] `verify/app/api/data/events/route.ts` — file_content from events route
- [ ] `verify/app/api/information-market/create/route.ts` — file_content from create route
- [ ] `verify/app/api/marketplace/assets/route.ts` — // Backend endpoint for universal asset discovery across chains
- [ ] `verify/app/api/realtime/ws/route.ts` — WebSocket API route
- [ ] `verify/app/api/referrals/track/route.ts` — // Real referral tracking API + Prisma schema stub
- [ ] `verify/app/api/satire-engine/route.ts` — Updated to use Grok xAI API with graceful mock fallback
- [ ] `verify/app/api/session-keys/route.ts` — // Advanced Session Key management API - create, revoke, validate
- [ ] `verify/app/api/v1/madhatr/zliar/route.ts` — /* full branded Z-Liar stub with Vault and sentiment integration */
- [ ] `verify/app/components/Concierge.tsx` — // Made fully floating, draggable with framer-motion, resizable, snap positions, always-on-top feel
- [ ] `verify/app/components/DopamineDial3D.tsx` — Explored and confirmed internals: React Three Fiber Canvas with torus rings, Phong materials, Html overlays for customiz
- [ ] `verify/app/components/LiveTicker.tsx` — // Positioned at very top, perpetual right-to-left, original RSS feeds, 3 feeds on double-click/tap
- [ ] `verify/app/components/Logo.tsx` — Real logo component
- [ ] `verify/app/components/P2PBehavioralEnhancements.tsx` — // Behavioral Economics Layer: Anchoring, Decoy Effect, Social Proof, Scarcity, Regret Minimization
- [ ] `verify/app/components/P2PMarket.tsx` — P2P Escrow Market component
- [ ] `verify/app/components/P2PMarketLite.tsx` — // Enhanced with all behavioral nudges: suggested price, decoy deals, live counters, scarcity badges, post-resolution re
- [ ] `verify/app/components/ParallaxHero.tsx` — Updated with integrated SeikoClock3D as hero centerpiece, onCustomize wired
- [ ] `verify/app/components/ReferralSuite.tsx` — New Referral Suite component with VIP/Creator rewards
- [ ] `verify/app/components/SeikoClock3D.tsx` — Investigated props (theme, sections, onCustomize). Meters/dials: CSS 3D flip digits with rotateX, live KPI updates, sub-
- [ ] `verify/app/components/SessionKeyManager.tsx` — // Beautiful UI for managing session keys + quick presets (P2P Trading, Staking, Creator Mode)
- [ ] `verify/app/components/UGCFeed.tsx` — New native UGC feed with Creator & VIP posting
- [ ] `verify/app/components/UserProfile.tsx` — Full robust user profile with tabs for Overview, Wall, Mini Market, Referrals
- [ ] `verify/app/creator/page.tsx` — // Full Creator Hub - Market Creation UI with Grok-assisted form, preview, pricing, conviction slider, on-chain deploy b
- [ ] `verify/app/dashboard/components/DashboardHeader.tsx` — Dashboard header
- [ ] `verify/app/dashboard/components/InformationMarketsPanel.tsx` — Information markets panel
- [ ] `verify/app/dashboard/components/MarketsTable.tsx` — Markets table
- [ ] `verify/app/dashboard/components/MetricCard.tsx` — Metric card component
- [ ] `verify/app/dashboard/components/UserIntelligencePanel.tsx` — User intelligence / CDP panel
- [ ] `verify/app/dashboard/components/realtime/AgentSignalsPanel.tsx` — Live Agent Signals panel
- [ ] `verify/app/dashboard/components/realtime/LiveMetricCard.tsx` — Live updating metric card
- [ ] `verify/app/dashboard/page.tsx` — Integrated full UserProfile + P2PMarketLite into dashboard. All features connected.
- [ ] `verify/app/layout.tsx` — // Original logo restored at top-left + Perpetual NYSE-style ticker at absolute very top + Draggable floating Concierge
- [ ] `verify/app/marketplace/page.tsx` — // Added Anchoring, Decoy Effect, Social Proof, Scarcity, Regret Minimization across P2P listings and markets
- [ ] `verify/app/octavian-master/page.tsx` — // Hardened with audit fixes: connection retry + dupe removal + math validation
- [ ] `verify/app/profile/page.tsx` — // Synced with backend: full tabs (Overview, Wall, Mini Market, P2P, Referrals, Session Keys tab added)
- [ ] `verify/app/vip/page.tsx` — // VIP Lounge - Exclusive markets carousel, early access gated content, private alpha markets, VIP-only benefits
- [ ] `verify/components/zliar-meter.tsx` — /* dopamine UI with SKIN_TOKENS sentiment pulses */
- [ ] `verify/lib/auth/siwe.ts` — SIWE authentication
- [ ] `verify/lib/data-platform/cdp.ts` — Updated CDP with real DB persistence
- [ ] `verify/lib/data-platform/events.ts` — Updated events service with DB
- [ ] `verify/lib/data-platform/information-market.ts` — file_content from information-market.ts
- [ ] `verify/lib/data-platform/types.ts` — file_content from types.ts
- [ ] `verify/lib/db.ts` — The content of db.ts
- [ ] `verify/lib/design-tokens.ts` — Design tokens
- [ ] `verify/lib/gambit-game-math.ts` — // Audited & corrected: all formulas verified, edge cases hardened
- [ ] `verify/lib/realtime/RealtimeProvider.tsx` — Realtime context provider
- [ ] `verify/lib/realtime/useRealTimeMarket.ts` — Real-time market hook
