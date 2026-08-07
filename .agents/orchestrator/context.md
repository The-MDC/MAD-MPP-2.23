# Context — MAD Gambit Orchestrator

## Project Setup
- Root: `C:\Users\Aaron\.gemini\antigravity\scratch\madgambit`
- Frontend: `verify/` (Next.js 15)
- Backend: `ai-backend/` (FastAPI + LangChain + Uvicorn)
- Contracts: `contracts/` (Foundry + Solidity)

## Environment & Configuration
- Database: Postgres via local container (`postgresql://madgambit:madgambit@localhost:5432/madgambit`)
- API Key: `GOOGLE_API_KEY` (configured in `.env` inside `ai-backend/`)
- Gemma Endpoint: `GEMMA_ENDPOINT_URL` (to be configured, fallback to Gemini)

## Important Links & Docs
- `ANTIGRAVITY_HANDOFF.md` — Source of truth map
- `verify/lib/gambit-game-math.ts` — Game math definitions (locked constants)
