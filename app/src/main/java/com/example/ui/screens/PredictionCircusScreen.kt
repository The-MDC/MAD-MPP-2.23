package com.example.ui.screens
import com.example.ui.components.HoverTooltip
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.clickable
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.foundation.Canvas
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import java.util.Calendar
import kotlinx.coroutines.delay
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.math.GambitMath
import com.example.ui.components.NeonSlider
import com.example.ui.theme.*
import com.example.viewmodel.GambitViewModel
import com.example.model.MarketType
import com.example.model.Scenario
import com.example.model.HighStakesActivity
import com.example.engine.AnalysisResult
import androidx.compose.foundation.BorderStroke
import androidx.compose.animation.core.*

import com.example.ui.components.SeikoClockWidget
import com.example.ui.components.glassContainerBackground
import com.example.ui.components.TopHottestCarousel
import com.example.ui.components.CustomizableMetricsCarousel
import com.example.ui.components.DopamineBurstEffect

import androidx.compose.ui.text.style.TextAlign

@Composable
fun PredictionCircusScreen(vm: GambitViewModel) {
    val state by vm.state.collectAsState()
    val theme = LocalGambitTheme.current
    val scroll = rememberScrollState()
    var selectedCategory by remember { mutableStateOf("All") }
    val categories = listOf("All", "Liar Meter", "Crypto", "Geopolitics", "Culture", "Tech")
    
    var showDailySummary by remember { mutableStateOf(false) }
    val showProposeModal by vm.showProposeModal.collectAsState()

    if (showProposeModal) {
        var title by remember { mutableStateOf("") }
        var selectedCat by remember { mutableStateOf("Crypto") }
        var selectedType by remember { mutableStateOf(MarketType.BINARY) }
        var lockWeeks by remember { mutableStateOf(4) }
        var isLiarMeter by remember { mutableStateOf(false) }
        
        var outcomesList by remember { mutableStateOf(listOf("YES", "NO")) }
        var newOutcomeText by remember { mutableStateOf("") }

        AlertDialog(
            onDismissRequest = { vm.setShowProposeModal(false) },
            containerColor = BgCard,
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, NeonCyan.copy(alpha = 0.5f), RoundedCornerShape(16.dp))
                .shadow(16.dp, RoundedCornerShape(16.dp), spotColor = NeonCyan),
            title = {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "🔮 PROPOSE SATIRICAL MARKET",
                        color = BrandGold,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = FontFamily.Monospace,
                        style = TextStyle(shadow = Shadow(BrandGoldGlow, blurRadius = 12f))
                    )
                    IconButton(onClick = { vm.setShowProposeModal(false) }) {
                        Text("❌", fontSize = 12.sp)
                    }
                }
            },
            text = {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 380.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text(
                        "PROPOSALS ARE CONVERTED IN REAL-TIME VIA OUR SATIRE COMPRESSION SCRAPER.",
                        color = Color.LightGray,
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace
                    )

                    // 1. Title Input
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("EVENT TITLE", color = NeonCyan, fontSize = 9.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                            Text("${title.length}/75", color = Color.Gray, fontSize = 9.sp, fontFamily = FontFamily.Monospace)
                        }
                        OutlinedTextField(
                            value = title,
                            onValueChange = { if (it.length <= 75) title = it },
                            placeholder = { Text("e.g. SBF attempts to write memoir", color = Color.Gray, fontSize = 12.sp) },
                            modifier = Modifier.fillMaxWidth(),
                            textStyle = TextStyle(color = Color.White, fontSize = 13.sp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = NeonCyan,
                                unfocusedBorderColor = Color.DarkGray,
                                cursorColor = NeonCyan
                            ),
                            singleLine = true
                        )
                    }

                    // 2. Category selection
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text("MARKET CATEGORY", color = NeonPink, fontSize = 9.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            listOf("Crypto", "Geopolitics", "Culture", "Tech").forEach { cat ->
                                val isSel = selectedCat == cat
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(if (isSel) NeonPink.copy(alpha = 0.25f) else BgDeep)
                                        .border(1.dp, if (isSel) NeonPink else Color.DarkGray, RoundedCornerShape(6.dp))
                                        .clickable { selectedCat = cat; vm.playFeedbackTone(android.media.ToneGenerator.TONE_PROP_ACK, 50) }
                                        .padding(vertical = 8.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(cat, color = if (isSel) Color.White else Color.Gray, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }

                    // 3. Market Type selection
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text("MARKET OUTCOME TYPE", color = BrandGold, fontSize = 9.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            listOf(MarketType.BINARY, MarketType.OVER_UNDER, MarketType.PROGRESSIVE).forEach { type ->
                                val isSel = selectedType == type
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(if (isSel) BrandGold.copy(alpha = 0.25f) else BgDeep)
                                        .border(1.dp, if (isSel) BrandGold else Color.DarkGray, RoundedCornerShape(6.dp))
                                        .clickable { 
                                            selectedType = type
                                            outcomesList = when (type) {
                                                MarketType.BINARY -> listOf("YES", "NO")
                                                MarketType.OVER_UNDER -> listOf("OVER", "UNDER")
                                                MarketType.PROGRESSIVE -> listOf("BUY_TARGET_MET", "SHORT_PROGRESS")
                                                else -> listOf("YES", "NO")
                                            }
                                            vm.playFeedbackTone(android.media.ToneGenerator.TONE_PROP_ACK, 50)
                                        }
                                        .padding(vertical = 8.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(type.name, color = if (isSel) Color.White else Color.Gray, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }

                    // 4. Lock weeks slider
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("MUTUAL COGNITIVE LOCK PERIOD", color = Color.Gray, fontSize = 9.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                            Text("$lockWeeks WEEKS", color = NeonCyan, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        }
                        Slider(
                            value = lockWeeks.toFloat(),
                            onValueChange = { 
                                val rw = it.toInt()
                                if (rw != lockWeeks) {
                                    lockWeeks = rw
                                    vm.playFeedbackTone(android.media.ToneGenerator.TONE_PROP_BEEP, 30)
                                }
                            },
                            valueRange = 1f..12f,
                            colors = SliderDefaults.colors(
                                thumbColor = NeonCyan,
                                activeTrackColor = NeonCyan,
                                inactiveTrackColor = Color.DarkGray
                            )
                        )
                    }

                    // 5. Liar Meter Toggle
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color.Black.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                            .border(1.dp, if (isLiarMeter) BrandCrimson else Color.DarkGray, RoundedCornerShape(8.dp))
                            .clickable { isLiarMeter = !isLiarMeter; vm.playFeedbackTone(android.media.ToneGenerator.TONE_PROP_ACK, 60) }
                            .padding(10.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("🚨 DEPLOY AS 'LIAR METER' SENTINEL", color = if (isLiarMeter) BrandCrimson else Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                            Text("Detect phantom/hallucinated headlines using predictive sentinel engines.", color = Color.Gray, fontSize = 9.sp)
                        }
                        Checkbox(
                            checked = isLiarMeter,
                            onCheckedChange = { isLiarMeter = it },
                            colors = CheckboxDefaults.colors(
                                checkedColor = BrandCrimson,
                                checkmarkColor = Color.White
                            )
                        )
                    }

                    // 6. Canned options & outcome options
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text("CANNED OUTCOMES / PREDICTION OPTIONS", color = NeonGreen, fontSize = 9.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                        
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            outcomesList.forEach { outcome ->
                                Box(
                                    modifier = Modifier
                                        .background(BgDeep, RoundedCornerShape(6.dp))
                                        .border(1.dp, NeonGreen.copy(alpha = 0.4f), RoundedCornerShape(6.dp))
                                        .padding(horizontal = 8.dp, vertical = 6.dp)
                                ) {
                                    Text(outcome, color = NeonGreen, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                                }
                            }
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            OutlinedTextField(
                                value = newOutcomeText,
                                onValueChange = { if (it.length <= 20) newOutcomeText = it },
                                placeholder = { Text("Add custom outcome (max 20 char)", color = Color.Gray, fontSize = 11.sp) },
                                modifier = Modifier.weight(1f),
                                textStyle = TextStyle(color = Color.White, fontSize = 11.sp),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = NeonGreen,
                                    unfocusedBorderColor = Color.DarkGray
                                ),
                                singleLine = true
                            )
                            Button(
                                onClick = {
                                    val formatted = newOutcomeText.uppercase().trim()
                                    if (formatted.isNotBlank() && outcomesList.size < 10 && !outcomesList.contains(formatted)) {
                                        outcomesList = outcomesList + formatted
                                        newOutcomeText = ""
                                        vm.playFeedbackTone(android.media.ToneGenerator.TONE_CDMA_PIP, 60)
                                    }
                                },
                                enabled = newOutcomeText.isNotBlank() && outcomesList.size < 10,
                                colors = ButtonDefaults.buttonColors(containerColor = NeonGreen, contentColor = BgDeep),
                                contentPadding = PaddingValues(horizontal = 10.dp)
                            ) {
                                Text("+", fontSize = 14.sp, fontWeight = FontWeight.Black)
                            }
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (title.isNotBlank()) {
                            vm.proposeScenario(
                                name = title,
                                category = selectedCat,
                                marketType = selectedType,
                                lockWeeks = lockWeeks,
                                isLiarMeter = isLiarMeter,
                                cannedOutcomes = outcomesList
                            )
                            vm.setShowProposeModal(false)
                        }
                    },
                    enabled = title.isNotBlank(),
                    colors = ButtonDefaults.buttonColors(containerColor = NeonCyan, contentColor = BgDeep),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("🔥 INITIALIZE SATIRE CONVERSION SYNAPSE 🔥", fontWeight = FontWeight.Black, fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                }
            }
        )
    }

    if (showDailySummary) {
        val topScenarios = state.activeScenarios.sortedByDescending { it.crowdConvictionSpeed }.take(5)
        val hasLiarEngine = topScenarios.any { it.tag == "[SENTINEL]" } // Pretending SENTINEL means Liar Engine
        val narrative = "Today's market is buzzing with ${topScenarios.firstOrNull()?.name}. " +
                "We are seeing extreme volatility across ${topScenarios.size} top tracked pairs! " +
                if (hasLiarEngine) "Beware! The Liar Engine has detected an influx of hallucinated narratives injecting phantom momentum!" 
                else "Looks like standard organic chaos today."
                
        AlertDialog(
            onDismissRequest = { showDailySummary = false },
            containerColor = BgCard,
            title = { Text("MAD NEWS: Daily Summary", color = BrandGold, fontWeight = FontWeight.Black) },
            text = { Text(narrative, color = BrandEggwhite, fontSize = 14.sp) },
            confirmButton = {
                OutlinedButton(
                    onClick = { showDailySummary = false },
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = NeonCyan)
                ) { Text("Dismiss") }
            }
        )
    }

    Box(Modifier.fillMaxSize()) {
        Column(
            Modifier
                .fillMaxSize()
                .background(BgDeep)
                .verticalScroll(scroll)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
        if (state.isOfflineCache) {
            Box(
                Modifier
                    .fillMaxWidth()
                    .glassContainerBackground(com.example.ui.theme.NeonGreen, RoundedCornerShape(8.dp))
                    .border(1.dp, com.example.ui.theme.NeonGreen.copy(alpha=0.5f), RoundedCornerShape(8.dp))
                    .padding(8.dp),
                contentAlignment = Alignment.Center
            ) {
                Text("🟢 SECURE DIRECT NODE SELECTED - COGNITIVE CACHE SYNCHRONIZED [100% ONLINE]", color = GlowWhite, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
            }
        }
        
        SeikoClockWidget(vm)
        
        val equippedCard = state.ownedCards.firstOrNull() ?: com.example.model.SatiricalCard(
            id = 101,
            name = "THE DON MOST WANTED",
            rarity = com.example.model.CardRarity.LEGENDARY,
            powerLevel = 9800,
            faction = "The Politicos",
            flavorText = "The face that launched a thousand memes.",
            cloutMultiplier = 5.5,
            edgeMultiplier = 4.2,
            apyBoost = 0.48,
            durability = 1.0,
            evolutionStage = 1,
            earnsCount = 0.0
        )

        MadGambitGameLobbyLobby(vm, equippedCard)

        SatiricalDailyForecastWidget(vm)
        
        LiarMeterMarketsWidget(vm)
        
        TopHottestCarousel(state.activeScenarios)

        HighStakesFeedPanel(state.highStakesFeed)

        // Pinned Markets
        if (state.bookmarkedScenarioIds.isNotEmpty()) {
            Text("📌 PINNED MARKETS", color = BrandGold, fontSize = 14.sp, fontWeight = FontWeight.Bold)
            val pinned = state.activeScenarios.filter { state.bookmarkedScenarioIds.contains(it.id) }
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                pinned.forEach { sc ->
                    Row(
                        Modifier
                            .fillMaxWidth()
                            .glassContainerBackground(theme.brandSecondary, RoundedCornerShape(8.dp))
                            .border(1.dp, GoldFlakeBrush, RoundedCornerShape(8.dp))
                            .padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(sc.name, color = BrandEggwhite, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                            Text(sc.tag, color = NeonCyan, fontSize = 10.sp)
                        }
                        IconButton(onClick = { vm.toggleBookmark(sc.id) }) {
                            Text("❌", fontSize = 12.sp)
                        }
                    }
                }
            }
        }

        Box(Modifier.padding(horizontal = 4.dp)) {
            Column {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        "📊 Conv!ction-Pred!ction Circus", 
                        color = BrandGold, 
                        fontSize = 16.sp, // Reduced by 40%
                        fontWeight = FontWeight.Black, 
                        fontFamily = com.example.ui.theme.ArialNarrowFamily,
                        style = TextStyle(
                            shadow = Shadow(BrandGoldGlow, blurRadius = 24f)
                        )
                    )
                    OutlinedButton(
                        onClick = { showDailySummary = true },
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = NeonCyan),
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp)
                    ) {
                        Text("📜 DAILY SUM", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    }
                }
                
                Text(
                    "WE TURN SOCIAL OUTRAGE INTO A PLAYABLE ASSET CLASS.", 
                    color = NeonPink, 
                    fontSize = 14.sp,
                    fontFamily = com.example.ui.theme.ArialNarrowFamily,
                    fontWeight = FontWeight.Bold,
                )
                
                Spacer(Modifier.height(8.dp))
                
                // Categories Filter
                ScrollableTabRow(
                    selectedTabIndex = categories.indexOf(selectedCategory),
                    containerColor = Color.Transparent,
                    contentColor = NeonCyan,
                    edgePadding = 0.dp,
                    divider = {}
                ) {
                    categories.forEach { cat ->
                        Tab(
                            selected = selectedCategory == cat,
                            onClick = { selectedCategory = cat },
                            text = { Text(cat, fontSize = 12.sp, fontWeight = FontWeight.Bold) }
                        )
                    }
                }
                
                Spacer(Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("⭐ PREDICTION (The Game)", color = NeonCyan, fontSize = 10.5.sp, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                    Text("🔮 CONVICTION (The Stake)", color = BrandGold, fontSize = 10.5.sp, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                    Text("💔 AFFLICTION (The Hook)", color = NeonPink, fontSize = 10.5.sp, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                }
                Spacer(Modifier.height(16.dp))

                NeonSlider("Market Temperature (τ)", state.temperature, { vm.setTemperature(it) }, 0.1f..1.0f)
                
                Spacer(Modifier.height(8.dp))
                Text(
                    "τ LOW = SHARP ALLOCATION | τ HIGH = BROAD DISTRIBUTION", 
                    color = Color.Gray, 
                    fontSize = 10.5.sp,
                    fontFamily = com.example.ui.theme.ArialNarrowFamily,
                    letterSpacing = 1.sp
                )
            }
        }
        
        Spacer(Modifier.height(8.dp))
        MarketVolatilityGauge(state)
        Spacer(Modifier.height(8.dp))
        
        com.example.ui.components.ConvictionTrendsChart(trendHistory = state.trendHistory)

        Spacer(Modifier.height(12.dp))
        ConvictionMarketplaceWidget(vm)
        Spacer(Modifier.height(12.dp))

        val filteredScenarios = state.activeScenarios.filter {
            when (selectedCategory) {
                "All" -> true
                "Liar Meter" -> it.tag == "[SENTINEL]"
                else -> it.category == selectedCategory
            }
        }
        
        if (selectedCategory == "Liar Meter") {
            Box(
                Modifier
                    .fillMaxWidth()
                    .glassContainerBackground(BrandCrimson, RoundedCornerShape(12.dp))
                    .border(1.dp, BrandCrimson.copy(alpha=0.6f), RoundedCornerShape(12.dp))
                    .padding(16.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "🚨 ACTIVE LIAR SENTINELS",
                            color = BrandCrimson,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.Monospace,
                            style = TextStyle(shadow = Shadow(BrandCrimson, blurRadius = 8f))
                        )
                        Text(
                            "92% ACCURACY ENGINE",
                            color = Color.LightGray,
                            fontSize = 9.sp,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                    Text(
                        "Tracking predictive sentinel narrative anomalies. The Liar Engine has detected an influx of hallucinated narratives injecting phantom momentum into public streams.",
                        color = Color.White.copy(alpha=0.8f),
                        fontSize = 11.sp,
                        lineHeight = 16.sp
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Box(Modifier.weight(1f).background(BrandCrimson.copy(alpha=0.15f), RoundedCornerShape(4.dp)).border(1.dp, BrandCrimson.copy(alpha=0.3f), RoundedCornerShape(4.dp)).padding(8.dp)) {
                            Column {
                                Text("SENTINEL THRESHOLD", color = Color.Gray, fontSize = 8.sp, fontFamily = FontFamily.Monospace)
                                Text("98.7% Anomalous", color = BrandCrimson, fontSize = 11.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                            }
                        }
                        Box(Modifier.weight(1f).background(NeonCyan.copy(alpha=0.15f), RoundedCornerShape(4.dp)).border(1.dp, NeonCyan.copy(alpha=0.3f), RoundedCornerShape(4.dp)).padding(8.dp)) {
                            Column {
                                Text("PURGE RATIO", color = Color.Gray, fontSize = 8.sp, fontFamily = FontFamily.Monospace)
                                Text("4.21M MADx Purged", color = NeonCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                            }
                        }
                    }
                }
            }
            Spacer(Modifier.height(8.dp))
        }

        filteredScenarios.forEach { sc ->
            val idx = state.activeScenarios.indexOf(sc)
            val alloc = state.allocations.getOrNull(idx) ?: 0.0
            val delta = GambitMath.calculateDeltaLimit(100.0, sc.baseMultiplier)
            
            Box(
                Modifier
                    .fillMaxWidth()
                    .shadow(elevation = 16.dp, RoundedCornerShape(20.dp), spotColor = NeonCyan.copy(alpha = 0.15f))
                    .glassContainerBackground(theme.brandSecondary, RoundedCornerShape(20.dp))
                    .border(1.dp, GoldFlakeBrush, RoundedCornerShape(20.dp))
                    .padding(24.dp)
            ) {
                Column {
                    Row(Modifier.fillMaxWidth(), Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text(
                                    "CONVICTION MARKET", 
                                    color = BrandGold, 
                                    fontSize = 9.5.sp, 
                                    fontFamily = com.example.ui.theme.ArialNarrowFamily,
                                    fontWeight = FontWeight.Bold,
                                    letterSpacing = 2.sp
                                )
                                IconButton(onClick = { vm.toggleBookmark(sc.id) }, modifier = Modifier.size(24.dp)) {
                                    Text(if(state.bookmarkedScenarioIds.contains(sc.id)) "📌" else "📍", fontSize = 12.sp)
                                }
                            }
                            Spacer(Modifier.height(4.dp))
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text(
                                    sc.tag.uppercase(), 
                                    color = NeonCyan, 
                                    fontSize = 11.sp, 
                                    fontFamily = com.example.ui.theme.ArialNarrowFamily,
                                    fontWeight = FontWeight.Bold,
                                    letterSpacing = 1.sp
                                )
                                if (sc.tag == "[SENTINEL]") {
                                    Box(
                                        modifier = Modifier
                                            .background(BrandCrimson.copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                                            .border(1.dp, BrandCrimson, RoundedCornerShape(4.dp))
                                            .padding(horizontal = 4.dp, vertical = 2.dp)
                                    ) {
                                        Text("LIAR ENGINE", color = BrandCrimson, fontSize = 8.sp, fontWeight = FontWeight.Black)
                                    }
                                }
                            }
                            Spacer(Modifier.height(4.dp))
                            Text(
                                sc.name, 
                                color = BrandEggwhite, 
                                fontSize = 18.sp, 
                                fontWeight = FontWeight.Bold,
                                style = TextStyle(shadow = Shadow(Color.Black, blurRadius = 8f))
                            )
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text(
                                "PREDICTION", 
                                color = NeonGreen.copy(alpha = 0.7f), 
                                fontSize = 9.5.sp,
                                fontFamily = com.example.ui.theme.ArialNarrowFamily
                            )
                            Text(
                                "${"%.1f".format(alloc * 100)}%", 
                                color = NeonGreen, 
                                fontSize = 24.sp, 
                                fontFamily = com.example.ui.theme.ArialNarrowFamily, 
                                fontWeight = FontWeight.Black,
                                style = TextStyle(shadow = Shadow(NeonGreen.copy(alpha=0.5f), blurRadius = 16f))
                            )
                            Text(
                                "STATUS Δ=${"%.2f".format(delta)}", 
                                color = BrandEggwhite.copy(alpha=0.5f), 
                                fontSize = 10.5.sp,
                                fontFamily = com.example.ui.theme.ArialNarrowFamily
                            )
                        }
                    }
                    Spacer(Modifier.height(16.dp))
                    
                    // NEW: Mathematical conviction metrics
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        MetricItem("SENTIENT VIEWS", String.format("%,d", sc.socialTwitterImpressions), Color(0xFF60A5FA), Modifier.weight(1f))
                        MetricItem("POOL RESERVE", String.format("%,.0f MADx", sc.gildedConvictionReserve), BrandGold, Modifier.weight(1f))
                        MetricItem("SPEED (v/HR)", String.format("%+1.1f u", sc.crowdConvictionSpeed), if (sc.crowdConvictionSpeed >= 0.0) NeonGreen else NeonPink, Modifier.weight(1f))
                    }
                    Spacer(Modifier.height(8.dp))
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text("🧬 COGNITIVE BIAS: ${sc.psychographicCoreBias}", color = NeonPink, fontSize = 9.5.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontWeight = FontWeight.Bold)
                        Text("${sc.lockPeriodWeeks}w LOCK INDEX", color = BrandGold, fontSize = 9.5.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontWeight = FontWeight.Bold)
                    }
                    Spacer(Modifier.height(4.dp))
                    LinearProgressIndicator(
                        progress = { sc.sentimentBullishRatio.toFloat() },
                        modifier = Modifier.fillMaxWidth().height(4.dp),
                        color = NeonGreen,
                        trackColor = NeonPink.copy(alpha = 0.3f)
                    )
                    Spacer(Modifier.height(16.dp))
                    
                    InteractiveConvictionControl(sc, vm, state.madxBalance)
                    
                    if (sc.isCreatorMode) {
                        Spacer(Modifier.height(16.dp))
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Text("Creator Market", color = BrandGold, fontSize = 10.5.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontWeight = FontWeight.Bold)
                            Text("40% Creator Profit Share", color = NeonGreen, fontSize = 10.5.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}
}

@Composable
fun MetricItem(label: String, value: String, valueColor: Color, modifier: Modifier = Modifier) {
    Column(modifier) {
        Text(label, color = BrandEggwhite.copy(alpha=0.6f), fontSize = 8.5.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontWeight = FontWeight.Bold)
        Text(value, color = valueColor, fontSize = 12.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontWeight = FontWeight.Black)
    }
}

@Composable
fun MarketVolatilityGauge(state: com.example.model.MarketState) {
    val maxAlloc = state.allocations.maxOrNull() ?: 0.0
    val volatilityScore = ((1.0 - maxAlloc) / 0.8).toFloat().coerceIn(0f, 1f)
    val animatedVol by androidx.compose.animation.core.animateFloatAsState(targetValue = volatilityScore)
    val strokeWidth = 12.dp

    Box(
        Modifier
            .fillMaxWidth()
            .background(BgCard.copy(alpha = 0.5f), RoundedCornerShape(16.dp))
            .border(1.dp, NeonPurple.copy(alpha = 0.5f), RoundedCornerShape(16.dp))
            .padding(24.dp)
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
            Row(Modifier.fillMaxWidth(), Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text("🫀 MARKET VOLATILITY INDEX", color = NeonCyan, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontWeight = FontWeight.Bold)
                Text("${"%.0f".format(animatedVol * 100)}%", color = if (animatedVol > 0.6f) BrandCrimson else NeonGreen, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontWeight = FontWeight.Black)
            }
            Spacer(Modifier.height(16.dp))
            
            Box(Modifier.fillMaxWidth().height(100.dp), contentAlignment = Alignment.BottomCenter) {
                androidx.compose.foundation.Canvas(Modifier.fillMaxSize()) {
                    val canvasW = size.width
                    val canvasH = size.height * 2f
                    // Draw backend arc
                    drawArc(
                        color = Color.DarkGray.copy(alpha = 0.3f),
                        startAngle = 180f,
                        sweepAngle = 180f,
                        useCenter = false,
                        style = androidx.compose.ui.graphics.drawscope.Stroke(width = strokeWidth.toPx(), cap = androidx.compose.ui.graphics.StrokeCap.Round)
                    )
                    
                    // Draw active gradient arc
                    val sweep = animatedVol * 180f
                    drawArc(
                        brush = androidx.compose.ui.graphics.Brush.horizontalGradient(listOf(NeonCyan, NeonGreen, BrandGold, BrandCrimson)),
                        startAngle = 180f,
                        sweepAngle = sweep.coerceIn(5f, 175f),
                        useCenter = false,
                        style = androidx.compose.ui.graphics.drawscope.Stroke(width = strokeWidth.toPx(), cap = androidx.compose.ui.graphics.StrokeCap.Round)
                    )
                    
                    // Draw Needle
                    val angleRad = Math.toRadians((180.0 + sweep.coerceIn(0f, 180f).toDouble()))
                    val needleLen = size.height * 0.8f
                    val endX = size.width / 2f + needleLen * Math.cos(angleRad).toFloat()
                    val endY = size.height + needleLen * Math.sin(angleRad).toFloat()
                    
                    drawLine(
                        color = BrandEggwhite,
                        start = androidx.compose.ui.geometry.Offset(size.width / 2f, size.height),
                        end = androidx.compose.ui.geometry.Offset(endX, endY),
                        strokeWidth = 3.dp.toPx(),
                        cap = androidx.compose.ui.graphics.StrokeCap.Round
                    )
                    drawCircle(color = NeonPurple, radius = 8.dp.toPx(), center = androidx.compose.ui.geometry.Offset(size.width / 2f, size.height))
                }
            }
            Spacer(Modifier.height(8.dp))
            Text("Needle intensity dynamically routed via Softmax Allocation deviation.", color = Color.Gray, fontSize = 10.5.sp, fontStyle = androidx.compose.ui.text.font.FontStyle.Italic)
        }
    }
}

@Composable
fun HighStakesFeedPanel(feed: List<HighStakesActivity>) {
    val theme = LocalGambitTheme.current
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .glassContainerBackground(NeonMagenta, RoundedCornerShape(16.dp))
            .border(1.dp, NeonMagenta.copy(alpha=0.6f), RoundedCornerShape(16.dp))
            .shadow(12.dp, RoundedCornerShape(16.dp), spotColor = NeonMagenta),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Box(
                        modifier = Modifier
                            .size(10.dp)
                            .background(BrandCrimson, CircleShape)
                    )
                    Text(
                        "🚨 HIGH STAKES DECENTRALIZED FEED",
                        color = GlowWhite,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = FontFamily.Monospace,
                        style = TextStyle(shadow = Shadow(BrandCrimson, blurRadius = 10f))
                    )
                }
                Box(
                    modifier = Modifier
                        .background(BrandCrimson.copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                        .border(1.dp, BrandCrimson, RoundedCornerShape(4.dp))
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                ) {
                    Text("LIVE FEED", color = BrandCrimson, fontSize = 8.sp, fontWeight = FontWeight.Black)
                }
            }
            
            Spacer(Modifier.height(12.dp))
            
            if (feed.isEmpty()) {
                Box(Modifier.fillMaxWidth().height(60.dp), contentAlignment = Alignment.Center) {
                    Text("Monitoring prediction channels...", color = Color.Gray, fontSize = 11.sp)
                }
            } else {
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    contentPadding = PaddingValues(bottom = 4.dp)
                ) {
                    items(feed) { item ->
                        HighStakesFeedCard(item)
                    }
                }
            }
        }
    }
}

@Composable
fun HighStakesFeedCard(item: HighStakesActivity) {
    val outlineColor = when (item.type) {
        "LIQUIDATION" -> BrandCrimson
        "MASSIVE_SHIFT" -> BrandGold
        "ORACLE_ALERT" -> Color(0xFFFF7700)
        else -> NeonCyan
    }
    
    val indicatorIcon = when (item.type) {
        "LIQUIDATION" -> "💀"
        "MASSIVE_SHIFT" -> "🐳"
        "ORACLE_ALERT" -> "📡"
        else -> "⚔️"
    }

    var showDetails by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier
            .width(260.dp)
            .shadow(4.dp, RoundedCornerShape(12.dp), spotColor = outlineColor.copy(alpha = 0.3f))
            .glassContainerBackground(outlineColor, RoundedCornerShape(12.dp))
            .border(1.dp, outlineColor.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
            .clickable { showDetails = true }
            .padding(12.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "$indicatorIcon ${item.eventName.uppercase()}",
                    color = outlineColor,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    maxLines = 1
                )
                Text(
                    text = "%.0fm ago".format((System.currentTimeMillis() - item.timestamp).toDouble() / 60000.0).replace("-", "").coerceAtLeast("now"),
                    color = Color.Gray,
                    fontSize = 9.sp
                )
            }
            Text(
                text = item.text,
                color = BrandEggwhite,
                fontSize = 11.sp,
                lineHeight = 14.sp,
                maxLines = 2
            )
            if (item.amount > 0.0) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Value: ${String.format("%,d", item.amount.toInt())} \$MADx",
                        color = BrandGold,
                        fontSize = 9.5.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                    if (item.speedBoost > 0.0) {
                        Text(
                            text = "Boost: +${"%.1f".format(item.speedBoost)}x",
                            color = NeonGreen,
                            fontSize = 9.5.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
            }
        }
    }

    if (showDetails) {
        androidx.compose.material3.AlertDialog(
            onDismissRequest = { showDetails = false },
            confirmButton = {
                androidx.compose.material3.TextButton(onClick = { showDetails = false }) {
                    Text("Dismiss Feed", color = outlineColor)
                }
            },
            containerColor = Color(0xFF12121A),
            titleContentColor = outlineColor,
            title = { Text("$indicatorIcon FEED ALERTS: ${item.type}") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Trigger Event: ${item.eventName}", color = Color.White, fontWeight = FontWeight.Bold)
                    Text(item.text, color = Color.LightGray)
                    if (item.amount > 0) {
                        Text("Financial Impact: ${String.format("%,d", item.amount.toInt())} \$MADx", color = BrandGold)
                    }
                    Text("Timestamp: ${java.util.Date(item.timestamp).toString()}", color = Color.Gray, fontSize = 10.sp)
                }
            }
        )
    }
}

@Composable
fun InteractiveConvictionControl(
    sc: Scenario,
    vm: GambitViewModel,
    userBalance: Double
) {
    var selectedDirection by remember { mutableStateOf<String?>(null) }
    var stakeAmount by remember { mutableStateOf(50f) }
    var convictionLevel by remember { mutableStateOf(0.5f) }
    var triggerExplosion by remember { mutableStateOf(false) }

    val pulseScale by animateFloatAsState(
        targetValue = 1f + (convictionLevel * 0.04f),
        animationSpec = spring(stiffness = Spring.StiffnessLow)
    )

    Box(
        modifier = Modifier.fillMaxWidth(),
        contentAlignment = Alignment.Center
    ) {
        Column(
        modifier = Modifier
            .fillMaxWidth()
            .graphicsLayer {
                scaleX = pulseScale
                scaleY = pulseScale
            }
            .background(Color.Black.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
            .border(1.dp, NeonMagenta.copy(alpha = 0.25f), RoundedCornerShape(12.dp))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text(
            "1. SELECT TARGET CONVICTION",
            color = Color.Gray,
            fontSize = 9.5.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace
        )
        
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            val directions = when (sc.marketType) {
                MarketType.OVER_UNDER -> listOf("OVER", "UNDER")
                MarketType.PROGRESSIVE -> listOf("BUY_TARGET_MET", "SHORT_PROGRESS")
                MarketType.MULTI_OUTCOME -> listOf("BTC", "ETH", "SOL")
                else -> listOf("YES", "NO")
            }

            directions.forEach { direction ->
                val isSelected = selectedDirection == direction
                val activeBg = if (direction == "YES" || direction == "OVER" || direction == "BUY_TARGET_MET" || direction == "BTC" || direction == "ETH") {
                    NeonCyan.copy(alpha = 0.25f)
                } else {
                    NeonMagenta.copy(alpha = 0.25f)
                }
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (isSelected) activeBg else BgDeep)
                        .border(
                            width = 1.dp,
                            color = if (isSelected) {
                                if (direction == "YES" || direction == "OVER" || direction == "BUY_TARGET_MET" || direction == "BTC" || direction == "ETH") NeonCyan else NeonMagenta
                            } else Color.DarkGray,
                            shape = RoundedCornerShape(8.dp)
                        )
                        .clickable {
                            selectedDirection = direction
                            vm.playFeedbackTone(android.media.ToneGenerator.TONE_PROP_ACK, 70)
                        }
                        .padding(vertical = 10.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = direction,
                        color = if (isSelected) Color.White else Color.Gray,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }
        }

        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text(
                "2. SLIDE " + "$" + "MADx STAKE",
                color = Color.Gray,
                fontSize = 9.5.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace
            )
            Text(
                "${stakeAmount.toInt()} " + "$" + "MADx",
                color = BrandGold,
                fontSize = 12.sp,
                fontWeight = FontWeight.Black,
                fontFamily = FontFamily.Monospace
            )
        }
        
        Slider(
            value = stakeAmount,
            onValueChange = { newVal ->
                val roundedVal = (newVal / 10f).toInt() * 10f
                if (roundedVal != stakeAmount) {
                    stakeAmount = roundedVal
                    vm.playFeedbackTone(android.media.ToneGenerator.TONE_PROP_BEEP, 40)
                }
            },
            valueRange = 10f..500f,
            colors = SliderDefaults.colors(
                thumbColor = NeonCyan,
                activeTrackColor = NeonCyan,
                inactiveTrackColor = Color.DarkGray
            )
        )

        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text(
                "3. CONVICTION MULTIPLIER BOOST",
                color = Color.Gray,
                fontSize = 9.5.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace
            )
            Text(
                "+${(convictionLevel * 100).toInt()}%",
                color = NeonPink,
                fontSize = 12.sp,
                fontWeight = FontWeight.Black,
                fontFamily = FontFamily.Monospace
            )
        }
        
        Slider(
            value = convictionLevel,
            onValueChange = { newVal ->
                val roundedVal = (newVal * 10f).toInt() / 10f
                if (roundedVal != convictionLevel) {
                    if (roundedVal >= 0.8f && convictionLevel < 0.8f) {
                        triggerExplosion = true
                        vm.playFeedbackTone(android.media.ToneGenerator.TONE_CDMA_HIGH_PBX_SLS, 180)
                    }
                    convictionLevel = roundedVal
                    vm.playFeedbackTone(android.media.ToneGenerator.TONE_CDMA_PIP, 40)
                }
            },
            valueRange = 0.1f..1.0f,
            colors = SliderDefaults.colors(
                thumbColor = NeonPink,
                activeTrackColor = NeonPink,
                inactiveTrackColor = Color.DarkGray
            )
        )

        val projectedRewards = stakeAmount * sc.baseMultiplier * (1.0 + convictionLevel)
        
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color.DarkGray.copy(alpha = 0.2f), RoundedCornerShape(6.dp))
                .padding(8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text("INTELLIGENT YIELD MULTIPLIER", color = Color.Gray, fontSize = 8.sp, fontWeight = FontWeight.Bold)
                Text("${"%.2f".format(sc.baseMultiplier * (1f + convictionLevel))}x", color = NeonGreen, fontSize = 11.sp, fontWeight = FontWeight.Black, fontFamily = FontFamily.Monospace)
            }
            Column(horizontalAlignment = Alignment.End) {
                Text("ESTIMATED PAYOUT", color = Color.Gray, fontSize = 8.sp, fontWeight = FontWeight.Bold)
                Text("${"%.1f".format(projectedRewards)} " + "$" + "MADx", color = BrandGold, fontSize = 11.sp, fontWeight = FontWeight.Black, fontFamily = FontFamily.Monospace)
            }
        }

        val canConfirm = selectedDirection != null && userBalance >= stakeAmount
        Button(
            onClick = {
                selectedDirection?.let { dir ->
                    vm.placeInteractivePrediction(sc.id, dir, stakeAmount.toDouble(), convictionLevel)
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(44.dp),
            enabled = canConfirm,
            colors = ButtonDefaults.buttonColors(
                containerColor = NeonGreen,
                contentColor = BgDeep,
                disabledContainerColor = Color.DarkGray.copy(alpha = 0.4f),
                disabledContentColor = Color.Gray
            ),
            shape = RoundedCornerShape(8.dp)
        ) {
            Text(
                text = if (selectedDirection == null) {
                    "SELECT DIRECTION FIRST"
                } else if (userBalance < stakeAmount) {
                    "INSUFFICIENT BALANCE"
                } else {
                    "⚡ LOCK IN CONVICTION POSITION ⚡"
                },
                fontSize = 11.sp,
                fontWeight = FontWeight.Black,
                fontFamily = FontFamily.Monospace,
                letterSpacing = 1.sp
            )
        }
    }

    DopamineBurstEffect(
        trigger = triggerExplosion,
        onAnimationEnd = { triggerExplosion = false },
        modifier = Modifier.matchParentSize()
    )
}
}

// -----------------------------------------------------------------
// GAME LOBBY, TOURNAMENT COUNTDOWN & LIAR METER GAUGE WIDGETS
// -----------------------------------------------------------------

data class TriangleCountdown(val days: Int, val hours: Int, val minutes: Int, val seconds: Int)

fun getLastFridayOfSuffix(year: Int, month: Int): Calendar {
    val cal = Calendar.getInstance()
    cal.set(Calendar.YEAR, year)
    cal.set(Calendar.MONTH, month)
    cal.set(Calendar.DAY_OF_MONTH, cal.getActualMaximum(Calendar.DAY_OF_MONTH))
    cal.set(Calendar.HOUR_OF_DAY, 23)
    cal.set(Calendar.MINUTE, 59)
    cal.set(Calendar.SECOND, 59)
    cal.set(Calendar.MILLISECOND, 999)
    
    while (cal.get(Calendar.DAY_OF_WEEK) != Calendar.FRIDAY) {
        cal.add(Calendar.DAY_OF_MONTH, -1)
    }
    return cal
}

fun getTimeToLastFridayOfCurrentOrNextMonth(): TriangleCountdown {
    val now = Calendar.getInstance()
    var target = getLastFridayOfSuffix(now.get(Calendar.YEAR), now.get(Calendar.MONTH))
    if (now.timeInMillis >= target.timeInMillis) {
        val nextMonthYear = if (now.get(Calendar.MONTH) == Calendar.DECEMBER) now.get(Calendar.YEAR) + 1 else now.get(Calendar.YEAR)
        val nextMonth = if (now.get(Calendar.MONTH) == Calendar.DECEMBER) Calendar.JANUARY else now.get(Calendar.MONTH) + 1
        target = getLastFridayOfSuffix(nextMonthYear, nextMonth)
    }
    
    val diffMs = target.timeInMillis - now.timeInMillis
    val days = diffMs / (24L * 60 * 60 * 1000)
    val hours = (diffMs % (24L * 60 * 60 * 1000)) / (60 * 60 * 1000)
    val minutes = (diffMs % (60 * 60 * 1000)) / (60 * 1000)
    val seconds = (diffMs % (60 * 1000)) / 1000
    
    return TriangleCountdown(days.toInt(), hours.toInt(), minutes.toInt(), seconds.toInt())
}

@Composable
fun LiarMeterMarketsWidget(vm: GambitViewModel) {
    val state by vm.state.collectAsState()
    val result = state.liarMeterResult
    val isAnalyzing = state.isLiarMeterAnalyzing
    val error = state.liarMeterError

    var inputEventText by remember { mutableStateOf("") }
    var roastIntensity by remember { mutableStateOf(70f) }
    var memeSarcasm by remember { mutableStateOf(65f) }

    // Preset configurations for swift testing
    val presets = listOf(
        "Fed will raise overnight rates to 18% to combat retail luxury handbag spending.",
        "Elon Musk announces Dogecoin is officially legal tender on Mars, projects Giga-rally.",
        "Prime Minister states housing market is 'more affordable than ever' while standing in front of custom yacht."
    )

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(16.dp, RoundedCornerShape(20.dp), spotColor = NeonMagenta.copy(alpha = 0.2f))
            .border(1.dp, Brush.horizontalGradient(listOf(NeonMagenta, NeonCyan)), RoundedCornerShape(20.dp)),
        colors = CardDefaults.cardColors(containerColor = BgCard.copy(alpha = 0.7f))
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("🚨", fontSize = 16.sp)
                    Text(
                        text = "LIAR METER PROTOCOL",
                        color = Color.White,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = FontFamily.Monospace,
                        style = TextStyle(shadow = Shadow(NeonMagenta, blurRadius = 8f))
                    )
                }
                Box(
                    modifier = Modifier
                        .background(BrandCrimson.copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                        .border(1.dp, BrandCrimson, RoundedCornerShape(4.dp))
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = "GEMINI COGNITIVE ORACLE",
                        color = BrandCrimson,
                        fontSize = 8.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = "Analyze the underlying sentiment, factual consistency, and accuracy of public statements. Unmask political bluffs and market delusions in real-time.",
                color = Color.LightGray,
                fontSize = 11.sp,
                lineHeight = 15.sp
            )
            
            Spacer(modifier = Modifier.height(16.dp))

            // Text Input Field for Economic Conviction
            Text(
                text = "📥 SUBMIT ECONOMIC STATEMENT / BLUFF FOR AUDITING",
                color = NeonCyan,
                fontSize = 9.5.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace
            )
            Spacer(modifier = Modifier.height(6.dp))
            
            OutlinedTextField(
                value = inputEventText,
                onValueChange = { inputEventText = it },
                placeholder = {
                    Text(
                        "Paste public statement or market conviction here...",
                        fontSize = 12.sp,
                        color = Color.Gray
                    )
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(90.dp),
                textStyle = TextStyle(color = Color.White, fontSize = 12.sp, fontFamily = FontFamily.Monospace),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = NeonCyan,
                    unfocusedBorderColor = Color.DarkGray
                ),
                shape = RoundedCornerShape(8.dp)
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Presets
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                presets.forEachIndexed { idx, preset ->
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .background(Color.DarkGray.copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                            .border(0.5.dp, Color.Gray.copy(alpha = 0.4f), RoundedCornerShape(4.dp))
                            .clickable {
                                inputEventText = preset
                                vm.playFeedbackTone(android.media.ToneGenerator.TONE_PROP_ACK, 40)
                            }
                            .padding(horizontal = 6.dp, vertical = 4.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "PRESET #${idx + 1}",
                            color = Color.LightGray,
                            fontSize = 8.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Roast Intensity & Sarcasm Sliders
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("🔥 ROAST SEVERITY", color = BrandCrimson, fontSize = 8.5.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                        Text("${roastIntensity.toInt()}%", color = BrandCrimson, fontSize = 8.5.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                    }
                    Slider(
                        value = roastIntensity,
                        onValueChange = { roastIntensity = it },
                        valueRange = 10f..100f,
                        colors = SliderDefaults.colors(
                            thumbColor = BrandCrimson,
                            activeTrackColor = BrandCrimson,
                            inactiveTrackColor = Color.DarkGray
                        )
                    )
                }

                Column(modifier = Modifier.weight(1f)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("🎭 MEME HUMOR", color = NeonCyan, fontSize = 8.5.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                        Text("${memeSarcasm.toInt()}%", color = NeonCyan, fontSize = 8.5.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                    }
                    Slider(
                        value = memeSarcasm,
                        onValueChange = { memeSarcasm = it },
                        valueRange = 10f..100f,
                        colors = SliderDefaults.colors(
                            thumbColor = NeonCyan,
                            activeTrackColor = NeonCyan,
                            inactiveTrackColor = Color.DarkGray
                        )
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Action Trigger Button
            Button(
                onClick = {
                    if (inputEventText.isNotBlank()) {
                        vm.analyzeLiarMeterInput(inputEventText, roastIntensity.toInt(), memeSarcasm.toInt())
                    }
                },
                enabled = !isAnalyzing && inputEventText.isNotBlank(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = NeonMagenta.copy(alpha = 0.2f),
                    contentColor = NeonMagenta,
                    disabledContainerColor = Color.DarkGray.copy(alpha = 0.2f),
                    disabledContentColor = Color.Gray
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(
                        1.dp,
                        if (inputEventText.isNotBlank()) NeonMagenta else Color.DarkGray,
                        RoundedCornerShape(8.dp)
                    ),
                shape = RoundedCornerShape(8.dp),
                contentPadding = PaddingValues(vertical = 12.dp)
            ) {
                if (isAnalyzing) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(16.dp),
                            color = NeonMagenta,
                            strokeWidth = 2.dp
                        )
                        Text(
                            "🤖 RUNNING COGNITIVE ORACLE SCAN...",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                } else {
                    Text(
                        "🔍 DEMOLISH SPEECH & ANALYZE CONVICTION",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }

            // Error Display
            if (error != null) {
                Spacer(modifier = Modifier.height(12.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(BrandCrimson.copy(alpha = 0.15f), RoundedCornerShape(8.dp))
                        .border(1.dp, BrandCrimson, RoundedCornerShape(8.dp))
                        .padding(12.dp)
                ) {
                    Text(
                        text = "🚨 $error",
                        color = Color.White,
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }

            // Results Section (when calculated or fallback result exists)
            val activeResult = result
            if (activeResult != null) {
                Spacer(modifier = Modifier.height(20.dp))
                HorizontalDivider(color = Color.DarkGray.copy(alpha = 0.4f), thickness = 1.dp)
                Spacer(modifier = Modifier.height(16.dp))

                // GAUGE DISPLAY
                val trustVal = (activeResult.trustScore / 100.0).toFloat().coerceIn(0f, 1f)
                val lieVal = (activeResult.lieScore / 100.0).toFloat().coerceIn(0f, 1f)

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier.size(170.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Canvas(modifier = Modifier.fillMaxSize()) {
                            val strokeWidth = 12.dp.toPx()
                            val radius = size.minDimension / 2 - strokeWidth
                            val center = Offset(size.width / 2, size.height / 2)
                            
                            // Background Arc
                            drawArc(
                                color = Color(0xFF1E1E2E),
                                startAngle = 180f,
                                sweepAngle = 180f,
                                useCenter = false,
                                style = Stroke(width = strokeWidth, cap = StrokeCap.Round),
                                topLeft = Offset(center.x - radius, center.y - radius),
                                size = Size(radius * 2, radius * 2)
                            )
                            
                            // Trust Score Arc (Neon Cyan)
                            drawArc(
                                color = NeonCyan,
                                startAngle = 180f,
                                sweepAngle = 180f * trustVal,
                                useCenter = false,
                                style = Stroke(width = strokeWidth, cap = StrokeCap.Round),
                                topLeft = Offset(center.x - radius, center.y - radius),
                                size = Size(radius * 2, radius * 2)
                            )
                            
                            // Lie Score Arc (Neon Magenta) - drawn thinner or offset
                            drawArc(
                                color = NeonMagenta,
                                startAngle = 180f,
                                sweepAngle = 180f * lieVal,
                                useCenter = false,
                                style = Stroke(width = strokeWidth / 2, cap = StrokeCap.Round),
                                topLeft = Offset(center.x - (radius - strokeWidth), center.y - (radius - strokeWidth)),
                                size = Size((radius - strokeWidth) * 2, (radius - strokeWidth) * 2)
                            )
                        }
                        
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier.padding(top = 22.dp)
                        ) {
                            Text(
                                text = "TRST: ${(trustVal * 100).toInt()}% VS LIE: ${(lieVal * 100).toInt()}%",
                                color = Color.White,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Black,
                                fontFamily = FontFamily.Monospace,
                                style = TextStyle(shadow = Shadow(NeonMagenta, blurRadius = 8f))
                            )
                            Text(
                                text = "COGNITIVE VERACITY INDEX",
                                color = Color.Gray,
                                fontSize = 8.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            val verdictText = when {
                                trustVal >= 0.65f -> "🛸 CREDIBLE REALITY"
                                trustVal >= 0.35f -> "⚠️ SPECULATIVE FUZZ"
                                else -> "☠️ DELUSIONAL HUBRIS"
                            }
                            val verdictColor = when {
                                trustVal >= 0.65f -> NeonCyan
                                trustVal >= 0.35f -> Color.Yellow
                                else -> BrandCrimson
                            }
                            Text(
                                text = verdictText,
                                color = verdictColor,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Black,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Source speaker and category details
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .background(Color.Black.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                            .border(0.5.dp, Color.DarkGray, RoundedCornerShape(8.dp))
                            .padding(10.dp)
                    ) {
                        Column {
                            Text("👤 DETECTED SPEAKER", color = Color.Gray, fontSize = 8.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(activeResult.speaker, color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                        }
                    }

                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .background(Color.Black.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                            .border(0.5.dp, Color.DarkGray, RoundedCornerShape(8.dp))
                            .padding(10.dp)
                    ) {
                        Column {
                            Text("📁 SECTOR CLASSIFICATION", color = Color.Gray, fontSize = 8.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(activeResult.category.uppercase(), color = NeonCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                // SENTINEL INSIGHTS
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .background(Color.Black.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                            .border(0.5.dp, Color.DarkGray, RoundedCornerShape(8.dp))
                            .padding(10.dp)
                    ) {
                        Column {
                            Text("🎭 DETECTED SENTIMENT", color = Color.Gray, fontSize = 8.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(activeResult.sentiment, color = NeonMagenta, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .background(Color.Black.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                            .border(0.5.dp, Color.DarkGray, RoundedCornerShape(8.dp))
                            .padding(10.dp)
                    ) {
                        Column {
                            Text("🔎 FACTUAL CONSISTENCY", color = Color.Gray, fontSize = 8.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(activeResult.factualConsistency, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Medium)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                // ECONOMIC IMPACT CARDS
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color.Black.copy(alpha = 0.4f)),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color.DarkGray.copy(alpha = 0.6f))
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text("📉 HIGH-FIDELITY ECONOMIC SHOCK PROJECTION", color = Color.LightGray, fontSize = 9.sp, fontWeight = FontWeight.Black, fontFamily = FontFamily.Monospace)
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text("PROJ. ASSET DRIFT", color = Color.Gray, fontSize = 8.sp, fontFamily = FontFamily.Monospace)
                                Text(
                                    "${if (activeResult.economicImpact.projectedStockMovePct >= 0) "+" else ""}${activeResult.economicImpact.projectedStockMovePct}%",
                                    color = if (activeResult.economicImpact.projectedStockMovePct >= 0) NeonCyan else BrandCrimson,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Black,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                            Column {
                                Text("REVENUE DECAY", color = Color.Gray, fontSize = 8.sp, fontFamily = FontFamily.Monospace)
                                Text(
                                    "${if (activeResult.economicImpact.adRevenueImpactM >= 0) "+" else ""}${activeResult.economicImpact.adRevenueImpactM}M USD",
                                    color = if (activeResult.economicImpact.adRevenueImpactM >= 0) NeonCyan else BrandCrimson,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Black,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                            Column {
                                Text("ORACLE CONFIDENCE", color = Color.Gray, fontSize = 8.sp, fontFamily = FontFamily.Monospace)
                                Text(
                                    "${activeResult.economicImpact.confidence.toInt()}%",
                                    color = Color.White,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Black,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // FULL ROAST TERMINAL DISPLAY
                Text(
                    text = "💻 CORE ROAST ENGINE FEEDBACK",
                    color = BrandCrimson,
                    fontSize = 9.5.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
                Spacer(modifier = Modifier.height(6.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFF06060A), RoundedCornerShape(8.dp))
                        .border(1.dp, BrandCrimson.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                        .padding(14.dp)
                ) {
                    Column {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("TTY1 // ORACLE_ROAST_COGNITIVE", color = BrandCrimson, fontSize = 8.sp, fontFamily = FontFamily.Monospace)
                            Text("ONLINE", color = NeonCyan, fontSize = 8.sp, fontFamily = FontFamily.Monospace)
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = activeResult.fullRoast,
                            color = Color(0xFFDCDCDC),
                            fontSize = 11.sp,
                            lineHeight = 15.sp,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun MadGambitGameLobbyLobby(
    vm: GambitViewModel,
    equippedCard: com.example.model.SatiricalCard
) {
    val context = androidx.compose.ui.platform.LocalContext.current
    var isEnrolled by remember { mutableStateOf(false) }
    var countdown by remember { mutableStateOf(getTimeToLastFridayOfCurrentOrNextMonth()) }
    
    LaunchedEffect(Unit) {
        while (true) {
            delay(1000L)
            countdown = getTimeToLastFridayOfCurrentOrNextMonth()
        }
    }
    
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(20.dp, RoundedCornerShape(24.dp), spotColor = BrandGold.copy(alpha = 0.25f))
            .border(1.dp, GoldFlakeBrush, RoundedCornerShape(24.dp)),
        colors = CardDefaults.cardColors(containerColor = BgCard.copy(alpha = 0.4f))
    ) {
        Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            
            // Main Lobby Heading
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "🃏 MΛĐHΛT's GAMBIT GAME LOBBY",
                        color = BrandGold,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = FontFamily.Monospace,
                        style = TextStyle(shadow = Shadow(BrandGold, blurRadius = 12f))
                    )
                    Text(
                        text = "Level up decks & stake predictions in high-yield arenas",
                        color = Color.LightGray,
                        fontSize = 11.sp
                    )
                }
                Text("V1.4", color = Color.Gray, fontSize = 9.sp, fontFamily = FontFamily.Monospace)
            }
            
            HorizontalDivider(color = Color.DarkGray.copy(alpha = 0.4f), thickness = 1.dp)
            
            // 💀 MONTHLY CULL TOURNAMENT PORTAL & COUNTDOWN
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(Color(0xFF160A0A))
                    .border(1.dp, if (isEnrolled) NeonGreen else BrandCrimson, RoundedCornerShape(16.dp))
                    .padding(16.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text("🏆", fontSize = 14.sp)
                            Text(
                                text = "MONTHLY CULL TOURNAMENT",
                                color = BrandEggwhite,
                                fontSize = 11.5.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                        
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .clickable {
                                    isEnrolled = !isEnrolled
                                    if (isEnrolled) {
                                        vm.playFeedbackTone(android.media.ToneGenerator.TONE_PROP_ACK, 80)
                                        android.widget.Toast.makeText(context, "🔥 ENROLLED IN MONTHLY CULL TOURNAMENT!", android.widget.Toast.LENGTH_SHORT).show()
                                    } else {
                                        vm.playFeedbackTone(android.media.ToneGenerator.TONE_CDMA_PIP, 60)
                                        android.widget.Toast.makeText(context, "🛡️ WITHDREW FROM CULL TOURNAMENT!", android.widget.Toast.LENGTH_SHORT).show()
                                    }
                                }
                                .background(
                                    (if (isEnrolled) NeonGreen else BrandCrimson).copy(alpha = 0.2f)
                                )
                                .border(1.2.dp, if (isEnrolled) NeonGreen else BrandCrimson, RoundedCornerShape(6.dp))
                                .padding(horizontal = 10.dp, vertical = 5.dp)
                        ) {
                            Text(
                                text = if (isEnrolled) "ENROLLED" else "SIGN UP",
                                color = if (isEnrolled) NeonGreen else Color.White,
                                fontSize = 8.5.sp,
                                fontWeight = FontWeight.Black,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }
                    
                    Text(
                        text = "The ultimate tournament goes live on the last Friday of every month. Top players claim fractional platform basis points!",
                        color = Color.LightGray,
                        fontSize = 11.sp,
                        lineHeight = 15.sp
                    )
                    
                    // Countdown Box
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color.Black.copy(alpha=0.4f), RoundedCornerShape(8.dp))
                            .border(1.dp, Color.DarkGray.copy(alpha=0.5f), RoundedCornerShape(8.dp))
                            .padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceEvenly,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        CountdownUnit(countdown.days.toString(), "DAYS", BrandGold)
                        CountdownSeparator()
                        CountdownUnit(String.format("%02d", countdown.hours), "HOURS", BrandGold)
                        CountdownSeparator()
                        CountdownUnit(String.format("%02d", countdown.minutes), "MINS", NeonCyan)
                        CountdownSeparator()
                        CountdownUnit(String.format("%02d", countdown.seconds), "SECS", NeonMagenta)
                    }
                    
                    // Enrollment Button
                    Button(
                        onClick = {
                            vm.playFeedbackTone(android.media.ToneGenerator.TONE_PROP_ACK, 90)
                            android.widget.Toast.makeText(context, "🎮 Initiating MADHAT's GAMBIT match!", android.widget.Toast.LENGTH_SHORT).show()
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFFD4AF37),
                            contentColor = Color.Black
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(44.dp)
                            .border(1.dp, Color.Gray.copy(alpha = 0.4f), RoundedCornerShape(8.dp)),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            text = "🎮 PLAY MADHAT'S GAMBIT",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.ExtraBold,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
            }
            
            // ⚔️ CARDPLAY MODES
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "⚔️ SELECT CARDPLAY MODE",
                    color = NeonCyan,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    LobbyModeItem(
                        title = "1v1 PVP DUEL",
                        desc = "Stake MADx, boost Clout yield",
                        icon = "🛡️",
                        color = NeonCyan,
                        onClick = { vm.playFeedbackTone(android.media.ToneGenerator.TONE_PROP_ACK, 50) },
                        modifier = Modifier.weight(1f)
                    )
                    
                    LobbyModeItem(
                        title = "AI SCANDAL MATCH",
                        desc = "Simulate news waves vs LLMs",
                        icon = "🧠",
                        color = NeonMagenta,
                        onClick = { vm.playFeedbackTone(android.media.ToneGenerator.TONE_PROP_ACK, 50) },
                        modifier = Modifier.weight(1f)
                    )
                    
                    LobbyModeItem(
                        title = "SCANDAL BLITZ",
                        desc = "Wildcard prediction rounds",
                        icon = "⚡",
                        color = BrandGold,
                        onClick = { vm.playFeedbackTone(android.media.ToneGenerator.TONE_PROP_ACK, 50) },
                        modifier = Modifier.weight(1f)
                    )
                }
            }
            
            // 🎴 QUICK ACCESS TO ACTIVE DECK CARD
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "🎴 CURRENT EQUIPPED DECK (QUICK ACCESS)",
                    color = BrandGold,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
                
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color.Black.copy(alpha = 0.4f))
                        .border(1.dp, Color.DarkGray.copy(alpha=0.6f), RoundedCornerShape(12.dp))
                        .padding(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Tiny card face preview
                        Box(
                            modifier = Modifier
                                .size(50.dp, 70.dp)
                                .clip(RoundedCornerShape(6.dp))
                                .background(Color(0xFF0F0822))
                                .border(1.dp, Color(equippedCard.rarity.color), RoundedCornerShape(6.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = when {
                                    equippedCard.name.contains("MEMBER") -> "👤"
                                    equippedCard.name.contains("MOST WANTED") -> "🧔"
                                    equippedCard.name.contains("VISIONARY") -> "🛰️"
                                    equippedCard.name.contains("CHAD") -> "💪"
                                    equippedCard.name.contains("MELTDOWN") -> "😭"
                                    equippedCard.name.contains("FRAUDSTER") -> "👺"
                                    equippedCard.name.contains("ORACLE") -> "⚖️"
                                    equippedCard.name.contains("CHAMP") -> "🏋️"
                                    else -> "🃏"
                                },
                                fontSize = 24.sp
                            )
                        }
                        
                        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                            Text(
                                text = equippedCard.name.uppercase(),
                                color = Color.White,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Black,
                                fontFamily = FontFamily.Monospace,
                                maxLines = 1
                            )
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text(
                                    text = "Faction: ${equippedCard.faction}",
                                    color = Color.LightGray,
                                    fontSize = 9.5.sp
                                )
                                Text(
                                    text = "Rarity: ${equippedCard.rarity.display}",
                                    color = Color(equippedCard.rarity.color),
                                    fontSize = 9.5.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            
                            // Stats short row
                            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.padding(top = 2.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text("⚡", fontSize = 8.sp)
                                    Spacer(modifier = Modifier.width(2.dp))
                                    Text("Power: ${equippedCard.powerLevel}", color = Color.White, fontSize = 9.sp, fontFamily = FontFamily.Monospace)
                                }
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text("🧬", fontSize = 8.sp)
                                    Spacer(modifier = Modifier.width(2.dp))
                                    Text("Evol: Stage ${equippedCard.evolutionStage}", color = NeonCyan, fontSize = 9.sp, fontFamily = FontFamily.Monospace)
                                }
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text("🛡️", fontSize = 8.sp)
                                    Spacer(modifier = Modifier.width(2.dp))
                                    Text("Dur: ${(equippedCard.durability * 100).toInt()}%", color = NeonGreen, fontSize = 9.sp, fontFamily = FontFamily.Monospace)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun CountdownUnit(value: String, label: String, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = value,
            color = color,
            fontSize = 20.sp,
            fontWeight = FontWeight.Black,
            fontFamily = FontFamily.Monospace,
            style = TextStyle(shadow = Shadow(color.copy(alpha=0.5f), blurRadius = 8f))
        )
        Text(
            text = label,
            color = Color.Gray,
            fontSize = 7.5.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace
        )
    }
}

@Composable
fun CountdownSeparator() {
    Text(text = ":", color = Color.Gray, fontSize = 16.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
}

@Composable
fun LobbyModeItem(
    title: String,
    desc: String,
    icon: String,
    color: Color,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(10.dp))
            .background(Color.Black.copy(alpha = 0.3f))
            .border(1.dp, color.copy(alpha = 0.4f), RoundedCornerShape(10.dp))
            .clickable { onClick() }
            .padding(10.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(icon, fontSize = 14.sp)
            Text(title, color = color, fontSize = 8.5.sp, fontWeight = FontWeight.ExtraBold, fontFamily = FontFamily.Monospace, textAlign = TextAlign.Center)
            Text(desc, color = Color.Gray, fontSize = 7.sp, lineHeight = 8.5.sp, textAlign = TextAlign.Center)
        }
    }
}

@Composable
fun SatiricalDailyForecastWidget(vm: GambitViewModel) {
    val state by vm.state.collectAsState()
    val theme = LocalGambitTheme.current
    var isCustomizeExpanded by remember { mutableStateOf(false) }
    
    var localWeather by remember(state.forecastWeatherInput) { mutableStateOf(state.forecastWeatherInput) }
    var localAntics by remember(state.forecastAnticsInput) { mutableStateOf(state.forecastAnticsInput) }
    var localScandal by remember(state.forecastScandalInput) { mutableStateOf(state.forecastScandalInput) }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(12.dp, RoundedCornerShape(16.dp), spotColor = theme.brandPrimary.copy(alpha = 0.2f))
            .border(1.2.dp, theme.borderBrush, RoundedCornerShape(16.dp)),
        colors = CardDefaults.cardColors(containerColor = theme.bgCard.copy(alpha = 0.7f))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Header Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("🔮", fontSize = 18.sp)
                    Column {
                        Text(
                            text = "ORACLE'S SATIRICAL FORECAST",
                            color = theme.brandPrimary,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.Monospace,
                            style = TextStyle(shadow = Shadow(theme.brandPrimary.copy(alpha = 0.6f), blurRadius = 8f))
                        )
                        Text(
                            text = "REAL-TIME GEMINI-API COGNITIVE UPDATE",
                            color = theme.textSecondary,
                            fontSize = 8.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
                
                // Status Beacon
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(6.dp)
                            .background(
                                if (state.isDailyForecastLoading) Color(0xFFFF9D00) else Color(0xFF00FF66),
                                CircleShape
                            )
                    )
                    Text(
                        text = if (state.isDailyForecastLoading) "RE-INDEXING..." else "ONLINE",
                        color = if (state.isDailyForecastLoading) Color(0xFFFF9D00) else Color(0xFF00FF66),
                        fontSize = 8.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Forecast Display
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.Black.copy(alpha = 0.4f), RoundedCornerShape(10.dp))
                    .border(1.dp, Color.White.copy(alpha = 0.05f), RoundedCornerShape(10.dp))
                    .padding(12.dp)
            ) {
                if (state.isDailyForecastLoading) {
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        CircularProgressIndicator(
                            color = theme.brandSecondary,
                            modifier = Modifier.size(24.dp),
                            strokeWidth = 2.5.dp
                        )
                        Text(
                            text = "Consulting recursive GARCH volatility matrix...\nGenerating sarcastic forecast variables...",
                            color = theme.brandSecondary,
                            fontSize = 9.5.sp,
                            fontFamily = FontFamily.Monospace,
                            textAlign = TextAlign.Center,
                            lineHeight = 14.sp
                        )
                    }
                } else {
                    val textToShow = state.dailyForecastText ?: "No forecast active. Type custom variables below to generate your first bulletin!"
                    Text(
                        text = textToShow,
                        color = theme.textPrimary,
                        fontSize = 11.sp,
                        lineHeight = 16.sp,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Expandable Accordion Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .clickable {
                        isCustomizeExpanded = !isCustomizeExpanded
                        vm.playFeedbackTone(android.media.ToneGenerator.TONE_PROP_ACK, 40)
                    }
                    .background(Color.White.copy(alpha = 0.03f))
                    .padding(horizontal = 10.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = if (isCustomizeExpanded) "⚙️ HIDE SEED SELECTION" else "⚙️ CUSTOMISE SEED SELECTION",
                    color = theme.brandAccent,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Monospace
                )
                Text(
                    text = if (isCustomizeExpanded) "▲" else "▼",
                    color = theme.brandAccent,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            if (isCustomizeExpanded) {
                Spacer(modifier = Modifier.height(10.dp))
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 4.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // Weather Input
                    Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                        Text("1. CURRENT COGNITIVE WEATHER PROXIES", color = theme.textSecondary, fontSize = 8.5.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                        OutlinedTextField(
                            value = localWeather,
                            onValueChange = { localWeather = it },
                            modifier = Modifier.fillMaxWidth(),
                            textStyle = TextStyle(color = Color.White, fontSize = 11.sp, fontFamily = FontFamily.Monospace),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = theme.brandPrimary,
                                unfocusedBorderColor = Color.DarkGray,
                                cursorColor = theme.brandPrimary
                            ),
                            singleLine = true
                        )
                    }

                    // Antics Input
                    Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                        Text("2. CULTURAL ANTICS FOR ORACLE TO ROAST", color = theme.textSecondary, fontSize = 8.5.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                        OutlinedTextField(
                            value = localAntics,
                            onValueChange = { localAntics = it },
                            modifier = Modifier.fillMaxWidth(),
                            textStyle = TextStyle(color = Color.White, fontSize = 11.sp, fontFamily = FontFamily.Monospace),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = theme.brandPrimary,
                                unfocusedBorderColor = Color.DarkGray,
                                cursorColor = theme.brandPrimary
                            ),
                            singleLine = true
                        )
                    }

                    // Scandal Input
                    Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                        Text("3. GAFFE / SCANDAL / VIRAL HIGHLIGHT EVENT", color = theme.textSecondary, fontSize = 8.5.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                        OutlinedTextField(
                            value = localScandal,
                            onValueChange = { localScandal = it },
                            modifier = Modifier.fillMaxWidth(),
                            textStyle = TextStyle(color = Color.White, fontSize = 11.sp, fontFamily = FontFamily.Monospace),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = theme.brandPrimary,
                                unfocusedBorderColor = Color.DarkGray,
                                cursorColor = theme.brandPrimary
                            ),
                            singleLine = true
                        )
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    // "SAVE SEEDS & RUN GEMINI ORACLE" Action Button
                    Button(
                        onClick = {
                            vm.playFeedbackTone(android.media.ToneGenerator.TONE_PROP_ACK, 80)
                            vm.updateForecastInputs(localWeather, localAntics, localScandal)
                            vm.fetchDailyForecast()
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = theme.brandPrimary,
                            contentColor = theme.bgDeep
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            text = "⚡ RUN GEMINI FORECAST ENGINE ⚡",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.ExtraBold,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun ConvictionMarketplaceWidget(vm: GambitViewModel) {
    val state by vm.state.collectAsState()
    val theme = LocalGambitTheme.current
    val balance = state.madxBalance

    // States for inputs
    val eventsList = listOf(
        "📈 Fed December Rate Cut",
        "📉 US Inflation Threshold",
        "🃏 Madhat's Gambit Arbitrage",
        "🤖 AI Semiconductor Supply Shock",
        "💸 G7 Sovereign Currency Shift",
        "✏️ Custom Narrative Event"
    )
    var selectedEventIndex by remember { mutableStateOf(0) }
    var customEventText by remember { mutableStateOf("") }
    var predictedOutcome by remember { mutableStateOf("") }
    var confidenceLevel by remember { mutableStateOf(0.5f) }
    var stakeAmount by remember { mutableStateOf(50f) }
    var isSubmittedSuccess by remember { mutableStateOf(false) }

    var triggerExplosion by remember { mutableStateOf(false) }

    // Derive actual event name
    val activeEventName = if (eventsList[selectedEventIndex] == "✏️ Custom Narrative Event") {
        customEventText
    } else {
        eventsList[selectedEventIndex]
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(elevation = 16.dp, RoundedCornerShape(20.dp), spotColor = BrandGold.copy(alpha = 0.2f))
            .glassContainerBackground(BrandGold, RoundedCornerShape(20.dp))
            .border(1.2.dp, GoldFlakeBrush, RoundedCornerShape(20.dp))
            .padding(20.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("🔮", fontSize = 18.sp)
                    Column {
                        Text(
                            "CONVICTION MARKETPLACE",
                            color = BrandGold,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.Monospace,
                            style = TextStyle(shadow = Shadow(BrandGoldGlow, blurRadius = 8f))
                        )
                        Text(
                            "SUBMIT REAL-TIME ECONOMIC SENTINEL NARRATIVES",
                            color = Color.Gray,
                            fontSize = 8.sp,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
                Box(
                    modifier = Modifier
                        .background(BrandGold.copy(alpha = 0.15f), RoundedCornerShape(4.dp))
                        .border(0.5.dp, BrandGold, RoundedCornerShape(4.dp))
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                ) {
                    Text("LIVE ENGINE", color = BrandGold, fontSize = 7.5.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                }
            }

            Spacer(
                Modifier
                    .fillMaxWidth()
                    .height(1.dp)
                    .background(BrandGold.copy(alpha = 0.15f))
            )

            if (isSubmittedSuccess) {
                // Success State card
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(com.example.ui.theme.NeonGreen.copy(alpha = 0.08f), RoundedCornerShape(12.dp))
                        .border(1.dp, com.example.ui.theme.NeonGreen.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
                        .padding(16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text("✅", fontSize = 28.sp)
                        Text(
                            "PREDICTION TRANSMITTED!",
                            color = com.example.ui.theme.NeonGreen,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace
                        )
                        Text(
                            "Your economic conviction has been stamped and propagated to the high stakes ledger successfully.",
                            color = Color.LightGray,
                            fontSize = 10.sp,
                            textAlign = TextAlign.Center,
                            fontFamily = FontFamily.Monospace
                        )
                        Spacer(Modifier.height(4.dp))
                        OutlinedButton(
                            onClick = {
                                isSubmittedSuccess = false
                                predictedOutcome = ""
                                customEventText = ""
                            },
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = NeonCyan),
                            modifier = Modifier.height(32.dp),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 2.dp)
                        ) {
                            Text("SUBMIT ANOTHER", fontSize = 9.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                        }
                    }
                }
            } else {
                // Form Fields
                // 1. Economic Event Chips
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        "1. ECONOMIC EVENT SELECTOR",
                        color = NeonCyan,
                        fontSize = 9.5.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                    
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        eventsList.forEachIndexed { idx, event ->
                            val isSelected = selectedEventIndex == idx
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(if (isSelected) NeonCyan.copy(alpha = 0.2f) else Color.DarkGray.copy(alpha = 0.3f))
                                    .border(
                                        width = 1.dp,
                                        color = if (isSelected) NeonCyan else Color.DarkGray,
                                        shape = RoundedCornerShape(6.dp)
                                    )
                                    .clickable {
                                        selectedEventIndex = idx
                                        vm.playFeedbackTone(android.media.ToneGenerator.TONE_CDMA_PIP, 50)
                                    }
                                    .padding(horizontal = 8.dp, vertical = 6.dp)
                            ) {
                                Text(
                                    text = event,
                                    color = if (isSelected) Color.White else Color.Gray,
                                    fontSize = 10.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                        }
                    }

                    if (eventsList[selectedEventIndex] == "✏️ Custom Narrative Event") {
                        Spacer(Modifier.height(4.dp))
                        OutlinedTextField(
                            value = customEventText,
                            onValueChange = { customEventText = it },
                            placeholder = { Text("Enter custom economic event...", color = Color.Gray, fontSize = 11.sp, fontFamily = FontFamily.Monospace) },
                            modifier = Modifier.fillMaxWidth(),
                            textStyle = TextStyle(color = Color.White, fontSize = 12.sp, fontFamily = FontFamily.Monospace),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = NeonCyan,
                                unfocusedBorderColor = Color.DarkGray,
                                cursorColor = NeonCyan
                            ),
                            singleLine = true
                        )
                    }
                }

                // 2. Predicted Outcome Input
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        "2. PREDICT CONCRETE OUTCOME",
                        color = NeonPink,
                        fontSize = 9.5.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                    val samplePlaceholder = when (activeEventName) {
                        "📈 Fed December Rate Cut" -> "e.g. Rate cut of 50bps due to core CPI softening..."
                        "📉 US Inflation Threshold" -> "e.g. Core PCE deflator stabilizes below 2.1%..."
                        "🃏 Madhat's Gambit Arbitrage" -> "e.g. Double yield pool limits with stage 4 legendary card..."
                        "🤖 AI Semiconductor Supply Shock" -> "e.g. Taiwan foundry increases extreme ultraviolet processing..."
                        "💸 G7 Sovereign Currency Shift" -> "e.g. SDR weighting increases currency reserve backing..."
                        else -> "e.g. Specific quantified result of your proposed trade event..."
                    }
                    OutlinedTextField(
                        value = predictedOutcome,
                        onValueChange = { predictedOutcome = it },
                        placeholder = { Text(samplePlaceholder, color = Color.Gray, fontSize = 11.sp, fontFamily = FontFamily.Monospace) },
                        modifier = Modifier.fillMaxWidth(),
                        textStyle = TextStyle(color = Color.White, fontSize = 12.sp, fontFamily = FontFamily.Monospace),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = NeonPink,
                            unfocusedBorderColor = Color.DarkGray,
                            cursorColor = NeonPink
                        ),
                        singleLine = true
                    )
                }

                // 3. Numeric Confidence Slider
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    val confidencePercent = (confidenceLevel * 100).toInt()
                    val confidenceLabel = when {
                        confidenceLevel <= 0.3f -> "SPECULATIVE JEST"
                        confidenceLevel <= 0.6f -> "PROBABLE MOMENTUM"
                        confidenceLevel <= 0.8f -> "STRONG CONSENSUS"
                        else -> "IMMUTABLE CERTAINTY"
                    }
                    val labelColor = when {
                        confidenceLevel <= 0.3f -> NeonPink
                        confidenceLevel <= 0.6f -> NeonCyan
                        confidenceLevel <= 0.8f -> com.example.ui.theme.NeonGreen
                        else -> BrandGold
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "3. NUMERIC CONFIDENCE SLIDER",
                            color = labelColor,
                            fontSize = 9.5.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .background(labelColor.copy(alpha = 0.15f), RoundedCornerShape(4.dp))
                                    .padding(horizontal = 4.dp, vertical = 2.dp)
                            ) {
                                Text(confidenceLabel, color = labelColor, fontSize = 8.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                            }
                            Text(
                                "$confidencePercent%",
                                color = labelColor,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Black,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }

                    Slider(
                        value = confidenceLevel,
                        onValueChange = { newVal ->
                            val rounded = (newVal * 20f).toInt() / 20f
                            if (rounded != confidenceLevel) {
                                if (rounded >= 0.8f && confidenceLevel < 0.8f) {
                                    triggerExplosion = true
                                    vm.playFeedbackTone(android.media.ToneGenerator.TONE_CDMA_HIGH_PBX_SLS, 120)
                                }
                                confidenceLevel = rounded
                                vm.playFeedbackTone(android.media.ToneGenerator.TONE_CDMA_PIP, 40)
                            }
                        },
                        valueRange = 0.1f..1.0f,
                        colors = SliderDefaults.colors(
                            thumbColor = labelColor,
                            activeTrackColor = labelColor,
                            inactiveTrackColor = Color.DarkGray
                        )
                    )
                }

                // 4. Stake Slider
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "4. SPECULATIVE MADx STAKE",
                            color = BrandGold,
                            fontSize = 9.5.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace
                        )
                        Text(
                            "${stakeAmount.toInt()} \$MADx",
                            color = BrandGold,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.Monospace
                        )
                    }

                    Slider(
                        value = stakeAmount,
                        onValueChange = { newVal ->
                            val rounded = (newVal / 10f).toInt() * 10f
                            if (rounded != stakeAmount) {
                                stakeAmount = rounded
                                vm.playFeedbackTone(android.media.ToneGenerator.TONE_PROP_BEEP, 30)
                            }
                        },
                        valueRange = 10f..500f,
                        colors = SliderDefaults.colors(
                            thumbColor = BrandGold,
                            activeTrackColor = BrandGold,
                            inactiveTrackColor = Color.DarkGray
                        )
                    )
                }

                // Calculations Pane (Multiplier and Est Payload)
                val baseM = 1.6f
                val confidenceM = 1f + confidenceLevel * 2.5f
                val aggregateM = baseM * confidenceM
                val projectedRewards = stakeAmount * aggregateM

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color.Black.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                        .border(0.5.dp, BrandGold.copy(alpha = 0.15f), RoundedCornerShape(8.dp))
                        .padding(10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("MULTIPLIER THRESHOLD Boost", color = Color.Gray, fontSize =  8.sp, fontFamily = FontFamily.Monospace)
                        Text("${"%.2f".format(aggregateM)}x", color = com.example.ui.theme.NeonGreen, fontSize = 12.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                    }
                    Column(horizontalAlignment = Alignment.End) {
                        Text("ESTIMATED PAYOUT YIELD", color = Color.Gray, fontSize = 8.sp, fontFamily = FontFamily.Monospace)
                        Text("${"%.1f".format(projectedRewards)} \$MADx", color = BrandGold, fontSize = 12.sp, fontWeight = FontWeight.Black, fontFamily = FontFamily.Monospace)
                    }
                }

                // Submit Action Button
                val isInputValid = activeEventName.isNotBlank() && predictedOutcome.isNotBlank()
                val canSubmit = isInputValid && balance >= stakeAmount

                Button(
                    onClick = {
                        vm.submitMarketplacePrediction(
                            economicEvent = activeEventName,
                            predictedOutcome = predictedOutcome,
                            confidenceLevel = confidenceLevel,
                            stakeAmount = stakeAmount.toDouble()
                        )
                        triggerExplosion = true
                        isSubmittedSuccess = true
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(46.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = BrandGold,
                        contentColor = BgDeep,
                        disabledContainerColor = Color.DarkGray.copy(alpha = 0.4f),
                        disabledContentColor = Color.Gray
                    ),
                    shape = RoundedCornerShape(10.dp),
                    enabled = canSubmit
                ) {
                    Text(
                        text = if (!isInputValid) {
                            "FILL OUT PREDICTION"
                        } else if (balance < stakeAmount) {
                            "INSUFFICIENT MADX BALANCE"
                        } else {
                            "⚡ TRANSMIT CONVICTION POSITION ⚡"
                        },
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = FontFamily.Monospace,
                        letterSpacing = 1.sp
                    )
                }
            }
        }

        DopamineBurstEffect(
            trigger = triggerExplosion,
            onAnimationEnd = { triggerExplosion = false },
            modifier = Modifier.matchParentSize()
        )
    }
}

