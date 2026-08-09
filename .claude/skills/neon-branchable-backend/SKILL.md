---
name: neon-branchable-backend
description: Neon's copy-on-write branching semantics and the branchable backend — what a branch actually is (a pointer, not a copy), why branching a 100TB database costs the same as a 10MB one, the history window and instant restore, schema-only branches, branch expiry/TTL, and Neon Object Storage (S3-compatible, branch-aware, beta) plus neon.ts infrastructure-as-code. Use when designing per-PR or per-agent ephemeral environments, reasoning about Neon storage/compute billing, recovering lost data, deciding between branching and seeding a test DB, or working with Object Storage buckets that branch alongside Postgres. Triggers on "Neon branch", "copy-on-write", "branch per PR", "history window", "instant restore", "time travel", "reset from parent", "schema-only branch", "branch expiration", "Neon Object Storage", "neon.ts", "neon deploy", "lakebase".
---

# Neon: branching and the branchable backend

**Scope.** `neon-vercel-integration` owns the three Neon+Vercel wiring paths,
`neon-pr-branch.yml`, `NEON_API_KEY` rotation and how `DATABASE_URL` reaches a
preview. `neon-db` owns the Neon MCP server. This skill owns **what a branch is
and what it costs**, and the newer **branchable backend** surface.

---

## What a branch actually is

A branch is a **copy-on-write clone**. That phrase is doing real work — it is not
marketing for "a fast copy". Nothing is copied at create time.

Neon separates compute from storage. The storage layer keeps Postgres pages as
history, versioned by WAL, so it can point at a particular page without
duplicating the bytes underneath. Creating a branch writes **a pointer** into the
same pages as the parent. Parent and child read identical bytes until one of them
writes; on write, that branch gets a new page for the changed row and everything
untouched stays shared.

Three consequences that should drive your design:

1. **Branch count is cheap; divergence is what costs.** Storage grows only where
   a branch differs from its parent. Create one per PR, per agent run, per
   experiment.
2. **Size is irrelevant to speed.** *"Branching a 100 TB database feels exactly
   the same as branching a 10 MB one"* — roughly a second either way.
3. **Idle branches cost nothing in compute.** Compute scales to zero when the
   branch isn't working. You pay while it runs, not while it exists.

Creating a branch puts **no load on the parent**, so branching production is safe.

Every project has a root branch called `main`. Your first branch comes off it;
later branches can come off `main` or off any existing branch.

### Schema-only branches

When the parent holds sensitive data, branch the **schema without the rows**.
This is the right default for shared dev environments and anything an agent
touches — full-data branches of a production table put real customer data into a
preview environment that may be far less protected.

### Branch expiry (TTL)

Branches can carry an expiration date and delete themselves. Use it for CI
environments, agent runs, and feature branches with a known lifespan. It is the
direct fix for **orphaned branches exhausting a project's branch quota** — a
failure mode that surfaces as a 422 from the Neon API.

---

## History window, restore, and time travel

Branching from the past, instant restore, snapshots and Time Travel all depend on
Neon retaining a change log. The **history window** is the project-wide setting
(Console → Settings → Instant restore) that controls how far back they reach.

| Plan | Default | Maximum |
|---|---|---|
| Free | 6 hours | — |
| Paid | 1 day | — |
| Launch | | 7 days |
| Scale | | 30 days |

A longer window buys recovery range and costs storage, because more history is
kept. Set it deliberately.

Three recovery moves, distinct from one another:

- **Instant restore** — roll a branch back to a point in time inside the window.
- **Reset from parent** — discard a branch's divergence, snapping it back to its
  parent. The cheap way to refresh a stale preview branch.
- **Time Travel queries** — run SQL against a past state *without* restoring, for
  diagnosis or historical analysis.

If data is lost, the recovery path is bounded by the history window that was in
effect **at the time of loss**. Widening it afterward does not retroactively
create history.

---

## Neon Object Storage (beta)

S3-compatible object storage built into the Neon backend that **branches with
your Postgres**. Free during beta; expect rough edges.

One `branch_id` forks both the database and the buckets:

- The child inherits the parent's buckets and objects **as of that moment**.
- Uploads and deletes on the child never touch parent or siblings.
- Copy-on-write, same as the database — no upfront duplication.
- Deleting the child is as cheap as creating it.

### How it differs from Postgres branching under the hood

Postgres branches via the pageserver's page-level copy-on-write. Object Storage
uses a separate **lineage-and-versioning** system that branches in step with it:

- Each Object Storage branch keeps a **lineage** — an ordered record of itself,
  its parent, its grandparent, back to root.
- Every object write becomes a **new version row**, tagged with a version number.
- Creating a branch is **one write**: the child's lineage is the parent's lineage
  with the child prepended. Objects do not move.
- A read walks the lineage.
- Deleting an inherited file writes a **tombstone version** on the child; the
  parent's copy is untouched, and lookups on the child return the deletion from
  then on.

### Access

Real S3 wire protocol — point the AWS SDK, boto3, the AWS CLI or the Files SDK at
the branch endpoint and authenticate with a Neon credential. No separate cloud
account.

**Bucket visibility is set through Neon** (Console, API, or `neon.ts`) — `private`
(default) or `public_read` — **not** through S3 ACLs or bucket-policy calls. This
is deliberate: one permission system, not two. Do not reach for `put-bucket-acl`.

### neon.ts — infrastructure as code

```ts
import { defineConfig } from '@neon/config/v1';

export default defineConfig({
  preview: {
    buckets: {
      'my-bucket': {},                        // private by default
      'public-assets': { access: 'public_read' },
    },
  },
});
```

```bash
neon deploy    # provisions buckets on the linked branch, writes AWS_* to .env.local
neon branches create --name preview/feature-x --parent main
```

`neon deploy` writing credentials into `.env.local` is the ergonomic win — no
manual key wiring per environment.

---

## The wider branchable backend

Branching is being extended past Postgres and files. Also branching with your
data today:

- **Managed Better Auth** — users, sessions and auth config live in the
  `neon_auth` schema and branch with everything else, so previews get isolated
  auth state instead of sharing production identities.
- **Functions** — each branch gets its own deployment.
- **AI Gateway** — each branch gets its own endpoint.

The intended shape: an agent forks the *entire backend* into a disposable
isolated environment, works, and deletes it.

---

## Practical guidance

- **Prefer branching to seeding.** A branch arrives pre-hydrated with parent data
  in ~1s. Maintaining seed scripts to approximate production is strictly worse
  unless you need synthetic data.
- **Always set a TTL on automated branches.** Anything created by CI or an agent
  should expire. Quota exhaustion is the predictable failure otherwise.
- **Use schema-only for anything holding real user data.**
- **Reset from parent beats recreate** for refreshing a long-lived preview.
- **Free plan is generous** — up to 100 projects — so per-project isolation is
  viable, not just per-branch.

## References

- Branching overview — `https://neon.com/docs/introduction/branching`
- Object Storage — `https://neon.com/docs/storage/overview`
- Branch expiration — `https://neon.com/docs/guides/branch-expiration`
- Schema-only branching — `https://neon.com/docs/guides/branching-schema-only`
- Instant restore — `https://neon.com/docs/guides/branch-restore`
- Reset from parent — `https://neon.com/docs/guides/reset-from-parent`
- Time Travel — `https://neon.com/docs/guides/time-travel-assist`
- Branching via API / CLI / GitHub Actions —
  `https://neon.com/docs/guides/branching-neon-api`, `…-neon-cli`, `…-github-actions`
- **Full docs index for LLMs — `https://neon.com/docs/llms.txt`**

> Fetching note: `neon.com` is blocked by some egress proxies. `mcp__Exa__web_fetch_exa`
> retrieves these pages successfully where `WebFetch` returns `EGRESS_BLOCKED`.
