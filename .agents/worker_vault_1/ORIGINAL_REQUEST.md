## 2026-07-01T15:28:35Z

You are the Smart Contract Developer (teamwork_preview_worker).
Your working directory is: C:\Users\Aaron\.gemini\antigravity\scratch\madgambit\.agents\worker_vault_1
The user's project workspace directory is: C:\Users\Aaron\.gemini\antigravity\scratch\madgambit

Your task is to implement the `MADShieldVault.sol` contract and write a comprehensive suite of Foundry tests to verify it.

Requirements:
1. Create `contracts/src/MADShieldVault.sol` in Solidity `^0.8.24`. The contract should manage MADx staking and shield opt-ins.
2. Implement the following game math functions in Solidity, matching the exact math logic defined in `verify/lib/gambit-game-math.ts`:
   - `calculateShieldReturnWindow(uint256 stakeAmount)`:
     Formula: hours = clamp(2 + floor(stake / 10000) * 2, 2, 24).
     Assume stakeAmount has 18 decimals, so 10000 tokens is represented as 10000 * 10**18.
   - `calculateShieldPremium(uint256 stakeAmount, ShieldTier tier, uint256 premiumTierBps)`:
     If tier is Whale, premium is flat 3% of stake.
     Otherwise (Standard or Shielded), premium scales linearly: premium = stake * (2% + premiumTier * 2%), where premiumTier is represented by premiumTierBps in 0..10,000 (0 = 2%, 10,000 = 4%).
   - `calculateShieldPayoutFull(uint256 stakeAmount, ShieldTier tier, uint256 premiumTierBps)`:
     If tier is Whale, recovery is 60%.
     Otherwise, if premiumTierBps > 0, recovery is 28.8% + premiumTier * (40% - 28.8%), which translates to 28.8% + premiumTier * 11.2%.
     Otherwise, recovery is flat 28.8%.
3. The contract should handle position creation, staking of a token (e.g. an ERC20 token which you can mock), paying the calculated premium, unstake requests (which start the return window cooldown), and claiming/resolving after the cooldown.
4. Implement a whale eligibility mapping (gated by admin/oracle) to restrict the Whale tier.
5. Create a Mock ERC20 token in `contracts/test/MockMADx.sol` for test assertions.
6. Create `contracts/test/MADShieldVault.t.sol` containing comprehensive unit and fuzz tests to verify that:
   - Return window calculation returns exactly the expected hours for various amounts ($100 -> 2h, $5000 -> 2h, $50000 -> 12h, $110000 -> 24h, etc.).
   - Premium calculations match the TypeScript values exactly.
   - Payout calculations match the TypeScript values exactly.
   - Creating a position, requesting unstake, waiting for the cooldown, and claiming works correctly.
   - Ineligible addresses cannot opt-in to the Whale shield tier.
7. Run `forge test` inside the `contracts/` directory and ensure 100% of the tests pass.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Please write a handoff report in C:\Users\Aaron\.gemini\antigravity\scratch\madgambit\.agents\worker_vault_1\handoff.md when you are finished, including passing test results.
