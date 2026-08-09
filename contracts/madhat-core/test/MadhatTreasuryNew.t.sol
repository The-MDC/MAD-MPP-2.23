// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {MadhatTreasury} from "../src/treasury/MadhatTreasury.sol";
import {MADDEXToken} from "../src/tokens/MADDEXToken.sol";
import {RolesRegistry} from "../src/registries/roles.sol";
import {Errors} from "../src/errors/Errors.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract MadhatTreasuryNewTest is Test {
    MadhatTreasury public treasury;
    MADDEXToken public madexToken;
    RolesRegistry public rolesRegistry;
    
    address public owner = address(0x10);
    address public spender = address(0x20);
    address public depositor = address(0x30);
    address public distributor = address(0x40);
    address public pauser = address(0x50);
    address public stakingPool = address(0x60);
    address public governance = address(0x70);
    address public user1 = address(0x80);
    
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 1e18;
    uint256 public constant DEPOSIT_AMOUNT = 10_000 * 1e18;

    function setUp() public {
        vm.startPrank(owner);
        
        // 1. Deploy RolesRegistry
        RolesRegistry rolesImp = new RolesRegistry();
        rolesRegistry = RolesRegistry(address(new ERC1967Proxy(
            address(rolesImp),
            abi.encodeWithSelector(RolesRegistry.initialize.selector, owner)
        )));
        
        // 2. Deploy MADDEXToken
        MADDEXToken tokenImp = new MADDEXToken();
        madexToken = MADDEXToken(address(new ERC1967Proxy(
            address(tokenImp),
            abi.encodeWithSelector(
                MADDEXToken.initialize.selector,
                "MADDEX Token",
                "MADDEX",
                owner,
                INITIAL_SUPPLY,
                owner,
                owner,
                address(rolesRegistry)
            )
        )));
        
        // 3. Deploy MadhatTreasury
        MadhatTreasury treasuryImp = new MadhatTreasury();
        treasury = MadhatTreasury(address(new ERC1967Proxy(
            address(treasuryImp),
            abi.encodeWithSelector(
                MadhatTreasury.initialize.selector,
                address(madexToken),
                stakingPool,
                governance,
                address(rolesRegistry)
            )
        )));
        
        // 4. Setup Roles
        rolesRegistry.addRole(treasury.SPENDER_ROLE(), spender);
        rolesRegistry.addRole(treasury.DEPOSITOR_ROLE(), depositor);
        rolesRegistry.addRole(treasury.DISTRIBUTION_ROLE(), distributor);
        rolesRegistry.addRole(treasury.PAUSER_ROLE(), pauser);
        
        // 5. Exempt contracts from fees to ensure exact accounting in tests
        madexToken.setSingleFeeExemption(address(treasury), true);
        madexToken.setSingleFeeExemption(owner, true);
        madexToken.setSingleFeeExemption(depositor, true);
        madexToken.setSingleFeeExemption(spender, true);
        madexToken.setSingleFeeExemption(stakingPool, true);
        madexToken.setSingleFeeExemption(governance, true);
        
        // 6. Fund depositor
        bool success = madexToken.transfer(depositor, DEPOSIT_AMOUNT * 2);
        assertTrue(success, "Transfer to depositor failed");
        
        // 7. Warp time to ensure distributions can run (default staking rewards is 7 days)
        vm.warp(7 days + 1);
        
        vm.stopPrank();
    }

    function test_InitialState() public view {
        assertEq(treasury.madexToken(), address(madexToken));
        assertEq(treasury.stakingPool(), stakingPool);
        assertEq(treasury.governance(), governance);
        assertEq(address(treasury.roles()), address(rolesRegistry));
        
        (,, uint256 balance,,,,) = treasury.getAsset(address(madexToken));
        assertEq(balance, 0);
    }

    function test_DepositAndWithdrawFlow() public {
        vm.startPrank(depositor);
        madexToken.approve(address(treasury), DEPOSIT_AMOUNT);
        treasury.deposit(address(madexToken), DEPOSIT_AMOUNT, "Initial Funding");
        vm.stopPrank();

        (,, uint256 balance, uint256 totalDep,,,) = treasury.getAsset(address(madexToken));
        assertEq(balance, DEPOSIT_AMOUNT);
        assertEq(totalDep, DEPOSIT_AMOUNT);
        assertEq(treasury.totalValueLocked(), DEPOSIT_AMOUNT);

        // Withdraw half
        uint256 withdrawAmt = DEPOSIT_AMOUNT / 2;
        vm.prank(spender);
        treasury.withdraw(address(madexToken), user1, withdrawAmt, "Project Expense");

        assertEq(madexToken.balanceOf(user1), withdrawAmt);
        assertEq(treasury.totalValueLocked(), DEPOSIT_AMOUNT - withdrawAmt);
    }

    function test_DistributionExecution() public {
        // Setup: Deposit 10k tokens
        vm.startPrank(depositor);
        madexToken.approve(address(treasury), DEPOSIT_AMOUNT);
        treasury.deposit(address(madexToken), DEPOSIT_AMOUNT, "Distribution Test Fund");
        vm.stopPrank();

        // Default Staking Rewards is 40% (4000 bps)
        uint256 expectedRewards = (DEPOSIT_AMOUNT * 4000) / 10000;
        
        uint256 initialStakingBalance = madexToken.balanceOf(stakingPool);
        
        // Time travel to bypass MIN_DISTRIBUTION_PERIOD if necessary
        // Default rules are added during initialize with lastDistribution = 0
        
        vm.prank(distributor);
        treasury.executeDistribution(MadhatTreasury.DistributionCategory.StakingRewards);
        
        assertEq(madexToken.balanceOf(stakingPool), initialStakingBalance + expectedRewards);
        assertEq(treasury.distributionCounter(), 1);
    }

    function test_CannotDistributeTooOften() public {
        vm.startPrank(depositor);
        madexToken.approve(address(treasury), DEPOSIT_AMOUNT);
        treasury.deposit(address(madexToken), DEPOSIT_AMOUNT, "Frequency Test");
        vm.stopPrank();

        vm.prank(distributor);
        treasury.executeDistribution(MadhatTreasury.DistributionCategory.StakingRewards);
        
        // Second time immediately should not distribute anything (rules lastDistribution updated)
        uint256 balanceBefore = madexToken.balanceOf(stakingPool);
        vm.prank(distributor);
        treasury.executeDistribution(MadhatTreasury.DistributionCategory.StakingRewards);
        assertEq(madexToken.balanceOf(stakingPool), balanceBefore, "Should not distribute again so soon");
    }

    function test_EmergencyWithdrawByOwner() public {
        vm.startPrank(depositor);
        madexToken.approve(address(treasury), DEPOSIT_AMOUNT);
        treasury.deposit(address(madexToken), DEPOSIT_AMOUNT, "Emergency Fund");
        vm.stopPrank();

        (,, uint256 balanceBefore,,,,) = treasury.getAsset(address(madexToken));
        uint256 ownerBalanceBefore = madexToken.balanceOf(owner);
        
        vm.prank(owner);
        treasury.emergencyWithdraw(address(madexToken), balanceBefore);
        
        assertEq(madexToken.balanceOf(owner), ownerBalanceBefore + balanceBefore);
        assertEq(treasury.totalValueLocked(), 0);
    }

    function test_PausingRestrictsDeposits() public {
        vm.prank(pauser);
        treasury.pause();
        
        vm.startPrank(depositor);
        madexToken.approve(address(treasury), DEPOSIT_AMOUNT);
        
        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        treasury.deposit(address(madexToken), DEPOSIT_AMOUNT, "Paused Deposit");
        vm.stopPrank();
    }

    function test_AddAndModifyDistributionRule() public {
        address newRecipient = address(0xDEAD);
        uint256 percentage = 500; // 5%
        uint256 period = 7 days;

        vm.startPrank(owner);
        treasury.addDistributionRule(
            MadhatTreasury.DistributionCategory.Marketing,
            newRecipient,
            percentage,
            period
        );

        MadhatTreasury.DistributionRule[] memory rules = treasury.getDistributionRules(MadhatTreasury.DistributionCategory.Marketing);
        // Rule 0 is default governance rule (20%), Rule 1 is our new rule
        assertEq(rules.length, 2);
        assertEq(rules[1].recipient, newRecipient);
        assertEq(rules[1].percentage, percentage);

        // Update rule
        treasury.updateDistributionRule(MadhatTreasury.DistributionCategory.Marketing, 1, 1000);
        rules = treasury.getDistributionRules(MadhatTreasury.DistributionCategory.Marketing);
        assertEq(rules[1].percentage, 1000);
        vm.stopPrank();
    }

    function test_UnauthorizedAccess() public {
        vm.startPrank(user1);
        
        vm.expectRevert(); // OwnableUnauthorizedAccount
        treasury.registerAsset(address(0x123), "FAIL");
        
        vm.expectRevert(abi.encodeWithSelector(Errors.Unauthorized.selector));
        treasury.deposit(address(madexToken), 100, "Fail");
        
        vm.stopPrank();
    }
}
