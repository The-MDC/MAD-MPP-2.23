package com.example.ui.screens
import com.example.ui.components.GlassKeycapButton
import com.example.ui.components.neonIconComposer
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Shield
import com.example.ui.components.HoverTooltip
import com.example.ui.components.glassContainerBackground
import com.example.ui.components.innerGlassContainerBackground
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.math.GambitMath
import com.example.ui.components.NeonSlider
import com.example.ui.theme.*
import com.example.viewmodel.GambitViewModel

@Composable
fun MadShieldScreen(vm: GambitViewModel) {
    val state by vm.state.collectAsState()
    val scroll = rememberScrollState()
    var stakeText by remember { mutableStateOf("100") }
    var collateralRatio by remember { mutableStateOf(1.0f) }
    var safetyThreshold by remember { mutableStateOf(0.5f) }

    var isPremium by remember { mutableStateOf(false) }
    var premiumTier by remember { mutableStateOf(0f) } // 0f for 28.8%, 1f for 40%
    val isPremiumShield = premiumTier > 0.5f

    val stake = stakeText.toDoubleOrNull() ?: 0.0
    val shieldPercentage = if (isPremiumShield) 0.40 else 0.288
    val premium = stake * if (isPremiumShield) 0.04 else 0.02
    val payout = GambitMath.calculateShieldPayout(stake, isPremiumShield)

    Column(
        Modifier
            .fillMaxSize()
            .background(BgDeep)
            .verticalScroll(scroll)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Column(Modifier.padding(horizontal = 4.dp)) {
            Text(
                "⚔️ MAD SHIELD™ EXECUTOR", 
                color = NeonPurple, 
                fontSize = 28.sp, 
                fontWeight = FontWeight.Black,
                fontFamily = com.example.ui.theme.ArialNarrowFamily,
                style = TextStyle(shadow = Shadow(NeonPurpleDim, blurRadius = 24f))
            )
            Text(
                "Sustainable Conviction Opt-In Stop-Loss Shield. Avoids regulatory risk with zero legacy finance modeling.", 
                color = BrandEggwhite.copy(alpha=0.7f), 
                fontSize = 11.sp,
                fontFamily = com.example.ui.theme.ArialNarrowFamily
            )
        }

        Box(
            Modifier
                .fillMaxWidth()
                .glassContainerBackground(NeonPurple, RoundedCornerShape(16.dp))
                .padding(24.dp)
        ) {
            Column {
                OutlinedTextField(
                    value = stakeText, 
                    onValueChange = { stakeText = it.filter { c -> c.isDigit() } },
                    label = { Text("Shielded Stake (MADx)", color = Color.Gray, fontFamily = com.example.ui.theme.ArialNarrowFamily) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = NeonPurple, 
                        unfocusedBorderColor = Color.DarkGray,
                        focusedTextColor = BrandEggwhite, 
                        unfocusedTextColor = BrandEggwhite
                    )
                )
                Spacer(Modifier.height(24.dp))
                NeonSlider("Shield Tier (28.8% Base -> 40% Max)", premiumTier, { premiumTier = it }, 0f..1f, "")
                Spacer(Modifier.height(16.dp))
                NeonSlider("Collateral Ratio", collateralRatio, { collateralRatio = it }, 0.5f..2.0f, "x")
                Spacer(Modifier.height(16.dp))
                NeonSlider("Safety Threshold", safetyThreshold, { safetyThreshold = it }, 0.1f..1.0f)
                
                Spacer(Modifier.height(24.dp))
                HorizontalDivider(color = NeonPurple.copy(alpha = 0.5f))
                Spacer(Modifier.height(24.dp))
                
                Row(Modifier.fillMaxWidth(), Arrangement.SpaceBetween) {
                    Text("Premium (${if(isPremiumShield) "4%" else "2%"}):", color = Color.LightGray, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                    Text("${"%.2f".format(premium)} MADx", color = BrandCrimson, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontWeight = FontWeight.Bold)
                }
                Spacer(Modifier.height(8.dp))
                Row(Modifier.fillMaxWidth(), Arrangement.SpaceBetween) {
                    Text("Stop-Loss Return (${if(isPremiumShield) "40%" else "28.8%"}):", color = Color.LightGray, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                    Text("${"%.2f".format(payout)} MADx", color = NeonGreen, 
                         fontFamily = com.example.ui.theme.ArialNarrowFamily, fontWeight = FontWeight.Black, fontSize = 18.sp,
                         style = TextStyle(shadow = Shadow(NeonGreen.copy(alpha=0.5f), blurRadius = 12f)))
                }
                
                Spacer(Modifier.height(32.dp))
                HoverTooltip(text = "Activates Sybil Defense Module: Deducts the fee from your account to shield against impermanent loss.") {
                    GlassKeycapButton(
                        onClick = { vm.stakeOnScenario(premium, 1.0) }, 
                        modifier = Modifier.fillMaxWidth().height(56.dp),
                        baseColor = NeonPurple,
                        shape = RoundedCornerShape(12.dp),
                        icon = {
                            Icon(
                                imageVector = Icons.Filled.Shield,
                                contentDescription = "Shield Opt-In",
                                modifier = Modifier
                                    .size(24.dp)
                                    .neonIconComposer(isActive = true),
                                tint = Color.White
                            )
                        },
                        label = {
                            Text("OPT-IN TO SHIELD", color = BrandEggwhite, fontWeight = FontWeight.Black, fontSize = 16.sp, letterSpacing = 1.sp)
                        }
                    )
                }
            }
        }

        Column(Modifier.padding(horizontal = 8.dp)) {
            Text("Formula: Stop-Loss = Min(S * ${if(isPremiumShield) "40%" else "28.8%"}, S * CollateralRatio)", color = Color.Gray, fontSize = 11.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
            Spacer(Modifier.height(4.dp))
            Text("Maximum asymptotic stop-loss: ${"%.1f".format(payout)} MADx (${if(isPremiumShield) "40%" else "28.8%"} max cap)", color = Color.Gray, fontSize = 11.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
        }

        Spacer(Modifier.height(8.dp))
        Text("MAD SHIELD HISTORY / SUCCESSFUL PAYOUTS", color = BrandGold, fontSize = 16.sp, fontWeight = FontWeight.Black, fontFamily = com.example.ui.theme.ArialNarrowFamily)
        Box(
            Modifier
                .fillMaxWidth()
                .innerGlassContainerBackground(Color.Gray, RoundedCornerShape(12.dp))
                .padding(16.dp)
        ) {
            Column {
                listOf(
                    Pair("Payout: +4,500 MADx", "Whale Liquidation Mitigation"),
                    Pair("Payout: +1,240 MADx", "Oracle Desynchronization Event"),
                    Pair("Payout: +890 MADx", "AI Hallucination Over-Correction")
                ).forEach { payoutInfo ->
                    Row(Modifier.fillMaxWidth().padding(vertical = 8.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Column {
                            Text(payoutInfo.first, color = NeonGreen, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                            Spacer(Modifier.height(2.dp))
                            Text(payoutInfo.second, color = Color.Gray, fontSize = 11.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                        }
                        Icon(androidx.compose.material.icons.Icons.Default.CheckCircle, contentDescription = "Verified", tint = NeonGreen, modifier = Modifier.size(16.dp))
                    }
                    HorizontalDivider(color = Color.DarkGray.copy(alpha=0.5f))
                }
                Spacer(Modifier.height(8.dp))
                Text("Smart contracts automatically execute delta protective stop-loss based on infallible dynamic Phi-ratio math logic.", color = Color.Gray, fontSize = 10.5.sp, fontStyle = androidx.compose.ui.text.font.FontStyle.Italic)
            }
        }
             
        Spacer(Modifier.height(8.dp))
        Text(
            "CREATOR PROFIT SHARE", 
            color = NeonCyan, 
            fontSize = 20.sp, 
            fontWeight = FontWeight.Black, 
            fontFamily = com.example.ui.theme.ArialNarrowFamily,
            style = TextStyle(shadow = Shadow(NeonCyanDim, blurRadius = 16f))
        )
        
        Box(
            Modifier
                .fillMaxWidth()
                .innerGlassContainerBackground(NeonCyan, RoundedCornerShape(12.dp))
                .padding(20.dp)
        ) {
            Column {
                Row(Modifier.fillMaxWidth(), Arrangement.SpaceBetween, Alignment.CenterVertically) {
                    Text("Standard Creators:", color = BrandEggwhite, fontSize = 14.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                    Text("40% Share", color = NeonGreen, fontWeight = FontWeight.Black, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontSize = 16.sp)
                }
                Spacer(Modifier.height(12.dp))
                Row(Modifier.fillMaxWidth(), Arrangement.SpaceBetween, Alignment.CenterVertically) {
                    Text("VIP Influencers:", color = BrandGold, fontSize = 16.sp, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                    Text("60% Share", color = BrandGold, fontWeight = FontWeight.Black, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontSize = 20.sp,
                         style = TextStyle(shadow = Shadow(BrandGoldGlow, blurRadius = 12f)))
                }
            }
        }
    }
}
