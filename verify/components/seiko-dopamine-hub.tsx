"use client";

/**
 * MAD Gambit — Seiko Clock + Customizable Dopamine Carousel Hub
 * ──────────────────────────────────────────────────────────────
 * Carbon-copy port of the product_dev/theme_mockup_2New_dopamine_gold.png
 * and product_dev/LandingPage_and_Dashboard_Layout_MADHATs.png visual reference.
 *
 * VISUAL SPEC (from image OCR + pixel analysis):
 *   TOP TICKER BAR  — full-width dark strip, scrolling crypto prices left + MADX/CHAOS right
 *   CLOCK           — large monospace digital "14:32:45" readout in neon gold, top-right
 *   SECTION HEADER  — "CUSTOMIZABLE DOPAMINE CAROUSEL" — gold monospace uppercase
 *   4 CAROUSEL TILES — ACTIVE BETS / DEGEN STREAK / CHAOS METER / TOP GAINERS
 *   MARKET CARDS ROW — 3 horizontal featured bet cards, YES/NO buttons, BET NOW CTA
 *
 * COLOR PALETTE (exact from images):
 *   Deep black bg:  #080a12
 *   Gold:           #d69d41
 *   Cyan:           #00e5ff
 *   Neon pink:      #f5242a
 *   Green positive: #00ff88
 *   White text:     #f0f0f8
 *
 * Source: product_dev folder, Google Drive — April 2026
 *         ChaosMeter.kt (MAD-MPP-2.23) for radial gauge geometry
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useGame } from "@/context/game-context";
import { PLATFORM, STAKING_TIERS, getStakingTier } from "@/lib/gambit-game-math";
import GambitInstrumentCluster from "@/components/gambit-instrument-cluster";
import PlatformCarousel from "@/components/platform-carousel";
import UnpackedCardsCarousel from "@/components/unpacked-cards-carousel";
import SeikoFlipClock from "@/components/seiko-flip-clock";
import { INK as T } from "@/lib/gambit-design-tokens";
import { FEATURED_DEMO_MARKETS } from "@/lib/demo-markets";

/* ── DESIGN TOKENS ───────────────────────────────────────────
 * Palette now sourced from lib/gambit-design-tokens.ts (INK), imported above
 * as `T` — the mockup colors live in exactly one place instead of being
 * re-declared here. INK is a superset of the keys this file uses. */

/* ── TICKER PRICES — live-simulated ──────────────────────────── */
const TICKER_BASE = [
  { sym: "BTC", price: 69420, pct: 4.2 },
  { sym: "ETH", price: 3500, pct: 2.5 },
  { sym: "SOL", price: 180, pct: 5.0 },
  { sym: "XRP", price: 2.1, pct: -1.2 },
  { sym: "MADX", price: 0.85, pct: 12.0 },
  { sym: "DEGEN", price: 0.0042, pct: 8.5 },
];

/* ── FEATURED MARKETS — canonical MAD Gambit format ─────────── */
// Copy comes from lib/demo-markets. This panel held the second of three
// hardcoded copies, and the one that still dated the Elon market to 2024.
const FEATURED_MARKETS = FEATURED_DEMO_MARKETS.map((m) => ({
  id: m.id,
  q: m.question.toUpperCase(),
  yes: m.yes,
  no: m.no,
  pool: m.pool ?? "—",
  hot: m.hot ?? false,
}));

/* NOTE: The flat-text SeikoClock component was removed here. It rendered
 * HH:MM:SS as glowing monospace text — no gold case, no real digit
 * segments, and it showed clock time instead of platform KPIs. Replaced
 * by GambitInstrumentCluster (components/gambit-instrument-cluster.tsx),
 * the canonical gold-cased LED odometer + analog gauge component. */

/* ══════════════════════════════════════════════════════════════
 * SUB-COMPONENT: Scrolling Ticker Bar
 * Exact from image: single-line dark strip, left = crypto prices, right = MADx/CHAOS
 * ══════════════════════════════════════════════════════════════ */
/* Market-energy equalizer — audio-visualizer bars beneath the golden ticker. */
function EqualizerStrip() {
  const BARS = 44;
  // The first paint is a pure function of the bar index. It used to be Math.random(), so the server's
  // heights never matched the client's and React logged a hydration mismatch on every load of the hub.
  // (Rounded so two JS engines can't disagree in the last digit.) The motion starts after mount.
  const [heights, setHeights] = useState<number[]>(() =>
    Array.from({ length: BARS }, (_, i) => Math.round((0.3 + Math.abs(Math.sin(i * 1.7)) * 0.4) * 1e4) / 1e4));
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setHeights(prev => prev.map((h, i) => {
        const target = 0.15 + Math.abs(Math.sin(Date.now() / 400 + i * 0.5)) * 0.85;
        return h + (target - h) * 0.5;
      }));
    }, 90);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ width: "100%", height: "22px", display: "flex", alignItems: "flex-end", justifyContent: "space-between",
      gap: "1px", padding: "0 10px 3px", background: `${T.bgPanel}cc`, borderBottom: `1px solid ${T.border}`, overflow: "hidden" }}
      aria-hidden="true">
      {heights.map((h, i) => {
        const c = i % 3 === 0 ? T.gold : i % 3 === 1 ? T.cyan : T.pink;
        return <div key={i} style={{ flex: 1, height: `${Math.max(8, h * 100)}%`, background: `linear-gradient(to top, ${c}22, ${c})`,
          borderRadius: "1px", boxShadow: `0 0 4px ${c}88`, transition: "height 0.09s linear" }} />;
      })}
    </div>
  );
}

function TickerBar() {
  const [prices, setPrices] = useState(TICKER_BASE);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const jitter = setInterval(() => {
      setPrices(p =>
        p.map(t => ({
          ...t,
          price: t.price * (1 + (Math.random() - 0.498) * 0.002),
          pct: t.pct + (Math.random() - 0.5) * 0.1,
        }))
      );
    }, 3000);
    return () => clearInterval(jitter);
  }, []);

  const items = [...prices, ...prices]; // duplicate for seamless loop

  return (
    <div
      style={{
        width: "100%",
        background: `${T.bgDeep}ee`,
        borderBottom: `1px solid ${T.border}`,
        overflow: "hidden",
        height: "28px",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div
        ref={barRef}
        style={{
          display: "flex",
          gap: "0px",
          animation: "tickerScroll 28s linear infinite",
          whiteSpace: "nowrap",
          willChange: "transform",
        }}
      >
        {items.map((t, i) => (
          <span
            key={i}
            style={{
              padding: "0 16px",
              fontFamily: "ui-monospace, monospace",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.05em",
              color: T.white,
            }}
          >
            <span style={{ color: T.muted }}>{t.sym} </span>
            <span>${t.price < 1 ? t.price.toFixed(4) : t.price.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
            <span style={{ color: t.pct >= 0 ? T.green : T.pink, marginLeft: "4px" }}>
              {t.pct >= 0 ? "▲" : "▼"}{Math.abs(t.pct).toFixed(1)}%
            </span>
            <span style={{ color: T.border, margin: "0 6px" }}>│</span>
          </span>
        ))}
      </div>

      <style>{`
        @keyframes tickerScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
 * SUB-COMPONENT: Featured Market Card
 * Exact from image: dark card, bold question text, YES/NO buttons with multipliers
 * ══════════════════════════════════════════════════════════════ */
function MarketCard({ market, onBet }: {
  market: typeof FEATURED_MARKETS[number];
  onBet: (id: string, side: "YES" | "NO") => void;
}) {
  const [hover, setHover] = useState<"YES" | "NO" | null>(null);
  const [clicked, setClicked] = useState<"YES" | "NO" | null>(null);

  const handleBet = (side: "YES" | "NO") => {
    setClicked(side);
    onBet(market.id, side);
    setTimeout(() => setClicked(null), 800);
  };

  return (
    <div
      style={{
        flex: "1 1 0",
        minWidth: "160px",
        background: T.bgCard,
        border: `1px solid ${market.hot ? T.borderGold : T.border}`,
        borderRadius: "14px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: market.hot ? `0 0 24px ${T.gold}15` : "none",
        transition: "transform 0.15s, box-shadow 0.15s",
        cursor: "default",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
    >
      {/* Hot badge */}
      {market.hot && (
        <div style={{
          padding: "3px 10px",
          background: `linear-gradient(135deg, ${T.gold}30, ${T.pink}20)`,
          borderBottom: `1px solid ${T.borderGold}`,
          fontFamily: "ui-monospace, monospace",
          fontSize: "8px",
          fontWeight: 900,
          color: T.gold,
          letterSpacing: "1.5px",
          textAlign: "center",
        }}>
          🔥 HOT MARKET
        </div>
      )}

      {/* Question */}
      <div style={{ padding: "12px 12px 8px" }}>
        <p style={{
          margin: 0,
          fontFamily: "ui-monospace, monospace",
          fontSize: "11px",
          fontWeight: 800,
          color: T.white,
          lineHeight: 1.4,
          letterSpacing: "0.03em",
          textTransform: "uppercase",
        }}>
          {market.q}
        </p>
        <p style={{
          margin: "4px 0 0",
          fontFamily: "ui-monospace, monospace",
          fontSize: "9px",
          color: T.muted,
          letterSpacing: "0.5px",
        }}>
          POOL: {market.pool} $MADx
        </p>
      </div>

      {/* YES / NO buttons */}
      <div style={{ padding: "0 8px 10px", display: "flex", gap: "6px" }}>
        {(["YES", "NO"] as const).map(side => {
          const mult = side === "YES" ? market.yes : market.no;
          const isYes = side === "YES";
          const color = isYes ? T.cyan : T.pink;
          const isHov = hover === side;
          const isClk = clicked === side;
          return (
            <button
              key={side}
              onClick={() => handleBet(side)}
              onMouseEnter={() => setHover(side)}
              onMouseLeave={() => setHover(null)}
              style={{
                flex: 1,
                padding: "7px 4px",
                background: isClk
                  ? color + "40"
                  : isHov
                  ? color + "25"
                  : color + "12",
                border: `1px solid ${isHov || isClk ? color + "80" : color + "30"}`,
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1px",
                transition: "all 0.15s",
                transform: isClk ? "scale(0.96)" : "scale(1)",
              }}
            >
              <span style={{ fontFamily: "ui-monospace, monospace", fontSize: "10px", fontWeight: 900, color, letterSpacing: "1px" }}>
                {side}
              </span>
              <span style={{ fontFamily: "ui-monospace, monospace", fontSize: "12px", fontWeight: 900, color }}>
                {mult}x
              </span>
            </button>
          );
        })}
      </div>

      {/* BET NOW CTA */}
      <div style={{ padding: "0 8px 10px" }}>
        <button
          onClick={() => handleBet("YES")}
          style={{
            width: "100%",
            padding: "7px",
            background: `linear-gradient(135deg, ${T.gold}25, ${T.cyan}15)`,
            border: `1px solid ${T.gold}40`,
            borderRadius: "8px",
            fontFamily: "ui-monospace, monospace",
            fontSize: "10px",
            fontWeight: 900,
            color: T.gold,
            letterSpacing: "2px",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `linear-gradient(135deg, ${T.gold}40, ${T.cyan}25)`; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = `linear-gradient(135deg, ${T.gold}25, ${T.cyan}15)`; }}
        >
          BET NOW
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
 * MAIN COMPONENT: SeikoDopamineHub
 * ══════════════════════════════════════════════════════════════ */
export default function SeikoDopamineHub({
  uid = "floor-hero",
  showTicker = true,
  showFeatured = true,
  showUnpacked = true,
}: {
  /** Distinguishes the cluster's element ids when a page mounts more than one. */
  uid?: string;
  /** The crypto price strip across the top. /preview already opens with the dual
   *  ticker, so it hides this copy; /mpp2.23 has no other, so it keeps it. */
  showTicker?: boolean;
  /** The two-up demo market cards. /preview has the full FeaturedMarketCards. */
  showFeatured?: boolean;
  /** The unpacked-cards row. /preview mounts the full carousel in the game block. */
  showUnpacked?: boolean;
}) {
  const { madCredits } = useGame();

  const stakingTier = getStakingTier(madCredits);

  const handleBet = useCallback((id: string, side: "YES" | "NO") => {
    // In prod: call openPosition(). Here: flash feedback only.
    console.debug(`[MAD Gambit] BET ${side} on market ${id}`);
  }, []);

  return (
    <div
      style={{
        background: T.bgDeep,
        border: `1px solid ${T.border}`,
        borderRadius: "16px",
        overflow: "hidden",
        fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
      }}
      className="animate-dramatic"
    >
      {/* ── 1. SCROLLING TICKER BAR ────────────────────────── */}
      {showTicker ? <TickerBar /> : null}

      {/* ── 1b. MARKET-ENERGY EQUALIZER — sits below the golden ticker ── */}
      <EqualizerStrip />

      {/* ── 2. INSTRUMENT CLUSTER — dials flank the chrono, which is the
          cluster's centre slot. The hub used to stack its own two-line title
          above the cluster's two-line title; the cluster now carries the only
          two lines, so the dials sit directly under the equalizer. The chrono
          `fit`s the row, so its case runs to the section's padding.
          3 independently customizable 2-digit KPI pods + 2 independently
          customizable analog dials, all center-aligned, gold-cased.
          Tap any dot beneath a pod/dial to swap what it shows.
          See gambit-instrument-cluster.tsx for the full rationale. */}
      <div style={{ padding: "8px 16px 16px", borderBottom: `1px solid ${T.border}` }}>
        <GambitInstrumentCluster
          uid={uid}
          eyebrow="MAD GAMBIT · CUSTOMIZABLE MARKET CAROUSEL"
          caption={<>{PLATFORM.FEE_BPS / 100}% FEE &middot; SPLIT-FLAP CHRONO &middot; 2 DIALS &middot; TAP A DOT TO SWAP</>}
          centerSlot={<SeikoFlipClock label="MAD·STATE · TAP A DOT TO PIN" scale={1.2} fit />}
        />
      </div>

      {/* ── 3. PLATFORM STAT CARDS — right-to-left continuous scroll ──
          Convictions / Predictions / Z-Liar / Card game, then the player's own
          Active Bets / Degen Streak / Chaos Meter / Ladder. The second four
          were a separate strip of tiles here; they are now cards in this one. */}
      <div style={{ borderBottom: showFeatured || showUnpacked ? `1px solid ${T.border}` : "none" }}>
        <PlatformCarousel />
      </div>

      {/* ── 4. FEATURED MARKET CARDS ─────────────────────── */}
      {showFeatured ? (
        <div style={{ padding: "12px 16px 16px" }}>
          <div style={{
            fontFamily: "ui-monospace, monospace",
            fontSize: "9px",
            fontWeight: 800,
            color: T.gold,
            letterSpacing: "2px",
            marginBottom: "10px",
          }}>
            FEATURED MARKET CARDS
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "10px",
            paddingBottom: "4px",
          }}>
            {FEATURED_MARKETS.map(m => (
              <MarketCard key={m.id} market={m} onBet={handleBet} />
            ))}
          </div>
        </div>
      ) : null}

      {/* ── 4b. UNPACKED CARDS CAROUSEL — auto-scroll, pause on hover ──── */}
      {showUnpacked ? (
        <div style={{ padding: "8px 16px 4px", borderTop: `1px solid ${T.border}` }}>
          <UnpackedCardsCarousel count={8} />
        </div>
      ) : null}

      {/* MADHAT'r concierge moved to page root — see app/gambit/page.tsx.
          It's a position:fixed floating widget now, not an embedded panel,
          so it must render once outside this scrolling hub, not nested here. */}

      {/* ── 5. STATUS BAR ────────────────────────────────── */}
      <div style={{
        borderTop: `1px solid ${T.border}`,
        padding: "8px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "8px",
      }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span style={{ fontSize: "9px", color: T.muted }}>BALANCE</span>
          <span style={{ fontSize: "11px", fontWeight: 900, color: T.white }}>{madCredits.toLocaleString()} $MADx</span>
          {stakingTier && (
            <span style={{
              fontSize: "8px",
              padding: "2px 6px",
              background: T.gold + "20",
              border: `1px solid ${T.gold}30`,
              borderRadius: "4px",
              color: T.gold,
              fontWeight: 800,
              letterSpacing: "1px",
            }}>
              {stakingTier.name.toUpperCase()}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: T.green, boxShadow: `0 0 6px ${T.green}` }} />
          <span style={{ fontSize: "9px", color: T.muted }}>LIVE</span>
        </div>
      </div>
    </div>
  );
}
