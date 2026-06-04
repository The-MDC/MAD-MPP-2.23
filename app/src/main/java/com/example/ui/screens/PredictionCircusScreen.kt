package com.example.ui.screens
import com.example.ui.components.HoverTooltip
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.math.GambitMath
import com.example.ui.components.NeonSlider
import com.example.ui.theme.*
import com.example.viewmodel.GambitViewModel

import com.example.ui.components.SeikoClockWidget
import com.example.ui.components.TopHottestCarousel
import com.example.ui.components.CustomizableMetricsCarousel

@Composable
fun PredictionCircusScreen(vm: GambitViewModel) {
    val state by vm.state.collectAsState()
    val scroll = rememberScrollState()

    Column(
        Modifier
            .fillMaxSize()
            .background(BgDeep)
            .verticalScroll(scroll)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        SeikoClockWidget()
        
        TopHottestCarousel(state.activeScenarios)
        
        CustomizableMetricsCarousel()

        Box(Modifier.padding(horizontal = 4.dp)) {
            Column {
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
                Text(
                    "WE TURN SOCIAL OUTRAGE INTO A PLAYABLE ASSET CLASS.", 
                    color = NeonPink, 
                    fontSize = 14.sp,
                    fontFamily = com.example.ui.theme.ArialNarrowFamily,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
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

        state.activeScenarios.forEachIndexed { idx, sc ->
            val alloc = state.allocations.getOrNull(idx) ?: 0.0
            val delta = GambitMath.calculateDeltaLimit(100.0, sc.baseMultiplier)
            
            Box(
                Modifier
                    .fillMaxWidth()
                    .shadow(elevation = 16.dp, RoundedCornerShape(20.dp), spotColor = NeonCyan.copy(alpha = 0.15f))
                    .background(BgCard.copy(alpha = 0.4f), RoundedCornerShape(20.dp))
                    .border(1.dp, GoldFlakeBrush, RoundedCornerShape(20.dp))
                    .padding(24.dp)
            ) {
                Column {
                    Row(Modifier.fillMaxWidth(), Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text(
                                "CONVICTION MARKET", 
                                color = BrandGold, 
                                fontSize = 9.5.sp, 
                                fontFamily = com.example.ui.theme.ArialNarrowFamily,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 2.sp
                            )
                            Spacer(Modifier.height(4.dp))
                            Text(
                                sc.tag.uppercase(), 
                                color = NeonCyan, 
                                fontSize = 11.sp, 
                                fontFamily = com.example.ui.theme.ArialNarrowFamily,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.sp
                            )
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
                    
                    when (sc.marketType) {
                        com.example.model.MarketType.OVER_UNDER -> {
                            val target = sc.targetValue ?: 0.0
                            val current = sc.currentMetricValue ?: 0.0
                            Text("Current: ${current} | Target: ${target}", color = Color.LightGray, fontSize = 12.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                            Spacer(Modifier.height(12.dp))
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                HoverTooltip(text = "Place a bet that the metric will finish OVER the target.", modifier = Modifier.weight(1f)) {
                                    OutlinedButton(
                                        onClick = { vm.stakeOnScenario(10.0, sc.baseMultiplier) }, 
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = RoundedCornerShape(8.dp),
                                        colors = ButtonDefaults.outlinedButtonColors(contentColor = NeonCyan)
                                    ) { Text("STAKE OVER", fontSize = 12.sp, fontWeight = FontWeight.Bold) }
                                }
                                HoverTooltip(text = "Place a bet that the metric will finish UNDER the target.", modifier = Modifier.weight(1f)) {
                                    OutlinedButton(
                                        onClick = { vm.stakeOnScenario(10.0, sc.baseMultiplier) }, 
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = RoundedCornerShape(8.dp),
                                        colors = ButtonDefaults.outlinedButtonColors(contentColor = NeonMagenta)
                                    ) { Text("STAKE UNDER", fontSize = 12.sp, fontWeight = FontWeight.Bold) }
                                }
                            }
                        }
                        com.example.model.MarketType.PROGRESSIVE -> {
                            val target = sc.targetValue ?: 100.0
                            val current = sc.currentMetricValue ?: 0.0
                            Text("Progressive Metric Tracking: ${current} / $target", color = Color.LightGray, fontSize = 12.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                            Spacer(Modifier.height(8.dp))
                            val progressValue = if (target > 0.0) (current / target).toFloat().coerceIn(0f, 1f) else 0f
                            LinearProgressIndicator(
                                progress = { progressValue },
                                modifier = Modifier.fillMaxWidth().height(8.dp),
                                color = NeonGreen,
                                trackColor = BgDeep
                            )
                            Spacer(Modifier.height(12.dp))
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                HoverTooltip(text = "Place wager that this milestone timeline will be achieved.", modifier = Modifier.weight(1f)) {
                                    Button(
                                        onClick = { vm.stakeOnScenario(25.0, sc.baseMultiplier) }, 
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = RoundedCornerShape(8.dp),
                                        colors = ButtonDefaults.buttonColors(containerColor = BrandGoldGlow, contentColor = BrandGold)
                                    ) { Text("BET TARGET MET", fontSize = 12.sp, fontWeight = FontWeight.Bold) }
                                }
                            }
                        }
                        com.example.model.MarketType.MULTI_OUTCOME -> {
                            Text("Which asset hits ATH first?", color = Color.LightGray, fontSize = 12.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                            Spacer(Modifier.height(12.dp))
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                HoverTooltip(text = "Predict BTC", modifier = Modifier.weight(1f)) {
                                    OutlinedButton(onClick = { vm.stakeOnScenario(10.0, sc.baseMultiplier) }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(8.dp),
                                        colors = ButtonDefaults.outlinedButtonColors(contentColor = NeonCyan)) { Text("BTC", fontSize = 12.sp) }
                                }
                                HoverTooltip(text = "Predict ETH", modifier = Modifier.weight(1f)) {
                                    OutlinedButton(onClick = { vm.stakeOnScenario(10.0, sc.baseMultiplier) }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(8.dp),
                                        colors = ButtonDefaults.outlinedButtonColors(contentColor = NeonCyan)) { Text("ETH", fontSize = 12.sp) }
                                }
                                HoverTooltip(text = "Predict SOL", modifier = Modifier.weight(1f)) {
                                    OutlinedButton(onClick = { vm.stakeOnScenario(10.0, sc.baseMultiplier) }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(8.dp),
                                        colors = ButtonDefaults.outlinedButtonColors(contentColor = NeonMagenta)) { Text("SOL", fontSize = 12.sp) }
                                }
                            }
                        }
                        else -> {
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                HoverTooltip(text = "Take YES position", modifier = Modifier.weight(1f)) {
                                    Button(
                                        onClick = { vm.stakeOnScenario(10.0, sc.baseMultiplier) }, 
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = RoundedCornerShape(8.dp),
                                        colors = ButtonDefaults.buttonColors(containerColor = NeonCyanDim, contentColor = NeonCyan)
                                    ) { Text("STAKE YES (10)", fontSize = 12.sp, fontWeight = FontWeight.Bold) }
                                }
                                HoverTooltip(text = "Take NO position", modifier = Modifier.weight(1f)) {
                                    Button(
                                        onClick = { vm.stakeOnScenario(50.0, sc.baseMultiplier) }, 
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = RoundedCornerShape(8.dp),
                                        colors = ButtonDefaults.buttonColors(containerColor = NeonPurpleDim, contentColor = NeonPurple)
                                    ) { Text("STAKE NO (50)", fontSize = 12.sp, fontWeight = FontWeight.Bold) }
                                }
                            }
                        }
                    }
                    
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

