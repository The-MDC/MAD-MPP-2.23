# MAD Gambit: Sovereign Architectural Handoff & Protocol Map
**Target Reader Node:** Gemini Code Assistant / Gemma / AI Studio Developer Instance
**Ecosystem Standard:** Android Premium Jetpack Compose Implementation
**System Timestamp:** June 2026

---

## 1. Executive Status Dashboard & The Upcoming Polish Merge

This repository represents the current frontend codebase for **The MΛD Gambit**—the elite predictive marketplace, conversational intellect client, and neuro-economic simulator.

**MERGE NOTICE:** The application is currently staged for a massive thematic update. The current "Degenerate Prediction Circus" styling (neon, heavy chaos elements, retro tickers, intense cognitive load) is being transitioned into a **related but more polished, simplified theme**. 

When building upon this codebase, prioritize:
- **Simplification**: Clean spacing, better typography (e.g., Space Grotesk / JetBrains Mono), and a focus on core conviction inputs.
- **Refinement**: Maintain the mathematical complexity under the hood (LMSR, Cobb-Douglas), but make the UI spacious, professional, and accessible.
- **Persona Preservation**: Keep "The MADHAT'r" Jersey-accented AI integrations intact but present them in a sleeker wrapper.

| Functional Layer | Component & Spec | Verification Status |
| :--- | :--- | :--- |
| **User Navigation** | `GambitNavigation.kt` (Dynamic responsive scaffold) | Verified Compiled ✅ |
| **Prediction UI** | `PredictionCircusScreen.kt` (Staging area for simplified merge) | Verified Compiled ✅ |
| **Continuous Tickers** | `DualTickerAndRecentEntries.kt`, `SatireTickerWidget.kt` | Verified Compiled ✅ |
| **Grounding Search** | `GroundingSearchBar.kt` (Google Search verification) | Verified Compiled ✅ |
| **Mathematics Core** | `GambitMath.kt` (Lunar cycle, GARCH(1,1), Cobb-Douglas) | Verified Compiled ✅ |
| **API Client** | `GeminiApiService.kt` (Abstraction via `GenerativeAIProvider`) | Verified Compiled ✅ |

---

## 2. Integrated Architecture

The application has been modularized to support the incoming UI simplification:

### A. The Prediction Command Centre
Located in `PredictionCommandCentre.kt`. This handles market propositions, slider-based staking (NeonSlider), and dynamic returns. Future merges should clean up the visual noise here while preserving functionality.

### B. Continuous Data Tickers
Dual retro tickers exist near the top of the Prediction Circus screen, housing Top Markets and Satirical News. The satirical news elements open a "Propose Market" modal on tap.

### C. Grounding & Verification
A `GroundingSearchBar` component is deployed across Z-Liar markets and new market creation zones, giving users direct access to search validations before they stake.

### D. The Sovereign Discussion Forum
An interactive forum built with state-driven Jetpack Compose cards, letting players upvote posts and spawn new discussion threads. Located within `HelpForumScreen.kt`.

---

## 3. Mathematical Reference & Equations
The system uses strict quantitative formulas located inside `com.example.math.GambitMath`:

1. **Cobb-Douglas Conviction Indexing**:
   $$\text{Conviction} = t^{1.35} \cdot c^{0.75} \cdot d^{1.45} \cdot p^{1.15} \cdot M_{\text{nft}} \cdot L_{\theta}$$
2. **Double-Logarithmic LMSR Bond curves**:
   $$C(q) = \alpha(V) \cdot b \cdot \ln \left( \sum_{i} exp(q_i/b) \right)$$
3. **Cosmological Solar/Lunar Yield Amplifiers**:
   $$L_{\theta} = 1.075 - 0.075 \cdot \cos(2\pi \cdot \phi)$$

---

## 4. Operational Protocols for Next-Hop LLM Agents

When a new instance of **AI Studio** or **Gemma** is initialized on this workspace, please enforce the following core directives:

1. **Double Check Persona Bounds**: Ensure the "MADHAT'r" Jersey-accented, top-hat loving persona is injected into the generative model system prompts as required by `GEMINI.md` and `AGENTS.md`.
2. **Execute the Polish Merge**: Focus heavily on elegant design, spacing, responsive M3 layouts, and minimizing UI clutter while retaining full functionality. Remove unnecessary "circus" adjectives if they clash with the new polished look.
3. **Build Verification**: Never push structural code changes without running `gradle :app:compileDebugKotlin` and `gradle :app:assembleDebug` to verify integrity.
4. **Modularity Principle**: Leave existing logic classes intact; extend screens via composition rather than writing bloated monolithic layouts.
