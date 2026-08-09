// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {MADDEXToken} from "../src/tokens/MADDEXToken.sol";
import {MadhatCard} from "../src/tokens/MadhatCardOptimized.sol";
import {StakingPool} from "../src/staking/StakingPool.sol";
import {MadhatTreasury} from "../src/treasury/MadhatTreasury.sol";
import {RolesRegistry} from "../src/registries/roles.sol";
import {AssetsRegistry} from "../src/registries/assets.sol";
// import {EvolutionEngine} from "../src/EvolutionEngine.sol";
// import {GambitAMM} from "../src/GambitAMM.sol";

/**
 * @title DeployCoreContracts
 * @dev Deployment script for the 6 core MADHAT contracts
 * Deployment order: RolesRegistry -> AssetsRegistry -> Token -> Treasury -> Cards -> Staking -> Evolution -> AMM
 */
contract DeployCoreContracts is Script {
    
    // Contract instances
    RolesRegistry public rolesRegistry;
    AssetsRegistry public assetsRegistry;
    MADDEXToken public madexToken;
    MadhatTreasury public treasury;
    MadhatCard public madhatCard;
    StakingPool public stakingPool;
    address public insurancePool;
    
    // Configuration parameters
    struct DeploymentConfig {
        address owner;
        uint256 initialTokenSupply;
        address taxWallet;
        string baseTokenURI;
        address insurancePool;
    }
    
    function run() external {
        DeploymentConfig memory config = _getDeploymentConfig();
        insurancePool = config.insurancePool;
        
        vm.startBroadcast(config.owner);
        
        // Step 1: Deploy Roles Registry
        _deployRolesRegistry(config);
        
        // Step 2: Deploy Assets Registry
        _deployAssetsRegistry(config);
        
        // Step 3: Deploy MADDEX Token
        _deployMADDEXToken(config);
        
        // Step 4: Deploy Staking Pool
        _deployStakingPool(config);
        
        // Step 5: Deploy Treasury
        _deployTreasury(config);
        
        // Step 6: Deploy Madhat Cards
        _deployMadhatCard(config);
        
        // Step 7: Setup cross-contract references
        _setupContractReferences();
        
        // Step 8: Initialize default configurations
        _initializeDefaultConfigs();
        
        vm.stopBroadcast();
        
        // Log deployment addresses
        _logDeploymentAddresses();
    }
    
    /**
     * @dev Get deployment configuration
     */
    function _getDeploymentConfig() internal pure returns (DeploymentConfig memory) {
        return DeploymentConfig({
            owner: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266, // Primary deployment wallet
            initialTokenSupply: 10_000_000 * 10**18, // 10 million tokens
            taxWallet: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266, // Owner as tax wallet
            baseTokenURI: "https://api.madhat.com/metadata/",
            insurancePool: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 // Owner as insurance pool initially
        });
    }
    
    /**
     * @dev Deploy Roles Registry
     */
    function _deployRolesRegistry(DeploymentConfig memory config) internal {
        console.log("Deploying RolesRegistry implementation...");
        RolesRegistry implementation = new RolesRegistry();
        console.log("RolesRegistry implementation deployed at:", address(implementation));
        
        // Deploy proxy
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            abi.encodeWithSelector(
                RolesRegistry.initialize.selector,
                config.owner
            )
        );
        
        rolesRegistry = RolesRegistry(address(proxy));
        console.log("RolesRegistry proxy deployed at:", address(rolesRegistry));
    }
    
    /**
     * @dev Deploy Assets Registry
     */
    function _deployAssetsRegistry(DeploymentConfig memory config) internal {
        console.log("Deploying AssetsRegistry implementation...");
        AssetsRegistry implementation = new AssetsRegistry();
        console.log("AssetsRegistry implementation deployed at:", address(implementation));
        
        // Deploy proxy
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            abi.encodeWithSelector(
                AssetsRegistry.initialize.selector,
                address(rolesRegistry)
            )
        );
        
        assetsRegistry = AssetsRegistry(address(proxy));
        console.log("AssetsRegistry proxy deployed at:", address(assetsRegistry));
    }
    
    /**
     * @dev Deploy MADDEX Token
     */
    function _deployMADDEXToken(DeploymentConfig memory config) internal {
        console.log("Deploying MADDEX Token implementation...");
        MADDEXToken implementation = new MADDEXToken();
        console.log("MADDEX Token implementation deployed at:", address(implementation));
        
        // Deploy proxy
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            abi.encodeWithSelector(
                MADDEXToken.initialize.selector,
                "MADDEX Token",
                "MADDEX",
                config.owner,
                config.initialTokenSupply,
                config.taxWallet,
                config.owner, // Treasury wallet initially set to owner
                address(rolesRegistry) // Add roles registry parameter
            )
        );
        
        madexToken = MADDEXToken(address(proxy));
        console.log("MADDEX Token proxy deployed at:", address(madexToken));
        console.log("Initial supply:", config.initialTokenSupply);
    }
    
    /**
     * @dev Deploy Treasury
     */
    function _deployTreasury(DeploymentConfig memory config) internal {
        console.log("Deploying Treasury implementation...");
        MadhatTreasury implementation = new MadhatTreasury();
        console.log("Treasury implementation deployed at:", address(implementation));
        
        // Deploy proxy
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            abi.encodeWithSelector(
                MadhatTreasury.initialize.selector,
                address(madexToken),
                address(stakingPool), // Staking pool is now deployed
                config.owner, // Governance initially set to owner
                address(rolesRegistry) // Add roles registry parameter
            )
        );
        
        treasury = MadhatTreasury(address(proxy));
        console.log("Treasury proxy deployed at:", address(treasury));
    }
    
    /**
     * @dev Deploy Madhat Cards
     */
    function _deployMadhatCard(DeploymentConfig memory config) internal {
        console.log("Deploying MadhatCard implementation...");
        MadhatCard implementation = new MadhatCard();
        console.log("MadhatCard implementation deployed at:", address(implementation));
        
        // Deploy proxy
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            abi.encodeWithSelector(
                MadhatCard.initialize.selector,
                config.baseTokenURI,
                address(madexToken),
                address(treasury),
                address(rolesRegistry), // Add roles registry parameter
                address(assetsRegistry) // Add assets registry parameter
            )
        );
        
        madhatCard = MadhatCard(address(proxy));
        console.log("MadhatCard proxy deployed at:", address(madhatCard));
    }
    
    /**
     * @dev Deploy Staking Pool
     */
    function _deployStakingPool(DeploymentConfig memory config) internal {
        console.log("Deploying StakingPool implementation...");
        StakingPool implementation = new StakingPool();
        console.log("StakingPool implementation deployed at:", address(implementation));
        
        // Deploy proxy
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            abi.encodeWithSelector(
                StakingPool.initialize.selector,
                address(madexToken),
                address(madexToken), // Reward token same as staking token
                0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266, // Use owner as temporary treasury address
                config.insurancePool, // Insurance pool address
                address(rolesRegistry) // Add roles registry parameter
            )
        );
        
        stakingPool = StakingPool(address(proxy));
        console.log("StakingPool proxy deployed at:", address(stakingPool));
    }
    
    
    /**
     * @dev Setup cross-contract references
     */
    function _setupContractReferences() internal {
        // Update StakingPool with correct Treasury address
        stakingPool.updateTreasury(address(treasury));
        
        // Update StakingPool with correct Insurance Pool address
        stakingPool.updateInsurancePool(insurancePool);
        
        console.log("Cross-contract references setup completed");
    }
    
    /**
     * @dev Initialize default configurations
     */
    function _initializeDefaultConfigs() internal {
        // Grant roles via RolesRegistry
        _grantRolesToContracts();
        
        // Transfer remaining tokens to Treasury
        address owner = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
        uint256 remainingBalance = madexToken.balanceOf(owner);
        if (remainingBalance > 0) {
            madexToken.transfer(address(treasury), remainingBalance);
            console.log("Transferred", remainingBalance, "tokens to Treasury");
        }
        
        // Create default card packs
        _createDefaultCardPacks();
        
        console.log("Default configurations initialized");
    }
    
    /**
     * @dev Grant roles to contracts via RolesRegistry
     */
    function _grantRolesToContracts() internal {
        address owner = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
        
        // Grant MINTER_ROLE and BURNER_ROLE to owner
        if (!rolesRegistry.hasRole(madexToken.MINTER_ROLE(), owner)) {
            rolesRegistry.addRole(madexToken.MINTER_ROLE(), owner);
        }
        if (!rolesRegistry.hasRole(madexToken.BURNER_ROLE(), owner)) {
            rolesRegistry.addRole(madexToken.BURNER_ROLE(), owner);
        }
        
        // Grant MINTER_ROLE to Staking Pool for rewards
        if (!rolesRegistry.hasRole(madexToken.MINTER_ROLE(), address(stakingPool))) {
            rolesRegistry.addRole(madexToken.MINTER_ROLE(), address(stakingPool));
        }
        
        // Grant SPENDER_ROLE to Staking Pool in Treasury
        if (!rolesRegistry.hasRole(treasury.SPENDER_ROLE(), address(stakingPool))) {
            rolesRegistry.addRole(treasury.SPENDER_ROLE(), address(stakingPool));
        }
        
        // Grant admin roles for MadhatCard
        if (!rolesRegistry.hasRole(madhatCard.ADMIN_ROLE(), owner)) {
            rolesRegistry.addRole(madhatCard.ADMIN_ROLE(), owner);
        }
        if (!rolesRegistry.hasRole(madhatCard.PRICE_MANAGER_ROLE(), owner)) {
            rolesRegistry.addRole(madhatCard.PRICE_MANAGER_ROLE(), owner);
        }
        if (!rolesRegistry.hasRole(madhatCard.PAUSER_ROLE(), owner)) {
            rolesRegistry.addRole(madhatCard.PAUSER_ROLE(), owner);
        }
        
        // Grant emergency roles for StakingPool
        if (!rolesRegistry.hasRole(stakingPool.EMERGENCY_ROLE(), owner)) {
            rolesRegistry.addRole(stakingPool.EMERGENCY_ROLE(), owner);
        }
        if (!rolesRegistry.hasRole(stakingPool.PAUSER_ROLE(), owner)) {
            rolesRegistry.addRole(stakingPool.PAUSER_ROLE(), owner);
        }
        
        // Grant roles for Treasury
        if (!rolesRegistry.hasRole(treasury.SPENDER_ROLE(), owner)) {
            rolesRegistry.addRole(treasury.SPENDER_ROLE(), owner);
        }
        if (!rolesRegistry.hasRole(treasury.DEPOSITOR_ROLE(), owner)) {
            rolesRegistry.addRole(treasury.DEPOSITOR_ROLE(), owner);
        }
        if (!rolesRegistry.hasRole(treasury.PAUSER_ROLE(), owner)) {
            rolesRegistry.addRole(treasury.PAUSER_ROLE(), owner);
        }
        if (!rolesRegistry.hasRole(treasury.DISTRIBUTION_ROLE(), owner)) {
            rolesRegistry.addRole(treasury.DISTRIBUTION_ROLE(), owner);
        }
        
        console.log("Roles granted to all contracts");
    }
    
    /**
     * @dev Create default card packs
     */
    function _createDefaultCardPacks() internal {
        // Common Pack - 8 MADDEX tokens
        madhatCard.createPack(
            8 * 10**18,
            3,
            10000,
            0 // Standard rarity bonus
        );
        
        // Uncommon Pack - 24 MADDEX tokens
        madhatCard.createPack(
            24 * 10**18,
            5,
            5000,
            25 // 25% rarity bonus for better cards
        );
        
        // Rare Pack - 60 MADDEX tokens
        madhatCard.createPack(
            60 * 10**18,
            5,
            1000,
            50 // 50% rarity bonus for rare cards
        );
        
        console.log("Default card packs created");
    }
    
    /**
     * @dev Log deployment addresses
     */
    function _logDeploymentAddresses() internal view {
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("RolesRegistry:", address(rolesRegistry));
        console.log("AssetsRegistry:", address(assetsRegistry));
        console.log("MADDEX Token:", address(madexToken));
        console.log("Treasury:", address(treasury));
        console.log("MadhatCard:", address(madhatCard));
        console.log("StakingPool:", address(stakingPool));
        console.log("========================\n");
    }
    
    /**
     * @dev Get contract addresses for verification
     */
    function getDeployedAddresses() external view returns (
        address _rolesRegistry,
        address _assetsRegistry,
        address _madexToken,
        address _treasury,
        address _madhatCard,
        address _stakingPool
    ) {
        return (
            address(rolesRegistry),
            address(assetsRegistry),
            address(madexToken),
            address(treasury),
            address(madhatCard),
            address(stakingPool)
        );
    }
    
    /**
     * @dev Verify deployment was successful
     */
    function verifyDeployment() external view returns (bool success) {
        // Check if all contracts are deployed
        if (address(rolesRegistry) == address(0)) return false;
        if (address(assetsRegistry) == address(0)) return false;
        if (address(madexToken) == address(0)) return false;
        if (address(treasury) == address(0)) return false;
        if (address(madhatCard) == address(0)) return false;
        if (address(stakingPool) == address(0)) return false;
        
        // Check if contracts are properly initialized
        if (rolesRegistry.hasRole(rolesRegistry.DEFAULT_ADMIN_ROLE(), 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266) == false) return false;
        if (assetsRegistry.owner() == address(0)) return false;
        if (madexToken.owner() == address(0)) return false;
        if (treasury.owner() == address(0)) return false;
        if (madhatCard.owner() == address(0)) return false;
        if (stakingPool.owner() == address(0)) return false;
        
        return true;
    }
}
