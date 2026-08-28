/**
 * MAD Gambit — THE PASEOME. Perp families 7 (Foresight) and 8 (Hindsight).
 * ══════════════════════════════════════════════════════════════════
 * Every other perp prices ONE NUMBER — a velocity, a credibility, a
 * persistence. These price A PATH. A what-if is a tree; a position rides one
 * branch of it; the tree never terminates, which is what makes it a perpetual
 * rather than a very long binary.
 *
 * The *paseome* is the complete set of paths — the whole tree. You only ever
 * TRADE THE FRONTIER: the sibling set hanging off the live node.
 *
 * ── THE TWO INSTRUMENTS ───────────────────────────────────────────
 * The split is not editorial. It falls exactly where the maths forces it, at
 * what can and cannot be settled.
 *
 *   FORESIGHT  "what if this happens"      — resolvable. The branch is taken
 *              at the leg boundary or it is not. PREDICTION class.
 *   HINDSIGHT  "what if this HAD happened" — unresolvable, and says so. You
 *              cannot settle a counterfactual: conditional prices reveal
 *              probabilistic relationships, not causal ones, and P(Y|X=x) is
 *              not "what Y would have been had X been set to x". So Hindsight
 *              does not price the counterfactual. It prices the PERSISTENCE
 *              of the belief about it, via the permanent/transitory split in
 *              `cgarchUpdate` — the same reading Five Faces already renders,
 *              pointed at a belief series. CONVICTION class.
 *
 * ── WHY EACH CONSTANT IS WHAT IT IS ───────────────────────────────
 * Founder calls, 27 Aug 2026 — recorded here rather than in prose so they
 * cannot drift:
 *
 *   REFUND ON UNTAKEN BRANCHES (Foresight). The known failure of conditional
 *   markets is that nobody funds a bet paying out only if a *separate* event
 *   also occurs. Refunding is what makes locking capital rational. It is also
 *   the harm answer: a refunded branch is not a loss, so it cannot be a
 *   near-miss — and near-misses are losses that recruit win-related striatal
 *   circuitry and measurably increase betting speed. Hindsight writes off
 *   nothing at all, because nothing there is ever unrealised.
 *
 *   FRONTIER WIDTH 3..5. Three keeps prices legible and liquidity deep; five
 *   matches the Five Faces simplex and the existing dial geometry. Past five
 *   the prices thin out until the top branch stops meaning anything.
 *
 *   GATED AUTHORSHIP. Open authorship grows the tree faster; gated authorship
 *   keeps artefact quality high enough that `m_meme` measures something real.
 *   Eligibility is a DISJUNCTION across two axes the engine deliberately keeps
 *   separate — VIP is the capital-side status and, per gambit-game-math.ts,
 *   "never a creator tier". Conflating them into one score would erase that.
 */
import {
  CREATOR_LADDER,
  VIP_STATUS_MIN_MADX,
  creatorStatus,
} from "@/lib/gambit-game-math";
import { cgarchUpdate } from "@/lib/bayesian-conviction";

/* ── 1 · THE FRONTIER ──────────────────────────────────────────── */

export const FRONTIER_MIN = 3;
export const FRONTIER_MAX = 5;

/** LMSR liquidity. Same b the traction rule is written against. */
export const FRONTIER_B = 1_200;

export type PaseomeSide = "foresight" | "hindsight";

export interface Branch {
  id: string;
  /** The one-line what-if. Irrealis mood is mandatory on Hindsight. */
  claim: string;
  /** Outstanding shares on this branch — the DL-LMSR q vector entry. */
  shares: number;
}

export interface PricedBranch extends Branch {
  /** Conditional probability given the parent node was reached. Σ over the
   *  frontier is exactly 1, by construction rather than by convention. */
  price: number;
}

export class FrontierError extends Error {}

/**
 * Price a frontier with DL-LMSR.
 *
 * This is the whole reason the tree cannot leak value at a fork:
 * `calculateDLLMSRPrice` returns e^(q_i/b) / Σ e^(q_j/b), so the vector sums
 * to 1 by construction. Feed these in as `TreeNode.conditionalProb` and
 * conservation stops being a rule anyone has to remember to enforce.
 *
 * Only the frontier is ever priced. Maintaining correct LMSR prices across a
 * whole combinatorial outcome space is intractable; pricing the sibling set at
 * the live node is O(n). Depth is a property of the recorded path, never of
 * the pricing problem.
 */
export function frontierPrices(branches: Branch[], b: number = FRONTIER_B): PricedBranch[] {
  if (!Array.isArray(branches) || branches.length < FRONTIER_MIN || branches.length > FRONTIER_MAX) {
    throw new FrontierError(
      `frontier must hold ${FRONTIER_MIN}..${FRONTIER_MAX} branches, got ${Array.isArray(branches) ? branches.length : 0}`,
    );
  }
  if (!(b > 0)) throw new FrontierError("liquidity b must be > 0");

  const q = branches.map((x) => (Number.isFinite(x.shares) ? x.shares : 0));

  // LOG-SUM-EXP, not the naive softmax.
  //
  // `calculateDLLMSRPrice` computes e^(q_i/b) / Σ e^(q_j/b) directly. A double
  // overflows to Infinity once q/b passes ~709, which at b = 1200 is roughly
  // 851,000 shares on a single branch — reachable in a deep book, not a
  // theoretical edge. Every price then came back NaN and the whole frontier
  // became unpriceable.
  //
  // Subtracting the maximum before exponentiating is mathematically identical
  // (the constant cancels in the ratio) and cannot overflow, because the
  // largest exponent is now exactly 0:
  //
  //   e^(q_i/b) / Σ e^(q_j/b)  ==  e^(q_i/b − m) / Σ e^(q_j/b − m),  m = max(q/b)
  //
  // The shared engine's `calculateDLLMSRPrice` is left alone deliberately: it
  // is canon-locked and used by the binary book, where q is bounded far lower.
  let m = -Infinity;
  for (let i = 0; i < q.length; i++) {
    const z = q[i] / b;
    if (z > m) m = z;
  }
  if (!Number.isFinite(m)) throw new FrontierError("degenerate frontier — non-finite share vector");

  const exps: number[] = [];
  let total = 0;
  for (let i = 0; i < q.length; i++) {
    const e = Math.exp(q[i] / b - m);
    exps.push(e);
    total += e;
  }
  if (!(total > 0) || !Number.isFinite(total)) {
    throw new FrontierError("degenerate frontier — prices summed to zero");
  }

  return branches.map((br, i) => ({ ...br, price: exps[i] / total }));
}

/** Σ of a frontier's prices. Should be 1 to floating-point tolerance. */
export function frontierSum(priced: PricedBranch[]): number {
  let s = 0;
  for (let i = 0; i < priced.length; i++) s += priced[i].price;
  return s;
}

/**
 * A position's price is the PRODUCT of the branch prices along its path.
 * Deepening a path multiplies the discount, so long-shot what-ifs get cheap on
 * their own — there is no separate long-shot parameter to tune.
 */
export function pathPrice(branchPrices: number[]): number {
  if (!Array.isArray(branchPrices) || branchPrices.length === 0) return 0;
  let p = 1;
  for (let i = 0; i < branchPrices.length; i++) {
    const x = branchPrices[i];
    if (!Number.isFinite(x) || x <= 0) return 0;
    p *= x;
  }
  return p;
}

/* ── 2 · THE KNIFE EDGE ────────────────────────────────────────── */

/**
 * Distance from maximum uncertainty. Dopamine carries two separable signals:
 * a phasic burst coding prediction error, monotonic in p, and a slower
 * sustained ramp coding UNCERTAINTY, which is maximal at p = 0.5 and falls off
 * toward both ends.
 *
 * A prediction market wants traders in exactly that place — highest
 * information value, widest spread. So the deck's default ranking is this,
 * not volume. Sorting by volume points away from the information frontier.
 */
export function knifeEdgeDistance(p: number): number {
  const x = Number.isFinite(p) ? Math.min(1, Math.max(0, p)) : 0;
  return Math.abs(x - 0.5);
}

/** Ascending by distance from p = 0.5 — the sharpest edge first. */
export function rankByKnifeEdge<T extends { price: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => knifeEdgeDistance(a.price) - knifeEdgeDistance(b.price));
}

/* ── 3 · MEMETIC FITNESS ───────────────────────────────────────── */

/**
 * Concepts violating EXACTLY ONE ontological expectation are recalled and
 * retransmitted best. Zero violations is just news; two or more is
 * incomprehensible. The optimum is a minority of counterintuitive elements
 * against a majority of ordinary ones, and the effect replicates
 * cross-culturally.
 *
 * So memetic fitness is a countable quantity with an optimum at one, which is
 * what `m_meme` in MADConv has always been reaching for.
 */
export const MCI_OPTIMUM = 1;

/** Categories of expectation a what-if can violate. One is the target. */
const VIOLATION_MARKERS: { kind: string; re: RegExp }[] = [
  { kind: "physics", re: /\b(?:levitat|teleport|reverse[sd]? time|float(?:s|ed|ing)?\s+away|walks? through)\b/i },
  { kind: "biology", re: /\b(?:immortal|undead|never ages?|regrow[sn]?|sentient (?:plant|rock|toaster))\b/i },
  { kind: "agency", re: /\b(?:the (?:algorithm|market|building|paperwork)) (?:decides?|refuses?|resigns?|apologis|apologiz)/i },
  { kind: "scale", re: /\b(?:every (?:single )?(?:person|country|newspaper)|all \d+ billion|the entire (?:planet|internet))\b/i },
  { kind: "causality", re: /\b(?:caused? (?:itself|by nothing)|before it happened|retroactively)\b/i },
  { kind: "identity", re: /\b(?:swapp?ed (?:bodies|places)|becomes? (?:a|the) (?:committee|spreadsheet|weather))\b/i },
];

export interface MciReading {
  /** How many distinct expectation categories the line violates. */
  violations: number;
  kinds: string[];
  /** 0..1 — peaks at exactly one violation. */
  fitness: number;
}

export function mciScore(text: string): MciReading {
  const t = (text ?? "").trim();
  const kinds: string[] = [];
  if (t) {
    for (let i = 0; i < VIOLATION_MARKERS.length; i++) {
      if (VIOLATION_MARKERS[i].re.test(t)) kinds.push(VIOLATION_MARKERS[i].kind);
    }
  }
  const violations = kinds.length;
  // Triangular around the optimum: 0 → 0.35 (forgettable but coherent),
  // 1 → 1.0, 2 → 0.5, 3+ → decaying toward noise.
  let fitness: number;
  if (violations === 0) fitness = 0.35;
  else if (violations === MCI_OPTIMUM) fitness = 1;
  else fitness = Math.max(0.1, 1 / (1 + (violations - MCI_OPTIMUM)));
  return { violations, kinds, fitness };
}

/**
 * The `m_meme` term for `calculateConviction`. Centred on 1 so an ordinary
 * line is neutral and only a genuinely well-formed what-if is rewarded.
 * Bounded so memetics can never dominate time-held or capital.
 */
export const MEME_MULT_MIN = 0.85;
export const MEME_MULT_MAX = 1.35;

export function memeMultiplier(text: string): number {
  const f = mciScore(text).fitness;
  return MEME_MULT_MIN + (MEME_MULT_MAX - MEME_MULT_MIN) * f;
}

/* ── 4 · THE IRREALIS CONSTRAINT ───────────────────────────────── */

/**
 * A counterfactual is a violation that is BENIGN BY GRAMMAR — benign because
 * it did not happen. Humour needs a violation that is simultaneously benign,
 * and psychological distance is one of the three routes to benign. Hindsight
 * gets that condition free, from the verb tense.
 *
 * Which is why the mood is a SCHEMA CONSTRAINT and not a style guide: a
 * Hindsight title that asserts rather than supposes has lost the only thing
 * making it benign, and what is left is a claim about a real party.
 */
const IRREALIS = /\b(?:had|would(?:n't| not)?|could(?:n't| not)?|might|were|if|imagine|suppose|what if|hypothetically)\b/i;

export function hasIrrealisMood(claim: string): boolean {
  return IRREALIS.test((claim ?? "").trim());
}

/** Distance rises with remove from the real, so benignity rises with depth:
 *  branch 1 is edgy, branch 4 is absurd and therefore safe. The safety
 *  gradient is the tree structure — nothing extra to build. */
export function benignityAtDepth(depth: number): number {
  const d = Number.isFinite(depth) && depth > 0 ? depth : 0;
  return Math.min(1, 0.4 + 0.15 * d);
}

/* ── 5 · SETTLEMENT ────────────────────────────────────────────── */

export type BranchOutcome = "taken" | "refunded" | "carried";

export interface FrontierSettlement {
  takenId: string | null;
  outcomes: { id: string; outcome: BranchOutcome }[];
}

/**
 * Settle a frontier at a leg boundary.
 *
 *   FORESIGHT — one branch is taken; every sibling is REFUNDED. Not written
 *   off, not "so close": refunded. That is the founder call and it is also
 *   what stops the roll from manufacturing a near-miss.
 *   HINDSIGHT — nothing settles. Every branch is CARRIED. The market never
 *   resolves, so there is no taken branch and nothing to refund.
 */
export function settleFrontier(
  side: PaseomeSide,
  priced: PricedBranch[],
  takenId: string | null,
): FrontierSettlement {
  if (side === "hindsight") {
    return { takenId: null, outcomes: priced.map((b) => ({ id: b.id, outcome: "carried" as const })) };
  }
  const taken = priced.some((b) => b.id === takenId) ? takenId : null;
  return {
    takenId: taken,
    outcomes: priced.map((b) => ({
      id: b.id,
      outcome: b.id === taken ? ("taken" as const) : ("refunded" as const),
    })),
  };
}

/**
 * Hindsight's headline print. THE DIVERGENCE between what the culture has
 * permanently absorbed about a counterfactual and what is transient churn.
 * Positive means the belief is sticking.
 */
export function hindsightDivergence(params: {
  prevVar: number;
  prevPermanent: number;
  epsSq: number;
}): { divergence: number; permanent: number; transitory: number } {
  const { variance, permanent } = cgarchUpdate(params);
  const transitory = Math.max(0, variance - permanent);
  return { divergence: permanent - transitory, permanent, transitory };
}

/* ── 6 · AUTHORSHIP ────────────────────────────────────────────── */

/** The creator rung at which branch authorship unlocks. */
export const AUTHOR_MIN_STATUS = "MinorCreator";

export interface AuthorEligibility {
  eligible: boolean;
  /** Which axis granted it — both are recorded, neither is merged. */
  viaCapital: boolean;
  viaCreator: boolean;
  status: string;
}

/**
 * May this account author a new branch?
 *
 * A DISJUNCTION over two axes the engine keeps deliberately separate: VIP is
 * capital-side (Shield 60%) and gambit-game-math.ts states plainly it is
 * "never a creator tier". Collapsing them into a single eligibility score
 * would destroy that distinction, so both are evaluated and both reported.
 */
export function canAuthorBranch(input: {
  madxBalance: number;
  tractionedMarkets: number;
  followers: number;
}): AuthorEligibility {
  const bal = Number.isFinite(input.madxBalance) ? input.madxBalance : 0;
  const viaCapital = bal >= VIP_STATUS_MIN_MADX;

  const status = creatorStatus(
    Number.isFinite(input.tractionedMarkets) ? input.tractionedMarkets : 0,
    Number.isFinite(input.followers) ? input.followers : 0,
  );
  const minIdx = CREATOR_LADDER.findIndex((r) => r.status === AUTHOR_MIN_STATUS);
  const haveIdx = CREATOR_LADDER.findIndex((r) => r.status === status.status);
  const viaCreator = haveIdx >= minIdx && minIdx >= 0;

  return { eligible: viaCapital || viaCreator, viaCapital, viaCreator, status: status.status };
}
