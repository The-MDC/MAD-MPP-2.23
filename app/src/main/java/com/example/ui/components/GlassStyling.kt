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
import androidx.compose.foundation.shape.CutCornerShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.unit.dp
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import com.example.ui.theme.GoldFlakeBrush
import com.example.ui.theme.RarityCommonBrush
import com.example.ui.theme.RarityUncommonBrush
import com.example.ui.theme.RarityRareBrush
import com.example.ui.theme.RarityEpicBrush
import com.example.ui.theme.RarityLegendaryBrush
import com.example.ui.theme.RarityGoldenBrush
import com.example.ui.theme.RarityMythicBrush

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

// Returns the correct border brush for each NFT card rarity tier
fun rarityBorderBrush(rarityName: String): Brush = when (rarityName.lowercase()) {
    "common"               -> RarityCommonBrush
    "uncommon"             -> RarityUncommonBrush
    "rare"                 -> RarityRareBrush
    "epic"                 -> RarityEpicBrush
    "legendary"            -> RarityLegendaryBrush
    "golden", "golden hand" -> RarityGoldenBrush
    "mythic"               -> RarityMythicBrush
    else                   -> GoldFlakeBrush
}

// Chaos Meter arc glow — intensity 0f..1f drives color from calm cyan to volatile red
fun chaosMeterGlowBrush(intensity: Float = 0.5f): Brush {
    val c = intensity.coerceIn(0f, 1f)
    return Brush.sweepGradient(
        colors = listOf(
            Color(0xFF00F0FF),
            Color(0xFF39FF14).copy(alpha = 1f - c * 0.5f),
            Color(0xFFFFD700),
            Color(0xFFFF8C00).copy(alpha = c),
            Color(0xFFFF003C).copy(alpha = c)
        )
    )
}

// Dopamine Slider track — value 0f (Blue Chip/calm) -> 1f (Max Degen/chaos)
fun dopamineGradientBrush(value: Float = 0f): Brush {
    val v = value.coerceIn(0f, 1f)
    return Brush.horizontalGradient(
        colorStops = arrayOf(
            0.0f  to Color(0xFF00F0FF),
            0.33f to Color(0xFF8B00FF).copy(alpha = 0.5f + v * 0.5f),
            0.66f to Color(0xFFFF007F).copy(alpha = v),
            1.0f  to Color(0xFFFF003C).copy(alpha = v)
        )
    )
}

// Modifier: rarity-aware glowing border using brand CutCornerShape language
fun Modifier.rarityBorder(rarityName: String, cornerDp: Float = 2f): Modifier =
    this.border(
        width = 1.2.dp,
        brush = rarityBorderBrush(rarityName),
        shape = CutCornerShape(cornerDp.dp)
    )

/**
 * Utility class (Modifier) for 'gold-flake-border' implementing a precise 1.15pt border
 * with ultra max polished linear-gradient gold sheen in ultra max high fidelity.
 * Includes padding so the neon/gold colors do not bleed into an illegible visual block.
 */
fun Modifier.goldFlakeBorder(
    shape: Shape = RoundedCornerShape(12.dp)
): Modifier {
    return this
        .border(
            width = 1.15.dp,
            brush = GoldFlakeBrush,
            shape = shape
        )
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
    shape: Shape = CutCornerShape(2.dp)
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
