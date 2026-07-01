# MAD Gambit — Card Canonical Reference
## Single source of truth for on-chain, UI, and game engine values

**Source:** MADHATs_Gambit_Card_Game_Logic_Code_Reference.docx (April 2026, CONFIDENTIAL)
**Status:** All values locked. Do not change without updating this doc, the engine, and the smart contracts simultaneously.

---

## Canonical Constants (all in `lib/gambit-game-math.ts`)

| Constant | Value | Source §|
|---|---|---|
| `PLATFORM.CARD_PACK_COST` | 4.88 MADx | §4 |
| `PLATFORM.CARD_PACK_SIZE` | 5 | §4 |
| `PLATFORM.CARD_GENERATION_SEED` | 8888 | §4 |
| `PLATFORM.TOTAL_DECK_SIZE` | 992 | §4 |
| `PLATFORM.PACK_GUARANTEE_SLOT` | 0 | §4 |
| `PLATFORM.FEE_BPS` | 188 (1.88%) | §1 |
| `PLATFORM.MADX_FIXED_SUPPLY` | 888,888,888 | §1 |
| Token address (Arbitrum One) | `0xb61ae7727579e3781ca0ec4902b6ba21d335fd18` | §1 |

---

## Rarity Table (7 Tiers) — `RARITY_TABLE`

| Rarity | Power | Clout | APY | Token | Holo |
|---|---|---|---|---|---|
| Common | 88 | 1.1x | 12% | ERC-1155 | ❌ |
| Uncommon | 256 | 1.8x | 16% | ERC-1155 | ❌ |
| Rare | 488 | 2.4x | 22% | ERC-1155 | ❌ |
| Epic | 1,888 | 3.2x | 31% | ERC-1155 | ❌ |
| Legendary | 4,888 | 5.5x | 48% | ERC-721 | ✅ |
| Golden Hand | 7,888 | 8.8x | 68% | ERC-721 | ✅ |
| Mythic | 99,999 | 99.9x | 88% | ERC-721 | ✅ |

---

## Faction Mapping — Display Name → Canonical On-Chain ID

| Display Name | Canonical ID |
|---|---|
| Disruptors | `disruptors` |
| Classics & Influencers | `elites` |
| The Villains | `chaos` |
| Pop Icons | `drama-guild` |
| The Memes | `degens` |
| Screen Gods | `royalists` |
| The Athletes | `masses` |
| Politicos | `mad-council` |

---

## Evolution Burn Costs — `EVOLUTION_BURN_COSTS`

| From Rarity | Cards to Burn | XP Required |
|---|---|---|
| Common → Uncommon | 100 | 100 XP |
| Uncommon → Rare | 250 | 200 XP |
| Rare → Epic | 500 | 500 XP |
| Epic → Legendary | 1,000 | 2,500 XP |
| Legendary | Max (burn-ladder apex) | — |

**Note:** VRF-style `attemptEvolution()` is a separate, chance-based lane (no burn cost, can fail and destroy card).

---

## Staking Tiers — `STAKING_TIERS`

| Tier | Min MADx | APY |
|---|---|---|
| Bronze | 100 | 12% |
| Silver | 500 | 18% |
| Gold | 2,500 | 28% |
| Platinum | 10,000 | 42% |
| Diamond | 50,000 | 58% |
| MAD Tier | 100,000 | 68% |

---

## Tournament System (8 Tiers) — Prize BPS in `TOURNAMENT_PRIZES_BPS`

| Tier | Name | Entry Fee | Max Players |
|---|---|---|---|
| 1 | Baby Yoda | 0.88 MADx | 10 |
| 2 | Quickie | 1.88 MADx | 20 |
| 3 | Degen | 2.88 MADx | 50 |
| 4 | Daily Grind | 4.88 MADx | 100 |
| 5 | Grinder | 8.88 MADx | 200 |
| 6 | Whale Hunt | 18.88 MADx | 500 |
| 7 | Degen Lord | 48.88 MADx | 1,000 |
| 8 | Mega Balls | 88.88 MADx | 2,000 |

Prize distribution: 40% / 20% / 12% / 5% / 5% / 2% / 2% / 2% / 2% / 2% (ranks 1-10).

---

## Known Code Mismatches (from docx §12)

| File | Issue | Status |
|---|---|---|
| `RARITY_TABLE` | All 7 tiers | ✅ CORRECT |
| `NftCard.stage` | Was max 5 (incorrect), now max 3 | ✅ FIXED |
| `NftCard.cloutPct` | Was confusing % display, now shows multiplier × 100 | ✅ FIXED |
| Faction names | Display names now mapped to canonical IDs | ✅ FIXED |
| `evolveCard()` | Now enforces burn cost (cards + XP) | ✅ FIXED |
| Tournament route | Was using `mmrDelta` (single value) | ✅ FIXED → `calculateTournamentScores` |
| Prize table | Now uses canonical BPS table | ✅ FIXED |
| Pack opening | Was missing entirely | ✅ FIXED → `openCardPack()` + API route |
| Staking tiers | Were undocumented | ✅ ADDED → `STAKING_TIERS` |
| EigenTrust → Whale gate | Trust score decorative | ⬜ PENDING Stage 11 |
| Roast/meme share | Step 6 of Affliction loop | ⬜ PENDING Stage 6 |
| HAT Agent rentals | WokeBot Karen etc. | ⬜ BACKLOG |

---

## Google Cloud Run Deploy Config

```bash
npm ci
npm run build
gcloud run deploy mad-gambit \
  --source . \
  --allow-unauthenticated \
  --port 8080 \
  --region us-central1 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10
```

## AI Studio Integration Points

| Placeholder | Location | Prod Value |
|---|---|---|
| Card art zone | `components/nft-card.tsx` → ART PLACEHOLDER | AI Studio 900+ PNG/WebP files → CDN path `/cards/{canonicalFactionId}/{serial}.webp` |
| Z-Liar quips | `components/zliar-meter.tsx` | Gemini API with MADHAT'r persona from `AGENTS.md` |
| Satirical ticker | `components/live-ticker.tsx` | Gemini `gemini-1.5-flash` with Sentinel routing |
| Oracle resolution | `components/dopamine-engine.tsx` | Chainlink VRF + News APIs |
