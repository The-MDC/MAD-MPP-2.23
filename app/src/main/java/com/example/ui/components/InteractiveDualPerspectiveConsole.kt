package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.LocalGambitTheme
import kotlin.math.sqrt

import androidx.compose.ui.graphics.SolidColor

enum class SandboxMetricType(
    val title: String,
    val symbol: String,
    val subtitle: String,
    val polymathText: String,
    val igamingText: String,
    val baseValue: Double,
    val unit: String
) {
    DELTA_LIMIT(
        title = "δ-Limit Transform Formula",
        symbol = "δ = π * m * √S",
        subtitle = "Quadratic Whale-Resistance Equation",
        polymathText = "A fractional-reserve-backed derivative limit constraint. Uses a square-root stake scaling filter to prevent high-capital concentration from manipulating cultural indices.",
        igamingText = "The ultimate boss multiplier filter! It works like an adrenaline shield - capping single bets to keep the predictive matches running at maximum tension.",
        baseValue = 100.0,
        unit = "δ"
    ),
    PHI_RESERVE(
        title = "Golden Φ Protective Pool Ratio",
        symbol = "Φ = 1.618 : 1",
        subtitle = "Fibonacci Reserve Alignment",
        polymathText = "Ensures the underlying index vault reserves are locked at the Golden Ratio (1.618) relative to total system predictive liabilities. Mitigates the danger of cascade liquidation.",
        igamingText = "The Jackpot multiplier! If the community maintains the golden ratio of reserves to stakes, a global 1.5x APY multiplier kicks in.",
        baseValue = 200.0,
        unit = "MADx"
    ),
    TRANSACTION_FEE(
        title = "Slippage & Protocol Trade Fee",
        symbol = "Fee = 0.75%",
        subtitle = "Feedback-Loop Liquidity Recycler",
        polymathText = "A 75 basis-point fee applied on conviction stakes. Real-time routing splits 60% of this fee into active yield pools, 30% to community liquidity-makers, and 10% to liquidator treasury vaults.",
        igamingText = "Game rakes turned into community power! 0.75% of every transaction is pooled to trigger daily randomized 'Mystery Airdrops'.",
        baseValue = 500.0,
        unit = "MADx"
    ),
    SHIELD_PREMIUM(
        title = "MAD Shield Protection Premium",
        symbol = "Premium = 2.00%",
        subtitle = "Fallout Dynamic Protection Cost",
        polymathText = "A flat 2% risk coverage premium calculated continuously based on baseline scandal index volatility. This pricing utilizes a volatility-indexed multiplier.",
        igamingText = "Prediction protection on demand! Risk 2 tokens to guarantee a 100% refund on prediction failures if an index crashes below safety levels.",
        baseValue = 1000.0,
        unit = "MADx"
    )
}

@Composable
fun InteractiveDualPerspectiveConsole() {
    val theme = LocalGambitTheme.current
    var currentMetric by remember { mutableStateOf<SandboxMetricType?>(null) }
    var localStakeInput by remember { mutableStateOf("150.0") }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(theme.bgCard, RoundedCornerShape(12.dp))
            .border(theme.borderWidth, theme.borderBrush, RoundedCornerShape(12.dp))
            .padding(16.dp)
    ) {
        Text(
            text = "MULTI-PERSPECTIVE CONVEXITY CONSOLE",
            fontSize = 11.sp,
            fontWeight = FontWeight.ExtraBold,
            color = theme.brandSecondary,
            modifier = Modifier.padding(bottom = 2.dp)
        )
        Text(
            text = "Study quantitative math alongside speculative iGaming designer excitement. Click any parameter below.",
            fontSize = 10.5.sp,
            color = theme.textSecondary,
            lineHeight = 14.sp,
            modifier = Modifier.padding(bottom = 10.dp)
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(theme.bgDeep)
                        .border(1.dp, if (currentMetric == SandboxMetricType.DELTA_LIMIT) SolidColor(theme.brandSecondary) else theme.borderBrush, RoundedCornerShape(8.dp))
                        .clickable { currentMetric = SandboxMetricType.DELTA_LIMIT }
                        .padding(10.dp)
                ) {
                    Column {
                        Text("δ = π * m * √S", fontSize = 12.sp, color = theme.brandPrimary, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontWeight = FontWeight.Bold)
                        Text("Delta Limit Cap", fontSize = 9.5.sp, color = theme.textSecondary)
                    }
                }

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(theme.bgDeep)
                        .border(1.dp, if (currentMetric == SandboxMetricType.PHI_RESERVE) SolidColor(theme.brandSecondary) else theme.borderBrush, RoundedCornerShape(8.dp))
                        .clickable { currentMetric = SandboxMetricType.PHI_RESERVE }
                        .padding(10.dp)
                ) {
                    Column {
                        Text("Φ = 1.618 : 1", fontSize = 12.sp, color = theme.brandSecondary, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontWeight = FontWeight.Bold)
                        Text("Golden Reserve Ratio", fontSize = 9.5.sp, color = theme.textSecondary)
                    }
                }
            }

            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(theme.bgDeep)
                        .border(1.dp, if (currentMetric == SandboxMetricType.TRANSACTION_FEE) SolidColor(theme.brandSecondary) else theme.borderBrush, RoundedCornerShape(8.dp))
                        .clickable { currentMetric = SandboxMetricType.TRANSACTION_FEE }
                        .padding(10.dp)
                ) {
                    Column {
                        Text("TRADE FEE: 0.75%", fontSize = 11.sp, color = theme.brandAccent, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontWeight = FontWeight.Bold)
                        Text("Feedback Slippage Rake", fontSize = 9.5.sp, color = theme.textSecondary)
                    }
                }

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(theme.bgDeep)
                        .border(1.dp, if (currentMetric == SandboxMetricType.SHIELD_PREMIUM) SolidColor(theme.brandSecondary) else theme.borderBrush, RoundedCornerShape(8.dp))
                        .clickable { currentMetric = SandboxMetricType.SHIELD_PREMIUM }
                        .padding(10.dp)
                ) {
                    Column {
                        Text("SHIELD FEE: 2.0%", fontSize = 11.sp, color = theme.textPrimary, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontWeight = FontWeight.Bold)
                        Text("Fallout Protocol Premium", fontSize = 9.5.sp, color = theme.textSecondary)
                    }
                }
            }
        }

        currentMetric?.let { metric ->
            Spacer(Modifier.height(16.dp))
            HorizontalDivider(color = theme.textSecondary.copy(alpha=0.2f))
            Spacer(Modifier.height(16.dp))
            
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(theme.bgDeep, RoundedCornerShape(8.dp))
                    .padding(12.dp)
            ) {
                Text(metric.title, color = theme.brandSecondary, fontSize = 14.sp, fontWeight = FontWeight.Black)
                Text(metric.subtitle, color = theme.textSecondary, fontSize = 11.sp)
                
                Spacer(modifier = Modifier.height(12.dp))
                
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(4.dp))
                        .background(Color.Black)
                        .padding(12.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = metric.symbol,
                        fontFamily = com.example.ui.theme.ArialNarrowFamily,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = theme.brandPrimary
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = localStakeInput,
                    onValueChange = { localStakeInput = it },
                    label = { Text("Stake Test Value (${metric.unit})", fontSize = 10.5.sp, color = theme.textSecondary) },
                    textStyle = TextStyle(color = theme.textPrimary, fontSize = 12.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily),
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = theme.brandSecondary,
                        unfocusedBorderColor = theme.brandSecondary.copy(alpha = 0.3f)
                    )
                )

                val stakeDouble = localStakeInput.toDoubleOrNull() ?: metric.baseValue
                val simulatedOutput = when (metric) {
                    SandboxMetricType.DELTA_LIMIT -> Math.PI * 2.5 * sqrt(stakeDouble)
                    SandboxMetricType.PHI_RESERVE -> stakeDouble * 1.6180339887
                    SandboxMetricType.TRANSACTION_FEE -> stakeDouble * 0.0075
                    SandboxMetricType.SHIELD_PREMIUM -> stakeDouble * 0.02
                }

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(6.dp))
                        .background(theme.bgPanel)
                        .padding(10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Calculated Result:", fontSize = 11.sp, color = theme.textSecondary)
                    Text(
                        text = "${String.format("%.4f", simulatedOutput)} ${metric.unit}",
                        fontSize = 11.sp,
                        color = theme.brandPrimary,
                        fontWeight = FontWeight.Bold,
                        fontFamily = com.example.ui.theme.ArialNarrowFamily
                    )
                }

                Spacer(modifier = Modifier.height(14.dp))

                Text("QUANTITATIVE POLYMATH PERSPECTIVE", fontSize = 9.5.sp, color = theme.brandPrimary, fontWeight = FontWeight.Bold)
                Text(
                    text = metric.polymathText,
                    fontSize = 10.5.sp,
                    color = theme.textPrimary,
                    lineHeight = 14.sp,
                    modifier = Modifier.padding(top = 2.dp, bottom = 12.dp)
                )

                Text("IGAMING DESIGNER INTENT", fontSize = 9.5.sp, color = theme.brandSecondary, fontWeight = FontWeight.Bold)
                Text(
                    text = metric.igamingText,
                    fontSize = 10.5.sp,
                    color = theme.textPrimary,
                    lineHeight = 14.sp,
                    modifier = Modifier.padding(top = 2.dp)
                )
            }
        }
    }
}
