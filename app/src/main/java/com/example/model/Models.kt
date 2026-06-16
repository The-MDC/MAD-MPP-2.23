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
    val type: String = "BET", // BET, LIQUIDATION, MASSIVE_SHIFT, ORACLE_ALERT
    val scenarioId: String = "",
    val outcome: String = "YES"
)

data class AuthState(
    val isAuthenticated: Boolean = false,
    val authType: String = "GUEST", // "GUEST", "GOOGLE", "0-AUTH", "WEB3"
    val username: String = "",
    val email: String = "none@domain.com",
    val walletAddress: String? = null,
    val isAdmin: Boolean = false
)

data class NeuralTelemetryStats(
    val sentimentMetric: Float = 89.4f,
    val cognitiveLoad: Float = 0.72f,
    val sybilAttacksDeflected: Int = 4210,
    val networkSpeedGbps: Double = 98.4,
    val dynamicConfidence: Float = 0.941f,
    val volatilityIndex: Float = 55.4f
)

data class UserBet(
    val scenarioId: String,
    val outcome: String, // "YES", "NO", "OVER", "UNDER", etc.
    val amount: Double,
    val hasMadShield: Boolean,
    val shieldPremiumTier: Float // 0f for 28.8%, 1f for 40%
)

data class MarketState(
    val activeScenarios: List<Scenario> = emptyList(),
    val userBets: List<UserBet> = emptyList(),
    val dynamicPackPrice: Double = 100.0,
    val eigenTrustLogs: List<String> = emptyList(),
    val xp: Float = 0f,
    val madxBalance: Double = 10000.0,
    val stakedMadxBalance: Double = 0.0,
    val lastWinTimestamp: Long? = null,
    val sentimentPhase: SentimentPhase = SentimentPhase.EUPHORIA,
    val temperature: Float = 1.0f,
    val allocations: List<Double> = emptyList(),
    val ownedCards: List<SatiricalCard> = emptyList(),
    val currentTheme: ThemeStyle = ThemeStyle.LUX_MAT_PLASMA,
    val trendHistory: List<TrendDataPoint> = emptyList(),
    val isAiChatOpen: Boolean = false,
    val activeChatChannel: String = "MADHATR",
    val channelMessages: Map<String, List<ChatMessageInfo>> = mapOf("MADHATR" to emptyList(), "GLOBAL" to emptyList(), "CONVICTIONS" to emptyList(), "PREDICTIONS" to emptyList(), "LIAR_METER" to emptyList(), "HELP_SUPPORT" to emptyList()),
    val bookmarkedScenarioIds: Set<String> = emptySet(),
    val isOfflineCache: Boolean = false,
    val highStakesFeed: List<HighStakesActivity> = emptyList(),
    val authState: AuthState = AuthState(),
    val sagaProgress: List<SagaProgressEntity> = emptyList(),
    val evolutionHistory: List<CardEvolutionHistoryEntity> = emptyList(),
    val currentPerformanceRating: Int = 1000,
    val isTournamentQueueActive: Boolean = false,
    val telemetryStats: NeuralTelemetryStats = NeuralTelemetryStats(),
    val totalConvictions: Int = 18,
    val totalPredictions: Int = 34,
    val zLiarMeterScore: Double = 88.5,
    val companyName: String = "Degen Ventures LLC",
    val startupWebsite: String = "degenventures.io",
    val companyDescription: String = "Predictive arbitrage & high-stakes sentiment hedging syndicates.",
    
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
    val forecastScandalInput: String = "Politician caught using artificial intelligence chat bot to write sympathy letters",
    
    // Ai Chat State
    val aiChatMessages: List<ChatMessageInfo> = emptyList(),
    val isAiChatTyping: Boolean = false,
    val isTrollBoxUnlocked: Boolean = false,
    val isCopyTradingUnlocked: Boolean = false,
    val isAutoCopyTradingEnabled: Boolean = false,
    
    // Dopamine Optimizer
    val rewardNotifications: List<RewardNotification> = emptyList(),
    val dailyBsLevel: Float = 87.4f, // 0 to 100

    // Volatility Toasts Tracker
    val volatilityToasts: List<VolatilityAlertToast> = emptyList(),

    // Sentiment Feed State
    val isSentimentFeedOpen: Boolean = false,
    val sentimentFeedItems: List<SentimentFeedItem> = emptyList(),
    val isSentimentFeedLoading: Boolean = false,
    val sentimentFeedError: String? = null,

    // Market Live Auctions & Activities State
    val liveAuctions: List<LiveAuction> = emptyList(),
    val auctionActivity: List<AuctionActivityLog> = emptyList()
)

data class SentimentFeedItem(
    val title: String,
    val text: String,
    val category: String, // e.g. "Tabloid News", "Entertainment", "Global Headlines", "Viral Media"
    val sentiment: String, // "BULLISH", "BEARISH", "CHAOTIC", "MAD"
    val multiplier: String, // e.g., "1.5x Conviction", "3.0x Leverage"
    val timestamp: String // e.g. "2m ago"
)

data class ChatMessageInfo(
    val isUser: Boolean,
    val sender: String,
    val text: String,
    val timestamp: Long = System.currentTimeMillis()
)

data class RewardNotification(
    val id: String,
    val message: String,
    val amount: Double,
    val fibonacciIndex: Int,
    val isImportant: Boolean = false
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
    val category: String = "Crypto",
    val marketScope: String = "Global", // "Local" or "Global"
    val isResolved: Boolean = false,
    val winningOutcome: String? = null,
    val yesShares: Double = 1000.0,
    val noShares: Double = 1000.0
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

data class VolatilityAlertToast(
    val id: String,
    val eventName: String,
    val volatilityScore: Double,
    val text: String,
    val timestamp: Long = System.currentTimeMillis()
)

data class LiveAuction(
    val id: String,
    val title: String,
    val category: String,
    val description: String,
    val currentBid: Double,
    val highBidder: String,
    val timeRemainingSeconds: Int,
    val isTracked: Boolean = true,
    val userPlacedBid: Boolean = false,
    val biddingHistory: List<Double> = emptyList()
)

data class AuctionActivityLog(
    val id: String,
    val timestamp: Long = System.currentTimeMillis(),
    val title: String,
    val description: String,
    val type: String // "BID", "SETTLEMENT", "OUTBID", "START"
)

