package com.example.navigation
import com.example.ui.components.HoverTooltip
import com.example.ui.components.neonIconComposer
import com.example.ui.components.getGlassReflectionBrush
import com.example.ui.components.glassReflection
import com.example.ui.components.SlateSubduedColor
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithCache
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.graphics.Paint
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.material3.ripple
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.ui.graphics.CompositingStrategy
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.res.painterResource
import androidx.compose.foundation.Image
import androidx.compose.ui.Alignment
import androidx.compose.foundation.Canvas
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.unit.Dp
import com.example.R
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import androidx.compose.ui.unit.dp
import com.example.ui.screens.*
import com.example.ui.theme.*
import com.example.viewmodel.GambitViewModel
import androidx.compose.foundation.BorderStroke
import androidx.compose.ui.graphics.Brush

@Suppress("DEPRECATION")
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GambitNavigation(vm: GambitViewModel, authManager: com.example.auth.AuthManager) {
    val globalAuthState by authManager.authState.collectAsState()
    
    if (!globalAuthState.isAuthenticated) {
        AuthScreen(authManager = authManager, onAuthSuccess = {
            // Optional callback, UI reacts implicitly to state 
            vm.syncGlobalAuthState(globalAuthState)
        })
        return
    }

    var currentRoute by remember { mutableStateOf("circus") }
    val state by vm.state.collectAsState()
    val balanceValue = state.madxBalance
    var isMenuOpen by remember { mutableStateOf(false) }
    var isDashboardOpen by remember { mutableStateOf(false) }
    var isNotificationsSidebarOpen by remember { mutableStateOf(false) }
    var notificationsEnabled by remember { mutableStateOf(true) }

    ProvideGambitTheme(state.currentTheme) {
        val theme = LocalGambitTheme.current
        BoxWithConstraints(Modifier.fillMaxSize()) {
            val isWideScreen = maxWidth > 800.dp
            
            // Render Stardust celestial particle system effect
            com.example.ui.components.GoldStardustBackground(Modifier.fillMaxSize())
            
            Scaffold(
                containerColor = Color.Transparent, // theme.bgDeep is usually here, replace with Transparent to show Particles
                contentWindowInsets = WindowInsets.systemBars,
                floatingActionButton = {
                    // Borderless custom character avatar that acts as our chat trigger
                    Box(
                        modifier = Modifier
                            .size(if (isWideScreen) 84.dp else 72.dp)
                            .clickable(
                                onClick = {
                                    vm.playFeedbackTone(android.media.ToneGenerator.TONE_PROP_ACK, 70)
                                    vm.toggleAiChat()
                                },
                                interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() },
                                indication = ripple(bounded = false)
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        com.example.ui.components.MadHatrFloatingAvatar()
                    }
                },
                topBar = {
                    Column {
                        TopAppBar(
                            modifier = Modifier.background(theme.brushedMetal),
                            colors = TopAppBarDefaults.topAppBarColors(containerColor = androidx.compose.ui.graphics.Color.Transparent),
                            title = {
                                androidx.compose.foundation.Image(
                                    painter = androidx.compose.ui.res.painterResource(id = com.example.R.drawable.mad_logo),
                                    contentDescription = "MΛD Gambit Logo",
                                    modifier = Modifier
                                        .height(123.dp)
                                        .fillMaxWidth(0.8f), 
                                    contentScale = androidx.compose.ui.layout.ContentScale.Fit,
                                    alignment = Alignment.CenterStart
                                )
                            },
                        actions = {
                            var isNotificationsOpen by remember { mutableStateOf(false) }
                            val web3Connected by vm.web3Service.isConnected.collectAsState()

                            if (web3Connected) {
                                com.example.ui.components.MadCreditHeaderWidget(vm = vm)
                            } else {
                                Box(
                                    modifier = Modifier
                                        .padding(end = 8.dp)
                                        .background(Color(0x4D706050), RoundedCornerShape(5.dp))
                                        .border(0.75.dp, GoldFlakeBrush, RoundedCornerShape(5.dp))
                                        .padding(1.dp)
                                ) {
                                    Box(
                                        Modifier
                                            .glassReflection(
                                                baseColor = com.example.ui.theme.NeonGreen,
                                                shape = RoundedCornerShape(4.dp)
                                            )
                                            .padding(horizontal = 6.dp, vertical = 4.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        androidx.compose.material3.Text("🟢 SECURE NODE [ONLINE]", color = Color.White, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                                                     HoverTooltip(text = "Conviction Dashboard") {
                                GoldenLiquidSheenCutoutButton(
                                    onClick = { isDashboardOpen = true },
                                    modifier = Modifier
                                        .padding(end = 8.dp)
                                        .size(40.dp),
                                    icon = Icons.Filled.Dataset,
                                    iconSize = 20.dp,
                                    contentDescription = "Conviction Dashboard",
                                    isSelected = isDashboardOpen
                                )
                            }
 
                            HoverTooltip(text = "Real-time Sentiment Analyser") {
                                GoldenLiquidSheenCutoutButton(
                                    onClick = { vm.toggleSentimentFeed(true) },
                                    modifier = Modifier
                                        .padding(end = 8.dp)
                                        .size(40.dp),
                                    icon = Icons.Filled.DynamicFeed,
                                    iconSize = 20.dp,
                                    contentDescription = "Real-time Sentiment Feed",
                                    isSelected = state.isSentimentFeedOpen
                                )
                            }
                            HoverTooltip(text = "View Platform Alerts") {
                                GoldenLiquidSheenCutoutButton(
                                    onClick = null, // Custom click/gesture handled below
                                    modifier = Modifier
                                        .padding(end = 8.dp)
                                        .size(40.dp)
                                        .pointerInput(Unit) {
                                            detectTapGestures(
                                                onDoubleTap = { notificationsEnabled = !notificationsEnabled },
                                                onTap = { isNotificationsOpen = true }
                                            )
                                        },
                                    icon = Icons.Filled.Notifications,
                                    iconSize = 20.dp,
                                    contentDescription = "View alerts",
                                    isSelected = notificationsEnabled
                                )
                            }
                            HoverTooltip(text = "Expand global platform menu") {
                                GoldenLiquidSheenCutoutButton(
                                    onClick = { isMenuOpen = true },
                                    modifier = Modifier
                                        .padding(end = 8.dp)
                                        .size(40.dp),
                                    icon = Icons.Filled.Menu,
                                    iconSize = 20.dp,
                                    contentDescription = "Open full menu",
                                    isSelected = isMenuOpen
                                )
                            }
                            com.example.ui.components.NotificationDrawer(
                                isOpen = isNotificationsOpen,
                                onDismiss = { isNotificationsOpen = false }
                            )
                        }
                    )
                    
                    // Glass-style platform wide interactive ticker just below primary top menu
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 6.dp)
                    ) {
                        com.example.ui.components.IntegratedTickerWidget(
                            isSatireMode = false,
                            telemetry = state.telemetryStats,
                            isNeuralOnly = false,
                            isClickable = true,
                            speedMultiplier = 1.1f,
                            isFullWidth = true,
                            onHeadlineClick = { headline ->
                                vm.setShowProposeModal(true, headline)
                            }
                        )
                    }
                }
                },
                bottomBar = {
                    if (!isWideScreen) {
                        val neonButtonGradient = Brush.linearGradient(
                            colors = listOf(
                                Color(0xFF00E5FF), // Subtle Neon Blue
                                Color(0xFFFF007F), // Subtle Pink
                                Color(0xFFFF073A), // Subtle Red
                                Color(0xFF9D00FF)  // Subtle Purple
                            )
                        )
                        val glassHighlight = Brush.verticalGradient(
                            colors = listOf(
                                Color.White.copy(alpha = 0.35f),
                                Color.White.copy(alpha = 0.05f),
                                Color.Transparent
                            )
                        )
                        NavigationBar(
                            modifier = Modifier
                                .graphicsLayer {
                                    shadowElevation = 16f
                                    shape = androidx.compose.foundation.shape.RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp)
                                    clip = true
                                }
                                .background(theme.brushedMetal)
                                .border(0.5.dp, Color.White.copy(alpha = 0.15f), RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp))
                                .padding(bottom = WindowInsets.navigationBars.asPaddingValues().calculateBottomPadding()),
                            containerColor = Color.Transparent, // Let the background brush show through
                            windowInsets = WindowInsets(0) // Render manually via padding to prevent system inset clip bugs
                        ) {
                            val items = listOf(
                                NavItem("circus", "Circus", Icons.Filled.Insights, "Predictive Markets"),
                                NavItem("shield", "Shield", Icons.Filled.Shield, "Sybil Defense"),
                                NavItem("auction", "Auction", Icons.Filled.LocalFireDepartment, "Token Auctions"),
                                NavItem("kaito", "Terminal", Icons.Filled.Terminal, "System Console"),
                                NavItem("profile", "Gambit 🃏", Icons.Filled.Style, "MADHATS Gambit Cards")
                            )
                            items.forEach { item ->
                                val isSelected = currentRoute == item.route
    
                                NavigationBarItem(
                                    selected = isSelected,
                                    onClick = { 
                                        currentRoute = item.route 
                                        vm.playFeedbackTone(android.media.ToneGenerator.TONE_PROP_ACK, 40)
                                    },
                                    icon = {
                                        GoldenLiquidSheenCutoutButton(
                                            onClick = null, // Handled by NavigationBarItem click parent
                                            modifier = Modifier.size(54.dp, 32.dp),
                                            isSelected = isSelected,
                                            icon = item.icon,
                                            iconSize = if (isSelected) 22.dp else 18.dp,
                                            contentDescription = item.label
                                        )
                                    },
                                    label = { 
                                        Text(
                                            item.label, 
                                            fontSize = 9.sp, 
                                            fontWeight = FontWeight.Bold, 
                                            fontFamily = com.example.ui.theme.ArialNarrowFamily,
                                            color = if (isSelected) Color.White else Color.Gray.copy(alpha = 0.8f)
                                        ) 
                                    },
                                    colors = NavigationBarItemDefaults.colors(
                                        selectedIconColor = Color.White,
                                        selectedTextColor = Color.White,
                                        unselectedIconColor = Color.Gray,
                                        unselectedTextColor = Color.Gray,
                                        indicatorColor = Color.Transparent
                                    )
                                )
                            }
                        }
                    }
                }
            ) { padding ->
            Box(Modifier.padding(padding).fillMaxSize().background(theme.bgDeep), contentAlignment = Alignment.TopCenter) {
                Row(Modifier.fillMaxSize()) {
                    if (isWideScreen) {
                        NavigationRail(
                            modifier = Modifier.width(80.dp).fillMaxHeight()
                                .background(theme.brushedMetal)
                                .border(0.5.dp, Color.White.copy(alpha = 0.15f)),
                            containerColor = Color.Transparent,
                        ) {
                            val items = listOf(
                                NavItem("circus", "Circus", Icons.Filled.Insights, "Predictive Markets"),
                                NavItem("shield", "Shield", Icons.Filled.Shield, "Sybil Defense"),
                                NavItem("auction", "Auction", Icons.Filled.LocalFireDepartment, "Token Auctions"),
                                NavItem("kaito", "Terminal", Icons.Filled.Terminal, "System Console"),
                                NavItem("profile", "Gambit 🃏", Icons.Filled.Style, "MADHATS Gambit Cards")
                            )
                            Spacer(Modifier.height(16.dp))
                            items.forEach { item ->
                                val isSelected = currentRoute == item.route
                                NavigationRailItem(
                                    selected = isSelected,
                                    onClick = { 
                                        currentRoute = item.route 
                                        vm.playFeedbackTone(android.media.ToneGenerator.TONE_PROP_ACK, 40)
                                    },
                                    icon = {
                                        GoldenLiquidSheenCutoutButton(
                                            onClick = null, // Handled by NavigationRailItem click parent
                                            modifier = Modifier.size(48.dp, 48.dp),
                                            isSelected = isSelected,
                                            icon = item.icon,
                                            iconSize = 24.dp,
                                            contentDescription = item.label
                                        )
                                    },
                                    label = { 
                                        Text(
                                            item.label, 
                                            fontSize = 9.sp, 
                                            fontWeight = FontWeight.Bold, 
                                            fontFamily = com.example.ui.theme.ArialNarrowFamily,
                                            color = if (isSelected) Color.White else Color.Gray.copy(alpha = 0.8f)
                                        ) 
                                    },
                                    colors = NavigationRailItemDefaults.colors(
                                        selectedIconColor = Color.White,
                                        selectedTextColor = Color.White,
                                        unselectedIconColor = Color.Gray,
                                        unselectedTextColor = Color.Gray,
                                        indicatorColor = Color.Transparent
                                    )
                                )
                                Spacer(Modifier.height(8.dp))
                            }
                        }
                    }
                    Box(Modifier.weight(1f).fillMaxHeight(), contentAlignment = Alignment.TopCenter) {
                        Box(Modifier.widthIn(max = 1200.dp).fillMaxSize()) {
                            // Background themes global effects
                            if (theme.isPopArt) {
                                Box(Modifier.fillMaxSize().background(com.example.ui.theme.NeonGridBrush))
                            } else if (state.currentTheme == com.example.ui.theme.ThemeStyle.BORG_GREEN) {
                                // High-end black to black-green to green vertical gradient mirroring convictionmarkets.io
                                Box(Modifier.fillMaxSize().background(
                                    androidx.compose.ui.graphics.Brush.verticalGradient(
                                        listOf(
                                            Color(0xFF000000), 
                                            Color(0xFF021B09), 
                                            Color(0xFF054015)
                                        )
                                    )
                                ))
                            }
                            
                            Box(Modifier.fillMaxSize()) {
                                when (currentRoute) {
                                    "circus" -> PredictionCircusScreen(vm)
                                    "shield" -> MadShieldScreen(vm)
                                    "auction" -> AuctionScreen(vm)
                                    "kaito" -> KaitoTerminalScreen(vm)
                                    "stake" -> StakingScreen(vm)
                                    "data" -> com.example.ui.screens.DataHouseScreen(vm)
                                    "admin" -> com.example.ui.screens.AdminPanelScreen(vm)
                                    "morpho" -> com.example.ui.screens.MorphoVaultScreen(vm)
                                    "aero" -> com.example.ui.screens.AerodromeLiquidityScreen(vm)
                                    "profile" -> com.example.ui.screens.ProfileScreen(vm)
                                    "help_forum" -> com.example.ui.screens.HelpForumScreen(vm)
                                    "settings" -> com.example.ui.screens.PersonaSettingsScreen(vm)
                                    "history" -> com.example.ui.screens.AgentHistoryScreen(vm)
                                    "diagnostics" -> com.example.ui.screens.SystemDiagnosticsScreen(vm)
                                }
                            }
                        }
                    }
                }
            }
        }

        AnimatedVisibility(
            visible = isMenuOpen,
            enter = fadeIn(),
            exit = fadeOut(),
            modifier = Modifier.fillMaxSize()
        ) {
            Box(
                Modifier
                    .fillMaxSize()
                    .background(theme.bgOverlay)
                    .clickable { isMenuOpen = false }
            ) {
                Column(Modifier.fillMaxSize()) {
                    Row(
                        Modifier
                            .fillMaxWidth()
                            .padding(16.dp), horizontalArrangement = Arrangement.End
                    ) {
                        IconButton(onClick = { isMenuOpen = false }) {
                            Icon(Icons.Filled.Close, contentDescription = "Close Menu", tint = theme.brandSecondary)
                        }
                    }
                    Row(
                        Modifier
                            .fillMaxSize()
                            .padding(horizontal = 16.dp, vertical = 8.dp)
                    ) {
                        // Left Column: Platform Menu
                        Column(Modifier.weight(1f)) {
                            Text("PLATFORM", color = theme.brandSecondary, style = androidx.compose.ui.text.TextStyle(shadow = androidx.compose.ui.graphics.Shadow(theme.brandSecondary, blurRadius = 5f)), fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontSize = 16.sp)
                            Spacer(Modifier.height(16.dp))
                            MenuTextItem("Dashboard", "View active predictive markets and global sentiment") { isMenuOpen = false; currentRoute = "circus" }
                            MenuTextItem("Developer Workbench", "Simulated phone, drift calibration graphs, & project roadmaps") { currentRoute = "data"; isMenuOpen = false }
                            MenuTextItem("Sybil Defense", "Manage firewall, captcha metrics, and ML models") { currentRoute = "shield"; isMenuOpen = false }
                            MenuTextItem("On-Chain Logs", "Access terminal for unredacted raw execution logs") { currentRoute = "kaito"; isMenuOpen = false }
                            MenuTextItem("System Diagnostics", "Live core agent health check, Gemini link status & math thresholds") { currentRoute = "diagnostics"; isMenuOpen = false }
                            MenuTextItem("Admin Portal (Restricted)", "Super-user dashboard for module diagnostics and secrets") { currentRoute = "admin"; isMenuOpen = false }
                            MenuTextItem("Morpho O-Vaults", "Strictly overcollateralized lending and Morpho integration") { currentRoute = "morpho"; isMenuOpen = false }
                            MenuTextItem("Aerodrome V3", "Provision liquidity to concentrated DEX pools via Aerodrome") { currentRoute = "aero"; isMenuOpen = false }
                            MenuTextItem("Help & Degen Forum", "Interactive tutorials, user forum, and system API docs") { currentRoute = "help_forum"; isMenuOpen = false }
                            MenuTextItem("Settings", "Configure your localized preferences and environment variables") { currentRoute = "settings"; isMenuOpen = false }
                            MenuTextItem("Agent Neural History", "Historical transcripts of unhinged portfolio roasts") { currentRoute = "history"; isMenuOpen = false }
                            
                            Spacer(Modifier.height(32.dp))
                            Text("THEMES (EXPERIMENTAL)", color = theme.brandPrimary, style = androidx.compose.ui.text.TextStyle(shadow = androidx.compose.ui.graphics.Shadow(theme.brandPrimary, blurRadius = 8f)), fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontSize = 13.sp)
                            MenuTextItem("OV-BorgGreen", "Premium black-and-green aesthetic mirroring convictionmarkets.io") { vm.setTheme(ThemeStyle.BORG_GREEN); isMenuOpen = false }
                            MenuTextItem("Shabby Chic Retro", "High end luxury shabby chic retro neon") { vm.setTheme(ThemeStyle.SHABBY_CHIC_RETRO); isMenuOpen = false }
                            MenuTextItem("Lux Mat Plasma", "Blacker than black, ultra-max super fidelity gold flake sheen") { vm.setTheme(ThemeStyle.LUX_MAT_PLASMA); isMenuOpen = false }
                        }
                        // Right Column: Profile Menu
                        Column(Modifier.weight(1f)) {
                            Text("USER_PROFILE", color = theme.brandAccent, style = androidx.compose.ui.text.TextStyle(shadow = androidx.compose.ui.graphics.Shadow(theme.brandAccent, blurRadius = 8f)), fontWeight = FontWeight.Bold, fontFamily = com.example.ui.theme.ArialNarrowFamily, fontSize = 16.sp)
                            Spacer(Modifier.height(16.dp))
                            MenuTextItem("Profile & VIP Hub", "Manage your creator and VIP dashboard with your NFT Wall") { currentRoute = "profile"; isMenuOpen = false }
                            MenuTextItem("Portfolio", "Review your personal holdings and vault balances") { isMenuOpen = false }
                            MenuTextItem("Connect Web3", "Authenticate with your decentralized wallet") { vm.openWalletConnectDialog(); isMenuOpen = false }
                            MenuTextItem("NOTIFICATIONS", "View all recent system alerts and rewards") { isNotificationsSidebarOpen = true; isMenuOpen = false }
                            MenuTextItem("Achievements: ${"%.1f".format(state.xp)} XP", "Quest progress and experience points") { isMenuOpen = false }
                            MenuTextItem("Wallet: $${"%.2f".format(balanceValue)}", "Current available liquid cash balance") { isMenuOpen = false }
                            MenuTextItem("API Hub", "Generate connection keys for programmatic trading") { isMenuOpen = false }
                            MenuTextItem("Sign Out", "Terminate secure session and lock local artifacts") { isMenuOpen = false }
                        }
                    }
                }
            }
            }
        }
        AnimatedVisibility(
            visible = state.isAiChatOpen,
            enter = slideInHorizontally(initialOffsetX = { it }),
            exit = slideOutHorizontally(targetOffsetX = { it }),
            modifier = Modifier.fillMaxSize()
        ) {
            com.example.ui.screens.AiChatScreen(vm)
        }

        AnimatedVisibility(
            visible = state.isSentimentFeedOpen,
            enter = slideInHorizontally(initialOffsetX = { it }),
            exit = slideOutHorizontally(targetOffsetX = { it }),
            modifier = Modifier.fillMaxSize()
        ) {
            com.example.ui.screens.SentimentFeedSidebar(vm)
        }
        
        AnimatedVisibility(
            visible = isNotificationsSidebarOpen,
            enter = slideInHorizontally(initialOffsetX = { it }),
            exit = slideOutHorizontally(targetOffsetX = { it }),
            modifier = Modifier.fillMaxSize()
        ) {
            com.example.ui.screens.GambitUpdatesSidebar(vm, onClose = { isNotificationsSidebarOpen = false })
        }
        
        // Popups removed for new Notifications Screen
        
        if (state.isWalletConnectDialogOpen) {
            com.example.ui.components.Web3ConnectWalletDialog(
                vm = vm,
                onDismiss = { vm.closeWalletConnectDialog() }
            )
        }

        com.example.ui.components.ConvictionDashboardOverlay(
            isVisible = isDashboardOpen,
            onClose = { isDashboardOpen = false },
            vm = vm
        )
    }
}

@Composable
fun MenuTextItem(label: String, tooltip: String, onClick: () -> Unit = {}) {
    HoverTooltip(text = tooltip, modifier = Modifier.fillMaxWidth()) {
        Text(
            text = "> $label",
            color = Color.White,
            modifier = Modifier
                .fillMaxWidth()
                .clickable { onClick() }
                .padding(vertical = 12.dp, horizontal = 8.dp),
            fontFamily = com.example.ui.theme.ArialFamily, // Applied 10pt Arial font update
            fontSize = 14.sp // 14sp is equivalent to 10pt on baseline scale density
        )
    }
}

fun Modifier.blendMode(blendMode: BlendMode): Modifier = this.drawWithContent {
    drawIntoCanvas { canvas ->
        canvas.saveLayer(
            bounds = androidx.compose.ui.geometry.Rect(0f, 0f, size.width, size.height),
            paint = androidx.compose.ui.graphics.Paint().apply {
                this.blendMode = blendMode
            }
        )
        drawContent()
        canvas.restore()
    }
}

@Composable
fun GoldenLiquidSheenCutoutButton(
    onClick: (() -> Unit)?,
    modifier: Modifier = Modifier,
    isSelected: Boolean = false,
    shape: androidx.compose.ui.graphics.Shape = RoundedCornerShape(topStart = 14.dp, topEnd = 6.dp, bottomEnd = 14.dp, bottomStart = 6.dp),
    icon: ImageVector? = null,
    iconSize: Dp = 22.dp,
    emoticon: String? = null,
    contentDescription: String? = null
) {
    val infiniteTransition = rememberInfiniteTransition(label = "gold_sheen_button")
    
    // Smooth looping liquid gold shine animation sweeping diagonally
    val shineProgress by infiniteTransition.animateFloat(
        initialValue = -1.5f,
        targetValue = 2.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(2600, easing = EaseInOutQuad),
            repeatMode = RepeatMode.Restart
        ),
        label = "shine_progress"
    )

    // Ultra high-fidelity liquid gold brush
    val goldenLiquidBrush = Brush.linearGradient(
        colors = listOf(
            Color(0xFF78590D), // Deep bronze
            Color(0xFFC59B27), // Medium gold
            Color(0xFFFFF1A8), // Luminous vanilla gleam
            Color(0xFFFFD700), // Rich classic gold
            Color(0xFFB08D26), // Deep satin gold
            Color(0xFF78590D)  // Deep bronze
        )
    )

    // Border highlight gradient
    val borderGlow = Brush.linearGradient(
        colors = if (isSelected) {
            listOf(Color(0xFFFFFFFF), Color(0xFFFFEA7C), Color(0xFFFFD700), Color(0xFFFFFFFF))
        } else {
            listOf(Color(0xFFB08D26), Color(0xFF503D0A))
        }
    )

    Box(
        modifier = modifier
            .border(
                border = BorderStroke(
                    width = if (isSelected) 1.8.dp else 1.dp,
                    brush = borderGlow
                ),
                shape = shape
            )
            .clip(shape)
            .let { 
                if (onClick != null) it.clickable(onClick = onClick) else it 
            }
            .graphicsLayer {
                // IMPORTANT: Enable offscreen compositing so BlendMode.DstOut only clears the gold background inside this Box
                compositingStrategy = CompositingStrategy.Offscreen
            },
        contentAlignment = Alignment.Center
    ) {
        // 1. Draw the golden liquid sheen background and the moving shine highlight
        Canvas(modifier = Modifier.fillMaxSize()) {
            // Draw the base liquid gold background
            drawRoundRect(
                brush = goldenLiquidBrush,
                size = size
            )

            // Draw the sweeping metallic liquid reflection sheen
            val progressPx = shineProgress * size.width
            val shineWidth = size.width * 0.4f
            drawRect(
                brush = Brush.linearGradient(
                    colors = listOf(
                        Color.Transparent,
                        Color.White.copy(alpha = 0.25f),
                        Color.White.copy(alpha = 0.75f),
                        Color.White.copy(alpha = 0.25f),
                        Color.Transparent
                    ),
                    start = Offset(progressPx - shineWidth, 0f),
                    end = Offset(progressPx + shineWidth, size.height)
                ),
                size = size,
                blendMode = BlendMode.SrcAtop // Constrain to gold shape bounds
            )
        }

        // 2. Cookie cutter cutout of the symbol or emoticon
        if (icon != null) {
            Icon(
                imageVector = icon,
                contentDescription = contentDescription,
                modifier = Modifier
                    .size(iconSize)
                    .blendMode(BlendMode.DstOut),
                tint = Color.Black // Solid color with 1.0 alpha punches the hole
            )
        } else if (emoticon != null) {
            Text(
                text = emoticon,
                fontSize = 18.sp,
                fontWeight = FontWeight.Black,
                fontFamily = FontFamily.Monospace,
                modifier = Modifier
                    .blendMode(BlendMode.DstOut)
            )
        }
    }
}

data class NavItem(val route: String, val label: String, val icon: ImageVector, val tooltip: String = "")
