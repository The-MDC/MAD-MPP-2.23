package com.example.math

import kotlin.math.*

object GambitMath {
    private const val PHI = 1.6180339887
    private const val PI = 3.1415926535

    /** Δ_limit = π × M × √S (Delta limit from whitepaper) */
    fun calculateDeltaLimit(stake: Double, multiplier: Double): Double {
        val safeStake = if (stake.isNaN() || !stake.isFinite() || stake < 0.0) 0.0 else stake
        val safeMult = if (multiplier.isNaN() || !multiplier.isFinite()) 1.0 else multiplier
        return PI * safeMult * sqrt(safeStake)
    }

    /** Payout = Base 28.8% Stop-Loss up to Max 40% Cap */
    fun calculateShieldPayout(stake: Double, isPremium: Boolean = false): Double {
        val safeStake = if (stake.isNaN() || !stake.isFinite() || stake < 0.0) 0.0 else stake
        val shieldPercentage = if (isPremium) 0.40 else 0.288
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
        nftMult: Double
    ): Double {
        val t = max(timeScaled, 0.0).pow(1.35)
        val c = max(capitalScaled, 0.0).pow(0.75)
        val d = max(contributionScaled, 0.0).pow(1.45)
        val p = max(psychScaled, 0.0).pow(1.15)
        val m = if (nftMult.isNaN() || !nftMult.isFinite()) 1.0 else nftMult
        val result = t * c * d * p * m
        return if (result.isNaN() || !result.isFinite()) 0.0 else result
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
