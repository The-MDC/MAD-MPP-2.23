/**
 * The per-subject exposure gate (maths document, Part 1.5 and item 2.8).
 *
 * Every dimension a market adds (a leg, a cohort, a storyline) is another axis along which ONE account can assemble a
 * hedged, risk-free combination and collect a difference forever. With two legs this gate is not optional: it is the
 * difference between a market and a donation. So no spread market may open without it (lib/spread-market.ts refuses
 * a spec whose `exposureGate` is not true).
 *
 * Three rules, all checked on the state AFTER the trade, and a refused trade changes nothing:
 *
 *   1. SUBJECT CAP, per account: the GROSS notional an account holds across every market that names a subject
 *      (Σ|position|, never the net) stays under `perAccountSubject`. Gross, because netting is exactly how a hedge hides.
 *   2. SUBJECT CAP, house: the gross notional of all accounts on a subject stays under `houseSubject`, because the house
 *      carries the inventory (the buyer was already paid).
 *   3. NO HEDGED PAIRS: within one spread market an account holds at most ONE leg, in one direction. Holding both legs,
 *      or both directions of one leg, is the risk-free combination. To switch, close first.
 *
 * Pure: positions in, verdict out. Wiring it to the database (a `FOR UPDATE` on the subject row) is a later step;
 * until then it is a library with proofs, not a live control.
 */
export interface Position {
  account: string;
  /** The person or thing the market is about. The cap is per subject, across every market naming it. */
  subject: string;
  marketId: string;
  /** Which leg of the market (storyline, channel or cohort). */
  legId: string;
  /** +1 long the leg, -1 short it. */
  direction: 1 | -1;
  /** Positive notional, in MADx. */
  notional: number;
}

export interface GateCaps {
  perAccountSubject: number;
  houseSubject: number;
}

export type Verdict = { ok: true } | { ok: false; reason: string };

const signed = (p: Position): number => p.direction * p.notional;

/** Net signed notional of an account on one leg of one market. */
function legNet(positions: readonly Position[], account: string, marketId: string, legId: string): number {
  let n = 0;
  for (const p of positions) if (p.account === account && p.marketId === marketId && p.legId === legId) n += signed(p);
  return n;
}

/** Gross notional an account holds on a subject (sums absolute per-leg nets, so a closed leg counts as zero). */
export function accountSubjectGross(positions: readonly Position[], account: string, subject: string): number {
  const legs = new Map<string, number>();
  for (const p of positions) {
    if (p.account !== account || p.subject !== subject) continue;
    const k = `${p.marketId}\u0000${p.legId}`;
    legs.set(k, (legs.get(k) ?? 0) + signed(p));
  }
  let g = 0;
  for (const v of legs.values()) g += Math.abs(v);
  return g;
}

/** Gross notional every account holds on a subject. */
export function houseSubjectGross(positions: readonly Position[], subject: string): number {
  const accounts = new Set(positions.filter((p) => p.subject === subject).map((p) => p.account));
  let g = 0;
  for (const a of accounts) g += accountSubjectGross(positions, a, subject);
  return g;
}

/** Legs of one market that an account holds a non-zero net on. */
function openLegs(positions: readonly Position[], account: string, marketId: string): string[] {
  const legs = new Set(positions.filter((p) => p.account === account && p.marketId === marketId).map((p) => p.legId));
  return [...legs].filter((l) => Math.abs(legNet(positions, account, marketId, l)) > 1e-9);
}

/** Would this trade be allowed? `existing` is every position already taken. Never mutates its input. */
export function checkTrade(existing: readonly Position[], trade: Position, caps: GateCaps): Verdict {
  if (!(trade.notional > 0) || !Number.isFinite(trade.notional)) return { ok: false, reason: "notional must be a positive number" };
  if (trade.direction !== 1 && trade.direction !== -1) return { ok: false, reason: "direction must be +1 or -1" };

  const before = legNet(existing, trade.account, trade.marketId, trade.legId);
  const after = before + signed(trade);

  // Rule 3a: no opposite directions on one leg unless it only reduces the existing position (a close).
  if (before !== 0 && Math.sign(before) !== Math.sign(after) && after !== 0) {
    return { ok: false, reason: "a trade may not flip a leg through zero; close it first, then open the other side" };
  }
  // Rule 3b: one leg per spread market.
  const others = openLegs(existing, trade.account, trade.marketId).filter((l) => l !== trade.legId);
  if (others.length > 0 && Math.abs(after) > 1e-9) {
    return { ok: false, reason: "this account already holds the other leg of this market; holding both legs is a hedge, close that leg first" };
  }

  const next = [...existing, trade];
  // Rule 1: per-account subject cap on GROSS exposure.
  if (accountSubjectGross(next, trade.account, trade.subject) > caps.perAccountSubject + 1e-9) {
    // A trade that only reduces exposure is always allowed, even when the account is over the cap.
    if (accountSubjectGross(next, trade.account, trade.subject) > accountSubjectGross(existing, trade.account, trade.subject) + 1e-9) {
      return { ok: false, reason: "this would exceed the per-account exposure cap on this subject (counted across every market naming them)" };
    }
  }
  // Rule 2: house cap on the subject.
  if (houseSubjectGross(next, trade.subject) > caps.houseSubject + 1e-9) {
    if (houseSubjectGross(next, trade.subject) > houseSubjectGross(existing, trade.subject) + 1e-9) {
      return { ok: false, reason: "this would exceed the house exposure cap on this subject" };
    }
  }
  return { ok: true };
}

/** Apply a trade if (and only if) the gate allows it. Returns the new position list; the input is untouched. */
export function applyTrade(existing: readonly Position[], trade: Position, caps: GateCaps): { positions: Position[]; verdict: Verdict } {
  const verdict = checkTrade(existing, trade, caps);
  return { positions: verdict.ok ? [...existing, trade] : [...existing], verdict };
}
