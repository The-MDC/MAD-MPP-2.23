package com.example.ui.screens

import com.example.ui.components.HoverTooltip
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.viewmodel.GambitViewModel
import com.example.ui.theme.LocalGambitTheme
import com.example.diagnostics.ErrorDiagnosticsModule
import com.example.diagnostics.ErrorCategory
import com.example.defi.DefiSecurityEngine

enum class AdminRole {
    SUPER_ADMIN,
    MODERATOR,
    ANALYST
}

@Composable
fun AdminPanelScreen(vm: GambitViewModel) {
    val theme = LocalGambitTheme.current
    val state by vm.state.collectAsState()
    var currentRole by remember { 
        mutableStateOf(if (state.authState.isAdmin) AdminRole.SUPER_ADMIN else AdminRole.ANALYST) 
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(theme.bgDeep)
    ) {
        // Top Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(theme.bgPanel)
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column {
                Text("RESTRICTED ACCESS", color = theme.brandAccent, fontSize = 12.sp, fontWeight = FontWeight.Black, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                Text("ADMIN_PORTAL_v1.5", color = theme.textPrimary, fontSize = 24.sp, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ArialNarrowFamily)
            }
            // Role Selector Toggle
            Row(
                modifier = Modifier
                    .border(theme.borderWidth, theme.brandSecondary, RoundedCornerShape(8.dp))
                    .padding(4.dp)
            ) {
                RoleToggleButton("SUPER", currentRole == AdminRole.SUPER_ADMIN, theme, "Full unrestricted access to all endpoints") { currentRole = AdminRole.SUPER_ADMIN }
                RoleToggleButton("MOD", currentRole == AdminRole.MODERATOR, theme, "Access limited to user behavior and platform metrics") { currentRole = AdminRole.MODERATOR }
                RoleToggleButton("DATA", currentRole == AdminRole.ANALYST, theme, "Read-only access to analytics data and dashboards") { currentRole = AdminRole.ANALYST }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp),
            contentPadding = PaddingValues(bottom = 80.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                AdminModuleCard(
                    title = "DIAGNOSTICS & TROUBLESHOOTING",
                    description = "System health, real-time API latency, authentication status, and throughput visualization.",
                    icon = Icons.Filled.Warning,
                    isEnabled = currentRole == AdminRole.SUPER_ADMIN || currentRole == AdminRole.MODERATOR || currentRole == AdminRole.ANALYST,
                    theme = theme
                ) {
                    DiagnosticDashboardSnippet(theme)
                }
            }

            item {
                AdminModuleCard(
                    title = "ERROR HANDLING & EDGE CASES",
                    description = "Centralized real-time logging of Numeric, Boundary, and Logical system exceptions.",
                    icon = Icons.Filled.BugReport,
                    isEnabled = currentRole == AdminRole.SUPER_ADMIN || currentRole == AdminRole.ANALYST,
                    theme = theme
                ) {
                    ErrorLoggingSnippet(theme)
                }
            }

            item {
                AdminModuleCard(
                    title = "OAUTH & API KEYS",
                    description = "Issue, revoke, and manage OAuth 2.0 scopes, Bearer tokens, and secure API keys.",
                    icon = Icons.Filled.Lock,
                    isEnabled = currentRole == AdminRole.SUPER_ADMIN,
                    theme = theme
                ) {
                    OAuthTokensSnippet(theme)
                }
            }
            
            item {
                AdminModuleCard(
                    title = "LIAR METER (MAD HAT) CONFIGURATION",
                    description = "Dynamic throttles for Gemini-powered roast generation and predictive saga GARCH factors.",
                    icon = Icons.Filled.Whatshot,
                    isEnabled = currentRole == AdminRole.SUPER_ADMIN || currentRole == AdminRole.MODERATOR,
                    theme = theme
                ) {
                    LiarMeterConfigSnippet(theme)
                }
            }
            
            item {
                AdminModuleCard(
                    title = "INFORMATION MARKET & CDP",
                    description = "Customer Data Platform routing, liquidity pools & data warehouse suite.",
                    icon = Icons.Filled.Storage,
                    isEnabled = currentRole == AdminRole.SUPER_ADMIN || currentRole == AdminRole.ANALYST,
                    theme = theme
                ) {
                    Text("Total Records Processed: 1.4B", color = theme.textSecondary, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontSize = 12.sp)
                    Spacer(Modifier.height(4.dp))
                    Text("Data Warehouse Latency: 4ms", color = theme.brandSecondary, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontSize = 12.sp)
                }
            }
        }
    }
}

@Composable
fun RoleToggleButton(
    label: String,
    isSelected: Boolean,
    theme: com.example.ui.theme.GambitThemeSpecs,
    tooltip: String,
    onClick: () -> Unit
) {
    HoverTooltip(text = tooltip) {
        Box(
            modifier = Modifier
                .background(
                    if (isSelected) theme.brandSecondary.copy(alpha = 0.2f) else Color.Transparent,
                    RoundedCornerShape(4.dp)
                )
                .clickable { onClick() }
                .padding(horizontal = 8.dp, vertical = 4.dp)
        ) {
            Text(
                label,
                color = if (isSelected) theme.brandSecondary else theme.textSecondary,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = com.example.ui.theme.ArialNarrowFamily
            )
        }
    }
}

@Composable
fun AdminModuleCard(
    title: String,
    description: String,
    icon: ImageVector,
    isEnabled: Boolean,
    theme: com.example.ui.theme.GambitThemeSpecs,
    content: @Composable () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .alpha(if (isEnabled) 1f else 0.4f)
            .background(theme.bgCard.copy(alpha = 0.15f), RoundedCornerShape(12.dp))
            .border(1.dp, if (isEnabled) theme.borderBrush else androidx.compose.ui.graphics.SolidColor(theme.textSecondary.copy(alpha = 0.2f)), RoundedCornerShape(12.dp))
            .padding(16.dp)
    ) {
        Column {
            Row(verticalAlignment = Alignment.Top) {
                Icon(icon, contentDescription = null, tint = if (isEnabled) theme.brandPrimary else theme.textSecondary, modifier = Modifier.size(24.dp))
                Spacer(Modifier.width(12.dp))
                Column {
                    Text(title, color = theme.textPrimary, fontSize = 16.sp, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                    Spacer(Modifier.height(4.dp))
                    Text(description, color = theme.textSecondary, fontSize = 12.sp, lineHeight = 16.sp)
                }
            }
            
            if (isEnabled) {
                Spacer(Modifier.height(16.dp))
                HorizontalDivider(color = theme.bgDeep)
                Spacer(Modifier.height(16.dp))
                content()
            } else {
                Spacer(Modifier.height(16.dp))
                Text("MODULE LOCKED: INSUFFICIENT PRIVILEGES", color = theme.brandAccent, fontSize = 10.5.sp, fontWeight = FontWeight.Black, fontFamily = com.example.ui.theme.ArialNarrowFamily)
            }
        }
    }
}

@Composable
fun DiagnosticDashboardSnippet(theme: com.example.ui.theme.GambitThemeSpecs) {
    val latency by ErrorDiagnosticsModule.currentLatencyMs.collectAsState()
    val throughput by ErrorDiagnosticsModule.systemThroughput.collectAsState()
    val isCircuitTripped by DefiSecurityEngine.isCircuitBreakerTripped.collectAsState()
    val health by ErrorDiagnosticsModule.systemHealth.collectAsState()

    val healthColor = when (health) {
        com.example.diagnostics.SystemHealth.OPTIMAL -> Color(0xFF007BFF) // Blue
        com.example.diagnostics.SystemHealth.NORMAL -> Color(0xFF28A745) // Green
        com.example.diagnostics.SystemHealth.UNSTABLE -> Color(0xFFFFC107) // Yellow
        com.example.diagnostics.SystemHealth.CRITICAL -> Color(0xFFDC3545) // Red
    }

    val goldSolid = Color(0xFFFFD700)
    val goldGlow = Color(0xFFFFD700).copy(alpha = 0.3f)

    Column(Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            MetricBox("API LATENCY", "${latency}ms", theme.textPrimary, theme, Modifier.weight(1f))
            MetricBox("HEALTH STATUS", health.name, healthColor, theme, Modifier.weight(1f))
            MetricBox("AUTH GATEWAY", "SECURE", theme.brandSecondary, theme, Modifier.weight(1f))
        }

        Spacer(Modifier.height(16.dp))
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text("GLOBAL CIRCUIT BREAKER", color = theme.brandAccent, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            HoverTooltip(text = "Emergency circuit breaker: Immediately halts all active DeFi components and locks the liquidity vault integrations.") {
                Button(
                    onClick = { 
                        if(isCircuitTripped) DefiSecurityEngine.resetCircuitBreaker() else DefiSecurityEngine.tripCircuitBreaker()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = if (isCircuitTripped) theme.brandSecondary else theme.brandAccent, contentColor = theme.bgDeep)
                ) {
                    Text(if (isCircuitTripped) "RESET/REACTIVATE" else "TRIP BREAKER", fontFamily = com.example.ui.theme.ArialNarrowFamily, fontWeight = FontWeight.Bold)
                }
            }
        }

        Spacer(Modifier.height(24.dp))
        Text("SYSTEM THROUGHPUT & ANOMALIES (REQ/S)", color = theme.textSecondary, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(8.dp))
        
        // Custom simple line chart matching d3.js aesthetics in dark theme with gold aesthetic
        Box(modifier = Modifier
            .fillMaxWidth()
            .height(120.dp)
            .background(Color(0xFF0F0F1B), RoundedCornerShape(8.dp))
            .border(1.dp, goldSolid, RoundedCornerShape(8.dp))
            .border(1.dp, goldGlow, RoundedCornerShape(8.dp)) // Simulating 0.5pt glow
            .padding(16.dp)
        ) {
            val lineColor = goldSolid
            Canvas(modifier = Modifier.fillMaxSize()) {
                val path = Path()
                val minVal = throughput.minOrNull() ?: 0f
                val maxVal = throughput.maxOrNull() ?: 1f
                val range = maxVal - minVal
                val xStep = size.width / (throughput.size - 1).coerceAtLeast(1)
                
                throughput.forEachIndexed { i, value ->
                    val x = i * xStep
                    val y = size.height - ((value - minVal) / range) * size.height
                    if (i == 0) path.moveTo(x, y) else path.lineTo(x, y)
                }
                
                drawPath(
                    path = path,
                    color = lineColor,
                    style = Stroke(width = 4.dp.toPx(), cap = StrokeCap.Round, join = StrokeJoin.Round)
                )
            }
        }

        Spacer(Modifier.height(24.dp))
        AiDefenderConfigSnippet(theme)
    }
}

@Composable
fun AiDefenderConfigSnippet(theme: com.example.ui.theme.GambitThemeSpecs) {
    var aiModel by remember { mutableStateOf("DUAL_AGENT") }
    var activeMode by remember { mutableStateOf("ACTIVE_DEFENDER") }

    val goldSolid = Color(0xFFFFD700)
    val goldGlow = Color(0xFFFFD700).copy(alpha = 0.3f)

    Column(
        Modifier
            .fillMaxWidth()
            .background(Color(0xFF0F0F1B), RoundedCornerShape(8.dp))
            .border(1.dp, goldSolid, RoundedCornerShape(8.dp))
            .border(1.dp, goldGlow, RoundedCornerShape(8.dp))
            .padding(16.dp)
    ) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text("AI THREAT DEFENDER", color = goldSolid, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontWeight = FontWeight.Bold, fontSize = 14.sp)
            Text("STATUS: SECURE", color = Color(0xFF28A745), fontFamily = com.example.ui.theme.ArialNarrowFamily, fontWeight = FontWeight.Bold, fontSize = 12.sp)
        }
        Spacer(Modifier.height(16.dp))
        Text("MODEL ENGINE (PARALLEL CONFIG)", color = theme.textSecondary, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontSize = 10.5.sp)
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            RoleToggleButton("GEMMA", aiModel == "GEMMA_LOCAL", theme, "Local edge node ML monitor") { aiModel = "GEMMA_LOCAL" }
            RoleToggleButton("GEMINI", aiModel == "GEMINI_PRO", theme, "Cloud-based semantic layer scanning") { aiModel = "GEMINI_PRO" }
            RoleToggleButton("DUAL-PLEX", aiModel == "DUAL_AGENT", theme, "Run both agents in parallel anomaly consensus") { aiModel = "DUAL_AGENT" }
        }
        
        Spacer(Modifier.height(16.dp))
        Text("OPERATIONAL STANCE", color = theme.textSecondary, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontSize = 10.5.sp)
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            RoleToggleButton("PASSIVE ALERT", activeMode == "PASSIVE", theme, "Only log events, do not block") { activeMode = "PASSIVE" }
            RoleToggleButton("ACTIVE DEFENSE", activeMode == "ACTIVE_DEFENDER", theme, "Auto-trip circuit breakers on anomalies") { activeMode = "ACTIVE_DEFENDER" }
        }
    }
}

@Composable
fun ErrorLoggingSnippet(theme: com.example.ui.theme.GambitThemeSpecs) {
    val logs by ErrorDiagnosticsModule.logs.collectAsState()
    val frequencies by ErrorDiagnosticsModule.edgeCaseFrequencies.collectAsState()

    Column(Modifier.fillMaxWidth()) {
        Text("EDGE CASE FREQUENCY", color = theme.textSecondary, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(8.dp))
        
        // Edge Case Bar Chart
        Row(
            modifier = Modifier.fillMaxWidth().height(100.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.Bottom
        ) {
            val maxFreq = frequencies.values.maxOrNull()?.coerceAtLeast(1) ?: 1
            ErrorCategory.values().forEach { category ->
                val freq = frequencies[category] ?: 0
                val heightPercent = (freq.toFloat() / maxFreq)
                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Bottom, modifier = Modifier.fillMaxHeight()) {
                    Text(freq.toString(), color = theme.textPrimary, fontSize = 10.5.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                    Spacer(Modifier.height(4.dp))
                    Box(modifier = Modifier
                        .width(32.dp)
                        .fillMaxHeight(heightPercent.coerceAtLeast(0.05f))
                        .background(getCategoryColor(category, theme), RoundedCornerShape(topStart = 4.dp, topEnd = 4.dp))
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(category.name.take(3), color = theme.textSecondary, fontSize = 10.5.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                }
            }
        }

        Spacer(Modifier.height(24.dp))
        Text("REAL-TIME ERROR LOGS", color = theme.textSecondary, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(8.dp))
        
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .height(200.dp)
                .background(theme.bgDeep, RoundedCornerShape(8.dp))
                .border(theme.borderWidth, theme.textSecondary.copy(alpha = 0.2f), RoundedCornerShape(8.dp))
                .padding(8.dp)
        ) {
            logs.take(5).forEach { log ->
                val catColor = getCategoryColor(log.category, theme)
                Column(Modifier.fillMaxWidth().padding(bottom = 8.dp)) {
                    Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                        Text("[${ErrorDiagnosticsModule.formatTime(log.timestamp)}] ${log.category}", color = catColor, fontSize = 10.5.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontWeight = FontWeight.Bold)
                        Text(log.component, color = theme.textSecondary, fontSize = 10.5.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                    }
                    Text(log.message, color = theme.textPrimary, fontSize = 12.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
                    Text(log.stackTraceSnippet, color = theme.textSecondary, fontSize = 10.5.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily, lineHeight = 12.sp)
                }
            }
        }
    }
}

fun getCategoryColor(category: ErrorCategory, theme: com.example.ui.theme.GambitThemeSpecs): Color {
    return when (category) {
        ErrorCategory.NUMERIC -> theme.brandPrimary
        ErrorCategory.ARRAY_STRING -> theme.brandSecondary
        ErrorCategory.GRAPH_TREE -> Color(0xFF9C27B0)
        ErrorCategory.BOUNDARY_CONSTRAINT -> theme.brandSecondary
        ErrorCategory.CRITICAL -> Color.Red
        ErrorCategory.HIGH_RISK -> Color(0xFFFF5722)
        ErrorCategory.WARNING -> Color(0xFFFFC107)
        ErrorCategory.NOTICE -> Color(0xFF03A9F4)
        ErrorCategory.SYSTEM_ANOMALY -> Color.Red
    }
}

@Composable
fun OAuthTokensSnippet(theme: com.example.ui.theme.GambitThemeSpecs) {
    Column {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text("Active API Keys: 42", color = theme.brandPrimary, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontSize = 12.sp)
                Text("Expired Tokens: 1024", color = theme.textSecondary, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontSize = 12.sp)
            }
            HoverTooltip(text = "Provisions a new high-entropy OAuth 2.0 API token for secure system access.") {
                Button(onClick={}, colors = ButtonDefaults.buttonColors(containerColor = theme.brandPrimary, contentColor = theme.bgDeep)) {
                    Text("GENERATE KEY", fontFamily = com.example.ui.theme.ArialNarrowFamily, fontWeight = FontWeight.Bold)
                }
            }
        }
        Spacer(Modifier.height(16.dp))
        Box(modifier = Modifier.fillMaxWidth().background(theme.bgDeep, RoundedCornerShape(8.dp)).padding(12.dp)) {
            Column {
                Text("OAUTH 2.0 SCOPES", color = theme.textSecondary, fontSize = 10.5.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(8.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    ScopeBadge("read:users", true, theme)
                    ScopeBadge("write:logs", true, theme)
                    ScopeBadge("delete:sys", false, theme)
                }
            }
        }
    }
}

@Composable
fun ScopeBadge(scope: String, active: Boolean, theme: com.example.ui.theme.GambitThemeSpecs) {
    val bgColor = if (active) theme.brandSecondary.copy(alpha = 0.2f) else theme.bgPanel
    val fgColor = if (active) theme.brandSecondary else theme.textSecondary
    
    Box(modifier = Modifier.background(bgColor, RoundedCornerShape(16.dp)).border(1.dp, fgColor.copy(alpha = 0.5f), RoundedCornerShape(16.dp)).padding(horizontal = 8.dp, vertical = 4.dp)) {
        Text(scope, color = fgColor, fontSize = 10.5.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
    }
}

@Composable
fun MetricBox(label: String, value: String, color: Color, theme: com.example.ui.theme.GambitThemeSpecs, modifier: Modifier) {
    Column(
        modifier = modifier
            .background(theme.bgPanel, RoundedCornerShape(8.dp))
            .border(theme.borderWidth, theme.textSecondary.copy(alpha = 0.1f), RoundedCornerShape(8.dp))
            .padding(12.dp),
        horizontalAlignment = Alignment.Start
    ) {
        Text(value, color = color, fontSize = 20.sp, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ArialNarrowFamily)
        Text(label, color = theme.textSecondary, fontSize = 10.5.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
    }
}

@Composable
fun LiarMeterConfigSnippet(theme: com.example.ui.theme.GambitThemeSpecs) {
    var roastSeverity by remember { mutableStateOf(70f) }
    var memeHumour by remember { mutableStateOf(65f) }

    Column(Modifier.fillMaxWidth()) {
        Text("ROAST SEVERITY: ${roastSeverity.toInt()}", color = theme.brandAccent, fontSize = 12.sp, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ArialNarrowFamily)
        Slider(
            value = roastSeverity,
            onValueChange = { roastSeverity = it },
            valueRange = 0f..100f,
            colors = SliderDefaults.colors(
                thumbColor = theme.brandAccent,
                activeTrackColor = theme.brandAccent,
                inactiveTrackColor = theme.textSecondary.copy(alpha = 0.3f)
            )
        )
        Text("Modulates the satirical tone from mild sarcasm to nuclear-level South Park style.", color = theme.textSecondary, fontSize = 10.5.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
        
        Spacer(Modifier.height(16.dp))

        Text("MEME HUMOUR: ${memeHumour.toInt()}", color = theme.brandSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ArialNarrowFamily)
        Slider(
            value = memeHumour,
            onValueChange = { memeHumour = it },
            valueRange = 0f..100f,
            colors = SliderDefaults.colors(
                thumbColor = theme.brandSecondary,
                activeTrackColor = theme.brandSecondary,
                inactiveTrackColor = theme.textSecondary.copy(alpha = 0.3f)
            )
        )
        Text("Balances the meme-centric chaos versus structural dark humour inside generations.", color = theme.textSecondary, fontSize = 10.5.sp, fontFamily = com.example.ui.theme.ArialNarrowFamily)
    }
}

