// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ERC2771Forwarder} from "@openzeppelin/contracts/metatx/ERC2771Forwarder.sol";
import {MADOptimisticOracle} from "../src/MADOptimisticOracle.sol";
import {MADStaking} from "../src/MADStaking.sol";
import {MADDisputeVoting} from "../src/MADDisputeVoting.sol";
import {MockMADx} from "./MockMADx.sol";

contract MADDisputeVotingTest is Test {
    MockMADx public token;
    ERC2771Forwarder public forwarder;
    MADOptimisticOracle public oracle;
    MADStaking public staking;
    MADDisputeVoting public voting;

    address public treasury = makeAddr("treasury");
    address public asserter = makeAddr("asserter");
    address public disputer = makeAddr("disputer");
    address public staker1 = makeAddr("staker1"); // votes Asserter
    address public staker2 = makeAddr("staker2"); // votes Disputer
    address public staker3 = makeAddr("staker3"); // stays silent — not enough alone for quorum

    bytes32 constant Q = keccak256("Will X happen by T?");
    uint256 constant VOTE_THRESHOLD = 5_000 ether;
    uint256 constant BIG_BOND = 10_000 ether; // clears the threshold
    uint256 constant SMALL_BOND = 1_000 ether; // does not

    function setUp() public {
        token = new MockMADx();
        forwarder = new ERC2771Forwarder("Test Forwarder");
        oracle = new MADOptimisticOracle(address(token), treasury);
        staking = new MADStaking(address(token), address(forwarder));
        voting = new MADDisputeVoting(address(oracle), address(staking), VOTE_THRESHOLD, address(forwarder));
        oracle.setResolver(address(voting));

        token.mint(asserter, 1_000_000 ether);
        token.mint(disputer, 1_000_000 ether);
        token.mint(staker1, 1_000_000 ether);
        token.mint(staker2, 1_000_000 ether);
        token.mint(staker3, 1_000_000 ether);

        // staker1: 6,000 staked. staker2: 5,000 staked. staker3: 1,000 staked
        // (present so quorum math has a real denominator to divide by).
        _stake(staker1, 6_000 ether);
        _stake(staker2, 5_000 ether);
        _stake(staker3, 1_000 ether);
        // totalStaked = 12,000. quorumBps default 500 (5%) => 600 needed to bind.
    }

    function _stake(address who, uint256 amount) internal {
        vm.startPrank(who);
        token.approve(address(staking), amount);
        staking.stake(amount);
        vm.stopPrank();
    }

    function _assertAndDispute(uint256 bond) internal {
        vm.startPrank(asserter);
        token.approve(address(oracle), bond);
        oracle.assertOutcome(Q, int256(1), bond);
        vm.stopPrank();

        vm.startPrank(disputer);
        token.approve(address(oracle), bond);
        oracle.dispute(Q, int256(2)); // disputer's counter-claim
        vm.stopPrank();
    }

    function _commit(address voter, MADDisputeVoting.Side side, bytes32 salt) internal {
        bytes32 hash = keccak256(abi.encodePacked(side, salt, voter));
        vm.prank(voter);
        voting.commitVote(Q, hash);
    }

    /* ── threshold gate ── */

    function testCannotOpenVoteBelowThreshold() public {
        _assertAndDispute(SMALL_BOND);
        vm.expectRevert(MADDisputeVoting.BondBelowThreshold.selector);
        voting.openVote(Q);
    }

    function testCannotOpenVoteWhenNotDisputed() public {
        vm.startPrank(asserter);
        token.approve(address(oracle), BIG_BOND);
        oracle.assertOutcome(Q, int256(1), BIG_BOND);
        vm.stopPrank();
        // never disputed
        vm.expectRevert(MADDisputeVoting.QuestionNotDisputed.selector);
        voting.openVote(Q);
    }

    /* ── happy path: quorum met, disputer's side wins ── */

    function testQuorumMetResolvesViaVoting() public {
        _assertAndDispute(BIG_BOND);
        voting.openVote(Q);

        bytes32 saltA = keccak256("a");
        bytes32 saltB = keccak256("b");
        // staker1 (6,000) votes Asserter, staker2 (5,000) votes Disputer —
        // Disputer would need more weight to win; let's make staker2 the
        // larger side instead so we exercise the Disputer-wins path clearly.
        _commit(staker1, MADDisputeVoting.Side.Disputer, saltA);
        _commit(staker2, MADDisputeVoting.Side.Disputer, saltB);

        vm.warp(block.timestamp + voting.commitWindow() + 1);

        vm.prank(staker1);
        voting.revealVote(Q, MADDisputeVoting.Side.Disputer, saltA);
        vm.prank(staker2);
        voting.revealVote(Q, MADDisputeVoting.Side.Disputer, saltB);
        // staker3 never reveals — fine, quorum is already cleared by 1+2.

        vm.warp(block.timestamp + voting.revealWindow() + 1);

        uint256 dBefore = token.balanceOf(disputer);
        voting.finalize(Q);

        (bool resolved, int256 outcome) = oracle.getResolvedOutcome(Q);
        assertTrue(resolved);
        assertEq(outcome, int256(2)); // disputer's counter-claim won
        uint256 fee = (BIG_BOND * 188) / 10_000;
        assertEq(token.balanceOf(disputer) - dBefore, BIG_BOND * 2 - fee);
    }

    /* ── quorum not met: finalize is a no-op, owner fallback still works ── */

    function testQuorumNotMetFallsBackToOwner() public {
        _assertAndDispute(BIG_BOND);
        voting.openVote(Q);

        // Nobody commits or reveals — participating weight is 0 of 12,000
        // staked, well under the 5% quorum bar.
        vm.warp(block.timestamp + voting.commitWindow() + voting.revealWindow() + 2);

        voting.finalize(Q); // no-op, no revert — quorum not met

        (bool resolvedBefore, ) = oracle.getResolvedOutcome(Q);
        assertFalse(resolvedBefore);

        // Owner's original path is untouched and still works.
        uint256 aBefore = token.balanceOf(asserter);
        oracle.resolveDispute(Q, int256(1)); // owner (test contract) resolves directly
        (bool resolved, int256 outcome) = oracle.getResolvedOutcome(Q);
        assertTrue(resolved);
        assertEq(outcome, int256(1));
        uint256 fee = (BIG_BOND * 188) / 10_000;
        assertEq(token.balanceOf(asserter) - aBefore, BIG_BOND * 2 - fee);
    }

    /* ── commit-reveal integrity ── */

    function testCannotRevealWithWrongSalt() public {
        _assertAndDispute(BIG_BOND);
        voting.openVote(Q);

        bytes32 salt = keccak256("real-salt");
        _commit(staker1, MADDisputeVoting.Side.Asserter, salt);

        vm.warp(block.timestamp + voting.commitWindow() + 1);
        vm.prank(staker1);
        vm.expectRevert(MADDisputeVoting.BadReveal.selector);
        voting.revealVote(Q, MADDisputeVoting.Side.Asserter, keccak256("wrong-salt"));
    }

    function testCannotRevealTwice() public {
        _assertAndDispute(BIG_BOND);
        voting.openVote(Q);

        bytes32 salt = keccak256("s");
        _commit(staker1, MADDisputeVoting.Side.Asserter, salt);

        vm.warp(block.timestamp + voting.commitWindow() + 1);
        vm.startPrank(staker1);
        voting.revealVote(Q, MADDisputeVoting.Side.Asserter, salt);
        vm.expectRevert(MADDisputeVoting.AlreadyRevealed.selector);
        voting.revealVote(Q, MADDisputeVoting.Side.Asserter, salt);
        vm.stopPrank();
    }

    function testCannotCommitWithoutStake() public {
        _assertAndDispute(BIG_BOND);
        voting.openVote(Q);

        address noStake = makeAddr("noStake");
        bytes32 hash = keccak256(abi.encodePacked(MADDisputeVoting.Side.Asserter, bytes32(0), noStake));
        vm.prank(noStake);
        vm.expectRevert(MADDisputeVoting.NoStake.selector);
        voting.commitVote(Q, hash);
    }

    function testCannotFinalizeWhileRevealing() public {
        _assertAndDispute(BIG_BOND);
        voting.openVote(Q);
        vm.warp(block.timestamp + voting.commitWindow() + 1); // reveal open, not yet closed
        vm.expectRevert(MADDisputeVoting.StillRevealing.selector);
        voting.finalize(Q);
    }

    /// @notice The owner's direct path was never routed through this contract
    ///         at all — resolveDispute stays callable by owner regardless of
    ///         whether a vote was ever opened.
    function testOwnerCanStillResolveDirectlyEvenWithVotingDeployed() public {
        _assertAndDispute(BIG_BOND);
        // No openVote() call at all.
        uint256 aBefore = token.balanceOf(asserter);
        oracle.resolveDispute(Q, int256(1));
        assertGt(token.balanceOf(asserter), aBefore);
    }
}
