/**
 * MAD Gambit — the ZEITGEIST slot auction room (§11.3).
 * ────────────────────────────────────────────────────────────────
 * How a trend gets a slot on the next slate. Three phases, each solving a
 * different failure of the naive version ("the founder picks three trends").
 *
 *   NOMINATION — anyone proposes a trend. Nominations are weighted by the
 *   nominator's EigenTrust score, so a brigade of fresh wallets carries the
 *   weight it deserves, which is approximately none.
 *
 *   COMMIT — sealed bids. `sha256(bidder ‖ trend ‖ amount ‖ salt)`. Without
 *   sealing, the last bidder before close always wins by one wei and everyone
 *   learns to bid late, which turns a price-discovery mechanism into a latency
 *   contest. (sha256 rather than keccak256 because this commitment is verified
 *   off-chain only; if the auction ever moves on-chain the hash moves with it.)
 *
 *   REVEAL — bids opened, auction cleared at a UNIFORM price.
 *
 * THE DUTCH CLOCK sets the reserve, descending from an ambitious start to a
 * floor across the window. It is not the clearing mechanism — it is the
 * mechanism that guarantees the auction ENDS with slots filled. A pure sealed
 * uniform-price auction with a fixed reserve simply fails when nobody bids that
 * high, and a slate with an empty slot is worse than a slate with a cheap one.
 *
 * WHY UNIFORM PRICE AND NOT PAY-AS-BID. Pay-as-bid punishes exactly the
 * participant the slate wants — the one who states what a slot is honestly
 * worth to them — and rewards the one who guesses the clearing price best. With
 * a uniform price, bidding your true value is close to optimal, so the winning
 * bids mean something as a signal about the year rather than being an artefact
 * of who models the auction best.
 *
 * UNREVEALED COMMITS FORFEIT THEIR DEPOSIT. Otherwise a bidder commits high to
 * scare rivals off and simply never reveals — free option, no cost, and the
 * clearing price becomes a fiction.
 */
import { createHash } from "crypto";
import { calculateEigenTrustScore, type Engagement } from "@/lib/gambit-game-math";
import { LEG_MS } from "@/lib/lunar-legs";
import { MAX_SLOTS, MIN_SLOTS } from "@/lib/trend-slate";

export type AuctionPhase = "nomination" | "commit" | "reveal" | "cleared";

/** The auction runs inside the last leg before a Turning. */
export const NOMINATION_MS = LEG_MS * 0.5;
export const COMMIT_MS = LEG_MS * 0.35;
export const REVEAL_MS = LEG_MS * 0.15;

/** Forfeited if a commit is never revealed. Expressed as a share of the bid. */
export const REVEAL_DEPOSIT_SHARE = 0.1;

export interface AuctionWindow {
  opensAt: number;
  commitOpensAt: number;
  revealOpensAt: number;
  closesAt: number;
}

export function auctionWindow(opensAtMs: number): AuctionWindow {
  const commitOpensAt = opensAtMs + NOMINATION_MS;
  const revealOpensAt = commitOpensAt + COMMIT_MS;
  return { opensAt: opensAtMs, commitOpensAt, revealOpensAt, closesAt: revealOpensAt + REVEAL_MS };
}

export function phaseAt(w: AuctionWindow, nowMs: number): AuctionPhase {
  if (nowMs < w.commitOpensAt) return "nomination";
  if (nowMs < w.revealOpensAt) return "commit";
  if (nowMs < w.closesAt) return "reveal";
  return "cleared";
}

/* ────────────────────────────────────────────────────────────────
 * The Dutch clock
 * ──────────────────────────────────────────────────────────────── */

export interface ClockParams {
  startPrice: number;
  reservePrice: number;
  /** Descent shape. Exponential by default — see below. */
  shape?: "linear" | "exponential";
}

/**
 * Reserve price at time t.
 *
 * EXPONENTIAL BY DEFAULT, and the reason is behavioural rather than
 * mathematical: a linear clock spends half the window in a price range nobody
 * will pay, so all the real decisions compress into the final minutes — the
 * latency contest the sealed bid was supposed to remove. An exponential descent
 * falls fast through the implausible range and then crawls through the
 * plausible one, which is where you actually want the resolution.
 */
export function clockPriceAt(w: AuctionWindow, params: ClockParams, nowMs: number): number {
  const start = Math.max(0, params.startPrice);
  const reserve = Math.max(0, Math.min(params.reservePrice, start));
  const span = w.closesAt - w.opensAt;
  if (!(span > 0)) return reserve;

  const t = Math.min(1, Math.max(0, (nowMs - w.opensAt) / span));
  if (params.shape === "linear") return start + (reserve - start) * t;

  // p(t) = reserve + (start − reserve)·e^(−k t), normalised so p(1) = reserve.
  const k = 5;
  const decay = (Math.exp(-k * t) - Math.exp(-k)) / (1 - Math.exp(-k));
  return reserve + (start - reserve) * decay;
}

/* ────────────────────────────────────────────────────────────────
 * Nomination
 * ──────────────────────────────────────────────────────────────── */

export interface Nomination {
  trendKey: string;
  trendName: string;
  nominator: string;
  /** The nominator's engagement history, for EigenTrust weighting. */
  engagements?: Engagement[];
  corpus?: string[];
}

export interface WeightedNomination {
  trendKey: string;
  trendName: string;
  /** Σ of nominator trust scores. Bots contribute ~0 by construction. */
  weight: number;
  nominators: number;
  corpus: string[];
}

/**
 * Pool nominations by trend and weight them by nominator trust.
 *
 * A nominator with no engagement history scores 0, so an unlimited supply of
 * fresh wallets sums to zero — which is the property that makes an open
 * nomination pool safe to have at all. Trend identity is the KEY, not the name,
 * so two nominators spelling a trend differently still stack.
 */
export function poolNominations(nominations: readonly Nomination[]): WeightedNomination[] {
  const byKey = new Map<string, WeightedNomination>();
  for (const n of nominations) {
    const weight = calculateEigenTrustScore(n.engagements ?? []);
    const existing = byKey.get(n.trendKey);
    if (existing) {
      existing.weight += weight;
      existing.nominators += 1;
      for (const line of n.corpus ?? []) {
        if (!existing.corpus.includes(line)) existing.corpus.push(line);
      }
    } else {
      byKey.set(n.trendKey, {
        trendKey: n.trendKey,
        trendName: n.trendName,
        weight,
        nominators: 1,
        corpus: [...(n.corpus ?? [])],
      });
    }
  }
  // Array.from, not a spread: the compile target is es5 and spreading a Map
  // iterator needs downlevelIteration, which this project does not enable.
  return Array.from(byKey.values()).sort(
    (a, b) => b.weight - a.weight || a.trendKey.localeCompare(b.trendKey),
  );
}

/* ────────────────────────────────────────────────────────────────
 * Commit–reveal
 * ──────────────────────────────────────────────────────────────── */

/**
 * The commitment. Binds the BIDDER as well as the amount, so a commitment
 * cannot be copied from the mempool and re-submitted by someone else who then
 * reveals it first — the classic commit-reveal theft that catches designs which
 * hash only (amount, salt).
 */
export function commitmentHash(bidder: string, trendKey: string, amount: number, salt: string): string {
  return createHash("sha256")
    .update(`${bidder.toLowerCase()}|${trendKey}|${amount.toFixed(8)}|${salt}`)
    .digest("hex");
}

export interface SealedBid {
  bidder: string;
  trendKey: string;
  commitment: string;
  committedAt: number;
  deposit: number;
}

export interface RevealedBid {
  bidder: string;
  trendKey: string;
  amount: number;
  salt: string;
  revealedAt: number;
}

export function verifyReveal(sealed: SealedBid, reveal: RevealedBid): boolean {
  if (sealed.bidder.toLowerCase() !== reveal.bidder.toLowerCase()) return false;
  if (sealed.trendKey !== reveal.trendKey) return false;
  return commitmentHash(reveal.bidder, reveal.trendKey, reveal.amount, reveal.salt) === sealed.commitment;
}

/* ────────────────────────────────────────────────────────────────
 * Clearing
 * ──────────────────────────────────────────────────────────────── */

export interface AuctionResult {
  /** Uniform price every winner pays. */
  clearingPrice: number;
  winners: { bidder: string; trendKey: string; amount: number }[];
  /** Commits that were never revealed, and the deposit each forfeits. */
  forfeited: { bidder: string; deposit: number }[];
  /** Reveals that did not match their commitment — discarded, deposit kept. */
  invalid: string[];
  slots: number;
  /** True when the reserve had to fill a slot nobody bid for. */
  underSubscribed: boolean;
}

export interface ClearInput {
  sealed: readonly SealedBid[];
  reveals: readonly RevealedBid[];
  slots: number;
  reservePrice: number;
}

/**
 * Clear the auction.
 *
 * One trend per bidder per slot: a bidder who commits twice for the same trend
 * is deduplicated to their highest valid reveal, and a trend can win at most one
 * slot. Without the second rule a single trend outbidding everyone would take
 * the whole slate, which defeats the point of running two or three.
 */
export function clearAuction(input: ClearInput): AuctionResult {
  const slots = Math.min(MAX_SLOTS, Math.max(MIN_SLOTS, Math.floor(input.slots)));
  const reserve = Math.max(0, input.reservePrice);

  const sealedByKey = new Map<string, SealedBid>();
  for (const s of input.sealed) sealedByKey.set(`${s.bidder.toLowerCase()}|${s.commitment}`, s);

  const valid: RevealedBid[] = [];
  const invalid: string[] = [];
  const revealedCommitments = new Set<string>();

  for (const r of input.reveals) {
    const key = commitmentHash(r.bidder, r.trendKey, r.amount, r.salt);
    const sealed = sealedByKey.get(`${r.bidder.toLowerCase()}|${key}`);
    if (!sealed || !verifyReveal(sealed, r)) {
      invalid.push(r.bidder);
      continue;
    }
    revealedCommitments.add(`${r.bidder.toLowerCase()}|${sealed.commitment}`);
    // Below the reserve is a valid reveal that simply loses — the deposit is
    // returned. Punishing an honest low bid would only teach people not to bid.
    if (r.amount >= reserve) valid.push(r);
  }

  const forfeited = input.sealed
    .filter((s) => !revealedCommitments.has(`${s.bidder.toLowerCase()}|${s.commitment}`))
    .map((s) => ({ bidder: s.bidder, deposit: s.deposit }));

  // Best bid per (bidder, trend), then best bid per trend.
  const bestPerTrend = new Map<string, RevealedBid>();
  for (const r of valid) {
    const cur = bestPerTrend.get(r.trendKey);
    if (!cur || r.amount > cur.amount || (r.amount === cur.amount && r.revealedAt < cur.revealedAt)) {
      bestPerTrend.set(r.trendKey, r);
    }
  }

  const ranked = Array.from(bestPerTrend.values()).sort(
    (a, b) => b.amount - a.amount || a.revealedAt - b.revealedAt,
  );
  const winning = ranked.slice(0, slots);

  // Uniform price: everyone pays the lowest winning bid, floored at the reserve.
  const clearingPrice = winning.length ? Math.max(reserve, winning[winning.length - 1].amount) : reserve;

  return {
    clearingPrice,
    winners: winning.map((w) => ({ bidder: w.bidder, trendKey: w.trendKey, amount: w.amount })),
    forfeited,
    invalid,
    slots,
    underSubscribed: winning.length < slots,
  };
}

/** Deposit required to place a sealed bid of this size. */
export function requiredDeposit(amount: number): number {
  return Math.max(0, amount) * REVEAL_DEPOSIT_SHARE;
}
