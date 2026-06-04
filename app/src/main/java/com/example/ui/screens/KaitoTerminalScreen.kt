package com.example.ui.screens
import com.example.ui.components.HoverTooltip
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.horizontalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.components.ChaosMeter
import com.example.ui.theme.*
import com.example.viewmodel.GambitViewModel

@Composable
fun KaitoTerminalScreen(vm: GambitViewModel) {
    val state by vm.state.collectAsState()
    val scroll = rememberScrollState()
    var platformFilter by remember { mutableStateOf("ALL") }

    Column(
        Modifier
            .fillMaxSize()
            .background(BgDeep)
            .verticalScroll(scroll)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Column(Modifier.padding(horizontal = 4.dp)) {
            Text(
                "👁️‍🗨️ KAITO SENTIMENT PORTAL", 
                color = NeonCyan, 
                fontSize = 24.sp, 
                fontWeight = FontWeight.Black,
                fontFamily = com.example.ui.theme.ArialNarrowFamily,
                style = TextStyle(shadow = Shadow(NeonCyanDim, blurRadius = 24f)),
                lineHeight = 32.sp
            )
            Text(
                "Mindshare × Emotional Valence × Viral Velocity", 
                color = BrandEggwhite.copy(alpha=0.7f), 
                fontSize = 12.sp,
                fontFamily = com.example.ui.theme.ArialNarrowFamily
            )
        }
        
        com.example.ui.components.BehavioralCycleChart(state.sentimentPhase)

        // Sentiment Phase Banner
        Box(
            Modifier
                .fillMaxWidth()
                .background(Brush.horizontalGradient(listOf(
                    NeonMagenta.copy(alpha=0.3f), NeonCyan.copy(alpha=0.3f), BrandGoldGlow
                )), RoundedCornerShape(12.dp))
                .border(1.dp, Brush.horizontalGradient(listOf(NeonMagenta, NeonCyan)), RoundedCornerShape(12.dp))
                .padding(20.dp)
        ) {
            Row(Modifier.fillMaxWidth(), Arrangement.SpaceBetween, Alignment.CenterVertically) {
                Column {
                    Text("CURRENT PHASE", color = BrandEggwhite, fontSize = 10.5.sp, letterSpacing = 1.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                    Text(
                        state.sentimentPhase.display, 
                        color = BrandGold, 
                        fontSize = 28.sp, 
                        fontWeight = FontWeight.Black,
                        fontFamily = com.example.ui.theme.ArialNarrowFamily,
                        style = TextStyle(shadow = Shadow(BrandGoldGlow, blurRadius = 12f))
                    )
                }
                Text("CYCLE: ${(state.eigenTrustLogs.size % 4) + 1}/4", color = NeonCyan, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontWeight = FontWeight.Bold)
            }
        }

        ChaosMeter(volatility = state.temperature, modifier = Modifier.fillMaxWidth())

        // Platform Filter
        Text("ATTENTION DISPERSION", color = NeonCyan, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ArialNarrowFamily, letterSpacing = 1.sp)
        
        Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("ALL", "TWITTER", "DISCORD", "TELEGRAM").forEach { p ->
                HoverTooltip(text = "Filter sentiment and liquidity traces by $p channels.") {
                    FilterChip(
                        selected = platformFilter == p,
                        onClick = { platformFilter = p },
                        label = { Text(p, fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = NeonCyan, 
                            selectedLabelColor = BgDeep,
                            containerColor = BgPanel,
                            labelColor = BrandEggwhite
                        ),
                        border = FilterChipDefaults.filterChipBorder(enabled = true, selected = platformFilter == p, borderColor = NeonCyan)
                    )
                }
            }
        }

        // Metrics Grid
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            MetricBox("MINDSHARE", "${(45 + state.eigenTrustLogs.size * 2) % 100}%", NeonGreen, Modifier.weight(1f))
            MetricBox("VALENCE", "${"%.2f".format(state.temperature)}", NeonMagenta, Modifier.weight(1f))
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            MetricBox("VIRAL VELOCITY", "${(80 + state.ownedCards.size * 3) % 100}", BrandGold, Modifier.weight(1f))
            MetricBox("BOT REJECTS", "${state.eigenTrustLogs.count { it.contains("SYBIL") }}", BrandCrimson, Modifier.weight(1f))
        }

        Text("EIGENTRUST LOG STREAM", color = NeonGreen, fontWeight = FontWeight.Black, fontFamily = com.example.ui.theme.ArialNarrowFamily, letterSpacing = 1.sp)
        
        Box(
            Modifier
                .fillMaxWidth()
                .background(Color(0xFF030303), RoundedCornerShape(12.dp))
                .border(1.dp, NeonGreen.copy(alpha=0.3f), RoundedCornerShape(12.dp))
                .padding(16.dp)
        ) {
            Column {
                state.eigenTrustLogs.takeLast(10).forEach { log ->
                    Text(
                        log, 
                        color = if (log.contains("SYBIL")) BrandCrimson else NeonGreen, 
                        fontSize = 11.sp, 
                        fontFamily = com.example.ui.theme.ArialNarrowFamily, 
                        modifier = Modifier.padding(vertical = 2.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun MetricBox(label: String, value: String, color: Color, modifier: Modifier = Modifier) {
    Box(
        modifier
            .background(BgCard, RoundedCornerShape(16.dp))
            .border(1.dp, color.copy(alpha=0.3f), RoundedCornerShape(16.dp))
            .padding(16.dp)
    ) {
        Column {
            Text(label, color = BrandEggwhite.copy(alpha=0.7f), fontSize = 10.5.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
            Spacer(Modifier.height(4.dp))
            Text(
                value, 
                color = color, 
                fontSize = 24.sp, 
                fontWeight = FontWeight.Black, 
                fontFamily = com.example.ui.theme.ArialNarrowFamily,
                style = TextStyle(shadow = Shadow(color.copy(alpha=0.5f), blurRadius = 12f))
            )
        }
    }
}
