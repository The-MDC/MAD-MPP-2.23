package com.example.ui.components

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.*
import com.example.ui.theme.*
import com.example.viewmodel.GambitViewModel

@Composable
fun DegenMissionsHub(vm: GambitViewModel) {
    val state by vm.state.collectAsState()
    val theme = LocalGambitTheme.current
    val progress = state.dailyDegenProgress
    val activeMissions = progress.activeMissions

    // Manual check to show dialog
    var showManualVibeDialog by remember { mutableStateOf(false) }

    // Friend invite state helper
    var inviteInputText by remember { mutableStateOf("") }
    var showInviteFeedback by remember { mutableStateOf(false) }

    // Dialogue trigger
    if (progress.showWelcomeDialog || showManualVibeDialog) {
        DegenMoodCheckInDialog(
            vm = vm,
            progress = progress,
            onDismiss = {
                vm.closeWelcomeDialog()
                showManualVibeDialog = false
            }
        )
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(10.dp)
            .background(Color(0x33141111), RoundedCornerShape(16.dp))
            .border(1.dp, AsgaardGoldBrush, RoundedCornerShape(16.dp))
            .glassReflection(Color(0x19FFD700), RoundedCornerShape(16.dp))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Active banner header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.Campaign,
                    contentDescription = "Missions",
                    tint = BrandGold,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "DAILY DEGEN MISSION HUB",
                    color = BrandGold,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = AllertaStencilFamily,
                    style = TextStyle(shadow = Shadow(color = BrandGoldGlow, blurRadius = 8f))
                )
            }

            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .background(BrandGold.copy(alpha = 0.12f))
                    .clickable { 
                        vm.playFeedbackTone(android.media.ToneGenerator.TONE_PROP_ACK, 60)
                        showManualVibeDialog = true 
                    }
                    .border(1.dp, AsgaardGoldBrush, RoundedCornerShape(8.dp))
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            ) {
                Text(
                    text = "VIBE CHECK & SUGGESTIONS",
                    color = BrandGold,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = AllertaStencilFamily
                )
            }
        }

        Divider(color = Color.DarkGray.copy(alpha = 0.4f), thickness = 1.dp)

        // Streak Trackers Row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Weekly Streak Card
            Column(
                modifier = Modifier
                    .weight(1f)
                    .innerGlassContainerBackground(baseColor = NeonCyan, shape = RoundedCornerShape(10.dp))
                    .padding(8.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "WEEKLY STREAK",
                        color = NeonCyan,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = AllertaStencilFamily
                    )
                    Text(
                        text = "${progress.currentWeeklyStreak}D",
                        color = Color.White,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.ExtraBold,
                        fontFamily = FontFamily.Monospace
                    )
                }

                // Mon - Sun Track Bars
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    val days = listOf("M", "T", "W", "T", "F", "S", "S")
                    days.forEachIndexed { idx, day ->
                        val isCleared = idx < progress.currentWeeklyStreak
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(2.dp)
                        ) {
                            Text(
                                text = day,
                                color = if (isCleared) NeonCyan else Color.Gray,
                                fontSize = 8.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Box(
                                modifier = Modifier
                                    .size(16.dp)
                                    .clip(CircleShape)
                                    .background(if (isCleared) NeonCyan.copy(alpha = 0.2f) else Color.DarkGray.copy(alpha = 0.3f))
                                    .border(
                                        width = 1.dp,
                                        brush = if (isCleared) SolidColor(NeonCyan) else SolidColor(Color.DarkGray),
                                        shape = CircleShape
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                if (isCleared) {
                                    Icon(
                                        imageVector = Icons.Default.Check,
                                        contentDescription = "Done",
                                        tint = NeonCyan,
                                        modifier = Modifier.size(10.dp)
                                    )
                                } else {
                                    Text(
                                        text = "-",
                                        color = Color.DarkGray,
                                        fontSize = 8.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Monthly Monster Streak Card
            Column(
                modifier = Modifier
                    .weight(1.2f)
                    .innerGlassContainerBackground(baseColor = NeonPink, shape = RoundedCornerShape(10.dp))
                    .padding(8.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "MONSTER WEEKLY STREAK 💀",
                        color = NeonPink,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = AllertaStencilFamily
                    )
                    Text(
                        text = "${progress.currentMonthlyMonsterStreak}/30",
                        color = Color.White,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.ExtraBold,
                        fontFamily = FontFamily.Monospace
                    )
                }

                Spacer(modifier = Modifier.height(2.dp))

                // Progress Indicator
                val progressFraction = (progress.currentMonthlyMonsterStreak / 30f).coerceIn(0f, 1f)
                Box(modifier = Modifier.fillMaxWidth()) {
                    LinearProgressIndicator(
                        progress = progressFraction,
                        color = NeonPink,
                        trackColor = Color.DarkGray.copy(alpha = 0.3f),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(6.dp)
                            .clip(RoundedCornerShape(3.dp))
                            .align(Alignment.Center)
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "STREAK MULTIPLIER: ${(1.0f + progress.currentMonthlyMonsterStreak * 0.05f).format(2)}x",
                        color = Color.LightGray,
                        fontSize = 8.sp,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }
        }

        // Active Missions List
        Text(
            text = "DAILY CONTRACTS",
            color = Color.LightGray.copy(alpha = 0.8f),
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace
        )

        activeMissions.forEach { mission ->
            val tintBg = if (mission.completed) Color(0x2200FF66) else Color(0x19FFFFFF)
            val borderBrush = if (mission.completed) AsgaardGoldBrush else GoldFlakeBrush
            val reflectionGlow = if (mission.completed) Color(0x2200FF66) else Color(0x11FFD700)
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .animateContentSize()
                    .background(tintBg, RoundedCornerShape(12.dp))
                    .border(1.dp, borderBrush, RoundedCornerShape(12.dp))
                    .glassReflection(reflectionGlow, RoundedCornerShape(12.dp))
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = mission.title,
                                    color = if (mission.completed) Color.Green else Color.White,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = AllertaStencilFamily
                                )
                                if (mission.completed) {
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Icon(
                                        imageVector = Icons.Default.CheckCircle,
                                        contentDescription = "Completed",
                                        tint = Color.Green,
                                        modifier = Modifier.size(12.dp)
                                    )
                                }
                            }
                            Text(
                                text = mission.description,
                                color = Color.Gray,
                                fontSize = 9.sp,
                                fontFamily = ArialNarrowFamily
                            )
                        }

                        // Progress Badge
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(if (mission.completed) Color.Green.copy(alpha = 0.15f) else Color.DarkGray.copy(alpha = 0.5f))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = "${mission.currentProgress} / ${mission.maxProgress}",
                                color = if (mission.completed) Color.Green else Color.White,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }

                    // Interactive Actions Inside the hub
                    if (!mission.completed) {
                        Spacer(modifier = Modifier.height(6.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.End,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            when (mission.type) {
                                "TAP" -> {
                                    Button(
                                        onClick = { vm.triggerTopHatTap() },
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = BrandGold.copy(alpha = 0.15f),
                                            contentColor = BrandGold
                                        ),
                                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 2.dp),
                                        modifier = Modifier.height(26.dp)
                                    ) {
                                        Text(
                                            text = "TAP TO CLEAN GOGGLES",
                                            fontSize = 8.sp,
                                            fontWeight = FontWeight.Bold,
                                            fontFamily = AllertaStencilFamily
                                        )
                                    }
                                }
                                "INVITE" -> {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                                    ) {
                                        OutlinedTextField(
                                            value = inviteInputText,
                                            onValueChange = { inviteInputText = it },
                                            placeholder = { Text("Friend's ENS / Email", fontSize = 8.sp, color = Color.Gray) },
                                            modifier = Modifier
                                                .width(130.dp)
                                                .height(30.dp),
                                            colors = OutlinedTextFieldDefaults.colors(
                                                unfocusedContainerColor = Color.Black.copy(alpha = 0.3f),
                                                focusedContainerColor = Color.Black.copy(alpha = 0.5f),
                                                unfocusedBorderColor = Color.DarkGray,
                                                focusedBorderColor = NeonCyan
                                            ),
                                            textStyle = TextStyle(fontSize = 10.sp, color = Color.White),
                                            singleLine = true,
                                            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done)
                                        )

                                        Button(
                                            onClick = {
                                                if (inviteInputText.isNotBlank()) {
                                                    vm.triggerInviteSent()
                                                    inviteInputText = ""
                                                }
                                            },
                                            colors = ButtonDefaults.buttonColors(
                                                containerColor = NeonCyan.copy(alpha = 0.15f),
                                                contentColor = NeonCyan
                                            ),
                                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 2.dp),
                                            modifier = Modifier.height(26.dp)
                                        ) {
                                            Text(
                                                text = "INVITE",
                                                fontSize = 8.sp,
                                                fontWeight = FontWeight.Bold,
                                                fontFamily = AllertaStencilFamily
                                            )
                                        }
                                    }
                                }
                                "SEARCH" -> {
                                    Text(
                                        text = "⚡ TYPE A VALUE IN THE SCAN BOX ABOVE",
                                        color = NeonCyan,
                                        fontSize = 8.sp,
                                        fontFamily = FontFamily.Monospace,
                                        modifier = Modifier.padding(end = 4.dp)
                                    )
                                }
                                "Z_LIAR_METER" -> {
                                    Text(
                                        text = "🔬 TRIGGER A HEADLINE QUERY BELOW (GET SPRESET EXTRA REWARD BONUS)",
                                        color = NeonPink,
                                        fontSize = 8.sp,
                                        fontFamily = FontFamily.Monospace,
                                        modifier = Modifier.padding(end = 4.dp)
                                    )
                                }
                            }
                        }
                    }

                    // Profit/Reward Specs Footer Row
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Reward: +${mission.pointsReward.toInt()} MADx | +${mission.xpReward.toInt()} XP",
                            color = if (mission.completed) Color.Green.copy(alpha = 0.7f) else BrandGold.copy(alpha = 0.7f),
                            fontSize = 8.sp,
                            fontFamily = FontFamily.Monospace
                        )
                        if (mission.type == "Z_LIAR_METER") {
                            Text(
                                text = "🔥 +50 XP LIVE HUD LOYALTY BONUS",
                                color = NeonPink,
                                fontSize = 8.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun DegenMoodCheckInDialog(
    vm: GambitViewModel,
    progress: DailyDegenProgress,
    onDismiss: () -> Unit
) {
    var selectedMood by remember { mutableStateOf(progress.dailyMood ?: "Bullish") }
    var suggestionText by remember { mutableStateOf(progress.appSuggestion ?: "") }

    val moods = listOf(
        Pair("🐂 BULLISH", "Bullish"),
        Pair("🐻 BEARISH", "Bearish"),
        Pair("🌋 CHAOS", "Chaos-Hungry"),
        Pair("🎩 MAD", "MAD")
    )

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = Color(0xFF0F1224).copy(alpha = 0.98f),
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, AsgaardGoldBrush, RoundedCornerShape(16.dp))
            .shadow(12.dp, RoundedCornerShape(16.dp), spotColor = BrandGold),
        title = {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "SPECULATIVE SYNC: DAILY CHECK-IN",
                    color = BrandGold,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = AllertaStencilFamily
                )
                IconButton(onClick = onDismiss, modifier = Modifier.size(24.dp)) {
                    Icon(imageVector = Icons.Default.Close, contentDescription = "Close", tint = Color.Gray)
                }
            }
        },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Text(
                    text = "Welcome back, Degen! Sync your current mood and share your suggested feedback for the speculative engine to earn immediate \$MADx & XP.",
                    color = Color.LightGray,
                    fontSize = 11.sp,
                    fontFamily = ArialNarrowFamily
                )

                // Mood selector buttons
                Text(
                    text = "CHOOSE CURRENT SENTIMENT MOOD:",
                    color = BrandGold,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    moods.forEach { (label, value) ->
                        val isSelected = selectedMood == value
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (isSelected) BrandGold.copy(alpha = 0.2f) else Color.DarkGray.copy(alpha = 0.2f))
                                .border(
                                    width = if (isSelected) 1.5.dp else 1.dp,
                                    color = if (isSelected) BrandGold else Color.DarkGray,
                                    shape = RoundedCornerShape(8.dp)
                                )
                                .clickable { selectedMood = value }
                                .padding(vertical = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = label,
                                color = if (isSelected) BrandGold else Color.LightGray,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Black,
                                fontFamily = AllertaStencilFamily
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(2.dp))

                // Suggestion textarea
                Text(
                    text = "APP SUGGESTIONS & WISH LIST:",
                    color = BrandGold,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )

                OutlinedTextField(
                    value = suggestionText,
                    onValueChange = { suggestionText = it },
                    placeholder = { Text("What feature, market category, or satirical elements should we add next?", color = Color.Gray, fontSize = 11.sp) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(110.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        unfocusedContainerColor = Color.Black.copy(alpha = 0.3f),
                        focusedContainerColor = Color.Black.copy(alpha = 0.5f),
                        unfocusedBorderColor = Color.DarkGray,
                        focusedBorderColor = BrandGold
                    ),
                    textStyle = TextStyle(fontSize = 12.sp, color = Color.White)
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Bonus reward for sync: +150 MADx | +75 XP",
                        color = Color.Green,
                        fontSize = 9.sp,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    vm.submitDailyMoodAndSuggestion(selectedMood, suggestionText)
                    onDismiss()
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(44.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = BrandGold,
                    contentColor = Color.Black
                ),
                shape = RoundedCornerShape(10.dp)
            ) {
                Text(
                    text = "TRANSMIT DAILY SYNC",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = AllertaStencilFamily
                )
            }
        }
    )
}

// Float formatting extension helper
private fun Float.format(digits: Int) = "%.${digits}f".format(this)
