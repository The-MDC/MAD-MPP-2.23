---
name: neon-vercel-integration
description: Understand and operate Neon Postgres + Vercel integration patterns — the Vercel-Managed (native) integration, the Neon-Managed (connectable account) integration, and a fully custom GitHub-Actions branch-per-PR setup like this repo's neon-pr-branch.yml. Use when diagnosing a broken Neon preview-branch workflow, deciding whether to migrate off a custom Actions-based setup, wiring migrations-as-code into preview deployments, tracking down orphaned/archived Neon branches, or explaining DATABASE_URL / preview-branch environment variable behavior on Vercel. Triggers on "Neon", "DATABASE_URL", "preview branch", "NEON_API_KEY", "neon-pr-branch", "Vercel Postgres", "branch-per-PR", "Neon migration".
---

# Neon + Vercel Integration Patterns

Three distinct ways a Vercel project gets a per-preview-deployment Neon Postgres branch exist. They are **not interchangeable** and get confused constantly — the first thing this skill does is help you identify which one a given repo is actually running, because the fix/diagnosis differs completely per path.

## Identify which path you're on

| Signal in the repo/dashboard | Path |
|---|---|
| `.github/workflows/*.yml` calling `neondatabase/create-branch-action` / `delete-branch-action` directly, with `NEON_API_KEY` + `NEON_PROJECT_ID` as **repo secrets you manage** | **C — Custom GitHub-Actions** (fully self-rolled) |
| Vercel project → **Storage** tab shows a Neon database, org named `Vercel: <name>` in the Neon Console, env vars auto-injected with no visible connection string in your own env var settings | **A — Vercel-Managed** (aka Neon Postgres Native Integration) |
| A Neon project you already owned, connected to Vercel via the "Connectable Account" flow, billed directly by Neon | **B — Neon-Managed** |

MAD-MPP-2.23 runs **Path C** (`.github/workflows/neon-pr-branch.yml`) — a hand-rolled version of what Path A gives you for free. This is why the NEON_API_KEY 401 problem blocks *branch creation for every PR*, not just one project: in Path C, that key is a single point of failure you own; in Path A, Vercel manages the credential lifecycle for you.

## Path A — Vercel-Managed Integration (the native one)

Source: https://neon.com/docs/guides/vercel-managed-integration

**What it is**: install from the [Vercel Marketplace](https://vercel.com/marketplace/neon), billing flows through the Vercel invoice, Vercel creates/owns the Neon project in an org named `Vercel: <account>`.

**Setup**:
1. Vercel Marketplace → Neon → Install → "Create New Neon Account" (or link an existing one).
2. Storage tab → **Connect Project** → pick the Vercel project + environments (Development/Preview/Production).
3. Advanced Options → Deployments Configuration → toggle **Preview** on to enable **Automated Preview Branching**.
4. To auto-run migrations per preview: Vercel Dashboard → Settings → Build and Deployment Settings → Override the build command, e.g. `npx prisma migrate deploy && npm run build` (swap in whatever migration runner the project uses — raw `psql -f`, Drizzle, etc.).

**Env vars it injects automatically** (do not hand-roll these):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Pooled (PgBouncer) connection string |
| `DATABASE_URL_UNPOOLED` | Direct connection string |
| `PGHOST`, `PGHOST_UNPOOLED`, `PGUSER`, `PGDATABASE`, `PGPASSWORD` | Raw pieces for custom connection strings |
| `POSTGRES_*` | Legacy aliases, back-compat with old Vercel Postgres templates |
| `NEON_AUTH_BASE_URL`, `VITE_NEON_AUTH_URL` | Only if Managed Better Auth is enabled on the production branch — these ship to preview branches too |

**Critical gotcha — branch cleanup is NOT tied to PR close.** (Source: https://neon.com/docs/guides/vercel-branch-cleanup)
In this path, a Neon preview branch is deleted only when its **Vercel deployment** is deleted, not when the git branch is deleted or the PR closes. Vercel's default retention for pre-production deployments is **180 days**, so a branch from a long-closed PR can sit around for up to six months, quietly counting against your Neon plan's branch limit and storage. Three ways to actually control this:
- Lower **Settings → Security → Deployment Retention Policy → Pre-Production Deployments** to the shortest option (team-wide default under Team Settings → Security & Privacy).
- Delete the Vercel deployment manually (`vercel remove`, or `DELETE /v13/deployments/{id}`) — this *does* trigger immediate Neon cleanup.
- Add a `neondatabase/delete-branch-action` GitHub Action on `pull_request: closed` for immediate, deterministic cleanup regardless of Vercel's retention settings — the recommended workaround, and notably **the same primitive Path C already uses**, just aimed only at cleanup rather than the whole lifecycle.

Also: Vercel keeps a minimum number of recent deployments regardless of retention settings ("retention exceptions") — branches behind those won't auto-clean either; the GitHub Action is the only way to force it for those.

**Limitations**: can't run alongside the Neon-Managed integration in the same project · `neon auth` CLI doesn't work (API-key auth only) · can't install if the project still uses deprecated Vercel Postgres (migrate off it first) · preview-branch connection variables are injected at deploy time only and are **not visible** in the Vercel project's env var settings UI (by design, so there's nothing to manually clean up when a branch is deleted).

## Path B — Neon-Managed Integration

Source: https://neon.com/docs/guides/neon-managed-vercel-integration (not fetched in full this pass — fetch before advising on it if a decision hinges on its specifics)

Use when the team already has a Neon account/project and wants to keep Neon as the billing relationship, just linking it to Vercel for env var injection. Branch cleanup here is **git-branch-deletion-driven**, not deployment-deletion-driven — the opposite of Path A, and arguably the more intuitive behavior for a `create-on-PR-open, delete-on-PR-close` mental model.

## Path C — Custom GitHub Actions (what this repo runs today)

`.github/workflows/neon-pr-branch.yml` calls `neondatabase/create-branch-action` on `pull_request: opened/reopened` and `neondatabase/delete-branch-action` on `closed`, authenticated with a `NEON_API_KEY` repo secret and a `NEON_PROJECT_ID` repo variable. This gives full control (e.g. running migrations as an explicit workflow step) at the cost of owning the whole lifecycle yourself — including credential rotation.

**Known failure mode (hit in this repo, Aug 2026):** `NEON_API_KEY` returning 401 blocks the `create_neon_branch` job for every open PR. Fix: rotate the key at console.neon.tech → Account → API keys → update the `NEON_API_KEY` repo secret. Both `create_neon_branch` and `delete_neon_branch` jobs should carry `continue-on-error: true` so an expired key degrades to "no preview DB branch this PR" instead of red-flagging an otherwise-mergeable PR — that fix already shipped here (`ci(fix): Neon PR-branch jobs are non-blocking`).

**Migrations-as-code — already shipped here.** `neon-pr-branch.yml` runs `npm run migrate` (→ `verify/scripts/migrate.mjs`) and then `npm run db:smoke` against the freshly-created branch. The runner applies every `verify/sql/*.sql` in sorted order, each in its own transaction, tracked in a `_migrations` table so re-runs are no-ops. "Paste SQL into the Neon console" is already retired — do not re-plan it.

## Runbook — deployment failure caused by Neon credentials

**First: read the status code. It tells you which problem you have.**

| Code | Meaning | Go to |
|---|---|---|
| **401** | Key is bad/expired — auth failed | Steps 1–4 below |
| **422** | Key is *fine*; Neon rejected the request body — almost always the branch quota | "422 — orphaned branches" below |

Do not rotate the key on a 422. The key authenticated successfully; rotating it changes nothing and costs you a working credential.

### 422 — orphaned branches exhausting the quota (hit here, Aug 2026)

Root cause is a **create/delete naming mismatch that leaks branches permanently**:

- `create` names the branch `preview/pr-${number}-${branch}`
- older branches were created under a scheme *without* the `pr-N-` prefix — `preview/feat/constellation-s0`, `preview/vercel-agent/fix-deployment-health-checks`
- `delete` computes the `pr-N-` name, doesn't find the legacy one, and fails with `Branch <name> not found`
- because `delete_neon_branch` is `continue-on-error: true`, that failure is invisible at PR level — the orphan is never cleaned up

Every leaked branch counts against the project's branch limit. Once the project hits it, **every subsequent create returns 422** and every PR loses its preview DB, its migrations run, and its smoke test.

**Diagnosing it without Neon dashboard access:** the `delete-branch-action` prints the full live branch list when it fails to find its target — `Available branches: ...`. That log line is the cheapest inventory of what's actually leaked. Find it in any failed `Delete Neon Branch` job.

**Fix:** delete the orphans (Neon console → Branches, or `neonctl branches delete <name> --project-id <id>`). Keep `main` and any branch belonging to a currently-open PR. Then re-run the failed job.

**Preventing recurrence:** branches created by the current workflow carry `expires_at` (+14 days), so *new* orphans self-clean. Legacy pre-`expires_at` branches do not and must be removed by hand once. If the naming scheme ever changes again, delete every branch under the old scheme in the same change.

### 401 — expired or rotated key

Work these in order; **never paste a key into chat, a commit, a PR body, or an issue.**

**1 · Rotate the key at Neon.** [console.neon.tech](https://console.neon.tech) → Account settings → **API keys** → create a new key (and revoke the old one once step 4 is green). Copy it straight into step 2 — it is shown once.

**2 · Update the GitHub Actions credentials.** Repo → Settings → Secrets and variables → Actions.

| Name | Where it goes | Why |
|---|---|---|
| `NEON_API_KEY` | **Secret** tab | Read as `secrets.NEON_API_KEY` by both jobs |
| `NEON_PROJECT_ID` | **Variables** tab | Read as `vars.NEON_PROJECT_ID` |

⚠️ **`NEON_PROJECT_ID` must be a repository _variable_, not a secret, in this repo.** Both jobs are gated on `if: ... && vars.NEON_PROJECT_ID != ''`. Put it in Secrets only and `vars.NEON_PROJECT_ID` evaluates empty, so the jobs **silently skip** — the PR goes green with no Neon branch, no migrations, and no smoke test. That reads as "fixed" and isn't. Neon's own guide says "variable or secret" generically; here it is specifically a variable.

**3 · Vercel runtime stays on canonical `DATABASE_URL`.** [Project → Settings → Environment Variables](https://vercel.com/madgambit/mad-mpp-2.23/settings/environment-variables). `verify/lib/db.ts` reads `process.env.DATABASE_URL` and nothing else — no `POSTGRES_*` aliases, no `DATABASE_URL_UNPOOLED` fallback. It also auto-enforces TLS (`rejectUnauthorized: true`) when the string carries no `sslmode=`, so a Neon URL works with or without the parameter. This variable is what the *deployed backend* reads; the Actions secrets in step 2 only affect *preview-branch provisioning*. They are independent failure domains — fixing one does not fix the other.

**4 · Verify before revoking the old key.** Reopen any PR (or open a throwaway one) and confirm `Create Neon Branch` goes green *and* that its `Apply migrations` + `Live DB smoke` steps ran. A skipped job is not a pass — check the job actually executed. Both jobs carry `continue-on-error: true`, so a still-broken key shows as a green PR with a failed job inside it. Only then revoke the old Neon key.

> Note: steps 1–3 are all dashboard actions on external services. They cannot be performed from a Claude Code session — repository settings writes, including Actions secrets, are refused by the agent proxy (`403 Repository settings writes are not permitted through this proxy`).

## Choosing between them (decision framing, not a mandate)

Stay on **Path C** if you want migrations to run as an explicit, auditable workflow step and don't mind owning key rotation. Move to **Path A** if the actual goal was "stop maintaining this workflow" — it's a ~10-minute Marketplace install, Vercel injects and rotates the connection env vars, and you get the same `delete-branch-action` GitHub Action available as a cleanup supplement if the 6-month default retention is too slow. Moving to Path A does **not** eliminate the need for a migration-runner step — it just relocates it into the Vercel build command instead of a separate Actions job.

Do not run Path A and Path C simultaneously against the same Neon project — both will try to create/delete branches on the same PR lifecycle events and will race or double-create.

## References

- `references/env-vars.md` — the full injected-variable table plus legacy `POSTGRES_*` aliases, for quick lookup without re-fetching the docs.
