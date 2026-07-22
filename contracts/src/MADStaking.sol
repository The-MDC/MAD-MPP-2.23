// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MADStaking
 * @notice Tier-based $MADx staking with time-accrued rewards.
 *
 * Replaces the previous 28-byte placeholder ("Full MADStaking with rewards").
 * Tiers and APYs are the canonical values from lib/gambit-game-math.ts
 * (STAKING_TIERS) — Bronze 12% → MAD Tier 68%. A staker's tier is a function
 * of their staked balance; rewards accrue continuously at that tier's APY.
 *
 * NO PRINTING: rewards are paid from a reward reservoir that the owner funds
 * from platform fees (`fundRewards`). Staking never mints $MADx. If the
 * reservoir cannot cover accrued rewards, claims revert until it is topped up.
 *
 * ── VERIFICATION GATE ──────────────────────────────────────────────────────
 * This contract has NOT been compiled/tested in this environment (Foundry is
 * unavailable here). Before any deploy it MUST get: `forge build`, a full
 * Foundry test suite (unit + fuzz + invariant), and a security review. Treat
 * it as reviewed-by-eye source, not audited bytecode.
 */
contract MADStaking is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @dev Canonical staking tier: minimum staked balance → APY in basis points.
    struct Tier {
        uint256 minStake; // in token base units (18 decimals for $MADx)
        uint16 apyBps; // 1200 = 12.00% APY
    }

    struct StakeInfo {
        uint256 amount; // currently staked
        uint256 rewardDebtAccrued; // rewards accrued and crystallized but not yet claimed
        uint64 lastAccrualAt; // last time rewards were folded into rewardDebtAccrued
    }

    uint256 private constant SECONDS_PER_YEAR = 365 days;
    uint256 private constant BPS_DENOMINATOR = 10_000;

    IERC20 public immutable madx;

    /// @notice Tiers in ascending order of minStake. Set once at deploy.
    Tier[] public tiers;

    mapping(address => StakeInfo) public stakes;

    uint256 public totalStaked;
    /// @notice Tokens set aside to pay rewards (funded from fees, never minted).
    uint256 public rewardReservoir;

    event Staked(address indexed user, uint256 amount, uint256 newTotal);
    event Unstaked(address indexed user, uint256 amount, uint256 newTotal);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardsFunded(address indexed from, uint256 amount);

    error ZeroAmount();
    error InsufficientStake();
    error RewardReservoirEmpty();
    error TiersRequired();
    error TiersNotAscending();

    /**
     * @param _madx        the $MADx ERC-20.
     * @param minStakes    ascending tier thresholds (18-dec base units).
     * @param apyBpsValues per-tier APY in basis points, same length/order.
     */
    constructor(
        IERC20 _madx,
        uint256[] memory minStakes,
        uint16[] memory apyBpsValues
    ) Ownable(msg.sender) {
        if (minStakes.length == 0 || minStakes.length != apyBpsValues.length) revert TiersRequired();
        madx = _madx;
        for (uint256 i = 0; i < minStakes.length; i++) {
            if (i > 0 && minStakes[i] <= minStakes[i - 1]) revert TiersNotAscending();
            tiers.push(Tier({minStake: minStakes[i], apyBps: apyBpsValues[i]}));
        }
    }

    // ─────────────────────────────── views ────────────────────────────────

    function tierCount() external view returns (uint256) {
        return tiers.length;
    }

    /// @notice APY (bps) for a given staked amount; 0 if below the lowest tier.
    function apyBpsFor(uint256 amount) public view returns (uint16) {
        uint16 apy = 0;
        for (uint256 i = 0; i < tiers.length; i++) {
            if (amount >= tiers[i].minStake) {
                apy = tiers[i].apyBps;
            } else {
                break; // tiers ascending: first miss ends the ladder
            }
        }
        return apy;
    }

    /// @notice Rewards accrued but not yet crystallized, for `user`, up to now.
    function pendingRewards(address user) public view returns (uint256) {
        StakeInfo memory s = stakes[user];
        return s.rewardDebtAccrued + _accrued(s);
    }

    function _accrued(StakeInfo memory s) internal view returns (uint256) {
        if (s.amount == 0 || s.lastAccrualAt == 0) return 0;
        uint256 elapsed = block.timestamp - s.lastAccrualAt;
        if (elapsed == 0) return 0;
        uint16 apy = apyBpsFor(s.amount);
        if (apy == 0) return 0;
        // amount * apyBps * elapsed / (BPS * SECONDS_PER_YEAR)
        return (s.amount * apy * elapsed) / (BPS_DENOMINATOR * SECONDS_PER_YEAR);
    }

    // ────────────────────────────── mutations ─────────────────────────────

    function _crystallize(address user) internal {
        StakeInfo storage s = stakes[user];
        uint256 acc = _accrued(s);
        if (acc > 0) s.rewardDebtAccrued += acc;
        s.lastAccrualAt = uint64(block.timestamp);
    }

    function stake(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        _crystallize(msg.sender);
        stakes[msg.sender].amount += amount;
        totalStaked += amount;
        madx.safeTransferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount, stakes[msg.sender].amount);
    }

    function unstake(uint256 amount) external nonReentrant {
        StakeInfo storage s = stakes[msg.sender];
        if (amount == 0) revert ZeroAmount();
        if (amount > s.amount) revert InsufficientStake();
        _crystallize(msg.sender);
        s.amount -= amount;
        totalStaked -= amount;
        madx.safeTransfer(msg.sender, amount);
        emit Unstaked(msg.sender, amount, s.amount);
    }

    function claim() external nonReentrant returns (uint256 paid) {
        _crystallize(msg.sender);
        StakeInfo storage s = stakes[msg.sender];
        paid = s.rewardDebtAccrued;
        if (paid == 0) return 0;
        if (paid > rewardReservoir) revert RewardReservoirEmpty();
        s.rewardDebtAccrued = 0;
        rewardReservoir -= paid;
        madx.safeTransfer(msg.sender, paid);
        emit RewardsClaimed(msg.sender, paid);
    }

    /// @notice Top up the reward reservoir (from platform fees). Never mints.
    function fundRewards(uint256 amount) external {
        if (amount == 0) revert ZeroAmount();
        rewardReservoir += amount;
        madx.safeTransferFrom(msg.sender, address(this), amount);
        emit RewardsFunded(msg.sender, amount);
    }

    /**
     * @notice Owner-only sweep of tokens that are neither staked principal nor
     *         earmarked reward reservoir (e.g. accidental transfers).
     */
    function sweepSurplus(address to) external onlyOwner {
        uint256 bal = madx.balanceOf(address(this));
        uint256 reserved = totalStaked + rewardReservoir;
        if (bal <= reserved) revert ZeroAmount();
        madx.safeTransfer(to, bal - reserved);
    }
}
