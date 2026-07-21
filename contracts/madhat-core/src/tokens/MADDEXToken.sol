// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Errors} from "../errors/Errors.sol";
import {RolesRegistry} from "../registries/roles.sol";

/**
 * @title MADDEXToken
 * @dev ERC-20 token for MADHAT ecosystem with upgradeable functionality
 * Features: pausable, mintable, burnable, role-based access
 */
contract MADDEXToken is Initializable, ERC20Upgradeable, OwnableUpgradeable, UUPSUpgradeable {
    
    RolesRegistry public roles;
    
    // Role definitions for fine-grained access control
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    
    // Maximum supply cap (100 million tokens)
    uint256 public constant MAX_SUPPLY = 100_000_000 * 10**18;
    
    // Tax/fee configuration (in basis points)
    uint256 public transferTaxRate;
    address public taxWallet;
    
    // Treasury configuration
    address public treasuryWallet;
    uint256 public constant TREASURY_BURN_PERCENTAGE = 2000; // 20% in basis points
    
    // Fee exemption mapping for LPs and Staking Contracts
    mapping(address => bool) public isExempt;
    
    // Events
    event TaxUpdated(uint256 oldRate, uint256 newRate);
    event TaxWalletUpdated(address oldWallet, address newWallet);
    event TreasuryWalletUpdated(address oldWallet, address newWallet);
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    event TreasuryBurnShare(address indexed treasury, uint256 amount);
    event ExemptionUpdated(address indexed account, bool isExempt);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    /**
     * @dev Initialize the MADDEXToken contract
     * @param name Token name
     * @param symbol Token symbol
     * @param owner Contract owner
     * @param initialSupply Initial token supply
     * @param _taxWallet Wallet to receive transfer taxes
     */
    function initialize(
        string memory name,
        string memory symbol,
        address owner,
        uint256 initialSupply,
        address _taxWallet,
        address _treasuryWallet,
        address rolesAddress
    ) public initializer {
        if (owner == address(0)) revert Errors.ZeroAddress();
        
        __ERC20_init(name, symbol);
        __Ownable_init(owner);
        transferTaxRate = 25; // Default: 0.25% tax
        
        if (_taxWallet == address(0)) revert Errors.ZeroAddress();
        taxWallet = _taxWallet;
        
        if (_treasuryWallet == address(0)) revert Errors.ZeroAddress();
        treasuryWallet = _treasuryWallet;
        
        if (rolesAddress == address(0)) revert Errors.ZeroAddress();
        roles = RolesRegistry(rolesAddress);
        
        // Mint initial supply if specified
        if (initialSupply > 0) {
            if (initialSupply > MAX_SUPPLY) revert Errors.MaxSupplyExceeded();
            _mint(owner, initialSupply);
            emit TokensMinted(owner, initialSupply);
        }
    }
    
    /**
     * @dev Authorizes upgrade for UUPS pattern
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
    
    modifier onlyRole(bytes32 role) {
        if (!roles.isRole(role, msg.sender)) revert Errors.Unauthorized();
        _;
    }
    
    /**
     * @dev Mint new tokens (only MINTER_ROLE)
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        if (to == address(0)) revert Errors.ZeroAddress();
        if (amount == 0) revert Errors.InvalidAmount();
        
        uint256 newTotalSupply = totalSupply() + amount;
        if (newTotalSupply > MAX_SUPPLY) revert Errors.MaxSupplyExceeded();
        
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }
    
    /**
     * @dev Burn tokens
     */
    function burn(uint256 amount) external {
        if (amount == 0) revert Errors.InvalidAmount();
        if (balanceOf(msg.sender) < amount) revert Errors.InsufficientBalance();
        
        burnInternal(msg.sender, amount);
    }
    
    /**
     * @dev Burn tokens from specific account (only BURNER_ROLE)
     */
    function burnFrom(address account, uint256 amount) external onlyRole(BURNER_ROLE) {
        if (account == address(0)) revert Errors.ZeroAddress();
        if (amount == 0) revert Errors.InvalidAmount();
        if (balanceOf(account) < amount) revert Errors.InsufficientBalance();
        
        burnInternal(account, amount);
    }
    
    /**
     * @dev Update transfer tax rate (only owner)
     * @param newRate New tax rate in basis points (0-1000 = 0-10%)
     */
    function updateTransferTax(uint256 newRate) external onlyOwner {
        if (newRate > 1000) revert Errors.InvalidAmount(); // Max 10% tax
        uint256 oldRate = transferTaxRate;
        transferTaxRate = newRate;
        emit TaxUpdated(oldRate, newRate);
    }
    
    /**
     * @dev Update tax wallet (only owner)
     */
    function updateTaxWallet(address newWallet) external onlyOwner {
        if (newWallet == address(0)) revert Errors.ZeroAddress();
        address oldWallet = taxWallet;
        taxWallet = newWallet;
        emit TaxWalletUpdated(oldWallet, newWallet);
    }
    
    /**
     * @dev Override transfer to include tax
     */
    function transfer(address to, uint256 amount) public override returns (bool) {
        if (transferTaxRate > 0 && to != taxWallet && !isExempt[msg.sender] && !isExempt[to]) {
            uint256 tax = (amount * transferTaxRate) / 10000;
            uint256 amountAfterTax = amount - tax;
            
            // Transfer tax to tax wallet
            super.transfer(taxWallet, tax);
            // Transfer remaining amount to recipient
            return super.transfer(to, amountAfterTax);
        }
        return super.transfer(to, amount);
    }
    
    /**
     * @dev Override transferFrom to include tax
     */
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        if (transferTaxRate > 0 && to != taxWallet && !isExempt[from] && !isExempt[to]) {
            uint256 tax = (amount * transferTaxRate) / 10000;
            uint256 amountAfterTax = amount - tax;
            
            // Transfer tax to tax wallet
            super.transferFrom(from, taxWallet, tax);
            // Transfer remaining amount to recipient
            return super.transferFrom(from, to, amountAfterTax);
        }
        return super.transferFrom(from, to, amount);
    }

    /**
     * @dev Get remaining mintable supply
     */
    function remainingMintableSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalSupply();
    }
    
    /**
     * @dev Emergency function to recover stuck tokens (only owner)
     */
    function emergencyRecover(address token, uint256 amount) external onlyOwner {
        if (token == address(this)) {
            // Cannot recover own tokens
            revert Errors.InvalidAsset();
        }
        
        // Implementation would require IERC20 interface
        IERC20(token).transfer(owner(), amount);
    }
    
    /**
     * @dev Set fee exemption for multiple addresses (only owner)
     * @param accounts Array of addresses to set exemption for
     * @param exempt Array of exemption status (true = exempt, false = not exempt)
     */
    function setFeeExemption(address[] memory accounts, bool[] memory exempt) external onlyOwner {
        if (accounts.length != exempt.length) revert Errors.ArrayLengthMismatch();
        
        for (uint256 i = 0; i < accounts.length; i++) {
            if (accounts[i] == address(0)) revert Errors.ZeroAddress();
            isExempt[accounts[i]] = exempt[i];
            emit ExemptionUpdated(accounts[i], exempt[i]);
        }
    }
    
    /**
     * @dev Set fee exemption for single address (only owner)
     * @param account Address to set exemption for
     * @param exempt Exemption status (true = exempt, false = not exempt)
     */
    function setSingleFeeExemption(address account, bool exempt) external onlyOwner {
        if (account == address(0)) revert Errors.ZeroAddress();
        isExempt[account] = exempt;
        emit ExemptionUpdated(account, exempt);
    }
    
    /**
     * @dev Check if address is exempt from fees
     * @param account Address to check
     * @return True if exempt, false otherwise
     */
    function isExemptFromFees(address account) external view returns (bool) {
        return isExempt[account];
    }
    
    /**
     * @dev Burn tokens from specific account (only owner)
     * @param account Account to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burn(address account, uint256 amount) external onlyOwner {
        burnInternal(account, amount);
    }
    
    /**
     * @dev Internal function to burn tokens from specific account with 4.9% limit
     * @param account Account to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burnInternal(address account, uint256 amount) internal {
        if (account == address(0)) revert Errors.ZeroAddress();
        if (amount == 0) revert Errors.InvalidAmount();
        
        // Enforce 4.9% limit - cannot burn more than 4.9% of total supply
        uint256 maxBurnAmount = (totalSupply() * 49) / 1000; // 4.9% = 49/1000
        if (amount > maxBurnAmount) revert Errors.InvalidAmount();
        
        uint256 accountBalance = balanceOf(account);
        if (accountBalance < amount) revert Errors.InsufficientBalance();
        
        // Send 20% amount burning to treasury address
        uint256 treasuryShare = (amount * TREASURY_BURN_PERCENTAGE) / 10000;
        uint256 actualBurnAmount = amount - treasuryShare;
        
        if (treasuryShare > 0) {
            _transfer(account, treasuryWallet, treasuryShare);
            emit TreasuryBurnShare(treasuryWallet, treasuryShare);
        }
        
        _burn(account, actualBurnAmount);
        emit TokensBurned(account, actualBurnAmount);
    }
    
    /**
     * @dev Update treasury wallet (only owner)
     */
    function updateTreasuryWallet(address newWallet) external onlyOwner {
        if (newWallet == address(0)) revert Errors.ZeroAddress();
        address oldWallet = treasuryWallet;
        treasuryWallet = newWallet;
        emit TreasuryWalletUpdated(oldWallet, newWallet);
    }
    
    /**
     * @dev Calculate voting power based on square root of balance
     * @param account Account to calculate voting power for
     * @return Voting power (square root of balance)
     */
    function votePower(address account) external view returns (uint256) {
        uint256 balance = balanceOf(account);
        return sqrt(balance);
    }
    
    /**
     * @dev Square root function using Babylonian method
     * @param x Number to calculate square root of
     * @return Square root of x
     */
    function sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }
}
