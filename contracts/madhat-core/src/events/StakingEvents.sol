// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title StakingEvents
 * @dev Events for StakingVault.sol
 */
interface StakingEvents {
    event StakeDeposited(address indexed user, uint256 amount, uint256 lockDuration);
    event YieldClaimed(address indexed user, uint256 yieldAmount);
    event NFTCloutEquipped(address indexed user, uint256 tokenId, uint8 clout);
}