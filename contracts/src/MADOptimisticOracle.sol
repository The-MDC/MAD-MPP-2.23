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
 *           3. dispute(q) within the window (matching bond) escalates to the
 *              resolver (owner / DVM in v1), who supplies the final outcome via
 *              resolveDispute(q, finalOutcome). The party whose value matches
 *              truth wins BOTH bonds minus a protocol fee; the loser is slashed.
 *
 *         Consumers (e.g. MADMarketFactory) read getResolvedOutcome(q).
 *
 *         Honest scope: escalation is resolver(owner)-adjudicated in v1 — NOT
 *         yet a decentralized $MADx token-holder (schelling) vote. Decentralizing
 *         the DVM is the documented next step. Legs 1–3 of the quadruple oracle
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
    }

    mapping(bytes32 => Assertion) public assertions;

    uint64 public defaultLiveness = 2 hours;
    uint256 public minBond;

    event Asserted(bytes32 indexed questionId, address indexed asserter, int256 outcome, uint256 bond);
    event Disputed(bytes32 indexed questionId, address indexed disputer);
    event Settled(bytes32 indexed questionId, int256 outcome, address indexed asserter);
    event DisputeResolved(bytes32 indexed questionId, int256 finalOutcome, address indexed winner, uint256 payout);
    event TreasuryUpdated(address indexed treasury);
    event LivenessUpdated(uint64 liveness);
    event MinBondUpdated(uint256 minBond);

    error ZeroAddress();
    error BondTooLow();
    error AlreadyAsserted();
    error NotDisputable();
    error WindowClosed();
    error SelfDispute();
    error NotSettleable();
    error TooEarly();
    error NotDisputed();

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

    function dispute(bytes32 questionId) external nonReentrant {
        Assertion storage a = assertions[questionId];
        if (a.status != Status.Asserted) revert NotDisputable();
        if (block.timestamp >= uint256(a.assertedAt) + uint256(a.liveness)) revert WindowClosed();
        if (msg.sender == a.asserter) revert SelfDispute();

        a.disputer = msg.sender;
        a.status = Status.Disputed;

        bondToken.safeTransferFrom(msg.sender, address(this), a.bond); // matching bond
        emit Disputed(questionId, msg.sender);
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
    function resolveDispute(bytes32 questionId, int256 finalOutcome) external onlyOwner nonReentrant {
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
}
