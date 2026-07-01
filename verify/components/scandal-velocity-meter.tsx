"use client";

/**
 * MΛĐ Gambit — Scandal Velocity Meter
 * ------------------------------------------------------------------
 * Real-time GARCH(1,1) volatility display. Rolling 200-epoch simulated
 * price series feeds garchUpdate() every 3 seconds. Five interpretation
 * bands shift the UI's color temperature as σ² rises.
 *
 * Dopamine design: ambient pressure. Users feel market conditions before
 * they consciously process them. Color + copy change → urgency → action.
 *
 * PLACEHOLDER: prod replaces simulated series with Triple-Threat Oracle
 * (Chainlink price feeds + Scandal Scraper AI sentiment).
 * Source: Gen 1 MainActivity.kt ConvictionDashboard "SCANDAL VELOCITY METER"
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import { garchUpdate, getLunarPhaseMultiplier } from "@/lib/gambit-game-math";
import { Activity, Wifi } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VolatilityBand {
  label: string;
  sublabel: string;
  color: string;
  bgOpacity: string;
  cta: string;
  minSigma: number;
}

const BANDS: VolatilityBand[] = [
  { minSigma: 0.000, label: "QUIET",        sublabel: "Market resting",                   color: "#475569", bgOpacity: "05", cta: "Monitor for entry" },
  { minSigma: 0.010, label: "WARMING",       sublabel: "Liquidity building",               color: "#00f0ff", bgOpacity: "08", cta: "Early conviction window" },
  { minSigma: 0.020, label: "ACTIVE",        sublabel: "Conviction opportunities rising",  color: "#7cffc7", bgOpacity: "10", cta: "Liquidity deepening. Prices flattened." },
  { minSigma: 0.035, label: "HOT",           sublabel: "GARCH σ² elevated",               color: "#fbbf24", bgOpacity: "12", cta: "Optimal time for heavy Conviction entry." },
  { minSigma: 0.050, label: "SCANDAL PEAK",  sublabel: "Maximum cultural velocity",        color: "#ec4899", bgOpacity: "18", cta: "Spike in progress. Execute now or wait for cooldown." },
];

function getBand(sigma: number): VolatilityBand {
  return [...BANDS].reverse().find(b => sigma >= b.minSigma) ?? BANDS[0];
}

// Seeded pseudo-random GARCH series (deterministic, consistent across renders)
function generateSeries(length: number): number[] {
  let sigma2 = 0.02;
  const series: number[] = [sigma2];
  let seed = 42;
  const rand = () => { seed = (seed * 1664525 + 1013904223) % 2147483648; return seed / 2147483648; };
  for (let i = 1; i < length; i++) {
    const shock = (rand() - 0.5) * 0.3;
    sigma2 = garchUpdate(0.008, 0.12, 0.82, sigma2, shock);
    series.push(sigma2);
  }
  return series;
}

const BASE_SERIES = generateSeries(200);

export default function ScandalVelocityMeter() {
  const [epoch, setEpoch] = useState(100);
  const [sigma2, setSigma2] = useState(BASE_SERIES[100]);
  const [history, setHistory] = useState<number[]>(BASE_SERIES.slice(60, 100));
  const rafRef = useRef<number>(0);
  const tickRef = useRef<NodeJS.Timeout | null>(null);
  const lunarMult = getLunarPhaseMultiplier();

  const tick = useCallback(() => {
    setEpoch(e => {
      const next = (e + 1) % BASE_SERIES.length;
      const val = BASE_SERIES[next];
      setSigma2(val);
      setHistory(h => [...h.slice(-39), val]);
      return next;
    });
  }, []);

  useEffect(() => {
    tickRef.current = setInterval(tick, 3000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [tick]);

  const band = getBand(sigma2);
  const sigmaDisplay = (sigma2 * 10000).toFixed(1);
  // Normalize σ² to 0..1 for gauge (0.000→0.000, 0.07→1.0)
  const gaugeWidth = Math.min(100, (sigma2 / 0.07) * 100);
  const maxH = Math.max(...history);

  return (
    <div
      className={`relative rounded-3xl border overflow-hidden transition-all duration-700 p-5`}
      style={{
        borderColor: band.color + "44",
        background: `#05070c`,
      }}
    >
      {/* Ambient glow layer */}
      <div className="absolute inset-0 pointer-events-none transition-all duration-700 rounded-3xl"
        style={{ background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${band.color}${band.bgOpacity}, transparent)` }} />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Activity className="w-4 h-4" style={{ color: band.color }} />
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-neutral-500 font-bold">Scandal Velocity Meter</p>
              <p className="font-mono text-[8px] uppercase tracking-widest text-neutral-700">GARCH(1,1) · Epoch {epoch} · L_θ {lunarMult.toFixed(3)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: band.color }} />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: band.color }} />
            </span>
            <span className="font-mono text-[8px] uppercase tracking-widest" style={{ color: band.color }}>{band.label}</span>
          </div>
        </div>

        {/* Main σ² display */}
        <div className="flex items-end gap-4 mb-4">
          <div>
            <p className="font-mono text-[8px] uppercase tracking-widest text-neutral-600 mb-1">GARCH σ² × 10⁴</p>
            <p className="font-mono text-4xl font-black transition-all duration-500" style={{ color: band.color }}>{sigmaDisplay}</p>
            <p className="font-mono text-[9px] text-neutral-500 mt-0.5">{band.sublabel}</p>
          </div>
          {/* Sparkline */}
          <div className="flex-1 flex items-end gap-px h-12">
            {history.slice(-32).map((v, i) => {
              const h = maxH > 0 ? Math.max(4, (v / maxH) * 48) : 4;
              const isLast = i === Math.min(31, history.length - 1);
              return (
                <div key={i} className="flex-1 rounded-sm transition-all duration-300"
                  style={{ height: `${h}px`, background: isLast ? band.color : band.color + "44" }} />
              );
            })}
          </div>
        </div>

        {/* Gauge bar */}
        <div className="mb-3">
          <div className="h-2 rounded-full bg-neutral-900 overflow-hidden relative shadow-[inset_0_0_5px_rgba(0,0,0,1)] border border-white/5">
            <motion.div className="h-full rounded-full transition-all duration-700"
              initial={{ width: 0 }}
              animate={{ width: `${gaugeWidth}%` }}
              transition={{ type: "spring", stiffness: 50, damping: 20 }}
              style={{ background: `linear-gradient(to right, #00f0ff, ${band.color})`, boxShadow: `0 0 10px ${band.color}88` }} />
          </div>
          <div className="flex justify-between font-mono text-[7px] text-neutral-700 mt-0.5">
            <span>QUIET</span><span>WARMING</span><span>ACTIVE</span><span>HOT</span><span>PEAK</span>
          </div>
        </div>

        {/* Interpretation CTA — exact Gen 1 copy */}
        <motion.div 
          key={band.cta}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border px-3 py-2 relative overflow-hidden" 
          style={{ borderColor: band.color + "55", background: band.color + "11", boxShadow: `0 0 20px ${band.color}22` }}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[100%] animate-[shimmer_3s_infinite]" />
          <div className="flex items-center gap-2 relative z-10">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Wifi className="w-3 h-3 shrink-0" style={{ color: band.color, filter: `drop-shadow(0 0 5px ${band.color})` }} />
            </motion.div>
            <p className="font-mono text-[10px] font-bold tracking-wide" style={{ color: band.color, textShadow: `0 0 8px ${band.color}88` }}>{band.cta}</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
