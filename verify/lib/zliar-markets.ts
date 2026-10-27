/**
 * MAD Gambit — the Z-Liar market set.
 * ══════════════════════════════════════════════════════════════════════
 * One list, derived from the engine, shared by every surface that shows
 * Z-Liar markets.
 *
 * ── Why this module exists ────────────────────────────────────────────
 * The markets used to be a `const MARKETS` inside zliar-section.tsx with
 * hand-typed numbers: `credibility: 22`, `yes: 2.4`, `no: 1.5`. Those figures
 * had no relationship to `zLiarMeter()` — the function the meter sitting
 * directly above them is driven by — so the instrument and the market cards
 * beneath it could and did disagree about how credible the same kind of claim
 * is. Two components rendering the same concept from two different sources of
 * truth is the failure this repo keeps re-learning.
 *
 * Each market is now defined by the THREE INPUTS the engine actually takes —
 * narrative variance, source credibility, corroboration — and everything
 * displayed is computed from them by `zLiarMeter()`. Change the engine and
 * these move with it, which is the whole point.
 *
 * ── Odds are derived, not decorated ───────────────────────────────────
 * `liarOdds`/`truthOdds` come from the reading itself: the score IS the
 * implied probability that the claim is a lie, so decimal odds are 1/p with a
 * stated margin, exactly as the prediction ledger prices a binary. Hand-typed
 * odds would have implied a book that nobody was keeping.
 *
 * ── The fixed clock, and why ──────────────────────────────────────────
 * `zLiarMeter()` folds in `getLunarPhaseMultiplier(nowMs)`, which defaults to
 * `Date.now()`. Called during render that gives the server one score and the
 * browser a different one milliseconds later — a hydration mismatch on every
 * load, of the same species as the one fixed in unpacked-cards-carousel.
 *
 * So the list is derived at a FIXED reference instant and is therefore
 * deterministic. The consequence is honest and worth stating: this set is a
 * stable showcase, not a live tape. A surface that wants the lunar tilt
 * moving should pass its own `nowMs` from an effect, never from render.
 * ══════════════════════════════════════════════════════════════════════ */
import { zLiarMeter, type ZLiarReading, type ZLiarVerdict } from "@/lib/gambit-game-math";
import { INK } from "@/lib/gambit-design-tokens";

/** Fixed reference instant — see the header. 2026-08-01T00:00:00Z. */
export const ZLIAR_REFERENCE_MS = Date.UTC(2026, 7, 1);

/** The vig on the derived two-way book, matching how the ledger de-vigs. */
const MARGIN = 0.06;

export interface ZLiarMarketSeed {
  id: string;
  subject: string;
  claim: string;
  /** The three engine inputs. Everything else is computed from these. */
  narrativeVariance: number;
  sourceCredibility: number;
  corroboration: number;
}

export interface ZLiarMarket extends ZLiarMarketSeed {
  reading: ZLiarReading;
  /** 0–100. The inverse of the Z-Liar score: how believable the claim is. */
  credibility: number;
  verdict: ZLiarVerdict;
  /** Decimal odds on the claim being a lie / being true. */
  liarOdds: number;
  truthOdds: number;
}

/**
 * Seeds, ordered as authored. The three inputs carry the editorial judgement
 * that the hardcoded credibility scores used to carry — the difference is that
 * now the engine, not a designer, turns judgement into a number.
 */
const SEEDS: ZLiarMarketSeed[] = [
  { id: "z1", subject: "ANON CEO",     claim: "“Funds are SAFU, trust me.”",   narrativeVariance: 0.86, sourceCredibility: 0.18, corroboration: 0.08 },
  { id: "z2", subject: "MEME FOUNDER", claim: "“Not a rug — LP is locked.”", narrativeVariance: 0.74, sourceCredibility: 0.30, corroboration: 0.22 },
  { id: "z3", subject: "CELEB SHILL",  claim: "“Definitely not a paid post.”",  narrativeVariance: 0.91, sourceCredibility: 0.12, corroboration: 0.05 },
  { id: "z4", subject: "AI LAB",       claim: "“AGI ships next quarter.”",      narrativeVariance: 0.68, sourceCredibility: 0.42, corroboration: 0.30 },
  { id: "z5", subject: "EXCHANGE",     claim: "“Reserves are fully 1:1.”",      narrativeVariance: 0.44, sourceCredibility: 0.61, corroboration: 0.52 },
  { id: "z6", subject: "GOV SPOKES",   claim: "“No decision has been made.”",   narrativeVariance: 0.58, sourceCredibility: 0.48, corroboration: 0.36 },
  { id: "z7", subject: "LABEL PR",     claim: "“The split is amicable.”",       narrativeVariance: 0.63, sourceCredibility: 0.38, corroboration: 0.27 },
];

/** Round to 2dp without the float dust that 1/p produces. */
const dp2 = (n: number) => Math.round(n * 100) / 100;

function derive(seed: ZLiarMarketSeed, nowMs: number): ZLiarMarket {
  const reading = zLiarMeter({
    narrativeVariance: seed.narrativeVariance,
    sourceCredibility: seed.sourceCredibility,
    corroboration: seed.corroboration,
    nowMs,
  });
  // The score is the implied P(lie). Clamped away from the ends so the odds
  // stay finite — a market at p=0 or p=1 is not a market.
  const p = Math.min(0.95, Math.max(0.05, reading.score / 100));
  return {
    ...seed,
    reading,
    verdict: reading.verdict,
    credibility: Math.round(100 - reading.score),
    liarOdds: dp2((1 - MARGIN) / p),
    truthOdds: dp2((1 - MARGIN) / (1 - p)),
  };
}

/**
 * The market set. Pass `nowMs` only from an effect — see the header on why
 * render-time `Date.now()` breaks hydration here.
 */
export function zliarMarkets(nowMs: number = ZLIAR_REFERENCE_MS): ZLiarMarket[] {
  return SEEDS.map((s) => derive(s, nowMs));
}

/** Least credible first — the ones worth betting against lead. */
export function zliarMarketsByCredibility(nowMs: number = ZLIAR_REFERENCE_MS): ZLiarMarket[] {
  return zliarMarkets(nowMs).sort((a, b) => a.credibility - b.credibility);
}

/** Shared colour ramp, so every Z-Liar surface grades credibility identically. */
export function credibilityColor(credibility: number): string {
  if (credibility < 35) return INK.pink;
  if (credibility < 60) return INK.gold;
  return INK.green;
}
