package com.example.analytics

import android.util.Log

/**
 * Analytics tracking module to log user interactions with the conviction wager interface,
 * helping to measure engagement with prediction market features.
 */
object AnalyticsTracker {
    private const val TAG = "GAMBIT_ANALYTICS"

    fun logInteraction(eventName: String, parameters: Map<String, Any> = emptyMap()) {
        val paramsString = parameters.entries.joinToString(separator = ", ") { "${it.key}=${it.value}" }
        Log.d(TAG, "Event: $eventName | Params: [$paramsString]")
        // In a real application, we would push this to a remote analytics service (e.g. Firebase, Mixpanel)
    }

    fun logWagerPlaced(
        scenarioId: String,
        amount: Double,
        currency: String,
        convictionMultiplier: Double,
        predictedOutcome: String
    ) {
        logInteraction(
            "wager_placed",
            mapOf(
                "scenario_id" to scenarioId,
                "amount" to amount,
                "currency" to currency,
                "conviction_multiplier" to convictionMultiplier,
                "predicted_outcome" to predictedOutcome
            )
        )
    }

    fun logMarketViewed(scenarioId: String, scenarioTitle: String) {
        logInteraction(
            "market_viewed",
            mapOf(
                "scenario_id" to scenarioId,
                "scenario_title" to scenarioTitle
            )
        )
    }

    fun logChaosMeterAdjusted(newValue: Float) {
        logInteraction(
            "chaos_meter_adjusted",
            mapOf(
                "chaos_value" to newValue
            )
        )
    }
    
    fun logDopamineRewardClaimed(rewardId: String, amount: Int) {
        logInteraction(
            "dopamine_reward_claimed",
            mapOf(
                "reward_id" to rewardId,
                "amount" to amount
            )
        )
    }
}
