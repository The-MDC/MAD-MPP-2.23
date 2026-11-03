# TGE comparables for $MADx

**What this is.** A cited benchmark of comparable token launches (prediction markets, gaming and
social-fi on Base-adjacent chains) against the MAD side as the repo records it. It re-creates the
research behind PR #154 (Maths Engine Room), whose background notes were lost.
**What it is not.** A plan, a valuation, or advice. It decides nothing; every MAD number is quoted
from the repo, and every open MAD question stays with `docs/MAD_GAMBIT_MASTER.md` (the single source
of truth). It deliberately does **not** edit MASTER, to avoid colliding with parallel sessions;
a one-line pointer to this file from MASTER PART I is the suggested follow-up.

**Retrieval date.** All external sources were retrieved **2026-11-01** unless a row says otherwise.
Source IDs in square brackets (`[S1]`…) resolve to the URL table in §9. Repo sources are `[R1]`…

**Conventions.**

| Tag | Meaning |
|---|---|
| *(plain)* | Figure appears in the cited source. |
| **derived** | Arithmetic on cited figures (formula shown). The result is not in any source. |
| **unverified** | Not found in a primary or reputable source, or sources conflict. Not to be quoted onward. |
| **snippet** | Seen only in a search-result excerpt, not on the fetched page. Re-check before quoting. |

**$MADx token address — not asserted anywhere in this file.** PR #154 found that
`0xb61ae772…fd18` is **not** $MADx (it is a different ERC-20, ORKx) [R3]. The address question is
tracked in MASTER PART 0 §3; do not copy an address from this document.

---

## 1 · The MAD side, as the repo states it

| Item | Value | Source |
|---|---|---|
| Canon total supply | **888,888,888**, fixed | [R2] §1 |
| Deployed-contract cap | **224,573,096**, mint-on-purchase, Pausable; the number is an owner-modifiable **cap**, not a total supply | [R3] line 144; [R6] §3 item 1 |
| Cap in the beta ledger | `MADX_BETA.cap = 224_573_096`, mints are atomic against `madx_supply` | [R1] `mintAgainstCap` |
| Onboarding faucet | `welcomeGrant = 500` beta credits, once per normalised owner (ledger `kind='welcome'`), minted against the same cap | [R1] `onboard()` |
| Placeholder purchase | `maxBuyPerTx = 100,000`; `POST /api/v1/madx/buy` "mints beta credits instantly (no real payment)" | [R1]; [R7] |
| Staking rewards | `claim()` mints accrued rewards against the same cap | [R1] `claim()` |
| Redemption | Beta credits "redeemable 1:1 for on-chain $MADx at TGE (placeholder)" | [R1] `MADX_BETA.note` |
| Seed token allocation | **10%** (Boardy brief, "new — not previously in repo") | [R2] §1 |
| Seed round | $1.24M – $2.48M @ $12M pre-money, SAFE or equity | [R2] §1 |
| Distribution — April canon | Public 35 / Liquidity 20 / DAO 15 / Team 10 / Staking 10 / Reserve 10 | [R4] line 714 |
| Distribution — March "vFinal" | Community & Gameplay 45 / DAO 15 / Liquidity 15 / Team 15 / Seed & Private 10 | [R4] line 1097 |
| Monthly burn cap | `MaxBurn(30d) = TotalSupply × 0.049 = 43,555,555` (on the 888,888,888 basis) | [R5] §8 |
| Sell-pressure assumptions | Staking absorption 82–85%; initial depth "$7.5M+" | [R5] §1 |
| Vesting / cliffs for $MADx | **None located.** A search of `docs/` for `vesting`, `cliff` and `TGE` finds only equity/cap-table vesting and the word "Zeitgeist" | searched 2026-11-01 |
| TGE price / FDV / float | **None located.** | searched 2026-11-01 |

**Open MAD decisions that block a like-for-like comparison** (all already in MASTER, founder-owned):
the real total supply (888,888,888 canon vs 224,573,096 cap vs the Crystex fair-launch figure,
which an agent cannot read because `app.crystex.app` is egress-blocked [R6] §4), the
distribution split (two versions above), and any vesting schedule. Until those are set, the MAD
column of §3–§6 can only say "undefined" rather than a number.

---

## 2 · Who is in the sample, and why

| # | Comparable | Why it is here | Launch status (2026-11-01) |
|---|---|---|---|
| 1 | **Polymarket (POLY)** | The category incumbent; its token is the one the others are compared against | **Not launched.** Confirmed, no date [S10] |
| 2 | **Azuro (AZUR)** | Prediction-market infrastructure with an activity-score airdrop | Live since June 2024 [S1][S2] |
| 3 | **Limitless (LMTS)** | Prediction market on Base; closest consumer-facing, Base-native analogue | Live since 2025-10-22 [S6] |
| 4 | **Zeitgeist (ZTG)** | Prediction-market chain (Polkadot parachain) with a staged private → public sale | Live since 2022-07 [S13] |
| 5 | **Gnosis (GNO)** | The original prediction-market token; Dutch-auction sale. Omen is its market front end | Live since 2017-04-24 [S16] |
| 6 | **Omen** | Gnosis/DXdao prediction-market front end | **No native token located — unverified** [S19] |
| 7 | **Hedgehog Markets** | Solana "no-loss" prediction markets (game tokens for staked USDC): the nearest design to MAD's credits model | **No native token located — unverified** [S21] |
| 8 | **friend.tech (FRIEND)** | Base social-fi; an 88% airdrop with the whole supply liquid at launch | Live since 2024-05-03 [S22][S23] |
| 9 | **Zora (ZORA)** | Creator/consumer app; large activity-snapshot airdrop. Chain not confirmed from retrieved sources (BeInCrypto says "Zora Network") — **unverified** whether the token is on Base | Live since 2025-04-23 [S24] |

Not covered, and why: Kalshi (no token); Augur/REP and Myriad/Polkamarkets (not retrieved);
Base's own token (not launched in any source retrieved). A gaming-token comparable (e.g. a
play-to-earn launch) was **not** researched; if gaming float behaviour matters, that is the gap.

---

## 3 · Launch snapshot — FDV, circulating %, initial float

FDV rows marked **derived** are `price × supply` using the price series in §6 and the supply in the
"Total supply" column. "First close" means the first daily close the price source returns, which is
**not always launch day** (the offset is stated).

| Token | Total supply | Initial circulating / float | FDV at first close (derived) | Reference FDV | Sources |
|---|---|---|---|---|---|
| **AZUR** | 1,000,000,000 | **152,000,000 = 15.2%** (92M ecosystem + 60M DAO treasury unlocked at TGE; 152 = 92 + 60 **derived** check) | $0.1329 × 1B = **$132.9M** (first close 2024-06-20); initial float cap **derived** $0.1329 × 152M = **$20.2M** | ATH $0.2396 on 2024-07-20 → $239.6M **derived** | [S1], [P] |
| **LMTS** | 1,000,000,000 | **Unverified at TGE** — circulating "not stated" in the tokenomics post [S4] and on the unlock tracker [S7]. 13% circulating on 2026-03-04 [S6] (≈4.5 months post-TGE, before any 6-month cliff in [S4] had ended, so mostly TGE-unlocked supply — **inference**); treat 13% as a loose proxy only | $0.3019 × 1B = **$301.9M** (first close stamped 2025-10-23 00:00 UTC, i.e. end of launch day) | ATH $0.6943 at 2025-10-22 05:04 UTC → **$694.3M** derived. Pre-sale (Kaito): $1M for 1.37% = $0.0730 → **$73M** derived, assumes the whole $1M bought the whole 1.37% | [S4][S5][P] |
| **ZORA** | 10,000,000,000 | **Unverified at TGE.** 4.47B circulating (44.7%) on 2026-11-01 [S27] snippet | $0.01914 × 10B = **$191.4M** (first close 2025-04-23) | Pre-market quote ~$0.03 / "around $300 million" [S24]; ATH $0.1456 on 2025-08-11 → **$1.456B** derived | [S24][S25][P] |
| **FRIEND** | 94,885,121 (CoinGecko, today) | **~100% at launch** — initial distribution is 88% airdrop + 12% LP rewards/incentives, and CoinGecko reports circulating = total [S22]. Whether the 12% was liquid on day 1 is **unverified** | $1.668 × 94.885M = **$158.3M** (first close 2024-05-04) | ATH $3.26 on 2024-05-03 00:33 UTC → **$309.3M** derived | [S22][S23][P] |
| **ZTG** | 100,000,000 genesis [S14]; other aggregators show 115.46M [S15] and 108.36M (CoinMarketCap, search snippet) — supply drifts, so FDV is basis-dependent | **Unverified.** At genesis the explicitly unlocked pieces were the IEO (0.1%, no lock), 20% of the seed (7%) and strategic (6%) rounds [S13]; the rest of the 39.9% "PLO" bucket is not described | $0.2706 × 100M = **$27.1M** (first close 2022-07-05, 4 days after the 2022-07-01 TGE date in [S13]) | Sale price $1.25 × 100M = **$125M** derived [S13]; seed $0.214 → $21.4M derived | [S13][S14][P] |
| **GNO** | 10,000,000 **unverified** (implied by $12.5M ÷ $30 = 416,667 GNO = 4.17% [S17]); CoinGecko shows 3,000,000 today after burns/changes | **~4.17% sold in the auction** [S17] (community source); the rest held by Gnosis — **unverified** primary figure | Auction: $30 × 10M = **$300M** (Forbes: "around $300m" [S16]; [S17] says a "theoretical 312.5M" valuation). First close in the series is **2017-05-01, 7 days after** the auction: $74.82 × 10M = **$748M** derived | — | [S16][S17][P] |
| **POLY** | **Not disclosed** | **Not disclosed** | **Not disclosed** — no FDV, allocation or eligibility announced [S10] | Polymarket hosts "FDV after launch" markets on token airdrops [S12] **snippet**; whether one exists for POLY, and its odds, were not checked | [S10][S11][S12] |
| **$MADx** | 888,888,888 canon **or** 224,573,096 cap **(open)** [R2][R3] | **Undefined.** Beta credits already minted off-chain count against the cap [R1] | **Undefined** — no TGE price | Seed arithmetic: 10% for $1.24M–$2.48M implies a seed-round token FDV of **$12.4M–$24.8M** (**derived**: seed ÷ 0.10; assumes the seed buys the full 10%); per-token **$0.0140–$0.0279** on 888,888,888 or **$0.0552–$0.1104** on 224,573,096 | [R1][R2] |

---

## 4 · Allocation split, vesting and cliffs

| Token | Allocation (sums to 100) | Vesting / cliffs | Sources |
|---|---|---|---|
| **AZUR** | Ecosystem & community 37.5 · Core contributors 27 · Investors 22 · DAO treasury 13.5 | Contributors: 1-year lock, then 30 months linear, block-by-block. Investors: 6–9-month lock, then 24–30 months linear. DAO: 6% at TGE; 7.5% locked 6 months then 30 months linear. Ecosystem: 9.2% at TGE; 3% airdrop linear over 6 months; 25.3% locked 6 months then 42 months linear | [S1]; split percentages from [S2] (the official page shows the split as an image I could not read as text) |
| **LMTS** | Investors 25 · Team 25 · Ecosystem rewards (airdrop + incentives) 24.37 · Treasury 13 · Liquidity 10 · Kaito pre-sale 1.37 · Echo round 1.26 (sum 100.00 **derived**) | Investors + Echo: nothing at TGE, 6-month lock, 24 months linear. Team: nothing at TGE, 12-month hard lock + 24-month soft lock (≥ 36 months). Treasury ("Vault"): nothing at TGE, 6-month lock, 24 months linear. Kaito: 50% at TGE, 50% after 6 months. Airdrop: 100% unlocked at TGE, no lock. Liquidity: not specified | [S4]; allocation corroborated by [S7] |
| **ZORA** | Investors 26.1 · Incentives 20 · Treasury 20 · Team 18.9 · Airdrop 10 · Liquidity 5 (sum 100.0 **derived**) | Team: monthly over 3 years after a 6-month delay. Treasury: unlocked over 4 years after a 6-month delay. Team, treasury and investors share a 6-month cliff (Sept 2025) then monthly vesting | [S25]; split from [S26] **snippet**; cliff from [S27] **snippet** |
| **FRIEND** | Airdrop 88 · LP rewards / incentives 12 | Not stated on the source page | [S22] |
| **ZTG** | "PLO" 39.9 · Foundation 22 · Team 15 · Shape the Future event 8 · Seed 7 · Strategic 6 · Marketing incentives 2 · Public sale (Gate.io IEO) 0.1 (sum 100.0 **derived**) | Seed: 12 months, 20% at genesis then continuous. Strategic: 9 months, 20% at genesis then continuous. Shape the Future: 30-day lock. IEO: no lock. Team/Foundation/PLO terms not stated. "PLO" is the aggregator's label; its expansion is **unverified** | [S13] (aggregator — primary Zeitgeist docs not retrieved) |
| **GNO** | ~4.17% sold; remainder held by Gnosis (**unverified**: community figure; "Gnosis still holds some 9 million tokens" is a Facebook-group snippet) | Not stated in retrieved sources | [S17] |
| **$MADx** | Contested: April canon 35/20/15/10/10/10 vs March vFinal 45/15/15/15/10; seed 10% in the Boardy brief | **None located** | [R2][R4] |

Observed pattern (descriptive, n = 3 with a stated schedule): AZUR, LMTS and ZORA all put investors
and team behind a **cliff of at least 6 months** (treasury too, except AZUR's 6% DAO unlock at
TGE), and team behind **12 months** (AZUR, LMTS hard lock) or **6 months + 3 years monthly** (ZORA). MAD has no schedule to compare.

---

## 5 · Airdrop and faucet design

| Token | Airdrop / faucet | Size | Eligibility / unlock | Sources |
|---|---|---|---|---|
| **AZUR** | "Azuro Score" activity airdrop | 3% of supply (30M AZUR) | Linear release over 6 months | [S1][S2] |
| **LMTS** | Points → season-end airdrop; Kaito Launchpad public sale | Airdrop sits inside the 24.37% ecosystem bucket (airdrop-only share **unverified**). Kaito: $1M raise, **>$200M** of requests (200× oversubscribed, **derived**) | Airdrop **100% unlocked at TGE**. Points convert per season [S8] **snippet** | [S4][S5][S8] |
| **ZORA** | Activity-snapshot airdrop | 10% = 1B ZORA | Snapshots 2020-01-01 → 2025-03-03 and 2025-03-03 → 2025-04-20. Unlock terms for the airdrop **unverified** | [S24][S28] |
| **FRIEND** | Airdrop to existing users | 88% of initial supply | Unlock terms **unverified** | [S22] |
| **ZTG** | "Shape the Future" event (tagged "Airdrop" by the aggregator, but priced: $1.25, $10M) | 8% | 30-day lock | [S13] |
| **GNO** | None — Dutch auction ($30 per GNO, stated as 0.6 ETH in [S16]; $12.5M raised in ~12 minutes) | ~4.17% | No vesting stated | [S16][S17] |
| **Hedgehog** | No token located. Design reference: users stake USDC for competition "Game Tokens" and play without risking capital; $3.5M seed | n/a | n/a | [S21] |
| **POLY** | Confirmed by Polymarket's CMO ("There will be a token, there will be an airdrop"); to follow the US relaunch; nothing else disclosed | — | — | [S10][S11] |
| **$MADx** | **500-credit onboarding faucet per owner**, off-chain, once per normalised owner string; placeholder purchase mints with no payment; both draw on the one shared cap; 1:1 redemption at TGE is a placeholder | See below | Nothing in `madx-web2.ts` links a grant to a unique person | [R1][R7] |

**MAD faucet arithmetic (all derived, for scale only).**
`224,573,096 ÷ 500 = 449,146` full welcome grants exhaust the cap before any purchase or staking
claim. `15,000 × 500 = 7,500,000` credits is **3.34%** of the 224,573,096 cap (**0.84%** of
888,888,888). The 15,000 figure is a waitlist, which canon says must never be called active users
[R2] §7. Faucet, purchase and staking rewards all call `mintAgainstCap`, so they compete for one
ceiling [R1].

---

## 6 · First 30 days of price

Returns are measured from each token's **first available daily close** (see §3 for the date and
the offset from launch). `D+N` is the daily close N days after that first close. Method and
caveats in §7.

| Token | First close | D+1 | D+7 | D+14 | D+30 | 30-day low close (vs first) | 30-day high close |
|---|---|---|---|---|---|---|---|
| **AZUR** (2024-06-20) | $0.1329 | −15.9% | −36.3% | −30.6% | **+55.8%** | $0.0744 on 2024-06-30 (−44.0%) | $0.2264 on 2024-07-20 |
| **LMTS** (2025-10-23) | $0.3019 | −10.9% | +26.6% | +4.4% | **−40.7%** | $0.1762 on 2025-11-22 (−41.6%) | $0.3821 on 2025-10-29 |
| **ZORA** (2025-04-23) | $0.01914 | +20.7% | −30.1% | −52.6% | **−49.7%** | $0.00907 on 2025-05-08 (−52.6%) | $0.02310 on 2025-04-24 |
| **FRIEND** (2024-05-04) | $1.668 | +48.2% | +24.7% | +6.1% | **−38.1%** | $0.9758 on 2024-06-01 (−41.5%) | $2.61 on 2024-05-06 |
| **ZTG** (2022-07-05) | $0.2706 | −3.1% | −20.3% | −37.1% | **−62.3%** | $0.0946 on 2022-08-01 (−65.0%) | $0.2706 on 2022-07-05 |
| **GNO** (2017-05-01 — **7 days after the auction**) | $74.82 | +24.3% | +56.7% | +60.7% | **+254.9%** | $74.82 on 2017-05-01 (0%) | $265.77 on 2017-05-24 |

Percentages for the low-close column are **derived** (`low ÷ first − 1`).

**Peak-to-D+30 and peak-to-today (derived).**

| Token | Intraday ATH (CoinGecko) | D+30 close vs ATH | Price 2026-11-01 | Today vs ATH |
|---|---|---|---|---|
| AZUR | $0.2396, 2024-07-20 | −13.6% | ≈ $0.000063 | ≈ −99.97% |
| LMTS | $0.6943, 2025-10-22 | −74.2% | $0.0308 | −95.6% (official token page shows −95.5% [S9] **snippet**) |
| ZORA | $0.1456, 2025-08-11 | n/a — peak came after D+30 | $0.00581 | −96.0% |
| FRIEND | $3.26, 2024-05-03 | −68.3% | $0.00235 | −99.93% |

**Cross-sample read (n = 5, GNO excluded because its window starts a week late).**
D+7 median **−20.3%** (3 of 5 negative); D+30 median **−40.7%** (4 of 5 negative; AZUR the only
gain, +55.8%). This is five launches across 2022–2025 with no market-beta adjustment, so it is a
description of the sample, not a base rate. Float did not separate the winners: AZUR (15.2%
float) and LMTS (~13%, unverified) split in opposite directions, and FRIEND (~100% float) fell
38% by D+30 but held for two weeks.

---

## 7 · Method and caveats

- **Price series.** Daily closes from the DefiLlama coins API:
  `https://coins.llama.fi/chart/coingecko:<id>?start=<epoch>&span=40&period=1d`. CoinGecko ids and
  `start` epochs (launch date − 1 day, 00:00 UTC): `limitless-3` 1761004800 · `azuro-protocol`
  1718582400 · `zora` 1745280000 · `zeitgeist` 1656547200 · `gnosis` 1492905600 · `friend-tech`
  1714435200. Metadata (supplies, ATH, today's price) from
  `https://api.coingecko.com/api/v3/coins/<id>?localization=false&tickers=false`. Retrieved
  **2026-11-01**. Both are cited as **[P]**.
- **First close ≠ launch day.** The series starts when the aggregator first has a price, which was
  launch day for ZORA only. AZUR started 2 days after the assumed 2024-06-18 start, ZTG 4 days
  after the 2022-07-01 TGE date, GNO 7 days after the auction. LMTS's first point is stamped
  2025-10-23 00:00 UTC, effectively launch-day's close, so LMTS's launch-day spike to $0.6943 sits
  **before** the first close.
- **AZUR launch date is not exact.** Sources say "June 2024" [S2]; the exact day is **unverified**.
  The earliest price point (2024-06-20) is used, so AZUR's D+N returns could be a day or two off.
- **FDV is `price × supply`**, with the supply stated in §3. Where supply changed since launch
  (ZTG, GNO, FRIEND, burns/unlocks) the figure is a basis-dependent estimate.
- **Secondary and aggregator sources.** Several allocation figures come from news outlets or
  aggregators (ICO Drops, Binance Square/BlockBeats, Yahoo, tokenomist.ai, DefiLlama). Where a
  project's own docs were retrievable (Azuro) they are used first. Limitless's own X post and
  site were not readable as text, so LMTS rests on a BlockBeats report of the official
  announcement, cross-checked against the tokenomist allocation.
- **Search snippets** are tagged **snippet** wherever a number was not seen on the fetched page.

---

## 8 · Gaps, conflicts and things not to quote

1. **MAD total supply is undecided** (888,888,888 vs 224,573,096 vs the Crystex fair-launch
   number). Anything that scales off supply inherits it. The monthly burn cap, for one, is
   **43,555,555** on the canon basis but **11,004,081** (`224,573,096 × 0.049`, **derived**) on the
   contract basis.
2. **LMTS initial float** is unverified; 13% is a March 2026 proxy, and CoinGecko's current 131.6M
   circulating (13.2%) still reads 13% even though the 6-month investor/Echo cliffs [S4] and a
   12-month team hard lock have since elapsed. That suggests CoinGecko's figure lags the schedule;
   this is **inference**, not a sourced fact.
3. **ZORA and ZTG initial floats** are unverified.
4. **ZTG price conflict.** The aggregator's $1.25 sale price is ~78% above the first market close
   ($0.2706, **derived**). Either the market fell sharply in the first days or the aggregator's
   price is wrong; the Zeitgeist primary docs were not retrieved.
5. **GNO supply and the 7-day gap.** The 10M figure is implied, not sourced from Gnosis;
   the price series misses the first week.
6. **Hedgehog and Omen**: "no native token" is the absence of evidence in the sources retrieved,
   not a finding.
7. **ZORA's chain** (Base or not) is unconfirmed from retrieved sources.
8. **No gaming-token comparable** and **no Polymarket allocation** exist in this file.
9. **MAD vesting, cliffs, TGE FDV and float are undefined in the repo.** This file cannot fill them;
   it can only show the range other launches used.

---

## 9 · Source index

Repo sources (checked at commit `955f8f7` on 2026-11-01):

| ID | Source |
|---|---|
| R1 | `verify/lib/madx-web2.ts` (`MADX_BETA`, `onboard`, `buy`, `claim`, `mintAgainstCap`) |
| R2 | `docs/boardy/CANONICAL_NUMBERS_2026-08-19.md` §1, §7 |
| R3 | `docs/MAD_GAMBIT_MASTER.md` PART 0 §3, lines 144–145 (supply row; `0xb61ae772…fd18` is ORKx) |
| R4 | `docs/MAD_GAMBIT_MASTER.md` line 147 (distribution split row), line 714 (April canon), line 1097 (contradiction 1, March split) |
| R5 | `docs/MAD_GAMBIT_MASTER.md` PART VII §1 (sell pressure) and §8 (monthly burn cap, line 1222) |
| R6 | `docs/THREAD_CLOSEOUT_maths-engine-room.md` §3, §4 |
| R7 | `verify/app/api/v1/madx/buy/route.ts` (header comment, lines 8–9) |

External sources (all retrieved 2026-11-01):

| ID | URL | Used for |
|---|---|---|
| S1 | https://gem.azuro.org/knowledge-hub/azur/tokenomics | AZUR supply, initial circulating, vesting, TGE unlocks |
| S2 | https://www.gate.com/learn/articles/azuro-azur-understanding-the-infrastructure-protocol-for-prediction-markets/4923 | AZUR allocation split, "June" launch |
| S4 | https://www.binance.com/en/square/post/31319746909810 | LMTS allocation + unlock terms (BlockBeats, 2025-10-21, citing the official announcement) |
| S5 | https://www.etf.com/sections/news/limitless-prediction-market-closes-10m-seed-round-ahead-lmts-token-launch | LMTS seed round, Kaito sale ($1M raise, >$200M requests), 2025-10-20 |
| S6 | https://yellow.com/news/coinbase-lists-lmts-token-but-it-also-funded-the-project-that-created-it | LMTS launch date 2025-10-22, ATH, 13% circulating, Coinbase listing 2026-03-05 (published 2026-03-04) |
| S7 | https://tokenomist.ai/limitless-3/unlock-events | LMTS allocation cross-check; "circulating at TGE: not stated" |
| S8 | https://airdropalert.com/airdrops/limitless-exchange/ | Points → season airdrop (**snippet**) |
| S9 | https://limitless.exchange/token | LMTS price, ATH drawdown (**snippet**) |
| S10 | https://airdrops.io/polymarket/ | POLY unlaunched; CMO quote; page modified 2026-09-30 |
| S11 | https://www.binance.com/en/square/post/324665334652225 | POLY confirmation dated 2025-10-24 (**snippet**) |
| S12 | https://polymarket.com/predictions/airdrops | Polymarket runs FDV markets on airdrops; page states "as of November 1, 2026" (**snippet**) |
| S13 | https://icodrops.com/zeitgeist/ | ZTG rounds, prices, allocation, vesting, TGE date 2022-07-01 |
| S14 | https://www.bitskwela.com/short-guides/introduction-to-zeitgeist | ZTG genesis supply 100,000,000 (**snippet**) |
| S15 | https://icoanalytics.org/projects/zeitgeist/ | ZTG alternative supply 115.46M (**snippet**) |
| S16 | https://www.forbes.com/sites/rogeraitken/2017/04/24/gnosis-prediction-market-scores-12-5m-in-record-breaking-crypto-auction/ | GNO auction: $12.5M, $30 / 0.6 ETH, ~$300M, 2017-04-24 |
| S17 | https://www.reddit.com/r/ethtrader/comments/67ax24/to_all_gnosis_token_holders_take_a_seat_before/ | GNO 4.17% sold, "312.5 Million" valuation (community post, **snippet**) |
| S19 | https://dxdocs.eth.limo/docs/Products/omen/faq/ | Omen design (Conditional Tokens + Realitio); no token mentioned (**snippet**) |
| S21 | https://www.businesswire.com/news/home/20210928005066/en/Hedgehog-Launches-No-Loss-Prediction-Markets-on-Solana-Mainnet-with-%24100K-in-Prizes | Hedgehog no-loss design, $3.5M seed |
| S22 | https://www.coingecko.com/en/coins/friend-tech | FRIEND supply, 88/12 distribution, ATH $3.26 |
| S23 | https://www.gate.com/price/friend.tech-friend | FRIEND "created on May 3, 2024" (**snippet**) |
| S24 | https://beincrypto.com/zora-announces-token-launch-date/ | ZORA supply, 10% airdrop, snapshot windows, ~$0.03 / ~$300M pre-market, 2025-04-21 |
| S25 | https://finance.yahoo.com/news/ethereums-zora-platform-announces-zora-110703433.html | ZORA team/treasury vesting (**snippet**) |
| S26 | https://tokenomist.ai/zora/unlock-events | ZORA allocation split (**snippet**) |
| S27 | https://defillama.com/unlocks/zora-protocol | ZORA 6-month cliff, circulating 4.47B (**snippet**) |
| S28 | https://thedefiant.io/news/nfts-and-web3/zora-announces-token-airdrop-for-fun | ZORA 10% airdrop announcement, 2025-03-03 |
| P | https://coins.llama.fi/chart/coingecko:`<id>`  and  https://api.coingecko.com/api/v3/coins/`<id>` | All price series, ATHs, today's price (see §7) |
