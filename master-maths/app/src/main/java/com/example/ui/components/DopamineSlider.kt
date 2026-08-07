package com.example.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.NeonCyan
import com.example.ui.theme.NeonPink
import com.example.ui.theme.BrandGold
import com.example.ui.theme.ArialNarrowFamily

@Composable
fun DopamineSlider(
    value: Float,
    onValueChange: (Float) -> Unit,
    valueRange: ClosedFloatingPointRange<Float> = 0.1f..1.0f
) {
    Column(Modifier.fillMaxWidth().padding(vertical = 8.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("🧠 DOPAMINE SLIDER", color = BrandGold, fontFamily = ArialNarrowFamily, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            Text(
                "τ = ${"%.2f".format(value)}",
                color = if (value > 0.8f) NeonPink else NeonCyan,
                fontFamily = ArialNarrowFamily,
                fontSize = 12.sp,
                fontWeight = FontWeight.Black
            )
        }
        
        Slider(
            value = value,
            onValueChange = onValueChange,
            valueRange = valueRange,
            colors = SliderDefaults.colors(
                thumbColor = if (value > 0.8f) NeonPink else NeonCyan,
                activeTrackColor = if (value > 0.8f) NeonPink else NeonCyan,
                inactiveTrackColor = Color.DarkGray.copy(alpha = 0.5f)
            )
        )
        
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text("🧊 Blue Chip", color = NeonCyan, fontSize = 10.sp, fontFamily = ArialNarrowFamily)
            Text("🔥 Max Degen", color = NeonPink, fontSize = 10.sp, fontFamily = ArialNarrowFamily)
        }
    }
}
