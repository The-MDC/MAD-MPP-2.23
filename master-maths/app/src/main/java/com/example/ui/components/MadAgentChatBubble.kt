package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.NeonCyan

/**
 * MadAgentChatBubble represents the distinct, stylized conversational output
 * of the MADHAT'r persona.
 *
 * It strictly adheres to:
 * 1. Zero Shadow: Zero elevation, flat high-contrast layout.
 * 2. Surgical Border: Crisp, thin 1.dp border utilizing NeonCyan.
 * 3. NeonCyan Styling: Accentuates the agent's insights apart from raw market feeds.
 */
@Composable
fun MadAgentChatBubble(
    message: String,
    timestamp: String,
    modifier: Modifier = Modifier,
    agentName: String = "The MADHAT'r",
    onRegenerate: ((intensity: Int) -> Unit)? = null
) {
    var regenCount by remember { mutableStateOf(0) }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp)
    ) {
        Column(
            modifier = Modifier
                .align(Alignment.CenterStart)
                .widthIn(max = 340.dp)
                .background(
                    color = Color(0xFF030303), // Crisp black background
                    shape = RoundedCornerShape(topStart = 0.dp, topEnd = 12.dp, bottomEnd = 12.dp, bottomStart = 12.dp)
                )
                .border(
                    width = 1.dp,
                    color = NeonCyan, // NeonCyan surgical border
                    shape = RoundedCornerShape(topStart = 0.dp, topEnd = 12.dp, bottomEnd = 12.dp, bottomStart = 12.dp)
                )
                .padding(12.dp)
        ) {
            // Header with Persona tag
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "🎩",
                        fontSize = 12.sp,
                        modifier = Modifier.padding(end = 4.dp)
                    )
                    Text(
                        text = agentName.uppercase(),
                        color = NeonCyan,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                    Spacer(Modifier.width(6.dp))
                    Box(
                        modifier = Modifier
                            .background(NeonCyan.copy(alpha = 0.15f), RoundedCornerShape(2.dp))
                            .border(0.5.dp, NeonCyan, RoundedCornerShape(2.dp))
                            .padding(horizontal = 4.dp, vertical = 1.dp)
                    ) {
                        Text(
                            text = "AI AGENT",
                            color = NeonCyan,
                            fontSize = 7.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
                Text(
                    text = timestamp,
                    color = Color.Gray,
                    fontSize = 8.sp,
                    fontFamily = FontFamily.Monospace
                )
            }

            Spacer(Modifier.height(8.dp))

            // Satirical Message
            Text(
                text = message,
                color = Color.White,
                fontSize = 11.sp,
                fontFamily = FontFamily.Monospace,
                lineHeight = 15.sp
            )

            Spacer(Modifier.height(8.dp))

            // Footer info / Actions
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (onRegenerate != null) {
                    Box(
                        modifier = Modifier
                            .background(Color.Transparent, RoundedCornerShape(4.dp))
                            .border(0.5.dp, NeonCyan.copy(alpha = 0.6f), RoundedCornerShape(4.dp))
                            .clickable {
                                regenCount++
                                // 2nd or more re-prompt is South Park level (intensity = 2)
                                val intensity = if (regenCount >= 2) 2 else 1
                                onRegenerate(intensity)
                            }
                            .padding(horizontal = 6.dp, vertical = 3.dp)
                    ) {
                        Text(
                            text = if (regenCount >= 1) "REGEN ⚡ (SP-LEVEL)" else "REGENERATE 🔄",
                            color = NeonCyan,
                            fontSize = 7.5.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                } else {
                    Spacer(Modifier.width(1.dp))
                }

                Text(
                    text = "STATUS: SYNAPSE ACTIVE ⚡",
                    color = NeonCyan.copy(alpha = 0.6f),
                    fontSize = 7.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
            }
        }
    }
}

