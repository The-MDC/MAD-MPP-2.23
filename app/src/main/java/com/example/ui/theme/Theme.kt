package com.example.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val CyberTabloidDarkScheme = darkColorScheme(
    primary = NeonCyan,
    secondary = NeonPink,
    tertiary = GoldGlow,
    background = DarkBg,
    surface = SurfaceGray,
    onPrimary = DarkBg,
    onSecondary = DarkBg,
    onTertiary = DarkBg,
    onBackground = NeonCyan,
    onSurface = NeonCyan,
    error = ChaosRed
)

@Composable
fun MyApplicationTheme(
  // Force dark theme for premium vibes
  darkTheme: Boolean = true,
  // Disable dynamic color for strict UI fidelity
  dynamicColor: Boolean = false,
  content: @Composable () -> Unit,
) {
  MaterialTheme(colorScheme = CyberTabloidDarkScheme, typography = Typography, content = content)
}
