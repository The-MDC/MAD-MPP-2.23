# Master Maths — the Android / Kotlin secondary app

A **secondary app** in this repo. The primary product is the Next.js app in `verify/`
(Vercel root directory, Neon Postgres, the perp families, the contracts in `contracts/`).
This directory is a separate Android/Kotlin build that does not share a toolchain with it.

## What is here

| Path | What it is |
|---|---|
| `app/src/main` | The Android application module — 103 Kotlin sources |
| `app/applet/defi/DefiSecurityEngine.kt` | DeFi security engine |
| `app/fastapi_microservice/` | A Python FastAPI service (`main.py`, `core/engine.py`) |
| `assets/` | Fonts, images, WebP assets |
| `gradle/`, `build.gradle.kts`, `settings.gradle.kts`, `gradle.properties` | The Gradle build |
| `override_shapes.sh`, `replace_fonts.mjs`, `increase_borders.mjs`, … | Asset-rewriting build scripts |
| `mad-gambit-tailwind.config.js`, `metadata.json`, `border_usages.txt` | Design-token and metadata inputs |

## Why it lives here rather than at the repo root

It arrived at the root in commit `8c7a195`, which also deleted the entire Next.js app,
every Solidity contract, and all CI — 307,305 deletions under the message
*"chore: standardize AI persona and configure Gemini"*. That was reverted.

Two roots cannot coexist: both trees define `app/`, and the Android `app/` overwrote the
Next.js pages at `app/page.tsx` and `app/maddegens-presentation/page.tsx`. Nesting the
Android project one level down resolves that collision permanently — `settings.gradle.kts`
resolves `include(":app")` relative to its own directory, so the build is unaffected by
the move.

`rootProject.name` was `"My Application"` (the Android Studio default); it is now
`"Master Maths"`.

## Building

Independent of the web app. Nothing in `verify/` imports from here and nothing here
imports from `verify/`.

```
cd master-maths
./gradlew :app:assembleDebug
```

## Not wired to CI

`.github/workflows/` gates the Next.js app (`ci.yml`, `unit-tests.yml`), the contracts
(`foundry.yml`), migrations (`db-migrate.yml`) and secrets (`secret-scan.yml`). **None of
them build this project**, and the Foundry/CI path filters do not match `master-maths/**`.

A Gradle job belongs here before this is treated as shipping code — otherwise it can stop
compiling without anything going red, which is the same class of gap that left
`contracts/script/**` unverified until it was noticed by accident.
