package com.example.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.*
import kotlinx.coroutines.delay
import java.util.Calendar
import kotlin.math.cos
import kotlin.math.sin

@Composable
fun SeikoClockWidget() {
    var isFlipMode by remember { mutableStateOf(false) }
    var showCustomize by remember { mutableStateOf(false) }
    var statIndex by remember { mutableStateOf(0) }
    var time by remember { mutableStateOf(Calendar.getInstance()) }

    LaunchedEffect(Unit) {
        var ticks = 0
        while (true) {
            time = Calendar.getInstance()
            ticks++
            if (ticks % 4 == 0) {
                statIndex = (statIndex + 1) % 2 // Alternate stats every 4s
            }
            delay(1000)
        }
    }

    data class DashboardData(
        val watchStatTitle: String,
        val watchStatValue: String,
        val watchStatProgress: Float,
        val digitalStat1Title: String,
        val digitalStat1Value: String,
        val digitalStat2Title: String,
        val digitalStat2Value: String
    )

    val dashboardDatasets = listOf(
        DashboardData("MARKET HEAT", "☣️ 84%", 0.84f, "24H VOL", "$12.4M", "MAD STREAK", "8"),
        DashboardData("USER RANK", "#142", 0.60f, "WIN RATE", "64.2%", "OPEN POOLS", "24")
    )
    
    val currentStats = dashboardDatasets[statIndex]

    val infiniteTransition = rememberInfiniteTransition()
    val pulse by infiniteTransition.animateFloat(
        initialValue = 0.8f,
        targetValue = 1.2f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        )
    )

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(210.dp)
            .shadow(elevation = 24.dp, RoundedCornerShape(24.dp), spotColor = NeonCyan.copy(alpha=0.18f))
            .background(BgCard.copy(alpha = 0.4f), RoundedCornerShape(24.dp))
            .border(1.dp, GoldFlakeBrush, RoundedCornerShape(24.dp))
            .pointerInput(Unit) {
                detectTapGestures(
                    onTap = { showCustomize = true },
                    onLongPress = { isFlipMode = !isFlipMode }
                )
            },
        contentAlignment = Alignment.Center
    ) {
        if (isFlipMode) {
            // Flip Clock Mode
            Row(
                modifier = Modifier.fillMaxSize().padding(16.dp),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                FlipCard(value = "45K", label = "ACTIVE USERS")
                FlipCard(value = "92%", label = "SHIELD RATIO")
                FlipCard(value = "1.4M", label = "MADx STAKED")
            }
            Text("SEIKO RETRO", color = Color.Gray, fontSize = 10.5.sp, letterSpacing = 2.sp, modifier = Modifier.align(Alignment.TopCenter).padding(8.dp))
        } else {
            // Analogue Clock Mode
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Start,
                modifier = Modifier.fillMaxSize().padding(horizontal = 24.dp, vertical = 2.dp)
            ) {
                // Analog Clock Face (left aligned)
                Box(
                    modifier = Modifier
                        .size(150.dp)
                        .background(Color(0xFF0A0A0A), CircleShape)
                        .border(1.dp, GoldFlakeBrush, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Canvas(modifier = Modifier.fillMaxSize()) {
                        val radius = size.minDimension / 2
                        val center = Offset(size.width / 2, size.height / 2)
                        for (i in 0 until 60) {
                            val angle = Math.PI * 2 * i / 60 - Math.PI / 2
                            val innerRadius = if (i % 5 == 0) radius - 15f else radius - 8f
                            val stroke = if (i % 5 == 0) 3f else 1f
                            val color = if (i % 5 == 0) GlowWhite else Color.DarkGray
                            drawLine(color = color, start = Offset(center.x + innerRadius * cos(angle.toFloat()), center.y + innerRadius * sin(angle.toFloat())), end = Offset(center.x + radius * cos(angle.toFloat()), center.y + radius * sin(angle.toFloat())), strokeWidth = stroke)
                        }
                        
                        // 2D stat progress arc
                        drawArc(
                            color = NeonMagenta.copy(alpha = pulse),
                            startAngle = -90f,
                            sweepAngle = 360f * currentStats.watchStatProgress,
                            useCenter = false,
                            style = androidx.compose.ui.graphics.drawscope.Stroke(width = 12f, cap = StrokeCap.Round),
                            topLeft = Offset(center.x - radius * 0.6f, center.y - radius * 0.6f),
                            size = androidx.compose.ui.geometry.Size(radius * 1.2f, radius * 1.2f)
                        )
                    }

                    Column(
                        modifier = Modifier.align(Alignment.Center),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(currentStats.watchStatValue, color = BrandEggwhite, fontSize = 24.sp, fontWeight = FontWeight.Black, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                        Spacer(Modifier.height(2.dp))
                        Text(currentStats.watchStatTitle, color = NeonCyan, fontSize = 10.5.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontWeight = FontWeight.Bold)
                    }

                    Column(
                        modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(text = "SEIKO", color = BrandGold.copy(alpha=0.6f), fontSize = 10.5.sp, fontWeight = FontWeight.ExtraBold, letterSpacing = 2.sp)
                    }
                }
                
                Spacer(Modifier.weight(1f))
                
                // Side digital rotating stats (enlarged)
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = currentStats.digitalStat1Value,
                        color = NeonCyan,
                        fontSize = 36.sp,
                        fontFamily = com.example.ui.theme.ArialNarrowFamily,
                        fontWeight = FontWeight.Black,
                        style = androidx.compose.ui.text.TextStyle(
                            shadow = androidx.compose.ui.graphics.Shadow(NeonCyan.copy(alpha=0.3f), blurRadius = 24f)
                        )
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(currentStats.digitalStat1Title, color = Color.LightGray, fontSize = 13.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                    
                    Box(Modifier.padding(vertical = 16.dp).height(2.dp).width(80.dp).background(NeonMagenta))
                    
                    Text(
                        text = currentStats.digitalStat2Value,
                        color = BrandGold,
                        fontSize = 30.sp,
                        fontFamily = com.example.ui.theme.ArialNarrowFamily,
                        fontWeight = FontWeight.Black,
                        style = androidx.compose.ui.text.TextStyle(
                            shadow = androidx.compose.ui.graphics.Shadow(BrandGoldGlow, blurRadius = 12f)
                        )
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(currentStats.digitalStat2Title, color = Color.LightGray, fontSize = 13.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                }
            }
        }
    }

    if (showCustomize) {
        androidx.compose.material3.AlertDialog(
            onDismissRequest = { showCustomize = false },
            containerColor = BgPanel,
            title = { Text("Dopamine & Telemetry Report", color = BrandEggwhite, fontWeight = FontWeight.Bold) },
            text = {
                Column {
                    Text("Expanded metrics covering your current dopamine loops and neural rewards.", color = Color.LightGray, fontSize = 14.sp)
                    Spacer(Modifier.height(12.dp))
                    Text("• ${currentStats.digitalStat1Title}: ${currentStats.digitalStat1Value}\n• ${currentStats.digitalStat2Title}: ${currentStats.digitalStat2Value}\n• ${currentStats.watchStatTitle}: ${currentStats.watchStatValue}\n\n*These metrics adapt dynamically to platform activity and alpha streams.*", color = NeonCyan, fontSize = 12.sp, lineHeight = 20.sp)
                }
            },
            confirmButton = {
                androidx.compose.material3.TextButton(onClick = { showCustomize = false }) {
                    Text("CLOSE", color = NeonMagenta, fontWeight = FontWeight.Bold)
                }
            }
        )
    }
}

@Composable
fun FlipCard(value: String, label: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Box(
            modifier = Modifier
                .size(90.dp, 100.dp)
                .background(Color.Black, RoundedCornerShape(12.dp))
                .border(1.dp, BrandGold, RoundedCornerShape(12.dp)),
            contentAlignment = Alignment.Center
        ) {
            Column(Modifier.fillMaxSize()) {
                Box(Modifier.weight(1f).fillMaxWidth().background(Color(0xFF222222), RoundedCornerShape(topStart = 12.dp, topEnd = 12.dp))) // Top half
                Box(Modifier.height(4.dp).fillMaxWidth().background(Color.Black)) // Divider
                Box(Modifier.weight(1f).fillMaxWidth().background(Color(0xFF181818), RoundedCornerShape(bottomStart = 12.dp, bottomEnd = 12.dp))) // Bottom half
            }
            Text(
                value, 
                color = BrandEggwhite, 
                fontSize = 28.sp, 
                fontWeight = FontWeight.Black, 
                fontFamily = com.example.ui.theme.ArialNarrowFamily,
                style = androidx.compose.ui.text.TextStyle(
                    shadow = androidx.compose.ui.graphics.Shadow(BrandGoldGlow, blurRadius = 24f)
                )
            )
        }
        Spacer(Modifier.height(12.dp))
        Text(label, color = NeonCyan, fontSize = 11.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
    }
}
