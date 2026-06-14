package com.example.ui.screens

import com.example.ui.components.HoverTooltip
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.components.HolographicCard
import com.example.ui.components.GlassKeycapButton
import com.example.ui.components.neonIconComposer
import com.example.ui.components.glassContainerBackground
import com.example.ui.components.innerGlassContainerBackground
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.StarBorder
import androidx.compose.material.icons.filled.Gavel
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.History
import com.example.ui.theme.*
import com.example.viewmodel.GambitViewModel
import java.text.SimpleDateFormat
import java.util.Date
import androidx.compose.foundation.Canvas
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AuctionScreen(vm: GambitViewModel) {
    val state by vm.state.collectAsState()
    val scroll = rememberScrollState()
    val canAffordPack = state.madxBalance >= state.dynamicPackPrice

    // Track user typed bids for each live auction id
    val activeBidInputs = remember { mutableStateMapOf<String, String>() }

    Column(
        Modifier
            .fillMaxSize()
            .background(BgDeep)
            .verticalScroll(scroll)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // SCREEN TITLE SECTION
        Column(Modifier.padding(horizontal = 4.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Icon(
                    imageVector = Icons.Filled.Gavel,
                    contentDescription = "Gavel Icon",
                    tint = BrandGold,
                    modifier = Modifier.size(28.dp)
                )
                Text(
                    "📦 MΛĐ MARKET AUCTIONS", 
                    color = BrandGold, 
                    fontSize = 24.sp, 
                    fontWeight = FontWeight.Black,
                    fontFamily = ArialNarrowFamily,
                    style = TextStyle(shadow = Shadow(BrandGoldGlow, blurRadius = 24f))
                )
            }
            Text(
                "Sovereign node bidding | Zero crypto jargon | Real-time integrity audit tracking", 
                color = BrandEggwhite.copy(alpha = 0.7f), 
                fontSize = 11.sp,
                fontFamily = ArialNarrowFamily,
                letterSpacing = 0.5.sp
            )
        }

        // SECTION 1: DUTCH AUCTION PACK
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .glassContainerBackground(NeonPurple, RoundedCornerShape(20.dp))
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "🔥 PREMIUM SCANDAL DECK PACK",
                        color = Color.White,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = ArialNarrowFamily
                    )
                    Box(
                        modifier = Modifier
                            .background(NeonPurple.copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                            .border(1.dp, NeonPurple, RoundedCornerShape(4.dp))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = "DUTCH BUYOUT",
                            color = NeonPurple,
                            fontSize = 8.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }

                Spacer(Modifier.height(12.dp))

                Box(Modifier.fillMaxWidth().height(160.dp), contentAlignment = Alignment.Center) {
                    Box(
                        Modifier
                            .size(150.dp)
                            .background(Brush.linearGradient(listOf(NeonPurple, NeonCyan, NeonMagenta)), RoundedCornerShape(20.dp))
                            .border(1.dp, GoldFlakeBrush, RoundedCornerShape(20.dp))
                            .padding(16.dp), 
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("SATIRICAL CARDS", color = BgDeep, fontWeight = FontWeight.Black, fontSize = 13.sp, fontFamily = ArialNarrowFamily)
                            Text("O-V DECK v3.0.1", color = BgDeep.copy(alpha=0.7f), fontSize = 9.sp, fontFamily = ArialNarrowFamily, fontWeight = FontWeight.Bold)
                            Spacer(Modifier.height(8.dp))
                            Text(
                                "${state.dynamicPackPrice.toInt()} MADx",
                                color = BrandEggwhite, 
                                fontSize = 28.sp, 
                                fontWeight = FontWeight.Black, 
                                fontFamily = ArialNarrowFamily,
                                style = TextStyle(shadow = Shadow(BgDeep, blurRadius = 12f))
                            )
                            Text("CURRENT FLOOR", color = BrandEggwhite.copy(alpha=0.8f), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                Spacer(Modifier.height(12.dp))

                HoverTooltip(text = "Mint a randomized Scandal Pack using MADx credits.") {
                    val baseBtnColor = if (canAffordPack) NeonGreen else Color.Gray.copy(alpha = 0.5f)
                    GlassKeycapButton(
                        onClick = { if (canAffordPack) vm.purchasePack() },
                        modifier = Modifier.fillMaxWidth().height(48.dp),
                        baseColor = baseBtnColor,
                        shape = RoundedCornerShape(12.dp),
                        icon = {
                            Icon(
                                imageVector = Icons.Filled.LocalFireDepartment,
                                contentDescription = "Pack Auction",
                                modifier = Modifier
                                    .size(20.dp)
                                    .neonIconComposer(isActive = canAffordPack),
                                tint = Color.White
                            )
                        },
                        label = {
                            Text(
                                if (canAffordPack) "MINT SCANDAL PACK FOR ${state.dynamicPackPrice.toInt()} MADx" else "INSUFFICIENT BALANCE", 
                                color = if (canAffordPack) Color.White else Color.Gray, 
                                fontWeight = FontWeight.Black,
                                fontSize = 13.sp,
                                letterSpacing = 1.sp
                            )
                        }
                    )
                }
            }
        }

        // SECTION 2: LIVE ASSET BIDDING ("MARKET AUCTIONS")
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .glassContainerBackground(NeonCyan, RoundedCornerShape(20.dp))
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Icon(Icons.Filled.NotificationsActive, contentDescription = "Live", tint = NeonCyan, modifier = Modifier.size(16.dp))
                        Text(
                            text = "⚡ LIVE ASSET BIDDING INTERFACE",
                            color = Color.White,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = ArialNarrowFamily,
                            style = TextStyle(shadow = Shadow(NeonCyan, blurRadius = 8f))
                        )
                    }
                    Box(
                        modifier = Modifier
                            .background(NeonCyan.copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                            .border(1.dp, NeonCyan, RoundedCornerShape(4.dp))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = "3 ACTIVE RESERVES",
                            color = NeonCyan,
                            fontSize = 8.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }

                Spacer(Modifier.height(4.dp))
                Text(
                    text = "Track specific live collectible digital assets to receive outbid indicators and ending soon warnings directly in your sovereign alert feed.",
                    color = Color.LightGray,
                    fontSize = 11.sp,
                    fontFamily = ArialNarrowFamily,
                    lineHeight = 14.sp
                )

                Spacer(Modifier.height(16.dp))

                // Iterate over active live auctions state
                if (state.liveAuctions.isEmpty()) {
                    Text(
                        "Synchronizing live network auctions...",
                        color = Color.Gray,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth().padding(16.dp),
                        fontFamily = ArialNarrowFamily
                    )
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                        state.liveAuctions.forEach { auction ->
                            // Formatted remaining seconds
                            val isUrgent = auction.timeRemainingSeconds <= 30
                            val timeColor = if (isUrgent) BrandCrimson else NeonCyan
                            val glowColor = if (isUrgent) BrandCrimson.copy(alpha = 0.35f) else NeonCyan.copy(alpha = 0.35f)

                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .innerGlassContainerBackground(Color.Black.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
                                    .border(
                                        1.dp, 
                                        if (auction.isTracked) NeonCyan.copy(alpha = 0.4f) else Color.White.copy(alpha = 0.1f), 
                                        RoundedCornerShape(12.dp)
                                    )
                                    .padding(14.dp)
                            ) {
                                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                    // Row 1: Title & Tracking Toggle
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column(modifier = Modifier.weight(1f)) {
                                            Row(
                                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Box(
                                                    modifier = Modifier
                                                        .background(Color.White.copy(alpha = 0.1f), RoundedCornerShape(4.dp))
                                                        .padding(horizontal = 5.dp, vertical = 1.dp)
                                                ) {
                                                    Text(
                                                        text = auction.category.uppercase(),
                                                        color = Color.LightGray,
                                                        fontSize = 8.sp,
                                                        fontWeight = FontWeight.Bold,
                                                        fontFamily = FontFamily.Monospace
                                                    )
                                                }
                                                StatusBadge(auction.timeRemainingSeconds)
                                            }
                                            Spacer(Modifier.height(2.dp))
                                            Text(
                                                text = auction.title,
                                                color = Color.White,
                                                fontSize = 14.sp,
                                                fontWeight = FontWeight.Bold,
                                                fontFamily = ArialFamily
                                            )
                                        }

                                        // Tracking Button
                                        Button(
                                            onClick = { vm.toggleAuctionTracking(auction.id) },
                                            colors = ButtonDefaults.buttonColors(
                                                containerColor = if (auction.isTracked) NeonCyan.copy(alpha = 0.25f) else Color.DarkGray.copy(alpha = 0.4f),
                                                contentColor = if (auction.isTracked) Color.White else Color.Gray
                                            ),
                                            shape = RoundedCornerShape(6.dp),
                                            border = androidx.compose.foundation.BorderStroke(
                                                0.5.dp, 
                                                if (auction.isTracked) NeonCyan else Color.Gray.copy(alpha = 0.5f)
                                            ),
                                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
                                            modifier = Modifier.height(26.dp)
                                        ) {
                                            Row(
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                                            ) {
                                                Icon(
                                                    imageVector = if (auction.isTracked) Icons.Filled.Star else Icons.Filled.StarBorder,
                                                    contentDescription = "Track",
                                                    tint = if (auction.isTracked) BrandGold else Color.Gray,
                                                    modifier = Modifier.size(12.dp)
                                                )
                                                Text(
                                                    text = if (auction.isTracked) "TRACKED" else "TRACK ASSET",
                                                    fontSize = 9.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    fontFamily = ArialNarrowFamily
                                                )
                                            }
                                        }
                                    }

                                    // Description
                                    Text(
                                        text = auction.description,
                                        color = Color.Gray,
                                        fontSize = 11.sp,
                                        fontFamily = ArialNarrowFamily,
                                        lineHeight = 14.sp
                                    )

                                    BiddingHistoryGraph(
                                        biddingHistory = auction.biddingHistory,
                                        modifier = Modifier.padding(vertical = 4.dp)
                                    )

                                    Divider(color = Color.White.copy(alpha = 0.05f), thickness = 1.dp)

                                    // Row 2: Bidding Details & Timer
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column {
                                            Text("CURRENT HIGHEST BID", color = Color.Gray, fontSize = 9.sp, fontFamily = ArialNarrowFamily)
                                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                                Text(
                                                    text = "${auction.currentBid.toInt()} MADx",
                                                    color = if (auction.highBidder.contains("You")) NeonGreen else Color.White,
                                                    fontSize = 16.sp,
                                                    fontWeight = FontWeight.Black,
                                                    fontFamily = ArialFamily
                                                )
                                                if (auction.highBidder.contains("You")) {
                                                    Text(
                                                        text = "(Your High!)",
                                                        color = NeonGreen,
                                                        fontSize = 10.sp,
                                                        fontWeight = FontWeight.Bold,
                                                        fontFamily = ArialNarrowFamily
                                                    )
                                                }
                                            }
                                            Text(
                                                text = "Filed by: ${auction.highBidder}",
                                                color = Color.LightGray.copy(alpha = 0.6f),
                                                fontSize = 10.sp,
                                                fontFamily = ArialNarrowFamily
                                            )
                                        }

                                        Column(horizontalAlignment = Alignment.End) {
                                            Text("SOPHISTICATED TIME REMAINING", color = Color.Gray, fontSize = 9.sp, fontFamily = ArialNarrowFamily)
                                            val minutes = auction.timeRemainingSeconds / 60
                                            val secondsLeft = auction.timeRemainingSeconds % 60
                                            val formattedDuration = String.format("%02d:%02d", minutes, secondsLeft)
                                            Text(
                                                text = formattedDuration,
                                                color = timeColor,
                                                fontSize = 16.sp,
                                                fontWeight = FontWeight.ExtraBold,
                                                fontFamily = FontFamily.Monospace,
                                                style = TextStyle(shadow = Shadow(glowColor, blurRadius = 8f))
                                            )
                                            if (isUrgent) {
                                                Text(
                                                    text = "⚠️ CLOSING IMMINENT",
                                                    color = BrandCrimson,
                                                    fontSize = 9.sp,
                                                    fontWeight = FontWeight.Black,
                                                    fontFamily = ArialNarrowFamily
                                                )
                                            } else {
                                                Text(
                                                    text = "Accepting bids",
                                                    color = Color.Gray,
                                                    fontSize = 9.sp,
                                                    fontFamily = ArialNarrowFamily
                                                )
                                            }
                                        }
                                    }

                                    Spacer(Modifier.height(4.dp))

                                    // Quick Increments Row
                                    Row(
                                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                                        modifier = Modifier.fillMaxWidth().padding(bottom = 4.dp)
                                    ) {
                                        listOf(10, 25, 50, 100).forEach { increment ->
                                            Box(
                                                modifier = Modifier
                                                    .weight(1f)
                                                    .background(Color.White.copy(alpha = 0.05f), RoundedCornerShape(6.dp))
                                                    .border(0.5.dp, Color.White.copy(alpha = 0.12f), RoundedCornerShape(6.dp))
                                                    .clickable {
                                                        val currentVal = activeBidInputs[auction.id]?.toDoubleOrNull() ?: auction.currentBid
                                                        activeBidInputs[auction.id] = (currentVal + increment).toInt().toString()
                                                    }
                                                    .padding(vertical = 6.dp),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                Text(
                                                    text = "+$increment",
                                                    color = NeonCyan,
                                                    fontSize = 11.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    fontFamily = FontFamily.Monospace
                                                )
                                            }
                                        }
                                    }

                                    // Row 3: Action Bid Field & Quick Presets
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        val currentBidInput = activeBidInputs[auction.id] ?: ""

                                        OutlinedTextField(
                                            value = currentBidInput,
                                            onValueChange = { activeBidInputs[auction.id] = it },
                                            placeholder = { Text("Enter MADx bid amount", color = Color.Gray, fontSize = 11.sp, fontFamily = ArialNarrowFamily) },
                                            modifier = Modifier.weight(1f).height(46.dp),
                                            textStyle = TextStyle(color = Color.White, fontSize = 12.sp, fontFamily = ArialFamily),
                                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                            colors = OutlinedTextFieldDefaults.colors(
                                                focusedBorderColor = NeonCyan,
                                                unfocusedBorderColor = Color.White.copy(alpha = 0.15f),
                                                focusedContainerColor = Color.Black.copy(alpha = 0.2f),
                                                unfocusedContainerColor = Color.Black.copy(alpha = 0.2f)
                                            ),
                                            shape = RoundedCornerShape(8.dp),
                                            singleLine = true
                                        )

                                        // Bid Button
                                        Button(
                                            onClick = {
                                                val parsedValue = currentBidInput.toDoubleOrNull()
                                                if (parsedValue != null && parsedValue > auction.currentBid) {
                                                    vm.placeBid(auction.id, parsedValue)
                                                    activeBidInputs[auction.id] = "" // reset
                                                } else {
                                                    // Quick bid auto-escalation default
                                                    val automaticEscValue = auction.currentBid + 25.0
                                                    vm.placeBid(auction.id, automaticEscValue)
                                                }
                                            },
                                            colors = ButtonDefaults.buttonColors(
                                                containerColor = NeonCyan,
                                                contentColor = Color.Black
                                            ),
                                            shape = RoundedCornerShape(8.dp),
                                            modifier = Modifier.height(46.dp),
                                            contentPadding = PaddingValues(horizontal = 12.dp)
                                        ) {
                                            Row(
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                                            ) {
                                                Icon(Icons.Filled.Gavel, contentDescription = "Place Bid", tint = Color.Black, modifier = Modifier.size(14.dp))
                                                Text(
                                                    text = if (currentBidInput.isNotEmpty()) "SUBMIT BID" else "+25 QUICK BID",
                                                    fontSize = 10.5.sp,
                                                    fontWeight = FontWeight.Black,
                                                    fontFamily = ArialNarrowFamily
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // SECTION 3: 'AUCTION ACTIVITY' FEED (MIRRORS Z-LIE METER STYLE)
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .glassContainerBackground(NeonPurple, RoundedCornerShape(20.dp))
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth().padding(bottom = 6.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Icon(Icons.Filled.History, contentDescription = "History", tint = NeonPurple, modifier = Modifier.size(16.dp))
                        Text(
                            text = "📢 REAL-TIME BIDDING & SETTLEMENT REGISTRY",
                            color = Color.White,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = ArialNarrowFamily,
                            style = TextStyle(shadow = Shadow(NeonPurple, blurRadius = 8f))
                        )
                    }
                    Box(
                        modifier = Modifier
                            .background(NeonPurple.copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                            .border(1.dp, NeonPurple, RoundedCornerShape(4.dp))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = "LIVE FEED",
                            color = NeonPurple,
                            fontSize = 8.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }

                Text(
                    text = "A complete, non-crypto structured archive displaying verification bids, settlement outcomes, and active public reservation changes.",
                    color = Color.LightGray,
                    fontSize = 11.sp,
                    fontFamily = ArialNarrowFamily,
                    lineHeight = 14.sp
                )

                Spacer(Modifier.height(14.dp))

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(260.dp)
                        .innerGlassContainerBackground(Color.Black.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
                        .border(1.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(12.dp))
                        .padding(8.dp)
                ) {
                    val listScrollState = rememberScrollState()
                    
                    if (state.auctionActivity.isEmpty()) {
                        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Text(
                                "No bidding activity archived in this cycle",
                                color = Color.Gray,
                                fontSize = 11.sp,
                                fontFamily = ArialNarrowFamily
                            )
                        }
                    } else {
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .verticalScroll(listScrollState),
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            state.auctionActivity.forEach { activity ->
                                // Styled items based on activity type
                                val typeColor = when (activity.type) {
                                    "SETTLEMENT" -> BrandGold
                                    "START" -> NeonGreen
                                    "OUTBID" -> BrandCrimson
                                    else -> Color.White
                                }

                                val iconEmoji = when (activity.type) {
                                    "SETTLEMENT" -> "⚖️"
                                    "START" -> "🏁"
                                    "OUTBID" -> "🚨"
                                    else -> "⚡"
                                }

                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(
                                            Color.White.copy(alpha = 0.02f), 
                                            RoundedCornerShape(6.dp)
                                        )
                                        .border(
                                            0.5.dp, 
                                            Color.White.copy(alpha = 0.05f), 
                                            RoundedCornerShape(6.dp)
                                        )
                                        .padding(10.dp)
                                ) {
                                    Column {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Row(
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                                            ) {
                                                Text(iconEmoji, fontSize = 12.sp)
                                                Text(
                                                    text = activity.title.uppercase(),
                                                    color = typeColor,
                                                    fontSize = 11.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    fontFamily = FontFamily.Monospace
                                                )
                                            }

                                            // Subdued timestamp helper
                                            val timeStr = remember(activity.timestamp) {
                                                SimpleDateFormat("HH:mm:ss").format(Date(activity.timestamp))
                                            }
                                            Text(
                                                text = timeStr,
                                                color = Color.Gray,
                                                fontSize = 9.sp,
                                                fontFamily = FontFamily.Monospace
                                            )
                                        }

                                        Spacer(Modifier.height(4.dp))

                                        Text(
                                            text = activity.description,
                                            color = Color.LightGray,
                                            fontSize = 11.sp,
                                            fontFamily = ArialNarrowFamily,
                                            lineHeight = 13.sp
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // SECTION 4: YOUR DECK
        Spacer(Modifier.height(8.dp))
        Text(
            text = "YOUR DECK (${state.ownedCards.size})", 
            color = NeonCyan, 
            fontWeight = FontWeight.Bold, 
            fontFamily = ArialNarrowFamily, 
            letterSpacing = 1.sp
        )
        
        if (state.ownedCards.isEmpty()) {
            Box(
                Modifier
                    .fillMaxWidth()
                    .background(BgCard.copy(alpha = 0.15f), RoundedCornerShape(12.dp))
                    .border(1.dp, GoldFlakeBrush, RoundedCornerShape(12.dp))
                    .padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "NO CARDS YET.\nMint a premium scandal pack to begin your collection.", 
                    color = Color.Gray, 
                    textAlign = TextAlign.Center, 
                    fontFamily = ArialNarrowFamily
                )
            }
        } else {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(16.dp), modifier = Modifier.fillMaxWidth()) {
                items(state.ownedCards.reversed()) { card -> HolographicCard(card = card) }
            }
        }
    }
}

@Composable
fun StatusBadge(timeRemainingSeconds: Int) {
    val (text, color, glow) = when {
        timeRemainingSeconds <= 0 -> Triple("SOLD", BrandGold, BrandGoldGlow)
        timeRemainingSeconds <= 30 -> Triple("ENDING SOON", BrandCrimson, BrandCrimson.copy(alpha = 0.4f))
        else -> Triple("ACTIVE", NeonGreen, NeonGreen.copy(alpha = 0.4f))
    }

    Box(
        modifier = Modifier
            .background(color.copy(alpha = 0.15f), RoundedCornerShape(4.dp))
            .border(1.dp, color.copy(alpha = 0.6f), RoundedCornerShape(4.dp))
            .padding(horizontal = 6.dp, vertical = 2.dp)
    ) {
        Text(
            text = text,
            color = color,
            fontSize = 8.sp,
            fontWeight = FontWeight.Black,
            fontFamily = FontFamily.Monospace,
            style = TextStyle(shadow = Shadow(glow, blurRadius = 6f))
        )
    }
}

@Composable
fun BiddingHistoryGraph(
    biddingHistory: List<Double>,
    modifier: Modifier = Modifier
) {
    if (biddingHistory.isEmpty()) return

    val theme = LocalGambitTheme.current
    val maxPrice = biddingHistory.maxOrNull()?.toFloat() ?: 100f
    val minPrice = biddingHistory.minOrNull()?.toFloat() ?: 0f
    val priceRange = (maxPrice - minPrice).coerceAtLeast(10f)

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(115.dp)
            .background(Color.Black.copy(alpha = 0.25f), RoundedCornerShape(10.dp))
            .border(0.5.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(10.dp))
            .padding(horizontal = 10.dp, vertical = 10.dp)
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "📈 PRICE TREND REGISTRY",
                    color = Color.LightGray.copy(alpha = 0.8f),
                    fontSize = 8.5.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
                Text(
                    text = "Current: ${biddingHistory.last().toInt()} MADx",
                    color = NeonCyan,
                    fontSize = 8.5.sp,
                    fontWeight = FontWeight.ExtraBold,
                    fontFamily = FontFamily.Monospace
                )
            }
            
            Spacer(Modifier.height(8.dp))

            Canvas(modifier = Modifier.fillMaxSize().weight(1f)) {
                val padding = 8f
                val width = size.width - padding * 2
                val height = size.height - padding * 2
                
                // Draw horizontal dotted reference guideline grid (Recharts style)
                for (i in 0..2) {
                    val yLine = padding + height * (i / 2f)
                    drawLine(
                        color = Color.White.copy(alpha = 0.08f),
                        start = Offset(padding, yLine),
                        end = Offset(size.width - padding, yLine),
                        strokeWidth = 1f
                    )
                }

                val ptsCount = biddingHistory.size
                if (ptsCount > 1) {
                    val paintPath = Path()
                    val boundingPath = Path() // For glass-shaded area underneath the curve
                    var isFirst = true
                    
                    val nodePoints = mutableListOf<Offset>()

                    biddingHistory.forEachIndexed { i, price ->
                        val xProgress = i / (ptsCount - 1).toFloat()
                        val x = padding + width * xProgress
                        
                        // Inverse normalized price: higher price is closer to the top (0y)
                        val yNormalized = (price.toFloat() - minPrice) / priceRange
                        val y = padding + height * (1f - yNormalized)
                        
                        val pt = Offset(x, y)
                        nodePoints.add(pt)
                        
                        if (isFirst) {
                            paintPath.moveTo(x, y)
                            boundingPath.moveTo(x, size.height) // start from bottom
                            boundingPath.lineTo(x, y)
                            isFirst = false
                        } else {
                            paintPath.lineTo(x, y)
                            boundingPath.lineTo(x, y)
                        }
                    }
                    
                    // Close the shaded gradient boundary at the bottom right corner
                    boundingPath.lineTo(padding + width, size.height)
                    boundingPath.lineTo(padding, size.height)
                    boundingPath.close()

                    // 1. Shaded neon-glass background fill (Recharts Area style)
                    drawPath(
                        path = boundingPath,
                        brush = Brush.verticalGradient(
                            colors = listOf(NeonCyan.copy(alpha = 0.12f), Color.Transparent)
                        )
                    )

                    // 2. High-contrast neon price curve
                    drawPath(
                        path = paintPath,
                        color = NeonCyan,
                        style = Stroke(
                            width = 3.5f,
                            cap = StrokeCap.Round,
                            join = StrokeJoin.Round
                        )
                    )

                    // 3. Round endpoints / Recharts node circles
                    nodePoints.forEachIndexed { index, dt ->
                        val isLast = index == nodePoints.lastIndex
                        val colorAccent = if (isLast) NeonGreen else NeonCyan
                        val outerRadius = if (isLast) 5.5f else 4f
                        
                        drawCircle(
                            color = colorAccent,
                            radius = outerRadius,
                            center = dt
                        )
                        drawCircle(
                            color = BgDeep,
                            radius = outerRadius - 1.5f,
                            center = dt
                        )
                    }
                }
            } // Close Canvas
        } // Close Column
    }
}
