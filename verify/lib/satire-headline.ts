/**
 * MAD Gambit — satirical headline engine (deterministic).
 * ------------------------------------------------------------------
 * Turns a real headline into a MAD-Magazine × South-Park satirical rewrite —
 * pure, deterministic, serverless-fast (no LLM call). The heavier Gemini
 * satire-engine route stays for on-demand, richer roasts; this powers the
 * always-on rotating news carousel and the 10 category feeds where a fast,
 * brand-safe quip per item is what's needed. Category tunes the voice.
 *
 * The 10 categories mirror the hub's left rail (worksheet item D):
 *   celebrity · entertainment · influencer · political · sports ·
 *   tabloid · television · viral · crypto · funnies
 *
 * ~15% of items get the SOUTH-PARK EDGE voice — punchier, absurd, a touch
 * controversial (per the founder's "15% lean toward South Park" note). It is
 * selected deterministically from the hash, and stays brand-safe: satire on
 * the situation, never slurs or real-person defamation. satire-metrics.ts
 * still scores every output and flags anything that trips brandSafe.
 */
export type NewsCategory =
  | "celebrity"
  | "entertainment"
  | "influencer"
  | "political"
  | "sports"
  | "tabloid"
  | "television"
  | "viral"
  | "crypto"
  | "funnies";

const PREFIX: Record<NewsCategory, string[]> = {
  celebrity: ["INSIDERS GASP:", "A REP DID NOT DENY:", "CAUGHT ON A RING CAM:", "PER A FRIEND OF A FRIEND:"],
  entertainment: ["ALLEGEDLY:", "SOURCES SCREAM:", "IN A STUNNING TWIST:", "UNCONFIRMED BUT VIRAL:"],
  influencer: ["PER THE GROUP CHAT:", "A BRAND DEAL WHISPERS:", "THE FOR-YOU PAGE INSISTS:", "AN UNPAID INTERN LEAKED:"],
  political: ["A SENIOR AIDE SHRUGS:", "PER AN UNNAMED STAFFER:", "IN A LEAKED GROUP CHAT:", "OFF THE RECORD, ON THE NOSE:"],
  sports: ["A LOCKER-ROOM SOURCE SWEARS:", "THE REPLAY BOOTH GASPS:", "PER A GUY WITH A PODCAST:", "SIDELINE INTEL CONFIRMS:"],
  tabloid: ["EXCLUSIVE!!:", "YOU WON'T BELIEVE:", "SPOTTED AT 3AM:", "FRONT-PAGE FRENZY:"],
  television: ["A SHOWRUNNER TEASES:", "THE FINALE 'LEAKED':", "PER A CANCELLED PILOT:", "STREAMING METRICS WHISPER:"],
  viral: ["GOING VIRAL:", "THE ALGORITHM DEMANDS:", "REPOSTED 40K TIMES:", "CHRONICALLY ONLINE:"],
  crypto: ["ANON DEV CONFIRMS:", "ACCORDING TO ONE (1) TWEET:", "THE CHART WHISPERS:", "A WHALE ALLEGEDLY SAID:"],
  funnies: ["IN TODAY'S GAFFE:", "CAUGHT MID-BLUNDER:", "THE BLOOPER REEL PRESENTS:", "FILED UNDER 'OOPS':"],
};

const SUFFIX: Record<NewsCategory, string[]> = {
  celebrity: ["— sources close to the source confirm nothing", "— the feud enters season 3", "— a cryptic emoji says it all"],
  entertainment: ["— fans demand a prequel", "— the internet is normal about it", "— a docuseries is already greenlit"],
  influencer: ["— the apology video is already scripted", "— sponsored, obviously", "— the collab is on hiatus"],
  political: ["— both sides declare victory", "— a committee will investigate the committee", "— nothing changes, epically"],
  sports: ["— the refs are reviewing the vibes", "— a hot take grows louder", "— trade rumors intensify for no reason"],
  tabloid: ["— full story on page SIX", "— photos inside", "— more as this develops (it won't)"],
  television: ["— renewed for a season nobody asked for", "— the spinoff writes itself", "— a reunion special looms"],
  viral: ["— ratio pending", "— the comments are undefeated", "— touch-grass advisory issued"],
  crypto: ["— number may go up, down, or sideways", "— definitely not financial advice", "— the floor is now the ceiling"],
  funnies: ["— caught on tape, naturally", "— the outtakes are the real story", "— someone's getting a stern email"],
};

// The ~15% South-Park edge: sharper, absurd, a touch controversial — aimed at
// the situation, brand-safe. Shared across all categories so the lean is
// consistent regardless of feed.
const EDGE_PREFIX: string[] = [
  "OH MY GOD, THEY:",
  "IN AN EPISODE THAT WRITES ITSELF:",
  "BREAKING (respectfully, insanely):",
  "SOMEHOW STILL LEGAL:",
  "A CHILD COULD SEE THIS COMING:",
];
const EDGE_SUFFIX: string[] = [
  "— and everyone learned a valuable lesson (no they didn't)",
  "— roll the town-meeting montage",
  "— the moral of the story is money",
  "— cut to a very concerned news anchor",
  "— annnnd the market's going home",
];

// 15 in 100 → South-Park edge voice. Deterministic, so a given headline always
// renders the same way.
const EDGE_THRESHOLD = 15;

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
  const edge = h % 100 < EDGE_THRESHOLD;
  const pre = edge ? EDGE_PREFIX : PREFIX[category];
  const suf = edge ? EDGE_SUFFIX : SUFFIX[category];
  return `${pre[h % pre.length]} ${clean} ${suf[(h >> 3) % suf.length]}`;
}
