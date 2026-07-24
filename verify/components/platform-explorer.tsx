"use client";

/**
 * MAD Gambit — Platform Explorer (bridges the new hub → the /gambit demo).
 * ────────────────────────────────────────────────────────────────
 * A themed card grid for every tab/feature of the /gambit platform, each a real
 * link that deep-routes into that tab (/gambit?tab=X — the page reads the query on
 * load). Brings every demo feature into the new theme/structure as one click-through
 * surface. Skin-aware; Casino is flagged Golden-Hand-gated like the live tab.
 */
import React from "react";
import { useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";

interface Tab {
  key: string;
  icon: string;
  name: string;
  blurb: string;
  gated?: boolean;
}

const TABS: Tab[] = [
  { key: "floor", icon: "🎰", name: "The Floor", blurb: "Scandal Velocity · Prediction Circus · Z-Liar · Swap · Positions · Dopamine" },
  { key: "saga", icon: "🃏", name: "NFT Saga", blurb: "Card collection · evolution · saga episodes" },
  { key: "arena", icon: "⚔️", name: "Arena", blurb: "Named tournaments · Cull PvP" },
  { key: "packs", icon: "📦", name: "Packs", blurb: "Dutch auction · Golden Ticket pack opening" },
  { key: "portal", icon: "🌀", name: "Portal", blurb: "Staking tiers · contribution connectors" },
  { key: "casino", icon: "👑", name: "Casino", blurb: "Golden-Hand-gated provably-fair flip", gated: true },
  { key: "logic", icon: "🧠", name: "Logic", blurb: "δ-limit · φ-shield · Futarchy · Bayesian tree · DAO sim" },
];

export default function PlatformExplorer() {
  const { skin } = useSkin();
  return (
    <div style={{ fontFamily: INSTRUMENT_FONT }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "0 0 4px 2px" }}>
        <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 2, color: skin.gold, textTransform: "uppercase" }}>
          Enter the Platform
        </div>
        <a href="/gambit" style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: skin.accent, textDecoration: "none" }}>
          Open /gambit →
        </a>
      </div>
      <div style={{ fontSize: 8, color: skin.muted, margin: "0 0 12px 2px" }}>
        Every platform tab, one click away — deep-links straight into the feature.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 12 }}>
        {TABS.map((t) => (
          <a
            key={t.key}
            href={`/gambit?tab=${t.key}`}
            style={{ display: "block", textDecoration: "none", background: skin.card, border: `1px solid ${t.gated ? skin.gold : skin.border}`, borderRadius: 14, padding: 14, boxShadow: t.gated ? `0 0 14px ${skin.gold}22` : "none" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 6 }}>
              <span style={{ fontSize: 22 }} aria-hidden="true">{t.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 900, letterSpacing: 0.5, color: skin.gold, textTransform: "uppercase" }}>{t.name}</span>
              {t.gated ? (
                <span style={{ marginLeft: "auto", fontSize: 6.5, fontWeight: 900, letterSpacing: 0.5, textTransform: "uppercase", color: skin.bg, background: skin.gold, padding: "2px 6px", borderRadius: 5 }}>Gated</span>
              ) : null}
            </div>
            <div style={{ fontSize: 8.5, color: skin.muted, lineHeight: 1.4 }}>{t.blurb}</div>
            <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: skin.accent, marginTop: 10 }}>Open →</div>
          </a>
        ))}
      </div>
    </div>
  );
}
