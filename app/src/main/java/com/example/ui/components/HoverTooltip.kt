package com.example.ui.components

import androidx.compose.animation.*
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.padding
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
                    .background(theme.bgCard.copy(alpha = 0.6f), RoundedCornerShape(12.dp))
                    .border(theme.borderWidth, theme.brandSecondary.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
                    .padding(8.dp)
            ) {
                Text(
                    text = text,
                    fontFamily = com.example.ui.theme.ArialNarrowFamily,
                    fontSize = 11.sp,
                    lineHeight = 16.sp,
                    color = theme.textPrimary.copy(alpha = 0.9f),
                    fontWeight = FontWeight.Medium
                )
            }
        },
        state = tooltipState,
        modifier = modifier,
        content = content
    )
}
