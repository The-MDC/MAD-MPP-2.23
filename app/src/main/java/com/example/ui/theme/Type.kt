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

// Set of Material typography styles to start with
val Typography =
  Typography(
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
    labelMedium = TextStyle(
        fontFamily = FontFamily.Monospace,
        fontWeight = FontWeight.SemiBold,
        fontSize = 12.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.5.sp,
    )
  )


