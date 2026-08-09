---
name: production-readiness-gate
description: Use for MAD Gambit production readiness checks including Vercel pipeline, SIWE, PROFILE_DB, BACKEND_PLACEHOLDERS, tsc/next build, forge test, screenshot-diff, secrets, and deploy checklist. Trigger on production gate, SIWE, deploy checklist, Vercel status, audit report, or any pre-release verification.
---

# Production Readiness Gate

## Overview

The definitive checklist and workflow for declaring a MAD Gambit build production-ready. Covers Vercel deploys, SIWE auth, backend placeholders, TypeScript/Next build health, Foundry tests, screenshot diffs, secret hygiene, and the SESSION_HANDOFF / AUDIT_2026-07-11 / DEPLOYMENT_CHECKLIST items.

## When to Activate

- “production gate”, “SIWE”, “deploy checklist”, “Vercel status”, “audit report”, “tsc”, “next build”, “forge test”, “screenshot-diff”, or any pre-merge / pre-release verification.

## Core Instructions

1. **Authoritative Sources**
   - SESSION_HANDOFF.md (especially §0 preview URLs, §5 OPEN TODOs, §7 workflow)
   - PRODUCTION_READINESS_REPORT.md
   - DEPLOYMENT_CHECKLIST.md
   - AUDIT_2026-07-11.md
   - vercel.json + Vercel project mpp2.23

2. **Gate Checklist (must all pass)**
   - Vercel production (git-main) green
   - No secrets in repo or env exposure
   - SIWE nonce + verify routes working on 42170
   - tsc / next build clean
   - forge test (or documented skip) clean
   - Screenshot-diff of DeviceFrame / cards / key surfaces
   - All BACKEND_PLACEHOLDERS (TRI_AGENT_LLM, ORACLE, PVP, etc.) either implemented or explicitly documented as demo-safe
   - PROFILE_DB / any persistence paths healthy
   - No raw hex debt remaining (or ticketed)
   - Card art pipeline at acceptable completeness
   - Proprietary gate still enforced

3. **Workflow**
   - Prefer Vercel preview builds as the source of truth (local node_modules not always present).
   - Use connected Vercel tools for deployment status.
   - After any change that could affect UI, run screenshot-diff.
   - Coordinate with github-collaboration and vercel-collaboration skills for PR + deploy flow.

4. **Output**
   - Structured gate report: PASS / FAIL / PARTIAL with evidence links.
   - Explicit list of remaining OPEN TODOs from SESSION_HANDOFF.
   - Recommendation: merge / hold / escalate.

## Resources

- references/full-checklist.md — expanded version of the gate.
- references/vercel-preview-urls.md — how to interpret git-main vs immutable deploys.
