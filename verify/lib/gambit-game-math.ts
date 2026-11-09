/**
 * MAD-MPP-2.23 — Game Layer Mathematical Engine
 * ------------------------------------------------------------------
 * Pure, isomorphic TypeScript (browser + Node). No DOM / no fs deps.
 * Every constant and formula is ported 1:1 from the canonical sources:
 *   - MATH_REPORT.md (GambitMath.kt / CullTournamentEngine.kt)
 *   - MATH_AND_FORMULAS_REFERENCE.md
 *   - MADHATR_AGENT_INSTRUCTION_BRIEF.md (Tri-Agent quant)
 * Canonical platform numbers are LOCKED (see PLATFORM constants).
 *
 * This file is additive. It does NOT modify lib/mpp-math.ts.
 */

/* ====================================================================
 * 0. LOCKED CANONICAL PLATFORM CONSTANTS  (never change)
 * ==================================================================== */
export const PLATFORM = {
  FEE_BPS: 188, // 1.88% global platform fee — NEVER CHANGES
  CREATOR_SHARE_BPS: 4000, // MinorCreator rung of the CREATOR_LADDER (legacy default — prefer the ladder)
  COMMUNITY_SHARE_BPS: 2880, // 28.8% of fee → community pool
  SHIELD_RECOVERY_PCT: 0.288, // 28.8% loss recovery, standard tier
  SHIELD_RECOVERY_PREMIUM_PCT: 0.40, // 40% loss recovery, shielded tier ceiling
  SHIELD_RECOVERY_WHALE_PCT: 0.60, // 60% Whale/VIP/Partner — ENGINE ONLY. Canon caps the Shield at 40%
                                  // (founder, 23 Oct 2026); removal awaits confirmation — MASTER Part 0 §5.
  SHIELD_PREMIUM_MIN: 0.02, // MAD-Shield opt-in fee 2%..4% of stake
  SHIELD_PREMIUM_MAX: 0.04,
  SHIELD_SAFETY_MARGIN: 0.35, // Premium = Stake·P(win)·σ·0.35 (17-corrections #4 — was 1.05)
  MADX_FIXED_SUPPLY: 888_888_888, // the TOTAL supply — founder, 2026-11-09: "MADx total supply is
                                   // 888,888,888", of which only 270 or 280 million is purchasable in
                                   // the token sale. The deployed contract (0x6972...151f, Arbitrum
                                   // One) mints on purchase with a mint cap of 224,573,096, and that is
                                   // the number the beta ledger ENFORCES (MADX_BETA.cap in
                                   // lib/madx-web2.ts; MADX.maxSupplyCap in lib/contracts.ts). Two
                                   // numbers, two meanings — neither replaces the other, and the cap
                                   // sits BELOW the sale figure, which is unresolved (MASTER PART 0 §3,
                                   // `$MADx` supply). Pinned by lib/madx-supply-canon.test.ts.
  FURNACE_BURN_CAP: 0.049, // The Furnace burn cap (≤4.9%)
  LMSR_DEFAULT_B: 1200, // DL-LMSR liquidity parameter (17-corrections #3 — was 100)
  PERP_TRIGGER_THRESHOLD: 0.60, // perpetual conversion gate (17-corrections #2 — was 0.65)
  VOTE_POWER_CAP: 240, // votingPower = min(√stake, 240) — cap is 240, not "24×"
  // GARCH(1,1) canonical parameters — σ_{t+1}=CLAMP(√(ω+α·ε²+β·σ²), 0.09, 0.68)
  GARCH_OMEGA: 0.0001, // base noise weight
  GARCH_ALPHA: 0.05, // reaction coefficient
  GARCH_BETA: 0.90, // persistence coefficient
  GARCH_AMP_COEFF: 0.8, // amp = 1 + 0.8σ ≤ 1.544
  SIGMA_MIN: 0.09,
  SIGMA_MAX: 0.68,
  // ── Card economy constants (source: MADHATs_Gambit_Card_Game_Logic_Code_Reference.docx April 2026) ──
  CARD_PACK_COST: 4.88, // MADx per pack
  CARD_PACK_SIZE: 5, // cards per pack
  CARD_GENERATION_SEED: 8888, // deterministic deck seed
  TOTAL_DECK_SIZE: 992, // canonical deck size
  PACK_GUARANTEE_SLOT: 0, // slot 0 always uncommon or better
} as const;

/** Staking tiers — canonical 4-tier eights ladder (founder sign-off 31 Jul 2026).
 *  Staking is the MAD-Shield gate: each tier maps to a Shield recovery cap.
 *  VIP status (>= 888,888 $MADx, capital-side) sits above as a status, not a
 *  public tier: 60% recovery + phi perks. effApy = apy * (1 + clout/200),
 *  so max effective 77.6% at Clout 200 — earned, never promised. */
export const STAKING_TIERS = [
  { name: 'Bronze',   minMadx: 88,     apy: 0.088, shieldRecoveryPct: 0.288 },
  { name: 'Silver',   minMadx: 888,    apy: 0.188, shieldRecoveryPct: 0.328 },
  { name: 'Gold',     minMadx: 8_888,  apy: 0.288, shieldRecoveryPct: 0.368 },
  { name: 'MAD Tier', minMadx: 88_888, apy: 0.388, shieldRecoveryPct: 0.40  },
] as const;
export const VIP_STATUS_MIN_MADX = 888_888; // ~0.1% of supply — 60% Shield recovery

/* CREATOR LADDER — founder sign-off 31 Jul 2026. Fee share applies ONLY to
 * the creator's own open markets (non-additive waterfall unchanged):
 *   User 28.8% -> MinorCreator 40% (12+ tractioned markets)
 *   -> CR8TR 60% (34 tractioned markets AND 888 followers).
 * TRACTION: a market counts once total conviction >= LMSR b (1,200 $MADx)
 * AND it has settled/rolled at least one payout to bettors.
 * VIP is the capital-side status (Shield 60%), never a creator tier. */
export const CREATOR_LADDER = [
  { status: 'User',         shareBps: 2880, unlockMarkets: 0,  unlockFollowers: 0 },
  { status: 'MinorCreator', shareBps: 4000, unlockMarkets: 12, unlockFollowers: 0 },
  { status: 'CR8TR',        shareBps: 6000, unlockMarkets: 34, unlockFollowers: 888 },
] as const;
/** The 60% VIP profit share is limited to exactly this many seats — rare and
 *  exclusive, not a traction rung. Founder, 2026-10-23: "creators take a sliding
 *  28.8 to 40% and then a limited 4888 seats offering the rare and exclusive 60%
 *  VIP profit share exist."
 *
 *  NOT YET ENFORCED. Pinned here so the number cannot drift. CREATOR_LADDER still
 *  reaches 6000 bps through the CR8TR traction rung with no seat count, so code
 *  and canon diverge until a seat registry exists (MASTER §5). Gating it moves
 *  real payouts and waits on how a seat is obtained. */
export const VIP_PROFIT_SHARE_SEATS = 4_888;
export const VIP_PROFIT_SHARE_BPS = 6000;

/** Is a VIP profit-share seat still open, given how many have been issued? */
export function vipSeatAvailable(issued: number): boolean {
  const n = Number.isFinite(issued) ? Math.floor(issued) : VIP_PROFIT_SHARE_SEATS;
  return n >= 0 && n < VIP_PROFIT_SHARE_SEATS;
}

export const TRACTION_MIN_CONVICTION_MADX = 1_200; // = LMSR liquidity b

export function creatorStatus(tractionedMarkets: number, followers: number) {
  return [...CREATOR_LADDER]
    .reverse()
    .find(t => tractionedMarkets >= t.unlockMarkets && followers >= t.unlockFollowers)
    ?? CREATOR_LADDER[0];
}

export function getStakingTier(madxBalance: number) {
  return [...STAKING_TIERS].reverse().find(t => madxBalance >= t.minMadx) ?? null;
}

/** Tournament prize distribution in BPS — source: Card Game Logic Code Reference §5 */
export const TOURNAMENT_PRIZES_BPS: Record<number, number> = {
  1: 4000, // 40%
  2: 2000, // 20%
  3: 1200, // 12%
  4: 500,  // 5%
  5: 500,  // 5%
  6: 200,  7: 200, 8: 200, 9: 200, 10: 200, // 2% each
};

export function tournamentPrizeForRank(rank: number, totalPool: number): number {
  const bps = TOURNAMENT_PRIZES_BPS[rank] ?? 0;
  return (totalPool * bps) / 10_000;
}

/** Evolution burn costs — source: Card Game Logic Code Reference §7 */
export const EVOLUTION_BURN_COSTS: Record<string, { cards: number; xp: number }> = {
  'Common':     { cards: 100,   xp: 100   },
  'Uncommon':   { cards: 250,   xp: 200   },
  'Rare':       { cards: 500,   xp: 500   },
  'Epic':       { cards: 1_000, xp: 2_500 },
  'Legendary':  { cards: 0,     xp: 0     }, // max burn-ladder tier
};

/** Rarity drop weights for pack generation (must sum to 1000 for integer math)
 *  Common/Uncommon rebalanced to absorb the increase below, preserving their
 *  original 12:5 ratio (600:250) so the "junk tier" feel is unchanged —
 *  only the exciting tiers got more generous. */
export const RARITY_DROP_WEIGHTS = {
  Common: 568,      // 56.8%
  Uncommon: 236,    // 23.6%
  Rare: 120,        // 12%
  Epic: 60,         // 6%
  Legendary: 10,    // 1%
  'Golden Hand': 6, // 0.6% — ERC-721, ultra-rare
} as const;
// Note: Mythic (1-of-1) is never in packs — only obtainable via special events

/** How the 992-card deck is made up (founder, 13-sections maths brief,
 *  2026-10-27). 8 factions × 14 base cards = 112; the parts sum to
 *  PLATFORM.TOTAL_DECK_SIZE, pinned by a test. */
export const DECK_COMPOSITION = {
  factions: 8,
  base: 112,
  crossovers: 784,
  chaosFusions: 56,
  legendaryCrossovers: 32,
  goldenPanderverse: 8,
} as const;

/* ====================================================================
 * SHIELD OPT-IN / OPT-OUT MECHANICS
 *     All shield tiers (Standard 28.8%, Shielded 40%, Whale 60%) are
 *     strictly opt-in. The user explicitly chooses shield at position
 *     open, pays the premium (2–4% of stake), and can opt-out anytime.
 *     Funds return in 2–24h depending on stake size. Protection applies
 *     for the full staked period; once unstake is requested, protection
 *     ends immediately and the return timer begins.
 * ==================================================================== */

export type ShieldStatus = 'none' | 'active' | 'unstaking' | 'returned';

export interface ShieldStakeInfo {
  status: ShieldStatus;
  tier: ShieldTier | null;        // null if status='none'
  premiumTier: number;            // 0..1 dial (for shielded tier)
  premiumPaid: number;            // flat $MADx premium charged at opt-in
  stakedAt: number | null;        // epoch ms — when shield was activated
  unstakeRequestedAt: number | null; // epoch ms — when user requested exit
  estimatedReturnAt: number | null;  // epoch ms — when funds land back
  returnWindowHours: number;      // 2..24 — calculated at unstake request time
}

/** Calculate how many hours until staked shield funds return.
 *  Range: 2h (small stakes) to 24h (large stakes).
 *  Formula: returnHours = clamp(2 + floor(stake / 10000) * 2, 2, 24)
 *  Examples: $100 → 2h | $5000 → 3h | $50000 → 12h | $110000+ → 24h */
export function calculateShieldReturnWindow(stakeAmount: number): number {
  const safeStake = Number.isFinite(stakeAmount) && stakeAmount > 0 ? stakeAmount : 0;
  const hours = 2 + Math.floor(safeStake / 10_000) * 2;
  return Math.min(24, Math.max(2, hours));
}

/** Calculate the shield premium cost to opt-in.
 *  Standard/Shielded: 2–4% of stake (scales with premiumTier dial).
 *  Whale: flat 3% (midpoint — whale tier earns value, not just discounts). */
export function calculateShieldPremium(
  stake: number,
  tier: ShieldTier,
  premiumTier: number = 0
): number {
  const safeStake = Number.isFinite(stake) && stake >= 0 ? stake : 0;
  if (tier === 'whale') return safeStake * 0.03;
  const safePremiumTier = Math.min(1, Math.max(0, premiumTier));
  // 2% at tier=0, 4% at tier=1
  const pct = PLATFORM.SHIELD_PREMIUM_MIN + safePremiumTier * (PLATFORM.SHIELD_PREMIUM_MAX - PLATFORM.SHIELD_PREMIUM_MIN);
  return safeStake * pct;
}

/** Create a fresh ShieldStakeInfo for a user opting in at position open.
 *  Call this when the user explicitly toggles shield ON at stake time. */
export function createShieldOptIn(
  stake: number,
  tier: ShieldTier,
  premiumTier: number,
  eligibility: WhaleEligibilityInput,
  requestWhaleTier: boolean,
  now: number = Date.now()
): ShieldStakeInfo | null {
  // Whale tier requires eligibility — if not met, return null (caller must inform user)
  if (tier === 'whale' && (!requestWhaleTier || !isWhaleShieldEligible(eligibility))) {
    return null;
  }
  const premiumPaid = calculateShieldPremium(stake, tier, premiumTier);
  return {
    status: 'active',
    tier,
    premiumTier,
    premiumPaid,
    stakedAt: now,
    unstakeRequestedAt: null,
    estimatedReturnAt: null,
    returnWindowHours: 0, // set at unstake request time
  };
}

/** Request to opt out of shield staking. Can be called at any time.
 *  Protection ends immediately; return window starts now.
 *  Returns the updated ShieldStakeInfo with estimated return time. */
export function requestShieldUnstake(
  info: ShieldStakeInfo,
  stakeAmount: number,
  now: number = Date.now()
): ShieldStakeInfo {
  if (info.status !== 'active') return info; // already unstaking or returned
  const windowHours = calculateShieldReturnWindow(stakeAmount);
  const estimatedReturnAt = now + windowHours * 60 * 60 * 1000;
  return {
    ...info,
    status: 'unstaking',
    unstakeRequestedAt: now,
    estimatedReturnAt,
    returnWindowHours: windowHours,
  };
}

/** Check whether an unstake request has matured (funds ready to claim).
 *  Call this on a timer or on page-load to update position state. */
export function isShieldUnstakeComplete(info: ShieldStakeInfo, now: number = Date.now()): boolean {
  return (
    info.status === 'unstaking' &&
    info.estimatedReturnAt !== null &&
    now >= info.estimatedReturnAt
  );
}

/** Human-readable countdown string for the return window.
 *  Returns "2h 14m remaining" or "Funds available now". */
export function shieldReturnCountdown(info: ShieldStakeInfo, now: number = Date.now()): string {
  if (info.status === 'returned') return 'Funds returned';
  if (info.status !== 'unstaking' || info.estimatedReturnAt === null) return '';
  const msLeft = info.estimatedReturnAt - now;
  if (msLeft <= 0) return 'Funds available now';
  const h = Math.floor(msLeft / 3_600_000);
  const m = Math.floor((msLeft % 3_600_000) / 60_000);
  if (h > 0) return `${h}h ${m}m remaining`;
  return `${m}m remaining`;
}

/** Eligibility gate for the 60% Whale/VIP/Partner shield tier. This is
 *  NOT unlocked by stake size alone — it requires sustained platform
 *  trust, not a single large bet, which prevents a whale from simply
 *  buying the highest recovery rate on a single risky position. */
export const WHALE_SHIELD_ELIGIBILITY = {
  MIN_LIFETIME_VOLUME: 250_000, // cumulative $MADx volume traded lifetime
  MIN_ACCOUNT_AGE_DAYS: 90,     // platform tenure floor
  MIN_TRUST_SCORE: 85,          // EigenTrust score floor (see calculateEigenTrustScore)
  MIN_GOLDEN_HAND_CARDS: 1,     // requires at least one Golden Hand+ rarity card staked
} as const;

export const bpsToPct = (bps: number): number => bps / 10_000;

/* ====================================================================
 * 1. MULTI-DIMENSIONAL CONVICTION SCORE  (Cobb-Douglas)
 *    Conviction = t^1.35 · c^0.75 · d^1.45 · p^1.15 · M_nft · L_θ
 *    Source: MATH_REPORT §1 (GambitMath.kt calculateConviction)
 * ==================================================================== */
// NB: lib/mpp-math.ts exports a DIFFERENT function with this same name (a 4-argument saturating
// adoption curve). Import from the module you mean; see the note there.
export function calculateConviction(
  timeScaled: number,
  capitalScaled: number,
  contributionScaled: number,
  psychScaled: number,
  nftMult: number,
  lunarMultiplier = 1.0
): number {
  const t = Math.pow(Math.max(timeScaled, 0), 1.35);
  const c = Math.pow(Math.max(capitalScaled, 0), 0.75);
  const d = Math.pow(Math.max(contributionScaled, 0), 1.45);
  const p = Math.pow(Math.max(psychScaled, 0), 1.15);
  const m = Number.isFinite(nftMult) ? nftMult : 1.0;
  const l = Number.isFinite(lunarMultiplier) ? lunarMultiplier : 1.0;
  const result = t * c * d * p * m * l;
  return Number.isFinite(result) ? result : 0;
}

/* ====================================================================
 * 2. COSMOLOGICAL LUNAR CONVICTION ALIGNMENT
 *    L_θ = 1.075 − 0.075 · cos(2π · φ),  bounded [1.00, 1.15]
 *    Epoch: Immaculate Conception of Conviction = 1979-12-08
 *    Source: MATH_REPORT §4
 * ==================================================================== */
export const IMMACULATE_CONCEPTION_EPOCH_MS = 313_459_200_000; // 1979-12-08
export const LUNAR_CYCLE_MS = 2_551_442_877; // 29.530588853 days

export function getLunarPhaseMultiplier(currentTimeMs: number = Date.now()): number {
  const timeDiff = currentTimeMs - IMMACULATE_CONCEPTION_EPOCH_MS;
  let phase = (timeDiff % LUNAR_CYCLE_MS) / LUNAR_CYCLE_MS;
  if (phase < 0) phase += 1.0;
  return 1.075 - 0.075 * Math.cos(2.0 * Math.PI * phase);
}

/** Returns 0..1 illumination fraction for rendering the live moon dial. */
export function getLunarIllumination(currentTimeMs: number = Date.now()): number {
  const timeDiff = currentTimeMs - IMMACULATE_CONCEPTION_EPOCH_MS;
  let phase = (timeDiff % LUNAR_CYCLE_MS) / LUNAR_CYCLE_MS;
  if (phase < 0) phase += 1.0;
  return (1 - Math.cos(2 * Math.PI * phase)) / 2; // 0 new → 1 full
}

/* ====================================================================
 * 3. VOLUME-SCALED BOND PRICING (DL-LMSR)
 *    α(V) = 1 + 0.05·log10(1+V)
 *    C(q) = α(V)·b·ln(Σ e^(q_i/b))
 *    P_i  = e^(q_i/b) / Σ e^(q_j/b)                    — DISPLAY PROBABILITY, unscaled by α
 *    M_i  = α(V)·e^(q_i/b) / Σ e^(q_j/b) = ∂C/∂q_i      — MARGINAL COST, scaled by α
 *    Source: MATH_REPORT §2
 *
 *    P_i and M_i are deliberately different functions, not the same value in
 *    two places. P_i is the plain softmax: it stays in (0,1) and sums to 1
 *    across outcomes no matter how much volume the market has seen, which is
 *    the contract a "price" shown as a percentage in the UI must honor — if
 *    it were scaled by α(V) (>1 for any nonzero volume), a busy market would
 *    render probabilities that don't sum to 100%. M_i is the true marginal
 *    dollar cost of the next infinitesimal share — the correct ∂C/∂q_i once
 *    C itself is volume-scaled — and is what any execution/slippage
 *    calculation should use instead of P_i. Do not substitute one for the
 *    other; a caller that needs "what will the next share cost me" wants
 *    calculateDLLMSRMarginalCost, not calculateDLLMSRPrice.
 *
 *    All three functions below clamp q/b to [-700, 700] before exponentiating,
 *    matching the guard calculateSoftmax already uses in this file — without
 *    it, Math.exp overflows to Infinity past that point and downstream sums
 *    silently produce Infinity or NaN instead of erroring.
 * ==================================================================== */
export function calculateVolumeScalingAlpha(volume: number): number {
  const safe = Math.max(volume, 0);
  return 1.0 + 0.05 * Math.log10(1.0 + safe);
}

function lmsrExp(q: number, b: number): number {
  return Math.exp(Math.min(700, Math.max(-700, q / b)));
}

export function calculateDLLMSRCost(shares: number[], b: number, volume: number): number {
  if (shares.length === 0 || b <= 0) return 0;
  const alpha = calculateVolumeScalingAlpha(volume);
  const sumExp = shares.reduce((s, q) => s + lmsrExp(q, b), 0);
  return alpha * b * Math.log(sumExp);
}

/** Display/probability price — softmax over shares, always in (0,1), always
 *  sums to 1 across the full `shares` vector. Intentionally NOT scaled by
 *  α(V); see the section-3 header comment above for why. */
export function calculateDLLMSRPrice(qI: number, shares: number[], b: number): number {
  if (shares.length === 0 || b <= 0) return 0;
  const sumExp = shares.reduce((s, q) => s + lmsrExp(q, b), 0);
  return lmsrExp(qI, b) / sumExp;
}

/** Marginal cost — the true ∂C/∂q_i of calculateDLLMSRCost, i.e. the dollar
 *  cost of the next infinitesimal share of outcome i once the cost surface
 *  is volume-scaled by α(V). This is what an execution-price or slippage
 *  calculation should read; calculateDLLMSRPrice is for display instead. */
export function calculateDLLMSRMarginalCost(qI: number, shares: number[], b: number, volume: number): number {
  if (shares.length === 0 || b <= 0) return 0;
  const alpha = calculateVolumeScalingAlpha(volume);
  return alpha * calculateDLLMSRPrice(qI, shares, b);
}

/* ====================================================================
 * 4. GARCH(1,1) VOLATILITY  (MAD Shield risk metric)
 *    σ²_{t+1} = ω + α·ε²_t + β·σ²_t
 *    Canon (17-corrections): ω=0.0001 · α=0.05 · β=0.90 · the engine
 *    STORES σ, not σ² — σ_{t+1} = CLAMP(√(ω+α·ε²+β·σ²), 0.09, 0.68)
 *    and amplification = 1 + 0.8·σ (≤ 1.544).
 *    Source: MATH_REPORT §3 · Maths Engine Room (canonical)
 * ==================================================================== */
export function garchUpdate(
  omega: number,
  alpha: number,
  beta: number,
  prevVariance: number,
  prevShock: number
): number {
  const o = Number.isFinite(omega) ? omega : PLATFORM.GARCH_OMEGA;
  const a = Number.isFinite(alpha) ? alpha : PLATFORM.GARCH_ALPHA;
  const b = Number.isFinite(beta) ? beta : PLATFORM.GARCH_BETA;
  const pv = Number.isFinite(prevVariance) ? prevVariance : 0.02;
  const ps = Number.isFinite(prevShock) ? prevShock : 0.0;
  const result = o + a * Math.pow(ps, 2) + b * pv;
  return Number.isFinite(result) ? result : 0.02;
}

/** Canonical GARCH tick — takes/returns σ (not σ²), clamped to [0.09, 0.68].
 *  σ_{t+1} = CLAMP(√(ω + α·ε²_t + β·σ²_t), SIGMA_MIN, SIGMA_MAX) */
export function garchSigma(prevSigma: number, prevShock: number): number {
  const variance = garchUpdate(
    PLATFORM.GARCH_OMEGA, PLATFORM.GARCH_ALPHA, PLATFORM.GARCH_BETA,
    Math.pow(Math.max(prevSigma, 0), 2), prevShock,
  );
  return Math.min(PLATFORM.SIGMA_MAX, Math.max(PLATFORM.SIGMA_MIN, Math.sqrt(variance)));
}

/** Volatility amplification: 1 + 0.8·σ — capped at 1.544 by the σ clamp. */
export function garchAmplification(sigma: number): number {
  const s = Math.min(PLATFORM.SIGMA_MAX, Math.max(0, sigma));
  return 1 + PLATFORM.GARCH_AMP_COEFF * s;
}

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
  /** volume × 1.88%. The flat platform rake. */
  grossFee: number;
  /** Creator's share — ONLY on markets they made. Zero everywhere else. */
  creatorCut: number;
  /** grossFee − creatorCut. The platform's NET, and the base the community
   *  share is taken from. 100% of the fee on a platform-made market. */
  platformNet: number;
  /** 28.8% of platformNet — community AND DAO treasury, earmarked for
   *  rewards, marketing and grants. */
  communityCut: number;
  /** What the protocol actually keeps after the community allocation. */
  protocolCut: number;
}
/**
 * Split the 1.88% platform rake.
 *
 * ── CORRECTED 2026-08-27, founder sign-off ────────────────────────
 * The founder's statement of record: *"There is a flat platform rake of 1.88%,
 * the Community profit share is 28.8% of NET profits, the creator profit share
 * is only from activity and fees from those creator made markets."*
 *
 * This function previously took the community cut off the GROSS fee. That was
 * logged as a bug in docs/boardy/CANONICAL_NUMBERS_2026-08-19.md — on a
 * creator market it over-allocated the community by 11.52 percentage points of
 * the gross fee, and it modelled a flat three-way split where canon is a
 * two-stage waterfall.
 *
 *   grossFee     = volume × 1.88%
 *   creatorCut   = creator-made markets only, their ladder rung × grossFee
 *   platformNet  = grossFee − creatorCut          ← the "net profits"
 *   communityCut = platformNet × 28.8%            ← community + DAO treasury
 *   protocolCut  = platformNet − communityCut
 *
 * Worked example, 10,000 volume, creator market at the 40% rung:
 *   gross 188 · creator 75.20 · net 112.80 · community 32.4864 · protocol 80.3136
 * The community's 32.4864 is 17.28% of gross — exactly the figure canon
 * specifies, versus the 54.144 (28.8% of gross) the old code paid out.
 *
 * RESOLVED 2026-10-23 (founder): the 2880-bps first rung is correct. Creators
 * slide 28.8% → 40%; 60% is a VIP profit share limited to 4,888 seats, not a
 * rung. Every row of this waterfall is pinned in lib/pitch-canon.test.ts.
 *
 * `creatorShareBps` is the creator's CREATOR_LADDER rung
 *  (2880 User / 4000 MinorCreator / 6000 CR8TR) and applies ONLY on that
 *  creator's own market — pass 0 for platform-made markets. */
export function splitFee(volume: number, creatorShareBps: number = 0): FeeSplit {
  const grossFee = volume * bpsToPct(PLATFORM.FEE_BPS);
  const safeBps = Math.min(6000, Math.max(0, creatorShareBps));
  const creatorCut = grossFee * bpsToPct(safeBps);
  // TWO-STAGE WATERFALL, not a flat three-way split. The creator is paid off
  // the gross first; what remains is the platform's NET, and the community
  // allocation is a share OF THAT — not of the gross.
  const platformNet = grossFee - creatorCut;
  const communityCut = platformNet * bpsToPct(PLATFORM.COMMUNITY_SHARE_BPS);
  const protocolCut = platformNet - communityCut;
  return { grossFee, creatorCut, platformNet, communityCut, protocolCut };
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
/** @deprecated superseded by calculateShieldPayoutFull (below), which is the
 *  function product code should call — see its own doc comment for the full
 *  three-tier resolution order. Kept callable for existing call sites; its
 *  own behavior is unchanged here, only this comment is corrected.
 *
 *  This function has exactly two outputs — 40% (vip=false) or 60% (vip=true)
 *  — using hardcoded literals rather than the PLATFORM.SHIELD_RECOVERY_*
 *  constants. It has no path that returns the canonical 28.8% standard-tier
 *  rate at all, despite a prior version of this comment claiming it does;
 *  that claim did not match the code and has been removed. Use
 *  calculateShieldPayoutFull for the standard (28.8%), shielded (28.8%→40%
 *  dial), and whale (60%, gated) tiers this function does not implement. */
export function shieldRecovery(loss: number, vip = false): number {
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

export const RARITY_TABLE: Record<Rarity, RarityTier> = {
  Common:        { rarity: 'Common',        powerScore: 88,     cloutMultiplier: 1.1,  stakingApy: 12, holographic: false, accent: '#94a3b8' },
  Uncommon:      { rarity: 'Uncommon',      powerScore: 256,    cloutMultiplier: 1.8,  stakingApy: 16, holographic: false, accent: '#7cffc7' },
  Rare:          { rarity: 'Rare',          powerScore: 488,    cloutMultiplier: 2.4,  stakingApy: 22, holographic: false, accent: '#58a6ff' },
  Epic:          { rarity: 'Epic',          powerScore: 1888,   cloutMultiplier: 3.2,  stakingApy: 31, holographic: false, accent: '#c98aff' },
  Legendary:     { rarity: 'Legendary',     powerScore: 4888,   cloutMultiplier: 5.5,  stakingApy: 48, holographic: true,  accent: '#f5242a' },
  'Golden Hand': { rarity: 'Golden Hand',   powerScore: 7888,   cloutMultiplier: 8.8,  stakingApy: 68, holographic: true,  accent: '#d69d41' },
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
/** The five bands and the score at which each opens — one table, so a surface
 *  that renders a band cannot drift from the one the engine returned.
 *  `perp-dials.tsx` carried its own copy with the thresholds at 38 and 84,
 *  which printed MOSTLY CANDID over a score this engine called SLIPPERY, and
 *  SERIAL EMBELLISHER over one it called TOTAL FABRICATION. Read this instead. */
export const ZLIAR_BANDS: ReadonlyArray<{ min: number; verdict: ZLiarVerdict }> = [
  { min: 80, verdict: 'TOTAL FABRICATION' },
  { min: 60, verdict: 'SERIAL EMBELLISHER' },
  { min: 40, verdict: 'SLIPPERY' },
  { min: 20, verdict: 'MOSTLY CANDID' },
  { min: 0, verdict: 'STRAIGHT SHOOTER' },
];

/** The band a score falls in. Indexed loop, not for-of: this file compiles at
 *  target es5 without downlevelIteration. */
export function zLiarVerdictFor(score: number): ZLiarVerdict {
  for (let i = 0; i < ZLIAR_BANDS.length; i++) {
    if (score >= ZLIAR_BANDS[i].min) return ZLIAR_BANDS[i].verdict;
  }
  return 'STRAIGHT SHOOTER';
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
  return { score, verdict: zLiarVerdictFor(score), bs, volatility: variance, lunarTilt };
}

/* ====================================================================
 * 16. O-V DECK VERSION SYSTEM
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
    primary: "#d69d41",
    secondary: "#d69d41",
    accent: "#ff00f0",
    bg: "#030508",
    panel: "#05070c",
    border: "#d69d4133",
    glow: "#d69d41",
  },
  CyberOnyx: {
    id: "CyberOnyx",
    label: "Cyber Onyx",
    primary: "#00f0ff",
    secondary: "#7cffc7",
    accent: "#f5242a",
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

/** Clout is a 0–200 score (canon §7: clout ∈ [0, 200]), so the boost tops out at 2×. */
export const MAX_NFT_CLOUT = 200;

/** NFT-clout-scaled staking yield: APY_user = APY_base · (1 + clout/200),
 *  clout clamped to [0, 200]. MAD Tier therefore tops out at 38.8% × 2 = 77.6%.
 *  Unclamped, POST /api/v1/staking/yield (which only floors clout at 0) would
 *  quote any multiple a caller asked for. */
export function calculateStakingYield(apyBase: number, nftClout: number): number {
  const clout = Number.isFinite(nftClout) ? Math.min(MAX_NFT_CLOUT, Math.max(nftClout, 0)) : 0;
  return apyBase * (1 + clout / MAX_NFT_CLOUT);
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
  const roll = Math.floor(rand * (1000 - floor)) + floor;
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
