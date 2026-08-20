// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * MADPortraitKeyRegistry — FIVE FACES §6.2.2 workstream 3.
 * ─────────────────────────────────────────────────────────────────
 * The on-chain half of the portrait key registry: a subjectId ↔ keyRef binding
 * and a KeyDestroyed event.
 *
 * REFERENCES AND EVENTS ONLY. There is no function here that accepts key
 * material, ciphertext, a name, a persona label or a persona value, and there is
 * no bytes field wide enough to smuggle one. `keyRef` is a KMS handle; the data
 * key it names never touches a chain, and neither does the payload it unwraps.
 *
 * DESTRUCTION IS TERMINAL. Once `destroyKey` fires, `keyRefOf` returns zero
 * forever and the subject can never be re-registered. Two reasons, and the
 * second is the one that matters:
 *
 *   1. An upheld erasure request is not a pause. Allowing re-registration would
 *      make crypto-shredding reversible in practice even though the key is gone
 *      in fact, which is precisely the claim EDPB/ICO/CNIL recognition rests on.
 *   2. INTERLOCK layer 1 reads this registry to decide whether a named mint may
 *      proceed. If a destroyed subject could be re-registered, an erased person
 *      could be silently returned to the mintable set by one transaction.
 *
 * The event is the durable audit trail — as permanent as the tokens it refers
 * to, which is the one place permanence is an asset rather than a liability.
 */
contract MADPortraitKeyRegistry is AccessControl {
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");
    /// @dev Separate from the registrar, so the ability to erase is not bundled
    ///      with the ability to list. Same reasoning as PAUSE_GUARDIAN (§9.1).
    bytes32 public constant DESTROYER_ROLE = keccak256("DESTROYER_ROLE");

    enum Status {
        Unknown,
        Held,
        Destroyed
    }

    mapping(bytes32 subjectId => bytes32 keyRef) private _keyRefs;
    mapping(bytes32 subjectId => Status) public statusOf;
    mapping(bytes32 subjectId => uint64) public destroyedAt;

    uint256 public heldCount;
    uint256 public destroyedCount;

    event KeyRegistered(bytes32 indexed subjectId, bytes32 keyRef);
    event KeyDestroyed(bytes32 indexed subjectId, uint64 timestamp, string reason);

    error ZeroSubject();
    error ZeroKeyRef();
    error SubjectDestroyed(bytes32 subjectId);
    error SubjectNotHeld(bytes32 subjectId);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(REGISTRAR_ROLE, admin);
        _grantRole(DESTROYER_ROLE, admin);
    }

    /**
     * Bind a subject to a KMS key handle. Idempotent for a held subject — a TTL
     * renewal rotates the handle without disturbing the binding — but a
     * destroyed subject is refused outright.
     */
    function registerKey(bytes32 subjectId, bytes32 keyRef) external onlyRole(REGISTRAR_ROLE) {
        if (subjectId == bytes32(0)) revert ZeroSubject();
        if (keyRef == bytes32(0)) revert ZeroKeyRef();

        Status s = statusOf[subjectId];
        if (s == Status.Destroyed) revert SubjectDestroyed(subjectId);
        if (s == Status.Unknown) {
            statusOf[subjectId] = Status.Held;
            unchecked {
                heldCount += 1;
            }
        }
        _keyRefs[subjectId] = keyRef;
        emit KeyRegistered(subjectId, keyRef);
    }

    /**
     * Erasure. Clears the binding and emits the audit event.
     *
     * Note the ordering: the keyRef is zeroed BEFORE the event, so any
     * re-entrant read during the emit already sees the subject as erased. There
     * is no external call here to re-enter through, but the mint gate reads this
     * contract and the cost of ordering it correctly is nothing.
     */
    function destroyKey(bytes32 subjectId, string calldata reason) external onlyRole(DESTROYER_ROLE) {
        Status s = statusOf[subjectId];
        if (s == Status.Destroyed) revert SubjectDestroyed(subjectId);
        if (s != Status.Held) revert SubjectNotHeld(subjectId);

        delete _keyRefs[subjectId];
        statusOf[subjectId] = Status.Destroyed;
        uint64 ts = uint64(block.timestamp);
        destroyedAt[subjectId] = ts;
        unchecked {
            heldCount -= 1;
            destroyedCount += 1;
        }
        emit KeyDestroyed(subjectId, ts, reason);
    }

    /**
     * The gate INTERLOCK layer 1 reads. Zero means "may not mint" for every
     * reason it could mean: never registered, or registered and since erased.
     * A caller that only checks non-zero is already correct.
     */
    function keyRefOf(bytes32 subjectId) external view returns (bytes32) {
        return _keyRefs[subjectId];
    }

    /// @dev Convenience for off-chain readiness checks and the deploy probe.
    function isHeld(bytes32 subjectId) external view returns (bool) {
        return statusOf[subjectId] == Status.Held && _keyRefs[subjectId] != bytes32(0);
    }
}
