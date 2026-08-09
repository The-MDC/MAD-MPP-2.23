"use client";

/**
 * MAD Gambit — News Flow (mockup middle section).
 * ────────────────────────────────────────────────────────────────
 * Two big feature cards + a four-up tabloid rail. Copy swaps with the theme,
 * exactly like the mockup's two variants:
 *   Gilded Pop-Baroque → "Celebrity Meltdowns" / "Royal Rumors"
 *   Neon Noir Tabloid  → "Scandal Sheet" / "Gossip Gazette"
 * Imagery is branded gradient placeholders (no third-party photos) until the
 * real card/photo assets land via CARD_ART_CDN.
 */
import React from "react";
import { useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";

function ArtTile({ from, to, height }: { from: string; to: string; height: number }) {
  return (
    <div
      aria-hidden="true"
      style={{
        height,
        borderRadius: 12,
        background: `linear-gradient(135deg, ${from}, ${to})`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.18), transparent 55%)" }} />
    </div>
  );
}

export default function NewsFlowSection() {
  const { skin, name } = useSkin();
  const gilded = name === "gilded";
  const featureA = gilded ? "Celebrity Meltdowns" : "Scandal Sheet";
  const featureB = gilded ? "Royal Rumors" : "Gossip Gazette";
  const railTitle = gilded ? "Gilded Pop-Baroque" : "Neon Noir Tabloid";

  const rail: string[] = [
    "Boyfriend Revealed",
    "Explosive Interview",
    "The Interview",
    "Op-Baroque Hijinks",
  ];

  const feature = (title: string, cta: string, from: string, to: string) => (
    <div
      style={{
        flex: 1,
        minWidth: 240,
        background: skin.card,
        border: `1px solid ${skin.border}`,
        borderRadius: 16,
        overflow: "hidden",
        fontFamily: INSTRUMENT_FONT,
      }}
    >
      <div style={{ position: "relative" }}>
        <ArtTile from={from} to={to} height={150} />
        <div
          style={{
            position: "absolute",
            left: 14,
            bottom: 12,
            right: 14,
            fontSize: 20,
            fontWeight: 900,
            letterSpacing: 0.5,
            color: "#fff",
            textShadow: "0 2px 10px rgba(0,0,0,0.7)",
            textTransform: "uppercase",
            lineHeight: 1.1,
          }}
        >
          {title}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px" }}>
        <span style={{ fontSize: 8, color: skin.muted, textTransform: "uppercase", letterSpacing: 1 }}>{railTitle}</span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 900,
            color: skin.bg,
            background: skin.gold,
            padding: "4px 10px",
            borderRadius: 8,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          {cta}
        </span>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: INSTRUMENT_FONT }}>
      <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 2, color: skin.text, textTransform: "uppercase", margin: "0 0 12px 2px" }}>
        News Flow 📰
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 16 }}>
        {feature(featureA, "News", skin.accent2, skin.accent)}
        {feature(featureB, "Your Feed", skin.accent, skin.gold)}
      </div>

      <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.5, color: skin.accent, textTransform: "uppercase", margin: "0 0 10px 2px" }}>
        {railTitle}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 140px), 1fr))", gap: 12 }}>
        {rail.map((cap, i) => {
          const from = [skin.accent, skin.accent2, skin.gold, skin.accent][i % 4];
          const to = [skin.accent2, skin.gold, skin.accent, skin.accent2][i % 4];
          return (
            <div key={cap} style={{ background: skin.card, border: `1px solid ${skin.border}`, borderRadius: 12, overflow: "hidden" }}>
              <ArtTile from={from} to={to} height={110} />
              <div style={{ padding: "8px 10px", fontSize: 9, fontWeight: 700, color: skin.text, lineHeight: 1.3 }}>{cap}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
