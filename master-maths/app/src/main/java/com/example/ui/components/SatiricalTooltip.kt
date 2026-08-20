package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.PlainTooltip
import androidx.compose.material3.Text
import androidx.compose.material3.TooltipBox
import androidx.compose.material3.TooltipDefaults
import androidx.compose.material3.rememberTooltipState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.LocalGambitTheme
import com.example.ui.theme.BrandCrimson
import com.example.ui.theme.NeonCyan

import androidx.compose.runtime.LaunchedEffect
import com.example.engine.MadhatrVoice

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SatiricalTooltip(
    tooltipText: String,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    val tooltipState = rememberTooltipState()
    val theme = LocalGambitTheme.current

    LaunchedEffect(tooltipState.isVisible) {
        if (tooltipState.isVisible) {
            MadhatrVoice.speak(tooltipText)
        }
    }

    TooltipBox(
        positionProvider = TooltipDefaults.rememberPlainTooltipPositionProvider(),
        tooltip = {
            PlainTooltip(
                containerColor = Color.Transparent,
                contentColor = theme.brandSecondary
            ) {
                Text(
                    text = tooltipText,
                    color = NeonCyan,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = com.example.ui.theme.AllertaStencilFamily,
                    modifier = Modifier
                        .glassReflection(Color.Black, RoundedCornerShape(8.dp))
                        .border(1.dp, BrandCrimson.copy(alpha=0.6f), RoundedCornerShape(8.dp))
                        .padding(12.dp)
                )
            }
        },
        state = tooltipState,
        content = content,
        modifier = modifier
    )
}
