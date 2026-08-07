package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.BrandCrimson
import com.example.ui.theme.NeonGreen
import com.example.ui.theme.NeonCyan
import kotlinx.coroutines.delay
import kotlin.random.Random

@Composable
fun EigenTrustVisualLogs() {
    val logs = remember { mutableStateListOf<String>() }
    
    LaunchedEffect(Unit) {
        val actions = listOf("CONNECT", "BID", "VOTE", "TX", "AUTH")
        val reasons = listOf("SYBIL SWARM", "BOT SIGNATURE", "IP VELOCITY", "LOW PHI-RATIO", "GARCH ANOMALY")
        
        while(true) {
            if (Random.nextFloat() > 0.4f) {
                val isReject = Random.nextFloat() > 0.7f
                val wallet = "0x${(1000..9999).random()}...${(100..999).random()}"
                val ms = System.currentTimeMillis() % 100000
                if (isReject) {
                    logs.add(0, "[${ms}] 🚨 REJECT: $wallet | ${actions.random()} | ${reasons.random()}")
                } else {
                    logs.add(0, "[${ms}] 🟢 VERIFIED: $wallet | ${actions.random()} | EIGENTRUST OK")
                }
                
                if (logs.size > 5) logs.removeLast()
            }
            delay((400..1200).random().toLong())
        }
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.Black.copy(alpha = 0.6f), RoundedCornerShape(12.dp))
            .border(1.dp, Color.DarkGray, RoundedCornerShape(12.dp))
            .padding(12.dp)
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    "🛡️ EIGENTRUST BOT MITIGATION",
                    color = NeonCyan,
                    fontSize = 11.sp,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    "ACTIVE",
                    color = NeonGreen,
                    fontSize = 9.sp,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                if (logs.isEmpty()) {
                    Text("Initializing stochastic coroutines...", color = Color.Gray, fontSize = 9.sp, fontFamily = FontFamily.Monospace)
                } else {
                    logs.forEach { log ->
                        val isReject = log.contains("REJECT")
                        Text(
                            text = log,
                            color = if (isReject) BrandCrimson else Color.LightGray,
                            fontSize = 9.sp,
                            fontFamily = FontFamily.Monospace,
                            fontWeight = if (isReject) FontWeight.Bold else FontWeight.Normal
                        )
                    }
                }
            }
        }
    }
}
