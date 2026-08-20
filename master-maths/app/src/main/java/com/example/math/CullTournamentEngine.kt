package com.example.math

import com.example.model.CardRarity
import com.example.model.SatiricalCard
import java.util.UUID

/**
 * CullTournamentEngine manages PvP matchmaking queues and calculates
 * conviction updates based on card attributes (EvolutionLevel / Stage,
 * Durability, Power, and Rarity).
 */
object CullTournamentEngine {

    enum class QueueStatus {
        IDLE, QUEUED, MATCHING, MATCH_FOUND, ROUND_ACTIVE, FINISHED
    }

    data class Oppender(
        val name: String,
        val cardName: String,
        val powerLevel: Int,
        val evolutionLevel: Int,
        val durability: Double,
        val rating: Int
    )

    /**
     * Matchmaking Generator targets competent rivals with compatible MMR scoring.
     */
    fun searchOpponent(userRating: Int): Oppender {
        val bots = listOf(
            "CryptoSovereignNode-9005",
            "DegenArbitrageur-4011",
            "MadMemeHoarder-1002",
            "GaryGenslerAlpha-007",
            "SBFClone-005",
            "LiquidatorDungeonMaster-4",
            "WallStreetOracleNode-101",
            "SatoshiGravelGhost-99"
        )
        val candidateNames = listOf("Pepe", "Dogecoin Elite", "Shiba Overlord", "Liar Sentinel", "PR Disaster", "Clown King")
        
        return Oppender(
            name = bots.random(),
            cardName = "★ " + candidateNames.random() + " BOT MATCH",
            powerLevel = (userRating * 4 + (2000..6000).random()).coerceIn(2000, 15000),
            evolutionLevel = (1..3).random(),
            durability = 0.3 + Math.random() * 0.7,
            rating = (userRating - 150..userRating + 180).random().coerceAtLeast(100)
        )
    }

    /**
     * Calculates the probability of victory based on power levels, card evolution status, and structural integrity.
     */
    fun calculateVictoryProbability(
        userCard: SatiricalCard,
        opponent: Oppender
    ): Double {
        val powerGapWeight = (userCard.powerLevel - opponent.powerLevel) / 25000.0
        // Evolution level adds 6% win advantage per stage
        val evolutionAdvantage = (userCard.evolutionStage - opponent.evolutionLevel) * 0.06
        // Deteriorated card (low durability) incurs serious performance degradation
        val userDeteriorationPercent = (1.0 - userCard.durability)
        val oppDeteriorationPercent = (1.0 - opponent.durability)
        val healthGapAdvantage = (oppDeteriorationPercent - userDeteriorationPercent) * 0.15

        val baseProb = 0.5 + powerGapWeight + evolutionAdvantage + healthGapAdvantage
        return baseProb.coerceIn(0.12, 0.88)
    }

    /**
     * Precise mathematical scoring function calculating Elo and conviction rating updates.
     * Higher evolution level yields amplified conviction and shields from penalty,
     * while deterioration percent impacts rewards severely.
     */
    fun calculateScores(
        userCard: SatiricalCard,
        opponent: Oppender,
        isVictory: Boolean,
        winProbability: Double
    ): TournamentScoreResult {
        val baseK = 32
        
        // Clout & APY multipliers boost rewards
        val multiplierAmplify = 1.0 + (userCard.cloutMultiplier * 0.1) + userCard.apyBoost
        
        // Evolution Level (Stage) mitigation/amplification
        val evolutionAmplifyFactor = when (userCard.evolutionStage) {
            2 -> 1.25 // Elite
            3 -> 1.50 // Supreme Ascended
            else -> 1.00
        }

        // Deterioration penalty
        val deteriorationPercent = (1.0 - userCard.durability) * 100.0
        val repairDeductionRisk = if (deteriorationPercent > 50.0) 0.6 else 1.0 // 40% performance reward cut if highly damaged

        val scoreChange = if (isVictory) {
            val baseReward = baseK * (1.1 - winProbability)
            val amplifiedReward = baseReward * multiplierAmplify * evolutionAmplifyFactor * repairDeductionRisk
            amplifiedReward.toInt().coerceAtLeast(10)
        } else {
            val baseLoss = -baseK * winProbability
            // Evolution level shields from losing massive ratings
            val shieldedLoss = baseLoss / (1.0 + (userCard.evolutionStage - 1) * 0.3)
            shieldedLoss.toInt().coerceAtMost(-4)
        }

        // Calculate dynamic reward payout
        val basePayout = if (isVictory) 180.0 else 25.0
        val paidRewards = (basePayout * userCard.cloutMultiplier * evolutionAmplifyFactor * repairDeductionRisk).coerceAtLeast(15.0)
        
        // Structural damage strain inflicted based on fight severity
        val strainInflicted = if (isVictory) {
            0.04 + Math.random() * 0.06
        } else {
            0.11 + Math.random() * 0.11
        }

        return TournamentScoreResult(
            ratingDelta = scoreChange,
            madxPayout = paidRewards,
            integrityDeteriorationStrain = strainInflicted,
            summaryOfMath = "Win Rate Expectancy was ${(winProbability * 100).toInt()}% based on Power and Evolution level. " +
                "Stage ${userCard.evolutionStage} yielded highly tuned ${"%.2f".format(evolutionAmplifyFactor)}x rating factor. " +
                "Damage status (${"%.0f".format(deteriorationPercent)}% wear) applied a ${"%.1f".format(repairDeductionRisk)}x scale."
        )
    }
}

data class TournamentScoreResult(
    val ratingDelta: Int,
    val madxPayout: Double,
    val integrityDeteriorationStrain: Double,
    val summaryOfMath: String
)
