package com.example.model

import com.example.ui.theme.ThemeStyle

data class TrendDataPoint(
    val timestamp: Long,
    val convictionScore: Float,
    val volatilityScore: Float
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
    val isAiChatOpen: Boolean = false
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
    val lockPeriodWeeks: Int = 4
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
    val apyBoost: Double = 0.12
)
