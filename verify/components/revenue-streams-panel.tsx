"use client";

/**
 * MAD Gambit — 5-Stream Revenue Engine panel (Phase 4)
 * Shows the five revenue streams and a live fee-split calculator backed by
 * /api/v1/revenue (which uses the canonical splitFee + Furnace primitives).
 */
import React, { useState, useEffect } from "react";
import { INK, INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";
import { REVENUE_STREAMS } from "@/lib/revenue-engine";

interface Rollup {
  totalVolume: number;
  totalGrossFee: number;
  totalCreator: number;
  totalCommunity: number;
  totalProtocol: number;
  totalBurn: number;
}

const STATUS_COLOR: Record<string, string> = {
  live: INK.green,
  partial: INK.gold,
  planned: INK.muted,
};

const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });

export default function RevenueStreamsPanel() {
  const [volume, setVolume] = useState(100_000);
  const [creator, setCreator] = useState(true);
  const [rollup, setRollup] = useState<Rollup | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/v1/revenue?volume=${encodeURIComponent(volume)}&creator=${creator}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d?.success && d.rollup) setRollup(d.rollup);
      })
      .catch(() => {
        if (!cancelled) setRollup(null);
      });
    return () => {
      cancelled = true;
    };
  }, [volume, creator]);

  const splitRows: [string, number, string][] = rollup
    ? [
        ["Creator (40%)", rollup.totalCreator, INK.cyan],
        ["Community (28.8%)", rollup.totalCommunity, INK.green],
        ["Protocol (net)", rollup.totalProtocol, INK.gold],
        ["Burned (Furnace)", rollup.totalBurn, INK.pink],
      ]
    : [];

  return (
    <div
      style={{
        background: INK.bgPanel,
        border: `1px solid ${INK.border}`,
        borderRadius: 16,
        padding: 18,
        fontFamily: INSTRUMENT_FONT,
        color: INK.white,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, color: INK.gold, textTransform: "uppercase" }}>
            5-Stream Revenue Engine
          </div>
          <div style={{ fontSize: 8, color: INK.muted, letterSpacing: 1, marginTop: 2 }}>
            One 1.88% fee · 40% creator / 28.8% community · Furnace burn ≤4.9%
          </div>
        </div>
      </div>

      {/* Stream ladder */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
        {REVENUE_STREAMS.map((s) => (
          <div
            key={s.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              padding: "8px 10px",
              background: INK.bgCard,
              border: `1px solid ${INK.border}`,
              borderRadius: 10,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: INK.white }}>{s.name}</div>
              <div style={{ fontSize: 8, color: INK.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {s.tagline}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: 7, color: INK.muted, fontFamily: INSTRUMENT_FONT }}>{s.contract}</span>
              <span
                style={{
                  fontSize: 7,
                  fontWeight: 900,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  padding: "2px 6px",
                  borderRadius: 4,
                  color: STATUS_COLOR[s.status] ?? INK.muted,
                  background: `${STATUS_COLOR[s.status] ?? INK.muted}18`,
                  border: `1px solid ${STATUS_COLOR[s.status] ?? INK.muted}40`,
                }}
              >
                {s.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Live split calculator */}
      <div style={{ borderTop: `1px solid ${INK.border}`, paddingTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 8, color: INK.muted, letterSpacing: 1, textTransform: "uppercase" }}>
            Volume / stream
          </span>
          <span style={{ fontSize: 12, fontWeight: 900, color: INK.gold }}>${fmt(volume)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={5_000_000}
          step={10_000}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          style={{ width: "100%", accentColor: INK.gold }}
          aria-label="Volume per stream"
        />

        <label style={{ display: "flex", alignItems: "center", gap: 6, margin: "8px 0", cursor: "pointer" }}>
          <input type="checkbox" checked={creator} onChange={(e) => setCreator(e.target.checked)} style={{ accentColor: INK.cyan }} />
          <span style={{ fontSize: 8, color: INK.muted }}>creator-made markets (route the 40% creator cut)</span>
        </label>

        {rollup && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "6px 0" }}>
              <span style={{ fontSize: 9, color: INK.muted, letterSpacing: 1, textTransform: "uppercase" }}>
                Gross fee (all streams)
              </span>
              <span style={{ fontSize: 14, fontWeight: 900, color: INK.white }}>${fmt(rollup.totalGrossFee)}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 8 }}>
              {splitRows.map(([label, val, color]) => (
                <div
                  key={label}
                  style={{ background: INK.bgCard, border: `1px solid ${INK.border}`, borderRadius: 8, padding: "8px 10px" }}
                >
                  <div style={{ fontSize: 13, fontWeight: 900, color }}>${fmt(val)}</div>
                  <div style={{ fontSize: 7, color: INK.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
