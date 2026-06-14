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

// 2. Neon Void Gambit (Striking neon cyan and neon fuchsia dual frame with deep royal velvet purple space)
val themeShabbyChicRetro = GambitThemeSpecs(
    bgDeep = Color(0xFF040209), // Ultimate dark velvet
    bgCard = Color(0xFF0A0514),  // Deep velvet card accent
    bgPanel = Color(0xFF120822),
    bgOverlay = Color(0xEB040209),
    brandPrimary = Color(0xFF00F0FF), // Ultra-glowing Cyan (Prediction Blue)
    brandSecondary = Color(0xFFFF007F), // Ultra-glowing Fuchsia (Conviction Pink)
    brandAccent = Color(0xFFFFD700), // Highlight Gold
    textPrimary = Color(0xFFFFFDF0), // Gold-brushed white
    textSecondary = Color(0xFFAFA2C2),
    borderBrush = Brush.linearGradient(
        colors = listOf(
            Color(0xFF00F0FF), // Neon Cyan
            Color(0xFFFF007F), // Neon Pink
            Color(0xFFFFD700), // Tabloid Gold
            Color(0xFF8B00FF), // Neon Purple
            Color(0xFF00F0FF)  // Neon Cyan
        )
    ),
    borderWidth = 1.5.dp,
    brushedMetal = Brush.linearGradient(
        colors = listOf(
            Color(0xFF150A26), Color(0xFF06010D), Color(0xFF1B0F2E), Color(0xFF090312)
        )
    ),
    isPopArt = false
)

// 3. Lux Mat Plasma (Max-Ultra Luxury Gold Tabloid & Red Carpet Polish with dual neon highlights)
val themeLuxMatPlasma = GambitThemeSpecs(
    bgDeep = Color(0xFF030107), // Blackest velvet purple
    bgCard = Color(0xFF0D0616), // Dark wine burgundy card
    bgPanel = Color(0xFF150B22),
    bgOverlay = Color(0xF2030107),
    brandPrimary = Color(0xFFFFD700), // Pure Tabloid Gold
    brandSecondary = Color(0xFFFF007F), // Neon Pink
    brandAccent = Color(0xFF00F0FF), // Neon Cyan
    textPrimary = Color(0xFFFFFDF0), // Flawless gold-flake white
    textSecondary = Color(0xFFCBBACD), // Subdued elegance
    // Red carpet tabloid gold sheen border gradient
    borderBrush = Brush.linearGradient(
        colors = listOf(
            Color(0xFFFFD700), // Tabloid Gold
            Color(0xFFFF007F), // Glowing Pink Highlight
            Color(0xFFFFFDF0), // Pure Gold Sheen
            Color(0xFF00F0FF), // Glowing Cyan Highlight
            Color(0xFFB8860B), // Burnished Goldenrod
            Color(0xFFFFD700)  // Gold
        )
    ),
    borderWidth = 1.6.dp,
    brushedMetal = Brush.linearGradient(
        colors = listOf(
            Color(0xFF140727), Color(0xFF06010D), Color(0xFF1D0E35), Color(0xFF050109), Color(0xFF180A2E)
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
