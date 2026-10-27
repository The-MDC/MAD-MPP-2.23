// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ERC2771Forwarder} from "@openzeppelin/contracts/metatx/ERC2771Forwarder.sol";
import {MADStaking} from "../src/MADStaking.sol";
import {MockMADx} from "./MockMADx.sol";

contract MADStakingTest is Test {
    MADStaking public staking;
    MockMADx public token;
    ERC2771Forwarder public forwarder;

    address public owner = address(0x1);
    address public alice = address(0xA);
    address public bob = address(0xB);

    function setUp() public {
        vm.prank(owner);
        token = new MockMADx();

        forwarder = new ERC2771Forwarder("Test Forwarder");

        vm.prank(owner);
        staking = new MADStaking(address(token), address(forwarder));

        token.mint(alice, 1_000_000 * 1e18);
        token.mint(bob, 1_000_000 * 1e18);
        token.mint(owner, 10_000_000 * 1e18);

        // Owner seeds the reward reserve.
        vm.startPrank(owner);
        token.approve(address(staking), type(uint256).max);
        staking.fundRewards(1_000_000 * 1e18);
        vm.stopPrank();
    }

    function _stake(address who, uint256 amount) internal {
        vm.startPrank(who);
        token.approve(address(staking), amount);
        staking.stake(amount);
        vm.stopPrank();
    }

    /* ── tier boundaries mirror the 4-tier STAKING_TIERS canon exactly ── */
    function testApyTierBoundaries() public view {
        assertEq(staking.apyBpsFor(87 * 1e18), 0);
        assertEq(staking.apyBpsFor(88 * 1e18), 880); // Bronze, 8.8%
        assertEq(staking.apyBpsFor(888 * 1e18), 1_880); // Silver, 18.8%
        assertEq(staking.apyBpsFor(8_888 * 1e18), 2_880); // Gold, 28.8%
        assertEq(staking.apyBpsFor(88_888 * 1e18), 3_880); // MAD Tier, 38.8%
        assertEq(staking.tierFor(88_888 * 1e18), 4);
        assertEq(staking.tierFor(50 * 1e18), 0);
    }

    function testStakeUpdatesBalanceAndTotal() public {
        _stake(alice, 2_500 * 1e18);
        (uint256 amount,,) = staking.stakes(alice);
        assertEq(amount, 2_500 * 1e18);
        assertEq(staking.totalStaked(), 2_500 * 1e18);
    }

    /* ── Silver tier: 2,500 MADx @ 18.8% APY for one year → 470 MADx ── */
    function testRewardAccrualOneYear() public {
        _stake(alice, 2_500 * 1e18);
        vm.warp(block.timestamp + 365 days);
        uint256 pending = staking.pendingRewards(alice);
        assertApproxEqAbs(pending, 470 * 1e18, 1e15);
    }

    function testClaimTransfersRewardsFromReserve() public {
        _stake(alice, 10_000 * 1e18); // Gold, 28.8%
        vm.warp(block.timestamp + 365 days);

        uint256 balBefore = token.balanceOf(alice);
        uint256 reserveBefore = staking.rewardReserve();

        vm.prank(alice);
        uint256 reward = staking.claim();

        assertApproxEqAbs(reward, 2_880 * 1e18, 1e16); // 28.8% of 10k
        assertEq(token.balanceOf(alice), balBefore + reward);
        assertEq(staking.rewardReserve(), reserveBefore - reward);

        // principal untouched
        (uint256 amount,,) = staking.stakes(alice);
        assertEq(amount, 10_000 * 1e18);
    }

    function testUnstakeReturnsPrincipalAndKeepsRewards() public {
        _stake(alice, 5_000 * 1e18);
        vm.warp(block.timestamp + 180 days);

        uint256 pendingBefore = staking.pendingRewards(alice);
        vm.prank(alice);
        staking.unstake(5_000 * 1e18);

        (uint256 amount, uint256 accrued,) = staking.stakes(alice);
        assertEq(amount, 0);
        assertEq(staking.totalStaked(), 0);
        assertApproxEqAbs(accrued, pendingBefore, 1e12);
    }

    function testCannotUnstakeMoreThanStaked() public {
        _stake(alice, 100 * 1e18);
        vm.prank(alice);
        vm.expectRevert(MADStaking.InsufficientStake.selector);
        staking.unstake(200 * 1e18);
    }

    function testClaimRevertsWithNoRewards() public {
        vm.prank(bob);
        vm.expectRevert(MADStaking.ZeroAmount.selector);
        staking.claim();
    }

    function testOnlyOwnerWithdrawsReserve() public {
        vm.prank(alice);
        vm.expectRevert();
        staking.withdrawRewardReserve(alice, 1e18);
    }

    /// @dev Staked principal is never drained to pay rewards.
    function testRewardReserveIsolatedFromPrincipal() public {
        _stake(alice, 1_000 * 1e18);
        uint256 contractBal = token.balanceOf(address(staking));
        // reserve (1,000,000) + alice principal (1,000)
        assertEq(contractBal, 1_001_000 * 1e18);
        assertEq(staking.rewardReserve(), 1_000_000 * 1e18);
        assertEq(staking.totalStaked(), 1_000 * 1e18);
    }
}
