package com.example.ui.components

import androidx.compose.animation.*
import androidx.compose.foundation.basicMarquee
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.LocalGambitTheme
import kotlinx.coroutines.delay
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.graphics.Shadow

import androidx.compose.ui.graphics.graphicsLayer

@Composable
fun IntegratedTickerWidget(
    isSatireMode: Boolean,
    telemetry: com.example.model.NeuralTelemetryStats? = null,
    isNeuralOnly: Boolean = false,
    isClickable: Boolean = true,
    speedMultiplier: Float = 1.0f
) {
    val theme = LocalGambitTheme.current

    var fetchedSatireItems by remember { mutableStateOf<List<String>>(emptyList()) }
    var fetchedRssArticles by remember { mutableStateOf<List<com.example.api.RssFeedFetcher.RssItem>>(emptyList()) }
    var isFetching by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        if (fetchedSatireItems.isEmpty()) {
            isFetching = true
            try {
                val rssItems = com.example.api.RssFeedFetcher.fetchRealRssArticles()
                if (rssItems.isNotEmpty()) {
                    fetchedRssArticles = rssItems
                }
                
                val items = com.example.api.GeminiRepository().fetchSatiricalHeadlines()
                fetchedSatireItems = items.ifEmpty {
                    if (rssItems.isNotEmpty()) {
                        rssItems.shuffled().take(6).map { "BREAKING: [${it.source}] ${it.title} -> MADHAT'r says: Total madness! 🎩" }
                    } else {
                        listOf(
                            "BREAKING: FED prints more money, water still wet. 💵",
                            "LIAR ENGINE: 89% probability this 'DeFi Summer' is just 3 guys in a basement. 🚫",
                            "CONVICTION ALERT: Herd mentality surging on meme tickers. 🏔️",
                            "SENTINEL ONLINE: Tracking 14 new alpha news streams. 🎃",
                            "SYBIL DEFENSE: 42,000 bots blocked from taking your yield. 🧱",
                            "MAD SHIELD: Circuit breaker primed and ready to lock buffers. 📚"
                        )
                    }
                }
                if (fetchedSatireItems.isNotEmpty()) {
                    com.example.api.RssFeedFetcher.lastSatiricalHeadlines = fetchedSatireItems
                }
            } catch (e: Exception) {
                android.util.Log.e("SatireTickerWidget", "Error fetching real RSS items", e)
            } finally {
                isFetching = false
            }
        }
    }

    val satireItems = if (fetchedSatireItems.isNotEmpty()) fetchedSatireItems else listOf(
        "Loading real-time satirical news via Google Search Grounding..."
    )

    val marketItems = remember(fetchedRssArticles) {
        val baseCrypto = listOf(
            "BTC $94,420 (+4.2%)", "ETH $3,800 (+1.1%)", "SOL $145 (+8.4%)", "MADDEX $35.00 (+200.3%)"
        )
        val macroRss = fetchedRssArticles.filter { it.source == "CNBC" || it.source == "BBC" || it.source == "YahooFinance" }
        if (macroRss.isNotEmpty()) {
            baseCrypto + macroRss.take(6).map { "${if (it.source == "CNBC") "💵" else "📈"} [${it.source}] ${it.title}" }
        } else {
            baseCrypto + listOf(
                "NVDA $1150.00 (+5.6%)", "TSLA $175.20 (-2.1%)", "AMZN $185.00 (+0.8%)", "GOLD $2,350/oz (+0.8%)"
            )
        }
    }

    val neuralTelemetryItems = remember(telemetry, fetchedRssArticles) {
        val sentimentVal = telemetry?.sentimentMetric ?: 89.4f
        val trustVal = telemetry?.dynamicConfidence?.let { "%.2f".format(it * 100) } ?: "99.8"
        val blockedVal = telemetry?.sybilAttacksDeflected ?: 4210
        val bandwidthVal = telemetry?.networkSpeedGbps?.let { "%.1f".format(it) } ?: "98.4"
        val loadVal = telemetry?.cognitiveLoad?.let { "${(it * 100).toInt()}%" } ?: "72%"
        
        val baseTelem = listOf(
            "🧠 EIGENTRUST: $trustVal% [SECURED]",
            "🧠 TELEMETRY SENTIMENT: ${"%.2f".format(sentimentVal)}% [LIVE-STREAM]",
            "🧠 MADx LOAD: $loadVal",
            "🧠 SYBIL BLOCKS: $blockedVal DEFLECTED"
        )
        
        val cryptoNews = fetchedRssArticles.filter { it.source == "CoinDesk" || it.source == "CoinTelegraph" }
        if (cryptoNews.isNotEmpty()) {
            baseTelem + cryptoNews.take(4).map { "🧠 [${it.source}] ${it.title}" }
        } else {
            baseTelem + listOf(
                "🧠 AVG WIN RATE: ${(sentimentVal * 0.6).toInt()}% [STABLE]",
                "🧠 GLOBAL RANK: #84 [ELITE]"
            )
        }
    }

    var activeChoiceState by remember { mutableStateOf(if (isSatireMode) 2 else 0) }
    val activeChoice = if (isNeuralOnly) 1 else activeChoiceState

    val displayItems = remember(activeChoice, telemetry, marketItems, neuralTelemetryItems, satireItems) {
        when (activeChoice) {
            0 -> marketItems
            1 -> neuralTelemetryItems
            else -> satireItems
        }
    }

    val baseColor = when (activeChoice) {
        0 -> com.example.ui.theme.NeonGreen
        1 -> com.example.ui.theme.NeonCyan
        else -> com.example.ui.theme.NeonMagenta
    }

    val labelText = when (activeChoice) {
        0 -> "GLOBAL MARKETS 📈"
        1 -> "NEURAL TELEMETRY 🧠"
        else -> "MAD SATIRE 🌐"
    }

    var showInfoPopup by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 0.5.dp, bottom = 0.5.dp)
            .clip(RoundedCornerShape(4.dp))
            .background(baseColor.copy(alpha = 0.3f)) // Exactly 70% transparent base container feed
            .border(0.6.dp, com.example.ui.theme.GoldFlakeBrush, RoundedCornerShape(4.dp))
            .let {
                if (isClickable) {
                    it.clickable {
                        activeChoiceState = (activeChoiceState + 1) % 3
                    }
                } else {
                    it
                }
            }
            .padding(vertical = 0.dp, horizontal = 4.dp)
            .graphicsLayer {
                rotationX = 15f
                rotationY = if (activeChoice == 2) -2f else 2f
                cameraDistance = 10f * density
                shadowElevation = 8f
                shape = RoundedCornerShape(4.dp)
                clip = true
            }
    ) {
        val tooltipText = if (isClickable) "Tap to cycle feed choice: Markets ➡️ Telemetry ➡️ Satire Alerts" else "Neural Telemetry live feed [PERPETUAL]"
        HoverTooltip(text = tooltipText) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .basicMarquee(
                        iterations = Int.MAX_VALUE,
                        animationMode = androidx.compose.foundation.MarqueeAnimationMode.Immediately,
                        velocity = (45f * speedMultiplier).dp
                    ),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Ticker Label (Clickable alone for info popup)
                Box(
                    modifier = Modifier
                        .glassReflection(baseColor, RoundedCornerShape(4.dp))
                        .let {
                            if (isClickable) {
                                it.clickable { 
                                    showInfoPopup = true 
                                }
                            } else {
                                it
                            }
                        }
                        .padding(horizontal = 4.dp, vertical = 0.dp)
                ) {
                    Box(Modifier.matchParentSize().background(getGlassReflectionBrush(baseColor)))
                    Text(
                        text = labelText,
                        color = baseColor,
                        fontSize = 13.5.sp, // optimized for 1.5 pt relative scale
                        fontWeight = FontWeight.Black,
                        fontFamily = com.example.ui.theme.AllertaStencilFamily,
                        modifier = Modifier.padding(horizontal = 1.5.dp, vertical = 0.dp),
                        style = TextStyle(shadow = Shadow(baseColor, blurRadius = 8f))
                    )
                }
                
                Spacer(modifier = Modifier.width(16.dp))

                displayItems.forEach { item ->
                    Text(
                        text = item,
                        color = com.example.ui.theme.BrandEggwhite,
                        fontSize = 15.sp, // optimized for 1.5 pt relative scale
                        fontWeight = FontWeight.Bold,
                        fontFamily = com.example.ui.theme.AllertaStencilFamily,
                        modifier = Modifier.padding(end = 32.dp, top = 0.dp, bottom = 0.dp, start = 1.5.dp),
                        style = TextStyle(
                            shadow = Shadow(
                                color = Color.Black.copy(alpha = 0.85f),
                                offset = androidx.compose.ui.geometry.Offset(1f, 1.5f),
                                blurRadius = 4f
                            )
                        )
                    )
                }
            }
        }
    }

    if (showInfoPopup) {
        androidx.compose.material3.AlertDialog(
            onDismissRequest = { showInfoPopup = false },
            confirmButton = {
                androidx.compose.material3.TextButton(onClick = { showInfoPopup = false }) {
                    Text("Close", color = theme.brandSecondary)
                }
            },
            containerColor = theme.bgCard,
            titleContentColor = theme.brandSecondary,
            title = { Text(if (activeChoice == 2) "MAD TELEMETRY STREAM" else if (activeChoice == 1) "NEURAL TELEMETRY FEED" else "GLOBAL MARKETS REPORT") },
            text = { Text(if (activeChoice == 2) "The MAD Telemetry feed utilizes LLM NLP to aggregate and satirize current market sentiment in real time. Combined with Global Markets." else if (activeChoice == 1) "Live market streams connected via Neural Telemetry tracking major indices and alt-coins globally in real time. Combined with MAD News." else "Real-time pricing for the leading blockchain pairs and macro equities tracking dynamic, unredacted volume activity.", color = theme.textPrimary) }
        )
    }
}
