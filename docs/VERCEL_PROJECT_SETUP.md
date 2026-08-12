# Vercel Project Setup — `mad-gambit-2.23`

**Status: the old project is gone.** This repo carried a committed `.vercel/repo.json`
binding it to project `mpp2.23` (`prj_4IdDBNaVoeUWutoEGbCc2zyzYpc7`) on team MAD-Gambit —
that project returns **404** (deleted). Pushes deployed nowhere and there was no project
for the Neon integration to attach to. This document stands up the replacement,
**`mad-gambit-2.23`**, Vercel-managed end to end, on the Pro team
(`madgambit` / `team_TgoOJAiilwZ3I3LPyD2FcNZm`).

What this branch already changed in the repo (no action needed):

| Done in repo | Effect |
|---|---|
| `.vercel/repo.json` deleted, `.vercel/` gitignored | new project links cleanly; no CLI fights |
| `build` = `node scripts/migrate.mjs && next build` | every deploy migrates its environment's DB; previews migrate their own Neon preview branch |
| `migrate.mjs`: `SKIP_MIGRATIONS=1` escape hatch + Neon-suspension hint | deploys possible while the DB is quota-suspended — deliberately and loudly, never silently |
| `crons` added to `verify/vercel.json` (rollup hourly · perps/roll daily 00:00 UTC · registrar/lapse daily 00:30 UTC) | the three cron routes finally run on a schedule |
| `proxy.ts`: Bearer pass-through on the 3 cron paths | Vercel Cron's `Authorization: Bearer` reaches the routes' own secret check instead of dying at the Basic-auth guest gate |
| `perps/roll` + `registrar/lapse`: `export { POST as GET }` | Vercel Cron invokes with GET; both handlers read only headers, so GET is safe |
| Workflows `db-migrate.yml`, `neon-pr-branch.yml`, `neon-branch-cleanup.yml` + root `neon_workflow.yml` deleted | the Actions-based Neon plumbing (rotated-key 401s, orphaned branches, silent no-op migrations) is retired |
| CI Node 24 → 22 | CI tests the runtime Vercel actually uses (`engines: 22.x`) |
| `verify/.env.example` rewritten; stale root `.env.example` deleted | documents exactly the 16 vars the code reads — nothing dead |

---

## Part A — Dashboard steps (~8 minutes, in order)

These are OAuth consents and secret values — they cannot be done by an agent on your
behalf.

### A1 · Create the project

1. vercel.com → switch to team **MAD-Gambit** → **Add New… → Project**.
2. Import `MADdegen/MAD-MPP-2.23`.
3. Project Name: **`mad-gambit-2.23`** (if the dot is rejected, use `mad-gambit-2-23`).
4. **Root Directory: `verify`** ← the one setting that breaks everything if missed.
5. Framework Preset: Next.js (auto-detected). Leave build/install commands default —
   the migrate step comes from `package.json`, not a dashboard override.
6. Deploy. **The first build is expected to fail** (no `DATABASE_URL` yet — the migrate
   step hard-fails by design). Continue.

### A2 · Connect the existing Neon database (managed)

The existing DB lives on your Neon account, outside this team, so use the
connectable-account flow:

1. Project → **Storage** → Browse Marketplace → **Neon** → Install.
2. Sign in to the **existing** Neon account when prompted (don't create a new one).
3. Link the **existing Neon project** (the one holding the MAD Gambit data).
4. Connect to `mad-gambit-2.23` for **Production + Preview + Development**.
5. Enable **"Create a branch for each preview deployment"** — this replaces the deleted
   `neon-pr-branch.yml` workflow with zero maintenance.
6. Env prefix: leave default. `DATABASE_URL` is injected; the app also accepts the
   integration's project-prefixed names (`lib/database-url.ts`).

> If Storage shows the old DB as an existing Marketplace store instead, use
> **Connect Existing Store** — same result.

**Note:** the Neon DB is quota-suspended (free-tier ceiling hit 2026-08-10; data intact).
Connections fail until the monthly quota resets or the Neon plan is upgraded. Check
[console.neon.tech](https://console.neon.tech) → project → **Usage** for which quota
tripped and the reset date. That's why step A5 exists.

### A3 · Create the Blob store

1. Project → **Storage** → **Create Database → Blob**.
2. Connect to all environments. `BLOB_READ_WRITE_TOKEN` is injected automatically.
3. No code reads it yet — see **Blob follow-up** below for the one-command wiring.

### A4 · Set the environment variables

Project → Settings → Environment Variables. Mark secrets **Sensitive**. All environments
unless noted.

| Var | Value | Notes |
|---|---|---|
| `GOOGLE_API_KEY` | your Gemini key | code reads **this name**, not `GEMINI_API_KEY` |
| `SESSION_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | without it every wallet-authed route 401s |
| `CRON_SECRET` | random secret (same generator) | Vercel Cron sends it automatically |
| `PAUSE_GUARDIAN_TOKEN` | random secret | emergency-halt route |
| `SUBJECT_MAP_PEPPER` | random secret | identity-index writes throw without it |
| `GUEST_USER` / `GUEST_PASS` | optional | extra guest login beside the built-in pairs |
| `GDELT_QUERY` | optional | override the scandal query |
| `NEXT_PUBLIC_*_ADDRESS` (4) | optional | ⚠️ resolve the $MADx discrepancy first: `lib/contracts.ts` hardcodes `0x6972…151f`; the old env example said `0xb61a…fd18`. Leaving unset uses the contracts.ts fallback |

Do **not** set `NODE_ENV`, `PORT`, `NEXT_TELEMETRY_DISABLED`, or hand-set
`DATABASE_URL`/`BLOB_READ_WRITE_TOKEN` (integrations own those).

### A5 · Temporary: `SKIP_MIGRATIONS=1`

While the Neon DB is suspended, add `SKIP_MIGRATIONS=1` (all environments) so builds ship
without migrating — the build log will shout about it. **Delete the var** the moment Neon
shows the project resumed; the next deploy applies `verify/sql/0001`–`0014` and the
`_migrations` ledger fills in.

### A6 · GitHub secret cleanup (when convenient)

With the Actions plumbing retired, these are unused across `.github/` and can be deleted
from the repo's GitHub settings: secrets `DATABASE_URL`, `NEON_API_KEY`, variable
`NEON_PROJECT_ID`.

---

## Part B — Settings reference

| Setting | Value | Why |
|---|---|---|
| Team | MAD-Gambit (Pro) | Pro credit + Blob allowances live here |
| Root Directory | `verify` | the app |
| Node | 22 (from `engines`) | matches CI after this branch |
| Function region | match the Neon project's region (else `iad1`) | function ↔ DB latency |
| Deployment Protection | **OFF** | `proxy.ts` is the gate (guest Basic auth); its header comment documents that Vercel's own protection must be off for it to fire. *(This gets flipped via the Vercel MCP `update_project_deployment_protection` tool — not a manual step.)* |
| Ignored Build Step | leave default | `verify/vercel.json` `ignoreCommand` builds `main`, `feat/*`, `claude/*` only |
| Cron cadence | rollup hourly · perps/roll 00:00 UTC · lapse 00:30 UTC | **assumption** — adjust in `verify/vercel.json` if the market design wants different rhythms |

## Blob follow-up (one command, run locally)

The sandbox that produced this branch cannot reach the npm registry, and `npm ci` in CI
enforces lockfile sync — so the dependency was deliberately **not** added here. Locally:

```bash
cd verify && npm i @vercel/blob
```

then add `verify/lib/blob.ts`:

```ts
// Thin wrapper around @vercel/blob. Token: BLOB_READ_WRITE_TOKEN (injected by
// the Vercel Blob integration; local dev pulls it via `vercel env pull`).
import { put, del, list } from "@vercel/blob";

/** Bulk text (article/GDELT bodies) — offload from Postgres rows. */
export function putText(pathname: string, text: string) {
  return put(pathname, text, {
    access: "public",
    contentType: "text/plain; charset=utf-8",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

/** Binary assets (card art). */
export function putAsset(
  pathname: string,
  bytes: ArrayBuffer | Blob,
  contentType: string,
) {
  return put(pathname, bytes, {
    access: "public",
    contentType,
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export const deleteBlobs = (urls: string | string[]) => del(urls);
export const listBlobs = (prefix?: string) => list(prefix ? { prefix } : undefined);
```

Commit both (the lockfile updates with them). Migrating `card-art.ts` /
`portrait-vault.ts` / article ingest onto this helper is the follow-up that buys Postgres
storage headroom — the driver of the Neon quota suspension.

## Verification

1. **Build**: deployment → Build Logs. Expect the loud `SKIP_MIGRATIONS` warning while
   A5 is in place; after removing it, expect `↳ apply 0001_data_platform.sql` … through
   `0014_slot_auction.sql`, then `✅ migrations complete`.
2. **Gate**: `https://<deployment-url>/` prompts for Basic auth (Guest0001/Guest1979
   works); `/api/v1/health/db` is public by allowlist — `503` while Neon is suspended,
   `200 {"ok":true,…}` after it wakes.
3. **Crons**: Project → Settings → Cron Jobs shows all three. Manual smoke:
   ```bash
   curl -i -H "Authorization: Bearer $CRON_SECRET" https://<deployment-url>/api/v1/cron/rollup
   curl -i -X POST -H "Authorization: Bearer $CRON_SECRET" https://<deployment-url>/api/v1/perps/roll
   ```
   (503 "needs DATABASE_URL" while suspended is the route working correctly.)
4. **Ledger** (after DB wakes):
   ```bash
   psql "$DATABASE_URL" -c 'SELECT name, applied_at FROM _migrations ORDER BY name;'
   ```
   14 rows expected. If any migration collides with manually-created schema, the build
   fails loudly on that file — resolve, don't force.

## Cutover (do last, after verification passes with the DB awake)

1. Smoke the new `*.vercel.app` URL end to end (sign-in, market pages, concierge).
2. Move custom domains: old location → `mad-gambit-2.23` → Settings → Domains.
3. Confirm nothing else references the deleted `mpp2.23` project.

## Known items deliberately left open

- **Suspended-DB data**: intact; export/salvage becomes possible when the quota resets.
- **Cron cadences** are assumptions (see Part B).
- **$MADx address discrepancy** (A4) needs a human decision.
- **`ci.yml` build job** duplicates Vercel's build; `unit-tests.yml` installs
  `vitest@^3` `--no-save` against a `package.json` pinning `^4` — both flagged, not
  changed here.
