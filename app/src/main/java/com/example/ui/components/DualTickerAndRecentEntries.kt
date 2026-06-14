package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.SentimentPhase
import com.example.ui.theme.BrandCrimson
import com.example.ui.theme.LocalGambitTheme
import com.example.ui.theme.NeonCyan
import com.example.ui.theme.NeonGreen
import com.example.viewmodel.GambitViewModel

@Composable
fun TopMarketsAndLiarsDualTicker(vm: GambitViewModel) {
    val state by vm.state.collectAsState()
    val theme = LocalGambitTheme.current

    // For the sake of the dual ticker
    val hottestMarket = "🚀 OUTLIERS_META (Vol: 92%)"
    val biggestLiar = "☠️ GARY_GENSLER (Lie Score: 98%)"

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // Ticker 1: Hottest Market
        Box(
            modifier = Modifier
                .weight(1f)
                .padding(top = 0.5.dp, bottom = 0.5.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(NeonGreen.copy(alpha = 0.3f))
                .border(0.5.dp, NeonGreen.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                .padding(horizontal = 8.dp, vertical = 0.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    "🔥 HOTTEST MARKET",
                    color = NeonGreen,
                    fontSize = 8.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    hottestMarket,
                    color = Color.White,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Monospace,
                    maxLines = 1
                )
            }
        }

        // Ticker 2: Biggest Liar of the Day
        Box(
            modifier = Modifier
                .weight(1f)
                .padding(top = 0.5.dp, bottom = 0.5.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(BrandCrimson.copy(alpha = 0.3f))
                .border(0.5.dp, BrandCrimson.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                .padding(horizontal = 8.dp, vertical = 0.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    "🤡 BIGGEST LIAR (24H)",
                    color = BrandCrimson,
                    fontSize = 8.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    biggestLiar,
                    color = Color.White,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Monospace,
                    maxLines = 1
                )
            }
        }
    }
}

data class RecentEntry(
    val type: String, // "Conviction", "Prediction", "Lie Meter"
    val title: String,
    val time: String,
    val statusText: String,
    val statusColor: Color
)

@Composable
fun RecentEntriesListWidget(vm: GambitViewModel) {
    val theme = LocalGambitTheme.current

    // Mock data based on user entries for convictions, predictions, lie meter
    val userEntries = listOf(
        RecentEntry("Conviction", "Outliers Meta", "2 mins ago", "STAKED", NeonGreen),
        RecentEntry("Lie Meter", "Gary Gensler SEC Speech", "15 mins ago", "HABITUAL LIAR", BrandCrimson),
        RecentEntry("Prediction", "BTC > 100k", "1 hr ago", "PENDING", NeonCyan),
        RecentEntry("Conviction", "AI Autonomy Act", "3 hrs ago", "WON", NeonGreen),
        RecentEntry("Lie Meter", "Federal Reserve Rate Cut", "5 hrs ago", "SLIGHT ENHANCER", theme.brandSecondary)
    )

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(theme.bgCard.copy(alpha = 0.15f))
            .border(1.dp, theme.borderBrush, RoundedCornerShape(12.dp))
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                "🕒 RECENT ENTRIES & ACTIVITY",
                color = theme.textPrimary,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = com.example.ui.theme.ArialNarrowFamily
            )
            Box(
                modifier = Modifier
                    .background(theme.brandPrimary.copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                    .padding(horizontal = 6.dp, vertical = 2.dp)
            ) {
                Text("LAST 24 HOURS", color = theme.brandPrimary, fontSize = 8.sp, fontWeight = FontWeight.Bold)
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        userEntries.forEachIndexed { index, entry ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(Color.Black.copy(alpha = 0.3f))
                    .padding(10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    val iconText = when(entry.type) {
                        "Conviction" -> "💎"
                        "Prediction" -> "🎯"
                        else -> "🤥"
                    }
                    Box(modifier = Modifier.size(24.dp).background(theme.bgDeep, CircleShape), contentAlignment = Alignment.Center) {
                        Text(iconText, fontSize = 12.sp)
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text(entry.title, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(entry.type.uppercase(), color = Color.Gray, fontSize = 8.sp, fontFamily = FontFamily.Monospace)
                            Text(" • ", color = Color.DarkGray, fontSize = 8.sp)
                            Text(entry.time, color = Color.Gray, fontSize = 8.sp, fontFamily = FontFamily.Monospace)
                        }
                    }
                }
                
                Text(
                    entry.statusText,
                    color = entry.statusColor,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Monospace
                )
            }
            if (index < userEntries.size - 1) {
                Spacer(modifier = Modifier.height(6.dp))
            }
        }
    }
}
