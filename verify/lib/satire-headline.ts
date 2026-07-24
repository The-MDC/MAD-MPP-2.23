/**
 * MAD Gambit — satirical headline engine (deterministic).
 * ------------------------------------------------------------------
 * Turns a real headline into a MAD-Magazine × South-Park satirical rewrite —
 * pure, deterministic, serverless-fast (no LLM call). The heavier Gemini
 * satire-engine route stays for on-demand, richer roasts; this powers the
 * always-on rotating news carousel where a fast, brand-safe quip per item is
 * what's needed. Category tunes the voice (Entertainment / Celebrity / Crypto /
 * Political).
 */
export type NewsCategory = "entertainment" | "celebrity" | "tabloid" | "crypto" | "political" | "viral";

const PREFIX: Record<NewsCategory, string[]> = {
  entertainment: ["ALLEGEDLY:", "SOURCES SCREAM:", "IN A STUNNING TWIST:", "UNCONFIRMED BUT VIRAL:"],
  celebrity: ["INSIDERS GASP:", "A REP DID NOT DENY:", "CAUGHT ON A RING CAM:", "PER A FRIEND OF A FRIEND:"],
  tabloid: ["EXCLUSIVE!!:", "YOU WON'T BELIEVE:", "SPOTTED AT 3AM:", "FRONT-PAGE FRENZY:"],
  crypto: ["ANON DEV CONFIRMS:", "ACCORDING TO ONE (1) TWEET:", "THE CHART WHISPERS:", "A WHALE ALLEGEDLY SAID:"],
  political: ["A SENIOR AIDE SHRUGS:", "PER AN UNNAMED STAFFER:", "IN A LEAKED GROUP CHAT:", "OFF THE RECORD, ON THE NOSE:"],
  viral: ["GOING VIRAL:", "THE ALGORITHM DEMANDS:", "REPOSTED 40K TIMES:", "CHRONICALLY ONLINE:"],
};

const SUFFIX: Record<NewsCategory, string[]> = {
  entertainment: ["— fans demand a prequel", "— the internet is normal about it", "— a docuseries is already greenlit"],
  celebrity: ["— sources close to the source confirm nothing", "— the feud enters season 3", "— a cryptic emoji says it all"],
  tabloid: ["— full story on page SIX", "— photos inside", "— more as this develops (it won't)"],
  crypto: ["— number may go up, down, or sideways", "— definitely not financial advice", "— the floor is now the ceiling"],
  political: ["— both sides declare victory", "— a committee will investigate the committee", "— nothing changes, epically"],
  viral: ["— ratio pending", "— the comments are undefeated", "— touch-grass advisory issued"],
};

/** Stable 31-based string hash → non-negative int (deterministic selection). */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Deterministic satirical rewrite of a headline for a category. */
export function satirizeHeadline(headline: string, category: NewsCategory): string {
  const clean = (headline ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const h = hash(`${clean}|${category}`);
  const pre = PREFIX[category];
  const suf = SUFFIX[category];
  return `${pre[h % pre.length]} ${clean} ${suf[(h >> 3) % suf.length]}`;
}
