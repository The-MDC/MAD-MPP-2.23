// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MADStaking
 * @notice On-chain implementation of the MAD Gambit $MADx staking tiers.
 *         Mirrors STAKING_TIERS in verify/lib/gambit-game-math.ts — the APY a
 *         position earns is a step function of its currently-staked balance:
 *
 *           Bronze    ≥      100 MADx → 12% APY
 *           Silver    ≥      500 MADx → 18% APY
 *           Gold      ≥    2,500 MADx → 28% APY
 *           Platinum  ≥   10,000 MADx → 42% APY
 *           Diamond   ≥   50,000 MADx → 58% APY
 *           MAD Tier  ≥  100,000 MADx → 68% APY
 *
 *         Rewards accrue linearly per second and are paid from a reward reserve
 *         the owner funds separately from staked principal, so a user's stake is
 *         never used to pay another user's rewards.
 */
contract MADStaking is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable madx;

    uint256 public constant SECONDS_PER_YEAR = 365 days;
    uint256 public constant BPS_DENOMINATOR = 10_000;

    struct Tier {
        uint256 minStake; // inclusive threshold, in wei (18 decimals)
        uint256 apyBps; // annual percentage yield in basis points
    }

    /// @dev Ordered ascending by minStake. `tierFor` walks it descending.
    Tier[] public tiers;

    struct StakeInfo {
        uint256 amount; // principal currently staked
        uint256 rewardAccrued; // rewards settled but not yet withdrawn
        uint256 lastAccrualAt; // last time rewards were settled
    }

    mapping(address => StakeInfo) public stakes;

    uint256 public totalStaked;
    uint256 public rewardReserve; // MADx set aside by the owner to pay rewards

    event Staked(address indexed user, uint256 amount, uint256 newBalance);
    event Unstaked(address indexed user, uint256 amount, uint256 newBalance);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardsFunded(address indexed from, uint256 amount);
    event RewardReserveWithdrawn(address indexed to, uint256 amount);

    error ZeroAmount();
    error InsufficientStake();
    error InsufficientRewardReserve();

    constructor(address _madx) Ownable(msg.sender) {
        require(_madx != address(0), "MADStaking: token is zero");
        madx = IERC20(_madx);

        // Canonical STAKING_TIERS — do not reorder (kept ascending by minStake).
        tiers.push(Tier(100 * 1e18, 1_200));
        tiers.push(Tier(500 * 1e18, 1_800));
        tiers.push(Tier(2_500 * 1e18, 2_800));
        tiers.push(Tier(10_000 * 1e18, 4_200));
        tiers.push(Tier(50_000 * 1e18, 5_800));
        tiers.push(Tier(100_000 * 1e18, 6_800));
    }

    /* ─────────────────────────── views ─────────────────────────── */

    /// @notice APY (in bps) a balance currently qualifies for. 0 below Bronze.
    function apyBpsFor(uint256 balance) public view returns (uint256) {
        for (uint256 i = tiers.length; i > 0; --i) {
            if (balance >= tiers[i - 1].minStake) return tiers[i - 1].apyBps;
        }
        return 0;
    }

    /// @notice 1-indexed tier (1=Bronze … 6=MAD Tier); 0 = below Bronze.
    function tierFor(uint256 balance) external view returns (uint256) {
        for (uint256 i = tiers.length; i > 0; --i) {
            if (balance >= tiers[i - 1].minStake) return i;
        }
        return 0;
    }

    /// @notice Rewards claimable now = settled accrual + accrual since last touch.
    function pendingRewards(address user) public view returns (uint256) {
        StakeInfo memory s = stakes[user];
        return s.rewardAccrued + _accruedSince(s);
    }

    function _accruedSince(StakeInfo memory s) internal view returns (uint256) {
        if (s.amount == 0) return 0;
        uint256 elapsed = block.timestamp - s.lastAccrualAt;
        if (elapsed == 0) return 0;
        uint256 apyBps = apyBpsFor(s.amount);
        if (apyBps == 0) return 0;
        return (s.amount * apyBps * elapsed) / (BPS_DENOMINATOR * SECONDS_PER_YEAR);
    }

    /* ─────────────────────────── mutations ─────────────────────────── */

    function _settle(address user) internal {
        StakeInfo storage s = stakes[user];
        uint256 accrued = _accruedSince(s);
        if (accrued > 0) s.rewardAccrued += accrued;
        s.lastAccrualAt = block.timestamp;
    }

    /// @notice Stake `amount` MADx. Settles pending rewards at the old balance first.
    function stake(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        _settle(msg.sender);

        StakeInfo storage s = stakes[msg.sender];
        s.amount += amount;
        totalStaked += amount;

        madx.safeTransferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount, s.amount);
    }

    /// @notice Withdraw `amount` of staked principal. Rewards remain claimable.
    function unstake(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        StakeInfo storage s = stakes[msg.sender];
        if (amount > s.amount) revert InsufficientStake();

        _settle(msg.sender);
        s.amount -= amount;
        totalStaked -= amount;

        madx.safeTransfer(msg.sender, amount);
        emit Unstaked(msg.sender, amount, s.amount);
    }

    /// @notice Claim all accrued rewards from the reward reserve.
    function claim() external nonReentrant returns (uint256 reward) {
        _settle(msg.sender);
        StakeInfo storage s = stakes[msg.sender];
        reward = s.rewardAccrued;
        if (reward == 0) revert ZeroAmount();
        if (reward > rewardReserve) revert InsufficientRewardReserve();

        s.rewardAccrued = 0;
        rewardReserve -= reward;

        madx.safeTransfer(msg.sender, reward);
        emit RewardsClaimed(msg.sender, reward);
    }

    /* ─────────────────────────── owner ─────────────────────────── */

    /// @notice Fund the reward reserve. Kept separate from staked principal.
    function fundRewards(uint256 amount) external {
        if (amount == 0) revert ZeroAmount();
        rewardReserve += amount;
        madx.safeTransferFrom(msg.sender, address(this), amount);
        emit RewardsFunded(msg.sender, amount);
    }

    /// @notice Owner may reclaim unused reward reserve (never staked principal).
    function withdrawRewardReserve(address to, uint256 amount) external onlyOwner {
        if (amount == 0) revert ZeroAmount();
        if (amount > rewardReserve) revert InsufficientRewardReserve();
        rewardReserve -= amount;
        madx.safeTransfer(to, amount);
        emit RewardReserveWithdrawn(to, amount);
    }

    function tierCount() external view returns (uint256) {
        return tiers.length;
    }
}
