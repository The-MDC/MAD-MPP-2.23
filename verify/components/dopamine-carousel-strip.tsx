"use client";

/**
 * MAD Gambit — Customizable Dopamine Carousel (mockup-faithful strip).
 * ────────────────────────────────────────────────────────────────
 * The four mockup cards — Active Bets (dice), Degen Streak (fire), Chaos Meter
 * (gauge), Top Gainers — plus the conviction and prediction-market desks, as a
 * horizontal arrow-scrollable carousel. Skin-aware. (The existing
 * DopamineMetricsCarousel is the data-wired analytics variant; this is the
 * pixel-faithful landing strip.)
 *
 * READINGS ARE PLACEHOLDERS. Every value below is a shaped demo constant, not a
 * measurement — this strip has no fetch. They are sized to be plausible so the
 * layout is honest about how wide each tile needs to be, and each carries its
 * definition as a tooltip so the desk reads correctly before it reads live.
 * Wiring order is in the header of each group.
 */
import React, { useRef } from "react";
import { Dices, Flame, type LucideIcon } from "lucide-react";
import { useSkin } from "@/components/skin-provider";
import { useAutoShowcase } from "@/components/carousel";
import {
  GlyphStyles, ConvictionCube, PredictionCoin, SentimentFaders,
  ImpressionRings, VelocityOrbit, LiquidityStack,
} from "@/components/dopamine-glyphs";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";

type GlyphKind = "cube" | "coin" | "faders" | "rings" | "orbit" | "stack";

interface DopCard {
  title: string;
  /** Bespoke CSS-3D glyph — one per platform-wide stat. */
  glyph?: GlyphKind;
  /** Desk this tile belongs to — rendered as the card's kicker. */
  kicker?: string;
  /** What the stat measures. Surfaced as the tile's tooltip. */
  sub?: string;
  Icon?: LucideIcon;
  iconColor?: "accent" | "accent2";
  value?: string;
  gauge?: number; // 0..100 → renders the chaos gauge
  gainers?: [string, string][];
}

/**
 * Platform-wide pulse — the whole estate in six readings, and the reason the
 * carousel leads with them: they are the only tiles that describe the platform
 * rather than a position in it. Each carries its own 3D glyph (see
 * dopamine-glyphs.tsx) chosen to argue its own stat, not merely to move.
 */
const PLATFORM: DopCard[] = [
  { kicker: "Platform", title: "Platform Conviction", glyph: "cube", value: "72%",
    sub: "Aggregate conviction weight held across every open market on the platform." },
  { kicker: "Platform", title: "Platform Prediction", glyph: "coin", value: "64% Yes",
    sub: "Volume-weighted YES lean across all binary prediction markets." },
  { kicker: "Platform", title: "Platform Sentiment", glyph: "faders", value: "+0.38",
    sub: "Net valence across the scandal signal feed, bullish minus bearish." },
  { kicker: "Platform", title: "Impressions · 24h", glyph: "rings", value: "8.4M",
    sub: "Total surfaced card, market and headline impressions in the last 24 hours." },
  { kicker: "Platform", title: "Signal Velocity", glyph: "orbit", value: "137/hr",
    sub: "New scored signals entering the classifier per hour, recency-weighted." },
  { kicker: "Platform", title: "Platform Liquidity", glyph: "stack", value: "$18.6M",
    sub: "Aggregate collateral standing behind every open position, all classes." },
];

/** The mockup's original four. */
const VIBE: DopCard[] = [
  { title: "Active Bets", Icon: Dices, iconColor: "accent", value: "3 Live" },
  { title: "Degen Streak", Icon: Flame, iconColor: "accent2", value: "5 Day Streak!" },
  { title: "Chaos Meter", gauge: 85, value: "85% Chaos" },
  { title: "Top Gainers", gainers: [["UserA", "+50%"], ["UserB", "+30%"], ["UserC", "+30%"]] },
];

/**
 * Conviction desk — how concentrated the book is and whether that concentration
 * is being rewarded. Wire from the conviction ledger + a benchmark series;
 * nothing here can be derived without a benchmark to difference against.
 */
const CONVICTION: DopCard[] = [
  { kicker: "Conviction", title: "Active Share", gauge: 78, value: "78%",
    sub: "Percentage of holdings that differ from the baseline benchmark index." },
  { kicker: "Conviction", title: "Top 10 Concentration", gauge: 46, value: "46%",
    sub: "Total capital allocated to the ten largest positions (typically over 40%)." },
  { kicker: "Conviction", title: "Tracking Error", value: "6.4%",
    sub: "Standard deviation of the return difference between portfolio and benchmark." },
  { kicker: "Conviction", title: "Hit Ratio", gauge: 63, value: "63%",
    sub: "Share of high-conviction trades generating positive absolute returns." },
  { kicker: "Conviction", title: "Win-Loss Ratio", value: "1.9×",
    sub: "Average profit of winning conviction calls vs average loss of unsuccessful ones." },
  { kicker: "Conviction", title: "Information Ratio", value: "0.82",
    sub: "Risk-adjusted return: active premium divided by tracking-error volatility." },
  { kicker: "Conviction", title: "Upside Capture", value: "108%",
    sub: "Portfolio performance against the benchmark while benchmark returns are positive." },
  { kicker: "Conviction", title: "Downside Capture", gauge: 84, value: "84%",
    sub: "How much of the market's losses the portfolio absorbs in negative periods." },
  { kicker: "Conviction", title: "Portfolio Beta", value: "1.14",
    sub: "Volatility and systemic risk of the concentrated basket vs the broader market." },
  { kicker: "Conviction", title: "R-Squared", gauge: 71, value: "71%",
    sub: "Share of portfolio movement directly explained by benchmark movement." },
  { kicker: "Conviction", title: "Active Weight Proxy", value: "+3.8%",
    sub: "Variance between an asset's portfolio weight and its benchmark weight." },
  { kicker: "Conviction", title: "Inflection Score", gauge: 74, value: "74",
    sub: "Operational readiness, capital commitment and demand validation — spots asset turns early." },
];

/**
 * Prediction-market desk — contract mechanics and liquidity, the inputs for
 * finding mispriced odds. Wire from perp-store + the order book; TTR and
 * conflict rate come off the resolution/oracle log.
 */
const MARKET: DopCard[] = [
  { kicker: "Market", title: "Implied Probability", gauge: 62, value: "62%",
    sub: "Current contract price converted to a crowdsourced 0–100% likelihood." },
  { kicker: "Market", title: "Open Interest", value: "$1.8M",
    sub: "Total locked capital actively held in live positions across a market." },
  { kicker: "Market", title: "24h Volume", value: "$2.4M",
    sub: "Total dollar amount of contracts bought and sold within 24 hours." },
  { kicker: "Market", title: "Liquidity Depth", value: "$312K",
    sub: "Volume available within 1–2% of the order-book spread." },
  { kicker: "Market", title: "Bid-Ask Spread", value: "1.4¢",
    sub: "Price gap between the highest buy order and the lowest sell order." },
  { kicker: "Market", title: "Trader Persistence", gauge: 57, value: "57%",
    sub: "Whether top-tier wallet addresses maintain winning streaks over time." },
  { kicker: "Market", title: "Whale Share", gauge: 23, value: "23%",
    sub: "Share of open interest held by the top 1% of wallets." },
  { kicker: "Market", title: "Total Value Locked", value: "$18.6M",
    sub: "Aggregate collateral deposited across the entire underlying event exchange." },
  { kicker: "Market", title: "Maker Fee Yield", value: "4.2%",
    sub: "Transactional revenue generated by liquidity providers inside automated pools." },
  { kicker: "Market", title: "Time-to-Resolution", value: "9d 04h",
    sub: "Remaining time before a contract transitions to final settlement." },
  { kicker: "Market", title: "Conflict Rate", value: "0.8%",
    sub: "Frequency of contested or delayed oracle payouts on the platform." },
  { kicker: "Market", title: "Volume / OI Ratio", value: "1.33×",
    sub: "Daily speculative noise (volume) against durable conviction capital (open interest)." },
];

// Platform-wide first: the estate before the position inside it.
const CARDS: DopCard[] = [...PLATFORM, ...VIBE, ...CONVICTION, ...MARKET];

function Gauge({ pct }: { pct: number }) {
  const { skin } = useSkin();
  const angle = -90 + (Math.min(100, Math.max(0, pct)) / 100) * 180; // -90..+90
  const color = pct > 66 ? skin.accent2 : pct > 33 ? skin.gold : skin.accent;
  return (
    <div style={{ width: 60, height: 34, margin: "8px auto 6px", position: "relative" }}>
      <svg width="60" height="34" viewBox="0 0 60 34" aria-hidden="true">
        <path d="M6 32 A24 24 0 0 1 54 32" fill="none" stroke={skin.card} strokeWidth="7" strokeLinecap="round" />
        <path d="M6 32 A24 24 0 0 1 54 32" fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * 75} 200`} />
        <line x1="30" y1="32" x2="30" y2="12" stroke="#fff" strokeWidth="2" strokeLinecap="round"
          transform={`rotate(${angle} 30 32)`} />
        <circle cx="30" cy="32" r="2.5" fill="#fff" />
      </svg>
    </div>
  );
}

export default function DopamineCarouselStrip() {
  const { skin } = useSkin();
  const ref = useRef<HTMLDivElement>(null);
  // The circled arrows are the platform's mark for a rail that showcases
  // itself, so this strip advances on its own — see components/carousel.tsx.
  const showcase = useAutoShowcase(ref, { gap: 11 });
  const nudge = (dir: number) => {
    if (ref.current) ref.current.scrollBy({ left: dir * 150, behavior: "smooth" });
  };

  const arrowStyle = (side: "l" | "r"): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: "absolute",
      top: "50%",
      transform: "translateY(-50%)",
      zIndex: 3,
      width: 28,
      height: 28,
      borderRadius: "50%",
      background: "rgba(0,0,0,0.7)",
      border: `1px solid ${skin.accent}`,
      color: skin.accent,
      cursor: "pointer",
      fontSize: 15,
      fontWeight: 900,
      lineHeight: "26px",
      textAlign: "center",
      padding: 0,
      fontFamily: INSTRUMENT_FONT,
    };
    if (side === "l") base.left = -8;
    else base.right = -8;
    return base;
  };

  /** Each glyph is bound to its stat, and to the skin's role colours. */
  const glyphFor = (g: GlyphKind) => {
    switch (g) {
      case "cube": return <ConvictionCube color={skin.accent} />;
      case "coin": return <PredictionCoin color={skin.positive} alt={skin.accent2} />;
      case "faders": return <SentimentFaders color={skin.accent} alt={skin.accent2} />;
      case "rings": return <ImpressionRings color={skin.gold} />;
      case "orbit": return <VelocityOrbit color={skin.accent} alt={skin.gold} />;
      case "stack": return <LiquidityStack color={skin.positive} />;
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <GlyphStyles />
      <button type="button" aria-label="Scroll left" onClick={() => nudge(-1)} style={arrowStyle("l")}>‹</button>
      <button type="button" aria-label="Scroll right" onClick={() => nudge(1)} style={arrowStyle("r")}>›</button>
      <div
        ref={ref}
        {...showcase}
        style={{ display: "flex", gap: 11, overflowX: "auto", scrollBehavior: "smooth", paddingBottom: 4, WebkitOverflowScrolling: "touch" }}
      >
        {CARDS.map((c) => (
          <div
            key={c.title}
            title={c.sub}
            style={{
              position: "relative",
              minWidth: 122,
              flex: "0 0 auto",
              background: skin.card,
              // Gold case, cyan legend — the card is brass with the readout lit
              // inside it, the same split the Seiko above it uses.
              border: `2px solid ${skin.gold}`,
              borderRadius: 14,
              padding: "13px 10px",
              textAlign: "center",
              boxShadow: `0 0 14px ${skin.gold}33, inset 0 0 18px ${skin.gold}0f`,
              fontFamily: INSTRUMENT_FONT,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Grip — this carousel is user-reorderable, and the handle is what says so. */}
            <span
              aria-hidden="true"
              style={{ position: "absolute", top: 7, left: 8, fontSize: 9, fontWeight: 900, lineHeight: 1, color: `${skin.muted}cc`, letterSpacing: -1 }}
            >
              ≡
            </span>
            {c.kicker ? (
              <div style={{ fontSize: 6.5, fontWeight: 800, letterSpacing: 1, color: skin.muted, textTransform: "uppercase", marginBottom: 3 }}>
                {c.kicker}
              </div>
            ) : null}
            <div style={{ fontSize: 11, fontWeight: 900, color: skin.accent, letterSpacing: 0.6, textTransform: "uppercase", lineHeight: 1.15, minHeight: 38 }}>
              {c.title}
            </div>
            {c.Icon ? (
              <div style={{ display: "flex", justifyContent: "center", margin: "10px 0" }} aria-hidden="true">
                <c.Icon size={26} strokeWidth={1.75} style={{ color: c.iconColor === "accent2" ? skin.accent2 : skin.accent, filter: `drop-shadow(0 0 6px ${c.iconColor === "accent2" ? skin.accent2 : skin.accent}66)` }} />
              </div>
            ) : null}
            {c.glyph ? glyphFor(c.glyph) : null}
            {typeof c.gauge === "number" ? <Gauge pct={c.gauge} /> : null}
            {c.gainers ? (
              <div style={{ fontSize: 10, fontWeight: 900, textAlign: "left", lineHeight: 1.6, color: skin.text, marginTop: 8 }}>
                {c.gainers.map(([u, g]) => (
                  <div key={u}>
                    {u} <span style={{ color: skin.positive }}>{g}</span>
                  </div>
                ))}
              </div>
            ) : null}
            {c.value ? (
              <div style={{ marginTop: "auto", paddingTop: 6, fontSize: 10.5, fontWeight: 900, color: skin.gold, textTransform: "uppercase", textShadow: `0 0 8px ${skin.gold}55` }}>
                {c.value}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
