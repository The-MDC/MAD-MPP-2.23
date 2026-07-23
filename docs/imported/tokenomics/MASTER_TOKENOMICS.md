# MΛDHAT'S GAMBIT — MASTER TOKENOMICS
> $MADx Token System & Financial Architecture
> Version: vFinal-A16z-YC | March 2026 | Canonical Fee: 1.88%
> Live: https://the-mdc.github.io/MADHATs-Gambit-Presentation/

---

## TRACTION: LIVE ON ARBITRUM

Governance token fair-launched on Arbitrum via Crystex — community-first, no pre-mine.

| Asset | Detail |
|-------|--------|
| Contract | `0xb61ae7727579e3781ca0ec4902b6ba21d335fd18` |
| Chain | Arbitrum One |
| Launch | [Crystex Fair Launch](https://app.crystex.app/campaign-details/e8ad5674-e209-4894-970a-c2ada023e4be) |
| Verification | [Arbiscan](https://arbiscan.io/address/0xb61ae7727579e3781ca0ec4902b6ba21d335fd18) |

---

## 1. TOKEN PARAMETERS

| Parameter | Value | Notes |
|-----------|-------|-------|
| Total Supply | 888,888,888 $MADx | Hard-capped, immutable, no inflation |
| Standard | ERC-20 + Permit | Gasless approvals, multi-chain ready |
| Platform Fee | **1.88%** | Global, on all prediction volume |
| Community Profit Share | **28.8%** | Display as 28% in presentation |
| Creator Revenue | **40% to Creator** | On creator-made markets ONLY |
| MAD Shield Recovery | **28.8%** | Premium-funded insurance |
| TGE Hard Cap | $24,000,000 | Q2 2026 |
| Max Burn / 30 Days | 4.9% | Prevents deflationary spiral |

---

## 2. TOKEN UTILITY (8 Demand Drivers)

| Utility | Strength | Contract |
|---------|----------|----------|
| Betting Currency | STRONG — required for all gameplay | PredictionMarket.sol |
| Pack Purchases | STRONG — weekly Dutch Auction | DutchAuction.sol |
| Card Evolution Burns | VERY STRONG — 100-2,500 $MADx burned | EvolutionEngine |
| NFT Staking | VERY STRONG — 8-68% APY | StakingPool.sol |
| Quadratic Governance | STRONG — 100K deposit for proposals | QuadraticVoting.sol |
| Creator Market Fees | STRONG — 40% lifetime to creator | MarketFactory.sol |
| MAD Shield Pool | STRONG — 28.8% recovery | RiskOracle.sol |
| AI Agent Subscriptions | MODERATE — SaaS revenue | Backend |

---

## 3. DISTRIBUTION & VESTING

| Category | % | Tokens | Cliff | Vesting |
|----------|---|--------|-------|---------|
| Community & Gameplay | 45% | 400,000,000 | None | 60 mo linear (Bet-to-Earn) |
| DAO Treasury | 15% | 133,333,333 | 6 mo | 36 mo linear monthly |
| Liquidity | 15% | 133,333,333 | None | 48 mo (locked in Bond Curve) |
| Team & Advisors | 15% | 133,333,333 | 12 mo | 36 mo standard |
| Seed & Private | 10% | 88,888,888 | 6 mo | 24 mo linear |

Staking absorption: 82-85% (NFT staking required for gameplay). Day-1 liquidity: $7.5M+. Sell pressure model: <1.5% slippage at 3× bear volume.

---

## 4. FEE STRUCTURE (1.88%)

### Platform-Made Markets
$100 bet → $1.88 fee: 35% Operations ($0.658) | 25% MAD Shield ($0.47) | 10% Burn ($0.188) | 30% Community ($0.564)

### Creator-Made Markets
$100 bet → $1.88 fee: **40% to Creator ($0.752)** lifetime on-chain | 60% to Platform ($1.128, allocated per above)

Creator share applies ONLY to markets created by that creator. Platform-made markets retain 100%.

---

## 5. STAKING TIERS

| Rarity | Dist. | APY | Clout | Evo Burn |
|--------|-------|-----|-------|----------|
| Common | 60% | 8% | 0-30 | 100 $MADx |
| Uncommon | 25% | 10% | 31-60 | 250 $MADx |
| Rare | 10% | 13% | 61-100 | 500 $MADx |
| Epic | 4% | 20% | 101-140 | 1,000 $MADx |
| Legendary | 1% | 28% | 141-180 | 1,500 $MADx |
| Golden Hand | <1% | 68% | 181-200 | 2,500 $MADx |

### Conviction Staking

| Tier | Min Stake | Lock | APY | Shield Bonus | Gov Weight |
|------|-----------|------|-----|-------------|-----------|
| Bronze | 100 | 7d | 8% | None | 1× |
| Silver | 1,000 | 30d | 12% | +5% | 2× |
| Gold | 5,000 | 90d | 18% | +10% | 4× |
| Platinum | 25,000 | 180d | 28% | +15% | 8× |
| Diamond | 100,000 | 365d | 42% | +20% | 16× |
| MAD | 250,000 | 365d | 68% | Full 28.8% | 32× |

---

## 6. MAD SHIELD (28.8% Loss Recovery)

Premium: Stake × P(win) × √σ²(t+1) × SafetyMargin
GARCH(1,1): σ²(t+1) = ω + α·ε²(t) + β·σ²(t)

| Scenario | Price | Volume | Pool Impact Y1 |
|----------|-------|--------|----------------|
| Base | 1.00× | 1.00× | +$1.8M |
| Bear | 0.30× | 0.50× | +$0.4M |
| Bull | 2.00× | 2.00× | +$5.2M |
| Stress (5%) | 0.15× | 0.25× | +$0.1M |

Monte Carlo: 100% of 1,000 simulations remained solvent. Patent angle: 89% (on-chain reserve-locking is novel).

---

## 7. DEFLATIONARY MECHANICS

| Mechanism | Impact |
|-----------|--------|
| 10% Fee Burn | Continuous buying pressure tied to volume |
| Evolution Burns | 100-2,500 $MADx per card upgrade |
| Affliction Burns | Losing cards cost $MADx to cure |
| Transfer Burn | 0.15-0.50% per transfer (LP/staking exempt) |
| Monthly Cap | 4.9% max burn per 30 days |

---

## 8. DL-LMSR BONDING CURVE

P(i) = e^(q(i)/b) / Σ(e^(q(j)/b))

Every position always tradeable — protocol acts as counterparty. Dynamic b parameter scales with volume. Day-1 POL: $7.5M+. Contract: BondingCurve.sol (FEE_BPS=188).

---

## 9. 36-MONTH PROJECTIONS

| Period | DAU | Volume/mo | Gross Rev | EBITDA |
|--------|-----|-----------|-----------|--------|
| Mo 1-3 | 12.5K-50K | $10M-$41M | $0.9M-$3.5M | $0.3M-$1.5M |
| Mo 4-6 | 50K-100K | $41M-$79M | $3.5M-$6.8M | $1.5M-$3.5M |
| Mo 7-12 | 100K-150K | $39M-$124M | $6.8M-$21.5M | $3M-$10.5M |
| Y2 (13-24) | 150K-450K | $62M-$181M | $21.5M-$62.5M | $10.5M-$35M |
| Y3 (25-36) | 750K | $181M-$351M | $121.4M (mid) | $77.6M |

Bull Y3: $154.5M gross. Always label scenario.

---

## 10. INVESTMENT

| Term | Value |
|------|-------|
| Seed Ask | $1,000,000 – $2,000,000 |
| Pre-Money | $12,000,000 |
| Token Allocation | 10% (88,888,888 $MADx) |
| Vesting | 6mo cliff, 24mo linear |
| Runway | 18 months to TGE + mobile + 50K DAU |

---

## 11. VERSION HISTORY

| Version | Date | Fee | Shield | Key Change |
|---------|------|-----|--------|------------|
| v1.0 | Nov 2024 | — | — | Original concept, 1B supply |
| v1.5 | Jan 2026 | 2.88% | 40% | Renamed MAD Gambit, Arbitrum, fixed 888.89M |
| v1.8 | Feb 2026 | 4.88% | 40-60% | Full whitepaper draft |
| vFinal | Mar 2026 | **1.88%** | **28.8%** | Corrected, 40% creator-only, actuarial Shield |

4.88% → 1.88%: Competitive positioning vs Kalshi (~1.2%) and Polymarket (~0.01%).

---

*A16Z/YC format: Traction first, one point per section, all projections labeled, all claims sourced. Patent 89%. Token live on Arbitrum.*

---

## 12. EXTENDED TOKEN PARAMETERS

| Parameter | Value |
|-----------|-------|
| Name | $MADx |
| Standard | ERC-20 + Permit (gasless approvals) |
| Total Supply | 888,888,888 (hard-capped, immutable, no inflation) |
| Active Supply | 600,000,000 |
| Reserve Supply | 222,000,000 (Treasury + locked) |
| Decimals | 18 |
| Primary Chain | Arbitrum Nova / One |
| TGE Hard Cap | $24,000,000 (Q2 2026) |

## 13. DETAILED DISTRIBUTION & VESTING

| Category | % | Tokens | Cliff | Vesting | Mechanism |
|----------|---|--------|-------|---------|-----------|
| Community & Gameplay | 45% | 400,000,000 | None | 60 months | Linear via Bet-to-Earn mining |
| DAO Treasury | 15% | 133,333,333 | 6 months | 36 months | Monthly linear unlock |
| Liquidity | 15% | 133,333,333 | None | 48 months | Permanently locked in Bond Curve |
| Team & Advisors | 15% | 133,333,333 | 12 months | 36 months | Standard alignment schedule |
| Seed & Private | 10% | 88,888,888 | 6 months | 24 months | Linear post-cliff |

### Sell Pressure Model

SellPressure(USD) = UnlockedTokens × SellThroughRate × (1 − StakingAbsorption) × TokenPrice

Staking Absorption: 82-85% (NFT staking required for gameplay). Initial Liquidity Depth: $7.5M+ absorbs 3× Day-1 bear sell pressure at <1.5% slippage.

## 14. EXTENDED UTILITY MATRIX

| Utility | Demand Driver | Contract |
|---------|--------------|----------|
| Betting Currency | STRONG — Required for all gameplay | PredictionMarket.sol |
| Pack Purchases | STRONG — Weekly Dutch Auction demand | DutchAuction.sol |
| Card Evolution Burns | VERY STRONG — 100-2,500 $MADx burned per step | EvolutionEngine |
| Tournament Entry | MODERATE — Seasonal spikes | Frontend |
| NFT Staking | VERY STRONG — Core retention loop (8-68% APY) | StakingPool.sol |
| Creator Market Fees | STRONG — Creator acquisition engine | PredictionMarket.sol |
| MAD Shield Pool | STRONG — Real-yield insurance engine | RiskOracle.sol |
| Dispute Evidence | MODERATE — Oracle governance | OracleIntegration.sol |

## 15. FEE MATH (Visual Breakdown)

### Platform-Made Markets
```
$100 bet → $1.88 fee
  → 35% Operations ($0.658)
  → 25% MAD Shield Pool ($0.47)
  → 10% Token Burn ($0.188)
  → 30% Community Rewards ($0.564) ← 28.8% profit share
```

### Creator-Made Markets
```
$100 bet → $1.88 fee
  → 40% to Creator ($0.752) — lifetime on-chain revenue
  → 60% to Platform ($1.128) — allocated per above split
```

## 16. STAKING (Extended Detail)

### Card-Based Staking (NFT Rarity Tiers)

| Rarity | Distribution | Multiplier | APY | Clout Range | Evolution Burn |
|--------|-------------|-----------|-----|-------------|---------------|
| Common | 60% | 1.0x | 8% | 0-30 | 100 $MADx |
| Uncommon | 25% | 1.1x | 10% | 31-60 | 250 $MADx |
| Rare | 10% | 1.25x | 13% | 61-100 | 500 $MADx |
| Epic | 4% | 1.5x | 20% | 101-140 | 1,000 $MADx |
| Legendary | 1% | 2.0x | 28% | 141-180 | 1,500 $MADx |
| Golden Hand/Mythic | <1% | 3.0x | 68% | 181-200 | 2,500 $MADx |

### Yield Formula

```
R(u) = Y(pool) × (Stake(u) × M(nft)) / Σ(Stake(j) × M(j))
M(nft) = 1.0 + (Clout / 200)
Max APY: 68%
```

## 17. EXTENDED PROJECTIONS

| Period | DAU | Monthly Volume | Gross Revenue | Platform Net | EBITDA |
|--------|-----|---------------|---------------|-------------|--------|
| Mo 1-3 | 12.5K-50K | $10M-$41M | $0.9M-$3.5M | $0.65M-$2.52M | $0.3M-$1.5M |
| Mo 4-6 | 50K-100K | $41M-$79M | $3.5M-$6.8M | $2.52M-$4.90M | $1.5M-$3.5M |
| Mo 7-12 | 100K-150K | $39M-$124M | $6.8M-$21.5M | $4.90M-$15.5M | $3.0M-$10.5M |
| Mo 13-24 | 150K-450K | $62M-$181M | $21.5M-$62.5M | $15.5M-$45.0M | $10.5M-$35.0M |
| Mo 25-36 | 750K | $181M-$351M | $62.5M-$121.4M | $45.0M-$87.4M | $35.0M-$77.6M |

## 18. VERSION HISTORY (Extended Rationale)

Understanding how the tokenomics evolved helps defend against VC questions about why numbers changed.

| Version | Date | Supply | Standard | Chain | Fee | Shield | Key Change |
|---------|------|--------|----------|-------|-----|--------|------------|
| v1.0 | Oct 2025 | 1,000,000,000 | ERC-1155 | Base L2 | 2-5% | 40-60% | Original "Golden Hand Casino" model, 888/222 split |
| v1.5 | Jan 2026 | 888,888,888 | ERC-20 + Permit | Arbitrum | 2.88% | 40% | Renamed to MAD Gambit, shifted to Arbitrum, fixed supply |
| v1.8 | Feb 2026 | 888,888,888 | ERC-20 + Permit | Arbitrum | 4.88% | 40-60% | Full whitepaper draft, comprehensive math |
| vFinal | Mar 2026 | 888,888,888 | ERC-20 + Permit | Arbitrum | **1.88%** | **28.8%** | Corrected fee, actuarial Shield, creator-specific 40% |

### Evolution Rationale
- 1B → 888.88M supply: Culturally significant number (prosperity/infinity), scarcity narrative
- ERC-1155 → ERC-20: Separated fungible token from NFT cards (now ERC-1155 for cards only)
- Base → Arbitrum: Lower costs, better DeFi ecosystem, Camelot/GMX liquidity
- 4.88% → 1.88% fee: Competitive positioning vs Kalshi (~1.2%) and Polymarket (~0.01%)
- 40-60% → 28.8% Shield: Actuarial modeling showed 40%+ unsustainable under correlated events

## 19. RISK MITIGATIONS

| Risk | Mitigation |
|------|-----------|
| Insufficient liquidity | 15% supply locked in Bond Curve ($7.5M+ Day-1) |
| Rug pull | Team tokens 12mo cliff, 36mo vest, multi-sig treasury |
| Bear market | Real yield from platform fees (not token emissions) |
| Whale domination | Quadratic voting (Power = √Tokens) |
| DAO apathy | Governance participation incentives, 85% target |
| Malicious proposals | 100K $MADx deposit + 48-72hr timelock |
| Smart contract exploits | CertiK/Trail of Bits dual audit, OpenZeppelin standards |
| Oracle manipulation | Triple-Threat with commit-reveal, 66% supermajority |
| Key compromise | Hardware wallets, multi-sig (3-of-5), geographic distribution |

## 20. LIVE DEPLOYMENT

| Parameter | Value |
|-----------|-------|
| Contract Address | `0xb61ae7727579e3781ca0ec4902b6ba21d335fd18` |
| Chain | Arbitrum One |
| Launch Method | Fair Launch via Crystex (not pre-mine, community-first) |
| Crystex Campaign | https://app.crystex.app/campaign-details/e8ad5674-e209-4894-970a-c2ada023e4be |
| Arbiscan | https://arbiscan.io/address/0xb61ae7727579e3781ca0ec4902b6ba21d335fd18 |

Active pursuit of Arbitrum Foundation grants/ecosystem funding. Native Arbitrum deployment demonstrates ecosystem commitment. Pipeline: MPP → Closed Beta → Open Beta → Pre-Launch → TGE (Q2 2026).

*The fair launch model via Crystex ensures community-first distribution — no insider pre-mines, no VC token dumps. This aligns with the 45% Community & Gameplay allocation.*
