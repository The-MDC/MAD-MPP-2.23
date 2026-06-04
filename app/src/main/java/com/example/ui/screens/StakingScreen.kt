package com.example.ui.screens

import com.example.ui.components.HoverTooltip
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.*
import com.example.viewmodel.GambitViewModel

@Composable
fun StakingScreen(vm: GambitViewModel) {
    val scroll = rememberScrollState()

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
                "🏦 STAKE & GOVERN", 
                color = BrandGold, 
                fontSize = 28.sp, 
                fontWeight = FontWeight.Black,
                fontFamily = com.example.ui.theme.ArialNarrowFamily,
                style = TextStyle(shadow = Shadow(BrandGoldGlow, blurRadius = 24f))
            )
            Text(
                "Lock MADx in 6 conviction tiers. Real yield only.", 
                color = BrandEggwhite.copy(alpha = 0.7f), 
                fontSize = 12.sp,
                fontFamily = com.example.ui.theme.ArialNarrowFamily
            )
        }

        Box(
            Modifier
                .fillMaxWidth()
                .background(BgCard, RoundedCornerShape(16.dp))
                .border(1.dp, GoldFlakeBrush, RoundedCornerShape(16.dp))
                .padding(24.dp)
        ) {
            Column {
                Text("TIER YIELDS (APY)", color = NeonCyan, fontWeight = FontWeight.Black, fontFamily = com.example.ui.theme.ArialNarrowFamily, letterSpacing = 1.sp)
                Spacer(Modifier.height(16.dp))
                
                StakingTierRow("BRONZE", "12% APY", BrandEggwhite)
                StakingTierRow("SILVER", "18% APY", BrandEggwhite)
                StakingTierRow("GOLD", "25% APY", BrandGold)
                StakingTierRow("DIAMOND", "38% APY", NeonCyan)
                StakingTierRow("OBSIDIAN", "52% APY (+ Governance)", NeonPurple)
                StakingTierRow("MAD TIER", "68% APY (+ Dispute Arbitration)", NeonMagenta)
            }
        }
        
        Spacer(Modifier.height(8.dp))

        Text("STAKE MADx", color = NeonCyan, fontWeight = FontWeight.Black, fontFamily = com.example.ui.theme.ArialNarrowFamily, letterSpacing = 1.sp)
        
        var stakeInput by remember { mutableStateOf("1000") }
        
        Box(
            Modifier
                .fillMaxWidth()
                .background(BgPanel, RoundedCornerShape(16.dp))
                .padding(24.dp)
        ) {
            Column {
                OutlinedTextField(
                    value = stakeInput,
                    onValueChange = { stakeInput = it },
                    label = { Text("Amount to Stake", color = Color.Gray, fontFamily = com.example.ui.theme.ArialNarrowFamily) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = BrandGold,
                        unfocusedBorderColor = Color.DarkGray,
                        focusedTextColor = BrandEggwhite, 
                        unfocusedTextColor = BrandEggwhite
                    )
                )
                Spacer(Modifier.height(24.dp))
                HoverTooltip(text = "Lock your MADDEX tokens to secure the network and earn risk-free yield.") {
                    Button(
                        onClick = { vm.stakeMadx(stakeInput.toDoubleOrNull() ?: 0.0) },
                        modifier = Modifier.fillMaxWidth().height(56.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = BrandGold, disabledContainerColor = BgCard)
                    ) {
                        Text("LOCK & STAKE", color = BgDeep, fontWeight = FontWeight.Black, fontSize = 16.sp, letterSpacing = 1.sp)
                    }
                }
            }
        }
    }
}

@Composable
fun StakingTierRow(tier: String, yield: String, highlightColor: Color = BrandEggwhite) {
    Row(Modifier.fillMaxWidth().padding(vertical = 8.dp), Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
        Text(tier, color = highlightColor, fontSize = 14.sp, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ArialNarrowFamily)
        Text(
            yield, 
            color = if (highlightColor == BrandEggwhite) NeonGreen else highlightColor, 
            fontSize = 14.sp, 
            fontFamily = com.example.ui.theme.ArialNarrowFamily,
            fontWeight = FontWeight.Black,
            style = TextStyle(shadow = Shadow(if (highlightColor == BrandEggwhite) NeonGreen.copy(alpha=0.5f) else highlightColor.copy(alpha=0.5f), blurRadius = 12f))
        )
    }
}
