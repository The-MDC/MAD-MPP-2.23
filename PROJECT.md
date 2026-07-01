# Project: MAD Gambit

## Architecture
- Frontend: Next.js 15, React, Tailwind CSS
- AI Backend: FastAPI, LangChain, Google Gemini/Gemma models
- Database: PostgreSQL (Cloud SQL in production, local Docker-compose in development)
- Smart Contracts: Solidity, Foundry (Arbitrum One deployment)

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | SIWE Auth | Wallet authentication & Postgres identity integration | None | DONE |
| 2 | MADShieldVault.sol | Port TS math to Solidity & write Foundry tests | None | DONE |
| 3 | AI Concierge Wiring | Wire frontend concierge component to FastAPI chat endpoint | M1 | DONE |
| 4 | Gemma Endpoint | Configure and verify local Gemma model endpoint | None | DONE |

## Interface Contracts
### Frontend ↔ AI Backend
- SIWE:
  - `GET /api/v1/auth/nonce` -> returns secure random nonce
  - `POST /api/v1/auth/verify` -> payload: `{ message, signature }`, returns JWT token and wallet address
- AI Concierge:
  - `POST /api/v1/concierge/chat` -> payload: `{ message, history, tone, risk, regen_count }`, returns `{ reply, tone, risk }`

## Code Layout
- `verify/` - Next.js frontend
- `ai-backend/` - FastAPI backend
- `contracts/` - Foundry contracts project
