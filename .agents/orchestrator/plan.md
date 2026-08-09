# Plan — MAD Gambit Completion

This plan outlines the orchestration strategy for completing all remaining tasks for MAD Gambit: SIWE Auth, `MADShieldVault.sol`, AI Backend wiring, and Gemma Configuration.

## Milestones

1. **Milestone 1: Wallet Auth Verification (SIWE)**
   - Implement database connection in `ai-backend` to verify user and handle token generation.
   - Set up API routes to write to Postgres database.
   - Create a programmatic test script verifying that invalid signatures are rejected, and valid signatures are accepted.
   - Verification: Execution of test script with expected exit code 0.

2. **Milestone 2: MADShieldVault.sol + Foundry Tests**
   - Port the TypeScript math from `verify/lib/gambit-game-math.ts` to `contracts/src/MADShieldVault.sol`.
   - Write Foundry tests in `contracts/test/MADShieldVault.t.sol` to verify the math logic matches exactly.
   - Run `forge test` inside `contracts/` and ensure 100% passing tests.
   - Verification: Output of `forge test`.

3. **Milestone 3: AI Backend Wiring & Concierge Integration**
   - Wire `verify/components/madhatr-concierge.tsx` to communicate with the FastAPI backend `/api/v1/concierge/chat` instead of using local replies.
   - Ensure the LangChain/Gemini service returns valid responses.
   - Verification: Integration test using curl or test script.

4. **Milestone 4: Local Gemma Endpoint Configuration**
   - Configure local Gemma endpoint (`gemma2:9b` via Ollama) and verify routing.
   - Verification: `/health` check on FastAPI backend showing gemma_configured = true.

5. **Victory Audit Prep**
   - Run full validation checks.
   - Notify Sentinel to trigger the Victory Audit.

## Decomposition Strategy
- We will spawn a worker for each milestone.
- We will spawn reviewers/challengers to verify each milestone.
- We will spawn a Forensic Auditor for integrity verification.
