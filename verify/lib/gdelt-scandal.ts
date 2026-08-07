/**
 * MAD Gambit — GDELT signal → Scandal-Scraper decision bridge.
 * ------------------------------------------------------------------
 * Turns a `gdelt_signals` row (headline + whitelisted person names + themes +
 * velocity) into a scored `ScandalEvent`, resolves its people to factions, and
 * runs the 5-gate decision tree. Chaos-fusion decisions get full CF metadata.
 *
 * This is the wiring that makes scandal-scraper.ts + chaos-fusion.ts LIVE rather
 * than lib-only. Pure + es5-safe (no Set/Map iteration).
 */
import {
  decideTrigger,
  computeScandalScore,
  analyzeMultiParty,
  type ScandalEvent,
  type ScandalEntity,
  type TriggerDecision,
} from "@/lib/scandal-scraper";
import { resolveEntities } from "@/lib/scandal-entities";
import {
  buildChaosFusionMetadata,
  type ChaosCharacter,
  type ChaosFusionMetadata,
} from "@/lib/chaos-fusion";

export interface SignalRow {
  headline: string;
  url?: string | null;
  persons?: string[]; // whitelisted celebrity names
  themes?: string[];
  scandalVelocity?: number; // 0..~3 (lexicon-intensity proxy from gdelt-ingest)
  perpProbability?: number; // 0..1 (precomputed)
}

/** viralityScore 0..100 from the 0..3 velocity proxy. */
function viralityFromVelocity(vel?: number): number {
  const v = Math.max(0, Math.min(3, vel ?? 0));
  return Math.round((v / 3) * 100);
}

/**
 * Z-Liar quality proxy (0..1) — NOT the proprietary internals. Person
 * corroboration + a little velocity lift real celebrity signals over the
 * brand-safety floor while quiet/noise signals stay below it.
 */
function zLiarProxy(row: SignalRow): number {
  const persons = row.persons?.length ?? 0;
  const vel = Math.max(0, Math.min(3, row.scandalVelocity ?? 0));
  return Math.max(0, Math.min(0.95, 0.5 + Math.min(0.3, persons * 0.12) + vel * 0.05));
}

/** Build a scored ScandalEvent from a signal row (people resolved to factions). */
export function rowToScandalEvent(row: SignalRow, idx = 0): ScandalEvent {
  const names = row.persons ?? [];
  const resolved = resolveEntities(names);
  const entities: ScandalEntity[] = resolved.map((r, i) => ({
    rawName: names[i] ?? r.characterId,
    normalizedName: r.characterId,
    characterId: r.characterId,
    faction: r.faction,
    confidence: r.confidence,
    role: i === 0 ? "primary" : "secondary",
  }));
  return {
    id: row.url ? `sig:${row.url}` : `sig:${idx}:${row.headline.slice(0, 24)}`,
    source: "gdelt",
    headline: row.headline,
    publishedAt: new Date(),
    entities,
    themes: row.themes ?? [],
    viralityScore: viralityFromVelocity(row.scandalVelocity),
    zLiarScore: zLiarProxy(row),
  };
}

export interface ScandalDecision {
  headline: string;
  url: string | null;
  score: number;
  distinctFactions: number;
  decision: TriggerDecision;
  chaos?: ChaosFusionMetadata;
}

/** Run the decision tree across signal rows; attach CF metadata to chaos hits. */
export function decideForRows(rows: SignalRow[]): ScandalDecision[] {
  return rows.map((row, idx) => {
    const event = rowToScandalEvent(row, idx);
    const decision = decideTrigger(event);
    const multi = analyzeMultiParty(event);
    const out: ScandalDecision = {
      headline: row.headline,
      url: row.url ?? null,
      score: Math.round(computeScandalScore(event) * 100) / 100,
      distinctFactions: multi.distinctFactions.length,
      decision,
    };
    if (decision.type === "chaos_fusion") {
      const roster: ChaosCharacter[] = event.entities.map((e) => ({
        id: e.characterId as string,
        name: e.rawName,
        faction: e.faction as ChaosCharacter["faction"],
        satiricalFeature: "signature exaggeration",
        recentScandalScore: out.score,
      }));
      out.chaos = buildChaosFusionMetadata(decision, event.id, roster);
    }
    return out;
  });
}

export type DecisionKind = TriggerDecision["type"];

/** Count decisions by kind for a summary chip row. */
export function summarizeDecisions(decisions: ScandalDecision[]): Record<DecisionKind, number> {
  const c: Record<DecisionKind, number> = {
    chaos_fusion: 0,
    crossover: 0,
    scandal_pack: 0,
    live_ticker_only: 0,
    ignore: 0,
  };
  for (const d of decisions) c[d.decision.type] += 1;
  return c;
}
