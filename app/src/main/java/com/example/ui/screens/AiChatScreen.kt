package com.example.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
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
            
            // Active chat
            LazyColumn(
                modifier = Modifier.weight(1f),
                contentPadding = PaddingValues(16.dp),
                reverseLayout = false
            ) {
                item {
                    Text("LIVE HUD PLUG-IN", color = theme.brandPrimary, fontSize = 12.sp, fontWeight = FontWeight.Black, fontFamily = com.example.ui.theme.AllertaStencilFamily)
                    Spacer(Modifier.height(16.dp))
                    
                    if (state.aiChatMessages.isEmpty()) {
                        ChatMessage(isUser = false, "MADHAT'r", "Ayyy! Welcome to the MAD Gambit, buddy! The name's MADHAT'r. What's crack'n? I got analytics, I got predictions, and I got enough sarcasm to sink a battle-cruiser. What do ya need?")
                    }
                }
                
                items(state.aiChatMessages.size) { index ->
                    val msg = state.aiChatMessages[index]
                    ChatMessage(isUser = msg.isUser, sender = msg.sender, text = msg.text)
                }
                
                if (state.isAiChatTyping) {
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
                    placeholder = { Text("Ask the MADHAT'r...", color = theme.textSecondary, fontSize = 14.sp) },
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
                    if (inputText.isNotBlank() && !state.isAiChatTyping) {
                        vm.sendMessageToAi(inputText)
                        inputText = ""
                    }
                }) {
                    Icon(Icons.AutoMirrored.Filled.Send, contentDescription = "Send", tint = if (inputText.isNotBlank() && !state.isAiChatTyping) theme.brandPrimary else theme.textSecondary)
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
            horizontalAlignment = if (isUser) Alignment.End else Alignment.Start
        ) {
            Text(sender, color = if (isUser) theme.brandSecondary else theme.brandPrimary, fontSize = 10.5.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(4.dp))
            Box(
                Modifier
                    .widthIn(max = 260.dp)
                    .background(if (isUser) theme.brandSecondary.copy(alpha=0.2f) else theme.bgCard, RoundedCornerShape(12.dp))
                    .border(1.dp, if (isUser) theme.brandSecondary.copy(alpha=0.5f) else theme.bgCard, RoundedCornerShape(12.dp))
                    .padding(12.dp)
            ) {
                Text(text, color = theme.textPrimary, fontSize = 14.sp)
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
