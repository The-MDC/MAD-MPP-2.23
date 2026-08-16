# The Engine Room — All Tokenomics Math & Formulas
> Extracted from: Whitepaper Section 09, GitHub Presentation, EVM Implementation Guide

---

## 1. SELL PRESSURE MODEL

```
SellPressure(USD) = UnlockedTokens × SellThroughRate × (1 − StakingAbsorption) × TokenPrice
```

| Parameter | Base | Bear | Bull | Stress (5%) |
|-----------|------|------|------|-------------|
| Price Multiplier | 1.00× | 0.30× | 2.00× | 0.15× |
| Volume Multiplier | 1.00× | 0.50× | 2.00× | 0.25× |
| Sell-Through Adj. | 0 | +1.75 | -0.75 | +2.50 |
| Staking Absorption Adj. | 0 | -0.60 | +1.20 | -0.80 |
| Shield Pool Impact (Y1) | +$1.8M | +$0.4M | +$5.2M | +$0.1M |

StakingAbsorption: 82–85% (driven by NFT staking requirement)
Initial Depth: $7.5M+ absorbs 3× Day-1 bear pressure at <1.5% slippage

## 2. MAD SHIELD PREMIUM — RISK ALGORITHM

```
Φ = S × P(win) × √σ²(t+1) × λ(SafetyMargin)
```

Worked Example: $100 stake on 50/50 market
→ Premium = $3.00 (3%)
→ Pool collects $3. If LOSE → Pool pays $28.80
→ Monte Carlo: Year 1 Net Pool +$1.8M (94% positive across 1,000 scenarios)

## 3. GARCH(1,1) VOLATILITY ORACLE

```
σ²(t+1) = ω + α·ε²(t) + β·σ²(t)
```

- Calculated on-chain via fixed-point arithmetic
- Parameters seeded per card at mint time, updated via Chainlink Automation
- Calm markets = cheap Shield; volatile markets = expensive Shield

## 4. DL-LMSR BONDING CURVE — INSTANT LIQUIDITY

```
P(i) = e^(q(i)/b) / Σ e^(q(j)/b)
```

- Every position always tradeable — protocol is counterparty
- Dynamic b parameter scales with volume
- Popular markets self-deepen liquidity
- Eliminates external market makers

## 5. STAKING REWARD DISTRIBUTION

```
R(u) = Y(pool) × (Stake(u) × M(nft)) / Σ(Stake(j) × M(j))
M(nft) = 1.0 + (Clout / 200)
Max APY: 68%
```

- Clout stat (0–200) determined by card rarity
- Golden Hand Clout=200 → M_nft=2.0× multiplier
- Yield pool funded by: 25% platform fees + Shield premiums + DeFi yield

## 6. REVENUE DISTRIBUTION FORMULA

```
Creator-Made Market: 40% of Fee (0.752% of Vol) → Creator → Creator | 60% → Platform
Platform-Made Market: 100% → Platform (1.88% of Vol)
Platform Allocation: 35% Ops | 25% Shield | 10% Burn | 30% Community
```

## 7. CARD EVOLUTION BURN SCHEDULE

| Rarity | $MADx Burned Per Evolution | Clout Range |
|--------|---------------------------|-------------|
| Common | 100 | 0-30 |
| Uncommon | 250 | 31-60 |
| Rare | 500 | 61-100 |
| Epic | 1,000 | 101-140 |
| Legendary | 1,500 | 141-180 |
| Golden Hand / Mythic | 2,500 | 181-200 |

## 8. MONTHLY BURN CAP

```
MaxBurn(30d) = TotalSupply × 0.049 = 43,555,555 $MADx
```

Prevents deflationary death spiral. Hard-coded in contract.
