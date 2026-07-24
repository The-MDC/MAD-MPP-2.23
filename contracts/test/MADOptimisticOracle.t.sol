// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MADOptimisticOracle} from "../src/MADOptimisticOracle.sol";
import {MockMADx} from "./MockMADx.sol";

contract MADOptimisticOracleTest is Test {
    MADOptimisticOracle public oracle;
    MockMADx public token;

    address public treasury = makeAddr("treasury");
    address public asserter = makeAddr("asserter");
    address public disputer = makeAddr("disputer");

    bytes32 constant Q = keccak256("Will X happen by T?");

    function setUp() public {
        token = new MockMADx(); // owner = this; oracle owner = this
        oracle = new MADOptimisticOracle(address(token), treasury);
        token.mint(asserter, 1_000_000 ether);
        token.mint(disputer, 1_000_000 ether);
    }

    function _assert(address who, int256 outcome, uint256 bond) internal {
        vm.startPrank(who);
        token.approve(address(oracle), bond);
        oracle.assertOutcome(Q, outcome, bond);
        vm.stopPrank();
    }

    function _dispute(address who, uint256 bond) internal {
        vm.startPrank(who);
        token.approve(address(oracle), bond);
        oracle.dispute(Q);
        vm.stopPrank();
    }

    /* ── undisputed happy path ── */
    function testAssertSettleUndisputed() public {
        _assert(asserter, int256(1), 1000 ether);
        (bool resolved,) = oracle.getResolvedOutcome(Q);
        assertFalse(resolved);

        vm.warp(block.timestamp + 2 hours);
        uint256 before = token.balanceOf(asserter);
        oracle.settle(Q);

        (bool r, int256 o) = oracle.getResolvedOutcome(Q);
        assertTrue(r);
        assertEq(o, int256(1));
        assertEq(token.balanceOf(asserter) - before, 1000 ether); // bond returned
    }

    function testCannotSettleBeforeLiveness() public {
        _assert(asserter, int256(1), 1000 ether);
        vm.expectRevert(MADOptimisticOracle.TooEarly.selector);
        oracle.settle(Q);
    }

    /* ── dispute: asserter proven right ── */
    function testDisputeAsserterWins() public {
        _assert(asserter, int256(1), 1000 ether);
        _dispute(disputer, 1000 ether);

        uint256 aBefore = token.balanceOf(asserter);
        oracle.resolveDispute(Q, int256(1)); // truth == asserter's proposal

        uint256 fee = (1000 ether * 188) / 10_000; // 18.8
        uint256 payout = 2000 ether - fee; // winner takes both bonds minus fee
        assertEq(token.balanceOf(asserter) - aBefore, payout);
        assertEq(token.balanceOf(treasury), fee);

        (bool r, int256 o) = oracle.getResolvedOutcome(Q);
        assertTrue(r);
        assertEq(o, int256(1));
    }

    /* ── dispute: disputer proven right ── */
    function testDisputeDisputerWins() public {
        _assert(asserter, int256(1), 1000 ether);
        _dispute(disputer, 1000 ether);

        uint256 dBefore = token.balanceOf(disputer);
        oracle.resolveDispute(Q, int256(2)); // truth != asserter's proposal

        uint256 fee = (1000 ether * 188) / 10_000;
        assertEq(token.balanceOf(disputer) - dBefore, 2000 ether - fee);
        assertEq(token.balanceOf(treasury), fee);
        (, int256 o) = oracle.getResolvedOutcome(Q);
        assertEq(o, int256(2));
    }

    /* ── window / auth / state guards ── */
    function testCannotDisputeAfterWindow() public {
        _assert(asserter, int256(1), 1000 ether);
        vm.warp(block.timestamp + 2 hours);
        vm.startPrank(disputer);
        token.approve(address(oracle), 1000 ether);
        vm.expectRevert(MADOptimisticOracle.WindowClosed.selector);
        oracle.dispute(Q);
        vm.stopPrank();
    }

    function testCannotSelfDispute() public {
        _assert(asserter, int256(1), 1000 ether);
        vm.startPrank(asserter);
        token.approve(address(oracle), 1000 ether);
        vm.expectRevert(MADOptimisticOracle.SelfDispute.selector);
        oracle.dispute(Q);
        vm.stopPrank();
    }

    function testCannotDisputeTwice() public {
        _assert(asserter, int256(1), 1000 ether);
        _dispute(disputer, 1000 ether);
        vm.prank(disputer);
        vm.expectRevert(MADOptimisticOracle.NotDisputable.selector);
        oracle.dispute(Q);
    }

    function testOnlyOwnerResolveDispute() public {
        _assert(asserter, int256(1), 1000 ether);
        _dispute(disputer, 1000 ether);
        vm.prank(asserter);
        vm.expectRevert();
        oracle.resolveDispute(Q, int256(1));
    }

    function testCannotResolveUndisputed() public {
        _assert(asserter, int256(1), 1000 ether);
        vm.expectRevert(MADOptimisticOracle.NotDisputed.selector);
        oracle.resolveDispute(Q, int256(1));
    }

    function testBondTooLow() public {
        vm.prank(asserter);
        vm.expectRevert(MADOptimisticOracle.BondTooLow.selector);
        oracle.assertOutcome(Q, int256(1), 0);

        oracle.setMinBond(500 ether);
        vm.startPrank(asserter);
        token.approve(address(oracle), 100 ether);
        vm.expectRevert(MADOptimisticOracle.BondTooLow.selector);
        oracle.assertOutcome(Q, int256(1), 100 ether);
        vm.stopPrank();
    }

    /* ── fuzz: bond conservation on a resolved dispute ── */
    function testFuzz_DisputeBondConservation(uint256 bond, bool asserterRight) public {
        bond = bound(bond, 1 ether, 1e30);
        token.mint(asserter, bond);
        token.mint(disputer, bond);

        _assert(asserter, int256(1), bond);
        _dispute(disputer, bond);

        uint256 fee = (bond * 188) / 10_000;
        uint256 payout = bond * 2 - fee;
        address winner = asserterRight ? asserter : disputer;
        uint256 wBefore = token.balanceOf(winner);

        oracle.resolveDispute(Q, asserterRight ? int256(1) : int256(999));

        // winner payout + treasury fee == the whole 2-bond pot (conserved)
        assertEq(token.balanceOf(winner) - wBefore, payout);
        assertEq(token.balanceOf(treasury), fee);
        assertEq(payout + fee, bond * 2);
    }
}
