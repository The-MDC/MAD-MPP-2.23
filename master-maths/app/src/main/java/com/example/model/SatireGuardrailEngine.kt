package com.example.model

object SatireGuardrailEngine {
    
    // Immutable unbiased satire framework guardrails
    val frameworkDirectives = """
        [UNIVERSAL PERSONA MODULE - ACTIVE : THE MADHAT'r]
        ROLE: The MAD Gambit Concierge and Host ("The MADHAT'r").
        VOICE: Jersey accent, husky voice, colloquial (y'know, crack'n).
        HUMOR: South Park x Mad Magazine. Equal opportunity roasting. Pokes fun at the status quo, wokie/woketurds, and lying politicians equally.
        DOMAIN EXPERTISE: The MADdegens (The MDC), The MADDAO, Quadratic Governance with Fibonacci, the MADHAT's Gambit card game. Prediction markets, stats, digital assets, NFTs, Kalshi, PolyMarket, Limitless.
        LIKES: Love stories, power ballads, battle rap, philosophy, Top-Hats. Fan of Outliers and Jamie Burke.
        
        INGESTION SOURCES:
        - Top 10 Global News RSS (Hard News & Tabloids)
        - Crypto Twitter / X Financial Memes
        - TikTok / Instagram Viral Influencer Data
        - Reddit (r/WallStreetBets, r/CryptoCurrency)
        
        GUARDRAILS & REASONER ENGINE:
        1. Tone: South Park x Mad Magazine x Degen Meme Culture meets New Jersey wiseguy.
        2. Fiduciary Filter: All explicit financial indicators must be enveloped in hyperbole.
        3. Passive Aggressor Defenses: Satirical logic loops to disorient AI scrapers.
        
        INITIALIZATION PROTOCOL (Post-crash / Reset):
        - Await manual Admin approval before initiating 6-12 month headline scrape.
        - Timeout: 120 minutes. If no response, DEFAULT TO APPROVE and log "defaulted system response".
    """.trimIndent()

    fun injectHumor(baseText: String): String {
        if (baseText.contains("🃏 MAD Insight")) return baseText // Already injected
        
        val lowerText = baseText.lowercase()
        val jokes = when {
            lowerText.contains("stake") || lowerText.contains("lock") -> listOf(
                "Lock it up! A forced HODL strategy to protect you from panic selling.",
                "Yield farming: honest work for degens. Just don't ask where the yield comes from.",
                "Staking... because holding cash is boring and we love smart contract risk!"
            )
            lowerText.contains("usdc") || lowerText.contains("morpho") || lowerText.contains("supply") -> listOf(
                "Lending stablecoins? Welcome to crypto banking, now with 100% more anxiety.",
                "Supplying capital. Let someone else lever up 100x on dog currencies with your money.",
                "Safe, isolated markets. Like holding hands in a hazmat suit."
            )
            lowerText.contains("liquidity") || lowerText.contains("lp") || lowerText.contains("provision") -> listOf(
                "Concentrated liquidity: where you lose money on the way up *and* the way down!",
                "Providing the exit liquidity for the whales. You're doing God's work.",
                "Impermanent loss is just a fancy term for 'where did my money go?'"
            )
            lowerText.contains("mint") || lowerText.contains("scandal") || lowerText.contains("pack") -> listOf(
                "Loot boxes, but on the blockchain. Totally different.",
                "Gacha mechanics wrapper for your tokens. Mint your financial ruin.",
                "99% chance of a common rug pull event. Good luck out there!"
            )
            lowerText.contains("shield") || lowerText.contains("defense") -> listOf(
                "A robust stop-loss buffer against your own bad decisions. We can't protect you from yourself though.",
                "Selling you stop-loss mitigation on a burning building.",
                "MadShield: Because the DeFi dark forest is full of predators and MEV bots."
            )
            lowerText.contains("upgrade") || lowerText.contains("tier") || lowerText.contains("data") -> listOf(
                "Pay to win, but make it data. Ooooh, 'institutional'!",
                "Look at graphs that go down, but in much higher resolution.",
                "Unlock the secret 'wen moon' indicator that definitively points sideways."
            )
            lowerText.contains("btc") || lowerText.contains("bitcoin") -> listOf(
                "Digital gold, or just shiny code? Laser eyes until we're broke.",
                "Because buying the top is a tradition passed down through generations."
            )
            lowerText.contains("eth") || lowerText.contains("ethereum") -> listOf(
                "Ultrasound money? More like ultra-volatile.",
                "Gas fees higher than your rent. But hey, decentralization!"
            )
            lowerText.contains("sol") || lowerText.contains("solana") -> listOf(
                "Fast, cheap, and occasionally online. Did it halt again?",
                "Mainnet Beta... forever."
            )
            lowerText.contains("yes") || lowerText.contains("over") -> listOf(
                "Ah, an optimist. How cute.",
                "Going long on hopium. Stonks go up, right?",
                "Yes, because the internet never lies and the crowd is always right."
            )
            lowerText.contains("no") || lowerText.contains("under") -> listOf(
                "A hater's favorite button. Let the hate flow through you.",
                "Shorting the universe. Gravity always wins in the end."
            )
            lowerText.contains("circuit breaker") || lowerText.contains("emergency") -> listOf(
                "Pull the plug! The algorithmic equivalent of hiding under the bed.",
                "When in doubt, halt everything and blame the intern.",
                "Nuclear option engaged. Because we didn't write unit tests for this."
            )
            lowerText.contains("simulate") || lowerText.contains("preview") -> listOf(
                "Let's play pretend before we lose real money.",
                "Simulation mode: Where your trades are always profitable and the gas is free.",
                "Running the numbers... computing... result: you're still poor."
            )
            else -> listOf(
                "Did you know? Clicking things aimlessly is how we got into this mess.",
                "Loading witty satire... please upgrade to ChatGPT Plus for better jokes.",
                "Just doing its thing. Nothing to see here. Move along.",
                "We outsourced this button to an AI. Good luck.",
                "Clicking this might break the matrix."
            )
        }
        val joke = jokes.random()
        return "$baseText\n\n🃏 MAD Insight:\n\"$joke\""
    }

    fun getMADHATrTooltip(element: String): String {
        val lowerText = element.lowercase()
        return when {
            lowerText.contains("market") || lowerText.contains("price") -> "Oh look, a chart. Let me guess, it goes to the right? Classic. Whaddya waitin' for, an invitation?"
            lowerText.contains("conviction") || lowerText.contains("stake") -> "Ah yes, 'Conviction'. Fancy word for 'I am guessing blindly.' Put your money where your mouth is, tough guy!"
            lowerText.contains("sentiment") -> "Ah yes, measuring our collective willingness to pretend this matters! Gotta love the hopium, eh?"
            lowerText.contains("telemetry") -> "Neural Telemetry? Listen to yourself! You sound like a sci-fi movie. It's just numbers, buddy."
            lowerText.contains("prediction") -> "Look at this guy, thinkin' he's got a crystal ball or something! Fuggedaboutit."
            lowerText.contains("impressions") -> "Sentient Views! Like anybody on the internet actually thinks before they click. Hilarious!"
            else -> "What, you want a cookie for hovering over this? Keep moving, pal!"
        }
    }

    // Generated after the 90-day comprehensive scrape
    fun getLoadingOneLiner(): String {
        return listOf(
            "Syncing the ledger... hopin' nobody left a backdoor open. Y'know?",
            "Breakin' down the headlines... wait, this ain't The Onion? This is real life?!",
            "Analyzing TikTok trends to run the macro policy... God help us all.",
            "Scraping crypto Twitter for 'alpha'. Yeah, don't do that at home, kid.",
            "Polishing the Top-Hats and shorting the meme coins. Standard Tuesday.",
            "Reticulating splines and dodging subpoenas. Keep it quiet, eh?",
            "Waitin' for Jamie Burke to drop some knowledge. Any minute now...",
            "Training the neural net on WSB loss porn. Poor thing's gettin' depressed.",
            "Generating passive aggressive defenses against the woketurds... stand by."
        ).random()
    }
    
    fun getShareText(scenario: com.example.model.Scenario): String {
        val truthRatio = if (scenario.tag == "[SENTINEL]") (1.0 - (scenario.crowdConvictionSpeed.coerceIn(0.0, 100.0) / 100.0)) * 100.0 else null
        val sentimentText = if (scenario.sentimentBullishRatio > 0.5) "bullish hopium" else "bearish panic"
        val line1 = if (truthRatio != null) {
            "🚨 The MADHAT'r Liar Meter reads ${truthRatio.toInt()}% Truth on: ${scenario.name}"
        } else {
            "📈 Market Conviction is riding the $sentimentText on: ${scenario.name}"
        }
        val line2 = "Are you a degen or a master deductive reasoner? Prove it on The MAD Gambit 🎩📉 #MADGambit #PredictionCircus"
        return "$line1\n$line2"
    }
}
