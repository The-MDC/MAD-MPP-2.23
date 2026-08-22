# MAD Gambit — Investor Presentation

**Built to the guidelines in the 10 attachments (2026-08-19):**
Alps Capital's five-point intake structure · McKinsey six-prompt deck discipline
(ghost deck → MECE → so-what → objection map → exec summary → one-slide compression) ·
Kalshi competitive teardown · live MPP product state · OV pitch-control state.

Evidence rules from Boardy's brief apply throughout. Every claim traces to
`FEATURE_TRACEABILITY_MATRIX.md`. Numbers per `CANONICAL_NUMBERS_2026-08-19.md`.

---

# PART 0 — Executive summary
*(McKinsey prompt 5: recommendation in sentence 1, three reasons, expected impact. Reader knows
what to do in 30 seconds.)*

> **Recommendation:** Fund MAD Gambit with a $300–500K milestone-based bridge, plus an immediate
> $15–20K infrastructure tranche, to convert a working mathematical engine into a validated,
> revenue-capable conviction-market platform.
>
> **Why.** (1) The economic layer is already written and enforced in code — DL-LMSR pricing,
> GARCH(1,1) volatility, a 1.88% rake splitting 40% to creators and 28.8% to the community, and an
> opt-in loss-recovery dial. (2) Incumbents are structurally house-versus-player wrapped in
> regulatory arbitrage; creator-owned market economics is a genuinely different structure, not a
> better version of the same one. (3) The gap to revenue is execution capacity, not invention —
> one accountable technical partner and deployed contracts.
>
> **Expected impact of the bridge:** deployed market contracts on Arbitrum Nova, an independent
> security review, and first live creator markets with real settlement — the evidence required to
> price a seed at or above $12M pre.

---

# PART 1 — What we're building
*(Alps point 1: one-liner, product + narrative, USP. Explicitly **not** "better, faster, cheaper".)*

**One-liner.**
> MAD Gambit is an EVM-native conviction market for entertainment and creator economies, where
> creators launch markets on culture and own 40% of the fees their markets generate.

**The narrative.**
Prediction markets today resolve facts. Sportsbooks move liquidity. Neither prices *culture* —
the rumour, the scandal, the claim that may never formally resolve. Culture moves faster than
either can settle, and it is the most-consumed asset class on earth with no market structure
underneath it.

**The USP — structural, not incremental.**
This is not a cheaper Polymarket. Three things are structurally different:

1. **Continuous conviction, not binary resolution.** Markets price on a DL-LMSR curve and never
   have to close. A family of specialised perpetuals — Z-Liar (is this person truthful?),
   Gossip-Cop (does this story hold?), Perpetual Epiphanies (was it ever true?), Progression/Saga
   (what happens next?) — where binary is a novelty format, not the product.
2. **The creator is the market maker's counterparty of interest.** 40% of the rake on a
   creator-made market goes to that creator, enforced in the fee-split contract. Incumbents
   route that economics to professional market makers.
3. **Loss is a designed state, not a terminal one.** MAD Shield is an opt-in, fee-funded recovery
   pool: a 2–4% premium returns 28.8% of losses at standard tier, scaling to 40%. Entertainment
   audiences churn on loss; this is a retention mechanism expressed as economics.

**What we are not saying:** not insurance, not "no counterparty risk", not "regulatory-safe",
not "industry's first". Those claims are unevidenced and are barred from our materials.

---

# PART 2 — Round details
*(Alps point 2. Answered honestly. Weak fields are marked — do not dress them up.)*

| Field | Answer |
|---|---|
| **Round size & type** | Two live asks: **$15–20K infrastructure tranche** (immediate) and **$300–500K bridge** (milestone-based). Standing **seed $1.24M–$2.48M**. |
| **Valuation** | $12M pre-money on the seed. Bridge intended as SAFE converting into it. |
| **Amount already committed** | **$0.** No soft circles. ⚠️ |
| **Existing backers** | **None.** Self-funded and bootstrapped to date. ⚠️ |
| **Lead investor** | **None.** ⚠️ |
| **Previously raised** | **$0 institutional.** Founder-funded. ⚠️ |
| **Instrument** | SAFE or equity; 10% token allocation attached to the seed. |
| **Entity** | MAD Gambit LLC, **New Mexico** (filed Q1 2026). Not Wyoming — a stale slide said otherwise and has been corrected. |

> **Handle this section head-on.** Four zeroes in a row is the weakest part of this raise, and
> investors read evasion faster than they read the numbers. The honest framing: *"Nothing is
> committed. I've built the engine, the contracts, and the product surface without capital, and
> I'm raising the first outside money against milestones rather than a story."* Say it plainly,
> then move to Part 3 — the build is the credential.

---

# PART 3 — The real potential
*(Alps point 3: institutional partner, first clients, MOUs, revenue model, team sentence.)*

| Field | Answer |
|---|---|
| **Institutional partner** | In conversation, none signed. Outlier Ventures co-development is a live thread; a dedicated OV deck exists. **Do not present as a partnership.** ⚠️ |
| **First clients** | Creators, not enterprises. The wedge cohort is culture/scandal commentators with existing audience who currently monetise via ad share and want market economics. |
| **MOUs signed** | Conversations and LOIs sent in prior distribution/co-branding threads; **none countersigned**. Do not claim executed MOUs. ⚠️ |
| **Revenue model** | 1.88% rake on all market volume. Of that: 40% creator (creator-made markets), 28.8% community pool, 28.8% MAD Shield recovery reserve. Secondary: NFT card primary sales on an 8-tier Dutch-auction curve, staking, and yield on Shield float. |
| **Traction** | 15,000 pre-registered. **This is a waitlist.** Not users, not revenue, not retention, not PMF. |

**Team sentence.**
> Nick J. McLeod — three-time founder, 14 years operating in startups and Web3, one exit; solo-built
> MAD Gambit's mathematical engine, smart contracts, and product surface without outside capital.

> **Read this honestly against Alps's examples.** They cited "Ex-AI at Citadel", "Founding Engineer
> at [Top L1]", "Ex-JP Morgan". That is a pedigree filter, and this profile does not clear it. The
> counter-credential is *shipped artefact*: a 1,327-line production math engine, six Solidity
> contracts with Foundry tests, twenty API routes, and a working product. Lead with the repo, not
> the résumé — and name the gap before they do: **the single biggest risk in this company is that
> it is one person, and the bridge exists to fix exactly that.**

---

# PART 4 — Thesis alignment
*(Alps point 4: they invest only in institution-grade infrastructure.)*

> ⚠️ **Honest assessment: Alps Capital is a poor thesis fit as currently positioned, and pitching
> them the consumer product will fail.** MAD Gambit is a consumer entertainment platform. Alps
> stated they invest exclusively in institution-grade infrastructure. Sending the consumer deck
> gets a no.

There is one legitimate infrastructure framing — use it only if it is true to what you'll build,
because they will diligence it:

> **The infrastructure claim:** the settlement and market-making layer underneath conviction
> markets — continuous DL-LMSR pricing for non-binary, non-resolving events, GARCH-priced risk, and
> a fee-routing and loss-mitigation primitive — is reusable infrastructure. Any platform that wants
> to price subjective cultural claims needs it, and none exists.

**The "why institutions die without it" sentence** — Alps asked for exactly one:
> As prediction markets absorb entertainment and social volume, every operator will need to price
> claims that never formally resolve; without a continuous conviction-pricing and loss-mitigation
> layer, they can only offer binary contracts and will cede the fastest-growing category to
> whoever builds it first.

**Recommendation:** deprioritise Alps for the consumer raise. Better-fit targets per Boardy —
operator-heavy builder investors, specialised angels, and venture studios in the **US, UK, Germany,
Dubai**, who can pressure-test market design. Avoid Canadian investors/studios for perpetuals work
on regulatory grounds.

---

# PART 5 — The ghost deck
*(McKinsey prompt 1: 10 slides, insight-led headlines — each states an insight, not a topic. No
slide takes more than 15 seconds to understand.)*

| # | Insight headline | Visual | Data required | Status |
|---|---|---|---|---|
| 1 | Prediction markets resolve facts; nobody prices culture | Two-axis map: truth machines vs liquidity machines, empty quadrant | Category positioning | Ready |
| 2 | "Peer-to-peer" incumbents are house-versus-player with a regulatory wrapper | Flow diagram: user → market maker → risk book | Kalshi/Susquehanna structure (see Part 6) | Ready |
| 3 | Creator-owned market economics is a different structure, not a better price | Fee-split waterfall: 1.88% → 40/28.8/28.8 | Code-verified split | **Live** |
| 4 | Conviction is continuous, so the market never has to close | DL-LMSR price curve under order flow | Engine output | **Live** |
| 5 | We are a family of specialised perpetuals, not one market type | 2×2 of Z-Liar · Gossip-Cop · Epiphanies · Progression | Taxonomy + code state | Mixed — label each |
| 6 | Loss is a designed state, which is why retention economics differ | Shield recovery dial 28.8% → 40% → 60% | Shield model + Monte Carlo params | **Needs params** |
| 7 | The engine is written; the settlement layer is not | Traceability matrix, colour-coded | This document's matrix | Ready |
| 8 | Y3 $139.6M base rests on volume, not on user-count optimism | Revenue bridge: volume × rake × mix | Re-run stream split ⚠️ | **Blocked** |
| 9 | The constraint is execution capacity, not invention | Milestone Gantt: bridge → contracts → audit → live markets | Milestone plan | Ready |
| 10 | Two asks, kept separate, both milestone-bound | $15–20K infra · $300–500K bridge | Use of proceeds | Ready |

> **Slide 8 is blocked and must not ship as-is.** The 51/31/12/6 stream split was derived from the
> retired $154.5M model. Re-run it against $139.6M before this slide is shown to anyone.

---

# PART 6 — MECE argument structure
*(McKinsey prompt 2: three mutually exclusive, collectively exhaustive pillars; two proof points
each; weak pillars flagged.)*

**Recommendation:** Fund the bridge.

### Pillar A — The category gap is structural, not competitive
- **A1.** Polymarket and Kalshi settle binary, resolvable questions. Cultural claims frequently
  never resolve — there is no contract shape for them in the incumbent stack.
- **A2.** Kalshi's own structure undermines its "peer-to-peer" positioning: professional market
  makers (Susquehanna) and Kalshi's trading arm supply liquidity and assume risk, which is
  economically identical to a sportsbook. The differentiation is CFTC-vs-state-gaming regulatory
  arbitrage, not market structure. *(Source: public teardown in the supplied attachments — cite as
  third-party analysis, not our claim.)*
- **Strength: strong.** This is the sharpest, most defensible argument available.

### Pillar B — The economic layer is built and enforced in code
- **B1.** `gambit-game-math.ts` (1,327 lines): `PLATFORM` fee constants, `splitFee()`, DL-LMSR
  cost/price, `garchUpdate()`, Shield premium/recovery dial, Dutch-auction pricing.
- **B2.** Six Solidity contracts including `MADShieldVault.sol` with Foundry tests; SIWE auth live
  on chain 42170.
- **Strength: strong**, and it is the credential that substitutes for pedigree.

### Pillar C — The remaining risk is execution capacity, and it is purchasable
- **C1.** Settlement cascade, deployed market contracts, and independent audit are the only items
  between here and live revenue — all scoped, none invented.
- **C2.** $300–500K buys an accountable technical partner against explicit milestones, with equity
  contingent on delivery.
- ⚠️ **Strength: weakest pillar — flag it.** It rests on a hiring outcome that has not happened,
  in a solo-founder company. Do not oversell C. Present it as the risk the round is priced for.

---

# PART 7 — So-what test
*(McKinsey prompt 3. Any finding whose so-what doesn't change the recommendation is deleted.)*

| Finding | So-what | Keep? |
|---|---|---|
| DL-LMSR + GARCH live in code | De-risks the hardest technical claim; the raise funds deployment, not invention | **Keep** |
| Kalshi's liquidity is market-maker supplied | Reframes incumbents as structurally similar to sportsbooks, making creator-owned economics a real differentiator | **Keep** |
| Fee split enforced in `splitFee()` | The creator-economics promise is verifiable in minutes, not taken on trust | **Keep** |
| Solo founder, no committed capital | Sets the round's central risk and justifies milestone-based structure | **Keep** |
| 15,000 waitlist | Changes nothing about the recommendation — it is not demand evidence | **Cut from the argument**; mention only if asked |
| 992-card deck, 7 rarities, lunar-phase multipliers | Product texture; does not move an investment decision | **Cut** |
| Y3 $139.6M projection | Currently unreconciled with its own stream split — cannot support a recommendation until re-run | **Cut until fixed** |
| "4.8x industry retention" | Unsourced; would be deleted in diligence and damages credibility | **Cut** |

---

# PART 8 — Stakeholder objection map
*(McKinsey prompt 4: predict each role's top concern; pre-empt with data, not opinion.)*

| Role | Their top concern | Pre-emptive response |
|---|---|---|
| **Technical / infra investor** | "Is the engine real or a demo skin?" | The math engine is 1,327 lines of production TypeScript with the fee split, DL-LMSR and GARCH implemented; `MADShieldVault.sol` ships with Foundry tests. We publish a traceability matrix classifying every feature as implemented, demonstrated, validated or conceptual — and we mark our own gaps, including that settlement is not built. |
| **Consumer / gaming investor** | "Retention is unproven and the waitlist is vanity." | Correct, and we don't present it otherwise. 15,000 is a waitlist. The retention thesis is a design hypothesis expressed in the Shield economics, and the bridge exists to test it on live markets — that test is the milestone, not the claim. |
| **Regulatory-sensitive LP** | "Is this unlicensed gambling or an unregistered security?" | Entity is a New Mexico LLC filed Q1 2026. We deliberately avoid Canada for perpetuals work. We make no legal conclusions, we do not call MAD Shield insurance, and securities and gaming analysis in target jurisdictions is a funded line item in the bridge — not an assumption. |
| **Studio / operator** | "One person can't ship this." | Agreed — that is the round's central risk, and the bridge is scoped precisely to fix it: an accountable technical partner with equity vesting against explicit milestones, testing and security deliverables, not a retainer. |
| **Token-focused investor** | "Is this a token play with a product attached?" | $MADx is 888,888,888 fixed supply with a 10% seed allocation, but the revenue model is rake on volume, not token appreciation. We separate revenue, reserve yield, rewards, recovery and token price in all materials — deliberately, because conflating them is how these companies lose diligence. |

---

# PART 9 — One-slide compression
*(McKinsey prompt 6: the final test. One action headline, one chart, three bullets.)*

> ## The engine is built. The settlement layer isn't. $300–500K closes the gap.
>
> **[Chart: horizontal traceability bar — Live · Demo · Not-yet, across engine, contracts,
> settlement, audit]**
>
> - **Live in code:** DL-LMSR pricing, GARCH(1,1) volatility, 1.88% rake splitting 40% creator /
>   28.8% community / 28.8% Shield, SIWE auth, Shield vault with tests.
> - **The gap:** deployed market contracts, settlement cascade, independent audit — all scoped,
>   none invented.
> - **The ask:** $15–20K infrastructure now; $300–500K bridge against milestones, with an
>   accountable technical partner taking equity on delivery.

**What to cut if it doesn't fit:** the card game, the token, the lore, and the projections. The
argument survives on category gap + built engine + purchasable execution risk. Everything else is
texture.

---

# PART 10 — Corrections applied to live investor materials

Found by auditing the supplied screenshots against the repo. All investor-facing.

| Error | Where | Action |
|---|---|---|
| "WYOMING COMPLIANCE ASSURED · L.C. 2026" | `ov-pitch-deck.html` header badge | **Fixed** → "NEW MEXICO LLC · FILED Q1 2026". Wrong jurisdiction *and* an unverified compliance claim. |
| "WYOMING INCORPORATION FILE SUMMARY" | `ov-pitch-deck.html` data panel | **Fixed** → "NEW MEXICO INCORPORATION FILE SUMMARY". |
| "1.888% RATE" universal fee capture schedule, sub-split burn 0.888% / APY stakers 0.500% / MAD Protect 0.500% | Cultural Card Asset Ledger screen — **not present in this repo**; lives in another deployed build (`datahouse_mathsengine` or `o-v_deck26`) | ⚠️ **Unfixed — needs locating.** Two incompatible fee models are live at once: 1.888% split three ways, versus canonical 1.88% split 40/28.8/28.8. Boardy: *"Rake: 1.88%, not 1.888%."* |
| "TOTAL USERS (K) 24" on split-flap chrono | Live MPP home | ⚠️ Placeholder rendering as a real metric, and it contradicts the 15,000 waitlist. Label as sample data or remove before demos. |
| "MAD GAMBIT L.C." vs "MAD GAMBIT LLC" | OV deck | Standardise on **LLC**. |
| Y3 stream split 51/31/12/6 | Data House | ⚠️ Derived from retired $154.5M model; re-run against $139.6M. |

---

## Pre-send checklist

- [ ] Round-details zeroes stated plainly, not buried
- [ ] Alps deprioritised for the consumer deck, or repositioned to the infrastructure layer
- [ ] Slide 8 (projections) pulled until the stream split is re-run
- [ ] 1.888% fee schedule located and reconciled to 1.88%
- [ ] "24K users" placeholder removed from any screen shown live
- [ ] Every claim traced to `FEATURE_TRACEABILITY_MATRIX.md`
- [ ] No "insurance", "regulatory-safe", "no counterparty risk", "industry's first"
