package com.example.viewmodel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.math.GambitMath
import com.example.model.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

class GambitViewModel : ViewModel() {
    private val _state = MutableStateFlow(MarketState())
    val state: StateFlow<MarketState> = _state.asStateFlow()

    private var toneGenerator: android.media.ToneGenerator? = null

    init {
        try {
            toneGenerator = android.media.ToneGenerator(android.media.AudioManager.STREAM_NOTIFICATION, 100)
        } catch (e: Exception) {
            // Ignore if audio service is unavailable
        }
    }

    private val scenarios = listOf(
        Scenario("1", "The Hallucinating LLM", "[SENTINEL]", 3.5, 120.0, isHot = true),
        Scenario("2", "BTC EOD Price", "[OVER/UNDER]", 5.2, 80.0, marketType = MarketType.OVER_UNDER, targetValue = 95000.0, currentMetricValue = 94850.0),
        Scenario("3", "Next Major Rug-Pull", "[SCANDAL]", 2.1, 200.0, marketType = MarketType.MULTI_OUTCOME, isCreatorMode = true),
        Scenario("4", "ETH Gas Fee Spike", "[PROGRESSIVE]", 4.0, 150.0, marketType = MarketType.PROGRESSIVE, targetValue = 100.0, currentMetricValue = 65.0),
        Scenario("5", "Insider Dump Watch", "[WHALE]", 6.5, 90.0, isHot = true)
    )

    init {
        _state.update { it.copy(activeScenarios = scenarios) }
        recalcAllocations()
        startDutchAuctionTick()
        startBotWaveSimulation()
        startSentimentCycle()
        startTrendSimulation()
    }

    private fun startTrendSimulation() {
        viewModelScope.launch {
            var time = System.currentTimeMillis()
            var currentConviction = 50f
            var currentVolatility = 20f
            
            // Pre-fill history to make chart look good instantly
            val initialHistory = (0..20).map { i ->
                val point = TrendDataPoint(time - (20 - i) * 1000L, currentConviction, currentVolatility)
                currentConviction = (currentConviction + (Math.random() * 10f - 4f).toFloat()).coerceIn(10f, 90f)
                currentVolatility = (currentVolatility + (Math.random() * 14f - 6f).toFloat()).coerceIn(5f, 50f)
                point
            }
            _state.update { it.copy(trendHistory = initialHistory) }
            
            while (isActive) {
                delay(2000)
                time = System.currentTimeMillis()
                currentConviction = (currentConviction + (Math.random() * 10f - 4f).toFloat()).coerceIn(10f, 90f)
                currentVolatility = (currentVolatility + (Math.random() * 14f - 6f).toFloat()).coerceIn(5f, 50f)
                
                _state.update { s ->
                    val newHistory = (s.trendHistory + TrendDataPoint(time, currentConviction, currentVolatility)).takeLast(21)
                    s.copy(trendHistory = newHistory)
                }
            }
        }
    }

    private fun startDutchAuctionTick() {
        viewModelScope.launch {
            while (isActive) {
                delay(3000)
                _state.update { s ->
                    val newPrice = if (s.dynamicPackPrice > 15.0) s.dynamicPackPrice - 5.0 else {
                        try { toneGenerator?.startTone(android.media.ToneGenerator.TONE_CDMA_SOFT_ERROR_LITE, 200) } catch (e: Exception) {}
                        100.0
                    }
                    s.copy(dynamicPackPrice = newPrice)
                }
            }
        }
    }

    private fun startBotWaveSimulation() {
        viewModelScope.launch {
            while (isActive) {
                delay(2000)
                val isBot = Math.random() > 0.6
                val msg = if (isBot) {
                    try { toneGenerator?.startTone(android.media.ToneGenerator.TONE_CDMA_HIGH_PBX_SLS, 150) } catch (e: Exception) {}
                    "🚨 SYBIL REJECTED: Node ${(1000..9999).random()} EigenTrust=0.00"
                } else {
                    val dEff = 1.0 + (Math.random() * 4.0)
                    "✅ Organic Flow: d_eff=${"%.2f".format(dEff)}x"
                }
                _state.update { s ->
                    s.copy(
                        eigenTrustLogs = (listOf(msg) + s.eigenTrustLogs).take(15),
                        xp = s.xp + 0.04f,
                        madxBalance = if (isBot) s.madxBalance else s.madxBalance + (Math.random() * 0.5)
                    )
                }
            }
        }
    }

    private fun startSentimentCycle() {
        viewModelScope.launch {
            val phases = SentimentPhase.values()
            var idx = 0
            while (isActive) {
                delay(15000)
                idx = (idx + 1) % phases.size
                _state.update { it.copy(sentimentPhase = phases[idx]) }
            }
        }
    }

    fun setTemperature(tau: Float) {
        _state.update { s ->
            val allocs = GambitMath.calculateSoftmax(scenarios.map { it.crowdConvictionSpeed }, tau)
            s.copy(temperature = tau, allocations = allocs)
        }
    }

    fun recalcAllocations() = setTemperature(_state.value.temperature)

    fun stakeOnScenario(stakeAmount: Double, multiplier: Double) {
        _state.update { s ->
            s.copy(madxBalance = (s.madxBalance - stakeAmount).coerceAtLeast(0.0))
        }
    }

    fun stakeMadx(amount: Double) {
        _state.update { s ->
            s.copy(madxBalance = (s.madxBalance - amount).coerceAtLeast(0.0))
        }
    }

    fun setTheme(theme: com.example.ui.theme.ThemeStyle) {
        _state.update { it.copy(currentTheme = theme) }
    }

    fun purchasePack() {
        val rand = Math.random()
        val generatedCard = when {
            rand > 0.999 -> SatiricalCard((1000..9999).random(), "MAD GAMBIT GENESIS", CardRarity.MYTHIC, 9999, "Originals", "SOVEREIGN", 999.0, 999.0, 0.88)
            rand > 0.99 -> SatiricalCard((1000..9999).random(), "THE GOLDEN HAND", CardRarity.GOLDEN, 7888, "Elites", "MARKET MAKER", 8.8, 7.2, 0.68)
            rand > 0.95 -> SatiricalCard((1000..9999).random(), "THE ARCHITECT", CardRarity.LEGENDARY, 4888, "Elites", "ORACLE", 5.5, 4.2, 0.48)
            rand > 0.85 -> SatiricalCard((1000..9999).random(), "THE PROVOCATEUR", CardRarity.EPIC, 1888, "Chaos Lords", "CHAOS", 3.2, 2.8, 0.31)
            rand > 0.70 -> SatiricalCard((1000..9999).random(), "THE INFLUENCER", CardRarity.RARE, 488, "Media Lords", "REACTION", 2.4, 1.9, 0.22)
            rand > 0.45 -> SatiricalCard((1000..9999).random(), "THE MICRO-KOL", CardRarity.UNCOMMON, 256, "Disruptors", "ACTIVE", 1.8, 1.4, 0.16)
            else -> SatiricalCard((1000..9999).random(), "THE FAN", CardRarity.COMMON, 88, "Masses", "PASSIVE", 1.1, 0.8, 0.12)
        }
        
        _state.update { s ->
            if (s.madxBalance >= s.dynamicPackPrice) {
                s.copy(
                    madxBalance = s.madxBalance - s.dynamicPackPrice,
                    ownedCards = (listOf(generatedCard) + s.ownedCards).take(20),
                    xp = s.xp + 5f
                )
            } else s
        }
    }

    fun toggleAiChat() {
        _state.update { it.copy(isAiChatOpen = !it.isAiChatOpen) }
    }
}
