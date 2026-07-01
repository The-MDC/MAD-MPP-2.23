/**
 * MAD-MPP-2.23 Mathematical Engine
 * Pure consistent formulas compatible with both Node.js (V8) and browser runtimes.
 */

export interface GambitProfile {
  id: string;
  name: string;
  codename: string;
  description: string;
  alpha: number; // Continuous decay parameter
  baseThreshold: number;
  currentStake: number;
}

/**
 * Calculates staked conviction growth/decay at an epoch under a continuous model.
 * formula: C(t) = C_max * (1 - e^(-alpha * t))
 */
export function calculateConviction(
  currentStake: number,
  userMultiplier: number,
  alpha: number,
  epoch: number
): number {
  const maxCapacity = currentStake * userMultiplier;
  return maxCapacity * (1 - Math.exp(-alpha * epoch));
}

/**
 * Calculates MAD-MPP-2.23 Continuous Bonding pricing.
 * Handles exponential curve scaling influenced by user multipliers and elastic temporal penalties.
 * formula: P(t) = P_floor * (1 + slope * ln(1 + conviction_t)) * Multiplier^(2.23) * slippage
 */
export function calculateMppPrice(
  baseFloor: number,
  conviction: number,
  pricingSlope: number,
  userMultiplier: number,
  elasticityPercent: number,
  epoch: number,
  maxEpochs: number
): number {
  const logScale = Math.log1p(conviction);
  const multiplierFactor = Math.pow(userMultiplier, 2.23);
  const slippageCushion = calculateSlippageCushion(elasticityPercent, epoch, maxEpochs);
  return baseFloor * (1 + pricingSlope * logScale) * multiplierFactor * slippageCushion;
}

/**
 * Computes temporal slippage protection cushion.
 * Prevents flash-loan exploits during governance windows.
 * formula: S(t) = max(0, 1 - elasticity_percent * (t / t_max))
 */
export function calculateSlippageCushion(
  elasticityPercent: number,
  epoch: number,
  maxEpochs: number
): number {
  const penaltyIndex = elasticityPercent / 100;
  const epochTimeRatio = maxEpochs > 0 ? epoch / maxEpochs : 0;
  return Math.max(0, 1 - penaltyIndex * epochTimeRatio);
}

/**
 * Computes dynamic decision thresholds based on systemic weight.
 * formula: Threshold = baseThreshold * (1 + governanceWeight / 200)
 */
export function calculateGovernanceThreshold(
  baseThreshold: number,
  governanceWeight: number
): number {
  return baseThreshold * (1 + governanceWeight / 200);
}

/**
 * Generate full sequence matrix of stochastic points for plotting.
 */
export interface StochasticDataPoint {
  epoch: number;
  conviction: number;
  mppPrice: number;
  threshold: number;
  reached: boolean;
}

export function generateStochasticSeries(params: {
  currentStake: number;
  userMultiplier: number;
  alpha: number;
  baseThreshold: number;
  governanceWeight: number;
  simulatedEpochs: number;
  bondingPriceFloor: number;
  pricingSlope: number;
  elasticity: number;
}): StochasticDataPoint[] {
  const series: StochasticDataPoint[] = [];
  const thresh = calculateGovernanceThreshold(params.baseThreshold, params.governanceWeight);
  
  for (let t = 0; t <= params.simulatedEpochs; t++) {
    const conviction = calculateConviction(params.currentStake, params.userMultiplier, params.alpha, t);
    const price = calculateMppPrice(
      params.bondingPriceFloor,
      conviction,
      params.pricingSlope,
      params.userMultiplier,
      params.elasticity,
      t,
      params.simulatedEpochs
    );
    
    series.push({
      epoch: t,
      conviction: Math.round(conviction),
      mppPrice: parseFloat(price.toFixed(2)),
      threshold: Math.round(thresh),
      reached: conviction >= thresh
    });
  }
  return series;
}
