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
        buzzScore: Double // 0.0 to 100.0 from an Oracle
    ): SatiricalCard? {
        // SECURITY TIER: Sanitize oracle inputs
        val safeBuzzScore = buzzScore.coerceIn(5.0, 95.0) // Maintain mathematical house edge, never 100% win or 0% win.
        if (card.evolutionStage >= 3) return card // Hard cap preventing infinite scaling exploits
        
        val vrfResult = Random.nextDouble(0.0, 100.0)
        
        return if (vrfResult < safeBuzzScore) {
            // Success: Mint Tier + 1
            card.copy(
                powerLevel = kotlin.math.min((card.powerLevel * 1.5).toInt(), 9999), // Strict attribute cap
                cloutMultiplier = kotlin.math.min(card.cloutMultiplier + 0.5, 5.0),
                evolutionStage = kotlin.math.min(card.evolutionStage + 1, 3), // Max stage 3
                durability = 1.0 // Restore durability
            )
        } else {
            // Failure: Burn asset
            null
        }
    }
}
