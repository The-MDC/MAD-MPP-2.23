"use client";

/**
 * MAD Gambit — Z-LIAR METER (hero instrument)
 * ------------------------------------------------------------------
 * A live narrative-credibility gauge. The needle is driven by the
 * composite zLiarMeter() (Sentinel BS-Index + GARCH volatility + lunar
 * tilt). Verdict bands map to the MADHAT'r's Jersey-accented read.
 * AI verdict copy: PLACEHOLDER local generator now; wire to Tri-Agent
 * route /api/v1/madhatr/zliar in prod (docs/BACKEND_PLACEHOLDERS.md).
 */

import React, { useMemo, useState } from "react";
import { useGame } from "@/context/game-context";
import { ZLiarVerdict } from "@/lib/gambit-game-math";
import { ShieldAlert, Search, Activity, Moon } from "lucide-react";

const VERDICT_COLOR: Record<ZLiarVerdict, string> = {
  "STRAIGHT SHOOTER": "#7cffc7",
  "SPIN ZONE": "#fbbf24",
  "SUS": "#f59e0b",
  "CAP DETECTED": "#f43f5e",
  "TOTAL FABRICATION": "#ff00f0",
};

// PLACEHOLDER: MADHAT'r persona lines (local). Prod streams from Gemini
// Tri-Agent (Agent A: Sentinel) with the AGENTS.md system instruction.
const QUIPS: Record<ZLiarVerdict, string> = {
  "STRAIGHT SHOOTER": "Ayo, this one's legit, kid. Cleaner than my Sunday fedora.",
  "SPIN ZONE": "Eh, a little spin on it — like meatballs, rolled just enough.",
  "SUS": "Somethin' smells off, and it ain't the cannolis. Watch ya wallet.",
  "CAP DETECTED": "Cap. Big cap. This guy's lyin' like a politician on a Tuesday.",
  "TOTAL FABRICATION": "Fuhgeddaboudit. Total fabrication. Pure woketurd fan-fiction.",
};

export default function ZLiarMeter() {
  const { runZLiar, zLiarHistory } = useGame();
  const [statement, setStatement] = useState("Bitcoin will hit $250k before the next halving — guaranteed.");
  const [variance, setVariance] = useState(0.7);
  const [credibility, setCredibility] = useState(0.35);
  const [corroboration, setCorroboration] = useState(0.2);

  const reading = useMemo(
    () => runZLiarPreview(variance, credibility, corroboration),
    [variance, credibility, corroboration]
  );

  // needle: 0..100 → -120°..+120°
  const angle = -120 + (reading.score / 100) * 240;
  const color = VERDICT_COLOR[reading.verdict];

  return (
    <div className="relative w-full rounded-3xl border border-neutral-850 bg-[#05070c]/80 backdrop-blur-md p-6 sm:p-8 overflow-hidden">
      {/* ambient glow */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full blur-[140px] pointer-events-none" style={{ background: color, opacity: 0.12 }} />

      <header className="relative flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-5 h-5" style={{ color }} />
          <div>
            <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-neutral-400 font-bold">The Z-Liar Meter</h2>
            <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-600">Narrative Credibility Instrument · Sentinel Engine</p>
          </div>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full border" style={{ borderColor: color + "55", color }}>
          {reading.verdict}
        </span>
      </header>

      <div className="relative grid md:grid-cols-[320px_1fr] gap-8 items-center">
        {/* gauge */}
        <div className="mx-auto">
          <svg viewBox="0 0 280 200" className="w-[280px] max-w-full">
            <defs>
              <linearGradient id="zl-arc" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#7cffc7" /><stop offset="40%" stopColor="#fbbf24" />
                <stop offset="70%" stopColor="#f43f5e" /><stop offset="100%" stopColor="#ff00f0" />
              </linearGradient>
              <filter id="zl-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="4" /><feComponentTransfer><feFuncA type="linear" slope="1.4" /></feComponentTransfer>
              </filter>
            </defs>
            {/* arc track */}
            <path d="M 30 170 A 110 110 0 0 1 250 170" fill="none" stroke="#11151c" strokeWidth="18" strokeLinecap="round" />
            <path d="M 30 170 A 110 110 0 0 1 250 170" fill="none" stroke="url(#zl-arc)" strokeWidth="6" strokeLinecap="round" opacity="0.85" />
            {/* ticks */}
            {Array.from({ length: 11 }).map((_, i) => {
              const a = (-120 + (i / 10) * 240) * (Math.PI / 180);
              const x1 = 140 + Math.cos(a - Math.PI / 2) * 92;
              const y1 = 170 + Math.sin(a - Math.PI / 2) * 92;
              const x2 = 140 + Math.cos(a - Math.PI / 2) * 100;
              const y2 = 170 + Math.sin(a - Math.PI / 2) * 100;
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#334155" strokeWidth="1.5" />;
            })}
            {/* needle */}
            <g transform={`rotate(${angle} 140 170)`} style={{ transition: "transform 0.6s cubic-bezier(0.16,1,0.3,1)" }}>
              <line x1="140" y1="170" x2="140" y2="78" stroke={color} strokeWidth="3.5" strokeLinecap="round" filter="url(#zl-glow)" />
              <circle cx="140" cy="170" r="9" fill="#05070c" stroke={color} strokeWidth="2.5" />
            </g>
            {/* score readout */}
            <text x="140" y="150" textAnchor="middle" fontFamily="ui-monospace,monospace" fontSize="34" fontWeight="900" fill={color}>{Math.round(reading.score)}</text>
            <text x="140" y="166" textAnchor="middle" fontFamily="ui-monospace,monospace" fontSize="8" letterSpacing="2" fill="#64748b">Z-LIAR SCORE</text>
          </svg>
        </div>

        {/* analysis + controls */}
        <div className="space-y-4">
          <textarea
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            rows={2}
            className="w-full bg-[#030508] border border-neutral-850 rounded-xl px-3.5 py-2.5 text-sm text-neutral-200 font-sans resize-none focus:outline-none focus:border-cyan-500/40"
            placeholder="Paste a claim, headline, or hot take to audit…"
          />

          {/* MADHAT'r quip */}
          <div className="rounded-xl border px-4 py-3" style={{ borderColor: color + "33", background: "#03050880" }}>
            <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-500 mb-1">🎩 The MADHAT'r reads it</p>
            <p className="text-sm text-neutral-200 italic leading-relaxed">{QUIPS[reading.verdict]}</p>
          </div>

          {/* breakdown */}
          <div className="grid grid-cols-3 gap-2.5">
            <Metric icon={<Search className="w-3.5 h-3.5" />} label="BS Index" value={`${Math.round(reading.bs)}%`} color="#f43f5e" />
            <Metric icon={<Activity className="w-3.5 h-3.5" />} label="GARCH σ²" value={reading.volatility.toFixed(3)} color="#58a6ff" />
            <Metric icon={<Moon className="w-3.5 h-3.5" />} label="Lunar Tilt" value={`+${reading.lunarTilt.toFixed(1)}`} color="#c98aff" />
          </div>

          {/* knobs */}
          <div className="space-y-2.5 pt-1">
            <Knob label="Narrative Variance" value={variance} onChange={setVariance} color="#f43f5e" />
            <Knob label="Source Credibility" value={credibility} onChange={setCredibility} color="#7cffc7" />
            <Knob label="Corroboration" value={corroboration} onChange={setCorroboration} color="#58a6ff" />
          </div>

          <button
            onClick={() => runZLiar(statement, { variance, credibility, corroboration })}
            className="w-full rounded-xl py-2.5 font-mono text-xs uppercase tracking-widest font-bold transition-all hover:scale-[1.01]"
            style={{ background: color + "18", border: `1px solid ${color}55`, color }}
          >
            Run Sentinel Audit
          </button>
        </div>
      </div>

      {/* history */}
      {zLiarHistory.length > 0 && (
        <div className="relative mt-6 pt-4 border-t border-neutral-900">
          <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-600 mb-2">Audit Log</p>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {zLiarHistory.map((h) => (
              <div key={h.id} className="flex items-center justify-between gap-3 text-[11px] font-mono">
                <span className="text-neutral-400 truncate flex-1">{h.statement}</span>
                <span className="shrink-0" style={{ color: VERDICT_COLOR[h.reading.verdict] }}>{Math.round(h.reading.score)} · {h.reading.verdict}</span>
                <span className="text-neutral-700 shrink-0">{h.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg border border-neutral-850 bg-[#030508] px-3 py-2">
      <div className="flex items-center gap-1.5 mb-1" style={{ color }}>{icon}<span className="font-mono text-[8px] uppercase tracking-wider text-neutral-500">{label}</span></div>
      <p className="font-mono text-base font-black" style={{ color }}>{value}</p>
    </div>
  );
}

function Knob({ label, value, onChange, color }: { label: string; value: number; onChange: (n: number) => void; color: string }) {
  return (
    <div>
      <div className="flex justify-between font-mono text-[9px] uppercase tracking-wider text-neutral-500 mb-1">
        <span>{label}</span><span style={{ color }}>{(value * 100).toFixed(0)}%</span>
      </div>
      <input type="range" min={0} max={1} step={0.01} value={value} onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer" style={{ accentColor: color, background: "#11151c" }} />
    </div>
  );
}

// local preview mirror of zLiarMeter (keeps needle live without committing to history)
import { zLiarMeter } from "@/lib/gambit-game-math";
function runZLiarPreview(variance: number, credibility: number, corroboration: number) {
  return zLiarMeter({ narrativeVariance: variance, sourceCredibility: credibility, corroboration });
}
