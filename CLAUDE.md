# MAD-MPP-2.23 — standing instructions

## Read this first

**`docs/MAD_GAMBIT_MASTER.md` is the single source of truth.** Outstanding work is **PART 0**,
at the top; everything after it is reference. Read PART 0 before planning anything.

**Do not create a second planning document.** MASTER's own header says so, and the rule was
earned: ~150 scattered planning docs were consolidated into it, with 114 files and ~36.5k
lines deleted in the same commit. New durable facts, TODOs and decisions get **folded into
MASTER** in the right Part — never filed beside it as a dated `HANDOFF_*.md` or `PLAN_*.md`.

The only sanctioned generated file is `docs/THREAD_CLOSEOUT.md` — a single, fixed-path,
always-overwritten session handoff. See "Closing a thread" below.

`AGENTS.md` is the in-app **MADHAT'r persona** for LLM features. It is not agent operating
instructions and does not govern how you work in this repo.

## Closing a thread

**When the user says "close this thread"** — or "close out this thread", "wrap this up",
"session handoff", "hand off", "I'm done for today", or otherwise signals the session is
ending — do this:

1. **Invoke the `close-thread` skill** (`.claude/skills/close-thread/SKILL.md`). It carries
   the full procedure and template.
2. **If that skill does not load for any reason, do it manually anyway** — this instruction
   is the fail-safe, and the requirement does not depend on the skill being found:
   - Fold every **durable** item from the session into `MAD_GAMBIT_MASTER.md` **first**
     (corrections where the wrong fact lived, new work into PART 0 §5, founder-only items
     into §3/§4, new environment constraints into §6, future-session traps into §7, a dated
     line in PART I).
   - Then write **`docs/THREAD_CLOSEOUT.md`**, overwriting it, containing: a paste-able
     new-chat opener · what shipped · outstanding items grouped by *who can act* · **everything
     that failed, timed out, or could not be verified** · suggested extras · and a "do not
     redo" list.
   - Verify every count and path against the tree before writing it. Mark anything
     unverifiable as ‹verify› and say why.
   - **Commit and push.** The container is ephemeral — an uncommitted close-out is lost.

Never let the close-out become the record while MASTER goes stale. MASTER first, always.

## Working constraints that will bite you

- **`npm ci` / `npm install` fail — the npm registry is 403 from the agent container.** No
  local type-check, build, or test is possible. CI is the only real verification. **Never
  hand-edit `package-lock.json`** — every CI job runs `npm ci`.
- **`*.neon.tech` and TCP 5432 are blocked.** No agent can inspect or migrate the database.
- **Cross-org `add_repo` is refused** — this session is scoped to owner `maddegen`.
- **A green gate is not evidence until you confirm it is looking at something.** Three
  separate gates in this repo have silently scanned nothing: `contracts/script/**` outside
  `foundry.yml`'s filter, `master-maths/` matched by no workflow at all, and Placeholder
  Guard's pathspecs (`contracts/src/**/*.sol` matched **0** files — git pathspecs are not
  shell globs; `*` already crosses `/` and `**` matches a literal path component). Check the
  **file count** a filter yields, not just its exit code.

## Repo shape

**Two repos, one source of truth (founder decision, 2026-11-03).** `The-MDC/MAD-MPP-2.23` is the
working repo: all code changes land on its `main`, and it feeds Vercel preview and production and
Supabase. `The-MDC/MADGambit-Official-MMP` (private) stores the Supabase and Vercel material and the
official, untainted production build, and receives only what production already runs. If a session
opens in a clone of the private repo, do not build, open PRs or deploy from it. `MAD-MPP-2.23` is
public, so check private material before pushing it there.

- `verify/` — the Next.js 16 app, and **Vercel's configured root directory**
- `contracts/` — Solidity + Foundry, Arbitrum One
- `master-maths/` — the Jetpack Compose Android client. **Dormant, not abandoned**: it is a
  second client of the same product, and the web maths is a port of *its* `GambitMath.kt`.
  Keep it nested — both trees define `app/`, and hoisting it back collides on `app/page.tsx`.
- `docs/MAD_GAMBIT_MASTER.md` — the only planning document

## Data pattern — settled, do not reopen

**ADR-008: `pg` Pool + Next.js Route Handlers.** `@neondatabase/serverless` and Server Actions
were explicitly evaluated and rejected. Marked *"Settled. Do not reopen without a new ADR
superseding this one."*

**Hosting: staying on Vercel + Neon** (decided 2026-08-18). MASTER Part VIII is the migration
audit, retained as a **contingency with named reopen triggers** — not a pending proposal.
