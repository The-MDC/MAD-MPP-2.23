"use client";

/**
 * MAD Gambit — the Paseome graph, as every page mounts it.
 * ------------------------------------------------------------------
 * The graph is WebGL, so it is code-split and client-only (`ssr:false`), and its
 * chunk is not even requested until the slot is near the viewport. A chunk that
 * fails to load (a dropped mobile connection) throws to the nearest error boundary
 * — which, left alone, is the whole page segment — so it is contained to this slot.
 *
 * Used by the premiere hub (components/om-hub.tsx, which fetches the frontier route)
 * and the Paseome desk (app/open-markets/[id]/page.tsx, which passes the market's own
 * tree). Same component, same honesty rules.
 */
import React from "react";
import dynamic from "next/dynamic";
import { useInView } from "@/hooks/use-in-view";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";
import type { PaseomeGraphProps } from "@/components/paseome-graph";

const MUTED = "#8a8a95";
const GOLD = "#d69d41";

const Loading = () => (
  <div style={{ padding: "28px 4px", fontSize: 10, letterSpacing: 1, textTransform: "uppercase", color: MUTED, fontFamily: INSTRUMENT_FONT }}>
    Loading the Paseome graph…
  </div>
);

const PaseomeGraph = dynamic(() => import("@/components/paseome-graph"), { ssr: false, loading: Loading });

class Boundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="status" style={{ padding: "16px 4px", fontSize: 11, lineHeight: 1.5, color: MUTED, fontFamily: INSTRUMENT_FONT }}>
        The 3D Paseome graph could not load.{" "}
        <button type="button" onClick={() => window.location.reload()} style={{ color: GOLD, fontWeight: 900, background: "none", border: 0, cursor: "pointer", fontFamily: "inherit", fontSize: "inherit", padding: 0 }}>
          Reload ›
        </button>
      </div>
    );
  }
}

export default function PaseomeGraphSlot(props: PaseomeGraphProps) {
  const { ref, seen } = useInView<HTMLDivElement>("320px");
  return (
    <div ref={ref} style={{ minHeight: 380 }}>
      <Boundary>{seen ? <PaseomeGraph {...props} /> : <Loading />}</Boundary>
    </div>
  );
}
