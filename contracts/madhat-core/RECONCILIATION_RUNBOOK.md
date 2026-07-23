# madhat-core → MAD-MPP Reconciliation Runbook

Turnkey steps to make the pulled `contracts/madhat-core/` compile, integrate, and test.

> **Why a runbook:** `forge` is not available in the Claude-on-web session (foundry.paradigm.xyz is network-blocked by the environment policy), so the compile-dependent work runs in a Foundry environment — Cursor or local, per the plan's tool assignment. Nothing below was compiled here; the two fixes marked ✅ are correct-by-inspection text fixes already committed.

## 0. Toolchain
```bash
curl -L https://foundry.paradigm.xyz | bash && foundryup
```

## 1. Install dependencies (from `contracts/madhat-core/`)
`remappings.txt` already references these; install then verify the paths:
```bash
forge install OpenZeppelin/openzeppelin-contracts-upgradeable --no-commit
forge install abdk-consulting/abdk-libraries-solidity --no-commit
forge install smartcontractkit/chainlink-brownie-contracts --no-commit
```

## 2. Fixes already applied in-repo ✅
- `src/errors/Errors.sol` — brace bug fixed: the DutchAuction + MarketFactory error set is now **inside** the `library Errors {}` (was declared after the closing brace).
- `src/prediction/game.sol` — `PLATFORM_FEE 25 → 188` (0.25% → canonical **1.88%**).

## 3. Fixes to apply with compile feedback
- **Pragma:** madhat-core is `^0.8.28`, app `contracts/src` is `0.8.24`. Recommend bumping the app: `contracts/foundry.toml` `solc_version 0.8.24 → 0.8.28`. Confirm the app's existing contracts still build.
- **`game.sol`:** replace raw `token.transfer()/transferFrom()` with OpenZeppelin `SafeERC20` (`using SafeERC20 for IERC20;`) — flagged in `SECURITY_AUDIT_LOG.md`.
- **`staking/StakingPool.sol`:** point the staking token to **$MADx** (not `MADDEX`); confirm APY tiers = **8.8 / 18.8 / 28.8 / 68%**.
- **`tokens/MADxToken.sol`:** deploy supply **888,888,888**; confirm the canonical address on-chain — `DEPLOYED_ADDRESSES.md` = `0xb61ae7727579e3781ca0ec4902b6ba21d335fd18`; the `0x6972…` in the header comment is a different/legacy record — correct the comment once verified.
- **Naming:** `Madhat*` → `MAD*` (`MadhatCard`→`MADCard*`, `MadhatTreasury`→`MADTreasury`) + update imports, deploy script, and tests together (rename with compile feedback to catch every reference).

## 4. Rebuild the lost contracts (on `BondingCurve.sol` + the `Errors.sol` error sets)
The error types already exist in `Errors.sol`; blueprints in `README_REFACTORING.md` + `docs/imported/specs/evm-implementation-guide-arbitrum.md`.
- `src/prediction/MarketFactory.sol` — market creation, 40% creator split, prices via `BondingCurve`.
- `src/prediction/DutchAuction.sol` — descending pack price (per `MATH_AND_FORMULAS_REFERENCE`: 0.5 → 0.05 ETH floor).
- (optional) `EvolutionEngine.sol`, `GambitAMM.sol` per `README_REFACTORING.md`.

## 5. Build + test
```bash
forge build
forge test -vvv     # test/ covers StakingPool / Prediction / RiskOracle / Treasury / AssetsRegistry / MADDEX
```
Skip `test-bad-code/` (deprecated per the audit log).

## 6. Canonical-source decision (founder)
Consolidate `madhat-core` with the app's `contracts/src` (`MADCard1155/721`, `MADShieldVault`, `FounderRegistry`) into one Foundry project, or keep them as two. `MADDEXToken` (100M supply) is a **distinct legacy token** — do not merge it into `$MADx` (888,888,888).
