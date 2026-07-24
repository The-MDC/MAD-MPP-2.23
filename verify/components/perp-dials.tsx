"use client";

/**
 * MAD Gambit — Instruments & Dials (restored) + GossipCop × Z-Liar dashboard.
 * ────────────────────────────────────────────────────────────────
 * Brings the analog dials back into the hub: the MAD Gambit Instrument Cluster
 * (2 analog dials + 3 KPI pods), the Scandal-Velocity meter, and the Z-Liar Meter.
 * The Z-Liar dial is paired with a live GossipCop-perp panel — GossipCop surfaced
 * in the dashboard alongside the Z-Liar Meter, exactly as requested.
 */
import React, { useEffect, useState } from "react";
import { useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";
import GambitInstrumentCluster from "@/components/gambit-instrument-cluster";
import ScandalVelocityMeter from "@/components/scandal-velocity-meter";
import ZLiarMeter from "@/components/zliar-meter";

type MarketType = "progression" | "saga" | "zliar" | "perp" | "gossipcop";
interface Proposal { type: MarketType; title: string; score: number; perpProbability: number }
interface Resp { success: boolean; source?: string; proposals: Proposal[] }

function Panel({ children }: { children: React.ReactNode }) {
  const { skin } = useSkin();
  return (
    <div style={{ background: skin.panel, border: `1px solid ${skin.border}`, borderRadius: 16, padding: 14, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 150 }}>
      {children}
    </div>
  );
}

function GossipCopPanel() {
  const { skin } = useSkin();
  const [items, setItems] = useState<Proposal[] | null>(null);

  useEffect(() => {
    fetch("/api/v1/markets/proposals?limit=40")
      .then((r) => r.json())
      .then((d: Resp) => {
        if (d?.success) setItems(d.proposals.filter((p) => p.type === "gossipcop"));
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{ background: skin.panel, border: `1px solid ${skin.accent2}55`, borderRadius: 16, padding: 14, fontFamily: INSTRUMENT_FONT }}>
      <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.5, color: skin.accent2, textTransform: "uppercase" }}>
        🗞️ GossipCop Perps
      </div>
      <div style={{ fontSize: 7.5, color: skin.muted, margin: "3px 0 10px" }}>
        Celebrity long-arc perps · paired with the Z-Liar quality gate.
      </div>
      {items === null ? (
        <div style={{ fontSize: 9, color: skin.muted }}>Loading…</div>
      ) : items.length === 0 ? (
        <div style={{ fontSize: 9, color: skin.muted }}>No GossipCop perps live yet — they graduate from long-arc celebrity sagas.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {items.slice(0, 3).map((p, i) => (
            <div key={i} style={{ background: skin.card, border: `1px solid ${skin.border}`, borderRadius: 9, padding: "8px 10px" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: skin.text, lineHeight: 1.3 }}>{p.title}</div>
              <div style={{ fontSize: 7, color: skin.muted, marginTop: 4 }}>
                perp <span style={{ color: skin.accent2, fontWeight: 900 }}>{Math.round(p.perpProbability * 100)}%</span> · score{" "}
                <span style={{ color: skin.accent, fontWeight: 900 }}>{p.score.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PerpDials() {
  const { skin } = useSkin();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 2, color: skin.gold, textTransform: "uppercase", fontFamily: INSTRUMENT_FONT, margin: "0 0 2px 2px" }}>
        Instruments &amp; Dials
      </div>

      <div style={{ background: skin.panel, border: `1px solid ${skin.border}`, borderRadius: 16, padding: 16, overflowX: "auto" }}>
        <GambitInstrumentCluster />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))", gap: 14 }}>
        <Panel><ScandalVelocityMeter /></Panel>
        <Panel><ZLiarMeter /></Panel>
        <GossipCopPanel />
      </div>
    </div>
  );
}
