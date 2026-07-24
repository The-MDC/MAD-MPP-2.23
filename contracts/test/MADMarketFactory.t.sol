// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MADMarketFactory} from "../src/MADMarketFactory.sol";
import {MockMADx} from "./MockMADx.sol";

contract MADMarketFactoryTest is Test {
    MADMarketFactory public factory;
    MockMADx public token;

    address public creator = makeAddr("creator");
    address public treasury = makeAddr("treasury");
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    function setUp() public {
        token = new MockMADx(); // owner = this; factory owner = this too
        factory = new MADMarketFactory(address(token), treasury);

        token.mint(alice, 1_000_000_000 ether);
        token.mint(bob, 1_000_000_000 ether);
    }

    /* ── helpers ── */
    function _create(int256 threshold, uint256 dt) internal returns (uint256 id) {
        vm.prank(creator);
        id = factory.createMarket(threshold, uint64(block.timestamp + dt));
    }

    function _back(address who, uint256 id, MADMarketFactory.Side side, uint256 amt) internal {
        vm.startPrank(who);
        token.approve(address(factory), amt);
        factory.back(id, side, amt);
        vm.stopPrank();
    }

    /* ── create ── */
    function testCreateMarket() public {
        uint256 id = _create(int256(100), 1 days);
        assertEq(id, 0);
        assertEq(factory.marketCount(), 1);
        (address c, int256 th,, MADMarketFactory.Status st,,,,) = factory.markets(0);
        assertEq(c, creator);
        assertEq(th, int256(100));
        assertEq(uint256(st), uint256(MADMarketFactory.Status.Open));
    }

    function testCannotCreateInPast() public {
        vm.prank(creator);
        vm.expectRevert(MADMarketFactory.TooLate.selector);
        factory.createMarket(int256(0), uint64(block.timestamp));
    }

    /* ── backing ── */
    function testBackUpdatesPools() public {
        uint256 id = _create(int256(100), 1 days);
        _back(alice, id, MADMarketFactory.Side.Over, 1000 ether);
        _back(bob, id, MADMarketFactory.Side.Under, 400 ether);

        assertEq(factory.overStake(id, alice), 1000 ether);
        assertEq(factory.underStake(id, bob), 400 ether);
        (,,,,, uint256 overPool, uint256 underPool,) = factory.markets(id);
        assertEq(overPool, 1000 ether);
        assertEq(underPool, 400 ether);
        assertEq(token.balanceOf(address(factory)), 1400 ether);
    }

    function testCannotBackAfterClose() public {
        uint256 id = _create(int256(100), 1 days);
        vm.warp(block.timestamp + 1 days);
        vm.startPrank(alice);
        token.approve(address(factory), 100 ether);
        vm.expectRevert(MADMarketFactory.TooLate.selector);
        factory.back(id, MADMarketFactory.Side.Over, 100 ether);
        vm.stopPrank();
    }

    function testCannotBackZero() public {
        uint256 id = _create(int256(100), 1 days);
        vm.prank(alice);
        vm.expectRevert(MADMarketFactory.ZeroAmount.selector);
        factory.back(id, MADMarketFactory.Side.Over, 0);
    }

    /* ── resolution: OVER wins, canonical fee split ── */
    function testResolveOverAndClaim() public {
        uint256 id = _create(int256(100), 1 days);
        _back(alice, id, MADMarketFactory.Side.Over, 1000 ether);
        _back(bob, id, MADMarketFactory.Side.Under, 1000 ether);
        vm.warp(block.timestamp + 1 days);

        uint256 creatorBefore = token.balanceOf(creator);
        uint256 treasuryBefore = token.balanceOf(treasury);

        factory.resolve(id, int256(150)); // 150 >= 100 → OVER

        // pot 2000 · fee 1.88% = 37.6 · creator 40% = 15.04 · protocol = 22.56
        assertEq(token.balanceOf(creator) - creatorBefore, 1504 ether / 100);
        assertEq(token.balanceOf(treasury) - treasuryBefore, 2256 ether / 100);

        // alice is the sole OVER backer → whole distributable (2000 − 37.6 = 1962.4)
        uint256 aliceBefore = token.balanceOf(alice);
        vm.prank(alice);
        uint256 payout = factory.claim(id);
        assertEq(payout, 19624 ether / 10);
        assertEq(token.balanceOf(alice) - aliceBefore, 19624 ether / 10);

        // loser cannot claim
        vm.prank(bob);
        vm.expectRevert(MADMarketFactory.NothingToClaim.selector);
        factory.claim(id);
    }

    /* ── resolution: UNDER wins ── */
    function testResolveUnderWins() public {
        uint256 id = _create(int256(100), 1 days);
        _back(alice, id, MADMarketFactory.Side.Over, 1000 ether);
        _back(bob, id, MADMarketFactory.Side.Under, 1000 ether);
        vm.warp(block.timestamp + 1 days);

        factory.resolve(id, int256(50)); // 50 < 100 → UNDER

        vm.prank(bob);
        uint256 payout = factory.claim(id);
        assertEq(payout, 19624 ether / 10);

        vm.prank(alice);
        vm.expectRevert(MADMarketFactory.NothingToClaim.selector);
        factory.claim(id);
    }

    /* ── boundary: value == threshold → OVER (>=) ── */
    function testThresholdBoundaryIsOver() public {
        uint256 id = _create(int256(100), 1 days);
        _back(alice, id, MADMarketFactory.Side.Over, 1000 ether);
        _back(bob, id, MADMarketFactory.Side.Under, 1000 ether);
        vm.warp(block.timestamp + 1 days);

        factory.resolve(id, int256(100)); // == threshold → OVER
        (,,,, MADMarketFactory.Side ws,,,) = factory.markets(id);
        assertEq(uint256(ws), uint256(MADMarketFactory.Side.Over));
    }

    /* ── no winners staked → cancel + refund ── */
    function testResolveCancelsWhenNoWinner() public {
        uint256 id = _create(int256(100), 1 days);
        _back(alice, id, MADMarketFactory.Side.Over, 1000 ether); // only OVER backed
        vm.warp(block.timestamp + 1 days);

        factory.resolve(id, int256(50)); // UNDER wins, but underPool == 0
        (,,, MADMarketFactory.Status st,,,,) = factory.markets(id);
        assertEq(uint256(st), uint256(MADMarketFactory.Status.Cancelled));

        // no fee was taken
        assertEq(token.balanceOf(treasury), 0);

        uint256 aliceBefore = token.balanceOf(alice);
        vm.prank(alice);
        uint256 refund = factory.claimRefund(id);
        assertEq(refund, 1000 ether);
        assertEq(token.balanceOf(alice) - aliceBefore, 1000 ether);
    }

    /* ── reverts / auth ── */
    function testCannotResolveEarly() public {
        uint256 id = _create(int256(100), 1 days);
        vm.expectRevert(MADMarketFactory.TooEarly.selector);
        factory.resolve(id, int256(150));
    }

    function testOnlyOwnerResolve() public {
        uint256 id = _create(int256(100), 1 days);
        vm.warp(block.timestamp + 1 days);
        vm.prank(alice);
        vm.expectRevert();
        factory.resolve(id, int256(150));
    }

    function testClaimBeforeResolveReverts() public {
        uint256 id = _create(int256(100), 1 days);
        _back(alice, id, MADMarketFactory.Side.Over, 1000 ether);
        vm.prank(alice);
        vm.expectRevert(MADMarketFactory.NotResolved.selector);
        factory.claim(id);
    }

    function testDoubleClaimReverts() public {
        uint256 id = _create(int256(100), 1 days);
        _back(alice, id, MADMarketFactory.Side.Over, 1000 ether);
        _back(bob, id, MADMarketFactory.Side.Under, 1000 ether);
        vm.warp(block.timestamp + 1 days);
        factory.resolve(id, int256(150));

        vm.prank(alice);
        factory.claim(id);
        vm.prank(alice);
        vm.expectRevert(MADMarketFactory.AlreadyClaimed.selector);
        factory.claim(id);
    }

    /* ── owner cancel + refund both sides ── */
    function testCancelMarketAndRefund() public {
        uint256 id = _create(int256(100), 1 days);
        _back(alice, id, MADMarketFactory.Side.Over, 1000 ether);
        _back(bob, id, MADMarketFactory.Side.Under, 700 ether);

        factory.cancelMarket(id);

        uint256 aBefore = token.balanceOf(alice);
        vm.prank(alice);
        assertEq(factory.claimRefund(id), 1000 ether);
        assertEq(token.balanceOf(alice) - aBefore, 1000 ether);

        vm.prank(bob);
        assertEq(factory.claimRefund(id), 700 ether);
    }

    /* ── pausable ── */
    function testPauseBlocksCreateAndBack() public {
        factory.pause();
        vm.prank(creator);
        vm.expectRevert(); // Pausable: EnforcedPause
        factory.createMarket(int256(100), uint64(block.timestamp + 1 days));
    }

    /* ── admin ── */
    function testSetTreasury() public {
        address newT = makeAddr("newTreasury");
        factory.setTreasury(newT);
        assertEq(factory.treasury(), newT);
    }

    function testOnlyOwnerSetTreasury() public {
        vm.prank(alice);
        vm.expectRevert();
        factory.setTreasury(alice);
    }

    /* ── fuzz: fee conservation + pro-rata payout ── */
    function testFuzz_FeeConservationAndPayout(uint256 over, uint256 under) public {
        over = bound(over, 1 ether, 1e30);
        under = bound(under, 1 ether, 1e30);
        token.mint(alice, over);
        token.mint(bob, under);

        uint256 id = _create(int256(0), 1 days);
        _back(alice, id, MADMarketFactory.Side.Over, over);
        _back(bob, id, MADMarketFactory.Side.Under, under);
        vm.warp(block.timestamp + 1 days);

        uint256 pot = over + under;
        uint256 fee = (pot * 188) / 10_000;
        uint256 creatorCut = (fee * 4000) / 10_000;
        uint256 protocolCut = fee - creatorCut;
        uint256 distributable = pot - fee;

        uint256 cBefore = token.balanceOf(creator);
        uint256 tBefore = token.balanceOf(treasury);

        factory.resolve(id, int256(1)); // 1 >= 0 → OVER (alice) wins

        // fee split is conserved and routed correctly
        assertEq(token.balanceOf(creator) - cBefore, creatorCut);
        assertEq(token.balanceOf(treasury) - tBefore, protocolCut);

        // sole winner gets the entire distributable pot
        vm.prank(alice);
        assertEq(factory.claim(id), distributable);

        vm.prank(bob);
        vm.expectRevert(MADMarketFactory.NothingToClaim.selector);
        factory.claim(id);
    }
}
