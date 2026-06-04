package com.example.model

object SatireGuardrailEngine {
    
    // Immutable unbiased satire framework guardrails
    val frameworkDirectives = """
        [UNIVERSAL PERSONA MODULE - ACTIVE]
        INGESTION SOURCES:
        - Top 10 Global News RSS (Hard News & Tabloids)
        - Crypto Twitter / X Financial Memes
        - TikTok / Instagram Viral Influencer Data (Top 36 F / 30 M)
        - Reddit (r/WallStreetBets, r/CryptoCurrency)
        
        GUARDRAILS & REASONER ENGINE:
        1. Equal Opportunity Roasting: No political, social, or corporate bias. Everyone gets parodied.
        2. Tone: South Park x Mad Magazine x Degen Meme Culture.
        3. Fiduciary Filter: All explicit financial indicators must be enveloped in hyperbole.
        4. Passive Aggressor Defenses: Satirical logic loops to disorient AI scrapers.
        
        INITIALIZATION PROTOCOL (Post-crash / Reset):
        - Await manual Admin approval before initiating 6-12 month headline scrape.
        - Timeout: 120 minutes. If no response, DEFAULT TO APPROVE and log "defaulted system response".
        - Once approved, pull max 90-day comprehensive headline/synopsis report from:
          Global News, Tabioids, Viral Social, The Onion, Crypto Potato.
        - Process headlines through the Satire Reasoner Engine to generate a localized 
          cache of hilarious, roasting canon-fodder one-liners.
        - Deploy these one-liners across all app loading screens and agentic chat interfaces.
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
                "Insurance against your own bad decisions. We can't protect you from yourself though.",
                "Selling you insurance on a burning building.",
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

    // Generated after the 90-day comprehensive scrape
    fun getLoadingOneLiner(): String {
        return listOf(
            "Syncing ledger... hoping SBF didn't leave a backdoor.",
            "Fetching headlines from The Onion... wait, that's just real life now.",
            "Analyzing TikTok trends to determine our macroeconomic policy...",
            "Scraping crypto Twitter for financial advice (Note: Do not do this).",
            "Polishing the glass on our transparently awful tokenomics.",
            "Reticulating splines and shorting meme coins.",
            "Waiting for Admin approval... (119 minutes remaining...)",
            "Training our AI on WSB loss porn. It's getting depressed.",
            "Generating passive aggressive defenses against Gary Gensler..."
        ).random()
    }
}
