# Session Handoff — CI Gates, Workflow Diet & Security Scope

**Date:** 2026-07-26
**Branch:** `claude/mad-gambit-vercel-audit-ocof1b`
**PR:** [#33](https://github.com/MADdegen/MAD-MPP-2.23/pull/33) — open, **draft**, base `main`
**Remote tip:** `02b3e4d` (all work below is pushed)
**App location:** `verify/` (Next.js) · **Contracts:** `contracts/`

> Scope note: this handoff deliberately omits one credential-hygiene sub-thread
> and any secret values entirely. See §7 for the only thing that carries forward
> from it (a standing practice, no specifics).

---

## 1. TL;DR — where things stand

- **Item F (broader clickability)** shipped on `/preview`; the flagship worksheet
  **A–G + Heat wire + F** is complete on this branch.
- **CI gates expanded** (Tier 1 + 2): Build, Lint, Secret Scan, Slither,
  Dependency Review added on top of the existing Type-check / Unit tests /
  Placeholder Guard / Foundry / Neon.
- **A "workflow diet"** (path filters + concurrency) was added to cut Actions
  minutes after we found **551 total workflow runs** and hit the account's
  **Actions spending limit**.
- **Security scope was reconstructed** into a source-of-truth doc set
  (`SECURITY.md` + `docs/SECURITY_LAYERS.md`).
- **Blocked on two account-side actions** (see §6): raise the Actions spending
  limit, and the Vercel dashboard items. Neither is a code problem.

---

## 2. Commits on this branch (newest → oldest)

| Hash | Summary |
| ---- | ------- |
| `02b3e4d` | docs(security): consolidate multi-layer security scope into source of truth |
| `43c0197` | ci: workflow diet — path filters + concurrency to cut Actions minutes |
| `b0bb0fd` | ci: fix lint script for Next 16, stage new gates report-only |
| `e89c5c0` | ci: add build/lint/secret/slither/dependency gates (Tier 1 + 2) |
| `a40a626` | feat(preview): item F — broader clickability with dopamine feedback |
| `b452add` | feat(preview): single double-tap-cycling ticker (B) + brand lockup top-left (C) |
| `4f87f31` | fix(heat-score): avoid Set iteration for the es5 tsc target (TS2802) |
| `2360aa3` | feat(preview): Heat-ranked carousel + globally clickable ticker explainers |
| `37f370e` | feat(preview): 10-category left rail filters the hub News Flow in place |
| `328f563` | feat(satire): extend engine to 10 hub categories + 15% South Park lean |
| `7f964a1` | fix(preview): stop login/nav routing to /mpp2.23; apply worksheet items A/E/G |

---

## 3. Product work — `/preview` hub worksheet (A–G + Heat + F)

Delivered against the premiere-theme `/preview` hub. All additive/wiring; the
Vercel layout is preserved (no new pages).

- **A** — Login/nav no longer leaves the premiere theme (the reported bug).
- **B** — One perpetual ticker; double-tap cycles Crypto → Gambit → Scandal.
- **C** — MAD Gambit hero moved top-left with the official top-hat `BrandMark`.
- **D** — 10-category satirical News Flow (`satire-headline.ts`), deterministic
  ~15% South-Park edge; left rail filters the hub wire in place via a
  `mg:category` event.
- **E** — Removed the redundant centre "MARKETS · NYSE" ticker.
- **G** — Bottom nav is 5 real buttons (Home · All Markets · Wallet · Market++ · Profile).
- **Heat Score** (`heat-score.ts`, pure + tested) — composite 0–100 per headline;
  measured signals (cross-publisher pickup, freshness, authority, spread, satire)
  vs an **estimated** engagement proxy, each labeled in the popover.
- **F** — `/preview` now wires the real `AuthModal` (Tier-1 social + wallet),
  mounts `JoyLayer`, makes bottom-nav do real things, adds universal `.mg-tap`
  press feedback, and a full-screen celebration on auth — all disabled under
  `prefers-reduced-motion`.

**Verification caveat that persists:** `npm` is network-blocked in this
sandbox, so `next build` / `tsc` / vitest could not be run locally — they run in
CI only. Type-check + Unit tests are the gate.

---

## 4. CI/CD — workflows & gate status

### Workflows (`.github/workflows/`) after the diet
| Workflow | Triggers (post-diet) | Notes |
| -------- | -------------------- | ----- |
| `ci.yml` | PR + push `main`, **paths `verify/**`** | Type-check, **Lint**, **Build** |
| `unit-tests.yml` | PR + push `main`, **paths `verify/**`** | vitest |
| `placeholder-guard.yml` | PR + push | prose-placeholder tripwire; +concurrency |
| `foundry.yml` | PR + push **`main` only**, contract paths | forge build+test, **Slither**; +concurrency |
| `secret-scan.yml` | PR | **TruffleHog** on the diff |
| `dependency-review.yml` | PR, **paths `package*.json`** | +concurrency |
| `neon-pr-branch.yml` | PR | ephemeral DB branch |
| `vercel-deploy.yml` | push `main` | runs the real `next build` |
| `db-migrate.yml` | push `main`, `verify/sql/**` | prod Neon migrations |

### Gate enforcement status
| Gate | Status | To make enforcing |
| ---- | ------ | ----------------- |
| Type-check, Unit tests, Build, Secret Scan, Placeholder Guard, Foundry | ✅ enforcing | — |
| **Lint (eslint)** | 🟡 report-only | Realign `eslint-config-next` (pinned `15.4.5`) to Next 16 + regen lockfile + verify clean, then drop `continue-on-error` in `ci.yml` |
| **Slither** | 🟡 report-only | Triage the **135** `src/` findings, then drop `continue-on-error` in `foundry.yml` |
| **Dependency Review** | 🟡 report-only | Enable Dependency Graph + GHAS in repo settings, then drop `continue-on-error` |

### Key CI facts / gotchas
- **Next 16 removed the `next lint` subcommand.** The `lint` npm script was
  repointed to invoke `eslint` directly (`b0bb0fd`). `eslint-config-next` is
  still `15.4.5` against Next `16` — realign before making Lint blocking.
- **CodeQL intentionally NOT added** — `dependabot.yml` documents it as a
  deliberate prior removal. Dependabot already covers npm + github-actions.
- **The first real `next build` on a PR** is now gated by `ci.yml`'s Build job
  (previously it only ran on push-to-`main` via `vercel-deploy.yml`).

---

## 5. The Actions-minutes problem (root cause of the red CI)

- The Actions tab showed **551 total runs**. Investigation confirmed **no runaway
  loop** — no `schedule`/`workflow_run`/`repository_dispatch`; recent cadence was
  normal PR iteration. The volume is cumulative, amplified by fan-out (one push
  historically triggered ~15 jobs across 7 workflows).
- That fan-out exhausted the **GitHub Actions spending limit**. The signature:
  **every job "fails" in ~2 seconds with no downloadable logs** — the runners are
  refused before executing. **These are not real failures.**
- **Fix (account-side, not code):** raise the Actions spending limit
  (Settings → Billing & plans → Actions), then **re-run** the latest run
  (Actions → run → "Re-run all jobs"). The workflow diet (`43c0197`) roughly
  halves future burn.

---

## 6. Open action items (owner-tagged)

**Account/dashboard (owner: Nick) — these block production, not code:**
1. **Raise the Actions spending limit** → re-run CI so PR #33 goes green.
2. **Vercel:** flip the **Ignored Build Step** (currently every deploy shows
   "Ignored", `rootDirectory: verify`); set **production env vars** (server:
   `DATABASE_URL`, `SESSION_SECRET`, `CRON_SECRET`, `GOOGLE_API_KEY`,
   `GUEST_USER`, `GUEST_PASS`, `GDELT_QUERY`; build-time `NEXT_PUBLIC_*`
   contract addresses); confirm **Production Branch = `main`**.
3. **Enable Dependency Graph + GHAS** → flips Dependency Review to enforcing.
4. **Enable branch protection** on `main` with required checks (Type-check,
   Unit tests, Build, Placeholder Guard, Secret Scan) — the multiplier that
   makes every gate actually block.
5. **Undraft PR #33** when ready to merge.

**Code (owner: next session / Claude):**
6. Run `npm run lint` locally (npm works on the dev machine), fix any errors,
   commit the regenerated `package-lock.json`, then flip Lint to enforcing.
7. Triage the 135 Slither `src/` findings → flip Slither to enforcing.
8. **Build AA session keys (ERC-4337) fresh** — a net-new feature per SystemState
   v2 (Alchemy AA-SDK). NOT a git-history restore (see §8).
9. Add a `Content-Security-Policy` header (Layer 1 gap in `SECURITY_LAYERS.md`).

---

## 7. Security-scope reconstruction

Reconstructed the platform's defense-in-depth from three sources (current tree,
git history, the governance repo `MADHATs-Claude-Enhancement/.claude`, and the
Drive doc set). Result committed as:
- **`SECURITY.md`** — real policy (replaces the stock GitHub placeholder).
- **`docs/SECURITY_LAYERS.md`** — the canonical layer-by-layer map.

**8 present layers:** edge/headers (`middleware.ts` + `vercel.json` headers),
SIWE wallet auth (`api/v1/auth/*`, `lib/siwe-verify.ts`), session/secrets
(`lib/session.ts`), rate limiting (`lib/rate-limit.ts`), Shield domain guards,
contract security (Foundry + Slither), CI supply-chain/SAST, and governance
(the `security-review` skill + `common-security.md` in the enhancement repo).

**Key finding — the "lost" security was mostly an illusion.** A full-history scan
showed the deleted files were **placeholder stubs** (max ~20–90 bytes ever:
`verify/lib/auth/siwe.ts`, `session-keys/route.ts`, `SessionKeyManager.tsx`, root
`middleware.ts`) or **deliberately migrated** code
(`ai-backend/app/routes/auth.py` → the current, stronger Next routes). **None
should be restored** — doing so would regress the repo. AA session keys are a
**fresh build**, not a recovery. Full detail + verdict table in
`docs/SECURITY_LAYERS.md`.

**Standing secrets-management practice (carry forward):** credentials live in a
password manager as system-of-record (Proton Pass) + the platform's own
encrypted secret stores (Vercel env / GitHub Actions secrets) for runtime
values. **Never** store secrets in the repo, in docs, or in plaintext anywhere;
rotate any credential that is ever exposed. Enforced in CI by the Secret Scan
gate.

---

## 8. Environment & resume notes

- **Sandbox `npm` is network-blocked** — cannot `next build`, `tsc`, vitest, or
  regenerate `package-lock.json` here. Those run in CI, or on the dev machine.
- **Dev machine:** Windows / PowerShell. Repo cloned at
  `C:\Users\Aaron\MAD-MPP-2.23` and `C:\Users\Aaron\Documents\MAD-MPP-2.23`
  (two clones — pick one, delete the other). Run project commands **inside** the
  repo, never from `C:\Windows\System32`.
- **To resume:**
  ```
  git fetch origin
  git checkout claude/mad-gambit-vercel-audit-ocof1b
  git pull origin claude/mad-gambit-vercel-audit-ocof1b
  ```
- **Canonical numbers (do not change without approval):** platform fee **1.88%**,
  community profit share **28.8%** (shown as ~28%), creator revenue share **40%**,
  seed **$1–2M** at **$12M** pre-money. Live deck:
  https://maddegen.github.io/MADHATs-Gambit-Presentation/
- **Stack facts:** Next 16, `output: "standalone"`, root directory `verify`,
  Node 22/24 in CI, eslint 8 + `eslint-config-next@15.4.5` (mismatch to fix).

---

## 9. Definition of done for this branch

PR #33 merges to production once: Actions quota restored → CI green;
Vercel Ignored Build Step flipped + prod env vars set + prod branch confirmed;
PR undrafted + approved. Everything else (enforcing the 3 report-only gates,
AA session keys, CSP) is follow-up, tracked in §6.
