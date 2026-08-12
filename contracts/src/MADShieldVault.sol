// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract MADShieldVault is Ownable {
    using SafeERC20 for IERC20;

    enum ShieldTier { Standard, Shielded, Whale }

    struct Position {
        uint256 stakeAmount;
        ShieldTier tier;
        uint256 premiumTierBps;
        uint256 premiumPaid;
        uint256 stakedAt;
        uint256 unstakeRequestedAt;
        uint256 estimatedReturnAt;
        bool isActive;
        bool isUnstaking;
        bool isClaimed;
    }

    IERC20 public immutable token;

    // Mapping from user to their positions
    mapping(address => Position[]) public positions;

    // Whale eligibility mapping
    mapping(address => bool) public isWhaleEligible;

    event Staked(
        address indexed user,
        uint256 indexed positionId,
        uint256 amount,
        ShieldTier tier,
        uint256 premiumPaid
    );
    event UnstakeRequested(
        address indexed user,
        uint256 indexed positionId,
        uint256 returnWindowHours,
        uint256 estimatedReturnAt
    );
    event Claimed(
        address indexed user,
        uint256 indexed positionId,
        uint256 amount
    );
    event LossResolved(
        address indexed user,
        uint256 indexed positionId,
        uint256 payoutAmount,
        uint256 lostAmount
    );
    event WhaleEligibilityUpdated(address indexed user, bool eligible);

    constructor(address _token) Ownable(msg.sender) {
        require(_token != address(0), "Invalid token address");
        token = IERC20(_token);
    }

    /**
     * @notice Sets the whale eligibility for a user.
     * @param user The address of the user.
     * @param eligible Boolean indicating whale eligibility.
     */
    function setWhaleEligibility(address user, bool eligible) external onlyOwner {
        isWhaleEligible[user] = eligible;
        emit WhaleEligibilityUpdated(user, eligible);
    }

    /**
     * @notice Stakes tokens and opts into a shield tier.
     * @param stakeAmount The amount of tokens to stake.
     * @param tier The shield tier chosen (Standard, Shielded, or Whale).
     * @param premiumTierBps The premium tier in basis points (0..10,000).
     */
    function stake(
        uint256 stakeAmount,
        ShieldTier tier,
        uint256 premiumTierBps
    ) external returns (uint256 positionId) {
        require(stakeAmount > 0, "Cannot stake 0");
        if (tier == ShieldTier.Whale) {
            require(isWhaleEligible[msg.sender], "Not eligible for Whale tier");
        }

        uint256 premium = calculateShieldPremium(stakeAmount, tier, premiumTierBps);
        uint256 totalRequired = stakeAmount + premium;

        // Transfer stake + premium from user
        token.safeTransferFrom(msg.sender, address(this), totalRequired);

        positionId = positions[msg.sender].length;
        positions[msg.sender].push(Position({
            stakeAmount: stakeAmount,
            tier: tier,
            premiumTierBps: premiumTierBps,
            premiumPaid: premium,
            stakedAt: block.timestamp,
            unstakeRequestedAt: 0,
            estimatedReturnAt: 0,
            isActive: true,
            isUnstaking: false,
            isClaimed: false
        }));

        emit Staked(msg.sender, positionId, stakeAmount, tier, premium);
    }

    /**
     * @notice Requests to unstake, starting the return window cooldown.
     * @param positionId The ID of the position to unstake.
     */
    function requestUnstake(uint256 positionId) external {
        require(positionId < positions[msg.sender].length, "Invalid position ID");
        Position storage pos = positions[msg.sender][positionId];
        require(pos.isActive, "Position is not active");
        require(!pos.isUnstaking, "Already unstaking");
        require(!pos.isClaimed, "Already claimed");

        uint256 windowHours = calculateShieldReturnWindow(pos.stakeAmount);
        uint256 estimatedReturnAt = block.timestamp + windowHours * 1 hours;

        pos.isUnstaking = true;
        pos.unstakeRequestedAt = block.timestamp;
        pos.estimatedReturnAt = estimatedReturnAt;

        emit UnstakeRequested(msg.sender, positionId, windowHours, estimatedReturnAt);
    }

    /**
     * @notice Claims the staked amount after the cooldown window.
     * @param positionId The ID of the position to claim.
     */
    function claim(uint256 positionId) external {
        require(positionId < positions[msg.sender].length, "Invalid position ID");
        Position storage pos = positions[msg.sender][positionId];
        require(pos.isActive, "Position is not active");
        require(pos.isUnstaking, "Unstake not requested");
        require(!pos.isClaimed, "Already claimed");
        require(block.timestamp >= pos.estimatedReturnAt, "Cooldown not finished");

        pos.isActive = false;
        pos.isClaimed = true;

        token.safeTransfer(msg.sender, pos.stakeAmount);

        emit Claimed(msg.sender, positionId, pos.stakeAmount);
    }

    /**
     * @notice Resolves a loss on an active position (gated by admin/owner).
     * @param user The address of the position owner.
     * @param positionId The ID of the position.
     */
    function resolveLoss(address user, uint256 positionId) external onlyOwner {
        require(positionId < positions[user].length, "Invalid position ID");
        Position storage pos = positions[user][positionId];
        require(pos.isActive, "Position is not active");
        require(!pos.isUnstaking, "Position is unstaking");
        require(!pos.isClaimed, "Already claimed");

        uint256 payout = calculateShieldPayoutFull(pos.stakeAmount, pos.tier, pos.premiumTierBps);

        pos.isActive = false;
        pos.isClaimed = true;

        token.safeTransfer(user, payout);

        emit LossResolved(user, positionId, payout, pos.stakeAmount - payout);
    }

    /**
     * @notice Calculates the return window cooldown in hours.
     * @param stakeAmount The stake amount.
     */
    function calculateShieldReturnWindow(uint256 stakeAmount) public pure returns (uint256) {
        uint256 hoursCount = 2 + (stakeAmount / (10000 * 1e18)) * 2;
        if (hoursCount < 2) {
            return 2;
        }
        if (hoursCount > 24) {
            return 24;
        }
        return hoursCount;
    }

    /**
     * @notice Calculates the shield premium.
     * @param stakeAmount The stake amount.
     * @param tier The shield tier.
     * @param premiumTierBps Premium tier in basis points (0..10,000).
     */
    function calculateShieldPremium(
        uint256 stakeAmount,
        ShieldTier tier,
        uint256 premiumTierBps
    ) public pure returns (uint256) {
        if (tier == ShieldTier.Whale) {
            return (stakeAmount * 3) / 100;
        }
        uint256 safeBps = premiumTierBps > 10000 ? 10000 : premiumTierBps;
        return (stakeAmount * (20000 + safeBps * 2)) / 1000000;
    }

    /**
     * @notice Calculates the shield recovery payout.
     * @param stakeAmount The stake amount.
     * @param tier The shield tier.
     * @param premiumTierBps Premium tier in basis points (0..10,000).
     */
    function calculateShieldPayoutFull(
        uint256 stakeAmount,
        ShieldTier tier,
        uint256 premiumTierBps
    ) public pure returns (uint256) {
        if (tier == ShieldTier.Whale) {
            return (stakeAmount * 60) / 100;
        }
        uint256 safeBps = premiumTierBps > 10000 ? 10000 : premiumTierBps;
        if (safeBps > 0) {
            return (stakeAmount * (2880000 + safeBps * 112)) / 10000000;
        }
        return (stakeAmount * 288) / 1000;
    }

    /**
     * @notice Helper to get the number of positions for a user.
     */
    function getPositionsCount(address user) external view returns (uint256) {
        return positions[user].length;
    }

    /**
     * @notice Withdraws token premiums or surplus.
     * @param amount The amount of tokens to withdraw.
     */
    function withdraw(uint256 amount) external onlyOwner {
        token.safeTransfer(owner(), amount);
    }
}
