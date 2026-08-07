# MΛD Gambit: Institutional Mathematics, Algorithms, and Economics Codex
Author: **The MADHAT'r** (Consensus Host & Chief Protocol Quant)
Date: June 2026

This codex delivers a granular, mathematically rigorous breakdown of the algorithms, bonding curves, statistical risk equations, and game-theoretic models running natively inside the **MΛD Gambit** engine.

---

## 1. Multi-Dimensional Conviction Score (Cobb-Douglas Model)

The sovereign measure of a degen’s commitment to an outcome is governed by a modified **Cobb-Douglas production function**. Rather than evaluating standard capital and labor indices, the engine evaluates multidimensional human resolve:

$$\text{Conviction} = t^{1.35} \cdot c^{0.75} \cdot d^{1.45} \cdot p^{1.15} \cdot M_{\text{nft}} \cdot L_{\theta}$$

### Parameters and Elasticities:
* **$t$** (Time-Scaled weight, exponent $1.35$): Measures time duration the position has been continuously held. Time shows the highest elasticity to reward long-term believers and penalize flash-loan bot manipulators.
* **$c$** (Capital-Scaled weight, exponent $0.75$): Scale of the underlying $MADx$ stake. Set with inelastic elasticity (< 1.0) to prevent capital concentration attacks from completely dominating narrative weights.
* **$d$** (Contribution ratio, exponent $1.45$): Experience and active completed missions weight. Highly elastic to reward organic system interaction.
* **$p$** (Psychological margin, exponent $1.15$): Volatility-adjusted loss aversion weights.
* **$M_{\text{nft}}$** (NFT multiplier, binary/continuous): Active Clout APY boost factor corresponding to card tier.
* **$L_{\theta}$** (Cosmological Lunar phase multiplier, bounded $1.00 \leq L_{\theta} \leq 1.15$): Synthesizes narrative volatility against actual moon orbits.

### Implementation Code (`GambitMath.kt`):
```kotlin
fun calculateConviction(
    timeScaled: Double,
    capitalScaled: Double,
    contributionScaled: Double,
    psychScaled: Double,
    nftMult: Double,
    lunarMultiplier: Double = 1.0
): Double {
    val t = max(timeScaled, 0.0).pow(1.35)
    val c = max(capitalScaled, 0.0).pow(0.75)
    val d = max(contributionScaled, 0.0).pow(1.45)
    val p = max(psychScaled, 0.0).pow(1.15)
    val m = if (nftMult.isNaN() || !nftMult.isFinite()) 1.0 else nftMult
    val l = if (lunarMultiplier.isNaN() || !lunarMultiplier.isFinite()) 1.0 else lunarMultiplier
    val result = t * c * d * p * m * l
    return if (result.isNaN() || !result.isFinite()) 0.0 else result
}
```

---

## 2. Dynamic Volume-Scaled Bond Pricing (DL-LMSR)

For secondary card sales and continuous contract trading, we employ a **Double-Logarithmic Market Scoring Rule (DL-LMSR)**. Standard LMSR introduces severe liquidity constraints under heavy volume skew. Our model introduces a dynamic scaling factor $\alpha(V)$ linked to rolling contract volume $V$:

### Volume Scaling Coefficient:
$$\alpha(V) = 1.0 + 0.05 \cdot \log_{10}(1.0 + V)$$

### High-Fidelity Cost Function:
$$C(q) = \alpha(V) \cdot b \cdot \ln \left( \sum_{i} e^{\frac{q_i}{b}} \right)$$

### Instantaneous Spot Price of Outcome $i$:
$$P_i = \frac{e^{\frac{q_i}{b}}}{\sum_j e^{\frac{q_j}{b}}}$$

* **$q_i$**: The quantity of shares held in outcome $i$.
* **$b$**: The liquidity parameter (bonding curve depth).
* **$V$**: Rolling market volume indicator.

### Implementation Code (`GambitMath.kt`):
```kotlin
fun calculateVolumeScalingAlpha(volume: Double): Double {
    val safeVolume = max(volume, 0.0)
    return 1.0 + 0.05 * log10(1.0 + safeVolume)
}

fun calculateDLLMSRCost(shares: List<Double>, b: Double, volume: Double): Double {
    if (shares.isEmpty() || b <= 0.0) return 0.0
    val alpha = calculateVolumeScalingAlpha(volume)
    val sumExp = shares.sumOf { exp(it / b) }
    return alpha * b * ln(sumExp)
}

fun calculateDLLMSRPrice(qI: Double, shares: List<Double>, b: Double): Double {
    if (shares.isEmpty() || b <= 0.0) return 0.0
    val sumExp = shares.sumOf { exp(it / b) }
    return exp(qI / b) / sumExp
}
```

---

## 3. High-Frequency Volatility and Risk Management (GARCH(1,1))

For tracking market volatility indices and determining insurance risk metrics for **MAD Shield**, the platform executes localized **GARCH(1,1)** updating loops:

$$\sigma_{t+1}^2 = \omega + \alpha \cdot \varepsilon_t^2 + \beta \cdot \sigma_t^2$$

### Parameters:
* **$\sigma_{t+1}^2$**: Predicted volatility variance for next time epoch.
* **$\omega$**: Steady-state baseline variance baseline scale (omega).
* **$\alpha$**: Shock multiplier weighting recent market shocks (epsilon squared).
* **$\beta$**: Persistence parameter weighting previous variance.

### Implementation Code (`GambitMath.kt`):
```kotlin
fun garchUpdate(omega: Double, alpha: Double, beta: Double, 
                prevVariance: Double, prevShock: Double): Double {
    val o = if (omega.isNaN() || !omega.isFinite()) 0.01 else omega
    val a = if (alpha.isNaN() || !alpha.isFinite()) 0.1 else alpha
    val b = if (beta.isNaN() || !beta.isFinite()) 0.8 else beta
    val pv = if (prevVariance.isNaN() || !prevVariance.isFinite()) 0.02 else prevVariance
    val ps = if (prevShock.isNaN() || !prevShock.isFinite()) 0.0 else prevShock
    val result = o + a * ps.pow(2) + b * pv
    return if (result.isNaN() || !result.isFinite()) 0.02 else result
}
```

---

## 4. Cosmological Lunar Conviction Alignment

To enforce psychological "lunacy" elements in prediction cycles, the system maps the physical orbit phase to staking yields natively:

$$\text{Lunar Scale} = 1.075 - 0.075 \cdot \cos(2\pi \cdot \phi)$$

Where $\phi$ represents the elapsed fractional phase since the **Immaculate Conception of Conviction** (December 8, 1979):

$$\phi = \frac{(\text{CurrentMs} - \text{EpochMs}) \pmod{2551442877}}{2551442877}$$

This bounds the yield scaling between **$1.00$** (New Moon, $\phi = 0.0$) and **$1.15$** (Full Moon, $\phi = 0.5$).

### Implementation Code (`GambitMath.kt`):
```kotlin
private const val IMMACULATE_CONCEPTION_EPOCH_MS = 313459200000L
private const val LUNAR_CYCLE_MS = 2551442877L // 29.530588853 days

fun getLunarPhaseMultiplier(currentTimeMs: Long): Double {
    val timeDiff = currentTimeMs - IMMACULATE_CONCEPTION_EPOCH_MS
    val phase = (timeDiff.toDouble() % LUNAR_CYCLE_MS) / LUNAR_CYCLE_MS
    val normalizedPhase = if (phase < 0) phase + 1.0 else phase
    return 1.075 - 0.075 * cos(2.0 * PI * normalizedPhase)
}
```

---

## 5. Elomatic PvP Matchmaking and Card Damage Systems

Matches in the PvP **Cull Arena** calculate victory expectancy and update player MMR ratings based on card power differentials, evolution status, and structural deterioration strain:

### Card Victory Probability Prediction:
$$P_{\text{win}} = 0.5 + \frac{\text{Power}_{\text{user}} - \text{Power}_{\text{opp}}}{25000} + 0.06 \cdot (\text{Stage}_{\text{user}} - \text{Level}_{\text{opp}}) + 0.15 \cdot (\text{Wear}_{\text{opp}} - \text{Wear}_{\text{user}})$$

Bounded strictly inside $[0.12, 0.88]$.

### Scoring Rating Updates:
* **Upon Victory:**
  $$\Delta \text{MMR} = K \cdot (1.1 - P_{\text{win}}) \cdot M_{\text{clout}} \cdot E_{\text{stage}} \cdot D_{\text{wear}}$$
* **Upon Defeat:**
  $$\Delta \text{MMR} = \frac{-K \cdot P_{\text{win}}}{1.0 + 0.3 \cdot (\text{Stage}_{\text{user}} - 1)}$$

### Implementation Code (`CullTournamentEngine.kt`):
```kotlin
fun calculateVictoryProbability(userCard: SatiricalCard, opponent: Oppender): Double {
    val powerGapWeight = (userCard.powerLevel - opponent.powerLevel) / 25000.0
    val evolutionAdvantage = (userCard.evolutionStage - opponent.evolutionLevel) * 0.06
    val userDeteriorationPercent = (1.0 - userCard.durability)
    val oppDeteriorationPercent = (1.0 - opponent.durability)
    val healthGapAdvantage = (oppDeteriorationPercent - userDeteriorationPercent) * 0.15

    val baseProb = 0.5 + powerGapWeight + evolutionAdvantage + healthGapAdvantage
    return baseProb.coerceIn(0.12, 0.88)
}
```
