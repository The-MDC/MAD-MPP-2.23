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
 *   Neon pink:      #fc3437
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

/* ── DOPAMINE CAROUSEL TILES config ─────────────────────────── */
type TileId = "bets" | "streak" | "chaos" | "gainers";
const TILE_LABELS: { id: TileId; label: string; icon: string }[] = [
  { id: "bets",    label: "ACTIVE BETS",  icon: "=" },
  { id: "streak",  label: "DEGEN STREAK", icon: "⚡" },
  { id: "chaos",   label: "CHAOS METER",  icon: "≈" },
  { id: "gainers", label: "TOP GAINERS",  icon: "=" },
];

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
  const [heights, setHeights] = useState<number[]>(() => Array.from({ length: BARS }, () => 0.3 + Math.random() * 0.4));
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
 * SUB-COMPONENT: Chaos Meter Radial Gauge
 * Port of ChaosMeter.kt:
 *   190dp canvas, 14px stroke arc, gold→orange→fuchsia→purple gradient
 *   Inner labels: CHAOS / METER / σ=0.xxx
 *   Spinning needle from ChaosMeter.kt drawArc + rotate call
 * ══════════════════════════════════════════════════════════════ */
function ChaosMeterGauge({ value }: { value: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(undefined);
  const currentRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const SIZE = canvas.width;
    const CX = SIZE / 2;
    const CY = SIZE / 2;
    const R = SIZE * 0.4;
    const SW = SIZE * 0.07; // stroke width = 14px equivalent

    const target = Math.min(1, Math.max(0, value / 100));
    let needle = currentRef.current;

    const draw = () => {
      // Ease toward target
      needle += (target - needle) * 0.04;
      currentRef.current = needle;

      ctx.clearRect(0, 0, SIZE, SIZE);

      // Track: inactive arc (bottom half semi-circle, 180° sweep)
      ctx.beginPath();
      ctx.arc(CX, CY, R, Math.PI, 2 * Math.PI);
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = SW;
      ctx.lineCap = "round";
      ctx.stroke();

      // Active arc — gold→orange→fuchsia→purple gradient
      const grad = ctx.createLinearGradient(CX - R, CY, CX + R, CY);
      grad.addColorStop(0,    "#d69d41"); // gold
      grad.addColorStop(0.35, "#ff4500"); // neon orange
      grad.addColorStop(0.65, "#fc3437"); // hot pink fuchsia
      grad.addColorStop(1,    "#8b00ff"); // bright purple

      const sweepAngle = needle * Math.PI; // 0 = flat left, π = flat right
      ctx.beginPath();
      ctx.arc(CX, CY, R, Math.PI, Math.PI + sweepAngle);
      ctx.strokeStyle = grad;
      ctx.lineWidth = SW;
      ctx.lineCap = "round";
      ctx.stroke();

      // Needle — thin line from center to arc edge
      const needleAngle = Math.PI + sweepAngle;
      const nx = CX + Math.cos(needleAngle) * (R - SW / 2);
      const ny = CY + Math.sin(needleAngle) * (R - SW / 2);
      ctx.beginPath();
      ctx.moveTo(CX, CY);
      ctx.lineTo(nx, ny);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.stroke();

      // Center dot
      ctx.beginPath();
      ctx.arc(CX, CY, SW * 0.4, 0, 2 * Math.PI);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      if (Math.abs(needle - target) > 0.001) {
        animRef.current = requestAnimationFrame(draw);
      }
    };

    animRef.current = requestAnimationFrame(draw);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [value]);

  const sigma = (value / 100 * 0.45 + 0.02).toFixed(3);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", flex: 1 }}>
      <div style={{ position: "relative", width: "100%", maxWidth: "120px" }}>
        <canvas
          ref={canvasRef}
          width={200}
          height={110}
          style={{ width: "100%", height: "auto", display: "block" }}
          aria-label={`Chaos meter at ${value}%`}
        />
        {/* Inner label stack — centered in the semi-circle */}
        <div style={{
          position: "absolute",
          top: "28%",
          left: "50%",
          transform: "translateX(-50%)",
          textAlign: "center",
          pointerEvents: "none",
        }}>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: "11px", fontWeight: 900, color: T.white, letterSpacing: "1.5px" }}>CHAOS</div>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: "11px", fontWeight: 900, color: T.white, letterSpacing: "1.5px" }}>METER</div>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: "9px", color: T.pink, fontWeight: 700, marginTop: "2px" }}>σ = {sigma}</div>
        </div>
      </div>
      <div style={{ fontFamily: "ui-monospace, monospace", fontSize: "20px", fontWeight: 900, color: T.pink, textShadow: `0 0 12px ${T.pink}80` }}>
        {Math.round(value)}%
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
 * SUB-COMPONENT: Dopamine Carousel Tile
 * Exact from image: dark card, label header, content area
 * ══════════════════════════════════════════════════════════════ */
function CarouselTile({ tile, children, accentColor = T.cyan }: {
  tile: { id: TileId; label: string; icon: string };
  children: React.ReactNode;
  accentColor?: string;
}) {
  return (
    <div
      style={{
        flex: "1 1 0",
        minWidth: "140px",
        background: T.bgCard,
        border: `1px solid ${T.border}`,
        borderRadius: "12px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = accentColor + "40";
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 16px ${accentColor}20`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = T.border;
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* Tile header */}
      <div style={{
        padding: "6px 10px",
        background: `linear-gradient(to right, ${accentColor}15, transparent)`,
        borderBottom: `1px solid ${T.border}`,
        display: "flex",
        alignItems: "center",
        gap: "4px",
      }}>
        <span style={{ fontFamily: "ui-monospace, monospace", fontSize: "10px", fontWeight: 900, color: accentColor }}>
          {tile.icon}
        </span>
        <span style={{ fontFamily: "ui-monospace, monospace", fontSize: "9px", fontWeight: 800, color: accentColor, letterSpacing: "1px" }}>
          {tile.label}
        </span>
      </div>
      {/* Tile content */}
      <div style={{ padding: "10px", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {children}
      </div>
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
export default function SeikoDopamineHub() {
  const { madCredits, positions, streak, chaosMeter } = useGame();

  const activeBets = positions.filter(p => !p.resolved).length;
  const stakingTier = getStakingTier(madCredits);

  // Top gainers — mock data reflecting leaderboard concept
  const gainers = [
    { handle: "UserA", pct: 50 },
    { handle: "UserB", pct: 30 },
    { handle: "UserC", pct: 18 },
  ];

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
      <TickerBar />

      {/* ── 1b. MARKET-ENERGY EQUALIZER — sits below the golden ticker ── */}
      <EqualizerStrip />

      {/* ── 2. HEADER ROW: title ──
          The split-flap chrono used to sit loose here, with the instrument
          cluster below it rendering an EMPTY centre. That was one instrument
          torn in half: the clock is designed to be the cluster's centre slot,
          flanked by the two dials. It has been moved into that slot in 2b
          below — moved, not dropped. */}
      <div style={{ padding: "14px 20px 4px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
        <div>
          <div style={{
            fontFamily: "ui-monospace, monospace",
            fontSize: "9px",
            fontWeight: 700,
            letterSpacing: "3px",
            color: T.gold,
            textTransform: "uppercase",
            marginBottom: "3px",
          }}>
            CUSTOMIZABLE MARKET CAROUSEL
          </div>
          <div style={{
            fontFamily: "ui-monospace, monospace",
            fontSize: "8px",
            color: T.muted,
            letterSpacing: "1px",
          }}>
            MAD GAMBIT · PLATFORM {PLATFORM.FEE_BPS / 100}% FEE
          </div>
        </div>
      </div>

      {/* ── 2b. GAMBIT INSTRUMENT CLUSTER v2 — the canonical benchmark hero ──
          3 independently customizable 2-digit KPI pods + 2 independently
          customizable analog dials, all center-aligned, gold-cased.
          Tap any dot beneath a pod/dial to swap what it shows.
          See gambit-instrument-cluster.tsx for the full rationale. */}
      <div style={{ padding: "6px 16px 16px", borderBottom: `1px solid ${T.border}` }}>
        <GambitInstrumentCluster
          uid="floor-hero"
          centerSlot={<SeikoFlipClock label="MAD·STATE · TAP A DOT TO PIN" scale={1.2} />}
        />
      </div>

      {/* ── 2c. PLATFORM PILLAR CAROUSEL — right-to-left continuous scroll ──
          Convictions / Predictions / Z-Liar Meter / Card-game. */}
      <div style={{ borderBottom: `1px solid ${T.border}` }}>
        <PlatformCarousel />
      </div>

      {/* ── 3. CAROUSEL TILES ROW ────────────────────────── */}
      <div style={{
        display: "flex",

        gap: "8px",
        padding: "12px 16px",
        overflowX: "auto",
        scrollbarWidth: "none",
        borderBottom: `1px solid ${T.border}`,
      }}>
        {/* ACTIVE BETS */}
        <CarouselTile tile={TILE_LABELS[0]} accentColor={T.cyan}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "32px", fontWeight: 900, color: T.cyan, textShadow: `0 0 16px ${T.cyan}80`, lineHeight: 1 }}>
              {activeBets}
            </div>
            <div style={{ fontSize: "9px", color: T.muted, letterSpacing: "1px", marginTop: "3px" }}>LIVE</div>
          </div>
        </CarouselTile>

        {/* DEGEN STREAK */}
        <CarouselTile tile={TILE_LABELS[1]} accentColor={T.gold}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontSize: "28px",
              fontWeight: 900,
              color: T.gold,
              lineHeight: 1,
              textShadow: streak >= 7 ? `0 0 20px ${T.gold}` : undefined,
            }}
              className={streak >= 7 ? "animate-streak-fire" : ""}
            >
              {streak}
            </div>
            <div style={{ fontSize: "9px", letterSpacing: "1px", marginTop: "2px", color: streak >= 5 ? T.gold : T.muted }}>
              {streak >= 7 ? "🔥 SAVAGE!" : streak >= 5 ? "STREAK!" : "DAY STREAK"}
            </div>
            {streak >= 3 && (
              <div style={{ fontSize: "9px", color: T.goldDim, marginTop: "2px" }}>
                +{streak >= 7 ? "2.4x" : streak >= 5 ? "1.8x" : "1.3x"}
              </div>
            )}
          </div>
        </CarouselTile>

        {/* CHAOS METER — radial gauge (faithful ChaosMeter.kt port) */}
        <CarouselTile tile={TILE_LABELS[2]} accentColor={T.pink}>
          <ChaosMeterGauge value={chaosMeter} />
        </CarouselTile>

        {/* TOP GAINERS */}
        <CarouselTile tile={TILE_LABELS[3]} accentColor={T.green}>
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "4px" }}>
            {gainers.map((g, i) => (
              <div key={g.handle} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "9px", color: T.muted }}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"} {g.handle}
                </span>
                <span style={{ fontSize: "10px", fontWeight: 900, color: T.green }}>+{g.pct}%</span>
              </div>
            ))}
          </div>
        </CarouselTile>
      </div>

      {/* ── 4. FEATURED MARKET CARDS ─────────────────────── */}
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

      {/* ── 4b. UNPACKED CARDS CAROUSEL — auto-scroll, pause on hover ──── */}
      <div style={{ padding: "8px 16px 4px", borderTop: `1px solid ${T.border}` }}>
        <UnpackedCardsCarousel count={8} />
      </div>

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
