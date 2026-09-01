# Demo Script — Happy Path + Failure Fallback

Follows the required sequence exactly: problem → live-headline market → classification &amp;
resolution condition → conviction/volatility → DL-LMSR price move → settlement path (live vs.
proposed) → MAD Shield economics → participant split → the ask. No step below uses "stop-loss
co-ownership engine," "circular yield," or "conviction economy" — those terms, if used at all,
come after the mechanics land, not before. Budget roughly 8–10 minutes at a walking pace;
trim step 4 first if you're short on time, not step 6 (the credibility beat) or step 9 (the ask).

**Before you start:** open the app fresh, confirm the RSS feed panel has loaded content (it
calls live publisher feeds — Reuters, TMZ, BBC, and 23 others — on page load with a 5-minute
cache). If it's empty or slow, that's expected sometimes; the fallback for step 2 covers it.

---

## 0. The problem, in plain language (30–45s)

*"Culture moves fast, and nobody's pricing it continuously. Polymarket and Kalshi settle facts
once. Nothing prices how a story is trending, in real time, on the way there."*

That's the whole cold open. No product name, no jargon, no card-game explanation yet.

## 1. A market from a live headline (60–90s)

**Happy path:** open the live headlines/feed panel. Point at a real, current headline pulled
from a real publisher feed — this is a genuine network fetch against 26 real RSS sources, not
a fixture. Read the headline aloud. Say: *"This just came in from [publisher]."*

**Do not click "Create Market" on the Market Factory screen** — its button currently has no
handler wired to it; clicking it will visibly do nothing and undercut the moment. Instead, say:
*"Turning this into a live market today is a manual step — I type the question in, here —"*
and show the simpler market-creation panel, which does write a real row to the database when
one is configured. Frame it honestly: *"The pipeline that would do this automatically — headline
in, market out — is built up to the classification step. Wiring the last step is exactly what
the bridge tranche funds."*

**Failure fallback:** if the live feed panel is empty or clearly stale when you open it (it
happens — nothing feeds it on a fixed schedule), don't fight it live. Switch to the satirical
news surface, which honestly labels its own content as `source: live` or `source: demo`
depending on what's available — point at the label, say *"today this is running on demo
content, which the API tells you outright — here's the live feed panel working on a day it's
populated,"* and move to a screenshot or a prior recording if you have one. Never present demo
content as live without the label visible on screen.

## 2. Classification decision + resolution condition (45–60s)

**Happy path:** show the classification output for the headline from step 1 (or, on the
fallback path, for a demo headline). Say: *"This isn't an LLM guessing — it's a deterministic
rules engine scoring language, contradiction signals, and sentiment, then assigning a market
type."* Point at the generated resolution-condition text — this is genuinely produced per
market type by real code, not boilerplate. Read it aloud: it's specific to the headline's
category (e.g., a truthfulness market gets *"resolves on independent corroboration of the
claim's truthfulness within the window"*).

**Failure fallback:** none needed — this step is genuinely live and reliable regardless of
which headline you're looking at, live or fallback.

## 3. Conviction score and the volatility input (45–60s)

**Happy path:** show the volatility gauge. Say plainly: *"This is a real GARCH(1,1) model —
today it's running on seeded demo data while we build the live data feed behind it; the gauge
itself will tell you so if you look closely."* Don't hide this — pointing at the label yourself
is more credible than an investor noticing it after you've moved on. Show the conviction-related
number on a market card and describe it as **derived from the same real classifier signals**
that produced the resolution condition, not an independent measurement.

**Failure fallback:** if asked "is this live," the honest answer is the one above — GARCH math
is real and tested, the *feed* it runs on is seeded today. Say that, don't improvise past it.

## 4. DL-LMSR price movement after a buy/sell (60s) — cut first if short on time

**Happy path:** open the swap/trade interface. Execute a buy, then a sell. Point at the price
moving. Say: *"This is a real DL-LMSR bonding curve — the same market-making math Polymarket
and Augur use, volume-scaled so liquidity deepens as a market proves itself active."* Be
straightforward if asked what's behind it: *"Right now this runs against a local simulated
balance while the on-chain path is built — the pricing math itself is the real thing you're
watching move."*

**Failure fallback:** this is entirely client-side and cannot fail due to network conditions —
if it doesn't visibly move, it's a UI issue worth fixing before the demo, not something to
route around live.

## 5. The settlement path — live vs. proposed (60–75s) — the credibility beat, don't cut this

**Happy path:** this is a slide/talking moment, not a click-through — there is no live UI
screen that shows settlement happening end-to-end, and presenting one would overclaim. Say
it plainly: *"Here's exactly what's built and what isn't. The settlement contract and the
dispute-resolution oracle are both written and independently tested — ninety-plus tests across
the two of them. What's not done is wiring them to each other, and deploying either one. That's
not a rounding error I'm hiding — it's the single largest thing the bridge tranche funds."*
If you have the security register open, this is the moment to reference it: *"I've had this
audited internally end to end — here's the actual gap list."*

**Failure fallback:** none — there's nothing live to fail here. The discipline is not
overclaiming, not a technical risk.

## 6. MAD Shield economics — recovery cap and funding source, stated precisely (45–60s)

**Happy path:** show the Shield opt-in flow. Say: *"Opt in, pay a premium — live today, 2 to 4%
of your stake on a sliding dial — and if the market goes against you, you get back 28.8% of
the loss at the standard tier, scaling to 40% shielded, 60% for our highest tier."* If asked
whether the premium is risk-priced: *"There's a more sophisticated volatility-priced version of
this formula built and tested — it's not the one live in the product yet. The live one is a
flat dial, which is simpler and shippable today."* On funding source, be exact: *"The premium
you pay funds the pool. A further top-up from protocol fees is the documented design — that
specific split isn't implemented in the fee-splitting code yet, so I won't quote you a
percentage for it today."*

**Failure fallback:** if pressed on solvency modeling, the fallback line is: *"Solvency
projections are modeled, not independently audited — I can walk you through the assumptions
rather than quote you a headline number."*

## 7. How creators, users, and the platform each participate (45s)

**Happy path:** walk the worked example, live if you have a whiteboard/slide, from memory
otherwise — it's simple enough to say out loud. On a $1,000-volume market: *"1.88% platform fee,
always. On a creator's own market, they take a traction-gated share — 28.8% at entry, up to 60%
once they've proven out 34 markets and 888 followers. On a $1,000 market at the top rung,
that's $11.28 to the creator, versus $0 if the platform made the market itself — same fee,
completely different split, and it's enforced in the contract's fee function, not a policy."*
Do not quote a specific dollar figure for the platform's own residual cut in this room — see
the diligence notes on the community-share allocation, which has an open reconciliation item.

**Failure fallback:** if asked for the exact protocol margin at every rung, the fallback line
is the one already in the pitch notes: *"That specific number is being reconciled this week
and I'm not going to quote you one I'd have to correct."*

## 8. The ask (30–45s)

Two tranches, stated in this order, stop talking after:

1. **$15–20K infrastructure** — 3 to 6 months of build velocity and infrastructure reliability.
   "This keeps the engine running."
2. **$300–500K bridge, milestone-gated** — closes exactly the gap shown in step 5: settlement
   wiring, an independent audit, and an accountable technical partner against explicit
   milestones, not a retainer.

Close: *"I'm not looking for passive capital. I want an operator or a studio who can
pressure-test the market design, and I'll give equity against milestones."*

---

## If the whole demo environment is down

Fall back to this package's own documents in this order: `01-TRUTH-SHEET.md` for the numbers,
`02-FEATURE-TRACEABILITY-MATRIX.md` for exactly what's live, and either deck (`09`/`10`) as a
static walkthrough. Never substitute a live claim for a down demo — "the environment's down,
here's what it does" plus the truth sheet is a stronger position than an improvised live claim
that turns out wrong.
