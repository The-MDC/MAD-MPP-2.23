package com.example.ui.theme

import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.unit.dp
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween

enum class ThemeStyle {
    BORG_GREEN,
    SHABBY_CHIC_RETRO,
    LUX_MAT_PLASMA
}

data class GambitThemeSpecs(
    val bgDeep: Color,
    val bgCard: Color,
    val bgPanel: Color,
    val bgOverlay: Color,
    
    val brandPrimary: Color,
    val brandSecondary: Color,
    val brandAccent: Color,
    
    val textPrimary: Color,
    val textSecondary: Color,
    
    val borderBrush: Brush,
    val borderWidth: androidx.compose.ui.unit.Dp = 1.dp,
    val brushedMetal: Brush,
    val isPopArt: Boolean = false
)

val LocalGambitTheme = staticCompositionLocalOf<GambitThemeSpecs> {
    error("No GambitTheme provided")
}

// 1. OV-BorgGreen (Stunning glassmorphism, glowing conviction green neon, black to green high end premium gradients from convictionmarkets.io)
val themeBorgGreen = GambitThemeSpecs(
    bgDeep = Color(0xFF000000), 
    bgCard = Color(0xFF030D05),
    bgPanel = Color(0xFF051708),
    bgOverlay = Color(0xF2000000),
    brandPrimary = Color(0xFF00FF41), // Conviction glowing neon green
    brandSecondary = Color(0xFF10B030), // Mid-level emerald
    brandAccent = Color(0xFF00FF88), // High-frequency cyber bright-green
    textPrimary = Color(0xFFF1FDF3),
    textSecondary = Color(0xFF8BA592),
    borderBrush = Brush.linearGradient(listOf(Color(0xFF00FF41).copy(alpha=0.9f), Color(0xFF10B030).copy(alpha=0.6f), Color(0xFF00FF88).copy(alpha=0.8f))),
    brushedMetal = Brush.linearGradient(
        colors = listOf(
            Color(0xFF051708), Color(0xFF030D05), Color(0xFF000000), Color(0xFF08260D), Color(0xFF030D05)
        )
    ), 
    isPopArt = false
)

// 2. Ultraviolet Void / Pastel Neon (Extremely dark purple background, pastel shades, top shelf gradients, ultramarine to purple to red neons)
val themeShabbyChicRetro = GambitThemeSpecs(
    bgDeep = Color(0xFF0A0210), // Extremely dark purple
    bgCard = Color(0xFF100318),
    bgPanel = Color(0xFF180524),
    bgOverlay = Color(0xF20A0210),
    brandPrimary = Color(0xFFE2B2FF), // Pastel purple
    brandSecondary = Color(0xFFFF9EBB), // Pastel pink
    brandAccent = Color(0xFF041EFF), // Ultramarine neon
    textPrimary = Color(0xFFF9F5FF),
    textSecondary = Color(0xFFB19DCE),
    borderBrush = Brush.linearGradient(
        colors = listOf(
            Color(0xFF041EFF), // Ultramarine
            Color(0xFF7A00FF), // Deep Purple
            Color(0xFFFF0055), // Red Neon
            Color(0xFFFF9EBB)  // Pastel Red/Pink
        )
    ),
    brushedMetal = Brush.linearGradient(
        colors = listOf(
            Color(0xFF1B072B), Color(0xFF0D0214), Color(0xFF220A38), Color(0xFF11031A)
        )
    ),
    isPopArt = false
)

// 3. Lux Mat Plasma (High street chic luxury golden flake, cutting edge subtle neon, MΛĐ Gambit aesthetic)
val themeLuxMatPlasma = GambitThemeSpecs(
    bgDeep = Color(0xFF000000), // Blacker than black
    bgCard = Color(0xFF050505), // 
    bgPanel = Color(0xFF0A0A0A),//
    bgOverlay = Color(0xF2000000),
    brandPrimary = Color(0xFFD4AF37), // Metallic Gold
    brandSecondary = Color(0xFFFFDF00), // Golden Yellow
    brandAccent = Color(0xFFE6E6FA), // Subtle neon lavender/complimentary luxury accent
    textPrimary = Color(0xFFF0E6D2), // Gold flake off-white
    textSecondary = Color(0xFF8B7E66),
    // ultra-max super fidelity gold flake sheen gradient
    borderBrush = Brush.linearGradient(
        colors = listOf(
            Color(0xFFB8860B), // Dark Goldenrod
            Color(0xFFFFD700), // Gold
            Color(0xFFF8F3D4), // Pale Gold Flake Shine
            Color(0xFFD4AF37), // Metallic Gold
            Color(0xFF996515), // Golden Brown
            Color(0xFFFFDF00)  // Golden Yellow
        )
    ),
    borderWidth = 1.2.dp,
    brushedMetal = Brush.linearGradient(
        colors = listOf(
            Color(0xFF1A1A1A), Color(0xFF000000), Color(0xFF141210), Color(0xFF050505), Color(0xFF0A0908)
        )
    ),
    isPopArt = false
)

val NeonGridBrush = Brush.linearGradient(listOf(Color(0xFF00FFFF).copy(alpha=0.2f), Color(0xFFFF00FF).copy(alpha=0.2f)))

@Composable
fun ProvideGambitTheme(
    themeStyle: ThemeStyle,
    content: @Composable () -> Unit
) {
    val targetSpecs = when (themeStyle) {
        ThemeStyle.BORG_GREEN -> themeBorgGreen
        ThemeStyle.SHABBY_CHIC_RETRO -> themeShabbyChicRetro
        ThemeStyle.LUX_MAT_PLASMA -> themeLuxMatPlasma
    }
    
    val duration = 650
    val spec = tween<Color>(durationMillis = duration)
    
    val bgDeep = animateColorAsState(targetValue = targetSpecs.bgDeep, animationSpec = spec, label = "bgDeep")
    val bgCard = animateColorAsState(targetValue = targetSpecs.bgCard, animationSpec = spec, label = "bgCard")
    val bgPanel = animateColorAsState(targetValue = targetSpecs.bgPanel, animationSpec = spec, label = "bgPanel")
    val bgOverlay = animateColorAsState(targetValue = targetSpecs.bgOverlay, animationSpec = spec, label = "bgOverlay")
    
    val brandPrimary = animateColorAsState(targetValue = targetSpecs.brandPrimary, animationSpec = spec, label = "brandPrimary")
    val brandSecondary = animateColorAsState(targetValue = targetSpecs.brandSecondary, animationSpec = spec, label = "brandSecondary")
    val brandAccent = animateColorAsState(targetValue = targetSpecs.brandAccent, animationSpec = spec, label = "brandAccent")
    
    val textPrimary = animateColorAsState(targetValue = targetSpecs.textPrimary, animationSpec = spec, label = "textPrimary")
    val textSecondary = animateColorAsState(targetValue = targetSpecs.textSecondary, animationSpec = spec, label = "textSecondary")
    
    val themeSpecs = GambitThemeSpecs(
        bgDeep = bgDeep.value,
        bgCard = bgCard.value,
        bgPanel = bgPanel.value,
        bgOverlay = bgOverlay.value,
        brandPrimary = brandPrimary.value,
        brandSecondary = brandSecondary.value,
        brandAccent = brandAccent.value,
        textPrimary = textPrimary.value,
        textSecondary = textSecondary.value,
        borderBrush = targetSpecs.borderBrush,
        borderWidth = targetSpecs.borderWidth,
        brushedMetal = targetSpecs.brushedMetal,
        isPopArt = targetSpecs.isPopArt
    )
    
    CompositionLocalProvider(
        LocalGambitTheme provides themeSpecs,
        content = content
    )
}
