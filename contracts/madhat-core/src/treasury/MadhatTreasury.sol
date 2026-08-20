// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ABDKMath64x64} from "abdk-libraries-solidity/ABDKMath64x64.sol";
import {Errors} from "../errors/Errors.sol";
import {RolesRegistry} from "../registries/roles.sol";

/**
 * @title MadhatTreasury
 * @dev Central treasury contract for MADHAT ecosystem
 * Features: multi-asset management, fee collection, automated distributions, governance integration
 */
contract MadhatTreasury is Initializable, OwnableUpgradeable, UUPSUpgradeable, PausableUpgradeable {
    
    RolesRegistry public roles;
    
    using ABDKMath64x64 for int128;
    using ABDKMath64x64 for uint256;
    
    // Role definitions
    bytes32 public constant SPENDER_ROLE = keccak256("SPENDER_ROLE");
    bytes32 public constant DEPOSITOR_ROLE = keccak256("DEPOSITOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant DISTRIBUTION_ROLE = keccak256("DISTRIBUTION_ROLE");
    
    // Distribution categories
    enum DistributionCategory {
        StakingRewards,    // 0 - Rewards for stakers
        Development,        // 1 - Development fund
        Marketing,          // 2 - Marketing and partnerships
        Liquidity,          // 3 - Liquidity provision
        TreasuryReserve,    // 4 - Treasury reserve
        Emergency           // 5 - Emergency fund
    }
    
    // Asset structure
    struct Asset {
        address tokenAddress;     // Token contract address
        string symbol;            // Token symbol
        uint256 balance;          // Current balance
        uint256 totalDeposited;   // Total deposited amount
        uint256 totalWithdrawn;   // Total withdrawn amount
        bool active;              // Whether asset is tracked
        bool isNative;            // Whether this is native ETH
    }
    
    // Distribution rule structure
    struct DistributionRule {
        DistributionCategory category;
        uint256 percentage;        // Percentage in basis points (10000 = 100%)
        address recipient;         // Recipient address
        bool active;               // Whether rule is active
        uint256 lastDistribution; // Last distribution timestamp
        uint256 distributionPeriod; // Distribution period in seconds
    }
    
    // Transaction structure for audit trail
    struct Transaction {
        uint256 id;
        address asset;
        address from;
        address to;
        uint256 amount;
        uint256 timestamp;
        string transactionType; // "deposit", "withdrawal", "distribution"
        string reason;
    }
    
    // Storage mappings
    mapping(address => Asset) public assets;
    mapping(DistributionCategory => DistributionRule[]) public distributionRules;
    mapping(uint256 => Transaction) public transactions;
    mapping(address => bool) public authorizedSpenders;
    mapping(address => bool) public authorizedDepositors;
    
    // Contract references
    address public madexToken;
    address public stakingPool;
    address public governance;
    
    // Treasury statistics
    uint256 public totalValueLocked;
    uint256 public transactionCounter;
    uint256 public distributionCounter;
    
    // Constants
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MAX_DISTRIBUTION_RULES = 10;
    uint256 public constant MIN_DISTRIBUTION_PERIOD = 1 days;
    
    // Reentrancy guard state
    uint256 private _status;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    
    // Events
    event AssetRegistered(address indexed tokenAddress, string symbol);
    event Deposited(address indexed asset, address indexed from, uint256 amount);
    event Withdrawn(address indexed asset, address indexed to, uint256 amount);
    event DistributionExecuted(DistributionCategory category, address indexed recipient, uint256 amount);
    event DistributionRuleAdded(DistributionCategory category, address recipient, uint256 percentage);
    event DistributionRuleUpdated(DistributionCategory category, uint256 ruleIndex, uint256 percentage);
    event SpenderAuthorized(address indexed spender);
    event SpenderRevoked(address indexed spender);
    event EmergencyWithdraw(address indexed asset, address indexed to, uint256 amount);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    /**
     * @dev Initialize the MadhatTreasury contract
     * @param _madexToken MADDEX token address
     * @param _stakingPool Staking pool address
     * @param _governance Governance contract address
     */
    function initialize(
        address _madexToken,
        address _stakingPool,
        address _governance,
        address rolesAddress
    ) public initializer {
        __Ownable_init(msg.sender);
        __Pausable_init();
        
        // Initialize reentrancy guard
        _status = _NOT_ENTERED;
        
        if (_madexToken == address(0) || _stakingPool == address(0) || _governance == address(0)) {
            revert Errors.ZeroAddress();
        }
        
        if (rolesAddress == address(0)) revert Errors.ZeroAddress();
        roles = RolesRegistry(rolesAddress);
        
        madexToken = _madexToken;
        stakingPool = _stakingPool;
        governance = _governance;
        
        // Register MADDEX token as primary asset
        _registerAsset(_madexToken, "MADDEX");
        
        // Initialize default distribution rules
        _initializeDefaultDistributionRules();
    }
    
    /**
     * @dev Authorizes upgrade for UUPS pattern
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
    
    /**
     * @dev Initialize default distribution rules
     */
    function _initializeDefaultDistributionRules() internal {
        // 40% to Staking Rewards
        _addDistributionRule(DistributionCategory.StakingRewards, stakingPool, 4000, 7 days);
        
        // 25% to Development
        _addDistributionRule(DistributionCategory.Development, governance, 2500, 30 days);
        
        // 20% to Marketing
        _addDistributionRule(DistributionCategory.Marketing, governance, 2000, 30 days);
        
        // 10% to Liquidity
        _addDistributionRule(DistributionCategory.Liquidity, governance, 1000, 14 days);
        
        // 5% to Treasury Reserve
        _addDistributionRule(DistributionCategory.TreasuryReserve, address(this), 500, 90 days);
    }
    
    /**
     * @dev Register a new asset for tracking
     * @param tokenAddress Token contract address
     * @param symbol Token symbol
     */
    function registerAsset(address tokenAddress, string memory symbol) external onlyOwner {
        if (tokenAddress == address(0)) revert Errors.ZeroAddress();
        if (assets[tokenAddress].active) revert Errors.InvalidAsset();
        
        _registerAsset(tokenAddress, symbol);
    }
    
    /**
     * @dev Internal function to register asset
     */
    function _registerAsset(address tokenAddress, string memory symbol) internal {
        assets[tokenAddress] = Asset({
            tokenAddress: tokenAddress,
            symbol: symbol,
            balance: 0,
            totalDeposited: 0,
            totalWithdrawn: 0,
            active: true,
            isNative: false
        });
        
        emit AssetRegistered(tokenAddress, symbol);
    }
    
    /**
     * @dev Deposit tokens into treasury
     * @param tokenAddress Token contract address
     * @param amount Amount to deposit
     * @param reason Deposit reason
     */
    function deposit(
        address tokenAddress,
        uint256 amount,
        string memory reason
    ) external nonReentrant whenNotPaused {
        if (!roles.isRole(DEPOSITOR_ROLE, msg.sender)) revert Errors.Unauthorized();
        if (amount == 0) revert Errors.InvalidAmount();
        if (!assets[tokenAddress].active) revert Errors.InvalidAsset();
        
        // Transfer tokens to treasury
        require(
            IERC20(tokenAddress).transferFrom(msg.sender, address(this), amount),
            "Deposit transfer failed"
        );
        
        // Update asset records
        Asset storage asset = assets[tokenAddress];
        asset.balance += amount;
        asset.totalDeposited += amount;
        
        // Update TVL
        _updateTotalValueLocked();
        
        // Record transaction
        _recordTransaction(tokenAddress, msg.sender, address(this), amount, "deposit", reason);
        
        emit Deposited(tokenAddress, msg.sender, amount);
    }
    
    /**
     * @dev Withdraw tokens from treasury
     * @param tokenAddress Token contract address
     * @param to Recipient address
     * @param amount Amount to withdraw
     * @param reason Withdrawal reason
     */
    function withdraw(
        address tokenAddress,
        address to,
        uint256 amount,
        string memory reason
    ) external nonReentrant {
        if (!roles.isRole(SPENDER_ROLE, msg.sender)) revert Errors.Unauthorized();
        if (to == address(0)) revert Errors.ZeroAddress();
        if (amount == 0) revert Errors.InvalidAmount();
        if (!assets[tokenAddress].active) revert Errors.InvalidAsset();
        
        Asset storage asset = assets[tokenAddress];
        if (asset.balance < amount) revert Errors.InsufficientContractBalance();
        
        // Transfer tokens
        require(
            IERC20(tokenAddress).transfer(to, amount),
            "Withdrawal transfer failed"
        );
        
        // Update asset records
        asset.balance -= amount;
        asset.totalWithdrawn += amount;
        
        // Update TVL
        _updateTotalValueLocked();
        
        // Record transaction
        _recordTransaction(tokenAddress, address(this), to, amount, "withdrawal", reason);
        
        emit Withdrawn(tokenAddress, to, amount);
    }
    
    /**
     * @dev Execute automatic distributions based on rules
     * @param category Distribution category to execute
     */
    function executeDistribution(DistributionCategory category) external nonReentrant whenNotPaused {
        if (!roles.isRole(DISTRIBUTION_ROLE, msg.sender) && msg.sender != owner()) revert Errors.Unauthorized();
        
        DistributionRule[] storage rules = distributionRules[category];
        if (rules.length == 0) revert Errors.InvalidTransactionType();
        
        uint256 totalDistributed = 0;
        
        for (uint256 i = 0; i < rules.length; i++) {
            DistributionRule storage rule = rules[i];
            
            if (!rule.active) continue;
            
            // Check if distribution period has passed
            if (block.timestamp < rule.lastDistribution + rule.distributionPeriod) {
                continue;
            }
            
            // Calculate distribution amount (using MADDEX token as base)
            uint256 availableAmount = assets[madexToken].balance;
            uint256 distributionAmount = (availableAmount * rule.percentage) / BASIS_POINTS;
            
            if (distributionAmount == 0 || assets[madexToken].balance < distributionAmount) {
                continue;
            }
            
            // Execute distribution
            require(
                IERC20(madexToken).transfer(rule.recipient, distributionAmount),
                "Distribution transfer failed"
            );
            
            // Update records
            assets[madexToken].balance -= distributionAmount;
            assets[madexToken].totalWithdrawn += distributionAmount;
            rule.lastDistribution = block.timestamp;
            
            totalDistributed += distributionAmount;
            
            // Record transaction
            _recordTransaction(
                madexToken,
                address(this),
                rule.recipient,
                distributionAmount,
                "distribution",
                string(abi.encodePacked("Auto distribution to ", _categoryToString(category)))
            );
            
            emit DistributionExecuted(category, rule.recipient, distributionAmount);
        }
        
        // Update TVL
        if (totalDistributed > 0) {
            _updateTotalValueLocked();
            distributionCounter++;
        }
    }
    
    /**
     * @dev Add a new distribution rule
     * @param category Distribution category
     * @param recipient Recipient address
     * @param percentage Percentage in basis points
     * @param period Distribution period in seconds
     */
    function addDistributionRule(
        DistributionCategory category,
        address recipient,
        uint256 percentage,
        uint256 period
    ) external onlyOwner {
        if (recipient == address(0)) revert Errors.ZeroAddress();
        if (percentage == 0 || percentage > 5000) revert Errors.InvalidAmount(); // Max 50%
        if (period < MIN_DISTRIBUTION_PERIOD) revert Errors.InvalidAmount();
        
        _addDistributionRule(category, recipient, percentage, period);
        
        emit DistributionRuleAdded(category, recipient, percentage);
    }
    
    /**
     * @dev Internal function to add distribution rule
     */
    function _addDistributionRule(
        DistributionCategory category,
        address recipient,
        uint256 percentage,
        uint256 period
    ) internal {
        DistributionRule[] storage rules = distributionRules[category];
        
        if (rules.length >= MAX_DISTRIBUTION_RULES) revert Errors.MaxSupplyExceeded();
        
        rules.push(DistributionRule({
            category: category,
            percentage: percentage,
            recipient: recipient,
            active: true,
            lastDistribution: 0,
            distributionPeriod: period
        }));
    }
    
    /**
     * @dev Update existing distribution rule
     * @param category Distribution category
     * @param ruleIndex Rule index
     * @param percentage New percentage
     */
    function updateDistributionRule(
        DistributionCategory category,
        uint256 ruleIndex,
        uint256 percentage
    ) external onlyOwner {
        if (percentage == 0 || percentage > 5000) revert Errors.InvalidAmount();
        
        DistributionRule[] storage rules = distributionRules[category];
        if (ruleIndex >= rules.length) revert Errors.InvalidAmount();
        
        rules[ruleIndex].percentage = percentage;
        
        emit DistributionRuleUpdated(category, ruleIndex, percentage);
    }
    
    /**
     * @dev Authorize a spender
     * @param spender Spender address
     */
    function authorizeSpender(address spender) external onlyOwner {
        if (spender == address(0)) revert Errors.ZeroAddress();
        roles.addRole(SPENDER_ROLE, spender);
        emit SpenderAuthorized(spender);
    }
    
    function revokeSpender(address spender) external onlyOwner {
        roles.removeRole(SPENDER_ROLE, spender);
        emit SpenderRevoked(spender);
    }
    
    function authorizeDepositor(address depositor) external onlyOwner {
        if (depositor == address(0)) revert Errors.ZeroAddress();
        roles.addRole(DEPOSITOR_ROLE, depositor);
    }
    
    function revokeDepositor(address depositor) external onlyOwner {
        roles.removeRole(DEPOSITOR_ROLE, depositor);
    }
    
    /**
     * @dev Emergency withdraw function
     * @param tokenAddress Token address
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address tokenAddress, uint256 amount) external onlyOwner {
        if (!assets[tokenAddress].active) revert Errors.InvalidAsset();
        if (assets[tokenAddress].balance < amount) revert Errors.InsufficientContractBalance();
        
        Asset storage asset = assets[tokenAddress];
        asset.balance -= amount;
        asset.totalWithdrawn += amount;
        
        require(
            IERC20(tokenAddress).transfer(owner(), amount),
            "Emergency transfer failed"
        );
        
        _recordTransaction(tokenAddress, address(this), owner(), amount, "emergency", "Emergency withdrawal");
        
        emit EmergencyWithdraw(tokenAddress, owner(), amount);
    }
    
    /**
     * @dev Update total value locked
     */
    function _updateTotalValueLocked() internal {
        // For simplicity, we'll use MADDEX token balance as TVL
        // In production, this would calculate USD value of all assets
        totalValueLocked = assets[madexToken].balance;
    }
    
    /**
     * @dev Record transaction for audit trail
     */
    function _recordTransaction(
        address asset,
        address from,
        address to,
        uint256 amount,
        string memory transactionType,
        string memory reason
    ) internal {
        uint256 transactionId = ++transactionCounter;
        
        transactions[transactionId] = Transaction({
            id: transactionId,
            asset: asset,
            from: from,
            to: to,
            amount: amount,
            timestamp: block.timestamp,
            transactionType: transactionType,
            reason: reason
        });
    }
    
    /**
     * @dev Convert category enum to string
     */
    function _categoryToString(DistributionCategory category) internal pure returns (string memory) {
        if (category == DistributionCategory.StakingRewards) return "Staking Rewards";
        if (category == DistributionCategory.Development) return "Development";
        if (category == DistributionCategory.Marketing) return "Marketing";
        if (category == DistributionCategory.Liquidity) return "Liquidity";
        if (category == DistributionCategory.TreasuryReserve) return "Treasury Reserve";
        return "Emergency";
    }
    
    // View functions
    function getAsset(address tokenAddress) external view returns (
        address tokenAddr,
        string memory symbol,
        uint256 balance,
        uint256 totalDeposited,
        uint256 totalWithdrawn,
        bool active,
        bool isNative
    ) {
        Asset storage asset = assets[tokenAddress];
        return (
            asset.tokenAddress,
            asset.symbol,
            asset.balance,
            asset.totalDeposited,
            asset.totalWithdrawn,
            asset.active,
            asset.isNative
        );
    }
    
    function getDistributionRules(DistributionCategory category) external view returns (DistributionRule[] memory) {
        return distributionRules[category];
    }
    
    function getTransaction(uint256 transactionId) external view returns (
        uint256 id,
        address asset,
        address from,
        address to,
        uint256 amount,
        uint256 timestamp,
        string memory transactionType,
        string memory reason
    ) {
        Transaction storage transaction = transactions[transactionId];
        return (
            transaction.id,
            transaction.asset,
            transaction.from,
            transaction.to,
            transaction.amount,
            transaction.timestamp,
            transaction.transactionType,
            transaction.reason
        );
    }
    
    function getTreasuryStats() external view returns (
        uint256 _totalValueLocked,
        uint256 _transactionCounter,
        uint256 _distributionCounter,
        uint256 madexBalance
    ) {
        return (
            totalValueLocked,
            transactionCounter,
            distributionCounter,
            assets[madexToken].balance
        );
    }
    
    // Admin functions
    function pause() external {
        if (!roles.isRole(PAUSER_ROLE, msg.sender)) revert Errors.Unauthorized();
        _pause();
    }
    
    function unpause() external {
        if (!roles.isRole(PAUSER_ROLE, msg.sender)) revert Errors.Unauthorized();
        _unpause();
    }
    
    function updateGovernance(address newGovernance) external onlyOwner {
        if (newGovernance == address(0)) revert Errors.ZeroAddress();
        governance = newGovernance;
    }
    
    function updateStakingPool(address newStakingPool) external onlyOwner {
        if (newStakingPool == address(0)) revert Errors.ZeroAddress();
        stakingPool = newStakingPool;
    }
    
    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     */
    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}
