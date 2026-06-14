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
