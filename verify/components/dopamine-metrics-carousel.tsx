"use client";

/**
 * MAD Gambit — Dopamine Metrics Carousel (Part Y). The live platform pulse,
 * wired to REAL data (/api/v1/dopamine/metrics → markets/bets/gdelt_signals/
 * events_stream on Neon): Active Bets, a Chaos Meter from GCAM scandal velocity,
 * Markets, 24h Volume, and the hottest scandal. Skin-aware; reduced-motion safe.
 */
import React, { useEffect, useState } from "react";
import { useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";

interface Metrics {
  activeMarkets: number;
  openBets: number;
  volume24h: number;
  chaos: number;
  events24h: number;
  topScandals: { headline: string; perp: number }[];
  source: string;
}

const usd = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Math.round(n)}`);

export default function DopamineMetricsCarousel() {
  const { skin } = useSkin();
  const [m, setM] = useState<Metrics | null>(null);

  useEffect(() => {
    let stop = false;
    const load = () =>
      fetch("/api/v1/dopamine/metrics")
        .then((r) => r.json())
        .then((d) => {
          if (!stop && d?.success) setM(d.metrics as Metrics);
        })
        .catch(() => {});
    load();
    const t = setInterval(load, 15000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, []);

  const chaos = m?.chaos ?? 0;
  const chaosColor = chaos > 66 ? skin.accent2 : chaos > 33 ? skin.gold : skin.accent;
  const tiles: [string, string, string][] = [
    ["Active bets", m ? String(m.openBets) : "—", skin.accent],
    ["Markets", m ? String(m.activeMarkets) : "—", skin.gold],
    ["Vol · 24h", m ? usd(m.volume24h) : "—", skin.accent2],
    ["Events · 24h", m ? String(m.events24h) : "—", skin.accent],
  ];
  const top = m?.topScandals?.[0];

  return (
    <div style={{ background: skin.panel, border: `1px solid ${skin.border}`, borderRadius: 16, padding: 18, fontFamily: INSTRUMENT_FONT, color: skin.text }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, color: skin.gold, textTransform: "uppercase" }}>
          Dopamine · Live Pulse
        </div>
        {m && (
          <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", padding: "2px 6px", borderRadius: 4, color: m.source === "live" ? skin.accent : skin.muted, background: `${m.source === "live" ? skin.accent : skin.muted}18`, border: `1px solid ${m.source === "live" ? skin.accent : skin.muted}40` }}>
            {m.source}
          </span>
        )}
      </div>

      {/* Chaos meter */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
        <div style={{ position: "relative", width: 68, height: 68, flexShrink: 0 }}>
          <svg width="68" height="68" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
            <circle cx="50" cy="50" r="42" fill="none" stroke={skin.card} strokeWidth="10" />
            <circle cx="50" cy="50" r="42" fill="none" stroke={chaosColor} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(chaos / 100) * 264} 264`} style={{ transition: "stroke-dasharray .6s ease, stroke .4s ease" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 16, fontWeight: 900, color: chaosColor }}>{chaos}</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: chaosColor }}>Chaos Meter</div>
          <div style={{ fontSize: 8, color: skin.muted, marginTop: 3, maxWidth: 190 }}>
            24h scandal velocity across the GCAM signal feed.
          </div>
        </div>
      </div>

      {/* Tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 8 }}>
        {tiles.map(([label, val, color]) => (
          <div key={label} style={{ background: skin.card, border: `1px solid ${skin.border}`, borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 18, fontWeight: 900, color }}>{val}</div>
            <div style={{ fontSize: 8, color: skin.muted, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
          </div>
        ))}
      </div>

      {top && (
        <div style={{ marginTop: 12, fontSize: 8, color: skin.muted }}>
          🔥 Hot: <span style={{ color: skin.text }}>{top.headline}</span> · perp {(top.perp * 100).toFixed(0)}%
        </div>
      )}
      <div style={{ fontSize: 7, color: skin.muted, marginTop: 10 }}>
        Live from markets · bets · scandal signals. Refreshes every 15s.
      </div>
    </div>
  );
}
