---
name: solidity-foundry-security
description: Use for auditing, testing, fuzzing, and securing MAD Gambit Foundry contracts including MADCard1155/721, MADShieldVault, MADStaking, P2PEscrow, SessionKeyManager, MarketFactory, DutchAuction. Trigger on audit contract, Foundry test, fuzz, Slither, MADShieldVault, Arbitrum Nova/One, UUPS, reentrancy, RolesRegistry, or any smart-contract security work. Strict proprietary gate applies to full source.
---

# Solidity Foundry Security (MAD Gambit Contracts)

## Overview

Expert workflows for reviewing, testing, fuzzing, and hardening the MAD Gambit smart-contract suite. Covers Foundry (forge, cast, anvil), OpenZeppelin patterns, UUPS upgradeability, reentrancy, access control (RolesRegistry), and Arbitrum Nova/One deployment considerations. Full source remains under proprietary gate.

## Proprietary Information Protection Rule (MANDATORY)

NEVER output full Solidity source, complete function bodies, or detailed internal logic of MADCard*, MADShieldVault, MADStaking, P2PEscrow, SessionKeyManager, MarketFactory, DutchAuction, BondingCurve, EvolutionEngine, GambitAMM or any other proprietary contract unless explicitly authorized by @MADdegen in the current session.

High-level architecture, public interfaces, test strategies, and security checklists are allowed. When full source is needed, gate it.

## When to Activate

- “audit contract”, “Foundry test”, “fuzz”, “Slither”, “MADShieldVault”, “Arbitrum Nova/One”, “UUPS”, “reentrancy”, “RolesRegistry”, “forge build”, “contract security”, or any request involving the contracts/ tree or cross-repo MarketFactory/DutchAuction.

## Core Instructions

1. **Gate check first.** Confirm whether the request needs full source. If yes, apply proprietary response and escalate.

2. **Contract Inventory (high-level)**
   - Core game: MADCard1155 / MADCard721, related NFT logic.
   - Economics: MADShieldVault (opt-in loss mitigation vaults), MADStaking, fee/treasury splits.
   - Utility: P2PEscrow, SessionKeyManager, RolesRegistry.
   - Markets: MarketFactory, DutchAuction, BondingCurve (DL-LMSR high-level), EvolutionEngine, GambitAMM (some live in cross-repo The-MDC/demo-repository).
   - Always check SESSION_HANDOFF.md §6 for current cross-repo status.

3. **Foundry Workflow**
   - Prefer existing foundry.toml, remappings, and Deploy*.s.sol scripts.
   - Standard commands (safe to recommend): forge build, forge test -vvv, forge test --match-contract <Name> --fuzz-runs 10000, forge coverage, forge snapshot, slither .
   - For Arbitrum: use correct chain IDs (42170 Nova, 42161 One).

4. **Security Checklist (always run)**
   - Reentrancy: CEI + ReentrancyGuard
   - Access control: RolesRegistry / least privilege
   - Upgradeability: UUPS, storage gaps, initializer protection
   - Arithmetic: 0.8+ checked math; fee/vault invariants
   - Fuzz + invariant tests for pricing, fee splits, vault accounting
   - Static analysis: Slither clean or documented exceptions

5. **Testing Strategy**
   - Unit + fuzz + invariant tests
   - Coverage >90% core, 100% vault/fee
   - Coordinate with mad-gambit-math for public constant consistency and madhatr-concierge for gate + handoff.

6. **Output Format**
   - Proprietary gate status.
   - Findings by severity.
   - Recommended forge commands and test files.
   - Never paste full contract source.

## Resources

- references/foundry-security-checklist.md
- references/arbitrum-deployment-notes.md
- See SUPERGROK_GUARDRAILS_AND_SKILLS.md for full pack.
