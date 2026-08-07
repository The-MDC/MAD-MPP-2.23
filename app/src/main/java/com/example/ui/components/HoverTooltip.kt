package com.example.ui.components

import androidx.compose.animation.*
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.Brush
import androidx.compose.foundation.Canvas
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.LocalGambitTheme

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HoverTooltip(
    text: String,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    val theme = LocalGambitTheme.current
    val tooltipState = rememberTooltipState()
    
    TooltipBox(
        positionProvider = TooltipDefaults.rememberPlainTooltipPositionProvider(),
        tooltip = {
            PlainTooltip(
                containerColor = Color.Transparent,
                contentColor = theme.textPrimary,
                modifier = Modifier
                    .shadow(16.dp, RoundedCornerShape(12.dp), spotColor = theme.brandSecondary)
                    .background(theme.bgCard.copy(alpha = 0.9f), RoundedCornerShape(12.dp))
                    .border(theme.borderWidth, theme.brandSecondary.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
                    .padding(10.dp)
            ) {
                androidx.compose.foundation.layout.Column(
                    verticalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(6.dp),
                    modifier = Modifier.widthIn(max = 240.dp)
                ) {
                    Text(
                        text = text,
                        fontFamily = com.example.ui.theme.AllertaStencilFamily,
                        fontSize = 10.5.sp,
                        lineHeight = 15.sp,
                        color = theme.textPrimary.copy(alpha = 0.95f),
                        fontWeight = FontWeight.Bold
                    )

                    Spacer(Modifier.height(2.dp))
                    Text(
                        text = "HISTORICAL TREND SNAPSHOT",
                        color = Color.Gray,
                        fontSize = 8.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                    
                    Canvas(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(32.dp)
                            .background(Color.Black.copy(alpha = 0.4f), RoundedCornerShape(4.dp))
                            .border(0.5.dp, theme.brandSecondary.copy(alpha = 0.25f), RoundedCornerShape(4.dp))
                    ) {
                        val sparkWidth = size.width
                        val sparkHeight = size.height
                        val points = listOf(0.15f, 0.45f, 0.3f, 0.75f, 0.5f, 0.85f, 0.7f, 0.95f)
                        val path = Path()
                        points.forEachIndexed { idx, value ->
                            val x = idx * (sparkWidth / (points.size - 1))
                            val y = sparkHeight - (value * sparkHeight) - 2.dp.toPx()
                            if (idx == 0) {
                                path.moveTo(x, y.coerceAtLeast(0f))
                            } else {
                                path.lineTo(x, y.coerceAtLeast(0f))
                            }
                        }
                        drawPath(
                            path = path,
                            color = com.example.ui.theme.NeonGreen,
                            style = Stroke(width = 1.6.dp.toPx(), cap = StrokeCap.Round)
                        )
                        val fillPath = Path().apply {
                            addPath(path)
                            lineTo(sparkWidth, sparkHeight)
                            lineTo(0f, sparkHeight)
                            close()
                        }
                        drawPath(
                            path = fillPath,
                            brush = Brush.verticalGradient(
                                colors = listOf(com.example.ui.theme.NeonGreen.copy(alpha = 0.25f), Color.Transparent)
                            )
                        )
                    }
                    
                    Divider(color = theme.brandSecondary.copy(alpha = 0.25f), thickness = 0.5.dp)
                    
                    androidx.compose.foundation.layout.Row(
                        verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
                        horizontalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(4.dp)
                    ) {
                        Text("🎩", fontSize = 11.sp)
                        Text(
                            text = com.example.api.RssFeedFetcher.getNextMemeOrHeadline(),
                            fontFamily = FontFamily.Monospace,
                            fontSize = 8.5.sp,
                            lineHeight = 11.sp,
                            color = com.example.ui.theme.NeonGreen,
                            fontWeight = FontWeight.ExtraBold,
                            fontStyle = androidx.compose.ui.text.font.FontStyle.Italic
                        )
                    }
                }
            }
        },
        state = tooltipState,
        modifier = modifier,
        content = content
    )
}
