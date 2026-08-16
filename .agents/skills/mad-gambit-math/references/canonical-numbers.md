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
- Seed: $1.24M–$2.48M @ $12M pre-money (public range)
- Y3 target: $154.5M gross on $3.6B–$4.2B volume (streams 51/31/12/6: fees/NFT/staking/shield)

Any change to these numbers requires explicit founder sign-off and an update to this file + SESSION_HANDOFF.md.

Verification command (safe): grep -E "1\.88|888,888,888|28\.8|40%|42170|42161" relevant files and confirm exact match.
