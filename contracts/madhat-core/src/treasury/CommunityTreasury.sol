// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import {Errors} from "../errors/Errors.sol";

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CommunityTreasury
 * @notice Manages the 40% community revenue distribution
 * @dev Distribution breakdown:
 *   - 20% → Player rewards pool
 *   - 12% → DAO treasury
 *   - 8% → Member rewards (Level 16+ revenue share)
 */
contract CommunityTreasury is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    IERC20 public immutable madxToken;

    // Distribution targets
    address public playerRewardsPool;
    address public daoTreasury;
    address public revenueShareContract;

    // Distribution percentages (basis points, total = 10000 for 100%)
    uint256 public constant PLAYER_REWARDS_BPS = 5000;  // 50% of 40% = 20% total
    uint256 public constant DAO_TREASURY_BPS = 3000;    // 30% of 40% = 12% total
    uint256 public constant REVENUE_SHARE_BPS = 2000;   // 20% of 40% = 8% total
    uint256 public constant TOTAL_BPS = 10000;

    // Tracking
    uint256 public totalDistributed;
    uint256 public lastDistributionTime;

    event RevenueReceived(uint256 amount, uint256 timestamp);
    event RevenueDistributed(
        uint256 toPlayerRewards,
        uint256 toDaoTreasury,
        uint256 toRevenueShare,
        uint256 timestamp
    );
    event TargetUpdated(string targetName, address newAddress);

    constructor(
        address _madxToken,
        address _playerRewardsPool,
        address _daoTreasury,
        address _revenueShareContract,
        address admin
    ) {
        require(_madxToken != address(0), "Invalid token");
        require(_playerRewardsPool != address(0), "Invalid rewards pool");
        require(_daoTreasury != address(0), "Invalid DAO treasury");
        require(_revenueShareContract != address(0), "Invalid revenue share");

        madxToken = IERC20(_madxToken);
        playerRewardsPool = _playerRewardsPool;
        daoTreasury = _daoTreasury;
        revenueShareContract = _revenueShareContract;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(DISTRIBUTOR_ROLE, admin);
    }

    /**
     * @notice Receive revenue and distribute according to percentages
     * @dev Can be called by anyone to trigger distribution of accumulated funds
     */
    function distributeRevenue() external nonReentrant onlyRole(DISTRIBUTOR_ROLE) {
        uint256 balance = madxToken.balanceOf(address(this));
        require(balance > 0, "No funds to distribute");

        uint256 toPlayerRewards = (balance * PLAYER_REWARDS_BPS) / TOTAL_BPS;
        uint256 toDaoTreasury = (balance * DAO_TREASURY_BPS) / TOTAL_BPS;
        uint256 toRevenueShare = balance - toPlayerRewards - toDaoTreasury;

        madxToken.safeTransfer(playerRewardsPool, toPlayerRewards);
        madxToken.safeTransfer(daoTreasury, toDaoTreasury);
        madxToken.safeTransfer(revenueShareContract, toRevenueShare);

        totalDistributed += balance;
        lastDistributionTime = block.timestamp;

        emit RevenueDistributed(
            toPlayerRewards,
            toDaoTreasury,
            toRevenueShare,
            block.timestamp
        );
    }

    /**
     * @notice Update distribution target addresses
     */
    function setPlayerRewardsPool(address _pool) external onlyRole(ADMIN_ROLE) {
        if (_pool == address(0)) revert Errors.ZeroAddress();
        playerRewardsPool = _pool;
        emit TargetUpdated("playerRewardsPool", _pool);
    }

    function setDaoTreasury(address _treasury) external onlyRole(ADMIN_ROLE) {
        if (_treasury == address(0)) revert Errors.ZeroAddress();
        daoTreasury = _treasury;
        emit TargetUpdated("daoTreasury", _treasury);
    }

    function setRevenueShareContract(address _revenueShare) external onlyRole(ADMIN_ROLE) {
        if (_revenueShare == address(0)) revert Errors.ZeroAddress();
        revenueShareContract = _revenueShare;
        emit TargetUpdated("revenueShareContract", _revenueShare);
    }

    /**
     * @notice Emergency withdrawal (only admin)
     */
    function emergencyWithdraw(address token, address to, uint256 amount)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        IERC20(token).safeTransfer(to, amount);
    }

    /**
     * @notice Get pending distribution amount
     */
    function getPendingDistribution() external view returns (uint256) {
        return madxToken.balanceOf(address(this));
    }
}
