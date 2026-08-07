package com.example.engine

interface GenerativeAIProvider {
    suspend fun fetchSatiricalHeadlines(): List<String>
    suspend fun chatWithPersona(userMessage: String): String
    suspend fun generateCommentaryWithPersona(
        personaName: String,
        marketName: String,
        conviction: String,
        volatility: String
    ): String
}
