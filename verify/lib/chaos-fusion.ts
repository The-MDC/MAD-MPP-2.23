/**
 * MAD Gambit — Chaos Fusion generator (Scandal-Scraper/Chaos-Fusion handoff §3).
 * ------------------------------------------------------------------
 * Turns a `chaos_fusion` TriggerDecision into a mintable card: pick ≥3 characters
 * from DISTINCT factions, lay them out triangular (apex = highest scandal), build
 * the art prompt, and assemble the CF-namespaced metadata. Pure + es5-safe.
 */
import {
  FACTION_COLORS,
  CHAOS_BORDER_CYCLE,
  RARITY_PROMPT_MODIFIERS,
  type FactionKey,
} from "@/lib/card-visual-states";
import type { ChaosRarityHint, TriggerDecision } from "@/lib/scandal-scraper";

export { CHAOS_BORDER_CYCLE };

export type ChaosComposition = "triangular" | "radial" | "layered";

export interface ChaosCharacter {
  id: string;
  name: string;
  faction: FactionKey;
  satiricalFeature: string;
  recentScandalScore?: number; // 0..100, drives apex + selection
}

export interface ChaosFusionMetadata {
  type: "chaos_fusion";
  characters: string[]; // ids, apex first
  factions: FactionKey[];
  theme: string;
  rarity: ChaosRarityHint;
  composition: ChaosComposition;
  generationSeed: string;
  trigger: "event" | "saga" | "achievement" | "admin";
  sourceEventId: string;
  serial?: string; // CF-xxxx namespace, outside the 001–152 range
}

/** Hard invariants from the handoff (§3.1). */
export const CHAOS_INVARIANTS = { minCharacters: 3, maxCharacters: 5 } as const;

/** Composition for a character count (triangular for 3, radial/layered beyond). */
export function compositionFor(count: number): ChaosComposition {
  if (count <= 3) return "triangular";
  if (count === 4) return "radial";
  return "layered";
}

/**
 * Select `count` characters from DISTINCT factions, highest recent-scandal first
 * (apex leads). Throws if there aren't enough distinct factions. es5-safe.
 */
export function selectChaosCharacters(available: ChaosCharacter[], count = 3): ChaosCharacter[] {
  const n = Math.min(CHAOS_INVARIANTS.maxCharacters, Math.max(CHAOS_INVARIANTS.minCharacters, count));
  const byFaction = new Map<FactionKey, ChaosCharacter[]>();
  for (const c of available) {
    const arr = byFaction.get(c.faction) ?? [];
    arr.push(c);
    byFaction.set(c.faction, arr);
  }
  const factions = Array.from(byFaction.keys());
  if (factions.length < n) {
    throw new Error(`Insufficient factions for Chaos Fusion: need ${n}, have ${factions.length}`);
  }
  // Best character per faction, then the top `n` factions by that character's heat.
  const champions = factions.map((f) => {
    const arr = (byFaction.get(f) ?? []).slice().sort(
      (a, b) => (b.recentScandalScore ?? 0) - (a.recentScandalScore ?? 0),
    );
    return arr[0];
  });
  champions.sort((a, b) => (b.recentScandalScore ?? 0) - (a.recentScandalScore ?? 0));
  return champions.slice(0, n); // index 0 = apex
}

/** Build the Chaos Fusion art prompt (handoff §3.4). */
export function buildChaosFusionPrompt(
  characters: { name: string; faction: FactionKey; satiricalFeature: string }[],
  theme: string,
  rarity: ChaosRarityHint,
): string {
  const charDescs = characters
    .map((c) => `${c.name} (${FACTION_COLORS[c.faction].name}, defining trait: ${c.satiricalFeature})`)
    .join(", ");
  const primaries = characters.map((c) => FACTION_COLORS[c.faction].color).join(", ");
  return [
    "MADHAT's Gambit Chaos Fusion NFT card.",
    `Characters fused: ${charDescs}.`,
    "Composition: triangular (apex = highest scandal character, two at base).",
    `Background: swirling multi-faction color vortex using exact faction primaries (${primaries}).`,
    "Border: cycling through all 8 faction colors, animated-ready.",
    "Art style: Pixar-quality satirical caricature with MAD Magazine edge.",
    "Each character keeps its one exaggerated satirical feature.",
    `${RARITY_PROMPT_MODIFIERS[rarity]}.`,
    "Card anatomy: 1024x1448, top 60% art zone, bottom 38% data panel (placeholder only).",
    `Name plate: "CHAOS — ${theme}".`,
    "High contrast, cinematic lighting, dark space gradient base (#1A0A2E -> #000000).",
    "No hardcoded stats. Maximum visual chaos while remaining legible.",
  ].join("\n");
}

let cfCounter = 0;
/** CF-namespaced serial (outside the 001–152 tiling). */
export function nextChaosSerial(prefix = "CF"): string {
  cfCounter += 1;
  const n = String(cfCounter).padStart(4, "0");
  return `${prefix}-${n}`;
}

/**
 * Assemble full metadata for a chaos_fusion decision. `roster` resolves the
 * decision's character ids to full ChaosCharacters (apex ordering preserved).
 */
export function buildChaosFusionMetadata(
  decision: Extract<TriggerDecision, { type: "chaos_fusion" }>,
  sourceEventId: string,
  roster: ChaosCharacter[],
  trigger: ChaosFusionMetadata["trigger"] = "event",
): ChaosFusionMetadata {
  const byId = new Map<string, ChaosCharacter>();
  for (const c of roster) byId.set(c.id, c);
  const chars = decision.characters
    .map((id) => byId.get(id))
    .filter((c): c is ChaosCharacter => !!c);
  // Apex = highest recent scandal.
  chars.sort((a, b) => (b.recentScandalScore ?? 0) - (a.recentScandalScore ?? 0));

  return {
    type: "chaos_fusion",
    characters: chars.map((c) => c.id),
    factions: chars.map((c) => c.faction),
    theme: decision.theme,
    rarity: decision.rarityHint,
    composition: compositionFor(chars.length),
    generationSeed: `${sourceEventId}:${decision.characters.join("+")}`,
    trigger,
    sourceEventId,
    serial: nextChaosSerial(),
  };
}
