/**
 * MAD Gambit — OCTAVIAN SHARED STATE + PLATFORM ACTIVITY FEED
 * ------------------------------------------------------------------
 * Two things the creature needs that a per-mount ref cannot give it:
 *
 * 1. ONE nervous system across every mount. The corner HUD orb, the /octavian
 *    instrument, the inline /preview mesh and the popped-out overlay were four
 *    independent `useRef` sets, so prodding one left the others calm and the
 *    pop-out started its own idle-to-agitated cycle from scratch. It is meant
 *    to read as a single creature the app is showing you through different
 *    windows — so mood, orbit and zoom live here, module-level, and every
 *    mount reads and writes the same object.
 *
 * 2. A pulse fed by the platform rather than by a timer. `activityFor(i)`
 *    returns a 0..1 excitement per node derived from real client state (the
 *    live VRS streak) composed with the registry's own shape, so a node that
 *    is actually doing something glows harder than one that isn't.
 *
 * Deliberately synchronous and fetch-free: the registry is already a sync
 * import everywhere else, `getVrsStreak()` reads sessionStorage, and the draw
 * loop runs at 60fps — anything async here would either tear or thrash.
 *
 * NOTE ON MUTABILITY: this is intentionally a mutable singleton read inside a
 * requestAnimationFrame draw, NOT React state. Routing it through useState
 * would re-render the tree on every pointer move, which is exactly what the
 * original refs existed to avoid. Subscribers exist only for the rare
 * discrete events (selection) that genuinely need a re-render.
 */
import { NODE_IDS, NODE_REGISTRY, type NodeId } from "@/lib/node-registry";
import { getVrsStreak, VRS_EVENT } from "@/lib/session-vrs";

// --- Mood + orbit, shared across every mount -------------------------

export interface OctavianMood {
  /** Completed pointer gestures, capped. Drives the tier. */
  prods: number;
  /** performance.now() of the last prod; the decay clock anchors here. */
  lastAt: number;
  /** Eased 0..2 position between the three palettes/speeds. */
  tierBlend: number;
  /** Extra yaw kicked in on a prod, decaying — the "flinch away". */
  fleeYaw: number;
}

export interface OctavianOrbit {
  yaw: number;
  /** User drag on top of the idle weave. */
  pitchOffset: number;
  zoom: number;
}

/**
 * The single creature. Module scope on purpose — see NOTE ON MUTABILITY.
 * `lastAt` starts at -Infinity so the first frame reads as "long since calm"
 * rather than "just prodded".
 */
const mood: OctavianMood = { prods: 0, lastAt: -Infinity, tierBlend: 0, fleeYaw: 0 };
const orbit: OctavianOrbit = { yaw: 0, pitchOffset: 0, zoom: 1 };

export function getMood(): OctavianMood {
  return mood;
}
export function getOrbit(): OctavianOrbit {
  return orbit;
}

/** Register a completed gesture. Every mount funnels through here. */
export function prod(now: number, maxProds = 8): void {
  mood.prods = Math.min(mood.prods + 1, maxProds);
  mood.lastAt = now;
  mood.fleeYaw += Math.PI / 3;
}

/** Selection is genuinely shared too — tapping a node on one surface should
 *  light the same node everywhere. Discrete + rare, so this one gets
 *  subscribers and a React re-render. */
let selectedNode: NodeId = NODE_IDS[0];
const selectionSubs = new Set<() => void>();

export function getSelected(): NodeId {
  return selectedNode;
}

export function setSelected(id: NodeId): void {
  if (id === selectedNode) return;
  selectedNode = id;
  selectionSubs.forEach((fn) => fn());
}

export function subscribeSelection(fn: () => void): () => void {
  selectionSubs.add(fn);
  return () => {
    selectionSubs.delete(fn);
  };
}

// --- Platform activity feed ------------------------------------------

/**
 * Stable 32-bit hash of a node id. Used for every per-node constant below
 * (size, phase, drift frequency, dart timing) so the creature looks the same
 * on every render and on every machine. Deriving these from Math.random()
 * would re-roll each mount and, worse, differ between the server and client
 * paint — the exact hydration hazard `lib/market-view.ts` already warns about.
 */
export function nodeSeed(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

/** Per-node seeds, computed once. */
export const NODE_SEEDS: readonly number[] = NODE_IDS.map(nodeSeed);

/**
 * How "busy" each node's own live element is, 0..1 — a static shape read off
 * the registry. A node wired to a counter or a gauge is doing more than one
 * marked `kind: "none"`, and the creature should show that.
 */
const KIND_ENERGY: Record<string, number> = {
  counter: 1.0,
  gauge: 0.9,
  dial: 0.85,
  bars: 0.8,
  streak: 0.95,
  slider: 0.7,
  strip: 0.65,
  bar: 0.6,
  dash: 0.55,
  chips: 0.4,
  capture: 0.5,
  none: 0.15,
};

const BASE_ENERGY: readonly number[] = NODE_IDS.map((id) => {
  const def = NODE_REGISTRY[id];
  const base = KIND_ENERGY[def.live.kind] ?? 0.4;
  // Coming-soon nodes idle lower — anticipation, not activity.
  return def.comingSoon ? base * 0.45 : base;
});

/**
 * Live VRS streak, cached and refreshed on the `mg:vrs` event rather than
 * read from sessionStorage every frame (that would be a sync storage hit at
 * 60fps per mount).
 */
let cachedStreak = 0;
let streakWired = false;

function ensureStreakWired(): void {
  if (streakWired || typeof window === "undefined") return;
  streakWired = true;
  cachedStreak = getVrsStreak();
  window.addEventListener(VRS_EVENT, () => {
    cachedStreak = getVrsStreak();
  });
}

/** 0..1 — how lit the platform is right now, from the live session streak.
 *  34 is the top Fibonacci VRS trigger, so it's the natural ceiling. */
export function platformHeat(): number {
  ensureStreakWired();
  return Math.min(1, cachedStreak / 34);
}

/**
 * Per-node excitement, 0..1. Composes the node's own static energy with the
 * live platform heat, then adds a slow per-node wander so no two nodes breathe
 * in step. `t` is the shared loop clock in ms.
 *
 * The heat term is additive-but-bounded rather than multiplicative: a quiet
 * node should still visibly wake up when the platform is hot, but a busy node
 * shouldn't blow out to solid white.
 */
export function activityFor(i: number, t: number): number {
  const seed = NODE_SEEDS[i] ?? 0.5;
  const base = BASE_ENERGY[i] ?? 0.4;
  const heat = platformHeat();
  // Two incommensurate periods (~7.4s and ~11.9s at these rates) so the sum
  // never repeats on a human timescale — the thing that reads as "alive"
  // rather than "looping".
  const wander =
    0.5 +
    0.30 * Math.sin(t * 0.00085 + seed * Math.PI * 2) +
    0.20 * Math.sin(t * 0.00053 + seed * 7.7);
  const lit = base * (0.55 + 0.45 * wander) + heat * 0.35 * (0.6 + 0.4 * seed);
  return Math.max(0, Math.min(1, lit));
}

/**
 * Firefly displacement for a node, in *unit-sphere* space (the caller scales
 * it). Anchors stay authoritative — this is a small offset around the node's
 * Fibonacci position, never a replacement for it, so the mesh keeps its
 * structure and the edges keep meaning.
 *
 * Two summed sines per axis at incommensurate frequencies give organic drift
 * with no physics step. On top of that, a rare per-node "dart": a brief eased
 * impulse that decays back to the anchor, which is what actually reads as a
 * firefly rather than a floating dot.
 */
export function fireflyOffset(i: number, t: number, amount: number): { dx: number; dy: number; dz: number } {
  if (amount <= 0) return { dx: 0, dy: 0, dz: 0 };
  const seed = NODE_SEEDS[i] ?? 0.5;
  const p = seed * Math.PI * 2;

  const drift = (freqA: number, freqB: number, phase: number) =>
    0.62 * Math.sin(t * freqA + p + phase) + 0.38 * Math.sin(t * freqB + p * 1.7 + phase);

  // Dart: each node has its own long cycle; for a short window near the top of
  // that cycle it accelerates, then eases back. `pulse` is 0 almost always.
  const cycleMs = 5200 + seed * 6800;
  const phase = ((t + seed * 9000) % cycleMs) / cycleMs;
  const inDart = phase > 0.82;
  const dartEase = inDart ? Math.sin(((phase - 0.82) / 0.18) * Math.PI) : 0;
  const dart = dartEase * dartEase * 1.7;

  const a = amount * (1 + dart);
  return {
    dx: drift(0.00061, 0.00097, 0) * a,
    dy: drift(0.00073, 0.00041, 2.1) * a,
    dz: drift(0.00052, 0.00088, 4.3) * a,
  };
}
