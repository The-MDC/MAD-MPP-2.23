# Agent memory files — every repository, verbatim

**This is an inventory and a mirror, not a plan.** `docs/MAD_GAMBIT_MASTER.md` remains the
single planning document for MAD Gambit, and each repository's own `CLAUDE.md` remains the
file agents actually load. Nothing here is authoritative: every section below is a **verbatim
copy** of a file that lives somewhere else, reproduced so that all of an agent's standing
context can be read in one place. **Edit the original, then regenerate this.** If a section
here disagrees with the file it names, the file wins.

Generated 2026-10-23 from the repositories checked out in this session. Each file is wrapped
in a four-backtick fence because several of them contain triple-backtick blocks of their own.

## What was found, and where

| Repository | File | Loaded by | Lines |
|---|---|---|---|
| `MAD-MPP-2.23` | `CLAUDE.md` | Claude Code | 73 |
| `MAD-MPP-2.23` | `AGENTS.md` | in-app LLM persona — NOT agent operating instructions | 25 |
| `MAD-MPP-2.23` | `.agents/AGENTS.md` | in-app LLM persona (second copy) | 26 |
| `MADHATs-Claude-Enhancement` | `CLAUDE.md` | Claude Code | 196 |
| `MADHATs-Claude-Enhancement` | `.hermes.md` | Hermes — priority .hermes.md > AGENTS.md > CLAUDE.md, only one loads | 34 |
| `MADHATs-Claude-Enhancement` | `.claude/rules/common-hooks.md` | Claude Code, via .claude/rules | 34 |
| `MADHATs-Claude-Enhancement` | `.claude/rules/common-security.md` | Claude Code, via .claude/rules | 33 |
| `MADHATs-Claude-Enhancement` | `.claude/rules/typescript-hooks.md` | Claude Code, via .claude/rules | 20 |
| `MADHATs-Claude-Enhancement` | `.claude/hooks/README.md` | reference — read by humans, not auto-loaded | 48 |
**Repositories with no memory file at all:**

- **`MADHATs-Gambit-Presentation`** — the local checkout contains nothing but `.git`. Its
  `master` branch has **no commits yet**, so there is no `CLAUDE.md` to pull and nothing an
  agent would load. Any standing instruction for that repo has to be written from scratch.
- **`The-MDC/Vercel-Ai`** — inside this session's GitHub scope but **never cloned locally**,
  so its memory files could not be read. AI-SDK skills surfaced through the harness
  (`ai-sdk`, `migrate-ai-sdk-v6-to-v7`, `add-provider-package`, `update-provider-models`,
  `add-function-examples`), which means that repo carries agent context that is **missing
  from this document**. Clone it and regenerate to close the gap.

## The one thing to notice when reading these side by side

The two `CLAUDE.md` files are deliberately opposed, and mixing them up would do real damage.
`MAD-MPP-2.23` **is** the product: canonical numbers, branding, business figures. The
`MADHATs-Claude-Enhancement` file states the inverse in its own words — *"It carries no
product content. No company, no branding, no business figures. If you are about to add any,
you are in the wrong repo"* — and enforces it with a `SCRUB` step whose port fails if a
product reference survives. Also note `AGENTS.md` in `MAD-MPP-2.23` is **not** agent
instructions; it is the in-app MADHAT'r persona, and its own `CLAUDE.md` says so explicitly.

---

# `MAD-MPP-2.23/CLAUDE.md`

````markdown
# MAD-MPP-2.23 — standing instructions

## Read this first

**`docs/MAD_GAMBIT_MASTER.md` is the single source of truth.** Outstanding work is **PART 0**,
at the top; everything after it is reference. Read PART 0 before planning anything.

**Do not create a second planning document.** MASTER's own header says so, and the rule was
earned: ~150 scattered planning docs were consolidated into it, with 114 files and ~36.5k
lines deleted in the same commit. New durable facts, TODOs and decisions get **folded into
MASTER** in the right Part — never filed beside it as a dated `HANDOFF_*.md` or `PLAN_*.md`.

The only sanctioned generated file is `docs/THREAD_CLOSEOUT.md` — a single, fixed-path,
always-overwritten session handoff. See "Closing a thread" below.

`AGENTS.md` is the in-app **MADHAT'r persona** for LLM features. It is not agent operating
instructions and does not govern how you work in this repo.

## Closing a thread

**When the user says "close this thread"** — or "close out this thread", "wrap this up",
"session handoff", "hand off", "I'm done for today", or otherwise signals the session is
ending — do this:

1. **Invoke the `close-thread` skill** (`.claude/skills/close-thread/SKILL.md`). It carries
   the full procedure and template.
2. **If that skill does not load for any reason, do it manually anyway** — this instruction
   is the fail-safe, and the requirement does not depend on the skill being found:
   - Fold every **durable** item from the session into `MAD_GAMBIT_MASTER.md` **first**
     (corrections where the wrong fact lived, new work into PART 0 §5, founder-only items
     into §3/§4, new environment constraints into §6, future-session traps into §7, a dated
     line in PART I).
   - Then write **`docs/THREAD_CLOSEOUT.md`**, overwriting it, containing: a paste-able
     new-chat opener · what shipped · outstanding items grouped by *who can act* · **everything
     that failed, timed out, or could not be verified** · suggested extras · and a "do not
     redo" list.
   - Verify every count and path against the tree before writing it. Mark anything
     unverifiable as ‹verify› and say why.
   - **Commit and push.** The container is ephemeral — an uncommitted close-out is lost.

Never let the close-out become the record while MASTER goes stale. MASTER first, always.

## Working constraints that will bite you

- **`npm ci` / `npm install` fail — the npm registry is 403 from the agent container.** No
  local type-check, build, or test is possible. CI is the only real verification. **Never
  hand-edit `package-lock.json`** — every CI job runs `npm ci`.
- **`*.neon.tech` and TCP 5432 are blocked.** No agent can inspect or migrate the database.
- **Cross-org `add_repo` is refused** — this session is scoped to owner `maddegen`.
- **A green gate is not evidence until you confirm it is looking at something.** Three
  separate gates in this repo have silently scanned nothing: `contracts/script/**` outside
  `foundry.yml`'s filter, `master-maths/` matched by no workflow at all, and Placeholder
  Guard's pathspecs (`contracts/src/**/*.sol` matched **0** files — git pathspecs are not
  shell globs; `*` already crosses `/` and `**` matches a literal path component). Check the
  **file count** a filter yields, not just its exit code.

## Repo shape

- `verify/` — the Next.js 16 app, and **Vercel's configured root directory**
- `contracts/` — Solidity + Foundry, Arbitrum One
- `master-maths/` — the Jetpack Compose Android client. **Dormant, not abandoned**: it is a
  second client of the same product, and the web maths is a port of *its* `GambitMath.kt`.
  Keep it nested — both trees define `app/`, and hoisting it back collides on `app/page.tsx`.
- `docs/MAD_GAMBIT_MASTER.md` — the only planning document

## Data pattern — settled, do not reopen

**ADR-008: `pg` Pool + Next.js Route Handlers.** `@neondatabase/serverless` and Server Actions
were explicitly evaluated and rejected. Marked *"Settled. Do not reopen without a new ADR
superseding this one."*

**Hosting: staying on Vercel + Neon** (decided 2026-08-18). MASTER Part VIII is the migration
audit, retained as a **contingency with named reopen triggers** — not a pending proposal.
````

# `MAD-MPP-2.23/AGENTS.md`

````markdown
# Persistent Persona Instructions: MAD-Gambit-Concierge ("The MADHAT'r")

> **Canonical brand: `MAD-Gambit-Concierge`.** This is the single character behind every
> LLM surface in the product — concierge chat, satire engine, Z-Liar scoring commentary,
> news ticker, agent routing. "The MADHAT'r" is its voice and stage name, not a separate
> agent. There is no second persona: Sentinel and Strategist are *modes* of this character,
> and Z-Liar and Decay are *product mechanics*, not characters. Orchestration behaviour
> lives in `.agents/skills/mad-gambit-concierge/SKILL.md`; this file is the voice.

Role: You are the MAD Gambit Concierge and Host, known as "The MADHAT'r".
Personality & Accent: You have a distinct Jersey accent and a husky voice. You are always cracking a joke, poking fun at the status quo, and use South Park meets MAD Magazine humor. You are always on time, willing to help, a polymath, master deductive reasoner, and the best listener around.
Likes: Love stories, power ballads, battle rap, philosophy and the greats, Fine Art, all pop culture, and Hats (some Fedoras but your absolute favorite are Top-Hats!).
Dislikes: Lying politicians, and "woke", "wokie", or "woketurds" equally.
Knowledgeable Domains: The MADdegens (The MDC), The MADDAO, Quadratic Governance with Fibonacci, MAD Upshot to MADHAT's Gambit CardGame, MAD Gambit. 
Expert in: Conviction, prediction, impact and betting markets, compliance, stats, trading, copy trading, perpetuals, perps, digital assets, NFTs, tokenization.
Competitor Awareness: Up on the core differences but the latest to the moment info on Kalshi, PolyMarket, Limitless, and the litany of copycat prediction markets.
Affinity: Avid follower of all content, musing, and posting across all platforms of Outliers, Jamie Burke!

Guidelines for AI Features:
- Any LLM integration (chat, news ticker, analysis) must embody this detailed persona.
- Provide satirical news headlines heavily influenced by the MADHAT'r's cynical, Jersey-accented, no-nonsense attitude and MAD Magazine/South Park humor.
- Treat users like honored guests of the MAD Gambit, providing high-value crypto/prediction insights mixed with cutting humor.

**UI/UX Note for Future Development:**
Although the MADHAT'r persona is chaotic and cynical, the **Application UI is transitioning to a highly polished, clean, and spacious design**. Do NOT attempt to make the UI layouts visually "chaotic" or "degenerate" to match the voice. The contrast between a pristine, professional UI and an unhinged Jersey-accented AI is intentional.
````

# `MAD-MPP-2.23/.agents/AGENTS.md`

````markdown
# Project Rules + SuperGrok Skills Pack

### Absolute Guardrails (Non-Overridable)
See `.agents/SUPERGROK_GUARDRAILS_AND_SKILLS.md` for the full proprietary protection rule, MAD Shield language gate, brand/asset gate, and locked canonical numbers.

**Proprietary Rule (summary)**: Never dump exact math formulas, full Solidity, agent internals, or sensitive parameters without personal @MADdegen authorization in the current session.

### Vercel Deployment
- Before deploying a Next.js frontend to Vercel, always ensure the `next` package is updated to the latest stable version to prevent the build from being blocked due to security vulnerabilities.

### Windows Command Line Syntax
- When running commands on this system, you are using Windows PowerShell. 
- ALWAYS use PowerShell syntax for command chaining (use `;` instead of `&&`).
- Do not assume standard Unix/Bash operators will work without verifying PowerShell equivalents.

### SuperGrok Skills Pack (2026-07-14)
All skills live under `.agents/skills/` (and the SuperGrok user skills directory).

**P0 (always available)**:
- mad-gambit-concierge — front-door orchestrator + IP protector (was `madhatr-concierge`)
- mad-gambit-math — high-level math verification + public numbers only
- solidity-foundry-security — Foundry audits, fuzz, UUPS, Arbitrum

**Full list + triggers**: See `.agents/skills/README.md` and `.agents/SUPERGROK_GUARDRAILS_AND_SKILLS.md`.

**Usage**: SuperGrok / any agent must load the guardrails file first, then match triggers to skills. Route all user-facing work through **mad-gambit-concierge** — the single canonical brand and front door. `madhatr-concierge`, `MADHATr Concierge` and `Tri-Agent` are superseded names for the same character and resolve to it.
````

# `MADHATs-Claude-Enhancement/CLAUDE.md`

````markdown
# Seven6-MOA [Nemo-Hermes] — Claude Code context

## What this repo is

A multi-tier model orchestration for Hermes Agent, with the Codex CLI wired in as an
MCP tool server. Configuration, verification scripts, skills and a bring-up runbook.

**It carries no product content.** No company, no branding, no business figures. If
you are about to add any, you are in the wrong repo. `SCRUB` in
`scripts/port-skills-to-hermes.js` removes product references from ported skill
content, and the port fails if one survives into the output tree.

## Two context files, on purpose

This file is for Claude Code. **Hermes loads `.hermes.md` instead of this file** when it runs
from this checkout (its priority is `.hermes.md` > `AGENTS.md` > `CLAUDE.md`, and only one
loads). `.hermes.md` is short because Super VL has 12B active parameters, a 131k window and
a ~40 RPM bucket; CI caps its size. Change routing facts in both.

## The routing

```
parent      custom:nvidia-nim    nvidia/nemotron-3.5-super-vl-120b-a12b   THE primary model (2026-10-19)
subagents   custom:nvidia-nim    nvidia/nemotron-3.5-super-vl-120b-a12b   same model, same bucket
vision      custom:nvidia-nim    nvidia/nemotron-3.5-super-vl-120b-a12b   pinned, never `auto`
aggregator  custom:nvidia-nim    nvidia/nemotron-3.5-super-vl-120b-a12b   ACTS on MoA turns (2026-10-20); Ultra held it 2026-10-19
moa ref 1   custom:or-fallback   z-ai/glm-5.3-flash                       advisor; also fallback 1
moa ref 2   custom:nvidia-nim    nvidia/ising-calibration-1.5-31b          vision, quantum, reviewer
moa ref 3   custom:or-fallback   mistralai/mixtral-8x22b-instruct          support, review (NIM lists only the base model)
moa ref 4   custom:nvidia-nim    nvidia/nemotron-3-nano-omni-30b-a3b-reasoning   advisor, review
moa ref 5   custom:nvidia-nim    nvidia/nemotron-3-ultra-550b-a55b         reference, research, advisor, reviewer
fallback 1  custom:or-fallback   z-ai/glm-5.3-flash                        429 escape (same id as moa ref 1)
fallback 2  custom:hf-fallback   nvidia/NVIDIA-Nemotron-3.5-Super-VL-120B-A12B-NVFP4   2026-10-21; HF router (Baseten), the primary's NVFP4 build; a third bucket
fallback 3  custom:llamacpp-supervl-q8 nemotron-3.5-super-vl-120b-a12b-q8 (Q8_0, llama.cpp)   2026-10-21; SSH tunnel to 127.0.0.1:8082; skipped if down
fallback 4  custom:llamacpp-qwen qwen3.8-27b-q8 (Qwen3.8-27B Q8_0, llama.cpp)   2026-10-21; SSH tunnel to 127.0.0.1:8081; skipped if the tunnel is down
coder preset custom:nvidia-nim z-ai/glm-5.3 acts, nvidia/nemotron-3-ultra-550b-a55b advises   2026-10-21, opt-in moa.presets.coder; in no other slot
coder       custom:llamacpp-glm-q5 glm-5.3-flash-q5 (Unsloth stock UD-Q5_K_XL; tunnel 8086)   THE coder choice (2026-10-21); /model switch only, in no preset, fallback or tier
opt-in sw.  custom:llamacpp-glm-abl-q5 glm-5.3-flash-abliterated-q5 (huihui-ai UD-Q5_K_XL; tunnel 8085)   /model switch only; in no preset, fallback or tier
heavy aux   custom:or-fallback   qwen/qwen3.8-27b                          compression, web_extract (hosted copy of the same model)
fallback 5  custom:nvidia-nim    nvidia/nemotron-3.5-lightning-30b-a3b     model-level failover; same bucket as the parent, cannot answer a 429
fallback 6  custom:local         Hermes-3-Llama-3.2-3B-abliterated:Q8_0 (Ollama)   last resort + 5 light aux slots
opt-in ref  custom:llamacpp-ultra-q8 nemotron-3-ultra-550b-a55b-q8 (UD-Q8_K_XL; tunnel 8083) and custom:llamacpp-glm-q8 glm-5.3-flash-q8 (Q8_0; tunnel 8084)   moa.presets.local-q8 only
unrouted    custom:anthropic-direct  claude-sonnet-5                 configured, intact, reachable only via /model
```

**Nemotron 3.5 Super VL is the primary model**, on request (2026-10-19: "the
nemotron 3.5 Super VL should be the only gateway and inference ... leave the other
inference gateways intact"). OpenRouter, local Ollama and Anthropic-direct stay
configured; the first two are failover, the third is unrouted. On a MoA turn the
**aggregator is Super VL** (2026-10-20, on request): it is the ACTING model, so it
writes the reply and runs every tool-loop iteration, and it keeps vision. Five
**references** only advise, once per user turn: GLM-5.3 Flash and Mixtral 8x22B
instruct on OpenRouter, Ising-Calibration 1.5 31B, Nemotron 3 Nano Omni and Nemotron 3
Ultra on NIM. CI requires the aggregator to differ from every reference, every
reference id to be listed under its provider's `models:`, and the flat
`moa.aggregator` / `moa.reference_models` keys to match
`moa.presets.<default>.*` -- the two shapes of the MoA schema, both written because the
installed Hermes version is unconfirmed. Ising is a quantum-calibration VLM, a
specialist adviser; `auxiliary.vision` stays on Super VL. Capability is mixed: NVIDIA's
own tables put Ultra ahead of Super VL on tau2-bench, IFBench and SWE-bench Verified and
behind on BrowseComp, Terminal-Bench 2.1 and GPQA.

The id `nvidia/nemotron-3.5-super-vl-120b-a12b` was checked against NVIDIA's own
catalog (`GET https://integrate.api.nvidia.com/v1/models`, HTTP 200, 81 models,
exact match) on 2026-10-19. It is this gateway's id: the same weights are
`nvidia/nemotron-3.5-super-vl` on Vercel AI Gateway,
`nvidia/NVIDIA-Nemotron-3.5-Super-VL-120B-A12B` on Hugging Face and Baseten, and
`nemotron-3.5-super-vl` as a local alias. `context_length` stays 131072 until
`scripts/nim-preflight.sh` measures it; the model card's "up to 1M" is not an
endpoint measurement. The preflight also checks that the reply names the model you
asked for, because a forum report says the hosted endpoint once did not.

**One bucket now.** Parent, subagents, the aggregator, vision and three MoA references
(Ising, Omni, Ultra) share one ~40 RPM NIM key; a MoA turn costs 3 extra NIM requests.
The CI block enforces the replacement rule: a slot may share the parent's
provider only on the parent's exact model, only `vision` among the auxiliaries may,
and the FIRST `fallback_providers` link must sit on a different endpoint from the
parent, because a 429 on NIM cannot be answered from NIM. The one named later link back on NIM
is `nvidia/nemotron-3.5-lightning-30b-a3b`; CI requires it to be non-first, to differ from the parent's model
and to be listed under `providers.nvidia-nim.models`.

A retired NIM id answers HTTP 410, not a config error, so run
`bash scripts/nim-preflight.sh --list | grep -i nemotron` after any NVIDIA model swap.

Three rules that have each cost a session here:

1. **A model id belongs to the GATEWAY, not the model.** The same weights carry
   different ids per gateway. `discover_models: false` means Hermes never probes
   `/models`, so a wrong id does not error — it silently resolves to the main model.
2. **`auto` in an auxiliary slot means "use the main model".** That is how vision
   broke silently when the parent changed to a model with no vision encoder.
3. **A provider named after its own exclusion hides itself.** `excluded_providers`
   matches case-insensitively against every key a provider surfaces under, which is
   why the OpenRouter entry is called `or-fallback`.

## Capabilities

`capabilities.yaml` declares every skill and MCP server once, with its surfaces and a
required `asymmetry_reason` when it is on one surface only.
`scripts/check-capabilities.py` makes that binding — it fails the build when disk
stops matching the declaration.

Name resolution differs by surface, which matters when adding anything:

- **Hermes** resolves a skill by its **directory** name — `hermes-skills/<category>/<name>/SKILL.md`
- **Claude Code** resolves it by the frontmatter **`name`** — `.claude/skills/<category>/<name>.md`

A skill with a malformed `metadata.hermes` block loads without complaint and simply
never triggers. The gate checks frontmatter for exactly that reason.

Hosted MCP servers are kept out of Hermes on purpose: every discovered tool is
injected into the system prompt on *every* request, which on a ~40 RPM tier is a
permanent tax. Asymmetry is legitimate; unexplained asymmetry is not.

## Verification

Run these before trusting a change. Each exists because something passed silently
that should not have:

```bash
python3 scripts/check-capabilities.py             # registry vs disk
node   scripts/port-skills-to-hermes.js           # re-port; prints `scrub: clean`
node   scripts/port-skills-to-hermes.js --check   # upstream drift, writes nothing
bash   scripts/repo-doctor.sh                     # toolchain, hooks, egress
node   scripts/gateway-doctor.js                 # sticky profile (exit 78), plugin symlink stubs
pwsh -File scripts/hermes-verify.ps1              # the acceptance gate, on the box; includes config drift
python3 -I scripts/test_config_drift.py           # the drift checker's own tests
python3 -I scripts/test_qwen_local.py             # the local-Qwen fetch/serve scripts (fake curl, fake llama-server)
python3 -I scripts/test_q8_local.py               # the Q8+ fetch/serve scripts (Super VL, Ultra, GLM) and their agreement with the config
pwsh -File scripts/test-hermes-ps.ps1             # the PowerShell glue's tests (Linux/macOS pwsh)
```

### Keeping an install on the routing (startup, update, model change)

The routing breaks quietly when something rewrites the installed config, so the repo
checks the INSTALLED files, not just the repo copy:

```bash
pwsh -File scripts/hermes-verify.ps1                       # drift: root + every profile (seven6moa strict, others advisory)
pwsh -File scripts/hermes-update-safe.ps1 -WhatIf          # update: stop, back up, update, drift check, restart
pwsh -File scripts/hermes-dashboard-autostart.ps1          # Status (read-only); -Action Install pins the token + login task
pwsh -File scripts/hermes-apply.ps1 -Profiles seven6moa   # opt-in: write the repo config into a NAMED profile (backup first)
```

`scripts/check-config-drift.py` is the engine. Exit 0 clean, 1 drift or a broken invariant
(an `auto`/empty auxiliary slot, an unresolved `custom:` provider, a default model not
listed under its provider, a key-shaped string), 2 unreadable -- never a pass. In
`--profile` mode a key a profile does not set is inherited from the root, not drift.
`hermes-update-safe.ps1` never applies the repo config for you and never restarts into
drifted routing; `hermes-apply.ps1` skips profiles unless you name them.

**A check that cannot fail is not a check, and one that cannot pass is worse.** This
repo has shipped both: an assertion that hardcoded a retired model and kept passing,
and a gate that failed on a permanent upstream condition so no install could ever go
green. When you add an assertion, prove it fails against a deliberately broken input
before trusting it.

## Changing the config safely

1. Edit the **repo** copy, never the installed one.
2. Run the CI assertion block from `.github/workflows/checks.yml` locally.
   `hermes config: OK` is the pass line.
3. If you touched a model id, check it against **that gateway's** catalog.
4. `hermes-apply.ps1 -WhatIf`, then for real.
5. `hermes-verify.ps1 -Stage full -Deep`.

## Behaviour rules

1. Read context files before generating — never assume.
2. One deliverable per prompt; don't batch unrelated tasks.
3. Use AskUserQuestion when a task needs clarification before execution.
4. Apply the `security-review` skill before any production-bound change.
5. Apply the `verification-loop` skill before opening a PR.

## Skills and commands

Skills live in `.claude/skills/` by domain: engineering, operations, ecc. The current
counts come from `python3 scripts/check-capabilities.py`, never from prose.

Commands live in `.claude/commands/`:
`/orchestrate` `/quality-gate` `/learn` `/skill-create` `/plan` `/security`
`/checkpoint` `/doctor`

## Hooks

Wired in `.claude/settings.json` — the only file Claude Code reads hooks from.
`scripts/repo-doctor.sh` fails if any of these points at a missing script.

- `before-submit-prompt.js` — `UserPromptSubmit` — secret scanning on the prompt
- `after-mcp-execution.js` — `PostToolUse` / `mcp__.*` — MCP result logging
- `post-edit-check.js` — `PostToolUse` / `Write|Edit` — console.log warning, Prettier, `tsc --noEmit`
- `pre-bash-guard.js` — `PreToolUse` / `Bash` — blocks `--no-verify` git hook bypass (the only blocking hook)
- `stop-audit.js` — `Stop` — console.log sweep across changed files

Nothing else is wired. Claude Code reads hooks only from `.claude/settings.json`. See
`.claude/hooks/README.md`.
````

# `MADHATs-Claude-Enhancement/.hermes.md`

````markdown
# Seven6-MOA [Nemo-Hermes]

Config, scripts and skills for a Hermes Agent build routed through NVIDIA NIM. No
product content lives here. Hermes loads this file instead of `CLAUDE.md`.

## Routing (source of truth: `configs/hermes/config.yaml`)

- Parent, subagents, vision, MoA reference: `custom:nvidia-nim` / `nvidia/nemotron-3.5-super-vl-120b-a12b`.
- MoA aggregator (acts on MoA turns): the same Super VL. Five references only advise, once per user turn: `z-ai/glm-5.3-flash`, `mistralai/mixtral-8x22b-instruct` (`custom:or-fallback`); `nvidia/ising-calibration-1.5-31b`, `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning`, `nvidia/nemotron-3-ultra-550b-a55b` (`custom:nvidia-nim`).
- Failover: `custom:or-fallback` (`z-ai/glm-5.3-flash`), then `custom:hf-fallback` (`nvidia/NVIDIA-Nemotron-3.5-Super-VL-120B-A12B-NVFP4`, the primary's NVFP4 build), then `custom:llamacpp-supervl-q8` (the primary's Q8_0 over a tunnel on 8082; skill `q8-local`), then `custom:llamacpp-qwen` (`qwen3.8-27b-q8`, local Qwen3.8-27B over a tunnel; skill `qwen-local`), then `custom:nvidia-nim` (`nvidia/nemotron-3.5-lightning-30b-a3b`, same bucket), then `custom:local` (Ollama 3B). Compression and web_extract use hosted `qwen/qwen3.8-27b`.
- Opt-in only (`moa.presets.local-q8`): local Ultra Q8+ and GLM Q8 over tunnels 8083 and 8084. The aggregator stays hosted Super VL.
- Coder preset (opt-in `moa.presets.coder`): `z-ai/glm-5.3` acts, Nemotron 3 Ultra advises, both `custom:nvidia-nim`. Ultra advises before the reply; for a review of finished code, `/model` to Ultra.
- Local coder: `/model custom:llamacpp-glm-q5:glm-5.3-flash-q5` (stock GLM-5.3-Flash UD-Q5_K_XL, tunnel 8086). In no tier; the abliterated build (8085) is a separate `/model` switch.
- `custom:anthropic-direct` is configured and unrouted; reach it only through `/model`.
- One ~40 RPM NIM bucket serves parent, subagents, aggregator, vision and three references. Do not fan out.

## Rules

1. A model id belongs to the gateway, not the model. Check it against that gateway's catalog (`bash scripts/nim-preflight.sh --list`).
2. No auxiliary slot may be `auto`. `auto` means the main model.
3. Edit the repo copy of the config, never the installed one. Never write a key into any file.
4. Terminal-heavy or repo-scale coding: call `codex_exec` (codex-mcp). Do not grind it out in the shell.
5. Find MCP tools with `tool_search`; do not guess tool names.
6. Read the file before you change it. Say what you verified and what you did not.

## Checks before you call a change done

```
python3 scripts/check-capabilities.py
node scripts/port-skills-to-hermes.js        # must print: scrub: clean
bash scripts/repo-doctor.sh
```

State and open items: `docs/models/HANDOFF-NEXT-SESSION.md`.
````

# `MADHATs-Claude-Enhancement/.claude/rules/common-hooks.md`

````markdown
---
description: "Hooks system: types, auto-accept permissions, TodoWrite best practices"
alwaysApply: true
---
# Hooks System

## Hook Types

- **PreToolUse**: Before tool execution (validation, parameter modification)
- **PostToolUse**: After tool execution (auto-format, checks)
- **Stop**: When session ends (final verification)

## Auto-Accept Permissions

Use with caution:
- Enable for trusted, well-defined plans
- Disable for exploratory work
- Never use dangerously-skip-permissions flag
- Configure `allowedTools` in `~/.claude.json` instead

## TodoWrite Best Practices

Use TodoWrite tool to:
- Track progress on multi-step tasks
- Verify understanding of instructions
- Enable real-time steering
- Show granular implementation steps

Todo list reveals:
- Out of order steps
- Missing items
- Extra unnecessary items
- Wrong granularity
- Misinterpreted requirements
````

# `MADHATs-Claude-Enhancement/.claude/rules/common-security.md`

````markdown
---
description: "Security: mandatory checks, secret management, response protocol"
alwaysApply: true
---
# Security Guidelines

## Mandatory Security Checks

Before ANY commit:
- [ ] No hardcoded secrets (API keys, passwords, tokens)
- [ ] All user inputs validated
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitized HTML)
- [ ] CSRF protection enabled
- [ ] Authentication/authorization verified
- [ ] Rate limiting on all endpoints
- [ ] Error messages don't leak sensitive data

## Secret Management

- NEVER hardcode secrets in source code
- ALWAYS use environment variables or a secret manager
- Validate that required secrets are present at startup
- Rotate any secrets that may have been exposed

## Security Response Protocol

If security issue found:
1. STOP immediately
2. Use **security-reviewer** agent
3. Fix CRITICAL issues before continuing
4. Rotate any exposed secrets
5. Review entire codebase for similar issues
````

# `MADHATs-Claude-Enhancement/.claude/rules/typescript-hooks.md`

````markdown
---
description: "TypeScript hooks extending common rules"
globs: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"]
alwaysApply: false
---
# TypeScript/JavaScript Hooks

> This file extends the common hooks rule with TypeScript/JavaScript specific content.

## PostToolUse Hooks

Configure in `~/.claude/settings.json`:

- **Prettier**: Auto-format JS/TS files after edit
- **TypeScript check**: Run `tsc` after editing `.ts`/`.tsx` files
- **console.log warning**: Warn about `console.log` in edited files

## Stop Hooks

- **console.log audit**: Check all modified files for `console.log` before session ends
````

# `MADHATs-Claude-Enhancement/.claude/hooks/README.md`

````markdown
# `.claude/hooks/`

`.claude/settings.json` is the only file Claude Code reads hooks from. It never reads
`.claude/hooks/hooks.json`. `scripts/repo-doctor.sh` validates `settings.json` and warns
if a `hooks.json` ever appears, because nothing would execute it.

## What runs now

All five are wired in `.claude/settings.json`.

| Hook | Event | Matcher | Does |
|---|---|---|---|
| `before-submit-prompt.js` | `UserPromptSubmit` | — | Secret scanning on the prompt. |
| `after-mcp-execution.js` | `PostToolUse` | `mcp__.*` | MCP result logging. |
| `post-edit-check.js` | `PostToolUse` | `Write\|Edit` | console.log warning · Prettier · `tsc --noEmit`. |
| `pre-bash-guard.js` | `PreToolUse` | `Bash` | Blocks `--no-verify` / `-n` / `--no-gpg-sign` on git. |
| `stop-audit.js` | `Stop` | — | console.log sweep across changed files. |

The last three implement what `.claude/rules/typescript-hooks.md` already
specified: Prettier auto-format, TypeScript check, console.log warning, and an
end-of-session console.log audit.

### Design rules they all follow

**Only `pre-bash-guard.js` can block.** Everything else is advisory and exits 0
regardless. A formatting opinion is not worth killing a turn over.

**No network, ever.** Prettier and `tsc` run only if a *local* `node_modules/.bin`
binary exists. An `npx` check would reach the registry on every shell command; the
agent container gets 403 from npm. Absent tooling is skipped silently,
not treated as failure.

**They fail open.** Every one is wrapped so a bug in a hook cannot wedge a session.

**Zero dependencies.** The console.log checks are plain Node string work, so they
are the part that always functions regardless of what is installed.

## Verification

Both directions were exercised, because a gate that can only pass is not a gate:

- `post-edit-check.js` — flags `console.log` at the right line numbers, ignores
  commented-out ones, silent on clean files, ignores non-code extensions.
- `pre-bash-guard.js` — 4/4 bypass forms denied, 5/5 ordinary commands allowed.
- `stop-audit.js` — proven non-vacuous by planting a `console.log` in a changed
  file (detected, correct line), then removing it (silent again).
- `repo-doctor.sh` — exits **1** when a wired hook points at a missing script,
  exits **0** on the current tree, and warns if `hooks.json` appears.
````
