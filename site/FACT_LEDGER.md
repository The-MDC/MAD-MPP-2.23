# madgambit.io — fact ledger

Every claim on the page, where it comes from, and how it was checked. **Authority order: code → published
data room → founder canon.** Checked 2026-11-01 against `main` at `955f8f7`. The plan and open findings live in
`docs/MAD_GAMBIT_MASTER.md` (PART 0 §5, Workstream D) — this file is evidence, not a plan.

Sources: **Brief** = *MAD-Gambit-Infographic-Exec-Brief-& IP-Hotheet.pdf* (Drive, 2026-10-16) · **Deck** = Drive doc
*mad-gambit-conviction-deck* · **MDC** = Drive doc *MADdegens Social and Community blurb* and the
`MADdegen/The-MADDEGENS` repo description.

| Claim on the page | Source | Check | Result |
|---|---|---|---|
| 1.88% flat rake; $18.80 per $1,000 | Brief; Deck | `PLATFORM.FEE_BPS = 188`; calculator vs `splitFee` in `verify/lib/site-fee-calc.test.ts` | ✅ code |
| Creator ladder 28.8% → 40% (60% VIP, limited) | Brief; Deck | `CREATOR_LADDER`, `VIP_PROFIT_SHARE_*` in `gambit-game-math.ts` | ✅ code. Site models 28.8% and 40% only |
| Community = 28.8% of what remains after the creator | code | `splitFee`: community = net × 2880 bps. The Brief says "Community + DAO takes 28.8%" without saying of what | ✅ code wins; wording on site follows code |
| Worked example: 40% rung, $10,000 → creator $75.20, community $32.49, protocol $80.31 | code comment above `splitFee` | Calculator output in browser | ✅ matches |
| 15,000 early sign-ups — a waitlist, not users | Brief; Deck | Both say so in terms | ✅ stated as such wherever it appears |
| 992 cards · 8 factions · 7 rarities | Brief; Deck | `PLATFORM.TOTAL_DECK_SIZE = 992`; pinned by tests | ✅ code (factions / rarities: Deck, not re-derived here) |
| GARCH volatility clamp 0.09 – 0.68 | Brief; Deck | `PLATFORM.SIGMA_MIN / SIGMA_MAX` | ✅ code |
| Shield premium clamped to 2–4% of stake; recovery 28.8% standard, 40% max | Brief; Deck | `SHIELD_PREMIUM_*`, `SHIELD_RECOVERY_*` | ✅ code. The engine still allows a 60% whale rung (MASTER PART 0 §5) — **site says 40% max, per canon** |
| Perp trigger ≈ 0.87 at 8 matches, 0.95 at 12 | Brief | `perpTriggerProbability` pinned in `pitch-canon.test.ts` | ✅ (Brief prints 0.865 / 0.950) |
| Furnace burn ≤ 4.9% per 30 days | Brief; Deck | `PLATFORM.FURNACE_BURN_CAP = 0.049` | ✅ code |
| $MADx design supply 888,888,888 | Brief; Deck | `PLATFORM.MADX_FIXED_SUPPLY`. On-chain cap in `lib/contracts.ts` is 224,573,096 (owner-modifiable) | ⚠️ founder to confirm which is current (MASTER finding 2). Site says "design supply" only |
| Allocation 45 / 15 / 15 / 15 / 10 with the stated vesting | Deck §13.01 ("fixed") | Sums to 100; the Deck marks two older splits retired | ✅ Deck canon, not in code |
| $MADx contract `0x6972…151f`: name MADDEX, symbol MADx, total supply 0, verified, Arbitrum One | repo `lib/contracts.ts` | Blockscout `get_address_info` + `eth_call` `name()`, `symbol()`, `totalSupply()`, 2026-11-01 | ✅ **on-chain.** The Brief's printed address `0x8972…1511` is **not a contract** — not used |
| Utility: governance, staking, fee share, discounted fees, buy-and-burn | Deck | Designed; no staking contract exists | ✅ shown as "designed" |
| Six formats; Binary and Progression "in the engine", other four "in design" | Brief (formats); code | `MARKET_TYPES`, `BookVenue` in `lib/market-classifier.ts`, `lib/market-book.ts`; no over/under or multiple-choice outside the LMSR maths | ✅ code. **Infographic overstates** (MASTER finding 9) |
| Perpetual families: Z-Liar, Gossip-Cop, Epiphanies "implemented"; Five Faces, Zeitgeist "direction" | Deck; Brief | Deck marks the first three Implemented; Brief calls the last two direction | ✅ |
| Z-Liar prices a statement, never a speaker | Deck (disclosure rule) | Deck cites the code's own description of the family | ✅ policy |
| Eight-stage road, stage 1 "now", rest planned | Brief | Brief marks each; no dates are given on the site | ✅ |
| IP register: 14 / 2 / 1 / 5 / 1 of 23 | Brief (infographic) | Sums to 23. The IP hot sheet's own table lists 15 entries ("12 of 15 in code today") — a different cut | ⚠️ reconcile in D0; site uses the infographic counts and labels them "register" |
| Exists / does not exist yet lists | Deck "data room index" | "Deployed contracts — nothing on mainnet" is **out of date**: the token contract is on Arbitrum One. Site says "market and Shield-vault contracts" | ✅ corrected |
| MDC: social crowdfund superDAO and Web3 accelerator "MADforge"; one rule of common decency; North Star quote | MDC | Repo description and blurb, used as the community's own words | ✅ identity copy. Links return 200 (not proof they are the intended accounts) |
| MADDAO: quadratic funding, stake-weighted voting with a cap, futarchy-style pools; rake and creator share never on the ballot | Brief IP sheet (governance row) | `VOTE_POWER_CAP = 240` (the Brief's "24×" is wrong — site gives no multiple); contracts not built | ✅ chip says "maths in code · contracts planned" |
| Team: Nick J. McLeod · Carlo B. Fernandez · Zena Shah (names and roles only) | Brief | Founder-supplied; one name differs from its linked profile (MASTER finding 11) | ⚠️ name to confirm; bios deliberately omitted |

## Left out on purpose

- **Investment terms** (the funding asks, any investor token offer and valuation). The Deck itself says
  structure is "to be confirmed with counsel". A public page is not the place for an offer. They go in the data room.
- **Proprietary values**: GARCH ω α β, Cobb-Douglas weights, emotion weights, Z-Liar weights, DL-LMSR `b`. The Brief says these are NDA.
- **Year-3 revenue and category statistics** (the model's $121.4M, $3.03B volume, $52.9B/month category volume, incumbent valuations).
  The Brief flags $65.0M of the model as unattributed, and the third-party figures are unsourced here.
- **Any creator-dollar figure** — "net" is still undefined at the founder level.
- **Real-person imagery.** `The-MADDEGENS`/`MANIACs` art features caricatures of identifiable public figures. It conflicts with the
  product's own no-identification rule and was not used.
- **Superseded numbers** in the `The-MADDEGENS` README and the Sep 2025 MDC & MADDAO whitepaper (5% fee, 1B supply, $167.7B TAM,
  "zero competitors"). Identity copy only was taken from them.
- **The dead presentation URL** (`the-mdc.github.io/MADHATs-Gambit-Presentation`, 404).

## Assets

Every image on the site, its source and what was held back are in `site/ASSET_CATALOGUE.md`. The MAD Gambit symbols belong to the app; the site uses only the Prediction / Conviction / Affliction trio.
