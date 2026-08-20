package com.example.engine

import com.example.model.SatiricalCard
import kotlin.random.Random

object EvolutionEngine {

    /**
     * Integrates theoretical Chainlink VRF and BuzzScore logic for card evolution and burning.
     * If Random < BuzzScore, the evolution succeeds (Mint Tier + 1).
     * If Random >= BuzzScore, the assets are burned (Returns null to indicate destruction).
     */
    fun attemptEvolution(
        card: SatiricalCard,
        buzzScore: Double, // 0.0 to 100.0 from an Oracle
        volatilityIndex: Double = 50.0 // from TelemetryStats
    ): SatiricalCard? {
        // SECURITY TIER: Sanitize oracle inputs
        val safeBuzzScore = buzzScore.coerceIn(5.0, 95.0) // Maintain mathematical house edge
        val safeVol = volatilityIndex.coerceIn(10.0, 90.0)
        
        if (card.evolutionStage >= 3) return card // Hard cap preventing infinite scaling exploits
        
        // Dynamic success threshold incorporating Fibonacci & GARCH Volatility Factor
        val fibReward = com.example.math.GambitMath.getFibonacciReward(card.evolutionStage + 4)
        val volFactor = 1.0 + ((safeVol - 50.0) / 100.0) // 0.6x to 1.4x modifier
        
        val requiredThreshold = (100.0 - safeBuzzScore) * volFactor
        val vrfResult = Random.nextDouble(0.0, 100.0) + fibReward
        
        return if (vrfResult > requiredThreshold) {
            // Success: Mint Tier + 1
            card.copy(
                powerLevel = kotlin.math.min((card.powerLevel * 1.5 * volFactor).toInt(), 9999),
                cloutMultiplier = kotlin.math.min(card.cloutMultiplier + (0.5 * volFactor), 5.0),
                evolutionStage = kotlin.math.min(card.evolutionStage + 1, 3), // Max stage 3
                durability = 1.0, // Restore durability
                earnsCount = card.earnsCount + fibReward * 10.0 // Add Dopamine Fibonacci payload
            )
        } else {
            // Failure: Burn asset due to high volatility / weak conviction
            null
        }
    }
}
