"use client";

/**
 * MAD Gambit — gold-chisel brand lockup + Trinity tagline.
 * ────────────────────────────────────────────────────────────────
 * The EXACT MΛĐ Gambit hero lockup from /gambit (same gold-chisel gradient stops,
 * Georgia serif, lightning bolt, glow filter — svg ids namespaced so both pages can
 * coexist), plus the PREDICTION · CONVICTION · AFFLICTION trinity line. This is the
 * /gambit identity ported verbatim into the hub, not a redraw.
 */
import React from "react";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";

export function BrandLockup({ primary, width = 300 }: { primary: string; width?: number }) {
  return (
    <svg viewBox="0 0 520 90" style={{ width, maxWidth: "86%", display: "block", margin: "0 auto" }} aria-label="MAD Gambit">
      <defs>
        <linearGradient id="mg-gold-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fffcf0" /><stop offset="25%" stopColor="#efc76d" />
          <stop offset="50%" stopColor="#ab7b29" /><stop offset="75%" stopColor="#f7d983" />
          <stop offset="100%" stopColor="#5c3c04" />
        </linearGradient>
        <filter id="mg-g-glow"><feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <text x="6" y="68" fontFamily="Georgia,serif" fontSize="72" fontWeight="900" letterSpacing="3"
        fill="url(#mg-gold-g)" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.9))">MΛĐ</text>
      <g filter="url(#mg-g-glow)">
        <polygon points="218,18 240,72 222,72 246,118 210,80 226,80"
          transform="translate(0,-14) scale(0.62) translate(150,10)" fill={primary} />
      </g>
      <text x="232" y="68" fontFamily="Georgia,serif" fontSize="72" fontWeight="900" letterSpacing="1"
        fill="url(#mg-gold-g)" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.9))">Gambit</text>
    </svg>
  );
}

export function Trinity() {
  const p: [string, string][] = [["PREDICTION", "#fbbf24"], ["CONVICTION", "#ec4899"], ["AFFLICTION", "#c084fc"]];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 12, fontFamily: INSTRUMENT_FONT }}>
      {p.map(([l, c], i) => (
        <React.Fragment key={l}>
          <span style={{ fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.25em", color: c, textShadow: `0 0 12px ${c}55` }}>{l}</span>
          {i < 2 ? <span style={{ color: "#3f3f46" }}>·</span> : null}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function BrandHero({ primary }: { primary: string }) {
  return (
    <div style={{ textAlign: "center", padding: "6px 0 2px" }}>
      <BrandLockup primary={primary} width={320} />
      <div style={{ fontFamily: INSTRUMENT_FONT, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.35em", color: "#6b7280", marginTop: 8 }}>
        Predict the Scandal · Own the Culture
      </div>
      <Trinity />
    </div>
  );
}
