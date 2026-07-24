"use client";

/**
 * MAD Gambit — /reports : platform analytics + live pulse, in the hub theme.
 */
import React from "react";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { SkinProvider, useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";
import AnalyticsDashboard from "@/components/analytics-dashboard";
import DopamineMetricsCarousel from "@/components/dopamine-metrics-carousel";

function ReportsInner() {
  const { skin } = useSkin();
  return (
    <main style={{ minHeight: "100vh", background: skin.bg, color: skin.text, fontFamily: INSTRUMENT_FONT, padding: "18px 16px 60px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <a href="/MPP2.23" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 9, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: skin.accent, textDecoration: "none" }}>
          <ArrowLeft size={12} /> Back to the Hub
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <BarChart3 size={22} style={{ color: skin.gold }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: 1.5, color: skin.gold, textTransform: "uppercase" }}>Reports</div>
            <div style={{ fontSize: 8.5, color: skin.muted, marginTop: 2 }}>Platform analytics · markets · bets · scandal signals (live from Neon; demo-safe).</div>
          </div>
        </div>
        <DopamineMetricsCarousel />
        <AnalyticsDashboard />
      </div>
    </main>
  );
}

export default function ReportsPage() {
  return (
    <SkinProvider>
      <ReportsInner />
    </SkinProvider>
  );
}
