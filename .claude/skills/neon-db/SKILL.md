---
name: neon-db
description: Connect to and operate the Neon Postgres MCP server for this repo — minting API keys, wiring the remote MCP into Claude Code/Cursor/VS Code, scoping it read-only, running SQL, and managing per-PR database branches. Use when the user mentions Neon, NEON_API_KEY, NEON_PROJECT_ID, DATABASE_URL, the "Create Neon Branch" CI job, per-PR database branches, Postgres migrations for this project, or hits a 401/403 from the Neon API. Also use when wiring THE WIRE ingestion tables (headlines_raw / headlines_scored) or any Neon-backed schema work.
---

# Neon for MAD Gambit

Operating the Neon Postgres MCP server and this repo's Neon integration.

**Sourcing note:** built from Neon's published docs via web search plus first-hand
verification in this sandbox. `neon.com`, `neon.tech`, and `mcp.neon.tech` are all
blocked by this environment's egress proxy (403 CONNECT), so the primary docs could
not be read directly. Tool names and parameters below should be confirmed against a
live connection before being relied on for anything destructive.

## This project's Neon facts

| Thing | Value |
|---|---|
| Neon project ID | `patient-wave-95491458` |
| Console | https://console.neon.tech/app/projects/patient-wave-95491458 |
| CI workflow | `.github/workflows/neon-pr-branch.yml` |
| Repo secret | `NEON_API_KEY` (Settings → Secrets → Actions) |
| Repo variable | `NEON_PROJECT_ID` |
| Default DB / role | `neondb` / `neondb_owner` |
| Consumed by | `verify/lib/db.ts` → `getDbPool()` via `DATABASE_URL` (plain `pg`, provider-agnostic) |

The CI workflow creates a database branch per PR (`preview/pr-<n>-<branch>`) on open and
deletes it on close, using `neondatabase/create-branch-action@v6`.

## Connecting

Remote server: `https://mcp.neon.tech/mcp` (HTTP transport). Prefer it over the local
stdio server — no npm install, and this sandbox's npm registry blocks `add-mcp` and
`@neondatabase/mcp-server-neon` anyway.

### API key auth — use this for headless/CI/non-interactive sessions

```bash
claude mcp add --transport http neon https://mcp.neon.tech/mcp \
  --header "Authorization: Bearer <NEON_API_KEY>"
```

This is the path that works when OAuth can't run (remote containers, CI, any
non-interactive session). Equivalent `~/.claude.json`:

```json
{ "mcpServers": { "neon": {
    "type": "http",
    "url": "https://mcp.neon.tech/mcp",
    "headers": { "Authorization": "Bearer <NEON_API_KEY>" }
} } }
```

### OAuth — interactive desktop/IDE only

```bash
claude mcp add --transport http neon https://mcp.neon.tech/mcp
```

Then `/mcp` in an interactive session to authorize in the browser. Without the
`Authorization` header, `claude mcp list` reports `! Needs authentication` and no
tools attach. **A non-interactive session cannot complete this** — use the API key.

### Do not use `npx add-mcp` here

`npx -y add-mcp https://mcp.neon.tech/mcp -a claude-code` fails in this sandbox with
npm `E403` on the `add-mcp` tarball. `claude mcp add` needs no npm and is the
reliable path.

### Older clients without HTTP transport

```bash
npx -y mcp-remote https://mcp.neon.tech/mcp
```

## Scoping and safety

Restrict the server at connect time — cheaper and safer than trusting prompt discipline.

- **`?readonly=true`** — SELECT and schema inspection stay; branch creation, migrations,
  and auth-config writes are disabled.
- **`x-read-only: true`** header — same effect, header form.
- **`?category=<name>`** (repeatable) — restrict which tool groups load:
  `https://mcp.neon.tech/mcp?category=querying&category=schema`
- OAuth also offers a read-only scope during the consent flow.

Neon's own guidance: **MCP is for development and testing — do not point MCP agents at
production databases.** For this repo that means prefer a PR/preview branch over the
`main` Neon branch when an agent is running SQL.

Inspect the active tool set for a config without authenticating:

```bash
curl "https://mcp.neon.tech/api/list-tools?readonly=true&category=querying"
```

(Blocked from this sandbox; run it locally.)

## Tool categories

| Category | Covers |
|---|---|
| `projects` | create/list/manage projects |
| `branches` | create, reset, delete branches |
| `schema` | tables, columns, indexes |
| `querying` | run SQL, explain plans |
| `auth` | Neon Auth users and sessions |
| `data-api` | RESTful data endpoints |
| `observability` | function and storage logs |
| `docs` | search and fetch Neon docs |

Commonly used tools: `list_projects`, `run_sql`, `create_branch`,
`describe_table_schema`, `prepare_database_migration`, `complete_database_migration`.

`list_projects` returns only the first 10 by default — raise `limit` if a project
seems missing.

**Migrations are two-phase.** `prepare_database_migration` applies the change to a
temporary branch for verification; `complete_database_migration` promotes it. Don't
treat prepare as done — always verify, then complete.

## Recipes

### Rotate a dead `NEON_API_KEY` (401 on the CI job)

A 401 from `create-branch-action` means the key is revoked or expired — not a project
or workflow problem. Vercel's Neon integration syncs the **connection string**, not the
**API key**, so this cannot be fixed from Vercel.

1. Neon Console → **Organization settings → API keys** → create key (shown once)
2. Set it as repo secret `NEON_API_KEY`
3. Confirm repo variable `NEON_PROJECT_ID` = `patient-wave-95491458`
4. Re-run the failed workflow

A wrong project ID gives 404, not 401 — use the status code to tell them apart.

### Don't let a rotated key red every PR

The per-PR branch is a convenience, not a merge gate. Keep those jobs
`continue-on-error` so a key rotation can't block unrelated work.

### Refresh `DATABASE_URL`

Take the **pooled** connection string from the console (or the Vercel integration's
synced env var). `verify/lib/db.ts` uses plain `pg` with no provider coupling, so any
Postgres URL works. Set it in Vercel for Production and Preview.

## Gotchas

- **API key ≠ connection string.** The MCP server and `create-branch-action` need the
  API key; the app needs the connection string. Confusing them is the most common
  failure here.
- **MCP servers attach at session start.** Adding one mid-session doesn't load its
  tools — restart.
- **Neon hosts are blocked from this sandbox** (`neon.com`, `neon.tech`,
  `mcp.neon.tech` → 403 CONNECT). Don't try to route around it; hand console/API steps
  to the user, or run them from a machine with open egress.
- **Branch deletion is destructive** and per-PR branches carry an `expires_at`
  (14 days in this workflow). Don't park data you care about on one.
