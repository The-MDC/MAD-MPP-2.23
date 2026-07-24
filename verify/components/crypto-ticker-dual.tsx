"use client";

/**
 * MAD Gambit — perpetual NYSE-style triple ticker (very top of the app).
 * ────────────────────────────────────────────────────────────────
 * THREE clickable feeds, each a right-to-left perpetual marquee:
 *   1 (gold) Crypto  BTC · ETH · SOL · XRP           → jumps to Featured Markets
 *   2 (cyan) Gambit  MADx · DEGEN · CHAOS · VOLUME    → jumps to Featured Markets
 *   3 (pink) Scandal live satirical headlines         → jumps to the News feed
 * Every quote/headline is a real <button>; rows pause on hover so a moving item
 * is clickable. Seamless loop (content duplicated), reduced-motion safe. Values
 * are beta placeholders — wire to price/headline feeds later.
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
const SCANDAL: Tick[] = [
  { symbol: "🔥", value: "Royal feud escalates into a docuseries" },
  { symbol: "⭐", value: "Pop couple argues over one shared dessert" },
  { symbol: "🪙", value: "Token rallies 40% on pure vibes" },
  { symbol: "🏛️", value: "Committee agrees only on the catering order" },
  { symbol: "🗞️", value: "GossipCop perp: is the empire saga forever?" },
];

function jumpTo(id: string) {
  if (typeof document === "undefined") return;
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function Row({ items, accent, target, dur }: { items: Tick[]; accent: string; target: string; dur: number }) {
  const { skin } = useSkin();
  const run = items.concat(items); // duplicated → seamless -50% loop
  return (
    <div className="mg-ck-row" style={{ overflow: "hidden", background: skin.bg, borderBottom: `1px solid ${accent}55`, padding: "5px 0" }}>
      <div className="mg-ck-track" style={{ display: "inline-flex", whiteSpace: "nowrap", willChange: "transform", animationDuration: `${dur}s` }}>
        {run.map((t, i) => (
          <button
            key={i}
            type="button"
            onClick={() => jumpTo(target)}
            title={`${t.symbol} ${t.value ?? ""} ${t.change ?? ""}`.replace(/\s+/g, " ").trim()}
            className="mg-ck-item"
            style={{ display: "inline-flex", alignItems: "baseline", gap: 6, padding: "2px 16px", background: "transparent", border: "none", cursor: "pointer", fontFamily: INSTRUMENT_FONT, fontSize: 13, fontWeight: 900, letterSpacing: 0.5 }}
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
      <Row items={CRYPTO} accent={skin.gold} target="mg-featured" dur={32} />
      <Row items={GAMBIT} accent={skin.accent} target="mg-featured" dur={26} />
      <Row items={SCANDAL} accent={skin.accent2} target="mg-news" dur={38} />
      <style>{`
        .mg-ck-track { animation-name: mgCkScroll; animation-timing-function: linear; animation-iteration-count: infinite; }
        .mg-ck-row:hover .mg-ck-track { animation-play-state: paused; }
        .mg-ck-item:hover { filter: brightness(1.25); }
        @keyframes mgCkScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) { .mg-ck-track { animation: none; } }
      `}</style>
    </div>
  );
}
