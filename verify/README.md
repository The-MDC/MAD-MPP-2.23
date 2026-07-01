# MAD GAMBIT • Native App Simulator & Developer Telemetry Portal

**MAD GAMBIT** is an agentic full-stack simulator, developer telemetry dashboard, and conviction pricing blueprint engine. Designed with precision typography, deep cosmic aesthetics, and high-contrast visual themes, it bridges web simulation with native Android activity routing (`com.madgambit.app`).

---

## 🌟 Comprehensive QA & Build Audit Report

### Front-to-Back & Top-to-Bottom Code Verification
1. **Build Configuration Malfunction Resolved**:
   - **Root Cause**: Previously, Next.js was outputting static export builds into `.next` or `out/`, leaving the root `/dist` directory empty during production deployment pipelines. This triggered artifact upload errors (`Build artifacts are empty`).
   - **Step-by-Step Resolution**:
     - Configured `next.config.ts` with `output: "export"`.
     - Created automated pre-build (`prebuild.js`) and post-build (`postbuild.js`) scripts in `package.json`.
     - `postbuild.js` automatically verifies artifact generation and recursively copies all static web assets from `out/` into `dist/`.
     - Fully audited and verified zero compilation errors or linting warnings (`next lint` and `next build` passing 100% green).
2. **State & Local Persistence Integrity**:
   - Guarded all browser-only APIs (`localStorage`, `window.addEventListener`) with `typeof window !== "undefined"` to eliminate SSR hydration mismatches and null pointer exceptions.
   - Synchronized simulation reset timestamps across components using custom window broadcast events (`"mad-simulation-reset"`).
3. **Mathematical & Telemetry Precision**:
   - Integrated continuous stochastic matrix calculation for temporal conviction curves ($e^{-\alpha \cdot t}$) visualized via responsive `recharts` graphs.
   - Verified floating-point validation bounds ($\alpha \in [0.0, 1.0]$) across profile ingestion workflows.

---

## 🎨 Visual Identity & Dual-Mode Theme Engine

The UI operates on an intentional mood-driven architecture:
* **Ultra Dark Mode (Cosmic Slate)**: Deep `#030303` obsidian canvas framed by `#262626` subtle borders, highlighted by Amber (`#eab308`) and Cyan (`#06b6d4`) telemetry badges.
* **Neon High Contrast Mode**: Pitch `#000000` cyberpunk stage with glowing Cyan (`#06b6d4`) and Cyber Pink (`#ec4899`) borders, designed for developer telemetry dashboards.

---

## 📱 Native Android Merge & Design Handoff

To seamlessly merge the web simulator's styling, design tokens, and conviction curves into the native Android application (`com.madgambit.app`), consult our complete developer handoff guide:

👉 **[View Android Design & Style Merge Handoff (`/docs/ANDROID_DESIGN_HANDOFF.md`)](./docs/ANDROID_DESIGN_HANDOFF.md)**

### Key Android Handoff Highlights:
* **Jetpack Compose Design Tokens**: Complete drop-in `darkColorScheme` and `Typography` specifications.
* **Continuous Math Curve Engine**: Kotlin implementation of `ConvictionMathEngine.calculateDriftCurve`.
* **Activity Routing Telemetry**: Intent routing specifications for `SimulatorActivity`, `GambitsActivity`, `IngestActivity`, and `BlueprintActivity`.

---

## 🛠️ Local Development & Build Commands

```bash
# Install dependencies
npm install

# Start local development server on port 3000
npm run dev

# Run full production verification build (generates /dist artifacts)
npm run build

# Run code quality linter
npm run lint
```
