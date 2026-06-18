package com.example.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.GraphicEq
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.BrandGold
import com.example.ui.theme.LocalGambitTheme
import com.example.ui.theme.NeonCyan
import com.example.ui.theme.NeonGreen
import com.example.api.GeminiRepository
import com.example.api.MADGambitPersona
import kotlinx.coroutines.launch
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.StarBorder
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.ContentCopy

data class DashboardMarketInfo(
    val id: String,
    val name: String,
    val category: String,
    val convictionPercent: Int,
    val volatilityIndex: Int,
    val historicalVolatility: List<Float>
)

data class VolatilityToastAlert(
    val id: String,
    val marketName: String,
    val currentVolatility: Int,
    val satiricalAlertText: String
)

@Composable
fun PersonaAvatar(
    name: String,
    emoji: String,
    sizeDp: Int = 36,
    isSelected: Boolean = false
) {
    val theme = LocalGambitTheme.current
    val avatarColor = when (name.lowercase()) {
        "madhat'r" -> Color(0xFFFF4500) // Crimson
        "cowork" -> Color(0xFF1E88E5) // Blue
        "gemma" -> Color(0xFFFFB300) // Amber
        "manus" -> Color(0xFF78909C) // Steel
        "claude" -> Color(0xFF7E57C2) // Violet
        "nemotron-3 super" -> Color(0xFFD32F2F) // Compliance Red
        "qwen" -> Color(0xFF00E676) // Zen Green
        else -> theme.brandSecondary
    }

    Box(
        modifier = Modifier
            .size(sizeDp.dp)
            .clip(CircleShape)
            .background(theme.bgDeep)
            .border(
                width = if (isSelected) 2.dp else 1.dp,
                brush = if (isSelected) Brush.sweepGradient(listOf(avatarColor, theme.brandAccent, avatarColor))
                        else Brush.linearGradient(listOf(theme.textSecondary.copy(alpha = 0.2f), Color.Transparent)),
                shape = CircleShape
            ),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            drawCircle(
                color = avatarColor.copy(alpha = 0.12f),
                radius = size.width / 2f
            )
            
            if (isSelected) {
                drawCircle(
                    color = avatarColor.copy(alpha = 0.3f),
                    radius = size.width / 2.2f,
                    style = Stroke(
                        width = 1.5f,
                        pathEffect = PathEffect.dashPathEffect(floatArrayOf(6f, 8f))
                    )
                )
            }
            
            // Specialized procedural drawings for high fidelity
            when (name.lowercase()) {
                "madhat'r" -> {
                    drawLine(
                        color = Color(0xFFFFD700).copy(alpha = 0.3f),
                        start = Offset(size.width * 0.15f, size.height * 0.15f),
                        end = Offset(size.width * 0.85f, size.height * 0.15f),
                        strokeWidth = 2f
                    )
                }
                "cowork" -> {
                    drawCircle(Color.White.copy(alpha = 0.15f), radius = 2f, center = Offset(size.width * 0.25f, size.height * 0.25f))
                    drawCircle(Color.White.copy(alpha = 0.15f), radius = 2f, center = Offset(size.width * 0.75f, size.height * 0.25f))
                }
                "gemma" -> {
                    drawLine(
                        color = Color.Yellow.copy(alpha = 0.3f),
                        start = Offset(0f, size.height / 2),
                        end = Offset(size.width, size.height / 2),
                        strokeWidth = 1f
                    )
                }
                "manus" -> {
                    drawRect(
                        color = Color.White.copy(alpha = 0.15f),
                        topLeft = Offset(size.width * 0.25f, size.height * 0.25f),
                        size = Size(size.width * 0.5f, size.height * 0.5f),
                        style = Stroke(width = 1f)
                    )
                }
                "claude" -> {
                    val path = Path().apply {
                        moveTo(0f, size.height * 0.7f)
                        quadraticTo(size.width * 0.5f, size.height * 0.3f, size.width, size.height * 0.7f)
                    }
                    drawPath(path, color = Color.Magenta.copy(alpha = 0.2f), style = Stroke(width = 1.5f))
                }
                "nemotron-3 super" -> {
                    drawLine(color = Color.Red.copy(alpha = 0.25f), start = Offset(size.width / 2, 0f), end = Offset(size.width / 2, size.height), strokeWidth = 1f)
                    drawLine(color = Color.Red.copy(alpha = 0.25f), start = Offset(0f, size.height / 2), end = Offset(size.width, size.height / 2), strokeWidth = 1f)
                }
                "qwen" -> {
                    drawCircle(Color.Green.copy(alpha = 0.15f), radius = size.width / 4, center = Offset(size.width / 2, size.height / 2), style = Stroke(width = 1f))
                }
            }
        }
        
        Text(
            text = emoji,
            fontSize = (sizeDp * 0.5f).sp,
            textAlign = TextAlign.Center
        )
    }
}

@Composable
fun ConvictionLeaderboardWidget(
    markets: List<DashboardMarketInfo>,
    selectedMarket: DashboardMarketInfo,
    onMarketSelect: (DashboardMarketInfo) -> Unit
) {
    val theme = LocalGambitTheme.current
    
    val rankedMarkets = remember(markets) {
        markets.sortedByDescending { it.convictionPercent }
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(theme.bgCard.copy(alpha = 0.15f), RoundedCornerShape(16.dp))
            .border(theme.borderWidth, theme.borderBrush, RoundedCornerShape(16.dp))
            .padding(14.dp)
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("👑", fontSize = 16.sp)
                    Spacer(Modifier.width(6.dp))
                    Text(
                        "CONVICTION LEADERBOARD",
                        color = theme.textPrimary,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = com.example.ui.theme.ArialNarrowFamily
                    )
                }
                Text(
                    "TOP RANKINGS",
                    color = theme.brandSecondary,
                    fontSize = 8.sp,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Black
                )
            }
            Text(
                "Markets ranked by highest community staked conviction and trust index",
                color = theme.textSecondary,
                fontSize = 9.5.sp,
                modifier = Modifier.padding(bottom = 10.dp)
            )

            Column(
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                rankedMarkets.forEachIndexed { index, mkt ->
                    val isSelected = mkt.id == selectedMarket.id
                    val rankColor = when (index) {
                        0 -> Color(0xFFFFD700) // gold
                        1 -> Color(0xFFC0C0C0) // silver
                        2 -> Color(0xFFCD7F32) // bronze
                        else -> theme.textSecondary.copy(alpha = 0.6f)
                    }
                    val badgeSymbol = when (index) {
                        0 -> "👑"
                        1 -> "⭐"
                        2 -> "🥉"
                        else -> "#${index + 1}"
                    }

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(
                                if (isSelected) theme.brandAccent.copy(alpha = 0.1f)
                                else theme.bgDeep.copy(alpha = 0.2f)
                            )
                            .border(
                                width = 1.dp,
                                color = if (isSelected) theme.brandAccent else theme.textSecondary.copy(alpha = 0.05f),
                                shape = RoundedCornerShape(8.dp)
                            )
                            .clickable { onMarketSelect(mkt) }
                            .padding(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(24.dp)
                                .clip(CircleShape)
                                .background(rankColor.copy(alpha = 0.15f))
                                .border(1.dp, rankColor, CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = badgeSymbol,
                                fontSize = if (index < 3) 12.sp else 9.sp,
                                fontWeight = FontWeight.Bold,
                                color = rankColor
                            )
                        }

                        Spacer(Modifier.width(10.dp))

                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = mkt.name,
                                color = theme.textPrimary,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                maxLines = 1
                            )
                            Text(
                                text = "${mkt.category} • Volatility: ${mkt.volatilityIndex}%",
                                color = theme.textSecondary,
                                fontSize = 8.5.sp
                            )
                        }

                        Spacer(Modifier.width(8.dp))

                        Column(horizontalAlignment = Alignment.End) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = "${mkt.convictionPercent}%",
                                    color = NeonGreen,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Black
                                )
                                Text(" Conviction", color = theme.textSecondary, fontSize = 8.sp)
                            }
                            Box(
                                modifier = Modifier
                                    .width(60.dp)
                                    .height(3.dp)
                                    .background(theme.bgDeep, RoundedCornerShape(1.5.dp))
                            ) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth(mkt.convictionPercent / 100f)
                                        .fillMaxHeight()
                                        .background(NeonGreen, RoundedCornerShape(1.5.dp))
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ConvictionDashboardOverlay(
    isVisible: Boolean,
    onClose: () -> Unit,
    vm: com.example.viewmodel.GambitViewModel
) {
    val theme = LocalGambitTheme.current
    val scope = rememberCoroutineScope()
    val scrollState = rememberScrollState()

    // Pre-seeded high-fidelity active prediction markets
    val predictionMarkets = remember {
        listOf(
            DashboardMarketInfo(
                id = "gensler_top_hat",
                name = "Gary Gensler's Top-Hat Retirement Fund Plan",
                category = "Regulatory",
                convictionPercent = 78,
                volatilityIndex = 92,
                historicalVolatility = listOf(81f, 85f, 79f, 90f, 95f, 92f, 89f, 91f, 94f, 92f)
            ),
            DashboardMarketInfo(
                id = "sbf_cookbook",
                name = "SBF's Vegan Prison Diet Cookbook Release Date",
                category = "Pop Culture",
                convictionPercent = 45,
                volatilityIndex = 81,
                historicalVolatility = listOf(40f, 48f, 55f, 62f, 75f, 80f, 85f, 81f, 78f, 81f)
            ),
            DashboardMarketInfo(
                id = "outliers_meta",
                name = "Jamie Burke's Outliers Metaverse Real Estate Surge",
                category = "Metaverse",
                convictionPercent = 91,
                volatilityIndex = 24,
                historicalVolatility = listOf(12f, 15f, 18f, 22f, 25f, 28f, 22f, 23f, 25f, 24f)
            ),
            DashboardMarketInfo(
                id = "battle_royale",
                name = "Kalshi vs Polymarket SEC Courtroom Battle Royale",
                category = "Crypto Legal",
                convictionPercent = 66,
                volatilityIndex = 75,
                historicalVolatility = listOf(50f, 58f, 64f, 70f, 81f, 79f, 75f, 73f, 77f, 75f)
            ),
            DashboardMarketInfo(
                id = "quadratic_fibo",
                name = "Quadratic Governance with Fibonacci Sequence Adoption",
                category = "DAO",
                convictionPercent = 84,
                volatilityIndex = 41,
                historicalVolatility = listOf(35f, 38f, 40f, 42f, 41f, 39f, 43f, 45f, 42f, 41f)
            )
        )
    }

    var searchQuery by remember { mutableStateOf("") }
    var showWatchlistOnly by remember { mutableStateOf(false) }
    var watchlistIds by remember { mutableStateOf(setOf("gensler_top_hat", "outliers_meta")) }
    var showExportDialog by remember { mutableStateOf(false) }
    var exportedJsonText by remember { mutableStateOf("") }

    val filteredMarkets = remember(searchQuery, showWatchlistOnly, watchlistIds) {
        predictionMarkets.filter { mkt ->
            val matchesSearch = mkt.name.contains(searchQuery, ignoreCase = true) || 
                                mkt.category.contains(searchQuery, ignoreCase = true)
            val matchesWatchlist = !showWatchlistOnly || watchlistIds.contains(mkt.id)
            matchesSearch && matchesWatchlist
        }
    }

    var selectedMarket by remember { mutableStateOf(predictionMarkets.first()) }
    var selectedPersona by remember { mutableStateOf(MADGambitPersona.personas.first()) }
    var commentaryText by remember { mutableStateOf("Ready to receive neural intelligence data. Adopt a persona rules above to request a satirical roast of the selected market!") }
    var isCommentaryLoading by remember { mutableStateOf(false) }

    var stakeAmount by remember { mutableStateOf("") }
    var isConfirmed by remember { mutableStateOf(false) }

    // Floating/stacked dynamic toast alerts state for high volatility shifts (>80%)
    var activeAlerts by remember { mutableStateOf<List<VolatilityToastAlert>>(emptyList()) }

    // Shift notification builder checks whenever visible
    LaunchedEffect(isVisible) {
        if (isVisible) {
            val highValMarkets = predictionMarkets.filter { it.volatilityIndex > 80 }
            activeAlerts = highValMarkets.map { mkt ->
                val lines = listOf(
                    "Oof! Hold onto your Top-Hats, this is getting dangerously hyper-unstable!",
                    "Whoa deregulation panic! Fasten your seatbelts, macro chaos inbound!",
                    "Liquidations trigger alert! Pure speculative velocity detected, tough guy!",
                    "Holy smokes, volatility is melting the server boards over here! Recompile!"
                )
                VolatilityToastAlert(
                    id = mkt.id,
                    marketName = mkt.name,
                    currentVolatility = mkt.volatilityIndex,
                    satiricalAlertText = lines.random()
                )
            }
            if (activeAlerts.isNotEmpty()) {
                val topAlert = activeAlerts.first()
                com.example.engine.MadhatrVoice.speak(
                    "Yo! Market Shift Alert! ${topAlert.marketName} has breached the limit at ${topAlert.currentVolatility} percent volatility! Check it out, speedy!"
                )
            }
        }
    }

    AnimatedVisibility(
        visible = isVisible,
        enter = fadeIn() + slideInVertically(initialOffsetY = { -it }),
        exit = fadeOut() + slideOutVertically(targetOffsetY = { -it })
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.75f))
                .clickable { onClose() },
            contentAlignment = Alignment.Center
        ) {
            Box(
                Modifier
                    .padding(horizontal = 16.dp, vertical = 24.dp)
                    .fillMaxHeight(0.92f)
                    .fillMaxWidth()
                    .clickable(enabled = false) {}
                    .glassContainerBackground(theme.bgCard, RoundedCornerShape(24.dp))
                    .border(1.dp, theme.borderBrush, RoundedCornerShape(24.dp))
                    .padding(18.dp)
            ) {
                Column(
                    Modifier
                        .fillMaxSize()
                        .verticalScroll(scrollState)
                ) {
                    // Header Block
                    Row(
                        Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                "INTELLIGENCE DASHBOARD",
                                color = theme.brandSecondary,
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Black,
                                fontFamily = com.example.ui.theme.ArialNarrowFamily
                            )
                            Text(
                                "Real-time volatility tracking, leaderboards & multi-agent commentary",
                                color = theme.textSecondary,
                                fontSize = 11.sp
                            )
                        }
                        IconButton(onClick = onClose) {
                            Icon(Icons.Filled.Close, contentDescription = "Close", tint = theme.textPrimary)
                        }
                    }

                    Spacer(Modifier.height(12.dp))

                    TopMarketsAndLiarsDualTicker(vm)
                    
                    Spacer(Modifier.height(12.dp))

                    // 1. Toast Notifications System Banner (Displays alert for volatile market shift > 80%)
                    if (activeAlerts.isNotEmpty()) {
                        Column(
                            verticalArrangement = Arrangement.spacedBy(6.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 12.dp)
                        ) {
                            activeAlerts.forEach { alert ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(com.example.ui.theme.BrandCrimson.copy(alpha = 0.15f))
                                        .border(1.dp, com.example.ui.theme.BrandCrimson, RoundedCornerShape(12.dp))
                                        .clickable {
                                            val targetedMarket = predictionMarkets.firstOrNull { it.id == alert.id }
                                            if (targetedMarket != null) {
                                                selectedMarket = targetedMarket
                                            }
                                        }
                                        .padding(10.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(24.dp)
                                                .background(com.example.ui.theme.BrandCrimson, CircleShape),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text("🚨", fontSize = 11.sp)
                                        }
                                        Spacer(Modifier.width(10.dp))
                                        Column {
                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                Text(
                                                    "VOLATILE SHIFT ALERT: ",
                                                    color = theme.textSecondary,
                                                    fontSize = 8.5.sp,
                                                    fontFamily = FontFamily.Monospace,
                                                    fontWeight = FontWeight.Bold
                                                )
                                                Text(
                                                    "${alert.currentVolatility}% Index",
                                                    color = com.example.ui.theme.BrandCrimson,
                                                    fontSize = 10.sp,
                                                    fontWeight = FontWeight.Black
                                                )
                                            }
                                            Text(
                                                text = alert.marketName,
                                                color = theme.textPrimary,
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Bold,
                                                maxLines = 1
                                            )
                                            Text(
                                                text = "\"${alert.satiricalAlertText}\"",
                                                color = theme.brandSecondary,
                                                fontSize = 9.5.sp,
                                                fontStyle = androidx.compose.ui.text.font.FontStyle.Italic,
                                                maxLines = 1
                                            )
                                        }
                                    }
                                    IconButton(
                                        onClick = {
                                            activeAlerts = activeAlerts.filter { it.id != alert.id }
                                        },
                                        modifier = Modifier.size(24.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Filled.Close,
                                            contentDescription = "Dismiss Alert",
                                            tint = theme.textPrimary.copy(alpha = 0.5f),
                                            modifier = Modifier.size(14.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }

                    // 2. Conviction Leaderboard component (Ranks by highest user contributed conviction)
                    ConvictionLeaderboardWidget(
                        markets = filteredMarkets,
                        selectedMarket = selectedMarket,
                        onMarketSelect = { selectedMarket = it }
                    )

                    Spacer(Modifier.height(16.dp))

                    // 3. Prediction Markets Picker / Switcher with Search & Watchlist
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "ACTIVE PREDICTION MARKETS SELECTOR",
                            color = theme.textPrimary,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = com.example.ui.theme.ArialNarrowFamily
                        )
                    }
                    Spacer(Modifier.height(6.dp))

                    // Search Input Bar
                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("Filter by keyword or category...", color = theme.textSecondary.copy(alpha = 0.5f), fontSize = 12.sp) },
                        leadingIcon = {
                            Icon(Icons.Filled.Search, contentDescription = "Search", tint = theme.brandSecondary, modifier = Modifier.size(16.dp))
                        },
                        trailingIcon = {
                            if (searchQuery.isNotEmpty()) {
                                Icon(
                                    imageVector = Icons.Filled.Close,
                                    contentDescription = "Clear search",
                                    tint = theme.textSecondary,
                                    modifier = Modifier.size(16.dp).clickable { searchQuery = "" }
                                )
                            }
                        },
                        singleLine = true,
                        shape = RoundedCornerShape(12.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = theme.brandSecondary,
                            unfocusedBorderColor = theme.textSecondary.copy(alpha = 0.2f),
                            focusedContainerColor = theme.bgDeep.copy(alpha = 0.4f),
                            unfocusedContainerColor = theme.bgDeep.copy(alpha = 0.2f),
                            focusedTextColor = theme.textPrimary,
                            unfocusedTextColor = theme.textPrimary
                        )
                    )

                    Spacer(Modifier.height(8.dp))

                    // Watchlist Chips & Export Row
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            // All markets tab button
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(
                                        if (!showWatchlistOnly) theme.brandSecondary.copy(alpha = 0.15f)
                                        else theme.bgDeep.copy(alpha = 0.5f)
                                    )
                                    .border(
                                        1.dp,
                                        if (!showWatchlistOnly) theme.brandSecondary else theme.textSecondary.copy(alpha = 0.15f),
                                        RoundedCornerShape(8.dp)
                                    )
                                    .clickable { showWatchlistOnly = false }
                                    .padding(horizontal = 10.dp, vertical = 6.dp)
                            ) {
                                Text(
                                    "ALL MARKETS",
                                    color = if (!showWatchlistOnly) theme.textPrimary else theme.textSecondary,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = FontFamily.Monospace
                                )
                            }

                            // Watchlist tab button
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(
                                        if (showWatchlistOnly) BrandGold.copy(alpha = 0.15f)
                                        else theme.bgDeep.copy(alpha = 0.5f)
                                    )
                                    .border(
                                        1.dp,
                                        if (showWatchlistOnly) BrandGold else theme.textSecondary.copy(alpha = 0.15f),
                                        RoundedCornerShape(8.dp)
                                    )
                                    .clickable { showWatchlistOnly = true }
                                    .padding(horizontal = 10.dp, vertical = 6.dp)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Filled.Star,
                                        contentDescription = "Watchlist toggle",
                                        tint = if (showWatchlistOnly) BrandGold else theme.textSecondary,
                                        modifier = Modifier.size(10.dp)
                                    )
                                    Text(
                                        "WATCHLIST (${watchlistIds.size})",
                                        color = if (showWatchlistOnly) theme.textPrimary else theme.textSecondary,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        fontFamily = FontFamily.Monospace
                                    )
                                }
                            }
                        }

                        // Export Button
                        val context = androidx.compose.ui.platform.LocalContext.current
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(theme.brandAccent.copy(alpha = 0.12f))
                                .border(1.dp, theme.brandAccent.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                                .clickable {
                                    val jsonOutput = buildString {
                                        append("[\n")
                                        predictionMarkets.forEachIndexed { idx, mkt ->
                                            append("  {\n")
                                            append("    \"id\": \"${mkt.id}\",\n")
                                            append("    \"name\": \"${mkt.name}\",\n")
                                            append("    \"category\": \"${mkt.category}\",\n")
                                            append("    \"conviction_percentage\": ${mkt.convictionPercent},\n")
                                            append("    \"volatility_index\": ${mkt.volatilityIndex}\n")
                                            append("  }")
                                            if (idx < predictionMarkets.size - 1) append(",")
                                            append("\n")
                                        }
                                        append("]")
                                    }
                                    exportedJsonText = jsonOutput
                                    showExportDialog = true

                                    try {
                                        val file = java.io.File(context.cacheDir, "gambit_analytics.json")
                                        file.writeText(jsonOutput)
                                        vm.triggerVolatilityToast("USER ACTION", 50.0, "Exported JSON cached to device!", true)
                                    } catch (e: Exception) {
                                        e.printStackTrace()
                                    }
                                }
                                .padding(horizontal = 10.dp, vertical = 6.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Filled.Download,
                                    contentDescription = "Export JSON File",
                                    tint = theme.brandAccent,
                                    modifier = Modifier.size(12.dp)
                                )
                                Text(
                                    "EXPORT JSON",
                                    color = theme.brandAccent,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Black,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                        }
                    }

                    Spacer(Modifier.height(8.dp))

                    if (filteredMarkets.isEmpty()) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 16.dp)
                                .background(theme.bgDeep.copy(alpha = 0.15f), RoundedCornerShape(12.dp))
                                .border(1.dp, theme.textSecondary.copy(alpha = 0.1f), RoundedCornerShape(12.dp))
                                .padding(20.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("🎩", fontSize = 28.sp)
                                Spacer(Modifier.height(8.dp))
                                Text(
                                    text = if (showWatchlistOnly) "WATCHLIST IS EMPTY!" else "NO MARKETS MATCHED!",
                                    color = theme.brandSecondary,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = FontFamily.Monospace
                                )
                                Spacer(Modifier.height(4.dp))
                                Text(
                                    text = if (showWatchlistOnly) 
                                        "Tap the ★ on any prediction market in 'ALL MARKETS' view to save it to your watchlist!" 
                                        else "Adjust your filter terms. Macro volatility waits for no one!",
                                    color = theme.textSecondary,
                                    fontSize = 10.sp,
                                    textAlign = TextAlign.Center
                                )
                            }
                        }
                    } else {
                        Column(
                            verticalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            filteredMarkets.forEach { mkt ->
                                val isSelected = mkt.id == selectedMarket.id
                                val isWatchlisted = watchlistIds.contains(mkt.id)
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(
                                            if (isSelected) theme.brandSecondary.copy(alpha = 0.15f)
                                            else theme.bgDeep.copy(alpha = 0.5f)
                                        )
                                        .border(
                                            1.dp,
                                            if (isSelected) theme.brandSecondary else theme.textSecondary.copy(alpha = 0.1f),
                                            RoundedCornerShape(12.dp)
                                        )
                                        .clickable { selectedMarket = mkt }
                                        .padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        // Star Toggle button for watchlisting
                                        Icon(
                                            imageVector = if (isWatchlisted) Icons.Filled.Star else Icons.Filled.StarBorder,
                                            contentDescription = "Watchlist toggle",
                                            tint = if (isWatchlisted) BrandGold else theme.textSecondary.copy(alpha = 0.4f),
                                            modifier = Modifier
                                                .size(26.dp)
                                                .clickable {
                                                    watchlistIds = if (isWatchlisted) {
                                                        watchlistIds - mkt.id
                                                    } else {
                                                        watchlistIds + mkt.id
                                                    }
                                                }
                                                .padding(4.dp)
                                        )
                                        Spacer(Modifier.width(8.dp))
                                        Column {
                                            Text(
                                                text = mkt.category.uppercase(),
                                                color = if (isSelected) theme.brandSecondary else theme.brandAccent,
                                                fontSize = 9.sp,
                                                fontWeight = FontWeight.Bold,
                                                fontFamily = FontFamily.Monospace
                                            )
                                            Text(
                                                text = mkt.name,
                                                color = theme.textPrimary,
                                                fontSize = 13.sp,
                                                fontWeight = FontWeight.SemiBold
                                            )
                                        }
                                    }
                                    Column(
                                        horizontalAlignment = Alignment.End,
                                        modifier = Modifier.padding(start = 8.dp)
                                    ) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Text("CONVICTION: ", color = theme.textSecondary, fontSize = 9.sp)
                                            Text("${mkt.convictionPercent}%", color = NeonGreen, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                        }
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Text("VOLATILITY: ", color = theme.textSecondary, fontSize = 9.sp)
                                            Text("${mkt.volatilityIndex}%", color = theme.brandAccent, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }
                            }
                        }
                    }

                    Spacer(Modifier.height(16.dp))
                    
                    // 3.5 Prediction Stake Form
                    Text(
                        "SUBMIT PREDICTION CONVICTION",
                        color = theme.textPrimary,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = com.example.ui.theme.ArialNarrowFamily
                    )
                    Spacer(Modifier.height(8.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(theme.bgCard.copy(alpha = 0.15f), RoundedCornerShape(12.dp))
                            .border(1.dp, theme.borderBrush, RoundedCornerShape(12.dp))
                            .padding(16.dp)
                    ) {
                        Column {
                            OutlinedTextField(
                                value = stakeAmount,
                                onValueChange = { stakeAmount = it },
                                modifier = Modifier.fillMaxWidth(),
                                placeholder = { Text("Enter Stake Amount (\$MADx)", color = theme.textSecondary.copy(alpha = 0.5f), fontSize = 12.sp) },
                                singleLine = true,
                                shape = RoundedCornerShape(8.dp),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = NeonGreen,
                                    unfocusedBorderColor = theme.textSecondary.copy(alpha = 0.2f),
                                    focusedContainerColor = theme.bgDeep.copy(alpha = 0.4f),
                                    unfocusedContainerColor = theme.bgDeep.copy(alpha = 0.2f),
                                    focusedTextColor = theme.textPrimary,
                                    unfocusedTextColor = theme.textPrimary
                                )
                            )
                            Spacer(Modifier.height(12.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                androidx.compose.material3.Switch(
                                    checked = isConfirmed,
                                    onCheckedChange = { isConfirmed = it },
                                    colors = androidx.compose.material3.SwitchDefaults.colors(
                                        checkedThumbColor = Color.White,
                                        checkedTrackColor = NeonGreen,
                                        uncheckedThumbColor = theme.textSecondary,
                                        uncheckedTrackColor = theme.bgDeep.copy(alpha = 0.5f)
                                    )
                                )
                                Spacer(Modifier.width(12.dp))
                                Text("I confirm this conviction stake", color = theme.textPrimary, fontSize = 12.sp)
                            }
                            Spacer(Modifier.height(12.dp))
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(if (isConfirmed && stakeAmount.isNotEmpty()) NeonGreen.copy(alpha = 0.8f) else theme.bgDeep)
                                    .clickable(enabled = isConfirmed && stakeAmount.isNotEmpty()) {
                                        stakeAmount = ""
                                        isConfirmed = false
                                        // Normally this would trigger vm.submitConviction()
                                    }
                                    .padding(vertical = 12.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    "SUBMIT CONVICTION",
                                    color = if (isConfirmed && stakeAmount.isNotEmpty()) Color.Black else theme.textSecondary,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                        }
                    }

                    Spacer(Modifier.height(16.dp))

                    // 4. Beautiful custom Volatility Line Chart (Recharts style)
                    RechartsVolatilityLineChart(
                        history = selectedMarket.historicalVolatility,
                        marketName = selectedMarket.name
                    )

                    Spacer(Modifier.height(20.dp))

                    // 5. AI Persona Rules Commentary Switcher (With gorgeous visuals & avatar frames)
                    Text(
                        "ADOPT PERS' SYSTEM RULES & COMMENTARY ENGINE",
                        color = theme.textPrimary,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = com.example.ui.theme.ArialNarrowFamily
                    )
                    Spacer(Modifier.height(8.dp))

                    LazyRow(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(MADGambitPersona.personas) { pers ->
                            val isSelected = pers.name.lowercase() == selectedPersona.name.lowercase()
                            Row(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(20.dp))
                                    .background(
                                        if (isSelected) theme.brandPrimary.copy(alpha = 0.25f)
                                        else theme.bgDeep.copy(alpha = 0.4f)
                                    )
                                    .border(
                                        1.dp,
                                        if (isSelected) theme.brandPrimary else theme.textSecondary.copy(alpha = 0.15f),
                                        RoundedCornerShape(20.dp)
                                    )
                                    .clickable { selectedPersona = pers }
                                    .padding(horizontal = 10.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                // Dynamic Custom Visual Avatar Frame
                                PersonaAvatar(
                                    name = pers.name,
                                    emoji = pers.emoji,
                                    sizeDp = 28,
                                    isSelected = isSelected
                                )
                                Text(
                                    text = pers.name,
                                    color = if (isSelected) theme.textPrimary else theme.textSecondary,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }

                    Spacer(Modifier.height(12.dp))

                    // Persona Description Block
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(theme.bgDeep.copy(alpha = 0.15f), RoundedCornerShape(10.dp))
                            .border(theme.borderWidth, theme.textSecondary.copy(alpha = 0.1f), RoundedCornerShape(10.dp))
                            .padding(12.dp)
                    ) {
                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                PersonaAvatar(
                                    name = selectedPersona.name,
                                    emoji = selectedPersona.emoji,
                                    sizeDp = 24,
                                    isSelected = true
                                )
                                Spacer(Modifier.width(8.dp))
                                Text(
                                    text = selectedPersona.subtitle.uppercase(),
                                    color = theme.brandSecondary,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                            Spacer(Modifier.height(4.dp))
                            Text(
                                text = selectedPersona.description,
                                color = theme.textSecondary,
                                fontSize = 11.sp
                            )
                        }
                    }

                    Spacer(Modifier.height(14.dp))

                    // Adopt & Summon commentary Button
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(
                                if (isCommentaryLoading) theme.brandSecondary.copy(alpha = 0.3f)
                                else theme.brandSecondary
                            )
                            .clickable(enabled = !isCommentaryLoading) {
                                scope.launch {
                                    isCommentaryLoading = true
                                    commentaryText = "Synthesizing dynamic multi-agent output from ${selectedPersona.name}..."
                                    
                                    val repo = GeminiRepository()
                                    commentaryText = repo.generateCommentaryWithPersona(
                                        personaName = selectedPersona.name,
                                        marketName = selectedMarket.name,
                                        conviction = selectedMarket.convictionPercent.toString(),
                                        volatility = selectedMarket.volatilityIndex.toString()
                                    )
                                    isCommentaryLoading = false
                                    // Speak out in Jersey husky accent
                                    com.example.engine.MadhatrVoice.speak(commentaryText)
                                }
                            }
                            .padding(14.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.Center) {
                            if (isCommentaryLoading) {
                                CircularProgressIndicator(color = theme.textPrimary, modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                                Spacer(Modifier.width(8.dp))
                            } else {
                                Icon(Icons.Filled.AutoAwesome, contentDescription = "AI", tint = theme.textPrimary, modifier = Modifier.size(16.dp))
                                Spacer(Modifier.width(6.dp))
                            }
                            Text(
                                "ADOPT SYSTEM RULES & SUMMON AI COMMENTS",
                                color = theme.textPrimary,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Black,
                                fontFamily = com.example.ui.theme.ArialNarrowFamily
                            )
                        }
                    }

                    Spacer(Modifier.height(16.dp))

                    // Commentary Display
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(theme.bgCard.copy(alpha = 0.15f), RoundedCornerShape(12.dp))
                            .border(theme.borderWidth, theme.borderBrush, RoundedCornerShape(12.dp))
                            .padding(16.dp)
                    ) {
                        Column {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    "${selectedPersona.name} COMMENTS:",
                                    color = theme.brandSecondary,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = FontFamily.Monospace
                                )
                                Icon(Icons.Filled.GraphicEq, contentDescription = "Voice Active", tint = theme.brandAccent, modifier = Modifier.size(14.dp))
                            }
                            Spacer(Modifier.height(8.dp))
                            Text(
                                text = commentaryText,
                                color = theme.textPrimary,
                                fontSize = 13.sp,
                                fontStyle = androidx.compose.ui.text.font.FontStyle.Italic,
                                lineHeight = 18.sp
                            )
                        }
                    }

                    Spacer(Modifier.height(20.dp))
                    
                    RecentEntriesListWidget(vm)
                }
            }
        }
    }

    if (showExportDialog) {
        val clipboardManager = androidx.compose.ui.platform.LocalClipboardManager.current
        val context = androidx.compose.ui.platform.LocalContext.current
        androidx.compose.material3.AlertDialog(
            onDismissRequest = { showExportDialog = false },
            containerColor = theme.bgCard,
            modifier = Modifier.border(1.dp, theme.brandSecondary, RoundedCornerShape(16.dp)),
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("🎩", fontSize = 20.sp)
                    Spacer(Modifier.width(8.dp))
                    Text(
                        "EXPORTED SHIFT INDEX DATA",
                        color = theme.brandSecondary,
                        fontWeight = FontWeight.Black,
                        fontFamily = com.example.ui.theme.ArialNarrowFamily,
                        fontSize = 16.sp
                    )
                }
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = "The MADHAT'r says: \"Here's your neural intelligence payload, speedy! Copy this JSON structure directly into your spreadsheet scripts, or save the cached file 'gambit_analytics.json' for offline risk modeling!\"",
                        color = theme.textSecondary,
                        fontSize = 11.sp
                    )
                    
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(max = 180.dp)
                            .background(theme.bgDeep, RoundedCornerShape(8.dp))
                            .border(1.dp, theme.textSecondary.copy(alpha = 0.2f), RoundedCornerShape(8.dp))
                            .padding(8.dp)
                    ) {
                        val verticalScroll = rememberScrollState()
                        Text(
                            text = exportedJsonText,
                            color = NeonCyan,
                            fontSize = 10.sp,
                            fontFamily = FontFamily.Monospace,
                            modifier = Modifier
                                .fillMaxWidth()
                                .verticalScroll(verticalScroll)
                        )
                    }
                    
                    Text(
                        text = "Cached under: cache/gambit_analytics.json",
                        color = theme.brandAccent,
                        fontSize = 9.sp,
                        fontFamily = FontFamily.Monospace
                    )
                }
            },
            confirmButton = {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    androidx.compose.material3.TextButton(
                        onClick = {
                            val annotatedString = androidx.compose.ui.text.AnnotatedString(exportedJsonText)
                            clipboardManager.setText(annotatedString)
                            vm.triggerVolatilityToast("USER ACTION", 50.0, "Copied payload to clipboard!", true)
                        }
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Filled.ContentCopy, contentDescription = "Copy text payload", modifier = Modifier.size(12.dp), tint = theme.brandSecondary)
                            Spacer(Modifier.width(4.dp))
                            Text("COPY PAYLOAD", color = theme.brandSecondary, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                        }
                    }
                    androidx.compose.material3.TextButton(onClick = { showExportDialog = false }) {
                        Text("DISMISS", color = theme.textPrimary, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                    }
                }
            }
        )
    }
}

@Composable
fun RechartsVolatilityLineChart(
    history: List<Float>,
    marketName: String,
    modifier: Modifier = Modifier
) {
    val theme = LocalGambitTheme.current
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(200.dp)
            .background(theme.bgCard.copy(alpha = 0.15f), RoundedCornerShape(12.dp))
            .border(theme.borderWidth, theme.borderBrush, RoundedCornerShape(12.dp))
            .padding(16.dp)
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "GAMBIT VOLATILITY HISTORY (RECHARTS STYLE)",
                    color = theme.textPrimary,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = com.example.ui.theme.ArialNarrowFamily
                )
                Text(
                    "SCALE: 0-100",
                    color = theme.brandSecondary,
                    fontSize = 10.sp,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold
                )
            }
            Spacer(Modifier.height(8.dp))

            if (history.isEmpty()) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("NO HISTORY DATA", color = theme.textSecondary, fontSize = 12.sp)
                }
            } else {
                Canvas(modifier = Modifier.fillMaxSize().weight(1f)) {
                    val padding = 12f
                    val width = size.width - padding * 2
                    val height = size.height - padding * 2

                    val maxVal = 100f
                    val minVal = 0f
                    val range = maxVal - minVal

                    val gridLines = 4
                    for (i in 0..gridLines) {
                        val progress = i / gridLines.toFloat()
                        val y = padding + height * progress
                        drawLine(
                            color = theme.textSecondary.copy(alpha = 0.15f),
                            start = Offset(padding, y),
                            end = Offset(size.width - padding, y),
                            strokeWidth = 1f,
                            pathEffect = PathEffect.dashPathEffect(floatArrayOf(10f, 10f))
                        )
                    }

                    val pointsCount = history.size
                    val stepX = if (pointsCount > 1) width / (pointsCount - 1) else width

                    val linePath = Path()
                    val areaPath = Path()

                    history.forEachIndexed { index, value ->
                        val x = padding + index * stepX
                        val yProgress = (value - minVal) / range
                        val y = padding + height * (1f - yProgress)

                        if (index == 0) {
                            linePath.moveTo(x, y)
                            areaPath.moveTo(x, size.height - padding)
                            areaPath.lineTo(x, y)
                        } else {
                            val prevX = padding + (index - 1) * stepX
                            val prevYProgress = (history[index - 1] - minVal) / range
                            val prevY = padding + height * (1f - prevYProgress)

                            val controlX = (prevX + x) / 2f
                            linePath.quadraticTo(controlX, prevY, controlX, y)
                            linePath.lineTo(x, y)

                            areaPath.quadraticTo(controlX, prevY, controlX, y)
                            areaPath.lineTo(x, y)
                        }

                        if (index == pointsCount - 1) {
                            areaPath.lineTo(x, size.height - padding)
                            areaPath.close()
                        }
                    }

                    drawPath(
                        path = areaPath,
                        brush = Brush.verticalGradient(
                            colors = listOf(
                                theme.brandAccent.copy(alpha = 0.25f),
                                theme.brandAccent.copy(alpha = 0.0f)
                            )
                        )
                    )

                    drawPath(
                        path = linePath,
                        color = theme.brandAccent,
                        style = Stroke(
                            width = 4f,
                            cap = StrokeCap.Round,
                            join = androidx.compose.ui.graphics.StrokeJoin.Round
                        )
                    )

                    history.forEachIndexed { index, value ->
                        val x = padding + index * stepX
                        val yProgress = (value - minVal) / range
                        val y = padding + height * (1f - yProgress)

                        drawCircle(
                            color = theme.brandAccent.copy(alpha = 0.3f),
                            radius = 6f,
                            center = Offset(x, y)
                        )
                        drawCircle(
                            color = theme.brandAccent,
                            radius = 4f,
                            center = Offset(x, y)
                        )
                        drawCircle(
                            color = theme.bgDeep,
                            radius = 2f,
                            center = Offset(x, y)
                        )
                    }
                }
            }
        }
    }
}
