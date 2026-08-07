// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC1155Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ABDKMath64x64} from "abdk-libraries-solidity/ABDKMath64x64.sol";
import {Errors} from "../errors/Errors.sol";
import {RolesRegistry} from "../registries/roles.sol";
import {AssetsRegistry} from "../registries/assets.sol";

/**
 * @title MadhatCard - Optimized Version
 * @dev MADHAT Platform NFT Cards - ERC-1155 Hybrid (Optimized for size)
 * Features: Card tiers, evolution mechanics, volatility & clout stats
 * Based on MADHAT Platform Engineering Bible v6.0
 */
contract MadhatCard is Initializable, ERC1155Upgradeable, OwnableUpgradeable, UUPSUpgradeable, PausableUpgradeable {
    
    RolesRegistry public roles;
    AssetsRegistry public assetsRegistry;
    
    using ABDKMath64x64 for int128;
    using ABDKMath64x64 for uint256;
    
    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PRICE_MANAGER_ROLE = keccak256("PRICE_MANAGER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    
    // Card rarity tiers
    enum Rarity {
        Common,     // 0 - 60% supply
        Uncommon,   // 1 - 30% supply  
        Rare,       // 2 - 9% supply
        Ultimate    // 3 - 1% supply
    }
    
    // Card evolution states
    enum EvolutionState {
        Original,   // 0 - Initial state
        Evolved,    // 1 - Successfully evolved
        Degenerated // 2 - Failed evolution
    }
    
    // Optimized Card struct - using bytes32 for ability instead of string
    struct Card {
        uint8 volatility;    // 0-100
        uint8 clout;         // 0-100
        uint8 factionId;     // 1-8
        bytes32 ability;     // Hash instead of string to save gas
        Rarity rarity;       // Card tier
        bool active;         // Card status
    }
    
    // Simplified Pack structure
    struct Pack {
        uint128 price;           // Use uint128 to save space
        uint8 cardCount;         // Number of cards (max 5)
        bool active;             // Pack status
        uint128 maxSupply;       // Use uint128
        uint128 minted;          // Use uint128
        uint8 rarityBonus;       // Bonus rarity chances
    }
    
    // Simplified TokenPrice struct
    struct TokenPrice {
        uint128 price;           // Use uint128
        bool enabled;            // Whether enabled
        uint8 decimals;          // Token decimals
    }
    
    // Storage mappings - optimized
    mapping(uint256 => Card) public cards;
    mapping(uint256 => Pack) public packs;
    mapping(address => uint256[]) public userCards;
    mapping(address => TokenPrice) public tokenPrices; // Only global fallback
    
    // Token references
    address public madexToken;
    address public treasury;
    
    // Constants
    uint256 public constant MAX_CARDS_PER_PACK = 5;
    uint256 public constant EVOLUTION_FEE = 100 * 1e18;
    uint256 public constant TREASURY_FEE_PERCENTAGE = 20;
    string private constant BASE_METADATA_URI = "https://api.madhat.com/metadata/";
    
    // Token ID ranges
    uint256 public constant COMMON_CARD_START = 1001;
    uint256 public constant UNCOMMON_CARD_START = 2001;
    uint256 public constant RARE_CARD_START = 3001;
    uint256 public constant ULTIMATE_CARD_START = 4001;
    
    // Pack management
    uint256 public nextPackId = 1;
    
    // Fixed point constants
    int128 private constant TWO = 0x20000000000000000;
    
    // Events - optimized
    event PackOpened(address indexed opener, uint256 packId, uint256[] cardIds);
    event CardEvolved(address indexed owner, uint256 fromId, uint256 toId);
    event CardMinted(uint256 indexed tokenId, address indexed to, Rarity rarity, uint8 clout);
    event PackPurchased(address indexed buyer, address indexed paymentToken, uint256 packId, uint256 amount);
    event PackCreated(uint256 indexed packId, uint256 price, uint8 cardCount, uint256 maxSupply);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(
        string memory _uri,
        address _madexToken,
        address _treasury,
        address rolesAddress,
        address assetsRegistryAddress
    ) public initializer {
        __ERC1155_init(_uri);
        __Ownable_init(msg.sender);
        __Pausable_init();
        
        if (_madexToken == address(0) || _treasury == address(0)) {
            revert Errors.ZeroAddress();
        }
        
        if (rolesAddress == address(0)) revert Errors.ZeroAddress();
        roles = RolesRegistry(rolesAddress);
        
        if (assetsRegistryAddress == address(0)) revert Errors.ZeroAddress();
        assetsRegistry = AssetsRegistry(assetsRegistryAddress);
        
        madexToken = _madexToken;
        treasury = _treasury;
        
        // Initialize default pack
        packs[1] = Pack({
            price: uint128(10 * 1e18),
            cardCount: 5,
            active: true,
            maxSupply: uint128(10000),
            minted: 0,
            rarityBonus: 0
        });
        nextPackId = 2;
    }
    
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
    
    // Modifiers
    modifier onlyAdmin() {
        if (!roles.isRole(ADMIN_ROLE, msg.sender)) revert Errors.Unauthorized();
        _;
    }
    
    modifier onlyPriceManager() {
        if (!roles.isRole(PRICE_MANAGER_ROLE, msg.sender)) revert Errors.Unauthorized();
        _;
    }
    
    modifier onlyPauser() {
        if (!roles.isRole(PAUSER_ROLE, msg.sender)) revert Errors.Unauthorized();
        _;
    }
    
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override(ERC1155Upgradeable) whenNotPaused {
        super._update(from, to, ids, values);
    }
    
    // Core functions - simplified
    function createPack(
        uint256 price,
        uint8 cardCount,
        uint256 maxSupply,
        uint8 rarityBonus
    ) external onlyAdmin {
        uint256 packId = nextPackId++;
        packs[packId] = Pack({
            price: uint128(price),
            cardCount: cardCount,
            active: true,
            maxSupply: uint128(maxSupply),
            minted: 0,
            rarityBonus: rarityBonus
        });
        emit PackCreated(packId, price, cardCount, maxSupply);
    }
    
    function purchasePack(uint256 packId) external {
        Pack storage pack = packs[packId];
        if (!pack.active) revert Errors.PackNotActive();
        if (pack.minted >= pack.maxSupply) revert Errors.MaxSupplyReached();
        
        // Simplified payment logic - only MADDEX token
        IERC20(madexToken).transferFrom(msg.sender, treasury, pack.price);
        
        pack.minted++;
        uint256[] memory cardIds = _generateCards(pack.cardCount, pack.rarityBonus);
        
        for (uint i = 0; i < cardIds.length; i++) {
            _mint(msg.sender, cardIds[i], 1, "");
            userCards[msg.sender].push(cardIds[i]);
        }
        
        emit PackOpened(msg.sender, packId, cardIds);
        emit PackPurchased(msg.sender, madexToken, packId, pack.price);
    }
    
    function _generateCards(uint8 count, uint8 rarityBonus) internal returns (uint256[] memory) {
        uint256[] memory cardIds = new uint256[](count);
        
        for (uint i = 0; i < count; i++) {
            uint256 tokenId = _determineCardId(rarityBonus);
            cardIds[i] = tokenId;
            
            if (!cards[tokenId].active) {
                cards[tokenId] = Card({
                    volatility: uint8(_random(100)),
                    clout: uint8(_random(100)),
                    factionId: uint8(1 + _random(8)),
                    ability: keccak256(abi.encodePacked(tokenId, block.timestamp)),
                    rarity: _getRarityFromTokenId(tokenId),
                    active: true
                });
            }
        }
        
        return cardIds;
    }
    
    function _determineCardId(uint8 rarityBonus) internal view returns (uint256) {
        uint256 roll = _random(100);
        
        if (roll < 1 + rarityBonus) return ULTIMATE_CARD_START + _random(100);
        if (roll < 10 + rarityBonus) return RARE_CARD_START + _random(100);
        if (roll < 40 + rarityBonus) return UNCOMMON_CARD_START + _random(100);
        return COMMON_CARD_START + _random(100);
    }
    
    function _getRarityFromTokenId(uint256 tokenId) internal pure returns (Rarity) {
        if (tokenId >= ULTIMATE_CARD_START) return Rarity.Ultimate;
        if (tokenId >= RARE_CARD_START) return Rarity.Rare;
        if (tokenId >= UNCOMMON_CARD_START) return Rarity.Uncommon;
        return Rarity.Common;
    }
    
    function _random(uint256 max) internal view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender))) % max;
    }
    
    // Utility functions
    function pause() external onlyPauser {
        _pause();
    }
    
    function unpause() external onlyPauser {
        _unpause();
    }
    
    function uri(uint256 tokenId) public pure override returns (string memory) {
        return string(abi.encodePacked("https://api.madhat.com/metadata/", Strings.toString(tokenId)));
    }
    
    function getUserCards(address user) external view returns (uint256[] memory) {
        return userCards[user];
    }
    
    function getCard(uint256 tokenId) external view returns (
        uint8 volatility,
        uint8 clout,
        uint8 factionId,
        bytes32 ability,
        Rarity rarity,
        bool active
    ) {
        Card storage card = cards[tokenId];
        return (card.volatility, card.clout, card.factionId, card.ability, card.rarity, card.active);
    }
    
    function getPack(uint256 packId) external view returns (
        uint128 price,
        uint8 cardCount,
        bool active,
        uint128 maxSupply,
        uint128 minted,
        uint8 rarityBonus
    ) {
        Pack storage pack = packs[packId];
        return (pack.price, pack.cardCount, pack.active, pack.maxSupply, pack.minted, pack.rarityBonus);
    }
}
