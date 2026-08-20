package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.BrandGold
import com.example.ui.theme.LocalGambitTheme
import com.example.ui.theme.NeonGreen
import com.example.ui.theme.NeonPink

data class ConvictionLogEntry(val id: Int, val market: String, val action: String, val amount: Double, val timestamp: String)

val dummyConvictionLogs = listOf(
    ConvictionLogEntry(1, "BTC -> $150k", "STAKED", 25000.0, "2026-06-06 14:22:01"),
    ConvictionLogEntry(2, "ETH Gas Spike", "SLASHED", 420.0, "2026-06-06 12:01:45"),
    ConvictionLogEntry(3, "MadHats Mint", "WITHDRAWN", 1500.0, "2026-06-05 09:30:12"),
    ConvictionLogEntry(4, "SENTINEL EVENT", "LIQUIDATED", 8500.0, "2026-06-04 18:45:00")
)

@Composable
fun ConvictionHistoryLogWidget() {
    val theme = LocalGambitTheme.current
    
    Box(
        Modifier
            .fillMaxWidth()
            .height(260.dp)
            .glassContainerBackground(Color.Black, RoundedCornerShape(12.dp))
            .border(1.dp, theme.borderBrush, RoundedCornerShape(12.dp))
            .padding(16.dp)
    ) {
        Column(Modifier.fillMaxSize()) {
            Row(Modifier.fillMaxWidth(), Arrangement.SpaceBetween, Alignment.CenterVertically) {
                Text("CONVICTION ENGINE LOG", color = theme.brandSecondary, fontSize = 14.sp, fontWeight = FontWeight.Black, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                Text("[IMMUTABLE LEDGER]", color = Color.DarkGray, fontSize = 9.sp, fontFamily = FontFamily.Monospace)
            }
            Spacer(Modifier.height(12.dp))
            
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxSize()) {
                items(dummyConvictionLogs) { log ->
                    Row(
                        Modifier
                            .fillMaxWidth()
                            .glassReflection(Color.Black, RoundedCornerShape(4.dp))
                            .border(0.5.dp, theme.textSecondary.copy(alpha=0.3f), RoundedCornerShape(4.dp))
                            .padding(horizontal = 8.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(log.timestamp.substringAfter(" "), color = Color.Gray, fontSize = 10.sp, fontFamily = FontFamily.Monospace, modifier = Modifier.weight(0.2f))
                        Text(log.market, color = theme.textPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ArialNarrowFamily, modifier = Modifier.weight(0.4f))
                        
                        val actionColor = when(log.action) {
                            "STAKED" -> NeonGreen
                            "SLASHED", "LIQUIDATED" -> NeonPink
                            else -> BrandGold
                        }
                        
                        Text(log.action, color = actionColor, fontSize = 10.sp, fontWeight = FontWeight.Black, modifier = Modifier.weight(0.2f))
                        Text(String.format("%,.0f MADx", log.amount), color = theme.textSecondary, fontSize = 10.sp, fontFamily = FontFamily.Monospace, modifier = Modifier.weight(0.2f), textAlign = androidx.compose.ui.text.style.TextAlign.End)
                    }
                }
            }
        }
    }
}
