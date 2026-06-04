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

@Composable
fun SatireTickerWidget() {
    val theme = LocalGambitTheme.current
    var isSatireMode by remember { mutableStateOf(true) }

    // Mock realistic updates every 2 mins simulated using a fast ticker for demo
    var tick by remember { mutableStateOf(0) }
    LaunchedEffect(Unit) {
        while (true) {
            delay(120_000L) // 2 real minutes
            tick++
        }
    }

    val satireItems = listOf(
        "BREAKING: FED prints more money, water still wet. \uD83D\uDCB8",
        "SEC classifies breathing as an unregistered security. \uD83D\uDEAB",
        "Crypto Bros discover outside world, report 'graphics are okay but gameplay sucks'. \uD83C\uDFDE\uFE0F",
        "Wall Street bets guy YOLO's life savings into gourd futures again. \uD83C\uDF83",
        "Elizabeth Warren yells at Bitcoin manager to speak to the CEO. \uD83D\uDC69\u200D\uD83D\uDCBC",
        "TikTok influencer explains macroeconomics, millions instantly poorer. \uD83D\uDCF1",
        "Goldbugs still waiting for the imminent collapse of society. \uD83E\uDDF1",
        "SBF writes new book: 'How I Lost 8 Billion and Kept My Hair'. \uD83D\uDCD6",
        "Local man 'buying the dip' for the 14th consecutive time this week. \uD83D\uDE2D",
        "AI Agent trades better than 99% of hedge funds by just sleeping. \uD83E\uDD16"
    )

    val marketItems = listOf(
        "BTC $69,420 (+4.2%)", "ETH $3,800 (+1.1%)", "USDT $1.00 (0.0%)", "USDC $1.00 (0.0%)", 
        "BNB $590 (-0.5%)", "SOL $145 (+8.4%)", "XRP $0.62 (-1.2%)", "DOGE $0.16 (+12.0%)", 
        "ADA $0.45 (+0.1%)", "AVAX $35.00 (+2.3%)", "AAPL $190.12 (-0.2%)", "MSFT $415.50 (+1.4%)", 
        "NVDA $1150.00 (+5.6%)", "TSLA $175.20 (-2.1%)", "AMZN $185.00 (+0.8%)", "META $470.30 (+1.1%)",
        "GOOGL $170.80 (-0.4%)", "BRK.B $405.10 (+0.2%)", "JPM $200.50 (+0.5%)", "V $275.60 (-0.1%)",
        "WMT $65.20 (+0.4%)", "XOM $115.40 (-1.5%)", "GOLD $2,350/oz (+0.8%)", "SILVER $30.50/oz (+2.1%)",
        "PLATINUM $1,050/oz (-0.5%)", "PALLADIUM $980/oz (+1.2%)", "COPPER $4.80/lb (+3.4%)", 
        "CRUDE OIL $78.50/bbl (-1.1%)", "NAT GAS $2.40/MMBtu (+1.5%)", "WHEAT $6.50/bu (+0.2%)"
    )

    // The data is conceptually responsive to the 'tick'
    val displayItems = remember(isSatireMode, tick) {
        if (isSatireMode) satireItems.shuffled() else marketItems.shuffled()
    }

    val baseColor = if (isSatireMode) theme.brandAccent else theme.brandSecondary

    var showInfoPopup by remember { mutableStateOf(false) }

    val bgGlass = Color(0x33000000) // Transparent dark for glass effect

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(bgGlass)
            .border(1.dp, baseColor.copy(alpha = 0.3f))
            .pointerInput(Unit) {
                detectTapGestures(
                    onTap = { showInfoPopup = true },
                    onDoubleTap = { isSatireMode = !isSatireMode }
                )
            }
            .padding(vertical = 6.dp, horizontal = 0.dp)
    ) {
        HoverTooltip(text = "Double tap to toggle between Satire News & Global Markets feeds") {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .basicMarquee(
                        iterations = Int.MAX_VALUE,
                        velocity = 40.dp
                    ),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Ticker Label
                Box(
                    modifier = Modifier
                        .background(baseColor.copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                        .border(1.dp, baseColor, RoundedCornerShape(4.dp))
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = if (isSatireMode) "MAD NEWS" else "GLOBAL MARKETS",
                        color = baseColor,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = com.example.ui.theme.ArialNarrowFamily,
                        style = TextStyle(shadow = Shadow(baseColor, blurRadius = 8f))
                    )
                }
                
                Spacer(modifier = Modifier.width(16.dp))

                displayItems.forEach { item ->
                    Text(
                        text = item,
                        color = theme.textPrimary,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = com.example.ui.theme.ArialNarrowFamily,
                        modifier = Modifier.padding(end = 32.dp)
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
            title = { Text(if (isSatireMode) "MAD NEWS REASONER" else "GLOBAL MARKETS REPORT") },
            text = { Text(if (isSatireMode) "The MAD News feed utilizes LLM NLP to aggregate and satirize current market sentiment in real time. It's built to keep dopamine levels active." else "Live market streams connected via RSS feeds tracking major indices and alt-coins globally in real time.", color = theme.textPrimary) }
        )
    }
}
