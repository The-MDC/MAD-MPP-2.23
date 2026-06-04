package com.example.ui.theme

import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

val DarkBg = Color(0xFF000000)
val DarkHeader = Color(0xFF080808)

// Brand Core
val BrandGold = Color(0xFFFFD700)
val BrandGoldDark = Color(0xFFB8860B)
val BrandGoldGlow = Color(0x3BFFD700) // Lowered alpha
val BrandCrimson = Color(0xFFDC143C)
val BrandEggwhite = Color(0xFFF5F0E8)

// Neon Palette
val NeonCyan = Color(0xFF00D9FF)
val NeonCyanDim = Color(0x1000D9FF) // Lowered alpha, reduced by 40%
val NeonMagenta = Color(0xFFFF2D78)
val NeonPurple = Color(0xFF9D4EDD)
val NeonPurpleDim = Color(0x1B9D4EDD) // Lowered alpha
val NeonGreen = Color(0xFF39FF14)

// Backgrounds
val BgDeep = Color(0xFF000000)
val BgCard = Color(0xFF141416)
val BgPanel = Color(0xFF16161A)
val BgOverlay = Color(0xDF000000)

// Rarity Colors
val RarityCommon = Color(0xFF8A9BB5)
val RarityUncommon = Color(0xFF4CAF50)
val RarityRare = Color(0xFF2196F3)
val RarityEpic = Color(0xFF9C27B0)
val RarityLegendary = Color(0xFFFFD700)
val RarityGolden = Color(0xFFFF6B35)
val RarityMythic = Color(0xFFFF2D78)

// Existing colors (aliased for compatibility if needed, but better to just use new ones where applicable)
val NeonPink = NeonMagenta
val GoldGlow = BrandGold
val ElegantPurple = NeonPurple
val ChaosRed = BrandCrimson
val SurfaceGray = BgCard
val BorderGlow = Color(0xFF6B21A8)

val GoldFlakeBrush = Brush.linearGradient(
    colors = listOf(
        Color(0xFFFFDF00),
        Color(0xFFD4AF37),
        Color(0xFFFFFDDD),
        Color(0xFFC5B358),
        Color(0xFFCFB53B),
        Color(0xFFFFDF00)
    )
)

val IntenseGoldFlakeBrush = Brush.linearGradient(
    colors = listOf(
        Color(0xFFFFDF00),
        Color(0xFFD4AF37),
        Color(0xFFFFFDDD),
        Color(0xFFC5B358),
        Color(0xFFCFB53B),
        Color(0xFFFFDF00)
    )
)

val SubtleGoldGlowBrush = Brush.radialGradient(
    colors = listOf(
        BrandGold.copy(alpha = 0.8f),
        BrandGold.copy(alpha = 0.2f),
        Color.Transparent
    )
)

val GlowBlue = NeonCyan
val GlowWhite = BrandEggwhite
