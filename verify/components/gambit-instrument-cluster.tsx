"use client";

/**
 * MAD Gambit — Gambit Instrument Cluster (v3)
 * ══════════════════════════════════════════════════════════════════
 * CANONICAL BENCHMARK COMPONENT. Ultra-high-fidelity gold instrument
 * panel — the reference standard for every gauge in MAD Gambit.
 * Material definitions come from lib/gambit-design-tokens.ts.
 *
 * v3 CHANGE FROM v2:
 * The three Seiko "number slots" are now three live mini-instruments,
 * each in the same gold-cased bezel:
 *   Slot 1 — Z-LIAR SENTIMENT METER  (needle gauge; the former analogue
 *            decay dial, repurposed + resized, fed by Z-Liar market
 *            sentiment — PLACEHOLDER feed, prod wires the Z-Liar markets)
 *   Slot 2 — CONVICTION SENTIMENT    (live sparkline graph)
 *   Slot 3 — SCANDAL σ² GARCH BARS   (equalizer bars off GARCH variance)
 * The two flanking analogue dials are retired into these three slots to
 * match the clean three-slot Seiko hero from the dopamine-gold mockup.
 * ══════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useRef } from "react";
import { GOLD_CHISEL_STOPS, INSTRUMENT_FONT, INK } from "@/lib/gambit-design-tokens";
import { garchUpdate } from "@/lib/gambit-game-math";

/* kept for API compatibility with any external preset callers */
export interface DigitPairStat { label: string; value: string; color: string; }
export interface DialStat { label: string; value: number; colorA: string; colorB: string; }

/* ── shared gold-cased bezel — the fidelity signature ──────────── */
function PodFrame({ uid, label, accent, children }: {
  uid: string; label: string; accent: string; children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
      <svg width={104} height={80} viewBox="0 0 104 80" role="img" aria-label={label}>
        <defs>
          <linearGradient id={`pf-gold-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            {GOLD_CHISEL_STOPS.map(([o, c]) => <stop key={o} offset={`${o}%`} stopColor={c} />)}
          </linearGradient>
          <filter id={`pf-glow-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* gold case + polished inner edge */}
        <rect x="2" y="2" width="100" height="76" rx="14" fill={`url(#pf-gold-${uid})`} />
        <rect x="4.5" y="4.5" width="95" height="71" rx="11.5" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.3" />
        {/* corner rivets */}
        {[[12, 12], [92, 12], [12, 68], [92, 68]].map(([cx, cy], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r="2" fill="#5c3c04" />
            <circle cx={cx - 0.5} cy={cy - 0.5} r="0.7" fill="rgba(255,255,255,0.7)" />
          </g>
        ))}
        {/* inset dark instrument screen */}
        <rect x="12" y="13" width="80" height="54" rx="6" fill="#0a0705" stroke="#000" strokeWidth="1.5" />
        <rect x="12" y="13" width="80" height="10" rx="6" fill="rgba(255,255,255,0.03)" />
        {/* viz renders inside the screen: origin (12,13), area 80x54 */}
        <g transform="translate(12,13)" filter={`url(#pf-glow-${uid})`}>{children}</g>
      </svg>
      <div style={{ fontFamily: INSTRUMENT_FONT, fontSize: "7px", fontWeight: 800, color: accent, letterSpacing: "1.1px", textAlign: "center", minHeight: "9px" }}>
        {label}
      </div>
    </div>
  );
}

/* ── Slot 1 — Z-Liar Sentiment Meter (needle gauge) ────────────── */
function ZLiarPod({ value, uid }: { value: number; uid: string }) {
  // semicircle: value 0 → needle left (truth), 100 → right (liar)
  const cx = 40, cy = 46, r = 30;
  const ang = Math.PI - (Math.max(0, Math.min(100, value)) / 100) * Math.PI; // rad
  const nx = cx + Math.cos(ang) * r, ny = cy - Math.sin(ang) * r;
  const zone = value < 40 ? INK.green : value < 70 ? INK.gold : INK.pink;
  const ticks = Array.from({ length: 9 }, (_, i) => {
    const a = Math.PI - (i / 8) * Math.PI;
    return { x1: cx + Math.cos(a) * r, y1: cy - Math.sin(a) * r, x2: cx + Math.cos(a) * (r - 4), y2: cy - Math.sin(a) * (r - 4) };
  });
  return (
    <>
      <defs>
        <linearGradient id={`zl-arc-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={INK.green} /><stop offset="55%" stopColor={INK.gold} /><stop offset="100%" stopColor={INK.pink} />
        </linearGradient>
      </defs>
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke={`url(#zl-arc-${uid})`} strokeWidth="4" strokeLinecap="round" />
      {ticks.map((t, i) => <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />)}
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="3" fill={zone} />
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize="9" fontWeight="900" fill={zone} fontFamily={INSTRUMENT_FONT}>{Math.round(value)}</text>
    </>
  );
}

/* ── Slot 2 — Conviction Sentiment Graph (sparkline) ───────────── */
function ConvictionPod({ series, uid }: { series: number[]; uid: string }) {
  const W = 80, H = 54, pad = 6;
  const n = series.length;
  const pts = series.map((v, i) => {
    const x = pad + (i / (n - 1)) * (W - pad * 2);
    const y = pad + (1 - Math.max(0, Math.min(100, v)) / 100) * (H - pad * 2);
    return [x, y];
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${pad},${H - pad} ${line} ${W - pad},${H - pad}`;
  const last = series[n - 1];
  const rising = last >= series[n - 2];
  const col = rising ? INK.cyan : INK.pink;
  return (
    <>
      <defs>
        <linearGradient id={`cv-fill-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={col} stopOpacity="0.35" /><stop offset="100%" stopColor={col} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#cv-fill-${uid})`} />
      <polyline points={line} fill="none" stroke={col} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[n - 1][0]} cy={pts[n - 1][1]} r="2.2" fill={col} />
      <text x={W - 6} y={13} textAnchor="end" fontSize="8" fontWeight="900" fill={col} fontFamily={INSTRUMENT_FONT}>{Math.round(last)}%</text>
    </>
  );
}

/* ── Slot 3 — Scandal σ² GARCH equalizer bars ──────────────────── */
function ScandalBarsPod({ bars, uid }: { bars: number[]; uid: string }) {
  const W = 80, H = 54, pad = 8, gap = 3;
  const bw = (W - pad * 2 - gap * (bars.length - 1)) / bars.length;
  return (
    <>
      <defs>
        <linearGradient id={`sb-${uid}`} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor={INK.gold} /><stop offset="60%" stopColor={INK.pink} /><stop offset="100%" stopColor="#ff4500" />
        </linearGradient>
      </defs>
      {bars.map((v, i) => {
        const h = 6 + Math.max(0, Math.min(1, v)) * (H - pad * 2 - 6);
        const x = pad + i * (bw + gap);
        return <rect key={i} x={x} y={H - pad - h} width={bw} height={h} rx="1.5" fill={`url(#sb-${uid})`} />;
      })}
    </>
  );
}

export interface GambitInstrumentClusterProps { uid?: string; }

export default function GambitInstrumentCluster({ uid = "hero" }: GambitInstrumentClusterProps) {
  const [zliar, setZliar] = useState(62);
  const [conv, setConv] = useState<number[]>(() => Array.from({ length: 18 }, (_, i) => 50 + Math.sin(i / 2) * 12));
  const [bars, setBars] = useState<number[]>(() => Array.from({ length: 6 }, () => 0.4 + Math.random() * 0.4));
  const sigmaRef = useRef(0.02);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      // Z-Liar sentiment random-walk (PLACEHOLDER — prod reads Z-Liar markets)
      setZliar((z) => Math.max(8, Math.min(96, z + (Math.random() - 0.5) * 9)));
      setConv((s) => [...s.slice(1), Math.max(10, Math.min(95, s[s.length - 1] + (Math.random() - 0.5) * 10))]);
      // GARCH(1,1) variance drives the scandal equalizer (same params as Scandal Velocity Meter)
      sigmaRef.current = garchUpdate(0.008, 0.12, 0.82, sigmaRef.current, (Math.random() - 0.5) * 0.6);
      const base = Math.min(1, sigmaRef.current * 22);
      setBars((b) => b.map(() => Math.max(0.12, Math.min(1, base + (Math.random() - 0.5) * 0.5))));
    }, 900);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", width: "100%" }}>
      <div style={{ fontFamily: INSTRUMENT_FONT, fontSize: "8px", fontWeight: 800, letterSpacing: "3px", color: INK.gold, textAlign: "center" }}>
        MAD GAMBIT INSTRUMENT CLUSTER
      </div>
      <div style={{ fontFamily: INSTRUMENT_FONT, fontSize: "7px", color: INK.muted, letterSpacing: "1px", textAlign: "center" }}>
        Z-LIAR SENTIMENT &middot; CONVICTION &middot; SCANDAL &sigma;&sup2; &middot; LIVE
      </div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: "10px", flexWrap: "wrap", width: "100%" }}>
        <PodFrame uid={`${uid}-z`} label="Z-LIAR SENTIMENT" accent={INK.pink}><ZLiarPod value={zliar} uid={`${uid}-z`} /></PodFrame>
        <PodFrame uid={`${uid}-c`} label="CONVICTION" accent={INK.cyan}><ConvictionPod series={conv} uid={`${uid}-c`} /></PodFrame>
        <PodFrame uid={`${uid}-s`} label="SCANDAL σ²" accent={INK.gold}><ScandalBarsPod bars={bars} uid={`${uid}-s`} /></PodFrame>
      </div>
    </div>
  );
}
