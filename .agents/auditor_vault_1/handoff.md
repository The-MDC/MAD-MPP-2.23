# Forensic Audit Report & Handoff

**Work Product**: `MADShieldVault.sol` contract and its test suite `MADShieldVault.t.sol` in `contracts/`
**Profile**: General Project (Solidity)
**Verdict**: CLEAN

---

## 1. Observation

An audit of the `MADShieldVault.sol` implementation, the `MADShieldVault.t.sol` test suite, and the reference math in `verify/lib/gambit-game-math.ts` was performed.

### Source Files Inspected:
- **Solidity Contract**: `C:\Users\Aaron\.gemini\antigravity\scratch\madgambit\contracts\src\MADShieldVault.sol`
- **Foundry Test Suite**: `C:\Users\Aaron\.gemini\antigravity\scratch\madgambit\contracts\test\MADShieldVault.t.sol`
- **TypeScript Game Math**: `C:\Users\Aaron\.gemini\antigravity\scratch\madgambit\verify\lib\gambit-game-math.ts`

### Findings:
1. **No Cheating or Facades**:
   - `MADShieldVault.sol` is a fully functional smart contract implementation. It contains no hardcoded test results, facade shortcuts, or bypasses.
   - `MADShieldVault.t.sol` implements real unit and fuzz tests checking edge cases against the contract's actual functions.
2. **Mathematical Authenticity**:
   - The three mathematical calculations (return window cooldown, premium rate, and shield recovery payout) have been ported correctly from the TypeScript library to Solidity integer math (assuming a token with 18 decimals).
3. **Security and Lifecycle Vulnerabilities**:
   - **🔴 CRITICAL: Locked Contract Funds / Lack of Withdraw Function**: The contract collects premiums in `stake()` and retains the unrecovered portion of stakes in `resolveLoss()`. However, the contract lacks any function (such as `withdraw()` or `sweep()`) allowing the owner or admin to withdraw these accumulated fees and surplus tokens. All premiums paid by users are permanently locked inside the contract.
   - **🟡 MEDIUM: Redundant Staking Tier Logic**: In `stake()`, users pass a `ShieldTier` (Standard, Shielded, or Whale) and `premiumTierBps`. For standard/shielded tiers, `calculateShieldPremium()` and `calculateShieldPayoutFull()` determine rates solely based on `premiumTierBps` (checking `safeBps > 0` to apply the shielded calculation). There is no check preventing a user from choosing `ShieldTier.Standard` but passing `premiumTierBps > 0` (which applies the shielded premium and payout rates). While mathematically sound, this makes the `ShieldTier` parameter redundant and confusing.
   - **🟢 LOW: Redundant safeBps Check**: In `calculateShieldPayoutFull()`, `safeBps > 0` is checked. If it is 0, the contract returns `(stakeAmount * 288) / 1000`. If it is > 0, it evaluates `(stakeAmount * (2880000 + safeBps * 112)) / 10000000`. When `safeBps = 0`, the latter formula evaluates to the exact same value. The check is harmless but redundant.

---

## 2. Logic Chain

### Math Porting Verification:
1. **Return Window Cooldown**:
   - **TypeScript**: `2 + Math.floor(stake / 10_000) * 2` clamped between 2 and 24 hours.
   - **Solidity**: `2 + (stakeAmount / (10000 * 1e18)) * 2` clamped between 2 and 24 hours.
   - Since `stakeAmount` is represented in 18 decimals (`1e18`), dividing by `10000 * 1e18` yields `stakeAmount / 10000` in whole tokens, matching the TypeScript logic exactly.
2. **Premium Calculation**:
   - **TypeScript**: Whale tier is flat 3% of stake. Standard/Shielded scales from 2% (premiumTier = 0) to 4% (premiumTier = 1).
   - **Solidity**: Whale tier returns `(stakeAmount * 3) / 100`. Standard/Shielded returns `(stakeAmount * (20000 + safeBps * 2)) / 1000000` (where `safeBps` is clamped to 10000).
   - At `safeBps = 0`: premium is `20000 / 1000000 = 2%`.
   - At `safeBps = 10000`: premium is `(20000 + 20000) / 1000000 = 4%`.
   - At `safeBps = 5000`: premium is `(20000 + 10000) / 1000000 = 3%`.
   - This represents a 1:1 port of the TypeScript linear interpolation.
3. **Payout Calculation**:
   - **TypeScript**: Whale tier is flat 60% of stake. Standard is 28.8% of stake. Shielded scales from 28.8% to 40% of stake based on `premiumTier`.
   - **Solidity**: Whale tier returns `(stakeAmount * 60) / 100`. Standard (when `safeBps == 0`) returns `(stakeAmount * 288) / 1000` (28.8%). Shielded returns `(stakeAmount * (2880000 + safeBps * 112)) / 10000000` (where `safeBps` is clamped to 10000).
   - At `safeBps = 10000`: payout is `(2880000 + 1120000) / 10000000 = 40%`.
   - At `safeBps = 5000`: payout is `(2880000 + 560000) / 10000000 = 34.4%`.
   - This represents a 1:1 port of the TypeScript linear interpolation.

### Staking Lifecycle Verification:
1. **Reentrancy**:
   - In both `claim()` and `resolveLoss()`, state modifications (`pos.isActive = false`, `pos.isClaimed = true`) are executed *before* the external token transfer:
     ```solidity
     pos.isActive = false;
     pos.isClaimed = true;
     token.transfer(msg.sender, pos.stakeAmount);
     ```
   - This strictly adheres to the Checks-Effects-Interactions pattern, preventing reentrancy attacks.
2. **Access Control**:
   - `resolveLoss()` and `setWhaleEligibility()` are gated with `onlyOwner`.
   - `requestUnstake()` and `claim()` retrieve positions using `positions[msg.sender][positionId]`, preventing users from acting on other users' positions.
3. **Fund Locks**:
   - Inspecting all functions in `MADShieldVault.sol` shows that the only token transfer statements are in `claim()` and `resolveLoss()`. There are no withdrawal functions for the owner to retrieve accumulated user premiums or the remaining portion of stakes from resolved losses. Thus, funds are permanently trapped.

---

## 3. Caveats

- Due to sandbox permission constraints, terminal execution (`forge test`) was not approved by the system within the timeout limit. All findings are derived through rigorous static analysis of the Solidity source code and test files.
- The audit assumes that the `token` passed to the constructor is a standard ERC-20 contract (like `MockMADx.sol`) that reverts on transfer failures. If a non-reverting token (e.g. USDT) is used, standard `transfer` and `transferFrom` calls should be replaced with `SafeERC20` wrapper functions.

---

## 4. Conclusion

The smart contract `MADShieldVault.sol` implements the target math authentically and contains no integrity violations (facades or cheats). However, it contains a **critical security defect**: the lack of a withdrawal function locks all accumulated fees (premiums) and surplus funds inside the contract forever. 

**Verdict**: **CLEAN** (with respect to integrity), but **BLOCKED** for production release until the locked funds issue is resolved.

---

## 5. Verification Method

To verify the test suite locally, run the following Foundry command:
```bash
cd contracts
forge test -vvv
```

To verify the lack of a withdrawal function:
1. Open `contracts/src/MADShieldVault.sol`.
2. Inspect the file for any occurrence of the `transfer` or `transferFrom` methods that direct tokens to the owner or a protocol treasury address.
3. Confirm that no such functions exist.
