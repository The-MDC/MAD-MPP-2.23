# MAD Gambit — Market Mechanism, Oracle & $MADx Research

**Date:** 2026-07-24 · **Status:** research + recommendations (decision-support, not yet built)
**Scope:** (1) verified $MADx on-chain ground truth, (2) market-mechanism deep dive — what it takes to go beyond parimutuel to LMSR / AMM / newer, (3) the "triple-threat" oracle and whether a **quadruple** is worth it.

> Honesty notes. On-chain facts below were read directly from Arbitrum One via Blockscout (`read_contract` / verified source), not assumed. Mechanism/oracle analysis blends cited public sources (linked inline) with domain synthesis; the assistant knowledge cutoff is Jan 2026, so treat "latest" claims as of then unless a source is dated. Nothing here is deployed.

---

## PART 1 — $MADx: verified on-chain ground truth

Read directly from the contract (Arbitrum One, chain id `42161`):

| Property | Value (verified) | How |
|---|---|---|
| Address | `0x6972370e1caAA3624F37D7e87C28e1089D00151f` | given |
| `name()` | **MADDEX** | `read_contract` |
| `symbol()` | **MADx** | `read_contract` |
| `decimals()` | **18** | `read_contract` |
| `totalSupply()` | **0** (nothing minted) | `read_contract` |
| Standard | ERC-20 + Ownable + **Pausable** (OZ Wizard scaffold; contract name `MyToken`) | verified source |
| Constructor `_maxTotalSupply` | **224,573,096 × 10¹⁸** (hard cap) | decoded constructor args |
| `_initialOwner` | `0x49755F66C877040f8EF7F307263F74C352830149` | decoded constructor args |
| Compiler / verified | `0.8.26`, viaIR, verified 2026-06-19 | verified source |

The second address supplied, `0x49ccA67BAd20470Bd892f3841cEF05c13d54A3C5`, is **not the token** — it is an **EIP-7702 delegated smart account** (`EIP7702StatelessDeleGator`), i.e. a wallet. (Not probed further, at the owner's request.)

### Interpretation — a *fair-launch, mint-on-purchase* token (owner-controlled)
`totalSupply() = 0` with zero transfers is **not** a broken/placeholder token — it is the current signature of a **fair launch**: nothing exists until it is **legitimately purchased** (the Crystex campaign is the sale surface; that page is auth-gated and was not readable here). Per the owner, the contract is **owner-modifiable and can mint more**, up to (and, by modification, beyond) the current **224,573,096** cap. So supply is governed by owner policy, not frozen.

### The reconciliation the founder must make
- **Canon (CLAUDE.md / master plan):** `$MADx = 888,888,888` **fixed supply**.
- **Deployed reality:** `224,573,096` cap, **mint-on-purchase**, **pausable**, **owner-modifiable** (cap and supply can be changed / more minted).

Because the contract is mutable, **either target is reachable**: keep/announce `224,573,096`, or mint/modify toward `888,888,888`. Two honest points to weigh:
1. **Pick one number and make every doc match it** (this file, CLAUDE.md, the deck, `gambit-game-math` if it ever hard-codes supply). Today they disagree.
2. **Credibility caveat (say it plainly to investors):** "fair launch / every token was bought" is only *hard*-true if minting is **restricted to the sale contract or renounced**. An owner-mintable, modifiable token relies on owner discipline, which sophisticated buyers will notice. For the strongest fair-launch claim, restrict `mint` to the sale/purchase contract (or a timelock/multisig) and publish that. This is a governance decision, flagged not chosen.

---

## PART 2 — Market mechanism: parimutuel → LMSR / AMM / newer

### 2.1 What we have today (shipped, CI-green)
`MADMarketFactory.sol` — **parimutuel Over/Under** pools. At resolution the winning side splits the whole pot (minus the canonical `1.88%` fee, `40%` to the creator) pro-rata.

**Why parimutuel is a legitimately good v1:** always solvent (winners can only split what was staked), **no maker capital**, no loss-versus-rebalancing (LVR), no fixed-point `exp`/`ln` risk, trivially auditable. It is *ideal* for long-tail, satirical, UGC markets ("anyone creates a market" + 40% creator) where you cannot subsidize a maker per market.

**Its real limits:** no continuous price discovery (you don't know your odds until settlement), no early exit / secondary liquidity, no live "market price = probability" signal to power the dashboards or the Liar/Conviction meters.

### 2.2 The option space (cited)

| Mechanism | Continuous price? | Maker capital / risk | On-chain complexity | Best for |
|---|---|---|---|---|
| **Parimutuel** (have) | ❌ (settle-time only) | None (always solvent) | Trivial | UGC / long-tail / satire |
| **CPMM / FPMM** (Gnosis) | ✅ | LP capital; **high LVR at extremes** | Low (x·y=k) | Composable, simple |
| **LMSR** (Hanson) | ✅ | Bounded subsidy `b·ln(n)`; always-on | Med (`exp`/`ln`) | Bootstrapping thin markets |
| **LS-LMSR** (Othman–Sandholm 2013) | ✅ | **Fee-funded**, no fixed subsidy; liquidity-sensitive | Med-High | Production PM makers |
| **pm-AMM** (Paradigm 2024) | ✅ | **LVR-optimized**, concentrates liq near 50% | High (Gaussian score) | State-of-the-art AMM |
| **CLOB** (Polymarket CTF) | ✅ (best) | Needs pro market-makers + off-chain infra | High (off-chain book + on-chain settle) | Scale / deep liquidity |

Key theory: LMSR moves price a **constant** amount per fixed bet regardless of depth, so it is liquidity-*insensitive*; **LS-LMSR** fixes that by letting the liquidity parameter `b` grow with open interest, funded by fees ([Othman–Sandholm, EC'10](https://www.cs.cmu.edu/~sandholm/liquidity-sensitive%20market%20maker.EC10.pdf); [XO Market write-up](https://xomarket.substack.com/p/liquidity-pricing-and-the-ls-lmsr-9b5)). There is a proven **impossibility**: you cannot have path-independence + no-arbitrage + liquidity-sensitivity at once — every design picks two. **pm-AMM** ([Paradigm, 2024](https://www.paradigm.xyz/2024/11/pm-amm)) instead minimizes **loss-versus-rebalancing** for outcome tokens, concentrating liquidity near 50% and (in its *dynamic* form) shrinking liquidity toward expiry where CPMM/LMSR bleed the most. Zeitgeist's **Rikiddo** is a fielded LS-LMSR variant ([Zeitgeist](https://medium.com/zeitgeistseer/introducing-zeitgeists-rikiddo-scoring-rule-89c8222e31c)).

### 2.3 Recommendation — a two-lane hybrid (don't replace parimutuel, *add* a maker)
1. **Keep parimutuel** (`MADMarketFactory`) for UGC / satirical / long-tail markets. It is the correct tool there and it's done.
2. **Add `MADLmsrMarket.sol` (LS-LMSR)** for flagship, high-liquidity markets that need live odds + early exit. LS-LMSR is the pragmatic sweet spot: liquidity-sensitive, **fee-funded (no perpetual subsidy)**, well-understood, and the productionizable form of the master plan's "Continuous DL-LMSR" type.
3. **Spike pm-AMM** as the "newer/better" R&D track — it is the current frontier, but the Gaussian-score math is heavier and less battle-tested on-chain. Worth a prototype, not the first production maker.

### 2.4 What it actually takes to build LS-LMSR (the honest checklist)
- **Fixed-point `exp`/`ln`** — the crux. Use a vetted lib (PRB-Math `UD60x18`, or solmate `FixedPointMathLib`). LMSR cost is `C(q) = b · ln(Σ e^{qᵢ/b})`, price `pᵢ = e^{qᵢ/b} / Σ e^{qⱼ/b}`; LS makes `b(q) = α · Σqᵢ`. Precision + overflow bounds on `e^{q/b}` are the main hazard.
- **Outcome-share accounting** per market/outcome; buy/sell cost = `C(q')−C(q)`; fee skim funds `b` growth.
- **Solvency & invariants:** `Σ pᵢ ≈ 1`, cost monotonic, bounded worst-case loss; redeem winning shares at 1 `$MADx` on resolve.
- **Same resolution surface** as `MADMarketFactory` (`onlyOwner/oracle resolve`), so both lanes share the oracle.
- **Foundry:** unit + **fuzz** (price sums to 1, monotonic cost, no free money) + **invariant** (maker never insolvent). foundry.yml already runs fuzz 1000 / invariant 256.
- **Effort:** the contract is ~a day; getting the fixed-point math *provably* safe is the real work. This is the concrete answer to "what do you need to make this LMSR/AMM."

---

## PART 3 — Oracle: the "triple-threat," and whether to go **quadruple**

### 3.1 Anatomy of the current design
The plan/skill describe a **triple-threat**: (1) **Chainlink/Pyth** for objective data, (2) **News-API + AI** signal, (3) **Community**. The `mad-gambit-ai-agents` skill already specs an **AI multi-agent consensus** for subjective markets (3 Claude agents → 2/3 consensus → 24h challenge → 5-agent panel + human arbiter). That is a strong *signal-generation* stack — but all three are **sources**; none is an **economic truth-finalizer** with skin-in-the-game and a formal appeal path. That is the gap.

### 3.2 What the field actually uses (cited)
- **UMA Optimistic Oracle v3** (Polymarket's resolver): request → a proposer posts an answer + **bond** → **~2h challenge window** → if disputed, escalate to UMA's **DVM token-holder vote**; **~99% of assertions go undisputed** ([UMA docs](https://docs.uma.xyz/developers/optimistic-oracle-v3); [crypto.news](https://crypto.news/how-prediction-markets-resolve-uma-optimistic-oracle/)). Fast + cheap in the common case, economically-secured in the tail. Caveat: token-vote finalization can be contentious at scale (the [~$60M Strategy-BTC dispute](https://thedefiant.io/news/markets/usd85m-polymarket-dispute-over-strategy-s-may-bitcoin-sale-puts-uma-s-token-voting-oracle-on)).
- **Reality.eth + Kleros:** a **bond-escalation** answer/challenge game (correct answers finalize cheaply because no one rationally disputes truth), with **Kleros** schelling-court arbitration on appeal ([Kleros docs](https://docs.kleros.io/integrations/types-of-integrations/1.-dispute-resolution-integration-plan/channel-partners/how-to-use-reality.eth-+-kleros-as-an-oracle)). Both UMA and Kleros are schelling-point oracles ([comparison](https://blog.kleros.io/kleros-and-uma-a-comparison-of-schelling-point-based-blockchain-oracles/)).
- **Futarchy / quadratic voting:** futarchy uses *markets* to decide; quadratic voting curbs whale dominance by making the *k-th* vote cost `k²`. Useful as **weighting**, weaker as a standalone truth oracle ([futarchy overview](https://briandcolwell.com/what-is-a-futarchy/)).

### 3.3 Recommendation — yes, go **quadruple**, but pick the *right* 4th leg
The current three are all **signal generators**; the missing element is an **economically-bonded dispute/finalization layer**. So:

**Quadruple-Threat Oracle (MAD Gambit):**
1. **Objective feed** — Chainlink / Pyth (prices, sports, verifiable data).
2. **AI multi-agent consensus** — the 3→5 Claude panel already specced (subjective/satirical events).
3. **Community signal — hardened with QUADRATIC weighting.** This is where the founder's "quadratic governance" instinct fits best: weight each voter by **√(staked $MADx)**, not linear stake, so whales can't buy the truth. (Quadratic *weighting* of a signal, not quadratic voting as the sole resolver.)
4. **Optimistic-bond finalizer (the true 4th leg)** — an **UMA-style / Reality.eth+Kleros-style** mechanism: a proposer posts the resolution with a **$MADx bond**, a challenge window opens, disputes escalate to a schelling vote (our own $MADx jurors, or integrate UMA/Kleros directly). This is the piece with **skin-in-the-game + a formal appeal path** that the triple lacks.

**Why this is genuinely better, not just "+1":** each leg covers another's failure mode — objective feeds can't judge satire; AI can hallucinate; community can be brigaded (quadratic weighting blunts it); and the optimistic-bond layer economically punishes a wrong finalization and gives a canonical appeal. Legs 1–3 *propose*; leg 4 *finalizes with money at risk*. That's the standard the top prediction markets converge on — MAD Gambit's twist is folding the AI panel and quadratic-community signal in *ahead* of the bonded finalizer.

**$MADx utility this unlocks:** oracle **bonds** posted in $MADx, **juror staking/slashing** in $MADx, quadratic community weight = √(staked $MADx) — on top of the existing staking tiers, AI-agent tier gating, market backing currency, and fee/creator/community routing. That is a real, multi-surface utility story for a fair-launch token (all of it dormant/testnet until the launch mints supply).

---

## PART 4 — Concrete next steps (honest, sequenced)
1. **Wire the real $MADx** into a chain-addressed config + deploy script so staking + markets target `0x6972…151f` on Arbitrum One the moment we deploy (shipped alongside this doc; see `verify/lib/contracts.ts` + `contracts/script/Deploy.s.sol`). Non-gated, CI-checkable.
2. **Founder decision:** reconcile canon `888,888,888` ↔ deployed `224,573,096` fair-launch cap.
3. **Build `MADLmsrMarket.sol` (LS-LMSR)** for flagship markets — fixed-point `exp`/`ln` + fuzz/invariant. This is the "make it an AMM/LMSR" deliverable.
4. **Build the quadruple oracle**: start with the optimistic-bond finalizer contract (`MADOptimisticOracle.sol`, $MADx bonds + challenge window + escalation) and the quadratic community-weight function; keep the AI panel + Chainlink as the proposing legs.
5. **pm-AMM spike** as R&D once LS-LMSR is live.

*Testnet deploy of any of the above is founder-gated (RPC + funded deployer + the $MADx owner keys).*

### Sources
- Paradigm, *pm-AMM* — https://www.paradigm.xyz/2024/11/pm-amm
- Othman & Sandholm, *A Practical Liquidity-Sensitive AMM* (EC'10) — https://www.cs.cmu.edu/~sandholm/liquidity-sensitive%20market%20maker.EC10.pdf
- XO Market, *Liquidity, Pricing, and the LS-LMSR* — https://xomarket.substack.com/p/liquidity-pricing-and-the-ls-lmsr-9b5
- Zeitgeist, *Rikiddo Scoring Rule* — https://medium.com/zeitgeistseer/introducing-zeitgeists-rikiddo-scoring-rule-89c8222e31c
- UMA, *Optimistic Oracle v3* — https://docs.uma.xyz/developers/optimistic-oracle-v3
- crypto.news, *How Prediction Markets Resolve: UMA* — https://crypto.news/how-prediction-markets-resolve-uma-optimistic-oracle/
- The Defiant, *$60M Polymarket/UMA dispute* — https://thedefiant.io/news/markets/usd85m-polymarket-dispute-over-strategy-s-may-bitcoin-sale-puts-uma-s-token-voting-oracle-on
- Kleros, *Reality.eth + Kleros as an oracle* — https://docs.kleros.io/integrations/types-of-integrations/1.-dispute-resolution-integration-plan/channel-partners/how-to-use-reality.eth-+-kleros-as-an-oracle
- Kleros, *Kleros vs UMA (schelling-point oracles)* — https://blog.kleros.io/kleros-and-uma-a-comparison-of-schelling-point-based-blockchain-oracles/
