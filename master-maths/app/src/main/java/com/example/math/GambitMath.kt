package com.example.math

import kotlin.math.*

object GambitMath {
    private const val PHI = 1.6180339887
    private const val PI = 3.1415926535

    // Expanded Dopamine Optimizer: Fibonacci Variable Ratio Reinforcement
    // Extrapolating the sequence to accommodate prolonged user engagement and higher stakes.
    private val EXPANDED_FIBONACCI_REWARDS = listOf(
        0.0, 1.0, 1.0, 2.0, 3.0, 5.0, 8.0, 13.0, 21.0, 34.0, 55.0, 89.0, 144.0, 233.0, 377.0, 610.0
    )

    fun getFibonacciReward(index: Int): Double {
        val safeIndex = index.coerceIn(0, EXPANDED_FIBONACCI_REWARDS.lastIndex)
        return EXPANDED_FIBONACCI_REWARDS[safeIndex]
    }

    /**
     * Maps user metrics such as EvolutionStage, XP, and Social Standing
     * into higher reaches of the Fibonacci scaling curve.
     */
    fun calculateUserDopamineIndex(
        evolutionStage: Int,
        xp: Float, // Assuming 10000+ scaling over time
        socialStanding: Int // Evaluated ELO or similar community ranking
    ): Int {
        var baseIndex = 5 // Start at index 5 -> 5.0 multiplier base
        baseIndex += evolutionStage * 2 // Evolution scaling
        baseIndex += (xp / 1000f).toInt() // Tenure / XP scaling
        baseIndex += max(0, (socialStanding - 1000) / 200) // Rank-based bonus
        
        return baseIndex
    }

    /** The Furnace (Deflationary Logic): B_tx = min((0.01 * V_tx) + (1.00 * Fees), 4.9%) */
    fun calculateFurnaceBurnPercent(volume: Double, fees: Double): Double {
        if (volume <= 0.0) return 0.0
        val burnPercent = ((0.01 * volume) + (1.00 * fees)) / volume * 100.0
        return min(burnPercent, 4.9)
    }

    /** DL-LMSR Volume Scaling Factor: α(V) = 1 + 0.05 * log10(1 + V) */
    fun calculateVolumeScalingAlpha(volume: Double): Double {
        val safeVolume = max(volume, 0.0)
        return 1.0 + 0.05 * log10(1.0 + safeVolume)
    }

    /** DL-LMSR Cost Function: C(q) = α(V) * b * ln(Σ e^(q_i / b)) */
    fun calculateDLLMSRCost(shares: List<Double>, b: Double, volume: Double): Double {
        if (shares.isEmpty() || b <= 0.0) return 0.0
        val alpha = calculateVolumeScalingAlpha(volume)
        val sumExp = shares.sumOf { exp(it / b) }
        return alpha * b * ln(sumExp)
    }

    /** DL-LMSR Spot Price: P_i = e^(q_i / b) / Σ e^(q_j / b) */
    fun calculateDLLMSRPrice(qI: Double, shares: List<Double>, b: Double): Double {
        if (shares.isEmpty() || b <= 0.0) return 0.0
        val sumExp = shares.sumOf { exp(it / b) }
        return exp(qI / b) / sumExp
    }

    /** TeaBag Risk Engine Premium: Φ = Stake * P_win * sqrt(σ^2_{t+1}) * 1.05 */
    fun calculateTeaBagPremium(stake: Double, pWin: Double, variance: Double): Double {
        if (stake <= 0.0 || pWin <= 0.0 || variance <= 0.0) return 0.0
        return stake * pWin * sqrt(variance) * 1.05
    }

    /** Staking Yield Calculation: APY_user = APY_base * (1 + NFT_Clout / 200) */
    fun calculateStakingYield(apyBase: Double, nftClout: Double): Double {
        val safeClout = max(nftClout, 0.0)
        return apyBase * (1.0 + safeClout / 200.0)
    }


    /** Δ_limit = π × M × √S (Delta limit from whitepaper) */
    fun calculateDeltaLimit(stake: Double, multiplier: Double): Double {
        val safeStake = if (stake.isNaN() || !stake.isFinite() || stake < 0.0) 0.0 else stake
        val safeMult = if (multiplier.isNaN() || !multiplier.isFinite()) 1.0 else multiplier
        return PI * safeMult * sqrt(safeStake)
    }

    /** Payout = Base 28.8% Stop-Loss up to Max 40% Cap via interpolation based on premiumTier (0.0 to 1.0) */
    fun calculateShieldPayout(stake: Double, premiumTier: Float = 0f): Double {
        val safeStake = if (stake.isNaN() || !stake.isFinite() || stake < 0.0) 0.0 else stake
        val safeTier = premiumTier.coerceIn(0f, 1f).toDouble()
        val shieldPercentage = 0.288 + safeTier * (0.40 - 0.288)
        return safeStake * shieldPercentage
    }

    /** Softmax allocation: P(S_i) = exp(V_i/τ) / Σ exp(V_j/τ) */
    fun calculateSoftmax(speeds: List<Double>, tau: Float): List<Double> {
        if (speeds.isEmpty()) return emptyList()
        val safeTau = if (tau.isNaN() || tau.isInfinite() || tau < 0.01f) 0.01 else tau.toDouble()
        val vols = speeds.map { max(abs(it / 100.0), 0.05) }
        val exps = vols.map { 
            val exponent = it / safeTau
            exp(exponent.coerceIn(-700.0, 700.0))
        }
        val sum = exps.sum()
        if (sum == 0.0 || sum.isNaN() || sum.isInfinite()) {
            return List(speeds.size) { 1.0 / speeds.size }
        }
        return exps.map { it / sum }
    }

    /** Cobb-Douglas Conviction Score */
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

    /**
     * Calculates the advanced Conviction Score based on historical user accuracy and market volatility indices.
     * Integrates the missing algorithmic logic from the math documentation.
     */
    fun calculateAdvancedConvictionScore(
        timeScaled: Double,
        capitalScaled: Double,
        contributionScaled: Double,
        historicalAccuracy: Double, // User accuracy (e.g., 0.0 to 1.0)
        volatilityIndex: Double,     // Market volatility index (e.g., 10.0 to 90.0)
        nftMult: Double,
        lunarMultiplier: Double = 1.0
    ): Double {
        // Human resolve is scaled up by their historical accuracy premium
        val adjustedContribution = contributionScaled * (0.4 + historicalAccuracy * 1.2)
        
        // Loss aversion weight is stressed by higher volatility indices (volatility discount)
        val volatilityStressFactor = 1.0 / (1.0 + (volatilityIndex / 100.0) * 0.35)
        val adjustedPsych = max(0.1, 1.0 - (volatilityIndex / 100.0) * 0.5) * volatilityStressFactor

        return calculateConviction(
            timeScaled = timeScaled,
            capitalScaled = capitalScaled,
            contributionScaled = adjustedContribution,
            psychScaled = adjustedPsych,
            nftMult = nftMult,
            lunarMultiplier = lunarMultiplier
        )
    }

    // December 8, 1979 (Feast of the Immaculate Conception) - Cosmological anchoring epoch
    private const val IMMACULATE_CONCEPTION_EPOCH_MS = 313459200000L
    private const val LUNAR_CYCLE_MS = 2551442877L // 29.530588853 days

    /**
     * Continuous continuous lunar phase multiplier from 1.0x (New Moon) to 1.15x (Full Moon)
     * Maps cosmic cycles to conviction yields seamlessly underneath the UX.
     */
    fun getLunarPhaseMultiplier(currentTimeMs: Long): Double {
        val timeDiff = currentTimeMs - IMMACULATE_CONCEPTION_EPOCH_MS
        val phase = (timeDiff.toDouble() % LUNAR_CYCLE_MS) / LUNAR_CYCLE_MS
        val normalizedPhase = if (phase < 0) phase + 1.0 else phase
        
        // 1.075 - 0.075 * cos(2 * PI * normalizedPhase)
        // Values range from:
        // New Moon (phase 0)   => 1.075 - 0.075(1) = 1.00
        // Full Moon (phase 0.5)=> 1.075 - 0.075(-1)= 1.15
        return 1.075 - 0.075 * cos(2.0 * PI * normalizedPhase)
    }

    /** Sigmoid cap: d_eff = 5.0 / (1 + exp(-1.0 × (d_raw - 500))) */
    fun sigmoidCap(raw: Double): Double {
        val safeRaw = if (raw.isNaN() || !raw.isFinite()) 500.0 else raw
        return 5.0 / (1.0 + exp(-1.0 * (safeRaw - 500.0).coerceIn(-700.0, 700.0)))
    }
    
    /** GARCH(1,1) Volatility: σ² = ω + α·ε² + β·σ² */
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
}
