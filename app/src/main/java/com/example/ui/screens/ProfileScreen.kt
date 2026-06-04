package com.example.ui.screens

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
import com.example.ui.theme.LocalGambitTheme

enum class ProfileTier(val title: String, val profitShare: String, val color: Color) {
    USER("Standard User", "0% Profit Share", Color(0xFFAAAAAA)),
    CREATOR("Creator Tier", "40% Profit Share", Color(0xFF00E5FF)),
    VIP("KOL / VIP", "60% Profit Share", Color(0xFFFFCC00))
}

@Composable
fun ProfileScreen(vm: GambitViewModel) {
    val theme = LocalGambitTheme.current
    var selectedTier by remember { mutableStateOf(ProfileTier.VIP) }
    var selectedTab by remember { mutableStateOf("OVERVIEW") }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(theme.bgDeep)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
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
                val tabs = listOf("OVERVIEW", "NFT GALLERY", "WALL", "PORTFOLIO")
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
                            fontSize = 11.sp
                        )
                    }
                }
            }
        }

        when (selectedTab) {
            "OVERVIEW" -> item { MarketPerformanceOverview(selectedTier) }
            "NFT GALLERY" -> item { NftGalleryView() }
            "WALL" -> item { WallPostsView() }
            "PORTFOLIO" -> item { PortfolioTrackerView(selectedTier) }
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
fun MarketPerformanceOverview(tier: ProfileTier) {
    val theme = LocalGambitTheme.current
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
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
fun NftGalleryView() {
    val theme = LocalGambitTheme.current
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text("DIGITAL ASSETS & RWA GALLERY", color = theme.brandPrimary, fontSize = 16.sp, fontWeight = FontWeight.Black)
        Text("Cross-chain digital assets, tokenized real-world assets (RWA), and NFTs.", color = theme.textSecondary, fontSize = 12.sp)

        val assets = listOf(
            Triple("MAD GAMBIT Legendary", "ERC-721 • Arbitrum", theme.brandAccent),
            Triple("Rolex Submariner (Tokenized)", "RWA • Polygon", Color(0xFFC0C0C0)),
            Triple("Miami Condo Share", "Real Estate • Solana", theme.brandSecondary),
            Triple("Bored Ape #420", "NFT • Ethereum", theme.brandPrimary)
        )

        assets.chunked(2).forEach { rowAssets ->
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp), modifier = Modifier.fillMaxWidth()) {
                rowAssets.forEach { asset ->
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .aspectRatio(0.8f)
                            .clip(RoundedCornerShape(12.dp))
                            .background(theme.bgCard)
                            .border(1.dp, asset.third.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
                            .padding(8.dp)
                    ) {
                        Column(modifier = Modifier.fillMaxSize()) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .weight(1f)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(asset.third.copy(alpha = 0.1f))
                                    .border(1.dp, asset.third.copy(alpha = 0.2f), RoundedCornerShape(8.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Filled.Diamond, contentDescription = null, tint = asset.third, modifier = Modifier.size(40.dp))
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(asset.first, color = theme.textPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold, maxLines = 1)
                            Text(asset.second, color = theme.textSecondary, fontSize = 10.5.sp, maxLines = 1)
                        }
                    }
                }
                // Handle odd number of items
                if (rowAssets.size == 1) {
                    Spacer(modifier = Modifier.weight(1f))
                }
            }
        }
    }
}

@Composable
fun WallPostsView() {
    val theme = LocalGambitTheme.current
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text("CREATOR WALL", color = theme.brandAccent, fontSize = 16.sp, fontWeight = FontWeight.Black)
        
        // Post Input
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(8.dp))
                .background(theme.bgCard)
                .border(theme.borderWidth, theme.borderBrush, RoundedCornerShape(8.dp))
                .padding(16.dp)
        ) {
            Column {
                Text("Have a high conviction take?", color = theme.textSecondary, fontSize = 14.sp)
                Spacer(modifier = Modifier.height(8.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                    Button(
                        onClick = { },
                        colors = ButtonDefaults.buttonColors(containerColor = theme.brandAccent)
                    ) {
                        Text("Post Alpha", color = Color.White, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // Dummy Posts
        val posts = listOf(
            "Just deployed a new Yes/No market on the upcoming Fed rate hike. 40% creator pool is live! \uD83D\uDD25",
            "Added a tokenized Patek to the gallery. RWA is the future of the Gambit ecosystem.",
            "Who else lost their streak today? 😭 Thank god for the MAD shield saving 28.8% of the stash."
        )

        posts.forEach { post ->
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(theme.bgCard)
                    .padding(16.dp)
            ) {
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Filled.AccountCircle, contentDescription = null, tint = theme.brandPrimary, modifier = Modifier.size(24.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("@DiamondDegen", color = theme.brandPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.weight(1f))
                        Text("2h ago", color = theme.textSecondary, fontSize = 10.5.sp)
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(post, color = theme.textPrimary, fontSize = 14.sp)
                }
            }
        }
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
                Text("CURRENT PREDICTION PLAYS", color = theme.brandPrimary, fontSize = 18.sp, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.AllertaStencilFamily)
                
                // Demo item 1
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Column {
                        Text("ETH to \$4K by EOM", color = theme.textPrimary, fontSize = 14.sp)
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
