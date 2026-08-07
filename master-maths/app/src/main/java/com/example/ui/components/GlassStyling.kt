package com.example.ui.components

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.CompositingStrategy
import androidx.compose.ui.draw.drawWithCache
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.composed
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Outline
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.hoverable
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
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
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
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
    return this.laserEtchedCutout(isActive)
}

/**
 * Modifier to render any icon or vector with a cutout laser-etched design.
 * Selected items blend with a vibrant gold + neon spectrum.
 * Unselected items render with a sleek, recessed dark metallic cutout look.
 */
fun Modifier.laserEtchedCutout(isActive: Boolean = true, intensity: Float = 0.95f): Modifier {
    return if (isActive) {
        this
            .graphicsLayer(alpha = 0.99f, compositingStrategy = CompositingStrategy.Offscreen)
            .drawWithCache {
                onDrawWithContent {
                    // 1. Draw a recessed background cavity shadow first
                    drawRect(
                        color = Color.Black.copy(alpha = 0.45f),
                        topLeft = androidx.compose.ui.geometry.Offset(1.5f, 1.5f),
                        size = size
                    )
                    
                    // 2. Draw active glowing stenciled vector content
                    drawContent()
                    
                    // 3. Stencil with a brilliant cyber energetic spectrum
                    drawRect(
                        brush = Brush.linearGradient(
                            colors = listOf(
                                Color(0xFFFFD700), // Laser Gold
                                Color(0xFF00E5FF), // Cyber Cyan
                                Color(0xFFFF007F), // Neon Pink
                                Color(0xFFE040FB)  // Electric Violet
                            )
                        ),
                        blendMode = BlendMode.SrcAtop,
                        alpha = intensity
                    )
                }
            }
    } else {
        this
            .graphicsLayer(alpha = 0.75f, compositingStrategy = CompositingStrategy.Offscreen)
            .drawWithCache {
                onDrawWithContent {
                    // Recessed dark titanium look for unselected State
                    drawContent()
                    drawRect(
                        brush = Brush.linearGradient(
                            colors = listOf(
                                Color(0xFF212121), // Carbon black
                                Color(0xFF37474F), // Slate iron
                                Color(0xFF0D1B2A)  // Dark deep navy
                            )
                        ),
                        blendMode = BlendMode.SrcAtop,
                        alpha = 0.8f
                    )
                }
            }
    }
}

/**
 * Brush for glass reflection matching any given base color, but infused with Asgaard liquid gold sheen.
 */
fun getGlassReflectionBrush(baseColor: Color): Brush {
    return com.example.ui.theme.LiquidSheenGoldBrush
}

/**
 * Modifier that creates a premium, subtle glass reflection layer in place of solid gradients.
 */
fun Modifier.glassReflection(
    baseColor: Color,
    shape: Shape = androidx.compose.foundation.shape.CutCornerShape(2.dp),
    borderWidth: Float = 1f
): Modifier {
    return this
        .clip(shape)
        .background(Color(0xFF030510).copy(alpha = 0.5f))
        .background(baseColor.copy(alpha = 0.05f))
        .goldFlakeBorder(shape = shape)
        .drawWithCache {
            onDrawWithContent {
                drawContent()
                drawRect(
                    brush = com.example.ui.theme.LiquidSheenGoldBrush,
                    blendMode = BlendMode.Overlay,
                    alpha = 0.5f
                )
            }
        }
}

/**
 * Modifier that sets a premium glass reflection layer inside any container, 
 * beautifully matching its theme color without overlapping gold/neon borders.
 */
fun Modifier.glassContainerBackground(
    baseColor: Color,
    shape: Shape = androidx.compose.foundation.shape.CutCornerShape(2.dp)
): Modifier = this.composed {
    val interactionSource = androidx.compose.runtime.remember { androidx.compose.foundation.interaction.MutableInteractionSource() }
    val isHovered by interactionSource.collectIsHoveredAsState()

    val scale by androidx.compose.animation.core.animateFloatAsState(
        targetValue = if (isHovered) 1.01f else 1f,
        animationSpec = androidx.compose.animation.core.spring(dampingRatio = 0.5f, stiffness = 200f),
        label = "container_lift_scale"
    )
    val rotX by androidx.compose.animation.core.animateFloatAsState(
        targetValue = if (isHovered) 1.5f else 0f,
        animationSpec = androidx.compose.animation.core.spring(dampingRatio = 0.5f, stiffness = 200f),
        label = "container_lift_rotX"
    )

    val glassBaseColor = baseColor.copy(alpha = 0.12f)
    this
        .graphicsLayer {
            scaleX = scale
            scaleY = scale
            this.rotationX = rotX
            shadowElevation = 0f
            cameraDistance = 12f * density
        }
        .hoverable(interactionSource)
        .clip(shape)
        .background(Color(0xFF040718).copy(alpha = 0.72f)) // Lighter contrasting dark backdrop
        .background(glassBaseColor)
        .goldFlakeBorder(shape = shape)
        .drawWithCache {
            val flakePositions = List(8) { index ->
                val rX = ((index * 37) % 100) / 100f
                val rY = ((index * 79) % 100) / 100f
                val sizeVal = 2.dp.toPx() + ((index * 13) % 4).dp.toPx()
                Triple(rX, rY, sizeVal)
            }
            onDrawWithContent {
                // Draw real gold liquid flakes in the interior container background
                flakePositions.forEach { (rX, rY, sv) ->
                    val cx = rX * size.width
                    val cy = rY * size.height
                    val path = androidx.compose.ui.graphics.Path().apply {
                        moveTo(cx, cy - sv)
                        lineTo(cx + sv * 0.7f, cy)
                        lineTo(cx, cy + sv)
                        lineTo(cx - sv * 0.7f, cy)
                        close()
                    }
                    drawPath(
                        path = path,
                        brush = com.example.ui.theme.AsgaardGoldBrush,
                        alpha = 0.35f,
                        blendMode = BlendMode.Screen
                    )
                }

                drawContent()
                // Overlay a top-to-bottom subtle reflective glass sheen
                drawRect(
                    brush = com.example.ui.theme.AsgaardGoldBrush,
                    blendMode = BlendMode.Overlay,
                    alpha = 0.25f
                )
                // Add inner refraction glow
                drawRect(
                    brush = com.example.ui.theme.LiquidSheenGoldBrush,
                    blendMode = BlendMode.Screen,
                    alpha = 0.08f
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
    shape: Shape = androidx.compose.foundation.shape.CutCornerShape(2.dp)
): Modifier = this.composed {
    val interactionSource = androidx.compose.runtime.remember { androidx.compose.foundation.interaction.MutableInteractionSource() }
    val isHovered by interactionSource.collectIsHoveredAsState()

    val scale by androidx.compose.animation.core.animateFloatAsState(
        targetValue = if (isHovered) 1.01f else 1f,
        animationSpec = androidx.compose.animation.core.spring(dampingRatio = 0.5f, stiffness = 200f),
        label = "inner_container_lift_scale"
    )
    val tilt by androidx.compose.animation.core.animateFloatAsState(
        targetValue = if (isHovered) -1f else 0f,
        animationSpec = androidx.compose.animation.core.spring(dampingRatio = 0.5f, stiffness = 200f),
        label = "inner_container_lift_tilt"
    )

    val glassBaseColor = baseColor.copy(alpha = 0.12f) // 88% transparent
    this
        .graphicsLayer {
            scaleX = scale
            scaleY = scale
            this.rotationY = tilt
            shadowElevation = 0f
            cameraDistance = 12f * density
        }
        .hoverable(interactionSource)
        .clip(shape)
        .background(Color(0xFF040718).copy(alpha = 0.55f)) // Lighter contrasting dark backdrop
        .background(glassBaseColor)
        .goldFlakeBorder(shape = shape)
        .drawWithCache {
            val flakePositions = List(6) { index ->
                val rX = ((index * 43) % 100) / 100f
                val rY = ((index * 67) % 100) / 100f
                val sizeVal = 1.5.dp.toPx() + ((index * 17) % 3).dp.toPx()
                Triple(rX, rY, sizeVal)
            }
            onDrawWithContent {
                // Draw real gold liquid flakes in the inner container background
                flakePositions.forEach { (rX, rY, sv) ->
                    val cx = rX * size.width
                    val cy = rY * size.height
                    val path = androidx.compose.ui.graphics.Path().apply {
                        moveTo(cx, cy - sv)
                        lineTo(cx + sv * 0.7f, cy)
                        lineTo(cx, cy + sv)
                        lineTo(cx - sv * 0.7f, cy)
                        close()
                    }
                    drawPath(
                        path = path,
                        brush = com.example.ui.theme.AsgaardGoldBrush,
                        alpha = 0.3f,
                        blendMode = BlendMode.Screen
                    )
                }

                drawContent()
                // Beautiful inner reflection layer
                drawRect(
                    brush = com.example.ui.theme.LiquidSheenGoldBrush,
                    blendMode = BlendMode.Hardlight,
                    alpha = 0.15f
                )
                // Additional refraction
                drawRect(
                    brush = com.example.ui.theme.AsgaardGoldBrush,
                    blendMode = BlendMode.Screen,
                    alpha = 0.05f
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
    shape: Shape = androidx.compose.foundation.shape.CutCornerShape(2.dp)
) {
    val interactionSource = androidx.compose.runtime.remember { androidx.compose.foundation.interaction.MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    val isHovered by interactionSource.collectIsHoveredAsState()
    
    val scale by androidx.compose.animation.core.animateFloatAsState(
        targetValue = if (isPressed) 0.95f else if (isHovered) 1.05f else 1f,
        animationSpec = androidx.compose.animation.core.spring(
            dampingRatio = androidx.compose.animation.core.Spring.DampingRatioMediumBouncy,
            stiffness = androidx.compose.animation.core.Spring.StiffnessLow
        ),
        label = "button_scale"
    )
    
    val sheenAlpha by androidx.compose.animation.core.animateFloatAsState(
        targetValue = if (isPressed) 0.8f else if (isHovered) 0.6f else 0.3f,
        animationSpec = androidx.compose.animation.core.tween(durationMillis = 200),
        label = "sheen_alpha"
    )

    Box(
        modifier = modifier
            .poppingInteractiveButton(baseColor = baseColor, shape = shape)
            .clickable(
                interactionSource = interactionSource,
                indication = null, // Custom visual feedback through sheen
                onClick = onClick
            ),
        contentAlignment = Alignment.Center
    ) {
        // The vertical shiny glass sheen layer matching baseColor
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(getGlassReflectionBrush(baseColor))
                .drawWithCache {
                    onDrawWithContent {
                        drawContent()
                        drawRect(
                            brush = com.example.ui.theme.AsgaardGoldBrush,
                            blendMode = BlendMode.Overlay,
                            alpha = sheenAlpha
                        )
                    }
                }
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

/**
 * Utility class (Modifier) for 'gold-flake-border' implementing a precise 1.15pt border
 * with ultra max polished linear-gradient gold sheen in ultra max high fidelity.
 * Includes padding so the neon/gold colors do not bleed into an illegible visual block.
 */
fun Modifier.goldFlakeBorder(
    shape: Shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp)
): Modifier {
    return this
        .drawWithCache {
            onDrawWithContent {
                drawContent()
                // Inner glow subtle border to maintain contrast
                drawRoundRect(
                    brush = com.example.ui.theme.LiquidSheenGoldBrush,
                    topLeft = androidx.compose.ui.geometry.Offset.Zero,
                    size = size,
                    cornerRadius = androidx.compose.ui.geometry.CornerRadius(12.dp.toPx(), 12.dp.toPx()),
                    style = androidx.compose.ui.graphics.drawscope.Stroke(width = 4.dp.toPx()),
                    alpha = 0.25f,
                    blendMode = BlendMode.Screen
                )
            }
        }
        .border(
            width = 1.15.dp,
            brush = com.example.ui.theme.AsgaardGoldBrush,
            shape = shape
        )
}

/**
 * Modifier to make any button, tab or card active container pop globally
 * with an ultra premium gold liquid scale and 3D glow aura feedback.
 */
fun Modifier.poppingInteractiveButton(
    baseColor: Color = Color(0xFFFFD700),
    shape: Shape = androidx.compose.foundation.shape.RoundedCornerShape(10.dp)
): Modifier = this.composed {
    val interactionSource = androidx.compose.runtime.remember { androidx.compose.foundation.interaction.MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    val isHovered by interactionSource.collectIsHoveredAsState()
    
    val scale by androidx.compose.animation.core.animateFloatAsState(
        targetValue = if (isPressed) 0.94f else if (isHovered) 1.05f else 1.0f,
        animationSpec = androidx.compose.animation.core.spring(
            dampingRatio = androidx.compose.animation.core.Spring.DampingRatioMediumBouncy,
            stiffness = androidx.compose.animation.core.Spring.StiffnessLow
        ),
        label = "global_btn_scale"
    )
    
    this
        .graphicsLayer {
            scaleX = scale
            scaleY = scale
        }
        .hoverable(interactionSource)
        .drawWithCache {
            onDrawWithContent {
                drawContent()
                // Glowing golden edge aura that pops globally
                drawRoundRect(
                    brush = com.example.ui.theme.AsgaardGoldBrush,
                    topLeft = androidx.compose.ui.geometry.Offset.Zero,
                    size = size,
                    cornerRadius = androidx.compose.ui.geometry.CornerRadius(10.dp.toPx(), 10.dp.toPx()),
                    style = androidx.compose.ui.graphics.drawscope.Stroke(width = 1.5.dp.toPx()),
                    alpha = if (isHovered) 0.95f else 0.5f,
                    blendMode = BlendMode.Screen
                )
                // Diagonal gold liquid reflection sheen
                drawRect(
                    brush = com.example.ui.theme.LiquidSheenGoldBrush,
                    blendMode = BlendMode.Overlay,
                    alpha = if (isHovered) 0.35f else 0.15f
                )
            }
        }
}

/**
 * High-fidelity 3D tilt-on-hover effect utilizing spring-animated graphicsLayer rotations.
 */
fun Modifier.pointerHover3DTilt(): Modifier = this.composed {
    var rawRotX by remember { mutableStateOf(0f) }
    var rawRotY by remember { mutableStateOf(0f) }
    val rotX by androidx.compose.animation.core.animateFloatAsState(rawRotX, label = "hover_tilt_x")
    val rotY by androidx.compose.animation.core.animateFloatAsState(rawRotY, label = "hover_tilt_y")

    this
        .pointerInput(Unit) {
            detectDragGestures(
                onDragStart = {},
                onDragEnd = { rawRotX = 0f; rawRotY = 0f },
                onDragCancel = { rawRotX = 0f; rawRotY = 0f },
                onDrag = { change, dragAmount ->
                    rawRotY = (rawRotY + dragAmount.x * 0.12f).coerceIn(-12f, 12f)
                    rawRotX = (rawRotX - dragAmount.y * 0.12f).coerceIn(-12f, 12f)
                }
            )
        }
        .pointerInput(Unit) {
            detectTapGestures(
                onPress = {
                    rawRotX = 4f
                    rawRotY = -4f
                    tryAwaitRelease()
                    rawRotX = 0f
                    rawRotY = 0f
                }
            )
        }
        .graphicsLayer {
            rotationX = rotX
            rotationY = rotY
            cameraDistance = 16f * density
        }
}
