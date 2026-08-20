# Canonical Numbers — Reconciled 2026-08-19

**Source:** Boardy consolidated Cloud Opus 5 brief (`boardy@boardy.ai`, 2026-08-19 09:08 UTC),
reconciled against `.agents/skills/mad-gambit-math/references/canonical-numbers.md`,
`SESSION_HANDOFF.md` §1, and `verify/public/pitch/index.html` (published Data House).

Boardy's rule, quoted: *"Canonical revisions from the published data room — where documents
differ, use these values."*

---

## 1. Locked — unchanged, verified in code and Data House

| Item | Value | Verified against |
|---|---|---|
| Platform rake | **1.88%** (188 bps) — never 1.888% | `gambit-game-math.ts`, Data House ×13 |
| Creator share (creator-made markets only) | **40%** of the rake (platform takes the other 60%) | Data House Revenue Distribution Flow |
| Community + DAO treasury | **28.8% of the PLATFORM share** (net, after creator) — *not* of the rake | Data House Platform Allocation; founder confirmed 2026-08-20 |
| MAD Shield recovery allocation | **28.8%** of the rake | canonical-numbers.md |
| MAD Shield opt-in premium band | **2%–4%** | Boardy brief; SHIELD_RISK_DEFENCES.md |
| MAD Shield standard recovery cap | **28.8%** of losses | Boardy brief |
| $MADx total supply | **888,888,888** | canonical-numbers.md |
| Seed | **$1.24M – $2.48M @ $12M pre-money**, SAFE or equity | Data House ×11 |
| Token allocation to seed | **10%** | Boardy brief (new — not previously in repo) |
| LLC jurisdiction | **New Mexico** (filed; NOT Wyoming) | filing PDF |

## 2. Revised — Boardy's data-room values supersede the repo

| Item | Repo / Data House (old) | **Adopted (new)** | Delta |
|---|---|---|---|
| Y3 gross revenue headline | $154.5M | **$139.6M base case** | −$14.9M |
| Y3 bull case | *(not separated)* | **$177.7M — bull only, never the headline** | new split |
| Market taxonomy | binary / categorical / scalar | **Five market types, incl. Gossip-Cop** | restructured |
| Primary chain narrative | "Base L2 primary" (skill file) | **Arbitrum Nova primary gameplay** | corrects skill file |

> ⚠️ **REQUIRES FOUNDER SIGN-OFF.** `canonical-numbers.md` states any change needs explicit
> founder approval. The Y3 headline change is material and investor-facing. Adopted here on the
> instruction to ingest Boardy's updated canonical data; revert if not intended.
>
> The **$3.6B–$4.2B annual volume** and **51/31/12/6 stream split** were *not* restated by Boardy.
> They are retained but are now **unreconciled with the $139.6M headline** — the old split was
> derived from $154.5M. Treat the stream percentages as **conceptual** until the model is re-run.

## 3. Chain story — full canonical sequence

| Chain | Role |
|---|---|
| **Arbitrum Nova** (42170) | Primary gameplay |
| **Arbitrum One** (42161) | Liquidity, MAD Shield vaults, $MADx |
| **Ethereum L1** | Governance anchor |
| **Base L2** | Phase 3 expansion |
| **HyperEVM** | AI-agent settlement |

## 4. Staking tiers — ⛔ UNRESOLVED CONFLICT, DO NOT PITCH

The published data room and the implementation **do not agree**. Boardy's rule is *"treat the code
as the implementation authority"* but *"the published data room as the tie-breaker when
documentation conflicts."* Those point in opposite directions here, so this needs founder
resolution before either set is used in an investor conversation.

| Boardy / data room (4 tiers) | | | `gambit-game-math.ts` `STAKING_TIERS` (6 tiers) | | |
|---|---|---|---|---|---|
| **Tier** | **Stake** | **Yield** | **Tier** | **Stake** | **APY** |
| Bronze | 88 | 8.8% | Bronze | 100 | 12% |
| Silver | 888 | 18.8% | Silver | 500 | 18% |
| Gold | 8,888 | 28.8% | Gold | 2,500 | 28% |
| MAD Tier | 88,888 | 38.8% | Platinum | 10,000 | 42% |
| — | — | — | Diamond | 50,000 | 58% |
| — | — | — | MAD Tier | 100,000 | 68% |

**Status: CONCEPTUAL** until reconciled. Do not put staking yields on a slide.

### Shield recovery tiers — code-verified, consistent

`gambit-game-math.ts` implements a continuous dial, which *does* corroborate the call:
Standard **28.8%** → Shielded **40%** (continuous by premium tier) → Whale/VIP **60%** (gated,
additive third tier). This matches Nick's "limited VIP-only 60% format" from the kickoff call.

## 5. Market taxonomy — five types

Progression · Saga · Z-Liar · **Perpetual** · Gossip-Cop

**Perpetual families:** Z-Liar Meter, Gossip-Cop, Perpetual Epiphanies.
Perpetual Epiphanies files *under the perp enum* — it does **not** need its own enum value.

**Call-surfaced names needing reconciliation to code before use:** Wire Meter, Gossip Cup,
Zeitgeist, Five Faces. Boardy: *"Reconcile these names with the code taxonomy rather than
presenting them as additional enum values without evidence."* Not yet found in
`verify/lib/gambit-game-math.ts` — **conceptual** until they are.

## 6. Funding asks — keep separate

| Tranche | Amount | Purpose |
|---|---|---|
| **Infrastructure** | **$15K – $20K** | 3–6 months GitHub, Vercel, frontier-model usage, cloud, one capable dev machine. Excludes living expenses. |
| **Bridge** | **$300K – $500K** | Product, technical execution, testing, security, infra, ecosystem, initial market validation. |
| **Seed** (standing) | **$1.24M – $2.48M @ $12M pre** | SAFE or equity, 10% token allocation. |

Target geographies: **US, UK, Germany, Dubai**.
Do **not** prioritise Canadian investors/studios for perpetuals work — regulatory environment.
Avoid retainer-based intermediaries and passive capital.

## 7. Numbers that must NOT be used as proof

- **15,000 pre-registered / waitlist** — waitlist only. Never "active users", "revenue",
  "retention", or "product-market fit".
- **70%+ D30 retention** — a *target*, not measured. Currently stated as fact in
  `whitepaper-sheet.tsx` §02. Corrected in this branch.
- **"100% USD solvency across 1,000 Monte-Carlo bear scenarios"** — Boardy requires sample size,
  assumptions, win-rate range, model outputs, and methodology before investor use. Currently
  stated unqualified in `whitepaper-sheet.tsx` §04. Corrected in this branch.
- **"4.8x industry retention"** (`DATA_HOUSE_FULL.md`) — unsourced. Conceptual.
- **"Industry's first"**, **"regulatory-safe"**, **"no counterparty risk"**, **"100% DeFi
  secured"** — banned until prior-art / architecture / custody review supports them.

## 8. Non-live — specification only, no code evidence

Projected stock move · Ad-revenue-loss projection · Virality ODE · Effective-time integral ·
Triple-Threat Oracle Cascade (social scan → MADDAO vote → creator veto).

Server-side proprietary coefficients must never be invented or reverse-engineered from
screenshots.

---

## 9. Findings from the 10 supplied attachments (2026-08-19 15:01)

The 10 images are: 2 live MPP product screens, the OV pitch-control state, the Cultural Card
Asset Ledger, an Alps Capital investor-intake spec, a 6-part McKinsey deck framework (4 images),
and a third-party Kalshi structural teardown.

### 9a. ⛔ Two incompatible fee models are live simultaneously

The Cultural Card Asset Ledger screen shows a **"UNIVERSAL PLATFORM FEE CAPTURE SCHEDULE —
1.888% RATE"** with sub-allocations:

| Bucket | Shown |
|---|---|
| Burn confirmed | 0.888% |
| APY stakers pool | 0.500% |
| MAD Protect reserve (escrow shields) | 0.500% |
| **Total** | **1.888%** |

This is a **different fee architecture** from canon, not a rounding difference:

| | Canonical (code) | Screenshot |
|---|---|---|
| Rake | **1.88%** | 1.888% |
| Split basis | % *of the rake* | absolute % of volume |
| Buckets | Creator 40% · Community 28.8% · Shield 28.8% | Burn 0.888 · Staking 0.500 · Protect 0.500 |
| Creator share | **40%** | **absent entirely** |

Boardy is explicit: *"Rake: 1.88%, not 1.888%."* The screenshot model also **drops the creator
share**, which is the core differentiator of the whole pitch.

**Not present in `MAD-MPP-2.23`** — `grep` finds zero occurrences of `1.888` or `0.888` in
`verify/public/pitch/*`. It is deployed from another build, most likely the Vercel project
`datahouse_mathsengine` or `o-v_deck26` (team `madgambit`). **Locate and reconcile before any
investor sees both surfaces.**

### 9b. ✅ Wrong jurisdiction — fixed

`ov-pitch-deck.html` carried **"WYOMING COMPLIANCE ASSURED · L.C. 2026"** and **"WYOMING
INCORPORATION FILE SUMMARY"**, against 16 correct New Mexico references in the same file.
Canonical is **New Mexico, filed** (verified against the filing PDF). Both replaced; "compliance
assured" also dropped as an unverified legal conclusion.

### 9c. ⚠️ Placeholder metrics rendering as real

The MPP split-flap chrono displays **WIN STREAK RECORD 12 · TOTAL USERS (K) 24 · APY BOOST % 48**.
"24K users" reads as a live metric, is not one, and contradicts the 15,000 waitlist figure used
elsewhere. Instrument dials show BTC $69,420 / XRP $0.62 — sample values.
**Label as sample data or remove before any live demo.**

### 9d. Product surfaces confirmed live (Demonstrated)

Real, running UI in the screenshots: PREDICTION / CONVICTION / AFFLICTION / OCTAVIAN navigation ·
satirical two-row news wire pulling real sources (The Hill, The Sun, BuzzFeed) · per-item Z-Liar
scores (9, 41, 71, 77, 86) · category tagging (Headlines & Politics, Tabloids & Gossip, Viral
Media & Tech) · instrument cluster with dual dials and split-flap chrono · Neon Noir theme ·
5-item bottom nav. This corroborates "Demonstrated", not "Validated".

### 9e. Naming inconsistency

"MAD GAMBIT L.C." (OV deck) vs "MAD-GAMBIT LLC" (filing). Standardise on **LLC**.

### 9f. Competitive wedge — third-party Kalshi teardown

A public analysis in the attachments argues Kalshi's "peer-to-peer" framing is undermined by its
own structure: market makers (Susquehanna) and Kalshi's trading arm supply liquidity and assume
risk, making the economics equivalent to a sportsbook; the real innovation is CFTC-versus-state-
gaming **regulatory arbitrage**. **Cite as third-party analysis, never as our own finding.**
This is the strongest available argument that creator-owned market economics is a structural
difference rather than a cheaper competitor.

---

## 10. Founder clarification — fee split (2026-08-20, Nick)

> "40 to 60% profit share is from Creator Markets, it's 28.8% of net profit-share to community
> and DAO treasury for rewards, marketing, and grants... but canonical yes."

**Confirmed canonical:** platform fee **1.88%**, community allocation **28.8%**.

**Restated by the founder:**
- Creator profit share is a **40–60% range**, and it applies to **Creator Markets**.
- The **28.8%** is of **net profit-share**, and it goes to **community *and* DAO treasury**,
  earmarked for **rewards, marketing, and grants**.

### ⛔ This does not match `splitFee()` — reconcile before investor use

`verify/lib/gambit-game-math.ts`:

```
grossFee     = volume * 1.88%
creatorCut   = isCreatorMarket ? grossFee * 40%   : 0   // CREATOR_SHARE_BPS 4000
communityCut = grossFee * 28.8%                          // COMMUNITY_SHARE_BPS 2880
protocolCut  = grossFee - creatorCut - communityCut       // 31.2% on a creator market
```

| Dimension | Founder statement | Code |
|---|---|---|
| Creator share | **40–60% range** | **40% flat** — no upper tier exists |
| 28.8% denominator | **net profit-share** | **gross fee** |
| Recipients | community **+ DAO treasury** | single `communityCut` |
| Earmark | rewards · marketing · grants | not modelled |

**Why this matters:** the denominator changes every downstream revenue number. On a creator
market the code leaves protocol 31.2% of gross; a net-based 28.8% implies a different base and a
different protocol take.

⚠️ **Possible conflation to rule out.** The pair 40/60 *does* appear in the code — but as **MAD
Shield loss-recovery tiers**, not creator share:
`SHIELD_RECOVERY_PREMIUM_PCT = 0.40` (shielded) and `SHIELD_RECOVERY_WHALE_PCT = 0.60` (VIP),
above the 28.8% standard pool recovery. Confirm whether the creator 40–60% range is a genuine
separate design or an upstream mix-up with the Shield tiering.

### Open questions for Nick
1. **What moves creator share from 40% to 60%?** Volume, tenure, staking tier, VIP status,
   negotiated? Nothing in code implements a range.
2. **What is "net"?** Gross fee minus what — creator cut, infrastructure, oracle costs, all three?
3. **What is the community / DAO treasury split** inside the 28.8%?
4. Should `splitFee()` be changed to match, or is the code correct and the narrative loose?

**Until answered:** on slides, state only what `splitFee()` enforces — **1.88% rake · 40% creator
on creator-made markets · 28.8% community** — and describe the 40–60% range and the DAO treasury
earmark as designed, not implemented. Do **not** label the range LIVE.

### ✅ RESOLVED (2026-08-20) — found in the published Data House

Per Nick's instruction to review the canonical data. `verify/public/pitch/index.html` and
`madhats-gambit.html`, **Revenue Distribution Flow**, state it exactly:

```
Creator-Made Market:  40% of Fee (0.752% of Vol) -> Creator Wallet  ·  60% -> Platform
Platform-Made Market: 100% -> Platform (1.88% of Vol)
Platform Allocation:  35% Operations · 25% MAD Shield Pool · 10% Token Burn
                      · 28.8% Community Rewards · 1.2% Reserve      (= 100%)
```

**Both questions answered:**

1. **There is no 40–60% creator range.** "40 to 60%" is the **two sides of one split** on
   Creator Markets: creator **40%** of the fee, platform **60%**. The creator share is a flat
   **40%** — which matches `CREATOR_SHARE_BPS = 4000` exactly. Code and canon agree.
   The earlier "conflated with Shield 40/60" hypothesis was wrong; disregard it.
2. **The 28.8% is of the platform's share**, i.e. of net after the creator is paid — confirmed by
   Nick as "28.8% of net profits". It is one line in a five-way Platform Allocation, alongside
   Operations, Shield Pool, Token Burn and Reserve.

### ⛔ `splitFee()` implements the community cut on the wrong base — BUG

```ts
// verify/lib/gambit-game-math.ts — current
const communityCut = grossFee * bpsToPct(PLATFORM.COMMUNITY_SHARE_BPS); // 28.8% of GROSS
```

Canon applies 28.8% to the **platform share**, not the gross fee. On a creator market:

| | Community cut |
|---|---|
| Canon | 28.8% × 60% of fee = **17.28% of gross fee** |
| Code | **28.8% of gross fee** |
| Error | **+11.52 pp of gross fee over-allocated** |

The code's `protocolCut = gross − creator − community` also yields 31.2% on a creator market,
whereas canon says the platform keeps **60%** and then allocates internally. The code models a
flat three-way split; canon is a **two-stage waterfall**.

**Proposed shape (needs founder sign-off before any code change):**
```
grossFee      = volume * 1.88%
creatorCut    = isCreatorMarket ? grossFee * 40% : 0
platformShare = grossFee - creatorCut                  // 60% creator-made, 100% platform-made
  operations  = platformShare * 35%
  shieldPool  = platformShare * 25%
  tokenBurn   = platformShare * 10%
  community   = platformShare * 28.8%   // community + DAO treasury: rewards, marketing, grants
  reserve     = platformShare * 1.2%
```
Do **not** change `splitFee()` without sign-off — it moves real token flows.

### ✅ Fixed: 1.888% contamination inside the primary Data House

The flow line read **"40% of Fee (0.7552% of Vol)"**. That figure is `1.888% × 40%`, not
`1.88% × 40%`. The correct value is **0.752%**. Corrected in both `index.html` and
`madhats-gambit.html` — the headline said 1.88% while a derived figure was computed from 1.888%.
