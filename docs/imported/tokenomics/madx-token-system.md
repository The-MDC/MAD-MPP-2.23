# $MADx Token System — Source of Truth
> Last updated: March 18, 2026

## Core Parameters
- Total Supply: 888,888,888 $MADx (fixed, immutable, no inflation)
- Active Supply: 600,000,000 (from circular economy infographic)
- Reserve Supply: 222,000,000 (from circular economy infographic)
- Token Standard: ERC-20 + Permit
- Decimals: 18
- Max Burn / 30 Days: 4.9%
- TGE Hard Cap: $24,000,000 (Q2 2026)

## Distribution
| Category | % | Tokens | Cliff | Vesting |
|----------|---|--------|-------|---------|
| Community & Gameplay | 45% | 400,000,000 | None | 60 months |
| DAO Treasury | 15% | 133,333,333 | 6 months | 36 months |
| Liquidity | 15% | 133,333,333 | None | 48 months |
| Team & Advisors | 15% | 133,333,333 | 12 months | 36 months |
| Seed & Private | 10% | 88,888,888 | 6 months | 24 months |

## Deflationary Mechanics
- 10% fee burn (4.9% cap per 30 days)
- Card evolution burns (100-2,500 $MADx per step)
- Affliction burns on losing positions
- 0.15-0.5% transfer burn (LP/staking exempt)

## Staking Tiers
| Rarity | Distribution | Multiplier | APY |
|--------|-------------|-----------|-----|
| Common | 60% | 1.0x | 8% |
| Uncommon | 25% | 1.1x | 10% |
| Rare | 10% | 1.25x | 13% |
| Epic | 4% | 1.5x | 20% |
| Legendary | 1% | 2.0x | 28% |
| Golden Hand/Mythic | <1% | 3.0x | 68% |

## Key Formulas
- Sell Pressure: UnlockedTokens × SellThroughRate × (1-StakingAbsorption) × TokenPrice
- Shield Premium: Stake × P(win) × sqrt(Volatility) × SafetyMargin
- GARCH: σ²(t+1) = ω + α·ε²(t) + β·σ²(t)
- DL-LMSR: P(i) = e^(qi/b) / Σ e^(qj/b)
- Staking Reward: R(u) = Y(pool) × (Stake(u) × M(nft)) / Σ(Stake(j) × M(j))
