"use client";

/**
 * MAD Gambit — Analytics Dashboard (V2)
 * Platform KPIs + 24h activity from the Data Platform (/api/v1/analytics/summary).
 * Skin-aware (neonNoir=INK); renders a clean empty state before any events exist.
 */
import React, { useEffect, useState } from "react";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";
import { useSkin } from "@/components/skin-provider";
import type { PlatformSummary } from "@/lib/data-platform/types";

const fmt = (n: number) => n.toLocaleString();

export default function AnalyticsDashboard() {
  const { skin } = useSkin();
  const [summary, setSummary] = useState<PlatformSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/analytics/summary")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d?.success && d.summary) setSummary(d.summary);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const maxHour = summary && summary.hourly.length ? Math.max(1, ...summary.hourly.map((h) => h.events)) : 1;
  const byType = summary ? Object.entries(summary.byType).sort((a, b) => b[1] - a[1]) : [];
  const empty = !summary || summary.totalEvents === 0;

  const cards: [string, string, string][] = [
    ["Events · 24h", summary ? fmt(summary.totalEvents) : "—", skin.accent],
    ["Unique wallets", summary ? fmt(summary.uniqueWallets) : "—", skin.positive],
    ["Event types", summary ? fmt(Object.keys(summary.byType).length) : "—", skin.gold],
    ["Window", summary ? `${summary.windowHours}h` : "—", skin.accent2],
  ];

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, color: skin.gold, textTransform: "uppercase" }}>
          Platform Analytics
        </div>
        {summary && (
          <span
            style={{
              fontSize: 7,
              fontWeight: 900,
              letterSpacing: 1,
              textTransform: "uppercase",
              padding: "2px 6px",
              borderRadius: 4,
              color: summary.source === "live" ? skin.positive : skin.muted,
              background: `${summary.source === "live" ? skin.positive : skin.muted}18`,
              border: `1px solid ${summary.source === "live" ? skin.positive : skin.muted}40`,
            }}
          >
            {summary.source}
          </span>
        )}
      </div>

      {/* KPI grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 8, marginBottom: 16 }}>
        {cards.map(([label, val, color]) => (
          <div key={label} style={{ background: skin.card, border: `1px solid ${skin.border}`, borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 20, fontWeight: 900, color }}>{val}</div>
            <div style={{ fontSize: 8, color: skin.muted, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* 24h activity bars */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 8, color: skin.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
          Activity · last 24h
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 48 }} aria-hidden="true">
          {(summary?.hourly ?? []).map((h, i) => (
            <div
              key={i}
              title={`${h.events} events`}
              style={{
                flex: 1,
                minWidth: 2,
                height: `${Math.max(4, (h.events / maxHour) * 100)}%`,
                background: `linear-gradient(to top, ${skin.accent}22, ${skin.accent})`,
                borderRadius: 1,
              }}
            />
          ))}
          {empty && <div style={{ fontSize: 9, color: skin.muted, alignSelf: "center" }}>No activity yet.</div>}
        </div>
      </div>

      {/* By-type breakdown */}
      <div>
        <div style={{ fontSize: 8, color: skin.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
          Top event types
        </div>
        {byType.length === 0 && (
          <div style={{ fontSize: 9, color: skin.muted }}>
            {loading ? "Loading…" : "None yet — emit events via POST /api/v1/data/events."}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {byType.slice(0, 8).map(([type, cnt]) => (
            <div key={type} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 9, color: skin.text }}>{type}</span>
              <span style={{ fontSize: 9, fontWeight: 900, color: skin.gold }}>{fmt(cnt)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
