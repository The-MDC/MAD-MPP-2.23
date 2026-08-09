# Original User Request

## Initial Request — 2026-07-01T15:06:01Z

Complete all remaining tasks for the MAD Gambit full-stack application (SIWE Auth, `MADShieldVault.sol`, AI Backend wiring) strictly according to the priorities and constants defined in `ANTIGRAVITY_HANDOFF.md` to prepare it for live production deployment today.

Working directory: `C:\Users\Aaron\.gemini\antigravity\scratch\madgambit`
Integrity mode: development

## Verification Resources
- `ANTIGRAVITY_HANDOFF.md` (Source of Truth)
- Local Google Drive "for claude" files (Build Elements)
- GitHub Repo: `mad-mpp` (v2.23) as supplementary reference (Note: agent will need user to provide access to the repo or local files if not already downloaded).

## Requirements

### R1. Implement Core Systems
Execute the PLACEHOLDER checklist from `ANTIGRAVITY_HANDOFF.md` in strict priority order: 1) Wallet Auth verification (SIWE), 2) `MADShieldVault.sol` + tests, 3) Wire frontend concierge to backend, 4) Configure local Gemma endpoint.

### R2. Strict Adherence to Constants
Retain all mathematical constants (`RARITY_WEAR_PCT`, drop weights, fees) and the raw `GEMINI_SYSTEM_INSTRUCTION` exactly as written in the source files. Do not paraphrase or re-architect.

### R3. Utilize Provided References
Reference the "for claude" build element files and the `mad-mpp` (v2.23) repository for architectural guidelines and implementation details. Treat the local handoff and readme docs as the absolute source of truth.

## Acceptance Criteria

### Auth & Security
- [ ] A programmatic test script successfully verifies that an invalid wallet signature is rejected by the backend when attempting to write to the Postgres database.
- [ ] A programmatic test script successfully verifies that a valid SIWE signature grants access.

### Smart Contracts
- [ ] Running `forge test` inside the `contracts/` directory returns 100% passing tests for the newly written `MADShieldVault.sol` contract, verifying the exact math logic defined in `lib/gambit-game-math.ts`.

### AI Backend Wiring
- [ ] A curl command or test script successfully sends a mock payload to the frontend concierge API and receives a valid LangChain/Gemini response from the backend.
