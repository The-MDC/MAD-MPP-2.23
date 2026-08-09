/**
 * MAD Gambit — trend lifecycle (ZEITGEIST §6).
 * ────────────────────────────────────────────────────────────────
 * A trend is not a coin flip with a date on it. It is adoption racing burnout,
 * and the interesting part is that the two are not symmetric: adoption is
 * smooth and saturating, burnout is lumpy and arrives as backlash.
 *
 *   adoption(t)  = 1 − e^(−α·t)                 — reused from calculateConviction
 *   burnout(t)   = 1 − e^(−β·max(0, t − t₀))    — only bites after saturation
 *   salience(t)  = adoption(t) · (1 − burnout(t))
 *
 * The hype-cycle shape falls out of the product: nothing burns out before it is
 * adopted, and everything adopted eventually does.
 *
 * THE BACKLASH TERM is the piece worth arguing about. Backlash volatility runs
 * on EGARCH with γ < 0, so a leg where a trend UNDERPERFORMS its expected
 * adoption raises volatility more than a leg where it overperforms by the same
 * amount. That is not a modelling flourish — a trend that stalls draws a
 * pile-on, and a trend that beats expectations draws a shrug. Symmetric
 * volatility would price the stall too cheaply, which is exactly the leg a
 * ZEITGEIST holder most needs priced correctly.
 */
import { calculateConviction } from "@/lib/mpp-math";
import { egarchLogVar } from "@/lib/bayesian-conviction";

/** Legs before burnout can begin — a trend gets one Turning's grace. */
export const BURNOUT_ONSET_LEGS = 6;
/** γ for the backlash track. Matches the codex leverage term. */
export const BACKLASH_GAMMA = -0.08;

export type TrendPhase = "emerging" | "peaking" | "saturated" | "burning-out" | "residual";

export interface TrendLifeInput {
  /** Legs since the trend was seated on the slate. */
  leg: number;
  /** Adoption rate. Faster trends have larger α and shorter lives. */
  alpha?: number;
  /** Burnout rate. */
  beta?: number;
  /** Legs of grace before burnout starts. */
  onsetLegs?: number;
}

export interface TrendLife {
  adoption: number;
  burnout: number;
  /** The tradeable level — adoption net of burnout, in [0, 1]. */
  salience: number;
  /** d(salience)/d(leg), evaluated discretely against the previous leg. */
  momentum: number;
  phase: TrendPhase;
}

const DEFAULT_ALPHA = 0.22;
const DEFAULT_BETA = 0.14;

function salienceAt(leg: number, alpha: number, beta: number, onset: number): number {
  const t = Math.max(0, leg);
  const adoption = calculateConviction(1, 1, alpha, t); // C_max = 1 → the pure curve
  const burnout = 1 - Math.exp(-beta * Math.max(0, t - onset));
  return adoption * (1 - burnout);
}

export function trendLife(input: TrendLifeInput): TrendLife {
  const alpha = Number.isFinite(input.alpha as number) ? (input.alpha as number) : DEFAULT_ALPHA;
  const beta = Number.isFinite(input.beta as number) ? (input.beta as number) : DEFAULT_BETA;
  const onset = Number.isFinite(input.onsetLegs as number) ? (input.onsetLegs as number) : BURNOUT_ONSET_LEGS;
  const t = Math.max(0, input.leg);

  const adoption = calculateConviction(1, 1, alpha, t);
  const burnout = 1 - Math.exp(-beta * Math.max(0, t - onset));
  const salience = adoption * (1 - burnout);
  const prev = t >= 1 ? salienceAt(t - 1, alpha, beta, onset) : 0;
  const momentum = salience - prev;

  let phase: TrendPhase;
  if (t < onset && adoption < 0.5) phase = "emerging";
  else if (momentum > 0.01) phase = "peaking";
  else if (Math.abs(momentum) <= 0.01 && salience > 0.4) phase = "saturated";
  else if (salience > 0.15) phase = "burning-out";
  else phase = "residual";

  return { adoption, burnout, salience, momentum, phase };
}

export interface BacklashInput {
  prevLogVar: number;
  /** Adoption actually observed this leg. */
  observed: number;
  /** Adoption the curve expected. */
  expected: number;
  /** Prior volatility, for standardising the surprise. */
  sigma?: number;
}

export interface BacklashReading {
  logVar: number;
  volatility: number;
  /** Standardised surprise. Negative = the trend disappointed. */
  z: number;
  /** True when the asymmetric term is what is driving volatility up. */
  isBacklash: boolean;
}

/** One EGARCH step on the backlash track. */
export function backlashStep(input: BacklashInput): BacklashReading {
  const sigma = Math.max(input.sigma ?? Math.sqrt(Math.exp(input.prevLogVar)), 1e-6);
  const z = (input.observed - input.expected) / sigma;
  const logVar = egarchLogVar({ prevLogVar: input.prevLogVar, z, gamma: BACKLASH_GAMMA });
  return {
    logVar,
    volatility: Math.sqrt(Math.exp(logVar)),
    z,
    // γ is negative, so a negative z is what the leverage term amplifies.
    isBacklash: z < 0 && logVar > input.prevLogVar,
  };
}

/**
 * Retirement pressure on a slot at the Turning, in [0, 1].
 *
 * High salience protects a slot; sustained backlash and age push it out. This
 * is an INPUT to the crowd vote, not a replacement for it — the founder ruling
 * was that the crowd retires trends and the maths only advises.
 */
export function retirementScore(life: TrendLife, backlashVol: number, legsSeated: number): number {
  const staleness = Math.min(1, legsSeated / (BURNOUT_ONSET_LEGS * 2));
  const decay = 1 - Math.min(1, Math.max(0, life.salience));
  const heat = Math.min(1, Math.max(0, backlashVol));
  const score = 0.5 * decay + 0.3 * staleness + 0.2 * heat;
  return Math.min(1, Math.max(0, score));
}
