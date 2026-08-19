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
- Three numbers only — these are code-verified, say them with confidence:
  - **1.88%** platform rake. Global.
  - **40%** of it to the creator who made the market.
  - **28.8%** to the community pool.
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

## Q&A — the four you will actually get

| Question | Answer in one breath |
|---|---|
| *"Isn't this just Polymarket for gossip?"* | "Polymarket settles facts. We price conviction continuously, and the creator who makes the market earns 40% of the rake. Different asset, different economics." |
| *"How do you resolve subjective markets?"* | "Honestly — that's the open problem. The cascade design is social scan, DAO vote, creator veto. It's specified, not shipped. That's part of what the bridge funds." |
| *"Who's your technical team?"* | "Today it's me, and that's the constraint I'm funding. Engine and contracts are written. I want an accountable partner against milestones, with equity — not a dev shop on retainer." |
| *"What's the regulatory exposure?"* | "Perpetuals are why I'm not building this in Canada. New Mexico LLC filed. I'm not going to give you a legal conclusion I haven't paid for." |

## Pre-flight

- [ ] Data House open in a second tab — `verify/public/pitch/index.html`
- [ ] Deck fits 3:00 on a live timer, not a read-through
- [ ] Y3 revenue headline confirmed (**$139.6M base**, not $154.5M — see `CANONICAL_NUMBERS_2026-08-19.md`)
- [ ] Every number said aloud traces to `FEATURE_TRACEABILITY_MATRIX.md`
- [ ] Staking yields **not** mentioned — code and data room still disagree
