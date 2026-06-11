package com.example.ui.components

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.RewardNotification
import com.example.ui.theme.BrandGold
import com.example.ui.theme.NeonGreen
import com.example.viewmodel.GambitViewModel
import kotlinx.coroutines.delay

@Composable
fun DopamineOptimizerNotifications(vm: GambitViewModel, notifications: List<RewardNotification>) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(top = 16.dp, start = 16.dp, end = 16.dp),
        contentAlignment = Alignment.TopCenter
    ) {
        Column(
            verticalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.wrapContentSize()
        ) {
            for (notification in notifications.take(3)) {
                RewardPopUp(notification) {
                    vm.dismissRewardNotification(notification.id)
                }
            }
        }
    }
}

@Composable
fun RewardPopUp(notification: RewardNotification, onDismiss: () -> Unit) {
    var isVisible by remember { mutableStateOf(false) }

    LaunchedEffect(notification.id) {
        isVisible = true
        // The Fibonacci-based variance influences the duration of the payout display
        // to add a variable ratio dopamine pause before it fades.
        // Base delay is 2500ms, modulated by Fibonacci.
        val factor = Math.min(notification.fibonacciIndex, 5).toLong()
        val delayMillis = 2500L + (factor * 400L)
        delay(delayMillis)
        isVisible = false
        delay(300) // waiting for exit animation
        onDismiss()
    }

    AnimatedVisibility(
        visible = isVisible,
        enter = slideInVertically(initialOffsetY = { -it }) + fadeIn() + scaleIn(initialScale = 0.8f),
        exit = slideOutVertically(targetOffsetY = { -it }) + fadeOut() + scaleOut(targetScale = 0.8f)
    ) {
        Row(
            modifier = Modifier
                .shadow(24.dp, RoundedCornerShape(12.dp), spotColor = NeonGreen.copy(alpha = 0.6f))
                .border(1.dp, BrandGold.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
                .background(Color(0xFF0F1A15).copy(alpha = 0.95f), RoundedCornerShape(12.dp))
                .padding(horizontal = 16.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "✨ REWARD",
                color = BrandGold,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = com.example.ui.theme.ArialNarrowFamily,
                letterSpacing = 1.sp
            )
            
            Column {
                Text(
                    text = notification.message,
                    color = Color.White,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium
                )
                Text(
                    text = "+${"%.2f".format(notification.amount)} \$MADx (Fibonacci Surge Level ${notification.fibonacciIndex})",
                    color = NeonGreen,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace
                )
            }
        }
    }
}
