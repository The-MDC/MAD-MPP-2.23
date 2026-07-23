// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {RiskOracle} from "../src/insurance/RiskOracle.sol";
import {OnChainPrediction} from "../src/prediction/game.sol";
import {RolesRegistry} from "../src/registries/roles.sol";
import {MADDEXToken} from "../src/tokens/MADDEXToken.sol";
import {MadhatCard} from "../src/tokens/MadhatCardOptimized.sol";
import {Errors} from "../src/errors/Errors.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract RiskOracleTest is Test {
    RiskOracle public riskOracle;
    OnChainPrediction public predictionMarket;
    RolesRegistry public rolesRegistry;
    MADDEXToken public token;
    MadhatCard public madhatCard;

    address public owner = address(0x11);
    address public oracle = address(0x22);
    address public user = address(0x33);
    address public treasury = address(0x44);

    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 1e18;

    function setUp() public {
        vm.startPrank(owner);

        // 1. RolesRegistry
        RolesRegistry rolesImp = new RolesRegistry();
        rolesRegistry = RolesRegistry(address(new ERC1967Proxy(
            address(rolesImp),
            abi.encodeWithSelector(RolesRegistry.initialize.selector, owner)
        )));

        // 2. Token
        MADDEXToken tokenImp = new MADDEXToken();
        token = MADDEXToken(address(new ERC1967Proxy(
            address(tokenImp),
            abi.encodeWithSelector(
                MADDEXToken.initialize.selector,
                "MADDEX", "MDX", owner, INITIAL_SUPPLY, owner, owner, address(rolesRegistry)
            )
        )));

        // 3. MadhatCard (Simplified mock-like setup)
        MadhatCard cardImp = new MadhatCard();
        madhatCard = MadhatCard(address(new ERC1967Proxy(
            address(cardImp),
            abi.encodeWithSelector(
                MadhatCard.init.selector,
                "https://api.madhat.com/", address(token), treasury, address(rolesRegistry), address(0x123)
            )
        )));

        // 4. Prediction Market
        OnChainPrediction marketImp = new OnChainPrediction();
        predictionMarket = OnChainPrediction(address(new ERC1967Proxy(
            address(marketImp),
            abi.encodeWithSelector(
                OnChainPrediction.initialize.selector,
                address(token), treasury, address(rolesRegistry), address(madhatCard), address(0), 300
            )
        )));

        // 5. Risk Oracle
        riskOracle = new RiskOracle(address(predictionMarket), address(rolesRegistry));
        
        // Link them back
        predictionMarket.setRiskOracle(address(riskOracle));

        // Setup Roles
        bytes32 oracleRole = riskOracle.ORACLE_ROLE();
        if (!rolesRegistry.hasRole(oracleRole, oracle)) {
            rolesRegistry.addRole(oracleRole, oracle);
        }
        
        bytes32 predOracleRole = predictionMarket.ORACLE_ROLE();
        if (!rolesRegistry.hasRole(predOracleRole, oracle)) {
            rolesRegistry.addRole(predOracleRole, oracle);
        }

        // Exempt from fees for exact accounting
        token.setSingleFeeExemption(owner, true);
        token.setSingleFeeExemption(user, true);
        token.setSingleFeeExemption(oracle, true);
        token.setSingleFeeExemption(address(predictionMarket), true);
        token.setSingleFeeExemption(address(0x99), true); // otherUser

        vm.stopPrank();
    }

    function test_UpdateGarchParams() public {
        uint256 eventId = 1;
        uint64 alpha = 40; // 0.40%
        uint64 beta = 50;  // 0.50%
        
        vm.prank(oracle);
        riskOracle.updateGarchParams(eventId, alpha, beta);
        
        (uint64 rOmega, uint64 rAlpha, uint64 rBeta, uint64 rVar, uint64 rShock) = riskOracle.eventBetRisks(eventId);
        assertEq(rAlpha, alpha, "Alpha mismatch");
        assertEq(rBeta, beta, "Beta mismatch");
        assertEq(rOmega, 0, "Omega should be 0");
        assertEq(rVar, 0, "Variance should be 0");
        assertEq(rShock, 0, "Shock should be 0");
    }

    function test_UpdateGarchParams_Unauthorized() public {
        vm.expectRevert(abi.encodeWithSelector(Errors.Unauthorized.selector));
        riskOracle.updateGarchParams(1, 10, 10);
    }

    function test_UpdateGarchParams_InvalidConstraint() public {
        vm.prank(oracle);
        vm.expectRevert("Invalid GARCH constraint");
        riskOracle.updateGarchParams(1, 60, 50); // sum > 100
    }

    function test_GetWinProbability() public {
        // Create an event and place bets
        vm.startPrank(owner);
        predictionMarket.crtEvt("Will it rain?", block.timestamp + 1000, block.timestamp + 5000);
        vm.stopPrank();

        uint256 eventId = 1;
        vm.warp(block.timestamp + 1001);
        predictionMarket.actEvt(eventId);

        // Fund user
        vm.prank(owner);
        assertTrue(token.transfer(user, 1000 * 1e18));

        // Place bets: YES = 700, NO = 300
        vm.startPrank(user);
        token.approve(address(predictionMarket), 1000 * 1e18);
        predictionMarket.bet(eventId, OnChainPrediction.BetChoice.Yes, 700 * 1e18, false, 0);
        vm.stopPrank();

        address otherUser = address(0x99);
        vm.prank(owner);
        assertTrue(token.transfer(otherUser, 300 * 1e18));
        vm.startPrank(otherUser);
        token.approve(address(predictionMarket), 300 * 1e18);
        predictionMarket.bet(eventId, OnChainPrediction.BetChoice.No, 300 * 1e18, false, 0);
        vm.stopPrank();

        // YES prob: 700/1000 = 0.7
        // NO prob: 300/1000 = 0.3
        
        uint256 yesProbBp = riskOracle.getWinProbabilityBp(eventId, 0); // YES
        uint256 noProbBp = riskOracle.getWinProbabilityBp(eventId, 1);  // NO
        
        assertEq(yesProbBp, 7000);
        assertEq(noProbBp, 3000);
    }

    function test_GetInsurancePremium() public {
        // Setup market logic same as above
        vm.prank(owner);
        predictionMarket.crtEvt("Q", block.timestamp + 1000, block.timestamp + 5000);
        vm.warp(block.timestamp + 1001);
        predictionMarket.actEvt(1);

        vm.prank(owner);
        assertTrue(token.transfer(user, 1000 * 1e18));
        vm.startPrank(user);
        token.approve(address(predictionMarket), 1000 * 1e18);
        predictionMarket.bet(1, OnChainPrediction.BetChoice.Yes, 500 * 1e18, false, 0);
        vm.stopPrank();

        vm.prank(owner);
        assertTrue(token.transfer(address(0x99), 500 * 1e18));
        vm.startPrank(address(0x99));
        token.approve(address(predictionMarket), 500 * 1e18);
        predictionMarket.bet(1, OnChainPrediction.BetChoice.No, 500 * 1e18, false, 0);
        vm.stopPrank();

        // 50/50 probability
        
        // Update GARCH params
        vm.prank(oracle);
        riskOracle.updateGarchParams(1, 10, 10);

        uint256 stake = 100 * 1e18;
        uint8 nftVolatility = 50;
        
        uint256 premium = riskOracle.getInsurancePremium(stake, 1, nftVolatility);
        
        assertTrue(premium > 0, "Premium should be greater than zero");
        console.log("Calculated Premium:", premium);
    }

    function test_UpdatePredictionMarket() public {
        address newMarket = address(0x555);
        vm.prank(oracle);
        riskOracle.updatePredictionMarket(newMarket);
        assertEq(address(riskOracle.predictionMarket()), newMarket);
    }
}
