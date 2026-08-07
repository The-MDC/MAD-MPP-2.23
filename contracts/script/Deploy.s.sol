// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {MADStaking} from "../src/MADStaking.sol";
import {MADMarketFactory} from "../src/MADMarketFactory.sol";

/**
 * @title Deploy
 * @notice Deploys MADStaking + MADMarketFactory against the real $MADx token.
 *
 * Env vars:
 *   PRIVATE_KEY       — deployer key (broadcast)
 *   MADX_ADDRESS      — the $MADx ERC-20. Defaults to the verified fair-launch
 *                       token on Arbitrum One (MADDEX/MADx, 18 dec).
 *   TREASURY_ADDRESS  — receives the non-creator protocol fee share.
 *                       Defaults to the deployer.
 *
 * Usage:
 *   forge script script/Deploy.s.sol:Deploy \
 *     --rpc-url $ARBITRUM_ONE_RPC_URL --broadcast --verify
 */
contract Deploy is Script {
    /// @dev Verified fair-launch $MADx on Arbitrum One (see docs/MECHANISM_ORACLE_MADX_RESEARCH.md).
    address internal constant DEFAULT_MADX = 0x6972370e1caAA3624F37D7e87C28e1089D00151f;

    function run() external returns (MADStaking staking, MADMarketFactory marketFactory) {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        address madx = vm.envOr("MADX_ADDRESS", DEFAULT_MADX);
        address treasury = vm.envOr("TREASURY_ADDRESS", deployer);

        vm.startBroadcast(pk);
        staking = new MADStaking(madx);
        marketFactory = new MADMarketFactory(madx, treasury);
        vm.stopBroadcast();

        console2.log("MADx token:      ", madx);
        console2.log("Treasury:        ", treasury);
        console2.log("MADStaking:      ", address(staking));
        console2.log("MADMarketFactory:", address(marketFactory));
    }
}
