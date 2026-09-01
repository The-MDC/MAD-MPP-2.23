# Feature Traceability Matrix

**State ladder used throughout this package** — later states presuppose earlier ones:

| State | Meaning |
|---|---|
| **Conceptual** | Proposed, illustrative, specified in docs, or roadmap — no working code |
| **Implemented** | Present in code (frontend, backend, or contract) |
| **Validated** | Implemented AND has reproducible test coverage, a simulation, or checkable logic behind it |
| **Demonstrated** | Implemented AND shown working end-to-end in the live app or a real demo path — not just internally |

A feature can be Implemented-and-Validated without being Demonstrated (real, tested code with
no live UI path yet), or Implemented-and-Demonstrated without being Validated (visible in the
app, zero test coverage). Both combinations appear below — don't collapse them into one label.

---

## A. Mathematical engine (`verify/lib/gambit-game-math.ts`) — full detail in `03-MATH-ENGINE-APPENDIX.md`

| Feature | State | Notes |
|---|---|---|
| Platform fee constants, `splitFee()` waterfall | **Implemented, partially Validated** | Creator-cut scaling is tested across all three ladder rungs; the community-cut-on-gross-fee behavior (the open bug) is not itself asserted by a test. |
| Creator Ladder (28.8% → 40% → 60%) | **Implemented, Validated** | Founder-sign-off dated in-code; tested including the exact follower-count boundary case. |
| Staking tiers (4-tier, TS engine) | **Implemented, Validated** | Fully tested. ✅ FIXED 2026-09-01: the Solidity contract (`MADStaking.sol`) previously still encoded the old 6-tier table and had drifted from this — it is now reconciled to the same 4-tier canon (see Section C and the security register). |
| DL-LMSR pricing (cost, price, and marginal-cost functions) | **Implemented, Validated** | ✅ FIXED 2026-09-01: 14 new tests (previously zero); the cost/price inconsistency was resolved by adding a dedicated `calculateDLLMSRMarginalCost` function rather than changing price's display semantics, and an overflow guard was added matching `calculateSoftmax` elsewhere in the file (see math appendix §5). |
| GARCH(1,1) volatility | **Implemented, Validated** | The best-tested formula in the file; defensively coded. |
| MAD Shield premium — GARCH-priced version (`shieldPremium`) | **Implemented, Validated, NOT Demonstrated** | Well-tested, well-documented — but not called anywhere in the file; not the live formula. |
| MAD Shield premium — the live version (`calculateShieldPremium`) | **Implemented, Demonstrated, NOT Validated** | This is what the opt-in flow actually calls. Flat 2–4% dial, no volatility input, zero tests — untouched by this session's fixes. |
| Shield payout resolver (`calculateShieldPayoutFull`) | **Implemented, Validated** | ✅ FIXED 2026-09-01: 12 new tests (previously zero) across the resolver, its whale-eligibility gate, and the tiered-dial variant — all three tiers and every eligibility gate now covered (see math appendix §7). |
| Z-Liar meter composite score | **Implemented, Validated** | Real formula, tested. |
| Overall math-engine test coverage | — | **≈28.7%** (27 of 94 runtime-testable exports), up from 21.5% (20/93) this session. Cards/packs/factions, evolution, PvP tournaments, virality/EigenTrust, and Dutch auctions still have zero coverage — none of it fund-custody or pricing-critical. |

## B. Headline-to-market pipeline — full detail from the pipeline audit

| Step (per the demo sequence) | State | Notes |
|---|---|---|
| Live headline ingestion (RSS fetch) | **Implemented, Demonstrated** | 26 real publisher feeds, genuine network calls, honest failure handling. |
| "Pull fresh" manual ingestion trigger (`markets-for-today-panel.tsx`) | **Implemented, Demonstrated** | ✅ FIXED 2026-09-01: previously called the CRON_SECRET-gated `/api/v1/ingest/gdelt` route directly from the browser, so the button silently failed for every real (non-dev) user — no bearer secret is available client-side by design. Now calls a new public, rate-limited route (`/api/v1/markets/proposals/refresh`, 5 requests/10min) that runs the same ingest logic. A `vercel.json` cron entry was also added so ingestion runs on a schedule (`*/30 * * * *`) independent of anyone clicking the button. |
| Market-type classification | **Implemented, Demonstrated, Validated** | A real deterministic rules engine (not ML/LLM) composing tested math-engine functions with keyword cascades. |
| Headline rewriting/roast (satire engine) | **Implemented, Demonstrated** | Real Gemini LLM call with a self-reporting deterministic fallback when no API key or on parse failure. |
| Automatic market creation from a classified headline (zero human clicks) | **Conceptual** | Still does not exist — no code path creates a market without a human clicking Create. This row is specifically about *full* automation; see the next row for the human-in-the-loop path, which changed this session. |
| Market Factory "Create" button (human-in-the-loop, from a classified/typed headline) | **Implemented, Demonstrated (interim)** | ✅ FIXED 2026-09-01: previously the branded Create button had no click handler at all — clicking it did nothing, silently. It now POSTs to the same real market-creation API the manual form below uses (title, category, and yes/no odds derived from the on-screen probability inputs), so it creates a real, DB-backed market. This is an interim fix, not the originally-envisioned automatic pipeline: a human still has to click Create, and it does not yet run automatically off a freshly classified headline. |
| Manual market creation (typed title → DB row) | **Implemented, Demonstrated** | Real, works today, but disconnected from the headline/classifier pipeline; odds default to static 2.0/2.0. |
| On-chain `MADMarketFactory` market creation | **Implemented, Validated, NOT Demonstrated** | Real, tested Solidity — not deployed, not called from any frontend code. |
| Resolution-condition text generation | **Implemented, Demonstrated** | Real per-market-type generated description. Describes a condition; nothing evaluates whether it's been met. |
| Off-chain market resolution (DB) | **Conceptual** | A `resolved`/`disputed` status is declared in the type system; zero code transitions a market into it. |
| On-chain settlement (`MADMarketFactory.resolve()`) | **Implemented, Validated, NOT Demonstrated** | Real, tested, owner-attested — not oracle-driven, not deployed, not called from the frontend. |
| Optimistic-oracle dispute resolution | **Implemented, Validated, NOT Demonstrated** | Real, tested, self-contained UMA-*inspired* mechanism — not an actual UMA integration, not wired to the market factory. |
| DL-LMSR price movement after a buy/sell (demo) | **Implemented, Demonstrated, NOT Validated (as a live feature)** | Real pricing formulas, but the swap demo runs entirely in local React state — no backend or chain call. |
| Live volatility gauge | **Demonstrated, explicitly self-labeled a placeholder** | Runs real `garchUpdate()` math over a seeded pseudo-random walk; the component's own comment says so. |
| Price-history / sparkline on market cards | **Demonstrated, explicitly documented as derived** | The code's own comment: "the platform has no price series... `series` is DERIVED... plus a seeded drift." |
| Autonomous trading agent | **Implemented, Demonstrated, explicitly mocked at the execution step** | Real LLM reasoning and DB writes wrap a hardcoded fixture trade and a fake signed transaction, per the code's own comment. |

## C. Smart contracts (`contracts/src/` — the canonical, CI-tested project)

| Contract | Tests | Deployed? | State |
|---|---:|---|---|
| MADCard721 | 9 | No | **Implemented, Validated** |
| MADCard1155 | 15 | No | **Implemented, Validated** |
| MADMarketFactory | 18 | No | **Implemented, Validated** — see settlement caveats in B and the security register |
| MADShieldVault | 10 | No | **Implemented, Validated** — ✅ FIXED 2026-09-01: now inherits OpenZeppelin `ReentrancyGuard`, with `nonReentrant` on every fund-moving function (`stake`, `claim`, `resolveLoss`, `withdraw`); see security register |
| MADStaking | 9 | No | **Implemented, Validated** — ✅ FIXED 2026-09-01: the 6-tier table has been reconciled to the TS engine's 4-tier canon (Bronze/Silver/Gold/MAD Tier at 8.8/18.8/28.8/38.8%); tier-boundary and reward-accrual tests rewritten to match |
| MADOptimisticOracle | 11 | No | **Implemented, Validated** — self-contained, not wired to MADMarketFactory |
| MADDisputeVoting | 10 | No | **Implemented, Validated** |
| MADPortrait + KeyRegistry | 18+ | No | **Implemented, Validated** |
| FounderRegistry | 0 | No | **Implemented, NOT Validated** |
| `contracts/madhat-core/` (all 12 contracts) | Mixed, several broken | No | **Do not cite.** Excluded from CI, does not currently compile (undefined errors, signature-mismatched tests, a broken deploy script). Treat as abandoned scaffolding, not a second product line. |
| `EvolutionVRFConsumer.sol` (real Chainlink VRF) | 0 | No | **Implemented, deliberately excluded from the build** — a positive signal (correct implementation), not yet integrated. |
| $MADx token | — | **Deployed** — `0x6972...151f`, Arbitrum One, verified | Mint-on-purchase per the founder, not the "fixed 888,888,888, minted once" copy used elsewhere — reconcile the model and the cap (contract's own code comment records 224,573,096) before pitching either. A second address some docs cite as $MADx is confirmed unrelated (`12-DILIGENCE-QUESTIONS.md` R1). |

**Zero of the MAD-authored contracts in `contracts/src/` (Market Factory, Shield Vault,
Staking, Oracle, Cards, Portrait) have any `broadcast/` record anywhere in the repository — no
evidence any of them has ever been deployed to a real network from this codebase.** ($MADx
itself is a separately-launched token, already deployed — see the row above; this statement is
only about the ten contracts this repo authors and tests.)

## D. Product surfaces

| Feature | State |
|---|---|
| 7-tab hub (Floor · Saga · Arena · Packs · Portal · Casino · Logic) | **Implemented, Demonstrated** |
| SIWE wallet auth | **Implemented, Demonstrated** (app-layer TypeScript, chain-bound to Arbitrum Nova 42170) — no Solidity SIWE contract exists, none is needed for this pattern |
| NFT card art pipeline | **Implemented, Demonstrated** — partial: real art committed for a subset of the full card count |
| AI Concierge chat | **Implemented, Demonstrated** |
| Casino "provably fair" games | **Implemented, Demonstrated, NOT Validated as provably-fair** — runs on browser `Math.random`/`crypto` today, not VRF, per the component's own comment |

## E. Claims requiring evidence before investor use

| Claim | Required treatment |
|---|---|
| "15,000 pre-registered" | State as **waitlist**. Never users/revenue/retention/PMF. |
| "70%+ D30 retention" | State as a **target**, never a measurement. |
| "100% USD solvency, 1,000 Monte-Carlo scenarios" | Qualify with sample size/assumptions/methodology, or say "modeled, not audited." No matching simulation code was located in this repository. |
| "888,888,888 $MADx fixed supply" | $MADx is deployed (`0x6972...151f`, Arbitrum One) as **mint-on-purchase**, not fixed/minted-once — say "supply cap" or "design cap," never "fixed supply, minted once." The cap figure itself is unreconciled between docs (888,888,888) and `verify/lib/contracts.ts` (224,573,096) — flag both instead of quoting either as final. See item C above and `12-DILIGENCE-QUESTIONS.md` R1. |
| "MAD Shield is GARCH-priced" | Correct to: the GARCH-priced formula exists and is tested; the live opt-in flow uses a simpler flat-percentage formula instead. |
| "Oracle-resolved markets" / "no counterparty risk" | Do not use. No live oracle feed exists; resolution today is owner-attested, which is itself a counterparty. |
| "Industry's first," "regulatory-safe," "SEC-compliant" | Banned outright — no prior-art research or legal review backs any of these. |
| Y3 $139.6M on a 51/31/12/6 stream split | The split is explicitly flagged everywhere it appears as derived from a retired $154.5M model and not yet re-run. Don't present the split; the $139.6M headline itself is the current canonical figure. |

## F. Open questions this matrix cannot close on its own

See `12-DILIGENCE-QUESTIONS.md` for the full list. Two of the three items previously flagged
here were fixed 2026-09-01: the Solidity staking table now matches the TS engine (Section A/C
above), and `MADShieldVault` now has a reentrancy guard (Section C above). Most load-bearing
remaining: whether the optimistic oracle gets wired into the market factory before "settlement"
is described as anything but a roadmap item — this is scoped as Milestone 1 in
`08-TECHNICAL-PARTNER-MILESTONE-BRIEF.md` rather than fixed here, since correctly resolving a
fund-settling contract's trust assumptions is an architectural decision, not a same-session
patch. The `splitFee()` community-cut-on-gross-fee behavior (Section A) is the other item
awaiting a founder product decision rather than a code fix.
