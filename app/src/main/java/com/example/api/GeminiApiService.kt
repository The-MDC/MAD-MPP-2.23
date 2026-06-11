package com.example.api

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

class GeminiRepository {
    suspend fun fetchSatiricalHeadlines(): List<String> = withContext(Dispatchers.IO) {
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
                text.split("\n")
                    .filter { it.isNotBlank() }
                    .map { it.replace(Regex("^[-*•\\d.]+\\s*"), "").trim() }
            } else {
                throw Exception("Empty Gemini response")
            }
        } catch (e: Exception) {
            if (rssArticles.isNotEmpty()) {
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
        }
    }
    
    suspend fun chatWithPersona(userMessage: String): String = withContext(Dispatchers.IO) {
        try {
            val apiKey = BuildConfig.GEMINI_API_KEY
            if (apiKey.isEmpty() || apiKey.contains("YOUR_API_KEY")) {
                return@withContext "Hey buddy, you're missin' the API key! Can't run the operation without it, y'know?"
            }

            val request = GenerateContentRequest(
                contents = listOf(
                    Content(
                        parts = listOf(Part(text = userMessage)),
                        role = "user"
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
            return@withContext response.candidates.firstOrNull()?.content?.parts?.firstOrNull()?.text ?: "Look, I'm drawin' a blank over here. Give me somethin' else to work with!"
        } catch (e: Exception) {
            return@withContext "Oof, we got a technical foul over here: ${e.message}"
        }
    }

    suspend fun generateCommentaryWithPersona(
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
