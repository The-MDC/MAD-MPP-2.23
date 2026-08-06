// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MADPortrait} from "../src/MADPortrait.sol";
import {MADPortraitKeyRegistry} from "../src/MADPortraitKeyRegistry.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/// @dev A contract at the right address that is not the registry — the
///      "typo'd address" case, which must fail closed rather than decode noise.
contract WrongContract {
    function somethingElse() external pure returns (uint256) {
        return 42;
    }
}

/// @dev A registry-shaped contract that reverts. Must also fail closed.
contract RevertingRegistry {
    function keyRefOf(bytes32) external pure returns (bytes32) {
        revert("nope");
    }
}

contract MADPortraitTest is Test {
    MADPortrait internal portrait;
    MADPortraitKeyRegistry internal registry;

    address internal admin = address(0xA11CE);
    address internal collector = address(0xB0B);

    bytes32 internal constant SUBJECT = keccak256("subj_named_alpha");
    bytes32 internal constant KEY_REF = keccak256("kms://alpha");

    function setUp() public {
        vm.startPrank(admin);
        registry = new MADPortraitKeyRegistry(admin);
        portrait = new MADPortrait("MAD Gambit Portrait", "MADPT", "https://x/", admin);
        vm.stopPrank();
    }

    function _named() internal pure returns (MADPortrait.NamedPortrait memory) {
        return MADPortrait.NamedPortrait({
            subjectId: SUBJECT,
            legIndex: 3,
            ciphertextRef: keccak256("portraits/alpha/1"),
            isSlip: true
        });
    }

    function _institutional() internal pure returns (MADPortrait.InstitutionalPortrait memory p) {
        p.subjectId = keccak256("subj_legacy_bank");
        p.legIndex = 2;
        p.crownedFace = 2;
        p.isSlip = false;
        p.permanentBps = [uint16(800), 3400, 3100, 900, 1800];
        p.transitoryBps = [uint16(1000), 3000, 3000, 1000, 2000];
        p.divergenceBps = 420;
    }

    /* ═══ THE CANARY (§6.2.4 layer 3) ═════════════════════════════ */

    /// @notice A named mint with the registry DISABLED must revert. This is the
    ///         canary CI is specified to run on every PR.
    function test_NamedMint_RevertsWhenRegistryUnset() public {
        vm.prank(admin);
        vm.expectRevert(MADPortrait.RegistryUnset.selector);
        portrait.mintNamed(collector, _named());
    }

    function test_NamedMint_RevertsWhenRegistryHasNoCode() public {
        // An EOA configured as the registry. A bare call here would SUCCEED with
        // empty returndata — the silent failure the defensive read exists for.
        address eoa = address(0xDEAD);
        vm.startPrank(admin);
        portrait.setKeyRegistry(eoa);
        vm.expectRevert(abi.encodeWithSelector(MADPortrait.RegistryUnreachable.selector, eoa));
        portrait.mintNamed(collector, _named());
        vm.stopPrank();
    }

    function test_NamedMint_RevertsWhenRegistryIsTheWrongContract() public {
        address wrong = address(new WrongContract());
        vm.startPrank(admin);
        portrait.setKeyRegistry(wrong);
        vm.expectRevert(abi.encodeWithSelector(MADPortrait.RegistryUnreachable.selector, wrong));
        portrait.mintNamed(collector, _named());
        vm.stopPrank();
    }

    function test_NamedMint_RevertsWhenRegistryReverts() public {
        address bad = address(new RevertingRegistry());
        vm.startPrank(admin);
        portrait.setKeyRegistry(bad);
        vm.expectRevert(abi.encodeWithSelector(MADPortrait.RegistryUnreachable.selector, bad));
        portrait.mintNamed(collector, _named());
        vm.stopPrank();
    }

    function test_NamedMint_RevertsWhenSubjectHasNoKey() public {
        vm.startPrank(admin);
        portrait.setKeyRegistry(address(registry));
        vm.expectRevert(abi.encodeWithSelector(MADPortrait.NoPortraitKey.selector, SUBJECT));
        portrait.mintNamed(collector, _named());
        vm.stopPrank();
    }

    function test_NamedMint_RevertsWithoutCiphertextRef() public {
        vm.startPrank(admin);
        portrait.setKeyRegistry(address(registry));
        registry.registerKey(SUBJECT, KEY_REF);
        MADPortrait.NamedPortrait memory p = _named();
        p.ciphertextRef = bytes32(0);
        vm.expectRevert(MADPortrait.ZeroCiphertextRef.selector);
        portrait.mintNamed(collector, p);
        vm.stopPrank();
    }

    function test_NamedMint_SucceedsOnlyWithARegisteredKey() public {
        vm.startPrank(admin);
        portrait.setKeyRegistry(address(registry));
        registry.registerKey(SUBJECT, KEY_REF);
        assertTrue(portrait.portraitKeyAvailable(SUBJECT));

        uint256 tokenId = portrait.mintNamed(collector, _named());
        vm.stopPrank();

        assertEq(portrait.ownerOf(tokenId), collector);
        assertEq(uint256(portrait.trackOf(tokenId)), uint256(MADPortrait.Track.NamedIndividual));

        MADPortrait.NamedPortrait memory stored = portrait.namedPortrait(tokenId);
        assertEq(stored.subjectId, SUBJECT);
        assertEq(stored.legIndex, 3);
        assertTrue(stored.isSlip);
    }

    /* ═══ Erasure ═════════════════════════════════════════════════ */

    function test_ErasureStopsFutureMintsButKeepsTheToken() public {
        vm.startPrank(admin);
        portrait.setKeyRegistry(address(registry));
        registry.registerKey(SUBJECT, KEY_REF);
        uint256 tokenId = portrait.mintNamed(collector, _named());

        registry.destroyKey(SUBJECT, "erasure_upheld");

        // The token survives — provably part of the series, provably unreadable.
        assertEq(portrait.ownerOf(tokenId), collector);
        assertTrue(portrait.namedPortrait(tokenId).isSlip, "slip flag survives erasure");

        // No further portraits of that person can ever be minted.
        vm.expectRevert(abi.encodeWithSelector(MADPortrait.NoPortraitKey.selector, SUBJECT));
        portrait.mintNamed(collector, _named());
        vm.stopPrank();

        assertFalse(portrait.portraitKeyAvailable(SUBJECT));
    }

    function test_DestroyedSubjectCanNeverBeReRegistered() public {
        vm.startPrank(admin);
        registry.registerKey(SUBJECT, KEY_REF);
        registry.destroyKey(SUBJECT, "erasure_upheld");
        // Re-registration would make crypto-shredding reversible in practice and
        // would silently return an erased person to the mintable set.
        vm.expectRevert(abi.encodeWithSelector(MADPortraitKeyRegistry.SubjectDestroyed.selector, SUBJECT));
        registry.registerKey(SUBJECT, KEY_REF);
        vm.stopPrank();
    }

    function test_DestroyEmitsTheAuditEvent() public {
        vm.startPrank(admin);
        registry.registerKey(SUBJECT, KEY_REF);
        vm.expectEmit(true, false, false, true);
        emit MADPortraitKeyRegistry.KeyDestroyed(SUBJECT, uint64(block.timestamp), "ttl_lapse");
        registry.destroyKey(SUBJECT, "ttl_lapse");
        vm.stopPrank();

        assertEq(registry.keyRefOf(SUBJECT), bytes32(0));
        assertEq(registry.destroyedCount(), 1);
        assertEq(registry.heldCount(), 0);
    }

    function test_CannotDestroyAnUnknownSubject() public {
        vm.prank(admin);
        vm.expectRevert(abi.encodeWithSelector(MADPortraitKeyRegistry.SubjectNotHeld.selector, SUBJECT));
        registry.destroyKey(SUBJECT, "ttl_lapse");
    }

    function test_RenewalRotatesTheHandleWithoutDoubleCounting() public {
        vm.startPrank(admin);
        registry.registerKey(SUBJECT, KEY_REF);
        registry.registerKey(SUBJECT, keccak256("kms://alpha-v2"));
        vm.stopPrank();
        assertEq(registry.heldCount(), 1);
        assertEq(registry.keyRefOf(SUBJECT), keccak256("kms://alpha-v2"));
    }

    /* ═══ The institutional track is untouched ════════════════════ */

    function test_InstitutionalMintNeedsNoRegistryAtAll() public {
        // The constraint binds on one track only. Degrading this track to match
        // would cost verifiability and protect nothing.
        vm.prank(admin);
        uint256 tokenId = portrait.mintInstitutional(collector, _institutional());
        assertEq(portrait.ownerOf(tokenId), collector);
        assertEq(uint256(portrait.trackOf(tokenId)), uint256(MADPortrait.Track.Institutional));
        assertEq(portrait.institutionalPortrait(tokenId).crownedFace, 2);
    }

    function test_InstitutionalMintRejectsAMalformedSimplex() public {
        MADPortrait.InstitutionalPortrait memory p = _institutional();
        p.permanentBps = [uint16(1000), 1000, 1000, 1000, 1000]; // Σ = 5000
        vm.prank(admin);
        vm.expectRevert(MADPortrait.BadDistribution.selector);
        portrait.mintInstitutional(collector, p);
    }

    /* ═══ Access control and the pause ════════════════════════════ */

    function test_OnlyMinterCanMint() public {
        vm.prank(collector);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector, collector, portrait.MINTER_ROLE()
            )
        );
        portrait.mintInstitutional(collector, _institutional());
    }

    function test_OnlyRegistrarCanRegister() public {
        vm.prank(collector);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector, collector, registry.REGISTRAR_ROLE()
            )
        );
        registry.registerKey(SUBJECT, KEY_REF);
    }

    function test_GuardianPauseHaltsBothTracks() public {
        vm.startPrank(admin);
        portrait.setKeyRegistry(address(registry));
        registry.registerKey(SUBJECT, KEY_REF);
        portrait.pause();

        vm.expectRevert(Pausable.EnforcedPause.selector);
        portrait.mintNamed(collector, _named());
        vm.expectRevert(Pausable.EnforcedPause.selector);
        portrait.mintInstitutional(collector, _institutional());

        portrait.unpause();
        portrait.mintNamed(collector, _named());
        vm.stopPrank();
        assertEq(portrait.totalMinted(), 1);
    }

    /* ═══ Fuzz: no subject without a key ever mints ═══════════════ */

    function testFuzz_NoNamedMintWithoutAKey(bytes32 subjectId) public {
        vm.assume(subjectId != bytes32(0));
        vm.startPrank(admin);
        portrait.setKeyRegistry(address(registry));
        MADPortrait.NamedPortrait memory p = _named();
        p.subjectId = subjectId;
        vm.expectRevert(abi.encodeWithSelector(MADPortrait.NoPortraitKey.selector, subjectId));
        portrait.mintNamed(collector, p);
        vm.stopPrank();
    }
}
