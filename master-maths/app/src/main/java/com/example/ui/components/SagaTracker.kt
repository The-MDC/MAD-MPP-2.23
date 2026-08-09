package com.example.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.SagaProgressEntity
import com.example.ui.theme.LocalGambitTheme

/**
 * SagaTracker visualizes Chapter progress through Marketplace Sagas.
 * It maps saga progress to a high-fidelity visual circular progress gauge
 * that performs dynamic color shifts as users cross key milestones.
 */
@Composable
fun SagaTracker(
    sagaList: List<SagaProgressEntity>,
    activeChapterId: Int,
    onSelectChapter: (Int) -> Unit,
    modifier: Modifier = Modifier
) {
    val theme = LocalGambitTheme.current
    val activeSaga = sagaList.find { it.chapterId == activeChapterId } ?: sagaList.firstOrNull()

    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(Brush.verticalGradient(listOf(theme.bgCard, theme.bgCard.copy(alpha = 0.85f))))
            .border(1.dp, theme.borderBrush, RoundedCornerShape(14.dp))
            .padding(16.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "📖 MARKETPLACE SAGAS PROGRESS",
                        color = theme.brandSecondary,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = FontFamily.Monospace
                    )
                    Text(
                        text = "Predictive trading milestones & campaign tracking hubs",
                        color = theme.textSecondary,
                        fontSize = 9.5.sp
                    )
                }

                Box(
                    modifier = Modifier
                        .background(theme.brandPrimary.copy(alpha = 0.15f), RoundedCornerShape(4.dp))
                        .border(1.dp, theme.brandPrimary.copy(alpha = 0.4f), RoundedCornerShape(4.dp))
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = "ORACLE CONVERGENCE",
                        color = theme.brandPrimary,
                        fontSize = 8.5.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }

            // Chapter Chips row
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                items(sagaList) { saga ->
                    val isSelected = activeChapterId == saga.chapterId
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(if (isSelected) theme.brandSecondary.copy(alpha = 0.18f) else Color.Black.copy(alpha=0.3f))
                            .border(1.dp, if (isSelected) theme.brandSecondary else Color.DarkGray, RoundedCornerShape(6.dp))
                            .clickable { onSelectChapter(saga.chapterId) }
                            .padding(horizontal = 10.dp, vertical = 6.dp)
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = "Ch.${saga.chapterId}",
                                color = if (isSelected) theme.brandSecondary else Color.Gray,
                                fontSize = 8.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace
                            )
                            Text(
                                text = saga.title.take(12) + "...",
                                color = if (isSelected) Color.White else Color.Gray,
                                fontSize = 9.5.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }

            if (activeSaga != null) {
                // Main Visualization Row: Left Circular Progress Canvas, Right Statistics and Milestones
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color.Black.copy(alpha = 0.25f), RoundedCornerShape(10.dp))
                        .padding(14.dp),
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    
                    // Circular Gauge with Dynamic Color Shift Milestone
                    val percentage = activeSaga.completionPercentage
                    val sweepAngleAnimation by animateFloatAsState(
                        targetValue = (percentage / 100f) * 360f,
                        animationSpec = tween(durationMillis = 800, easing = FastOutSlowInEasing)
                    )

                    // Determine shifting color category based on progression milestones
                    val targetMilestoneColor = when {
                        percentage < 30f -> Color(0xFFCCAA88)  // Copper Tier
                        percentage < 60f -> Color(0xFF00E5FF)  // Silver / Cyber Cyan Tier
                        percentage < 85f -> Color(0xFFFFD700)  // Golden Hand / Clout Gold Tier
                        else -> Color(0xFFFF007F)              // Mythic Magenta Supreme Tier
                    }

                    val milestoneLabel = when {
                        percentage < 30f -> "BEGINNER COGNIZANCE"
                        percentage < 60f -> "TACTICAL EXPANSION"
                        percentage < 85f -> "CONSENSUS GENERATOR"
                        else -> "DECENTRALIZED ORACLE SUPREME"
                    }

                    val animatedGaugeColor by animateColorAsState(
                        targetValue = targetMilestoneColor,
                        animationSpec = tween(durationMillis = 500)
                    )

                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.padding(2.dp)
                    ) {
                        Box(
                            contentAlignment = Alignment.Center,
                            modifier = Modifier.size(90.dp)
                        ) {
                            // Circular Gauge Drawing
                            Canvas(modifier = Modifier.size(90.dp)) {
                                // Background circle
                                drawCircle(
                                    color = Color.DarkGray.copy(alpha = 0.35f),
                                    style = Stroke(width = 8.dp.toPx(), cap = StrokeCap.Round)
                                )
                                // Active Progress Arc
                                drawArc(
                                    color = animatedGaugeColor,
                                    startAngle = -90f,
                                    sweepAngle = sweepAngleAnimation,
                                    useCenter = false,
                                    style = Stroke(width = 8.dp.toPx(), cap = StrokeCap.Round)
                                )
                            }

                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(
                                    text = "${percentage.toInt()}%",
                                    color = Color.White,
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Black,
                                    fontFamily = FontFamily.Monospace
                                )
                                Text(
                                    text = if (activeSaga.isCompleted) "COMPLETE" else "ACTIVE",
                                    color = animatedGaugeColor,
                                    fontSize = 7.5.sp,
                                    fontWeight = FontWeight.Black,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                        }
                    }

                    // Statistics Display & Milestone Indicator details description panel
                    Column(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text(
                            text = activeSaga.title.uppercase(),
                            color = Color.White,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace
                        )
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "Milestone: ",
                                color = Color.Gray,
                                fontSize = 9.sp
                            )
                            Text(
                                text = milestoneLabel,
                                color = animatedGaugeColor,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace
                            )
                        }

                        Spacer(modifier = Modifier.height(4.dp))

                        // Stats columns
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text("TOTAL QUESTS", color = Color.Gray, fontSize = 7.5.sp)
                                Text("${activeSaga.totalQuests} Node Battles", color = Color.White, fontSize = 9.5.sp, fontWeight = FontWeight.Bold)
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text("SCORE BOOST", color = Color.Gray, fontSize = 7.5.sp)
                                Text("${activeSaga.scoreBoost}x Earnings", color = theme.brandSecondary, fontSize = 9.5.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                            }
                        }
                    }
                }
            }
        }
    }
}
