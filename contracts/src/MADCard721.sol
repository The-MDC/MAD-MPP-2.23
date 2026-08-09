// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * MADCard721 — Legendary, Golden Hand, Mythic tiers.
 * True 1-of-1 non-fungible standard, matching the canonical spec.
 * Mythic is capped at 1 mint total (true 1-of-1); Legendary and
 * Golden Hand have no hard on-chain cap here — supply discipline is
 * enforced off-chain by the pack-opening weighted RNG never selecting
 * more than the canonical allocation. A future version can add a
 * hard cap if the business wants it enforced on-chain too.
 */
contract MADCard721 is ERC721, AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant WEAR_ORACLE_ROLE = keccak256("WEAR_ORACLE_ROLE");

    enum Rarity { Legendary, GoldenHand, Mythic }

    uint256 public constant MYTHIC_SUPPLY_CAP = 1;

    mapping(Rarity => uint16) public wearBps;
    mapping(uint256 => uint16) public durability;   // 0..10_000
    mapping(uint256 => Rarity) public rarityOf;
    mapping(Rarity => uint256) public mintedCount;
    uint256 private _nextTokenId;

    string private _baseTokenURI;

    event CardMinted(address indexed to, uint256 indexed tokenId, Rarity rarity);
    event WearApplied(uint256 indexed tokenId, uint16 wearBpsApplied, uint16 newDurability);

    constructor(string memory name_, string memory symbol_, string memory baseURI_, address admin)
        ERC721(name_, symbol_)
    {
        _baseTokenURI = baseURI_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(WEAR_ORACLE_ROLE, admin);

        wearBps[Rarity.Legendary] = 1300;   // 13%
        wearBps[Rarity.GoldenHand] = 1450;  // 14.5%
        wearBps[Rarity.Mythic] = 1600;      // 16%
    }

    function mint(address to, Rarity rarity) external onlyRole(MINTER_ROLE) whenNotPaused nonReentrant returns (uint256 tokenId) {
        require(to != address(0), "mint to zero address");
        if (rarity == Rarity.Mythic) {
            require(mintedCount[Rarity.Mythic] < MYTHIC_SUPPLY_CAP, "Mythic supply cap reached: 1-of-1");
        }

        tokenId = _nextTokenId++;
        rarityOf[tokenId] = rarity;
        durability[tokenId] = 10_000;
        mintedCount[rarity] += 1;

        _safeMint(to, tokenId);
        emit CardMinted(to, tokenId, rarity);
    }

    function applyWear(uint256 tokenId, uint256 uses) external onlyRole(WEAR_ORACLE_ROLE) {
        _requireOwned(tokenId);
        Rarity rarity = rarityOf[tokenId];
        uint16 wear = wearBps[rarity];
        uint16 current = durability[tokenId];

        uint256 totalWear = uint256(wear) * uses;
        uint16 newDurability = totalWear >= current ? 0 : current - uint16(totalWear);

        durability[tokenId] = newDurability;
        emit WearApplied(tokenId, wear, newDurability);
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string memory newBaseURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _baseTokenURI = newBaseURI;
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        whenNotPaused
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
