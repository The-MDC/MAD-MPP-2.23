/**
 * Fee waterfall for the madgambit.io calculator.
 *
 * A line-for-line port of `splitFee` in verify/lib/gambit-game-math.ts (the code is the
 * implementation authority). verify/lib/site-fee-calc.test.ts runs both over a grid of inputs
 * and fails if they ever disagree, so the site cannot drift from the engine.
 *
 *   gross     = volume x 1.88%
 *   creator   = gross x creator rung            (creator-made markets only; 0 for platform-run)
 *   net       = gross - creator
 *   community = net x 28.8%
 *   protocol  = net - community
 */
export const FEE_BPS = 188;
export const COMMUNITY_SHARE_BPS = 2880;
/** The two public rungs. 60% is a limited, invitation-only VIP share and is not offered here. */
export const CREATOR_RUNGS = [
  { id: "platform", label: "Platform-run market", bps: 0 },
  { id: "user", label: "Creator-made, starting rung", bps: 2880 },
  { id: "minor", label: "Creator-made, top public rung", bps: 4000 },
];

const bpsToPct = (bps) => bps / 10_000;

export function splitFee(volume, creatorShareBps = 0) {
  const v = Number.isFinite(volume) && volume > 0 ? volume : 0;
  const grossFee = v * bpsToPct(FEE_BPS);
  const safeBps = Math.min(6000, Math.max(0, creatorShareBps));
  const creatorCut = grossFee * bpsToPct(safeBps);
  const platformNet = grossFee - creatorCut;
  const communityCut = platformNet * bpsToPct(COMMUNITY_SHARE_BPS);
  const protocolCut = platformNet - communityCut;
  return { grossFee, creatorCut, platformNet, communityCut, protocolCut };
}
