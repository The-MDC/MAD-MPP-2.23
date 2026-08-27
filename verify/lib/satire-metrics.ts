/**
 * MAD Gambit — Z-Liar satire metrics.
 * ------------------------------------------------------------------
 * Composes the existing lexicon sentiment scorer + the real Z-Liar Meter
 * (gambit-game-math) into a single "how good is this headline for a satirical
 * market" score. This is NOT a new model — it is a deterministic composition of
 * math already in the repo. It powers ranking for the Neon Noir Tabloid /
 * Scandal Sheet feed and the throttleable roast-severity control.
 *
 * Pure + es5-safe.
 */
import { scoreSentiment, type Sentiment } from "@/lib/sentiment";
import { zLiarMeter } from "@/lib/gambit-game-math";

export type SatireVerdict = "PRIME SATIRE" | "BETTABLE" | "WATCH" | "SKIP";

export interface SatireMetrics {
  headline: string;
  sentiment: Sentiment;
  zLiarScore: number; // 0..100 (Z-Liar Meter)
  zLiarVerdict: string;
  satireScore: number; // 0..100 entertainment/satire quality
  roastSeverity: number; // 0..100, throttleable by user preference
  dopaminePotential: boolean;
  /** Clears the entertainment QUALITY bar — dramatic and non-credible enough
   *  to be worth roasting. High is good. This is what `brandSafe` always
   *  computed; only the name was wrong. */
  entertainmentGrade: boolean;
  /** 0..100 — how much this line looks like it makes a checkable factual
   *  assertion about a specific named party. HIGH IS BAD. Heuristic tripwire,
   *  never a defamation classifier: it cannot tell absurd exaggeration from a
   *  false claim of fact, and human review remains the real control. */
  assertionRisk: number;
  /** assertionRisk under the review threshold. Fails CLOSED — an empty or
   *  unscoreable line is not safe. */
  lowAssertionRisk: boolean;
  /**
   * @deprecated Reads `entertainmentGrade`. The name said safety and the maths
   * said juiciness: it required `zLiarScore >= 60`, i.e. SERIAL EMBELLISHER or
   * TOTAL FABRICATION, so a measured credible line FAILED it and a wild
   * fabrication PASSED. Callers wanting a safety signal want
   * `lowAssertionRisk`; callers wanting the quality bar want
   * `entertainmentGrade`. Kept so no caller silently flips meaning.
   */
  brandSafe: boolean;
  verdict: SatireVerdict;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const round2 = (n: number) => Math.round(n * 100) / 100;

export interface SatireOptions {
  corroboration?: number; // 0..1 source/social corroboration
  roastThrottle?: number; // 0..1 severity throttle (user pref)
}

/** Above this, a line goes to human review rather than straight out. */
export const ASSERTION_REVIEW_THRESHOLD = 50;

/** Capitalised runs that are not sentence-initial and not all-caps shouting —
 *  a cheap proxy for "names a specific party". */
const NAMEY = /(?:^|[^.!?]\s)([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})+)/g;

/** Verbs that turn a joke into a checkable claim of fact. */
const ASSERTIVE = [
  "arrested", "charged", "indicted", "convicted", "guilty", "fraud", "stole",
  "lied", "cheated", "abused", "assaulted", "trafficking", "laundering",
  "bribed", "corrupt", "addict", "overdose", "affair", "cheating", "paedophile",
  "pedophile", "rapist", "predator", "criminal", "felon", "embezzled",
];

/** Hedges that mark the line as opinion, absurdity or counterfactual — the
 *  benign-violation move, and the irrealis mood the Paseome family relies on. */
const HEDGES = [
  "allegedly", "reportedly", "apparently", "if", "would", "could", "might",
  "imagine", "what if", "somehow", "presumably", "rumour", "rumor", "claims",
];

/**
 * A crude, deliberately conservative read on whether a line asserts a
 * checkable fact about a named party. Named parties raise it; assertive verbs
 * raise it a lot; hedges and counterfactual mood lower it.
 *
 * This is a TRIPWIRE. It routes to human review; it does not clear anything.
 */
export function assertionRiskOf(text: string): number {
  const t = (text ?? "").trim();
  if (!t) return 100; // fails closed — an unscoreable line is not safe
  const lower = t.toLowerCase();

  NAMEY.lastIndex = 0;
  let names = 0;
  while (NAMEY.exec(t) !== null) names++;

  let assertive = 0;
  for (let i = 0; i < ASSERTIVE.length; i++) {
    if (lower.indexOf(ASSERTIVE[i]) !== -1) assertive++;
  }
  let hedges = 0;
  for (let i = 0; i < HEDGES.length; i++) {
    if (lower.indexOf(HEDGES[i]) !== -1) hedges++;
  }

  const raw = 30 * Math.min(names, 2) + 34 * Math.min(assertive, 2) - 18 * Math.min(hedges, 2);
  return clamp(Math.round(raw), 0, 100);
}

/** Score one headline for satirical-market worthiness. */
export function satireMetrics(headline: string, opts: SatireOptions = {}): SatireMetrics {
  const sentiment = scoreSentiment(headline);
  const corroboration = clamp(opts.corroboration ?? 0.4, 0, 1);
  const reading = zLiarMeter({
    narrativeVariance: sentiment.intensity,
    sourceCredibility: corroboration,
    corroboration,
  });
  const zLiarScore = round2(reading.score);
  // Entertainment drama = negative valence; the best satire is energetic + dramatic.
  const drama = Math.max(0, -sentiment.valence);
  const satireScore = round2(
    clamp(0.45 * sentiment.intensity * 100 + 0.3 * drama * 100 + 0.25 * zLiarScore, 0, 100),
  );
  const throttle = clamp(opts.roastThrottle ?? 1, 0, 1);
  const roastSeverity = round2(satireScore * throttle);
  const entertainmentGrade = zLiarScore >= 60 && sentiment.intensity >= 0.3;
  const assertionRisk = assertionRiskOf(headline);
  const lowAssertionRisk = assertionRisk < ASSERTION_REVIEW_THRESHOLD;
  const verdict: SatireVerdict =
    satireScore >= 75 ? "PRIME SATIRE" : satireScore >= 50 ? "BETTABLE" : satireScore >= 30 ? "WATCH" : "SKIP";

  return {
    headline,
    sentiment,
    zLiarScore,
    zLiarVerdict: reading.verdict,
    satireScore,
    roastSeverity,
    dopaminePotential: sentiment.dopaminePotential,
    entertainmentGrade,
    assertionRisk,
    lowAssertionRisk,
    brandSafe: entertainmentGrade,
    verdict,
  };
}

/** Rank a batch of headlines by satire score (drops empties). */
export function rankBySatire(headlines: string[], opts: SatireOptions = {}): SatireMetrics[] {
  return headlines
    .filter((h) => h && h.trim().length > 0)
    .map((h) => satireMetrics(h, opts))
    .sort((a, b) => b.satireScore - a.satireScore);
}
