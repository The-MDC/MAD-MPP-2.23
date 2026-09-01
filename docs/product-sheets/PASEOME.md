# THE PASEOME — Foresight & Hindsight

**Perp families 7 and 8 · counterfactual branching markets · v1.0 · 2026-08-27**

> Every other perp prices ONE NUMBER — a velocity, a credibility, a persistence.
> These price A PATH.

---

## 1 · Product overview

A what-if is a **tree**. A position rides one branch of it. The tree never terminates, and that
is what makes this a perpetual rather than a very long binary.

The **paseome** is the complete set of paths — the whole tree, on the model of *genome* or
*biome*. It names something the platform previously had no word for. You never trade the whole
paseome; you trade the **frontier**, the sibling set hanging off the live node.

**Tagline:** *Bet the branch. The story keeps forking.*

**Core loop:** SIGNAL → ROOT → AUTHOR BRANCH → MINT ARTEFACT → PRICE FRONTIER → CONVICT → ROLL → EXTEND

### The two instruments

The split is not editorial. It falls exactly where the maths forces it — at **what can and
cannot be settled**.

| | FORESIGHT | HINDSIGHT |
|---|---|---|
| Asks | "What if this happens?" | "What if this **had** happened?" |
| Family | 7 | 8 |
| Class | PREDICTION | CONVICTION |
| Settles | Optimistic oracle at the leg boundary | **Never** |
| Prices | Probability the branch is taken | Persistence of the belief about it |
| Untaken siblings | **Refunded** | Nothing is ever unrealised |
| Resolution surface | The branch happened or it did not | Consensus drift, graded on calibration |

**Foresight is ordinary.** The branch happens or it doesn't; the oracle says which; the leg rolls.

**Hindsight is not, and the design admits it.** A counterfactual has **no outcome to settle
against**. Conditional market prices reveal probabilistic relationships, not causal ones —
*P(Y | X = x)* is not *what Y would have been had X been set to x*, and no amount of liquidity
closes that gap. So Hindsight does not price the counterfactual. It prices the **persistence of
the belief** about it, which is a real, continuously-measurable quantity — exactly what
Perpetual Epiphanies already does when it prices Murphy's Law with no terminal date.

---

## 2 · Canonical constants

| Constant | Value | Code home |
|---|---|---|
| Frontier width | **3 to 5** branches | `FRONTIER_MIN` / `FRONTIER_MAX`, `lib/paseome.ts` |
| Frontier liquidity *b* | 1,200 | `FRONTIER_B` = `PLATFORM.LMSR_DEFAULT_B` |
| Leg | 59.061177706 d (2 synodic months) | `LEG_DAYS`, `lib/lunar-legs.ts` |
| Turning | 6 legs = 354.367 d | `LEGS_PER_TURNING` |
| Platform rake | 1.88% flat | `PLATFORM.FEE_BPS` |
| Community + DAO | 28.8% **of net** | `PLATFORM.COMMUNITY_SHARE_BPS` |
| MCI optimum | exactly **1** violation | `MCI_OPTIMUM` |
| Meme multiplier bounds | 0.85 – 1.35 | `MEME_MULT_MIN/MAX` |
| Authorship gate | VIP **or** MinorCreator+ | `canAuthorBranch` |

All frontier bounds are enforced by a **throw**, not a comment, and pinned to literals in
`lib/paseome.test.ts` so the founder's decision cannot drift.

---

## 3 · Taxonomy & trigger

**Root creation.** A Foresight tree roots on a real signal — the same scraper the six existing
families run on (`proposalsForToday`). The day's headlines become roots; the first branch set is
the what-ifs hanging off one. **The market never opens empty; it opens at the news.**

**Branch creation.** Permissionless on the supply side but **gated on authorship**: a branch can
only be authored by an account that is VIP (capital axis) **or** at MinorCreator and above
(creator axis). See §7.

**The irrealis constraint.** A Hindsight market's title MUST grammatically contain the
counterfactual mood — *had*, *would have*, *could have*, *if*, *were*, *imagine*, *suppose*. A
title that asserts is **rejected at write time**. This is a schema constraint, not a style guide,
and §8 explains why it is load-bearing.

---

## 4 · Pricing — the frontier simplex

### Why the tree cannot leak value at a fork

The failure mode of any branching market is immediate: if the prices on the branches leaving a
node do not sum to the price of the node, the market **mints or destroys value every time it
forks**. Traders find that within a day.

The engine already contained the fix in two halves that had never been joined.
`calculateDLLMSRPrice` returns an *n*-outcome vector that sums to 1 **by construction**:

```
P(branch i) = e^(q_i / b) / Σ_j e^(q_j / b)
```

Feed that vector in as the `conditionalProb` edges of a `TreeNode` and conservation stops being
a rule anyone has to remember. `treeConservationError` asserts it for trees assembled any other
way.

### Path price

```
price(path) = Π  P(branch_k)
             k∈path
```

A position's value is the **product** of the branch prices along its path. Deepening a path
multiplies the discount, so long-shot what-ifs get cheap **on their own** — there is no separate
long-shot parameter to tune, and none to get wrong.

### Only the frontier is priced

Maintaining correct LMSR prices across a whole combinatorial outcome space is intractable. This
market never attempts it: it prices the sibling set at the live node and nothing else — *O(n)*
per node instead of exponential. **Depth is a property of the recorded path, not of the pricing
problem.**

### Known limitation

`Math.exp(q/b)` overflows to `Infinity` for `q/b > ~709`. With *b* = 1,200 that is roughly
850,000 shares on one branch — reachable in a deep book. The fix is the log-sum-exp
(max-subtraction) form, which is mathematically identical and numerically stable. ‹verify› —
**not yet implemented**; tracked as outstanding.

---

## 5 · Settlement

```
FORESIGHT   one branch taken; every sibling REFUNDED
HINDSIGHT   nothing settles; every branch CARRIED, permanently
```

**Refund, not write-off** — founder decision, 2026-08-27. Two independent reasons, both holding:

1. **Capital efficiency.** The known failure of conditional markets is that nobody funds a bet
   that pays out only if a *separate* event also occurs. Refunding is what makes locking capital
   rational.
2. **Harm reduction.** A refunded branch is not a loss, so it **cannot be a near-miss**. Near
   misses are losses that recruit win-related striatal circuitry, raise arousal, raise motivation
   and measurably raise betting *speed*. A branching market generates them structurally at every
   roll. Refund is the structural answer. See §8.

At a roll, Zeitgeist's succession matrix transmigrates conviction from the parent into the
surviving child, under a write path that already **refuses a matrix that leaks holder value**.
Same operation, already written.

### Hindsight's headline print

```
{ variance, permanent } = cgarchUpdate(...)
transitory  = variance − permanent
DIVERGENCE  = permanent − transitory
```

Five Faces' component decomposition, pointed at a belief series instead of a mask. The
**permanent** component is the part of the what-if that has entered the culture and stayed; the
**transitory** component is churn that will be gone within a leg. Positive divergence means the
belief is sticking.

Grading is `brierScore` / `logScore` — a Hindsight position is scored against the forecast series
it moved, not against an outcome. **Calibration is the only fair thing to rank people on in a
market that cannot resolve.**

---

## 6 · Memetic fitness — change exactly one thing

Concepts that violate **exactly one** ontological expectation are recalled and retransmitted
best. Zero violations is just news; two or more is incomprehensible. The optimum is a minority of
counterintuitive elements against a majority of ordinary ones, and the effect replicates
cross-culturally.

So memetic fitness is not a vibe. It is a **countable quantity with an optimum at one**, and
MADConv already had a term waiting for it:

```
M = t^1.35 · c^0.75 · d^1.45 · ψ^1.15 · (1+π^0.9) · m_meme · satire · liar · garch_amp
                                                     ↑
                                        mciScore().fitness → memeMultiplier()
```

| Violations | Fitness | Reading |
|---|---|---|
| 0 | 0.35 | coherent but forgettable — it is just news |
| **1** | **1.00** | the optimum |
| 2 | 0.50 | noise |
| 3+ | decaying | incomprehensible |

Bounded to 0.85–1.35 so memetics can **never dominate time-held or capital**. The exponent
ordering in MADConv is the ideology; a meme term that could overwhelm it would quietly invert
that.

**The craft rule, in three words: change one thing.** "What if Kenny stayed dead" is one
violation. "What if Kenny stayed dead and was a lizard and it was 1840" is noise, and the score
says so.

---

## 7 · Authorship

Eligible if **either** axis clears — a deliberate disjunction, never a merge:

| Axis | Gate | Constant |
|---|---|---|
| Capital | VIP | `VIP_STATUS_MIN_MADX` = 888,888 |
| Creator | MinorCreator or above | `CREATOR_LADDER`, 12 tractioned markets |

The engine states plainly that VIP is *"never a creator tier"*. Collapsing the two into one
eligibility score would destroy that distinction, so both are evaluated and both are reported
(`viaCapital`, `viaCreator`).

**Why gated rather than open.** Open authorship grows the tree faster; gated authorship keeps
artefact quality high enough that `m_meme` is measuring something real. Founder decision,
2026-08-27, revisitable once the MCI score has a track record.

---

## 8 · Compliance — and the one property that is genuinely dangerous

### The benign-violation guarantee

Humour requires a violation that is **simultaneously benign**, and psychological distance is one
of the three routes to benign. Which gives this family a property Gossip-Cop does not have:

> **A counterfactual is benign *because it did not happen*.**

Hindsight gets its benign appraisal **free, from the verb tense**. Gossip-Cop prices claims about
things that *did* happen — benign-ness must be manufactured by tone, by hand, every time. The
irrealis mood does that work structurally, which is precisely why it is enforced at write time
rather than recommended in a style guide.

**Benignity scales with depth.** Distance rises with remove from the real, so branch 1 is edgy
and branch 4 is absurd and therefore safe. The satire safety gradient **is** the tree structure —
nothing extra to build (`benignityAtDepth`).

### Three independent gates, none of them tonal

1. `subject_ref` is opaque and validated at the boundary — **never a person's name**. Schema law.
2. Caricatures are of **archetypes** (the Five Faces cast: Saint, White Rice, Megalomaniac,
   Narcissist, Sellout), never likenesses.
3. The irrealis check on Hindsight titles.

Generated one-liners additionally pass `assertionRisk`, which **fails closed**. That is a lexical
tripwire and a review trigger — **not** a defamation classifier. It cannot tell absurd
exaggeration from a false statement of fact. Human review remains the control.

### The near-miss problem

**A branching market is a near-miss generator by construction.** Every leg roll produces, for
most holders, a loss that looks like it *almost* won. This is intrinsic to any instrument where
visible alternatives resolve against you — it is not a UI risk to be designed around later.

Four structural mitigations, all required:

1. **Refund, don't near-miss.** Untaken Foresight siblings refund. A refund is not a loss.
2. **Never render "how close."** No "your branch missed by 3 points." That one string *is* the
   near-miss, manufactured deliberately. It will be tempting because it tests well.
3. **No fast lane.** The measured near-miss effect is increased betting *speed*. MADConv already
   weights time held (t^1.35) above capital (c^0.75). Do not ship an affordance that fights it.
4. **Keep the Turning.** Six legs is one lunar year. A cadence in months rather than seconds is
   the strongest anti-compulsion property the platform has, and it is already canon.

### Epistemic versus aleatory

| Compelling | Compulsive |
|---|---|
| **Epistemic** uncertainty — reducible by knowing more: reading the source, knowing the subject, being funnier. Rewards attention with understanding. | **Aleatory** uncertainty and near-misses — irreducible by any amount of thinking. Rewards attention with arousal and nothing else. |

The two are separable and the neuroscience says exactly where the seam runs. **Design rule: never
put an aleatory term in price.** Card packs may roll dice; the market may not.

Entertainment conviction on hypotheticals. No real-world illegal-outcome prediction. Shield is
loss mitigation only. All criteria on-chain and in the UI.

---

## 9 · Why the frontier is ranked the way it is

Dopamine carries two separable signals: a phasic burst coding reward prediction **error**,
monotonic in *p*; and a slower **sustained ramp** coding **uncertainty**, which is maximal at
*p* = 0.5 and falls away toward both ends.

A prediction market wants traders in exactly that place — highest information value, widest
spread available to earn. So the deck's default sort is **`|p − 0.5|` ascending**, not volume.

**The Knife Edge.** Every other venue sorts by volume, which points *away* from the information
frontier. `knifeEdgeDistance` / `rankByKnifeEdge`.

The arousal does not have to be manufactured. It only has to be **found and surfaced** — which is
the whole ethical difference between this ranking and a slot machine, given §8's epistemic /
aleatory seam.

---

## 10 · Technical development scope

### 10.1 Smart contracts
- `MADPaseomeTree.sol` — node state, frontier registry, branch-taken transitions, refund settlement
- `MADLmsrMarket.sol` (LS-LMSR) — reused; frontier is an *n*-outcome vector
- `MADOptimisticOracle.sol` — shared with Gossip-Cop; $MADx bond + challenge window (Foresight only)
- Reuse: `MADMarketFactory`, `MADStaking`, `MADShieldVault`, `RiskOracle`
- Foundry invariants: **Σp = 1 at every node**, monotonic cost, refund solvency, no path priced above its parent

### 10.2 Backend
- `lib/paseome.ts` — **shipped**: frontier pricing, path price, knife edge, MCI, irrealis, settlement, authorship
- `lib/bayesian-conviction.ts` — `treeConservationError` **shipped**
- New: frontier state machine, artefact-gated branch opening, branch refund ledger
- New: `POST /api/v1/paseome/{root,branch,frontier,settle}`
- Reuse: `proposalsForToday` for seeding, `satirizeHeadline` + the local model tier for one-liners

### 10.3 Frontend
- Frontier instrument: live tree with branch weight = price, Σ readout, unpriced fan beyond
- Knife Edge as the default deck sort, with the sort key visible
- Hindsight cards must say **"never resolves"** where the others show a countdown
- Foresight and Hindsight **visually and structurally unmistakable** — different class, accent, verb
- Artefact viewer: short / storyboard / UGC inline on the branch

### 10.4 Phased build
| Phase | Contents |
|---|---|
| 1 | Frontier pricing + tree persistence + Foresight only, parimutuel, seeded from the scraper |
| 2 | DL-LMSR continuous, refund settlement, leg roll, Shield |
| 3 | Hindsight, CGARCH divergence, calibration scoring, optimistic oracle |
| 4 | Artefact minting, MCI scoring live into `m_meme`, permissionless branch authorship |

---

## 11 · Success metrics

| Metric | Target | Why this one |
|---|---|---|
| Median frontier width | 3–4 | inside the founder bound, prices legible |
| Σp deviation from 1 | < 1e-9 | the conservation invariant, measured not assumed |
| Share of positions on branches at \|p−0.5\| < 0.1 | rising | the Knife Edge is being used |
| MCI = 1 share of authored branches | ≥ 60% | the craft rule is landing |
| Carry-through at roll | ≥ 50% | holders extend rather than exit |
| Hindsight calibration (Brier) | improving | the only honest score for a market that never resolves |
| Near-miss surfaces shipped | **0** | non-negotiable |

Traction, revenue and user-count targets are deliberately absent. ‹verify› — no verified baseline
exists; `CANONICAL_NUMBERS §7` lists the demo figures as placeholders that must not be used as
proof.

---

## 12 · Open questions

1. **Log-sum-exp.** `frontierPrices` overflows above ~850k shares on one branch. Needs the
   max-subtraction form. Correctness bug, not theoretical.
2. **Artefact requirement.** Should a branch be openable *without* a rendered artefact in Phase 1,
   or is the artefact gate live from the start? Gating early keeps `m_meme` meaningful; gating
   late grows the tree faster.
3. **Hindsight roots.** Foresight roots on today's news. What roots a Hindsight tree — an
   anniversary, a Foresight branch that failed, or free authorship?
4. **Creator ladder base rung.** ⛔ The ladder starts at 28.8%, below the founder's stated 40–60%
   creator range. Unresolved platform-wide; see `_CANON_REFERENCE.md`.
