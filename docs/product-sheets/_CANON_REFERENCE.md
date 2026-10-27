# Product-sheet canon reference

**Not a planning document.** `docs/MAD_GAMBIT_MASTER.md` remains the single source of truth for
plans, decisions and outstanding work. This file exists so that every sheet in this directory
quotes *identical, code-verified* numbers instead of each drifting from memory. If a number here
disagrees with `verify/lib/gambit-game-math.ts`, **the code wins and this file is the bug.**

Every value below was read out of the source on 2026-08-27, not transcribed from a deck.

## Fee model — corrected 2026-08-27, founder sign-off

> "There is a flat platform rake of 1.88%, the Community profit share is 28.8% of NET profits,
> the creator profit share is only from activity and fees from those creator made markets."

A **two-stage waterfall**, not a flat three-way split:

```
grossFee     = volume × 1.88%                    PLATFORM.FEE_BPS 188
creatorCut   = creator-made markets ONLY, rung × grossFee
platformNet  = grossFee − creatorCut             ← "net profits"
communityCut = platformNet × 28.8%               PLATFORM.COMMUNITY_SHARE_BPS 2880
protocolCut  = platformNet − communityCut
```

Worked example — 10,000 volume, creator market at the 40% rung:

| | Amount | % of gross |
|---|---|---|
| Gross fee | 188.0000 | 100% |
| Creator | 75.2000 | 40.00% |
| Platform net | 112.8000 | 60.00% |
| Community + DAO | 32.4864 | **17.28%** |
| Protocol | 80.3136 | 42.72% |

Implemented in `splitFee()`. Before 2026-08-27 the community cut came off **gross**, paying
54.144 instead of 32.4864 — an over-allocation of exactly **11.52 pp of gross**, logged in
`docs/boardy/CANONICAL_NUMBERS_2026-08-19.md` and now regression-tested.

## Locked platform constants

| Constant | Value | Code |
|---|---|---|
| Platform rake | 1.88% (188 bps) | `FEE_BPS` |
| Community + DAO | 28.8% **of net** | `COMMUNITY_SHARE_BPS` |
| $MADx supply | 888,888,888 fixed | `MADX_FIXED_SUPPLY` |
| Furnace burn cap | ≤ 4.9% | `FURNACE_BURN_CAP` |
| DL-LMSR liquidity *b* | 1,200 | `LMSR_DEFAULT_B` |
| Perp conversion gate | 0.60 | `PERP_TRIGGER_THRESHOLD` |
| Voting power cap | min(√stake, 240) | `VOTE_POWER_CAP` |
| Card pack | 4.88 $MADx · 5 cards · deck 992 · seed 8888 | `CARD_PACK_*` |

⚠️ The **design-deck mockups** hardcode "888 $MADx for 8 cards". The engine says **4.88 for 5**,
and `node-registry.ts` interpolates the constants so the app is correct. The decks are stale.

## MAD Shield

The Shield is a **scale, 28.8% → 40%** (founder, 2026-10-23: *"MAD Shield Stop Loss (28.8 to 40%), as well as, the Creator profit share (28.8 - 40%, vip 60%)"*; "The MAD Shield also offers a scale").

| Tier | Recovery | Code |
|---|---|---|
| Standard | 28.8% | `SHIELD_RECOVERY_PCT` |
| Premium dial | 28.8% → 40%, continuous in the 2–4% premium | `calculateShieldPayoutFull` |
| Staking-tier cap | Bronze 28.8 · Silver 32.8 · Gold 36.8 · MAD Tier 40% | `STAKING_TIERS[].shieldRecoveryPct` |
| **Ceiling** | **40%** | `SHIELD_RECOVERY_PREMIUM_PCT` |

⚠️ **Code diverges:** the engine also carries a 60% Whale/VIP/Partner rung (`SHIELD_RECOVERY_WHALE_PCT`,
`WHALE_SHIELD_ELIGIBILITY`). Canon has no 60% Shield rung — 60% is creator-side only. Never quote a 60% Shield
figure; removal is queued in MASTER §5 pending founder confirmation.

Premium = `Stake · P(win) · σ · 0.35`, clamped to **2%–4% of stake**
(`SHIELD_PREMIUM_MIN/MAX`, `SHIELD_SAFETY_MARGIN`). Loss mitigation only — never a guarantee.

## Creator ladder

| Status | Share | Unlocks at |
|---|---|---|
| User | 28.8% | — |
| MinorCreator | 40% | 12 tractioned markets |
| CR8TR | 60% | 34 tractioned markets AND 888 followers |

Traction = total conviction ≥ 1,200 $MADx (= LMSR *b*) **and** ≥ 1 settled payout.
Applies **only to the creator's own markets**. VIP (`VIP_STATUS_MIN_MADX` 888,888) is the
**capital-side** status and per the engine is *"never a creator tier"* — do not merge the two.

✅ **Settled 2026-10-23, founder:** *"There is a flat rake of 1.88% platform fee, creators take a sliding 28.8 to 40% and then a limited 4888 seats offering the rare and exclusive 60% VIP profit share exist."*

| Tier | Share | Gate |
|---|---|---|
| Creator — User | 28.8% | creator-made markets only |
| Creator — MinorCreator | 40% | 12 tractioned markets |
| **VIP profit share** | **60%** | **limited to 4,888 seats** — rare, exclusive |

The 28.8% floor is correct, not a conflation. *Corrected 2026-10-23:* this file previously called the
creator ladder a deliberate parallel of a "Shield 28.8 / 40 / 60 ladder" — the Shield stops at 40%, so the
only 60% is the VIP seat. ⚠️ **Code diverges:** `CREATOR_LADDER` still grants 60% as `CR8TR` by traction (34
markets + 888 followers) with no seat cap. Quote the canon above; mark any figure that depends on
the code's CR8TR route ‹verify›.

## GARCH(1,1) — the volatility spine

```
σ²ₜ₊₁ = ω + α·ε²ₜ + β·σ²ₜ        ω = 0.0001 · α = 0.05 · β = 0.90
σₜ₊₁  = CLAMP(√σ²ₜ₊₁, 0.09, 0.68)
amp   = 1 + 0.8·σ                 ≤ 1.544
```

Long-run variance = ω/(1−α−β) = **0.002**. Asymmetric variants: `egarchLogVar` (bad-news
leverage), `cgarchUpdate` (permanent/transitory decomposition — the Five Faces DIVERGENCE).

## Lunar legs

1 leg = 2 synodic months = **59.061177706 d** · 6 legs = 1 Turning = **354.367 d** (one lunar
year). Boundaries are **global**, anchored to the 1979-12-08 epoch, not to market creation.
`lib/lunar-legs.ts`.

## Conviction

```
MADConv = t^1.35 · c^0.75 · d^1.45 · ψ^1.15 · M_nft · L_θ
L_θ = 1.075 − 0.075·cos(2π·φ)      bounded [1.00, 1.15]
```

Time held (1.35) is weighted **above** capital (0.75). That exponent ordering is the ideology.

## Z-Liar bands

| Score | Verdict |
|---|---|
| ≥ 80 | TOTAL FABRICATION |
| ≥ 60 | SERIAL EMBELLISHER |
| ≥ 40 | SLIPPERY |
| ≥ 20 | MOSTLY CANDID |
| < 20 | STRAIGHT SHOOTER |

`ZLIAR_BANDS` / `zLiarVerdictFor` — one table, boundary-tested.

## Numbers that must NOT be used as proof

Per `docs/boardy/CANONICAL_NUMBERS_2026-08-19.md` §7 and §9c: user counts, TVL, APY boosts and
instrument sample values rendered in the demo surfaces are **placeholders**. Any sheet quoting a
traction figure must mark it ‹verify› or omit it.
