// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * MADCard1155 — Common, Uncommon, Rare, Epic tiers.
 * Fungible-batch NFT standard (ERC-1155) — cheaper to mint/transfer in bulk
 * than ERC-721, matching the canonical spec:
 *   Common/Uncommon/Rare/Epic → ERC-1155
 *   Legendary/Golden Hand/Mythic → ERC-721 (see MADCard721.sol)
 *
 * Token ID encoding: (rarityId << 128) | serial
 *   rarityId: 0=Common 1=Uncommon 2=Rare 3=Epic
 * This keeps serials globally unique per rarity without a separate
 * counter contract and makes on-chain provenance trivially decodable.
 *
 * Canonical power/clout/APY values are OFF-CHAIN (in the platform's
 * gambit-game-math.ts RARITY_TABLE) — this contract only tracks
 * ownership and durability. Durability (usage wear) is tracked here
 * on-chain since it affects transferability/staking eligibility and
 * must be tamper-proof.
 */
contract MADCard1155 is ERC1155, AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant WEAR_ORACLE_ROLE = keccak256("WEAR_ORACLE_ROLE");

    enum Rarity { Common, Uncommon, Rare, Epic }

    // Usage-wear tiers in basis points (bps of 10_000) — mirrors
    // RARITY_WEAR_PCT in lib/gambit-game-math.ts exactly.
    mapping(Rarity => uint16) public wearBps;

    // tokenId => durability, scaled 0..10_000 (10_000 = pristine 1.0)
    mapping(uint256 => uint16) public durability;

    // Next serial to mint per rarity tier
    mapping(Rarity => uint256) public nextSerial;

    event CardMinted(address indexed to, uint256 indexed tokenId, Rarity rarity, uint256 serial);
    event WearApplied(uint256 indexed tokenId, uint16 wearBpsApplied, uint16 newDurability);
    event WearTierUpdated(Rarity rarity, uint16 newWearBps);

    constructor(string memory uri_, address admin) ERC1155(uri_) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(WEAR_ORACLE_ROLE, admin);

        // Canonical wear percentages — see docs/CARD_CANONICAL_REFERENCE.md
        wearBps[Rarity.Common] = 200;   // 2%
        wearBps[Rarity.Uncommon] = 200; // 2%
        wearBps[Rarity.Rare] = 1000;    // 10%
        wearBps[Rarity.Epic] = 1150;    // 11.5%
    }

    function encodeTokenId(Rarity rarity, uint256 serial) public pure returns (uint256) {
        return (uint256(rarity) << 128) | serial;
    }

    function decodeTokenId(uint256 tokenId) public pure returns (Rarity rarity, uint256 serial) {
        rarity = Rarity(tokenId >> 128);
        serial = tokenId & type(uint128).max;
    }

    function mint(address to, Rarity rarity, uint256 amount)
        external
        onlyRole(MINTER_ROLE)
        whenNotPaused
        nonReentrant
        returns (uint256 tokenId)
    {
        require(to != address(0), "mint to zero address");
        require(amount > 0, "amount must be positive");

        uint256 serial = nextSerial[rarity];
        nextSerial[rarity] = serial + 1;
        tokenId = encodeTokenId(rarity, serial);

        durability[tokenId] = 10_000; // pristine on mint
        _mint(to, tokenId, amount, "");

        emit CardMinted(to, tokenId, rarity, serial);
    }

    /** Apply usage wear to a card. Caller must hold WEAR_ORACLE_ROLE —
     *  in production this is the backend service that observes a card
     *  being staked/played, matching applyUsageWear() in the TS engine. */
    function applyWear(uint256 tokenId, uint256 uses) external onlyRole(WEAR_ORACLE_ROLE) {
        (Rarity rarity, ) = decodeTokenId(tokenId);
        uint16 wear = wearBps[rarity];
        uint16 current = durability[tokenId];

        uint256 totalWear = uint256(wear) * uses;
        uint16 newDurability = totalWear >= current ? 0 : current - uint16(totalWear);

        durability[tokenId] = newDurability;
        emit WearApplied(tokenId, wear, newDurability);
    }

    function setWearTier(Rarity rarity, uint16 newWearBps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newWearBps <= 10_000, "wear cannot exceed 100%");
        wearBps[rarity] = newWearBps;
        emit WearTierUpdated(rarity, newWearBps);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }

    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        override
        whenNotPaused
    {
        super._update(from, to, ids, values);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
