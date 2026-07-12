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

---

## Game Lobby — Production Plugin Requirements

The **Game Lobby** (`components/game-lobby.tsx`) ships **client-side** (localStorage +
in-session images) so the demo works with zero infra. To go **fully live / multi-user**,
provision these plugins and wire the client to `app/api/v1/lobby/route.ts` (already written,
DB-ready, 16-day expiry + image-only validation):

| Need | Plugin / service | Notes |
|---|---|---|
| **Persistence** | Postgres via `DATABASE_URL` | Run the schema in `app/api/v1/lobby/route.ts` header. `pg` already a dep. |
| **Realtime** (live chat push) | Supabase Realtime **or** Pusher/Ably (WebSockets) | Client currently polls/loads; swap to a channel subscription per room. |
| **Image/GIF storage** | Supabase Storage **or** S3/R2 + CDN | Upload returns a URL; route enforces image-only (`png/jpg/gif/webp`). No docs/video. |
| **Identity** (real usernames) | SIWE / social auth (`auth-modal`) | Replace the auto `Degen#nnnn` handle with the signed-in identity. |
| **Moderation** | OpenAI/Perspective moderation API + image scan | Gate `POST` before insert (marked `PLACEHOLDER` in the route). |
| **Rate limiting** | Upstash Redis / Vercel KV | Per-user/IP throttle on `POST` (marked `PLACEHOLDER`). |
| **16-day hard delete** | `pg_cron` (or a Vercel Cron) | `DELETE FROM lobby_messages WHERE created_at < now() - interval '16 days';` Reads already filter by 16d. |

**Env:** `DATABASE_URL`, plus the chosen realtime/storage keys. Until set, the route returns
`503` and the client stays on its local fallback — nothing breaks.
