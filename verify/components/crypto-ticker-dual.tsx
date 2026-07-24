"use client";

/**
 * MAD Gambit — dual crypto/gambit ticker (mockup top strip).
 * ────────────────────────────────────────────────────────────────
 * Two stacked, perpetual NYSE-style marquee rows exactly as the mockup:
 *   row 1 (gold)  BTC · ETH · SOL · XRP  with % change
 *   row 2 (cyan)  MADx · DEGEN · CHAOS · VOLUME
 * Each quote is CLICKABLE (a real <button>) and smooth-scrolls to the Featured
 * Markets section. The row pauses on hover so a moving quote can be clicked.
 * Skin-aware, seamless loop (content duplicated), reduced-motion safe (CSS media
 * query stops the scroll). Values are beta placeholders — wire to a price feed later.
 */
import React from "react";
import { useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";

interface Tick {
  symbol: string;
  value?: string;
  change?: string;
  up?: boolean;
}

const CRYPTO: Tick[] = [
  { symbol: "BTC", value: "$69,420", change: "+4.2%", up: true },
  { symbol: "ETH", value: "$3,500", change: "+2.5%", up: true },
  { symbol: "SOL", value: "$180", change: "+5%", up: true },
  { symbol: "XRP", value: "$2.1", change: "+1.8%", up: true },
];

const GAMBIT: Tick[] = [
  { symbol: "MADx", value: "$0.85", change: "+12%", up: true },
  { symbol: "DEGEN", change: "+8.5%", up: true },
  { symbol: "CHAOS", value: "67%" },
  { symbol: "VOLUME", value: "$2.4M" },
];

function scrollToFeatured() {
  if (typeof document === "undefined") return;
  const el = document.getElementById("mg-featured");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function Row({ items, accent }: { items: Tick[]; accent: string }) {
  const { skin } = useSkin();
  const run = items.concat(items); // duplicated run → seamless -50% loop
  return (
    <div className="mg-ck-row" style={{ overflow: "hidden", background: skin.bg, borderBottom: `1px solid ${accent}55`, padding: "5px 0" }}>
      <div className="mg-ck-track" style={{ display: "inline-flex", whiteSpace: "nowrap", willChange: "transform" }}>
        {run.map((t, i) => (
          <button
            key={i}
            type="button"
            onClick={scrollToFeatured}
            title={`${t.symbol} ${t.value ?? ""} ${t.change ?? ""} — open markets`.replace(/\s+/g, " ").trim()}
            className="mg-ck-item"
            style={{
              display: "inline-flex",
              alignItems: "baseline",
              gap: 6,
              padding: "2px 16px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontFamily: INSTRUMENT_FONT,
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: 0.5,
            }}
          >
            <span style={{ color: accent, textShadow: `0 0 8px ${accent}66` }}>{t.symbol}</span>
            {t.value ? <span style={{ color: skin.text }}>{t.value}</span> : null}
            {t.change ? <span style={{ color: t.up ? skin.positive : skin.accent2, fontWeight: 900 }}>{t.change}</span> : null}
            <span style={{ color: `${accent}55`, marginLeft: 4 }}>|</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CryptoTickerDual() {
  const { skin } = useSkin();
  return (
    <div style={{ width: "100%" }}>
      <Row items={CRYPTO} accent={skin.gold} />
      <Row items={GAMBIT} accent={skin.accent} />
      <style>{`
        .mg-ck-track { animation: mgCkScroll 32s linear infinite; }
        .mg-ck-row:nth-of-type(2) .mg-ck-track { animation-duration: 26s; }
        .mg-ck-row:hover .mg-ck-track { animation-play-state: paused; }
        .mg-ck-item:hover { filter: brightness(1.25); }
        @keyframes mgCkScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) { .mg-ck-track { animation: none; } }
      `}</style>
    </div>
  );
}
