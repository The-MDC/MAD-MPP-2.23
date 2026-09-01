# Mathematical Engine Appendix

**Scope:** every live equation in `verify/lib/gambit-game-math.ts` (1,405 lines), read in full
against the current code — not against any prior description of this file, not against docs.
Every claim below carries a `file:line` citation. Companion test file:
`verify/lib/gambit-game-math.test.ts` (228 lines).

**Headline number:** of 93 runtime-testable exports in this file (63 functions + 30 constants;
19 interfaces and 5 types are excluded as non-runtime), **20 have a direct unit-test assertion
— 21.5%.** The 20 that are tested cluster tightly around the platform-fee constants, the
creator ladder, staking tiers, `splitFee`, `shieldPremium` (see the discrepancy below —
this is the *untested-in-practice* formula), GARCH, the Z-Liar meter, the VRS reward system,
and `votingPower`. Nearly everything to do with cards/packs/factions, PvP tournaments,
evolution, virality/attention decay, EigenTrust, Dutch auctions, and — critically — the shield
*payout* resolvers that actually decide what a user gets back, has zero test coverage. Treat
"implemented" and "tested" as two different claims throughout this appendix; they are marked
separately.

---

## 1. Platform constants

`PLATFORM` object, `gambit-game-math.ts:17-45`:

| Constant | Value | Tested? |
|---|---:|---|
| `FEE_BPS` | 188 (1.88%) — "NEVER CHANGES" per its own comment | Yes |
| `CREATOR_SHARE_BPS` | 4000 — legacy default, comment says "prefer the ladder" | No |
| `COMMUNITY_SHARE_BPS` | 2880 (28.8%) | Yes |
| `SHIELD_RECOVERY_PCT` | 0.288 (standard tier) | No |
| `SHIELD_RECOVERY_PREMIUM_PCT` | 0.40 (shielded tier ceiling) | No |
| `SHIELD_RECOVERY_WHALE_PCT` | 0.60 (whale/VIP/partner only) | Yes |
| `SHIELD_PREMIUM_MIN` / `MAX` | 0.02 / 0.04 | Yes |
| `SHIELD_SAFETY_MARGIN` | 0.35 — corrected from 1.05 (unclamped); see §9 | Yes |
| `MADX_FIXED_SUPPLY` | 888,888,888 | Yes |
| `FURNACE_BURN_CAP` | 0.049 (≤4.9%) | Yes |
| `LMSR_DEFAULT_B` | 1200 — corrected from 100; see §4, §9 | Yes |
| `PERP_TRIGGER_THRESHOLD` | 0.60 — corrected from 0.65; see §9 | Yes |
| `VOTE_POWER_CAP` | 240 | Yes |
| GARCH params (ω/α/β/amp/σ bounds) | see §5 | Yes |
| Card-economy constants | pack cost $4.88, pack size 5, deck 992 cards | Mixed — see §8 |

## 2. Creator Ladder — `CREATOR_LADDER`, lines 60-72

Founder sign-off dated **31 Jul 2026** per the code comment (`line 60`).

| Rung | shareBps | Unlock | Applies to |
|---|---:|---|---|
| User | 2880 (28.8%) | default | creator's own markets only |
| MinorCreator | 4000 (40%) | 12+ tractioned markets | " |
| CR8TR | 6000 (60%) | 34+ tractioned markets AND 888+ followers | " |

Resolver `creatorStatus()` (`line 74-79`) requires **both** the market-count and follower gates
simultaneously per rung and walks top-down; tested including the exact boundary case
`creatorStatus(34, 887)` → still `MinorCreator`, since the follower gate holds at 887 (needs 888)
— `test.ts:114-119`.

**"Traction" is itself a defined, non-trivial gate** (`line 64-65`): a market only counts toward
the ladder once its total conviction reaches the LMSR liquidity parameter b (1,200 $MADx, `line 72`)
*and* it has settled or rolled at least one real payout. A creator cannot climb the ladder purely
by opening markets that never resolve.

## 3. `splitFee()` — the fee waterfall, verbatim and worked

`gambit-game-math.ts:400-407`:

```ts
export function splitFee(volume: number, creatorShareBps: number = 0): FeeSplit {
  const grossFee = volume * bpsToPct(PLATFORM.FEE_BPS);
  const safeBps = Math.min(6000, Math.max(0, creatorShareBps));
  const creatorCut = grossFee * bpsToPct(safeBps);
  const communityCut = grossFee * bpsToPct(PLATFORM.COMMUNITY_SHARE_BPS);
  const protocolCut = grossFee - creatorCut - communityCut;
  return { grossFee, creatorCut, communityCut, protocolCut };
}
```

### Worked example — $1,000 market volume

`grossFee = $1,000 × 1.88% = $18.80` in every row (volume and the platform fee don't vary by rung).

| Scenario | creatorShareBps | creatorCut | communityCut | protocolCut |
|---|---:|---:|---:|---:|
| Platform-made market | 0 | $0.00 | $5.41 | $13.39 |
| Creator rung: User | 2880 | $5.41 | $5.41 | $7.97 |
| Creator rung: MinorCreator | 4000 | $7.52 | $5.41 | $5.87 |
| Creator rung: CR8TR | 6000 | $11.28 | $5.41 | $2.11 |

*(Each row's three cuts sum back to $18.80; verified arithmetically, not rounded.)*

### The load-bearing fact — stated exactly, not summarized

`communityCut` is computed as `COMMUNITY_SHARE_BPS` of **`grossFee`** — line 404 never
subtracts `creatorCut` first. The community pool's dollar take is fixed at **$5.41 in every
scenario above**, regardless of which creator rung is active. **The entire cost of the creator
ladder is absorbed by `protocolCut` alone** — it falls 84%, from $13.39 on a platform-made
market to $2.11 on a CR8TR-rung market, in this $1,000 example.

**This is the item flagged across this whole package as awaiting founder sign-off.** Whether
the intended design is "28.8% of gross fee, always" (what the code does today) or "28.8% of
the platform's post-creator-cut share" (the framing used in some existing copy, including the
whitepaper) is a real product decision with real economic consequences, not a bug with one
obvious fix — it changes how much margin the protocol keeps as more creators climb the ladder.
**No document in this package should describe `splitFee()`'s community allocation as
"enforced in code" without this caveat attached.**

### Failure mode

`safeBps` clamps `creatorShareBps` to `[0, 6000]` only — it is never checked jointly against
`COMMUNITY_SHARE_BPS`. Today `6000 + 2880 = 8880` bps ≤ 10,000, so `protocolCut` stays positive
for every current ladder rung. But there is no structural guard: if `COMMUNITY_SHARE_BPS` or the
ladder's top rung were ever raised so their sum exceeded 10,000 bps, `protocolCut` would go
**negative silently** — no error, no clamp, no warning.

**Test coverage:** `test.ts:122-139` confirms `creatorCut` scales correctly across all three
ladder rungs and confirms `communityCut` for the platform-market case. It does **not** assert
that `communityCut` stays constant across creator rungs — the exact invariant this appendix just
demonstrated by reading the code.

## 4. Staking tiers — `STAKING_TIERS`, lines 47-58

Comment at line 47 states: **"canonical 4-tier eights ladder (founder sign-off 31 Jul 2026)."**
This is the current, code-verified state — an earlier internal audit flagged a 6-tier-code
vs. 4-tier-data-room mismatch; that mismatch is **no longer present in this file** as of this
read. (Whether any Solidity-side staking contract still encodes a different tier count is
covered in the security register, sourced from the contracts inventory.)

| Tier | Min $MADx | APY | Shield recovery % (this tier's own field) |
|---|---:|---:|---:|
| Bronze | 88 | 8.8% | 28.8% |
| Silver | 888 | 18.8% | 32.8% |
| Gold | 8,888 | 28.8% | 36.8% |
| MAD Tier | 88,888 | 38.8% | 40% |
| *(VIP status)* | 888,888 | — | 60%, capital-side status only, not a tier |

`getStakingTier()` (`line 81-83`) resolves top-down by balance. Effective APY with "Clout"
(`effApy = apy × (1 + clout/200)`, per the doc comment `line 50-51`) caps at **77.6%** at
Clout 200 — the comment explicitly notes this ceiling is "earned, never promised." Fully
tested, `test.ts:82-102`.

**Flag for the traceability matrix:** the `shieldRecoveryPct` field on each staking tier
(28.8% → 32.8% → 36.8% → 40%, keyed to raw $MADx balance) is a **different mechanism** from
the opt-in `ShieldTier` system in §6 below (`standard`/`shielded`/`whale`, keyed to a per-position
opt-in dial). They share endpoint values (28.8% and 40%) but are gated by different inputs and
resolved by different functions — nothing in the file ties them together. Presenting these as
one unified "recovery ladder" to investors would overstate how integrated the systems are.

## 5. DL-LMSR pricing — lines 309-325

```ts
calculateVolumeScalingAlpha(volume)  →  1.0 + 0.05·log10(1 + max(volume,0))
calculateDLLMSRCost(shares, b, volume)  →  α(V) · b · ln(Σ e^(qᵢ/b))
calculateDLLMSRPrice(qI, shares, b)     →  e^(qI/b) / Σ e^(qⱼ/b)
```

**Plain English.** `b` (default 1,200) is the market's liquidity depth — how many shares must
trade before the price meaningfully moves. Larger `b` = deeper, slower-moving market; smaller
`b` = thinner, twitchier market. The "Dynamic" in DL-LMSR is `α(V)`: as real cumulative volume
`V` grows, the cost curve scales up by a multiplier that grows with `log10(1+V)`, so an active
market's effective liquidity widens on its own rather than staying fixed forever.
`calculateDLLMSRPrice` is the standard softmax: a given outcome's price is its share of
`Σ e^(qⱼ/b)` across all outcomes, always in `(0,1)`, summing to 1. As one outcome accumulates
shares relative to the others, its price asymptotically approaches 1 (others approach 0) —
never reaching the bound exactly for a finite share count.

**A genuine internal inconsistency, not previously documented anywhere in this repo's docs:**
`calculateDLLMSRCost` scales its output by `α(V)`. In LMSR, price is formally the *marginal*
cost `∂C/∂qᵢ` — so if cost is volume-scaled, price should be too. But
`calculateDLLMSRPrice` takes no `volume` argument at all and never applies `α`; it always
returns the plain (α=1) softmax. **A caller reading "cost" from one function and "price" from
the other, on the same volume-scaled market, gets two numbers that are not derivatives of each
other.** This should be disclosed as a known modeling gap, not presented as a fully-reconciled
pricing system.

**Failure modes.** `b ≤ 0` or an empty share array: both functions guard explicitly and return
`0` — a silent fallback indistinguishable downstream from "zero probability." Negative volume
is floored to 0 (`α = 1`, no crash). **Overflow is not guarded**: `Math.exp(q/b)` has no bound
check in any of these three functions. Beyond roughly `q/b ≈ 709`, `Math.exp` overflows to
`Infinity` in JS, which can propagate to `NaN` in the price function. Notably, **a different
function in the same file, `calculateSoftmax` (`line 1160-1168`), explicitly clamps its exponent
to `[-700, 700]`** — proof the codebase knows this failure mode and guards against it elsewhere,
but did not apply the same guard here. At `b=1200` this would need a single outcome's share
count to exceed ~850,000 to trigger — implausible in normal trading, not addressed by any test.

**Test coverage: zero.** None of `calculateVolumeScalingAlpha`, `calculateDLLMSRCost`, or
`calculateDLLMSRPrice` is imported or exercised anywhere in `gambit-game-math.test.ts`. Only the
constant `LMSR_DEFAULT_B` itself is asserted. **The market-pricing engine this platform is
demoed on has no automated test coverage of its actual pricing math.**

## 6. GARCH(1,1) volatility — lines 335-365

```
σ²_{t+1} = ω + α·ε²_t + β·σ²_t,  then σ_{t+1} = CLAMP(√σ²_{t+1}, 0.09, 0.68)
```

**Plain English.** `ω` (0.0001) is a small floor that keeps predicted variance from collapsing
to exactly zero after a long calm stretch. `α` (0.05, the *reaction* coefficient) is how much
weight the most recent shock gets — a bigger surprise pushes predicted volatility up. `β` (0.90,
the *persistence* coefficient) is how much of last period's variance simply carries forward;
"persistence" here means volatility clusters — once a market gets turbulent it fades slowly
rather than resetting instantly, because 90% of it rolls into the next period's baseline.
`α + β = 0.95 < 1`, so the model is theoretically mean-reverting.

**Why the [0.09, 0.68] clamp exists, not just what it is:** without a floor, a long quiet
period could push σ toward zero, and every downstream formula that multiplies by σ — most
importantly the Shield premium formula in §6, and the Z-Liar volatility penalty — would
collapse toward zero with it, letting a user get loss protection almost free. Without a
ceiling, a cascade of shocks could push σ arbitrarily high and blow those same formulas past
sane bounds. The clamp is an independent safety net on every σ-consuming formula in the file,
not just this one.

**Defensive coding:** every input (`omega`, `alpha`, `beta`, `prevVariance`, `prevShock`) is
checked with `Number.isFinite()` and replaced with the canonical default if not; even the
computed *result* falls back to `0.02` if somehow non-finite. Fully tested including the
explicit zero-history case `garchSigma(0.0, 0.0) → 0.09` (the floor), `test.ts:160-176`.
This is the best-verified formula in the file — implemented, defensively coded, and tested.

## 7. MAD Shield — two premium formulas, and only one is live

This is the single most consequential correction this appendix makes to existing project
copy, including language in `verify/components/whitepaper-sheet.tsx` describing MAD Shield as
"GARCH(1,1)-priced."

**Formula A — `shieldPremium()`, lines 416-424** (the one that matches that description):

```ts
export function shieldPremium(stake, pWin, nextVariance): number {
  const sigma = Math.sqrt(Math.max(nextVariance, 0));
  const raw = stake * pWin * sigma * PLATFORM.SHIELD_SAFETY_MARGIN;  // ·0.35
  return clamp(raw, stake * 0.02, stake * 0.04);
}
```

Takes a GARCH-derived variance as input, computes `Stake × P_win × σ × 0.35`, clamps to 2-4%
of stake. Fully documented, fully tested (`test.ts:141-157`, including the specific 2%/4%
boundary cases and a regression test confirming the 0.35 multiplier, not the pre-correction
1.05). **This function is not called anywhere else in this file** — nothing in
`gambit-game-math.ts` wires it into an actual shield-creation flow.

**Formula B — `calculateShieldPremium()`, lines 159-170** (the one actually used):

```ts
export function calculateShieldPremium(stake, tier, premiumTier = 0): number {
  if (tier === 'whale') return stake * 0.03;
  const pct = SHIELD_PREMIUM_MIN + premiumTier * (SHIELD_PREMIUM_MAX - SHIELD_PREMIUM_MIN); // 2%→4%
  return stake * pct;
}
```

**No `P_win`, no σ, no GARCH input of any kind** — a flat percentage of stake, linear 2%→4%
by an opt-in dial, or a flat 3% for whale tier. This is the function `createShieldOptIn()`
(`line 174-197`) actually calls (`line 186`) when a user opts into MAD Shield — i.e., **this is
the live, wired premium formula**, and it has **zero test coverage**.

**What this means for every pitch document:** MAD Shield's premium is live and implemented —
but as a flat percentage dial, not as the volatility-aware formula. The GARCH-priced version
exists, is well-built, and is well-tested — it is just not currently the one connected to the
product. Say "the opt-in premium is a 2-4% dial on stake" (true, live, tested) and "a
GARCH-volatility-priced version of the premium formula exists and is unit-tested, but is not
yet the one wired to the live opt-in flow" if asked for detail. Do not say "MAD Shield is
GARCH-priced" without that qualifier.

**A second, smaller inconsistency:** `shieldRecovery()` (`line 425-429`) is still exported and
callable. Its comment claims "Canonical pool recovery 28.8%," but the function body is a
hardcoded binary switch between `0.4` (non-VIP) and `0.6` (VIP) with **no path that returns
28.8% at all**, and uses raw literals instead of the `PLATFORM.SHIELD_RECOVERY_*` constants.
Nothing in code marks it deprecated (only a comment on a different function, `line 1215`, calls
it "superseded").

**The recovery-tier resolver.** `calculateShieldPayoutFull()` (`lines 1225-1246`) is the
function the code's own comments identify as canonical ("this is the function product code
should call... supersedes `shieldRecovery()`"). Tier logic: whale (60% flat) only if requested
*and* `isWhaleShieldEligible()` passes all four independent gates simultaneously (lifetime
volume ≥250,000, account age ≥90 days, trust score ≥85, ≥1 Golden Hand card staked — the code
comment at `line 1194-1196` states explicitly "meeting three of four is not sufficient");
else shielded, a **continuous linear dial from 28.8% to 40%** (not a flat 40% — an existing doc
comment at `line 125` says "Shielded 40%" as if it were the only value, which overstates the
floor); else standard, flat 28.8%. **`calculateShieldPayoutFull` — the function the code calls
canonical — has zero test coverage**, as do its supporting functions `isWhaleShieldEligible`
and the older `calculateShieldPayoutTiered`.

## 8. Test-coverage summary

| Category | Tested | Not tested |
|---|---:|---:|
| Platform fee / creator ladder / staking constants | Most | `CREATOR_SHARE_BPS`, `SHIELD_RECOVERY_PCT`, `SHIELD_RECOVERY_PREMIUM_PCT`, `getStakingTier()` |
| GARCH volatility | All 3 functions | — |
| `splitFee`, `shieldPremium` (Formula A) | Yes | — |
| DL-LMSR pricing (the actual market-pricing math) | **None** | All 3 functions |
| Shield premium actually wired live (Formula B) + all payout resolvers | — | **All of it** |
| Z-Liar meter, VRS rewards, votingPower | Yes | — |
| Cards, packs, factions, evolution, PvP tournaments, virality, EigenTrust, Dutch auctions, prediction scenarios | — | **All of it (≈50 exports)** |

**93 runtime-testable exports total; 20 tested (21.5%).** This number belongs on the truth
sheet and in the traceability matrix, not just here.

## 9. Self-documented correction history ("17-corrections")

Eight comment references to a "17-corrections" pass exist in the file, marking five distinct
historical fixes, all still visible in the live code:

1. **Z-Liar verdict band names** standardized to `STRAIGHT SHOOTER / MOSTLY CANDID / SLIPPERY /
   SERIAL EMBELLISHER / TOTAL FABRICATION` (`line 785`) — the old names (`SPIN ZONE`, `SUS`,
   `CAP DETECTED`) are explicitly tested as forbidden, `test.ts:189-196`.
2. `PERP_TRIGGER_THRESHOLD` corrected 0.65 → 0.60 (`line 30`).
3. `LMSR_DEFAULT_B` corrected 100 → 1200 (`line 29`).
4. Shield safety margin corrected 1.05 (unclamped) → 0.35 (clamped 2-4%) (`lines 26, 412`).
5. A second, undisaggregated correction tagged "#5" alongside #4 at the same comment
   (`line 412`) — the comment doesn't specify whether this is the clamp itself or something
   else; not resolvable from this file alone.

No `TODO`, `FIXME`, `HACK`, `XXX`, or `BUG` markers exist anywhere in the file — a full
case-sensitive and case-insensitive sweep found none. Read together with the correction history
above, this reads as a codebase that has been actively reviewed and corrected at least once,
not one that has never been looked at critically — worth citing as a mild positive signal in
the security register, alongside the very real gaps in §5 and §7.

## 10. Assumptions & failure-mode quick reference

| Formula | Key assumption | What breaks it | Guarded? |
|---|---|---|---|
| `splitFee` | creator+community bps never exceed 10,000 total | A future ladder/community change could | No — no joint check |
| DL-LMSR cost/price | price = ∂cost/∂q | Not true once volume-scaling is applied to cost only | No — inconsistency is live |
| DL-LMSR exp terms | `q/b` stays well under ~709 | Extreme/adversarial share counts | No overflow guard (unlike `calculateSoftmax` elsewhere in the same file) |
| GARCH σ | bounded to [0.09, 0.68] | Nothing — clamp is unconditional | Yes |
| Shield premium (live, Formula B) | flat % is an acceptable proxy for risk | Ignores actual position volatility/win-probability entirely | By design, not a bug — but should not be described as risk-priced |
| Shield payout resolver | whale eligibility requires all 4 gates | Nothing — AND logic, explicitly commented | Yes |
