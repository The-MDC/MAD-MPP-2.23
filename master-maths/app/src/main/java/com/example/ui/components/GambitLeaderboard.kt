package com.example.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.LeaderboardUser
import com.example.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GambitLeaderboard(
    users: List<LeaderboardUser>,
    modifier: Modifier = Modifier
) {
    val theme = LocalGambitTheme.current
    var searchQuery by remember { mutableStateOf("") }
    var activeLeaderboardTab by remember { mutableStateOf("Top Balance") }
    
    val leaderboardTabs = listOf("Top Balance", "Top Conviction", "Top Prediction", "Top Liar Detector")

    // Filter and sort leaderboard users in real-time based on active tab
    val filteredUsers = remember(users, searchQuery, activeLeaderboardTab) {
        val baseList = if (searchQuery.isBlank()) {
            users
        } else {
            users.filter { 
                it.username.contains(searchQuery, ignoreCase = true) || 
                it.satiricalTitle.contains(searchQuery, ignoreCase = true)
            }
        }
        
        when (activeLeaderboardTab) {
            "Top Conviction" -> baseList.sortedByDescending { it.successfulConvictions }
            "Top Prediction" -> baseList.sortedByDescending { it.successfulPredictions }
            "Top Liar Detector" -> baseList.sortedByDescending { it.successfulLiarDetections }
            else -> baseList.sortedByDescending { it.madxBalance }
        }
    }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .fillMaxHeight()
            .glassContainerBackground(theme.brandSecondary, RoundedCornerShape(24.dp))
            .padding(16.dp)
    ) {
        // High-fidelity satirical header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "🏆 MΛĐ GAMBIT HALL OF LEGENDS",
                    color = BrandGold,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Monospace,
                    letterSpacing = 0.5.sp
                )
                Text(
                    text = "Observe our top-tier cognitive market high-rollers or search competitors.",
                    color = theme.textSecondary,
                    fontSize = 9.sp,
                    fontFamily = FontFamily.Default
                )
            }
            Icon(
                imageVector = Icons.Default.TrendingUp,
                contentDescription = "Trending Top List",
                tint = NeonGreen,
                modifier = Modifier.size(24.dp)
            )
        }

        Spacer(Modifier.height(12.dp))

        // Leaderboard Categories Tab Row
        ScrollableTabRow(
            selectedTabIndex = leaderboardTabs.indexOf(activeLeaderboardTab),
            containerColor = Color.Transparent,
            contentColor = BrandGold,
            edgePadding = 0.dp,
            divider = {},
            indicator = {}
        ) {
            leaderboardTabs.forEach { tab ->
                val isSelected = activeLeaderboardTab == tab
                Tab(
                    selected = isSelected,
                    onClick = { activeLeaderboardTab = tab },
                    text = {
                        Box(
                            modifier = Modifier
                                .background(
                                    color = if (isSelected) BrandGold.copy(alpha = 0.18f) else Color(0xFF13162C).copy(alpha = 0.6f),
                                    shape = RoundedCornerShape(8.dp)
                                )
                                .border(
                                    width = if (isSelected) 1.2.dp else 0.8.dp,
                                    brush = if (isSelected) com.example.ui.theme.AsgaardGoldBrush else androidx.compose.ui.graphics.SolidColor(Color.DarkGray.copy(alpha = 0.4f)),
                                    shape = RoundedCornerShape(8.dp)
                                )
                                .padding(horizontal = 10.dp, vertical = 5.dp)
                        ) {
                            Text(
                                text = tab.uppercase(),
                                color = if (isSelected) BrandGold else Color.LightGray.copy(alpha = 0.7f),
                                fontSize = 9.5.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }
                )
            }
        }

        Spacer(Modifier.height(12.dp))

        // Search panel matching the design system
        TextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = { Text("Filter by degen username or title...", color = theme.textSecondary.copy(alpha = 0.6f), fontSize = 11.sp) },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Search", tint = theme.textSecondary, modifier = Modifier.size(18.dp)) },
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp)
                .testTag("leaderboard_search_input")
                .border(1.dp, theme.brandSecondary.copy(alpha = 0.35f), RoundedCornerShape(12.dp)),
            colors = TextFieldDefaults.colors(
                focusedContainerColor = Color.Black.copy(alpha = 0.45f),
                unfocusedContainerColor = Color.Black.copy(alpha = 0.35f),
                focusedIndicatorColor = Color.Transparent,
                unfocusedIndicatorColor = Color.Transparent,
                focusedTextColor = theme.textPrimary,
                unfocusedTextColor = theme.textPrimary
            ),
            shape = RoundedCornerShape(12.dp),
            singleLine = true
        )

        Spacer(Modifier.height(12.dp))

        // Grid Headers
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text("RANK & SPECTATOR PROFILE", color = theme.textSecondary, fontSize = 9.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1.8f))
            Text(
                text = when (activeLeaderboardTab) {
                    "Top Conviction" -> "CONVICTIONS / ACCURACY"
                    "Top Prediction" -> "PREDICTIONS / ACCURACY"
                    "Top Liar Detector" -> "LIAR RUNS / ACCURACY"
                    else -> "BALANCE / WINS"
                },
                color = theme.textSecondary,
                fontSize = 9.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.weight(1.2f)
            )
            Text("TENURE", color = theme.textSecondary, fontSize = 9.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(0.6f))
        }

        Spacer(Modifier.height(4.dp))
        Box(modifier = Modifier.fillMaxWidth().height(1.15.dp).background(theme.borderBrush))
        Spacer(Modifier.height(8.dp))

        if (filteredUsers.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "No competitors matches found in the ledger. Try another query, kiddo!",
                    color = NeonPink,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .testTag("leaderboard_list")
            ) {
                itemsIndexed(filteredUsers, key = { _, user -> user.userId }) { index, user ->
                    var isExpanded by remember { mutableStateOf(false) }
                    
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp)
                            .background(
                                if (isExpanded) Color.White.copy(alpha = 0.05f) else Color.Transparent,
                                RoundedCornerShape(12.dp)
                            )
                            .clickable { isExpanded = !isExpanded }
                            .padding(horizontal = 8.dp, vertical = 8.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            // Rank & Spectator Profile block
                            Row(
                                modifier = Modifier.weight(1.8f),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                // Customized high-gloss ranking badges
                                Box(
                                    modifier = Modifier
                                        .size(24.dp)
                                        .background(
                                            when (index) {
                                                0 -> BrandGold.copy(alpha = 0.2f)
                                                1 -> NeonCyan.copy(alpha = 0.15f)
                                                2 -> NeonPink.copy(alpha = 0.15f)
                                                else -> Color.Gray.copy(alpha = 0.1f)
                                            },
                                            RoundedCornerShape(6.dp)
                                        )
                                        .border(
                                            1.dp,
                                            when (index) {
                                                0 -> BrandGold
                                                1 -> NeonCyan
                                                2 -> NeonPink
                                                else -> Color.DarkGray
                                            },
                                            RoundedCornerShape(6.dp)
                                        ),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = when (index) {
                                            0 -> "👑"
                                            1 -> "🥈"
                                            2 -> "🥉"
                                            else -> "${index + 1}"
                                        },
                                        color = if (index < 3) Color.White else theme.textSecondary,
                                        fontSize = if (index < 3) 11.sp else 9.5.sp,
                                        fontWeight = FontWeight.Bold,
                                        fontFamily = FontFamily.Monospace
                                    )
                                }
                                
                                Spacer(Modifier.width(8.dp))
                                
                                Column {
                                    Text(
                                        text = user.username,
                                        color = when (index) {
                                            0 -> BrandGold
                                            else -> theme.textPrimary
                                        },
                                        fontSize = 11.5.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    
                                    // Satirical tag display with colorful styling
                                    val badgeColor = remember {
                                        when (user.satiricalTitle) {
                                            "The MADHAT'r" -> BrandGold
                                            "Wall Street Martyr" -> NeonPink
                                            "Market Jester" -> NeonPurple
                                            "Federal Reserve Janitor" -> Color.Gray
                                            "Cramer's Ghost" -> NeonCyan
                                            "Jersey Shore Whale" -> NeonGreen
                                            else -> theme.brandPrimary
                                        }
                                    }
                                    
                                    Box(
                                        modifier = Modifier
                                            .padding(top = 2.dp)
                                            .background(badgeColor.copy(alpha = 0.15f), RoundedCornerShape(4.dp))
                                            .border(0.5.dp, badgeColor.copy(alpha = 0.7f), RoundedCornerShape(4.dp))
                                            .padding(horizontal = 4.dp, vertical = 1.dp)
                                    ) {
                                        Text(
                                            text = user.satiricalTitle.uppercase(),
                                            color = badgeColor,
                                            fontSize = 7.5.sp,
                                            fontFamily = FontFamily.Monospace,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }
                            }
                            
                            // Balance & successful predictions counters
                            Column(modifier = Modifier.weight(1.2f)) {
                                when (activeLeaderboardTab) {
                                    "Top Conviction" -> {
                                        Text(
                                            text = "${user.successfulConvictions} successful",
                                            color = BrandGold,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            fontFamily = FontFamily.Monospace
                                        )
                                        Text(
                                            text = "🎯 Accuracy: ${(user.convictionAccuracy * 100).toInt()}%",
                                            color = NeonGreen,
                                            fontSize = 8.5.sp,
                                            fontFamily = FontFamily.Monospace
                                        )
                                    }
                                    "Top Prediction" -> {
                                        Text(
                                            text = "${user.successfulPredictions} successful",
                                            color = NeonCyan,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            fontFamily = FontFamily.Monospace
                                        )
                                        Text(
                                            text = "🎯 Accuracy: ${(user.predictionAccuracy * 100).toInt()}%",
                                            color = NeonGreen,
                                            fontSize = 8.5.sp,
                                            fontFamily = FontFamily.Monospace
                                        )
                                    }
                                    "Top Liar Detector" -> {
                                        Text(
                                            text = "${user.successfulLiarDetections} runs",
                                            color = NeonPink,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            fontFamily = FontFamily.Monospace
                                        )
                                        Text(
                                            text = "🎯 Accuracy: ${(user.liarMeterAccuracy * 100).toInt()}%",
                                            color = NeonGreen,
                                            fontSize = 8.5.sp,
                                            fontFamily = FontFamily.Monospace
                                        )
                                    }
                                    else -> {
                                        Text(
                                            text = "${user.madxBalance.toInt()} MADx",
                                            color = theme.brandPrimary,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            fontFamily = FontFamily.Monospace
                                        )
                                        Text(
                                            text = "🔥 ${user.successfulWagers} successful guesses",
                                            color = NeonCyan,
                                            fontSize = 8.5.sp,
                                            fontFamily = FontFamily.Monospace
                                        )
                                    }
                                }
                            }
                            
                            // Tenure hours
                            Text(
                                text = "${user.timeOnPlatformHours} hrs",
                                color = theme.textSecondary,
                                fontSize = 10.sp,
                                fontFamily = FontFamily.Monospace,
                                modifier = Modifier.weight(0.6f)
                            )
                        }
                        
                        // Expanded details on click for deeper immersion
                        AnimatedVisibility(visible = isExpanded) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = 8.dp, start = 32.dp, end = 8.dp)
                                    .background(Color.Black.copy(alpha = 0.2f), RoundedCornerShape(8.dp))
                                    .border(0.5.dp, theme.brandSecondary.copy(alpha = 0.15f), RoundedCornerShape(8.dp))
                                    .padding(10.dp)
                            ) {
                                Text(
                                    text = "🕵️‍♂️ DETAILED COGNITIVE PROFILE",
                                    color = BrandGold,
                                    fontSize = 8.5.sp,
                                    fontFamily = FontFamily.Monospace,
                                    fontWeight = FontWeight.Bold
                                )
                                Spacer(Modifier.height(4.dp))
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Column {
                                        Text("Degen Ratio: ${(90..99).random()}.${(0..9).random()}%", color = theme.textPrimary, fontSize = 9.sp)
                                        Text("Risk Tolerancy: EXTREME", color = NeonPink, fontSize = 9.sp, fontWeight = FontWeight.SemiBold)
                                    }
                                    Column {
                                        Text("Loss Tolerance: ZERO", color = NeonPurple, fontSize = 9.sp, fontWeight = FontWeight.SemiBold)
                                        Text("Tony's Respect: ${(40..100).random()}%", color = NeonGreen, fontSize = 9.sp)
                                    }
                                }
                            }
                        }
                    }
                    if (index < filteredUsers.size - 1) {
                        Box(modifier = Modifier.fillMaxWidth().height(0.6.dp).background(theme.borderBrush))
                    }
                }
            }
        }
    }
}
