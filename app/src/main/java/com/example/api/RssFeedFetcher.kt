package com.example.api

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.regex.Pattern

object RssFeedFetcher {
    private val client = OkHttpClient.Builder().build()

    @Volatile
    var lastSatiricalHeadlines: List<String> = listOf(
        "BREAKING: FED prints more money, water still wet. 💵",
        "LIAR ENGINE: 89% probability this 'DeFi Summer' is just 3 guys in a basement. 🚫",
        "CONVICTION ALERT: Herd mentality surging on meme tickers. 🏔️",
        "SENTINEL ONLINE: Tracking 14 new alpha news streams. 🎃",
        "SYBIL DEFENSE: 42,000 bots blocked from taking your yield. 🧱",
        "MAD SHIELD: Circuit breaker primed and ready to lock buffers. 📚",
        "BREAKING: Politician's dynamic smile sub-optimized by real-time neural lie detectors. 🤥",
        "MADHAT'r WARNING: High concentration of woke compliance reports detected. Deploying protective top-hats! 🎩",
        "BREAKING: Limitless copies PolyMarket copycats; copycat of copycats goes local. 🖨️"
    )

    fun getNextMemeOrHeadline(): String {
        return lastSatiricalHeadlines.randomOrNull() ?: "MADHAT'r says: Keep prediction markets wild! 🎩"
    }

    val RSS_FEEDS = listOf(
        "https://www.coindesk.com/arc/outboundfeeds/rss/",
        "https://cointelegraph.com/rss",
        "https://search.cnbc.com/rs/search/combined/search.rss",
        "http://feeds.bbci.co.uk/news/rss.xml",
        "https://finance.yahoo.com/news/rssindex"
    )

    data class RssItem(val title: String, val source: String)

    /**
     * Fetches real-world RSS feeds natively over the network.
     * Extracts top headlines matching financial news, market sentiment, and cryptocurrency markets.
     */
    suspend fun fetchRealRssArticles(): List<RssItem> = withContext(Dispatchers.IO) {
        val parsedItems = mutableListOf<RssItem>()
        for (url in RSS_FEEDS) {
            try {
                val request = Request.Builder().url(url).build()
                client.newCall(request).execute().use { response ->
                    if (!response.isSuccessful) return@use
                    val body = response.body?.string() ?: return@use
                    
                    val host = java.net.URL(url).host
                    val sourceName = when {
                        host.contains("coindesk") -> "CoinDesk"
                        host.contains("cointelegraph") -> "CoinTelegraph"
                        host.contains("cnbc") -> "CNBC"
                        host.contains("bbc") -> "BBC"
                        host.contains("yahoo") -> "YahooFinance"
                        else -> "Markets"
                    }

                    // Extract matching <item> blocks and their <title>
                    val itemMatcher = Pattern.compile("<item>([\\s\\S]*?)</item>").matcher(body)
                    var count = 0
                    while (itemMatcher.find() && count < 5) {
                        val itemContent = itemMatcher.group(1) ?: ""
                        val titleMatcher = Pattern.compile("<title><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></title>").matcher(itemContent)
                        var titleText = ""
                        if (titleMatcher.find()) {
                            titleText = titleMatcher.group(1) ?: ""
                        } else {
                            val backupMatcher = Pattern.compile("<title>([\\s\\S]*?)</title>").matcher(itemContent)
                            if (backupMatcher.find()) {
                                titleText = backupMatcher.group(1) ?: ""
                            }
                        }

                        if (titleText.isNotBlank()) {
                            titleText = titleText
                                .replace("&amp;", "&")
                                .replace("&lt;", "<")
                                .replace("&gt;", ">")
                                .replace("&quot;", "\"")
                                .replace("&apos;", "'")
                                .trim()
                            parsedItems.add(RssItem(titleText, sourceName))
                            count++
                        }
                    }
                }
            } catch (e: Exception) {
                // Graceful fallback for single feed errors
                android.util.Log.e("RssFeedFetcher", "Error fetching RSS feed $url", e)
            }
        }
        return@withContext parsedItems
    }
}
