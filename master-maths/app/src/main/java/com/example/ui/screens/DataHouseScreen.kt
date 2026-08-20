package com.example.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.*
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.LocalGambitTheme
import com.example.ui.theme.GoldFlakeBrush
import com.example.ui.components.HoverTooltip
import com.example.viewmodel.GambitViewModel
import kotlinx.coroutines.delay
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import kotlin.math.*
import kotlin.random.Random

// Data classes for interactive elements
data class NeuralLogEntry(
    val id: String,
    val timestamp: String,
    val level: String, // "SUCCESS", "INFO", "WARN", "ERROR", "MADHATR"
    val tag: String,
    val message: String
)

data class NeuralMilestone(
    val id: String,
    val title: String,
    val category: String, // "NEURO", "MATH", "GAMBIT", "REWARD"
    val date: String,
    val isCompleted: Boolean
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DataHouseScreen(vm: GambitViewModel) {
    val scrollState = rememberScrollState()
    val theme = LocalGambitTheme.current

    // Live clock state representing UTC timezone sync
    var utcTimeStr by remember { mutableStateOf("SYS_UTC 00:00:00") }
    LaunchedEffect(Unit) {
        while (true) {
            val now = LocalDateTime.now(ZoneId.of("UTC"))
            utcTimeStr = "SYS_UTC " + now.format(DateTimeFormatter.ofPattern("HH:mm:ss"))
            delay(1000)
        }
    }

    // Cognitive tension parameters linked to math curves
    var fibMultiplier by remember { mutableStateOf(1.618f) }
    var quadraticWeight by remember { mutableStateOf(61.8f) }
    var dopamineFrequency by remember { mutableStateOf(45f) }

    // Calculated state: Reward Surprise Ratio (simulated dopamine level based on settings)
    val rewardSurpriseRatio = remember(fibMultiplier, quadraticWeight) {
        (50.0f + (fibMultiplier * 15f) + (quadraticWeight * 0.4f)).coerceIn(10f, 150f)
    }

    // Interactive power state representing neural recharge status
    var isCharging by remember { mutableStateOf(false) }

    // Calibration runners for math execution models
    var runnerMode by remember { mutableStateOf("COBB-DOUGLAS INDEX") }

    // Milestones list state with customized neuroscience milestones
    val milestones = remember {
        mutableStateListOf(
            NeuralMilestone("m1", "Calibrate quadratic conviction rewards", "MATH", "Jun 2026", false),
            NeuralMilestone("m2", "Optimize variable-ratio dopamine intervals", "NEURO", "Jun 2026", false),
            NeuralMilestone("m3", "Deploy the MADHAT'r AI persona node", "GAMBIT", "Jun 2026", true)
        )
    }

    var newMilestoneText by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf("NEURO") }
    var isCategoryDropdownOpen by remember { mutableStateOf(false) }

    // Live logging list customized to MAD Gambit's unhinged and deep neuroscience context
    val terminalLogs = remember {
        mutableStateListOf(
            NeuralLogEntry("l1", "09:12:01", "SUCCESS", "RECEPTORS", "Neuro-dopamine receptor loops active. Spikes calibrated to 120Hz."),
            NeuralLogEntry("l2", "09:12:02", "INFO", "COGNITION", "Fibonacci conviction database running smoothly. No logic leaks detected."),
            NeuralLogEntry("l3", "09:12:03", "INFO", "SYNAPSE", "Awaiting synaptic user triggers..."),
            NeuralLogEntry("l4", "09:21:21", "WARN", "ADRENALINE", "Adrenaline spikes detected. Deploying Top-Hat calming buffers.")
        )
    }

    fun appendLog(level: String, tag: String, message: String) {
        val timeNow = LocalDateTime.now(ZoneId.of("UTC")).format(DateTimeFormatter.ofPattern("HH:mm:ss"))
        terminalLogs.add(NeuralLogEntry(Random.nextInt().toString(), timeNow, level, tag, message))
    }

    BoxWithConstraints(
        modifier = Modifier
            .fillMaxSize()
            .background(theme.bgDeep)
    ) {
        val isWideScreen = maxWidth > 900.dp

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
        ) {
            // WORKBENCH TOP BAR PANEL
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .background(Color.Red, CircleShape)
                        )
                        Spacer(Modifier.width(8.dp))
                        Text(
                            text = "MAD GAMBIT :: NEURO-DOPAMINE ENGINE",
                            color = Color.White,
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp,
                            modifier = Modifier.testTag("workbench_title")
                        )
                        Spacer(Modifier.width(8.dp))
                        Text(
                            text = "[PHI-v1.6]",
                            color = Color(0xFFFFD700),
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                    }
                    Text(
                        text = "QUADRATIC CONVICTION FORECASTING & REAL-TIME REWARD LOOP OPTIMIZER",
                        color = theme.textSecondary.copy(alpha = 0.8f),
                        fontFamily = FontFamily.Monospace,
                        fontSize = 10.sp,
                        letterSpacing = 0.5.sp
                    )
                }

                // Header status badges
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // THEME BADGE
                    Box(
                        modifier = Modifier
                            .background(Color(0xFF161936), RoundedCornerShape(4.dp))
                            .border(0.5.dp, Color.Gray, RoundedCornerShape(4.dp))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text("THEME: SATIRICAL MATTE", color = Color.White, fontSize = 9.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                    }

                    // FIBONACCI BADGE
                    Box(
                        modifier = Modifier
                            .background(Color(0xFF332010), RoundedCornerShape(4.dp))
                            .border(0.75.dp, Color(0xFFFFA500), RoundedCornerShape(4.dp))
                            .clickable {
                                appendLog("MADHATR", "🎩 MADHAT'R", "Whaddya clickin' the Fibonacci Conviction badge for? Ya lookin' to get audited or what?")
                            }
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text("FIBONACCI CONVICTION", color = Color(0xFFFFF000), fontSize = 9.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                    }

                    // NEURAL FEED STATUS
                    Box(
                        modifier = Modifier
                            .background(Color(0xFF0F2620), RoundedCornerShape(4.dp))
                            .border(0.75.dp, Color(0xFF10B981), RoundedCornerShape(4.dp))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(6.dp)
                                    .background(Color(0xFF10B981), CircleShape)
                            )
                            Spacer(Modifier.width(4.dp))
                            Text("NEURAL REWARD ONLINE", color = Color(0xFF10B981), fontSize = 9.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                        }
                    }

                    // SYS UTC BADGE
                    Box(
                        modifier = Modifier
                            .background(Color(0xFF1A1A1A), RoundedCornerShape(4.dp))
                            .border(0.5.dp, Color.DarkGray, RoundedCornerShape(4.dp))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(utcTimeStr, color = Color.White, fontSize = 9.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                    }
                }
            }

            // MAIN CONTENT ROW
            if (isWideScreen) {
                Row(
                    modifier = Modifier.weight(1f),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // LEFT COLUMN: DEVICE EMULATOR
                    Column(
                        modifier = Modifier
                            .width(340.dp)
                            .fillMaxHeight(),
                        verticalArrangement = Arrangement.SpaceBetween
                    ) {
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxWidth()
                        ) {
                            DeviceEmulatorFrame(
                                fibMultiplier = fibMultiplier,
                                quadraticWeight = quadraticWeight,
                                dopamineFrequency = dopamineFrequency,
                                rewardSurpriseRatio = rewardSurpriseRatio,
                                onFibMultiplierChange = {
                                    fibMultiplier = it
                                    if (Random.nextFloat() > 0.7f) {
                                        appendLog("INFO", "FIBONACCI", "Fibonacci coefficient shifted to ${"%.3f".format(it)}. Adjusting reward decay matrix.")
                                    }
                                },
                                onQuadraticWeightChange = {
                                    quadraticWeight = it
                                    if (Random.nextFloat() > 0.7f) {
                                        appendLog("INFO", "CONVICTION", "Quadratic Conviction Weight calibrated to ${it.toInt()}%. Integrating voting power.")
                                    }
                                },
                                onDopamineFrequencyChange = { dopamineFrequency = it },
                                logs = terminalLogs
                            )
                        }

                        Spacer(Modifier.height(8.dp))

                        // NEURAL RECEPTOR CALIBRATOR WIDGET
                        PowerChargerWidget(
                            isCharging = isCharging,
                            onToggleCharge = {
                                isCharging = !isCharging
                                if (isCharging) {
                                    appendLog("SUCCESS", "SYNAPSE", "Neuro-receptor continuous loop engaged. Custom conviction model active.")
                                } else {
                                    appendLog("WARN", "RECEPTORS", "Neuro-receptor continuous loop disengaged. Reverting to baseline.")
                                }
                            }
                        )
                    }

                    // RIGHT COLUMN: TELEMETRY CARD STACK
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxHeight()
                            .verticalScroll(scrollState),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        // CARD 1: CONVICTION DECAY MATH PLOT
                        DriftCalibrationCard(
                            fibMultiplier = fibMultiplier,
                            quadraticWeight = quadraticWeight,
                            dopamineFrequency = dopamineFrequency,
                            runnerMode = runnerMode,
                            onToggleRunnerMode = {
                                runnerMode = if (runnerMode == "COBB-DOUGLAS INDEX") "LMSR BONDING" else "COBB-DOUGLAS INDEX"
                                appendLog("INFO", "NEURO-DRIFT", "Switched mathematical model execution path to: $runnerMode")
                            }
                        )

                        // CARD 2: MONOSPACE TERMINAL LOGS
                        TerminalLogsCard(
                            logs = terminalLogs,
                            onFlushLogs = {
                                terminalLogs.clear()
                                appendLog("INFO", "CLEANSE", "Synaptic logging buffer purged completely.")
                            },
                            onInjectEvent = {
                                val logPool = listOf(
                                    Pair("SUCCESS", "CONVICTION" to "Synced with MADDAO quadratic polls. All bets locked."),
                                    Pair("INFO", "PRUNING" to "Synaptic pruning complete. Reclaimed 4.2 billion neurons of pure dDegen logic."),
                                    Pair("WARN", "COMPLIANCE" to "Anti-sybil firewall blocked 12 woke-bots attempting to hijack Kalshi's api feed."),
                                    Pair("ERROR", "RECEPTORS" to "Over-indexing dopamine loops detected. Calibrating with South Park humor triggers."),
                                    Pair("INFO", "MADNESS" to "Consensus madness at 99.4%! Injecting power ballad frequencies into audio stack."),
                                    Pair("SUCCESS", "BASE" to "Quadratic pool rewards unlocked on Base. Fibonacci multipliers active.")
                                )
                                val selected = logPool.random()
                                appendLog(selected.first, selected.second.first, selected.second.second)
                            },
                            onAuditMultipliers = {
                                val hatrComments = if (fibMultiplier > 3.8f) {
                                    "Whoa, whoa, whoa! A Fibonacci scaling factor of ${"%.3f".format(fibMultiplier)}? What, are ya runnin' a pump-and-dump scheme outta the trunk of my cousin Vinny's Cadillac? Tone it down!"
                                } else if (fibMultiplier < 1.3f) {
                                    "Ey, pal! ${"%.3f".format(fibMultiplier)} Fibonacci? Dat's weaker than decaf espresso at a wake! Have some courage!"
                                } else if (quadraticWeight > 85f) {
                                    "Quadratic Weight of ${quadraticWeight.toInt()}%? Fuhgeddaboudit! Dat's tighter than my aunt Marie's budget after bingo night! Leave some breathing room for the degens!"
                                } else {
                                    "Hmm, Fibonacci scaling factor at ${"%.3f".format(fibMultiplier)} and quadratic weight at ${quadraticWeight.toInt()}%. Not bad. It's clean. Tighter than a brand new top-hat on a windy Jersey boardwalk."
                                }
                                appendLog("MADHATR", "🎩 MADHAT'R", hatrComments)
                            }
                        )

                        // CARD 3: REWARD & MATH MILESTONES
                        RoadmapGoalsCard(
                            roadmapGoals = milestones,
                            newGoalText = newMilestoneText,
                            selectedCategory = selectedCategory,
                            isDropdownOpen = isCategoryDropdownOpen,
                            onNewGoalTextChange = { newMilestoneText = it },
                            onToggleDropdown = { isCategoryDropdownOpen = !isCategoryDropdownOpen },
                            onSelectCategory = {
                                selectedCategory = it
                                isCategoryDropdownOpen = false
                            },
                            onAddGoal = {
                                if (newMilestoneText.isNotBlank()) {
                                    milestones.add(NeuralMilestone(Random.nextInt().toString(), newMilestoneText, selectedCategory, "Jun 2026", false))
                                    appendLog("SUCCESS", "MILESTONES", "Registered milestone: $newMilestoneText under [$selectedCategory] parameters.")
                                    newMilestoneText = ""
                                }
                            },
                            onToggleGoal = { milestone ->
                                val idx = milestones.indexOfFirst { it.id == milestone.id }
                                if (idx != -1) {
                                    milestones[idx] = milestones[idx].copy(isCompleted = !milestone.isCompleted)
                                    appendLog("INFO", "MILESTONES", "Milestone '${milestone.title}' completion toggled to ${!milestone.isCompleted}")
                                }
                            },
                            onDeleteGoal = { milestone ->
                                milestones.removeIf { it.id == milestone.id }
                                appendLog("WARN", "MILESTONES", "Removed neural milestone target: '${milestone.title}'")
                            }
                        )

                        // CARD 4: REWARD TRANSFERS FEED
                        TransactionFeedCard()
                    }
                }
            } else {
                // MOBILE STACKED VIEW
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .verticalScroll(scrollState),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    DeviceEmulatorFrame(
                        fibMultiplier = fibMultiplier,
                        quadraticWeight = quadraticWeight,
                        dopamineFrequency = dopamineFrequency,
                        rewardSurpriseRatio = rewardSurpriseRatio,
                        onFibMultiplierChange = { fibMultiplier = it },
                        onQuadraticWeightChange = { quadraticWeight = it },
                        onDopamineFrequencyChange = { dopamineFrequency = it },
                        logs = terminalLogs
                    )

                    PowerChargerWidget(
                        isCharging = isCharging,
                        onToggleCharge = {
                            isCharging = !isCharging
                            if (isCharging) {
                                appendLog("SUCCESS", "SYNAPSE", "Neuro-receptor loop engaged.")
                            } else {
                                appendLog("WARN", "RECEPTORS", "Neuro-receptor loop disengaged.")
                            }
                        }
                    )

                    DriftCalibrationCard(
                        fibMultiplier = fibMultiplier,
                        quadraticWeight = quadraticWeight,
                        dopamineFrequency = dopamineFrequency,
                        runnerMode = runnerMode,
                        onToggleRunnerMode = {
                            runnerMode = if (runnerMode == "COBB-DOUGLAS INDEX") "LMSR BONDING" else "COBB-DOUGLAS INDEX"
                        }
                    )

                    TerminalLogsCard(
                        logs = terminalLogs,
                        onFlushLogs = { terminalLogs.clear() },
                        onInjectEvent = {
                            appendLog("SUCCESS", "SYNAPSE", "Synaptic impulse manual trigger injected.")
                        },
                        onAuditMultipliers = {
                            appendLog("MADHATR", "🎩 MADHAT'R", "Synapses lookin' sharp, kid. Proceed with the betting!")
                        }
                    )

                    RoadmapGoalsCard(
                        roadmapGoals = milestones,
                        newGoalText = newMilestoneText,
                        selectedCategory = selectedCategory,
                        isDropdownOpen = isCategoryDropdownOpen,
                        onNewGoalTextChange = { newMilestoneText = it },
                        onToggleDropdown = { isCategoryDropdownOpen = !isCategoryDropdownOpen },
                        onSelectCategory = {
                            selectedCategory = it
                            isCategoryDropdownOpen = false
                        },
                        onAddGoal = {
                            if (newMilestoneText.isNotBlank()) {
                                milestones.add(NeuralMilestone(Random.nextInt().toString(), newMilestoneText, selectedCategory, "Jun 2026", false))
                                newMilestoneText = ""
                            }
                        },
                        onToggleGoal = { milestone ->
                            val idx = milestones.indexOfFirst { it.id == milestone.id }
                            if (idx != -1) {
                                milestones[idx] = milestones[idx].copy(isCompleted = !milestone.isCompleted)
                            }
                        },
                        onDeleteGoal = { milestone ->
                            milestones.removeIf { it.id == milestone.id }
                        }
                    )

                    TransactionFeedCard()
                }
            }
        }
    }
}

// =====================================================================
// RENDERING COMPOSABLES WITH 100% DESIGN CONSTRAINTS PRESERVED
// =====================================================================

@Composable
fun DeviceEmulatorFrame(
    fibMultiplier: Float,
    quadraticWeight: Float,
    dopamineFrequency: Float,
    rewardSurpriseRatio: Float,
    onFibMultiplierChange: (Float) -> Unit,
    onQuadraticWeightChange: (Float) -> Unit,
    onDopamineFrequencyChange: (Float) -> Unit,
    logs: List<NeuralLogEntry> = emptyList()
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(Color(0xFF0F1123))
            .border(2.dp, GoldFlakeBrush, RoundedCornerShape(24.dp))
            .padding(8.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(8.dp)
        ) {
            // PHONE STATUS BAR CUTOUT
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("MAD GAMBIT", color = Color.White.copy(alpha = 0.5f), fontSize = 8.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                Box(
                    modifier = Modifier
                        .size(width = 80.dp, height = 16.dp)
                        .clip(RoundedCornerShape(bottomStart = 8.dp, bottomEnd = 8.dp))
                        .background(Color.Black)
                )
                Text("ALPHA-01", color = Color.White.copy(alpha = 0.5f), fontSize = 8.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
            }

            // SIMULATED PHONE HEADER
            Text(
                text = "APP STATE: NEURO-CONVICTION CORE",
                color = Color.Gray,
                fontSize = 9.sp,
                fontFamily = FontFamily.Monospace,
                modifier = Modifier.padding(bottom = 12.dp)
            )

            var selectedTab by remember { mutableStateOf("SYNAPSE") }

            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
            ) {
                when (selectedTab) {
                    "SYNAPSE" -> {
                        Column {
                            // INTERACTIVE ANALOG DIAL
                            AnalogDecayTensionDial(value = rewardSurpriseRatio)

                            Spacer(Modifier.height(12.dp))

                            // NEURAL SPIKE TRAILER
                            MicroTelemetryEqualizer()

                            Spacer(Modifier.height(12.dp))

                            // COGNITIVE CONTROLLERS
                            Text(
                                text = "🧠 COGNITIVE TENSION CONTROLLERS",
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace,
                                fontSize = 10.sp,
                                modifier = Modifier.padding(bottom = 6.dp)
                            )

                            // SLIDER 1: Fibonacci Scaling (φ)
                            Column(modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp)) {
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text("Fibonacci Scaling (φ)", color = Color.Gray, fontSize = 9.sp, fontFamily = FontFamily.Monospace)
                                    Text("${"%.3f".format(fibMultiplier)}", color = Color(0xFFFFD700), fontSize = 9.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                                }
                                Slider(
                                    value = fibMultiplier,
                                    onValueChange = onFibMultiplierChange,
                                    valueRange = 1.000f..5.000f,
                                    colors = SliderDefaults.colors(
                                        thumbColor = Color(0xFFFFD700),
                                        activeTrackColor = Color(0xFFFFD700),
                                        inactiveTrackColor = Color.DarkGray
                                    ),
                                    modifier = Modifier.testTag("user_multiplier_slider")
                                )
                            }

                            // SLIDER 2: Quadratic Conviction Weight
                            Column(modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp)) {
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text("Quadratic Conviction Weight", color = Color.Gray, fontSize = 9.sp, fontFamily = FontFamily.Monospace)
                                    Text("${quadraticWeight.toInt()}%", color = Color(0xFF00E5FF), fontSize = 9.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                                }
                                Slider(
                                    value = quadraticWeight,
                                    onValueChange = onQuadraticWeightChange,
                                    valueRange = 0f..100f,
                                    colors = SliderDefaults.colors(
                                        thumbColor = Color(0xFF00E5FF),
                                        activeTrackColor = Color(0xFF00E5FF),
                                        inactiveTrackColor = Color.DarkGray
                                    ),
                                    modifier = Modifier.testTag("gov_weight_slider")
                                )
                            }

                            // SLIDER 3: Dopamine Pulse Frequency
                            Column(modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp)) {
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text("Dopamine Pulse Frequency", color = Color.Gray, fontSize = 9.sp, fontFamily = FontFamily.Monospace)
                                    Text("${dopamineFrequency.toInt()} Hz", color = Color(0xFFFF007F), fontSize = 9.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                                }
                                Slider(
                                    value = dopamineFrequency,
                                    onValueChange = onDopamineFrequencyChange,
                                    valueRange = 5f..100f,
                                    colors = SliderDefaults.colors(
                                        thumbColor = Color(0xFFFF007F),
                                        activeTrackColor = Color(0xFFFF007F),
                                        inactiveTrackColor = Color.DarkGray
                                    ),
                                    modifier = Modifier.testTag("epochs_slider")
                                )
                            }
                        }
                    }
                    "GAMBITS" -> {
                        Column(
                            verticalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.fillMaxSize()
                        ) {
                            Text(
                                text = "🃏 ACTIVE GAMBIT CONTRACTS",
                                color = Color(0xFFFFD700),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace
                            )
                            listOf(
                                Triple("World War Meme", "POOL: 300.0 MADX", "MULT: 8.1x"),
                                Triple("The Hallucinating LLM", "POOL: 120.0 MADX", "MULT: 3.5x"),
                                Triple("BTC EOD Price", "POOL: 80.0 MADX", "MULT: 5.2x")
                            ).forEach { (name, pool, multiplier) ->
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(Color.Black.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                                        .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(8.dp))
                                        .padding(8.dp)
                                ) {
                                    Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                                        Column {
                                            Text(name, color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                                            Text(pool, color = Color.Gray, fontSize = 8.sp, fontFamily = FontFamily.Monospace)
                                        }
                                        Text(multiplier, color = Color(0xFF00FFCC), fontSize = 9.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                    }
                    "REWARDS" -> {
                        Column(
                            verticalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.fillMaxSize()
                        ) {
                            Text(
                                text = "🏆 COGNITIVE REWARD TRANSFERS",
                                color = Color(0xFF39FF14),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace
                            )
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(Color.Black.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                                    .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(8.dp))
                                    .padding(8.dp)
                            ) {
                                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                                        Text("REWARD FEED", color = Color.Gray, fontSize = 8.sp, fontFamily = FontFamily.Monospace)
                                        Text("ONLINE ⚡", color = Color(0xFF39FF14), fontSize = 8.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                                    }
                                    Spacer(Modifier.height(4.dp))
                                    TransactionRowItem("REWARD", "276 MADX", "+$2.19", Color(0xFF39FF14))
                                    TransactionRowItem("REWARD", "383 MADX", "+$2.19", Color(0xFF39FF14))
                                    TransactionRowItem("REWARD", "794 MADX", "+$2.18", Color(0xFF39FF14))
                                }
                            }
                            Spacer(Modifier.height(4.dp))
                            // Small table summary
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(Color.Black.copy(alpha = 0.4f), RoundedCornerShape(6.dp))
                                    .padding(6.dp),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                TableColumnItem("φ Multiplier", "1.618", Color.White)
                                TableColumnItem("Cobb-Douglas", "0.75", Color(0xFFFFD700))
                                TableColumnItem("Decay", "-1.35%", Color(0xFFFF4B72))
                            }
                        }
                    }
                    "LOGS" -> {
                        Column(
                            verticalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.fillMaxSize()
                        ) {
                            Text(
                                text = "📟 TELEMETRY TERMINAL LOGS",
                                color = Color(0xFF00FFCC),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace
                            )
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .weight(1f)
                                    .background(Color.Black, RoundedCornerShape(6.dp))
                                    .border(0.5.dp, Color.Gray.copy(alpha = 0.5f), RoundedCornerShape(6.dp))
                                    .padding(6.dp)
                            ) {
                                val logScrollState = rememberScrollState()
                                LaunchedEffect(logs.size) {
                                    logScrollState.animateScrollTo(logScrollState.maxValue)
                                }
                                Column(
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .verticalScroll(logScrollState)
                                ) {
                                    if (logs.isEmpty()) {
                                        Text("Logs empty. Receptors quiescent.", color = Color.Gray, fontSize = 8.sp, fontFamily = FontFamily.Monospace)
                                    } else {
                                        logs.takeLast(10).forEach { log ->
                                            val color = when (log.level) {
                                                "SUCCESS" -> Color(0xFF10B981)
                                                "INFO" -> Color(0xFF00E5FF)
                                                "WARN" -> Color(0xFFFFB300)
                                                "ERROR" -> Color(0xFFFF4B72)
                                                "MADHATR" -> Color(0xFFFFEA7C)
                                                else -> Color.White
                                            }
                                            Text(
                                                text = "[${log.timestamp}] ${log.tag}: ${log.message}",
                                                color = color,
                                                fontSize = 7.5.sp,
                                                fontFamily = FontFamily.Monospace,
                                                lineHeight = 10.sp,
                                                modifier = Modifier.padding(vertical = 1.dp)
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            Spacer(Modifier.height(12.dp))

            // SIMULATED PHONE BOTTOM TABS
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.Black.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                    .padding(8.dp),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                PhoneBottomTabItem("SYNAPSE", Icons.Filled.Tune, selected = selectedTab == "SYNAPSE") {
                    selectedTab = "SYNAPSE"
                }
                PhoneBottomTabItem("GAMBITS", Icons.Filled.Style, selected = selectedTab == "GAMBITS") {
                    selectedTab = "GAMBITS"
                }
                PhoneBottomTabItem("REWARDS", Icons.Filled.Sync, selected = selectedTab == "REWARDS") {
                    selectedTab = "REWARDS"
                }
                PhoneBottomTabItem("LOGS", Icons.Filled.MenuBook, selected = selectedTab == "LOGS") {
                    selectedTab = "LOGS"
                }
            }
        }
    }
}

@Composable
fun PhoneBottomTabItem(
    label: String, 
    icon: androidx.compose.ui.graphics.vector.ImageVector, 
    selected: Boolean,
    onClick: () -> Unit = {}
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .padding(horizontal = 4.dp)
            .clickable { onClick() }
    ) {
        Icon(
            imageVector = icon,
            contentDescription = label,
            tint = if (selected) Color(0xFFFFD700) else Color.Gray,
            modifier = Modifier.size(16.dp)
        )
        Spacer(Modifier.height(2.dp))
        Text(
            text = label,
            color = if (selected) Color.White else Color.Gray,
            fontSize = 7.5.sp,
            fontFamily = FontFamily.Monospace,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
fun AnalogDecayTensionDial(value: Float) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.Black.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
            .border(1.dp, Color.White.copy(alpha = 0.05f), RoundedCornerShape(12.dp))
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "ANALOG DECAY TENSION DIAL",
            color = Color.Gray,
            fontSize = 8.sp,
            fontFamily = FontFamily.Monospace,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 8.dp)
        )

        // Gauge drawing Canvas
        Box(
            modifier = Modifier
                .size(width = 180.dp, height = 90.dp),
            contentAlignment = Alignment.BottomCenter
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val center = Offset(size.width / 2f, size.height)
                val radius = size.width / 2f - 10f

                // Sweep gradient for satisfying color feedback
                val gradientBrush = Brush.sweepGradient(
                    colors = listOf(
                        Color(0xFF00FFCC), // Cyan
                        Color(0xFF39FF14), // Neon Green
                        Color(0xFFFFEA7C), // Yellow
                        Color(0xFFFF007F), // Neon Pink
                        Color(0xFF00FFCC)  // Cyan wrap
                    ),
                    center = center
                )

                // Draw background track arc
                drawArc(
                    brush = gradientBrush,
                    startAngle = 180f,
                    sweepAngle = 180f,
                    useCenter = false,
                    style = Stroke(width = 12.dp.toPx(), cap = StrokeCap.Round),
                    size = Size(radius * 2f, radius * 2f),
                    topLeft = Offset(center.x - radius, center.y - radius)
                )

                // Calculate angle for indicator needle: value represents 10 to 150
                val ratio = ((value - 10f) / 140f).coerceIn(0f, 1f)
                val targetAngle = 180f + (ratio * 180f)

                // Draw needle pin
                drawCircle(
                    color = Color.White,
                    radius = 6.dp.toPx(),
                    center = center
                )

                // Draw pointer needle
                val angleRad = Math.toRadians(targetAngle.toDouble())
                val needleLength = radius - 15f
                val needleEnd = Offset(
                    (center.x + needleLength * cos(angleRad)).toFloat(),
                    (center.y + needleLength * sin(angleRad)).toFloat()
                )

                drawLine(
                    color = Color.White,
                    start = center,
                    end = needleEnd,
                    strokeWidth = 3.dp.toPx(),
                    cap = StrokeCap.Round
                )
            }
        }

        Spacer(Modifier.height(12.dp))

        // Center Box with Cognition Index like Image 2
        Box(
            modifier = Modifier
                .width(160.dp)
                .background(Color.Black.copy(alpha = 0.5f), RoundedCornerShape(6.dp))
                .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(6.dp))
                .padding(vertical = 6.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "COGNITION INDEX",
                    color = Color.Gray,
                    fontSize = 8.sp,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
                Spacer(Modifier.height(2.dp))
                Row(verticalAlignment = Alignment.Bottom) {
                    Text(
                        text = "${"%.2f".format(value)} ",
                        color = Color.White,
                        fontWeight = FontWeight.Black,
                        fontFamily = FontFamily.Monospace,
                        fontSize = 15.sp,
                        modifier = Modifier.testTag("cognition_readout")
                    )
                    Text(
                        text = "ZL",
                        color = Color(0xFFFFD700),
                        fontWeight = FontWeight.Black,
                        fontFamily = FontFamily.Monospace,
                        fontSize = 11.sp
                    )
                }
            }
        }
    }
}

@Composable
fun MicroTelemetryEqualizer() {
    val infiniteTransition = rememberInfiniteTransition()

    // Interactive wave animation simulating synaptic spike activity
    val columnHeights = (0 until 12).map { index ->
        infiniteTransition.animateFloat(
            initialValue = 0.1f,
            targetValue = 0.9f,
            animationSpec = infiniteRepeatable(
                animation = tween(
                    durationMillis = 350 + (index * 60),
                    easing = FastOutLinearInEasing
                ),
                repeatMode = RepeatMode.Reverse
            ),
            label = "bar_$index"
        )
    }

    val colors = listOf(
        Color(0xFF00FFCC), // Cyan
        Color(0xFFFF007F), // Magenta
        Color(0xFF39FF14), // Neon Green
        Color(0xFFFFEA7C)  // Yellow
    )

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.Black.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
            .border(1.dp, Color.White.copy(alpha = 0.05f), RoundedCornerShape(12.dp))
            .padding(12.dp)
    ) {
        Text(
            text = "MICRO-TELEMETRY EQUALIZER",
            color = Color.Gray,
            fontSize = 8.sp,
            fontFamily = FontFamily.Monospace,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 8.dp)
        )

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp),
            horizontalArrangement = Arrangement.spacedBy(4.dp),
            verticalAlignment = Alignment.Bottom
        ) {
            columnHeights.forEachIndexed { idx, height ->
                val barColor = colors[idx % colors.size]
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxHeight(height.value)
                        .clip(RoundedCornerShape(2.dp))
                        .background(barColor)
                )
            }
        }
    }
}

@Composable
fun PowerChargerWidget(isCharging: Boolean, onToggleCharge: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(if (isCharging) Color(0xFF0C241B) else Color(0xFF1F1212))
            .border(
                1.dp,
                if (isCharging) Color(0xFF10B981) else Color(0xFFFF4B72),
                RoundedCornerShape(12.dp)
            )
            .clickable { onToggleCharge() }
            .padding(12.dp),
        contentAlignment = Alignment.Center
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                imageVector = if (isCharging) Icons.Filled.ElectricBolt else Icons.Filled.PowerOff,
                contentDescription = "Synaptic Loop Status",
                tint = if (isCharging) Color(0xFF10B981) else Color(0xFFFF4B72),
                modifier = Modifier.size(16.dp)
            )
            Spacer(Modifier.width(8.dp))
            Text(
                text = if (isCharging) "Synaptic Receptor Loop: [PULSE ACTIVE ⚡]" else "Synaptic Receptor Loop: [PULSE SLEEPING 💤]",
                color = if (isCharging) Color(0xFF10B981) else Color(0xFFFF4B72),
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
                fontSize = 11.sp
            )
        }
    }
}

@Composable
fun DriftCalibrationCard(
    fibMultiplier: Float,
    quadraticWeight: Float,
    dopamineFrequency: Float,
    runnerMode: String,
    onToggleRunnerMode: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0xFF13162C))
            .border(1.2.dp, GoldFlakeBrush, RoundedCornerShape(16.dp))
            .padding(16.dp)
    ) {
        Column {
            // HEADER
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Filled.TrendingUp,
                        contentDescription = "Decay Icon",
                        tint = Color(0xFFFFD700),
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(Modifier.width(8.dp))
                    Text(
                        text = "QUADRATIC CONVICTION DECAY FACTOR",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        fontSize = 12.sp
                    )
                }
                Box(
                    modifier = Modifier
                        .background(Color(0xFF2B1D3D), RoundedCornerShape(4.dp))
                        .border(0.5.dp, Color(0xFFFF007F), RoundedCornerShape(4.dp))
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = "PHI = ${"%.3f".format(0.10f + (dopamineFrequency / 200f))}",
                        color = Color(0xFFFF007F),
                        fontFamily = FontFamily.Monospace,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(Modifier.height(6.dp))

            Text(
                text = "Real-time modeling of user's quadratic conviction drift using fractional Fibonacci decay (e^(-φ * t)). Predicts the exact dopamine satisfaction threshold before user sentiment decay.",
                color = Color.Gray,
                fontSize = 10.sp,
                fontFamily = FontFamily.Monospace,
                lineHeight = 14.sp,
                modifier = Modifier.padding(bottom = 12.dp)
            )

            // LEGEND ROW ABOVE PLOT
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 8.dp),
                horizontalArrangement = Arrangement.Start,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(width = 12.dp, height = 2.dp)
                            .background(Color.Gray)
                    )
                    Spacer(Modifier.width(6.dp))
                    Text("Quadratic Conviction Accumulation", color = Color.Gray, fontSize = 9.sp, fontFamily = FontFamily.Monospace)
                }
                Spacer(Modifier.width(20.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(width = 12.dp, height = 2.dp)
                            .background(Color(0xFF00FFCC))
                    )
                    Spacer(Modifier.width(6.dp))
                    Text("Neuro-Dopamine Reward Decay", color = Color(0xFF00FFCC), fontSize = 9.sp, fontFamily = FontFamily.Monospace)
                }
            }

            // PLOT CANVAS DRAWING MATHEMATICAL DECAY CURVE
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
                    .background(Color.Black.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                    .border(1.dp, Color.White.copy(alpha = 0.05f), RoundedCornerShape(8.dp))
                    .padding(8.dp)
            ) {
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val pointsCount = dopamineFrequency.toInt()
                    val gridLinesX = 6
                    val gridLinesY = 4

                    // Draw grid lines
                    for (x in 1 until gridLinesX) {
                        val fraction = x.toFloat() / gridLinesX
                        val lineX = size.width * fraction
                        drawLine(
                            color = Color.White.copy(alpha = 0.08f),
                            start = Offset(lineX, 0f),
                            end = Offset(lineX, size.height),
                            strokeWidth = 1f
                        )
                    }
                    for (y in 1 until gridLinesY) {
                        val fraction = y.toFloat() / gridLinesY
                        val lineY = size.height * fraction
                        drawLine(
                            color = Color.White.copy(alpha = 0.08f),
                            start = Offset(0f, lineY),
                            end = Offset(size.width, lineY),
                            strokeWidth = 1f
                        )
                    }

                    // Curve 1: Conviction Growth Ratio Curve (Dashed Grey line) - using ConvictionMathEngine
                    val convictionPath = Path()
                    val alpha = 0.15
                    for (i in 0..pointsCount) {
                        val t = i.toDouble()
                        val posX = size.width * (t / pointsCount).toFloat()
                        val factor = com.example.math.ConvictionMathEngine.calculateConvictionGrowth(alpha, t).toFloat()
                        val posY = size.height * (1.0f - factor.coerceIn(0f, 1f))
                        if (i == 0) {
                            convictionPath.moveTo(posX, posY)
                        } else {
                            convictionPath.lineTo(posX, posY)
                        }
                    }
                    drawPath(
                        path = convictionPath,
                        color = Color.Gray.copy(alpha = 0.7f),
                        style = Stroke(
                            width = 2.dp.toPx(),
                            pathEffect = PathEffect.dashPathEffect(floatArrayOf(10f, 10f), 0f)
                        )
                    )

                    // Curve 2: Temporal Decay Factor Curve (Solid Cyan line) - using ConvictionMathEngine
                    val decayPath = Path()
                    for (i in 0..pointsCount) {
                        val t = i.toDouble()
                        val posX = size.width * (t / pointsCount).toFloat()
                        val factor = com.example.math.ConvictionMathEngine.calculateTemporalDecay(alpha, t).toFloat()
                        val posY = size.height * (1.0f - factor.coerceIn(0f, 1f))
                        if (i == 0) {
                            decayPath.moveTo(posX, posY)
                        } else {
                            decayPath.lineTo(posX, posY)
                        }
                    }
                    drawPath(
                        path = decayPath,
                        color = Color(0xFF00FFCC),
                        style = Stroke(width = 2.5.dp.toPx())
                    )
                }

                // Axis coordinates overlay
                Column(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("100%", color = Color.Gray, fontSize = 8.sp, fontFamily = FontFamily.Monospace)
                        Text("75%", color = Color.Gray, fontSize = 8.sp, fontFamily = FontFamily.Monospace)
                        Text("Y: NEURAL VALUE", color = Color.Gray.copy(alpha=0.3f), fontSize = 7.sp, fontFamily = FontFamily.Monospace)
                        Text("MAX", color = Color.Gray, fontSize = 8.sp, fontFamily = FontFamily.Monospace)
                    }
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("50%", color = Color.Gray, fontSize = 8.sp, fontFamily = FontFamily.Monospace)
                        Text("25%", color = Color.Gray, fontSize = 8.sp, fontFamily = FontFamily.Monospace)
                    }
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("0%", color = Color.Gray, fontSize = 8.sp, fontFamily = FontFamily.Monospace)
                        Text("0  1  2  3  4  5  6  7  8  9  10 12 14 16 18 20 22 24 26 28 30", color = Color.Gray.copy(alpha=0.3f), fontSize = 7.sp, fontFamily = FontFamily.Monospace)
                        Text("MIN", color = Color.Gray, fontSize = 8.sp, fontFamily = FontFamily.Monospace)
                    }
                }
            }

            Spacer(Modifier.height(12.dp))

            // FOOTER & ACTION
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("CURVE TYPE: CONTINUOUS", color = Color.Gray, fontSize = 8.sp, fontFamily = FontFamily.Monospace)
                
                Box(
                    modifier = Modifier
                        .background(Color(0xFF1D293D), RoundedCornerShape(4.dp))
                        .border(0.5.dp, Color(0xFF00E5FF), RoundedCornerShape(4.dp))
                        .clickable { onToggleRunnerMode() }
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = runnerMode,
                        color = Color(0xFF00E5FF),
                        fontFamily = FontFamily.Monospace,
                        fontSize = 8.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

@Composable
fun TerminalLogsCard(
    logs: List<NeuralLogEntry>,
    onFlushLogs: () -> Unit,
    onInjectEvent: () -> Unit,
    onAuditMultipliers: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0xFF13162C))
            .border(1.2.dp, GoldFlakeBrush, RoundedCornerShape(16.dp))
            .padding(16.dp)
    ) {
        Column {
            // HEADER Actions
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Filled.Terminal,
                        contentDescription = "Terminal Icon",
                        tint = Color(0xFFFFD700),
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(Modifier.width(8.dp))
                    Text(
                        text = "MADHAT'R NEURO-COGNITIVE TERMINAL LOGS",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        fontSize = 12.sp
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    // AUDIT COEFFICIENTS (Jersey Persona Trigger)
                    TextButton(
                        onClick = onAuditMultipliers,
                        colors = ButtonDefaults.textButtonColors(contentColor = Color(0xFFFFEA7C)),
                        modifier = Modifier
                            .background(Color(0xFF2C2610), RoundedCornerShape(4.dp))
                            .border(0.5.dp, Color(0xFFFFD700), RoundedCornerShape(4.dp))
                            .height(24.dp)
                            .padding(horizontal = 4.dp),
                        contentPadding = PaddingValues(horizontal = 6.dp)
                    ) {
                        Text("🎩 AUDIT COEFFICIENTS", fontSize = 8.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                    }

                    // FLUSH LOGS
                    TextButton(
                        onClick = onFlushLogs,
                        colors = ButtonDefaults.textButtonColors(contentColor = Color(0xFFFF4B72)),
                        modifier = Modifier
                            .background(Color(0xFF2A121A), RoundedCornerShape(4.dp))
                            .border(0.5.dp, Color(0xFFFF4B72), RoundedCornerShape(4.dp))
                            .height(24.dp)
                            .padding(horizontal = 4.dp),
                        contentPadding = PaddingValues(horizontal = 6.dp)
                    ) {
                        Text("FLUSH LOGS", fontSize = 8.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                    }

                    // INJECT NEURAL IMPULSE
                    TextButton(
                        onClick = onInjectEvent,
                        colors = ButtonDefaults.textButtonColors(contentColor = Color(0xFF10B981)),
                        modifier = Modifier
                            .background(Color(0xFF0C241B), RoundedCornerShape(4.dp))
                            .border(0.5.dp, Color(0xFF10B981), RoundedCornerShape(4.dp))
                            .height(24.dp)
                            .padding(horizontal = 4.dp),
                        contentPadding = PaddingValues(horizontal = 6.dp)
                    ) {
                        Text("INJECT EVENT", fontSize = 8.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(Modifier.height(12.dp))

            // MONOSPACE OUTPUT AREA
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(160.dp)
                    .background(Color(0xFF030303), RoundedCornerShape(8.dp))
                    .border(1.dp, Color.White.copy(alpha = 0.05f), RoundedCornerShape(8.dp))
                    .padding(12.dp)
            ) {
                val logScrollState = rememberScrollState()

                LaunchedEffect(logs.size) {
                    logScrollState.animateScrollTo(logScrollState.maxValue)
                }

                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(logScrollState)
                ) {
                    if (logs.isEmpty()) {
                        Text("Neural trace logging buffer cleared. Core receptors quiescent.", color = Color.Gray, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                    } else {
                        logs.forEach { log ->
                            val color = when (log.level) {
                                "SUCCESS" -> Color(0xFF10B981)
                                "INFO" -> Color(0xFF00E5FF)
                                "WARN" -> Color(0xFFFFB300)
                                "ERROR" -> Color(0xFFFF4B72)
                                "MADHATR" -> Color(0xFFFFEA7C)
                                else -> Color.White
                            }
                            Text(
                                text = "[${log.timestamp}] ${log.level} ${log.tag}: ${log.message}",
                                color = color,
                                fontSize = 9.5.sp,
                                fontFamily = FontFamily.Monospace,
                                lineHeight = 13.sp,
                                modifier = Modifier.padding(vertical = 2.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun RoadmapGoalsCard(
    roadmapGoals: List<NeuralMilestone>,
    newGoalText: String,
    selectedCategory: String,
    isDropdownOpen: Boolean,
    onNewGoalTextChange: (String) -> Unit,
    onToggleDropdown: () -> Unit,
    onSelectCategory: (String) -> Unit,
    onAddGoal: () -> Unit,
    onToggleGoal: (NeuralMilestone) -> Unit,
    onDeleteGoal: (NeuralMilestone) -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0xFF13162C))
            .border(1.2.dp, GoldFlakeBrush, RoundedCornerShape(16.dp))
            .padding(16.dp)
    ) {
        Column {
            // HEADER
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Filled.PlaylistAddCheck,
                        contentDescription = "Goals Icon",
                        tint = Color(0xFFFFD700),
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(Modifier.width(8.dp))
                    Text(
                        text = "DOPAMINE REWARD & MATH MILESTONES",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        fontSize = 12.sp
                    )
                }

                Box(
                    modifier = Modifier
                        .background(Color(0xFF0C241B), RoundedCornerShape(4.dp))
                        .border(0.5.dp, Color(0xFF10B981), RoundedCornerShape(4.dp))
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = "SYNC ENABLED",
                        color = Color(0xFF10B981),
                        fontFamily = FontFamily.Monospace,
                        fontSize = 8.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(Modifier.height(12.dp))

            // TASK CREATOR FIELDS
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = newGoalText,
                    onValueChange = onNewGoalTextChange,
                    placeholder = { Text("Register new neural milestone...", fontSize = 11.sp, color = Color.Gray) },
                    textStyle = TextStyle(color = Color.White, fontSize = 11.sp, fontFamily = FontFamily.Monospace),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = Color.Black.copy(alpha = 0.3f),
                        unfocusedContainerColor = Color.Black.copy(alpha = 0.3f),
                        focusedBorderColor = Color(0xFFFFD700),
                        unfocusedBorderColor = Color.Gray.copy(alpha = 0.5f)
                    ),
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp)
                        .testTag("new_goal_input")
                )

                // Spinner selector
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(4.dp))
                        .background(Color.Black.copy(alpha = 0.3f))
                        .border(1.dp, Color.Gray.copy(alpha = 0.5f), RoundedCornerShape(4.dp))
                        .clickable { onToggleDropdown() }
                        .padding(horizontal = 8.dp)
                        .height(48.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = selectedCategory,
                            color = when (selectedCategory) {
                                "NEURO" -> Color(0xFFFFEA7C)
                                "MATH" -> Color(0xFF00E5FF)
                                "GAMBIT" -> Color(0xFFFF4B72)
                                else -> Color(0xFF10B981)
                            },
                            fontSize = 9.sp,
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Bold
                        )
                        Icon(Icons.Filled.ArrowDropDown, contentDescription = "Category Select", tint = Color.Gray, modifier = Modifier.size(16.dp))
                    }

                    DropdownMenu(
                        expanded = isDropdownOpen,
                        onDismissRequest = onToggleDropdown,
                        modifier = Modifier.background(Color(0xFF13162C))
                    ) {
                        listOf("NEURO", "MATH", "GAMBIT", "REWARD").forEach { cat ->
                            DropdownMenuItem(
                                text = { Text(cat, color = Color.White, fontSize = 11.sp, fontFamily = FontFamily.Monospace) },
                                onClick = { onSelectCategory(cat) }
                            )
                        }
                    }
                }

                // Add button
                IconButton(
                    onClick = onAddGoal,
                    modifier = Modifier
                        .size(48.dp)
                        .clip(RoundedCornerShape(4.dp))
                        .background(Color(0xFFFFEA7C))
                        .testTag("add_goal_button")
                ) {
                    Icon(Icons.Filled.Add, contentDescription = "Register Milestone", tint = Color.Black)
                }
            }

            Spacer(Modifier.height(12.dp))

            // MILESTONES LIST
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                roadmapGoals.forEach { milestone ->
                    val catColor = when (milestone.category) {
                        "NEURO" -> Color(0xFFFFEA7C)
                        "MATH" -> Color(0xFF00E5FF)
                        "GAMBIT" -> Color(0xFFFF4B72)
                        else -> Color(0xFF10B981)
                    }

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(Color.Black.copy(alpha = 0.2f))
                            .border(0.5.dp, Color.White.copy(alpha = 0.05f), RoundedCornerShape(8.dp))
                            .padding(8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                            Checkbox(
                                checked = milestone.isCompleted,
                                onCheckedChange = { onToggleGoal(milestone) },
                                colors = CheckboxDefaults.colors(
                                    checkedColor = Color(0xFFFFD700),
                                    uncheckedColor = Color.Gray
                                )
                            )
                            Spacer(Modifier.width(8.dp))
                            Column {
                                Text(
                                    text = milestone.title,
                                    color = if (milestone.isCompleted) Color.Gray else Color.White,
                                    fontSize = 11.sp,
                                    fontFamily = FontFamily.Monospace,
                                    style = if (milestone.isCompleted) TextStyle(textDecoration = androidx.compose.ui.text.style.TextDecoration.LineThrough) else TextStyle.Default
                                )
                                Text(
                                    text = milestone.date,
                                    color = Color.Gray,
                                    fontSize = 8.sp,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                        }

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            // Category Badge
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(4.dp))
                                    .background(catColor.copy(alpha = 0.15f))
                                    .border(0.5.dp, catColor, RoundedCornerShape(4.dp))
                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                            ) {
                                Text(milestone.category, color = catColor, fontSize = 8.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                            }
                            Spacer(Modifier.width(8.dp))
                            IconButton(
                                onClick = { onDeleteGoal(milestone) },
                                modifier = Modifier.size(24.dp)
                            ) {
                                Icon(Icons.Filled.Delete, contentDescription = "Purge Milestone", tint = Color.Gray, modifier = Modifier.size(14.dp))
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun TransactionFeedCard() {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0xFF13162C))
            .border(1.2.dp, GoldFlakeBrush, RoundedCornerShape(16.dp))
            .padding(16.dp)
    ) {
        Column {
            // HEADER
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Filled.CompareArrows,
                        contentDescription = "Rewards Icon",
                        tint = Color(0xFFFFD700),
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(Modifier.width(8.dp))
                    Text(
                        text = "NEURO-REWARD FLOWS & TRANSFERS",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        fontSize = 12.sp
                    )
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(6.dp)
                            .background(Color(0xFF39FF14), CircleShape)
                    )
                    Spacer(Modifier.width(6.dp))
                    Text(
                        text = "CONVICTION COGNITIVE DRIFT",
                        color = Color(0xFF39FF14),
                        fontFamily = FontFamily.Monospace,
                        fontSize = 8.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(Modifier.height(12.dp))

            Row(modifier = Modifier.fillMaxWidth()) {
                // LEFT SPARKLINE WAVE
                Column(
                    modifier = Modifier
                        .weight(1.2f)
                        .padding(end = 12.dp)
                ) {
                    Text("COGNITIVE REWARD FLUX (Hz)", color = Color.Gray, fontSize = 8.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(4.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp)
                            .background(Color.Black.copy(alpha = 0.3f), RoundedCornerShape(6.dp))
                    ) {
                        Canvas(modifier = Modifier.fillMaxSize()) {
                            val path = Path()
                            val step = size.width / 40f
                            for (i in 0..40) {
                                val x = i * step
                                val sinArg = (i * 0.2f) + (System.currentTimeMillis() * 0.003f)
                                val y = (size.height / 2f) + (sin(sinArg) * 15f)
                                if (i == 0) path.moveTo(x, y) else path.lineTo(x, y)
                            }
                            drawPath(path, color = Color(0xFF39FF14), style = Stroke(width = 1.5.dp.toPx()))
                        }
                    }
                }

                // RIGHT TRANSACTIONS FEED
                Column(modifier = Modifier.weight(1.8f)) {
                    Text("RECENT PROTOCOL GAINS", color = Color.Gray, fontSize = 8.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(4.dp))
                    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        TransactionRowItem("REWARD", "276 MADX", "+$2.19", Color(0xFF39FF14))
                        TransactionRowItem("REWARD", "383 MADX", "+$2.19", Color(0xFF39FF14))
                        TransactionRowItem("REWARD", "794 MADX", "+$2.18", Color(0xFF39FF14))
                    }
                }
            }

            Spacer(Modifier.height(12.dp))

            // REWARD MATRIX SUMMARY TABLE
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.Black.copy(alpha = 0.4f), RoundedCornerShape(6.dp))
                    .padding(8.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                HoverTooltip(text = "The Golden Ratio Multiplier (1.618) dynamically scales up baseline payouts as market confidence compounds.") {
                    TableColumnItem("φ Multiplier", "1.618", Color.White)
                }
                HoverTooltip(text = "Cobb-Douglas exponent balance ensures non-linear asset growth while shielding weights against capital concentration attacks.") {
                    TableColumnItem("Cobb-Douglas", "0.75", Color(0xFFFFD700))
                }
                HoverTooltip(text = "Staking Decay represents the non-linear degradation factor applied to unstaked resolve per elapsed epoch.") {
                    TableColumnItem("Conviction Decay", "-1.35%", Color(0xFFFF4B72))
                }
            }
        }
    }
}

@Composable
fun TransactionRowItem(type: String, amount: String, price: String, color: Color) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row {
            Text(type, color = color, fontSize = 8.5.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
            Spacer(Modifier.width(4.dp))
            Text(amount, color = Color.White, fontSize = 8.5.sp, fontFamily = FontFamily.Monospace)
        }
        Text(price, color = Color.Gray, fontSize = 8.5.sp, fontFamily = FontFamily.Monospace)
    }
}

@Composable
fun TableColumnItem(label: String, value: String, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(label, color = Color.Gray, fontSize = 7.5.sp, fontFamily = FontFamily.Monospace)
        Spacer(Modifier.height(2.dp))
        Text(value, color = color, fontSize = 9.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
    }
}
