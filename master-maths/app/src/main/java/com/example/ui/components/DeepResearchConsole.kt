package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.BrandGold
import com.example.ui.theme.LocalGambitTheme
import com.example.ui.theme.NeonPink
import kotlinx.coroutines.delay

import com.example.viewmodel.GambitViewModel

@Composable
fun DeepResearchConsole(vm: GambitViewModel, modifier: Modifier = Modifier) {
    val state by vm.state.collectAsState()
    val theme = LocalGambitTheme.current
    var simStep by remember { mutableStateOf(0) }
    
    LaunchedEffect(Unit) {
        while(true) {
            delay(1200L)
            simStep = (simStep + 1) % 5
        }
    }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .background(theme.bgCard, RoundedCornerShape(12.dp))
            .border(2.dp, theme.brandPrimary.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
            .padding(16.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    "🧠 CAUSAL DEEP RESEARCH MODULE",
                    color = theme.brandPrimary,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Monospace
                )
            }
            Text(
                "Simulating advanced Chain-of-Thought macro/micro dynamics...",
                color = theme.textSecondary,
                fontSize = 9.sp,
                fontFamily = FontFamily.Monospace
            )
            
            Spacer(Modifier.height(8.dp))
            
            // Macro Dynamic
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("MACRO-DYNAMIC: Bayesian Drift", color = Color.Gray, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                Text(if (simStep % 2 == 0) "+0.034 θ" else "-0.012 θ", color = if (simStep % 2 == 0) theme.brandPrimary else NeonPink, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
            }
            // Micro Dynamic
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("MICRO-DYNAMIC: Kelly Criterion Alloc.", color = Color.Gray, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                Text(if (simStep > 2) "Optimal (f* = 0.18)" else "Recalculating...", color = BrandGold, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
            }
            
            // Multi-Agent Simulation
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("MCTS AGENT FORESIGHT", color = Color.Gray, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                Text(
                    text = when(simStep) {
                        0 -> "Tree Search Depth: 12"
                        1 -> "Evaluating Branch 01A..."
                        2 -> "Pruning Hallucinations"
                        3 -> "Backpropagating Truth"
                        else -> "Result: 88.5% Conviction"
                    },
                    color = Color.White, fontSize = 10.sp, fontFamily = FontFamily.Monospace
                )
            }
            
            // Satirical output (Gambit Report)
            Spacer(Modifier.height(8.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(theme.bgCard.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                    .padding(8.dp)
            ) {
                if (state.isGambitReportGenerating) {
                     Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                         AnimatedTopHatSpinner(modifier = Modifier.size(28.dp), size = 28.dp, tint = BrandGold, showLabel = false)
                         Text("Generating Gambit Report via Gemini Neural Link...", color = BrandGold, fontSize = 9.sp, fontFamily = FontFamily.Monospace)
                     }
                } else {
                    Text(
                        state.gambitReportText ?: "\"Hey boss, the Deep Research engine just processed 10,000 parallel dimensions and in every single one, the politicians were still lying!\"",
                        color = theme.brandSecondary,
                        fontSize = 9.5.sp,
                        fontStyle = androidx.compose.ui.text.font.FontStyle.Italic
                    )
                }
            }
        }
    }
}
