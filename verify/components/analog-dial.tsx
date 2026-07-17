"use client";

/**
 * AnalogDial — ultra-fidelity reusable gauge
 * Glass bezel · recessed track · glow arc · 21-tick ring · triangular needle · LCD readout
 * Used by: Z-Liar Meter (verdict spectrum), Workbench retention dial (cognition gradient)
 */

import React, { useMemo } from "react";

export interface DialGradientStop {
  offset: string;
  color: string;
}

export interface AnalogDialProps {
  value: number;                         // 0–100
  gradientStops?: DialGradientStop[];
  label?: string;
  unit?: string;
  subLabel?: string;
  /** Must be unique per page — used to namespace SVG gradient/filter IDs */
  dialId?: string;
  className?: string;
}

export const VERDICT_GRADIENT: DialGradientStop[] = [
  { offset: "0%",   color: "#7cffc7" },
  { offset: "38%",  color: "#fbbf24" },
  { offset: "68%",  color: "#f43f5e" },
  { offset: "100%", color: "#ff00f0" },
];

export const COGNITION_GRADIENT: DialGradientStop[] = [
  { offset: "0%",   color: "#22d3ee" },
  { offset: "50%",  color: "#fbbf24" },
  { offset: "100%", color: "#ec4899" },
];

// Arc geometry — semicircle centre (140, 140) in viewBox "0 0 280 168"
const CX = 140, CY = 140;
const ARC_LEN = 333; // ≈ π × 106 (track radius)

export default function AnalogDial({
  value,
  gradientStops = VERDICT_GRADIENT,
  label = "Score",
  unit = "ZL",
  subLabel = "",
  dialId = "ad",
  className = "",
}: AnalogDialProps) {
  const v = Math.max(0, Math.min(100, value));
  const dashOffset = ARC_LEN - (v / 100) * ARC_LEN;
  const needleAngle = (v / 100) * 180 - 90; // −90° (0) → +90° (100)

  const ticks = useMemo(() =>
    Array.from({ length: 21 }, (_, i) => {
      const ang = ((-90 + (i / 20) * 180) * Math.PI) / 180;
      const isMajor = i % 5 === 0;
      const r1 = isMajor ? 86 : 92;
      return {
        x1: CX + Math.sin(ang) * r1,
        y1: CY - Math.cos(ang) * r1,
        x2: CX + Math.sin(ang) * 100,
        y2: CY - Math.cos(ang) * 100,
        isMajor,
      };
    }),
  []);

  const p = dialId; // short prefix for SVG IDs

  return (
    <div className={`relative inline-block ${className}`}>
      <svg viewBox="0 0 280 168" className="block w-full">
        <defs>
          {/* verdict / cognition arc gradient */}
          <linearGradient id={`${p}-arc`} x1="0" y1="0" x2="1" y2="0">
            {gradientStops.map((s, i) => (
              <stop key={i} offset={s.offset} stopColor={s.color} />
            ))}
          </linearGradient>

          {/* dark metallic bezel */}
          <linearGradient id={`${p}-bezel`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#2a2f3d" />
            <stop offset="50%"  stopColor="#0d1017" />
            <stop offset="100%" stopColor="#03040a" />
          </linearGradient>

          {/* needle gradient: hot-white tip → coral → deep red base */}
          <linearGradient id={`${p}-ndl`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#ffe3e8" />
            <stop offset="45%"  stopColor="#ff5d76" />
            <stop offset="100%" stopColor="#c81e3c" />
          </linearGradient>

          {/* hub metallic sphere */}
          <radialGradient id={`${p}-hub`} cx="38%" cy="32%" r="75%">
            <stop offset="0%"   stopColor="#3a4152" />
            <stop offset="55%"  stopColor="#14171f" />
            <stop offset="100%" stopColor="#05060b" />
          </radialGradient>

          {/* soft bloom glow */}
          <filter id={`${p}-glow`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" />
          </filter>

          {/* inset shadow on track */}
          <filter id={`${p}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodColor="#000" floodOpacity="0.85" />
          </filter>
        </defs>

        {/* ── glass bezel ring ── */}
        <path d="M 22 140 A 118 118 0 0 1 258 140"
          fill="none" stroke={`url(#${p}-bezel)`} strokeWidth="26" strokeLinecap="round" />

        {/* ── recessed black track ── */}
        <path d="M 34 140 A 106 106 0 0 1 246 140"
          fill="none" stroke="#0a0c12" strokeWidth="15" strokeLinecap="round"
          filter={`url(#${p}-shadow)`} />

        {/* ── glow underlay of progress arc ── */}
        <path d="M 34 140 A 106 106 0 0 1 246 140"
          fill="none" stroke={`url(#${p}-arc)`} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={ARC_LEN} strokeDashoffset={dashOffset}
          opacity="0.55" filter={`url(#${p}-glow)`} />

        {/* ── crisp progress arc ── */}
        <path d="M 34 140 A 106 106 0 0 1 246 140"
          fill="none" stroke={`url(#${p}-arc)`} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={ARC_LEN} strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1)" }} />

        {/* ── tick ring (21 ticks, major every 5) ── */}
        {ticks.map((t, i) => (
          <line key={i}
            x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke={t.isMajor ? "#5b6472" : "#2b313d"}
            strokeWidth={t.isMajor ? "2" : "1.2"}
            strokeLinecap="round" />
        ))}

        {/* ── needle: glow layer then crisp layer ── */}
        <g
          transform={`rotate(${needleAngle} ${CX} ${CY})`}
          style={{ transition: "transform 0.6s cubic-bezier(0.16,1,0.3,1)" }}
        >
          <polygon
            points={`${CX},44 ${CX - 4.5},${CY} ${CX + 4.5},${CY}`}
            fill={`url(#${p}-ndl)`}
            filter={`url(#${p}-glow)`}
            opacity="0.85"
          />
          <polygon
            points={`${CX},44 ${CX - 3.5},${CY} ${CX + 3.5},${CY}`}
            fill={`url(#${p}-ndl)`}
          />
        </g>

        {/* ── hub cap ── */}
        <circle cx={CX} cy={CY} r="14" fill={`url(#${p}-hub)`} stroke="#f43f5e" strokeWidth="1.5" />
        <circle cx={CX} cy={CY} r="14" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="1" />
        <circle cx={CX - 4} cy={CY - 4} r="3"   fill="rgba(255,255,255,.28)" />
      </svg>

      {/* ── LCD readout panel ── */}
      <div
        className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-center px-5 py-2.5 rounded-[14px] whitespace-nowrap pointer-events-none"
        style={{
          background: "linear-gradient(180deg,rgba(0,0,0,.9),rgba(8,10,16,.9))",
          border: "1px solid rgba(120,130,160,.14)",
          boxShadow: "inset 0 2px 10px rgba(0,0,0,.8), 0 0 24px rgba(244,63,94,.14)",
        }}
      >
        <div className="font-mono text-[7px] uppercase tracking-[0.28em] text-[#5a6070]">
          {label}
        </div>
        <div
          className="font-mono text-[26px] font-black text-white leading-none mt-0.5"
          style={{ textShadow: "0 0 18px rgba(244,63,94,.55)" }}
        >
          {Math.round(v)}{" "}
          <span className="text-[11px] text-[#ff5d76]">{unit}</span>
        </div>
        {subLabel && (
          <div className="font-mono text-[7px] uppercase tracking-[0.2em] text-[#ff5d76] mt-0.5">
            {subLabel}
          </div>
        )}
      </div>
    </div>
  );
}
