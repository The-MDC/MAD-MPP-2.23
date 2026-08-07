package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.material3.ButtonDefaults
import com.example.viewmodel.GambitViewModel
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.*
import com.example.model.Scenario
import com.example.math.GambitMath
import com.example.ui.components.glassContainerBackground
import kotlin.math.roundToInt

import androidx.compose.foundation.Canvas
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.animation.core.*

@Composable
fun GaugeChart(conviction: Float, prediction: Float, modifier: Modifier = Modifier) {
    Canvas(modifier = modifier) {
        val strokeWidth = 8.dp.toPx()
        val radius = size.minDimension / 2 - strokeWidth
        val center = androidx.compose.ui.geometry.Offset(size.width / 2, size.height / 2)
        
        // Background arc
        drawArc(
            color = Color.DarkGray.copy(alpha = 0.5f),
            startAngle = 135f,
            sweepAngle = 270f,
            useCenter = false,
            style = androidx.compose.ui.graphics.drawscope.Stroke(width = strokeWidth, cap = androidx.compose.ui.graphics.StrokeCap.Round),
            topLeft = androidx.compose.ui.geometry.Offset(center.x - radius, center.y - radius),
            size = androidx.compose.ui.geometry.Size(radius * 2, radius * 2)
        )
        
        // Conviction Arc (Left side, Pink)
        drawArc(
            color = NeonMagenta,
            startAngle = 135f,
            sweepAngle = 135f * conviction,
            useCenter = false,
            style = androidx.compose.ui.graphics.drawscope.Stroke(width = strokeWidth, cap = androidx.compose.ui.graphics.StrokeCap.Round),
            topLeft = androidx.compose.ui.geometry.Offset(center.x - radius, center.y - radius),
            size = androidx.compose.ui.geometry.Size(radius * 2, radius * 2)
        )
        
        // Prediction Arc (Right side, Cyan)
        drawArc(
            color = NeonCyan,
            startAngle = 405f - (135f * prediction),
            sweepAngle = 135f * prediction,
            useCenter = false,
            style = androidx.compose.ui.graphics.drawscope.Stroke(width = strokeWidth, cap = androidx.compose.ui.graphics.StrokeCap.Round),
            topLeft = androidx.compose.ui.geometry.Offset(center.x - radius, center.y - radius),
            size = androidx.compose.ui.geometry.Size(radius * 2, radius * 2)
        )
    }
}

@Composable
fun SparklineChart(data: List<Float>, color: Color, pulseAlpha: Float = 1f, modifier: Modifier = Modifier) {
    Canvas(modifier = modifier.graphicsLayer(alpha = pulseAlpha)) {
        if (data.isEmpty()) return@Canvas
        val min = data.minOrNull() ?: 0f
        val max = data.maxOrNull() ?: 1f
        val range = (max - min).coerceAtLeast(0.01f)
        
        val width = size.width
        val height = size.height
        val stepX = width / (data.size - 1).coerceAtLeast(1)
        
        val path = androidx.compose.ui.graphics.Path()
        data.forEachIndexed { index, value ->
            val x = index * stepX
            val y = height - ((value - min) / range * height)
            if (index == 0) path.moveTo(x, y)
            else path.lineTo(x, y)
        }
        
        drawPath(
            path = path,
            color = color,
            style = androidx.compose.ui.graphics.drawscope.Stroke(width = 2.dp.toPx())
        )
    }
}

fun Modifier.carousel3DEffect(
    index: Int,
    listState: androidx.compose.foundation.lazy.LazyListState
): Modifier = this.graphicsLayer {
    val layoutInfo = listState.layoutInfo
    val viewportWidth = layoutInfo.viewportEndOffset - layoutInfo.viewportStartOffset
    if (viewportWidth > 0) {
        val matchedItem = layoutInfo.visibleItemsInfo.find { it.index == index }
        if (matchedItem != null) {
            val itemCenter = matchedItem.offset + (matchedItem.size / 2f)
            val viewportCenter = viewportWidth / 2f
            val distanceFromCenter = itemCenter - viewportCenter
            val fraction = (distanceFromCenter / viewportCenter).coerceIn(-1.2f, 1.2f)
            
            rotationY = -22f * fraction
            val scale = 1f - (0.08f * kotlin.math.abs(fraction))
            scaleX = scale
            scaleY = scale
            shadowElevation = (16f * (1f - kotlin.math.abs(fraction))).coerceAtLeast(0f)
            cameraDistance = 10f * density
        }
    }
}

@Composable
fun TopHottestCarousel(scenarios: List<Scenario>) {
    val hotsLazyListState = androidx.compose.foundation.lazy.rememberLazyListState()
    Column(Modifier.fillMaxWidth()) {
        Text(
            text = "☠️ TOP 5 HOTTEST MARKETS",
            color = NeonMagenta,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = com.example.ui.theme.ArialNarrowFamily,
            modifier = Modifier.padding(bottom = 12.dp)
        )
             val infiniteTransition = rememberInfiniteTransition()
        val pulseAlpha by infiniteTransition.animateFloat(
            initialValue = 0.5f,
            targetValue = 1.0f,
            animationSpec = infiniteRepeatable(
                animation = tween(1500, easing = LinearEasing),
                repeatMode = RepeatMode.Reverse
            )
        )

        LazyRow(
            state = hotsLazyListState,
            horizontalArrangement = Arrangement.spacedBy(20.dp),
            contentPadding = PaddingValues(horizontal = 4.dp)
        ) {
            itemsIndexed(scenarios.filter { it.isHot }.take(5)) { index, sys ->
                    val trendData = remember(sys.id) { List(24) { java.util.Random().nextFloat() * 100f } }
                    val convictionValue = remember(sys.id) { 0.4f + java.util.Random().nextFloat() * 0.5f }
                    val predictionValue = remember(sys.id) { 0.3f + java.util.Random().nextFloat() * 0.6f }
                    HoverTooltip(text = "Explore the ${sys.tag} meme stream and see live yield multipliers.") {
                        Box(
                            modifier = Modifier
                                .width(280.dp)
                                .carousel3DEffect(index, hotsLazyListState)
                                .shadow(24.dp, RoundedCornerShape(16.dp), spotColor = NeonCyan.copy(alpha = 0.2f))
                                .glassContainerBackground(NeonMagenta, RoundedCornerShape(16.dp))
                                .padding(16.dp)
                        ) {
                            Column {
                                Row(Modifier.fillMaxWidth(), Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                    Text(sys.tag.uppercase(), color = NeonCyan, fontSize = 11.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                                    Text("HOT", color = NeonMagenta, fontSize = 11.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp)
                                }
                                Spacer(Modifier.height(16.dp))
                                Text(sys.name, color = BrandEggwhite, fontSize = 18.sp, fontWeight = FontWeight.Black, maxLines = 1, style = androidx.compose.ui.text.TextStyle(shadow = androidx.compose.ui.graphics.Shadow(Color.Black, blurRadius = 4f)))
                                Spacer(Modifier.height(16.dp))
                                
                                Row(Modifier.fillMaxWidth(), Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                    Column(Modifier.weight(1f)) {
                                        Text("24h Sentiment", color = Color.Gray, fontSize = 10.sp)
                                        Spacer(Modifier.height(4.dp))
                                        SparklineChart(
                                            data = trendData,
                                            color = NeonCyan,
                                            pulseAlpha = pulseAlpha,
                                            modifier = Modifier.fillMaxWidth().height(30.dp)
                                        )
                                    }
                                    Spacer(Modifier.width(16.dp))
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text("CV vs PR", color = Color.Gray, fontSize = 10.sp)
                                        Spacer(Modifier.height(4.dp))
                                        GaugeChart(
                                            conviction = convictionValue,
                                            prediction = predictionValue,
                                            modifier = Modifier.size(30.dp)
                                        )
                                    }
                                }
                                
                                Spacer(Modifier.height(16.dp))
                                Row(Modifier.fillMaxWidth(), Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                    Text("Yield Rate:", color = Color.LightGray, fontSize = 12.sp)
                                    Text("${sys.baseMultiplier}x", color = NeonGreen, fontSize = 18.sp, fontWeight = FontWeight.Black)
                                }
                            }
                        }
                    }
            }
        }
    }
}

data class KpiMetric(val id: Int, val label: String, val value: String, val color: Color)

@Composable
fun CustomizableMetricsCarousel() {
    val theme = LocalGambitTheme.current
    val metricsLazyListState = androidx.compose.foundation.lazy.rememberLazyListState()
    var metrics by remember { mutableStateOf(listOf(
        KpiMetric(1, "EIGENTRUST", "99.8%", NeonGreen),
        KpiMetric(2, "MADx VOLUME", "$124K", NeonCyan),
        KpiMetric(3, "SYBIL ATTEMPTS", "4,201", BrandCrimson),
        KpiMetric(4, "AVG WIN RATE", "42%", NeonPurple),
        KpiMetric(5, "PVP LIQUIDITY", "8.5M", NeonMagenta),
        KpiMetric(6, "GLOBAL RANK", "#84", BrandGold),
        KpiMetric(7, "CARD W/L RATIO", "58.2%", BrandEggwhite),
        KpiMetric(8, "BLUFF SUCCESS", "71%", NeonMagenta),
        KpiMetric(9, "TOP MARKET", "NASDAQ", NeonCyan),
        KpiMetric(10, "USER RATING", "A+", NeonGreen),
        KpiMetric(11, "DECKS DRAWN", "1,048", NeonPurple),
        KpiMetric(12, "POOL RANKING", "#12", BrandGold)
    )) }

    var showInfoPopup by remember { mutableStateOf<KpiMetric?>(null) }

    Column(Modifier.fillMaxWidth().padding(top = 16.dp)) {
        Row(Modifier.fillMaxWidth(), Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = "⚙️ NEURAL TELEMETRY",
                color = NeonCyan,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = com.example.ui.theme.ArialNarrowFamily,
                modifier = Modifier.padding(bottom = 12.dp)
            )
        }
        
        LazyRow(
            state = metricsLazyListState,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = PaddingValues(end = 1.dp)
        ) {
            itemsIndexed(metrics, key = { _, metric -> metric.id }) { index, metric ->
                HoverTooltip(text = "Observe live ${metric.label} stream. Click for details.") {
                    Box(
                        modifier = Modifier
                            .width(160.dp)
                            .height(110.dp)
                            .carousel3DEffect(index, metricsLazyListState)
                            .shadow(12.dp, RoundedCornerShape(16.dp), spotColor = metric.color.copy(alpha = 0.4f))
                            .glassContainerBackground(metric.color, RoundedCornerShape(16.dp))
                            .border(1.dp, metric.color.copy(alpha = 0.5f), RoundedCornerShape(16.dp))
                            .clickable { showInfoPopup = metric }
                            .padding(16.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                            Text(metric.label, color = Color.Gray, fontSize = 10.5.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontWeight = FontWeight.Bold)
                            Spacer(Modifier.height(8.dp))
                            Text(
                                text = metric.value,
                                color = metric.color,
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Black,
                                style = androidx.compose.ui.text.TextStyle(
                                    shadow = androidx.compose.ui.graphics.Shadow(metric.color, blurRadius = 12f)
                                )
                            )
                        }
                    }
                }
            }
        }
    }

    if (showInfoPopup != null) {
        androidx.compose.material3.AlertDialog(
            onDismissRequest = { showInfoPopup = null },
            confirmButton = {
                androidx.compose.material3.TextButton(onClick = { showInfoPopup = null }) {
                    Text("Close", color = theme.brandPrimary)
                }
            },
            containerColor = theme.bgCard,
            titleContentColor = theme.brandSecondary,
            title = { Text("Neural Telemetry Report") },
            text = { Text("Metric: ${showInfoPopup?.label}\nCurrent Value: ${showInfoPopup?.value}\n\nDetailed tracking and neural pathway analysis is currently running optimally for this telemetry node.", color = theme.textPrimary) }
        )
    }
}

@Composable
fun TopPredictionMarketsCarousel(
    scenarios: List<Scenario>,
    authState: com.example.model.AuthState,
    vm: GambitViewModel,
    modifier: Modifier = Modifier
) {
    val listState = androidx.compose.foundation.lazy.rememberLazyListState()
    val isEligible = authState.isAuthenticated && 
                     authState.email.isNotBlank() && 
                     authState.email != "none@domain.com" && 
                     authState.walletAddress != null && 
                     authState.username.isNotBlank() && 
                     authState.username != "Guest"

    var showLockDialog by remember { mutableStateOf(false) }

    Column(modifier = modifier.fillMaxWidth()) {
        Text(
            text = "🔮 QUICK PREDICTION CAROUSEL (TOP 20 MARKETS)",
            color = NeonCyan,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = com.example.ui.theme.ArialNarrowFamily,
            modifier = Modifier.padding(bottom = 12.dp, start = 4.dp)
        )

        LazyRow(
            state = listState,
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(horizontal = 4.dp)
        ) {
            itemsIndexed(scenarios.take(20)) { index, item ->
                Box(
                    modifier = Modifier
                        .width(260.dp)
                        .carousel3DEffect(index, listState)
                        .shadow(16.dp, RoundedCornerShape(14.dp), spotColor = NeonCyan.copy(alpha = 0.25f))
                        .glassContainerBackground(NeonCyan, RoundedCornerShape(14.dp))
                        .padding(14.dp)
                ) {
                    Column {
                        Row(Modifier.fillMaxWidth(), Arrangement.SpaceBetween, Alignment.CenterVertically) {
                            Text(item.tag.uppercase(), color = NeonCyan, fontSize = 9.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                            Text("PRED #${index + 1}", color = BrandGold, fontSize = 9.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                        }
                        Spacer(Modifier.height(8.dp))
                        Text(item.name, color = BrandEggwhite, fontSize = 14.sp, fontWeight = FontWeight.Black, maxLines = 2)
                        Spacer(Modifier.height(12.dp))

                        if (isEligible) {
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .background(NeonGreen.copy(alpha = 0.15f), RoundedCornerShape(8.dp))
                                        .border(1.2.dp, NeonGreen, RoundedCornerShape(8.dp))
                                        .clickable {
                                            vm.placeUserBet(item.id, "YES", 100.0, false, 0f)
                                            vm.playFeedbackTone(android.media.ToneGenerator.TONE_CDMA_CONFIRM, 120)
                                        }
                                        .padding(vertical = 8.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text("YES", color = NeonGreen, fontSize = 11.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                                }
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .background(NeonPink.copy(alpha = 0.15f), RoundedCornerShape(8.dp))
                                        .border(1.2.dp, NeonPink, RoundedCornerShape(8.dp))
                                        .clickable {
                                            vm.placeUserBet(item.id, "NO", 100.0, false, 0f)
                                            vm.playFeedbackTone(android.media.ToneGenerator.TONE_CDMA_CONFIRM, 120)
                                        }
                                        .padding(vertical = 8.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text("NO", color = NeonPink, fontSize = 11.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                                }
                            }
                        } else {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(Color.Black.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                                    .border(1.dp, BrandGold.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                                    .clickable { showLockDialog = true }
                                    .padding(vertical = 8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text("🔒 LOCK: COMPLETE PROFILE", color = BrandGold, fontSize = 10.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (showLockDialog) {
        androidx.compose.material3.AlertDialog(
            onDismissRequest = { showLockDialog = false },
            confirmButton = {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    androidx.compose.material3.Button(
                        onClick = {
                            showLockDialog = false
                            vm.openWalletConnectDialog()
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = com.example.ui.theme.NeonCyan)
                    ) {
                        Text("Connect Web3", color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                    }
                    androidx.compose.material3.Button(
                        onClick = {
                            showLockDialog = false
                            vm.handleSignIn("GOOGLE")
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = BrandGold)
                    ) {
                        Text("Auto-Complete", color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                    }
                }
            },
            dismissButton = {
                androidx.compose.material3.TextButton(onClick = { showLockDialog = false }) {
                    Text("Cancel", color = Color.LightGray)
                }
            },
            containerColor = BgCard,
            titleContentColor = BrandGold,
            title = { Text("Quick Betting Feature Locked 🔒", fontFamily = FontFamily.Monospace, fontSize = 15.sp) },
            text = { Text("To place instant 100 MADx bets directly with a single tap, you must have an active signed-up email, a connected wallet, and a completed profile. Tap the button below to auto-complete this requirement instantly!", color = Color.White) }
        )
    }
}

@Composable
fun TopConvictionMarketsCarousel(
    scenarios: List<Scenario>,
    authState: com.example.model.AuthState,
    vm: GambitViewModel,
    modifier: Modifier = Modifier
) {
    val listState = androidx.compose.foundation.lazy.rememberLazyListState()
    val isEligible = authState.isAuthenticated && 
                     authState.email.isNotBlank() && 
                     authState.email != "none@domain.com" && 
                     authState.walletAddress != null && 
                     authState.username.isNotBlank() && 
                     authState.username != "Guest"

    var showLockDialog by remember { mutableStateOf(false) }

    Column(modifier = modifier.fillMaxWidth().padding(top = 16.dp)) {
        Text(
            text = "⚡ QUICK CONVICTION CAROUSEL (TOP 20 MARKETS)",
            color = NeonMagenta,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = com.example.ui.theme.ArialNarrowFamily,
            modifier = Modifier.padding(bottom = 12.dp, start = 4.dp)
        )

        LazyRow(
            state = listState,
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(horizontal = 4.dp)
        ) {
            itemsIndexed(scenarios.take(20)) { index, item ->
                Box(
                    modifier = Modifier
                        .width(260.dp)
                        .carousel3DEffect(index, listState)
                        .shadow(16.dp, RoundedCornerShape(14.dp), spotColor = NeonMagenta.copy(alpha = 0.25f))
                        .glassContainerBackground(NeonMagenta, RoundedCornerShape(14.dp))
                        .padding(14.dp)
                ) {
                    Column {
                        Row(Modifier.fillMaxWidth(), Arrangement.SpaceBetween, Alignment.CenterVertically) {
                            Text(item.category.uppercase(), color = NeonMagenta, fontSize = 9.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                            Text("CONV #${index + 1}", color = BrandGold, fontSize = 9.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                        }
                        Spacer(Modifier.height(8.dp))
                        Text(item.name, color = BrandEggwhite, fontSize = 14.sp, fontWeight = FontWeight.Black, maxLines = 2)
                        Spacer(Modifier.height(12.dp))

                        if (isEligible) {
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .background(NeonCyan.copy(alpha = 0.15f), RoundedCornerShape(8.dp))
                                        .border(1.2.dp, NeonCyan, RoundedCornerShape(8.dp))
                                        .clickable {
                                            vm.placeUserBet(item.id, "BULLISH", 200.0, true, 0.5f)
                                            vm.playFeedbackTone(android.media.ToneGenerator.TONE_PROP_ACK, 100)
                                        }
                                        .padding(vertical = 8.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text("BULL", color = NeonCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                                }
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .background(NeonPurple.copy(alpha = 0.15f), RoundedCornerShape(8.dp))
                                        .border(1.2.dp, NeonPurple, RoundedCornerShape(8.dp))
                                        .clickable {
                                            vm.placeUserBet(item.id, "BEARISH", 200.0, true, 0.5f)
                                            vm.playFeedbackTone(android.media.ToneGenerator.TONE_PROP_ACK, 100)
                                        }
                                        .padding(vertical = 8.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text("BEAR", color = NeonPurple, fontSize = 11.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                                }
                            }
                        } else {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(Color.Black.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                                    .border(1.dp, BrandGold.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                                    .clickable { showLockDialog = true }
                                    .padding(vertical = 8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text("🔒 LOCK: COMPLETE PROFILE", color = BrandGold, fontSize = 10.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (showLockDialog) {
        androidx.compose.material3.AlertDialog(
            onDismissRequest = { showLockDialog = false },
            confirmButton = {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    androidx.compose.material3.Button(
                        onClick = {
                            showLockDialog = false
                            vm.openWalletConnectDialog()
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = com.example.ui.theme.NeonCyan)
                    ) {
                        Text("Connect Web3", color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                    }
                    androidx.compose.material3.Button(
                        onClick = {
                            showLockDialog = false
                            vm.handleSignIn("GOOGLE")
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = BrandGold)
                    ) {
                        Text("Auto-Complete", color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                    }
                }
            },
            dismissButton = {
                androidx.compose.material3.TextButton(onClick = { showLockDialog = false }) {
                    Text("Cancel", color = Color.LightGray)
                }
            },
            containerColor = BgCard,
            titleContentColor = BrandGold,
            title = { Text("Quick Betting Feature Locked 🔒", fontFamily = FontFamily.Monospace, fontSize = 15.sp) },
            text = { Text("To place instant 100 MADx bets directly with a single tap, you must have an active signed-up email, a connected wallet, and a completed profile. Tap the button below to auto-complete this requirement instantly!", color = Color.White) }
        )
    }
}

@Composable
fun TopLiarDetectorMarketsCarousel(
    scenarios: List<Scenario>,
    authState: com.example.model.AuthState,
    vm: GambitViewModel,
    modifier: Modifier = Modifier
) {
    val listState = androidx.compose.foundation.lazy.rememberLazyListState()
    val isEligible = authState.isAuthenticated && 
                     authState.email.isNotBlank() && 
                     authState.email != "none@domain.com" && 
                     authState.walletAddress != null && 
                     authState.username.isNotBlank() && 
                     authState.username != "Guest"

    var showLockDialog by remember { mutableStateOf(false) }

    Column(modifier = modifier.fillMaxWidth().padding(top = 16.dp)) {
        Text(
            text = "🕵️‍♂️ QUICK LIAR-METER CAROUSEL (TOP 20 MARKETS)",
            color = NeonPink,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = com.example.ui.theme.ArialNarrowFamily,
            modifier = Modifier.padding(bottom = 12.dp, start = 4.dp)
        )

        LazyRow(
            state = listState,
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(horizontal = 4.dp)
        ) {
            itemsIndexed(scenarios.take(20)) { index, item ->
                Box(
                    modifier = Modifier
                        .width(260.dp)
                        .carousel3DEffect(index, listState)
                        .shadow(16.dp, RoundedCornerShape(14.dp), spotColor = NeonPink.copy(alpha = 0.25f))
                        .glassContainerBackground(NeonPink, RoundedCornerShape(14.dp))
                        .padding(14.dp)
                ) {
                    Column {
                        Row(Modifier.fillMaxWidth(), Arrangement.SpaceBetween, Alignment.CenterVertically) {
                            Text(item.tag.uppercase(), color = NeonPink, fontSize = 9.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                            Text("LIAR #${index + 1}", color = BrandGold, fontSize = 9.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                        }
                        Spacer(Modifier.height(8.dp))
                        Text(item.name, color = BrandEggwhite, fontSize = 14.sp, fontWeight = FontWeight.Black, maxLines = 2)
                        Spacer(Modifier.height(12.dp))

                        if (isEligible) {
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .background(NeonGreen.copy(alpha = 0.15f), RoundedCornerShape(8.dp))
                                        .border(1.2.dp, NeonGreen, RoundedCornerShape(8.dp))
                                        .clickable {
                                            vm.placeUserBet(item.id, "TRUTH", 150.0, false, 0f)
                                            vm.playFeedbackTone(android.media.ToneGenerator.TONE_CDMA_CONFIRM, 120)
                                        }
                                        .padding(vertical = 8.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text("TRUTH", color = NeonGreen, fontSize = 11.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                                }
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .background(BrandCrimson.copy(alpha = 0.15f), RoundedCornerShape(8.dp))
                                        .border(1.2.dp, BrandCrimson, RoundedCornerShape(8.dp))
                                        .clickable {
                                            vm.placeUserBet(item.id, "LIE", 150.0, false, 0f)
                                            vm.playFeedbackTone(android.media.ToneGenerator.TONE_CDMA_CONFIRM, 120)
                                        }
                                        .padding(vertical = 8.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text("LIE", color = BrandCrimson, fontSize = 11.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                                }
                            }
                        } else {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(Color.Black.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                                    .border(1.dp, BrandGold.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                                    .clickable { showLockDialog = true }
                                    .padding(vertical = 8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text("🔒 LOCK: COMPLETE PROFILE", color = BrandGold, fontSize = 10.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (showLockDialog) {
        androidx.compose.material3.AlertDialog(
            onDismissRequest = { showLockDialog = false },
            confirmButton = {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    androidx.compose.material3.Button(
                        onClick = {
                            showLockDialog = false
                            vm.openWalletConnectDialog()
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = com.example.ui.theme.NeonCyan)
                    ) {
                        Text("Connect Web3", color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                    }
                    androidx.compose.material3.Button(
                        onClick = {
                            showLockDialog = false
                            vm.handleSignIn("GOOGLE")
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = BrandGold)
                    ) {
                        Text("Auto-Complete", color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                    }
                }
            },
            dismissButton = {
                androidx.compose.material3.TextButton(onClick = { showLockDialog = false }) {
                    Text("Cancel", color = Color.LightGray)
                }
            },
            containerColor = BgCard,
            titleContentColor = BrandGold,
            title = { Text("Quick Betting Feature Locked 🔒", fontFamily = FontFamily.Monospace, fontSize = 15.sp) },
            text = { Text("To place instant 100 MADx bets directly with a single tap, you must have an active signed-up email, a connected wallet, and a completed profile. Tap the button below to auto-complete this requirement instantly!", color = Color.White) }
        )
    }
}

@Composable
fun DopamineCarousel(vm: GambitViewModel) {
    val state by vm.state.collectAsState()
    val theme = LocalGambitTheme.current
    val progress = state.dailyDegenProgress
    
    Column(Modifier.fillMaxWidth().padding(top = 16.dp)) {
        Row(Modifier.fillMaxWidth(), Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = "⚡ DOPAMINE OPTIMIZER FEED",
                color = BrandGold,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = com.example.ui.theme.ChakraPetchFamily,
                modifier = Modifier.padding(bottom = 12.dp)
            )
        }
        
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            contentPadding = PaddingValues(end = 1.dp)
        ) {
            // Card 1: Streak stats
            item {
                Box(
                    modifier = Modifier
                        .width(180.dp)
                        .height(115.dp)
                        .glassContainerBackground(
                            baseColor = theme.brandPrimary.copy(alpha = 0.4f),
                            shape = RoundedCornerShape(12.dp)
                        )
                        .border(1.dp, theme.brandPrimary, RoundedCornerShape(12.dp))
                        .padding(12.dp)
                ) {
                    Column(Modifier.fillMaxSize(), Arrangement.SpaceBetween) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("⚡", fontSize = 16.sp)
                            Spacer(Modifier.width(6.dp))
                            Text("ACTIVE STREAKS", color = theme.textSecondary, fontSize = 9.sp, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ChakraPetchFamily)
                        }
                        
                        Column {
                            Text("${progress.currentWeeklyStreak} DAYS WEEKLY", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Black, fontFamily = com.example.ui.theme.JetBrainsMonoFamily)
                            Text("${progress.currentMonthlyMonsterStreak} MONTHLY MONSTER", color = BrandGold, fontSize = 9.sp, fontWeight = FontWeight.SemiBold, fontFamily = com.example.ui.theme.JetBrainsMonoFamily)
                        }
                        
                        // Small streak completion bar
                        Row(Modifier.fillMaxWidth().height(4.dp).background(Color.DarkGray, RoundedCornerShape(2.dp))) {
                            Box(
                                modifier = Modifier
                                    .fillMaxHeight()
                                    .fillMaxWidth(((progress.currentWeeklyStreak.toFloat() / 7f).coerceIn(0f, 1f)))
                                    .background(BrandGold, RoundedCornerShape(2.dp))
                            )
                        }
                    }
                }
            }
            
            // Card 2: Chaos Meter
            item {
                Box(
                    modifier = Modifier
                        .width(180.dp)
                        .height(115.dp)
                        .glassContainerBackground(
                            baseColor = BrandPink.copy(alpha = 0.4f),
                            shape = RoundedCornerShape(12.dp)
                        )
                        .border(1.dp, BrandPink, RoundedCornerShape(12.dp))
                        .padding(12.dp)
                ) {
                    Column(Modifier.fillMaxSize(), Arrangement.SpaceBetween) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("🌀", fontSize = 16.sp)
                            Spacer(Modifier.width(6.dp))
                            Text("CHAOS METER", color = theme.textSecondary, fontSize = 9.sp, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ChakraPetchFamily)
                        }
                        
                        Column {
                            Text("${"%.1f".format(state.dailyBsLevel)}% BS INDEX", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Black, fontFamily = com.example.ui.theme.JetBrainsMonoFamily)
                            Text(
                                if (state.dailyBsLevel >= 80f) "🔥 EXTREMELY STABLE CHAOS" else "🌀 DIVERGENT FLUCTUATION",
                                color = BrandPink,
                                fontSize = 8.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = com.example.ui.theme.ChakraPetchFamily
                            )
                        }
                        
                        // Tiny pulsing progress bar
                        Row(Modifier.fillMaxWidth().height(4.dp).background(Color.DarkGray, RoundedCornerShape(2.dp))) {
                            Box(
                                modifier = Modifier
                                    .fillMaxHeight()
                                    .fillMaxWidth(state.dailyBsLevel / 100f)
                                    .background(BrandPink, RoundedCornerShape(2.dp))
                            )
                        }
                    }
                }
            }
            
            // Card 3: Top Gainer
            item {
                Box(
                    modifier = Modifier
                        .width(180.dp)
                        .height(115.dp)
                        .glassContainerBackground(
                            baseColor = NeonGreen.copy(alpha = 0.4f),
                            shape = RoundedCornerShape(12.dp)
                        )
                        .border(1.dp, NeonGreen, RoundedCornerShape(12.dp))
                        .padding(12.dp)
                ) {
                    Column(Modifier.fillMaxSize(), Arrangement.SpaceBetween) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("📈", fontSize = 16.sp)
                            Spacer(Modifier.width(6.dp))
                            Text("TOP GAINERS (24H)", color = theme.textSecondary, fontSize = 9.sp, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ChakraPetchFamily)
                        }
                        
                        Column {
                            Text("OUTLIERS_META", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Black, fontFamily = com.example.ui.theme.ChakraPetchFamily)
                            Text("+215.4% YIELD", color = NeonGreen, fontSize = 12.sp, fontWeight = FontWeight.Black, fontFamily = com.example.ui.theme.JetBrainsMonoFamily)
                        }
                        
                        // Sparkline chart
                        SparklineChart(
                            data = listOf(10f, 15f, 35f, 25f, 65f, 115f, 215.4f),
                            color = NeonGreen,
                            modifier = Modifier.fillMaxWidth().height(16.dp)
                        )
                    }
                }
            }
        }
    }
}
