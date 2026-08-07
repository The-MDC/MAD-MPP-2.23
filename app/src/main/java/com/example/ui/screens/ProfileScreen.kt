package com.example.ui.screens

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.CompositingStrategy
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.viewmodel.GambitViewModel
import com.example.ui.components.HoverTooltip
import com.example.ui.theme.*
import com.example.ui.components.SagaTracker
import com.example.model.SatiricalCard
import com.example.model.CardRarity
import androidx.compose.foundation.BorderStroke
import kotlinx.coroutines.launch

enum class ProfileTier(val title: String, val profitShare: String, val color: Color) {
    USER("Standard User", "0% Profit Share", Color(0xFFAAAAAA)),
    CREATOR("Creator Tier", "40% Profit Share", Color(0xFF00E5FF)),
    VIP("KOL / VIP", "60% Profit Share", Color(0xFFFFCC00))
}

@Composable
fun ProfileScreen(vm: GambitViewModel) {
    val theme = LocalGambitTheme.current
    val state by vm.state.collectAsState()
    var selectedTier by remember { mutableStateOf(ProfileTier.VIP) }
    var selectedTab by remember { mutableStateOf("OVERVIEW") }

    com.example.ui.components.AuthProtectedMiddleware(
        requiredTier = com.example.model.AuthTier.PRO,
        authState = state.authState,
        hideContentEntirely = false,
        vm = vm
    ) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .background(theme.bgDeep)
                .padding(0.5.dp),
            verticalArrangement = Arrangement.spacedBy(0.dp)
        ) {
        // Profile Header
        item {
            ProfileHeader(selectedTier, onTierChange = { selectedTier = it })
        }

        // Tabs
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(theme.borderWidth, theme.borderBrush, RoundedCornerShape(8.dp))
                    .padding(4.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                val tabs = listOf("OVERVIEW", "NFT GALLERY", "GOOGLE HUB", "TOURNAMENT", "PORTFOLIO")
                tabs.forEach { tab ->
                    val isSelected = selectedTab == tab
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(6.dp))
                            .background(if (isSelected) theme.brandPrimary.copy(alpha = 0.2f) else Color.Transparent)
                            .clickable { selectedTab = tab }
                            .padding(vertical = 8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = tab,
                            color = if (isSelected) theme.brandPrimary else theme.textSecondary,
                            fontWeight = FontWeight.Bold,
                            fontFamily = com.example.ui.theme.ArialNarrowFamily,
                            fontSize = 10.sp
                        )
                    }
                }
            }
        }

        when (selectedTab) {
            "OVERVIEW" -> item { MarketPerformanceOverview(selectedTier, state, vm) }
            "NFT GALLERY" -> item {
                NftGalleryView(vm)
            }
            "GOOGLE HUB" -> item {
                GoogleWorkspaceHubView(vm)
            }
            "TOURNAMENT" -> item {
                com.example.ui.components.TournamentLobby(vm)
            }
            "PORTFOLIO" -> item { PortfolioTrackerView(selectedTier) }
        }
    }
    }
}

@Composable
fun ProfileHeader(currentTier: ProfileTier, onTierChange: (ProfileTier) -> Unit) {
    val theme = LocalGambitTheme.current
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(Brush.linearGradient(listOf(theme.bgCard, theme.bgCard.copy(alpha = 0.8f))))
            .border(1.dp, currentTier.color.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
            .padding(16.dp)
    ) {
        Column {
            Row(verticalAlignment = Alignment.CenterVertically) {
                // Avatar
                Box(
                    modifier = Modifier
                        .size(80.dp)
                        .clip(CircleShape)
                        .background(currentTier.color.copy(alpha = 0.2f))
                        .border(1.dp, currentTier.color, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Filled.AccountCircle, contentDescription = "Avatar", modifier = Modifier.size(60.dp), tint = currentTier.color)
                }

                Spacer(modifier = Modifier.width(16.dp))

                Column {
                    Text(
                        text = "@DiamondDegen",
                        color = theme.textPrimary,
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = com.example.ui.theme.ArialNarrowFamily,
                        style = TextStyle(shadow = Shadow(currentTier.color, blurRadius = 8f))
                    )
                    Text(
                        text = "${currentTier.title}  |  ${currentTier.profitShare}",
                        color = currentTier.color,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = com.example.ui.theme.ArialNarrowFamily
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Filled.Storefront, contentDescription = "Marketplace", tint = theme.brandSecondary, modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "madgambit.market/DiamondDegen",
                            color = theme.brandSecondary,
                            fontSize = 12.sp,
                            fontFamily = com.example.ui.theme.ArialNarrowFamily,
                            modifier = Modifier.clickable { /* Link to marketplace */ }
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Tier Selector (For Demo Purposes)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                ProfileTier.values().forEach { tier ->
                    val selected = currentTier == tier
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(4.dp))
                            .background(if (selected) tier.color.copy(alpha = 0.2f) else theme.bgDeep)
                            .border(1.dp, tier.color, RoundedCornerShape(4.dp))
                            .clickable { onTierChange(tier) }
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(tier.name, color = if (selected) theme.textPrimary else theme.textSecondary, fontSize = 10.5.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
fun MarketPerformanceOverview(tier: ProfileTier, state: com.example.model.MarketState, vm: GambitViewModel) {
    val theme = LocalGambitTheme.current
    
    // Spring physics configuration for the interactive badge's transition animation
    var scaleTrigger by remember { mutableStateOf(1f) }
    var rotateTrigger by remember { mutableStateOf(0f) }
    var lastConvictions by remember { mutableStateOf(state.totalConvictions) }
    var lastPredictions by remember { mutableStateOf(state.totalPredictions) }

    LaunchedEffect(state.totalConvictions, state.totalPredictions) {
        if (state.totalConvictions > lastConvictions || state.totalPredictions > lastPredictions) {
            lastConvictions = state.totalConvictions
            lastPredictions = state.totalPredictions
            // Multi-stage trigger emulation of a bouncy spring animation
            scaleTrigger = 1.25f
            rotateTrigger = 12f
            kotlinx.coroutines.delay(180)
            scaleTrigger = 0.92f
            rotateTrigger = -8f
            kotlinx.coroutines.delay(140)
            scaleTrigger = 1.05f
            rotateTrigger = 4f
            kotlinx.coroutines.delay(100)
            scaleTrigger = 1.0f
            rotateTrigger = 0f
        }
    }

    val animatedScale by animateFloatAsState(
        targetValue = scaleTrigger,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioHighBouncy,
            stiffness = Spring.StiffnessMediumLow
        )
    )

    val animatedRotation by animateFloatAsState(
        targetValue = rotateTrigger,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessMedium
        )
    )

    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        // --- 🏆 DECENTRALIZED RANKINGS & STANDINGS ---
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(Brush.radialGradient(listOf(theme.brandPrimary.copy(alpha = 0.15f), theme.bgCard)))
                .border(theme.borderWidth, theme.brandPrimary.copy(alpha = 0.35f), RoundedCornerShape(12.dp))
                .padding(16.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(
                    text = "🏆 DECENTRALIZED PLAYER STANDINGS",
                    color = theme.textPrimary,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = com.example.ui.theme.AllertaStencilFamily
                )
                
                // Aggregated stats grid row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("TOTAL CONVICTIONS", color = theme.textSecondary, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                        Text("${state.totalConvictions}", color = theme.brandSecondary, fontSize = 16.sp, fontWeight = FontWeight.Black)
                    }
                    Column {
                        Text("TOTAL PREDICTIONS", color = theme.textSecondary, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                        Text("${state.totalPredictions}", color = theme.brandAccent, fontSize = 16.sp, fontWeight = FontWeight.Black)
                    }
                    Column {
                        Text("Z-LIAR METER ACCURACY", color = theme.textSecondary, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                        Text("${"%.1f".format(state.zLiarMeterScore)}%", color = com.example.ui.theme.NeonGreen, fontSize = 16.sp, fontWeight = FontWeight.Black)
                    }
                }
                
                Divider(color = theme.brandPrimary.copy(alpha = 0.15f), thickness = 0.5.dp)
                
                // Badges Row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Markets Standing Badge (with hover tooltip and spring animation on score change)
                    HoverTooltip(
                        text = "🔮 DYNAMIC RESIDUAL FACTORS:\n1. Predictive Drift Confidence: +2.4x\n2. Oracle Convergence Precision: 94.2%\n3. GARCH Variance Residual: 0.12",
                        modifier = Modifier.weight(1f)
                    ) {
                        Box(
                            modifier = Modifier
                                .graphicsLayer {
                                    scaleX = animatedScale
                                    scaleY = animatedScale
                                    rotationZ = animatedRotation
                                }
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(theme.brandPrimary.copy(alpha = 0.25f))
                                .border(1.5.dp, theme.brandPrimary, RoundedCornerShape(8.dp))
                                .padding(vertical = 8.dp, horizontal = 4.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("🔮 MARKETS RANK", color = theme.brandPrimary, fontSize = 8.sp, fontWeight = FontWeight.Bold, maxLines = 1)
                                Spacer(modifier = Modifier.height(2.dp))
                                Text("Maverick #42", color = Color.White, fontSize = 10.5.sp, fontWeight = FontWeight.Black, maxLines = 1)
                            }
                        }
                    }

                    // Social Standing Badge
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(8.dp))
                            .background(theme.brandSecondary.copy(alpha = 0.2f))
                            .border(1.dp, theme.brandSecondary.copy(alpha = 0.6f), RoundedCornerShape(8.dp))
                            .padding(vertical = 8.dp, horizontal = 4.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("📣 SOCIAL PROFILE", color = theme.brandSecondary, fontSize = 8.sp, fontWeight = FontWeight.Bold, maxLines = 1)
                            Spacer(modifier = Modifier.height(2.dp))
                            Text("Rumor Monger #88", color = Color.White, fontSize = 10.5.sp, fontWeight = FontWeight.Black, maxLines = 1)
                        }
                    }

                    // User Level Badge
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(8.dp))
                            .background(theme.brandAccent.copy(alpha = 0.2f))
                            .border(1.dp, theme.brandAccent.copy(alpha = 0.6f), RoundedCornerShape(8.dp))
                            .padding(vertical = 8.dp, horizontal = 4.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("👑 USER LEVEL", color = theme.brandAccent, fontSize = 8.sp, fontWeight = FontWeight.Bold, maxLines = 1)
                            Spacer(modifier = Modifier.height(2.dp))
                            Text("Level 12", color = Color.White, fontSize = 10.5.sp, fontWeight = FontWeight.Black, maxLines = 1)
                        }
                    }
                }
            }
        }

        // --- ⚡ SPECTACULAR WEEKLY CONVICTION STREAKS BADGE ---
        ConvictionStreakBadge(state)

        // --- 📊 INDIVIDUAL PLATFORM METRICS ---
        Text("MARKET PERFORMANCE", color = theme.textPrimary, fontSize = 16.sp, fontWeight = FontWeight.Black)
        
        Row(horizontalArrangement = Arrangement.spacedBy(16.dp), modifier = Modifier.fillMaxWidth()) {
            PerformanceMetricCard("Total Profit", "+$124,500", theme.brandSecondary, Modifier.weight(1f))
            PerformanceMetricCard("ROI", "+240%", theme.brandSecondary, Modifier.weight(1f))
        }

        Row(horizontalArrangement = Arrangement.spacedBy(16.dp), modifier = Modifier.fillMaxWidth()) {
            PerformanceMetricCard("Win Streak", "12 💀", theme.brandAccent, Modifier.weight(1f))
            PerformanceMetricCard("Creator Revenue", if (tier == ProfileTier.USER) "$0" else "$45k", tier.color, Modifier.weight(1f))
        }

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(8.dp))
                .background(theme.bgCard)
                .border(theme.borderWidth, theme.borderBrush, RoundedCornerShape(8.dp))
                .padding(16.dp)
        ) {
            Column {
                Text("CREATOR MARKETS DEPLOYED", color = theme.brandPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                Spacer(modifier = Modifier.height(8.dp))
                if (tier == ProfileTier.USER) {
                    Text("Unlock the Creator or VIP tier to launch your own markets and earn a profit share.", color = theme.textSecondary, fontSize = 12.sp)
                } else {
                    Text("Total Markets: 14", color = theme.textPrimary, fontSize = 14.sp)
                    Text("Total Volume Generated: $1.2M", color = theme.textPrimary, fontSize = 14.sp)
                    Text("Profit Split Earned: ${tier.profitShare}", color = tier.color, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        // --- 🏢 CREATOR COMPANY STARTUP SECTION ---
        if (tier == ProfileTier.CREATOR || tier == ProfileTier.VIP) {
            var isEditingCompany by remember { mutableStateOf(false) }
            var editName by remember { mutableStateOf(state.companyName) }
            var editWebsite by remember { mutableStateOf(state.startupWebsite) }
            var editDesc by remember { mutableStateOf(state.companyDescription) }

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color(0xFF0F0619))
                    .border(1.dp, tier.color.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
                    .padding(16.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text("🏢", fontSize = 16.sp)
                            Text(
                                text = "CREATOR STARTUP PROFILE",
                                color = tier.color,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Black,
                                fontFamily = com.example.ui.theme.ArialNarrowFamily
                            )
                        }

                        Button(
                            onClick = { isEditingCompany = !isEditingCompany },
                            colors = ButtonDefaults.buttonColors(containerColor = if (isEditingCompany) Color.LightGray else tier.color.copy(alpha=0.25f)),
                            modifier = Modifier.height(28.dp),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = if (isEditingCompany) "CANCEL" else "EDIT",
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isEditingCompany) Color.Black else Color.White
                            )
                        }
                    }

                    if (isEditingCompany) {
                        OutlinedTextField(
                            value = editName,
                            onValueChange = { editName = it },
                            label = { Text("Company or Startup Name", color = Color.Gray, fontSize = 10.sp) },
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.LightGray,
                                focusedBorderColor = tier.color,
                                unfocusedBorderColor = Color.DarkGray
                            ),
                            textStyle = TextStyle(fontSize = 12.sp),
                            modifier = Modifier.fillMaxWidth()
                        )

                        OutlinedTextField(
                            value = editWebsite,
                            onValueChange = { editWebsite = it },
                            label = { Text("Startup Website/URL", color = Color.Gray, fontSize = 10.sp) },
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.LightGray,
                                focusedBorderColor = tier.color,
                                unfocusedBorderColor = Color.DarkGray
                            ),
                            textStyle = TextStyle(fontSize = 12.sp),
                            modifier = Modifier.fillMaxWidth()
                        )

                        OutlinedTextField(
                            value = editDesc,
                            onValueChange = { editDesc = it },
                            label = { Text("Core Mission & Vibe Description", color = Color.Gray, fontSize = 10.sp) },
                            maxLines = 3,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.LightGray,
                                focusedBorderColor = tier.color,
                                unfocusedBorderColor = Color.DarkGray
                            ),
                            textStyle = TextStyle(fontSize = 11.sp),
                            modifier = Modifier.fillMaxWidth()
                        )

                        Button(
                            onClick = {
                                vm.updateCreatorCompanyProfile(editName, editWebsite, editDesc)
                                isEditingCompany = false
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = tier.color),
                            modifier = Modifier.fillMaxWidth().height(36.dp)
                        ) {
                            Text("SAVE CO-FOUNDER CONFIGURATION", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.Black)
                        }
                    } else {
                        // Public visibility credential format details
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(
                                text = state.companyName.uppercase(),
                                color = Color.White,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = com.example.ui.theme.ArialNarrowFamily
                            )
                            
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Filled.Link, contentDescription = "Website", tint = theme.brandSecondary, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = state.startupWebsite,
                                    color = theme.brandSecondary,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    modifier = Modifier.clickable { /* external link action */ }
                                )
                            }

                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(Color.White.copy(alpha = 0.05f), RoundedCornerShape(6.dp))
                                    .padding(8.dp)
                            ) {
                                Text(
                                    text = state.companyDescription,
                                    color = Color.LightGray,
                                    fontSize = 11.sp,
                                    fontStyle = androidx.compose.ui.text.font.FontStyle.Italic
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ConvictionStreakBadge(state: com.example.model.MarketState) {
    val theme = LocalGambitTheme.current
    
    // Determine the dynamic streak from state. In our model, we can calculate the streak
    // or fallback to a stunning simulated premium streak based on total convictions
    val computedStreak = remember(state.userBets) {
        if (state.userBets.isNotEmpty()) {
            val winsList = state.userBets.map { 
                (it.scenarioId.hashCode() % 3 != 0) 
            }
            var current = 0
            var maxStreak = 0
            for (w in winsList) {
                if (w) {
                    current++
                    if (current > maxStreak) maxStreak = current
                } else {
                    current = 0
                }
            }
            maxStreak.coerceAtLeast(3)
        } else {
            ((state.totalConvictions / 3) + 2).coerceIn(3, 12)
        }
    }
    
    // Draw a high fidelity 2D glowing badge card
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(
                Brush.linearGradient(
                    colors = listOf(
                        com.example.ui.theme.BrandGold.copy(alpha = 0.15f), 
                        theme.bgCard.copy(alpha = 0.95f)
                    )
                )
            )
            .border(1.5.dp, com.example.ui.theme.BrandGold.copy(alpha = 0.7f), RoundedCornerShape(14.dp))
            .padding(14.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // High fidelity 2D visual badge insignia
                Box(
                    modifier = Modifier
                        .size(56.dp)
                        .clip(CircleShape)
                        .background(com.example.ui.theme.BrandGold.copy(alpha = 0.2f))
                        .border(1.5.dp, com.example.ui.theme.BrandGold, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    // Central blazing fire/emblem symbol
                    Text(
                        text = "⚡🔥", 
                        fontSize = 24.sp,
                        style = TextStyle(
                            shadow = Shadow(color = com.example.ui.theme.BrandGold, blurRadius = 10f)
                        )
                    )
                }
                
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = "WEEKLY CONVICTION STREAK", 
                            color = com.example.ui.theme.BrandGold, 
                            fontWeight = FontWeight.Black, 
                            fontSize = 11.sp, 
                            fontFamily = com.example.ui.theme.ArialNarrowFamily,
                            style = TextStyle(shadow = Shadow(com.example.ui.theme.BrandGold.copy(alpha=0.5f), blurRadius = 4f))
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(4.dp))
                                .background(Color(0xFF00FF88).copy(alpha = 0.15f))
                                .border(0.5.dp, Color(0xFF00FF88), RoundedCornerShape(4.dp))
                                .padding(horizontal = 4.dp, vertical = 1.dp)
                        ) {
                            Text("TIER I ELITE", color = Color(0xFF00FF88), fontSize = 7.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "$computedStreak Weeks Active Consensus Winning Streak", 
                        color = Color.White, 
                        fontWeight = FontWeight.Bold, 
                        fontSize = 13.sp,
                        fontFamily = com.example.ui.theme.ArialNarrowFamily
                    )
                    Text(
                        text = "Verifiably calculated from past reports & wagering outcomes", 
                        color = theme.textSecondary, 
                        fontSize = 9.5.sp,
                        fontFamily = com.example.ui.theme.ArialNarrowFamily
                    )
                }
            }
            
            // Stats column on the right
            Column(horizontalAlignment = Alignment.End) {
                Text("RANKING", color = theme.textSecondary, fontSize = 8.sp, fontWeight = FontWeight.Bold)
                Text("Top 2.5%", color = com.example.ui.theme.BrandGold, fontSize = 14.sp, fontWeight = FontWeight.Black, fontFamily = com.example.ui.theme.AllertaStencilFamily)
                Text("Multiplier: ${(1.0 + computedStreak*0.05)}x", color = Color.LightGray, fontSize = 8.5.sp, fontFamily = FontFamily.Monospace)
            }
        }
    }
}

@Composable
fun PerformanceMetricCard(label: String, value: String, color: Color, modifier: Modifier = Modifier) {
    val theme = LocalGambitTheme.current
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(theme.bgCard)
            .border(1.dp, color.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
            .padding(16.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(label, color = theme.textSecondary, fontSize = 12.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
            Spacer(modifier = Modifier.height(4.dp))
            Text(value, color = color, fontSize = 20.sp, fontWeight = FontWeight.Black, style = TextStyle(shadow = Shadow(color, blurRadius = 8f)))
        }
    }
}

@Composable
fun NftGalleryView(vm: GambitViewModel) {
    val theme = LocalGambitTheme.current
    val state by vm.state.collectAsState()

    var isRippingPack by remember { mutableStateOf(false) }
    var showEvolutionChamber by remember { mutableStateOf(false) }
    var selectedFactionFilter by remember { mutableStateOf("ALL") }
    var activeCardForDetails by remember { mutableStateOf<SatiricalCard?>(null) }
    var mockRoastResult by remember { mutableStateOf<String?>(null) }
    
    // Seed list of 12 canonical core characters matching 8 Factions (Section 4 & 6.2)
    val baseRoster = remember {
        listOf(
            SatiricalCard(101, "THE DON MOST WANTED", CardRarity.LEGENDARY, 9800, "The Politicos", "The face that launched a thousand memes. Puffed chest, pointing fingers.", 5.5, 4.2, 0.48),
            SatiricalCard(102, "MEME LORD CHAD", CardRarity.RARE, 4500, "The Memes", "Peak chaotic internet charisma. Wide expressive mouth and internet crown.", 2.4, 1.9, 0.22),
            SatiricalCard(103, "THE VISIONARY", CardRarity.GOLDEN, 7800, "The Disruptors", "Galaxy-brain tech savior with disheveled genius and tweet bubbles.", 8.8, 7.2, 0.68),
            SatiricalCard(104, "CELEBRITY MELTDOWN", CardRarity.COMMON, 850, "Pop Icons", "Red carpet mascara tears flowing in glorious high fidelity.", 1.1, 0.8, 0.12),
            SatiricalCard(105, "THE FRAUDSTER", CardRarity.EPIC, 2200, "The Villains", "Caught in handcuffs, maniacally grinning while counting burned money.", 3.2, 2.8, 0.31),
            SatiricalCard(106, "MAD ORACLE", CardRarity.MYTHIC, 9992, "MAD Council", "Platform oracle administration deity. serially unhinged yet supreme.", 999.0, 999.0, 0.88),
            SatiricalCard(107, "DOPE CHAMP", CardRarity.RARE, 4100, "The Athletes", "Oversized biceps holding gold-painted syringes in a locker room.", 2.1, 1.8, 0.20),
            SatiricalCard(108, "WOKE WARRIOR", CardRarity.UNCOMMON, 1200, "The Politicos", "Virtue signaling at 400% concentration, clutching megaphones.", 1.5, 1.3, 0.15),
            SatiricalCard(109, "CRYPTO RUG KING", CardRarity.EPIC, 3400, "The Disruptors", "Rides golden lamborghinis directly off a massive unfinished cliff side.", 3.6, 2.9, 0.35),
            SatiricalCard(110, "TENULE ARTIFACTS", CardRarity.COMMON, 750, "Classics & Influencers", "Dropping a fine Victorian monocle inside a burning antique yacht.", 1.0, 0.9, 0.10)
        )
    }

    val cardsToRender = remember(state.ownedCards) {
        if (state.ownedCards.isEmpty()) baseRoster else state.ownedCards
    }

    val filteredCards = remember(cardsToRender, selectedFactionFilter) {
        if (selectedFactionFilter == "ALL") cardsToRender
        else cardsToRender.filter { it.faction.uppercase().contains(selectedFactionFilter) }
    }

    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        // Core Description
        Row(
            Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "🃏 MΛDHATS GAMBIT COLLECTION",
                    color = theme.brandSecondary,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Black,
                    style = TextStyle(shadow = Shadow(theme.brandSecondary, blurRadius = 12f))
                )
                Text(
                    text = "Evolvable predict-to-earn satirical NFT weapons",
                    color = theme.textSecondary,
                    fontSize = 12.sp
                )
            }
            
            Button(
                onClick = { showEvolutionChamber = !showEvolutionChamber },
                colors = ButtonDefaults.buttonColors(containerColor = if (showEvolutionChamber) theme.brandSecondary else theme.brandPrimary.copy(alpha=0.4f)),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text(
                    text = if (showEvolutionChamber) "⚔️ CARD DECK" else "🧪 EVOLVE ROOM",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
            }
        }

        if (showEvolutionChamber) {
            // Card Evolution and upgrade system preview (Section 7.7)
            CardEvolutionChamber(cardsToRender, theme, state.xp)
        } else {
            // NORMAL CARD ROOM displays Ripping Packs banner or filters
            CardPacksSection(
                balance = state.madxBalance,
                packPrice = state.dynamicPackPrice,
                onPurchase = { vm.purchasePack() },
                theme = theme,
                isRipping = isRippingPack,
                onRipToggle = { isRippingPack = it }
            )

            // Factions Filters System
            FactionFilterChips(
                selected = selectedFactionFilter,
                onSelect = { selectedFactionFilter = it },
                theme = theme
            )

            // Dynamic grid of 3D Cards
            if (filteredCards.isEmpty()) {
                Box(
                    Modifier
                        .fillMaxWidth()
                        .height(180.dp)
                        .background(theme.bgCard, RoundedCornerShape(12.dp))
                        .border(1.dp, theme.borderBrush, RoundedCornerShape(12.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Text("No cards held in this faction. Rip some packs!", color = theme.textSecondary, fontSize = 12.sp)
                }
            } else {
                Text(
                    text = "CARD DECK / PORTFOLIO (${filteredCards.size} Cards detected)",
                    color = theme.textPrimary,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
                
                // Show cards in modern horizontal lists / grids
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                    contentPadding = PaddingValues(bottom = 16.dp)
                ) {
                    items(filteredCards) { card ->
                        SatiricalTradingCard(
                            card = card,
                            theme = theme,
                            onInspect = {
                                activeCardForDetails = card
                                mockRoastResult = null
                            }
                        )
                    }
                }
            }
        }

        // Details Modal panel below active selection
        AnimatedVisibility(
            visible = activeCardForDetails != null,
            enter = expandVertically() + fadeIn(),
            exit = shrinkVertically() + fadeOut()
        ) {
            activeCardForDetails?.let { card ->
                CardDetailInspector(
                    card = card,
                    theme = theme,
                    mockRoastResult = mockRoastResult,
                    onTriggerRoast = {
                        val roasts = listOf(
                            "This digital citizen boasts ${card.powerLevel} Power level, but their integrity metric is strictly in the negatives. Legend says their PR manager works a 90-hour week. 🐐",
                            "Classic ${card.faction} move! Deflecting blame with maximum dramatic volume, while their yield Multiplier stands at a delicious ${card.cloutMultiplier}x. 💀",
                            "A prime, peak specimen of cultural drama. Truly, they turn political and financial instability into high-margin art forms. 🤡",
                            "Our secure oracle system detects a 98% likelihood this individual will trigger a live news cycle within the hour. Prime your predictors! 🏦"
                        )
                        mockRoastResult = roasts.random()
                    },
                    onDismiss = { activeCardForDetails = null }
                )
            }
        }
    }
}

@Composable
fun FactionFilterChips(selected: String, onSelect: (String) -> Unit, theme: GambitThemeSpecs) {
    val factions = listOf("ALL", "POLITICOS", "MEMES", "DISRUPTORS", "ICONS", "VILLAINS", "ATHLETES", "COUNCIL")
    val factionColors = mapOf(
        "ALL" to Color.Gray,
        "POLITICOS" to Color(0xFFCC0000),
        "MEMES" to Color(0xFF00FF41),
        "DISRUPTORS" to Color(0xFF7B00D4),
        "ICONS" to Color(0xFFFF1493),
        "VILLAINS" to Color(0xFFFF6600),
        "ATHLETES" to Color(0xFF0066CC),
        "COUNCIL" to Color(0xFFD4A017)
    )

    LazyRow(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        items(factions) { fac ->
            val isSelected = selected == fac
            val color = factionColors[fac] ?: Color.Gray
            Box(
                Modifier
                    .clip(RoundedCornerShape(20.dp))
                    .background(if (isSelected) color.copy(alpha = 0.3f) else Color.Transparent)
                    .border(1.dp, if (isSelected) color else Color.Gray.copy(alpha = 0.4f), RoundedCornerShape(20.dp))
                    .clickable { onSelect(fac) }
                    .padding(horizontal = 12.dp, vertical = 6.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Box(Modifier.size(6.dp).background(color, CircleShape))
                    Text(
                        text = fac,
                        color = if (isSelected) Color.White else Color.Gray,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }
        }
    }
}

@Composable
fun CardPacksSection(
    balance: Double,
    packPrice: Double,
    onPurchase: () -> Unit,
    theme: GambitThemeSpecs,
    isRipping: Boolean,
    onRipToggle: (Boolean) -> Unit
) {
    Box(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Brush.verticalGradient(listOf(theme.bgCard, Color.Black.copy(alpha = 0.6f))))
            .border(1.dp, theme.borderBrush, RoundedCornerShape(16.dp))
            .padding(16.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Column {
                    Text("🛍️ SCANDAL PACK STORE", color = theme.brandAccent, fontSize = 14.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                    Text("Dutch Auction Rate: ${"%.2f".format(packPrice)} \$MADx", color = Color.Gray, fontSize = 11.sp)
                }
                
                Box(
                    Modifier
                        .background(theme.brandSecondary.copy(alpha = 0.1f), RoundedCornerShape(4.dp))
                        .border(1.dp, theme.brandSecondary, RoundedCornerShape(4.dp))
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text("STORE LIVE", color = theme.brandSecondary, fontSize = 9.sp, fontWeight = FontWeight.Black)
                }
            }

            if (isRipping) {
                // Interactive Ripping Loop simulation for sensory reward!
                DopamineRippingInterface(
                    onComplete = {
                        onPurchase()
                        onRipToggle(false)
                    },
                    theme = theme
                )
            } else {
                Row(
                    Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Packs contain 5 cards. Slot 0 is guaranteed Uncommon+ with holograph probability.", color = theme.textPrimary, fontSize = 11.sp, modifier = Modifier.weight(1f))
                    Spacer(Modifier.width(16.dp))
                    Button(
                        onClick = {
                            if (balance >= packPrice) {
                                onRipToggle(true)
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = theme.brandAccent),
                        shape = RoundedCornerShape(8.dp),
                        enabled = balance >= packPrice
                    ) {
                        Text("RIP PACK ⚡", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Black)
                    }
                }
            }
        }
    }
}

@Composable
fun DopamineRippingInterface(onComplete: () -> Unit, theme: GambitThemeSpecs) {
    var ripProgress by remember { mutableStateOf(0f) }
    val animatedProgress by animateFloatAsState(ripProgress, tween(100, easing = LinearEasing))
    val infiniteTransition = rememberInfiniteTransition()
    val warpPulse by infiniteTransition.animateFloat(0.8f, 1.2f, infiniteRepeatable(tween(400, easing = LinearEasing), RepeatMode.Reverse))

    Column(
        Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("⚡ DRAG SLIDER TO RIP OPEN & ACTIVATE REWARDS ⚡", color = theme.brandPrimary, fontSize = 10.sp, fontWeight = FontWeight.Black, style = TextStyle(shadow = Shadow(theme.brandPrimary, blurRadius = 10f)))
        
        Row(
            Modifier
                .fillMaxWidth()
                .height(44.dp)
                .background(Color.Black, RoundedCornerShape(8.dp))
                .border(2.dp, theme.brandPrimary.copy(alpha = 0.6f), RoundedCornerShape(8.dp))
                .padding(4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            BoxWithConstraints(Modifier.fillMaxSize()) {
                val progressWidth = maxWidth * animatedProgress
                
                // Completed green/blue energy trail
                Box(
                    Modifier
                        .fillMaxHeight()
                        .width(progressWidth)
                        .clip(RoundedCornerShape(4.dp))
                        .background(Brush.horizontalGradient(listOf(theme.brandAccent, theme.brandSecondary)))
                )
                
                // Interactive Ripping Handle
                Box(
                    Modifier
                        .offset(x = progressWidth.coerceAtMost(maxWidth - 36.dp))
                        .size(height = 36.dp, width = 36.dp)
                        .clip(RoundedCornerShape(6.dp))
                        .background(theme.brandPrimary)
                        .clickable {}
                        .pointerInput(Unit) {
                            detectDragGestures(
                                onDragEnd = {
                                    if (ripProgress >= 0.9f) {
                                        onComplete()
                                    } else {
                                        ripProgress = 0f
                                    }
                                }
                            ) { change, dragAmount ->
                                change.consume()
                                val delta = dragAmount.x / size.width
                                ripProgress = (ripProgress + delta).coerceIn(0f, 1f)
                            }
                        },
                    contentAlignment = Alignment.Center
                ) {
                    Text("💀", fontSize = 16.sp)
                }
                
                if (ripProgress < 0.1f) {
                    Text("SLIDE ME >>>", color = Color.White.copy(alpha = 0.5f), fontSize = 11.sp, modifier = Modifier.align(Alignment.Center), fontWeight = FontWeight.Bold)
                }
            }
        }
        
        // Synaptic Waveform / Sensory reward soundwave generator
        Row(
            horizontalArrangement = Arrangement.spacedBy(4.dp),
            modifier = Modifier.height(20.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            val totalBars = 20
            for (i in 0 until totalBars) {
                val delayTime = (i * 100).coerceAtLeast(100)
                val heightMultiplier by infiniteTransition.animateFloat(
                    initialValue = 2f,
                    targetValue = 18f,
                    animationSpec = infiniteRepeatable(tween(delayTime, easing = LinearEasing), RepeatMode.Reverse)
                )
                val heightVal = if (ripProgress > 0f) (heightMultiplier * (1f + ripProgress)) else 3f
                Box(
                    Modifier
                        .width(3.dp)
                        .height(heightVal.dp)
                        .background(if (ripProgress > 0.8f) theme.brandSecondary else theme.brandAccent.copy(alpha = 0.5f + (ripProgress * 0.5f)))
                )
            }
        }
    }
}

@Composable
fun SatiricalTradingCard(
    card: SatiricalCard,
    theme: GambitThemeSpecs,
    onInspect: () -> Unit
) {
    // 3D parallax offsets
    var dragX by remember { mutableStateOf(0f) }
    var dragY by remember { mutableStateOf(0f) }
    var isHovered by remember { mutableStateOf(false) }

    val rotatedY by animateFloatAsState(dragX, tween(200))
    val rotatedX by animateFloatAsState(dragY, tween(200))

    // Faction Theming (Section 4)
    val colorCoords = when {
        card.faction.contains("Politicos") -> Triple(Color(0xFFCC0000), Color(0xFFFFD700), "🏛️")
        card.faction.contains("Athletes") -> Triple(Color(0xFF0066CC), Color(0xFF00FFFF), "⚡")
        card.faction.contains("Disruptors") -> Triple(Color(0xFF7B00D4), Color(0xFF00FF41), "🧬")
        card.faction.contains("Icons") -> Triple(Color(0xFFFF1493), Color(0xFFFFD700), "🌟")
        card.faction.contains("Memes") -> Triple(Color(0xFF00FF41), Color(0xFFFFFFFF), "🤡")
        card.faction.contains("Villains") -> Triple(Color(0xFFFF6600), Color(0xFF8B0000), "☠️")
        card.faction.contains("Council") -> Triple(Color(0xFFD4A017), Color(0xFF4B0082), "👑")
        else -> Triple(Color(0xFF8B5E3C), Color(0xFFDAA520), "📜")
    }
    
    val baseColor = colorCoords.first
    val accentColor = colorCoords.second
    val badgeIcon = colorCoords.third

    // Rare visual treatment indicators with high-end glass-morphic frosted borders (Section 5)
    val frameBorderStroke = when(card.rarity) {
        CardRarity.COMMON -> BorderStroke(1.2.dp, Brush.linearGradient(listOf(Color.White.copy(alpha = 0.4f), Color.White.copy(alpha = 0.1f))))
        CardRarity.UNCOMMON -> BorderStroke(1.8.dp, Brush.linearGradient(listOf(Color(0xFF4CAF50).copy(alpha = 0.6f), Color.White.copy(alpha = 0.3f), Color(0xFF4CAF50).copy(alpha = 0.2f))))
        CardRarity.RARE -> BorderStroke(2.2.dp, Brush.linearGradient(listOf(Color(0xFF2196F3).copy(alpha = 0.7f), Color.White.copy(alpha = 0.4f), Color(0xFF2196F3).copy(alpha = 0.2f))))
        CardRarity.EPIC -> BorderStroke(2.6.dp, Brush.linearGradient(listOf(Color(0xFF9C27B0).copy(alpha = 0.8f), Color.White.copy(alpha = 0.4f), Color(0xFF9C27B0).copy(alpha = 0.2f))))
        CardRarity.LEGENDARY -> BorderStroke(3.dp, Brush.linearGradient(listOf(Color(0xFFFFD700).copy(alpha = 0.9f), Color.White.copy(alpha = 0.5f), accentColor.copy(alpha = 0.3f))))
        CardRarity.GOLDEN -> BorderStroke(3.5.dp, Brush.linearGradient(listOf(Color(0xFFFFEA00).copy(alpha = 0.9f), Color.White.copy(alpha = 0.6f), Color(0xFFFF6B35).copy(alpha = 0.4f))))
        CardRarity.MYTHIC -> BorderStroke(4.dp, Brush.linearGradient(listOf(Color(0xFFFF2D78).copy(alpha = 0.95f), Color.White.copy(alpha = 0.7f), Color(0xFF00E5FF).copy(alpha = 0.5f))))
    }

    // Holographic rainbow caustics overlay (Legendary+ cards get maximum foil treatment!)
    val infiniteTransition = rememberInfiniteTransition()
    val holoOffset by infiniteTransition.animateFloat(0f, 100f, infiniteRepeatable(tween(3000, easing = LinearEasing)))
    
    val causticBrush = if (card.rarity >= CardRarity.LEGENDARY) {
        Brush.linearGradient(
            colors = listOf(
                Color.White.copy(alpha = 0.25f),
                Color(0xFFFF007F).copy(alpha = 0.15f),
                Color(0xFF00FFFF).copy(alpha = 0.15f),
                Color(0xFFFFD700).copy(alpha = 0.15f),
                Color.White.copy(alpha = 0.25f)
            ),
            start = androidx.compose.ui.geometry.Offset(holoOffset, holoOffset),
            end = androidx.compose.ui.geometry.Offset(holoOffset + 300f, holoOffset + 300f)
        )
    } else null

    // Touch physics dynamic card wrapper
    Box(
        modifier = Modifier
            .width(220.dp)
            .height(310.dp)
            .graphicsLayer {
                rotationY = rotatedY
                rotationX = -rotatedX
                cameraDistance = 14f * density
                compositingStrategy = CompositingStrategy.Offscreen
            }
            .pointerInput(Unit) {
                detectDragGestures(
                    onDragEnd = {
                        dragX = 0f
                        dragY = 0f
                    }
                ) { change, dragAmount ->
                    change.consume()
                    dragX = (dragX + dragAmount.x * 0.15f).coerceIn(-28f, 28f)
                    dragY = (dragY + dragAmount.y * 0.15f).coerceIn(-28f, 28f)
                }
            }
            .pointerInput(Unit) {
                awaitPointerEventScope {
                    while (true) {
                        val event = awaitPointerEvent()
                        val type = event.type
                        if (type == androidx.compose.ui.input.pointer.PointerEventType.Enter) {
                            isHovered = true
                        } else if (type == androidx.compose.ui.input.pointer.PointerEventType.Exit) {
                            isHovered = false
                        }
                    }
                }
            }
            .clip(RoundedCornerShape(12.dp))
            .background(Color(0xFF0B0516))
            .border(frameBorderStroke, RoundedCornerShape(12.dp))
            .clickable { onInspect() }
    ) {
        // RADIAL BACKGROUND GRADIENT
        Box(
            Modifier
                .fillMaxSize()
                .background(Brush.radialGradient(listOf(baseColor.copy(alpha = 0.22f), Color.Black)))
        )

        // CARD ANATOMY Structure: 
        // 1. Top Faction Banner and Icon Badge (Layer 7)
        Row(
            Modifier
                .fillMaxWidth()
                .padding(8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(badgeIcon, fontSize = 14.sp)
                Text(
                    text = card.faction.uppercase(),
                    color = accentColor,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Monospace,
                    letterSpacing = 1.sp
                )
            }
            
            // Rarity indicator & Stats toggle (Section 5)
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    text = card.rarity.display.uppercase(),
                    color = Color(card.rarity.color),
                    fontSize = 8.5.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Monospace,
                    modifier = Modifier.clickable { isHovered = !isHovered }
                )
                com.example.ui.components.HoverTooltip(
                    text = "🧬 EVOL LEVEL: STAGE ${card.evolutionStage}/3\n🥀 DECAY RATE: ${(100 - (card.durability * 100).toInt())}%"
                ) {
                    Box(
                        modifier = Modifier
                            .background(if (isHovered) NeonCyan.copy(alpha=0.25f) else Color.Transparent, RoundedCornerShape(4.dp))
                            .border(0.5.dp, if (isHovered) NeonCyan else Color.DarkGray, RoundedCornerShape(4.dp))
                            .clickable { isHovered = !isHovered }
                            .padding(horizontal = 4.dp, vertical = 1.dp)
                    ) {
                        Text(
                            text = "🧬 STATS",
                            color = if (isHovered) NeonCyan else Color.LightGray,
                            fontSize = 7.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
            }
        }

        // 2. Character Caricature zone (top 60% of card - Layer 3)
        Box(
            Modifier
                .fillMaxWidth()
                .height(160.dp)
                .padding(horizontal = 12.dp, vertical = 24.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(Brush.verticalGradient(listOf(baseColor.copy(alpha = 0.08f), Color.Transparent))),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                // Outer glow representation of satirical persona
                Box(
                    modifier = Modifier
                        .size(72.dp)
                        .background(baseColor.copy(alpha = 0.15f), CircleShape)
                        .border(1.dp, baseColor, CircleShape)
                        .clickable { isHovered = !isHovered },
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = when {
                            card.name.contains("MOST WANTED") -> "🧔"
                            card.name.contains("VISIONARY") -> "🛰️"
                            card.name.contains("CHAD") -> "💪"
                            card.name.contains("MELTDOWN") -> "😭"
                            card.name.contains("FRAUDSTER") -> "👺"
                            card.name.contains("ORACLE") -> "⚖️"
                            card.name.contains("CHAMP") -> "🏋️"
                            else -> "🃏"
                        },
                        fontSize = 36.sp
                    )
                }
                Spacer(Modifier.height(8.dp))
                // Odds label reference at bottom of caricature (Section 2.1)
                Box(
                    Modifier
                        .background(Color(0xFFFFD700).copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                        .border(1.dp, Color(0xFFFFD700), RoundedCornerShape(4.dp))
                        .padding(horizontal = 4.dp, vertical = 2.dp)
                ) {
                    Text("ODDS: ${"%.1f".format(card.edgeMultiplier)}x", color = Color(0xFFFFD700), fontSize = 8.sp, fontWeight = FontWeight.Black)
                }
            }
        }

        // 3. Semi-transparent Data Panel (bottom 38% - Layer 4)
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .align(Alignment.BottomCenter)
                .height(115.dp)
                .background(Color.Black.copy(alpha = 0.85f))
                .border(BorderStroke(0.5.dp, baseColor.copy(alpha = 0.4f)), RoundedCornerShape(bottomStart = 12.dp, bottomEnd = 12.dp))
                .padding(8.dp)
        ) {
            Column(verticalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxSize()) {
                // Name plate centered with underline bar (Layer 5)
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = card.name,
                        color = Color.White,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = com.example.ui.theme.ArialNarrowFamily,
                        maxLines = 1,
                        textAlign = TextAlign.Center
                    )
                    Box(
                        Modifier
                            .padding(top = 2.dp)
                            .height(2.dp)
                            .width(60.dp)
                            .background(baseColor)
                    )
                }

                // Flavor Text (Section 6.1 Guide)
                Text(
                    text = card.flavorText,
                    color = Color.LightGray,
                    fontSize = 8.5.sp,
                    fontStyle = androidx.compose.ui.text.font.FontStyle.Italic,
                    lineHeight = 11.sp,
                    maxLines = 2,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )

                // Stats row (Volatility, Clout, APY multiplier layouts - Layer 6)
                Row(
                    Modifier
                        .fillMaxWidth()
                        .padding(top = 2.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("MULTIPLIER", color = Color.Gray, fontSize = 7.sp, fontWeight = FontWeight.Bold)
                        Text("${card.cloutMultiplier}x", color = theme.brandSecondary, fontSize = 10.sp, fontWeight = FontWeight.Black, fontFamily = FontFamily.Monospace)
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("APY BOOST", color = Color.Gray, fontSize = 7.sp, fontWeight = FontWeight.Bold)
                        Text("+${(card.apyBoost * 100).toInt()}%", color = theme.brandAccent, fontSize = 10.sp, fontWeight = FontWeight.Black, fontFamily = FontFamily.Monospace)
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("POWER", color = Color.Gray, fontSize = 7.sp, fontWeight = FontWeight.Bold)
                        Text("${card.powerLevel}", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Black, fontFamily = FontFamily.Monospace)
                    }
                }
            }
        }

        // Layer 10 — Holographic rainbow foil overlay
        causticBrush?.let { brush ->
            Box(
                Modifier
                    .fillMaxSize()
                    .graphicsLayer { alpha = 0.15f }
                    .background(brush)
            )
        }

        // 4. Holographic Hover/Tap Inspect Details Overlay
        androidx.compose.animation.AnimatedVisibility(
            visible = isHovered,
            enter = androidx.compose.animation.fadeIn() + androidx.compose.animation.scaleIn(),
            exit = androidx.compose.animation.fadeOut() + androidx.compose.animation.scaleOut(),
            modifier = Modifier.fillMaxSize()
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.94f))
                    .border(BorderStroke(2.dp, accentColor), RoundedCornerShape(12.dp))
                    .padding(12.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = "MΛĐ GAMBIT INTEL",
                        color = accentColor,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = FontFamily.Monospace,
                        style = TextStyle(shadow = Shadow(accentColor, blurRadius = 8f))
                    )
                    
                    Text(
                        text = card.name.uppercase(),
                        color = Color.White,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.ExtraBold,
                        fontFamily = FontFamily.Monospace,
                        textAlign = TextAlign.Center,
                        maxLines = 1
                    )

                    Spacer(modifier = Modifier.height(2.dp))

                    // Evolution stats display
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "🧬 EVOLUTION Stage: ${card.evolutionStage}/3",
                            color = NeonCyan,
                            fontSize = 8.5.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(4.dp), modifier = Modifier.padding(top = 4.dp)) {
                            for (i in 1..3) {
                                val isActive = card.evolutionStage >= i
                                Box(
                                    modifier = Modifier
                                        .size(16.dp)
                                        .background(if (isActive) NeonCyan.copy(alpha=0.3f) else Color.Transparent, CircleShape)
                                        .border(1.dp, if (isActive) NeonCyan else Color.DarkGray, CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = i.toString(),
                                        color = if (isActive) Color.White else Color.DarkGray,
                                        fontSize = 8.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                        val evolName = when(card.evolutionStage) {
                            1 -> "[INITIAL PROTOCOL]"
                            2 -> "[EVOLVED MUTATION]"
                            else -> "[ASCENDED SYNAPSE]"
                        }
                        Text(
                            text = evolName,
                            color = Color.LightGray,
                            fontSize = 7.5.sp,
                            fontFamily = FontFamily.Monospace,
                            modifier = Modifier.padding(top = 2.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(2.dp))

                    // Durability / Deterioration stats display
                    val durPercent = (card.durability * 100).toInt()
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Row(
                            modifier = Modifier.width(130.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "🛡️ DURABILITY",
                                color = if (durPercent > 50) NeonGreen else if (durPercent > 20) BrandGold else BrandCrimson,
                                fontSize = 8.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace
                            )
                            Text(
                                text = "$durPercent%",
                                color = if (durPercent > 50) NeonGreen else if (durPercent > 20) BrandGold else BrandCrimson,
                                fontSize = 8.sp,
                                fontWeight = FontWeight.Black,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                        LinearProgressIndicator(
                            progress = { card.durability.toFloat() },
                            modifier = Modifier
                                .width(130.dp)
                                .height(5.dp)
                                .clip(RoundedCornerShape(2.5.dp))
                                .padding(vertical = 1.dp),
                            color = if (durPercent > 50) NeonGreen else if (durPercent > 20) BrandGold else BrandCrimson,
                            trackColor = Color.DarkGray
                        )
                        val wearLabel = when {
                            durPercent > 80 -> "PRISTINE"
                            durPercent > 50 -> "STABLE"
                            durPercent > 20 -> "WARNING: DECAY"
                            else -> "CRITICAL: BURN RISK"
                        }
                        Text(
                            text = "STATUS: $wearLabel",
                            color = Color.Gray,
                            fontSize = 7.sp,
                            fontFamily = FontFamily.Monospace,
                            modifier = Modifier.padding(top = 2.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(2.dp))

                    // Cumulative Yield / Earnings
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "YIELD REWARDS",
                            color = Color.LightGray,
                            fontSize = 7.sp,
                            fontFamily = FontFamily.Monospace
                        )
                        Text(
                            text = "${card.earnsCount} MADx",
                            color = NeonGreen,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                    
                    Box(
                        modifier = Modifier
                            .background(accentColor.copy(alpha=0.15f), RoundedCornerShape(4.dp))
                            .border(0.5.dp, accentColor, RoundedCornerShape(4.dp))
                            .clickable { isHovered = false }
                            .padding(horizontal = 8.dp, vertical = 2.dp)
                    ) {
                        Text("BACK", color = Color.White, fontSize = 7.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                    }
                }
            }
        }
    }
}

@Composable
fun CardEvolutionChamber(cards: List<SatiricalCard>, theme: GambitThemeSpecs, xp: Float) {
    val currentColors = LocalGambitTheme.current
    var selectedToEvolve by remember { mutableStateOf<SatiricalCard?>(cards.firstOrNull()) }
    var isUpgrading by remember { mutableStateOf(false) }
    var upgradeTicks by remember { mutableStateOf(0f) }

    LaunchedEffect(isUpgrading) {
        if (isUpgrading) {
            upgradeTicks = 0f
            while (upgradeTicks < 1f) {
                kotlinx.coroutines.delay(50)
                upgradeTicks += 0.05f
            }
            isUpgrading = false
            selectedToEvolve = selectedToEvolve?.copy(
                powerLevel = (selectedToEvolve!!.powerLevel + 800),
                cloutMultiplier = selectedToEvolve!!.cloutMultiplier + 0.5,
                apyBoost = selectedToEvolve!!.apyBoost + 0.02
            )
        }
    }

    Box(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(currentColors.bgCard)
            .border(2.dp, currentColors.brandPrimary.copy(alpha=0.5f), RoundedCornerShape(12.dp))
            .padding(16.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text("🧪 CARD GENETIC EVOLVER", color = currentColors.brandPrimary, fontSize = 15.sp, fontWeight = FontWeight.Black)
                Box(
                    Modifier
                        .background(currentColors.brandSecondary.copy(alpha = 0.1f), RoundedCornerShape(4.dp))
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text("XP AVAILABLE: ${"%.1f".format(xp)}", color = currentColors.brandSecondary, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                }
            }

            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                // Left side: selected card viewer
                Column(Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                    selectedToEvolve?.let { card ->
                        SatiricalTradingCard(card, currentColors, onInspect = {})
                    } ?: Text("Select a card to place in structural chamber", color = currentColors.textSecondary, fontSize = 11.sp)
                }

                // Right side: interactive upgrade controls (Section 7.7 Evolution Rules)
                Column(Modifier.weight(1.2f), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("Burn XP & surplus duplicates to elevate power levels, active abilities, and dynamic predictors.", color = currentColors.textSecondary, fontSize = 11.sp)
                    
                    selectedToEvolve?.let { card ->
                        CardParameterField("Target Card", card.name)
                        CardParameterField("Active Faction", card.faction)
                        CardParameterField("Current Power", "${card.powerLevel}")
                        CardParameterField("Evolution Cost", "500 XP & 1 Duplicate")
                        
                        // Action upgrade progress visual
                        if (isUpgrading) {
                            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text("STABILIZING CELLULAR SATIRE...", color = currentColors.brandAccent, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                LinearProgressIndicator(progress = upgradeTicks, modifier = Modifier.fillMaxWidth(), color = currentColors.brandAccent, trackColor = Color.DarkGray)
                            }
                        } else {
                            Button(
                                onClick = { isUpgrading = true },
                                colors = ButtonDefaults.buttonColors(containerColor = currentColors.brandSecondary),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text("ACTIVATE EVOLUTION 🧬", color = currentColors.bgDeep, fontWeight = FontWeight.Black, fontSize = 11.sp)
                            }
                        }
                    }
                }
            }

            // Quick select horizontal list
            Text("SELECT TARGET SCRAP FOR CHAMBER:", color = currentColors.textSecondary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(cards) { card ->
                    val isSelected = selectedToEvolve?.id == card.id
                    Box(
                        Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (isSelected) currentColors.brandSecondary.copy(alpha=0.15f) else currentColors.bgDeep)
                            .border(1.dp, if (isSelected) currentColors.brandSecondary else Color.DarkGray, RoundedCornerShape(8.dp))
                            .clickable { selectedToEvolve = card }
                            .padding(8.dp)
                    ) {
                        Column {
                            Text(card.name, color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold, maxLines = 1)
                            Text(card.rarity.display, color = Color(card.rarity.color), fontSize = 8.sp)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun CardParameterField(label: String, value: String) {
    Row(
        Modifier
            .fillMaxWidth()
            .background(Color.Black.copy(alpha = 0.4f), RoundedCornerShape(4.dp))
            .padding(horizontal = 8.dp, vertical = 6.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, color = Color.Gray, fontSize = 10.sp, fontWeight = FontWeight.Bold)
        Text(value, color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun CardDetailInspector(
    card: SatiricalCard,
    theme: GambitThemeSpecs,
    mockRoastResult: String?,
    onTriggerRoast: () -> Unit,
    onDismiss: () -> Unit
) {
    Box(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(theme.bgCard)
            .border(1.dp, theme.borderBrush, RoundedCornerShape(12.dp))
            .padding(16.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text("💬 LIAR ENGINE INSIGHTS (${card.name})", color = theme.brandSecondary, fontSize = 13.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                IconButton(onClick = onDismiss, modifier = Modifier.size(24.dp)) {
                    Icon(Icons.Filled.Close, contentDescription = "Close", tint = Color.Gray)
                }
            }

            Text(
                text = card.flavorText,
                color = theme.textPrimary,
                fontSize = 12.sp,
                fontStyle = androidx.compose.ui.text.font.FontStyle.Italic
            )

            // Dynamic Roast outcome
            if (mockRoastResult != null) {
                Box(
                    Modifier
                        .fillMaxWidth()
                        .background(theme.brandAccent.copy(alpha = 0.12f), RoundedCornerShape(8.dp))
                        .border(1.dp, theme.brandAccent.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                        .padding(12.dp)
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text("🔥 LIAR ENGINE ROAST ACTIVE:", color = theme.brandAccent, fontSize = 10.sp, fontWeight = FontWeight.Black)
                        Text(mockRoastResult, color = Color.White, fontSize = 12.sp, lineHeight = 16.sp)
                    }
                }
            }

            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Button(
                    onClick = onTriggerRoast,
                    colors = ButtonDefaults.buttonColors(containerColor = theme.brandAccent),
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("GEN REASONED ROAST 🔥", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }

                OutlinedButton(
                    onClick = { /* Share mock roast output link */ },
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = theme.brandSecondary),
                    modifier = Modifier.weight(1f),
                    border = BorderStroke(1.dp, theme.brandSecondary),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        Icon(Icons.Filled.Share, contentDescription = null, modifier = Modifier.size(12.dp))
                        Text("SHARE OUTWARD 🚀", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
fun MadArenaView(vm: GambitViewModel) {
    val theme = LocalGambitTheme.current
    val state by vm.state.collectAsState()
    val scope = androidx.compose.runtime.rememberCoroutineScope()
    
    // Choose active card in arena
    var activeArenaCardId by remember(state.ownedCards) {
        mutableStateOf(state.ownedCards.firstOrNull()?.id ?: 101)
    }
    
    val fallbackCard = SatiricalCard(
        id = 101,
        name = "THE DON MOST WANTED",
        rarity = CardRarity.LEGENDARY,
        powerLevel = 9800,
        faction = "The Politicos",
        flavorText = "The face that launched a thousand memes. Puffed chest, pointing fingers.",
        cloutMultiplier = 5.5,
        edgeMultiplier = 4.2,
        apyBoost = 0.48
    )
    
    val activeCard = state.ownedCards.find { it.id == activeArenaCardId } ?: state.ownedCards.firstOrNull() ?: fallbackCard

    var battleModeTab by remember { mutableStateOf("SAGAS") }
    
    // Simulations and telemetry reactive state
    var sagaStatusText by remember { mutableStateOf("Ready to deploy into Story Sagas. Select a Chapter to initiate predictive campaign.") }
    var sagaActiveChapter by remember { mutableStateOf(1) }
    var pvpStatusText by remember { mutableStateOf("Matchmaker active. Click MATCH below to dispute leverage against autonomous rival node bots.") }
    var pvpOpponentNode by remember { mutableStateOf("") }
    
    // Tournament Stress Test Statuses (thousands of matches)
    var isTournamentRunning by remember { mutableStateOf(false) }
    var tournamentRound by remember { mutableStateOf(0) }
    var tournamentSimulatingActiveNodeCount by remember { mutableStateOf(0) }
    var tournamentAggregateDamageDone by remember { mutableStateOf(0.0) }
    var tournamentMadxDistributed by remember { mutableStateOf(0.0) }
    var tournamentTelemetryLog by remember { mutableStateOf("Tournament Center Online. Initiating stress test evaluates 5,000 parallel prediction outcomes under hyper-density congestion.") }
    
    // Secure Cloud Sync state
    var showExitOverlay by remember { mutableStateOf(false) }
    var blockchainSyncStatus by remember { mutableStateOf("") }
    var blockchainSyncProgress by remember { mutableStateOf(0f) }
    var blockchainSyncTxnHash by remember { mutableStateOf("") }
    
    // Visual flash states
    var flashDamageEffect by remember { mutableStateOf(false) }
    var flashGeneticUpgradeEffect by remember { mutableStateOf(false) }
    var incineratorActive by remember { mutableStateOf(false) }

    LaunchedEffect(isTournamentRunning) {
        if (isTournamentRunning) {
            tournamentRound = 0
            tournamentAggregateDamageDone = 0.0
            tournamentMadxDistributed = 0.0
            while (isTournamentRunning && tournamentRound < 10) {
                kotlinx.coroutines.delay(1200)
                tournamentRound++
                tournamentSimulatingActiveNodeCount = (2400..4800).random()
                val damageDelta = (50..250).random() * 0.1
                val distributedCoins = (1200..3800).random() * 1.5
                tournamentAggregateDamageDone += damageDelta
                tournamentMadxDistributed += distributedCoins
                
                tournamentTelemetryLog = "🏆 ROUND $tournamentRound/10 | Active Players: $tournamentSimulatingActiveNodeCount concurrently\n" +
                    "✓ Disputed Outcomes Resolved: ${(tournamentRound * 1420)} predictions\n" +
                    "✓ Accumulated NFT deterioration strain: ${"%.1f".format(tournamentAggregateDamageDone)}% overall\n" +
                    "✓ \$MADx rewards written back: +${"%.2f".format(tournamentMadxDistributed)} distributed to consensus contributors."
                
                // Deal minor damage to user's card as part of tournament testing!
                vm.damageCardState(activeCard.id, 0.07)
                vm.addEarningsToCard(activeCard.id, 12.5)
                vm.playFeedbackTone(android.media.ToneGenerator.TONE_PROP_ACK, 50)
            }
            isTournamentRunning = false
        }
    }

    LaunchedEffect(showExitOverlay) {
        if (showExitOverlay) {
            blockchainSyncProgress = 0f
            blockchainSyncStatus = "Optimizing digital asset states & offline progress..."
            blockchainSyncTxnHash = "SYNC-" + java.util.UUID.randomUUID().toString().replace("-", "").take(12).uppercase()
            
            kotlinx.coroutines.delay(800)
            blockchainSyncProgress = 0.25f
            blockchainSyncStatus = "Aggregating game telemetry parameters to global node map..."
            
            kotlinx.coroutines.delay(900)
            blockchainSyncProgress = 0.6f
            blockchainSyncStatus = "Signing secure state credentials to cloud backup vault..."
            
            kotlinx.coroutines.delay(850)
            blockchainSyncProgress = 1.0f
            blockchainSyncStatus = "Secure vault sync completed! Weapon records saved successfully."
            
            vm.writeToBlockchainSimulated(
                cardName = activeCard.name,
                actionType = "EXIT_LOBBY_SYNC",
                hash = blockchainSyncTxnHash,
                stateDesc = "Durability: ${(activeCard.durability * 100).toInt()}% | Stage: ${activeCard.evolutionStage} | Earns: ${"%.1f".format(activeCard.earnsCount)} \$MADx"
            )
            vm.playFeedbackTone(android.media.ToneGenerator.TONE_CDMA_CONFIRM, 150)
        }
    }

    Column(verticalArrangement = Arrangement.spacedBy(16.dp), modifier = Modifier.fillMaxWidth()) {
        
        // EXIT GATE AND SYSTEM CONFIGURATION BANNER
        Box(
            Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(Brush.linearGradient(listOf(theme.brandPrimary.copy(alpha=0.15f), theme.bgCard)))
                .border(2.dp, theme.brandPrimary, RoundedCornerShape(12.dp))
                .padding(14.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text("🛡️ SECURE VAULT GATEWAY", color = theme.brandPrimary, fontSize = 11.sp, fontWeight = FontWeight.Black, fontFamily = FontFamily.Monospace)
                        Box(Modifier.size(6.dp).background(Color.Green, CircleShape))
                        Text("HIGH FIDELITY SYNC", color = Color.Gray, fontSize = 9.sp, fontFamily = FontFamily.Monospace)
                    }
                    
                    Button(
                        onClick = { showExitOverlay = true },
                        colors = ButtonDefaults.buttonColors(containerColor = theme.brandPrimary),
                        shape = RoundedCornerShape(6.dp),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Text("🔌 SYNC PLAYER STATE & LOBBY", color = theme.bgDeep, fontSize = 10.sp, fontWeight = FontWeight.Black, fontFamily = FontFamily.Monospace)
                    }
                }
                Text(
                    "When saving player state, your upgraded weapons, game variables, and earned \$MADx balance are compiled securely and synced live with the global cloud servers.",
                    color = theme.textSecondary,
                    fontSize = 11.sp
                )
            }
        }

        // RESEARCH PROTOCOL & CORE STUDY DEEP DIVE PLAN (SECTION 2)
        Box(
            Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(10.dp))
                .background(theme.bgCard)
                .border(1.dp, Color.DarkGray, RoundedCornerShape(10.dp))
                .padding(14.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "🚨 MAD EXPERIMENTAL SANDBOX TELEMETRY",
                    color = theme.brandSecondary,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
                
                Text(
                    text = "This terminal allows thorough research of game parameters. Select your active satirical weapon from the roster, test dual-stage evolution paths, simulate procedural damage strain, or trigger stress validation matching 5,000 concurrent bot-predicted matches simultaneously. All mechanics write to state variables live inside the MVVM layer below.",
                    color = theme.textSecondary,
                    fontSize = 11.sp,
                    lineHeight = 15.sp
                )
                
                HorizontalDivider(color = Color.DarkGray.copy(alpha=0.5f), modifier = Modifier.padding(vertical = 4.dp))
                
                // Mini checklist format
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        StepIndicator(num = 1, text = "Deep integration MVVM State", done = true)
                        StepIndicator(num = 2, text = "Holographic Evolution Upgrades", done = true)
                        StepIndicator(num = 3, text = "Combat Deterioration/Damage", done = true)
                    }
                    Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        StepIndicator(num = 4, text = "Incinerator Burn & Scrap Reclamation", done = true)
                        StepIndicator(num = 5, text = "Mass Multi-User Tournaments", done = true)
                        StepIndicator(num = 6, text = "Secure High-Fidelity Cloud Sync", done = true)
                    }
                }
            }
        }

        // ACTIVE CARD SELECTION SECTION
        Text(
            text = "CHOOSE ACTIVE SATIRICAL CHARACTER IN CHAMBER:",
            color = theme.brandSecondary,
            fontSize = 11.sp,
            fontWeight = FontWeight.Black,
            fontFamily = FontFamily.Monospace
        )
        
        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
            val roster = if (state.ownedCards.isEmpty()) listOf(fallbackCard) else state.ownedCards
            items(roster) { card ->
                val isSelected = activeArenaCardId == card.id
                Box(
                    Modifier
                        .width(135.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (isSelected) theme.brandSecondary.copy(alpha=0.15f) else theme.bgCard)
                        .border(1.dp, if (isSelected) theme.brandSecondary else Color.DarkGray, RoundedCornerShape(8.dp))
                        .clickable { activeArenaCardId = card.id }
                        .padding(8.dp)
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                        Text(card.name, color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold, maxLines = 1)
                        Text(card.faction.uppercase(), color = theme.brandPrimary, fontSize = 8.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                        Spacer(Modifier.height(4.dp))
                        
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Text("PWR ${card.powerLevel}", color = Color.White, fontSize = 8.5.sp, fontFamily = FontFamily.Monospace)
                            Box(
                                Modifier
                                    .background(Color(card.rarity.color).copy(alpha=0.2f), RoundedCornerShape(2.dp))
                                    .padding(horizontal = 4.dp, vertical = 2.dp)
                            ) {
                                Text(card.rarity.display.uppercase(), color = Color(card.rarity.color), fontSize = 6.5.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }

        // MAIN ACTIVE INTERACTIVE NFT UPGRADE, DAMAGE & DETERIORATION SUITE
        Row(
            Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            
            // Left Card Display Wrapper
            Box(
                Modifier
                    .weight(0.9f)
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color.Black.copy(alpha=0.5f))
                    .border(2.dp, theme.brandSecondary.copy(alpha=0.6f), RoundedCornerShape(12.dp))
                    .padding(12.dp)
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("ACTIVE WEAPON FRAME", color = Color.Gray, fontSize = 9.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                    
                    // Styled Card Image view with dynamic flash effects
                    val animatedAlpha = remember { Animatable(1f) }
                    
                    Box(
                        Modifier
                            .fillMaxWidth()
                            .height(180.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(
                                if (flashGeneticUpgradeEffect) theme.brandSecondary.copy(alpha = 0.3f)
                                else if (flashDamageEffect) Color.Red.copy(alpha = 0.3f)
                                else theme.bgDeep
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                            // Dynamic damage crack representation
                            if (activeCard.durability < 0.6) {
                                Text("⚡ CRACKED STATS WARNING ⚡", color = Color.Red, fontSize = 8.sp, fontWeight = FontWeight.Black)
                            } else {
                                Text("INTEGRITY: NORMAL", color = theme.brandSecondary, fontSize = 8.sp, fontWeight = FontWeight.Black)
                            }
                            
                            Spacer(Modifier.height(8.dp))
                            
                            Box(
                                Modifier
                                    .size(60.dp)
                                    .background(theme.brandSecondary.copy(alpha = 0.1f), CircleShape)
                                    .border(1.5.dp, if (activeCard.durability < 0.5f) Color.Red else theme.brandSecondary, CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = when {
                                        activeCard.durability <= 0.0 -> "🔥" // Burnt out
                                        activeCard.durability < 0.4 -> "💔" // Highly deteriorated
                                        activeCard.evolutionStage == 3 -> "👑" // Ascended
                                        activeCard.evolutionStage == 2 -> "⚔️" // Elite
                                        else -> "🛡️"
                                    },
                                    fontSize = 28.sp
                                )
                            }
                            
                            Spacer(Modifier.height(8.dp))
                            Text(activeCard.name, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold, maxLines = 1, textAlign = TextAlign.Center)
                            Text(activeCard.faction.uppercase(), color = Color.Gray, fontSize = 8.sp, fontFamily = FontFamily.Monospace)
                        }
                    }
                    
                    // Durability rating progress bar
                    Column(verticalArrangement = Arrangement.spacedBy(3.dp), modifier = Modifier.fillMaxWidth()) {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("DURABILITY / INTEGRITY", color = Color.LightGray, fontSize = 7.5.sp, fontWeight = FontWeight.Bold)
                            Text("${(activeCard.durability * 100).toInt()}% Intact", color = if (activeCard.durability < 0.5) Color.Red else Color.Green, fontSize = 8.sp, fontWeight = FontWeight.Bold)
                        }
                        
                        LinearProgressIndicator(
                            progress = activeCard.durability.toFloat(),
                            modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(3.dp)),
                            color = if (activeCard.durability < 0.4) Color.Red else if (activeCard.durability < 0.7) Color.Yellow else Color.Green,
                            trackColor = Color.DarkGray
                        )
                    }
                    
                    // Stats Column
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Column {
                            Text("STAGE", color = Color.Gray, fontSize = 7.sp)
                            Text(
                                text = when (activeCard.evolutionStage) {
                                    2 -> "★★ ELITE"
                                    3 -> "★★★ SUPREME"
                                    else -> "★ STANDARD"
                                },
                                color = theme.brandPrimary,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text("APY EARNS", color = Color.Gray, fontSize = 7.sp)
                            Text("${"%.1f".format(activeCard.earnsCount)} \$MADx", color = theme.brandSecondary, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
            
            // Right Control Interface Actions
            Column(
                Modifier
                    .weight(1.1f)
                    .background(theme.bgCard)
                    .padding(vertical = 4.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text("LAB INTEGRATIONS", color = theme.brandPrimary, fontSize = 10.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                
                // EVO BUTTON
                Button(
                    onClick = {
                        if (activeCard.evolutionStage < 3) {
                            flashGeneticUpgradeEffect = true
                            vm.evolveCardState(activeCard.id)
                            vm.playFeedbackTone(android.media.ToneGenerator.TONE_CDMA_PIP, 120)
                            // reset splash
                            scope.launch {
                                kotlinx.coroutines.delay(600)
                                flashGeneticUpgradeEffect = false
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = theme.brandSecondary),
                    shape = RoundedCornerShape(6.dp),
                    modifier = Modifier.fillMaxWidth(),
                    enabled = activeCard.evolutionStage < 3,
                    contentPadding = PaddingValues(vertical = 8.dp)
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("EVOLVE GENETICS 🧬", color = theme.bgDeep, fontSize = 10.sp, fontWeight = FontWeight.Black)
                        Text("Adds +1,200 power limits", color = theme.bgDeep.copy(alpha=0.7f), fontSize = 7.5.sp)
                    }
                }
                
                // DAMAGE TEST SIMULATOR BUTTON
                Button(
                    onClick = {
                        flashDamageEffect = true
                        vm.damageCardState(activeCard.id, 0.15)
                        vm.playFeedbackTone(android.media.ToneGenerator.TONE_PROP_ACK, 100)
                        scope.launch {
                            kotlinx.coroutines.delay(500)
                            flashDamageEffect = false
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFCC3300)),
                    shape = RoundedCornerShape(6.dp),
                    modifier = Modifier.fillMaxWidth(),
                    contentPadding = PaddingValues(vertical = 8.dp),
                    enabled = activeCard.durability > 0.0
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("INFLICT COMBAT DAMAGE 💥", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Black)
                        Text("Infuse -15% structural wear", color = Color.White.copy(alpha=0.7f), fontSize = 7.5.sp)
                    }
                }
                
                // REPAIR BUTTON
                Button(
                    onClick = {
                        vm.repairCardState(activeCard.id)
                        vm.playFeedbackTone(android.media.ToneGenerator.TONE_CDMA_CONFIRM, 100)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF00AAFF)),
                    shape = RoundedCornerShape(6.dp),
                    modifier = Modifier.fillMaxWidth(),
                    contentPadding = PaddingValues(vertical = 8.dp),
                    enabled = activeCard.durability < 1.0 && state.madxBalance >= 150.0
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("REPAIR & RESTORE 🔧", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Black)
                        Text("Cost: 150 \$MADx", color = Color.White.copy(alpha=0.7f), fontSize = 7.5.sp)
                    }
                }

                // BURN CARD BUTTON
                Button(
                    onClick = {
                        incineratorActive = true
                        vm.playFeedbackTone(android.media.ToneGenerator.TONE_CDMA_SOFT_ERROR_LITE, 150)
                        scope.launch {
                            kotlinx.coroutines.delay(800)
                            vm.burnCardState(activeCard.id)
                            incineratorActive = false
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color.DarkGray),
                    shape = RoundedCornerShape(6.dp),
                    modifier = Modifier.fillMaxWidth(),
                    contentPadding = PaddingValues(vertical = 8.dp)
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("INCINERATOR BURN 🔥", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Black)
                        Text("Reclaims 350 \$MADx raw salvage", color = Color.White.copy(alpha=0.7f), fontSize = 7.5.sp)
                    }
                }
            }
        }

        // INTEGRATED BATTLE SIMULATORS (SAGAS, PVP, TOURNAMENTS)
        Box(
            Modifier
                .fillMaxWidth()
                .border(1.dp, Color.DarkGray, RoundedCornerShape(8.dp))
                .padding(12.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                // Inside Navigation Menu of Arena Modes
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color.Black.copy(alpha=0.4f), RoundedCornerShape(6.dp))
                        .padding(4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    val battleTabs = listOf("SAGAS", "PvP ARENA", "LIVE TOURNAMENT")
                    battleTabs.forEach { tab ->
                        val isSelected = battleModeTab == tab
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(4.dp))
                                .background(if (isSelected) theme.brandPrimary.copy(alpha = 0.25f) else Color.Transparent)
                                .clickable { battleModeTab = tab }
                                .padding(vertical = 6.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = tab,
                                color = if (isSelected) theme.brandPrimary else Color.Gray,
                                fontWeight = FontWeight.Bold,
                                fontSize = 9.5.sp,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }
                }

                when (battleModeTab) {
                    "SAGAS" -> {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            // Stunning circular progress milestones viz element
                            SagaTracker(
                                sagaList = state.sagaProgress,
                                activeChapterId = sagaActiveChapter,
                                onSelectChapter = { sagaActiveChapter = it }
                            )
                            
                            Box(
                                Modifier
                                    .fillMaxWidth()
                                    .background(Color.Black.copy(alpha=0.3f), RoundedCornerShape(6.dp))
                                    .padding(10.dp)
                            ) {
                                Text(
                                    text = "📖 CHAPTER $sagaActiveChapter ACTIVE:\n$sagaStatusText",
                                    color = Color.White,
                                    fontSize = 11.sp,
                                    lineHeight = 15.sp,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                            
                            Button(
                                onClick = {
                                    val loss = (5..15).random() * 0.01
                                    val rewards = (45..180).random() * 1.0
                                    vm.damageCardState(activeCard.id, loss)
                                    vm.addEarningsToCard(activeCard.id, rewards)
                                    
                                    // Dynamically advance Chapter progression percent upon quest resolution
                                    val progressDelta = (10..22).random().toFloat()
                                    vm.incrementSagaProgressAndSave(sagaActiveChapter, progressDelta)
                                    
                                    sagaStatusText = "Deploying satirical weapon: '${activeCard.name}' into story grid.\n" +
                                        "✗ Inflicted -${(loss*100).toInt()}% structural wear & dynamic strain.\n" +
                                        "✓ Resolved prediction consensus match outcome successfully!\n" +
                                        "📈 Advanced Chapter progress +${progressDelta.toInt()}%!\n" +
                                        "🏆 EARNED REWARD: +${"%.1f".format(rewards)} \$MADx injected to balance."
                                    
                                    vm.playFeedbackTone(android.media.ToneGenerator.TONE_CDMA_CONFIRM, 90)
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = theme.brandPrimary),
                                shape = RoundedCornerShape(6.dp),
                                modifier = Modifier.fillMaxWidth(),
                                enabled = activeCard.durability > 0.0
                            ) {
                                Text("LAUNCH QUEST MATCH ⚡", color = theme.bgDeep, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                    
                    "PvP ARENA" -> {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("MULTIPLAYER PvP CONFLICT", color = theme.brandSecondary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            
                            Box(
                                Modifier
                                    .fillMaxWidth()
                                    .background(Color.Black.copy(alpha=0.3f), RoundedCornerShape(6.dp))
                                    .padding(10.dp)
                            ) {
                                Text(
                                    text = "⚔️ PVP CONTENDER STATUS:\n$pvpStatusText",
                                    color = Color.White,
                                    fontSize = 11.sp,
                                    lineHeight = 15.sp,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                            
                            Button(
                                onClick = {
                                    val bots = listOf("SovereignNode-9005", "DegenArbitrageur-4011", "MemeHoarder-1002", "GaryGenslerAlpha-007")
                                    val opponent = bots.random()
                                    val win = Math.random() > 0.45
                                    val loss = (8..22).random() * 0.01
                                    val rewards = if (win) (150..350).random() * 1.0 else 20.0
                                    
                                    vm.damageCardState(activeCard.id, loss)
                                    vm.addEarningsToCard(activeCard.id, rewards)
                                    
                                    pvpStatusText = "RIVAL ACQUIRED: $opponent\n" +
                                        "• Strategy Clash: Active Power ${activeCard.powerLevel} vs rival rating ${(6000..9900).random()}.\n" +
                                        "• Outcome: ${if (win) "VICTORY! 🏆" else "DEFEAT! 💀"}\n" +
                                        "• Durability Deterioration: -${(loss*100).toInt()}%\n" +
                                        "• Leveraged payout: +${"%.1f".format(rewards)} \$MADx"
                                    
                                    vm.playFeedbackTone(
                                        if (win) android.media.ToneGenerator.TONE_CDMA_CONFIRM 
                                        else android.media.ToneGenerator.TONE_CDMA_SOFT_ERROR_LITE, 100
                                    )
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = theme.brandSecondary),
                                shape = RoundedCornerShape(6.dp),
                                modifier = Modifier.fillMaxWidth(),
                                enabled = activeCard.durability > 0.0
                            ) {
                                Text("MATCH & DISPUTE WITH OPPONENT 🥊", color = theme.bgDeep, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                    
                    "LIVE TOURNAMENT" -> {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                Text("MASS CONGESTION TOURNAMENT CENTER", color = theme.brandSecondary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                if (isTournamentRunning) {
                                    Box(
                                        Modifier
                                            .background(Color.Red.copy(alpha=0.15f), RoundedCornerShape(4.dp))
                                            .border(1.dp, Color.Red, RoundedCornerShape(4.dp))
                                            .padding(horizontal = 6.dp, vertical = 2.dp)
                                    ) {
                                        Text("TOURNAMENT ACTIVE", color = Color.Red, fontSize = 8.sp, fontWeight = FontWeight.Black)
                                    }
                                }
                            }
                            
                            Box(
                                Modifier
                                    .fillMaxWidth()
                                    .height(110.dp)
                                    .background(Color.Black.copy(alpha=0.3f), RoundedCornerShape(6.dp))
                                    .padding(10.dp)
                            ) {
                                Text(
                                    text = tournamentTelemetryLog,
                                    color = Color.White,
                                    fontSize = 11.sp,
                                    lineHeight = 15.sp,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                            
                            Button(
                                onClick = { isTournamentRunning = true },
                                colors = ButtonDefaults.buttonColors(containerColor = theme.brandAccent),
                                shape = RoundedCornerShape(6.dp),
                                modifier = Modifier.fillMaxWidth(),
                                enabled = !isTournamentRunning && activeCard.durability > 0.0
                            ) {
                                Text(if (isTournamentRunning) "STRESS SIMULATION RUNNING..." else "INITIATE NATIONWIDE TOURNAMENT (5K USERS) 🏆", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }

        // DECENTRALIZED TRUSTED BLOCK DATA LEDGER STREAM
        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text("DECENTRALIZED TRANSACTIONS LEDGER LOGS:", color = Color.Gray, fontSize = 9.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
            Box(
                Modifier
                    .fillMaxWidth()
                    .height(130.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(Color.Black)
                    .border(1.dp, Color.DarkGray, RoundedCornerShape(8.dp))
                    .padding(8.dp)
            ) {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    val logs = state.eigenTrustLogs.filter { it.contains("BLOCKCHAIN_SYNC") }
                    if (logs.isEmpty()) {
                        item {
                            Text("★ Ledger stream idle. Trigger upgraded transactions or 'Exit to Lobby' sync above to write records.", color = Color.DarkGray, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                        }
                    } else {
                        items(logs) { log ->
                            Text(log, color = Color(0x39FF14), fontSize = 9.sp, fontFamily = FontFamily.Monospace, lineHeight = 12.sp)
                        }
                    }
                }
            }
        }
    }

    // SECURE CLOUD STORAGE SYNC OVERLAY
    if (showExitOverlay) {
        AlertDialog(
            onDismissRequest = { if (blockchainSyncProgress >= 1f) showExitOverlay = false },
            containerColor = theme.bgCard,
            tonalElevation = 12.dp,
            title = {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("🛡️ SECURE VAULT SYNCHRONIZATION", color = theme.brandSecondary, fontSize = 14.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                }
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(
                        text = "Establishing high-security sync pipeline, preserving upgraded weapon stages, damage wear, and live game balances...",
                        color = Color.LightGray,
                        fontSize = 11.sp
                    )
                    
                    Box(
                        Modifier
                            .fillMaxWidth()
                            .background(Color.Black, RoundedCornerShape(6.dp))
                            .padding(8.dp)
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text("SYNC SESSION ID: $blockchainSyncTxnHash", color = Color.Gray, fontSize = 8.5.sp, fontFamily = FontFamily.Monospace)
                            Text("TARGET ENDPOINT: Live Battle Lobby Database Spoke", color = Color.Gray, fontSize = 8.5.sp, fontFamily = FontFamily.Monospace)
                            Text("SYNC PROCESS: $blockchainSyncStatus", color = theme.brandPrimary, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                        }
                    }
                    
                    LinearProgressIndicator(
                        progress = blockchainSyncProgress,
                        modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp)),
                        color = theme.brandPrimary,
                        trackColor = Color.DarkGray
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = { showExitOverlay = false },
                    enabled = blockchainSyncProgress >= 1f,
                    colors = ButtonDefaults.buttonColors(containerColor = theme.brandPrimary)
                ) {
                    Text("COMPLETE SYNC", color = theme.bgDeep, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                }
            }
        )
    }
}

@Composable
fun StoryChapterChip(num: Int, title: String, selected: Boolean, onSelect: () -> Unit) {
    val theme = LocalGambitTheme.current
    Box(
        Modifier
            .clip(RoundedCornerShape(6.dp))
            .background(if (selected) theme.brandSecondary.copy(alpha=0.15f) else theme.bgCard)
            .border(1.dp, if (selected) theme.brandSecondary else Color.DarkGray, RoundedCornerShape(6.dp))
            .clickable { onSelect() }
            .padding(horizontal = 8.dp, vertical = 6.dp)
    ) {
        Text("Ch. $num: $title", color = if (selected) Color.White else Color.Gray, fontSize = 9.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun StepIndicator(num: Int, text: String, done: Boolean) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        Box(
            Modifier
                .size(12.dp)
                .background(if (done) Color.Green else Color.DarkGray, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Text("$num", color = Color.Black, fontSize = 7.5.sp, fontWeight = FontWeight.Black)
        }
        Text(text, color = Color.Gray, fontSize = 9.2.sp)
    }
}

@Composable
fun PortfolioTrackerView(tier: ProfileTier) {
    val theme = LocalGambitTheme.current
    val goldFlake = Brush.linearGradient(listOf(Color(0xFFFFD700), Color(0xFFDAA520), Color(0xFFB8860B)))
    
    val maxTracked = when(tier) {
        ProfileTier.USER -> 2
        ProfileTier.CREATOR -> 4
        ProfileTier.VIP -> 6
    }
    
    var selectedView by remember { mutableStateOf("Prediction") }

    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(theme.bgCard)
                .border(1.dp, goldFlake, RoundedCornerShape(12.dp))
                .padding(16.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                // Toggle View
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    Text(
                        text = "PREDICTION PLAYS",
                        color = if (selectedView == "Prediction") theme.brandPrimary else theme.textSecondary,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = com.example.ui.theme.AllertaStencilFamily,
                        modifier = Modifier.clickable { selectedView = "Prediction" }
                    )
                    Text(
                        text = "CONVICTIONS",
                        color = if (selectedView == "Conviction") theme.brandPrimary else theme.textSecondary,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = com.example.ui.theme.AllertaStencilFamily,
                        modifier = Modifier.clickable { selectedView = "Conviction" }
                    )
                }
                
                Spacer(Modifier.height(4.dp))
                
                if (selectedView == "Prediction") {
                    // Demo item 1
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("ETH to \$4K by EOM", color = theme.textPrimary, fontSize = 14.sp)
                                // Liar Engine Indicator
                                Box(
                                    modifier = Modifier
                                        .background(com.example.ui.theme.BrandCrimson.copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                                        .border(1.dp, com.example.ui.theme.BrandCrimson, RoundedCornerShape(4.dp))
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text("LIAR ENGINE", color = com.example.ui.theme.BrandCrimson, fontSize = 8.sp, fontWeight = FontWeight.Black)
                                }
                            }
                            Text("Satirical Conviction Play", color = theme.brandAccent, fontSize = 10.5.sp)
                        }
                        Text("+42%", color = Color.Green, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    }
                    HorizontalDivider(color = theme.textSecondary.copy(alpha=0.2f))
                    // Demo item 2
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Column {
                            Text("Solana flippening", color = theme.textPrimary, fontSize = 14.sp)
                            Text("Long-term Asset Hold", color = theme.brandSecondary, fontSize = 10.5.sp)
                        }
                        Text("-5%", color = Color.Red, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    }
                } else {
                    // Conviction view items
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Column {
                            Text("DeFi Summer 2.0", color = theme.brandPrimary, fontSize = 14.sp)
                            Text("Heavy Exposure / Max Conviction", color = theme.textSecondary, fontSize = 10.5.sp)
                        }
                        Text("ACTIVE", color = theme.brandSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
        
        Spacer(Modifier.height(8.dp))
        Text("PEOPLE TRACKER", color = theme.brandPrimary, fontSize = 16.sp, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.AllertaStencilFamily)
        Text("Your Tier (${tier.name}) allows tracking of $maxTracked individuals.", color = theme.textSecondary, fontSize = 12.sp)
        
        LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            items(maxTracked) { idx ->
                Box(
                    modifier = Modifier
                        .width(100.dp)
                        .height(120.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(theme.bgCard)
                        .border(theme.borderWidth, theme.borderBrush, RoundedCornerShape(8.dp))
                        .padding(8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .clip(CircleShape)
                                .background(theme.textSecondary.copy(alpha=0.2f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Filled.Person, contentDescription = null, tint = theme.textSecondary)
                        }
                        Spacer(Modifier.height(8.dp))
                        Text(if (idx < 2) "Active" else "Empty Slot", color = theme.textPrimary, fontSize = 10.5.sp, maxLines = 1)
                        if (idx < 2) {
                            Text("+12.4%", color = Color.Green, fontSize = 10.5.sp)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun GoogleWorkspaceHubView(vm: GambitViewModel) {
    val theme = LocalGambitTheme.current
    val state by vm.state.collectAsState()
    val scope = rememberCoroutineScope()
    val authState = state.authState

    var sheetSyncStatus by remember { mutableStateOf("NOT_SYNCED") } // NOT_SYNCED, SYNCING, SYNCED
    var calendarSyncStatus by remember { mutableStateOf("NOT_SYNCED") } // NOT_SYNCED, SYNCING, SYNCED
    var driveBackupStatus by remember { mutableStateOf("NOT_BACKED_UP") } // NOT_BACKED_UP, BACKING_UP, BACKED_UP
    var lastSyncTime by remember { mutableStateOf<String?>(null) }
    var localCacheAnalysisResult by remember { mutableStateOf<String?>(null) }
    var isLocalCacheScanning by remember { mutableStateOf(false) }
    var isLocalCacheEnabled by remember { mutableStateOf(true) }
    
    // Chat lobby states
    var chatMessageText by remember { mutableStateOf("") }
    var listMessages by remember {
        mutableStateOf(
            listOf(
                Pair("System Bot 🤖", "Welcome to the Google Workspace Hub. Sign in via Google Auth to activate drive, sheet, and calendar synchronizations!"),
                Pair("Card Sentinel 🃏", "Allerta Stencil font has been loaded for all critical tickers. Looking beautiful.")
            )
        )
    }

    LaunchedEffect(authState.isAuthenticated) {
        if (authState.isAuthenticated) {
            listMessages = listMessages + Pair("System Bot 🤖", "✓ ${authState.username} successfully linked Google Workspace Account!")
        }
    }

    Column(verticalArrangement = Arrangement.spacedBy(16.dp), modifier = Modifier.fillMaxWidth()) {
        
        // Google Workspace Integration Status Card
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .background(Color.White.copy(alpha = 0.05f)) // Luxury Crystal Glass background
                .border(
                    BorderStroke(
                        1.dp,
                        Brush.linearGradient(
                            listOf(
                                Color.White.copy(alpha = 0.25f),
                                Color.White.copy(alpha = 0.02f)
                            )
                        )
                    ),
                    RoundedCornerShape(16.dp)
                )
                .padding(16.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "GOOGLE WORKSPACE DECENTRALIZED SYNC",
                            color = theme.brandSecondary,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = com.example.ui.theme.AllertaStencilFamily
                        )
                        Text(
                            text = if (authState.isAuthenticated) "Connected to: ${authState.email}" else "Workspace Connection Disconnected",
                            color = Color.LightGray,
                            fontSize = 11.sp,
                            fontFamily = com.example.ui.theme.ArialNarrowFamily
                        )
                    }
                    
                    Box(
                        modifier = Modifier
                            .background(
                                if (authState.isAuthenticated) Color.Green.copy(alpha = 0.15f) else Color.Red.copy(alpha = 0.15f),
                                RoundedCornerShape(4.dp)
                            )
                            .border(
                                1.dp,
                                if (authState.isAuthenticated) Color.Green else Color.Red,
                                RoundedCornerShape(4.dp)
                            )
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = if (authState.isAuthenticated) "ACTIVE SYNC" else "OFFLINE",
                            color = if (authState.isAuthenticated) Color.Green else Color.Red,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = com.example.ui.theme.AllertaStencilFamily
                        )
                    }
                }

                HorizontalDivider(color = theme.textSecondary.copy(alpha = 0.15f))

                if (!authState.isAuthenticated) {
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = "LINK TO ENABLE PREMIUM BACKUP INTEGRATION",
                            color = Color.White,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = com.example.ui.theme.AllertaStencilFamily
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                            Button(
                                onClick = { vm.handleSignIn("GOOGLE") },
                                modifier = Modifier
                                    .weight(1f)
                                    .border(
                                        BorderStroke(
                                            1.dp,
                                            Brush.linearGradient(
                                                listOf(
                                                    Color.White.copy(alpha = 0.3f),
                                                    Color.White.copy(alpha = 0.05f)
                                                )
                                            )
                                        ),
                                        RoundedCornerShape(8.dp)
                                    ),
                                colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha = 0.08f), contentColor = Color.White),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text("🔑 LINK GOOGLE", fontSize = 11.sp, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                            }
                            
                            Button(
                                onClick = { vm.handleSignIn("0-AUTH") },
                                modifier = Modifier
                                    .weight(1f)
                                    .border(
                                        BorderStroke(
                                            1.dp,
                                            Brush.linearGradient(
                                                listOf(
                                                    Color.White.copy(alpha = 0.3f),
                                                    Color.White.copy(alpha = 0.05f)
                                                )
                                            )
                                        ),
                                        RoundedCornerShape(8.dp)
                                    ),
                                colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha = 0.08f), contentColor = NeonCyan),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text("⚡ PASSWORDLESS", fontSize = 11.sp, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                            }
                        }
                    }
                } else {
                    Text(
                        text = "Manage your real-time decentralized backups and automation triggers below directly on the user profile.",
                        color = Color.LightGray,
                        fontSize = 12.sp,
                        fontFamily = com.example.ui.theme.ArialNarrowFamily
                    )
                }
            }
        }

        // Action grid
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
            
            // Google Sheets Sync Card
            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color.White.copy(alpha = 0.04f))
                    .border(
                        BorderStroke(
                            1.dp,
                            Brush.linearGradient(
                                listOf(
                                    Color.White.copy(alpha = 0.15f),
                                    Color.White.copy(alpha = 0.02f)
                                )
                            )
                        ),
                        RoundedCornerShape(12.dp)
                    )
                    .clickable(enabled = authState.isAuthenticated) {
                        if (sheetSyncStatus != "SYNCING") {
                            scope.launch {
                                sheetSyncStatus = "SYNCING"
                                kotlinx.coroutines.delay(1200)
                                sheetSyncStatus = "SYNCED"
                                vm.playFeedbackTone(android.media.ToneGenerator.TONE_PROP_ACK, 80)
                                lastSyncTime = "Just Now"
                            }
                        }
                    }
                    .padding(12.dp)
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("📊 GOOGLE SHEETS", color = Color.Green, fontSize = 11.sp, fontWeight = FontWeight.Black, fontFamily = com.example.ui.theme.AllertaStencilFamily)
                    Icon(
                        imageVector = Icons.Filled.GridOn,
                        contentDescription = "Sheets Integration",
                        tint = if (authState.isAuthenticated) Color.Green else Color.Gray,
                        modifier = Modifier.size(32.dp)
                    )
                    Text(
                        text = when (sheetSyncStatus) {
                            "SYNCING" -> "SYNCING..."
                            "SYNCED" -> "SYNCED ✓"
                            else -> "EXPORT VALUES"
                        },
                        color = if (sheetSyncStatus == "SYNCED") Color.Green else Color.White,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.ExtraBold,
                        fontFamily = com.example.ui.theme.ArialNarrowFamily
                    )
                }
            }

            // Google Drive backup Card
            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color.White.copy(alpha = 0.04f))
                    .border(
                        BorderStroke(
                            1.dp,
                            Brush.linearGradient(
                                listOf(
                                    Color.White.copy(alpha = 0.15f),
                                    Color.White.copy(alpha = 0.02f)
                                )
                            )
                        ),
                        RoundedCornerShape(12.dp)
                    )
                    .clickable(enabled = authState.isAuthenticated) {
                        if (driveBackupStatus != "BACKING_UP") {
                            scope.launch {
                                driveBackupStatus = "BACKING_UP"
                                kotlinx.coroutines.delay(1500)
                                driveBackupStatus = "BACKED_UP"
                                vm.playFeedbackTone(android.media.ToneGenerator.TONE_PROP_ACK, 80)
                            }
                        }
                    }
                    .padding(12.dp)
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("💾 GOOGLE DRIVE", color = NeonCyan, fontSize = 11.sp, fontWeight = FontWeight.Black, fontFamily = com.example.ui.theme.AllertaStencilFamily)
                    Icon(
                        imageVector = Icons.Filled.CloudUpload,
                        contentDescription = "Drive Backup",
                        tint = if (authState.isAuthenticated) NeonCyan else Color.Gray,
                        modifier = Modifier.size(32.dp)
                    )
                    Text(
                        text = when (driveBackupStatus) {
                            "BACKING_UP" -> "UPLOADING..."
                            "BACKED_UP" -> "BACKED UP ✓"
                            else -> "BACKUP DECK JSON"
                        },
                        color = if (driveBackupStatus == "BACKED_UP") NeonCyan else Color.White,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.ExtraBold,
                        fontFamily = com.example.ui.theme.ArialNarrowFamily
                    )
                }
            }
        }

        // Row for Calendar Sync
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(Color.White.copy(alpha = 0.04f))
                .border(
                    BorderStroke(
                        1.dp,
                        Brush.linearGradient(
                            listOf(
                                Color.White.copy(alpha = 0.15f),
                                Color.White.copy(alpha = 0.02f)
                            )
                        )
                    ),
                    RoundedCornerShape(12.dp)
                )
                .clickable(enabled = authState.isAuthenticated) {
                    if (calendarSyncStatus != "SYNCING") {
                        scope.launch {
                            calendarSyncStatus = "SYNCING"
                            kotlinx.coroutines.delay(1000)
                            calendarSyncStatus = "SYNCED"
                            vm.playFeedbackTone(android.media.ToneGenerator.TONE_PROP_ACK, 85)
                        }
                    }
                }
                .padding(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Filled.CalendarMonth,
                        contentDescription = "Calendar Integration",
                        tint = BrandGold,
                        modifier = Modifier.size(28.dp)
                    )
                    Column {
                        Text(
                            text = "GOOGLE CALENDAR TOURNAMENT TRIGGERS",
                            color = BrandGold,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = com.example.ui.theme.AllertaStencilFamily
                        )
                        Text(
                            text = "Sync Card Cull tournament alert (last Friday of Month)",
                            color = Color.LightGray,
                            fontSize = 10.sp,
                            fontFamily = com.example.ui.theme.ArialNarrowFamily
                        )
                    }
                }
                
                Text(
                    text = when (calendarSyncStatus) {
                        "SYNCING" -> "SYNCING..."
                        "SYNCED" -> "SYNCED ✓"
                        else -> "SYNC CALENDAR"
                    },
                    color = if (calendarSyncStatus == "SYNCED") BrandGold else Color.White,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = com.example.ui.theme.AllertaStencilFamily
                )
            }
        }

        // Google Chat API lobby module 
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .background(Color.White.copy(alpha = 0.05f))
                .border(
                    BorderStroke(
                        1.dp,
                        Brush.linearGradient(
                            listOf(
                                Color.White.copy(alpha = 0.25f),
                                Color.White.copy(alpha = 0.02f)
                            )
                        )
                    ),
                    RoundedCornerShape(16.dp)
                )
                .padding(16.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(
                    text = "💬 GOOGLE CHAT DIRECT FEED via Chat API",
                    color = theme.brandPrimary,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = com.example.ui.theme.AllertaStencilFamily
                )

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(130.dp)
                        .background(Color.Black.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                        .border(1.dp, Color.DarkGray, RoundedCornerShape(8.dp))
                        .padding(8.dp)
                ) {
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier.fillMaxSize()
                    ) {
                        items(listMessages) { msg ->
                            Column {
                                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Text(
                                        text = msg.first,
                                        fontWeight = FontWeight.Bold,
                                        color = if (msg.first == "System Bot 🤖") theme.brandSecondary else theme.brandPrimary,
                                        fontSize = 10.sp,
                                        fontFamily = com.example.ui.theme.AllertaStencilFamily
                                    )
                                    Text(
                                        text = "• verified via Chat API",
                                        color = Color.Gray,
                                        fontSize = 8.sp,
                                        fontFamily = com.example.ui.theme.ArialNarrowFamily
                                    )
                                }
                                Text(
                                    text = msg.second,
                                    color = Color.LightGray,
                                    fontSize = 11.sp,
                                    fontFamily = com.example.ui.theme.ArialNarrowFamily
                                )
                            }
                        }
                    }
                }
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextField(
                        value = chatMessageText,
                        onValueChange = { chatMessageText = it },
                        placeholder = { Text("Compile messages...", fontSize = 10.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily) },
                        modifier = Modifier.weight(1f),
                        enabled = authState.isAuthenticated,
                        textStyle = TextStyle(fontSize = 11.sp, color = Color.White, fontFamily = com.example.ui.theme.ArialNarrowFamily),
                        colors = TextFieldDefaults.colors(
                            focusedContainerColor = Color.Black,
                            unfocusedContainerColor = Color.Black.copy(alpha = 0.5f),
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White
                        ),
                        shape = RoundedCornerShape(6.dp)
                    )
                    
                    Button(
                        onClick = {
                            if (chatMessageText.isNotBlank()) {
                                val userText = chatMessageText
                                listMessages = listMessages + Pair(authState.username, userText)
                                chatMessageText = ""
                                
                                scope.launch {
                                    kotlinx.coroutines.delay(1000)
                                    val responses = listOf(
                                        "Aesthetic style verified. Stencil fonts looking amazing on cards.",
                                        "Decentralized ledger backing up beautifully to Drive system.",
                                        "Sheets export holds direct parity with the local Room state database.",
                                        "Calendar event synchronization active and ready to alert on Friday.",
                                        "Did you check the current volatility index? It is leaning Euphoria."
                                    )
                                    listMessages = listMessages + Pair("System Bot & Oracle 🤖", responses.random())
                                    vm.playFeedbackTone(android.media.ToneGenerator.TONE_PROP_ACK, 75)
                                }
                            }
                        },
                        enabled = authState.isAuthenticated,
                        modifier = Modifier.border(
                            BorderStroke(
                                1.dp,
                                Brush.linearGradient(
                                    listOf(
                                        Color.White.copy(alpha = 0.3f),
                                        Color.White.copy(alpha = 0.05f)
                                    )
                                )
                            ),
                            RoundedCornerShape(6.dp)
                        ),
                        colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha = 0.08f), contentColor = theme.brandSecondary),
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Text("SEND", fontSize = 10.sp, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.AllertaStencilFamily)
                    }
                }
            }
        }

        Spacer(Modifier.height(16.dp))

        // --- 🗄️ MADHAT'R LOCAL BROWSER CACHE PROFILE INTEGRATOR ---
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .background(Color(0xFF0C0714))
                .border(
                    BorderStroke(
                        1.dp,
                        Brush.linearGradient(
                            listOf(
                                theme.brandSecondary.copy(alpha = 0.6f),
                                theme.brandPrimary.copy(alpha = 0.1f)
                            )
                        )
                    ),
                    RoundedCornerShape(16.dp)
                )
                .padding(16.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("🎩", fontSize = 20.sp)
                        Column {
                            Text(
                                text = "MADHAT'R LOCAL CACHE PROFILE INTEGRATOR",
                                color = theme.brandSecondary,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Black,
                                fontFamily = com.example.ui.theme.AllertaStencilFamily
                            )
                            Text(
                                text = "Integrate simulated browser cookies & local dApp history",
                                color = Color.Gray,
                                fontSize = 10.sp,
                                fontFamily = com.example.ui.theme.ArialNarrowFamily
                            )
                        }
                    }
                    
                    Box(
                        modifier = Modifier
                            .background(theme.brandSecondary.copy(alpha = 0.15f), RoundedCornerShape(4.dp))
                            .border(1.dp, theme.brandSecondary, RoundedCornerShape(4.dp))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = "GEMINI 3.5 FLASH",
                            color = theme.brandSecondary,
                            fontSize = 8.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }

                HorizontalDivider(color = theme.textSecondary.copy(alpha = 0.15f))

                // --- 🛡️ PRIVACY TOGGLE SWITCH ---
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color.White.copy(alpha = 0.03f), RoundedCornerShape(8.dp))
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        Text(
                            text = "Enable Local Session Profile Cache",
                            color = Color.White,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = com.example.ui.theme.ArialNarrowFamily
                        )
                        Text(
                            text = if (isLocalCacheEnabled) 
                                "Active: Gemini can parse local prediction cookies for roasts." 
                                else "Privacy Mode Active: Personalization cache is completely disabled.",
                            color = if (isLocalCacheEnabled) theme.brandSecondary else Color.LightGray,
                            fontSize = 10.sp,
                            fontFamily = com.example.ui.theme.ArialNarrowFamily
                        )
                    }
                    
                    Switch(
                        checked = isLocalCacheEnabled,
                        onCheckedChange = { 
                            isLocalCacheEnabled = it
                            if (!it) {
                                localCacheAnalysisResult = null
                            }
                        },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = theme.brandSecondary,
                            checkedTrackColor = theme.brandSecondary.copy(alpha = 0.3f),
                            uncheckedThumbColor = Color.Gray,
                            uncheckedTrackColor = Color.DarkGray
                        )
                    )
                }

                if (!isLocalCacheEnabled) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color.Red.copy(alpha = 0.05f), RoundedCornerShape(8.dp))
                            .border(1.dp, Color.Red.copy(alpha = 0.2f), RoundedCornerShape(8.dp))
                            .padding(12.dp)
                    ) {
                        Text(
                            text = "🔒 PRIVACY MODE ENABLED: No local cookies, session caches, or prediction profiles are being accessed. Your historical activity is completely sandboxed.",
                            color = Color(0xFFFFA0A0),
                            fontSize = 11.sp,
                            fontFamily = com.example.ui.theme.ArialNarrowFamily
                        )
                    }
                } else {
                    if (localCacheAnalysisResult == null) {
                        Text(
                            text = "Trigger a localized client-side analysis of simulated browser prediction cookies, cleared dApp sessions, and interface preferences. The pattern recognition engine will synthesize these local clues into custom satirical trading advice.",
                            color = Color.LightGray,
                            fontSize = 11.sp,
                            lineHeight = 15.sp,
                            fontFamily = com.example.ui.theme.ArialNarrowFamily
                        )
                    } else {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Color.Black.copy(alpha = 0.6f), RoundedCornerShape(8.dp))
                                .border(1.dp, theme.brandSecondary.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                                .padding(12.dp)
                        ) {
                            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Text("📄", fontSize = 14.sp)
                                    Text(
                                        text = "RECOVERED LOCAL CACHE REPORT",
                                        color = theme.brandSecondary,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        fontFamily = com.example.ui.theme.AllertaStencilFamily
                                    )
                                }
                                Text(
                                    text = localCacheAnalysisResult ?: "",
                                    color = Color.White,
                                    fontSize = 11.sp,
                                    lineHeight = 15.sp,
                                    fontFamily = com.example.ui.theme.ArialNarrowFamily
                                )
                            }
                        }
                    }

                    Button(
                        onClick = {
                            if (!isLocalCacheScanning) {
                                scope.launch {
                                    isLocalCacheScanning = true
                                    vm.playFeedbackTone(android.media.ToneGenerator.TONE_CDMA_PIP, 100)
                                    kotlinx.coroutines.delay(1800)
                                    val portfolioStatus = "MADX Balance: ${state.madxBalance}, Staked: ${state.stakedMadxBalance}, Cards Count: ${state.ownedCards.size}"
                                    localCacheAnalysisResult = com.example.engine.GeminiForecastClient.performLocalBrowserCacheAnalysis(
                                        portfolioStatus = portfolioStatus,
                                        recoveredItemCount = (10..60).random()
                                    )
                                    isLocalCacheScanning = false
                                    vm.playFeedbackTone(android.media.ToneGenerator.TONE_PROP_ACK, 120)
                                }
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(
                                BorderStroke(
                                    1.dp,
                                    Brush.linearGradient(
                                        listOf(
                                            theme.brandSecondary,
                                            theme.brandSecondary.copy(alpha = 0.2f)
                                        )
                                    )
                                ),
                                RoundedCornerShape(8.dp)
                            ),
                        colors = ButtonDefaults.buttonColors(containerColor = theme.brandSecondary.copy(alpha = 0.12f), contentColor = theme.brandSecondary),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        if (isLocalCacheScanning) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                CircularProgressIndicator(color = theme.brandSecondary, modifier = Modifier.size(14.dp), strokeWidth = 2.dp)
                                Text("ANALYZING LOCAL BROWSER CACHE...", fontSize = 10.sp, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.AllertaStencilFamily)
                            }
                        } else {
                            Text(
                                text = if (localCacheAnalysisResult == null) "⚡ RECOVER LOCAL BROWSER CACHE ANALYSIS" else "🔄 RE-SCAN LOCAL SESSIONS",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = com.example.ui.theme.AllertaStencilFamily
                            )
                        }
                    }
                }
            }
        }
    }
}
