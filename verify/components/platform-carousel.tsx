"use client";

/**
 * MAD Gambit — Platform Pillar Carousel
 * ══════════════════════════════════════════════════════════════════
 * Right-to-left continuous scroll of the 4 core platform pillars:
 * Convictions, Predictions, Z-Liar Meter, Card-game. Each card is a
 * gold-cased instrument-panel tile, not a flat CSS card — matches the
 * fidelity standard set by gambit-instrument-cluster.tsx.
 *
 * "Right to left" = content visibly travels from right to left across
 * the viewport (items enter on the right, exit on the left), the
 * same physical motion as a stock ticker or news chyron.
 * ══════════════════════════════════════════════════════════════════ */

import React from "react";
import { GOLD_CHISEL_STOPS, INSTRUMENT_FONT, INK } from "@/lib/gambit-design-tokens";

interface PillarCard {
  id: string;
  title: string;
  stat: string;
  statLabel: string;
  color: string;
  glyph: string;
}

const PILLARS: PillarCard[] = [
  { id: "convictions", title: "CONVICTIONS", stat: "18",  statLabel: "OPEN CONVICTIONS",   color: "#ffcf40", glyph: "\u2696" },
  { id: "predictions", title: "PREDICTIONS", stat: "34",  statLabel: "ACTIVE PREDICTIONS",  color: "#00e5ff", glyph: "\u25CE" },
  { id: "zliar",       title: "Z-LIAR METER", stat: "88.5", statLabel: "CURRENT BS-INDEX",  color: "#ff007f", glyph: "\u26A0" },
  { id: "cardgame",    title: "CARD GAME",    stat: "992", statLabel: "CANONICAL DECK SIZE", color: "#00ff88", glyph: "\u2660" },
];

function GoldPillarTile({ pillar, uid }: { pillar: PillarCard; uid: string }) {
  return (
    <div
      style={{
        flex: "0 0 auto",
        width: "168px",
        background: INK.bgCard,
        border: `1px solid ${pillar.color}30`,
        borderRadius: "14px",
        overflow: "hidden",
        marginRight: "10px",
      }}
    >
      <svg width="100%" height="6" viewBox="0 0 168 6" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`pillar-gold-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
            {GOLD_CHISEL_STOPS.map(([offset, c]) => <stop key={offset} offset={`${offset}%`} stopColor={c} />)}
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="168" height="6" fill={`url(#pillar-gold-${uid})`} />
      </svg>

      <div style={{ padding: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ fontSize: "18px", color: pillar.color }}>{pillar.glyph}</span>
          <span style={{
            fontFamily: INSTRUMENT_FONT, fontSize: "7px", fontWeight: 800,
            color: pillar.color, letterSpacing: "1.5px",
          }}>
            {pillar.title}
          </span>
        </div>

        <div style={{
          fontFamily: INSTRUMENT_FONT, fontSize: "26px", fontWeight: 900,
          color: pillar.color, textShadow: `0 0 12px ${pillar.color}60`, lineHeight: 1,
        }}>
          {pillar.stat}
        </div>
        <div style={{
          fontFamily: INSTRUMENT_FONT, fontSize: "7px", color: INK.muted,
          letterSpacing: "0.5px", marginTop: "4px",
        }}>
          {pillar.statLabel}
        </div>
      </div>
    </div>
  );
}

export default function PlatformCarousel() {
  const loop = [...PILLARS, ...PILLARS, ...PILLARS];

  return (
    <div style={{ overflow: "hidden", padding: "10px 0" }}>
      <div
        style={{
          display: "flex",
          animation: "gambitPillarScroll 22s linear infinite",
          width: "max-content",
        }}
      >
        {loop.map((p, i) => (
          <GoldPillarTile key={`${p.id}-${i}`} pillar={p} uid={`pillar-${i}`} />
        ))}
      </div>
      <style>{`
        @keyframes gambitPillarScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  );
}
