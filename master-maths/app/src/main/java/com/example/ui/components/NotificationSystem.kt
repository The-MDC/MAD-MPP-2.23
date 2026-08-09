package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.LocalGambitTheme

data class NotificationItem(
    val id: String,
    val title: String,
    val message: String,
    val icon: ImageVector,
    val timeAgo: String,
    val isRead: Boolean,
    val color: Color
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationDrawer(
    isOpen: Boolean,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier
) {
    val theme = LocalGambitTheme.current
    
    val notifications = remember {
        listOf(
            NotificationItem("1", "MARKET SHIFT DETECTED", "Satirical Conviction index dropped 4.2% in 5m.", Icons.Filled.Warning, "2m ago", false, theme.brandAccent),
            NotificationItem("2", "ALPHA UPDATE", "Creator '0xKaito' posted new alpha regarding the upcoming prediction market.", Icons.Filled.ElectricBolt, "15m ago", false, theme.brandPrimary),
            NotificationItem("3", "FRIEND ACTIVITY", "User 'NeonJunkie' staked 500 MADx on a 'Bearish' sentiment.", Icons.Filled.Person, "1h ago", true, theme.brandSecondary),
            NotificationItem("4", "CONVICTION PLAY ALERT", "Your prediction 'Doge to \$1' is closing soon.", Icons.Filled.LocalFireDepartment, "2h ago", true, theme.textSecondary),
            NotificationItem("5", "SHIELD DEPLOYED", "MAD Shield™ prevented a streak drop.", Icons.Filled.Shield, "1d ago", true, theme.textSecondary)
        )
    }

    if (isOpen) {
        ModalBottomSheet(
            onDismissRequest = onDismiss,
            containerColor = theme.bgDeep,
            tonalElevation = 16.dp,
            dragHandle = { BottomSheetDefaults.DragHandle(color = theme.textSecondary) }
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
                    .padding(bottom = 32.dp)
            ) {
                Text(
                    text = "GLOBAL PLATFORM ALERTS",
                    fontFamily = com.example.ui.theme.AllertaStencilFamily,
                    fontSize = 18.sp,
                    color = theme.brandSecondary,
                    modifier = Modifier.padding(bottom = 16.dp)
                )
                
                LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(notifications) { notif ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(if (notif.isRead) theme.bgCard else theme.bgCard.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
                                .border(1.dp, if (notif.isRead) theme.borderBrush else androidx.compose.ui.graphics.SolidColor(notif.color), RoundedCornerShape(12.dp))
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(notif.color.copy(alpha = 0.2f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(notif.icon, contentDescription = null, tint = notif.color)
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = notif.title,
                                        color = if (notif.isRead) theme.textPrimary else notif.color,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12.sp,
                                        fontFamily = com.example.ui.theme.AllertaStencilFamily
                                    )
                                    Text(
                                        text = notif.timeAgo,
                                        color = theme.textSecondary,
                                        fontSize = 10.5.sp
                                    )
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = notif.message,
                                    color = theme.textSecondary,
                                    fontSize = 12.sp,
                                    lineHeight = 16.sp
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
