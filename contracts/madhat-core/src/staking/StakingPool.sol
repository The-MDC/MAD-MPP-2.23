// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ABDKMath64x64} from "abdk-libraries-solidity/ABDKMath64x64.sol";
import {Errors} from "../errors/Errors.sol";
import {RolesRegistry} from "../registries/roles.sol";

/**
 * @title StakingPool
 * @dev Standard staking contract for MADDEX tokens with multiple reward tiers
 * Features: flexible staking periods, tiered rewards, compounding, early withdrawal penalties
 */
contract StakingPool is Initializable, OwnableUpgradeable, UUPSUpgradeable, PausableUpgradeable {
    
    RolesRegistry public roles;
    
    using ABDKMath64x64 for int128;
    using ABDKMath64x64 for uint256;
    
    // Role definitions
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    
    // Reentrancy guard
    uint256 private _status;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    
    // Storage mappings
    mapping(uint256 => Stake) public stakes;
    mapping(address => uint256[]) public userStakes; // User's stake IDs
    mapping(uint256 => TierConfig) public tierConfigs; // Dynamic tier ID -> config
    uint256 public stakeCounter; // Stake ID counter
    uint256 public tierCounter; // Tier ID counter
    
    // Stake structure
    struct Stake {
        uint256 id;                  // Stake ID
        address staker;              // Staker address
        uint256 amount;              // Staked amount
        uint256 startTime;           // When stake was created
        uint256 endTime;             // When stake matures
        uint256 lastClaimTime;       // Last time rewards were claimed
        uint256 tierId;              // Staking tier ID (dynamic)
        uint256 rewardRate;          // Reward rate in basis points
        uint256 totalRewards;        // Total rewards earned so far
        uint256 claimedRewards;      // Rewards already claimed
        bool active;                 // Whether stake is active
        bool compounded;             // Whether rewards are compounded
    }
    
    // Tier configuration
    struct TierConfig {
        uint256 lockPeriod;          // Lock period in seconds
        uint256 rewardRate;          // Annual reward rate in basis points (100 = 1%)
        uint256 minAmount;           // Minimum staking amount
        uint256 earlyWithdrawalPenalty; // Early withdrawal penalty in basis points
    }
    
    // Contract references
    address public stakingToken;      // MADDEX token address
    address public rewardToken;       // Reward token (can be same as staking token)
    address public treasury;          // Treasury address for fees
    
    // Pool statistics
    uint256 public totalStaked;
    uint256 public totalRewardsPaid;
    uint256 public activeStakers;
    mapping(address => bool) public hasActiveStake;
    
    // Constants
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant SECONDS_PER_YEAR = 31536000; // 365 days
    uint256 public constant MAX_COMPOUND_FREQUENCY = 30 days; // Max compounding frequency
    
    // Events
    event StakeCreated(uint256 indexed stakeId, address indexed staker, uint256 amount, uint256 tierId, uint256 treasuryAmount);
    event StakeExtended(uint256 indexed stakeId, uint256 newEndTime);
    event RewardsClaimed(uint256 indexed stakeId, address indexed staker, uint256 rewardAmount);
    event StakeWithdrawn(uint256 indexed stakeId, address indexed staker, uint256 amount, uint256 penalty);
    event RewardsCompounded(uint256 indexed stakeId, uint256 compoundAmount);
    event TierCreated(uint256 indexed tierId, string name, uint256 rewardRate, uint256 lockPeriod);
    event TierUpdated(uint256 indexed tierId, uint256 rewardRate, uint256 lockPeriod);
    event EmergencyWithdraw(uint256 indexed stakeId, address indexed staker, uint256 amount);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event StakingPoolFunded(uint256 amountFromStaking);
    
    // Modifiers
    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    /**
     * @dev Initialize the StakingPool contract
     * @param _stakingToken MADDEX token address
     * @param _rewardToken Reward token address
     * @param _treasury Treasury address
     * @param rolesAddress Roles registry address
     */
    function initialize(
        address _stakingToken,
        address _rewardToken,
        address _treasury,
        address rolesAddress
    ) public initializer {
        __Ownable_init(msg.sender);
        __Pausable_init();
        
        // Initialize reentrancy guard
        _status = _NOT_ENTERED;
        
        if (_stakingToken == address(0) || _rewardToken == address(0) || _treasury == address(0)) {
            revert Errors.ZeroAddress();
        }
        
        if (rolesAddress == address(0)) revert Errors.ZeroAddress();
        roles = RolesRegistry(rolesAddress);
        
        stakingToken = _stakingToken;
        rewardToken = _rewardToken;
        treasury = _treasury;
        
        // Initialize default tier configurations
        _initializeDefaultTiers();
    }
    
    /**
     * @dev Authorizes upgrade for UUPS pattern
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
    
    /**
     * @dev Create a new staking tier
     * @param name Tier name for identification
     * @param lockPeriod Lock period in seconds
     * @param rewardRate Annual reward rate in basis points (100 = 1%)
     * @param minAmount Minimum staking amount
     * @param earlyWithdrawalPenalty Early withdrawal penalty in basis points
     * @return tierId ID of the created tier
     */
    function createTier(
        string memory name,
        uint256 lockPeriod,
        uint256 rewardRate,
        uint256 minAmount,
        uint256 earlyWithdrawalPenalty
    ) external onlyOwner returns (uint256 tierId) {
        if (bytes(name).length == 0) revert Errors.InvalidParameter();
        if (rewardRate > 5000) revert Errors.ExcessiveStake(); // Max 50% APY
        if (earlyWithdrawalPenalty > 5000) revert Errors.ExcessiveStake(); // Max 50% penalty
        if (lockPeriod == 0) revert Errors.InvalidAmount();
        if (minAmount == 0) revert Errors.InvalidAmount();
        
        tierId = ++tierCounter;
        
        tierConfigs[tierId] = TierConfig({
            lockPeriod: lockPeriod,
            rewardRate: rewardRate,
            minAmount: minAmount,
            earlyWithdrawalPenalty: earlyWithdrawalPenalty
        });
        
        emit TierCreated(tierId, name, rewardRate, lockPeriod);
        
        return tierId;
    }
    
    /**
     * @dev Initialize default staking tiers
     */
    function _initializeDefaultTiers() internal {
        // Bronze: 30 days, 5% APY, min 100 tokens, 10% early withdrawal penalty
        tierConfigs[1] = TierConfig({
            lockPeriod: 30 days,
            rewardRate: 500, // 5% in basis points
            minAmount: 100 * 10**18,
            earlyWithdrawalPenalty: 1000 // 10% in basis points
        });
        tierCounter = 1;
        
        // Silver: 90 days, 10% APY, min 500 tokens, 15% early withdrawal penalty
        tierConfigs[2] = TierConfig({
            lockPeriod: 90 days,
            rewardRate: 1000, // 10% in basis points
            minAmount: 500 * 10**18,
            earlyWithdrawalPenalty: 1500 // 15% in basis points
        });
        
        // Gold: 180 days, 15% APY, min 1000 tokens, 20% early withdrawal penalty
        tierConfigs[3] = TierConfig({
            lockPeriod: 180 days,
            rewardRate: 1500, // 15% in basis points
            minAmount: 1000 * 10**18,
            earlyWithdrawalPenalty: 2000 // 20% in basis points
        });
        
        // Platinum: 365 days, 25% APY, min 5000 tokens, 25% early withdrawal penalty
        tierConfigs[4] = TierConfig({
            lockPeriod: 365 days,
            rewardRate: 2500, // 25% in basis points
            minAmount: 5000 * 10**18,
            earlyWithdrawalPenalty: 2500 // 25% in basis points
        });
        
        // Diamond: 730 days, 40% APY, min 10000 tokens, 30% early withdrawal penalty
        tierConfigs[5] = TierConfig({
            lockPeriod: 730 days,
            rewardRate: 4000, // 40% in basis points
            minAmount: 10000 * 10**18,
            earlyWithdrawalPenalty: 3000 // 30% in basis points
        });
        
        tierCounter = 5;
    }
    
    /**
     * @dev Create a new stake
     * @param amount Amount to stake
     * @param tierId Staking tier ID
     * @param compounded Whether rewards should be compounded
     * @return stakeId ID of the created stake
     */
    function createStake(
        uint256 amount,
        uint256 tierId,
        bool compounded
    ) external nonReentrant whenNotPaused returns (uint256 stakeId) {
        if (amount == 0) revert Errors.InvalidAmount();
        if (tierId == 0 || tierId > tierCounter) revert Errors.InvalidParameter();
        
        TierConfig storage config = tierConfigs[tierId];
        if (amount < config.minAmount) revert Errors.InsufficientStake();
        
        stakeId = ++stakeCounter;
        uint256 endTime = block.timestamp + config.lockPeriod;
        
        // Calculate 40% for treasury and 60% for actual staking
        uint256 treasuryAmount = (amount * 4000) / BASIS_POINTS; // 40%
        uint256 stakingAmount = amount - treasuryAmount; // 60%
        
        // Transfer staking tokens from user
        require(
            IERC20(stakingToken).transferFrom(msg.sender, address(this), amount),
            "Stake transfer failed"
        );
        
        // Transfer 40% to treasury
        if (treasuryAmount > 0) {
            require(
                IERC20(stakingToken).transfer(treasury, treasuryAmount),
                "Treasury transfer failed"
            );
        }
        
        // Create stake record with 60% of the amount
        stakes[stakeId] = Stake({
            id: stakeId,
            staker: msg.sender,
            amount: stakingAmount,
            startTime: block.timestamp,
            endTime: endTime,
            lastClaimTime: block.timestamp,
            tierId: tierId,
            rewardRate: config.rewardRate,
            totalRewards: 0,
            claimedRewards: 0,
            active: true,
            compounded: compounded
        });
        
        // Update user stakes
        userStakes[msg.sender].push(stakeId);
        
        // Update statistics with staking amount (60% only)
        totalStaked += stakingAmount;
        if (!hasActiveStake[msg.sender]) {
            hasActiveStake[msg.sender] = true;
            activeStakers++;
        }
        
        emit StakeCreated(stakeId, msg.sender, stakingAmount, tierId, treasuryAmount);
        
        return stakeId;
    }
    
    /**
     * @dev Claim rewards from a stake
     * @param stakeId Stake ID
     * @return rewardAmount Amount of rewards claimed
     */
    function claimRewards(uint256 stakeId) external nonReentrant returns (uint256 rewardAmount) {
        Stake storage stake = stakes[stakeId];
        
        if (stake.staker != msg.sender) revert Errors.Unauthorized();
        if (!stake.active) revert Errors.PositionNotActive();
        
        rewardAmount = _calculateRewards(stakeId);
        
        if (rewardAmount == 0) revert Errors.InsufficientBalance();
        
        // Update stake records
        stake.totalRewards += rewardAmount;
        stake.claimedRewards += rewardAmount;
        stake.lastClaimTime = block.timestamp;
        
        // Transfer reward tokens
        require(
            IERC20(rewardToken).transfer(msg.sender, rewardAmount),
            "Reward transfer failed"
        );
        
        totalRewardsPaid += rewardAmount;
        
        emit RewardsClaimed(stakeId, msg.sender, rewardAmount);
        
        return rewardAmount;
    }
    
    /**
     * @dev Compound rewards back into stake
     * @param stakeId Stake ID
     * @return compoundAmount Amount of rewards compounded
     */
    function compoundRewards(uint256 stakeId) external nonReentrant returns (uint256 compoundAmount) {
        Stake storage stake = stakes[stakeId];
        
        if (stake.staker != msg.sender) revert Errors.Unauthorized();
        if (!stake.active) revert Errors.PositionNotActive();
        if (!stake.compounded) revert Errors.InvalidTransactionType();
        
        // Check compounding frequency
        if (block.timestamp - stake.lastClaimTime < MAX_COMPOUND_FREQUENCY) {
            revert Errors.LockPeriodNotMet();
        }
        
        compoundAmount = _calculateRewards(stakeId);
        
        if (compoundAmount == 0) revert Errors.InsufficientBalance();
        
        // Update stake records
        stake.totalRewards += compoundAmount;
        stake.claimedRewards += compoundAmount;
        stake.amount += compoundAmount;
        stake.lastClaimTime = block.timestamp;
        
        // Update total staked
        totalStaked += compoundAmount;
        
        emit RewardsCompounded(stakeId, compoundAmount);
        
        return compoundAmount;
    }
    
    /**
     * @dev Withdraw stake (with penalty if early)
     * @param stakeId Stake ID
     * @return withdrawnAmount Amount actually withdrawn
     * @return penalty Penalty amount (if any)
     */
    function withdrawStake(uint256 stakeId) external nonReentrant returns (uint256 withdrawnAmount, uint256 penalty) {
        Stake storage stake = stakes[stakeId];
        
        if (stake.staker != msg.sender) revert Errors.Unauthorized();
        if (!stake.active) revert Errors.PositionNotActive();
        
        uint256 currentAmount = stake.amount;
        uint256 rewards = _calculateRewards(stakeId);
        
        // Calculate penalty if early withdrawal
        if (block.timestamp < stake.endTime) {
            TierConfig storage config = tierConfigs[stake.tierId];
            penalty = (currentAmount * config.earlyWithdrawalPenalty) / BASIS_POINTS;
            withdrawnAmount = currentAmount - penalty;
            
            // Transfer penalty to treasury
            if (penalty > 0) {
                require(
                    IERC20(stakingToken).transfer(treasury, penalty),
                    "Penalty transfer failed"
                );
            }
        } else {
            withdrawnAmount = currentAmount;
            penalty = 0;
        }
        
        // Update stake records
        stake.active = false;
        stake.totalRewards += rewards;
        stake.claimedRewards += rewards;
        
        // Update statistics
        totalStaked -= currentAmount;
        
        // Check if user still has active stakes
        bool hasOtherActiveStakes = false;
        uint256[] storage userStakeIds = userStakes[msg.sender];
        for (uint256 i = 0; i < userStakeIds.length; i++) {
            if (stakes[userStakeIds[i]].active) {
                hasOtherActiveStakes = true;
                break;
            }
        }
        
        if (!hasOtherActiveStakes) {
            hasActiveStake[msg.sender] = false;
            activeStakers--;
        }
        
        // Transfer principal and rewards
        require(
            IERC20(stakingToken).transfer(msg.sender, withdrawnAmount),
            "Principal transfer failed"
        );
        
        if (rewards > 0) {
            require(
                IERC20(rewardToken).transfer(msg.sender, rewards),
                "Reward transfer failed"
            );
            totalRewardsPaid += rewards;
        }
        
        emit StakeWithdrawn(stakeId, msg.sender, withdrawnAmount, penalty);
        emit RewardsClaimed(stakeId, msg.sender, rewards);
        
        return (withdrawnAmount, penalty);
    }
    
    /**
     * @dev Extend stake duration
     * @param stakeId Stake ID
     * @param additionalTime Additional time in seconds
     */
    function extendStake(uint256 stakeId, uint256 additionalTime) external {
        Stake storage stake = stakes[stakeId];
        
        if (stake.staker != msg.sender) revert Errors.Unauthorized();
        if (!stake.active) revert Errors.PositionNotActive();
        if (additionalTime == 0) revert Errors.InvalidAmount();
        
        stake.endTime += additionalTime;
        
        emit StakeExtended(stakeId, stake.endTime);
    }
    
    /**
     * @dev Calculate pending rewards for a stake
     * @param stakeId Stake ID
     * @return rewards Pending reward amount
     */
    function _calculateRewards(uint256 stakeId) internal view returns (uint256 rewards) {
        Stake storage stake = stakes[stakeId];
        
        if (!stake.active) return 0;
        
        uint256 timeElapsed = block.timestamp - stake.lastClaimTime;
        if (timeElapsed == 0) return 0;
        
        // Calculate rewards using ABDKMath64x64 for precision
        int128 amountFixed = ABDKMath64x64.fromUInt(stake.amount);
        int128 rateFixed = ABDKMath64x64.fromUInt(stake.rewardRate);
        int128 timeFixed = ABDKMath64x64.fromUInt(timeElapsed);
        int128 yearFixed = ABDKMath64x64.fromUInt(SECONDS_PER_YEAR);
        
        // rewards = amount * rate * time / (basisPoints * year)
        int128 rewardsFixed = amountFixed.mul(rateFixed).mul(timeFixed)
            .div(ABDKMath64x64.fromUInt(BASIS_POINTS))
            .div(yearFixed);
        
        return ABDKMath64x64.toUInt(rewardsFixed);
    }
    
    /**
     * @dev Get pending rewards for a stake
     * @param stakeId Stake ID
     * @return Pending reward amount
     */
    function getPendingRewards(uint256 stakeId) external view returns (uint256) {
        return _calculateRewards(stakeId);
    }
    
    /**
     * @dev Get stake details
     */
    function getStake(uint256 stakeId) external view returns (
        uint256 id,
        address staker,
        uint256 amount,
        uint256 startTime,
        uint256 endTime,
        uint256 lastClaimTime,
        uint256 tierId,
        uint256 rewardRate,
        uint256 totalRewards,
        uint256 claimedRewards,
        bool active,
        bool compounded,
        uint256 pendingRewards
    ) {
        Stake storage stake = stakes[stakeId];
        return (
            stake.id,
            stake.staker,
            stake.amount,
            stake.startTime,
            stake.endTime,
            stake.lastClaimTime,
            stake.tierId,
            stake.rewardRate,
            stake.totalRewards,
            stake.claimedRewards,
            stake.active,
            stake.compounded,
            _calculateRewards(stakeId)
        );
    }
    
    /**
     * @dev Get user's stake IDs
     */
    function getUserStakes(address user) external view returns (uint256[] memory stakeIds) {
        return userStakes[user];
    }
    
    /**
     * @dev Get tier configuration
     */
    function getTierConfig(uint256 tierId) external view returns (
        uint256 lockPeriod,
        uint256 rewardRate,
        uint256 minAmount,
        uint256 earlyWithdrawalPenalty
    ) {
        if (tierId == 0 || tierId > tierCounter) revert Errors.InvalidParameter();
        TierConfig storage config = tierConfigs[tierId];
        return (
            config.lockPeriod,
            config.rewardRate,
            config.minAmount,
            config.earlyWithdrawalPenalty
        );
    }
    
    /**
     * @dev Get pool statistics
     */
    function getPoolStats() external view returns (
        uint256 _totalStaked,
        uint256 _totalRewardsPaid,
        uint256 _activeStakers,
        uint256 apr
    ) {
        _totalStaked = totalStaked;
        _totalRewardsPaid = totalRewardsPaid;
        _activeStakers = activeStakers;
        
        // Calculate average APR
        if (_totalStaked > 0) {
            int128 rewardsFixed = ABDKMath64x64.fromUInt(_totalRewardsPaid);
            int128 stakedFixed = ABDKMath64x64.fromUInt(_totalStaked);
            int128 aprFixed = rewardsFixed.div(stakedFixed).mul(ABDKMath64x64.fromUInt(10000));
            apr = ABDKMath64x64.toUInt(aprFixed);
        } else {
            apr = 0;
        }
        
        return (_totalStaked, _totalRewardsPaid, _activeStakers, apr);
    }
    
    // Admin functions
    function updateTierConfig(
        uint256 tierId,
        uint256 rewardRate,
        uint256 lockPeriod,
        uint256 minAmount,
        uint256 earlyWithdrawalPenalty
    ) external onlyOwner {
        if (tierId == 0 || tierId > tierCounter) revert Errors.InvalidParameter();
        if (rewardRate > 5000) revert Errors.ExcessiveStake(); // Max 50% APY
        if (earlyWithdrawalPenalty > 5000) revert Errors.ExcessiveStake(); // Max 50% penalty
        
        tierConfigs[tierId] = TierConfig({
            lockPeriod: lockPeriod,
            rewardRate: rewardRate,
            minAmount: minAmount,
            earlyWithdrawalPenalty: earlyWithdrawalPenalty
        });
        
        emit TierUpdated(tierId, rewardRate, lockPeriod);
    }
    
    function emergencyWithdraw(uint256 stakeId) external {
        if (!roles.isRole(EMERGENCY_ROLE, msg.sender)) revert Errors.Unauthorized();
        Stake storage stake = stakes[stakeId];
        
        if (!stake.active) revert Errors.PositionNotActive();
        
        uint256 amount = stake.amount;
        stake.active = false;
        
        // Transfer to owner
        require(
            IERC20(stakingToken).transfer(owner(), amount),
            "Emergency transfer failed"
        );
        
        emit EmergencyWithdraw(stakeId, stake.staker, amount);
    }
    
    function pause() external {
        if (!roles.isRole(PAUSER_ROLE, msg.sender)) revert Errors.Unauthorized();
        _pause();
    }
    
    function unpause() external {
        if (!roles.isRole(PAUSER_ROLE, msg.sender)) revert Errors.Unauthorized();
        _unpause();
    }
    
    function updateTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert Errors.ZeroAddress();
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }
    
    
    /**
     * @dev Transfer 40% of the staking pool balance to treasury
     */
    function fundStakingPool() external onlyOwner nonReentrant {
        uint256 currentBalance = IERC20(stakingToken).balanceOf(address(this));
        
        // Calculate 40% of staking pool current balance
        uint256 stakingPoolAmount = (currentBalance * 4000) / BASIS_POINTS; // 40%
        
        // Transfer 40% from staking pool to treasury
        if (stakingPoolAmount > 0) {
            require(
                IERC20(stakingToken).transfer(treasury, stakingPoolAmount),
                "Staking pool transfer failed"
            );
        }
        
        emit StakingPoolFunded(stakingPoolAmount, 0);
    }
}
