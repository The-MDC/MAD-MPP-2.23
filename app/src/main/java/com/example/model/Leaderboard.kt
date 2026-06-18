package com.example.model

data class LeaderboardUser(
    val userId: String,
    val username: String,
    val madxBalance: Double,
    val successfulWagers: Int,
    val timeOnPlatformHours: Int
)

data class GambitReportRecord(
    val id: String,
    val timestamp: Long,
    val reportText: String,
    val actualOutcome: String? = null,
    val predictedProbability: Float? = null
)
