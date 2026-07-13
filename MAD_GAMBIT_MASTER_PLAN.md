# MAD Gambit — Plan Index & Canonical Reconciliation

*Entry point that ties the cross-session handoffs to the repo's authoritative plans and the Drive "For Claude" canon. This file adds **no new phases** — it points at the existing plans and records only corrections, so there is one source of truth per topic.*

---

## 1. Authoritative documents (do not duplicate — edit these)

| Topic | Source of truth |
|---|---|
| Full 7-phase build/integration plan | **`MAD_GAMBIT_INTEGRATION_PLAN.md`** (verified ground-truth, Drive dispositions, execution order) |
| Drive-file ledger + "tonight" sequence | **`MADBIT_PRECISION_INTEGRATION_PLAN.md`** |
| Canonical math / tokenomics | Drive **`For Claude/MATH_AND_FORMULAS_REFERENCE.md`** → implemented 1:1 in `verify/lib/gambit-game-math.ts` |
| Card-art generation | Drive **`For Claude/MADHATs_Gambit_AI_Studio_NFT_Brief`** (900+ cards) |
| Architecture / interfaces | `PROJECT.md` |
| Lobby go-live plugins | `verify/README.md` (Game Lobby table) |
| Android companion app | `ANTIGRAVITY_HANDOFF.md` / `ANDROID_*_HANDOFF.md` — **separate app, out of MPP scope** |

The production-wiring backlog is the canonical 8 `BACKEND_PLACEHOLDERS`: **TRI_AGENT_LLM · CARD_ART_PIPELINE · WALLET_NFT_READ · PROFILE_DB · PVP_MATCHMAKING · ORACLE · SAGA_FEED · FEED_EXPANSION**, plus **SIWE enforcement** and **`MADStaking.sol` + Foundry tests**. Full detail lives in `MAD_GAMBIT_INTEGRATION_PLAN.md §5`.

---

## 2. Repo / scope map (the one genuinely new cross-session fact)

| Repo | Role | Reachable this session? |
|---|---|---|
| `MADdegen/MAD-MPP-2.23` | **This repo** — `verify/` (Next.js, Vercel `mpp2.23`) + `contracts/` (Foundry) + the Android companion | ✅ |
| `The-MDC/MADHATs-Gambit-Presentation` | Investor decks (deck-consistency work) | ❌ separate scope |
| `The-MDC/demo-repository`, `The-MDC/MPP-2.0` | Older dev/prod monorepo lineage | ❌ separate scope |

The Refine/XMTP/Lens/Seaport/RudderStack/Superset research and the Prisma/NFT-staking work in those handoffs belong to the **`demo-repository`/`MPP-2.0`** lineage — a different codebase from this Vercel MPP. Not merged here.

---

## 3. Canonical corrections (this repo's ground truth wins over the handoffs)

The cross-session summaries carried figures that conflict with the canonical Drive math and the repo. Corrected values:

- **Rarity — Power Score · Clout Multiplier · Staking APY** (per `MATH_AND_FORMULAS_REFERENCE.md`, *not* the "8/12/20…%" table from the MPP-2.0 handoff):

  | Tier | Power | Clout× | APY |
  |---|--:|--:|--:|
  | Common | 88 | 1.1× | 12% |
  | Uncommon | 256 | 1.8× | 16% |
  | Rare | 488 | 2.4× | 22% |
  | Epic | 1,888 | 3.2× | 31% |
  | Legendary | 4,888 | 5.5× | 48% |
  | Golden Hand | 7,888 | 8.8× | 68% |
  | Mythic | 99,999 | 99.9× | 88% |

  > Note: this per-tier clout curve is the canon — **not** the `M_nft = 1.0 + Clout/200` (1.0–2.0×) formula from the out-of-scope MPP-2.0 staking contract. `MADStaking.sol` here must implement the table above.

- **Fee splits (BPS):** platform **1.88%** (188 BPS); creator **40%** (4000 BPS *of the fee*); community **28.8%** (2880 BPS *of the fee*); MAD Shield insurance recovery **28.8%**, premium **2–4%** of bet.
- **Chain (as built):** **Arbitrum Nova** (launch, chain id `42170`) + **Arbitrum One** (MAD Shield vaults) — per `PROJECT.md`/`foundry.toml`. The decks' "Base L2 / HyperEVM" is aspirational; deck-consistency task = make docs match code (Arbitrum).
- **Seed ask — OPEN, needs Nick's sign-off:** handoffs/`CLAUDE.md` say **$1–2M**; the deck-corrected figure is **$1.24M–$2.48M @ $12M pre**. Do not treat either as settled until reconciled (`MAD_GAMBIT_INTEGRATION_PLAN.md §6.5`).
- **Other canon:** $MADx supply **888,888,888**; VRS Fibonacci `[5,8,13,21,34]`, loss-aversion **2.5×**; streaks 3→1.3× / 5→1.8×+pack / 7→2.4×+Savage / 10+→3.2×+HAT-Trick; tournament 8-tier 40/20/12/5/5/2…; evolution burn C→U 100 / U→R 250 / R→E 500 / E→L 1000 cards.

---

## 4. Vercel (verified from `.vercel/repo.json` + `docs/vercel/mpp-vercel-setup.ps1`)

- Project **`mpp2.23`** · id `prj_4IdDBNaVoeUWutoEGbCc2zyzYpc7` · org `team_TgoOJAiilwZ3I3LPyD2FcNZm` · **root dir `verify`**.
- `verify/next.config.ts` = `output: "standalone"` (Node server, also Cloud Run); `verify/vercel.json` = security headers only.
- **Env vars (Vercel MPP, not the Android/Firebase secrets):** `GOOGLE_API_KEY` (google-genai concierge — note: *not* `GEMINI_API_KEY`), `AUTH_SECRET` (SIWE session), `NEXTAUTH_URL`, `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`, `NEXT_PUBLIC_CHAIN_ID=42170`, `DATABASE_URL` (PROFILE_DB/lobby), plus chosen realtime/storage keys; `ANTHROPIC_API_KEY` optional.
- The `FIREBASE_*` / `GOOGLE_SERVICES_JSON` secrets from the CI/CD handoff belong to the **Android app**, a separate deploy target — keep them out of the Vercel project.

---

## 5. Security

The `MPP-2.0` PAT (`ghp_…`) pasted in a handoff is exposed — **revoke and reissue** as a fine-grained token stored as a secret, never in chat.

---

*Redundancy note: this index intentionally replaces the earlier standalone "master plan" draft, which duplicated the two integration plans with less-accurate figures. Execute from `MAD_GAMBIT_INTEGRATION_PLAN.md`; use this file only for the scope map and the corrected canon above.*
