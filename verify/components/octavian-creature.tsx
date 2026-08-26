"use client";

/**
 * MAD Gambit — OCTAVIAN CREATURE.
 * ------------------------------------------------------------------
 * The single shared engine behind every Octavian mesh visual in the app —
 * previously two independent implementations (the corner HUD orb that lived
 * in ov-conviction-state-node.tsx, and the dedicated /octavian page mesh in
 * the now-deleted octavian-mesh.tsx) that had already started drifting
 * apart: one had the creature-mood system, the other had two-axis orbit and
 * click-to-select. One engine now, two presentations:
 *
 *   variant="compact" — small ambient visual, no info panel. Click-to-select
 *                        is disabled (poking it still feeds the mood system
 *                        — it just doesn't try to hit-test a node at HUD
 *                        scale, where a "node" is a handful of pixels).
 *                        Used in the workbench corner HUD.
 *   variant="full"     — the full instrument: two-axis drag-to-orbit,
 *                        click-to-select a node, the info aside panel.
 *                        Used on /octavian and inline on /preview.
 *
 * Both variants carry the full creature-mood system and both can be
 * double-clicked to pop out into a near-fullscreen overlay — always
 * rendered as the "full" experience once popped, since at that size the
 * info panel is worth having regardless of which variant triggered it.
 *
 * ONE CREATURE, MANY WINDOWS. Mood, orbit, zoom and selection all live in
 * lib/octavian-state.ts at module scope, so every mount — corner HUD, the
 * /octavian instrument, the inline /preview mesh, the popped-out overlay —
 * is the same animal seen through a different window. Prod it in the corner
 * and the popped-out view is already annoyed. (This replaces four independent
 * ref-sets that drifted apart; the pop-out in particular used to restart its
 * idle-to-agitated cycle from scratch.)
 *
 * THE NODES ARE FIREFLIES, NOT DOTS. Each node is a small star — a bright
 * core, a bloom, and diffraction spikes whose size/colour/phase come from a
 * stable hash of the node id (never Math.random(): that would re-roll per
 * mount and differ between server and client paint). They drift around their
 * Fibonacci anchor on summed incommensurate sines and occasionally dart, and
 * they brighten with `activityFor()` — real platform state, via the live VRS
 * streak — so the mesh pulses with what the platform is actually doing.
 * Anchors stay authoritative, so the structure and its edges never deform.
 *
 * Reduced motion pins every node to its anchor at steady brightness and stops
 * the weave — consistent with the ~20 other call sites in this codebase.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";
import { NODE_REGISTRY, NODE_IDS } from "@/lib/node-registry";
import { fitCanvas, fibonacciSphere, runInstrumentLoop, type P3 } from "@/lib/instrument-chrome";
import {
  getMood,
  getOrbit,
  prod,
  getSelected,
  setSelected as setSharedSelection,
  subscribeSelection,
  activityFor,
  fireflyOffset,
  NODE_SEEDS,
} from "@/lib/octavian-state";

const TAU = Math.PI * 2;
const EDGE_STEPS = [1, 5, 9] as const;
// Total pointer movement (px) below which a completed gesture reads as a
// tap (select the node under it) rather than a drag (orbit the mesh).
const TAP_MOVE_THRESHOLD = 6;

// --- Mood system -----------------------------------------------------
// Interaction (drag/poke/pull/push — any completed pointer gesture on the
// mesh) increments a "prods" counter. Tier 0->1 at 2 prods, 1->2 at 4
// prods, matching the founder's spec ("after the 2nd or 3rd", "after the
// 4th or fifth"). tierBlend eases toward the target tier each frame rather
// than snapping, so colour/speed/pitch all crossfade instead of cutting.
const ORB_SPIN_RATE = 0.0009; // idle weave rate — "spin slowly"
const ORB_PITCH_BASE = -0.24;
const ORB_PITCH_SWING = 0.14;
const ORB_PITCH_RATE = 0.00028; // full sway period ~22s
const ORB_BASELINE_R = 28.8; // every stroke/dot size below is tuned against this radius, then scaled
const SPIN_TIERS: readonly [number, number, number] = [ORB_SPIN_RATE, ORB_SPIN_RATE * 2.4, ORB_SPIN_RATE * 4.2];
const DECAY_GRACE_MS = 9000; // stays at its current mood this long after the last prod
const DECAY_STEP_MS = 9000; // then sheds one prod's worth of heat every this-many-ms, paced by re-anchoring lastAt
const ZOOM_MIN = 1 / 6; // "zoomed out x6"
const ZOOM_MAX = 4; // "zoomed in x4"

// Real cephalopod skin layers pigment-filled chromatophores (yellow/orange/
// red) over structurally-reflective iridophores (blue/green/violet); calm
// reads cool/iridescent because the pigment sacs are contracted, agitation
// expands them over the reflective layer beneath. Same layering here: idle
// leans structural-cool, tier 2 is pigment-dominant.
const TIER_PALETTES: readonly string[][] = [
  ["#E8B84B", "#2DD4A7", "#22D3EE", "#3B82F6", "#7C6CF0"], // idle — topaz, emerald, cyan, blue, blue-purple
  ["#F5D033", "#4ADE80", "#22D3EE", "#FACC15", "#34D399"], // 2nd-3rd prod — yellow, green, blue
  ["#FBBF24", "#FB923C", "#F97316", "#EF4444", "#FCD34D"], // 4th-5th prod — yellow, orange, a little red
];

function tierValue(tiers: readonly [number, number, number], blend: number): number {
  const clamped = Math.max(0, Math.min(2, blend));
  const lo = Math.floor(clamped);
  const hi = Math.min(2, lo + 1);
  return tiers[lo] + (tiers[hi] - tiers[lo]) * (clamped - lo);
}

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function creatureColor(nodeIndex: number, tierBlend: number): string {
  const clamped = Math.max(0, Math.min(2, tierBlend));
  const lo = Math.floor(clamped);
  const hi = Math.min(2, lo + 1);
  const frac = clamped - lo;
  const a = hexToRgb(TIER_PALETTES[lo][nodeIndex % TIER_PALETTES[lo].length]);
  const b = hexToRgb(TIER_PALETTES[hi][nodeIndex % TIER_PALETTES[hi].length]);
  const r = Math.round(a.r + (b.r - a.r) * frac);
  const g = Math.round(a.g + (b.g - a.g) * frac);
  const bl = Math.round(a.b + (b.b - a.b) * frac);
  return `rgb(${r}, ${g}, ${bl})`;
}

/**
 * One firefly. A star, not a disc: a bloom, a bright core, and four
 * diffraction spikes scaled to the node's own seed so the swarm has visible
 * variety instead of twenty identical dots. `energy` (0..1) drives brightness
 * and spike reach; `still` drops the spikes and flattens the bloom for
 * reduced-motion, where a spiky twinkling star reads as animation even when
 * nothing is technically moving.
 */
function drawFirefly(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  /** `rgb(r, g, b)` as produced by creatureColor. */
  color: string,
  energy: number,
  seed: number,
  still: boolean,
  /** Depth fade for this node; every alpha below is multiplied by it. */
  depth: number,
): void {
  const bloomR = r * (1.8 + seed * 1.0) * (0.7 + 0.5 * energy);

  // Bloom — the soft body of light. A gradient rather than a shadowBlur disc:
  // blur cost scales badly at 20 nodes x 60fps.
  //
  // The outer stop must be THIS COLOUR at zero alpha, not the keyword
  // `transparent`. `transparent` is rgba(0,0,0,0), so canvas interpolates the
  // bloom toward black and every light picks up a muddy dark fringe.
  const fade = color.replace("rgb(", "rgba(").replace(")", ", 0)");
  const bloom = ctx.createRadialGradient(x, y, 0, x, y, Math.max(0.01, bloomR));
  bloom.addColorStop(0, color);
  bloom.addColorStop(0.28, color);
  bloom.addColorStop(1, fade);
  ctx.globalAlpha = (0.16 + 0.30 * energy) * depth;
  ctx.fillStyle = bloom;
  ctx.beginPath();
  ctx.arc(x, y, bloomR, 0, TAU);
  ctx.fill();

  if (!still) {
    // Diffraction spikes — the "star" read. Four arms, rotated per seed so
    // they don't all point the same way.
    const reach = r * (1.5 + seed * 1.6) * (0.5 + 0.9 * energy);
    const rot = seed * Math.PI;
    ctx.globalAlpha = (0.30 + 0.45 * energy) * depth;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(0.35, r * 0.30);
    ctx.beginPath();
    for (let k = 0; k < 4; k++) {
      const a = rot + (k * Math.PI) / 2;
      const len = k % 2 === 0 ? reach : reach * 0.55; // long/short alternating
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    }
    ctx.stroke();
  }

  // Core — small and bright, so it reads hot against its own bloom.
  ctx.globalAlpha = Math.min(1, 0.55 + 0.45 * energy) * depth;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.4, r * (0.62 + 0.28 * energy)), 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
}

/**
 * The dismiss ×, in the panel's top-right.
 *
 * Universal by construction: it is rendered by OctavianCanvasPanel itself, so
 * every presentation of the creature carries it — the corner HUD, the inline
 * /preview mesh, the /octavian instrument. The one place it is deliberately
 * absent is inside the pop-out, which already owns a × of its own; two stacked
 * close buttons in the same corner is a worse answer than one.
 *
 * Positioned against the CANVAS box rather than the grid, so inside the phone
 * frame it lands on the creature's own top-right corner and not somewhere off
 * beside the info panel.
 */
function DismissButton({ onDismiss, gold }: { onDismiss: () => void; gold: string }) {
  return (
    <button
      type="button"
      aria-label="Hide Octavian"
      onClick={(e) => { e.stopPropagation(); onDismiss(); }}
      // The canvas beneath swallows pointer gestures to orbit the mesh; without
      // stopping propagation here, closing the panel would also prod the
      // creature on the way out.
      onPointerDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      style={{
        position: "absolute", top: 4, right: 4, zIndex: 3,
        width: 20, height: 20, borderRadius: 999,
        display: "flex", alignItems: "center", justifyContent: "center",
        border: `1px solid ${gold}55`, background: "rgba(0,0,0,0.5)",
        color: gold, fontSize: 11, lineHeight: 1, cursor: "pointer", padding: 0,
        fontFamily: INSTRUMENT_FONT,
      }}
    >
      ×
    </button>
  );
}

function OctavianCanvasPanel({
  variant,
  onPopOut,
  onDismiss,
}: {
  variant: "compact" | "full";
  onPopOut?: () => void;
  /** Omitted inside the pop-out, which has its own close control. */
  onDismiss?: () => void;
}) {
  const { skin } = useSkin();
  const cvRef = useRef<HTMLCanvasElement | null>(null);
  const full = variant === "full";

  // Selection is shared across mounts, so it comes from the store rather than
  // local state — tap a node here, it lights up on every other surface too.
  const selected = useSyncExternalStore(subscribeSelection, getSelected, getSelected);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  // Reduced motion: pin the swarm. Tracked live so toggling the OS setting
  // takes effect without a reload, matching carousel.tsx / live-ticker.tsx.
  const [reduce, setReduce] = useState(false);
  const reduceRef = useRef(false);
  reduceRef.current = reduce;
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduce(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const base = useMemo(() => fibonacciSphere(NODE_IDS.length), []);
  const edges = useMemo(() => {
    const e: [number, number, number][] = [];
    base.forEach((_, i) =>
      EDGE_STEPS.forEach((d) => e.push([i, (i + d) % base.length, ((i * 7 + d * 13) % 100) / 100])),
    );
    return e;
  }, [base]);

  const drag = useRef({ active: false, x: 0, y: 0, moved: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef<number | null>(null);
  const hit = useRef<{ i: number; x: number; y: number; r: number }[]>([]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture(e.pointerId);
    if (pointers.current.size === 1) {
      drag.current = { active: true, x: e.clientX, y: e.clientY, moved: 0 };
    } else if (pointers.current.size === 2) {
      drag.current.active = false;
      const pts = Array.from(pointers.current.values());
      pinchStart.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    }
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const ob = getOrbit();

    if (pointers.current.size === 2 && pinchStart.current) {
      const pts = Array.from(pointers.current.values());
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      ob.zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, ob.zoom * (d / pinchStart.current)));
      pinchStart.current = d;
      return;
    }

    const d = drag.current;
    if (!d.active) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    ob.yaw += dx * 0.004;
    ob.pitchOffset = Math.max(-1.2, Math.min(1.2, ob.pitchOffset + dy * 0.004));
    d.moved += Math.abs(dx) + Math.abs(dy);
    d.x = e.clientX;
    d.y = e.clientY;
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;

    if (drag.current.active) {
      drag.current.active = false;

      if (full && drag.current.moved < TAP_MOVE_THRESHOLD) {
        const r = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        let best = -1;
        let bd = Infinity;
        hit.current.forEach((n) => {
          const dd = Math.hypot(n.x - x, n.y - y);
          if (dd < n.r && dd < bd) { bd = dd; best = n.i; }
        });
        if (best >= 0) setSharedSelection(NODE_IDS[best]);
      }

      // Any completed drag/poke counts as a prod — "pulled / pushed / poked
      // / played with" is one bucket, not four different gestures to detect.
      // Goes to the shared creature, so poking any window annoys all of them.
      prod(performance.now());
    }
  }, [full]);

  const onPointerCancel = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    pointers.current.delete(e.pointerId);
    drag.current.active = false;
    pinchStart.current = null;
  }, []);

  useEffect(() => {
    const cv = cvRef.current;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const ob = getOrbit();
      ob.zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, ob.zoom * (e.deltaY > 0 ? 0.92 : 1.08)));
    };
    // Native + { passive: false } on purpose: React's synthetic onWheel is
    // often bound passive, which silently no-ops preventDefault and lets
    // the page scroll instead of zooming the mesh.
    cv?.addEventListener("wheel", handleWheel, { passive: false });

    const draw = (cv: HTMLCanvasElement, t: number) => {
      const s = fitCanvas(cv);
      if (!s) return;
      const { ctx, w, h } = s;
      const now = performance.now();
      const ir = getMood();
      const ob = getOrbit();
      const still = reduceRef.current;

      // Idle decay: once DECAY_GRACE_MS has passed since the last prod, shed
      // one prod's worth of heat every DECAY_STEP_MS, re-anchoring lastAt so
      // the next step is paced from here rather than recomputing a growing
      // "steps owed" figure. Lets it settle back to calm on its own.
      const idleMs = now - ir.lastAt;
      if (ir.prods > 0 && idleMs > DECAY_GRACE_MS + DECAY_STEP_MS) {
        ir.prods -= 1;
        ir.lastAt += DECAY_STEP_MS;
      }

      const targetTier = ir.prods >= 4 ? 2 : ir.prods >= 2 ? 1 : 0;
      ir.tierBlend += (targetTier - ir.tierBlend) * 0.02;
      ir.fleeYaw *= 0.965;

      // Reduced motion freezes the weave and the flinch, but drag still works
      // — the user's own input is not "motion" in the accessibility sense.
      if (!still) ob.yaw += tierValue(SPIN_TIERS, ir.tierBlend);
      const effectiveYaw = ob.yaw + (still ? 0 : ir.fleeYaw);
      const pitch =
        ORB_PITCH_BASE +
        (still ? 0 : ORB_PITCH_SWING * Math.sin(t * ORB_PITCH_RATE)) -
        0.32 * (ir.tierBlend / 2) + // agitated states tip away from face-on — "turning away"
        ob.pitchOffset;

      // `project()` below puts the sphere SILHOUETTE at exactly R from centre
      // (|x1|=1 forces z1=y=0, so k=1/2.4 and |x-w/2| = R*2.4*(1/2.4) = R).
      // The old `0.42` budgeted for that silhouette and nothing else -- but every
      // node also bleeds OUTWARD past it, and that bleed is the dominant term:
      //
      //   node radius r  = 3.1 * sizeVar(<=1.40) * scale * (p.k*2.3 <= 1.243)
      //                  = ~0.187 R          (scale = R/ORB_BASELINE_R)
      //   spike reach    = r * (<=3.1) * (<=1.4)  = ~0.81 R   beyond the node
      //   firefly drift  = ~0.09 R                            beyond the node
      //
      // A node sitting on the silhouette with a spike pointing radially outward
      // therefore landed at ~1.9R, against a half-box of 0.5*min(w,h) -- an
      // envelope ~152% of the container, so the long spike arms were clipped at
      // the canvas edge. Because bloom and reach are proportional to r, r to
      // scale, and scale to R, that ratio is SIZE-INVARIANT: it clipped
      // identically in the 280px corner HUD and on the full /octavian canvas,
      // which is why it never read as "just a small-screen problem".
      //
      // Derived rather than hand-picked so that re-tuning the spike constants
      // cannot silently reintroduce the clipping -- change MAX_NODE_BLEED and
      // the fit follows.
      const MAX_NODE_BLEED = 0.91; // spike reach (~0.81R) + firefly drift (~0.09R)
      const ORB_FIT = 0.5 / (1 + MAX_NODE_BLEED); // ~0.262 of min(w,h)

      const R = Math.min(w, h) * ORB_FIT * ob.zoom * (1 - 0.05 * ir.tierBlend);
      const scale = R / ORB_BASELINE_R;
      const cy = Math.cos(pitch);
      const sy = Math.sin(pitch);

      const project = (p: P3) => {
        const x1 = p.x * Math.cos(effectiveYaw) - p.z * Math.sin(effectiveYaw);
        const z1 = p.x * Math.sin(effectiveYaw) + p.z * Math.cos(effectiveYaw);
        const y2 = p.y * cy - z1 * sy;
        const z2 = p.y * sy + z1 * cy;
        const k = 1 / (2.4 + z2 * 0.55);
        return { x: w / 2 + x1 * R * 2.4 * k, y: h / 2 + y2 * R * 2.4 * k, k, z: z2 };
      };

      // Firefly displacement is applied BEFORE projection, in unit-sphere
      // space, so a node that drifts toward the viewer also grows and its
      // edges follow it. Amplitude is small (anchors stay authoritative) and
      // rises with agitation — an annoyed creature's lights jitter more.
      const swarm = still ? 0 : 0.035 + 0.03 * (ir.tierBlend / 2);
      const pts = base.map((p, i) => {
        const o = fireflyOffset(i, t, swarm);
        return project({ x: p.x + o.dx, y: p.y + o.dy, z: p.z + o.dz });
      });
      if (full) hit.current = pts.map((p, i) => ({ i, x: p.x, y: p.y, r: Math.max(6, 13 * p.k) }));

      // Ambient halo first — sells the sphere as a glowing instrument rather
      // than a loose scatter of dots. Gold throughout, regardless of mood
      // tier — the "dazzling gold low glow aura" is the one constant across
      // the calm/agitated/angry range.
      const haloPulse = 0.85 + 0.15 * Math.sin(t * 0.0009);
      const halo = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, R * 1.9);
      halo.addColorStop(0, `${skin.gold}2e`);
      halo.addColorStop(0.5, `${skin.gold}14`);
      halo.addColorStop(1, "transparent");
      ctx.globalAlpha = haloPulse;
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;

      edges
        .map((e) => ({ e, z: (pts[e[0]].z + pts[e[1]].z) / 2 }))
        .sort((a, b) => b.z - a.z)
        .forEach(({ e }) => {
          const [a, b, seed] = e;
          const pa = pts[a];
          const pb = pts[b];
          const depth = Math.max(0.08, Math.min(1, (pa.k + pb.k) * 1.1));
          ctx.strokeStyle = skin.accent;
          ctx.globalAlpha = 0.16 * depth;
          ctx.lineWidth = 0.9 * scale;
          ctx.shadowBlur = 3 * scale;
          ctx.shadowColor = skin.accent;
          ctx.beginPath();
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(pb.x, pb.y);
          ctx.stroke();
          ctx.shadowBlur = 0;

          const u = (((t * 0.00016 + seed) % 1) + 1) % 1;
          const px = pa.x + (pb.x - pa.x) * u;
          const py = pa.y + (pb.y - pa.y) * u;
          ctx.globalAlpha = 0.8 * depth;
          ctx.fillStyle = skin.gold;
          ctx.shadowBlur = 9 * scale;
          ctx.shadowColor = skin.gold;
          ctx.beginPath();
          ctx.arc(px, py, (1.3 * depth + 0.5) * scale, 0, TAU);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        });

      pts
        .map((p, i) => ({ p, i }))
        .sort((a, b) => b.p.z - a.p.z)
        .forEach(({ p, i }) => {
          const col = creatureColor(i, ir.tierBlend);
          const seed = NODE_SEEDS[i] ?? 0.5;
          // Bioluminescent pulse, fed by real platform state (activityFor →
          // live VRS streak + the node's own registry energy), phase-desynced
          // per node. Fireflies read as alive precisely because they are OUT
          // of phase — a synchronised blink reads as a loading spinner. Under
          // reduced motion this collapses to each node's steady base level.
          const energy = still ? 0.55 : activityFor(i, t);
          const isSelected = full && NODE_IDS[i] === selectedRef.current;
          // Seeded size variety: a swarm of identical lights reads mechanical.
          const sizeVar = 0.78 + seed * 0.62;
          const r = (isSelected ? 4.4 : 3.1) * sizeVar * scale * Math.max(0.45, p.k * 2.3);
          const depthAlpha = Math.max(0.3, Math.min(1, p.k * 2.4));

          drawFirefly(ctx, p.x, p.y, r, col, energy, seed, still, depthAlpha);

          if (isSelected) {
            ctx.strokeStyle = skin.gold;
            ctx.lineWidth = 1.2 * scale;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r + (5 + Math.sin(t * 0.004) * 1.6) * scale, 0, TAU);
            ctx.stroke();
          }

          // Badge labels. Two bugs lived in the three lines this replaces, and
          // both were only visible by rendering the thing:
          //
          // SIZE. `7.5 * scale` grows linearly with the sphere radius, and
          // scale = R / 28.8. At the 300px panel that is 7.5 * 2.73 = 20.5px;
          // in the 700px pop-out, 7.5 * 6.37 = 47.8px. Twenty words of 48px
          // type over a 700px canvas is not a label layer, it is a wall of grey
          // text with a creature somewhere behind it. Clamped to a caption-sized
          // 6–10px, which is what the 7.5 was always reaching for.
          //
          // COUNT. k = 1/(2.4 + z2*0.55) with z2 in [-1,1], so k only ever spans
          // [0.339, 0.541] — a threshold of 0.36 sat barely above the FLOOR and
          // therefore labelled almost every node, front and back alike, all
          // overlapping. 0.47 keeps roughly the nearest quarter.
          //
          // The selected node is always labelled regardless of depth: the aside
          // and the stepper both name it, so it has to be findable on the mesh
          // even when it has rotated to the back.
          const labelled = full && (isSelected || p.k > 0.47);
          if (labelled) {
            const def = NODE_REGISTRY[NODE_IDS[i]];
            ctx.globalAlpha = isSelected ? 1 : Math.min(1, (p.k - 0.44) * 12);
            ctx.font = `800 ${Math.max(6, Math.min(10, 7.5 * scale))}px ${INSTRUMENT_FONT}`;
            ctx.fillStyle = isSelected ? skin.gold : skin.muted;
            ctx.textAlign = "center";
            ctx.fillText(def.badge, p.x, p.y - r - 5 * scale);
          }
          ctx.globalAlpha = 1;
        });
    };

    const stop = runInstrumentLoop(() => [[cvRef, draw]]);
    return () => {
      cv?.removeEventListener("wheel", handleWheel);
      stop();
    };
  }, [base, edges, skin, full]);

  const canvas = (
    <canvas
      ref={cvRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onDoubleClick={onPopOut}
      style={{ width: "100%", height: "100%", display: "block", cursor: "grab", touchAction: "none" }}
    />
  );

  if (!full) {
    // Wrapped so the × has a positioning context. The wrapper takes the size
    // the parent was already giving the canvas, so the corner HUD's layout is
    // unchanged.
    return (
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        {canvas}
        {onDismiss ? <DismissButton onDismiss={onDismiss} gold={skin.gold} /> : null}
      </div>
    );
  }

  const def = NODE_REGISTRY[selected];
  const at = Math.max(0, NODE_IDS.indexOf(selected));
  /** Wrap-around, so the row is a loop rather than a track with two dead ends. */
  const step = (delta: number) =>
    setSharedSelection(NODE_IDS[(at + delta + NODE_IDS.length) % NODE_IDS.length]);
  const arrowStyle: React.CSSProperties = {
    width: 26, height: 22, borderRadius: 7, flex: "none",
    display: "flex", alignItems: "center", justifyContent: "center",
    border: `1px solid ${skin.border}`, background: "transparent",
    color: skin.gold, fontSize: 12, lineHeight: 1, cursor: "pointer", padding: 0,
    fontFamily: INSTRUMENT_FONT,
  };
  return (
    <div className="mg-octavian-shell">
    <div
      className="mg-octavian-grid"
      style={{
        background: `linear-gradient(145deg, ${skin.panel}, ${skin.card})`,
        border: `1px solid ${skin.border}`,
        fontFamily: INSTRUMENT_FONT,
        color: skin.text,
      }}
    >
      {/* One grid cell holding the canvas AND the stepper beneath it.
          .mg-octavian-grid is a two-column grid, so a third direct child would
          auto-place into column 2 and shove the aside down into a second row —
          the stepper has to travel with the canvas, not beside it. */}
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
      {/* A 300x300 square, not a 420px-tall column.
          The creature is drawn from Math.min(w, h), so a tall box wastes every
          pixel of the extra height — it made the panel half a phone screen high
          without making the creature any bigger. Square is the honest shape for
          it, capped so it never exceeds the panel width on a narrow phone. */}
      <div
        style={{
          position: "relative",
          width: "min(300px, 100%)",
          // NOT 100vw: viewport units inside the 393px device frame are the
          // exact bug this PR fixes. Width + aspect-ratio squares off the
          // PANEL, so it stays square at any frame width.
          aspectRatio: "1 / 1",
          margin: "0 auto",
        }}
      >
        {canvas}
        <div style={{ position: "absolute", left: 2, top: 2, fontSize: 6.5, letterSpacing: 0.9, color: skin.muted, textTransform: "uppercase" }}>
          Drag to orbit · tap a node · double-click to expand
        </div>
        {onDismiss ? <DismissButton onDismiss={onDismiss} gold={skin.gold} /> : null}
      </div>

      {/* Node stepper — directly beneath the canvas box.
          Tapping a node means hitting a few pixels of firefly on a sphere that
          is rotating, and roughly half the nodes are on the far side at any
          moment: there was no way to reach a specific node except waiting for
          it to come round. These arrows walk the registry in order, and because
          selection lives in the shared octavian-state store, stepping here moves
          the selection on every other mount of the creature too. */}
      <div
        style={{
          width: "min(300px, 100%)", margin: "6px auto 0",
          display: "flex", alignItems: "center", gap: 8,
        }}
      >
        <button type="button" aria-label="Previous node" onClick={() => step(-1)} style={arrowStyle}>‹</button>
        <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
          <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: 1.2, color: skin.gold, textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {def.badge}
          </div>
          <div style={{ fontSize: 6.5, letterSpacing: 0.8, color: skin.muted }}>
            {at + 1} / {NODE_IDS.length}
          </div>
        </div>
        <button type="button" aria-label="Next node" onClick={() => step(1)} style={arrowStyle}>›</button>
      </div>
      </div>

      {/* minHeight:0 + overflowY:auto is what makes the pop-out wrap instead of
          clip. The grid row stretches this aside to the panel's full height, and
          a flex/grid item's default min-height:auto refuses to shrink below its
          content — so long copy overflowed the panel invisibly rather than
          scrolling. overflowWrap on the text below handles the other half: a
          single long unbroken token (a URL in a stat line, a compound badge)
          would otherwise push the column wider than its track. */}
      <aside style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0, minHeight: 0, overflowY: "auto", overflowWrap: "anywhere" }}>
        <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: 1.4, color: skin.gold, textTransform: "uppercase" }}>
          {def.badge}{def.comingSoon ? " · soon" : ""}
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: 0.6, lineHeight: 1.15, textWrap: "pretty" }}>
          {def.headline}
        </div>
        <p style={{ margin: 0, fontSize: 10.5, lineHeight: 1.65, color: skin.muted, textWrap: "pretty" }}>{def.body}</p>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.6, color: skin.accent, borderTop: `1px solid ${skin.border}`, paddingTop: 9 }}>
          {def.stat}
        </div>
        <div style={{ fontSize: 9.5, fontStyle: "italic", color: skin.muted }}>{def.quip}</div>
      </aside>
    </div>
    </div>
  );
}

export interface OctavianCreatureProps {
  variant: "compact" | "full";
}

export default function OctavianCreature({ variant }: OctavianCreatureProps) {
  const [poppedOut, setPoppedOut] = useState(false);
  // Dismissal is per-mount, NOT shared through octavian-state like mood and
  // selection are. Those are properties of the creature; this is a property of
  // one window onto it. Hiding the corner HUD should not blank the /octavian
  // instrument in another tab, which is exactly what a module-scope flag would
  // do given "one creature, many windows".
  const [dismissed, setDismissed] = useState(false);
  const { skin } = useSkin();

  useEffect(() => {
    if (!poppedOut) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPoppedOut(false);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [poppedOut]);

  // Dismissed collapses to a chip rather than rendering nothing. A × that
  // removes a surface with no way back is a one-way door on the page's most
  // distinctive element, and the founder's own spec has the creature reacting
  // to being prodded — permanently closing it by accident is the one
  // interaction that cannot be undone by prodding it again.
  if (dismissed) {
    return (
      <button
        type="button"
        onClick={() => setDismissed(false)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 11px", borderRadius: 999,
          border: `1px solid ${skin.gold}55`, background: "transparent",
          color: skin.gold, cursor: "pointer",
          fontFamily: INSTRUMENT_FONT, fontSize: 8, fontWeight: 800,
          letterSpacing: 1.2, textTransform: "uppercase",
        }}
      >
        <span aria-hidden>◉</span> Show Octavian
      </button>
    );
  }

  return (
    <>
      <OctavianCanvasPanel
        variant={variant}
        onPopOut={() => setPoppedOut(true)}
        onDismiss={() => setDismissed(true)}
      />
      {poppedOut && (
        <div className="mg-ov-popout-backdrop" onClick={() => setPoppedOut(false)}>
          <div className="mg-ov-popout-panel" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="mg-ov-popout-close"
              aria-label="Close expanded Octavian view"
              onClick={() => setPoppedOut(false)}
            >
              ×
            </button>
            <OctavianCanvasPanel variant="full" />
          </div>
        </div>
      )}
    </>
  );
}
