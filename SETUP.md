# MAD Gambit — Working Setup

> **One repo. One truth.** `The-MDC/MAD-MPP-2.23` holds the platform code, the canonical
> numbers, the agent context, the skills, the commands and the hooks. Clone this and you have
> everything. There is no second folder to keep in sync.

Default branch is **`The-MDC`** — not `main`.

## 1. Clone

```bash
git clone https://github.com/The-MDC/MAD-MPP-2.23.git
cd MAD-MPP-2.23
```

## 2. Point every surface at this one folder

| Surface | How |
|---|---|
| **Claude Code (CLI / desktop)** | Open this folder. `CLAUDE.md` loads automatically. |
| **Claude Code on the web** | The repo is already attached — sessions clone it fresh. |
| **Cowork (desktop)** | Cowork tab → *Work in a folder* → select this clone. |
| **Global instructions** | Settings → Cowork → Edit Global Instructions → paste `ABOUT-ME/global-instructions.md`. |

Because Cowork now points at a git clone, everything it writes into `OUTPUTS/` and `PROJECTS/`
is committable. That is the whole point — commit and push at the end of a working session and
nothing is stranded on one machine.

## 3. Migrating an old local Cowork folder

If you still have a `MADHATs-Cowork/` (or similar) folder from the previous setup, its
`PROJECTS/`, `TEMPLATES/` and `OUTPUTS/` were never in git. Run the sweep script to find and
move them:

```bash
bash scripts/cowork-sweep.sh ~/MADHATs-Cowork      # dry run — shows what it would move
bash scripts/cowork-sweep.sh ~/MADHATs-Cowork --apply
git status                                          # READ THIS before committing
git add PROJECTS TEMPLATES OUTPUTS
git commit -m "chore: migrate local Cowork folders into canonical repo"
git push
```

Run `git status` before committing. Old `OUTPUTS/` content came from sessions that may have
had credentials pasted into them.

## 4. Connectors

Settings → Connectors: GitHub (The-MDC org) · Google Drive · Notion · Slack · Neon · Vercel.
Server list is in `.mcp.json`.

## 5. Plugins (optional)

```bash
claude plugin marketplace add anthropics/knowledge-work-plugins
claude plugin install marketing@knowledge-work-plugins
claude plugin install sales@knowledge-work-plugins
claude plugin install product-management@knowledge-work-plugins
```

## 6. GitHub Agentic Workflows (gh-aw)

Runs `/security`, `/quality-gate` and `/harness-audit` on PR/issue events instead of only
interactively. Detail in `.claude/skills/ecc/gh-aw-agentic-workflows.md`.

1. `gh extension install github/gh-aw` (one time, needs the `gh` CLI).
2. `gh aw compile` from the repo root to regenerate each `.github/workflows/*.lock.yml`.
3. Add an `ANTHROPIC_API_KEY` repo secret.
4. Commit the compiled `.lock.yml` files, then open a PR touching the relevant paths.

These are advisory PR comments, not blocking gates.

> ⚠️ **Actions is queue-blocked at the org level** (runs from 2026-08-18/19 still `queued`).
> No PR here shows a green check until the Actions minutes / spending limit clears.

## Starter prompt

```
I want to [TASK] so that [SUCCESS CRITERIA].
Read CLAUDE.md and ABOUT-ME/ first.
Apply the relevant skill from .claude/skills/ before starting.
Use AskUserQuestion to clarify before executing.
```
