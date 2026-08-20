/**
 * MAD Gambit — GDELT signal engine (Part S build).
 *
 * Pure parsers + scandal scoring for GDELT GKG / V2 records → Perp-market
 * trigger probability. Feeds the Z-Liar Meter + scandal-velocity surfaces.
 *
 * Serverless-native by design: there is NO file watcher / eBPF / bpftrace /
 * chokidar here — those cannot run on Vercel (ephemeral, sandboxed, no kernel
 * access). The celebrity whitelist lives in Neon (lib/whitelist.ts) and is read
 * per-request with a short cache, not hot-reloaded from disk via a kernel probe.
 */

/** Null-safe parse of a GDELT delimited field (V2Persons, V2Themes, …).
 *  "Elon Musk,123;Taylor Swift,456" → ["elon musk","taylor swift"]. */
export function parseGdeltField(
  field: string | null | undefined,
  delimiter = ";",
  minNameLength = 3,
): string[] {
  if (field == null || typeof field !== "string" || field.trim() === "") return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const block of field.trim().split(delimiter)) {
    const raw = block.split(",")[0];
    if (!raw) continue;
    const name = raw.replace(/[^a-zA-Z0-9\s'-]/g, "").trim().toLowerCase();
    if (name.length >= minNameLength && !seen.has(name)) {
      seen.add(name);
      out.push(name);
    }
  }
  return out;
}

/** Parse a GDELT GCAM field ("wc:125,c2.1:4,v42.1:0.23") → { "c2.1": 4, … }. */
export function parseGcam(field: string | null | undefined): Record<string, number> {
  const out: Record<string, number> = {};
  if (field == null || typeof field !== "string") return out;
  for (const pair of field.split(",")) {
    const [key, val] = pair.split(":");
    if (!key) continue;
    const n = Number(val);
    if (Number.isFinite(n)) out[key.trim()] = n;
  }
  return out;
}

/** Emotional weights for scandal velocity — negative affect drives scandal,
 *  joy dampens it. Tunable; sourced from the GDELT/GCAM handoff. */
export const EMOTION_WEIGHTS = {
  shame: 1.8,
  anger: 1.4,
  disgust: 1.3,
  fear: 1.2,
  sadness: 1.0,
  joy: -0.5,
} as const;

export type Emotion = keyof typeof EMOTION_WEIGHTS;
export type EmotionScores = Partial<Record<Emotion, number>>;

/** Weighted, non-negative scandal-velocity from normalized emotions (0..1 each). */
export function scandalVelocity(emotions: EmotionScores): number {
  let s = 0;
  for (const key of Object.keys(EMOTION_WEIGHTS) as Emotion[]) {
    const v = emotions[key];
    if (typeof v === "number" && Number.isFinite(v)) {
      s += EMOTION_WEIGHTS[key] * Math.max(0, Math.min(1, v));
    }
  }
  return Math.max(0, s);
}

const SCANDAL_THEMES = [
  "scandal", "corruption", "arrest", "affair", "lawsuit", "fraud",
  "leak", "controversy", "allegation", "divorce", "indict", "resign",
];

/** 0..1 scandal-ness of a set of V2Themes based on scandal-keyword hits. */
export function themeScandalWeight(themes: string[]): number {
  if (!themes.length) return 0;
  let hits = 0;
  for (const t of themes) {
    const low = t.toLowerCase();
    if (SCANDAL_THEMES.some((s) => low.includes(s))) hits++;
  }
  if (hits === 0) return 0;
  return Math.min(1, hits / themes.length + 0.2);
}

export interface PerpTriggerInput {
  personMatches: number; // # whitelisted celebs in the record
  themeScandalWeight: number; // 0..1
  scandalVelocity: number; // from scandalVelocity()
}

/** Perp-market trigger probability (0..1): bounded exponential of the product
 *  of whitelisted matches × theme scandal weight × (1 + emotional velocity).
 *  P = 1 − exp(−k · matches · themeWeight · (1 + velocity)). */
export function perpTriggerProbability(input: PerpTriggerInput): number {
  const matches = Math.max(0, input.personMatches);
  const theme = Math.max(0, Math.min(1, input.themeScandalWeight));
  const vel = Math.max(0, input.scandalVelocity);
  const k = 0.25;
  const raw = 1 - Math.exp(-k * matches * theme * (1 + vel));
  return Math.max(0, Math.min(1, raw));
}

export interface GdeltScore {
  matchedPersons: string[];
  themes: string[];
  personMatches: number;
  themeScandalWeight: number;
  scandalVelocity: number;
  perpProbability: number;
}

/** End-to-end scoring for one parsed GDELT record against a whitelist. */
export function scoreGdeltRecord(params: {
  persons: string[];
  themes: string[];
  emotions: EmotionScores;
  whitelist: Set<string>;
}): GdeltScore {
  const matched = params.whitelist.size
    ? params.persons.filter((p) => params.whitelist.has(p))
    : params.persons; // no whitelist configured → treat all as candidates
  const tw = themeScandalWeight(params.themes);
  const sv = scandalVelocity(params.emotions);
  const perp = perpTriggerProbability({
    personMatches: matched.length,
    themeScandalWeight: tw,
    scandalVelocity: sv,
  });
  return {
    matchedPersons: matched,
    themes: params.themes,
    personMatches: matched.length,
    themeScandalWeight: tw,
    scandalVelocity: sv,
    perpProbability: perp,
  };
}
