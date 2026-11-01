/**
 * MAD Gambit — Global Design Tokens
 * ══════════════════════════════════════════════════════════════════
 * EXPLICIT, GLOBAL DESIGN LAW. This file is the single source of
 * truth for the ultra-high-fidelity "gold instrument panel" standard.
 * Every gauge, odometer, dial, card frame, and panel in MAD Gambit
 * imports GOLD_CHISEL_STOPS and INK from here — never redefine these
 * values locally. If a component needs the gold treatment, it imports
 * this file. No exceptions, no flat CSS approximations of a physical
 * material.
 *
 * Provenance: matches components/nft-card.tsx's original `gold-${uid}`
 * gradient exactly. That gradient was the first correct rendering of
 * the brand's gold-chisel material; this file promotes it to the
 * canonical global standard so every future component inherits it
 * automatically instead of re-deriving it by eye.
 * ══════════════════════════════════════════════════════════════════
 */

/** Gold-chisel gradient stops — the ONE gold used everywhere in MAD Gambit. */
export const GOLD_CHISEL_STOPS: [number, string][] = [
  [0, "#f6d378"],
  [25, "#d69d41"],
  [50, "#a86821"],
  [75, "#f6d378"],
  [100, "#794816"],
];

/** Core instrument-panel palette — deep-space background, neon accents. */
export const INK = {
  bgDeep:     "#080a12",
  bgPanel:    "#0d1018",
  bgCard:     "#111520",
  bgCardHov:  "#161c28",
  gold:       "#d69d41",
  goldDim:    "#a86821",
  goldLcd:    "#ffcf40",
  cyan:       "#00e5ff",
  cyanDim:    "#007a8a",
  pink:       "#f5242a",
  pinkDim:    "#7a003c",
  green:      "#00ff88",
  greenDim:   "#008844",
  white:      "#f0f0f8",
  muted:      "#6b7280",
  border:     "rgba(255,255,255,0.06)",
  borderGold: "rgba(214,157,65,0.3)",
  borderCyan: "rgba(0,229,255,0.25)",
  lcdOff:     "#241a0c",
} as const;

/**
 * Renders GOLD_CHISEL_STOPS as JSX <stop> children for an SVG
 * <linearGradient>. Every gold-cased component calls this instead of
 * hand-writing stop tags, so a future palette change propagates
 * everywhere in one edit.
 */
export function goldStopsJSX() {
  return GOLD_CHISEL_STOPS.map(([offset, color]) => ({ offset, color }));
}

/**
 * Standard instrument bezel geometry — reused by odometers and dials
 * so every gold-cased element reads as the same physical hardware
 * family, just scaled.
 */
export const BEZEL = {
  caseRadius: 16,
  caseStroke: 1.5,
  rivetRadius: 2.4,
  rivetHiRadius: 0.9,
  panelRadius: 6,
} as const;

/** Shared font stack for every instrument-panel numeral and label. */
export const INSTRUMENT_FONT = "ui-monospace, 'JetBrains Mono', monospace";
