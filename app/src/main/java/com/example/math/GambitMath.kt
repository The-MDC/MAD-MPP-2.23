package com.example.math

import kotlin.math.*

object GambitMath {
    private const val PHI = 1.6180339887
    private const val PI = 3.1415926535

    /** Δ_limit = π × M × √S (Delta limit from whitepaper) */
    fun calculateDeltaLimit(stake: Double, multiplier: Double): Double =
        PI * multiplier * sqrt(stake)

    /** Payout = Base 28.8% Stop-Loss up to Max 40% Cap */
    fun calculateShieldPayout(stake: Double, isPremium: Boolean = false): Double {
        val shieldPercentage = if (isPremium) 0.40 else 0.288
        return stake * shieldPercentage
    }

    /** Softmax allocation: P(S_i) = exp(V_i/τ) / Σ exp(V_j/τ) */
    fun calculateSoftmax(speeds: List<Double>, tau: Float): List<Double> {
        val vols = speeds.map { max(abs(it / 100.0), 0.05) }
        val exps = vols.map { exp(it / tau.toDouble()) }
        val sum = exps.sum()
        return exps.map { it / sum }
    }

    /** Cobb-Douglas Conviction Score */
    fun calculateConviction(
        timeScaled: Double,
        capitalScaled: Double,
        contributionScaled: Double,
        psychScaled: Double,
        nftMult: Double
    ): Double {
        val t = timeScaled.pow(1.35)
        val c = capitalScaled.pow(0.75)
        val d = contributionScaled.pow(1.45)
        val p = psychScaled.pow(1.15)
        return t * c * d * p * nftMult
    }

    /** Sigmoid cap: d_eff = 5.0 / (1 + exp(-1.0 × (d_raw - 500))) */
    fun sigmoidCap(raw: Double): Double = 5.0 / (1.0 + exp(-1.0 * (raw - 500.0)))
    
    /** GARCH(1,1) Volatility: σ² = ω + α·ε² + β·σ² */
    fun garchUpdate(omega: Double, alpha: Double, beta: Double, 
                     prevVariance: Double, prevShock: Double): Double {
        return omega + alpha * prevShock.pow(2) + beta * prevVariance
    }
}
