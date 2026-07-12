# MAD Gambit — Phone-Layout Tactical Execution Plan

**Goal:** Deliver the full phone home screen (per spec) as modular, containerized, production-grade components — maximum joy/dopamine fidelity, minimum tokens/time.
**Branch:** `claude/mad-gambit-integration-plan-nbbqg8` · **Base:** latest `main`.

## Standing rules (apply to every step — no re-explaining per step)
- **Modularity:** one component = one file in `verify/components/`. No logic in `page.tsx` beyond composition.
- **Reuse first:** build ONE `carousel.tsx` primitive; every carousel (Z-Liar markets, cards, conviction, predictions, auctions) consumes it. Don't hand-roll five scrollers.
- **Tokens only:** colors from `INK` / `GOLD_CHISEL_STOPS` (`lib/gambit-design-tokens.ts`). Zero raw hex in new files.
- **Fidelity kit:** `framer-motion` for springs, gold-cased SVG bezel pattern (from `PodFrame`), `celebrate()` from `joy-layer.tsx` on every reward beat, `navigator.vibrate` micro-haptics.
- **A11y/SSR:** `prefers-reduced-motion` no-op path in every animation; guard `typeof window`; `aria-label` on controls.
- **Gate each step:** `npm run build` green → commit (Conventional Commits) → push. One increment = one commit. Never batch two unbuilt features.
- **Token thrift:** edit surgically (anchored `Edit`, not full rewrites); build once per increment; don't re-read unchanged files.

## Shared primitive (build FIRST — unblocks 4 steps)
**S0 · `carousel.tsx`** — horizontal snap-scroll, `INK` edge-fade mask, momentum, optional peek, `aria-roledescription="carousel"`, reduced-motion → wrap. Props: `children`, `gap`, `snap`, `peek`. ~1 file, reused ×4.

## Steps (ordered top-down = render order)
| # | Component (file) | Contains | Dopamine/joy hooks |
|---|---|---|---|
| 1 | `main-nav.tsx` | Fixed bar: logo top-left, hamburger top-right → Framer slide-drawer with all links (the 7 tab routes + profile). | Spring drawer, backdrop blur, scale-haptic on open |
| 2 | `zliar-section.tsx` | Z-Liar meter + dopamine dial (left) · "Liar of the Day" Yes/No vote (clickable, optimistic state) · `<Carousel>` of ALL Z-Liar markets. | `celebrate()` on vote; needle spring; vote-tally count-up |
| 3 | `pack-shop.tsx` + `use-rip-sound.ts` | "Open Packs" button → dropdown of 5 packs (buy+rip). Rip = Web Audio API synth (no binary): tear-noise burst + foil shimmer + confetti. Then `<Carousel>` of NFT play cards (reuse `NftCardView`, carbon-copy). | `celebrate({intensity:1.2})` on rip; ripping FX; haptic |
| 4 | `market-rails.tsx` | Three `<Carousel>` rails: Conviction (+dopamine dial/ticker) · Predictions · Dutch auctions. Reuse `PredictionCircus`, `DutchAuctionPanel` cards. | Per-card press-spring; dial cycle on double-tap |
| 5 | `page.tsx` compose | Order: LiveTicker → `MainNav` → SeikoHub(hero) → `ZLiarSection` → `PackShop` → `MarketRails`. Wrap panels already crossfade. | — |

## Per-step loop (identical every time — the "least tokens" engine)
1. `Edit`/`Write` the single new file (reuse S0 + existing components).
2. One-line wire into `page.tsx`.
3. `npm run build` → green.
4. `git commit -m "feat: <step>" && git push` → Vercel auto-preview.
5. Report one line + preview link; await go / next step.

## Definition of done
Phone home renders the exact spec sequence; every rail is the shared `Carousel`; every interaction has a spring + reduced-motion path; 0 raw hex; build green; each step its own commit on one PR.

## Out of scope here (tracked elsewhere)
Backend wiring (SIWE/DB/oracle — `MADBIT_PRECISION_INTEGRATION_PLAN.md §D`), real card-art binaries (§C), deck consistency (§E).
