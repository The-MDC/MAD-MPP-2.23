/**
 * MAD Gambit — scandal co-occurrence graph (in-app "GraphRAG" analog).
 * ------------------------------------------------------------------
 * The heavy GraphRAG index (embeddings + LLM entity/relationship extraction)
 * lives in the separate MAD-Scandal-Corpus Python service — it does NOT belong
 * in a Vercel serverless route. This is the honest, serverless-native analog:
 * a deterministic co-occurrence graph over resolved scandal entities. Nodes are
 * characters, edges are "these two showed up in the same scandal", weighted by
 * how often + how hot. The strongest cross-faction edge is the prime Crossover /
 * Chaos-Fusion target — exactly the "who's beefing with whom" signal the pipeline
 * needs, with no Python, no embeddings, no external index.
 *
 * Pure + es5-safe (Map/Set via Array.from, never for-of/spread over them).
 */
import { resolveEntities, type ResolvedEntity } from "@/lib/scandal-entities";
import type { FactionKey } from "@/lib/card-visual-states";

export interface GraphSignal {
  persons: string[];
  scandalVelocity?: number; // 0..3
}

export interface ScandalNode {
  characterId: string;
  faction: FactionKey;
  mentions: number; // # signals it appeared in
  heat: number; // Σ velocity across those signals
}

export interface ScandalEdge {
  a: string; // characterId (lexicographically smaller)
  b: string; // characterId (lexicographically larger)
  weight: number; // # shared signals (co-occurrences)
  heat: number; // max velocity across the shared signals
  crossFaction: boolean;
}

export interface ScandalGraph {
  nodes: ScandalNode[]; // sorted hottest-first
  edges: ScandalEdge[]; // sorted strongest-first
  topRivalry: ScandalEdge | null; // the marquee clash
}

function orderedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

/** Build the co-occurrence graph from scandal signals (people → factions). */
export function buildScandalGraph(signals: GraphSignal[]): ScandalGraph {
  const nodes = new Map<string, ScandalNode>();
  const edges = new Map<string, ScandalEdge>();

  for (const sig of signals) {
    const vel = Math.max(0, Math.min(3, sig.scandalVelocity ?? 0));
    const resolved: ResolvedEntity[] = resolveEntities(sig.persons ?? []);

    for (const r of resolved) {
      const n = nodes.get(r.characterId);
      if (n) {
        n.mentions += 1;
        n.heat += vel;
      } else {
        nodes.set(r.characterId, {
          characterId: r.characterId,
          faction: r.faction,
          mentions: 1,
          heat: vel,
        });
      }
    }

    for (let i = 0; i < resolved.length; i++) {
      for (let j = i + 1; j < resolved.length; j++) {
        const [lo, hi] = orderedPair(resolved[i].characterId, resolved[j].characterId);
        if (lo === hi) continue;
        const key = `${lo}|${hi}`;
        const e = edges.get(key);
        if (e) {
          e.weight += 1;
          e.heat = Math.max(e.heat, vel);
        } else {
          edges.set(key, {
            a: lo,
            b: hi,
            weight: 1,
            heat: vel,
            crossFaction: resolved[i].faction !== resolved[j].faction,
          });
        }
      }
    }
  }

  const nodeList = Array.from(nodes.values()).sort((x, y) => y.heat - x.heat);
  const edgeList = Array.from(edges.values()).sort(
    (x, y) => y.weight - x.weight || y.heat - x.heat,
  );
  return { nodes: nodeList, edges: edgeList, topRivalry: edgeList.length ? edgeList[0] : null };
}
