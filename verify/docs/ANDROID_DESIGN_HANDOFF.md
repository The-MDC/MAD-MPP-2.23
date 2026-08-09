# MAD GAMBIT • Android Design & Style Merge Handoff

This document provides complete architectural design tokens, visual styling specifications, and Jetpack Compose code references to merge the polished web aesthetic of **MAD GAMBIT** into the native Android application (`com.madgambit.app`).

---

## 1. Visual Theme & Color Palette

The web simulator operates on a dual-mode visual engine: **Ultra Dark (Cosmic Slate)** and **Neon High Contrast (Cyberpunk Cyber/Pink)**. Both modes emphasize deep blacks, high-contrast typography, and glowing telemetry indicators.

### Design Tokens (Color Palette)

| Token Name | Hex Value (Ultra Dark) | Hex Value (Neon High) | Usage Specification |
| :--- | :--- | :--- | :--- |
| `BackgroundPrimary` | `#030303` | `#000000` | Main activity & screen backgrounds |
| `SurfaceCard` | `#0a0a0a` / `#121212` | `#050508` | Cards, dialogue boxes, bento grid panels |
| `SurfaceBorder` | `#262626` (Neutral 800) | `#06b6d4` (Cyan 500) | Card boundaries, active input borders |
| `AccentPrimary` | `#eab308` (Amber 500) | `#ec4899` (Pink 500) | Primary CTA buttons, active tabs, highlights |
| `AccentSecondary`| `#06b6d4` (Cyan 500) | `#22d3ee` (Cyan 400) | Secondary telemetry metrics, drift lines |
| `TextPrimary` | `#f5f5f5` (Neutral 100) | `#ffffff` | Primary screen headings and active values |
| `TextSecondary` | `#737373` (Neutral 500) | `#67e8f9` (Cyan 200) | Subheadings, descriptions, axis labels |
| `StatusSuccess` | `#22c55e` (Emerald 500)| `#4ade80` (Emerald 400)| Storage mounted, valid profile ingestion |
| `StatusError` | `#ef4444` (Red 500) | `#f43f5e` (Rose 500) | Syntax rejection, invalid stake warnings |

---

## 2. Typography & Hierarchy

The application pairs technical monospaced telemetry fonts with clean geometric sans-serif display headers.

### Font Specifications
* **Display & Headers**: *Space Grotesk* or *Outfit* (Android fallback: `FontFamily.SansSerif` with `FontWeight.Bold` and tight letter spacing `-0.5.sp`).
* **Telemetry & Math Formulas**: *JetBrains Mono* or *Fira Code* (Android fallback: `FontFamily.Monospace`).

### Type Scale
* **Header Title**: `24.sp` / `FontWeight.Bold` / Tracking `-0.5.sp`
* **Section Subtitle**: `14.sp` / `FontWeight.SemiBold` / Tracking `0.2.sp`
* **Telemetry Badge**: `10.sp` / `FontFamily.Monospace` / Uppercase / Tracking `1.5.sp`
* **Terminal Logs**: `11.sp` / `FontFamily.Monospace` / Line height `16.sp`

---

## 3. Jetpack Compose Theme Implementation

Below is the drop-in Jetpack Compose implementation for `MadGambitTheme.kt` to merge these styles directly into your native Android codebase.

```kotlin
package com.madgambit.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
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

---

## 4. Mathematical Drift Calibration Engine

When implementing the `SimulatorScreen` or `ConvictionChart` in Android (using libraries like *Vico* or *MPAndroidChart*), use the following continuous temporal decay mathematical formula:

$$\text{Decay}(t) = e^{-\alpha \cdot t}$$

$$\text{Growth}(t) = 1 - e^{-\alpha \cdot t}$$

### Kotlin Mathematical Utility

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

---

## 5. Merging Checklist for Android Engineers

1. [ ] **Adopt Color Schemes**: Replace existing `Color.kt` and `Theme.kt` with `MadGambitTheme.kt` specifications.
2. [ ] **Update Cards & Panels**: Apply `Modifier.border(1.dp, BorderNeutral, RoundedCornerShape(16.dp))` to all `Card` components with zero external drop shadows.
3. [ ] **Monospace Telemetry Badges**: Ensure all status headers (e.g., `STORAGE MOUNTED`, `INTENT ROUTED`) utilize `FontFamily.Monospace` with uppercase formatting.
4. [ ] **Persistent Settings**: Mirror web localStorage behavior using `androidx.datastore.preferences` to persist `"mad_simulation_theme"` and `"mad_simulation_resets"`.
