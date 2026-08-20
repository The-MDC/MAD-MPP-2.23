// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * MADPortrait — FIVE FACES §6.2, and INTERLOCK layer 1 (§6.2.4).
 * ─────────────────────────────────────────────────────────────────
 * The Crowning portrait, on two tracks.
 *
 *   INSTITUTIONAL — brands, institutions, models, industries, indices. Full
 *   payload on-chain, verifiable forever. No personal data, no GDPR surface.
 *
 *   NAMED INDIVIDUAL — subjectId, leg index, ciphertext pointer, slip flag.
 *   Nothing else. No name, no likeness, no persona label, no persona values.
 *   The struct for this track has no field to put them in.
 *
 * ═══ INTERLOCK LAYER 1 ═══════════════════════════════════════════
 * `mintNamed` REVERTS unless the key registry returns a non-zero keyRef for the
 * subject. Registry unset, registry with no code, registry that reverts, or a
 * zero keyRef — all four fail the mint.
 *
 * A REVERT, NOT A WARNING. A mint that succeeds with a warning attached has
 * already put personal data on a public chain, at which point the warning is a
 * record of the harm rather than a prevention of it. And the asymmetry that
 * justifies putting the barrier here is absolute: off-chain data can be
 * crypto-shredded, on-chain data cannot be deleted, ever.
 *
 * THE UNREACHABLE CASE IS HANDLED EXPLICITLY. A plain `IRegistry(addr).keyRefOf()`
 * against an address with no code returns success with empty returndata, which
 * ABI-decodes to zero on some paths and reverts on others depending on compiler
 * version — a genuinely bad thing to leave to chance on the one call that stands
 * between this contract and a permanent mistake. So the call is a staticcall
 * with an explicit code-length check and an explicit returndata-length check,
 * and anything unexpected is treated as "no key".
 */
interface IMADPortraitKeyRegistry {
    function keyRefOf(bytes32 subjectId) external view returns (bytes32);
}

contract MADPortrait is ERC721, AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSE_GUARDIAN_ROLE = keccak256("PAUSE_GUARDIAN_ROLE");

    enum Track {
        Institutional,
        NamedIndividual
    }

    /// @dev The institutional payload. Persona values live here and only here.
    struct InstitutionalPortrait {
        bytes32 subjectId;
        uint32 legIndex;
        uint8 crownedFace; // index into FACE_ORDER
        bool isSlip;
        uint16[5] permanentBps; // Σ = 10_000
        uint16[5] transitoryBps;
        int32 divergenceBps;
    }

    /**
     * The named payload. Deliberately narrow: there is no name field, no persona
     * label field and no persona value field, so no refactor can forget to strip
     * one. `isSlip` and `legIndex` are market events recorded independently of
     * the payload, which is why emergent rarity survives erasure — a Slip-leg
     * portrait stays provably a Slip-leg portrait after the key is gone.
     */
    struct NamedPortrait {
        bytes32 subjectId;
        uint32 legIndex;
        bytes32 ciphertextRef;
        bool isSlip;
    }

    IMADPortraitKeyRegistry public keyRegistry;

    mapping(uint256 tokenId => Track) public trackOf;
    mapping(uint256 tokenId => InstitutionalPortrait) private _institutional;
    mapping(uint256 tokenId => NamedPortrait) private _named;

    uint256 private _nextTokenId;
    string private _baseTokenURI;

    event KeyRegistryUpdated(address indexed previous, address indexed current);
    event InstitutionalMinted(uint256 indexed tokenId, bytes32 indexed subjectId, uint32 legIndex);
    event NamedMinted(uint256 indexed tokenId, bytes32 indexed subjectId, uint32 legIndex);

    error RegistryUnset();
    error RegistryUnreachable(address registry);
    error NoPortraitKey(bytes32 subjectId);
    error ZeroCiphertextRef();
    error ZeroSubject();
    error BadDistribution();

    constructor(string memory name_, string memory symbol_, string memory baseURI_, address admin)
        ERC721(name_, symbol_)
    {
        _baseTokenURI = baseURI_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        // The guardian role is granted to the admin at construction only so the
        // contract is never un-pausable; §9.1 expects it rotated to a separate
        // key with a separate custody model before named subjects go live.
        _grantRole(PAUSE_GUARDIAN_ROLE, admin);
    }

    function setKeyRegistry(address registry) external onlyRole(DEFAULT_ADMIN_ROLE) {
        emit KeyRegistryUpdated(address(keyRegistry), registry);
        keyRegistry = IMADPortraitKeyRegistry(registry);
    }

    /* ═══ INTERLOCK LAYER 1 ═══════════════════════════════════════ */

    /**
     * Read the registry defensively. Every failure mode collapses to "no key",
     * and "no key" reverts the mint at the call site.
     *
     * The three checks, and what each one is actually for:
     *   · registry == 0        → never configured. Deploy-order mistake.
     *   · code.length == 0     → configured to an EOA or a self-destructed
     *                            contract. A bare call here would SUCCEED with
     *                            empty returndata, which is the silent failure
     *                            this whole function exists to refuse.
     *   · returndata != 32     → wrong contract at the right address.
     */
    function _requirePortraitKey(bytes32 subjectId) internal view returns (bytes32 keyRef) {
        address registry = address(keyRegistry);
        if (registry == address(0)) revert RegistryUnset();
        if (registry.code.length == 0) revert RegistryUnreachable(registry);

        (bool ok, bytes memory data) =
            registry.staticcall(abi.encodeWithSelector(IMADPortraitKeyRegistry.keyRefOf.selector, subjectId));
        if (!ok || data.length != 32) revert RegistryUnreachable(registry);

        keyRef = abi.decode(data, (bytes32));
        if (keyRef == bytes32(0)) revert NoPortraitKey(subjectId);
    }

    /// @dev Public so the deploy probe and CI canary can assert the gate without minting.
    function portraitKeyAvailable(bytes32 subjectId) external view returns (bool) {
        address registry = address(keyRegistry);
        if (registry == address(0) || registry.code.length == 0) return false;
        (bool ok, bytes memory data) =
            registry.staticcall(abi.encodeWithSelector(IMADPortraitKeyRegistry.keyRefOf.selector, subjectId));
        if (!ok || data.length != 32) return false;
        return abi.decode(data, (bytes32)) != bytes32(0);
    }

    /* ═══ Minting ═════════════════════════════════════════════════ */

    /**
     * Institutional mint. No registry involvement, because there is no personal
     * data to protect — the constraint binds on one track only, and degrading
     * the institutional track to match would cost verifiability for nothing.
     */
    function mintInstitutional(address to, InstitutionalPortrait calldata portrait)
        external
        onlyRole(MINTER_ROLE)
        whenNotPaused
        nonReentrant
        returns (uint256 tokenId)
    {
        if (portrait.subjectId == bytes32(0)) revert ZeroSubject();
        _requireDistribution(portrait.permanentBps);
        _requireDistribution(portrait.transitoryBps);

        tokenId = _nextTokenId++;
        trackOf[tokenId] = Track.Institutional;
        _institutional[tokenId] = portrait;
        _safeMint(to, tokenId);
        emit InstitutionalMinted(tokenId, portrait.subjectId, portrait.legIndex);
    }

    /**
     * Named-individual mint. Gated on the registry — this is the last line, and
     * it is specified to be the last rather than the only one: layer 2 (the type
     * checker), layer 3 (CI) and layer 4 (deploy ordering) all fire earlier, so
     * a barrier that only trips in production is never the barrier that saves us.
     */
    function mintNamed(address to, NamedPortrait calldata portrait)
        external
        onlyRole(MINTER_ROLE)
        whenNotPaused
        nonReentrant
        returns (uint256 tokenId)
    {
        if (portrait.subjectId == bytes32(0)) revert ZeroSubject();
        // A named mint with no ciphertext pointer is a portrait of nothing, and
        // the shape a caller produces when it has skipped the vault entirely.
        if (portrait.ciphertextRef == bytes32(0)) revert ZeroCiphertextRef();

        _requirePortraitKey(portrait.subjectId);

        tokenId = _nextTokenId++;
        trackOf[tokenId] = Track.NamedIndividual;
        _named[tokenId] = portrait;
        _safeMint(to, tokenId);
        emit NamedMinted(tokenId, portrait.subjectId, portrait.legIndex);
    }

    function _requireDistribution(uint16[5] calldata bps) private pure {
        uint256 total;
        for (uint256 i; i < 5; ++i) {
            total += bps[i];
        }
        if (total != 10_000) revert BadDistribution();
    }

    /* ═══ Views ═══════════════════════════════════════════════════ */

    function institutionalPortrait(uint256 tokenId) external view returns (InstitutionalPortrait memory) {
        return _institutional[tokenId];
    }

    function namedPortrait(uint256 tokenId) external view returns (NamedPortrait memory) {
        return _named[tokenId];
    }

    /* ═══ Pause (INTERLOCK layer 5's on-chain half) ═══════════════ */

    function pause() external onlyRole(PAUSE_GUARDIAN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSE_GUARDIAN_ROLE) {
        _unpause();
    }

    /* ═══ ERC-721 plumbing ════════════════════════════════════════ */

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string calldata baseURI_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _baseTokenURI = baseURI_;
    }

    function totalMinted() external view returns (uint256) {
        return _nextTokenId;
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
