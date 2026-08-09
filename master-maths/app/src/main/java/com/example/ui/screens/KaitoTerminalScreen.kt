package com.example.ui.screens
import com.example.ui.components.HoverTooltip
import kotlinx.coroutines.launch
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.horizontalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.components.ChaosMeter
import com.example.ui.components.glassContainerBackground
import androidx.compose.foundation.clickable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.ui.draw.clip
import com.example.ui.theme.*
import com.example.viewmodel.GambitViewModel

@Composable
fun KaitoTerminalScreen(vm: GambitViewModel) {
    val state by vm.state.collectAsState()
    val scroll = rememberScrollState()
    var platformFilter by remember { mutableStateOf("ALL") }
    
    var selectedTrendFilter by remember { mutableStateOf("All Trends") }
    var selectedGeographicFilter by remember { mutableStateOf("All Regions") }
    var selectedPsychographicFilter by remember { mutableStateOf("All Psychological") }
    var selectedCdpFilter by remember { mutableStateOf("All Stats") }

    val coroutineScope = rememberCoroutineScope()
    val advisorMessages = remember {
        mutableStateListOf<Pair<String, String>>(
            Pair("Listen up kid! I'm your MAD Gambit Concierge. Pick one of the protocols below to calibrate your portfolio conviction, or trigger a continuous asset decay check! Let's see what you've got.", "JUST NOW")
        )
    }
    var isAdviceLoading by remember { mutableStateOf(false) }

    Box(modifier = Modifier.fillMaxSize()) {
        Column(
            Modifier
                .fillMaxSize()
                .background(BgDeep)
                .verticalScroll(scroll)
                .padding(0.5.dp),
            verticalArrangement = Arrangement.spacedBy(0.dp)
        ) {
        Column(Modifier.padding(horizontal = 4.dp)) {
            Text(
                "👁️‍🗨️ KAITO SENTIMENT PORTAL", 
                color = NeonCyan, 
                fontSize = 24.sp, 
                fontWeight = FontWeight.Black,
                fontFamily = com.example.ui.theme.ArialNarrowFamily,
                style = TextStyle(shadow = Shadow(NeonCyanDim, blurRadius = 24f)),
                lineHeight = 32.sp
            )
            Text(
                "Mindshare × Emotional Valence × Viral Velocity", 
                color = BrandEggwhite.copy(alpha=0.7f), 
                fontSize = 12.sp,
                fontFamily = com.example.ui.theme.ArialNarrowFamily
            )
        }
        
        com.example.ui.components.BehavioralCycleChart(state.sentimentPhase)

        // Monospace compact telemetry system panel
        com.example.ui.components.DashboardTelemetry(
            vm = vm,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp)
        )

        // Sentiment Phase Banner
        Box(
            Modifier
                .fillMaxWidth()
                .background(Brush.horizontalGradient(listOf(
                    NeonMagenta.copy(alpha=0.3f), NeonCyan.copy(alpha=0.3f), BrandGoldGlow
                )), RoundedCornerShape(12.dp))
                .border(1.dp, Brush.horizontalGradient(listOf(NeonMagenta, NeonCyan)), RoundedCornerShape(12.dp))
                .padding(20.dp)
        ) {
            Row(Modifier.fillMaxWidth(), Arrangement.SpaceBetween, Alignment.CenterVertically) {
                Column {
                    Text("CURRENT PHASE", color = BrandEggwhite, fontSize = 10.5.sp, letterSpacing = 1.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                    Text(
                        state.sentimentPhase.display, 
                        color = BrandGold, 
                        fontSize = 28.sp, 
                        fontWeight = FontWeight.Black,
                        fontFamily = com.example.ui.theme.ArialNarrowFamily,
                        style = TextStyle(shadow = Shadow(BrandGoldGlow, blurRadius = 12f))
                    )
                }
                Text("CYCLE: ${(state.eigenTrustLogs.size % 4) + 1}/4", color = NeonCyan, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontWeight = FontWeight.Bold)
            }
        }

        ChaosMeter(volatility = state.temperature, modifier = Modifier.fillMaxWidth())

        // Advanced Geographic, Psychographic & CDP Filters Panel
        var isAdvancedFiltersExpanded by remember { mutableStateOf(false) }
        val theme = LocalGambitTheme.current
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .glassContainerBackground(theme.brandSecondary, RoundedCornerShape(12.dp))
                .border(1.dp, theme.brandSecondary.copy(alpha = 0.25f), RoundedCornerShape(12.dp))
                .padding(12.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { isAdvancedFiltersExpanded = !isAdvancedFiltersExpanded },
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "🎛️ ADVANCED KAITO PORTAL FILTERS",
                        color = BrandGold,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                    if (selectedTrendFilter != "All Trends" || selectedGeographicFilter != "All Regions" || selectedPsychographicFilter != "All Psychological" || selectedCdpFilter != "All Stats") {
                        Box(
                            modifier = Modifier
                                .padding(start = 8.dp)
                                .size(8.dp)
                                .background(Color(0xFF39FF14), CircleShape)
                        )
                    }
                }
                Text(
                    text = if (isAdvancedFiltersExpanded) "COLLAPSE ▲" else "EXPAND ▼",
                    color = NeonCyan,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
            }

            if (isAdvancedFiltersExpanded) {
                Spacer(Modifier.height(12.dp))
                
                // Trend Filters (Rising, Falling, Most Volatile)
                Text("Trend Status:", color = Color.Gray, fontSize = 9.5.sp, fontFamily = FontFamily.Monospace)
                Spacer(Modifier.height(4.dp))
                Row(modifier = Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    listOf("All Trends", "Rising", "Falling", "Most Volatile").forEach { t ->
                        val isSelected = selectedTrendFilter == t
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(if (isSelected) NeonCyan.copy(alpha = 0.25f) else Color.Transparent)
                                .border(1.dp, if (isSelected) NeonCyan else Color.Gray.copy(alpha = 0.4f), RoundedCornerShape(6.dp))
                                .clickable { selectedTrendFilter = t }
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(t, color = if (isSelected) Color.White else Color.LightGray, fontSize = 9.5.sp, fontFamily = FontFamily.Monospace)
                        }
                    }
                }

                Spacer(Modifier.height(10.dp))

                // Geographic Filters
                Text("Geographic Scope:", color = Color.Gray, fontSize = 9.5.sp, fontFamily = FontFamily.Monospace)
                Spacer(Modifier.height(4.dp))
                Row(modifier = Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    listOf("All Regions", "US", "EU", "APAC", "Global").forEach { g ->
                        val isSelected = selectedGeographicFilter == g
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(if (isSelected) NeonMagenta.copy(alpha = 0.25f) else Color.Transparent)
                                .border(1.dp, if (isSelected) NeonMagenta else Color.Gray.copy(alpha = 0.4f), RoundedCornerShape(6.dp))
                                .clickable { selectedGeographicFilter = g }
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(g, color = if (isSelected) Color.White else Color.LightGray, fontSize = 9.5.sp, fontFamily = FontFamily.Monospace)
                        }
                    }
                }

                Spacer(Modifier.height(10.dp))

                // Psychographic Filters
                Text("Psychographic Bias:", color = Color.Gray, fontSize = 9.5.sp, fontFamily = FontFamily.Monospace)
                Spacer(Modifier.height(4.dp))
                Row(modifier = Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    listOf("All Psychological", "FOMO Surge", "Doomer Hedging", "Degen Overdrive", "Skeptical Logic").forEach { p ->
                        val isSelected = selectedPsychographicFilter == p
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(if (isSelected) NeonPurple.copy(alpha = 0.25f) else Color.Transparent)
                                .border(1.dp, if (isSelected) NeonPurple else Color.Gray.copy(alpha = 0.4f), RoundedCornerShape(6.dp))
                                .clickable { selectedPsychographicFilter = p }
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(p, color = if (isSelected) Color.White else Color.LightGray, fontSize = 9.5.sp, fontFamily = FontFamily.Monospace)
                        }
                    }
                }

                Spacer(Modifier.height(10.dp))

                // CDP Stats / Impressions / Volatility Filters
                Text("CDP & Social Metrics:", color = Color.Gray, fontSize = 9.5.sp, fontFamily = FontFamily.Monospace)
                Spacer(Modifier.height(4.dp))
                Row(modifier = Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    listOf("All Stats", "CDP Mindshare High", "Impressions > 100K", "Maximum Volatility").forEach { c ->
                        val isSelected = selectedCdpFilter == c
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(if (isSelected) BrandGold.copy(alpha = 0.25f) else Color.Transparent)
                                .border(1.dp, if (isSelected) BrandGold else Color.Gray.copy(alpha = 0.4f), RoundedCornerShape(6.dp))
                                .clickable { selectedCdpFilter = c }
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(c, color = if (isSelected) Color.White else Color.LightGray, fontSize = 9.5.sp, fontFamily = FontFamily.Monospace)
                        }
                    }
                }
            }
        }

        Spacer(Modifier.height(12.dp))

        // Platform Filter
        Text("ATTENTION DISPERSION", color = NeonCyan, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ArialNarrowFamily, letterSpacing = 1.sp)
        
        Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("ALL", "TWITTER", "DISCORD", "TELEGRAM").forEach { p ->
                HoverTooltip(text = "Filter sentiment and liquidity traces by $p channels.") {
                    FilterChip(
                        selected = platformFilter == p,
                        onClick = { platformFilter = p },
                        label = { Text(p, fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = NeonCyan, 
                            selectedLabelColor = BgDeep,
                            containerColor = BgPanel,
                            labelColor = BrandEggwhite
                        ),
                        border = FilterChipDefaults.filterChipBorder(enabled = true, selected = platformFilter == p, borderColor = NeonCyan)
                    )
                }
            }
        }

        Spacer(Modifier.height(12.dp))

        // Dynamic Calculations Based on Selected Advanced Filters
        val computedMindshare = remember(state.eigenTrustLogs.size, selectedTrendFilter, selectedPsychographicFilter) {
            val base = (45 + state.eigenTrustLogs.size * 2) % 100
            val tBonus = if (selectedTrendFilter == "Rising") 15 else if (selectedTrendFilter == "Falling") -10 else 0
            val pBonus = if (selectedPsychographicFilter == "FOMO Surge") 22 else if (selectedPsychographicFilter == "Skeptical Logic") -12 else 0
            (base + tBonus + pBonus).coerceIn(5, 99)
        }

        val computedValence = remember(state.temperature, selectedCdpFilter, selectedTrendFilter) {
            val base = state.temperature
            val cBonus = if (selectedCdpFilter == "Maximum Volatility") 0.45f else 0.1f
            val tBonus = if (selectedTrendFilter == "Most Volatile") 0.35f else 0f
            base + cBonus + tBonus
        }

        val computedVelocity = remember(state.ownedCards.size, selectedGeographicFilter, selectedPsychographicFilter) {
            val base = (80 + state.ownedCards.size * 3) % 100
            val gBonus = if (selectedGeographicFilter == "US") 12 else if (selectedGeographicFilter == "EU") 8 else 0
            val pBonus = if (selectedPsychographicFilter == "Degen Overdrive") 18 else 0
            (base + gBonus + pBonus).coerceIn(10, 99)
        }

        // Metrics Grid
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            KaitoMetricBox("MINDSHARE", "$computedMindshare%", NeonGreen, Modifier.weight(1f))
            KaitoMetricBox("VALENCE", "${"%.2f".format(computedValence)}", NeonMagenta, Modifier.weight(1f))
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            KaitoMetricBox("VIRAL VELOCITY", "$computedVelocity", BrandGold, Modifier.weight(1f))
            KaitoMetricBox("BOT REJECTS", "${state.eigenTrustLogs.count { it.contains("SYBIL") }}", BrandCrimson, Modifier.weight(1f))
        }

        Text("EIGENTRUST LOG STREAM", color = NeonGreen, fontWeight = FontWeight.Black, fontFamily = com.example.ui.theme.ArialNarrowFamily, letterSpacing = 1.sp)
        
        Box(
            Modifier
                .fillMaxWidth()
                .background(Color(0xFF030303), RoundedCornerShape(12.dp))
                .border(1.dp, NeonGreen.copy(alpha=0.3f), RoundedCornerShape(12.dp))
                .padding(16.dp)
        ) {
            Column {
                state.eigenTrustLogs.takeLast(10).forEach { log ->
                    Text(
                        log, 
                        color = if (log.contains("SYBIL")) BrandCrimson else NeonGreen, 
                        fontSize = 11.sp, 
                        fontFamily = com.example.ui.theme.ArialNarrowFamily, 
                        modifier = Modifier.padding(vertical = 2.dp)
                    )
                }
            }
        }

        Spacer(Modifier.height(20.dp))

        // MADHAT'R TETHERED CONVICTION ADVISOR (NEONCYAN ACCENT, ZERO SHADOW, SURGICAL BORDER)
        Text(
            text = "🎩 MADHAT'R TETHERED CONVICTION ADVISOR",
            color = NeonCyan,
            fontWeight = FontWeight.Black,
            fontFamily = com.example.ui.theme.ArialNarrowFamily,
            letterSpacing = 1.sp
        )
        
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xFF070B11), RoundedCornerShape(12.dp))
                .border(1.dp, NeonCyan.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
                .padding(16.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                // Render Advisor Chat Bubbles
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 280.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    advisorMessages.forEach { (msg, time) ->
                        com.example.ui.components.MadAgentChatBubble(
                            message = msg,
                            timestamp = time,
                            agentName = "The MADHAT'r",
                            onRegenerate = { intensity ->
                                if (!isAdviceLoading) {
                                    coroutineScope.launch {
                                        isAdviceLoading = true
                                        val portStatus = "Credits: ${state.madxBalance} MADX, Staked: ${state.stakedMadxBalance} MADX"
                                        val trends = "Sentiment Phase: ${state.sentimentPhase.display}, Volatility Temp: ${state.temperature}"
                                        val convState = "Performance Rating: ${state.currentPerformanceRating}, Total Predictions: ${state.totalPredictions}"
                                        
                                        val regeneratedAdvice = com.example.engine.GeminiForecastClient.generateTetheredAdvice(
                                            portfolioStatus = portStatus,
                                            marketTrends = trends,
                                            convictionState = convState,
                                            intensity = intensity
                                        )
                                        
                                        val levelLabel = if (intensity >= 2) "🔥 ROAST (MAX)" else "🔄 REGEN"
                                        advisorMessages.add(Pair(regeneratedAdvice, levelLabel))
                                        isAdviceLoading = false
                                    }
                                }
                            }
                        )
                    }
                    if (isAdviceLoading) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            CircularProgressIndicator(color = NeonCyan, modifier = Modifier.size(24.dp))
                        }
                    }
                }

                Divider(color = NeonCyan.copy(alpha = 0.2f), thickness = 1.dp)

                // Interactive Protocol Selector Buttons
                Text(
                    text = "SELECT NEURAL CONVICTION PROTOCOL:",
                    color = Color.Gray,
                    fontSize = 9.sp,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // Option 1: Portfolio Risk
                    Button(
                        onClick = {
                            if (!isAdviceLoading) {
                                coroutineScope.launch {
                                    isAdviceLoading = true
                                    val portStatus = "Credits: ${state.madxBalance} MADX, Staked Balance: ${state.stakedMadxBalance} MADX"
                                    val trends = "Sentiment Phase: ${state.sentimentPhase.display}, Volatility Temp: ${state.temperature}"
                                    val convState = "Total Convictions: ${state.totalConvictions}, Performance Rating: ${state.currentPerformanceRating}"
                                    
                                    val advice = com.example.engine.GeminiForecastClient.generateTetheredAdvice(
                                        portfolioStatus = portStatus,
                                        marketTrends = trends,
                                        convictionState = convState
                                    )
                                    advisorMessages.add(Pair(advice, "ADVICE"))
                                    isAdviceLoading = false
                                }
                            }
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color.Transparent,
                            contentColor = NeonCyan
                        ),
                        modifier = Modifier
                            .weight(1f)
                            .border(1.dp, NeonCyan.copy(alpha = 0.6f), RoundedCornerShape(8.dp)),
                        contentPadding = PaddingValues(horizontal = 4.dp, vertical = 6.dp)
                    ) {
                        Text("PORTFOLIO RISK", fontSize = 9.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                    }

                    // Option 2: Market Sentiment
                    Button(
                        onClick = {
                            if (!isAdviceLoading) {
                                coroutineScope.launch {
                                    isAdviceLoading = true
                                    val portStatus = "Credits: ${state.madxBalance} MADX, Active Cards: ${state.ownedCards.size}"
                                    val trends = "Current Phase: ${state.sentimentPhase.display}, Global BS Level: ${state.dailyBsLevel}%"
                                    val convState = "Performance Rating: ${state.currentPerformanceRating}, Total Predictions: ${state.totalPredictions}"
                                    
                                    val advice = com.example.engine.GeminiForecastClient.generateTetheredAdvice(
                                        portfolioStatus = portStatus,
                                        marketTrends = trends,
                                        convictionState = convState
                                    )
                                    advisorMessages.add(Pair(advice, "SENTIMENT"))
                                    isAdviceLoading = false
                                }
                            }
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color.Transparent,
                            contentColor = NeonCyan
                        ),
                        modifier = Modifier
                            .weight(1f)
                            .border(1.dp, NeonCyan.copy(alpha = 0.6f), RoundedCornerShape(8.dp)),
                        contentPadding = PaddingValues(horizontal = 4.dp, vertical = 6.dp)
                    ) {
                        Text("VALENCE SENTIMENT", fontSize = 9.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                    }

                    // Option 3: Test Asset Decay Subscriber alert
                    Button(
                        onClick = {
                            // Subscribe to asset decay alerts from ConvictionMathEngine
                            val subscriber = object : com.example.math.ConvictionMathEngine.DecayAlertSubscriber {
                                override fun onDecayAlert(assetName: String, decayFactor: Double, commentary: String) {
                                    advisorMessages.add(Pair(commentary, "DECAY ALERT"))
                                }
                            }

                            com.example.math.ConvictionMathEngine.subscribe(subscriber)
                            
                            // Trigger check for active perpetual positions that are decaying
                            com.example.math.ConvictionMathEngine.checkDecayAlerts("PEPE-PERP", 0.18, 6.0, 0.5) // e^(-1.08) = 0.339 < 0.5 -> fires!
                            com.example.math.ConvictionMathEngine.checkDecayAlerts("WOKE-COIN", 0.25, 5.0, 0.4) // e^(-1.25) = 0.286 < 0.4 -> fires!
                            
                            // Unsubscribe cleanly
                            com.example.math.ConvictionMathEngine.unsubscribe(subscriber)
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color.Transparent,
                            contentColor = NeonCyan
                        ),
                        modifier = Modifier
                            .weight(1f)
                            .border(1.dp, NeonCyan.copy(alpha = 0.6f), RoundedCornerShape(8.dp)),
                        contentPadding = PaddingValues(horizontal = 4.dp, vertical = 6.dp)
                    ) {
                        Text("TEST ASSET DECAY", fontSize = 9.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                    }
                }

                Spacer(Modifier.height(4.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = {
                            val portStatus = "Credits: ${state.madxBalance} MADX, Staked Balance: ${state.stakedMadxBalance} MADX"
                            val historyList = listOf(
                                "Staked 500 MADX on BTC-UP Perp",
                                "Decay trigger executed on WOKE-COIN position",
                                "Claimed 1200 MADX reward on sentiment shift"
                            )
                            val trendMetrics = mapOf(
                                "Phase" to state.sentimentPhase.display,
                                "Global BS Level" to "${state.dailyBsLevel}%",
                                "Volatility Temperature" to "${state.temperature}"
                            )
                            
                            val promptContext = com.example.engine.GeminiForecastClient.mapConvictionHistoryAndTrendsToPrompt(
                                convictionState = portStatus,
                                convictionHistory = historyList,
                                marketTrendData = trendMetrics,
                                isHighVolatilityMode = true
                            )
                            
                            advisorMessages.add(Pair("Formatted prompt mapping successful! Fed context into neural buffer:\n\n$promptContext", "NEURAL MAP SUCCESS"))
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color.Transparent,
                            contentColor = NeonCyan
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.dp, NeonCyan, RoundedCornerShape(8.dp)),
                        contentPadding = PaddingValues(horizontal = 4.dp, vertical = 6.dp)
                    ) {
                        Text("⚡ MAP CONVICTION HISTORY & TRENDS TO NEURAL CONTEXT PROMPT", fontSize = 9.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                    }
                }
            }
        } // End of Column inside Box
    } // End of Box inside Column
        
        // Quick Roast FAB
        FloatingActionButton(
            onClick = {
                if (!isAdviceLoading) {
                    coroutineScope.launch {
                        isAdviceLoading = true
                        val activePositions = state.ownedCards.map { Pair(it.name, 1.0 - it.durability) }
                        val summary = com.example.math.ConvictionMathEngine.summarizeMarketState(
                            madxBalance = state.madxBalance,
                            stakedBalance = state.stakedMadxBalance,
                            activePositions = activePositions.ifEmpty { listOf(Pair("WOKE-COIN", 0.25), Pair("PEPE-PERP", 0.18)) },
                            timeElapsed = 5.0
                        )
                        val promptContext = "Quick Roast requested via HUD overlay. Context:\n$summary"
                        val quickRoast = com.example.engine.GeminiForecastClient.generateTetheredAdvice(
                            portfolioStatus = "QUICK ROAST OF DECAYING ASSETS",
                            marketTrends = promptContext,
                            convictionState = "HIGH EXPOSURE TO EXTREME SATIRE",
                            intensity = 2
                        )
                        advisorMessages.add(Pair(quickRoast, "🔥 QUICK ROAST"))
                        isAdviceLoading = false
                        com.example.engine.MadhatrVoice.speak(quickRoast)
                    }
                }
            },
            containerColor = NeonCyan,
            contentColor = Color.Black,
            shape = CircleShape,
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(24.dp)
                .border(2.dp, Color.White, CircleShape)
        ) {
            Text(
                "🎩🔥", 
                fontSize = 24.sp, 
                fontWeight = FontWeight.Bold
            )
        }
    } // End of Box
}

@Composable
fun KaitoMetricBox(label: String, value: String, color: Color, modifier: Modifier = Modifier) {
    Box(
        modifier
            .background(BgCard.copy(alpha = 0.15f), RoundedCornerShape(16.dp))
            .border(1.dp, color.copy(alpha=0.3f), RoundedCornerShape(16.dp))
            .padding(16.dp)
    ) {
        Column {
            Text(label, color = BrandEggwhite.copy(alpha=0.7f), fontSize = 10.5.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
            Spacer(Modifier.height(4.dp))
            Text(
                value, 
                color = color, 
                fontSize = 24.sp, 
                fontWeight = FontWeight.Black, 
                fontFamily = com.example.ui.theme.ArialNarrowFamily,
                style = TextStyle(shadow = Shadow(color.copy(alpha=0.5f), blurRadius = 12f))
            )
        }
    }
}
