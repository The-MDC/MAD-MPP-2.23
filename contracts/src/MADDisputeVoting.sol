// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC2771Context} from "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {MADOptimisticOracle} from "./MADOptimisticOracle.sol";
import {MADStaking} from "./MADStaking.sol";

/**
 * @title MADDisputeVoting
 * @notice Phase A of decentralizing MADOptimisticOracle's dispute resolution.
 *
 *         WHY A SEPARATE CONTRACT, NOT LOGIC INSIDE THE ORACLE: the oracle
 *         holds bonds and moves money; voting is coordination and tallying.
 *         Keeping them apart means this contract holds no tokens and no
 *         custody risk — the worst this contract can do if something's wrong
 *         with it is supply a bad `finalOutcome` to a resolveDispute call the
 *         oracle would have accepted from anyone at `resolver` anyway. The
 *         oracle's own accounting (bond conservation, fee math) is untouched.
 *
 *         WHY THRESHOLD-GATED, NOT EVERY DISPUTE: most disputes will be small
 *         and uncontroversial. Routing every one of them through a 24h+12h
 *         commit-reveal process would make the common case slower for no
 *         reason, and — worse — if quorum is rarely cleared because most
 *         disputes are too small to attract voter attention, "decentralized
 *         resolution" becomes theater that always falls through to the owner
 *         anyway. Gating on bond size reserves the heavier process for
 *         disputes where the stakes actually justify deliberation.
 *
 *         WHY COMMIT-REVEAL: a plain public vote lets the last voter (often
 *         the largest staker) simply copy whichever side is ahead, which
 *         isn't a vote, it's an auction for who moves last. Commit-reveal
 *         hides every vote until all voting is closed.
 *
 *         WHY A QUORUM FALLBACK TO THE OWNER, NOT A REVERT: a vote that never
 *         reaches quorum must not leave the disputed market stuck forever —
 *         that would be strictly worse than today's instant owner-resolve.
 *         finalize() simply does nothing when quorum isn't met; the owner's
 *         existing resolveDispute path (unchanged, never gated by this
 *         contract) remains available the whole time.
 *
 *         NOT IN THIS VERSION (flagged, not forgotten): a voter-reward pool
 *         funded by a slice of the losing side's slashed bond, to properly
 *         incentivize participation via the Schelling-point mechanism rather
 *         than relying on stakers voting out of pure goodwill. Doing that
 *         correctly means threading a new split into the oracle's payout
 *         logic — real money-flow surgery on the contract that already
 *         guards the bonds, so it deserves its own review rather than
 *         riding in on this PR. Today, quorum is the only lever tuning
 *         participation; if it proves too low in practice, that's the
 *         signal to build the reward pool next, not to guess at its
 *         parameters now.
 */
contract MADDisputeVoting is Ownable, ERC2771Context {
    MADOptimisticOracle public immutable oracle;
    MADStaking public immutable staking;

    /// @notice Disputes with a bond below this never open a vote — the owner's
    ///         direct-resolve path is the only path for them, same as today.
    uint256 public voteThresholdBond;
    uint256 public commitWindow = 24 hours;
    uint256 public revealWindow = 12 hours;
    /// @notice Minimum share (bps of MADStaking.totalStaked at vote-open) of
    ///         weighted stake that must reveal for the vote to bind.
    uint256 public quorumBps = 500; // 5%
    uint256 public constant BPS_DENOMINATOR = 10_000;

    enum Side { None, Asserter, Disputer }

    struct Vote {
        uint64 commitDeadline;
        uint64 revealDeadline;
        uint256 stakeSnapshot;
        uint256 weightAsserter;
        uint256 weightDisputer;
        bool finalized;
    }

    mapping(bytes32 => Vote) public votes; // questionId => Vote
    mapping(bytes32 => mapping(address => bytes32)) public commitments;
    mapping(bytes32 => mapping(address => bool)) public hasRevealed;

    event VoteOpened(bytes32 indexed questionId, uint256 stakeSnapshot, uint64 commitDeadline, uint64 revealDeadline);
    event Committed(bytes32 indexed questionId, address indexed voter);
    event Revealed(bytes32 indexed questionId, address indexed voter, Side side, uint256 weight);
    event Finalized(bytes32 indexed questionId, bool quorumMet, Side winningSide, uint256 weightAsserter, uint256 weightDisputer);
    event ThresholdUpdated(uint256 voteThresholdBond);
    event WindowsUpdated(uint256 commitWindow, uint256 revealWindow);
    event QuorumUpdated(uint256 quorumBps);

    error BondBelowThreshold();
    error QuestionNotDisputed();
    error AlreadyOpen();
    error NotOpen();
    error CommitClosed();
    error RevealNotOpen();
    error RevealClosed();
    error AlreadyRevealed();
    error BadReveal();
    error NoStake();
    error StillRevealing();
    error AlreadyFinalized();
    error InvalidBps();

    constructor(address _oracle, address _staking, uint256 _voteThresholdBond, address trustedForwarder_)
        Ownable(msg.sender)
        ERC2771Context(trustedForwarder_)
    {
        oracle = MADOptimisticOracle(_oracle);
        staking = MADStaking(_staking);
        voteThresholdBond = _voteThresholdBond;
    }

    /* ─────────────────────────── vote lifecycle ─────────────────────────── */

    /// @notice Open a vote for a currently-disputed question. Permissionless —
    ///         the bond-size gate is the real permission check, not the caller.
    function openVote(bytes32 questionId) external {
        if (votes[questionId].commitDeadline != 0) revert AlreadyOpen();

        (, , , , uint256 bond, , , MADOptimisticOracle.Status status, , ) = oracle.assertions(questionId);
        if (status != MADOptimisticOracle.Status.Disputed) revert QuestionNotDisputed();
        if (bond < voteThresholdBond) revert BondBelowThreshold();

        uint256 snapshot = staking.totalStaked();
        uint64 commitDeadline = uint64(block.timestamp + commitWindow);
        uint64 revealDeadline = commitDeadline + uint64(revealWindow);

        votes[questionId] = Vote({
            commitDeadline: commitDeadline,
            revealDeadline: revealDeadline,
            stakeSnapshot: snapshot,
            weightAsserter: 0,
            weightDisputer: 0,
            finalized: false
        });

        emit VoteOpened(questionId, snapshot, commitDeadline, revealDeadline);
    }

    /// @notice Commit a hidden vote. `commitHash` must equal
    ///         `keccak256(abi.encodePacked(side, salt, msg.sender))` — binding
    ///         the voter's own address into the hash stops the commit being
    ///         front-run/replayed by anyone who observes it before reveal.
    function commitVote(bytes32 questionId, bytes32 commitHash) external {
        Vote storage v = votes[questionId];
        if (v.commitDeadline == 0) revert NotOpen();
        if (block.timestamp >= v.commitDeadline) revert CommitClosed();

        address voter = _msgSender();
        (uint256 stake, , ) = staking.stakes(voter);
        if (stake == 0) revert NoStake();

        commitments[questionId][voter] = commitHash;
        emit Committed(questionId, voter);
    }

    /// @notice Reveal a committed vote. Weight is the voter's CURRENT stake at
    ///         reveal time — quorum is measured against the snapshot taken at
    ///         openVote, so unstaking mid-vote only costs the unstaker their
    ///         own vote, it can't be used to manufacture or dodge quorum.
    function revealVote(bytes32 questionId, Side side, bytes32 salt) external {
        Vote storage v = votes[questionId];
        if (v.commitDeadline == 0) revert NotOpen();
        if (block.timestamp < v.commitDeadline) revert RevealNotOpen();
        if (block.timestamp >= v.revealDeadline) revert RevealClosed();

        address voter = _msgSender();
        if (hasRevealed[questionId][voter]) revert AlreadyRevealed();

        bytes32 expected = keccak256(abi.encodePacked(side, salt, voter));
        if (commitments[questionId][voter] != expected) revert BadReveal();

        (uint256 stake, , ) = staking.stakes(voter);
        hasRevealed[questionId][voter] = true;

        if (side == Side.Asserter) v.weightAsserter += stake;
        else if (side == Side.Disputer) v.weightDisputer += stake;

        emit Revealed(questionId, voter, side, stake);
    }

    /// @notice After reveal closes: if quorum was met, resolve the question on
    ///         the oracle with whichever side had more revealed weight. If
    ///         quorum wasn't met, this is a no-op — the owner's fallback path
    ///         resolves it instead, whenever someone calls it.
    function finalize(bytes32 questionId) external {
        Vote storage v = votes[questionId];
        if (v.commitDeadline == 0) revert NotOpen();
        if (block.timestamp < v.revealDeadline) revert StillRevealing();
        if (v.finalized) revert AlreadyFinalized();
        v.finalized = true;

        uint256 participating = v.weightAsserter + v.weightDisputer;
        bool quorumMet = v.stakeSnapshot > 0
            && (participating * BPS_DENOMINATOR) / v.stakeSnapshot >= quorumBps;

        if (!quorumMet) {
            emit Finalized(questionId, false, Side.None, v.weightAsserter, v.weightDisputer);
            return;
        }

        Side winner = v.weightAsserter >= v.weightDisputer ? Side.Asserter : Side.Disputer;
        emit Finalized(questionId, true, winner, v.weightAsserter, v.weightDisputer);

        (, , int256 proposedOutcome, , , , , , , int256 disputerOutcome) = oracle.assertions(questionId);
        oracle.resolveDispute(questionId, winner == Side.Asserter ? proposedOutcome : disputerOutcome);
    }

    /* ─────────────────────────── owner controls ─────────────────────────── */

    function setVoteThresholdBond(uint256 v) external onlyOwner {
        voteThresholdBond = v;
        emit ThresholdUpdated(v);
    }

    function setWindows(uint256 commitSeconds, uint256 revealSeconds) external onlyOwner {
        commitWindow = commitSeconds;
        revealWindow = revealSeconds;
        emit WindowsUpdated(commitSeconds, revealSeconds);
    }

    function setQuorumBps(uint256 bps) external onlyOwner {
        if (bps > BPS_DENOMINATOR) revert InvalidBps();
        quorumBps = bps;
        emit QuorumUpdated(bps);
    }

    /* ─────────────────────────── ERC-2771 diamond resolution ───────────── */

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
