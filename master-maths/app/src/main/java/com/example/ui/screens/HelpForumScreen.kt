package com.example.ui.screens

import kotlinx.serialization.Serializable
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.animation.*
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.components.glassContainerBackground
import com.example.ui.components.innerGlassContainerBackground
import com.example.ui.components.getGlassReflectionBrush
import com.example.ui.components.glassReflection
import com.example.ui.components.neonIconComposer
import com.example.ui.theme.*
import com.example.viewmodel.GambitViewModel
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HelpForumScreen(vm: GambitViewModel) {
    val theme = LocalGambitTheme.current
    var selectedTab by remember { mutableStateOf(0) }
    val tabs = listOf("📖 HELP & HOW-TO", "🌋 DEGEN FORUM", "📡 GEN-LANG SYSTEM API")

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        // Main Title Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column {
                Text(
                    text = "🔮 KNOWLEDGE BASE & CONSENSUS INTERFACE",
                    color = theme.brandSecondary,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = AllertaStencilFamily
                )
                Text(
                    text = "MΛD Gambit manual, serverless protocol API, and peer degen communications ledger",
                    color = theme.textSecondary,
                    fontSize = 10.sp,
                    fontFamily = FontFamily.Monospace
                )
            }
            Icon(
                Icons.Filled.AutoAwesome,
                contentDescription = "MΛD Spark",
                tint = BrandGold,
                modifier = Modifier.size(24.dp).neonIconComposer(true)
            )
        }

        // Segmented Tabs Header
        TabRow(
            selectedTabIndex = selectedTab,
            containerColor = Color.Transparent,
            contentColor = Color.White,
            indicator = { tabPositions ->
                TabRowDefaults.SecondaryIndicator(
                    modifier = Modifier.tabIndicatorOffset(tabPositions[selectedTab]),
                    color = theme.brandPrimary
                )
            },
            divider = {
                HorizontalDivider(color = Color.White.copy(alpha = 0.1f))
            },
            modifier = Modifier.padding(bottom = 16.dp)
        ) {
            tabs.forEachIndexed { index, text ->
                Tab(
                    selected = selectedTab == index,
                    onClick = {
                        selectedTab = index
                        vm.playFeedbackTone(android.media.ToneGenerator.TONE_PROP_ACK, 40)
                    },
                    text = {
                        Text(
                            text = text,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                            color = if (selectedTab == index) Color.White else Color.Gray
                        )
                    }
                )
            }
        }

        // Tab Content
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
        ) {
            when (selectedTab) {
                0 -> HowToHelpSection()
                1 -> DegenForumSection(vm)
                2 -> GenLangApiDocSection()
            }
        }
    }
}

// --------------------- Tab 1: How To / Help Section ---------------------
@Composable
fun HowToHelpSection() {
    val scrollState = rememberScrollState()
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        HelpItemCard(
            title = "1. TARGET CONVICTION & MULTIPLIERS (LMSR)",
            icon = Icons.Filled.TrendingUp,
            color = NeonCyan,
            description = "At the heart of any wager, your Conviction index (1-100) directly scales the mathematical weight of your outcome score. We leverage a Logarithmic Market Scoring Rule (LMSR) to continuously re-balance card ratios and payouts on-demand. High conviction yields multipliers up to 5.5x but subjects your balance to loss aversion factors scaled exponentially via Fibonacci intervals [5, 8, 13, 21, 34]. Avoid trading naked predictions without appropriate credit backing!"
        )

        HelpItemCard(
            title = "2. THE DUTCH AUCTION SCANDAL PACK MECHANIC",
            icon = Icons.Filled.LocalFireDepartment,
            color = BrandGold,
            description = "Predictive Scandal Packs are minted into primary distribution using a Dutch Auction format. Each epoch starts with a high-stakes valuation of 100 \$MADx which linearly declines to a guaranteed floor price of 15 \$MADx over the auction period. Snip packs early to secure ultra-rare frames and gold-foil editions before the ledger is exhausted by automated bots!"
        )

        HelpItemCard(
            title = "3. DEGEN DAILY MISSION HUB & POWER SCORE",
            icon = Icons.Filled.MilitaryTech,
            color = NeonPink,
            description = "Completing daily missions increases your degen narrative footprint, granting XP to advance your general power multiplier. High XP tiers unlock custom profile frames, higher-frequency AMM limiters, and lower platform fees (baseline 188 BPS). Missions are dynamically generated by Gemini and refreshed inside the decentralized ledger at 00:00 UTC."
        )

        HelpItemCard(
            title = "4. MAD SHIELD SYBIL FIREWALL",
            icon = Icons.Filled.Shield,
            color = NeonGreen,
            description = "Our proprietary Sybil mitigation engine actively scrutinizes transaction flows, timing consistency, and sentiment telemetry. If the EigenTrust heuristics match bad-actor bot activity, your account is throttled and forced into a 'Plausible Reality' verification loop. Running active MAD Shield insurance contracts dynamically absorbs liquidated balances during oracle divergence crises."
        )
    }
}

@Composable
fun HelpItemCard(
    title: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    color: Color,
    description: String
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .glassContainerBackground(baseColor = color, shape = RoundedCornerShape(12.dp))
            .padding(14.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(
                    icon,
                    contentDescription = null,
                    tint = color,
                    modifier = Modifier.size(20.dp).neonIconComposer(true)
                )
                Text(
                    title,
                    color = color,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp
                )
            }
            Text(
                description,
                color = Color.LightGray,
                fontSize = 11.sp,
                fontFamily = FontFamily.SansSerif,
                lineHeight = 16.sp
            )
        }
    }
}

// --------------------- Tab 2: Degen Forum Section ---------------------
@Serializable
data class ForumPost(
    val id: String,
    val author: String,
    val category: String,
    val title: String,
    val summary: String,
    val timestamp: String,
    var likes: Int,
    var repliesCount: Int
)

@Composable
fun DegenForumSection(vm: GambitViewModel) {
    val theme = LocalGambitTheme.current
    var posts by remember {
        mutableStateOf(
            listOf(
                ForumPost("1", "Ape_4082", "🌋 CHAOS", "Shoring Elon's mood swings with Morpho Vault collateral", "Leveraging our fixed-rate Morpho USDC vault to long-stake Twitter sentiment shifts. He just tweeted a top hat emoji. This is legal conviction confirmation.", "2 mins ago", 48, 12),
                ForumPost("2", "Whale_88", "🏦 CONVICTION", "Kalshi absolute clone detected on Arbitrum network", "A high-affinity copycat prediction market just deployed contracts on Base/Arbitrum copy-pasting the BPS pool metrics. Sledgehammering with local MAD Shield immediately.", "1 hr ago", 124, 38),
                ForumPost("3", "Sniper_0x", "🃏 CARDS", "Jamie Burke's secret hat collection evolution ratio leaks", "Insiders leaked that burning 5 Epic top-hat cards triggers a Mythic Outliers Overlord deity yielding +88% Clout Multipliers. Accumulating floor common cards now.", "5 hrs ago", 76, 18),
                ForumPost("4", "SolanaGamer", "🌋 CHAOS", "Targeting maximum GARCH volatility on Base Memecoins", "We need a decentralized consensus proposal on resolving Memecoin sentiment indices using Kaito API directly. Oracles are desynchronized because of liquidity width.", "1 day ago", 32, 9)
            )
        )
    }

    var showNewPostDialog by remember { mutableStateOf(false) }
    var newTitle by remember { mutableStateOf("") }
    var newContent by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf("🌋 CHAOS") }
    val categories = listOf("🌋 CHAOS", "🏦 CONVICTION", "🃏 CARDS", "📡 API")

    Column(modifier = Modifier.fillMaxSize()) {
        // Search & Add post actions
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                "💬 PROTOCOL LEDGER DISCUSSION:",
                color = theme.brandAccent,
                fontSize = 12.sp,
                fontFamily = FontFamily.Monospace,
                fontWeight = FontWeight.Bold
            )
            Button(
                onClick = {
                    vm.playFeedbackTone(android.media.ToneGenerator.TONE_PROP_ACK, 60)
                    showNewPostDialog = true
                },
                colors = ButtonDefaults.buttonColors(containerColor = theme.brandPrimary),
                shape = RoundedCornerShape(6.dp),
                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                modifier = Modifier.height(28.dp)
            ) {
                Icon(Icons.Filled.Add, contentDescription = null, modifier = Modifier.size(12.dp), tint = Color.Black)
                Spacer(Modifier.width(4.dp))
                Text("NEW TOPIC", color = Color.Black, fontSize = 9.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
            }
        }

        LazyColumn(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(posts) { post ->
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .innerGlassContainerBackground(baseColor = theme.brandAccent, shape = RoundedCornerShape(10.dp))
                        .padding(12.dp)
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .background(Color.Black.copy(alpha = 0.5f), RoundedCornerShape(4.dp))
                                        .border(0.5.dp, theme.brandAccent.copy(alpha = 0.5f), RoundedCornerShape(4.dp))
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text(
                                        post.category,
                                        color = theme.brandPrimary,
                                        fontSize = 8.sp,
                                        fontWeight = FontWeight.Bold,
                                        fontFamily = FontFamily.Monospace
                                    )
                                }
                                Text(
                                    post.author,
                                    color = Color.White.copy(alpha = 0.7f),
                                    fontSize = 10.sp,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                            Text(
                                post.timestamp,
                                color = Color.Gray,
                                fontSize = 9.sp,
                                fontFamily = FontFamily.Monospace
                            )
                        }

                        Text(
                            post.title,
                            color = Color.White,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.SansSerif
                        )

                        Text(
                            post.summary,
                            color = Color.LightGray,
                            fontSize = 11.sp,
                            lineHeight = 15.sp
                        )

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 4.dp),
                            horizontalArrangement = Arrangement.spacedBy(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                modifier = Modifier.clickable {
                                    vm.playFeedbackTone(android.media.ToneGenerator.TONE_PROP_ACK, 30)
                                    posts = posts.map {
                                        if (it.id == post.id) it.copy(likes = it.likes + 1) else it
                                    }
                                },
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Icon(Icons.Filled.ThumbUp, contentDescription = "Like", tint = BrandGold, modifier = Modifier.size(12.dp))
                                Text("${post.likes}", color = BrandGold, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                            }

                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Icon(Icons.Filled.ChatBubbleOutline, contentDescription = "Replies", tint = NeonCyan, modifier = Modifier.size(12.dp))
                                Text("${post.repliesCount}", color = NeonCyan, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                            }
                        }
                    }
                }
            }
        }
    }

    if (showNewPostDialog) {
        AlertDialog(
            onDismissRequest = { showNewPostDialog = false },
            title = {
                Text(
                    "🌋 PROPAGATE NEW NARRATIVE",
                    color = theme.brandSecondary,
                    fontSize = 14.sp,
                    fontFamily = AllertaStencilFamily,
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text("Select Category Ledger:", color = Color.Gray, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                    
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        categories.forEach { cat ->
                            val isSel = cat == selectedCategory
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .background(
                                        if (isSel) theme.brandPrimary.copy(alpha = 0.2f) else Color.Transparent,
                                        RoundedCornerShape(4.dp)
                                    )
                                    .border(
                                        0.5.dp,
                                        if (isSel) theme.brandPrimary else Color.Gray.copy(alpha = 0.3f),
                                        RoundedCornerShape(4.dp)
                                    )
                                    .clickable { selectedCategory = cat }
                                    .padding(vertical = 4.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(cat, fontSize = 8.sp, fontWeight = FontWeight.Bold, color = if (isSel) Color.White else Color.Gray)
                            }
                        }
                    }

                    OutlinedTextField(
                        value = newTitle,
                        onValueChange = { newTitle = it },
                        label = { Text("Title", fontSize = 10.sp, color = Color.Gray) },
                        modifier = Modifier.fillMaxWidth(),
                        textStyle = androidx.compose.ui.text.TextStyle(fontSize = 11.sp, color = Color.White),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = theme.brandSecondary,
                            unfocusedBorderColor = Color.DarkGray
                        )
                    )

                    OutlinedTextField(
                        value = newContent,
                        onValueChange = { newContent = it },
                        label = { Text("Spicy narrative content...", fontSize = 10.sp, color = Color.Gray) },
                        modifier = Modifier.fillMaxWidth().height(100.dp),
                        textStyle = androidx.compose.ui.text.TextStyle(fontSize = 11.sp, color = Color.White),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = theme.brandSecondary,
                            unfocusedBorderColor = Color.DarkGray
                        )
                    )
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        if (newTitle.isNotBlank() && newContent.isNotBlank()) {
                            posts = listOf(
                                ForumPost(
                                    id = (posts.size + 1).toString(),
                                    author = "Degen_Guest",
                                    category = selectedCategory,
                                    title = newTitle,
                                    summary = newContent,
                                    timestamp = "Just now",
                                    likes = 1,
                                    repliesCount = 0
                                )
                            ) + posts
                            newTitle = ""
                            newContent = ""
                            showNewPostDialog = false
                            vm.playFeedbackTone(android.media.ToneGenerator.TONE_PROP_ACK, 80)
                        }
                    }
                ) {
                    Text("TRANSMIT LEDGER", color = theme.brandPrimary, fontSize = 10.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                }
            },
            dismissButton = {
                TextButton(onClick = { showNewPostDialog = false }) {
                    Text("ABORT", color = Color.Gray, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                }
            },
            containerColor = Color(0xFF0F1225)
        )
    }
}

// --------------------- Tab 3: Gen-Lang-Client API Documentation ---------------------
@Composable
fun GenLangApiDocSection() {
    val scrollState = rememberScrollState()
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Text(
            "🛰️ GOOGLE GENERATIVE LANGUAGE CLIENT (gen-lang-client) API SPECIFICATION",
            color = NeonCyan,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace
        )

        Text(
            "This document charts the precise schema maps, REST endpoints, and authentication patterns used inside MΛD Gambit's off-chain narrative engine.",
            color = Color.Gray,
            fontSize = 10.sp
        )

        ApiEndpointCard(
            method = "POST",
            path = "v1beta/models/gemini-3.5-flash:generateContent",
            title = "NARRATIVE & SATIRE GENERATION ENGINE",
            authType = "URL Query Parameter API Key Authentication (?key=API_KEY)",
            params = "• model (string): 'gemini-3.5-flash' (Primary serverless text interpreter)\n" +
                     "• contents (GenerateContentRequest): structured array mapping historical chat memory nodes.",
            requestJson = """
{
  "contents": [
    {
      "parts": [
        { "text": "Formulate a South Park style mock forecast on Morpho lending vault rates." }
      ],
      "role": "user"
    }
  ],
  "systemInstruction": {
    "parts": [
      { "text": "You are the MAD Gambit Host, known as 'The MADHATr'. Speak with a thick Jersey accent." }
    ]
  }
}
            """.trimIndent(),
            responseJson = """
{
  "candidates": [
    {
      "content": {
        "parts": [
          { "text": "Y'know, those Morpho vaults are tighter than a crab's backend! Fuggedaboutit!" }
        ],
        "role": "model"
      }
    }
  ]
}
            """.trimIndent()
        )

        ApiEndpointCard(
            method = "POST",
            path = "v1beta/models/gemini-1.5-pro:generateContent",
            title = "COGNITIVE DETECTIVE & SYBIL AUDITING ENGINE",
            authType = "URL Query Parameter API Key Authentication (?key=API_KEY)",
            params = "• model (string): 'gemini-1.5-pro' (Heavy deep analysis model)\n" +
                     "• contents (GenerateContentRequest): multi-turn dataset with large context window constraints.",
            requestJson = """
{
  "contents": [
    {
      "parts": [
        { "text": "Audit the following transaction logs for Sybil indicators: [100 wagers from 0x88...]" }
      ],
      "role": "user"
    }
  ]
}
            """.trimIndent(),
            responseJson = """
{
  "candidates": [
    {
      "content": {
        "parts": [
          { "text": "DETECTION SYSTEM CONFIRMATION: Heuristics verify 98.4% automation rate. Trigger circuit breaker." }
        ],
        "role": "model"
      }
    }
  ]
}
            """.trimIndent()
        )
    }
}

@Composable
fun ApiEndpointCard(
    method: String,
    path: String,
    title: String,
    authType: String,
    params: String,
    requestJson: String,
    responseJson: String
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .glassContainerBackground(baseColor = NeonCyan, shape = RoundedCornerShape(12.dp))
            .padding(14.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Box(
                    modifier = Modifier
                        .background(Color(0xFFFF073A), RoundedCornerShape(4.dp))
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                ) {
                    Text(method, color = Color.White, fontSize = 9.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                }
                Text(path, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, fontFamily = FontFamily.Monospace)
            }
            HorizontalDivider(color = Color.White.copy(alpha = 0.1f))

            Text("FUNCTION: $title", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
            Text("SECURE AUTH: $authType", color = NeonCyan, fontSize = 9.sp, fontFamily = FontFamily.Monospace)

            Column {
                Text("ENDPOINT PARAMETERS:", color = Color.Gray, fontSize = 9.sp, fontFamily = FontFamily.Monospace)
                Text(params, color = Color.LightGray, fontSize = 10.sp, lineHeight = 14.sp)
            }

            Text("EXPECTED JSON REQUEST FORMAT:", color = Color.Gray, fontSize = 9.sp, fontFamily = FontFamily.Monospace)
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF070913), RoundedCornerShape(6.dp))
                    .padding(8.dp)
            ) {
                Text(
                    text = requestJson,
                    color = NeonGreen,
                    fontFamily = FontFamily.Monospace,
                    fontSize = 9.sp,
                    lineHeight = 12.sp
                )
            }

            Text("EXPECTED JSON RESPONSE FORMAT:", color = Color.Gray, fontSize = 9.sp, fontFamily = FontFamily.Monospace)
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF070913), RoundedCornerShape(6.dp))
                    .padding(8.dp)
            ) {
                Text(
                    text = responseJson,
                    color = NeonPink,
                    fontFamily = FontFamily.Monospace,
                    fontSize = 9.sp,
                    lineHeight = 12.sp
                )
            }
        }
    }
}
