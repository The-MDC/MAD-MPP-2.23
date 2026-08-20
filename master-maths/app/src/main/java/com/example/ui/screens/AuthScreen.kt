package com.example.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.foundation.Image
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.layout.ContentScale
import com.example.R
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.auth.AuthManager
import com.example.ui.theme.LocalGambitTheme
import com.example.ui.theme.GoldFlakeBrush
import com.example.ui.components.glassReflection
import androidx.compose.foundation.clickable
import kotlinx.coroutines.launch

@OptIn(ExperimentalAnimationApi::class)
@Composable
fun AuthScreen(authManager: AuthManager, onAuthSuccess: () -> Unit) {
    val theme = LocalGambitTheme.current
    val authState by authManager.authState.collectAsState()
    val scope = rememberCoroutineScope()
    var isAuthenticating by remember { mutableStateOf(false) }

    LaunchedEffect(authState.isAuthenticated) {
        if (authState.isAuthenticated) {
            onAuthSuccess()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(theme.bgCard)
            .padding(16.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp),
            modifier = Modifier.fillMaxWidth(0.9f)
        ) {
            // MAD Gambit Logo Area
            androidx.compose.foundation.Image(
                painter = androidx.compose.ui.res.painterResource(id = com.example.R.drawable.mad_logo),
                contentDescription = "MAD Gambit Logo",
                modifier = Modifier
                    .fillMaxWidth()
                    .height(226.dp),
                contentScale = androidx.compose.ui.layout.ContentScale.Fit
            )

            Spacer(modifier = Modifier.height(24.dp))

            if (authState.username.isEmpty()) {
                // Step 1: Social Login
                Text(
                    text = "STEP 1: IDENTITY LOGIN",
                    color = theme.brandSecondary,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center
                )

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp)
                        .background(Color(0x4D706050), RoundedCornerShape(9.dp))
                        .border(1.dp, GoldFlakeBrush, RoundedCornerShape(9.dp))
                        .padding(1.dp)
                        .glassReflection(theme.brandSecondary.copy(alpha = 0.1f), RoundedCornerShape(8.dp))
                        .clickable { scope.launch { isAuthenticating = true; authManager.loginWithZeroAuth(); isAuthenticating = false } },
                    contentAlignment = Alignment.Center
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        Icon(Icons.Default.FlashOn, contentDescription = null, tint = Color(0xFFFFF59D))
                        Spacer(modifier = Modifier.width(16.dp))
                        Text("⚡ ZERO-AUTH INSTANT NODE", fontSize = 14.sp, color = Color(0xFFFFF59D), fontWeight = FontWeight.Bold)
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "OR USE WEB2 IDENTITY", 
                    color = theme.textSecondary, 
                    fontSize = 10.sp, 
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center
                )

                SocialButton("Login with Google", Icons.Default.Email) {
                    scope.launch { isAuthenticating = true; authManager.loginWithGoogle(); isAuthenticating = false }
                }
                SocialButton("Login with Apple", Icons.Default.Lock) {
                    scope.launch { isAuthenticating = true; authManager.loginWithApple(); isAuthenticating = false }
                }
                SocialButton("Login with Meta", Icons.Default.Face) {
                    scope.launch { isAuthenticating = true; authManager.loginWithMeta(); isAuthenticating = false }
                }
                SocialButton("Login with X.com", Icons.Default.Share) {
                    scope.launch { isAuthenticating = true; authManager.loginWithX(); isAuthenticating = false }
                }
                SocialButton("Login with Discord", Icons.Default.Chat) {
                    scope.launch { isAuthenticating = true; authManager.loginWithDiscord(); isAuthenticating = false }
                }
                SocialButton("Login with Telegram", Icons.Default.Send) {
                    scope.launch { isAuthenticating = true; authManager.loginWithTelegram(); isAuthenticating = false }
                }
            } else {
                // Step 2: Wallet Connect
                Text(
                    text = "WELCOME, ${authState.username.uppercase()}",
                    color = theme.textPrimary,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center
                )
                Text(
                    text = "STEP 2: CONNECT WEB3 WALLET",
                    color = theme.brandAccent,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center
                )
                
                Text(
                    text = "A Degenerate Prediction Circus \ud83c\udfaa\nBet on the Breakdown—Because Sanity's Overrated!\n\ud83c\udfad Bet Smart, Lose Spectacularly \ud83c\udfad",
                    color = theme.textSecondary,
                    fontSize = 14.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(vertical = 12.dp)
                )
                
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp)
                        .background(Color(0x4D706050), RoundedCornerShape(9.dp))
                        .border(1.dp, GoldFlakeBrush, RoundedCornerShape(9.dp))
                        .padding(1.dp)
                        .glassReflection(theme.brandSecondary.copy(alpha = 0.1f), RoundedCornerShape(8.dp))
                        .clickable {
                            scope.launch { 
                                isAuthenticating = true
                                authManager.connectWallet("0xMad...b1t")
                                isAuthenticating = false 
                            }
                        },
                    contentAlignment = Alignment.Center
                ) {
                    if (isAuthenticating) {
                        CircularProgressIndicator(color = Color(0xFFFFF59D), modifier = Modifier.size(24.dp))
                    } else {
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Icon(Icons.Default.AccountBalanceWallet, contentDescription = null, tint = Color(0xFFFFF59D))
                            Spacer(modifier = Modifier.width(16.dp))
                            Text("CONNECT WALLET", fontSize = 14.sp, color = Color(0xFFFFF59D), fontWeight = FontWeight.Bold)
                        }
                    }
                }
                
                TextButton(onClick = { scope.launch { authManager.logout() }}) {
                    Text("Change Account", color = theme.textSecondary)
                }
            }

            if (isAuthenticating && authState.username.isEmpty()) {
                Spacer(modifier = Modifier.height(16.dp))
                CircularProgressIndicator(color = theme.brandAccent, modifier = Modifier.size(32.dp))
            }
        }
    }
}

@Composable
fun SocialButton(text: String, icon: ImageVector, onClick: () -> Unit) {
    val theme = LocalGambitTheme.current
    
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(52.dp)
            .background(Color(0x4D706050), RoundedCornerShape(9.dp))
            .border(1.dp, GoldFlakeBrush, RoundedCornerShape(9.dp))
            .padding(1.dp)
            .glassReflection(theme.brandSecondary.copy(alpha=0.1f), RoundedCornerShape(8.dp))
            .clickable { onClick() },
        contentAlignment = Alignment.Center
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            Icon(imageVector = icon, contentDescription = null, tint = theme.textPrimary)
            Spacer(modifier = Modifier.width(16.dp))
            Text(text, fontSize = 14.sp, color = theme.textPrimary, fontWeight = FontWeight.Bold)
        }
    }
}
