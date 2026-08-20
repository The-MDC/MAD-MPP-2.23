package com.example.ui.theme

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

// Color Tokens
val CosmicBlack = Color(0xFF030303)
val SurfaceDark = Color(0xFF0C0C0C)
val BorderNeutral = Color(0xFF262626)
val AmberAccent = Color(0xFFEAB308)
val CyanMetric = Color(0xFF06B6D4)
val CyberPink = Color(0xFFEC4899)
val NeonCyanTheme = Color(0xFF22D3EE)
val TextLight = Color(0xFFF5F5F5)
val TextMuted = Color(0xFF737373)

private val UltraDarkColorScheme = darkColorScheme(
    primary = AmberAccent,
    secondary = CyanMetric,
    background = CosmicBlack,
    surface = SurfaceDark,
    onPrimary = Color.Black,
    onBackground = TextLight,
    onSurface = TextLight,
    outline = BorderNeutral
)

private val NeonHighContrastColorScheme = darkColorScheme(
    primary = CyberPink,
    secondary = NeonCyanTheme,
    background = Color.Black,
    surface = Color(0xFF050508),
    onPrimary = Color.White,
    onBackground = Color.White,
    onSurface = NeonCyanTheme,
    outline = NeonCyanTheme
)

val MadTypography = Typography(
    headlineLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Bold,
        fontSize = 24.sp,
        letterSpacing = (-0.5).sp
    ),
    titleMedium = TextStyle(
        fontFamily = FontFamily.Monospace,
        fontWeight = FontWeight.Bold,
        fontSize = 12.sp,
        letterSpacing = 1.5.sp
    ),
    bodySmall = TextStyle(
        fontFamily = FontFamily.Monospace,
        fontSize = 11.sp,
        lineHeight = 16.sp,
        color = TextMuted
    )
)

@Composable
fun MadGambitTheme(
    isNeonMode: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = if (isNeonMode) NeonHighContrastColorScheme else UltraDarkColorScheme
    MaterialTheme(
        colorScheme = colorScheme,
        typography = MadTypography,
        content = content
    )
}
