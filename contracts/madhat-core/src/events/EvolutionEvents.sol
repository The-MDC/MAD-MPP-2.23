// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title EvolutionEvents
 * @dev Events for EvolutionEngine.sol (VRF + BuzzScore logic)
 */
interface EvolutionEvents {
    event EvolutionRequested(
        address indexed user,
        uint256[] inputTokenIds,
        uint256 feePaid
    );
    event EvolutionSuccess(
        address indexed user,
        uint256 oldTokenId,
        uint256 newTokenId,
        uint8 newTier
    );
    event EvolutionFailed(
        address indexed user,
        uint256[] burnedTokenIds,
        uint256 nearMissDelta // e.g., 12 = failed by 12%
    );
    event VRFRequestFulfilled(bytes32 indexed requestId, uint256 randomness);
}