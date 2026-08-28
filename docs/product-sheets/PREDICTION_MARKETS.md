# PREDICTION MARKETS — Product Sheet

> Numbers in this sheet are read from `verify/lib/gambit-game-math.ts`, `verify/lib/lmsr-book.ts`,
> `verify/sql/`, `verify/app/api/v1/markets/` and `contracts/src/`. Where a figure disagrees with
> `docs/product-sheets/_CANON_REFERENCE.md`, the code wins. Nothing here is a traction claim.

## 1. Product Overview

**What it is.** A dated, criterion-resolved market on a stated proposition. A trader buys shares in
one outcome, the DL-LMSR book re-prices every outcome against the new share vector, and at the close
date the market settles against a stated resolution criterion. Two outcomes is the default shape
(`["YES","NO"]`, `market_book.outcomes`); the book itself is n-ary and the share vector `q` is a
JSONB array precisely so a market can carry more than two legs without a schema change.

**Tagline.** A price with a deadline.

**Core loop.**

1. A market is opened — by the platform, by a creator (see `OPEN_MARKETS.md`), or by the classifier
   proposing one from a live signal (`classifySignal`, `GET /api/v1/markets/proposals`).
2. `ensureBook` (`lib/market-book.ts`) opens a DL-LMSR book at `b = 1200` with `q = [0,0]` and `cum_volume = 0`.
3. A trader spends $MADx. The 1.88% rake is taken off the top; the remainder enters the book and
   buys the exact LMSR inverse number of shares.
4. Every fill appends a row to `market_prices` and writes decimal odds back to `markets.yes_odds` /
   `no_odds`, so every card, tape and payout multiplier reads the same book.
5. At the close date the market resolves to one outcome; winners claim.

**What separates a prediction from a conviction market.** A prediction market has a **close date and
a terminal answer** — `markets.resolution_at` is a real timestamp and `markets.outcome` eventually
becomes `'YES'` or `'NO'`. A conviction market grades the *strength and persistence of a belief* and
has no clean win/lose. The discriminant is in code: `CLASS_OF_TYPE` in `verify/lib/market-view.ts`
maps `progression` and `saga` to `"prediction"`, and `zliar` and `epiphany` to `"conviction"`.

## 2. Canonical Constants

| Constant | Value | Code home |
|---|---|---|
| Platform rake | 1.88% (188 bps) | `PLATFORM.FEE_BPS` — `verify/lib/gambit-game-math.ts` |
| Community + DAO share | 28.8% **of platform net** | `PLATFORM.COMMUNITY_SHARE_BPS` (2880) |
| DL-LMSR liquidity *b* | 1,200 | `PLATFORM.LMSR_DEFAULT_B`; `market_book.b` default |
| Volume scaling | α(V) = 1 + 0.05·log₁₀(1+V) | `calculateVolumeScalingAlpha` |
| GARCH parameters | ω = 0.0001 · α = 0.05 · β = 0.90 | `PLATFORM.GARCH_OMEGA/ALPHA/BETA` |
| σ clamp | [0.09, 0.68] | `PLATFORM.SIGMA_MIN` / `SIGMA_MAX` |
| Amplification | 1 + 0.8σ ≤ 1.544 | `PLATFORM.GARCH_AMP_COEFF` |
| Perp conversion gate | 0.60 | `PLATFORM.PERP_TRIGGER_THRESHOLD` |
| Default odds at create | 2.0 / 2.0 decimal | `markets.yes_odds` / `no_odds`, `verify/sql/0007_markets.sql` |
| Slippage warning threshold | 5% price impact | `Quote.impact`, `verify/lib/lmsr-book.ts` |
| $MADx fixed supply | 888,888,888 | `PLATFORM.MADX_FIXED_SUPPLY` |
| On-chain fee (parimutuel leg) | 188 bps, creator 4000 bps of it | `MADMarketFactory.FEE_BPS` / `CREATOR_FEE_SHARE_BPS` |
| Dispute fee on slashed bond | 188 bps | `MADOptimisticOracle.DISPUTE_FEE_BPS` |
| Legs / maturity floor (CIRO) | 45–90 days, never < 30 | MASTER Part VI §12b — config rule, not a formula |

## 3. Taxonomy & Trigger

Eight market types exist (`MARKET_TYPES`, `verify/lib/market-classifier.ts`). Two of them are
prediction markets:

| Type | Class | Shape |
|---|---|---|
| `progression` | prediction | Short structured arc, A→B→C milestones, ≤ ~45 days |
| `saga` | prediction | Long-horizon evolving narrative, resolves on a defined milestone |

Classification is a **first-match cascade** in `classifySignal`. Order is load-bearing — a greedy
earlier rule steals markets from the family that should own them:

1. `isEpiphany(headline)` → `epiphany` (conviction)
2. `perpEligible && horizonDays ≥ 365 && isPersona` → `faces` (perp)
3. `perpEligible && horizonDays ≥ 365 && isTrend` → `zeitgeist` (perp)
4. `perpEligible && horizonDays ≥ 365 && isGossip` → `gossipcop` (perp)
5. `perpEligible && horizonDays ≥ 365` → `perp`
6. `zliarEligible && horizonDays ≤ 45` → `zliar` (conviction)
7. `horizonDays > 60` → **`saga`**
8. otherwise → **`progression`**

Gate definitions: `perpEligible = perpProbability ≥ 0.60` (`PERP_TRIGGER_THRESHOLD`);
`zliarEligible = zLiarScore ≥ 60 AND sentiment.dopaminePotential`.

`estimateHorizonDays` is a lexical heuristic returning one of **540 / 120 / 21 / 7 / 30 (default)**.
Note the consequence: the `(45, 60]` band in the cascade is unreachable from the estimator's own
output, so in practice rule 7 fires on 120 and 540, and everything else that survives to the bottom
lands on `progression`. Any horizon supplied by a human creator can hit that band.

Two ranking scalars come out of the same call and drive the "Markets for Today" rail:

```
convictionPrior = clamp01(0.4 + 0.3·sentiment.intensity + 0.2·perpProbability)
score           = 0.4·(zLiarScore/100) + 0.35·perpProbability + 0.25·sentiment.intensity
```

A proposal is **not** a market. `fromProposal` sets `tradeable: false` — a card must never imply a
position the backend would reject.

## 4. Conviction & Pricing

### 4.1 The book

Volume-scaled DL-LMSR. Cost and price are in `gambit-game-math.ts`; the inverse is in `lmsr-book.ts`.

```
α(V) = 1 + 0.05·log₁₀(1 + V)
C(q) = α·b·ln Σⱼ e^(qⱼ/b)
P_i  = e^(q_i/b) / Σⱼ e^(qⱼ/b)
```

Buying `s` shares of outcome *i* costs `C(q + s·eᵢ) − C(q)`. Setting that equal to the net spend and
solving gives a closed form — exact, not iterative:

```
S = Σⱼ e^(qⱼ/b)     Eᵢ = e^(q_i/b)     K = e^(netIn/(α·b))
s = b·ln( (S·(K − 1) + Eᵢ) / Eᵢ )
```

Three implementation facts a trader is entitled to know:

- **α is held at the pre-trade volume** across a single fill. α moves ~0.05 per decade of volume, far
  below the noise of the price move itself, and holding it makes the quote a closed form the client
  can reproduce exactly. The book's α advances on the next trade.
- **The solve works in exponentials shifted by max(q)**, so `e^(q/b)` cannot overflow. At `b = 1200`
  the unshifted canon form stays exact until a single outcome holds roughly 850,000 shares.
- **The client's quote is a preview, never the settlement.** `fill()` takes the book row with
  `SELECT … FOR UPDATE` and re-prices against the locked state, so two concurrent fills serialise
  instead of both pricing off the same stale `q`.

### 4.2 Where the fee is taken

The rake comes off the **spend**, before anything reaches the book:

```
grossFee = spend × 1.88%
netIn    = spend − grossFee      ← this is what buys shares
```

Then the two-stage waterfall in `splitFee(volume, creatorShareBps)`:

```
creatorCut   = creator's own markets only, ladder rung × grossFee   (0 on platform markets)
platformNet  = grossFee − creatorCut
communityCut = platformNet × 28.8%
protocolCut  = platformNet − communityCut
```

This is **not** a flat three-way split — corrected 2026-08-27. On a platform-made market
(`creatorShareBps = 0`) the community's 28.8% is taken off the whole gross because gross and net are
the same number there. On a creator market it is 28.8% of what remains after the creator is paid.
`creatorShareBps` is clamped to `[0, 6000]` inside `splitFee`, and it never changes what the buyer
pays — only how the fee is divided downstream (`lmsr-book.ts` header, `market-book.ts:200`).

Per 10,000 $MADx of volume:

| Market | Gross | Creator | Platform net | Community | Protocol |
|---|---|---|---|---|---|
| Platform-made (0 bps) | 188.00 | 0 | 188.0000 | 54.1440 | 133.8560 |
| Creator at 40% rung | 188.00 | 75.20 | 112.8000 | 32.4864 | 80.3136 |

### 4.3 Volatility

GARCH(1,1) state is carried on the book row (`market_book.sigma`, `last_shock`) so volatility does
not restart from the floor on every trade. The shock is the realised price move,
`priceAfter − priceBefore`, and `garchSigma` applies the canon tick:

```
σₜ₊₁ = CLAMP( √(ω + α·ε²ₜ + β·σ²ₜ), 0.09, 0.68 )      amp = 1 + 0.8σ ≤ 1.544
```

Long-run variance is `ω/(1−α−β) = 0.002`.

### 4.4 Position sizing and display odds

Fractional Kelly is the sizing tool the platform exposes: `f* = (p·b − (1−p))/b`, scaled by 0.5 by
default (`kellyFraction`). Display odds are `1/p` (`oddsFromPrice`), de-vigged across outcomes by
`deVig` before any split bar is drawn — two sides reading 55%/55% is the classic prediction-market
UI bug and `deVig` is what prevents it. The card multiplier `payoutFor(p) = (1/p)·(1 − 0.0188)`
applies the fee **once**, in `market-view.ts`; `oddsFromPrice` deliberately does not, or every
multiplier on every card would be understated twice over.

### 4.5 How they resolve

Off-chain, `markets.status` moves `open → resolving → resolved | disputed` and `markets.outcome`
becomes `'YES'` or `'NO'`. **‹verify› — as of this read, no route or job in `verify/` writes either
column.** `verify/app/api/v1/markets/` contains exactly five handlers (list/create, get, book, swap,
proposals) and none of them resolves. `bets.status` (`pending | won | lost | cancelled`) likewise has
no writer. Settlement today exists only on-chain.

On-chain, `MADMarketFactory` is the settlement leg, and it is deliberately a different mechanism from
the off-chain book: **parimutuel OVER/UNDER**, no AMM and no LMSR maker.

- `back(marketId, side, amount)` until `resolutionTime`.
- `resolve(marketId, resolvedValue)` — OVER wins iff `resolvedValue >= threshold`. If the winning
  side has no backers the market is **cancelled and everything is refunded, with no fee taken**.
- `pot − platformFee` is frozen as `distributable`; winners claim pro-rata via the pull pattern
  (`claim`), so only the two fee transfers move at resolution, after all state is final.
- `cancelMarket` + `claimRefund` cover the ambiguous-outcome case at full stake.

Truth is supplied by the oracle stack. `MADOptimisticOracle` is the money-at-risk finaliser:
`assertOutcome` with a $MADx bond → liveness window → `settle`, or `dispute` with a matching bond →
`resolveDispute`, where the party matching truth takes both bonds minus the 1.88% dispute fee.
`MADDisputeVoting` decentralises that resolver for disputes whose bond clears a threshold, using
commit-reveal with a quorum fallback to the owner — a vote that never reaches quorum must not leave a
market stuck.

## 5. MAD Shield

MAD Shield is **opt-in loss mitigation, never insurance and never a subsidy**. That framing is a
compliance constraint, not a style preference (MASTER Part VI §5).

Premium, `shieldPremium(stake, pWin, nextVariance)`:

```
Φ = Stake · P(win) · σ · 0.35        σ = √(nextVariance)
clamped to [2%, 4%] of stake
```

Recovery, `calculateShieldPayoutFull(stake, premiumTier, eligibility, requestWhaleTier)`, resolved in
this order:

| Tier | Recovery | Gate |
|---|---|---|
| Whale / VIP / Partner | 60% | All four `WHALE_SHIELD_ELIGIBILITY` floors, and the tier must be requested |
| Shielded | 28.8% → 40%, continuous in `premiumTier` | `premiumTier > 0` |
| Standard | 28.8% flat | default |

The whale gate is **conjunctive** — lifetime volume ≥ 250,000 $MADx, account age ≥ 90 days,
EigenTrust ≥ 85, and ≥ 1 Golden Hand card staked. Meeting three of four is not sufficient, by design:
the highest recovery rate must not be purchasable with one large bet.

On a prediction market the Shield attaches to the position, not the book. A shielded loss is
`loss × effectivePct` returned from the vault; the book itself is untouched, and the trader's fill
price, shares and payout multiplier are identical shielded or not. Unstake is a cooling window of
`2 + floor(stake/10,000)·2` hours, clamped to `[2, 24]` (`calculateShieldReturnWindow`), mirrored
on-chain by `MADShieldVault`'s `stake / requestUnstake / claim` lifecycle.

## 6. Example Markets

Illustrative only — none of these is a live market, and no volume, price or participation figure is
attached to any of them.

| # | Market | Type | Horizon | Resolution criterion |
|---|---|---|---|---|
| 1 | Does the named board vote conclude with a CEO departure announced before the stated close? | `progression` | 7 d | Next structured milestone (A→B→C) within the window |
| 2 | Does the regulator publish an enforcement notice on the named filing this quarter? | `progression` | 30 d | Published notice on the regulator's own docket |
| 3 | Does the disputed acquisition clear its second-phase review inside the season? | `saga` | 120 d | Defined milestone; the saga may spawn follow-on legs |
| 4 | Does the multi-year antitrust arc reach a first-instance judgment? | `saga` | 540 d | Judgment entered, docket-verified |
| 5 | Over/under on the settled headline figure in the named quarterly disclosure | `progression`, on-chain OVER/UNDER | to `resolutionTime` | `resolvedValue >= threshold` via `MADOptimisticOracle` |
| 6 | Does the announced product ship inside the stated week? | `progression` | 7 d | Public availability, vendor's own channel |
| 7 | Does the sports-adjacent governing body uphold the appealed sanction this season? | `saga` | 120 d | Published decision |
| 8 | Does the named jurisdiction's licence application reach a decision within the maturity window? | `saga` | 90 d | Decision on the register; satisfies the 45–90 day CIRO leg rule |

Two shapes are deliberately absent from this list and belong elsewhere: anything with no terminal
date (that is a perp) and anything scored on the persistence of a belief rather than a fact (that is
a conviction market — see `CONVICTION_MARKETS.md`).

## 7. Technical Development Scope

### 7.1 Smart Contracts

Built, in `contracts/src/`:

- `MADMarketFactory.sol` — parimutuel OVER/UNDER, permissionless `createMarket`, `back`, `resolve`,
  pull-pattern `claim`, `cancelMarket` / `claimRefund`, `Pausable`, `ReentrancyGuard`, ERC-2771 so
  relayed trades resolve to the real signer via `_msgSender()`.
- `MADOptimisticOracle.sol` — bonded assert / dispute / settle, `DISPUTE_FEE_BPS = 188`.
- `MADDisputeVoting.sol` — threshold-gated commit-reveal dispute voting, quorum fallback to owner.
- `MADShieldVault.sol` — three-tier shield positions with the unstake lifecycle.

Outstanding:

- **‹verify› Fee-split divergence.** `MADMarketFactory` hardcodes `CREATOR_FEE_SHARE_BPS = 4000` and
  splits `platformFee` two ways (creator, treasury), with the 28.8% community share handled at the
  treasury level and explicitly *not* computed per market. The off-chain `splitFee` implements the
  full two-stage waterfall **and** a three-rung creator ladder. On-chain there is no ladder: every
  creator settles at 40% regardless of status. These must be reconciled before a creator's on-chain
  payout is quoted from the off-chain ladder.
- Continuous DL-LMSR settlement contract — named in the factory's own header as "a later, separate
  contract". Not started.
- Resolution write-back from chain to the off-chain ledger (see 7.2).

### 7.2 Backend

Built:

- `verify/lib/gambit-game-math.ts` — the pricing, fee, GARCH, Kelly and Shield primitives.
- `verify/lib/lmsr-book.ts` — pure, isomorphic solver; the same module the client previews with and
  the server settles with, which is what stops a preview from lying.
- `verify/lib/market-book.ts` — `ensureBook`, `getBook`, `priceHistory`, `priceHistoryFor`, and
  `fill()`: one transaction that debits the buyer, advances `q`, writes the bet, appends the tape and
  writes odds back.
- `verify/lib/markets.ts` — `createMarket`, `getMarket`, `listMarkets`, `placeBet`,
  `listBetsByWallet`, `logAudit`. Raw `pg` + typed mappers, per ADR-008.
- Schema: `verify/sql/0007_markets.sql` (`markets`, `bets`, `audit_log`) and `0016_market_book.sql`
  (`market_book`, `market_prices`, plus `bets.shares / cost / fee / price_after`).
- Routes: `GET|POST /api/v1/markets`, `GET /api/v1/markets/[id]`, `GET /api/v1/markets/[id]/book`,
  `POST /api/v1/markets/[id]/swap`, `GET /api/v1/markets/proposals`, `GET|POST /api/v1/bets`.

Outstanding:

- **Resolution and settlement path.** No writer for `markets.status`, `markets.outcome` or
  `bets.status`. This is the single largest gap in the prediction surface.
- Payout ledger: a settled market currently has no off-chain credit path back to `madx_accounts`.
- `POST /api/v1/markets` never opens a book — `ensureBook` is called lazily by the first swap. A
  market listed before its first trade has no `market_book` row and `GET .../book` falls through to
  the honest empty-book demo response.
- `creatorShareBps` is accepted by `fill()` but the swap route never passes one, so every fill today
  splits at 0 bps. Wiring `creatorStatus()` into the route is a prerequisite for `OPEN_MARKETS.md`.

### 7.3 Frontend

Built: `market-view.ts` normalises all three market shapes into one `MarketView`, so a card never
knows which table its data came from; `deVig`, `impliedProb`, `payoutFor`, `fmtCompact`, `fmtChange`;
`FAMILY_META` and `CLASS_ACCENT` for per-class presentation; `tradeable: false` renders a visible
SIGNAL ONLY badge rather than a dead trade button.

Outstanding:

- `deriveSeries` is a seeded FNV-1a/xorshift walk and is labelled a placeholder in its own file. Real
  tape now exists in `market_prices` and is served by `GET .../book?points=`; the card path should
  read that and drop the derived walk. `series` and `change24h` are the only fields that change.
- Slippage warning: `Quote.impact` is computed and returned but no surface compares it to 0.05.
- Resolution and claim UI — blocked on 7.1 / 7.2.
- Per MASTER Part III: zero `error.tsx`, zero `next/dynamic`, zero `next/font` across the app. All
  three land on this surface first because the market decks are the heaviest routes.

### 7.4 Phased Build

| Phase | Scope | Exit condition |
|---|---|---|
| P1 | Close the settlement gap: resolution writer, `bets.status` transitions, payout credit | A market can go `open → resolved` and a winner's balance changes |
| P2 | Wire the creator rung into `fill()`; reconcile on-chain 40% flat against the off-chain ladder | One number for a creator's cut, quoted the same in both places |
| P3 | Replace `deriveSeries` with the real tape; add the 5% impact warning; open a book at create time | No placeholder series renders on a market with trades |
| P4 | Oracle integration end to end: assert → liveness → settle → off-chain write-back | An on-chain resolution moves the off-chain row without a human |
| P5 | Continuous DL-LMSR settlement contract; n-ary outcomes beyond binary in the UI | A 3+ outcome market trades and settles |

## 8. Compliance

- **Non-binary market structure (CIRO).** Only two structures are sanctioned: Continuous (DL-LMSR)
  and Over/Under. Legs run **45–90 days and never under 30** — a minimum-maturity rule enforced in
  market config, not in a formula. A Conviction Saga auto-relaunches on the next leg rather than
  extending the current one.
- **MAD Shield is loss mitigation.** Never described as insurance, a guarantee, or a subsidy, in any
  surface or any external document.
- **Near-miss is not permitted on real-money surfaces.** `components/dopamine-engine.tsx` renders
  some losses as almost-wins (`isNear = !won && roll < 0.58`). Verified 2026-08-27: it sits on
  free-play `madCredits` behind a placeholder RNG. On real $MADx stakes this is the single most
  regulated pattern in the category. The boundary is currently a convention, not an enforced code
  boundary — **‹verify› pending the founder's decision recorded in MASTER PART 0 §3.**
- **No clinical framing externally.** The reward mechanics stay; "dopamine", "VRS", "addiction" and
  "novelty-seeking" language never appears in a deck, whitepaper or marketing surface.
- **Market creation is authenticated.** `POST /api/v1/markets` is session-gated
  (`withRouteGuard`, 20/min); the swap route takes the wallet from the session and never from the
  body, because it debits `madx_accounts`.
- **Audit trail.** Every market create and every bet writes an append-only `audit_log` row.
- **Defamation surface.** A prediction market on a named individual's conduct is the highest-risk
  shape in the taxonomy. The perp families carry an opaque `subject_ref` regime for exactly this
  reason (`verify/sql/0012_perp_markets.sql`, `assertOpaqueSubjectRef`); the binary `markets` table
  has **no equivalent protection** — `title` and `description` are free text. **‹verify›** before any
  creator-authored market names a private individual.

## 9. Success Metrics

Instrumentation targets. No baseline is asserted, because none is verified.

| Metric | Definition | Source |
|---|---|---|
| Settled-market count | Markets reaching `status = 'resolved'` | `markets` — needs 7.2 P1 first |
| Book coverage | Share of open markets with a `market_book` row and ≥ 1 tape point | `market_book` ⋈ `market_prices` |
| Realised spread | Mean \|`price_after` − `odds_at_bet`⁻¹\| per fill | `bets` |
| Median price impact | Median `Quote.impact` per fill, against the 5% warning line | `bets`, `market_prices` |
| Tape density | `market_prices` rows per market per day | `market_prices` |
| Fee integrity | Σ`bets.fee` reconciles to Σ volume × 1.88% | `bets`, `splitFee` regression test |
| Waterfall integrity | creator + community + protocol = gross, per market | `splitFee` canon-lock suite |
| Resolution latency | `resolved_at` − `resolution_at` | pending the resolution writer |
| Dispute rate | Disputed resolutions ÷ resolved markets | `MADOptimisticOracle` events |
| Calibration | Brier and log score of closing marks against outcomes | `brierScore` / `logScore`, `bayesian-conviction.ts` |

Calibration is the metric that matters most and is the one currently impossible to compute: it needs
resolved outcomes, and nothing resolves yet.
