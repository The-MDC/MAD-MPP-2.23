package com.example.engine

import kotlin.math.pow
import kotlin.math.sqrt
import kotlin.random.Random

// ========================= GARCH VOLATILITY =========================
class GARCHVolatility {
    private val omega = 0.0001
    private val alpha = 0.05
    private val beta = 0.90
    var volatility = 0.15
        private set

    fun update(shock: Double): Double {
        // Stress-tested GARCH with caps
        volatility = sqrt(omega + alpha * shock.pow(2.0) + beta * volatility.pow(2.0))
        volatility = kotlin.math.min(0.65, kotlin.math.max(0.08, volatility)) // Realistic bounds
        return volatility
    }

    fun getAmplifier(): Double {
        return 1.0 + (0.8 * volatility)
    }
}

// ========================= KALMAN FILTER VOLATILITY =========================
class KalmanFilterVolatility {
    private var estimate = 0.15
    private var errorCovariance = 1.0
    private val processNoise = 0.01
    private val measurementNoise = 0.1

    fun update(shock: Double): Double {
        // Prediction
        val pPredict = errorCovariance + processNoise
        // Update (assuming shock represents observed volatility proxies)
        val kalmanGain = pPredict / (pPredict + measurementNoise)
        estimate = estimate + kalmanGain * (shock - estimate)
        errorCovariance = (1 - kalmanGain) * pPredict

        estimate = kotlin.math.min(0.65, kotlin.math.max(0.08, estimate))
        return estimate
    }
}

// ========================= GARCH OPTIMIZATION =========================
class GARCHOptimizer {
    fun optimizeParameters(shocks: List<Double>): Triple<Double, Double, Double> {
        var bestOmega = 0.0001
        var bestAlpha = 0.05
        var bestBeta = 0.90
        var minError = Double.MAX_VALUE

        val omegas = listOf(0.0001, 0.0005, 0.001)
        val alphas = listOf(0.05, 0.1, 0.15)
        val betas = listOf(0.80, 0.85, 0.90)

        for (o in omegas) {
            for (a in alphas) {
                for (b in betas) {
                    if (a + b >= 1.0) continue // Stationarity condition
                    var vol = 0.15
                    var error = 0.0
                    for (shock in shocks) {
                        val predictedVol = sqrt(o + a * shock.pow(2) + b * vol.pow(2))
                        error += kotlin.math.abs(predictedVol - shock)
                        vol = predictedVol
                    }
                    if (error < minError) {
                        minError = error
                        bestOmega = o
                        bestAlpha = a
                        bestBeta = b
                    }
                }
            }
        }
        return Triple(bestOmega, bestAlpha, bestBeta)
    }
}

data class LiarMeterEvent(
    val text: String,
    val speaker: String,
    val category: String,
    val context: String,
    val viralityScore: Double = 0.75,
    val timestamp: Long
)

data class EconomicImpact(
    val projectedStockMovePct: Double,
    val adRevenueImpactM: Double,
    val confidence: Double
)

data class MarketPlay(
    val type: String,
    val title: String,
    val expectedValue: Double? = null,
    val durationDays: Int,
    val description: String? = null,
    val madconvFormula: String? = null,
    val garchVol: Double? = null
)

data class AnalysisResult(
    val speaker: String,
    val category: String,
    val lieScore: Double,
    val garchVolatility: Double,
    val economicImpact: EconomicImpact,
    val fullRoast: String,
    val markets: List<MarketPlay>,
    val madconvScore: Double
)

class LiarMeterEngine {
    private val garch = GARCHVolatility()
    
    fun extractSpeaker(text: String): String {
        val keywords = listOf("Trudeau", "DiCaprio", "Shein", "Musk", "Trump", "Swift", "Biden", "Harris")
        for (k in keywords) {
            if (text.contains(k, ignoreCase = true)) return k
        }
        return "Viral Entity"
    }

    fun classifyCategory(text: String): String {
        val lowerText = text.lowercase()
        if (listOf("ceo", "company", "brand", "corp").any { lowerText.contains(it) }) {
            return "corporations"
        } else if (listOf("pm", "president", "minister", "mp", "senator").any { lowerText.contains(it) }) {
            return "politicians"
        }
        return "celebrities"
    }

    fun analyzeEvent(event: LiarMeterEvent, roastSeverity: Int = 70, memeHumour: Int = 65): AnalysisResult {
        // GARCH Stress Test
        val shock = kotlin.math.min(1.0, event.viralityScore * 1.4)
        val currentVol = garch.update(shock)
        
        val lieScore = kotlin.math.min(100.0, event.viralityScore * 82 + Random.nextDouble(5.0, 22.0))
        val econImpact = computeEconomicImpact(lieScore, event, currentVol)
        
        val roastPrompt = buildRoastPrompt(event, lieScore, roastSeverity, memeHumour)
        // Note: For full Gemini integration we would call the generative model API here using roastPrompt.
        val roast = "[Gemini Fallback - Roast Severity: $roastSeverity] High-severity roast fallback activated. This statement just vaporized millions in shareholder value while preaching integrity."
        
        val markets = generateMarkets(econImpact, event, currentVol)
        
        return AnalysisResult(
            speaker = event.speaker,
            category = event.category,
            lieScore = Math.round(lieScore * 10.0) / 10.0,
            garchVolatility = Math.round(currentVol * 10000.0) / 100.0,
            economicImpact = econImpact,
            fullRoast = roast,
            markets = markets,
            madconvScore = Math.round((lieScore * (1 + currentVol) * 0.85) * 10.0) / 10.0
        )
    }

    private fun buildRoastPrompt(event: LiarMeterEvent, lieScore: Double, severity: Int, humour: Int): String {
        val intensity = if (severity > 75) "nuclear" else "savage"
        val humourStyle = if (humour > 70) "maximum chaos" else "balanced dark humour"
        return "Write a $intensity satirical roast in South Park + Dave Chappelle + Onion style. " +
                "Target: ${event.speaker} - \"${event.text.take(160)}...\" " +
                "Lie Meter: ${Math.round(lieScore*10.0)/10.0}/100. Use $humourStyle. Tie heavily to economic damage."
    }

    private fun computeEconomicImpact(lieScore: Double, event: LiarMeterEvent, vol: Double): EconomicImpact {
        return EconomicImpact(
            projectedStockMovePct = Math.round((lieScore * vol * 0.021) * 100.0) / 100.0,
            adRevenueImpactM = Math.round((lieScore * vol * 1.1) * 10.0) / 10.0,
            confidence = Math.round((58 + lieScore * 0.32) * 10.0) / 10.0
        )
    }

    private fun generateMarkets(impact: EconomicImpact, event: LiarMeterEvent, vol: Double): List<MarketPlay> {
        val duration = 75
        return listOf(
            MarketPlay(
                type = "Continuous",
                title = "GARCH-Adjusted Volatility Impact — ${event.speaker}",
                expectedValue = impact.projectedStockMovePct,
                durationDays = duration
            ),
            MarketPlay(
                type = "OverUnder",
                title = "Ad Revenue Loss > $${impact.adRevenueImpactM}M in $duration days?",
                durationDays = duration
            ),
            MarketPlay(
                type = "Conviction_Saga",
                title = "Multi-Leg MADConv Saga: ${event.speaker}",
                durationDays = duration,
                madconvFormula = "t^1.35 × c^0.75 × d^1.45 × ψ^1.15 × (1+π^0.9) × liar_bonus × garch_amp",
                garchVol = Math.round(vol * 1000.0) / 10.0
            )
        )
    }
}
