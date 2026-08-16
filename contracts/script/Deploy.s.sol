// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {ERC2771Forwarder} from "@openzeppelin/contracts/metatx/ERC2771Forwarder.sol";
import {MADStaking} from "../src/MADStaking.sol";
import {MADMarketFactory} from "../src/MADMarketFactory.sol";
import {MADShieldVault} from "../src/MADShieldVault.sol";
import {MADOptimisticOracle} from "../src/MADOptimisticOracle.sol";
import {MADDisputeVoting} from "../src/MADDisputeVoting.sol";

/**
 * @title Deploy
 * @notice Deploys the ERC-2771 trusted forwarder, then MADStaking +
 *         MADMarketFactory + MADShieldVault wired to trust it — gasless
 *         staking/market/backing/shield calls relayed through
 *         verify/app/api/v1/relay/execute resolve to the real signer, not the
 *         relayer's address (see ERC2771Context in each contract). Direct
 *         (non-relayed) calls are unaffected.
 *
 *         Also deploys MADOptimisticOracle (not previously in this script at
 *         all) and MADDisputeVoting (Phase A dispute decentralization),
 *         registering the voting contract as the oracle's second resolver
 *         alongside the owner. MADOptimisticOracle itself is intentionally
 *         NOT forwarder-aware — that's a separate, later decision from
 *         decentralizing who resolves its disputes.
 *
 * Env vars:
 *   PRIVATE_KEY          — deployer key (broadcast)
 *   MADX_ADDRESS         — the $MADx ERC-20. Defaults to the verified
 *                          fair-launch token on Arbitrum One (MADDEX/MADx, 18 dec).
 *   TREASURY_ADDRESS     — receives the non-creator protocol fee share and the
 *                          oracle's dispute fee. Defaults to the deployer.
 *   FORWARDER_ADDRESS    — reuse an already-deployed forwarder instead of
 *                          deploying a new one. Deploys fresh if unset.
 *   VOTE_THRESHOLD_BOND  — minimum oracle dispute bond (18 dec) that opens a
 *                          vote instead of going straight to owner-resolve.
 *                          Defaults to 5,000 MADx — adjustable later via
 *                          MADDisputeVoting.setVoteThresholdBond, this is a
 *                          starting point, not a fixed constant.
 *
 * Usage:
 *   forge script script/Deploy.s.sol:Deploy \
 *     --rpc-url $ARBITRUM_ONE_RPC_URL --broadcast --verify
 */
contract Deploy is Script {
    /// @dev Verified fair-launch $MADx on Arbitrum One (see docs/MAD_GAMBIT_MASTER.md).
    address internal constant DEFAULT_MADX = 0x6972370e1caAA3624F37D7e87C28e1089D00151f;
    uint256 internal constant DEFAULT_VOTE_THRESHOLD_BOND = 5_000 ether;

    function run()
        external
        returns (
            ERC2771Forwarder forwarder,
            MADStaking staking,
            MADMarketFactory marketFactory,
            MADShieldVault shieldVault,
            MADOptimisticOracle oracle,
            MADDisputeVoting disputeVoting
        )
    {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        address madx = vm.envOr("MADX_ADDRESS", DEFAULT_MADX);
        address treasury = vm.envOr("TREASURY_ADDRESS", deployer);
        address existingForwarder = vm.envOr("FORWARDER_ADDRESS", address(0));
        uint256 voteThresholdBond = vm.envOr("VOTE_THRESHOLD_BOND", DEFAULT_VOTE_THRESHOLD_BOND);

        vm.startBroadcast(pk);
        forwarder = existingForwarder != address(0)
            ? ERC2771Forwarder(existingForwarder)
            : new ERC2771Forwarder("MAD Gambit Forwarder");
        staking = new MADStaking(madx, address(forwarder));
        marketFactory = new MADMarketFactory(madx, treasury, address(forwarder));
        shieldVault = new MADShieldVault(madx, address(forwarder));
        oracle = new MADOptimisticOracle(madx, treasury);
        disputeVoting = new MADDisputeVoting(address(oracle), address(staking), voteThresholdBond, address(forwarder));
        oracle.setResolver(address(disputeVoting));
        vm.stopBroadcast();

        console2.log("MADx token:          ", madx);
        console2.log("Treasury:            ", treasury);
        console2.log("ERC2771Forwarder:    ", address(forwarder));
        console2.log("MADStaking:          ", address(staking));
        console2.log("MADMarketFactory:    ", address(marketFactory));
        console2.log("MADShieldVault:      ", address(shieldVault));
        console2.log("MADOptimisticOracle: ", address(oracle));
        console2.log("MADDisputeVoting:    ", address(disputeVoting));
    }
}
