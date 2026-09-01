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
| Staking tiers (4-tier, TS engine) | **Implemented, Validated** | Fully tested. The *deployed-intent* Solidity contract (`MADStaking.sol`) still encodes the old 6-tier table and has drifted from this — see security register. |
| DL-LMSR pricing (cost + price functions) | **Implemented, not Validated** | Zero unit-test coverage of the actual pricing math; a real internal inconsistency exists between the cost and price functions (see math appendix §5). |
| GARCH(1,1) volatility | **Implemented, Validated** | The best-tested formula in the file; defensively coded. |
| MAD Shield premium — GARCH-priced version (`shieldPremium`) | **Implemented, Validated, NOT Demonstrated** | Well-tested, well-documented — but not called anywhere in the file; not the live formula. |
| MAD Shield premium — the live version (`calculateShieldPremium`) | **Implemented, Demonstrated, NOT Validated** | This is what the opt-in flow actually calls. Flat 2–4% dial, no volatility input, zero tests. |
| Shield payout resolver (`calculateShieldPayoutFull`) | **Implemented, NOT Validated** | The function the code's own comments call canonical. Zero test coverage, along with its whale-eligibility gate. |
| Z-Liar meter composite score | **Implemented, Validated** | Real formula, tested. |
| Overall math-engine test coverage | — | **21.5%** (20 of 93 runtime-testable exports). Cards/packs/factions, evolution, PvP tournaments, virality/EigenTrust, Dutch auctions, prediction scenarios, and the shield payout resolvers have zero coverage. |

## B. Headline-to-market pipeline — full detail from the pipeline audit

| Step (per the demo sequence) | State | Notes |
|---|---|---|
| Live headline ingestion (RSS fetch) | **Implemented, Demonstrated** | 26 real publisher feeds, genuine network calls, honest failure handling. |
| Market-type classification | **Implemented, Demonstrated, Validated** | A real deterministic rules engine (not ML/LLM) composing tested math-engine functions with keyword cascades. |
| Headline rewriting/roast (satire engine) | **Implemented, Demonstrated** | Real Gemini LLM call with a self-reporting deterministic fallback when no API key or on parse failure. |
| Automatic market creation from a classified headline | **Conceptual** | Does not exist. The branded "Market Factory" Create button has no click handler at all. |
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
| MADShieldVault | 10 | No | **Implemented, Validated** — missing `ReentrancyGuard`, see security register |
| MADStaking | 9 | No | **Implemented, Validated** — 6-tier table has drifted from the TS engine's 4-tier canon |
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
| "888,888,888 $MADx fixed supply" | State as the **design spec**, not a live/deployed figure — see item C above. |
| "MAD Shield is GARCH-priced" | Correct to: the GARCH-priced formula exists and is tested; the live opt-in flow uses a simpler flat-percentage formula instead. |
| "Oracle-resolved markets" / "no counterparty risk" | Do not use. No live oracle feed exists; resolution today is owner-attested, which is itself a counterparty. |
| "Industry's first," "regulatory-safe," "SEC-compliant" | Banned outright — no prior-art research or legal review backs any of these. |
| Y3 $139.6M on a 51/31/12/6 stream split | The split is explicitly flagged everywhere it appears as derived from a retired $154.5M model and not yet re-run. Don't present the split; the $139.6M headline itself is the current canonical figure. |

## F. Open questions this matrix cannot close on its own

See `12-DILIGENCE-QUESTIONS.md` for the full list — most load-bearing here: whether the
Solidity staking table gets updated to match the TS engine, whether `MADShieldVault` gets a
reentrancy guard before any real funds touch it, and whether the optimistic oracle gets wired
into the market factory before "settlement" is described as anything but a roadmap item.
