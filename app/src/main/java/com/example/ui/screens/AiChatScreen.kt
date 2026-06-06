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
                    .padding(16.dp),
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
                    Text("LLM Support Hub", color = theme.textPrimary, fontSize = 18.sp, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                    Text("Powered by Google Gemini 3.1 Pro", color = theme.brandSecondary, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                }
            }
            HorizontalDivider(color = theme.brandSecondary.copy(alpha = 0.15f), thickness = 1.dp)
            
            // Connected Integrations
            LazyColumn(
                modifier = Modifier.weight(1f),
                contentPadding = PaddingValues(16.dp)
            ) {
                item {
                    Text("CONNECTED NETWORKS", color = theme.brandAccent, fontSize = 12.sp, fontWeight = FontWeight.Black, fontFamily = com.example.ui.theme.AllertaStencilFamily)
                    Spacer(Modifier.height(8.dp))
                    
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        IntegrationBadge("WhatsApp", Color(0xFF25D366))
                        IntegrationBadge("Telegram", Color(0xFF0088cc))
                        IntegrationBadge("Discord", Color(0xFF5865F2))
                    }
                    Spacer(Modifier.height(8.dp))
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        IntegrationBadge("Meta", Color(0xFF0668E1))
                        IntegrationBadge("Twitter (X)", Color.White)
                    }
                    Spacer(Modifier.height(16.dp))
                }
                
                // Settings
                item {
                    var autoReply by remember { mutableStateOf(true) }
                    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                        Column {
                            Text("Auto Responses (Gemini)", color = theme.textPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                            Text("Agent will handle DMs automatically", color = theme.textSecondary, fontSize = 12.sp)
                        }
                        Switch(checked = autoReply, onCheckedChange = { autoReply = it }, colors = SwitchDefaults.colors(checkedThumbColor = theme.brandPrimary, checkedTrackColor = theme.brandSecondary.copy(alpha=0.5f)))
                    }
                    Spacer(Modifier.height(24.dp))
                }
                
                // Active chat
                item {
                    Text("LIVE FEED", color = theme.brandPrimary, fontSize = 12.sp, fontWeight = FontWeight.Black, fontFamily = com.example.ui.theme.AllertaStencilFamily)
                    Spacer(Modifier.height(16.dp))
                    
                    ChatMessage(isUser = false, "System", "Gemini initialized. Cross-platform sync active across 5 networks.")
                    ChatMessage(isUser = true, "You", "Enable active file upload and parsing?")
                    ChatMessage(isUser = false, "Gemini", "File upload is available for PDFs, Images, and CSVs. Live document QA is functional.")
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
                // Email Support
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
                
                Box(
                    Modifier
                        .weight(1f)
                        .background(theme.bgDeep, RoundedCornerShape(24.dp))
                        .border(theme.borderWidth, theme.textSecondary.copy(alpha=0.3f), RoundedCornerShape(24.dp))
                        .padding(horizontal = 16.dp, vertical = 12.dp)
                ) {
                    Text(if (inputText.isEmpty()) "Ask Gemini or type..." else inputText, color = if (inputText.isEmpty()) theme.textSecondary else theme.textPrimary, fontSize = 14.sp)
                }
                
                Spacer(Modifier.width(8.dp))
                
                IconButton(onClick = { /* File upload not active currently */ }) {
                    Icon(Icons.Filled.AttachFile, contentDescription = "Upload", tint = theme.textSecondary)
                }
                
                IconButton(onClick = { /* Send message */ }) {
                    Icon(Icons.AutoMirrored.Filled.Send, contentDescription = "Send", tint = theme.brandPrimary)
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
