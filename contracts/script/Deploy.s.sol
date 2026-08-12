// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {ERC2771Forwarder} from "@openzeppelin/contracts/metatx/ERC2771Forwarder.sol";
import {MADStaking} from "../src/MADStaking.sol";
import {MADMarketFactory} from "../src/MADMarketFactory.sol";
import {MADShieldVault} from "../src/MADShieldVault.sol";

/**
 * @title Deploy
 * @notice Deploys the ERC-2771 trusted forwarder, then MADStaking +
 *         MADMarketFactory + MADShieldVault wired to trust it — gasless
 *         staking/market/backing/shield calls relayed through
 *         verify/app/api/v1/relay/execute resolve to the real signer, not the
 *         relayer's address (see ERC2771Context in each contract). Direct
 *         (non-relayed) calls are unaffected.
 *
 * Env vars:
 *   PRIVATE_KEY        — deployer key (broadcast)
 *   MADX_ADDRESS       — the $MADx ERC-20. Defaults to the verified fair-launch
 *                        token on Arbitrum One (MADDEX/MADx, 18 dec).
 *   TREASURY_ADDRESS   — receives the non-creator protocol fee share.
 *                        Defaults to the deployer.
 *   FORWARDER_ADDRESS  — reuse an already-deployed forwarder instead of
 *                        deploying a new one (e.g. redeploying just the
 *                        market factory later). Deploys fresh if unset.
 *
 * Usage:
 *   forge script script/Deploy.s.sol:Deploy \
 *     --rpc-url $ARBITRUM_ONE_RPC_URL --broadcast --verify
 */
contract Deploy is Script {
    /// @dev Verified fair-launch $MADx on Arbitrum One (see docs/MECHANISM_ORACLE_MADX_RESEARCH.md).
    address internal constant DEFAULT_MADX = 0x6972370e1caAA3624F37D7e87C28e1089D00151f;

    function run()
        external
        returns (
            ERC2771Forwarder forwarder,
            MADStaking staking,
            MADMarketFactory marketFactory,
            MADShieldVault shieldVault
        )
    {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        address madx = vm.envOr("MADX_ADDRESS", DEFAULT_MADX);
        address treasury = vm.envOr("TREASURY_ADDRESS", deployer);
        address existingForwarder = vm.envOr("FORWARDER_ADDRESS", address(0));

        vm.startBroadcast(pk);
        forwarder = existingForwarder != address(0)
            ? ERC2771Forwarder(existingForwarder)
            : new ERC2771Forwarder("MAD Gambit Forwarder");
        staking = new MADStaking(madx, address(forwarder));
        marketFactory = new MADMarketFactory(madx, treasury, address(forwarder));
        shieldVault = new MADShieldVault(madx, address(forwarder));
        vm.stopBroadcast();

        console2.log("MADx token:       ", madx);
        console2.log("Treasury:         ", treasury);
        console2.log("ERC2771Forwarder: ", address(forwarder));
        console2.log("MADStaking:       ", address(staking));
        console2.log("MADMarketFactory: ", address(marketFactory));
        console2.log("MADShieldVault:   ", address(shieldVault));
    }
}
