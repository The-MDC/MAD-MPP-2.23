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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.auth.AuthManager
import com.example.ui.theme.LocalGambitTheme
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
            Text(
                text = "MAD GAMBIT",
                color = theme.brandAccent,
                fontSize = 32.sp,
                fontWeight = FontWeight.Black,
                fontFamily = com.example.ui.theme.AllertaStencilFamily
            )
            Text(
                text = "Prediction. Conviction. Impact.",
                color = theme.textSecondary,
                fontSize = 14.sp
            )

            Spacer(modifier = Modifier.height(24.dp))

            if (authState.username.isEmpty()) {
                // Step 1: Social Login
                Text(
                    text = "STEP 1: IDENTITY LOGIN",
                    color = theme.brandSecondary,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )

                Button(
                    onClick = { scope.launch { isAuthenticating = true; authManager.loginWithZeroAuth(); isAuthenticating = false } },
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = theme.brandAccent),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Icon(Icons.Default.FlashOn, contentDescription = null, tint = Color.Black)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("⚡ ZERO-AUTH INSTANT NODE", color = Color.Black, fontWeight = FontWeight.Black)
                }

                Spacer(modifier = Modifier.height(16.dp))
                Text("OR USE WEB2 IDENTITY", color = theme.textSecondary, fontSize = 10.sp, fontWeight = FontWeight.Bold)

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
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "STEP 2: CONNECT WEB3 WALLET",
                    color = theme.brandAccent,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
                
                Button(
                    onClick = { 
                        scope.launch { 
                            isAuthenticating = true
                            authManager.connectWallet("0xMad...b1t")
                            isAuthenticating = false 
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = theme.brandPrimary),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    if (isAuthenticating) {
                        CircularProgressIndicator(color = Color.Black, modifier = Modifier.size(24.dp))
                    } else {
                        Text("CONNECT WALLET", color = Color.Black, fontSize = 16.sp, fontWeight = FontWeight.Black)
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
    OutlinedButton(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .height(50.dp),
        shape = RoundedCornerShape(8.dp),
        colors = ButtonDefaults.outlinedButtonColors(contentColor = theme.textPrimary),
        border = androidx.compose.foundation.BorderStroke(1.dp, theme.textSecondary.copy(alpha = 0.5f))
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Start
        ) {
            Icon(imageVector = icon, contentDescription = null, tint = theme.textPrimary)
            Spacer(modifier = Modifier.width(16.dp))
            Text(text, fontSize = 14.sp)
        }
    }
}
