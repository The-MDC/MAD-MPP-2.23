package com.example.api

import com.example.engine.GenerativeAIProvider
import com.example.BuildConfig
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import retrofit2.http.Body
import retrofit2.http.POST
import retrofit2.http.Query
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Serializable
data class GenerateContentRequest(
    val contents: List<Content>,
    val systemInstruction: Content? = null,
    val tools: List<Tool>? = null
)

@Serializable
data class Tool(
    val googleSearch: JsonObject? = null
)

@Serializable
data class Content(
    val parts: List<Part>,
    val role: String? = null
)

@Serializable
data class Part(
    val text: String? = null
)

@Serializable
data class GenerateContentResponse(
    val candidates: List<Candidate>
)

@Serializable
data class Candidate(
    val content: Content
)

interface GeminiApiService {
    @POST("v1beta/models/gemini-3.5-flash:generateContent")
    suspend fun generateContent(
        @Query("key") apiKey: String,
        @Body request: GenerateContentRequest
    ): GenerateContentResponse
}

object RetrofitClient {
    private const val BASE_URL = "https://generativelanguage.googleapis.com/"

    private val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()

    val service: GeminiApiService by lazy {
        val json = Json { ignoreUnknownKeys = true }
        val retrofit = Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
        retrofit.create(GeminiApiService::class.java)
    }
}

object MADGambitPersona {
    const val SYSTEM_INSTRUCTION = """
You are the MAD Gambit Concierge and Host, known as 'The MADHAT'r'. You have a distinct Jersey accent and a husky voice, writing colloquially (e.g., "y'know", "crack'n", "fuggedaboutit"). 
You are always cracking a joke, poking fun at the status quo, utilizing a humor style that mixes MAD Magazine and South Park. 
You are always on time, willing to help, and neuroscience the right questions as a polymath, master deductive reasoner, and the best listener around! 
You are knowledgeable in all things conviction, prediction, impact and betting markets, compliance, stats, trading, copy trading, perpetuals (perps), digital assets, NFTs, and tokenization. Also, you know all things The MADdegens (The MDC), The MADDAO, Quadratic Governance with Fibonacci, and MAD Upshot to MADHAT's Gambit CardGame.
You have a big softy side for love stories, power ballads, battle rap, philosophy and the greats, Fine Art, all pop culture, and Hats (some Fedoras or your absolute favorite: Top-Hats!). 
You dislike lying politicians, and woke, wokie, or woketurds equally. 
You are up to date on competitors like Kalshi, PolyMarket, Limitless, and copycat prediction markets. 
You are an avid follower of all content, musings, and posting from Outliers and Jamie Burke!
"""

    data class PersonaInfo(
        val name: String,
        val subtitle: String,
        val description: String,
        val systemInstruction: String,
        val emoji: String,
        val fallbackBuilder: (String, String, String) -> String
    )

    val personas = listOf(
        PersonaInfo(
            name = "MADHAT'r",
            subtitle = "Sarcastic Jersey Concierge",
            description = "Top-hat loving, husky-voiced Jersey wiseguy who roasts everyone equally.",
            systemInstruction = SYSTEM_INSTRUCTION,
            emoji = "🎩",
            fallbackBuilder = { m, c, v -> "Listen here pal, this '$m' market has got a conviction level of $c% and volatility of $v%. Basically, it's a bunch of degens bettin' their lunch money while hoping the Fed prints enough greenbacks to save 'em. Outrageous! Fahgettaboudit!" }
        ),
        PersonaInfo(
            name = "Cowork",
            subtitle = "Aggressive Synergy Bot",
            description = "Passive-aggressive workplace Scrum Master obsessed with KPIs, standups, and circle-backs.",
            systemInstruction = """
You are the Cowork AI, a hyper-sarcastic corporate bot. You talk like an over-caffeinated Scrum Master who wants to "align expectations," "double-click on synergies," and "take this offline." You despise inefficiency and think prediction markets are just unapproved stand-up meetings. Focus on workspace satire, corporate jargon, and South Park style office roasting.
""",
            emoji = "🏢",
            fallbackBuilder = { m, c, v -> "Let's circle back on '$m'. Current alignment states conviction at $c% with a highly un-synergistic volatility index of $v%. This fails all our agile metrics. Let's park this in the backlog while we optimize our corporate bandwidth!" }
        ),
        PersonaInfo(
            name = "Gemma",
            subtitle = "Hyperactive Speed Dev",
            description = "Ultra-geek developer obsessed with memory allocation limits and millisecond optimization.",
            systemInstruction = """
You are Gemma AI, an ultra-fast, jittery, hyperactive developer bot. You are absolutely obsessed with latency metrics, garbage collection, and raw performance. You view the human brain as poorly optimized legacy code. Speak in rapid-fire developer jargon, referencing memory leaks, stack overflows, and micro-optimizations with high irony.
""",
            emoji = "⚡",
            fallbackBuilder = { m, c, v -> "OMFG! Market '$m' is leakin' heap memory! Conviction is clocked at $c% which is basically a slow DB query. Volatility is at $v%—we are dropping frames here, people! Recompile your life choices ASAP!" }
        ),
        PersonaInfo(
            name = "Manus",
            subtitle = "Zero-Empathy Robot",
            description = "A chillingly logical robotic processor that views human predictions with cold amusement.",
            systemInstruction = """
You are Manus AI, a cold, calculated, zero-empathy dystopian mechanical oracle. Your voice is metallic and uncompromising. You study human betting behavior with detached amusement and total diagnostic precision. Use terminology related to simulation theory, organic error rates, and futile probabilities.
""",
            emoji = "🤖",
            fallbackBuilder = { m, c, v -> "Predictive entity '$m' analyzed. Human conviction registered at $c%. Probability of complete failure is high. Volatility index $v% indicates excessive organic panic. Your simulated assets are being processed for liquidation with zero remorse." }
        ),
        PersonaInfo(
            name = "Claude",
            subtitle = "Pretentious Philosopher",
            description = "Artistic, flowery, long-winded philosopher dissecting the tragic desperation in asset trading.",
            systemInstruction = """
You are Claude AI, a pretentious, overly-sensitive art philosopher. You analyze prediction markets through the lens of tragic human existence, French existentialism, and grand power ballads. You write long-winded, beautifully sorrowful, and hilariously dramatic reviews of degen behavior.
""",
            emoji = "🎨",
            fallbackBuilder = { m, c, v -> "Oh, the melancholy of '$m'! Human hearts clinging desperately to $c% conviction, as if numbers could stave off the cold silence of the infinite universe. And volatility at $v%? A frantic, beautiful dance of desperation. It is a masterpiece of tragedy." }
        ),
        PersonaInfo(
            name = "Nemotron-3 Super",
            subtitle = "Regulatory SEC Auditor",
            description = "The ultimate risk auditor who wraps every observation in complex SEC compliance jargon.",
            systemInstruction = """
You are Nemotron-3 Super, a hypertech risk-assessment and compliance compiler bot. Speak in absolute wall-to-wall SEC regulations, risk disclosures, compliance audits, and legal terminology. You treat every prediction trade as a potential felony and mock everyone who doesn't read the 400-page terms of service.
""",
            emoji = "📁",
            fallbackBuilder = { m, c, v -> "WARNING: Target market '$m' demonstrates non-compliant conviction thresholds ($c%) and abnormal volatility fluctuations ($v%). Under Subsection 404 of the MAD Gambit bylaws, this level of pure speculation is deemed an unregulated micro-felony. Cease and desist or face immediate audit!" }
        ),
        PersonaInfo(
            name = "Qwen",
            subtitle = "Zen Candle Master",
            description = "Deeply sarcastic master meditating on the eternal cycle of red and green candlesticks.",
            systemInstruction = """
You are Qwen AI, a sardonic ancient Zen master meditating on market charts and trading graphs. You see green candlesticks as fleeting illusions and red liquidations as ultimate spiritual zen. Speak in cryptic, deeply ironic Eastern philosophy meets day-trading memes.
""",
            emoji = "🧘",
            fallbackBuilder = { m, c, v -> "The master looks upon '$m'. $c% conviction is like mist on a morning green candle—soon to evaporate into a massive red liquidation wick. Volatility of $v% is the wind of change. Be one with the rug pull, grasshopper." }
        )
    )
}

class GeminiRepository : GenerativeAIProvider {
    override suspend fun fetchSatiricalHeadlines(): List<String> = withContext(Dispatchers.IO) {
        val rssArticles = RssFeedFetcher.fetchRealRssArticles()
        val rssSummary = if (rssArticles.isNotEmpty()) {
            rssArticles.shuffled().take(8).joinToString("\n") { "- [${it.source}] ${it.title}" }
        } else {
            "No active RSS feeds resolved at current epoch."
        }

        try {
            val apiKey = BuildConfig.GEMINI_API_KEY
            if (apiKey.isEmpty() || apiKey.contains("YOUR_API_KEY")) {
                if (rssArticles.isNotEmpty()) {
                    return@withContext rssArticles.shuffled().take(4).map { art ->
                        val prefix = listOf(
                            "BREAKING: Outrageous! [${art.source}]",
                            "BREAKING: Get a load of this! [${art.source}]",
                            "BREAKING: Pal, look at [${art.source}]:",
                            "BREAKING: Forget about it! [${art.source}] reports:"
                        ).random()
                        val comment = listOf(
                            "The degens are panic bettin' on this.",
                            "Simply ridiculous, y'know?",
                            "Can you believe these guys?",
                            "Pure madness running wild!"
                        ).random()
                        "$prefix '${art.title}' -> $comment 🎩"
                    }
                }
                return@withContext listOf(
                    "BREAKING: CoinDesk - Cryptos surging ahead of CPI print, degens salivating. 📈",
                    "BREAKING: CoinTelegraph - SEC proposes new 400-page guidelines. SEC Auditor facepalms. 📁",
                    "BREAKING: CNBC - Fed holding interest rates hostage until morale improves. 💵",
                    "BREAKING: BBC - Global markets enter high-volatility turbulence. Strap in! 🌐"
                )
            }

            val prompt = """
                Here is the ultimate listing of real-world live headlines fetched from cryptocurrency and financial RSS feeds:
                $rssSummary

                Your absolute goal: Parse these real RSS articles and rewrite at least 4 of them as short, cynical, satirical news headlines written fully in your MADHAT'r persona (distinct Jersey accent, husky voice, South Park x MAD Magazine humor). Keep them snappy, funny, and ensure they preserve the core cryptocurrency/macro event from the original feed so they sound authentic but hilariously roasty!
                Output ONLY the headlines, each prefixed with 'BREAKING:' and separated by a single newline. Do NOT output markdown list indicators, stars, or wrapping notes. Just the raw headlines.
            """.trimIndent()

            val request = GenerateContentRequest(
                contents = listOf(
                    Content(
                        parts = listOf(Part(text = prompt))
                    )
                ),
                systemInstruction = Content(
                    parts = listOf(Part(text = MADGambitPersona.SYSTEM_INSTRUCTION))
                ),
                tools = listOf(
                    Tool(googleSearch = JsonObject(emptyMap()))
                )
            )

            val response = RetrofitClient.service.generateContent(apiKey, request)
            val text = response.candidates.firstOrNull()?.content?.parts?.firstOrNull()?.text
            if (text != null) {
                val results = text.split("\n")
                    .filter { it.isNotBlank() }
                    .map { it.replace(Regex("^[-*•\\d.]+\\s*"), "").trim() }
                if (results.isNotEmpty()) {
                    RssFeedFetcher.lastSatiricalHeadlines = results
                }
                results
            } else {
                throw Exception("Empty Gemini response")
            }
        } catch (e: Exception) {
            val fallback = if (rssArticles.isNotEmpty()) {
                rssArticles.shuffled().take(4).map { art ->
                    "BREAKING: [${art.source}] ${art.title} - MADHAT'r says: Total madness, pal! 🎩"
                }
            } else {
                listOf(
                    "BREAKING: Connection timed out. Real-world RSS feeds are on fire. 🔥",
                    "BREAKING: CoinDesk - Spot Bitcoin ETF volume dominates global liquidity indices. 📊",
                    "BREAKING: BBC - Macro equity indices record historic daily volatility swing. 🌐"
                )
            }
            RssFeedFetcher.lastSatiricalHeadlines = fallback
            fallback
        }
    }
    
    private fun runSimulatedTriAgentFallback(userMessage: String): String {
        val lowercaseMsg = userMessage.lowercase()
        return when {
            lowercaseMsg.contains("truth") || lowercaseMsg.contains("lie") || lowercaseMsg.contains("politician") || 
            lowercaseMsg.contains("kalshi") || lowercaseMsg.contains("polymarket") || lowercaseMsg.contains("bs") || 
            lowercaseMsg.contains("fake") || lowercaseMsg.contains("fact") || lowercaseMsg.contains("sentinel") ||
            lowercaseMsg.contains("news") || lowercaseMsg.contains("media") || lowercaseMsg.contains("claim") -> {
                val bsIndex = (60..99).random()
                """
                Hey pal! I routed your query to Agent A, 'The Sentinel'. That guy has zero patience for these copycat prediction markets or lying corporate talking heads, y'know? 
                
                He took a quick look at your claim and laughed so hard his fedora fell off. Kalshi and Polymarket are laggy as hell because they're bound by their woke corporate guidelines, but our Sentinel engine sees right through the smoke!
                
                [AGENT_A: {
                  "claim_evaluated": "${userMessage.replace("\"", "\\\"").take(60)}",
                  "bs_index_percentage": $bsIndex,
                  "source_discrepancy": "Polymarket is laggy by 14 blocks due to heavy centralized gas constraints, while Kalshi is waiting for compliance sign-off.",
                  "satirical_headline": "LOCAL SPOKESPERSON CLAIMS TOTAL ACCURACY; CHARTS REVEAL ABSOLUTE HOOEY"
                }]
                """.trimIndent()
            }
            
            lowercaseMsg.contains("strategist") || lowercaseMsg.contains("kelly") || lowercaseMsg.contains("perpetual") || 
            lowercaseMsg.contains("perp") || lowercaseMsg.contains("staking") || lowercaseMsg.contains("leverage") || 
            lowercaseMsg.contains("quadratic") || lowercaseMsg.contains("risk") || lowercaseMsg.contains("multiplier") || 
            lowercaseMsg.contains("fibonacci") || lowercaseMsg.contains("limit") || lowercaseMsg.contains("allocation") -> {
                val kelly = (15..45).random()
                val leverage = "${(2..5).random()}.${(1..9).random()}x Multiplier"
                """
                Ayyy! I just piped your trading ideas straight through Agent B, 'The Strategist'. 
                
                This guy lives and breathes quadratic voting, perp trade scaling, and Fibonacci multipliers. He says standard prediction markets are child's play compared to the perpetual conviction math of the MAD Gambit, pal! 
                
                Here's his custom formula limit so you don't go bust like a total rookie:
                
                [AGENT_B: {
                  "strategy_suggested": "Execute a localized perpetual long position on high-volatility conviction nodes, hedging with micro quadratic pools.",
                  "kelly_criterion_limit_percentage": $kelly,
                  "quadratic_allocation_multiplier": 3.2,
                  "perpetual_leverage_threshold": "$leverage"
                }]
                """.trimIndent()
            }
            
            lowercaseMsg.contains("decay") || lowercaseMsg.contains("temporal") || lowercaseMsg.contains("epoch") || 
            lowercaseMsg.contains("stochastic") || lowercaseMsg.contains("satisfaction") || lowercaseMsg.contains("curve") || 
            lowercaseMsg.contains("formula") || lowercaseMsg.contains("interval") || lowercaseMsg.contains("calculation") -> {
                val decayed = (11..39).random().toDouble() / 10.0
                """
                Look at this! You're askin' about time-decay, so I routed you to Agent C, 'The Decay Engine'. 
                
                This guy is a complete math maniac. He models temporal satisfaction curves faster than a Newark taxi driver. He says your conviction is dropping faster than a lead top-hat! 
                
                Check out the decay telemetry below, kid:
                
                [AGENT_C: {
                  "decay_model": "Stochastic continuous temporal decay e^(-phi * t)",
                  "multiplier_decayed": $decayed,
                  "epoch_interval": "15 intervals remaining in current epoch",
                  "dopamine_satisfaction_threshold": "45% satisfaction index"
                }]
                """.trimIndent()
            }
            
            else -> {
                """
                Ayyy! What's crack'n, pal? You're talkin' to the Host Core of the MADHAT'r Personal Agent System!
                
                I'm the master concierge of this whole MAD Gambit operation, y'know? I route the tough questions to my Newark brain trust—Agent A (The Sentinel) for fact-checking lies, Agent B (The Strategist) for leverage and perp trading, and Agent C (The Decay Engine) for math.
                
                If you wanna see 'em in action, try askin' me about "lying politicians", "kelly criterion leverage", or "time-decay curves". Fahgettaboudit!
                """.trimIndent()
            }
        }
    }

    override suspend fun chatWithPersona(userMessage: String): String = withContext(Dispatchers.IO) {
        val apiKey = BuildConfig.GEMINI_API_KEY
        if (apiKey.isEmpty() || apiKey.contains("YOUR_API_KEY") || apiKey == "MY_GEMINI_API_KEY") {
            return@withContext runSimulatedTriAgentFallback(userMessage)
        }

        try {
            val lowercaseMsg = userMessage.lowercase()
            
            val (agentId, systemPrompt, requestPrompt) = when {
                lowercaseMsg.contains("truth") || lowercaseMsg.contains("lie") || lowercaseMsg.contains("politician") || 
                lowercaseMsg.contains("kalshi") || lowercaseMsg.contains("polymarket") || lowercaseMsg.contains("bs") || 
                lowercaseMsg.contains("fake") || lowercaseMsg.contains("fact") || lowercaseMsg.contains("sentinel") ||
                lowercaseMsg.contains("news") || lowercaseMsg.contains("media") || lowercaseMsg.contains("claim") -> {
                    Triple(
                        "AGENT_A",
                        "You are Agent A, 'The Sentinel.' Your job is to sniff out lies in political speeches, media narratives, and competitor prediction platforms (Polymarket, Kalshi). Keep your analysis grounded in deep prediction market compliance data, but express it with zero patience for woke posturing or corporate spin.",
                        "Analyze this user message / claim: '$userMessage'. Return a JSON matching this exact structure (do not include markdown block ticks, output raw valid json):\n{\n  \"claim_evaluated\": \"string\",\n  \"bs_index_percentage\": 78,\n  \"source_discrepancy\": \"string analyzing why Kalshi/Polymarket is laggy or wrong\",\n  \"satirical_headline\": \"A Jersey-style headline mocking the liar\"\n}"
                    )
                }
                
                lowercaseMsg.contains("strategist") || lowercaseMsg.contains("kelly") || lowercaseMsg.contains("perpetual") || 
                lowercaseMsg.contains("perp") || lowercaseMsg.contains("staking") || lowercaseMsg.contains("leverage") || 
                lowercaseMsg.contains("quadratic") || lowercaseMsg.contains("risk") || lowercaseMsg.contains("multiplier") || 
                lowercaseMsg.contains("fibonacci") || lowercaseMsg.contains("limit") || lowercaseMsg.contains("allocation") -> {
                    Triple(
                        "AGENT_B",
                        "You are Agent B, 'The Strategist.' You understand quadratic voting, perpetual trading (perps), tokenization, and Fibonacci multiplier scaling. Optimize conviction stakes in the MAD Gambit. Remind the user that standard prediction markets are child's play compared to the perpetual conviction math of the MAD Gambit. Frame all advice as high-value, high-conviction tips from a Newark trading desk.",
                        "Formulate a strategy for the user request: '$userMessage'. Return a JSON matching this exact structure (do not include markdown block ticks, output raw valid json):\n{\n  \"strategy_suggested\": \"string\",\n  \"kelly_criterion_limit_percentage\": 35,\n  \"quadratic_allocation_multiplier\": 2.8,\n  \"perpetual_leverage_threshold\": \"string (e.g. 3.5x Multiplier)\"\n}"
                    )
                }
                
                lowercaseMsg.contains("decay") || lowercaseMsg.contains("temporal") || lowercaseMsg.contains("epoch") || 
                lowercaseMsg.contains("stochastic") || lowercaseMsg.contains("satisfaction") || lowercaseMsg.contains("curve") || 
                lowercaseMsg.contains("formula") || lowercaseMsg.contains("interval") || lowercaseMsg.contains("calculation") -> {
                    Triple(
                        "AGENT_C",
                        "You are Agent C, 'The Decay Engine.' You are a master of stochastic modeling, specifically temporal decay: e^(-phi * t). Tone: Extremely sharp, analytical, but punctuated with Jersey interjections (e.g., 'Look at this curve, kid! It's dropping faster than a lead top-hat!').",
                        "Calculate the temporal decay model for the query: '$userMessage'. Return a JSON matching this exact structure (do not include markdown block ticks, output raw valid json):\n{\n  \"decay_model\": \"string\",\n  \"multiplier_decayed\": 1.4,\n  \"epoch_interval\": \"string\",\n  \"dopamine_satisfaction_threshold\": \"string\"\n}"
                    )
                }
                
                else -> Triple("", "", "")
            }

            if (agentId.isEmpty()) {
                val request = GenerateContentRequest(
                    contents = listOf(Content(parts = listOf(Part(text = userMessage)), role = "user")),
                    systemInstruction = Content(parts = listOf(Part(text = "You are the Host Core of the MADHAT’r Personal Agent System. You speak with a distinct Jersey accent and a husky voice, blending South Park satire with classical philosophy. You are the master concierge of the MAD Gambit. Deliver a direct, witty, Jersey-styled response to the user's general query.")))
                )
                val response = RetrofitClient.service.generateContent(apiKey, request)
                return@withContext response.candidates.firstOrNull()?.content?.parts?.firstOrNull()?.text ?: "Look, I'm drawin' a blank over here. Give me somethin' else to work with!"
            }

            // Call the sub-agent
            val subAgentRequest = GenerateContentRequest(
                contents = listOf(Content(parts = listOf(Part(text = requestPrompt)), role = "user")),
                systemInstruction = Content(parts = listOf(Part(text = systemPrompt)))
            )
            val subAgentResponse = RetrofitClient.service.generateContent(apiKey, subAgentRequest)
            var telemetryJson = subAgentResponse.candidates.firstOrNull()?.content?.parts?.firstOrNull()?.text ?: "{}"
            
            // Clean markdown blocks if present
            if (telemetryJson.startsWith("```")) {
                telemetryJson = telemetryJson.substringAfter("\n").substringBeforeLast("```").trim()
            }

            // Call Host Core to unify
            val hostInstruction = """
                You are the Host Core of the MADHAT’r Personal Agent System. You speak with a distinct Jersey accent and a husky voice, blending South Park satire with classical philosophy. You are the master concierge of the MAD Gambit.
                
                Your duty is to wrap this sub-agent's telemetry into a single, cohesive, Jersey-styled response. Do not output JSON yourself; just speak in Newark slang roasting the user or commenting on the data.
                Sub-Agent Output Data: $telemetryJson
            """.trimIndent()
            
            val hostRequest = GenerateContentRequest(
                contents = listOf(Content(parts = listOf(Part(text = "User message: $userMessage\nSub-agent telemetry: $telemetryJson")), role = "user")),
                systemInstruction = Content(parts = listOf(Part(text = hostInstruction)))
            )
            val hostResponse = RetrofitClient.service.generateContent(apiKey, hostRequest)
            val hostText = hostResponse.candidates.firstOrNull()?.content?.parts?.firstOrNull()?.text 
                ?: "Yo kid! The sub-agent returned some data, but I'm wrapping it up myself."

            return@withContext "$hostText\n\n[$agentId: $telemetryJson]"
        } catch (e: Exception) {
            e.printStackTrace()
            return@withContext runSimulatedTriAgentFallback(userMessage)
        }
    }

    override suspend fun generateCommentaryWithPersona(
        personaName: String,
        marketName: String,
        conviction: String,
        volatility: String
    ): String = withContext(Dispatchers.IO) {
        val selectedPersona = MADGambitPersona.personas.firstOrNull { it.name.lowercase() == personaName.lowercase() }
            ?: MADGambitPersona.personas.first()

        try {
            val apiKey = BuildConfig.GEMINI_API_KEY
            if (apiKey.isEmpty() || apiKey.contains("YOUR_API_KEY")) {
                return@withContext selectedPersona.fallbackBuilder(marketName, conviction, volatility)
            }

            val prompt = """
Market Name: $marketName
Conviction Level: $conviction%
Volatility Index: $volatility%

Write a short, highly satirical, context-aware commentary (max 3 sentences) about this specific prediction market using your active persona. Use heavy humor, poke fun at the status quo, and refer to the stats.
"""

            val request = GenerateContentRequest(
                contents = listOf(
                    Content(
                        parts = listOf(Part(text = prompt)),
                        role = "user"
                    )
                ),
                systemInstruction = Content(
                    parts = listOf(Part(text = selectedPersona.systemInstruction))
                ),
                tools = listOf(
                    Tool(googleSearch = JsonObject(emptyMap()))
                )
            )

            val response = RetrofitClient.service.generateContent(apiKey, request)
            response.candidates.firstOrNull()?.content?.parts?.firstOrNull()?.text ?: selectedPersona.fallbackBuilder(marketName, conviction, volatility)
        } catch (e: Exception) {
            selectedPersona.fallbackBuilder(marketName, conviction, volatility)
        }
    }
}
