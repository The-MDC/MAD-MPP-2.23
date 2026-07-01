"use client";

/**
 * MAD Gambit — Gambit Instrument Cluster (v2)
 * ══════════════════════════════════════════════════════════════════
 * CANONICAL BENCHMARK COMPONENT. Ultra-high-fidelity gold instrument
 * panel — the reference standard for every gauge, odometer, and dial
 * in MAD Gambit. See lib/gambit-design-tokens.ts for the shared
 * material definitions this component consumes.
 *
 * v2 CHANGE FROM v1:
 * v1 rendered ONE 6-digit KPI (e.g. "128450" = Platform Volume) as a
 * single fused odometer — a car odometer, not a Seiko instrument
 * cluster. A real instrument panel has SEPARATE independently
 * meaningful gauges. v2 makes each of the 3 digit-pairs an
 * INDEPENDENT, independently customizable 2-digit stat pod with its
 * own gold case, label, color, and selector dots — e.g. pod 1 =
 * Active Predictions (24), pod 2 = Community Pool % (88), pod 3 =
 * Chaos Index (67). Same for both flanking dials: each cycles through
 * its own preset list, not a hardcoded single stat.
 *
 * LAYOUT: perfectly center-aligned — dial / [pod · pod · pod] / dial,
 * all on a shared baseline, all gold-cased.
 * ══════════════════════════════════════════════════════════════════
 */

import React, { useState } from "react";
import { GOLD_CHISEL_STOPS, INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";

const SEG_GEOM: Record<string, string> = {
  a: "6,2 26,2 22,6 10,6",
  b: "28,4 28,25 24,23 24,8",
  c: "28,29 28,50 24,46 24,31",
  d: "6,52 26,52 22,48 10,48",
  e: "2,29 2,50 6,46 6,31",
  f: "2,4 2,25 6,23 6,8",
  g: "8,25 22,25 25,27 22,29 8,29 5,27",
};

const DIGIT_MAP: Record<string, string> = {
  "0": "abcdef", "1": "bc", "2": "abged", "3": "abgcd", "4": "fgbc",
  "5": "afgcd", "6": "afgecd", "7": "abc", "8": "abcdefg", "9": "abcdfg",
  " ": "",
};

const LCD_OFF = "#241a0c";

export interface DigitPairStat {
  label: string;
  value: string;
  color: string;
}

export interface DialStat {
  label: string;
  value: number;
  colorA: string;
  colorB: string;
}

const DEFAULT_PAIR1_PRESETS: DigitPairStat[] = [
  { label: "ACTIVE PREDICTIONS", value: "24", color: "#ffcf40" },
  { label: "WIN STREAK RECORD",  value: "12", color: "#00e5ff" },
  { label: "CARDS OPENED TODAY", value: "41", color: "#ff007f" },
];
const DEFAULT_PAIR2_PRESETS: DigitPairStat[] = [
  { label: "COMMUNITY POOL %",   value: "88", color: "#00ff88" },
  { label: "TOTAL USERS (K)",    value: "24", color: "#ffcf40" },
  { label: "TOURNAMENT ENTRIES", value: "56", color: "#00e5ff" },
];
const DEFAULT_PAIR3_PRESETS: DigitPairStat[] = [
  { label: "CHAOS INDEX",        value: "67", color: "#ff007f" },
  { label: "APY BOOST %",        value: "48", color: "#00ff88" },
  { label: "SHIELD UTILIZATION", value: "31", color: "#ffcf40" },
];

const DEFAULT_LEFT_DIAL_PRESETS: DialStat[] = [
  { label: "CHAOS",        value: 67, colorA: "#ffd700", colorB: "#ff007f" },
  { label: "SHIELD USE",   value: 41, colorA: "#00e5ff", colorB: "#ffd700" },
  { label: "FURNACE BURN", value: 22, colorA: "#ff4500", colorB: "#ff007f" },
];
const DEFAULT_RIGHT_DIAL_PRESETS: DialStat[] = [
  { label: "WIN RATE",       value: 55, colorA: "#00e5ff", colorB: "#00ff88" },
  { label: "STAKING APY",    value: 68, colorA: "#ffd700", colorB: "#00ff88" },
  { label: "CONVICTION ACC", value: 74, colorA: "#c98aff", colorB: "#00e5ff" },
];

function SevenSegDigit({ x, char, color }: { x: number; char: string; color: string }) {
  const lit = DIGIT_MAP[char] ?? "";
  return (
    <g transform={`translate(${x},10)`}>
      {Object.entries(SEG_GEOM).map(([seg, points]) => {
        const on = lit.includes(seg);
        return (
          <polygon
            key={seg}
            points={points}
            fill={on ? color : LCD_OFF}
            style={on ? { filter: `drop-shadow(0 0 3px ${color})` } : undefined}
          />
        );
      })}
    </g>
  );
}

function DigitPairPod({
  presets, idx, onSelect, uid,
}: {
  presets: DigitPairStat[]; idx: number; onSelect: (i: number) => void; uid: string;
}) {
  const stat = presets[idx];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
      <svg width={96} height={72} viewBox="0 0 96 72" role="img" aria-label={`${stat.label}: ${stat.value}`}>
        <defs>
          <linearGradient id={`pair-gold-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            {GOLD_CHISEL_STOPS.map(([offset, c]) => <stop key={offset} offset={`${offset}%`} stopColor={c} />)}
          </linearGradient>
          <filter id={`pair-glow-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <rect x="2" y="2" width="92" height="68" rx="14" fill={`url(#pair-gold-${uid})`} />
        <rect x="4.5" y="4.5" width="87" height="63" rx="11.5" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.3" />

        {[[12, 12], [84, 12], [12, 60], [84, 60]].map(([cx, cy], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r="2" fill="#5c3c04" />
            <circle cx={cx - 0.5} cy={cy - 0.5} r="0.7" fill="rgba(255,255,255,0.7)" />
          </g>
        ))}

        <rect x="14" y="14" width="68" height="44" rx="5" fill="#0a0705" stroke="#000" strokeWidth="1.5" />
        <rect x="14" y="14" width="68" height="11" rx="5" fill="rgba(255,255,255,0.03)" />

        <g filter={`url(#pair-glow-${uid})`}>
          <SevenSegDigit x={22} char={stat.value[0] ?? "0"} color={stat.color} />
          <SevenSegDigit x={56} char={stat.value[1] ?? "0"} color={stat.color} />
        </g>
      </svg>

      <div style={{
        fontFamily: INSTRUMENT_FONT, fontSize: "7px", fontWeight: 800,
        color: stat.color, letterSpacing: "1.3px", textAlign: "center", minHeight: "9px",
      }}>
        {stat.label}
      </div>

      <div style={{ display: "flex", gap: "4px" }}>
        {presets.map((p, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            aria-label={`Show ${p.label}`}
            style={{
              width: "6px", height: "6px", borderRadius: "50%", border: "none",
              cursor: "pointer", padding: 0,
              background: i === idx ? stat.color : "#3a3020",
              transition: "background 0.2s",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function AnalogGauge({
  presets, idx, onSelect, uid,
}: {
  presets: DialStat[]; idx: number; onSelect: (i: number) => void; uid: string;
}) {
  const stat = presets[idx];
  const CX = 54, CY = 54, R = 48;
  const startA = -220, sweepA = 260 * (Math.max(0, Math.min(100, stat.value)) / 100);
  const sa = (startA * Math.PI) / 180, ea = ((startA + sweepA) * Math.PI) / 180;
  const ax1 = CX + Math.cos(sa) * (R - 13), ay1 = CY + Math.sin(sa) * (R - 13);
  const ax2 = CX + Math.cos(ea) * (R - 13), ay2 = CY + Math.sin(ea) * (R - 13);
  const large = sweepA > 180 ? 1 : 0;
  const needleAng = ((startA + sweepA) * Math.PI) / 180;
  const nx = CX + Math.cos(needleAng) * (R - 15), ny = CY + Math.sin(needleAng) * (R - 15);
  const ticks = Array.from({ length: 11 }, (_, t) => {
    const ang = ((-220 + t * 24) * Math.PI) / 180;
    return {
      x1: CX + Math.cos(ang) * (R - 13), y1: CY + Math.sin(ang) * (R - 13),
      x2: CX + Math.cos(ang) * (R - 17), y2: CY + Math.sin(ang) * (R - 17),
    };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
      <svg width={108} height={108} viewBox="0 0 108 108" role="img" aria-label={`${stat.label} gauge at ${Math.round(stat.value)}%`}>
        <defs>
          <linearGradient id={`gauge-gold-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            {GOLD_CHISEL_STOPS.map(([offset, c]) => <stop key={offset} offset={`${offset}%`} stopColor={c} />)}
          </linearGradient>
          <linearGradient id={`gauge-arc-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={stat.colorA} />
            <stop offset="100%" stopColor={stat.colorB} />
          </linearGradient>
        </defs>

        <circle cx={CX} cy={CY} r={R} fill="none" stroke={`url(#gauge-gold-${uid})`} strokeWidth="8" />
        <circle cx={CX} cy={CY} r={R - 5.5} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
        <circle cx={CX} cy={CY} r={R - 9} fill="#0a0a12" />

        {ticks.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
        ))}

        <path
          d={`M ${ax1} ${ay1} A ${R - 13} ${R - 13} 0 ${large} 1 ${ax2} ${ay2}`}
          fill="none" stroke={`url(#gauge-arc-${uid})`} strokeWidth="5" strokeLinecap="round"
        />
        <line x1={CX} y1={CY} x2={nx} y2={ny} stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx={CX} cy={CY} r="4" fill={`url(#gauge-gold-${uid})`} />

        <text x={CX} y={CY + 22} textAnchor="middle" fontSize="9" fontWeight="900" fill={stat.colorB} fontFamily={INSTRUMENT_FONT}>
          {Math.round(stat.value)}%
        </text>
      </svg>

      <div style={{
        fontFamily: INSTRUMENT_FONT, fontSize: "7px", fontWeight: 800,
        color: "#8a8a95", letterSpacing: "1px", textAlign: "center",
      }}>
        {stat.label}
      </div>

      <div style={{ display: "flex", gap: "4px" }}>
        {presets.map((p, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            aria-label={`Show ${p.label} gauge`}
            style={{
              width: "6px", height: "6px", borderRadius: "50%", border: "none",
              cursor: "pointer", padding: 0,
              background: i === idx ? stat.colorB : "#2a2a35",
              transition: "background 0.2s",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export interface GambitInstrumentClusterProps {
  pair1Presets?: DigitPairStat[];
  pair2Presets?: DigitPairStat[];
  pair3Presets?: DigitPairStat[];
  leftDialPresets?: DialStat[];
  rightDialPresets?: DialStat[];
  uid?: string;
}

export default function GambitInstrumentCluster({
  pair1Presets = DEFAULT_PAIR1_PRESETS,
  pair2Presets = DEFAULT_PAIR2_PRESETS,
  pair3Presets = DEFAULT_PAIR3_PRESETS,
  leftDialPresets = DEFAULT_LEFT_DIAL_PRESETS,
  rightDialPresets = DEFAULT_RIGHT_DIAL_PRESETS,
  uid = "hero",
}: GambitInstrumentClusterProps) {
  const [p1, setP1] = useState(0);
  const [p2, setP2] = useState(0);
  const [p3, setP3] = useState(0);
  const [dl, setDl] = useState(0);
  const [dr, setDr] = useState(0);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", width: "100%" }}>
      <div style={{
        fontFamily: INSTRUMENT_FONT, fontSize: "8px", fontWeight: 800,
        letterSpacing: "3px", color: "#ffd700", textAlign: "center",
      }}>
        MAD GAMBIT INSTRUMENT CLUSTER
      </div>
      <div style={{
        fontFamily: INSTRUMENT_FONT, fontSize: "7px", color: "#6b7280",
        letterSpacing: "1px", textAlign: "center",
      }}>
        3 INDEPENDENT KPI PODS &middot; 2 CUSTOMIZABLE DIALS &middot; TAP ANY DOT TO SWAP
      </div>

      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        gap: "16px", flexWrap: "wrap", width: "100%",
      }}>
        <AnalogGauge presets={leftDialPresets} idx={dl} onSelect={setDl} uid={`${uid}-l`} />

        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
          <DigitPairPod presets={pair1Presets} idx={p1} onSelect={setP1} uid={`${uid}-p1`} />
          <DigitPairPod presets={pair2Presets} idx={p2} onSelect={setP2} uid={`${uid}-p2`} />
          <DigitPairPod presets={pair3Presets} idx={p3} onSelect={setP3} uid={`${uid}-p3`} />
        </div>

        <AnalogGauge presets={rightDialPresets} idx={dr} onSelect={setDr} uid={`${uid}-r`} />
      </div>
    </div>
  );
}
