---
name: vercel-system-env-and-cli
description: Vercel's system environment variables and the CLI-first workflow — what VERCEL_ENV / VERCEL_URL / VERCEL_BRANCH_URL / VERCEL_TARGET_ENV / VERCEL_GIT_* actually contain, framework-prefixed (NEXT_PUBLIC_/VITE_/REACT_APP_) variants, and the full `vercel link → env pull → build → deploy --prebuilt` sequence including tokens, --non-interactive, VERCEL_ORG_ID/VERCEL_PROJECT_ID and custom environments. Use when reading deployment metadata at build or runtime, pulling env vars locally, deploying or promoting from the terminal, wiring Vercel CLI into CI, debugging "why is this env var empty", or when a preview URL must be constructed in code. Triggers on "VERCEL_URL", "VERCEL_ENV", "system environment variable", "vercel env pull", "vercel build", "--prebuilt", "VERCEL_TOKEN", "vercel link", "vercel deploy", "env var missing on Vercel".
---

# Vercel system environment variables + the CLI

Two related things: what Vercel injects into your deployment for free, and how to
drive that from the terminal instead of the dashboard.

**Scope.** Sibling skills own adjacent ground — `vercel-git-deploys` for
git-driven deploys and why a push didn't build, `vercel-for-github` for Actions
pipelines, `neon-vercel-integration` for how `DATABASE_URL` reaches a preview.
This skill owns **the variables themselves** and **the CLI**.

---

## System environment variables

Injected automatically once "Automatically expose System Environment Variables"
is on for the project. `VERCEL=1` is the marker that they are exposed at all.

| Variable | Example | Notes |
|---|---|---|
| `VERCEL` | `1` | Set when system vars are exposed. Build **and** runtime. |
| `CI` | `1` | Set during builds. |
| `VERCEL_ENV` | `production` | One of `production` \| `preview` \| `development`. Build **and** runtime. |
| `VERCEL_TARGET_ENV` | `production` | The system **or custom** environment name. Use this when custom environments exist — `VERCEL_ENV` collapses them. |
| `VERCEL_URL` | `my-site.vercel.app` | Generated deployment URL, **no protocol**. |
| `VERCEL_BRANCH_URL` | `my-site-git-improve-about-page.vercel.app` | The branch alias, no protocol. Build and runtime. |
| `VERCEL_REGION` | `iad1` | Execution region. |
| `VERCEL_OIDC_TOKEN` | `secret` | Only when OIDC Federation is enabled. Available at build time; pull locally with `vercel env pull`. |
| `VERCEL_GIT_COMMIT_REF` | `improve-about-page` | Branch name. |
| `VERCEL_GIT_COMMIT_SHA` | `fa1eade…` | Full SHA. |
| `VERCEL_GIT_COMMIT_MESSAGE` | `Update about page` | |
| `VERCEL_GIT_REPO_SLUG` / `_OWNER` / `_ID` | `my-site` / `acme` / `117716146` | |

### Two traps that cost real time

1. **`VERCEL_URL` breaks under Standard Deployment Protection.** The docs are
   explicit: it "cannot be used in conjunction with Standard Deployment
   Protection." Code that self-references via `VERCEL_URL` will hit the auth
   wall. Prefer `VERCEL_PROJECT_PRODUCTION_URL` for a stable public origin, or
   accept that the URL is gated.

2. **`--prebuilt` deploys have NO system environment variables.** Straight from
   the CLI docs on `vercel deploy --prebuilt`: *"system environment variables are
   unavailable during this process."* If a build reads `VERCEL_ENV` and you move
   to a prebuilt pipeline, it silently reads `undefined`. Bake what you need in
   at `vercel build` time instead.

### Framework-prefixed variants

To reach the **client** bundle, the variable needs the framework's public prefix.
Vercel emits prefixed copies:

```bash
NEXT_PUBLIC_VERCEL_TARGET_ENV=production     # Next.js
VITE_VERCEL_TARGET_ENV=production            # Vite / SolidStart
REACT_APP_VERCEL_TARGET_ENV=production       # Create React App
SANITY_STUDIO_VERCEL_GIT_COMMIT_REF=improve-about-page
```

SvelteKit is different — import from `$env/static/private`, and **never** expose
it to the frontend:

```javascript
import { VERCEL_COMMIT_REF } from '$env/static/private';
export function load() {
  return { deploymentGitBranch: VERCEL_COMMIT_REF };
}
```

Vite needs them mapped through `define` to become global constants:

```javascript
export default defineConfig(() => ({
  define: { __APP_ENV__: process.env.VITE_VERCEL_ENV },
}));
```

### Reading them inside a function

Rather than `process.env` directly:

```ts
import { getEnv } from '@vercel/functions';
export default { fetch(request) { const { VERCEL_REGION } = getEnv(); /* … */ } };
```

```python
from vercel.functions import get_env
print(get_env().VERCEL_REGION)
```

---

## The CLI workflow

The canonical sequence, from the deploy-from-CLI docs:

```bash
vercel link                                   # 1. link this dir to a project
vercel env pull .env.local                    # 2. pull env vars locally
vercel env run -- npm run dev                 # 3. develop with real env
vercel deploy                                 # 4. preview deploy
vercel curl / --deployment <preview-url>      # 5. verify
vercel logs --deployment <id> --level error
vercel deploy --prod                          # 6. production
vercel domains add example.com                # 7. custom domain
vercel domains inspect example.com
vercel curl / --deployment <production-url>   # 8. confirm live
vercel logs --environment production --level error --since 5m
```

### Environment variables

```bash
vercel env pull                                  # → .env.local
vercel env pull --yes                            # overwrite, no prompt
vercel env pull --environment=preview --git-branch=feature-branch
vercel pull --environment=production             # project settings + env

vercel env ls [environment]
vercel env add API_TOKEN --sensitive             # write-only value
vercel env add API_TOKEN production --force      # overwrite, no prompt
vercel env update [name] [environment] [gitbranch]
vercel env rm [name] --yes

vercel env run -- <command>                      # inject without writing to disk
vercel env run -e production -- next build
```

`vercel env run` is the safer default in CI — nothing lands on disk to leak into
an artifact or a layer.

### Build and prebuilt deploys

```bash
vercel build                    # uses Preview env vars
vercel build --prod             # uses Production env vars
vercel deploy --prebuilt        # deploy .vercel/output
vercel deploy --prebuilt --archive=tgz
```

Splitting build from deploy is the point: run tests, scan, or gate between the
two. Remember the no-system-env caveat above.

### Auth and non-interactive CI

```bash
vercel --token vcp_…                     # or: export VERCEL_TOKEN=vcp_…
vercel deploy --non-interactive          # never prompt

# Skip `vercel link` entirely in CI:
VERCEL_ORG_ID=team_123 VERCEL_PROJECT_ID=prj_456 vercel

# Project-scoped OIDC token, for scripts:
vercel project token my-project --format=json
```

`vercel link` writes `.vercel/project.json`, which holds `orgId` and `projectId`
— that file is where to look up the two IDs above.

### Custom environments

```bash
vercel deploy --target=staging
vercel pull   --environment=staging
vercel env add MY_KEY staging
vercel env ls staging
```

With custom environments in play, read `VERCEL_TARGET_ENV`, not `VERCEL_ENV`.

### Inspecting deployments

```bash
vercel list                                  # linked project
vercel list [project-name] --status READY,BUILDING
```

---

## Gotchas

- **A token is required to read env vars.** There is no way to `env pull` without
  authenticating. If an agent or sandbox lacks `VERCEL_TOKEN` and cannot run
  `vercel login`, it **cannot** retrieve secrets — the Vercel MCP server exposes
  project, deployment and protection tools but **no env-var read tool**. Get the
  value from a human or the dashboard.
- **`vercel pull` ≠ `vercel env pull`.** `vercel pull` fetches project settings
  *and* env vars; `vercel env pull` writes only the env file.
- Changing certain project settings (`NODEJS_HELPERS`, `NPM_TOKEN`) requires a
  fresh `vercel env pull` before local behavior matches deployed behavior.
- `--sensitive` values are write-only. You can set them and never read them back
  — plan rotation accordingly, and don't expect to recover one from the CLI.
