package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.LocalGambitTheme
import com.example.ui.theme.BrandGold
import com.example.ui.theme.BrandCrimson
import com.example.ui.theme.NeonGreen

@Composable
fun WagerConfirmationDialog(
    isOpen: Boolean,
    onConfirm: () -> Unit,
    onCancel: () -> Unit,
    amount: Double,
    scenarioName: String,
    outcome: String
) {
    if (!isOpen) return
    val theme = LocalGambitTheme.current
    
    AlertDialog(
        onDismissRequest = onCancel,
        containerColor = theme.bgDeep,
        shape = RoundedCornerShape(12.dp),
        title = {
            Text(
                text = "⚡ CONVICTION WAGER CONFIRMATION",
                color = theme.brandSecondary,
                fontSize = 14.sp,
                fontWeight = FontWeight.Black
            )
        },
        text = {
            Column {
                Text(
                    text = "You are about to commit your Gambit Tokens to the prediction neural mesh.",
                    color = theme.textSecondary,
                    fontSize = 11.sp
                )
                Spacer(Modifier.height(16.dp))
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(theme.bgCard, RoundedCornerShape(8.dp))
                        .border(1.dp, theme.borderBrush, RoundedCornerShape(8.dp))
                        .padding(12.dp)
                ) {
                    Text(text = "TARGET CLUSTER:", color = theme.textSecondary, fontSize = 9.sp)
                    Text(text = scenarioName, color = theme.textPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(8.dp))
                    
                    Text(text = "STANCE:", color = theme.textSecondary, fontSize = 9.sp)
                    Text(text = outcome, color = if(outcome == "YES" || outcome == "BULL") NeonGreen else BrandCrimson, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(8.dp))
                    
                    Text(text = "COMMITMENT:", color = theme.textSecondary, fontSize = 9.sp)
                    Text(text = "${amount.toInt()} MADx", color = BrandGold, fontSize = 14.sp, fontWeight = FontWeight.Black)
                }
                Spacer(Modifier.height(12.dp))
                Text(
                    text = "Warning: Smart contracts are immutable. Volatility may cause rapid liquidations.",
                    color = BrandCrimson,
                    fontSize = 9.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = onConfirm,
                colors = ButtonDefaults.buttonColors(containerColor = theme.brandPrimary),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("EXECUTE", color = theme.bgDeep, fontWeight = FontWeight.Black, fontSize = 11.sp)
            }
        },
        dismissButton = {
            TextButton(onClick = onCancel) {
                Text("ABORT", color = theme.textSecondary, fontSize = 11.sp)
            }
        }
    )
}
