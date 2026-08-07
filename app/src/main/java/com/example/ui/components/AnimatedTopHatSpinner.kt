package com.example.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.LocalGambitTheme
import com.example.ui.theme.BrandGold
import com.example.ui.theme.NeonPink
import kotlin.math.sin

@Composable
fun AnimatedTopHatSpinner(
    modifier: Modifier = Modifier,
    size: Dp = 64.dp,
    tint: Color = BrandGold,
    bandColor: Color = NeonPink,
    showLabel: Boolean = true,
    labelText: String = "PONDERING CONVICTIONS..."
) {
    val theme = LocalGambitTheme.current
    val infiniteTransition = rememberInfiniteTransition(label = "top_hat_bounce")
    
    // 1. Smooth hover/bouncing offset
    val bounceFraction by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ),
        label = "bounce"
    )

    // 2. Continuous rotation tilt
    val tiltAngle by infiniteTransition.animateFloat(
        initialValue = -12f,
        targetValue = 12f,
        animationSpec = infiniteRepeatable(
            animation = tween(1400, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ),
        label = "tilt"
    )

    // Calculate dynamic values for bounce, stretch, and shadow
    val bounceOffset = bounceFraction * -16.dp.value // Bounces upwards
    val squashStretchY = 1f + (sin(bounceFraction * Math.PI) * 0.08f).toFloat() * if (bounceFraction > 0.5f) 1f else -1f
    val squashStretchX = 1f / squashStretchY // Preserve volume/aspect ratio (classic cartoon squash & stretch!)
    val shadowScale = 1f - (bounceFraction * 0.45f) // Shadow shrinks as hat goes up
    val shadowAlpha = 0.5f - (bounceFraction * 0.35f) // Shadow fades as hat goes up

    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier
                .size(size)
                .padding(4.dp),
            contentAlignment = Alignment.BottomCenter
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val canvasWidth = size.toPx()
                val canvasHeight = size.toPx()
                
                // Draw Ambient Ground Shadow under the bouncing hat
                val shadowWidth = canvasWidth * 0.65f * shadowScale
                val shadowHeight = canvasHeight * 0.08f * shadowScale
                drawOval(
                    brush = Brush.radialGradient(
                        colors = listOf(Color.Black.copy(alpha = shadowAlpha), Color.Transparent),
                        center = Offset(canvasWidth / 2f, canvasHeight - 2.dp.toPx()),
                        radius = shadowWidth / 2f
                    ),
                    topLeft = Offset(
                        (canvasWidth - shadowWidth) / 2f,
                        canvasHeight - shadowHeight - 1.dp.toPx()
                    ),
                    size = Size(shadowWidth, shadowHeight)
                )

                // Pivot point for tilt and squash is at the brim center
                val pivotX = canvasWidth / 2f
                val pivotY = canvasHeight * 0.82f

                // Apply custom transforms in drawing: bounce, scale (squash/stretch), and rotation tilt using Type-Safe withTransform
                withTransform({
                    translate(top = bounceOffset)
                    rotate(degrees = tiltAngle, pivot = Offset(pivotX, pivotY))
                    scale(scaleX = squashStretchX, scaleY = squashStretchY, pivot = Offset(pivotX, pivotY))
                }) {
                    // --- Let's Draw the High-Fidelity top hat ---
                    // Sizing ratios based on canvas
                    val hatBaseWidth = canvasWidth * 0.78f
                    val hatBaseHeight = canvasHeight * 0.12f
                    val hatBrimY = canvasHeight * 0.74f
                    val hatCrownWidth = canvasWidth * 0.52f
                    val hatCrownHeight = canvasHeight * 0.48f
                    val hatCrownTopY = hatBrimY - hatCrownHeight
                    val hatCrownX = (canvasWidth - hatCrownWidth) / 2f

                    // 1. Draw Crown (Hat body)
                    val crownPath = Path().apply {
                        moveTo(hatCrownX, hatBrimY)
                        cubicTo(
                            hatCrownX - 3.dp.toPx(), hatBrimY - hatCrownHeight * 0.4f,
                            hatCrownX - 6.dp.toPx(), hatBrimY - hatCrownHeight * 0.8f,
                            hatCrownX - 4.dp.toPx(), hatCrownTopY
                        )
                        lineTo(canvasWidth - hatCrownX + 4.dp.toPx(), hatCrownTopY)
                        cubicTo(
                            canvasWidth - hatCrownX + 6.dp.toPx(), hatBrimY - hatCrownHeight * 0.8f,
                            canvasWidth - hatCrownX + 3.dp.toPx(), hatBrimY - hatCrownHeight * 0.4f,
                            canvasWidth - hatCrownX, hatBrimY
                        )
                        close()
                    }

                    // Fill Crown with deep metallic dark/gold gradient
                    drawPath(
                        path = crownPath,
                        brush = Brush.verticalGradient(
                            colors = listOf(
                                tint.copy(alpha = 0.85f),
                                Color.Black.copy(alpha = 0.95f),
                                Color.Black
                            )
                        )
                    )

                    // Highlights on left crown edge for realistic shine
                    drawPath(
                        path = crownPath,
                        brush = Brush.horizontalGradient(
                            0.0f to Color.White.copy(alpha = 0.15f),
                            0.25f to Color.Transparent,
                            startX = hatCrownX - 10.dp.toPx(),
                            endX = canvasWidth - hatCrownX
                        )
                    )

                    // 2. Draw Crown Top Ellipse Cover
                    drawOval(
                        brush = Brush.radialGradient(
                            colors = listOf(tint.copy(alpha = 0.9f), Color.Black),
                            center = Offset(canvasWidth / 2f, hatCrownTopY),
                            radius = hatCrownWidth / 2f + 4.dp.toPx()
                        ),
                        topLeft = Offset(hatCrownX - 4.dp.toPx(), hatCrownTopY - 5.dp.toPx()),
                        size = Size(hatCrownWidth + 8.dp.toPx(), 10.dp.toPx())
                    )

                    // 3. Draw Ribbon/Band around crown base
                    val bandHeight = hatCrownHeight * 0.18f
                    val bandY = hatBrimY - bandHeight
                    val bandPath = Path().apply {
                        moveTo(hatCrownX, bandY)
                        lineTo(canvasWidth - hatCrownX, bandY)
                        lineTo(canvasWidth - hatCrownX + 1.dp.toPx(), hatBrimY)
                        lineTo(hatCrownX - 1.dp.toPx(), hatBrimY)
                        close()
                    }
                    drawPath(
                        path = bandPath,
                        brush = Brush.verticalGradient(
                            colors = listOf(bandColor, bandColor.copy(alpha = 0.6f))
                        )
                    )
                    // Accent shine on ribbon band
                    drawPath(
                        path = bandPath,
                        brush = Brush.horizontalGradient(
                            0.0f to Color.White.copy(alpha = 0.25f),
                            0.15f to Color.Transparent,
                            startX = hatCrownX,
                            endX = canvasWidth - hatCrownX
                        )
                    )

                    // 4. Draw Brim (Bottom curled ellipse)
                    val brimPath = Path().apply {
                        val rect = Rect(
                            offset = Offset((canvasWidth - hatBaseWidth) / 2f, hatBrimY - hatBaseHeight / 2f),
                            size = Size(hatBaseWidth, hatBaseHeight)
                        )
                        addOval(rect)
                    }

                    // Fill Brim with glossy dark gradient
                    drawPath(
                        path = brimPath,
                        brush = Brush.verticalGradient(
                            colors = listOf(
                                Color.Black,
                                Color.Black.copy(alpha = 0.9f),
                                tint.copy(alpha = 0.4f)
                            )
                        )
                    )
                    
                    // Drawing custom curved rim edge overlay to highlight the edge
                    drawArc(
                        brush = Brush.linearGradient(
                            listOf(tint, Color.Transparent)
                        ),
                        startAngle = 0f,
                        sweepAngle = 180f,
                        useCenter = false,
                        topLeft = Offset((canvasWidth - hatBaseWidth) / 2f, hatBrimY - hatBaseHeight / 2f),
                        size = Size(hatBaseWidth, hatBaseHeight),
                        style = Stroke(width = 1.2.dp.toPx())
                    )
                }
            }
        }

        if (showLabel) {
            Spacer(Modifier.height(10.dp))
            Text(
                text = labelText,
                color = theme.textPrimary.copy(alpha = 0.8f),
                fontSize = 8.5.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
                letterSpacing = 1.5.sp
            )
        }
    }
}
