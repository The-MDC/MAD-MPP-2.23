package com.example.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Share
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.Scenario
import com.example.ui.theme.*
import com.example.viewmodel.GambitViewModel
import kotlinx.coroutines.delay

@Composable
fun TrendingConvictionGrid(
    scenarios: List<Scenario>,
    modifier: Modifier = Modifier,
    bookmarkedScenarioIds: Set<String> = emptySet(),
    onBookmarkToggle: (String) -> Unit = {},
    onShowStakeCalculator: (Scenario) -> Unit = {},
    vm: GambitViewModel? = null
) {
    val theme = LocalGambitTheme.current
    
    // Sort by highest pool
    val trending = scenarios.sortedByDescending { it.yesShares + it.noShares }.take(6)

    Column(modifier = modifier.fillMaxWidth().padding(16.dp)) {
        Text(
            "🔥 TRENDING CONVICTION BETS",
            color = BrandGold,
            fontSize = 13.sp,
            fontWeight = FontWeight.Black,
            fontFamily = FontFamily.Monospace
        )
        Spacer(Modifier.height(12.dp))
        
        // Responsive grid with staggered entrance animations
        LazyVerticalGrid(
            columns = GridCells.Adaptive(minSize = 150.dp),
            modifier = Modifier.height(290.dp), // Height adjusted to accommodate decay sparkline
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            itemsIndexed(trending) { index, sc ->
                // Staggered entrance animation
                var isVisible by remember { mutableStateOf(false) }
                LaunchedEffect(sc.id) {
                    delay(index * 80L)
                    isVisible = true
                }
                
                val alpha by animateFloatAsState(
                    targetValue = if (isVisible) 1f else 0f,
                    animationSpec = tween(400, easing = LinearOutSlowInEasing),
                    label = "alpha"
                )
                
                val translateY by animateFloatAsState(
                    targetValue = if (isVisible) 0f else 35f,
                    animationSpec = tween(400, easing = LinearOutSlowInEasing),
                    label = "translateY"
                )

                Box(
                    modifier = Modifier
                        .graphicsLayer {
                            this.alpha = alpha
                            this.translationY = translateY
                        }
                ) {
                    ConvictionGridCard(
                        scenario = sc,
                        isBookmarked = bookmarkedScenarioIds.contains(sc.id),
                        onBookmarkToggle = onBookmarkToggle,
                        onShowStakeCalculator = onShowStakeCalculator,
                        vm = vm
                    )
                }
            }
        }
    }
}

@Composable
fun ConvictionGridCard(
    scenario: Scenario,
    isBookmarked: Boolean,
    onBookmarkToggle: (String) -> Unit,
    onShowStakeCalculator: (Scenario) -> Unit,
    vm: GambitViewModel?
) {
    val theme = LocalGambitTheme.current
    val totalPool = scenario.yesShares + scenario.noShares
    
    // Deterministic decay sparkline data
    val decayTrend = remember(scenario.id) {
        val r = java.util.Random(scenario.id.hashCode().toLong())
        List(12) { i ->
            val base = scenario.sentimentBullishRatio * 100.0
            val noise = r.nextDouble() * 12.0 - 6.0
            val decay = (12 - i) * scenario.crowdConvictionSpeed * 1.8
            (base + noise - decay).toFloat().coerceIn(5f, 100f)
        }
    }

    val decayFactor = remember(scenario) {
        val base = (1.0 - scenario.sentimentBullishRatio) * scenario.crowdConvictionSpeed
        val multiplier = scenario.baseMultiplier
        (base * multiplier * 10.0).coerceIn(0.1, 15.0)
    }
    
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .pointerHover3DTilt()
            .glassContainerBackground(theme.brandSecondary, RoundedCornerShape(12.dp))
            .border(1.dp, theme.borderBrush, RoundedCornerShape(12.dp))
            .clickable { onShowStakeCalculator(scenario) }
            .padding(12.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                scenario.tag.uppercase(),
                color = NeonCyan,
                fontSize = 8.5.sp,
                fontFamily = FontFamily.Monospace,
                fontWeight = FontWeight.Bold
            )
            val context = androidx.compose.ui.platform.LocalContext.current
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                // Watchlist / Star toggle button
                IconButton(
                    onClick = {
                        onBookmarkToggle(scenario.id)
                        val nextBookmarked = !isBookmarked
                        if (nextBookmarked && vm != null) {
                            val alertText = if (decayFactor > 6.0) {
                                "⚠️ CRITICAL INFLECTION ALERT: ${scenario.name.uppercase()} has hit an inflection decay factor of ${"%.1f".format(decayFactor)}! Fast liquidity burn forecasted."
                            } else {
                                "📌 Added ${scenario.name} to Watchlist (Decay index: ${"%.1f".format(decayFactor)})."
                            }
                            vm.triggerVolatilityToast("WATCHLIST SHIFT", decayFactor * 10.0, alertText, true)
                        }
                    },
                    modifier = Modifier.size(24.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Star,
                        contentDescription = "Watchlist toggle",
                        tint = if (isBookmarked) BrandGold else Color.Gray.copy(alpha = 0.5f),
                        modifier = Modifier.size(14.dp)
                    )
                }
                IconButton(onClick = {
                    val sendIntent = android.content.Intent().apply {
                        action = android.content.Intent.ACTION_SEND
                        putExtra(android.content.Intent.EXTRA_TEXT, com.example.model.SatireGuardrailEngine.getShareText(scenario))
                        type = "text/plain"
                    }
                    val shareIntent = android.content.Intent.createChooser(sendIntent, null)
                    context.startActivity(shareIntent)
                }, modifier = Modifier.size(24.dp)) {
                    Icon(androidx.compose.material.icons.Icons.Filled.Share, contentDescription = "Share", tint = Color.LightGray, modifier = Modifier.size(12.dp))
                }
            }
        }
        Spacer(Modifier.height(4.dp))
        Text(
            text = scenario.name,
            color = theme.textPrimary,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis
        )
        Spacer(Modifier.height(6.dp))
        
        // Bull/Bear Conviction Bar
        val bullishRatio = scenario.sentimentBullishRatio.toFloat()
        Row(modifier = Modifier.fillMaxWidth().height(4.dp)) {
            Box(modifier = Modifier.weight(bullishRatio).fillMaxHeight().background(NeonGreen))
            Box(modifier = Modifier.weight(1f - bullishRatio).fillMaxHeight().background(BrandCrimson))
        }
        Spacer(Modifier.height(4.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text("${(bullishRatio * 100).toInt()}% BULL", color = NeonGreen, fontSize = 8.sp, fontWeight = FontWeight.Bold)
            Text("${((1f - bullishRatio) * 100).toInt()}% BEAR", color = BrandCrimson, fontSize = 8.sp, fontWeight = FontWeight.Bold)
        }
        
        // Decay Trend Sparkline
        Spacer(Modifier.height(6.dp))
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(28.dp)
                .background(Color.Black.copy(alpha = 0.25f), RoundedCornerShape(4.dp))
                .border(0.5.dp, Color.Gray.copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                .padding(horizontal = 6.dp, vertical = 2.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text("DECAY", color = Color.Gray, fontSize = 7.5.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
            SparklineChart(
                data = decayTrend,
                color = if (scenario.sentimentBullishRatio > 0.5) NeonCyan else BrandCrimson,
                modifier = Modifier.width(70.dp).fillMaxHeight()
            )
        }
        
        Spacer(Modifier.height(6.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "${(totalPool / 1000).toInt()}k MADx POOL",
                color = NeonCyan,
                fontSize = 9.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace
            )
            Text(
                text = "🧮 CALC",
                color = NeonCyan,
                fontSize = 8.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace
            )
        }
    }
}

