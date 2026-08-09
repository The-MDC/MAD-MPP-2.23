package com.example.ui.components

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.DialogProperties
import com.example.model.MarketState
import com.example.ui.theme.ArialNarrowFamily
import com.example.ui.theme.ArialFamily
import com.example.ui.theme.LocalGambitTheme

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExportSummaryDialog(
    isOpen: Boolean,
    onClose: () -> Unit,
    state: MarketState,
    triggerToast: (String) -> Unit = {}
) {
    if (!isOpen) return

    val theme = LocalGambitTheme.current
    val context = LocalContext.current
    val scrollState = rememberScrollState()

    // Retrieve Z-Lie and general active events
    val activeResult = state.liarMeterResult
    val bookmarkedEvents = state.activeScenarios.filter { state.bookmarkedScenarioIds.contains(it.id) }
    val displayEvents = if (bookmarkedEvents.isNotEmpty()) bookmarkedEvents else state.activeScenarios.take(3)

    // Formulate a completely jargon-free text export memo
    val memoText = buildString {
        appendLine("============== PUBLIC CONVICTION & INTEGRITY RECONCILIATION SUMMARY ==============")
        appendLine("Report Compiled: ${java.text.DateFormat.getDateTimeInstance().format(java.util.Date())}")
        appendLine("Classification: Public Domain Verification Record\n")
        
        if (activeResult != null) {
            appendLine("[SECTION A: VERIFIED STATEMENT AND INTEGRITY AUDIT]")
            appendLine("Audited Statement Source : ${activeResult.speaker}")
            appendLine("System Theme             : ${activeResult.category.uppercase()}")
            appendLine("Sincerity Rating  : ${activeResult.trustScore.toInt()}% Sincere Sincerity Score")
            appendLine("Probability profile : ${activeResult.factualConsistency}")
            appendLine("Projected Impact  : Social attention shift estimated near ${activeResult.economicImpact.projectedStockMovePct}% deviation with a public confidence metric of ${activeResult.economicImpact.confidence.toInt()}%.\n")
        } else {
            appendLine("[SECTION A: VERIFIED STATEMENT AND INTEGRITY AUDIT]")
            appendLine("No specific statement analysis ran in this session. Integrity scores holding baseline normal.\n")
        }

        appendLine("[SECTION B: TRACKED PUBLIC consensus streams]")
        if (displayEvents.isEmpty()) {
            appendLine("No tracked alignment streams are currently selected.")
        } else {
            displayEvents.forEachIndexed { idx, valItem ->
                appendLine("${idx + 1}. Event Option: ${valItem.name}")
                appendLine("   Global Category: ${valItem.category}")
                appendLine("   Community Agreement Level: ${(valItem.sentimentBullishRatio * 100).toInt()}%")
                val energyRank = if (valItem.crowdConvictionSpeed >= 6.0) "High Interest Swarm" else "Steady Balanced Discourse"
                appendLine("   Public Engagement Rate   : $energyRank (Turbulence: ${String.format("%.1f", valItem.crowdConvictionSpeed)} Units)")
            }
        }
        appendLine("\n============================= END OF VERIFIED DOCUMENT =============================")
    }

    AlertDialog(
        onDismissRequest = onClose,
        modifier = Modifier
            .fillMaxWidth(0.95f)
            .heightIn(max = 620.dp),
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .glassContainerBackground(theme.bgCard.copy(alpha = 0.95f), RoundedCornerShape(24.dp))
                .border(1.2.dp, theme.brandPrimary.copy(alpha = 0.4f), RoundedCornerShape(24.dp))
                .padding(20.dp)
        ) {
            Column(
                modifier = Modifier.fillMaxSize()
            ) {
                // Title header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "📤 EXPORT VERIFIED CONVICTION REPORT",
                        color = theme.brandAccent,
                        fontSize = 11.5.sp,
                        fontWeight = FontWeight.ExtraBold,
                        fontFamily = ArialNarrowFamily,
                        style = TextStyle(
                            shadow = Shadow(
                                color = theme.brandAccent.copy(alpha = 0.4f),
                                blurRadius = 4f
                            )
                        )
                    )
                    IconButton(
                        onClick = onClose,
                        modifier = Modifier.size(24.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Dismiss",
                            tint = Color.LightGray,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "A simplified, completely jargon-free breakdown of your verification outcomes, ready to share.",
                    color = Color.LightGray,
                    fontSize = 10.sp,
                    fontFamily = ArialNarrowFamily
                )

                HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp), color = Color.Gray.copy(alpha = 0.2f))

                // Scrollable content area representing report
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color.Black.copy(alpha = 0.4f))
                        .border(1.dp, Color.Gray.copy(alpha = 0.15f), RoundedCornerShape(12.dp))
                        .padding(14.dp)
                        .verticalScroll(scrollState)
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                        
                        // Z-Lie Summary Card
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(
                                "📋 STATEMENT INTEGRITY SUMMARY",
                                color = theme.brandPrimary,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = ArialNarrowFamily
                            )
                            if (activeResult != null) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(theme.bgCard.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                                        .padding(8.dp)
                                ) {
                                    Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                                        Text("Integrity Statement Speaker: ${activeResult.speaker}", color = Color.White, fontSize = 11.5.sp, fontWeight = FontWeight.Medium, fontFamily = ArialFamily)
                                        Row(
                                            modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Text("Sincerity Level: ${activeResult.trustScore.toInt()}%", color = Color(0xFF00FF88), fontSize = 10.sp, fontFamily = ArialNarrowFamily, fontWeight = FontWeight.Bold)
                                            Text("Audience Impact: ${activeResult.economicImpact.confidence.toInt()}% aligned", color = Color.LightGray, fontSize = 10.sp, fontFamily = ArialNarrowFamily)
                                        }
                                    }
                                }
                            } else {
                                Text(
                                    "No custom audit conducted. Telemetry integrity baseline is within 100% normal threshold.",
                                    color = Color.Gray,
                                    fontSize = 10.sp,
                                    fontFamily = ArialNarrowFamily
                                )
                            }
                        }

                        // Tracked Events Checklist (Jargon-Free)
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(
                                "🔍 TRACKED VERIFICATION INSTANCES",
                                color = theme.brandAccent,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = ArialNarrowFamily
                            )
                            displayEvents.forEach { ev ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(Color.White.copy(alpha = 0.03f), RoundedCornerShape(8.dp))
                                        .border(0.5.dp, Color.White.copy(alpha = 0.05f), RoundedCornerShape(8.dp))
                                        .padding(8.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.CheckCircle,
                                        contentDescription = "Checked",
                                        tint = theme.brandPrimary,
                                        modifier = Modifier.size(14.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(ev.name, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold, fontFamily = ArialFamily)
                                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                            Text("Sect: ${ev.category}", color = theme.textSecondary, fontSize = 9.sp, fontFamily = ArialNarrowFamily)
                                            Text("Agreement: ${(ev.sentimentBullishRatio * 100).toInt()}%", color = theme.brandPrimary, fontSize = 9.sp, fontFamily = ArialNarrowFamily)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp), color = Color.Gray.copy(alpha = 0.2f))

                // Action controls: copy to clipboard or close
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Button(
                        onClick = onClose,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color.DarkGray.copy(alpha = 0.4f),
                            contentColor = Color.White
                        ),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.weight(1f),
                        contentPadding = PaddingValues(vertical = 10.dp)
                    ) {
                        Text("DISMISS", fontSize = 11.sp, fontWeight = FontWeight.Bold, fontFamily = ArialNarrowFamily)
                    }

                    Button(
                        onClick = {
                            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                            val clip = ClipData.newPlainText("Verified Conviction Summary", memoText)
                            clipboard.setPrimaryClip(clip)
                            triggerToast("Simplified Report copied to clipboard!")
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = theme.brandPrimary,
                            contentColor = Color.Black
                        ),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.weight(1.3f).border(1.dp, theme.brandPrimary.copy(alpha = 0.5f), RoundedCornerShape(10.dp)),
                        contentPadding = PaddingValues(vertical = 10.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Icon(Icons.Default.ContentCopy, contentDescription = "Copy", modifier = Modifier.size(13.dp))
                            Text("COPY VERIFIED REPORT", fontSize = 10.5.sp, fontWeight = FontWeight.ExtraBold, fontFamily = ArialNarrowFamily)
                        }
                    }
                }
            }
        }
    }
}
