"use client";

/**
 * MAD Gambit Sentiment Equalizer
 * --------------------------------------------------
 * Live 14-bar spectrum visualizer. Internally animates with a
 * sine-wave + noise model; wire `externalBars` to the satire-engine
 * /api/satire-engine feed when ready (shape: number[14], values 0-100).
 * Colors: cyan → amber → pink (left to right) matching conviction dial.
 */

import React, { useEffect, useRef, useState } from "react";

const BAR_COUNT = 14;
const FPS = 24;

// Returns a deterministic-ish bar height for bar i at tick t (0-100)
function barHeight(i: number, t: number): number {
  const base = Math.sin(t * 0.45 + i * 0.6) * 34 + 50;
  // fast micro-jitter — pseudo-random but stable enough without Math.random
  const jitter = Math.sin(t * 1.7 + i * 3.1) * 8;
  return Math.max(5, Math.min(100, base + jitter));
}

function barColor(i: number): string {
  if (i > 10) return "rgba(236,72,153,.82)";
  if (i > 6)  return "rgba(250,204,21,.82)";
  return "rgba(6,182,212,.82)";
}

interface SentimentEqualizerProps {
  /** Override bars externally (e.g. from satire-engine feed). Values 0-100. */
  externalBars?: number[];
  /** Scale the internal animation amplitude (0-1). Defaults to 1. */
  amplitude?: number;
  className?: string;
}

export default function SentimentEqualizer({
  externalBars,
  amplitude = 1,
  className = "",
}: SentimentEqualizerProps) {
  const [tick, setTick] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0);
  const frameMs = 1000 / FPS;

  // Only self-animate when no external feed is driving the bars — otherwise
  // the loop would re-render 24×/sec for values it never uses.
  const selfDriven = !externalBars;

  useEffect(() => {
    if (!selfDriven) return;
    function loop(ts: number) {
      if (ts - lastRef.current >= frameMs) {
        setTick((t) => t + 1);
        lastRef.current = ts;
      }
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [frameMs, selfDriven]);

  const bars = Array.from({ length: BAR_COUNT }, (_, i) => {
    const raw = externalBars ? (externalBars[i] ?? 50) : barHeight(i, tick) * amplitude;
    return Math.max(5, Math.min(100, raw)); // clamp *after* scaling
  });

  return (
    <div className={`rounded-2xl border border-neutral-900 bg-[#090909] p-3.5 ${className}`}>
      <span className="block font-mono text-[8px] uppercase tracking-[0.22em] text-neutral-500 font-bold mb-3">
        MAD Gambit Sentiment Equalizer
      </span>
      <div className="flex gap-[3px] items-end h-14 bg-black/40 px-1.5 py-1.5 rounded-xl border border-neutral-950">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 flex flex-col justify-end h-full bg-neutral-950/50 rounded-[3px] overflow-hidden"
          >
            <div
              className="w-full rounded-[3px] transition-[height] duration-75"
              style={{ height: `${h}%`, background: barColor(i) }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 font-mono text-[7px] uppercase tracking-widest text-neutral-700">
        <span style={{ color: "rgba(6,182,212,.6)" }}>Bullish</span>
        <span style={{ color: "rgba(250,204,21,.6)" }}>Neutral</span>
        <span style={{ color: "rgba(236,72,153,.6)" }}>Bearish</span>
      </div>
    </div>
  );
}
