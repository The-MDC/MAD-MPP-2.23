/**
 * MAD Gambit — the deck design system.
 * ══════════════════════════════════════════════════════════════════════
 * The six-card perp instrument deck established the platform's visual
 * language. This file is that language as data, so every other surface can
 * consume it instead of re-deriving it by eye.
 *
 * The rule that makes this work: a card sets ONE local `--c` accent, and
 * everything inside it — border, glow, title text-shadow, ticker ground,
 * chips — is a `color-mix()` off that single variable. Change `--c` and the
 * whole card retunes. Nothing hard-codes a card colour.
 *
 * Skin roles (`--ac --a2 --gd --po --tx --mu --pn --cd --bg`) are written by
 * `deckVars()` from the active skin, so both DOM and canvas read the same
 * values — `fitCanvas()` in lib/instrument-chrome.ts pulls them straight off
 * the cascade with getComputedStyle.
 *
 * Always author as `var(--x, #literal)`. The literal keeps a surface painted
 * while the page streams, before the wrapper's custom properties resolve.
 */
import type { Skin } from "@/lib/skins";

/* ── Accent roles ──────────────────────────────────────────────────────── */

/** The four accents a card may claim as its local `--c`. */
export type AccentVar = "--ac" | "--a2" | "--gd" | "--po";

export const ROLE = {
  bg: "var(--bg,#080a12)",
  panel: "var(--pn,#0d1018)",
  card: "var(--cd,#111520)",
  text: "var(--tx,#f0f0f8)",
  muted: "var(--mu,#6b7280)",
  accent: "var(--ac,#00e5ff)",
  accent2: "var(--a2,#f5242a)",
  gold: "var(--gd,#d69d41)",
  positive: "var(--po,#00ff88)",
  /** The card's own accent. Only valid inside a card that sets it. */
  c: "var(--c)",
} as const;

/**
 * Everything tuned off the card accent. `mix(role, pct)` is the one blending
 * helper — the deck uses `color-mix` throughout rather than rgba literals so
 * a skin swap retunes borders and glows, not just fills.
 */
export const mix = (role: string, pct: number, into = "transparent") =>
  `color-mix(in srgb, ${role} ${pct}%, ${into})`;

/* ── Type scale ────────────────────────────────────────────────────────── */

/**
 * Lifted from the design file. These are small on purpose: the deck reads as
 * instrumentation, and instrument labels are engraved, not set in body copy.
 */
export const TYPE = {
  /** Card title — 10.5/800, wide tracking, uppercase, glows in `--c`. */
  cardTitle: { fontSize: 10.5, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase" },
  /** Kicker under the title — the market's mechanism, one line, ellipsised. */
  kicker: { fontSize: 6.5, letterSpacing: 0.9, textTransform: "uppercase" },
  /** KPI label / chip-row scale. */
  kpiLabel: { fontSize: 6.5, letterSpacing: 1, textTransform: "uppercase" },
  kpiValue: { fontSize: 11.5, fontWeight: 800 },
  /** Ticker metrics — the only 9px in the system. */
  tapeMetric: { fontSize: 9, fontWeight: 800 },
  /** Chip. */
  chip: { fontSize: 7, fontWeight: 700, textTransform: "uppercase" },
  /** LIVE pip. */
  pip: { fontSize: 7, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" },
  /** LCD plate. */
  lcdLabel: { fontSize: 6.5, letterSpacing: 2.4, textTransform: "uppercase" },
  lcdValue: { fontSize: 26, fontWeight: 800, lineHeight: 1 },
  lcdUnit: { fontSize: 11 },
  lcdBand: { fontSize: 6.5, letterSpacing: 1.6, textTransform: "uppercase" },
  /** Section heading above a deck. */
  sectionTitle: { fontSize: 12, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase" },
  /** Deck brand line + footer. */
  brand: { fontSize: 13, fontWeight: 800, letterSpacing: 2.4, textTransform: "uppercase" },
  brandSub: { fontSize: 8, letterSpacing: 1.4, textTransform: "uppercase" },
} as const;

/** The engraved-label grey. Deliberately not `--mu`: it must stay dim in both
 *  skins, where `--mu` lifts to a warm tan under Gilded. */
export const ENGRAVED = "#565d6b";

/* ── Geometry ──────────────────────────────────────────────────────────── */

export const GEO = {
  cardRadius: 18,
  shellRadius: 24,
  pillRadius: 99,
  plateRadius: 12,
  cardPadding: 12,
  cardMinHeight: 378,
  /** The instrument well, scaled by the deck's `--dial` control. */
  wellMinHeight: "calc(183px * var(--dial, 1))",
  gap: 14,
  maxWidth: 1340,
  /** Never let a column crush below this before the grid reflows. */
  trackFloor: 238,
} as const;

/**
 * The deck grid. Asks for `--cols` columns but refuses to go under the track
 * floor, so it reflows rather than compressing the instruments.
 */
// `gap` is annotated: GEO is `as const`, so GEO.gap alone would infer the
// literal type 14 and reject any caller passing a real number.
export const deckGrid = (gap: number = GEO.gap) =>
  `repeat(auto-fit, minmax(max(${GEO.trackFloor}px, calc((100% - (var(--cols,3) - 1) * ${gap}px) / var(--cols,3))), 1fr))`;

/* ── Composite recipes ─────────────────────────────────────────────────── */

/** The card shell: panel→card gradient, accent border, double shadow. */
export const cardSurface = (): React.CSSProperties => ({
  background: `linear-gradient(145deg, ${ROLE.panel}, ${ROLE.card})`,
  border: `1px solid ${mix(ROLE.c, 42)}`,
  borderRadius: GEO.cardRadius,
  padding: GEO.cardPadding,
  boxShadow: `0 0 0 1px ${mix(ROLE.text, 6)}, 0 0 26px ${mix(ROLE.c, 10)}`,
  overflow: "hidden",
});

/** The deck shell the cards sit in — inverse gradient, gold hairline. */
export const shellSurface = (): React.CSSProperties => ({
  background: `linear-gradient(180deg, ${ROLE.panel}, ${ROLE.bg})`,
  border: `1px solid ${mix(ROLE.text, 8)}`,
  borderRadius: GEO.shellRadius,
  padding: "clamp(10px, 1.4vw, 16px)",
  boxShadow: `0 0 0 1px ${mix(ROLE.gold, 13)}, 0 0 44px ${mix(ROLE.accent, 7)}`,
});

/** The LCD plate that seats into an instrument. */
export const lcdSurface = (): React.CSSProperties => ({
  background: "linear-gradient(180deg,rgba(0,0,0,.9),rgba(8,10,16,.9))",
  border: "1px solid rgba(120,130,160,.14)",
  borderRadius: GEO.plateRadius,
  boxShadow: `inset 0 2px 10px rgba(0,0,0,.8), 0 0 24px ${mix(ROLE.c, 18)}`,
});

/** The live-ticker strip: hairline top and bottom, tinted ground. */
export const tapeSurface = (): React.CSSProperties => ({
  borderTop: `1px solid ${mix(ROLE.c, 24)}`,
  borderBottom: `1px solid ${mix(ROLE.c, 16)}`,
  background: mix(ROLE.c, 5),
  overflow: "hidden",
});

/** A pill chip in the card's accent. */
export const chipSurface = (): React.CSSProperties => ({
  ...TYPE.chip,
  color: ROLE.c,
  border: `1px solid ${mix(ROLE.c, 28)}`,
  background: mix(ROLE.c, 7),
  borderRadius: GEO.pillRadius,
  padding: "4px 8px",
});

/* ── Motion ────────────────────────────────────────────────────────────── */

/**
 * Every keyframe the system uses, plus the reduced-motion cut-out. Injected
 * once by <DeckStyles/>; surfaces reference the class names.
 */
export const DECK_KEYFRAMES = `
@keyframes mgTkL { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes mgTkR { from { transform: translateX(-50%); } to { transform: translateX(0); } }
@keyframes mgPulse { 0%,100% { opacity:.35; transform: scale(1); } 50% { opacity:1; transform: scale(1.35); } }
@keyframes mgBar { 0%,100% { transform: scaleY(.72); } 50% { transform: scaleY(1); } }
@keyframes mgSeg { 0%,100% { opacity:.55; } 50% { opacity:1; } }
.mg-focusable:focus-visible { outline: 2px solid var(--gd,#d69d41); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) {
  .mg-tape, .mg-pip, .mg-bar, .mg-seg { animation: none !important; }
}
`;

export const EASE = {
  conviction: "cubic-bezier(0.22, 1, 0.36, 1)",
  settle: "0.6s cubic-bezier(0.16, 1, 0.3, 1)",
} as const;

/* ── Control plane ─────────────────────────────────────────────────────── */

/** The four persisted deck controls, and the CSS variable each drives. */
export const CONTROLS = {
  tk: { key: "mg_ticker_speed", min: 8, max: 70, step: 2, def: 30, cssVar: "--tk", unit: "s" },
  sym: { key: "mg_symbol_size", min: 0, max: 44, step: 2, def: 26, cssVar: "--sym", unit: "px" },
  dial: { key: "mg_dial_size", min: 60, max: 125, step: 5, def: 100, cssVar: "--dial", unit: "%" },
  cols: { key: "mg_cols", min: 2, max: 4, step: 1, def: 3, cssVar: "--cols", unit: "" },
} as const;

/**
 * Writes the skin + control values onto a wrapper as custom properties. Put
 * this on any surface that wants the deck language; children — DOM and canvas
 * alike — read it off the cascade.
 */
export function deckVars(
  skin: Skin,
  ctl?: { tk?: number; sym?: number; dial?: number; cols?: number },
): React.CSSProperties {
  return {
    "--bg": skin.bg,
    "--pn": skin.panel,
    "--cd": skin.card,
    "--tx": skin.text,
    "--mu": skin.muted,
    "--ac": skin.accent,
    "--a2": skin.accent2,
    "--gd": skin.gold,
    "--po": skin.positive,
    ...(ctl?.tk !== undefined ? { "--tk": `${ctl.tk}s` } : null),
    ...(ctl?.sym !== undefined ? { "--sym": `${ctl.sym}px` } : null),
    ...(ctl?.dial !== undefined ? { "--dial": ctl.dial / 100 } : null),
    ...(ctl?.cols !== undefined ? { "--cols": ctl.cols } : null),
  } as React.CSSProperties;
}

/** Canonical platform numbers, for the deck footer and any surface citing them. */
export const CANON = {
  platformFee: "1.88%",
  community: "28.8%",
  creatorLadder: "28.8 → 40 → 60%",
  supply: "888,888,888",
  legDays: 59.061,
  legsPerTurning: 6,
} as const;
