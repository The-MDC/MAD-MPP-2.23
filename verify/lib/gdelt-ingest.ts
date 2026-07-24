/**
 * MAD Gambit — GDELT live ingest (Phase 1 of the dual-ingestion engine).
 * ------------------------------------------------------------------
 * Points a firehose at the planet's celebrity mayhem (GDELT DOC 2.0), skims the
 * spiciest headlines, runs them through the existing scandal math + the lexicon
 * sentiment scorer, and drops the survivors into `gdelt_signals` — where the
 * Progression / Saga / Z-Liar / Perp classifier turns them into Markets for Today.
 *
 * Honest caveat: DOC ArtList hands us headline + url, not GCAM emotion vectors,
 * so scandal-velocity here is a lexicon-intensity proxy. A GKG/GCAM upgrade (real
 * emotional physics) is Phase 1b — flagged, not faked.
 */
import type { Pool } from "pg";
import { perpTriggerProbability } from "@/lib/gdelt";
import { scoreSentiment } from "@/lib/sentiment";
import { getWhitelist } from "@/lib/whitelist";

const GDELT_DOC = "https://api.gdeltproject.org/api/v2/doc/doc";

// The house query: famous-people chaos, in English. Overridable via GDELT_QUERY.
const DEFAULT_QUERY =
  '(feud OR scandal OR breakup OR divorce OR arrest OR lawsuit OR fired OR cheating OR meltdown OR "clap back") ' +
  "(celebrity OR hollywood OR star OR singer OR actor OR influencer OR rapper OR model) sourcelang:english";

const SCANDAL_KEYWORDS = [
  "scandal", "feud", "arrest", "divorce", "lawsuit", "fraud", "affair", "leak", "cheat",
  "split", "controversy", "indict", "resign", "fired", "breakup", "cancel", "meltdown",
];

export interface GdeltArticle {
  url: string;
  title: string;
  seendate?: string;
  domain?: string;
}

export interface ScoredSignal {
  headline: string;
  url: string;
  persons: string[];
  themes: string[];
  personMatches: number;
  themeScandalWeight: number;
  scandalVelocity: number;
  perpProbability: number;
}

/** Fetch recent entertainment/scandal articles from GDELT DOC 2.0 (ArtList mode). */
export async function fetchGdeltDoc(opts?: {
  query?: string;
  timespan?: string;
  maxrecords?: number;
}): Promise<GdeltArticle[]> {
  const params = new URLSearchParams({
    query: opts?.query ?? process.env.GDELT_QUERY ?? DEFAULT_QUERY,
    mode: "ArtList",
    format: "json",
    sort: "DateDesc",
    maxrecords: String(Math.min(250, Math.max(1, opts?.maxrecords ?? 75))),
    timespan: opts?.timespan ?? "1h",
  });
  const res = await fetch(`${GDELT_DOC}?${params.toString()}`, {
    headers: { "user-agent": "MADGambit-ScandalScraper/1.0" },
  });
  if (!res.ok) throw new Error(`GDELT DOC ${res.status}`);
  const data = (await res.json()) as { articles?: unknown };
  const arts = Array.isArray(data.articles) ? data.articles : [];
  return arts
    .map((a) => {
      const o = a as Record<string, unknown>;
      return {
        url: String(o.url ?? ""),
        title: String(o.title ?? ""),
        seendate: o.seendate ? String(o.seendate) : undefined,
        domain: o.domain ? String(o.domain) : undefined,
      };
    })
    .filter((a) => a.url && a.title);
}

function scandalWeightFromTitle(title: string): { themes: string[]; weight: number } {
  const low = title.toLowerCase();
  const themes = SCANDAL_KEYWORDS.filter((k) => low.includes(k));
  return { themes, weight: Math.min(1, themes.length * 0.3) };
}

function matchWhitelist(title: string, whitelist: Set<string>): string[] {
  if (!whitelist.size) return [];
  const low = title.toLowerCase();
  // Array.from (not for-of) so we don't require the ES2015 iteration downlevel flag.
  return Array.from(whitelist).filter((name) => name.length >= 3 && low.includes(name));
}

/** Score one article into a ScoredSignal (headline-only path; velocity proxied). */
export function scoreArticle(title: string, url: string, whitelist: Set<string>): ScoredSignal {
  const s = scoreSentiment(title);
  const { themes, weight } = scandalWeightFromTitle(title);
  const persons = matchWhitelist(title, whitelist);
  const scandalVelocity = Math.round(s.intensity * 3 * 100) / 100; // proxy 0..3 (no GCAM in ArtList)
  const perpProbability = perpTriggerProbability({
    personMatches: persons.length,
    themeScandalWeight: weight,
    scandalVelocity,
  });
  return {
    headline: title,
    url,
    persons,
    themes,
    personMatches: persons.length,
    themeScandalWeight: weight,
    scandalVelocity,
    perpProbability,
  };
}

/** Fetch → score → upsert into gdelt_signals (idempotent by url). Returns counts. */
export async function ingestGdelt(
  pool: Pool,
  opts?: { query?: string; timespan?: string; maxrecords?: number },
): Promise<{ fetched: number; inserted: number }> {
  const articles = await fetchGdeltDoc(opts);
  const whitelist = await getWhitelist(pool).catch(() => new Set<string>());
  let inserted = 0;
  for (const a of articles) {
    const sig = scoreArticle(a.title, a.url, whitelist);
    const res = await pool.query(
      `INSERT INTO gdelt_signals
         (headline, url, persons, themes, person_matches, theme_scandal_weight, scandal_velocity, perp_probability)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (url) WHERE url IS NOT NULL DO NOTHING`,
      [
        sig.headline,
        sig.url,
        JSON.stringify(sig.persons),
        JSON.stringify(sig.themes),
        sig.personMatches,
        sig.themeScandalWeight,
        sig.scandalVelocity,
        sig.perpProbability,
      ],
    );
    inserted += res.rowCount ?? 0;
  }
  return { fetched: articles.length, inserted };
}
