"use client";

/**
 * MAD Gambit — OCTAVIAN : global state as an orbitable mesh.
 * ------------------------------------------------------------------
 * All 20 nodes of lib/node-registry.ts placed on a Fibonacci sphere, wired
 * i → (i+1 | i+5 | i+9), with pulses travelling each edge. Drag to orbit,
 * click a node to read it. 2D canvas on purpose — it belongs to the same
 * instrument family as the perp dials, not to the r3f scene graph.
 *
 * Replaces the orphaned root stubs app/octavian-master/page.tsx and
 * app/components/OctavianStateNode3D.tsx.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";
import { NODE_REGISTRY, NODE_IDS, type NodeId } from "@/lib/node-registry";
import { fitCanvas, fibonacciSphere, resolveColor, type P3 } from "@/lib/instrument-chrome";

const TAU = Math.PI * 2;
const EDGE_STEPS = [1, 5, 9] as const;

export default function OctavianMesh() {
  const { skin } = useSkin();
  const cvRef = useRef<HTMLCanvasElement | null>(null);
  const [selected, setSelected] = useState<NodeId>(NODE_IDS[0]);

  const base = useMemo(() => fibonacciSphere(NODE_IDS.length), []);
  const edges = useMemo(() => {
    const e: [number, number, number][] = [];
    base.forEach((_, i) =>
      EDGE_STEPS.forEach((d) => e.push([i, (i + d) % base.length, ((i * 7 + d * 13) % 100) / 100])),
    );
    return e;
  }, [base]);

  // Orbit state lives in a ref: the pointer must not re-render the tree.
  const orbit = useRef({ yaw: 0, pitch: -0.18, spin: true, dragging: false, lx: 0, ly: 0 });
  const hit = useRef<{ i: number; x: number; y: number; r: number }[]>([]);

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    let raf = 0;
    const t0 = performance.now();
    const timers: number[] = [];

    const draw = (t: number) => {
      const s = fitCanvas(cv);
      if (!s) return;
      const { ctx, w, h } = s;
      const o = orbit.current;
      if (o.spin && !o.dragging) o.yaw += 0.0016;

      const R = Math.min(w, h) * 0.34;
      const cy = Math.cos(o.pitch);
      const sy = Math.sin(o.pitch);

      const project = (p: P3) => {
        const x1 = p.x * Math.cos(o.yaw) - p.z * Math.sin(o.yaw);
        const z1 = p.x * Math.sin(o.yaw) + p.z * Math.cos(o.yaw);
        const y2 = p.y * cy - z1 * sy;
        const z2 = p.y * sy + z1 * cy;
        const k = 1 / (2.4 + z2 * 0.55);
        return { x: w / 2 + x1 * R * 2.4 * k, y: h / 2 + y2 * R * 2.4 * k, k, z: z2 };
      };

      const pts = base.map(project);
      hit.current = pts.map((p, i) => ({ i, x: p.x, y: p.y, r: Math.max(6, 13 * p.k) }));

      // Edges first, back to front, with a pulse riding each one.
      edges
        .map((e) => ({ e, z: (pts[e[0]].z + pts[e[1]].z) / 2 }))
        .sort((a, b) => b.z - a.z)
        .forEach(({ e }) => {
          const [a, b, seed] = e;
          const pa = pts[a];
          const pb = pts[b];
          const depth = Math.max(0.08, Math.min(1, (pa.k + pb.k) * 1.1));
          ctx.strokeStyle = skin.accent;
          ctx.globalAlpha = 0.1 * depth;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(pb.x, pb.y);
          ctx.stroke();

          const u = ((t * 0.00016 + seed) % 1 + 1) % 1;
          const px = pa.x + (pb.x - pa.x) * u;
          const py = pa.y + (pb.y - pa.y) * u;
          ctx.globalAlpha = 0.75 * depth;
          ctx.fillStyle = skin.gold;
          ctx.shadowBlur = 8;
          ctx.shadowColor = skin.gold;
          ctx.beginPath();
          ctx.arc(px, py, 1.5 * depth + 0.6, 0, TAU);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        });

      // Nodes, back to front so near ones occlude.
      pts
        .map((p, i) => ({ p, i }))
        .sort((a, b) => b.p.z - a.p.z)
        .forEach(({ p, i }) => {
          const id = NODE_IDS[i];
          const def = NODE_REGISTRY[id];
          const col = resolveColor(def.accent, cv, skin.accent);
          const on = id === selected;
          const r = (on ? 5.2 : 3.4) * Math.max(0.45, p.k * 2.3);
          ctx.globalAlpha = Math.max(0.25, Math.min(1, p.k * 2.4));
          ctx.fillStyle = col;
          ctx.shadowBlur = on ? 16 : 9;
          ctx.shadowColor = col;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, TAU);
          ctx.fill();
          ctx.shadowBlur = 0;
          if (on) {
            ctx.strokeStyle = skin.gold;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r + 5 + Math.sin(t * 0.004) * 1.6, 0, TAU);
            ctx.stroke();
          }
          if (p.k > 0.36) {
            ctx.globalAlpha = Math.min(1, (p.k - 0.3) * 5);
            ctx.font = `800 7.5px ${INSTRUMENT_FONT}`;
            ctx.fillStyle = on ? skin.gold : skin.muted;
            ctx.textAlign = "center";
            ctx.fillText(def.badge, p.x, p.y - r - 5);
          }
          ctx.globalAlpha = 1;
        });
    };

    // Paint synchronously first — rAF is suspended in hidden frames, print
    // passes and screenshot captures, and the mesh would render blank.
    const tick = (ts: number) => {
      try { draw(ts - t0); } finally { raf = requestAnimationFrame(tick); }
    };
    try { draw(0); } catch { /* pre-layout */ }
    timers.push(window.setTimeout(() => draw(performance.now() - t0), 0));
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); timers.forEach(clearTimeout); };
  }, [base, edges, selected, skin]);

  const onDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const o = orbit.current;
    o.dragging = true;
    o.lx = e.clientX;
    o.ly = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const o = orbit.current;
    if (!o.dragging) return;
    o.yaw += (e.clientX - o.lx) * 0.006;
    o.pitch = Math.max(-1.2, Math.min(1.2, o.pitch + (e.clientY - o.ly) * 0.005));
    o.lx = e.clientX;
    o.ly = e.clientY;
  }, []);

  const onUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    orbit.current.dragging = false;
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    let best = -1;
    let bd = Infinity;
    hit.current.forEach((n) => {
      const d = Math.hypot(n.x - x, n.y - y);
      if (d < n.r && d < bd) { bd = d; best = n.i; }
    });
    if (best >= 0) setSelected(NODE_IDS[best]);
  }, []);

  const def = NODE_REGISTRY[selected];

  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.6fr) minmax(240px, 1fr)",
        gap: 14,
        padding: 14,
        borderRadius: 24,
        background: `linear-gradient(145deg, ${skin.panel}, ${skin.card})`,
        border: `1px solid ${skin.border}`,
        fontFamily: INSTRUMENT_FONT,
        color: skin.text,
      }}
    >
      <div style={{ position: "relative", minHeight: 420 }}>
        <canvas
          ref={cvRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          style={{ width: "100%", height: "100%", display: "block", cursor: "grab", touchAction: "none" }}
        />
        <div style={{ position: "absolute", left: 2, top: 2, fontSize: 6.5, letterSpacing: 0.9, color: skin.muted, textTransform: "uppercase" }}>
          Drag to orbit · tap a node
        </div>
      </div>

      <aside style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
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
    </section>
  );
}
