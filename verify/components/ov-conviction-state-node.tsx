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
 *   top-left     — <OctavianCreature variant="compact" />, the shared mesh
 *                  engine also used on /octavian and inline on /preview
 *                  (see components/octavian-creature.tsx — one Octavian
 *                  implementation now, not three that could drift apart).
 *                  Double-click pops it out into a near-fullscreen overlay
 *                  of the full instrument (info panel, click-to-select,
 *                  two-axis orbit); that behavior lives entirely inside
 *                  OctavianCreature, so this file only has to mount it.
 *   top-right    — a static legend of platform state/stats, read
 *                  straight off lib/node-registry.ts (no fetch: the
 *                  registry is already a synchronous import elsewhere).
 *   bottom-left  — the registry's two existing "strip" live elements
 *                  (ticker-legend, gossip-cop) surfaced as read-only
 *                  switches/state pills — balances the zoom bar's
 *                  bottom-right position.
 */
import React, { useEffect, useState } from "react";
import { useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";
import { NODE_REGISTRY, NODE_IDS, type NodeId } from "@/lib/node-registry";
import OctavianCreature from "@/components/octavian-creature";

// Platform-wide state and stats — aggregate numbers, not any one market's,
// since a "platform" legend reads oddly when it's dominated by one figure.
const LEGEND_IDS: NodeId[] = ["fee-waterfall", "tokenomics", "staking", "madconv", "markets-all"];

// The registry's only two `kind: "strip"` nodes — already-authored
// switches/state content, surfaced here rather than invented fresh.
const SWITCH_IDS: NodeId[] = ["ticker-legend", "gossip-cop"];

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
        <OctavianCreature variant="compact" />
      </div>
      <LegendPanel />
      <SwitchPanel />
    </>
  );
}
