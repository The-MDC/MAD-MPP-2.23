package com.example.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.FlashOn
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.*
import com.example.viewmodel.GambitViewModel
import kotlinx.coroutines.delay
import kotlin.random.Random

// Suggested live model mock
data class CinematicSuggestedMarket(
    val id: String,
    val title: String,
    val category: String,
    val metricTag: String,
    val voteText: String,
    val sentimentBullish: Boolean,
    val ratio: Float,
    val trendPoints: List<Float>
)

@Composable
fun PredictionCommandCentre(vm: GambitViewModel) {
    val theme = LocalGambitTheme.current
    val state by vm.state.collectAsState()
    val scope = rememberCoroutineScope()
    
    // Interaction states to simulate hover effects visually
    var selectedTab by remember { mutableStateOf("Convictions") }
    
    val suggestions = remember {
        listOf(
            CinematicSuggestedMarket(
                "sug1",
                "Gary Gensler's top-hat gets sub-pegged by quadratic Fibonacci staking rules",
                "Liar Meter",
                "98.4% LIE PROBABILITY",
                "Sentiments: 94% Cynical - 6% Compliant",
                false,
                0.98f,
                listOf(10f, 25f, 40f, 55f, 75f, 98.4f)
            ),
            CinematicSuggestedMarket(
                "sug2",
                "Protesting inflation by organizing private yacht regattas for carbon compliance",
                "Predictions",
                "88.5% WIN PROBABILITY",
                "Sentiment: 72% Bullish - 28% Bearish",
                true,
                0.72f,
                listOf(45f, 48f, 52f, 61f, 68f, 72f)
            ),
            CinematicSuggestedMarket(
                "sug3",
                "SBF Vegan Prisons Co-Op cookbook to sell out on primary Kalshi prediction pools",
                "Convictions",
                "4.5x MULTIPLIER",
                "Sentiment: 55% Bullish - 45% Bearish",
                true,
                0.55f,
                listOf(80f, 65f, 50f, 40f, 43f, 55f)
            ),
            CinematicSuggestedMarket(
                "sug4",
                "Woke ESG scoring audit utilizing 100% pure untampered AI chatbot hallucinations",
                "Liar Meter",
                "99.9% HALLUCINATION VELOCITY",
                "Sentiment: 98% Satirical - 2% Sane",
                false,
                0.98f,
                listOf(30f, 50f, 65f, 85f, 95f, 99.9f)
            ),
            CinematicSuggestedMarket(
                "sug5",
                "Jamie Burke's secret top-hat declared legal tender in Outliers virtual metaverse",
                "Predictions",
                "82.4% CONVICTION SPEED",
                "Sentiment: 81% Hyper-Bullish",
                true,
                0.81f,
                listOf(12f, 25f, 38f, 55f, 72f, 81f)
            ),
            CinematicSuggestedMarket(
                "sug6",
                "Politician caught deploying sympathy bots to auto-generate sorrow letters",
                "Convictions",
                "96.5% SATIRICAL INDEX",
                "Sentiment: 96% Roast Velocity",
                false,
                0.96f,
                listOf(15f, 35f, 55f, 75f, 90f, 96.5f)
            ),
            CinematicSuggestedMarket(
                "sug7",
                "Secondary sub-betting on limit of copycat prediction markets survival days",
                "Predictions",
                "15.8% DEFICIT STREAK",
                "Sentiment: 15% Hopeful - 85% Liquidated",
                false,
                0.15f,
                listOf(90f, 75f, 60f, 45f, 30f, 15f)
            )
        )
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 12.dp)
            .shadow(16.dp, RoundedCornerShape(20.dp), spotColor = NeonCyan.copy(alpha = 0.12f))
            .glassContainerBackground(theme.brandSecondary, RoundedCornerShape(20.dp))
            .border(1.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(20.dp))
            .padding(14.dp)
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(24.dp)
                            .background(NeonMagenta.copy(alpha = 0.15f), CircleShape)
                            .border(1.dp, NeonMagenta, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("🎩", fontSize = 11.sp, style = TextStyle(shadow = Shadow(NeonMagenta, blurRadius = 4f)))
                    }
                    Spacer(Modifier.width(8.dp))
                    Text(
                        text = "MAD COMMAND CENTRE",
                        color = Color.White,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = FontFamily.Monospace,
                        style = TextStyle(shadow = Shadow(NeonCyan, blurRadius = 4f))
                    )
                }

                Box(
                    modifier = Modifier
                        .background(NeonGreen.copy(alpha = 0.15f), RoundedCornerShape(4.dp))
                        .border(0.5.dp, NeonGreen, RoundedCornerShape(4.dp))
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = "ONLINE",
                        color = NeonGreen,
                        fontSize = 8.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }

            Text(
                text = "Yo! Track convictions, hedge predictions, and inspect standard political afflictions below, tough guy!",
                color = Color.LightGray.copy(alpha = 0.7f),
                fontSize = 10.sp,
                modifier = Modifier.padding(top = 4.dp, bottom = 12.dp)
            )

            // Prominent Command Buttons Row with glass hover/selection effects and 3 key stats below each
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Button 1: Convictions
                CommandCentreButtonWithStats(
                    title = "CONVICTIONS",
                    isSelected = selectedTab == "Convictions",
                    accentColor = NeonCyan,
                    stats1 = "45 ACTIVE",
                    stats2 = "84.2% WR",
                    stats3 = "HOT 🔥",
                    onClick = { 
                        selectedTab = "Convictions"
                        vm.playFeedbackTone(android.media.ToneGenerator.TONE_PROP_ACK, 60)
                    },
                    modifier = Modifier.weight(1f)
                )

                // Button 2: Predictions
                CommandCentreButtonWithStats(
                    title = "PREDICTIONS",
                    isSelected = selectedTab == "Predictions",
                    accentColor = NeonMagenta,
                    stats1 = "124 TOTAL",
                    stats2 = "61.5% WR",
                    stats3 = "ON 🟢",
                    onClick = { 
                        selectedTab = "Predictions"
                        vm.playFeedbackTone(android.media.ToneGenerator.TONE_PROP_ACK, 60)
                    },
                    modifier = Modifier.weight(1f)
                )

                // Button 3: Afflictions
                CommandCentreButtonWithStats(
                    title = "AFFLICTIONS",
                    isSelected = selectedTab == "Afflictions",
                    accentColor = BrandGold,
                    stats1 = "49 TRACK",
                    stats2 = "18.9% WR",
                    stats3 = "IDLE 💤",
                    onClick = { 
                        selectedTab = "Afflictions"
                        vm.playFeedbackTone(android.media.ToneGenerator.TONE_PROP_ACK, 60)
                    },
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(Modifier.height(10.dp))

            // Thin bar button below equal in length: Creates Market in gorgeous Royal Purple style
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(34.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(
                        Brush.horizontalGradient(
                            listOf(
                                Color(0xFF7B1FA2), // Purple Medium-Dark
                                Color(0xFFAB47BC)  // Glowing Purple
                            )
                        )
                    )
                    .border(1.dp, Color.White.copy(alpha = 0.25f), RoundedCornerShape(8.dp))
                    .clickable {
                        vm.playFeedbackTone(android.media.ToneGenerator.TONE_PROP_BEEP, 100)
                        vm.setShowProposeModal(true)
                    },
                contentAlignment = Alignment.Center
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Text(
                        text = "⚡ CREATE MARKET",
                        color = Color.White,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = FontFamily.Monospace,
                        letterSpacing = 1.sp,
                        style = TextStyle(shadow = Shadow(Color.Black.copy(alpha = 0.5f), blurRadius = 2f))
                    )
                }
            }

            Spacer(Modifier.height(14.dp))

            // Live streaming ticker banner
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 2.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "🎬 CINEMATIC SUGGESTIONS (SCROLLING @ 1.65X SPEED)",
                    color = Color.LightGray.copy(alpha = 0.8f),
                    fontSize = 8.5.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
                Text(
                    text = "CASTING SENTIMENTS",
                    color = NeonCyan,
                    fontSize = 8.5.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    style = TextStyle(shadow = Shadow(NeonCyan, blurRadius = 3f))
                )
            }

            Spacer(Modifier.height(6.dp))

            // Automated scrolling credits stream
            AutomatedLoopingCreditsList(
                suggestions = suggestions,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(210.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color.Black.copy(alpha = 0.35f))
                    .border(0.5.dp, Color.White.copy(alpha = 0.06f), RoundedCornerShape(12.dp))
            )
        }
    }
}

@Composable
fun CommandCentreButtonWithStats(
    title: String,
    isSelected: Boolean,
    accentColor: Color,
    stats1: String,
    stats2: String,
    stats3: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val theme = LocalGambitTheme.current
    val scale = if (isSelected) 1.02f else 1f
    
    val bgFill = if (isSelected) {
        accentColor.copy(alpha = 0.15f)
    } else {
        Color.White.copy(alpha = 0.03f)
    }
    
    val lineAccent = if (isSelected) {
        accentColor
    } else {
        Color.White.copy(alpha = 0.10f)
    }

    Column(
        modifier = modifier
            .clip(RoundedCornerShape(10.dp))
            .background(bgFill)
            .border(
                width = if (isSelected) 1.5.dp else 0.5.dp,
                brush = Brush.linearGradient(listOf(lineAccent, lineAccent.copy(alpha = 0.2f))),
                shape = RoundedCornerShape(10.dp)
            )
            .clickable { onClick() }
            .padding(horizontal = 6.dp, vertical = 10.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = title,
            color = if (isSelected) accentColor else Color.LightGray.copy(alpha = 0.8f),
            fontSize = 9.5.sp,
            fontWeight = FontWeight.Black,
            fontFamily = FontFamily.Monospace,
            textAlign = TextAlign.Center,
            style = TextStyle(shadow = if (isSelected) Shadow(accentColor, blurRadius = 4f) else null)
        )
        
        Spacer(Modifier.height(8.dp))
        
        // Stats below button
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(2.dp)
        ) {
            Text(
                text = stats1,
                color = Color.White.copy(alpha = 0.9f),
                fontSize = 9.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace
            )
            Text(
                text = stats2,
                color = NeonGreen.copy(alpha = 0.9f),
                fontSize = 9.sp,
                fontWeight = FontWeight.SemiBold,
                fontFamily = FontFamily.Monospace
            )
            Text(
                text = stats3,
                color = if (stats3.contains("🔥")) BrandGold else NeonCyan,
                fontSize = 8.sp,
                fontWeight = FontWeight.Black,
                fontFamily = FontFamily.Monospace
            )
        }
    }
}

@Composable
fun AutomatedLoopingCreditsList(
    suggestions: List<CinematicSuggestedMarket>,
    modifier: Modifier = Modifier
) {
    val listState = rememberLazyListState()
    
    // We set up a continuously ticking coroutine loop simulating a movie-credit scroll upwards
    // To simulate looping we can pre-multiply the items by a safe number or scroll wrap-around.
    // X1.65 speed translates to shorter Delay times and bigger scroll steps!
    LaunchedEffect(Unit) {
        var currentOffset = 0f
        while (true) {
            // Speed of 1.65 translates to scrolling down by 3 pixels every 25ms
            listState.dispatchRawDelta(1.65f * 1.8f)
            delay(25)
            // If we scroll near the end, reset to the top smoothly to simulate continuous live stream!
            if (listState.firstVisibleItemIndex >= suggestions.size * 2) {
                listState.scrollToItem(0, 0)
            }
        }
    }
    
    // Looping items setup
    val infiniteList = remember { List(10) { suggestions }.flatten() }

    LazyColumn(
        state = listState,
        modifier = modifier.padding(vertical = 4.dp),
        userScrollEnabled = true, // Still allow tough guys to scroll themselves
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        itemsIndexed(infiniteList) { index, mkt ->
            SuggestedCreditItem(market = mkt)
        }
    }
}

@Composable
fun SuggestedCreditItem(market: CinematicSuggestedMarket) {
    val isBullish = market.sentimentBullish
    val colorAccent = if (isBullish) NeonGreen else NeonCyan
    
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(72.dp)
            .padding(horizontal = 8.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(Color.White.copy(alpha = 0.03f))
            .border(0.5.dp, Color.White.copy(alpha = 0.05f), RoundedCornerShape(8.dp))
    ) {
        // Translucent inline "Recharts" style line chart drawn procedurally in the background!
        Canvas(
            modifier = Modifier
                .fillMaxSize()
                .padding(top = 18.dp, bottom = 4.dp, start = 80.dp, end = 12.dp)
        ) {
            val pts = market.trendPoints
            val width = size.width
            val height = size.height
            
            if (pts.isNotEmpty()) {
                val path = Path()
                val bgPath = Path()
                
                val maxPt = pts.maxOrNull() ?: 100f
                val minPt = pts.minOrNull() ?: 0f
                val range = (maxPt - minPt).coerceAtLeast(10f)
                
                pts.forEachIndexed { idx, value ->
                    val x = width * (idx / (pts.size - 1).toFloat())
                    val y = height - (height * ((value - minPt) / range))
                    
                    if (idx == 0) {
                        path.moveTo(x, y)
                        bgPath.moveTo(x, height)
                        bgPath.lineTo(x, y)
                    } else {
                        path.lineTo(x, y)
                        bgPath.lineTo(x, y)
                    }
                }
                bgPath.lineTo(width, height)
                bgPath.close()

                // Translucent fill
                drawPath(
                    path = bgPath,
                    brush = Brush.verticalGradient(
                        colors = listOf(colorAccent.copy(alpha = 0.08f), Color.Transparent)
                    )
                )
                
                // Fine-glowing prediction path
                drawPath(
                    path = path,
                    color = colorAccent.copy(alpha = 0.35f),
                    style = Stroke(
                        width = 2.5f,
                        cap = StrokeCap.Round,
                        join = StrokeJoin.Round
                    )
                )
                
                // End spot highlight
                val lastX = width
                val lastY = height - (height * ((pts.last() - minPt) / range))
                drawCircle(
                    color = colorAccent.copy(alpha = 0.5f),
                    radius = 3.5f,
                    center = Offset(lastX, lastY)
                )
            }
        }

        // Left Category Tag
        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(
                modifier = Modifier
                    .width(76.dp)
                    .fillMaxHeight(),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier
                        .background(colorAccent.copy(alpha = 0.12f), RoundedCornerShape(4.dp))
                        .border(0.5.dp, colorAccent.copy(alpha = 0.4f), RoundedCornerShape(4.dp))
                        .padding(horizontal = 4.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = market.category.uppercase(),
                        color = colorAccent,
                        fontSize = 7.5.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        textAlign = TextAlign.Center
                    )
                }
            }

            Spacer(Modifier.width(8.dp))

            // Content
            Column(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxHeight(),
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    text = market.title,
                    color = Color.White.copy(alpha = 0.85f),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    maxLines = 2,
                    lineHeight = 11.5.sp
                )
                
                Spacer(Modifier.height(2.dp))
                
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(
                        text = market.metricTag,
                        color = if (market.sentimentBullish) NeonGreen else Color(0xFFFF9800),
                        fontSize = 8.sp,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.ExtraBold
                    )
                    
                    Text(
                        text = "•",
                        color = Color.White.copy(alpha = 0.3f),
                        fontSize = 8.sp
                    )

                    Text(
                        text = market.voteText,
                        color = Color.LightGray.copy(alpha = 0.6f),
                        fontSize = 8.sp,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }
        }
    }
}
