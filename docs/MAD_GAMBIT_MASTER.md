# MAD Gambit — Master Document

> **Single source of truth for the current Vercel + Neon + GitHub + Claude Code iteration.**
> Consolidated 2026-08-16 from ~150 scattered planning documents, which were deleted in the
> same commit. Git history retains every one of them if something here proves thin.
>
> **Outstanding work is PART 0, immediately below** — decisions, blockers and the build queue,
> ordered by who can act. Everything after it is reference.
>
> **This is the only planning document.** Maths (Part VI), the tokenomics engine room (Part VII)
> and the deck lineage (Appendix A) were folded in on 2026-08-16, and the hosting audit (Part VIII)
> on 2026-08-18 — there is no second file to check. Do not create one. A session handoff belongs
> *in here* too: 2026-08-18's went into PART 0 §7 and Workstream C, not into a dated file beside
> this one.
>
> **One sanctioned exception: `docs/THREAD_CLOSEOUT.md`.** A single, fixed-path, always-overwritten
> session handoff — never dated, never versioned, never kept in duplicate. It holds only what is
> *transient* (what broke this session, what to paste into the next chat); everything durable is
> folded in here first. Produced by the `close-thread` skill, with `CLAUDE.md` as the fail-safe
> if that skill does not fire. Unactioned items are **carried forward** into the new close-out,
> never preserved by keeping the old file.
>
> Outside its scope by design, and untouched: each subproject's own docs (`verify/docs/`,
> `contracts/madhat-core/`, `master-maths/`), live tooling config (`.claude/`, `.agents/`), and
> the decks themselves (`verify/public/pitch/*.html`).

---

## PART 0 — START HERE: OUTSTANDING WORK

*Everything currently open, ordered by who can act. The rest of this document is the reference
this part points back to. When an item here is done, delete it from here — don't let this grow
into a second changelog.*

## 1 · Where things stand

Merged and live on `main`:

| Area | State |
|---|---|
| **Docs** | ~150 planning docs consolidated into `MAD_GAMBIT_MASTER.md`. 114 files / ~36.5k lines removed, inbound links repaired. |
| **Maths** | Part VI (canonical algorithms, code-bound) + Part VII (the tokenomics engine room). Both live in this file. Do not create a separate maths doc. |
| **Octavian** | One creature across all mounts (`octavian-creature.tsx` + `lib/octavian-state.ts`): shared mood/orbit/zoom/selection, firefly star swarm, live platform-activity feed, reduced-motion. |
| **Agent brand** | ⏳ *on `MAD-Gambit-Concierge`, not yet merged.* One canonical name — **MAD-Gambit-Concierge** — for the single LLM character behind every user-facing surface. "The MADHAT'r" is its voice, not a second agent; Sentinel and Strategist are **modes**; Z-Liar and Decay are **product mechanics, not characters**; Tri-Agent is superseded and was never implemented. Full map in `.agents/skills/mad-gambit-concierge/SKILL.md` — do not restate it here. Code consolidated: `components/mad-gambit-concierge.tsx` + `MadGambitConcierge` export. Kept, because they name the *character* not the role: `lib/madhatr-persona.ts`, `brand/madhatr-logo.png`, `from: "madhatr"`. **URL paths unchanged** — restructuring the API surface is a product decision, not a brand one, and `npm ci` is 403 here so no build can verify it. |
| **CI** | Collapsed to fewer jobs by #108, which also path-filtered the guard and moved `actions/checkout` to **v4** (this row said v6). **Recovered 2026-08-24 after an eight-day outage — see immediately below for what merged unchecked in the meantime.** |
| **Repo** | Verified complete: working tree fully committed; `.gitignore` excludes only secrets, Vercel link artifacts and build products. |
| **Repo roles** | **Founder decision, 2026-11-03.** `The-MDC/MAD-MPP-2.23` is the working repo: all code changes land on its `main`, and it feeds Vercel preview and production and Supabase. `The-MDC/MADGambit-Official-MMP` (private) stores the Supabase and Vercel material and the official, untainted production build. It receives only what production already runs. |
| **Private-beta front door** | ⏳ *on PR #169 (`claude/demo-into-main`), not yet merged.* Anonymous visitors land on `/beta` (request access → `beta_signups`, `sql/0017`; "~ Creator Sign-in ~" → HMAC-signed HttpOnly `mg_beta` cookie, `lib/beta-gate.ts`). The MADHAT'r answers from **`verify/content/madhatr/knowledge.md` — edit that file, not code** (greeting echo, every 5th greeting a brush-off, a 16-rung pay-grade ladder for unknowns; `lib/madhatr-knowledge.ts`). Open-market floor: search/sort, cash-out (`sellQuote`), creator earnings, harm-policy validator. Bot/scanner guard and capture deterrents (PART II §6, layer 9). The same PR fixes `main`'s 155 type errors (stale `gambit-game-math.ts`). CI green: tsc 0, 450/450 tests, route guards, build. |

### The CI outage, 2026-08-16 → 2026-08-24 — resolved, but it left debris

**This supersedes the "verified green at merge" line that stood here.** For eight days every
workflow on every branch failed, then stopped completing at all:

| Workflow | Last success before | First failure |
|---|---|---|
| `ci.yml` | run 260 — 2026-08-16 **07:42** | run 261 — 2026-08-16 **08:07, on `main`** |
| `placeholder-guard.yml` | run 311 — 2026-08-16 **07:42** | run 312 — 2026-08-16 **08:07, on `main`** |

It reproduced on `main` across four branches, so it was never any one PR's change — and the
guard's own script passed when run by hand throughout. **The jobs never reached a runner:**
~3-second duration, `runner_id: 0`, `runner_name: ""`, logs 404, empty check output. From
2026-08-19 they stopped even reaching `failure` and simply sat in `queued`.

**Resolved 2026-08-24 ~16:18 UTC** — secret scan ran a genuine 21-second job and passed. The root
cause was never visible from inside an agent container (billing is not readable), so if it recurs,
*Settings → Billing → Actions* is still the first place to look.

**Two pieces of debris survive it, both live:**

1. **Three PRs merged completely ungated** — #105, #108, #131. #108 restructured CI itself and
   downgraded `actions/checkout` **v6 → v4**; #131 **re-enabled production deploys from `main`**,
   contradicting Part II.3. Neither was checked by anything. Re-run the gates on `main`.
   *The v4 downgrade has an observable cost:* the 2026-08-24 guard run warns
   *"actions/checkout@v4 targets Node.js 20… being forced to run on Node.js 24."* v6 did not.
   The change moved the repo onto a deprecation path, ungated — worth confirming it was intended.
2. **Orphaned `queued` runs** that will never complete: `ci.yml` #264/#265/#267/#268,
   `placeholder-guard.yml` #316/#318/#320/#321. **Stale artifacts, not live failures** — judge CI
   health only by runs created after 2026-08-24 16:18 UTC.

**And green ≠ done, now that it is back.** Lint, Slither and Dependency Review are **report-only** (Slither has ~135
untriaged findings — green means "ran"). Nothing blocks merge until branch protection requires
these checks on `main`. And the Octavian creature **merged without any human ever looking at it**.

---

## 2 · Do these first

### 2.1 — Visual pass on the Octavian creature 🟡 *rendered and reviewed 2026-08-26; human eyes still wanted*
It compiles, lints, type-checks, builds and passes tests. None of that catches a canvas that
renders wrong. Look at `/octavian`, the `/preview` inline mesh, and the desktop corner HUD.

**It has now been rendered.** The draw pipeline was reproduced in a headless-Chromium harness
importing the real `instrument-chrome` / `octavian-state` / `node-registry` (see §7 for the
recipe), which found and fixed a defect no source read had caught: node badges were drawn at
`7.5 * scale` — 20.5px on the 300px panel, **47.8px** in the 700px pop-out — with a depth
threshold of `p.k > 0.36` that sat barely above the *floor* of k's actual range `[0.339, 0.541]`,
so nearly every node was labelled at once. The creature was behind a wall of its own labels.
Font clamped to 6–10px, threshold raised to 0.47 (~the nearest quarter), selected node always
labelled. Measured envelope, worst painted pixel as a fraction of the half-box:

| case | envelope | |
|---|---|---|
| phone panel 300×300, calm | 73.3% | fits (82.2% before the label fix) |
| phone panel 300×300, agitated | 65.9% | fits |
| corner HUD 140×140 | 73.3% | fits |
| pop-out 700×700 | 73.3% | fits |
| zoom ×4 (max pinch-in) | 293.3% | clipped — expected, that *is* zooming in |

Identical figures at 140/300/700px confirm the `ORB_FIT` derivation is size-invariant as claimed.
**What a render still cannot answer:** whether the body reads well in motion, and whether the
mood-tier colour crossfade lands. That part still needs a person.

**A container-sizing bug was found and fixed since this item was written** (`0.42` → derived
`~0.262` of `min(w,h)`). `project()` places the sphere silhouette at exactly `R`, but nothing
budgeted for the outward bleed past it — spike `reach` alone reaches `~0.81R` beyond a node — so
the worst-case envelope was `~1.9R` against a half-box of `0.5`, i.e. **~152% of the container**,
and the spike arms were clipped at the canvas edge. Because bloom and reach scale with `r`, `r`
with `scale`, and `scale` with `R`, that ratio was **size-invariant**: it clipped identically in
the 280px corner HUD and on the full canvas, which is why it never presented as a small-screen
problem. `R` is now derived from `MAX_NODE_BLEED` so re-tuning the spike constants cannot silently
reintroduce it.

**What that fix does NOT settle:** whether the resulting body — visibly smaller — reads well, and
whether the three tuning constants are now right *as a set*. Still one-liners in
`components/octavian-creature.tsx`:
- `bloomR` — bloom scale.
- `reach` — diffraction-spike length. Watch for "noise" rather than "star".
- `swarm` (in the draw loop) — firefly drift amplitude. Should read alive, not jittery.
- `MAX_NODE_BLEED` — the envelope budget. Raise it and the body shrinks; lower it and spikes clip.

`prefers-reduced-motion` was traced through every motion pathway in the draw loop and **does** pin
the swarm — confirmed, not assumed. The one pathway left deliberately unpinned is the ambient
halo's opacity breathe (`haloPulse`): low-amplitude and non-spatial.

---

## 3 · Decisions only you can make

| Item | The tension |
|---|---|
| **`@neondatabase/serverless`** | You asked to install it + add a `neon()` helper. **ADR-008 (2026-08-05) explicitly evaluated and rejected exactly that**, mandates `pg` Pool + Route Handlers, and is marked *"Settled. Do not reopen without a new ADR superseding this one."* Options: (a) drop it, ADR stands — **my recommendation**; (b) write a superseding ADR; (c) use the ADR's own escape hatch — one edge-latency-sensitive route, its own ADR, never the default. |
| **Near-miss on real-money surfaces** | `dopamine-engine.tsx` renders some losses as almost-wins (`isNear = !won && roll < 0.58`, `components/dopamine-engine.tsx:34`). Verified 2026-08-27: it is on free-play `madCredits` behind a `Math.random()` PLACEHOLDER, so today it is the benign case. On real `$MADx` stakes it is the single most regulated pattern in this space. Recommendation: confine to credits/demo, make the boundary explicit in code. **Now has a second surface:** any branching market generates near-misses structurally at every roll — that is why the Paseome settlement rule REFUNDS untaken branches rather than writing them off (§3 decided rows below). Unchanged pending your call. |
| **Promote `main` to production** | `vercel.json` sets `git.deploymentEnabled.main = false`; production deploys are manual. |
| **`$MADx` supply** | Canon says 888,888,888 fixed. The deployed Arbitrum One contract is mutable/mint-on-purchase, cap 224,573,096, Pausable. Two candidate addresses in the archive (`0xb61ae772…fd18`, `0x6972370e…151f`). **Address resolved 2026-10-26: the founder confirmed `0x6972370e1caAA3624F37D7e87C28e1089D00151f` as the real `$MADx`; `0xb61ae772…fd18` is ORKx.** **Supply answered 2026-11-09, founder:** *"MADx total supply is 888,888,888 but only 270 280million in the token sale will be purchaseable."* So the **total supply is 888,888,888** (canon stands), and **270 million** (30.4% of the total) is the part **purchasable in the token sale** — the message read "270 280million", and the founder confirmed **270 million** the same day. **New conflict:** that figure is above the 224,573,096 cap the deployed contract carries and that `MADX_BETA.cap` enforces atomically in the beta ledger (`lib/madx-web2.ts:141-146`), so that cap — owner-modifiable per this document, not verified on-chain here — has to be raised, or another contract used, before the sale can sell its stated allocation. Which bucket of the distribution split the sale is stays open (the *Token distribution split* row). |
| **`0xb61ae772…fd18` is NOT `$MADx`** (on-chain, 2026-10-23) | Checked against Arbitrum One (42161) via Blockscout. That address is a **different ERC-20 entirely**: name **"Serpentine Orkain"**, symbol **ORKx**, 18 decimals, total supply **60.073728** tokens, **2 holders**, unverified source, creator `0x49755F66C877040f8EF7F307263F74C352830149`. It is not MADDEX, not MADx, and carries no 224,573,096 cap. It had been written into **three places as canonical** (corrected 2026-10-26): `contracts/madhat-core/DEPLOYED_ADDRESSES.md:7`, `verify/app/api/v1/cards/route.ts:36` and `verify/docs/CARD_CANONICAL_REFERENCE.md:20`. **Founder confirmed `0x6972370e1caAA3624F37D7e87C28e1089D00151f` as the real `$MADx` on 2026-10-26, and those three files plus the data-room page now carry it.** A Blockscout read of it the same day shows a **verified contract on Arbitrum One** (creator `0x4975…0149`), contract name `MyToken`, with no token record indexed — so MADx/MADDEX as symbol/name rests on the founder's confirmation, not on what Blockscout displayed. |
| **Chain topology** | Work targets Arbitrum One only, but canon restates Nova + One + HyperLiquid as founder-locked and `contracts/foundry.toml` still configures `arbitrum_nova`. |
| **Token distribution split** | April canon (35/20/15/10/10/10) vs March "vFinal" (45/15/15/15/10). *2026-11-09: the founder says 270 million of the 888,888,888 (30.4%) will be purchasable in the token sale. That matches no single bucket in either split, so which bucket the sale is, and which split holds, is still open.* |
| **O-V deck — 2 canon conflicts** | `MADdegen/OV-Deck-2026` says **"Wyoming L.C."** (slides 0, 7) against a **New Mexico** formation record filed 2026-03-25 — a legal-entity fact on an investor slide. And slide 3 reintroduces **"MAD Upshot"**, which canon bans; the deck is *newer* than the ban. *(A third conflict — the Creator Ladder — turned out to be the master doc's error, not the deck's; already corrected.)* |
| **React18 / Hono / HonoX** | Never clarified. `verify/` is already Next.js 16 + React **19.2.1** + Tailwind v4, live. Hono/HonoX appears once in the whole archive as a speculative Phase-4 API-gateway idea — not a frontend, not tied to React 18. |
| **Containerizing the platform** | Deferred by the 2026-08-18 decision to stay on Vercel — but **correct the reasoning, because the old one was wrong.** It was declined as "an architectural reversal for a Vercel-native Next.js app"; the coupling audit (Part VIII §1) shows the app is **not** Vercel-native. `next.config.ts` already builds `output: "standalone"` and its own comment names Cloud Run; total Vercel surface is one 44-line Blob adapter behind a pre-existing interface, one analytics import, three cron entries, and **zero** `process.env.VERCEL*` references. So containerizing is a config change, not a reversal — it is deferred for want of a reason to do it, **not** because it is hard. |
| ~~**Creator profit share — 28.8 / 40 / 60**~~ | **DECIDED 2026-10-23, founder:** *"There is a flat rake of 1.88% platform fee, creators take a sliding 28.8 to 40% and then a limited 4888 seats offering the rare and exclusive 60% VIP profit share exist."* So the **28.8% `User` rung is correct** — the creator floor, not a conflation; creators slide **28.8% → 40%**; and **60% is a VIP profit share capped at 4,888 seats**, not a creator rung. The 27 Aug "40–60%" statement is superseded. *Corrected 2026-10-23:* this row first said the creator ladder deliberately paralleled a "Shield 28.8 / 40 / 60 ladder" — the Shield stops at 40% (row below), so 60% exists only as the VIP seat. **Code diverges** — `CREATOR_LADDER` grants 60% as `CR8TR` by traction (34 markets + 888 followers) with no seat cap. One question before code moves: **how is a VIP seat obtained**, and does CR8TR traction still qualify for one? See §5. *Partly answered 2026-10-23 and 2026-11-09 — the Golden Ticket row below: a seat is bought as a Golden Ticket NFT.* |
| ~~**Golden Ticket & the VIP seat path**~~ | **DECIDED 2026-10-23, founder; recorded 2026-10-26 on the founder's word ("record them in the master"):** *"from the golden ticket event, if you have three markets that achieve 188K in volume"* — **each** market, not combined (*"three combined markets? where are you getting that from?"*); *"we're going to up the supply to 4888, the minimum desired conversion is 2888"*; and *"there is a sliding scale of 28 to 40%, that full sliding scale is still being worked out."* So: **Golden Ticket supply 2,488 → 4,888**, the same number as the VIP seat pool; **minimum desired conversion 2,888** (59.1% of supply); a holder converts to a **VIP seat (60%)** with **three creator markets that each reach 188K volume**; and the creator scale **between** 28.8% and 40% is **not yet set** — the engine's User 28.8% and MinorCreator 40% are its two end points, not the scale. **Answered 2026-11-09, founder:** *"VIP seat is obtained by purchase of a golden ticket (NFT), this campaign is for open beta launch."* So a seat is **bought** — as a Golden Ticket NFT — and selling the tickets is the **open-beta-launch campaign**. That settles *bought, earned or granted*, and fits `verify/content/madhatr/knowledge.md:549`, which already lists "Open Beta Golden Ticket event" as the stage after Closed Beta. **Still open:** is a purchased ticket **the seat itself**, or must its holder still convert it with the three-markets-each-≥188K test above (the 2,888 minimum conversion implies a step after purchase) · the price and sale mechanism · whether any route besides buying a ticket survives, and so whether `CR8TR` traction stops reaching 60% (lowers payouts) · which volume counts (notional, both sides — how Polymarket and Kalshi report — or cash at risk) · is the floor 28.8% or a flat 28% (the founder wrote "28 to 40%"; canon keeps 28.8% until told otherwise) · which platform "Lit" is. Sizing and benchmarks: PART VI §13 item 9. **Not in code yet** (§5). |
| ~~**MAD Shield — the scale**~~ | **DECIDED 2026-10-23, founder:** *"MAD Shield Stop Loss (28.8 to 40%), as well as, the Creator profit share (28.8 - 40%, vip 60%)"* and *"The MAD Shield also offers a scale."* The Shield is a **scale from 28.8% to 40%**: the 2–4% premium moves recovery continuously from 28.8% up to 40% (`calculateShieldPayoutFull`), and the staking tier caps how far up a holder can go — Bronze 28.8 · Silver 32.8 · Gold 36.8 · MAD Tier 40% (`STAKING_TIERS[].shieldRecoveryPct`). **40% is the ceiling; 60% is creator-side only.** Consistent with Part II.7 ("Never use again: Shield 40% / 60%") and the 7 Sep 2026 ruling recorded in the Build Ledger artifact. ⚠️ **Code diverges:** `SHIELD_RECOVERY_WHALE_PCT = 0.60` and `WHALE_SHIELD_ELIGIBILITY` still pay 60% to whale-eligible holders — removal is in §5 and needs your confirmation first, because it moves payouts. |
| ~~**Paseome — untaken branches**~~ | **DECIDED 2026-08-27: refund, do not write off.** Foresight refunds every untaken sibling at the leg roll; Hindsight writes off nothing because nothing there is ever unrealised. Two reasons and both hold: conditional markets fail when nobody will fund a bet that pays only if a *separate* event also occurs, and a refunded branch cannot be a near-miss. Encoded in `verify/lib/paseome.ts#settleFrontier`, tested in `paseome.test.ts`. |
| ~~**Paseome — frontier width**~~ | **DECIDED 2026-08-27: 3 to 5 branches.** Three keeps prices legible and liquidity deep; five matches the Five Faces simplex and the existing dial geometry; past five the top branch stops meaning anything. `FRONTIER_MIN`/`FRONTIER_MAX` in `verify/lib/paseome.ts`, enforced by a throw, not a comment. |
| ~~**Paseome — who authors a branch**~~ | **DECIDED 2026-08-27: gated, VIP *or* creator-ladder.** Eligible at `VIP_STATUS_MIN_MADX` (capital axis) **or** MinorCreator and above (creator axis). Deliberately a disjunction over two axes this engine keeps separate — Part II §7 and `gambit-game-math.ts` both state VIP is "never a creator tier", so they are evaluated and reported independently rather than merged into one score. `canAuthorBranch` in `verify/lib/paseome.ts`. **Extended 2026-10-23, founder:** *"this will be an open Conviction market for open markets, but this will also be offered to a lesser extent by the platform for different uses."* So creators author on the open market (gate unchanged) and earn their rung on the trees they open; platform-offered trees run `splitFee(volume, 0)` — no creator cut. Read as the product line Paseome sits in; settlement is unchanged (forward side still oracle-settled with refunds). |
| ~~**Paseome — official name**~~ | **DECIDED 2026-10-23: "The Paseome: Certain-UnCertainty"** — the capital U is deliberate (founder confirmed). *Foresight* / *Hindsight* are **not** product names; the sides are the forward side (family 7) and the counterfactual side (family 8), and `foresight`/`hindsight` survive only as internal labels (`PaseomeSide` in `verify/lib/paseome.ts`). Applied to `docs/product-sheets/PASEOME.md` v1.2 and the published artifact v1.2 (repo copy `docs/product-sheets/PASEOME_ARTIFACT.html`). |
| **An old guest pair restored on purpose** (founder, 2026-10-27) | At the founder's request one of the original committed guest pairs was added back to `GUEST_LOGINS` (production + preview) beside the current login. `proxy.ts` treats every committed pair as **burned**: they are in this public repo's history, so anyone who reads it can sign in. Rotate its password, or remove it, once it has served its purpose. Live on previews; production picks it up only on its next redeploy (the agent's redeploy was refused by the permission classifier). |
| **Repo hardening — the settings only an admin can change** (added 2026-10-27) | Agents are refused repository-settings writes (proxy 403), so these four are yours: (1) **merge #170**, which removes the four plain-text guest pairs from the default branch's live `proxy.ts`; (2) **Settings → Branches → default `main`**, then retire `The-MDC`; (3) **Settings → Advanced Security → enable "non-provider patterns" and "validity checks"** (secret scanning and push protection are already on; generic passwords like the old guest pairs are only caught with non-provider patterns); (4) **visibility private**, the only thing that stops outside code scanning, which needs Vercel Pro first (Hobby refuses private org repos). **History cannot be cleaned from here.** A real purge is `git filter-repo` over every ref, a force-push of all branches (breaking every open PR and clone), and a GitHub Support request to drop cached views; forks and anything already scraped keep the old values regardless. Rotating is what actually closes it. |
| **One guest login per investor** (added 2026-10-27) | The capture guard watermarks every page with the signed-in guest's name, so a leaked screenshot names its source — **but only if each viewer has their own login.** Today every VC shares one pair, so a leak traces to "everyone". `GUEST_LOGINS` already takes many pairs (`a16z:…,paradigm:…`). Recommendation: one pair per firm, plus a founder login listed in `CAPTURE_ALLOWED_USERS` so you can still screenshot the app for the deck. |
| **Delete 31 merged branches** (added 2026-10-27) | Of 76 branches, **31 have zero commits that are not on `main`** (`compare/main...<branch>` → `ahead_by: 0`), so deleting them loses nothing: `MAD-Gambit-Concierge`, `mad-mpp-2.24`, `production-optimizations-and-env`, `claude/{boardy-investor-presentation-jxuj26, custom-perpetual-concepts-g1aa4s, headlines-engine-one-liners, mad-perps-product-sheets-and-economics, main-node24-cron-removal, master-maths-chain-ruling, maths-engine-room-ship-ai67e6, sharp-cori-zyz0g9}`, `docs/{neon-key-rotation-runbook, neon-vercel-skill, perspective-shift-skill}`, `feat/{auth-identity-schema, satire-engine-upgrade, six-category-rail, supergrok-skills-guardrails}`, `fix/{neon-branch-cleanup, speed-insights-optimization}`, `vercel/install-vercel-speed-insights-mb0ra7`, and `vercel-agent/{add-db-health-endpoint, fix-deployment-health-checks, hub-screenshot-polish, neon-customer-schema, neon-nextjs-wiring, optimize-device-frame, production-audit-fixes, public-db-health-check, secure-madx-routes, update-next-proxy}`. A further **39 out-of-date branches** (§7) should go too, each tip kept first as an `archive/<name>` tag so it stays recoverable. Agents cannot do either: branch deletes are refused by the session's permission classifier and tag/ref writes by the GitHub proxy (403), so the founder runs the script handed over on 2026-10-27 (`gh api -X DELETE repos/The-MDC/MAD-MPP-2.23/git/refs/heads/<branch>` per branch). Keep `main`, `The-MDC`, `claude/demo-into-main`, `claude/demo-open-markets`, `claude/mad-gambit-enhancement-timeline-zdnx47` (#155) and the dependabot vite branch (#160 — `main` is still on vite 8.2.1). |
| **The repo's default branch is `The-MDC`, not `main`** (found 2026-10-27) | Every PR here targets `main`, but GitHub's default is `The-MDC` (7 commits ahead, 132 behind `main`). That is where new PRs point by default, what the CodeQL default setup scans, and what visitors see first. Recommendation: Settings → Branches → switch default to `main`, then retire `The-MDC`. |
| **One ask — five versions are in circulation** (added 2026-10-27) | Same week, five different numbers: canon **$1M–$2M @ $12M pre** (min viable $688K); the 3-minute script **$1.48M–$2.48M seed**; the spoken spine **$250K–$500K bridge**; Q&A #8 **$400K**; the bridge allocation **$668K** in its heading and tranches (T1 $368K + T2 $300K) but **$680K** in its line items (210 + 120 + 110 + 70 + 65 + 60 + 45); and the in-app whitepaper sheet (`components/whitepaper-sheet.tsx`) a third structure, infrastructure $15–20K + bridge $300–500K + seed $1.24M–$2.48M. An investor who hears two of these in one call will ask which is real. Recommendation: one bridge number with milestone tranches, and the seed range quoted only as "the next round". Founder's call; no copy was changed. Also reconcile the $12K gap: trim contingency to $53K or raise T2 to $312K. |
| **Pitch claims the code does not back yet** (added 2026-10-27) | (1) Q&A #2, *"the coefficients and the classifier are server-side"*: **the repo is public** (`visibility: public`) and `lmsr-book.ts` deliberately runs the same pricing in the browser, so every coefficient is readable today. Making the repo private needs Vercel Pro (Hobby refuses private org repos — §4). (2) The spoken spine, *"funded by rates that track how the crowd's conviction moves"*: `lib/perp-reports.ts` says **"No funding rate"** on purpose. (3) *"email, one click, no wallet"*: sign-in is SIWE wallet or a guest pass; ERC-4337 is still open (§5). (4) *"paid on chain"* at 28–40%: the contract pays a flat 40% (§5). (5) The MADConv slide formula shows five terms the engine does not multiply (PART VI §2). Either change the line or build the thing before the next call. |
| **Define π and the satire term in MADConv** (added 2026-10-27) | The full formula has been on slides since August; π is defined nowhere and `satire` has no multiplier, so it cannot be wired. Two definitions, then it is a half-day of code plus tests. |
| **`config-drift-checker` — which of three things did you mean?** (carried from the 2026-10-23 engine-room close-out; added 2026-11-09) | You asked to implement `https://github.com/jameskomo/config-drift-checker`; it was never actioned. `MADHATs-Claude-Enhancement` already ships `scripts/check-config-drift.py` (exit 0 clean / 1 drift / 2 unreadable) **and** `scripts/test_config_drift.py`, wired into `hermes-verify.ps1` ‹verify› — that repo is not checked out here, so this is the close-out's reading of it. So the real question is: adopt the upstream tool there, port the existing checker into `MAD-MPP-2.23` to watch `vercel.json` / workflow / env drift, or something else? One sentence from you avoids building the wrong one. |
| **Held: batch POST to the satire engine** (founder's hold, billing; carried from the same close-out, added 2026-11-09) | Your hold, not a blocker. Listed so it is not mistaken for forgotten work. |
| ~~**Database: Neon → Supabase**~~ | **DECIDED 2026-11-02, founder:** *"ensure the backend on supabase and the github and vercel are setup, optimized and synced, ensure all three stay within current free tier limits."* The database moves to Supabase (Free); Vercel and GitHub stay. Supersedes the database half of the 2026-08-18 row below; the app keeps `pg` Pool + Route Handlers (ADR-008 is about the access pattern, not the host). Steps and limits: §4, "Free-tier platform setup". |
| ~~**Leaving Vercel**~~ | **DECIDED 2026-08-18: stay on Vercel + Neon.** Founder's call, and the audit supports it. Part VIII is retained as a **contingency plan, not a pending recommendation** — see the note at its head for what would reopen it. |

---

## 4 · Blocked on access no agent has

| Item | Blocker |
|---|---|
| **Neon three-database merge** | `mad-mpp-2-23-postgres` (target), `Neon-DB-MADMPP`, `neon-sky-park`. Ordered procedure + read-only inspection SQL in **Part II.5 below**. Agents cannot reach `*.neon.tech` (403) or TCP 5432. Until this completes there is **no single source database**, so "sync the DBs" has no well-defined target. Correct sequence: merge → `npm run schema:verify` → commit any drift as `verify/sql/0016_*.sql` (**0015 is taken** — see Part II.5). Schema-as-code is already complete: 15 migrations + `schema-verify.mjs` checking the ledger, pgvector and 39 named tables. |
| **Generate the two `.lock.yml` files** | `gh aw compile`, then commit `agentic-security-review.lock.yml` + `agentic-quality-review.lock.yml`. Until then **both AI review gates are configured but never run**. The Actions `GITHUB_TOKEN` is *correctly* forbidden from writing `.github/workflows/` — needs a human push or a session with real push credentials. |
| **eslint / eslint-config-next / @types/node realignment** | `eslint-config-next` is pinned at **15.4.5** while `next` resolves to **16.2.9** (and it's the only dep without a caret); `eslint` is **8.x, EOL** — config 16.x wants ESLint 9 + flat config, so those two move together; `@types/node` is **20.x** against `engines.node: 22.x`. Needs a lockfile regen — the sandbox 403s the npm registry, and hand-editing `package-lock.json` breaks `npm ci` on every job. Because Lint is report-only, the stale config is silently under-checking a Next 16 codebase rather than failing. |
| ~~**GitHub Actions refusing to run jobs**~~ | ✅ **RESOLVED 2026-08-24.** Secret scan ran a real 21-second job and passed on PR #137 — a runner was assigned, versus the 2–3 second refusals of the outage. Outage window was **2026-08-16 08:07 → 2026-08-24 ~16:18**. Two consequences remain, below. |
| **Audit what merged during the Actions outage** | 🟠 **#105, #108 and #131 all merged with no CI.** Nothing gated them — not type-check, build, unit tests, secret scan or the guard. #108 restructured CI itself and downgraded `actions/checkout` v6→v4; #131 re-enabled production deploys from `main`. Re-run the gates against `main` and read those two diffs properly. |
| **Orphaned `queued` runs** | 🟡 Runs from the outage window sit permanently `queued` and will never complete — `ci.yml` #264/#265/#267/#268, `placeholder-guard.yml` #316/#318/#320/#321. **They are stale artifacts, not live failures.** Do not diagnose from them; judge CI health only by runs created after 2026-08-24 16:18 UTC. |
| **Vercel deploys are failing for the whole repo — plan/account, not code** (found 2026-10-23) | Every deploy from this private org repo now fails two commit statuses: `Vercel – mad-mpp-2-23` → *"Cannot deploy from a private GitHub organization repository on the Hobby plan"*, and a second status reading **`Account is blocked.`** Reproduced on two separate commits of a **docs-only** branch, so nothing in a diff can clear it. **What changed:** the last successful deploy (`18216a0`, #143, 2026-08-27) ran under Vercel team **`madgambit`** (`teamId: team_TgoOJAiilwZ3I3LPyD2FcNZm`, preview host `…-madgambit.vercel.app`); the failures are under team **`MAD-MPP`** (`mad-mpp`), and `list_teams` on the authenticated account now returns `mad-mpp` / `team_ThJlmLcaIliE23YywpmA7uQf` as the **only** visible team. The project looks reconnected to a different Vercel team that is on Hobby and flagged blocked. Consequence: `vercel.json`'s manual-production-deploy arrangement has nothing to deploy with. **Action, in order:** clear the `Account is blocked.` state (the two may share one cause), then either upgrade `mad-mpp` to Pro or point the GitHub integration back at the team that was deploying in August. **Update 2026-10-27:** the block cleared. Production is `dpl_BsWXEZEgdTdbDpg9dNBcpW9LW5dG` (commit `e193506`), promoted via the REST API and served at `mad-mpp-2-23-two.vercel.app`. Hobby still forces **daily-only crons** (the 30-min `ingest/gdelt` schedule was dropped to deploy) and forbids commercial use — Pro remains the fix. The beta gate, logos, MADHAT'r knowledge and the anti-scrape layer (PR #169) are **not** in production yet. **Update 2026-11-03:** only the deploy path cleared. A `Vercel` status reading `Account is blocked.` still posts on every commit, and it does not come from `mad-mpp-2-23` (that project has no Git link). See the free-tier row below for its source and the fix. |
| **`madgambit.fun` DNS** (added 2026-10-27) | Nameservers are Unstoppable Domains (`ns1/ns2.unstoppabledomains.com`); the domain is unverified in Vercel. At UD: TXT `_vercel` = `vc-domain-verify=madgambit.fun,e26d3084d6b5ce9a770e` and `vc-domain-verify=www.madgambit.fun,552a8c7e035deef03fc1`; A `@` → `216.198.79.1` and `64.29.17.1`; CNAME `www` → `71d7e4a407ecce18.vercel-dns-017.com`; turn UD forwarding/parking **off**. |
| ~~**The Crystex fair-launch total supply**~~ | You pointed at the Crystex campaign as the source of the real total supply (`app.crystex.app/campaign-details/e8ad5674-e209-4894-970a-c2ada023e4be`, linked from `DEPLOYED_ADDRESSES.md:10`). **`app.crystex.app` is egress-blocked from the agent container** — the proxy refuses it outright, so no agent can read that page. **ANSWERED in chat 2026-11-09:** total supply 888,888,888, with 270 million purchasable in the sale (§3, `$MADx supply` row) — so the page is no longer needed for the total. It would still cross-check the campaign's own numbers. |
| **Run migration `0016`** | `verify/sql/0016_market_book.sql` shipped in #139 and merged, but **has never been applied.** Until `npm run migrate:deploy` runs from a DB-connected session, the market book, the price tape and the paid pack-mint all silently fall back to their demo paths. `npm run schema:verify` should report **41/41** afterwards. Agents cannot do this — `*.neon.tech` and TCP 5432 are blocked. |
| **Set `REGISTRAR_TOKEN` in Vercel** | Complaint resolution (`POST /api/v1/registrar/complaint?resolve=1`) was moved off session auth onto a shared registrar credential (#143, merged). It **fails closed**: with the env var unset the route returns 503, by design. Until you set it, complaint resolution is unavailable in production. |
| **Switch on the admin suite, support, beta and logs** (added 2026-11-02) | Code shipped in the `claude/admin-suite` PR; it is **off until configured**. (1) Set in Vercel production: `ADMIN_MASTER_EMAIL`, `ADMIN_MASTER_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`, `AGENT_SIGNING_SECRET`, `SIGNUP_SHIELD_SECRET`, `MEMORY_PEPPER` — the values, and the master password, are in the founder's Desktop file *"MAD Gambit admin login.txt"* (never in the repo or chat; only the password's scrypt hash goes to Vercel). (2) Run `verify/sql/0018`–`0025` (admin users, insights, agent control, agentic, support/beta, concierge memory, information-market logs, chat files / verified email / account flags). (3) Optional: `BETA_PHASE` (closed · open · ga, default closed), `BETA_CAPACITY`, `RESEND_API_KEY` + `REPORT_FROM` for the Monday report email to nick@madgambit.fun, `AGENT_MODE` (normal · defended · off — the hard kill switch), `PRIVATE_BLOB_READ_WRITE_TOKEN` for the **private** Blob store (now connected) (concierge uploads over 4 MB, up to 25 MB; smaller files work without it), `MALWARE_SCAN_URL` (+ `MALWARE_SCAN_TOKEN`) for an optional antivirus hop that fails closed. Profile email verification also needs `RESEND_API_KEY` + `REPORT_FROM`; without them nobody can verify an email, so nobody reaches the 90% that unlocks uploads. Staff accounts are **madgambit.fun / madgambit.io only**, enforced at creation, sign-in and every request. All new crons are daily or weekly, inside Hobby's limits; the once-a-minute ticker poll runs from the open tickers themselves, not a cron. |
| **Free-tier platform setup — Vercel, GitHub, Supabase** (added 2026-11-02) | **Vercel (Hobby, team `MAD-MPP`).** Hobby cannot connect a project to a repo owned by a GitHub **organization** (docs, "Limits"), so `mad-mpp-2-23` has **no Git link**: it deploys only through the CLI or the workflow below. **The red `Vercel` check on every PR (`Account is blocked.`) is not this project** (corrected 2026-11-03; this row first said it was). It is posted by a project in another Vercel account that is still Git-connected to the repo, and that account is blocked. The repo's deployment records (checked 2026-11-03) place every stale project in team **`madgambit`**, the team that ran this repo's deploys in August (row above): a second `mad-mpp-2-23`, `mad-mpp-2-23-kyxg`, `mad-mpp-2.23` (host `mad-mpp-223`) and `madgambit-frontend`. They last deployed between 2026-07-02 and 2026-08-28, and MAD-MPP's `mad-mpp-2-23` supersedes them all. (`mad-mpp-2-23-j3pu`, last seen 2026-09-05, was in MAD-MPP and is already gone.) No agent can reach team `madgambit`: the CLI and the Vercel connector both see only MAD-MPP. **To clear it, the founder** signs in with the Vercel login that belongs to team `madgambit` and deletes those four projects, or disconnects Git on each (Settings → Git → Disconnect). Failing that, remove this repo from the Vercel GitHub App's repository list, which also drops Vercel Agent Review here. Their seven auto-created GitHub environments (`Preview`, `Production`, and the `kyxg`, `j3pu`, `mad-mpp-2.23` and `madgambit-frontend` ones) hold 0 secrets, variables or protection rules, and no workflow uses them. Delete them under repo Settings → Environments; an agent's deletion was refused as irreversible. Keep `Preview – mad-mpp-2-23` and `Production – mad-mpp-2-23`. It blocks nothing, since `main` has no required checks, but never make `Vercel` a required check. Fix shipped: `.github/workflows/vercel-deploy.yml` builds with the Vercel CLI and deploys the prebuilt output (the "full-featured pipeline" from Vercel's Azure Pipelines guide, on GitHub): PR → preview + URL comment; push to `main` → staging preview; production only by manual run or `VERCEL_AUTO_PRODUCTION=true`. Repo variables `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` are set; **you add the secret `VERCEL_TOKEN`** (Vercel → Account Settings → Tokens, scope MAD-MPP) — agents may not create credentials. Until that secret exists, the green `deploy` check on every PR is a skip, not a deploy (its log says "Vercel deploy skipped"). The repo is public, so Actions minutes are free. A **private** Blob store `mad-gambit-private` was created and connected as `PRIVATE_BLOB_READ_WRITE_TOKEN` (the old `mad-gambit-blob` store is public and empty; uploads and portraits now use only the private one). **Env vars:** run `node C:\Users\nicholasjmcleod\mdc-raw\set-vercel-env.js` — it reads the local, git-ignored env files and upserts the admin secrets, the NIM key and the feature switches without printing them (the agent's run was refused by its permission classifier). Hobby limits in play: 100 crons/project (daily), 300 s functions, 100 deployments/day, Web Analytics 50k events/month (collection pauses, never bills), Speed Insights 10k events/30 days, Blob 1 GB · 2,000 advanced ops · 10,000 simple ops · 10 GB transfer (overage locks Blob for 30 days; `BLOB_DAILY_UPLOAD_CAP`, default 30, keeps uploads inside it). **Supabase (Free):** 2 active projects, 500 MB database, 5 GB egress, 1 GB storage, 50k MAU, pauses after 7 days without activity (the daily crons touch the DB, so it stays awake). Steps, in order: `supabase login` (only you can) → create one project in `iad1`'s nearest region → run `verify/sql/0001`–`0025` → copy data from Neon with `pg_dump --data-only` → set `DATABASE_URL` to the **transaction pooler** (port 6543), `DATABASE_CA_CERT` to Supabase's CA PEM (`lib/db.ts` keeps certificate verification on and needs it), `DB_POOL_MAX=5` → redeploy → retire the Neon vars. |
| **Supabase migration — status 2026-11-02** | **Done:** the existing Supabase project **MADGambit-MMP** (`znsnbisfcxaafkayhalx`, us-east-1, Free) now holds the full schema, `verify/sql/0001`–`0026` (68 tables, recorded in `_migrations`), and all 86 rows from Neon (8 markets, 15 GDELT signals, 32 whitelist names, 6 customer accounts + 6 logins, 8 audit entries, 3 beta sign-ups, seed rows), counts verified table by table. `0026_supabase_lockdown.sql` turns RLS on for every table with no policies and revokes the API roles, so the publishable key reaches nothing; the app's server connection is the owner and unaffected. **Neon survey:** it had only 0001–0014 applied (0015–0017 never ran there), pgvector, an unused `neon_auth` schema (0 users) and no functions or views beyond pgvector's, so nothing in Neon was missing from the repo. The Neon database is managed through Vercel's integration, not the founder's own Neon org (which has no projects). **Remaining, in order:** (1) ~~merge and deploy #189~~ **done 2026-11-03 UTC:** #189 + #190 merged as `44312bf` and promoted to production (`dpl_FuHSSRqzkGdxWUMhXStZmUEpH43a`); (2) point Preview at Supabase with the committed script `verify/scripts/vercel-db-env.mjs` (inputs `DB_URL_POOLED`, `DB_URL_SESSION`, `DB_CA_PEM_FILE` from the environment; `--dry-run` first; it detaches Preview from the shared Neon entries without touching Production's, then asserts that every other entry kept its id and targets; Production needs `--target production --i-understand-this-is-production`) — it replaces the untracked helper that used to live in `mdc-raw`; the credential should be a dedicated role (`app_preview`, `LOGIN BYPASSRLS`, DML only) rather than the `postgres` password, because the app relies on RLS-bypass with the lockdown in `0026`; (3) redeploy; (4) once healthy for a week, remove the Neon integration and its vars. **Neon is still production's live database** (checked 2026-11-03: `DATABASE_URL` was last set 2026-09-05 by the integration, and no `DATABASE_CA_CERT` exists), so deleting it before steps 2–3 takes `madgambit.fun` offline. Rows written to Neon after the 2026-11-02 port (beta sign-ups, audit entries) must be re-copied to Supabase before it goes, so compare table counts first. Deleting it is the founder's action: Vercel → Storage → the Neon database → Settings → Delete, then remove the integration's `POSTGRES_*`, `PG*`, `NEON_*`, `VITE_NEON_AUTH_URL` and `NEON_AUTH_BASE_URL` vars. The pooler presents **Supabase Root 2021 CA**; the copy at `mdc-raw/supabase-ca.pem` matches the served root's SHA-256 fingerprint. **Re-verified 2026-11-09 (live queries, not recalled):** Supabase holds 68 public tables = the 67 that `verify/sql` creates + the runner's own `_migrations`; the app ledger lists `0001`–`0026`; Supabase also carries a `mad_0026b_revoke_public_function_execute` migration that was never committed — now `verify/sql/0026b_revoke_public_function_execute.sql` (idempotent REVOKEs). Security advisors show no warnings; the 68 INFO items are "RLS on, no policy", which is the intended lockdown. **⚠️ Trap: Preview shares Production's database.** `vercel env ls` shows `DATABASE_URL` (and the `PG*`/`POSTGRES_*` set) in BOTH Preview and Production, last set 65 days ago by the Neon integration, and no `DATABASE_CA_CERT` or `DB_POOL_MAX` in either — so any preview deployed today reads and writes production's Neon database. Do not deploy a preview until step 2 has run (it sets Preview first). GitHub side: only `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` are correct; `NEON_API_KEY` (secret) and `NEON_PROJECT_ID` (variable, placeholder value) are stale, and `VERCEL_TOKEN` is absent, so the `Vercel deploy` workflow still skips. **Neon retirement — founder asked 2026-11-09 for "migrate it, then wipe it out"; it is DONE only when every box below is true, each with its check:** ☐ Neon's rows are on Supabase (`NEON_URL=… SUPABASE_URL=… node verify/scripts/neon-to-supabase.mjs` exits 0 with no "Neon has more" lines; run `--apply` first if it does not) · ☐ Preview points at Supabase (`node verify/scripts/vercel-db-env.mjs --dry-run` shows no shared Neon entry for preview) and a preview build answers `/api/v1/health/db` · ☐ Production points at Supabase (same script, `--target production --i-understand-this-is-production`), redeployed and promoted, `https://madgambit.fun/api/v1/health/db` ok and a sign-in works · ☐ a week of healthy traffic · ☐ the Neon database is deleted and the `POSTGRES_*`, `PG*`, `NEON_*`, `VITE_NEON_AUTH_URL`, `NEON_AUTH_BASE_URL` variables and the stale GitHub `NEON_API_KEY` / `NEON_PROJECT_ID` are removed. **What stops an agent today (2026-11-09):** Production's `DATABASE_URL` is a legacy Vercel *Secret* (`vercel env run` reports "30 Secret values cannot be pulled"), the Neon database is not in the founder's Neon org (0 projects, 0 recoverable) nor listed by `vercel integration list --all`, and creating a Supabase database credential was refused by the permission classifier — so the connection strings must come from the founder (Vercel dashboard → Storage → Neon, and Supabase dashboard → Database), set as shell variables and never pasted into chat. |
| **Founder-gated ops** | Rotate/confirm `NEON_API_KEY` · attach `madgambit.io` · GitHub Advanced Security toggles · push `v2.24-constellation` · Phase-4 named-subject gate (KMS choice, `MADPortraitKeyRegistry` deploy, 6 signed `registry_readiness` rows). |

---

## 5 · Build queue, in dependency order

Full detail — file paths, exit criteria — in ****Parts III–V + Workstream B below****.

| Phase | Item | Effort |
|---|---|---|
| **T1** | **One tokenomics engine — close the perp/stake bypass.** 🟡 **Phase 1 landed 2026-10-23** (`perps/convict` + `faces/stake`): `stakeConviction` now debits `madx_accounts` through `spendWithin(client, …)` **inside its existing transaction**, takes the §6 fee via `splitFee` (1.88%, `creatorShareBps: 0` — a perp slot has no per-market creator), puts the **net** on `perp_positions.conviction` and `perp_markets.volume`, and returns `StakeResult | StakeFailure` so the routes answer **402** for a short wallet and **400** for a bad amount instead of collapsing both to 400. The §6 split is **computed and recorded in the ledger note, never distributed** — deciding a destination would silently resolve §13 item 7. `convictionCost()` is split out as a pure function so the money maths is testable (`lib/perp-store.test.ts`, 10 assertions); the transactional half needs a live Pool and cannot run under vitest. `round6` is now exported from `madx-web2.ts` so a caller cannot round differently from the ledger. 🟡 **Phase 2a landed 2026-10-23** (`shield/opt-in`): `shield_positions.premium_paid` was a column that lied — the route wrote the §5 premium and debited nothing, so every payout and revenue figure derived from it counted money nobody had paid. New `chargeAndInsertShieldPosition` charges and inserts in one transaction; 402 with `premiumDue` when short. `insertShieldPosition` kept, unchanged. **✅ Phase 2b landed 2026-11-09 (PR #200) — `zeitgeist/auction`.** The sealed-bid deposit now has its whole lifecycle, which is why it was held back until it could ship as one piece: **debit on commit** (`spendWithin`, in the same transaction as the bid insert — insert first, so the unique index serialises a replay; a short wallet gets **402** `depositDue` and no bid row), **refund on reveal** (`refundWithin(client, …)` in `madx-web2.ts`, ledger kind `refund`, already permitted by `sql/0008` — no migration; winners get the bond back too, it is a bond against not revealing, not a part-payment), **forfeit on no-reveal** (nothing moves — the debit at commit already left the account and there is no treasury account until CF1 — `slot_bids.status = 'forfeited'`). The clear is **one transaction** (`lib/slot-auction-store.ts#clearAndSettle`: auction row and bids `FOR UPDATE`, `cleared_at`, every refund, every status), where it used to be four unwrapped `pool.query` calls. **Refunds are looked up, not assumed:** each pays what its commit-time `spend` row took (`depositNote` is the join key), so a bid committed before this change — `deposit` recorded, nothing charged — settles its status and mints nothing. A revealed-and-outbid bid now ends `refunded` (it used to stay `revealed`; `status` is free text, no CHECK). Evidence: `lib/slot-auction-store.test.ts` (29 tests: the three terminal states, conservation, clear-twice, mid-refund failure rolls back, legacy bid never mints), mutation-checked; `tsc` clean, `vitest` 754/754. **What it does not prove:** the tests run against `lib/testing/fake-ledger-pool.ts`, an in-memory pool that proves the ledger *logic* but is not Postgres — a SQL typo would pass there; CI has no database. **Watch the first real clear.** **🔴 Phase 2c — the winner's clearing price is still not collected, and nothing starts it without a policy.** `clearAuction` computes a uniform `clearingPrice` every winner pays; no code debits it, so a slot is free today. Charging it at clear time needs an answer to "what if the winner cannot cover it now?" (void the win and re-clear with the next bidder · charge the deposit and mark a debt · require the full bid escrowed at commit instead of 10%), and where it goes until CF1 gives the platform an account. A product decision, not an engineering one. **Phase 3 remains:** a ledger check in `check-route-guards.mjs`, proven to fail before being trusted. `staking`/`tournament/match`/`cards/evolve` are compute-only (no DB write at all) and need a product call — real backend, or stop presenting their output as a position — not a ledger write. *(Founder requirement, 2026-10-23: "no perps or markets or other indicating it requires connection to tokenomics should be outside this engine.")* The **maths** engine is already single: `verify/lib/gambit-game-math.ts` has **~75 consumers** and is the only pricing/scoring source. The **satire one-liner** engine is also already single and already reaches perps: `verify/lib/satire-headline.ts#satirizeHeadline` is called by `app/api/v1/perps/family/route.ts:114`, `app/api/v1/news/satirical/route.ts:74` and `app/api/satire-engine/route.ts:260`. **The $MADx ledger is the one that is NOT single.** `lib/madx-web2.ts` has exactly **9 importers**: the eight `app/api/v1/madx/*` routes plus `lib/market-book.ts`. Everything else that takes or promises value writes its own state and never debits a balance — verified this session: `app/api/v1/perps/convict` → `perp-store.stakeConviction()` (`lib/perp-store.ts:688`) increments `perp_positions.conviction` and `perp_markets.volume` **with no ledger call, no fee, no book, no price tape** — conviction on a perp card is free; `app/api/v1/faces/stake` uses the same `perp-store` path; `app/api/v1/zeitgeist/auction` performed 7 writes through `lib/slot-auction.ts` and never debited a bid *(deposit fixed by phase 2b above; the clearing price is 2c)*; `app/api/v1/shield/opt-in` writes through `lib/shield.ts` and never charges a premium; `app/api/v1/staking`, `app/api/v1/tournament/match` and `app/api/v1/cards/evolve` are **compute-only** (no DB write at all) while the UI presents them as positions. **Fix shape:** `fill()` in `lib/market-book.ts` is the reference implementation — one transaction, `SELECT … FOR UPDATE`, `spendWithin(client, …)` so the debit joins the caller's transaction. Every path above should route its value movement through `spendWithin` the same way. Do **not** delete or relabel any of these routes. | 3–5d |
| ~~**0**~~ | ~~`open-pack` fairness bug~~ — **DONE.** Nonce derives server-side from `auth.owner` + persisted `customer_accounts.pack_open_count` via `lib/pack-nonce.ts`; `verify/sql/0015_pack_open_counter.sql` added; regression coverage in `lib/pack-nonce.test.ts`; `madxBalance` no longer read from the request body. | — |
| **B1-rest** | Octavian perps-deck container sizing. **Narrower than originally written:** `lib/instrument-chrome.ts` already exists and `perp-dials.tsx` already imports its canvas primitives. What is still inline is only the CSS *deck-shell* chrome (`borderRadius: 24`, `clamp(10px,1.4vw,16px)` padding, gradient + `boxShadow`), and only in that one file — so this is an extract-before-second-use, not the third copy-paste. Envelope sizing itself is fixed (Part 0 §2.1); the visual pass remains. | 0.5d |
| **1** | Perceived-performance foundations. **Partly done:** `app/error.tsx`, `app/global-error.tsx` and `app/loading.tsx` (skeleton, not spinner — reserves the grid footprint so arrival doesn't cause CLS) all shipped; none existed before. **Remaining:** `next/font`, `next/dynamic` code splitting (93 components / 19,455 lines ship eagerly today), image optimization. **Measure LCP/CLS before and after or it's worthless** — and note nothing in CI measures this, so it needs a real browser session. | 1–2d |
| **2** | Interaction feel: `useOptimistic` on mutations, haptics on the moments that matter, persisted audio mute (**default off**), focus rings (only 3 `focus-visible` vs 92 `aria-`). | 2d |
| **3** | VRF on Sepolia: seed-parameterize `openCardPack`/`attemptEvolution`, `contracts/src/MADRandomness.sol` on `VRFConsumerBaseV2Plus`, Foundry tests with a mock coordinator, async pack UX. Coordinator address + key hash marked **‹verify›** — read off live Chainlink docs, they were egress-blocked here. | 3–5d |
| **4** | VRF mainnet + **random juror selection** in `MADDisputeVoting.sol` (the most defensible non-obvious use — removes "who resolves this market" as a manipulation surface). | — |
| **B2** | O-V deck → exterior interactive experience, bound to `node-registry` state. Source is the **`MADdegen/OV-Deck-2026` repo** (`src/slidesData.ts`, structured, plus 8 ready-built interactive components) — *not* the older HTML export. Blocked on Part 0 §3's deck conflicts. | 4–6d |
| **—** | Security gaps. **CSP shipped, half-enforced by design:** `frame-ancestors` / `base-uri` / `object-src` / `form-action` are enforced (they restrict capabilities this app never uses, so they cannot break a page), while `script-src` / `style-src` — the two that actually stop XSS and the two that white-screen an app when wrong — ship **Report-Only**, because Next injects inline bootstrap, Tailwind injects inline styles, wallet extensions inject providers, and no browser exists in the agent sandbox to verify against. **Promotion to enforced is a two-line change once reports are quiet, and is the intended follow-up.** Review `connect-src` first: if `RELAYER_RPC_URL` is repointed at a dedicated provider, that host must be added or client-side wallet reads break. **ERC-4337 session keys remain open.** Anti-scrape/capture layer shipped on PR #169 (PART II §6, layer 9); the next real step there is Vercel Firewall bot rules, which a User-Agent check cannot replace. | — |
| **—** | Promote Lint / Slither / Dependency Review from report-only to blocking, once their backlogs are worked. | — |
| **—** | **Put the creator ladder on-chain.** `MADMarketFactory` pays `CREATOR_FEE_SHARE_BPS = 4000` (flat 40%) to every creator; canon and `splitFee` pay 28.8% → 40% by rung (and 60% on a VIP seat). Proposed shape: per-creator `creatorShareBps` set by an owner/registrar role, limited to {2880, 4000} now, read at resolution, plus a `vipSeatsIssued` counter capped at 4,888 once §13 item 9 is fully answered (the *how* is — bought as a Golden Ticket, 2026-11-09 — but not whether a purchased ticket converts). Needs Foundry tests (CI only — no `forge` in the agent container). The contract is merged, not deployed, so no live payout moves. Decide snapshot-at-creation vs rung-at-resolution first. | 1–2d |
| ~~**—**~~ | ~~**Rename "MAD Upshot" → MAD Gambit**~~ ✅ **DONE 2026-10-27 outside MASTER:** both in-app decks (mindmap title, section heading, SVG node), `ov-pitch-deck.html` slide 3, `AGENTS.md`, both Kotlin prompts and the MADHAT'r knowledge base. MASTER keeps its historical mentions. Original row: (founder, 2026-10-23). 17 occurrences across 7 files at `72a370e`: MASTER ×7, `verify/public/pitch/index.html` ×3, `madhats-gambit.html` ×3, `ov-pitch-deck.html` ×1, `AGENTS.md` ×1, and two Kotlin prompts in `master-maths/`. Investor surfaces first — slide 3's title is literally *"MAD Upshot: The Card Economy"*. Edit in context, not by sed (§7). | 0.25d |
| **—** | **Gate 60% on a VIP seat, capped at 4,888.** `CREATOR_LADDER` grants 6000 bps as `CR8TR` by traction with no cap; canon (2026-10-23) makes 60% a VIP profit share limited to 4,888 seats. Needs a seat registry, an issued-seat count enforced on-chain and in `splitFee` callers, and the founder's answers still open in §3: a seat is **bought as a Golden Ticket NFT** (answered 2026-11-09), but whether a purchased ticket *is* the seat or still converts, and whether `CR8TR` traction keeps reaching 60%, are not. If the ticket is the seat, the issued-seat count is the ticket's sold supply. **Moves real payouts — do not ship before those answers.** | 1–2d |
| **—** | **Golden Ticket → VIP seat qualification, record-only.** Pin `GOLDEN_TICKET_SUPPLY = 4_888` tied to `VIP_PROFIT_SHARE_SEATS` so the two cannot drift, a minimum-conversion target of 2,888, and a `qualifiesForVipSeat(markets)` test — three creator markets, **each** ≥ 188,000 volume. Like the seat cap, it must not gate payouts until §3's open questions are answered; settle the volume definition first or the test measures the wrong thing. **2026-11-09:** the founder says a seat is obtained by *purchasing* a Golden Ticket, so if purchase alone confers the seat this test is moot — settle §3's conversion question before writing it. Today the only Golden Ticket UI is a local-state *claim* button (`components/dutch-auction-panel.tsx:76-80`): no purchase, no NFT, no ledger entry. | 0.5d |
| **—** | **Investor surfaces still say Golden Ticket 2,488.** `verify/public/pitch/index.html` (×3: the hot-sheet line, the roadmap chip, *"Be among the first 2,488 Founders…"*) and the Live Dataroom index in `MADdegen/MADGambit-Presentation-Engine` → `collateral/` (×3, same places). Canon is now 4,888 (§3). Change on the founder's word — *"we're going to"* may mean not yet announced. **2026-11-09:** the founder ties the Golden Ticket to the open-beta launch campaign, so the supply on these surfaces is launch-facing — confirm 4,888 is announced before changing. | 0.25h |
| **—** | **Refresh two imported sheets' fee line.** `docs/GOSSIP_COP_Product_Sheet_Technical_Spec.docx` (v1.2) and `docs/PERPETUAL_EPIPHANIES_Product_Sheet_Technical_Spec.docx` (v1.1), added 2026-10-23 from the founder's Drive, predate the creator ruling: they show the creator share as a flat 40% and the community 28.8% without "of platform net". Uploaded verbatim; correct on their next revision (`scripts/build-perp-sheets.py` is the house-format generator). | 0.5h |
| **—** | **Retire the 60% Shield rung — needs founder confirmation first.** Canon (§3, 2026-10-23) caps the Shield at 40%; the engine still pays 60% via `SHIELD_RECOVERY_WHALE_PCT`, `calculateShieldPayoutFull`'s whale branch, `shieldRecovery(loss, vip=true)` and `WHALE_SHIELD_ELIGIBILITY` (`verify/lib/gambit-game-math.ts`). Removal lowers payouts for whale-eligible holders, so confirm before changing code; the canon-lock test pinning `SHIELD_RECOVERY_WHALE_PCT` 0.60 changes with it. | 1–2h |
| **—** | **Paseome to a tradeable book.** `lib/paseome.ts` + `GET /api/v1/paseome/frontier` ship real maths on demo data. Missing: tree persistence (`sql/00xx_paseome.sql`), the branch-refund ledger, artefact-gated branch authorship, and the Foresight oracle path. Sheet: `docs/product-sheets/PASEOME.md`. **3D view shipped (#179 + desk, 2026-11-04). Graph side of the depth contract — proposed, not built:** `GET /api/v1/paseome/frontier?node=<id>` returns the frontier hanging off that node, plus `parentId` and `path` (ids from the root); the graph would fetch a node's frontier when it is tapped and draw those branches one hop further out. Until a route sends real child nodes the graph draws none — the existing two-hop figure is a *price*, not a node, and drawing nodes for it would be invention. `parseFrontier` ignores unknown fields, so adding them breaks nothing. **Open founder questions (carried from the 2026-10-23 Paseome close-out, 2026-11-09):** artefact-gate timing; what roots a Hindsight tree. | 3–5d |
| **—** | Carried from the repo: THE WIRE demo-row · raw-hex design-token scrub (~82 values, 5 panels) · 4 dead components · slot-auction clearing is manual — nothing creates `slot_auctions` rows or schedules the clear. **Since PR #207 a missed clear no longer strands deposits:** a plain `clear` settles the OLDEST closed-and-uncleared auction (the route used to clear `vintageAt(now) + 1`, which names the *next* auction once the Turning rolls over, so a missed tail could never be reached again — and since #200 its deposits are real debits); `{ "vintage": N }` clears a named one; commit takes the auction row `FOR SHARE` and refuses a cleared auction; the refund-proof ledger lookup is owner-scoped. The lock and SQL behaviour has not run against a real database — watch the first clear. | — |

### Workstream TD — tech-debt register (scored 2026-11-03)

Scanned 2026-11-03 across the repo (`main` at `d19b6cc`), Supabase `MADGambit-MMP` and Vercel `mad-mpp-2-23`. Each item is scored on Impact, Risk and Effort (1–5), with **Score = (I + R) × (6 − E)**. Effort scale: 1 ≈ under an hour, 2 ≈ half a day, 3 ≈ 1–2 days, 4 ≈ 3–5 days. *Founder* marks steps no agent can take.

| # | Debt (type) | I | R | E | Score | Fix · who |
|---|---|---|---|---|---|---|
| TD1 | **The default branch is `The-MDC`, 177 commits behind `main`** (infra). Dependabot and code scanning read it, so their alerts describe old code: 12 of 15 Dependabot alerts are `axios`, which `main` does not contain, and the four "missing workflow permissions" alerts are already fixed on `main`. Dependabot also merges its PRs into it: **#180–#185** (framer-motion 14, vitest 5, lucide-react 1.x and its type-check fix, an 18-package minor group, dependency-review v5) sit there and never reached `main`. | 4 | 4 | 1 | **40** | *Founder:* Settings → General → Default branch → `main`. *Agent:* port #180–#185 onto `main` in one PR (regenerate the lockfile with npm, never by hand). |
| TD2 | **Hobby plan under a commercial beta** (infra). Hobby forbids commercial use, allows only daily crons and cannot Git-connect an org repo, so every production deploy is a manual CLI deploy that lands *staged* and needs `vercel promote` (§7). | 3 | 4 | 1 | **35** | *Founder decision:* Pro ($20/month) removes all three. |
| TD3 | **Production still on Neon; the Supabase switch is half done** (infra). That leaves two databases to keep in step, 16 Neon integration vars, and legacy multi-database code reading `NEO_DATABASE_URL` / `NEON_SKY_PARK_DATABASE_URL`. | 4 | 4 | 2 | **32** | *Founder:* the §4 Supabase steps. *Agent, after:* delete the legacy readers and list the vars to remove. |
| TD4 | **Shipped features run dark in production** (config). `ADMIN_*`, `RESEND_API_KEY` / `REPORT_*` and `NIM_API_KEY` are unset, so the admin suite, the weekly report mail and the LLM concierge run disabled or in fallback. | 4 | 2 | 1 | **30** | *Founder:* run `set-vercel-env.js` (§4). |
| TD5 | **CI gates that pass without checking** (infra/test). Lint is `continue-on-error` (0 errors, 187 warnings across 140 files), `main` has no branch protection or required checks, and the `deploy` job skips without `VERCEL_TOKEN`. | 3 | 4 | 2 | **28** | *Founder:* add the token; protect `main`, requiring Verify and Unit tests but **never** `Vercel`. *Agent:* work the lint backlog down, then make it blocking (the "Promote Lint…" row above). |
| TD6 | **RSS entity double-decode** (code/security). `lib/rss-feeds.ts:145` decodes `&amp;` before `&lt;`, so `&amp;lt;` becomes a live `<` (code scanning `js/double-escaping`). `lib/article-ingest.ts` carries the same alert ‹verify›. | 2 | 3 | 1 | **25** | *Agent:* decode `&amp;` last, plus a test. |
| TD7 | **No error monitoring or retained logs** (infra). Hobby keeps runtime logs only briefly, Speed Insights is off, and the Vercel connector cannot read this project's runtime-error clusters (403). An incident leaves no trail. | 3 | 3 | 2 | **24** | Enable Speed Insights (free tier); add an error tracker with a free tier, or take Pro's log retention (TD2). |
| TD18 | **Work and upkeep still in the storage repo** (infra). Against the repo roles in §1, `MADGambit-Official-MMP` `main` is at `955f8f7`, 11 commits behind `MAD-MPP-2.23` `main`, with 12 open PRs (#1–#10 Dependabot, #11, #12). The working repo still lacks the madgambit.io site (`site/`, 18 files), `datahouse/` (5 files, in the local clone only), `tools/` (2 files) and about 100 lines of planning text in that clone's MASTER. | 3 | 3 | 2 | **24** | *Agent, with founder review because the working repo is public:* port what belongs there, close #1–#12, and fast-forward `main` after each production promote. |
| TD8 | **Tests cover `lib/` only** (test). 55 test files, all under `lib/`; 136 route handlers, 119 components and 18 pages have no direct tests and there is no e2e. | 3 | 4 | 3 | **21** | *Agent:* route-handler tests for the money and auth routes first (`bets`, `swap`, `beta/*`, `admin/*`), then a smoke e2e on `/beta`. |
| TD9 | **Integration vars nothing reads** (infra/security). LaunchDarkly ×4, Upstash KV/Redis ×5, `EXPERIMENTATION_CONFIG` and `VITE_NEON_AUTH_URL` (a Vite prefix in a Next.js app) have no package and no code reader: live secrets with no purpose. | 1 | 3 | 1 | **20** | *Founder:* remove those integrations in Vercel, or say what they were for. |
| TD10 | **Vendored `contracts/lib`** (dependency). 1,064 copied files and no submodules, so they have no update path; three code-scanning alerts sit in OpenZeppelin's `fv/run.js`. | 2 | 3 | 2 | **20** | *Agent:* move to `forge install` submodules or soldeer, and exclude `contracts/lib` from scanning. |
| TD11 | **Old `madgambit` team leftovers** (infra). The red `Vercel` check on every PR comes from them; see the free-tier row in §4. Its `mad-mpp-2-23` copy holds no code `main` lacks: its last builds, `a6c80d6` and `2bde55b`, are both ancestors of `main`. | 2 | 2 | 1 | **20** | *Founder:* delete the four projects in team `madgambit`, plus the seven stale GitHub environments. |
| TD12 | **Repo hygiene** (docs/architecture). 98 handoff and plan files in `.agents/` and planning docs in `PROJECTS/` sit beside MASTER, against CLAUDE.md's one-document rule. Root-level `app/`, `lib/`, `backend-node/`, `next.config.mjs` and `vercel.json` sit outside Vercel's `verify/` root, so they deploy nothing and mislead. | 2 | 2 | 2 | **16** | *Agent:* fold anything live into MASTER, then remove the rest in a reviewed PR. |
| TD13 | **Zero foreign keys across 68 tables** (data). For example `bets`→`markets`, `perp_positions`→`perp_markets`, `slot_bids`→`slot_auctions`. Orphans are possible. | 2 | 3 | 3 | **15** | *Agent, once Supabase is live:* add each key `NOT VALID`, clean any orphans, then `VALIDATE`. |
| TD14 | **The TS 6 lint shim** (dependency). `typescript-eslint` 8 refuses TypeScript 7, hence `scripts/eslint-ts6-shim.cjs` and the `typescript6` alias. | 1 | 2 | 1 | **15** | *Agent:* drop both once `typescript-eslint` supports TS 7. |
| TD15 | **Oversized modules** (code). `components/conviction-charts.tsx` 1,965 lines, `lib/gambit-game-math.ts` 1,552, `components/perp-dials.tsx` 1,285, `lib/perp-store.ts` 1,128. | 2 | 2 | 3 | **12** | Split when next touched; no standalone sprint. |
| TD16 | **137 of 151 indexes never used** (data). Not debt yet: Supabase has no traffic, and 56 of 68 tables are empty. | 1 | 1 | 1 | **10** | Reassess after 30 days of live Supabase traffic. |
| TD17 | **Client-side randomness** (code). The PvP battle (`context/game-context.tsx:375`, local MMR only) and `attemptEvolution`'s `vrfResult` (`lib/gambit-game-math.ts:738`, the non-authoritative simulate mode of `/cards/evolve`) use `Math.random()`. Neither moves a balance today. | 2 | 2 | 4 | **8** | Row 3 above (VRF) is the fix; keep both paths off any balance until then. |

**Phasing, alongside feature work.**
- **Phase 1:** about an hour of founder clicks: TD1 default branch, TD3 and TD4 env/database, TD9, TD11, and the TD2 decision.
- **Phase 2:** 2–3 agent days. Port #180–#185, TD6, the TD5 backlog start, TD10, TD12, TD18, and TD3's legacy-code removal.
- **Phase 3:** ongoing, about 20% of each sprint. TD8 money/auth route tests, TD13 once Supabase is live, TD7, TD15, TD14, TD16, and TD17 via row 3.

### Workstream C — converge the two clients (added 2026-08-18)

`master-maths/` is **not a dead artifact**; it is the second client of this product. See §7 and
Part I 2026-06 for the evidence. Ordered by dependency:

| # | Item | Notes |
|---|---|---|
| **C5** | **A Gradle job in CI.** `master-maths/` is built by **no workflow** — the path filters in `ci.yml` / `foundry.yml` don't match it, so the Kotlin can stop compiling with nothing going red. Same class of gap that left `contracts/script/**` unverified until it was found by accident. **Do this first: it is the cheapest, and it is what makes C1–C4 verifiable.** |
| **C1** | **One token source.** Generate `master-maths/…/ui/theme/Color.kt` and `verify/lib/gambit-design-tokens.ts` from a single file. The palettes are identical *by coincidence* today; this makes them identical *by construction*. Blocks nothing, unblocks every later visual change. Folds naturally into the raw-hex scrub already queued above. |
| **C2** | **`MadGambitApiService.kt`.** A third service beside `GeminiApiService.kt` and `RssFeedFetcher.kt`, hitting `/api/v1/{faces,zeitgeist,epiphany,perps,markets,registrar}`. Depends on nothing. This is the whole of "build the backend for the Android app" — the backend exists, the app has never been pointed at it. |
| **C3** | **Reconcile the two maths.** `GambitMath.kt` and `gambit-game-math.ts` share lineage but have drifted — the web side has since gained CGARCH/EGARCH the Kotlin lacks. Decide canonical per function against Part VI; the web side is better tested (canon-lock suite). ⚠️ Do not silently resolve — this is a Part VI §13-class decision. |
| **C4** | **Phone-frame theme on the web hub**, plus the genuinely-new backend behind it: KAITO feed, NYSE price panel, O-V Deck release registry, skin/laser selector. Everything else in that design — MULTIPLIER, MIN THRESHOLD, SHIELD APY, Δ-LIMIT — is **already computed** by existing maths. Check whether `The-MDC/mad-gambit-ui` simply *is* this UI before building it (blocked, Part 0 §4/§6). |

**Sequencing constraint:** VRF makes pack-opening asynchronous (request → 3+ confirmations →
callback). Shipping it onto today's synchronous UI replaces an instant pack-open with an
unexplained freeze. **Phases 1–2 are prerequisites for Phase 3, not parallel work.**

### Workstream CF — carried from the 2026-10-23 close-outs (added 2026-11-09)

Open items that existed **only** in the two thread close-outs, folded in so the close-out can be overwritten without losing them. The old `#26`–`#42` labels were that session's task-list ids, not GitHub numbers (GitHub PR #40 is an unrelated satire-ingest PR). File and line references were re-found on `main` @ `5c5c41e`.

| # | Item | Notes |
|---|---|---|
| **CF1** | **Distribute the swap fee.** | Founder chose **"conserve now, distribute later"**: credit the gross swap fee to one treasury account, record the computed creator/community/protocol split as metadata, decide no waterfall. **Not started.** Needs a migration extending the `madx_ledger` `kind` CHECK (`sql/0008_madx_web2.sql:22`, currently `'welcome','buy','transfer_in','transfer_out','stake','unstake','claim','spend','refund'`; no later migration touches it) plus a treasury owner id. T1 phase 1 already does the equivalent for perp conviction fees — split computed and recorded in the ledger note, never distributed — so keep the two consistent. |
| ~~**CF2**~~ | **Canon drift — two supply numbers disagree.** | ✅ **DONE 2026-11-09 — PR #203** (the founder's "just document" choice; `MADX_BETA.cap` is **not** raised). `lib/gambit-game-math.ts`, `lib/madx-web2.ts` and `lib/contracts.ts` now each name the other number and say what the two mean: **888,888,888 is the total supply; 224,573,096 is the mint cap** the beta ledger enforces and the deployed contract carries. The **270 million** sale (founder, 2026-11-09) sits above that cap, which stays unresolved (§3, `$MADx` supply). `lib/madx-supply-canon.test.ts` pins both numbers, ties the cap to `lib/contracts.ts` and asserts each site names the other — when the cap is raised, pin the new number there. The `calculateConviction` shadowing (`lib/mpp-math.ts`, a 4-argument saturating curve, against `lib/gambit-game-math.ts`, the 6-argument Cobb-Douglas) is recorded at both definitions and pinned, **not renamed** — that is a Part VI call. Original row: `MADX_FIXED_SUPPLY` = 888_888_888 (`lib/gambit-game-math.ts:24`) against `MADX_BETA.cap` = 224_573_096 (`lib/madx-web2.ts:21`, the one the ledger enforces); comment each site naming the other and add a test asserting the cap. |
| **CF3** | **Settle-escalation siblings.** | The complaint route is fixed and merged (#143). Remaining self-attested or body-supplied authority: `zeitgeist/succession` (the `persist` branch, `:99`), `zeitgeist/auction`, `shield/opt-in` (whale eligibility read from the request body, now `:66-70` — it was `:57-62` before T1 phase 2a edited the route), `tournament/match:39-44` (the combatant, `tier` and `rank` all come from the request body), `markets/route.ts:76-79` (body-supplied `creatorWallet`). ‹verify› — succession and auction were not re-read in detail on 2026-11-09. |
| **CF4** | **Card collection display.** | Map `CardRow` → `NftCard` so owned cards render (`app/api/v1/cards/collection/[wallet]/route.ts` returns `CardRow`s from `lib/cards.ts`; `components/nft-card.tsx` renders them). |
| **CF5** | **`logic-lab` and `sentiment-equalizer` wiring.** | Z-Liar is done; these two still render local tables. Confirmed 2026-11-09: `components/logic-lab.tsx` makes no API call, and `components/sentiment-equalizer.tsx` only mentions `/api/satire-engine` in a comment ("when ready"). |
| **CF6** | **Prompt-injection hardening on `POST /api/v1/satire/roast`.** | `headline` (capped at 400 at the route) and `article` (clipped to 1,800 chars in `lib/local-satire.ts:140`, present since #144) are interpolated verbatim and undelimited into the model prompt (`userPrompt`). The length is bounded; the injection surface is not. Flagged, not built. |
| ~~**CF7**~~ | **Pin the weak determinism tests.** | ✅ **DONE 2026-11-09 — PR #203.** There were **four** such tests, not three — `derivePackNonce`, `computeHeatForPool`, `deriveSeries`, `buildPaseomeGraph` — each now pinned to literal outputs. Mutation-checked: a `derivePackNonce` that mixes in `Date.now()` now fails. Original row: Tests of the form `expect(f(x)).toBe(f(x))` pass for any deterministic function and say nothing about its value. Three were found on 2026-10-23; `derivePackNonce` (`lib/pack-nonce.test.ts:8`) is the one that matters — it is security-relevant, and a clock-dependent implementation could pass it. Pin to known values. |
| ~~**CF8**~~ | **Guard the `$MADx` address like the canon numbers.** | ✅ **DONE 2026-11-09 — PR #203.** `lib/madx-address-pin.test.ts` pins the address across eight files (code, contracts, docs, pitch deck), checks EIP-55 validity via `viem`, and fails if the ORKx address reappears in code or the deck. Mutation-checked. Original row: `gambit-game-math.test.ts` locks every constant by value; the token address (`0x6972370e1caAA3624F37D7e87C28e1089D00151f`, founder-confirmed 2026-10-26) is repeated across `cards/route.ts`, `CARD_CANONICAL_REFERENCE.md`, `DEPLOYED_ADDRESSES.md`, `RECONCILIATION_RUNBOOK.md`, `MADxToken.sol` and `Deploy.s.sol` and asserted nowhere. One test would have caught the ORKx mismatch, and the address has now been changed once. |
| **CF9** | **Stale pack economics in the design decks.** | Mockups say 888 $MADx / 8 cards; the engine says **4.88 $MADx / 5 cards** (`PLATFORM.CARD_PACK_COST/SIZE`, PART VI). ‹verify› — the decks now live in `MADdegen/MADGambit-Presentation-Engine` and were not re-checked there. |
| **CF10** | **Six product sheets never written.** | `SCANDAL_VELOCITY`, `Z_LIAR_METER`, `CONVICTION_MARKETS`, `OPEN_MARKETS`, `MAD_SHIELD`, `CREATOR_PROFIT_SHARE`. Three subagents writing them were killed by a session rate limit on 2026-08-28; only `PREDICTION_MARKETS` finished. The founder later said to set sheets aside in favour of code — listed so they are not mistaken for done. Only `PASEOME.md` and `PREDICTION_MARKETS.md` exist in `docs/product-sheets/`. Write them directly, not through subagents. |
| **CF11** | **A live Ollama round-trip has never run.** | **Ran 2026-11-09 on the founder's Windows machine — PR #204 — but did not finish.** `lib/local-satire.live.test.ts` is an opt-in live test (`OLLAMA_LIVE=1 OLLAMA_MODEL=<model>`; skipped in CI). Ollama is reachable and the request/response path works. The only model installed (`openclaw-moe:latest`, 10.5B MoE IQ4_XS, CPU-only) returned `{}` or junk JSON for an ordinary headline under **both** the new and the pre-CF6 prompt (A/B), so it cannot follow the roast contract and the tier degrades to the deterministic writer as designed; the hostile-prompt case therefore passed *vacuously*. **To finish:** pull an instruct-tuned model that emits JSON (e.g. `ollama pull qwen2.5:3b`, ~2 GB — a download the founder should approve) and re-run the command above. Note `ollama list` auto-starts the Ollama server. Original row: No Ollama in the agent container, and Vercel cannot reach a desktop by design (§7: the local-model tier only works where the model sits beside the app). Needs a machine that has both. |

---

## 6 · Environment constraints — these will hit the next session too

| Blocked | Evidence | Consequence |
|---|---|---|
| `registry.npmjs.org` | direct `curl` → **403** (host is in `no_proxy`, so it's egress policy, not the proxy) | No `npm install`, no local typecheck. **Never hand-edit `package-lock.json`** — CI runs `npm ci`. |
| `vrf.chain.link`, `docs.chain.link` | proxy `EGRESS_BLOCKED` | VRF constants marked **‹verify›** must be read off live docs. |
| `*.neon.tech`, TCP 5432 | 403 / unreachable | No agent can inspect or merge the databases. |
| `github.com` (WebFetch) | `EGRESS_BLOCKED` | Can't check action release notes — why `setup-node@v4`, `upload-artifact@v4`, `dependency-review-action@v4` were left alone. WebSearch still works. |
| Cross-org `add_repo` | *"cross-tier adds are not supported"* | Session scoped to `maddegen`; `The-MDC/*` repos unreachable. |
| v0 MCP server | disconnected | Couldn't query v0 chats (Part 0 §7). |
| Blockscout MCP (free tier) — added 2026-11-09 | ~**10 tool calls per free session**; one session was declared dead after two (the unlock call and one address lookup). The server's own notice says that from **2026-10-08 all requests require a PRO key** (`https://mcp.blockscout.com`). | Budget the calls and pick the address that matters most. The `0xb61ae772…fd18` read (§3) was the half that got through in that session; `0x6972…151f` was read later, in another. |
| MCP servers drop and reconnect mid-session — added 2026-11-09 | github, Blockscout, Vercel, Figma, Linear, HuggingFace and others, in both directions; calls fail with `InputValidationError` or a hard disconnect. `Github_MCP` once failed to connect while the `github` MCP server worked. | Re-load the schema through `ToolSearch` — a tool that worked ten minutes ago may need re-fetching. Use whichever server is up. |
| **A fresh git worktree has no `node_modules`** (found 2026-11-01, local Windows) | Junctioning the main checkout's `verify/node_modules` in works for `tsc`, lint and vitest, but **Turbopack refuses it** ("files outside of the workspace root are not compiled" → every page 500s). | Run `next dev --webpack`. Headless/automated user agents get a **403 from `proxy.ts`**, and every page and API route — `/api/v1/paseome/frontier` included — sits behind the beta gate, so a local check needs `GUEST_LOGINS` set and a sign-in at `/beta`. Webpack dev takes 20–90 s per page compile on this machine; a chunk request that arrives mid-compile times out (`ChunkLoadError`) and is not a code fault. **Check a page or a lazy chunk on a production build instead:** `next build --webpack` (~4 min here), `mkdir -p .next/standalone/.next && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/` (`-p` matters: the standalone build already creates `.next/standalone/.next`, so a plain `mkdir` fails and the `&&` skips both copies), then from `.next/standalone` run `PORT=… HOSTNAME=127.0.0.1 GUEST_LOGINS=… CAPTURE_ALLOWED_USERS=… node server.js`. A hidden in-app Browser pane runs no `requestAnimationFrame` or IntersectionObserver, so WebGL and lazy-mount checks cannot be done there — drive headless Edge over DevTools (`verify/scripts/paseome-graph-smoke.mjs` is a worked example). `npx tsc` once answered *"This is not the tsc command you are looking for"*; `./node_modules/.bin/tsc --noEmit` works. |

### Not as blocked as this table has been saying (corrected 2026-08-26)

"No `npm install`, no local typecheck" was half right and cost a lot of
verification that was available all along. `npm install` is genuinely dead. The
rest is not:

| Actually available | Where | What it buys |
|---|---|---|
| `tsc` | `/opt/node22/bin/tsc` (global, no `node_modules` needed) | Real **parse / syntax / JSX-nesting / arity / iteration-target** checking — see the exact invocation below. Filter out `TS2307` (unresolved module), `TS70xx` (implicit any) and `TS18046/TS2571` (unknown): those are artefacts of missing `@types`. **Anything left is a real error.** |

**Use the project's own compiler settings, or the check is worse than useless.**
`tsconfig.json` targets **`es5`** with no `downlevelIteration`. A first attempt at
this ran `--target es2022`, passed 333 files clean, and shipped a route that
failed Vercel's type-check immediately on `for (const [k, a] of someMap)` —
`TS2802`. At `es5`, `for...of` and spread over a **Map, Set or any iterator** are
compile errors; arrays and strings are the only things TypeScript
special-cases. Use `.forEach()`.

The global `tsc` is a 7.x build, which **hard-errors on `target=es5`**
(`TS5107`) unless `--ignoreDeprecations 6.0` is passed — and it errors *before
type-checking*, so the run prints nothing and looks clean. That is this repo's
signature trap: a green gate that scanned nothing. Always prove the invocation
can still fail by compiling a two-line probe with a `for...of` over a `Map`
first; if it does not report `TS2802`, the real run means nothing.

```sh
tsc --ignoreConfig --noEmit --skipLibCheck --strict --ignoreDeprecations 6.0 \
    --jsx react-jsx --target es5 --lib dom,dom.iterable,esnext \
    --module esnext --moduleResolution bundler \
    $(find app components lib hooks context -name '*.ts' -o -name '*.tsx' | grep -v '\.test\.ts')
```

Next's build bails at the FIRST type error, so CI shows one; this shows all of
them. The same route had three.
| `eslint` 10 | global | Not wired up — no flat config resolves without `eslint-config-next`. Noted so the next session does not re-discover the binary and assume it is usable. |
| Chromium + `http-server` | `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, global `http-server` | **Components can be rendered and looked at locally.** See §7 for the recipe. |

The npm-registry block never implied a rendering block; the two were merged into
one sentence and the second half was never tested.

**And on 2026-10-27 the npm registry itself was reachable.** `npm ci` completed in ~31 s in
`verify/`, and `tsc --noEmit`, `vitest run` (450/450), `next build` and a Playwright smoke test
all ran locally against the real lockfile. Egress policy varies by session, so test with one
`npm ci` before assuming either state — and still never hand-edit `package-lock.json`.

---

## 7 · Things a future session will get wrong without this

- **Never build in or deploy from a clone of the storage repo — added 2026-11-03.** A session can open in the local `MADGambit MMP` folder, a clone of the private `MADGambit-Official-MMP`. Production ran `955f8f7` after a hand deploy from that folder, and PRs and uncommitted work piled up there (TD18). Work in `MAD-MPP-2.23` instead. That repo is **public**, so check private material before pushing it. After each production promote, fast-forward the storage repo's `main` to the production commit.
- **A CLI production deploy can land STAGED and never go live — found 2026-11-03.** `vercel deploy --prod` built `44312bf` READY, with `target: production` and the project's production target pointing at it, yet `readySubstate: STAGED` and `aliasAssigned: false`: `madgambit.fun` stayed on the 2026-11-02 03:26 build, as it had through two earlier "redeploys". Confirm with `/v4/aliases?projectId=…` or by requesting a route only the new build has; `vercel promote <dpl_id>` makes it live in seconds. In the same check: `lib/bot-guard.ts` `PROBE_WORDS` must never hold a first path segment the app serves (bare `admin` 404'd the whole admin suite), and every `vercel.json` cron must be in `proxy.ts` `BEARER_PATHS` (`lib/cron-bearer-paths.test.ts` now enforces it). It happened again on the very next deploy (`59186f0`), so treat promotion as part of every CLI production deploy. `lib/probe-routes.test.ts` walks every page, API route and public file and fails CI if any of them looks like a probe. **Lint locally with `npm run lint`:** it loads `scripts/eslint-ts6-shim.cjs` so `typescript-eslint` 8 accepts TypeScript 7; a bare `npx eslint` refuses TS 7 and looks like a broken toolchain when it is not. CI's lint step is `continue-on-error`, so a green Verify says nothing about lint; read the step's summary line.
- **Pitch decks drift; `lib/pitch-canon.test.ts` is the check — added 2026-10-27.** The founder's own copy of the 13-sections brief carried two arithmetic errors the engine does not make: MAD Tier at *68.6%* effective (it is 38.8% × 2 = **77.6%**) and a fee table whose Community column read "28%" in every row (it is **54.14 / 38.55 / 32.49 / 21.66** per 10,000). Every worked number in that brief is now pinned by a test. Change a slide, run the test.
- **Do not merge the out-of-date branches — audited 2026-10-27.** 44 branches have commits `main` lacks. Excluding the six kept in §3, file by file: 335 of the 503 files they touch are byte-identical to `main`; 120 were changed on `main` **after** the branch's last commit; the remaining 48 exist only on the branch and are retired plan/handoff docs, `.vercel/repo.json`, a `pnpm-lock.yaml`, a `.vade-report`, the retired Neon workflows, the redirected `/gambit` page, or a 3-line card-states stub. **Zero files are newer on a branch than on `main`.** These are superseded code, not lost features. Checked one by one: the open-pack fairness fix landed in a stronger form (persisted counter inside the paid transaction); `contracts/script/Deploy.s.sol` on `main` is a superset (adds the oracle and dispute voting); the July `satire-headline.ts` predates `main`'s September rewrite; `/gambit` is redirected to `/mpp2.23`, which mounts every component it had; the Dutch-auction rail, celebration sounds and Speed Insights all exist; and the `The-MDC` branch's CodeQL workflow would **conflict** with the CodeQL default setup already configured on the repo (actions, JS/TS, Python). Also: `claude/clever-wright-u59drb` shares no history with `main` (pre-rewrite orphan), the v0 container contract (`.mg-container`) is opt-in CSS nothing uses, and the NFT card system v2 lives in a root `src/` outside the app. The docs-only branches carry dated handoff/plan files, which the one-planning-document rule forbids.
- **The bot guard will block your QA unless you look like a person — added 2026-10-27.** `proxy.ts` returns 403 to curl, python-requests, headless Chrome and anything crawler-shaped *without a guest pass*; signed-in guests are never UA-blocked. So use `curl -u user:pass`, and in Playwright set a normal Chrome `userAgent` and launch with `--disable-blink-features=AutomationControlled` — otherwise `navigator.webdriver` is true and the capture guard puts an opaque veil over the page. `/robots.txt`, `/api/health`, `/health` and `/api/v1/health/db` stay open to everyone.
- **The capture guard veils automated browsers, and a veil swallows taps — found 2026-11-04.** `components/capture-guard.tsx` puts an opaque veil over any browser reporting `navigator.webdriver` (production builds only; development is exempt). A headless smoke test then "works" until the first tap, which lands on `.mg-capture-veil-card`. Do not script around it: run against a dev server, a build with `NEXT_PUBLIC_CAPTURE_GUARD=off`, or a server started with `CAPTURE_ALLOWED_USERS=<the guest you sign in as>` (the proxy sets `mg_cap=1`). `paseome-graph-smoke.mjs` detects the veil and exits 2 rather than bypass it.
- **The sale's ETH goal is nowhere in the repo, and the only rate is a code comment — found 2026-11-09.** `contracts/madhat-core/src/tokens/MADxToken.sol` says `Rate: 25,267 MADx per ETH` (imported 2026-07-21 from `demo-repository`; unsourced). On-chain (Arbitrum One, `0x6972…151f`, read 2026-11-09 via Blockscout): `maxTotalSupply` = 224,573,096 tokens, `totalSupply` = 0, and the token has no rate or raise fields — the sale logic is Crystex's. 224,573,096 ÷ 25,267 is **exactly 8,888**, which reproduces the cap as 8,888 ETH × 25,267 but is derived from the cap, not an independent source. The founder's 2026-11-09 answer (270 million purchasable, confirmed) needs 10,685.87 ETH at that rate and exceeds the cap by 45.4M. Do not multiply a guessed ETH figure: the campaign's ETH goal and rate have to come from the founder. ‹verify›
- **Production deploys need the founder's explicit go-ahead — 2026-10-27.** In auto mode the permission classifier denied a production deploy of new code until the founder said so in so many words. Deploy previews freely; promote only on an explicit "deploy to production". The Vercel MCP returned 403 for this team; the REST API (`POST /v13/deployments` with `gitSource`, then `POST /v10/projects/{id}/promote/{deploymentId}`) worked. `gh` works over REST only (GraphQL 403), so open PRs with `gh api repos/…/pulls --method POST`.

- **Never quote a 60% MAD Shield figure.** The Shield is a 28.8% → 40% scale (founder, 2026-10-23); 60% is the creator-side VIP seat only. The engine's `SHIELD_RECOVERY_WHALE_PCT = 0.60` is engine-only until removed — reading the constant and calling it canon is how this branch got it wrong once already.
- **Presentations do not live in this repo.** Decks, data rooms, the Maths Engine Room page, collateral and brand art belong in `MADdegen/MADGambit-Presentation-Engine` (served at madgambit.io behind its guest login; `collateral/` and `brand/` are excluded from the deploy). The one exception is `verify/public/pitch/` — `components/main-nav.tsx` and `components/whitepaper-sheet.tsx` link to `/pitch/index.html`, so moving it means repointing those links first. Founder, 2026-10-26: *"leave mad-mpp-2.23 with just the MPP."*
- **The Golden Ticket's 188K test is per market, never combined.** Three markets that **each** reach 188K volume — not 188K across three. The founder corrected exactly this misreading on 2026-10-23. And competitor volume figures are notional, counted on both sides of a trade; do not compare them with a MAD Gambit threshold until §3 says which volume it means.
- **CI tests the MERGE RESULT of a PR with `main`, not the PR head.** A test count in CI can include files that are not in your branch. On PR #145 the prediction was 379 and CI reported 389: `main` had gained `registrar-auth.test.ts` (6 tests) since the branch was cut. Reconcile a count against `main`, not against your tree, before calling it wrong.

- **`frontierPrices` uses log-sum-exp on purpose — do not "simplify" it back to `calculateDLLMSRPrice`.** The naive softmax overflows to `Infinity` past `q/b ≈ 709` (~851k shares at b=1200) and every price comes back `NaN`. Reproduced before the fix; regression-tested at 900k and 5M shares. The shared `calculateDLLMSRPrice` is deliberately left naive because it is canon-locked and serves the binary book, where `q` stays far lower.

- **"MAD Upshot" is the project's old name; it is now MAD Gambit (founder, 2026-10-23).** Do not blind-replace it: several occurrences are lineage phrasings (*"MAD Upshot to MADHAT's Gambit CardGame"*) where a mechanical swap produces nonsense, and MASTER itself quotes it in places as the banned term. Edit each in context. See §5.

- **A local test harness exists and has bitten its own author.** `lib/` transpiles to CJS and runs under a minimal vitest shim (~340 of ~390 tests run without `node_modules`). It once under-reported two passing tests because the shim lacked `.rejects`/`.resolves`, and a mutation check compared against zero instead of the baseline's own failures. When using it: compare against a baseline, and confirm a mutation actually applied before trusting "survived".

- **"The engine" is three engines, and only one of them is the leaky one — added 2026-10-23.**
  A session told to "unify everything into one engine" will reach for
  `verify/lib/gambit-game-math.ts` and find nothing to do, because the **maths** engine is
  already single with ~75 consumers, and the **satire one-liner** engine
  (`lib/satire-headline.ts#satirizeHeadline`) is already single and already called from the
  perp family route. The engine that is actually fragmented is the **$MADx ledger**
  (`lib/madx-web2.ts`, **9 importers**). Measure importers before concluding anything here;
  the fix is PART 0 §5 **T1**, and the reference implementation to copy is
  `market-book.ts#fill()`, not a new abstraction.
- **The `$MADx` token address is confirmed — 2026-10-26.** The founder confirmed
  `0x6972370e1caAA3624F37D7e87C28e1089D00151f` as the real `$MADx` (Arbitrum One). `0xb61ae772…fd18` is ORKx, a different ERC-20,
  and must not be cited as `$MADx` anywhere. This supersedes the 2026-10-23 note that said not
  to touch the address until one was confirmed. Blockscout shows the confirmed contract as
  verified, creator `0x4975…0149`, contract name `MyToken`, with no token record indexed, so a
  symbol/name check against Blockscout will not return MADx — do not take that as a mismatch.
  Blockscout needs a PRO API key for more than ~10 calls per session.
- **`app.crystex.app` is egress-blocked — added 2026-10-23.** The fair-launch campaign page is
  the founder's stated source for the real total supply, and no agent can open it: the proxy
  returns `EGRESS_BLOCKED`, not a 404, so retrying or rewording the URL will not help. Ask for
  the number; do not infer it from the 224,573,096 cap in the code, which is a *cap*, not a
  total supply, and is owner-modifiable. **Answered 2026-11-09:** the founder gave the numbers in
  chat — total supply 888,888,888, with 270 million purchasable in the sale (§3).
- **`satireMetrics().brandSafe` was never a safety gate — corrected 2026-08-27.** It computed
  `zLiarScore >= 60 && sentiment.intensity >= 0.3`, and Z-Liar ≥ 60 is SERIAL EMBELLISHER or
  TOTAL FABRICATION. So it **passed wild fabrications and failed measured, credible lines**: a
  juiciness bar wearing a safety bar's name, consumed by `app/api/satire-engine/route.ts` as
  `brand_safe` and described there as "fails closed". It did not. The maths is now
  `entertainmentGrade` (unchanged, legitimate, high-is-good); `assertionRisk` /
  `lowAssertionRisk` are the actual safety signals and **fail closed** on an empty or
  unscoreable line. `brandSafe` survives as a deprecated alias so no caller silently flipped
  meaning. **Do not "fix" the alias by pointing it at the safety signal** — that would invert
  the value under every existing caller.

- **The local-model roast tier cannot work on Vercel, and that is not a bug.** Ollama listens on
  the machine that started it; a Vercel serverless function cannot reach a desktop. With
  `OLLAMA_BASE_URL`/`OLLAMA_MODEL` unset the tier is simply off and the route degrades to the
  deterministic writer exactly as before. It is for local development and for a self-hosted
  deployment where the model sits beside the app. `lib/local-satire.ts` calls Ollama's HTTP API
  over plain `fetch` **on purpose** — `@langchain/community` ships a ChatOllama, but a new
  dependency means regenerating `package-lock.json`, which cannot be done here and breaks
  `npm ci` on every job.

- **`satirizeHeadline` must stay pure and deterministic — a model may never be called inside it.**
  It renders on the server and again on the client, so any divergence is a React hydration
  error. That is why the model tiers live behind route handlers and are fetched. This is stated
  in the file's own header and is easy to undo by accident.

- **`propagateTree` does not check that a node's edges sum to 1.** It computes whatever weighted
  sum it is handed, and its one caller — `app/api/v1/bayesian/tree/route.ts` — takes the tree
  from a **request body**, so a node totalling 0.8 returned a confident, meaningless number.
  `treeConservationError` now validates it at that boundary (2026-08-27). Paseome frontiers are
  conserved by construction instead, because DL-LMSR prices sum to 1 — keep it that way rather
  than adding a normalisation step later.

- **`octavian-mesh.tsx` does not exist.** Merged into `octavian-creature.tsx` (`compact`/`full` variants). Zoom, two-axis orbit, click-select, pop-out, mood system, shared state and the firefly swarm **all already ship** — don't rebuild them.

- **You can render a canvas component and LOOK at it. Do that before claiming it is fine.** `octavian-creature.tsx` was merged three times without anyone seeing it, and was drawing its node badges at 20px on the phone panel and **48px** in the pop-out, on ~20 nodes at once — the creature was behind a wall of its own grey labels, and no amount of reading the source made that obvious. The recipe, ~5 minutes end to end:

  1. `tsc --ignoreConfig --outDir <scratch> --target es2022 --module esnext --moduleResolution bundler --skipLibCheck lib/<deps>.ts` — emits JS even with type errors, so missing `@types` do not stop it.
  2. A harness `.html` with `<script type="importmap">` mapping `@/lib/x` → `./x.js`, importing the **real** transpiled modules. Copy only the `draw()` body from the component; never re-implement the maths, or you are reviewing a different creature.
  3. Serve it: `npx http-server -p 8899 <scratch>`. **This step is not optional** — Chromium refuses ES-module imports over `file://` (CORS), and the symptom is a silent blank page, not an error.
  4. `chrome --headless=new --no-sandbox --disable-gpu --no-proxy-server --virtual-time-budget=5000 --window-size=W,H --screenshot=out.png http://127.0.0.1:8899/harness.html`
  5. Read the PNG. Draw a 1px frame at the true canvas bounds and print a measured envelope figure per case, so the answer is a number and not an impression.

  `--no-proxy-server` matters: the agent proxy 403s `madgambit.io`, so **the live app cannot be screenshotted** — only locally-served harnesses. Do not go looking for a way around that again.

- **The repo's default branch is `The-MDC`, not `main`, and that quietly disables `.github/dependabot.yml`.** Dependabot reads its config from the default branch, so the `actions/checkout` v4 hold reasoned out on `main` is **not in force** — `The-MDC`'s copy has no `ignore` block. It also opens PRs against the default branch, which is why `The-MDC` carries a bump `main` has never seen (eslint 8→10, typescript 5→7, siwe 2→3, framer-motion 12→13) sitting on a tree that predates main's SIWE and market-book work. **Do not port that `package.json` to `main`**: the lockfile cannot be regenerated here and `npm ci` fails when the two disagree. Fix is one repo setting — Settings → General → Default branch → `main` — and only the founder can make it.
- **The build no longer runs migrations.** `next build` only; migrations are a controlled `npm run migrate:deploy`. Don't set `SKIP_MIGRATIONS` on Vercel.
- **The `$MADx` transfer vulnerability is FIXED.** A stale-tree review reported it open; all seven `madx` routes use `lib/madx-route-auth.ts`. **Do not re-fix it.**
- **The `.agents/` swarm verdicts are static-only.** All four 2026-07-01 milestones returned CLEAN, but every shell command in that run timed out — nothing was ever executed.
- **Placeholder stubs — do not restore:** `lib/auth/siwe.ts`, `app/api/session-keys/*`, `SessionKeyManager.tsx`, root `middleware.ts`. Do **not** re-add `ai-backend/.../auth.py` — it forks a second auth path.
- **Next 16 renamed `middleware.ts` → `proxy.ts`.**
- **Creator Ladder (28.8/40/60% by status) is canon**, not the flat 40% — founder sign-off 31 Jul 2026, recorded in `verify/lib/node-registry.ts`, implemented as `CREATOR_LADDER`.
- **Octavian's origin is Google AI Studio lineage, not Vercel v0.** Zero v0 fingerprints anywhere; three `metadata.json` files carry the AI Studio app-builder schema. Unverified only because v0 chats and `The-MDC/v0-open-in-v0-023b047d` were unreachable — to close it, start a session with that repo as the initial source and diff against `octavian-creature.tsx`.
- **Compliance:** the mechanics stay, the clinical neuroscience framing stays out of anything user- or investor-facing. Internal docs may name them plainly; decks and marketing may not.
- **Bulk env-var export is `vercel env pull`, not a browser extension.** Evaluated
  `tushgaurav/vercel-env-variables` (Chrome MV3) and rejected it. It reads the raw Vercel session
  cookie and calls undocumented internals (`vercel.com/api/v9/projects/{name}`, then
  `/api/v1/projects/{name}/env/{id}` per var) rather than the public `api.vercel.com`. Its
  `background.js` returns that session token from a `chrome.runtime.onMessage` listener with no
  sender or message validation, and `console.log`s the cookie on startup. Use
  `vercel env pull .env.local` and `vercel env ls` — supported, CI-safe, and `env ls` also shows
  which environment each var belongs to. See the `vercel-system-env-and-cli` skill.
- **Env-var confusion is usually provenance, not value.** `DATABASE_URL` is injected by the
  **Vercel Marketplace Neon integration**, which provisions the database inside a *Vercel-managed*
  Neon account — so the personal Neon API/MCP credentials list **zero projects** even though
  production connects fine and all migrations are applied. Typing the var by hand reports "already
  connected" for the same reason. Do not conclude from an empty Neon project list, or from
  demo-fallback code paths, that the database is unconfigured: read the build log, which prints
  `connected to Postgres` and the migration ledger on every deploy.
- **Morpho / Aerodrome:** no such repos. Morpho returned zero across ~190; the Aerodrome lookup needed approval and never ran.
- **The repo now lives at `The-MDC/MAD-MPP-2.23`** (transferred by 2026-08-22; it was
  `MADdegen/`). The old remote still works by redirect, and agent sessions may still be *scoped*
  to `maddegen/mad-mpp-2.23` — so GitHub tool calls should use owner `MADdegen` while PR links
  resolve to `The-MDC`. **Worth retrying `The-MDC/mad-gambit-ui`** now: it was blocked as a
  cross-tier add, and the transfer may have removed that barrier. It may simply *be* the
  phone-frame UI, which would make most of Workstream C4 redundant.
- **Two Part II facts went stale within a week — reconcile before trusting them.** PR #108
  collapsed CI to one job, path-filtered `placeholder-guard.yml`, and downgraded
  `actions/checkout` **v6 → v4** (Part II.4 still says v6). PR #131 **re-enabled production
  deploys from `main`**, contradicting Part II.3's *"`main` does not auto-deploy"*. Both landed
  while CI was not running, so neither was gate-checked.
- **Session close-outs live at `docs/THREAD_CLOSEOUT.md`** — one file, overwritten each time.
  Read it at the start of a session for where the last one stopped; write it at the end via the
  `close-thread` skill (fail-safe instructions in `CLAUDE.md`). Durable content still belongs
  here in MASTER, not there. **Sessions that close in parallel share that one file** — the second
  to close carries the first's open items forward into it. On 2026-10-23 two threads each wrote a
  close-out (the second as a topic-suffixed sibling, `THREAD_CLOSEOUT_<topic>.md`); folding the two
  back into one, and correcting what had gone stale in each, is the work a sibling file costs.
- **`master-maths/` is the second client, not an abandoned experiment.** Three independent lines of
  evidence: `verify/lib/gambit-game-math.ts` *names its own origin in its header* as a port of v1.7
  Kotlin `GambitMath.kt` (`com.example.math`) — both carry `calculateConviction`,
  `calculateDeltaLimit`, `calculateShieldPayout`, `getLunarPhaseMultiplier`,
  `calculateDLLMSRCost`, `garchUpdate`. The palettes are **byte-identical** (`0xFFFFD700` /
  `0xFFB8860B` are `gold: "#ffd700"` / `goldDim: "#b8860b"`). And the Compose screens map 1:1 —
  `KaitoTerminalScreen` → the KAITO bar, `MadShieldScreen` → MAD Shield, `AuctionScreen` → the
  ZEITGEIST slot auction, `PersonaSettingsScreen` → FIVE FACES, `DataHouseScreen` → the datahouse
  fold, `AuthScreen` → LOGIN/SIGN UP. **The gap is narrow:** the Compose `api/` package is two
  files (Gemini + RSS) and has no backend of its own. Workstream C above.
- **`master-maths/` is nested, and must stay nested.** Both trees defined `app/` — the Android
  module sat exactly on `app/page.tsx`. That collision is *why* commit `8c7a195` superficially read
  as a replacement rather than a deletion. Nesting removes it permanently: `settings.gradle.kts`
  resolves `include(":app")` relative to itself, so the Gradle build is unaffected. Do not hoist it
  back to the root. (`rootProject.name` was the Android Studio default `"My Application"`; now
  `"Master Maths"`.)
- **`--exclude-detectors=lob` in `secret-scan.yml` is a detector collision, not a suppressed
  finding.** TruffleHog's Lob detector matches `(live|test)_[a-zA-Z0-9]{35}`; Foundry's convention
  produces exactly that shape — `function test_DestroyedSubjectCanNeverBeReRegistered()` is `test_`
  + 38 alphanumerics. It reported five "verified secrets" on the restore PR because that was the
  **first scan ever to see those files** (the scan is diff-scoped, and they predate the gate).
  Lob is a vendor this repo has no dependency on, so it cannot produce a true positive. Every other
  detector stays live. Do not "fix" this by renaming test functions.
- **Nothing is removed from a route without the founder's explicit go-ahead — added 2026-11-09,
  from the 2026-10-23 engine-room close-out.** The founder's words: *"i never gave permissions of
  any kind for you to remove anything."* PART 0 §5 T1 applies the same rule to the ledger routes:
  fix what a route does, never delete or relabel the route itself.

---

## PART I — CHRONOLOGY

Lightly detailed. Dates are from document headers or git history, not inferred.

### 2024 — origins (fully superseded)
- **2024-09-30** — Founding MDC/MADdegens whitepaper. Solana, 6,666 "Megalomaniac" NFTs. Later migrated CrossFi → EVM.
- **2024-11-23** — Original brand guidelines (Crimson/Jet Black/Metallic Gold, "MAD Upshot"). Superseded.
- **2024-11** — $MADx v1.0 concept: 1,000,000,000 supply, ERC-1155, Base L2, 2–5% fee. All four values later changed.

### 2025–early 2026 — the plan that didn't ship
- **2025-12-09** — Strategic investor offer: $2.4M–$3M seed ask.
- **2026-01-20** — "Version 3.0 FINAL" spec trio (game spec, tokenomics, NFT design): flat 40% community model, "TeaBag" 60% loss protection, Base L2. Entirely superseded.
- **2026-01-26** — Claude Code Master Implementation Guide v5.0: Prisma + NestJS + Privy. Never built.
- **2026-01/02** — Tokenomics v1.5: renamed MAD Gambit, moved to Arbitrum, fixed 888,888,888 supply, fee 2.88%, shield 40%.
- **2026-02** — Whitepaper v1.8: fee raised to 4.88%, shield 40–60%.
- **2026-02-26** — VC stress-test ("Shooting Holes in My Thesis"): 4 reviews, 3 PASS / 1 FAIL.

### 2026-03 — the numbers get locked
- **2026-03-05** — Founder's Golden Ticket supply corrected 888 → 2,488.
- **2026-03-19** — Kalshi raises $1B at $22B valuation; cited throughout as urgency driver.
- **2026-03-20** — **Canonical numbers locked**: 1.88% fee, 28.8% community/Shield, 40% creator share, 888,888,888 fixed supply, $1M–$2M seed at $12M pre. Pitch deck v1.2 (18 slides) + Hi-Fi PAD2. A ~17-document data-integrity audit lands the same day.
- **2026-03-22** — GitHub capabilities audit: 91 repos inventoried across The-MDC + MADdegen. Mostly unbuilt wishlist.
- **2026-03-25** — MAD Gambit LLC filed (New Mexico).

### 2026-04/06 — consolidation and a dead end
- **2026-04-05** — `CANONICAL_NUMBERS.md` last updated — still the numeric source of truth today.
- **2026-06** — Android/Kotlin (Jetpack Compose) client era, ~70 Compose files, no WebView. **Dormant, not abandoned** — corrected 2026-08-18. It survives as `master-maths/` and is a genuine second client of this product: the web maths is a *port of its* `GambitMath.kt`, the palettes are byte-identical, and its screens map 1:1 onto the shipped web features. Evidence and remaining work in Part 0 §7 and Workstream C.

### 2026-07 — the current app takes shape
- **2026-07-01** — Multi-agent swarm run (`.agents/`): 4 milestones — SIWE auth, `MADShieldVault.sol` + Foundry tests, concierge wiring, local Gemma endpoint. All returned CLEAN verdicts. **Caveat: every shell command in that run timed out on permission prompts, so all four were _statically reviewed, never executed_.** Treat the verdicts accordingly.
- **2026-07-05** — Vercel production found 3 commits stale hours before an Outlier Ventures demo. Fixed.
- **2026-07-10** — Chain choice locked: Arbitrum Nova (gameplay) + Arbitrum One (Shield vaults, $MADx).
- **2026-07-11** — PR #6 (NFT card art), PR #7 (ultra dashboard) merged.
- **2026-07-13** — Seed ask signed off $1.24M–$2.48M @ $12M pre. Grok falsely claimed `MADStaking.sol` complete; it wasn't yet.
- **2026-07-15** — **Main-overwrite incident**: `main` briefly replaced with ~48 placeholder files, recovered from another branch. This is the origin of the `placeholder-guard.yml` CI gate.
- **2026-07-21→25** — PRs #20–#30: `MADStaking.sol` and `MADMarketFactory.sol` actually ship. Theme routing splits into `/preview` and `/mpp2.23`. Guest Basic-auth gate added.
- **2026-07-24** — Dopamine hub ships at `/preview` (PR #23), 73 vitest tests. On-chain $MADx found deployed with a **mutable, mint-on-purchase** supply — conflicts with the fixed-888,888,888 canon. Still unreconciled (see Part II §9).
- **2026-07-25/26** — `MASTER_MATHS_AND_ALGORITHMS.md` consolidated (Shield/Vulkan/GARCH docs reduced to redirect stubs). CI gates added; `SECURITY.md` + `SECURITY_LAYERS.md` written.

### 2026-08 — reconciliation, near-disaster, and the current line
- **2026-08-05** — **ADR-008 accepted**: `pg` Pool + Route Handlers settled as the only data pattern; `@neondatabase/serverless` explicitly rejected. Marked *"Settled. Do not reopen."* Five Faces + Zeitgeist product sheets finalized.
- **2026-08-06** — Perp families ship (PRs #57→#60): Five Faces, Zeitgeist, Perpetual Epiphanies, `MADPortrait`/`MADPortraitKeyRegistry`, slot auction.
- **2026-08-07** — Commit `8c7a195` ("standardize AI persona and configure Gemini") **accidentally deletes `verify/`, `contracts/`, and all CI** — 307,305 deletions.
- **2026-08-09** — PR #66 restores the app.
- **2026-08-10** — Neon database hits free-tier quota ceiling; compute suspended. Data intact.
- **2026-08-11** — Audit finds prod serving a stale commit, prod DB schema-less, `NEON_PROJECT_ID` a literal placeholder.
- **2026-08-12** — PR #72: full-stack reconciliation + new Vercel project standup (`VERCEL_PROJECT_SETUP.md`). Same day: #73 (manual prod deploys), #74 (dark theme + Blob portraits), #75 (SafeERC20, 3 open routes closed), #76 (ERC-2771 gasless relayer), #77 (`MADDisputeVoting.sol`).
- **2026-08-13** — O-V Conviction State Node HUD shipped.
- **2026-08-14** — The Octavian visual becomes a *living* mesh. Lineage: a 2026-07-13 Three.js/R3F/WebGPU "Master Octavian" experiment (Vulkan-derived pipeline notes, shader + bundle optimization) → the 2D-canvas `octavian-mesh.tsx` shipped 2026-08-07 in PR #63 → `72dccda` static high-fidelity orb → `fb73122` two-axis weave → **`11b8a6f` the living-mesh moment**: a three-tier pointer-driven mood system (idle cool topaz/emerald/cyan → agitated yellow/green/blue → yellow/orange/red, fastest spin, pitch tipping away as if not wanting to be bothered), decaying back to idle on its own. The palette layering is explicitly modelled on **cephalopod chromatophore-over-iridophore skin** — cool/structural at rest, pigment-dominant when agitated — not an arbitrary colour pick. `bb99269` then merged both visuals into one engine. Note: no trace of this originates in the O-V deck repo; it is native to this codebase.
- **2026-08-14** — PR #80 merged (O-V HUD + removal of stale docs describing a rejected data layer). Neon project split resolved to a concrete cause: **three** live Postgres databases under one integration, needing a founder-run merge (Part II.5). Migrations removed from the Vercel build in favour of a controlled `migrate:deploy`; `main` auto-deploy disabled; two advisory AI review gates added via gh-aw.
- **2026-08-16** — This consolidation; frontend QOL benchmark and Chainlink VRF audit (Parts III–V). Later the same day: PR #91 merged (Octavian cephalopod creature + CI fixes), then the session handoff, the maths master, the engine-room formulas and the deck lineage were all folded in here as PART 0, Parts VI–VII and Appendix A — leaving this as the single planning document.
- **2026-08-18** — Restore/convergence handoff folded in rather than filed beside this document (§7, Workstream C, the 2026-06 correction). Three stale facts fixed: the migration count (14 → **15**, so the Neon merge is `0016`, not `0015`), the Kotlin client's status ("abandoned" → dormant second client), and the absence of any CI gate over `master-maths/`. **Part VIII added** — the hosting-platform audit, whose finding is that Vercel coupling is one 44-line file, one import and three cron entries. **Same day, decided: stay on Vercel + Neon.** The audit established optionality, not a verdict — it never found a reason to leave, and hosting cannot be migrated while Actions is refusing to run jobs. Part VIII becomes a contingency plan with named reopen triggers.
- **2026-08-22** — PR #105 merged (`2d53a7d`). Repo transferred to **`The-MDC/MAD-MPP-2.23`**. PRs #108 (CI collapsed to one job, guard path-filtered, `checkout` v6→v4) and #131 (production deploys re-enabled from `main`) also land — **all three merged with CI not running**.
- **2026-08-24** — Close-out mechanism added: the `close-thread` skill plus `CLAUDE.md` as an independent fail-safe, writing to `docs/THREAD_CLOSEOUT.md`. **Actions recovered the same afternoon (~16:18 UTC)** after eight days down, leaving three ungated merges and a set of permanently-`queued` orphan runs behind it. `workflow_dispatch` added to `placeholder-guard.yml`, because #108's path filters meant the pathspec fix from #105 could not be exercised by any docs-only change — it was merged to `main` and had still never run. **That edit touched the workflow file, which is itself in the path filter, so the guard triggered and validated its own fix: `Placeholder guard passed ✓`, run 32750369469. The pragma check executed for the first time in the repo's history.**
- **2026-08-26/27** — The engine gets a real book. **PR #139 merged**: `verify/sql/0016_market_book.sql` (`market_book`, `market_prices`, `ALTER TABLE bets` + shares/cost/fee/price_after), `verify/lib/lmsr-book.ts` (pure and isomorphic — the same `quote()` runs in the client preview and the server fill), `verify/lib/market-book.ts` (the `pg` layer; `fill()` is one transaction: `SELECT … FOR UPDATE` → re-price against the locked row → `spendWithin` → book → `bets` → `market_prices` → write back `markets.yes_odds/no_odds`), `spendWithin` added to `madx-web2.ts` so a debit can join a caller's transaction, real SIWE sign-in (`lib/siwe-client.ts`, `auth/session`, `auth/logout`), and `game-context.tsx` switched from `useState(8888)` to the real ledger behind a `creditsSource: "live"|"demo"` flag. **PR #143 merged** (`18216a0`): the Z-Liar Sentinel becomes a real Gemini call with the persona extracted to `lib/madhatr-persona.ts`, the money path starts honouring `PAUSE_GUARDIAN`, `TRADEABLE_FAMILIES` becomes one exported source of truth, and complaint resolution moves off "any signed-in wallet" onto a fail-closed registrar credential. **PR #152 merged**: every agent persona consolidated under MAD-Gambit-Concierge.
- **2026-08-26 → 08-28** — PRs #142–#145. Perp deck made interactive; Z-Liar band ladder and Scandal readout de-drifted onto the engine; `brandSafe` found to be a juiciness gate wearing a safety gate's name and split into `entertainmentGrade` / `assertionRisk`; a local-model (Ollama) roast tier added with zero new dependencies; **the Paseome** (perp families 7 Foresight & 8 Hindsight) designed, researched and shipped as maths + a live frontier route; a mutation audit found eleven unguarded canon constants and closed them; and the **fee waterfall corrected on founder sign-off** — community 28.8% is of NET, not gross.
- **2026-10-23** — Founder confirms "MAD Upshot" is the project's old name (now MAD Gambit) and names the Paseome's thesis **"Certain-UnCertainty"**. Rename scoped (§5), not yet applied. Same day, the creator profit share is settled: **creators 28.8% → 40%; 60% is a VIP share limited to 4,888 seats.** The 28.8% base rung is confirmed correct; the code's uncapped traction route to 60% now diverges from canon (§3, §5).
- **2026-10-23** — `0xb61ae772…fd18` read on-chain and **eliminated as `$MADx`** — it is "Serpentine Orkain"/ORKx (§3, PART II §9). The Crystex campaign page, the founder's stated source for the real total supply, is **egress-blocked** from the agent container. The "one engine" requirement gets a measurement rather than an opinion: maths is single (`gambit-game-math.ts`, ~75 consumers), the satire one-liner engine is single and already reaches the perp family route, and **the $MADx ledger is not** — `perps/convict`, `faces/stake`, `zeitgeist/auction` and `shield/opt-in` all move or promise value without touching it. Now PART 0 §5 item **T1**.
- **2026-10-23 (later)** — Paseome authorship and name settled: an **open conviction market** that creators author, with the platform offering a smaller share of trees and no creator cut (`paseomeFeeSplit`); official name **"The Paseome: Certain-UnCertainty"**, Foresight/Hindsight demoted to internal labels. **MAD Shield confirmed as a 28.8% → 40% scale** — this branch's earlier "deliberate 28.8/40/60 parallel" note was wrong and is corrected; the engine's 60% Shield rung is queued for removal pending confirmation. Gossip-Cop v1.2 and Perpetual Epiphanies v1.1 sheets added to `docs/` from Drive; the Paseome artifact (v1.2) republished and copied to `docs/product-sheets/PASEOME_ARTIFACT.html`. PART VI caught up with the code: the six-tier staking table (stale since 31 Jul) replaced by the eights ladder; creator ladder, VIP seat cap, community-of-net and a §2b for the Paseome's maths added. Engine: `VIP_PROFIT_SHARE_SEATS` (4,888) / `VIP_PROFIT_SHARE_BPS` / `vipSeatAvailable` pinned, not yet enforced.
- **2026-10-26** — Golden Ticket decisions (founder, 2026-10-23) recorded: supply **4,888** = the VIP seat pool, minimum conversion **2,888**, three markets **each** ≥ 188K to qualify, creator scale's middle steps still being set (§3, §5, PART VI §13 item 9). The madgambit.io **Maths Engine Room** (`MADdegen/MADGambit-Presentation-Engine` → `maths-engine-room.html`, plus its identical duplicate) brought to canon in that repo's PR #8 — Shield scale with tier caps wired to the engine's premium dial, creator scale + VIP seats, community of net. The **Engine Room section (09)** of the data-room decks brought to canon in the same pass: the Live Dataroom index, `verify/public/pitch/index.html`, `verify/public/pitch/madhats-gambit.html` and the Data House `madhats-gambit.html`. Same day, **presentations moved out of this repo** (founder: the Presentation-Engine repo is where presentations live; this repo keeps the MPP): the eight `docs/collateral/` files and the three `docs/brand/paseome/` hat images now sit in `MADdegen/MADGambit-Presentation-Engine` under `collateral/` and `brand/paseome/` (PR #8, kept out of the madgambit.io deploy by `.vercelignore`). `verify/public/pitch/` stays — the app's nav links to `/pitch/index.html` (§7).
- **2026-10-27 (night)** — Repo hardening and CI triage. 19 failed runs this week, three causes: (1) 5 Dependabot security jobs on the vendored OpenZeppelin `package*.json` → manifests removed (#169 for `main`, #170 for `The-MDC`); (2) CodeQL Advanced on `The-MDC` failing at the java-kotlin autobuild and duplicating default setup → workflow removed (#170); (3) `main` red on its own push (the 155 type errors, fixed by #169) and 10 Dependabot PRs red on a stale `The-MDC` base (`TS5108 target=ES5`), now closed except #160, asked to rebase. `npm audit` 21 → 4. #155's merge into `main` removed `docs/collateral/` (Live Dataroom index, decks, Engine Room PDF) and the Paseome brand images, apparently by accident.
- **2026-10-26/27** — VC-demo push. Production unblocked on team `MAD-MPP` and promoted (`e193506`, `mad-mpp-2-23-two.vercel.app`) after Hobby's daily-cron limit was met. On `claude/demo-open-markets` → **PR #169** (`claude/demo-into-main`): the open-market floor (Prediction + Paseome conviction create/bet/cash-out, search/sort, creator earnings), the `/beta` private-beta front door with "~ Creator Sign-in ~", the founder's updated logos, the MADHAT'r knowledge base (`content/madhatr/knowledge.md`), the fix for `main`'s 155 type errors, and the anti-scrape layer (PART II §6, layer 9). Branch audit: 31 branches fully merged and 39 out of date, all to be deleted by the founder (§3; agents are refused), 0 files newer on any branch than on `main` (§7); the repo's default branch found to be `The-MDC`, not `main` (§3). `madgambit.fun` DNS records specified (§4). Evening: the founder's pitch notes reconciled to the engine — every worked number pinned in `lib/pitch-canon.test.ts` (22 tests), staking clout clamped to 0–200, `DECK_COMPOSITION` added, the MADHAT'r knowledge base, the four in-app decks and the whitepaper sheet corrected (creator 28.8–40%, community of net, old name, TeaBag), and the pitch claims the code does not yet back listed in §3.
- **2026-11-09** — **`$MADx` supply — the founder answers.** *"MADx total supply is 888,888,888 but only 270 280million in the token sale will be purchaseable."* Total supply is **888,888,888** (canon stands); **270 million** is purchasable in the sale (30.4%) — the message read "270 280million" and the founder confirmed 270 the same day. The founder's chat answer replaces the Crystex page as the source (PART 0 §4, struck). New conflict recorded in PART 0 §3: that figure exceeds the 224,573,096 cap the deployed contract carries and the beta ledger enforces.
- **2026-11-09** — **How a VIP seat is obtained — the founder answers.** *"VIP seat is obtained by purchase of a golden ticket (NFT), this campaign is for open beta launch."* A seat is **bought**, as a Golden Ticket NFT, in the open-beta-launch campaign: the "bought, earned or granted" question (PART 0 §3, PART VI §13 item 9) is answered. Not settled by it: whether a purchased ticket is the seat or still converts through the three-markets-each-≥188K test, the price and sale mechanism, and whether `CR8TR` traction still reaches 60%. Code today has only a local-state *claim* button for the ticket.
- **2026-11-09** — **Close-out-only items folded into MASTER.** The two 2026-10-23 close-outs were merged into the one `docs/THREAD_CLOSEOUT.md` (#177, 2026-11-02); the open items only they held now live here — **Workstream CF** (PART 0 §5, CF1–CF11), two PART 0 §3 rows (the `config-drift-checker` question and the held satire batch POST), the Paseome open questions on its §5 row, the Blockscout-limit and MCP-flakiness rows in §6, the no-removal rule in §7, and the Y3 volume cross-check at PART VI §13 item 6. The close-out now points here instead of restating them.
- **2026-11-03** — **Repo roles set by the founder** (PART 0 §1): `MAD-MPP-2.23` takes all working changes and feeds Vercel and Supabase; `MADGambit-Official-MMP` stores the official production build.
- **2026-11-03** — **Tech-debt register** (PART 0 §5, Workstream TD): 18 items scored across the repo, Supabase and Vercel. The biggest finding: the default branch `The-MDC` is 177 commits behind `main`, so Dependabot and code scanning report on stale code and Dependabot's upgrades (#180–#185) never reached `main`. The two Vercel projects named `mad-mpp-2-23` are already merged in code: the old `madgambit` copy's last builds are ancestors of `main`, so retiring it loses nothing.
- **2026-11-03** — **Admin suite deployed; two gate defects fixed.** #189/#190 merged as `44312bf` and promoted to production (the CLI deploy had landed staged). Verifying it found `/admin` 404'd by the scanner tarpit and the `daily-log` / `memory-weekly` crons 401'd by the guest gate, both fixed in #191 with a cross-check test. The admin suite switches on once `set-vercel-env.js` is run.
- **2026-11-02** — **Admin suite, live-agent defense, first-line support and the beta programme** (`claude/admin-suite`). Master + subordinate staff sign-in (scrypt, HMAC cookie, roles master/admin/support/dev/viewer, company email only); `/dashboard` gated; a reporting station with Markdown/text/PDF/CSV export; a once-a-minute MoE ticker poll of analytics + markets; a self-learning insights engine (learned baselines, feedback-weighted recommendations, skill acquisition) with a weekly report that also scans OSV, the GitHub Advisory Database, CISA KEV and maintainer feeds for proven security upgrades; agent defense (kill switch, circuit breaker, per-client threat scores and bans, injection and canary screening) and a trade guard against bots and quant abuse; first-line triage and tickets with separate user/dev/staff lanes; closed → open → GA beta with invite codes, waves and a signup shield (proof of work, time trap, honeypot); the MADHAT'r's threat colour (green/yellow/red), Support and Knowledge base buttons, slash-command skills, an evolving personality, tiered memory (48 h users, 7 days staff/VIP, logged before the weekly dump) and the information market's daily platform and user logs with a warehouse load; an agentic-trading root and a per-profile assistant stub locked to onboard agents. Knowledge base grew to 60 topics, including a plain-English school for the maths (PART VI §1–§13), perps, signals and the lunar layer.
- **2026-11-09** — **Paseome 3D graph thread closed.** #179 (11-02) and #196 (11-05) are merged; production deployment `5c5c41e` (11-06) carries both and its uploaded source includes the new files; the two merged branches are deleted; `THREAD_CLOSEOUT.md` carries the thread. **Restored the 2026-11-04 line below:** it was dropped from #196 when `main` was merged into its branch, and the hydration fix, the smoke test and the Engine Room item lived only there. Not yet looked at: the graph on the live site at phone width (needs a guest login). Same day, the sale arithmetic was traced: the only rate in the repo is `25,267 MADx per ETH` (a code comment), on-chain `maxTotalSupply` is 224,573,096 and `totalSupply` 0, and 224,573,096 ÷ 25,267 is exactly 8,888 — see §7.
- **2026-11-04** — **Paseome 3D graph, follow-ups to #179 (merged as #196, 2026-11-05).** The graph is now also on the Paseome desk (`/open-markets/[id]` → *Show the tree in 3D*): `snapshotFromMarket` (`lib/paseome-graph.ts`) turns the market's own DL-LMSR book into a frontier, labelled **DEMO FLOOR**, and it redraws when anyone trades without throwing away the viewer's zoom. Hub and desk share `components/paseome-graph-lazy.tsx` (code-split, near-viewport gate, error boundary). One-sided graphs are framed on their own cluster (`center`). `verify/scripts/paseome-graph-smoke.mjs` (`npm run smoke:paseome`) drives headless Chrome/Edge at 393px with no new dependency — **local / preview only, not in CI** (CI has no browser, server or guest login). **Fixed the `/preview` hydration warning** (not from #179): `EqualizerStrip` in `seiko-dopamine-hub.tsx` seeded its 44 bar heights with `Math.random()`, so server and client HTML differed on every load. The *3D Paseome graph* item that was listed as unbuilt came from a pasted screenshot of an earlier thread's question card — it was never saved in this repo or in `maths-engine-room.html` (that page has no Paseome text) — so it is **recorded as built here only**.
- **2026-11-01** — **The Paseome in 3D.** Interactive node-link graph of both frontiers on the premiere hub, under the Certain-UnCertainty carousel (`om-hub.tsx`): `components/paseome-graph.tsx` (shell: fetch, empty states, details, node list) + `paseome-graph-scene.tsx` (WebGL, `three`/R3F/drei already installed, no new dependency) over the pure `lib/paseome-graph.ts` (+ 25 tests). Fed by `GET /api/v1/paseome/frontier`, one call per side; labelled **DEMO DATA** because the route serves seeded branches (`source: "demo"`) — only an explicit `"live"` earns LIVE. A missing figure is an em dash, never a zero; a route failure draws nothing.

---

## PART II — CURRENT STATE

Everything below is believed true as of 2026-08-16. Where something is stale or contested it says so.

### 1. Stack

| Layer | Choice |
|---|---|
| App | Next.js 16, React 19.2.1, Tailwind v4 — in **`verify/`** (Vercel root directory) |
| Database | **Neon Postgres** via raw `pg` (node-postgres). No ORM. |
| Storage | Vercel Blob |
| Hosting | Vercel, GitHub-integrated, preview deploy per PR |
| Contracts | Solidity + Foundry in `contracts/`, Arbitrum One (42161) |
| Auth | Custom **SIWE** (`lib/siwe-verify.ts` + `verify/proxy.ts`) |
| AI | `@langchain/google-genai` + `langgraph`, **inside Next.js API routes** |
| Dev | Claude Code against GitHub PRs |

**The data layer is closed, not merely preferred.** ADR-008 makes `pg` Pool + Next.js Route
Handlers against Neon the **only** data pattern in this codebase: `lib/db.ts` is the single
client and `verify/app/api/**/route.ts` is the sole backend boundary. **No other database
platform, BaaS, or ORM is part of this orchestration** — any such dependency appearing in
`package.json` is by definition a regression, and needs an ADR superseding 008 before it is
anything else. That rule is positive and exhaustive, so it does not depend on maintaining a
list of named alternatives.

**Also explicitly rejected, do not reintroduce:** Drizzle · Prisma · NestJS · MongoDB · Privy ·
NextAuth · tRPC · a separate Python/FastAPI backend · "mEth" secondary currency.

Next 16 renamed `middleware.ts` → **`proxy.ts`**; confirmed on disk. The guest Basic-auth gate covers pages *and* `/api` (except `/api/health` and `/api/v1/health/db`).

### 2. Environment & secrets

Read by real code — set these:

| Var | Purpose |
|---|---|
| `GOOGLE_API_KEY` | Gemini — concierge, satire engine, embeddings. **Not** `GEMINI_API_KEY`. |
| `SESSION_SECRET` | HMAC for signed session cookies. Unset ⇒ SIWE verifies but issues no cookie ⇒ all wallet routes 401. |
| `CRON_SECRET` | Bearer for scheduled jobs. Routes 503 when unset. |
| `PAUSE_GUARDIAN_TOKEN` | `x-pause-guardian` header for emergency halt. |
| `SUBJECT_MAP_PEPPER` | HMAC pepper for identity index. Writes **throw** when unset. (`REGISTRAR_PEPPER` = legacy alias.) |
| `RELAYER_PRIVATE_KEY` | ERC-2771 meta-tx relayer hot wallet. |
| `GUEST_USER` / `GUEST_PASS` | Optional extra guest login. |
| `GDELT_QUERY` | Optional GDELT query override. |
| `NEXT_PUBLIC_*_ADDRESS` (4) | Optional; `lib/contracts.ts` has fallbacks on 42161. |

**Integration-injected — never hand-set:** `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`.
`lib/database-url.ts` also accepts `NEON_SKY_PARK_DATABASE_URL` and `NEO_DATABASE_URL`.

**Confirmed dead** (read by no code — do not re-add): `GEMINI_API_KEY`, `ALLOWED_WALLETS`, `NEXT_PUBLIC_SITE_URL`, `WIRE_LIVE`, the Upstash pair, `SENTRY_DSN`, `FEATURE_FLAG_GAMBIT_NODES`, `CORS_ALLOWED_ORIGINS`, `LUNAR_PHASE_OVERRIDE`, `NEXT_PUBLIC_VERCEL_ANALYTICS_ID`.

### 3. Deployment

Project **`mad-gambit-2.23`** (team `madgambit`, Pro), replacing the dead `mpp2.23`.

- Root Directory: `verify`
- Build: **`next build`** only. Migrations were removed from the build — they now run as a controlled, manual `npm run migrate:deploy` (with `npm run schema:verify` alongside). `SKIP_MIGRATIONS` is a legacy escape hatch; do **not** set it on Vercel, since normal builds no longer migrate.
- **`main` does not auto-deploy** — `vercel.json` sets `git.deploymentEnabled.main = false`; production deploys are manual/promoted.
- Neon connected via Vercel Marketplace ("connectable existing account"), branch-per-preview on
- Crons: `cron/rollup` 00:00 UTC · `perps/roll` 00:00 UTC · `registrar/lapse` 00:30 UTC — **daily only, because the Hobby plan rejects any more frequent schedule** (a sub-daily cron fails the whole production deploy). The 30-min `ingest/gdelt` schedule was dropped on 2026-10-26/27 for that reason; the route still exists and can be called with the `CRON_SECRET` bearer, and `proxy.ts` still bearer-passes it around the guest gate. Restore it on Pro. Runtime is Node 24.
- *Correction 2026-10-27:* the project now lives under team **`MAD-MPP`** (`team_ThJlmLcaIliE23YywpmA7uQf`, Hobby), project `prj_aiAAMWo4XvseAHHMMzIrH1ET1KCK`; production alias `mad-mpp-2-23-two.vercel.app`. The `madgambit` / Pro line above describes August.
- **Deployment Protection must stay OFF** — `proxy.ts` is the real gate
- Ignored Build Step allows `main`, `feat/*`, `claude/*` only
- GitHub secrets `DATABASE_URL` / `NEON_API_KEY` / `NEON_PROJECT_ID` are now unused and deletable
- Also injected by integrations: Upstash Redis (`REDIS_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`) — no Redis client exists in the app yet — and `BLOB_STORE_ID` alongside `BLOB_READ_WRITE_TOKEN`

### 4. CI

`.github/workflows/`: `ci.yml`, `unit-tests.yml`, `foundry.yml`, `placeholder-guard.yml`, `secret-scan.yml`, `dependency-review.yml`, plus `agentic-compile.yml` and the two gh-aw AI-review sources (`agentic-security-review.md`, `agentic-quality-review.md`). No Neon-branch workflow exists any more — that plumbing was retired.

| Gate | Status |
|---|---|
| Type-check (`tsc --noEmit`) | enforcing |
| Unit tests (vitest) | enforcing |
| Build (`next build`) | enforcing |
| Route-guard check | enforcing |
| Placeholder Guard | enforcing |
| Secret Scan (TruffleHog) | enforcing |
| Lint (eslint) | **report-only** — needs Next-16 realignment |
| Slither | **report-only** — 135 findings on `src/` awaiting triage |
| Dependency Review | **report-only** — needs Dependency Graph + GHAS |
| AI Security Review (gh-aw + Claude Code) | **advisory** — authz / business-logic / oracle-risk commentary; posts one PR comment, does not gate |
| AI Quality Review (gh-aw + Claude Code) | **advisory** — reuse / simplification commentary; does not gate |

Nothing blocks merge until branch protection actually requires these checks on `main`. The two AI review gates are deliberately non-blocking while they prove out; their `.lock.yml` files are generated by `gh aw compile` and only the `.md` sources are checked in so far.

**Coverage gap: `master-maths/` is gated by nothing.** No workflow's path filter matches it, so the
Kotlin client can stop compiling and every check still goes green. Workstream C5 (Part 0 §5).
Precedent: `contracts/script/**` sat outside `foundry.yml`'s filter the same way — `forge build`
compiled it, but the gate never ran on changes to it, leaving INTERLOCK L4 unverified until it was
found by accident.

**A third instance of the same pattern, fixed 2026-08-18: Placeholder Guard was scanning nothing.**
A git pathspec is not a shell glob. Without `:(glob)` magic, `*` already crosses `/`, while `**` is
*not* special and matches a literal path component — so `contracts/src/**/*.sol` demanded an
intervening directory that does not exist:

```
git ls-files 'contracts/src/**/*.sol'   -> 0   (should be 10)
git ls-files 'contracts/test/**/*.sol'  -> 0   (should be  9)
git ls-files 'verify/**/*.ts'           -> 203 (should be 206)
```

The pragma check had **never scanned a single contract**, and the code-token check silently skipped
the files at the top of `verify/` — including `proxy.ts`, the SIWE gate. The guard passed by
scanning nothing, which is worse than failing. Now `dir/*.ext`, with the trap written into the
workflow so it cannot be "tidied" back. All 19 contracts and 321 TS/TSX files pass, so this turned
coverage on without changing the verdict.

**The lesson, three times over:** a green gate is not evidence until you have confirmed it is
looking at something. Check the file *count* a filter or pathspec actually yields, not just its exit
code.

### 5. Database & migrations

**15** migrations, `verify/sql/0001–0015_*.sql`, applied by `verify/scripts/migrate.mjs` — one transaction each, tracked in a `_migrations` ledger, idempotent (`CREATE ... IF NOT EXISTS`). Schema lands **only** via reviewed numbered migrations; interactive `psql` is both discouraged and network-blocked in-container.

**The next free number is `0016`.** `0015_pack_open_counter.sql` shipped with the Phase-0 fairness fix, so the merge migration below is `0016_neon_merge.sql`, not `0015_*` — this section said "14 migrations" until 2026-08-18 and would have collided.

**Current blocker — three Neon databases, one app (2026-08-14).** Under the same Neon-via-Vercel integration there are three live Postgres databases:

| Role | Name |
|---|---|
| **Target** | `mad-mpp-2-23-postgres` (confirmed attached, Neon Free) |
| Source | `Neon-DB-MADMPP` — compare, then retire |
| Source | `neon-sky-park` — compare, then retire (the "sky park" project) |

`/api/v1/health/db` returning 503 with a ~10s connection timeout is the signature of a host that never answers — almost certainly this split rather than the earlier "quota suspension" or "wrong project" diagnoses, both of which are superseded.

**Founder-driven sequence, in order — do not skip ahead to the delete:**
1. Run the read-only inspection query (below) in each of the three Neon SQL Editors.
2. Diff the three outputs; decide a conflict policy per overlapping table.
3. Author the merge migration as `verify/sql/0016_neon_merge.sql`, following the existing migrations-as-code convention.
4. Validate row counts and app behaviour against the merged result.
5. **Only then** delete `Neon-DB-MADMPP` and `neon-sky-park`.

Blob (`mad-mpp-2-23-blob`) is explicitly out of scope.

**Why an agent session cannot do step 1:** egress to `*.neon.tech` and TCP 5432 is deliberately blocked in the agent container (verified: `console.neon.tech` and `api.neon.tech` both 403 through the proxy; 5432 unreachable). Either the founder runs the query and pastes results back, or a read-only Neon MCP server is connected to a future session (`.claude/skills/neon-db`) — which needs an interactive OAuth/API-key flow an agent can't perform for itself. **No agent should get write access for this task.**

```sql
-- A: every table in the public schema
select table_name from information_schema.tables
where table_schema = 'public' and table_type = 'BASE TABLE' order by table_name;

-- B: column fingerprint per table
select table_name, ordinal_position, column_name, data_type, is_nullable, column_default
from information_schema.columns where table_schema = 'public'
order by table_name, ordinal_position;

-- C: primary keys — defines what "conflict" means per table
select tc.table_name, kcu.column_name
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
where tc.constraint_type = 'PRIMARY KEY' and tc.table_schema = 'public'
order by tc.table_name, kcu.ordinal_position;

-- D: approximate row counts (planner stats, not a full scan)
select relname as table_name, n_live_tup as approx_row_count
from pg_stat_user_tables order by n_live_tup desc;
```

### 6. Security

Nine layers (the first eight were `SECURITY_LAYERS.md`, folded in here):

1. **Edge headers** — `next.config.ts` `SECURITY_HEADERS` (+ `vercel.json`): `X-Frame-Options: DENY`, `nosniff`, `strict-origin-when-cross-origin`, Permissions-Policy, and a **CSP split into enforced (`frame-ancestors`/`base-uri`/`object-src`/`form-action`) and Report-Only** (`script-src`/`style-src`, reporting to `/api/v1/csp-report`). *Corrected 2026-10-27: this line said "No CSP yet"; it had shipped — see PART 0 §5.*
2. **SIWE wallet auth**
3. **Sessions/secrets** — `SESSION_SECRET`, guest pair, `CRON_SECRET`
4. **Rate limiting** — `lib/rate-limit.ts`; audit that every public route uses it
5. **Shield domain guards**
6. **Contracts** — Foundry + Slither; external audit vendor on file: **Hacken.io**, engage before mainnet
7. **Supply chain** — Secret Scan enforcing; Slither / Dependency Review / Lint report-only
8. **Governance/review** — skill lives in the separate `MADHATs-Claude-Enhancement` repo
9. **Anti-scrape and capture deterrents** (PR #169, 2026-10-27). *Server:* `lib/bot-guard.ts` in `proxy.ts` — scanner probe paths (`/.env`, `/.git`, `wp-login.php`, `*.php`, `*.bak` …) get a bodiless 404 before the gate; AI crawlers, search spiders, scanners (sqlmap, nuclei, nikto …), HTTP libraries and headless Chrome get a 403 **unless they carry a guest pass**; link-preview bots and `vercel-*` agents pass. `app/robots.ts` disallows everything and names the AI tokens; `X-Robots-Tag` + `metadata.robots` set noindex/noarchive/nosnippet/noimageindex; `Cross-Origin-Resource-Policy: same-origin` stops hot-linking; `display-capture=()` added to Permissions-Policy; `X-Powered-By` removed; browser source maps explicitly off. *Client:* `components/capture-guard.tsx` — a faint tiled watermark with the guest's name and date (from the script-readable `mg_viewer` cookie the proxy sets; not on `/beta`), a blur veil on the ⌘⇧ / Win+Shift screenshot chords and PrintScreen (which also overwrites the clipboard), print renders a notice, selection/copy/drag/context menu/save/view-source shortcuts off outside form fields, and an opaque veil when `navigator.webdriver` is true. Exempt: dev builds, `NEXT_PUBLIC_CAPTURE_GUARD=off`, and guests in `CAPTURE_ALLOWED_USERS` (`mg_cap=1`). **Limits, stated plainly:** no page can stop an OS screenshot, a phone camera, or a scraper that spoofs a browser UA and signs in; this raises the cost and makes leaks traceable. `/_next/static` is outside the proxy matcher, so JS bundles stay fetchable. Next step is Vercel Firewall bot rules.

**Do not restore** (placeholder stubs): `lib/auth/siwe.ts`, `app/api/session-keys/*`, `SessionKeyManager.tsx`, root `middleware.ts`. **Do not re-add** `ai-backend/.../auth.py` — deliberately migrated off; restoring it forks a second auth path.

**Genuine gaps to build fresh:** ERC-4337 session keys · CSP header.

Since the security map was written: SafeERC20 added and 3 open routes closed (#75); the `$MADx` transfer vulnerability is **fixed** (all 7 `madx` routes now use `lib/madx-route-auth.ts` — *do not re-fix it*, a stale-tree review reported it as open); **35 of 53 mutating routes still lack a wallet-session check** (privilege separation, not anonymous access — the guest gate covers them); `npm audit` was first run on 2026-10-27: **21 vulnerabilities (1 critical, 16 high) → 4 high.** `npm audit fix` cleared handlebars (critical), axios, undici, nanoid, js-yaml, follow-redirects, brace-expansion, fflate, source-map-js, vite and @vitest/mocker; the unused `@langchain/community` was removed (nothing imports it; it dragged in stagehand, deepmerge and openai@4), and `dotenv` is now an explicit devDependency because `scripts/init-vector-db.ts` imports it and had only ever resolved it transitively. **Remaining 4 high: zod 3.x** (GHSA-mrhx-c7xc-m3w5, memory exhaustion on oversized constrained collections) via `@langchain/core` and `@vercel/blob` → `@vercel/cli-config`; the fix is zod 4.6.6+, which needs those packages to accept it. The app validates no untrusted input with zod directly. Use **npm 11** (`npx npm@11`) for lockfile work: npm 10.9 crashes on this lockfile (`Cannot read properties of null (reading 'edgesOut')`), and CI runs Node 24 / npm 11.

### 7. Canonical numbers

Locked, from `CANONICAL_NUMBERS.md` (2026-04-05) and implemented + unit-tested in `verify/lib/gambit-game-math.ts` (`FEE_BPS 188`, `COMMUNITY_SHARE_BPS 2880`, `MADX_FIXED_SUPPLY 888_888_888`):

| Parameter | Value |
|---|---|
| Platform fee | **1.88%** global |
| Community profit share | **28.8% of platform NET** — after the creator cut, not of gross (corrected 2026-08-27) (displays as 28%) |
| Creator revenue share | **Creators slide 28.8% → 40%** (User / MinorCreator), creator-made markets **only**. **60% is a VIP profit share limited to 4,888 seats** — rare and exclusive, not a traction rung (founder, 2026-10-23). The 31 Jul ladder is otherwise intact. ⚠️ Code still grants 60% as `CR8TR` by traction with no seat cap — see §3 and §5. |
| MAD Shield loss recovery | **A scale, 28.8% → 40%** — premium-funded (not a subsidy), capped by staking tier; **40% is the ceiling** (founder, 2026-10-23). ⚠️ The engine still carries a 60% whale rung — engine only, Part 0 §5 |
| Token supply | **888,888,888** fixed |
| Seed ask | $1M–$2M @ $12M pre · min viable raise $688K — ⚠️ **five versions now in circulation, see PART 0 §3 "One ask"** |
| Staking tiers | **Four-tier eights ladder by stake** (founder sign-off 31 Jul 2026): Bronze 88 / 8.8% · Silver 888 / 18.8% · Gold 8,888 / 28.8% · MAD Tier 88,888 / 38.8% APY, × (1 + clout/200). *Corrected 2026-10-23 — this row showed a superseded lock-duration ladder ending at 68%; `STAKING_TIERS` and `MADStaking.sol` both carry the eights ladder (PART VI §1).* |
| MADDAO quadratic cap | **√stake, capped at 240 votes** (`VOTE_POWER_CAP`) — i.e. no wallet outweighs a 100-$MADx holder (√100 = 10) by more than **24×**. Both phrasings are the same cap; say "240 votes" in copy (reconciled 2026-10-27). |
| Deck composition | **992 = 112 base (8 factions × 14) + 784 crossovers + 56 chaos fusions + 32 legendary crossovers + 8 Golden Panderverse** (founder brief, 2026-10-27; `DECK_COMPOSITION`, pinned by `lib/pitch-canon.test.ts`) |
| Founder's Golden Ticket | **4,888** ERC-1155 — the VIP seat pool; minimum desired conversion **2,888** (founder, 2026-10-23; was 2,488); sold in the open-beta-launch campaign (founder, 2026-11-09). ⚠️ The investor decks still say 2,488 — Part 0 §5 |

**Fee distribution.** Platform markets: $100 bet → $1.88 fee → 35% Ops / 25% Shield / 10% Burn / 30% Community. Creator markets: the creator's rung — 28.8% → 40%, or 60% on one of the 4,888 VIP seats — to the creator (lifetime, on-chain), the rest to the platform; the community's 28.8% is of the platform's net (`splitFee`, PART VI §6).

**Never use again:** fee 1.66% / 2.88% / 4.88% · Shield 40% / 60% · "TeaBag" (old Shield name — banned in investor/public comms) · "MAD Upshot" · seed $2.4M–$3M · Y3 $42M · Base-L2-as-primary · $MAD 1B supply · 888-as-founders-NFT · creator fee 42% · phantom co-founders Isabella H. / Parphul B.

**Founder-stated traction (pitch notes, 2026-10-27; not verifiable from the repo):** 15,000 pre-launch sign-ups, no paid spend. Closed alpha December–February: 200 creators recruited through a creator agency, **196 completed**, **81%** chose the custom conviction build over a copy-script prediction-market MVP when forced to pick one. The founder frames it as **a preference result on a small sample, not retention**; no retention number exists yet, and the beta is designed to measure it. Use that framing verbatim; never improvise a retention figure. Kept out of public product copy (`content/madhatr/knowledge.md` house rules).

**Brand rules:** "MAD Gambit" = the platform, always. "MADHAT's Gambit" = card-game line + character, full name always. "MADHATs" alone = never.

> **Token distribution is contested.** `CANONICAL_NUMBERS.md` (April) says 35% Public / 20% Liquidity / 15% DAO & Community / 10% Team / 10% Staking / 10% Reserve. The March "vFinal" whitepaper set says 45/15/15/15/10. April is later and this doc treats it as canonical — but the two have never been explicitly reconciled.

### 8. Contracts

`contracts/src/` — **10 contracts, 1,943 lines** (counted 2026-10-27; this said "11 files"): `MADMarketFactory`, `MADOptimisticOracle`, `MADDisputeVoting`, `MADShieldVault`, `MADStaking`, `MADCard1155`, `MADCard721`, `MADPortrait`, `MADPortraitKeyRegistry`, `FounderRegistry`.

⚠️ **On-chain creator share is a flat 40%** (`MADMarketFactory.CREATOR_FEE_SHARE_BPS = 4000`), not the 28.8% → 40% ladder that `splitFee` and canon use — see PART 0 §5. Market makers: parimutuel (`MADMarketFactory`, live) + MPP bonding curve for perp families. LS-LMSR proposed, not built. Oracle: `MADOptimisticOracle` + `MADDisputeVoting` (Phase A commit-reveal staked-$MADx voting, 5,000-$MADx threshold) — **merged, but merged ≠ deployed on-chain**.

Perp families live under `/api/v1/{faces,zeitgeist,epiphany,perps,registrar}`. Named-individual markets stay inert until the Phase-4 gate opens.

### 9. Open items & unresolved contradictions

**Founder-only decisions:**
- Promote `main` to production
- Neon quota — reset or upgrade plan, then remove `SKIP_MIGRATIONS`
- Attach `madgambit.io`
- npm registry egress allowlist (blocks dependency work in agent sessions — see Part V)
- GitHub Advanced Security toggles
- Push `v2.24-constellation` tag (git-proxy blocked in-session)
- Phase-4 named-subject gate: KMS choice, `MADPortraitKeyRegistry` deploy, 6 signed-off `registry_readiness` rows

**Unresolved contradictions — worth closing:**
1. **$MADx supply.** Canon says 888,888,888 fixed. The deployed Arbitrum One contract has a **mutable, mint-on-purchase** supply, cap 224,573,096, Pausable. Two candidate addresses appear across the archive (`0xb61ae772…fd18` Crystex fair-launch, and `0x6972370e…151f` used as the `lib/contracts.ts` fallback). **On-chain check performed 2026-10-23 and it eliminates the first address, it does not confirm it:** `0xb61ae772…fd18` on Arbitrum One (42161) is an unrelated ERC-20 — name "Serpentine Orkain", symbol **ORKx**, 18 decimals, total supply 60.073728, 2 holders, unverified source. `0x6972370e…151f` was not reachable that day; **the founder confirmed it as the real `$MADx` on 2026-10-26**, and a Blockscout read the same day shows a verified contract on Arbitrum One. Founder's stated source for the real total supply is the **Crystex campaign page, which is egress-blocked from the agent container** (Part 0 §4). **Supply answered 2026-11-09 (Part 0 §3):** total 888,888,888, with 270 million purchasable in the token sale (confirmed). Still open: the conflict with the 224,573,096 cap.
2. **Chain topology.** Current work targets Arbitrum One (42161) only, but `CANONICAL_NUMBERS.md` restates Nova (gameplay) + One (vaults/$MADx) + HyperLiquid as founder-locked, and `contracts/foundry.toml` still configures an `arbitrum_nova` RPC. Either Nova is retired and the config is cruft, or it isn't.
3. **Token distribution split** — see §7.
4. **Card rarity taxonomy** — NFT docs use 7 tiers / 992 cards; later tokenomics docs use 6 tiers with different distributions. Relabel or genuine divergence, unknown.
5. **Auth history.** The entire business/pitch archive plans Privy + Alchemy AA-SDK; the app shipped custom SIWE. The pivot was never written down. Noted here so it stops resurfacing.

**Product backlog:** THE WIRE still demo-row · raw-hex design-token scrub (~82 values, 5 panels) not started · 4 dead components undecided · benchmark series undefined · slot-auction clearing still manual.

---

## PART III — FRONTEND QOL BENCHMARK (top 12)

Benchmarked 2026-08-16 against `verify/`. **SHIPPED** (done well) · **PARTIAL** (exists, gaps) · **ABSENT** (nothing in tree). Evidence is a real grep, not an estimate.

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 1 | Variable-reward schedule on a non-linear ladder | **SHIPPED** | `gambit-game-math.ts` `VRS_TRIGGERS=[5,8,13,21,34]`, `streakReward` 1.3x→3.2x; `session-vrs.ts` persists streak, Fibonacci-ms durations (610/987/1597/2584/4181), Fibonacci particle counts (24/48/88/144/233) |
| 2 | Celebration / juice layer | **SHIPPED** | `joy-layer.tsx`, `vrs-toast.tsx`, `dopamine-glyphs.tsx`, shared `animate-vrs-burst` + `animate-gold-jackpot` keyframes |
| 3 | Reduced-motion accessibility | **SHIPPED** | 20+ call sites honor `prefers-reduced-motion`. Genuinely well done — usually the first thing teams skip |
| 4 | Haptics | **PARTIAL** | `navigator.vibrate` in `main-nav` (6ms), `bottom-nav` (8ms), `zliar-section` (12ms) only. Missing on pack open, VRS trigger, bet confirm, evolve |
| 5 | Audio | **PARTIAL** | Web Audio in `joy-layer.tsx` + `use-rip-sound.ts`. **No global mute/volume, no persistence** |
| 6 | Optimistic UI | **ABSENT** | **Zero** `useOptimistic`/`useTransition`/`startTransition`. Every mutation waits a full round-trip |
| 7 | Streaming / Suspense + skeletons | **ABSENT** | **Zero** `<Suspense>`, zero `loading.tsx`, zero skeletons. App Router streaming unused |
| 8 | Error boundaries | **ABSENT** | **Zero** `error.tsx`. Any server-component throw → default Next error page |
| 9 | Route-level code splitting | **ABSENT** | **Zero** `next/dynamic`/`React.lazy` across 93 components / 19,455 lines. `conviction-charts.tsx` is 1,965 lines + `recharts`; `three` + `@react-three/fiber` eagerly bundled |
| 10 | Font optimization | **ABSENT** | **Zero** `next/font`. Orbitron/Rajdhani not preloaded → FOUT + CLS on first paint |
| 11 | Image optimization | **PARTIAL** | 2 `next/image` importers vs 4 raw `<img>`; 25 card PNGs + brand assets unoptimized |
| 12 | View Transitions | **ABSENT** | **Zero** `startViewTransition`. Route changes are hard cuts — card→detail morph is the obvious unclaimed win |

**Read of the result.** The reward/celebration layer (1–3) is stronger than most production apps. The *engineering* QOL layer (6–12) is almost entirely unbuilt. **The app feels good once rendered, and slow getting there.** Every gap in 6–12 is standard React 19 / Next 16 surface the project already has dependencies for — no new libraries needed.

### Compliance boundary — read before actioning 1–5

Two standing constraints govern this area and were written deliberately:

- Master-plan suppress-list: *"'dopamine / VRS / novelty-seeking' neuroscience framing in any external doc"* — never reintroduce.
- `lib/joy-engineering.ts` header: *"This module adds NO new hidden mechanics and NO neuroscience framing… we keep the game-economy mechanic and drop the clinical 'dopamine / anticipation-circuit' language."*

The mechanics stay; the clinical framing stays out of anything user- or investor-facing. This document is internal and names them plainly — the moment any of it reaches a deck, whitepaper, or marketing surface, it must be reworded to game-economy language.

**One mechanic needs a decision, not silent expansion.** `dopamine-engine.tsx` implements a near-miss band (`const isNear = !won && roll < 0.58`) — a loss rendered as an almost-win. On free-play credits that is ordinary game feel. On a **real-money** market it is the single most regulated pattern in this space: near-miss recruits the same reward circuitry as a win while the user actually lost money, and it is precisely what gambling regulators and the dark-pattern literature target. **Recommendation:** confine near-miss to `madCredits`/demo surfaces, never render it against real `$MADx` stakes, and make that boundary explicit in code. Unchanged pending your call.

---

## PART IV — CHAINLINK VRF AUDIT

`vrf.chain.link` and `docs.chain.link` are both blocked by this environment's egress policy. This audit is built from the VRF v2.5 documentation surface via search plus a direct read of `contracts/`. Nothing was routed around the block; concrete on-chain constants (coordinator address, key hash) are marked **‹verify›** and must be read off live docs before implementation.

### What the subscription page is

`vrf.chain.link/<network>/new` is the VRF Subscription Manager: it creates a **subscription** — a funded account paying for randomness requests, holding balances in LINK and (v2.5) native gas token. You fund it, register **consumer** contracts against its numeric ID, call `requestRandomWords(...)`, and the coordinator calls back `fulfillRandomWords(requestId, randomWords)`. Sepolia is the rehearsal for the identical mainnet flow.

### The gap is real

No VRF anywhere in `contracts/src/` — 11 contracts, zero VRF imports. Randomness that *should* be provable is `Math.random()`:

| Call site | Decides | Exposure |
|---|---|---|
| `gambit-game-math.ts:615` — `const vrfResult = Math.random() * 100 + fibReward` | Card evolution | The variable is literally named `vrfResult`; the intent was always VRF |
| `api/v1/cards/evolve/route.ts:34` | — | Comment concedes: *"uses Math.random; the real roll is on-chain VRF, Phase-3 gated"* |
| `api/v1/cards/open-pack/route.ts` | Pack rarity, slot-0 guarantee | **`userNonce` read from the request body** — grindable |
| `api/v1/tournament/match/route.ts:50-65` | Match outcome, opponent power, rank | Server-side `Math.random()` |
| `gambit-game-math.ts:733-734, 970` | Shield premium band, scenarios | Server-side `Math.random()` |

### Value assessment — medium-high and above only

**HIGH — provable pack/card randomness.** Packs and evolution are the monetized RNG surface; "provably fair" is a marketable property, and the code already anticipates it. Requires the mint/evolve path to settle on-chain (`MADCard1155`/`MADCard721` exist) — VRF behind a route that writes only to Postgres proves nothing to a user.

**HIGH — VRF v2.5 native-token payment.** v2.5 subscriptions hold two balances (LINK and native), and premium moved from a flat fee to a percentage of callback gas. On Arbitrum One the whole flow can be funded in ETH — no LINK acquisition or treasury management.

**MEDIUM-HIGH — random juror selection in `MADDisputeVoting.sol`.** The most defensible non-obvious use: it removes "who resolves this market" as a manipulation surface on the optimistic oracle. Worth doing *before* tournament randomness.

**MEDIUM-HIGH — tournament seeding.** One VRF draw per round, per-match outcomes derived deterministically from that seed. Per-match requests are not economical.

**Explicitly not worth it:** VRF for market *resolution* (factual events — that's the oracle's job) · cosmetic randomness · anything settling only to Postgres.

### Cost & latency reality

Arbitrum callback cost is dominated by L1 calldata posting, and v2.5 prices premium as a percentage of callback gas — so cost per request is **variable and must be estimated on the target lane**, not assumed. Budget for subscription funding, a per-consumer callback gas limit, and 3+ block confirmations of latency. **Pack opening therefore cannot stay synchronous** — which is why the async-UX gaps below are prerequisites, not parallel work.

---

## PART V — TACTICAL IMPLEMENTATION PLAN

Sequenced by dependency. Governing constraint: **VRF makes pack-opening asynchronous**. Shipping it onto today's synchronous UI would replace an instant pack-open with an unexplained multi-second freeze — a downgrade. So QOL items 6/7/8 come first. Effort is engineer-days. Each phase is independently shippable and revertible.

### Phase 0 — Fairness bug (0.5 day, no dependencies)

Do this regardless of everything else; it is a live grindable-RNG hole.

1. `api/v1/cards/open-pack/route.ts` — stop trusting `body.userNonce`. Derive it server-side from `auth.owner` + a persisted per-wallet pack counter.
2. Same file — `madxBalance` is read from the request body (the route's own comment calls the check "decorative"). Either wire it to a real server-side balance source or delete it so it stops implying a guarantee it doesn't provide.
3. Add a regression test asserting two calls with an identical client-supplied nonce don't produce identical rarities.

**Exit:** pack outcomes are not caller-influenced. No UI change.

### Phase 1 — Perceived-performance foundations (2–3 days)

4. **Error boundaries** — `app/error.tsx` + `app/global-error.tsx`. On a money-handling product, the default Next error page reads as "site is broken."
5. **Streaming + skeletons** — `app/loading.tsx`, then per-route for `dashboard`, `markets`, `workbench`, `octavian`. Wrap slow data-dependent subtrees in `<Suspense>`; size skeletons to final layout so nothing shifts on hydrate.
6. **Font pipeline** — move Orbitron/Rajdhani to `next/font` in `app/layout.tsx`. These are brand-identity fonts currently causing FOUT on every cold load.
7. **Code splitting** — `next/dynamic` for `conviction-charts.tsx` (1,965 lines + `recharts`), `octavian-mesh.tsx` and anything pulling `three`, `perp-dials.tsx` (980 lines). `ssr: false` only where genuinely client-only (WebGL).
8. **Images** — convert the 4 raw `<img>`; route `public/cards/*` and `public/brand/*` through the optimizer with explicit dimensions.

**Exit:** measurably better LCP/CLS on the Speed Insights already wired in `app/layout.tsx`. **Take a before/after reading — this phase is worth nothing unmeasured.**

### Phase 2 — Interaction feel (2 days)

9. **Optimistic UI** — `useOptimistic` + `startTransition` on bet placement, `$MADx` transfer, card evolve, conviction tap. React reverts automatically on failure; pair each with a rejection toast reusing `vrs-toast.tsx` rather than adding a second toast system.
10. **Haptics coverage** — promote the 3-site `navigator.vibrate` pattern into one helper; fire on VRS node hit, pack rip, evolve result, bet confirm. Gate on `prefers-reduced-motion` for consistency.
11. **Audio** — add persisted global mute/volume, **defaulting to off**. Today `joy-layer` and `use-rip-sound` can make noise with no user control, the most common cause of a closed tab.
12. **Keyboard/focus** — only 3 `focus-visible` treatments against 92 `aria-` attributes. Add visible focus rings to the shared primitives in `components/ui/`.

**Exit:** every mutation echoes instantly; nothing makes sound without consent.

### Phase 3 — VRF on Sepolia (3–5 days)

Start only once Phases 1–2 provide a pending state worth showing.

13. **Read live config ‹verify›** — Arbitrum Sepolia VRF v2.5 coordinator address, key hash, min confirmations, max gas limit, from Chainlink docs. Do not hardcode from memory.
14. **Create + fund the subscription** for Sepolia; note the ID. Fund with testnet LINK *and* native to rehearse the v2.5 dual-balance model.
15. **Consumer contract** — new `contracts/src/MADRandomness.sol`: inherit `VRFConsumerBaseV2Plus`, import `VRFCoordinatorV2_5`, implement `fulfillRandomWords(uint256, uint256[] calldata)`, use `VRFV2PlusClient.RandomWordsRequest` with `extraArgs` setting `nativePayment` explicitly. Keep it a **generic seed provider** with per-consumer request accounting — do not fold pack logic in.
16. **Seed-parameterize the rarity math** — the key refactor. `openCardPack` / `attemptEvolution` become pure functions taking `seed: bigint`, so the identical function runs off a VRF word on-chain and a server seed in demo mode. `gambit-game-math.ts:615` becomes `seedToUnitInterval(seed) * 100 + fibReward`.
17. **Foundry tests** with a mock coordinator: request→fulfil happy path, fulfil-twice rejection, callback-gas exhaustion, and the slot-0 ≥Uncommon guarantee holding across a large sampled seed space. `foundry.yml` + Slither gate these automatically.
18. **Async pack UX** — request (optimistic "sealed pack shaking") → pending → reveal on callback. The existing `use-rip-sound` + `pack-opening.tsx` choreography suits covering the wait; the anticipation gap is a feature *provided it's shown*, not a frozen button.

**Exit:** provably-fair pack open demonstrable end-to-end on Sepolia.

### Phase 4 — Mainnet + the higher-value oracle use

19. Re-run step 13 against **Arbitrum One**; budget subscription funding against real callback-gas premium — estimate on the actual lane, don't extrapolate from Sepolia.
20. **Random juror selection** in `MADDisputeVoting.sol` — do this before tournament randomness.
21. **Tournament seeding** — one draw per round, matches derived deterministically.

---

## WORKSTREAM B — Exterior Workbench Experience

Independent of Phases 0–4 above; touches the desktop-only space *outside* the phone frame. Numbered separately to avoid colliding with the VRF/QOL phase numbers.

### B-Phase 1 — Octavian mesh: size, shared state, firefly anomalies (1.5–2 days)

> **Re-scoped 2026-08-16 against current `main`.** `octavian-mesh.tsx` **no longer exists**: commit `bb99269` merged both visuals into one engine, `components/octavian-creature.tsx`, with `variant="compact"` (workbench corner HUD) and `variant="full"` (`/octavian` + inline on `/preview`). Two of the three things originally scoped here already shipped — see below — so this phase is smaller than first written.

**Already shipped, do not rebuild:** wheel + pinch zoom (`ZOOM_MIN = 1/6`, `ZOOM_MAX = 4`), two-axis drag-to-orbit, click-to-select, double-click pop-out overlay, and the three-tier creature-mood system. The container is already a "3D box" (layered shadow/inset, glass sheen, gold backing) at 3× the old 256px base, clamped 280–768px.

**B1.1 — Resize to the perps-deck container idiom.**
The perps deck container (`perp-dials.tsx:714`) is the size/shape reference: `borderRadius: 24`, `padding: clamp(10px, 1.4vw, 16px)`, gradient `--pn`→`--bg` background, 1px `--tx`-mix border, dual box-shadow (gold rim + cyan bloom); its instruments size off `maxWidth: calc(252px * var(--dial, 1))` with `aspectRatio: 280/168`. Replace the creature's current 280–768px clamp with that container and a `--dial`-equivalent scale variable. Lift the container into a shared primitive in `lib/instrument-chrome.ts` rather than copy-pasting the literals a third time — that module already exists for exactly this (it absorbed `fibonacciSphere`/`resolveColor`/`P3` in PR #80). Note the creature deliberately **never resizes its box on zoom** — only the rendered mesh scales (`R = min(w,h) * 0.42 * zoom * (1 - 0.05 * tierBlend)`); preserve that separation.

**B1.2 — Share state across mounts.** The remaining real gap. Zoom, orbit and mood all live in refs *inside* `OctavianCanvasPanel`, so every mount is independent — the header comment states plainly that "the popped-out instance is a separate mount with its own mood/orbit." Compact, full, and popped-out therefore drift apart. Hoist that state (`zoomRef`, orbit yaw/pitch, mood tier + decay clock) into one shared store — a module-level store with `useSyncExternalStore`, or context — so all mounts read and write the same values and prodding the corner orb is visible on `/octavian`. Keep `NODE_IDS`/`EDGE_STEPS`/`fibonacciSphere` as the single source of node placement; do not fork the geometry.

*Note on the phone zoom:* the HUD is a deliberate **sibling** of `.mg-device` so `--mg-device-zoom` does not scale it (documented in its header, following the `.mg-zoombar` convention). If you also want it to track phone zoom, consume `--mg-device-zoom` in the creature's own container **while staying a sibling** — moving it inside the zoomed subtree inherits phone clipping and breaks its fixed-position/safe-area layout.

**B1.3 — Spheres → firefly star anomalies.**
Today each node renders as a uniform circle at a fixed `fibonacciSphere` point. Wanted: varied, bright, natural star-like bodies that drift and dart like fireflies. Implementation shape:
- **Per-node identity** — derive a stable seed per `NodeId` (hash the id, don't `Math.random()` — it must survive re-render and match server paint). From it derive size, hue offset within the active skin's accents (`resolveColor` against `--ac`/`--a2`/`--gd`), corona spread, and base brightness. Variety comes from the seed, not from randomness at draw time.
- **Star rendering** — replace the flat circle with a layered radial-gradient core + 4/6-point diffraction spikes + soft bloom, sized off the seed. Cheap in 2D canvas: one `createRadialGradient` per node plus two crossed gradient strokes for spikes.
- **Firefly motion** — offset each node from its Fibonacci anchor by a small wander vector: two summed sine terms at incommensurate frequencies (per-node phase from the seed) gives organic drift without a physics step. Layer an occasional "dart": a low-probability per-node impulse eased over ~400–700ms toward a nearby point, then relax back to the anchor. Anchors stay authoritative so the mesh never structurally deforms and edges keep meaning.
- **Bioluminescent pulse** — brightness on its own slow sine, *desynchronised* per node (again seed-phased). Fireflies read as alive because they're out of phase; synchronised blinking reads as a loading spinner.
- **Reduced motion** — `prefers-reduced-motion` must pin every node to its anchor at constant brightness. Non-negotiable: the codebase honours this at 20+ sites and this is the most motion-heavy thing in it.
- **Perf budget** — 20 nodes × (gradient + spikes + bloom) per frame on the existing `runInstrumentLoop`. Profile it; if it costs, pre-render each distinct star to a small offscreen canvas once and blit per frame.

**Exit:** exterior orb matches perps-deck container sizing, tracks phone zoom, and reads as a living constellation rather than a dot-graph — with motion fully suppressed under reduced-motion.

### B-Phase 2 — O-V deck → interactive exterior experience (4–6 days)

**Source — use the repo, not the HTML.** The latest O-V deck is the private repo **`MADdegen/OV-Deck-2026`** (Vite + React, last commit 2026-07-31 `079fce0`), *not* `verify/public/pitch/ov-pitch-deck.html` — that HTML is an older Angular-generated export. The repo gives structured slide data in `src/slidesData.ts` (212 lines: `id`, `title`, `subtitle`, bullet arrays) so no HTML parsing is needed at all, and it already ships eight interactive components worth mining rather than reinventing: `CardDeckViewer`, `TokenomicsVisualizer`, `TripleThreatOracleVisualizer`, `DutchAuctionBooster`, `InteractiveSimulator`, `DataRoomDashboard`, `InteractiveCodePlayground`, `PresenterControls`.

**B2.1 — Its 12 slides (from `slidesData.ts`):**
0. MΛĐ Gambit L.C. (hero) · 1. MΛĐĐΞX ($MΛĐx) Launch · 2. Production & Speculation · 3. MAD Upshot: The Card Economy · 4. MAD Shield Protection · 5. Triple-Threat Oracle Cascade · 6. $MADx Tokenomics · 7. Defensible IP & Cap Table · 8. The Golden Stack: $0 Infrastructure · 9. Vanguard Synergy & Co-Building · 10. The Ask: Alignment and Runway · 11. Claim Your Co-Development Pass

**B2.1a — Three canon conflicts found in the deck. Resolve before any of it reaches a user surface:**
- **Wyoming vs New Mexico.** Slides 0 and 7 say "Wyoming L.C." twice. The formation record in this repo's archive says **MAD Gambit LLC was filed in New Mexico on 2026-03-25**. One of the two is wrong; this is a legal-entity fact on an investor slide, so it needs a definitive answer, not a merge.
- **"MAD Upshot"** (slide 3) is banned by the canonical brand rules (Part II.7) — and the deck is *newer* than the ban, so it was reintroduced rather than simply left stale.
- **Creator Ladder — RESOLVED, the deck is correct.** The deck's tiered creator fee "28.8–60% by status (User / MinorCreator / CR8TR)" is canon: `verify/lib/node-registry.ts` records a founder sign-off dated **31 Jul 2026** adopting the ladder over the flat 40%, and it is implemented as `CREATOR_LADDER` in `gambit-game-math.ts`. Part II.7 has been corrected — the master doc was stale here, not the deck. Two conflicts remain (Wyoming/New Mexico, "MAD Upshot").

**B2.2 — Two blockers to resolve before building.** Both are content problems, not engineering ones:
- **Slides 8, 10, 11, 12 are investor-facing** (cap table, co-building, the ask, co-dev pass). The exterior workbench is a *user* surface. Surfacing fundraising material there leaks it to every visitor. **Recommendation: map only slides 2–7 and 9** to the exterior; keep 1 as ambient branding; gate 8/10/11/12 behind an explicit investor route or drop them.
- **Slide 4 says "MAD Upshot"** — a name `CANONICAL_NUMBERS.md` marks **deprecated, do not use**. The deck predates that rule. Retitle to the card-economy language before it reaches a user surface, or the app will contradict its own canon.

**B2.3 — Bind sections to registry nodes, don't invent state.**
`lib/node-registry.ts` (20 nodes) is already the state source the HUD reads, and several deck sections map straight onto existing node IDs — `tokenomics`, `fee-waterfall`, `staking`, `madconv`, `markets-all` are already used by `LEGEND_IDS`. Map each retained deck section to its corresponding node; where a section has no node, add one to the registry rather than special-casing the component. The registry is a synchronous import, so this stays fetch-free like the current HUD.

**B2.4 — Interaction model.**
Position section panels around the phone exterior on the same convention as `.mg-zoombar` and the existing HUD: `position: fixed`, safe-area insets, `z-index: 50`, glass panel, self-gated on `isDesktop` (`DESKTOP_MIN = 1024`) — there is no exterior space below that width, and the whole feature must no-op on mobile. Selecting a firefly node in B-Phase 1's mesh focuses its corresponding section; selecting a section highlights its node. That reciprocal link is what makes it a *secondary experience* rather than a sidebar — one shared selection state, two representations.

**B2.5 — Content extraction.**
Port `slidesData.ts`'s retained slides into a typed module (`lib/ov-deck-content.ts`) at author time — headline, 2–4 bullets, bound node ID, accent. Do **not** fetch from the deck repo at runtime and do **not** parse the old HTML export. Reconcile every number against Part II.7 canon first (see B2.1a); where deck and canon disagree and the conflict is unresolved, omit the figure rather than shipping a contradiction.

**B2.6 — Reuse, don't duplicate.** `components/ov-deck-selector.tsx` already exists (3 named deck versions driving live conviction math via `OV_DECKS`/`calculateDeltaLimit`). Check whether the new selector should extend it rather than adding a second deck concept with the same name.

**Exit:** a desktop-only exterior experience where the Octavian constellation and the deck sections are two views of one selection state, carrying only user-appropriate content at canonical numbers.

### Explicitly not doing

VRF for market resolution · VRF for cosmetic randomness · VRF behind Postgres-only routes · expanding near-miss onto real-money surfaces (founder decision, see Part III) · surfacing investor-only deck slides on a user surface (B2.2).

---

## PART VI — MASTER MATHS & ALGORITHMS

*The canonical algorithm set. **The code is the authority** — every formula cites its
implementation home (`file#symbol`), and where a doc and the code disagreed, the code won.
Canonical libs: `verify/lib/gambit-game-math.ts` · `mpp-math.ts` · `bayesian-conviction.ts` ·
`gdelt.ts` · `card-evolution.ts` · `sentiment.ts` · `market-classifier.ts` · `joy-engineering.ts`.
Numeric source of truth is Part II.7; unresolved contradictions are §13 below.*

>
> **It has exactly one companion: **PART VII below****
> — the engine room. The split is deliberate and is the only one: *this* file is the
> canonical algorithm set with each formula bound to its implementation
> (`file#symbol`); the companion holds the tokenomics engine formulas (sell-pressure,
> emission, absorption models) in narrative form. The two are numerically consistent;
> if they ever disagree, **this file and the code win**. Do not create a third maths doc.
>
> Platform state, canonical numbers, deployment and security context live in
> this document.
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

### §1 — Canonical constants (authoritative: `gambit-game-math.ts#PLATFORM`, `#STAKING_TIERS`)

| Constant | Value | Code home |
|---|---|---|
| Platform fee | **1.88%** (`FEE_BPS 188`) — never changes | `PLATFORM.FEE_BPS` |
| Creator share of fee | **Sliding 28.8% → 40%** by ladder rung (User 2880 · MinorCreator 4000 bps), off the gross, creator-made markets only | `CREATOR_LADDER` · `PLATFORM.CREATOR_SHARE_BPS` (= the 40% rung) |
| VIP profit share | **60%**, limited to **4,888 seats** — rare and exclusive, not a traction rung (founder, 2026-10-23). ⚠️ Pinned, **not yet enforced**: `CR8TR` still reaches 6000 bps by traction with no seat count (Part 0 §5) | `VIP_PROFIT_SHARE_SEATS` · `VIP_PROFIT_SHARE_BPS` · `vipSeatAvailable` |
| Golden Ticket → VIP seat | Supply **4,888** (= the seat pool) · minimum conversion **2,888** · a holder qualifies with **three creator markets, each ≥ 188,000 volume** (founder, 2026-10-23); a seat is obtained by **purchasing** a Golden Ticket NFT (founder, 2026-11-09) — whether the three-market test still applies on top is open, Part 0 §3. **Not in code** — Part 0 §5 | — |
| Community share of fee | **28.8% of platform NET** — after the creator cut, never of gross (`COMMUNITY_SHARE_BPS 2880`) | `PLATFORM.COMMUNITY_SHARE_BPS` · `#splitFee` |
| Shield recovery — standard | **28.8%** | `PLATFORM.SHIELD_RECOVERY_PCT` |
| Shield recovery — the scale | **28.8% → 40%**, continuous in the 2–4% premium, capped by staking tier; **40% is the ceiling** (founder, 2026-10-23) | `#calculateShieldPayoutFull` · `STAKING_TIERS[].shieldRecoveryPct` |
| Shield recovery — shielded ceiling | **40%** | `PLATFORM.SHIELD_RECOVERY_PREMIUM_PCT` |
| ~~Shield recovery — Whale/VIP~~ | ~~60%~~ — **engine only, not canon.** Still pays when whale-eligible; removal awaits founder confirmation (Part 0 §5). Never quote it | `PLATFORM.SHIELD_RECOVERY_WHALE_PCT` |
| Shield premium band | **2%–4%** of bet | `PLATFORM.SHIELD_PREMIUM_MIN/MAX` |
| $MADx fixed supply | **888,888,888** | `PLATFORM.MADX_FIXED_SUPPLY` |
| Furnace burn cap | **≤4.9%** / 30d | `PLATFORM.FURNACE_BURN_CAP` |
| Card pack cost / size | **4.88 $MADx** / **5** cards | `PLATFORM.CARD_PACK_COST/SIZE` |
| Canonical deck size / seed | **992** / **8888** | `PLATFORM.TOTAL_DECK_SIZE/CARD_GENERATION_SEED` |

**Staking tiers** — the four-tier **eights ladder** by stake amount (founder sign-off 31 Jul 2026). Authoritative: `STAKING_TIERS`, pinned by the `staking — 4-tier eights ladder` tests and mirrored on-chain by `contracts/src/MADStaking.sol` (reconciled 2026-09-01). Each tier is also the **Shield gate** — it caps how far up the 28.8% → 40% scale a holder can go:

| Tier | Min $MADx | APY | Shield recovery cap |
|---|---|---|---|
| Bronze | 88 | 8.8% | 28.8% |
| Silver | 888 | 18.8% | 32.8% |
| Gold | 8,888 | 28.8% | 36.8% |
| MAD Tier | 88,888 | 38.8% | 40.0% |

VIP (≥ 888,888 $MADx, `VIP_STATUS_MIN_MADX`) is a capital-side **status**, not a tier. Effective APY = tier APY × (1 + clout/200), so 77.6% at clout 200 on MAD Tier — earned, never promised.

> *Corrected 2026-10-23:* this table showed a superseded six-tier ladder (Bronze 100 / 12% … MAD Tier 100,000 / 68%) that neither the engine nor the contract has carried since the 31 Jul ruling. Other ladders in older tokenomics docs (lock-duration 8.8/18.8/28.8/68; rarity-multiplier 8→68) are also not the code. See §13.

---

### §2 — Conviction & continuous markets

- **MADConv (conviction):** spec `M = t^1.35 · c^0.75 · d^1.45 · ψ^1.15 · (1+π^0.9) · m_meme · satire · liar · garch_amp`. **Implemented core (corrected 2026-10-27):** `#calculateConviction` multiplies only `t^1.35 · c^0.75 · d^1.45 · ψ^1.15 · M_nft · L_θ`; safe wrapper `#calculateConvictionSafe`. The other five terms are **not composed anywhere**: `m_meme` exists (`paseome.ts#memeMultiplier`), `garch_amp` exists (`#garchAmplification`, 1 + 0.8σ), `liar` exists as `#zLiarMeter`, but `satire` has no multiplier and **π is defined in no source in the repo**. `docs/boardy/FEATURE_TRACEABILITY_MATRIX.md` already rates the full form *Conceptual — do not call it live*. Wiring it needs a founder definition of π and of the satire term (PART 0 §3).
- **GARCH(1,1) volatility:** `σ²ₜ = ω + α·ε²ₜ₋₁ + β·σ²ₜ₋₁` (ω=0.0001, α=0.05, β=0.90); `garch_amp = 1 + 0.8σ`, clamped `0.09 ≤ σ ≤ 0.68`. Home: `#garchUpdate`. Asymmetric extensions: `bayesian-conviction.ts#egarchLogVar`, `#cgarchUpdate`.
- **DL-LMSR (continuous market maker):** cost `C(q) = b·ln Σ e^(qᵢ/b)`; price `P(i) = e^(qᵢ/b) / Σ e^(qⱼ/b)`. Homes: `#calculateDLLMSRCost`, `#calculateDLLMSRPrice`. Liquidity `b` scales with volume via `#calculateVolumeScalingAlpha`.
- **Kelly sizing:** `f* = (p·(b+1) − 1) / b`, half-Kelly default (`scale=0.5`). Home: `#kellyFraction`.
- **δ-limit (position cap):** `#calculateDeltaLimit(multiplier, convictionStake)`.
- **Market classification** (Progression / Saga / Z-Liar / Perp taxonomy): `market-classifier.ts` composing `zLiarMeter` + perp-trigger + sentiment.

### §2b — The Paseome: Certain-UnCertainty (`paseome.ts`)

Perp families 7 and 8 — the forward side (internal label `foresight`, oracle-settled) and the counterfactual side (`hindsight`, never settles). The certainty is the arithmetic; the uncertainty is kept **epistemic**, never aleatory.

- **Frontier pricing — DL-LMSR, log-sum-exp:** `pᵢ = e^((qᵢ−m)/b) / Σ e^((qⱼ−m)/b)`, `m = max q`. Σp = 1 by construction; `b = FRONTIER_B = 1,200`; **3–5 branches** (`FRONTIER_MIN/MAX`, enforced by a throw). Home: `#frontierPrices`, `#frontierSum`. The max-subtraction is load-bearing — the naive form overflows to NaN past q/b ≈ 709 (≈ 851k shares at b = 1,200); Part 0 §7.
- **The certain part — the maker's worst-case loss:** `b · ln n` = **1,318 / 1,664 / 1,931 $MADx** for n = 3 / 4 / 5. Fixed before a single trade.
- **Path price:** product of the branch prices along the path (`#pathPrice`); deep what-ifs get cheap on their own. **Knife Edge** sort: `|p − 0.5|` ascending (`#knifeEdgeDistance`, `#rankByKnifeEdge`) — the uncertainty ramp peaks at p = 0.5 (Fiorillo, Tobler & Schultz 2003).
- **MCI score → `m_meme`:** count the expectation categories a branch violates; optimum is exactly one (`MCI_OPTIMUM`). Fitness 0 → 0.35 · 1 → 1.0 · 2 → 0.5 · 3+ → max(0.1, 1/(1+(v−1))). `memeMultiplier = 0.85 + 0.50 · fitness`, bounded **0.85–1.35** so memetics never outweighs time held or capital (`#mciScore`, `#memeMultiplier`).
- **Irrealis constraint:** a counterfactual title must carry the counterfactual mood (`#hasIrrealisMood`); benignity rises with path depth (`#benignityAtDepth`).
- **Settlement (`#settleFrontier`):** forward side — the taken branch pays, every untaken sibling is **refunded in full**; counterfactual side — nothing settles, every branch carries. Counterfactual print = permanent − transitory from `cgarchUpdate` (`#hindsightDivergence`); ranked on calibration (`brierScore`, `logScore`).
- **Who authors, who earns (founder, 2026-10-23):** an open conviction market — VIP (`VIP_STATUS_MIN_MADX`) **or** MinorCreator+ authors (`#canAuthorBranch`) and earns their rung on the trees they open. The platform offers trees of its own to a lesser extent, with **no creator cut**: `#paseomeFeeSplit(volume, "platform")` ≡ `splitFee(volume, 0)`; an unknown origin or non-finite share also pays no creator cut.
- **Leg:** 59.061 d on the global lunar grid (`lib/lunar-legs.ts`). Fee: the flat 1.88%.
- **3D view (`paseome-graph.ts`, 2026-11-01):** node size and reach encode price (`#branchRadius`, `#branchPosition`); forward nodes are spheres, counterfactual ones faceted; the sharpest Knife Edge (rank 1) wears a gold ring. A counterfactual branch without irrealis mood is **withheld, not drawn** (`#buildPaseomeGraph` — the route reports the flag so a client can refuse it). No depth-2 nodes: the API reports a two-hop path *price*, not nodes, and inventing them would be fabrication. The desk draws a market from its own book (`#snapshotFromMarket`: prices are `prices(outcomes, b)`, the same DL-LMSR the ticket quotes; `source: "demo"` because the floor's books live in the browser).

### §3 — Liar meter & scandal signal

- **Z-Liar meter (implemented):** `BS = 100·(0.6v + 0.4(1−s) − 0.25k)` (`#bsIndex`), `LieScore = BS + min(20, 100σ) + ½·tilt_lunar` (tilt 0–15, so ≤ 7.5), clamped 0–100 into five bands STRAIGHT SHOOTER → TOTAL FABRICATION (`#ZLIAR_BANDS`). Home: `#zLiarMeter`. **Target model (spec, not built):** four signals — deception .35, contradiction .30, sentiment shift .20, vocal anomaly .15. *Corrected 2026-10-27: this line gave the four-signal spec as the implementation.*
- **Lie impact:** `LieImpact = LieScore × EconMult × ψ_agg × VolAmp`.
- **Scandal velocity (GDELT):** `Σ EMOTION_WEIGHTS·e` (shame 1.8 · anger 1.4 · disgust 1.3 · fear 1.2 · sadness 1.0 · joy −0.5), clamped ≥0. Home: `gdelt.ts`.
- **Perp trigger probability:** `P = 1 − exp(−0.25 · matches · themeWeight · (1+velocity))`, bounded 0..1. Home: `gdelt.ts`. *(The handoff's "r²=0.94" is an unverified Grok claim — decorative until measured on real data.)*
- **Sentiment:** lexicon (VADER-style) scorer — `sentiment.ts` (explicitly not a transformer).

### §4 — Bayesian conviction layer (`bayesian-conviction.ts`)

`bayesianUpdate` · log-odds `toLogOdds`/`fromLogOdds`/`sequentialLogOddsUpdate` · hybrid `madconvHybridUpdate` (`M^0.85·(1+β·bayes)`) · decision tree `propagateTree` (depth-bounded 64) · `voiEstimate` · `computeEdge` · `shouldAct` · proper scoring `brierScore`/`logScore`. Surfaced at `POST /api/v1/bayesian/{update,tree,voi,score,garch}`.

### §5 — MAD Shield engine (`gambit-game-math.ts`)

- **Premium:** `Stake × P(win) × √Volatility × SafetyMargin`, clamped to the 2–4% band. Home: `#calculateShieldPremium` / `#shieldPremium`.
- **Recovery — a scale, 28.8% → 40%:** 28.8% standard; the premium tier (0..1) moves it continuously up to the 40% ceiling; the staking tier caps the top (§1). Homes: `#calculateShieldPayoutFull` (the resolver product code should call), `#calculateShieldPayoutTiered`, `#shieldRecovery`. ⚠️ The resolver's whale branch and `shieldRecovery(loss, vip=true)` still pay **60%** — engine only, not canon (founder, 2026-10-23); removal awaits confirmation, Part 0 §5.
- **φ-shield ratio:** golden-ratio-weighted (`PHI = 1.618…`). Home: `#shieldPhiRatio`.
- **Lifecycle:** `#createShieldOptIn` · `#requestShieldUnstake` · `#calculateShieldReturnWindow` · `#isShieldUnstakeComplete` · `#shieldReturnCountdown`. Whale gate: `#WHALE_SHIELD_ELIGIBILITY`.
- **Compliance:** MAD Shield is **loss mitigation, never insurance/subsidy** — keep framing server-side and in canon.

### §6 — Fee & revenue split

`splitFee(volume, creatorShareBps)` — **two-stage waterfall, corrected 2026-08-27 (founder sign-off, PR #145):** `grossFee = volume·1.88%`; `creatorCut = grossFee·rung` on creator-made markets only; `platformNet = grossFee − creatorCut`; `communityCut = platformNet·28.8%`; `protocolCut = platformNet − communityCut`. ~~`communityCut = grossFee·28.8%`~~ was the bug: on a 40% creator market it over-allocated **11.52 pp of gross** (community now 17.28% of gross, matching canon to the decimal). Regression-tested. Home: `#splitFee`. Per 10,000 $MADx: gross 188.00 → platform tree 0 / 54.14 / 133.86 (creator / community / protocol) · User rung 28.8% 54.14 / 38.55 / 95.31 · MinorCreator 40% 75.20 / 32.49 / 80.31 · VIP seat 60% 112.80 / 21.66 / 53.54. The 60% row needs a VIP seat (≤ 4,888, `vipSeatAvailable`) — not yet enforced. **Furnace burn** ≤4.9%/30d: `#calculateFurnaceBurnPercent` (live via `revenue-engine.ts`).

> ⚠️ The creator rung (28.8–40%; 60% on a VIP seat) and the 28.8% community are **non-additive by design** (creator = per-market gross; community = platform-net). Never wire governance to `FEE_BPS`/`CREATOR_SHARE_BPS`. §13.

### §7 — Staking yield

`calculateStakingYield` — base tier APY (§1, the eights ladder) × NFT-clout boost `1 + clout/200` (max 77.6% effective at clout 200 on MAD Tier). Home: `gambit-game-math.ts`. Surfaced `POST /api/v1/staking/yield`. On-chain: `MADStaking.sol` (rewards from a separately-funded reserve — a stake never funds another's rewards).

### §8 — Card economy

- **Rarity table & drop weights:** `#RARITY_TABLE`, `#RARITY_DROP_WEIGHTS`, `#RARITY_ORDER` (Common 88 → Mythic 99,999 1-of-1).
- **Evolution:** ladder `#EVOLUTION_LADDER`, `#nextEvolution`, `#attemptEvolution`; burn costs `#EVOLUTION_BURN_COSTS`.
- **Wear:** `#calculateUsageWear`/`#applyUsageWear` + `#RARITY_WEAR_PCT`.
- **Pack pricing:** `#scandalPackPrice` + `#SCANDAL_PACK_TIERS`/`CAP`/`FLOOR`; Dutch auction `#getAuctionPrice`. Surfaced `POST /api/v1/packs/price`.
- **Streaks:** `#streakReward`.

### §9 — Governance

`#quadraticMatch(contributions)` returns the **match**, `(Σ√cᵢ)² − Σcᵢ`; total funding is `(Σ√cᵢ)²` (decks that write "match = (Σ√cᵢ)²" mislabel the total). `mpp-math.ts#calculateGovernanceThreshold`. Surfaced `POST /api/v1/governance`. Voting power `#votingPower = min(√stake, 240)` — the "24×" is the same cap measured against a 100-$MADx holder. **Futarchy "executes above 80% pass probability sustained 24 h" is UI copy only** (`components/futarchy-board.tsx`); no code enforces it.

### §10 — Behavioural / joy layer (`joy-engineering.ts`)

VRS Fibonacci triggers `#VRS_TRIGGERS = [5,8,13,21,34]`, `#isVrsTrigger`; `#LOSS_AVERSION = 2.5`, `#lossAversionWeight`; decays `#temporalDecay`/`#stochasticDecay`/`attentionDecay`; `viralityIndex`, `getFibonacciReward`, `calculateUserDopamineIndex` composed into `computeJoyState`/`rewardForTenure`/`momentumIndex`. Surfaced `POST /api/v1/joy/state`.

> **Compliance:** framed as game-economy engagement — never "dopamine/addiction/VRS-as-addiction" in external materials (keep the mechanic, cut the neuroscience framing).

### §11 — Tournament / PvP

Victory probability `#calculateVictoryProbability`; Elo-style `#mmrDelta` (K=32); prize bands `#PRIZE_BANDS`/`#prizeForRank`; tournament scoring `#calculateTournamentScores`; `#TOURNAMENT_PRIZES_BPS`.

### §12 — Thematic / temporal

Lunar phase multiplier `#getLunarPhaseMultiplier` / illumination `#getLunarIllumination` (`LUNAR_CYCLE_MS`, `IMMACULATE_CONCEPTION_EPOCH_MS`); golden ratio `#PHI`; EigenTrust `#assignTrustScore`.

### §12b — Economic-impact & virality dynamics (MAD HAT Math Spec v1.0, Drive handoff)

Folded in from `MAD_HAT_Mathematical_Handoff_Document.md` (Drive). These are the pieces of the spec that were **not** already covered above; status tagged against the code.

- **Projected stock/brand move:** `ProjectedStockMove_t = LieScore · σ_t · k_category` (k ≈ 0.019 baseline, per asset class/virality). ⚠️ **Spec only — NOT in code yet.**
- **Ad-revenue / brand erosion:** `AdRevenueLoss_t = LieScore · σ_t · 0.9` ($M); confidence band `58 + LieScore · 0.32`. ⚠️ **Spec only — NOT in code yet.**
- **Virality ODE (impressions growth):** `dI/dt = β · E_agg(t) · (M − I(t)) · (1 + η · Conv̄(t))`. Code ships **discrete approximations** — `gambit-game-math.ts#viralityScore` / `#viralityIndex` — not the literal ODE integrator.
- **Effective-time / attention decay (integral form):** `t_eff = ∫₀ᵀ a(u) · e^(−λ(T−u)) du`. Code ships the discrete `#attentionDecay` / `#temporalDecay` / `#stochasticDecay`. Meme drops + high-LieScore events recharge attention.
- **Non-binary market structure (CIRO):** Continuous (DL-LMSR) + Over/Under only; legs **45–90 days, never < 30** (30-day minimum-maturity compliance); Conviction Saga auto-relaunches next leg, MADConv profile compounds across legs. (Structure/compliance rule — enforced in market config, not a standalone formula.)

> The three ⚠️ items are the only maths from the Drive handoff **not yet implemented** — they belong in the Liar-Impact / market-projection surface (Part T-B of the plan). Everything else in the handoff is already in code (§2–§4).

---

### §13 — ⚠️ Contradictions requiring founder sign-off (do NOT silently resolve)

These conflicts exist **across the old docs**; the maths/formulas are reconciled to code above, but these **numbers/decisions are the founder's to lock**:

1. **$MADx token distribution — two different splits.** `CANONICAL_NUMBERS.md` (Public 35% / Liquidity 20% / DAO 15% / Team 10% / Staking 10% / Reserve 10%) vs `madx-token-system.md` (Community&Gameplay 45% / DAO 15% / Liquidity 15% / Team 15% / Seed&Private 10%). **Pick one.**
2. **$MADx contract address — two values, and the better-documented one is wrong.** `CANONICAL_NUMBERS.md` → `0xb61ae7727579e3781ca0ec4902b6ba21d335fd18`; master action plan (Part AB, claimed on-chain-verified as symbol MADx / name MADDEX) → `0x6972370e1caAA3624F37D7e87C28e1089D00151f`. **Corrected 2026-10-23 by a live Blockscout read of chain 42161:** the first address is **"Serpentine Orkain" / ORKx**, a different token with 2 holders and a 60.07 supply — so `DEPLOYED_ADDRESSES.md:7`, `verify/app/api/v1/cards/route.ts:36` and `verify/docs/CARD_CANONICAL_REFERENCE.md:20` are all citing a non-$MADx contract. **Resolved 2026-10-26:** the founder confirmed `0x6972370e1caAA3624F37D7e87C28e1089D00151f` as the real `$MADx`, and those three files now carry it. Any copy of `CANONICAL_NUMBERS.md` that still cites `0xb61…` needs the same fix.
3. **Staking model framing** — stake-amount tiers (code/contract, §1) vs lock-duration APY (8.8/18.8/28.8/68) vs rarity-multiplier (8→68). Code is authoritative; confirm the marketing framing matches.
4. ~~**Primary chain**~~ — ✅ **RESOLVED, founder sign-off August 2026.** The chain story is locked as:
   - **Arbitrum Nova (42170)** — launch and gameplay chain
   - **Arbitrum One (42161)** — MAD Shield vaults, liquidity and $MADx
   - **HyperLiquid (HyperEVM)** — secondary distribution/liquidity venue, never the canonical record
   - **Arbitrum Sepolia (421614)** — testnet

   Two notes on how this resolved. First, `contracts/foundry.toml` was already the ground truth and already said exactly this (`arbitrum_nova` "launch/gameplay chain (42170)", `arbitrum_one` "MAD Shield vaults / liquidity (42161)"), so the ruling ratifies the code rather than overriding it. Second, one leg of the stated three-way conflict was **phantom**: there is no `CLAUDE.md` anywhere in this repository, so the "Base L2" position it was credited with had no source here. Where "Base L2" does still appear it is either explicitly flagged as wrong (`MAD_GAMBIT_MASTER_ACTION_PLAN.md`), explicitly flagged as aspirational (`MAD_GAMBIT_MASTER_PLAN.md`), or in superseded 2024 material. `CANONICAL_NUMBERS.md`'s "Arbitrum One is primary" was not wrong so much as **incomplete** — One is primary for vaults and $MADx; Nova is primary for gameplay. Both rows are corrected in this change.
5. **Seed range** — `$1M–$2M` (CANONICAL_NUMBERS) vs `$1.24M–$2.48M @ $12M pre` (skill + master plan) vs **`$1.48M–$2.48M`** (3-minute script, 2026-10-27), plus bridge asks of $250–500K / $400K / $668K–$680K. **Pick one public range.** (PART 0 §3, "One ask".)
6. **Y3 revenue** — $154.5M / $121.4M / $86–154M across decks. **Pick one.** (Carried from master action plan Part A.) *Volume-side cross-check, added 2026-11-09 from the 2026-10-23 Paseome close-out:* the stated Y3 volume of $3.6–4.2B × 1.88% is about **$73.3M** of market fees (at the $3.9B midpoint) against the **$154.5M** stated gross — the other ~53% depends on revenue streams `lib/revenue-engine.ts` marks `planned`. A model has to show that split before an investor sees the number.
7. ~~**Community 28.8% semantics**~~ — **RESOLVED 2026-08-27, founder:** *"flat platform rake of 1.88%, the Community profit share is 28.8% of NET profits, the creator profit share is only from activity and fees from those creator made markets."* Implemented in `splitFee` (PR #145). Contracts must implement the same waterfall.
8. **The 60% Shield rung — engine vs canon.** Founder 2026-10-23: *"MAD Shield Stop Loss (28.8 to 40%)"* — the Shield is a 28.8% → 40% scale. The engine still pays 60% to whale-eligible holders (`SHIELD_RECOVERY_WHALE_PCT`, `WHALE_SHIELD_ELIGIBILITY`). Docs now say 40%; the code waits on your confirmation because removing it lowers payouts (Part 0 §5).
9. **How a VIP seat is obtained.** 60% is limited to 4,888 seats; bought, earned or granted — and whether `CR8TR` traction still qualifies — decides the seat registry. Until answered, `VIP_PROFIT_SHARE_SEATS` is pinned but does not gate payouts. **Partly answered 2026-10-23 (Part 0 §3):** seats come from the Golden Ticket event — supply 4,888, minimum conversion 2,888 — and a holder qualifies with three creator markets, **each** ≥ 188K volume. **Answered 2026-11-09:** *bought* — by purchase of a Golden Ticket (NFT), in the open-beta-launch campaign. Still open: does a purchased ticket convert, or *is* it the seat? price and sale mechanism? CR8TR traction? which volume?
   - **How rare 188K is.** Published analyses — the platforms' per-market APIs were egress-blocked from the agent sandbox, so these are not independently re-checked. **Polymarket** (CNBC, closed markets 2021 → May 2026): ~70% traded under $10K, fewer than 10% landed in $100K–$1M, ~5% traded nothing. **Kalshi** (Whelan, 2021 → Apr 2025): median ~$9K per contract, top decile averaging ~$526K, bottom ~$1.2K — and that sample already drops contracts under $1K. **Both** (Evercore ISI): ~8% of markets reach $1M. **Limitless**: only platform totals published (~$1B/month notional, Apr 2026, mostly hourly/daily crypto-price markets), so no per-market figure. **"Lit"**: no prediction market found by that name; the search returned Lighter (LIT), a perps exchange. **So 188K per market ≈ the top 10% on the largest venues.**
   - **What the threshold implies.** 188,000 × 1.88% = **$3,534.40** of fees per market, **$10,603.20** across three. Minimum conversion (2,888 × 3 = 8,664 markets) needs ≥ **$1.63B** of volume on those markets alone — **$30.6M** in fees — 39–54% of the Year-3 volume the decks cite ($3.0B–$4.2B annual, depending on the deck); full conversion (14,664 markets) needs **$2.76B** / **$51.8M**. At a ~1-in-10 hit rate that is roughly 87,000 creator markets opened — a scale check, not a forecast. Build the conversion target and the Y3 volume plan from the same assumptions.
   - **Gaming it.** A creator who wash-trades their own markets pays the full fee and gets back only their rung: faking three 188K markets costs **$6,362** at the 40% rung, **$7,549** at 28.8%. The seat lifts the cut 40% → 60%, an extra 0.376% of volume, so the faking cost is recovered after **~$1.69M** of later volume. The rule needs a wash-trade filter on qualifying volume (distinct counterparties, or volume net of the creator's own wallets).

---

### Appendix — superseded documents (now pointers to this file)

- `docs/imported/tokenomics/engine-room-math-formulas.md`
- `REPORTS/GARCH_VULKAN_ADVANCED.md`
- `docs/VULKAN_MAD_MAPPING.md`
- `docs/SHIELD_RISK_DEFENCES.md`

**Canonical numbers** now live in **Part II.7 above** (consolidated 2026-08-16 from the former `docs/imported/tokenomics/CANONICAL_NUMBERS.md`) — cross-checked against §1 here; resolve §13 under founder sign-off. The unresolved splits noted in §13 are carried forward in the master doc's Part II.9. **Engine-room formulas** are the companion **PART VII below**. The former `MASTER_TOKENOMICS.md` narrative and `docs/MECHANISM_ORACLE_MADX_RESEARCH.md` were consolidated into the master doc; their originals are in git history.

---

## PART VII — THE ENGINE ROOM: TOKENOMICS FORMULAS

*Companion to Part VI: the tokenomics engine in narrative form (sell-pressure, emission,
absorption, burn). Numerically consistent with Part VI and Part II.7 — if they ever
disagree, **Part VI and the code win**.*

> Extracted from: Whitepaper Section 09, GitHub Presentation, EVM Implementation Guide

---

### 1. SELL PRESSURE MODEL

```
SellPressure(USD) = UnlockedTokens × SellThroughRate × (1 − StakingAbsorption) × TokenPrice
```

| Parameter | Base | Bear | Bull | Stress (5%) |
|-----------|------|------|------|-------------|
| Price Multiplier | 1.00× | 0.30× | 2.00× | 0.15× |
| Volume Multiplier | 1.00× | 0.50× | 2.00× | 0.25× |
| Sell-Through Adj. | 0 | +1.75 | -0.75 | +2.50 |
| Staking Absorption Adj. | 0 | -0.60 | +1.20 | -0.80 |
| Shield Pool Impact (Y1) | +$1.8M | +$0.4M | +$5.2M | +$0.1M |

StakingAbsorption: 82–85% (driven by NFT staking requirement)
Initial Depth: $7.5M+ absorbs 3× Day-1 bear pressure at <1.5% slippage

### 2. MAD SHIELD PREMIUM — RISK ALGORITHM

```
Φ = S × P(win) × √σ²(t+1) × λ(SafetyMargin)
```

Worked Example: $100 stake on 50/50 market
→ Premium = $3.00 (3%)
→ Pool collects $3. If LOSE → Pool pays $28.80
→ Monte Carlo: Year 1 Net Pool +$1.8M (94% positive across 1,000 scenarios)

### 3. GARCH(1,1) VOLATILITY ORACLE

```
σ²(t+1) = ω + α·ε²(t) + β·σ²(t)
```

- Calculated on-chain via fixed-point arithmetic
- Parameters seeded per card at mint time, updated via Chainlink Automation
- Calm markets = cheap Shield; volatile markets = expensive Shield

### 4. DL-LMSR BONDING CURVE — INSTANT LIQUIDITY

```
P(i) = e^(q(i)/b) / Σ e^(q(j)/b)
```

- Every position always tradeable — protocol is counterparty
- Dynamic b parameter scales with volume
- Popular markets self-deepen liquidity
- Eliminates external market makers

### 5. STAKING REWARD DISTRIBUTION

```
R(u) = Y(pool) × (Stake(u) × M(nft)) / Σ(Stake(j) × M(j))
M(nft) = 1.0 + (Clout / 200)
Max APY: 68%
```

- Clout stat (0–200) determined by card rarity
- Golden Hand Clout=200 → M_nft=2.0× multiplier
- Yield pool funded by: 25% platform fees + Shield premiums + DeFi yield

### 6. REVENUE DISTRIBUTION FORMULA

```
Creator-Made Market: 40% of Fee (0.752% of Vol) → Creator → Creator | 60% → Platform
Platform-Made Market: 100% → Platform (1.88% of Vol)
Platform Allocation: 35% Ops | 25% Shield | 10% Burn | 30% Community
```

### 7. CARD EVOLUTION BURN SCHEDULE

| Rarity | $MADx Burned Per Evolution | Clout Range |
|--------|---------------------------|-------------|
| Common | 100 | 0-30 |
| Uncommon | 250 | 31-60 |
| Rare | 500 | 61-100 |
| Epic | 1,000 | 101-140 |
| Legendary | 1,500 | 141-180 |
| Golden Hand / Mythic | 2,500 | 181-200 |

### 8. MONTHLY BURN CAP

```
MaxBurn(30d) = TotalSupply × 0.049 = 43,555,555 $MADx
```

Prevents deflationary death spiral. Hard-coded in contract.

---

## PART VIII — HOSTING PLATFORM EVALUATION (2026-08-18)

> ## ✅ DECIDED — staying on Vercel + Neon (2026-08-18)
>
> **Read this before reading the rest.** This part is a **contingency plan, not a proposal.**
>
> **What the audit actually found was optionality, not a verdict.** It was commissioned as "find an
> up-and-coming Vercel alternative"; it answered that, and Sevalla is the ranked pick if the day
> comes. What it did **not** find is a reason to go — no cost wall, no scaling limit, no capability
> gap. The live problems are the CI outage (Part 0 §1), the three-database Neon split (Part II.5)
> and the report-only gates. **None of those are Vercel's doing, and none of them improve on another
> host.** Do not mistake "the exit is cheap" for "the exit is indicated."
>
> **A timing point that would hold even if the merits were closer:** hosting cannot be migrated
> while GitHub Actions is refusing to run jobs. That move is precisely the change that needs
> type-check, build, tests and secret scan watching it, and right now none of them execute.
>
> **What would reopen this**, in rough order of likelihood:
> 1. A Vercel bill that outgrows the platform's value — the only argument with real force, and it
>    needs your actual invoice, which no agent can see.
> 2. Sustained connection-pool pressure under `pg` (ADR-008) that a persistent container would fix.
> 3. Needing long-running workers or queues — genuinely awkward on Vercel, native on the §3 field.
> 4. A Vercel platform incident of the severity Railway's 2026 record shows (§5).
>
> Absent one of those, **the cheapest correct action is to do nothing**, and the §1 coupling table
> is the reason that stays true: the exit does not get more expensive by waiting.

*Everything below is the audit as run, kept for whenever one of those triggers fires. The §7
‹verify› list still applies — those figures were never confirmed against live pages.*

### 1 · The finding that decides this: the app is barely coupled to Vercel

Measured against the tree, not assumed. **Every** Vercel-specific surface in `verify/`:

| Surface | Extent | Portable? |
|---|---|---|
| `next.config.ts` | already `output: "standalone"`, and its own header comment says *"works directly in AI Studio and Google Cloud Run… run with `node .next/standalone/server.js`"* | **already portable — this was built to run in a container** |
| `@vercel/*` imports | **two, in the whole app**: `lib/vercel-blob-store.ts` and one `@vercel/speed-insights` line in `app/layout.tsx` | yes |
| `lib/vercel-blob-store.ts` | 44 lines, **one** consumer (`app/api/v1/registrar/lapse/route.ts`), and it already implements a pre-existing `ObjectStore` interface from `lib/portrait-vault` | yes — an S3 swap is a *second implementation of an interface that already exists*, not a refactor |
| `process.env.VERCEL*` | **zero references** in application code | n/a |
| `export const runtime` | **zero** — nothing is pinned to the Edge runtime, so `proxy.ts` is a plain Node proxy | yes |
| ISR | no page-level ISR at all; two route handlers carry `revalidate = 300` (`feeds`, `news/satirical`) | yes, with a caveat — §4 |
| `vercel.json` headers | **redundant**: `next.config.ts`'s `SECURITY_HEADERS` is a strict superset (adds CSP, Referrer-Policy, Permissions-Policy) | yes — headers travel with the framework, not the platform |
| `vercel.json` `crons` | 3 daily jobs — `cron/rollup` 00:00, `perps/roll` 00:00, `registrar/lapse` 00:30 (the 30-min `ingest/gdelt` schedule dropped 2026-10-27: Hobby allows daily only) | **the one real port**: needs a platform scheduler |
| `vercel.json` `git` / `ignoreCommand` | Vercel-only branch rules | replaced by the new platform's equivalent |
| Database | **Neon, an independent managed Postgres reached over `DATABASE_URL`** — not Vercel Postgres | **does not move at all** |

**The shape of this app argues for a container, not for serverless.** 90 route handlers, a custom
SIWE proxy, three crons, and ADR-008's `pg` **Pool** — a long-lived pool is actively penalised by
per-request serverless isolates and is exactly right on a persistent Node process. The one thing
Vercel does that a container does not is per-route autoscaling and CDN-backed ISR, and this app
uses neither.

**Conclusion: the lock-in is one 44-line file, one analytics import, and three cron entries.**
That is the whole cost, and it is low enough that platform choice should be decided on merit
rather than on switching cost.

### 2 · Why the question is answerable at all in 2026

**Next.js 16.2 (March 2026) shipped a stable, public Adapter API**, built with OpenNext, Netlify,
Cloudflare, AWS Amplify and Google Cloud. Platforms no longer reverse-engineer `.next/`; the build
emits a typed, versioned description of routes, prerenders, assets, runtime targets and caching
rules. This is what unblocked full Next 16 support — `proxy.ts` included — off Vercel.

Status as of writing: **verified adapters for Vercel and Bun**; Netlify, Cloudflare and AWS
(via OpenNext) in active development. Every PaaS below therefore still runs Next.js the *other*
way — as a standalone Node server in a container. For this app that is fine (§1), and it means
adapter maturity is **not** a gating concern for us the way it would be for an ISR-heavy site.

### 3 · Candidates

Ranked against what this repo actually needs: Node container · managed Postgres · S3-compatible
private object storage · scheduled jobs · per-PR preview environments.

| Platform | Own Postgres | Object storage | Cron | PR previews | Read |
|---|---|---|---|---|---|
| **Sevalla** (Kinsta) | ✅ managed, from ~$5/mo | ✅ S3-compatible, R2-backed, $0.02/GB, **zero egress** | ✅ cron process type | ✅ | **Recommended.** Genuinely up-and-coming — took over Kinsta's whole PaaS line on 2026-02-02 — but with an established parent rather than a runway clock. Only platform here that covers all four needs *and* the object-storage half. |
| **Northflank** | ✅ from ~$3.91/mo | via BYOC / S3 | ✅ | ✅ built-in | The serious-infrastructure pick: BYOC, multi-cloud, managed K8s, GPUs, per-second billing, $50/mo free credits. More power and more configuration than this app needs today; the right answer if the platform later grows workers and queues. |
| **Zerops** | ✅ managed, HA option | ✅ S3-compatible | ✅ | ✅ | The most "up-and-coming" of the set — private networking, hostname service discovery, credentials auto-injected, queues and search in-catalogue, 2026 work on workload-aware Postgres tuning. EU-based. Smallest company: the highest-variance pick. |
| **Render** | ✅ compute ~$6/mo + $0.30/GB storage | ❌ | ✅ | ✅ | Boring and safe, and *not* up-and-coming. Note: **no native ISR** on a standalone server — irrelevant here (§1). |
| **Railway** | ✅ auto-injected `DATABASE_URL`, one-click HA Postgres (Patroni, Mar 2026) | ❌ | ✅ | ✅ | Best DX and the tightest DB integration — **but see §5.** |
| **Coolify / Dokploy** | self-managed | self-managed | ✅ | ✅ | Self-hosted on your own VPS. Cheapest at scale, and you become the SRE. Wrong trade for a one-founder team already short on operator time. |
| **Cloudflare Workers** | ❌ (Hyperdrive proxies to an external PG) | ✅ R2 | ✅ | ✅ | Best edge story, and an OpenNext adapter in development — but no first-party Postgres, which is precisely the bonus asked for. |

### 4 · Recommendation

**Sevalla**, with **Neon staying exactly where it is** — at least through the first cutover.

Two decisions, and they should be taken separately:

1. **Move the runtime.** Sevalla runs the standalone build the config already produces, gives the
   `pg` Pool a persistent process to live in, and covers Blob and the three crons with first-party
   services instead of one-off glue.
2. **Leave the database.** Neon is not a Vercel product and nothing forces it to move. Changing
   host *and* database in one step means a failure has two candidate causes. Move the runtime,
   confirm it, and only then decide whether consolidating onto Sevalla Postgres is worth it.

There is a real argument for consolidating later: it would collapse the **three-database Neon
split** (Part II.5) into one migration onto one clean target, and put the database on the same
private network as the app. That is a genuinely attractive endgame — but it is the *second* move,
not the first, and it is gated on the same founder-run inspection that Part II.5 already blocks on.

**The `revalidate = 300` caveat, stated plainly:** on a standalone server that cache is
per-instance. At one instance, nothing changes. Past one instance, `feeds` and
`news/satirical` refetch per pod — which costs upstream calls, not correctness. If it ever matters,
the fix is a shared cache handler, which is the same fix everyone self-hosting Next uses.

### 5 · The case against Railway, since it is the obvious pick

Railway has the best integrated-database experience of the set and would otherwise top this list.
Against it: it published incident reports for **2026-02-11** and for **2026-05-19**, the latter a
~8-hour platform-wide outage after **Google Cloud suspended Railway's own production account** —
API, control plane, databases and compute all down, persistent disks inaccessible. Contractual
SLAs exist only on Business Class and above; Hobby and Pro publish targets without them.

Some of the harshest commentary comes from competitors (Northflank, Kuberns) and should be
discounted accordingly — but the two incident reports are Railway's own. For an app that will
custody real `$MADx` and settle markets on a lunar clock, a single-cloud-account dependency with
no SLA at our tier is the wrong risk, and it is the one factor that outweighs Railway's better DX.

### 6 · Migration checklist, if the decision is yes

Small enough to state completely:

1. `lib/s3-object-store.ts` — second implementation of the existing `ObjectStore` interface. Keep
   `deletable: true`; crypto-shredding depends on it, and a store that cannot really delete breaks
   THE LAPSE. Select on env, keep `vercel-blob-store.ts` until the cutover is proven.
2. Drop `@vercel/speed-insights` from `app/layout.tsx` (and its `connect-src` entry in the CSP).
3. Port the three crons to the platform scheduler. **They stay HTTP calls to the existing routes**,
   still bearing `CRON_SECRET` — the handlers already export `GET` and `proxy.ts` already
   bearer-passes them around the guest gate. Nothing in the app changes.
4. Reproduce the env set (Part II.2). `DATABASE_URL` stops being integration-injected and becomes
   an ordinary secret — **note this**, since Part II.2 currently says never to hand-set it.
5. Point a preview environment at a Neon branch; keep `main` non-auto-deploying to match
   `vercel.json`'s current posture.
6. Cut DNS last, and keep the Vercel project alive until the new one has survived a full lunar leg
   boundary — a roll is the one event no staging environment reproduces.

**Do not** promote CSP `script-src`/`style-src` to enforced during the same change (Part 0 §5).
A white-screen during a host migration is indistinguishable from a failed migration.

### 7 · Facts marked ‹verify›

`sevalla.com` and `docs.sevalla.com` are **egress-blocked from the agent container** (Part 0 §6),
so Sevalla specifics came from search summaries and third-party writeups, not the live pages.
Confirm before committing:

- **Pod pricing** ‹verify›: S1 0.5 CPU/1 GB **$10/mo**, S2 1 CPU/2 GB **$40/mo**, M1 0.5 CPU/2 GB
  **$20/mo**. The S1→S2 jump is 4× price for 2× resources, which is odd enough to be a
  transcription artefact. A Next.js standalone server wants ≥1 GB, so the realistic line is M1 or
  S2 — **the difference between them is the whole cost story**, and it is the one number worth
  checking first.
- **Cron process type** ‹verify›: reportedly a process that launches on schedule and exits, with no
  persistent storage and no horizontal scaling. Fine for three HTTP pokes; confirm the schedule
  syntax and any minimum interval.
- **Preview environments** ‹verify›: PR previews are opt-in and bill build minutes and bandwidth.
  One source describes previews being created *on merge*, which would be the wrong semantics for
  this repo — confirm previews are per **open PR**, since every gate here runs against a preview.
- **Object storage** ‹verify›: S3-compatible, Cloudflare R2-backed, $0.02/GB, zero ingress/egress,
  six regions. Confirm **private-by-default** buckets — `vercel-blob-store.ts` deliberately
  requires a private store because portrait ciphertext must never be served from a public URL.

---

## APPENDIX A — PITCH DECK VERSION LINEAGE

| Version | File | Date | Slides | Seed Ask | Fee | Shield | Y3 Revenue | Key Changes |
|---------|------|------|--------|----------|-----|--------|------------|-------------|
| v1.5 (OLDER) | MAD_Gambit_PitchDeck_v1.5_OLDER.pdf | ~Feb 2026 | 15 | $2.4M-$3M | 1.66% | 40% | $16.5M-$42M | Original deck, older financial model |
| v1.2 (CURRENT) | MAD_Gambit_PitchDeck_v1.2_18slides.pdf | Mar 2026 | 18 | $1M-$2M | 1.88% | 28.8% | $154.5M | Updated financials, 45/15/15/15/10 distribution |
| Hi-Fi PAD2 | MADGambit_HiFi_PAD2_PitchDeck.pdf | Mar 2026 | 18 | $1M-$2M | 1.88% | 28.8% | $154.5M | Orbitron/Rajdhani fonts, gold foil |

### Data Evolution Between Versions

#### v1.5 → v1.2 Changes (CRITICAL)
- **Seed Ask:** $2.4M-$3M → **$1M-$2M** (reduced)
- **Platform Fee:** 1.66% → **1.88%** (increased)
- **MAD Shield:** 40% → **28.8%** (corrected for actuarial solvency)
- **Y3 Revenue:** $42M → **$154.5M** (updated model with more aggressive DAU growth)
- **Distribution:** 40/20/15/15/10 → **45/15/15/15/10** (more to community)
- **TAM:** $192.1B (unchanged)
- **Team slide:** Added photos and advisor details
- **Token supply:** 888,888,888 (unchanged)
- **Competitors:** Added Pump.Fun, Limitless, PredictIt to comparison matrix

#### v1.5 Still Contains (NOT in v1.2)
- "Base Stake Yield: 40%, VIP: 60%" (v1.2 uses tiered 8-68%)
- "Yield Bond Insurance" language (v1.2 uses "MAD Shield")
- "$37B+ monthly volume expected" market timing data
- Circular economy butterfly model infographic (v1.2 references but different layout)
