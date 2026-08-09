package com.example.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import kotlinx.serialization.json.*
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.Image
import androidx.compose.ui.layout.ContentScale
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.*
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.LocalGambitTheme
import com.example.viewmodel.GambitViewModel
import com.example.ui.components.glassContainerBackground

@Composable
fun AiChatScreen(vm: GambitViewModel) {
    val theme = LocalGambitTheme.current
    val context = LocalContext.current
    val state by vm.state.collectAsState()
    var inputText by remember { mutableStateOf("") }
    
    com.example.ui.components.TrackComponentPerformance(componentName = "AiChatScreen")
    
    Box(
        Modifier
            .fillMaxSize()
            .background(Color(0xE608080E)) // Semi-translucent dark slate
            .glassContainerBackground(theme.brandSecondary, RoundedCornerShape(0.dp))
    ) {
        Column(Modifier.fillMaxSize()) {
            // Header
            Row(
                Modifier
                    .fillMaxWidth()
                    .background(Color.Black.copy(alpha = 0.4f))
                    .padding(24.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = { vm.toggleAiChat() }) {
                    Icon(Icons.Filled.KeyboardArrowDown, contentDescription = "Close", tint = theme.brandSecondary)
                }
                Spacer(Modifier.width(8.dp))
                Box(
                    Modifier
                        .size(48.dp)
                        .background(Color.Black, RoundedCornerShape(8.dp))
                        .border(1.dp, theme.brandSecondary, RoundedCornerShape(8.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Image(
                        painter = androidx.compose.ui.res.painterResource(id = com.example.R.drawable.mad_logo),
                        contentDescription = "Chat Logo",
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Fit
                    )
                }
                Spacer(Modifier.width(10.dp))
                Column {
                    Text("The MADHAT'r Concierge", color = theme.textPrimary, fontSize = 18.sp, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                    Text("Powered by Google Gemini 3.1 Pro", color = theme.brandSecondary, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                }
            }
            HorizontalDivider(color = theme.brandSecondary.copy(alpha = 0.15f), thickness = 1.dp)
            
            // Channels if Troll Box is unlocked
            if (state.isTrollBoxUnlocked) {
                androidx.compose.foundation.lazy.LazyRow(
                    modifier = Modifier.fillMaxWidth().background(Color.Black.copy(alpha = 0.2f)).padding(horizontal = 16.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    val channels = listOf("MADHATR" to "MADHAT'r", "GLOBAL" to "Global Lobby", "CONVICTIONS" to "Convictions", "PREDICTIONS" to "Predictions", "LIAR_METER" to "Liar Meter", "HELP_SUPPORT" to "Help")
                    items(channels.size) { index ->
                        val (id, label) = channels[index]
                        val isSelected = state.activeChatChannel == id
                        androidx.compose.material3.FilterChip(
                            selected = isSelected,
                            onClick = { vm.setChatChannel(id) },
                            label = { Text(label, fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                            colors = androidx.compose.material3.FilterChipDefaults.filterChipColors(
                                selectedContainerColor = theme.brandSecondary.copy(alpha=0.3f),
                                selectedLabelColor = theme.brandSecondary,
                                labelColor = theme.textSecondary
                            ),
                            border = androidx.compose.material3.FilterChipDefaults.filterChipBorder(enabled = true, selected = isSelected, borderColor = theme.brandSecondary, borderWidth = 1.dp)
                        )
                    }
                }
                HorizontalDivider(color = theme.brandSecondary.copy(alpha = 0.15f), thickness = 1.dp)
            }
            
            if (state.isCopyTradingUnlocked) {
                Row(
                    modifier = Modifier.fillMaxWidth().background(theme.bgCard).padding(horizontal = 16.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Auto-Copy Top Whale (Free Tier)", color = theme.textPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        Text("Follows node with highest win rate. Upgrade for multi-whale AI agents.", color = theme.brandSecondary, fontSize = 10.sp)
                    }
                    Switch(
                        checked = state.isAutoCopyTradingEnabled,
                        onCheckedChange = { vm.toggleAutoCopyTrading() },
                        colors = SwitchDefaults.colors(checkedThumbColor = theme.brandPrimary, checkedTrackColor = theme.brandSecondary.copy(alpha=0.5f))
                    )
                }
                HorizontalDivider(color = theme.brandSecondary.copy(alpha = 0.15f), thickness = 1.dp)
            }

            val currentMessages = state.channelMessages[state.activeChatChannel] ?: emptyList()

            // Active chat
            LazyColumn(
                modifier = Modifier.weight(1f),
                contentPadding = PaddingValues(16.dp),
                reverseLayout = false
            ) {
                item {
                    Text(if (state.activeChatChannel == "MADHATR") "LIVE HUD PLUG-IN" else "${state.activeChatChannel} - P2P NETWORK", color = theme.brandPrimary, fontSize = 12.sp, fontWeight = FontWeight.Black, fontFamily = com.example.ui.theme.AllertaStencilFamily)
                    Spacer(Modifier.height(16.dp))
                    
                    if (currentMessages.isEmpty()) {
                        if (state.activeChatChannel == "MADHATR") {
                            ChatMessage(isUser = false, "MADHAT'r", "Ayyy! Welcome to the MAD Gambit, buddy! The name's MADHAT'r. What's crack'n? I got analytics, I got predictions, and I got enough sarcasm to sink a battle-cruiser. What do ya need?")
                        } else {
                            ChatMessage(isUser = false, "System", "Welcome to ${state.activeChatChannel}. Play nice.")
                        }
                    }
                }
                
                items(currentMessages.size) { index ->
                    val msg = currentMessages[index]
                    ChatMessage(isUser = msg.isUser, sender = msg.sender, text = msg.text)
                }
                
                if (state.isAiChatTyping && state.activeChatChannel == "MADHATR") {
                    item {
                        ChatMessage(isUser = false, "MADHAT'r", "Typin' away, hold your horses...")
                    }
                }
            }
            
            // Bottom bar
            Row(
                Modifier
                    .fillMaxWidth()
                    .background(Color.Black.copy(alpha = 0.5f))
                    .border(theme.borderWidth, theme.borderBrush, RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp))
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = {
                    val intent = Intent(Intent.ACTION_SENDTO).apply {
                        data = Uri.parse("mailto:theTeam@MADGambit.fun")
                        putExtra(Intent.EXTRA_SUBJECT, "Support Request - LLM Hub")
                    }
                    context.startActivity(intent)
                }) {
                    Icon(Icons.Filled.Email, contentDescription = "Email Support", tint = theme.brandSecondary)
                }
                
                Spacer(Modifier.width(8.dp))
                
                TextField(
                    value = inputText,
                    onValueChange = { inputText = it },
                    modifier = Modifier.weight(1f),
                    placeholder = { 
                        Text(
                            if (state.activeChatChannel == "MADHATR") "Ask the MADHAT'r..." else "Send message to ${state.activeChatChannel}...", 
                            color = theme.textSecondary, 
                            fontSize = 14.sp
                        ) 
                    },
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = theme.bgDeep,
                        unfocusedContainerColor = theme.bgDeep,
                        focusedTextColor = theme.textPrimary,
                        unfocusedTextColor = theme.textPrimary,
                        focusedIndicatorColor = Color.Transparent,
                        unfocusedIndicatorColor = Color.Transparent
                    ),
                    shape = RoundedCornerShape(24.dp)
                )
                
                Spacer(Modifier.width(8.dp))
                
                IconButton(onClick = { 
                    if (inputText.isNotBlank() && (!state.isAiChatTyping || state.activeChatChannel != "MADHATR")) {
                        vm.sendMessageToAi(inputText)
                        inputText = ""
                    }
                }) {
                    Icon(
                        Icons.AutoMirrored.Filled.Send, 
                        contentDescription = "Send", 
                        tint = if (inputText.isNotBlank() && (!state.isAiChatTyping || state.activeChatChannel != "MADHATR")) theme.brandPrimary else theme.textSecondary
                    )
                }
            }
        }
    }
}

@Composable
fun IntegrationBadge(name: String, color: Color) {
    val theme = LocalGambitTheme.current
    Row(
        Modifier
            .border(1.dp, color.copy(alpha=0.5f), RoundedCornerShape(8.dp))
            .background(color.copy(alpha=0.1f), RoundedCornerShape(8.dp))
            .padding(horizontal = 12.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(Modifier.size(8.dp).background(color, androidx.compose.foundation.shape.CircleShape))
        Spacer(Modifier.width(6.dp))
        Text(name, color = theme.textPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun ChatMessage(isUser: Boolean, sender: String, text: String) {
    val theme = LocalGambitTheme.current
    
    // Parse out telemetry blocks
    var cleanText = text
    var agentATelemetry: String? = null
    var agentBTelemetry: String? = null
    var agentCTelemetry: String? = null

    if (text.contains("[AGENT_A:")) {
        val parts = text.split("[AGENT_A:")
        cleanText = parts[0].trim()
        if (parts.size > 1) {
            agentATelemetry = parts[1].substringBefore("]").trim()
        }
    } else if (text.contains("[AGENT_B:")) {
        val parts = text.split("[AGENT_B:")
        cleanText = parts[0].trim()
        if (parts.size > 1) {
            agentBTelemetry = parts[1].substringBefore("]").trim()
        }
    } else if (text.contains("[AGENT_C:")) {
        val parts = text.split("[AGENT_C:")
        cleanText = parts[0].trim()
        if (parts.size > 1) {
            agentCTelemetry = parts[1].substringBefore("]").trim()
        }
    }

    Row(
        Modifier
            .fillMaxWidth()
            .padding(bottom = 12.dp),
        horizontalArrangement = if (isUser) Arrangement.End else Arrangement.Start,
        verticalAlignment = Alignment.Top
    ) {
        if (!isUser) {
            Box(
                Modifier
                    .size(36.dp)
                    .background(Color.Black, RoundedCornerShape(6.dp))
                    .border(1.dp, theme.brandPrimary.copy(alpha = 0.5f), RoundedCornerShape(6.dp)),
                contentAlignment = Alignment.Center
            ) {
                Image(
                    painter = androidx.compose.ui.res.painterResource(id = com.example.R.drawable.mad_logo),
                    contentDescription = "System Avatar",
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Fit
                )
            }
            Spacer(Modifier.width(8.dp))
        }

        Column(
            modifier = Modifier.weight(1f, fill = false),
            horizontalAlignment = if (isUser) Alignment.End else Alignment.Start
        ) {
            Text(sender, color = if (isUser) theme.brandSecondary else theme.brandPrimary, fontSize = 10.5.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(4.dp))
            
            // Standard Chat Bubble
            Box(
                Modifier
                    .widthIn(max = 280.dp)
                    .background(if (isUser) theme.brandSecondary.copy(alpha=0.15f) else theme.bgCard, RoundedCornerShape(12.dp))
                    .border(1.dp, if (isUser) theme.brandSecondary.copy(alpha=0.4f) else theme.brandSecondary.copy(alpha=0.15f), RoundedCornerShape(12.dp))
                    .padding(12.dp)
            ) {
                Text(cleanText, color = theme.textPrimary, fontSize = 14.sp)
            }

            // Custom Telemetry Display Cards if available
            val cyberPink = Color(0xFFEC4899)
            val neonCyan = Color(0xFF22D3EE)
            val telemetryColor = if (theme.isPopArt) cyberPink else neonCyan

            if (agentATelemetry != null) {
                Spacer(Modifier.height(8.dp))
                Box(
                    modifier = Modifier
                        .widthIn(max = 280.dp)
                        .background(Color.Black.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                        .border(1.dp, theme.brandSecondary.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                        .padding(12.dp)
                ) {
                    Column {
                        Text(
                            text = "👁️ THE SENTINEL TELEMETRY",
                            color = theme.brandPrimary,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace
                        )
                        Spacer(Modifier.height(8.dp))
                        
                        val json = try {
                            Json.parseToJsonElement(agentATelemetry).jsonObject
                        } catch (e: Exception) { null }

                        if (json != null) {
                            val claim = json["claim_evaluated"]?.jsonPrimitive?.content ?: ""
                            val bs = json["bs_index_percentage"]?.jsonPrimitive?.intOrNull ?: 0
                            val disc = json["source_discrepancy"]?.jsonPrimitive?.content ?: ""
                            val headline = json["satirical_headline"]?.jsonPrimitive?.content ?: ""

                            Text("CLAIM: \"$claim\"", color = theme.textSecondary, fontSize = 12.sp)
                            Spacer(Modifier.height(4.dp))
                            
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text("STATUS BADGE: ", color = theme.textSecondary, fontSize = 11.sp)
                                Text(
                                    text = "BS_INDEX_PERCENTAGE = $bs%",
                                    color = telemetryColor,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace
                                )
                            }
                            Spacer(Modifier.height(6.dp))
                            Text("DISCREPANCY:", color = theme.brandSecondary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            Text(disc, color = theme.textPrimary, fontSize = 12.sp)
                            
                            if (headline.isNotEmpty()) {
                                Spacer(Modifier.height(6.dp))
                                Text("SATIRICAL HEADLINE:", color = theme.brandPrimary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                Text("\"$headline\"", color = theme.textPrimary, fontSize = 12.sp, fontWeight = FontWeight.Medium, fontStyle = androidx.compose.ui.text.font.FontStyle.Italic)
                            }
                        } else {
                            Text("Raw output: $agentATelemetry", color = theme.textPrimary, fontSize = 12.sp)
                        }
                    }
                }
            }

            if (agentBTelemetry != null) {
                Spacer(Modifier.height(8.dp))
                Box(
                    modifier = Modifier
                        .widthIn(max = 280.dp)
                        .background(Color.Black.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                        .border(1.dp, theme.brandSecondary.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                        .padding(12.dp)
                ) {
                    Column {
                        Text(
                            text = "🎲 THE STRATEGIST TELEMETRY",
                            color = theme.brandPrimary,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace
                        )
                        Spacer(Modifier.height(8.dp))
                        
                        val json = try {
                            Json.parseToJsonElement(agentBTelemetry).jsonObject
                        } catch (e: Exception) { null }

                        if (json != null) {
                            val strategy = json["strategy_suggested"]?.jsonPrimitive?.content ?: ""
                            val kelly = json["kelly_criterion_limit_percentage"]?.jsonPrimitive?.intOrNull ?: 0
                            val quad = json["quadratic_allocation_multiplier"]?.jsonPrimitive?.doubleOrNull ?: 1.0
                            val leverage = json["perpetual_leverage_threshold"]?.jsonPrimitive?.content ?: ""

                            Text(strategy, color = theme.textPrimary, fontSize = 13.sp)
                            Spacer(Modifier.height(6.dp))
                            
                            Text(
                                text = "KELLY_CRITERION_LIMIT_PERCENTAGE = $kelly%",
                                color = telemetryColor,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace
                            )
                            Spacer(Modifier.height(4.dp))
                            Text(
                                text = "QUADRATIC_ALLOCATION_MULTIPLIER = ${quad}X",
                                color = telemetryColor,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace
                            )
                            Spacer(Modifier.height(4.dp))
                            Text(
                                text = "PERPETUAL_LEVERAGE_THRESHOLD = ${leverage.uppercase()}",
                                color = telemetryColor,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace
                            )
                        } else {
                            Text("Raw output: $agentBTelemetry", color = theme.textPrimary, fontSize = 12.sp)
                        }
                    }
                }
            }

            if (agentCTelemetry != null) {
                Spacer(Modifier.height(8.dp))
                Box(
                    modifier = Modifier
                        .widthIn(max = 280.dp)
                        .background(Color.Black.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                        .border(1.dp, theme.brandSecondary.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                        .padding(12.dp)
                ) {
                    Column {
                        Text(
                            text = "📈 THE DECAY ENGINE TELEMETRY",
                            color = theme.brandPrimary,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace
                        )
                        Spacer(Modifier.height(8.dp))
                        
                        val json = try {
                            Json.parseToJsonElement(agentCTelemetry).jsonObject
                        } catch (e: Exception) { null }

                        if (json != null) {
                            val decayModel = json["decay_model"]?.jsonPrimitive?.content ?: ""
                            val mult = json["multiplier_decayed"]?.jsonPrimitive?.doubleOrNull ?: 1.0
                            val epoch = json["epoch_interval"]?.jsonPrimitive?.content ?: ""
                            val dopamine = json["dopamine_satisfaction_threshold"]?.jsonPrimitive?.content ?: ""

                            Text("MODEL: $decayModel", color = theme.textSecondary, fontSize = 12.sp)
                            Spacer(Modifier.height(6.dp))
                            
                            Text(
                                text = "MULTIPLIER_DECAYED = ${mult}X",
                                color = telemetryColor,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace
                            )
                            Spacer(Modifier.height(4.dp))
                            Text(
                                text = "EPOCH_INTERVAL = ${epoch.uppercase()}",
                                color = telemetryColor,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace
                            )
                            Spacer(Modifier.height(4.dp))
                            Text(
                                text = "DOPAMINE_SATISFACTION_THRESHOLD = ${dopamine.uppercase()}",
                                color = telemetryColor,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace
                            )
                        } else {
                            Text("Raw output: $agentCTelemetry", color = theme.textPrimary, fontSize = 12.sp)
                        }
                    }
                }
            }
        }

        if (isUser) {
            Spacer(Modifier.width(8.dp))
            Box(
                Modifier
                    .size(32.dp)
                    .background(theme.brandSecondary.copy(alpha = 0.1f), CircleShape)
                    .border(1.dp, theme.brandSecondary.copy(alpha = 0.4f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text("👤", fontSize = 14.sp)
            }
        }
    }
}

