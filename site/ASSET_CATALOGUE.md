# Brand asset catalogue — MAD Gambit · MDC · MADDAO · MADdegens

What exists, where it came from, where it is used, and what is held back and why. Scanned 2026-11-01/02 from Google
Drive (`_The MDC` › Branding · Product & DEV · Marketing) and the local brief folders. The symbol vocabulary itself is
code: `verify/lib/brand-symbols.ts`. **Rule from the founder: the symbols are for the app; the website uses them
sparingly.**

## 1 · MAD Gambit symbols — 10 standalone, all in the app

Source: Drive › Branding › LOGOs › *MAD Gambit logo & symbols* 4 / 6 / 8 / 9 (each sheet = logo + a row of three).
Cut to transparent 256 px files.

| Symbol | File in the app (`verify/public/brand/…`) | Meaning | App: section | App: tier | Website |
|---|---|---|---|---|---|
| Silver crystal ball | `sym-prediction.png` (= `card-epi.png`) | Foresight · Prediction | Perpetual Epiphanies; "Prediction" class tab | **User** | Prediction (trio) |
| Scales | `sym-conviction.png` (= `card-zeit.png`) | Judgement · Conviction | **The Floor**; Zeitgeist; "Conviction" class tab | **Minor Creator** | Conviction (trio) |
| Cracked heart | `sym-affliction.png` (= `card-faces.png`) | Affliction | Five Faces | — | Affliction (trio) |
| Thorned heart | `card-gossip.png` | Deep affliction | Gossip-Cop | — | — |
| Lightning bolt | `card-scandal.png` | Scandal velocity | **Casino**; Scandal; "Perps" class tab | — | — |
| Target | `card-zliar.png` | Precision | **Logic**; Z-Liar | — | — |
| Coins | `symbols/coins.webp` **new** | Capital | **Packs** | **VIP** | — |
| Gavel | `symbols/gavel.webp` **new** | Authority | **Arena** | **CR8TR** | — |
| Broken chain | `symbols/chain.webp` **new** | Links and bridges | **Portal** | — | — |
| Purple crystal ball | `symbols/ball-purple.webp` **new** | Rare foresight | **NFT Saga**; "Certain-UnCertainty" class tab | **Creator VIP** | — |

Also on the sheets, not cut: a sparkle variant of the crystal ball and a second scales (near-duplicates), and three
logo-only icons (★ star, purple orb, purple broken heart) too small in the source to cut cleanly — ask the designer for
standalone files if the app should use the logo's own trio.

**Where the app shows them:** platform tabs on `/preview`, the `/mpp2.23` tab bar and the platform explorer (one per
room); the open-markets class tabs; the Account button (your tier); the **Your standing** ladder on `/profile`
(User → Minor Creator → CR8TR → VIP → Creator VIP). Tiers derive from the engine's `CREATOR_LADDER`;
`verify/lib/brand-symbols.test.ts` pins them.

## 2 · MAD Gambit marks and character

| Asset | Source | Used |
|---|---|---|
| Neon wide logo (`logo-wide.jpg`) | Presentation-Engine repo | Site hero |
| Square logo (`logo-square.jpg`), stacked logo (`logo-stacked.webp`) | Presentation-Engine repo; Drive LOGOs *MAD Gambit Logo2 1x1* | Site favicon / header / share image |
| PASEOME MAD HAT'S top hat (`madhat-hat`) | App `/public/brand` | Site creator hub avatar, MADHAT'r section |
| MADHAT'r bust (`madhatr-bust`) | App `/public/brand` | Site MADHAT'r section (the app's canonical character) |
| Market banners: *Future Fame*, *Court of Opinion*, *Star Gauge*, *Jury Box* | Drive LOGOs *logo & symbols* base / 5 | **Not yet used** — candidate art for market-category headers in the app |
| *MAD Gambit SVG Swag logo* | Drive LOGOs | Not used — merch/swag lock-up |

## 3 · MADDAO · MDC · MADdegens

| Asset | Source | Used | Note |
|---|---|---|---|
| MADDAO diamond emblem | Drive LOGOs *MΛĐĐΛO Logo.png* | Site ecosystem (MADDAO card) | |
| MADDAO letter logo | Drive LOGOs *MΛĐĐΛO Letter Logo.png* | Not used | Black on transparent; needs a light plate |
| Smoky MDC & DAO banner | Drive MISC Banners | Site ecosystem banner | |
| MADdegens emblem (fist, diamond) | Drive *MADdegens LogoFinal.png* | Site ecosystem (MDC card) | |
| MDC medallion ("$MADX since 2021") | Drive MDC Logo | **Held** | Legacy `$MADX` wording could be confused with MADDEX `$MADx` — founder to decide |
| MAD Ventures Inc wordmark | Drive LOGOs | **Held** | Entity not mentioned elsewhere — founder to confirm |
| ∑ntangled logo | Drive Logos & Media | **Held** | Reads as the Market+ brand from the 2025 whitepaper — founder to confirm before use |
| MADdApp .mvp | Drive LOGOs / MDC Logo | Held | Earlier app brand |
| MDC logo animation (mp4, gif) | Drive MDC Logo | Not pulled | Use once the MDC mark is confirmed |

## 4 · Held back on purpose

| What | Why |
|---|---|
| *Megalomaniacs* art (MANIACs repo, Drive Branding › Megalomaniacs) | Caricatures of identifiable public figures; conflicts with the product's no-identification rule |
| Team headshots (presentation brief folder) | Real people; need each person's consent |
| MADHAT'r video series (Drive Branding › Video, 22 clips) | A different-looking character from the app's bust; founder to say which is official |
| MAD UpShot-era art (banners, characters, GameChip, SEI banner) | Pre-rename branding; the SEI banner also carries a partner's mark |
| Personal photos and documents, third-party ads/screenshots on the Desktop | Not brand assets |

## 5 · Video

22 MADHAT'r clips (≈2 MB, 6 s, 416×752, with audio) and the MDC logo animation are in Drive. None is on the site or in
the app while the character question is open.
