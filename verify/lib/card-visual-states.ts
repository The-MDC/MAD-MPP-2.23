/**
 * MAD Gambit — Card brand system + visual states (Brand/Card-States handoff).
 * ------------------------------------------------------------------
 * The single source of truth for the 8 factions, their colors, the Chaos border
 * cycle, and the card visual-state machine (Base → Evolved / Degenerated /
 * Holographic / Chaos Fusion / Crossover). Degeneration is "funny not tragic" and
 * always recoverable — a clown nose creeping in, never a tragedy.
 *
 * Pure, es5-safe, zero-dependency. Consumed by scandal-scraper.ts, chaos-fusion.ts
 * and the card renderer.
 */

export type FactionKey =
  | "politicos"
  | "athletes"
  | "disruptors"
  | "popIcons"
  | "memes"
  | "villains"
  | "classics"
  | "madCouncil";

export const FACTION_KEYS: FactionKey[] = [
  "politicos", "athletes", "disruptors", "popIcons", "memes", "villains", "classics", "madCouncil",
];

/** The 8 faction primaries — also the Chaos Fusion animated border cycle. */
export const CHAOS_BORDER_CYCLE = [
  "#CC0000", // Politicos
  "#0066CC", // Athletes
  "#7B00D4", // Disruptors
  "#f5242a", // Pop Icons
  "#00FF41", // Memes
  "#FF6600", // Villains
  "#8B5E3C", // Classics
  "#D4A017", // MAD Council
] as const;

export interface FactionStyle {
  name: string;
  color: string; // primary hex
  border: string; // translucent glow (color + alpha)
}

export const FACTION_COLORS: Record<FactionKey, FactionStyle> = {
  politicos: { name: "Politicos", color: "#CC0000", border: "#CC000055" },
  athletes: { name: "Athletes", color: "#0066CC", border: "#0066CC55" },
  disruptors: { name: "Disruptors", color: "#7B00D4", border: "#7B00D455" },
  popIcons: { name: "Pop Icons", color: "#f5242a", border: "#f5242a55" },
  memes: { name: "Memes", color: "#00FF41", border: "#00FF4155" },
  villains: { name: "Villains", color: "#FF6600", border: "#FF660055" },
  classics: { name: "Classics", color: "#8B5E3C", border: "#8B5E3C55" },
  madCouncil: { name: "MAD Council", color: "#D4A017", border: "#D4A01755" },
};

export type CardVisualState =
  | "base"
  | "evolved"
  | "degenerated"
  | "holographic"
  | "chaos_fusion"
  | "crossover";

export type RarityTier =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"
  | "golden_hand"
  | "mythic";

/** Art-pipeline prompt fragments per visual state. */
export const STATE_PROMPT_MODIFIERS: Record<CardVisualState, string> = {
  base: "clean satirical caricature, neutral confident pose",
  evolved: "empowered aura, sharper features, ascended gold glow",
  degenerated: "clown-nose creeping in, wilted posture — funny not tragic, fully recoverable",
  holographic: "full holographic gold foil + rainbow caustics",
  chaos_fusion: "multi-character vortex, cycling faction borders, maximum chaos while legible",
  crossover: "two-character face-off, split-tension composition",
};

/** Rarity → extra prompt flourish (mirrors the Chaos Fusion rarity ladder). */
export const RARITY_PROMPT_MODIFIERS: Record<RarityTier, string> = {
  common: "matte finish",
  uncommon: "subtle sheen",
  rare: "soft holographic edge",
  epic: "purple crackling energy, dramatic lighting",
  legendary: "full holographic gold foil + rainbow caustics",
  golden_hand: "double holographic + radiant gold aura pulse",
  mythic: "character elements breaking the card frame, cosmic intensity",
};

/**
 * Visual-state transition on a market/game outcome. Win climbs, loss slides,
 * scandal degenerates, redeem recovers. Degeneration is bounded + recoverable.
 */
export function applyOutcomeVisualState(
  state: CardVisualState,
  outcome: "win" | "loss" | "scandal" | "redeem",
): CardVisualState {
  switch (outcome) {
    case "win":
      return state === "degenerated" ? "base" : state === "base" ? "evolved" : state;
    case "loss":
      return state === "evolved" ? "base" : state === "base" ? "degenerated" : state;
    case "scandal":
      return "degenerated";
    case "redeem":
      return state === "degenerated" ? "base" : state;
    default:
      return state;
  }
}

/** Clown-nose intensity 0..1 from a degeneration-depth counter (caps at 5). */
export function clownNoseIntensity(degenerationDepth: number): number {
  return Math.min(1, Math.max(0, degenerationDepth / 5));
}

/** Build a single-card art prompt from faction + state + rarity. */
export function buildCardPrompt(params: {
  name: string;
  faction: FactionKey;
  satiricalFeature: string;
  state: CardVisualState;
  rarity: RarityTier;
}): string {
  const f = FACTION_COLORS[params.faction];
  return [
    `MADHAT's Gambit ${params.rarity} card.`,
    `${params.name} (${f.name}, defining trait: ${params.satiricalFeature}).`,
    `${STATE_PROMPT_MODIFIERS[params.state]}. ${RARITY_PROMPT_MODIFIERS[params.rarity]}.`,
    `Faction accent ${f.color}. Pixar-quality satirical caricature with MAD Magazine edge.`,
    "Card anatomy: 1024x1448, top 60% art zone, bottom 38% data panel (placeholder only).",
    "Dark space gradient base (#1A0A2E -> #000000). No hardcoded stats. Legible chaos.",
  ].join(" ");
}
