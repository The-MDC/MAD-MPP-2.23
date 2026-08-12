// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ERC2771Context} from "@openzeppelin/contracts/metatx/ERC2771Context.sol";

/**
 * @title MADMarketFactory
 * @notice UGC prediction markets for MAD Gambit — the on-chain settlement layer
 *         behind the off-chain markets/bets ledger (verify/lib/markets.ts).
 *
 *         Market type: OVER/UNDER, one of the two CIRO-compliant non-binary types
 *         in the Jul-13 Math Spec. Backers stake $MADx on whether a resolved scalar
 *         value lands at/above (OVER) or below (UNDER) a threshold. Pools are
 *         PARIMUTUEL: at resolution the winning side splits the whole pot (both
 *         sides, minus the platform fee) pro-rata to stake. No AMM and no LMSR
 *         maker — a deliberately simple, custody-safe mechanism for v1; the
 *         Continuous DL-LMSR type is a later, separate contract.
 *
 *         Fees (canonical, NON-STACKING):
 *           platformFee = 1.88% of the settled pot            (FEE_BPS = 188)
 *           creatorCut  = 40% of that fee (creator-made only) (CREATOR_FEE_SHARE_BPS = 4000)
 *           protocolCut = the remaining 60% → treasury
 *         The platform-wide 28.8% community share is a TREASURY-level split of net
 *         profit, deliberately NOT computed per-market here — the two are
 *         non-additive by design (see MAD_GAMBIT_MASTER_ACTION_PLAN Part A).
 *
 *         Payouts use a pull pattern (each winner calls `claim`); only the two
 *         fee transfers happen at resolution, after all state is final.
 *
 *         ERC-2771 (gasless): trades through the deployed MAD Gambit relayer
 *         (see verify/app/api/v1/relay/execute) resolve to the real signer via
 *         _msgSender(), never the forwarder's own address. `createMarket`,
 *         `back`, `claim` and `claimRefund` are the only functions where
 *         caller identity is economically meaningful, so those are the only
 *         ones using _msgSender() instead of msg.sender. onlyOwner functions
 *         need no change — Ownable already resolves identity through
 *         _msgSender() internally.
 */
contract MADMarketFactory is Ownable, ReentrancyGuard, Pausable, ERC2771Context {
    using SafeERC20 for IERC20;

    IERC20 public immutable madx;
    address public treasury;

    uint256 public constant FEE_BPS = 188; // 1.88% platform fee
    uint256 public constant CREATOR_FEE_SHARE_BPS = 4000; // 40% of the fee to the creator
    uint256 public constant BPS_DENOMINATOR = 10_000;

    enum Status {
        Open,
        Resolved,
        Cancelled
    }
    enum Side {
        Under,
        Over
    } // 0 = Under, 1 = Over

    struct Market {
        address creator;
        int256 threshold; // scalar threshold; OVER wins iff resolvedValue >= threshold
        uint64 resolutionTime; // backing closes at this time; resolvable at/after it
        Status status;
        Side winningSide;
        uint256 overPool;
        uint256 underPool;
        uint256 distributable; // pot minus fee, fixed at resolution (winners split this)
    }

    Market[] public markets;
    mapping(uint256 => mapping(address => uint256)) public overStake;
    mapping(uint256 => mapping(address => uint256)) public underStake;
    mapping(uint256 => mapping(address => bool)) public claimed;

    event MarketCreated(
        uint256 indexed marketId, address indexed creator, int256 threshold, uint64 resolutionTime
    );
    event Backed(uint256 indexed marketId, address indexed user, Side side, uint256 amount);
    event MarketResolved(
        uint256 indexed marketId, int256 resolvedValue, Side winningSide, uint256 platformFee, uint256 creatorCut
    );
    event Claimed(uint256 indexed marketId, address indexed user, uint256 payout);
    event MarketCancelled(uint256 indexed marketId);
    event Refunded(uint256 indexed marketId, address indexed user, uint256 amount);
    event TreasuryUpdated(address indexed treasury);

    error ZeroAmount();
    error MarketNotFound();
    error MarketClosed();
    error TooEarly();
    error TooLate();
    error NotResolved();
    error NothingToClaim();
    error AlreadyClaimed();
    error NotCancelled();

    constructor(address _madx, address _treasury, address trustedForwarder_)
        Ownable(msg.sender)
        ERC2771Context(trustedForwarder_)
    {
        require(_madx != address(0), "MADMarketFactory: token is zero");
        require(_treasury != address(0), "MADMarketFactory: treasury is zero");
        madx = IERC20(_madx);
        treasury = _treasury;
    }

    /* ─────────────────────────── views ─────────────────────────── */

    function marketCount() external view returns (uint256) {
        return markets.length;
    }

    /// @notice Pro-rata payout a user would get if they claimed now (0 unless
    ///         the market is resolved and the user is on the winning side).
    function pendingPayout(uint256 marketId, address user) public view returns (uint256) {
        if (marketId >= markets.length) return 0;
        Market memory m = markets[marketId];
        if (m.status != Status.Resolved) return 0;
        if (claimed[marketId][user]) return 0;
        uint256 winnerPool = m.winningSide == Side.Over ? m.overPool : m.underPool;
        if (winnerPool == 0) return 0;
        uint256 userStake = m.winningSide == Side.Over ? overStake[marketId][user] : underStake[marketId][user];
        if (userStake == 0) return 0;
        return (userStake * m.distributable) / winnerPool;
    }

    /* ─────────────────────────── UGC create ─────────────────────────── */

    /// @notice Anyone can create a market. The caller becomes the creator and
    ///         earns the 40% creator share of the fee when it settles.
    function createMarket(int256 threshold, uint64 resolutionTime)
        external
        whenNotPaused
        returns (uint256 marketId)
    {
        if (resolutionTime <= block.timestamp) revert TooLate();
        address creator = _msgSender();
        marketId = markets.length;
        markets.push(
            Market({
                creator: creator,
                threshold: threshold,
                resolutionTime: resolutionTime,
                status: Status.Open,
                winningSide: Side.Under,
                overPool: 0,
                underPool: 0,
                distributable: 0
            })
        );
        emit MarketCreated(marketId, creator, threshold, resolutionTime);
    }

    /* ─────────────────────────── backing ─────────────────────────── */

    function back(uint256 marketId, Side side, uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) revert ZeroAmount();
        if (marketId >= markets.length) revert MarketNotFound();
        Market storage m = markets[marketId];
        if (m.status != Status.Open) revert MarketClosed();
        if (block.timestamp >= m.resolutionTime) revert TooLate();

        address backer = _msgSender();
        if (side == Side.Over) {
            m.overPool += amount;
            overStake[marketId][backer] += amount;
        } else {
            m.underPool += amount;
            underStake[marketId][backer] += amount;
        }
        madx.safeTransferFrom(backer, address(this), amount);
        emit Backed(marketId, backer, side, amount);
    }

    /* ─────────────────────────── resolution ─────────────────────────── */

    /// @notice Resolve a market to a scalar value. OVER wins iff value >= threshold.
    ///         If the winning side has no backers, the market is cancelled and all
    ///         stakes are refundable (no fee taken).
    function resolve(uint256 marketId, int256 resolvedValue) external onlyOwner nonReentrant {
        if (marketId >= markets.length) revert MarketNotFound();
        Market storage m = markets[marketId];
        if (m.status != Status.Open) revert MarketClosed();
        if (block.timestamp < m.resolutionTime) revert TooEarly();

        Side winner = resolvedValue >= m.threshold ? Side.Over : Side.Under;
        uint256 winnerPool = winner == Side.Over ? m.overPool : m.underPool;

        // No winners staked → refund everyone; no fee.
        if (winnerPool == 0) {
            m.status = Status.Cancelled;
            emit MarketCancelled(marketId);
            return;
        }

        uint256 pot = m.overPool + m.underPool;
        uint256 platformFee = (pot * FEE_BPS) / BPS_DENOMINATOR;
        uint256 creatorCut = (platformFee * CREATOR_FEE_SHARE_BPS) / BPS_DENOMINATOR;
        uint256 protocolCut = platformFee - creatorCut;

        // Effects before interactions.
        m.winningSide = winner;
        m.distributable = pot - platformFee;
        m.status = Status.Resolved;

        emit MarketResolved(marketId, resolvedValue, winner, platformFee, creatorCut);

        if (creatorCut > 0) madx.safeTransfer(m.creator, creatorCut);
        if (protocolCut > 0) madx.safeTransfer(treasury, protocolCut);
    }

    /// @notice Claim a winning pro-rata payout (pull pattern, once per market).
    function claim(uint256 marketId) external nonReentrant returns (uint256 payout) {
        address user = _msgSender();
        if (marketId >= markets.length) revert MarketNotFound();
        if (markets[marketId].status != Status.Resolved) revert NotResolved();
        if (claimed[marketId][user]) revert AlreadyClaimed();

        payout = pendingPayout(marketId, user);
        if (payout == 0) revert NothingToClaim();

        claimed[marketId][user] = true;
        madx.safeTransfer(user, payout);
        emit Claimed(marketId, user, payout);
    }

    /* ─────────────────────────── cancellation / refunds ─────────────────────────── */

    /// @notice Owner may void an open market (e.g., ambiguous outcome). Backers
    ///         then reclaim their full stake via `claimRefund`.
    function cancelMarket(uint256 marketId) external onlyOwner {
        if (marketId >= markets.length) revert MarketNotFound();
        Market storage m = markets[marketId];
        if (m.status != Status.Open) revert MarketClosed();
        m.status = Status.Cancelled;
        emit MarketCancelled(marketId);
    }

    /// @notice Reclaim full stake (both sides) from a cancelled market.
    function claimRefund(uint256 marketId) external nonReentrant returns (uint256 amount) {
        address user = _msgSender();
        if (marketId >= markets.length) revert MarketNotFound();
        if (markets[marketId].status != Status.Cancelled) revert NotCancelled();
        if (claimed[marketId][user]) revert AlreadyClaimed();

        amount = overStake[marketId][user] + underStake[marketId][user];
        if (amount == 0) revert NothingToClaim();

        claimed[marketId][user] = true;
        madx.safeTransfer(user, amount);
        emit Refunded(marketId, user, amount);
    }

    /* ─────────────────────────── admin ─────────────────────────── */

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "MADMarketFactory: treasury is zero");
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
