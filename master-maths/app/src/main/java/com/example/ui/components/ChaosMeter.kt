package com.example.ui.components
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.unit.dp
import com.example.ui.theme.NeonCyan
import com.example.ui.theme.NeonGreen
import com.example.ui.theme.NeonPink

import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.example.ui.theme.BrandGold
import com.example.ui.theme.NeonPink

@Composable
fun ChaosMeter(volatility: Float, modifier: Modifier = Modifier) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = modifier) {
        // Outer title matching image styling
        Text(
            "CHAOS METER", 
            color = Color.White, 
            fontSize = 14.sp, 
            fontWeight = FontWeight.ExtraBold, 
            fontFamily = FontFamily.Monospace,
            letterSpacing = 1.5.sp
        )
        Spacer(Modifier.height(8.dp))
        
        Box(Modifier.size(190.dp), contentAlignment = Alignment.Center) {
            // Centered stacked labels inside the gauge
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
                modifier = Modifier.padding(bottom = 12.dp)
            ) {
                Text(
                    "CHAOS",
                    color = Color.White,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.SansSerif,
                    letterSpacing = 1.sp
                )
                Text(
                    "METER",
                    color = Color.White,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.SansSerif,
                    letterSpacing = 1.sp
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    "σ = ${"%.3f".format(volatility)}",
                    color = NeonPink,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
            }

            Canvas(Modifier.fillMaxSize()) {
                if (size.width < 12f || size.height < 12f) return@Canvas
                val sw = 14f
                val padding = 20f
                val arcSize = Size(size.width - padding * 2, size.height - padding * 2)
                val tl = Offset(padding, padding)
                
                // 1. Draw inactive background arc
                drawArc(
                    color = Color.White.copy(alpha = 0.08f), 
                    startAngle = 180f, 
                    sweepAngle = 180f, 
                    useCenter = false, 
                    topLeft = tl, 
                    size = arcSize,
                    style = Stroke(sw, cap = StrokeCap.Round)
                )
                
                // 2. Beautiful Yellow-to-Fuchsia-to-Purple Gradient Sweep Brush matching image
                val colors = listOf(
                    BrandGold,                  // Start: Yellow/Gold
                    Color(0xFFFF4500),          // Mid: Neon Orange
                    NeonPink,                   // Mid-High: Hot pink fuchsia
                    Color(0xFF8B00FF),          // High: Bright purple
                    Color(0xFF8B00FF)
                )
                
                // We use linear gradient or simple sweep for semi-circle
                val activeSweep = volatility.coerceIn(0f, 1f) * 180f
                
                val brush = Brush.sweepGradient(
                    colors = colors,
                    center = Offset(size.width / 2f, size.height / 2f)
                )
                
                rotate(degrees = 180f) {
                    drawArc(
                        brush = brush, 
                        startAngle = 0f, 
                        sweepAngle = activeSweep, 
                        useCenter = false, 
                        topLeft = tl, 
                        size = arcSize,
                        style = Stroke(sw, cap = StrokeCap.Round)
                    )
                }
                
                // 3. Glowing neon pointer needle
                val radius = (size.width - padding * 2) / 2f
                val needleAngleRad = Math.toRadians((180f + activeSweep).toDouble())
                val needleEndX = (size.width / 2f) + radius * Math.cos(needleAngleRad).toFloat()
                val needleEndY = (size.height / 2f) + radius * Math.sin(needleAngleRad).toFloat()
                
                // Inner glow backing line
                drawLine(
                    color = NeonPink.copy(alpha = 0.7f),
                    start = Offset(size.width / 2f, size.height / 2f),
                    end = Offset(needleEndX, needleEndY),
                    strokeWidth = 7f,
                    cap = StrokeCap.Round
                )
                
                // Main pointer line
                drawLine(
                    color = Color.White,
                    start = Offset(size.width / 2f, size.height / 2f),
                    end = Offset(needleEndX, needleEndY),
                    strokeWidth = 3f,
                    cap = StrokeCap.Round
                )
                
                // Needle hub
                drawCircle(
                    color = Color.White,
                    radius = 5f,
                    center = Offset(size.width / 2f, size.height / 2f)
                )
            }
            
            // "0" label (left base)
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(start = 18.dp, bottom = 12.dp),
                contentAlignment = Alignment.BottomStart
            ) {
                Text(
                    "0", 
                    color = BrandGold, 
                    fontSize = 11.sp, 
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
            }
            
            // "MAX" label (right base)
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(end = 12.dp, bottom = 12.dp),
                contentAlignment = Alignment.BottomEnd
            ) {
                Text(
                    "MAX", 
                    color = Color(0xFF8B00FF), 
                    fontSize = 11.sp, 
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
            }
        }
    }
}
