# MΛDHAT'S GAMBIT — THE FIVE FACES

*Custom Persona Perpetuals — Saint · White Rice · Megalomaniac · Narcissist · Prostitute*

`Concept Sheet + Technical Development Scope  |  Maths from MASTER_MATHS_AND_ALGORITHMS.md  |  v0.1 CONCEPT  |  August 2026`

---

## 1. Product Overview

The Five Faces is a semi-continuous custom perpetual family: a five-outcome persona simplex on a single subject, priced continuously by DL-LMSR, never terminally resolved, and rolled in 45–90 day legs so it sits inside the progression/saga framework rather than escaping it. Where Gossip-Cop asks "is the storyline still alive?" and Perpetual Epiphanies asks "is the pattern still true?", the Five Faces asks the only question the crowd actually argues about: WHO IS THIS PERSON, REALLY?

Bettors do not pick YES/NO. They allocate conviction across five mutually-exclusive personas that always sum to 1. The price vector IS the verdict — a live, tradeable portrait that moves every time the subject opens their mouth.

Tagline: "Five faces. One soul. Pick the mask — or wear it."

Core Loop: SUBJECT SIGNAL → CODEX CLASSIFY → OPEN SIMPLEX → ALLOCATE CONVICTION → UTTERANCE ORACLE → SHIELD → SLIP/CROWN → ROLL LEG → CONTINUE

Classifier: new primary type="faces" in market-classifier.ts — gated on perpEligible && horizonDays >= 365 && personaEligible, evaluated AHEAD of gossipcop so a celebrity subject graduates to a persona simplex instead of a binary gossip perp. All three concepts below share one engine (§4) and differ only in WHO is being masked.

## 2. The Mask Codex (locked definitions — rendered at bet time)

The Codex is not flavour text. It is a compliance primitive: the definition renders adjacent to the label on every surface where conviction can be staked, so the product is unambiguously an archetype-perception market and never a factual allegation. Codex text is on-chain with the market criteria.

| Face | Codex definition (canon, verbatim) | Primary signal drivers |
|---|---|---|
| THE SAINT | Performed virtue. Claims the moral high ground and invites the halo — sincerity not assumed, not denied. | Low LieScore · high corroboration · compassion/joy lexicon · apology & charity act-classes |
| WHITE RICE | Flavourless by strategy. Offends no one, commits to nothing, survives everything. | Near-zero sentiment.intensity · low scandalVelocity · non-answer act-class · low narrative variance |
| THE MEGALOMANIAC | Empire over everything. Scale, dominion, and the conviction that only they can fix it. | Grandiosity lexicon · anger 1.4 · dominion/scale act-class · concentration of claim |
| THE NARCISSIST | The mirror is the audience. Cannot act unless the room is watching. | Self-reference density · viralityIndex seeking · attention-recharge events · spectacle act-class |
| THE PROSTITUTE | The Sell-Out archetype: monetises access, principle, platform or endorsement to the highest bidder. Never a claim about anyone's sexual conduct. | Monetisation & sponsor-pivot act-class · position reversal for consideration · fee-flow capture |

Display-mode toggle: every face carries codexName and broadcastName. PERSONA_DISPLAY_MODE="codex" ships the names above; PERSONA_DISPLAY_MODE="broadcast" swaps THE PROSTITUTE → THE SELLOUT and WHITE RICE → THE BEIGE for app stores, ad networks and partner surfaces. Codex remains canon in the contract and the Codex popover. One field, no fork.

## 3. Canonical Constants (unchanged — gambit-game-math.ts#PLATFORM)

| Constant | Value | Code home |
|---|---|---|
| Platform fee | 1.88% (FEE_BPS 188) | PLATFORM.FEE_BPS |
| Creator ladder | 28.8% User · 40% MinorCreator · 60% CR8TR | CREATOR_LADDER |
| Community share | 28.8% (COMMUNITY_SHARE_BPS 2880) | PLATFORM.COMMUNITY_SHARE_BPS |
| Shield recovery | 28.8% std · 40% ceiling · 60% VIP | SHIELD_RECOVERY_PCT / _PREMIUM_PCT / _WHALE_PCT |
| Shield premium band | 2%–4% of stake · margin 0.35 | SHIELD_PREMIUM_MIN/MAX · SHIELD_SAFETY_MARGIN |
| LMSR liquidity b | 1,200 (volume-scaled) | PLATFORM.LMSR_DEFAULT_B · calculateVolumeScalingAlpha |
| Perp trigger gate | 0.60 | PLATFORM.PERP_TRIGGER_THRESHOLD |
| Vote power cap | min(√stake, 240) | PLATFORM.VOTE_POWER_CAP · votingPower |
| GARCH(1,1) | ω 0.0001 · α 0.05 · β 0.90 · σ∈[0.09,0.68] | garchUpdate · garchAmplification |
| $MADx supply / burn cap | 888,888,888 fixed · ≤4.9%/30d | MADX_FIXED_SUPPLY · FURNACE_BURN_CAP |

Nothing in this family changes a canonical constant. The Five Faces is additive: a new market SHAPE (n=5 simplex) and a new ORACLE SOURCE (speech acts), running entirely on the locked maths.

## 4. Shared Engine — The Persona Simplex

### 4.1 Five-outcome DL-LMSR

- Cost: C(q) = b · ln Σ(i=1..5) e^(q_i/b) — #calculateDLLMSRCost, extended from binary to n=5
- Price: P(i) = e^(q_i/b) / Σ(j) e^(q_j/b) — #calculateDLLMSRPrice; the five prices ARE the persona portrait, Σp ≈ 1 by construction
- Liquidity: b = LMSR_DEFAULT_B (1,200) × calculateVolumeScalingAlpha(volume) — deep books flatten the portrait, thin books let a single Slip swing it
- Perpetual invariant (new): no face may be priced below 0.02 or above 0.88. A persona market that fully resolves has stopped being perpetual — the floor/ceiling is what keeps every face permanently tradeable
- Kelly: half-Kelly default across a 5-way — #kellyFraction(pWin, netOdds, 0.5); netOdds derive from the face price, so the neglected faces naturally carry the fat odds
- δ-limit: δ = π × Multiplier × √ConvictionStake — #calculateDeltaLimit; applied PER FACE, not per market, so a whale cannot own the whole portrait

### 4.2 The Utterance Oracle — the z-Liar Meter as resolution source

This is the mechanism that makes the family perpetual by construction. Conventional markets resolve on EVENTS; the Five Faces resolves continuously on SPEECH ACTS. Every public statement by the subject is run through the Sentinel audit — zLiarMeter({narrativeVariance, sourceCredibility, corroboration}) → LieScore 0–100 → verdict band — and the verdict reallocates persona mass instead of settling anything. People never stop talking, so the market never stops resolving, and it never terminates.

- Bands (canonical, unchanged): STRAIGHT SHOOTER · MOSTLY CANDID · SLIPPERY · SERIAL EMBELLISHER · TOTAL FABRICATION — #ZLiarVerdict
- Belief update: the reallocation is a Bayesian log-odds step on the persona vector, not a price override — #sequentialLogOddsUpdate then #madconvHybridUpdate (M^0.85 · (1+β·bayes), β=0.4)
- Amplification: Δ is scaled by garch_amp = 1 + 0.8σ (#garchAmplification) and GDELT scandalVelocity (shame 1.8 · anger 1.4 · disgust 1.3 · fear 1.2 · sadness 1.0 · joy −0.5)
- SLIP_CAP: a single utterance may move at most 12% of total simplex mass — except during a declared Slip (§5.2), which unlocks to 34%. Without the cap one viral clip owns the book

### 4.3 Mask Transition Matrices

Two matrices compose the reallocation. T_speech is driven by the z-Liar verdict (what they SAID); T_act is driven by the sentiment + GDELT theme layer (what they DID). Δq = κ · [ w_s · (LieScore/100) · T_speech[verdict] + w_a · actWeight · T_act[class] ] · garch_amp, then clamped by SLIP_CAP and re-normalised onto the simplex. Coefficients below are the proposed v0 tuning set — proprietary, server-side, never in external materials.

| T_speech — z-Liar verdict | Saint | White Rice | Megalo | Narciss | Prostitute |
|---|---|---|---|---|---|
| STRAIGHT SHOOTER | +1.8 | +0.6 | −0.8 | −1.0 | −0.6 |
| MOSTLY CANDID | +0.9 | +1.0 | −0.3 | −0.4 | −0.2 |
| SLIPPERY | −0.4 | +0.2 | +0.5 | +0.6 | +0.9 |
| SERIAL EMBELLISHER | −1.2 | −0.6 | +1.2 | +1.4 | +0.8 |
| TOTAL FABRICATION | −1.8 | −1.0 | +1.8 | +1.6 | +1.2 |

| T_act — act class | Saint | White Rice | Megalo | Narciss | Prostitute |
|---|---|---|---|---|---|
| Apology / charity / restitution | +2.0 | +0.4 | −0.9 | −0.7 | −0.8 |
| Non-answer / silence / hedge | +0.2 | +2.0 | −0.4 | −0.9 | +0.1 |
| Dominion / scale / "only I can" | −0.9 | −1.1 | +2.0 | +0.7 | +0.3 |
| Spectacle / self-reference / feud | −0.7 | −1.2 | +0.8 | +2.0 | +0.5 |
| Monetisation / sponsor pivot / reversal | −1.0 | −0.5 | +0.6 | +0.6 | +2.0 |

Note the diagonal: every act class has a home face at +2.0, so the matrix is legible to a bettor without disclosing the tuning. The off-diagonals are where the money is.

### 4.4 Semi-continuous leg structure

- Legs run 45–90 days, never under 30 — the 30-day minimum-maturity compliance rule from MASTER_MATHS §12b, enforced in market config
- Conviction Saga auto-relaunches the next leg on close; the MADConv profile compounds across legs (§12b) — a face held for four consecutive legs is worth materially more than the same face bought yesterday
- Face Tenure: consecutive legs on the same face feed #rewardForTenure and #streakReward. Transmigrating resets tenure to zero — except for the Prostitute class (§7), which is exempt, because that is the entire point of the archetype
- Taxonomy fit: type="faces" is a perp for horizon purposes but a saga for structure — it inherits saga leg milestones and perp roll semantics simultaneously. This is what "semi-continuous" means in code, not in prose

## 5. CONCEPT 1 — THE FIVE FACES  ("The Mask Slips")

### 5.1 What it is

The outward-facing canonical member. One subject, five faces, one never-ending simplex. Bettors allocate conviction across the personas and hold through legs while the Utterance Oracle grinds. Subjects are not limited to people: brands, institutions, AI labs, frontier models, DAOs, sports franchises and entire industries all wear masks.

Tagline: "Bet the mask. Wait for the slip."

### 5.2 The two signature mechanics

- THE CROWNING — at each leg close the dominant face is crowned Face of the Season. Holders of the crowned face take the leg's payout share and their card evolves toward Golden Aura; the single largest position on the LOWEST-priced face eats an Affliction and a scandalMeter bump (#evolve, #shouldEnterClownState)
- THE MASK SLIPS — the product's peak-drama event. Fires when a single utterance scores TOTAL FABRICATION (≥80) while the crowd holds ≥60% on THE SAINT. On trigger: SLIP_CAP unlocks 12% → 34%, δ-limits open for a 24h window, GARCH amp runs hot, and every position taken during the window is tagged on-chain as slip-flow. It is the only moment in the family where the portrait can violently repaint — and everyone can see it coming, which is what makes it tradeable

### 5.3 Example markets (subject-class, not named — see §11)

- A sitting head of state's second-term persona — continuous five-face portrait
- A top-5 AI lab founder: does the crowd read Saint, Megalomaniac, or both at once?
- A celebrity wellness brand — Saint-to-Prostitute drift index across four legs
- A frontier model's own public persona (the model as subject — the first non-human simplex)
- A legacy media institution: White Rice permanence vs Prostitute capture
- A sports franchise ownership group during a relocation fight
- A crypto exchange in the twelve months after a regulatory settlement

### 5.4 Why it cannot be cloned

A competitor can copy a five-outcome LMSR in a week. They cannot copy the Utterance Oracle, because it requires an already-tuned narrative-credibility instrument (the z-Liar Meter), a scandal-velocity feed (GDELT + EMOTION_WEIGHTS), and a satire layer with a persona codex the crowd already trusts. The moat is the instrument, not the market.

## 6. CONCEPT 2 — THE MIRROR  ("The House Has a Face")

### 6.1 What it is

The reflexive inversion, and the sharpest thing in the family. The subject of the simplex is THE BETTOR BASE ITSELF. Which face is the MAD Gambit crowd wearing this epoch? Nobody is being judged from outside — the house turns the Codex on its own users, and then lets them bet on the answer.

Crucially, The Mirror does not resolve on opinion. It resolves on MEASURED PLATFORM BEHAVIOUR — the crowd's own on-chain and off-chain conduct, scored against the five faces. You are not betting what people think the crowd is; you are betting what the crowd will actually be caught doing.

Tagline: "Everyone's a judge. Somebody's got to judge the jury."

### 6.2 Measurement map — behaviour, not vibes

| Face | Measured from | Code home |
|---|---|---|
| THE SAINT | Calibration quality; forecasts that score well and don't pile on | brierScore · logScore · assignTrustScore |
| WHITE RICE | δ-limit under-utilisation, both-sides hedging, minimum-variance flow | calculateDeltaLimit utilisation · position variance |
| THE MEGALOMANIAC | Top-1 position concentration, δ-limit saturation, whale-tier flow | isWhaleShieldEligible · concentration ratio |
| THE NARCISSIST | Meme attachments per position, public-post ratio, virality-seeking entries | viralityIndex · calculateUserDopamineIndex · buzzScore |
| THE PROSTITUTE | Conviction flips for fee flow, creator-fee farming, sell-rate on positions | CREATOR_LADDER capture · splitFee flow · flip rate |

### 6.3 The signature mechanic — THE CONFESSIONAL

- At leg open, any bettor may publicly pre-declare their own face for the epoch. The declaration is on-chain and free
- At leg close the measurement runs. Declare SAINT and finish measured PROSTITUTE and you are UNMASKED: 48h Clown state (#shouldEnterClownState, CLOWN_DURATION_MS), scandalMeter bump, and no Golden Aura for the leg
- Declare accurately and you take a calibration bonus on the Fibonacci ladder (#getFibonacciReward, VRS_TRIGGERS [5,8,13,21,34]) plus an EigenTrust uplift that raises your weight as a judge in Concept 1
- Non-declarers are still measured; they simply cannot win the honesty bonus. Silence is itself a White Rice signal

### 6.4 Leg cadence

The Mirror runs the shortest legally-clean leg: 30-day Reckonings, auto-relaunching, so the crowd gets re-scored twelve times a year. EigenTrust gates whose behaviour counts toward the measurement — wash-flow and sybil wallets are weighted out (#assignTrustScore, #calculateEigenTrustScore), which is also the anti-manipulation story.

### 6.5 Why it matters strategically

- It is the family's ethical release valve: maximum controversy, near-zero defamation surface, because there is no external subject to defame
- It is a retention engine disguised as satire — your own behaviour is the underlying, so you cannot stop playing without changing the price
- It generates the platform's most valuable proprietary dataset: a labelled, longitudinal behavioural profile of the entire bettor base, which feeds risk, Shield pricing, and the creator ladder
- It is the only market in the industry where the house publishes its own users' moral portrait and lets them trade it. That is a headline, and headlines are the acquisition channel

## 7. CONCEPT 3 — THE VOW  ("Take the Mask")

### 7.1 What it is

The inward turn, and the most mechanically radical of the three. You do not bet on a face — you WEAR one, for the length of a leg, and the face REWRITES YOUR OWN MATHS. Persona becomes a risk class: a binding vow that repositions your δ-limit, your Kelly scale, your Shield eligibility, your fee flow and your card path simultaneously.

No prediction market has a class system. RPGs express class as damage numbers; The Vow expresses it in Kelly fraction, δ-limit, Shield recovery band and fee share — every parameter drawn from the locked master maths, none invented.

Tagline: "Pick your sin. Live with the maths."

### 7.2 The class table (v0 proposal — all values inside canonical bands)

| Face | δ multiplier | Kelly scale | Shield | Fee / flow | Card path | The cost you accept |
|---|---|---|---|---|---|---|
| THE SAINT | ×0.8 | 0.35 | Premium at 2% floor; recovery capped at 40% from any tier | Community 28.8% share auto-donated | Fastest Golden Aura | Hard ceiling — never eligible for 60% VIP recovery, never leveraged |
| WHITE RICE | ×0.5 | 0.25 | Premium 2% floor; garch_amp damped to 1.0 | None | Slowest evolution; immune to Clown state | Excluded from every VRS trigger and streak reward. You are safe and you are bored |
| THE MEGALOMANIAC | ×2.5 (O-V v3.0.1) | 1.0 (full Kelly) | Premium at 4% ceiling; recovery floored at 28.8% | Standard | Mythic reachable — through one market only | Must concentrate: single-market cap per leg, all-in, no diversification |
| THE NARCISSIST | ×1.4 | 0.5 | Premium scales with viralityIndex | Earns on meme attachments | buzzScore-driven evolution | Every position is publicly disclosed live, at entry, with size |
| THE PROSTITUTE | ×1.8 | 0.75 | No Shield eligibility whatsoever | Earns CR8TR-ladder fee flow on sold conviction | Never Golden Aura. Ever. | Naked. Sells conviction mid-leg on the secondary and forfeits the card economy |

### 7.3 The signature mechanic — FORCED RECLASSIFICATION

- The vow binds for the leg (45–90d). At close you may transmigrate freely to any face
- But the measurement layer from §6.2 runs against your worn face. A Saint who whale-dumps, a White Rice who saturates δ, a Prostitute who never sells — the mask does not match the behaviour
- Mismatch beyond threshold triggers FORCED RECLASSIFICATION: the platform publicly reassigns your face, you inherit the new class's parameters mid-flight, and the reassignment is minted to your card history permanently
- This is the same Mask Slips event as §5.2, pointed inward. In Concept 1 the subject's mask slips. In Concept 3, yours does

### 7.4 The conviction secondary (Prostitute-only)

The Prostitute class unlocks a genuine new instrument: mid-leg sale of an open conviction position to another bettor, at a negotiated price, with the seller taking CR8TR-ladder fee flow on the transfer. It is the only route to intra-leg liquidity in a family designed to be illiquid, which makes the Prostitute economically load-bearing rather than merely offensive — and it prices the archetype honestly. Selling out pays. It just costs you the card economy.

## 8. Voting Layer — how bettors vote across personas

Two channels, deliberately separated so capital cannot simply buy the verdict.

- CAPITAL CHANNEL — conviction staked on a face via DL-LMSR. Moves the price. Uncapped, Kelly- and δ-bounded
- VOICE CHANNEL — quadratic vote, votingPower = min(√stake, 240) (#votingPower, PLATFORM.VOTE_POWER_CAP), matched by #quadraticMatch. Does NOT move the price; it sets the leg's Crowned Face when the top two prices are within 3%, and it elects the Codex reading when an act class is contested
- THE CALL — any bettor may spend voice power to CALL THE MASK on another bettor's declaration (Concept 2) or vow (Concept 3). Correct calls feed sagaContributions.liesCalled and EigenTrust; frivolous calls burn the caller's voice power for the leg
- Whale resistance is structural: the price channel is capital-weighted, the verdict channel is √-capped at 240, and the two must agree for a clean Crowning. Disagreement is surfaced as a live DIVERGENCE readout — which is itself the most interesting number on the screen

## 9. MAD Shield on a five-way

- Premium: Stake × P(win) × √Volatility × SafetyMargin(0.35), clamped 2–4% — #calculateShieldPremium, unchanged
- Product insight: on a five-outcome simplex P(win) is structurally low (mean 0.20 vs 0.50 on a binary), so the premium lands near the 2% floor for most faces. Shield is CHEAPER here than anywhere else on the platform — expect the highest opt-in rate in the product line, and market it that way
- Recovery: 28.8% standard · 40% shielded ceiling · 60% VIP — #shieldRecovery, #calculateShieldPayoutFull/Tiered; φ-ratio variant #shieldPhiRatio for extreme-volatility legs
- Shield covers the loss on YOUR face only. Holding four faces to hedge is legal, cheap, and exactly the White Rice behaviour Concept 2 will catch you doing
- Compliance framing unchanged: loss mitigation, never insurance, never a subsidy

## 10. Card & Faction Integration

- The five faces are a CROSS-CUTTING axis, not a replacement for the eight canonical factions (FACTION_CANONICAL_IDS: Disruptors · Classics & Influencers · The Villains · Pop Icons · The Memes · Screen Gods · The Athletes · Politicos). A card has a faction AND, in Concept 3, a worn face
- Evolution: #calculateEvolutionScore already consumes wins/losses, ownerMADConv^1.45, buzzScore, garchEventsSurvived and scandalMeter — the face modifies the weights, not the formula
- Golden Aura on a crowned face; Affliction and 48h Clown on an unmasked declaration or a forced reclassification
- New saga contribution field: masksCalled, alongside the existing liesCalled / memesContributed / garchEventsSurvived (SagaContributions)
- Mint gate unchanged at L3 (MINT_GATE_LEVEL); the Prostitute class is permanently gated OUT of Golden Aura, which is the strongest non-financial cost in the family

## 11. Compliance — the controversy rails

This family is intentionally provocative and that is a product decision, not an accident. Provocation is priced in; legal exposure is not. Four of the five names are opinion-coded archetypes with long satirical precedent. One is not: applied to a named living person, THE PROSTITUTE carries materially more defamation and harassment exposure than the other four combined. The following rails are load-bearing, not decorative.

- CODEX AT BET TIME — the locked definition (§2) renders adjacent to every stakeable label, on-chain with the market criteria. THE PROSTITUTE is defined in-product as the Sell-Out archetype and explicitly disclaimed as a claim about sexual conduct
- OPINION FRAMING IN RESOLUTION — criteria read "aggregate crowd perception plus scored public statements," never "did X do Y." The market prices a reading, not a fact. No leg may resolve on an unadjudicated allegation
- SUBJECT GATE — public figures acting in a public capacity, brands, and institutions only. Hard-blocked: private individuals, minors, and any persona-to-protected-class mapping. Concept 2 has no external subject at all and is the safest surface in the family
- DISPLAY-MODE TOGGLE — PERSONA_DISPLAY_MODE swaps to broadcastName (THE SELLOUT / THE BEIGE) for app stores, ad networks and restrictive jurisdictions without forking the product
- NAMED-SUBJECT LAUNCH IS A SEPARATE DECISION — the example markets in §5.3 are deliberately subject-CLASS rather than named individuals. Gossip-Cop names people because it asks about events; the Five Faces assigns character, which is a different legal object. Recommend launching on institutions, brands, models and The Mirror, then adding named public figures under counsel review once the Codex has a track record
- UNCHANGED PLATFORM RAILS — Shield is loss mitigation only; no real-world illegal outcome prediction; all criteria on-chain and in UI; 30-day minimum maturity on every leg; entertainment conviction and satire throughout

## 12. Technical Development Scope

### 12.1 Smart contracts

- MADPersonaSimplex.sol — n-outcome LS-LMSR (n=5), Σp ≈ 1, face floor 0.02 / ceiling 0.88
- MADFacesPerp.sol — leg state machine, Crowning, Slip window, position roll, MADConv compounding across legs
- MADVowRegistry.sol — worn face → parameter class, transmigration, forced reclassification, conviction-secondary transfer (Prostitute)
- MADMirrorEpoch.sol — Reckoning epochs, on-chain declarations, unmasking settlement
- Reuse: MADOptimisticOracle.sol ($MADx bond + challenge window), MADMarketFactory, MADStaking, MADShieldVault, RiskOracle
- Foundry fuzz + invariants: Σp ≈ 1 · monotonic cost · never insolvent · no face outside [0.02, 0.88] · AND — the critical new one — CLASS-PARAMETER BOUNDS: no vow may push δ-limit, Kelly scale or Shield recovery outside the canonical bands. Per-user parameter mutation is the single largest new exploit surface in this family and must be fuzzed as such

### 12.2 Backend (canonical libs + new persona layer)

- NEW persona-codex.ts — the five faces, codex/broadcast names, T_speech and T_act matrices, SLIP_CAP, act-class tagger
- NEW persona-simplex.ts — n-outcome DL-LMSR wrapper, simplex normalisation, floor/ceiling enforcement, per-face δ
- NEW mirror-measure.ts — the §6.2 behavioural measurement map over platform telemetry, EigenTrust-weighted
- market-classifier.ts — add type="faces" + personaEligible, evaluated ahead of gossipcop; extend MarketType union and buildTitle/buildResolution
- gambit-game-math.ts — conviction, GARCH, DL-LMSR, Kelly, δ-limit, Shield, splitFee, votingPower, quadraticMatch (all existing, no changes)
- bayesian-conviction.ts — sequential log-odds on the persona vector, madconvHybridUpdate, brierScore/logScore for Mirror calibration
- zLiarMeter + gdelt.ts + sentiment.ts + heat-score.ts — Utterance Oracle intake and subject surfacing
- card-evolution.ts — Golden Aura / Affliction / Clown hooks; add masksCalled to SagaContributions
- APIs: POST /api/v1/faces/{codex,classify,open,allocate,vote,slip,crown,roll,shield} · /api/v1/mirror/{epoch,declare,measure,unmask} · /api/v1/vow/{take,params,transmigrate,reclassify,sell}

### 12.3 Frontend / app

- THE PORTRAIT — the hero instrument. A live five-lobed radar of the persona simplex, one lobe per face, rendered in the analog-dial visual language already used by the Z-Liar Meter. This is the screenshot that sells the product
- Codex popover on every stakeable label (compliance-required, not optional)
- Slip alert: full-bleed takeover when a TOTAL FABRICATION lands on a ≥60% Saint book, with the 24h δ-unlock countdown
- Crowning ceremony at leg close — Face of the Season, Golden Aura reveals, Affliction reveals
- The Mirror dashboard: the crowd's own five-face portrait, live, with your personal contribution to each lobe highlighted
- The Vow selector: pick your face and see your OWN maths visibly rewrite — δ-limit, Kelly, Shield band, card path — before you commit
- Divergence readout: capital channel vs voice channel, side by side

### 12.4 Phased build

- Phase 1 — persona-codex + classifier extension + parimutuel five-face markets on institution/brand subjects. Ship the Codex and the Portrait first; they are the product
- Phase 2 — n=5 DL-LMSR continuous maker, leg roll + Crowning, Shield integration, Utterance Oracle v1 (T_speech only)
- Phase 3 — THE MIRROR: measurement layer, Confessional declarations, EigenTrust weighting, 30-day Reckonings
- Phase 4 — THE VOW: class parameters, forced reclassification, conviction secondary, optimistic oracle on contested Crownings
- Phase 5 — T_act matrix, Slip events, faction × face card integration, named-public-figure subjects under counsel review

## 13. Success Metrics

- Five Faces volume ≥ 20% of platform by Y2, without cannibalising Gossip-Cop (measure net-new wallets, not share)
- Average hold > 60 days — longer than Gossip-Cop (30d) and Epiphanies (45d), because the leg structure and tenure compounding both push that way
- Shield opt-in ≥ 55% — should be the platform's highest, on the §9 low-P(win) premium argument
- Mirror participation: ≥ 40% of active bettors declare a face per Reckoning; unmask rate between 8% and 20% (below 8% the measurement is too soft, above 20% it is punitive)
- Vow adoption: ≥ 25% of actives wear a face; forced-reclassification rate ≤ 12% per leg
- Divergence: capital and voice channels agree on the Crowned Face in ≥ 80% of legs. Persistent divergence means the quadratic cap needs retuning
- Zero substantiated defamation complaints. This is a metric, and it is the one that closes the product if it moves

## 14. Open Decisions for Founder Sign-Off

- Which concept ships first. Recommendation: Concept 1 on non-person subjects (safest, most legible), with Concept 2 fast-followed as the marketing weapon. Concept 3 is the deepest but touches per-user parameter mutation and should not lead
- Named public figures — in or out at launch. Recommendation: out, pending Codex track record and counsel review (§11)
- PERSONA_DISPLAY_MODE default. Recommendation: codex on web, broadcast on app stores
- SLIP_CAP tuning (12% / 34% proposed) and the κ, w_s, w_a coefficients — proprietary, server-side, needs a live-data calibration pass before Phase 2
- Whether the Prostitute conviction-secondary is a Vow-class privilege (as specified) or a platform-wide instrument. Making it platform-wide destroys the archetype but materially improves liquidity — a real trade-off
- Face floor/ceiling (0.02 / 0.88) — this is the invariant that defines "perpetual" for the family and should be locked in the same governance tier as the canonical constants
