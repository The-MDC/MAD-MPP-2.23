# Agent Routing Map (from .agents/ structure)

| Agent Prefix / Name          | Primary Responsibility                          | When to Route                                      |
|------------------------------|-------------------------------------------------|----------------------------------------------------|
| auditor_*                    | Deep review, security, correctness, audits      | Code review, math verification, contract audits    |
| challenger_*                 | Adversarial testing, edge cases, red-teaming    | Stress-test claims, find holes in thesis/code      |
| worker_*                     | Implementation, coding, file edits              | Write code, implement features, update files       |
| concierge / MADHATr          | User-facing orchestration, brand, continuity    | All external user queries; always start here       |
| orchestrator                 | High-level swarm planning, prioritization       | Multi-agent plans, long-running workstreams        |
| sentinel                     | Monitoring, safety, continuous watch            | Production health, anomaly detection               |
| victory_auditor              | Final sign-off, win conditions, release gates   | Pre-merge / production readiness final check       |
| auth_*                       | SIWE, auth flows, wallet / session keys         | Authentication, SIWE, smart wallet issues          |
| vault_*                      | MAD Shield vaults, staking, recovery            | Shield, vault, tokenomics vault operations         |
| gemma_*                      | Specialized reasoning / model routing           | Complex multi-step reasoning or LLM orchestration  |

Always prefer existing handoff.md / progress.md in the matching .agents/ subdirectory for context before inventing new state.
