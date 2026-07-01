# MAD GAMBIT • Native Android UI/UX & Style Merge Prompt

> **Instructions for User:** Copy and paste the markdown prompt below into your new AI Studio chat, Cursor, or Android Studio Coding Agent to upgrade your Android App (`com.madgambit.app`) with the MAD GAMBIT Web Simulator's aesthetic and conviction pricing engine.

***

# [COPY AND PASTE THE PROMPT BELOW INTO YOUR ANDROID CHAT]

You are an expert Android Jetpack Compose and Kotlin developer. Your task is to merge the polished visual aesthetic, typography, design tokens, and conviction math engine from the **MAD GAMBIT Web Simulator** into this Android application (`com.madgambit.app`).

Please implement the following architectural improvements step-by-step:

## 1. Visual Theme & Color Scheme (`MadGambitTheme.kt`)
Replace or upgrade our native color theme with this dual-mode palette (Ultra Dark Cosmic Slate & Cyberpunk Neon High Contrast). 

```kotlin
package com.madgambit.app.ui.theme

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
val NeonCyan = Color(0xFF22D3EE)
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
    secondary = NeonCyan,
    background = Color.Black,
    surface = Color(0xFF050508),
    onPrimary = Color.White,
    onBackground = Color.White,
    onSurface = NeonCyan,
    outline = NeonCyan
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
```

## 2. Component Styling Rules (No Shadow Card Discipline)
Update all surface containers, dialogs, and navigation drawers to adhere to the MAD GAMBIT structural layout:
- **Zero Drop Shadows**: Do not use elevation or drop shadows on cards.
- **Surgical Borders**: Apply `Modifier.border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(16.dp))`.
- **Monospace Badges**: All telemetry labels, section headers, and status badges must use `FontFamily.Monospace`, uppercase tracking (`1.5.sp`), and crisp high-contrast colors (Cyan or Amber).

## 3. Mathematical Conviction Engine (`ConvictionMathEngine.kt`)
Implement the continuous stochastic temporal decay curves ($e^{-\alpha \cdot t}$) used in the web chart visualizer:

```kotlin
package com.madgambit.app.math

import kotlin.math.exp

data class DriftPoint(
    val epoch: Int,
    val decayRatio: Double,
    val growthRatio: Double,
    val driftFactorPercent: Double
)

object ConvictionMathEngine {
    fun calculateDriftCurve(alpha: Double, epochs: Int): List<DriftPoint> {
        return (0..epochs).map { t ->
            val decay = exp(-alpha * t)
            val growth = 1.0 - decay
            DriftPoint(
                epoch = t,
                decayRatio = decay,
                growthRatio = growth,
                driftFactorPercent = decay * 100.0
            )
        }
    }
}
```

## 4. Activity Intent Routing Telemetry
Ensure seamless native transitions between core workflow states:
- `SimulatorActivity`: Live conviction pricing matrix & slider controls.
- `GambitsActivity`: Server profile selector & active staking threshold config.
- `IngestActivity`: JSON profile validator & schema ingestion sandbox.
- `BlueprintActivity`: System architecture diagram & token elasticity charts.

Please start by reviewing our project manifest and applying `MadGambitTheme` to our primary navigation graph!
