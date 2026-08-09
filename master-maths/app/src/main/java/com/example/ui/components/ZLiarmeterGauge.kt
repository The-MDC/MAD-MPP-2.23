package com.example.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.*
import kotlin.math.cos
import kotlin.math.sin

@Composable
fun ZLiarmeterGauge(truthRatio: Double, modifier: Modifier = Modifier) {
    val theme = LocalGambitTheme.current
    
    // Smooth animated gauge transition with spring damping
    val animatedRatio by animateFloatAsState(
        targetValue = truthRatio.coerceIn(0.0, 1.0).toFloat(),
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessLow
        ),
        label = "needle_sweep"
    )

    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseAlpha by infiniteTransition.animateFloat(
        initialValue = 0.7f,
        targetValue = 1.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse_glow"
    )

    Column(
        modifier = modifier
            .fillMaxWidth()
            .glassContainerBackground(theme.brandSecondary, RoundedCornerShape(16.dp))
            .border(
                width = 1.5.dp,
                brush = Brush.linearGradient(
                    listOf(
                        Color.White.copy(alpha = 0.15f),
                        NeonPink.copy(alpha = pulseAlpha * 0.4f)
                    )
                ),
                shape = RoundedCornerShape(16.dp)
            )
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Top Header Row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                "🔮 Z-LIAR METER (D3 COGNITIVE)",
                color = NeonPink,
                fontSize = 10.5.sp,
                fontWeight = FontWeight.Black,
                fontFamily = FontFamily.Monospace,
                letterSpacing = 1.sp
            )
            Text(
                "SENTIMENT FLUX",
                color = Color.LightGray.copy(alpha = 0.7f),
                fontSize = 8.5.sp,
                fontFamily = FontFamily.Monospace,
                fontWeight = FontWeight.Bold
            )
        }
        
        Spacer(Modifier.height(16.dp))
        
        // High-Fidelity D3-inspired Semi-Circular Gauge Canvas
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(130.dp),
            contentAlignment = Alignment.BottomCenter
        ) {
            Canvas(
                modifier = Modifier
                    .fillMaxWidth()
                    .fillMaxHeight()
            ) {
                val width = size.width
                val height = size.height
                val centerX = width / 2f
                val centerY = height - 10.dp.toPx()
                
                val strokeWidth = 14.dp.toPx()
                // Radius is bounded by the height of canvas to prevent clipping
                val radius = (height - 20.dp.toPx() - strokeWidth / 2f).coerceAtMost(centerX - strokeWidth)

                val arcSize = Size(radius * 2, radius * 2)
                val topLeft = Offset(centerX - radius, centerY - radius)

                // 1. Draw Glassy Background Gauge Track
                drawArc(
                    color = Color.Black.copy(alpha = 0.5f),
                    startAngle = 180f,
                    sweepAngle = 180f,
                    useCenter = false,
                    topLeft = topLeft,
                    size = arcSize,
                    style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
                )

                // 2. Draw Colored Dopamine Spectrum (NeonPink -> BrandGold -> NeonGreen)
                // We draw the sweep arc using a gradient bounding brush
                val dopamineGradient = Brush.horizontalGradient(
                    colors = listOf(NeonPink, BrandGold, NeonGreen),
                    startX = centerX - radius,
                    endX = centerX + radius
                )
                
                drawArc(
                    brush = dopamineGradient,
                    startAngle = 180f,
                    sweepAngle = animatedRatio * 180f,
                    useCenter = false,
                    topLeft = topLeft,
                    size = arcSize,
                    style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
                )

                // 3. Draw Calibration Ticks (Every 18 degrees = 10% steps)
                val tickLengthOuter = radius + strokeWidth / 2f + 4.dp.toPx()
                val tickLengthInner = radius - strokeWidth / 2f - 4.dp.toPx()
                
                for (i in 0..10) {
                    val percentage = i / 10f
                    val angleRad = Math.toRadians((180f + percentage * 180f).toDouble())
                    
                    val cosVal = cos(angleRad).toFloat()
                    val sinVal = sin(angleRad).toFloat()

                    val start = Offset(
                        centerX + (radius - strokeWidth / 2f - 2.dp.toPx()) * cosVal,
                        centerY + (radius - strokeWidth / 2f - 2.dp.toPx()) * sinVal
                    )
                    val end = Offset(
                        centerX + (radius + strokeWidth / 2f + 2.dp.toPx()) * cosVal,
                        centerY + (radius + strokeWidth / 2f + 2.dp.toPx()) * sinVal
                    )

                    drawLine(
                        color = Color.White.copy(alpha = if (i % 5 == 0) 0.6f else 0.3f),
                        start = start,
                        end = end,
                        strokeWidth = if (i % 5 == 0) 2.dp.toPx() else 1.dp.toPx()
                    )
                }

                // 4. Draw Glowing Center Pin Cap
                drawCircle(
                    color = Color.Black,
                    radius = 12.dp.toPx(),
                    center = Offset(centerX, centerY)
                )
                drawCircle(
                    brush = Brush.radialGradient(
                        colors = listOf(Color.White, theme.brandPrimary.copy(alpha = 0.2f), Color.Transparent),
                        center = Offset(centerX, centerY),
                        radius = 14.dp.toPx()
                    ),
                    radius = 14.dp.toPx(),
                    center = Offset(centerX, centerY)
                )
                drawCircle(
                    color = theme.brandPrimary,
                    radius = 5.dp.toPx(),
                    center = Offset(centerX, centerY)
                )

                // 5. Draw Dynamic Rotating Needle
                val needleAngleRad = Math.toRadians((180f + animatedRatio * 180f).toDouble())
                val needleLength = radius - 8.dp.toPx()
                val needleEndX = centerX + needleLength * cos(needleAngleRad).toFloat()
                val needleEndY = centerY + needleLength * sin(needleAngleRad).toFloat()

                // Draw needle body with shadow offset
                drawLine(
                    color = Color.Black.copy(alpha = 0.4f),
                    start = Offset(centerX + 2.dp.toPx(), centerY + 2.dp.toPx()),
                    end = Offset(needleEndX + 2.dp.toPx(), needleEndY + 2.dp.toPx()),
                    strokeWidth = 3.5.dp.toPx(),
                    cap = StrokeCap.Round
                )
                drawLine(
                    color = Color.White,
                    start = Offset(centerX, centerY),
                    end = Offset(needleEndX, needleEndY),
                    strokeWidth = 2.5.dp.toPx(),
                    cap = StrokeCap.Round
                )
                // Draw hot tip on needle
                val tipLength = 10.dp.toPx()
                val tipX = centerX + (needleLength - tipLength) * cos(needleAngleRad).toFloat()
                val tipY = centerY + (needleLength - tipLength) * sin(needleAngleRad).toFloat()
                drawLine(
                    color = theme.brandPrimary,
                    start = Offset(tipX, tipY),
                    end = Offset(needleEndX, needleEndY),
                    strokeWidth = 3.dp.toPx(),
                    cap = StrokeCap.Round
                )
            }
        }

        Spacer(Modifier.height(8.dp))

        // Bottom Ratio Metrics Displays
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // SATIRE SIDE (0%)
            Column(horizontalAlignment = Alignment.Start) {
                Text(
                    text = "☠️ SATIRE / ROAST",
                    color = NeonPink,
                    fontSize = 7.5.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
                Text(
                    text = "${((1f - animatedRatio) * 100).toInt()}% DETECTED",
                    color = NeonPink.copy(alpha = 0.9f),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Monospace
                )
            }

            // TRUTH SIDE (100%)
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = "🎯 FACTUAL TRUTH",
                    color = NeonGreen,
                    fontSize = 7.5.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
                Text(
                    text = "${(animatedRatio * 100).toInt()}% VERIFIED",
                    color = NeonGreen.copy(alpha = 0.9f),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Monospace
                )
            }
        }
    }
}
