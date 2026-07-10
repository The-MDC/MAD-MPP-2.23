// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/MADCard1155.sol";

contract MADCard1155Test is Test {
    MADCard1155 card;
    address admin = address(0xA11CE);
    address user  = address(0xB0B);
    address rando = address(0xBAD);

    function setUp() public {
        card = new MADCard1155("https://api.madgambit.io/cards/{id}.json", admin);
    }

    // ── canonical wear tiers (mirror RARITY_WEAR_PCT) ──
    function test_CanonicalWearTiers() public view {
        assertEq(card.wearBps(MADCard1155.Rarity.Common),   200);
        assertEq(card.wearBps(MADCard1155.Rarity.Uncommon), 200);
        assertEq(card.wearBps(MADCard1155.Rarity.Rare),     1000);
        assertEq(card.wearBps(MADCard1155.Rarity.Epic),     1150);
    }

    // ── token id encoding ──
    function test_EncodeDecodeRoundtrip() public view {
        uint256 id = card.encodeTokenId(MADCard1155.Rarity.Epic, 42);
        (MADCard1155.Rarity r, uint256 s) = card.decodeTokenId(id);
        assertEq(uint256(r), uint256(MADCard1155.Rarity.Epic));
        assertEq(s, 42);
    }

    function testFuzz_EncodeDecodeRoundtrip(uint8 rarityRaw, uint128 serial) public view {
        MADCard1155.Rarity r = MADCard1155.Rarity(bound(rarityRaw, 0, 3));
        uint256 id = card.encodeTokenId(r, serial);
        (MADCard1155.Rarity r2, uint256 s2) = card.decodeTokenId(id);
        assertEq(uint256(r2), uint256(r));
        assertEq(s2, serial);
    }

    // ── mint auth + state ──
    function test_MintByMinter() public {
        vm.prank(admin);
        uint256 id = card.mint(user, MADCard1155.Rarity.Common, 5);
        assertEq(card.balanceOf(user, id), 5);
        assertEq(card.durability(id), 10_000);           // pristine
        assertEq(card.nextSerial(MADCard1155.Rarity.Common), 1);
    }

    function test_MintRevertsForNonMinter() public {
        vm.prank(rando);
        vm.expectRevert();
        card.mint(user, MADCard1155.Rarity.Common, 1);
    }

    function test_MintRevertsZeroAddressAndZeroAmount() public {
        vm.startPrank(admin);
        vm.expectRevert(bytes("mint to zero address"));
        card.mint(address(0), MADCard1155.Rarity.Rare, 1);
        vm.expectRevert(bytes("amount must be positive"));
        card.mint(user, MADCard1155.Rarity.Rare, 0);
        vm.stopPrank();
    }

    function test_SerialsIncrementPerRarity() public {
        vm.startPrank(admin);
        uint256 a = card.mint(user, MADCard1155.Rarity.Rare, 1);
        uint256 b = card.mint(user, MADCard1155.Rarity.Rare, 1);
        uint256 c = card.mint(user, MADCard1155.Rarity.Epic, 1);
        vm.stopPrank();
        (, uint256 sa) = card.decodeTokenId(a);
        (, uint256 sb) = card.decodeTokenId(b);
        (, uint256 sc) = card.decodeTokenId(c);
        assertEq(sa, 0); assertEq(sb, 1); assertEq(sc, 0); // per-rarity streams
    }

    // ── wear math ──
    function test_ApplyWearSingleUse() public {
        vm.prank(admin);
        uint256 id = card.mint(user, MADCard1155.Rarity.Epic, 1); // 1150 bps
        vm.prank(admin);
        card.applyWear(id, 1);
        assertEq(card.durability(id), 10_000 - 1150);
    }

    function test_ApplyWearFloorsAtZero() public {
        vm.prank(admin);
        uint256 id = card.mint(user, MADCard1155.Rarity.Common, 1); // 200 bps
        vm.prank(admin);
        card.applyWear(id, 50); // 50 * 200 = 10_000 exactly → 0
        assertEq(card.durability(id), 0);
        vm.prank(admin);
        card.applyWear(id, 1);  // beyond zero stays zero
        assertEq(card.durability(id), 0);
    }

    function testFuzz_WearNeverUnderflows(uint8 uses) public {
        vm.prank(admin);
        uint256 id = card.mint(user, MADCard1155.Rarity.Rare, 1);
        vm.prank(admin);
        card.applyWear(id, uses);
        assertLe(card.durability(id), 10_000);
    }

    function test_ApplyWearRevertsForNonOracle() public {
        vm.prank(admin);
        uint256 id = card.mint(user, MADCard1155.Rarity.Common, 1);
        vm.prank(rando);
        vm.expectRevert();
        card.applyWear(id, 1);
    }

    /// KNOWN GAP (documented): unlike MADCard721, applyWear does not
    /// verify the token was ever minted — wear on a nonexistent id is a
    /// silent no-op write. Test pins current behavior; fix candidate:
    /// require(durability[tokenId] > 0 || totalSupply check).
    function test_ApplyWearOnUnmintedId_PinsCurrentBehavior() public {
        uint256 ghost = card.encodeTokenId(MADCard1155.Rarity.Epic, 999);
        vm.prank(admin);
        card.applyWear(ghost, 3);
        assertEq(card.durability(ghost), 0); // was 0, stays 0 — no revert
    }

    // ── admin wear tier ──
    function test_SetWearTier() public {
        vm.prank(admin);
        card.setWearTier(MADCard1155.Rarity.Common, 300);
        assertEq(card.wearBps(MADCard1155.Rarity.Common), 300);
    }

    function test_SetWearTierCapsAt100Pct() public {
        vm.prank(admin);
        vm.expectRevert(bytes("wear cannot exceed 100%"));
        card.setWearTier(MADCard1155.Rarity.Common, 10_001);
    }

    // ── pause ──
    function test_PauseBlocksMintAndTransfer() public {
        vm.prank(admin);
        uint256 id = card.mint(user, MADCard1155.Rarity.Common, 2);
        vm.prank(admin);
        card.pause();
        vm.prank(admin);
        vm.expectRevert();
        card.mint(user, MADCard1155.Rarity.Common, 1);
        vm.prank(user);
        vm.expectRevert();
        card.safeTransferFrom(user, rando, id, 1, "");
        vm.prank(admin);
        card.unpause();
        vm.prank(user);
        card.safeTransferFrom(user, rando, id, 1, "");
        assertEq(card.balanceOf(rando, id), 1);
    }
}
