// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MADOptimisticOracle
 * @notice The economic-finality leg of MAD Gambit's quadruple-threat oracle
 *         (see docs/MECHANISM_ORACLE_MADX_RESEARCH.md). UMA-optimistic-oracle
 *         -inspired, self-contained, custody-safe.
 *
 *         Flow:
 *           1. assertOutcome(q, outcome, bond) — a proposer asserts a scalar
 *              outcome for question `q` and posts a $MADx bond.
 *           2. If nobody disputes within the liveness window, anyone can
 *              settle(q): the assertion becomes truth and the bond is returned.
 *           3. dispute(q, counterOutcome) within the window (matching bond)
 *              escalates, recording the disputer's own counter-claim. The
 *              resolver then supplies the final outcome via
 *              resolveDispute(q, finalOutcome). The party whose value matches
 *              truth wins BOTH bonds minus a protocol fee; the loser is slashed.
 *
 *         Consumers (e.g. MADMarketFactory) read getResolvedOutcome(q).
 *
 *         Decentralization, Phase A: `resolver` can be set to a
 *         MADDisputeVoting instance, which lets staked-$MADx holders decide
 *         disputes whose bond clears its threshold via commit-reveal voting,
 *         falling back to the owner when quorum isn't met (see
 *         MADDisputeVoting's own docs for the full reasoning). The owner
 *         remains a resolver unconditionally — this is additive, not a
 *         replacement. Legs 1–3 of the quadruple oracle
 *         (Chainlink/Pyth, AI multi-agent, quadratic-weighted community) feed the
 *         assertion; this contract is the money-at-risk finalizer.
 */
contract MADOptimisticOracle is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable bondToken; // $MADx
    address public treasury;

    uint256 public constant DISPUTE_FEE_BPS = 188; // 1.88% of the slashed bond
    uint256 public constant BPS_DENOMINATOR = 10_000;

    enum Status {
        None,
        Asserted,
        Disputed,
        Resolved
    }

    struct Assertion {
        address asserter;
        address disputer;
        int256 proposedOutcome;
        int256 settledOutcome;
        uint256 bond;
        uint64 assertedAt;
        uint64 liveness;
        Status status;
        bool asserterWon; // meaningful once Resolved
        int256 disputerOutcome; // the disputer's own counter-claim, set at dispute()
    }

    mapping(bytes32 => Assertion) public assertions;

    uint64 public defaultLiveness = 2 hours;
    uint256 public minBond;

    /// @notice Optional second resolver alongside the owner — set to a
    ///         MADDisputeVoting instance to let staked-$MADx voting resolve
    ///         disputes that clear its bond threshold, with the owner
    ///         remaining a fallback for everything else (unset = owner-only,
    ///         today's behavior, unchanged).
    address public resolver;

    event Asserted(bytes32 indexed questionId, address indexed asserter, int256 outcome, uint256 bond);
    event Disputed(bytes32 indexed questionId, address indexed disputer, int256 counterOutcome);
    event Settled(bytes32 indexed questionId, int256 outcome, address indexed asserter);
    event DisputeResolved(bytes32 indexed questionId, int256 finalOutcome, address indexed winner, uint256 payout);
    event TreasuryUpdated(address indexed treasury);
    event LivenessUpdated(uint64 liveness);
    event MinBondUpdated(uint256 minBond);
    event ResolverUpdated(address indexed resolver);

    error ZeroAddress();
    error BondTooLow();
    error AlreadyAsserted();
    error NotDisputable();
    error WindowClosed();
    error SelfDispute();
    error NotSettleable();
    error TooEarly();
    error NotDisputed();
    error NotAuthorizedResolver();

    constructor(address _bondToken, address _treasury) Ownable(msg.sender) {
        if (_bondToken == address(0) || _treasury == address(0)) revert ZeroAddress();
        bondToken = IERC20(_bondToken);
        treasury = _treasury;
    }

    /* ─────────────────────────── views ─────────────────────────── */

    /// @notice Truth for `questionId`, once finalized. Consumers must check `resolved`.
    function getResolvedOutcome(bytes32 questionId) external view returns (bool resolved, int256 outcome) {
        Assertion memory a = assertions[questionId];
        return (a.status == Status.Resolved, a.settledOutcome);
    }

    /// @notice Unix time at/after which an undisputed assertion can be settled.
    function settleableAt(bytes32 questionId) external view returns (uint256) {
        Assertion memory a = assertions[questionId];
        return uint256(a.assertedAt) + uint256(a.liveness);
    }

    /* ─────────────────────────── assert / dispute ─────────────────────────── */

    function assertOutcome(bytes32 questionId, int256 outcome, uint256 bond) external nonReentrant {
        if (bond == 0 || bond < minBond) revert BondTooLow();
        Assertion storage a = assertions[questionId];
        if (a.status != Status.None) revert AlreadyAsserted();

        a.asserter = msg.sender;
        a.proposedOutcome = outcome;
        a.bond = bond;
        a.assertedAt = uint64(block.timestamp);
        a.liveness = defaultLiveness;
        a.status = Status.Asserted;

        bondToken.safeTransferFrom(msg.sender, address(this), bond);
        emit Asserted(questionId, msg.sender, outcome, bond);
    }

    /// @param counterOutcome The disputer's own claim of the correct outcome.
    ///        Purely informational for the owner's direct-resolve path (which
    ///        can still supply any finalOutcome it wants, unchanged) — it
    ///        exists so a MADDisputeVoting vote that favors the disputer has
    ///        a concrete value to resolve to, since voters are choosing a
    ///        side, not independently deriving a value.
    function dispute(bytes32 questionId, int256 counterOutcome) external nonReentrant {
        Assertion storage a = assertions[questionId];
        if (a.status != Status.Asserted) revert NotDisputable();
        if (block.timestamp >= uint256(a.assertedAt) + uint256(a.liveness)) revert WindowClosed();
        if (msg.sender == a.asserter) revert SelfDispute();

        a.disputer = msg.sender;
        a.disputerOutcome = counterOutcome;
        a.status = Status.Disputed;

        bondToken.safeTransferFrom(msg.sender, address(this), a.bond); // matching bond
        emit Disputed(questionId, msg.sender, counterOutcome);
    }

    /* ─────────────────────────── settle / resolve ─────────────────────────── */

    /// @notice Permissionless settle of an UNDISPUTED assertion after liveness.
    function settle(bytes32 questionId) external nonReentrant {
        Assertion storage a = assertions[questionId];
        if (a.status != Status.Asserted) revert NotSettleable();
        if (block.timestamp < uint256(a.assertedAt) + uint256(a.liveness)) revert TooEarly();

        a.status = Status.Resolved;
        a.settledOutcome = a.proposedOutcome;
        a.asserterWon = true;

        bondToken.safeTransfer(a.asserter, a.bond); // bond returned
        emit Settled(questionId, a.proposedOutcome, a.asserter);
    }

    /// @notice Resolver rules on a disputed assertion by supplying the final
    ///         outcome. Whoever's value matches truth wins both bonds minus fee.
    ///         Callable by the owner (always) or the registered `resolver`
    ///         (a MADDisputeVoting instance, once one is set) — either can
    ///         supply any finalOutcome; there's no special-casing of the
    ///         voting path here beyond who's allowed to call it.
    function resolveDispute(bytes32 questionId, int256 finalOutcome) external nonReentrant {
        if (msg.sender != owner() && msg.sender != resolver) revert NotAuthorizedResolver();
        Assertion storage a = assertions[questionId];
        if (a.status != Status.Disputed) revert NotDisputed();

        bool asserterWon = (finalOutcome == a.proposedOutcome);
        address winner = asserterWon ? a.asserter : a.disputer;

        uint256 pot = a.bond * 2; // both bonds held here
        uint256 fee = (a.bond * DISPUTE_FEE_BPS) / BPS_DENOMINATOR; // fee on the slashed bond
        uint256 payout = pot - fee;

        // Effects before interactions.
        a.status = Status.Resolved;
        a.settledOutcome = finalOutcome;
        a.asserterWon = asserterWon;

        emit DisputeResolved(questionId, finalOutcome, winner, payout);

        if (fee > 0) bondToken.safeTransfer(treasury, fee);
        bondToken.safeTransfer(winner, payout);
    }

    /* ─────────────────────────── admin ─────────────────────────── */

    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert ZeroAddress();
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }

    function setDefaultLiveness(uint64 _liveness) external onlyOwner {
        defaultLiveness = _liveness;
        emit LivenessUpdated(_liveness);
    }

    function setMinBond(uint256 _minBond) external onlyOwner {
        minBond = _minBond;
        emit MinBondUpdated(_minBond);
    }

    /// @notice Set (or clear, via address(0)) the second authorized resolver.
    ///         The owner's own resolve path is never affected by this either way.
    function setResolver(address _resolver) external onlyOwner {
        resolver = _resolver;
        emit ResolverUpdated(_resolver);
    }
}
