package com.example.ui.components

import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.LocalGambitTheme
import com.example.ui.theme.BrandGold
import com.example.ui.theme.BrandCrimson
import com.example.ui.theme.NeonGreen
import com.example.ui.theme.NeonPink
import com.example.ui.theme.NeonCyan

@Composable
fun WagerConfirmationDialog(
    isOpen: Boolean,
    onConfirm: () -> Unit,
    onCancel: () -> Unit,
    amount: Double,
    scenarioName: String,
    outcome: String
) {
    if (!isOpen) return
    val theme = LocalGambitTheme.current
    
    var showAnimation by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        showAnimation = true
    }

    val animatedProgress by animateFloatAsState(
        targetValue = if (showAnimation) 1f else 0f,
        animationSpec = spring(stiffness = Spring.StiffnessLow),
        label = "perp_gains_anim"
    )
    
    AlertDialog(
        onDismissRequest = onCancel,
        containerColor = theme.bgDeep,
        shape = RoundedCornerShape(12.dp),
        title = {
            Text(
                text = "⚡ CONVICTION WAGER CONFIRMATION",
                color = theme.brandSecondary,
                fontSize = 14.sp,
                fontWeight = FontWeight.Black
            )
        },
        text = {
            Column {
                Text(
                    text = "You are about to commit your Gambit Tokens to the prediction neural mesh.",
                    color = theme.textSecondary,
                    fontSize = 11.sp
                )
                Spacer(Modifier.height(16.dp))
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(theme.bgCard, RoundedCornerShape(8.dp))
                        .border(1.dp, theme.borderBrush, RoundedCornerShape(8.dp))
                        .padding(12.dp)
                ) {
                    Text(text = "TARGET CLUSTER:", color = theme.textSecondary, fontSize = 9.sp)
                    Text(text = scenarioName, color = theme.textPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(8.dp))
                    
                    Text(text = "STANCE:", color = theme.textSecondary, fontSize = 9.sp)
                    Text(text = outcome, color = if(outcome == "YES" || outcome == "BULL") NeonGreen else BrandCrimson, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(8.dp))
                    
                    Text(text = "COMMITMENT:", color = theme.textSecondary, fontSize = 9.sp)
                    Text(text = "${amount.toInt()} MADx", color = BrandGold, fontSize = 14.sp, fontWeight = FontWeight.Black)
                    
                    Spacer(Modifier.height(12.dp))
                    Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(theme.borderBrush))
                    Spacer(Modifier.height(12.dp))
                    
                    Text(text = "📈 POTENTIAL CONVICTION PERP GAINS:", color = NeonCyan, fontSize = 9.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                    Spacer(Modifier.height(6.dp))
                    
                    // Colorful linear bar lines for perp gains
                    Canvas(modifier = Modifier.fillMaxWidth().height(24.dp)) {
                        val maxGainWidth = size.width * 0.85f
                        val currentWidth = maxGainWidth * animatedProgress
                        
                        // Background track
                        drawRoundRect(
                            color = Color.DarkGray.copy(alpha = 0.5f),
                            size = Size(size.width, size.height),
                            cornerRadius = CornerRadius(4.dp.toPx(), 4.dp.toPx())
                        )
                        
                        // Animated Gain bar
                        drawRoundRect(
                            brush = Brush.horizontalGradient(
                                colors = listOf(NeonPink, NeonCyan, NeonGreen)
                            ),
                            size = Size(currentWidth, size.height),
                            cornerRadius = CornerRadius(4.dp.toPx(), 4.dp.toPx())
                        )
                        
                        // Mock markers
                        for(i in 1..4) {
                            val xPos = size.width * (i * 0.2f)
                            drawLine(
                                color = Color.White.copy(alpha = 0.3f),
                                start = Offset(xPos, 0f),
                                end = Offset(xPos, size.height),
                                strokeWidth = 1.dp.toPx()
                            )
                        }
                    }
                    Spacer(Modifier.height(4.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("1x", color = theme.textSecondary, fontSize = 8.sp)
                        Text(text = "+${(amount * 2.45 * animatedProgress).toInt()} MADx (2.45x)", color = NeonGreen, fontSize = 9.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                        Text("Max (3x)", color = theme.textSecondary, fontSize = 8.sp)
                    }
                }
                Spacer(Modifier.height(12.dp))
                Text(
                    text = "Warning: Smart contracts are immutable. Volatility may cause rapid liquidations.",
                    color = BrandCrimson,
                    fontSize = 9.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = onConfirm,
                colors = ButtonDefaults.buttonColors(containerColor = theme.brandPrimary),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("EXECUTE", color = theme.bgDeep, fontWeight = FontWeight.Black, fontSize = 11.sp)
            }
        },
        dismissButton = {
            TextButton(onClick = onCancel) {
                Text("ABORT", color = theme.textSecondary, fontSize = 11.sp)
            }
        }
    )
}
