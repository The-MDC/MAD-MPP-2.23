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

@Composable
fun ConvictionTrendsChart(trendHistory: List<TrendDataPoint>, modifier: Modifier = Modifier) {
    val theme = LocalGambitTheme.current
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(240.dp)
            .background(theme.bgCard, RoundedCornerShape(12.dp))
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
                    val x = padding + width * xProgress
                    
                    val convictionY = padding + height * (1f - (point.convictionScore / 100f))
                    val volatilityY = padding + height * (1f - (point.volatilityScore / 100f))

                    if (isFirst) {
                        convictionPath.moveTo(x, convictionY)
                        volatilityPath.moveTo(x, volatilityY)
                        isFirst = false
                    } else {
                        // Smooth cubic easing could be added here, but linear is fine for realtime
                        convictionPath.lineTo(x, convictionY)
                        volatilityPath.lineTo(x, volatilityY)
                    }
                }

                drawPath(convictionPath, color = theme.brandPrimary, style = Stroke(width = 4f, cap = StrokeCap.Round, join = androidx.compose.ui.graphics.StrokeJoin.Round))
                drawPath(volatilityPath, color = theme.brandAccent, style = Stroke(width = 3f, cap = StrokeCap.Round, join = androidx.compose.ui.graphics.StrokeJoin.Round, pathEffect = androidx.compose.ui.graphics.PathEffect.dashPathEffect(floatArrayOf(15f, 10f))))

                // Draw dots at the very end to signify "current"
                val lastPt = trendHistory.last()
                val lastX = padding + width
                val lastConvY = padding + height * (1f - (lastPt.convictionScore / 100f))
                val lastVolY = padding + height * (1f - (lastPt.volatilityScore / 100f))

                drawCircle(color = theme.brandPrimary, radius = 6f, center = Offset(lastX, lastConvY))
                drawCircle(color = theme.bgDeep, radius = 3f, center = Offset(lastX, lastConvY))

                drawCircle(color = theme.brandAccent, radius = 6f, center = Offset(lastX, lastVolY))
                drawCircle(color = theme.bgDeep, radius = 3f, center = Offset(lastX, lastVolY))
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
            .background(theme.bgCard, RoundedCornerShape(12.dp))
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
            .background(theme.bgCard, RoundedCornerShape(12.dp))
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
            .background(theme.bgCard, RoundedCornerShape(12.dp))
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
            .background(theme.bgCard, RoundedCornerShape(12.dp))
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
            .background(theme.bgCard, RoundedCornerShape(12.dp))
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
