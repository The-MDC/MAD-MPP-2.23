// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {OnChainPrediction} from "../src/prediction/game.sol";
import {RolesRegistry} from "../src/registries/roles.sol";
import {Errors} from "../src/errors/Errors.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

// Simple Mock ERC20
contract MockERC20 is IERC20 {
    mapping(address => uint256) public override balanceOf;
    mapping(address => mapping(address => uint256)) public override allowance;
    uint256 public override totalSupply;

    function mint(address to, uint256 amount) public {
        balanceOf[to] += amount;
        totalSupply += amount;
    }

    function transfer(address to, uint256 amount) public override returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function approve(address spender, uint256 amount) public override returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function name() external pure returns (string memory) { return "Mock"; }
    function symbol() external pure returns (string memory) { return "MCK"; }
    function decimals() external pure returns (uint8) { return 18; }
}

// Simple Mock MadhatCard
contract MockMadhatCard {
    function getCardForUser(address /*user*/, uint256 /*tokenId*/) external pure returns (
        uint8 vol, uint8 clout, uint8 factionId, bytes32 ability, uint8 rarity, bool active
    ) {
        return (50, 10, 1, bytes32(0), 1, true);
    }
}

// Simple Mock RiskOracle
contract MockRiskOracle {
    function getInsurancePremium(uint256 stake, uint256 /*eventId*/, uint8 /*volatility*/) external pure returns (uint256) {
        return stake / 10; // 10% premium
    }
}

contract OnChainPredictionTest is Test {
    OnChainPrediction public game;
    RolesRegistry public roles;
    MockERC20 public token;
    MockMadhatCard public madhatCard;
    MockRiskOracle public riskOracle;

    address public owner = address(0x1);
    address public treasury = address(0x2);
    address public oracle = address(0x3);
    address public user1 = address(0x4);
    address public user2 = address(0x5);
    address public user3 = address(0x6);
    address public user4 = address(0x7);

    uint256 public constant BUFFER_TIME = 5 minutes;

    function setUp() public {
        vm.startPrank(owner);

        // Deploy RolesRegistry
        RolesRegistry rolesImpl = new RolesRegistry();
        bytes memory rolesInitData = abi.encodeWithSelector(RolesRegistry.initialize.selector, owner);
        roles = RolesRegistry(address(new ERC1967Proxy(address(rolesImpl), rolesInitData)));

        // Deploy Token
        token = new MockERC20();

        // Deploy Mocks
        madhatCard = new MockMadhatCard();
        riskOracle = new MockRiskOracle();

        // Deploy OnChainPrediction
        OnChainPrediction gameImpl = new OnChainPrediction();
        bytes memory gameInitData = abi.encodeWithSelector(
            OnChainPrediction.initialize.selector,
            address(token),
            treasury,
            address(roles),
            address(madhatCard),
            address(riskOracle),
            BUFFER_TIME
        );
        game = OnChainPrediction(address(new ERC1967Proxy(address(gameImpl), gameInitData)));

        // Setup Roles
        roles.addRole(game.ORACLE_ROLE(), oracle);
        roles.addRole(game.PAUSER_ROLE(), owner);

        vm.stopPrank();

        // Mint tokens to users
        token.mint(user1, 1000e18);
        token.mint(user2, 1000e18);
        token.mint(user3, 1000e18);
        token.mint(user4, 1000e18);

        vm.prank(user1);
        token.approve(address(game), type(uint256).max);

        vm.prank(user2);
        token.approve(address(game), type(uint256).max);

        vm.prank(user3);
        token.approve(address(game), type(uint256).max);

        vm.prank(user4);
        token.approve(address(game), type(uint256).max);
    }

    function test_Initialize() public view {
        assertEq(address(game.token()), address(token));
        assertEq(game.treasury(), treasury);
        assertEq(address(game.roles()), address(roles));
        assertEq(game.bufferTime(), BUFFER_TIME);
        assertEq(game.eventCount(), 0);
    }

    function test_CreateEvent() public {
        vm.startPrank(owner);
        uint256 startTime = block.timestamp + BUFFER_TIME + 1;
        uint256 endTime = startTime + 2 hours;
        game.crtEvt("Will BTC hit 100k?", startTime, endTime);
        
        assertEq(game.eventCount(), 1);
        (uint256 id, string memory q, uint256 sT, uint256 eT,,,, OnChainPrediction.EventStatus status,) = game.getEvent(1);
        assertEq(id, 1);
        assertEq(q, "Will BTC hit 100k?");
        assertEq(sT, startTime);
        assertEq(eT, endTime);
        assertEq(uint(status), uint(OnChainPrediction.EventStatus.Pending));
        vm.stopPrank();
    }

    function test_CreateEvent_Revert_BufferTime() public {
        vm.startPrank(owner);
        uint256 startTime = block.timestamp + BUFFER_TIME - 1;
        uint256 endTime = startTime + 2 hours;
        vm.expectRevert(Errors.LockPeriodNotMet.selector);
        game.crtEvt("Too soon", startTime, endTime);
        vm.stopPrank();
    }

    function test_Bet_PendingToActive() public {
        vm.startPrank(owner);
        uint256 startTime = block.timestamp + BUFFER_TIME + 10;
        uint256 endTime = startTime + 2 hours;
        game.crtEvt("Test Event", startTime, endTime);
        vm.stopPrank();

        // Move time to startTime
        vm.warp(startTime);

        vm.startPrank(user1);
        game.bet(1, OnChainPrediction.BetChoice.Yes, 100e18, false, 0);
        vm.stopPrank();

        (,,,,,,, OnChainPrediction.EventStatus status,) = game.getEvent(1);
        assertEq(uint(status), uint(OnChainPrediction.EventStatus.Active));
    }

    function test_Bet_YesAndNo() public {
        vm.startPrank(owner);
        uint256 startTime = block.timestamp + BUFFER_TIME + 10;
        uint256 endTime = startTime + 2 hours;
        game.crtEvt("Test Event", startTime, endTime);
        vm.stopPrank();

        vm.warp(startTime);

        vm.prank(user1);
        game.bet(1, OnChainPrediction.BetChoice.Yes, 100e18, false, 0);

        vm.prank(user2);
        game.bet(1, OnChainPrediction.BetChoice.No, 200e18, false, 0);

        (,,,, uint256 yesPool, uint256 noPool, uint256 totalBettors,,) = game.getEvent(1);
        assertEq(yesPool, 100e18);
        assertEq(noPool, 200e18);
        assertEq(totalBettors, 2);
    }

    function test_Bet_WithInsurance() public {
        vm.startPrank(owner);
        uint256 startTime = block.timestamp + BUFFER_TIME + 10;
        uint256 endTime = startTime + 2 hours;
        game.crtEvt("Test Event", startTime, endTime);
        vm.stopPrank();

        vm.warp(startTime);

        uint256 betAmt = 100e18;
        uint256 premium = betAmt / 10; // MockRiskOracle returns stake/10

        uint256 balanceBefore = token.balanceOf(user1);
        vm.prank(user1);
        game.bet(1, OnChainPrediction.BetChoice.Yes, betAmt, true, 0);

        assertEq(token.balanceOf(user1), balanceBefore - (betAmt + premium));
        
        (uint256 amount, OnChainPrediction.BetChoice choice, bool claimed) = game.getBet(1, user1);
        assertEq(amount, betAmt);
        assertEq(uint(choice), uint(OnChainPrediction.BetChoice.Yes));
        assertFalse(claimed);
    }

    function test_ResolveEvent() public {
        vm.startPrank(owner);
        uint256 startTime = block.timestamp + BUFFER_TIME + 10;
        uint256 endTime = startTime + 2 hours;
        game.crtEvt("Test Event", startTime, endTime);
        vm.stopPrank();

        vm.warp(startTime);
        vm.prank(user1);
        game.bet(1, OnChainPrediction.BetChoice.Yes, 100e18, false, 0);
        vm.prank(user2);
        game.bet(1, OnChainPrediction.BetChoice.No, 100e18, false, 0);

        vm.warp(endTime + 1);
        
        vm.prank(oracle);
        game.resEvt(1, OnChainPrediction.BetChoice.Yes);

        (,,,,,,, OnChainPrediction.EventStatus status, OnChainPrediction.BetChoice result) = game.getEvent(1);
        assertEq(uint(status), uint(OnChainPrediction.EventStatus.Resolved));
        assertEq(uint(result), uint(OnChainPrediction.BetChoice.Yes));
    }

    function test_Claim_Winner() public {
        vm.startPrank(owner);
        uint256 startTime = block.timestamp + BUFFER_TIME + 10;
        uint256 endTime = startTime + 2 hours;
        game.crtEvt("Test Event", startTime, endTime);
        vm.stopPrank();

        vm.warp(startTime);
        vm.prank(user1);
        game.bet(1, OnChainPrediction.BetChoice.Yes, 100e18, false, 0);
        vm.prank(user2);
        game.bet(1, OnChainPrediction.BetChoice.No, 100e18, false, 0);

        vm.warp(endTime + 1);
        vm.prank(oracle);
        game.resEvt(1, OnChainPrediction.BetChoice.Yes);

        // Calculate expected payout
        // totalPool = 200e18
        // winPool = 100e18
        // fee = 0.25% of gross payout
        // gross payout = 100 * 200 / 100 = 200
        // fee = 200 * 25 / 10000 = 0.5
        // net payout = 200 - 0.5 = 199.5
        
        uint256 balanceBefore = token.balanceOf(user1);
        vm.prank(user1);
        game.claim(1);
        
        assertEq(token.balanceOf(user1), balanceBefore + 199.5e18);
        assertEq(token.balanceOf(treasury), 0.5e18);
    }

    function test_Claim_Loser_WithInsurance() public {
        vm.startPrank(owner);
        uint256 startTime = block.timestamp + BUFFER_TIME + 10;
        uint256 endTime = startTime + 2 hours;
        game.crtEvt("Test Event", startTime, endTime);
        vm.stopPrank();

        vm.warp(startTime);
        vm.prank(user1);
        game.bet(1, OnChainPrediction.BetChoice.Yes, 100e18, true, 0); // User1 insured
        vm.prank(user2);
        game.bet(1, OnChainPrediction.BetChoice.No, 100e18, false, 0);

        vm.warp(endTime + 1);
        vm.prank(oracle);
        game.resEvt(1, OnChainPrediction.BetChoice.No); // User1 lost

        uint256 balanceBefore = token.balanceOf(user1);
        vm.prank(user1);
        game.claim(1);
        
        // Payout should be the insured amount (100e18)
        assertEq(token.balanceOf(user1), balanceBefore + 100e18);
    }

    function test_CancelEvent_Refund() public {
        vm.startPrank(owner);
        uint256 startTime = block.timestamp + BUFFER_TIME + 10;
        uint256 endTime = startTime + 2 hours;
        game.crtEvt("Test Event", startTime, endTime);
        vm.stopPrank();

        vm.warp(startTime);
        vm.prank(user1);
        game.bet(1, OnChainPrediction.BetChoice.Yes, 100e18, false, 0);

        vm.prank(owner);
        game.cancelEvt(1);

        uint256 balanceBefore = token.balanceOf(user1);
        vm.prank(user1);
        game.claim(1);
        
        assertEq(token.balanceOf(user1), balanceBefore + 100e18);
    }

    function test_Pause_Bet_Revert() public {
        vm.startPrank(owner);
        uint256 startTime = block.timestamp + BUFFER_TIME + 10;
        uint256 endTime = startTime + 2 hours;
        game.crtEvt("Test Event", startTime, endTime);
        game.pause();
        vm.stopPrank();

        vm.warp(startTime);
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        game.bet(1, OnChainPrediction.BetChoice.Yes, 100e18, false, 0);
    }

    function test_MultipleUsers_BetAndClaim() public {
        vm.startPrank(owner);
        uint256 startTime = block.timestamp + BUFFER_TIME + 10;
        uint256 endTime = startTime + 2 hours;
        game.crtEvt("Four User Event", startTime, endTime);
        vm.stopPrank();

        vm.warp(startTime);

        // Yes: user1 (100), user2 (200) = 300
        vm.prank(user1);
        game.bet(1, OnChainPrediction.BetChoice.Yes, 100e18, false, 0);
        vm.prank(user2);
        game.bet(1, OnChainPrediction.BetChoice.Yes, 200e18, false, 0);

        // No: user3 (100), user4 (400) = 500
        vm.prank(user3);
        game.bet(1, OnChainPrediction.BetChoice.No, 100e18, false, 0);
        vm.prank(user4);
        game.bet(1, OnChainPrediction.BetChoice.No, 400e18, false, 0);

        vm.warp(endTime + 1);
        vm.prank(oracle);
        game.resEvt(1, OnChainPrediction.BetChoice.No); // NO wins

        // Total Pool = 800
        // No Pool = 500
        // Fee = 0.25% of gross
        // User3 Payout: Gross = 100 * 800 / 500 = 160. Fee = 160 * 0.25% = 0.4. Net = 159.6
        // User4 Payout: Gross = 400 * 800 / 500 = 640. Fee = 640 * 0.25% = 1.6. Net = 638.4

        uint256 b3 = token.balanceOf(user3);
        vm.prank(user3);
        game.claim(1);
        assertEq(token.balanceOf(user3), b3 + 159.6e18);

        uint256 b4 = token.balanceOf(user4);
        vm.prank(user4);
        game.claim(1);
        assertEq(token.balanceOf(user4), b4 + 638.4e18);
        
        // Total Fees Collected = 0.4 + 1.6 = 2.0
        assertEq(token.balanceOf(treasury), 2.0e18);
    }
}
