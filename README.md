# The MΛD Gambit (Android Application)

## Introduction
Welcome to **The MΛD Gambit**, a uniquely stylized, predictive market and conversational sentiment intelligence platform. This application features an interactive dual-ticker, real-time prediction staking forms, modular conversation intelligence interfaces powered by Gemini models, and an integrated "Liar Meter" designed to track narrative credibility.

The architecture emphasizes modularity, secure data handling, and component-based Jetpack Compose UI architecture suitable for a containerized operational paradigm.

## App Architecture & Modularity

The project adheres strictly to **Clean Architecture** combined with a robust **MVVM** pattern using state flows. The modules are segmented as follows:

### 1. `com.example.ui.components`
This directory holds modular, stateless and stateful Compose UI functions. Notable modules:
- **`MadHatrFloatingAvatar.kt`**: Our programmatic character mascot rendering engine, designed purely in Canvas vectors to adapt precisely to any density bucket.
- **`ConvictionDashboardOverlay.kt`**: A dynamic user module containing staking functions, volatility charts derived from custom path logic, and active toasts.
- **`DualTickerAndRecentEntries.kt`**: A robust, horizontally structured set of tickers (`TopMarketsAndLiarsDualTicker`) demonstrating dynamic modular composition, and `RecentEntriesListWidget` pulling simulated but typed data representing historical wagers/convictions.
- **`SatireTickerWidget.kt`**: Shows scrolling, animated predictive intelligence data in the signature "MΛD" satirical tone.
- **`MadCreditHeaderWidget.kt`**: A fully functional top-header displaying the live user "MΛD" credit balance with dynamically injected visual feedback (such as conditional neon-glowing borders based on recent win analytics).

### 2. `com.example.viewmodel`
The central state engine (`GambitViewModel`).
- Manages high-level domain operations (`GambitState`).
- Subscribes to time-based emissions.
- Handles user input, interaction logic, and credit manipulation.

### 3. `com.example.engine`
The brain of the operation.
- **`LiarMeterEngine.kt`**: Integrates conversational text logic via the API, auditing statements to detect and quantify deviations from verified narratives and outputs a highly satirical risk scoring.
- **`GeminiManager.kt`**: Integrates securely with external cloud APIs.

### 4. `com.example.model`
Data definitions, DTOs, and application state classes representing users, wagers, historical convictions, dynamic balances, and prediction variables.

## Secure Data Operations & Containerization Context

### 1. Secrets Management
The application is governed by a secure build process utilizing Google’s `Secrets Gradle Plugin`. Sensitive keys (e.g. Gemini API, remote service authentication paths) are extracted out of the repository structure into securely injected `.env` files. Ensure you construct your root container with restricted volume mounts for env distribution.

### 2. Permissions Profile
Only the necessary permissions to fulfill networking (`INTERNET`) and potential external data integrations are maintained. Review the AndroidManifest to guarantee scope-limiting per standard operational guidelines.

### 3. Compilation & Build Tooling
Project uses Gradle Kotlin DSL (`build.gradle.kts`). We leverage native compilation chains targeting SDK 34+. It is recommended to perform containerized builds with a predefined JDK 17 environment to guarantee reproducible `.aab` / `.apk` outputs. Code maintains no internal IDE bindings and runs uniformly across isolated CI pipelines (`gradle assembleDebug`).

## Custom Design System
The visual style is enforced by `LocalGambitTheme`, built over Material Layout structures. It defines a high-contrast standard combining Neon Greens, Magentas, deeply overlaid dark slate backgrounds, and monospace data fonts.

**Aesthetic Tenants:**
- Component shadows must utilize precise brand accent color casting for glass-morphism execution.
- Standard 8dp grid spacing model must be adhered to.
- Use explicit visual toggles for sensitive actions (Staking predictions requiring explicit slider confirmations).

## Development Guidelines
- Always verify changes against the `compileDebugKotlin` target (`gradle kspDebugKotlin compileDebugKotlin`).
- Avoid direct `Color(0xFF...)` declarations outside of specific graphical overrides. Centralize themes.
- Limit internal `padding` declarations from overlapping container-level spacings to reduce structural breakage in dynamic window-size classes.

### Embarking on New Module Creation
1. Define visual output in `ui/components`. Use `Modifier` as paramount parameterized arguments.
2. Ensure domain models in `model/Models.kt` align accurately.
3. Manage user inputs by streaming commands into `GambitViewModel` and never mutating local data instances parallel to the truth source.

*Build. Stake. MΛD.*
