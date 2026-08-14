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
 *   top-left     — a small, non-interactive Octavian orb: the same
 *                  fibonacciSphere placement + registry accents as the
 *                  full mesh at octavian-mesh.tsx, auto-spin only. The
 *                  drag/click/side-panel version belongs on /octavian —
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
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";
import { NODE_REGISTRY, NODE_IDS, type NodeId } from "@/lib/node-registry";
import { fitCanvas, fibonacciSphere, resolveColor, runInstrumentLoop, type P3 } from "@/lib/instrument-chrome";

const TAU = Math.PI * 2;
const EDGE_STEPS = [1, 5, 9] as const;

// Platform-wide state and stats — aggregate numbers, not any one market's,
// since a "platform" legend reads oddly when it's dominated by one figure.
const LEGEND_IDS: NodeId[] = ["fee-waterfall", "tokenomics", "staking", "madconv", "markets-all"];

// The registry's only two `kind: "strip"` nodes — already-authored
// switches/state content, surfaced here rather than invented fresh.
const SWITCH_IDS: NodeId[] = ["ticker-legend", "gossip-cop"];

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

  useEffect(() => {
    const draw = (cv: HTMLCanvasElement, t: number) => {
      const s = fitCanvas(cv);
      if (!s) return;
      const { ctx, w, h } = s;
      yaw.current += 0.0022;
      const pitch = -0.22;
      const R = Math.min(w, h) * 0.4;
      const cy = Math.cos(pitch);
      const sy = Math.sin(pitch);

      const project = (p: P3) => {
        const x1 = p.x * Math.cos(yaw.current) - p.z * Math.sin(yaw.current);
        const z1 = p.x * Math.sin(yaw.current) + p.z * Math.cos(yaw.current);
        const y2 = p.y * cy - z1 * sy;
        const z2 = p.y * sy + z1 * cy;
        const k = 1 / (2.4 + z2 * 0.55);
        return { x: w / 2 + x1 * R * 2.4 * k, y: h / 2 + y2 * R * 2.4 * k, k, z: z2 };
      };

      const pts = base.map(project);

      edges
        .map((e) => ({ e, z: (pts[e[0]].z + pts[e[1]].z) / 2 }))
        .sort((a, b) => b.z - a.z)
        .forEach(({ e }) => {
          const [a, b, seed] = e;
          const pa = pts[a];
          const pb = pts[b];
          const depth = Math.max(0.08, Math.min(1, (pa.k + pb.k) * 1.1));
          ctx.strokeStyle = skin.accent;
          ctx.globalAlpha = 0.12 * depth;
          ctx.lineWidth = 0.75;
          ctx.beginPath();
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(pb.x, pb.y);
          ctx.stroke();

          const u = (((t * 0.00016 + seed) % 1) + 1) % 1;
          const px = pa.x + (pb.x - pa.x) * u;
          const py = pa.y + (pb.y - pa.y) * u;
          ctx.globalAlpha = 0.7 * depth;
          ctx.fillStyle = skin.gold;
          ctx.shadowBlur = 6;
          ctx.shadowColor = skin.gold;
          ctx.beginPath();
          ctx.arc(px, py, 1.1 * depth + 0.4, 0, TAU);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        });

      pts
        .map((p, i) => ({ p, i }))
        .sort((a, b) => b.p.z - a.p.z)
        .forEach(({ p, i }) => {
          const def = NODE_REGISTRY[NODE_IDS[i]];
          const col = resolveColor(def.accent, cv, skin.accent);
          const r = 2.6 * Math.max(0.45, p.k * 2.3);
          ctx.globalAlpha = Math.max(0.25, Math.min(1, p.k * 2.4));
          ctx.fillStyle = col;
          ctx.shadowBlur = 6;
          ctx.shadowColor = col;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, TAU);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        });
    };

    return runInstrumentLoop(() => [[cvRef, draw]]);
  }, [base, edges, skin]);

  return <canvas ref={cvRef} style={{ width: "100%", height: "100%", display: "block" }} />;
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
