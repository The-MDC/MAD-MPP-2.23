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
  brandSafe: boolean; // clears the entertainment quality gate
  verdict: SatireVerdict;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const round2 = (n: number) => Math.round(n * 100) / 100;

export interface SatireOptions {
  corroboration?: number; // 0..1 source/social corroboration
  roastThrottle?: number; // 0..1 severity throttle (user pref)
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
  const brandSafe = zLiarScore >= 60 && sentiment.intensity >= 0.3;
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
    brandSafe,
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
