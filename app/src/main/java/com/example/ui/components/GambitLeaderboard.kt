package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.LeaderboardUser
import com.example.ui.theme.LocalGambitTheme
import com.example.ui.theme.BrandGold
import com.example.ui.theme.NeonCyan

@Composable
fun GambitLeaderboard(
    users: List<LeaderboardUser>,
    modifier: Modifier = Modifier
) {
    val theme = LocalGambitTheme.current
    
    Column(modifier = modifier.fillMaxWidth().fillMaxHeight()) {
        Text("🏆 GLOBAL GAMBIT LEADERBOARD (TOP 10K)", color = BrandGold, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(12.dp))
        
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text("RANK/USER", color = theme.textSecondary, fontSize = 9.sp, modifier = Modifier.weight(1.5f))
            Text("BAL/WAGERS", color = theme.textSecondary, fontSize = 9.sp, modifier = Modifier.weight(1f))
            Text("HOURS", color = theme.textSecondary, fontSize = 9.sp, modifier = Modifier.weight(0.5f))
        }
        
        Spacer(Modifier.height(4.dp))
        Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(theme.borderBrush))
        Spacer(Modifier.height(4.dp))
        
        LazyColumn(
            modifier = Modifier.fillMaxWidth().weight(1f)
        ) {
            itemsIndexed(users) { index, user ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 8.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(modifier = Modifier.weight(1.5f), verticalAlignment = Alignment.CenterVertically) {
                        Text("#${index + 1}", color = if (index < 3) BrandGold else theme.textSecondary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        Spacer(Modifier.width(8.dp))
                        Text(user.username, color = theme.textPrimary, fontSize = 11.sp)
                    }
                    
                    Column(modifier = Modifier.weight(1f)) {
                        Text("${user.madxBalance.toInt()} MADx", color = theme.brandPrimary, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        Text("${user.successfulWagers} Wins", color = NeonCyan, fontSize = 9.sp)
                    }
                    
                    Text("${user.timeOnPlatformHours}h", color = theme.textSecondary, fontSize = 10.sp, modifier = Modifier.weight(0.5f))
                }
                if (index < users.size - 1) {
                    Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(theme.borderBrush))
                }
            }
        }
    }
}
