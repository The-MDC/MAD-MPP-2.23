package com.example.ui.components

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.VolatilityAlertToast
import com.example.ui.theme.ArialNarrowFamily
import com.example.ui.theme.ArialFamily
import com.example.viewmodel.GambitViewModel
import kotlinx.coroutines.delay

@Composable
fun VolatilityAlertToastsLayer(vm: GambitViewModel, toasts: List<VolatilityAlertToast>) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(top = 80.dp, start = 16.dp, end = 16.dp), // below the ticker bar top menu
        contentAlignment = Alignment.TopCenter
    ) {
        Column(
            verticalArrangement = Arrangement.spacedBy(10.dp),
            modifier = Modifier.wrapContentSize(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            for (toast in toasts.take(2)) { // Display up to 2 simultaneous toasts or alerts
                VolatilityAlertPopUp(toast) {
                    vm.dismissVolatilityToast(toast.id)
                }
            }
        }
    }
}

@Composable
fun VolatilityAlertPopUp(toast: VolatilityAlertToast, onDismiss: () -> Unit) {
    var isVisible by remember { mutableStateOf(false) }

    LaunchedEffect(toast.id) {
        isVisible = true
        delay(3000L) // Toast displays for 3 seconds
        isVisible = false
        delay(300) // allow transition to complete
        onDismiss()
    }

    // Volatility alert coloring based on volatility score
    val glowColor = when {
        toast.volatilityScore > 75.0 -> Color(0xFFFF073A) // Neon Red / Crimson
        toast.volatilityScore > 50.0 -> Color(0xFFFF9F0A) // Neon Amber
        else -> Color(0xFFFFD700) // Gold
    }

    AnimatedVisibility(
        visible = isVisible,
        enter = slideInVertically(initialOffsetY = { -it }) + fadeIn(),
        exit = slideOutVertically(targetOffsetY = { -it / 2 }) + fadeOut()
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth(0.95f)
                .widthIn(max = 480.dp)
                .glassContainerBackground(
                    baseColor = glowColor.copy(alpha = 0.40f),
                    shape = RoundedCornerShape(16.dp)
                )
                .border(1.dp, glowColor.copy(alpha = 0.4f), RoundedCornerShape(16.dp))
                .clickable { isVisible = false }
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(14.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Warning,
                            contentDescription = "Volatility Alert",
                            tint = glowColor,
                            modifier = Modifier.size(16.dp)
                        )
                        Text(
                            text = "MAD TELEMETRY ALERT",
                            color = glowColor,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.ExtraBold,
                            fontFamily = ArialNarrowFamily,
                            style = TextStyle(
                                shadow = Shadow(
                                    color = glowColor.copy(alpha = 0.8f),
                                    blurRadius = 8f
                                )
                            )
                        )
                    }

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(glowColor.copy(alpha = 0.2f))
                                .border(0.5.dp, glowColor.copy(alpha = 0.5f), RoundedCornerShape(6.dp))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = "${String.format("%.1f", toast.volatilityScore)}u VOL",
                                color = glowColor,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = ArialNarrowFamily
                            )
                        }
                        IconButton(
                            onClick = { isVisible = false },
                            modifier = Modifier.size(20.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Filled.Close,
                                contentDescription = "Close Toast",
                                tint = Color.LightGray,
                                modifier = Modifier.size(12.dp)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(6.dp))

                Text(
                    text = toast.eventName,
                    color = Color.White,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = ArialFamily
                )

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = toast.text,
                    color = Color.LightGray,
                    fontSize = 10.5.sp,
                    fontFamily = ArialNarrowFamily,
                    lineHeight = 13.sp
                )
            }
        }
    }
}
