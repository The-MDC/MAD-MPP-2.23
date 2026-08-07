/**
 * MAD Gambit — celebrity → faction entity resolver.
 * ------------------------------------------------------------------
 * Deterministic, curated name→faction lexicon. This is the HONEST, in-app
 * version of "entity resolution": a maintained map, NOT a GraphRAG index or an
 * ML NER model (those belong in the separate MAD-Scandal-Corpus Python service,
 * per the GDELT handoff). It lets the Scandal Scraper decision tree run over live
 * GDELT person names without fabricating a heavier pipeline in the webapp.
 *
 * Pure + es5-safe. Extend the map as the character roster grows.
 */
import type { FactionKey } from "@/lib/card-visual-states";

// Names are matched lowercased/trimmed. Keep this curated + brand-safe: an
// unknown name resolves to null (it never becomes a satirical character).
const ENTITY_FACTION: Record<string, FactionKey> = {
  // Disruptors — tech/founder chaos
  "elon musk": "disruptors",
  "mark zuckerberg": "disruptors",
  "sam altman": "disruptors",
  "jeff bezos": "disruptors",
  "sam bankman-fried": "disruptors",
  // Pop Icons — music/screen/influencer
  "taylor swift": "popIcons",
  "kim kardashian": "popIcons",
  "kanye west": "popIcons",
  "ye": "popIcons",
  "rihanna": "popIcons",
  "drake": "popIcons",
  "justin bieber": "popIcons",
  "selena gomez": "popIcons",
  "blake lively": "popIcons",
  "justin baldoni": "popIcons",
  "beyonce": "popIcons",
  // Politicos
  "donald trump": "politicos",
  "joe biden": "politicos",
  "kamala harris": "politicos",
  "ron desantis": "politicos",
  // Athletes
  "lebron james": "athletes",
  "cristiano ronaldo": "athletes",
  "lionel messi": "athletes",
  "conor mcgregor": "athletes",
  "novak djokovic": "athletes",
};

export interface ResolvedEntity {
  characterId: string;
  faction: FactionKey;
  confidence: number; // 0..1 — curated matches are high-confidence
}

/** Deterministic name → { characterId, faction } against the curated lexicon.
 *  Returns null for unknown names (keeps the brand-safety gate tight). */
export function resolveEntity(name: string): ResolvedEntity | null {
  const key = (name ?? "").trim().toLowerCase();
  const faction = ENTITY_FACTION[key];
  if (!faction) return null;
  return { characterId: `char:${key.replace(/\s+/g, "-")}`, faction, confidence: 0.9 };
}

/** Resolve a list of names, dropping unknowns and de-duplicating by characterId. */
export function resolveEntities(names: string[]): ResolvedEntity[] {
  const out: ResolvedEntity[] = [];
  const seen = new Set<string>();
  for (const n of names) {
    const r = resolveEntity(n);
    if (r && !seen.has(r.characterId)) {
      seen.add(r.characterId);
      out.push(r);
    }
  }
  return out;
}

/** Count of characters in the curated roster (for status/diagnostics surfaces). */
export const KNOWN_ENTITY_COUNT = Object.keys(ENTITY_FACTION).length;
