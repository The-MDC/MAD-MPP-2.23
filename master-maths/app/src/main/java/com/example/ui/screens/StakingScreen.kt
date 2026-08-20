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
    val state by vm.state.collectAsState()
    val scroll = rememberScrollState()

    // Calculate Dynamic APY: APY_user = APY_base * (1 + NFT_Clout / 200)
    val equippedClout = state.ownedCards.maxOfOrNull { it.cloutMultiplier * 100.0 } ?: 0.0
    val dynamicModifier = 1.0 + (equippedClout / 200.0)

    Column(
        Modifier
            .fillMaxSize()
            .background(BgDeep)
            .verticalScroll(scroll)
            .padding(0.5.dp),
        verticalArrangement = Arrangement.spacedBy(0.dp)
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
                .background(BgCard.copy(alpha = 0.15f), RoundedCornerShape(16.dp))
                .border(1.dp, GoldFlakeBrush, RoundedCornerShape(16.dp))
                .padding(24.dp)
        ) {
            Column {
                Text("TIER YIELDS (APY) - Boosted x${"%.2f".format(dynamicModifier)}", color = NeonCyan, fontWeight = FontWeight.Black, fontFamily = com.example.ui.theme.ArialNarrowFamily, letterSpacing = 1.sp)
                Spacer(Modifier.height(16.dp))
                
                val baseApys = listOf(
                    "BRONZE" to 12.0,
                    "SILVER" to 18.0,
                    "GOLD" to 25.0,
                    "DIAMOND" to 38.0,
                    "OBSIDIAN" to 52.0,
                    "MAD TIER" to 68.0
                )
                
                baseApys.forEach { (name, base) ->
                    val color = when(name) {
                        "GOLD" -> BrandGold
                        "DIAMOND" -> NeonCyan
                        "OBSIDIAN" -> NeonPurple
                        "MAD TIER" -> NeonMagenta
                        else -> BrandEggwhite
                    }
                    val suffix = when(name) {
                        "OBSIDIAN" -> " (+ Governance)"
                        "MAD TIER" -> " (+ Arbitration)"
                        else -> ""
                    }
                    val yieldAmount = com.example.math.GambitMath.calculateStakingYield(base, state.xp.toDouble() / 100.0) * dynamicModifier
                    StakingTierRow(name, "${"%.1f".format(yieldAmount)}% APY$suffix", color)
                }
            }
        }
        
        Spacer(Modifier.height(8.dp))

        Text("STAKE MADx", color = NeonCyan, fontWeight = FontWeight.Black, fontFamily = com.example.ui.theme.ArialNarrowFamily, letterSpacing = 1.sp)
        Text("Current Staked Balance: ${"%.2f".format(state.stakedMadxBalance)} MADx", color = BrandGold, fontSize = 14.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
        
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
                        colors = ButtonDefaults.buttonColors(containerColor = BrandGold, disabledContainerColor = BgCard.copy(alpha = 0.15f))
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
