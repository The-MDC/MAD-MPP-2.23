/**
 * MAD Gambit — 5-Stream Revenue Engine (Phase 4)
 * ────────────────────────────────────────────────────────────────
 * The platform's five revenue streams share ONE fee primitive: the canonical
 * 1.88% `splitFee()` — a two-stage waterfall: creator off the gross on their
 * own markets, then community at 28.8% OF THE REMAINING NET — plus
 * the Furnace burn — both from lib/gambit-game-math.ts. This module layers the
 * stream taxonomy + projection on top of that primitive so every stream's
 * economics are computed the same way and can never drift from the canon.
 *
 * On-chain settlement per stream is Foundry-gated (see `contract` + `status`);
 * this layer is the off-chain model + API/UI the frontend reads.
 */
import { splitFee, calculateFurnaceBurnPercent, CREATOR_LADDER, type FeeSplit } from './gambit-game-math';

export type StreamId = 'prediction' | 'casino' | 'marketplace' | 'moonpad' | 'staking';

export interface RevenueStream {
  id: StreamId;
  name: string;
  tagline: string;
  /** Settlement contract (Foundry-gated where not yet deployed). */
  contract: string;
  /** Streams that route a 40% creator cut on creator-made markets. */
  creatorEligible: boolean;
  status: 'live' | 'partial' | 'planned';
}

export const REVENUE_STREAMS: readonly RevenueStream[] = [
  {
    id: 'prediction',
    name: 'Prediction Markets',
    tagline: 'Convictions + Predictions core with the Liar Meter',
    contract: 'MarketFactory + settlement',
    creatorEligible: true,
    status: 'partial',
  },
  {
    id: 'casino',
    name: 'Golden Hand Casino',
    tagline: 'Provably-fair games (Chainlink VRF)',
    contract: 'GoldenHandCasino (VRF)',
    creatorEligible: false,
    status: 'planned',
  },
  {
    id: 'marketplace',
    name: 'Marketplace+',
    tagline: 'Card secondary market + micro-loans',
    contract: 'MarketplacePlus',
    creatorEligible: false,
    status: 'planned',
  },
  {
    id: 'moonpad',
    name: 'MADFORGE MoonPad',
    tagline: 'Launchpad + quadratic funding',
    contract: 'MoonPad',
    creatorEligible: true,
    status: 'planned',
  },
  {
    id: 'staking',
    name: 'MADDAO Staking',
    tagline: 'Real-yield staking + quadratic/futarchy governance',
    contract: 'MADStaking',
    creatorEligible: false,
    status: 'live',
  },
] as const;

export interface StreamProjection extends FeeSplit {
  streamId: StreamId;
  volume: number;
  /** Furnace burn % applied to this volume + its gross fee (≤ 4.9% cap). */
  burnPercent: number;
  /** Absolute $MADx burned. */
  burnAmount: number;
  /** Protocol cut net of the Furnace burn. */
  netProtocol: number;
}

/** Project one stream's economics from its volume, via the canonical primitives. */
export function projectStream(
  streamId: StreamId,
  volume: number,
  isCreatorMarket = false,
): StreamProjection {
  const stream = REVENUE_STREAMS.find((s) => s.id === streamId);
  const creator = (stream?.creatorEligible ?? false) && isCreatorMarket;
  const v = Math.max(0, volume);
  // Creator markets are modeled at the MinorCreator rung (40%) — the ladder's
  // middle rung — for projection purposes; real splits use creatorStatus().
  const fee = splitFee(v, creator ? CREATOR_LADDER[1].shareBps : 0);
  const burnPercent = calculateFurnaceBurnPercent(v, fee.grossFee);
  const burnAmount = (burnPercent / 100) * v;
  const netProtocol = Math.max(0, fee.protocolCut - burnAmount);
  return { streamId, volume: v, ...fee, burnPercent, burnAmount, netProtocol };
}

export interface RevenueRollup {
  totalVolume: number;
  totalGrossFee: number;
  totalCreator: number;
  /** grossFee − creator. The base the community share is taken from. */
  totalPlatformNet: number;
  totalCommunity: number;
  totalProtocol: number;
  totalBurn: number;
  perStream: StreamProjection[];
}

/** Roll up all five streams from a per-stream volume map. */
export function projectAllStreams(
  volumes: Partial<Record<StreamId, number>>,
  isCreatorMarket = false,
): RevenueRollup {
  const perStream = REVENUE_STREAMS.map((s) =>
    projectStream(s.id, volumes[s.id] ?? 0, isCreatorMarket),
  );
  const sum = (f: (p: StreamProjection) => number) => perStream.reduce((a, p) => a + f(p), 0);
  return {
    totalVolume: sum((p) => p.volume),
    totalGrossFee: sum((p) => p.grossFee),
    totalCreator: sum((p) => p.creatorCut),
    totalPlatformNet: sum((p) => p.platformNet),
    totalCommunity: sum((p) => p.communityCut),
    totalProtocol: sum((p) => p.netProtocol),
    totalBurn: sum((p) => p.burnAmount),
    perStream,
  };
}
