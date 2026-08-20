# Locked Public Canonical Numbers (Source of Truth)

Extracted and verified from SESSION_HANDOFF.md §1, MAD_GAMBIT_INTEGRATION_PLAN.md, and public constants in gambit-game-math.ts.

These are the **only** numbers that may ever be stated freely. Everything else is proprietary and gated.

- Platform fee: 1.88% (188 bps)
- Fee split of the 1.88%:
  - Creator: 40%
  - Community: 28.8%
  - MAD Shield recovery: 28.8%
- MAD Shield premium range (opt-in loss mitigation): 2–4%
- $MADx total supply: 888,888,888
- Primary gameplay chain: Arbitrum Nova (chain ID 42170)
- MAD Shield vaults + $MADx chain: Arbitrum One (chain ID 42161)
- Secondary venue: HyperLiquid (HyperEVM) — distribution/liquidity only, never the canonical record
- Testnet: Arbitrum Sepolia (chain ID 421614)
- Chain story locked by founder sign-off August 2026; see docs/MAD_GAMBIT_MASTER.md Part VI §13 item 4
- LLC jurisdiction: New Mexico (filed)
- Seed: $1.24M–$2.48M @ $12M pre-money (public range), 10% token allocation
- Infrastructure tranche: $15K–$20K · Bridge: $300K–$500K (keep separate from the seed)
- Y3 target: **$139.6M gross, base case** on $3.6B–$4.2B volume (revised 2026-08-19 from the
  published data room; $177.7M is BULL CASE ONLY and must never be the headline. Prior value
  $154.5M retired.) ⚠️ The 51/31/12/6 stream split was derived from the retired $154.5M model and
  is UNRECONCILED — re-run before use. See docs/boardy/CANONICAL_NUMBERS_2026-08-19.md

⚠️ STAKING TIERS ARE IN CONFLICT: STAKING_TIERS in gambit-game-math.ts (6 tiers, 100/500/2,500/
10,000/50,000/100,000 at 12/18/28/42/58/68%) does NOT match the data room (4 tiers, 88/888/8,888/
88,888 at 8.8/18.8/28.8/38.8%). Treat as CONCEPTUAL; do not pitch staking yields until resolved.

⚠️ A second, incompatible fee model is deployed elsewhere: a "1.888% RATE" schedule splitting
burn 0.888% / staking 0.500% / protect 0.500%, with no creator share. Canon is 1.88% split
creator 40% / community 28.8% / shield 28.8%. Locate and reconcile (likely Vercel project
datahouse_mathsengine or o-v_deck26).

Any change to these numbers requires explicit founder sign-off and an update to this file + SESSION_HANDOFF.md.

Verification command (safe): grep -E "1\.88|888,888,888|28\.8|40%|42170|42161" relevant files and confirm exact match.
