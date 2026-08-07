package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import com.example.ui.theme.*
import com.example.viewmodel.GambitViewModel

@Composable
fun GambitUpdatesSidebar(vm: GambitViewModel, onClose: () -> Unit) {
    val state by vm.state.collectAsState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.5f))
            .padding(start = 64.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0x4D706050), RoundedCornerShape(topStart = 16.dp, bottomStart = 16.dp))
                .border(1.dp, GoldFlakeBrush, RoundedCornerShape(topStart = 16.dp, bottomStart = 16.dp))
                .padding(16.dp)
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("GAMBIT UPDATES", color = BrandGold, fontSize = 20.sp, fontWeight = FontWeight.Black, fontFamily = AllertaStencilFamily)
                    androidx.compose.material3.IconButton(onClick = onClose) {
                        androidx.compose.material3.Icon(Icons.Default.Close, contentDescription = "Close", tint = BrandGold)
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))

                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    if (state.rewardNotifications.isEmpty() && state.volatilityToasts.isEmpty()) {
                        item {
                            Text("No active system notifications.", color = Color.Gray, fontSize = 14.sp)
                        }
                    }
                    
                    items(state.rewardNotifications) { notification ->
                        NotificationCard(
                            title = "✨ REWARD",
                            message = notification.message,
                            detail = "+${"%.2f".format(notification.amount)} \$MADx (Fibonacci Surge Level ${notification.fibonacciIndex})",
                            color = BrandGold,
                            highlight = NeonGreen
                        )
                    }
                    
                    items(state.volatilityToasts) { toast ->
                        NotificationCard(
                            title = "⚠️ VOLATILITY ALERT",
                            message = toast.text,
                            detail = "Severity: ${"%.1f".format(toast.volatilityScore)}",
                            color = BrandCrimson,
                            highlight = NeonPink
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun NotificationCard(title: String, message: String, detail: String, color: Color, highlight: Color) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0x4D706050), RoundedCornerShape(13.dp))
            .padding(1.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xFF0F1A15), RoundedCornerShape(12.dp))
                .border(1.dp, color.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
                .padding(horizontal = 16.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = title,
                color = color,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = ArialNarrowFamily,
                letterSpacing = 1.sp,
                modifier = Modifier.width(80.dp)
            )
            
            Column {
                Text(
                    text = message,
                    color = Color.White,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium
                )
                Text(
                    text = detail,
                    color = highlight,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
            }
        }
    }
}
