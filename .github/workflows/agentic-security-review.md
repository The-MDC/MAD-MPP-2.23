---
description: AI-assisted security review on every PR touching app/backend/contracts — complements (does not replace) Slither, TruffleHog and Dependency Review
on:
  pull_request:
    types: [opened, synchronize, reopened]
    paths:
      - "app/**"
      - "backend-node/**"
      - "contracts/**"
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
  NOTE (read before activating): this is uncompiled gh-aw SOURCE. Run
  `gh aw compile` (after `gh extension install github/gh-aw`) to generate
  the paired `agentic-security-review.lock.yml` and validate this
  frontmatter — gh-aw was in technical preview when this was written and
  was never run through the real compiler in the session that authored
  it. See MADHATs-Claude-Enhancement's
  `.claude/skills/ecc/gh-aw-agentic-workflows.md` for the full activation
  runbook (ANTHROPIC_API_KEY secret, compile step, enabling Actions).
-->

# AI Security Review

Review the changes in this pull request for security issues, using the
OWASP-based checklist from `MADHATs-Claude-Enhancement`'s
`.claude/commands/security.md` and the guardrails in that repo's
`.claude/rules/common-security.md` (both governance docs for this org —
read them if reachable from this checkout, otherwise apply the same
checklist from memory):

- Injection (SQL/NoSQL/OS command), broken auth, sensitive data exposure,
  broken access control, security misconfiguration, XSS, insecure
  deserialization, known-vulnerable components, insufficient logging.
- Hardcoded secrets, CORS, rate limiting, CSRF, secure cookie flags.
- For anything under `contracts/`: reentrancy, unchecked external calls,
  integer overflow/underflow, access control on privileged functions —
  flag it even though Slither also runs on this repo; you're a second,
  qualitative reader, not a replacement for it.

## Scope discipline

This review is **advisory and additive**. This repo's existing
deterministic gates (Slither, TruffleHog secret scan, Dependency Review,
type-check, lint — see `SECURITY.md`) are the enforced blockers. Do not
restate what those already catch; focus on business-logic, authorization,
and prediction-market-specific risk (oracle manipulation, market
resolution edge cases, fund custody paths) that static analysis tends to
miss.

## Output

Post exactly one PR comment (`add-comment`) with:

- **Critical** — must fix before merge
- **High priority** — should fix before release
- **Notes** — optional improvements

If you find nothing, say so briefly. Do not pad the report to look
thorough.
