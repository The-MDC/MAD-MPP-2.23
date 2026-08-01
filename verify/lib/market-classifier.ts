/**
 * MAD Gambit — market classifier + proposal generator.
 * ------------------------------------------------------------------
 * Turns a scandal signal (a headline + optional GDELT scores) into a classified,
 * auto-generated MarketProposal. This is the codeable core of the "dual-ingestion
 * → auto market creation" idea: deterministic, heuristic classification (no ML
 * training in this app), composing the EXISTING math — `zLiarMeter`
 * (gambit-game-math) and `perpTriggerProbability` (gdelt) — plus the lexicon
 * sentiment scorer.
 *
 * Market taxonomy (by resolution horizon + structure):
 *   progression — short structured arc (≤ ~45d, A→B→C milestones)
 *   saga        — long horizon (weeks → 2yr+), evolving narrative
 *   zliar       — satire/virality-filtered specialty (high Z-Liar + bettable)
 *   perp        — continuous / no clear terminal date (high perp trigger)
 *
 * `type` is the PRIMARY classification; `zliarEligible` / `perpEligible` are
 * secondary tags so a Saga can still surface a Z-Liar or Perp facet.
 */
import { scoreSentiment, type Sentiment } from "@/lib/sentiment";
import { zLiarMeter, PLATFORM } from "@/lib/gambit-game-math";
import { perpTriggerProbability } from "@/lib/gdelt";

export type MarketType = "progression" | "saga" | "zliar" | "perp" | "gossipcop";

// GossipCop = the celebrity/entertainment historical-vault perp family. A long-arc
// gossip storyline tracked continuously (never a clean binary resolution).
const GOSSIP_TERMS = [
  "celebrity", "gossip", "royal", "tabloid", "breakup", "divorce", "feud", "affair",
  "dating", "split", "scandal", "drama", "rumor", "cheating", "meltdown", "hollywood",
];

function isGossip(headline: string): boolean {
  const t = (headline ?? "").toLowerCase();
  return GOSSIP_TERMS.some((w) => t.includes(w));
}

export interface Signal {
  headline: string;
  scandalVelocity?: number; // from gdelt scandalVelocity()
  perpProbability?: number; // precomputed gdelt perp probability, if available
  personMatches?: number; // # whitelisted celebrities in the record
  themeScandalWeight?: number; // 0..1
  corroboration?: number; // 0..1 — source/social corroboration
}

export interface MarketProposal {
  type: MarketType;
  zliarEligible: boolean;
  perpEligible: boolean;
  title: string;
  headline: string;
  horizonDays: number;
  resolutionCriteria: string;
  zliarScore: number; // 0..100
  perpProbability: number; // 0..1
  sentiment: Sentiment;
  convictionPrior: number; // 0..1 suggested starting conviction
  score: number; // 0..1 overall rank for "Markets for Today"
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Heuristic resolution-horizon estimate (days) from time-language in the headline. */
export function estimateHorizonDays(headline: string): number {
  const t = (headline ?? "").toLowerCase();
  if (/\b(year|years|long-?running|empire|era|decade|saga|for good|permanent)\b/.test(t)) return 540;
  if (/\b(month|months|quarter|q[1-4]|by end of year|season)\b/.test(t)) return 120;
  if (/\b(week|weeks)\b/.test(t)) return 21;
  if (/\b(day|days|today|tomorrow|this week|soon|imminent|hours|breaking)\b/.test(t)) return 7;
  return 30;
}

function horizonLabel(days: number): string {
  if (days >= 365) return "12+ months";
  if (days >= 90) return "a few months";
  if (days >= 14) return "a few weeks";
  return "days";
}

function buildTitle(headline: string, type: MarketType, days: number): string {
  const h = headline.length > 90 ? `${headline.slice(0, 87)}…` : headline;
  switch (type) {
    case "gossipcop":
      return `Gossip Perp: is "${h}" a forever-saga? (continuous)`;
    case "perp":
      return `Ongoing: "${h}" — chaos index (perpetual)`;
    case "saga":
      return `Saga: does "${h}" unfold over ${horizonLabel(days)}?`;
    case "zliar":
      return `Z-Liar: how real is "${h}"?`;
    default:
      return `Will "${h}" escalate within ${horizonLabel(days)}?`;
  }
}

function buildResolution(type: MarketType, days: number): string {
  switch (type) {
    case "gossipcop":
      return "Continuous MAD Gossip perp — historical-pattern (GossipCop-style) tracked; positions roll while the saga stays live.";
    case "perp":
      return "Continuous market — no fixed end; positions roll while the storyline stays live.";
    case "saga":
      return `Resolves on a defined milestone within ~${days} days; the saga may spawn follow-on legs.`;
    case "zliar":
      return "Resolves on independent corroboration of the claim's truthfulness within the window.";
    default:
      return `Resolves on the next structured milestone (A→B→C) within ~${days} days.`;
  }
}

/** Classify one signal into a ranked, auto-generated MarketProposal. */
export function classifySignal(sig: Signal): MarketProposal {
  const headline = sig.headline ?? "";
  const sentiment = scoreSentiment(headline);
  const horizonDays = estimateHorizonDays(headline);
  const corroboration = clamp01(sig.corroboration ?? 0.4);

  const zliar = zLiarMeter({
    narrativeVariance: sentiment.intensity,
    sourceCredibility: corroboration,
    corroboration,
  });

  const perpProbability = clamp01(
    sig.perpProbability ??
      perpTriggerProbability({
        personMatches: sig.personMatches ?? 1,
        themeScandalWeight: sig.themeScandalWeight ?? 0.5,
        scandalVelocity: sig.scandalVelocity ?? 0,
      }),
  );

  const zliarEligible = zliar.score >= 60 && sentiment.dopaminePotential;
  const perpEligible = perpProbability >= PLATFORM.PERP_TRIGGER_THRESHOLD;

  // Primary type — priority order documented above. A long-arc, celebrity/gossip
  // perp graduates to the GossipCop class (its own carousel + dashboard surface).
  let type: MarketType;
  if (perpEligible && horizonDays >= 365 && isGossip(headline)) type = "gossipcop";
  else if (perpEligible && horizonDays >= 365) type = "perp";
  else if (zliarEligible && horizonDays <= 45) type = "zliar";
  else if (horizonDays > 60) type = "saga";
  else type = "progression";

  const convictionPrior = clamp01(0.4 + 0.3 * sentiment.intensity + 0.2 * perpProbability);
  const score = round2(0.4 * (zliar.score / 100) + 0.35 * perpProbability + 0.25 * sentiment.intensity);

  return {
    type,
    zliarEligible,
    perpEligible,
    title: buildTitle(headline, type, horizonDays),
    headline,
    horizonDays,
    resolutionCriteria: buildResolution(type, horizonDays),
    zliarScore: round2(zliar.score),
    perpProbability: round2(perpProbability),
    sentiment,
    convictionPrior: round2(convictionPrior),
    score,
  };
}

/** Classify + rank a batch of signals for a "Markets for Today" surface. */
export function proposalsForToday(signals: Signal[], limit = 12): MarketProposal[] {
  return signals
    .filter((s) => s.headline && s.headline.trim().length > 0)
    .map(classifySignal)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
