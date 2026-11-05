/**
 * MAD Gambit — The Paseome as a graph (client-safe, pure).
 * ------------------------------------------------------------------
 * Turns `GET /api/v1/paseome/frontier` into a node-link model the 3D view
 * (components/paseome-graph.tsx) draws. Nothing here touches three.js or the
 * DOM, so the layout, the validation and every figure the view prints are
 * unit-testable.
 *
 * WHAT THE GRAPH IS. A Paseome is a tree, but only its FRONTIER is ever priced
 * (lib/paseome.ts#frontierPrices). So the graph is exactly what the API holds:
 *
 *     The Paseome (hub)  ─┬─  Forward root  ── 3..5 priced branches
 *                         └─  Counterfactual root ── 3..5 priced branches
 *
 * The hub joins the two roots with a structural edge that carries no figure.
 * No depth-2 nodes are drawn: the API reports a two-hop path *price*, not two-hop
 * nodes, and inventing nodes to make the tree look deeper would be fabrication.
 *
 * HONESTY RULES, enforced here rather than in the view:
 *   · a figure the API did not send (or sent non-finite / out of range) is `null`
 *     and prints as an em dash — never 0, never a placeholder;
 *   · `source` is "live" only when the API says so; anything else is "demo", so
 *     an unknown or missing source can never pass for live data;
 *   · a counterfactual branch without irrealis mood is WITHHELD, not drawn. The
 *     route reports the flag precisely so a client can refuse to render one: a
 *     counterfactual that asserts rather than supposes is a claim about a real
 *     party, and the grammar is the only thing making it benign.
 */
import {
  FRONTIER_MAX, FRONTIER_MIN, hasIrrealisMood, knifeEdgeDistance, mciScore, rankByKnifeEdge,
  type PaseomeSide,
} from "@/lib/paseome";
import { closesLabel, prices as marketPrices, type OMMarket } from "@/lib/open-markets";

export const EM_DASH = "—";

export type GraphSource = "demo" | "live";
export type Vec3 = [number, number, number];
export type NodeKind = "hub" | "root" | "branch";

/** The product-facing names for the two sides (Foresight/Hindsight are internal labels). */
export const SIDE_LABEL: Record<PaseomeSide, string> = {
  foresight: "Forward",
  hindsight: "Counterfactual",
};

/* ── 1 · FORMATTING — a missing figure is an em dash, never a zero ───────── */

export function fmtPct(p: number | null | undefined, digits = 1): string {
  return typeof p === "number" && Number.isFinite(p) ? `${(p * 100).toFixed(digits)}%` : EM_DASH;
}

export function fmtFixed(n: number | null | undefined, digits = 2): string {
  return typeof n === "number" && Number.isFinite(n) ? n.toFixed(digits) : EM_DASH;
}

export function fmtCount(n: number | null | undefined): string {
  return typeof n === "number" && Number.isFinite(n) ? Math.round(n).toLocaleString("en-US") : EM_DASH;
}

/**
 * One colour per side, from the active skin: forward = accent, counterfactual =
 * accent2, the hub = gold. (Shape repeats the distinction — the gilded skin's two
 * accents sit close — so colour is never the only cue.)
 */
export function nodeColor(
  node: { kind: NodeKind; side: PaseomeSide | null },
  skin: { gold: string; accent: string; accent2: string },
): string {
  if (node.kind === "hub") return skin.gold;
  return node.side === "hindsight" ? skin.accent2 : skin.accent;
}

/* ── 2 · PARSING — validate the wire, keep only what is real ─────────────── */

export interface BranchView {
  id: string;
  claim: string;
  /** Conditional probability on the frontier, 0..1. */
  price: number | null;
  shares: number | null;
  knifeEdge: number | null;
  pathPriceAtDepth2: number | null;
  mciFitness: number | null;
  mciViolations: number | null;
  irrealis: boolean | null;
}

export interface FrontierSnapshot {
  side: PaseomeSide;
  root: string;
  source: GraphSource;
  /** Σ of the frontier prices as reported by the route. */
  sum: number | null;
  rollsIn: string | null;
  legSlot: string | null;
  settles: string | null;
  untaken: string | null;
  branches: BranchView[];
  /** Branch ids, sharpest knife edge first. */
  knifeEdgeOrder: string[];
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() !== "" ? v : null);
const bool = (v: unknown): boolean | null => (typeof v === "boolean" ? v : null);
const prob = (v: unknown): number | null => {
  const n = num(v);
  return n !== null && n >= 0 && n <= 1 ? n : null;
};

/**
 * Validate one frontier response. Returns null for anything that is not a
 * successful, well-formed frontier with at least one branch — the caller treats
 * that as "no data", which is an empty state, not a zero.
 */
export function parseFrontier(json: unknown): FrontierSnapshot | null {
  if (!isObj(json) || json.success !== true) return null;
  const side = json.side === "foresight" || json.side === "hindsight" ? json.side : null;
  const root = str(json.root);
  const frontier = isObj(json.frontier) ? json.frontier : null;
  if (!side || !root || !frontier || !Array.isArray(frontier.branches)) return null;

  const branches: BranchView[] = [];
  const seen = new Set<string>();
  // Cap on VALID branches (the frontier is 3..5 wide by construction), and bound
  // the scan so a hostile array of junk cannot make this loop long.
  for (const raw of frontier.branches.slice(0, FRONTIER_MAX * 4)) {
    if (branches.length >= FRONTIER_MAX) break;
    if (!isObj(raw)) continue;
    const id = str(raw.id);
    const claim = str(raw.claim);
    if (!id || !claim || seen.has(id)) continue;
    seen.add(id);
    branches.push({
      id,
      claim,
      price: prob(raw.price),
      shares: num(raw.shares),
      knifeEdge: num(raw.knifeEdge),
      pathPriceAtDepth2: prob(raw.pathPriceAtDepth2),
      mciFitness: num(raw.mciFitness),
      mciViolations: num(raw.mciViolations),
      irrealis: bool(raw.irrealis),
    });
  }
  if (branches.length === 0) return null;

  const structure = isObj(json.structure) ? json.structure : {};
  return {
    side,
    root,
    source: json.source === "live" ? "live" : "demo",
    sum: num(frontier.sum),
    rollsIn: str(structure.rollsIn),
    legSlot: str(structure.legSlot),
    settles: str(structure.settles),
    untaken: str(structure.untakenBranches),
    branches,
    knifeEdgeOrder: Array.isArray(json.knifeEdgeOrder)
      ? json.knifeEdgeOrder.filter((x): x is string => typeof x === "string")
      : [],
  };
}

/* ── 3 · THE GRAPH ───────────────────────────────────────────────────── */

export interface NodeFact {
  k: string;
  v: string;
}

export interface GraphNode {
  id: string;
  kind: NodeKind;
  side: PaseomeSide | null;
  /** Short text drawn on the node in 3D. */
  label: string;
  /** The full line — the what-if itself for a branch. */
  title: string;
  kicker: string;
  position: Vec3;
  radius: number;
  price: number | null;
  /** 1 = sharpest knife edge on its side. */
  rank: number | null;
  facts: NodeFact[];
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  /** true = a link in the structure that carries no figure (hub ↔ root). */
  structural: boolean;
  /** 0..1 visual weight. Priced edges use the branch price; unpriced ones a hairline. */
  weight: number;
}

export interface PaseomeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** "live" only when every loaded side said so. */
  source: GraphSource;
  sides: PaseomeSide[];
  /** Counterfactual branches withheld for lacking irrealis mood. */
  withheld: number;
  /** Middle of the drawn nodes — what the camera looks at. A one-sided graph is not centred on the hub. */
  center: Vec3;
  /** Half the size of the drawn nodes' bounding box around `center` — what the camera fits. */
  extent: Vec3;
}

export const ROOT_OFFSET = 3.6;
const CONE = (68 * Math.PI) / 180;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
/** A pricier branch sits nearer its root: reach = BASE − SPAN·p. */
const REACH_BASE = 3.1;
const REACH_SPAN = 0.9;

const HUB_RADIUS = 0.24;
const ROOT_RADIUS = 0.42;

/** Node radius encodes price (area-ish: √p). Unpriced branches get the floor. */
export function branchRadius(price: number | null): number {
  return 0.16 + 0.5 * Math.sqrt(price ?? 0);
}

/**
 * Where branch `index` of `count` sits. Branches fan out of their root inside a
 * cone that opens AWAY from the hub, spread by equal area and rotated by the
 * golden angle so no two share a ray. Deterministic: same input, same graph.
 */
export function branchPosition(side: PaseomeSide, index: number, count: number, price: number | null): Vec3 {
  const sign = side === "foresight" ? 1 : -1;
  const t = (index + 0.5) / Math.max(1, count);
  const polar = Math.acos(1 - t * (1 - Math.cos(CONE)));
  const az = index * GOLDEN_ANGLE;
  const reach = REACH_BASE - REACH_SPAN * (price ?? 0);
  return [
    sign * ROOT_OFFSET + sign * Math.cos(polar) * reach,
    Math.sin(polar) * Math.cos(az) * reach,
    Math.sin(polar) * Math.sin(az) * reach,
  ];
}

/**
 * Build the graph from whichever sides loaded (one is enough). A counterfactual
 * branch that does not carry irrealis mood is withheld and counted.
 */
export function buildPaseomeGraph(snapshots: FrontierSnapshot[]): PaseomeGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const sides: PaseomeSide[] = [];
  let withheld = 0;

  const bySide = new Map<PaseomeSide, FrontierSnapshot>();
  for (const s of snapshots) if (!bySide.has(s.side)) bySide.set(s.side, s);

  for (const side of ["foresight", "hindsight"] as PaseomeSide[]) {
    const snap = bySide.get(side);
    if (!snap) continue;

    const branches = snap.branches.filter((b) => side !== "hindsight" || b.irrealis === true);
    withheld += snap.branches.length - branches.length;
    if (branches.length === 0) continue;
    sides.push(side);

    const rootId = `root:${side}`;
    const sign = side === "foresight" ? 1 : -1;
    nodes.push({
      id: rootId,
      kind: "root",
      side,
      label: SIDE_LABEL[side],
      title: snap.root,
      kicker: `${SIDE_LABEL[side]} frontier`,
      position: [sign * ROOT_OFFSET, 0, 0],
      radius: ROOT_RADIUS,
      price: null,
      rank: null,
      facts: [
        { k: "Branches", v: String(branches.length) },
        { k: "Frontier Σ", v: fmtFixed(snap.sum, 3) },
        { k: "Settles", v: snap.settles ?? EM_DASH },
        { k: "Untaken branches", v: snap.untaken ?? EM_DASH },
        { k: "Rolls in", v: snap.rollsIn ?? EM_DASH },
        { k: "Leg slot", v: snap.legSlot ?? EM_DASH },
      ],
    });
    edges.push({ id: `hub:${rootId}`, from: "hub", to: rootId, structural: true, weight: 0.2 });

    branches.forEach((b, i) => {
      const order = snap.knifeEdgeOrder.indexOf(b.id);
      const rank = order >= 0 ? order + 1 : null;
      const id = `${side}:${b.id}`;
      const facts: NodeFact[] = [
        { k: "Price", v: fmtPct(b.price, 1) },
        { k: "Shares", v: fmtCount(b.shares) },
        { k: "Knife edge |p−0.5|", v: fmtFixed(b.knifeEdge, 3) },
        { k: "Knife-edge rank", v: rank === null ? EM_DASH : `${rank} of ${snap.branches.length}` },
        { k: "Two-hop path price", v: fmtPct(b.pathPriceAtDepth2, 2) },
        { k: "Memetic fitness", v: fmtFixed(b.mciFitness, 2) },
      ];
      if (side === "hindsight") facts.push({ k: "Irrealis mood", v: b.irrealis === true ? "yes" : EM_DASH });
      nodes.push({
        id,
        kind: "branch",
        side,
        label: fmtPct(b.price, 0),
        title: b.claim,
        kicker: `${SIDE_LABEL[side]} · branch ${i + 1}`,
        position: branchPosition(side, i, branches.length, b.price),
        radius: branchRadius(b.price),
        price: b.price,
        rank,
        facts,
      });
      edges.push({ id: `${rootId}:${id}`, from: rootId, to: id, structural: false, weight: b.price ?? 0.1 });
    });
  }

  const live = sides.length > 0 && sides.every((s) => bySide.get(s)?.source === "live");

  if (nodes.length > 0) {
    nodes.unshift({
      id: "hub",
      kind: "hub",
      side: null,
      label: "The Paseome",
      title: "The Paseome: Certain-UnCertainty",
      kicker: "The whole set of paths",
      position: [0, 0, 0],
      radius: HUB_RADIUS,
      price: null,
      rank: null,
      facts: [
        { k: "Frontiers loaded", v: `${sides.length} of 2` },
        { k: "Priced", v: "the frontier only" },
        { k: "Data", v: live ? "live" : "demo" },
      ],
    });
  }

  const lo: Vec3 = [Infinity, Infinity, Infinity];
  const hi: Vec3 = [-Infinity, -Infinity, -Infinity];
  for (const n of nodes) {
    for (let a = 0; a < 3; a++) {
      lo[a] = Math.min(lo[a], n.position[a] - n.radius);
      hi[a] = Math.max(hi[a], n.position[a] + n.radius);
    }
  }
  const center: Vec3 = nodes.length ? [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2] : [0, 0, 0];
  const extent: Vec3 = nodes.length ? [(hi[0] - lo[0]) / 2, (hi[1] - lo[1]) / 2, (hi[2] - lo[2]) / 2] : [0, 0, 0];

  return { nodes, edges, source: live ? "live" : "demo", sides, withheld, center, extent };
}

/* ── 3b · A MARKET AS A FRONTIER ─────────────────────────────────────── */

/**
 * One Paseome tree from the demo floor, shaped like a frontier response so the same
 * graph draws it. Every figure is computed from the market's own book (`prices` is
 * the DL-LMSR the desk quotes with) — nothing is seeded here. It is `source: "demo"`
 * because the floor's books live in the browser, not on the server.
 *
 * Returns null for anything that is not a Paseome tree: a binary prediction, a
 * perpetual, or a frontier outside the founder's 3..5.
 */
export function snapshotFromMarket(m: OMMarket): FrontierSnapshot | null {
  if (m.cls !== "conviction" || m.perp || !m.side) return null;
  if (m.outcomes.length < FRONTIER_MIN || m.outcomes.length > FRONTIER_MAX) return null;

  const side: PaseomeSide = m.side === "forward" ? "foresight" : "hindsight";
  const p = marketPrices(m.outcomes, m.b);
  const sum = p.reduce((a, v) => a + v, 0);
  const priced = m.outcomes.map((o, i) => ({ o, price: p[i] }));
  const order = rankByKnifeEdge(priced).map((x) => x.o.id);

  return {
    side,
    root: m.title,
    source: "demo",
    sum: Number.isFinite(sum) ? sum : null,
    rollsIn: m.closesAt === null ? null : closesLabel(m),
    legSlot: null,
    settles: m.resolution,
    untaken: side === "foresight" ? "refunded" : "carried",
    branches: priced.map(({ o, price }) => {
      const mci = mciScore(o.label);
      return {
        id: o.id,
        claim: o.label,
        price: Number.isFinite(price) && price >= 0 && price <= 1 ? price : null,
        shares: Number.isFinite(o.q) ? o.q : null,
        knifeEdge: Number.isFinite(price) ? knifeEdgeDistance(price) : null,
        pathPriceAtDepth2: Number.isFinite(price) ? price * price : null,
        mciFitness: mci.fitness,
        mciViolations: mci.violations,
        irrealis: hasIrrealisMood(o.label),
      };
    }),
    knifeEdgeOrder: order,
  };
}

/* ── 4 · CAMERA FIT ──────────────────────────────────────────────────── */

/**
 * Distance at which a front-on camera sees the whole graph: wide enough for the
 * horizontal extent at this aspect, tall enough for the vertical one, and pushed
 * back by the depth extent so the nearest nodes are not clipped.
 */
export function fitDistance(extent: Vec3, fovDeg: number, aspect: number): number {
  const vHalf = (Math.max(1, Math.min(170, fovDeg)) * Math.PI) / 360;
  const tanV = Math.tan(vHalf);
  const tanH = tanV * (Number.isFinite(aspect) ? Math.max(0.2, aspect) : 1);
  const need = Math.max(extent[1] / tanV, extent[0] / tanH);
  return need * 1.12 + extent[2];
}
