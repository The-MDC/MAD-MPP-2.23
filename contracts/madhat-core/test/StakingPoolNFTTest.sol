// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {StakingPool} from "../src/staking/StakingPool.sol";
import {MadhatCard} from "../src/tokens/MadhatCardOptimized.sol";
import {MADDEXToken} from "../src/tokens/MADDEXToken.sol";
import {RolesRegistry} from "../src/registries/roles.sol";
import {AssetsRegistry} from "../src/registries/assets.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract StakingPoolNFTTest is Test {
    
    StakingPool public stakingPool;
    MadhatCard public madhatCard;
    MADDEXToken public madexToken;
    RolesRegistry public rolesRegistry;
    AssetsRegistry public assetsRegistry;
    
    address public owner = address(0x1);
    address public user1 = address(0x2);
    address public treasury = address(0x3);
    
    function setUp() public {
        vm.startPrank(owner);
        
        // Deploy RolesRegistry
        RolesRegistry rolesImpl = new RolesRegistry();
        ERC1967Proxy rolesProxy = new ERC1967Proxy(
            address(rolesImpl),
            abi.encodeWithSelector(RolesRegistry.initialize.selector, owner)
        );
        rolesRegistry = RolesRegistry(address(rolesProxy));
        
        // Deploy AssetsRegistry
        AssetsRegistry assetsImpl = new AssetsRegistry();
        ERC1967Proxy assetsProxy = new ERC1967Proxy(
            address(assetsImpl),
            abi.encodeWithSelector(AssetsRegistry.initialize.selector, address(rolesRegistry), owner)
        );
        assetsRegistry = AssetsRegistry(address(assetsProxy));
        
        // Deploy MADDEX Token
        MADDEXToken tokenImpl = new MADDEXToken();
        ERC1967Proxy tokenProxy = new ERC1967Proxy(
            address(tokenImpl),
            abi.encodeWithSelector(
                MADDEXToken.initialize.selector,
                "MADDEX Token",
                "MADDEX",
                owner,
                1_000_000 * 10**18,
                treasury,
                treasury,
                address(rolesRegistry)
            )
        );
        madexToken = MADDEXToken(address(tokenProxy));
        
        // Deploy MadhatCard
                MadhatCard cardImpl = new MadhatCard();
                ERC1967Proxy cardProxy = new ERC1967Proxy(
                    address(cardImpl),
                    abi.encodeWithSelector(
                        MadhatCard.init.selector,
                        "https://ipfs.io/ipfs/QmcN6crZZhL3nxQj1ounCqNegFi5CVNozp6YUKc27u5oXG/",
                        address(madexToken),
                        treasury,
                        address(rolesRegistry),
                        address(assetsRegistry)
                    )
                );
                madhatCard = MadhatCard(address(cardProxy));
        
                // Deploy StakingPool
                StakingPool poolImpl = new StakingPool();
                ERC1967Proxy poolProxy = new ERC1967Proxy(
                    address(poolImpl),
                    abi.encodeWithSelector(
                        StakingPool.initialize.selector,
                        address(madexToken),
                        address(madexToken),
                        treasury,
                        address(rolesRegistry),
                        address(madhatCard)
                    )
                );
                stakingPool = StakingPool(address(poolProxy));
        
        // Setup roles
        rolesRegistry.addRole(madexToken.MINTER_ROLE(), owner);
        rolesRegistry.addRole(madhatCard.ADMIN_R(), owner);

        // Initialize tiers
        stakingPool.createTier("Bronze", 30 days, 500, 10 * 10**18, 1000);

        // Create a pack for testing
        madhatCard.mkPack(10 * 10**18, 5, 100, 5);

        // Mint tokens to user1
        madexToken.mint(user1, 1000 * 10**18);

        // Give user1 some NFTs
        vm.startPrank(user1);
        madexToken.approve(address(madhatCard), 50 * 10**18);
        madhatCard.buyPack(1); // Use buyPack instead of purchasePack
        vm.stopPrank();

        vm.stopPrank();
    }
    
    function testNFTRequirementForStaking() public {
        vm.startPrank(user1);
        
                // Get user's NFTs
                uint256[] memory userNfTs = madhatCard.getUserCards(user1);
                assertTrue(userNfTs.length > 0, "User should have NFTs");
        
                // Test staking with NFT
                uint256 nftId = userNfTs[0];
        
        madexToken.approve(address(stakingPool), 100 * 10**18);
        
        uint256 stakeId = stakingPool.createStake(
            nftId,
            100 * 10**18,
            1, // Bronze tier
            false
        );
        
        assertTrue(stakeId > 0, "Stake should be created successfully");
        
        // Verify stake details
        (
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            uint256 returnedNftId,
            uint256 effectiveRate
        ) = stakingPool.getStake(stakeId);
        
        assertEq(returnedNftId, nftId, "NFT ID should match");
        assertTrue(effectiveRate > 0, "Effective rate should be calculated");
        
        vm.stopPrank();
    }
    
    function testCloutMultiplier() public {
        vm.startPrank(user1);
        
        // Get user's NFTs
        uint256[] memory userNfTs = madhatCard.getUserCards(user1);
        uint256 nftId = userNfTs[0];
        
        // Get base rate for tier 1 (Bronze: 5% = 500 basis points)
        (, uint256 baseRate,,) = stakingPool.getTierConfig(1);
        
        // Get effective rate with NFT
        uint256 effectiveRate = stakingPool.getEffectiveRewardRate(nftId, baseRate);
        
        // The effective rate should be >= base rate due to clout multiplier
        assertTrue(effectiveRate >= baseRate, "Effective rate should be >= base rate");
        
        console.log("Base rate:", baseRate);
        console.log("Effective rate:", effectiveRate);
        console.log("Multiplier:", (effectiveRate * 10000) / baseRate);
        
        vm.stopPrank();
    }
    
    function testStakingWithoutNFTFails() public {
        vm.startPrank(user1);
        
        madexToken.approve(address(stakingPool), 100 * 10**18);
        
        // Try to stake without owning the NFT
        vm.expectRevert();
        stakingPool.createStake(
            999999, // Non-existent NFT ID
            100 * 10**18,
            1,
            false
        );
        
        vm.stopPrank();
    }
}
