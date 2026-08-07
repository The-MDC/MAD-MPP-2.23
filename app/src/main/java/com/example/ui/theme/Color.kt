package com.example.ui.theme

import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor

// Deep Celestial Asgaard Theme
val DeepSpace = Color(0xFF0C0E1E) // Slightly lightened Deep Celestial space background for contrast
val DeepSpaceCard = Color(0xFF13162C)
val DeepSpacePanel = Color(0xFF191C36)

// Cyber Neon Blue & Cyan Accents (Replacing old yellow/gold)
val BrandIndigo = Color(0xFF00E5FF) // Cyber Neon Cyan Accent
val BrandPurple = Color(0xFF00B0FF) // Cyber Neon Blue Accent 
val BrandPink = Color(0xFFFF4B72)
val SoftPeriwinkle = Color(0xFFB0BEC5) // Silver/grey-blue subtle text

val DarkBg = DeepSpace
val DarkHeader = DeepSpace

// Legacy Aliases for backward compatibility - mapped to cyber-blue and neon-cyan
val BrandGold = Color(0xFFFFD700) 
val BrandGoldDark = Color(0xFFB8860B) 
val BrandGoldGlow = Color(0x60FFD700)
val BrandCrimson = BrandPink
val BrandEggwhite = Color(0xFFFFFFFF)

val NeonCyan = Color(0xFF00E5FF) // Pure Cyber Cyan
val NeonCyanDim = Color(0xFF00E5FF).copy(alpha = 0.2f)
val NeonMagenta = BrandPink
val NeonPurple = Color(0xFF7C4DFF) // Vibrant Purple
val NeonPurpleDim = Color(0xFF7C4DFF).copy(alpha = 0.2f)
val NeonGreen = Color(0xFF10B981)

val BgDeep = DeepSpace
val BgCard = DeepSpaceCard
val BgPanel = DeepSpacePanel
val BgOverlay = DeepSpace.copy(alpha = 0.9f)

val RarityCommon = SoftPeriwinkle
val RarityUncommon = BrandIndigo
val RarityRare = BrandPurple
val RarityEpic = BrandPink
val RarityLegendary = Color(0xFFFFD700)
val RarityGolden = Color(0xFFFFD700)
val RarityMythic = Color(0xFFFFFFFF)

val NeonPink = BrandPink
val GoldGlow = Color(0xFFFFD700)
val ElegantPurple = BrandPurple
val ChaosRed = BrandPink
val SurfaceGray = DeepSpaceCard
val BorderGlow = DeepSpacePanel

// Ultra max polished linear gradient gold sheen
val GoldFlakeBrush = Brush.linearGradient(
    colors = listOf(
        Color(0xFFB8860B),  // Dark Goldenrod
        Color(0xFFFFDF00),  // Golden Yellow
        Color(0xFFFFF8DC),  // Cornsilk / Bright gleam
        Color(0xFFFFD700),  // Pure Gold
        Color(0xFFDAA520),  // Goldenrod
        Color(0xFFB8860B)   // Dark Goldenrod
    )
)

val AsgaardGoldBrush = Brush.linearGradient(
    colors = listOf(
        Color(0xFFC59B27),
        Color(0xFFFFEA7C),
        Color(0xFFFFFFFF),
        Color(0xFFFFEA7C),
        Color(0xFFC59B27),
        Color(0xFF8B6508)
    )
)

val LiquidSheenGoldBrush = Brush.verticalGradient(
    colors = listOf(
        Color(0xFFFFEA7C).copy(alpha = 0.8f),
        Color(0xFFC59B27).copy(alpha = 0.3f),
        Color(0xFF8B6508).copy(alpha = 0.6f),
        Color(0xFFFFEA7C).copy(alpha = 0.9f)
    )
)

val IntenseGoldFlakeBrush = Brush.linearGradient(
    colors = listOf(
        Color(0xFFFFD700),
        Color(0xFFFFF8DC),
        Color(0xFFFFD700)
    )
)

val SubtleGoldGlowBrush = Brush.radialGradient(
    colors = listOf(
        Color(0xFFFFD700).copy(alpha = 0.5f),
        Color(0xFFFFD700).copy(alpha = 0.1f),
        Color.Transparent
    )
)

val GlowBlue = BrandIndigo
val GlowWhite = Color(0xFFFFFFFF)

