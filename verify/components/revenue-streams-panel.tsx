"use client";

/**
 * MAD Gambit — 5-Stream Revenue Engine panel (Phase 4)
 * Shows the five revenue streams and a live fee-split calculator backed by
 * /api/v1/revenue (which uses the canonical splitFee + Furnace primitives).
 */
import React, { useState, useEffect } from "react";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";
import { useSkin } from "@/components/skin-provider";
import { REVENUE_STREAMS } from "@/lib/revenue-engine";

interface Rollup {
  totalVolume: number;
  totalGrossFee: number;
  totalCreator: number;
  totalCommunity: number;
  totalProtocol: number;
  totalBurn: number;
}

const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });

export default function RevenueStreamsPanel() {
  const { skin } = useSkin();
  const STATUS_COLOR: Record<string, string> = {
    live: skin.positive,
    partial: skin.gold,
    planned: skin.muted,
  };
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
        ["Creator (40%)", rollup.totalCreator, skin.accent],
        ["Community (28.8%)", rollup.totalCommunity, skin.positive],
        ["Protocol (net)", rollup.totalProtocol, skin.gold],
        ["Burned (Furnace)", rollup.totalBurn, skin.accent2],
      ]
    : [];

  return (
    <div
      style={{
        background: skin.panel,
        border: `1px solid ${skin.border}`,
        borderRadius: 16,
        padding: 18,
        fontFamily: INSTRUMENT_FONT,
        color: skin.text,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, color: skin.gold, textTransform: "uppercase" }}>
            5-Stream Revenue Engine
          </div>
          <div style={{ fontSize: 8, color: skin.muted, letterSpacing: 1, marginTop: 2 }}>
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
              background: skin.card,
              border: `1px solid ${skin.border}`,
              borderRadius: 10,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: skin.text }}>{s.name}</div>
              <div style={{ fontSize: 8, color: skin.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {s.tagline}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: 7, color: skin.muted, fontFamily: INSTRUMENT_FONT }}>{s.contract}</span>
              <span
                style={{
                  fontSize: 7,
                  fontWeight: 900,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  padding: "2px 6px",
                  borderRadius: 4,
                  color: STATUS_COLOR[s.status] ?? skin.muted,
                  background: `${STATUS_COLOR[s.status] ?? skin.muted}18`,
                  border: `1px solid ${STATUS_COLOR[s.status] ?? skin.muted}40`,
                }}
              >
                {s.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Live split calculator */}
      <div style={{ borderTop: `1px solid ${skin.border}`, paddingTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 8, color: skin.muted, letterSpacing: 1, textTransform: "uppercase" }}>
            Volume / stream
          </span>
          <span style={{ fontSize: 12, fontWeight: 900, color: skin.gold }}>${fmt(volume)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={5_000_000}
          step={10_000}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          style={{ width: "100%", accentColor: skin.gold }}
          aria-label="Volume per stream"
        />

        <label style={{ display: "flex", alignItems: "center", gap: 6, margin: "8px 0", cursor: "pointer" }}>
          <input type="checkbox" checked={creator} onChange={(e) => setCreator(e.target.checked)} style={{ accentColor: skin.accent }} />
          <span style={{ fontSize: 8, color: skin.muted }}>creator-made markets (route the 40% creator cut)</span>
        </label>

        {rollup && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "6px 0" }}>
              <span style={{ fontSize: 9, color: skin.muted, letterSpacing: 1, textTransform: "uppercase" }}>
                Gross fee (all streams)
              </span>
              <span style={{ fontSize: 14, fontWeight: 900, color: skin.text }}>${fmt(rollup.totalGrossFee)}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 8 }}>
              {splitRows.map(([label, val, color]) => (
                <div
                  key={label}
                  style={{ background: skin.card, border: `1px solid ${skin.border}`, borderRadius: 8, padding: "8px 10px" }}
                >
                  <div style={{ fontSize: 13, fontWeight: 900, color }}>${fmt(val)}</div>
                  <div style={{ fontSize: 7, color: skin.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
