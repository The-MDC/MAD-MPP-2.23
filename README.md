# The MΛD Gambit (Android Application)
Powered by the MADHAT'r System Design & Consensus Intelligence

## Introduction
Welcome to **The MΛD Gambit**, a uniquely stylized, predictive market and conversational sentiment intelligence platform. The application currently features an interactive continuous retro ticker system, real-time prediction staking forms, "Z-Liar" markets, modular conversation intelligence interfaces powered by Gemini models, and an integrated "Liar Meter" designed to track narrative credibility. 

**Upcoming Merge & Simplification:** This repository is currently being staged for a merge into a **related but more polished, simplified theme**. The dense, feature-rich "Degenerate Prediction Circus" components are being streamlined to focus on core conviction mechanics, improved typography, spacious layouts, and a refined professional aesthetic while retaining the underlying MADHAT'r persona and predictive power.

---

## What's Current: Integrated Consensus & Market System

1. **Prediction Circus & Conviction Dashboard:** The primary hub for user interaction, housing the integrated `TrendingConvictionGrid`, `DualTickerAndRecentEntries`, and the `PredictionCommandCentre`.
2. **Integrated Continuous Tickers:** Real-time dual retro-style tickers displaying Top Markets, Hottest Commodities, and Satirical "Z-Liar" News.
3. **Grounding Search Bar:** A dedicated search and grounding tool integrated into the new market creation area and Z-Liar markets for enhanced truth-discovery before staking.
4. **Propose Market Modal:** Streamlined entry points from the continuous tickers directly into market proposition fields.

---

## App Arch & Code Structures

The project coordinates modern Android **MVVM** architectures with strict **Clean Architecture** patterns:

### 1. `com.example.ui.screens`
* **`PredictionCircusScreen.kt`**: Our primary marketplace dashboard showcasing high-stakes predictions, continuous retro tickers, grounding search, and the "Prediction Circus" branding.
* **`HelpForumScreen.kt`**: Houses our Help manual, Interactive consensus forum, and gen-lang-client REST documents.
* **`AuthScreen.kt` & `ProfileScreen.kt`**: VIP hubs, profit share metrics, and creator monetization logic.

### 2. `com.example.ui.components`
* **`SatireTickerWidget.kt` & `DualTickerAndRecentEntries.kt`**: Continuous horizontal marquee tickers for markets and news.
* **`GroundingSearchBar.kt`**: User-facing search for narrative verification.
* **`PredictionCommandCentre.kt`**: Core interactive staging ground for creating and staking in new markets.

### 3. `com.example.math`
* **`GambitMath.kt`**: Central mathematical core. Hosts Cobb-Douglas conviction multipliers, volume-adaptive DL-LMSR scoring bonding curves, GARCH(1,1) volatility calculation, and lunar alignment functions.

### 4. `com.example.api`
* **`GeminiApiService.kt`**: Interfaces with `https://generativelanguage.googleapis.com/` using high-performance Retrofit + Kotlin Serialization.

---

## Build, Build-Check, & Compilation Tooling

Verify modifications using standard local compiler tasks:

```bash
# Check compiler integrity
gradle :app:compileDebugKotlin

# Perform complete build assembly
gradle :app:assembleDebug
```

> **Requirements:** JDK 17, Android SDK 34+.

---

## 🔬 Core Algorithms & Mathematical Formative Report

This section outlines the advanced tokenomic and gaming mechanics supporting **The MΛD Gambit** platform, verified within the `com.example.math` Kotlin runtime package.

### 1. Cobb-Douglas Conviction score (Cognitive Settle Engine)

The continuous dynamic conviction matching is evaluated using a customized non-linear mathematical structure based on the Cobb-Douglas production function, adjusted for NFT accelerators and real-time lunar-cycle offsets:

$$\text{Conviction} = t^{1.35} \cdot c^{0.75} \cdot d^{1.45} \cdot p^{1.15} \cdot m \cdot l$$

*   $t$ : Time-Scaled Duration Factor $(\ge 0)$
*   $c$ : Capital Staking Scale $(\ge 0)$
*   $d$ : Direct Platform Contribution Score $(\ge 0)$
*   $p$ : Psych-Sentiment Weighting Scale $(\ge 0)$
*   $m$ : NFT Clout Multiplier
*   $l$ : Continuous Lunar Phase Multiplier:
    $$l(\text{epoch}) = 1.075 - 0.075 \cdot \cos(2\pi \cdot \text{normalizedLunarPhase})$$

### 2. Double-Logarithmic Logarithmic Market Scoring Rule (DL-LMSR)

To adaptively manage liquidity and market volatility, the game utilizes a proprietary volume-adaptive DL-LMSR scoring bonding curve calculation.

$$\alpha(V) = 1 + 0.05 \cdot \log_{10}(1 + V)$$

*   **Cost bonding function:**
    $$C(q) = \alpha(V) \cdot b \cdot \ln\left(\sum e^{q_i / b}\right)$$
*   **Spot price function for outcome $i$:**
    $$P_i = \frac{e^{q_i / b}}{\sum e^{q_j / b}}$$

### 3. The Furnace Burning Coefficient

The deflationary sink function ("The Furnace") calculates the exact percentage of transactional volume burned per settlement, capped strictly at $4.9\%$ to avoid system-wide liquidity starvation.

### 4. teaBag Risk Engine & Shield Payout Mechanics

*   **Premium formula:**
    $$\Phi = \text{Stake} \cdot P_{\text{win}} \cdot \sqrt{\sigma^2_{t+1}} \cdot 1.05$$

---

## 📡 Google Generative Language client API Integration Paths

All AI features (mood checks, lie-meter, daily forecasts, and the Jersey-accented "MADHAT'r" conversational system) interface with the Google Generative Language REST APIs using high-speed containerized endpoints.


### 1. `POST /v1beta/models/gemini-1.5-flash:generateContent`
*   **Purpose:** Runs natural language processing, cognitive roasting, lie detection, and forecasts.
*   **Authentication:** Set using `BuildConfig.GEMINI_API_KEY` injected seamlessly from secure app environment vars.
*   **Payload Format:**
    ```json
    {
      "contents": [
        {
          "role": "user",
          "parts": [
            {
              "text": "User inputted text to analyze for integrity verification."
            }
          ]
        }
      ],
      "systemInstruction": {
        "parts": [
          {
            "text": "You are the MAD Gambit Concierge and Host, known as 'The MADHAT'r'... "
          }
        ]
      }
    }
    ```
*   **Response Format:**
    ```json
    {
      "candidates": [
        {
          "content": {
            "parts": [
              {
                "text": "Calculated JSON-aligned response structure containing scores, roasts, and verdict metadata."
              }
            ]
          }
        }
      ]
    }
    ```
