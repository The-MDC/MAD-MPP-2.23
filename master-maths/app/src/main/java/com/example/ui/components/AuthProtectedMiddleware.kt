package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.AuthState
import com.example.model.AuthTier
import com.example.ui.theme.LocalGambitTheme
import com.example.ui.theme.BrandGold
import com.example.ui.theme.NeonCyan
import com.example.ui.theme.NeonGreen
import com.example.viewmodel.GambitViewModel

@Composable
fun AuthProtectedMiddleware(
    requiredTier: AuthTier,
    authState: AuthState,
    modifier: Modifier = Modifier,
    hideContentEntirely: Boolean = false,
    vm: GambitViewModel? = null,
    content: @Composable () -> Unit
) {
    if (authState.authTier.ordinal >= requiredTier.ordinal) {
        content()
    } else {
        val theme = LocalGambitTheme.current
        val requirementText = if (requiredTier == AuthTier.PRO) {
            "Tier 3 Pro / Wallet Verification Required"
        } else {
            "Basic Account Required"
        }
        val explanatoryText = if (requiredTier == AuthTier.PRO) {
            "Connect your Web3 Wallet or Payment method to unlock Tier 3 features, detailed reports, market convictions, Z-Liar Meter, and full profile usage."
        } else {
            "Create an Email-only or Google account to unlock basic reports and views."
        }
        
        if (hideContentEntirely) {
            Box(
                modifier = modifier
                    .fillMaxWidth()
                    .background(theme.bgCard.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                    .border(1.dp, Color.DarkGray, RoundedCornerShape(8.dp))
                    .padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                    Icon(imageVector = Icons.Default.Lock, contentDescription = "Locked", tint = BrandGold, modifier = Modifier.size(48.dp))
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(requirementText, color = BrandGold, fontWeight = FontWeight.Bold, fontSize = 16.sp, textAlign = TextAlign.Center)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(explanatoryText, color = theme.textSecondary, fontSize = 12.sp, textAlign = TextAlign.Center)
                    
                    if (requiredTier == AuthTier.PRO && vm != null) {
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(
                            onClick = { vm.openWalletConnectDialog() },
                            colors = ButtonDefaults.buttonColors(containerColor = NeonCyan),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Icon(Icons.Default.AccountBalanceWallet, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("CONNECT WEB3 WALLET", color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                        }
                    }
                }
            }
        } else {
            Box(modifier = modifier) {
                Box(modifier = Modifier.blur(8.dp).clip(RoundedCornerShape(8.dp))) {
                    content()
                }
                Box(
                    modifier = Modifier
                        .matchParentSize()
                        .background(theme.bgDeep.copy(alpha = 0.6f), RoundedCornerShape(8.dp))
                        .clickable(enabled = true, onClick = {}), // intercept clicks
                    contentAlignment = Alignment.Center
                ) {
                    HoverTooltip(
                        text = explanatoryText,
                        modifier = Modifier.padding(16.dp)
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center,
                            modifier = Modifier
                                .background(theme.bgCard.copy(alpha = 0.85f), RoundedCornerShape(12.dp))
                                .border(1.dp, BrandGold.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
                                .padding(16.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(imageVector = Icons.Default.Lock, contentDescription = "Locked", tint = BrandGold, modifier = Modifier.size(20.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("PRO / OVERLAY", color = BrandGold, fontWeight = FontWeight.Black, fontSize = 12.sp)
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(requirementText, color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            
                            if (requiredTier == AuthTier.PRO && vm != null) {
                                Spacer(modifier = Modifier.height(12.dp))
                                Button(
                                    onClick = { vm.openWalletConnectDialog() },
                                    colors = ButtonDefaults.buttonColors(containerColor = NeonCyan),
                                    shape = RoundedCornerShape(6.dp),
                                    modifier = Modifier.height(34.dp)
                                ) {
                                    Icon(Icons.Default.AccountBalanceWallet, contentDescription = null, modifier = Modifier.size(14.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("CONNECT WALLET", color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 9.5.sp)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
