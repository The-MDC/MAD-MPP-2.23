# 3-Minute High-Impact Pitch — Speaker Notes

**Companion to:** `verify/public/pitch/3min.html` (6 slides)
**Built on:** Boardy's three-beat structure — competitive gap → perpetuals portfolio → economic IP
**Total:** 3:00. Word budget ≈ 430 spoken words. **Do not add slides.**

**Rules Boardy set, applied here:**
- One main claim per slide.
- Lead narrative must land **without** the words *stop-loss co-ownership engine*, *circular yield*,
  or *conviction economy*. Those come after the user action is clear — or not at all in 3 minutes.
- Never call the waitlist "users". Never call a demo "production".
- Close on the **precise** ask.

---

## 🚨 Live-surface state — read before you open anything (checked 2026-08-20 15:15 UTC)

> **Superseded 2026-11-03.** The app lives at **madgambit.fun** (Vercel project `mad-mpp-2-23`, team MAD-MPP). The `mad-mpp-2-23-madgambit.vercel.app` rows below describe the retired `madgambit` team's deployment. Do not open or share that URL.

| Surface | State | Do |
|---|---|---|
| `mad-mpp-2-23-madgambit.vercel.app` | **Behind Vercel SSO.** Anyone not on your Vercel team hits a login page. | Screen-share it — don't paste the link. Settings → Deployment Protection → Vercel Authentication → Disabled to fix. |
| Same, **content** | Last build **2026-08-19 14:00 UTC**. The 1.88% fix and the Octavian resize are on `main` but **not deployed**. | `cd verify && npx vercel --prod` before you show it, or demo from `npm run dev`. |
| `o-vdeck26.vercel.app` | Public, fee numbers correct — but says **"Manager-Managed Wyoming LLC"** and **"Wyoming Registered, SEC Compliant LLC Architecture"**, 7 occurrences. | **Do not open it.** Canon is New Mexico LLC (filed). Built from a source outside this repo; the copy here is already fixed. |
| `maddegen.github.io/MADHATs-Gambit-Presentation/` | **Dead** — repo 404s under both orgs. | Never hand this out. |

**If asked about entity on the spot:** "New Mexico LLC, filed." Nothing further — you have not paid
for a legal opinion, and the deck that says otherwise is a stale build you are replacing.

---

## SLIDE 1 — The gap · 0:00–0:25 (~60 words)

- Open cold, no company name yet: **"Prediction markets today are either truth machines or
  liquidity machines."**
- Polymarket, Kalshi → truth. DraftKings, Stake → liquidity.
- **The line:** "Nobody is pricing culture. And culture moves faster than either of them can settle."
- Then the structural point — this is the sharpest thing you say all pitch:
  **"And the 'peer-to-peer' ones aren't. When those markets go one-sided, professional market
  makers step in and carry the risk — that's the sportsbook position with a different regulator."**
- Land it: **"We're not a cheaper version of that. The creator who makes the market takes 40% of
  its rake. Different counterparty, not a better price."**
- One beat of silence. Let it sit.
- ⚠️ Attribute the market-maker point as **third-party analysis** if pressed — "that's a public
  teardown, not my claim." Never present it as proprietary research.
- ⚠️ Do **not** list competitors beyond two names — you lose 15 seconds and the room starts
  comparing instead of listening.

## SLIDE 2 — What it is · 0:25–0:55 (~70 words)

- **"MAD Gambit is an EVM-native conviction market for entertainment and creator economies."**
- Plain-language mechanic, in this order — this is the order Boardy specified:
  1. A creator turns a live headline into a market.
  2. People take a position on it.
  3. The market prices continuously — not just at resolution.
- **"Culture is the asset. Prediction is the dynamic layer. Creators own the economics."**
- ⚠️ Do not explain the card game here. It is a product line, not the wedge. If asked, one
  sentence: "Satirical NFT cards are the collectible layer on top."

## SLIDE 3 — The wedge · 0:55–1:35 (~85 words)

**This is the beat that differentiates. Spend the most time here.**

- **"We're not one market type. We're a family of specialised perpetuals."**
- Name them, fast, with the human question each answers:
  - **Z-Liar Meter** — is this person telling the truth?
  - **Gossip-Cop** — does this story hold up?
  - **Perpetual Epiphanies** — urban legends, Murphy's-law claims, cultural beliefs.
  - **Progression / Saga** — chained outcomes that compound.
- **The claim:** "Binary markets are a novelty format for us, not the product. Conviction is
  continuous, so the market never has to close."
- ⚠️ Say "specialised perpetuals" — **not** five separate enums. Wire Meter, Gossip Cup,
  Zeitgeist and Five Faces are **not yet in the code taxonomy**; don't name them as shipped.

## SLIDE 4 — The economic IP · 1:35–2:10 (~80 words)

- **"The economics are enforced in the contract, not in a pitch deck."**
- Three numbers only:
  - **1.88%** platform rake. Global. *(code-verified — say it with confidence)*
  - **40%** of the fee to the creator who made the market; the platform takes the other 60%.
    *(code-verified. There is no 40–60% creator range — 40/60 is the two sides of one split.)*
  - **28.8%** of the **platform's share** to the community pool and DAO treasury — rewards,
    marketing, grants. *(canonical, but `splitFee()` currently applies it to the gross fee, so
    don't call this one enforced-in-code until that's reconciled.)*
- Then the differentiator: **"And losses aren't final. MAD Shield is an opt-in, fee-funded
  recovery pool — 2 to 4% premium, 28.8% standard recovery, scaling to 40%."**
- ⚠️ **Never say** "insurance", "no counterparty risk", "regulatory-safe", or "industry's first."
  If pressed on solvency: *"Monte Carlo modelling is in the data room; I'll walk you through the
  assumptions rather than quote a headline."*

## SLIDE 5 — What's actually real · 2:10–2:35 (~65 words)

**Credibility beat. Volunteering the limits is what makes the rest believable.**

- **"Here's what's live, and here's what isn't."**
- Live: the mathematical engine — DL-LMSR pricing, GARCH(1,1) volatility, the fee split, the
  Shield dial. **In code, today.** SIWE auth and the Shield vault contract with Foundry tests.
- Demo: market factory, Z-Liar meter, the agent layer.
- Not yet: on-chain settlement cascade, deployed market contracts.
- **"15,000 people pre-registered. That's a waitlist, not traction — I won't sell it as more."**
- ⚠️ This slide wins technical investors. Do not cut it for time; cut Slide 1 to 20s instead.

## SLIDE 6 — The ask · 2:35–3:00 (~70 words)

- **Two asks, kept separate. State both, in this order:**
  1. **$15–20K infrastructure** — 3–6 months of build infrastructure and frontier-model usage,
     plus a capable dev machine. "This keeps the engine running."
  2. **$300–500K bridge** — product, testing, security, and an accountable technical partner
     against explicit milestones.
- **The close:** "I'm not looking for passive capital. I want an operator or a studio who can
  pressure-test the market design — and I'll give equity against milestones, not a retainer."
- Stop talking. Do not fill the silence.

---

---

# Deep-dive bullets — the seven Boardy asked for

Point form, for the room *after* the 3 minutes. Every line is tagged with what backs it:
**[LIVE]** in code · **[DEMO]** works but not production · **[SPEC]** written, not built ·
**[⚠️]** unresolved — do not assert. Sources: `FEATURE_TRACEABILITY_MATRIX.md`,
`CANONICAL_NUMBERS_2026-08-19.md`, `verify/lib/gambit-game-math.ts`.

## 1 · The wedge

- Prediction markets split two ways and **neither is entertainment-native**: truth machines
  (Polymarket, Kalshi) and liquidity machines (DraftKings, Stake). Culture prices faster than
  either settles. **[LIVE — positioning]**
- Kalshi's "peer-to-peer" framing is undercut by its own structure — Susquehanna and Kalshi's
  trading arm supply liquidity and carry risk, which is sportsbook economics; the actual
  innovation is CFTC-vs-state-gaming **regulatory arbitrage**. *Cite as third-party analysis
  in the attachments — never as our finding.* **[LIVE — third-party]**
- So the wedge is not "cheaper Polymarket". It is **who owns the market**: the person who
  creates it earns from it. That is a structural difference, not a pricing one.
- Concretely: **Market Factory** lets a creator launch an on-chain market and take a share of
  every trade in it. **[DEMO — frontend built, contract not deployed]**

## 2 · IP assessment methodology — how we know what we own

- We do not claim a feature until it is traced to a file. Every capability is graded
  **Implemented → Demonstrated → Validated → Conceptual** in `FEATURE_TRACEABILITY_MATRIX.md`,
  with the evidence path next to it.
- The grading is adversarial on purpose. It is what caught: the MADConv Cobb-Douglas formula
  is **Engine Room documentation with no implementation**; GDELT scandal velocity is **UI with
  no verified feed**; the oracle cascade is **slideware**. Those are marked Conceptual and are
  not pitched.
- Same method removed four claims from investor use: "15,000 users" is a **waitlist**;
  "70%+ D30" is a **target, not measured**; Monte-Carlo solvency needs its assumptions
  attached; MAD Shield is **not insurance**.
- **What this buys you as an investor:** when I say something is live, it is a file path.
  Ask me for it and I will open it.

## 3 · Value proposition

- **For the player:** the loss has a floor. MAD Shield is opt-in loss mitigation — pay
  **2–4%** of stake and a losing position recovers at your tier's cap. **[LIVE — `shieldPremium`,
  `shieldRecovery`]** Not insurance, not a guarantee — a stop-loss.
- **For the creator:** you launch the market, you earn the rake on it — up to **60%** of the
  fee at the top rung. Nobody else in the category pays the person who made the market.
- **For the platform:** emotional hedging is sticky. That is the retention thesis — and it is
  a **thesis**, not a measurement. Say it that way. **[⚠️ unmeasured]**
- One line: **conviction, prediction, affliction.** You back a take, you price it continuously,
  and the downside is dialled rather than absolute.

## 4 · Revenue sources

| Stream | Mechanism | State |
|---|---|---|
| Trading fees | **1.88%** flat on every market | **[LIVE]** `PLATFORM.FEE_BPS = 188` |
| NFT / card economy | 992-card deck, 8-tier Dutch-auction Scandal Packs, $8.88 floor → $296 conviction cap | **[LIVE]** `getAuctionPrice`, `SCANDAL_PACK_TIERS` |
| Staking & yield | Shield pool funded by premiums + Lido/Aave yield | **[⚠️]** tier table unresolved — **do not quote yields** |
| MAD Shield premiums | 2–4% opt-in on stake | **[LIVE]** `shieldPremium` |
| Evolution burns | Card burns as the deflationary sink; Furnace cap **4.9%/30d** | **[LIVE]** `FURNACE_BURN_CAP` |

- Y3 headline: **$139.6M gross, base case** on $3.6B–$4.2B annual volume. **$177.7M is the bull
  case and is never the headline.**
- The **51 / 31 / 12 / 6** stream split derives from the retired $154.5M model. **Do not quote
  it** until it is re-run against $139.6M. **[⚠️]**

## 5 · Maths and tech stack

**Maths — all of these are in `verify/lib/gambit-game-math.ts`, 1,405 lines, 117 exports:**

- **DL-LMSR** market making — `C(q) = b·ln Σe^(q_i/b)`, `P(i) = e^(q_i/b)/Σe^(q_j/b)`,
  volume-scaled α, liquidity `b = 1200`. **[LIVE]**
- **GARCH(1,1)** volatility — ω=0.0001, α=0.05, β=0.90, σ clamped to [0.09, 0.68]. **[LIVE]**
- **Shield premium** Φ = Stake · P(win) · σ · 0.35, clamped to [2%, 4%]. **[LIVE]**
- Conviction growth, temporal and stochastic decay; Fibonacci variable-reward schedule
  [5,8,13,21,34]; loss-aversion weight 2.5×. **[LIVE]** — game mechanics, *not* financial modelling.
- MADConv full Cobb-Douglas, half-Kelly sizing, virality ODE — **[SPEC]** documented only. Say
  "specified in the Engine Room, coefficients proprietary." Do not call it live.

**Stack:**

- Front end: **Next.js 15 / React / TypeScript / Tailwind**; 7-tab hub live. **[LIVE]**
- Chains: **Arbitrum Nova (42170)** primary gameplay · **Arbitrum One (42161)** liquidity,
  Shield vaults, $MADx · **Ethereum L1** governance anchor · **Base L2** Phase 3 ·
  **HyperEVM** AI-agent settlement.
- Contracts: **Foundry / Solidity / OpenZeppelin** — MADShieldVault, MADCard721/1155,
  FounderRegistry, MADStaking, P2PEscrow, SessionKeyManager. **Written and tested, not
  deployed.** **[LIVE code / not deployed]**
- Auth: **SIWE** on 42170. **[LIVE]** · Data: **Neon Postgres + Drizzle** · Host: **Vercel**
- Agents: LangGraph scraper/trader routes, AI concierge. **[DEMO — simulated/local]**

## 6 · Unit economics — per **$1,000** of market volume

Gross fee is **$18.80** (1.88%). Where it goes depends on the creator's ladder rung —
`CREATOR_LADDER` in code, unlocked by traction, not by negotiation:

| Rung | Unlock | Creator | Community + DAO | Protocol |
|---|---|---|---|---|
| **User** (28.8%) | default | $5.41 | $5.41 | **$7.97** |
| **MinorCreator** (40%) | 12 tractioned markets | $7.52 | $5.41 | **$5.87** |
| **CR8TR** (60%) | 34 markets + 888 followers | $11.28 | $5.41 | **$2.11** |
| Platform-made market | — | $0 | $5.41 | **$13.39** |

- **This answers the open question** in `CANONICAL_NUMBERS_2026-08-19.md` §10: what moves the
  creator from 40% to 60% is the **ladder**, gated on tractioned markets and followers.
  `splitFee(volume, creatorShareBps)` takes the rung directly and caps it at 6000 bps.
- **⚠️ The one number I will not defend yet.** The code applies the 28.8% community share to the
  **gross** fee; the founder's canonical statement is 28.8% of the **net** (post-creator) share.
  On a CR8TR market that is the difference between the protocol keeping **$2.11** and **$5.35**
  per $1,000. **Do not present a protocol take-rate until this is reconciled** — it moves real
  token flows and needs sign-off, not a patch.
- Honest framing if pressed: *"Creator-made markets are deliberately creator-heavy — that is the
  wedge. Platform-made markets carry the margin. The exact protocol take at the top rung is
  being reconciled this week and I am not going to quote you a number I would have to correct."*

## 7 · Defensibility

- **Economic IP, not code IP.** The bonding curve is public maths. What is not copyable is the
  **calibrated system**: DL-LMSR + GARCH + a recovery dial + a creator ladder that all have to
  hold together. Constants are tuned; the tuning is the asset.
- **The creator ladder is the moat that compounds.** A CR8TR needs 34 tractioned markets and 888
  followers. That history does not port to a competitor. Every rung climbed raises the cost of
  leaving. **[LIVE]**
- **MAD Shield is a capital moat.** A recovery pool with real solvency behaviour is expensive to
  stand up and expensive to copy badly. *(Solvency modelling exists; the "100% across 1,000
  Monte-Carlo scenarios" line needs its assumptions published before it is used as proof.)* **[⚠️]**
- **Card supply is fixed and burned.** 992 canonical cards, evolution burns as the sink, Furnace
  capped at 4.9%/30d. Scarcity is enforced in code, not policy. **[LIVE]**
- **Satire is a brand moat, not a technical one** — and I would rather say that plainly. It is
  hard to clone a voice; it is not hard to clone a fee schedule.
- **Honest weakness, say it first:** the single-founder technical constraint. Engine and
  contracts are written; nothing is deployed. That is exactly what the bridge round funds, and
  I would rather you hear it from me than find it in diligence.

---

## Q&A — the four you will actually get

| Question | Answer in one breath |
|---|---|
| *"Isn't this just Polymarket for gossip?"* | "Polymarket settles facts. We price conviction continuously, and the creator who makes the market earns 40% of the rake. Different asset, different economics." |
| *"How do you resolve subjective markets?"* | "Honestly — that's the open problem. The cascade design is social scan, DAO vote, creator veto. It's specified, not shipped. That's part of what the bridge funds." |
| *"Who's your technical team?"* | "Today it's me, and that's the constraint I'm funding. Engine and contracts are written. I want an accountable partner against milestones, with equity — not a dev shop on retainer." |
| *"What's the regulatory exposure?"* | "Perpetuals are why I'm not building this in Canada. New Mexico LLC filed. I'm not going to give you a legal conclusion I haven't paid for." |

## Pre-flight

- [ ] **Deployed?** `npx vercel --prod` run and READY — otherwise the live site is a day stale
- [ ] **SSO off**, or you are screen-sharing and never pasting the URL
- [ ] `o-vdeck26.vercel.app` **closed** — it still says Wyoming
- [ ] Data House open in a second tab — `verify/public/pitch/index.html`
- [ ] Fee card reads **1.88%** (it rendered *18.8%* until today — `node-registry.ts` `pct()` helper)
- [ ] Deck fits 3:00 on a live timer, not a read-through
- [ ] Y3 revenue headline confirmed (**$139.6M base**, not $154.5M — see `CANONICAL_NUMBERS_2026-08-19.md`)
- [ ] Every number said aloud traces to `FEATURE_TRACEABILITY_MATRIX.md`
- [ ] Staking yields **not** mentioned — code and data room still disagree
