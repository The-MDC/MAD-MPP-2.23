/**
 * MAD Gambit — Scandal Scraper decision tree (Scandal-Scraper/Chaos-Fusion handoff).
 * ------------------------------------------------------------------
 * Pure, side-effect-free logic that scores a real-world scandal event and decides
 * whether it becomes a Chaos Fusion (≥3 distinct factions), a Crossover (2), a
 * Scandal Pack (1), a Live-Ticker market, or gets ignored. Brand safety is a hard
 * Z-Liar gate; scarcity is a daily cap + cooldown.
 *
 * Ported from the handoff and made es5-safe (the repo's tsc target is es5, so no
 * Set/Map spread — Array.from only).
 */
import type { FactionKey } from "@/lib/card-visual-states";

export type { FactionKey };

export interface ScandalEntity {
  rawName: string;
  normalizedName: string;
  characterId?: string;
  faction?: FactionKey;
  confidence: number; // 0..1
  role?: "primary" | "secondary" | "mentioned";
}

export interface ScandalEvent {
  id: string;
  source: "gdelt" | "gossipcop" | "manual" | "zliar";
  headline: string;
  summary?: string;
  publishedAt: Date;
  entities: ScandalEntity[];
  themes: string[];
  gcamScore?: number; // 0..100
  viralityScore: number; // 0..100
  zLiarScore?: number; // 0..1
  url?: string;
}

export type ChaosRarityHint = "epic" | "legendary" | "golden_hand" | "mythic";

export type TriggerDecision =
  | { type: "chaos_fusion"; characters: string[]; theme: string; rarityHint: ChaosRarityHint }
  | { type: "crossover"; characters: [string, string]; theme: string }
  | { type: "scandal_pack"; primaryCharacter: string; theme: string }
  | { type: "live_ticker_only" }
  | { type: "ignore"; reason: string };

export interface MultiPartyResult {
  distinctFactions: FactionKey[];
  resolvedCharacters: ScandalEntity[];
  isChaosCandidate: boolean;
  isCrossoverCandidate: boolean;
}

export interface ScandalScraperConfig {
  chaosScoreThreshold: number;
  crossoverScoreThreshold: number;
  packScoreThreshold: number;
  minZLiarQuality: number;
  minEntityConfidence: number;
  maxChaosPerDay: number;
  minHoursBetweenChaos: number;
  requireHumanReviewAbove: number;
}

export const DEFAULT_CONFIG: ScandalScraperConfig = {
  chaosScoreThreshold: 72,
  crossoverScoreThreshold: 58,
  packScoreThreshold: 45,
  minZLiarQuality: 0.55,
  minEntityConfidence: 0.72,
  maxChaosPerDay: 2,
  minHoursBetweenChaos: 18,
  requireHumanReviewAbove: 90,
};

/** Resolve entities and count distinct factions to gauge multi-party drama. */
export function analyzeMultiParty(
  event: ScandalEvent,
  minConfidence: number = DEFAULT_CONFIG.minEntityConfidence,
): MultiPartyResult {
  const resolved = event.entities.filter(
    (e) => !!e.characterId && !!e.faction && e.confidence >= minConfidence,
  );
  // es5-safe distinct: Array.from, never [...set].
  const factions = Array.from(new Set(resolved.map((e) => e.faction as FactionKey)));
  return {
    distinctFactions: factions,
    resolvedCharacters: resolved,
    isChaosCandidate: factions.length >= 3,
    isCrossoverCandidate: factions.length === 2,
  };
}

/** Weighted market-worthiness score (0..100). */
export function computeScandalScore(event: ScandalEvent): number {
  const wVirality = 0.35;
  const wGcam = 0.25;
  const wZLiar = 0.2;
  const wEntity = 0.2;

  const highConfCount = event.entities.filter((e) => e.confidence > 0.8).length;
  const entityScore = Math.min(highConfCount / 5, 1) * 100;
  const zLiar100 = (event.zLiarScore ?? 0.5) * 100;
  const gcam = event.gcamScore ?? 50;

  return wVirality * event.viralityScore + wGcam * gcam + wZLiar * zLiar100 + wEntity * entityScore;
}

const THEME_MAP: [string, string][] = [
  ["divorce", "THE GREAT UNRAVELING"],
  ["breakup", "HEARTBREAK HOTEL"],
  ["feud", "THE FEUD ETERNAL"],
  ["lawsuit", "COURTROOM CHAOS"],
  ["arrest", "THE FALL FROM GRACE"],
  ["fraud", "THE GRAND GRIFT"],
  ["leak", "THE LEAK LEGION"],
  ["scandal", "THE SCANDAL SPIRAL"],
  ["meltdown", "TOTAL MELTDOWN"],
  ["cancel", "THE CANCELLATION"],
];

/** Deterministic satirical theme name for a Chaos card, from the event text. */
export function extractChaosTheme(event: ScandalEvent): string {
  const hay = `${event.headline} ${event.summary ?? ""} ${event.themes.join(" ")}`.toLowerCase();
  const match = THEME_MAP.find(([kw]) => hay.includes(kw));
  if (match) return match[1];
  const seed = (event.themes[0] ?? "UNTOLD").replace(/[^a-zA-Z]/g, "").toUpperCase();
  return `THE ${seed || "UNTOLD"} AFFAIR`;
}

/** The full 5-gate decision tree. */
export function decideTrigger(
  event: ScandalEvent,
  config: ScandalScraperConfig = DEFAULT_CONFIG,
): TriggerDecision {
  // Gate 1 — Z-Liar quality (brand safety, hard).
  if ((event.zLiarScore ?? 1) < config.minZLiarQuality) {
    return { type: "ignore", reason: "Failed Z-Liar quality gate" };
  }

  const multi = analyzeMultiParty(event, config.minEntityConfidence);
  const score = computeScandalScore(event);

  // Gate 2 — Chaos Fusion (≥3 factions).
  if (multi.isChaosCandidate && score >= config.chaosScoreThreshold) {
    let rarityHint: ChaosRarityHint = "epic";
    if (score >= 95) rarityHint = "golden_hand";
    else if (score >= 88) rarityHint = "legendary";
    return {
      type: "chaos_fusion",
      characters: multi.resolvedCharacters.map((c) => c.characterId as string),
      theme: extractChaosTheme(event),
      rarityHint,
    };
  }

  // Gate 3 — Crossover (exactly 2 factions).
  if (multi.isCrossoverCandidate && score >= config.crossoverScoreThreshold) {
    const chars = multi.resolvedCharacters.map((c) => c.characterId as string);
    return { type: "crossover", characters: [chars[0], chars[1]], theme: extractChaosTheme(event) };
  }

  // Gate 4 — Scandal Pack (≥1 resolved).
  if (score >= config.packScoreThreshold && multi.resolvedCharacters.length >= 1) {
    return {
      type: "scandal_pack",
      primaryCharacter: multi.resolvedCharacters[0].characterId as string,
      theme: extractChaosTheme(event),
    };
  }

  // Gate 5 — Live ticker market only.
  if (score >= 30) return { type: "live_ticker_only" };

  return { type: "ignore", reason: "Score too low" };
}

export interface GenerationGuardState {
  lastChaosFusionAt: Date | null;
  dailyChaosCount: number;
  maxChaosPerDay: number;
  minHoursBetweenChaos: number;
}

/** Scarcity guard: daily cap + cooldown between Chaos Fusion generations. */
export function canGenerateChaos(
  guard: GenerationGuardState,
  now: Date = new Date(),
): { allowed: boolean; reason?: string } {
  if (guard.dailyChaosCount >= guard.maxChaosPerDay) {
    return { allowed: false, reason: "Daily Chaos Fusion cap reached" };
  }
  if (guard.lastChaosFusionAt) {
    const hours = (now.getTime() - guard.lastChaosFusionAt.getTime()) / 3_600_000;
    if (hours < guard.minHoursBetweenChaos) {
      return {
        allowed: false,
        reason: `Cooldown active (${(guard.minHoursBetweenChaos - hours).toFixed(1)}h remaining)`,
      };
    }
  }
  return { allowed: true };
}
