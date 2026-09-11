# MAD Gambit — Consolidation Sprint

**Created** 2026-09-11 · **Run in order.** Each step has an acceptance check. Do not start a
phase until the previous phase's checks pass.

Synthesized from: the drive audit (`mad-gambit-content.csv`, `reclaimable.csv`, 2026-09-10),
`Find-MadGambit.ps1`, the legacy memory export, and PR #148 (merged `d6836f7`).

**Local machine paths in this document are `C:\Users\Aaron\...`.** Confirm that is the right
profile before running anything destructive — the legacy memory names Aaron as a separate
collaborator from 2026-05.

---

## Phase 0 — Preserve. Nothing else runs until this is done.

The audit found **50 MAD Gambit items, every one flagged AT RISK.** 45 sit in no git repo at
all. If this drive fails, they are gone. Three of them are irreplaceable.

- [ ] **0.1 — Rescue the legal documents first.** Zero copies exist anywhere else.
  - `C:\Users\Aaron\Desktop\Zena Shah - MAD Gambit Full Entity Docs.pdf` (1.8 MB)
  - `C:\Users\Aaron\Desktop\PlayFusion Labs NDA & NON-DCLSR MADGambit.pdf` (4.4 MB)
  - Copy both to a **private** store — not this repo, not a public one. These are entity
    formation and a signed NDA.
  - ✅ **Check:** both files open from the new location and the originals are untouched.

- [ ] **0.2 — Quarantine the credential files. Never commit these.**
  - `C:\Users\Aaron\Desktop\MADGambit-Presentation-Engine-MADdegen\MAD-GAMBIT-ENV VARs.txt`
  - `C:\Users\Aaron\Desktop\MADGambit-Presentation-Engine-MADdegen\mad-mpp-2-23-env-inventory.csv`
  - Move both into a password manager or `.env` outside any repo, then delete the plaintext.
  - ✅ **Check:** `git check-ignore` is irrelevant — these files must not exist inside any
    working tree. Confirm with a filesystem search that no copy remains under a `.git` parent.

- [ ] **0.3 — Commit the one dirty file in the local clone.**
  - `C:\Users\Aaron\Documents\MAD-MPP-2.23` is **740.4 MB with 1 uncommitted file.** That single
    file is why 691.8 MB of `node_modules` is currently un-reclaimable.
  - ```powershell
    cd C:\Users\Aaron\Documents\MAD-MPP-2.23
    git status                      # identify the file before deciding
    git log --oneline --not --remotes   # confirm 0 unpushed commits
    ```
  - Commit it or discard it deliberately. Do not `git clean` blind.
  - ✅ **Check:** `git status --porcelain` returns empty.

- [ ] **0.4 — Sync the local clone to the merged canon.**
  - The local clone predates PR #148. It has no `CLAUDE.md`, no `ABOUT-ME/`, no `PROJECTS/`.
  - ```powershell
    git fetch origin The-MDC
    git checkout The-MDC
    git pull origin The-MDC
    ```
  - ✅ **Check:** `CLAUDE.md`, `ABOUT-ME/`, `PROJECTS/`, `scripts/cowork-sweep.sh` all exist locally.

- [ ] **0.5 — Land the loose MAD Gambit content into the repo.**
  - Brand assets → `PROJECTS/marketing/brand/`
    - `Desktop\MAD Gambit Logo1A.jpg`, `MAD Gambit Logo2 1x1.jpg`, `MAD Gambit Logo2 1x1.png`
    - `Desktop\LandingPage and Dashbord Layout MADHATs.png` (4.5 MB)
    - The 8 logo/symbol files under `MADGambit-Presentation-Engine-MADdegen\uploads\`
  - Decks and one-pagers → `PROJECTS/investors/`
    - `Downloads\MAD-Gambit-Conviction-Deck.html`, `MAD-Gambit-IP-Onepager.html`
  - Architecture and card-game docs → `PROJECTS/platform/legacy/`
    - Everything under `Documents\Claude\Projects\The MDC\` — ADR-001 Browser MCP, the
      Dutch-auction ERC-1155 architecture note, `MADHATs_Gambit_Card_Game_Logic_Code_Reference.docx`,
      `mad-gambit-ui.html`, the 2026-04-03 handoff
  - Maths room → `PROJECTS/tokenomics/`
    - `Documents\MAD-Gambit-Maths Engine-Room.mhtml` and the `.html` twin in the Presentation Engine
  - ⚠️ Run `git status` and read every line before `git add`. Old exports carry pasted secrets.
  - ✅ **Check:** committed and pushed; `mad-gambit-content.csv` re-run shows these as
    `backed by remote`, not `AT RISK`.

- [ ] **0.6 — Deduplicate before committing, not after.**
  - Three near-identical handoffs in `Downloads\`: `MAD-Gambit-Handoff-2026-09-06.md`,
    `MAD-Gambit-Handoff-2026-09-06_1.md`, `MADGambitHandoff20260906_3.md`. Diff them, keep one.
  - Two conviction decks: `MAD-Gambit-Conviction-Deck.html` and `_1.html`. Diff, keep newer.
  - Two IP one-pagers: `Downloads\MAD-Gambit-IP-Onepager.html` and the Presentation-Engine copy.
  - `Desktop\MAD-GAMBIT-SPRINT-v1.2.md` — read it. Fold anything still live into this file,
    then delete it. Two sprint docs is how the Wyoming error survived three weeks.
  - ✅ **Check:** one canonical copy of each, in the repo.

- [ ] **0.7 — Resolve the detached Presentation Engine.**
  - `Desktop\MADGambit-Presentation-Engine-MADdegen` is 22.9 MB **in no git repo**, but
    `MADdegen/MADGambit-Presentation-Engine` exists on GitHub (last push 2026-08-20).
  - Diff the local folder against the remote. Push what is newer; delete the local copy only
    once the remote provably contains it.
  - Note the nested `MADGambit-Presentation-Engine-MADdegen\MADGambit-Presentation-Engine-MADdegen\`
    — a folder inside itself, a sign of a bad copy operation.
  - ✅ **Check:** remote contains everything; local folder removed or converted to a real clone.

---

## Phase 1 — Reclaim disk

Only after Phase 0.3 passes. The audit measured **845.7 MB** total.

- [ ] **1.1 — VSCode caches: 153.9 MB, safe now, no preconditions.**
  - Close VSCode first, or locked files fail.
  - ```powershell
    'Cache','CachedData','Code Cache','GPUCache','logs','CachedExtensionVSIXs' | %{ ri "$env:APPDATA\Code\$_" -Recurse -Force -ea 0 }
    ```
  - Largest single item is `CachedExtensionVSIXs` at 115.2 MB — installer archives for
    extensions already installed.
  - ✅ **Check:** re-run the audit; those rows are gone.

- [ ] **1.2 — `verify\node_modules`: 691.8 MB, unblocked by 0.3.**
  - ```powershell
    ri "C:\Users\Aaron\Documents\MAD-MPP-2.23\verify\node_modules" -Recurse -Force
    ```
  - Regenerate when you next build: `cd verify && npm install`.
  - ✅ **Check:** `npm install` succeeds and `npm run build` is green before you move on.

- [ ] **1.3 — Re-run the audit as the closing gate.**
  - ```powershell
    .\Find-MadGambit.ps1
    ```
  - ✅ **Check:** the report prints *"No unprotected MAD Gambit content found"* — not
    *"STOP. Do not clean yet."* That flip is the phase's definition of done.

---

## Phase 2 — Reconcile canon

`CLAUDE.md` on `The-MDC` carries four unresolved conflicts, and the legacy memory export
contradicts it in three more places. Each one is a number or claim that could reach an investor.

- [ ] **2.1 — Staking tiers: 6 vs 4.** Code has 6 tiers (100/500/2,500/10,000/50,000/100,000 at
  12/18/28/42/58/68%). The data room has 4 (88/888/8,888/88,888 at 8.8/18.8/28.8/38.8%). Pick one,
  update both, record the decision. **Do not pitch staking yields until this closes.**

- [ ] **2.2 — Find the second fee model.** A "1.888% RATE" schedule is deployed somewhere,
  splitting burn 0.888% / staking 0.500% / protect 0.500%, with **no creator share**. Canon is
  **1.88%** split creator 40% / community 28.8% / Shield 28.8%. Locate the source and reconcile.
  - Search: `grep -rn "1.888\|0.888\|1888" --include=*.ts --include=*.sol --include=*.html`

- [ ] **2.3 — Y3 stream split 51/31/12/6** derives from the retired $154.5M model. Headline is
  **$139.6M gross base case** ($177.7M is bull only). Re-run the split against $139.6M before use.

- [ ] **2.4 — The live deck still says Wyoming.** `o-vdeck26.vercel.app` has 7 occurrences of
  Wyoming plus "SEC Compliant" / "SEC-exempt token issuance". Canon is **New Mexico LLC (filed)**,
  and the SEC claims breach the no-claim-without-evidence rule. `verify/public/pitch/ov-pitch-deck.html`
  in this repo is already corrected — **the deployed bundle builds from a different source. Find it.**
  - Blocked by Phase 3.1 (Vercel account) for redeploy, but the source hunt can start now.

- [ ] **2.5 — Chain architecture: memory is stale.** The legacy export says "built on Arbitrum One"
  and lists "Arbitrum vs Base" as an open decision. Canon resolved it: **Arbitrum Nova (42170)
  primary gameplay · Arbitrum One (42161) liquidity, Shield vaults, $MADx · Ethereum L1 governance
  anchor · Base L2 Phase 3 · HyperEVM AI-agent settlement.** Update any doc still carrying the
  two-way question.

- [ ] **2.6 — Remove the Supabase reference.** `.mcp.json` in this repo lists a `supabase` MCP
  server. The legacy memory is explicit: **Supabase was never adopted.** Canon backend is
  **Neon + Drizzle + Vercel**. Delete the entry.
  - Also check: `CLAUDE.md` skills reference `backend-patterns` which is Supabase-oriented.

- [ ] **2.7 — Three Vercel scopes touch this repo. Two are unaccounted for.**
  Queried live against the Vercel API on 2026-09-11, plus the commit statuses on PR #149:

  | Scope | Evidence | Status |
  |---|---|---|
  | Team `MAD-MPP` (`team_ThJlmLcaIliE23YywpmA7uQf`, plan **pro**) | only team the connected token can see | **lists ZERO projects** via API |
  | Project `mad-mpp-2-23` (`prj_aiAAMWo4XvseAHHMMzIrH1ET1KCK`, root dir `verify`) | Vercel bot on PR #148 | commit status: **`Account is blocked`** |
  | Team slug **`too-expensive`** | posts `Vercel Deployments – Too Expensive` statuses on this repo | **invisible to this account** — not in `list_teams` |
  | Team `team_TgoOJAiilwZ3I3LPyD2FcNZm` / project `prj_4IdDBNaVoeUWutoEGbCc2zyzYpc7` | legacy memory | **not in this account at all** |

  Two things to resolve, in this order:
  1. **A Vercel team you cannot see is deploying this repo.** `too-expensive` posts deployment
     statuses on every push but does not appear in `list_teams` for the connected token. Find out
     whose account owns it and whether it is deploying MAD Gambit code. Until that is answered,
     assume an unaudited deployment surface exists.
  2. **Zero projects under a pro team is not normal.** It is consistent with the account block in
     3.1 — blocked accounts have projects suspended from API listing — but confirm rather than
     assume. Resolve 3.1 first, re-query, and see whether `mad-mpp-2-23` reappears.

  Record the surviving scope in `CLAUDE.md` and retire the rest.

- [ ] **2.8 — Open product decision, still open.** Where does **unspent creator share on
  platform-originated markets** fall — treasury or community? Creator share is 40% of the 1.88%
  and applies to creator-made markets only. Decide and record.

---

## Phase 3 — Unblock infrastructure

- [ ] **3.1 — The Vercel account is blocked.** The commit status on PR #148 reads literally
  `Account is blocked` → https://vercel.com/knowledge/why-is-my-account-deployment-blocked.
  This supersedes the older diagnosis that a broken Git integration was the cause — reconnecting
  Git cannot deploy while the account is blocked, and `npx vercel --prod` fails identically.
  Resolve billing / payment method / support ticket, then re-test the data room.
  - Corroborating evidence (2026-09-11): team `MAD-MPP` is on the **pro** plan yet the API returns
    **zero projects** for it — the signature of a suspended account, not a missing integration.
  - ⚠️ **Do not trust the Vercel PR comment.** On every push it renders
    `Building` with a working-looking preview URL, then flips to `Canceled from the Vercel
    Dashboard`, then to `Account is blocked`. Observed three times: PR #148, and PR #149 on both
    `98b86b5` and `9aae8dd`. During the `Building` window the preview link is already dead —
    `get_deployment` on that hostname returns **404 not_found**. A green-looking badge here means
    nothing while the account is blocked.
  - ✅ **Check — all four, not any one:**
    1. `list_projects` for `team_ThJlmLcaIliE23YywpmA7uQf` returns `mad-mpp-2-23` (today: `[]`)
    2. the `Vercel – mad-mpp-2-23` commit status is **not** `failure`
    3. `get_deployment` on the preview hostname resolves instead of 404
    4. `https://mad-mpp-2-23-madgambit.vercel.app/pitch/index.html` serves without SSO

- [ ] **3.2 — Compile the gh-aw lock files.** The repo carries
  `.github/workflows/agentic-quality-review.md` and `agentic-security-review.md` with
  **zero `.lock.yml` files** — verified again today. Neither agentic workflow has ever run.
  ```bash
  gh extension install github/gh-aw
  gh aw compile
  git add .github/workflows/*.lock.yml
  git commit -m "ci: commit compiled gh-aw lock files"
  git push
  ```
  Must run somewhere with network access to GitHub releases — a Claude Code web session cannot
  (egress blocks `api.github.com`, `github.com`, `raw.githubusercontent.com`, `proxy.golang.org`,
  and the Azure Blob host serving Actions artifacts).
  - ✅ **Check:** `compile-check` passes on a PR that touches `.github/workflows/`.

- [ ] **3.3 — Turn off Vercel Deployment Protection** on the data room, or every investor link
  lands on an SSO login page. Depends on 3.1.

---

## Phase 4 — Collapse the repo sprawl

- [ ] **4.1 — Deprecate `The-MDC/MADHATs-Claude-Enhancement`.** Its entire scaffold now lives in
  this repo (PR #148). Add a `README.md` banner pointing here and archive it, so nobody edits the
  wrong `CLAUDE.md`.

- [ ] **4.2 — Reconcile `The-MDC/madgambit-mpp`** (last push 2026-09-05). Never audited. Diff it
  against this repo; fold in anything unique, then archive.

- [ ] **4.3 — Fix the repo path in memory.** Legacy memory says `MADdegen/MAD-MPP-2.23`. It is
  now **`The-MDC/MAD-MPP-2.23`**, default branch **`The-MDC`**, not `main`.

---

## Phase 5 — Security

- [ ] **5.1 — Rotate five exposed credentials.** All five appeared in plaintext in persistent
  preferences and the legacy memory flags the same issue. Rotate every one, then move to a
  secrets manager:
  - GitHub classic token · GitHub fine-grained PAT · Vercel token · Upstash Redis bearer ·
    Neon `neondb_owner` password
  - ✅ **Check:** old values fail auth; nothing in any repo or preferences file carries a live secret.

- [ ] **5.2 — Wire SIWE signature verification.** Installed but not connected — the legacy memory
  calls this a hard pre-condition before real money touches the system. Use viem's `verifyMessage`
  **Action** (ERC-6492), not the utility, or ERC-4337 gasless users are rejected on first sign-in
  because their smart account is still counterfactual.

- [ ] **5.3 — Add `MIN_FILL = 54`.** Fills of 53 units or fewer floor to zero fee, so order
  splitting evades the fee entirely.

- [ ] **5.4 — Switch fee split to largest-remainder allocation.** Naive per-bucket floor division
  leaks dust on ~19,786 of 20,000 settlement volumes. Largest-remainder eliminates it — verified
  across 7,005 differential vectors with zero mismatches.

---

## Phase 6 — Product and tech debt

- [ ] **6.1 — Pack pity disclosure gap.** The 30-open ceiling raises the golden-card rate from
  2,000 PPM nominal to **34,297 PPM effective — 17.15×**. Get the disclosure language right under
  loot-box frameworks before launch. Legal review, not an engineering task.

- [ ] **6.2 — `MADStaking.sol` does not exist.** TypeScript only. Blocks 2.1 from being testable.

- [ ] **6.3 — Zero Foundry coverage on `MADCard1155.sol` and `MADCard721.sol`.**

- [ ] **6.4 — 24 of 31 components bypass design tokens** and hardcode hex. Single source of truth
  is `lib/gambit-design-tokens.ts` (GOLD_CHISEL_STOPS + INK). Gold is `#ffd700` — never stock
  Tailwind neon. Benchmark component is `components/gambit-instrument-cluster.tsx`.

- [ ] **6.5 — Write the governance architecture document.** Futarchy for proposal surfacing,
  quadratic voting for ratification at an 80% threshold. Use the six-perspectives-with-opposing-views
  method. The legacy memory records this as blocking the presentation.

- [ ] **6.6 — Answer Boardy's email.** Flagged in the legacy memory as the highest-priority text
  task; it scopes a presentation in which Claude is described as heavily instrumental.

---

## Standing rules for every step

- **Canon lives in `CLAUDE.md` in this repo.** Nothing else is authoritative. If a local file
  disagrees, this repo wins.
- **Platform name is MAD Gambit.** `MADHAT's Gambit` is the card-game line inside it — never the
  platform. Entity is **MAD Gambit LLC, New Mexico, filed**.
- **Never claim without evidence:** "15,000 users" (it is a waitlist) · measured retention ·
  "industry's first" · "regulatory-safe" · "no counterparty risk" · "100% DeFi secured" ·
  MAD Shield as *insurance*.
- **Read `git status` before every `git add`.** Half this sprint exists because content lived in
  one place with no history; the other half exists because secrets lived in files meant to be shared.
