/**
 * MAD Gambit — ZEITGEIST slate (§2, §5.3).
 * ────────────────────────────────────────────────────────────────
 * The seed slate and its lifecycle. A slate is 2–3 slots; it reseeds at THE
 * TURNING (six legs = one lunar year) and conviction transmigrates across the
 * boundary through the succession matrix rather than being cashed out.
 *
 * THE CORPUS SHIPS WITH THE SLOT. Every slot carries the headlines it was built
 * from and the sources behind every figure. Two reasons, and the second is the
 * one that matters: a slate nobody can audit is one nobody should trade, and
 * `corpusLineage` in succession.ts scores the NEXT slate against these exact
 * strings — so the corpus is not documentation, it is the input to the matrix
 * that decides where conviction lands.
 *
 * Vintages are numbered by TURNING, not by Gregorian year — see lunar-legs.ts.
 * The 2026 slate is the seed vintage; sources are listed at ZEITGEIST §14.
 */
import type { FaceId } from "@/lib/persona-codex";
import { projectCappedSimplex, fromFaceRecord, toFaceRecord } from "@/lib/persona-simplex";

export interface TrendSlot {
  key: string;
  name: string;
  /** The persona question this slot exists to ask. */
  question: string;
  /** Headlines the trend was built from — the lineage corpus. */
  corpus: string[];
  /** Every figure in the corpus is traceable to one of these. */
  sources: string[];
  /** Prior five-face reading. Projected onto the capped simplex on read. */
  faceScores: Record<FaceId, number>;
}

/** VOI decides 2 or 3 live slots; the seed slate ships all three. */
export const MAX_SLOTS = 3;
export const MIN_SLOTS = 2;

export const SEED_SLATE: readonly TrendSlot[] = [
  {
    key: "authenticity_revolt",
    name: "THE AUTHENTICITY REVOLT",
    question: "SAINT or PROSTITUTE — conviction, or anti-AI positioning priced as a tactic?",
    corpus: [
      "Only 26% of consumers prefer generative-AI creator content, down from 60% in 2023",
      "Dove's pledge not to use AI-generated models won the Media Grand Prix at Cannes Lions 2025",
      "Aerie's 'No AI-generated bodies or people. Ever.' drew its most engaged Instagram response in a year",
      "New York's synthetic-performer law takes effect June 2026 with penalties for deceptive AI performers in advertising",
      "91% of consumers expect transparency about AI use in marketing",
      "Brands reintroduce imperfection — unpolished audio, natural pacing — as a humanity signal",
    ],
    sources: [
      "Digiday — creators' authenticity and 'messiness' are in high demand",
      "Influencer Marketing Factory — Creator Economy Report 2026",
      "Sprout Social — Influencer Marketing Trends for 2026",
    ],
    faceScores: {
      saint: 0.42,
      white_rice: 0.1,
      megalomaniac: 0.06,
      narcissist: 0.12,
      prostitute: 0.3,
    },
  },
  {
    key: "synthetic_influence",
    name: "SYNTHETIC INFLUENCE",
    question: "NARCISSIST or WHITE RICE — a self-regarding spectacle, or wallpaper that scales?",
    corpus: [
      "Virtual influencers compounding at 41.7% CAGR, moving from niche to a primary pillar of brand strategy",
      "AI influencers earned roughly $6B last year",
      "The global influencer market has passed $250B",
      "AI has produced a wave of faceless creators and fully automated accounts",
      "Slot I and Slot II are growing simultaneously — the contradiction is the trade",
    ],
    sources: [
      "Playbella — 2026 Global Report on Synthetic Influence",
      "CreatorIQ — Influencer Marketing Trends 2026",
      "Influencer Marketing Factory — Creator Economy Report 2026",
    ],
    faceScores: {
      saint: 0.05,
      white_rice: 0.3,
      megalomaniac: 0.12,
      narcissist: 0.41,
      prostitute: 0.12,
    },
  },
  {
    key: "commerce_floor",
    name: "THE COMMERCE FLOOR",
    question: "PROSTITUTE, unambiguously — the only live question is at what price",
    corpus: [
      "TikTok Shop reached $66B global GMV in 2025, projected $112.2B in 2026",
      "US TikTok Shop sales up 108% YoY to $15.82B",
      "1.8M active US merchant partners; $47.3B GMV across the first three quarters of 2026",
      "Creator earners up 146% YoY with 16,000+ creators at six-figure sales",
      "48.7% of creators earn under $10K and 76% of TikTok posts get under 1,000 views",
      "Mid-tier creators (100K–500K) hold 4–8% engagement against 1–2% for mega-creators",
    ],
    sources: [
      "eMarketer — how creators and platforms power shopping in 2026",
      "TikTok Shop Statistics 2026 — GMV, sellers, category benchmarks",
      "Influencer Marketing Factory — Creator Economy Report 2026",
    ],
    faceScores: {
      saint: 0.04,
      white_rice: 0.14,
      megalomaniac: 0.1,
      narcissist: 0.1,
      prostitute: 0.62,
    },
  },
];

/**
 * The face reading for a slot, projected onto the capped simplex.
 *
 * The stored priors are hand-authored and will not sum to exactly 1 forever —
 * projecting on read means a slate edited by a human can never put the ZEITGEIST
 * book into a state FIVE FACES considers impossible.
 */
export function slotFaceVector(slot: TrendSlot): Record<FaceId, number> {
  return toFaceRecord(projectCappedSimplex(fromFaceRecord(slot.faceScores)));
}

export function seedSlotByKey(key: string): TrendSlot | null {
  return SEED_SLATE.find((s) => s.key === key) ?? null;
}

/**
 * How many slots the next slate should run. VOI-driven: a third slot is only
 * worth its listing cost if the two survivors don't already explain the year.
 * `informationGain` is the marginal VOI of slot 3, in the same units the
 * bayesian/voi endpoint reports.
 */
export function slotCountForVintage(informationGain: number, threshold = 0.15): number {
  return Number.isFinite(informationGain) && informationGain >= threshold ? MAX_SLOTS : MIN_SLOTS;
}

/** The corpora, in slot order — the shape succession.ts wants. */
export function corporaOf(slots: readonly TrendSlot[]): string[][] {
  return slots.map((s) => s.corpus.slice());
}
