/**
 * MAD Gambit — per-family perp market shapes and the engine maths behind them.
 * ══════════════════════════════════════════════════════════════════════
 * The markets themselves are NOT defined here. They come from the scrape, via
 * /api/v1/perps/family, which runs gdelt_signals through the real classifier
 * and attaches a satirical one-liner per market. This module owns three things
 * that route needs and the deck also needs: the id mappings, the tradeable
 * split, and the derivation from a classified proposal to a tradeable row.
 *
 * ── An earlier version of this file invented its own markets ──────────
 * It shipped with hand-written `SEEDS` — subjects and claims I authored for
 * Epiphany, Faces and Zeitgeist. That was wrong on two counts. The platform
 * already scrapes real signals and already classifies them into exactly these
 * families, so inventing rows bypassed working machinery. And there is no
 * product sheet for Epiphany or Gossip-Cop anywhere in the repo — docs/ holds
 * FIVE_FACES, ZEITGEIST and MAD_FORGE only — so those entries were invention
 * presented as product content, which is the same failure as the hardcoded
 * credibility scores the Z-Liar work replaced.
 *
 * ── THREE id vocabularies, which is why the mappings live here ────────
 * The same six families are spelled differently in three places:
 *
 *   deck card id   (perp-dials.tsx)      scandal zliar gossip     epi      faces zeit
 *   family key     (market-view.ts)      scandal zliar gossip     epiphany faces zeitgeist
 *   classifier     (market-classifier)   —       zliar gossipcop  epiphany faces zeitgeist
 *
 * `FAMILY_META[card.id]` therefore returns undefined for two of six, and
 * `proposal.type === family` is false for Gossip-Cop. Both would fail quietly
 * rather than loudly. The translations are explicit here and nowhere else.
 * ══════════════════════════════════════════════════════════════════════ */
import { garchUpdate, getLunarPhaseMultiplier, PLATFORM } from "@/lib/gambit-game-math";
import { FAMILY_META, TRADEABLE_FAMILIES, type PerpFamily6 } from "@/lib/market-view";
import type { MarketProposal, MarketType } from "@/lib/market-classifier";

export type { PerpFamily6 };

/** Deck card id → canonical family key. */
export const DECK_ID_TO_FAMILY: Record<string, PerpFamily6> = {
  scandal: "scandal",
  zliar: "zliar",
  gossip: "gossip",
  epi: "epiphany",
  faces: "faces",
  zeit: "zeitgeist",
};

/** Canonical family key → the classifier's own type name. */
export const CLASSIFIER_TYPE: Record<PerpFamily6, MarketType> = {
  // Scandal Velocity is an index over all signals, not a class the classifier
  // assigns; "perp" is its nearest type and it is signal-only anyway.
  scandal: "perp",
  zliar: "zliar",
  gossip: "gossipcop",
  epiphany: "epiphany",
  faces: "faces",
  zeitgeist: "zeitgeist",
};

/**
 * Re-exported from lib/market-view.ts, which now owns it.
 *
 * This used to be a hand-written duplicate of that set, kept only because the
 * original was private. Two copies of the rule that decides whether a family
 * can be traded is a divergence waiting to happen: the deck would offer a
 * position the route rejects, or refuse one it would accept. Kept as an alias
 * so existing callers do not have to change.
 */
export const TRADEABLE: ReadonlySet<PerpFamily6> = TRADEABLE_FAMILIES;

export const SIGNAL_ONLY_NOTE: Partial<Record<PerpFamily6, string>> = {
  scandal:
    "Scandal Velocity is an index, not a book. It reports a GARCH(1,1) chaos reading across gdelt_signals — there is no position to take in the index itself. It prices the markets in the other families.",
  zliar:
    "The Z-Liar Meter grades a statement. Its markets are the credibility markets on the meter's own panel, not a perp book — open the meter to see them.",
  gossip:
    "Gossip-Cop is a long-arc claim contest and is signal-only today: market-view.ts records it as one of the three families with no perp_markets row behind it.",
};

export function familyLabel(family: PerpFamily6): string {
  return FAMILY_META[family].label;
}
export function familyKicker(family: PerpFamily6): string {
  return FAMILY_META[family].kicker;
}

export interface PerpFamilyMarket {
  id: string;
  subject: string;
  /** 0..1 — this family's instrument reading for the signal. */
  reading: number;
  /** Lunar leg the position advances on. */
  legDays: number;
  longOdds: number;
  shortOdds: number;
  horizonDays: number;
  resolutionCriteria: string;
  /** Attached by the route: the satirical one-liner and the headline it rewrites. */
  oneLiner?: string;
  realHeadline?: string;
}

export interface PerpFamilyBook {
  family: PerpFamily6;
  label: string;
  tradeable: boolean;
  source: "live" | "demo" | "n/a";
  markets: PerpFamilyMarket[];
  note: string;
}

const MARGIN = 0.06;
const dp2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Classified proposal → tradeable row. Everything numeric is computed:
 *
 *   reading  perpProbability from the classifier, tempered by realised
 *            volatility from garchUpdate() with the platform's own
 *            GARCH_OMEGA/ALPHA/BETA, then tilted by the lunar multiplier the
 *            perp roll is already paced by. Clamped away from the ends so odds
 *            stay finite — a market at p=0 or p=1 is not a market.
 *   legDays  28 nominal days scaled by that same multiplier.
 *   odds     (1 - margin) / p, as the ledger prices a binary.
 *
 * `nowMs` is explicit rather than defaulting to Date.now(), because
 * getLunarPhaseMultiplier() would otherwise give the server one value and the
 * browser another for the same render.
 */
export function marketFromProposal(p: MarketProposal, nowMs: number): PerpFamilyMarket {
  const variance = garchUpdate(
    PLATFORM.GARCH_OMEGA,
    PLATFORM.GARCH_ALPHA,
    PLATFORM.GARCH_BETA,
    0.02,
    p.perpProbability,
  );
  const lunar = getLunarPhaseMultiplier(nowMs);
  const raw = p.perpProbability * (1 + Math.sqrt(variance)) * lunar;
  const reading = Math.min(0.95, Math.max(0.05, raw));

  return {
    // Derived from the headline so the same signal keeps the same id across
    // refreshes, rather than a Date.now() key that churns every poll.
    id: `pf-${hash(p.headline)}`,
    subject: p.title,
    reading,
    legDays: Math.round(28 * lunar),
    longOdds: dp2((1 - MARGIN) / reading),
    shortOdds: dp2((1 - MARGIN) / (1 - reading)),
    horizonDays: p.horizonDays,
    resolutionCriteria: p.resolutionCriteria,
  };
}

/** Small stable string hash — enough to key a list, not a security primitive. */
function hash(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

/** The book a deck card should show, before the fetch resolves. */
export function pendingBook(deckId: string): PerpFamilyBook | null {
  const family = DECK_ID_TO_FAMILY[deckId];
  if (!family) return null;
  const tradeable = TRADEABLE.has(family);
  return {
    family,
    label: familyLabel(family),
    tradeable,
    source: tradeable ? "demo" : "n/a",
    markets: [],
    note: tradeable
      ? "Loading the latest scrape…"
      : SIGNAL_ONLY_NOTE[family] ?? "Signal-only: this family has no perp book.",
  };
}
