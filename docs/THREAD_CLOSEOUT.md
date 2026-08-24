# Thread close-out — 2026-08-24

**Source of truth is `docs/MAD_GAMBIT_MASTER.md`.** This file is transient: what happened in
this session, what is broken, and what to do next. It is **overwritten at every close-out** —
do not date it, version it, or keep the old one.

| | |
|---|---|
| Repo | **`The-MDC/MAD-MPP-2.23`** — transferred from `MADdegen/` since the session began. The `MADdegen/` remote still works by redirect, and this session's tool scope is still `maddegen/mad-mpp-2.23`. |
| Branch | `claude/custom-perpetual-concepts-g1aa4s`, reset onto `main` after its PR merged |
| `main` | `1252e19` |
| Last PR | **[#105](https://github.com/The-MDC/MAD-MPP-2.23/pull/105) — MERGED** 2026-08-22 as `2d53a7d` (3 commits, +290 −13, 2 files) |

---

## 1 · Start the next chat with this

> Working in `The-MDC/MAD-MPP-2.23`. Read `docs/MAD_GAMBIT_MASTER.md` **PART 0** first — it is
> the only planning document and holds all outstanding work. Then read `CLAUDE.md` for the
> standing constraints, and `docs/THREAD_CLOSEOUT.md` for where the last session stopped.
>
> **CI came back on 2026-08-24 ~16:18 UTC after an eight-day outage.** The first job to
> matter is **auditing what merged while it was down**: PRs **#105, #108 and #131** were all
> merged with *no* gate running. #108 restructured CI and moved `actions/checkout` v6→v4;
> #131 re-enabled production deploys from `main`. Re-run the gates on `main` and read those
> two diffs properly before building anything new.
>
> Ignore any workflow run still sitting in `queued` — those are orphans from the outage and
> will never complete. Judge CI health only by runs created after 2026-08-24 16:18 UTC.
>
> Do not re-audit hosting (settled: staying on Vercel + Neon, MASTER Part VIII), do not
> re-fix the `$MADx` transfer vulnerability (already fixed), and do not create a second
> planning document.

---

## 2 · Shipped this session — all merged in #105

| Commit | What it actually changed |
|---|---|
| `c1fa2c1` | Folded the restore/convergence handoff **into** MASTER rather than beside it; added **Part VIII**, the hosting audit |
| `3eb1ca1` | Fixed a Placeholder Guard pathspec bug; corrected MASTER's claim that CI was green |
| `4f13c80` | Recorded the decision to stay on Vercel + Neon; turned Part VIII into a contingency with named reopen triggers |

**Three stale facts in MASTER corrected**, each of which was a live trap:

1. **Migration count 14 → 15.** MASTER told the founder to author the Neon three-database merge
   as `0015_*`; `0015_pack_open_counter.sql` already exists. Following the doc would have
   collided with a committed migration mid-merge. Now `0016` in both places it appeared.
2. **The Kotlin client is dormant, not "abandoned."** `verify/lib/gambit-game-math.ts` names
   itself in its own header as a port of `master-maths/`'s `GambitMath.kt`; the palettes are
   byte-identical; the Compose screens map 1:1 onto shipped web features. It is a second
   client of one product → **Workstream C**.
3. **Nothing in CI gates `master-maths/`.** No path filter matches it.

**One broken gate found and fixed.** Placeholder Guard had been **scanning zero contracts since
it was written** — a git pathspec is not a shell glob, so `contracts/src/**/*.sol` matched
nothing (`*` already crosses `/`; `**` matches a literal path component). The pragma check
never saw a contract and the code-token check skipped `proxy.ts`, the SIWE gate. It passed by
scanning nothing, which reads as evidence. Verified by hand: 19 contracts, 321 TS/TSX files,
all pass.

**Also added this session (in this commit, not #105):** the `close-thread` skill and `CLAUDE.md`
— see §5.

---

## 3 · Outstanding, ordered by who can act

### 🔴 Blocked on the founder — no agent can do these

| # | Item | Why it is stuck |
|---|---|---|
| ~~**1**~~ | ~~**GitHub Actions will not run jobs**~~ | ✅ **RESOLVED 2026-08-24 ~16:18 UTC** — secret scan ran a real 21s job and passed. Outage ran 2026-08-16 08:07 → 2026-08-24 16:18. Root cause never visible from inside the container; if it recurs, *Settings → Billing → Actions* first. |
| **1a** | **Audit the three PRs that merged ungated** | 🟠 **The live consequence.** #105, #108 and #131 merged during the outage with nothing checking them. **#108 restructured CI itself** (collapsed to one job, path-filtered the guard, `actions/checkout` v6→v4) and **#131 re-enabled production deploys from `main`**. Re-run the gates on `main`, then read those two diffs properly. |
| **1b** | **Validate the Placeholder Guard fix** | It is merged to `main` and **has still never executed** — #108's path filters mean no docs-only change can trigger it. This session added `workflow_dispatch` so it can be run on demand: *Actions → Placeholder Guard → Run workflow*. Expect 19 contracts and ~321 TS/TSX files scanned; before the fix it was **0** contracts. |
| **2** | **Neon: three databases, one app** | `mad-mpp-2-23-postgres` (target) vs `Neon-DB-MADMPP` vs `neon-sky-park`. Until merged there is **no single source database**. Read-only inspection SQL is in MASTER Part II.5; the merge migration is **`0016_neon_merge.sql`**. Agents cannot reach `*.neon.tech` or TCP 5432. |
| **3** | **Neon free-tier ceiling** | Hit its quota on 2026-08-10; compute suspended, data intact. Independent of hosting and still unresolved. |
| **4** | **Generate the two `.lock.yml` files** | `gh aw compile`, then commit. Until then **both AI review gates are configured but have never run**. The Actions `GITHUB_TOKEN` is correctly forbidden from writing `.github/workflows/`. |
| **5** | **Confirm migrations 0012–0015 are applied** | The build no longer migrates; it is a manual `npm run migrate:deploy`. Nobody has confirmed prod is current. |
| **6** | **`CRON_SECRET` gates two routes** | `/api/v1/perps/roll` and `/api/v1/registrar/lapse` 401 without it. `lapse` is the sharper edge: under THE LAPSE, keys that stop being renewed **destroy on schedule** — the one place "not configured yet" quietly becomes "data erased". |
| **7** | Founder-gated ops | Rotate/confirm `NEON_API_KEY` · attach `madgambit.io` · GHAS toggles · push `v2.24-constellation` · Phase-4 named-subject gate (KMS choice, `MADPortraitKeyRegistry` deploy, 6 signed `registry_readiness` rows) |
| **8** | Open decisions in MASTER Part 0 §3 | `$MADx` supply (canon 888,888,888 vs deployed cap 224,573,096) · chain topology · token distribution split · near-miss patterns on real-money surfaces · two O-V deck canon conflicts |

### 🟡 Blocked on access this environment does not have

| Item | Blocker | Fix |
|---|---|---|
| **Supabase + Windsor.ai connectors** | Unauthorized; this session cannot run OAuth | Authorize in **claude.ai → connector settings**. Supabase is dead code per D03 — low priority. |
| **`The-MDC/mad-gambit-ui`** | Session scope is `maddegen/*`; cross-tier `add_repo` refused | **This may now be easier** — the main repo has moved to `The-MDC`. Worth retrying, because that repo may simply *be* the phone-frame UI, which would make Workstream C4 mostly redundant. |
| **`v2.24-constellation` tag** | Git proxy fails tag pushes (`send-pack: unexpected disconnect`); MCP is read-only for tags | One local `git tag -a … && git push origin …` |
| **npm registry** | 403 from the container | No local type-check/build/test is possible. **Never hand-edit `package-lock.json`.** |
| **`*.neon.tech`, TCP 5432** | 403 / unreachable | See §3 item 2 |
| **`sevalla.com`, `docs.sevalla.com`** | Egress-blocked | Four figures in Part VIII §7 remain ‹verify› |
| **`vrf.chain.link`, `docs.chain.link`** | `EGRESS_BLOCKED` | VRF constants marked ‹verify› must be read off live docs |

### 🟢 Open engineering work — no blocker but CI

Full detail in MASTER PART 0 §5.

- **Workstream C (new)** — C5 a Gradle CI job for `master-maths/` **first** (cheapest, and it
  makes C1–C4 verifiable) → C1 one design-token source → C2 `MadGambitApiService.kt` → C3
  reconcile the two maths (⚠️ a Part VI §13-class decision, do not resolve silently) → C4
  phone-frame theme + KAITO/NYSE/O-V/skin backend
- **B1-rest** — Octavian perps-deck container sizing (CSS deck-shell chrome only)
- **Phase 1** — `next/font`, `next/dynamic` code splitting (93 components / 19,455 lines ship
  eagerly), image optimization. **Measure LCP/CLS before and after or it is worthless** —
  nothing in CI measures this
- **Phase 2** — `useOptimistic`, haptics, persisted audio mute (default off), focus rings
  (3 `focus-visible` vs 92 `aria-`)
- **Phase 3–4** — Chainlink VRF on Sepolia, then mainnet + random juror selection.
  **Sequencing constraint: Phases 1–2 are prerequisites, not parallel work** — VRF makes
  pack-opening async, and on today's synchronous UI that is an unexplained freeze
- **CSP promotion** — `script-src`/`style-src` ship Report-Only by design. Two-line change once
  reports are quiet. **Review `connect-src` first.** Do not do this during any other risky change
- **Promote Lint / Slither / Dependency Review** from report-only once their backlogs are worked
  (Slither has ~135 untriaged findings — green means "ran")
- Carried: THE WIRE demo-row · raw-hex design-token scrub (~82 values, 5 panels) · 4 dead
  components · slot-auction clearing is manual

---

## 4 · Failed, timed out, or could not be verified

**Read this section before repeating any of it.**

| What | Result | Consequence / workaround |
|---|---|---|
| `npm ci` / `npm install` | **403** on registry tarballs | No local type-check, build or test **for the entire session**. For most of it CI was down too, so nothing could verify anything. **CI is back — use it.** |
| **GitHub Actions** | Down 2026-08-16 → 2026-08-24; **recovered** | Dominated the session. Left three ungated merges and a set of orphan `queued` runs. See §3 items 1a/1b. |
| **The guard fix is still unvalidated** | Merged into `main`, **never executed** | Passes when run by hand here; has never run in CI. `workflow_dispatch` was added this session so it can finally be triggered — see §3 item 1b. Treat as untested until that run completes. |
| `get_job_logs` | **HTTP 404** for every job | Could not read any CI logs; diagnosis had to be inferred from run metadata |
| `get_check_run` output | Empty `title`/`summary`/`text` | No error text available from the API either |
| `actions_list` | Response too large (411k and 72k chars) twice | Had to be sliced from a saved file via `python3` |
| MCP servers | Disconnected and reconnected mid-session (github, Vercel, Neon, others) | Tool schemas had to be re-loaded via `ToolSearch` |
| Supabase / Windsor.ai | Unauthorized | Session is non-interactive; cannot run OAuth |
| `sevalla.com`, `docs.sevalla.com` | Egress-blocked | **4 facts in Part VIII §7 are ‹verify›.** Check the pod price first — the reported S1→S2 jump is 4× price for 2× resources, odd enough to be a transcription artefact, and it is the difference between a $20 and a $40 baseline |
| `The-MDC/mad-gambit-ui` | `add_repo` refused, cross-tier | Retry now that the main repo has moved to `The-MDC` |
| `git push` of tags | Proxy `send-pack: unexpected disconnect` | Tag pushes must be done locally |

**Changed on `main` by others while this session ran** (worth knowing, not investigated here):
PR #108 collapsed CI to one job, added path filters to `placeholder-guard.yml`, and downgraded
`actions/checkout` **v6 → v4** — MASTER Part II.4 still says v6. PR #131 re-enabled production
deploys from `main`, which contradicts MASTER Part II.3's *"`main` does not auto-deploy"*.
**Both should be reconciled into MASTER next session.**

---

## 5 · The close-out mechanism — dual fail-safe

Two independent triggers, so a miss in one does not lose the handoff:

| Layer | File | How it fires |
|---|---|---|
| **Primary** | `.claude/skills/close-thread/SKILL.md` | Skill matching on "close this thread", "close out", "wrap this up", "session handoff", "hand off", "I'm done for today", "what's outstanding" |
| **Fail-safe** | `CLAUDE.md` → *"Closing a thread"* | **Always loaded** as project memory. Carries the full instruction inline, so it works even when skill discovery misses entirely |

These are genuinely independent: skill matching is probabilistic, `CLAUDE.md` is deterministic.

**The discipline both enforce:** durable items are folded into **MASTER first**, and only then is
`docs/THREAD_CLOSEOUT.md` written — one fixed path, overwritten every time. That is what keeps
this from becoming the ~150-scattered-docs problem again, one dated handoff at a time. If a
close-out lists items that were never actioned, they are **carried forward** into the new file
rather than preserved by keeping the old one.

`CLAUDE.md` also carries the standing constraints a fresh session otherwise rediscovers the hard
way: npm 403, Neon unreachable, cross-org scope, ADR-008 settled, and *a green gate is not
evidence until you confirm it is looking at something* — which has now caught **three** silently
empty gates in this repo.

---

## 6 · Suggested — not asked for, worth doing

1. **Reconcile MASTER against `main`'s last three PRs** (§4 note). Two facts in Part II are
   already stale — `checkout` v4-vs-v6 and `main` auto-deploy. Cheap now, misleading later.
2. **Retry `The-MDC/mad-gambit-ui` before building C4.** If it is the phone-frame UI, most of
   C4 is already written. The org transfer may have unblocked it.
3. **Add a `master-maths/` Gradle job (C5) the moment CI is alive.** It is the cheapest item in
   the whole queue and it closes the third instance of the empty-gate pattern.
4. **Audit the other path filters for the same bug.** Three gates have now been found scanning
   nothing. Check the *file count* each filter yields — `foundry.yml` and the new `ci.yml`
   filters have not been checked this way.
5. **Turn on branch protection once CI is green.** Right now nothing blocks a merge, which is
   how #108 and #131 landed unchecked.
6. **Decide the Neon tier before the merge, not after.** The free-tier ceiling (2026-08-10) will
   be hit again by a consolidated database holding three databases' data.

---

## 7 · Do not redo

- **Hosting is settled** — staying on Vercel + Neon (2026-08-18). Part VIII is a **contingency
  with named reopen triggers**, not a pending proposal. The audit found *optionality*, not a
  reason to move.
- **ADR-008 is settled** — `pg` Pool + Route Handlers. `@neondatabase/serverless` and Server
  Actions were explicitly evaluated and **rejected**. Do not reopen without a superseding ADR.
- **The `$MADx` transfer vulnerability is FIXED.** A stale-tree review reported it open. All
  seven `madx` routes use `lib/madx-route-auth.ts`.
- **`octavian-mesh.tsx` does not exist** — merged into `octavian-creature.tsx`. Zoom, orbit,
  click-select, pop-out, mood, shared state and the firefly swarm all already ship.
- **`--exclude-detectors=lob` is a detector collision, not a suppressed finding.** Foundry's
  `test_` + 38 alphanumerics matches Lob's key regex. Do not "fix" it by renaming test functions.
- **`master-maths/` must stay nested.** Both trees define `app/`; hoisting collides on
  `app/page.tsx` — the collision that made commit `8c7a195` read as a replacement.
- **Do not create a second planning document.** Not a handoff file, not a plan file. MASTER, or
  this file.
- **Placeholder stubs — do not restore:** `lib/auth/siwe.ts`, `app/api/session-keys/*`,
  `SessionKeyManager.tsx`, root `middleware.ts`, `ai-backend/.../auth.py`.
