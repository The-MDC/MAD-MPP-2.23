package com.example.ui.screens
import com.example.ui.components.HoverTooltip
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.components.HolographicCard
import com.example.ui.components.GlassKeycapButton
import com.example.ui.components.neonIconComposer
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocalFireDepartment
import com.example.ui.theme.*
import com.example.viewmodel.GambitViewModel

@Composable
fun AuctionScreen(vm: GambitViewModel) {
    val state by vm.state.collectAsState()
    val scroll = rememberScrollState()
    val canAfford = state.madxBalance >= state.dynamicPackPrice

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
                "📦 DUTCH AUCTION PACK", 
                color = BrandGold, 
                fontSize = 28.sp, 
                fontWeight = FontWeight.Black,
                fontFamily = com.example.ui.theme.ArialNarrowFamily,
                style = TextStyle(shadow = Shadow(BrandGoldGlow, blurRadius = 24f))
            )
            Text(
                "🩸 Decrementing Price | Buyout at Floor | Snap-Back to Ceiling", 
                color = BrandEggwhite.copy(alpha = 0.7f), 
                fontSize = 12.sp,
                fontFamily = com.example.ui.theme.ArialNarrowFamily,
                letterSpacing = 0.5.sp
            )
        }

        Box(Modifier.fillMaxWidth().height(260.dp), contentAlignment = Alignment.Center) {
            Box(
                Modifier
                    .size(220.dp)
                    .background(Brush.linearGradient(listOf(NeonPurple, NeonCyan, NeonMagenta)), RoundedCornerShape(24.dp))
                    .border(1.dp, GoldFlakeBrush, RoundedCornerShape(24.dp))
                    .padding(24.dp), 
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("SATIRICAL NFT", color = BgDeep, fontWeight = FontWeight.Black, fontSize = 20.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                    Text("O-V DECK v3.0.1", color = BgDeep.copy(alpha=0.7f), fontSize = 12.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(16.dp))
                    Text(
                        "$${"%.0f".format(state.dynamicPackPrice)}", 
                        color = BrandEggwhite, 
                        fontSize = 48.sp, 
                        fontWeight = FontWeight.Black, 
                        fontFamily = com.example.ui.theme.ArialNarrowFamily,
                        style = TextStyle(shadow = Shadow(BgDeep, blurRadius = 12f))
                    )
                    Text("MADx", color = BrandEggwhite, fontSize = 16.sp, fontWeight = FontWeight.Black)
                }
            }
        }

        HoverTooltip(text = "Mint a randomized Scandal Pack using MADx tokens.") {
            val baseBtnColor = if (canAfford) NeonGreen else Color.Gray.copy(alpha = 0.5f)
            GlassKeycapButton(
                onClick = { if (canAfford) vm.purchasePack() },
                modifier = Modifier.fillMaxWidth().height(64.dp),
                baseColor = baseBtnColor,
                shape = RoundedCornerShape(16.dp),
                icon = {
                    Icon(
                        imageVector = Icons.Filled.LocalFireDepartment,
                        contentDescription = "Pack Auction",
                        modifier = Modifier
                            .size(24.dp)
                            .neonIconComposer(isActive = canAfford),
                        tint = Color.White
                    )
                },
                label = {
                    Text(
                        if (canAfford) "MINT SCANDAL PACK" else "INSUFFICIENT MADx", 
                        color = if (canAfford) Color.White else Color.Gray, 
                        fontWeight = FontWeight.Black,
                        fontSize = 16.sp,
                        letterSpacing = 1.2.sp
                    )
                }
            )
        }

        Spacer(Modifier.height(8.dp))
        Text("YOUR DECK (${state.ownedCards.size})", color = NeonCyan, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ArialNarrowFamily, letterSpacing = 1.sp)
        
        if (state.ownedCards.isEmpty()) {
            Box(
                Modifier.fillMaxWidth().background(BgCard, RoundedCornerShape(12.dp)).border(1.dp, GoldFlakeBrush, RoundedCornerShape(12.dp)).padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Text("NO CARDS YET.\nMint a pack to begin your collection.", color = Color.Gray, textAlign = androidx.compose.ui.text.style.TextAlign.Center, fontFamily = com.example.ui.theme.ArialNarrowFamily)
            }
        } else {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(16.dp), modifier = Modifier.fillMaxWidth()) {
                items(state.ownedCards.reversed()) { card -> HolographicCard(card = card) }
            }
        }
    }
}
