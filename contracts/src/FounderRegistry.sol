// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * ═══════════════════════════ PLACEHOLDER ═══════════════════════════
 * FounderRegistry — PLACEHOLDER per Founder instruction (2026-07-07):
 * "Resolve Founder, put placeholders marked as such in for the
 *  Solidity elements for now."
 *
 * UNRESOLVED DECISION (pick one before mainnet):
 *   (A) FOUNDER as AccessControl role holder  → keep FOUNDER_ROLE
 *   (B) FOUNDER as vesting beneficiary        → wire founderVestingBeneficiary
 *       into the token vesting contract's constructor
 * Both slots exist below so either path is a one-line adoption.
 *
 * PLACEHOLDER VALUES — MUST be replaced before any deployment:
 *   - founder:                    address(0)  ← REPLACE
 *   - founderVestingBeneficiary:  address(0)  ← REPLACE
 * Entity context: MAD Gambit LLC (six-entity structure pending final
 * cap-table resolution — see Drive: co-founder agreements).
 * ════════════════════════════════════════════════════════════════════
 */
contract FounderRegistry is AccessControl {
    bytes32 public constant FOUNDER_ROLE = keccak256("FOUNDER_ROLE");

    /// PLACEHOLDER — replace with resolved founder address pre-deploy.
    address public founder = address(0);

    /// PLACEHOLDER — replace if option (B) vesting-beneficiary is chosen.
    address public founderVestingBeneficiary = address(0);

    bool public founderResolved; // stays false until placeholder replaced

    event FounderResolved(address indexed founder, address indexed vestingBeneficiary);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    /// One-shot resolution — callable once by admin when the entity
    /// decision lands. Grants FOUNDER_ROLE and locks the registry.
    function resolveFounder(address founder_, address vestingBeneficiary_)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(!founderResolved, "founder already resolved");
        require(founder_ != address(0), "PLACEHOLDER not resolved: founder=0");
        founder = founder_;
        founderVestingBeneficiary = vestingBeneficiary_ == address(0) ? founder_ : vestingBeneficiary_;
        founderResolved = true;
        _grantRole(FOUNDER_ROLE, founder_);
        emit FounderResolved(founder_, founderVestingBeneficiary);
    }
}
