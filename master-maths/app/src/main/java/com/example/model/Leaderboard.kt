package com.example.model

data class LeaderboardUser(
    val userId: String,
    val username: String,
    val madxBalance: Double,
    val successfulWagers: Int,
    val timeOnPlatformHours: Int,
    val satiricalTitle: String = "Market Jester",
    val successfulConvictions: Int = 5,
    val successfulPredictions: Int = 8,
    val successfulLiarDetections: Int = 3,
    val convictionAccuracy: Float = 0.75f,
    val predictionAccuracy: Float = 0.65f,
    val liarMeterAccuracy: Float = 0.82f
)

data class GambitReportRecord(
    val id: String,
    val timestamp: Long,
    val reportText: String,
    val actualOutcome: String? = null,
    val predictedProbability: Float? = null
)
