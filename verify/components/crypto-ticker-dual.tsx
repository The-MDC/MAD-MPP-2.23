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
import MetricPopover, { type MetricRow } from "@/components/metric-popover";

interface Tick {
  symbol: string;
  value?: string;
  change?: string;
  up?: boolean;
}

// Each ticker row explains what it measures (worksheet: every ticker item is
// clickable and opens a popup explaining how it's measured, plus a link on).
interface TickerInfo {
  title: string;
  blurb: string;
  rows: MetricRow[];
  ctaLabel: string;
}
const INFO: Record<string, TickerInfo> = {
  crypto: {
    title: "Crypto prices",
    blurb: "Live spot quotes for the majors, the collateral behind on-platform markets. Beta placeholders today — wiring to Pyth / Chainlink price feeds.",
    rows: [
      { label: "Price", kind: "measured", note: "Last spot price from the oracle feed." },
      { label: "24h change", kind: "measured", note: "Percentage move over the trailing 24 hours." },
    ],
    ctaLabel: "View featured markets →",
  },
  gambit: {
    title: "MAD Gambit house metrics",
    blurb: "The platform's own tape: token price, degen momentum, the CHAOS index, and total market VOLUME. Beta placeholders until on-chain reads are wired.",
    rows: [
      { label: "MADx", kind: "measured", note: "MAD Gambit token spot price." },
      { label: "CHAOS", kind: "estimated", note: "Composite volatility/heat index across open markets." },
      { label: "VOLUME", kind: "measured", note: "Total value traded across all markets." },
    ],
    ctaLabel: "View featured markets →",
  },
  scandal: {
    title: "Live scandal wire",
    blurb: "The hottest satirical headlines right now, ranked by Heat — a traffic-value score led by cross-publisher pickup and estimated engagement. Click any card in the News Flow for its full Heat breakdown.",
    rows: [
      { label: "Cross-publisher pickup", kind: "measured", note: "How many distinct publishers ran a similar headline." },
      { label: "Engagement (likes · comments · views)", kind: "estimated", note: "Estimated until Reddit/X/YouTube counts are connected." },
      { label: "Freshness & satire", kind: "measured", note: "Recency plus the Z-Liar satire score." },
    ],
    ctaLabel: "Open the News Flow →",
  },
};

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

function jumpTo(id: string) {
  if (typeof document === "undefined") return;
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function Row({ items, accent, target, dur, onPick }: { items: Tick[]; accent: string; target: string; dur: number; onPick: () => void }) {
  const { skin } = useSkin();
  const run = items.concat(items); // duplicated → seamless -50% loop
  return (
    <div className="mg-ck-row" style={{ overflow: "hidden", background: skin.bg, borderBottom: `1px solid ${accent}55`, padding: "5px 0" }}>
      <div className="mg-ck-track" style={{ display: "inline-flex", whiteSpace: "nowrap", willChange: "transform", animationDuration: `${dur}s` }}>
        {run.map((t, i) => (
          <button
            key={i}
            type="button"
            onClick={onPick}
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
  );
}

export default function CryptoTickerDual() {
  const { skin } = useSkin();
  const [info, setInfo] = React.useState<{ key: keyof typeof INFO; target: string } | null>(null);
  const active = info ? INFO[info.key] : null;
  return (
    <div style={{ width: "100%" }}>
      <Row items={CRYPTO} accent={skin.gold} target="mg-featured" dur={32} onPick={() => setInfo({ key: "crypto", target: "mg-featured" })} />
      <Row items={GAMBIT} accent={skin.accent} target="mg-featured" dur={26} onPick={() => setInfo({ key: "gambit", target: "mg-featured" })} />
      <Row items={SCANDAL} accent={skin.accent2} target="mg-news" dur={38} onPick={() => setInfo({ key: "scandal", target: "mg-news" })} />
      <MetricPopover
        open={!!active}
        onClose={() => setInfo(null)}
        title={active?.title ?? ""}
        blurb={active?.blurb ?? ""}
        rows={active?.rows}
        cta={info ? { label: active!.ctaLabel, onClick: () => jumpTo(info.target) } : undefined}
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
