#!/usr/bin/env python3
"""Regenerate the two custom-perpetual product sheets (.docx + .md twins).

    python3 scripts/build-perp-sheets.py docs/

Emits, into the given output directory:
    FIVE_FACES_Product_Sheet_Technical_Spec.docx  + .md
    ZEITGEIST_Product_Sheet_Technical_Spec.docx   + .md

Edit the SHEETS blocks below, re-run, and both formats stay in sync.

Stdlib only. python-docx is not installable in this environment, so each .docx
is assembled by cloning an existing house-format package
(docs/MAD_FORGE_Product_Sheet_Technical_Spec.docx) and rewriting word/document.xml,
word/header1.xml and docProps/core.xml. Styles, fonts and numbering are inherited,
so the output matches the Gossip-Cop / Perpetual Epiphanies sheets exactly.

Block grammar:
    ("brand", text)          MΛDHAT'S GAMBIT lockup
    ("title", text)          big purple product name
    ("sub",   text)          italic subtitle
    ("meta",  text)          grey meta line
    ("h1",    text)          Heading1
    ("h2",    text)          Heading2
    ("p",     text)          body paragraph
    ("li",    text)          bullet
    ("table", [[cells...]])  first row is the header row
"""

import os
import re
import sys
import zipfile
from xml.sax.saxutils import escape

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
TEMPLATE = os.path.join(REPO, "docs", "MAD_FORGE_Product_Sheet_Technical_Spec.docx")
FONT = '<w:rFonts w:ascii="Arial" w:cs="Arial" w:eastAsia="Arial" w:hAnsi="Arial"/>'

# ── shared blocks ────────────────────────────────────────────────────────────

CANONICAL_CONSTANTS = ("table", [
    ["Constant", "Value", "Code home"],
    ["Platform fee", "1.88% (FEE_BPS 188)", "PLATFORM.FEE_BPS"],
    ["Creator ladder", "28.8% User · 40% MinorCreator · 60% CR8TR", "CREATOR_LADDER"],
    ["Community share", "28.8% (COMMUNITY_SHARE_BPS 2880)", "PLATFORM.COMMUNITY_SHARE_BPS"],
    ["Shield recovery", "28.8% std · 40% ceiling · 60% VIP", "SHIELD_RECOVERY_PCT / _PREMIUM_PCT / _WHALE_PCT"],
    ["Shield premium band", "2%–4% of stake · safety margin 0.35", "SHIELD_PREMIUM_MIN/MAX · SHIELD_SAFETY_MARGIN"],
    ["Perp trigger gate", "0.60", "PLATFORM.PERP_TRIGGER_THRESHOLD"],
    ["Vote power cap", "min(√stake, 240)", "PLATFORM.VOTE_POWER_CAP · votingPower"],
    ["GARCH(1,1)", "ω 0.0001 · α 0.05 · β 0.90 · σ∈[0.09,0.68]", "garchUpdate · garchAmplification"],
    ["Synodic month", "29.530588853 d", "LUNAR_CYCLE_MS"],
    ["Conviction epoch", "1979-12-08", "IMMACULATE_CONCEPTION_EPOCH_MS"],
    ["$MADx supply / burn cap", "888,888,888 fixed · ≤4.9% per 30d", "MADX_FIXED_SUPPLY · FURNACE_BURN_CAP"],
])

MASK_CODEX = ("table", [
    ["Face", "Codex definition (canon, verbatim)"],
    ["THE SAINT", "Performed virtue. Claims the moral high ground and invites the halo — sincerity neither assumed nor denied."],
    ["WHITE RICE", "Flavourless by strategy. Offends no one, commits to nothing, survives everything."],
    ["THE MEGALOMANIAC", "Empire over everything. Scale, dominion, and the conviction that only they can fix it."],
    ["THE NARCISSIST", "The mirror is the audience. Cannot act unless the room is watching."],
    ["THE PROSTITUTE", "The Sell-Out archetype: monetises access, principle, platform or endorsement to the highest bidder. Never a claim about anyone's sexual conduct."],
])

CODEX_NOTE = ("p", "The Codex is not flavour text — it is a compliance primitive. The definition renders adjacent to the label on every surface where conviction can be staked, and ships on-chain with the market criteria, so the product is unambiguously an archetype-perception market and never a factual allegation. Every face carries codexName and broadcastName; PERSONA_DISPLAY_MODE=\"broadcast\" swaps THE PROSTITUTE → THE SELLOUT and WHITE RICE → THE BEIGE for app stores, ad networks and restrictive jurisdictions without forking the product.")

LUNAR_CADENCE = [
    ("li", "Leg = 2 synodic months = 59.061 days (LUNAR_CYCLE_MS × 2). Dead centre of the 45–90d band and clear of the 30-day minimum-maturity floor, and it never calendar-drifts because it is astronomical"),
    ("li", "Anchored to IMMACULATE_CONCEPTION_EPOCH_MS (1979-12-08) — the cadence is uncopyable without the epoch"),
    ("li", "L_θ = 1.075 − 0.075·cos(2πφ) ∈ [1.00, 1.15] modulates settlement — #getLunarPhaseMultiplier; #getLunarIllumination drives the dial face"),
]

MPP_PRICING = [
    ("li", "Bonding, not LMSR: P = P_floor · (1 + slope·ln(1+C)) · M^2.23 · S(t) — mpp-math.ts#calculateMppPrice"),
    ("li", "S(t) = max(0, 1 − elasticity·t/t_max) — #calculateSlippageCushion, a flash-loan and governance-window guard the LMSR families do not have"),
    ("li", "Conviction accrues C(t) = C_max·(1 − e^(−αt)) — #calculateConviction, with α set per face (Perp 1) or per trend (Perp 2)"),
    ("li", "Deliberately NOT DL-LMSR. Gossip-Cop and Perpetual Epiphanies are both LMSR families; changing the market maker is what makes this a structurally different instrument rather than a re-themed one"),
]

# ── PERP 1 — FIVE FACES ──────────────────────────────────────────────────────

FIVE_FACES = [
    ("brand", "MΛDHAT'S GAMBIT"),
    ("title", "FIVE FACES"),
    ("sub", "Perpetual Persona Decomposition — Saint · White Rice · Megalomaniac · Narcissist · Prostitute"),
    ("meta", "Product Sheet + Technical Development Scope  |  Maths from MASTER_MATHS_AND_ALGORITHMS.md  |  v0.2  |  August 2026"),

    ("h1", "1. Product Overview"),
    ("p", "Five Faces is a semi-continuous custom perpetual on a five-persona simplex — but the bet is not which mask a subject is wearing. The bet is the gap between the mask they are wearing today and the one that is permanently theirs."),
    ("p", "The simplex is decomposed: every face's conviction is split into a permanent component and a transitory shell, and both layers trade separately. Everyone has a permanent face and a face they are wearing today. Five Faces prices the distance between them."),
    ("p", "Tagline: \"Buy the position. You can't buy the face.\""),
    ("p", "Core Loop: SUBJECT → CODEX → OPEN SIMPLEX → DECOMPOSE → CONVICT (permanent or transitory) → SHIELD → SLIP/CROWN → MINT PORTRAIT → ROLL LEG → CONTINUE"),
    ("p", "Classifier: new primary type=\"faces\", gated on perpEligible && horizonDays >= 365 && personaEligible, evaluated ahead of gossipcop so a persona-bearing subject graduates to a decomposed simplex rather than a binary gossip perp. Subjects are not limited to people: brands, institutions, AI labs, frontier models, DAOs, franchises and whole industries all wear masks."),

    ("h1", "2. The Mask Codex (locked definitions — rendered at bet time)"),
    MASK_CODEX,
    CODEX_NOTE,

    ("h1", "3. Canonical Constants (unchanged — gambit-game-math.ts#PLATFORM)"),
    CANONICAL_CONSTANTS,
    ("p", "Nothing here changes a canonical constant. Five Faces is additive: a new market shape (a decomposed n=5 simplex) and a new tradeable stack, running on locked maths."),

    ("h1", "4. The Decomposition — core maths"),
    ("h2", "4.1 Splitting the simplex"),
    ("p", "Run bayesian-conviction.ts#cgarchUpdate PER FACE. CGARCH separates long-run from short-run variance: q_t = ω + ρ(q_t−1 − ω) + φ(ε² − σ²), then σ²_t = q_t + α(ε² − q_t−1) + β(σ²_t−1 − q_t−1). Project each face's permanent component q back onto the simplex and renormalise, and the transitory shell is what remains:"),
    ("li", "p⃗(t) = p⃗_perm(t) + p⃗_trans(t), with Σ p⃗ = 1 preserved through re-projection"),
    ("li", "THE RECORD book — long the permanent layer. Pays if the trait embeds"),
    ("li", "THE PHASE book — long the transitory layer. Pays if it burns off"),
    ("p", "Perpetual by construction, not by fiat: ρ < 1 means the permanent component mean-reverts toward ω asymptotically and never arrives in finite time. There is no terminal value, therefore no terminal market. That is the mathematics, not a product decision — and it is the cleanest compliance position available to a perpetual."),

    ("h2", "4.2 THE DIVERGENCE — the money object"),
    ("p", "Take the Shannon entropy of each layer, bounded [0, ln 5 = 1.6094], and subtract:"),
    ("li", "H_perm — entropy of the permanent simplex. Low means a coherent person underneath; high means there may be nobody home"),
    ("li", "H_trans — entropy of the transitory shell. How noisy this particular leg is"),
    ("li", "D = H_trans − H_perm — the gap between today's mask and the core"),
    ("p", "D positive and wide: the crowd is loudly confused about someone whose core is actually consistent — the mean-reversion trade. D negative: the crowd is confidently agreed about someone whose core is unstable — the crash trade. D is the first tradeable on this platform that prices CROWD ERROR rather than crowd belief, and it is the single number the whole product hangs on."),

    ("h2", "4.3 Persistence ρ⃗ and asymmetry γ⃗ — the nuance"),
    ("p", "Two per-face vectors turn a generic filter into a persona instrument."),
    ("table", [
        ["Face", "ρ (persistence)", "Implied half-life ln(0.5)/ln(ρ)", "Reading"],
        ["THE SAINT", "≈ 0.940", "≈ 11 legs", "Virtue is forgotten fastest"],
        ["WHITE RICE", "≈ 0.960", "≈ 17 legs", "Nothing to remember"],
        ["THE NARCISSIST", "≈ 0.985", "≈ 46 legs", "The audience has a long memory"],
        ["THE MEGALOMANIAC", "≈ 0.990", "≈ 69 legs", "Empires are remembered"],
        ["THE PROSTITUTE", "≈ 0.995", "≈ 138 legs", "A sell-out is never forgiven"],
    ]),
    ("p", "Same event, twelve legs of decay or a hundred and thirty-eight, purely by which face it lands on. That single table is the product's most legible idea."),
    ("p", "The asymmetry vector γ⃗ comes free: bayesian-conviction.ts#egarchLogVar already ships γ = −0.08 leverage, so bad news raises variance more than equivalent good news. Made per-face and explicit, it states the thing plainly — REDEMPTION IS MATHEMATICALLY SLOWER THAN DISGRACE. That is not a slogan bolted on; it falls out of a function already in the repository."),

    ("h2", "4.4 Implied temperature — a two-factor surface"),
    ("li", "gambit-game-math.ts#calculateSoftmax gives P(i) = e^(V_i/τ) / Σ e^(V_j/τ); τ is the temperature the code calls the crowd's decisiveness slider"),
    ("li", "Invert it (Newton solve) against each observed layer for τ_perm and τ_trans — implied volatility, for persona markets"),
    ("li", "That yields a τ surface across subjects, a τ term structure across legs, and a τ smile across the five faces. The platform currently has NO volatility product; this is one"),

    ("h1", "5. Market Structure & Cadence"),
    *MPP_PRICING,
    *LUNAR_CADENCE,
    ("li", "THE CROWNING — at leg close the dominant PERMANENT face is crowned. You crown who they are, not who they seemed"),
    ("li", "THE SLIP — a Divergence blowout: D breaks its band, meaning today's mask has detached from the core. Position caps open for one leg-eighth and the event is tagged on-chain as slip-flow. Math-native trigger; no verdict oracle required"),
    ("li", "Position cap per face: δ = π × Multiplier × √ConvictionStake — #calculateDeltaLimit, applied PER FACE PER LAYER so no single holder can own the portrait"),
    ("li", "Kelly: half-Kelly default — #kellyFraction(pWin, netOdds, 0.5); the neglected faces naturally carry the fat odds"),
    ("li", "Perpetual invariant: no face may price below 0.02 or above 0.88 in either layer. A persona market that fully resolves has stopped being perpetual — the floor and ceiling are what keep every face permanently tradeable"),

    ("h1", "6. THE TRADEABLE STACK"),
    ("p", "Four layers, three token standards, one rule: positions are liquid and open, reputation is soulbound. Money moves; character does not."),

    ("h2", "6.1 L1 — POSITIONS (ERC-1155 conditional tokens)"),
    ("li", "One token id per (subject, leg, face, layer) — five faces × two layers = 10 ids per subject-leg"),
    ("li", "Standard conditional-token pattern (Gnosis CTF lineage). Transferable, wallet-native, and tradeable on ANY ERC-1155 venue without platform permission"),
    ("li", "Natively fractional and bundle-able. A DIVERGENCE BASKET — long D across twenty subjects — is a bundle contract over existing ids, so an index product costs no new market infrastructure"),
    ("li", "Positions are the only fully open object in the stack. Everything above this layer is either provenance or soulbound"),

    ("h2", "6.2 L2 — THE PORTRAIT (ERC-721, minted every Crowning)"),
    ("li", "At each leg close the subject's full state mints as a portrait: permanent simplex, transitory shell, D, τ_perm/τ_trans, crowned face, leg index, and lunar illumination at settlement"),
    ("li", "One per subject per leg. FOREVER — the series never stops minting and has no cap"),
    ("li", "Rarity is EMERGENT, NOT ASSIGNED. A Slip leg is rare because Slips are rare; a leg where H_perm collapsed to near zero is rare because coherence is rare. Scarcity is a measured market event, never a trait table — the most honest rarity model available to an NFT series"),
    ("li", "Because the mint is deterministic from settlement state, the portrait is independently verifiable against chain history. Provenance needs no trust in the issuer"),

    ("h2", "6.3 L3 — ATTESTATIONS (ERC-5192 soulbound; POAP-compatible)"),
    ("li", "Non-transferable proof of conviction history — the reputation layer: \"held the permanent Saint through the Slip of Leg 14\", \"called the Divergence within 5%\", \"crowned the same face 8 legs running\""),
    ("li", "Milestone thresholds reuse VRS_TRIGGERS [5, 8, 13, 21, 34] and #streakReward, so the attestation ladder is Fibonacci and already defined"),
    ("li", "POAP proper lives on Gnosis Chain; on Base/Arbitrum the native equivalent is ERC-5192 (minimal soulbound NFT), with an optional POAP mirror purely for the social/collector layer"),
    ("li", "Soulbound is load-bearing, not decorative: it is exactly what stops a whale buying a track record. In a persona market, a purchasable reputation would void the entire premise"),

    ("h2", "6.4 L4 — TOKEN-BOUND ACCOUNTS (ERC-6551) — the composability unlock"),
    ("li", "Give every MADCard a token-bound account so the CARD OWNS ITS OWN HISTORY — its portraits, its attestations, its position receipts"),
    ("li", "Sell the card and the entire provenance travels with it, atomically, without a migration step"),
    ("li", "Makes the existing card-evolution.ts ladder on-chain-legible: evolutionLevel L1–L4, Golden Aura, Affliction, 48h Clown state, and sagaContributions (madConvDelta, memesContributed, liesCalled, garchEventsSurvived, calibrationScore) become inspectable by any third party"),
    ("li", "This is the standard that makes \"living cards\" a real object rather than a database row with art attached"),

    ("h2", "6.5 Open tradeables — the honest feasibility answer"),
    ("p", "Yes, it is possible, and the position layer should be genuinely open. Three consequences must be designed for rather than discovered later."),
    ("table", [
        ["Consequence", "Why", "The design response"],
        ["Royalties are not enforceable", "ERC-2981 is a signal, not a guarantee; major venues made creator royalties optional", "Do NOT build revenue on secondary royalties. Revenue stays 1.88% primary + Shield premiums + packs. Secondary is distribution, not income"],
        ["Open secondary arbitrages the bond", "Free 1155 trading lets external price diverge from the MPP curve", "Treat as healthy — arbitrage keeps the bond honest and deepens liquidity — but #calculateSlippageCushion must be parameterised for it. This is a live risk-engine question, not a footnote"],
        ["The compliance surface widens", "Freely transferable outcome positions on open venues read differently to regulators than closed in-app conviction", "Counsel review before the position layer opens. Do not assume the in-app framing transfers"],
    ]),
    ("p", "One knock-on: open tradeability dissolves the Prostitute class's exclusive right to sell a position mid-leg, since everyone can. Replace the privilege with FEE TREATMENT — the Prostitute face pays zero platform fee on secondary transfer and takes a share of realised royalty flow. The archetype survives contact with open markets, expressed economically instead of by gatekeeping."),

    ("h2", "6.6 What each layer is actually for"),
    ("table", [
        ["Layer", "Standard", "Transferable", "Purpose"],
        ["Positions", "ERC-1155", "Yes — fully open", "Liquidity, price discovery, index construction"],
        ["Portraits", "ERC-721", "Yes", "Provenance and collecting; emergent rarity"],
        ["Attestations", "ERC-5192 (+ POAP mirror)", "No — soulbound", "Reputation that cannot be bought"],
        ["Cards", "ERC-721 + ERC-6551 TBA", "Yes, with history attached", "Identity container; carries the other three"],
    ]),

    ("h1", "7. MAD Shield on a decomposed simplex"),
    ("li", "Premium: Stake × P(win) × √Volatility × SafetyMargin(0.35), clamped 2–4% — #calculateShieldPremium, unchanged"),
    ("li", "Product insight worth marketing: across ten books (5 faces × 2 layers) P(win) is structurally low, so the premium lands near the 2% floor for most positions. Shield is CHEAPER here than anywhere else on the platform"),
    ("li", "Recovery 28.8% / 40% / 60% — #shieldRecovery, #calculateShieldPayoutFull/Tiered; φ-ratio variant #shieldPhiRatio for extreme-volatility legs"),
    ("li", "Shield covers the loss on your face AND LAYER only. Hedging permanent against transitory on the same face is legal, cheap, and precisely the trade the Divergence book exists to price"),
    ("li", "Framing unchanged: loss mitigation, never insurance, never a subsidy"),

    ("h1", "8. Example markets"),
    ("li", "A top-5 AI lab founder — permanent Megalomaniac vs transitory Saint; D over four legs"),
    ("li", "A legacy media institution — is the White Rice permanent, or is it a phase before capture?"),
    ("li", "A celebrity wellness brand — Saint-to-Prostitute permanent drift index"),
    ("li", "A frontier model's own public persona — the first non-human simplex; H_perm is a genuinely open question"),
    ("li", "A crypto exchange twelve months after a regulatory settlement — γ⃗ asymmetry in live testing"),
    ("li", "A sports franchise ownership group through a relocation fight — Slip candidate"),
    ("li", "DIVERGENCE BASKET — long D across the twenty highest-volume subjects, as a single bundled position"),

    ("h1", "9. Compliance rails"),
    ("p", "This family is intentionally provocative; that is a product decision. Provocation is priced in, legal exposure is not. Four of the five names are opinion-coded archetypes with long satirical precedent. One is not: applied to a named living person, THE PROSTITUTE carries materially more defamation and harassment exposure than the other four combined. These rails are load-bearing."),
    ("li", "CODEX AT BET TIME — the locked definition renders adjacent to every stakeable label and ships on-chain with the criteria. THE PROSTITUTE is defined in-product as the Sell-Out archetype and explicitly disclaimed as a claim about sexual conduct"),
    ("li", "OPINION FRAMING IN RESOLUTION — criteria read \"measured persona-perception decomposition\", never \"did X do Y\". The market prices a reading, not a fact, and no leg may resolve on an unadjudicated allegation"),
    ("li", "SUBJECT GATE — public figures acting in a public capacity, brands, and institutions only. Hard-blocked: private individuals, minors, and any persona-to-protected-class mapping"),
    ("li", "DISPLAY-MODE TOGGLE — PERSONA_DISPLAY_MODE swaps to broadcastName for app stores, ad networks and restrictive jurisdictions without forking the product"),
    ("li", "NAMED-SUBJECT LAUNCH IS A SEPARATE DECISION — recommend launching on institutions, brands, models and indices, adding named public figures only under counsel review once the Codex has a track record. Gossip-Cop names people because it asks about events; Five Faces assigns character, which is a different legal object"),
    ("li", "OPEN TRADEABILITY IS ALSO A SEPARATE DECISION — see §6.5. The position layer can ship closed first and open later; the reverse is not possible"),
    ("li", "UNCHANGED RAILS — Shield is loss mitigation only; no real-world illegal outcome prediction; all criteria on-chain and in UI; 30-day minimum maturity on every leg; entertainment conviction and satire throughout"),

    ("h1", "10. Technical Development Scope"),
    ("h2", "10.1 Smart contracts"),
    ("li", "MADPersonaSimplex.sol — decomposed n=5 simplex, per-layer books, Σp ≈ 1 across the re-projection, face floor 0.02 / ceiling 0.88"),
    ("li", "MADFacesPerp.sol — lunar leg state machine, Crowning, Slip window, position roll, conviction compounding across legs"),
    ("li", "MADPositionToken.sol — ERC-1155 conditional positions, one id per (subject, leg, face, layer)"),
    ("li", "MADPortrait.sol — ERC-721, deterministic mint from settlement state at each Crowning"),
    ("li", "MADAttestation.sol — ERC-5192 soulbound, Fibonacci milestone ladder"),
    ("li", "ERC-6551 registry integration for MADCard token-bound accounts (registry is a deployed public singleton; the work is the account implementation and the card wiring)"),
    ("li", "Reuse: MADMarketFactory, MADStaking, MADShieldVault, RiskOracle, MADOptimisticOracle"),
    ("li", "Foundry fuzz + invariants: Σp ≈ 1 after re-projection · monotonic cost · never insolvent · no face outside [0.02, 0.88] in either layer · permanent component never negative · D finite and signed on both sides · 1155 supply conservation across transfer AND settlement"),
    ("h2", "10.2 Backend"),
    ("li", "NEW persona-codex.ts — five faces, codex/broadcast names, ρ⃗, γ⃗, α per face, δ and Kelly bounds"),
    ("li", "NEW persona-decompose.ts — per-face CGARCH, simplex re-projection and renormalisation, H_perm/H_trans, D, implied-τ Newton inversion"),
    ("li", "NEW tradeable-registry.ts — id derivation for (subject, leg, face, layer), portrait metadata builder, attestation milestone evaluator"),
    ("li", "market-classifier.ts — add type=\"faces\" + personaEligible ahead of gossipcop; extend MarketType, buildTitle, buildResolution"),
    ("li", "Reused unchanged: mpp-math.ts (calculateMppPrice, calculateSlippageCushion, calculateConviction) · bayesian-conviction.ts (cgarchUpdate, egarchLogVar, sequentialLogOddsUpdate, brierScore, logScore) · gambit-game-math.ts (calculateSoftmax, calculateDeltaLimit, kellyFraction, lunar, Shield, splitFee, streakReward) · card-evolution.ts"),
    ("li", "APIs: POST /api/v1/faces/{codex,classify,open,allocate,decompose,divergence,slip,crown,roll,shield} · /api/v1/tradeables/{position,portrait,attestation,basket}"),
    ("h2", "10.3 Frontend / app"),
    ("li", "THE WATERLINE — the hero instrument. Permanent simplex rendered below the line, transitory shell above, D as the visible gap, τ_perm/τ_trans on the bezel. Analog-dial language inherited from the Z-Liar Meter"),
    ("li", "Codex popover on every stakeable label (compliance-required, not optional)"),
    ("li", "Half-life readout per face, in legs and in lunations"),
    ("li", "Slip takeover: full-bleed alert when D breaks its band, with the cap-unlock countdown"),
    ("li", "Crowning ceremony at leg close — permanent face crowned, portrait mint animation, Golden Aura and Affliction reveals"),
    ("li", "Tradeables drawer: positions held, portraits owned, attestations earned (visibly non-transferable), and the card TBA contents"),
    ("h2", "10.4 Phased build"),
    ("li", "Phase 1 — persona-codex + classifier extension + parimutuel decomposed markets on institution/brand subjects. Ship the Codex and the Waterline first; they are the product"),
    ("li", "Phase 2 — MPP bonding maker, lunar legs, Crowning, Shield integration, D as a readout"),
    ("li", "Phase 3 — D as a TRADEABLE book, implied-τ surface, Slip events"),
    ("li", "Phase 4 — tradeable stack: ERC-1155 positions (closed transfer first), portrait mint, soulbound attestations"),
    ("li", "Phase 5 — open transfer on positions (counsel-gated), ERC-6551 card accounts, Divergence baskets, named-public-figure subjects under review"),

    ("h1", "11. Success Metrics"),
    ("li", "Five Faces volume ≥ 20% of platform by Y2, measured in net-new wallets rather than share, so cannibalisation of Gossip-Cop is visible"),
    ("li", "Average hold > 60 days — longer than Gossip-Cop (30d) and Epiphanies (45d); the lunar leg and conviction compounding both push that way"),
    ("li", "Shield opt-in ≥ 55%, the platform's highest, on the §7 low-P(win) premium argument"),
    ("li", "Divergence book ≥ 25% of family volume by Y2 — if D is not being traded, the thesis has not landed"),
    ("li", "Portrait secondary: ≥ 40% of Slip-leg portraits change hands within two legs of mint"),
    ("li", "Attestations earned per active wallet ≥ 3 per year; zero successful transfer attempts (soulbound holds)"),
    ("li", "Zero substantiated defamation complaints. This is a metric, and it is the one that closes the product if it moves"),

    ("h1", "12. Open Decisions for Founder Sign-Off"),
    ("li", "Open transfer on ERC-1155 positions — in or out at launch. Recommendation: ship closed, open in Phase 5 under counsel review. Closed-to-open is reversible; open-to-closed is not"),
    ("li", "Named public figures as subjects — recommendation: out at launch, pending Codex track record"),
    ("li", "ρ⃗ and γ⃗ tuning — the values in §4.3 are a proposal and need a live-data calibration pass. Proprietary, server-side, never in external materials"),
    ("li", "Face floor/ceiling (0.02 / 0.88) — this invariant defines \"perpetual\" for the family and should be locked at canonical-constant governance tier"),
    ("li", "Whether the Prostitute fee treatment (§6.5) is zero-fee on secondary, a royalty share, or both"),
    ("li", "Chain target for the tradeable stack — the §13 chain question in MASTER_MATHS is still open and this family cannot ship a token stack until it is settled"),
]

# ── PERP 2 — ZEITGEIST ───────────────────────────────────────────────────────

ZEITGEIST = [
    ("brand", "MΛDHAT'S GAMBIT"),
    ("title", "ZEITGEIST"),
    ("sub", "Perpetual Trend Succession — the slate is reseeded every lunar year, the conviction never settles"),
    ("meta", "Product Sheet + Technical Development Scope  |  Maths from MASTER_MATHS_AND_ALGORITHMS.md  |  v0.1  |  August 2026"),

    ("h1", "1. Product Overview"),
    ("p", "Zeitgeist is a perpetual with a MUTABLE STATE SPACE. Each lunar year the top two-to-three media / social-media / influencer trends become the tradeable slate. Each trend is then scored on the five-persona axis — the personas are the lens, not the outcome set."),
    ("p", "The question is never \"will this trend happen\". It is: what KIND of thing is this trend? Is 2026's anti-AI authenticity revolt genuine virtue, or the most profitable Saint performance of the year?"),
    ("p", "And when the year turns, positions do not settle. They transmigrate into the new slate along a measured succession matrix. Your conviction outlives the trend that started it."),
    ("p", "Tagline: \"The slate changes. Your conviction doesn't.\""),
    ("p", "Core Loop: DETECT → NOMINATE → AUCTION SLOTS → SCORE ON FIVE FACES → CONVICT → ROLL LEGS → THE TURNING → TRANSMIGRATE → CONTINUE"),

    ("h1", "2. The 2026 Slate (researched — see §13)"),
    ("table", [
        ["Slot", "Trend", "The persona question"],
        ["I", "THE AUTHENTICITY REVOLT — anti-AI positioning as consumer strategy", "SAINT or PROSTITUTE?"],
        ["II", "SYNTHETIC INFLUENCE — virtual and faceless creators scaling anyway", "NARCISSIST or WHITE RICE?"],
        ["III", "THE COMMERCE FLOOR — social commerce and the creator middle class", "PROSTITUTE, unambiguously — the only live question is at what price"],
    ]),
    ("h2", "2.1 Slot I — THE AUTHENTICITY REVOLT"),
    ("li", "Only 26% of consumers prefer generative-AI creator content — down from 60% in 2023"),
    ("li", "Dove's pledge not to use AI-generated models won the Media Grand Prix at Cannes Lions 2025; Aerie's \"No AI-generated bodies or people. Ever.\" drew its most engaged Instagram response in a year"),
    ("li", "New York's synthetic-performer law takes effect June 2026, creating penalties for deceptive use of AI-generated performers in advertising"),
    ("li", "91% of consumers expect transparency about AI use in marketing; brands are deliberately reintroducing imperfection — unpolished audio, natural pacing — as a humanity signal"),
    ("li", "The bet: is this a permanent Saint reading, or does the permanent component resolve to Prostitute once anti-AI positioning is fully priced as a marketing tactic?"),
    ("h2", "2.2 Slot II — SYNTHETIC INFLUENCE"),
    ("li", "Virtual influencers compounding at 41.7% CAGR, moving from experimental niche to a primary pillar of brand strategy"),
    ("li", "AI influencers earned roughly $6B last year; the global influencer market has passed $250B"),
    ("li", "AI has produced a wave of faceless creators and fully automated accounts, expanding the measured size of the creator economy"),
    ("li", "The bet — and the reason this slot exists: Slot I and Slot II are growing SIMULTANEOUSLY. The contradiction is the trade. A market that can hold both is pricing something real about the year"),
    ("h2", "2.3 Slot III — THE COMMERCE FLOOR"),
    ("li", "TikTok Shop: $66B global GMV in 2025, projected $112.2B in 2026; US sales +108% YoY to $15.82B"),
    ("li", "1.8M active US merchant partners; $47.3B GMV across the first three quarters of 2026; creator earners +146% YoY with 16,000+ creators at six-figure sales"),
    ("li", "But the floor is the story: 48.7% of creators earn under $10K and 76% of TikTok posts get under 1,000 views. Mid-tier creators (100K–500K) hold 4–8% engagement against 1–2% for mega-creators"),
    ("li", "The bet: does the middle class consolidate, or does the floor fall out? Persona reading is fixed; the magnitude is not"),

    ("h1", "3. Canonical Constants (unchanged — gambit-game-math.ts#PLATFORM)"),
    CANONICAL_CONSTANTS,

    ("h1", "4. The Persona Lens"),
    MASK_CODEX,
    CODEX_NOTE,
    ("p", "Applied to trends rather than people, the Codex reads as cultural criticism rather than character assessment — which is exactly why Zeitgeist is the safest surface in the family (§10)."),

    ("h1", "5. THE TURNING — the core new maths"),
    ("p", "A perpetual whose outcome set changes cannot simply settle and reopen; that would be a series of annual markets wearing a perpetual's clothes. The Turning is the mechanism that makes a mutable state space mathematically coherent."),
    ("h2", "5.1 The Succession Matrix S"),
    ("p", "S[i][j] is the share of retiring trend i's conviction that inherits into new trend j. It is MEASURED, not decreed:"),
    ("li", "LINEAGE (measured) — heat-score.ts#computeHeatForPool already implements cross-source clustering: two headlines are \"the same story\" when they share ≥ 2 significant tokens. Run it between the retiring trend's corpus and each candidate's corpus to get an overlap score. The trend engine already exists; it was simply built for headline ranking"),
    ("li", "CROWD (voted) — quadratic: #votingPower (√stake, capped 240) aggregated by #quadraticMatch, so many small holders outweigh one whale"),
    ("li", "BLEND — S = w_m·L_measured + w_v·V_quadratic, then ROW-NORMALISED so Σ_j S[i][j] = 1"),
    ("p", "That normalisation is the whole invariant: CONVICTION IS CONSERVED ACROSS A TURNING. Nothing is destroyed at a reseed, nothing is minted from nothing, and no position is ever force-settled. Your stake reincarnates along measured lineage."),
    ("h2", "5.2 Cadence — the Turning rides the lunar year"),
    ("li", "Leg = 2 synodic months = 59.061 days"),
    ("li", "THE TURNING = 6 legs = 354.37 days = exactly one lunar year (12 × 29.530588853)"),
    ("li", "So the reseed drifts roughly 11 days earlier against the solar calendar each year. That is a feature: the slate turns on its own clock, not the ad industry's, and it is uncopyable without the 1979-12-08 epoch"),
    ("h2", "5.3 THE VINTAGE"),
    ("li", "Every position carries the year it entered. A 2026 vintage still live in 2031 has survived five Turnings"),
    ("li", "C(t) = C_max·(1 − e^(−αt)) compounds across the whole span — #calculateConviction — and #streakReward with VRS_TRIGGERS [5,8,13,21,34] pays the Fibonacci ladder on consecutive Turnings survived"),
    ("li", "Vintage is provenance, which is why it plugs directly into the Five Faces tradeable stack as a collectible attribute on the position and the portrait"),

    ("h1", "6. The Maths Array"),
    ("p", "Zeitgeist deliberately draws on a WIDE span of the canonical library rather than one primitive. Every entry earns its place."),
    ("table", [
        ["Function", "Role in Zeitgeist"],
        ["heat-score.ts#computeHeatForPool", "Trend detection AND the lineage measurement for S. Weights: crossSource .30 · engagementEst .25 · virality .15 · velocity .15 · satire .10 · authority .05"],
        ["mpp-math.ts#calculateConviction", "Trend adoption — saturating growth C(t) = C_max(1 − e^(−αt))"],
        ["#stochasticDecay", "Trend burnout — e^(−(α+½σ²)t + σW_t), geometric Brownian. A trend's life is the race between these two curves"],
        ["#calculateSoftmax(speeds, τ)", "Liquidity allocation across the slate — the first use that matches the function's own stated purpose"],
        ["#getAuctionPrice + SCANDAL_PACK_TIERS", "Slot auction at the Turning: candidates bid Dutch for the seats, $8.88 floor to $296 cap"],
        ["#calculateVictoryProbability / #mmrDelta (K=32)", "Candidate trends fight for slots; incumbents defend. mmrDelta is already asymmetric — a win pays K(1.1 − pWin), a loss is shielded by stage — so incumbency is mathematically advantaged"],
        ["#calculateTournamentScores → structuralStrain", "Trends wear out: 4–10% strain on a win, 11–22% on a loss, 0.6× reward cut above 50% wear. An over-traded trend degrades; a rested one recovers"],
        ["bayesian-conviction.ts#propagateTree (depth ≤ 64)", "The succession tree — 64 legs of lineage. Backward induction values a position by every future it could inherit into"],
        ["#voiEstimate", "Is opening a fourth slot this year worth the information it would buy?"],
        ["#quadraticMatch / #votingPower (cap 240)", "Community nominates next year's slate; whale-resistant by construction"],
        ["#calculateEigenTrustScore", "Weights nominators by whether their past nominations proved out"],
        ["#egarchLogVar (γ = −0.08)", "Backlash asymmetry — bad news kills a trend faster than good news builds it. Directly observable in the 60% → 26% collapse in AI-content preference"],
        ["#getLunarPhaseMultiplier / #getLunarIllumination", "Leg cadence, settlement modulation, and the Turning on the lunar year"],
        ["#calculateMppPrice / #calculateSlippageCushion", "Bonding curve and the flash-loan guard across the Turning window, when manipulation incentive peaks"],
    ]),

    ("h1", "7. Market Structure"),
    *MPP_PRICING,
    ("li", "Each slot is a five-face simplex on that trend, so Zeitgeist inherits the Five Faces decomposition where useful — a trend also has a permanent component and a phase"),
    ("li", "Slot count is 2 or 3, decided annually by #voiEstimate against the nomination pool. Three is the default; two when the year is genuinely dominated"),
    ("li", "Position cap per slot: δ = π × Multiplier × √ConvictionStake — #calculateDeltaLimit"),
    ("li", "The Turning window is the highest-manipulation-incentive moment in the product; the slippage cushion tightens across it and slot-auction bids are commit-reveal"),

    ("h1", "8. Example markets"),
    ("li", "\"Is THE AUTHENTICITY REVOLT a permanent Saint, or a Prostitute wearing a halo?\" — the flagship 2026 market"),
    ("li", "\"Does SYNTHETIC INFLUENCE score White Rice or Narcissist as its permanent face?\" — a genuinely open read"),
    ("li", "\"Slot III magnitude: does the creator middle class consolidate or does the floor fall out?\""),
    ("li", "\"Which 2026 slot survives the 2027 Turning with the largest inherited conviction?\" — a direct bet on S"),
    ("li", "\"Will the 2027 slate contain a trend with no 2026 lineage at all?\" — a bet on discontinuity itself"),
    ("li", "VINTAGE INDEX — long the 2026 cohort against all later vintages"),

    ("h1", "9. Interlock with Five Faces"),
    ("li", "Zeitgeist vintages are provenance objects that the Five Faces portrait and attestation layers record"),
    ("li", "A trend that scores high-permanent on a face in Zeitgeist raises that face's prior in Five Faces"),
    ("li", "A face with high measured persistence in Five Faces raises its weight when scoring next year's slate"),
    ("li", "One supplies evidence, the other supplies legitimacy. They are a pair, not two products sharing a brand"),

    ("h1", "10. Compliance — and the compliance dividend"),
    ("p", "The subjects here are TRENDS, not people. \"Is the Authenticity Revolt a Saint or a Prostitute?\" is commentary on a market phenomenon, not a claim about any person. That gives Zeitgeist a near-zero defamation surface and makes it the safest thing in the family — which is why it should ship FIRST, ahead of Five Faces, and establish the Codex's track record on subjects that cannot sue."),
    ("li", "Codex renders at bet time, on-chain with criteria, same as Five Faces"),
    ("li", "Named individuals are never the subject of a slot. Where a trend is strongly associated with a person or brand, the market is on the TREND and the criteria must say so explicitly"),
    ("li", "Trend nominations are moderated against the same subject gate: no protected-class mapping, no minors, no real-world illegal outcome prediction"),
    ("li", "Sourcing transparency: every slot publishes the corpus and the measured figures behind it, and every figure carries its source (§13). A slate nobody can audit is a slate nobody should trade"),
    ("li", "Shield is loss mitigation only; 30-day minimum maturity on every leg; entertainment conviction and satire throughout"),

    ("h1", "11. Technical Development Scope"),
    ("h2", "11.1 Smart contracts"),
    ("li", "MADZeitgeistSlate.sol — slot registry, per-slot simplex, annual slate lifecycle"),
    ("li", "MADTurning.sol — the succession matrix, row-normalised transmigration, conviction-conservation invariant, vintage stamping"),
    ("li", "MADSlotAuction.sol — Dutch auction over slot seats, commit-reveal bids across the Turning window"),
    ("li", "Reuse: MADMarketFactory, MADStaking, MADShieldVault, RiskOracle, MADOptimisticOracle, and the Five Faces position/portrait/attestation contracts"),
    ("li", "Foundry fuzz + invariants: S rows sum to 1 (±dust) · total conviction conserved across a Turning · no position force-settled · vintage monotone · slot count ∈ {2,3} · auction cannot clear below floor"),
    ("h2", "11.2 Backend"),
    ("li", "NEW trend-slate.ts — slate lifecycle, nomination pool, slot auction, vintage ledger"),
    ("li", "NEW succession.ts — S construction from measured lineage + quadratic vote, row normalisation, transmigration execution"),
    ("li", "NEW trend-lifecycle.ts — adoption (#calculateConviction) against burnout (#stochasticDecay), with the EGARCH backlash term"),
    ("li", "heat-score.ts — reused as-is for detection and lineage; no changes needed, which is the point"),
    ("li", "market-classifier.ts — add type=\"zeitgeist\" with slot-aware titles and resolution copy"),
    ("li", "APIs: POST /api/v1/zeitgeist/{slate,nominate,auction,score,convict,roll,turning,succession,vintage}"),
    ("h2", "11.3 Frontend / app"),
    ("li", "THE ALMANAC — the hero instrument. Current slate with five-face scores, the live succession matrix as a flow ribbon, and every past slate with its lineage edges drawn forward through time"),
    ("li", "Turning countdown in legs and lunations, with the lunar-year drift shown honestly"),
    ("li", "Vintage badge on every position; vintage index chart"),
    ("li", "Slot auction room — Dutch clock, commit-reveal state, nomination pool with EigenTrust-weighted nominators"),
    ("li", "Per-slot corpus viewer: the actual headlines and figures behind a trend, with sources"),
    ("h2", "11.4 Phased build"),
    ("li", "Phase 1 — hardcoded 2026 slate, five-face scoring, parimutuel markets. Ship the Almanac and the three slots"),
    ("li", "Phase 2 — MPP bonding, lunar legs, Shield, trend-lifecycle curves as readouts"),
    ("li", "Phase 3 — THE TURNING: succession matrix, transmigration, vintage ledger. This is the phase that makes it a perpetual"),
    ("li", "Phase 4 — nomination pool, slot auction, EigenTrust weighting, VOI-driven slot count"),
    ("li", "Phase 5 — Five Faces interlock: shared tradeable stack, vintage as a portrait attribute, cross-product priors"),

    ("h1", "12. Success Metrics"),
    ("li", "Slate survives its first Turning with ≥ 70% of conviction transmigrated rather than withdrawn — the single metric that proves the mechanism"),
    ("li", "Zeitgeist volume ≥ 15% of platform by Y2"),
    ("li", "Average hold spans at least one Turning for ≥ 35% of positions"),
    ("li", "Nomination participation ≥ 25% of active wallets per Turning"),
    ("li", "Succession matrix agreement: measured lineage and quadratic vote agree on the dominant edge in ≥ 70% of rows. Persistent disagreement means w_m/w_v needs retuning"),
    ("li", "Slot auction clears above floor in every seat; no seat goes unbid"),
    ("li", "Zero defamation complaints — expected to be structurally trivial here, which is the point of shipping this one first"),

    ("h1", "13. Open Decisions for Founder Sign-Off"),
    ("li", "Ship order. Recommendation: Zeitgeist FIRST — near-zero defamation surface, it proves the Codex and the lunar cadence on subjects that cannot sue, and Five Faces inherits a working tradeable stack"),
    ("li", "w_m / w_v blend weights in the succession matrix — measured lineage versus crowd vote. Proposal: start 0.6 / 0.4 and calibrate after the first Turning"),
    ("li", "Slot count policy — hard 3, or VOI-driven 2-or-3. Proposal: VOI-driven from Phase 4, hard 3 before that"),
    ("li", "Whether a trend may be re-slated after retiring (a comeback), and whether its old vintage is restored or a new one issued"),
    ("li", "Who curates the nomination pool in Phase 1 before EigenTrust has data — founder-curated is the honest answer, and should be labelled as such in-product"),
    ("li", "Whether the Turning is hard-coded to the lunar year or governance-adjustable. Recommendation: hard-coded. An adjustable reseed date is an attack surface"),

    ("h1", "14. Sources for the 2026 Slate"),
    ("li", "Influencer Marketing Factory — Creator Economy Report 2026: theinfluencermarketingfactory.com/creator-economy-report/"),
    ("li", "Digiday — \"After an oversaturation of AI-generated content, creators' authenticity and 'messiness' are in high demand\": digiday.com/media/"),
    ("li", "Playbella — 2026 Global Report on Synthetic Influence: playbella.org/blog/2026-ai-influencer-landscape-report"),
    ("li", "eMarketer — FAQ on social commerce: how creators and platforms power shopping in 2026: emarketer.com"),
    ("li", "TikTok Shop Statistics 2026 (GMV, sellers, category benchmarks): branvas.com/blogs/news/tiktok-shop-statistics"),
    ("li", "Sprout Social — Influencer Marketing Trends for 2026: sproutsocial.com/insights/influencer-marketing-trends/"),
    ("li", "CreatorIQ — Influencer Marketing Trends 2026: creatoriq.com/blog/influencer-marketing-trends-2026"),
    ("p", "Every figure quoted in §2 is traceable to the list above. The slate is rebuilt from fresh sources at each Turning, and the corpus ships with the slot."),
]

SHEETS = {
    "FIVE_FACES_Product_Sheet_Technical_Spec": {
        "blocks": FIVE_FACES,
        "title": "MAD Gambit — Five Faces: Perpetual Persona Decomposition",
        "header": "MAD Gambit — Five Faces: Perpetual Persona Decomposition  |  Product Sheet & Technical Spec  |  Canonical Maths Integrated",
    },
    "ZEITGEIST_Product_Sheet_Technical_Spec": {
        "blocks": ZEITGEIST,
        "title": "MAD Gambit — Zeitgeist: Perpetual Trend Succession",
        "header": "MAD Gambit — Zeitgeist: Perpetual Trend Succession  |  Product Sheet & Technical Spec  |  Canonical Maths Integrated",
    },
}

# ── OOXML emitters ───────────────────────────────────────────────────────────


def esc(t):
    return escape(t, {'"': "&quot;", "'": "&apos;"})


def run(text, *, bold=False, italic=False, color=None, size=18):
    rpr = FONT
    if bold:
        rpr += "<w:b/><w:bCs/>"
    if italic:
        rpr += "<w:i/><w:iCs/>"
    if color:
        rpr += f'<w:color w:val="{color}"/>'
    rpr += f'<w:sz w:val="{size}"/><w:szCs w:val="{size}"/>'
    return f'<w:r><w:rPr>{rpr}</w:rPr><w:t xml:space="preserve">{esc(text)}</w:t></w:r>'


def para(text, *, ppr="", **kw):
    return f"<w:p><w:pPr>{ppr}</w:pPr>{run(text, **kw)}</w:p>"


def table(rows):
    n = len(rows[0])
    width = 10800 // n
    grid = "".join(f'<w:gridCol w:w="{width}"/>' for _ in range(n))
    out = [
        '<w:tbl><w:tblPr><w:tblW w:type="dxa" w:w="10800"/><w:tblBorders>'
        '<w:top w:val="single" w:color="auto" w:sz="4"/><w:left w:val="single" w:color="auto" w:sz="4"/>'
        '<w:bottom w:val="single" w:color="auto" w:sz="4"/><w:right w:val="single" w:color="auto" w:sz="4"/>'
        '<w:insideH w:val="single" w:color="auto" w:sz="4"/><w:insideV w:val="single" w:color="auto" w:sz="4"/>'
        f"</w:tblBorders></w:tblPr><w:tblGrid>{grid}</w:tblGrid>"
    ]
    for r, cells in enumerate(rows):
        head = r == 0
        out.append("<w:tr>")
        for cell in cells:
            shd = '<w:shd w:fill="1a1a2e" w:val="clear"/>' if head else ""
            out.append(
                f'<w:tc><w:tcPr><w:tcW w:type="dxa" w:w="{width}"/><w:tcBorders>'
                '<w:top w:val="single" w:color="1a1a2e" w:sz="1"/><w:left w:val="single" w:color="1a1a2e" w:sz="1"/>'
                '<w:bottom w:val="single" w:color="1a1a2e" w:sz="1"/><w:right w:val="single" w:color="1a1a2e" w:sz="1"/>'
                f"</w:tcBorders>{shd}"
                '<w:tcMar><w:top w:type="dxa" w:w="50"/><w:left w:type="dxa" w:w="80"/>'
                '<w:bottom w:type="dxa" w:w="50"/><w:right w:type="dxa" w:w="80"/></w:tcMar></w:tcPr>'
                f'<w:p>{run(cell, bold=head, color="FFFFFF" if head else None, size=16)}</w:p></w:tc>'
            )
        out.append("</w:tr>")
    out.append("</w:tbl>")
    # a table must be followed by a paragraph, or two abutting tables merge
    out.append('<w:p><w:pPr><w:spacing w:after="60"/></w:pPr></w:p>')
    return "".join(out)


STYLES = {
    "brand": dict(ppr='<w:spacing w:after="60"/><w:jc w:val="center"/>', bold=True, color="1a1a2e", size=32),
    "title": dict(ppr='<w:spacing w:after="160"/><w:jc w:val="center"/>', bold=True, color="9B59B6", size=36),
    "sub": dict(ppr='<w:spacing w:after="60"/><w:jc w:val="center"/>', italic=True, size=18),
    "meta": dict(ppr='<w:spacing w:after="240"/><w:jc w:val="center"/>', color="666666", size=16),
    "h1": dict(ppr='<w:pStyle w:val="Heading1"/><w:spacing w:after="120" w:before="240"/>', bold=True, color="1a1a2e", size=26),
    "h2": dict(ppr='<w:pStyle w:val="Heading2"/><w:spacing w:after="80" w:before="180"/>', bold=True, color="2D1B4E", size=22),
    "p": dict(ppr='<w:spacing w:after="100"/>', size=18),
    "li": dict(ppr='<w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr><w:spacing w:after="40"/>', size=18),
}


def build_body(blocks):
    out = []
    for kind, val in blocks:
        if kind == "table":
            out.append(table(val))
        elif kind in STYLES:
            out.append(para(val, **STYLES[kind]))
        else:
            raise ValueError(f"unknown block kind: {kind}")
    return "".join(out)


def build_docx(blocks, dest, doc_title, header_text):
    src = zipfile.ZipFile(TEMPLATE)
    doc = src.read("word/document.xml").decode("utf-8")
    prefix = doc[: doc.index("<w:body>") + len("<w:body>")]
    sectpr = doc[doc.index("<w:sectPr>"):]
    new_doc = prefix + build_body(blocks) + sectpr

    hdr = src.read("word/header1.xml").decode("utf-8")
    hdr = re.sub(r'(<w:t xml:space="preserve">)(.*?)(</w:t>)',
                 lambda m: m.group(1) + esc(header_text) + m.group(3), hdr, count=1)

    core = src.read("docProps/core.xml").decode("utf-8")
    core = re.sub(r"<dc:title>.*?</dc:title>", f"<dc:title>{esc(doc_title)}</dc:title>", core)

    os.makedirs(os.path.dirname(dest) or ".", exist_ok=True)
    with zipfile.ZipFile(dest, "w", zipfile.ZIP_DEFLATED) as out:
        for item in src.infolist():
            if item.filename == "word/document.xml":
                out.writestr(item, new_doc)
            elif item.filename == "word/header1.xml":
                out.writestr(item, hdr)
            elif item.filename == "docProps/core.xml":
                out.writestr(item, core)
            else:
                out.writestr(item, src.read(item.filename))
    src.close()


def build_md(blocks, dest):
    lines = []
    for kind, val in blocks:
        if kind == "brand":
            continue
        if kind == "title":
            lines += [f"# MΛDHAT'S GAMBIT — {val}", ""]
        elif kind == "sub":
            lines += [f"*{val}*", ""]
        elif kind == "meta":
            lines += [f"`{val}`", "", "---", ""]
        elif kind == "h1":
            lines += [f"## {val}", ""]
        elif kind == "h2":
            lines += [f"### {val}", ""]
        elif kind == "p":
            lines += [val, ""]
        elif kind == "li":
            lines.append(f"- {val}")
        elif kind == "table":
            if lines and lines[-1].startswith("- "):
                lines.append("")
            head, *body = val
            lines.append("| " + " | ".join(head) + " |")
            lines.append("|" + "|".join(["---"] * len(head)) + "|")
            for row in body:
                lines.append("| " + " | ".join(c.replace("|", "\\|") for c in row) + " |")
            lines.append("")
    out, prev_li = [], False
    for ln in lines:
        if prev_li and not ln.startswith("- ") and ln != "":
            out.append("")
        out.append(ln)
        prev_li = ln.startswith("- ")
    with open(dest, "w") as f:
        f.write("\n".join(out).rstrip() + "\n")


if __name__ == "__main__":
    outdir = sys.argv[1] if len(sys.argv) > 1 else os.path.join(REPO, "docs")
    for stem, sheet in SHEETS.items():
        docx_path = os.path.join(outdir, stem + ".docx")
        md_path = os.path.join(outdir, stem.replace("_Technical_Spec", "") + ".md")
        build_docx(sheet["blocks"], docx_path, sheet["title"], sheet["header"])
        build_md(sheet["blocks"], md_path)
        print(f"wrote {docx_path} ({os.path.getsize(docx_path)} bytes)")
        print(f"wrote {md_path} ({os.path.getsize(md_path)} bytes)")
