// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {MADPortrait} from "../src/MADPortrait.sol";
import {MADPortraitKeyRegistry} from "../src/MADPortraitKeyRegistry.sol";

/**
 * DeployPortrait — INTERLOCK layer 4 (FIVE FACES §6.2.4).
 * ─────────────────────────────────────────────────────────────────
 * "The Phase-4 deploy script refuses to deploy MADPortrait.sol unless
 * MADPortraitKeyRegistry is already deployed and answering on the target chain."
 *
 * The point of this layer is that it REMOVES ORDERING FROM THE RUNBOOK. Layer 1
 * makes a premature named mint revert; layer 4 makes the premature *deploy*
 * impossible in the first place, which matters because the runbook step is the
 * one most likely to be skipped under launch pressure — and "we'll set the
 * registry right after" is exactly how a portrait contract ends up live with an
 * unset gate.
 *
 * "ANSWERING" MEANS ANSWERING, not "an address exists". The probe below checks
 * that there is code at the address AND that a call returns a well-formed
 * answer. An address that merely exists is the failure mode this guard is for:
 * a typo'd address, a registry deployed to the wrong chain, or a contract that
 * self-destructed all present as "configured" to anything less thorough.
 *
 * Two modes:
 *   REGISTRY_ADDRESS set   → verify it, then deploy the portrait wired to it.
 *   REGISTRY_ADDRESS unset → deploy the registry FIRST, verify it, then the
 *                            portrait. Ordering is enforced by the script's
 *                            control flow rather than by a human reading it.
 *
 * Usage:
 *   forge script script/DeployPortrait.s.sol:DeployPortrait \
 *     --rpc-url $ARBITRUM_ONE_RPC_URL --broadcast --verify
 */
contract DeployPortrait is Script {
    error RegistryNotDeployed(address registry);
    error RegistryNotAnswering(address registry);

    /**
     * The probe. Deliberately reads through the SAME defensive path the mint
     * gate uses, so a registry that would fail at mint time fails here instead —
     * a pre-flight check that tests something other than the real gate is a
     * pre-flight check that passes the day the gate breaks.
     */
    function assertRegistryLive(address registry) public view {
        if (registry == address(0) || registry.code.length == 0) {
            revert RegistryNotDeployed(registry);
        }
        (bool ok, bytes memory data) = registry.staticcall(
            abi.encodeWithSelector(MADPortraitKeyRegistry.keyRefOf.selector, bytes32(uint256(1)))
        );
        if (!ok || data.length != 32) revert RegistryNotAnswering(registry);
    }

    function run() external returns (MADPortraitKeyRegistry registry, MADPortrait portrait) {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        address admin = vm.envOr("PORTRAIT_ADMIN", deployer);
        address existing = vm.envOr("REGISTRY_ADDRESS", address(0));
        string memory baseURI = vm.envOr("PORTRAIT_BASE_URI", string("https://madgambit.xyz/portrait/"));

        vm.startBroadcast(pk);

        if (existing == address(0)) {
            registry = new MADPortraitKeyRegistry(admin);
            console2.log("MADPortraitKeyRegistry deployed:", address(registry));
        } else {
            registry = MADPortraitKeyRegistry(existing);
            console2.log("MADPortraitKeyRegistry (existing):", existing);
        }

        // THE GATE. Everything below this line is unreachable if the registry is
        // not deployed and answering. This is the whole contribution of layer 4.
        assertRegistryLive(address(registry));

        portrait = new MADPortrait("MAD Gambit Portrait", "MADPT", baseURI, admin);
        portrait.setKeyRegistry(address(registry));

        vm.stopBroadcast();

        console2.log("MADPortrait deployed:", address(portrait));
        console2.log("Registry wired:      ", address(portrait.keyRegistry()));

        // Post-condition, checked rather than assumed: a portrait deployed with
        // the wiring step silently skipped would look identical in the logs.
        require(address(portrait.keyRegistry()) == address(registry), "registry wiring failed");
    }
}
