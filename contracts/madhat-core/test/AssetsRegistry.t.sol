// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {AssetsRegistry} from "../src/registries/assets.sol";
import {RolesRegistry} from "../src/registries/roles.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract AssetsRegistryTest is Test {
    AssetsRegistry public assetsRegistry;
    RolesRegistry public rolesRegistry;
    
    address public owner = address(this);
    address public admin = address(this);
    address public updater = address(0x2);
    address public user1 = address(0x3);
    address public user2 = address(0x4);
    
    uint256 public constant ASSET_ID_1 = 1001;
    uint256 public constant ASSET_ID_2 = 1002;
    uint256 public constant ASSET_ID_3 = 1003;
    
    function setUp() public virtual {
        // Deploy RolesRegistry implementation
        RolesRegistry rolesImpl = new RolesRegistry();
        
        // Deploy RolesRegistry proxy
        bytes memory rolesInitData = abi.encodeWithSelector(
            RolesRegistry.initialize.selector,
            owner
        );
        ERC1967Proxy rolesProxy = new ERC1967Proxy(
            address(rolesImpl),
            rolesInitData
        );
        rolesRegistry = RolesRegistry(address(rolesProxy));
        
        // Deploy AssetsRegistry implementation
        AssetsRegistry assetsImpl = new AssetsRegistry();
        
        // Deploy AssetsRegistry proxy with owner parameter
        bytes memory assetsInitData = abi.encodeWithSelector(
            AssetsRegistry.initialize.selector,
            address(rolesRegistry),
            owner  // Pass owner explicitly
        );
        ERC1967Proxy assetsProxy = new ERC1967Proxy(
            address(assetsImpl),
            assetsInitData
        );
        assetsRegistry = AssetsRegistry(address(assetsProxy));
        
        // Grant roles in RolesRegistry
        rolesRegistry.addRole(rolesRegistry.UPDATER_ROLE(), updater);
    }
    
    // ========== Initialization Tests ==========
    
    function testInitialization() public virtual view {
        assertEq(assetsRegistry.owner(), owner);
        assertTrue(assetsRegistry.hasRole(assetsRegistry.DEFAULT_ADMIN_ROLE(), owner));
        assertTrue(rolesRegistry.isRole(rolesRegistry.UPDATER_ROLE(), updater));
    }
    
    // ========== Asset Management Tests ==========
    
    function testSetAsset() public {
        string memory name = "Executive Order";
        uint8 volatility = 75;
        uint8 clout = 60;
        uint8 faction = 1; // Politicos
        
        assetsRegistry.setAsset(ASSET_ID_1, name, volatility, clout, faction);
        
        (string memory retrievedName, uint8 retrievedVolatility, uint8 retrievedClout, uint8 retrievedFaction) = 
            assetsRegistry.getAsset(ASSET_ID_1);
        
        assertEq(retrievedName, name);
        assertEq(retrievedVolatility, volatility);
        assertEq(retrievedClout, clout);
        assertEq(retrievedFaction, faction);
        assertTrue(assetsRegistry.assetExists(ASSET_ID_1));
    }
    
    function testSetAssetUnauthorized() public {
        vm.startPrank(user1);
        
        vm.expectRevert();
        assetsRegistry.setAsset(ASSET_ID_1, "Test", 50, 50, 1);
        
        vm.stopPrank();
    }
    
    function testSetAssetOverwrite() public {
        // Set initial asset
        assetsRegistry.setAsset(ASSET_ID_1, "Original Name", 50, 50, 1);
        
        // Overwrite asset
        assetsRegistry.setAsset(ASSET_ID_1, "New Name", 75, 80, 2);
        
        (string memory name, uint8 volatility, uint8 clout, uint8 faction) = 
            assetsRegistry.getAsset(ASSET_ID_1);
        
        assertEq(name, "New Name");
        assertEq(volatility, 75);
        assertEq(clout, 80);
        assertEq(faction, 2);
    }
    
    function testSetAssetBoundaryValues() public {
        // Test minimum values
        assetsRegistry.setAsset(ASSET_ID_1, "Min Values", 0, 0, 1);
        (, uint8 volatility, uint8 clout,) = assetsRegistry.getAsset(ASSET_ID_1);
        assertEq(volatility, 0);
        assertEq(clout, 0);
        
        // Test maximum values
        assetsRegistry.setAsset(ASSET_ID_2, "Max Values", 100, 100, 3);
        (, volatility, clout,) = assetsRegistry.getAsset(ASSET_ID_2);
        assertEq(volatility, 100);
        assertEq(clout, 100);
        
        // Test faction boundaries
        assetsRegistry.setAsset(ASSET_ID_3, "Faction 1", 50, 50, 1);
        (,,, uint8 faction) = assetsRegistry.getAsset(ASSET_ID_3);
        assertEq(faction, 1);
        
        assetsRegistry.setAsset(ASSET_ID_3, "Faction 3", 50, 50, 3);
        (,,, faction) = assetsRegistry.getAsset(ASSET_ID_3);
        assertEq(faction, 3);
    }
    
    // ========== Asset Update Tests ==========
    
    function testUpdateAsset() public {
        // First set the asset
        assetsRegistry.setAsset(ASSET_ID_1, "Original Name", 50, 50, 1);
        
        // Then update it with updater role
        vm.startPrank(updater);
        
        uint8 newVolatility = 80;
        uint8 newClout = 90;
        uint8 newFaction = 2;
        
        assetsRegistry.updateAsset(ASSET_ID_1, newVolatility, newClout, newFaction);
        
        (string memory name, uint8 volatility, uint8 clout, uint8 faction) = 
            assetsRegistry.getAsset(ASSET_ID_1);
        
        assertEq(name, "Original Name"); // Name should not change
        assertEq(volatility, newVolatility);
        assertEq(clout, newClout);
        assertEq(faction, newFaction);
        
        vm.stopPrank();
    }
    
    function testUpdateAssetUnauthorized() public {
        assetsRegistry.setAsset(ASSET_ID_1, "Test", 50, 50, 1);
        
        vm.startPrank(user1);
        
        vm.expectRevert("Not authorized");
        assetsRegistry.updateAsset(ASSET_ID_1, 75, 75, 2);
        
        vm.stopPrank();
    }
    
    function testUpdateAssetNonExistent() public {
        vm.startPrank(updater);
        
        vm.expectRevert("Asset not found");
        assetsRegistry.updateAsset(ASSET_ID_1, 75, 75, 2);
        
        vm.stopPrank();
    }
    
    function testUpdateAssetBoundaryValues() public {
        assetsRegistry.setAsset(ASSET_ID_1, "Test", 50, 50, 1);
        
        vm.startPrank(owner);
        
        // Update to minimum values
        assetsRegistry.updateAsset(ASSET_ID_1, 0, 0, 1);
        (, uint8 volatility, uint8 clout,) = assetsRegistry.getAsset(ASSET_ID_1);
        assertEq(volatility, 0);
        assertEq(clout, 0);
        
        // Update to maximum values
        assetsRegistry.updateAsset(ASSET_ID_1, 100, 100, 3);
        (, volatility, clout,) = assetsRegistry.getAsset(ASSET_ID_1);
        assertEq(volatility, 100);
        assertEq(clout, 100);
        
        vm.stopPrank();
    }
    
    // ========== Asset Query Tests ==========
    
    function testGetAsset() public {
        string memory name = "The Pump";
        uint8 volatility = 85;
        uint8 clout = 70;
        uint8 faction = 2; // Disruptors
        
        assetsRegistry.setAsset(ASSET_ID_1, name, volatility, clout, faction);
        
        (string memory retrievedName, uint8 retrievedVolatility, uint8 retrievedClout, uint8 retrievedFaction) = 
            assetsRegistry.getAsset(ASSET_ID_1);
        
        assertEq(retrievedName, name);
        assertEq(retrievedVolatility, volatility);
        assertEq(retrievedClout, clout);
        assertEq(retrievedFaction, faction);
    }
    
    function testGetAssetNonExistent() public {
        vm.expectRevert("Asset not found");
        assetsRegistry.getAsset(ASSET_ID_1);
    }
    
    function testAssetExists() public {
        assertFalse(assetsRegistry.assetExists(ASSET_ID_1));
        
        assetsRegistry.setAsset(ASSET_ID_1, "Test", 50, 50, 1);
        
        assertTrue(assetsRegistry.assetExists(ASSET_ID_1));
    }
    
    function testGetAssetFaction() public {
        uint8 faction = 3; // Pop Icons
        assetsRegistry.setAsset(ASSET_ID_1, "Test", 50, 50, faction);
        
        uint8 retrievedFaction = assetsRegistry.getAssetFaction(ASSET_ID_1);
        assertEq(retrievedFaction, faction);
    }
    
    function testGetAssetFactionNonExistent() public {
        vm.expectRevert("Asset not found");
        assetsRegistry.getAssetFaction(ASSET_ID_1);
    }
    
    // ========== Multiple Assets Tests ==========
    
    function testMultipleAssets() public {
        // Create multiple assets
        assetsRegistry.setAsset(ASSET_ID_1, "Executive Order", 75, 60, 1);
        assetsRegistry.setAsset(ASSET_ID_2, "The Pump", 85, 70, 2);
        assetsRegistry.setAsset(ASSET_ID_3, "Short Squeeze", 95, 80, 3);
        
        // Verify all assets exist
        assertTrue(assetsRegistry.assetExists(ASSET_ID_1));
        assertTrue(assetsRegistry.assetExists(ASSET_ID_2));
        assertTrue(assetsRegistry.assetExists(ASSET_ID_3));
        
        // Verify individual assets
        (string memory name1, uint8 vol1, uint8 clout1, uint8 faction1) = assetsRegistry.getAsset(ASSET_ID_1);
        assertEq(name1, "Executive Order");
        assertEq(vol1, 75);
        assertEq(clout1, 60);
        assertEq(faction1, 1);
        
        (string memory name2, uint8 vol2, uint8 clout2, uint8 faction2) = assetsRegistry.getAsset(ASSET_ID_2);
        assertEq(name2, "The Pump");
        assertEq(vol2, 85);
        assertEq(clout2, 70);
        assertEq(faction2, 2);
        
        (string memory name3, uint8 vol3, uint8 clout3, uint8 faction3) = assetsRegistry.getAsset(ASSET_ID_3);
        assertEq(name3, "Short Squeeze");
        assertEq(vol3, 95);
        assertEq(clout3, 80);
        assertEq(faction3, 3);
    }
    
    function testUpdateMultipleAssets() public {
        // Create assets
        assetsRegistry.setAsset(ASSET_ID_1, "Asset 1", 50, 50, 1);
        assetsRegistry.setAsset(ASSET_ID_2, "Asset 2", 60, 60, 2);
        assetsRegistry.setAsset(ASSET_ID_3, "Asset 3", 70, 70, 3);
        
        // Update all assets with updater role
        vm.startPrank(updater);
        
        assetsRegistry.updateAsset(ASSET_ID_1, 80, 80, 2);
        assetsRegistry.updateAsset(ASSET_ID_2, 90, 90, 3);
        assetsRegistry.updateAsset(ASSET_ID_3, 100, 100, 1);
        
        (, uint8 vol1, uint8 clout1, uint8 faction1) = assetsRegistry.getAsset(ASSET_ID_1);
        assertEq(vol1, 80);
        assertEq(clout1, 80);
        assertEq(faction1, 2);
        
        (, uint8 vol2, uint8 clout2, uint8 faction2) = assetsRegistry.getAsset(ASSET_ID_2);
        assertEq(vol2, 90);
        assertEq(clout2, 90);
        assertEq(faction2, 3);
        
        (, uint8 vol3, uint8 clout3, uint8 faction3) = assetsRegistry.getAsset(ASSET_ID_3);
        assertEq(vol3, 100);
        assertEq(clout3, 100);
        assertEq(faction3, 1);
        
        vm.stopPrank();
    }
    
    // ========== Faction Tests ==========
    
    function testFactionCategories() public {
        // Test all three factions
        assetsRegistry.setAsset(1001, "Politicos Card", 50, 50, 1); // Politicos
        assetsRegistry.setAsset(1002, "Disruptors Card", 60, 60, 2); // Disruptors
        assetsRegistry.setAsset(1003, "Pop Icons Card", 70, 70, 3); // Pop Icons
        
        assertEq(assetsRegistry.getAssetFaction(1001), 1);
        assertEq(assetsRegistry.getAssetFaction(1002), 2);
        assertEq(assetsRegistry.getAssetFaction(1003), 3);
    }
    
    function testFactionUpdate() public {
        assetsRegistry.setAsset(ASSET_ID_1, "Test", 50, 50, 1);
        
        vm.startPrank(updater);
        
        // Change faction from Politicos to Disruptors
        assetsRegistry.updateAsset(ASSET_ID_1, 60, 60, 2);
        assertEq(assetsRegistry.getAssetFaction(ASSET_ID_1), 2);
        
        // Change faction from Disruptors to Pop Icons
        assetsRegistry.updateAsset(ASSET_ID_1, 70, 70, 3);
        assertEq(assetsRegistry.getAssetFaction(ASSET_ID_1), 3);
        
        vm.stopPrank();
    }
    
    // ========== Edge Case Tests ==========
    
    function testEmptyName() public {
        assetsRegistry.setAsset(ASSET_ID_1, "", 50, 50, 1);
        
        (string memory name,,,) = assetsRegistry.getAsset(ASSET_ID_1);
        assertEq(name, "");
    }
    
    function testLongName() public {
        string memory longName = "This is a very long asset name that tests the limits of string storage in the contract";
        
        assetsRegistry.setAsset(ASSET_ID_1, longName, 50, 50, 1);
        
        (string memory name,,,) = assetsRegistry.getAsset(ASSET_ID_1);
        assertEq(name, longName);
    }
    
    function testZeroAssetId() public {
        assetsRegistry.setAsset(0, "Zero ID", 50, 50, 1);
        
        assertTrue(assetsRegistry.assetExists(0));
        (string memory name,,,) = assetsRegistry.getAsset(0);
        assertEq(name, "Zero ID");
    }
    
    function testMaxAssetId() public {
        uint256 maxId = type(uint256).max;
        
        assetsRegistry.setAsset(maxId, "Max ID", 50, 50, 1);
        
        assertTrue(assetsRegistry.assetExists(maxId));
        (string memory name,,,) = assetsRegistry.getAsset(maxId);
        assertEq(name, "Max ID");
    }
    
    function testSameAssetIdMultipleSet() public {
        // Set asset multiple times with different values
        assetsRegistry.setAsset(ASSET_ID_1, "Version 1", 10, 20, 1);
        assetsRegistry.setAsset(ASSET_ID_1, "Version 2", 30, 40, 2);
        assetsRegistry.setAsset(ASSET_ID_1, "Version 3", 50, 60, 3);
        
        (string memory name, uint8 volatility, uint8 clout, uint8 faction) = 
            assetsRegistry.getAsset(ASSET_ID_1);
        
        assertEq(name, "Version 3");
        assertEq(volatility, 50);
        assertEq(clout, 60);
        assertEq(faction, 3);
    }
    
    function testSameAssetIdMultipleUpdate() public {
        assetsRegistry.setAsset(ASSET_ID_1, "Original", 50, 50, 1);
        
        vm.startPrank(updater);
        
        // Update asset multiple times
        assetsRegistry.updateAsset(ASSET_ID_1, 60, 60, 2);
        assetsRegistry.updateAsset(ASSET_ID_1, 70, 70, 3);
        assetsRegistry.updateAsset(ASSET_ID_1, 80, 80, 1);
        
        (string memory name, uint8 volatility, uint8 clout, uint8 faction) = 
            assetsRegistry.getAsset(ASSET_ID_1);
        
        assertEq(name, "Original"); // Name should remain unchanged
        assertEq(volatility, 80);
        assertEq(clout, 80);
        assertEq(faction, 1);
        
        vm.stopPrank();
    }
    
    // ========== Event Tests ==========
    
    function testAssetSetEvent() public {
        string memory name = "Test Asset";
        uint8 volatility = 75;
        uint8 clout = 60;
        uint8 faction = 2;
        
        vm.expectEmit(true, false, false, false);
        emit AssetsRegistry.AssetSet(ASSET_ID_1, name, volatility, clout, faction);
        assetsRegistry.setAsset(ASSET_ID_1, name, volatility, clout, faction);
    }
    
    function testAssetUpdateEvent() public {
        assetsRegistry.setAsset(ASSET_ID_1, "Original", 50, 50, 1);
        
        vm.startPrank(updater);
        
        uint8 newVolatility = 80;
        uint8 newClout = 70;
        uint8 newFaction = 2;
        
        vm.expectEmit(true, false, false, false);
        emit AssetsRegistry.AssetSet(ASSET_ID_1, "Original", newVolatility, newClout, newFaction);
        assetsRegistry.updateAsset(ASSET_ID_1, newVolatility, newClout, newFaction);
        
        vm.stopPrank();
    }
    
    // ========== Gas Optimization Tests ==========
    
    function testGasConsumption() public {
        uint256 gasStart = gasleft();
        assetsRegistry.setAsset(ASSET_ID_1, "Test", 50, 50, 1);
        uint256 gasUsed = gasStart - gasleft();
        
        console.log("Gas used for setAsset:", gasUsed);
        
        gasStart = gasleft();
        assetsRegistry.getAsset(ASSET_ID_1);
        gasUsed = gasStart - gasleft();
        
        console.log("Gas used for getAsset:", gasUsed);
        
        vm.startPrank(updater);
        
        gasStart = gasleft();
        assetsRegistry.updateAsset(ASSET_ID_1, 75, 75, 2);
        gasUsed = gasStart - gasleft();
        
        console.log("Gas used for updateAsset:", gasUsed);
        
        vm.stopPrank();
    }
    
    function testBatchOperationsGas() public {
        uint256 numAssets = 100;
        uint256 gasStart = gasleft();
        
        for (uint256 i = 0; i < numAssets; i++) {
            assetsRegistry.setAsset(
                ASSET_ID_1 + i,
                string(abi.encodePacked("Asset ", i)),
                uint8(50 + (i % 51)), // 0-100
                uint8(50 + (i % 51)), // 0-100
                uint8(1 + (i % 3))    // 1-3
            );
        }
        
        uint256 gasUsed = gasStart - gasleft();
        console.log("Gas used for", numAssets, "setAsset calls:", gasUsed);
        console.log("Average gas per setAsset:", gasUsed / numAssets);
    }
    
    // ========== Integration Tests ==========
    
    function testIntegrationWithRolesRegistry() public {
        // Check that owner has DEFAULT_ADMIN_ROLE in AssetsRegistry
        assertTrue(assetsRegistry.hasRole(assetsRegistry.DEFAULT_ADMIN_ROLE(), owner));
        
        // New updater should be able to update assets
        assetsRegistry.setAsset(ASSET_ID_1, "Test", 50, 50, 1);
        
        vm.startPrank(updater);
        
        assetsRegistry.updateAsset(ASSET_ID_1, 75, 75, 2);
        
        (, uint8 volatility, uint8 clout, uint8 faction) = assetsRegistry.getAsset(ASSET_ID_1);
        assertEq(volatility, 75);
        assertEq(clout, 75);
        assertEq(faction, 2);
        
        vm.stopPrank();
        
        // New updater should no longer be able to update assets
        vm.startPrank(user1);
        
        vm.expectRevert("Not authorized");
        assetsRegistry.updateAsset(ASSET_ID_1, 80, 80, 3);
        
        vm.stopPrank();
    }
    
    // ========== Multi-Role Tests ==========
    
    function testGrantMultipleRoles() public {
        address multiRoleUser = address(0x888);
        
        // Define multiple roles
        bytes32[] memory roles = new bytes32[](3);
        roles[0] = rolesRegistry.UPDATER_ROLE();
        roles[1] = keccak256("MANAGER_ROLE");
        roles[2] = keccak256("OPERATOR_ROLE");
        
        // Grant multiple roles to single user
        rolesRegistry.grantMultipleRoles(multiRoleUser, roles);
        
        // Verify all roles are granted
        assertTrue(rolesRegistry.isRole(rolesRegistry.UPDATER_ROLE(), multiRoleUser));
        assertTrue(rolesRegistry.isRole(keccak256("MANAGER_ROLE"), multiRoleUser));
        assertTrue(rolesRegistry.isRole(keccak256("OPERATOR_ROLE"), multiRoleUser));
    }
    
    function testRevokeMultipleRoles() public {
        address multiRoleUser = address(0x888);
        
        // First grant multiple roles
        bytes32[] memory roles = new bytes32[](2);
        roles[0] = rolesRegistry.UPDATER_ROLE();
        roles[1] = keccak256("MANAGER_ROLE");
        
        rolesRegistry.grantMultipleRoles(multiRoleUser, roles);
        
        // Verify roles are granted
        assertTrue(rolesRegistry.isRole(rolesRegistry.UPDATER_ROLE(), multiRoleUser));
        assertTrue(rolesRegistry.isRole(keccak256("MANAGER_ROLE"), multiRoleUser));
        
        // Revoke multiple roles
        rolesRegistry.revokeMultipleRoles(multiRoleUser, roles);
        
        // Verify roles are revoked
        assertFalse(rolesRegistry.isRole(rolesRegistry.UPDATER_ROLE(), multiRoleUser));
        assertFalse(rolesRegistry.isRole(keccak256("MANAGER_ROLE"), multiRoleUser));
    }
    
    function testMultiRoleUserCanPerformMultipleFunctions() public {
        address multiRoleUser = address(0x888);
        
        // Grant both UPDATER_ROLE and a custom role
        bytes32[] memory roles = new bytes32[](2);
        roles[0] = rolesRegistry.UPDATER_ROLE();
        roles[1] = keccak256("MANAGER_ROLE");
        
        rolesRegistry.grantMultipleRoles(multiRoleUser, roles);
        
        // Set up an asset
        assetsRegistry.setAsset(ASSET_ID_1, "Test Asset", 50, 50, 1);
        
        // Multi-role user should be able to update assets (has UPDATER_ROLE)
        vm.startPrank(multiRoleUser);
        assetsRegistry.updateAsset(ASSET_ID_1, 75, 75, 2);
        
        (, uint8 volatility, uint8 clout, uint8 faction) = assetsRegistry.getAsset(ASSET_ID_1);
        assertEq(volatility, 75);
        assertEq(clout, 75);
        assertEq(faction, 2);
        
        vm.stopPrank();
    }
    
    function testGrantMultipleRolesWithDuplicates() public {
        address multiRoleUser = address(0x888);
        
        // Create array with duplicate roles
        bytes32[] memory roles = new bytes32[](3);
        roles[0] = rolesRegistry.UPDATER_ROLE();
        roles[1] = keccak256("MANAGER_ROLE");
        roles[2] = rolesRegistry.UPDATER_ROLE(); // Duplicate
        
        // Should not fail even with duplicates
        rolesRegistry.grantMultipleRoles(multiRoleUser, roles);
        
        // Verify role is granted (only once)
        assertTrue(rolesRegistry.isRole(rolesRegistry.UPDATER_ROLE(), multiRoleUser));
        assertTrue(rolesRegistry.isRole(keccak256("MANAGER_ROLE"), multiRoleUser));
    }
    
    function testOwnerHasMultipleRolesByDefault() public view {
        // Owner should have both DEFAULT_ADMIN_ROLE and UPDATER_ROLE by default
        assertTrue(rolesRegistry.isRole(rolesRegistry.DEFAULT_ADMIN_ROLE(), owner));
        assertTrue(rolesRegistry.isRole(rolesRegistry.UPDATER_ROLE(), owner));
        
        // Check getAccountRoles function
        (bool hasAdminRole, bool hasUpdaterRole) = rolesRegistry.getAccountRoles(owner);
        assertTrue(hasAdminRole);
        assertTrue(hasUpdaterRole);
    }
}
