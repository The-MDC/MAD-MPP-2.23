package com.example.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import kotlinx.coroutines.delay

/**
 * Represent a single particle of the Dopamine Burst explosion effect.
 */
data class ExplosionParticle(
    val x: Float,
    val y: Float,
    val vx: Float,
    val vy: Float,
    val size: Float,
    val color: Color,
    val alpha: Float
)

/**
 * Jetpack Compose implementation of a particle explosion simulating reactive Framework Motion/CSS dopamine burst
 * when triggering extreme prediction/conviction behaviors (beyond 80% slider threshold).
 */
@Composable
fun DopamineBurstEffect(
    trigger: Boolean,
    onAnimationEnd: () -> Unit,
    modifier: Modifier = Modifier
) {
    if (!trigger) return

    val particles = remember { mutableStateListOf<ExplosionParticle>() }

    LaunchedEffect(trigger) {
        particles.clear()
        
        // Spawn 35-45 hyper-energetic visual particles
        val count = 40
        for (i in 0 until count) {
            val angle = Math.random() * 2 * Math.PI
            val speed = (6..22).random().toFloat()
            particles.add(
                ExplosionParticle(
                    x = 0f,
                    y = 0f,
                    vx = (Math.cos(angle) * speed).toFloat(),
                    vy = (Math.sin(angle) * speed).toFloat(),
                    size = (6..18).random().toFloat(),
                    color = listOf(
                        Color(0xFFFF007F), // Neon Pink/Magenta
                        Color(0xFF00E5FF), // Cyber Cyan
                        Color(0xFFFFD700), // Gilded Clout Gold
                        Color(0xFF00FF41), // Sentient Neon Green
                        Color(0xFFD4A017)  // Brass Bronze
                    ).random(),
                    alpha = 1.0f
                )
            )
        }

        // Precise physics delta simulation loop (running for 1.3 seconds at high visual frame rates)
        val durationMs = 1300L
        val startTime = System.currentTimeMillis()
        
        while (System.currentTimeMillis() - startTime < durationMs) {
            val elapsed = System.currentTimeMillis() - startTime
            val progress = elapsed.toFloat() / durationMs
            
            for (idx in particles.indices) {
                val p = particles[idx]
                // Apply visual expansion and drag factor slowdown
                val dragMultiplier = 1.0f - (progress * 0.45f)
                particles[idx] = p.copy(
                    x = p.vx * elapsed * 0.18f * dragMultiplier,
                    y = p.vy * elapsed * 0.18f * dragMultiplier,
                    alpha = (1.0f - progress).coerceIn(0f, 1f)
                )
            }
            delay(16) // ~60 FPS tick rate
        }
        
        particles.clear()
        onAnimationEnd()
    }

    if (particles.isNotEmpty()) {
        Canvas(modifier = modifier.fillMaxSize()) {
            val centerPoint = center
            particles.forEach { p ->
                drawCircle(
                    color = p.color.copy(alpha = p.alpha),
                    radius = p.size,
                    center = centerPoint.copy(
                        x = centerPoint.x + p.x,
                        y = centerPoint.y + p.y
                    )
                )
            }
        }
    }
}
