package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.GambitReportRecord
import com.example.model.LeaderboardUser
import com.example.ui.theme.LocalGambitTheme
import com.example.ui.theme.BrandGold
import com.example.ui.theme.NeonGreen
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun HistoricalGambitReportsTimeline(
    reports: List<GambitReportRecord>,
    modifier: Modifier = Modifier
) {
    val theme = LocalGambitTheme.current
    val sdf = remember { SimpleDateFormat("MM/dd HH:mm", Locale.US) }
    
    Column(modifier = modifier.fillMaxWidth().fillMaxHeight()) {
        Text("📜 HISTORICAL GAMBIT REPORTS", color = theme.brandSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(12.dp))
        
        if (reports.isEmpty()) {
            Text("No historical data found. The neural mesh is blank.", color = theme.textSecondary, fontSize = 11.sp)
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxWidth().weight(1f),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                items(reports) { report ->
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(theme.bgCard, RoundedCornerShape(8.dp))
                            .border(1.dp, theme.borderBrush, RoundedCornerShape(8.dp))
                            .padding(12.dp)
                    ) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(sdf.format(Date(report.timestamp)), color = theme.textSecondary, fontSize = 9.sp)
                            report.predictedProbability?.let {
                                Text("Prob: ${(it * 100).toInt()}%", color = theme.brandPrimary, fontSize = 9.sp)
                            }
                        }
                        Spacer(Modifier.height(6.dp))
                        Text(report.reportText, color = theme.textPrimary, fontSize = 11.sp, fontStyle = androidx.compose.ui.text.font.FontStyle.Italic)
                        Spacer(Modifier.height(8.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("Outcome: ", color = theme.textSecondary, fontSize = 10.sp)
                            Text(report.actualOutcome ?: "Pending Resolution", color = if (report.actualOutcome != null) BrandGold else theme.textSecondary, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}
