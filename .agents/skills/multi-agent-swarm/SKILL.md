---
name: multi-agent-swarm
description: Use for MAD Gambit multi-agent swarm orchestration including auditor/challenger/worker threads, handoff format, progress.md, BRIEFING.md, and agent roles (auth, vault, gemma, concierge, orchestrator, sentinel, victory_auditor). Trigger on swarm, handoff, agent briefing, challenger, auditor, orchestrator, or any .agents/ work.
---

# Multi-Agent Swarm

## Overview

Provides the complete playbook for operating the MAD Gambit multi-agent swarm under .agents/. Covers role definitions, standard handoff / progress / briefing formats, routing, and continuity across auditor_*, challenger_*, worker_*, orchestrator, sentinel, victory_auditor, and concierge.

## Proprietary Gate

Full agent briefings and internal progress details are gated unless the request is clearly internal and authorized. Use madhatr-concierge as the front door.

## When to Activate

- “swarm”, “handoff”, “agent briefing”, “challenger”, “auditor”, “orchestrator”, “sentinel”, “victory_auditor”, or any work inside .agents/.

## Core Instructions

1. Always start from madhatr-concierge for user-facing requests.
2. Use the exact handoff format defined in madhatr-concierge references.
3. Read existing BRIEFING.md / handoff.md / progress.md before creating new ones.
4. Update progress.md after every significant action.
5. Route according to the agent-routing table (auth for SIWE, vault for Shield, etc.).
6. Never invent agent state; always ground in the repo files.

## Resources

- references/ (see madhatr-concierge for the authoritative templates and routing map)
- Always prefer loading the live .agents/ files via GitHub tools.
