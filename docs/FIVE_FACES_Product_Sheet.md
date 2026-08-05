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
| THE MEGALOMANIAC | Empire over everything. Scale, dominion, and the certainty that the rules were priced for other people. Aimed at office-holders, boardrooms and the structurally entitled — the face that expects exemption. |
| THE NARCISSIST | The mirror is the audience. Cannot act unless the room is watching. |
| THE PROSTITUTE | The Sell-Out archetype: monetises access, principle, platform or endorsement to the highest bidder. Never a claim about anyone's sexual conduct. |

The Codex is not flavour text — it is a compliance primitive, and it binds to the NUMBER, not to the label. A persona price and its Codex definition render as ONE INDIVISIBLE UNIT — "THE PROSTITUTE 68%" is never displayed without the definition attached to it. This is enforced at type level rather than by style guide: the price component takes a CodexDefinition prop and will not compile without one. Every face carries codexName and broadcastName;PERSONA_DISPLAY_MODE="broadcast" swaps THE PROSTITUTE → THE SELLOUT, WHITE RICE → THE THERMOSTAT and THE MEGALOMANIAC → TOO BIG TO FAIL for app stores, ad networks and restrictive jurisdictions without forking the product.

WHY THE NUMBER AND NOT THE LABEL. The quantification is the actionable assertion. "Some people think he sold out" is opinion; "THE PROSTITUTE 68%" reads as a finding, and a finding is what gets read aloud in a courtroom. The FTC's four P's — prominence, presentation, placement, proximity — measure proximity against THE CLAIM, and here the claim is the figure. "Unavoidable" is the operative word: never behind a click, tap, hover, expansion or scroll. Courts through 2026 have been scrutinising algorithmic output directly rather than assuming platform immunity covers it, so a disclaimer that is technically present but practically skippable buys nothing. A snapshot test enforces the binding so it cannot regress silently.

Two of the three aliases are better names on the merits, not merely safer ones, because they name the MEASURED BEHAVIOUR rather than the judgement. THE THERMOSTAT is an instrument that takes the room's temperature and matches it — exactly the near-zero sentiment intensity and non-answer act-class that define White Rice. TOO BIG TO FAIL is the same trick on the risk class: the Megalomaniac must concentrate (single-market cap per leg, all-in, no diversification) and takes the Shield recovery haircut to the 28.8% floor — maximum concentration against minimum backstop, which IS too-big-to-fail structure. The alias and the risk class are the same object.

### 2.1 Broadcast aliases and catchphrases

| Face (codex — canon, on-chain) | Broadcast alias | Catchphrase (flavour only) |
|---|---|---|
| THE SAINT | — | "I'd like to thank myself for being so brave." |
| WHITE RICE | THE THERMOSTAT | "I think everyone makes a great point." |
| THE MEGALOMANIAC | TOO BIG TO FAIL | "Aaaand it's gone." |
| THE NARCISSIST | — | "Anyway, back to me." |
| THE PROSTITUTE | THE SELLOUT | "This roast is sponsored by—" |

The codex name in column one is canon: it is what ships on-chain with the market criteria and what the Codex definition attaches to. The alias is a display swap only. TOO BIG TO FAIL and its catchphrase are founder-confirmed (Aug 2026); the other four catchphrases are proposed to complete the set and are trivially swappable without touching anything structural.

CATCHPHRASES ARE FLAVOUR ONLY and the boundary is load-bearing: they render in the roast feed, on card art and in the MADHAT'r's voice, but NEVER on a stakeable label, never in resolution copy, and never on-chain. They therefore sit outside the Codex compliance surface entirely and carry no legal weight — which is exactly why they are allowed to be funny. Implementation mirrors the existing QUIPS map in zliar-meter.tsx: a per-key string map rendered adjacent to an instrument, not part of it.

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
- PROJECT ONTO THE CAPPED SIMPLEX — one operation, not two. Clamping to [0.02, 0.88] and then renormalising is NOT idempotent: renormalisation pushes clamped coordinates back outside the band, and iterating clamp-renormalise is not guaranteed to converge. The correct primitive is a single exact projection onto {p : Σp = 1, 0.02 ≤ pᵢ ≤ 0.88}
- USE THE EXACT ALGORITHM — Wang & Carreira-Perpiñán, "Projection onto the capped simplex" (arXiv:1503.01002), which solves it exactly with reference MATLAB and C++ implementations. It is O(D²) against O(D log D) for the uncapped simplex, and at D = 5 that distinction is meaningless: exactness is free here, so there is no argument for approximating. The Foundry invariant asserts EXACTNESS, not convergence — a projection that only converges is a projection that can fail to
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

### 4.5 COMMIT-AND-FREEZE — the settlement parameters

ρ⃗ and γ⃗ decide which side of THE RECORD book wins. They are set by the house, in a market the house takes 1.88% from. Left secret AND mutable, that is not a prediction market — it is a house game with a settlement dial, and it is the single largest structural objection anyone can raise against this product.

The fix does not require publishing them. It requires making them UNCHANGEABLE and PROVABLY SO:

- AT MARKET OPEN — commit keccak256(abi.encode(ρ⃗, γ⃗, α⃗, version, nonce)) on-chain. The commitment is public; the values stay proprietary and server-side
- AT EVERY CROWNING — settlement submits an EIP-712 typed, signed parameter set. The contract verifies BOTH the signature and the hash-match before it will settle. A mismatched parameter set cannot settle at all
- FROZEN FOR THE LIFE OF THE POSITION — every position opened under a commitment settles under that commitment. A revised parameter set opens a NEW market epoch and can never apply retroactively to open positions
- REVEAL ON DISPUTE OR AT CLOSE — reuse contracts/src/MADOptimisticOracle.sol unchanged: assertOutcome with a $MADx bond, a liveness window, dispute, then settle. The disputer's bond is the thing that makes the commitment worth checking
- FOUNDRY INVARIANT — no settlement may execute against a parameter hash other than the one committed at position open. This is the invariant that carries the whole argument, so it is fuzzed, not merely unit-tested

WHY THIS IS NOT OPTIONAL POLISH. The CFTC's proposed prediction-market rule (published 10 June 2026) is aimed at contracts vulnerable to manipulation, and eleven states have live proceedings against prediction-market operators. A contract whose settlement parameter is secret and house-changeable is close to the paradigm case of what that rule is written to catch. Commit-and-freeze moves this family from arguably-manipulable to provably-not, at the cost of one hash and one signature check per leg.

PHASE 4 UPGRADE — zkML. Commit-and-freeze proves the parameters did not change; it does not prove the decomposition was computed correctly on them. A zero-knowledge proof of the per-face CGARCH, entropy pair and τ inversion closes that gap without revealing ρ⃗ at all. Feasibility is not speculative: production zkML shipped through 2026 for sub-1B-parameter models, and a full GPT-2 inference has been proven end to end. Five faces and a handful of scalar operations sits orders of magnitude below that ceiling — this family is an unusually good fit for the technique, not a stretch application of it.

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
- THE CEILING ARBITRAGE — say it out loud rather than discover it. When the honest read is 0.97 on one face, the book shows 0.88 and the residual 0.12 sits on faces nobody believes in. That gap is free money to whoever takes the other side, and while transfer is closed (§9) the BOND funds it. This is the running cost of the perpetual invariant, not a bug in it: the alternative is a market that resolves and therefore stops being a perp. Size it before Phase 2, cap total boundary exposure per subject, and monitor it as a line item rather than letting it surface as unexplained bond drawdown

### 5.1 THE EXIT VALVE — redemption against the bond

Two good decisions combine into a bad one. Lunar legs run 59.061 days and ERC-1155 transfer is closed at launch (§9), so without a third mechanism a launch user cannot leave a position for up to two months, in a market whose settlement they cannot follow. That is a churn engine, and it also quietly corrupts the headline retention metric (§11).

The valve is REQUEST → COOLDOWN → REDEEM AGAINST THE BOND, and almost all of it already exists.

- WRAPPER — reuse the Shield unstake lifecycle verbatim: #requestShieldUnstake, #calculateShieldReturnWindow (2–24h, scaled by position size), #isShieldUnstakeComplete, #shieldReturnCountdown and the ShieldStatus union. Same state machine, same countdown UI, price locked at request time. Nothing new is invented; the exit reads exactly like the unstake users already know
- THE COOLDOWN IS THE GUARD — a size-scaled delay between requesting and redeeming is what stops the valve becoming a flash-exit vector across a Slip. Larger positions wait longer, which is already how #calculateShieldReturnWindow behaves
- MECHANISM — redeem against the MPP bond at #calculateMppPrice, minus an exit penalty that DECAYS ACROSS THE LEG: steep at open, approaching zero near the Crowning. Early exit is expensive because early exit is the one that free-rides on other people's conviction; late exit is nearly free because by then you have carried the leg
- THE BOND IS THE COUNTERPARTY — which is the whole point. An order book thins exactly when everyone wants out; a bonding curve cannot. Exit is always available at SOME price, and the price is a published function rather than whoever happens to be bidding
- This does not reopen the transfer question. Redemption burns the position against the bond; it does not make positions transferable to third parties. §9's closed-transfer ruling stands untouched

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
- Because the mint is deterministic from settlement state, the portrait is independently verifiable against chain history — for as long as its payload remains readable. See 6.2.1: for named individuals that qualifier is load-bearing, and the weaker claim is the honest one

### 6.2.1 TWO-TRACK PORTRAITS — the EDPB constraint

EDPB Guidelines 02/2025, version 2.0 adopted 7 July 2026, recommend not registering clear text, ENCRYPTED, or HASHED personal data on a blockchain — encrypted personal data is still personal data, and the store-a-hash-on-chain pattern that most NFT projects assume is safe is explicitly disfavoured. A portrait of a NAMED LIVING PERSON'S character reading, minted permanently to a public chain, is squarely what that guidance is written about.

The constraint binds on one track only, so the design splits rather than degrades:

| Subject class | Portrait design | Rationale |
|---|---|---|
| Brands · institutions · models · industries · indices | UNCHANGED — full payload on-chain, fully verifiable forever | No personal data, therefore no GDPR surface. Emergent rarity works exactly as specified |
| NAMED LIVING INDIVIDUALS | On-chain: opaque subjectId, leg index, ciphertext pointer, token id — and nothing else. No name, no likeness, no persona label, no persona values. Off-chain: the payload under AES-256, one key PER SUBJECT | Keeps the token, the series and the provenance while holding no personal data on a public chain |

- ERASURE = KEY DESTRUCTION. An upheld erasure request destroys that subject's key, with an auditable destruction log. The token survives, its position in the series survives, its provenance survives — the link to the person does not. EDPB, the UK ICO and CNIL all recognise crypto-shredding as valid erasure given strong encryption, irreversible destruction and auditability
- THE HONEST QUALIFIER — for named-subject portraits, "independently verifiable against chain history" holds only while the key lives. After erasure the token is provably part of the series and provably unreadable. Say that plainly rather than leaving the stronger claim standing; a collector who discovers the limitation later is a collector who stops trusting the whole series
- EMERGENT RARITY SURVIVES — the Slip, the Crowning and the leg index are market events recorded on-chain independently of the payload, so a Slip-leg portrait is still provably a Slip-leg portrait. What erasure removes is WHOSE it was, which is exactly the property that should be removable and the only one that should
- PER-SUBJECT keys, not per-token: one erasure request must reach every portrait of that person across every leg, in one operation. Per-token keys would turn a single request into an unbounded sweep and guarantee a miss

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

One knock-on: open tradeability dissolves the Prostitute class's exclusive right to sell a position mid-leg, since everyone can. Replace the privilege with FEE TREATMENT — secondary royalty is set at 4.8% (ERC-2981), and the Prostitute face takes the royalty share on positions it originated. The archetype survives contact with open markets, expressed economically instead of by gatekeeping: selling out still pays, it just costs the card economy.

Two honest notes on the 4.8%. It sits deliberately under the 4.9% Furnace burn cap so the two never invert, keeping the eights-and-nines numerology intact. And per the table above it is BEST-EFFORT — venues that ignore ERC-2981 pay nothing, so 4.8% is the ceiling of what may be realised, never a revenue line to forecast against. Since transfer is closed at launch (§9), this parameter is dormant until Phase 5 and can be retuned before it ever binds.

### 6.6 What each layer is actually for

| Layer | Standard | Transferable | Purpose |
|---|---|---|---|
| Positions | ERC-1155 | Yes — fully open | Liquidity, price discovery, index construction |
| Portraits | ERC-721 | Yes | Provenance and collecting; emergent rarity |
| Attestations | ERC-5192 (+ POAP mirror) | No — soulbound | Reputation that cannot be bought |
| Cards | ERC-721 + ERC-6551 TBA | Yes, with history attached | Identity container; carries the other three |

### 6.7 Deployment topology (chain ruling, Aug 2026)

| Chain | Carries | Why |
|---|---|---|
| Arbitrum Nova (42170) | Gameplay — leg state machine, conviction accounting, decomposition settlement, Crownings, Slips | High-frequency, low-value writes. AnyTrust economics suit a market that re-settles every utterance |
| Arbitrum One (42161) | The ENTIRE token stack — positions, portraits, attestations, cards + TBAs — alongside MADShieldVault, MADStaking and $MADx | Value and provenance live together. See the constraint below |
| HyperLiquid (HyperEVM) | Secondary distribution and liquidity venue, Phase 5+ alongside open transfer | EVM-compatible so the standards port unchanged. A venue, never the canonical record |

THE CONSTRAINT THAT DECIDES THE SPLIT — ERC-6551. A token-bound account can only hold assets on its own chain. If cards and their TBAs live on One while attestations mint on Nova, the card CANNOT own its own history, and the headline property of L4 silently breaks. So the four token layers stay together on Arbitrum One, gameplay runs on Nova, and Nova emits settlement events that trigger the One-side mints. Splitting the token stack across chains to save gas would cost the single most valuable structural property in the product.

Two smaller notes. The ERC-6551 registry is a CREATE2 singleton at an identical address on every EVM chain, which makes multi-chain addressing trivial but does NOT solve the cross-chain asset problem above. And provenance must never fragment: when HyperLiquid comes online as a venue, portraits and attestations still resolve to Arbitrum One as the source of truth, or a collector's history becomes chain-dependent and therefore unverifiable.

CONSEQUENCE OF §6.2.1 — the topology ruling is unaffected, but WHAT THE TOKEN CARRIES changes. Arbitrum One is public, so for named individuals it holds only the pseudonymous subjectId and a ciphertext pointer; the payload lives off-chain under a per-subject key. This does not move the token stack off One and does not weaken the ERC-6551 argument — a token-bound account holds the token, and the token is still on One. It does mean the portrait key registry is infrastructure that must exist BEFORE the first named-subject portrait mints, which puts it in front of Phase 4 rather than inside it.

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

These are written as subject CLASSES. Named current public figures are in scope from launch (§9.1), and named markets are expected to carry the majority of volume — the classes above are how the sheet stays readable, not a scope limit. Every named subject must clear the §9.1 eligibility bar with its evidence stored alongside the market criteria.

## 9. Compliance rails

This family is intentionally provocative; that is a product decision. Provocation is priced in, legal exposure is not. Four of the five names are opinion-coded archetypes with long satirical precedent. One is not: applied to a named living person, THE PROSTITUTE carries materially more defamation and harassment exposure than the other four combined.

FOUNDER DECISION (Aug 2026): named current public figures ARE in scope at launch, and Five Faces ships ahead of Zeitgeist. That is the highest-exposure configuration available — the character-assigning product, on real named people, first, without Zeitgeist having first proven the Codex on subjects that cannot sue. The decision is recorded as made; the rails below are correspondingly tightened from advisory to launch-gating, and §9.1 adds three controls that did not exist when named subjects were out of scope.

- CODEX AT BET TIME — the locked definition renders adjacent to every stakeable label and ships on-chain with the criteria. THE PROSTITUTE is defined in-product as the Sell-Out archetype and explicitly disclaimed as a claim about sexual conduct
- OPINION FRAMING IN RESOLUTION — criteria read "measured persona-perception decomposition", never "did X do Y". The market prices a reading, not a fact, and no leg may resolve on an unadjudicated allegation
- SUBJECT GATE — public figures acting in a PUBLIC capacity, brands, and institutions. Hard-blocked with no override: private individuals, minors, any persona-to-protected-class mapping, and any conduct outside the subject's public role (family, health, sexuality, private relationships) regardless of how widely it has been reported
- DISPLAY-MODE TOGGLE — PERSONA_DISPLAY_MODE swaps to broadcastName for app stores, ad networks and restrictive jurisdictions without forking the product
- TRANSFER CLOSED AT LAUNCH (decided) — ERC-1155 positions are non-transferable at launch and open only in Phase 5 under counsel review. Closed-to-open is reversible; open-to-closed is not. This is the one lever that materially reduces exposure while named subjects are live
- UNCHANGED RAILS — Shield is loss mitigation only; no real-world illegal outcome prediction; all criteria on-chain and in UI; 30-day minimum maturity on every leg; entertainment conviction and satire throughout

### 9.1 Named-subject controls (required by the Aug 2026 decision)

Gossip-Cop names people because it asks about EVENTS. Five Faces assigns CHARACTER, which is a different legal object and needs three controls Gossip-Cop never required. All three are launch-gating, not backlog.

- ELIGIBILITY BAR — a named subject qualifies only on an objective, auditable threshold recorded with the market: holds or seeks public office, is an officer or director of a public company, or has a sustained national-media public role. The bar is published, the evidence is stored with the market criteria, and a subject who falls below it is delisted at the next Crowning rather than mid-leg
- RIGHT OF REPLY — every named-subject market carries a standing, unmoderated response surface the subject (or a verified representative) can post to, rendered adjacent to the Waterline at equal prominence. A market that reads someone's character while giving them no channel to answer is the version of this product that gets sued
- DELISTING AND APPEAL PATH — a named subject may request review; substantiated complaints halt new conviction immediately and settle open positions at the last Crowning price rather than voiding them. The path, its SLA and its outcomes are published. Complaint volume and resolution time are tracked as launch metrics, not incident reports
- THE CODEX REGISTRAR — the fourth control, and the one that is a PERSON rather than a feature. The first three describe what the product does; none of them says who decides that a named subject clears the bar, at volume, with legal consequence. Every other perp on this platform is classified algorithmically by market-classifier.ts; this one is not, and pretending otherwise is how the queue ends up owned by nobody. One accountable in-house owner, a published LISTING SLA to sit alongside the delisting SLA, and a staffed queue

TRIAGE ARCHITECTURE — cheap classifier pre-screen on the objective eligibility criteria, LLM-as-judge on the ambiguous remainder, humans on the genuinely hard cases and on EVERY appeal. That is the 2026 consensus shape for trust-and-safety operations and it keeps this under one FTE at launch scale. Cost it openly: a fully-loaded moderation FTE runs roughly £30–40k in the UK and materially more in the US, so the operating cost of the named-subject decision is a real number that should appear on the day the decision is made rather than a year later.

DSA-SHAPED FROM DAY ONE — build the notice-and-action mechanism, a trusted-flagger priority lane, and published moderation statistics including error rates, before the thresholds bind. Two reasons beyond compliance: the EU becomes a switch-flip rather than a re-architecture, and the transparency report doubles as the contemporaneous audit trail that defends the product if a complaint ever escalates. A platform that can show its own error rate is in a very different position from one that cannot.

PAUSE_GUARDIAN — a role that halts new conviction platform-wide, deliberately NOT behind the governance timelock. Timelocks exist to delay parameter changes so the community can react; an emergency stop must not be delayed for the same reason a fire alarm is not on a timer. Precedent exists but is insufficient: contracts/src/MADMarketFactory.sol already inherits OpenZeppelin Pausable with pause()/unpause() gated onlyOwner. That couples the emergency stop to the owner key, which is both a single point of failure and the wrong custody model. This needs a SEPARATE role with a separate key, able to halt but not to change anything.

Counsel review moves from a Phase 5 gate to a LAUNCH gate, and covers the eligibility bar, the Codex text, the resolution copy, and the right-of-reply design before the first named market opens. THE PROSTITUTE applied to a named living person remains the single highest-risk cell in the product; the broadcastName THE SELLOUT ships as the default display for named subjects.

## 10. Technical Development Scope

### 10.1 Smart contracts

- MADPersonaSimplex.sol — decomposed n=5 simplex, per-layer books, Σp ≈ 1 across the re-projection, face floor 0.02 / ceiling 0.88
- MADFacesPerp.sol — lunar leg state machine, Crowning, Slip window, position roll, conviction compounding across legs
- MADPositionToken.sol — ERC-1155 conditional positions, one id per (subject, leg, face, layer)
- MADPortrait.sol — ERC-721, deterministic mint from settlement state at each Crowning
- MADAttestation.sol — ERC-5192 soulbound, Fibonacci milestone ladder
- NEW MADParamCommit.sol — parameter-hash registry (§4.5): commit at market open, EIP-712 verify at each Crowning, epoch rollover on revision, reveal path wired to MADOptimisticOracle
- NEW PAUSE_GUARDIAN role (§9.1) — halts new conviction platform-wide, separate key from owner, NOT timelocked. MADMarketFactory's existing onlyOwner Pausable is the precedent to extend, not to reuse as-is
- NEW MADPortraitKeyRegistry.sol — per-subject key references and an auditable destruction log for §6.2.1 erasure. Holds references and events only; never key material
- ERC-6551 registry integration for MADCard token-bound accounts (registry is a deployed public singleton; the work is the account implementation and the card wiring)
- Reuse: MADMarketFactory, MADStaking, MADShieldVault, RiskOracle, MADOptimisticOracle
- Foundry fuzz + invariants: capped-simplex projection is EXACT (not merely convergent) · Σp ≈ 1 after re-projection · monotonic cost · never insolvent · no face outside [0.02, 0.88] in either layer · permanent component never negative · D finite and signed on both sides · 1155 supply conservation across redemption AND settlement · NO SETTLEMENT AGAINST A PARAMETER HASH OTHER THAN THE ONE COMMITTED AT POSITION OPEN · exit redemption always available at some price while a leg is open · PAUSE_GUARDIAN can halt but can never alter state

### 10.2 Backend

- NEW persona-codex.ts — five faces carrying codexName, broadcastName and catchphrase, plus ρ⃗, γ⃗, α per face, δ and Kelly bounds. catchphrase is type-level excluded from every stakeable-label render path (§2.1); mirrors the QUIPS map in zliar-meter.tsx
- NEW persona-decompose.ts — per-face CGARCH, simplex re-projection and renormalisation, H_perm/H_trans, D, implied-τ Newton inversion
- NEW tradeable-registry.ts — id derivation for (subject, leg, face, layer), portrait metadata builder, attestation milestone evaluator
- NEW portrait-vault.ts — per-subject AES-256 key lifecycle, ciphertext pointer derivation, irreversible destruction with an audit record (§6.2.1). Keys never touch the chain and never touch a log line
- NEW position-exit.ts — the §5.1 valve: request/cooldown/redeem state machine composed from #requestShieldUnstake, #calculateShieldReturnWindow, #isShieldUnstakeComplete and #shieldReturnCountdown, plus the leg-decaying exit penalty over #calculateMppPrice
- NEW param-commit.ts — EIP-712 typed-data construction for (ρ⃗, γ⃗, α⃗, version, nonce), commitment hashing, and the epoch guard that refuses to sign against a superseded commitment
- NEW registrar-queue.ts — eligibility pre-screen, LLM-as-judge escalation, human queue, listing/delisting SLA timers, and the DSA notice-and-action + trusted-flagger intake (§9.1)
- market-classifier.ts — add type="faces" + personaEligible ahead of gossipcop; extend MarketType, buildTitle, buildResolution
- Reused unchanged: mpp-math.ts (calculateMppPrice, calculateSlippageCushion, calculateConviction) · bayesian-conviction.ts (cgarchUpdate, egarchLogVar, sequentialLogOddsUpdate, brierScore, logScore) · gambit-game-math.ts (calculateSoftmax, calculateDeltaLimit, kellyFraction, lunar, Shield, splitFee, streakReward) · card-evolution.ts
- APIs: POST /api/v1/faces/{codex,classify,open,allocate,decompose,divergence,slip,crown,roll,shield,exit} · /api/v1/tradeables/{position,portrait,attestation,basket} · /api/v1/registrar/{propose,screen,appeal,delist,stats} · /api/v1/params/{commit,verify,reveal}

### 10.3 Frontend / app

- THE WATERLINE — the hero instrument. Permanent simplex rendered below the line, transitory shell above, D as the visible gap, τ_perm/τ_trans on the bezel. Analog-dial language inherited from the Z-Liar Meter
- PersonaPrice — the single component that renders a face's price. It takes a CodexDefinition prop and will not compile without one, so a price can never appear on screen detached from its definition (§2). Not a popover: a popover is exactly the skippable-disclosure pattern the FTC standard rules out
- Exit drawer — request/cooldown/redeem with the live countdown and the current decaying penalty shown before commit, reusing the Shield unstake countdown component
- Parameter-commitment badge on every market: the committed hash, the epoch, and whether this leg's settlement verified against it. A commitment nobody can see is a commitment nobody trusts
- Half-life readout per face, in legs and in lunations
- Slip takeover: full-bleed alert when D breaks its band, with the cap-unlock countdown
- Crowning ceremony at leg close — permanent face crowned, portrait mint animation, Golden Aura and Affliction reveals
- Tradeables drawer: positions held, portraits owned, attestations earned (visibly non-transferable), and the card TBA contents

### 10.4 Phased build

- Phase 1 — persona-codex + classifier extension + parimutuel decomposed markets, with the EXACT capped-simplex projection from the start. Named public figures are in scope from Phase 1 per the Aug 2026 decision, which makes the §9.1 controls (eligibility bar, right of reply, delisting path, Codex Registrar, PAUSE_GUARDIAN) Phase 1 deliverables rather than later hardening. Ship the Codex and the Waterline first; they are the product
- Phase 2 — MPP bonding maker, lunar legs, Crowning, Shield integration, D as a readout, the §5.1 exit valve (it ships WITH the bond, since the bond is its counterparty), and §4.5 commit-and-freeze
- Phase 3 — D as a TRADEABLE book, implied-τ surface, Slip events
- Phase 4 — tradeable stack: ERC-1155 positions (closed transfer first), portrait mint, soulbound attestations, and the zkML upgrade to §4.5. GATE: the §6.2.1 portrait key registry must be LIVE before the first named-subject portrait mints — it is a precondition of this phase, not a task inside it
- Phase 5 — open transfer on positions (counsel-gated), 4.8% ERC-2981 royalty goes live, ERC-6551 card accounts, Divergence baskets

## 11. Success Metrics

- Five Faces volume ≥ 20% of platform by Y2, measured in net-new wallets rather than share, so cannibalisation of Gossip-Cop is visible
- Average VOLUNTARY hold > 60 days — the denominator is positions that COULD have exited via §5.1 and chose not to. The unqualified version of this metric was unfalsifiable: with transfer closed and 59-day legs, a long hold measured the lockup rather than conviction. Once the exit valve exists the number means something, and it only means something if measured this way
- Exit-valve usage between 5% and 25% of positions per leg. Below 5% suggests the penalty curve is punitive; above 25% suggests conviction is not forming and the market is being used as a trade
- Key-destruction SLA: 100% of upheld erasure requests executed within the published window, with an auditable log entry per subject (§6.2.1). This is pass/fail, not a target
- Registrar queue: listing decisions and appeals both inside published SLA; moderation error rate published per §9.1 rather than held internally
- Shield opt-in ≥ 55%, the platform's highest, on the §7 low-P(win) premium argument
- Divergence book ≥ 25% of family volume by Y2 — if D is not being traded, the thesis has not landed
- Portrait secondary: ≥ 40% of Slip-leg portraits change hands within two legs of mint
- Attestations earned per active wallet ≥ 3 per year; zero successful transfer attempts (soulbound holds)
- Zero substantiated defamation complaints. This is a metric, and it is the one that closes the product if it moves

## 12. Decision Log — founder sign-off, August 2026

| Decision | Ruling | Consequence |
|---|---|---|
| Persona names | All five codex names UNCHANGED — Saint · White Rice · Megalomaniac · Narcissist · Prostitute | No meme display mode. Three broadcast aliases: WHITE RICE → THE THERMOSTAT, THE MEGALOMANIAC → TOO BIG TO FAIL, THE PROSTITUTE → THE SELLOUT. Catchphrase layer added, flavour-only — §2.1 |
| Megalomaniac scope | Sharpened to office-holders, boardrooms and the structurally entitled | Codex line now names impunity, not just ambition — §2 |
| Prostitute broadcast name | THE SELLOUT retained | Default display for named subjects — §9.1 |
| Ship order | FIVE FACES first, ahead of Zeitgeist | Reverses the sheet's prior recommendation. See risk note below |
| Named public figures | IN at launch | §9.1 controls become Phase 1 deliverables; counsel review moves to a launch gate |
| ERC-1155 open transfer | OUT at launch | Ships non-transferable, opens Phase 5. The main exposure lever while named subjects are live |
| Chain | Arbitrum Nova (42170) to start + Arbitrum One (42161); HyperLiquid secondary | Resolves MASTER_MATHS §13 item 4. Drives the §6.7 topology |
| ρ⃗ / γ⃗ values | Ship the §4.3 proposal | Calibrate on live data before Phase 2. Proprietary, server-side |
| Face floor / ceiling | 0.02 / 0.88 locked at canonical tier | Changing it now requires founder sign-off like any PLATFORM constant |
| Prostitute fee treatment | Royalty share at 4.8% | ERC-2981, best-effort, dormant until Phase 5 — §6.5 |
| Audit 1 — settlement parameters | COMMIT-AND-FREEZE; zkML at Phase 4 | Values stay secret, commitment is public and immutable per position — §4.5 |
| Audit 2 — simplex projection | EXACT algorithm (Wang & Carreira-Perpiñán) | At D=5 exactness is free; invariant asserts exactness, not convergence — §4.1 |
| Audit 3 — Codex binding | Bind to the NUMBER, type-enforced | PersonaPrice will not compile without a CodexDefinition — §2 |
| Audit 4 — exit valve | Request → cooldown → redeem against the bond | Reuses the Shield unstake lifecycle wholesale; penalty decays across the leg — §5.1 |
| Audit 5 — operations | Codex Registrar + DSA-shaped intake + PAUSE_GUARDIAN | The guardian is a separate key and is NOT timelocked — §9.1 |
| Audit 6 — portraits | Two-track: institutions on-chain, named individuals pseudonymous + crypto-shredded | EDPB v2.0 (7 Jul 2026) disfavours even hashed personal data on-chain — §6.2.1 |

### 12.1 Note carried forward

- RISK NOTE ON THE SHIP ORDER — Five Faces first plus named public figures is the highest-exposure configuration in the family: the character-assigning product, on real people, before Zeitgeist has proven the Codex on subjects that cannot sue. Recorded as decided, not re-litigated. The §9.1 controls and closed transfer are the mitigations that make it shippable, and they are therefore not optional scope
- MASTER_MATHS §13 item 4 IS NOW ANSWERED — the chain ruling above matches the canonical-numbers skill (Nova 42170 gameplay + One 42161 vaults/$MADx) and adds HyperLiquid as a secondary venue. That doc still carries the contradiction and should be updated separately under its own governance rule; it is not edited from this sheet
