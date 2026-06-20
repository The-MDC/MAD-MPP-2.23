package com.example.ui.theme

import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

val DarkBg = Color(0xFF030107) // Deep velvet purple-black
val DarkHeader = Color(0xFF0A0214)

// Brand Core
val BrandGold = Color(0xFFFFD700)
val BrandGoldDark = Color(0xFFB8860B)
val BrandGoldGlow = Color(0x60FFD700)
val BrandCrimson = Color(0xFFFF003C)
val BrandEggwhite = Color(0xFFFFFDF0)

// Neon Palette
val NeonCyan = Color(0xFF00F0FF)
val NeonCyanDim = Color(0x2500F0FF)
val NeonMagenta = Color(0xFFFF007F)
val NeonPurple = Color(0xFF8B00FF)
val NeonPurpleDim = Color(0x258B00FF)
val NeonGreen = Color(0xFF39FF14)
val NeonPinkPure = Color(0xFFFF00FF) // Canonical embroidery spec: pure neon magenta-pink

// Backgrounds
val BgDeep = Color(0xFF030107)
val BgCard = Color(0xFF0D0616)
val BgPanel = Color(0xFF150B22)
val BgOverlay = Color(0xE6030107)

// Rarity Colors
val RarityCommon = Color(0xFFB0B0B0)
val RarityUncommon = Color(0xFFE6E6FA)
val RarityRare = Color(0xFFC5B358)
val RarityEpic = Color(0xFFB8860B)
val RarityLegendary = Color(0xFFFFDF00)
val RarityGolden = Color(0xFFD4AF37)
val RarityMythic = Color(0xFFFFFFFF)

// Aliases
val NeonPink = NeonMagenta
val GoldGlow = BrandGold
val ElegantPurple = NeonPurple
val ChaosRed = BrandCrimson
val SurfaceGray = BgCard
val BorderGlow = Color(0xFF6B21A8)

// Gold Brushes
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

// Rarity Tier Brushes — NFT card frame borders
val RarityCommonBrush = Brush.linearGradient(
    listOf(Color(0xFFB0B0B0), Color(0xFFD4D4D4), Color(0xFFB0B0B0))
)
val RarityUncommonBrush = Brush.linearGradient(
    listOf(Color(0xFFE6E6FA), Color(0xFF9B8EC4), Color(0xFFE6E6FA))
)
val RarityRareBrush = Brush.linearGradient(
    listOf(Color(0xFFC5B358), Color(0xFFFFE066), Color(0xFFC5B358))
)
val RarityEpicBrush = Brush.linearGradient(
    listOf(Color(0xFFB8860B), Color(0xFFFFD700), Color(0xFFF8F3D4), Color(0xFFB8860B))
)
val RarityLegendaryBrush = Brush.linearGradient(
    listOf(Color(0xFFFFDF00), Color(0xFFFFFFAA), Color(0xFFFFD700), Color(0xFFB8860B), Color(0xFFFFDF00))
)
val RarityGoldenBrush = Brush.linearGradient(
    listOf(Color(0xFFD4AF37), Color(0xFFFFD700), Color(0xFFF8F3D4), Color(0xFFFF8C00), Color(0xFFD4AF37))
)
val RarityMythicBrush = Brush.linearGradient(
    listOf(Color(0xFFFF00FF), Color(0xFFFFFFFF), Color(0xFF00F0FF), Color(0xFFFF007F), Color(0xFFFFFFFF))
)

// Chaos Meter — RPM gauge gradient: calm cyan → volatile red
val ChaosMeterBrush = Brush.horizontalGradient(
    listOf(Color(0xFF00F0FF), Color(0xFF39FF14), Color(0xFFFFD700), Color(0xFFFF8C00), Color(0xFFFF003C))
)

// Dopamine Slider — Blue Chip (0f/left) → Max Degen (1f/right)
val DopamineSliderBrush = Brush.horizontalGradient(
    listOf(Color(0xFF00F0FF), Color(0xFF8B00FF), Color(0xFFFF007F), Color(0xFFFF003C))
)

// Streak Fire — visual escalation for streak milestones 3→10+
val StreakBrush = Brush.linearGradient(
    listOf(Color(0xFFFFD700), Color(0xFFFF8C00), Color(0xFFFF003C))
)

val GlowBlue = NeonCyan
val GlowWhite = BrandEggwhite
