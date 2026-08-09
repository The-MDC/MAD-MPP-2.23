package com.example.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import com.example.ui.theme.AsgaardGoldBrush
import kotlin.random.Random

data class StardustParticle(
    var xRatio: Float,
    var yRatio: Float,
    val size: Float,
    val speed: Float,
    val alpha: Float,
    val isGold: Boolean
)

@Composable
fun GoldStardustBackground(
    modifier: Modifier = Modifier,
    drawSolidBg: Boolean = false
) {
    var particles by remember {
        mutableStateOf(
            List(60) {
                StardustParticle(
                    xRatio = Random.nextFloat(),
                    yRatio = Random.nextFloat(),
                    size = Random.nextFloat() * 4f + 1f,
                    speed = Random.nextFloat() * 0.001f + 0.0005f,
                    alpha = Random.nextFloat() * 0.6f + 0.1f,
                    isGold = Random.nextBoolean()
                )
            }
        )
    }

    val infiniteTransition = rememberInfiniteTransition(label = "stardust_transition")
    val time by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(10000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "stardust_time"
    )

    Canvas(modifier = modifier.fillMaxSize()) {
        val w = size.width
        val h = size.height
        
        if (drawSolidBg) {
            // Deep Space Solid background behind everything
            drawRect(color = Color(0xFF030510))
        }
        
        particles.forEach { p ->
            // Move particle up slowly
            val animatedY = (p.yRatio - time * p.speed * 50f)
            val currentY = if (animatedY < 0f) animatedY + 1f else animatedY
            
            // X drifts slightly with sine wave
            val drift = kotlin.math.sin((time * Math.PI * 2) + p.size) * 0.02f
            var currentX = p.xRatio + drift.toFloat()
            if (currentX < 0f) currentX += 1f
            if (currentX > 1f) currentX -= 1f

            val color = if (p.isGold) {
                Color(0xFFFFEA7C).copy(alpha = p.alpha)
            } else {
                Color.White.copy(alpha = p.alpha * 0.5f)
            }
            
            drawCircle(
                color = color,
                radius = p.size,
                center = Offset(currentX * w, currentY * h)
            )
        }
    }
}
