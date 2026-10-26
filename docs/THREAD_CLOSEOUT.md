# Thread close-out — 2026-10-23

**Source of truth is `docs/MAD_GAMBIT_MASTER.md`.** This file is transient: what happened this
session, what is broken, and what to do next. It is overwritten every close-out.

Branch `claude/mad-gambit-enhancement-timeline-zdnx47` · base `main` @ `72a370e` (#152) · PR [#153](https://github.com/The-MDC/MAD-MPP-2.23/pull/153) (draft)

The full product write-up — maths, market-making, earning functions, inspiration — is
**`docs/product-sheets/PASEOME.md`**. This file narrates how the thread got there.

---

## 1 · Start the next chat with this

> Repo `The-MDC/MAD-MPP-2.23`, app in `verify/`. Read `docs/MAD_GAMBIT_MASTER.md` PART 0 first,
> then `docs/THREAD_CLOSEOUT.md`.
> Most urgent: **rename "MAD Upshot" → MAD Gambit** — 17 occurrences in 7 files, investor decks
> first (`verify/public/pitch/*.html`; slide 3 is titled "MAD Upshot: The Card Economy"). Edit
> each in context — some are lineage phrasings a sed would mangle.
> Then: **Paseome to a tradeable book** — persistence, refund ledger, artefact-gated authorship.
> Settled today: creators 28.8% → 40%; **60% is a VIP share limited to 4,888 seats**. Code still
> grants 60% by traction (`CR8TR`) with no cap — open question is how a seat is obtained.
> Do NOT redo: the fee waterfall, the frontier log-sum-exp fix, the brandSafe split, the
> mutation audit, the local-model roast tier — all merged.

---

## 2 · Shipped

### This close-out (this branch)
- MASTER: fee-waterfall correction folded in **where the wrong formula still lived** (it had
  `communityCut = grossFee·28.8%` — the bug — 55 days after the code was fixed); open question
  §13-7 marked resolved; ladder conflict added to §3; rename and Paseome-persistence added to §5;
  four traps added to §7; dated lines in PART I.
- `docs/product-sheets/PASEOME.md` v1.1 — *Certain-UnCertainty*.
- This file.

### Merged earlier in the thread
| PR | What it changed |
|---|---|
| #142 | Perp deck interactive — six instruments and six tickers clickable, hover states, scraper-fed family books with a satirical one-liner per market |
| #143 | (not this session) MADHAT'r Sentinel audit reads the claim |
| #144 | `brandSafe` split; local-model (Ollama) roast tier; Paseome maths core; `propagateTree` conservation check; mutation audit closing eleven unguarded constants |
| #145 | **Fee waterfall corrected** on founder sign-off; frontier overflow fixed; `GET /api/v1/paseome/frontier`; fee correction propagated to five UI/API surfaces; canon reference + Paseome and Prediction Markets sheets |

---

## 3 · How the thread progressed — the iteration, in order

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

**⑩ Today.** Founder settles creator profit share — **28.8% → 40% for creators, 60% for a VIP
seat, 4,888 seats only** — overturning my flag on the 28.8% floor. Confirms "MAD Upshot" is the
old name, and names the Paseome's thesis
**Certain-UnCertainty** — make the maker loss, conservation, refund, cadence and fee certain, so the
only uncertainty left is the epistemic kind worth paying for.

---

## 4 · The maths, in brief — full derivations in `PASEOME.md` §4–5

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

## 5 · Outstanding — by who can act

### Founder only
- **How is a VIP seat obtained?** Settled today: creators 28.8% → 40%, and **60% is a VIP profit
  share limited to 4,888 seats**. The code still grants 60% as `CR8TR` by traction with no cap, so
  canon and code diverge. Bought, earned or granted — and does CR8TR traction still qualify? That
  answer gates the seat registry (MASTER §5). The 28.8% base rung I flagged as a conflation is
  **correct**; the flag was wrong.
- Paseome open questions: artefact-gate timing; what roots a Hindsight tree.

### Engineering — ready now
- **Rename "MAD Upshot" → MAD Gambit** — MASTER §5. Was started on a scratch branch and parked when
  this handoff was requested; no rename edits are in this commit.
- **Paseome persistence + refund ledger + oracle** — MASTER §5.
- **Six product sheets never written** — `SCANDAL_VELOCITY`, `Z_LIAR_METER`, `CONVICTION_MARKETS`,
  `OPEN_MARKETS`, `MAD_SHIELD`, `CREATOR_PROFIT_SHARE`. The founder later said to set sheets aside
  in favour of code; listed so they are not mistaken for done.
- **Prompt-injection hardening on `POST /api/v1/satire/roast`** — `headline`/`article` go straight
  into the model prompt, and `article` has no length cap. Flagged, not built.

### Blocked on environment
- A live Ollama round-trip has never run — no Ollama in the container, and Vercel cannot reach a
  desktop by design.

---

## 6 · Failed, timed out, or unverifiable

| What | Effect | Workaround |
|---|---|---|
| `npm ci` 403 from the container | No real type-check/test/build locally | `tsc` with an audit tsconfig + a TS2802 probe; the local harness for tests; CI as the gate |
| **Three subagents killed by a session rate limit** (Aug 28) | Six product sheets never written; one (`PREDICTION_MARKETS`) finished first and was reviewed line-by-line before merge | Write them directly next time |
| Local harness under-reported two passing tests | A false "interlock regressed" claim | `.rejects`/`.resolves` added to the shim; local now matches CI |
| Mutation harness: an escaped `&&` silently broke a build | False "survived" results | Confirm a mutation applied before trusting it |
| Mutation harness compared to zero, not baseline | False "caught" results | Compare to the unfiltered baseline's own failures |
| Test-count prediction 379 vs CI 389 | — | CI tests the merge with `main`; reconciled exactly (§7 trap) |
| Session idle ~55 days (Aug 28 → Oct 23) | Container state predates #146–#152 | Fresh branch from current `main` |
| `Github_MCP` server failed to connect today | — | The `github` MCP server works; use it |

---

## 7 · Suggested — not asked for

- **Reconcile the projections before an investor sees them.** Stated Y3 volume of $3.6–4.2B × 1.88%
  = **$73.3M** of market fees against **$154.5M** stated gross — the other ~53% depends on streams
  `revenue-engine.ts` marks `planned`. A model has to show that split.
- **Pin the three weak determinism tests** (`expect(f(x)).toBe(f(x))`), especially
  `derivePackNonce` — security-relevant, and a clock-dependent implementation could pass it.
- **Clear the stale pack economics in the design decks** — mockups say 888 $MADx / 8 cards; the
  engine says 4.88 / 5.

---

## 8 · Do not redo

- Fee waterfall (`splitFee`, `platformNet`) — merged #145, founder-signed, regression-tested.
- `frontierPrices` log-sum-exp — do not "simplify" back to `calculateDLLMSRPrice`.
- `brandSafe` → `entertainmentGrade` / `assertionRisk` — the alias keeps its old value on purpose.
- Z-Liar `ZLIAR_BANDS` single table; Scandal bands in `lib/scandal-bands.ts`.
- The mutation audit and the eleven canon pins.
- Local-model tier uses plain `fetch`, deliberately — no new dependency.
- Paseome founder decisions: refund untaken branches · frontier 3–5 · authorship VIP **or** ladder.
- The 1.888% contamination is already gone — zero occurrences.
