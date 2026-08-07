package com.example.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.SatiricalCard
import com.example.ui.theme.*

@Composable
fun HolographicCard(card: SatiricalCard, onClick: () -> Unit = {}) {
    var pressed by remember { mutableStateOf(false) }
    val scale by animateFloatAsState(if (pressed) 1.08f else 1.0f, label = "card-scale")
    val rarityColor = Color(card.rarity.color)

    Box(
        modifier = Modifier
            .size(140.dp)
            .scale(scale)
            .glassContainerBackground(rarityColor, RoundedCornerShape(12.dp))
            .border(1.dp, GoldFlakeBrush, RoundedCornerShape(12.dp))
            .pointerInput(Unit) {
                detectTapGestures(
                    onPress = { pressed = true; tryAwaitRelease(); pressed = false },
                    onTap = { onClick() }
                )
            }
            .padding(12.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(card.rarity.display.uppercase(), color = Color.Black, 
                 fontSize = 10.5.sp, fontWeight = FontWeight.ExtraBold)
            Spacer(Modifier.height(4.dp))
            Text(card.name, color = Color.White, fontSize = 11.sp, 
                 fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ArialNarrowFamily,
                 maxLines = 2)
            Spacer(Modifier.height(4.dp))
            Text("PWR: ${card.powerLevel}", color = GoldGlow, fontSize = 10.5.sp)
            Text(card.faction, color = Color.White.copy(alpha = 0.7f), fontSize = 8.5.sp)
            Spacer(Modifier.height(4.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("${card.cloutMultiplier}x", color = NeonCyan, fontSize = 9.5.sp, fontWeight = FontWeight.Bold)
                    Text("Clout", color = Color.Gray, fontSize = 7.5.sp)
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("${card.edgeMultiplier}x", color = NeonPink, fontSize = 9.5.sp, fontWeight = FontWeight.Bold)
                    Text("Edge", color = Color.Gray, fontSize = 7.5.sp)
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("${(card.apyBoost * 100).toInt()}%", color = NeonGreen, fontSize = 9.5.sp, fontWeight = FontWeight.Bold)
                    Text("APY", color = Color.Gray, fontSize = 7.5.sp)
                }
            }
        }
    }
}
