# MPP — State of the Union Audit (repo · code · Vercel · Drive)

> **Purpose:** one triangulated picture of what is *in* the MAD Gambit MPP now vs.
> what is *outstanding*, audited against the two single-sources-of-truth:
> - **Plan SoT:** [`MAD_GAMBIT_MASTER_ACTION_PLAN.md`](../MAD_GAMBIT_MASTER_ACTION_PLAN.md) (living A→AC ledger)
> - **Maths SoT:** [`docs/MASTER_MATHS_ALGORITHMS.md`](./MASTER_MATHS_ALGORITHMS.md) (consolidated this pass)
>
> Cross-checked against the live repo/code, the two Vercel productions, and the
> original **MADGit** Google Drive folder. Every "in" claim below is grounded in a
> file that exists; every "outstanding" item cites where it's tracked.
> _Audit date: 2026-07-25._

---

## 1. Sources of truth (now consolidated)

| Domain | Single source of truth | Status |
|---|---|---|
| Execution plan | `MAD_GAMBIT_MASTER_ACTION_PLAN.md` | Living ledger, Parts A→AC |
| Maths & algorithms | `docs/MASTER_MATHS_ALGORITHMS.md` | ✅ consolidated this pass (4 stub docs now redirect here) |
| Canonical numbers | `docs/imported/tokenomics/CANONICAL_NUMBERS.md` | ⚠️ has unresolved conflicts — see §6 |
| Code (implementation truth) | `verify/lib/gambit-game-math.ts` (+ math libs) | Authoritative; docs mirror it |

## 2. What's IN the MPP now (verified against live code)

**Frontend / themes**
- Two official themes, both live, both fed by one shared feature-core: **`/preview`** (premiere) · **`/mpp2.23`** (alt hub, 7 tabs). `/gambit`→`/mpp2.23` redirect; root→`/preview`. Guarantee enforced by `lib/platform-features.ts` + CI parity test.
- Pages: `/preview · /mpp2.23 · /dashboard · /workbench · /profile · /settings · /reports`. Dual-skin (Gilded ↔ Neon Noir) threaded through all dashboard panels.

**Backend**
- **65 API routes** under `app/api` (`v1/*`: auth, cards, bayesian, gdelt, governance, packs, staking, markets, agents, cron, dopamine, joy, audit…).
- **Neon Postgres** via pooled `pg` (`lib/db.ts`, now TLS-enforced + pool-error-safe); **9 ordered migrations** (`sql/0001…0009`), CI creates a Neon branch + migrates per PR; `/api/health` liveness route.
- Data platform (events/CDP/aggregates), markets/bets ledger, card evolution — DB-smoke-proven.

**Smart contracts** (`contracts/src`, Foundry)
- Real + tested: `MADStaking.sol` (tiered, reserve-funded), `MADMarketFactory.sol` (parimutuel Over/Under + fuzz), `MADShieldVault.sol`, `MADCard1155/721`, `FounderRegistry`. `$MADx` verified on-chain (Arbitrum One). `contracts/madhat-core/` holds 15 more real `.sol` (not yet integrated).

**Maths** — every concept in the Maths SoT is implemented (Part X audit): MADConv, GARCH(+EGARCH/CGARCH), DL-LMSR, Kelly, Liar/LieImpact, scandal-velocity/perp, Bayesian/VOI/scoring, Shield engine, splitFee/furnace, staking yield, pack pricing, governance, EigenTrust, evolution/rarity/streaks, joy layer.

**Security** — SIWE signature verification (`lib/siwe-verify.ts`), signed sessions (`lib/session.ts`), rate-limits (`lib/rate-limit.ts`), guest Basic-Auth gate (`middleware.ts`), security headers, non-root container.

**This session added** — routing simplification, guest gates (MPP + Data House), the shared-theme guarantee, full-stack container/Neon hardening (`Dockerfile` Node22 + `.dockerignore` + `/api/health`), and this maths + audit consolidation.

## 3. Vercel state

- **`mad-mpp-2.23`** production READY (green), 0 runtime errors; **`madhats-gambit-presentation`** (Data House) build now green after the middleware fix.
- **Blockers are all human-in-the-loop (dashboard, no API):** Deployment Protection OFF on both projects · attach `mpp.`/`datahouse.` subdomains · set 19 env vars (keys in `verify/.env.example`) · deploy Coming Soon + point `www`/`.fun`/apex. DNS for all 6 hostnames already resolves to Vercel.

## 4. MADGit Drive — comparative audit

The **MADGit** folder (`For Claude` = the Grok/X export) was **already mined into the Plan SoT** (Part A context confirms it). Comparative result:

| Drive artifact | Reflected in repo? |
|---|---|
| `For Claude` (Grok/X conversation export) | ✅ synthesized into the plan (Parts B, B2 hallucination log, R/S/T handoffs) |
| `MADGambit_Website_Scope_v1`, `MADHATs_Gambit_AI_Studio_NFT_Brief` | ✅ scope/NFT reflected in `docs/imported/specs` + card system |
| LLC filing PDF (New Mexico, 2026-03-25) | ✅ canon (Plan Part A, Stage 2) |
| OV pitch deck (`.mhtml`) + `O-V` folder | ✅ deck lives in the presentation repo; **keep/patch, do not delete** (still in talks) |
| `MAD_HAT_Mathematical_Handoff_Document.md` (Drive) | ✅ folded into Maths SoT |
| `base.apk` (2.23G Android build) | ⛔ **do-not-merge** (dated backup, per founder instruction) |
| Qt installer dump / git-objects / config | ⚪ tooling noise — nothing to ingest |

**Conclusion:** no un-ingested signal remains in MADGit; the plan + code already capture it. The one caveat is the canonical-number conflicts (§6), which originate from *different-vintage* Drive docs disagreeing with each other.

## 5. OUTSTANDING (the real remaining backlog)

Grounded against live code; tracked in the Plan SoT parts noted.

| # | Item | Tracked |
|---|---|---|
| 1 | **Design-token scrub** — 82 raw-hex in 5 locked `/mpp2.23` panels (`nft-card` 48, `positions-dashboard` 10, `staking-tiers-panel` 9, `tournament-arena` 8, `casino-panel` 7) → import INK/GOLD tokens | Part O-1, Y-B |
| 2 | **`MADCard1155/721` Foundry tests** (real contracts, 0% coverage) | Part D |
| 3 | **`MADLmsrMarket.sol`** (continuous DL-/LS-LMSR flagship market) + **UMA optimistic-bond oracle finalizer** | Part AB |
| 4 | **O-2 "v2 layer"** still prose stubs → real code: P2P escrow, referrals, session-keys (ERC-4337 AA), information markets, realtime WS | Part O-2 |
| 5 | **Queued UI** — LangGraph multi-agent crew, Bayesian Tree Explorer, Liar Impact Simulator, GDELT panel, Octavian 3D node | Parts S-C, T-B |
| 6 | **Integrate the 15 `madhat-core` contracts** (compile + wire the ones in scope) | Part O-1, K |
| 7 | **Compliance scrub** of `dopamine-engine.tsx` framing in the locked hub | Part B2, Z-B |
| 8 | **Infra (dashboard/founder-gated)** — domain attach, env vars, Protection off, testnet deploy | Part S-D |

## 6. ⚠️ Canonical-number conflicts — founder sign-off required

These come from different-vintage Drive/deck docs disagreeing; the **code is reconciled**, but the *stated* numbers need one locked answer (full list in Maths SoT §13):

1. **$MADx distribution** — 35/20/15/10/10/10 vs 45/15/15/15/10.
2. **$MADx address** — `0xb61ae7…` vs on-chain-verified `0x6972370e…`.
3. **Staking model framing** — code stake-tiers (12→68%) vs lock-duration (8.8→68%) vs rarity (8→68%).
4. **Primary chain** — Base L2 vs Arbitrum Nova+One vs Arbitrum One.
5. **Seed range** — $1–2M vs $1.24–2.48M @ $12M.
6. **Y3 revenue** — $154.5M vs $121.4M vs $86–154M.
7. **Community 28.8% semantics** — "of the fee" (code) vs "of net platform profit" (plan).

## 7. Recommended execution order

1. **Merge the green PRs** (#30 shared-core+hardening, #4 Data House gate).
2. **Founder locks §6** (7 number decisions) → I update the two SoT docs under sign-off.
3. Code backlog in value order: **#1 design-token scrub → #2 MADCard tests → #3 LS-LMSR+oracle → #6 core-contract integration → #4 v2 layer → #5 queued UI**.
4. Founder completes the dashboard/infra items (§3, §5-#8).

_Every code item above is CI-gated (tsc · vitest · placeholder-guard · Foundry · Neon migrate); every claim here is backed by a file or a Plan SoT part._
