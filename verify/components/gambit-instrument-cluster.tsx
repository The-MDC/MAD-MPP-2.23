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

import React, { useState, useRef } from "react";
import { GOLD_CHISEL_STOPS, INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";

/** Double-tap / double-click detector (mouse + touch) → cycles the pod/dial. */
function useDoubleTap(cb: () => void) {
  const last = useRef(0);
  return () => {
    const now = Date.now();
    if (now - last.current < 320) { cb(); last.current = 0; }
    else last.current = now;
  };
}

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

/**
 * The crypto instrument a dial can carry.
 *
 * A dial without this is the original scalar gauge: one needle, one percent.
 * A dial WITH it renders the full instrument — spectrum ring, sparkline and
 * price readout struck inside the same gold case — because a crypto is not a
 * scalar. It has a level (the needle), a shape over time (the sparkline) and a
 * distribution (the spectrum), and showing only the needle throws two of the
 * three away.
 *
 * `series` and `spectrum` are normalised 0..1 so the gauge never has to know
 * what a price is; the caller scales. Both are fixed-length literals rather
 * than generated, so server and client paint identically — a Math.random()
 * series here would hydration-mismatch on every load.
 */
export interface DialCrypto {
  symbol: string;
  /** Pre-formatted for display — the gauge does no number formatting. */
  price: string;
  change: string;
  up: boolean;
  /** Normalised closes, oldest -> newest. Drawn as the sparkline. */
  series: number[];
  /** Normalised band magnitudes. Drawn as the spectrum ring. */
  spectrum: number[];
}

export interface DialStat {
  label: string;
  value: number;
  colorA: string;
  colorB: string;
  /** Present => render as a crypto instrument rather than a scalar gauge. */
  crypto?: DialCrypto;
}

const DEFAULT_PAIR1_PRESETS: DigitPairStat[] = [
  { label: "ACTIVE PREDICTIONS", value: "24", color: "#ffcf40" },
  { label: "WIN STREAK RECORD",  value: "12", color: "#00e5ff" },
  { label: "CARDS OPENED TODAY", value: "41", color: "#f5242a" },
];
const DEFAULT_PAIR2_PRESETS: DigitPairStat[] = [
  { label: "COMMUNITY POOL %",   value: "88", color: "#00ff88" },
  { label: "TOTAL USERS (K)",    value: "24", color: "#ffcf40" },
  { label: "TOURNAMENT ENTRIES", value: "56", color: "#00e5ff" },
];
const DEFAULT_PAIR3_PRESETS: DigitPairStat[] = [
  { label: "CHAOS INDEX",        value: "67", color: "#f5242a" },
  { label: "APY BOOST %",        value: "48", color: "#00ff88" },
  { label: "SHIELD UTILIZATION", value: "31", color: "#ffcf40" },
];

/**
 * The three pods' preset triplets, in pod order. Exported so the split-flap
 * chrono can drive its three digit-pairs off the SAME stats the pods use —
 * the clock and the pods are two renderings of one instrument, and a second
 * copy of this list would drift the moment either side gained a stat.
 */
export const DEFAULT_PAIR_PRESETS: DigitPairStat[][] = [
  DEFAULT_PAIR1_PRESETS,
  DEFAULT_PAIR2_PRESETS,
  DEFAULT_PAIR3_PRESETS,
];

/**
 * READINGS ARE PLACEHOLDERS. Every price, series and spectrum below is a
 * shaped demo constant, not a measurement — these dials have no fetch. They
 * are sized to be plausible so the instrument is honest about the range it
 * has to render, and each is replaceable wholesale through the
 * leftDialPresets / rightDialPresets props without touching this file.
 *
 * Three cryptos per dial, majors on the left and the second rank on the right,
 * so the two sides read as different desks rather than the same desk twice.
 */
const DEFAULT_LEFT_DIAL_PRESETS: DialStat[] = [
  {
    label: "BTC · MOMENTUM", value: 72, colorA: "#d69d41", colorB: "#ff9500",
    crypto: {
      symbol: "BTC", price: "$69,420", change: "+4.2%", up: true,
      series: [0.42, 0.38, 0.47, 0.52, 0.49, 0.58, 0.63, 0.61, 0.70, 0.74, 0.71, 0.79],
      spectrum: [0.35, 0.52, 0.68, 0.81, 0.62, 0.47, 0.58, 0.72, 0.44, 0.31],
    },
  },
  {
    label: "ETH · MOMENTUM", value: 58, colorA: "#00e5ff", colorB: "#8a7cff",
    crypto: {
      symbol: "ETH", price: "$3,500", change: "+2.5%", up: true,
      series: [0.51, 0.55, 0.49, 0.44, 0.52, 0.57, 0.54, 0.60, 0.58, 0.64, 0.62, 0.66],
      spectrum: [0.42, 0.61, 0.55, 0.73, 0.48, 0.66, 0.39, 0.57, 0.62, 0.35],
    },
  },
  {
    label: "SOL · MOMENTUM", value: 81, colorA: "#00ff88", colorB: "#c98aff",
    crypto: {
      symbol: "SOL", price: "$180", change: "+5.0%", up: true,
      series: [0.30, 0.36, 0.34, 0.45, 0.53, 0.50, 0.62, 0.69, 0.66, 0.77, 0.83, 0.86],
      spectrum: [0.28, 0.44, 0.72, 0.85, 0.69, 0.53, 0.77, 0.61, 0.48, 0.37],
    },
  },
];
const DEFAULT_RIGHT_DIAL_PRESETS: DialStat[] = [
  {
    label: "XRP · MOMENTUM", value: 46, colorA: "#00e5ff", colorB: "#00ff88",
    crypto: {
      symbol: "XRP", price: "$0.62", change: "-1.4%", up: false,
      series: [0.62, 0.58, 0.61, 0.54, 0.49, 0.52, 0.46, 0.44, 0.48, 0.41, 0.39, 0.43],
      spectrum: [0.55, 0.41, 0.63, 0.38, 0.57, 0.44, 0.66, 0.35, 0.51, 0.29],
    },
  },
  {
    label: "DOGE · MOMENTUM", value: 63, colorA: "#d69d41", colorB: "#ffcf40",
    crypto: {
      symbol: "DOGE", price: "$0.16", change: "+7.8%", up: true,
      series: [0.33, 0.41, 0.37, 0.48, 0.44, 0.56, 0.61, 0.55, 0.67, 0.64, 0.72, 0.69],
      spectrum: [0.31, 0.58, 0.47, 0.79, 0.52, 0.68, 0.41, 0.63, 0.36, 0.54],
    },
  },
  {
    label: "LINK · MOMENTUM", value: 54, colorA: "#c98aff", colorB: "#00e5ff",
    crypto: {
      symbol: "LINK", price: "$14.80", change: "+0.9%", up: true,
      series: [0.47, 0.44, 0.50, 0.53, 0.48, 0.51, 0.57, 0.54, 0.52, 0.58, 0.55, 0.60],
      spectrum: [0.44, 0.37, 0.59, 0.46, 0.62, 0.51, 0.43, 0.68, 0.39, 0.47],
    },
  },
];

/**
 * Sparkline path across a band. `series` is 0..1 oldest -> newest; 1 sits at
 * yTop. Values are clamped rather than trusted, so a caller passing an
 * out-of-range sample distorts its own line instead of escaping the dial face.
 */
function sparkPath(series: number[], x0: number, x1: number, yTop: number, yBot: number): string {
  if (series.length < 2) return "";
  const dx = (x1 - x0) / (series.length - 1);
  return series
    .map((v, i) => {
      const x = x0 + i * dx;
      const y = yBot - Math.max(0, Math.min(1, v)) * (yBot - yTop);
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

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
  const tap = useDoubleTap(() => onSelect((idx + 1) % presets.length));
  return (
    <div onClick={tap} title="Double-tap to cycle" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", cursor: "pointer" }}>
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
            <circle cx={cx} cy={cy} r="2" fill="#794816" />
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
            onClick={(e) => { e.stopPropagation(); onSelect(i); }}
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
  const c = stat.crypto;
  const needleAng = ((startA + sweepA) * Math.PI) / 180;
  // In crypto mode the needle is shortened so it stays in the upper annulus
  // and never crosses the sparkline band below the centre.
  const needleLen = c ? R - 27 : R - 15;
  const nx = CX + Math.cos(needleAng) * needleLen, ny = CY + Math.sin(needleAng) * needleLen;

  // Spectrum ring — one radial bar per band, swept across the same arc the
  // ticks use so the two read as one scale.
  const bars = c
    ? c.spectrum.map((mag, i) => {
        const ang = ((-214 + (i * 248) / Math.max(1, c.spectrum.length - 1)) * Math.PI) / 180;
        const r0 = 22, r1 = r0 + Math.max(0, Math.min(1, mag)) * 7;
        return {
          x1: CX + Math.cos(ang) * r0, y1: CY + Math.sin(ang) * r0,
          x2: CX + Math.cos(ang) * r1, y2: CY + Math.sin(ang) * r1,
        };
      })
    : [];
  const ticks = Array.from({ length: 11 }, (_, t) => {
    const ang = ((-220 + t * 24) * Math.PI) / 180;
    return {
      x1: CX + Math.cos(ang) * (R - 13), y1: CY + Math.sin(ang) * (R - 13),
      x2: CX + Math.cos(ang) * (R - 17), y2: CY + Math.sin(ang) * (R - 17),
    };
  });

  const tap = useDoubleTap(() => onSelect((idx + 1) % presets.length));
  return (
    <div onClick={tap} title="Double-tap to cycle" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", cursor: "pointer" }}>
      <svg
        width={108} height={108} viewBox="0 0 108 108" role="img"
        aria-label={
          c
            ? `${c.symbol} ${c.price}, ${c.change}, ${stat.label} at ${Math.round(stat.value)}%`
            : `${stat.label} gauge at ${Math.round(stat.value)}%`
        }
      >
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
        {/* Spectrum ring — drawn under the needle so the needle stays readable. */}
        {bars.map((b, i) => (
          <line
            key={`sp-${i}`} x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2}
            stroke={stat.colorA} strokeWidth="1.6" strokeLinecap="round" opacity={0.5}
          />
        ))}

        <line x1={CX} y1={CY} x2={nx} y2={ny} stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx={CX} cy={CY} r="4" fill={`url(#gauge-gold-${uid})`} />

        {c ? (
          <>
            {/* Symbol, struck above the centre. */}
            <text x={CX} y={CY - 14} textAnchor="middle" fontSize="7.5" fontWeight="900"
              fill={`url(#gauge-gold-${uid})`} fontFamily={INSTRUMENT_FONT} letterSpacing="0.6">
              {c.symbol}
            </text>

            {/* Sparkline — the shape a single needle cannot carry. Filled to a
                baseline so direction reads at a glance, then stroked. */}
            <path
              d={`${sparkPath(c.series, CX - 24, CX + 24, CY + 4, CY + 19)} L ${CX + 24} ${CY + 19} L ${CX - 24} ${CY + 19} Z`}
              fill={stat.colorB} opacity={0.14}
            />
            <path
              d={sparkPath(c.series, CX - 24, CX + 24, CY + 4, CY + 19)}
              fill="none" stroke={stat.colorB} strokeWidth="1.4"
              strokeLinecap="round" strokeLinejoin="round"
            />

            <text x={CX} y={CY + 28} textAnchor="middle" fontSize="7.5" fontWeight="900"
              fill={stat.colorB} fontFamily={INSTRUMENT_FONT}>
              {c.price}
            </text>
            <text x={CX} y={CY + 36} textAnchor="middle" fontSize="6" fontWeight="800"
              fill={c.up ? "#00ff88" : "#f85b5f"} fontFamily={INSTRUMENT_FONT}>
              {c.change}
            </text>
          </>
        ) : (
          <text x={CX} y={CY + 22} textAnchor="middle" fontSize="9" fontWeight="900" fill={stat.colorB} fontFamily={INSTRUMENT_FONT}>
            {Math.round(stat.value)}%
          </text>
        )}
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
            onClick={(e) => { e.stopPropagation(); onSelect(i); }}
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
  /** Optional center replacement — when set, renders INSTEAD of the 3 KPI pods
   *  between the two dials (e.g. the split-flap chrono on the hub). */
  centerSlot?: React.ReactNode;
}

export default function GambitInstrumentCluster({
  pair1Presets = DEFAULT_PAIR1_PRESETS,
  pair2Presets = DEFAULT_PAIR2_PRESETS,
  pair3Presets = DEFAULT_PAIR3_PRESETS,
  leftDialPresets = DEFAULT_LEFT_DIAL_PRESETS,
  rightDialPresets = DEFAULT_RIGHT_DIAL_PRESETS,
  uid = "hero",
  centerSlot,
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
        letterSpacing: "3px", color: "#d69d41", textAlign: "center",
      }}>
        MAD GAMBIT INSTRUMENT CLUSTER
      </div>
      <div style={{
        fontFamily: INSTRUMENT_FONT, fontSize: "7px", color: "#6b7280",
        letterSpacing: "1px", textAlign: "center",
      }}>
        {centerSlot
          ? <>SPLIT-FLAP CHRONO &middot; 2 CUSTOMIZABLE DIALS &middot; TAP ANY DOT TO SWAP</>
          : <>3 INDEPENDENT KPI PODS &middot; 2 CUSTOMIZABLE DIALS &middot; TAP ANY DOT TO SWAP</>}
      </div>

      {/* Dial · centre · dial.
          This was one wrapping flex row, which on a narrow container broke as
          dial / centre / dial — one dial ABOVE the chrono and one BELOW it,
          the fault visible in production. The row now reorders instead of
          wrapping arbitrarily: both dials together on one line above the
          chrono when space is short, flanking it when there is room. See
          .mg-cluster-* in globals.css — a CONTAINER query, because the app
          renders inside a 393px device frame on desktop and a media query
          would answer for the monitor. */}
      <div className="mg-cluster-row">
        <div className="mg-cluster-l">
          <AnalogGauge presets={leftDialPresets} idx={dl} onSelect={setDl} uid={`${uid}-l`} />
        </div>

        <div className="mg-cluster-c">
          {centerSlot ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>{centerSlot}</div>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
              <DigitPairPod presets={pair1Presets} idx={p1} onSelect={setP1} uid={`${uid}-p1`} />
              <DigitPairPod presets={pair2Presets} idx={p2} onSelect={setP2} uid={`${uid}-p2`} />
              <DigitPairPod presets={pair3Presets} idx={p3} onSelect={setP3} uid={`${uid}-p3`} />
            </div>
          )}
        </div>

        <div className="mg-cluster-r">
          <AnalogGauge presets={rightDialPresets} idx={dr} onSelect={setDr} uid={`${uid}-r`} />
        </div>
      </div>
    </div>
  );
}
