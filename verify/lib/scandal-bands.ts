/**
 * MAD Gambit — Scandal Velocity volatility bands.
 *
 * The band ladder was private to `components/scandal-velocity-meter.tsx`, so
 * the same instrument on the perp deck printed its band label, its sublabel
 * and its call-to-action as three hardcoded strings that never moved when the
 * σ² numeral above them did. One table, read by both surfaces.
 *
 * Thresholds are on the RAW GARCH variance returned by `garchUpdate()` — the
 * unclamped σ², not `garchSigma()`'s σ (which is clamped to [0.09, 0.68] for
 * the amplification path and would floor every reading at σ² 0.0081, above
 * this ladder's first three rungs).
 */

export interface VolatilityBand {
  label: string;
  sublabel: string;
  color: string;
  bgOpacity: string;
  cta: string;
  /** Lower edge, in raw σ². */
  minSigma: number;
}

export const SCANDAL_BANDS: VolatilityBand[] = [
  { minSigma: 0.000, label: "QUIET",        sublabel: "Market resting",                   color: "#475569", bgOpacity: "05", cta: "Monitor for entry" },
  { minSigma: 0.010, label: "WARMING",       sublabel: "Liquidity building",               color: "#00f0ff", bgOpacity: "08", cta: "Early conviction window" },
  { minSigma: 0.020, label: "ACTIVE",        sublabel: "Conviction opportunities rising",  color: "#7cffc7", bgOpacity: "10", cta: "Liquidity deepening. Prices flattened." },
  { minSigma: 0.035, label: "HOT",           sublabel: "GARCH σ² elevated",               color: "#fbbf24", bgOpacity: "12", cta: "Optimal time for heavy Conviction entry." },
  { minSigma: 0.050, label: "SCANDAL PEAK",  sublabel: "Maximum cultural velocity",        color: "#ec4899", bgOpacity: "18", cta: "Spike in progress. Execute now or wait for cooldown." },
];

/** The band a raw σ² falls in. Descending indexed scan — no `for...of`, no
 *  reversed copy: this compiles at target es5 without downlevelIteration. */
export function scandalBand(sigmaSq: number): VolatilityBand {
  const s = Number.isFinite(sigmaSq) ? sigmaSq : 0;
  for (let i = SCANDAL_BANDS.length - 1; i >= 0; i--) {
    if (s >= SCANDAL_BANDS[i].minSigma) return SCANDAL_BANDS[i];
  }
  return SCANDAL_BANDS[0];
}

/** Full-scale deflection for the band strip, in raw σ². PEAK's rung has no
 *  upper edge, so the ladder needs an agreed top; this is the value
 *  `scandal-velocity-meter.tsx` has always scaled its gauge against, kept so
 *  the two surfaces fill to the same fraction for the same reading. */
export const SCANDAL_SCALE_MAX = 0.07;

/** Where a reading sits across the whole ladder, 0..1. */
export function scandalBandFraction(sigmaSq: number): number {
  const s = Number.isFinite(sigmaSq) ? sigmaSq : 0;
  return Math.min(1, Math.max(0, s / SCANDAL_SCALE_MAX));
}
