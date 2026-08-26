/**
 * MAD Gambit — per-family perp market sets.
 * ══════════════════════════════════════════════════════════════════════
 * The sibling of lib/zliar-markets.ts, for the other five perp families. One
 * source of truth, derived from the engine, shared by every surface that wants
 * to show "all markets in this family".
 *
 * ── The deck's card ids are not the canonical family keys ─────────────
 * perp-dials.tsx names its cards `epi` and `zeit`; PERP_FAMILIES in
 * market-view.ts calls the same things `epiphany` and `zeitgeist`. So
 * `FAMILY_META[card.id]` silently returns undefined for two of the six, and any
 * code that tried it would fall back to a blank rather than fail loudly.
 * DECK_ID_TO_FAMILY makes the mapping explicit and one-directional; the deck
 * keeps its short ids, the engine keeps its canonical ones, and the translation
 * lives in exactly one place instead of being re-guessed per call site.
 *
 * ── Three of the six have no markets, and that is not a gap ───────────
 * market-view.ts records that only `faces`, `zeitgeist` and `epiphany` are
 * backed by a `perp_markets` row: "The other three are signal-only." Scandal,
 * Z-Liar and Gossip-Cop are instruments that produce a READING, not a book you
 * can take a position in.
 *
 * So this module does NOT invent markets for them. A signal-only family returns
 * an empty list plus the reason, and the UI says so. Manufacturing three rows
 * to make the six cards look symmetrical would be the same class of mistake as
 * the hardcoded credibility scores this pattern replaced: a surface asserting a
 * thing the platform does not have.
 *
 * ── Fixed clock, same as zliar-markets ────────────────────────────────
 * Anything folding in getLunarPhaseMultiplier() defaults to Date.now(), which
 * during render gives the server one value and the browser another. The
 * reference instant is shared with zliar-markets so the two agree.
 * ══════════════════════════════════════════════════════════════════════ */
import { garchUpdate, getLunarPhaseMultiplier, PLATFORM } from "@/lib/gambit-game-math";
import { FAMILY_META, type PerpFamily6 } from "@/lib/market-view";
import { ZLIAR_REFERENCE_MS } from "@/lib/zliar-markets";

/** Deck card id → canonical family key. See the header. */
export const DECK_ID_TO_FAMILY: Record<string, PerpFamily6> = {
  scandal: "scandal",
  zliar: "zliar",
  gossip: "gossip",
  epi: "epiphany",
  faces: "faces",
  zeit: "zeitgeist",
};

/** Mirrors market-view.ts's TRADEABLE_FAMILIES, which is not exported. */
export const TRADEABLE: ReadonlySet<PerpFamily6> = new Set<PerpFamily6>([
  "faces",
  "zeitgeist",
  "epiphany",
]);

export interface PerpFamilyMarket {
  id: string;
  subject: string;
  claim: string;
  /** 0..1 — the family instrument's current reading for this subject. */
  reading: number;
  /** Lunar leg the position advances on, from the engine's phase multiplier. */
  legDays: number;
  /** Decimal odds either side of the reading, with the platform margin. */
  longOdds: number;
  shortOdds: number;
  maxLeverage: number;
}

export interface PerpFamilyBook {
  family: PerpFamily6;
  label: string;
  kicker: string;
  tradeable: boolean;
  /** Empty for signal-only families — with `note` explaining why. */
  markets: PerpFamilyMarket[];
  note: string;
}

const MARGIN = 0.06;
const dp2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Seeds per tradeable family. Each carries the editorial subject and a GARCH
 * shock; the reading is computed, never typed. The shock is what the engine
 * actually consumes, so tuning a subject means tuning an input rather than
 * overwriting an output.
 */
const SEEDS: Partial<Record<PerpFamily6, { id: string; subject: string; claim: string; shock: number; lev: number }[]>> = {
  epiphany: [
    { id: "epi-jevons", subject: "JEVONS READ", claim: "Efficiency gains raise total consumption", shock: 0.22, lev: 3 },
    { id: "epi-agi", subject: "AGI TIMELINE", claim: "Capability curve holds through the next cycle", shock: 0.41, lev: 3 },
    { id: "epi-rates", subject: "RATE REGIME", claim: "The higher-for-longer model still describes it", shock: 0.18, lev: 3 },
  ],
  faces: [
    { id: "fac-mask", subject: "PERMANENT MASK", claim: "The public face survives the news cycle", shock: 0.31, lev: 10 },
    { id: "fac-trans", subject: "TRANSITORY MASK", claim: "The apology tour reverts within one leg", shock: 0.47, lev: 10 },
    { id: "fac-split", subject: "SPLIT PERSONA", claim: "Two faces diverge past the simplex bound", shock: 0.26, lev: 10 },
  ],
  zeitgeist: [
    { id: "zei-succ", subject: "SUCCESSION SLATE", claim: "The named successor holds the slot", shock: 0.35, lev: 5 },
    { id: "zei-turn", subject: "THE TURNING", claim: "Cultural turn completes before the slate expires", shock: 0.29, lev: 5 },
  ],
};

const SIGNAL_ONLY_NOTE: Partial<Record<PerpFamily6, string>> = {
  scandal: "Scandal Velocity is an index, not a book. It reports a GARCH(1,1) chaos reading across gdelt_signals — there is no position to take in the index itself. It prices the markets in the other families.",
  zliar: "The Z-Liar Meter grades a statement; its markets are the credibility markets on the meter's own panel, not a perp book. Open the meter to see them.",
  gossip: "Gossip-Cop is a long-arc claim contest and is signal-only today — market-view.ts records it as one of the three families with no perp_markets row behind it.",
};

function derive(
  seed: { id: string; subject: string; claim: string; shock: number; lev: number },
  nowMs: number,
): PerpFamilyMarket {
  // GARCH(1,1) with the platform's own coefficients — the same call the
  // Scandal Velocity dial and zLiarMeter() both make.
  const variance = garchUpdate(
    PLATFORM.GARCH_OMEGA,
    PLATFORM.GARCH_ALPHA,
    PLATFORM.GARCH_BETA,
    0.02,
    seed.shock,
  );
  // Reading is the shock tempered by realised volatility and the lunar tilt the
  // legs are already paced by, clamped away from the ends so odds stay finite.
  const lunar = getLunarPhaseMultiplier(nowMs);
  const raw = seed.shock * (1 + Math.sqrt(variance)) * lunar;
  const reading = Math.min(0.95, Math.max(0.05, raw));

  return {
    id: seed.id,
    subject: seed.subject,
    claim: seed.claim,
    reading,
    // Lunar leg length: the phase multiplier runs 1.00–1.15, so a nominal
    // 28-day leg stretches with lunacy exactly as the perp roll does.
    legDays: Math.round(28 * lunar),
    longOdds: dp2((1 - MARGIN) / reading),
    shortOdds: dp2((1 - MARGIN) / (1 - reading)),
    maxLeverage: seed.lev,
  };
}

/** The book for one family. Pass `nowMs` only from an effect — see the header. */
export function perpFamilyBook(family: PerpFamily6, nowMs: number = ZLIAR_REFERENCE_MS): PerpFamilyBook {
  const meta = FAMILY_META[family];
  const tradeable = TRADEABLE.has(family);
  const seeds = SEEDS[family] ?? [];
  return {
    family,
    label: meta.label,
    kicker: meta.kicker,
    tradeable,
    markets: tradeable ? seeds.map((s) => derive(s, nowMs)) : [],
    note: tradeable
      ? `${seeds.length} open position${seeds.length === 1 ? "" : "s"} · advanced by lunar leg · readings from GARCH(1,1)`
      : SIGNAL_ONLY_NOTE[family] ?? "Signal-only: this family has no perp book.",
  };
}

/** Resolve a deck card id straight to its book. Returns null for unknown ids. */
export function bookForDeckId(deckId: string, nowMs?: number): PerpFamilyBook | null {
  const family = DECK_ID_TO_FAMILY[deckId];
  return family ? perpFamilyBook(family, nowMs) : null;
}
