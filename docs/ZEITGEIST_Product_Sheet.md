# MΛDHAT'S GAMBIT — ZEITGEIST

*Perpetual Trend Succession — the slate is reseeded every lunar year, the conviction never settles*

`Product Sheet + Technical Development Scope  |  Maths from MASTER_MATHS_AND_ALGORITHMS.md  |  v0.1  |  August 2026`

---

## 1. Product Overview

Zeitgeist is a perpetual with a MUTABLE STATE SPACE. Each lunar year the top two-to-three media / social-media / influencer trends become the tradeable slate. Each trend is then scored on the five-persona axis — the personas are the lens, not the outcome set.

The question is never "will this trend happen". It is: what KIND of thing is this trend? Is 2026's anti-AI authenticity revolt genuine virtue, or the most profitable Saint performance of the year?

And when the year turns, positions do not settle. They transmigrate into the new slate along a measured succession matrix. Your conviction outlives the trend that started it.

Tagline: "The slate changes. Your conviction doesn't."

Core Loop: DETECT → NOMINATE → AUCTION SLOTS → SCORE ON FIVE FACES → CONVICT → ROLL LEGS → THE TURNING → TRANSMIGRATE → CONTINUE

## 2. The 2026 Slate (researched — sources at §14)

| Slot | Trend | The persona question |
|---|---|---|
| I | THE AUTHENTICITY REVOLT — anti-AI positioning as consumer strategy | SAINT or PROSTITUTE? |
| II | SYNTHETIC INFLUENCE — virtual and faceless creators scaling anyway | NARCISSIST or WHITE RICE? |
| III | THE COMMERCE FLOOR — social commerce and the creator middle class | PROSTITUTE, unambiguously — the only live question is at what price |

### 2.1 Slot I — THE AUTHENTICITY REVOLT

- Only 26% of consumers prefer generative-AI creator content — down from 60% in 2023
- Dove's pledge not to use AI-generated models won the Media Grand Prix at Cannes Lions 2025; Aerie's "No AI-generated bodies or people. Ever." drew its most engaged Instagram response in a year
- New York's synthetic-performer law takes effect June 2026, creating penalties for deceptive use of AI-generated performers in advertising
- 91% of consumers expect transparency about AI use in marketing; brands are deliberately reintroducing imperfection — unpolished audio, natural pacing — as a humanity signal
- The bet: is this a permanent Saint reading, or does the permanent component resolve to Prostitute once anti-AI positioning is fully priced as a marketing tactic?

### 2.2 Slot II — SYNTHETIC INFLUENCE

- Virtual influencers compounding at 41.7% CAGR, moving from experimental niche to a primary pillar of brand strategy
- AI influencers earned roughly $6B last year; the global influencer market has passed $250B
- AI has produced a wave of faceless creators and fully automated accounts, expanding the measured size of the creator economy
- The bet — and the reason this slot exists: Slot I and Slot II are growing SIMULTANEOUSLY. The contradiction is the trade. A market that can hold both is pricing something real about the year

### 2.3 Slot III — THE COMMERCE FLOOR

- TikTok Shop: $66B global GMV in 2025, projected $112.2B in 2026; US sales +108% YoY to $15.82B
- 1.8M active US merchant partners; $47.3B GMV across the first three quarters of 2026; creator earners +146% YoY with 16,000+ creators at six-figure sales
- But the floor is the story: 48.7% of creators earn under $10K and 76% of TikTok posts get under 1,000 views. Mid-tier creators (100K–500K) hold 4–8% engagement against 1–2% for mega-creators
- The bet: does the middle class consolidate, or does the floor fall out? Persona reading is fixed; the magnitude is not

## 3. Canonical Constants (unchanged — gambit-game-math.ts#PLATFORM)

| Constant | Value | Code home |
|---|---|---|
| Platform fee | 1.88% (FEE_BPS 188) | PLATFORM.FEE_BPS |
| Creator ladder | 28.8% User · 40% MinorCreator · 60% CR8TR | CREATOR_LADDER |
| Community share | 28.8% (COMMUNITY_SHARE_BPS 2880) | PLATFORM.COMMUNITY_SHARE_BPS |
| Shield recovery | 28.8% std · 40% ceiling · 60% VIP | SHIELD_RECOVERY_PCT / _PREMIUM_PCT / _WHALE_PCT |
| Shield premium band | 2%–4% of stake · safety margin 0.35 | SHIELD_PREMIUM_MIN/MAX · SHIELD_SAFETY_MARGIN |
| Perp trigger gate | 0.60 | PLATFORM.PERP_TRIGGER_THRESHOLD |
| Vote power cap | min(√stake, 240) | PLATFORM.VOTE_POWER_CAP · votingPower |
| GARCH(1,1) | ω 0.0001 · α 0.05 · β 0.90 · σ∈[0.09,0.68] | garchUpdate · garchAmplification |
| Synodic month | 29.530588853 d | LUNAR_CYCLE_MS |
| Conviction epoch | 1979-12-08 | IMMACULATE_CONCEPTION_EPOCH_MS |
| $MADx supply / burn cap | 888,888,888 fixed · ≤4.9% per 30d | MADX_FIXED_SUPPLY · FURNACE_BURN_CAP |

## 4. The Persona Lens

| Face | Codex definition (canon, verbatim) |
|---|---|
| THE SAINT | Performed virtue. Claims the moral high ground and invites the halo — sincerity neither assumed nor denied. |
| WHITE RICE | Flavourless by strategy. Offends no one, commits to nothing, survives everything. |
| THE MEGALOMANIAC | Empire over everything. Scale, dominion, and the certainty that the rules were priced for other people. Aimed at office-holders, boardrooms and the structurally entitled — the face that expects exemption. |
| THE NARCISSIST | The mirror is the audience. Cannot act unless the room is watching. |
| THE PROSTITUTE | The Sell-Out archetype: monetises access, principle, platform or endorsement to the highest bidder. Never a claim about anyone's sexual conduct. |

The Codex is not flavour text — it is a compliance primitive. The definition renders adjacent to the label on every surface where conviction can be staked, and ships on-chain with the market criteria, so the product is unambiguously an archetype-perception market and never a factual allegation. Every face carries codexName and broadcastName; PERSONA_DISPLAY_MODE="broadcast" swaps THE PROSTITUTE → THE SELLOUT and WHITE RICE → THE THERMOSTAT for app stores, ad networks and restrictive jurisdictions without forking the product. THE THERMOSTAT is the better name on the merits, not merely the safer one: it names the measured behaviour — an instrument that takes the room's temperature and matches it, which is exactly the near-zero sentiment intensity and non-answer act-class that define the face.

Applied to trends rather than people, the Codex reads as cultural criticism rather than character assessment — which is exactly why Zeitgeist is the safest surface in the family (§10).

## 5. THE TURNING — the core new maths

A perpetual whose outcome set changes cannot simply settle and reopen; that would be a series of annual markets wearing a perpetual's clothes. The Turning is the mechanism that makes a mutable state space mathematically coherent.

### 5.1 The Succession Matrix S

S[i][j] is the share of retiring trend i's conviction that inherits into new trend j. It is MEASURED, not decreed:

- LINEAGE (measured) — heat-score.ts#computeHeatForPool already implements cross-source clustering: two headlines are "the same story" when they share ≥ 2 significant tokens. Run it between the retiring trend's corpus and each candidate's corpus to get an overlap score. The trend engine already exists; it was simply built for headline ranking
- CROWD (voted) — quadratic: #votingPower (√stake, capped 240) aggregated by #quadraticMatch, so many small holders outweigh one whale
- BLEND — S = w_m·L_measured + w_v·V_quadratic, then ROW-NORMALISED so Σ_j S[i][j] = 1. FOUNDER DECISION (Aug 2026): CROWD-LED, w_m = 0.3 / w_v = 0.7. The crowd's read of lineage outranks the measured corpus overlap
- Why not w_v = 1.0. Measured lineage is retained at 0.3 as a manipulation floor: the Turning is the single highest-incentive moment in the product, and a purely voted succession lets whoever organises best redirect the entire inherited conviction pool into a trend they are positioned in. Quadratic voting (√stake, capped 240) makes that expensive but not impossible; the 0.3 corpus term makes it also have to be PLAUSIBLE. Vote decides where conviction goes; measurement keeps it inside the realm of trends that actually share a story

That normalisation is the whole invariant: CONVICTION IS CONSERVED ACROSS A TURNING. Nothing is destroyed at a reseed, nothing is minted from nothing, and no position is ever force-settled. Your stake reincarnates along measured lineage.

### 5.2 Cadence — the Turning rides the lunar year

- Leg = 2 synodic months = 59.061 days
- THE TURNING = 6 legs = 354.37 days = exactly one lunar year (12 × 29.530588853)
- So the reseed drifts roughly 11 days earlier against the solar calendar each year. That is a feature: the slate turns on its own clock, not the ad industry's, and it is uncopyable without the 1979-12-08 epoch

### 5.3 THE VINTAGE

- Every position carries the year it entered. A 2026 vintage still live in 2031 has survived five Turnings
- C(t) = C_max·(1 − e^(−αt)) compounds across the whole span — #calculateConviction — and #streakReward with VRS_TRIGGERS [5,8,13,21,34] pays the Fibonacci ladder on consecutive Turnings survived
- Vintage is provenance, which is why it plugs directly into the Five Faces tradeable stack as a collectible attribute on the position and the portrait

## 6. The Maths Array

Zeitgeist deliberately draws on a WIDE span of the canonical library rather than one primitive. Every entry earns its place.

| Function | Role in Zeitgeist |
|---|---|
| heat-score.ts#computeHeatForPool | Trend detection AND the lineage measurement for S. Weights: crossSource .30 · engagementEst .25 · virality .15 · velocity .15 · satire .10 · authority .05 |
| mpp-math.ts#calculateConviction | Trend adoption — saturating growth C(t) = C_max(1 − e^(−αt)) |
| #stochasticDecay | Trend burnout — e^(−(α+½σ²)t + σW_t), geometric Brownian. A trend's life is the race between these two curves |
| #calculateSoftmax(speeds, τ) | Liquidity allocation across the slate — the first use that matches the function's own stated purpose |
| #getAuctionPrice + SCANDAL_PACK_TIERS | Slot auction at the Turning: candidates bid Dutch for the seats, $8.88 floor to $296 cap |
| #calculateVictoryProbability / #mmrDelta (K=32) | Candidate trends fight for slots; incumbents defend. mmrDelta is already asymmetric — a win pays K(1.1 − pWin), a loss is shielded by stage — so incumbency is mathematically advantaged |
| #calculateTournamentScores → structuralStrain | Trends wear out: 4–10% strain on a win, 11–22% on a loss, 0.6× reward cut above 50% wear. An over-traded trend degrades; a rested one recovers |
| bayesian-conviction.ts#propagateTree (depth ≤ 64) | The succession tree — 64 legs of lineage. Backward induction values a position by every future it could inherit into |
| #voiEstimate | Is opening a fourth slot this year worth the information it would buy? |
| #quadraticMatch / #votingPower (cap 240) | Community nominates next year's slate; whale-resistant by construction |
| #calculateEigenTrustScore | Weights nominators by whether their past nominations proved out |
| #egarchLogVar (γ = −0.08) | Backlash asymmetry — bad news kills a trend faster than good news builds it. Directly observable in the 60% → 26% collapse in AI-content preference |
| #getLunarPhaseMultiplier / #getLunarIllumination | Leg cadence, settlement modulation, and the Turning on the lunar year |
| #calculateMppPrice / #calculateSlippageCushion | Bonding curve and the flash-loan guard across the Turning window, when manipulation incentive peaks |

## 7. Market Structure

- Bonding, not LMSR: P = P_floor · (1 + slope·ln(1+C)) · M^2.23 · S(t) — mpp-math.ts#calculateMppPrice
- S(t) = max(0, 1 − elasticity·t/t_max) — #calculateSlippageCushion, a flash-loan and governance-window guard the LMSR families do not have
- Conviction accrues C(t) = C_max·(1 − e^(−αt)) — #calculateConviction, with α set per face (Perp 1) or per trend (Perp 2)
- Deliberately NOT DL-LMSR. Gossip-Cop and Perpetual Epiphanies are both LMSR families; changing the market maker is what makes this a structurally different instrument rather than a re-themed one
- Each slot is a five-face simplex on that trend, so Zeitgeist inherits the Five Faces decomposition where useful — a trend also has a permanent component and a phase
- Slot count is 2 or 3, decided annually by #voiEstimate against the nomination pool — VOI-driven from LAUNCH per the Aug 2026 decision, not deferred to Phase 4. Three when the year is genuinely contested; two when one or two trends dominate and a third slot would buy no information
- Position cap per slot: δ = π × Multiplier × √ConvictionStake — #calculateDeltaLimit
- The Turning window is the highest-manipulation-incentive moment in the product; the slippage cushion tightens across it and slot-auction bids are commit-reveal

## 8. Example markets

- "Is THE AUTHENTICITY REVOLT a permanent Saint, or a Prostitute wearing a halo?" — the flagship 2026 market
- "Does SYNTHETIC INFLUENCE score White Rice or Narcissist as its permanent face?" — a genuinely open read
- "Slot III magnitude: does the creator middle class consolidate or does the floor fall out?"
- "Which 2026 slot survives the 2027 Turning with the largest inherited conviction?" — a direct bet on S
- "Will the 2027 slate contain a trend with no 2026 lineage at all?" — a bet on discontinuity itself
- VINTAGE INDEX — long the 2026 cohort against all later vintages

## 9. Interlock with Five Faces

- Zeitgeist vintages are provenance objects that the Five Faces portrait and attestation layers record
- A trend that scores high-permanent on a face in Zeitgeist raises that face's prior in Five Faces
- A face with high measured persistence in Five Faces raises its weight when scoring next year's slate
- One supplies evidence, the other supplies legitimacy. They are a pair, not two products sharing a brand

## 10. Compliance — and the compliance dividend

The subjects here are TRENDS, not people. "Is the Authenticity Revolt a Saint or a Prostitute?" is commentary on a market phenomenon, not a claim about any person. That gives Zeitgeist a near-zero defamation surface and makes it the safest thing in the family.

FOUNDER DECISION (Aug 2026): Five Faces ships FIRST regardless, with named public figures in scope. Zeitgeist therefore no longer serves as the Codex's low-risk proving ground — it follows a product that will already have established the Codex on named people. The practical consequence for this sheet: Zeitgeist inherits a Codex whose public reception is already set, so its slate copy and persona scoring should be reviewed against whatever the Five Faces launch actually produces rather than written in advance of it.

- Codex renders at bet time, on-chain with criteria, same as Five Faces
- Named individuals are never the subject of a slot. Where a trend is strongly associated with a person or brand, the market is on the TREND and the criteria must say so explicitly
- Trend nominations are moderated against the same subject gate: no protected-class mapping, no minors, no real-world illegal outcome prediction
- Sourcing transparency: every slot publishes the corpus and the measured figures behind it, and every figure carries its source (§13). A slate nobody can audit is a slate nobody should trade
- Shield is loss mitigation only; 30-day minimum maturity on every leg; entertainment conviction and satire throughout

## 11. Technical Development Scope

### 11.1 Smart contracts

- MADZeitgeistSlate.sol — slot registry, per-slot simplex, annual slate lifecycle
- MADTurning.sol — the succession matrix, row-normalised transmigration, conviction-conservation invariant, vintage stamping
- MADSlotAuction.sol — Dutch auction over slot seats, commit-reveal bids across the Turning window
- Reuse: MADMarketFactory, MADStaking, MADShieldVault, RiskOracle, MADOptimisticOracle, and the Five Faces position/portrait/attestation contracts
- Foundry fuzz + invariants: S rows sum to 1 (±dust) · total conviction conserved across a Turning · no position force-settled · vintage monotone · slot count ∈ {2,3} · auction cannot clear below floor

### 11.2 Backend

- NEW trend-slate.ts — slate lifecycle, nomination pool, slot auction, vintage ledger
- NEW succession.ts — S construction from measured lineage + quadratic vote, row normalisation, transmigration execution
- NEW trend-lifecycle.ts — adoption (#calculateConviction) against burnout (#stochasticDecay), with the EGARCH backlash term
- heat-score.ts — reused as-is for detection and lineage; no changes needed, which is the point
- market-classifier.ts — add type="zeitgeist" with slot-aware titles and resolution copy
- APIs: POST /api/v1/zeitgeist/{slate,nominate,auction,score,convict,roll,turning,succession,vintage}

### 11.3 Frontend / app

- THE ALMANAC — the hero instrument. Current slate with five-face scores, the live succession matrix as a flow ribbon, and every past slate with its lineage edges drawn forward through time
- Turning countdown in legs and lunations, with the lunar-year drift shown honestly
- Vintage badge on every position; vintage index chart
- Slot auction room — Dutch clock, commit-reveal state, nomination pool with EigenTrust-weighted nominators
- Per-slot corpus viewer: the actual headlines and figures behind a trend, with sources

### 11.4 Phased build

- Phase 1 — 2026 slate, five-face scoring, parimutuel markets, and #voiEstimate driving the 2-or-3 slot count from the start. Ship the Almanac and the slate
- Phase 2 — MPP bonding, lunar legs, Shield, trend-lifecycle curves as readouts
- Phase 3 — THE TURNING: succession matrix, transmigration, vintage ledger. This is the phase that makes it a perpetual
- Phase 4 — open nominations, slot auction, EigenTrust weighting. Until this phase lands the slate longlist is curated (§13.1), which must be labelled as such in-product
- Phase 5 — Five Faces interlock: shared tradeable stack, vintage as a portrait attribute, cross-product priors

## 12. Success Metrics

- Slate survives its first Turning with ≥ 70% of conviction transmigrated rather than withdrawn — the single metric that proves the mechanism
- Zeitgeist volume ≥ 15% of platform by Y2
- Average hold spans at least one Turning for ≥ 35% of positions
- Nomination participation ≥ 25% of active wallets per Turning
- Succession matrix agreement: measured lineage and quadratic vote agree on the dominant edge in ≥ 70% of rows. Persistent disagreement means w_m/w_v needs retuning
- Slot auction clears above floor in every seat; no seat goes unbid
- Zero defamation complaints — should be structurally trivial here, since the subjects are trends. If Zeitgeist ever generates one, the slate copy has drifted from commenting on a phenomenon to accusing a person, and that is the signal to pull the slot

## 13. Decision Log — founder sign-off, August 2026

| Decision | Ruling | Consequence |
|---|---|---|
| Ship order | FIVE FACES first | Zeitgeist no longer the Codex's proving ground — §10 |
| Succession blend w_m / w_v | CROWD-LED, 0.3 / 0.7 | Vote decides where conviction goes; the 0.3 corpus term keeps it plausible — §5.1 |
| Slot count policy | VOI-driven 2-or-3 from LAUNCH | Moved out of Phase 4 into Phase 1 — §7, §11.4 |
| Turning cadence | Hard-coded to the lunar year | 354.367d, not governance-adjustable. An adjustable reseed date is an attack surface |
| Persona axis | All five codex names unchanged | Shared with Five Faces; White Rice broadcast name is THE THERMOSTAT |
| Chain | Arbitrum Nova (42170) + Arbitrum One (42161); HyperLiquid secondary | Slate and vintage records follow the Five Faces §6.7 topology — canonical on One |
| Comeback vintaging | Comebacks ALLOWED, issued a NEW vintage | Restoring the old vintage would let a holder buy provenance — see below |
| Year-1 nomination curation | Curated longlist (~8) with holder vote selecting the slots | Centralised on the menu, decentralised on the pick |

### 13.1 Notes on the two governance rulings

- WHY NEW VINTAGES ON A COMEBACK — vintage certifies one thing: that you were actually there. Restoring a retired trend's original vintage would let someone acquire a dormant position cheaply, wait for the re-slate, and inherit provenance they never earned. A new vintage keeps the certificate honest; the comeback is still tradeable, it simply does not backdate
- WHY A CURATED LONGLIST IN YEAR 1 — #calculateEigenTrustScore weights nominators by whether their past nominations proved out, so at the FIRST Turning every nominator carries identical zero-information weight. Open nomination at that moment is the single most manipulable event in the product's life: build a position, organise the vote, capture the slate. A vetted ~8-candidate menu bounds manipulation to trends that already cleared review, while the holder vote keeps slot selection genuinely open — and it composes with the crowd-led succession blend (§5.1)
- LABELLING IS PART OF THE RULING — in-product copy reads plainly: "Year 1 longlist curated by MAD Gambit; slot selection by holder vote. Open nominations from the 2027 Turning." A curated slate that presents itself as algorithmic is a credibility problem the first time somebody disagrees with it
- SUNSET — open nominations with EigenTrust weighting land at Phase 4 (§11.4), by which point the trust graph has a Turning's worth of resolved nominations to score against

## 14. Sources for the 2026 Slate

- Influencer Marketing Factory — Creator Economy Report 2026: theinfluencermarketingfactory.com/creator-economy-report/
- Digiday — "After an oversaturation of AI-generated content, creators' authenticity and 'messiness' are in high demand": digiday.com/media/
- Playbella — 2026 Global Report on Synthetic Influence: playbella.org/blog/2026-ai-influencer-landscape-report
- eMarketer — FAQ on social commerce: how creators and platforms power shopping in 2026: emarketer.com
- TikTok Shop Statistics 2026 (GMV, sellers, category benchmarks): branvas.com/blogs/news/tiktok-shop-statistics
- Sprout Social — Influencer Marketing Trends for 2026: sproutsocial.com/insights/influencer-marketing-trends/
- CreatorIQ — Influencer Marketing Trends 2026: creatoriq.com/blog/influencer-marketing-trends-2026

Every figure quoted in §2 is traceable to the list above. The slate is rebuilt from fresh sources at each Turning, and the corpus ships with the slot.
