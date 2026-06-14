package com.example.ui.components

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.CompositingStrategy
import androidx.compose.ui.draw.drawWithCache
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.draw.clip
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.unit.dp
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment

val NeonIconsGradient = Brush.linearGradient(
    colors = listOf(
        Color(0xFF00E5FF), // Cyan
        Color(0xFFFF007F), // Pink
        Color(0xFFFF073A), // Red
        Color(0xFF9D00FF)  // Purple
    )
)

val SlateSubduedColor = Color(0xFF90A4AE).copy(alpha = 0.5f)

/**
 * Modifier to render any icon or vector with a Neon Gradient mask using high-fidelity offscreen compositing strategy.
 */
fun Modifier.neonIconComposer(isActive: Boolean = true): Modifier {
    return if (isActive) {
        this
            .graphicsLayer(alpha = 0.99f, compositingStrategy = CompositingStrategy.Offscreen)
            .drawWithCache {
                onDrawWithContent {
                    drawContent()
                    drawRect(
                        brush = NeonIconsGradient,
                        blendMode = BlendMode.SrcAtop
                    )
                }
            }
    } else {
        this
    }
}

/**
 * Brush for glass reflection matching any given base color.
 */
fun getGlassReflectionBrush(baseColor: Color): Brush {
    return Brush.verticalGradient(
        colors = listOf(
            baseColor.copy(alpha = 0.35f),
            baseColor.copy(alpha = 0.05f),
            Color.Transparent
        )
    )
}

/**
 * Modifier that creates a premium, subtle glass reflection layer in place of solid gradients.
 */
fun Modifier.glassReflection(
    baseColor: Color,
    shape: Shape = RoundedCornerShape(10.dp),
    borderWidth: Float = 1f
): Modifier {
    return this
        .clip(shape)
        .background(baseColor.copy(alpha = 0.08f))
        .border(
            width = borderWidth.dp,
            brush = Brush.verticalGradient(
                colors = listOf(
                    baseColor.copy(alpha = 0.4f),
                    baseColor.copy(alpha = 0.1f)
                )
            ),
            shape = shape
        )
}

/**
 * Modifier that sets a premium glass reflection layer inside any container, 
 * beautifully matching its theme color without overlapping gold/neon borders.
 */
fun Modifier.glassContainerBackground(
    baseColor: Color,
    shape: Shape = RoundedCornerShape(12.dp)
): Modifier {
    // 85% transparent (15% opaque fill color)
    val glassBaseColor = baseColor.copy(alpha = 0.15f)
    return this
        .clip(shape)
        .background(glassBaseColor)
        .border(
            width = 1.dp,
            brush = Brush.verticalGradient(
                colors = listOf(
                    baseColor.copy(alpha = 0.45f),
                    baseColor.copy(alpha = 0.15f)
                )
            ),
            shape = shape
        )
        .drawWithCache {
            onDrawWithContent {
                drawContent()
                // Overlay a top-to-bottom subtle reflective glass sheen
                drawRect(
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            baseColor.copy(alpha = 0.25f),
                            baseColor.copy(alpha = 0.05f),
                            Color.Transparent
                        )
                    )
                )
            }
        }
}

/**
 * High-fidelity glass effect explicitly crafted for all inner containers.
 * Preserves the premium glass sheen with 85% transparency.
 */
fun Modifier.innerGlassContainerBackground(
    baseColor: Color,
    shape: Shape = RoundedCornerShape(8.dp)
): Modifier {
    val glassBaseColor = baseColor.copy(alpha = 0.15f) // 85% transparent
    return this
        .clip(shape)
        .background(glassBaseColor)
        .border(
            width = 0.75.dp,
            brush = Brush.verticalGradient(
                colors = listOf(
                    baseColor.copy(alpha = 0.35f),
                    baseColor.copy(alpha = 0.1f)
                )
            ),
            shape = shape
        )
        .drawWithCache {
            onDrawWithContent {
                drawContent()
                // Beautiful inner reflection layer
                drawRect(
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            baseColor.copy(alpha = 0.15f),
                            Color.Transparent
                        )
                    )
                )
            }
        }
}

/**
 * Reusable Glass Keycap Button styled with a subtle glass reflection layer
 * instead of a solid gradient background, combined with a Neon Gradient Icon.
 */
@Composable
fun GlassKeycapButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    baseColor: Color = Color(0xFF00E5FF),
    icon: @Composable (() -> Unit)? = null,
    label: @Composable (() -> Unit)? = null,
    shape: Shape = RoundedCornerShape(10.dp)
) {
    Box(
        modifier = modifier
            .glassReflection(baseColor, shape)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        // The vertical shiny glass sheen layer matching baseColor
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(getGlassReflectionBrush(baseColor))
        )
        
        Row(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            if (icon != null) {
                icon()
                if (label != null) {
                    Spacer(modifier = Modifier.width(8.dp))
                }
            }
            if (label != null) {
                label()
            }
        }
    }
}
