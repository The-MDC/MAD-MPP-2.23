"use client";

/**
 * MAD Gambit — O-V CONVICTION STATE NODE.
 * ------------------------------------------------------------------
 * HUD for the desktop workbench's blank space around the phone bezel —
 * rendered from DeviceFrame, sibling to .mg-device (never inside it, so
 * none of it is affected by --mg-device-zoom), gated on the same
 * `isDesktop` DeviceFrame already tracks. Follows the .mg-zoombar
 * convention exactly: position: fixed, safe-area insets, z-index 50,
 * glass panel. Desktop-only by construction — there is no blank
 * workbench space to occupy below DESKTOP_MIN.
 *
 * Three pieces:
 *   top-left     — a living Octavian orb: the same fibonacciSphere placement
 *                  as the full mesh at octavian-mesh.tsx, now with its own
 *                  mood system instead of static registry accents. Idle it
 *                  weaves (slow yaw + independently-swaying pitch) in a
 *                  cool topaz/emerald/cyan/blue/blue-purple palette under a
 *                  gold ambient aura. Pointer drag/poke nudges an
 *                  "irritation" counter: a couple of prods shifts it
 *                  yellow/green/blue and speeds the spin; four or five reads
 *                  as genuinely bothered — yellow/orange/red, fastest spin,
 *                  pitch tips away from face-on ("turning away," not wanting
 *                  to be bothered) — then eases back to idle on its own once
 *                  left alone. Wheel/pinch zooms the camera x0.167–x4 around
 *                  a centered default; the box itself is a fixed "vitrine"
 *                  (see .mg-ov-corner), not something that grows with zoom.
 *                  aria-hidden + no keyboard path is deliberate: this is a
 *                  decorative easter egg redundant with LegendPanel's
 *                  accessible text, not a control.
 *                  The drag/click/side-panel version belongs on /octavian —
 *                  this is a corner visual, not a second instance of
 *                  that instrument.
 *   top-right    — a static legend of platform state/stats, read
 *                  straight off lib/node-registry.ts (no fetch: the
 *                  registry is already a synchronous import elsewhere).
 *   bottom-left  — the registry's two existing "strip" live elements
 *                  (ticker-legend, gossip-cop) surfaced as read-only
 *                  switches/state pills — balances the zoom bar's
 *                  bottom-right position.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";
import { NODE_REGISTRY, NODE_IDS, type NodeId } from "@/lib/node-registry";
import { fitCanvas, fibonacciSphere, runInstrumentLoop, type P3 } from "@/lib/instrument-chrome";

const TAU = Math.PI * 2;
const EDGE_STEPS = [1, 5, 9] as const;

// Platform-wide state and stats — aggregate numbers, not any one market's,
// since a "platform" legend reads oddly when it's dominated by one figure.
const LEGEND_IDS: NodeId[] = ["fee-waterfall", "tokenomics", "staking", "madconv", "markets-all"];

// The registry's only two `kind: "strip"` nodes — already-authored
// switches/state content, surfaced here rather than invented fresh.
const SWITCH_IDS: NodeId[] = ["ticker-legend", "gossip-cop"];

// Slow auto-spin, kept per feedback (a first pass removed it entirely; the
// ask was to tame it, not stop it — then to make it weave). Yaw accumulates
// steadily and slowly; pitch independently sways on a much slower period so
// the tilt itself drifts back and forth as it spins. The combination is a
// tumble/weave rather than a flat single-axis carousel-spin.
const ORB_SPIN_RATE = 0.0009; // ~40% of the original 0.0022 — "spin slowly"
const ORB_PITCH_BASE = -0.24;
const ORB_PITCH_SWING = 0.14;
const ORB_PITCH_RATE = 0.00028; // full sway period ≈ 22s — slow enough to read as weaving, not jitter
// Every stroke/dot size in the draw loop was tuned at the original 72px
// corner size (R ≈ 28.8px there). Scaling them by canvas size keeps the mesh
// looking dense and lit at the larger size instead of the same hairline
// dots just spreading further apart.
const ORB_BASELINE_R = 28.8;

// --- Mood system -----------------------------------------------------
// Interaction (drag/poke/pull/push — any completed pointer gesture on the
// orb) increments a "prods" counter. Tier 0->1 at 2 prods, 1->2 at 4 prods,
// matching the founder's spec ("after the 2nd or 3rd", "after the 4th or
// fifth"). tierBlend eases toward the target tier each frame rather than
// snapping, so colour/speed/pitch all crossfade instead of cutting.
const SPIN_TIERS: readonly [number, number, number] = [ORB_SPIN_RATE, ORB_SPIN_RATE * 2.4, ORB_SPIN_RATE * 4.2];
const DECAY_GRACE_MS = 9000; // stays at its current mood this long after the last prod
const DECAY_STEP_MS = 9000; // then sheds one prod's worth of heat every this-many-ms, paced by re-anchoring lastAt
const ZOOM_MIN = 1 / 6; // "zoomed out x6"
const ZOOM_MAX = 4; // "zoomed in x4"

// Real cephalopod skin layers pigment-filled chromatophores (yellow/orange/
// red) over structurally-reflective iridophores (blue/green/violet); calm
// reads cool/iridescent because the pigment sacs are contracted, agitation
// expands them over the reflective layer beneath. Same layering here: idle
// leans structural-cool, tier 2 is pigment-dominant — a real mechanism, not
// just three unrelated palettes.
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

function OctavianOrb() {
  const { skin } = useSkin();
  const cvRef = useRef<HTMLCanvasElement | null>(null);
  const base = useMemo(() => fibonacciSphere(NODE_IDS.length), []);
  const edges = useMemo(() => {
    const e: [number, number, number][] = [];
    base.forEach((_, i) =>
      EDGE_STEPS.forEach((d) => e.push([i, (i + d) % base.length, ((i * 7 + d * 13) % 100) / 100])),
    );
    return e;
  }, [base]);
  const yaw = useRef(0);
  const zoomRef = useRef(1);

  // Mood + gesture state lives in refs — same reasoning as yaw: the pointer
  // and the draw loop must not trigger React re-renders.
  const irritation = useRef({ prods: 0, lastAt: -Infinity, tierBlend: 0, fleeYaw: 0 });
  const drag = useRef({ active: false, x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef<number | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture(e.pointerId);
    if (pointers.current.size === 1) {
      drag.current = { active: true, x: e.clientX, y: e.clientY };
    } else if (pointers.current.size === 2) {
      drag.current.active = false;
      const pts = Array.from(pointers.current.values());
      pinchStart.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    }
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchStart.current) {
      const pts = Array.from(pointers.current.values());
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      zoomRef.current = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoomRef.current * (d / pinchStart.current)));
      pinchStart.current = d;
      return;
    }

    const d = drag.current;
    if (!d.active) return;
    yaw.current += (e.clientX - d.x) * 0.004;
    d.x = e.clientX;
    d.y = e.clientY;
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (drag.current.active) {
      drag.current.active = false;
      // Any completed drag/poke counts as a prod — "pulled / pushed / poked
      // / played with" is one bucket, not four different gestures to detect.
      const ir = irritation.current;
      ir.prods = Math.min(ir.prods + 1, 8);
      ir.lastAt = performance.now();
      ir.fleeYaw += Math.PI / 3;
    }
  }, []);

  const onPointerCancel = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    pointers.current.delete(e.pointerId);
    drag.current.active = false;
    pinchStart.current = null;
  }, []);

  useEffect(() => {
    const cv = cvRef.current;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomRef.current = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoomRef.current * (e.deltaY > 0 ? 0.92 : 1.08)));
    };
    // Native + { passive: false } on purpose: React's synthetic onWheel is
    // often bound passive, which silently no-ops preventDefault and lets
    // the page scroll instead of zooming the orb.
    cv?.addEventListener("wheel", handleWheel, { passive: false });

    const draw = (cv: HTMLCanvasElement, t: number) => {
      const s = fitCanvas(cv);
      if (!s) return;
      const { ctx, w, h } = s;
      const now = performance.now();
      const ir = irritation.current;

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

      yaw.current += tierValue(SPIN_TIERS, ir.tierBlend);
      const effectiveYaw = yaw.current + ir.fleeYaw;
      const pitch =
        ORB_PITCH_BASE +
        ORB_PITCH_SWING * Math.sin(t * ORB_PITCH_RATE) -
        0.32 * (ir.tierBlend / 2); // agitated states tip away from face-on — "turning away"

      const R = Math.min(w, h) * 0.42 * zoomRef.current * (1 - 0.05 * ir.tierBlend);
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

      const pts = base.map(project);

      // Ambient halo first — sells the sphere as a glowing instrument rather
      // than a loose scatter of dots. Time-based pulse, not positional.
      // Gold throughout, regardless of mood tier — the "dazzling gold low
      // glow aura" is the one constant across the calm/agitated/angry range.
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
          // Slow per-node breathing glow — time-based only, phase-offset per
          // node so the orb doesn't pulse as one flat unit. No positional
          // motion, so it reads as "alive" without reading as "drifting".
          const breathe = 0.85 + 0.15 * Math.sin(t * 0.0011 + i * 1.7);
          const r = 3.1 * scale * Math.max(0.45, p.k * 2.3) * breathe;
          ctx.globalAlpha = Math.max(0.3, Math.min(1, p.k * 2.4)) * breathe;
          ctx.fillStyle = col;
          ctx.shadowBlur = 9 * scale;
          ctx.shadowColor = col;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, TAU);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        });
    };

    const stop = runInstrumentLoop(() => [[cvRef, draw]]);
    return () => {
      cv?.removeEventListener("wheel", handleWheel);
      stop();
    };
  }, [base, edges, skin]);

  return (
    <canvas
      ref={cvRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      style={{ width: "100%", height: "100%", display: "block", cursor: "grab", touchAction: "none" }}
    />
  );
}

function LegendPanel() {
  const { skin } = useSkin();
  return (
    <div
      className="mg-ov-legend"
      style={{
        background: `linear-gradient(145deg, ${skin.panel}, ${skin.card})`,
        borderColor: skin.border,
        fontFamily: INSTRUMENT_FONT,
        color: skin.text,
      }}
    >
      <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.4, color: skin.gold, textTransform: "uppercase", marginBottom: 8 }}>
        Platform · live
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {LEGEND_IDS.map((id) => {
          const def = NODE_REGISTRY[id];
          return (
            <div key={id} style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <span style={{ fontSize: 7, color: skin.muted, letterSpacing: 0.6, textTransform: "uppercase" }}>{def.badge}</span>
              <span style={{ fontSize: 7.5, color: skin.accent, fontWeight: 700, whiteSpace: "nowrap" }}>{def.stat}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SwitchStrip({ id }: { id: NodeId }) {
  const { skin } = useSkin();
  const def = NODE_REGISTRY[id];
  const states = def.live.kind === "strip" ? def.live.states : [];
  const [on, setOn] = useState(0);

  useEffect(() => {
    if (states.length < 2) return;
    const t = setInterval(() => setOn((i) => (i + 1) % states.length), 1400);
    return () => clearInterval(t);
  }, [states.length]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 6.5, color: skin.muted, letterSpacing: 0.6, textTransform: "uppercase", minWidth: 46 }}>{def.badge}</span>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {states.map((s, i) => (
          <span
            key={s}
            style={{
              fontSize: 6.5,
              fontWeight: 800,
              padding: "3px 6px",
              borderRadius: 5,
              border: `1px solid ${i === on ? skin.gold : skin.border}`,
              color: i === on ? skin.gold : skin.muted,
              transition: "all 0.3s linear",
              whiteSpace: "nowrap",
            }}
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

function SwitchPanel() {
  const { skin } = useSkin();
  return (
    <div
      className="mg-ov-switches"
      style={{
        background: `linear-gradient(145deg, ${skin.panel}, ${skin.card})`,
        borderColor: skin.border,
        fontFamily: INSTRUMENT_FONT,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {SWITCH_IDS.map((id) => (
          <SwitchStrip key={id} id={id} />
        ))}
      </div>
    </div>
  );
}

export default function OVConvictionStateNode({ isDesktop }: { isDesktop: boolean }) {
  if (!isDesktop) return null;

  return (
    <>
      <div className="mg-ov-corner" aria-hidden="true">
        <OctavianOrb />
      </div>
      <LegendPanel />
      <SwitchPanel />
    </>
  );
}
