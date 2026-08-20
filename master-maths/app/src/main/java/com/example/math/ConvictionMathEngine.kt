package com.example.math

import kotlin.math.exp

object ConvictionMathEngine {
    
    interface DecayAlertSubscriber {
        fun onDecayAlert(assetName: String, decayFactor: Double, commentary: String)
    }

    interface DecayEventListener {
        fun onCriticalDecay(
            assetName: String,
            alpha: Double,
            t: Double,
            decayFactor: Double,
            threshold: Double,
            satiricalMeme: String
        )
    }

    private val subscribers = mutableListOf<DecayAlertSubscriber>()
    private val eventListeners = mutableListOf<DecayEventListener>()

    fun subscribe(subscriber: DecayAlertSubscriber) {
        synchronized(subscribers) {
            if (!subscribers.contains(subscriber)) {
                subscribers.add(subscriber)
            }
        }
    }

    fun unsubscribe(subscriber: DecayAlertSubscriber) {
        synchronized(subscribers) {
            subscribers.remove(subscriber)
        }
    }

    fun registerEventListener(listener: DecayEventListener) {
        synchronized(eventListeners) {
            if (!eventListeners.contains(listener)) {
                eventListeners.add(listener)
            }
        }
    }

    fun unregisterEventListener(listener: DecayEventListener) {
        synchronized(eventListeners) {
            eventListeners.remove(listener)
        }
    }

    /**
     * Calculates the continuous temporal decay factor: e^(-alpha * t)
     * Coerces inputs for mathematical safety.
     */
    fun calculateTemporalDecay(alpha: Double, t: Double): Double {
        val safeAlpha = if (alpha.isNaN() || !alpha.isFinite()) 0.1 else alpha.coerceAtLeast(0.0)
        val safeT = if (t.isNaN() || !t.isFinite()) 0.0 else t.coerceAtLeast(0.0)
        val exponent = (-safeAlpha * safeT).coerceIn(-700.0, 700.0)
        return exp(exponent)
    }

    /**
     * Calculates the continuous stochastic temporal decay factor:
     * e^(-(alpha + 0.5 * sigma^2) * t + sigma * W_t)
     * where W_t is a Wiener process sample.
     */
    fun calculateStochasticDecay(alpha: Double, t: Double, sigma: Double, seed: Long? = null): Double {
        val safeAlpha = if (alpha.isNaN() || !alpha.isFinite()) 0.1 else alpha.coerceAtLeast(0.0)
        val safeT = if (t.isNaN() || !t.isFinite()) 0.0 else t.coerceAtLeast(0.0)
        val safeSigma = if (sigma.isNaN() || !sigma.isFinite()) 0.05 else sigma.coerceAtLeast(0.0)
        
        if (safeT <= 0.0) return 1.0
        val random = if (seed != null) java.util.Random(seed) else java.util.Random()
        val wT = random.nextGaussian() * kotlin.math.sqrt(safeT)
        val exponent = (-(safeAlpha + 0.5 * safeSigma * safeSigma) * safeT + safeSigma * wT).coerceIn(-700.0, 700.0)
        return exp(exponent).coerceIn(0.0, 1.0)
    }

    /**
     * Calculates the conviction growth ratio: 1 - e^(-alpha * t)
     */
    fun calculateConvictionGrowth(alpha: Double, t: Double): Double {
        return (1.0 - calculateTemporalDecay(alpha, t)).coerceIn(0.0, 1.0)
    }

    /**
     * Calculates the Kelly Criterion allocation fraction: f* = (p * b - (1 - p)) / b
     * Supporting fractional scaling to safeguard capital.
     */
    fun calculateKellyAllocation(
        winProbability: Double,
        netOdds: Double, // Net payout ratio (e.g., if a bet pays 2 to 1, netOdds = 2.0)
        fraction: Double = 1.0
    ): Double {
        val p = if (winProbability.isNaN() || !winProbability.isFinite()) 0.5 else winProbability.coerceIn(0.0, 1.0)
        val netOddsSafe = if (netOdds.isNaN() || !netOdds.isFinite() || netOdds <= 0.0) 1.0 else netOdds
        val scale = if (fraction.isNaN() || !fraction.isFinite()) 1.0 else fraction.coerceIn(0.0, 1.0)
        
        val q = 1.0 - p
        val rawKelly = (p * netOddsSafe - q) / netOddsSafe
        return (rawKelly * scale).coerceIn(0.0, 1.0)
    }

    /**
     * High-precision, highly optimized implementation of the Kelly Criterion using BigDecimal.
     * Prevents floating point accumulation errors during recursive portfolio simulations.
     */
    fun calculateKellyAllocationBigDecimal(
        winProbability: java.math.BigDecimal,
        netOdds: java.math.BigDecimal,
        fraction: java.math.BigDecimal = java.math.BigDecimal.ONE
    ): java.math.BigDecimal {
        val p = winProbability.coerceIn(java.math.BigDecimal.ZERO, java.math.BigDecimal.ONE)
        val odds = if (netOdds.compareTo(java.math.BigDecimal.ZERO) <= 0) java.math.BigDecimal.ONE else netOdds
        val scale = fraction.coerceIn(java.math.BigDecimal.ZERO, java.math.BigDecimal.ONE)
        
        val q = java.math.BigDecimal.ONE.subtract(p)
        val numerator = p.multiply(odds).subtract(q)
        
        val rawKelly = if (odds.compareTo(java.math.BigDecimal.ZERO) == 0) {
            java.math.BigDecimal.ZERO
        } else {
            numerator.divide(odds, 18, java.math.RoundingMode.HALF_UP)
        }
        val result = rawKelly.multiply(scale)
        return result.coerceIn(java.math.BigDecimal.ZERO, java.math.BigDecimal.ONE)
    }

    /**
     * Calculates quadratic pooling matching funds given a list of individual member contributions.
     * Matching = (sum(sqrt(c_i)))^2 - sum(c_i)
     */
    fun calculateQuadraticMatching(contributions: List<Double>): Double {
        if (contributions.isEmpty()) return 0.0
        val sumOfRoots = contributions.sumOf { 
            val valSafe = if (it.isNaN() || !it.isFinite()) 0.0 else it.coerceAtLeast(0.0)
            kotlin.math.sqrt(valSafe) 
        }
        val squaredSum = sumOfRoots * sumOfRoots
        val directSum = contributions.sumOf { if (it.isNaN() || !it.isFinite()) 0.0 else it.coerceAtLeast(0.0) }
        return (squaredSum - directSum).coerceAtLeast(0.0)
    }

    /**
     * High-precision implementation of quadratic matching funds using BigDecimal.
     * Eliminates compounding errors across large numbers of micro-contributions.
     */
    fun calculateQuadraticMatchingBigDecimal(contributions: List<java.math.BigDecimal>): java.math.BigDecimal {
        if (contributions.isEmpty()) return java.math.BigDecimal.ZERO
        var sumOfRoots = java.math.BigDecimal.ZERO
        var directSum = java.math.BigDecimal.ZERO
        
        val mc = java.math.MathContext(34, java.math.RoundingMode.HALF_UP)
        
        for (c in contributions) {
            val cSafe = if (c.compareTo(java.math.BigDecimal.ZERO) < 0) java.math.BigDecimal.ZERO else c
            val root = bigDecimalSqrt(cSafe, mc)
            sumOfRoots = sumOfRoots.add(root)
            directSum = directSum.add(cSafe)
        }
        val squaredSum = sumOfRoots.multiply(sumOfRoots, mc)
        val matching = squaredSum.subtract(directSum, mc)
        return if (matching.compareTo(java.math.BigDecimal.ZERO) < 0) java.math.BigDecimal.ZERO else matching
    }

    private fun bigDecimalSqrt(value: java.math.BigDecimal, mc: java.math.MathContext): java.math.BigDecimal {
        if (value.compareTo(java.math.BigDecimal.ZERO) <= 0) return java.math.BigDecimal.ZERO
        var x = java.math.BigDecimal(kotlin.math.sqrt(value.toDouble()), mc)
        val two = java.math.BigDecimal("2")
        for (i in 0..5) {
            val nextX = value.divide(x, mc).add(x, mc).divide(two, mc)
            if (nextX.subtract(x).abs().compareTo(java.math.BigDecimal("1E-15")) < 0) {
                x = nextX
                break
            }
            x = nextX
        }
        return x
    }

    private fun java.math.BigDecimal.coerceIn(min: java.math.BigDecimal, max: java.math.BigDecimal): java.math.BigDecimal {
        if (this.compareTo(min) < 0) return min
        if (this.compareTo(max) > 0) return max
        return this
    }

    /**
     * Calculates the votes received for a given amount of voting credits in a quadratic voting system.
     * votes = sqrt(credits)
     */
    fun calculateQuadraticVotes(credits: Double): Double {
        val creditsSafe = if (credits.isNaN() || !credits.isFinite()) 0.0 else credits.coerceAtLeast(0.0)
        return kotlin.math.sqrt(creditsSafe)
    }

    /**
     * Generates simulated curve data points for a set of intervals.
     * Returns a list of pairs where first is growth ratio (0 to 1) and second is decay factor (0 to 1).
     */
    fun generateSimulatedIntervals(alpha: Double, totalIntervals: Int): List<Pair<Double, Double>> {
        return List(totalIntervals + 1) { i ->
            val t = i.toDouble()
            val decay = calculateTemporalDecay(alpha, t)
            val growth = calculateConvictionGrowth(alpha, t)
            Pair(growth, decay)
        }
    }

    /**
     * Aggregates the user's current portfolio decay trends into a concise clean smart summary string,
     * specifically formatted for the MADHAT'r Agent's Gemini API prompt input and outputs.
     */
    fun summarizeMarketState(
        madxBalance: Double,
        stakedBalance: Double,
        activePositions: List<Pair<String, Double>>, // Asset name and its current decay rate alpha
        timeElapsed: Double
    ): String {
        val totalAssets = activePositions.size
        val builder = java.lang.StringBuilder()
        builder.append("=== PORTFOLIO DECAY SUMMARY (INPUT FOR MADHAT'R AGENT) ===\n")
        builder.append("BALANCES: Liquid = $madxBalance MADX | Staked = $stakedBalance MADX\n")
        builder.append("ACTIVE POSITIONS ELAPSED TIME: $timeElapsed units\n")
        
        var criticalDecayCount = 0
        activePositions.forEach { (asset, alpha) ->
            val decay = calculateTemporalDecay(alpha, timeElapsed)
            val percentageStr = String.format("%.2f%%", decay * 100)
            builder.append("  * Asset: $asset | Decay alpha = $alpha | Intact Conviction Value = $percentageStr\n")
            if (decay < 0.5) {
                criticalDecayCount++
            }
        }
        
        val riskLabel = if (criticalDecayCount > 0) {
            "CRITICAL EXPOSURE (High Volatility Triggered)"
        } else if (activePositions.isEmpty()) {
            "ZERO CONVICTION EXPOSURE (No active bets)"
        } else {
            "STABLE HOLDINGS (Top-Hat approved)"
        }
        
        builder.append("CONVICTION METRIC STATUS: $riskLabel\n")
        builder.append("==============================================================")
        return builder.toString()
    }

    // Adaptive Notification Service state
    private val portfolioValueHistory = mutableListOf<Double>()
    private const val MAX_HISTORY_SIZE = 20
    private var baseAlertThreshold = 0.50
    
    // Scaling sensitivity for adaptive alerts
    private const val VOLATILITY_SENSITIVITY = 0.8
    private const val BASELINE_VOLATILITY = 0.15

    init {
        synchronized(portfolioValueHistory) {
            for (i in 0 until 10) {
                portfolioValueHistory.add(100.0 + kotlin.random.Random.nextDouble(-5.0, 5.0))
            }
        }
    }

    fun addPortfolioValueSnapshot(value: Double) {
        synchronized(portfolioValueHistory) {
            portfolioValueHistory.add(value)
            if (portfolioValueHistory.size > MAX_HISTORY_SIZE) {
                portfolioValueHistory.removeAt(0)
            }
        }
    }

    fun calculateHistoricalVolatility(): Double {
        synchronized(portfolioValueHistory) {
            if (portfolioValueHistory.size < 2) return BASELINE_VOLATILITY
            
            // Calculate standard deviation of percentage changes
            val returns = mutableListOf<Double>()
            for (i in 1 until portfolioValueHistory.size) {
                val prev = portfolioValueHistory[i - 1]
                if (prev != 0.0) {
                    returns.add((portfolioValueHistory[i] - prev) / prev)
                }
            }
            if (returns.isEmpty()) return BASELINE_VOLATILITY
            
            val mean = returns.average()
            val variance = returns.map { (it - mean) * (it - mean) }.sum() / returns.size
            val computed = kotlin.math.sqrt(variance)
            return if (computed.isNaN() || !computed.isFinite()) BASELINE_VOLATILITY else computed
        }
    }

    fun getAdaptiveThreshold(baseThreshold: Double = baseAlertThreshold): Double {
        val vol = calculateHistoricalVolatility()
        // If volatility is lower than baseline, we reduce the threshold to minimize noisy alerts.
        // If volatility is high, we scale it up to be more defensive.
        val adjustment = 1.0 + VOLATILITY_SENSITIVITY * (vol - BASELINE_VOLATILITY)
        val adaptive = baseThreshold * adjustment
        return adaptive.coerceIn(0.20, 0.80)
    }

    /**
     * Check current decay factor against a threshold and trigger alerts if it drops below threshold.
     */
    fun checkDecayAlerts(assetName: String, alpha: Double, t: Double, threshold: Double) {
        val adaptiveThreshold = getAdaptiveThreshold(threshold)
        val decayFactor = calculateTemporalDecay(alpha, t)
        val formattedDecay = String.format("%.4f", decayFactor)
        
        val commentaries = listOf(
            "Listen kid, your '$assetName' is decaying faster than a lying politician's promise on election night! Down to $formattedDecay already. Grab a Top-Hat and focus!",
            "Whoa, whoa, look at '$assetName' slippin'! Decay is at $formattedDecay. This is some woke-tier paper hands nonsense, alright? My grandmother holds positions better than this!",
            "Ay! Fuhgeddaboudit! Your '$assetName' decay is at $formattedDecay. I've seen better support on a cheap knock-off Fedora. Real MADdegens hold with CONVICTION!",
            "Look here, buddy: '$assetName' is melting like ice cream in Jersey July at $formattedDecay. Get your act together or Jamie Burke's gonna write a sad ballad about you!"
        )
        val commentary = commentaries[kotlin.math.abs(assetName.hashCode()) % commentaries.size]

        if (decayFactor < adaptiveThreshold) {
            // Trigger subscribers
            val targets = synchronized(subscribers) { subscribers.toList() }
            targets.forEach { it.onDecayAlert(assetName, decayFactor, commentary) }

            // Trigger event listeners
            val listeners = synchronized(eventListeners) { eventListeners.toList() }
            listeners.forEach { 
                it.onCriticalDecay(assetName, alpha, t, decayFactor, adaptiveThreshold, commentary)
            }
        }
    }
}

