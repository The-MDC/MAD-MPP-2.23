/**
 * MAD Gambit — headline Heat Score (deterministic, dependency-free).
 * ------------------------------------------------------------------
 * Ranks satirical headlines by measured "traffic value" so the carousel
 * auto-surfaces the highest-velocity stories (worksheet: "automated in showing
 * top headlines based on online traffic counts"). Every ticker/dopamine item
 * that shows a Heat number links to an explainer describing how it's measured.
 *
 * WHAT IS MEASURED vs ESTIMATED (be honest — this drives the explainer popup):
 *   MEASURED from the live scrape:
 *     • crossSource — how many DISTINCT publishers ran a similar headline. This
 *       is the single strongest virality signal we can compute for free: when
 *       TMZ + Page Six + People all run the same story, it's hot. (The founder's
 *       "how many times a headline appears across similar publishers" ask.)
 *     • velocity   — freshness from the item's publish time (24h half-life).
 *     • authority  — the publisher's trust_score.
 *     • virality   — the publisher's audience/spread propensity (virality_weight).
 *     • satire     — the Z-Liar satire score of the rewrite.
 *   ESTIMATED (no free API exposes per-post likes/comments/views over RSS):
 *     • engagementEst — a deterministic proxy for likes+comments+views built
 *       from the measured signals above. Clearly labeled "est." in the UI until
 *       real social endpoints (Reddit/X/YouTube) are connected. When those land,
 *       swap engagementEst for the live number; the composite weights stay.
 */

export interface HeatInput {
  id: string;                 // stable id (link || title) — dedupe + jitter seed
  sourceId: string;           // publisher id; DISTINCT ids drive crossSource
  title: string;              // real headline (for cross-source clustering)
  publishedMs: number | null; // epoch ms, or null when the feed omits a date
  trustScore: number;         // publisher trust_score (1–10)
  viralityWeight: number;     // publisher virality_weight (~1.0–3.0)
  satireScore: number;        // Z-Liar satire score (0–100)
}

export interface HeatSignals {
  crossSource: number;    // distinct publishers carrying a similar headline (count)
  velocity: number;       // 0–100 recency freshness
  authority: number;      // 0–100 publisher trust
  virality: number;       // 0–100 publisher spread propensity
  satire: number;         // 0–100 Z-Liar satire
  engagementEst: number;  // 0–100 ESTIMATED likes/comments/views proxy
}

export interface HeatResult {
  heat: number;           // 0–100 composite "Heat / Value"
  signals: HeatSignals;
}

/** Composite weights. Sum = 1. crossSource + engagement carry the most, per the
 *  brief's emphasis on cross-publisher pickup and engagement counts. */
export const HEAT_WEIGHTS = {
  crossSource: 0.3,
  engagementEst: 0.25,
  virality: 0.15,
  velocity: 0.15,
  satire: 0.1,
  authority: 0.05,
} as const;

const STOP = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "for", "with",
  "at", "by", "from", "as", "is", "are", "was", "were", "be", "been", "that",
  "this", "it", "its", "into", "over", "after", "then", "than", "who", "how",
  "why", "what", "when", "your", "you", "his", "her", "their", "they", "not",
]);

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

/** Stable 31-based hash → non-negative int (deterministic jitter seed). */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Significant lowercase tokens (length ≥ 4, non-stopword) for clustering. */
function tokenize(title: string): Set<string> {
  return new Set(
    (title || "")
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !STOP.has(w)),
  );
}

/** Two headlines are "the same story" when they share ≥ 2 significant tokens. */
function similar(a: Set<string>, b: Set<string>): boolean {
  let shared = 0;
  for (const t of a) if (b.has(t)) { shared++; if (shared >= 2) return true; }
  return false;
}

/** velocity: 24h half-life freshness. Null date → neutral 50. */
function velocityOf(publishedMs: number | null, nowMs: number): number {
  if (!publishedMs || !Number.isFinite(publishedMs)) return 50;
  const ageH = Math.max(0, (nowMs - publishedMs) / 3_600_000);
  return clamp(100 * Math.pow(0.5, ageH / 24));
}

/**
 * Score an entire pool at once so crossSource can count real cross-publisher
 * pickup. Returns results keyed by input id, in the same order as `pool`.
 */
export function computeHeatForPool(pool: HeatInput[], nowMs = Date.now()): HeatResult[] {
  const toks = pool.map((p) => tokenize(p.title));

  return pool.map((item, i) => {
    // crossSource: distinct publishers whose headline matches this one (incl. self).
    const publishers = new Set<string>([item.sourceId]);
    for (let j = 0; j < pool.length; j++) {
      if (j === i) continue;
      if (similar(toks[i], toks[j])) publishers.add(pool[j].sourceId);
    }
    const crossSource = publishers.size;

    const velocity = velocityOf(item.publishedMs, nowMs);
    const authority = clamp((item.trustScore / 10) * 100);
    const virality = clamp(((item.viralityWeight - 1) / 2) * 100); // 1.0→0, 3.0→100
    const satire = clamp(item.satireScore);
    const crossNorm = clamp(crossSource * 25); // 4+ publishers ⇒ maxed

    // Estimated engagement (likes+comments+views proxy). Deterministic: measured
    // signals + a small stable jitter so equal inputs don't tie flat. Labeled
    // "est." wherever shown until a live social API replaces it.
    const jitter = (hash(item.id) % 15) - 7; // ±7
    const engagementEst = clamp(0.45 * virality + 0.3 * crossNorm + 0.25 * velocity + jitter);

    const heat = clamp(
      Math.round(
        HEAT_WEIGHTS.crossSource * crossNorm +
          HEAT_WEIGHTS.engagementEst * engagementEst +
          HEAT_WEIGHTS.virality * virality +
          HEAT_WEIGHTS.velocity * velocity +
          HEAT_WEIGHTS.satire * satire +
          HEAT_WEIGHTS.authority * authority,
      ),
    );

    return {
      heat,
      signals: { crossSource, velocity: Math.round(velocity), authority: Math.round(authority), virality: Math.round(virality), satire: Math.round(satire), engagementEst: Math.round(engagementEst) },
    };
  });
}

/** Per-signal copy for the explainer popup: label, measured|estimated, blurb. */
export const HEAT_EXPLAINER: {
  title: string;
  blurb: string;
  signals: { key: keyof HeatSignals; label: string; kind: "measured" | "estimated"; note: string }[];
} = {
  title: "How Heat is measured",
  blurb:
    "Heat ranks each headline by its real online traffic value — how far and how fast a story is spreading — so the wire auto-surfaces what's hot. Signals marked “measured” come from the live scrape; “est.” is an algorithmic proxy until social APIs are connected.",
  signals: [
    { key: "crossSource", label: "Cross-publisher pickup", kind: "measured", note: "How many distinct publishers ran a similar headline — the strongest free virality signal." },
    { key: "engagementEst", label: "Engagement (likes · comments · views)", kind: "estimated", note: "Estimated from the measured signals until Reddit/X/YouTube counts are wired in." },
    { key: "virality", label: "Publisher spread", kind: "measured", note: "The source's audience reach / virality weight." },
    { key: "velocity", label: "Freshness", kind: "measured", note: "Recency of the story on a 24-hour half-life." },
    { key: "satire", label: "Z-Liar satire", kind: "measured", note: "How roast-worthy the satirical rewrite scored." },
    { key: "authority", label: "Source authority", kind: "measured", note: "The publisher's trust score." },
  ],
};
