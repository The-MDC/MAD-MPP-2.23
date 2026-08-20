package com.example.ui.components

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.LocalGambitTheme
import com.example.viewmodel.GambitViewModel
import kotlinx.coroutines.delay
import kotlin.random.Random

@Composable
fun DashboardTelemetry(
    vm: GambitViewModel,
    modifier: Modifier = Modifier
) {
    val theme = LocalGambitTheme.current
    
    // Live states representing fluctuating telemetry metrics
    var tickCount by remember { mutableStateOf(0) }
    
    // Agent A Metrics
    var agentABsIndex by remember { mutableStateOf(84.2f) }
    var agentADecayRate by remember { mutableStateOf(0.015f) }
    var agentAPrecision by remember { mutableStateOf(94.8f) }
    
    // Agent B Metrics
    var agentBBsIndex by remember { mutableStateOf(4.1f) }
    var agentBDecayRate by remember { mutableStateOf(0.042f) }
    var agentBKellyAllocation by remember { mutableStateOf(0.32f) }
    var agentBQuadWeight by remember { mutableStateOf(2.45f) }
    
    // Agent C Metrics
    var agentCBsIndex by remember { mutableStateOf(1.2f) }
    var agentCDecayRate by remember { mutableStateOf(0.089f) }
    var agentCEntropy by remember { mutableStateOf(0.712f) }

    LaunchedEffect(Unit) {
        while (true) {
            delay(1500L)
            tickCount++
            
            // Fluctuating with small stochastic steps
            agentABsIndex = (agentABsIndex + Random.nextFloat() * 1.5f - 0.75f).coerceIn(75.0f, 95.0f)
            agentADecayRate = (agentADecayRate + Random.nextFloat() * 0.002f - 0.001f).coerceIn(0.010f, 0.025f)
            agentAPrecision = (agentAPrecision + Random.nextFloat() * 0.8f - 0.4f).coerceIn(90.0f, 99.9f)
            
            agentBBsIndex = (agentBBsIndex + Random.nextFloat() * 0.5f - 0.25f).coerceIn(2.0f, 8.0f)
            agentBDecayRate = (agentBDecayRate + Random.nextFloat() * 0.004f - 0.002f).coerceIn(0.030f, 0.060f)
            agentBKellyAllocation = (agentBKellyAllocation + Random.nextFloat() * 0.02f - 0.01f).coerceIn(0.15f, 0.45f)
            agentBQuadWeight = (agentBQuadWeight + Random.nextFloat() * 0.1f - 0.05f).coerceIn(1.8f, 3.5f)
            
            agentCBsIndex = (agentCBsIndex + Random.nextFloat() * 0.2f - 0.1f).coerceIn(0.5f, 2.5f)
            agentCDecayRate = (agentCDecayRate + Random.nextFloat() * 0.006f - 0.003f).coerceIn(0.070f, 0.120f)
            agentCEntropy = (agentCEntropy + Random.nextFloat() * 0.04f - 0.02f).coerceIn(0.50f, 0.95f)
        }
    }

    // Surgical Border & Zero Drop Shadow Frame
    Box(
        modifier = modifier
            .testTag("dashboard_telemetry_container")
            .fillMaxWidth()
            .background(theme.bgCard.copy(alpha = 0.95f))
            .border(
                width = 0.5.dp, 
                color = theme.brandPrimary.copy(alpha = 0.6f), 
                shape = RoundedCornerShape(2.dp)
            )
            .padding(10.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            // Header Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Box(
                        modifier = Modifier
                            .size(6.dp)
                            .background(Color(0xFF00E5FF))
                    )
                    Text(
                        text = "SYS_TELEMETRY.LOG // CLK_TICK: $tickCount",
                        color = theme.brandPrimary,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                }
                
                Text(
                    text = "STATUS: NOMINAL",
                    color = Color(0xFF00E5FF),
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Monospace
                )
            }

            // Divider Line
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(0.5.dp)
                    .background(theme.brandPrimary.copy(alpha = 0.3f))
            )

            // Grid of 3 Agents
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                // Agent A
                AgentTelemetryRow(
                    agentName = "AGENT_A // SENTINEL",
                    bsIndex = agentABsIndex,
                    decayRate = agentADecayRate,
                    auxLabel = "LIE_FILTER",
                    auxValue = String.format("%.2f%% ACC", agentAPrecision),
                    accentColor = theme.brandSecondary,
                    theme = theme
                )

                // Agent B
                AgentTelemetryRow(
                    agentName = "AGENT_B // STRATEGIST",
                    bsIndex = agentBBsIndex,
                    decayRate = agentBDecayRate,
                    auxLabel = "KELLY_F*",
                    auxValue = String.format("%.2f (x%.2fQP)", agentBKellyAllocation, agentBQuadWeight),
                    accentColor = Color(0xFF00E5FF),
                    theme = theme
                )

                // Agent C
                AgentTelemetryRow(
                    agentName = "AGENT_C // DECAY_ENG",
                    bsIndex = agentCBsIndex,
                    decayRate = agentCDecayRate,
                    auxLabel = "STOCH_ENT",
                    auxValue = String.format("%.3f H", agentCEntropy),
                    accentColor = Color(0xFFFF007F),
                    theme = theme
                )
            }

            // Divider Line
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(0.5.dp)
                    .background(theme.brandPrimary.copy(alpha = 0.3f))
            )

            // Dynamic Kelly Calculations updating in real-time as simulated assets decay
            val simulatedDecay = com.example.math.ConvictionMathEngine.calculateTemporalDecay(0.045, (tickCount % 100).toDouble())
            val winProbValue = (0.55 + 0.15 * kotlin.math.sin(tickCount * 0.1)).coerceIn(0.0, 1.0)
            val adjustedWinProb = (winProbValue * simulatedDecay).coerceIn(0.0, 1.0)
            val netOddsValue = 2.0
            
            // Compute Kelly Allocation using high-precision BigDecimal
            val kellyAlloc = remember(adjustedWinProb, netOddsValue) {
                val pBD = java.math.BigDecimal(adjustedWinProb.toString())
                val oddsBD = java.math.BigDecimal(netOddsValue.toString())
                com.example.math.ConvictionMathEngine.calculateKellyAllocationBigDecimal(pBD, oddsBD, java.math.BigDecimal("0.75"))
            }.toDouble()

            // Dynamic Kelly Probability Edge Gauge
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(0.5.dp, theme.brandPrimary.copy(alpha = 0.2f), RoundedCornerShape(1.dp))
                    .background(Color.Black.copy(alpha = 0.4f))
                    .padding(8.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "DYNAMIC KELLY PROBABILITY EDGE GAUGE",
                        color = theme.brandPrimary,
                        fontSize = 8.5.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                    Text(
                        text = String.format("DECAY_INTACT: %.2f%%", simulatedDecay * 100),
                        color = if (simulatedDecay < 0.5) Color(0xFFFF007F) else Color.Green,
                        fontSize = 8.5.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "WIN_PROB: ${String.format("%.1f%%", adjustedWinProb * 100)} | ODDS: ${netOddsValue}:1",
                        color = Color.Gray,
                        fontSize = 7.5.sp,
                        fontFamily = FontFamily.Monospace
                    )
                    Text(
                        text = String.format("RECOMMENDED_SIZE: %.2f%%", kellyAlloc * 100),
                        color = theme.brandSecondary,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = FontFamily.Monospace
                    )
                }

                // Bar Gauge
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(10.dp)
                        .background(Color.DarkGray.copy(alpha = 0.3f))
                        .border(0.5.dp, theme.brandPrimary.copy(alpha = 0.3f), RoundedCornerShape(1.dp))
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxHeight()
                            .fillMaxWidth(kellyAlloc.toFloat().coerceIn(0f, 1f))
                            .background(
                                brush = androidx.compose.ui.graphics.Brush.horizontalGradient(
                                    colors = listOf(
                                        theme.brandSecondary.copy(alpha = 0.6f),
                                        theme.brandSecondary
                                    )
                                )
                            )
                    )
                }
            }
        }
    }
}

@Composable
fun AgentTelemetryRow(
    agentName: String,
    bsIndex: Float,
    decayRate: Float,
    auxLabel: String,
    auxValue: String,
    accentColor: Color,
    theme: com.example.ui.theme.GambitThemeSpecs
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .border(0.5.dp, theme.brandPrimary.copy(alpha = 0.15f), RoundedCornerShape(1.dp))
            .background(Color.Black.copy(alpha = 0.3f))
            .padding(6.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = agentName,
                color = accentColor,
                fontSize = 9.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace
            )
            
            // Mini active flashing pulse
            val infiniteTransition = rememberInfiniteTransition(label = "pulse")
            val alphaPulse by infiniteTransition.animateFloat(
                initialValue = 0.3f,
                targetValue = 1.0f,
                animationSpec = infiniteRepeatable(
                    animation = tween(600, easing = LinearEasing),
                    repeatMode = RepeatMode.Reverse
                ),
                label = "pulseAlpha"
            )
            Box(
                modifier = Modifier
                    .size(4.dp)
                    .background(accentColor.copy(alpha = alphaPulse))
            )
        }
        
        Spacer(Modifier.height(4.dp))
        
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // BS Index column
            Column(modifier = Modifier.weight(1.0f)) {
                Text(
                    text = "BS_INDEX",
                    color = Color.Gray,
                    fontSize = 7.5.sp,
                    fontFamily = FontFamily.Monospace
                )
                Text(
                    text = String.format("%.2f%%", bsIndex),
                    color = Color.White,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
            }

            // Decay Rate column
            Column(modifier = Modifier.weight(1.0f)) {
                Text(
                    text = "DECAY_RATE",
                    color = Color.Gray,
                    fontSize = 7.5.sp,
                    fontFamily = FontFamily.Monospace
                )
                Text(
                    text = String.format("%.5f/s", decayRate),
                    color = Color.White,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
            }

            // Custom auxiliary column
            Column(modifier = Modifier.weight(1.2f)) {
                Text(
                    text = auxLabel,
                    color = Color.Gray,
                    fontSize = 7.5.sp,
                    fontFamily = FontFamily.Monospace
                )
                Text(
                    text = auxValue,
                    color = Color.White,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
            }
        }
    }
}
