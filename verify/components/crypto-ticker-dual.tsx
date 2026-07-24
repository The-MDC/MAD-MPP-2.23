"use client";

/**
 * MAD Gambit — dual crypto/gambit ticker (mockup top strip).
 * ────────────────────────────────────────────────────────────────
 * Two stacked marquee rows exactly as the mockup:
 *   row 1 (gold)  BTC · ETH · SOL · XRP  with % change
 *   row 2 (cyan)  MADx · DEGEN · CHAOS · VOLUME
 * Skin-aware, seamless loop (content duplicated), reduced-motion safe (CSS
 * media query pauses the scroll — no JS, SSR-clean). Values are noted-but-
 * convincing placeholders for beta; wire to a price feed later.
 */
import React from "react";
import { useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";

interface Tick {
  label: string;
  value?: string;
  change?: string;
  up?: boolean;
}

const CRYPTO: Tick[] = [
  { label: "BTC", value: "$69,420", change: "+4.2%", up: true },
  { label: "ETH", value: "$3,500", change: "+2.5%", up: true },
  { label: "SOL", value: "$180", change: "+5%", up: true },
  { label: "XRP", value: "$2.1", change: "+1.8%", up: true },
];

const GAMBIT: Tick[] = [
  { label: "MADx", value: "$0.85", change: "+12%", up: true },
  { label: "DEGEN", change: "+8.5%", up: true },
  { label: "CHAOS", value: "67%" },
  { label: "VOLUME", value: "$2.4M" },
];

function Row({ items, accent }: { items: Tick[]; accent: string }) {
  const { skin } = useSkin();
  // Duplicate the run so the -50% translate loops seamlessly.
  const run = items.concat(items);
  return (
    <div
      className="mg-ck-row"
      style={{
        overflow: "hidden",
        background: skin.bg,
        borderBottom: `1px solid ${accent}55`,
        padding: "6px 0",
      }}
    >
      <div className="mg-ck-track" style={{ display: "inline-flex", whiteSpace: "nowrap", willChange: "transform" }}>
        {run.map((t, i) => (
          <span
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "baseline",
              gap: 6,
              padding: "0 18px",
              fontFamily: INSTRUMENT_FONT,
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: 0.5,
            }}
          >
            <span style={{ color: accent, textShadow: `0 0 8px ${accent}66` }}>{t.label}</span>
            {t.value ? <span style={{ color: skin.text }}>{t.value}</span> : null}
            {t.change ? (
              <span style={{ color: t.up ? skin.positive : skin.accent2, fontWeight: 900 }}>{t.change}</span>
            ) : null}
            <span style={{ color: `${accent}55`, marginLeft: 4 }}>|</span>
          </span>
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
        @keyframes mgCkScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .mg-ck-track { animation: none; }
        }
      `}</style>
    </div>
  );
}
