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

@Composable
fun ChaosMeter(volatility: Float, modifier: Modifier = Modifier) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = modifier) {
        Text("CHAOS METER (GARCH σ)", color = NeonCyan)
        Spacer(Modifier.height(8.dp))
        Box(Modifier.size(200.dp), contentAlignment = Alignment.Center) {
            Canvas(Modifier.size(200.dp)) {
                if (size.width < 12f || size.height < 12f) return@Canvas
                val sw = 12f
                val arc = Size(size.width - sw, size.height - sw)
                val tl = Offset(sw/2, sw/2)
                drawArc(Color.White.copy(alpha=0.1f), 180f, 180f, false, tl, arc,
                        style = Stroke(sw, cap = StrokeCap.Round))
                val brush = Brush.sweepGradient(listOf(NeonGreen, NeonCyan, NeonPink, Color(0xFFFF073A)))
                drawArc(brush, 180f, volatility * 180f, false, tl, arc,
                        style = Stroke(sw, cap = StrokeCap.Round))
                rotate(degrees = -90f + (volatility * 180f)) {
                    drawLine(Color.White,
                        Offset(size.width/2, size.height/2),
                        Offset(size.width/2, 10f),
                        strokeWidth = 4f, cap = StrokeCap.Round)
                }
            }
        }
        Spacer(Modifier.height(4.dp))
        Text("σ = ${"%.3f".format(volatility)}", color = NeonPink)
    }
}
