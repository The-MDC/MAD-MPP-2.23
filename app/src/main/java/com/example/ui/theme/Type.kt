package com.example.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.googlefonts.Font
import androidx.compose.ui.text.googlefonts.GoogleFont
import androidx.compose.ui.unit.sp
import com.example.R

val provider = GoogleFont.Provider(
    providerAuthority = "com.google.android.gms.fonts",
    providerPackage = "com.google.android.gms",
    certificates = R.array.com_google_android_gms_fonts_certs
)

// ── Brand / MAD Gambit font families (from main) ──────────────────────────
val AllertaStencilFont = GoogleFont("Allerta Stencil")
val AllertaStencilFamily = FontFamily(
    Font(googleFont = AllertaStencilFont, fontProvider = provider)
)

val ArialNarrowFont = GoogleFont("Barlow Condensed") // Closest Google Font to Arial Narrow
val ArialNarrowFamily = FontFamily(
    Font(googleFont = ArialNarrowFont, fontProvider = provider)
)

val ArialFont = GoogleFont("Arimo") // Excellent direct Google Font clone of Arial
val ArialFamily = FontFamily(
    Font(googleFont = ArialFont, fontProvider = provider)
)

// ── Sleek tech families (from branch) ─────────────────────────────────────
val ComfortaaFont = GoogleFont("Inter") // Inter for sleek look
val ComfortaaFamily = FontFamily(
    Font(googleFont = ComfortaaFont, fontProvider = provider)
)

val OutfitFont = GoogleFont("Inter")
val OutfitFamily = FontFamily(
    Font(googleFont = OutfitFont, fontProvider = provider)
)

val ChakraPetchFont = GoogleFont("Space Grotesk") // Space Grotesk has that tech aesthetic
val ChakraPetchFamily = FontFamily(
    Font(googleFont = ChakraPetchFont, fontProvider = provider)
)

val Typography = Typography(
    displayLarge = TextStyle(
        fontFamily = AllertaStencilFamily,
        fontWeight = FontWeight.Black,
        fontSize = 36.sp,
        lineHeight = 42.sp,
        letterSpacing = (-1).sp
    ),
    headlineLarge = TextStyle(
        fontFamily = AllertaStencilFamily,
        fontWeight = FontWeight.Bold,
        fontSize = 28.sp,
        lineHeight = 36.sp,
        letterSpacing = (-0.5).sp
    ),
    headlineMedium = TextStyle(
        fontFamily = AllertaStencilFamily,
        fontWeight = FontWeight.Bold,
        fontSize = 22.sp,
        lineHeight = 28.sp,
        letterSpacing = (-0.25).sp
    ),
    titleLarge = TextStyle(
        fontFamily = AllertaStencilFamily,
        fontWeight = FontWeight.Bold,
        fontSize = 24.sp,
        lineHeight = 32.sp,
        letterSpacing = (-0.5).sp
    ),
    titleMedium = TextStyle(
        fontFamily = AllertaStencilFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 18.sp,
        lineHeight = 24.sp,
        letterSpacing = (-0.5).sp
    ),
    titleSmall = TextStyle(
        fontFamily = ArialNarrowFamily,
        fontWeight = FontWeight(600),
        fontSize = 13.sp,
        lineHeight = 18.sp,
        letterSpacing = 0.1.sp
    ),
    bodyLarge = TextStyle(
        fontFamily = ArialNarrowFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 24.sp,
        letterSpacing = 0.5.sp,
    ),
    bodyMedium = TextStyle(
        fontFamily = ArialNarrowFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = 0.25.sp,
    ),
    labelLarge = TextStyle(
        fontFamily = FontFamily.Monospace,
        fontWeight = FontWeight.Bold,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = 0.1.sp,
    ),
    labelMedium = TextStyle(
        fontFamily = FontFamily.Monospace,
        fontWeight = FontWeight.Bold,
        fontSize = 12.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.5.sp,
    ),
    labelSmall = TextStyle(
        fontFamily = FontFamily.Monospace,
        fontWeight = FontWeight.Bold,
        fontSize = 11.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.5.sp,
    )
)
