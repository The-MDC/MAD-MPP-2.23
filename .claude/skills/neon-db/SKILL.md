---
name: neon-db
description: Connect and operate the Neon MCP server as an MCP client — wiring https://mcp.neon.tech/mcp into Claude Code/Cursor/VS Code, authenticating by API key header vs OAuth, scoping it read-only or by tool category, and which tools exist. Use when the user wants an agent to talk to Neon directly, mentions the Neon MCP server, mcp.neon.tech, "add-mcp", or asks to run SQL / inspect schema / create a Neon branch from inside an agent session. For how this repo's Neon+Vercel preview-branch integration works, NEON_API_KEY rotation, the neon-pr-branch.yml 401, or DATABASE_URL behavior, use neon-vercel-integration instead.
---

# Neon MCP server

Wiring an MCP client to Neon and operating it safely.

**Scope.** This skill is about the **MCP client connection**. The sibling skill
`neon-vercel-integration` owns the integration itself — the three Neon+Vercel paths,
`neon-pr-branch.yml`, `NEON_API_KEY` rotation and the Aug-2026 401, migrations-as-code,
and the injected env-var table. Don't duplicate that here; link to it.

**Sourcing.** Assembled from Neon's published docs via web search plus first-hand
verification in this sandbox. `neon.com`, `neon.tech`, and `mcp.neon.tech` are all
blocked by this environment's egress proxy (403 CONNECT), so the primary docs were not
read directly. Confirm tool names against a live connection before destructive use.

Project for this repo: **`patient-wave-95491458`** (console:
https://console.neon.tech/app/projects/patient-wave-95491458). Most MCP calls want it.

## Connecting

Remote server: `https://mcp.neon.tech/mcp`, HTTP transport. Prefer it to the local
stdio server — no install, and npm is partly blocked here anyway.

### API key header — the only path that works non-interactively

```bash
claude mcp add --transport http neon https://mcp.neon.tech/mcp \
  --header "Authorization: Bearer <NEON_API_KEY>"
```

Equivalent `~/.claude.json`:

```json
{ "mcpServers": { "neon": {
    "type": "http",
    "url": "https://mcp.neon.tech/mcp",
    "headers": { "Authorization": "Bearer <NEON_API_KEY>" }
} } }
```

Use this for remote containers, CI, and any headless session. It's the same key the
CI workflow uses — see `neon-vercel-integration` for where to mint it.

### OAuth — interactive clients only

```bash
claude mcp add --transport http neon https://mcp.neon.tech/mcp
```

then `/mcp` to authorize in a browser. Without the header, `claude mcp list` reports
`! Needs authentication` and no tools attach. **A non-interactive session cannot
complete this flow** — don't try, and don't ask the user for tokens or callback URLs.
Use the API key form instead.

### Clients without HTTP transport

```bash
npx -y mcp-remote https://mcp.neon.tech/mcp
```

### `npx add-mcp` does not work here

`npx -y add-mcp https://mcp.neon.tech/mcp -a claude-code` fails with npm `E403` under
this sandbox's egress policy (the same policy that blocks `npm install`).
`claude mcp add` needs no npm — verified working.

## Scoping

Constrain at connect time rather than trusting prompt discipline.

| Control | Effect |
|---|---|
| `?readonly=true` | SELECT + schema inspection only; no branch creation, migrations, or auth writes |
| `x-read-only: true` header | same, header form |
| `?category=<name>` (repeatable) | load only those tool groups |

```
https://mcp.neon.tech/mcp?category=querying&category=schema
```

OAuth also offers a read-only scope at consent time.

Neon's guidance: **MCP is for development and testing — never point MCP agents at
production databases.** Here that means prefer a PR/preview branch over the project's
`main` Neon branch when an agent runs SQL.

Check which tools a config activates, without authenticating:

```bash
curl "https://mcp.neon.tech/api/list-tools?readonly=true&category=querying"
```

(Blocked from this sandbox — run locally.)

## Tools

Categories: `projects`, `branches`, `schema`, `querying`, `auth`, `data-api`,
`observability`, `docs`.

Commonly used: `list_projects`, `run_sql`, `create_branch`, `describe_table_schema`,
`prepare_database_migration`, `complete_database_migration`.

Two behaviours worth knowing:

- **`list_projects` returns only the first 10** by default. Raise `limit` before
  concluding a project is missing.
- **Migrations are two-phase.** `prepare_database_migration` applies to a temporary
  branch for verification; `complete_database_migration` promotes it. Prepare is not
  done — verify, then complete.

## Gotchas

- **API key ≠ connection string.** The MCP server and the CI branch action need the
  **API key**; the app needs the **connection string**. Conflating them is the most
  common failure. Vercel's Neon integration syncs the connection string and never the
  API key — so no amount of Vercel dashboard work fixes a bad key.
- **Read the status code before blaming the key.** `401` = the key is bad or revoked.
  `422` = the key authenticated fine and Neon rejected the request (as of Aug 2026 in
  this repo, that's the orphaned-preview-branch quota wall, not a credential problem —
  see `neon-vercel-integration`). `404` = wrong project ID. Rotating a key on a 422 is
  wasted work, and the same triage applies to MCP calls that fail.
- **MCP servers attach at session start.** Adding one mid-session does not load its
  tools; restart.
- **All Neon hosts are blocked from this sandbox** (403 CONNECT). Hand console and API
  steps to the user rather than trying to route around the proxy.
- **Branch deletion is destructive**, and per-PR branches in this repo carry a 14-day
  `expires_at`. Don't park anything you care about on one.
