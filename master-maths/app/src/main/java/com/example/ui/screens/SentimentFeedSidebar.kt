package com.example.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material.icons.filled.FlashOn
import androidx.compose.material.icons.filled.Category
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.*
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
import com.example.model.SentimentFeedItem
import com.example.ui.components.glassContainerBackground
import com.example.ui.components.innerGlassContainerBackground
import com.example.ui.components.AnimatedTopHatSpinner
import com.example.ui.theme.LocalGambitTheme
import com.example.ui.theme.ArialNarrowFamily
import com.example.viewmodel.GambitViewModel

@Composable
fun SentimentFeedSidebar(vm: GambitViewModel) {
    val state by vm.state.collectAsState()
    val theme = LocalGambitTheme.current
    var searchQuery by remember { mutableStateOf("") }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.6f))
            .clickable { vm.toggleSentimentFeed(false) },
        contentAlignment = Alignment.CenterEnd
    ) {
        // Sidebar main window container
        Box(
            modifier = Modifier
                .fillMaxHeight()
                .fillMaxWidth(0.85f)
                .widthIn(max = 440.dp)
                .clickable(enabled = false) {} // Catch click events to prevent closing
                .glassContainerBackground(
                    baseColor = theme.brandPrimary.copy(alpha = 0.5f),
                    shape = RoundedCornerShape(topStart = 16.dp, bottomStart = 16.dp)
                )
                .border(
                    width = 1.dp,
                    brush = theme.borderBrush,
                    shape = RoundedCornerShape(topStart = 16.dp, bottomStart = 16.dp)
                )
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(20.dp)
            ) {
                // Header section
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "MAD REVEL SENTIMENT",
                            color = theme.brandPrimary,
                            fontWeight = FontWeight.Black,
                            fontFamily = ArialNarrowFamily,
                            fontSize = 18.sp,
                            style = TextStyle(
                                shadow = Shadow(
                                    color = theme.brandPrimary.copy(alpha = 0.8f),
                                    blurRadius = 8f
                                )
                            )
                        )
                        Text(
                            text = "Searchable Archive & Telemetry",
                            color = Color.LightGray,
                            fontSize = 10.sp,
                            fontFamily = ArialNarrowFamily
                        )
                    }

                    Row {
                        val context = androidx.compose.ui.platform.LocalContext.current
                        val filteredItems = remember(state.sentimentFeedItems, searchQuery) {
                            state.sentimentFeedItems.filter {
                                it.title.contains(searchQuery, ignoreCase = true) ||
                                it.text.contains(searchQuery, ignoreCase = true) ||
                                it.category.contains(searchQuery, ignoreCase = true) ||
                                it.sentiment.contains(searchQuery, ignoreCase = true) ||
                                it.timestamp.contains(searchQuery, ignoreCase = true)
                            }
                        }

                        IconButton(
                            onClick = {
                                val csvBuilder = StringBuilder()
                                csvBuilder.append("CLASS,FIELD_1,FIELD_2,FIELD_3,FIELD_4,FIELD_5\n")
                                
                                // Export reports
                                filteredItems.forEach { item ->
                                    val row = listOf(
                                        "REPORT",
                                        item.title.replace("\"", "\"\""),
                                        item.category.replace("\"", "\"\""),
                                        item.sentiment.replace("\"", "\"\""),
                                        item.multiplier.replace("\"", "\"\""),
                                        item.timestamp.replace("\"", "\"\"")
                                    ).joinToString(",") { "\"$it\"" }
                                    csvBuilder.append(row).append("\n")
                                }
                                
                                // Export wagers/bets
                                state.userBets.forEach { bet ->
                                    val row = listOf(
                                        "WAGER",
                                        bet.scenarioId.replace("\"", "\"\""),
                                        bet.outcome.replace("\"", "\"\""),
                                        bet.amount.toString(),
                                        bet.hasMadShield.toString(),
                                        "${bet.shieldPremiumTier * 100}%"
                                    ).joinToString(",") { "\"$it\"" }
                                    csvBuilder.append(row).append("\n")
                                }
                                
                                val csvText = csvBuilder.toString()
                                
                                val sendIntent = android.content.Intent().apply {
                                    action = android.content.Intent.ACTION_SEND
                                    putExtra(android.content.Intent.EXTRA_TEXT, csvText)
                                    putExtra(android.content.Intent.EXTRA_TITLE, "Gambit_Report_Export.csv")
                                    type = "text/csv"
                                }
                                val shareIntent = android.content.Intent.createChooser(sendIntent, "Exporting Gambit CSV Reports & Outcomes")
                                context.startActivity(shareIntent)
                            },
                            enabled = !state.isSentimentFeedLoading
                        ) {
                            Icon(
                                imageVector = Icons.Filled.Share,
                                contentDescription = "Export CSV",
                                tint = theme.brandPrimary
                            )
                        }

                        IconButton(
                            onClick = { vm.fetchSentimentFeed() },
                            enabled = !state.isSentimentFeedLoading
                        ) {
                            Icon(
                                imageVector = Icons.Filled.Refresh,
                                contentDescription = "Refresh Feed",
                                tint = theme.brandAccent
                            )
                        }
                        IconButton(onClick = { vm.toggleSentimentFeed(false) }) {
                            Icon(
                                imageVector = Icons.Filled.Close,
                                contentDescription = "Close Sidebar",
                                tint = Color.White
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))
                
                com.example.ui.components.AuthProtectedMiddleware(
                    requiredTier = com.example.model.AuthTier.BASIC,
                    authState = state.authState,
                    hideContentEntirely = false,
                    vm = vm,
                    modifier = Modifier.weight(1f)
                ) {
                    Column(modifier = Modifier.fillMaxSize()) {
                        // Search Box
                        OutlinedTextField(
                            value = searchQuery,
                            onValueChange = { searchQuery = it },
                            modifier = Modifier.fillMaxWidth(),
                            textStyle = TextStyle(color = Color.White, fontSize = 12.sp, fontFamily = ArialNarrowFamily),
                            placeholder = { Text("Filter past Gambit Reports...", color = Color.Gray, fontSize = 12.sp, fontFamily = ArialNarrowFamily) },
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = theme.brandAccent,
                                unfocusedBorderColor = theme.brandPrimary.copy(alpha = 0.5f),
                                cursorColor = theme.brandAccent
                            ),
                            shape = RoundedCornerShape(8.dp)
                        )
                        
                        Spacer(modifier = Modifier.height(12.dp))
        
                        // Content area
                        if (state.isSentimentFeedLoading) {
                            Column(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .weight(1f),
                                verticalArrangement = Arrangement.Center,
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                AnimatedTopHatSpinner(
                                    size = 56.dp,
                                    tint = theme.brandPrimary,
                                    bandColor = theme.brandSecondary,
                                    showLabel = false
                                )
                                Spacer(modifier = Modifier.height(20.dp))
                                Text(
                                    text = "DIALING NEURAL TRADERS...",
                                    color = theme.brandPrimary,
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = ArialNarrowFamily,
                                    fontSize = 12.sp
                                )
                                Text(
                                    text = "Generating custom news, tabloid commentary, and prediction sentiment...",
                                    color = Color.Gray,
                                    fontSize = 10.sp,
                                    fontFamily = ArialNarrowFamily,
                                    textAlign = TextAlign.Center,
                                    modifier = Modifier.padding(horizontal = 24.dp)
                                )
                            }
                        } else if (state.sentimentFeedError != null) {
                            Column(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .weight(1f),
                                verticalArrangement = Arrangement.Center,
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text(
                                    text = "❌ SIGNAL COLLAPSE",
                                    color = Color.Red,
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = ArialNarrowFamily,
                                    fontSize = 14.sp
                                )
                                Text(
                                    text = state.sentimentFeedError ?: "Unknown telemetry error",
                                    color = Color.White,
                                    fontSize = 11.sp,
                                    fontFamily = ArialNarrowFamily,
                                    textAlign = TextAlign.Center,
                                    modifier = Modifier.padding(16.dp)
                                )
                                Button(
                                    onClick = { vm.fetchSentimentFeed() },
                                    colors = ButtonDefaults.buttonColors(containerColor = theme.brandSecondary)
                                ) {
                                    Text("RE-CONNECT DISH", fontFamily = ArialNarrowFamily, fontSize = 11.sp)
                                }
                            }
                        } else {
                            // Feed list items
                            LazyColumn(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .weight(1f),
                                verticalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                item {
                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .innerGlassContainerBackground(
                                                baseColor = theme.brandSecondary,
                                                shape = RoundedCornerShape(12.dp)
                                            )
                                            .padding(8.dp)
                                    ) {
                                        Text(
                                            text = "⚡ Real-time telemetry linked directly to live RSS feeds. Refined into pure liquid gold parody.",
                                            color = theme.brandSecondary,
                                            fontSize = 10.sp,
                                            fontFamily = ArialNarrowFamily,
                                            textAlign = TextAlign.Center,
                                            modifier = Modifier.fillMaxWidth()
                                        )
                                    }
                                }
        
                                val filteredItems = state.sentimentFeedItems.filter {
                                    it.title.contains(searchQuery, ignoreCase = true) ||
                                    it.text.contains(searchQuery, ignoreCase = true) ||
                                    it.category.contains(searchQuery, ignoreCase = true) ||
                                    it.sentiment.contains(searchQuery, ignoreCase = true) ||
                                    it.timestamp.contains(searchQuery, ignoreCase = true)
                                }
        
                                items(filteredItems) { item ->
                                    SentimentItemCard(item = item)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun SentimentItemCard(item: SentimentFeedItem) {
    val theme = LocalGambitTheme.current
    
    val sentimentColor = when (item.sentiment.uppercase()) {
        "BULLISH" -> Color(0xFF00FF41)
        "BEARISH" -> Color(0xFFFF073A)
        "CHAOTIC" -> Color(0xFFFF007F)
        "MAD" -> Color(0xFFFFD700)
        else -> theme.brandPrimary
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .innerGlassContainerBackground(
                baseColor = sentimentColor,
                shape = RoundedCornerShape(12.dp)
            )
            .border(0.5.dp, sentimentColor.copy(alpha = 0.15f), RoundedCornerShape(12.dp))
            .padding(12.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            // Category, multiplier and timestamp row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Filled.Category,
                        contentDescription = "Category",
                        tint = sentimentColor,
                        modifier = Modifier.size(10.dp)
                    )
                    Text(
                        text = item.category.uppercase(),
                        color = sentimentColor,
                        fontWeight = FontWeight.Bold,
                        fontSize = 9.sp,
                        fontFamily = ArialNarrowFamily
                    )
                }

                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(4.dp))
                            .background(sentimentColor.copy(alpha = 0.15f))
                            .padding(horizontal = 4.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = item.multiplier,
                            color = sentimentColor,
                            fontWeight = FontWeight.Bold,
                            fontSize = 8.5.sp,
                            fontFamily = ArialNarrowFamily
                        )
                    }

                    Row(
                        horizontalArrangement = Arrangement.spacedBy(2.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Filled.AccessTime,
                            contentDescription = "Time",
                            tint = Color.Gray,
                            modifier = Modifier.size(10.dp)
                        )
                        Text(
                            text = item.timestamp,
                            color = Color.Gray,
                            fontSize = 8.5.sp,
                            fontFamily = ArialNarrowFamily
                        )
                    }
                }
            }

            // Headline Title
            Text(
                text = item.title,
                color = Color.White,
                fontWeight = FontWeight.ExtraBold,
                fontSize = 12.sp,
                fontFamily = ArialNarrowFamily,
                style = TextStyle(
                    shadow = Shadow(
                        color = sentimentColor.copy(alpha = 0.3f),
                        blurRadius = 3f
                    )
                )
            )

            // Sarcastic Commentary
            Text(
                text = item.text,
                color = Color.LightGray,
                fontSize = 10.5.sp,
                fontFamily = ArialNarrowFamily,
                lineHeight = 13.sp
            )

            // Sentiment tag at the bottom
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Filled.TrendingUp,
                    contentDescription = "Sentiment Trend",
                    tint = sentimentColor,
                    modifier = Modifier.size(12.dp)
                )
                Spacer(modifier = Modifier.width(2.dp))
                Text(
                    text = "${item.sentiment} CORE",
                    color = sentimentColor,
                    fontWeight = FontWeight.Black,
                    fontSize = 8.5.sp,
                    fontFamily = ArialNarrowFamily
                )
            }
        }
    }
}
