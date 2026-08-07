package com.example.ui.components
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.NeonCyan
import com.example.ui.theme.NeonPink

@Composable
fun NeonSlider(label: String, value: Float, onValueChange: (Float) -> Unit,
               valueRange: ClosedFloatingPointRange<Float> = 0f..1f, suffix: String = "") {
    Column(Modifier.fillMaxWidth().padding(vertical = 8.dp)) {
        Text("$label: ${"%.2f".format(value)}$suffix", color = NeonCyan,
             fontFamily = com.example.ui.theme.ArialNarrowFamily, fontSize = 12.sp)
        Slider(value = value, onValueChange = onValueChange, valueRange = valueRange,
               colors = SliderDefaults.colors(
                   thumbColor = NeonCyan, activeTrackColor = NeonCyan,
                   inactiveTrackColor = NeonPink.copy(alpha = 0.3f)
               ))
    }
}
