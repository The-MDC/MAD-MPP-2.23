package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.engine.PersonaConfig
import com.example.ui.theme.NeonCyan
import com.example.viewmodel.GambitViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PersonaSettingsScreen(vm: GambitViewModel) {
    val scrollState = rememberScrollState()
    val activeConfig = PersonaConfig.current
    var showSaveToast by remember { mutableStateOf(false) }
    var showCopyToast by remember { mutableStateOf(false) }
    val clipboardManager = LocalClipboardManager.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF04060A))
            .verticalScroll(scrollState)
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        // HEADER BLOCK WITH SURGICAL BORDER & ZERO SHADOW
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xFF080D14), RoundedCornerShape(12.dp))
                .border(1.dp, NeonCyan, RoundedCornerShape(12.dp))
                .padding(20.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "🎩 MADHAT'R AGENT CONFIGURATION HUB",
                    color = NeonCyan,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Monospace,
                    letterSpacing = 1.sp
                )
                Text(
                    text = "Calibrate prompt synthesis, neural tone mapping, and risk-bias scaling parameters for MADHAT's personal agent (powered by Gemini/Gemma models).",
                    color = Color.LightGray,
                    fontSize = 11.sp,
                    fontFamily = FontFamily.Monospace,
                    lineHeight = 16.sp
                )
            }
        }

        // TONE MAPPER (SATIRICAL vs CONTROVERSIAL vs ANALYTICAL/COMPLIANT)
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xFF070B11), RoundedCornerShape(12.dp))
                .border(1.dp, NeonCyan.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
                .padding(16.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(
                    text = "1. NEURAL TONAL MATRIX MAP",
                    color = NeonCyan,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
                Text(
                    text = "Configure the degree of South Park & MAD Magazine satire used during stochastic fluctuation roasts.",
                    color = Color.Gray,
                    fontSize = 10.sp,
                    fontFamily = FontFamily.Monospace
                )

                val tones = listOf("Satirical", "Controversial", "Analytical and Compliant")
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    tones.forEach { toneOption ->
                        val isSelected = activeConfig.tone == toneOption
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(
                                    if (isSelected) NeonCyan.copy(alpha = 0.1f) else Color.Transparent,
                                    RoundedCornerShape(8.dp)
                                )
                                .border(
                                    1.dp,
                                    if (isSelected) NeonCyan else Color.Gray.copy(alpha = 0.3f),
                                    RoundedCornerShape(8.dp)
                                )
                                .clickable {
                                    PersonaConfig.updateTone(toneOption)
                                }
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            RadioButton(
                                selected = isSelected,
                                onClick = { PersonaConfig.updateTone(toneOption) },
                                colors = RadioButtonDefaults.colors(
                                    selectedColor = NeonCyan,
                                    unselectedColor = Color.Gray
                                )
                            )
                            Spacer(Modifier.width(8.dp))
                            Column {
                                Text(
                                    text = toneOption.uppercase(),
                                    color = if (isSelected) Color.White else Color.Gray,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = FontFamily.Monospace
                                )
                                val toneDesc = when (toneOption) {
                                    "Satirical" -> "Classic Jersey Shore persona cracking jokes on low-conviction paper hands."
                                    "Controversial" -> "Maximum unhinged, highly opinionated, South Park meets MAD Magazine roasts on wokie posturing."
                                    else -> "Highly compliant, standard portfolio metrics with zero cynicism. Dull but safe."
                                }
                                Text(
                                    text = toneDesc,
                                    color = Color.Gray,
                                    fontSize = 9.sp,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                        }
                    }
                }
            }
        }

        // RISK BIAS SLIDER
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xFF070B11), RoundedCornerShape(12.dp))
                .border(1.dp, NeonCyan.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
                .padding(16.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "2. RISK PROFILE VOLATILITY SCALE",
                        color = NeonCyan,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                    Box(
                        modifier = Modifier
                            .background(NeonCyan.copy(alpha = 0.15f), RoundedCornerShape(4.dp))
                            .border(1.dp, NeonCyan, RoundedCornerShape(4.dp))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = activeConfig.riskProfile.uppercase(),
                            color = NeonCyan,
                            fontSize = 8.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }

                Text(
                    text = "Controls the multiplier bias for continuous decay alerts. Higher values produce more aggressive warnings and lower holding patience.",
                    color = Color.Gray,
                    fontSize = 10.sp,
                    fontFamily = FontFamily.Monospace
                )

                Slider(
                    value = activeConfig.riskProfileValue,
                    onValueChange = { newValue ->
                        PersonaConfig.updateRiskProfile(newValue)
                    },
                    colors = SliderDefaults.colors(
                        thumbColor = NeonCyan,
                        activeTrackColor = NeonCyan,
                        inactiveTrackColor = Color.Gray.copy(alpha = 0.3f)
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("COMPLIANT (0.0)", color = Color.Gray, fontSize = 8.sp, fontFamily = FontFamily.Monospace)
                    Text("BALANCED (0.5)", color = Color.Gray, fontSize = 8.sp, fontFamily = FontFamily.Monospace)
                    Text("MAX DEGEN (1.0)", color = Color.Gray, fontSize = 8.sp, fontFamily = FontFamily.Monospace)
                }
            }
        }

        // EVOLUTION TREND CHART (SATIRICAL INTENSITY vs. PORTFOLIO DECAY)
        EvolutionTrendChart()

        // EXPORT TO CLIPBOARD COMPONENT
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xFF070B11), RoundedCornerShape(12.dp))
                .border(1.dp, NeonCyan, RoundedCornerShape(12.dp))
                .clickable {
                    val configJson = PersonaConfig.getAsJson()
                    clipboardManager.setText(AnnotatedString(configJson))
                    showCopyToast = true
                }
                .padding(16.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "📤 EXPORT CUSTOM AGENT PROFILE (JSON)",
                color = NeonCyan,
                fontSize = 12.sp,
                fontWeight = FontWeight.Black,
                fontFamily = FontFamily.Monospace
            )
        }

        // SAVE & PERSIST BLOCK
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xFF070B11), RoundedCornerShape(12.dp))
                .border(1.dp, NeonCyan, RoundedCornerShape(12.dp))
                .clickable {
                    showSaveToast = true
                }
                .padding(16.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "⚡ SAVE CONVICTION PERSONA CONFIGURATION",
                color = Color.White,
                fontSize = 12.sp,
                fontWeight = FontWeight.Black,
                fontFamily = FontFamily.Monospace
            )
        }

        // COPY TOAST FEEDBACK
        if (showCopyToast) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(NeonCyan.copy(alpha = 0.15f), RoundedCornerShape(8.dp))
                    .border(1.dp, NeonCyan, RoundedCornerShape(8.dp))
                    .padding(12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Agent JSON Profile copied to clipboard successfully! Share with your lobby.",
                        color = Color.White,
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace
                    )
                    Text(
                        text = "DISMISS",
                        color = NeonCyan,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        modifier = Modifier.clickable { showCopyToast = false }
                    )
                }
            }
        }

        // SAVE TOAST FEEDBACK
        if (showSaveToast) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(NeonCyan.copy(alpha = 0.1f), RoundedCornerShape(8.dp))
                    .border(1.dp, NeonCyan, RoundedCornerShape(8.dp))
                    .padding(12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Persona configured successfully! Applied to global prompt mapping buffers.",
                        color = Color.White,
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace
                    )
                    Text(
                        text = "DISMISS",
                        color = NeonCyan,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        modifier = Modifier.clickable { showSaveToast = false }
                    )
                }
            }
        }
    }
}

@Composable
fun EvolutionTrendChart() {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(220.dp)
            .background(Color(0xFF030508), RoundedCornerShape(12.dp))
            .border(1.dp, NeonCyan.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
            .padding(16.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "📈 NEURAL TONAL EVOLUTION CORRELATION",
                    color = NeonCyan,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(modifier = Modifier.size(8.dp).background(NeonCyan))
                        Spacer(Modifier.width(4.dp))
                        Text("Satire Intensity", color = Color.Gray, fontSize = 8.sp, fontFamily = FontFamily.Monospace)
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(modifier = Modifier.size(8.dp).background(Color.Red))
                        Spacer(Modifier.width(4.dp))
                        Text("Portfolio Decay", color = Color.Gray, fontSize = 8.sp, fontFamily = FontFamily.Monospace)
                    }
                }
            }

            androidx.compose.foundation.Canvas(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
            ) {
                val width = size.width
                val height = size.height

                // Draw Grid Lines
                val gridLinesCount = 4
                for (i in 0..gridLinesCount) {
                    val y = (height / gridLinesCount) * i
                    drawLine(
                        color = Color.Gray.copy(alpha = 0.12f),
                        start = androidx.compose.ui.geometry.Offset(0f, y),
                        end = androidx.compose.ui.geometry.Offset(width, y),
                        strokeWidth = 1f
                    )
                }

                // Points for Portfolio Decay (stretching from 0.95 down to 0.12)
                val decayPoints = listOf(0.95f, 0.85f, 0.70f, 0.52f, 0.33f, 0.12f)
                // Points for Satirical Intensity (stretching from 0.15f up to 0.96f)
                val satirePoints = listOf(0.15f, 0.30f, 0.48f, 0.65f, 0.82f, 0.96f)

                val pointCount = decayPoints.size
                val segmentWidth = width / (pointCount - 1)

                // Draw Portfolio Decay Curve (Red)
                val decayPath = androidx.compose.ui.graphics.Path()
                for (i in 0 until pointCount) {
                    val x = i * segmentWidth
                    val y = height - (decayPoints[i] * height)
                    if (i == 0) {
                        decayPath.moveTo(x, y)
                    } else {
                        decayPath.lineTo(x, y)
                    }
                    drawCircle(
                        color = Color.Red,
                        radius = 4f,
                        center = androidx.compose.ui.geometry.Offset(x, y)
                    )
                }
                drawPath(
                    path = decayPath,
                    color = Color.Red,
                    style = androidx.compose.ui.graphics.drawscope.Stroke(width = 2.dp.toPx())
                )

                // Draw Satirical Intensity Curve (Neon Cyan)
                val satirePath = androidx.compose.ui.graphics.Path()
                for (i in 0 until pointCount) {
                    val x = i * segmentWidth
                    val y = height - (satirePoints[i] * height)
                    if (i == 0) {
                        satirePath.moveTo(x, y)
                    } else {
                        satirePath.lineTo(x, y)
                    }
                    drawCircle(
                        color = NeonCyan,
                        radius = 4f,
                        center = androidx.compose.ui.geometry.Offset(x, y)
                    )
                }
                drawPath(
                    path = satirePath,
                    color = NeonCyan,
                    style = androidx.compose.ui.graphics.drawscope.Stroke(width = 2.dp.toPx())
                )
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("T=0 (STABLE)", color = Color.Gray, fontSize = 8.sp, fontFamily = FontFamily.Monospace)
                Text("T=3 (DECAYING)", color = Color.Gray, fontSize = 8.sp, fontFamily = FontFamily.Monospace)
                Text("T=5 (MAX ROAST)", color = Color.Gray, fontSize = 8.sp, fontFamily = FontFamily.Monospace)
            }
        }
    }
}
