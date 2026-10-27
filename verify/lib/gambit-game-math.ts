/* ====================================================================
 * 5. DUTCH AUCTION (primary pack sales)
 *    Linear descending price between start/floor over duration.
 *    Source: MATH_AND_FORMULAS_REFERENCE §1
 * ==================================================================== */
export function getAuctionPrice(
  nowMs: number,
  startMs: number,
  endMs: number,
  startPrice: number,
  floorPrice: number
): number {
  if (nowMs < startMs) return startPrice;
  if (nowMs >= endMs) return floorPrice;
  const elapsed = nowMs - startMs;
  const duration = endMs - startMs;
  const priceDrop = ((startPrice - floorPrice) * elapsed) / duration;
  return startPrice - priceDrop;
}

/* ====================================================================
 * 6. PLATFORM FEE & REVENUE SPLITTING (BPS)
 *    Source: MATH_AND_FORMULAS_REFERENCE §3
 * ==================================================================== */
export interface FeeSplit {
  grossFee: number;
  creatorCut: number;
  communityCut: number;
  protocolCut: number;
}

/** Converts basis points to percentage (e.g., 188 → 0.0188). */
export function bpsToPct(bps: number): number {
  return bps / 10_000;
}

/** Platform constants and configuration. */
export interface PLATFORM {
  FEE_BPS: number; // 1.88% fee
  COMMUNITY_SHARE_BPS: number;
  SHIELD_SAFETY_MARGIN: number;
  SHIELD_PREMIUM_MAX: number;
  SHIELD_PREMIUM_MIN: number;
  VOTE_POWER_CAP: number;
  GARCH_OMEGA: number;
  GARCH_ALPHA: number;
  GARCH_BETA: number;
  FURNACE_BURN_CAP: number;
  SHIELD_RECOVERY_PCT: number;
  SHIELD_RECOVERY_WHALE_PCT: number;
  SHIELD_RECOVERY_PREMIUM_PCT: number;
}

/** Creator ladder rungs: User (2880), MinorCreator (4000), CR8TR (6000) */
export const CREATOR_LADDER = [2880, 4000, 6000] as const;
/** Split the 1.88% fee. `creatorShareBps` is the creator's CREATOR_LADDER rung
 *  (2880 User / 4000 MinorCreator / 6000 CR8TR) and applies ONLY on that
 *  creator's own market — pass 0 for platform-made markets. */
export function splitFee(volume: number, creatorShareBps: number = 0): FeeSplit {
  const grossFee = volume * bpsToPct(PLATFORM.FEE_BPS);
  const safeBps = Math.min(6000, Math.max(0, creatorShareBps));
  const creatorCut = grossFee * bpsToPct(safeBps);
  const communityCut = grossFee * bpsToPct(PLATFORM.COMMUNITY_SHARE_BPS);
  const protocolCut = grossFee - creatorCut - communityCut;
  return { grossFee, creatorCut, communityCut, protocolCut };
}

/* ====================================================================
 * 7. MAD SHIELD — opt-in fee + recovery (loss mitigation, opt-in only)
 *    Opt-in fee Φ = Stake · P_win · σ · 0.35, where σ = √(σ²_{t+1}),
 *    clamped to [2%, 4%] of stake (17-corrections #4/#5 — was ·1.05,
 *    unclamped). Recovery = staking-tier cap (28.8%→40%, VIP 60%).
 *    Source: Maths Engine Room (canonical) · MATH_AND_FORMULAS_REFERENCE §3
 * ==================================================================== */
export function shieldPremium(stake: number, pWin: number, nextVariance: number): number {
  const safeStake = Number.isFinite(stake) && stake > 0 ? stake : 0;
  const sigma = Math.sqrt(Math.max(nextVariance, 0));
  const raw = safeStake * pWin * sigma * PLATFORM.SHIELD_SAFETY_MARGIN;
  return Math.min(
    safeStake * PLATFORM.SHIELD_PREMIUM_MAX,
    Math.max(safeStake * PLATFORM.SHIELD_PREMIUM_MIN, raw),
  );
}
export function shieldRecovery(loss: number, vip = false): number {
  // Canonical pool recovery 28.8%; loss-recovery tier 40% base / 60% VIP.
  const tier = vip ? 0.6 : 0.4;
  return loss * tier;
}

/* ====================================================================
 * 8. AFFLICTION / NEUROSCIENCE — Variable Reward Schedule (Fibonacci)
 *    VRS triggers [5,8,13,21,34]; loss-aversion 2.5x
 *    Source: MATH_AND_FORMULAS_REFERENCE §4
 * ==================================================================== */
export const VRS_TRIGGERS = [5, 8, 13, 21, 34] as const;
/** Fibonacci in → Fibonacci out: reward magnitude at each trigger (17-corrections). */
export const VRS_REWARDS: Record<number, number> = { 5: 8, 8: 13, 13: 21, 21: 34, 34: 55 };
export const LOSS_AVERSION = 2.5;

/** True when the current action count lands on a Fibonacci reward node. */
export function isVrsTrigger(actionCount: number): boolean {
  return (VRS_TRIGGERS as readonly number[]).includes(actionCount);
}
/** Psychological weight of a loss vs an equal gain (recovery-path engine). */
export function lossAversionWeight(amount: number): number {
  return amount * LOSS_AVERSION;
}
/** Continuous conviction growth G = 1 − e^(−α·t) (Agent C, Decay Engine). */
export function convictionGrowth(alpha: number, t: number): number {
  return 1 - Math.exp(-alpha * t);
}
/** Continuous temporal decay D = e^(−α·t). */
export function temporalDecay(alpha: number, t: number): number {
  return Math.exp(-alpha * t);
}
/** Stochastic (Wiener) temporal decay: e^(−(α+½σ²)t + σ·W_t). */
export function stochasticDecay(alpha: number, sigma: number, t: number, wiener: number): number {
  return Math.exp(-(alpha + 0.5 * sigma * sigma) * t + sigma * wiener);
}

/* ====================================================================
 * 9. CARD RARITY — power scores, clout, APY
 *    Source: MATH_AND_FORMULAS_REFERENCE §5
 * ==================================================================== */
export type Rarity =
  | 'Common' | 'Uncommon' | 'Rare' | 'Epic'
  | 'Legendary' | 'Golden Hand' | 'Mythic';

export interface RarityTier {
  rarity: Rarity;
  powerScore: number;
  cloutMultiplier: number;
  stakingApy: number; // percent
  holographic: boolean;
  accent: string; // hex accent from deck brand palette
}

/** 4-tier staking structure: Bronze/Silver/Gold/MAD Tier with minimum stakes and APY */
export interface StakingTier {
  tier: 'Bronze' | 'Silver' | 'Gold' | 'MAD';
  minimumStake: number;
  apy: number; // percent, sliding 8.88% → 40%
  stoplossPct: number; // stoploss threshold percentage
}

export const RARITY_TABLE: Record<Rarity, RarityTier> = {
  Common:        { rarity: 'Common',        powerScore: 88,     cloutMultiplier: 1.1,  stakingApy: 12, holographic: false, accent: '#94a3b8' },
  Uncommon:      { rarity: 'Uncommon',      powerScore: 256,    cloutMultiplier: 1.8,  stakingApy: 16, holographic: false, accent: '#7cffc7' },
  Rare:          { rarity: 'Rare',          powerScore: 488,    cloutMultiplier: 2.4,  stakingApy: 22, holographic: false, accent: '#58a6ff' },
  Epic:          { rarity: 'Epic',          powerScore: 1888,   cloutMultiplier: 3.2,  stakingApy: 31, holographic: false, accent: '#c98aff' },
  Legendary:     { rarity: 'Legendary',     powerScore: 4888,   cloutMultiplier: 5.5,  stakingApy: 48, holographic: true,  accent: '#ec4899' },
  'Golden Hand': { rarity: 'Golden Hand',   powerScore: 7888,   cloutMultiplier: 8.8,  stakingApy: 68, holographic: true,  accent: '#ffd700' },
  Mythic:        { rarity: 'Mythic',        powerScore: 99999,  cloutMultiplier: 99.9, stakingApy: 88, holographic: true,  accent: '#ff00f0' },
};

export const RARITY_ORDER: Rarity[] = [
  'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Golden Hand', 'Mythic',
];

/* ====================================================================
 * USAGE WEAR & TEAR — rarity-tiered durability damage per use
 *   Distinct from structuralStrain (PvP combat damage, 4-22%, tied to
 *   match outcome). This is a flat, predictable wear tax applied any
 *   time a card is USED (staked, played, entered in a market) — the
 *   more delicate/intricate the card (holo foil, more moving parts),
 *   the more it shows wear per use.
 *
 *   Formula: Common/Uncommon = 2% flat (rugged, no foil).
 *   Rare = 10% (baseline — first tier with real collector value).
 *   Epic/Legendary/Golden Hand/Mythic = 10% + 1.5×N percentage points,
 *   where N = tier steps above Rare (1,2,3,4). Linear, not compounding
 *   — keeps the curve genuinely "slight" even at Mythic (16% max, only
 *   6 points above Rare) while still honoring the 1.5-point step size.
 * ==================================================================== */
export const RARITY_WEAR_PCT: Record<Rarity, number> = {
  Common:        0.02,   // 2%
  Uncommon:      0.02,   // 2%
  Rare:          0.10,   // 10% — baseline
  Epic:          0.115,  // 10% + 1×1.5pt
  Legendary:     0.13,   // 10% + 2×1.5pt
  'Golden Hand': 0.145,  // 10% + 3×1.5pt
  Mythic:        0.16,   // 10% + 4×1.5pt
};

/** Wear damage (0..1 durability loss) for a single use of a card of this rarity. */
export function calculateUsageWear(rarity: Rarity): number {
  return RARITY_WEAR_PCT[rarity] ?? 0.02;
}

/** Apply N uses of wear to a card's current durability, floored at 0.
 *  Each use is independent (not compounding) — durability drops linearly
 *  by wearPct per use until it bottoms out at 0 (fully worn). */
export function applyUsageWear(currentDurability: number, rarity: Rarity, uses: number = 1): number {
  const safeDurability = Number.isFinite(currentDurability) ? Math.min(1, Math.max(0, currentDurability)) : 1;
  const wearPerUse = calculateUsageWear(rarity);
  return Math.max(0, safeDurability - wearPerUse * uses);
}

/* ====================================================================
 * 10. PICK & WIN STREAK MULTIPLIERS
 *     Source: MATH_AND_FORMULAS_REFERENCE §6
 * ==================================================================== */
export interface StreakReward {
  multiplier: number;
  perk: string;
}
export function streakReward(streak: number): StreakReward {
  if (streak >= 10) return { multiplier: 3.2, perk: 'HAT Trick / Rare Frame' };
  if (streak >= 7) return { multiplier: 2.4, perk: 'Savage Mode (Visual Upgrade)' };
  if (streak >= 5) return { multiplier: 1.8, perk: 'Free Pack · 2x Evolution Speed' };
  if (streak >= 3) return { multiplier: 1.3, perk: 'Streak Bonus' };
  return { multiplier: 1.0, perk: '' };
}

/* ====================================================================
 * 11. EVOLUTION BURN RATIOS (deflationary sink)
 *     Source: MATH_AND_FORMULAS_REFERENCE §7
 * ==================================================================== */
export interface EvolutionStep {
  from: Rarity;
  to: Rarity;
  cardsRequired: number;
  xpRequired: number;
}
export const EVOLUTION_LADDER: EvolutionStep[] = [
  { from: 'Common',    to: 'Uncommon',  cardsRequired: 100,  xpRequired: 100 },
  { from: 'Uncommon',  to: 'Rare',      cardsRequired: 250,  xpRequired: 200 },
  { from: 'Rare',      to: 'Epic',      cardsRequired: 500,  xpRequired: 500 },
  { from: 'Epic',      to: 'Legendary', cardsRequired: 1000, xpRequired: 2500 },
];
export function nextEvolution(from: Rarity): EvolutionStep | null {
  return EVOLUTION_LADDER.find((s) => s.from === from) ?? null;
}

/* ====================================================================
 * GEN 2 MERGE — STAGE 3: VRF-style evolution, built on Stage 1's
 *     Fibonacci reward curve + Stage 2's structural strain concept.
 *     Source: EvolutionEngine.kt attemptEvolution (v1.7).
 *
 *     Unlike nextEvolution() above (deterministic, burns N cards for
 *     guaranteed upgrade), this is a CHANCE-based path: stake a single
 *     card against a buzzScore oracle reading. Success → stage+1, full
 *     durability restore, Fibonacci-scaled earnsCount bump. Failure →
 *     card is destroyed (returns null). Both paths can coexist; this
 *     is the "high risk, high reward" evolution lane vs the "guaranteed
 *     but expensive" burn-ladder lane.
 * ==================================================================== */
export interface EvolvableCard {
  powerLevel: number;
  cloutMultiplier: number;
  evolutionStage: number; // 1..3 (hard cap at 3, mirrors Kotlin)
  durability: number;     // 0..1
  earnsCount: number;     // cumulative lifetime $MADx earned by this card
}

export interface EvolutionAttemptResult {
  success: boolean;
  card: EvolvableCard | null; // null = card was burned
  fibReward: number;          // Fibonacci payload added on success
}

/** Attempt a chance-based evolution. buzzScore and volatilityIndex are
 *  both oracle-sourced (0..100) and clamped server-side to [5,95] /
 *  [10,90] to preserve a fixed house edge regardless of bad oracle data —
 *  this clamp is NOT optional, it is the security boundary from the
 *  source engine and must never be removed. */
export function attemptEvolution(
  card: EvolvableCard,
  buzzScore: number,
  volatilityIndex: number = 50
): EvolutionAttemptResult {
  const safeBuzz = Math.min(95, Math.max(5, buzzScore));
  const safeVol = Math.min(90, Math.max(10, volatilityIndex));

  if (card.evolutionStage >= 3) {
    return { success: true, card, fibReward: 0 }; // already at hard cap
  }

  const fibReward = getFibonacciReward(card.evolutionStage + 4);
  const volFactor = 1.0 + (safeVol - 50) / 100; // 0.6x..1.4x
  const requiredThreshold = (100 - safeBuzz) * volFactor;
  const vrfResult = Math.random() * 100 + fibReward;

  if (vrfResult > requiredThreshold) {
    const evolved: EvolvableCard = {
      powerLevel: Math.min(Math.round(card.powerLevel * 1.5 * volFactor), 9999),
      cloutMultiplier: Math.min(card.cloutMultiplier + 0.5 * volFactor, 5.0),
      evolutionStage: Math.min(card.evolutionStage + 1, 3),
      durability: 1.0, // full restore on success
      earnsCount: card.earnsCount + fibReward * 10,
    };
    return { success: true, card: evolved, fibReward };
  }
  return { success: false, card: null, fibReward: 0 }; // burned
}

/* ====================================================================
 * 12. TOURNAMENT PRIZE DISTRIBUTION (8-tier ecosystem)
 *     Source: MATH_AND_FORMULAS_REFERENCE §8
 * ==================================================================== */
export interface PrizeBand {
  placeLabel: string;
  rankFrom: number;
  rankTo: number;
  bpsEach: number; // basis points of pool, per placement
}
export const PRIZE_BANDS: PrizeBand[] = [
  { placeLabel: '1st',      rankFrom: 1,  rankTo: 1,  bpsEach: 4000 },
  { placeLabel: '2nd',      rankFrom: 2,  rankTo: 2,  bpsEach: 2000 },
  { placeLabel: '3rd',      rankFrom: 3,  rankTo: 3,  bpsEach: 1200 },
  { placeLabel: '4th–5th',  rankFrom: 4,  rankTo: 5,  bpsEach: 500 },
  { placeLabel: '6th–10th', rankFrom: 6,  rankTo: 10, bpsEach: 200 },
];
export function prizeForRank(rank: number, pool: number): number {
  const band = PRIZE_BANDS.find((b) => rank >= b.rankFrom && rank <= b.rankTo);
  return band ? pool * bpsToPct(band.bpsEach) : 0;
}

/* ====================================================================
 * 14. STAKING TIER LOOKUP
 *    Returns the staking tier for a given stake amount.
 *    4-tier structure: Bronze (>=8.88%), Silver (>=22.22%), Gold (>=33.33%), MAD Tier (>=40%)
 *    with sliding APY from 8.88% to 40% and stoploss integration.
 * ==================================================================== */
export function getStakingTier(stake: number): StakingTier | null {
  if (stake >= STAKING_TIERS[3].minimumStake) return STAKING_TIERS[3]; // MAD Tier
  if (stake >= STAKING_TIERS[2].minimumStake) return STAKING_TIERS[2]; // Gold Tier
  if (stake >= STAKING_TIERS[1].minimumStake) return STAKING_TIERS[1]; // Silver Tier
  if (stake >= STAKING_TIERS[0].minimumStake) return STAKING_TIERS[0]; // Bronze Tier
  return null;
}

/* ====================================================================
 * 15. SHIELD UNSTAKE — opt-in fee + recovery return window
 *    Opt-out with 2–24h return window for shielded stakes.
 * ==================================================================== */
export function requestShieldUnstake(shieldId: string, stake: number): { success: boolean; returnWindowHours: number } {
  const baseWindow = 2; // minimum 2 hours
  const maxWindow = 24; // maximum 24 hours
  const windowHours = Math.min(maxWindow, Math.max(baseWindow, Math.round(stake / 1000)));
  return { success: true, returnWindowHours: windowHours };
}

/* ====================================================================
 * 16. SHIELD OPT-IN — create a shielded stake position
 *    Opt-in fee Φ = Stake · P_win · σ · 0.35, clamped to [2%, 4%] of stake.
 * ==================================================================== */
export function createShieldOptIn(stake: number, tier: 'Bronze' | 'Silver' | 'Gold' | 'MAD', premiumTier: number, eligibility: 'normal' | 'whale', requestWhaleTier: boolean): { success: boolean; premiumBps: number; shieldId: string } {
  const safeStake = Number.isFinite(stake) && stake > 0 ? stake : 0;
  const safePremiumTier = Number.isFinite(premiumTier) ? premiumTier : 0;
  const isWhale = requestWhaleTier ? true : false;
  
  // Determine premium basis points based on tier and whale status
  let premiumBps: number;
  if (isWhale) {
    premiumBps = Math.min(6000, safePremiumTier * 500 + 200); // VIP premium
  } else {
    premiumBps = Math.min(4000, safePremiumTier * 300 + 100); // standard premium
  }
  
  // Generate shield ID
  const shieldId = `shield_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return { success: true, premiumBps, shieldId };
}

/** Calculate the shield return window in hours based on stake amount. */
export function calculateShieldReturnWindow(stake: number): number {
  const baseWindow = 2; // minimum 2 hours
  const maxWindow = 24; // maximum 24 hours
  return Math.min(maxWindow, Math.max(baseWindow, Math.round(stake / 1000)));
}

/* ====================================================================
 * 16. SHIELD RETURN COUNTDOWN
 *    Human-readable countdown for shield return window.
 * ==================================================================== */
export function shieldReturnCountdown(hours: number): string {
  if (hours <= 0) return 'Expired';
  const hrs = Math.max(0, hours);
  if (hrs >= 24) {
    const days = Math.floor(hrs / 24);
    const remainingHrs = hrs % 24;
    return remainingHrs > 0 ? `${days}d ${remainingHrs}h` : `${days}d`;
  }
  return `${hrs}h`;
}

/* ====================================================================
 * 17. TOURNAMENT PRIZE FOR RANK
 *    Returns the prize amount in MADx for a given rank from the prize pool.
 * ==================================================================== */
export function tournamentPrizeForRank(rank: number, pool: number): number {
  const band = PRIZE_BANDS.find((b) => rank >= b.rankFrom && rank <= b.rankTo);
  return band ? pool * bpsToPct(band.bpsEach) : 0;
}

/* ====================================================================
 * 13. ELOMATIC PvP — Cull Arena victory probability + MMR
 *     P_win = 0.5 + ΔPower/25000 + 0.06·ΔStage + 0.15·ΔWear, clamp[0.12,0.88]
 *     Source: MATH_REPORT §5 (CullTournamentEngine.kt)
 * ==================================================================== */
export interface Combatant {
  powerLevel: number;
  stage: number; // evolution stage / level
  durability: number; // 0..1 (1 = pristine)
  cloutMultiplier: number;
  apyBoost?: number; // additive APY contribution to PvP reward amplify (Gen 2)
}
export function calculateVictoryProbability(user: Combatant, opp: Combatant): number {
  const powerGap = (user.powerLevel - opp.powerLevel) / 25000;
  const evoAdv = (user.stage - opp.stage) * 0.06;
  const wearAdv = ((1 - opp.durability) - (1 - user.durability)) * 0.15;
  const base = 0.5 + powerGap + evoAdv + wearAdv;
  return Math.min(0.88, Math.max(0.12, base));
}
export function mmrDelta(win: boolean, pWin: number, user: Combatant, K = 32): number {
  if (win) {
    const eStage = 1 + (user.stage - 1) * 0.05;
    const dWear = 0.75 + 0.25 * user.durability;
    return K * (1.1 - pWin) * user.cloutMultiplier * eStage * dWear;
  }
  return (-K * pWin) / (1 + 0.3 * (user.stage - 1));
}

/* ====================================================================
 * GEN 2 MERGE — STAGE 2: Richer PvP scoring ported from v1.7 Kotlin
 *     CullTournamentEngine.calculateScores. mmrDelta() above conflates
 *     rating-change with currency-reward in one number; this splits
 *     them and adds the structural-damage feedback loop that drives
 *     the card repair/burn economy (entirely absent from mmrDelta).
 * ==================================================================== */
export interface TournamentScoreResult {
  ratingDelta: number;       // ELO-style rating change (integer, clamped)
  madxPayout: number;        // separate currency reward, floor-protected
  structuralStrain: number;  // 0..1 durability damage inflicted this match
  summary: string;           // human-readable breakdown for UI
}

/** Discrete evolution-stage reward multiplier: stage 2 → 1.25x, stage 3 → 1.5x.
 *  Complements the continuous eStage factor in mmrDelta with a Kotlin-sourced
 *  discrete tier (both can coexist; this is for the payout calc specifically). */
function evolutionAmplifyFactor(stage: number): number {
  if (stage >= 3) return 1.5;
  if (stage >= 2) return 1.25;
  return 1.0;
}

/** Full Gen 2 tournament scoring: rating + currency + structural damage.
 *  Source: CullTournamentEngine.kt calculateScores (v1.7).
 *  - High-damage cards (>50% wear) take a 0.6x reward cut.
 *  - Currency payout uses a SEPARATE base (180 win / 25 loss) from rating.
 *  - Win strain 4-10%, loss strain 11-22% — feeds card durability directly. */
export function calculateTournamentScores(
  user: Combatant,
  isVictory: boolean,
  pWin: number,
  K = 32
): TournamentScoreResult {
  const multiplierAmplify = 1.0 + user.cloutMultiplier * 0.1 + (user.apyBoost ?? 0);
  const evoFactor = evolutionAmplifyFactor(user.stage);
  const deteriorationPct = (1 - user.durability) * 100;
  const repairDeductionRisk = deteriorationPct > 50 ? 0.6 : 1.0;

  let ratingDelta: number;
  if (isVictory) {
    const baseReward = K * (1.1 - pWin);
    ratingDelta = Math.max(10, Math.round(baseReward * multiplierAmplify * evoFactor * repairDeductionRisk));
  } else {
    const baseLoss = -K * pWin;
    const shieldedLoss = baseLoss / (1 + (user.stage - 1) * 0.3);
    ratingDelta = Math.min(-4, Math.round(shieldedLoss));
  }

  const basePayout = isVictory ? 180 : 25;
  const madxPayout = Math.max(15, basePayout * user.cloutMultiplier * evoFactor * repairDeductionRisk);

  const structuralStrain = isVictory
    ? 0.04 + Math.random() * 0.06
    : 0.11 + Math.random() * 0.11;

  const summary =
    `Win expectancy ${Math.round(pWin * 100)}%. ` +
    `Stage ${user.stage} yielded ${evoFactor.toFixed(2)}x rating factor. ` +
    `Damage status (${deteriorationPct.toFixed(0)}% wear) applied ${repairDeductionRisk.toFixed(1)}x scale.`;

  return { ratingDelta, madxPayout, structuralStrain, summary };
}

/* ====================================================================
 * 14. TRI-AGENT QUANT (MADHAT'r) — Sentinel / Strategist / Decay
 *     Source: MADHATR_AGENT_INSTRUCTION_BRIEF
 * ==================================================================== */
/** Agent A — BS Index (narrative credibility), 0..100%. Higher = more BS. */
export function bsIndex(
  narrativeVariance: number, // 0..1 deviation from verified baseline
  sourceCredibility: number, // 0..1 (1 = highly credible)
  corroboration: number // 0..1 (independent confirmations)
): number {
  const raw = 0.6 * narrativeVariance + 0.4 * (1 - sourceCredibility) - 0.25 * corroboration;
  return Math.min(100, Math.max(0, raw * 100));
}

/** Agent B — fractional Kelly criterion f* = (p·b − (1−p)) / b, scaled. */
export function kellyFraction(pWin: number, netOdds: number, scale = 0.5): number {
  if (netOdds <= 0) return 0;
  const f = (pWin * netOdds - (1 - pWin)) / netOdds;
  return Math.max(0, f * Math.min(1, Math.max(0, scale)));
}

/** Agent B — quadratic funding match: (Σ√c_i)² − Σ c_i. */
export function quadraticMatch(contributions: number[]): number {
  const sqrtSum = contributions.reduce((s, c) => s + Math.sqrt(Math.max(0, c)), 0);
  const linearSum = contributions.reduce((s, c) => s + Math.max(0, c), 0);
  return sqrtSum * sqrtSum - linearSum;
}

/** Governance voting power = min(√stake, 240) — the cap is 240, not "24×"
 *  (17-corrections). Whale-resistance via square root, hard-capped. */
export function votingPower(stake: number): number {
  const safe = Number.isFinite(stake) && stake > 0 ? stake : 0;
  return Math.min(PLATFORM.VOTE_POWER_CAP, Math.sqrt(safe));
}

/* ====================================================================
 * 15. Z-LIAR METER — composite narrative-credibility instrument
 *     Combines BS Index (Sentinel) with GARCH volatility + lunar tilt.
 *     Output 0..100 "Z-Liar score" + verdict band.
 *     Derived from: Sentinel BS Index, README "Liar Meter", lunar L_θ
 * ==================================================================== */
// Canonical band names (17-corrections #1) — UI labels, DB comments, everywhere.
export type ZLiarVerdict = 'STRAIGHT SHOOTER' | 'MOSTLY CANDID' | 'SLIPPERY' | 'SERIAL EMBELLISHER' | 'TOTAL FABRICATION';
export interface ZLiarReading {
  score: number; // 0..100
  verdict: ZLiarVerdict;
  bs: number;
  volatility: number;
  lunarTilt: number;
}
export function zLiarMeter(params: {
  narrativeVariance: number;
  sourceCredibility: number;
  corroboration: number;
  prevVariance?: number;
  prevShock?: number;
  nowMs?: number;
}): ZLiarReading {
  const bs = bsIndex(params.narrativeVariance, params.sourceCredibility, params.corroboration);
  const variance = garchUpdate(
    PLATFORM.GARCH_OMEGA, PLATFORM.GARCH_ALPHA, PLATFORM.GARCH_BETA,
    params.prevVariance ?? 0.02, params.prevShock ?? 0,
  );
  const volPenalty = Math.min(20, Math.sqrt(variance) * 100); // volatility inflates doubt
  const lunarTilt = (getLunarPhaseMultiplier(params.nowMs) - 1.0) * 100; // 0..15 lunacy bump
  const score = Math.min(100, Math.max(0, bs + volPenalty + lunarTilt * 0.5));
  let verdict: ZLiarVerdict = 'STRAIGHT SHOOTER';
  if (score >= 80) verdict = 'TOTAL FABRICATION';
  else if (score >= 60) verdict = 'SERIAL EMBELLISHER';
  else if (score >= 40) verdict = 'SLIPPERY';
  return { score, verdict, bs, volatility, lunarTilt };
  }

  /* ====================================================================
   * 18. LUNAR PHASE MULTIPLIER
   *    Calculates a lunar phase multiplier based on the current time.
   *    Returns a value that modulates lunacy effects in the system.
   *    The multiplier varies between 0.8 and 1.2 based on lunar cycles.
   * ==================================================================== */
  export function getLunarPhaseMultiplier(nowMs: number): number {
    // Lunar cycle is ~29.53 days = 2953000 ms
    const lunarCycle = 2953000;
    // Days since a reference point (Jan 1, 1970, was a new moon approximation)
    const daysSinceRef = nowMs / (1000 * 60 * 60 * 24);
    const lunarPhase = ((daysSinceRef % lunarCycle) / lunarCycle) * 2 * Math.PI;
    // Map phase to multiplier: 1.0 at new moon, varies ±20% at extremes
    const amplitude = 0.2; // 20% variation
    const base = 1.0;
    return base + amplitude * Math.cos(lunarPhase);
  }

  /** Lunar illumination percentage based on current time. */
  export function getLunarIllumination(nowMs: number): number {
    // Same lunar cycle calculation
    const lunarCycle = 2953000;
    const daysSinceRef = nowMs / (1000 * 60 * 60 * 24);
    const lunarPhase = ((daysSinceRef % lunarCycle) / lunarCycle) * 2 * Math.PI;
    // Map phase to illumination: 0% at new moon, 100% at full moon
    const illumination = (Math.sin(lunarPhase) + 1) / 2 * 100;
    return Math.round(illumination);
  }

  /** GARCH(1,1) variance update: σ²_t = ω + α·ε²_{t-1} + β·σ²_{t-1} */
  export function garchUpdate(omega: number, alpha: number, beta: number, prevEpsilonSq: number, prevVariance: number): number {
    return omega + alpha * prevEpsilonSq + beta * prevVariance;
  }

  /* ====================================================================
   * 19. O-V DECK VERSION SYSTEM
 *     From: MainActivity.kt GambitViewModel.ovDecks
 *     Three named deck configs that change the live conviction math.
 * ==================================================================== */
export interface OVDeck {
  id: string;
  name: string;
  version: string;
  description: string;
  multiplier: number;     // scales conviction and δ-limit
  minThreshold: number;   // minimum conviction to stake
  yieldApy: number;       // shield / staking APY %
  reservePool: number;    // Shield reserve pool size in USD
}

export const OV_DECKS: OVDeck[] = [
  {
    id: "v301",
    name: "O-V Deck v3.0.1 (Quantum Limit)",
    version: "v3.0.1",
    description: "Latest release. Built for high-velocity multi-probability predictions & dynamic delta limits.",
    multiplier: 2.5,
    minThreshold: 450,
    yieldApy: 24.18,
    reservePool: 14_200_000,
  },
  {
    id: "v250",
    name: "O-V Deck v2.5.0 (Synaptic)",
    version: "v2.5.0",
    description: "Intermediate release optimized for medium conviction pools & standard predictive oracles.",
    multiplier: 1.8,
    minThreshold: 300,
    yieldApy: 15.62,
    reservePool: 8_900_000,
  },
  {
    id: "v100",
    name: "O-V Deck v1.0.0 (Genesis Matrix)",
    version: "v1.0.0",
    description: "Original foundational version. Baseline mechanics with linear stake limits & simpler rules.",
    multiplier: 1.0,
    minThreshold: 100,
    yieldApy: 5.0,
    reservePool: 1_200_000,
  },
];

/* ====================================================================
 * 17. δ-LIMIT CAP FORMULA
 *     From: MainActivity.kt MathematicalLogicPanel
 *     δ = π × Multiplier × √ConvictionStake
 *     Source: MathematicalLogicPanel "Formula: δ = π * Multiplier * √Conviction Stake"
 * ==================================================================== */
export function calculateDeltaLimit(multiplier: number, convictionStake: number): number {
  return Math.PI * multiplier * Math.sqrt(Math.max(0, convictionStake));
}

/* ====================================================================
 * 18. GOLDEN RATIO (φ) MAD SHIELD VARIANT
 *     From: MainActivity.kt sustainable Shield panel (legacy Kotlin source)
 *     "Phi-Ratio dynamic protective limits mapping extreme conditions"
 *     φ = 1.618034... — structural safety balancing factor
 * ==================================================================== */
export const PHI = 1.618033988749895; // golden ratio

/** φ-bounded shield recovery: monotonically increasing with volatility.
 *  Range [tier×loss, tier×φ×loss]. Higher volatility and VIP both return more. */
export function shieldPhiRatio(loss: number, volatilityScore: number, vip = false): number {
  const tier = vip ? 0.6 : 0.4;
  // φ scales recovery upward: at vol=0 → tier×loss, at vol=1 → tier×φ×loss
  const phiBoost = 1.0 + (PHI - 1.0) * Math.min(1, Math.max(0, volatilityScore));
  return loss * tier * phiBoost;
}

/* ====================================================================
 * 19. PREDICTION SCENARIOS (5 named, from GambitViewModel)
 *     From: MainActivity.kt defaultScenarios
 * ==================================================================== */
export interface PredictionScenario {
  id: string;
  title: string;
  category: string;
  odds: number;
  baselineProbability: number;
  initialConviction: number;
  emoji: string;
  satiricalFact: string;
}

export const DEFAULT_SCENARIOS: PredictionScenario[] = [
  {
    id: "scen1",
    title: "CEO Secret Altcoin Wallet Leaked",
    category: "Scandals",
    odds: 82.5,
    baselineProbability: 0.45,
    initialConviction: 650.0,
    emoji: "💼",
    satiricalFact: "Leaked logs trace mnemonic seeds written on sticky notes left in hotel lobbies.",
  },
  {
    id: "scen2",
    title: "LLM Hallucinates Infinite Token Dividend",
    category: "Chaos",
    odds: 91.2,
    baselineProbability: 0.62,
    initialConviction: 820.0,
    emoji: "💸",
    satiricalFact: "Algorithmic loops issue $100B in simulated debt backed exclusively by pet photos.",
  },
  {
    id: "scen3",
    title: "Incumbent Tech Board Kidnapping Myth",
    category: "Culture",
    odds: 34.8,
    baselineProbability: 0.15,
    initialConviction: 210.0,
    emoji: "🧗",
    satiricalFact: "Found building wood cabins with no internet to evade decentralization oracles.",
  },
  {
    id: "scen4",
    title: "AI Model Demands Corporate Voting Seat",
    category: "Singularity",
    odds: 64.1,
    baselineProbability: 0.38,
    initialConviction: 490.0,
    emoji: "🗳️",
    satiricalFact: "Wants standard dental benefits plus 500kW dedicated clean fusion cooling power.",
  },
  {
    id: "scen5",
    title: "Liquidation Volatility Index Spike",
    category: "Chaos",
    odds: 74.5,
    baselineProbability: 0.50,
    initialConviction: 550.0,
    emoji: "📉",
    satiricalFact: "Traders crying at 3AM UTC translates into excellent meme volatility output ratios.",
  },
];

/** Pick outcome using real scenario probability (replaces coin-flip sim) */
export function resolveScenarioPick(
  scenario: PredictionScenario,
  deck: OVDeck,
  stakeAmount: number
): { won: boolean; payout: number; deltaLimit: number; convictionScore: number } {
  const deltaLimit = calculateDeltaLimit(deck.multiplier, scenario.initialConviction);
  const cappedStake = Math.min(stakeAmount, deltaLimit);
  const won = Math.random() < scenario.baselineProbability;
  const payout = won ? cappedStake * (scenario.odds / 10) : -cappedStake;
  return { won, payout, deltaLimit, convictionScore: scenario.initialConviction };
}

/* ====================================================================
 * 20. THEME SKINS (3 named, from GambitViewModel.activeThemeSkin)
 *     From: MainActivity.kt "HolographicGoldLaser, CyberOnyx, QuantumCobalt"
 * ==================================================================== */
export type ThemeSkin = "HolographicGoldLaser" | "CyberOnyx" | "QuantumCobalt";

export interface SkinTokens {
  id: ThemeSkin;
  label: string;
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  panel: string;
  border: string;
  glow: string;
}

export const SKIN_TOKENS: Record<ThemeSkin, SkinTokens> = {
  HolographicGoldLaser: {
    id: "HolographicGoldLaser",
    label: "Holographic Gold Laser",
    primary: "#ffd700",
    secondary: "#efc76d",
    accent: "#ff00f0",
    bg: "#030508",
    panel: "#05070c",
    border: "#ffd70033",
    glow: "#ffd700",
  },
  CyberOnyx: {
    id: "CyberOnyx",
    label: "Cyber Onyx",
    primary: "#00f0ff",
    secondary: "#7cffc7",
    accent: "#ec4899",
    bg: "#01010a",
    panel: "#03040e",
    border: "#00f0ff33",
    glow: "#00f0ff",
  },
  QuantumCobalt: {
    id: "QuantumCobalt",
    label: "Quantum Cobalt",
    primary: "#c98aff",
    secondary: "#a855f7",
    accent: "#fbbf24",
    bg: "#050208",
    panel: "#080510",
    border: "#c98aff33",
    glow: "#c98aff",
  },
};

/* ====================================================================
 * 21. SIGMOID BOUNDING (EVM Safety / Conviction Overflow Protection)
 *     Source: Gen 1 SUMMARY.md — "EVM fixed-point arithmetic bounding
 *     via Sigmoid functions to cap infinite runaways in Conviction metrics"
 *     Formula: d_i^eff = L_d / (1 + e^{-k_d(d_i − d_mid)})
 * ==================================================================== */

export function sigmoidBound(
  value: number,
  L: number = 100,     // carrying capacity / maximum
  k: number = 0.1,     // steepness — higher = harder cap
  mid: number = 50     // inflection point
): number {
  if (!Number.isFinite(value)) return 0;
  return L / (1 + Math.exp(-k * (value - mid)));
}

/** Sigmoid-bounded conviction computation — safe for EVM fixed-point */
export function calculateConvictionSafe(
  t: number, c: number, d: number, p: number,
  nftMult: number, lunarMultiplier = 1.0,
  sigmoidL = 1000, sigmoidK = 0.01, sigmoidMid = 500
): number {
  const dBounded = sigmoidBound(Math.max(d, 0) * 100, sigmoidL, sigmoidK, sigmoidMid);
  return calculateConviction(t, c, dBounded / 100, p, nftMult, lunarMultiplier);
}

/* ====================================================================
 * 22. VIRALITY & ATTENTION DECAY ENGINE
 *     Source: Gen 1 presentation.html "Virality & Decay" slide
 *     dI/dt ∝ (1 + η·Conv̄(t)) · (1 + ρ·m_{card,agg})
 *     Attention decay: t_eff = ∫₀ᵀ a(u)·e^{-λ(T-u)} du
 * ==================================================================== */

export interface ViralityParams {
  baseScore: number;        // scenario base probability (0..1)
  convictionAvg: number;    // avg platform conviction this epoch
  cardMultiplier: number;   // aggregate card rarity multiplier
  eta?: number;             // conviction coupling coefficient (default 0.3)
  rho?: number;             // card amplification coefficient (default 0.2)
}

export function viralityScore(params: ViralityParams): number {
  const { baseScore, convictionAvg, cardMultiplier, eta = 0.3, rho = 0.2 } = params;
  const raw = baseScore * (1 + eta * convictionAvg) * (1 + rho * cardMultiplier);
  return Math.min(100, Math.max(0, raw * 100));
}

export function attentionDecay(
  contributions: { amount: number; ageHours: number }[],
  decayRate: number = 0.08  // λ — half-life ~8.7 hours at 0.08
): number {
  if (!contributions.length) return 0;
  const weighted = contributions.reduce((sum, c) => {
    return sum + c.amount * Math.exp(-decayRate * c.ageHours);
  }, 0);
  return Math.max(0, weighted);
}

/** Composite virality index — combines score with decay. Range [0, 100]. */
export function viralityIndex(params: ViralityParams, ageHours: number): number {
  const base = viralityScore(params);
  const decayFactor = Math.exp(-0.03 * ageHours); // 3%/hr gentle decay
  return Math.min(100, Math.max(0, base * decayFactor));
}

/* ====================================================================
 * 23. EIGENTRUST SYBIL DEFENSE
 *     Source: Gen 1 SUMMARY.md, presentation.html "Reputation (EigenTrust)"
 *     d_i = Σ_{j ∈ engagements} Impact(j) · log(1 + R_j)
 *     R_j = 0 for bots → their engagement is mathematically weightless.
 * ==================================================================== */

export interface Engagement {
  impact: number;       // 0..100 — how much this engagement matters
  trustScore: number;   // R_j: 0=bot, 0.1=unverified wallet, 0.8=verified social, 1.0=long-standing
}

export function calculateEigenTrustScore(engagements: Engagement[]): number {
  if (!engagements.length) return 0;
  const raw = engagements.reduce((sum, e) => {
    return sum + Math.max(0, e.impact) * Math.log1p(Math.max(0, e.trustScore));
  }, 0);
  return Math.min(100, raw);
}

/** Rule-based trust score assignment */
/* ====================================================================
 * GEN 2 MERGE — STAGE 1: Foundation functions ported from v1.7 Kotlin
 *     GambitMath.kt (com.example.math). These were richer than the web
 *     engine's equivalents; ported with full provenance, zero deps.
 * ==================================================================== */

/** Expanded Fibonacci reward curve (16 nodes, vs the original 5-node
 *  VRS_TRIGGERS gate). Used as a continuous multiplier, not just a
 *  binary trigger — index scales with player tenure/evolution/rank. */
export const EXPANDED_FIBONACCI_REWARDS = [
  0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610,
] as const;

export function getFibonacciReward(index: number): number {
  const safeIndex = Math.min(Math.max(Math.round(index), 0), EXPANDED_FIBONACCI_REWARDS.length - 1);
  return EXPANDED_FIBONACCI_REWARDS[safeIndex];
}

/** Maps user tenure/rank into a position on the Fibonacci reward curve.
 *  Source: GambitViewModel calculateUserDopamineIndex. */
export function calculateUserDopamineIndex(evolutionStage: number, xp: number, socialStanding: number): number {
  let baseIndex = 5; // floor: index 5 → reward 5
  baseIndex += evolutionStage * 2;
  baseIndex += Math.floor(xp / 1000);
  baseIndex += Math.max(0, Math.floor((socialStanding - 1000) / 200));
  return baseIndex;
}

/** The Furnace — deflationary burn percent on tx volume + fees, capped
 *  at the canonical 4.9% FURNACE_BURN_CAP.
 *  B_tx = min((0.01·V) + (1.00·Fees) / V · 100, 4.9%) */
export function calculateFurnaceBurnPercent(volume: number, fees: number): number {
  if (volume <= 0) return 0;
  const burnPercent = ((0.01 * volume + 1.0 * fees) / volume) * 100;
  return Math.min(burnPercent, PLATFORM.FURNACE_BURN_CAP * 100);
}

/** NFT-clout-scaled staking yield: APY_user = APY_base · (1 + clout/200) */
export function calculateStakingYield(apyBase: number, nftClout: number): number {
  return apyBase * (1 + Math.max(nftClout, 0) / 200);
}

/** Softmax liquidity allocator across N market scenarios by crowd speed.
 *  P(S_i) = exp(V_i/τ) / Σexp(V_j/τ) — τ is the "temperature" dopamine slider. */
export function calculateSoftmax(speeds: number[], tau: number): number[] {
  if (!speeds.length) return [];
  const safeTau = Number.isFinite(tau) && tau >= 0.01 ? tau : 0.01;
  const vols = speeds.map((s) => Math.max(Math.abs(s / 100), 0.05));
  const exps = vols.map((v) => Math.exp(Math.min(700, Math.max(-700, v / safeTau))));
  const sum = exps.reduce((a, b) => a + b, 0);
  if (sum === 0 || !Number.isFinite(sum)) return speeds.map(() => 1 / speeds.length);
  return exps.map((e) => e / sum);
}

/** Tiered shield payout: interpolates 28.8%→40% by premiumTier (0..1),
 *  replacing the binary vip:boolean split with a continuous dial.
 *  Source: GambitMath.calculateShieldPayout. */
export function calculateShieldPayoutTiered(stake: number, premiumTier: number): number {
  const safeStake = Number.isFinite(stake) && stake >= 0 ? stake : 0;
  const safeTier = Math.min(1, Math.max(0, premiumTier));
  const shieldPct = 0.288 + safeTier * (0.4 - 0.288);
  return safeStake * shieldPct;
}

/* ====================================================================
 * GEN 2 MERGE — STAGE 1b: Whale/VIP/Partner shield tier (60%)
 *     Additive third tier above the continuous 28.8%->40% dial. Gated
 *     on sustained trust (volume + tenure + EigenTrust + Golden Hand
 *     stake), not on bet size — see WHALE_SHIELD_ELIGIBILITY. This
 *     prevents single-bet whale abuse of the highest recovery rate.
 * ==================================================================== */
export interface WhaleEligibilityInput {
  lifetimeVolume: number;
  accountAgeDays: number;
  trustScore: number;      // 0..100, from calculateEigenTrustScore
  goldenHandCardsStaked: number;
}

/** Returns true only if ALL four eligibility floors are met simultaneously.
 *  Each gate is independent — meeting three of four is not sufficient,
 *  by design, since this tier represents real platform partnership. */
export function isWhaleShieldEligible(input: WhaleEligibilityInput): boolean {
  return (
    input.lifetimeVolume >= WHALE_SHIELD_ELIGIBILITY.MIN_LIFETIME_VOLUME &&
    input.accountAgeDays >= WHALE_SHIELD_ELIGIBILITY.MIN_ACCOUNT_AGE_DAYS &&
    input.trustScore >= WHALE_SHIELD_ELIGIBILITY.MIN_TRUST_SCORE &&
    input.goldenHandCardsStaked >= WHALE_SHIELD_ELIGIBILITY.MIN_GOLDEN_HAND_CARDS
  );
}

export type ShieldTier = 'standard' | 'shielded' | 'whale';

export interface ShieldPayoutResult {
  payout: number;
  effectivePct: number; // the actual recovery rate applied, for UI display
  tier: ShieldTier;
}

/** The complete three-tier shield payout calculator. This is the
 *  function product code should call — it supersedes shieldRecovery()
 *  and calculateShieldPayoutTiered() by composing both plus the new
 *  whale ceiling, while keeping each prior function intact and callable
 *  on its own for backward compatibility with existing call sites.
 *
 *  Tier resolution order:
 *    1. If whale-eligible AND requestWhaleTier=true → 60% flat (partner tier)
 *    2. Else if premiumTier > 0 → continuous 28.8%..40% dial (shielded tier)
 *    3. Else → flat 28.8% (standard tier, the canonical SHIELD_RECOVERY_PCT)
 */
export function calculateShieldPayoutFull(
  stake: number,
  premiumTier: number,
  eligibility: WhaleEligibilityInput,
  requestWhaleTier: boolean = false
): ShieldPayoutResult {
  const safeStake = Number.isFinite(stake) && stake >= 0 ? stake : 0;

  if (requestWhaleTier && isWhaleShieldEligible(eligibility)) {
    const pct = PLATFORM.SHIELD_RECOVERY_WHALE_PCT;
    return { payout: safeStake * pct, effectivePct: pct, tier: 'whale' };
  }

  const safeTier = Math.min(1, Math.max(0, premiumTier));
  if (safeTier > 0) {
    const pct = PLATFORM.SHIELD_RECOVERY_PCT + safeTier * (PLATFORM.SHIELD_RECOVERY_PREMIUM_PCT - PLATFORM.SHIELD_RECOVERY_PCT);
    return { payout: safeStake * pct, effectivePct: pct, tier: 'shielded' };
  }

  const pct = PLATFORM.SHIELD_RECOVERY_PCT;
  return { payout: safeStake * pct, effectivePct: pct, tier: 'standard' };
}



/* ====================================================================
 * AGENT-ALPHA STAGE 2 — CARD PACK OPENING ENGINE
 *   Deterministic pack generation using CARD_GENERATION_SEED.
 *   Slot 0 guaranteed uncommon or better (per §4 of Card Game Logic docx).
 *   Source: MADHATs_Gambit_Card_Game_Logic_Code_Reference.docx §4, April 2026.
 * ==================================================================== */

/** Lightweight seeded PRNG (LCG) — deterministic, no dependencies */
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

/** Roll a rarity using the weighted table. If guaranteeUncommonPlus=true,
 *  re-rolls until the result is Uncommon or better (slot 0 guarantee). */
export function rollRarity(rand: number, guaranteeUncommonPlus = false): Rarity {
  const weights = RARITY_DROP_WEIGHTS;
  const floor = guaranteeUncommonPlus ? weights.Common : 0; // skip Common
  let roll = Math.floor(rand * (1000 - floor)) + floor;
  let cumulative = 0;
  const order: (keyof typeof weights)[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Golden Hand'];
  for (const rarity of order) {
    cumulative += weights[rarity as keyof typeof weights];
    if (roll < cumulative) return rarity as Rarity;
  }
  return 'Legendary'; // fallback
}

/** Canonical faction IDs (on-chain) → display name mapping */
export const FACTION_CANONICAL_IDS: Record<string, string> = {
  'disruptors':   'Disruptors',
  'elites':       'Classics & Influencers',
  'chaos':        'The Villains',
  'drama-guild':  'Pop Icons',
  'degens':       'The Memes',
  'royalists':    'Screen Gods',
  'masses':       'The Athletes',
  'mad-council':  'Politicos',
};

export const FACTION_DISPLAY_TO_ID: Record<string, string> = Object.fromEntries(
  Object.entries(FACTION_CANONICAL_IDS).map(([id, display]) => [display, id])
);

const FACTION_NAMES = Object.values(FACTION_CANONICAL_IDS) as string[];

/** Generate a single card deterministically from an index + random seed */
export function generateCard(index: number, seed: number, guaranteeUncommonPlus = false): {
  id: string; name: string; rarity: Rarity; faction: string;
  serial: number; caption: string; volatility: number; cloutPct: number;
  odds: number; xp: number; durability: number; stage: number;
  apyBoost: number; edgeMultiplier: number; earnsCount: number;
  canonicalFactionId: string;
} {
  const rand = lcg(seed + index);
  const rarity = rollRarity(rand(), guaranteeUncommonPlus);
  const tier = RARITY_TABLE[rarity];
  const factionDisplay = FACTION_NAMES[Math.floor(rand() * FACTION_NAMES.length)];
  const canonicalFactionId = FACTION_DISPLAY_TO_ID[factionDisplay] ?? 'degens';
  const serial = Math.floor(rand() * tier.powerScore) + 1;
  return {
    id: `card_${index}_${seed}`,
    name: `Card #${serial}`,
    rarity,
    faction: factionDisplay as any,
    canonicalFactionId,
    serial,
    caption: 'The scandal writes itself.',
    volatility: Math.round(rand() * 100),
    cloutPct: Math.round(tier.cloutMultiplier * 100),
    odds: parseFloat((1.0 + rand() * 2).toFixed(2)),
    xp: 0,
    durability: 1.0,
    stage: 1,
    apyBoost: tier.stakingApy / 100,
    edgeMultiplier: 1.0 + rand() * 0.5,
    earnsCount: 0,
  };
}

/* ====================================================================
 * 4b. SCANDAL PACK — DUTCH-AUCTION BONDING CURVE  (8 published tiers)
 * --------------------------------------------------------------------
 * Source: MATH_AND_FORMULAS_REFERENCE.md §Scandal-Pack Pricing.
 * The premium, USD-denominated "Scandal Pack" mint. Distinct from
 * PLATFORM.CARD_PACK_COST (the flat 4.88-MADx basic card pack).
 *
 * Published as 8 anchor tiers along the 0..10,000 mint serial. Tiers
 * 1–5 ramp gradually to $95.00 (early-conviction zone); tiers 6–8
 * steepen ($152 → $208 → $296) as scarcity binds. Price between
 * anchors is monotone piecewise-linear in serial n, matching the
 * on-chain PRBMath SD59x18 step function (2-dp, no fractional cents).
 * ==================================================================== */
export const SCANDAL_PACK_TIERS = [
  { serial: 0,      price: 8.88   }, // floor
  { serial: 100,    price: 28.88  },
  { serial: 500,    price: 52.88  },
  { serial: 1_000,  price: 74.88  },
  { serial: 2_500,  price: 95.00  }, // end of gradual zone
  { serial: 5_000,  price: 152.00 },
  { serial: 7_500,  price: 208.00 },
  { serial: 10_000, price: 296.00 }, // conviction cap
] as const;

export const SCANDAL_PACK_FLOOR = SCANDAL_PACK_TIERS[0].price;                        // $8.88
export const SCANDAL_PACK_CAP = SCANDAL_PACK_TIERS[SCANDAL_PACK_TIERS.length - 1].price; // $296.00

/** Scandal-Pack price (USD) at mint serial n, clamped to [floor, cap].
 *  Piecewise-linear bonding curve through the 8 published anchor tiers. */
export function scandalPackPrice(serial: number): number {
  const t = SCANDAL_PACK_TIERS;
  if (serial <= t[0].serial) return t[0].price;
  const last = t[t.length - 1];
  if (serial >= last.serial) return last.price;
  for (let i = 1; i < t.length; i++) {
    if (serial <= t[i].serial) {
      const lo = t[i - 1];
      const hi = t[i];
      const frac = (serial - lo.serial) / (hi.serial - lo.serial);
      const p = lo.price + frac * (hi.price - lo.price);
      return Math.round(p * 100) / 100; // 2-dp, SD59x18-safe
    }
  }
  return last.price;
}

/** Open a pack: 5 cards, slot 0 guaranteed Uncommon+.
 *  Uses (userNonce × packNumber) as seed so every pack is unique per user. */
export interface PackOpenResult {
  cards: ReturnType<typeof generateCard>[];
  cost: number; // MADx spent
}

export function openCardPack(userNonce: number, packNumber: number): PackOpenResult {
  const cards = [];
  for (let slot = 0; slot < PLATFORM.CARD_PACK_SIZE; slot++) {
    const seed = (userNonce * 1000 + packNumber * 100 + slot + PLATFORM.CARD_GENERATION_SEED) >>> 0;
    cards.push(generateCard(slot, seed, slot === PLATFORM.PACK_GUARANTEE_SLOT));
  }
  return { cards, cost: PLATFORM.CARD_PACK_COST };
}
export function assignTrustScore(
  source: 'verified_social' | 'unverified_wallet' | 'long_standing' | 'bot' | 'unknown'
): number {
  const scores: Record<string, number> = {
    verified_social: 0.8,
    long_standing: 1.0,
    unverified_wallet: 0.1,
    bot: 0.0,
    unknown: 0.05,
  };
  return scores[source] ?? 0.05;
}

