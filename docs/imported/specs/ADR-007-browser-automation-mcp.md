# ADR-007: Browser Automation MCP — Playwright over Kapture

**Date:** 2026-04-05
**Status:** Accepted
**Author:** Nick (MAD Gambit Founder)

---

## Context

MAD Gambit requires AI-driven browser automation for:
- dApp E2E testing (market creation → position → resolution → payout)
- ERC-4337 AA onboarding flow QA
- Competitor market intelligence (Polymarket, Manifold, Kalshi)
- Live deck validation (`maddegen.github.io/MADHATs-Gambit-Presentation`)

Two candidates were evaluated: **Kapture MCP** and **Microsoft Playwright MCP**.

---

## Decision

**Use `@playwright/mcp` (Microsoft). Reject Kapture.**

---

## Kapture — Rejected (Security Blockers)

| Risk | Severity | Detail |
|------|----------|--------|
| Unauthenticated WebSocket on `:61822` | HIGH | Any localhost process can issue browser commands |
| Wildcard CORS (`Access-Control-Allow-Origin: *`) | HIGH | Drive-by pages can exfiltrate tab content, DOM, screenshots |
| No Origin header validation on WebSocket upgrade | HIGH | Matches CVE-2025-52882 attack class exactly |
| Full Chrome DevTools `debugger` API — no domain scoping | MEDIUM | All network traffic interceptable |
| Solo maintainer, no SECURITY.md, no audit history | MEDIUM | No CVE disclosure process |

Kapture's architecture is identical to CVE-2025-49596 (MCP Inspector localhost breach)
and CVE-2025-52882 (WebSocket auth bypass). Not acceptable on a dev machine with
live wallet connections.

---

## Playwright MCP — Accepted

- Maintained by Microsoft, weekly releases, published SECURITY.md
- Host header validation — prevents DNS rebinding
- `--isolated` flag: no persistent cookies/state between sessions
- `--block-service-workers`: no invisible network interception
- `--allowed-origins` whitelist: hard-scoped to MAD Gambit domains only
- File system access scoped to workspace root by default
- Official Docker image: `mcr.microsoft.com/playwright/mcp`
- Multi-browser: Chromium, Firefox, WebKit

---

## Config

`.mcp.json` (project root, committed to all MDC repos):

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "@playwright/mcp@latest",
        "--browser", "chromium",
        "--isolated",
        "--block-service-workers",
        "--allowed-origins", "https://maddegen.github.io;https://app.madgambit.xyz;http://localhost:*"
      ]
    }
  }
}
```

Also committed to `claude_desktop_config.json` (Windows: `%APPDATA%\Claude/`).

---

## MAD Gambit Use Cases (Priority Order)

1. **dApp E2E testing** — Claude drives full prediction market lifecycle in UI
2. **AA onboarding QA** — ERC-4337 gasless flow across wallet states
3. **Competitor intel** — Structured scraping of Polymarket/Manifold/Kalshi
4. **Live deck validation** — Catch stale numbers on the investor deck
5. **Oracle monitoring** — Read Chainlink/Pyth dashboards for feed health

---

## Consequences

- Any dev cloning an MDC repo gets the Playwright MCP config automatically via Claude Code
- `--isolated` means no credential leakage between test sessions
- Allowed origins must be updated when `app.madgambit.xyz` domain is confirmed
- For production agent workflows (competitor intel pipeline), run in Docker:
  `docker run --rm -i mcr.microsoft.com/playwright/mcp:latest --isolated`

---

## References

- [CVE-2025-49596 — Drive-By Localhost Breach](https://www.docker.com/blog/mpc-horror-stories-cve-2025-49596-local-host-breach/)
- [CVE-2025-52882 — WebSocket Auth Bypass](https://securitylabs.datadoghq.com/articles/claude-mcp-cve-2025-52882/)
- [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp)
- [Playwright MCP Security Guide](https://www.mintlify.com/microsoft/playwright-mcp/guides/security)
