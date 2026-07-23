// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {RolesRegistry} from "../registries/roles.sol";
import {Errors} from "../errors/Errors.sol";
import {ABDKMath64x64} from "abdk-libraries-solidity/ABDKMath64x64.sol";
import {OnChainPrediction} from "../prediction/game.sol";

contract RiskOracle {
    using ABDKMath64x64 for int128;

    RolesRegistry public roles;
    OnChainPrediction public predictionMarket;
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    
    struct EventBetRisk {
        uint64 omega;      // Base volatility from NFT tier
        uint64 alpha;      // News impact coefficient
        uint64 beta;       // Panic memory coefficient
        uint64 lastVariance;
        uint64 lastShock;
    }
    
    mapping(uint256 => EventBetRisk) public eventBetRisks;
    
    // Update parameters via off-chain ML worker + Chainlink Automation
    function updateGarchParams(uint256 eventBetId, uint64 alpha, uint64 beta) external {
        if (!roles.isRole(ORACLE_ROLE, msg.sender)) revert Errors.Unauthorized();
        require(alpha + beta < 100, "Invalid GARCH constraint"); // α+β<1 in basis points
        eventBetRisks[eventBetId].alpha = alpha;
        eventBetRisks[eventBetId].beta = beta;
    }
    
    // Calculate premium for insurance purchase
    function getInsurancePremium(uint256 stake, uint256 eventBetId, uint8 nftVolatility) 
        external view returns (uint256 premium) 
    {
        EventBetRisk storage risk = eventBetRisks[eventBetId];
        
        // GARCH forecast: σ²_{t+1} = ω + α·ε² + β·σ²
        // omega is 0.5% to 0.95% (50 to 95 bp)
        uint256 omega = 50 + (uint256(nftVolatility) * 45) / 100; 
        uint256 varianceForecast = omega 
            + (uint256(risk.alpha) * uint256(risk.lastShock)) / 100 
            + (uint256(risk.beta) * uint256(risk.lastVariance)) / 100;
            
        // Calculate Win Probability in Basis Points
        (,,,, uint256 yesPool, uint256 noPool,,,) = predictionMarket.getEvent(eventBetId);
        uint256 totalPool = yesPool + noPool;
        if (totalPool == 0) return 0;
        uint256 winProbBp = (yesPool * 10000) / totalPool;
        
        // Premium = stake * (winProbBp / 10000) * sqrt(varianceForecast / 10000) * 1.05
        // sqrt(varianceForecast / 10000) = sqrt(varianceForecast) / 100
        
        // We use integer sqrt with scaling for precision
        // Scaling varianceForecast by 1e14 gives sqrt scaled by 1e7
        uint256 volScaled = _sqrt(varianceForecast * 1e14); // volScaled = volatility * 1e9
        
        // premium = stake * winProbBp/10000 * volScaled/1e9 * 1.05
        // premium = (stake * winProbBp * volScaled * 105) / (10000 * 1e9 * 100)
        // premium = (stake * winProbBp * volScaled * 105) / 1e15
        premium = (stake * winProbBp * volScaled * 105) / 1e15;
    }

    function getWinProbability(uint256 eventBetId, uint8 outcome) 
        public 
        view 
        returns (int128 probability) 
    {
        (,,,, uint256 yesPool, uint256 noPool,,,) = predictionMarket.getEvent(eventBetId);
        uint256 totalPool = yesPool + noPool;
        require(totalPool > 0, "No liquidity");
        uint256 outcomePool = outcome == 0 ? yesPool : noPool;
        
        return ABDKMath64x64.divu(outcomePool, totalPool);
    }

    constructor(address _predictionMarket, address _rolesAddress) {
        if (_predictionMarket == address(0) || _rolesAddress == address(0)) {
            revert Errors.ZeroAddress();
        }
        predictionMarket = OnChainPrediction(_predictionMarket);
        roles = RolesRegistry(_rolesAddress);
    }

    function getWinProbabilityBp(uint256 eventBetId, uint8 outcome) 
        external 
        view 
        returns (uint256) 
    {
        (,,,, uint256 yesPool, uint256 noPool,,,) = predictionMarket.getEvent(eventBetId);
        uint256 totalPool = yesPool + noPool;
        if (totalPool == 0) return 0;
        uint256 outcomePool = outcome == 0 ? yesPool : noPool;
        return (outcomePool * 10000) / totalPool;
    }

    function updatePredictionMarket(address newPredictionMarket) external {
        if (!roles.isRole(ORACLE_ROLE, msg.sender)) revert Errors.Unauthorized();
        if (newPredictionMarket == address(0)) revert Errors.ZeroAddress();
        predictionMarket = OnChainPrediction(newPredictionMarket);
    }

    function _sqrt(uint256 x) internal pure returns (uint256 y) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }
}
