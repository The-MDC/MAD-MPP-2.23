package com.example.ui.screens

import com.example.ui.components.HoverTooltip
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.viewmodel.GambitViewModel
import com.example.ui.theme.LocalGambitTheme
import com.example.defi.AssetProtocol
import com.example.defi.DefiSecurityEngine
import kotlinx.coroutines.launch

@Composable
fun MorphoVaultScreen(vm: GambitViewModel) {
    val theme = LocalGambitTheme.current
    val coroutineScope = rememberCoroutineScope()
    var depositAmount by remember { mutableStateOf("1000") }
    var transactionStatus by remember { mutableStateOf("") }
    var simulationResult by remember { mutableStateOf<DefiSecurityEngine.SimulationResult?>(null) }
    val isCircuitBreakerTripped by DefiSecurityEngine.isCircuitBreakerTripped.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(theme.bgDeep)
            .padding(16.dp)
    ) {
        Text("STRICTLY OVERCOLLATERALIZED", color = theme.brandAccent, fontSize = 12.sp, fontWeight = FontWeight.Black, fontFamily = com.example.ui.theme.ArialNarrowFamily)
        Text("MORPHO_VAULT_YIELD", color = theme.textPrimary, fontSize = 24.sp, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ArialNarrowFamily)
        
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
                    colors = CardDefaults.cardColors(containerColor = theme.bgCard.copy(alpha = 0.15f)),
                    shape = RoundedCornerShape(12.dp),
                    border = BorderStroke(theme.borderWidth, theme.borderBrush)
                ) {
                    Column(Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Filled.AccountBalance, contentDescription = null, tint = theme.brandPrimary)
                            Spacer(Modifier.width(8.dp))
                            Text("WETH / USDC ORBITAL VAULT", color = theme.textPrimary, fontSize = 16.sp, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                        }
                        Spacer(Modifier.height(8.dp))
                        Text("Current APY: ~4.2% Base + MORPHO Rewards", color = theme.brandSecondary, fontSize = 12.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                        Text("Collateralization Enforced: > 120%", color = theme.textSecondary, fontSize = 12.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                        
                        Spacer(Modifier.height(16.dp))
                        
                        OutlinedTextField(
                            value = depositAmount,
                            onValueChange = { depositAmount = it },
                            label = { Text("Amount (USD)", color = theme.textSecondary, fontFamily = com.example.ui.theme.ArialNarrowFamily) },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = theme.brandPrimary,
                                unfocusedBorderColor = theme.textSecondary.copy(alpha = 0.5f),
                                focusedTextColor = theme.textPrimary,
                                unfocusedTextColor = theme.textPrimary
                            ),
                            modifier = Modifier.fillMaxWidth()
                        )
                        
                        Spacer(Modifier.height(16.dp))
                        
                        HoverTooltip(text = "Preview slippage, expected morpho rates, and gas before executing (Simulation).") {
                            Button(
                                onClick = {
                                    val amt = depositAmount.toDoubleOrNull() ?: 0.0
                                    simulationResult = DefiSecurityEngine.simulateTransaction(AssetProtocol.USDC, amt)
                                    transactionStatus = ""
                                },
                                enabled = !isCircuitBreakerTripped,
                                colors = ButtonDefaults.buttonColors(containerColor = theme.brandSecondary, contentColor = theme.bgDeep),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text("SIMULATE TRANSACTION", fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ArialNarrowFamily)
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
                                    Text("Est. C-Token Output: ${res.expectedOutput}", color = theme.textPrimary, fontSize = 11.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                                    if(res.warning != null) {
                                        Text(res.warning, color = theme.brandAccent, fontSize = 11.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                                    }
                                }
                            }
                            Spacer(Modifier.height(8.dp))
                            if (res.isSafe) {
                                HoverTooltip(text = "Supplies USDC directly to Morpho isolated markets. Subject to $100k hard cap per transaction. Risk-isolated to USDC/WETH pair.") {
                                    Button(
                                        onClick = {
                                            val amt = depositAmount.toDoubleOrNull() ?: 0.0
                                            val isValid = DefiSecurityEngine.validateTransaction(AssetProtocol.USDC, amt)
                                            transactionStatus = if (isValid) {
                                                simulationResult = null
                                                "[SUCCESS] DEPOSITED $amt USDC INTO MORPHO LAYER"
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
            
            item {
                Text("RISK ASSESSMENT & ISOLATION", color = theme.textSecondary, fontSize = 12.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    RiskBadge("NATIVE USDC ONLY", theme.brandSecondary, theme)
                    RiskBadge("ISOLATED RISK MKTS", theme.brandSecondary, theme)
                    RiskBadge("NO LONG TAIL ASSETS", theme.brandPrimary, theme)
                }
            }
        }
    }
}

@Composable
fun RiskBadge(label: String, color: Color, theme: com.example.ui.theme.GambitThemeSpecs) {
    Box(Modifier.border(1.dp, color, RoundedCornerShape(4.dp)).padding(horizontal = 8.dp, vertical = 4.dp).background(color.copy(alpha=0.1f))) {
        Text(label, color = color, fontSize = 10.5.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontWeight = FontWeight.Bold)
    }
}
