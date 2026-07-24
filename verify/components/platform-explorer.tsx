"use client";

/**
 * MAD Gambit — Platform Explorer (bridges the new hub → the /gambit demo).
 * ────────────────────────────────────────────────────────────────
 * A themed card grid for every tab/feature of the /gambit platform, each a real
 * link that deep-routes into that tab (/gambit?tab=X — the page reads the query on
 * load). Uses the EXACT lucide icon set the /gambit tab bar uses (ShieldAlert,
 * Layers, Trophy, Package, Ticket, Crown, Cpu) at instrument scale — no emoji.
 * Skin-aware; Casino is flagged Golden-Hand-gated like the live tab.
 */
import React from "react";
import { ShieldAlert, Layers, Trophy, Package, Ticket, Crown, Cpu, type LucideIcon } from "lucide-react";
import { useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";

interface TabCard {
  key: string;
  Icon: LucideIcon;
  name: string;
  blurb: string;
  gated?: boolean;
}

const TABS: TabCard[] = [
  { key: "floor", Icon: ShieldAlert, name: "The Floor", blurb: "Scandal Velocity · Prediction Circus · Z-Liar · Swap · Positions · Dopamine" },
  { key: "saga", Icon: Layers, name: "NFT Saga", blurb: "Card collection · evolution · saga episodes" },
  { key: "arena", Icon: Trophy, name: "Arena", blurb: "Named tournaments · Cull PvP" },
  { key: "packs", Icon: Package, name: "Packs", blurb: "Dutch auction · Golden Ticket pack opening" },
  { key: "portal", Icon: Ticket, name: "Portal", blurb: "Staking tiers · contribution connectors" },
  { key: "casino", Icon: Crown, name: "Casino", blurb: "Golden-Hand-gated provably-fair flip", gated: true },
  { key: "logic", Icon: Cpu, name: "Logic", blurb: "δ-limit · φ-shield · Futarchy · Bayesian tree · DAO sim" },
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
            style={{ display: "block", textDecoration: "none", background: skin.card, border: `1px solid ${t.gated ? `${skin.gold}88` : skin.border}`, borderRadius: 12, padding: "12px 14px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <t.Icon size={14} style={{ color: t.gated ? skin.gold : skin.accent, flex: "none" }} strokeWidth={2.25} />
              <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.2, color: skin.text, textTransform: "uppercase" }}>{t.name}</span>
              {t.gated ? (
                <span style={{ marginLeft: "auto", fontSize: 6.5, fontWeight: 900, letterSpacing: 0.5, textTransform: "uppercase", color: skin.gold, border: `1px solid ${skin.gold}66`, padding: "2px 6px", borderRadius: 5 }}>Gated</span>
              ) : null}
            </div>
            <div style={{ fontSize: 8.5, color: skin.muted, lineHeight: 1.45 }}>{t.blurb}</div>
            <div style={{ fontSize: 7.5, fontWeight: 900, letterSpacing: 1.2, textTransform: "uppercase", color: skin.accent, marginTop: 9 }}>Open →</div>
          </a>
        ))}
      </div>
    </div>
  );
}
