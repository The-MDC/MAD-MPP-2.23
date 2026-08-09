package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.DeleteSweep
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.NeonCyan
import com.example.viewmodel.GambitViewModel

data class HistoricInsight(
    val date: String,
    val text: String,
    val intensity: String,
    val rating: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AgentHistoryScreen(vm: GambitViewModel) {
    // Standard pre-seeded MADHAT'r classic roasts to populate history
    val defaultInsights = remember {
        mutableStateListOf(
            HistoricInsight(
                date = "2026-06-25",
                text = "Ayo kid! I seen paper hands, but you staking WOKE-COIN while it has a 45% exponential decay is a new level of dumber. Go buy some real perps before you get fully liquidated! My system is crying, literally.",
                intensity = "🔥 ROAST (MAX)",
                rating = "DEGEN SCORE: 120"
            ),
            HistoricInsight(
                date = "2026-06-20",
                text = "You call that conviction? That PEPE-PERP holding is looking thinner than my second-favorite fedora! Calibrate the neural decay loops before I start calling you a wokie! Unbelievable.",
                intensity = "🔄 REGEN (MID)",
                rating = "DEGEN SCORE: 480"
            ),
            HistoricInsight(
                date = "2026-06-15",
                text = "Listen, this portfolio decay is steeper than the decline of decent pop culture. Either turn up your risk multiplier or go cry to Kalshi copycats! Real top-hat wearing quants don't settle for crumbs.",
                intensity = "🔥 ROAST (MAX)",
                rating = "DEGEN SCORE: 150"
            ),
            HistoricInsight(
                date = "2026-06-10",
                text = "Zero rewards claimed in the last cycle. If you wanted a safe space, you should have stayed in the Compliant zone. In MAD Gambit, we bet high or get reaped by the automated decay loops.",
                intensity = "📊 ANALYTICAL (LOW)",
                rating = "DEGEN SCORE: 850"
            ),
            HistoricInsight(
                date = "2026-06-01",
                text = "Degen rating: 1200. You're barely keeping your Top-Hats secure, kid. If the sentiment temp crosses 1.8 today, your margins are toasted like stale boardwalk pretzels from Wildwood.",
                intensity = "🔄 REGEN (MID)",
                rating = "DEGEN SCORE: 1200"
            )
        )
    }

    var selectedDateFilter by remember { mutableStateOf("ALL") }
    val uniqueDates = remember(defaultInsights) {
        listOf("ALL") + defaultInsights.map { it.date }.distinct().sortedDescending()
    }

    var textSearchFilter by remember { mutableStateOf("") }

    val filteredInsights = remember(selectedDateFilter, textSearchFilter, defaultInsights) {
        defaultInsights.filter { insight ->
            val matchesDate = selectedDateFilter == "ALL" || insight.date == selectedDateFilter
            val matchesText = textSearchFilter.isEmpty() || insight.text.contains(textSearchFilter, ignoreCase = true)
            matchesDate && matchesText
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF04060A))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // HEADER BLOCK WITH SURGICAL BORDER & ZERO SHADOW
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xFF080D14), RoundedCornerShape(12.dp))
                .border(1.dp, NeonCyan, RoundedCornerShape(12.dp))
                .padding(16.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(
                    text = "🎩 MADHAT'R HISTORIC NEURAL LOGS",
                    color = NeonCyan,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Monospace,
                    letterSpacing = 1.sp
                )
                Text(
                    text = "Historical transcript vault of past portfolio roasts, conviction diagnostics, and unhinged predictive audits directly generated by MADHAT's neural engine.",
                    color = Color.LightGray,
                    fontSize = 11.sp,
                    fontFamily = FontFamily.Monospace,
                    lineHeight = 15.sp
                )
            }
        }

        // FILTER CONTROL BAR
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xFF070B11), RoundedCornerShape(12.dp))
                .border(1.dp, NeonCyan.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
                .padding(12.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "FILTER TRANSCRIPTS",
                        color = NeonCyan,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                    IconButton(
                        onClick = {
                            textSearchFilter = ""
                            selectedDateFilter = "ALL"
                        },
                        modifier = Modifier.size(24.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.DeleteSweep,
                            contentDescription = "Clear Filters",
                            tint = Color.Gray,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }

                // Date filter chips
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.CalendarToday,
                        contentDescription = "Date Selector",
                        tint = NeonCyan,
                        modifier = Modifier.size(14.dp)
                    )
                    Text(
                        text = "DATE:",
                        color = Color.Gray,
                        fontSize = 9.sp,
                        fontFamily = FontFamily.Monospace
                    )
                    Box(modifier = Modifier.weight(1f)) {
                        ScrollableTabRow(
                            selectedTabIndex = uniqueDates.indexOf(selectedDateFilter).coerceAtLeast(0),
                            edgePadding = 0.dp,
                            containerColor = Color.Transparent,
                            indicator = {},
                            divider = {}
                        ) {
                            uniqueDates.forEach { date ->
                                val isSelected = selectedDateFilter == date
                                Tab(
                                    selected = isSelected,
                                    onClick = { selectedDateFilter = date },
                                    text = {
                                        Box(
                                            modifier = Modifier
                                                .background(
                                                    if (isSelected) NeonCyan.copy(alpha = 0.2f) else Color.Transparent,
                                                    RoundedCornerShape(4.dp)
                                                )
                                                .border(
                                                    0.5.dp,
                                                    if (isSelected) NeonCyan else Color.Gray.copy(alpha = 0.3f),
                                                    RoundedCornerShape(4.dp)
                                                )
                                                .padding(horizontal = 8.dp, vertical = 4.dp)
                                        ) {
                                            Text(
                                                text = date,
                                                color = if (isSelected) Color.White else Color.Gray,
                                                fontSize = 9.sp,
                                                fontFamily = FontFamily.Monospace
                                            )
                                        }
                                    }
                                )
                            }
                        }
                    }
                }

                // Text filter field
                OutlinedTextField(
                    value = textSearchFilter,
                    onValueChange = { textSearchFilter = it },
                    placeholder = {
                        Text(
                            "Search keyword... (e.g., woke, fedora, dumber)",
                            color = Color.Gray,
                            fontSize = 11.sp,
                            fontFamily = FontFamily.Monospace
                        )
                    },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.Search,
                            contentDescription = "Search",
                            tint = NeonCyan,
                            modifier = Modifier.size(16.dp)
                        )
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    textStyle = androidx.compose.ui.text.TextStyle(
                        color = Color.White,
                        fontSize = 12.sp,
                        fontFamily = FontFamily.Monospace
                    ),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = NeonCyan,
                        unfocusedBorderColor = Color.Gray.copy(alpha = 0.3f),
                        focusedContainerColor = Color(0xFF030508),
                        unfocusedContainerColor = Color(0xFF030508)
                    )
                )
            }
        }

        // HISTORICAL TRANSCRIPTS LIST
        if (filteredInsights.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .border(1.dp, Color.Gray.copy(alpha = 0.2f), RoundedCornerShape(12.dp))
                    .padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "NO HISTORIC TRANSCRIPTS FOUND FOR CURRENT MATRIX PARAMETERS.",
                    color = Color.Gray,
                    fontSize = 11.sp,
                    fontFamily = FontFamily.Monospace,
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                )
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(filteredInsights) { insight ->
                    // MAD CARD COMPONENT CONFORMING TO SURGICAL BORDER AND ZERO SHADOW Design system
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color(0xFF070B11), RoundedCornerShape(12.dp))
                            .border(1.dp, NeonCyan.copy(alpha = 0.7f), RoundedCornerShape(12.dp))
                            .padding(16.dp)
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            // Card Top Header
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .background(NeonCyan.copy(alpha = 0.15f), RoundedCornerShape(4.dp))
                                            .border(0.5.dp, NeonCyan, RoundedCornerShape(4.dp))
                                            .padding(horizontal = 6.dp, vertical = 2.dp)
                                    ) {
                                        Text(
                                            text = insight.date,
                                            color = NeonCyan,
                                            fontSize = 8.5.sp,
                                            fontWeight = FontWeight.Bold,
                                            fontFamily = FontFamily.Monospace
                                        )
                                    }

                                    Box(
                                        modifier = Modifier
                                            .background(Color.Red.copy(alpha = 0.15f), RoundedCornerShape(4.dp))
                                            .border(0.5.dp, Color.Red, RoundedCornerShape(4.dp))
                                            .padding(horizontal = 6.dp, vertical = 2.dp)
                                    ) {
                                        Text(
                                            text = insight.intensity,
                                            color = Color.Red,
                                            fontSize = 8.5.sp,
                                            fontWeight = FontWeight.Bold,
                                            fontFamily = FontFamily.Monospace
                                        )
                                    }
                                }

                                Text(
                                    text = insight.rating,
                                    color = Color.LightGray,
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = FontFamily.Monospace
                                )
                            }

                            // Card Body Text
                            Text(
                                text = insight.text,
                                color = Color.White,
                                fontSize = 12.sp,
                                fontFamily = FontFamily.Monospace,
                                lineHeight = 17.sp
                            )

                            // Card Footer info
                            Divider(color = Color.Gray.copy(alpha = 0.2f))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "AGENT: THE MADHAT'R ⚡",
                                    color = NeonCyan.copy(alpha = 0.6f),
                                    fontSize = 8.sp,
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = FontFamily.Monospace
                                )
                                Text(
                                    text = "STATUS: ARCHIVED TRANSCRIPT ✔",
                                    color = Color.Gray,
                                    fontSize = 8.sp,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
