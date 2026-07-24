/**
 * MAD Gambit — lightweight lexicon sentiment scorer (TypeScript).
 * ------------------------------------------------------------------
 * A VADER-style keyword/valence scorer for headlines. It is deliberately a
 * lexicon scorer — NOT a transformer, NOT DistilBERT/RoBERTa, NOT quantized. It
 * is pure, dependency-free, and runs inline in a Vercel serverless route in
 * microseconds. A heavier ML model (if ever needed) belongs in the separate
 * MAD-Scandal-Corpus Python service, not in this app — so this is the honest,
 * serverless-native "sentiment augmentation" layer.
 *
 * Output feeds market classification (progression / saga / z-liar / perp) and the
 * "dopamine potential" flag used to rank the most bettable headlines.
 */
export interface Sentiment {
  /** -1 (heavy negative drama) .. +1 (positive). */
  valence: number;
  /** 0 (flat) .. 1 (high-energy / viral). */
  intensity: number;
  /** High-anticipation + energetic ⇒ inherently bettable. */
  dopaminePotential: boolean;
}

// Negative-drama terms — high entertainment value in this domain.
const NEG_DRAMA = [
  "scandal", "feud", "arrest", "drama", "fired", "divorce", "lawsuit", "fraud",
  "affair", "leak", "cheat", "split", "controversy", "indict", "resign", "expose",
  "allegation", "beef", "canceled", "cancelled", "meltdown", "clap back",
];
// Future / uncertainty terms — make an item forward-looking (bettable).
const FUTURE = [
  "will", "could", "might", "rumor", "rumour", "expected", "expects", "soon",
  "reportedly", "alleged", "brewing", "escalat", "looming", "threat", "predict",
  "upcoming", "set to", "poised", "braces",
];
// Hype / freshness cues — virality signal.
const HYPE = [
  "breaking", "exclusive", "shocking", "bombshell", "viral", "just in",
  "developing", "explosive", "insider", "spotted",
];

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const round2 = (n: number) => Math.round(n * 100) / 100;
const countHits = (t: string, words: string[]) => words.reduce((n, w) => (t.includes(w) ? n + 1 : n), 0);

export function scoreSentiment(text: string): Sentiment {
  const t = (text ?? "").toLowerCase();
  if (!t.trim()) return { valence: 0, intensity: 0, dopaminePotential: false };

  const neg = countHits(t, NEG_DRAMA);
  const fut = countHits(t, FUTURE);
  const hype = countHits(t, HYPE);

  // Negative drama pulls valence down (entertainment-negative); future language
  // lifts anticipation. Intensity aggregates all three energy sources.
  const valence = clamp(-0.35 * neg + 0.2 * fut, -1, 1);
  const intensity = clamp(0.25 * neg + 0.2 * fut + 0.25 * hype, 0, 1);
  // Bettable = future-facing AND energetic (a flat negative headline isn't a market).
  const dopaminePotential = intensity >= 0.5 && fut > 0;

  return { valence: round2(valence), intensity: round2(intensity), dopaminePotential };
}
