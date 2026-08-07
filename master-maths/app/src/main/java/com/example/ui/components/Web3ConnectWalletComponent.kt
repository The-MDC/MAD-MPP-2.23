package com.example.ui.components

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.example.model.AuthState
import com.example.ui.theme.*
import com.example.viewmodel.GambitViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun Web3ConnectWalletDialog(
    vm: GambitViewModel,
    onDismiss: () -> Unit
) {
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.75f))
                .clickable { onDismiss() }
                .padding(16.dp),
            contentAlignment = Alignment.Center
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth(0.92f)
                    .widthIn(max = 480.dp)
                    .shadow(24.dp, RoundedCornerShape(16.dp), spotColor = NeonCyan)
                    .clickable(enabled = false) {} // prevent dismissing when clicking inside the content
            ) {
                Web3ConnectWalletComponent(
                    vm = vm,
                    onDismiss = onDismiss
                )
            }
        }
    }
}

@Composable
fun Web3ConnectWalletComponent(
    vm: GambitViewModel,
    onDismiss: (() -> Unit)?,
    modifier: Modifier = Modifier
) {
    val theme = LocalGambitTheme.current
    val state by vm.state.collectAsState()
    val authState = state.authState
    val isConnected = authState.walletAddress != null
    val scope = rememberCoroutineScope()
    val clipboardManager = LocalClipboardManager.current

    var selectedProvider by remember { mutableStateOf<Web3Provider?>(null) }
    var connectingState by remember { mutableStateOf(ConnectingProgress.IDLE) }
    var inputAddress by remember { mutableStateOf("") }
    var addressError by remember { mutableStateOf<String?>(null) }
    var customAddressMode by remember { mutableStateOf(false) }
    
    // QR scan simulation
    var showQrSimulation by remember { mutableStateOf(false) }
    var qrProgress by remember { mutableStateOf(0f) }

    // Seed phrase simulation
    var showSeedSimulation by remember { mutableStateOf(false) }
    var seedWords by remember { mutableStateOf(List(12) { "" }) }
    var isSeedVerifying by remember { mutableStateOf(false) }

    val providers = remember {
        listOf(
            Web3Provider("metamask", "MetaMask", Color(0xFFF6851B), "Popular Ethereum Software Wallet", Icons.Default.Pets),
            Web3Provider("walletconnect", "WalletConnect", Color(0xFF3B99FC), "Decentralized Bridging Standard", Icons.Default.Language),
            Web3Provider("coinbase", "Coinbase Wallet", Color(0xFF0052FF), "Institutional Grade Self-Custody", Icons.Default.AccountBalance),
            Web3Provider("trust", "Trust Wallet", Color(0xFF3375BB), "Multi-Chain Secure Vault", Icons.Default.Shield),
            Web3Provider("phantom", "Phantom Wallet", Color(0xFFAB9FF2), "Solana & EVM High Performance", Icons.Default.Visibility)
        )
    }

    Column(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .background(theme.bgCard)
            .border(1.5.dp, theme.brandSecondary.copy(alpha = 0.35f), RoundedCornerShape(16.dp))
            .padding(16.dp)
            .testTag("web3_connect_wallet_component")
    ) {
        // Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .background(theme.brandSecondary.copy(alpha = 0.15f), CircleShape)
                        .border(1.dp, theme.brandSecondary, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.AccountBalanceWallet,
                        contentDescription = "Wallet Icon",
                        tint = theme.brandSecondary,
                        modifier = Modifier.size(16.dp)
                    )
                }
                Spacer(Modifier.width(10.dp))
                Column {
                    Text(
                        text = "WEB3 PORTAL GATEWAY",
                        color = Color.White,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = FontFamily.Monospace,
                        letterSpacing = 1.sp
                    )
                    Text(
                        text = "SECURE DECENTRALIZED IDENTITY",
                        color = theme.brandSecondary,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }
            if (onDismiss != null) {
                IconButton(
                    onClick = onDismiss,
                    modifier = Modifier
                        .size(30.dp)
                        .testTag("close_wallet_dialog_btn")
                ) {
                    Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.LightGray, modifier = Modifier.size(18.dp))
                }
            }
        }

        Divider(
            color = theme.brandSecondary.copy(alpha = 0.2f),
            thickness = 1.dp,
            modifier = Modifier.padding(vertical = 12.dp)
        )

        AnimatedContent(
            targetState = isConnected,
            label = "connection_status"
        ) { connected ->
            if (connected) {
                // Connected view
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // MADHATR Persona comedic message
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color.Black.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                            .border(1.dp, theme.brandAccent.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                            .padding(10.dp)
                    ) {
                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text("🎩 ", fontSize = 16.sp)
                                Text(
                                    "THE MADHAT'R SAYS:",
                                    color = theme.brandAccent,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                            Spacer(Modifier.height(4.dp))
                            Text(
                                "Hey kid! You're fully loaded and authenticated. Let's see if you got the brass to hedge the Prediction Circus, or if you're just another bot waiting to be Sybil-filtered! Grab a Hat and let's go!",
                                color = Color.White,
                                fontSize = 11.sp,
                                fontFamily = FontFamily.Monospace,
                                lineHeight = 14.sp
                            )
                        }
                    }

                    Spacer(Modifier.height(16.dp))

                    // Wallet details card
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .glassContainerBackground(theme.brandSecondary, RoundedCornerShape(12.dp))
                            .border(1.dp, theme.brandSecondary.copy(alpha = 0.25f), RoundedCornerShape(12.dp))
                            .padding(14.dp)
                    ) {
                        Column {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(8.dp)
                                            .background(NeonGreen, CircleShape)
                                    )
                                    Spacer(Modifier.width(6.dp))
                                    Text(
                                        "SECURE SESSION CONNECTED",
                                        color = NeonGreen,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        fontFamily = FontFamily.Monospace
                                    )
                                }
                                Box(
                                    modifier = Modifier
                                        .background(theme.brandSecondary.copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text(
                                        text = authState.authType,
                                        color = theme.brandSecondary,
                                        fontSize = 8.sp,
                                        fontWeight = FontWeight.Bold,
                                        fontFamily = FontFamily.Monospace
                                    )
                                }
                            }

                            Spacer(Modifier.height(10.dp))

                            Text(
                                text = "Account Address:",
                                color = Color.Gray,
                                fontSize = 10.sp,
                                fontFamily = FontFamily.Monospace
                            )
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = authState.walletAddress ?: "0x0000...0000",
                                    color = Color.White,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = FontFamily.Monospace,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                    modifier = Modifier.weight(1f)
                                )
                                IconButton(
                                    onClick = {
                                        clipboardManager.setText(AnnotatedString(authState.walletAddress ?: ""))
                                        vm.playFeedbackTone(android.media.ToneGenerator.TONE_PROP_ACK, 60)
                                    },
                                    modifier = Modifier.size(24.dp)
                                ) {
                                    Icon(Icons.Default.ContentCopy, contentDescription = "Copy Address", tint = theme.brandSecondary, modifier = Modifier.size(14.dp))
                                }
                            }

                            Spacer(Modifier.height(8.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column {
                                    Text("IDENTITY PROFILE", color = Color.Gray, fontSize = 9.sp, fontFamily = FontFamily.Monospace)
                                    Text(authState.username, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                                }
                                Column(horizontalAlignment = Alignment.End) {
                                    Text("REGISTERED EMAIL", color = Color.Gray, fontSize = 9.sp, fontFamily = FontFamily.Monospace)
                                    Text(authState.email, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                                }
                            }
                        }
                    }

                    Spacer(Modifier.height(20.dp))

                    // Disconnect button
                    Button(
                        onClick = { vm.disconnectWeb3Wallet() },
                        colors = ButtonDefaults.buttonColors(containerColor = BrandCrimson),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(44.dp)
                            .testTag("disconnect_wallet_btn")
                    ) {
                        Icon(Icons.Default.PowerSettingsNew, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(8.dp))
                        Text(
                            "TERMINATE SECURE WALLET SESSION",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
            } else {
                // Disconnected/Setup view
                Column(modifier = Modifier.fillMaxWidth()) {
                    if (connectingState != ConnectingProgress.IDLE) {
                        // Connection loading view
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                CircularProgressIndicator(
                                    color = selectedProvider?.color ?: theme.brandSecondary,
                                    strokeWidth = 3.dp,
                                    modifier = Modifier.size(64.dp)
                                )
                                Icon(
                                    imageVector = selectedProvider?.icon ?: Icons.Default.Sync,
                                    contentDescription = null,
                                    tint = selectedProvider?.color ?: theme.brandSecondary,
                                    modifier = Modifier.size(32.dp)
                                )
                            }
                            
                            Spacer(Modifier.height(16.dp))
                            
                            Text(
                                text = selectedProvider?.name?.uppercase() ?: "RESOLVING NODE",
                                color = Color.White,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Black,
                                fontFamily = FontFamily.Monospace
                            )
                            
                            Spacer(Modifier.height(6.dp))
                            
                            Text(
                                text = connectingState.statusText,
                                color = theme.brandSecondary,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace,
                                textAlign = TextAlign.Center,
                                modifier = Modifier.padding(horizontal = 24.dp)
                            )

                            Spacer(Modifier.height(24.dp))
                            
                            // Cancel connection
                            TextButton(
                                onClick = {
                                    connectingState = ConnectingProgress.IDLE
                                    selectedProvider = null
                                }
                            ) {
                                Text("CANCEL CONNECTION", color = BrandCrimson, fontSize = 10.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                            }
                        }
                    } else if (showQrSimulation) {
                        // QR Simulation
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 12.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = "SCAN DECENTRALIZED SYNC QR",
                                color = theme.brandSecondary,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace
                            )
                            
                            Spacer(Modifier.height(12.dp))
                            
                            // A retro, cyberpunk procedural QR Code canvas
                            Box(
                                modifier = Modifier
                                    .size(160.dp)
                                    .background(Color.Black, RoundedCornerShape(8.dp))
                                    .border(2.dp, theme.brandSecondary, RoundedCornerShape(8.dp))
                                    .padding(12.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Canvas(modifier = Modifier.fillMaxSize()) {
                                    val sizePx = size.width
                                    val cols = 15
                                    val cellSize = sizePx / cols
                                    
                                    // Draw background cyberpunk grids
                                    for (i in 0 until cols) {
                                        for (j in 0 until cols) {
                                            // Seed based generator mock
                                            val filled = ((i * j * 3) + i + (j * 7) + (qrProgress * 100).toInt()) % 4 == 0 ||
                                                    (i < 4 && j < 4) || (i > cols - 5 && j < 4) || (i < 4 && j > cols - 5)
                                            if (filled) {
                                                drawRect(
                                                    color = if ((i + j) % 2 == 0) NeonCyan else NeonMagenta,
                                                    topLeft = androidx.compose.ui.geometry.Offset(i * cellSize, j * cellSize),
                                                    size = androidx.compose.ui.geometry.Size(cellSize - 1.dp.toPx(), cellSize - 1.dp.toPx())
                                                )
                                            }
                                        }
                                    }
                                }
                            }

                            Spacer(Modifier.height(12.dp))
                            
                            LinearProgressIndicator(
                                progress = qrProgress,
                                color = NeonGreen,
                                trackColor = Color.DarkGray,
                                modifier = Modifier
                                    .fillMaxWidth(0.8f)
                                    .height(4.dp)
                                    .clip(CircleShape)
                            )
                            
                            Spacer(Modifier.height(8.dp))
                            
                            Text(
                                text = "ESTABLISHING SYNC TUNNEL...",
                                color = Color.Gray,
                                fontSize = 9.sp,
                                fontFamily = FontFamily.Monospace
                            )

                            Spacer(Modifier.height(16.dp))

                            TextButton(
                                onClick = {
                                    showQrSimulation = false
                                    qrProgress = 0f
                                }
                            ) {
                                Text("BACK TO PROVIDERS", color = Color.LightGray, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                            }
                        }
                    } else if (showSeedSimulation) {
                        // Seed Phrase Hardware Simulation
                        Column(modifier = Modifier.fillMaxWidth()) {
                            Text(
                                text = "CRYPTOGRAPHIC SEED RECOVERY IMPORT",
                                color = BrandGold,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace,
                                modifier = Modifier.padding(bottom = 8.dp)
                            )
                            Text(
                                text = "Import from Ledger, Trezor, or Coldcard hardware using your 12-word secure mnemonic.",
                                color = Color.Gray,
                                fontSize = 9.5.sp,
                                lineHeight = 12.sp,
                                modifier = Modifier.padding(bottom = 12.dp)
                            )

                            // 12-Word Input Grid
                            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                for (row in 0 until 4) {
                                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        for (col in 0 until 3) {
                                            val index = row * 3 + col
                                            OutlinedTextField(
                                                value = seedWords[index],
                                                onValueChange = { newValue ->
                                                    val updated = seedWords.toMutableList()
                                                    updated[index] = newValue.filter { it.isLetter() }.lowercase()
                                                    seedWords = updated
                                                },
                                                label = { Text("${index + 1}", fontSize = 8.sp, color = theme.brandSecondary) },
                                                singleLine = true,
                                                colors = OutlinedTextFieldDefaults.colors(
                                                    focusedBorderColor = theme.brandSecondary,
                                                    unfocusedBorderColor = Color.DarkGray,
                                                    focusedTextColor = Color.White,
                                                    unfocusedTextColor = Color.LightGray
                                                ),
                                                textStyle = androidx.compose.ui.text.TextStyle(fontSize = 11.sp, fontFamily = FontFamily.Monospace),
                                                modifier = Modifier
                                                    .weight(1f)
                                                    .height(42.dp)
                                            )
                                        }
                                    }
                                }
                            }

                            Spacer(Modifier.height(16.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                OutlinedButton(
                                    onClick = { showSeedSimulation = false },
                                    border = BorderStroke(1.dp, Color.Gray),
                                    shape = RoundedCornerShape(8.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Text("CANCEL", color = Color.LightGray, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                                }

                                Button(
                                    onClick = {
                                        scope.launch {
                                            isSeedVerifying = true
                                            delay(1500)
                                            isSeedVerifying = false
                                            showSeedSimulation = false
                                            // Trigger simulated web3 wallet connection
                                            vm.connectWeb3Wallet("ledger_cold", "0xLedgerDegen" + System.currentTimeMillis().toString().takeLast(6))
                                        }
                                    },
                                    enabled = seedWords.all { it.isNotBlank() } && !isSeedVerifying,
                                    colors = ButtonDefaults.buttonColors(containerColor = BrandGold),
                                    shape = RoundedCornerShape(8.dp),
                                    modifier = Modifier.weight(1.5f)
                                ) {
                                    if (isSeedVerifying) {
                                        CircularProgressIndicator(color = Color.Black, modifier = Modifier.size(16.dp))
                                    } else {
                                        Text("VERIFY & CONNECT", color = Color.Black, fontSize = 10.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                                    }
                                }
                            }
                        }
                    } else if (customAddressMode) {
                        // Custom Address Mode
                        Column(modifier = Modifier.fillMaxWidth()) {
                            Text(
                                text = "ENTER WALLET ADDDRESS MANUALLY",
                                color = theme.brandAccent,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace,
                                modifier = Modifier.padding(bottom = 8.dp)
                            )
                            
                            OutlinedTextField(
                                value = inputAddress,
                                onValueChange = {
                                    inputAddress = it
                                    addressError = null
                                },
                                label = { Text("EVM Wallet Address (0x...)", color = theme.brandSecondary, fontSize = 11.sp) },
                                singleLine = true,
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .testTag("manual_wallet_address_input"),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = theme.brandSecondary,
                                    unfocusedBorderColor = Color.DarkGray,
                                    focusedTextColor = Color.White,
                                    unfocusedTextColor = Color.LightGray
                                ),
                                textStyle = androidx.compose.ui.text.TextStyle(fontFamily = FontFamily.Monospace, fontSize = 12.sp)
                            )

                            if (addressError != null) {
                                Text(
                                    text = addressError!!,
                                    color = BrandCrimson,
                                    fontSize = 10.sp,
                                    fontFamily = FontFamily.Monospace,
                                    modifier = Modifier.padding(top = 4.dp, start = 4.dp)
                                )
                            }

                            Spacer(Modifier.height(16.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                OutlinedButton(
                                    onClick = { customAddressMode = false },
                                    border = BorderStroke(1.dp, Color.Gray),
                                    shape = RoundedCornerShape(8.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Text("CANCEL", color = Color.LightGray, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                                }

                                Button(
                                    onClick = {
                                        if (!inputAddress.startsWith("0x") || inputAddress.length != 42) {
                                            addressError = "❌ INVALID ADDRESS: MUST START WITH 0x AND HAVE 42 CHARACTERS."
                                            vm.playFeedbackTone(android.media.ToneGenerator.TONE_CDMA_SOFT_ERROR_LITE, 100)
                                        } else {
                                            scope.launch {
                                                connectingState = ConnectingProgress.RESOLVING
                                                selectedProvider = Web3Provider("custom", "Manual Address", theme.brandSecondary, "Verified Custom Connection", Icons.Default.Verified)
                                                delay(1200)
                                                connectingState = ConnectingProgress.SIGNING
                                                delay(1000)
                                                connectingState = ConnectingProgress.VERIFYING
                                                delay(800)
                                                vm.connectWeb3Wallet("custom", inputAddress)
                                                connectingState = ConnectingProgress.IDLE
                                                customAddressMode = false
                                            }
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = theme.brandSecondary),
                                    shape = RoundedCornerShape(8.dp),
                                    modifier = Modifier
                                        .weight(1.5f)
                                        .testTag("submit_manual_wallet_btn")
                                ) {
                                    Text("CONNECT WALLET", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                                }
                            }
                        }
                    } else {
                        // Standard Provider selection list
                        Text(
                            text = "SELECT WEB3 WALLET PROVIDER",
                            color = theme.brandSecondary,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                            modifier = Modifier.padding(bottom = 12.dp)
                        )

                        // List of providers
                        Column(
                            verticalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            providers.forEach { provider ->
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(Color.Black.copy(alpha = 0.3f), RoundedCornerShape(10.dp))
                                        .border(1.dp, provider.color.copy(alpha = 0.25f), RoundedCornerShape(10.dp))
                                        .clickable {
                                            scope.launch {
                                                selectedProvider = provider
                                                connectingState = ConnectingProgress.ESTABLISHING
                                                delay(800)
                                                connectingState = ConnectingProgress.RESOLVING
                                                delay(900)
                                                connectingState = ConnectingProgress.SIGNING
                                                delay(900)
                                                connectingState = ConnectingProgress.VERIFYING
                                                delay(700)
                                                vm.connectWeb3Wallet(provider.id)
                                                connectingState = ConnectingProgress.IDLE
                                                selectedProvider = null
                                            }
                                        }
                                        .padding(12.dp)
                                        .testTag("provider_${provider.id}")
                                ) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(36.dp)
                                                .background(provider.color.copy(alpha = 0.15f), CircleShape)
                                                .border(1.dp, provider.color, CircleShape),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Icon(
                                                imageVector = provider.icon,
                                                contentDescription = provider.name,
                                                tint = provider.color,
                                                modifier = Modifier.size(20.dp)
                                            )
                                        }
                                        
                                        Spacer(Modifier.width(12.dp))
                                        
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(
                                                text = provider.name,
                                                color = Color.White,
                                                fontSize = 13.sp,
                                                fontWeight = FontWeight.Bold,
                                                fontFamily = FontFamily.Monospace
                                            )
                                            Text(
                                                text = provider.desc,
                                                color = Color.Gray,
                                                fontSize = 10.sp,
                                                fontFamily = FontFamily.Monospace
                                            )
                                        }
                                        
                                        Icon(
                                            imageVector = Icons.Default.ChevronRight,
                                            contentDescription = null,
                                            tint = Color.DarkGray,
                                            modifier = Modifier.size(18.dp)
                                        )
                                    }
                                }
                            }
                        }

                        Spacer(Modifier.height(12.dp))

                        // Advanced Modes: QR scan, Seed Phrase, Manual Address
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .background(Color.Black.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                                    .border(1.dp, Color.DarkGray, RoundedCornerShape(8.dp))
                                    .clickable {
                                        scope.launch {
                                            showQrSimulation = true
                                            // Animate QR scanning loading progress bar
                                            for (i in 1..10) {
                                                qrProgress = i * 0.1f
                                                delay(250)
                                            }
                                            showQrSimulation = false
                                            qrProgress = 0f
                                            vm.connectWeb3Wallet("qr_sync")
                                        }
                                    }
                                    .padding(vertical = 10.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.QrCodeScanner, contentDescription = null, tint = theme.brandSecondary, modifier = Modifier.size(14.dp))
                                    Spacer(Modifier.width(6.dp))
                                    Text("SCAN QR", color = theme.brandSecondary, fontSize = 9.5.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                                }
                            }

                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .background(Color.Black.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                                    .border(1.dp, Color.DarkGray, RoundedCornerShape(8.dp))
                                    .clickable { showSeedSimulation = true }
                                    .padding(vertical = 10.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.VpnKey, contentDescription = null, tint = BrandGold, modifier = Modifier.size(14.dp))
                                    Spacer(Modifier.width(6.dp))
                                    Text("SEED KEY", color = BrandGold, fontSize = 9.5.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                                }
                            }

                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .background(Color.Black.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                                    .border(1.dp, Color.DarkGray, RoundedCornerShape(8.dp))
                                    .clickable { customAddressMode = true }
                                    .padding(vertical = 10.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.Edit, contentDescription = null, tint = theme.brandAccent, modifier = Modifier.size(14.dp))
                                    Spacer(Modifier.width(6.dp))
                                    Text("MANUAL", color = theme.brandAccent, fontSize = 9.5.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

data class Web3Provider(
    val id: String,
    val name: String,
    val color: Color,
    val desc: String,
    val icon: ImageVector
)

enum class ConnectingProgress(val statusText: String) {
    IDLE("IDLE"),
    ESTABLISHING("ESTABLISHING ENCRYPTED PEER-TO-PEER SOCKET..."),
    RESOLVING("RESOLVING KAITO PORTAL ETHEREUM NODE ADDRESS..."),
    SIGNING("PROMPT-SIGNATURE RECOVERY: VERIFYING CRYPTOGRAPHIC HANDSHAKE..."),
    VERIFYING("BYPASSING SYBIL CAPTCHA DEFENSE SHIELD...")
}
