package com.example.navigation
import com.example.ui.components.HoverTooltip
import com.example.ui.components.neonIconComposer
import com.example.ui.components.getGlassReflectionBrush
import com.example.ui.components.glassReflection
import com.example.ui.components.SlateSubduedColor
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithCache
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.graphics.CompositingStrategy
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.res.painterResource
import androidx.compose.foundation.Image
import androidx.compose.ui.Alignment
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GambitNavigation(vm: GambitViewModel) {
    var currentRoute by remember { mutableStateOf("circus") }
    val state by vm.state.collectAsState()
    val balanceValue = state.madxBalance
    var isMenuOpen by remember { mutableStateOf(false) }

    ProvideGambitTheme(state.currentTheme) {
        val theme = LocalGambitTheme.current
        Box(Modifier.fillMaxSize()) {
            Scaffold(
                containerColor = theme.bgDeep,
                contentWindowInsets = WindowInsets.systemBars,
                floatingActionButton = {
                    androidx.compose.material3.FloatingActionButton(
                        onClick = { vm.toggleAiChat() },
                        containerColor = Color.Black,
                        contentColor = Color.Unspecified,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .size(60.dp)
                            .border(1.2.dp, theme.brandSecondary, RoundedCornerShape(12.dp))
                    ) {
                        androidx.compose.foundation.Image(
                            painter = androidx.compose.ui.res.painterResource(id = com.example.R.drawable.mad_logo),
                            contentDescription = "AI Hub Logo",
                            modifier = Modifier.fillMaxSize(),
                            contentScale = ContentScale.Fit
                        )
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
                                        .height(40.dp)
                                        .fillMaxWidth(0.5f), // to have it left aligned but not take up entire top app bar width if unnecessary
                                    contentScale = androidx.compose.ui.layout.ContentScale.Fit,
                                    alignment = Alignment.CenterStart
                                )
                            },
                        actions = {
                            var isNotificationsOpen by remember { mutableStateOf(false) }
                            
                            // PROPOSE MARKET button in top menu when on predictive markets (circus)
                            if (currentRoute == "circus") {
                                Button(
                                    onClick = {
                                        vm.playFeedbackTone(android.media.ToneGenerator.TONE_PROP_ACK, 70)
                                        vm.setShowProposeModal(true)
                                    },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = Color.White.copy(alpha = 0.08f),
                                        contentColor = theme.brandSecondary
                                    ),
                                    modifier = Modifier
                                        .padding(end = 8.dp)
                                        .border(
                                            BorderStroke(
                                                1.dp,
                                                Brush.linearGradient(
                                                    listOf(
                                                        Color.White.copy(alpha = 0.3f),
                                                        Color.White.copy(alpha = 0.05f)
                                                    )
                                                )
                                            ),
                                            androidx.compose.foundation.shape.RoundedCornerShape(8.dp)
                                        ),
                                    shape = androidx.compose.foundation.shape.RoundedCornerShape(8.dp),
                                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                                    ) {
                                        Text("🔮", fontSize = 12.sp)
                                        Text(
                                            "PROPOSE",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Black,
                                            fontFamily = com.example.ui.theme.AllertaStencilFamily,
                                            letterSpacing = 1.sp
                                        )
                                    }
                                }
                            }
                            
                            HoverTooltip(text = "View Platform Alerts") {
                                Box(
                                    modifier = Modifier
                                        .padding(end = 8.dp)
                                        .size(40.dp)
                                        .glassReflection(
                                            baseColor = theme.brandSecondary,
                                            shape = RoundedCornerShape(8.dp)
                                        )
                                        .clickable { isNotificationsOpen = true },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Box(Modifier.fillMaxSize().background(getGlassReflectionBrush(theme.brandSecondary)))
                                    Icon(
                                        Icons.Filled.Notifications, 
                                        contentDescription = "View alerts", 
                                        modifier = Modifier.size(20.dp).neonIconComposer(isActive = true),
                                        tint = Color.White
                                    )
                                }
                            }
                            HoverTooltip(text = "Expand global platform menu") {
                                Box(
                                    modifier = Modifier
                                        .padding(end = 8.dp)
                                        .size(40.dp)
                                        .glassReflection(
                                            baseColor = theme.brandPrimary,
                                            shape = RoundedCornerShape(8.dp)
                                        )
                                        .clickable { isMenuOpen = true },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Box(Modifier.fillMaxSize().background(getGlassReflectionBrush(theme.brandPrimary)))
                                    Icon(
                                        Icons.Filled.Menu, 
                                        contentDescription = "Open full menu", 
                                        modifier = Modifier.size(20.dp).neonIconComposer(isActive = true),
                                        tint = Color.White
                                    )
                                }
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
                            .padding(horizontal = 14.dp, vertical = 6.dp)
                    ) {
                        com.example.ui.components.IntegratedTickerWidget(
                            isSatireMode = false,
                            telemetry = state.telemetryStats,
                            isNeuralOnly = false,
                            isClickable = true
                        )
                    }
                }
                },
                bottomBar = {
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
                                    val buttonColor = if (isSelected) theme.brandSecondary else Color.Gray.copy(alpha = 0.5f)
                                    Box(
                                        modifier = Modifier
                                            .size(54.dp, 32.dp)
                                            .glassReflection(
                                                baseColor = buttonColor,
                                                shape = RoundedCornerShape(10.dp)
                                            ),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        // Glass Reflection Layer inside the button (subtle sheen matching current button color)
                                        Box(
                                            Modifier
                                                .fillMaxSize()
                                                .background(getGlassReflectionBrush(buttonColor))
                                        )
                                        
                                        val iconModifier = Modifier
                                            .size(if (isSelected) 24.dp else 20.dp)
                                            .neonIconComposer(isSelected)

                                        Icon(
                                            item.icon, 
                                            contentDescription = item.label,
                                            modifier = iconModifier,
                                            tint = if (isSelected) Color.White else SlateSubduedColor
                                        )
                                    }
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
            ) { padding ->
            Box(Modifier.padding(padding).fillMaxSize()) {
                // Background themes global effects
                if (theme.isPopArt) {
                    Box(Modifier.fillMaxSize().background(com.example.ui.theme.NeonGridBrush))
                } else if (state.currentTheme == com.example.ui.theme.ThemeStyle.BORG_GREEN) {
                    // Cyber terminal scanline plus light emerald green gradient
                    Box(Modifier.fillMaxSize().background(
                        androidx.compose.ui.graphics.Brush.verticalGradient(
                            listOf(Color(0xFF50C878).copy(alpha = 0.08f), Color(0xFF39FF14).copy(alpha = 0.05f))
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
                            Text("PLATFORM", color = theme.brandSecondary, style = androidx.compose.ui.text.TextStyle(shadow = androidx.compose.ui.graphics.Shadow(theme.brandSecondary, blurRadius = 5f)), fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace, fontSize = 18.sp)
                            Spacer(Modifier.height(16.dp))
                            MenuTextItem("Dashboard", "View active predictive markets and global sentiment") { isMenuOpen = false; currentRoute = "circus" }
                            MenuTextItem("Market Analytics", "Deep dive into real-time data, liquidations, & orderflow") { currentRoute = "data"; isMenuOpen = false }
                            MenuTextItem("Sybil Defense", "Manage firewall, captcha metrics, and ML models") { currentRoute = "shield"; isMenuOpen = false }
                            MenuTextItem("On-Chain Logs", "Access terminal for unredacted raw execution logs") { currentRoute = "kaito"; isMenuOpen = false }
                            MenuTextItem("Admin Portal (Restricted)", "Super-user dashboard for module diagnostics and secrets") { currentRoute = "admin"; isMenuOpen = false }
                            MenuTextItem("Morpho O-Vaults", "Strictly overcollateralized lending and Morpho integration") { currentRoute = "morpho"; isMenuOpen = false }
                            MenuTextItem("Aerodrome V3", "Provision liquidity to concentrated DEX pools via Aerodrome") { currentRoute = "aero"; isMenuOpen = false }
                            MenuTextItem("Settings", "Configure your localized preferences and environment variables") { isMenuOpen = false }
                            
                            Spacer(Modifier.height(32.dp))
                            Text("THEMES (EXPERIMENTAL)", color = theme.brandPrimary, style = androidx.compose.ui.text.TextStyle(shadow = androidx.compose.ui.graphics.Shadow(theme.brandPrimary, blurRadius = 8f)), fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace, fontSize = 14.sp)
                            MenuTextItem("Borg Green", "Dark and ambient green and gunmetal") { vm.setTheme(ThemeStyle.BORG_GREEN); isMenuOpen = false }
                            MenuTextItem("Shabby Chic Retro", "High end luxury shabby chic retro neon") { vm.setTheme(ThemeStyle.SHABBY_CHIC_RETRO); isMenuOpen = false }
                            MenuTextItem("Lux Mat Plasma", "Blacker than black, ultra-max super fidelity gold flake sheen") { vm.setTheme(ThemeStyle.LUX_MAT_PLASMA); isMenuOpen = false }
                        }
                        // Right Column: Profile Menu
                        Column(Modifier.weight(1f)) {
                            Text("USER_PROFILE", color = theme.brandAccent, style = androidx.compose.ui.text.TextStyle(shadow = androidx.compose.ui.graphics.Shadow(theme.brandAccent, blurRadius = 8f)), fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace, fontSize = 18.sp)
                            Spacer(Modifier.height(16.dp))
                            MenuTextItem("Profile & VIP Hub", "Manage your creator and VIP dashboard with your NFT Wall") { currentRoute = "profile"; isMenuOpen = false }
                            MenuTextItem("Portfolio", "Review your personal holdings and vault balances") { isMenuOpen = false }
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
            fontFamily = FontFamily.Monospace,
            fontSize = 14.sp
        )
    }
}

data class NavItem(val route: String, val label: String, val icon: ImageVector, val tooltip: String = "")
