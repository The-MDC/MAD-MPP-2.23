package com.example.ui.theme

import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.SolidColor
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

// Dynamic design token specifications for themes
val ultraDarkCosmicSlateSpec = GambitThemeSpecs(
    bgDeep = Color(0xFF030303),     // CosmicBlack
    bgCard = Color(0xFF0C0C0C),     // SurfaceDark
    bgPanel = Color(0xFF0C0C0C),    // SurfaceDark
    bgOverlay = Color(0xFF030303).copy(alpha = 0.95f),
    brandPrimary = Color(0xFFEAB308), // AmberAccent
    brandSecondary = Color(0xFF06B6D4), // CyanMetric
    brandAccent = Color(0xFFEC4899), // CyberPink
    textPrimary = Color(0xFFF5F5F5), // TextLight
    textSecondary = Color(0xFF737373), // TextMuted
    borderBrush = SolidColor(Color(0xFF262626)), // BorderNeutral
    borderWidth = 1.dp,
    brushedMetal = SolidColor(Color(0xFF0C0C0C)),
    isPopArt = false
)

val neonHighContrastSpec = GambitThemeSpecs(
    bgDeep = Color.Black,
    bgCard = Color(0xFF050508),
    bgPanel = Color(0xFF090910),
    bgOverlay = Color.Black.copy(alpha = 0.95f),
    brandPrimary = Color(0xFFEC4899), // CyberPink
    brandSecondary = Color(0xFF22D3EE), // NeonCyanTheme
    brandAccent = Color(0xFF22D3EE),
    textPrimary = Color.White,
    textSecondary = Color(0xFF22D3EE),
    borderBrush = SolidColor(Color(0xFF22D3EE)), // NeonCyanTheme
    borderWidth = 1.dp,
    brushedMetal = SolidColor(Color(0xFF050508)),
    isPopArt = true
)

val borgGreenSpec = GambitThemeSpecs(
    bgDeep = Color(0xFF020502),
    bgCard = Color(0xFF050F05),
    bgPanel = Color(0xFF071407),
    bgOverlay = Color(0xFF020502).copy(alpha = 0.95f),
    brandPrimary = Color(0xFF39FF14), // Neon Green
    brandSecondary = Color(0xFF00FF00),
    brandAccent = Color(0xFF10B981),
    textPrimary = Color.White,
    textSecondary = Color(0xFF00FF00),
    borderBrush = SolidColor(Color(0xFF00FF00)),
    borderWidth = 1.dp,
    brushedMetal = SolidColor(Color(0xFF050F05)),
    isPopArt = false
)

val NeonGridBrush = SolidColor(Color.Transparent)

@Composable
fun ProvideGambitTheme(
    themeStyle: ThemeStyle,
    content: @Composable () -> Unit
) {
    val targetSpecs = when (themeStyle) {
        ThemeStyle.BORG_GREEN -> borgGreenSpec
        ThemeStyle.SHABBY_CHIC_RETRO -> neonHighContrastSpec
        ThemeStyle.LUX_MAT_PLASMA -> ultraDarkCosmicSlateSpec
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

