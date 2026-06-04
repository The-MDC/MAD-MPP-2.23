package com.example.ui.theme

import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.unit.dp

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

// 1. Borg Green (Dark and ambient green and gunmetal)
val themeBorgGreen = GambitThemeSpecs(
    bgDeep = Color(0xFF050806), 
    bgCard = Color(0xFF0A100C),
    bgPanel = Color(0xFF0E1612),
    bgOverlay = Color(0xF2050806),
    brandPrimary = Color(0xFF39FF14), // Borg green
    brandSecondary = Color(0xFF2E8B57), // ambient green
    brandAccent = Color(0xFF536878), // Gunmetal
    textPrimary = Color(0xFFE8F5E9),
    textSecondary = Color(0xFF678370),
    borderBrush = Brush.linearGradient(listOf(Color(0xFF39FF14).copy(alpha=0.5f), Color.Transparent)),
    brushedMetal = Brush.linearGradient(listOf(Color(0xFF16211A), Color(0xFF0C140F), Color(0xFF23362A), Color(0xFF0C140F))), // Darkened with dark green
    isPopArt = false
)

// 2. Shabby Chic Retro Neon (High end luxury shabby chic retro neon on gradient black metals)
val themeShabbyChicRetro = GambitThemeSpecs(
    bgDeep = Color(0xFF0F0F11),
    bgCard = Color(0xFF141416),
    bgPanel = Color(0xFF1A1A1E),
    bgOverlay = Color(0xF20F0F11),
    brandPrimary = Color(0xFF00D9FF),
    brandSecondary = Color(0xFFFF2D78),
    brandAccent = Color(0xFF9D4EDD),
    textPrimary = Color(0xFFF5F5F5),
    textSecondary = Color(0xFF888890),
    borderBrush = Brush.linearGradient(listOf(Color(0xFF00D9FF).copy(alpha=0.5f), Color(0xFFFF2D78).copy(alpha=0.5f))),
    brushedMetal = Brush.linearGradient(listOf(Color(0xFF2A2A2E), Color(0xFF111113), Color(0xFF222224), Color(0xFF0C0C0F), Color(0xFF141416))),
    isPopArt = false
)

// 3. Lux Mat Plasma (Blacker than black, ultra-max super fidelity gold flake sheen borders, thick gold neon)
val themeLuxMatPlasma = GambitThemeSpecs(
    bgDeep = Color(0xFF000000), // Blacker than black
    bgCard = Color(0xFF020202), // 
    bgPanel = Color(0xFF050505),//
    bgOverlay = Color(0xF2000000),
    brandPrimary = Color(0xFFFFE81A), // Brighter thick gold neon
    brandSecondary = Color(0xFFFFD700),
    brandAccent = Color(0xFFF1C40F),
    textPrimary = Color(0xFFFFFFFF),
    textSecondary = Color(0xFFB0B0B0),
    // ultra-max super fidelity gold flake sheen gradient
    borderBrush = Brush.linearGradient(
        colors = listOf(
            Color(0xFFFFDF00),
            Color(0xFFD4AF37),
            Color(0xFFFFFDDD),
            Color(0xFFC5B358),
            Color(0xFFCFB53B),
            Color(0xFFFFDF00)
        )
    ),
    borderWidth = 1.dp,
    brushedMetal = Brush.linearGradient(listOf(Color(0xFF0F0F0F), Color(0xFF000000), Color(0xFF050505))),
    isPopArt = false
)

val NeonGridBrush = Brush.linearGradient(listOf(Color(0xFF00FFFF).copy(alpha=0.2f), Color(0xFFFF00FF).copy(alpha=0.2f)))

@Composable
fun ProvideGambitTheme(
    themeStyle: ThemeStyle,
    content: @Composable () -> Unit
) {
    val themeSpecs = when (themeStyle) {
        ThemeStyle.BORG_GREEN -> themeBorgGreen
        ThemeStyle.SHABBY_CHIC_RETRO -> themeShabbyChicRetro
        ThemeStyle.LUX_MAT_PLASMA -> themeLuxMatPlasma
    }
    
    CompositionLocalProvider(
        LocalGambitTheme provides themeSpecs,
        content = content
    )
}
