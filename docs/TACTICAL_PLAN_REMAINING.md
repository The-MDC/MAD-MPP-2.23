# MAD GAMBIT — THE REMAINING TACTICAL PLAN (v1)
## Master Build v3.1 sprint ladder ⊕ Claude Code Handoff Stories 1–7 ⊕ Optimizations/Env Audit v1
### 02 Aug 2026 · Reconciled against live repo/PR/Vercel state (which supersedes the handoff's "unconfirmed 🔴" flags)

> Precedence: §DELTA founder amendments → this doc → Master Build v3.1 → Omnibus D12–D15.
> Every story = one PR = one agent session, per Part V protocol. Canon Lock + Pixel
> Constitution are pasted into every story prompt.

---

## 0 · STATE CORRECTION (what the 02-Aug handoff couldn't see — verified live)

| Handoff said | Actual (verified this session) |
|---|---|
| Story 1: PR #35 blocked behind main, two conflicts | ✅ **Done.** Merged main in; only `neon-pr-branch.yml` conflicted (kept the newer continue-on-error posture — main's copy predated it); `news-two-row.tsx` auto-merged clean (the 6-cat structure and the `mg:open-node` empty-state handler never collided). All 7 checks green on `c84d615`, `mergeable_state: clean`, **ready for review.** |
| Story 2: deck PR likely behind main | ✅ **Never was** — OV-Deck main hasn't moved since `079fce0`. PR #1 is clean, preview READY, **ready for review.** |
| N2: reconcile the Neon workflow | ✅ Done (in #35). |
| S1.6 scheduled for Sprint 1 | ✅ **Already shipped inside PR #35** (17-correction canon pass + the canon-lock test suite — every locked constant asserted in CI). Remove from Sprint 1. |
| S1.1 re-land guest-gate 4 logins | ✅ Already live on main (4 guest logins in `verify/middleware.ts`; main READY). Remove from Sprint 1. |
| Canon Lock: 6-tier staking, flat 40% creator, Y3 $121.4M/$4.2B, 10-cat rail | Superseded by §DELTA (4-tier eights ladder · Creator Ladder 28.8/40/60 · Y3 **$139.6M** base / $4.83B exit run-rate · 6-cat rail). All shipped in code. |

**Still true and still blocking:** `NEON_API_KEY` returns 401 (founder rotation, N1).

---

## PHASE A — CLOSE SPRINT 0 (this week; mostly founder clicks)

- **A1 (founder) — Merge PR #35** (MAD-MPP-2.23, constellation) and **OV-Deck #1** (deck infusion). Both green, both ready-for-review, previews live.
- **A2 (agent, fires on merge) — Tag `v2.24-constellation`** on the merge commit; append `docs/HANDOFF_<date>.md`. Sprint 0 closes.
- **A3 (founder, 2 min) — QA click-pass** on production after merge with a guest login: open 4–5 nodes, click to streak 5 and 8 (VRS toasts), 390px viewport. (Agent sandbox cannot pass the Basic-auth gate — this stays founder-side.)
- **A4 (founder, 5 min) — N1: rotate `NEON_API_KEY`** — console.neon.tech → Account → API keys → new key → repo Settings → Secrets → Actions. Unblocks migrations-as-code (B3) and per-PR DB branches.
- **A5 (founder, 10 min) — The three Vercel-confirmed gaps** (dashboard, zero code):
  1. **Password Protection scoped to `preview`** (Pro now active) — preview URLs are currently public.
  2. **Attach `madgambit.io` to `mad-mpp-2.23` production** — every deferred day is cookie/session debt. (Note: the datahouse currently answers on madgambit.io — decide the domain split now: e.g. apex → MPP, `data.` or `engine.` → datahouse, or keep datahouse until S1.3 folds it in.)
  3. Confirm/flip the `live: false` project toggle.

---

## PHASE B — SPRINT 1 · CONVERGENCE + FOUNDATION (order of execution)

**B0 — S1.0 NEW · Env & settings hardening (one PR + one dashboard pass)** *(from SCOPE_OPTIMIZATIONS_ENV_AUDIT_v1)*
- Env vars to add/verify: `NEXT_PUBLIC_SITE_URL` (OG/share cards) · `WIRE_LIVE` (Wire kill switch, pre-wired for B6) · `FEATURE_FLAG_GAMBIT_NODES` (dark-launch gate) · `SESSION_SECRET`/`AUTH_SECRET` (verify SIWE session key is env-held — silent logout-on-deploy check) · `LUNAR_PHASE_OVERRIDE` (QA-only) · evaluate `UPSTASH_REDIS_REST_URL/_TOKEN` (cross-invocation rate limits) and `SENTRY_DSN` (conviction-flow error visibility).
- `next.config`: `images.remotePatterns` allowlist for satire/news images (currently raw `<img>` fallbacks in the wire cards — this is why).
- Verify (already partially done): Speed Insights + Web Analytics are wired in `layout.tsx`; add `vrs_trigger_hit` as a named analytics event where VRS fires.
- Next/Turbopack checklist: `next/font` for **Outfit** (Allerta Stencil done in S0.4; Outfit/Inter still external) · Edge runtime + 5-min cache on `/api/v1/news/satirical` (and later `/platform/intel`) · Suspense boundary per GambitNode live element · confirm `<Link>` prefetch on nav/rail · CI caches `.next/cache`.
- *Acceptance: env checklist table in the PR body, each row Present/Added/N-A with proof.*

**B1 — S1.2 · `/story` route.** Carousel rendering the node registry via `variant="panel"` (built ready in S0.6): 10 investor nodes, snap-scroll, ticker strip + shared VRS. Then o-vdeck26 → 301 redirect, archive the Vite repo. *Acceptance verbatim from master build.*

**B2 — S1.3 · Datahouse fold.** Gate logic into MPP middleware, `/portal` launcher, Math Engine Room HTML served at `/engine` (this also gives the node CTAs a same-origin engine target, replacing the external `madgambit.io/maths-engine-room.html` links in `node-registry.ts` — update `ENGINE_URL` to `/engine` in the same PR). `CORS_ALLOWED_ORIGINS` set here if any cross-origin remains.

**B3 — S1.5 amended → N3 · Migrations-as-code.** `db/migrations/NNN_*.sql` — numbered, idempotent (`IF NOT EXISTS`), starting from the already-applied 7-tier constraint + eights-ladder `staking_tiers` (reconcile against actual DB state first — they were partially applied by console paste). Then the full 9-step migration (METH→$MADx sweep, perpetual columns, bets shield, pack_auctions, GC+Epiphany schemas). Wire `neon-pr-branch.yml` to run migrations against the fresh preview branch per PR, and against main's branch on merge. **Retires "founder pastes SQL into the console" permanently.** N4: verify PR-close branch deletion actually fires. *Blocked on A4 (key rotation).*

**B4 — S1.4 amended · Hub consolidation + theme unification.** `/preview` promoted to `/`; `/mpp2.23` + `/gambit` → 301; premiere theme becomes THE theme (toggle retires or is reborn as a lunar-phase skin — two themes do not enter Sprint 2). Sacred-eleven regression pass.
  ↳ **This likely resolves the "second-theme repo" open question (Story 7):** the strongest candidate for "the other live MPP kept as a second theme" is the in-repo legacy hub at `/mpp2.23` (a route, not a repo) — with `MADHATs-Gambit-Presentation` (GitHub Pages deck) as the only other MPP-adjacent live property. **Founder: confirm or name the repo before B4 executes, so nothing gets sunset that was meant to be kept.**

**B5 — S0.4b (carried) + VIII.5 CI additions · Design-debt pass.**
- Deck harvest: grep OV-Deck dist for raw hex / font-family / cubic-bezier, reconcile toward the constitution.
- Raw-hex CI gate (report-only until S11): any `#[0-9a-f]{3,6}` outside `tokens.css`/`gambit-design-tokens` flagged — retcons PR #32's three-panel debt.
- Playwright visual-regression baseline: 8 canonical screenshots @390px + 1440px, diffed per PR.

**B6 — S1.8 NEW · THE WIRE (W1–W6).** The story that ends the DEMO-rows era: the satire engine and heat ranking are live and correct, but `/api/v1/news/satirical` ingestion is demo-fed. W1: `wire-sources.ts` (the Sixty) + `/api/v1/cron/wire-ingest` on `*/15 * * * *` — **now deployable, Pro unlocked per-minute cron cadence**. Budget the route's `maxDuration` explicitly. W4: `WIRE_LIVE` kill switch (pre-wired in B0).
⚠️ **`SCOPE_THE_WIRE_v1.md` is not among the uploaded docs — upload it before B6 executes.** W2–W6 details (dedup, entity extraction, heat wiring, fallback ladder, source scoring) will not be guessed.

**B7 — S1.7 · PWA.** Manifest, service worker, install prompt, offline shell, icons.

**Sprint 1 deploy gate (amended):** one origin serves hub+story+engine+portal · PWA installs · migrations idempotent-rerun clean · **the wire serves live headlines with DEMO as fallback only** · env checklist closed.

---

## PHASE C — SPRINTS 2–12 (master build v3.1 ladder stands, with §DELTA supersessions)

Unchanged in sequence and acceptance, with these corrections applied wherever the old numbers appear:
- **S2.x**: house physics timings are the Part VIII Fibonacci set (233/144/89ms), not "220ms".
- **S3.1**: ShieldPremiumWidget formula/clamp already live in the shield node's slider — evolve, don't duplicate.
- **S3.2**: StakingTiersPanel = **4-tier eights ladder** (+VIP status row), not "6 tiers".
- **S3.4**: FeeExplainer — fee-waterfall node + tappable 1.88% shipped in S0.7; extend to every surface.
- **S5.2**: Reactor Ring 2 = **Creator Ladder 28.8–60%**, not flat 40%.
- **S10.2**: P2P listing-creator share follows the **Creator Ladder**, not flat 40%.
- **S11.2**: gates flipping to enforcing now include the **raw-hex gate** and **visual-regression diff** staged in B5.
- **Part VI math**: Y3 base **$139.6M** × 8× ≈ **$1.1B** (the $1B line now clears at base case with margin); comps refreshed Aug 2026: Kalshi $22B valuation / $21–31B monthly volume, Polymarket ~$1B annualized revenue.

**Parallel track unchanged:** legal (Zenaib/instrument), VC outreach on corrected canon, weekly deck-number drift check (now enforced by the canon-lock test suite on every CI run).

---

## OPEN ITEMS FOR THE FOUNDER (everything that blocks an agent story)

1. Merge PR #35 + OV-Deck #1 (A1) → agent tags v2.24-constellation.
2. Rotate `NEON_API_KEY` (A4) → unblocks B3.
3. The three Vercel dashboard fixes (A5) — protection, domain, live-toggle.
4. Upload `SCOPE_THE_WIRE_v1.md` → unblocks B6.
5. Name or confirm the "second-theme repo" (B4 note) before hub consolidation sunsets `/mpp2.23`.
6. Re-authorize the Supabase and Windsor.ai connectors in claude.ai settings (future-session tooling; Supabase itself is dead code per D03 — low priority).
