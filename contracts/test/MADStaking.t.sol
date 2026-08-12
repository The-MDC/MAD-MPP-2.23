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

    /* ── tier boundaries mirror STAKING_TIERS exactly ── */
    function testApyTierBoundaries() public view {
        assertEq(staking.apyBpsFor(99 * 1e18), 0);
        assertEq(staking.apyBpsFor(100 * 1e18), 1_200); // Bronze
        assertEq(staking.apyBpsFor(500 * 1e18), 1_800); // Silver
        assertEq(staking.apyBpsFor(2_500 * 1e18), 2_800); // Gold
        assertEq(staking.apyBpsFor(10_000 * 1e18), 4_200); // Platinum
        assertEq(staking.apyBpsFor(50_000 * 1e18), 5_800); // Diamond
        assertEq(staking.apyBpsFor(100_000 * 1e18), 6_800); // MAD Tier
        assertEq(staking.tierFor(100_000 * 1e18), 6);
        assertEq(staking.tierFor(50 * 1e18), 0);
    }

    function testStakeUpdatesBalanceAndTotal() public {
        _stake(alice, 2_500 * 1e18);
        (uint256 amount,,) = staking.stakes(alice);
        assertEq(amount, 2_500 * 1e18);
        assertEq(staking.totalStaked(), 2_500 * 1e18);
    }

    /* ── Gold tier: 2,500 MADx @ 28% APY for one year → 700 MADx ── */
    function testRewardAccrualOneYear() public {
        _stake(alice, 2_500 * 1e18);
        vm.warp(block.timestamp + 365 days);
        uint256 pending = staking.pendingRewards(alice);
        assertApproxEqAbs(pending, 700 * 1e18, 1e15);
    }

    function testClaimTransfersRewardsFromReserve() public {
        _stake(alice, 10_000 * 1e18); // Platinum, 42%
        vm.warp(block.timestamp + 365 days);

        uint256 balBefore = token.balanceOf(alice);
        uint256 reserveBefore = staking.rewardReserve();

        vm.prank(alice);
        uint256 reward = staking.claim();

        assertApproxEqAbs(reward, 4_200 * 1e18, 1e16); // 42% of 10k
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
