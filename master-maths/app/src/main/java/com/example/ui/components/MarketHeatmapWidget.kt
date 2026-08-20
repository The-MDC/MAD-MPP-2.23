package com.example.ui.components

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.Scenario
import com.example.ui.theme.ArialNarrowFamily
import com.example.ui.theme.ArialFamily
import com.example.ui.theme.LocalGambitTheme
import kotlin.math.abs

import androidx.compose.ui.draw.scale

@Composable
fun MarketHeatmapWidget(
    activeScenarios: List<Scenario>,
    madxBalance: Double = 0.0,
    onWagerPlaced: (String, String, Double) -> Unit = { _, _, _ -> },
    modifier: Modifier = Modifier
) {
    val theme = LocalGambitTheme.current
    var selectedEvent by remember { mutableStateOf<Scenario?>(null) }
    
    // Interactive Legend filters for market nodes
    var filterSkeptical by remember { mutableStateOf(true) }
    var filterBalanced by remember { mutableStateOf(true) }
    var filterOptimal by remember { mutableStateOf(true) }
    
    // Interactive controller for particle stream layers
    var particleIntensity by remember { mutableStateOf(2.0f) } // 1.0=Low, 2.0=Med, 3.0=High, 4.0=Ultra

    // Apply filters dynamically to scenarios
    val filteredScenarios = remember(activeScenarios, filterSkeptical, filterBalanced, filterOptimal) {
        activeScenarios.filter { sc ->
            val ratio = sc.sentimentBullishRatio
            val isSkeptical = ratio < 0.44f
            val isBalanced = ratio in 0.44f..0.58f
            val isOptimal = ratio > 0.58f
            
            (isSkeptical && filterSkeptical) ||
            (isBalanced && filterBalanced) ||
            (isOptimal && filterOptimal)
        }
    }
    
    // Pulse animation for the volatility glow
    val infiniteTransition = rememberInfiniteTransition(label = "heatmapPulse")
    val pulseAlpha by infiniteTransition.animateFloat(
        initialValue = 0.4f,
        targetValue = 0.95f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse"
    )

    Box(
        modifier = modifier
            .fillMaxWidth()
            .glassContainerBackground(theme.brandPrimary.copy(alpha = 0.12f), RoundedCornerShape(20.dp))
            .border(1.dp, theme.brandPrimary.copy(alpha = 0.25f), RoundedCornerShape(20.dp))
            .padding(16.dp)
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "🌍 GLOBAL CONVICTION HEATMAP",
                        color = theme.textPrimary,
                        fontSize = 12.5.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = ArialNarrowFamily,
                        style = TextStyle(
                            shadow = Shadow(
                                color = theme.brandAccent.copy(alpha = 0.5f),
                                blurRadius = 6f
                            )
                        )
                    )
                    Text(
                        text = "Live public sentiment intensity mapped to community alignment grids",
                        color = theme.textSecondary,
                        fontSize = 9.5.sp,
                        fontFamily = ArialNarrowFamily
                    )
                }
                
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(theme.brandAccent.copy(alpha = 0.15f))
                        .border(1.dp, theme.brandAccent.copy(alpha = 0.5f), RoundedCornerShape(6.dp))
                        .padding(horizontal = 8.dp, vertical = 3.dp)
                ) {
                    Text(
                        text = "RECHARTS ENGINE",
                        color = theme.brandAccent,
                        fontSize = 8.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }

            // Real-time Sentiment Madness Gauge
            Spacer(Modifier.height(14.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(theme.bgCard.copy(alpha = 0.6f), RoundedCornerShape(8.dp))
                    .padding(8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "🌐 NETWORK MADNESS LEVEL:",
                    color = theme.textPrimary,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
                
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(12.dp)
                        .padding(horizontal = 12.dp)
                        .clip(RoundedCornerShape(6.dp))
                        .background(Color.DarkGray)
                ) {
                    val averageSentiment = if (activeScenarios.isNotEmpty()) activeScenarios.map { it.sentimentBullishRatio }.average().toFloat() else 0.5f
                    val gaugeColor = when {
                        averageSentiment >= 0.58f -> Color(0xFF00FF88)
                        averageSentiment < 0.44f -> Color(0xFFFF073A)
                        else -> Color(0xFFFFD700)
                    }
                    
                    Box(
                        modifier = Modifier
                            .fillMaxHeight()
                            .fillMaxWidth(averageSentiment)
                            .background(gaugeColor.copy(alpha = pulseAlpha))
                            .border(1.dp, gaugeColor, RoundedCornerShape(6.dp))
                    )
                }
                
                Text(
                    text = "${(if (activeScenarios.isNotEmpty()) (activeScenarios.map { it.sentimentBullishRatio }.average() * 100).toInt() else 50)}%",
                    color = theme.textPrimary,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
            }
            
            // Particle Flow Conviction Stream
            Spacer(Modifier.height(8.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(30.dp)
                    .clip(RoundedCornerShape(4.dp))
                    .background(Color.Black.copy(alpha = 0.3f)),
                contentAlignment = Alignment.Center
            ) {
                val infiniteParticles = rememberInfiniteTransition(label = "particles")
                val offset1 by infiniteParticles.animateFloat(initialValue = 0f, targetValue = 1f, animationSpec = infiniteRepeatable(animation = tween(2000, easing = LinearEasing)), label = "p1")
                
                androidx.compose.foundation.Canvas(modifier = Modifier.fillMaxSize()) {
                    val w = size.width
                    val h = size.height
                    val avgVol = if (filteredScenarios.isNotEmpty()) filteredScenarios.map { kotlin.math.abs(it.crowdConvictionSpeed) }.average().toFloat() else 1f
                    
                    // Particle count and speed multiplier determined dynamically by intensity toggles
                    val speedMulti = (avgVol / 10f).coerceIn(0.5f, 3f) * (particleIntensity / 2f)
                    val particleCount = (10 * particleIntensity).toInt()
                    
                    for (i in 0..particleCount) {
                        val initX = (i * (w / particleCount.coerceAtLeast(1)))
                        val currentX = (initX + (offset1 * w * speedMulti)) % w
                        val yOscillation = kotlin.math.sin((currentX / w) * Math.PI * 4) * (h / 4)
                        
                        drawCircle(
                            color = theme.brandAccent.copy(alpha = pulseAlpha * 0.8f),
                            radius = 1.5f.dp.toPx(),
                            center = androidx.compose.ui.geometry.Offset(x = currentX, y = (h/2) + yOscillation.toFloat())
                        )
                        
                        // draw faint trail line
                        drawLine(
                            color = theme.brandAccent.copy(alpha = pulseAlpha * 0.3f),
                            start = androidx.compose.ui.geometry.Offset(currentX - 15f, (h/2) + yOscillation.toFloat()),
                            end = androidx.compose.ui.geometry.Offset(currentX, (h/2) + yOscillation.toFloat()),
                            strokeWidth = 1.dp.toPx()
                        )
                    }
                }
            }

            // Interactive controls for particle stream intensity layers
            Spacer(Modifier.height(6.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.Black.copy(alpha = 0.2f), RoundedCornerShape(6.dp))
                    .padding(vertical = 4.dp, horizontal = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "PARTICLE INTENSITY:",
                    color = theme.textSecondary,
                    fontSize = 8.5.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
                
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    val levels = listOf(1.0f to "LOW", 2.0f to "MED", 3.0f to "HIGH", 4.0f to "ULTRA")
                    levels.forEach { (levelValue, label) ->
                        val isSel = particleIntensity == levelValue
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(4.dp))
                                .background(if (isSel) theme.brandAccent.copy(alpha = 0.25f) else Color.Transparent)
                                .border(0.5.dp, if (isSel) theme.brandAccent else Color.DarkGray, RoundedCornerShape(4.dp))
                                .clickable { particleIntensity = levelValue }
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = label,
                                color = if (isSel) Color.White else Color.Gray,
                                fontSize = 8.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }
                }
            }

            Spacer(Modifier.height(8.dp))

            // Gradients interactive legend explanation (Toggle Node Visibilities!)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(theme.bgCard.copy(alpha = 0.6f), RoundedCornerShape(8.dp))
                    .padding(8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Toggle Skeptical
                Row(
                    verticalAlignment = Alignment.CenterVertically, 
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                    modifier = Modifier
                        .clip(RoundedCornerShape(4.dp))
                        .clickable { filterSkeptical = !filterSkeptical }
                        .background(if (filterSkeptical) Color.Transparent else Color.Black.copy(alpha = 0.4f))
                        .padding(horizontal = 4.dp, vertical = 2.dp)
                ) {
                    Box(Modifier.size(8.dp).background(if (filterSkeptical) Color(0xFFFF073A) else Color.DarkGray, RoundedCornerShape(2.dp)))
                    Text(
                        text = "Skeptical (<45%)", 
                        color = if (filterSkeptical) theme.textPrimary else theme.textSecondary.copy(alpha = 0.5f), 
                        fontSize = 8.5.sp, 
                        fontFamily = ArialNarrowFamily,
                        fontWeight = if (filterSkeptical) FontWeight.Bold else FontWeight.Normal
                    )
                }

                // Toggle Balanced
                Row(
                    verticalAlignment = Alignment.CenterVertically, 
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                    modifier = Modifier
                        .clip(RoundedCornerShape(4.dp))
                        .clickable { filterBalanced = !filterBalanced }
                        .background(if (filterBalanced) Color.Transparent else Color.Black.copy(alpha = 0.4f))
                        .padding(horizontal = 4.dp, vertical = 2.dp)
                ) {
                    Box(Modifier.size(8.dp).background(if (filterBalanced) Color(0xFFFFD700) else Color.DarkGray, RoundedCornerShape(2.dp)))
                    Text(
                        text = "Balanced", 
                        color = if (filterBalanced) theme.textPrimary else theme.textSecondary.copy(alpha = 0.5f), 
                        fontSize = 8.5.sp, 
                        fontFamily = ArialNarrowFamily,
                        fontWeight = if (filterBalanced) FontWeight.Bold else FontWeight.Normal
                    )
                }

                // Toggle Optimal
                Row(
                    verticalAlignment = Alignment.CenterVertically, 
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                    modifier = Modifier
                        .clip(RoundedCornerShape(4.dp))
                        .clickable { filterOptimal = !filterOptimal }
                        .background(if (filterOptimal) Color.Transparent else Color.Black.copy(alpha = 0.4f))
                        .padding(horizontal = 4.dp, vertical = 2.dp)
                ) {
                    Box(Modifier.size(8.dp).background(if (filterOptimal) Color(0xFF00FF88) else Color.DarkGray, RoundedCornerShape(2.dp)))
                    Text(
                        text = "Optimal (>55%)", 
                        color = if (filterOptimal) theme.textPrimary else theme.textSecondary.copy(alpha = 0.5f), 
                        fontSize = 8.5.sp, 
                        fontFamily = ArialNarrowFamily,
                        fontWeight = if (filterOptimal) FontWeight.Bold else FontWeight.Normal
                    )
                }
            }

            Spacer(Modifier.height(12.dp))

            // Grid Heatmap Content
            val items = filteredScenarios.take(6)
            if (items.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(120.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("Deploying telemetry fields...", color = theme.textSecondary, fontFamily = ArialNarrowFamily)
                }
            } else {
                // Flow layouts or vertical column with rows to avoid Compose grid bugs
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    val rows = items.chunked(2)
                    for (row in rows) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            for (sc in row) {
                                HeatmapGridCell(
                                    sc = sc,
                                    pulseAlpha = pulseAlpha,
                                    isSelected = selectedEvent?.id == sc.id,
                                    onClick = {
                                        selectedEvent = if (selectedEvent?.id == sc.id) null else sc
                                    },
                                    modifier = Modifier.weight(1f)
                                )
                            }
                            if (row.size < 2) {
                                Spacer(modifier = Modifier.weight(1f))
                            }
                        }
                    }
                }
            }

                            // Expanded interactive detailed inspect panel
            AnimatedVisibility(
                visible = selectedEvent != null,
                enter = expandVertically() + fadeIn(),
                exit = shrinkVertically() + fadeOut()
            ) {
                selectedEvent?.let { sc ->
                    var geminiSummary by remember { mutableStateOf<String?>(null) }
                    var isLoading by remember { mutableStateOf(false) }

                    LaunchedEffect(sc.id) {
                        isLoading = true
                        geminiSummary = null
                        val ctx = "Market: \${sc.name}, Category: \${sc.category}, Bullish Ratio: \${(sc.sentimentBullishRatio * 100).toInt()}%, Volatility: \${sc.crowdConvictionSpeed}"
                        geminiSummary = com.example.engine.GeminiForecastClient.generateSatiricalGambitReport(ctx).take(120) + "..."
                        isLoading = false
                    }

                    Spacer(Modifier.height(12.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .glassContainerBackground(theme.brandAccent.copy(alpha = 0.1f), RoundedCornerShape(12.dp))
                            .border(1.dp, theme.brandAccent.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
                            .padding(12.dp)
                    ) {
                        Column {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = sc.name,
                                    color = Color.White,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = ArialFamily
                                )
                                Text(
                                    text = sc.category.uppercase(),
                                    color = theme.brandAccent,
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                            Spacer(Modifier.height(6.dp))
                            val conf = (sc.sentimentBullishRatio * 100).toInt()
                            val turb = String.format(java.util.Locale.US, "%.1f", abs(sc.crowdConvictionSpeed))
                            Text(
                                    text = "Aesthetic Heatmap Readout: Public alignment is currently operating at \${conf}% confidence with a dynamic turbulence factor of \${turb} units.",
                                    color = theme.textSecondary,
                                    fontSize = 11.sp,
                                    fontFamily = ArialNarrowFamily
                                )
                            Spacer(Modifier.height(8.dp))
                            Text(
                                text = "🧠 NEURAL PREDICTION:",
                                color = theme.brandPrimary,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace
                            )
                            if (isLoading) {
                                androidx.compose.material3.CircularProgressIndicator(
                                    modifier = Modifier.size(14.dp),
                                    color = theme.brandPrimary,
                                    strokeWidth = 2.dp
                                )
                            } else {
                                Text(
                                    text = geminiSummary ?: "Neural networks offline.",
                                    color = Color.White,
                                    fontSize = 11.sp,
                                    fontFamily = ArialNarrowFamily,
                                    fontStyle = androidx.compose.ui.text.font.FontStyle.Italic
                                )
                            }
                            
                            Spacer(Modifier.height(16.dp))
                            androidx.compose.material3.Divider(color = theme.brandPrimary.copy(alpha=0.3f))
                            Spacer(Modifier.height(12.dp))
                            
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                var wagerAmount by remember { mutableStateOf("100") }
                                Column(modifier = Modifier.weight(1f)) {
                                    Text("GAMBIT TOKEN WALLET", color = theme.textSecondary, fontSize = 9.sp, fontFamily = ArialNarrowFamily)
                                    Text("\${madxBalance.toInt()} \$MADx", color = com.example.ui.theme.BrandGold, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text("WHAT-IF SIMULATOR:", color = theme.brandAccent, fontSize = 9.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                                    
                                    val currentWager = wagerAmount.toDoubleOrNull() ?: 0.0
                                    val simulatedShift = if (currentWager > 0) String.format(java.util.Locale.US, "+%.2f%%", (currentWager / Math.max(madxBalance, 100.0)) * 2.5) else "0.00%"
                                    Text("Projected Net Grid Shift: $simulatedShift", color = Color.White, fontSize = 9.sp, fontFamily = ArialNarrowFamily)
                                }
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    androidx.compose.foundation.text.BasicTextField(
                                        value = wagerAmount,
                                        onValueChange = { wagerAmount = it },
                                        textStyle = androidx.compose.ui.text.TextStyle(color = Color.White, fontSize = 14.sp),
                                        modifier = Modifier
                                            .width(60.dp)
                                            .background(theme.bgDeep, RoundedCornerShape(4.dp))
                                            .padding(6.dp)
                                    )
                                    androidx.compose.material3.Button(
                                        onClick = {
                                            val amt = wagerAmount.toDoubleOrNull() ?: 100.0
                                            onWagerPlaced(sc.id, "BULL", amt)
                                        },
                                        colors = androidx.compose.material3.ButtonDefaults.buttonColors(containerColor = theme.brandPrimary),
                                        shape = RoundedCornerShape(6.dp),
                                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                                        modifier = Modifier.height(32.dp)
                                    ) {
                                        Text("WAGER", color = theme.bgDeep, fontSize = 11.sp, fontWeight = FontWeight.Black)
                                    }
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
fun HeatmapGridCell(
    sc: Scenario,
    pulseAlpha: Float,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val theme = LocalGambitTheme.current
    
    // Determine gradient colors based on sentiment ratio
    val sentimentColor = when {
        sc.sentimentBullishRatio >= 0.58 -> Color(0xFF00FF88) // Safe Cyber Emerald
        sc.sentimentBullishRatio < 0.44 -> Color(0xFFFF073A) // Hot Neon Red / Skeptical
        else -> Color(0xFFFFD700) // Balanced Amber
    }
    
    // Volatility thickness representation
    val volatilityMultiplier = (abs(sc.crowdConvictionSpeed) / 10.0).coerceIn(0.1, 1.2)
    val borderGlowAlpha = (pulseAlpha * volatilityMultiplier).toFloat().coerceIn(0.2f, 1.0f)
    val scaleFactor = 1f + (pulseAlpha * volatilityMultiplier * 0.05f).toFloat()
    
    Box(
        modifier = modifier
            .height(72.dp)
            .scale(scaleFactor)
            .clip(RoundedCornerShape(12.dp))
            .background(
                Brush.radialGradient(
                    colors = listOf(
                        sentimentColor.copy(alpha = 0.28f),
                        theme.bgCard.copy(alpha = 0.9f)
                    )
                )
            )
            .border(
                width = if (isSelected) 2.dp else 1.dp,
                color = if (isSelected) theme.brandPrimary else sentimentColor.copy(alpha = borderGlowAlpha),
                shape = RoundedCornerShape(12.dp)
            )
            .clickable { onClick() }
            .padding(10.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = sc.category.uppercase(),
                    color = theme.textSecondary,
                    fontSize = 8.5.sp,
                    fontWeight = FontWeight.ExtraBold,
                    fontFamily = FontFamily.Monospace,
                    maxLines = 1
                )
                
                // Pulsing volatility indicator dot
                Box(
                    modifier = Modifier
                        .size(6.dp)
                        .background(sentimentColor.copy(alpha = borderGlowAlpha), RoundedCornerShape(3.dp))
                )
            }
            
            Text(
                text = sc.name,
                color = Color.White,
                fontSize = 10.5.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = ArialFamily,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Bottom
            ) {
                Text(
                    text = "Consensus: ${(sc.sentimentBullishRatio * 100).toInt()}%",
                    color = sentimentColor,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = ArialNarrowFamily
                )
                
                Text(
                    text = "${String.format("%.1f", abs(sc.crowdConvictionSpeed))}u Flow",
                    color = Color.LightGray,
                    fontSize = 8.5.sp,
                    fontFamily = FontFamily.Monospace
                )
            }
        }
    }
}
