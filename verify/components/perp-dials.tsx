"use client";

/**
 * MAD Gambit — Tickers & Dials (single instrument container).
 * ────────────────────────────────────────────────────────────────
 * One container, two centered rows:
 *   Row 1 — the three meters, centered: Scandal-Velocity · Z-Liar · GossipCop
 *           (GossipCop Meter = live donut over the gossipcop-class perps).
 *   Row 2 — the Gambit Instrument Cluster with the SPLIT-FLAP CHRONO (Seiko
 *           flip clock, scale 1.2 = +20%) replacing the three KPI digit pods
 *           between the two customizable analog dials.
 * The GossipCop top-perps list lives on in the Markets-by-Class carousel below.
 */
import React, { useEffect, useState } from "react";
import { useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";
import GambitInstrumentCluster from "@/components/gambit-instrument-cluster";
import ScandalVelocityMeter from "@/components/scandal-velocity-meter";
import ZLiarMeter from "@/components/zliar-meter";
import SeikoFlipClock from "@/components/seiko-flip-clock";

type MarketType = "progression" | "saga" | "zliar" | "perp" | "gossipcop";
interface Proposal { type: MarketType; title: string; score: number; perpProbability: number }
interface Resp { success: boolean; source?: string; proposals: Proposal[] }

/** Live GossipCop Meter — donut over the hottest gossipcop-class perp. */
function GossipCopMeter() {
  const { skin } = useSkin();
  const [items, setItems] = useState<Proposal[] | null>(null);

  useEffect(() => {
    fetch("/api/v1/markets/proposals?limit=40")
      .then((r) => r.json())
      .then((d: Resp) => {
        if (d?.success) setItems(d.proposals.filter((p) => p.type === "gossipcop"));
      })
      .catch(() => setItems([]));
  }, []);

  const count = items?.length ?? 0;
  const pct = count
    ? Math.round(Math.max.apply(null, (items as Proposal[]).map((p) => p.perpProbability)) * 100)
    : 0;
  const color = skin.accent2;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, fontFamily: INSTRUMENT_FONT }}>
      <div style={{ position: "relative", width: 84, height: 84 }}>
        <svg width="84" height="84" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
          <circle cx="50" cy="50" r="42" fill="none" stroke={skin.card} strokeWidth="10" />
          <circle
            cx="50" cy="50" r="42" fill="none"
            stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * 264} 264`}
            style={{ transition: "stroke-dasharray .6s ease" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 18, fontWeight: 900, color }}>{items === null ? "…" : count ? pct : "—"}</span>
          {count ? <span style={{ fontSize: 6, color: skin.muted, letterSpacing: 1 }}>PERP&nbsp;%</span> : null}
        </div>
      </div>
      <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1.2, textTransform: "uppercase", color }}>
        GossipCop Meter
      </div>
      <div style={{ fontSize: 6.5, color: skin.muted, letterSpacing: 0.5, textAlign: "center" }}>
        {items === null ? "reading the gossip wire…" : count ? `${count} live gossip perp${count > 1 ? "s" : ""}` : "no gossip perps live yet"}
      </div>
    </div>
  );
}

function MeterCell({ children }: { children: React.ReactNode }) {
  const { skin } = useSkin();
  return (
    <div style={{ flex: "1 1 220px", maxWidth: 320, minHeight: 150, display: "flex", alignItems: "center", justifyContent: "center", background: skin.card, border: `1px solid ${skin.border}`, borderRadius: 12, padding: 12 }}>
      {children}
    </div>
  );
}

export default function PerpDials() {
  const { skin } = useSkin();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 2, color: skin.gold, textTransform: "uppercase", fontFamily: INSTRUMENT_FONT, margin: "0 0 2px 2px" }}>
        Tickers &amp; Dials
      </div>

      {/* ONE instrument container */}
      <div style={{ background: skin.panel, border: `1px solid ${skin.border}`, borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Row 1 — the three meters, centered */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14 }}>
          <MeterCell><ScandalVelocityMeter /></MeterCell>
          <MeterCell><ZLiarMeter /></MeterCell>
          <MeterCell><GossipCopMeter /></MeterCell>
        </div>

        {/* Row 2 — dials flanking the +20% split-flap chrono (replaces the KPI pods) */}
        <div style={{ overflowX: "auto" }}>
          <GambitInstrumentCluster centerSlot={<SeikoFlipClock label="MAD·TIME UTC" scale={1.2} />} />
        </div>
      </div>
    </div>
  );
}
