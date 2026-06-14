package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.LocalGambitTheme
import com.example.ui.theme.NeonGreen
import com.example.viewmodel.GambitViewModel
import kotlinx.coroutines.delay

@Composable
fun MadCreditHeaderWidget(vm: GambitViewModel) {
    val state by vm.state.collectAsState()
    val theme = LocalGambitTheme.current
    val balance = state.madxBalance
    val lastWin = state.lastWinTimestamp
    
    // Check if won in last 24h
    var hasRecentWin by remember { mutableStateOf(false) }

    LaunchedEffect(lastWin) {
        if (lastWin != null) {
            val now = System.currentTimeMillis()
            val diff = now - lastWin
            hasRecentWin = diff <= 24L * 60 * 60 * 1000 // 24 hours
        } else {
            hasRecentWin = false
        }
    }

    // Refresh every minute to potentially drop the glow
    LaunchedEffect(Unit) {
        while (true) {
            delay(60000)
            if (lastWin != null) {
                val now = System.currentTimeMillis()
                val diff = now - lastWin
                hasRecentWin = diff <= 24L * 60 * 60 * 1000
            }
        }
    }

    val glowColor = if (hasRecentWin) NeonGreen else theme.brandSecondary

    Box(
        modifier = Modifier
            .padding(horizontal = 8.dp)
            .height(36.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(Color.Black.copy(alpha = 0.3f))
            .border(
                width = if (hasRecentWin) 1.5.dp else 1.dp,
                color = if (hasRecentWin) glowColor.copy(alpha = 0.8f) else glowColor.copy(alpha = 0.3f),
                shape = RoundedCornerShape(12.dp)
            )
            .padding(horizontal = 12.dp, vertical = 6.dp),
        contentAlignment = Alignment.Center
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Text(
                "MΛD",
                color = theme.brandSecondary,
                fontSize = 11.sp,
                fontWeight = FontWeight.Black,
                fontFamily = FontFamily.Monospace,
                style = androidx.compose.ui.text.TextStyle(
                    shadow = androidx.compose.ui.graphics.Shadow(
                        color = theme.brandSecondary.copy(alpha = 0.5f),
                        blurRadius = 4f
                    )
                )
            )
            Text(
                "$${"%.2f".format(balance)}",
                color = theme.textPrimary,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
                style = androidx.compose.ui.text.TextStyle(
                    shadow = if (hasRecentWin) androidx.compose.ui.graphics.Shadow(
                        color = NeonGreen.copy(alpha = 0.6f),
                        blurRadius = 8f
                    ) else null
                )
            )
        }
    }
}
