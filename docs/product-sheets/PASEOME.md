# THE PASEOME — *Certain-UnCertainty*

**Perp families 7 & 8 · Foresight and Hindsight · counterfactual branching perpetuals**
**Full Product Sheet + Technical Development Scope · v1.1 · 2026-10-23**

> Every other perp prices ONE NUMBER — a velocity, a credibility, a persistence.
> The Paseome prices **A PATH**.

Every figure in this sheet is computed, not transcribed. The frontier example uses the same
share vector `GET /api/v1/paseome/frontier?side=foresight` serves, so any number here can be
checked against the live route. Constants cite their code home; if one disagrees with
`verify/lib/`, the code wins and this sheet is the bug.

---

## 0 · The thesis — *Certain-UnCertainty*

A what-if is the most uncertain thing a market can price. The Paseome's design move is to make
**everything around that uncertainty certain**, so the only thing left to trade is the part that
is genuinely worth trading.

| What is CERTAIN | How it is guaranteed | Code |
|---|---|---|
| The market maker's worst loss | Bounded at **b · ln(n)** — 1,318 / 1,664 / 1,931 $MADx for 3 / 4 / 5 branches | DL-LMSR, *b* = 1,200 |
| Value cannot leak at a fork | Branch prices sum to **exactly 1** by construction | `frontierPrices`, log-sum-exp |
| Capital on an untaken branch | **Refunded in full** — never written off | `settleFrontier` |
| When a branch resolves | Every **59.061 d**, on a global lunar grid | `lib/lunar-legs.ts` |
| What the platform takes | **1.88%**, flat, every trade | `PLATFORM.FEE_BPS` |
| Who may extend the tree | VIP **or** MinorCreator+ | `canAuthorBranch` |

| What stays UNCERTAIN | Why that is the point |
|---|---|
| Which branch the world takes | That is the information the market exists to aggregate |
| How strongly a counterfactual sticks | The only honest thing a Hindsight market can price |

The uncertainty that remains is **epistemic** — reducible by knowing more, reading the source,
being funnier. None of it is **aleatory**: there is no dice term anywhere in price. That seam is
the difference between a market that is compelling and one that is compulsive (§9).

---

## 1 · Product overview

The **paseome** is the complete set of paths — the whole tree, on the model of *genome* or
*biome*. You never trade the whole paseome; you trade the **frontier**, the 3–5 sibling branches
hanging off the live node.

**Tagline:** *Bet the branch. The story keeps forking.*

**Core loop:** SIGNAL → ROOT → AUTHOR BRANCH → MINT ARTEFACT → PRICE FRONTIER → CONVICT → ROLL → EXTEND

| | FORESIGHT · family 7 | HINDSIGHT · family 8 |
|---|---|---|
| Asks | "What if this happens?" | "What if this **had** happened?" |
| Class | PREDICTION | CONVICTION |
| Settles | Optimistic oracle at the leg boundary | **Never** |
| Prices | Probability the branch is taken | Persistence of the belief about it |
| Untaken siblings | **Refunded** | Nothing is ever unrealised — all carry |
| Ranked by | Calibration against outcomes | Calibration against its own forecast series |

**Why two instruments.** The split falls exactly where the maths forces it — at what can and
cannot be settled. A counterfactual has **no outcome to settle against**: conditional prices
reveal probabilistic relationships, not causal ones, and *P(Y | X = x)* is not *what Y would have
been had X been set to x*. Hindsight therefore prices the persistence of the belief instead of
pretending to resolve the unresolvable.

---

## 2 · Canonical constants

| Constant | Value | Code home |
|---|---|---|
| Frontier width | **3 to 5** branches, enforced by a throw | `FRONTIER_MIN` / `FRONTIER_MAX` |
| Frontier liquidity *b* | 1,200 | `FRONTIER_B` = `PLATFORM.LMSR_DEFAULT_B` |
| Max maker loss | *b*·ln *n* = 1,318.3 / 1,663.6 / 1,931.3 | DL-LMSR property |
| Volume scaling α(V) | 1 + 0.05·log₁₀(1+V) | `calculateVolumeScalingAlpha` |
| Leg | 59.061177706 d (2 synodic months) | `LEG_DAYS` |
| Turning | 6 legs = 354.367 d | `LEGS_PER_TURNING` |
| Platform rake | 1.88% flat | `PLATFORM.FEE_BPS` 188 |
| Community + DAO | 28.8% **of platform net** | `PLATFORM.COMMUNITY_SHARE_BPS` 2880 |
| MCI optimum | exactly **1** violated expectation | `MCI_OPTIMUM` |
| Meme multiplier | 0.85 – 1.35 | `MEME_MULT_MIN/MAX` |
| Authorship | VIP (888,888 $MADx) **or** MinorCreator+ | `canAuthorBranch` |

---

## 3 · How a market is made

1. **Root.** The scraper (`proposalsForToday`) surfaces a real headline. It becomes the root
   node — Foresight's tree opens *at the news*, never empty.
2. **Author.** An eligible account proposes a branch: one what-if, one sentence. For Hindsight
   the title must carry the counterfactual mood or the write is rejected.
3. **Mint the artefact.** The branch is paired with a short, storyboard or UGC piece minted
   against a caricature archetype from the deck. The artefact is what travels; its reach feeds
   `m_meme`.
4. **Score it.** `mciScore` counts violated expectations. One is the target.
5. **Open the frontier.** Once 3–5 siblings exist, the node becomes tradeable. Every branch starts
   with `q = 0`, so the opening frontier is uniform: 1/3, 1/4 or 1/5 each.
6. **Trade.** Buying shares in a branch raises `q` for that branch; DL-LMSR re-prices every
   sibling at once, still summing to 1. No operator sets a line.
7. **Roll.** At the leg boundary (Foresight), the oracle names the taken branch. Its holders are
   paid; every sibling is refunded. The taken branch becomes the new live node and its own
   children become the next frontier.
8. **Extend.** Authors open the next set of what-ifs off the new node. The tree grows; the
   instrument never closes.

---

## 4 · The maths, broken out

### 4.1 Frontier pricing

```
P(branch i) = e^(q_i/b) / Σ_j e^(q_j/b)
```

Computed in log-sum-exp form — subtract `m = max(q/b)` before exponentiating:

```
P(branch i) = e^(q_i/b − m) / Σ_j e^(q_j/b − m)
```

Identical mathematically, because the constant cancels in the ratio, and it cannot overflow
because the largest exponent is exactly 0. The naive form returns `NaN` past *q/b* ≈ 709 —
about 851,000 shares at *b* = 1,200. Reproduced, fixed, and regression-tested at 900k and 5M.

**Worked example** — the live demo Foresight frontier, `q = [4200, 3100, 2400, 900]`:

| Branch | Shares | Price | \|p − 0.5\| |
|---|---|---|---|
| f1 | 4,200 | **0.5928** | 0.0928 |
| f2 | 3,100 | 0.2370 | 0.2630 |
| f3 | 2,400 | 0.1323 | 0.3677 |
| f4 | 900 | 0.0379 | 0.4621 |
| | | **Σ = 1.000000000000** | |

### 4.2 Cost of a trade

```
C(q)  = α(V) · b · ln Σ_j e^(q_j/b)
cost  = C(q_after) − C(q_before)
```

Buying 500 shares of f4 from the frontier above costs **23.28 $MADx** (at V = 0) and moves f4 from
0.0379 to **0.0564**. The average fill, 0.0466, sits between the two — the trader pays the path,
not the endpoint. α(V) rises slowly with cumulative volume (1.30 at 10⁶, 1.40 at 10⁸), deepening
the book as it matures.

### 4.3 Path price

```
price(path) = Π_k P(branch_k)
```

Following f1 twice: 0.5928² = **0.3514**; three times: **0.2083**. Depth discounts
multiplicatively, so long-shot what-ifs get cheap on their own — there is no separate long-shot
parameter to tune or get wrong.

### 4.4 Bounded maker loss — the first certainty

The LMSR market maker's worst-case loss on an *n*-outcome node is *b*·ln *n*:

| Frontier width | Worst-case loss |
|---|---|
| 3 | 1,318.3 $MADx |
| 4 | 1,663.6 $MADx |
| 5 | 1,931.3 $MADx |

This is *why* the founder bound tops out at 5: each extra branch raises the maker's exposure,
while past five the top branch's price thins until it stops meaning anything.

### 4.5 Conservation

`treeConservationError` walks a tree and reports the first node whose edges do not sum to 1.
Paseome frontiers are conserved by construction; the check exists for trees assembled any other
way — including the one route that accepts a tree from a request body.

### 4.6 Hindsight's divergence

```
{ variance, permanent } = cgarchUpdate(prevVar, prevPermanent, ε²)
transitory = variance − permanent
DIVERGENCE = permanent − transitory
```

Five Faces' component decomposition pointed at a belief series. **Permanent** is the part of the
what-if the culture has absorbed; **transitory** is churn gone within a leg. Positive divergence
means the belief is sticking. Graded with `brierScore` / `logScore` — calibration is the only fair
ranking in a market that never resolves.

### 4.7 Memetic fitness

| Violations | Fitness | Reading |
|---|---|---|
| 0 | 0.35 | coherent but forgettable — it is just news |
| **1** | **1.00** | the optimum |
| 2 | 0.50 | noise |
| 3+ | decaying to 0.10 | incomprehensible |

`memeMultiplier = 0.85 + 0.50 · fitness` — bounded so memetics can **never outweigh time held or
capital** in MADConv, where time (t^1.35) already outranks capital (c^0.75).

---

## 5 · Earning functions — who earns what

### 5.1 The fee waterfall (corrected 2026-08-27, founder sign-off)

```
grossFee     = volume × 1.88%
creatorCut   = grossFee × rung        ← creator-made markets ONLY
platformNet  = grossFee − creatorCut
communityCut = platformNet × 28.8%    ← community + DAO treasury
protocolCut  = platformNet − communityCut
```

**Per 10,000 $MADx traded:**

| Who made the market | Gross | Creator | Platform net | Community + DAO | Protocol |
|---|---|---|---|---|---|
| Platform | 188.00 | 0.00 | 188.00 | 54.14 | 133.86 |
| Creator — User (28.8%) | 188.00 | 54.14 | 133.86 | 38.55 | 95.31 |
| Creator — MinorCreator (40%) | 188.00 | **75.20** | 112.80 | **32.49** | 80.31 |
| **VIP seat (60%)** — 4,888 seats | 188.00 | 112.80 | 75.20 | 21.66 | 53.54 |

On a 40% creator market the community receives 17.28% of gross — canon's figure to the decimal.
The pre-correction code paid 28.8% of gross, over-allocating **11.52 pp**.

**Creator profit share — founder, 2026-10-23:** creators slide **28.8% → 40%**; **60% is a VIP
profit share limited to 4,888 seats**. The parallel with the Shield 28.8 / 40 / 60 ladder is
deliberate. ⚠️ The code still reaches 60% through the `CR8TR` traction rung with no seat cap —
canon and code diverge until a seat registry ships (MASTER §5).

### 5.2 Every earning path

| Participant | Earns | Function |
|---|---|---|
| **Trader (Foresight)** | Payout on the taken branch; **full refund** on every untaken one | `settleFrontier` |
| **Trader (Hindsight)** | Marks against divergence; ranked on calibration, not outcome | `cgarchUpdate`, `brierScore` |
| **Branch author** | 28.8% → 40% of fees on branches they authored, by ladder rung | `splitFee`, `creatorStatus` |
| **VIP seat holder** | 60% of fees on their own markets — one of 4,888 seats | canon; seat registry not yet built |
| **Artefact maker** | Reach → `m_meme` → conviction → price on their branch | `memeMultiplier` |
| **Community + DAO** | 28.8% of platform net, every trade | `splitFee` |
| **Protocol** | Remainder of platform net | `splitFee` |
| **Long holders** | Conviction compounds with time held (t^1.35) | `calculateConviction` |
| **Shield buyers** | 28.8 / 40 / 60% loss recovery by tier | `shieldRecovery` |

### 5.3 The open market play — *the meme is the order*

A branch's artefact is minted with its price embedded. Sharing it carries the price; acting on
it moves `m_meme`, which moves conviction, which moves price — and the moved price rides the next
share. **Marketing and price discovery are the same action**, paid by the creator ladder that
already exists. Supply is permissionless within the authorship gate: anyone eligible can extend
the tree off any live node, and DL-LMSR prices each new branch against its siblings without an
operator.

---

## 6 · MAD Shield

Opt-in loss mitigation, never a guarantee. Premium = `Stake · P(win) · σ · 0.35`, clamped to
**2–4% of stake**. Recovery: **28.8%** standard · **40%** shielded · **60%** Whale/VIP/Partner.
Most valuable on Hindsight, where positions never settle and volatility is the whole reading.
Foresight refunds already remove untaken-branch losses, so Shield there covers only the
taken-branch-against-you case.

---

## 7 · The inspiration

Four research findings shaped the design, each mapped to a mechanism:

| Finding | Source | Became |
|---|---|---|
| Dopamine's sustained signal codes **uncertainty**, peaking at *p* = 0.5 | Fiorillo, Tobler & Schultz, *Science* 2003 | **The Knife Edge** — the deck sorts by \|p − 0.5\|, not volume |
| Dopamine neurons value **advance information**, even when it cannot be used | Bromberg-Martin & Hikosaka, *Neuron* 2009 | The **sealed read** — one-liner visible, reasoning one tap away |
| Humour = a violation that is simultaneously **benign**; distance makes it benign | McGraw & Warren, *Psych Science* 2010 | The **irrealis constraint** — a counterfactual is benign *because it did not happen* |
| Concepts violating **exactly one** expectation transmit best | Boyer; Norenzayan & Atran | The **MCI score** — "change one thing" |
| Gossip is ~two-thirds of conversation | Dunbar | The unit of distribution is a **sentence**, not a chart |

And one finding that constrains it:

| Near-misses are losses that recruit win circuitry and raise betting speed | Clark et al., *Neuron* 2009 | **Refund**, never render "how close", no fast lane, keep the 59-day cadence |

**Certain-UnCertainty** is the synthesis: make the maker loss, the conservation, the refund, the
cadence and the fee certain, so the only uncertainty left is the epistemic kind — the kind worth
paying for.

---

## 8 · Example markets

**Foresight**
- "What if the merger vote is postponed and the paperwork resigns in protest?"
- "What if the stadium deal passes and nobody notices for a month?"
- "What if the quarterly call achieves sentience and adjourns itself?"
- "What if the vote happens twice and both results stand?"

**Hindsight** — irrealis mandatory
- "What if the committee had simply never been formed?"
- "What if the memo had leaked one day earlier?"
- "What if the sequel had been greenlit instead of the reboot?"

Each changes exactly one thing. Each lands on a situation, never a person's character.

---

## 9 · Compliance — and the property that is genuinely dangerous

**Benign by grammar.** Hindsight gets McGraw's benign condition from the verb tense; Gossip-Cop has
to manufacture it by tone. Benignity also scales with depth (`benignityAtDepth`): branch 1 is
edgy, branch 4 is absurd and therefore safe.

**Three gates, none tonal:** opaque `subject_ref` (never a name) · caricatures of archetypes,
never likenesses · the irrealis check. Generated one-liners also pass `assertionRisk`, which
**fails closed** — a review trigger, not a defamation classifier.

**The near-miss problem.** A branching market is a near-miss generator by construction: every
roll hands most holders a loss that looks like it *almost* won. Four mitigations, all required:
refund untaken branches · never render "how close" · no speed affordances · keep the Turning.

**Never put an aleatory term in price.** Card packs may roll dice. The market may not.

Entertainment conviction on hypotheticals. No real-world illegal-outcome prediction. Shield is
loss mitigation only. All criteria on-chain and in the UI.

---

## 10 · Technical development scope

### 10.1 Smart contracts
- `MADPaseomeTree.sol` — node state, frontier registry, taken-branch transitions, refund settlement
- `MADLmsrMarket.sol` — reused; the frontier is an *n*-outcome vector
- `MADOptimisticOracle.sol` — Foresight only; $MADx bond + challenge window
- Reuse: `MADMarketFactory`, `MADStaking`, `MADShieldVault`, `RiskOracle`
- Foundry invariants: **Σp = 1 at every node** · refund solvency · maker loss ≤ *b*·ln *n* · no path priced above its parent

### 10.2 Backend
| Piece | Status |
|---|---|
| `lib/paseome.ts` — pricing, path, knife edge, MCI, irrealis, settlement, authorship | ✅ shipped, 26 tests |
| `treeConservationError` | ✅ shipped, enforced at the request boundary |
| `GET /api/v1/paseome/frontier` — demo data, real maths | ✅ shipped |
| Local-model one-liners (`POST /api/v1/satire/roast`) | ✅ shipped |
| Tree persistence `sql/00xx_paseome.sql` | ⬜ |
| Branch-refund ledger, artefact-gated authorship, oracle path | ⬜ |

### 10.3 Frontend
- Frontier instrument: branch weight = price, Σ readout, unpriced fan beyond the frontier
- Knife Edge as the default sort, with the sort key visible
- Hindsight cards read **"never resolves"** where others show a countdown
- Foresight and Hindsight unmistakable: different class, accent and verb

### 10.4 Phased build
| Phase | Contents |
|---|---|
| 1 | Persistence + Foresight only, seeded from the scraper, parimutuel |
| 2 | DL-LMSR continuous, refund settlement, leg roll, Shield |
| 3 | Hindsight, CGARCH divergence, calibration scoring, oracle |
| 4 | Artefact minting, MCI live into `m_meme`, permissionless authorship within the gate |

---

## 11 · Success metrics

| Metric | Target | Why |
|---|---|---|
| Σp deviation from 1 | < 10⁻⁹ | the conservation invariant, measured |
| Median frontier width | 3–4 | inside the bound, prices legible |
| Positions at \|p − 0.5\| < 0.1 | rising | the Knife Edge is used |
| Authored branches with MCI = 1 | ≥ 60% | the craft rule lands |
| Carry-through at roll | ≥ 50% | holders extend rather than exit |
| Hindsight Brier score | improving | the only honest score where nothing resolves |
| Near-miss surfaces shipped | **0** | non-negotiable |

Traction, revenue and user targets are deliberately absent ‹verify› — no verified baseline exists,
and `CANONICAL_NUMBERS §7` lists the demo figures as placeholders.

---

## 12 · Open questions

1. **How is a VIP seat obtained?** 60% is capped at 4,888 seats (settled 2026-10-23). Whether seats are bought, earned, or granted — and whether `CR8TR` traction still qualifies — decides the registry design. MASTER §3.
2. **Artefact gate timing.** Live from Phase 1 (keeps `m_meme` meaningful) or Phase 4 (grows the tree faster)?
3. **What roots a Hindsight tree** — an anniversary, a Foresight branch that failed, or free authorship?
