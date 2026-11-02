# Thread close-out — consolidated 2026-11-01

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

Both were drafts when their close-outs were written. Facts below were re-checked against `main`
@ `955f8f7` on 2026-11-01; where a claim in either original has since changed, §3 says what and
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
- **Six product sheets never written** — `SCANDAL_VELOCITY`, `Z_LIAR_METER`, `CONVICTION_MARKETS`,
  `OPEN_MARKETS`, `MAD_SHIELD`, `CREATOR_PROFIT_SHARE`. The founder later said to set sheets aside
  in favour of code; listed so they are not mistaken for done. (Only `PASEOME.md` and
  `PREDICTION_MARKETS.md` exist in `docs/product-sheets/`.)
- **Prompt-injection hardening on `POST /api/v1/satire/roast`** — `headline`/`article` go straight
  into the model prompt, undelimited (`lib/local-satire.ts` `userPrompt`). The length half is
  already bounded (§3). Flagged, not built.

The rest are from the engine-room thread's task list (ids `#26`–`#42` are **task ids, not GitHub
numbers** — §3). Line numbers are as of `72a370e`; the T1 work has since edited some of these
routes, so re-find before trusting them.

| # | Item | Note |
|---|---|---|
| #40 | Distribute the swap fee | You chose **"conserve now, distribute later"**: credit the gross fee to one treasury account, record the computed creator/community/protocol split as metadata, decide no waterfall. **Not started.** Needs a migration extending the `madx_ledger` `kind` CHECK constraint (`'welcome','buy','transfer_in','transfer_out','stake','unstake','claim','spend','refund'`) plus a treasury owner id. T1 phase 1 did the equivalent for perp conviction fees (split computed and recorded in the ledger note, never distributed). |
| #42 | Canon drift — two supply caps disagree | You chose **"just document"**: comment both sites naming the other, and add a test asserting `MADX_BETA.cap = 224_573_096` so the enforced number stops being unguarded. **Not started.** Also in scope: `lib/mpp-math.ts` shadows `calculateConviction`. |
| #41 | Settle-escalation siblings | The complaint route is fixed and merged. Remaining self-attested/body-supplied authority: `zeitgeist/succession:99`, `zeitgeist/auction`, `shield/opt-in:57-62` (whale eligibility), `tournament/match:39-44`, `markets/route.ts:76-79` (body-supplied `creatorWallet`). |
| #38 | Card collection display | Map `CardRow` → `NftCard` so owned cards render. |
| #39 | `logic-lab` and `sentiment-equalizer` wiring | Z-Liar is done; these two still render local tables. |
| #30 | Reconcile MASTER against shipped reality | Partly advanced; not finished. |
| #31 | `master-maths` Gradle gate (C5) | `master-maths/` is still matched by **no workflow at all**. |
| #26 | **HELD (billing)** — batch POST to the satire engine | Your hold, not a blocker. |

### Blocked on environment / access

- **A live Ollama round-trip has never run** — no Ollama in the container, and Vercel cannot reach
  a desktop by design.
- **Database consolidation** — still no single source database, so "sync the DBs" has no
  well-defined target. Agents cannot reach the Postgres host (403) or TCP 5432.
- **The two `.lock.yml` files** (`gh aw compile`) — both AI review gates are configured and
  have never run.
- **eslint / eslint-config-next / @types/node realignment** — needs a lockfile regen the
  sandbox cannot do.

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

**From the Paseome thread**
- **Reconcile the projections before an investor sees them.** Stated Y3 volume of $3.6–4.2B × 1.88%
  = **$73.3M** of market fees against **$154.5M** stated gross — the other ~53% depends on streams
  `revenue-engine.ts` marks `planned`. A model has to show that split. (MASTER PART VI §13 item 6
  already says "Y3 revenue — pick one" across $154.5M / $121.4M / $86–154M; this is the volume-side cross-check.)
- **Pin the three weak determinism tests** (`expect(f(x)).toBe(f(x))`), especially
  `derivePackNonce` — security-relevant, and a clock-dependent implementation could pass it.
- **Clear the stale pack economics in the design decks** — mockups say 888 $MADx / 8 cards; the
  engine says 4.88 / 5. ‹verify› — the decks moved to `MADdegen/MADGambit-Presentation-Engine` on
  2026-10-26 and were not re-checked there.

**From the engine-room thread**
- **The `config-drift-checker` request may already be satisfied — in the other repo.** You
  asked to implement `https://github.com/jameskomo/config-drift-checker` and it was never
  actioned. Before building anything, note that `MADHATs-Claude-Enhancement` already ships
  `scripts/check-config-drift.py` (exit 0 clean / 1 drift / 2 unreadable) **and**
  `scripts/test_config_drift.py`, wired into `hermes-verify.ps1`. So the real question is
  which of three things you meant: adopt the upstream tool there, port the existing checker
  into `MAD-MPP-2.23` to watch `vercel.json` / workflow / env drift, or something else.
  One sentence from you avoids building the wrong one.
- **Guard the `$MADx` address the way the canon numbers are guarded.** `gambit-game-math.test.ts`
  locks every constant by value; the token address is enforced in several files and asserted
  nowhere. One test would have caught the ORKx mismatch years earlier — and now that the address
  has been changed once, it is the thing most worth pinning.
- **A `verify/lib/` test for the ledger boundary.** T1's real risk is a *new* value route
  being added outside the ledger. A test that enumerates routes touching stake/conviction/bid
  and asserts each reaches `spendWithin` would make the boundary enforceable instead of
  aspirational — the same trick `check-route-guards.mjs` already plays for auth. (This is T1
  phase 3.)

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
