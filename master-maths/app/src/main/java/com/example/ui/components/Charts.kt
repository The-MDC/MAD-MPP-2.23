package com.example.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.LocalGambitTheme
import kotlin.math.sin
import com.example.model.TrendDataPoint
import androidx.compose.animation.core.*
import androidx.compose.runtime.*
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.foundation.gestures.detectTapGestures
import kotlin.math.roundToInt

@Composable
fun ConvictionTrendsChart(trendHistory: List<TrendDataPoint>, modifier: Modifier = Modifier) {
    val theme = LocalGambitTheme.current
    var lastUpdateKey by remember { mutableStateOf(0) }
    
    LaunchedEffect(trendHistory) {
        lastUpdateKey++
    }

    val floatAnim by animateFloatAsState(targetValue = if (trendHistory.isEmpty()) 0f else 1f, animationSpec = tween(1200))
    val infiniteTransition = rememberInfiniteTransition()
    val pulseRadius by infiniteTransition.animateFloat(
        initialValue = 4f,
        targetValue = 8f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        )
    )

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(240.dp)
            .background(theme.bgCard.copy(alpha = 0.15f), RoundedCornerShape(12.dp))
            .border(theme.borderWidth, theme.borderBrush, RoundedCornerShape(12.dp))
            .padding(16.dp)
    ) {
        Column {
            Text("CONVICTION TRENDS & VOLATILITY (LMSR)", color = theme.textPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ArialNarrowFamily)
            Row(modifier = Modifier.padding(top = 4.dp), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                Text("■ Conviction Score", color = theme.brandPrimary, fontSize = 9.5.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                Text("■ Market Volatility", color = theme.brandAccent, fontSize = 9.5.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
            }
            Spacer(Modifier.height(16.dp))
            
            if (trendHistory.isEmpty()) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("NO DATA", color = theme.textSecondary, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                }
                return@Column
            }

            Canvas(modifier = Modifier.fillMaxSize()) {
                val padding = 16f
                val width = size.width - padding * 2
                val height = size.height - padding * 2
                
                // Draw grid lines
                for (i in 0..4) {
                    val y = padding + height * (i / 4f)
                    drawLine(theme.textSecondary.copy(alpha = 0.2f), Offset(padding, y), Offset(size.width - padding, y), 1f)
                }

                val minX = trendHistory.first().timestamp
                val maxX = trendHistory.last().timestamp
                val timeRange = (maxX - minX).coerceAtLeast(1L).toFloat()

                val convictionPath = Path()
                val volatilityPath = Path()
                var isFirst = true

                trendHistory.forEach { point ->
                    val xProgress = (point.timestamp - minX).toFloat() / timeRange
                    
                    if (xProgress <= floatAnim) {
                        val x = padding + width * xProgress
                        
                        val convictionY = padding + height * (1f - (point.convictionScore / 100f))
                        val volatilityY = padding + height * (1f - (point.volatilityScore / 100f))

                        if (isFirst) {
                            convictionPath.moveTo(x, convictionY)
                            volatilityPath.moveTo(x, volatilityY)
                            isFirst = false
                        } else {
                            convictionPath.lineTo(x, convictionY)
                            volatilityPath.lineTo(x, volatilityY)
                        }
                    }
                }

                drawPath(convictionPath, color = theme.brandPrimary, style = Stroke(width = 4f, cap = StrokeCap.Round, join = androidx.compose.ui.graphics.StrokeJoin.Round))
                drawPath(volatilityPath, color = theme.brandAccent, style = Stroke(width = 3f, cap = StrokeCap.Round, join = androidx.compose.ui.graphics.StrokeJoin.Round, pathEffect = androidx.compose.ui.graphics.PathEffect.dashPathEffect(floatArrayOf(15f, 10f))))

                if (floatAnim >= 0.99f) {
                    val lastPt = trendHistory.last()
                    val lastX = padding + width
                    val lastConvY = padding + height * (1f - (lastPt.convictionScore / 100f))
                    val lastVolY = padding + height * (1f - (lastPt.volatilityScore / 100f))

                    drawCircle(color = theme.brandPrimary, radius = pulseRadius, center = Offset(lastX, lastConvY))
                    drawCircle(color = theme.bgDeep, radius = pulseRadius / 2, center = Offset(lastX, lastConvY))

                    drawCircle(color = theme.brandAccent, radius = pulseRadius, center = Offset(lastX, lastVolY))
                    drawCircle(color = theme.bgDeep, radius = pulseRadius / 2, center = Offset(lastX, lastVolY))
                }
            }
        }
    }
}

@Composable
fun HistoricalConvictionChart(marketId: String, modifier: Modifier = Modifier) {
    val theme = LocalGambitTheme.current
    var showVolatility by remember { mutableStateOf(false) }
    
    // Frame-based animation
    val infiniteTransition = rememberInfiniteTransition()
    val pulseAnim by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        )
    )
    val floatAnim by animateFloatAsState(targetValue = 1f, animationSpec = tween(1500))

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(280.dp)
            .background(theme.bgCard.copy(alpha = 0.15f), RoundedCornerShape(12.dp))
            .border(theme.borderWidth, theme.borderBrush, RoundedCornerShape(12.dp))
            .padding(16.dp)
    ) {
        Column {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Column {
                    Text("HISTORICAL CONVICTION FLUCTUATION", color = theme.textPrimary, fontSize = 11.sp, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                    Text("Powered by Recharts Engine (Synthetic)", color = theme.textSecondary, fontSize = 9.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("Volatility Overlay", color = theme.brandAccent, fontSize = 9.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                    Spacer(Modifier.width(4.dp))
                    androidx.compose.material3.Switch(
                        checked = showVolatility,
                        onCheckedChange = { showVolatility = it },
                        modifier = Modifier.scale(0.6f)
                    )
                }
            }
            Spacer(Modifier.height(12.dp))
            
            Canvas(modifier = Modifier.fillMaxSize()) {
                val padding = 12f
                val width = size.width - padding * 2
                val height = size.height - padding * 2
                
                // Draw grid lines
                for (i in 0..4) {
                    val y = padding + height * (i / 4f)
                    drawLine(theme.textSecondary.copy(alpha = 0.1f), Offset(padding, y), Offset(size.width - padding, y), 1f)
                }

                // Generate pseudo-random history based on market id
                val pointsCount = 30
                val seed = marketId.hashCode()
                val random = java.util.Random(seed.toLong())
                
                var currentVal = 0.5f + (random.nextFloat() * 0.2f - 0.1f)
                
                val path = Path()
                val volPoints = mutableListOf<Offset>()
                
                for (i in 0..pointsCount) {
                    val progress = i / pointsCount.toFloat()
                    val x = padding + width * progress
                    
                    // random walk
                    currentVal += (random.nextFloat() * 0.1f - 0.05f)
                    currentVal = currentVal.coerceIn(0.1f, 0.9f)
                    
                    val y = padding + height * (1f - currentVal)
                    
                    if (progress <= floatAnim) {
                        if (i == 0) {
                            path.moveTo(x, y)
                        } else {
                            path.lineTo(x, y)
                        }
                    }
                    
                    if (random.nextFloat() > 0.8f) { // Volatility marker condition
                        volPoints.add(Offset(x, y))
                    }
                }

                val animatedColor = androidx.compose.ui.graphics.lerp(theme.brandSecondary, theme.brandPrimary, pulseAnim)

                drawPath(
                    path = path,
                    color = animatedColor,
                    style = Stroke(
                        width = 4f,
                        cap = StrokeCap.Round,
                        join = androidx.compose.ui.graphics.StrokeJoin.Round
                    )
                )
                
                if (showVolatility) {
                    volPoints.forEach { point ->
                        if (point.x <= padding + width * floatAnim) {
                            val markerRadius = 4f + (pulseAnim * 3f)
                            drawCircle(color = theme.brandAccent, radius = markerRadius, center = point)
                            drawCircle(color = theme.bgDeep, radius = markerRadius / 2, center = point)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun CalibrationPlotChart(modifier: Modifier = Modifier) {
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
            Text("EVALUATING PREDICTION CALIBRATION", color = theme.textPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ArialNarrowFamily)
            Text("Perfect calibration = on the diagonal", color = theme.textSecondary, fontSize = 9.5.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
            Spacer(Modifier.height(16.dp))
            
            Canvas(modifier = Modifier.fillMaxSize()) {
                val padding = 16f
                val width = size.width - padding * 2
                val height = size.height - padding * 2
                
                // Draw grid
                for (i in 0..5) {
                    val y = padding + height * (i / 5f)
                    drawLine(theme.textSecondary.copy(alpha = 0.2f), Offset(padding, y), Offset(size.width - padding, y), 1f)
                }
                
                // Draw reference line
                drawLine(
                    color = theme.textSecondary,
                    start = Offset(padding, size.height - padding),
                    end = Offset(size.width - padding, padding),
                    strokeWidth = 2f,
                    pathEffect = androidx.compose.ui.graphics.PathEffect.dashPathEffect(floatArrayOf(10f, 10f))
                )
                
                // Draw data points (close to diagonal but wavy)
                val paintPath = Path()
                var isFirst = true
                val pointsCount = 12
                val dots = mutableListOf<Offset>()
                
                for (i in 0..pointsCount) {
                    val progress = i / pointsCount.toFloat()
                    val x = padding + width * progress
                    // Add slight sine wave variation to the diagonal
                    val yVariation = sin(progress * 10f) * 15f
                    val yLine = (size.height - padding) - (height * progress)
                    val y = (yLine + yVariation).coerceIn(padding, size.height - padding)
                    
                    val pt = Offset(x, y)
                    dots.add(pt)
                    
                    if (isFirst) {
                        paintPath.moveTo(x, y)
                        isFirst = false
                    } else {
                        paintPath.lineTo(x, y)
                    }
                }
                
                drawPath(paintPath, theme.brandSecondary, style = Stroke(3f))
                
                dots.forEachIndexed { index, dt ->
                    val r = 4f + (index % 3) * 2f
                    drawCircle(theme.brandPrimary, radius = r + 2f, center = dt)
                    drawCircle(theme.bgDeep, radius = r, center = dt)
                    drawCircle(theme.brandSecondary, radius = r - 1f, center = dt)
                }
            }
        }
    }
}

@Composable
fun BehavioralCycleChart(currentPhase: com.example.model.SentimentPhase? = null, modifier: Modifier = Modifier) {
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
            Text("INVESTOR BEHAVIOR CYCLE", color = theme.textPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ArialNarrowFamily)
            Text("Market Sentiment Trace", color = theme.brandAccent, fontSize = 9.5.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
            Spacer(Modifier.height(32.dp))
            
            Canvas(modifier = Modifier.fillMaxSize()) {
                val w = size.width
                val h = size.height
                
                val path = Path()
                path.moveTo(0f, h * 0.7f)
                
                // Curve approximation
                path.cubicTo(
                    w * 0.2f, h * 0.5f,
                    w * 0.4f, h * 0.05f,
                    w * 0.5f, h * 0.1f // Peak Euphoria
                )
                path.cubicTo(
                    w * 0.6f, h * 0.2f,
                    w * 0.7f, h * 0.9f,
                    w * 0.8f, h * 0.85f // Trough Despondency
                )
                path.cubicTo(
                    w * 0.9f, h * 0.8f,
                    w * 0.95f, h * 0.6f,
                    w, h * 0.5f
                )
                
                drawPath(path, theme.brandPrimary.copy(alpha=0.6f), style = Stroke(width = 4f, cap = StrokeCap.Round))
                
                // Draw dots at key points
                val points = listOf(
                    Offset(w * 0.1f, h * 0.61f), // Optimism
                    Offset(w * 0.25f, h * 0.35f), // Thrill
                    Offset(w * 0.5f, h * 0.1f), // Euphoria (Max Risk)
                    Offset(w * 0.65f, h * 0.5f), // Panic
                    Offset(w * 0.8f, h * 0.85f), // Despondency/Accumulation
                    Offset(w * 0.95f, h * 0.6f) // Relief
                )
                
                val activeIndex = when (currentPhase) {
                    com.example.model.SentimentPhase.EUPHORIA -> 2
                    com.example.model.SentimentPhase.PANIC -> 3
                    com.example.model.SentimentPhase.ACCUMULATION -> 4
                    com.example.model.SentimentPhase.DENIAL -> 1
                    else -> -1
                }
                
                points.forEachIndexed { i, it ->
                    val isActive = i == activeIndex
                    drawCircle(if (isActive) theme.brandAccent else theme.brandPrimary, radius = if (isActive) 12f else 6f, center = it)
                    if (isActive) {
                        drawCircle(theme.bgCard, radius = 8f, center = it)
                        drawCircle(theme.brandAccent, radius = 5f, center = it)
                    } else {
                        drawCircle(theme.bgCard, radius = 4f, center = it)
                    }
                }
            } // Close Canvas
        } // Close Column
            
        // Annotations
        Box(Modifier.fillMaxSize()) {
            Text("Euphoria", color = if (currentPhase == com.example.model.SentimentPhase.EUPHORIA) theme.brandAccent else theme.textSecondary, fontSize = 9.5.sp, fontWeight = FontWeight.Bold, modifier = Modifier.align(Alignment.TopCenter).padding(top = 28.dp))
            Text("Panic", color = if (currentPhase == com.example.model.SentimentPhase.PANIC) theme.brandAccent else theme.textSecondary, fontSize = 9.5.sp, modifier = Modifier.align(Alignment.CenterEnd).padding(end = 40.dp, top = 20.dp))
            Text("Accumulation", color = if (currentPhase == com.example.model.SentimentPhase.ACCUMULATION) theme.brandAccent else theme.brandPrimary, fontSize = 9.5.sp, modifier = Modifier.align(Alignment.BottomEnd).padding(end = 24.dp, bottom = 4.dp))
        }
    }
}

@Composable
fun ConvictionDataChart(modifier: Modifier = Modifier) {
    val theme = LocalGambitTheme.current
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(220.dp)
            .background(theme.bgCard.copy(alpha = 0.15f), RoundedCornerShape(12.dp))
            .border(theme.borderWidth, theme.borderBrush, RoundedCornerShape(12.dp))
            .padding(16.dp)
    ) {
        Column {
            Text("COBB-DOUGLAS CONVICTION SCORE", color = theme.textPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ArialNarrowFamily)
            Text("Time (1.35x) | Capital (0.75x) | Contrib (1.45x) | Psych (1.15x)", color = theme.brandSecondary, fontSize = 9.5.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
            Spacer(Modifier.height(16.dp))

            Canvas(modifier = Modifier.fillMaxSize()) {
                val center = Offset(size.width / 2, size.height / 2)
                val maxRadius = minOf(size.width, size.height) / 2f - 10f
                
                // Draw radar web
                for (i in 1..4) {
                    val r = maxRadius * (i / 4f)
                    drawCircle(theme.textSecondary.copy(alpha = 0.2f), radius = r, center = center, style = Stroke(1f))
                }
                
                val angles = listOf(0f, 90f, 180f, 270f)
                val labels = listOf("Time", "Cap", "Soc", "Psy")
                
                // Draw axes
                angles.forEach { angle ->
                    val rad = Math.toRadians(angle.toDouble())
                    val x = center.x + (maxRadius * kotlin.math.cos(rad)).toFloat()
                    val y = center.y + (maxRadius * kotlin.math.sin(rad)).toFloat()
                    drawLine(theme.textSecondary.copy(alpha = 0.3f), center, Offset(x, y), 1f)
                }
                
                // Draw conviction polygon
                val values = listOf(0.85f, 0.45f, 0.9f, 0.7f) // Example values
                val polyPath = Path()
                var isFirst = true
                
                val pts = mutableListOf<Offset>()
                
                values.forEachIndexed { i, value ->
                    val rad = Math.toRadians(angles[i].toDouble())
                    val x = center.x + (maxRadius * value * kotlin.math.cos(rad)).toFloat()
                    val y = center.y + (maxRadius * value * kotlin.math.sin(rad)).toFloat()
                    val pt = Offset(x, y)
                    pts.add(pt)
                    
                    if (isFirst) {
                        polyPath.moveTo(x, y)
                        isFirst = false
                    } else {
                        polyPath.lineTo(x, y)
                    }
                }
                polyPath.close()
                
                drawPath(polyPath, theme.brandPrimary.copy(alpha=0.2f))
                drawPath(polyPath, theme.brandPrimary, style = Stroke(2f))
                
                pts.forEach { drawCircle(theme.brandAccent, 4f, it) }
            }
        }
        
        // Annotations
        Box(Modifier.fillMaxSize()) {
            Text("Time", color = theme.textSecondary, fontSize = 10.5.sp, modifier = Modifier.align(Alignment.CenterEnd))
            Text("Capital", color = theme.textSecondary, fontSize = 10.5.sp, modifier = Modifier.align(Alignment.BottomCenter))
            Text("Social", color = theme.textSecondary, fontSize = 10.5.sp, modifier = Modifier.align(Alignment.CenterStart))
            Text("Psych", color = theme.textSecondary, fontSize = 10.5.sp, modifier = Modifier.align(Alignment.TopCenter).padding(top = 28.dp))
        }
    }
}

@Composable
fun LiquiditySentimentChart(modifier: Modifier = Modifier) {
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
            Text("MARKET SENTIMENT VS LIQUIDITY", color = theme.textPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ArialNarrowFamily)
            Text("Bids (Cyan) vs Asks (Magenta)", color = theme.textSecondary, fontSize = 9.5.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
            Spacer(Modifier.height(16.dp))
            
            Canvas(modifier = Modifier.fillMaxSize()) {
                val w = size.width
                val h = size.height
                val midX = w / 2f
                
                // Draw middle line
                drawLine(theme.textSecondary.copy(alpha = 0.3f), Offset(midX, 0f), Offset(midX, h), 1f)
                
                // Draw order book profile (Liquidity gaps)
                val bars = 20
                val barHeight = h / bars
                
                for (i in 0..bars) {
                    val y = i * barHeight
                    
                    // Asks (Right)
                    val askVol = if(i < 8) (Math.random() * (w/2)).toFloat() else (Math.random() * (w/4)).toFloat()
                    drawRect(theme.brandAccent.copy(alpha=0.6f), Offset(midX + 2f, y), androidx.compose.ui.geometry.Size(askVol, barHeight - 2f))
                    
                    // Bids (Left)
                    val bidVol = if(i > 12) (Math.random() * (w/2)).toFloat() else (Math.random() * (w/4)).toFloat()
                    drawRect(theme.brandSecondary.copy(alpha=0.6f), Offset(midX - bidVol - 2f, y), androidx.compose.ui.geometry.Size(bidVol, barHeight - 2f))
                }
            }
        }
    }
}

@Composable
fun AdvancedSentimentSuiteChart(modifier: Modifier = Modifier) {
    val theme = LocalGambitTheme.current
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(300.dp)
            .background(theme.bgCard.copy(alpha = 0.15f), RoundedCornerShape(12.dp))
            .border(theme.borderWidth, theme.borderBrush, RoundedCornerShape(12.dp))
            .padding(16.dp)
    ) {
        Column {
            Text("DATA VISUALIZATION SUITE", color = theme.textPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.AllertaStencilFamily)
            Text("Powered by Recharts Engine (Synthetic)", color = theme.textSecondary, fontSize = 10.5.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
            Spacer(Modifier.height(16.dp))
            
            Canvas(modifier = Modifier.fillMaxSize()) {
                val padding = 16f
                val w = size.width - padding * 2
                val h = size.height - padding * 2
                
                // Draw chart grid
                for (i in 0..5) {
                    val yLine = padding + h * (i / 5f)
                    drawLine(theme.textSecondary.copy(alpha = 0.2f), Offset(padding, yLine), Offset(w + padding, yLine), 1f)
                }

                // Complex layered chart - line + bar
                val points = 20
                val barWidth = (w / points) * 0.6f
                
                val path1 = Path() // Trend A
                val path2 = Path() // Trend B
                
                for (i in 0..points) {
                    val x = padding + (w / points) * i
                    
                    // Generate pseudo data
                    val valA = 0.3f + (kotlin.math.sin(i * 0.5f) * 0.2f) + (Math.random() * 0.1f).toFloat() // Sentiment curve
                    val valB = 0.5f + (kotlin.math.cos(i * 0.4f) * 0.3f) + (Math.random() * 0.1f).toFloat()
                    
                    val yA = padding + h * (1f - valA)
                    val yB = padding + h * (1f - valB)

                    // Draw volume bars (background)
                    val vol = (Math.random() * 0.4f).toFloat()
                    drawRect(
                        color = theme.textSecondary.copy(alpha = 0.1f),
                        topLeft = Offset(x - barWidth / 2f, padding + h * (1f - vol)),
                        size = androidx.compose.ui.geometry.Size(barWidth, h * vol)
                    )
                    
                    if (i == 0) {
                        path1.moveTo(x, yA)
                        path2.moveTo(x, yB)
                    } else {
                        // Using quadratic bezier for smooth Recharts style lines
                        path1.lineTo(x, yA)
                        path2.lineTo(x, yB)
                    }
                    
                    // Draw node point
                    drawCircle(theme.bgCard, radius = 6f, center = Offset(x, yB))
                    drawCircle(theme.brandSecondary, radius = 4f, center = Offset(x, yB))
                }
                
                // Draw paths with strokes and fills
                drawPath(path1, theme.brandAccent.copy(alpha=0.5f), style = Stroke(width = 4f, cap = StrokeCap.Round))
                drawPath(path2, theme.brandSecondary, style = Stroke(width = 3f, cap = StrokeCap.Round))
            }
        }
        
        Row(
            modifier = Modifier.align(Alignment.BottomCenter).fillMaxWidth().padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(8.dp).background(theme.brandSecondary, CircleShape))
                Spacer(Modifier.width(4.dp))
                Text("Sentiment Index", color = theme.textSecondary, fontSize = 10.5.sp)
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(8.dp).background(theme.brandAccent, CircleShape))
                Spacer(Modifier.width(4.dp))
                Text("Satirical Volatility", color = theme.textSecondary, fontSize = 10.5.sp)
            }
        }
    }
}

@Composable
fun GildedAsgardVolatilityChart(
    trendHistory: List<TrendDataPoint>,
    modifier: Modifier = Modifier
) {
    val theme = LocalGambitTheme.current
    var hoverPointIndex by remember { mutableStateOf<Int?>(null) }
    
    val floatAnim by animateFloatAsState(
        targetValue = if (trendHistory.isEmpty()) 0f else 1f,
        animationSpec = tween(1500, easing = FastOutSlowInEasing),
        label = "gilded_graph_anim"
    )

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(230.dp)
            .background(Color(0xFF07080a).copy(alpha = 0.82f), RoundedCornerShape(14.dp))
            .border(1.2.dp, Brush.horizontalGradient(listOf(Color(0xFFFFD700).copy(alpha = 0.5f), Color.Transparent, Color(0xFFFFD700).copy(alpha = 0.25f))), RoundedCornerShape(14.dp))
            .padding(16.dp)
    ) {
        GoldStardustBackground(Modifier.fillMaxSize().alpha(0.35f))
        
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        "⚡ GILDED ASGARD VOLATILITY TRENDS",
                        color = Color(0xFFFFD700),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = com.example.ui.theme.ArialNarrowFamily,
                        style = TextStyle(shadow = Shadow(Color(0xFFFFD700).copy(alpha = 0.35f), blurRadius = 12f))
                    )
                    Text(
                        "Live neural fluctuations synced to GARCH volatility engines",
                        color = Color.LightGray.copy(alpha = 0.65f),
                        fontSize = 8.5.sp,
                        fontFamily = FontFamily.Monospace
                    )
                }
                Box(
                    modifier = Modifier
                        .background(Color(0xFFFFD700).copy(alpha = 0.12f), RoundedCornerShape(4.dp))
                        .border(0.5.dp, Color(0xFFFFD700).copy(alpha = 0.7f), RoundedCornerShape(4.dp))
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                ) {
                    Text(
                        "LIVE MONITOR",
                        color = Color(0xFFFFD700),
                        fontSize = 7.5.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }
            Spacer(Modifier.height(12.dp))
            
            if (trendHistory.isEmpty()) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("MONITORING DATA ACQUISITION...", color = Color.Gray, fontSize = 9.sp, fontFamily = FontFamily.Monospace)
                }
                return@Column
            }

            Canvas(
                modifier = Modifier
                    .fillMaxSize()
                    .pointerInput(trendHistory) {
                        detectTapGestures { offset ->
                            val padding = 16f
                            val width = size.width - padding * 2
                            val pointsCount = trendHistory.size
                            if (pointsCount > 1) {
                                val colWidth = width / (pointsCount - 1)
                                val index = ((offset.x - padding) / colWidth).roundToInt().coerceIn(0, pointsCount - 1)
                                hoverPointIndex = index
                            }
                        }
                    }
            ) {
                val padding = 16f
                val w = size.width - padding * 2
                val h = size.height - padding * 2
                
                for (i in 0..3) {
                    val y = padding + h * (i / 3f)
                    drawLine(
                        color = Color(0xFFFFD700).copy(alpha = 0.08f),
                        start = Offset(padding, y),
                        end = Offset(size.width - padding, y),
                        strokeWidth = 1f
                    )
                }

                val minX = trendHistory.first().timestamp
                val maxX = trendHistory.last().timestamp
                val timeRange = (maxX - minX).coerceAtLeast(1L).toFloat()

                val linePath = Path()
                val areaPath = Path()
                var isFirst = true

                trendHistory.forEachIndexed { index, point ->
                    val xProgress = (point.timestamp - minX).toFloat() / timeRange
                    val x = padding + w * xProgress
                    val volatilityY = padding + h * (1f - (point.volatilityScore / 100f).coerceIn(0f, 1f))
                    
                    if (xProgress <= floatAnim) {
                        if (isFirst) {
                            linePath.moveTo(x, volatilityY)
                            areaPath.moveTo(x, size.height - padding)
                            areaPath.lineTo(x, volatilityY)
                            isFirst = false
                        } else {
                            linePath.lineTo(x, volatilityY)
                            areaPath.lineTo(x, volatilityY)
                        }
                        
                        if (index == trendHistory.size - 1) {
                            areaPath.lineTo(x, size.height - padding)
                        }
                    }
                }
                areaPath.close()

                drawPath(
                    path = areaPath,
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            Color(0xFFFFD700).copy(alpha = 0.2f),
                            Color(0xFFFFD700).copy(alpha = 0.01f),
                            Color.Transparent
                        )
                    )
                )

                drawPath(
                    path = linePath,
                    brush = com.example.ui.theme.AsgaardGoldBrush,
                    style = Stroke(
                        width = 4f,
                        cap = StrokeCap.Round,
                        join = androidx.compose.ui.graphics.StrokeJoin.Round
                    )
                )

                hoverPointIndex?.let { index ->
                    if (index < trendHistory.size) {
                        val pt = trendHistory[index]
                        val xProgress = (pt.timestamp - minX).toFloat() / timeRange
                        val x = padding + w * xProgress
                        val y = padding + h * (1f - (pt.volatilityScore / 100f).coerceIn(0f, 1f))
                        
                        drawLine(
                            color = Color(0xFFFFD700).copy(alpha = 0.35f),
                            start = Offset(x, padding),
                            end = Offset(x, size.height - padding),
                            strokeWidth = 1.5f,
                            pathEffect = androidx.compose.ui.graphics.PathEffect.dashPathEffect(floatArrayOf(10f, 5f))
                        )
                        
                        drawCircle(
                            color = Color(0xFFFFD700).copy(alpha = 0.3f),
                            radius = 12f,
                            center = Offset(x, y)
                        )
                        drawCircle(
                            color = Color.White,
                            radius = 6f,
                            center = Offset(x, y)
                        )
                        drawCircle(
                            color = Color(0xFFC59B27),
                            radius = 3.5f,
                            center = Offset(x, y)
                        )
                    }
                }

                if (hoverPointIndex == null && trendHistory.isNotEmpty() && floatAnim >= 0.99f) {
                    val lastPt = trendHistory.last()
                    val lastX = padding + w
                    val lastY = padding + h * (1f - (lastPt.volatilityScore / 100f).coerceIn(0f, 1f))
                    
                    drawCircle(color = Color(0xFFFFD700).copy(alpha = 0.45f), radius = 9f, center = Offset(lastX, lastY))
                    drawCircle(color = Color.White, radius = 4f, center = Offset(lastX, lastY))
                }
            }
        }
    }
}

@Composable
fun RealtimeSentimentGauge(bullishRatio: Double, modifier: Modifier = Modifier) {
    val theme = LocalGambitTheme.current
    val animatedRatio by animateFloatAsState(
        targetValue = bullishRatio.toFloat(),
        animationSpec = spring(stiffness = Spring.StiffnessLow),
        label = "sentiment_gauge_ratio"
    )

    Column(
        modifier = modifier
            .fillMaxWidth()
            .background(Color.Black.copy(alpha = 0.2f), RoundedCornerShape(12.dp))
            .border(0.8.dp, com.example.ui.theme.GoldFlakeBrush, RoundedCornerShape(12.dp))
            .padding(12.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                "🎰 REAL-TIME SENTIMENT GAUGE",
                color = Color.White,
                fontSize = 9.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace
            )
            Text(
                "${(animatedRatio * 100).toInt()}% BULLISH",
                color = com.example.ui.theme.NeonGreen,
                fontSize = 9.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace
            )
        }
        Spacer(Modifier.height(8.dp))
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(72.dp),
            contentAlignment = Alignment.BottomCenter
        ) {
            Canvas(modifier = Modifier.size(130.dp, 65.dp)) {
                val sizePx = size
                val arcRadius = sizePx.width / 2f
                val strokeWidth = 12.dp.toPx()
                
                // Draw total arc background
                drawArc(
                    brush = Brush.horizontalGradient(
                        colors = listOf(com.example.ui.theme.NeonPink, com.example.ui.theme.NeonCyan, com.example.ui.theme.NeonGreen)
                    ),
                    startAngle = 180f,
                    sweepAngle = 180f,
                    useCenter = false,
                    style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
                )
                
                // Draw current angle indicator pointer
                val targetAngle = 180f + (animatedRatio * 180f)
                val angleRad = Math.toRadians(targetAngle.toDouble())
                val pointerLength = arcRadius - 8.dp.toPx()
                val startX = sizePx.width / 2f
                val startY = sizePx.height
                val endX = startX + (pointerLength * kotlin.math.cos(angleRad)).toFloat()
                val endY = startY + (pointerLength * kotlin.math.sin(angleRad)).toFloat()
                
                // Draw inner circle hub
                drawCircle(
                    color = Color.White,
                    radius = 8.dp.toPx(),
                    center = Offset(startX, startY)
                )
                drawCircle(
                    color = com.example.ui.theme.BrandGold,
                    radius = 4.dp.toPx(),
                    center = Offset(startX, startY)
                )
                
                // Pointer line
                drawLine(
                    color = Color.White,
                    start = Offset(startX, startY),
                    end = Offset(endX, endY),
                    strokeWidth = 3.dp.toPx(),
                    cap = StrokeCap.Round
                )
            }
        }
        Spacer(Modifier.height(4.dp))
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text("BEARISH (DEGEN DOWN)", color = com.example.ui.theme.NeonPink, fontSize = 7.5.sp, fontFamily = FontFamily.Monospace)
            Text("BULLISH (DEGEN UP)", color = com.example.ui.theme.NeonGreen, fontSize = 7.5.sp, fontFamily = FontFamily.Monospace)
        }
    }
}

@Composable
fun MemeSentimentAnimatedTrendChart(
    trendData: List<Float> = listOf(0.2f, 0.5f, 0.8f, 0.4f, 0.9f, 0.3f, 0.7f, 1.0f),
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition()
    val flowAnim by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 100f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        )
    )

    val bounceAnim by infiniteTransition.animateFloat(
        initialValue = 0.95f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(800, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        )
    )

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(200.dp)
            .scale(bounceAnim)
            .background(Color(0xFF111111), RoundedCornerShape(12.dp))
            .border(2.dp, com.example.ui.theme.NeonCyan.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
            .padding(16.dp)
    ) {
        Column {
            Text("🚀 ULTRA HIGH FIDELITY MEME SENTIMENT", color = com.example.ui.theme.BrandGold, fontSize = 12.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
            Spacer(modifier = Modifier.height(8.dp))
            Canvas(modifier = Modifier.fillMaxSize()) {
                val width = size.width
                val height = size.height

                if (trendData.isEmpty()) return@Canvas

                val maxData = trendData.maxOrNull() ?: 1f
                val minData = trendData.minOrNull() ?: 0f
                val range = (maxData - minData).coerceAtLeast(0.1f)

                val path = Path()
                val stepX = width / (trendData.size - 1).coerceAtLeast(1)

                trendData.forEachIndexed { index, value ->
                    val x = index * stepX
                    val normalizedY = 1f - ((value - minData) / range)
                    val y = normalizedY * height + (sin((x + flowAnim) * 0.05f) * 10f)

                    if (index == 0) {
                        path.moveTo(x, y)
                    } else {
                        val prevX = (index - 1) * stepX
                        val prevNormalizedY = 1f - ((trendData[index - 1] - minData) / range)
                        val prevY = prevNormalizedY * height + (sin((prevX + flowAnim) * 0.05f) * 10f)
                        
                        val cp1x = prevX + (x - prevX) / 2f
                        val cp1y = prevY
                        val cp2x = prevX + (x - prevX) / 2f
                        val cp2y = y
                        
                        path.cubicTo(cp1x, cp1y, cp2x, cp2y, x, y)
                    }
                }

                drawPath(
                    path = path,
                    color = com.example.ui.theme.NeonPink,
                    style = Stroke(width = 4.dp.toPx(), cap = StrokeCap.Round)
                )

                // Fill area under the curve
                val fillPath = Path().apply {
                    addPath(path)
                    lineTo(width, height)
                    lineTo(0f, height)
                    close()
                }

                drawPath(
                    path = fillPath,
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            com.example.ui.theme.NeonPink.copy(alpha = 0.4f),
                            Color.Transparent
                        )
                    )
                )
                
                // Draw animated meme dots
                trendData.forEachIndexed { index, value ->
                    val x = index * stepX
                    val normalizedY = 1f - ((value - minData) / range)
                    val y = normalizedY * height + (sin((x + flowAnim) * 0.05f) * 10f)
                    
                    drawCircle(
                        color = com.example.ui.theme.NeonCyan,
                        radius = 6.dp.toPx(),
                        center = Offset(x, y)
                    )
                    drawCircle(
                        color = Color.White,
                        radius = 2.dp.toPx(),
                        center = Offset(x, y)
                    )
                }
            }
        }
    }
}

