// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ─────────────────────────────────────────────────────────────────────────────
// GATED — on-chain final slice of the Card Evolution system (Part V).
//
// This contract lives in contracts/evolution/ (NOT contracts/src/) on purpose:
// the app's Foundry project (contracts/foundry.toml, src="src") does not compile
// it, so it cannot red the Foundry CI while the Chainlink dependency is not yet
// vendored. To integrate:
//   1. `forge install smartcontractkit/chainlink-brownie-contracts` (CI runners
//      have network) and add the remapping
//      `@chainlink/contracts/=lib/chainlink-brownie-contracts/contracts/`.
//   2. Move this file into contracts/src/ (or add contracts/evolution to the
//      foundry `src`/`libs`), then `forge build` + a VRF mock test.
//   3. Deploy to Arbitrum/Base Sepolia, create + fund a VRF v2.5 subscription,
//      add this address as a consumer.
//
// The entire off-chain evolution system (scoring, levels, clown, abilities,
// persistence) already runs without this — cards stay VIRTUAL until L3+, and
// this contract only mints the final randomness at the max-level gate.
// ─────────────────────────────────────────────────────────────────────────────

import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

/**
 * @title EvolutionVRFConsumer
 * @notice Requests verifiable randomness only when a MADCard reaches max
 *         evolution level (L3+). Used for final ability rolls + satirical reveal
 *         seed at the moment of the max-level mint. Chainlink VRF v2.5,
 *         subscription method (shared funding across evolution/packs/battles).
 */
contract EvolutionVRFConsumer is VRFConsumerBaseV2Plus {
    uint256 public s_subscriptionId;
    bytes32 public s_keyHash;
    uint32 public callbackGasLimit = 200_000;
    uint16 public requestConfirmations = 3;
    uint32 public numWords = 4; // abilities + reveal seed + bonus + reserve

    mapping(uint256 => bytes32) public s_requestIdToCardId; // requestId → cardId
    mapping(bytes32 => bool) public s_cardFinalized;

    event EvolutionRequested(bytes32 indexed cardId, uint256 requestId, address requester);
    event EvolutionFinalized(bytes32 indexed cardId, uint256[] randomWords, string metadataURI);

    constructor(
        address vrfCoordinator,
        uint256 subscriptionId,
        bytes32 keyHash
    ) VRFConsumerBaseV2Plus(vrfCoordinator) {
        s_subscriptionId = subscriptionId;
        s_keyHash = keyHash;
    }

    /**
     * @notice Called by the backend / trusted relayer when a card hits max level.
     * @dev owner-gated; a card can never be finalized twice.
     */
    function requestEvolutionFinalization(bytes32 cardId) external onlyOwner returns (uint256 requestId) {
        require(!s_cardFinalized[cardId], "Already finalized");

        requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: s_keyHash,
                subId: s_subscriptionId,
                requestConfirmations: requestConfirmations,
                callbackGasLimit: callbackGasLimit,
                numWords: numWords,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
                )
            })
        );

        s_requestIdToCardId[requestId] = cardId;
        emit EvolutionRequested(cardId, requestId, msg.sender);
    }

    /**
     * @dev CRITICAL: must never revert. Store the randomness + emit for the
     *      backend to map → abilities/seed, build IPFS metadata, and call
     *      MADCard1155.mint. Matching is strictly by requestId.
     */
    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal override {
        bytes32 cardId = s_requestIdToCardId[requestId];
        if (cardId == bytes32(0)) {
            return; // unknown request — do not revert
        }
        s_cardFinalized[cardId] = true;
        emit EvolutionFinalized(cardId, randomWords, "");
    }

    // ── admin tuning ─────────────────────────────────────────────────────────
    function setConfig(uint32 _callbackGasLimit, uint16 _requestConfirmations, uint32 _numWords) external onlyOwner {
        callbackGasLimit = _callbackGasLimit;
        requestConfirmations = _requestConfirmations;
        numWords = _numWords;
    }

    function setKeyHash(bytes32 _keyHash) external onlyOwner {
        s_keyHash = _keyHash;
    }

    function setSubscriptionId(uint256 _subscriptionId) external onlyOwner {
        s_subscriptionId = _subscriptionId;
    }
}
