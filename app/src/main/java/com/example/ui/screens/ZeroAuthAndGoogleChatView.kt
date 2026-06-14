package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.Image
import androidx.compose.ui.layout.ContentScale
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewModelScope
import com.example.viewmodel.GambitViewModel
import com.example.ui.theme.LocalGambitTheme
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun ZeroAuthAndGoogleChatView(vm: GambitViewModel, currentTabName: String) {
    val theme = LocalGambitTheme.current
    val state by vm.state.collectAsState()
    val scope = rememberCoroutineScope()
    
    // Auth Flow status
    val authState = state.authState
    var chatMessageText by remember { mutableStateOf("") }
    
    // Local list of chat messages
    var listMessages by remember {
        mutableStateOf(
            listOf(
                Pair("System Bot", "Welcome to the Lobby D'App. Please log in using the Zero-Auth portal or Google Auth below to join the chat feed!"),
                Pair("DegenOracle", "The conviction indices are warming up! Standard readers are allowed to read.")
            )
        )
    }

    // Google Chat mock list
    LaunchedEffect(authState.isAuthenticated) {
        if (authState.isAuthenticated) {
            listMessages = listMessages + Pair("System Bot", "✓ ${authState.username} (${authState.authType}) successfully authenticated with standard tier public read access!")
        }
    }
    
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, theme.brandPrimary.copy(alpha = 0.5f), RoundedCornerShape(12.dp)),
        colors = CardDefaults.cardColors(containerColor = theme.bgCard.copy(alpha = 0.15f))
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "🔒 $currentTabName SECURED",
                        color = theme.brandSecondary,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                    Text(
                        text = if (authState.isAuthenticated) "Authenticated as: ${authState.username}" else "Authentication Required for State Changes",
                        color = theme.textSecondary,
                        fontSize = 10.sp
                    )
                }
                
                Box(
                    modifier = Modifier
                        .background(if (authState.isAuthenticated) Color.Green.copy(alpha = 0.2f) else theme.brandAccent.copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                        .border(1.dp, if (authState.isAuthenticated) Color.Green else theme.brandAccent, RoundedCornerShape(4.dp))
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = if (authState.isAuthenticated) "PUBLIC-READ" else "GUEST",
                        color = if (authState.isAuthenticated) Color.Green else theme.brandAccent,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }
            
            HorizontalDivider(color = theme.textSecondary.copy(alpha = 0.2f))
            
            // Authentication Portal Section
            if (!authState.isAuthenticated) {
                Column(
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "ZERO-AUTH SECURED ENCLAVE",
                        color = Color.White,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                    Text(
                        text = "Regular standard users can log in instantly with 0-Auth (instant passwordless node generation) or Google Auth to unlock the dynamic chat stream and public read dashboards.",
                        color = theme.textSecondary,
                        fontSize = 11.sp,
                        textAlign = TextAlign.Center
                    )
                    
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Button(
                            onClick = {
                                vm.handleSignIn("0-AUTH")
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = theme.brandPrimary),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("⚡ 0-AUTH INSTANT", color = theme.bgDeep, fontSize = 10.5.sp, fontWeight = FontWeight.Bold)
                        }
                        
                        Button(
                            onClick = {
                                vm.handleSignIn("GOOGLE")
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = theme.brandAccent),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("🤖 GOOGLE LOGIN", color = Color.White, fontSize = 10.5.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            } else {
                // Authenticated View: Google Chat panel
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = "💬 GOOGLE LOBBY CHATROOM via Chat API",
                        color = theme.brandPrimary,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                    
                    // Chat message stream
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(150.dp)
                            .background(Color.Black.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                            .border(1.dp, Color.DarkGray, RoundedCornerShape(8.dp))
                            .padding(8.dp)
                    ) {
                        LazyColumn(
                            verticalArrangement = Arrangement.spacedBy(6.dp),
                            modifier = Modifier.fillMaxSize()
                        ) {
                            items(listMessages) { msg ->
                                Row(
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                    verticalAlignment = Alignment.Top,
                                    modifier = Modifier.padding(vertical = 4.dp)
                                ) {
                                    Box(
                                        Modifier
                                            .size(28.dp)
                                            .background(Color.Black, RoundedCornerShape(4.dp))
                                            .border(0.5.dp, theme.brandSecondary.copy(alpha=0.5f), RoundedCornerShape(4.dp)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        if (msg.first == "System Bot") {
                                            Image(
                                                painter = androidx.compose.ui.res.painterResource(id = com.example.R.drawable.mad_logo),
                                                contentDescription = "System Avatar",
                                                modifier = Modifier.fillMaxSize(),
                                                contentScale = ContentScale.Fit
                                            )
                                        } else {
                                            Text("👤", fontSize = 12.sp)
                                        }
                                    }
                                    
                                    Column {
                                        Row(horizontalArrangement = Arrangement.spacedBy(4.dp), verticalAlignment = Alignment.CenterVertically) {
                                            Text(
                                                text = msg.first,
                                                fontWeight = FontWeight.Bold,
                                                color = if (msg.first == "System Bot") theme.brandSecondary else theme.brandPrimary,
                                                fontSize = 10.sp,
                                                fontFamily = FontFamily.Monospace
                                            )
                                            Text(
                                                text = "• standard-read",
                                                color = Color.Gray,
                                                fontSize = 8.sp,
                                                fontFamily = FontFamily.Monospace
                                            )
                                        }
                                        Text(
                                            text = msg.second,
                                            color = Color.LightGray,
                                            fontSize = 10.5.sp
                                        )
                                    }
                                }
                            }
                        }
                    }
                    
                    // Input Row
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        TextField(
                            value = chatMessageText,
                            onValueChange = { chatMessageText = it },
                            placeholder = { Text("Compile messages and press send...", fontSize = 10.sp) },
                            modifier = Modifier.weight(1f),
                            textStyle = TextStyle(fontSize = 11.sp, color = Color.White),
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
                                        delay(1000)
                                        val responses = listOf(
                                            "Aesthetic choice! Standard users can continue observing our decentralized ledger.",
                                            "Oracle alert: market conviction index shifts based on regular flows.",
                                            "Our AI agent noted your message in standard Google Chat feed.",
                                            "Zero-Auth connection validates transmission with integrity. Upgrading VIP enables PvP.",
                                            "Did you check the current Sentiment indicator? It's currently in EUPHORIA."
                                        )
                                        listMessages = listMessages + Pair("System Bot & Oracle", responses.random())
                                        vm.playFeedbackTone(android.media.ToneGenerator.TONE_PROP_ACK, 75)
                                    }
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = theme.brandSecondary),
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Text("SEND", color = theme.bgDeep, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}
