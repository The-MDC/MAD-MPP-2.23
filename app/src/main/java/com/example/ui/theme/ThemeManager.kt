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
    LUX_MAT_PLASMA,
    MAD_UPSHOT
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
    val isPopArt: Boolean = false,

    // Semantic state colors — centralized for all components
    val successColor: Color = Color(0xFF39FF14),
    val warningColor: Color = Color(0xFFFFD700),
    val streakColor: Color  = Color(0xFFFF8C00),

    // NFT card frame brush — per-theme override
    val cardBorderBrush: Brush = GoldFlakeBrush,
)

val LocalGambitTheme = staticCompositionLocalOf<GambitThemeSpecs> {
    error("No GambitTheme provided")
}

// 1. OV-BorgGreen — glassmorphism, glowing conviction green, convictionmarkets.io aesthetic
val themeBorgGreen = GambitThemeSpecs(
    bgDeep    = Color(0xFF000000),
    bgCard    = Color(0xFF030D05),
    bgPanel   = Color(0xFF051708),
    bgOverlay = Color(0xF2000000),
    brandPrimary   = Color(0xFF00FF41),
    brandSecondary = Color(0xFF10B030),
    brandAccent    = Color(0xFF00FF88),
    textPrimary    = Color(0xFFF1FDF3),
    textSecondary  = Color(0xFF8BA592),
    borderBrush    = Brush.linearGradient(
        listOf(Color(0xFF00FF41).copy(alpha = 0.9f), Color(0xFF10B030).copy(alpha = 0.6f), Color(0xFF00FF88).copy(alpha = 0.8f))
    ),
    brushedMetal   = Brush.linearGradient(
        listOf(Color(0xFF051708), Color(0xFF030D05), Color(0xFF000000), Color(0xFF08260D), Color(0xFF030D05))
    ),
    successColor    = Color(0xFF00FF41),
    warningColor    = Color(0xFFFFD700),
    streakColor     = Color(0xFF00FF88),
    cardBorderBrush = Brush.linearGradient(listOf(Color(0xFF00FF41), Color(0xFF39FF14), Color(0xFF00FF88))),
    isPopArt        = false
)

// 2. Neon Void Gambit (Shabby Chic Retro) — cyan + fuchsia dual-neon on deep velvet
val themeShabbyChicRetro = GambitThemeSpecs(
    bgDeep    = Color(0xFF040209),
    bgCard    = Color(0xFF0A0514),
    bgPanel   = Color(0xFF120822),
    bgOverlay = Color(0xEB040209),
    brandPrimary   = Color(0xFF00F0FF),
    brandSecondary = Color(0xFFFF007F),
    brandAccent    = Color(0xFFFFD700),
    textPrimary    = Color(0xFFFFFDF0),
    textSecondary  = Color(0xFFAFA2C2),
    borderBrush    = Brush.linearGradient(
        listOf(Color(0xFF00F0FF), Color(0xFFFF007F), Color(0xFFFFD700), Color(0xFF8B00FF), Color(0xFF00F0FF))
    ),
    borderWidth    = 1.5.dp,
    brushedMetal   = Brush.linearGradient(
        listOf(Color(0xFF150A26), Color(0xFF06010D), Color(0xFF1B0F2E), Color(0xFF090312))
    ),
    successColor    = Color(0xFF39FF14),
    warningColor    = Color(0xFFFFD700),
    streakColor     = Color(0xFFFF8C00),
    cardBorderBrush = GoldFlakeBrush,
    isPopArt        = false
)

// 3. Lux Mat Plasma — gold tabloid + red carpet polish with neon dual highlights
val themeLuxMatPlasma = GambitThemeSpecs(
    bgDeep    = Color(0xFF030107),
    bgCard    = Color(0xFF0D0616),
    bgPanel   = Color(0xFF150B22),
    bgOverlay = Color(0xF2030107),
    brandPrimary   = Color(0xFFFFD700),
    brandSecondary = Color(0xFFFF007F),
    brandAccent    = Color(0xFF00F0FF),
    textPrimary    = Color(0xFFFFFDF0),
    textSecondary  = Color(0xFFCBBACD),
    borderBrush    = Brush.linearGradient(
        listOf(Color(0xFFFFD700), Color(0xFFFF007F), Color(0xFFFFFDF0), Color(0xFF00F0FF), Color(0xFFB8860B), Color(0xFFFFD700))
    ),
    borderWidth    = 1.6.dp,
    brushedMetal   = Brush.linearGradient(
        listOf(Color(0xFF140727), Color(0xFF06010D), Color(0xFF1D0E35), Color(0xFF050109), Color(0xFF180A2E))
    ),
    successColor    = Color(0xFF39FF14),
    warningColor    = Color(0xFFFFD700),
    streakColor     = Color(0xFFFF8C00),
    cardBorderBrush = IntenseGoldFlakeBrush,
    isPopArt        = false
)

// 4. MAD Upshot — classic black/cyan/gold mobile prediction UI (original app aesthetic)
val themeMADUpshot = GambitThemeSpecs(
    bgDeep    = Color(0xFF000000),
    bgCard    = Color(0xFF0A0A0A),
    bgPanel   = Color(0xFF111111),
    bgOverlay = Color(0xF0000000),
    brandPrimary   = Color(0xFF00F0FF),
    brandSecondary = Color(0xFFFFD700),
    brandAccent    = Color(0xFFFF007F),
    textPrimary    = Color(0xFFFFFFFF),
    textSecondary  = Color(0xFFAAAAAA),
    borderBrush    = Brush.linearGradient(
        listOf(Color(0xFF00F0FF).copy(alpha = 0.6f), Color(0xFFFFD700).copy(alpha = 0.4f))
    ),
    borderWidth    = 1.dp,
    brushedMetal   = Brush.linearGradient(
        listOf(Color(0xFF111111), Color(0xFF000000), Color(0xFF0D0D0D))
    ),
    successColor    = Color(0xFF39FF14),
    warningColor    = Color(0xFFFFD700),
    streakColor     = Color(0xFFFF8C00),
    cardBorderBrush = Brush.linearGradient(listOf(Color(0xFF00F0FF), Color(0xFFFFD700))),
    isPopArt        = false
)

// Minimalist High-Contrast Dark Indigo Theme
val minimalistThemeSpec = GambitThemeSpecs(
    bgDeep    = DeepSpace,
    bgCard    = DeepSpaceCard,
    bgPanel   = DeepSpacePanel,
    bgOverlay = DeepSpace.copy(alpha = 0.95f),
    brandPrimary   = BrandIndigo,
    brandSecondary = BrandPurple,
    brandAccent    = BrandPink,
    textPrimary    = Color(0xFFFFFFFF),
    textSecondary  = SoftPeriwinkle,
    borderBrush    = SolidColor(Color(0xFFFFD700)),
    borderWidth    = 1.dp,
    brushedMetal   = SolidColor(DeepSpaceCard),
    isPopArt       = false
)

val NeonGridBrush = Brush.linearGradient(
    listOf(Color(0xFF00FFFF).copy(alpha = 0.2f), Color(0xFFFF00FF).copy(alpha = 0.2f))
)

@Composable
fun ProvideGambitTheme(
    themeStyle: ThemeStyle,
    content: @Composable () -> Unit
) {
    val targetSpecs = when (themeStyle) {
        ThemeStyle.BORG_GREEN        -> themeBorgGreen
        ThemeStyle.SHABBY_CHIC_RETRO -> themeShabbyChicRetro
        ThemeStyle.LUX_MAT_PLASMA    -> themeLuxMatPlasma
        ThemeStyle.MAD_UPSHOT        -> themeMADUpshot
    }

    val duration = 650
    val spec = tween<Color>(durationMillis = duration)

    val bgDeep         = animateColorAsState(targetSpecs.bgDeep,         spec, label = "bgDeep")
    val bgCard         = animateColorAsState(targetSpecs.bgCard,         spec, label = "bgCard")
    val bgPanel        = animateColorAsState(targetSpecs.bgPanel,        spec, label = "bgPanel")
    val bgOverlay      = animateColorAsState(targetSpecs.bgOverlay,      spec, label = "bgOverlay")
    val brandPrimary   = animateColorAsState(targetSpecs.brandPrimary,   spec, label = "brandPrimary")
    val brandSecondary = animateColorAsState(targetSpecs.brandSecondary, spec, label = "brandSecondary")
    val brandAccent    = animateColorAsState(targetSpecs.brandAccent,    spec, label = "brandAccent")
    val textPrimary    = animateColorAsState(targetSpecs.textPrimary,    spec, label = "textPrimary")
    val textSecondary  = animateColorAsState(targetSpecs.textSecondary,  spec, label = "textSecondary")
    val successColor   = animateColorAsState(targetSpecs.successColor,   spec, label = "successColor")
    val warningColor   = animateColorAsState(targetSpecs.warningColor,   spec, label = "warningColor")
    val streakColor    = animateColorAsState(targetSpecs.streakColor,    spec, label = "streakColor")

    val themeSpecs = GambitThemeSpecs(
        bgDeep          = bgDeep.value,
        bgCard          = bgCard.value,
        bgPanel         = bgPanel.value,
        bgOverlay       = bgOverlay.value,
        brandPrimary    = brandPrimary.value,
        brandSecondary  = brandSecondary.value,
        brandAccent     = brandAccent.value,
        textPrimary     = textPrimary.value,
        textSecondary   = textSecondary.value,
        borderBrush     = targetSpecs.borderBrush,
        borderWidth     = targetSpecs.borderWidth,
        brushedMetal    = targetSpecs.brushedMetal,
        isPopArt        = targetSpecs.isPopArt,
        successColor    = successColor.value,
        warningColor    = warningColor.value,
        streakColor     = streakColor.value,
        cardBorderBrush = targetSpecs.cardBorderBrush,
    )

    CompositionLocalProvider(
        LocalGambitTheme provides themeSpecs,
        content = content
    )
}
