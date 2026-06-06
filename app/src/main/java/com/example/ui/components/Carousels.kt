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

@Composable
fun TopHottestCarousel(scenarios: List<Scenario>) {
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
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(scenarios.filter { it.isHot }.take(5)) { sys ->
                    val trendData = remember(sys.id) { List(24) { java.util.Random().nextFloat() * 100f } }
                    val convictionValue = remember(sys.id) { 0.4f + java.util.Random().nextFloat() * 0.5f }
                    val predictionValue = remember(sys.id) { 0.3f + java.util.Random().nextFloat() * 0.6f }
                    HoverTooltip(text = "Explore the ${sys.tag} meme stream and see live yield multipliers.") {
                        Box(
                            modifier = Modifier
                                .width(280.dp)
                                .shadow(24.dp, RoundedCornerShape(16.dp), spotColor = NeonCyan.copy(alpha = 0.2f))
                                .glassContainerBackground(NeonMagenta, RoundedCornerShape(16.dp))
                                .border(1.dp, GoldFlakeBrush, RoundedCornerShape(16.dp))
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
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = PaddingValues(end = 1.dp)
        ) {
            items(metrics, key = { it.id }) { metric ->
                HoverTooltip(text = "Observe live ${metric.label} stream. Click for details.") {
                    Box(
                        modifier = Modifier
                            .width(160.dp)
                            .height(110.dp)
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
