package com.example.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.*
import com.example.ui.components.AnimatedTopHatSpinner
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GroundingSearchBar(modifier: Modifier = Modifier) {
    val theme = LocalGambitTheme.current
    var query by remember { mutableStateOf("") }
    var isSearching by remember { mutableStateOf(false) }
    var searchResult by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(16.dp)
            .glassContainerBackground(theme.brandSecondary, RoundedCornerShape(16.dp))
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                "🌐 GOOGLE SEARCH GROUNDING",
                color = BrandGold,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace
            )
            Icon(Icons.Default.Search, contentDescription = null, tint = NeonCyan, modifier = Modifier.size(16.dp))
        }
        Spacer(Modifier.height(8.dp))
        TextField(
            value = query,
            onValueChange = { query = it },
            placeholder = { Text("Fetch real-world news on satirical markets...", fontSize = 11.sp, color = theme.textSecondary.copy(alpha=0.6f)) },
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, theme.borderBrush, RoundedCornerShape(8.dp)),
            colors = TextFieldDefaults.colors(
                focusedContainerColor = Color.Black.copy(alpha = 0.4f),
                unfocusedContainerColor = Color.Black.copy(alpha = 0.4f),
                focusedIndicatorColor = Color.Transparent,
                unfocusedIndicatorColor = Color.Transparent,
                focusedTextColor = theme.textPrimary,
                unfocusedTextColor = theme.textPrimary
            ),
            shape = RoundedCornerShape(8.dp),
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
            keyboardActions = KeyboardActions(
                onSearch = {
                    if (query.isNotBlank()) {
                        scope.launch {
                            isSearching = true
                            searchResult = null
                            delay(1500) // Mocking search delay
                            isSearching = false
                            searchResult = "MADHAT'r Live Feed [Grounded]: \"Latest reports confirm that '${query}' is experiencing unexpected volatility due to a sudden influx of Jersey shore whales and rogue AI bots. Federal Reserve janitors remain on high alert.\""
                        }
                    }
                }
            )
        )
        
        AnimatedVisibility(visible = isSearching) {
            Box(modifier = Modifier.fillMaxWidth().padding(top = 12.dp), contentAlignment = Alignment.Center) {
                AnimatedTopHatSpinner(
                    size = 56.dp,
                    labelText = "Grounding search via Gemini API...",
                    tint = NeonCyan,
                    showLabel = true
                )
            }
        }
        
        AnimatedVisibility(visible = searchResult != null) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 12.dp)
                    .background(NeonGreen.copy(alpha = 0.1f), RoundedCornerShape(8.dp))
                    .border(0.5.dp, NeonGreen.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                    .padding(12.dp)
            ) {
                Text(
                    text = "VERIFIED SATIRICAL INTEL:",
                    color = NeonGreen,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    text = searchResult ?: "",
                    color = theme.textPrimary,
                    fontSize = 10.sp,
                    lineHeight = 14.sp
                )
            }
        }
    }
}
