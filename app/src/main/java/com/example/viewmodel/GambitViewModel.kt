package com.example.viewmodel

import android.app.Application
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.math.GambitMath
import com.example.model.*
import com.example.AppContainer
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

class GambitViewModel(private val appContainer: AppContainer) : ViewModel() {
    private val gambitRepository = appContainer.gambitRepository
    private val localDao = gambitRepository.localDao
    private val sensoryFeedbackEngine = appContainer.sensoryFeedbackEngine
    val web3Service = appContainer.web3Service
    
    companion object {
        fun provideFactory(appContainer: AppContainer): ViewModelProvider.Factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                if (modelClass.isAssignableFrom(GambitViewModel::class.java)) {
                    return GambitViewModel(appContainer) as T
                }
                throw IllegalArgumentException("Unknown ViewModel class")
            }
        }
    }

    private val _state = MutableStateFlow(MarketState())
    val state: StateFlow<MarketState> = _state.asStateFlow()

    private val _showProposeModal = MutableStateFlow(false)
    val showProposeModal: StateFlow<Boolean> = _showProposeModal.asStateFlow()

    fun setShowProposeModal(show: Boolean) {
        _showProposeModal.value = show
    }

    fun connectWeb3Wallet() {
        viewModelScope.launch {
            sensoryFeedbackEngine.playPositiveFeedback()
            web3Service.connectWallet("metamask")
        }
    }

    fun switchNetwork(chainId: Int) {
        web3Service.switchChain(chainId)
        playFeedbackTone(android.media.ToneGenerator.TONE_CDMA_PIP, 80)
    }

    fun disconnectWeb3Wallet() {
        viewModelScope.launch {
            sensoryFeedbackEngine.playErrorFeedback()
            web3Service.disconnectWallet()
        }
    }

    fun syncGlobalAuthState(globalAuth: AuthState) {
        _state.update { it.copy(authState = globalAuth) }
    }

    private var toneGenerator: android.media.ToneGenerator? = null
    // ToneGenerator disabled to avoid AppOps attributionTag not declared errors in Android logger
    init {
    }

    private val scenarios = listOf(
        Scenario("1", "The Hallucinating LLM", "[SENTINEL]", 3.5, 120.0, isHot = true, category = "Tech"),
        Scenario("2", "BTC EOD Price", "[OVER/UNDER]", 5.2, 80.0, marketType = MarketType.OVER_UNDER, targetValue = 95000.0, currentMetricValue = 94850.0, category = "Crypto"),
        Scenario("3", "Next Major Rug-Pull", "[SCANDAL]", 2.1, 200.0, marketType = MarketType.MULTI_OUTCOME, isCreatorMode = true, category = "Crypto"),
        Scenario("4", "ETH Gas Fee Spike", "[PROGRESSIVE]", 4.0, 150.0, marketType = MarketType.PROGRESSIVE, targetValue = 100.0, currentMetricValue = 65.0, category = "Crypto"),
        Scenario("5", "Insider Dump Watch", "[WHALE]", 6.5, 90.0, isHot = true, category = "Culture"),
        Scenario("6", "World War Meme", "[SENTINEL]", 8.1, 300.0, isHot = true, category = "Geopolitics")
    )

    init {
        val initialFeed = listOf(
            HighStakesActivity("f1", System.currentTimeMillis() - 50000, "The Hallucinating LLM", "Whale Node-4901 surged 5,200 \$MADx into YES on massive break speed.", 5200.0, 9.8, "BET"),
            HighStakesActivity("f2", System.currentTimeMillis() - 110000, "ETH Gas Fee Spike", "System liquidated pool position 0x7E3F. Gas failed to meet 100 Gwei target.", 2410.0, 0.0, "LIQUIDATION"),
            HighStakesActivity("f3", System.currentTimeMillis() - 180000, "BTC EOD Price", "Sovereign Node Node-1190 locked +12,000 \$MADx pool reserve.", 12000.0, 15.0, "MASSIVE_SHIFT"),
            HighStakesActivity("f4", System.currentTimeMillis() - 250000, "Next Major Rug-Pull", "Liar Engine flags 98.7% sentinel anomaly warning threshold.", 0.0, 0.0, "ORACLE_ALERT")
        )
        _state.update { it.copy(activeScenarios = scenarios, isOfflineCache = true, highStakesFeed = initialFeed) }
        
        // Collect DB updates in real-time reactively
        viewModelScope.launch {
            localDao.getAllUserCards().collect { entities ->
                if (entities.isNotEmpty()) {
                    _state.update { s -> s.copy(ownedCards = entities.map { it.toSatiricalCard() }) }
                } else {
                    // Seed initial cards
                    val initialCards = listOf(
                        SatiricalCard(101, "THE DON MOST WANTED", CardRarity.LEGENDARY, 9800, "The Politicos", "Puffed chest, pointing fingers.", 5.5, 4.2, 0.48),
                        SatiricalCard(102, "AI HALO SENTINEL", CardRarity.RARE, 4500, "Chaos Lords", "Flashing neon visor predicting bankruptcies.", 2.5, 2.1, 0.25),
                        SatiricalCard(103, "LIAR ENGINE CORE", CardRarity.UNCOMMON, 2100, "Media Lords", "Whirring cogwheels and heat vents of pure spin.", 1.8, 1.5, 0.15)
                    )
                    localDao.insertUserCards(initialCards.map { UserCardEntity.fromSatiricalCard(it) })
                }
            }
        }

        viewModelScope.launch {
            localDao.getEvolutionHistory().collect { history ->
                _state.update { s -> s.copy(evolutionHistory = history) }
            }
        }

        viewModelScope.launch {
            localDao.getSagaProgress().collect { sProgress ->
                if (sProgress.isNotEmpty()) {
                    _state.update { s -> s.copy(sagaProgress = sProgress) }
                } else {
                    val initialSaga = listOf(
                        SagaProgressEntity(1, "Gary's Gavel Crusade", true, 100f, 4, 1.2f),
                        SagaProgressEntity(2, "Wall Street Meme Audit", false, 45f, 5, 1.5f),
                        SagaProgressEntity(3, "SBF Island Runescape", false, 0f, 6, 2.0f)
                    )
                    localDao.insertSagaProgress(initialSaga)
                }
            }
        }

        recalcAllocations()
        startDutchAuctionTick()
        startAuctionSimulationTick()
        startBotWaveSimulation()
        startSentimentCycle()
        startTrendSimulation()
        startNeuralTelemetrySimulation()
        fetchDailyForecast()
        fetchSentimentFeed()
    }

    private fun startNeuralTelemetrySimulation() {
        viewModelScope.launch {
            while (isActive) {
                delay(1200)
                _state.update { s ->
                    val currentStats = s.telemetryStats
                    val changeSent = (Math.random() * 2.0 - 0.95).toFloat()
                    val newSent = (currentStats.sentimentMetric + changeSent).coerceIn(80f, 99.9f)
                    
                    val changeConfidence = (Math.random() * 0.02 - 0.0095).toFloat()
                    val newConf = (currentStats.dynamicConfidence + changeConfidence).coerceIn(0.85f, 0.999f)
                    
                    val speedChange = Math.random() * 1.5 - 0.7
                    val newSpeed = (currentStats.networkSpeedGbps + speedChange).coerceIn(90.0, 110.0)
                    
                    val previousVariance = currentStats.volatilityIndex.toDouble()
                    val garchVariance = com.example.math.GambitMath.garchUpdate(
                        omega = 0.5, alpha = 0.15, beta = 0.8,
                        prevVariance = previousVariance, prevShock = speedChange
                    ).toFloat()
                    
                    val attacksDelta = if (Math.random() > 0.8) 1 else 0
                    
                    s.copy(
                        telemetryStats = NeuralTelemetryStats(
                            sentimentMetric = newSent,
                            cognitiveLoad = (0.6f + Math.sin(System.currentTimeMillis() / 15000.0) * 0.15).toFloat(),
                            sybilAttacksDeflected = currentStats.sybilAttacksDeflected + attacksDelta,
                            networkSpeedGbps = newSpeed,
                            dynamicConfidence = newConf,
                            volatilityIndex = garchVariance.coerceIn(10f, 90f)
                        )
                    ).also {
                        com.example.defi.DefiSecurityEngine.evaluateHeuristics(
                            marketVolatility = garchVariance.toDouble(),
                            failedSybilChecks = attacksDelta,
                            suddenVolumeSpikeUsd = 0.0, // simulated
                            detectedAiPatterns = 0 // simulated
                        )
                    }
                }
            }
        }
    }

    fun registerForTournament() {
        playFeedbackTone(android.media.ToneGenerator.TONE_PROP_ACK, 90)
        _state.update { it.copy(isTournamentQueueActive = true) }
    }

    private fun startTrendSimulation() {
        viewModelScope.launch {
            var time = System.currentTimeMillis()
            var currentConviction = 50f
            var currentVolatility = 20f
            
            val initialHistory = (0..20).map { i ->
                val point = TrendDataPoint(time - (20 - i) * 1000L, currentConviction, currentVolatility)
                currentConviction = (currentConviction + (Math.random() * 10f - 4f).toFloat()).coerceIn(10f, 90f)
                currentVolatility = (currentVolatility + (Math.random() * 14f - 6f).toFloat()).coerceIn(5f, 50f)
                point
            }
            _state.update { s -> s.copy(trendHistory = initialHistory) }
            
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

    private fun startAuctionSimulationTick() {
        viewModelScope.launch {
            _state.update { s ->
                s.copy(
                    liveAuctions = listOf(
                        LiveAuction("auc1", "Politely Hallucinating Chatbot Card", "Artificial Intelligence", "A satirical card recording a conversation where an artificial agent nicely hallucinated fake financial statistics, earning maximum charm.", 240.0, "Sentinel Node 5", 95, isTracked = true, biddingHistory = listOf(100.0, 120.0, 150.0, 190.0, 240.0)),
                        LiveAuction("auc2", "Politician AI Correspondence Ledger", "Political Bureaucracy", "Leaked files containing AI-drafted sympathy letters used by premium public servants to automate empathy.", 380.0, "Whale Node 3", 145, isTracked = false, biddingHistory = listOf(180.0, 220.0, 270.0, 310.0, 380.0)),
                        LiveAuction("auc3", "Private Yacht Regatta for Climate Action Deed", "Elite Philanthropy", "A pristine deed grant allowing secondary access to carbon offset boat races, designed specifically for high-net-worth consensus brokers.", 150.0, "Anonymous Node", 55, isTracked = true, biddingHistory = listOf(80.0, 100.0, 110.0, 130.0, 150.0))
                    ),
                    auctionActivity = listOf(
                        AuctionActivityLog("act1", System.currentTimeMillis() - 20000, "Anonymous Node Bid Placed", "Placed a bid of 145.0 MADx for Private Yacht Regatta Deed.", "BID"),
                        AuctionActivityLog("act2", System.currentTimeMillis() - 10000, "Sentinel Node 5 Bid Placed", "Placed a bid of 240.0 MADx for Politely Hallucinating Chatbot Card.", "BID")
                    )
                )
            }

            while (isActive) {
                delay(1000)
                _state.update { s ->
                    val updatedAuctions = mutableListOf<LiveAuction>()
                    val newActivityList = s.auctionActivity.toMutableList()
                    var newToasts = s.volatilityToasts.toMutableList()

                    s.liveAuctions.forEach { auc ->
                        var currentSec = auc.timeRemainingSeconds - 1
                        var currentBidVal = auc.currentBid
                        var highBidderName = auc.highBidder
                        var userPlacedBidState = auc.userPlacedBid

                        if (currentSec == 25 && auc.isTracked) {
                            val alert = com.example.model.VolatilityAlertToast(
                                id = java.util.UUID.randomUUID().toString(),
                                eventName = "⏳ AUCTION ENDING SOON",
                                volatilityScore = 65.0,
                                text = "Only 25 seconds remain on tracked asset \"${auc.title}\". Action required!"
                            )
                            newToasts.add(0, alert)
                            try { toneGenerator?.startTone(android.media.ToneGenerator.TONE_CDMA_ALERT_CALL_GUARD, 150) } catch (e: Exception) {}
                        }

                        if (currentSec <= 0) {
                            val record = AuctionActivityLog(
                                id = java.util.UUID.randomUUID().toString(),
                                title = "⚖️ Auction Settled: ${auc.title}",
                                description = "Completed with winning bid of ${auc.currentBid.toInt()} MADx by $highBidderName.",
                                type = "SETTLEMENT"
                            )
                            newActivityList.add(0, record)

                            currentSec = (60..150).random()
                            currentBidVal = (100..300).random().toDouble()
                            highBidderName = listOf("Sentinel Node 9", "Whale Node 4", "Anonymous Agent", "Council Member").random()
                            userPlacedBidState = false

                            val startRecord = AuctionActivityLog(
                                id = java.util.UUID.randomUUID().toString(),
                                title = "🏁 Auction Started: ${auc.title}",
                                description = "Accepting bids starting at ${currentBidVal.toInt()} MADx.",
                                type = "START"
                            )
                            newActivityList.add(0, startRecord)
                        } else {
                            if (Math.random() < 0.08) {
                                val increase = (15..45).random()
                                val oldBidder = highBidderName
                                val newBidVal = currentBidVal + increase
                                highBidderName = listOf("Sentinel Node 6", "Whale Node 2", "Council Delegate", "Asset Aggregator", "Expert Broker").random()
                                
                                val wasUserHigh = oldBidder.contains("You")

                                val bidRecord = AuctionActivityLog(
                                    id = java.util.UUID.randomUUID().toString(),
                                    title = "💥 Counter-Bid Filed",
                                    description = "$highBidderName placed a bid of ${newBidVal.toInt()} MADx on \"${auc.title}\".",
                                    type = "BID"
                                )
                                newActivityList.add(0, bidRecord)

                                if (wasUserHigh && auc.isTracked) {
                                    val outbidAlert = com.example.model.VolatilityAlertToast(
                                        id = java.util.UUID.randomUUID().toString(),
                                        eventName = "🚨 AUCTION OUTBID: ${auc.title}",
                                        volatilityScore = 95.0,
                                        text = "$highBidderName submitted a higher bid of ${newBidVal.toInt()} MADx. Secure your reservation!"
                                    )
                                    newToasts.add(0, outbidAlert)
                                    try { toneGenerator?.startTone(android.media.ToneGenerator.TONE_CDMA_ABBR_ALERT, 180) } catch (e: Exception) {}
                                }
                                
                                currentBidVal = newBidVal
                                userPlacedBidState = false
                            }
                        }

                        val updatedHistory = if (currentSec <= 0 || auc.timeRemainingSeconds <= 1) {
                            listOf(currentBidVal * 0.6, currentBidVal * 0.8, currentBidVal)
                        } else if (currentBidVal != auc.currentBid) {
                            (auc.biddingHistory + currentBidVal).takeLast(15)
                        } else {
                            auc.biddingHistory
                        }

                        updatedAuctions.add(
                            auc.copy(
                                timeRemainingSeconds = currentSec,
                                currentBid = currentBidVal,
                                highBidder = highBidderName,
                                userPlacedBid = userPlacedBidState,
                                biddingHistory = updatedHistory
                            )
                        )
                    }

                    s.copy(
                        liveAuctions = updatedAuctions,
                        auctionActivity = newActivityList.take(30),
                        volatilityToasts = newToasts.take(3)
                    )
                }
            }
        }
    }

    private fun startBotWaveSimulation() {
        viewModelScope.launch {
            while (isActive) {
                delay(4000)
                val isBot = Math.random() > 0.6
                val msg = if (isBot) {
                    try { toneGenerator?.startTone(android.media.ToneGenerator.TONE_CDMA_HIGH_PBX_SLS, 150) } catch (e: Exception) {}
                    "🚨 SYBIL REJECTED: Node ${(1000..9999).random()} EigenTrust=0.00"
                } else {
                    val dEff = 1.0 + (Math.random() * 4.0)
                    "✅ Organic Flow: d_eff=${"%.2f".format(dEff)}x"
                }

                val extraActivity: HighStakesActivity? = if (Math.random() > 0.45) {
                    val names = listOf("The Hallucinating LLM", "BTC EOD Price", "Next Major Rug-Pull", "ETH Gas Fee Spike", "Insider Dump Watch")
                    val typ = listOf("BET", "LIQUIDATION", "MASSIVE_SHIFT", "ORACLE_ALERT").random()
                    val amt = (100..4500).random().toDouble()
                    val nodeNum = (1000..9999).random()
                    val desc = when (typ) {
                        "BET" -> "Sovereign node Node-$nodeNum staked ${amt.toInt()} \$MADx with target multipliers."
                        "LIQUIDATION" -> "Margin liquified on Node-$nodeNum; conviction fell below warning threshold."
                        "MASSIVE_SHIFT" -> "Aggregator injected ${amt.toInt()} \$MADx into the conviction pool."
                        else -> "Oracle flagged Twitter activity volume surge (+${(150..600).random()}%)."
                    }
                    HighStakesActivity(
                        id = java.util.UUID.randomUUID().toString(),
                        timestamp = System.currentTimeMillis(),
                        eventName = names.random(),
                        text = desc,
                        amount = amt,
                        speedBoost = (1..10).random().toDouble() * 0.7,
                        type = typ
                    )
                } else null

                _state.update { s ->
                    val updatedFeed = if (extraActivity != null) {
                        (listOf(extraActivity) + s.highStakesFeed).take(15)
                    } else s.highStakesFeed
                    
                    var newToasts = s.volatilityToasts
                    if (Math.random() > 0.75) {
                        val trackingScenarios = s.activeScenarios.filter { s.bookmarkedScenarioIds.contains(it.id) || it.isHot }
                        val targetSc = if (trackingScenarios.isNotEmpty()) trackingScenarios.random() else s.activeScenarios.randomOrNull()
                        if (targetSc != null) {
                            val volScore = 30.0 + (Math.random() * 60.0)
                            val textAlert = when {
                                volScore > 75.0 -> "🔥 VOLATILITY SHIFT: Severe conviction convergence! High-density order flow detected."
                                volScore > 50.0 -> "⚡ STABILITY THRESHOLD BREACHED: Social sentiment volatility spiking above safety levels."
                                else -> "📉 METRIC UPDATE: Direct neural delta speed has exceeded the 30u threshold."
                            }
                            val newToast = com.example.model.VolatilityAlertToast(
                                id = java.util.UUID.randomUUID().toString(),
                                eventName = targetSc.name,
                                volatilityScore = volScore,
                                text = textAlert
                            )
                            newToasts = (newToasts + newToast).take(3)
                            try { toneGenerator?.startTone(android.media.ToneGenerator.TONE_CDMA_PIP, 100) } catch (e: Exception) {}
                        }
                    }

                    s.copy(
                        eigenTrustLogs = (listOf(msg) + s.eigenTrustLogs).take(15),
                        xp = s.xp + 0.04f,
                        madxBalance = if (isBot) s.madxBalance else s.madxBalance + (Math.random() * 0.5),
                        highStakesFeed = updatedFeed,
                        volatilityToasts = newToasts
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

    fun playFeedbackTone(toneType: Int? = null, durationMs: Int = 80) {
        sensoryFeedbackEngine.playPositiveFeedback()
    }

    fun placeInteractivePrediction(
        scenarioId: String,
        direction: String,
        amount: Double,
        convictionLevel: Float
    ) {
        val safeAmt = if (amount.isNaN() || !amount.isFinite() || amount <= 0.0) 0.0 else amount
        val safeConv = if (convictionLevel.isNaN() || !convictionLevel.isFinite() || convictionLevel < 0.0f) 0.0f else convictionLevel.coerceIn(0.0f, 1.0f)
        if (safeAmt <= 0.0) return

        viewModelScope.launch {
            if (_state.value.madxBalance < safeAmt) {
                sensoryFeedbackEngine.playErrorFeedback()
                return@launch
            }

            // Simulate immediate Web3/Contract loading state UI here if desired, but we'll go straight for execution.
            val result = web3Service.signAndExecuteTransaction(
                contractAddress = "0xMADGambitConvictionEngine", 
                payload = "{\"id\":\"$scenarioId\",\"dir\":\"$direction\",\"conv\":$safeConv}", 
                value = safeAmt
            )

            if (!result.success) {
                sensoryFeedbackEngine.playErrorFeedback()
                return@launch
            }

            // Success, play dopamine hit
            sensoryFeedbackEngine.playVictoryFeedback()

            _state.update { s ->
                val updatedScenarios = s.activeScenarios.map { sc ->
                    if (sc.id == scenarioId) {
                        val scaleFactor = safeAmt * safeConv * 0.02
                        val speedChange = if (direction == "YES" || direction == "OVER" || direction == "BUY" || direction == "BUY_TARGET_MET" || direction == "BTC" || direction == "ETH") {
                            sc.crowdConvictionSpeed + scaleFactor
                        } else {
                            sc.crowdConvictionSpeed - scaleFactor
                        }
                        val newTwitterRatio = if (direction == "YES" || direction == "OVER" || direction == "BUY" || direction == "BUY_TARGET_MET" || direction == "BTC" || direction == "ETH") {
                            (sc.sentimentBullishRatio + 0.06).coerceIn(0.01, 0.99)
                        } else {
                            (sc.sentimentBullishRatio - 0.06).coerceIn(0.01, 0.99)
                        }
                        sc.copy(
                            crowdConvictionSpeed = if (speedChange.isNaN() || !speedChange.isFinite()) sc.crowdConvictionSpeed else speedChange,
                            gildedConvictionReserve = sc.gildedConvictionReserve + safeAmt,
                            sentimentBullishRatio = newTwitterRatio,
                            socialTwitterImpressions = sc.socialTwitterImpressions + (safeAmt * 100).toLong()
                        )
                    } else sc
                }

                val targetSc = s.activeScenarios.find { it.id == scenarioId }
                val scenarioName = targetSc?.name ?: "Unknown Scenario"
                
                val currentSec = System.currentTimeMillis()
                val isHot = targetSc?.isHot == true
                
                val userFeedbackMsg = if (safeAmt > 1000) {
                    "WHALE CONVICTION LOGGED! Locked ${safeAmt.toInt()} MADx on $direction with Conviction $safeConv."
                } else if (safeConv > 0.8f) {
                    "DEGEN MODE. Max conviction registered on $direction."
                } else {
                    "Position deployed on $direction. Waiting on oracles."
                }

                val userBetObj = UserBet(scenarioId, direction, safeAmt, false, 0f)

                s.copy(
                    userBets = s.userBets + userBetObj,
                    madxBalance = s.madxBalance - safeAmt,
                    activeScenarios = updatedScenarios,
                    eigenTrustLogs = (listOf("tx(${result.transactionHash?.take(6)}...): $userFeedbackMsg") + s.eigenTrustLogs).take(15),
                    xp = s.xp + (safeAmt * safeConv * 0.1f).toFloat(),
                    totalPredictions = s.totalPredictions + 1,
                    totalConvictions = if (safeConv >= 0.5f) s.totalConvictions + 1 else s.totalConvictions,
                    highStakesFeed = (listOf(
                        HighStakesActivity(
                            id = java.util.UUID.randomUUID().toString(),
                            timestamp = currentSec,
                            eventName = scenarioName,
                            text = "You locked ${safeAmt.toInt()} MADx with conviction level ${(safeConv * 100).toInt()}%. tx: ${result.transactionHash}",
                            amount = safeAmt,
                            speedBoost = if (isHot) 5.5 else 1.2,
                            type = "BET"
                        )
                    ) + s.highStakesFeed).take(50)
                )
            }
        }
    }


    fun submitMarketplacePrediction(
        economicEvent: String,
        predictedOutcome: String,
        confidenceLevel: Float,
        stakeAmount: Double
    ) {
        val safeAmt = if (stakeAmount.isNaN() || !stakeAmount.isFinite() || stakeAmount <= 0.0) 0.0 else stakeAmount
        val safeConf = if (confidenceLevel.isNaN() || !confidenceLevel.isFinite() || confidenceLevel < 0.0f) 0.0f else confidenceLevel.coerceIn(0.0f, 1.0f)
        if (safeAmt <= 0.0) return

        _state.update { s ->
            if (s.madxBalance < safeAmt) return@update s

            val textDescription = "Economic prediction: Outcome '$predictedOutcome' on event '$economicEvent' locked in with ${"%.0f".format(safeConf * 100)}% confidence index ($safeAmt MADx stake)."
            
            val newActivity = HighStakesActivity(
                id = java.util.UUID.randomUUID().toString(),
                timestamp = System.currentTimeMillis(),
                eventName = "Conviction Marketplace / $economicEvent",
                text = textDescription,
                amount = safeAmt,
                speedBoost = safeConf.toDouble() * 4.0,
                type = "MASSIVE_SHIFT"
            )

            viewModelScope.launch(Dispatchers.Default) {
                try {
                    toneGenerator?.startTone(android.media.ToneGenerator.TONE_CDMA_CONFIRM, 150)
                    delay(180)
                    toneGenerator?.startTone(android.media.ToneGenerator.TONE_CDMA_PIP, 120)
                } catch (e: Exception) {}
            }

            s.copy(
                madxBalance = (s.madxBalance - safeAmt).coerceAtLeast(0.0),
                xp = s.xp + (safeAmt * safeConf * 0.3).toFloat(),
                highStakesFeed = (listOf(newActivity) + s.highStakesFeed).take(15),
                totalPredictions = s.totalPredictions + 1,
                totalConvictions = if (safeConf >= 0.5f) s.totalConvictions + 1 else s.totalConvictions
            )
        }
    }

    fun setTemperature(tau: Float) {
        val safeTau = if (tau.isNaN() || !tau.isFinite() || tau < 0.01f) 0.5f else tau.coerceIn(0.01f, 10.0f)
        _state.update { s ->
            val allocs = GambitMath.calculateSoftmax(s.activeScenarios.map { it.crowdConvictionSpeed }, safeTau)
            s.copy(temperature = safeTau, allocations = allocs)
        }
        // EIP-712 Gasless Meta-Transaction simulation
        writeToBlockchainSimulated("EIP-712 Sign", "ROUTE_ORCHESTRATION", "0x${(1000..9999).random()}...tx", "Temperature \u03C4 shifted to ${"%.2f".format(safeTau)}")
    }

    fun recalcAllocations() = setTemperature(_state.value.temperature)

    fun placeUserBet(scenarioId: String, outcome: String, amount: Double, hasMadShield: Boolean, premiumTier: Float) {
        val safeStake = amount.coerceAtLeast(0.0)
        if (safeStake <= 0.0) return
        
        _state.update { s ->
            // Shield premium computation
            val shieldPremium = if (hasMadShield) safeStake * (if (premiumTier > 0.5f) 0.04 else 0.02) else 0.0
            val totalCost = safeStake + shieldPremium
            
            if (s.madxBalance < totalCost) return@update s
            
            // DL-LMSR Update
            val volume = safeStake * 1.5 // simulated Volume
            val currentShares = s.activeScenarios.map { it.crowdConvictionSpeed }
            val bLiquidity = 1000.0 // simulated base liquidity
            val dLmsrCost = com.example.math.GambitMath.calculateDLLMSRCost(currentShares, bLiquidity, volume)
            
            // The Furnace (Deflationary Logic)
            val txFees = safeStake * 0.02
            val burnPercent = com.example.math.GambitMath.calculateFurnaceBurnPercent(volume, txFees)
            val burnAmount = safeStake * (burnPercent / 100.0)
            
            // TeaBag Risk Engine
            val riskVariance = s.telemetryStats.volatilityIndex.toDouble() / 100.0
            val premium = com.example.math.GambitMath.calculateTeaBagPremium(safeStake, 0.45, riskVariance)
            
            // Adjust final deduction based on DL-LMSR actual cost plus burn/premiums
            val finalDeduction = totalCost + premium + burnAmount + (dLmsrCost * 0.01) // DL-LMSR cost slippage factor
            
            val newUserBet = UserBet(scenarioId, outcome, safeStake, hasMadShield, premiumTier)
            
            val newActivity = HighStakesActivity(
                id = java.util.UUID.randomUUID().toString(),
                timestamp = System.currentTimeMillis(),
                eventName = "PREDICTION PLACED",
                text = "Committed $safeStake MADx to $outcome. ${if (hasMadShield) "🛡️ MAD SHIELD ACTIVE" else ""}",
                amount = safeStake,
                type = "BET",
                scenarioId = scenarioId,
                outcome = outcome
            )
            
            s.copy(
                madxBalance = (s.madxBalance - finalDeduction).coerceAtLeast(0.0),
                userBets = s.userBets + newUserBet,
                highStakesFeed = (listOf(newActivity) + s.highStakesFeed).take(15)
            )
        }
    }

    fun stakeMadx(amount: Double) {
        val safeAmt = if (amount.isNaN() || !amount.isFinite() || amount <= 0.0) 0.0 else amount
        if (safeAmt <= 0.0) return
        _state.update { s ->
            if (s.madxBalance < safeAmt) return@update s
            
            // Calculate Fibonacci-based Dopamine Reward for Staking
            val userCurrentIndex = com.example.math.GambitMath.calculateUserDopamineIndex(
                evolutionStage = s.ownedCards.maxOfOrNull { it.evolutionStage } ?: 0,
                xp = s.xp,
                socialStanding = s.currentPerformanceRating
            )
            val fibMultiplier = com.example.math.GambitMath.getFibonacciReward(userCurrentIndex)
            val dopamineRewardAmt = safeAmt * 0.005 * fibMultiplier // 0.5% base multiplied by Fibonacci index
            
            val newNotification = RewardNotification(
                id = "Staking_${System.currentTimeMillis()}",
                message = "STAKED! Governance Locked. You've earned a Dopamine Kickback!",
                amount = dopamineRewardAmt,
                fibonacciIndex = userCurrentIndex
            )
            
            s.copy(
                madxBalance = ((s.madxBalance - safeAmt) + dopamineRewardAmt).coerceAtLeast(0.0),
                stakedMadxBalance = s.stakedMadxBalance + safeAmt,
                rewardNotifications = s.rewardNotifications + newNotification
            )
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
        
        viewModelScope.launch {
            if (_state.value.madxBalance >= _state.value.dynamicPackPrice) {
                val nextBalance = (_state.value.madxBalance - _state.value.dynamicPackPrice).coerceAtLeast(0.0)
                localDao.insertUserCard(UserCardEntity.fromSatiricalCard(generatedCard))
                
                localDao.insertHistory(
                    CardEvolutionHistoryEntity(
                        timestamp = System.currentTimeMillis(),
                        cardId = generatedCard.id,
                        cardName = generatedCard.name,
                        previousStage = 0,
                        nextStage = 1,
                        type = "BUY",
                        details = "🎒 Ripped a dynamic pack! Found a brand new ${generatedCard.rarity.display} NFT Weapon."
                    )
                )
                
                _state.update { s ->
                    s.copy(
                        madxBalance = nextBalance,
                        xp = s.xp + 5f
                    )
                }
            }
        }
    }

    fun toggleAiChat() {
        _state.update { it.copy(isAiChatOpen = !it.isAiChatOpen) }
    }

    fun setChatChannel(channel: String) {
        _state.update { it.copy(activeChatChannel = channel) }
    }

    fun toggleAutoCopyTrading() {
        _state.update { it.copy(isAutoCopyTradingEnabled = !it.isAutoCopyTradingEnabled) }
    }

    fun sendMessageToAi(message: String) {
        val trimmed = message.trim()
        if (trimmed.isEmpty()) return
        
        val currentState = _state.value
        val channel = currentState.activeChatChannel

        val userMessage = ChatMessageInfo(isUser = true, sender = "You", text = trimmed)
        
        _state.update { s -> 
            val updatedMessages = s.channelMessages.toMutableMap()
            updatedMessages[channel] = (updatedMessages[channel] ?: emptyList()) + userMessage
            s.copy(
                channelMessages = updatedMessages,
                isAiChatTyping = if (channel == "MADHATR") true else false,
                aiChatMessages = updatedMessages["MADHATR"] ?: emptyList() // Fallback
            )
        }
        
        if (channel != "MADHATR") {
            // Simulate other users responding in troll box
            viewModelScope.launch {
                kotlinx.coroutines.delay(1500)
                val trollResponses = listOf("lmao", "based", "pure copium", "bullish if true", "touch grass", "rug pull incoming")
                val aiMessage = ChatMessageInfo(isUser = false, sender = "Anon_${(1000..9999).random()}", text = trollResponses.random())
                _state.update { s ->
                    val updatedMsgs = s.channelMessages.toMutableMap()
                    updatedMsgs[channel] = (updatedMsgs[channel] ?: emptyList()) + aiMessage
                    s.copy(channelMessages = updatedMsgs)
                }
                playFeedbackTone(android.media.ToneGenerator.TONE_CDMA_CONFIRM, 50)
            }
            return
        }

        viewModelScope.launch {
            var textToSpeak = ""
            var textToDisplay = ""
            
            if (trimmed.contains("troll box", ignoreCase = true) || trimmed.contains("trollbox", ignoreCase = true) || trimmed.contains("lobby", ignoreCase = true)) {
                if (!currentState.isTrollBoxUnlocked) {
                    _state.update { it.copy(isTrollBoxUnlocked = true) }
                    textToDisplay = "Access granted. I've unlocked the Troll Box channels for you (Global, Convictions, Predictions, Liar Meter, Help). Expect pure chaos."
                    textToSpeak = "I've unlocked the Troll Box for you. Better put on your helmet!"
                } else {
                    textToDisplay = "You already have access to the Troll Box, buddy! Check the tabs."
                    textToSpeak = "You already have access. Are you blind?"
                }
            } else if (trimmed.contains("copy trade", ignoreCase = true) || trimmed.contains("copy trading", ignoreCase = true) || trimmed.contains("copy", ignoreCase = true)) {
                if (!currentState.isCopyTradingUnlocked) {
                    _state.update { it.copy(isCopyTradingUnlocked = true) }
                    textToDisplay = "Access granted. Copy Trading is now unlocked on the High Stakes Feed. Go tail some whales!"
                    textToSpeak = "Copy trading is activated. Try not to copy a loser."
                } else {
                    textToDisplay = "Copy trading is already active. Just hit the button on the High Stakes feed."
                    textToSpeak = "Copy trading is already running!"
                }
            } else {
                val aiResponseText = appContainer.generativeAIProvider.chatWithPersona(trimmed)
                textToDisplay = aiResponseText
                textToSpeak = aiResponseText
            }
            
            val aiMessage = ChatMessageInfo(isUser = false, sender = "MADHAT'r", text = textToDisplay)
            
            _state.update { s -> 
                val updatedMessages = s.channelMessages.toMutableMap()
                updatedMessages["MADHATR"] = (updatedMessages["MADHATR"] ?: emptyList()) + aiMessage
                s.copy(
                    channelMessages = updatedMessages,
                    aiChatMessages = updatedMessages["MADHATR"] ?: emptyList(),
                    isAiChatTyping = false
                )
            }
            com.example.engine.MadhatrVoice.speak(textToSpeak)
            
            try {
                toneGenerator?.startTone(android.media.ToneGenerator.TONE_CDMA_CONFIRM, 120)
            } catch (e: Exception) {}
        }
    }

    fun toggleBookmark(scenarioId: String) {
        _state.update { s ->
            val set = s.bookmarkedScenarioIds.toMutableSet()
            if (set.contains(scenarioId)) set.remove(scenarioId)
            else set.add(scenarioId)
            s.copy(bookmarkedScenarioIds = set)
        }
    }

    fun proposeScenario(
        name: String,
        category: String,
        marketType: MarketType,
        lockWeeks: Int,
        isLiarMeter: Boolean,
        cannedOutcomes: List<String>,
        marketScope: String = "Global"
    ) {
        val sanitizedName = name.trim().take(75).replace(Regex("[^a-zA-Z0-9\\s?\\-_!@#\$%^&*()+=.:;/]"), "")
        if (sanitizedName.isBlank()) return
        
        val safeCategory = if (category.trim() in listOf("Crypto", "Geopolitics", "Culture", "Tech")) category.trim() else "Tech"
        val safeLockWeeks = lockWeeks.coerceIn(1, 12)
        
        val safeOutcomes = cannedOutcomes
            .map { it.trim().take(20).replace(Regex("[^a-zA-Z0-9\\s?\\-_!]"), "") }
            .filter { it.isNotBlank() }
            .take(10)

        val calculatedTag = if (isLiarMeter) "[SENTINEL]" else "[$safeCategory]"
        val finalTitle = if (isLiarMeter) "🎰 Liar Meter: $sanitizedName" else sanitizedName
        
        val rawHumor = SatireGuardrailEngine.injectHumor(finalTitle)
        val extractedInsight = rawHumor.substringAfter("🃏 MAD Insight:\n").trim()
        
        val psychographicBias = listOf(
            "Echo-Chamber Amplification", "Schadenfreude Hedging", 
            "Anti-Logic Arbitrage", "Paranoia Maximizer", "FOMO Hysteria"
        ).random()

        val generatedId = (100..999).random().toString()
        val proposed = Scenario(
            id = generatedId,
            name = finalTitle,
            tag = calculatedTag,
            crowdConvictionSpeed = 3.3,
            baseMultiplier = 2.2,
            isHot = true,
            marketType = marketType,
            targetValue = if (marketType == MarketType.OVER_UNDER) 100.0 else null,
            currentMetricValue = if (marketType == MarketType.OVER_UNDER) 42.0 else null,
            isCreatorMode = true,
            gildedConvictionReserve = 500.0,
            socialTwitterImpressions = 120000L,
            sentimentBullishRatio = 0.50,
            psychographicCoreBias = "$psychographicBias\n($extractedInsight)",
            lockPeriodWeeks = safeLockWeeks,
            category = safeCategory,
            marketScope = marketScope
        )

        _state.update { s ->
            s.copy(
                activeScenarios = listOf(proposed) + s.activeScenarios,
                xp = s.xp + 25f
            )
        }
        recalcAllocations()

        val feedDescription = "Degen Oracle parsed scraper logs: $finalTitle. scope: $marketScope outcome matrix mapped: $safeOutcomes"
        val customActivity = HighStakesActivity(
            id = java.util.UUID.randomUUID().toString(),
            timestamp = System.currentTimeMillis(),
            eventName = finalTitle,
            text = feedDescription,
            amount = 500.0,
            speedBoost = 1.3,
            type = "ORACLE_ALERT"
        )
        
        _state.update { s ->
            s.copy(highStakesFeed = (listOf(customActivity) + s.highStakesFeed).take(15))
        }

        playFeedbackTone(android.media.ToneGenerator.TONE_CDMA_HIGH_PBX_SLS, 150)
    }

    /**
     * Resolves a prediction/conviction market using decentralized Oracle consensus.
     * Calculated utilizing LMSR pricing logic and delta-limit payouts.
     */
    fun resolveScenario(scenarioId: String, winningOutcome: String) {
        _state.update { s ->
            val sc = s.activeScenarios.find { it.id == scenarioId } ?: return@update s
            if (sc.isResolved) return@update s

            val yesProb = GambitMath.calculateDLLMSRPrice(sc.yesShares, listOf(sc.yesShares, sc.noShares), 1000.0)
            val payoutFactor = if (winningOutcome == "YES" || winningOutcome == "OVER" || winningOutcome == "BUY_TARGET_MET") {
                1.0 / (yesProb.coerceIn(0.1, 0.9))
            } else {
                1.0 / ((1.0 - yesProb).coerceIn(0.1, 0.9))
            }

            // Calculate user winnings and shield payouts
            var totalWinnings = 0.0
            var totalShieldPayouts = 0.0
            
            s.userBets.filter { it.scenarioId == scenarioId }.forEach { bet ->
                if (bet.outcome == winningOutcome) {
                    totalWinnings += bet.amount * payoutFactor
                } else if (bet.hasMadShield) {
                    totalShieldPayouts += com.example.math.GambitMath.calculateShieldPayout(bet.amount, bet.shieldPremiumTier)
                }
            }

            val msg = "Oracle parsed consensus: '${sc.name}' -> '$winningOutcome'. settled at ${"%.2f".format(payoutFactor)}x. Winnings: ${"%.2f".format(totalWinnings)} MADx. Shield payouts: ${"%.2f".format(totalShieldPayouts)} MADx."

            val resolutionActivity = HighStakesActivity(
                id = java.util.UUID.randomUUID().toString(),
                timestamp = System.currentTimeMillis(),
                eventName = sc.name,
                text = msg,
                amount = totalWinnings,
                speedBoost = payoutFactor,
                type = "LIQUIDATION"
            )

            val updatedScenarios = s.activeScenarios.map {
                if (it.id == scenarioId) {
                    it.copy(
                        isResolved = true,
                        winningOutcome = winningOutcome
                    )
                } else it
            }

            viewModelScope.launch(Dispatchers.Default) {
                try {
                    toneGenerator?.startTone(android.media.ToneGenerator.TONE_CDMA_CONFIRM, 250)
                } catch (e: Exception) {}
            }

            val baseBonus = (50..250).random().toDouble() * payoutFactor.coerceIn(1.0, 5.0)
            
            // Apply Expanded Fibonacci variables for deeper reward mechanics
            val userCurrentIndex = com.example.math.GambitMath.calculateUserDopamineIndex(
                evolutionStage = s.ownedCards.maxOfOrNull { it.evolutionStage } ?: 0,
                xp = s.xp,
                socialStanding = s.currentPerformanceRating
            )
            val fibMultiplier = com.example.math.GambitMath.getFibonacciReward(userCurrentIndex)
            val fibRewardAmt = baseBonus * fibMultiplier

            val finalRewardAmt = totalWinnings + totalShieldPayouts + fibRewardAmt

            val newNotification = RewardNotification(
                id = "Win_${System.currentTimeMillis()}",
                message = "ORACLE RESOLUTION! Dopamine Kickback applied (Fib ×$fibMultiplier)",
                amount = fibRewardAmt,
                fibonacciIndex = userCurrentIndex
            )

            s.copy(
                activeScenarios = updatedScenarios,
                madxBalance = s.madxBalance + finalRewardAmt,
                xp = s.xp + 50f,
                highStakesFeed = (listOf(resolutionActivity) + s.highStakesFeed).take(15),
                rewardNotifications = s.rewardNotifications + newNotification
            )
        }
    }

    /** Evolutionary Upgrade system using earned xp & $MADx inside Room */
    fun evolveCardState(cardId: Int) {
        viewModelScope.launch {
            val cardToUpdate = _state.value.ownedCards.find { it.id == cardId } ?: return@launch
            if (cardToUpdate.evolutionStage >= 3) return@launch
            
            val buzzScore = 75.0 // Handwavy Oracle BuzzScore
            val volatilityScore = _state.value.telemetryStats.volatilityIndex.toDouble()
            val simulatedEvolution = com.example.engine.EvolutionEngine.attemptEvolution(cardToUpdate, buzzScore, volatilityScore)
            
            if (simulatedEvolution != null) {
                // Success
                val nextStage = simulatedEvolution.evolutionStage
                val newName = when (nextStage) {
                    2 -> "★ ${simulatedEvolution.name} ELITE"
                    3 -> "★★ ${simulatedEvolution.name} SUPREME ASCENDED"
                    else -> simulatedEvolution.name
                }
                
                val fullyEvolved = simulatedEvolution.copy(
                    name = newName,
                    apyBoost = simulatedEvolution.apyBoost + 0.05
                )
                
                localDao.insertUserCard(UserCardEntity.fromSatiricalCard(fullyEvolved))
                
                localDao.insertHistory(
                    CardEvolutionHistoryEntity(
                        timestamp = System.currentTimeMillis(),
                        cardId = cardId,
                        cardName = fullyEvolved.name,
                        previousStage = cardToUpdate.evolutionStage,
                        nextStage = nextStage,
                        type = "EVOLVE",
                        details = "🧬 DNA Evolved to Stage $nextStage! Clout & power factors elevated."
                    )
                )
                _state.update { s -> s.copy(xp = s.xp + 15f) }
            } else {
                // Failure: Burn
                localDao.deleteUserCard(cardId)
                
                // Add Near-Miss Effect check
                val isNearMiss = buzzScore * 1.15 > 100.0 // Near-miss logic
                
                localDao.insertHistory(
                    CardEvolutionHistoryEntity(
                        timestamp = System.currentTimeMillis(),
                        cardId = cardId,
                        cardName = cardToUpdate.name,
                        previousStage = cardToUpdate.evolutionStage,
                        nextStage = 0,
                        type = "BURN",
                        details = "🔥 VRF Failure (Random >= $buzzScore). Asset incinerated." + if (isNearMiss) " Near miss! The card cracked gold before turning to dust." else ""
                    )
                )
                // Burn 100% of NFT upgrade fees
                _state.update { s -> s.copy(madxBalance = java.lang.Math.max(0.0, s.madxBalance - 50.0)) }
            }
        }
    }

    /** Damage/Deterioration simulation logging to Room */
    fun damageCardState(cardId: Int, amount: Double) {
        viewModelScope.launch {
            val cardToUpdate = _state.value.ownedCards.find { it.id == cardId } ?: return@launch
            val nextDurability = (cardToUpdate.durability - amount).coerceIn(0.0, 1.0)
            val updated = cardToUpdate.copy(durability = nextDurability)
            localDao.insertUserCard(UserCardEntity.fromSatiricalCard(updated))
            
            if (nextDurability < 0.05) {
                localDao.insertHistory(
                    CardEvolutionHistoryEntity(
                        timestamp = System.currentTimeMillis(),
                        cardId = cardId,
                        cardName = cardToUpdate.name,
                        previousStage = cardToUpdate.evolutionStage,
                        nextStage = cardToUpdate.evolutionStage,
                        type = "DAMAGE",
                        details = "💥 Combat overload. Durability depleted on ${cardToUpdate.name}!"
                    )
                )
            }
        }
    }

    /** Recondition/Repairs for deteriorated cards using $MADx, synced to Room */
    fun repairCardState(cardId: Int) {
        viewModelScope.launch {
            val repairCost = 150.0
            if (_state.value.madxBalance < repairCost) return@launch
            val cardToUpdate = _state.value.ownedCards.find { it.id == cardId } ?: return@launch
            val updated = cardToUpdate.copy(durability = 1.0)
            
            localDao.insertUserCard(UserCardEntity.fromSatiricalCard(updated))
            
            localDao.insertHistory(
                CardEvolutionHistoryEntity(
                    timestamp = System.currentTimeMillis(),
                    cardId = cardId,
                    cardName = cardToUpdate.name,
                    previousStage = cardToUpdate.evolutionStage,
                    nextStage = cardToUpdate.evolutionStage,
                    type = "REPAIR",
                    details = "🔧 Repair completed. Hull structural integrity restored to 100%!"
                )
            )
            _state.update { s -> s.copy(madxBalance = s.madxBalance - repairCost) }
        }
    }

    /** Burn deteriorated cards in exchange for recycled $MADx, synced through Room */
    fun burnCardState(cardId: Int) {
        viewModelScope.launch {
            val refund = 350.0
            val cardToUpdate = _state.value.ownedCards.find { it.id == cardId } ?: return@launch
            localDao.deleteUserCard(cardId)
            
            localDao.insertHistory(
                CardEvolutionHistoryEntity(
                    timestamp = System.currentTimeMillis(),
                    cardId = cardId,
                    cardName = cardToUpdate.name,
                    previousStage = cardToUpdate.evolutionStage,
                    nextStage = 0,
                    type = "BURN",
                    details = "🔥 Recycled card parameters inside the incinerator chambers for +$refund MADx."
                )
            )
            _state.update { s -> s.copy(madxBalance = s.madxBalance + refund, xp = s.xp + 10f) }
        }
    }

    /** Record active rewards to user balance, synced through Room */
    fun addEarningsToCard(cardId: Int, amount: Double) {
        viewModelScope.launch {
            val s = _state.value
            val cardToUpdate = s.ownedCards.find { it.id == cardId } ?: return@launch
            
            // Dopamine Optimizer: Variable Ratio Reinforcement using Expanded Fibonacci
            val userDopamineIndex = GambitMath.calculateUserDopamineIndex(
                evolutionStage = cardToUpdate.evolutionStage,
                xp = s.xp,
                socialStanding = s.currentPerformanceRating
            )
            val fibonacciMultiplier = GambitMath.getFibonacciReward(userDopamineIndex)
            
            // Cosmic Anchor: Lunar Cycle Multiplier Integration
            val lunarMultiplier = GambitMath.getLunarPhaseMultiplier(System.currentTimeMillis())
            
            // Calculate ultimate optimized yield 
            val optimizedReward = amount * fibonacciMultiplier * lunarMultiplier
            
            val updated = cardToUpdate.copy(earnsCount = cardToUpdate.earnsCount + optimizedReward)
            localDao.insertUserCard(UserCardEntity.fromSatiricalCard(updated))
            
            val newNotification = RewardNotification(
                id = java.util.UUID.randomUUID().toString(),
                message = com.example.model.SatireGuardrailEngine.injectHumor("Yield generated by ${updated.name}!"),
                amount = optimizedReward,
                fibonacciIndex = userDopamineIndex
            )
            
            _state.update { curr -> 
                curr.copy(
                    madxBalance = curr.madxBalance + optimizedReward,
                    rewardNotifications = curr.rewardNotifications + newNotification
                ) 
            }
        }
    }
    
    fun dismissRewardNotification(id: String) {
        _state.update { s -> 
            s.copy(rewardNotifications = s.rewardNotifications.filter { it.id != id })
        }
    }

    fun dismissVolatilityToast(id: String) {
        _state.update { s ->
            s.copy(volatilityToasts = s.volatilityToasts.filter { it.id != id })
        }
    }

    fun triggerVolatilityToast(eventName: String, score: Double, text: String) {
        val newToast = com.example.model.VolatilityAlertToast(
            id = java.util.UUID.randomUUID().toString(),
            eventName = eventName,
            volatilityScore = score,
            text = text
        )
        _state.update { s ->
            s.copy(volatilityToasts = (s.volatilityToasts + newToast).take(3))
        }
    }

    /** Conditional Login flow */
    fun handleSignIn(authType: String) {
        _state.update { s ->
            val isMasterAdmin = authType == "GOOGLE"
            val username = if (isMasterAdmin) "nick mcleod" else "AnonZeroUser"
            val email = if (isMasterAdmin) "maddegen@proton.me" else "anonymous@zeroauth.node"
            // Ensure the user gets master-admin capability if they use Google auth (simulating specific proton auth).
            s.copy(
                authState = AuthState(
                    isAuthenticated = true,
                    authType = authType,
                    username = username,
                    email = email,
                    isAdmin = isMasterAdmin
                )
            )
        }
        playFeedbackTone(android.media.ToneGenerator.TONE_CDMA_CONFIRM, 120)
    }

    fun handleSignOut() {
        _state.update { s ->
            s.copy(authState = AuthState())
        }
        playFeedbackTone(android.media.ToneGenerator.TONE_CDMA_SOFT_ERROR_LITE, 100)
    }

    /** Modernized 'Card Cull' Tournament Matchmaking Queue delegating directly to CullTournamentEngine */
    fun toggleTournamentQueue() {
        val isCurrentlyActive = _state.value.isTournamentQueueActive
        _state.update { it.copy(isTournamentQueueActive = !isCurrentlyActive) }
        
        if (!isCurrentlyActive) {
            // Joined Matchmaking Queue - let's find an opponent in 4 seconds
            viewModelScope.launch {
                delay(4000)
                if (!_state.value.isTournamentQueueActive) return@launch
                
                // Retrieve user active card
                val activeCard = _state.value.ownedCards.firstOrNull() ?: SatiricalCard(
                    id = 101, name = "THE DON MOST WANTED", rarity = CardRarity.LEGENDARY,
                    powerLevel = 9800, faction = "The Politicos", flavorText = "The face that launched a thousand memes. Puffed chest, pointing fingers.",
                    cloutMultiplier = 5.5, edgeMultiplier = 4.2, apyBoost = 0.48
                )
                
                // Query matching engines
                val currentRating = _state.value.currentPerformanceRating
                val opponent = com.example.math.CullTournamentEngine.searchOpponent(currentRating)
                val winProbability = com.example.math.CullTournamentEngine.calculateVictoryProbability(activeCard, opponent)
                val isVictory = Math.random() < winProbability
                
                // Mathematical Elo Outcome Algorithm based on card power, integrity (durability) and stage progress
                val scoreResult = com.example.math.CullTournamentEngine.calculateScores(activeCard, opponent, isVictory, winProbability)
                val scoreChange = scoreResult.ratingDelta
                val deteriorationStrain = scoreResult.integrityDeteriorationStrain
                val earnedMadx = scoreResult.madxPayout
                
                val newRating = (currentRating + scoreChange).coerceAtLeast(100)
                
                // Save upgraded card attributes to DB
                damageCardState(activeCard.id, deteriorationStrain)
                addEarningsToCard(activeCard.id, earnedMadx)
                
                // Write tournament results to History Entity
                localDao.insertHistory(
                    CardEvolutionHistoryEntity(
                        timestamp = System.currentTimeMillis(),
                        cardId = activeCard.id,
                        cardName = activeCard.name,
                        previousStage = activeCard.evolutionStage,
                        nextStage = activeCard.evolutionStage,
                        type = "PVP",
                        details = "🏆 'CARD CULL' Arena vs ${opponent.name}. ${scoreResult.summaryOfMath} Outcome: ${if (isVictory) "VICTORY (+${scoreChange})" else "DEFEAT (${scoreChange})"}. Rating is now $newRating ELO."
                    )
                )
                
                // Log standard transactions ledger sync
                writeToBlockchainSimulated(
                    cardName = activeCard.name,
                    actionType = "PVP_CULL_TOURNAMENT",
                    hash = "0x" + java.util.UUID.randomUUID().toString().replace("-", "").take(24).uppercase(),
                    stateDesc = "ELO Rated: $newRating | Durability Strain: -${(deteriorationStrain * 100).toInt()}%"
                )
                
                // Play feedback tone
                playFeedbackTone(
                    if (isVictory) android.media.ToneGenerator.TONE_CDMA_CONFIRM 
                    else android.media.ToneGenerator.TONE_CDMA_SOFT_ERROR_LITE, 120
                )
                
                _state.update { s ->
                    s.copy(
                        currentPerformanceRating = newRating,
                        isTournamentQueueActive = false
                    )
                }
            }
        }
    }

    /** Submit decentralized ledger packet logs representing blockchain d'App sync state on lobby exit */
    fun writeToBlockchainSimulated(cardName: String, actionType: String, hash: String, stateDesc: String) {
        val timestamp = java.text.SimpleDateFormat("HH:mm:ss.SSS", java.util.Locale.US).format(java.util.Date())
        val logLine = "🔗 [BLOCKCHAIN_SYNC] $timestamp | txn: $hash | action: $actionType | NFT: '$cardName' -> $stateDesc"
        _state.update { s ->
            s.copy(
                eigenTrustLogs = (listOf(logLine) + s.eigenTrustLogs).take(20)
            )
        }
    }

    /** Increments saga campaign progression increments and writes back to local Room database */
    fun incrementSagaProgressAndSave(chapterId: Int, progressDelta: Float) {
        viewModelScope.launch {
            val list = _state.value.sagaProgress.toMutableList()
            val index = list.indexOfFirst { it.chapterId == chapterId }
            if (index != -1) {
                val current = list[index]
                val nextPercent = (current.completionPercentage + progressDelta).coerceIn(0f, 100f)
                val nextCompleted = nextPercent >= 100f
                val updated = current.copy(
                    completionPercentage = nextPercent,
                    isCompleted = nextCompleted
                )
                list[index] = updated
                localDao.insertSagaProgress(list)
                _state.update { s -> s.copy(sagaProgress = list) }
            }
        }
    }

    /** Update custom inputs for Satirical Daily Forecast */
    fun updateForecastInputs(weather: String, antics: String, scandal: String) {
        _state.update { s ->
            s.copy(
                forecastWeatherInput = weather,
                forecastAnticsInput = antics,
                forecastScandalInput = scandal
            )
        }
    }

    /** Triggers Gemini API call to generate a fresh Satirical Daily Forecast */
    fun fetchDailyForecast() {
        viewModelScope.launch {
            _state.update { s -> s.copy(isDailyForecastLoading = true, dailyForecastError = null) }
            try {
                val current = _state.value
                val result = com.example.engine.GeminiForecastClient.generateSatiricalForecast(
                    weather = current.forecastWeatherInput,
                    antics = current.forecastAnticsInput,
                    scandal = current.forecastScandalInput
                )
                _state.update { s -> s.copy(dailyForecastText = result, isDailyForecastLoading = false) }
            } catch (e: Exception) {
                _state.update { s -> 
                    s.copy(
                        dailyForecastText = null,
                        dailyForecastError = e.localizedMessage ?: "Failed to generate forecast",
                        isDailyForecastLoading = false
                    )
                }
            }
        }
    }

    /** Triggers Gemini to generate satirical market scenarios and appends them to activeScenarios */
    fun fetchSatiricalMarkets() {
        viewModelScope.launch {
            val newMarkets = com.example.engine.GeminiForecastClient.generateSatiricalMarkets(3)
            if (newMarkets.isNotEmpty()) {
                _state.update { s ->
                    val existingAc = s.activeScenarios.toMutableList()
                    existingAc.addAll(0, newMarkets) // Add to top
                    s.copy(activeScenarios = existingAc)
                }
                playFeedbackTone(android.media.ToneGenerator.TONE_CDMA_KEYPAD_VOLUME_KEY_LITE, 80)
            }
        }
    }

    fun analyzeLiarMeterInput(text: String, roastSeverity: Int = 70, memeHumour: Int = 65) {
        val trimmed = text.trim()
        if (trimmed.isEmpty()) return

        viewModelScope.launch {
            _state.update { it.copy(isLiarMeterAnalyzing = true, liarMeterError = null) }
            try {
                try {
                    toneGenerator?.startTone(android.media.ToneGenerator.TONE_PROP_BEEP, 80)
                } catch (e: Exception) {}

                val engine = com.example.engine.LiarMeterEngine()
                val event = com.example.engine.LiarMeterEvent(
                    text = trimmed,
                    speaker = "Analyzing...",
                    category = "Analyzing...",
                    context = "Manual assessment",
                    viralityScore = 0.85,
                    timestamp = System.currentTimeMillis()
                )

                val result = engine.analyzeEventWithGemini(event, roastSeverity, memeHumour)
                
                // Reward player for running an analysis with a small Gambit Credits/MADx drop
                val reward = 50.0 + (10..50).random()
                
                _state.update { 
                    it.copy(
                        liarMeterResult = result, 
                        isLiarMeterAnalyzing = false,
                        madxBalance = it.madxBalance + reward // Add Gambit Credits
                    ) 
                }

                try {
                    toneGenerator?.startTone(android.media.ToneGenerator.TONE_CDMA_CONFIRM, 120)
                } catch (e: Exception) {}
            } catch (e: Exception) {
                _state.update {
                    it.copy(
                        isLiarMeterAnalyzing = false,
                        liarMeterError = "Analysis interrupted: ${e.localizedMessage}"
                    )
                }
            }
        }
    }

    fun toggleSentimentFeed(isOpen: Boolean) {
        _state.update { it.copy(isSentimentFeedOpen = isOpen) }
        if (isOpen && _state.value.sentimentFeedItems.isEmpty()) {
            fetchSentimentFeed()
        }
    }

    fun fetchSentimentFeed() {
        viewModelScope.launch {
            _state.update { s -> s.copy(isSentimentFeedLoading = true, sentimentFeedError = null) }
            try {
                val results = com.example.engine.GeminiSentimentClient.generateSentimentFeedItems()
                _state.update { s -> s.copy(sentimentFeedItems = results, isSentimentFeedLoading = false) }
            } catch (e: Exception) {
                _state.update { s ->
                    s.copy(
                        isSentimentFeedLoading = false,
                        sentimentFeedError = e.localizedMessage ?: "Failed to generate sentiment feed"
                    )
                }
            }
        }
    }

    fun placeBid(auctionId: String, amount: Double) {
        _state.update { s ->
            val auction = s.liveAuctions.find { it.id == auctionId } ?: return@update s
            if (s.madxBalance < amount) {
                try { toneGenerator?.startTone(android.media.ToneGenerator.TONE_CDMA_SOFT_ERROR_LITE, 200) } catch (e: Exception) {}
                return@update s
            }
            if (amount <= auction.currentBid) {
                try { toneGenerator?.startTone(android.media.ToneGenerator.TONE_CDMA_SOFT_ERROR_LITE, 200) } catch (e: Exception) {}
                return@update s
            }
            
            var balanceAdjustment = amount
            if (auction.userPlacedBid) {
                balanceAdjustment -= auction.currentBid
            }

            val updatedAuctions = s.liveAuctions.map {
                if (it.id == auctionId) {
                    val nextHistory = (it.biddingHistory + amount).takeLast(15)
                    it.copy(
                        currentBid = amount,
                        highBidder = "You (Sovereign)",
                        userPlacedBid = true,
                        biddingHistory = nextHistory
                    )
                } else it
            }
            val log = AuctionActivityLog(
                id = java.util.UUID.randomUUID().toString(),
                title = "🎁 Bid Submitted Successfully",
                description = "You filed a new high-bid of ${amount.toInt()} MADx on \"${auction.title}\".",
                type = "BID"
            )
            try { toneGenerator?.startTone(android.media.ToneGenerator.TONE_PROP_ACK, 100) } catch (e: Exception) {}
            s.copy(
                liveAuctions = updatedAuctions,
                auctionActivity = (listOf(log) + s.auctionActivity).take(30),
                madxBalance = s.madxBalance - balanceAdjustment
            )
        }
    }

    fun toggleAuctionTracking(auctionId: String) {
        _state.update { s ->
            val updated = s.liveAuctions.map {
                if (it.id == auctionId) {
                    val nextTrack = !it.isTracked
                    try { toneGenerator?.startTone(android.media.ToneGenerator.TONE_PROP_ACK, 80) } catch (e: Exception) {}
                    it.copy(isTracked = nextTrack)
                } else it
            }
            s.copy(liveAuctions = updated)
        }
    }

    fun updateCreatorCompanyProfile(name: String, website: String, desc: String) {
        _state.update { s ->
            s.copy(
                companyName = name,
                startupWebsite = website,
                companyDescription = desc
            )
        }
        try {
            toneGenerator?.startTone(android.media.ToneGenerator.TONE_CDMA_CONFIRM, 150)
        } catch (e: Exception) {}
    }
}
