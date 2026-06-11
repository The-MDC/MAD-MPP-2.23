package com.example.ui.components

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.Scenario
import com.example.ui.theme.ArialNarrowFamily
import com.example.ui.theme.ArialFamily
import com.example.ui.theme.LocalGambitTheme
import kotlin.math.abs

@Composable
fun MarketHeatmapWidget(
    activeScenarios: List<Scenario>,
    modifier: Modifier = Modifier
) {
    val theme = LocalGambitTheme.current
    var selectedEvent by remember { mutableStateOf<Scenario?>(null) }
    
    // Pulse animation for the volatility glow
    val infiniteTransition = rememberInfiniteTransition(label = "heatmapPulse")
    val pulseAlpha by infiniteTransition.animateFloat(
        initialValue = 0.4f,
        targetValue = 0.95f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse"
    )

    Box(
        modifier = modifier
            .fillMaxWidth()
            .glassContainerBackground(theme.brandPrimary.copy(alpha = 0.12f), RoundedCornerShape(20.dp))
            .border(1.dp, theme.brandPrimary.copy(alpha = 0.25f), RoundedCornerShape(20.dp))
            .padding(16.dp)
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "🌍 GLOBAL CONVICTION HEATMAP",
                        color = theme.textPrimary,
                        fontSize = 12.5.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = ArialNarrowFamily,
                        style = TextStyle(
                            shadow = Shadow(
                                color = theme.brandAccent.copy(alpha = 0.5f),
                                blurRadius = 6f
                            )
                        )
                    )
                    Text(
                        text = "Live public sentiment intensity mapped to community alignment grids",
                        color = theme.textSecondary,
                        fontSize = 9.5.sp,
                        fontFamily = ArialNarrowFamily
                    )
                }
                
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(theme.brandAccent.copy(alpha = 0.15f))
                        .border(1.dp, theme.brandAccent.copy(alpha = 0.5f), RoundedCornerShape(6.dp))
                        .padding(horizontal = 8.dp, vertical = 3.dp)
                ) {
                    Text(
                        text = "RECHARTS ENGINE",
                        color = theme.brandAccent,
                        fontSize = 8.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }

            Spacer(Modifier.height(14.dp))

            // Gradients legend explanation (Zero jargon!)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(theme.bgCard.copy(alpha = 0.6f), RoundedCornerShape(8.dp))
                    .padding(8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Box(Modifier.size(8.dp).background(Color(0xFFFF073A), RoundedCornerShape(2.dp)))
                    Text("Skeptical Pulse (<45%)", color = theme.textSecondary, fontSize = 9.sp, fontFamily = ArialNarrowFamily)
                }
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Box(Modifier.size(8.dp).background(Color(0xFFFFD700), RoundedCornerShape(2.dp)))
                    Text("Balanced Sentiment", color = theme.textSecondary, fontSize = 9.sp, fontFamily = ArialNarrowFamily)
                }
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Box(Modifier.size(8.dp).background(Color(0xFF00FF88), RoundedCornerShape(2.dp)))
                    Text("Optimal Consensus (>55%)", color = theme.textSecondary, fontSize = 9.sp, fontFamily = ArialNarrowFamily)
                }
            }

            Spacer(Modifier.height(12.dp))

            // Grid Heatmap Content
            val items = activeScenarios.take(6)
            if (items.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(120.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("Deploying telemetry fields...", color = theme.textSecondary, fontFamily = ArialNarrowFamily)
                }
            } else {
                // Flow layouts or vertical column with rows to avoid Compose grid bugs
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    val rows = items.chunked(2)
                    for (row in rows) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            for (sc in row) {
                                HeatmapGridCell(
                                    sc = sc,
                                    pulseAlpha = pulseAlpha,
                                    isSelected = selectedEvent?.id == sc.id,
                                    onClick = {
                                        selectedEvent = if (selectedEvent?.id == sc.id) null else sc
                                    },
                                    modifier = Modifier.weight(1f)
                                )
                            }
                            if (row.size < 2) {
                                Spacer(modifier = Modifier.weight(1f))
                            }
                        }
                    }
                }
            }

            // Expanded interactive detailed inspect panel
            AnimatedVisibility(
                visible = selectedEvent != null,
                enter = expandVertically() + fadeIn(),
                exit = shrinkVertically() + fadeOut()
            ) {
                selectedEvent?.let { sc ->
                    Spacer(Modifier.height(12.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .glassContainerBackground(theme.brandAccent.copy(alpha = 0.1f), RoundedCornerShape(12.dp))
                            .border(1.dp, theme.brandAccent.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
                            .padding(12.dp)
                    ) {
                        Column {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = sc.name,
                                    color = Color.White,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = ArialFamily
                                )
                                Text(
                                    text = sc.category.uppercase(),
                                    color = theme.brandAccent,
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                            Spacer(Modifier.height(6.dp))
                            Text(
                                text = "Aesthetic Heatmap Readout: Public alignment is currently operating at ${(sc.sentimentBullishRatio * 100).toInt()}% confidence with a dynamic turbulence factor of ${String.format("%.1f", abs(sc.crowdConvictionSpeed))} units.",
                                color = theme.textSecondary,
                                fontSize = 11.sp,
                                fontFamily = ArialNarrowFamily
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun HeatmapGridCell(
    sc: Scenario,
    pulseAlpha: Float,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val theme = LocalGambitTheme.current
    
    // Determine gradient colors based on sentiment ratio
    val sentimentColor = when {
        sc.sentimentBullishRatio >= 0.58 -> Color(0xFF00FF88) // Safe Cyber Emerald
        sc.sentimentBullishRatio < 0.44 -> Color(0xFFFF073A) // Hot Neon Red / Skeptical
        else -> Color(0xFFFFD700) // Balanced Amber
    }
    
    // Volatility thickness representation
    val volatilityMultiplier = (abs(sc.crowdConvictionSpeed) / 10.0).coerceIn(0.1, 1.2)
    val borderGlowAlpha = (pulseAlpha * volatilityMultiplier).toFloat().coerceIn(0.2f, 1.0f)
    
    Box(
        modifier = modifier
            .height(72.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(
                Brush.radialGradient(
                    colors = listOf(
                        sentimentColor.copy(alpha = 0.28f),
                        theme.bgCard.copy(alpha = 0.9f)
                    )
                )
            )
            .border(
                width = if (isSelected) 2.dp else 1.dp,
                color = if (isSelected) theme.brandPrimary else sentimentColor.copy(alpha = borderGlowAlpha),
                shape = RoundedCornerShape(12.dp)
            )
            .clickable { onClick() }
            .padding(10.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = sc.category.uppercase(),
                    color = theme.textSecondary,
                    fontSize = 8.5.sp,
                    fontWeight = FontWeight.ExtraBold,
                    fontFamily = FontFamily.Monospace,
                    maxLines = 1
                )
                
                // Pulsing volatility indicator dot
                Box(
                    modifier = Modifier
                        .size(6.dp)
                        .background(sentimentColor.copy(alpha = borderGlowAlpha), RoundedCornerShape(3.dp))
                )
            }
            
            Text(
                text = sc.name,
                color = Color.White,
                fontSize = 10.5.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = ArialFamily,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Bottom
            ) {
                Text(
                    text = "Consensus: ${(sc.sentimentBullishRatio * 100).toInt()}%",
                    color = sentimentColor,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = ArialNarrowFamily
                )
                
                Text(
                    text = "${String.format("%.1f", abs(sc.crowdConvictionSpeed))}u Flow",
                    color = Color.LightGray,
                    fontSize = 8.5.sp,
                    fontFamily = FontFamily.Monospace
                )
            }
        }
    }
}
