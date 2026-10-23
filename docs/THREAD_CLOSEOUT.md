# Thread close-out — 2026-10-23

**Source of truth is `docs/MAD_GAMBIT_MASTER.md`.** This file is transient: what happened this
session, what is broken, and what to do next. It is overwritten every close-out.

Branch `claude/maths-engine-room-ship-ai67e6` · HEAD `3067c6b` · restarted from `origin/main`
**`72a370e`** · this session's PR **[#154](https://github.com/The-MDC/MAD-MPP-2.23/pull/154) —
DRAFT** · previous PR **[#143](https://github.com/The-MDC/MAD-MPP-2.23/pull/143) — MERGED**
2026-08-27 by MADdegen at head `18216a0`

> **Why the branch was restarted.** Every commit the branch carried (`47119f2`, `5842063`,
> `18216a0`) is an ancestor of `origin/main` — verified with `git merge-base --is-ancestor`.
> #143 is merged and closed, so it cannot track new work. `main` has since moved on through
> **#152** (every agent persona consolidated under MAD-Gambit-Concierge). New work goes on a
> fresh base, in a **new** PR.

---

## 1 · Start the next chat with this

> Repo `The-MDC/MAD-MPP-2.23`, branch `claude/maths-engine-room-ship-ai67e6`, based on
> `origin/main`. Read `docs/MAD_GAMBIT_MASTER.md` **PART 0** first — it is the only planning
> document, and the outstanding work is at the top.
>
> **The one job: PART 0 §5 item T1 — one tokenomics engine.** The maths engine is already
> single (`verify/lib/gambit-game-math.ts`, ~75 consumers) and so is the satire one-liner
> engine (`verify/lib/satire-headline.ts`, already called from the perp family route). The
> **$MADx ledger is not**: `verify/lib/madx-web2.ts` has 9 importers, and `perps/convict`,
> `faces/stake`, `zeitgeist/auction` and `shield/opt-in` all move or promise value without
> touching it. Copy the shape of `market-book.ts#fill()` — one transaction,
> `SELECT … FOR UPDATE`, `spendWithin(client, …)`. **Delete nothing and relabel nothing.**
>
> Do NOT redo: hosting (Vercel + Neon, settled), ADR-008 (`pg` Pool + Route Handlers,
> settled), the `$MADx` transfer fix (done), the Z-Liar LLM quip (done and live), the
> `PAUSE_GUARDIAN` check on the swap path (done), the registrar complaint-auth fix (done).
> Do NOT create a second planning document. Do NOT change the `$MADx` token address in any
> file — see §4.
>
> Constraints: `npm ci` 403s from the container (CI is the only verification), `*.neon.tech`
> and TCP 5432 are blocked, `app.crystex.app` is egress-blocked.

---

## 2 · Shipped this session

Nothing shipped to the app this session — it was an audit-and-record session on top of
already-merged work. Three documentation commits:

| Change | What it actually does |
|---|---|
| `docs/MAD_GAMBIT_MASTER.md` — PART 0 §3 | Records the on-chain read that **eliminates `0xb61ae772…fd18` as `$MADx`** and names the three files that cite it as canonical. |
| `docs/MAD_GAMBIT_MASTER.md` — PART 0 §4 | Three new founder-only rows: the Crystex supply number (egress-blocked), **run migration `0016`** (shipped in #139, never applied), set **`REGISTRAR_TOKEN`** (complaint resolution fails closed without it). |
| `docs/MAD_GAMBIT_MASTER.md` — PART 0 §5 | New item **T1**, the tokenomics-engine bypass, with every verified call site. |
| `docs/MAD_GAMBIT_MASTER.md` — PART 0 §7 | Three new traps: "the engine" is three engines; do not "fix" the token address; `app.crystex.app` is blocked. |
| `docs/MAD_GAMBIT_MASTER.md` — PART I + PART II §9 | Dated lines for 2026-08-26/27 (#139, #143, #152) and 2026-10-23; contradictions 1 and 2 corrected rather than restated. |
| `docs/AGENT_MEMORY_FILES.md` | **New.** Verbatim mirror of all 9 agent memory files across the checked-out repos, with a table of what loads each one, and an explicit note on the two repos that have none. |

### Already merged before this session (do not rebuild)

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

## 3 · Outstanding — ordered by who can act

### Blocked on the founder (no agent can do these)

1. **The `$MADx` total supply.** Your stated source is the Crystex fair-launch campaign; that
   domain is egress-blocked, so the number has to come from you. It settles PART 0 §3 and
   PART II §9 contradiction 1 at once. Do not let anyone infer it from the `224,573,096` in
   the code — that is an **owner-modifiable cap**, not a total supply.
2. **Which `$MADx` address is real.** `0xb61ae772…fd18` is eliminated (it is ORKx, see §4);
   `0x6972370e…151f` is **unverified**. Three files cite the eliminated one as canonical.
3. **Run migration `0016`** — `npm run migrate:deploy`, then `npm run schema:verify` expecting
   **41/41**. Until then the market book, the price tape and the paid pack-mint all fall back
   to demo paths.
4. **Set `REGISTRAR_TOKEN`** in Vercel, or complaint resolution keeps returning 503 by design.
5. Carried forward, unchanged: the token distribution split · chain topology (Nova vs One) ·
   the two O-V deck canon conflicts (Wyoming vs New Mexico; "MAD Upshot") · near-miss
   patterns on real-money surfaces · `@neondatabase/serverless` vs ADR-008.

### Blocked on environment/access

- **Neon three-database merge** — still no single source database.
- **The two `.lock.yml` files** (`gh aw compile`) — both AI review gates are configured and
  have never run.
- **eslint / eslint-config-next / @types/node realignment** — needs a lockfile regen the
  sandbox cannot do.

### Open engineering work

| # | Item | Note |
|---|---|---|
| **T1** | One tokenomics engine — close the perp/stake bypass | PART 0 §5. The headline item. |
| #40 | Distribute the swap fee | You chose **"conserve now, distribute later"**: credit the gross fee to one treasury account, record the computed creator/community/protocol split as metadata, decide no waterfall. **Not started.** Needs a migration extending the `madx_ledger` `kind` CHECK constraint (`'welcome','buy','transfer_in','transfer_out','stake','unstake','claim','spend','refund'`) plus a treasury owner id. |
| #42 | Canon drift — two supply caps disagree | You chose **"just document"**: comment both sites naming the other, and add a test asserting `MADX_BETA.cap = 224_573_096` so the enforced number stops being unguarded. **Not started.** Also in scope: `lib/mpp-math.ts` shadows `calculateConviction`. |
| #41 | Settle-escalation siblings | The complaint route is fixed and merged. Remaining self-attested/body-supplied authority: `zeitgeist/succession:99`, `zeitgeist/auction`, `shield/opt-in:57-62` (whale eligibility), `tournament/match:39-44`, `markets/route.ts:76-79` (body-supplied `creatorWallet`). |
| #38 | Card collection display | Map `CardRow` → `NftCard` so owned cards render. |
| #39 | `logic-lab` and `sentiment-equalizer` wiring | Z-Liar is done; these two still render local tables. |
| #30 | Reconcile MASTER against shipped reality | Partly advanced this session; not finished. |
| #31 | `master-maths` Gradle gate (C5) | `master-maths/` is still matched by **no workflow at all**. |
| #26 | **HELD (billing)** — batch POST to the satire engine | Your hold, not a blocker. |

---

## 4 · Failed, timed out, or unverifiable this session

**This is the section that saves the next session the most time.**

- **`app.crystex.app` is egress-blocked.** `WebFetch` returns
  `{"error_type":"EGRESS_BLOCKED","domain":"app.crystex.app"}` — the proxy refuses the host
  outright. This is not a 404 and not rate-limiting: retrying, rewording the URL, or trying
  the campaign API path will all fail the same way. **It blocked the one thing you asked for**
  — the fair-launch total supply. No workaround exists from inside the container.
- **Blockscout cut the audit off half-finished.** The MCP server allows ~**10 tool calls per
  free session**, and the session was declared dead after two: the unlock call and one address
  lookup. The second call returned *"This session's `session_id` can no longer be used… obtain
  a Blockscout PRO API key at https://mcp.blockscout.com"*, and the server's own notice says
  that from **2026-10-08 all requests require a PRO key**. **Consequence: the finding is
  asymmetric.** `0xb61ae772…fd18` was read and eliminated — ERC-20 "Serpentine Orkain" /
  **ORKx**, 18 decimals, total supply 60.073728, 2 holders, unverified source, creator
  `0x49755F66C877040f8EF7F307263F74C352830149`. `0x6972370e…151f` was **never reached**.
  Anyone who acts on the first half alone will swap in a second unverified address.
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
- **MCP servers disconnected and reconnected repeatedly mid-session** (github, Blockscout,
  Vercel, Figma, Linear, HuggingFace and others, in both directions). Calls failed with
  `InputValidationError` or a hard disconnect and had to be re-loaded through `ToolSearch`.
  Budget for this: a tool that worked ten minutes ago may need its schema re-fetched.
- **Standing, and they will hit again:** `npm ci` / `npm install` **403** from the agent
  container, so there is no local `tsc`, `eslint`, `vitest` or `next build` — CI is the only
  verification, and `package-lock.json` must never be hand-edited. `*.neon.tech` and TCP 5432
  are blocked, so **no agent can apply or verify migration `0016`**.
- **`MADHATs-Gambit-Presentation` is empty.** The checkout contains only `.git` and `master`
  has no commits — `git log` exits 128. Nothing to hand off there yet.
- **`The-MDC/Vercel-Ai` was never cloned**, so its memory files are absent from
  `docs/AGENT_MEMORY_FILES.md`. Its AI-SDK skills surfaced through the harness, so it does
  carry agent context; the document says so rather than implying completeness.

---

## 5 · Suggested — not asked for, worth doing

- **The `config-drift-checker` request may already be satisfied — in the other repo.** You
  asked to implement `https://github.com/jameskomo/config-drift-checker` and it was never
  actioned. Before building anything, note that `MADHATs-Claude-Enhancement` already ships
  `scripts/check-config-drift.py` (exit 0 clean / 1 drift / 2 unreadable) **and**
  `scripts/test_config_drift.py`, wired into `hermes-verify.ps1`. So the real question is
  which of three things you meant: adopt the upstream tool there, port the existing checker
  into `MAD-MPP-2.23` to watch `vercel.json` / workflow / env drift, or something else.
  One sentence from you avoids building the wrong one.
- **Guard the `$MADx` address the way the canon numbers are guarded.** `gambit-game-math.test.ts`
  locks every constant by value; the token address is enforced in three files and asserted
  nowhere. One test would have caught the ORKx mismatch years earlier.
- **A `verify/lib/` test for the ledger boundary.** T1's real risk is a *new* value route
  being added outside the ledger. A test that enumerates routes touching stake/conviction/bid
  and asserts each reaches `spendWithin` would make the boundary enforceable instead of
  aspirational — the same trick `check-route-guards.mjs` already plays for auth.

---

## 6 · Do not redo

**Settled decisions — reopening these has already cost sessions:**

- **Hosting: Vercel + Neon** (2026-08-18). Part VIII is a contingency with named reopen
  triggers, *not* a pending proposal.
- **ADR-008: `pg` Pool + Route Handlers.** `@neondatabase/serverless` and Server Actions were
  explicitly evaluated and rejected. Marked "do not reopen without a superseding ADR".
- **One planning document.** ~150 docs were consolidated into MASTER; 114 files and ~36.5k
  lines deleted in the same commit. No `HANDOFF_*.md`, no `PLAN_*.md`.
- **Nothing gets removed from a route without explicit founder go-ahead** — your words:
  *"i never gave permissions of any kind for you to remove anything."*
- **Canonical numbers do not change without sign-off**: 1.88% fee, 28.8% community,
  40% Creator Ladder, $12M pre.

**Work already done — a fresh session would plausibly repeat these:**

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

**Two traps worth repeating from PART 0 §7:**

- **A green gate is not evidence until you confirm it is looking at something.** Three gates
  in this repo have silently scanned nothing. Check the **file count** a filter yields.
- **A vitest file outside `lib/` silently does not run** — `include` is `["lib/**/*.test.ts"]`.
