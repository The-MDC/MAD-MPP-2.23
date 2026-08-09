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
 * @title MadhatCard
 * @dev MADHAT Platform NFT Cards - ERC-1155 Hybrid
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
    
    // Card rarity tiers (MADHAT Platform drop rates)
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
    
    // Simplified Card struct (MADHAT Platform spec)
    struct Card {
        uint8 volatility;    // 0-100 (GARCH risk factor)
        uint8 clout;         // 0-100 (Staking yield multiplier)
        uint8 factionId;     // 1-8 (Megalomaniac faction)
        string ability;      // Executive Order, The Pump, etc.
        Rarity rarity;       // Card tier
        bool active;         // Card status
        address owner;       // Current owner
    }
    
    // Pack structure (MADHAT Platform spec)
    struct Pack {
        uint256 price;           // Pack price in $MADDEX (default)
        uint8 cardCount;         // Number of cards (max 5)
        bool active;             // Pack status
        uint256 maxSupply;       // Maximum packs
        uint256 minted;          // Packs minted
        uint8 rarityBonus;       // Bonus rarity chances (0-100) - higher = better cards
    }
    
    // Token price configuration for multi-token support
    struct TokenPrice {
        uint256 price;           // Price in this token
        bool enabled;            // Whether this token is enabled for payment
        uint8 decimals;          // Token decimals for proper calculation
    }
    
    // Storage mappings (simplified)
    mapping(uint256 => Card) public cards;
    mapping(uint256 => Pack) public packs;
    mapping(address => uint256[]) public userCards;
    mapping(address => TokenPrice) public tokenPrices; // token address => price config (global fallback)
    mapping(uint256 => mapping(address => TokenPrice)) public packTokenPrices; // packId => token address => price config
    
    // Token references
    address public madexToken;
    address public treasury; // Treasury contract address
    address[] public supportedTokens; // List of supported payment tokens
    
    // Constants (MADHAT Platform spec)
    uint256 public constant MAX_CARDS_PER_PACK = 5;
    uint256 public constant EVOLUTION_FEE = 100 * 1e18; // 100 $MADDEX
    uint256 public constant TREASURY_FEE_PERCENTAGE = 20; // 20% fee to treasury
    string private constant BASE_METADATA_URI = "https://api.madhat.com/metadata/";
    
    // Token ID ranges (fixed pattern like example)
    uint256 public constant COMMON_CARD_START = 1001;
    uint256 public constant UNCOMMON_CARD_START = 2001;
    uint256 public constant RARE_CARD_START = 3001;
    uint256 public constant ULTIMATE_CARD_START = 4001;
    
    // Pack management
    uint256 public nextPackId = 1;
    
    // Fixed point constants
    int128 private constant TWO = 0x20000000000000000; // 2.0 as 64.64 fixed point
    
    // Events (MADHAT Platform spec)
    event PackOpened(address indexed opener, uint256 packId, uint256[] cardIds);
    event CardEvolved(address indexed owner, uint256 fromId, uint256 toId);
    event CardMinted(uint256 indexed tokenId, address indexed to, Rarity rarity, uint8 clout);
    event PackPurchased(address indexed buyer, address indexed paymentToken, uint256 packId, uint256 amount);
    event TokenPriceUpdated(address indexed token, uint256 price, bool enabled);
    event AdminRoleGranted(address indexed admin, address indexed granter);
    event AdminRoleRevoked(address indexed admin, address indexed revoker);
    event PackCreated(uint256 indexed packId, uint256 price, uint8 cardCount, uint256 maxSupply);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    /**
     * @dev Initialize the MadhatCard contract (MADHAT Platform)
     * @param _uri Base URI for metadata
     * @param _madexToken MADDEX token address
     * @param _treasury Treasury contract address
     * @param rolesAddress RolesRegistry contract address
     * @param assetsRegistryAddress AssetsRegistry contract address
     */
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
        
        // Initialize default pack with ID 1
        packs[1] = Pack({
            price: 10 * 1e18, // 10 $MADDEX
            cardCount: 5,
            active: true,
            maxSupply: 10000,
            minted: 0,
            rarityBonus: 0 // Standard pack - no bonus
        });
        nextPackId = 2;
    }
    
    /**
     * @dev Authorizes upgrade for UUPS pattern
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
    
    // Modifiers for role-based access control
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
    
    /**
     * @dev Override _update for pause functionality
     */
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override(ERC1155Upgradeable) whenNotPaused {
        super._update(from, to, ids, values);
    }
    
    /**
     * @dev Returns the URI for a given token ID (MADHAT Platform spec)
     */
    function uri(uint256 tokenId) public pure override returns (string memory) {
        return string(abi.encodePacked(BASE_METADATA_URI, Strings.toString(tokenId)));
    }

    /**
     * @dev Override supportsInterface to resolve conflicts
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC1155Upgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // Helper functions (MADHAT Platform spec)
    function _determineRarity(uint256 randomValue, uint8 rarityBonus) internal pure returns (Rarity) {
        // Apply rarity bonus to increase chances of better cards
        uint256 adjustedValue = randomValue;
        if (rarityBonus > 0) {
            // Bonus shifts probabilities towards higher rarities
            adjustedValue = (randomValue * (100 - rarityBonus)) / 100;
        }
        
        if (adjustedValue < 60) return Rarity.Common;      // 60%
        if (adjustedValue < 90) return Rarity.Uncommon;   // 30%
        if (adjustedValue < 99) return Rarity.Rare;       // 9%
        return Rarity.Ultimate;                         // 1%
    }
    
    function _getAssetVolatility(uint256 assetId) internal view returns (uint8) {
        (, uint8 volatility, , ) = assetsRegistry.getAsset(assetId);
        return volatility;
    }
    
    function _getAssetClout(uint256 assetId) internal view returns (uint8) {
        (, , uint8 clout, ) = assetsRegistry.getAsset(assetId);
        return clout;
    }
    
    function _getAssetName(uint256 assetId) internal view returns (string memory) {
        (string memory name, , , ) = assetsRegistry.getAsset(assetId);
        return name;
    }
    
    function _getAssetFaction(uint256 assetId) internal view returns (uint8) {
        (, , , uint8 faction) = assetsRegistry.getAsset(assetId);
        return faction;
    }
    
    function _getRandomAssetIdForRarity(Rarity rarity) internal view returns (uint256) {
        uint256 randomValue = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender)));
        
        // Map rarity ranges to asset IDs (this should be configured based on your asset setup)
        if (rarity == Rarity.Common) {
            return 1001 + (randomValue % 100); // Common assets 1001-1100
        } else if (rarity == Rarity.Uncommon) {
            return 2001 + (randomValue % 50);  // Uncommon assets 2001-2050
        } else if (rarity == Rarity.Rare) {
            return 3001 + (randomValue % 20);  // Rare assets 3001-3020
        } else {
            return 4001 + (randomValue % 5);   // Ultimate assets 4001-4005
        }
    }
    
    /**
     * @dev Buy pack with specified token and pack ID (MADHAT Platform spec)
     * @param packId ID of the pack to buy
     * @param paymentToken Token address to use for payment
     */
    function buyPack(uint256 packId, address paymentToken) internal {
        Pack storage pack = packs[packId];
        require(pack.active, "Pack not active");
        require(pack.minted < pack.maxSupply, "Sold out");

        // Try pack-specific price first, fallback to global price
        TokenPrice storage tokenPrice = packTokenPrices[packId][paymentToken];
        if (!tokenPrice.enabled) {
            // Fallback to global token price
            tokenPrice = tokenPrices[paymentToken];
            require(tokenPrice.enabled, "Token not supported for this pack");
        }

        uint256 treasuryFee = (tokenPrice.price * TREASURY_FEE_PERCENTAGE) / 100;
        require(
            IERC20(paymentToken).transferFrom(msg.sender, address(this), tokenPrice.price),
            "Payment failed"
        );
        
        // Transfer 20% to treasury
        if (treasuryFee > 0) {
            bool success = IERC20(paymentToken).transfer(treasury, treasuryFee);
            if (!success) revert Errors.TransferFailed();
        }

        pack.minted++;
        _mint(msg.sender, packId, 1, "");
        emit PackPurchased(msg.sender, paymentToken, packId, tokenPrice.price);
    }

    /**
     * @dev Withdraw token to treasury contract
     * @param token Token address to withdraw
     * @param amount Amount to withdraw
     */
    function withdrawToTreasury(address token, uint256 amount) external onlyAdmin {
        if (token == address(0)) revert Errors.ZeroAddress();
        if (amount == 0) revert Errors.InvalidAmount();
        
        // Get token balance of this contract
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance < amount) revert Errors.InsufficientBalance();
        
        // Transfer to treasury
        bool success = IERC20(token).transfer(treasury, amount);
        if (!success) revert Errors.TransferFailed();
    }
    
    /**
     * @dev Buy pack with Token - backward compatibility
     */
    function buyPackWithToken(address tokenAddress) external {
        buyPack(1, tokenAddress); // Default to pack ID 1 for backward compatibility
    }
    
    /**
     * @dev Buy specific pack with token
     */
    function buyPackWithToken(uint256 packId, address tokenAddress) external {
        buyPack(packId, tokenAddress);
    }
    
    /**
     * @dev Open pack and mint cards (MADHAT Platform spec)
     * @param packId ID of the pack to open
     */
    function openPack(uint256 packId) external {
        require(balanceOf(msg.sender, packId) >= 1, "No pack");
        
        Pack storage pack = packs[packId];
        require(pack.cardCount <= MAX_CARDS_PER_PACK, "Invalid pack size");
        
        _burn(msg.sender, packId, 1);
        
        uint256[] memory cardIds = new uint256[](pack.cardCount);
        for (uint8 i = 0; i < pack.cardCount; i++) {
            uint256 randomValue = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, i, packId))) % 100;
            Rarity rarity = _determineRarity(randomValue, pack.rarityBonus);
            uint256 tokenId = _getNextTokenId(rarity);
            uint256 assetId = _getRandomAssetIdForRarity(rarity);
            
            _mintCard(msg.sender, tokenId, assetId, rarity);
            cardIds[i] = tokenId;
        }
        
        emit PackOpened(msg.sender, packId, cardIds);
    }
    
    /**
     * @dev Evolve card (MADHAT Platform spec)
     * Burns 2x Cards + Fee → Mints Next Tier
     */
    function evolve(uint256 tokenId) external {
        require(balanceOf(msg.sender, tokenId) >= 1, "Not owner");
        
        Card storage card = cards[tokenId];
        require(card.active, "Card not active");
        
        // Check if can evolve to next tier
        Rarity nextRarity = _getNextRarity(card.rarity);
        require(nextRarity != card.rarity, "Already max tier");
        
        // Burn evolution fee
        require(IERC20(madexToken).transferFrom(msg.sender, address(this), EVOLUTION_FEE), "Fee payment failed");
        
        // Burn current card and another card of same rarity
        _burn(msg.sender, tokenId, 1);
        
        // Find another card of same rarity to burn
        uint256[] memory userCardList = userCards[msg.sender];
        bool found = false;
        for (uint256 i = 0; i < userCardList.length; i++) {
            if (userCardList[i] != tokenId && cards[userCardList[i]].rarity == card.rarity) {
                _burn(msg.sender, userCardList[i], 1);
                found = true;
                break;
            }
        }
        require(found, "Need 2 cards of same rarity");
        
        // Mint evolved card
        uint256 newTokenId = _getNextTokenId(nextRarity);
        uint256 newAssetId = _getRandomAssetIdForRarity(nextRarity);
        _mintCard(msg.sender, newTokenId, newAssetId, nextRarity);
        
        emit CardEvolved(msg.sender, tokenId, newTokenId);
    }
    
    /**
     * @dev Mint card with stats from AssetsRegistry (MADHAT Platform spec)
     */
    function _mintCard(address to, uint256 tokenId, uint256 assetId, Rarity rarity) internal {
        require(assetsRegistry.assetExists(assetId), "Asset does not exist");
        
        cards[tokenId] = Card({
            volatility: _getAssetVolatility(assetId),
            clout: _getAssetClout(assetId),
            factionId: _getAssetFaction(assetId),
            ability: _getAssetName(assetId),
            rarity: rarity,
            active: true,
            owner: to
        });
        
        _mint(to, tokenId, 1, "");
        userCards[to].push(tokenId);
        
        emit CardMinted(tokenId, to, rarity, cards[tokenId].clout);
    }
    
    /**
     * @dev Get next token ID for rarity
     */
    function _getNextTokenId(Rarity rarity) internal view returns (uint256) {
        if (rarity == Rarity.Common) return COMMON_CARD_START + userCards[msg.sender].length;
        if (rarity == Rarity.Uncommon) return UNCOMMON_CARD_START + userCards[msg.sender].length;
        if (rarity == Rarity.Rare) return RARE_CARD_START + userCards[msg.sender].length;
        return ULTIMATE_CARD_START + userCards[msg.sender].length;
    }
    
    /**
     * @dev Get next rarity tier
     */
    function _getNextRarity(Rarity current) internal pure returns (Rarity) {
        if (current == Rarity.Common) return Rarity.Uncommon;
        if (current == Rarity.Uncommon) return Rarity.Rare;
        if (current == Rarity.Rare) return Rarity.Ultimate;
        return Rarity.Ultimate; // Max tier
    }
    
    // Admin functions (MADHAT Platform spec)
    function setPackActive(uint256 packId, bool active) external onlyAdmin {
        packs[packId].active = active;
    }
    
    /**
     * @dev Create a new pack type
     */
    function createPack(
        uint256 price,
        uint8 cardCount,
        uint256 maxSupply,
        uint8 rarityBonus
    ) external onlyAdmin returns (uint256) {
        require(cardCount > 0 && cardCount <= MAX_CARDS_PER_PACK, "Invalid card count");
        require(maxSupply > 0, "Invalid max supply");
        require(rarityBonus <= 100, "Invalid rarity bonus");
        
        uint256 packId = nextPackId++;
        packs[packId] = Pack({
            price: price,
            cardCount: cardCount,
            active: true,
            maxSupply: maxSupply,
            minted: 0,
            rarityBonus: rarityBonus
        });
        
        emit PackCreated(packId, price, cardCount, maxSupply);
        return packId;
    }
    
    function setTreasury(address _treasury) external onlyAdmin {
        if (_treasury == address(0)) revert Errors.ZeroAddress();
        treasury = _treasury;
    }
    
    function pause() external onlyPauser {
        _pause();
    }
    
    function unpause() external onlyPauser {
        _unpause();
    }
    
    // Role management functions
    function grantAdminRole(address admin) external onlyOwner {
        roles.addRole(ADMIN_ROLE, admin);
        emit AdminRoleGranted(admin, msg.sender);
    }
    
    function revokeAdminRole(address admin) external onlyOwner {
        roles.removeRole(ADMIN_ROLE, admin);
        emit AdminRoleRevoked(admin, msg.sender);
    }
    
    function grantPriceManagerRole(address manager) external onlyOwner {
        roles.addRole(PRICE_MANAGER_ROLE, manager);
    }
    
    function revokePriceManagerRole(address manager) external onlyOwner {
        roles.removeRole(PRICE_MANAGER_ROLE, manager);
    }
    
    function grantPauserRole(address pauser) external onlyOwner {
        roles.addRole(PAUSER_ROLE, pauser);
    }
    
    function revokePauserRole(address pauser) external onlyOwner {
        roles.removeRole(PAUSER_ROLE, pauser);
    }
    
    // Price management functions
    function setTokenPrice(
        address token,
        uint256 price,
        bool enabled,
        uint8 decimals
    ) external onlyPriceManager {
        if (token == address(0)) revert Errors.ZeroAddress();
        
        // Check if token is already in supportedTokens array
        bool tokenExists = false;
        for (uint256 i = 0; i < supportedTokens.length; i++) {
            if (supportedTokens[i] == token) {
                tokenExists = true;
                break;
            }
        }
        
        // Add to supportedTokens if new
        if (!tokenExists && enabled) {
            supportedTokens.push(token);
        }
        
        tokenPrices[token] = TokenPrice({
            price: price,
            enabled: enabled,
            decimals: decimals
        });
        
        emit TokenPriceUpdated(token, price, enabled);
    }
    
    /**
     * @dev Set price per pack & token
     */
    function setPackTokenPrice(
        uint256 packId,
        address token,
        uint256 price,
        bool enabled,
        uint8 decimals
    ) external onlyPriceManager {
        require(token != address(0), "Zero token address");
        require(packs[packId].active || !enabled, "Pack not active");
        
        packTokenPrices[packId][token] = TokenPrice({
            price: price,
            enabled: enabled,
            decimals: decimals
        });
        
        emit TokenPriceUpdated(token, price, enabled);
    }
    
    function setPackPrice(uint256 packId, uint256 price) external onlyPriceManager {
        packs[packId].price = price;
    }
    
    function setPackRarityBonus(uint256 packId, uint8 rarityBonus) external onlyAdmin {
        require(rarityBonus <= 100, "Invalid rarity bonus");
        packs[packId].rarityBonus = rarityBonus;
    }
    
    function setPackMaxSupply(uint256 packId, uint256 maxSupply) external onlyAdmin {
        packs[packId].maxSupply = maxSupply;
    }
    
    // View functions
    function getCard(uint256 tokenId) external view returns (Card memory) {
        return cards[tokenId];
    }
    
    function getPack(uint256 packId) external view returns (Pack memory) {
        return packs[packId];
    }
    
    function getAllPacks() external view returns (uint256[] memory) {
        uint256[] memory packIds = new uint256[](nextPackId - 1);
        for (uint256 i = 1; i < nextPackId; i++) {
            packIds[i - 1] = i;
        }
        return packIds;
    }
    
    function getActivePacks() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 1; i < nextPackId; i++) {
            if (packs[i].active) {
                activeCount++;
            }
        }
        
        uint256[] memory activePackIds = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 1; i < nextPackId; i++) {
            if (packs[i].active) {
                activePackIds[index] = i;
                index++;
            }
        }
        return activePackIds;
    }
    
    function getUserCards(address user) external view returns (uint256[] memory) {
        return userCards[user];
    }
    
    function getTokenPrice(address token) external view returns (TokenPrice memory) {
        return tokenPrices[token];
    }
    
    function getPackTokenPrice(uint256 packId, address token) external view returns (TokenPrice memory) {
        return packTokenPrices[packId][token];
    }
    
    function getPackPriceWithToken(uint256 packId, address token) external view returns (TokenPrice memory) {
        // Try pack-specific price first, fallback to global price
        TokenPrice storage packTokenPrice = packTokenPrices[packId][token];
        if (packTokenPrice.enabled) {
            return packTokenPrice;
        }
        return tokenPrices[token];
    }
    
    function getSupportedTokens() external view returns (address[] memory) {
        return supportedTokens;
    }
    
    function isTokenSupported(address token) external view returns (bool) {
        return tokenPrices[token].enabled;
    }
    
    function isTokenSupportedForPack(uint256 packId, address token) external view returns (bool) {
        // Check pack-specific price first, fallback to global
        TokenPrice storage packTokenPrice = packTokenPrices[packId][token];
        if (packTokenPrice.enabled) {
            return true;
        }
        return tokenPrices[token].enabled;
    }
    
    function hasAdminRole(address account) external view returns (bool) {
        return roles.isRole(ADMIN_ROLE, account);
    }
    
    function hasPriceManagerRole(address account) external view returns (bool) {
        return roles.isRole(PRICE_MANAGER_ROLE, account);
    }
    
    function hasPauserRole(address account) external view returns (bool) {
        return roles.isRole(PAUSER_ROLE, account);
    }
}
