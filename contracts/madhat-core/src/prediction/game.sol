// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Errors} from "../errors/Errors.sol";
import {RolesRegistry} from "../registries/roles.sol";
import {MadhatCard} from "../tokens/MadhatCardOptimized.sol";
import {RiskOracle} from "../insurance/RiskOracle.sol";

/**
 * @title  OnChainPrediction
 * @notice Binary prediction market for ERC-20 tokens.
 *         Users bet YES or NO on owner-created events.
 *         Winners split the losing pool proportionally (minus platform fee).
 *         Event outcomes are resolved manually by an authorised oracle role.
 * @dev    UUPS-upgradeable. Reward maths use ABDKMath64x64 for precision.
 *         Inspired by the original flat OnChainPrediction contract — rebuilt
 *         with UUPS, role-based access, safe fee distribution, and cancel/refund.
 */
contract OnChainPrediction is
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    PausableUpgradeable
{
    RolesRegistry public roles;
    MadhatCard public madhatCard;
    RiskOracle public riskOracle;


    // ─────────────────────────────────────────────────────────────
    //  ROLES
    // ─────────────────────────────────────────────────────────────

    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE"); // Resolves events
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE"); // Pause/unpause
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE"); // Emergency cancel

    // ─────────────────────────────────────────────────────────────
    //  REENTRANCY GUARD (manual — avoids extra base contract slot)
    // ─────────────────────────────────────────────────────────────

    uint256 private _status;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    // ─────────────────────────────────────────────────────────────
    //  ENUMS
    // ─────────────────────────────────────────────────────────────

    enum BetChoice {
        None,
        Yes,
        No
    }
    enum EventStatus {
        Pending,
        Active,
        Resolved,
        Canceled
    }

    // ─────────────────────────────────────────────────────────────
    //  STRUCTS
    // ─────────────────────────────────────────────────────────────

    struct PredictionEvent {
        uint256 id;
        string question;
        uint256 startTime;
        uint256 endTime;
        uint256 yesPool; // Total tokens bet YES
        uint256 noPool; // Total tokens bet NO
        uint256 totalBettors; // Head-count for leaderboard
        EventStatus status;
        BetChoice result; // None until resolved
    }

    struct Bet {
        uint256 amount;
        BetChoice choice;
        bool claimed;
        bool hasInsurance;
        uint256 insurancePremium;
        uint256 insuredAmount;
    }

    /// @dev Per-user leaderboard stats (volume-based)
    struct UserStats {
        uint256 daily;
        uint256 weekly;
        uint256 monthly;
        uint256 allTime;
        uint256 lastUpdate;
    }

    // ─────────────────────────────────────────────────────────────
    //  STATE
    // ─────────────────────────────────────────────────────────────

    IERC20 public token;
    address public treasury;

    uint256 public eventCount;
    uint256 public bufferTime; // Minimum lead time before event can start

    mapping(uint256 => PredictionEvent) public events;
    mapping(uint256 => mapping(address => Bet)) public bets;
    mapping(address => UserStats) public leaderboard;

    // Global statistics
    uint256 public totalVolumeAllTime;
    uint256 public totalFeesCollected;

    // ─────────────────────────────────────────────────────────────
    //  CONSTANTS
    // ─────────────────────────────────────────────────────────────

    uint256 public constant PLATFORM_FEE = 188; // 1.88 % (canonical FEE_BPS; was 25=0.25% on pull)
    uint256 public constant FEE_DENOMINATOR = 10_000;
    uint256 public constant MIN_DURATION = 1 hours;
    uint256 public constant MAX_DURATION = 365 days;

    // ─────────────────────────────────────────────────────────────
    //  EVENTS
    // ─────────────────────────────────────────────────────────────

    event EventCreated(
        uint256 indexed eventId,
        string question,
        uint256 startTime,
        uint256 endTime
    );
    event EventActivated(uint256 indexed eventId);
    event EventResolved(
        uint256 indexed eventId,
        BetChoice result,
        uint256 yesPool,
        uint256 noPool
    );
    event EventCanceled(uint256 indexed eventId, address indexed canceledBy);
    event BetPlaced(
        uint256 indexed eventId,
        address indexed user,
        BetChoice choice,
        uint256 amount
    );
    event Claimed(
        uint256 indexed eventId,
        address indexed user,
        uint256 amount
    );
    event FeeCollected(uint256 indexed eventId, uint256 feeAmount);
    event TreasuryUpdated(
        address indexed oldTreasury,
        address indexed newTreasury
    );
    event RiskOracleUpdated(address indexed newRiskOracle);
    event BufferTimeUpdated(uint256 oldBuffer, uint256 newBuffer);

    // ─────────────────────────────────────────────────────────────
    //  MODIFIERS
    // ─────────────────────────────────────────────────────────────

    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() internal {
        if (_status == _ENTERED) revert Errors.Reentrant();
        _status = _ENTERED;
    }

    function _nonReentrantAfter() internal {
        _status = _NOT_ENTERED;
    }

    modifier validEvent(uint256 eventId) {
        _validEvent(eventId);
        _;
    }

    function _validEvent(uint256 eventId) internal view {
        if (eventId == 0 || eventId > eventCount)
            revert Errors.InvalidParameter();
    }

    // ─────────────────────────────────────────────────────────────
    //  CONSTRUCTOR (disable initializers for implementation)
    // ─────────────────────────────────────────────────────────────

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // ─────────────────────────────────────────────────────────────
    //  INITIALIZER
    // ─────────────────────────────────────────────────────────────

    /**
     * @param tokenAddr       ERC-20 token used for betting
     * @param treasuryAddr    Address that receives platform fees
     * @param rolesAddr       RolesRegistry address
     * @param madhatCardAddr  MadhatCard address
     * @param riskOracleAddr  RiskOracle address
     * @param bufferTimeInit  Minimum seconds before event startTime (e.g. 5 minutes)
     */
    function initialize(
        address tokenAddr,
        address treasuryAddr,
        address rolesAddr,
        address madhatCardAddr,
        address riskOracleAddr,
        uint256 bufferTimeInit
    ) public initializer {
        __Ownable_init(msg.sender);
        __Pausable_init();

        _status = _NOT_ENTERED;

        if (
            tokenAddr == address(0) ||
            treasuryAddr == address(0) ||
            rolesAddr == address(0) ||
            madhatCardAddr == address(0)
        ) {
            revert Errors.ZeroAddress();
        }

        // Initialize state variables
        token = IERC20(tokenAddr);
        treasury = treasuryAddr;
        roles = RolesRegistry(rolesAddr);
        madhatCard = MadhatCard(madhatCardAddr);
        if (riskOracleAddr != address(0)) {
            riskOracle = RiskOracle(riskOracleAddr);
        }
        bufferTime = bufferTimeInit;
        
        // Initialize counters and tracking variables
        eventCount = 0;
        totalVolumeAllTime = 0;
        totalFeesCollected = 0;
    }

    /**
     * @notice Set the RiskOracle contract address (owner only)
     * @param riskOracleAddress Address of the RiskOracle contract
     */
    function setRiskOracle(address riskOracleAddress) external onlyOwner {
        if (riskOracleAddress == address(0)) revert Errors.ZeroAddress();
        riskOracle = RiskOracle(riskOracleAddress);
        emit RiskOracleUpdated(riskOracleAddress);
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}

    // ─────────────────────────────────────────────────────────────
    //  EVENT MANAGEMENT  (owner)
    // ─────────────────────────────────────────────────────────────

    function crtEvt(
        string calldata q,
        uint256 sT,
        uint256 eT
    ) external onlyOwner {
        if (bytes(q).length == 0) revert Errors.InvalidParameter();
        if (sT <= block.timestamp + bufferTime)
            revert Errors.LockPeriodNotMet();
        if (eT < sT + MIN_DURATION) revert Errors.InvalidAmount();
        if (eT > sT + MAX_DURATION) revert Errors.ExcessiveStake();

        uint256 eid = ++eventCount;

        events[eid] = PredictionEvent({
            id: eid,
            question: q,
            startTime: sT,
            endTime: eT,
            yesPool: 0,
            noPool: 0,
            totalBettors: 0,
            status: EventStatus.Pending,
            result: BetChoice.None
        });

        emit EventCreated(eid, q, sT, eT);
    }

    function actEvt(uint256 eid) external validEvent(eid) {
        PredictionEvent storage e = events[eid];

        if (e.status != EventStatus.Pending) revert Errors.InvalidParameter();
        if (block.timestamp < e.startTime) revert Errors.LockPeriodNotMet();
        if (block.timestamp >= e.endTime) revert Errors.InvalidParameter();

        e.status = EventStatus.Active;
        emit EventActivated(eid);
    }

    function resEvt(uint256 eid, BetChoice r) external validEvent(eid) {
        if (!roles.isRole(ORACLE_ROLE, msg.sender))
            revert Errors.Unauthorized();
        if (r != BetChoice.Yes && r != BetChoice.No)
            revert Errors.InvalidParameter();

        PredictionEvent storage e = events[eid];

        if (e.status == EventStatus.Pending && block.timestamp >= e.startTime) {
            e.status = EventStatus.Active;
            emit EventActivated(eid);
        }

        if (e.status != EventStatus.Active) revert Errors.PositionNotActive();

        if (e.yesPool == 0 || e.noPool == 0) {
            e.status = EventStatus.Canceled;
            emit EventCanceled(eid, msg.sender);
            return;
        }

        e.result = r;
        e.status = EventStatus.Resolved;

        emit EventResolved(eid, r, e.yesPool, e.noPool);
    }

    function cancelEvt(uint256 eid) external validEvent(eid) {
        bool isEmergency = roles.isRole(EMERGENCY_ROLE, msg.sender);
        bool isOwnerCall = msg.sender == owner();

        if (!isEmergency && !isOwnerCall) revert Errors.Unauthorized();

        PredictionEvent storage e = events[eid];
        if (
            e.status == EventStatus.Resolved || e.status == EventStatus.Canceled
        ) {
            revert Errors.InvalidParameter();
        }

        e.status = EventStatus.Canceled;
        emit EventCanceled(eid, msg.sender);
    }

    // ─────────────────────────────────────────────────────────────
    //  BETTING
    // ─────────────────────────────────────────────────────────────

    function bet(
        uint256 eid,
        BetChoice c,
        uint256 amt,
        bool useIns,
        uint8 nftId
    ) external nonReentrant whenNotPaused validEvent(eid) {
        if (c != BetChoice.Yes && c != BetChoice.No)
            revert Errors.InvalidParameter();
        if (amt == 0) revert Errors.InvalidAmount();

        PredictionEvent storage e = events[eid];

        if (
            e.status == EventStatus.Pending &&
            block.timestamp >= e.startTime &&
            block.timestamp < e.endTime
        ) {
            e.status = EventStatus.Active;
            emit EventActivated(eid);
        }

        if (e.status != EventStatus.Active) revert Errors.PositionNotActive();
        if (block.timestamp >= e.endTime) revert Errors.LockPeriodNotMet();

        Bet storage b = bets[eid][msg.sender];
        if (b.amount != 0) revert Errors.InvalidTransactionType();

        uint256 totalPay = amt;
        uint256 insPrem = 0;
        if (useIns) {
            // Get NFT volatility directly without helper function
            uint8 nftVol = 0;
            try madhatCard.getCardForUser(msg.sender, nftId) returns (
                uint8 vol,
                uint8 /*clout*/,
                uint8 /*factionId*/,
                bytes32 /*ability*/,
                uint8 /*rarity*/,
                bool /*active*/
            ) {
                nftVol = vol;
            } catch {
                nftVol = 0;
            }
            insPrem = riskOracle.getInsurancePremium(amt, eid, nftVol);
            if (insPrem == 0) revert Errors.InvalidInsurancePremium();
            totalPay = amt + insPrem;
        }

        if (!token.transferFrom(msg.sender, address(this), totalPay)) revert Errors.TransferFailed();

        b.amount = amt;
        b.choice = c;
        b.hasInsurance = useIns;
        b.insurancePremium = insPrem;
        b.insuredAmount = useIns ? amt : 0;

        if (c == BetChoice.Yes) e.yesPool += amt;
        else e.noPool += amt;

        e.totalBettors++;
        totalVolumeAllTime += amt;

        emit BetPlaced(eid, msg.sender, c, amt);
    }

    // ─────────────────────────────────────────────────────────────
    //  CLAIM
    // ─────────────────────────────────────────────────────────────

    function claim(uint256 eid) external nonReentrant validEvent(eid) {
        PredictionEvent storage e = events[eid];
        Bet storage b = bets[eid][msg.sender];

        if (
            e.status != EventStatus.Resolved && e.status != EventStatus.Canceled
        ) {
            revert Errors.PositionNotActive();
        }
        if (b.amount == 0) revert Errors.InsufficientBalance();
        if (b.claimed) revert Errors.InvalidTransactionType();

        b.claimed = true;

        uint256 payout;
        if (e.status == EventStatus.Canceled) {
            payout = b.amount;
        } else if (b.choice == e.result) {
            uint256 winPool = e.result == BetChoice.Yes ? e.yesPool : e.noPool;
            uint256 totalPool = e.yesPool + e.noPool;
            
            // payout = (amount * totalPool * (10000 - fee)) / (winPool * 10000)
            uint256 numerator = b.amount * totalPool * (FEE_DENOMINATOR - PLATFORM_FEE);
            uint256 denominator = winPool * FEE_DENOMINATOR;
            payout = numerator / denominator;
            
            uint256 gross = (b.amount * totalPool) / winPool;
            uint256 fee = gross - payout;

            if (fee > 0) {
                totalFeesCollected += fee;
                if (!token.transfer(treasury, fee)) revert Errors.TransferFailed();
                emit FeeCollected(eid, fee);
            }
        } else {
            if (b.hasInsurance && b.insuredAmount > 0) {
                payout = b.insuredAmount;
            } else {
                payout = 0;
            }
        }

        if (payout > 0) {
        if (!token.transfer(msg.sender, payout)) revert Errors.TransferFailed();
        }

        emit Claimed(eid, msg.sender, payout);
    }

    // ─────────────────────────────────────────────────────────────
    //  REWARD MATHS (Plain Arithmetic)
    // ─────────────────────────────────────────────────────────────


    function previewPayout(
        uint256 eid,
        address user
    ) external view validEvent(eid) returns (uint256 netPayout) {
        PredictionEvent storage e = events[eid];
        Bet storage b = bets[eid][user];

        if (b.amount == 0 || b.claimed) return 0;
        if (e.status == EventStatus.Canceled) return b.amount;

        uint256 winPool = b.choice == BetChoice.Yes ? e.yesPool : e.noPool;
        uint256 totalPool = e.yesPool + e.noPool;
        
        if (winPool == 0 || totalPool == 0) return 0;
        
        uint256 numerator = b.amount * totalPool * (FEE_DENOMINATOR - PLATFORM_FEE);
        uint256 denominator = winPool * FEE_DENOMINATOR;
        return numerator / denominator;
    }

    function getEvent(
        uint256 eid
    )
        external
        view
        validEvent(eid)
        returns (
            uint256 id,
            string memory question,
            uint256 startTime,
            uint256 endTime,
            uint256 yesPool,
            uint256 noPool,
            uint256 totalBettors,
            EventStatus status,
            BetChoice result
        )
    {
        PredictionEvent storage e = events[eid];
        return (
            e.id,
            e.question,
            e.startTime,
            e.endTime,
            e.yesPool,
            e.noPool,
            e.totalBettors,
            e.status,
            e.result
        );
    }

    function getBet(
        uint256 eid,
        address user
    )
        external
        view
        validEvent(eid)
        returns (uint256 amount, BetChoice choice, bool claimed)
    {
        Bet storage b = bets[eid][user];
        return (b.amount, b.choice, b.claimed);
    }

    function getStats()
        external
        view
        returns (
            uint256 _eventCount,
            uint256 _totalVolumeAllTime,
            uint256 _totalFeesCollected
        )
    {
        return (eventCount, totalVolumeAllTime, totalFeesCollected);
    }

    function getUserStats(
        address user
    )
        external
        view
        returns (
            uint256 daily,
            uint256 weekly,
            uint256 monthly,
            uint256 allTime,
            uint256 lastUpdate
        )
    {
        UserStats storage u = leaderboard[user];
        return (u.daily, u.weekly, u.monthly, u.allTime, u.lastUpdate);
    }

    // ─────────────────────────────────────────────────────────────
    //  ADMIN
    // ─────────────────────────────────────────────────────────────

    function updateTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert Errors.ZeroAddress();
        address old = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(old, newTreasury);
    }

    function updateBufferTime(uint256 newBuffer) external onlyOwner {
        uint256 old = bufferTime;
        bufferTime = newBuffer;
        emit BufferTimeUpdated(old, newBuffer);
    }

    function pause() external {
        if (!roles.isRole(PAUSER_ROLE, msg.sender))
            revert Errors.Unauthorized();
        _pause();
    }

    function unpause() external {
        if (!roles.isRole(PAUSER_ROLE, msg.sender))
            revert Errors.Unauthorized();
        _unpause();
    }
}
