"use client";

/**
 * MΛĐ Gambit — Portal / Data Room Tab
 * ------------------------------------------------------------------
 * Three animated thesis slides (auto-cycle 8s, pause on hover).
 * Slides ported from Gen 2 MADHATsPortalPanel composable.
 * Reveal.js pitch deck link → /slides.html
 * Contribution Connectors cross-mounted here.
 * Design: cinematic dark vault feel. Opening a door.
 */

import React, { useState, useEffect, useRef } from "react";
import ContributionConnectors from "@/components/contribution-connectors";
import { ChevronLeft, ChevronRight, ExternalLink, Ticket } from "lucide-react";

interface Slide {
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  bullets: { label: string; value: string }[];
  cta: string;
}

// Exact copy from Gen 2 MADHATsPortalPanel
const SLIDES: Slide[] = [
  {
    title: "Deflationary Flywheel Moat",
    subtitle: "Fail-Yield Loop Architecture",
    icon: "🔥",
    color: "#ec4899",
    bullets: [
      { label: "Furnace burn cap", value: "4.9% / epoch" },
      { label: "Evolution burns",   value: "100→1,000 cards" },
      { label: "Protocol cut",      value: "~53.2% of fee" },
      { label: "Supply floor",      value: "888,888,888 $MADx" },
    ],
    cta: "Every loss feeds the furnace. Every evolution is deflationary.",
  },
  {
    title: "Sustainable Conviction Shield",
    subtitle: "φ-Ratio Protective Limits",
    icon: "🛡",
    color: "#ffd700",
    bullets: [
      { label: "Base recovery",  value: "28.8% of loss" },
      { label: "VIP recovery",   value: "60% of loss" },
      { label: "φ at max vol",   value: "×1.618 uplift" },
      { label: "MAD-Shield opt-in fee", value: "2–4% of stake" },
    ],
    cta: "The golden ratio is not decoration. It is the structural safety factor.",
  },
  {
    title: "Triple-Threat Oracle",
    subtitle: "Sentinel · Strategist · Decay",
    icon: "⚡",
    color: "#00f0ff",
    bullets: [
      { label: "Agent A (Sentinel)",    value: "BS-Index + GARCH" },
      { label: "Agent B (Strategist)",  value: "Kelly + Quadratic" },
      { label: "Chainlink VRF",         value: "Verifiable random" },
      { label: "EigenTrust R_j=0",      value: "Bots nullified" },
    ],
    cta: "Three agents. One verdict. No single point of manipulation.",
  },
];

export default function PortalTab() {
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 8000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [paused]);

  const s = SLIDES[slide];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Ticket className="w-5 h-5 text-pink-400" />
        <div>
          <h2 className="font-mono text-xs uppercase tracking-[0.3em] font-bold text-neutral-300">The Portal</h2>
          <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-600">Data Room · Investment Thesis · Genesis Access</p>
        </div>
        {/* §5 link pass: /slides.html never shipped — the live O-V deck is the pitch. */}
        <a href="https://o-vdeck26.vercel.app" target="_blank" rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-500/40 bg-purple-500/8 text-purple-400 font-mono text-[9px] font-bold uppercase tracking-wider hover:bg-purple-500/15 transition-all">
          <ExternalLink className="w-2.5 h-2.5" /> Full Pitch Deck
        </a>
      </div>

      {/* Thesis slide carousel */}
      <div
        className="relative rounded-3xl border overflow-hidden"
        style={{ borderColor: s.color + "44" }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Ambient fill */}
        <div className="absolute inset-0 transition-all duration-700"
          style={{ background: `radial-gradient(ellipse 100% 80% at 50% -20%, ${s.color}14, transparent 70%)` }} />

        <div className="relative p-6 sm:p-8">
          {/* Slide content */}
          <div className="flex items-start gap-4 mb-5">
            <span className="text-4xl">{s.icon}</span>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest mb-1" style={{ color: s.color }}>Thesis {slide + 1}/3</p>
              <h3 className="font-display text-xl font-black text-neutral-100">{s.title}</h3>
              <p className="font-mono text-[10px] text-neutral-500">{s.subtitle}</p>
            </div>
          </div>

          {/* Bullets */}
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            {s.bullets.map(b => (
              <div key={b.label} className="rounded-lg border border-neutral-850 bg-[#030508] px-3 py-2">
                <p className="font-mono text-[8px] uppercase tracking-wider text-neutral-600">{b.label}</p>
                <p className="font-mono text-sm font-black mt-0.5" style={{ color: s.color }}>{b.value}</p>
              </div>
            ))}
          </div>

          {/* CTA copy */}
          <p className="font-sans text-sm text-neutral-400 italic border-l-2 pl-3" style={{ borderColor: s.color + "66" }}>
            {s.cta}
          </p>

          {/* Nav */}
          <div className="flex items-center justify-between mt-5">
            <button onClick={() => setSlide(s => (s - 1 + SLIDES.length) % SLIDES.length)}
              className="p-1.5 rounded-lg border border-neutral-800 text-neutral-500 hover:text-neutral-300 transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Dots */}
            <div className="flex gap-2">
              {SLIDES.map((_, i) => (
                <button key={i} onClick={() => setSlide(i)}
                  className="w-2 h-2 rounded-full transition-all"
                  style={{ background: i === slide ? s.color : "#334155" }} />
              ))}
            </div>

            {/* Auto-play indicator */}
            <div className="flex items-center gap-1.5">
              {!paused && <span className="font-mono text-[8px] text-neutral-700">AUTO</span>}
              <button onClick={() => setSlide(s => (s + 1) % SLIDES.length)}
                className="p-1.5 rounded-lg border border-neutral-800 text-neutral-500 hover:text-neutral-300 transition-all">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contribution Connectors */}
      <ContributionConnectors />
    </div>
  );
}
