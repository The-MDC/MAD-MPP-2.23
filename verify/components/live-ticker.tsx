"use client";

/**
 * MAD Gambit — Perpetual NYSE Ticker (Ultra Max Fidelity)
 * ------------------------------------------------------------------
 * Right-to-left perpetual marquee. DOUBLE-TAP cycles three modes:
 *   1. MARKETS  — stocks & commodities (live micro-price simulation)
 *   2. SATIRE   — RSS-fed satirical news (Scandal Scraper → Z-Liar wire)
 *   3. STATS    — platform statistics (volume, chaos, canonical numbers)
 *
 * Design-locked: preserves the shipped "Live Wire" instrument aesthetic.
 * Colors sourced from INK design tokens (no stock Tailwind neon).
 * Mode persisted in localStorage. prefers-reduced-motion → static strip.
 */

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Radio, Newspaper, LineChart, BarChart3 } from "lucide-react";
import { motion, useAnimationFrame, useMotionValue } from "framer-motion";
import { INK } from "@/lib/gambit-design-tokens";
import { PLATFORM } from "@/lib/gambit-game-math";

/* ── modes ─────────────────────────────────────────────────────── */
type Mode = "markets" | "satire" | "stats";
const MODE_ORDER: Mode[] = ["markets", "satire", "stats"];
const MODE_META: Record<Mode, { label: string; icon: React.ReactNode; color: string }> = {
  markets: { label: "MARKETS · NYSE", icon: <LineChart className="w-4 h-4" />, color: INK.green },
  satire:  { label: "LIVE · RSS WIRE", icon: <Newspaper className="w-4 h-4" />, color: INK.gold },
  stats:   { label: "PLATFORM STATS", icon: <BarChart3 className="w-4 h-4" />, color: INK.cyan },
};

interface FeedItem { source: string; category: string; title: string; link: string; published: string; }
const CAT_COLOR: Record<string, string> = {
  crypto: INK.green, macro: INK.cyan, news: INK.gold, thesis: INK.pink,
};

/* satirical transform — prod runs each headline through the Gemini Tri-Agent (MADHAT'r) */
function satirize(title: string): string {
  const tags = ["allegedly", "totally not a rug", "trust me bro", "sources say", "cap detected?", "fuhgeddaboudit"];
  return `${title} — ${tags[title.length % tags.length]}`;
}

/* ── markets: stocks & commodities seed (micro-simulated) ──────── */
interface Tick { sym: string; price: number; change: number; unit?: string; }
const CRYPTO_SEED: Tick[] = [
  { sym: "BTC", price: 69420, change: 4.2 }, { sym: "ETH", price: 3500, change: 2.5 },
  { sym: "SOL", price: 180, change: 5.0 },   { sym: "XRP", price: 2.1, change: -1.2 },
  { sym: "$MADx", price: 0.85, change: 12.0 }, { sym: "DEGEN", price: 0.021, change: 8.5 },
];
const COMMODITY_SEED: Tick[] = [
  { sym: "GOLD", price: 2412, change: 0.8, unit: "/oz" }, { sym: "WTI", price: 78.3, change: -1.1, unit: "/bbl" },
  { sym: "SILVER", price: 30.6, change: 1.4, unit: "/oz" }, { sym: "NASDAQ", price: 18240, change: 0.6 },
  { sym: "S&P", price: 5490, change: 0.4 }, { sym: "VIX", price: 13.2, change: -3.1 },
];

function jitter(seed: Tick[]): Tick[] {
  return seed.map((t) => {
    const drift = (Math.random() - 0.5) * (t.price * 0.0015);
    const price = Math.max(0, t.price + drift);
    const change = +(t.change + (Math.random() - 0.5) * 0.15).toFixed(2);
    return { ...t, price, change };
  });
}
function fmtPrice(p: number): string {
  if (p >= 1000) return p.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (p >= 1) return p.toFixed(2);
  return p.toFixed(3);
}

/* ── stats: platform KPIs + canonical numbers ─────────────────── */
function statsRows(): { primary: [string, string, string][]; secondary: [string, string, string][] } {
  const vol = (2.1 + Math.random() * 0.6).toFixed(1);
  const chaos = (60 + Math.random() * 15).toFixed(0);
  const active = (120 + Math.floor(Math.random() * 40)).toString();
  const online = (800 + Math.floor(Math.random() * 300)).toString();
  return {
    primary: [
      ["VOLUME (24H)", `$${vol}M`, INK.green],
      ["ACTIVE BETS", active, INK.cyan],
      ["CHAOS METER", `${chaos}%`, INK.pink],
      ["USERS ONLINE", online, INK.gold],
      ["DEGEN STREAK", "5-DAY 🔥", INK.gold],
    ],
    secondary: [
      ["PLATFORM FEE", `${(PLATFORM.FEE_BPS / 100).toFixed(2)}%`, INK.cyan],
      ["COMMUNITY SHARE", `${(PLATFORM.COMMUNITY_SHARE_BPS / 100).toFixed(1)}%`, INK.green],
      ["CREATOR SHARE", `${(PLATFORM.CREATOR_SHARE_BPS / 100).toFixed(0)}%`, INK.gold],
      ["$MADx SUPPLY", PLATFORM.MADX_FIXED_SUPPLY.toLocaleString("en-US"), INK.pink],
    ],
  };
}

export default function LiveTicker() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [status, setStatus] = useState<"loading" | "live" | "offline">("loading");
  const [mode, setMode] = useState<Mode>("markets");
  const [reduced, setReduced] = useState(false);
  const [crypto, setCrypto] = useState<Tick[]>(CRYPTO_SEED);
  const [commodities, setCommodities] = useState<Tick[]>(COMMODITY_SEED);
  const [stats, setStats] = useState(statsRows());

  // restore persisted mode + reduced-motion preference
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("madgambit.ticker.mode") as Mode | null;
    if (saved && MODE_ORDER.includes(saved)) setMode(saved);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onMq = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onMq);
    return () => mq.removeEventListener("change", onMq);
  }, []);

  // live RSS
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/v1/feeds");
        const json = await res.json();
        if (alive && json.success && json.items?.length) {
          setItems(json.items.slice(0, 30));
          setStatus("live");
        } else if (alive) setStatus("offline");
      } catch {
        if (alive) setStatus("offline");
      }
    })();
    return () => { alive = false; };
  }, []);

  // micro-price / stats simulation (paused under reduced-motion for calm)
  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => {
      setCrypto((c) => jitter(c));
      setCommodities((c) => jitter(c));
      setStats(statsRows());
    }, 2500);
    return () => clearInterval(id);
  }, [reduced]);

  const cycleMode = useCallback(() => {
    setMode((m) => {
      const next = MODE_ORDER[(MODE_ORDER.indexOf(m) + 1) % MODE_ORDER.length];
      if (typeof window !== "undefined") window.localStorage.setItem("madgambit.ticker.mode", next);
      return next;
    });
  }, []);

  // double-tap detection (works for mouse + touch)
  const lastTap = useRef(0);
  const onTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 300) { cycleMode(); lastTap.current = 0; }
    else lastTap.current = now;
  }, [cycleMode]);

  const fallback: FeedItem[] = [
    { source: "MAD-NET", category: "crypto", title: "Live wire warming up — Scandal Scraper online", link: "#", published: "" },
  ];
  const feed = items.length ? items : fallback;
  const meta = MODE_META[mode];

  return (
    <div
      onClick={onTap}
      onDoubleClick={cycleMode}
      title="Double-tap to cycle: Markets · Satire · Stats"
      className="w-full space-y-px rounded-2xl overflow-hidden border bg-black/60 backdrop-blur-xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.8)] relative select-none cursor-pointer"
      style={{ borderColor: INK.border }}
    >
      {/* status strip — mode label + cycle dots */}
      <div
        className="relative flex items-center justify-between px-4 py-2 border-b z-10"
        style={{ background: `linear-gradient(90deg, rgba(0,0,0,0.8), ${INK.bgPanel}, rgba(0,0,0,0.8))`, borderColor: INK.border }}
      >
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            style={{ color: meta.color, filter: `drop-shadow(0 0 8px ${meta.color}cc)` }}
          >
            {meta.icon}
          </motion.div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: meta.color }}>
            {meta.label}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* 3-dot mode indicator */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); cycleMode(); }}
            className="flex items-center gap-1.5"
            aria-label="Cycle ticker mode"
          >
            {MODE_ORDER.map((m) => (
              <span
                key={m}
                className="h-1.5 w-1.5 rounded-full transition-all duration-300"
                style={{ background: m === mode ? meta.color : INK.muted, boxShadow: m === mode ? `0 0 8px ${meta.color}` : "none", transform: m === mode ? "scale(1.25)" : "scale(1)" }}
              />
            ))}
          </button>
          <span className="hidden sm:inline font-mono text-[8px] font-bold uppercase tracking-widest" style={{ color: INK.muted }}>
            2× tap
          </span>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: status === "live" ? INK.green : INK.gold }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: status === "live" ? INK.green : INK.gold, boxShadow: `0 0 10px ${status === "live" ? INK.green : INK.gold}cc` }} />
          </span>
        </div>
      </div>

      {/* content — two rows, footprint identical across modes */}
      {mode === "markets" && (
        <>
          <TickerRow reduced={reduced} speed={32} direction={-1} icon={<LineChart className="w-4 h-4" style={{ color: INK.green }} />}>
            {crypto.map((t, i) => <MarketPill key={i} t={t} />)}
          </TickerRow>
          <TickerRow reduced={reduced} speed={42} direction={1} icon={<BarChart3 className="w-4 h-4" style={{ color: INK.cyan }} />}>
            {commodities.map((t, i) => <MarketPill key={i} t={t} />)}
          </TickerRow>
        </>
      )}

      {mode === "satire" && (
        <>
          <TickerRow reduced={reduced} speed={30} direction={-1} icon={<Newspaper className="w-4 h-4" style={{ color: INK.muted }} />}>
            {feed.map((it, i) => (
              <a key={i} href={it.link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-3 px-6 group">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider" style={{ color: CAT_COLOR[it.category] || INK.muted, textShadow: `0 0 10px ${CAT_COLOR[it.category] || INK.muted}66` }}>{it.source}</span>
                <span className="font-sans text-[13px] font-medium transition-colors duration-300" style={{ color: INK.white }}>{it.title}</span>
                <span style={{ color: INK.muted }} className="mx-2">·</span>
              </a>
            ))}
          </TickerRow>
          <TickerRow reduced={reduced} speed={40} direction={1} icon={<Radio className="w-4 h-4" style={{ color: INK.pink, filter: `drop-shadow(0 0 5px ${INK.pink}88)` }} />}>
            {feed.map((it, i) => (
              <span key={i} className="inline-flex items-center gap-3 px-6">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider" style={{ color: INK.pink, filter: `drop-shadow(0 0 8px ${INK.pink}cc)` }}>🎩 Z-WIRE</span>
                <span className="font-sans text-[13px] italic" style={{ color: INK.muted }}>{satirize(it.title)}</span>
                <span style={{ color: INK.muted }} className="mx-2">·</span>
              </span>
            ))}
          </TickerRow>
        </>
      )}

      {mode === "stats" && (
        <>
          <TickerRow reduced={reduced} speed={30} direction={-1} icon={<BarChart3 className="w-4 h-4" style={{ color: INK.cyan }} />}>
            {stats.primary.map(([k, v, c], i) => <StatPill key={i} k={k} v={v} c={c} />)}
          </TickerRow>
          <TickerRow reduced={reduced} speed={38} direction={1} icon={<LineChart className="w-4 h-4" style={{ color: INK.gold }} />}>
            {stats.secondary.map(([k, v, c], i) => <StatPill key={i} k={k} v={v} c={c} />)}
          </TickerRow>
        </>
      )}
    </div>
  );
}

/* ── pills ─────────────────────────────────────────────────────── */
function MarketPill({ t }: { t: Tick }) {
  const up = t.change >= 0;
  const col = up ? INK.green : INK.pink;
  return (
    <span className="inline-flex items-center gap-2 px-5">
      <span className="font-mono text-[11px] font-bold uppercase tracking-wider" style={{ color: INK.white }}>{t.sym}</span>
      <span className="font-mono text-[12px] tabular-nums" style={{ color: INK.white }}>${fmtPrice(t.price)}{t.unit || ""}</span>
      <span className="font-mono text-[10px] font-bold tabular-nums" style={{ color: col, textShadow: `0 0 8px ${col}66` }}>{up ? "▲" : "▼"} {Math.abs(t.change).toFixed(1)}%</span>
      <span style={{ color: INK.muted }} className="mx-1">·</span>
    </span>
  );
}
function StatPill({ k, v, c }: { k: string; v: string; c: string }) {
  return (
    <span className="inline-flex items-center gap-2 px-5">
      <span className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: INK.muted }}>{k}</span>
      <span className="font-mono text-[13px] font-bold tabular-nums" style={{ color: c, textShadow: `0 0 10px ${c}55` }}>{v}</span>
      <span style={{ color: INK.muted }} className="mx-1">·</span>
    </span>
  );
}

/* ── marquee (animated) with reduced-motion static fallback ────── */
function TickerRow({ children, speed, direction, icon, reduced }: { children: React.ReactNode; speed: number; direction: 1 | -1; icon: React.ReactNode; reduced: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);
  const x = useMotionValue(0);

  useEffect(() => {
    if (containerRef.current) setContentWidth(containerRef.current.scrollWidth / 2);
  }, [children]);

  useAnimationFrame((_t, delta) => {
    if (reduced) return;
    const moveBy = direction * (speed * (delta / 1000));
    let newX = x.get() + moveBy;
    if (direction === -1 && newX <= -contentWidth) newX += contentWidth;
    else if (direction === 1 && newX >= 0) newX -= contentWidth;
    x.set(newX);
  });

  return (
    <div className="relative flex items-center py-3 overflow-hidden" style={{ background: "rgba(3,5,8,0.8)", maskImage: "linear-gradient(to right, transparent, black 5%, black 95%, transparent)" }}>
      <div className="shrink-0 px-4 z-20 border-r relative shadow-[10px_0_15px_-3px_rgba(0,0,0,0.8)]" style={{ background: "#030508", borderColor: INK.border }}>
        {icon}
      </div>
      {reduced ? (
        // static, no scroll — wrapped, honors prefers-reduced-motion
        <div className="flex-1 flex flex-wrap items-center gap-y-1 overflow-hidden max-h-6 px-2">{children}</div>
      ) : (
        <div className="overflow-hidden flex-1 relative flex items-center">
          <motion.div ref={containerRef} className="flex whitespace-nowrap" style={{ x }}>
            <div className="flex items-center shrink-0">{children}</div>
            <div className="flex items-center shrink-0">{children}</div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
