---
description: AI-assisted code quality review on every PR — reuse, simplification, and maintainability commentary alongside the deterministic lint/type-check/build gates
on:
  pull_request:
    types: [opened, synchronize, reopened]
    paths:
      - "app/**"
      - "backend-node/**"
permissions:
  contents: read
  pull-requests: read
engine: claude
network:
  allowed:
    - defaults
    - api.anthropic.com
tools:
  github:
    toolsets: [pull_requests, code_search]
  edit:
safe-outputs:
  add-comment:
    max: 1
---

<!--
  NOTE (read before activating): uncompiled gh-aw SOURCE — run
  `gh aw compile` before enabling. See MADHATs-Claude-Enhancement's
  `.claude/skills/ecc/gh-aw-agentic-workflows.md` for the activation
  runbook.
-->

# AI Quality Review

`ci.yml` and `unit-tests.yml` already enforce type-check, lint, build, and
tests — this workflow does not repeat those. Instead, read the diff and
comment on what deterministic tools structurally cannot catch:

- Unnecessary abstraction, duplicated logic, dead code introduced by the
  PR
- Naming/readability that will confuse the next reader
- Missed reuse of existing helpers/patterns already in this codebase
- Obvious efficiency issues (N+1 queries, unbounded loops over large
  data, redundant re-renders)

Follow the same restraint as this org's `simplify` skill: quality only,
no bug-hunting (that's the security-review workflow's job), and no
nitpicking style already covered by eslint.

## Output

Post exactly one PR comment (`add-comment`). If the diff is clean, say so
in one line — don't manufacture findings to justify the run.
