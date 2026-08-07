package com.example.engine

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.concurrent.TimeUnit
import com.example.BuildConfig
import com.example.model.SentimentFeedItem
import com.example.api.RssFeedFetcher

object GeminiSentimentClient {
    private val json = Json { ignoreUnknownKeys = true }
    
    private val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()

    suspend fun generateSentimentFeedItems(): List<SentimentFeedItem> = withContext(Dispatchers.IO) {
        val apiKey = BuildConfig.GEMINI_API_KEY
        val rssArticles = RssFeedFetcher.fetchRealRssArticles()
        
        if (apiKey.isEmpty() || apiKey == "MY_GEMINI_API_KEY") {
            return@withContext generateMockSentimentFallback(rssArticles)
        }

        val rssContext = if (rssArticles.isNotEmpty()) {
            rssArticles.shuffled().take(5).joinToString("\n") { "- [${it.source}] ${it.title}" }
        } else {
            "No active RSS feeds resolved at current epoch."
        }

        val prompt = """
            You are 'The MADHAT'r', the cynical Jersey host of the MAD Gambit prediction circus. You talk with a thick Jersey accent and husky voice.
            Generate a list of 6 highly satirical, witty, and attention-grabbing real-time sentiment analysis items related to prediction events.
            These items must aggregate a mix of global headlines, entertainment news, celebrity and tabloid news, and viral media events.
            
            Use the following actual live financial/crypto news articles as inspiration if available:
            $rssContext

            Represent the output as a valid raw JSON array containing exactly 6 items, with these exact keys:
            - "title": a snappy, catchy, slightly sensational tabloid-style headline (e.g. "SBF PLAYS LEAGUE OF LEGENDS FROM CELL BLOCK C", "INFLATION ATTACK: RETAIL CLOWNS FIGHT BACK")
            - "text": a short, satirical, sarcastic, Jersey-accented description or roast of the event (1 to 2 sentences max)
            - "category": choose exactly one of: "Tabloid News", "Entertainment", "Global Headlines", "Viral Media"
            - "sentiment": choose exactly one of: "BULLISH", "BEARISH", "CHAOTIC", "MAD"
            - "multiplier": a fun leveraging multiplier (e.g., "1.5x Conviction", "3.0x Leverage", "9.9x Giga-Degen", "0.5x Coping")
            - "timestamp": a relative time (e.g. "2m ago", "12m ago", "1h ago", "JUST NOW")

            Ensure you output ONLY the valid raw JSON array starting with '[' and ending with ']'. Do not wrap it in markdown block tags like ```json ... ```. No extra text, no apologies.
        """.trimIndent()

        val requestObj = GenerateContentRequest(
            contents = listOf(Content(parts = listOf(Part(text = prompt)))),
            systemInstruction = Content(
                parts = listOf(
                    Part(text = "You are the MADHAT'r. Output ONLY a valid JSON array of sentiment items and strictly avoid any markdown code block wrappers or other conversational packaging.")
                )
            )
        )

        try {
            val jsonStr = json.encodeToString(GenerateContentRequest.serializer(), requestObj)
            val mediaType = "application/json; charset=utf-8".toMediaType()
            val requestBody = jsonStr.toRequestBody(mediaType)
            
            val request = Request.Builder()
                .url("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=$apiKey")
                .post(requestBody)
                .build()

            okHttpClient.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    return@withContext generateMockSentimentFallback(rssArticles)
                }
                
                val bodyStr = response.body?.string() ?: return@withContext generateMockSentimentFallback(rssArticles)
                val responseObj = json.decodeFromString(GenerateContentResponse.serializer(), bodyStr)
                val responseText = responseObj.candidates?.firstOrNull()?.content?.parts?.firstOrNull()?.text?.trim()
                
                if (responseText != null) {
                    // Extract JSON array from text if Gemini accidentally wrapped it in codeblocks
                    val sanitized = responseText.replace("```json", "").replace("```", "").trim()
                    json.decodeFromString<List<SentimentFeedItem>>(sanitized)
                } else {
                    generateMockSentimentFallback(rssArticles)
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
            generateMockSentimentFallback(rssArticles)
        }
    }

    private fun generateMockSentimentFallback(rssArticles: List<com.example.api.RssFeedFetcher.RssItem> = emptyList()): List<SentimentFeedItem> {
        return listOf(
            SentimentFeedItem(
                title = "CELEB TOKEN PUMP MET WITH GIGA-DEGEN CRASH",
                text = "Alright pal, some pop star launched a coin that went to fifty mill and then cratered in four minutes. Standard Tuesday in crypto land, y'know?",
                category = "Tabloid News",
                sentiment = "BEARISH",
                multiplier = "4.2x Leverage",
                timestamp = "JUST NOW"
            ),
            SentimentFeedItem(
                title = "FED CHAIR SPOTTED BUYING COSMIC HATS",
                text = "Rumors are buzzin' that Jerome is stackin' top-hats in preparation for the next rate freeze. A clear indicator of high conviction, fuggetaboutit!",
                category = "Global Headlines",
                sentiment = "BULLISH",
                multiplier = "3.2x Conviction",
                timestamp = "4m ago"
            ),
            SentimentFeedItem(
                title = "VIRAL TIKTOK DEGEN WINS ACADEMY OF CLOWNS",
                text = "This kid leveraged his parents' basement equity into some sketchy dog token. Now he's tutorializing macro-finance on viral media. Insanity!",
                category = "Viral Media",
                sentiment = "CHAOTIC",
                multiplier = "9.9x Giga-Degen",
                timestamp = "14m ago"
            ),
            SentimentFeedItem(
                title = "ELON PROPOSES QUADRATIC DOCKET FOR MARS",
                text = "He wants to establish Fibonacci voting on Mars. How about we worry about the rockets not blowin' up first, y'know what I'm sayin'?",
                category = "Entertainment",
                sentiment = "MAD",
                multiplier = "1.2x Coping",
                timestamp = "32m ago"
            ),
            SentimentFeedItem(
                title = "SEC ISSUES AUDIT TO LOCAL JERSEY DELI",
                text = "They claim the ham sandwich had irregular volatility indicators and is an unregistered security. You can't make this stuff up, pal!",
                category = "Global Headlines",
                sentiment = "BEARISH",
                multiplier = "0.2x Leverage",
                timestamp = "1h ago"
            ),
            SentimentFeedItem(
                title = "WHALE LIQUIDATION SPREE SPARKED BY AI ACCIDENT",
                text = "An autopilot trading bot got confused by a South Park tweet and market ordered fifty million credits. The absolute peak of algorithmic brilliance!",
                category = "Viral Media",
                sentiment = "CHAOTIC",
                multiplier = "6.6x Leverage",
                timestamp = "2h ago"
            )
        )
    }
}
