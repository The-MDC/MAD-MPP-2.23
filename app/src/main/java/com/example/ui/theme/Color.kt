package com.example.ui.theme

import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

val DarkBg = Color(0xFF030107) // Deep velvet purple-black
val DarkHeader = Color(0xFF0A0214)

// Brand Core - High Street Chic Luxury Golden Flake
val BrandGold = Color(0xFFFFD700) // Highly polished Tabloid Gold
val BrandGoldDark = Color(0xFFB8860B) // Metallic Dark Goldenrod
val BrandGoldGlow = Color(0x60FFD700) // Lowered alpha with real gold tint
val BrandCrimson = Color(0xFFFF003C) // Vibrant Hot Red/Crimson
val BrandEggwhite = Color(0xFFFFFDF0) // High-contrast warm cream white

// Neon Palette - High Fidelity Neon Accents from the MAD Gambit images
val NeonCyan = Color(0xFF00F0FF) // Ultra-glowing neon cyan (Prediction blue)
val NeonCyanDim = Color(0x2500F0FF) 
val NeonMagenta = Color(0xFFFF007F) // Ultra-glowing neon pink-fuchsia (Conviction pink)
val NeonPurple = Color(0xFF8B00FF) // Glowing purple neon (Affliction purple)
val NeonPurpleDim = Color(0x258B00FF) 
val NeonGreen = Color(0xFF39FF14) // True hot neon green (Streak / Ticker positive percent)

// Backgrounds - Elegant Velvet Dark
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
