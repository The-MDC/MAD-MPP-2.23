// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ERC2771Context} from "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

/**
 * @title MADStaking
 * @notice On-chain implementation of the MAD Gambit $MADx staking tiers.
 *         Mirrors STAKING_TIERS in verify/lib/gambit-game-math.ts — the APY a
 *         position earns is a step function of its currently-staked balance.
 *
 *         Reconciled to the 4-tier canon (founder sign-off 31 Jul 2026, per
 *         verify/lib/gambit-game-math.ts and verify/lib/node-registry.ts's
 *         own "4-tier staking eights ladder (not 6)" note) on 2026-09-01 —
 *         this contract previously still had the older 6-tier table below,
 *         which had drifted out of sync with its own "mirrors STAKING_TIERS"
 *         claim above. Nothing was deployed under the old table, so this is
 *         a straight correction, not a migration:
 *
 *           Bronze    ≥       88 MADx →  8.8% APY
 *           Silver    ≥      888 MADx → 18.8% APY
 *           Gold      ≥    8,888 MADx → 28.8% APY
 *           MAD Tier  ≥   88,888 MADx → 38.8% APY
 *
 *         Rewards accrue linearly per second and are paid from a reward reserve
 *         the owner funds separately from staked principal, so a user's stake is
 *         never used to pay another user's rewards.
 *
 *         ERC-2771 (gasless): stake/unstake/claim/fundRewards resolve caller
 *         identity via _msgSender(), so they work correctly relayed through
 *         the MAD Gambit forwarder (see verify/app/api/v1/relay/execute) as
 *         well as called directly.
 */
contract MADStaking is Ownable, ReentrancyGuard, ERC2771Context {
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

    constructor(address _madx, address trustedForwarder_)
        Ownable(msg.sender)
        ERC2771Context(trustedForwarder_)
    {
        require(_madx != address(0), "MADStaking: token is zero");
        madx = IERC20(_madx);

        // Canonical STAKING_TIERS — do not reorder (kept ascending by minStake).
        tiers.push(Tier(88 * 1e18, 880));
        tiers.push(Tier(888 * 1e18, 1_880));
        tiers.push(Tier(8_888 * 1e18, 2_880));
        tiers.push(Tier(88_888 * 1e18, 3_880));
    }

    /* ─────────────────────────── views ─────────────────────────── */

    /// @notice APY (in bps) a balance currently qualifies for. 0 below Bronze.
    function apyBpsFor(uint256 balance) public view returns (uint256) {
        for (uint256 i = tiers.length; i > 0; --i) {
            if (balance >= tiers[i - 1].minStake) return tiers[i - 1].apyBps;
        }
        return 0;
    }

    /// @notice 1-indexed tier (1=Bronze … 4=MAD Tier); 0 = below Bronze.
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
        address user = _msgSender();
        _settle(user);

        StakeInfo storage s = stakes[user];
        s.amount += amount;
        totalStaked += amount;

        madx.safeTransferFrom(user, address(this), amount);
        emit Staked(user, amount, s.amount);
    }

    /// @notice Withdraw `amount` of staked principal. Rewards remain claimable.
    function unstake(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        address user = _msgSender();
        StakeInfo storage s = stakes[user];
        if (amount > s.amount) revert InsufficientStake();

        _settle(user);
        s.amount -= amount;
        totalStaked -= amount;

        madx.safeTransfer(user, amount);
        emit Unstaked(user, amount, s.amount);
    }

    /// @notice Claim all accrued rewards from the reward reserve.
    function claim() external nonReentrant returns (uint256 reward) {
        address user = _msgSender();
        _settle(user);
        StakeInfo storage s = stakes[user];
        reward = s.rewardAccrued;
        if (reward == 0) revert ZeroAmount();
        if (reward > rewardReserve) revert InsufficientRewardReserve();

        s.rewardAccrued = 0;
        rewardReserve -= reward;

        madx.safeTransfer(user, reward);
        emit RewardsClaimed(user, reward);
    }

    /* ─────────────────────────── owner ─────────────────────────── */

    /// @notice Fund the reward reserve. Kept separate from staked principal.
    function fundRewards(uint256 amount) external {
        if (amount == 0) revert ZeroAmount();
        address funder = _msgSender();
        rewardReserve += amount;
        madx.safeTransferFrom(funder, address(this), amount);
        emit RewardsFunded(funder, amount);
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

    /* ─────────────────────────── ERC-2771 diamond resolution ───────────
     * Ownable and ERC2771Context both derive from Context, so the compiler
     * needs an explicit pick for which _msgSender/_msgData/_contextSuffixLength
     * wins — this is the standard OZ resolution, not custom logic.
     */

    function _msgSender() internal view override(Context, ERC2771Context) returns (address) {
        return ERC2771Context._msgSender();
    }

    function _msgData() internal view override(Context, ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }

    function _contextSuffixLength() internal view override(Context, ERC2771Context) returns (uint256) {
        return ERC2771Context._contextSuffixLength();
    }
}
