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

import androidx.compose.foundation.clickable
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon

@Composable
fun MadCreditHeaderWidget(vm: GambitViewModel) {
    val state by vm.state.collectAsState()
    val theme = LocalGambitTheme.current
    val balance = state.madxBalance
    val lastWin = state.lastWinTimestamp
    val currentChainId by vm.web3Service.currentChainId.collectAsState()
    var showNetworkMenu by remember { mutableStateOf(false) }
    
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

    Row(verticalAlignment = Alignment.CenterVertically) {
        // Network selector
        Box {
            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .background(Color.Black.copy(alpha=0.3f))
                    .border(1.dp, theme.brandSecondary.copy(alpha=0.2f), RoundedCornerShape(8.dp))
                    .clickable { showNetworkMenu = true }
                    .padding(horizontal = 8.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                val chainName = when (currentChainId) {
                    8453 -> "BASE"
                    42161 -> "ARB"
                    1329 -> "SEI"
                    else -> "CHAIN"
                }
                Text(chainName, color = theme.brandSecondary, fontSize = 10.sp, fontWeight = FontWeight.Black)
                Icon(Icons.Filled.KeyboardArrowDown, contentDescription = "Select Network", modifier = Modifier.size(14.dp), tint = theme.brandSecondary)
            }
            
            DropdownMenu(
                expanded = showNetworkMenu,
                onDismissRequest = { showNetworkMenu = false },
                modifier = Modifier.background(theme.bgCard)
            ) {
                DropdownMenuItem(
                    text = { Text("Base (8453)", color = theme.textPrimary) },
                    onClick = { vm.switchNetwork(8453); showNetworkMenu = false }
                )
                DropdownMenuItem(
                    text = { Text("Arbitrum (42161)", color = theme.textPrimary) },
                    onClick = { vm.switchNetwork(42161); showNetworkMenu = false }
                )
                DropdownMenuItem(
                    text = { Text("SEI (1329)", color = theme.textPrimary) },
                    onClick = { vm.switchNetwork(1329); showNetworkMenu = false }
                )
            }
        }
        
        Spacer(modifier = Modifier.width(6.dp))

        Box(
            modifier = Modifier
                .padding(end = 8.dp)
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
}
