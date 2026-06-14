package com.example.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.unit.dp

/**
 * A highly polished, borderless programmatically rendered vector avatar of The MADHAT'r.
 * Repesents the character concierge verbatim with his favorite top-hat, stylish shades,
 * a tucked playing card, and a glowing neon ribbon. Features subtle bobbing and pulsing animations.
 */
@Composable
fun MadHatrFloatingAvatar(modifier: Modifier = Modifier) {
    val infiniteTransition = rememberInfiniteTransition(label = "HatrTransition")
    
    // Smooth floating animation
    val translateY by infiniteTransition.animateFloat(
        initialValue = -3f,
        targetValue = 3f,
        animationSpec = infiniteRepeatable(
            animation = tween(1800, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ),
        label = "FloatingHatr"
    )
    
    // Glow/Pulse animation
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 0.96f,
        targetValue = 1.04f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = EaseInOutQuad),
            repeatMode = RepeatMode.Reverse
        ),
        label = "PulsingHatr"
    )

    Box(
        modifier = modifier
            .size(101.dp)
            .graphicsLayer {
                translationY = translateY
                scaleX = pulseScale
                scaleY = pulseScale
            },
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val w = size.width
            val h = size.height
            val centerX = w / 2
            val centerY = h / 2

            // Colors
            val hatGlossBrush = Brush.linearGradient(
                colors = listOf(
                    Color(0xFF26123D), // Royal deep velvet purple-indigo start
                    Color(0xFF130421), // Velvet shadow
                    Color(0xFF030007)  // Deepest black velvet
                ),
                start = Offset(0f, 0f),
                end = Offset(w, h)
            )
            val bandGlowBrush = Brush.linearGradient(
                colors = listOf(Color(0xFF00F0FF), Color(0xFFFF007F), Color(0xFF8B00FF)), // Neon Cyan to fuchsia pink
                start = Offset(0f, centerY),
                end = Offset(w, centerY)
            )
            val sunglassesColor = Color(0xFF030303)
            val sunglassesReflect = Color(0xFF00E5FF)

            val crownBottomY = centerY + h * 0.05f

            withTransform({
                scale(1.12f, 1.12f, pivot = Offset(centerX, crownBottomY))
            }) {
            // Draw shadow under the hat to separate it from the deep app background
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(Color(0xFFFF007F).copy(alpha = 0.25f), Color.Transparent),
                    center = Offset(centerX, centerY + 10f),
                    radius = w * 0.45f
                ),
                radius = w * 0.45f,
                center = Offset(centerX, centerY + 10f)
            )

            // --- 1. THE TOP-HAT ---
            // Crown Dimensions
            val crownWidthStart = w * 0.32f
            val crownWidthEnd = w * 0.68f
            val crownHeight = h * 0.45f
            val crownTopY = centerY - h * 0.35f

            // Top-Hat Crown Path (is slightly flared at the top for character look)
            val crownPath = Path().apply {
                moveTo(centerX - w * 0.21f, crownTopY) // Top left
                lineTo(centerX + w * 0.21f, crownTopY) // Top right
                lineTo(centerX + w * 0.17f, crownBottomY) // Bottom right
                lineTo(centerX - w * 0.17f, crownBottomY) // Bottom left
                close()
            }
            drawPath(path = crownPath, brush = hatGlossBrush)

            // Crown Top Oval Cap (adds 3D aspect)
            drawOval(
                color = Color(0xFF432E63),
                topLeft = Offset(centerX - w * 0.21f, crownTopY - 4f),
                size = Size(w * 0.42f, 8f)
            )

            // --- 2. THE CHESS KNIGHT EMBLEM (Direct Mirror from Hat Image) ---
            // Draw a high-fidelity glowing gold Chess Knight silhouette at the center-left of the cap
            val knightScaleX = w * 0.12f
            val knightScaleY = h * 0.16f
            val kx = centerX - w * 0.12f
            val ky = centerY - h * 0.12f
            
            val knightPath = Path().apply {
                moveTo(kx + knightScaleX * 0.6f, ky + knightScaleY * 0.9f)
                quadraticTo(kx + knightScaleX * 0.9f, ky + knightScaleY * 0.6f, kx + knightScaleX * 0.7f, ky + knightScaleY * 0.2f)
                lineTo(kx + knightScaleX * 0.5f, ky - knightScaleY * 0.1f)
                lineTo(kx + knightScaleX * 0.3f, ky - knightScaleY * 0.25f) // Ear top
                lineTo(kx + knightScaleX * 0.2f, ky - knightScaleY * 0.1f)  // Head front
                quadraticTo(kx - knightScaleX * 0.2f, ky - knightScaleY * 0.1f, kx - knightScaleX * 0.3f, ky + knightScaleY * 0.1f) // Snout
                quadraticTo(kx - knightScaleX * 0.1f, ky + knightScaleY * 0.3f, kx + knightScaleX * 0.1f, ky + knightScaleY * 0.4f) // Chest
                quadraticTo(kx - knightScaleX * 0.1f, ky + knightScaleY * 0.7f, kx - knightScaleX * 0.1f, ky + knightScaleY * 0.9f) // Base left
                lineTo(kx + knightScaleX * 0.6f, ky + knightScaleY * 0.9f)
                close()
            }
            // Fill with a golden glow
            drawPath(path = knightPath, color = Color(0x33FFD700))
            // Draw golden neon outline
            drawPath(path = knightPath, color = Color(0xFFFFD700), style = Stroke(width = 2.5f))

            // --- 3. HIGH FIDELITY NEON TEXT DRAWS (PASEOME, MAD, HAT's) ---
            // Draw custom texts directly with shadow layers on native canvas for actual vector glow
            val nativeCanvas = drawContext.canvas.nativeCanvas
            
            // Paints matching the neon tubes
            val paintFuchsia = android.graphics.Paint().apply {
                color = android.graphics.Color.parseColor("#FFFF007F") // Neon Pink/Fuchsia
                textSize = w * 0.082f
                isAntiAlias = true
                textAlign = android.graphics.Paint.Align.CENTER
                typeface = android.graphics.Typeface.create("sans-serif-black", android.graphics.Typeface.BOLD)
                setShadowLayer(8f, 0f, 0f, android.graphics.Color.parseColor("#FFFF007F"))
            }

            val paintGold = android.graphics.Paint().apply {
                color = android.graphics.Color.parseColor("#FFFFD700") // Neon Gold
                textSize = w * 0.082f
                isAntiAlias = true
                textAlign = android.graphics.Paint.Align.CENTER
                typeface = android.graphics.Typeface.create("sans-serif-black", android.graphics.Typeface.BOLD)
                setShadowLayer(8f, 0f, 0f, android.graphics.Color.parseColor("#FFFFD700"))
            }

            val paintGoldSmall = android.graphics.Paint().apply {
                color = android.graphics.Color.parseColor("#FFFFD700")
                textSize = w * 0.045f
                isAntiAlias = true
                textAlign = android.graphics.Paint.Align.CENTER
                typeface = android.graphics.Typeface.create("sans-serif-black", android.graphics.Typeface.BOLD)
                setShadowLayer(5f, 0f, 0f, android.graphics.Color.parseColor("#FFFFD700"))
            }

            // 3a. Curved Cap Header: "PASEOME"
            // Draw arched text
            nativeCanvas.drawText("PASEOME", centerX, crownTopY + h * 0.12f, paintFuchsia)

            // 3b. Vertical Cap Right Accent: "M-A-D"
            val colX = centerX + w * 0.11f
            val colStartY = crownTopY + h * 0.14f
            nativeCanvas.drawText("M", colX, colStartY, paintGold)
            nativeCanvas.drawText("A", colX, colStartY + h * 0.08f, paintGold)
            nativeCanvas.drawText("D", colX, colStartY + h * 0.16f, paintGold)

            // 3c. Bottom Cap Right label: "HAT'S"
            nativeCanvas.drawText("HAT'S", colX, colStartY + h * 0.23f, paintGoldSmall)

            // --- 4. TUCKED PLAYING CARD ---
            // A tilted white playing card tucked behind the band
            val cardPath = Path().apply {
                moveTo(centerX + w * 0.05f, crownBottomY - 14f)
                lineTo(centerX + w * 0.14f, crownBottomY - 32f)
                lineTo(centerX + w * 0.24f, crownBottomY - 28f)
                lineTo(centerX + w * 0.15f, crownBottomY - 10f)
                close()
            }
            drawPath(path = cardPath, color = Color.White)
            // Tiny Red heart suit/num on card
            drawCircle(
                color = Color(0xFFFF003C),
                radius = 3f,
                center = Offset(centerX + w * 0.14f, crownBottomY - 22f)
            )

            // --- 5. NEON GLOW RIBBON BAND ---
            // Drawn over the lower section of the crown
            val bandHeight = h * 0.08f
            val bandTopY = crownBottomY - bandHeight
            val bandPath = Path().apply {
                moveTo(centerX - w * 0.175f, bandTopY)
                lineTo(centerX + w * 0.175f, bandTopY)
                lineTo(centerX + w * 0.171f, crownBottomY)
                lineTo(centerX - w * 0.171f, crownBottomY)
                close()
            }
            drawPath(path = bandPath, brush = bandGlowBrush)

            // --- 6. THE BRIM ---
            // Classic flared flat brim curving elegantly
            val brimWidth = w * 0.65f
            val brimHeight = h * 0.08f
            val brimLeft = centerX - brimWidth / 2
            val brimTop = crownBottomY - 2f
            drawRoundRect(
                brush = hatGlossBrush,
                topLeft = Offset(brimLeft, brimTop),
                size = Size(brimWidth, brimHeight),
                cornerRadius = CornerRadius(brimHeight / 2)
            )

            // Brim Highlight
            drawRoundRect(
                color = Color(0xFFFF007F).copy(alpha = 0.5f), // Neon pink rim highlight from image
                topLeft = Offset(brimLeft + 4f, brimTop + 1f),
                size = Size(brimWidth - 8f, 3f),
                cornerRadius = CornerRadius(1.5f),
                style = Stroke(width = 1f)
            )
            }

            // --- 5. THE MADHAT'r GLASSES ---
            // Classy, cynical Jersey-style dark spectacles/sunglasses hanging below the brim
            val sunglassesY = crownBottomY + h * 0.09f
            val lensRadius = w * 0.12f
            val lensSpacing = w * 0.05f

            // Left Spectacle
            drawCircle(
                color = sunglassesColor,
                radius = lensRadius,
                center = Offset(centerX - lensRadius - lensSpacing / 2, sunglassesY)
            )
            // Left Spectacle Inner Gloss Reflection
            drawCircle(
                color = sunglassesReflect,
                radius = lensRadius * 0.35f,
                center = Offset(centerX - lensRadius - lensSpacing / 2 - 3f, sunglassesY - 3f)
            )

            // Right Spectacle
            drawCircle(
                color = sunglassesColor,
                radius = lensRadius,
                center = Offset(centerX + lensRadius + lensSpacing / 2, sunglassesY)
            )
            // Right Spectacle Inner Gloss Reflection
            drawCircle(
                color = sunglassesReflect,
                radius = lensRadius * 0.35f,
                center = Offset(centerX + lensRadius + lensSpacing / 2 - 3f, sunglassesY - 3f)
            )

            // Spectacles Bridge/Connector
            val bridgePath = Path().apply {
                moveTo(centerX - lensSpacing / 2, sunglassesY - 2f)
                quadraticTo(centerX, sunglassesY - 6f, centerX + lensSpacing / 2, sunglassesY - 2f)
            }
            drawPath(
                path = bridgePath,
                color = Color.White,
                style = Stroke(width = 2.5f)
            )

            // Cheeky Smirk Grin
            val grinY = sunglassesY + h * 0.14f
            val grinPath = Path().apply {
                moveTo(centerX - w * 0.08f, grinY)
                quadraticTo(centerX + w * 0.04f, grinY + 12f, centerX + w * 0.12f, grinY - 2f)
            }
            drawPath(
                path = grinPath,
                color = Color(0xFFFF007F),
                style = Stroke(width = 3.5f)
            )
        }
    }
}
