"use client";

/**
 * MAD Gambit — perpetual NYSE-style ticker (very top of the app).
 * ────────────────────────────────────────────────────────────────
 * ONE perpetual right-to-left marquee that DOUBLE-TAP cycles through the three
 * feeds (worksheet item B: "make this into one perpetual ticker that upon double
 * tapping auto cycles through all three perpetual NYSE style tickers"):
 *   1 (gold) Crypto  BTC · ETH · SOL · XRP           → Featured Markets
 *   2 (cyan) Gambit  MADx · DEGEN · CHAOS · VOLUME    → Featured Markets
 *   3 (pink) Scandal live satirical headlines         → News feed
 * A left pill shows the active feed + 3 dots and also cycles on click (a
 * discoverable affordance for the double-tap gesture). Every quote/headline is a
 * real <button> that opens an explainer popup (what it measures + a jump link);
 * the row pauses on hover so a moving item is clickable. Seamless loop, values
 * are beta placeholders, reduced-motion safe.
 */
import React from "react";
import { useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";
import MetricPopover, { type MetricRow } from "@/components/metric-popover";
import { AutoShowcaseBadge } from "@/components/carousel";

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
  { symbol: "HOT", value: "Royal feud escalates into a docuseries" },
  { symbol: "CELEB", value: "Pop couple argues over one shared dessert" },
  { symbol: "TABLOID", value: "Mystery yacht photos spark three separate feuds" },
  { symbol: "CRYPTO", value: "Token rallies 40% on pure vibes" },
  { symbol: "POL", value: "Committee agrees only on the catering order" },
  { symbol: "VIRAL", value: "Cat interrupts live feed, becomes national icon" },
  { symbol: "GC", value: "GossipCop perp: is the empire saga forever?" },
];

// Each feed: its ticks, accent, jump target, marquee speed, and explainer copy.
interface Feed {
  key: string;
  label: string;
  items: Tick[];
  accentKey: "gold" | "accent" | "accent2";
  target: string;
  dur: number;
  title: string;
  blurb: string;
  rows: MetricRow[];
  ctaLabel: string;
}
const FEEDS: Feed[] = [
  {
    key: "crypto", label: "Crypto", items: CRYPTO, accentKey: "gold", target: "mg-featured", dur: 32,
    title: "Crypto prices",
    blurb: "Live spot quotes for the majors, the collateral behind on-platform markets. Beta placeholders today — wiring to Pyth / Chainlink price feeds.",
    rows: [
      { label: "Price", kind: "measured", note: "Last spot price from the oracle feed." },
      { label: "24h change", kind: "measured", note: "Percentage move over the trailing 24 hours." },
    ],
    ctaLabel: "View featured markets →",
  },
  {
    key: "gambit", label: "Gambit", items: GAMBIT, accentKey: "accent", target: "mg-featured", dur: 26,
    title: "MAD Gambit house metrics",
    blurb: "The platform's own tape: token price, degen momentum, the CHAOS index, and total market VOLUME. Beta placeholders until on-chain reads are wired.",
    rows: [
      { label: "MADx", kind: "measured", note: "MAD Gambit token spot price." },
      { label: "CHAOS", kind: "estimated", note: "Composite volatility/heat index across open markets." },
      { label: "VOLUME", kind: "measured", note: "Total value traded across all markets." },
    ],
    ctaLabel: "View featured markets →",
  },
  {
    key: "scandal", label: "Scandal", items: SCANDAL, accentKey: "accent2", target: "mg-news", dur: 38,
    title: "Live scandal wire",
    blurb: "The hottest satirical headlines right now, ranked by Heat — a traffic-value score led by cross-publisher pickup and estimated engagement. Click any card in the News Flow for its full Heat breakdown.",
    rows: [
      { label: "Cross-publisher pickup", kind: "measured", note: "How many distinct publishers ran a similar headline." },
      { label: "Engagement (likes · comments · views)", kind: "estimated", note: "Estimated until Reddit/X/YouTube counts are connected." },
      { label: "Freshness & satire", kind: "measured", note: "Recency plus the Z-Liar satire score." },
    ],
    ctaLabel: "Open the News Flow →",
  },
];

function jumpTo(id: string) {
  if (typeof document === "undefined") return;
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function CryptoTickerDual() {
  const { skin } = useSkin();
  const [idx, setIdx] = React.useState(0);
  const [info, setInfo] = React.useState(false);
  const feed = FEEDS[idx];
  const accent = feed.accentKey === "gold" ? skin.gold : feed.accentKey === "accent" ? skin.accent : skin.accent2;
  const cycle = () => { setInfo(false); setIdx((i) => (i + 1) % FEEDS.length); };
  const run = feed.items.concat(feed.items); // duplicated → seamless -50% loop

  return (
    <div style={{ width: "100%" }}>
      <div
        className="mg-ck-row"
        onDoubleClick={cycle}
        title="Double-tap to cycle tickers"
        style={{ display: "flex", alignItems: "stretch", background: skin.bg, borderBottom: `1px solid ${accent}55`, userSelect: "none" }}
      >
        {/* Feed selector pill — click cycles; mirrors the double-tap gesture. */}
        <button
          type="button"
          onClick={cycle}
          aria-label={`Ticker: ${feed.label}. Click to cycle feeds.`}
          title="Cycle tickers (or double-tap the ticker)"
          style={{ flex: "none", display: "flex", alignItems: "center", gap: 7, padding: "0 12px", background: `${accent}14`, border: "none", borderRight: `1px solid ${accent}44`, cursor: "pointer", fontFamily: INSTRUMENT_FONT }}
        >
          <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 0.5, textTransform: "uppercase", color: accent, textShadow: `0 0 8px ${accent}66`, whiteSpace: "nowrap" }}>{feed.label}</span>
          <span style={{ display: "inline-flex", gap: 3 }}>
            {FEEDS.map((f, i) => (
              <span key={f.key} style={{ width: 5, height: 5, borderRadius: "50%", background: i === idx ? accent : `${skin.muted}66`, boxShadow: i === idx ? `0 0 6px ${accent}` : "none" }} />
            ))}
          </span>
          <AutoShowcaseBadge label="Auto-cycling ticker" />
          <span style={{ fontSize: 9, color: `${accent}aa`, fontWeight: 900 }}>▸</span>
        </button>

        {/* The one perpetual marquee. */}
        <div style={{ flex: 1, minWidth: 0, overflow: "hidden", padding: "5px 0" }}>
          <div key={feed.key} className="mg-ck-track" style={{ display: "inline-flex", whiteSpace: "nowrap", willChange: "transform", animationDuration: `${feed.dur}s` }}>
            {run.map((t, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setInfo(true)}
                title={`${t.symbol} ${t.value ?? ""} ${t.change ?? ""} — how is this measured?`.replace(/\s+/g, " ").trim()}
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
      </div>

      <MetricPopover
        open={info}
        onClose={() => setInfo(false)}
        title={feed.title}
        blurb={feed.blurb}
        rows={feed.rows}
        cta={{ label: feed.ctaLabel, onClick: () => jumpTo(feed.target) }}
      />

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
