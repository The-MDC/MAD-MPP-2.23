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
