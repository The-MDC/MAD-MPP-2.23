# SuperGrok Skills for MAD Gambit

**Installed & fully expanded 2026-07-14** by SuperGrok skill-creator session.

## Absolute Guardrails
See [../SUPERGROK_GUARDRAILS_AND_SKILLS.md](../SUPERGROK_GUARDRAILS_AND_SKILLS.md) for the non-overridable proprietary rule, language gate, brand gate, and locked canonical numbers.

## Skills (all SKILL.md fully expanded)

### P0 (Critical)
- [mad-gambit-concierge](mad-gambit-concierge/SKILL.md) — Primary orchestrator + IP protector
- [mad-gambit-math](mad-gambit-math/SKILL.md) — Math verification + public numbers only
- [solidity-foundry-security](solidity-foundry-security/SKILL.md) — Contract audits, Foundry, fuzz

### P1
- [dopamine-ui-design-system](dopamine-ui-design-system/SKILL.md) — SKIN_TOKENS, DeviceFrame, no raw hex, original logo
- [nft-card-pipeline](nft-card-pipeline/SKILL.md) — Card art serial tiling, rarity holograms, gen-card-art
- [mad-shield-tokenomics](mad-shield-tokenomics/SKILL.md) — Opt-in loss mitigation language + economics (never "insurance")

### P2
- [multi-agent-swarm](multi-agent-swarm/SKILL.md) — .agents/ handoff, briefing, progress, routing
- [production-readiness-gate](production-readiness-gate/SKILL.md) — Vercel, SIWE, tsc, forge, screenshot-diff, deploy checklist
- [scandal-corpus-graphrag](scandal-corpus-graphrag/SKILL.md) — GDELT/GossipCop/GraphRAG, Z-Liar, satire engine

### P3
- [whitepaper-pr-gtm](whitepaper-pr-gtm/SKILL.md) — Institutional whitepaper, pitch, GTM, DataHouse, concise tone
- [brand-enforcer](brand-enforcer/SKILL.md) — Original assets only, neon satire, MADG VENTURES lock

## How SuperGrok Loads Them
1. Read SUPERGROK_GUARDRAILS_AND_SKILLS.md first.
2. Match description → load .agents/skills/<name>/SKILL.md (or the equivalent user skill).
3. Always enforce proprietary gate + language gate + brand gate.
4. Front-door every user query through mad-gambit-concierge.

## Source
Live SuperGrok user skills live in the agent's /home/workdir/.grok/skills/ (persisted). This repo copy makes them available to the entire swarm and any Antigravity / SuperManus / Claude session that opens the project.

**Guardrails first. Always.**
