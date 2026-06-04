package com.example.ui.screens

import com.example.ui.components.HoverTooltip
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material.icons.filled.Waves
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.viewmodel.GambitViewModel
import com.example.ui.theme.LocalGambitTheme
import com.example.defi.AssetProtocol
import com.example.defi.DefiSecurityEngine

@Composable
fun AerodromeLiquidityScreen(vm: GambitViewModel) {
    val theme = LocalGambitTheme.current
    var maddexAmount by remember { mutableStateOf("500") }
    var transactionStatus by remember { mutableStateOf("") }
    var simulationResult by remember { mutableStateOf<DefiSecurityEngine.SimulationResult?>(null) }
    val isCircuitBreakerTripped by DefiSecurityEngine.isCircuitBreakerTripped.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(theme.bgDeep)
            .padding(16.dp)
    ) {
        Text("DEX V3 CONCENTRATED", color = theme.brandAccent, fontSize = 12.sp, fontWeight = FontWeight.Black, fontFamily = com.example.ui.theme.ArialNarrowFamily)
        Text("AERODROME_HUB", color = theme.textPrimary, fontSize = 24.sp, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ArialNarrowFamily)
        
        Spacer(modifier = Modifier.height(16.dp))

        if (isCircuitBreakerTripped) {
            Box(Modifier.fillMaxWidth().background(theme.brandAccent.copy(alpha = 0.2f), RoundedCornerShape(8.dp)).border(theme.borderWidth, theme.brandAccent, RoundedCornerShape(8.dp)).padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.Warning, contentDescription = null, tint = theme.brandAccent)
                    Spacer(Modifier.width(8.dp))
                    Text("CIRCUIT BREAKER ACTIVE - OPERATIONS SUSPENDED", color = theme.brandAccent, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontWeight = FontWeight.Bold)
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(bottom = 80.dp)
        ) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = theme.bgCard),
                    shape = RoundedCornerShape(12.dp),
                    border = BorderStroke(theme.borderWidth, theme.borderBrush)
                ) {
                    Column(Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Filled.Waves, contentDescription = null, tint = theme.brandSecondary)
                            Spacer(Modifier.width(8.dp))
                            Text("MADDEX / USDC SLIPPAGE-PROTECTED LP", color = theme.textPrimary, fontSize = 16.sp, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                        }
                        Spacer(Modifier.height(8.dp))
                        Text("Current APR: ~18.5% (Emissions strictly bound)", color = theme.brandPrimary, fontSize = 12.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                        
                        Spacer(Modifier.height(16.dp))
                        
                        OutlinedTextField(
                            value = maddexAmount,
                            onValueChange = { maddexAmount = it },
                            label = { Text("MADDEX Amount", color = theme.textSecondary, fontFamily = com.example.ui.theme.ArialNarrowFamily) },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = theme.brandSecondary,
                                unfocusedBorderColor = theme.textSecondary.copy(alpha = 0.5f),
                                focusedTextColor = theme.textPrimary,
                                unfocusedTextColor = theme.textPrimary
                            ),
                            modifier = Modifier.fillMaxWidth()
                        )
                        
                        Spacer(Modifier.height(16.dp))
                        
                        HoverTooltip(text = "Preview impermanent loss risk, expected LP tokens, and slippage bounds.") {
                            Button(
                                onClick = {
                                    val amt = maddexAmount.toDoubleOrNull() ?: 0.0
                                    simulationResult = DefiSecurityEngine.simulateTransaction(AssetProtocol.MADDEX, amt)
                                    transactionStatus = ""
                                },
                                enabled = !isCircuitBreakerTripped,
                                colors = ButtonDefaults.buttonColors(containerColor = theme.brandSecondary, contentColor = theme.bgDeep),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text("SIMULATE LP PROVISION", fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                            }
                        }
                        
                        if (simulationResult != null) {
                            Spacer(Modifier.height(8.dp))
                            val res = simulationResult!!
                            Box(Modifier.fillMaxWidth().background(theme.bgDeep, RoundedCornerShape(8.dp)).padding(12.dp)) {
                                Column {
                                    Text(if(res.isSafe) "PRE-CHECK: SAFE" else "PRE-CHECK: BLOCKED", color = if(res.isSafe) theme.brandSecondary else theme.brandAccent, fontSize = 12.sp, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                                    Spacer(Modifier.height(4.dp))
                                    Text("Estimated Gas: ${String.format("%.2f", res.gasFeeUsd)} USD", color = theme.textSecondary, fontSize = 11.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                                    Text("Est. LP Token Output: ${res.expectedOutput}", color = theme.textPrimary, fontSize = 11.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                                    Text("Est. Slippage: ${res.slippageBps} bps", color = theme.textPrimary, fontSize = 11.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                                    if(res.warning != null) {
                                        Text(res.warning, color = theme.brandAccent, fontSize = 11.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                                    }
                                }
                            }
                            Spacer(Modifier.height(8.dp))
                            if (res.isSafe) {
                                HoverTooltip(text = "Provisions concentrated liquidity into Aerodrome V3 MADDEX/USDC pools. Strict boundaries and $10k equivalent TVL cap per transaction.") {
                                    Button(
                                        onClick = {
                                            val amt = maddexAmount.toDoubleOrNull() ?: 0.0
                                            val isValid = DefiSecurityEngine.validateTransaction(AssetProtocol.MADDEX, amt)
                                            transactionStatus = if (isValid) {
                                                simulationResult = null
                                                "[SUCCESS] PROVISIONED ${amt} MADDEX TO V3 CL POOL"
                                            } else {
                                                "[FAILED] BLOCKED BY DEFI SECURITY ENGINE. SEE ADMIN LOGS."
                                            }
                                        },
                                        enabled = !isCircuitBreakerTripped,
                                        colors = ButtonDefaults.buttonColors(containerColor = theme.brandPrimary, contentColor = theme.bgDeep),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Text("CONFIRM DEPOSIT", fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                                    }
                                }
                            }
                        }
                        
                        if (transactionStatus.isNotEmpty()) {
                            Spacer(Modifier.height(8.dp))
                            Text(transactionStatus, color = if (transactionStatus.contains("SUCCESS")) theme.brandSecondary else theme.brandAccent, fontSize = 12.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                        }
                    }
                }
            }
        }
    }
}
