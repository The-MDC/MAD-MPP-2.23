# MAD Gambit — Master Maths & Algorithms (Single Source of Truth)

> **This is the one canonical maths document.** It supersedes and consolidates the
> previously-scattered maths notes (`engine-room-math-formulas.md`,
> `REPORTS/GARCH_VULKAN_ADVANCED.md`, `docs/VULKAN_MAD_MAPPING.md`,
> `docs/SHIELD_RISK_DEFENCES.md`, and the old 8-line `MASTER_MATHS_AND_ALGORITHMS.md`
> — all deleted in the 2026-08-16 consolidation; recoverable from git history),
> which now point here.
>
> **The code is the authority.** Every formula below cites its implementation home
> (`file#symbol`). Where a doc and the code disagreed, **the code wins** and the
> conflict is logged in §13. The canonical libs are:
> `verify/lib/gambit-game-math.ts` · `mpp-math.ts` · `bayesian-conviction.ts` ·
> `gdelt.ts` · `card-evolution.ts` · `sentiment.ts` · `market-classifier.ts` ·
> `joy-engineering.ts`.
>
> **Governance rule:** any change to a canonical constant here requires explicit
> founder sign-off (mirrors `.agents/skills/mad-gambit-math/references/canonical-numbers.md`).
> Coefficients marked proprietary stay server-side — never in external materials.

---

## §1 — Canonical constants (authoritative: `gambit-game-math.ts#PLATFORM`, `#STAKING_TIERS`)

| Constant | Value | Code home |
|---|---|---|
| Platform fee | **1.88%** (`FEE_BPS 188`) — never changes | `PLATFORM.FEE_BPS` |
| Creator share of fee | **40%** (`CREATOR_SHARE_BPS 4000`) — creator-made markets only | `PLATFORM.CREATOR_SHARE_BPS` |
| Community share of fee | **28.8%** (`COMMUNITY_SHARE_BPS 2880`) | `PLATFORM.COMMUNITY_SHARE_BPS` |
| Shield recovery — standard | **28.8%** | `PLATFORM.SHIELD_RECOVERY_PCT` |
| Shield recovery — shielded ceiling | **40%** | `PLATFORM.SHIELD_RECOVERY_PREMIUM_PCT` |
| Shield recovery — Whale/VIP | **60%** | `PLATFORM.SHIELD_RECOVERY_WHALE_PCT` |
| Shield premium band | **2%–4%** of bet | `PLATFORM.SHIELD_PREMIUM_MIN/MAX` |
| $MADx fixed supply | **888,888,888** | `PLATFORM.MADX_FIXED_SUPPLY` |
| Furnace burn cap | **≤4.9%** / 30d | `PLATFORM.FURNACE_BURN_CAP` |
| Card pack cost / size | **4.88 $MADx** / **5** cards | `PLATFORM.CARD_PACK_COST/SIZE` |
| Canonical deck size / seed | **992** / **8888** | `PLATFORM.TOTAL_DECK_SIZE/CARD_GENERATION_SEED` |

**Staking tiers** (stake-amount thresholds — `STAKING_TIERS`, authoritative; mirrored on-chain by `contracts/src/MADStaking.sol`):

| Tier | Min $MADx | APY |
|---|---|---|
| Bronze | 100 | 12% |
| Silver | 500 | 18% |
| Gold | 2,500 | 28% |
| Platinum | 10,000 | 42% |
| Diamond | 50,000 | 58% |
| MAD Tier | 100,000 | 68% |

> ⚠️ Two *other* staking models appear in the tokenomics docs (lock-duration APY 8.8/18.8/28.8/68; rarity-multiplier 8/10/13/20/28/68). The **code + contract use the stake-amount tiers above.** See §13.

---

## §2 — Conviction & continuous markets

- **MADConv (conviction):** `M = t^1.35 · c^0.75 · d^1.45 · ψ^1.15 · (1+π^0.9) · m_meme · satire · liar · garch_amp` — Cobb-Douglas core. Home: `gambit-game-math.ts#calculateConviction`. Safe wrapper: `#calculateConvictionSafe`.
- **GARCH(1,1) volatility:** `σ²ₜ = ω + α·ε²ₜ₋₁ + β·σ²ₜ₋₁` (ω=0.0001, α=0.05, β=0.90); `garch_amp = 1 + 0.8σ`, clamped `0.09 ≤ σ ≤ 0.68`. Home: `#garchUpdate`. Asymmetric extensions: `bayesian-conviction.ts#egarchLogVar`, `#cgarchUpdate`.
- **DL-LMSR (continuous market maker):** cost `C(q) = b·ln Σ e^(qᵢ/b)`; price `P(i) = e^(qᵢ/b) / Σ e^(qⱼ/b)`. Homes: `#calculateDLLMSRCost`, `#calculateDLLMSRPrice`. Liquidity `b` scales with volume via `#calculateVolumeScalingAlpha`.
- **Kelly sizing:** `f* = (p·(b+1) − 1) / b`, half-Kelly default (`scale=0.5`). Home: `#kellyFraction`.
- **δ-limit (position cap):** `#calculateDeltaLimit(multiplier, convictionStake)`.
- **Market classification** (Progression / Saga / Z-Liar / Perp taxonomy): `market-classifier.ts` composing `zLiarMeter` + perp-trigger + sentiment.

## §3 — Liar meter & scandal signal

- **Z-Liar meter:** `LieScore(0–100) = Σ wᵢ·(LinguisticDeception, ContextualContradiction, SentimentShift, VocalAnomaly)`; verdict bands STRAIGHT SHOOTER → TOTAL FABRICATION. Home: `#zLiarMeter`.
- **Lie impact:** `LieImpact = LieScore × EconMult × ψ_agg × VolAmp`.
- **Scandal velocity (GDELT):** `Σ EMOTION_WEIGHTS·e` (shame 1.8 · anger 1.4 · disgust 1.3 · fear 1.2 · sadness 1.0 · joy −0.5), clamped ≥0. Home: `gdelt.ts`.
- **Perp trigger probability:** `P = 1 − exp(−0.25 · matches · themeWeight · (1+velocity))`, bounded 0..1. Home: `gdelt.ts`. *(The handoff's "r²=0.94" is an unverified Grok claim — decorative until measured on real data.)*
- **Sentiment:** lexicon (VADER-style) scorer — `sentiment.ts` (explicitly not a transformer).

## §4 — Bayesian conviction layer (`bayesian-conviction.ts`)

`bayesianUpdate` · log-odds `toLogOdds`/`fromLogOdds`/`sequentialLogOddsUpdate` · hybrid `madconvHybridUpdate` (`M^0.85·(1+β·bayes)`) · decision tree `propagateTree` (depth-bounded 64) · `voiEstimate` · `computeEdge` · `shouldAct` · proper scoring `brierScore`/`logScore`. Surfaced at `POST /api/v1/bayesian/{update,tree,voi,score,garch}`.

## §5 — MAD Shield engine (`gambit-game-math.ts`)

- **Premium:** `Stake × P(win) × √Volatility × SafetyMargin`, clamped to the 2–4% band. Home: `#calculateShieldPremium` / `#shieldPremium`.
- **Recovery:** 28.8% standard · 40% shielded ceiling · 60% Whale. Homes: `#shieldRecovery`, `#calculateShieldPayoutFull`/`Tiered`.
- **φ-shield ratio:** golden-ratio-weighted (`PHI = 1.618…`). Home: `#shieldPhiRatio`.
- **Lifecycle:** `#createShieldOptIn` · `#requestShieldUnstake` · `#calculateShieldReturnWindow` · `#isShieldUnstakeComplete` · `#shieldReturnCountdown`. Whale gate: `#WHALE_SHIELD_ELIGIBILITY`.
- **Compliance:** MAD Shield is **loss mitigation, never insurance/subsidy** — keep framing server-side and in canon.

## §6 — Fee & revenue split

`splitFee(volume, isCreatorMarket)`: `grossFee = volume·1.88%`; `creatorCut = isCreator ? grossFee·40% : 0`; `communityCut = grossFee·28.8%`. Home: `#splitFee`. **Furnace burn** ≤4.9%/30d: `#calculateFurnaceBurnPercent` (live via `revenue-engine.ts`).

> ⚠️ The 40% creator and 28.8% community are **non-additive by design** (creator = per-market gross; community = platform-net). Never wire governance to `FEE_BPS`/`CREATOR_SHARE_BPS`. §13.

## §7 — Staking yield

`calculateStakingYield` — base tier APY (§1) × NFT-clout boost `1 + clout/200`. Home: `gambit-game-math.ts`. Surfaced `POST /api/v1/staking/yield`. On-chain: `MADStaking.sol` (rewards from a separately-funded reserve — a stake never funds another's rewards).

## §8 — Card economy

- **Rarity table & drop weights:** `#RARITY_TABLE`, `#RARITY_DROP_WEIGHTS`, `#RARITY_ORDER` (Common 88 → Mythic 99,999 1-of-1).
- **Evolution:** ladder `#EVOLUTION_LADDER`, `#nextEvolution`, `#attemptEvolution`; burn costs `#EVOLUTION_BURN_COSTS`.
- **Wear:** `#calculateUsageWear`/`#applyUsageWear` + `#RARITY_WEAR_PCT`.
- **Pack pricing:** `#scandalPackPrice` + `#SCANDAL_PACK_TIERS`/`CAP`/`FLOOR`; Dutch auction `#getAuctionPrice`. Surfaced `POST /api/v1/packs/price`.
- **Streaks:** `#streakReward`.

## §9 — Governance

`#quadraticMatch(contributions)` (quadratic funding) + `mpp-math.ts#calculateGovernanceThreshold`. Surfaced `POST /api/v1/governance`. MADDAO quadratic voting-power cap **24×**.

## §10 — Behavioural / joy layer (`joy-engineering.ts`)

VRS Fibonacci triggers `#VRS_TRIGGERS = [5,8,13,21,34]`, `#isVrsTrigger`; `#LOSS_AVERSION = 2.5`, `#lossAversionWeight`; decays `#temporalDecay`/`#stochasticDecay`/`attentionDecay`; `viralityIndex`, `getFibonacciReward`, `calculateUserDopamineIndex` composed into `computeJoyState`/`rewardForTenure`/`momentumIndex`. Surfaced `POST /api/v1/joy/state`.

> **Compliance:** framed as game-economy engagement — never "dopamine/addiction/VRS-as-addiction" in external materials (keep the mechanic, cut the neuroscience framing).

## §11 — Tournament / PvP

Victory probability `#calculateVictoryProbability`; Elo-style `#mmrDelta` (K=32); prize bands `#PRIZE_BANDS`/`#prizeForRank`; tournament scoring `#calculateTournamentScores`; `#TOURNAMENT_PRIZES_BPS`.

## §12 — Thematic / temporal

Lunar phase multiplier `#getLunarPhaseMultiplier` / illumination `#getLunarIllumination` (`LUNAR_CYCLE_MS`, `IMMACULATE_CONCEPTION_EPOCH_MS`); golden ratio `#PHI`; EigenTrust `#assignTrustScore`.

## §12b — Economic-impact & virality dynamics (MAD HAT Math Spec v1.0, Drive handoff)

Folded in from `MAD_HAT_Mathematical_Handoff_Document.md` (Drive). These are the pieces of the spec that were **not** already covered above; status tagged against the code.

- **Projected stock/brand move:** `ProjectedStockMove_t = LieScore · σ_t · k_category` (k ≈ 0.019 baseline, per asset class/virality). ⚠️ **Spec only — NOT in code yet.**
- **Ad-revenue / brand erosion:** `AdRevenueLoss_t = LieScore · σ_t · 0.9` ($M); confidence band `58 + LieScore · 0.32`. ⚠️ **Spec only — NOT in code yet.**
- **Virality ODE (impressions growth):** `dI/dt = β · E_agg(t) · (M − I(t)) · (1 + η · Conv̄(t))`. Code ships **discrete approximations** — `gambit-game-math.ts#viralityScore` / `#viralityIndex` — not the literal ODE integrator.
- **Effective-time / attention decay (integral form):** `t_eff = ∫₀ᵀ a(u) · e^(−λ(T−u)) du`. Code ships the discrete `#attentionDecay` / `#temporalDecay` / `#stochasticDecay`. Meme drops + high-LieScore events recharge attention.
- **Non-binary market structure (CIRO):** Continuous (DL-LMSR) + Over/Under only; legs **45–90 days, never < 30** (30-day minimum-maturity compliance); Conviction Saga auto-relaunches next leg, MADConv profile compounds across legs. (Structure/compliance rule — enforced in market config, not a standalone formula.)

> The three ⚠️ items are the only maths from the Drive handoff **not yet implemented** — they belong in the Liar-Impact / market-projection surface (Part T-B of the plan). Everything else in the handoff is already in code (§2–§4).

---

## §13 — ⚠️ Contradictions requiring founder sign-off (do NOT silently resolve)

These conflicts exist **across the old docs**; the maths/formulas are reconciled to code above, but these **numbers/decisions are the founder's to lock**:

1. **$MADx token distribution — two different splits.** `CANONICAL_NUMBERS.md` (Public 35% / Liquidity 20% / DAO 15% / Team 10% / Staking 10% / Reserve 10%) vs `madx-token-system.md` (Community&Gameplay 45% / DAO 15% / Liquidity 15% / Team 15% / Seed&Private 10%). **Pick one.**
2. **$MADx contract address — two values.** `CANONICAL_NUMBERS.md` → `0xb61ae7727579e3781ca0ec4902b6ba21d335fd18`; master action plan (Part AB, on-chain-verified as symbol MADx / name MADDEX) → `0x6972370e1caAA3624F37D7e87C28e1089D00151f`. **Confirm the live one.**
3. **Staking model framing** — stake-amount tiers (code/contract, §1) vs lock-duration APY (8.8/18.8/28.8/68) vs rarity-multiplier (8→68). Code is authoritative; confirm the marketing framing matches.
4. ~~**Primary chain**~~ — ✅ **RESOLVED, founder sign-off August 2026.** The chain story is locked as:
   - **Arbitrum Nova (42170)** — launch and gameplay chain
   - **Arbitrum One (42161)** — MAD Shield vaults, liquidity and $MADx
   - **HyperLiquid (HyperEVM)** — secondary distribution/liquidity venue, never the canonical record
   - **Arbitrum Sepolia (421614)** — testnet

   Two notes on how this resolved. First, `contracts/foundry.toml` was already the ground truth and already said exactly this (`arbitrum_nova` "launch/gameplay chain (42170)", `arbitrum_one` "MAD Shield vaults / liquidity (42161)"), so the ruling ratifies the code rather than overriding it. Second, one leg of the stated three-way conflict was **phantom**: there is no `CLAUDE.md` anywhere in this repository, so the "Base L2" position it was credited with had no source here. Where "Base L2" does still appear it is either explicitly flagged as wrong (`MAD_GAMBIT_MASTER_ACTION_PLAN.md`), explicitly flagged as aspirational (`MAD_GAMBIT_MASTER_PLAN.md`), or in superseded 2024 material. `CANONICAL_NUMBERS.md`'s "Arbitrum One is primary" was not wrong so much as **incomplete** — One is primary for vaults and $MADx; Nova is primary for gameplay. Both rows are corrected in this change.
5. **Seed range** — `$1M–$2M` (CANONICAL_NUMBERS) vs `$1.24M–$2.48M @ $12M pre` (skill + master plan). **Pick one public range.**
6. **Y3 revenue** — $154.5M / $121.4M / $86–154M across decks. **Pick one.** (Carried from master action plan Part A.)
7. **Community 28.8% semantics** — code comment says "of the fee"; master plan Part A says "of net platform profit, platform-wide, non-additive with the 40% creator." Confirm which the contracts should implement.

---

## Appendix — superseded documents (now pointers to this file)

- `docs/imported/tokenomics/engine-room-math-formulas.md`
- `REPORTS/GARCH_VULKAN_ADVANCED.md`
- `docs/VULKAN_MAD_MAPPING.md`
- `docs/SHIELD_RISK_DEFENCES.md`

**Canonical numbers** now live in `docs/MAD_GAMBIT_MASTER.md` Part II.7 (consolidated 2026-08-16 from the former `docs/imported/tokenomics/CANONICAL_NUMBERS.md`) — cross-checked against §1 here; resolve §13 under founder sign-off. The unresolved splits noted in §13 are carried forward in the master doc's Part II.9. **Engine-room formulas** remain standalone in `docs/imported/tokenomics/engine-room-math-formulas.md`. The former `MASTER_TOKENOMICS.md` narrative and `docs/MECHANISM_ORACLE_MADX_RESEARCH.md` were consolidated into the master doc; their originals are in git history.
