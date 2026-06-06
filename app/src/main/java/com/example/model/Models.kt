package com.example.model

import com.example.ui.theme.ThemeStyle

data class TrendDataPoint(
    val timestamp: Long,
    val convictionScore: Float,
    val volatilityScore: Float
)

data class HighStakesActivity(
    val id: String = "",
    val timestamp: Long = 0L,
    val eventName: String = "",
    val text: String = "",
    val amount: Double = 0.0,
    val speedBoost: Double = 0.0,
    val type: String = "BET" // BET, LIQUIDATION, MASSIVE_SHIFT, ORACLE_ALERT
)

data class AuthState(
    val isAuthenticated: Boolean = false,
    val authType: String = "GUEST", // "GUEST", "GOOGLE", "0-AUTH"
    val username: String = "Anonymous",
    val email: String = "none@domain.com"
)

data class NeuralTelemetryStats(
    val sentimentMetric: Float = 89.4f,
    val cognitiveLoad: Float = 0.72f,
    val sybilAttacksDeflected: Int = 4210,
    val networkSpeedGbps: Double = 98.4,
    val dynamicConfidence: Float = 0.941f,
    val volatilityIndex: Float = 55.4f
)

data class MarketState(
    val activeScenarios: List<Scenario> = emptyList(),
    val dynamicPackPrice: Double = 100.0,
    val eigenTrustLogs: List<String> = emptyList(),
    val xp: Float = 0f,
    val madxBalance: Double = 10000.0,
    val sentimentPhase: SentimentPhase = SentimentPhase.EUPHORIA,
    val temperature: Float = 1.0f,
    val allocations: List<Double> = emptyList(),
    val ownedCards: List<SatiricalCard> = emptyList(),
    val currentTheme: ThemeStyle = ThemeStyle.LUX_MAT_PLASMA,
    val trendHistory: List<TrendDataPoint> = emptyList(),
    val isAiChatOpen: Boolean = false,
    val bookmarkedScenarioIds: Set<String> = emptySet(),
    val isOfflineCache: Boolean = false,
    val highStakesFeed: List<HighStakesActivity> = emptyList(),
    val authState: AuthState = AuthState(),
    val sagaProgress: List<SagaProgressEntity> = emptyList(),
    val evolutionHistory: List<CardEvolutionHistoryEntity> = emptyList(),
    val currentPerformanceRating: Int = 1000,
    val isTournamentQueueActive: Boolean = false,
    val telemetryStats: NeuralTelemetryStats = NeuralTelemetryStats(),
    
    // Liar Meter state
    val liarMeterResult: com.example.engine.AnalysisResult? = null,
    val isLiarMeterAnalyzing: Boolean = false,
    val liarMeterError: String? = null,
    
    // Satirical Daily Forecast state
    val dailyForecastText: String? = null,
    val isDailyForecastLoading: Boolean = false,
    val dailyForecastError: String? = null,
    val forecastWeatherInput: String = "Nuclear Heatwave of Searing Disappointment",
    val forecastAnticsInput: String = "Protesting inflation by organizing private yacht regattas for climate justice",
    val forecastScandalInput: String = "Politician caught using artificial intelligence chat bot to write sympathy letters"
)

enum class MarketType {
    BINARY, OVER_UNDER, PROGRESSIVE, MULTI_OUTCOME
}

data class Scenario(
    val id: String,
    val name: String,
    val tag: String,
    val crowdConvictionSpeed: Double,
    val baseMultiplier: Double,
    val isHot: Boolean = false,
    val marketType: MarketType = MarketType.BINARY,
    val targetValue: Double? = null,
    val currentMetricValue: Double? = null,
    val isCreatorMode: Boolean = false,
    val gildedConvictionReserve: Double = 12000.0,
    val socialTwitterImpressions: Long = 450000L,
    val sentimentBullishRatio: Double = 0.72,
    val psychographicCoreBias: String = "Herd Mentality",
    val lockPeriodWeeks: Int = 4,
    val category: String = "Crypto"
)

enum class SentimentPhase(val display: String) {
    EUPHORIA("EUPHORIA"), 
    PANIC("PANIC"), 
    DENIAL("DENIAL"), 
    ACCUMULATION("ACCUMULATION")
}

enum class CardRarity(val color: Long, val display: String) {
    COMMON(0xFF8A9BB5, "Common"), 
    UNCOMMON(0xFF4CAF50, "Uncommon"), 
    RARE(0xFF2196F3, "Rare"), 
    EPIC(0xFF9C27B0, "Epic"), 
    LEGENDARY(0xFFFFD700, "Legendary"),
    GOLDEN(0xFFFF6B35, "Golden Hand"),
    MYTHIC(0xFFFF2D78, "Mythic 1-of-1")
}

data class SatiricalCard(
    val id: Int,
    val name: String,
    val rarity: CardRarity,
    val powerLevel: Int,
    val faction: String,
    val flavorText: String,
    val cloutMultiplier: Double = 1.0,
    val edgeMultiplier: Double = 1.0,
    val apyBoost: Double = 0.12,
    val durability: Double = 1.0, // 0.0 to 1.0 representing deterioration/damage
    val evolutionStage: Int = 1,  // 1 = Standard, 2 = Evolved, 3 = Ascended/Transcended
    val earnsCount: Double = 0.0  // Accumulated $MADx earnings from campaigns/arena
)
