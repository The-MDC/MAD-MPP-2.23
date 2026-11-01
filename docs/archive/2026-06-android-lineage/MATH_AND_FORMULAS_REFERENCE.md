# MAD Gambit: Core Math & Formulas Reference

Based on the Dual Research Dossier and system design notes previously provided, here is the compiled institutional math, pricing logic, and neuro-economic formulas that power the ecosystem.

## 1. The Dutch Auction Formula (Primary Pack Sales)
Used for the primary distribution of predictive scandal packs, creating a linear descending price curve to enforce fair price discovery and prevent bot-sniping.

```solidity
function getAuctionPrice() public view returns (uint256) {
    if (block.timestamp < auctionStartTime) return startPrice;
    if (block.timestamp >= auctionEndTime) return floorPrice;
    
    uint256 elapsed = block.timestamp - auctionStartTime;
    uint256 duration = auctionEndTime - auctionStartTime;
    uint256 priceDrop = ((startPrice - floorPrice) * elapsed) / duration;
    
    return startPrice - priceDrop;
}
```
**Example Bounds:** `startPrice` = 0.5 ETH, `floorPrice` = 0.05 ETH.

---

## 2. LMSR Pricing Engine (Secondary Market)
**Logarithmic Market Scoring Rule (LMSR)** is utilized for dynamic secondary market pricing. It dynamically adjusts card/token prices based on real-time demand and outcome probabilities.
* As buy pressure shifts heavily toward one side of a conviction/prediction, the logarithmic scale accelerates the cost of subsequent shares, enforcing liquidity boundaries.

---

## 3. Platform Fee & Revenue Splitting (BPS Math)
The institutional backbone of the market economy runs on strictly audited fractional points (Basis Points):

* **Platform Fee:** `1.88%` (188 BPS) on operations.
* **Creator Revenue Share:** `40%` (4000 BPS of the fee) routed dynamically to the market creator.
* **Community Pool:** `28.8%` (2880 BPS of the fee).
* **MAD Shield Insurance Recovery:** `28.8%` of stash recovered (premium costs 2-4% of bet).

---

## 4. The Affliction & Neuroscience Fibonacci Scaling
Variable Reward Schedules (VRS) operate utilizing a Fibonacci sequence to mathematically disrupt predictable dopamine loops:

* **VRS Triggers:** `[5, 8, 13, 21, 34]`
* **Loss Aversion Multiplier:** Set at `2.5x` (meaning losses are weighted 2.5 times heavier psychologically than gains in the recovery path engine calculation).

---

## 5. Card Rarity Power Scores & Clout Yield
Card tiers scale aggressively to reward early minters and high stakers:

| Tier | Power Score | Clout Multiplier | Staking APY |
| :--- | :--- | :--- | :--- |
| **Common** | 88 | 1.1x | 12% |
| **Uncommon**| 256 | 1.8x | 16% |
| **Rare** | 488 | 2.4x | 22% |
| **Epic**| 1,888 | 3.2x | 31% |
| **Legendary**| 4,888 | 5.5x | 48% |
| **Golden Hand**| 7,888 | 8.8x | 68% |
| **Mythic**| 99,999| 99.9x | 88% |

---

## 6. Pick & Win Streak Multipliers
The streak engine compounds multipliers over sequential narrative wins:
* **Streak 3:** 1.3x 
* **Streak 5:** 1.8x + Free Pack (Double evolution speed)
* **Streak 7:** 2.4x + Savage Mode (Visual upgrade)
* **Streak 10+:** 3.2x + HAT Trick / Rare Frame

---

## 7. Evolution Burn Ratios
Converting low-tier cards into higher-tier status acts as the primary deflationary mechanism for the ecosystem:
* **Common → Uncommon:** Requires 100 Cards (100 XP)
* **Uncommon → Rare:** Requires 250 Cards (200 XP)
* **Rare → Epic:** Requires 500 Cards (500 XP)
* **Epic → Legendary:** Requires 1,000 Cards (2,500 XP)

---

## 8. Tournament Prize Distribution
Prizes are pooled and distributed strictly across an 8-Tier tournament ecosystem:
* **1st Place:** 4000 BPS (40%)
* **2nd Place:** 2000 BPS (20%)
* **3rd Place:** 1200 BPS (12%)
* **4th–5th Place:** 500 BPS each (5%)
* **6th–10th Place:** 200 BPS each (2%)
