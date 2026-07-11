# MAD Gambit — Antigravity Handoff

**For:** Google Antigravity (or manual local setup)
**State as of:** July 1, 2026
**How to use this doc:** Open this folder as a Project in Antigravity. Point an agent at this file first — it's the map. Everything marked ✅ is real, tested, working code. Everything marked ⬜ PLACEHOLDER needs a real value or a real build before deployment.

---

## Folder Map

```
madgambit/
├── verify/          Next.js 15 frontend — the actual game UI
├── ai-backend/      FastAPI + LangChain + Gemini/Gemma — the AI service layer
├── contracts/       Foundry — Solidity smart contracts (Arbitrum Nova launch · One vaults)
└── docker-compose.yml   Orchestrates frontend + ai-backend + postgres
```

## Quick Start

```bash
cp ai-backend/.env.example ai-backend/.env
# Edit ai-backend/.env — at minimum set GOOGLE_API_KEY (get one at
# https://aistudio.google.com/apikey)

docker compose up --build
# frontend    → http://localhost:3000/gambit
# ai-backend  → http://localhost:8001/health
# postgres    → localhost:5432 (user/pass: madgambit/madgambit)
```

**Not runtime-verified** — this session's sandbox had no Docker daemon. YAML syntax is validated, port mappings are cross-checked against both Dockerfiles, and the SQL migration is checked against actual table dependency order — but `docker compose up` itself has not been run end-to-end. First real run should be treated as a smoke test, not assumed clean.

---

## What's Real (✅)

### Frontend (`verify/`)
- Full game UI: cards, packs, tournaments, shield opt-in/out, staking tiers, instrument cluster, MADHAT'r floating widget
- `RARITY_WEAR_PCT` usage-wear table + `RARITY_DROP_WEIGHTS` pack odds — both QA'd with real assertions
- 12 API routes (currently reading/writing in-memory context — see PLACEHOLDER below for the persistence gap)

### AI Backend (`ai-backend/`)
- FastAPI app, boots clean, all 3 routes registered and verified (`/api/v1/concierge/chat`, `/api/v1/ai/satirize`, `/api/v1/ai/zliar`)
- LangChain service wired to Gemini (`ChatGoogleGenerativeAI`), verbatim `GEMINI_SYSTEM_INSTRUCTION` injected per-call, tone/risk directives layered on top without mutating the base persona
- Gemma-first routing for background tasks (satirize, Z-Liar scoring), with automatic Gemini fallback if no Gemma endpoint is set
- Rate limiting, CORS, structured error handling per `backend-patterns` skill
- Postgres schema (`migrations/001_initial_schema.sql`) — 6 tables, indexed, matches the TS engine's data shapes exactly (shield state machine, card wear fields, etc.)

### Contracts (`contracts/`)
- Foundry project initialized, OpenZeppelin installed, `foundry.toml` configured for Arbitrum Nova + Arbitrum One + Arbitrum Sepolia
- `MADCard1155.sol` — Common/Uncommon/Rare/Epic, on-chain durability tracking, wear-oracle role, matches `RARITY_WEAR_PCT` exactly
- `MADCard721.sol` — Legendary/Golden Hand/Mythic, Mythic hard-capped at 1-of-1 on-chain

---

## What's PLACEHOLDER (⬜) — needs real values or real code before deployment

| Item | Where | What's needed |
|---|---|---|
| `GOOGLE_API_KEY` | `ai-backend/.env` | Real Google AI Studio key, or switch to Vertex AI ADC for prod |
| `GEMMA_ENDPOINT_URL` | `ai-backend/.env` | Vertex AI Model Garden deployment, **or** run `ollama run gemma2:9b` locally and point here — Antigravity supports local Ollama natively, this is the fastest path to a real Gemma endpoint |
| `DATABASE_URL` (prod) | `ai-backend/.env` | Real Cloud SQL connection string — local compose default is fine for dev |
| Auth | `migrations/001_initial_schema.sql` bottom note | No SIWE/wallet-signature verification exists yet. `users.wallet_address` is the identity key but nothing checks a signature against it. **Do this before any real money touches the system.** |
| Frontend ↔ backend wiring | `verify/components/madhatr-concierge.tsx` | Still calls its own local canned reply banks, not `ai-backend`'s `/api/v1/concierge/chat`. One `fetch()` call away — the backend contract already matches what the component needs (message/history/tone/risk in, reply out) |
| `MADShieldVault.sol` | `contracts/src/` | Not yet written. Port the exact TS logic from `lib/gambit-game-math.ts`'s `createShieldOptIn`/`requestShieldUnstake`/`calculateShieldPayoutFull` — the math is already proven correct in TS, this is a direct port, not a design task |
| `MADStaking.sol` | `contracts/src/` | Not yet written. `STAKING_TIERS` constant already exists in TS as the source of truth |
| Foundry tests | `contracts/test/` | Zero test files exist yet for `MADCard1155`/`MADCard721` |
| RPC URLs / Arbiscan key | `contracts/foundry.toml` | `${ARBITRUM_ONE_RPC_URL}` / `${ARBISCAN_API_KEY}` — get from Alchemy/Infura + Arbiscan |
| Live presentation deck | `github.com/MADdegen/MADHATs-Gambit-Presentation` | Already fixed this session (naming + seed figure) — no action needed, listed here just so Antigravity doesn't re-touch it by mistake |

---

## Explicit Instructions for the Agent Picking This Up

1. **Don't re-architect what's here.** The stack decisions (Arbitrum Nova launch with Arbitrum One for vaults — founder decision 2026-07-10, no Supabase, LangChain+Gemini/Gemma, Postgres via Cloud SQL) were made deliberately this session, with the user correcting course once already. Build on top of them.
2. **Canonical numbers are locked** — 1.88% platform fee, 28.8% community share, 40% creator share, $1.24M–$2.48M seed raise, MAD Gambit LLC as the legal entity. Don't drift these while implementing.
3. **The wear/drop-rate tables are final math, already approved by the user** — `RARITY_WEAR_PCT` (2%/2%/10%/11.5%/13%/14.5%/16%) and `RARITY_DROP_WEIGHTS` (568/236/120/60/10/6 per 1000). Port them faithfully into Solidity, don't recompute.
4. **`GEMINI_SYSTEM_INSTRUCTION` is verbatim from the recovered `GEMINI.md` source file** — do not paraphrase, shorten, or "clean up" its tone. The design law is explicit: the UI is polished, the AI's voice stays raw.
5. Priority order for finishing the PLACEHOLDER list: auth (money-safety) → `MADShieldVault.sol` + tests → wire concierge to real backend → Gemma endpoint → everything else.

---

## Phase 2 Upgrades & Agent Evolution (The LangGraph Blueprint)

The user has explicitly approved the following **LangGraph state-machine architecture** for the next phase of development. When picking up Phase 2, this is the required architectural path for upgrading the simple bots and scrapers into fully autonomous, reasoning AI agents:

### 1. The "Smart" Agentic Scraper (LangGraph + Gemini 1.5 Pro)
Replace rigid news scrapers with a multi-node reasoning loop:
- **Discovery Node**: Pulls raw viral media, tabloids, crypto news, and polymarket headlines.
- **Reasoning Node (Gemini)**: Reads raw text, extracts core entities, and calculates a highly accurate *Scandal Velocity* and *Z-Liar* score by cross-referencing facts.
- **Vector Node**: Converts finalized intelligence into vector embeddings and stores them in Postgres (`pgvector`) for the trading bots to access.

### 2. The Evolved Copy-Trading Bot (LangGraph)
Basic copy-trading bots are vulnerable to front-running and trap-trades. Phase 2 introduces an "Alpha Filter" state machine:
- **Surveillance Node**: Monitors top-tier Polymarket whales (via the `clob-client`) and specific crypto wallets for sudden movements.
- **Validation Node (Gemini)**: Queries the Postgres vector database to check if real news supports the trade (e.g., *Is this whale buying "Yes" on a scandal because of insider info, or is it a liquidity trap?*).
- **Execution Node**: If the trade passes the AI's strict risk-management and semantic verification, it automatically formats and signs the transaction using the CTF exchange smart contracts.
