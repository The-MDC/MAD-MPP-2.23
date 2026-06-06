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
    isClickable: Boolean = true
) {
    val theme = LocalGambitTheme.current

    val satireItems = listOf(
        "BREAKING: FED prints more money, water still wet. 💵",
        "LIAR ENGINE: 89% probability this 'DeFi Summer' is just 3 guys in a basement. 🚫",
        "CONVICTION ALERT: Herd mentality surging on meme ticker \$WIF. 🏔️",
        "SENTINEL ONLINE: Tracking 14 new alpha repositories. 🎃",
        "MORPHO VAULTS: Rates looking suspiciously generous today. 👩‍💼",
        "AERODROME POOLS: Liquidity providers experiencing maximal dopamine. 📱",
        "SYBIL DEFENSE: 42,000 bots blocked from taking your yield. 🧱",
        "MAD SHIELD: Circuit breaker primed and ready to ruin someone's day. 📚",
        "PREDICTION CIRCUS: Over/Under on total global collapse is leaning Over. 😭",
        "AI Agent trades better than 99% of hedge funds by just sleeping. 🤖"
    )

    val marketItems = listOf(
        "BTC $94,420 (+4.2%)", "ETH $3,800 (+1.1%)", "USDT $1.00 (0.0%)", "USDC $1.00 (0.0%)", 
        "BNB $590 (-0.5%)", "SOL $145 (+8.4%)", "XRP $0.62 (-1.2%)", "DOGE $0.16 (+12.0%)", 
        "AERO $1.45 (+40.1%)", "MADDEX $35.00 (+200.3%)", "MORPHO $2.12 (-0.2%)", "MSFT $415.50 (+1.4%)", 
        "NVDA $1150.00 (+5.6%)", "TSLA $175.20 (-2.1%)", "AMZN $185.00 (+0.8%)", "META $470.30 (+1.1%)",
        "GOOGL $170.80 (-0.4%)", "BRK.B $405.10 (+0.2%)", "JPM $200.50 (+0.5%)", "V $275.60 (-0.1%)",
        "GOLD $2,350/oz (+0.8%)", "SILVER $30.50/oz (+2.1%)"
    )

    val neuralTelemetryItems = remember(telemetry) {
        val sentimentVal = telemetry?.sentimentMetric ?: 89.4f
        val trustVal = telemetry?.dynamicConfidence?.let { "%.2f".format(it * 100) } ?: "99.8"
        val blockedVal = telemetry?.sybilAttacksDeflected ?: 4210
        val bandwidthVal = telemetry?.networkSpeedGbps?.let { "%.1f".format(it) } ?: "98.4"
        val loadVal = telemetry?.cognitiveLoad?.let { "${(it * 100).toInt()}%" } ?: "72%"
        
        listOf(
            "🧠 EIGENTRUST: $trustVal% [SECURED]",
            "🧠 TELEMETRY SENTIMENT: ${"%.2f".format(sentimentVal)}% [LIVE-STREAM]",
            "🧠 MADx SYSTEM LOAD: $loadVal",
            "🧠 BANDWIDTH: $bandwidthVal Gbps",
            "🧠 SYBIL BLOCKS: $blockedVal DEFLECTED",
            "🧠 AVG WIN RATE: ${(sentimentVal * 0.6).toInt()}% [STABLE]",
            "🧠 GLOBAL RANK: #84 [ELITE]",
            "🧠 CARD W/L RATIO: 58.2% [BULLISH]"
        )
    }

    var activeChoiceState by remember { mutableStateOf(if (isSatireMode) 2 else 0) }
    val activeChoice = if (isNeuralOnly) 1 else activeChoiceState

    val displayItems = remember(activeChoice, telemetry) {
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
            .glassContainerBackground(baseColor, RoundedCornerShape(4.dp))
            .let {
                if (isClickable) {
                    it.clickable {
                        activeChoiceState = (activeChoiceState + 1) % 3
                    }
                } else {
                    it
                }
            }
            .padding(vertical = 4.dp, horizontal = 4.dp)
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
                        velocity = 45.dp
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
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                ) {
                    Box(Modifier.matchParentSize().background(getGlassReflectionBrush(baseColor)))
                    Text(
                        text = labelText,
                        color = baseColor,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = com.example.ui.theme.AllertaStencilFamily,
                        style = TextStyle(shadow = Shadow(baseColor, blurRadius = 8f))
                    )
                }
                
                Spacer(modifier = Modifier.width(16.dp))

                val tickerColors = listOf(com.example.ui.theme.NeonMagenta, com.example.ui.theme.NeonCyan, com.example.ui.theme.BrandGold)
                displayItems.forEachIndexed { index, item ->
                    Text(
                        text = item,
                        color = tickerColors[index % tickerColors.size],
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = com.example.ui.theme.AllertaStencilFamily,
                        modifier = Modifier.padding(end = 32.dp),
                        style = TextStyle(shadow = Shadow(tickerColors[index % tickerColors.size].copy(alpha=0.5f), blurRadius = 6f))
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
