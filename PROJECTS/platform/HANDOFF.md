# MAD Gambit — Sprint Handoff

**State as of 2026-09-11 08:30 UTC.** Companion to `SPRINT.md`, which holds the full seven-phase
plan. This file is the *snapshot*: what is done, what changed, what is next. Update it in place.

Base branch: **`The-MDC`** (not `main`). Head: **`f87b593`**.

---

## Done — merged today

| Commit | What landed |
|---|---|
| `d6836f7` | **Canon consolidation, 122 files.** `CLAUDE.md` (repo had none), `ABOUT-ME/`, 20 skill domains, 13 commands, 7 hooks, `.mcp.json`, `PROJECTS/`+`TEMPLATES/`+`OUTPUTS/` scaffolding, `scripts/cowork-sweep.sh` |
| `c12f88e` | **`PROJECTS/platform/SPRINT.md`** — drive audit + legacy memory folded into one sequenced plan |
| `f87b593` | **Dependabot fix** — vendored Foundry libs silenced |

`MAD-MPP-2.23` is now the single source of truth. Nothing authoritative lives in
`MADHATs-Claude-Enhancement`, a Cowork folder, or a local disk.

### Canon corrections made with primary evidence

1. **Vercel** — was recorded as "Git integration didn't survive the org move; work around with
   `npx vercel --prod`." Actual commit status reads **`Account is blocked`**. Reconnecting Git
   cannot deploy while blocked; the CLI workaround fails identically.
2. **GitHub Actions** — was recorded as "queue-blocked, no PR can show a green check." False.
   Run `34450431901` queued 07:32:05 and completed 07:32:35 UTC. Repo runs are healthy.
3. **gh-aw lock files** — new entry. `agentic-quality-review.md` and `agentic-security-review.md`
   exist with **zero `.lock.yml` files**. Neither agentic workflow has ever run.
4. **Vercel scope settled** — canonical is project `mad-mpp-2-23`
   (`prj_aiAAMWo4XvseAHHMMzIrH1ET1KCK`) under team `MAD-MPP`
   (`team_ThJlmLcaIliE23YywpmA7uQf`), root dir `verify`. Legacy IDs
   `team_TgoOJAiilwZ3I3LPyD2FcNZm` / `prj_4IdDBNaVoeUWutoEGbCc2zyzYpc7` are retired — they are in
   neither the account nor the dashboard. Any other Vercel scope posting statuses on this repo is
   not MAD Gambit's; ignore it.

---

## Two live blockers, both outside this repo

### A. Vercel account is blocked

Every push produces the same four red statuses, in order:

1. `Account is blocked`
2. **Building**, with a preview URL — **false positive**, the link 404s
3. `Deployment has failed — npx vercel inspect dpl_… --logs`
4. `1 required project failed to deploy`

Vercel's own filter URL spells the states: `?status=error,blocked`.

**Do not read the Building badge as recovery.** Verified during that window: `get_deployment` on
the preview hostname → **404 not_found**; `list_projects` for the team → **`[]`**. Zero projects
under a paid team is the signature of suspension, since blocked accounts have projects hidden
from API listing.

The build error underneath is **real and currently undiagnosable** — its logs 404 until the block
lifts. Expect a second problem after unblocking, not a green deploy.

- Fix: https://vercel.com/mad-mpp → Settings → Billing ·
  https://vercel.com/knowledge/why-is-my-account-deployment-blocked
- Done when **all four** hold: `list_projects` returns `mad-mpp-2-23` · the `Vercel – mad-mpp-2-23`
  status is not `failure` · `get_deployment` on the preview host resolves · the data room serves
  without SSO.

### B. Dependabot jobs stuck queued

Run **34557792614** (`/verify`: fflate, nanoid, sharp) has been `queued` since 03:16:07 — a real
advisory against real app dependencies. Every other run on this repo finishes in seconds; only
`dependabot`-labelled jobs stall.

**Cause:** "Dependabot on self-hosted runners" is enabled, so jobs wait for a runner carrying the
`dependabot` label. None exists.

**Fix — set it to Disable:**
- Repo: Settings → *Security and quality* → **Advanced Security** → Dependabot →
  "Dependabot on self-hosted runners" → **Disable**
  (https://github.com/The-MDC/MAD-MPP-2.23/settings/security_analysis)
- If that row is absent, an org policy is hiding it — same row at
  https://github.com/organizations/The-MDC/settings/security_analysis, and check
  https://github.com/organizations/The-MDC/settings/actions → Policies for a repo exclusion.

**Disabling does not re-trigger a queued job.** After flipping it, go to
https://github.com/The-MDC/MAD-MPP-2.23/network/updates and click **Check for updates**.

Run **34557792525** (vendored OpenZeppelin, ~40 packages) was cancelled 03:38:33 and `f87b593`
stops its successors being generated at all.

---

## Next up — local work, ~20 minutes, no network needed

Full detail in `SPRINT.md` Phase 0 and Phase 1. Condensed:

1. **Rescue two irreplaceable files.** `Zena Shah - MAD Gambit Full Entity Docs.pdf` (1.8 MB) and
   `PlayFusion Labs NDA & NON-DCLSR MADGambit.pdf` (4.4 MB), both on the Desktop, both with zero
   copies anywhere. **The only irreversible item on this list.**
2. **Quarantine two credential files.** `MAD-GAMBIT-ENV VARs.txt` and
   `mad-mpp-2-23-env-inventory.csv`, both inside a folder that may later be pushed.
3. **Commit the one dirty file** in `Documents\MAD-MPP-2.23`. That single file blocks 691.8 MB
   from being reclaimed.
4. **Reclaim 845.7 MB** — 153.9 MB VSCode cache (115.2 MB of it `CachedExtensionVSIXs`) plus
   691.8 MB `verify\node_modules`.
5. **Pull the canon**: `git fetch origin The-MDC && git checkout The-MDC && git pull`. The local
   clone predates all three merges — it has no `CLAUDE.md`, no `ABOUT-ME/`, no `PROJECTS/`.

Then `bash scripts/cowork-sweep.sh --discover` to land the remaining 45 unprotected files.

---

## Open decisions — blocked on Nick, do not decide unilaterally

1. **Legal PDFs: into this repo, or private storage only?**
   Recommendation on record: **private only.** This repo is private but has collaborators, and
   git history is permanent. A signed NDA and entity formation docs do not belong in it.
   Blocks `SPRINT.md` step 0.5.
2. **Should `foundry.yml` build on merges to `The-MDC`?**
   It currently triggers on `push: branches: [main]`. `main` exists but is not the default branch,
   so contract changes only build via the `pull_request` trigger, never on merge. Intentional, or
   should it read `[The-MDC]`?

---

## Standing facts worth not re-deriving

- **Vendoring is deliberate.** `contracts/lib/{openzeppelin-contracts,forge-std}` — 1,069 files
  committed, no `.gitmodules`. `foundry.yml` documents it and depends on it: the job runs
  `actions/checkout@v7` with no submodule step and no `forge install`. **Un-vendoring turns the
  contracts build red.** Do not "clean it up."
- **Default branch is `The-MDC`.** Tooling that assumes `main` silently no-ops.
- **Squash merges leave the feature branch stale.** After a merge, `origin/<branch>..HEAD` reports
  a phantom unpushed commit. `git rev-list HEAD --not --remotes --count` is the check that is not
  fooled by that, nor by shallow clones.
- **69 branches on this repo.** Real sprawl, not yet triaged.

## Still unresolved from the original conflict log

Staking tiers (6 in code vs 4 in the data room) · the 1.888% ghost fee schedule deployed
somewhere with no creator share · Y3 stream split 51/31/12/6 derived from the retired $154.5M
model · **Wyoming ×7 plus "SEC Compliant" on the live investor deck** · the `.mcp.json` Supabase
entry for a database never adopted · where unspent creator share on platform-originated markets
falls.
