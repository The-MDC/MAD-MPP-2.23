# Handoff — Neon project merge (three databases → one)

**Date:** 2026-08-14 · **Follows up on:** STEP 3 of `docs/HANDOFF_2026-08-12_FULLSTACK_RECONCILIATION.md`
("Resolve the Neon project split," marked founder-only). This document does not
supersede that STEP — it names the concrete databases and adds the inspection
script needed to actually execute it. Read STEP 3 there first.

**Status: prep only.** No database was queried, altered, or deleted while writing
this. See §1 for why, and §3 for what still needs to happen and by whom.

---

## 0 · What's confirmed now that wasn't on Aug 12

The Aug-12 handoff knew there were two Neon projects (`patient-wave-95491458` and
"sky park") but not which one the app actually reads, nor a resolution plan. As of
today, per the founder, there are three Postgres databases live under the same
Neon-via-Vercel integration on the `mad-mpp-2-23` project:

| Role | Name (as shown in Vercel/Neon) | Vercel storage tab |
|---|---|---|
| **Target** | `mad-mpp-2-23-postgres` | confirmed attached, Neon · Free (see storage screenshot, this session) |
| Source | `Neon-DB-MADMPP` | to be compared, then retired |
| Source | `neon-sky-park` | to be compared, then retired — likely the "sky park" project STEP 3 already flagged |

**Founder's stated sequence** (verbatim intent, preserved so this doc and the chat
thread stay in sync):

1. Open each of the three in Neon; compare schemas and row-level conflicts.
2. Confirm source tables/data and a conflict policy.
3. Founder prepares the exact merge migration from that comparison.
4. Validate row counts and application behavior against the merged result.
5. **Only then** delete `Neon-DB-MADMPP` and `neon-sky-park`.

Blob storage (`mad-mpp-2-23-blob`) is explicitly out of scope and will not be
touched by this work.

## 1 · Why this agent session can't run step 1 itself

Confirmed live, not assumed from ADR-008's prior text:

```
$ curl -sS -o /dev/null -w "%{http_code}\n" https://console.neon.tech
curl: (56) CONNECT tunnel failed, response 403

$ curl -sS -o /dev/null -w "%{http_code}\n" https://api.neon.tech
curl: (56) CONNECT tunnel failed, response 403

$ timeout 5 bash -c 'echo > /dev/tcp/pg.neon.tech/5432'
TCP-5432-BLOCKED-OR-UNREACHABLE
```

This matches `docs/imported/specs/ADR-008-runtime-db-driver.md`: agent-container
network egress to `*.neon.tech` and Postgres port 5432 is deliberately blocked, not
merely unconfigured. No Neon MCP server is connected to this session either, so
there is no read-only path around the block right now. Two ways to unblock, neither
exercised here:

- **Founder runs the inspection** — the query in §2 pasted into each database's
  Neon SQL Editor, results pasted back for a real diff. Needs nothing new granted.
- **Connect a Neon MCP server to a future agent session**, scoped read-only (see
  `.claude/skills/neon-db`), so an agent can query directly. Requires the founder
  to run the OAuth/API-key flow interactively — an agent session can't do this for
  itself.

Either way, no agent should get *write* access for this task. The founder is
already driving the merge-migration authorship and the delete step by design (§0);
read-only is all this needs.

## 2 · Inspection query — run once per database, unmodified

Read-only. Does not write, alter, or delete anything. Run in `mad-mpp-2-23-postgres`,
then `Neon-DB-MADMPP`, then `neon-sky-park`, and keep the three outputs together —
that's what turns "compare schemas and row conflicts" from a manual eyeball exercise
into an actual diff.

```sql
-- A: every table in the public schema
select table_name
from information_schema.tables
where table_schema = 'public' and table_type = 'BASE TABLE'
order by table_name;

-- B: column fingerprint per table — name, type, nullability, default
select table_name, ordinal_position, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;

-- C: primary keys — this is what "conflict" means per table once two sets of rows meet
select tc.table_name, kcu.column_name
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
where tc.constraint_type = 'PRIMARY KEY' and tc.table_schema = 'public'
order by tc.table_name, kcu.ordinal_position;

-- D: approximate row counts (reads planner stats — fast, not a full table scan)
select relname as table_name, n_live_tup as approx_row_count
from pg_stat_user_tables
order by n_live_tup desc;
```

Paste all three runs back (chat, or as a fourth section appended to this file) and
the actual schema/conflict comparison — table-name overlaps, column-shape mismatches
on same-named tables, which source has rows a target table is missing — can happen
from there without needing DB access.

## 3 · Next steps, and who does them

| Step | Who | Status |
|---|---|---|
| Run §2 against all three databases | founder (or a future MCP-connected agent) | not started |
| Diff the three outputs; decide conflict policy per overlapping table | founder + agent, from the diff | blocked on the above |
| Author the merge migration (`verify/sql/00NN_neon_merge.sql`, following the existing `migrate.mjs` / `db-migrate.yml` migrations-as-code convention) | founder, per their stated intent in §0 | blocked on the above |
| Validate row counts + app behavior against the merge | founder | blocked on the above |
| Delete `Neon-DB-MADMPP` and `neon-sky-park` | founder | **only after validation** — not before |
| Re-check `/api/v1/health/db` once the canonical project is confirmed | agent (allowlisted, no credentials needed) | see §4 |

## 4 · Likely connection to the existing production incident

`docs/HANDOFF_2026-08-12_FULLSTACK_RECONCILIATION.md` §0.45 measured
`/api/v1/health/db` returning a `503` with a `~10s` connection timeout — the
signature of a host that never answers, not a missing-schema error — and named the
Neon project split as the likely cause. This three-database situation is almost
certainly that same split, now with concrete names attached. Once the canonical
project is confirmed and `DATABASE_URL` (or the Vercel-Neon integration's env var)
points at it, `/api/v1/health/db` is already built, already unauthenticated, and
already the right tool to confirm the fix — no new endpoint needed, per STEP 8 of
the Aug-12 handoff.

---

*No live database action was taken while producing this document. `docs/VERCEL_PROJECT_SETUP.md` describes the Redis/Postgres/Blob/LaunchDarkly storage layout this merge sits inside; this file is scoped narrowly to the three-Postgres-database merge only.*
