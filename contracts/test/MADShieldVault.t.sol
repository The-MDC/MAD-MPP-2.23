// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ERC2771Forwarder} from "@openzeppelin/contracts/metatx/ERC2771Forwarder.sol";
import {MADShieldVault} from "../src/MADShieldVault.sol";
import {MockMADx} from "./MockMADx.sol";

contract MADShieldVaultTest is Test {
    MADShieldVault public vault;
    MockMADx public token;
    ERC2771Forwarder public forwarder;

    address public owner = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);

    function setUp() public {
        forwarder = new ERC2771Forwarder("Test Forwarder");

        vm.startPrank(owner);
        token = new MockMADx();
        vault = new MADShieldVault(address(token), address(forwarder));
        vm.stopPrank();

        // Deal some tokens to users
        token.mint(user1, 1_000_000 * 1e18);
        token.mint(user2, 1_000_000 * 1e18);
    }

    /// @notice Verify return window calculation values
    function testReturnWindow() public view {
        // $100 -> 2h
        assertEq(vault.calculateShieldReturnWindow(100 * 1e18), 2);
        // $5,000 -> 2h
        assertEq(vault.calculateShieldReturnWindow(5000 * 1e18), 2);
        // $10,000 -> 4h
        assertEq(vault.calculateShieldReturnWindow(10000 * 1e18), 4);
        // $50,000 -> 12h
        assertEq(vault.calculateShieldReturnWindow(50000 * 1e18), 12);
        // $110,000 -> 24h
        assertEq(vault.calculateShieldReturnWindow(110000 * 1e18), 24);
        // $200,000 -> 24h (clamped to max 24h)
        assertEq(vault.calculateShieldReturnWindow(200000 * 1e18), 24);
        // 0 -> 2h (clamped to min 2h)
        assertEq(vault.calculateShieldReturnWindow(0), 2);
    }

    /// @notice Fuzz test return window calculation bounds
    function testFuzzReturnWindow(uint256 amount) public view {
        uint256 window = vault.calculateShieldReturnWindow(amount);
        assertTrue(window >= 2);
        assertTrue(window <= 24);
    }

    /// @notice Verify premium calculation values
    function testPremium() public view {
        uint256 stake = 100_000 * 1e18;

        // Whale tier -> 3%
        assertEq(vault.calculateShieldPremium(stake, MADShieldVault.ShieldTier.Whale, 0), (stake * 3) / 100);

        // Standard/Shielded: premiumTierBps = 0 -> 2%
        assertEq(vault.calculateShieldPremium(stake, MADShieldVault.ShieldTier.Standard, 0), (stake * 2) / 100);

        // Standard/Shielded: premiumTierBps = 10000 -> 4%
        assertEq(vault.calculateShieldPremium(stake, MADShieldVault.ShieldTier.Shielded, 10000), (stake * 4) / 100);

        // Standard/Shielded: premiumTierBps = 5000 -> 3%
        assertEq(vault.calculateShieldPremium(stake, MADShieldVault.ShieldTier.Shielded, 5000), (stake * 3) / 100);

        // Standard/Shielded: premiumTierBps = 2500 -> 2.5%
        assertEq(vault.calculateShieldPremium(stake, MADShieldVault.ShieldTier.Shielded, 2500), (stake * 25) / 1000);
    }

    /// @notice Fuzz test premium bounds
    function testFuzzPremium(uint256 stake, uint8 tierIndex, uint256 bps) public view {
        // Clamp inputs
        stake = stake % (10_000_000 * 1e18); // Max 10M stake to avoid overflows
        MADShieldVault.ShieldTier tier = MADShieldVault.ShieldTier(tierIndex % 3);

        uint256 premium = vault.calculateShieldPremium(stake, tier, bps);

        if (tier == MADShieldVault.ShieldTier.Whale) {
            assertEq(premium, (stake * 3) / 100);
        } else {
            uint256 minPremium = (stake * 2) / 100;
            uint256 maxPremium = (stake * 4) / 100;
            assertTrue(premium >= minPremium);
            assertTrue(premium <= maxPremium);
        }
    }

    /// @notice Verify payout calculations
    function testPayout() public view {
        uint256 stake = 100_000 * 1e18;

        // Whale -> 60%
        assertEq(vault.calculateShieldPayoutFull(stake, MADShieldVault.ShieldTier.Whale, 0), (stake * 60) / 100);

        // Standard -> 28.8%
        assertEq(vault.calculateShieldPayoutFull(stake, MADShieldVault.ShieldTier.Standard, 0), (stake * 288) / 1000);

        // Shielded: premiumTierBps = 10000 -> 40%
        assertEq(vault.calculateShieldPayoutFull(stake, MADShieldVault.ShieldTier.Shielded, 10000), (stake * 40) / 100);

        // Shielded: premiumTierBps = 5000 -> 34.4%
        assertEq(vault.calculateShieldPayoutFull(stake, MADShieldVault.ShieldTier.Shielded, 5000), (stake * 344) / 1000);
    }

    /// @notice Fuzz test payout bounds
    function testFuzzPayout(uint256 stake, uint8 tierIndex, uint256 bps) public view {
        stake = stake % (10_000_000 * 1e18);
        MADShieldVault.ShieldTier tier = MADShieldVault.ShieldTier(tierIndex % 3);

        uint256 payout = vault.calculateShieldPayoutFull(stake, tier, bps);

        if (tier == MADShieldVault.ShieldTier.Whale) {
            assertEq(payout, (stake * 60) / 100);
        } else {
            uint256 minPayout = (stake * 288) / 1000;
            uint256 maxPayout = (stake * 40) / 100;
            assertTrue(payout >= minPayout);
            assertTrue(payout <= maxPayout);
        }
    }

    /// @notice Test standard stake lifecycle: stake, request unstake, cooldown, claim
    function testStakeUnstakeClaimLifecycle() public {
        uint256 stakeAmount = 10000 * 1e18; // $10,000 -> 4h return window
        uint256 premium = vault.calculateShieldPremium(stakeAmount, MADShieldVault.ShieldTier.Standard, 0); // 2% -> $200

        vm.startPrank(user1);
        token.approve(address(vault), stakeAmount + premium);

        uint256 startBalance = token.balanceOf(user1);

        uint256 posId = vault.stake(stakeAmount, MADShieldVault.ShieldTier.Standard, 0);

        // Post-stake check
        assertEq(token.balanceOf(user1), startBalance - stakeAmount - premium);
        assertEq(token.balanceOf(address(vault)), stakeAmount + premium);

        (
            uint256 posStake,
            MADShieldVault.ShieldTier posTier,
            uint256 posBps,
            uint256 posPremium,
            uint256 posStakedAt,
            uint256 posUnstakedAt,
            uint256 posReturnAt,
            bool posActive,
            bool posUnstaking,
            bool posClaimed
        ) = vault.positions(user1, posId);

        assertEq(posStake, stakeAmount);
        assertEq(uint8(posTier), uint8(MADShieldVault.ShieldTier.Standard));
        assertEq(posBps, 0);
        assertEq(posPremium, premium);
        assertEq(posStakedAt, block.timestamp);
        assertEq(posUnstakedAt, 0);
        assertEq(posReturnAt, 0);
        assertTrue(posActive);
        assertFalse(posUnstaking);
        assertFalse(posClaimed);

        // Request unstake
        vault.requestUnstake(posId);

        (, , , , , uint256 reqUnstakedAt, uint256 reqReturnAt, , bool reqUnstaking, ) = vault.positions(user1, posId);
        assertTrue(reqUnstaking);
        assertEq(reqUnstakedAt, block.timestamp);
        assertEq(reqReturnAt, block.timestamp + 4 hours);

        // Try claiming too early
        vm.expectRevert("Cooldown not finished");
        vault.claim(posId);

        // Warp time to cooldown end
        vm.warp(block.timestamp + 4 hours);

        // Claim success
        vault.claim(posId);

        (, , , , , , , bool endActive, , bool endClaimed) = vault.positions(user1, posId);
        assertFalse(endActive);
        assertTrue(endClaimed);

        // User should get stakeAmount back, but premium remains in vault
        assertEq(token.balanceOf(user1), startBalance - premium);
        assertEq(token.balanceOf(address(vault)), premium);
        vm.stopPrank();
    }

    /// @notice Verify whale eligibility checks
    function testWhaleStaking() public {
        uint256 stakeAmount = 10000 * 1e18;

        // Try staking as whale without eligibility
        vm.startPrank(user1);
        token.approve(address(vault), 2_000_000 * 1e18);

        vm.expectRevert("Not eligible for Whale tier");
        vault.stake(stakeAmount, MADShieldVault.ShieldTier.Whale, 0);
        vm.stopPrank();

        // Grant eligibility
        vm.prank(owner);
        vault.setWhaleEligibility(user1, true);

        // Stake as whale should now succeed
        vm.startPrank(user1);
        uint256 posId = vault.stake(stakeAmount, MADShieldVault.ShieldTier.Whale, 0);

        (
            uint256 posStake,
            MADShieldVault.ShieldTier posTier,
            ,
            uint256 posPremium,
            ,
            ,
            ,
            bool posActive,
            ,
        ) = vault.positions(user1, posId);

        assertEq(posStake, stakeAmount);
        assertEq(uint8(posTier), uint8(MADShieldVault.ShieldTier.Whale));
        assertEq(posPremium, (stakeAmount * 3) / 100);
        assertTrue(posActive);
        vm.stopPrank();
    }

    /// @notice Test loss resolution
    function testLossResolution() public {
        uint256 stakeAmount = 50000 * 1e18;
        uint256 premium = vault.calculateShieldPremium(stakeAmount, MADShieldVault.ShieldTier.Shielded, 5000); // 3% -> 1500

        // Grant whale eligibility to user2
        vm.prank(owner);
        vault.setWhaleEligibility(user2, true);

        // User1 stakes Shielded with 5000 Bps
        vm.startPrank(user1);
        token.approve(address(vault), stakeAmount + premium);
        uint256 posId1 = vault.stake(stakeAmount, MADShieldVault.ShieldTier.Shielded, 5000);
        vm.stopPrank();

        // User2 stakes Whale
        uint256 whalePremium = vault.calculateShieldPremium(stakeAmount, MADShieldVault.ShieldTier.Whale, 0); // 3% -> 1500
        vm.startPrank(user2);
        token.approve(address(vault), stakeAmount + whalePremium);
        uint256 posId2 = vault.stake(stakeAmount, MADShieldVault.ShieldTier.Whale, 0);
        vm.stopPrank();

        // User1 balances before resolution
        uint256 user1PreResolve = token.balanceOf(user1);

        // Resolve loss for User1 (Shielded 5000 bps -> 34.4% recovery)
        vm.prank(owner);
        vault.resolveLoss(user1, posId1);

        uint256 expectedPayout1 = (stakeAmount * 344) / 1000;
        assertEq(token.balanceOf(user1), user1PreResolve + expectedPayout1);

        (, , , , , , , bool active1, , bool claimed1) = vault.positions(user1, posId1);
        assertFalse(active1);
        assertTrue(claimed1);

        // User2 balances before resolution
        uint256 user2PreResolve = token.balanceOf(user2);

        // Resolve loss for User2 (Whale -> 60% recovery)
        vm.prank(owner);
        vault.resolveLoss(user2, posId2);

        uint256 expectedPayout2 = (stakeAmount * 60) / 100;
        assertEq(token.balanceOf(user2), user2PreResolve + expectedPayout2);

        (, , , , , , , bool active2, , bool claimed2) = vault.positions(user2, posId2);
        assertFalse(active2);
        assertTrue(claimed2);
    }

    /// @notice Verify withdraw function permissions and transfer functionality
    function testWithdraw() public {
        uint256 withdrawAmount = 5_000 * 1e18;
        token.mint(address(vault), withdrawAmount);

        // Ensure non-owners cannot withdraw (should revert)
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user1));
        vault.withdraw(withdrawAmount);

        // Owner should be able to withdraw
        uint256 ownerBalanceBefore = token.balanceOf(owner);
        uint256 vaultBalanceBefore = token.balanceOf(address(vault));

        vm.prank(owner);
        vault.withdraw(withdrawAmount);

        assertEq(token.balanceOf(owner), ownerBalanceBefore + withdrawAmount);
        assertEq(token.balanceOf(address(vault)), vaultBalanceBefore - withdrawAmount);
    }
}
