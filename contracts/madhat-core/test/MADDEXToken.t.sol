// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {AssetsRegistryTest} from "./AssetsRegistry.t.sol";
import {MADDEXToken} from "../src/tokens/MADDEXToken.sol";
import {RolesRegistry} from "../src/registries/roles.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {Errors} from "../src/errors/Errors.sol";

contract MADDEXTokenTest is AssetsRegistryTest {
    MADDEXToken public token;
    
    address public minter = address(0x5);
    address public burner = address(0x6);
    address public taxWallet = address(0x7);
    address public treasuryWallet = address(0x8);
    
    uint256 public constant INITIAL_SUPPLY = 1000000 * 10**18;
    uint256 public constant MINT_AMOUNT = 1000 * 10**18;
    uint256 public constant BURN_AMOUNT = 500 * 10**18;
    uint256 public constant TRANSFER_AMOUNT = 100 * 10**18;
    
    function setUp() public virtual override {
        // Call parent setUp to deploy RolesRegistry and AssetsRegistry
        super.setUp();
        
        vm.startPrank(owner);
        
        // Deploy MADDEXToken implementation
        MADDEXToken tokenImpl = new MADDEXToken();
        
        // Deploy MADDEXToken proxy
        bytes memory tokenInitData = abi.encodeWithSelector(
            MADDEXToken.initialize.selector,
            "MADDEX Token",
            "MADDEX",
            owner,
            INITIAL_SUPPLY,
            taxWallet,
            treasuryWallet,
            address(rolesRegistry)
        );
        ERC1967Proxy tokenProxy = new ERC1967Proxy(
            address(tokenImpl),
            tokenInitData
        );
        token = MADDEXToken(address(tokenProxy));
        
        // Grant roles
        rolesRegistry.addRole(keccak256("MINTER_ROLE"), minter);
        rolesRegistry.addRole(keccak256("BURNER_ROLE"), burner);
        
        vm.stopPrank();
        
        // Transfer some tokens to users for testing
        vm.startPrank(owner);
        token.transfer(user1, 10000 * 10**18);
        token.transfer(user2, 5000 * 10**18);
        vm.stopPrank();
    }
    
    // ========== Initialization Tests ==========
    
    function testInitialization() public virtual override view {
        assertEq(token.name(), "MADDEX Token");
        assertEq(token.symbol(), "MADDEX");
        assertEq(token.owner(), owner);
        assertEq(token.totalSupply(), INITIAL_SUPPLY);
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY - 15000 * 10**18);
        assertEq(token.taxWallet(), taxWallet);
        assertEq(token.treasuryWallet(), treasuryWallet);
        assertEq(token.MAX_SUPPLY(), 100_000_000 * 10**18);
        assertEq(uint256(token.transferTaxRate()), uint256(25)); // 0.25% (25 basis points)
    }
    
    // ========== Minting Tests ==========
    
    function testMintByMinter() public {
        vm.startPrank(minter);
        
        uint256 balanceBefore = token.balanceOf(user1);
        uint256 supplyBefore = token.totalSupply();
        
        token.mint(user1, MINT_AMOUNT);
        
        assertEq(token.balanceOf(user1), balanceBefore + MINT_AMOUNT);
        assertEq(token.totalSupply(), supplyBefore + MINT_AMOUNT);
        
        vm.stopPrank();
    }
    
    function testMintByUnauthorized() public {
        vm.startPrank(user1);
        
        vm.expectRevert(abi.encodeWithSelector(Errors.Unauthorized.selector));
        token.mint(user2, MINT_AMOUNT);
        
        vm.stopPrank();
    }
    
    function testMintToZeroAddress() public {
        vm.startPrank(minter);
        
        vm.expectRevert(abi.encodeWithSelector(Errors.ZeroAddress.selector));
        token.mint(address(0), MINT_AMOUNT);
        
        vm.stopPrank();
    }
    
    function testMintZeroAmount() public {
        vm.startPrank(minter);
        
        vm.expectRevert(abi.encodeWithSelector(Errors.InvalidAmount.selector));
        token.mint(user1, 0);
        
        vm.stopPrank();
    }
    
    function testMintExceedsMaxSupply() public {
        vm.startPrank(minter);
        
        uint256 remainingSupply = token.remainingMintableSupply();
        
        vm.expectRevert(abi.encodeWithSelector(Errors.MaxSupplyExceeded.selector));
        token.mint(user1, remainingSupply + 1);
        
        vm.stopPrank();
    }
    
    // ========== Burning Tests ==========
    
    function testBurn() public {
        vm.startPrank(user1);
        
        uint256 balanceBefore = token.balanceOf(user1);
        uint256 supplyBefore = token.totalSupply();
        
        token.burn(BURN_AMOUNT);
        
        // User balance decreases by full amount
        assertEq(token.balanceOf(user1), balanceBefore - BURN_AMOUNT);
        
        // 20% goes to treasury, 80% burned
        uint256 treasuryShare = (BURN_AMOUNT * 2000) / 10000; // 20%
        uint256 burnedAmount = BURN_AMOUNT - treasuryShare;
        assertEq(token.totalSupply(), supplyBefore - burnedAmount);
        
        vm.stopPrank();
    }
    
    function testBurnExceedsBalance() public {
        vm.startPrank(user1);
        
        uint256 balance = token.balanceOf(user1);
        
        vm.expectRevert(abi.encodeWithSelector(Errors.InsufficientBalance.selector));
        token.burn(balance + 1);
        
        vm.stopPrank();
    }
    
    function testBurnZeroAmount() public {
        vm.startPrank(user1);
        
        vm.expectRevert(abi.encodeWithSelector(Errors.InvalidAmount.selector));
        token.burn(0);
        
        vm.stopPrank();
    }
    
    function testBurnFromByBurner() public {
        vm.startPrank(burner);
        
        uint256 user1BalanceBefore = token.balanceOf(user1);
        uint256 treasuryBalanceBefore = token.balanceOf(treasuryWallet);
        uint256 supplyBefore = token.totalSupply();
        
        token.burnFrom(user1, BURN_AMOUNT);
        
        // 20% goes to treasury, 80% burned
        uint256 treasuryShare = (BURN_AMOUNT * 2000) / 10000; // 20%
        uint256 burnedAmount = BURN_AMOUNT - treasuryShare;
        
        assertEq(token.balanceOf(user1), user1BalanceBefore - BURN_AMOUNT);
        assertEq(token.balanceOf(treasuryWallet), treasuryBalanceBefore + treasuryShare);
        assertEq(token.totalSupply(), supplyBefore - burnedAmount);
        
        vm.stopPrank();
    }
    
    function testBurnFromUnauthorized() public {
        vm.startPrank(user1);
        
        vm.expectRevert(abi.encodeWithSelector(Errors.Unauthorized.selector));
        token.burnFrom(user2, BURN_AMOUNT);
        
        vm.stopPrank();
    }
    
    // ========== Transfer Tests ==========
    
    function testTransferWithoutTax() public {
        vm.startPrank(user1);
        
        uint256 balanceBefore = token.balanceOf(user1);
        uint256 recipientBefore = token.balanceOf(taxWallet); // Transfer to tax wallet to avoid tax
        
        token.transfer(taxWallet, TRANSFER_AMOUNT);
        
        assertEq(token.balanceOf(user1), balanceBefore - TRANSFER_AMOUNT);
        assertEq(token.balanceOf(taxWallet), recipientBefore + TRANSFER_AMOUNT);
        
        vm.stopPrank();
    }
    
    function testTransferWithTax() public {
        vm.startPrank(user1);
        
        uint256 taxAmount = (TRANSFER_AMOUNT * token.transferTaxRate()) / 10000;
        uint256 amountAfterTax = TRANSFER_AMOUNT - taxAmount;
        
        uint256 user1Before = token.balanceOf(user1);
        uint256 user2Before = token.balanceOf(user2);
        uint256 taxWalletBefore = token.balanceOf(taxWallet);
        
        token.transfer(user2, TRANSFER_AMOUNT);
        
        assertEq(token.balanceOf(user1), user1Before - TRANSFER_AMOUNT);
        assertEq(token.balanceOf(user2), user2Before + amountAfterTax);
        assertEq(token.balanceOf(taxWallet), taxWalletBefore + taxAmount);
        
        vm.stopPrank();
    }
    
    function testTransferFromWithTax() public {
        vm.startPrank(user1);
        
        uint256 allowanceAmount = TRANSFER_AMOUNT * 2;
        token.approve(user2, allowanceAmount);
        vm.stopPrank();
        
        vm.startPrank(user2);
        
        uint256 taxAmount = (TRANSFER_AMOUNT * token.transferTaxRate()) / 10000;
        uint256 amountAfterTax = TRANSFER_AMOUNT - taxAmount;
        
        uint256 user1Before = token.balanceOf(user1);
        uint256 user2Before = token.balanceOf(user2);
        uint256 taxWalletBefore = token.balanceOf(taxWallet);
        
        token.transferFrom(user1, user2, TRANSFER_AMOUNT);
        
        assertEq(token.balanceOf(user1), user1Before - TRANSFER_AMOUNT);
        assertEq(token.balanceOf(user2), user2Before + amountAfterTax);
        assertEq(token.balanceOf(taxWallet), taxWalletBefore + taxAmount);
        assertEq(token.allowance(user1, user2), allowanceAmount - TRANSFER_AMOUNT);
        
        vm.stopPrank();
    }
    
    function testTransferToExemptAddress() public {
        vm.startPrank(owner);
        token.setSingleFeeExemption(taxWallet, true);
        vm.stopPrank();
        
        vm.startPrank(user1);
        
        uint256 user1Before = token.balanceOf(user1);
        uint256 taxWalletBefore = token.balanceOf(taxWallet);
        
        // No tax when transferring to exempt address
        token.transfer(taxWallet, TRANSFER_AMOUNT);
        
        assertEq(token.balanceOf(user1), user1Before - TRANSFER_AMOUNT);
        assertEq(token.balanceOf(taxWallet), taxWalletBefore + TRANSFER_AMOUNT);
        
        vm.stopPrank();
    }
    
    function testTransferFromExemptAddress() public {
        vm.startPrank(owner);
        token.setSingleFeeExemption(user1, true);
        vm.stopPrank();
        
        vm.startPrank(user1);
        
        uint256 user1Before = token.balanceOf(user1);
        uint256 user2Before = token.balanceOf(user2);
        
        // No tax when transferring from exempt address
        token.transfer(user2, TRANSFER_AMOUNT);
        
        assertEq(token.balanceOf(user1), user1Before - TRANSFER_AMOUNT);
        assertEq(token.balanceOf(user2), user2Before + TRANSFER_AMOUNT);
        
        vm.stopPrank();
    }
    
    // ========== Tax Management Tests ==========
    
    function testUpdateTransferTax() public {
        vm.startPrank(owner);
        
        uint256 newRate = 100; // 1%
        
        token.updateTransferTax(newRate);
        assertEq(token.transferTaxRate(), newRate);
        
        vm.stopPrank();
    }
    
    function testUpdateTransferTaxExceedsMax() public {
        vm.startPrank(owner);
        
        vm.expectRevert(abi.encodeWithSelector(Errors.InvalidAmount.selector));
        token.updateTransferTax(1001); // > 10%
        
        vm.stopPrank();
    }
    
    function testUpdateTransferTaxUnauthorized() public {
        vm.startPrank(user1);
        
        vm.expectRevert();
        token.updateTransferTax(100);
        
        vm.stopPrank();
    }
    
    function testUpdateTaxWallet() public {
        vm.startPrank(owner);
        
        address newWallet = address(0x999);
        token.updateTaxWallet(newWallet);
        assertEq(token.taxWallet(), newWallet);
        
        vm.stopPrank();
    }
    
    function testUpdateTaxWalletToZero() public {
        vm.startPrank(owner);
        
        vm.expectRevert(abi.encodeWithSelector(Errors.ZeroAddress.selector));
        token.updateTaxWallet(address(0));
        
        vm.stopPrank();
    }
    
    // ========== Fee Exemption Tests ==========
    
    function testSetSingleFeeExemption() public {
        vm.startPrank(owner);
        
        token.setSingleFeeExemption(user1, true);
        assertTrue(token.isExemptFromFees(user1));
        
        token.setSingleFeeExemption(user1, false);
        assertFalse(token.isExemptFromFees(user1));
        
        vm.stopPrank();
    }
    
    function testSetFeeExemptionBatch() public {
        vm.startPrank(owner);
        
        address[] memory accounts = new address[](2);
        accounts[0] = user1;
        accounts[1] = user2;
        
        bool[] memory exempt = new bool[](2);
        exempt[0] = true;
        exempt[1] = false;
        
        token.setFeeExemption(accounts, exempt);
        
        assertTrue(token.isExemptFromFees(user1));
        assertFalse(token.isExemptFromFees(user2));
        
        vm.stopPrank();
    }
    
    function testSetFeeExemptionArrayMismatch() public {
        vm.startPrank(owner);
        
        address[] memory accounts = new address[](2);
        bool[] memory exempt = new bool[](1);
        
        vm.expectRevert(abi.encodeWithSelector(Errors.ArrayLengthMismatch.selector));
        token.setFeeExemption(accounts, exempt);
        
        vm.stopPrank();
    }
    
    // ========== Role Management Tests ==========
    
    function testGrantRole() public {
        vm.startPrank(owner);
        
        bytes32 role = keccak256("TEST_ROLE");
        address account = address(0x999);
        
        rolesRegistry.addRole(role, account);
        assertTrue(rolesRegistry.hasRole(role, account));
        
        vm.stopPrank();
    }
    
    function testRevokeRole() public {
        vm.startPrank(owner);
        
        bytes32 role = keccak256("MINTER_ROLE");
        rolesRegistry.removeRole(role, minter);
        assertFalse(rolesRegistry.isRole(role, minter));
        
        vm.stopPrank();
    }
    
    // ========== Utility Function Tests ==========
    
    function testRemainingMintableSupply() public view {
        uint256 remaining = token.remainingMintableSupply();
        assertEq(remaining, token.MAX_SUPPLY() - token.totalSupply());
    }
    
    function testVotePower() public view {
        uint256 balance = token.balanceOf(user1);
        uint256 expectedVotePower = sqrt(balance);
        assertEq(token.votePower(user1), expectedVotePower);
    }
    
    function testEmergencyRecover() public {
        // Deploy a mock ERC20 for testing
        MockERC20 mockToken = new MockERC20();
        mockToken.mint(address(token), 1000);
        
        vm.startPrank(owner);
        
        uint256 ownerBalanceBefore = mockToken.balanceOf(owner);
        uint256 contractBalanceBefore = mockToken.balanceOf(address(token));
        
        token.emergencyRecover(address(mockToken), 500);
        
        assertEq(mockToken.balanceOf(owner), ownerBalanceBefore + 500);
        assertEq(mockToken.balanceOf(address(token)), contractBalanceBefore - 500);
        
        vm.stopPrank();
    }
    
    function testEmergencyRecoverOwnToken() public {
        vm.startPrank(owner);
        
        vm.expectRevert(abi.encodeWithSelector(Errors.InvalidAsset.selector));
        token.emergencyRecover(address(token), 100);
        
        vm.stopPrank();
    }
    
    // ========== View Function Tests ==========
    
    function testIsExemptFromFees() public {
        assertFalse(token.isExemptFromFees(user1));
        
        vm.startPrank(owner);
        token.setSingleFeeExemption(user1, true);
        vm.stopPrank();
        
        assertTrue(token.isExemptFromFees(user1));
    }
    
    // ========== Helper Functions ==========
    
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

// Mock ERC20 for emergency recovery testing
contract MockERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }
    
    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }
}
