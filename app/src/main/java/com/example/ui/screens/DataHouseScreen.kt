package com.example.ui.screens

import com.example.ui.components.HoverTooltip
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.components.BehavioralCycleChart
import com.example.ui.components.CalibrationPlotChart
import com.example.ui.components.ConvictionDataChart
import com.example.ui.components.LiquiditySentimentChart
import com.example.ui.theme.LocalGambitTheme
import com.example.viewmodel.GambitViewModel

@Composable
fun DataHouseScreen(vm: GambitViewModel) {
    val scroll = rememberScrollState()
    val theme = LocalGambitTheme.current

    Column(
        Modifier
            .fillMaxSize()
            .background(theme.bgDeep)
            .verticalScroll(scroll)
            .padding(0.5.dp),
        verticalArrangement = Arrangement.spacedBy(0.dp)
    ) {
        Column {
            Text("THE DATA HOUSE", color = theme.brandSecondary, fontSize = 24.sp, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ArialNarrowFamily)
            Text("Top-level aggregated Behavioral, Psychographic & Sentimental Data", color = theme.textSecondary, fontSize = 12.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
        }

        val state by vm.state.collectAsState()

        com.example.ui.components.AdvancedSentimentSuiteChart()
        ConvictionDataChart()
        LiquiditySentimentChart()
        BehavioralCycleChart(state.sentimentPhase)
        CalibrationPlotChart()

        // Impressions and Psychographics Report
        Box(
            Modifier
                .fillMaxWidth()
                .background(theme.bgCard.copy(alpha = 0.15f), RoundedCornerShape(12.dp))
                .border(theme.borderWidth, theme.borderBrush, RoundedCornerShape(12.dp))
                .padding(1.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(1.dp)) {
                com.example.ui.components.SatiricalTooltip(com.example.model.SatireGuardrailEngine.getMADHATrTooltip("sentiment")) {
                    Text("IMPRESSIONS, SENTIMENTS & PSYCHOGRAPHICS", color = theme.textPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                }
                
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Column(Modifier.weight(1f)) {
                        Text("30D Retention Target", color = theme.textSecondary, fontSize = 11.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                        Text("70%", color = theme.brandSecondary, fontSize = 16.sp, fontWeight = FontWeight.Black)
                    }
                    Column(Modifier.weight(1f)) {
                        Text("Volume Projection (Y3)", color = theme.textSecondary, fontSize = 11.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                        Text("$3B", color = theme.brandAccent, fontSize = 16.sp, fontWeight = FontWeight.Black)
                    }
                }
                Spacer(Modifier.height(8.dp))
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Column(Modifier.weight(1f)) {
                        Text("Global Impression Volume", color = theme.textSecondary, fontSize = 11.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                        Text("2.4B / week", color = theme.brandSecondary, fontSize = 16.sp, fontWeight = FontWeight.Black)
                    }
                    Column(Modifier.weight(1f)) {
                        Text("Aggregate Sentiment", color = theme.textSecondary, fontSize = 11.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                        Text("Borderline Euphoria", color = theme.brandAccent, fontSize = 16.sp, fontWeight = FontWeight.Black)
                    }
                }

                HorizontalDivider(color = theme.textSecondary.copy(alpha=0.2f))

                Text("REGIONAL DRILL-DOWN (TIER 1)", color = theme.brandPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                DemographicRow("North America", "45%", "Bullish")
                DemographicRow("Europe", "30%", "Neutral")
                DemographicRow("Asia-Pacific", "25%", "Euphoric")
                
                HorizontalDivider(color = theme.textSecondary.copy(alpha=0.2f))
                
                Text("GENDER DRILL-DOWN (TIER 2)", color = theme.brandPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                DemographicRow("Male", "68%", "High Risk Tolerance")
                DemographicRow("Female", "32%", "Calculated Volatility")
            }
        }
        
        com.example.ui.components.InteractiveDualPerspectiveConsole()
        
        Spacer(Modifier.height(32.dp))
    }
}

@Composable
fun DemographicRow(label: String, percentage: String, sentiment: String) {
    val theme = LocalGambitTheme.current
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
        Text(label, color = theme.textPrimary, fontSize = 12.sp, modifier = Modifier.weight(1f))
        Text(percentage, color = theme.brandSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold, modifier = Modifier.width(60.dp))
        Text(sentiment, color = theme.brandAccent, fontSize = 12.sp, modifier = Modifier.width(100.dp), textAlign = androidx.compose.ui.text.style.TextAlign.End)
    }
}
