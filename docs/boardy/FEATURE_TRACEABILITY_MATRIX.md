# Feature Traceability Matrix — 2026-08-19

Boardy's required output #3. Every feature, equation and claim classified into one of four
states. **Never promote a lower state to a higher one on a slide.**

| State | Meaning |
|---|---|
| **Implemented** | Present in code or the live product |
| **Demonstrated** | Works in a demo; not established as production-ready |
| **Validated** | Reproducible tests, simulations, independent review, or reliable external evidence |
| **Conceptual** | Proposed, illustrative, or roadmap |

Evidence paths are relative to repo root (`maddegen/MAD-MPP-2.23`), branch
`claude/boardy-investor-presentation-jxuj26`.

---

## A. Mathematical engine

| Feature | Evidence | State | Investor-safe wording |
|---|---|---|---|
| Platform fee constants (188 bps, 40% creator, 28.8% community) | `verify/lib/gambit-game-math.ts` `PLATFORM`, `splitFee()` | **Implemented** | "Fee split is enforced in code." |
| DL-LMSR market making `C(q)=b·ln Σe^(q_i/b)`, `P(i)=e^(q_i/b)/Σe^(q_j/b)` | `calculateDLLMSRCost`, `calculateDLLMSRPrice`, `calculateVolumeScalingAlpha` | **Implemented** | "Markets price on a volume-scaled DL-LMSR bonding curve." |
| GARCH(1,1) volatility (ω=0.0001, α=0.05, β=0.90, σ∈[0.09,0.68]) | `garchUpdate()` | **Implemented** | "Volatility is modelled with GARCH(1,1)." |
| MAD Shield premium / recovery dial (28.8% → 40% → 60% VIP) | `calculateShieldPremium`, `shieldRecovery`, `WHALE_SHIELD_ELIGIBILITY` | **Implemented** | "Recovery scales with opt-in premium tier." |
| Conviction growth, temporal + stochastic decay | `convictionGrowth`, `temporalDecay`, `stochasticDecay` | **Implemented** | — |
| Lunar-phase multiplier, VRS triggers, loss-aversion weights | `getLunarPhaseMultiplier`, `VRS_TRIGGERS`, `LOSS_AVERSION` | **Implemented** | Game mechanic — do not present as financial modelling. |
| Dutch-auction pricing (8-tier scandal pack curve) | `getAuctionPrice`, `SCANDAL_PACK_TIERS` | **Implemented** | — |
| MADConv full Cobb-Douglas `M = t^1.35·c^0.75·d^1.45·ψ^1.15·(1+π^0.9)·m_meme·satire·liar·garch_amp` | Engine Room doc only; **no matching implementation found** in `verify/lib/` | **Conceptual** | "Specified in the Engine Room; server-side coefficients are proprietary." Do **not** call it live. |
| Z-Liar meter (deception, contradiction, sentiment shift, vocal anomaly) | `verify/components/zliar-meter.tsx`, `verify/app/api/v1/madhatr/zliar/route.ts` | **Demonstrated** | "Demo surface; scoring is simulated." |
| GDELT scandal velocity / perpetual trigger probability | `verify/components/scandal-velocity-meter.tsx` | **Demonstrated** | UI only — no verified GDELT feed. |
| Bayesian layer (log-odds, VoI, edge, shouldAct, Brier, log score) | `verify/components/futarchy-board.tsx`, BayesianDecisionTree (Logic tab) | **Demonstrated** | — |
| Half-Kelly sizing with position cap + δ-limit | Not located in code this pass | **Conceptual** | — |
| Projected stock move · ad-revenue-loss · virality ODE · effective-time integral | None | **Conceptual** | Boardy: non-live, specification only. |

> **CORRECTION (2026-08-20) — my earlier "the math engine was destroyed" claim was wrong at
> the project level.** Commit `cdadb02` did replace `verify/lib/gambit-game-math.ts`
> (57,003 bytes) with a 66-byte comment — but only on the stale lineage this working copy
> sits on. **`origin/main` carries a healthy 1,405-line / 117-export version**, a superset of
> what I restored. The engine was never lost from the project.
>
> This branch is **246 commits behind `main`**. My restore from `d838443` would have
> *regressed* the file by 78 lines and 8 exports on merge. The branch now takes `main`'s
> version verbatim; all 29 import sites resolve against it.
>
> The lesson stands, but it is the opposite of the one I first drew: the danger was not a
> destroyed engine, it was **reporting a stale branch as if it were the project**.

## B. Product surfaces

| Feature | Evidence | State |
|---|---|---|
| 7-tab hub (Floor · Saga · Arena · Packs · Portal · Casino · Logic) | `verify/app/gambit/page.tsx` | **Implemented** |
| Market Factory — create market, DL-LMSR live pricing, 40% creator | `verify/components/market-factory.tsx` | **Demonstrated** (frontend only — no deployed contract) |
| SIWE wallet auth (chain 42170) | `verify/app/api/v1/auth/{nonce,verify}`, `verify/lib/siwe-verify.ts` | **Implemented** |
| MADShieldVault contract + Foundry tests | `contracts/src/MADShieldVault.sol`, `contracts/test/MADShieldVault.t.sol` | **Implemented**, tests present → **Validated** once a green `forge test` run is attached |
| MADCard721 / MADCard1155 / FounderRegistry / MADStaking / P2PEscrow / SessionKeyManager | `contracts/` | **Implemented** (not deployed) |
| NFT card art pipeline | `verify/lib/card-art.ts`, `verify/public/cards/` | **Demonstrated** — **25 of 152** real cards committed |
| AI Concierge → FastAPI chat | `verify/app/api/concierge/chat/route.ts` | **Demonstrated** |
| Scraper / trader agents (LangGraph) | `verify/app/api/v1/agents/{scraper,trader}` | **Demonstrated** — simulated/local |
| 20 API routes total | `verify/app/api/**` | **Demonstrated** — "mostly functional-now (simulated/local), demo-safe" per `SESSION_HANDOFF.md` §3 |
| On-chain MarketFactory / DutchAuction | `The-MDC/demo-repository`, branch `claude/complete-auction-contracts-23vLW` — ⚠️ reported "staged but not committed"; **existence unverified from this session** | **Conceptual** until confirmed on remote |

## C. Settlement — Triple-Threat Oracle Cascade

| Stage | Evidence | State |
|---|---|---|
| Social scan (X / Warpcast scraper agents) | Slide + `agents/scraper` demo route | **Conceptual** |
| MADDAO delegate vote, staked collateral | Slide only | **Conceptual** |
| Creator localized veto under slashing-backed shields | Slide only | **Conceptual** |

**Do not call this secure, "100% DeFi secured", regulatory-safe, or production-ready.**
Open before any such claim: data rights, scraper reliability, oracle accuracy, delegate
incentives, collateral rules, slashing, veto scope, dispute handling, latency, attack surface.

## D. Market taxonomy

| Type | Code evidence | State |
|---|---|---|
| Progression | `nft-card.tsx` §Progression, streak ≥7 "Savage Mode" | **Implemented** |
| Saga (chained episodes) | `verify/components/nft-saga.tsx` — `SAGA` is a **placeholder const**; prod pulls live chained markets | **Demonstrated** |
| Z-Liar | component + API route | **Demonstrated** |
| Perpetual (incl. Perpetual Epiphanies under the perp enum) | `live-ticker.tsx`, concierge copy | **Conceptual** |
| Gossip-Cop | Named in data room; no enum found | **Conceptual** |
| Wire Meter · Gossip Cup · Zeitgeist · Five Faces | Call only; **no code** | **Conceptual** — reconcile to taxonomy before use |

## E. Claims requiring evidence before investor use

| Claim | Where it currently appears | Required before use |
|---|---|---|
| "15,000 pre-registered users" | pitch-control screenshots | State as **waitlist**. Never users/revenue/retention/PMF. |
| "70%+ D30 retention" | `whitepaper-sheet.tsx` §02 | It is a **target**. Relabelled in this branch. |
| "100% USD solvency across 1,000 Monte-Carlo bear scenarios" | `whitepaper-sheet.tsx` §04 | Sample size, assumptions, win-rate range, outputs, methodology. Qualified in this branch. |
| "MADConv retention 4.8x industry" | `DATA_HOUSE_FULL.md` | Source, or delete. |
| "Industry's first" (MAD Shield) | MAD Shield slide | Prior-art research. |
| "Regulatory-safe" / "no counterparty risk" | MAD Shield slide | Narrower product description; custody + architecture review. |
| Y3 $139.6M on 51/31/12/6 stream split | Data House | Split was derived from the **old $154.5M** model. Re-run before pairing. |

## F. Open diligence questions for Nick

1. Does `The-MDC/demo-repository` actually contain the pushed MarketFactory / DutchAuction?
2. Which staking tier table is authoritative — code (6 tiers) or data room (4 tiers)?
3. What are the Monte Carlo run parameters behind the solvency claim?
4. Is the Y3 headline $139.6M (Boardy) or $154.5M (repo)? What volume assumption backs it?
5. Where do Wire Meter / Gossip Cup / Zeitgeist / Five Faces map in the code taxonomy?
6. Is any part of MAD Shield insurance or a security under US/UK/DE/AE analysis?
7. Who bears loss when the Shield pool is stressed, and how is the float custodied?
