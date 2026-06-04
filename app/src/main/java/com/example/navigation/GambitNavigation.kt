package com.example.navigation
import com.example.ui.components.HoverTooltip
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
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
                        containerColor = theme.brandSecondary,
                        contentColor = theme.bgDeep
                    ) {
                        Icon(Icons.Filled.SupportAgent, contentDescription = "AI Hub")
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
                            HoverTooltip(text = "View Platform Alerts") {
                                IconButton(
                                    onClick = { isNotificationsOpen = true },
                                    modifier = Modifier
                                        .padding(end = 8.dp)
                                        .border(1.dp, theme.borderBrush, androidx.compose.foundation.shape.RoundedCornerShape(8.dp))
                                ) {
                                    Icon(Icons.Filled.Notifications, contentDescription = "View alerts", tint = theme.brandSecondary)
                                }
                            }
                            HoverTooltip(text = "Expand global platform menu") {
                                IconButton(
                                    onClick = { isMenuOpen = true },
                                    modifier = Modifier
                                        .padding(end = 8.dp)
                                        .border(1.dp, theme.borderBrush, androidx.compose.foundation.shape.RoundedCornerShape(8.dp))
                                ) {
                                    Icon(Icons.Filled.Menu, contentDescription = "Open full menu", tint = theme.brandPrimary)
                                }
                            }
                            com.example.ui.components.NotificationDrawer(
                                isOpen = isNotificationsOpen,
                                onDismiss = { isNotificationsOpen = false }
                            )
                        }
                    )
                        com.example.ui.components.SatireTickerWidget()
                    }
                },
                bottomBar = {
                NavigationBar(modifier = Modifier.background(theme.brushedMetal), containerColor = androidx.compose.ui.graphics.Color.Transparent) {
                    val items = listOf(
                        NavItem("circus", "Circus", Icons.Filled.Insights, "Predictive Markets"),
                        NavItem("shield", "Shield", Icons.Filled.Shield, "Sybil Defense"),
                        NavItem("auction", "Auction", Icons.Filled.LocalFireDepartment, "Token Auctions"),
                        NavItem("kaito", "Terminal", Icons.Filled.Terminal, "System Console"),
                        NavItem("stake", "Stake", Icons.Filled.AccountBalanceWallet, "Liquid Staking")
                    )
                    items.forEach { item ->
                        NavigationBarItem(
                            selected = currentRoute == item.route,
                            onClick = { currentRoute = item.route },
                            icon = { 
                                Icon(item.icon, contentDescription = item.label)
                            },
                            label = { Text(item.label, fontSize = 9.5.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace) },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = theme.bgDeep,
                                selectedTextColor = theme.brandSecondary,
                                unselectedIconColor = theme.textSecondary.copy(alpha=0.5f),
                                unselectedTextColor = theme.textSecondary.copy(alpha=0.5f),
                                indicatorColor = theme.brandSecondary
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
            enter = slideInVertically(initialOffsetY = { it }),
            exit = slideOutVertically(targetOffsetY = { it }),
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
