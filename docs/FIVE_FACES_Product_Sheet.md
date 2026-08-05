# MΛDHAT'S GAMBIT — FIVE FACES

*Perpetual Persona Decomposition — Saint · White Rice · Megalomaniac · Narcissist · Prostitute*

`Product Sheet + Technical Development Scope  |  Maths from MASTER_MATHS_AND_ALGORITHMS.md  |  v0.2  |  August 2026`

---

## 1. Product Overview

Five Faces is a semi-continuous custom perpetual on a five-persona simplex — but the bet is not which mask a subject is wearing. The bet is the gap between the mask they are wearing today and the one that is permanently theirs.

The simplex is decomposed: every face's conviction is split into a permanent component and a transitory shell, and both layers trade separately. Everyone has a permanent face and a face they are wearing today. Five Faces prices the distance between them.

Tagline: "Buy the position. You can't buy the face."

Core Loop: SUBJECT → CODEX → OPEN SIMPLEX → DECOMPOSE → CONVICT (permanent or transitory) → SHIELD → SLIP/CROWN → MINT PORTRAIT → ROLL LEG → CONTINUE

Classifier: new primary type="faces", gated on perpEligible && horizonDays >= 365 && personaEligible, evaluated ahead of gossipcop so a persona-bearing subject graduates to a decomposed simplex rather than a binary gossip perp. Subjects are not limited to people: brands, institutions, AI labs, frontier models, DAOs, franchises and whole industries all wear masks.

## 2. The Mask Codex (locked definitions — rendered at bet time)

| Face | Codex definition (canon, verbatim) |
|---|---|
| THE SAINT | Performed virtue. Claims the moral high ground and invites the halo — sincerity neither assumed nor denied. |
| WHITE RICE | Flavourless by strategy. Offends no one, commits to nothing, survives everything. |
| THE MEGALOMANIAC | Empire over everything. Scale, dominion, and the conviction that only they can fix it. |
| THE NARCISSIST | The mirror is the audience. Cannot act unless the room is watching. |
| THE PROSTITUTE | The Sell-Out archetype: monetises access, principle, platform or endorsement to the highest bidder. Never a claim about anyone's sexual conduct. |

The Codex is not flavour text — it is a compliance primitive. The definition renders adjacent to the label on every surface where conviction can be staked, and ships on-chain with the market criteria, so the product is unambiguously an archetype-perception market and never a factual allegation. Every face carries codexName and broadcastName; PERSONA_DISPLAY_MODE="broadcast" swaps THE PROSTITUTE → THE SELLOUT and WHITE RICE → THE BEIGE for app stores, ad networks and restrictive jurisdictions without forking the product.

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

Nothing here changes a canonical constant. Five Faces is additive: a new market shape (a decomposed n=5 simplex) and a new tradeable stack, running on locked maths.

## 4. The Decomposition — core maths

### 4.1 Splitting the simplex

Run bayesian-conviction.ts#cgarchUpdate PER FACE. CGARCH separates long-run from short-run variance: q_t = ω + ρ(q_t−1 − ω) + φ(ε² − σ²), then σ²_t = q_t + α(ε² − q_t−1) + β(σ²_t−1 − q_t−1). Project each face's permanent component q back onto the simplex and renormalise, and the transitory shell is what remains:

- p⃗(t) = p⃗_perm(t) + p⃗_trans(t), with Σ p⃗ = 1 preserved through re-projection
- THE RECORD book — long the permanent layer. Pays if the trait embeds
- THE PHASE book — long the transitory layer. Pays if it burns off

Perpetual by construction, not by fiat: ρ < 1 means the permanent component mean-reverts toward ω asymptotically and never arrives in finite time. There is no terminal value, therefore no terminal market. That is the mathematics, not a product decision — and it is the cleanest compliance position available to a perpetual.

### 4.2 THE DIVERGENCE — the money object

Take the Shannon entropy of each layer, bounded [0, ln 5 = 1.6094], and subtract:

- H_perm — entropy of the permanent simplex. Low means a coherent person underneath; high means there may be nobody home
- H_trans — entropy of the transitory shell. How noisy this particular leg is
- D = H_trans − H_perm — the gap between today's mask and the core

D positive and wide: the crowd is loudly confused about someone whose core is actually consistent — the mean-reversion trade. D negative: the crowd is confidently agreed about someone whose core is unstable — the crash trade. D is the first tradeable on this platform that prices CROWD ERROR rather than crowd belief, and it is the single number the whole product hangs on.

### 4.3 Persistence ρ⃗ and asymmetry γ⃗ — the nuance

Two per-face vectors turn a generic filter into a persona instrument.

| Face | ρ (persistence) | Implied half-life ln(0.5)/ln(ρ) | Reading |
|---|---|---|---|
| THE SAINT | ≈ 0.940 | ≈ 11 legs | Virtue is forgotten fastest |
| WHITE RICE | ≈ 0.960 | ≈ 17 legs | Nothing to remember |
| THE NARCISSIST | ≈ 0.985 | ≈ 46 legs | The audience has a long memory |
| THE MEGALOMANIAC | ≈ 0.990 | ≈ 69 legs | Empires are remembered |
| THE PROSTITUTE | ≈ 0.995 | ≈ 138 legs | A sell-out is never forgiven |

Same event, twelve legs of decay or a hundred and thirty-eight, purely by which face it lands on. That single table is the product's most legible idea.

The asymmetry vector γ⃗ comes free: bayesian-conviction.ts#egarchLogVar already ships γ = −0.08 leverage, so bad news raises variance more than equivalent good news. Made per-face and explicit, it states the thing plainly — REDEMPTION IS MATHEMATICALLY SLOWER THAN DISGRACE. That is not a slogan bolted on; it falls out of a function already in the repository.

### 4.4 Implied temperature — a two-factor surface

- gambit-game-math.ts#calculateSoftmax gives P(i) = e^(V_i/τ) / Σ e^(V_j/τ); τ is the temperature the code calls the crowd's decisiveness slider
- Invert it (Newton solve) against each observed layer for τ_perm and τ_trans — implied volatility, for persona markets
- That yields a τ surface across subjects, a τ term structure across legs, and a τ smile across the five faces. The platform currently has NO volatility product; this is one

## 5. Market Structure & Cadence

- Bonding, not LMSR: P = P_floor · (1 + slope·ln(1+C)) · M^2.23 · S(t) — mpp-math.ts#calculateMppPrice
- S(t) = max(0, 1 − elasticity·t/t_max) — #calculateSlippageCushion, a flash-loan and governance-window guard the LMSR families do not have
- Conviction accrues C(t) = C_max·(1 − e^(−αt)) — #calculateConviction, with α set per face (Perp 1) or per trend (Perp 2)
- Deliberately NOT DL-LMSR. Gossip-Cop and Perpetual Epiphanies are both LMSR families; changing the market maker is what makes this a structurally different instrument rather than a re-themed one
- Leg = 2 synodic months = 59.061 days (LUNAR_CYCLE_MS × 2). Dead centre of the 45–90d band and clear of the 30-day minimum-maturity floor, and it never calendar-drifts because it is astronomical
- Anchored to IMMACULATE_CONCEPTION_EPOCH_MS (1979-12-08) — the cadence is uncopyable without the epoch
- L_θ = 1.075 − 0.075·cos(2πφ) ∈ [1.00, 1.15] modulates settlement — #getLunarPhaseMultiplier; #getLunarIllumination drives the dial face
- THE CROWNING — at leg close the dominant PERMANENT face is crowned. You crown who they are, not who they seemed
- THE SLIP — a Divergence blowout: D breaks its band, meaning today's mask has detached from the core. Position caps open for one leg-eighth and the event is tagged on-chain as slip-flow. Math-native trigger; no verdict oracle required
- Position cap per face: δ = π × Multiplier × √ConvictionStake — #calculateDeltaLimit, applied PER FACE PER LAYER so no single holder can own the portrait
- Kelly: half-Kelly default — #kellyFraction(pWin, netOdds, 0.5); the neglected faces naturally carry the fat odds
- Perpetual invariant: no face may price below 0.02 or above 0.88 in either layer. A persona market that fully resolves has stopped being perpetual — the floor and ceiling are what keep every face permanently tradeable

## 6. THE TRADEABLE STACK

Four layers, three token standards, one rule: positions are liquid and open, reputation is soulbound. Money moves; character does not.

### 6.1 L1 — POSITIONS (ERC-1155 conditional tokens)

- One token id per (subject, leg, face, layer) — five faces × two layers = 10 ids per subject-leg
- Standard conditional-token pattern (Gnosis CTF lineage). Transferable, wallet-native, and tradeable on ANY ERC-1155 venue without platform permission
- Natively fractional and bundle-able. A DIVERGENCE BASKET — long D across twenty subjects — is a bundle contract over existing ids, so an index product costs no new market infrastructure
- Positions are the only fully open object in the stack. Everything above this layer is either provenance or soulbound

### 6.2 L2 — THE PORTRAIT (ERC-721, minted every Crowning)

- At each leg close the subject's full state mints as a portrait: permanent simplex, transitory shell, D, τ_perm/τ_trans, crowned face, leg index, and lunar illumination at settlement
- One per subject per leg. FOREVER — the series never stops minting and has no cap
- Rarity is EMERGENT, NOT ASSIGNED. A Slip leg is rare because Slips are rare; a leg where H_perm collapsed to near zero is rare because coherence is rare. Scarcity is a measured market event, never a trait table — the most honest rarity model available to an NFT series
- Because the mint is deterministic from settlement state, the portrait is independently verifiable against chain history. Provenance needs no trust in the issuer

### 6.3 L3 — ATTESTATIONS (ERC-5192 soulbound; POAP-compatible)

- Non-transferable proof of conviction history — the reputation layer: "held the permanent Saint through the Slip of Leg 14", "called the Divergence within 5%", "crowned the same face 8 legs running"
- Milestone thresholds reuse VRS_TRIGGERS [5, 8, 13, 21, 34] and #streakReward, so the attestation ladder is Fibonacci and already defined
- POAP proper lives on Gnosis Chain; on Base/Arbitrum the native equivalent is ERC-5192 (minimal soulbound NFT), with an optional POAP mirror purely for the social/collector layer
- Soulbound is load-bearing, not decorative: it is exactly what stops a whale buying a track record. In a persona market, a purchasable reputation would void the entire premise

### 6.4 L4 — TOKEN-BOUND ACCOUNTS (ERC-6551) — the composability unlock

- Give every MADCard a token-bound account so the CARD OWNS ITS OWN HISTORY — its portraits, its attestations, its position receipts
- Sell the card and the entire provenance travels with it, atomically, without a migration step
- Makes the existing card-evolution.ts ladder on-chain-legible: evolutionLevel L1–L4, Golden Aura, Affliction, 48h Clown state, and sagaContributions (madConvDelta, memesContributed, liesCalled, garchEventsSurvived, calibrationScore) become inspectable by any third party
- This is the standard that makes "living cards" a real object rather than a database row with art attached

### 6.5 Open tradeables — the honest feasibility answer

Yes, it is possible, and the position layer should be genuinely open. Three consequences must be designed for rather than discovered later.

| Consequence | Why | The design response |
|---|---|---|
| Royalties are not enforceable | ERC-2981 is a signal, not a guarantee; major venues made creator royalties optional | Do NOT build revenue on secondary royalties. Revenue stays 1.88% primary + Shield premiums + packs. Secondary is distribution, not income |
| Open secondary arbitrages the bond | Free 1155 trading lets external price diverge from the MPP curve | Treat as healthy — arbitrage keeps the bond honest and deepens liquidity — but #calculateSlippageCushion must be parameterised for it. This is a live risk-engine question, not a footnote |
| The compliance surface widens | Freely transferable outcome positions on open venues read differently to regulators than closed in-app conviction | Counsel review before the position layer opens. Do not assume the in-app framing transfers |

One knock-on: open tradeability dissolves the Prostitute class's exclusive right to sell a position mid-leg, since everyone can. Replace the privilege with FEE TREATMENT — the Prostitute face pays zero platform fee on secondary transfer and takes a share of realised royalty flow. The archetype survives contact with open markets, expressed economically instead of by gatekeeping.

### 6.6 What each layer is actually for

| Layer | Standard | Transferable | Purpose |
|---|---|---|---|
| Positions | ERC-1155 | Yes — fully open | Liquidity, price discovery, index construction |
| Portraits | ERC-721 | Yes | Provenance and collecting; emergent rarity |
| Attestations | ERC-5192 (+ POAP mirror) | No — soulbound | Reputation that cannot be bought |
| Cards | ERC-721 + ERC-6551 TBA | Yes, with history attached | Identity container; carries the other three |

## 7. MAD Shield on a decomposed simplex

- Premium: Stake × P(win) × √Volatility × SafetyMargin(0.35), clamped 2–4% — #calculateShieldPremium, unchanged
- Product insight worth marketing: across ten books (5 faces × 2 layers) P(win) is structurally low, so the premium lands near the 2% floor for most positions. Shield is CHEAPER here than anywhere else on the platform
- Recovery 28.8% / 40% / 60% — #shieldRecovery, #calculateShieldPayoutFull/Tiered; φ-ratio variant #shieldPhiRatio for extreme-volatility legs
- Shield covers the loss on your face AND LAYER only. Hedging permanent against transitory on the same face is legal, cheap, and precisely the trade the Divergence book exists to price
- Framing unchanged: loss mitigation, never insurance, never a subsidy

## 8. Example markets

- A top-5 AI lab founder — permanent Megalomaniac vs transitory Saint; D over four legs
- A legacy media institution — is the White Rice permanent, or is it a phase before capture?
- A celebrity wellness brand — Saint-to-Prostitute permanent drift index
- A frontier model's own public persona — the first non-human simplex; H_perm is a genuinely open question
- A crypto exchange twelve months after a regulatory settlement — γ⃗ asymmetry in live testing
- A sports franchise ownership group through a relocation fight — Slip candidate
- DIVERGENCE BASKET — long D across the twenty highest-volume subjects, as a single bundled position

## 9. Compliance rails

This family is intentionally provocative; that is a product decision. Provocation is priced in, legal exposure is not. Four of the five names are opinion-coded archetypes with long satirical precedent. One is not: applied to a named living person, THE PROSTITUTE carries materially more defamation and harassment exposure than the other four combined. These rails are load-bearing.

- CODEX AT BET TIME — the locked definition renders adjacent to every stakeable label and ships on-chain with the criteria. THE PROSTITUTE is defined in-product as the Sell-Out archetype and explicitly disclaimed as a claim about sexual conduct
- OPINION FRAMING IN RESOLUTION — criteria read "measured persona-perception decomposition", never "did X do Y". The market prices a reading, not a fact, and no leg may resolve on an unadjudicated allegation
- SUBJECT GATE — public figures acting in a public capacity, brands, and institutions only. Hard-blocked: private individuals, minors, and any persona-to-protected-class mapping
- DISPLAY-MODE TOGGLE — PERSONA_DISPLAY_MODE swaps to broadcastName for app stores, ad networks and restrictive jurisdictions without forking the product
- NAMED-SUBJECT LAUNCH IS A SEPARATE DECISION — recommend launching on institutions, brands, models and indices, adding named public figures only under counsel review once the Codex has a track record. Gossip-Cop names people because it asks about events; Five Faces assigns character, which is a different legal object
- OPEN TRADEABILITY IS ALSO A SEPARATE DECISION — see §6.5. The position layer can ship closed first and open later; the reverse is not possible
- UNCHANGED RAILS — Shield is loss mitigation only; no real-world illegal outcome prediction; all criteria on-chain and in UI; 30-day minimum maturity on every leg; entertainment conviction and satire throughout

## 10. Technical Development Scope

### 10.1 Smart contracts

- MADPersonaSimplex.sol — decomposed n=5 simplex, per-layer books, Σp ≈ 1 across the re-projection, face floor 0.02 / ceiling 0.88
- MADFacesPerp.sol — lunar leg state machine, Crowning, Slip window, position roll, conviction compounding across legs
- MADPositionToken.sol — ERC-1155 conditional positions, one id per (subject, leg, face, layer)
- MADPortrait.sol — ERC-721, deterministic mint from settlement state at each Crowning
- MADAttestation.sol — ERC-5192 soulbound, Fibonacci milestone ladder
- ERC-6551 registry integration for MADCard token-bound accounts (registry is a deployed public singleton; the work is the account implementation and the card wiring)
- Reuse: MADMarketFactory, MADStaking, MADShieldVault, RiskOracle, MADOptimisticOracle
- Foundry fuzz + invariants: Σp ≈ 1 after re-projection · monotonic cost · never insolvent · no face outside [0.02, 0.88] in either layer · permanent component never negative · D finite and signed on both sides · 1155 supply conservation across transfer AND settlement

### 10.2 Backend

- NEW persona-codex.ts — five faces, codex/broadcast names, ρ⃗, γ⃗, α per face, δ and Kelly bounds
- NEW persona-decompose.ts — per-face CGARCH, simplex re-projection and renormalisation, H_perm/H_trans, D, implied-τ Newton inversion
- NEW tradeable-registry.ts — id derivation for (subject, leg, face, layer), portrait metadata builder, attestation milestone evaluator
- market-classifier.ts — add type="faces" + personaEligible ahead of gossipcop; extend MarketType, buildTitle, buildResolution
- Reused unchanged: mpp-math.ts (calculateMppPrice, calculateSlippageCushion, calculateConviction) · bayesian-conviction.ts (cgarchUpdate, egarchLogVar, sequentialLogOddsUpdate, brierScore, logScore) · gambit-game-math.ts (calculateSoftmax, calculateDeltaLimit, kellyFraction, lunar, Shield, splitFee, streakReward) · card-evolution.ts
- APIs: POST /api/v1/faces/{codex,classify,open,allocate,decompose,divergence,slip,crown,roll,shield} · /api/v1/tradeables/{position,portrait,attestation,basket}

### 10.3 Frontend / app

- THE WATERLINE — the hero instrument. Permanent simplex rendered below the line, transitory shell above, D as the visible gap, τ_perm/τ_trans on the bezel. Analog-dial language inherited from the Z-Liar Meter
- Codex popover on every stakeable label (compliance-required, not optional)
- Half-life readout per face, in legs and in lunations
- Slip takeover: full-bleed alert when D breaks its band, with the cap-unlock countdown
- Crowning ceremony at leg close — permanent face crowned, portrait mint animation, Golden Aura and Affliction reveals
- Tradeables drawer: positions held, portraits owned, attestations earned (visibly non-transferable), and the card TBA contents

### 10.4 Phased build

- Phase 1 — persona-codex + classifier extension + parimutuel decomposed markets on institution/brand subjects. Ship the Codex and the Waterline first; they are the product
- Phase 2 — MPP bonding maker, lunar legs, Crowning, Shield integration, D as a readout
- Phase 3 — D as a TRADEABLE book, implied-τ surface, Slip events
- Phase 4 — tradeable stack: ERC-1155 positions (closed transfer first), portrait mint, soulbound attestations
- Phase 5 — open transfer on positions (counsel-gated), ERC-6551 card accounts, Divergence baskets, named-public-figure subjects under review

## 11. Success Metrics

- Five Faces volume ≥ 20% of platform by Y2, measured in net-new wallets rather than share, so cannibalisation of Gossip-Cop is visible
- Average hold > 60 days — longer than Gossip-Cop (30d) and Epiphanies (45d); the lunar leg and conviction compounding both push that way
- Shield opt-in ≥ 55%, the platform's highest, on the §7 low-P(win) premium argument
- Divergence book ≥ 25% of family volume by Y2 — if D is not being traded, the thesis has not landed
- Portrait secondary: ≥ 40% of Slip-leg portraits change hands within two legs of mint
- Attestations earned per active wallet ≥ 3 per year; zero successful transfer attempts (soulbound holds)
- Zero substantiated defamation complaints. This is a metric, and it is the one that closes the product if it moves

## 12. Open Decisions for Founder Sign-Off

- Open transfer on ERC-1155 positions — in or out at launch. Recommendation: ship closed, open in Phase 5 under counsel review. Closed-to-open is reversible; open-to-closed is not
- Named public figures as subjects — recommendation: out at launch, pending Codex track record
- ρ⃗ and γ⃗ tuning — the values in §4.3 are a proposal and need a live-data calibration pass. Proprietary, server-side, never in external materials
- Face floor/ceiling (0.02 / 0.88) — this invariant defines "perpetual" for the family and should be locked at canonical-constant governance tier
- Whether the Prostitute fee treatment (§6.5) is zero-fee on secondary, a royalty share, or both
- Chain target for the tradeable stack — the §13 chain question in MASTER_MATHS is still open and this family cannot ship a token stack until it is settled
