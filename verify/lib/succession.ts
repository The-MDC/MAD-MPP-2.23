/**
 * MAD Gambit — THE SUCCESSION MATRIX (ZEITGEIST §5.1)
 * ------------------------------------------------------------------
 * A perpetual whose outcome set changes cannot simply settle and reopen — that
 * would be a series of annual markets wearing a perpetual's clothes. THE TURNING
 * is the mechanism that makes a mutable state space coherent.
 *
 * S[i][j] is the share of retiring trend i's conviction that inherits into new
 * trend j. It is MEASURED, not decreed:
 *
 *   LINEAGE  — cross-source corpus overlap (heat-score's clustering rule: two
 *              headlines are "the same story" when they share >= 2 significant
 *              tokens). The trend engine already exists; it was simply built for
 *              headline ranking.
 *   CROWD    — quadratic vote, sqrt(stake) capped at 240 (votingPower).
 *   BLEND    — S = w_m*L + w_v*V, then ROW-NORMALISED.
 *
 * FOUNDER DECISION (Aug 2026): CROWD-LED, w_m = 0.3 / w_v = 0.7.
 *
 * Why not w_v = 1.0. The Turning is the single highest-manipulation-incentive
 * moment in the product. A purely voted succession lets whoever organises best
 * redirect the entire inherited conviction pool into a trend they are positioned
 * in. Quadratic voting makes that expensive but not impossible; the 0.3 corpus
 * term makes it also have to be PLAUSIBLE. Vote decides where conviction goes;
 * measurement keeps it inside the realm of trends that actually share a story.
 *
 * THE INVARIANT: row-normalisation means CONVICTION IS CONSERVED across a
 * Turning. Nothing is destroyed at a reseed, nothing is minted from nothing, and
 * no position is ever force-settled.
 */

import { votingPower, quadraticMatch } from "@/lib/gambit-game-math";

/** Founder-locked blend weights. Crowd-led, with a measurement floor. */
export const W_MEASURED = 0.3;
export const W_VOTED = 0.7;

/** Below this, a token is too common to signal shared lineage. */
const MIN_TOKEN_LENGTH = 4;
/** heat-score's rule: >= 2 shared significant tokens means "the same story". */
const SHARED_TOKEN_THRESHOLD = 2;

const STOP = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "for", "with",
  "at", "by", "from", "as", "is", "are", "was", "were", "be", "been", "that",
  "this", "it", "its", "into", "over", "after", "then", "than", "who", "how",
  "why", "what", "when", "your", "you", "his", "her", "their", "they", "not",
]);

/** Significant lowercase tokens, deduped. Mirrors heat-score.ts#tokenize. */
export function significantTokens(text: string): string[] {
  const words = (text || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/);
  const seen: Record<string, true> = {};
  const out: string[] = [];
  for (const w of words) {
    if (w.length >= MIN_TOKEN_LENGTH && !STOP.has(w) && !seen[w]) {
      seen[w] = true;
      out.push(w);
    }
  }
  return out;
}

/**
 * Measured lineage between two corpora, in [0, 1].
 *
 * The share of the retiring trend's documents that have a "same story" partner
 * in the candidate's corpus. Asymmetric on purpose: we are asking how much of
 * the OLD trend carries forward, not how similar the two are in general.
 */
export function corpusLineage(retiring: readonly string[], candidate: readonly string[]): number {
  if (retiring.length === 0 || candidate.length === 0) return 0;
  const candidateSets = candidate.map((d) => new Set(significantTokens(d)));

  let matched = 0;
  for (const doc of retiring) {
    const toks = significantTokens(doc);
    for (const set of candidateSets) {
      let shared = 0;
      for (const t of toks) {
        if (set.has(t)) {
          shared++;
          if (shared >= SHARED_TOKEN_THRESHOLD) break;
        }
      }
      if (shared >= SHARED_TOKEN_THRESHOLD) {
        matched++;
        break;
      }
    }
  }
  return matched / retiring.length;
}

export interface SuccessionVote {
  /** Voter's staked $MADx — converted to sqrt-capped voting power. */
  stake: number;
  /** Index of the candidate this voter backs. */
  candidateIndex: number;
}

export interface SuccessionInput {
  /** Corpora of the retiring slots, in slot order. */
  retiringCorpora: readonly (readonly string[])[];
  /** Corpora of the candidate slots for the new slate. */
  candidateCorpora: readonly (readonly string[])[];
  /** Votes per retiring slot: votes[i] are the votes cast by slot i's holders. */
  votes?: readonly (readonly SuccessionVote[])[];
  wMeasured?: number;
  wVoted?: number;
}

export interface SuccessionMatrix {
  /** S — rows are retiring slots, columns are candidates. Each row sums to 1. */
  matrix: number[][];
  /** Row-wise measured-lineage component, before blending. */
  measured: number[][];
  /** Row-wise quadratic-vote component, before blending. */
  voted: number[][];
  /** True when every row sums to 1 within tolerance — conviction conserved. */
  conserved: boolean;
}

/** Normalise a row to sum 1. An all-zero row becomes uniform (never destroyed). */
function normaliseRow(row: number[]): number[] {
  const total = row.reduce((a, b) => a + b, 0);
  if (total > 0) return row.map((x) => x / total);
  // No lineage and no votes: spread evenly rather than stranding the conviction.
  return row.map(() => 1 / Math.max(1, row.length));
}

/**
 * Build S. Row-normalised, so total conviction entering a Turning equals total
 * conviction leaving it — the invariant the whole mechanism rests on.
 */
export function buildSuccessionMatrix(input: SuccessionInput): SuccessionMatrix {
  const wm = Number.isFinite(input.wMeasured as number) ? (input.wMeasured as number) : W_MEASURED;
  const wv = Number.isFinite(input.wVoted as number) ? (input.wVoted as number) : W_VOTED;
  const nOld = input.retiringCorpora.length;
  const nNew = input.candidateCorpora.length;

  const measured: number[][] = [];
  const voted: number[][] = [];
  const matrix: number[][] = [];

  for (let i = 0; i < nOld; i++) {
    // Measured lineage against each candidate.
    const mRow = input.candidateCorpora.map((cand) =>
      corpusLineage(input.retiringCorpora[i], cand),
    );

    // Quadratic vote: sum sqrt-capped power per candidate, then quadraticMatch
    // so many small holders outweigh one whale.
    const contributionsPerCandidate: number[][] = Array.from({ length: nNew }, () => []);
    for (const v of input.votes?.[i] ?? []) {
      const idx = v.candidateIndex;
      if (idx >= 0 && idx < nNew) contributionsPerCandidate[idx].push(votingPower(v.stake));
    }
    const vRow = contributionsPerCandidate.map((c) => (c.length ? quadraticMatch(c) : 0));

    const mNorm = normaliseRow(mRow.slice());
    const vNorm = normaliseRow(vRow.slice());

    measured.push(mNorm);
    voted.push(vNorm);
    matrix.push(normaliseRow(mNorm.map((m, j) => wm * m + wv * vNorm[j])));
  }

  const conserved = matrix.every(
    (row) => Math.abs(row.reduce((a, b) => a + b, 0) - 1) < 1e-9,
  );

  return { matrix, measured, voted, conserved };
}

/**
 * Transmigrate conviction across a Turning.
 *
 * `holdings[i]` is the conviction sitting on retiring slot i. Returns the
 * conviction landing on each new slot. Total in === total out, always.
 */
export function transmigrate(holdings: readonly number[], s: SuccessionMatrix): number[] {
  const nNew = s.matrix[0]?.length ?? 0;
  const out = new Array<number>(nNew).fill(0);
  s.matrix.forEach((row, i) => {
    const held = Number.isFinite(holdings[i]) ? holdings[i] : 0;
    row.forEach((share, j) => {
      out[j] += held * share;
    });
  });
  return out;
}

/** Total conviction is conserved across a Turning, to within floating tolerance. */
export function conservationError(
  holdings: readonly number[],
  landed: readonly number[],
): number {
  const before = holdings.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
  const after = landed.reduce((a, b) => a + b, 0);
  return Math.abs(before - after);
}
