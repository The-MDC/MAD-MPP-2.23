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
    toolsets: [pull_requests, search]
  edit:
safe-outputs:
  add-comment:
    max: 1
---

<!--
  `.lock.yml` is generated and kept in sync automatically by
  agentic-compile.yml (runs in GitHub Actions on every push to this file).
  Still requires an ANTHROPIC_API_KEY repo secret to actually run — see
  MADHATs-Claude-Enhancement's
  `.claude/skills/ecc/gh-aw-agentic-workflows.md` for the activation
  runbook.
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
