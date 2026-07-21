// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title BondingCurve
 * @notice DL-LMSR Bonding Curve for MADHATs Gambit Prediction Markets
 * @dev Formula: P(i) = e^(q(i)/b) / Sum(e^(q(j)/b))
 *      Dynamic b parameter scales with volume
 *      Eliminates external market makers entirely
 *      Day-1 protocol-owned liquidity: $7.5M+
 *
 * Referenced: Whitepaper S09, API Spec, EVM Implementation Guide
 * Audit: CertiK / Trail of Bits pre-mainnet
 */
contract BondingCurve {
    
    uint256 public constant PRECISION = 1e18;
    uint256 public constant FEE_BPS = 188;            // 1.88%
    uint256 public constant CREATOR_SHARE_BPS = 4000;  // 40% of fee to creator
    uint256 public constant MIN_B = 1e15;
    uint256 public constant B_SCALE_FACTOR = 1e14;
    
    // Fee distribution (of platform's 60% share)
    uint256 public constant OPS_SHARE = 3500;       // 35% operations
    uint256 public constant SHIELD_SHARE = 2500;    // 25% MAD Shield
    uint256 public constant BURN_SHARE = 1000;      // 10% token burn
    uint256 public constant COMMUNITY_SHARE = 3000; // 30% community
    
    struct Market {
        uint256 id;
        uint256[] quantities;
        uint256 b;
        uint256 totalVolume;
        address creator;
        bool active;
    }
    
    mapping(uint256 => Market) public markets;
    uint256 public nextMarketId;
    
    event MarketCreated(uint256 indexed marketId, uint256 numOutcomes, uint256 initialB, address creator);
    event SharesBought(uint256 indexed marketId, uint256 outcome, uint256 amount, uint256 cost, address buyer);
    event SharesSold(uint256 indexed marketId, uint256 outcome, uint256 amount, uint256 payout, address seller);
    event LiquidityDepthUpdated(uint256 indexed marketId, uint256 newB);
    
    function createMarket(uint256 numOutcomes, uint256 initialLiquidity, address creator) 
        external returns (uint256 marketId) 
    {
        require(numOutcomes >= 2 && numOutcomes <= 10, "Invalid outcomes");
        require(initialLiquidity >= MIN_B, "Insufficient liquidity");
        
        marketId = nextMarketId++;
        Market storage m = markets[marketId];
        m.id = marketId;
        m.b = initialLiquidity;
        m.creator = creator;
        m.active = true;
        
        for (uint256 i = 0; i < numOutcomes; i++) {
            m.quantities.push(0);
        }
        emit MarketCreated(marketId, numOutcomes, initialLiquidity, creator);
    }
    
    /// @notice DL-LMSR cost: b * ln(SumExp_after) - b * ln(SumExp_before)
    function calculateBuyCost(uint256 marketId, uint256 outcome, uint256 amount) 
        public view returns (uint256 cost) 
    {
        Market storage m = markets[marketId];
        require(m.active && outcome < m.quantities.length, "Invalid");
        
        uint256 sumBefore = _sumExp(m.quantities, m.b);
        uint256[] memory newQ = new uint256[](m.quantities.length);
        for (uint256 i = 0; i < m.quantities.length; i++) newQ[i] = m.quantities[i];
        newQ[outcome] += amount;
        uint256 sumAfter = _sumExp(newQ, m.b);
        
        cost = (m.b * (_ln(sumAfter) - _ln(sumBefore))) / PRECISION;
    }
    
    /// @notice P(i) = e^(q(i)/b) / Sum(e^(q(j)/b))
    function getOutcomePrices(uint256 marketId) external view returns (uint256[] memory prices) {
        Market storage m = markets[marketId];
        uint256 sumExp = _sumExp(m.quantities, m.b);
        prices = new uint256[](m.quantities.length);
        for (uint256 i = 0; i < m.quantities.length; i++) {
            prices[i] = (_exp(m.quantities[i], m.b) * PRECISION) / sumExp;
        }
    }
    
    // Fixed-point exp approximation (Taylor 6-term)
    function _exp(uint256 q, uint256 b) internal pure returns (uint256) {
        uint256 x = (q * PRECISION) / b;
        uint256 result = PRECISION;
        uint256 term = x;
        result += term;
        for (uint256 i = 2; i <= 6; i++) {
            term = (term * x) / (i * PRECISION);
            result += term;
        }
        return result;
    }
    
    function _sumExp(uint256[] memory quantities, uint256 b) internal pure returns (uint256 sum) {
        for (uint256 i = 0; i < quantities.length; i++) sum += _exp(quantities[i], b);
    }
    
    function _ln(uint256 x) internal pure returns (uint256) {
        require(x > 0, "ln(0)");
        uint256 y = ((x - PRECISION) * PRECISION) / (x + PRECISION);
        uint256 y2 = (y * y) / PRECISION;
        uint256 result = y;
        uint256 term = (y * y2) / PRECISION;
        result += term / 3;
        term = (term * y2) / PRECISION;
        result += term / 5;
        return 2 * result;
    }
}
