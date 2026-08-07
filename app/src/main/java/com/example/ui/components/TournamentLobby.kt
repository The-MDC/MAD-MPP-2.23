package com.example.ui.components

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.BorderStroke
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
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.SatiricalCard
import com.example.model.SagaProgressEntity
import com.example.ui.theme.*
import com.example.viewmodel.GambitViewModel

@Composable
fun TournamentLobby(vm: GambitViewModel, modifier: Modifier = Modifier) {
    val state by vm.state.collectAsState()
    val theme = LocalGambitTheme.current
    
    // We can simulate dates and list of PVP / Saga matches.
    val activePvpBattles = listOf(
        PvpBattle("MAD CLASH PVP #804", "The Politicos vs Chaos Lords", "💥 LIVE BATTLE", "10,240 \$MADx", true),
        PvpBattle("SHIELD INTEGRITY SHOWDOWN", "Security Nodes vs Sybil Botnets", "🛡️ SYSTEM PROGRESS", "2,500 \$MADx", false),
        PvpBattle("SEC JUDICIAL BATTLE ROYAL", "Members vs Wall Street Memes", "🏛️ SAGAS TOURNAMENT", "25,000 \$MADx", true)
    )

    // Card Cull Tournaments (one week out)
    val cardCullMatches = listOf(
        CardCullMatch("CULL ROUND #1: LIAR ENGINE SELECTION", "Last Friday Matchup: Alpha Squad vs Zeta Node", "📅 JUNE 13, 2026 - 18:00 UTC", "ELIMINATION"),
        CardCullMatch("CULL ROUND #2: THE GREAT BURN PROGRESS", "Last Friday Matchup: Mythic Burners Clan Match", "📅 JUNE 13, 2026 - 21:00 UTC", "SUDDEN DEATH"),
        CardCullMatch("CULL ROUND #3: ASCENSION SACRIFICE", "Last Friday Matchup: Finalist Ascended Deck Clash", "📅 JUNE 14, 2026 - 02:00 UTC", "REWARD MULTIPLIER")
    )

    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Brush.verticalGradient(listOf(theme.bgCard, theme.bgCard.copy(alpha = 0.9f))))
            .border(1.dp, theme.borderBrush, RoundedCornerShape(16.dp))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        
        // 1. HEADER & TOURNAMENT COUNTDOWN STATUS
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "🏆 MADHAT'S TOURNAMENT LOBBY",
                    color = theme.brandSecondary,
                    fontFamily = com.example.ui.theme.AllertaStencilFamily,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 1.sp
                )
                Text(
                    text = "Active PVP Arenas, Sagas, & Monthly Cull Elimination Tournaments",
                    color = theme.textSecondary,
                    fontSize = 10.sp,
                    lineHeight = 14.sp
                )
            }
            
            Box(
                modifier = Modifier
                    .background(theme.brandAccent.copy(alpha = 0.15f), RoundedCornerShape(6.dp))
                    .border(1.dp, theme.brandAccent.copy(alpha = 0.4f), RoundedCornerShape(6.dp))
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            ) {
                Text(
                    text = "PVP TIER: ELITE",
                    color = theme.brandAccent,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
            }
        }

        HorizontalDivider(color = theme.textSecondary.copy(alpha = 0.2f), thickness = 1.dp)

        // 2. REGISTER BUTTON FOR MONTHLY TOURNAMENT
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .shadow(12.dp, RoundedCornerShape(12.dp), spotColor = theme.brandPrimary.copy(alpha = 0.2f))
                .background(Brush.linearGradient(listOf(Color(0xFF0F0B1E), theme.bgCard.copy(alpha = 0.8f))), RoundedCornerShape(12.dp))
                .border(
                    BorderStroke(1.5.dp, Brush.linearGradient(listOf(Color(0xFF00E5FF), Color(0xFFFF007F), Color(0xFF9D00FF)))),
                    RoundedCornerShape(12.dp)
                )
                .padding(16.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.EmojiEvents,
                            contentDescription = "Tournament Cup",
                            tint = Color(0xFFFFD700),
                            modifier = Modifier.size(24.dp)
                        )
                        Column {
                            Text(
                                text = "MONTHLY 'CARD CULL' ARENA",
                                color = BrandEggwhite,
                                fontFamily = com.example.ui.theme.AllertaStencilFamily,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Next Cull Tournament: Last Friday of this month",
                                color = Color.Gray,
                                fontSize = 9.5.sp
                            )
                        }
                    }
                    
                    if (state.isTournamentQueueActive) {
                        Box(
                            modifier = Modifier
                                .background(Color(0x2200FF41), RoundedCornerShape(4.dp))
                                .border(1.dp, Color(0xFF00FF41), RoundedCornerShape(4.dp))
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                        ) {
                            Text(
                                text = "✓ REGISTERED",
                                color = Color(0xFF00FF41),
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Black,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    } else {
                        Box(
                            modifier = Modifier
                                .background(theme.brandAccent.copy(alpha = 0.1f), RoundedCornerShape(4.dp))
                                .border(1.dp, theme.brandAccent.copy(alpha = 0.3f), RoundedCornerShape(4.dp))
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                        ) {
                            Text(
                                text = "REGISTRATION OPEN",
                                color = theme.brandAccent,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Black,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }
                }

                Text(
                    text = "High-stakes elimination. The lowest 15% deteriorating cards globally are culled and permanently burned. Protect your deck in time!",
                    color = Color.LightGray,
                    fontSize = 10.sp,
                    lineHeight = 14.sp
                )

                Button(
                    onClick = { if (!state.isTournamentQueueActive) vm.registerForTournament() },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(42.dp)
                        .testTag("tournament_register_button"),
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (state.isTournamentQueueActive) Color(0x3300FF41) else theme.brandPrimary,
                        disabledContainerColor = Color.DarkGray
                    ),
                    border = BorderStroke(1.dp, if (state.isTournamentQueueActive) Color(0xFF00FF41) else theme.brandSecondary),
                    enabled = !state.isTournamentQueueActive
                ) {
                    Text(
                        text = if (state.isTournamentQueueActive) "✓ YOU ARE QUEUED FOR THE BRACKETS" else "REGISTER NOW & SECURE MY DECK",
                        color = Color.White,
                        fontFamily = com.example.ui.theme.AllertaStencilFamily,
                        fontSize = 11.5.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 0.5.sp
                    )
                }
            }
        }

        // 3. PVP ARENAS & SAGAS (Active list)
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Icon(Icons.Default.Gamepad, "Gamepad", tint = theme.brandSecondary, modifier = Modifier.size(16.dp))
                Text(
                    text = "ACTIVE PVP LOBBIES & SAGA MISSIONS",
                    color = theme.brandSecondary,
                    fontFamily = com.example.ui.theme.AllertaStencilFamily,
                    fontSize = 11.5.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                activePvpBattles.forEach { battle ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color.Black.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                            .border(0.5.dp, theme.borderBrush, RoundedCornerShape(8.dp))
                            .padding(10.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(6.dp)
                                        .background(if (battle.isLive) theme.brandAccent else Color.Gray, CircleShape)
                                )
                                Text(
                                    text = battle.title,
                                    color = Color.White,
                                    fontFamily = com.example.ui.theme.AllertaStencilFamily,
                                    fontSize = 10.5.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            Text(
                                text = battle.description,
                                color = Color.Gray,
                                fontSize = 9.sp,
                                modifier = Modifier.padding(top = 2.dp)
                            )
                        }
                        
                        Column(horizontalAlignment = Alignment.End) {
                            Text(
                                text = battle.stakes,
                                color = theme.brandAccent,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace
                            )
                            Text(
                                text = battle.type,
                                color = Color.LightGray,
                                fontSize = 8.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }

        // 4. UPCOMING 'CARD CULL' SCHEDULE (exactly 1 week out)
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Icon(Icons.Default.Schedule, "Schedule", tint = theme.brandAccent, modifier = Modifier.size(16.dp))
                Text(
                    text = "UPCOMING CULL ELIMINATIONS (1 WEEK OUT)",
                    color = theme.brandAccent,
                    fontFamily = com.example.ui.theme.AllertaStencilFamily,
                    fontSize = 11.5.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                cardCullMatches.forEach { match ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color.Black.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                            .border(1.dp, theme.brandAccent.copy(alpha = 0.2f), RoundedCornerShape(8.dp))
                            .padding(10.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = match.title,
                                color = Color.White,
                                fontFamily = com.example.ui.theme.AllertaStencilFamily,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = match.matchup,
                                color = Color.LightGray,
                                fontSize = 9.sp,
                                modifier = Modifier.padding(top = 2.dp)
                            )
                            Text(
                                text = match.date,
                                color = Color.Gray,
                                fontSize = 8.5.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(top = 1.dp)
                            )
                        }
                        
                        Box(
                            modifier = Modifier
                                .background(theme.brandAccent.copy(alpha = 0.15f), RoundedCornerShape(4.dp))
                                .border(0.5.dp, theme.brandAccent, RoundedCornerShape(4.dp))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = match.type,
                                color = theme.brandAccent,
                                fontSize = 7.5.sp,
                                fontWeight = FontWeight.Black,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }
                }
            }
        }

        // 5. VIEW ACTIVE NFT DECK
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Icon(Icons.Default.Style, "Style", tint = theme.brandSecondary, modifier = Modifier.size(16.dp))
                Text(
                    text = "YOUR ACTIVE TOURNAMENT DECK",
                    color = theme.brandSecondary,
                    fontFamily = com.example.ui.theme.AllertaStencilFamily,
                    fontSize = 11.5.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            val ownedCards = state.ownedCards
            if (ownedCards.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color.Black.copy(alpha = 0.2f), RoundedCornerShape(8.dp))
                        .padding(16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "No cards seeded yet. Visit 'NFT GALLERY' to roll power cards!",
                        color = Color.Gray,
                        fontSize = 10.sp,
                        textAlign = TextAlign.Center
                    )
                }
            } else {
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    items(ownedCards) { card ->
                        Box(
                            modifier = Modifier
                                .width(130.dp)
                                .background(Color.Black.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                                .border(1.dp, Color(card.rarity.color).copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                                .padding(8.dp)
                        ) {
                            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text(
                                    text = card.name,
                                    color = Color.White,
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Black,
                                    fontFamily = FontFamily.Monospace,
                                    maxLines = 1
                                )
                                HorizontalDivider(color = Color.DarkGray, thickness = 0.5.dp)
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(
                                        text = card.rarity.name.take(4),
                                        color = Color(card.rarity.color),
                                        fontSize = 7.5.sp,
                                        fontWeight = FontWeight.Bold,
                                        fontFamily = FontFamily.Monospace
                                    )
                                    Text(
                                        text = "⚡${card.powerLevel}",
                                        color = Color.LightGray,
                                        fontSize = 7.5.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                                
                                LinearProgressIndicator(
                                    progress = { card.durability.toFloat() },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(3.dp)
                                        .clip(RoundedCornerShape(1.5.dp)),
                                    color = if (card.durability > 0.5) NeonGreen else if (card.durability > 0.2) BrandGold else BrandCrimson,
                                    trackColor = Color.DarkGray
                                )
                                Text(
                                    text = "DUR: ${(card.durability * 100).toInt()}%",
                                    color = Color.Gray,
                                    fontSize = 7.sp,
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

data class PvpBattle(
    val title: String,
    val description: String,
    val type: String,
    val stakes: String,
    val isLive: Boolean
)

data class CardCullMatch(
    val title: String,
    val matchup: String,
    val date: String,
    val type: String
)
