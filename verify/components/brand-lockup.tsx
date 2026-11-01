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

export function BrandLockup({ primary, width = 300, align = "center" }: { primary: string; width?: number; align?: "center" | "left" }) {
  return (
    <svg viewBox="0 0 520 90" style={{ width, maxWidth: align === "center" ? "86%" : "100%", display: "block", margin: align === "center" ? "0 auto" : 0 }} aria-label="MAD Gambit">
      <defs>
        <linearGradient id="mg-gold-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f6d378" /><stop offset="25%" stopColor="#d69d41" />
          <stop offset="50%" stopColor="#a86821" /><stop offset="75%" stopColor="#f6d378" />
          <stop offset="100%" stopColor="#794816" />
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
  const p: [string, string][] = [["PREDICTION", "#fbbf24"], ["CONVICTION", "#fc3437"], ["AFFLICTION", "#c084fc"]];
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

/**
 * Compact top-left brand lockup for the header (worksheet item C): the official
 * MAD Gambit top-hat logo + the gold "MΛĐ Gambit" wordmark + the "Predict the
 * Scandal · Own the Culture" tagline — relocated here from the centre column.
 * If the logo asset is missing the mark degrades to the gilded gradient dot, so
 * the header never shows a broken image.
 */
export function BrandMark({ accent, gold }: { accent: string; gold: string }) {
  const [broken, setBroken] = React.useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
      {broken ? (
        <span aria-hidden="true" style={{ width: 40, height: 40, flex: "none", borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, ${gold}, ${accent})`, boxShadow: `0 0 10px ${gold}66` }} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/brand/mad-gambit-tophat.png"
          alt="MAD Gambit"
          width={40}
          height={40}
          onError={() => setBroken(true)}
          style={{ width: 40, height: 40, flex: "none", objectFit: "contain", filter: `drop-shadow(0 0 8px ${gold}55)` }}
        />
      )}
      <div style={{ minWidth: 0 }}>
        <BrandLockup primary={accent} width={140} align="left" />
        <div style={{ fontFamily: INSTRUMENT_FONT, fontSize: 7, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.24em", color: "#8a8a93", marginTop: 3, whiteSpace: "nowrap" }}>
          Predict the Scandal · Own the Culture
        </div>
      </div>
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
