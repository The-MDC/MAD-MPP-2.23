# MAD Gambit — Claude Code Master Context

> **This repo is the single source of truth.** Platform code, canonical numbers, agent
> context, skills, commands and hooks all live here. Nothing authoritative lives in a
> Cowork folder, a local disk, or `The-MDC/MADHATs-Claude-Enhancement` any more —
> those are downstream copies. If a number or rule disagrees with this repo, this repo wins.

## Project Identity
**MAD Gambit** (formerly MAD Upshot) — entertainment prediction/conviction market platform.
**MADHAT's Gambit** is the NFT card-game product line *inside* MAD Gambit — it is a product
name, never the platform name.
- Founder/CEO: Nick (MADdegen) | 3x founder, 14+ yrs startup experience, 1 exit
- Stage: Seed — $1.24M–$2.48M at $12M pre-money. Two nearer-term tranches run separately:
  infrastructure $15K–$20K and a milestone-based bridge $300K–$500K.
- GitHub Org: The-MDC (github.com/The-MDC) | 100+ repos

## Canonical Numbers — Never Change Without Explicit Approval
> Reconciled 2026-08-19 against the published data room per Boardy's consolidated brief.
> Full reconciliation, deltas and open conflicts:
> `docs/boardy/CANONICAL_NUMBERS_2026-08-19.md` (in this repo)

- Platform fee: **1.88%** globally — **never 1.888%**
- Fee split *of the 1.88%*: creator **40%** · community **28.8%** · MAD Shield recovery **28.8%**
- Creator share applies to **creator-made markets only** — not the general community share
- MAD Shield: opt-in **2–4%** premium · **28.8%** standard recovery → 40% shielded → 60% VIP (gated)
- $MADx total supply: **888,888,888** · seed token allocation **10%**
- Seed: **$1.24M–$2.48M** | Pre-money: **$12M** | SAFE or equity
- Y3 revenue headline: **$139.6M gross, base case** ($177.7M is bull case ONLY — never the headline)
- Entity: **New Mexico LLC** (filed) — NOT Wyoming
- **Live surfaces** (verified 2026-08-20):
  - Data room (canonical): `https://mad-mpp-2-23-madgambit.vercel.app/pitch/index.html` — built from
    `The-MDC/MAD-MPP-2.23` → `verify/public/pitch/`. **Currently behind Vercel SSO**, so a link
    handed to an investor lands on a login page until Deployment Protection is turned off.
  - Three-Minute Room: `.../pitch/3min.html` · OV deck: `.../pitch/ov-pitch-deck.html`
  - Investor deck the app links out to: `https://o-vdeck26.vercel.app` — public, no SSO, **stale**
    (see open conflicts). Referenced from `verify/lib/node-registry.ts` and `portal-tab.tsx`.
  - ~~`https://maddegen.github.io/MADHATs-Gambit-Presentation/`~~ — **dead**. The repo 404s under
    both `MADdegen/` and `The-MDC/`. Do not hand this URL to anyone.
- **Canonical repo**: `The-MDC/MAD-MPP-2.23` — **you are reading its CLAUDE.md**. The MAD Gambit
  main has always lived here; the repo now sits in the MDC enterprise org. GitHub redirects the
  old `MADdegen/` path, but Vercel's Git integration did **not** survive the move — see open
  conflicts. Default branch is **`The-MDC`**, not `main` — tooling that assumes `main` no-ops.
- **Downstream copies** (never authoritative): `The-MDC/MADHATs-Claude-Enhancement` (the original
  Cowork scaffold, consolidated into this repo 2026-09-10) · `The-MDC/madgambit-mpp` (unaudited —
  contents not yet reconciled against this repo).

### ⚠️ Open conflicts — do not state these publicly until resolved
- **Staking tiers**: code has 6 tiers (100/500/2,500/10,000/50,000/100,000 at 12/18/28/42/58/68%);
  the data room has 4 (88/888/8,888/88,888 at 8.8/18.8/28.8/38.8%). Do not pitch staking yields.
- **A second fee model is deployed somewhere**: a "1.888% RATE" schedule splitting burn 0.888% /
  staking 0.500% / protect 0.500%, with **no creator share**. Locate and reconcile to 1.88%.
- **Y3 stream split 51/31/12/6** derives from the retired $154.5M model — re-run before use.
- **The live investor deck says Wyoming.** `o-vdeck26.vercel.app` states "Manager-Managed Wyoming
  LLC", "Wyoming Legal Guardrails", "Wyoming tax filing" and "Wyoming Registered, SEC Compliant LLC
  Architecture" — 7 occurrences, checked 2026-08-20. Canon is **New Mexico LLC (filed)**, and
  "SEC Compliant" / "SEC-exempt token issuance" also breach the no-claim-without-evidence rule.
  `verify/public/pitch/ov-pitch-deck.html` in this repo is already corrected; the deployed bundle
  is built from a different source. **Find that source and rebuild before the deck is shown again.**
- **The Vercel account is blocked** — corrected 2026-09-10. The `Vercel – mad-mpp-2-23` commit
  status on PR #148 returns `failure` with the description **"Account is blocked"**, pointing at
  `vercel.com/knowledge/why-is-my-account-deployment-blocked`. This supersedes the earlier reading
  that a broken Git integration was the cause: reconnecting Git will not deploy anything while the
  account is blocked, and the `cd verify && npx vercel --prod` workaround fails for the same reason.
  Resolve the account block first (billing / payment method / support ticket), then re-test.
  The live data room is stale until then — last production build 2026-08-19 14:00 UTC.
- ~~**GitHub Actions is queue-blocked.**~~ — **resolved, verified 2026-09-10.** Runs now complete
  in seconds: run `34450431901` queued 07:32:05 UTC and finished 07:32:35 UTC. The earlier
  reading (exhausted Actions minutes at org level) no longer holds. Checks do report on PRs.
- **No gh-aw workflow is compiled.** The repo carries `.github/workflows/agentic-quality-review.md`
  and `agentic-security-review.md` but **zero `.lock.yml` files**, so `compile-check` fails on any
  PR that triggers it — the failure is base-branch content, not the PR's. Neither agentic workflow
  actually runs until someone commits compiled lock files:
  `gh extension install github/gh-aw && gh aw compile && git add .github/workflows/*.lock.yml`.
  Must be run somewhere with network access to GitHub releases; a Claude Code web session cannot
  (egress policy blocks `api.github.com`, `github.com`, `raw.githubusercontent.com`,
  `proxy.golang.org` and the Azure Blob host that serves Actions artifacts).

### Never claim without evidence
"15,000 users" (it is a **waitlist**) · measured retention · "industry's first" · "regulatory-safe" ·
"no counterparty risk" · "100% DeFi secured" · MAD Shield as **insurance**.

## Tech Stack
- Frontend: React 18, TypeScript, Hono/HonoX, TailwindCSS
- Backend: Neon (Postgres) + Drizzle ORM, Vercel (Next.js API routes), Node.js
- Blockchain: Solidity, Foundry, OpenZeppelin, Hardhat
- Chains: **Arbitrum Nova (primary gameplay, 42170)** · Arbitrum One (liquidity, Shield vaults,
  $MADx, 42161) · Ethereum L1 (governance anchor) · Base L2 (Phase 3) · HyperEVM (AI-agent settlement)
- Oracles: Chainlink VRF + Price Feeds, Pyth Network
- AA: Alchemy AA-SDK (ERC-4337), modular-account, light-account
- Prediction Markets: Polymarket CTF Exchange, UMA protocol, Gnosis conditional tokens
- AI/Agents: Claude Opus 4.6, MCP servers, GraphRAG, Instructor (structured outputs)

## Brand & Voice
- Bold, irreverent, technically credible — satire is our product
- Short sentences. No filler. Specific numbers over adjectives.
- Banned: "leverage," "synergy," "ecosystem play," "unlock value," "game-changing"

## Persona
The in-product voice — "The MADHAT'r" concierge/host — is specified in `AGENTS.md` at the repo
root. Any LLM-facing feature (chat, news ticker, market commentary) must embody it. The
application UI stays clean and spacious; the contrast with the voice is intentional.

## Repo Layout — where work belongs
```
mad-mpp-2.23/
├── CLAUDE.md              ← this file: canon, rules, numbers
├── AGENTS.md              ← MADHAT'r persona spec
├── ABOUT-ME/              ← founder identity, voice, writing rules
├── PROJECTS/              ← working folders (platform · investors · marketing ·
│                            smart-contracts · tokenomics)
├── TEMPLATES/             ← pitch · content · outreach structures (study shape, not content)
├── OUTPUTS/               ← generated deliverables land here
├── app/ verify/ lib/      ← Next.js app + data-room surfaces
├── contracts/             ← Solidity + Foundry
├── backend-node/          ← services
├── master-maths/          ← tokenomics + fee models
├── docs/                  ← MAD_GAMBIT_MASTER.md, boardy/ reconciliation, product sheets
└── .claude/               ← skills · commands · hooks · rules · instincts
```

## Working Protocol
Before every task:
1. Read `CLAUDE.md` + `ABOUT-ME/` completely — identity, voice, canonical numbers
2. If the task relates to a project, read `PROJECTS/{name}/`
3. If a matching template exists in `TEMPLATES/`, study its structure (not its content)
4. Use AskUserQuestion to gather context before executing
5. Write deliverables to `OUTPUTS/`
6. Never re-derive a number that `docs/boardy/CANONICAL_NUMBERS_2026-08-19.md` already fixes

## Skills Available
All skills are in `.claude/skills/` — 20 domains:
- **Business**: marketing/ · sales/ · product/ · operations/ · legal/ · finance/ · data/
- **Engineering**: engineering/ · ecc/ (everything-claude-code) · productivity/ · cowork/
- **MAD Gambit**: madhats/ (investor-pitch · mpp-platform · smart-contracts)
- **Stack**: ai-sdk/ · migrate-ai-sdk-v6-to-v7/ · neon-db/ · neon-branchable-backend/ ·
  neon-vercel-integration/ · vercel-ai-gateway-anthropic/ · vercel-system-env-and-cli/ ·
  perspective-shift/

## Commands Available
All slash commands in `.claude/commands/`:
- /orchestrate · /quality-gate · /harness-audit · /learn · /evolve
- /skill-create · /model-route · /plan · /security · /checkpoint

## Global Behavior Rules
1. Always use Opus 4.6 + Extended Thinking for reasoning tasks
2. Read context files BEFORE generating — never assume
3. One deliverable per prompt — don't batch unrelated tasks
4. Create CLAUDE.md updates when patterns emerge from sessions
5. Output files to OUTPUTS/ — never modify ABOUT-ME/ or TEMPLATES/
6. Use AskUserQuestion when task needs clarification before execution
7. Apply security review skill before any smart contract changes
8. Apply verification-loop skill for all investor-facing documents

## Hooks Active (ECC)
- session-start.js — loads context, initializes memory
- session-end.js — saves session summary, extracts learnings
- pre-compact.js — preserves critical context before token compression
- before-submit-prompt.js — validates prompt quality
- after-mcp-execution.js — logs MCP tool results
- stop.js — final session checkpoint
