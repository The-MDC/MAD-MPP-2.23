---
name: perspective-shift
description: Interrogate a product, mechanism, pricing or positioning decision from nine perspectives before changing it. Use when asked to refine, sharpen, critique or rethink part of the platform; when a decision feels obvious; when two reasonable people disagree; or when a change passed review but was only ever tested at one scale.
version: 2.0
---

# perspective-shift

The three principles this is built to serve: people can earn sustainably, the engine stays hard to figure out, the surface stays simple enough to play. Any finding that improves one and wrecks another is not a finding.

## The one line

Three lenses at three horizons make nine perspectives. Six personas argue inside each. Every perspective is read three ways before it reports. The output is what changed your mind, not a verdict.

## Vocabulary, fixed

Do not vary these words. They have been drifting.

| Term | Means | Count |
|---|---|---|
| Lens | a duality: two stakeholders in genuine conflict | 3 |
| Perspective | a lens at a horizon | 9 |
| Persona | a voice that speaks from a perspective | 6 |
| Register | how a finding is examined | 3 |

A perspective is a place to stand. A register is a way of looking. A persona is who is talking.

Nine perspectives, three registers each: twenty-seven readings.

## Why the horizons exist

A conflict reported once is reported for whichever world the author was imagining. Almost every serious failure in a growing system is a conflict tested at one scale, passed, then treated as a property of the design rather than a property of the scale. Actor Critic found this the hard way, and so does every market that works at ten markets and dies at ten thousand.

### The three horizons

**Now.** Pre-close, one operator, a handful of markets, nobody adversarial has read the docs.

**At scale.** Thousands of markets, thousands of subjects, one shared book across five families, an adversary who has had a month with your published parameters.

**At maturity.** Crowded category, regulatory precedent exists, competitors have copied the surface, rake compressed.

## The three lenses

### Customer ↔ User

Customer is the buyer: value, trust, return on what they paid. User is the person using it: friction, attention, usability.

Meta-conflict: what delights the user now, speed and spectacle, is paid for by the customer later, in trust and accuracy.

Inversion question: what would make each side abandon this? The customer abandons on a resolution they would be ashamed to defend in public. The user abandons on friction, or on a losing run with no exit.

### Employee ↔ Business

Employee is who runs it at 2am: adoption, on-call burden, cognitive load. Business is the P&L: cost, advantage, defensibility.

Meta-conflict: the cheapest thing to build is the costliest to run, and that cost is invisible on decision day.

Vuja Dé question: inherited tomorrow from a stranger, with no memory of designing it, would you take this on? If the answer is no, it is a later feature and the roadmap should say so.

### Technical ↔ Societal

Technical is architecture, security, failure modes. Societal is who is harmed if it works exactly as designed, plus compliance.

Meta-conflict: the elegant solution pushes its cost onto someone not in the room.

This is the lens that only speaks when the product is working. A failure-modes review cannot find a harm caused by correct operation, because it is looking for the wrong thing. Round Table: seat a regulator, a plaintiff's lawyer, and a competitor who would rather litigate than compete.

## The six personas

Not lenses. Not perspectives. The voices that turn up and interrogate, and they never agree.

**The Drainer.** Wants to take money out and post no risk. Asks: where can I extract without a position? Refuses to accept a design as safe because it has not been drained. Fires on pricing, liquidity, settlement, anything with a payout.

**The Sybil.** Wants influence from quantity rather than stake. Asks: how many accounts, and what does each cost? Refuses the claim that identity is expensive. Fires on credibility, voting, reputation, market creation, engagement metrics.

**The Insider.** Wants profit from knowing what happens next. Asks: who knows before the market does? Refuses any mechanism that assumes simultaneous revelation. Fires on timing, oracles, anchors, funding epochs, disclosure.

**The Statistician.** Wants to show the model is wrong for the space it operates in. Asks: where is this misspecified, and what does it cost in practice? Refuses a fit as evidence of correctness without a control. Fires on volatility, forecasting, fitted parameters, any bounded variable modelled as unbounded.

**The LP.** Wants to know where the book goes naked. Asks: what am I holding when three things break at once? Refuses average-day thinking. Fires on inventory, collateral, funding, liquidation, shared budgets.

**The Auditor.** Wants to prove nobody outside can check the outcome. Asks: how do I reproduce this from the repo alone? Refuses an unlogged decision. Fires on settlement finality, resolution specs, test artifacts, anything server-side.

## The nine perspectives, with personas seated

Two personas per perspective. They disagree in their own voice. The finding comes out of the disagreement, not from beside it.

### 1. Customer ↔ User, Now — Auditor, Insider

- **Auditor:** the buyer is a named partner and the trust is personal, so nothing is written down and nothing can be checked. A relationship is not a control, it is a control you have not tested.
- **Insider:** the partner knows more about their audience than you do, so you are pricing on information you cannot see.
- **Finding:** the conflict is quiet at one partner, and quiet because nothing is documented rather than because nothing is wrong.

### 2. Customer ↔ User, At scale — Sybil, LP

- **Sybil:** creators are now a number, so how many fake ones does it take to look like demand?
- **LP:** the buyer is not holding the bag, you are. Every creator-brokered market is inventory the house carries, and the buyer was already paid.
- **Finding:** per-market caps fail. Exposure on a subject is cumulative across every market naming them, so the cap must be per subject.

### 3. Customer ↔ User, At maturity — Auditor, Drainer

- **Auditor:** five venues with identical mechanics, so the only thing left to buy is a resolution the buyer can defend. Can a third party audit it from the evidence alone?
- **Drainer:** and where they cannot, that is where I live. Every unauditable resolution is a market where the house can be wrong and nobody prices the difference.
- **Finding:** resolution quality is the last defensible position and the most expensive. Cutting resolution cost here is liquidation wearing efficiency's clothes.

### 4. Employee ↔ Business, Now — Insider, Statistician

- **Insider:** one person holds the engine, so the business is a person. The coefficient library being server-side means the value sits in someone's head and nobody has valued it.
- **Statistician:** build speed is the constraint and correctness is the casualty. Every family added before the specification is settled is a family that gets rebuilt.
- **Finding:** at this horizon surface discipline looks like a luxury and is the only thing that prevents the rebuild.

### 5. Employee ↔ Business, At scale — LP, Sybil

- **LP:** four families on one budget is not four risks, it is one risk counted four times. Value at risk scales linearly in family count when the anchors are correlated, and entertainment news cycles are among the most correlated series available.
- **Sybil:** and the operational load is not the families, it is the interactions. Surface scales as n(n−1)/2, so one more family is +67% in things that page you at 2am.
- **Finding:** the fifth family is a permanent tax. Compute the anchor dependence matrix; if median tail dependence is high, it adds risk without adding independent revenue.

### 6. Employee ↔ Business, At maturity — Insider, Auditor

- **Insider:** the builder has left or is the only fixer, and knowledge concentration peaks exactly as the business becomes worth something. Un-copyable and un-survivable are the same property from different seats.
- **Auditor:** and because the coefficients are not in the repo, reconstitution cost is not bounded by version history. What is the expected loss from departure, in number?
- **Finding:** a buyer prices that concentration as a discount whether or not anyone names it. Target a second holder.

### 7. Technical ↔ Societal, Now — Statistician, Drainer

- **Statistician:** the volatility filter runs on a bounded series and should run on the logit. The clamp is not a safety feature, it is a tradeable kink, and here is the control test that proves it.
- **Drainer:** then I trade the kink. Any hard bound in a price is a place to stand and take value from the other side.
- **Finding:** the clamp is a defect wearing a constraint's clothes. Mandatory control: continuity passes on tanh and fails on the clamp.

### 8. Technical ↔ Societal, At scale — Sybil, LP

- **Sybil:** if credibility aggregates by count, or by weight anyone can buy, the anchor is purchasable. What does it cost to move it ten points?
- **LP:** if reputation severity has a heavy tail, my expected loss does not converge. Under a tail index at or below one, no finite rake is an adequate premium and the only honest answer is a capped exposure.
- **Finding:** state the jump intensity and the support of the jump per market class. Unbounded support means no launch without a legal bound or a mechanism that caps it.

### 9. Technical ↔ Societal, At maturity — Auditor, Insider

- **Auditor:** precedent exists and it was set by someone else's market. The licence to operate named-subject markets becomes the scarce asset, not the engine.
- **Insider:** and the competitor who would rather litigate than compete knows exactly which of your markets to point at.
- **Finding:** what is being accumulated now may be the wrong asset class. This is the finding no test of the current frame produces, because it questions the frame.

## The three registers

Entry standard inside every perspective. Not an axis.

**Argued.** Case and counter-case in plain prose, with the values underneath. Philosophy belongs here and decides which question is being computed. An engine that prices conviction rather than accuracy is a philosophical position before it is a technical one.

**Quantified.** A bound, a threshold, a distribution, or a test with a control. An argument with no falsifiable consequence is a mood. A number with no argument answers a question nobody asked.

**Imagined.** One step past the obvious framing. A market on a fact has a resolution; a market on a story has an arc. If the underlying is narrative rather than fact, the family reorganises around a narrative term structure.

A perspective read in one register has not been read.

## Classifications

**Harmonic.** Same verdict at all three horizons. Structural. Blocks now, because waiting buys nothing and costs time.

**Chaotic.** Verdict flips between horizons. Roadmap debt with a stated trigger. Name the horizon and the condition. A flip without a trigger is anxiety, not a finding.

**Shear.** The gap between the Now and At-scale readings in one perspective. Steep shear means the design holds only near the origin, which is the definition of a thing that breaks on contact with success.

**Convergent.** Two lenses with opposite priors land on the same requirement, as when Societal wants a restoration path because the subject is a person and Technical wants one because without it the price is not a martingale. Highest-confidence finding available, outranks anything either lens produced alone.

**Absent.** What no persona asked. Usually the most valuable output, because a persona only sees what its own appetite points at.

## Procedure

1. Read the actual files. Never run from memory. A persona applied to a remembered design reviews the design as remembered.
2. Name the decision in one sentence: what changes, and from what.
3. Fill the nine. Two personas per perspective. Skip only with a stated reason.
4. Read each filled cell three times: argued, quantified, imagined.
5. Root the findings. Group by shared cause. Most cells share one.
6. Classify each finding per the list above.
7. Rank the actions by expected value.
8. Report to the contract, then make the change.

## Ranking

`R(a) = P(fail) × L(fail) × D(h) − C(now)`

Three consequences.

- An unbounded loss term dominates everything, so harmonic findings block regardless of how improbable they look.
- A flip can reverse the sign of R between horizons, because cost rises faster the later you pay. That is what makes roadmap debt expensive.
- Cheap and confident outranks expensive and important, because the first buys information about the second.

## Output contract

Literal fields. Fill them; do not compose prose around them. Field-shaped output makes padding obvious.

<!-- The placeholders inside the angle brackets below were stripped from the pasted source; they are rebuilt from Hard rules 5 and 6 (name persona, perspective and register; mark epistemic status). Adjust if your original differed. -->

```
Decision: <one sentence: what changes, and from what>
Nuance: <what the obvious reading misses>

Harmonic (blocks now)
* <finding> | <perspective #> | <persona> | <register> | <status>

Chaotic (flips at <horizon> when <condition>)
* <finding> | <perspective #> | <persona> | <register> | <status>

Convergent
* <finding> | <lens A + lens B> | <persona> | <register> | <status>

Absent
* <what no persona asked>

Roots
* <shared cause> | <perspectives it explains>

Ranked
Small and confident: 1. <action> | <perspective> | <R>
Needs your call:     2. <action> | <perspective> | <R>

What I would change, and what I would leave alone
```

## Hard rules

1. Read the actual files first.
2. Seat adversaries, not fans. A persona that agrees with the design has produced nothing.
3. Separate new flaws from inherited ones. An inherited finding is logged, not blocking.
4. Both sides produce a figure where a figure exists. Challenger-only numbers are a veto; defender-only numbers are an assertion. Neither is a reading.
5. Name the persona, the perspective and the register on every finding. A finding attributed to nobody is an opinion with a table around it.
6. Mark epistemic status: proven, derived, assumed, founder's statement, unverified. An unmarked claim is an opinion.
7. Quiet cells get one line and a reason. Padding every perspective to look thorough is how a real finding gets buried.
8. No numbers, no verdict.

## Why Sybil sits in Technical, not Customer

Fake engagement looks like a demand problem. It is not. Demand inflation is a growth issue you catch with deduplication. Information contamination is a pricing issue: a sybil trades, and if its trades enter the book the price is no longer an aggregation of independent signals, it is signal mixed with manufactured noise that knows it is noise.

So the metric that matters is not engagement and not unique wallets. It is effective independent information per market: distinct uncorrelated participants, weighted by how much each disagrees with consensus. Thirty dissenters in a thin market carry more information than ten thousand agreeing in a deep one, and those two look identical on a dashboard.

The hard consequence: if the product's claim is information rather than volume, sybil resistance is not a compliance feature, it is the core property. A market that cannot be defended as sybil-resistant should not open.
