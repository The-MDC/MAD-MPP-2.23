// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/MADCard721.sol";

contract MADCard721Test is Test {
    MADCard721 card;
    address admin = address(0xA11CE);
    address user  = address(0xB0B);
    address rando = address(0xBAD);

    function setUp() public {
        card = new MADCard721("MADHAT Gambit Elite", "MADHAT", "https://api.madgambit.io/elite/", admin);
    }

    function test_CanonicalWearTiers() public view {
        assertEq(card.wearBps(MADCard721.Rarity.Legendary),  1300);
        assertEq(card.wearBps(MADCard721.Rarity.GoldenHand), 1450);
        assertEq(card.wearBps(MADCard721.Rarity.Mythic),     1600);
    }

    // ── THE flagship invariant: Mythic is a true 1-of-1 ──
    function test_MythicSupplyCapIsOne() public {
        vm.startPrank(admin);
        card.mint(user, MADCard721.Rarity.Mythic);
        vm.expectRevert(bytes("Mythic supply cap reached: 1-of-1"));
        card.mint(rando, MADCard721.Rarity.Mythic);
        vm.stopPrank();
        assertEq(card.mintedCount(MADCard721.Rarity.Mythic), 1);
    }

    function test_LegendaryAndGoldenHandUncappedOnChain() public {
        vm.startPrank(admin);
        for (uint i; i < 3; i++) {
            card.mint(user, MADCard721.Rarity.Legendary);
            card.mint(user, MADCard721.Rarity.GoldenHand);
        }
        vm.stopPrank();
        assertEq(card.mintedCount(MADCard721.Rarity.Legendary), 3);
        assertEq(card.mintedCount(MADCard721.Rarity.GoldenHand), 3);
        assertEq(card.balanceOf(user), 6);
    }

    function test_MintStateAndAuth() public {
        vm.prank(admin);
        uint256 id = card.mint(user, MADCard721.Rarity.Legendary);
        assertEq(card.ownerOf(id), user);
        assertEq(card.durability(id), 10_000);
        assertEq(uint256(card.rarityOf(id)), uint256(MADCard721.Rarity.Legendary));

        vm.prank(rando);
        vm.expectRevert();
        card.mint(rando, MADCard721.Rarity.Legendary);

        vm.prank(admin);
        vm.expectRevert(bytes("mint to zero address"));
        card.mint(address(0), MADCard721.Rarity.Legendary);
    }

    // ── wear: guarded by _requireOwned (the guard 1155 lacks) ──
    function test_ApplyWearAndFloor() public {
        vm.prank(admin);
        uint256 id = card.mint(user, MADCard721.Rarity.Mythic); // 1600 bps
        vm.prank(admin);
        card.applyWear(id, 2);
        assertEq(card.durability(id), 10_000 - 3200);
        vm.prank(admin);
        card.applyWear(id, 100); // way past zero → floors
        assertEq(card.durability(id), 0);
    }

    function test_ApplyWearRevertsOnNonexistentToken() public {
        vm.prank(admin);
        vm.expectRevert(); // ERC721NonexistentToken
        card.applyWear(777, 1);
    }

    function test_ApplyWearRevertsForNonOracle() public {
        vm.prank(admin);
        uint256 id = card.mint(user, MADCard721.Rarity.Legendary);
        vm.prank(rando);
        vm.expectRevert();
        card.applyWear(id, 1);
    }

    function testFuzz_WearNeverExceedsPristine(uint8 uses) public {
        vm.prank(admin);
        uint256 id = card.mint(user, MADCard721.Rarity.GoldenHand);
        vm.prank(admin);
        card.applyWear(id, uses);
        assertLe(card.durability(id), 10_000);
    }

    function test_PauseBlocksMint() public {
        vm.startPrank(admin);
        card.pause();
        vm.expectRevert();
        card.mint(user, MADCard721.Rarity.Legendary);
        card.unpause();
        card.mint(user, MADCard721.Rarity.Legendary);
        vm.stopPrank();
        assertEq(card.balanceOf(user), 1);
    }
}
