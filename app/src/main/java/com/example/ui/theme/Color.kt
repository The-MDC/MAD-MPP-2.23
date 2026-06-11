package com.example.ui.theme

import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

val DarkBg = Color(0xFF000000)
val DarkHeader = Color(0xFF050505)

// Brand Core - High Street Chic Luxury Golden Flake
val BrandGold = Color(0xFFD4AF37) // Metallic Gold
val BrandGoldDark = Color(0xFF996515)
val BrandGoldGlow = Color(0x3BD4AF37) // Lowered alpha
val BrandCrimson = Color(0xFF8B0000) // Deep dark red/crimson
val BrandEggwhite = Color(0xFFF0E6D2) // Gold flake off-white

// Neon Palette - Subtle neon accents
val NeonCyan = Color(0xFFE6E6FA) // Replaced with subtle neon lavender for cutting edge chic aesthetic
val NeonCyanDim = Color(0x10E6E6FA) 
val NeonMagenta = Color(0xFFC5B358) // Warm gold flake
val NeonPurple = Color(0xFF1A1A1A) // Extremely dark grey
val NeonPurpleDim = Color(0x1B1A1A1A) 
val NeonGreen = Color(0xFF00FF41) // Kept for the borg theme primarily, but subdued in base

// Backgrounds
val BgDeep = Color(0xFF000000)
val BgCard = Color(0xFF0A0A0A)
val BgPanel = Color(0xFF141210)
val BgOverlay = Color(0xDF000000)

// Rarity Colors
val RarityCommon = Color(0xFFB0B0B0)
val RarityUncommon = Color(0xFFE6E6FA)
val RarityRare = Color(0xFFC5B358)
val RarityEpic = Color(0xFFB8860B)
val RarityLegendary = Color(0xFFFFDF00)
val RarityGolden = Color(0xFFD4AF37)
val RarityMythic = Color(0xFFFFFFFF)

// Existing colors (aliased for compatibility if needed, but better to just use new ones where applicable)
val NeonPink = NeonMagenta
val GoldGlow = BrandGold
val ElegantPurple = NeonPurple
val ChaosRed = BrandCrimson
val SurfaceGray = BgCard
val BorderGlow = Color(0xFF6B21A8)

val GoldFlakeBrush = Brush.linearGradient(
    colors = listOf(
        Color(0xFFB8860B),
        Color(0xFFFFD700),
        Color(0xFFF8F3D4),
        Color(0xFFD4AF37),
        Color(0xFF996515),
        Color(0xFFFFDF00)
    )
)

val IntenseGoldFlakeBrush = Brush.linearGradient(
    colors = listOf(
        Color(0xFFB8860B),
        Color(0xFFFFD700),
        Color(0xFFF8F3D4),
        Color(0xFFD4AF37),
        Color(0xFF996515),
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
