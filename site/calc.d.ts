export const FEE_BPS: number;
export const COMMUNITY_SHARE_BPS: number;
export const CREATOR_RUNGS: ReadonlyArray<{ id: string; label: string; bps: number }>;
export interface FeeSplit {
  grossFee: number;
  creatorCut: number;
  platformNet: number;
  communityCut: number;
  protocolCut: number;
}
export function splitFee(volume: number, creatorShareBps?: number): FeeSplit;
