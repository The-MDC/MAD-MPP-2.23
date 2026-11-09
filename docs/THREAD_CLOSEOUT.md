# Thread close-out — consolidated 2026-11-01 · updated 2026-11-09 (+ the Paseome 3D graph thread)

**Source of truth is `docs/MAD_GAMBIT_MASTER.md`.** This file is transient: what happened,
what is broken, and what to do next. It is overwritten every close-out.

**This is the only close-out file.** Two threads closed out on 2026-10-23 from the same base
(`main` @ `72a370e`, #152) and each wrote its own — `THREAD_CLOSEOUT.md` and
`THREAD_CLOSEOUT_maths-engine-room.md`. This file replaces both. If another session closes while
this one is unread, carry its open items forward **into this file**; do not add a suffixed sibling.

| Thread | Branch | PR | State |
|---|---|---|---|
| **Paseome thread** — Paseome maths, fee waterfall, the 4,888 VIP seats | `claude/mad-gambit-enhancement-timeline-zdnx47` | [#153](https://github.com/The-MDC/MAD-MPP-2.23/pull/153) | **MERGED** 2026-10-25 (`6432087`) |
| **Engine-room thread** — on-chain token audit, the tokenomics bypass (T1) | `claude/maths-engine-room-ship-ai67e6` | [#154](https://github.com/The-MDC/MAD-MPP-2.23/pull/154) | **MERGED** 2026-10-27 (`2de1735`; its close-out was written at head `3067c6b`) |
| **Paseome 3D graph thread** — the interactive 3D graph of both frontiers (hub + desk), the `/preview` hydration fix, a browser smoke test | `claude/paseome-3d-graph-f268bf`, `claude/paseome-graph-followups` (both deleted 2026-11-09) | [#179](https://github.com/The-MDC/MAD-MPP-2.23/pull/179), [#196](https://github.com/The-MDC/MAD-MPP-2.23/pull/196) | **MERGED** 2026-11-02 / 2026-11-05 · live in production since 2026-11-06 (`5c5c41e`) |

Both were drafts when their close-outs were written. Facts below were re-checked against `main`
@ `955f8f7` on 2026-11-01 (the sections folded into MASTER on 2026-11-09 were re-checked against
`main` @ `5c5c41e`); where a claim in either original has since changed, §3 says what and
shows the evidence. The full product write-up for the Paseome — maths, market-making, earning
functions, inspiration — is **`docs/product-sheets/PASEOME.md`**; §4 narrates how the thread got
there.

> **Why the engine-room branch was restarted.** Every commit it carried (`47119f2`, `5842063`,
> `18216a0`) is an ancestor of `origin/main` — verified with `git merge-base --is-ancestor`.
> [#143](https://github.com/The-MDC/MAD-MPP-2.23/pull/143) was merged 2026-08-27 by MADdegen at
> head `18216a0` and closed, so it cannot track new work. `main` had moved on through #152 (every
> agent persona consolidated under MAD-Gambit-Concierge). New work went on a fresh base from
> `origin/main` `72a370e`, in a **new** PR.

---

## 1 · Start the next chat with this

> Repo `The-MDC/MAD-MPP-2.23`, app in `verify/`. PRs target **`main`** — GitHub's default branch
> is still `The-MDC` (MASTER PART 0 §3). Read `docs/MAD_GAMBIT_MASTER.md` **PART 0** first — it is
> the only planning document, and the outstanding work is at the top — then
> `docs/THREAD_CLOSEOUT.md`.
>
> Two engineering jobs are ready and touch different files:
> 1. **T1 phase 2b — `zeitgeist/auction`.** Phases 1 (`perps/convict`, `faces/stake`) and 2a
>    (`shield/opt-in`) merged in #154. The sealed-bid deposit needs its **whole lifecycle or
>    none**: `refundWithin(client, …)` in `madx-web2.ts` (the `madx_ledger` `kind` CHECK already
>    allows `'refund'` — no migration), the clear loop in one transaction, tests for the three
>    terminal states (debit on commit · refund on reveal-and-lose · forfeit to the platform on
>    no-reveal). Then phase 3: a ledger check in `check-route-guards.mjs`, proven
>    to fail before it is trusted. Copy the shape of `market-book.ts#fill()` — one transaction,
>    `SELECT … FOR UPDATE`, `spendWithin(client, …)`. **Delete nothing and relabel nothing.**
> 2. **Paseome to a tradeable book** — tree persistence, refund ledger, artefact-gated
>    authorship, oracle path.
>
> Founder answers gate parts of both. Canon: creators slide 28.8% → 40%, **60% is a VIP share
> limited to 4,888 seats**; code still grants 60% by traction (`CR8TR`, `gambit-game-math.ts`)
> with no cap, so *how a seat is obtained* gates the seat registry. The `$MADx` total supply is
> still unwritten.
>
> Do NOT redo: hosting (Vercel — settled), ADR-008 (`pg` Pool + Route Handlers — settled), the fee
> waterfall, the frontier log-sum-exp fix, the `brandSafe` split, the mutation audit, the
> local-model roast tier, the `$MADx` transfer fix, the Z-Liar LLM quip, the `PAUSE_GUARDIAN`
> check on the swap path, the registrar complaint-auth fix, the "MAD Upshot" rename, the `$MADx`
> address (founder-confirmed 2026-10-26) — all done. Do NOT create a second planning document,
> and do NOT write a second close-out file.
>
> Constraints: `npm ci` 403s from the container (CI is the only verification); the Postgres host
> and TCP 5432 are blocked, so no agent can touch the database; `app.crystex.app` is
> egress-blocked.
>
> **Also shipped and live (the Paseome 3D graph thread, #179 + #196):** do not rebuild the graph, its
> desk view, the `EqualizerStrip` hydration fix or the smoke test (`npm run smoke:paseome`; §2). Two
> things are only half-checked: nobody has looked at the graph on the deployed site at phone width (it
> needs a guest login), and the smoke test is local-only (§7). **Sale arithmetic still open:** the
> only rate in the repo is `25,267 MADx per ETH` (a code comment); the Crystex ETH goal is nowhere —
> §6, "Blocked on environment / access".

---

## 2 · Shipped

### Paseome thread (#153)

**The close-out commit itself**
- MASTER: fee-waterfall correction folded in **where the wrong formula still lived** (it had
  `communityCut = grossFee·28.8%` — the bug — 55 days after the code was fixed); open question
  §13-7 marked resolved; ladder conflict added to §3; rename and Paseome-persistence added to §5;
  four traps added to §7; dated lines in PART I.
- `docs/product-sheets/PASEOME.md` v1.1 — *Certain-UnCertainty* (MASTER §3 now records v1.2).
- The Paseome thread's close-out file (now this one).

**Also in #153** (from its commit list)
- `a20ff2c` — pin the 4,888 VIP seats (`VIP_PROFIT_SHARE_SEATS`), give Paseome trees a fee origin,
  bring the maths master up to the code.
- `46598b6` — Gossip-Cop and Perpetual Epiphanies sheets, the Paseome artifact; settle authorship,
  name and the Shield scale. `2bdccc1` — settle creator profit share.
- Presentation collateral and Paseome brand images under `docs/collateral/` and
  `docs/brand/paseome/`. **They are no longer in this repo** — the founder moved presentations to
  `MADdegen/MADGambit-Presentation-Engine` on 2026-10-26, and #155's merge into `main` removed the
  local copies (MASTER PART I calls the removal apparently accidental).

**Merged earlier in the thread**

| PR | What it changed |
|---|---|
| #142 | Perp deck interactive — six instruments and six tickers clickable, hover states, scraper-fed family books with a satirical one-liner per market |
| #143 | (not this session) MADHAT'r Sentinel audit reads the claim |
| #144 | `brandSafe` split; local-model (Ollama) roast tier; Paseome maths core; `propagateTree` conservation check; mutation audit closing eleven unguarded constants |
| #145 | **Fee waterfall corrected** on founder sign-off; frontier overflow fixed; `GET /api/v1/paseome/frontier`; fee correction propagated to five UI/API surfaces; canon reference + Paseome and Prediction Markets sheets |

### Engine-room thread (#154)

The session that wrote that close-out shipped **nothing to the app** — it was an audit-and-record
session on top of already-merged work. Documentation commits:

| Change | What it actually does |
|---|---|
| `docs/MAD_GAMBIT_MASTER.md` — PART 0 §3 | Records the on-chain read that **eliminates `0xb61ae772…fd18` as `$MADx`** and names the three files that cite it as canonical. |
| `docs/MAD_GAMBIT_MASTER.md` — PART 0 §4 | Three new founder-only rows: the Crystex supply number (egress-blocked), **run migration `0016`** (shipped in #139, never applied), set **`REGISTRAR_TOKEN`** (complaint resolution fails closed without it). |
| `docs/MAD_GAMBIT_MASTER.md` — PART 0 §5 | New item **T1**, the tokenomics-engine bypass, with every verified call site. |
| `docs/MAD_GAMBIT_MASTER.md` — PART 0 §7 | Three new traps: "the engine" is three engines; do not "fix" the token address (**withdrawn — see §3**); `app.crystex.app` is blocked. |
| `docs/MAD_GAMBIT_MASTER.md` — PART I + PART II §9 | Dated lines for 2026-08-26/27 (#139, #143, #152) and 2026-10-23; contradictions 1 and 2 corrected rather than restated. |
| `docs/AGENT_MEMORY_FILES.md` | **New.** Verbatim mirror of all 9 agent memory files across the checked-out repos, with a table of what loads each one, and an explicit note on the two repos that have none. |

**The same branch then went on to ship app code before #154 merged** — about 70 minutes after the
documentation commits, on 2026-10-23, and not reflected in the close-out as first written:
- `c90743c` — **T1 phase 1**: conviction costs `$MADx` — one ledger, one fee, inside one
  transaction (`perps/convict`, `faces/stake` via `lib/perp-store.ts`; `round6` exported from
  `madx-web2.ts`; `lib/perp-store.test.ts`).
- `a5b8f34` — **T1 phase 2a**: the Shield premium is charged, not just recorded as paid
  (`chargeAndInsertShieldPosition` in `lib/shield.ts`).
- `90faa99` — records phase 2a in MASTER, and why the auction deposit is not being half-done.
- `59fb062` (2026-10-26) — `$MADx` address is `0x6972…151f`; the ORKx address removed from
  `cards/route.ts`, `CARD_CANONICAL_REFERENCE.md`, `DEPLOYED_ADDRESSES.md`,
  `RECONCILIATION_RUNBOOK.md` and `pitch/index.html`.

Two further docs commits recorded findings that §7 carries: `c783459` (Vercel deploys blocked by
plan and account, not by code) and `e2158a7` (the build on `18216a0` did pass).

**Already merged before the engine-room session (do not rebuild)**
- **#139** — the engine got a real book: `sql/0016_market_book.sql`, `lib/lmsr-book.ts`
  (pure/isomorphic — same `quote()` client and server), `lib/market-book.ts` (`fill()` as one
  transaction), `spendWithin` on `madx-web2.ts`, real SIWE sign-in, `game-context.tsx` on the
  real ledger with a `creditsSource: "live"|"demo"` flag.
- **#143** — Z-Liar Sentinel is a real Gemini call with the persona extracted to
  `lib/madhatr-persona.ts`; the money path honours `PAUSE_GUARDIAN`; `TRADEABLE_FAMILIES` is
  one exported source of truth; complaint resolution moved onto a fail-closed registrar
  credential.
- **#152** — agent personas consolidated under MAD-Gambit-Concierge.

### Paseome 3D graph thread (#179, #196)

- **#179** (merged 2026-11-02, `d664fff`) — an interactive 3D node-link graph of both Paseome frontiers on the hub, under the Certain-UnCertainty carousel: `lib/paseome-graph.ts` (pure model: validate, layout, formatting), `components/paseome-graph.tsx` + `paseome-graph-scene.tsx` (shell + R3F scene on the already-installed three / R3F / drei). Fed by `GET /api/v1/paseome/frontier`; **DEMO DATA** while the route says `source: "demo"`; a missing figure is an em dash; a route failure draws nothing; a counterfactual branch without irrealis mood is withheld.
- **#196** (merged 2026-11-05, `5c5c41e`) — the same graph on the Paseome desk (`/open-markets/[id]`, *Show the tree in 3D*) from the market's own book (`snapshotFromMarket`, **DEMO FLOOR**); the shared lazy slot (`paseome-graph-lazy.tsx`); the `/preview` hydration fix (`EqualizerStrip` seeded 44 bar heights with `Math.random()`); and `scripts/paseome-graph-smoke.mjs` (`npm run smoke:paseome`).
- **Live:** production deployment `5c5c41e` (2026-11-06, READY) — its uploaded source contains all of the above. Both PR branches were deleted on 2026-11-09.

---

## 3 · Settled since these threads were written

The two originals each carried claims that later work overtook, or that checking showed were
wrong. Do not act on the original wording.

| The original said | What is true (2026-11-01) | Evidence |
|---|---|---|
| Both PRs were **draft** | Both **merged** — #153 on 2026-10-25, #154 on 2026-10-27, both into `main` | `gh pr view` |
| **Paseome:** rename "MAD Upshot" → MAD Gambit is *ready now*, 17 occurrences in 7 files, not applied | ✅ **Done 2026-10-27** — both in-app decks, `ov-pitch-deck.html` slide 3, `AGENTS.md`, both Kotlin prompts, the MADHAT'r knowledge base. MASTER keeps its historical mentions on purpose. Remaining hits outside MASTER are lineage text only (`docs/archive/…/HANDOFF_MAD_GAMBIT.md`, the `AGENT_MEMORY_FILES.md` mirror) | MASTER PART 0 §5 (struck row); `git grep` |
| **Engine-room:** *which* `$MADx` address is real — `0xb61ae772…fd18` eliminated, `0x6972370e…151f` **unverified**; **"Do NOT change the `$MADx` token address in any file"** | ✅ **Resolved 2026-10-26.** Founder confirmed `0x6972370e1caAA3624F37D7e87C28e1089D00151f`; `59fb062` replaced the ORKx address in the three files that cited it as canonical (plus the runbook and `pitch/index.html`; MASTER also records the data-room page). **The "do not change it" instruction is withdrawn** — it was right while the address was unresolved. Caveat kept: a Blockscout read of `0x6972…` shows a *verified contract* named `MyToken` (creator `0x4975…0149`, the same creator as ORKx) with **no token record indexed**, so naming it MADx/MADDEX rests on the founder's word, not on-chain display | MASTER PART 0 §3 (the `$MADx supply` and `0xb61ae772…fd18 is NOT $MADx` rows); `git grep 0xb61ae772` (only the runbook note and `docs/boardy/` that call it unrelated) |
| **Engine-room:** nothing shipped; **T1 "not started"**, "the one job" | T1 **phases 1 and 2a are merged** (#154). **2b (`zeitgeist/auction`) is deliberately not started**, phase 3 (ledger check in `check-route-guards.mjs`) not started | `spendWithin` in `lib/perp-store.ts`; `chargeAndInsertShieldPosition` in `lib/shield.ts`; MASTER PART 0 §5 |
| **Paseome:** *how is a VIP seat obtained* — wholly open | **Partly answered** by the Golden Ticket decision (MASTER §3): supply 2,488 → **4,888** (= the seat pool), minimum conversion **2,888**, a holder converts with **three creator markets that each reach 188K volume**. Still open — see §6 | MASTER PART 0 §3 |
| **Paseome:** `article` on `POST /api/v1/satire/roast` "has no length cap" | **Half wrong.** `localRoast` clips `article` to 1,800 chars before it enters the prompt (`lib/local-satire.ts:140`, present since #144), and `headline` is capped at 400 at the route. The *injection* concern stands: both fields are interpolated into the prompt verbatim, undelimited | `git show 72a370e:verify/lib/local-satire.ts` |
| **Engine-room:** `#26 … #42` in its open-work table | Those are that session's **task-list ids, not GitHub numbers.** GitHub PR #40 is "article .txt ingest + dual images", #41 a skill doc, #42 a Neon runbook — none is "distribute the swap fee" | `gh pr view 38..42` |
| **Paseome:** "The 1.888% contamination is already gone — zero occurrences" | True of **live use**. The string still appears where it is named as the wrong figure — `docs/boardy/CANONICAL_NUMBERS_2026-08-19.md`, `.agents/…/canonical-numbers.md`, two `PROJECTS/platform/` notes — and in `gambit-game-math.test.ts:46` ("never 1.888"). Do not "clean" those | `git grep -F "1.888%"` |
| **Engine-room:** schema check expects **41/41** after `0016` | Still 41 — `0017_beta_signups` exists but `beta_signups` is not in `REQUIRED_TABLES` | `verify/scripts/schema-verify.mjs` |

---

## 4 · How the Paseome thread progressed — the iteration, in order

Each step was driven by something the previous one exposed.

**① The deck becomes a market surface.** Six perp instruments had no `onClick`, `href` or hover
anywhere. Made clickable on the Z-Liar pattern; each opens its family book, fed by the scraper,
with a one-liner per market. Three of six families are **signal-only** (`market-view.ts`) — the
book says so instead of inventing rows.

**② Cross-checking card copy against the engine found three readings that weren't readings.**
- `perp-dials.tsx` carried its own Z-Liar ladder at **38/84**; the engine's is **40/80**. Hoisted
  to one table, `ZLIAR_BANDS`.
- Scandal's band, CTA and fill bar were four hardcoded strings. Derived from σ² now.
- The plate labelled "GARCH σ² × 10⁴" printed `max(perpProbability)×100` — a percentage under a
  variance label. Now a real `garchUpdate` tick, shock = dispersion of the book's probabilities.

**③ The founder asked for a new perp.** Researched, then designed as **the Paseome** — a what-if
priced as a *tree*, split into **Foresight** (resolves) and **Hindsight** (never resolves, prices
belief persistence) at exactly the line the maths forces: what can be settled.

**④ Research deepened it.** Dopamine's uncertainty ramp peaking at *p* = 0.5 became the **Knife
Edge** sort. Benign-violation theory became the **irrealis constraint**. Minimal
counterintuitiveness became the **MCI score**. And the near-miss literature became the reason
untaken branches are **refunded**, never written off.

**⑤ Building it exposed a lying gate.** `satireMetrics().brandSafe` required Z-Liar ≥ 60 — i.e.
SERIAL EMBELLISHER or TOTAL FABRICATION — to pass. A juiciness bar named as a safety bar, and the
only gate on generated output. Split into `entertainmentGrade` and `assertionRisk` (fails closed).

**⑥ And a live input-validation bug.** `propagateTree` never checked that a node's edges sum to
1, and its one caller takes the tree from a request body. `treeConservationError` now guards it.

**⑦ The founder asked whether the tests meant anything.** A local harness was built (no
`node_modules`, so `lib/` is transpiled and run under a vitest shim), then the source was
*mutated* to see what the suite would catch. Eleven mutations changed no test — including all
four Z-Liar edges, the exact bug class fixed in ②. All eleven closed.

**⑧ The fee model.** `CANONICAL_NUMBERS §10` held a ⛔: `splitFee` took the community cut off
**gross**. Founder ruling: *"flat 1.88% rake; community is 28.8% of NET; creator only from their
own markets."* Implemented as a two-stage waterfall and verified against canon's own figures in
both directions — community 17.28% of gross, old over-allocation exactly 11.52 pp.

**⑨ The overflow.** `frontierPrices` returned `NaN` above ~851k shares on one branch. Reproduced,
fixed with log-sum-exp, regression-tested at 5M.

**⑩ 2026-10-23.** Founder settles creator profit share — **28.8% → 40% for creators, 60% for a VIP
seat, 4,888 seats only** — overturning my flag on the 28.8% floor. Confirms "MAD Upshot" is the
old name, and names the Paseome's thesis
**Certain-UnCertainty** — make the maker loss, conservation, refund, cadence and fee certain, so the
only uncertainty left is the epistemic kind worth paying for.

---

## 5 · The Paseome maths, in brief — full derivations in `PASEOME.md` §4–5

| What | Formula | One worked number |
|---|---|---|
| Frontier price | `e^(q_i/b − m) / Σ e^(q_j/b − m)`, m = max(q/b) | q=[4200,3100,2400,900] → 0.5928 / 0.2370 / 0.1323 / 0.0379, Σ = 1 |
| Trade cost | `C(q) = α(V)·b·ln Σ e^(q/b)`; cost = ΔC | 500 shares of the 0.0379 branch: 23.28 $MADx |
| Path price | `Π P(branch_k)` | 0.5928² = 0.3514 |
| Max maker loss | `b · ln n` | 1,318 / 1,664 / 1,931 for 3 / 4 / 5 branches |
| Knife Edge | sort by `\|p − 0.5\|` | f1 first at 0.0928 |
| Hindsight print | `permanent − transitory` from `cgarchUpdate` | positive = the belief is sticking |
| Meme multiplier | `0.85 + 0.50 · fitness`, peak at 1 violation | 1.35 at MCI = 1 |
| Fee waterfall | gross 1.88% → creator off gross → community 28.8% of net | 10k on a 40% market: 75.20 / 32.49 / 80.31 |
| Creator / VIP share | creators 28.8% → 40%; VIP 60%, 4,888 seats | VIP seat on 10k: 112.80 / 21.66 / 53.54 |

---

## 6 · Outstanding — by who can act

### Founder only

1. **How is a VIP seat obtained?** Canon: creators 28.8% → 40%, and **60% is a VIP profit share
   limited to 4,888 seats**. The code still grants 60% as `CR8TR` by traction with no cap
   (`gambit-game-math.ts:76,84-87`), so canon and code diverge. The Golden Ticket decision
   (§3) gives one route in; **still open:** is the event the *only* route · does `CR8TR` traction
   stop reaching 60% (it lowers payouts) · which volume counts (notional both sides, or cash at
   risk) · is the floor 28.8% or a flat 28% (the founder wrote "28 to 40%") · which platform
   "Lit" is. That answer gates the seat registry (MASTER §5). The 28.8% base rung I flagged as a
   conflation is **correct**; the flag was wrong.
2. **Paseome open questions:** artefact-gate timing; what roots a Hindsight tree.
3. **The `$MADx` total supply.** Your stated source is the Crystex fair-launch campaign; that
   domain is egress-blocked, so the number has to come from you. It settles PART 0 §3 and
   PART II §9 contradiction 1 at once. Do not let anyone infer it from the `224,573,096` in
   the code — that is an **owner-modifiable cap**, not a total supply.
4. **Run migration `0016`** — `npm run migrate:deploy`, then `npm run schema:verify` expecting
   **41/41**. Until then the market book, the price tape and the paid pack-mint all fall back
   to demo paths. ‹verify› — whether it has been applied cannot be read from the container;
   MASTER PART 0 §4 still lists it open.
5. **Set `REGISTRAR_TOKEN`** in Vercel, or complaint resolution keeps returning 503 by design.
   ‹verify› — Vercel env is not readable from here.
6. **Carried forward, unchanged:** the token distribution split · chain topology (Nova vs One) ·
   the two O-V deck canon conflicts (Wyoming vs New Mexico; "MAD Upshot" — whose slide-3 half the
   2026-10-27 rename cleared, though MASTER §3 still lists it) · near-miss patterns on
   real-money surfaces · the serverless-driver question vs ADR-008 (ADR-008 stands; the decision
   is yours).

### Engineering — ready now

- **T1 — one tokenomics engine** — MASTER PART 0 §5 holds the measurement and every call site: the
  maths engine is already single (`gambit-game-math.ts`, ~75 consumers), so is the satire
  one-liner engine (`satire-headline.ts`), and the `$MADx` ledger (`madx-web2.ts`, 9 importers) is
  the one that is not. Phases 1 and 2a merged; **2b (`zeitgeist/auction`) then 3 remain** (§1 has
  the shape). `staking` / `tournament/match` /
  `cards/evolve` are compute-only and need a product call — a real backend, or stop presenting
  their output as a position — not a ledger write.
- **Paseome persistence + refund ledger + oracle** — MASTER §5.
- **Workstream CF — MASTER PART 0 §5, CF1–CF11.** The items only these close-outs held now live in
  MASTER (folded in 2026-11-09), not here: distribute the swap fee (CF1) · the two disagreeing
  supply numbers (CF2) · settle-escalation siblings (CF3) · card collection display (CF4) ·
  `logic-lab` / `sentiment-equalizer` wiring (CF5) · roast prompt-injection hardening (CF6) ·
  the weak determinism tests (CF7) · a test pinning the `$MADx` address (CF8) · stale pack
  economics in the decks (CF9) · six product sheets never written (CF10) · a live Ollama
  round-trip (CF11). The engine-room thread's task ids map as #40→CF1, #42→CF2, #41→CF3,
  #38→CF4, #39→CF5; they are task ids, not GitHub numbers (§3). Its held batch POST to the
  satire engine and the `config-drift-checker` question are PART 0 §3 rows.
- **`master-maths` Gradle gate** (task #31) — MASTER's C5; `master-maths/` is still matched by
  **no workflow at all**.
- **Reconcile MASTER against shipped reality** (task #30) — partly advanced, not finished.
  Concrete stale rows re-found 2026-11-09: PART 0 §1 still says the agent brand is "on
  `MAD-Gambit-Concierge`, not yet merged" (#152 merged 2026-09-19) and the private-beta front door
  is "on PR #169, not yet merged" (#169 merged 2026-10-28).
- **Look at the Paseome 3D graph on the live site** — needs a guest login, so a person: sign in on a phone and open `/preview` (scroll to Certain-UnCertainty) and `/open-markets/plat-merger` → *Show the tree in 3D*. It has only been exercised on a local production build.
- **Paseome graph depth** — blocked on the tree store (above). MASTER §5's *Paseome to a tradeable book* row carries the proposed contract (`GET …/frontier?node=<id>`, `parentId`, `path`); nothing to build until a route sends real child nodes.

### Blocked on environment / access

- **Database consolidation** — the "no single source database" point predates the founder's
  2026-11-02 decision to move the database from Neon to Supabase (MASTER PART 0 §3), so check
  there before treating a three-Neon-database merge as the target. Agents cannot reach the Neon
  host (403) or TCP 5432.
- **The two `.lock.yml` files** (`gh aw compile`) — both AI review gates are configured and
  have never run.
- **eslint / eslint-config-next / @types/node realignment** — needs a lockfile regen the
  sandbox cannot do.
- **The Crystex ETH goal and rate** (found 2026-11-09) — `app.crystex.app` is still unreadable. The only rate in the repo is the comment `Rate: 25,267 MADx per ETH` in `contracts/madhat-core/src/tokens/MADxToken.sol` (imported 2026-07-21 from `demo-repository`, unsourced); no thread or session transcript states an ETH goal. On-chain (Arbitrum One, read 2026-11-09): `maxTotalSupply` = 224,573,096 tokens, `totalSupply` = 0 — and 224,573,096 ÷ 25,267 is **exactly 8,888**, so 8,888 ETH × 25,267 would reproduce the cap. The founder's 2026-11-09 answer (270 or 280 million purchasable, #199) needs 10,685.87 / 11,081.65 ETH at that rate and is 45.4M / 55.4M above the cap. **Paste the campaign's ETH goal and rate** and "tokens for sale" is one multiplication.
- **The smoke test is not in CI** — CI has no browser, no running server and no guest login. It is run by hand against a production build or a preview (`npm run smoke:paseome`; capture-guard note in §7).

---

## 7 · Failed, timed out, or unverifiable

**This is the section that saves the next session the most time.**

### Standing — both threads hit these, and they will hit again

- **`npm ci` / `npm install` 403 from the agent container.** No real type-check, test, lint or
  build locally — CI is the only gate, and `package-lock.json` must never be hand-edited. What
  worked instead: `tsc` with an audit tsconfig + a TS2802 probe, and a local test harness
  (`lib/` transpiled and run under a vitest shim).
- **The Postgres host and TCP 5432 are blocked**, so no agent can apply or verify migration
  `0016`.
- **MCP servers drop and reconnect mid-session.** The Paseome session saw `Github_MCP` fail to
  connect (the `github` MCP server works; use it). The engine-room session saw github,
  Blockscout, Vercel, Figma, Linear, HuggingFace and others disconnect and reconnect repeatedly,
  in both directions; calls failed with `InputValidationError` or a hard disconnect and had to be
  re-loaded through `ToolSearch`. Budget for this: a tool that worked ten minutes ago may need
  its schema re-fetched.

### Paseome 3D graph thread

Each of these cost real time:

- **Turbopack refuses a junctioned `node_modules`** in a fresh worktree ("files outside of the workspace root are not compiled"; every page 500s). Use `next dev --webpack` (MASTER §6).
- **`next dev --webpack` is too slow to verify a lazy chunk here** — 30–200 s per rebuild, and a chunk requested mid-rebuild fails with `ChunkLoadError`. The hub → chunk path could only be seen working on a **production build** (`next build --webpack`, ~4 min) served locally. Use that, not dev.
- **The in-app Browser pane runs no `requestAnimationFrame` or IntersectionObserver while hidden**, so it cannot render WebGL or fire a near-viewport gate. Headless Edge driven over DevTools worked instead.
- **The app refuses automated browsers twice:** `proxy.ts` 403s a `HeadlessChrome` user agent (present a normal mobile UA), and the **capture guard** veils any `navigator.webdriver` browser in a production build, swallowing taps. Do not script around the veil (MASTER §7).
- **`npx tsc` once answered "This is not the tsc command you are looking for"** inside a worktree; `./node_modules/.bin/tsc --noEmit` worked. Cause not found ‹verify›.
- **Blockscout MCP:** `get_address_info` returned a 500 for the token; the ABI and `read_contract` calls worked. The free session budget is 8 calls.
- **A cross-session message was not delivered** the first time ("gave no sign of starting within 20s"); the answer arrived later in that session's own message.
- **Not verified:** the graph on the deployed site at phone width (no guest login); a physical phone (touch was emulated); the Vercel preview of #196 (the bot reported DEPLOYED; not opened). The red **"Vercel" check** on every PR is "Account is blocked" — account state, not code (MASTER PART 0 §3).

### Paseome thread

| What | Effect | Workaround |
|---|---|---|
| **Three subagents killed by a session rate limit** (Aug 28) | Six product sheets never written; one (`PREDICTION_MARKETS`) finished first and was reviewed line-by-line before merge | Write them directly next time |
| Local harness under-reported two passing tests | A false "interlock regressed" claim | `.rejects`/`.resolves` added to the shim; local now matches CI |
| Mutation harness: an escaped `&&` silently broke a build | False "survived" results | Confirm a mutation applied before trusting it |
| Mutation harness compared to zero, not baseline | False "caught" results | Compare to the unfiltered baseline's own failures |
| Test-count prediction 379 vs CI 389 | — | CI tests the merge with `main`; reconciled exactly (MASTER §7 trap) |
| Session idle ~55 days (Aug 28 → Oct 23) | Container state predates #146–#152 | Fresh branch from current `main` |

### Engine-room thread

- **`app.crystex.app` is egress-blocked.** `WebFetch` returns
  `{"error_type":"EGRESS_BLOCKED","domain":"app.crystex.app"}` — the proxy refuses the host
  outright. This is not a 404 and not rate-limiting: retrying, rewording the URL, or trying
  the campaign API path will all fail the same way. **It blocked the one thing you asked for**
  — the fair-launch total supply. No workaround exists from inside the container.
- **Blockscout cut the audit off half-finished.** The MCP server allows ~**10 tool calls per
  free session**, and the session was declared dead after two: the unlock call and one address
  lookup. The second call returned *"This session's `session_id` can no longer be used… obtain
  a Blockscout PRO API key at https://mcp.blockscout.com"*, and the server's own notice says
  that from **2026-10-08 all requests require a PRO key**. **Consequence: the finding was
  asymmetric.** `0xb61ae772…fd18` was read and eliminated — ERC-20 "Serpentine Orkain" /
  **ORKx**, 18 decimals, total supply 60.073728, 2 holders, unverified source, creator
  `0x49755F66C877040f8EF7F307263F74C352830149`. `0x6972370e…151f` was **never reached** in that
  session, and the warning was that acting on the first half alone would swap in a second
  unverified address. *Since resolved the other way:* the founder confirmed `0x6972…151f` on
  2026-10-26 and a later Blockscout read found a verified `MyToken` contract with no token record
  indexed (§3) — the address rests on the founder's confirmation.
- **`next build` on `18216a0` — resolved, and the earlier worry was unfounded.** During the
  session the dispatched run showed route-guard, type-check (16s) and lint green with
  `next build` still in progress, and #143 was merged before that step was observed. The
  queued GitHub notifications, read at the end of this session, close it: the **Vercel preview
  deployment for commit `18216a0` reached `Ready`** (2026-08-27 02:30 UTC,
  `mad-mpp-2-23-git-claude-maths-engine-room-ship-ai67e6-madgambit.vercel.app`), and Vercel
  builds from root directory `verify` by running `next build` — so the build did pass. A
  `check_suite.completed` for the same `head_sha` reported no third-party suite still running
  or failed. **Nothing is outstanding on #143.**
- **CI `pull_request` triggers were not firing on #143** — every commit needed a manual
  `workflow_dispatch`. `mergeable_state` was `"unstable"`, not conflicted, and triggers had
  worked on the same branch the day before, so **no diagnosis was ever established.** It
  appears to have been transient: triggers fired normally on **#154** within seconds of
  opening it (Secret scan started 2026-10-23T14:16:08Z, unprompted). Do not carry forward a
  belief that this repo's triggers are broken — but do check, rather than assume, on a long
  branch.
- **Vercel deploys failed for the whole repo — plan/account, not code** (`c783459`; MASTER
  PART 0 §4). The block cleared 2026-10-27 and production was promoted by hand; Hobby still
  forces daily-only crons.
- **`MADHATs-Gambit-Presentation` is empty.** The checkout contains only `.git` and `master`
  has no commits — `git log` exits 128. Nothing to hand off there yet.
- **`The-MDC/Vercel-Ai` was never cloned**, so its memory files are absent from
  `docs/AGENT_MEMORY_FILES.md`. Its AI-SDK skills surfaced through the harness, so it does
  carry agent context; the document says so rather than implying completeness.

---

## 8 · Suggested — not asked for, worth doing

Every suggestion from both threads is now a row in MASTER, so nothing here needs carrying forward
(folded in 2026-11-09):
- Reconcile the Y3 projections → PART VI §13 item 6 (the $73.3M vs $154.5M volume-side cross-check).
- Pin the weak determinism tests → CF7. Stale pack economics in the design decks → CF9.
- The `config-drift-checker` question → PART 0 §3.
- Guard the `$MADx` address like the canon numbers → CF8.
- A test for the ledger boundary → T1 phase 3 (PART 0 §5).

---

## 9 · Do not redo

**Settled decisions — reopening these has already cost sessions**
- **Hosting: Vercel** (2026-08-18). Part VIII is a contingency with named reopen triggers,
  *not* a pending proposal.
- **ADR-008: `pg` Pool + Route Handlers.** A serverless driver and Server Actions were
  explicitly evaluated and rejected. Marked "do not reopen without a superseding ADR".
- **One planning document, one close-out file.** ~150 docs were consolidated into MASTER; 114
  files and ~36.5k lines deleted in the same commit. No `HANDOFF_*.md`, no `PLAN_*.md`, no
  `THREAD_CLOSEOUT_<topic>.md`.
- **Nothing gets removed from a route without explicit founder go-ahead** — your words:
  *"i never gave permissions of any kind for you to remove anything."*
- **Canonical numbers do not change without sign-off**: 1.88% fee, 28.8% community, 40% Creator
  Ladder, $12M pre. *(Read with the Paseome thread's ruling: the community's 28.8% is of platform
  **net**; creators slide 28.8% → 40%; 60% is the VIP seat, 4,888 only.)*
- **The `$MADx` address is `0x6972370e1caAA3624F37D7e87C28e1089D00151f`** — founder-confirmed
  2026-10-26; `0xb61ae772…fd18` is ORKx. Do not reopen it, and do not restore the old one.
- **Paseome founder decisions:** refund untaken branches · frontier 3–5 · authorship VIP **or**
  ladder.

**Work already done — a fresh session would plausibly repeat these**
- Fee waterfall (`splitFee`, `platformNet`) — merged #145, founder-signed, regression-tested.
- `frontierPrices` log-sum-exp — do not "simplify" back to `calculateDLLMSRPrice`.
- `brandSafe` → `entertainmentGrade` / `assertionRisk` — the alias keeps its old value on purpose.
- Z-Liar `ZLIAR_BANDS` single table; Scandal bands in `lib/scandal-bands.ts`.
- The mutation audit and the eleven canon pins.
- Local-model tier uses plain `fetch`, deliberately — no new dependency.
- The 1.888% contamination is gone from every live surface (§3 for what remains and why).
- The "MAD Upshot" → MAD Gambit rename (§3).
- T1 phases 1 and 2a (`perps/convict`, `faces/stake`, `shield/opt-in`).
- The `$MADx` transfer vulnerability is **fixed**.
- The Z-Liar LLM quip is **built and turned on**, with a labelled `quipSource: "canned"`
  fallback. The route it "should have been wired to" was itself a placeholder — wiring the
  component to it would have made the panel worse.
- `PAUSE_GUARDIAN` is **enforced on the swap path**. Deliberately not behind the governance
  timelock: a fire alarm must not be on a timer.
- Complaint resolution is **off session auth** and onto `requireHeaderSecret`, fails closed,
  with `requireHeaderSecret(` added to `AUTH_CALLS` in `check-route-guards.mjs` — verified by
  confirming the guard **failed before and passed after**, not by trusting a green tick.
- `TRADEABLE_FAMILIES` is **one exported `ReadonlySet<PerpFamily6>`** in `market-view.ts`,
  re-exported by `perp-family-markets.ts`. There is no second hand-written copy.
- The LMSR inverse was **verified numerically** before it entered the repo (round-trip error
  ~1e-13 across four regimes), and the exponentials are shifted by `max(q)` because unshifted
  `exp` genuinely overflows past `e^(q/b) ≈ 709`.

**Two traps worth repeating from MASTER PART 0 §7**
- **A green gate is not evidence until you confirm it is looking at something.** Three gates
  in this repo have silently scanned nothing. Check the **file count** a filter yields.
- **A vitest file outside `lib/` silently does not run** — `include` is `["lib/**/*.test.ts"]`.

**Paseome 3D graph thread (#179, #196)**
- The graph, its desk view (`snapshotFromMarket`), the shared lazy slot, the `EqualizerStrip` hydration fix and the smoke test are **done and live** — do not rebuild them. Depth (child nodes) waits on the tree store: do not draw nodes from the two-hop *price*.
- The smoke test **must not bypass the capture guard** (MASTER §7). Run it against a production build; `next dev --webpack` is too slow and times chunks out.
- Do not treat 224,573,096 ÷ 25,267 = exactly 8,888 as the campaign's ETH goal — it is a clue derived from the cap, not a source (MASTER §7).
