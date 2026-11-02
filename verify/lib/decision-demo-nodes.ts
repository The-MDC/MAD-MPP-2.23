/**
 * Demo Bayesian evidence chain for the Logic tab's decision tree (thematic).
 * Shared by /mpp2.23 and the premiere hub's platform tabs so the two renderings
 * of the Logic tab show the same chain.
 */
export const DECISION_NODES = [
  { evidence: "Scandal velocity σ² spike (GARCH)", oldPrior: 0.42, newPosterior: 0.61, shift: 0.19, action: "WEAK_BUY" as const },
  { evidence: "Z-Liar sentiment flips truth→liar",  oldPrior: 0.61, newPosterior: 0.38, shift: -0.23, action: "WEAK_SELL" as const },
  { evidence: "Whale conviction stake detected",     oldPrior: 0.38, newPosterior: 0.72, shift: 0.34, action: "STRONG_BUY" as const },
  { evidence: "RSS wire corroboration (7 feeds)",    oldPrior: 0.72, newPosterior: 0.78, shift: 0.06, action: "HOLD" as const },
  { evidence: "Oracle cascade divergence",           oldPrior: 0.78, newPosterior: 0.55, shift: -0.23, action: "STRONG_SELL" as const },
];
