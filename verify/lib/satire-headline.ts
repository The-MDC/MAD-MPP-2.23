/**
 * MAD Gambit — satirical headline engine (deterministic).
 * ------------------------------------------------------------------
 * Rewrites a real headline into a MAD-Magazine × South-Park one-liner. Pure,
 * deterministic, serverless-fast, no LLM call and no API key. The Gemini
 * satire-engine route is the richer tier; this is the always-on floor that
 * powers the news carousel and the category feeds, and it must be good enough
 * to ship alone — it is what renders whenever the key is absent.
 *
 * WHAT CHANGED, AND WHY IT MATTERED
 * This function used to return `PREFIX + <the untouched source headline> +
 * SUFFIX`. It was a decorator, not a writer. Every card on the News Flow
 * therefore showed a raw newsroom headline with a joke stapled to each end,
 * and because output length was `source + ~45 chars`, long tabloid titles
 * truncated mid-sentence. It now BUILDS a line: it extracts the entity the
 * story is about and writes an original sentence around it. The source is
 * never interpolated. That is the whole fix.
 *
 * The 6 canonical categories mirror the hub's left rail (founder marketing
 * taxonomy, 31 Jul 2026 — labels are canon, do not paraphrase):
 *   headlines      → "Headlines & Politics"
 *   entertainment  → "Entertainment & Celebrity"
 *   sports         → "Athletes & Sports"
 *   viraltech      → "Viral Media & Tech"
 *   crypto         → "Crypto & Finance"
 *   tabloid        → "Tabloids & Gossip"
 *
 * ~15% of items take the SOUTH-PARK EDGE voice — punchier, absurd, a touch
 * controversial (the founder's "15% lean toward South Park" note). Selected
 * deterministically from the hash. Brand-safe by construction: the joke lands
 * on the situation, never on a real person's character. satire-metrics.ts
 * still scores every output and flags anything that trips brandSafe.
 *
 * DETERMINISM IS A CONTRACT, NOT A PREFERENCE. The same (headline, category)
 * must always produce the same line: this renders on the server and again on
 * the client, and any divergence is a React hydration error. Nothing here may
 * use Math.random() or anything locale- or clock-dependent.
 */
export type NewsCategory =
  | "headlines"
  | "entertainment"
  | "sports"
  | "viraltech"
  | "crypto"
  | "tabloid";

/**
 * Words that never make a good subject — articles, auxiliaries, and the
 * newsroom throat-clearing that opens most headlines.
 */
const STOP = new Set([
  "the", "a", "an", "of", "in", "on", "at", "and", "or", "to", "for", "with", "from",
  "after", "before", "as", "is", "are", "was", "were", "be", "been", "has", "have",
  "his", "her", "their", "its", "this", "that", "these", "those", "new", "says",
  "said", "how", "why", "what", "when", "who", "inside", "breaking", "exclusive",
  "report", "reports", "revealed", "amid", "over", "into", "out", "up", "down",
  // Headline verbs and adjectives. Without these the all-caps fallback happily
  // picks "ENTIRE" or "SPARKS" as the subject of the joke, which reads as
  // nonsense — the fallback has no grammar, only this list.
  "shock", "shocking", "entire", "local", "eats", "sparks", "hits", "delays",
  "trade", "trades", "unveils", "react", "reacts", "public", "star", "key",
  "level", "again", "hours", "million", "billion", "video", "vote", "deadline",
  "statement", "expected", "soon", "further", "more", "first", "last", "big",
  "huge", "major", "top", "best", "worst", "just", "now", "very", "really",
]);

/** Longest sensible subject before the frame stops fitting in MAX_LEN. */
const SUBJECT_MAX = 24;

/** Hard cap on the finished line — cards truncate past roughly this. */
const MAX_LEN = 70;

/**
 * Pull the thing the joke is ABOUT out of a headline.
 *
 * Prefers a run of capitalised words (a person, a company, a token), because
 * that is what a reader recognises. Falls back to the longest content word so
 * an all-caps or all-lowercase feed still yields something to point at.
 *
 * This returns an ENTITY, never the headline: that distinction is what keeps
 * the source out of the output.
 */
/**
 * Letter classes written as explicit ranges rather than \p{L} with the `u`
 * flag. This file compiles under the repo's ES5 target, where both the unicode
 * flag and property escapes are syntax errors — Latin-1 Supplement and Latin
 * Extended-A cover the accented names that actually appear in these feeds
 * (Rodríguez, Mbappé, Håland).
 */
const UPPER = "A-Z\\u00C0-\\u00D6\\u00D8-\\u00DE";
const LETTER = "A-Za-z\\u00C0-\\u00FF\\u0100-\\u017F";
const NAME_RUN = new RegExp(
  "\\b[" + UPPER + "][" + LETTER + "'\\u2019-]*(?:\\s+[" + UPPER + "][" + LETTER + "'\\u2019-]*)*",
  "g",
);
const NON_WORD = new RegExp("[^" + LETTER + "0-9'\\u2019-]+", "g");

function extractSubject(clean: string): string {
  // Title Case and ALL CAPS both defeat naive proper-noun detection, so only
  // trust capitalisation when the headline is actually mixed-case.
  const mixedCase = /[a-z]/.test(clean) && /[A-Z]/.test(clean);

  if (mixedCase) {
    const runs = clean.match(NAME_RUN) ?? [];
    const named = runs
      .map((run) => ({ text: trimRun(run), lead: clean.indexOf(run) === 0 }))
      .filter((r) => r.text.length > 2);

    if (named.length) {
      // Multi-word runs are real entities — "Cristiano Ronaldo" beats "Inside".
      const multi = named.filter((r) => r.text.includes(" "));
      if (multi.length) return cap(multi.reduce((a, b) => (b.text.length > a.text.length ? b : a)).text);

      // Among single words, skip the one in first position: headlines
      // capitalise their opening word by convention, so it is usually
      // "Global"/"Breaking" rather than the subject. "Apple" is what we want.
      const notLead = named.filter((r) => !r.lead);
      const pick = (notLead.length ? notLead : named).reduce((a, b) => (b.text.length > a.text.length ? b : a));
      return cap(pick.text);
    }
  }

  const words = clean
    .split(NON_WORD)
    .map(trimRun)
    .filter((w) => w.length > 3 && !STOP.has(w.toLowerCase()));
  if (!words.length) return "";
  return cap(words.reduce((a, b) => (b.length > a.length ? b : a)));
}

/** Drop leading/trailing stopwords and any possessive tail from a candidate. */
function trimRun(run: string): string {
  const w = run.trim().split(/\s+/);
  while (w.length && STOP.has(w[0].toLowerCase())) w.shift();
  while (w.length && STOP.has(w[w.length - 1].toLowerCase())) w.pop();
  // "Influencer's goes viral" reads as a typo; the entity is "Influencer".
  return w.join(" ").replace(/['\u2019]s$/, "").slice(0, SUBJECT_MAX).trim();
}

/** ALL-CAPS feeds would otherwise SHOUT mid-sentence. */
function cap(s: string): string {
  if (s !== s.toUpperCase()) return s;
  return s.charAt(0) + s.slice(1).toLowerCase();
}

/**
 * Frames are ORIGINAL lines with one {S} slot. The source headline is never
 * interpolated — only the extracted entity — which is the entire fix.
 */
const FRAMES: Record<NewsCategory, string[]> = {
  headlines: [
    "{S} forms a committee to study the committee.",
    "{S} declares victory. So does everyone else.",
    "{S} solves nothing, but magnificently.",
    "{S} promises change by a date nobody wrote down.",
    "Both sides agree {S} is the other side's fault.",
  ],
  entertainment: [
    "{S} announces a feud nobody ordered.",
    "{S} renewed for a season nobody asked for.",
    "The {S} cinematic universe expands. Regrettably.",
    "{S} posts a cryptic emoji. Analysts convene.",
    "{S} enters the apology-video phase.",
  ],
  sports: [
    "{S} loses to the vibes. Refs are reviewing.",
    "{S} trades everyone, keeps the mascot.",
    "{S} wins on a technicality nobody understands.",
    "A podcast guy has decided {S} is finished.",
  ],
  viraltech: [
    "{S} gets ratioed straight into the sea.",
    "{S} apologizes in 4K. Sponsored, obviously.",
    "The algorithm demands more {S}. Always more.",
    "{S} goes viral for eleven entire minutes.",
    "{S} launches a beta. It launches back.",
  ],
  crypto: [
    "{S} pumps on one (1) tweet.",
    "{S} goes up, then down, then to court.",
    "{S}: the floor is now the ceiling.",
    "Anon dev assures everyone {S} is fine.",
    "{S} hits an all-time high in press releases.",
  ],
  tabloid: [
    "{S} did something. Page Six did the rest.",
    "{S} has entered its messy era.",
    "Somebody photographed {S}. Civilization wobbled.",
    "{S}: now a three-part docuseries.",
    "{S} spotted at 3am, allegedly, probably.",
  ],
};

/**
 * The ~15% South-Park lean — sharper, more absurd, aimed at the situation and
 * never at a real person's character. Shared across categories so the lean
 * reads consistently whichever feed you are in.
 */
const EDGE_FRAMES: string[] = [
  "{S} learned a valuable lesson. {S} did not.",
  "Somehow, {S} is still completely legal.",
  "{S}, but make it a town meeting.",
  "Cut to a very concerned anchor saying '{S}'.",
  "{S} did this. On purpose. With witnesses.",
];

/** 15 in 100 take the edge voice. Deterministic per headline. */
const EDGE_THRESHOLD = 15;

/** Stable 31-based string hash → non-negative int (deterministic selection). */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Frames that need no subject — used when nothing quotable can be extracted. */
const SUBJECTLESS: Record<NewsCategory, string> = {
  headlines: "A committee has been formed. Nothing follows.",
  entertainment: "Someone is feuding. A docuseries is greenlit.",
  sports: "The refs are reviewing the vibes.",
  viraltech: "The comments section remains undefeated.",
  crypto: "Number moved. Opinions moved harder.",
  tabloid: "Photos exist. That is the whole story.",
};

/** Trim to the cap on a word boundary rather than mid-word. */
function fit(line: string): string {
  if (line.length <= MAX_LEN) return line;
  const cut = line.slice(0, MAX_LEN - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > 24 ? cut.slice(0, space) : cut).replace(/[,;:.\s]+$/, "")}…`;
}

/**
 * Deterministic satirical REWRITE of a headline.
 *
 * Was a decorator: it returned `PREFIX + <the untouched source> + SUFFIX`, so
 * every card on the wire showed a raw newsroom headline with a joke stapled to
 * each end. This builds an original line instead, about the entity the headline
 * names, and the source is never interpolated.
 *
 * Deterministic by contract — the same (headline, category) always produces the
 * same line. That is not a nicety: this renders on the server and again on the
 * client, and any divergence is a hydration error.
 */
export function satirizeHeadline(headline: string, category: NewsCategory): string {
  const clean = (headline ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return "";

  const h = hash(`${clean}|${category}`);
  const subject = extractSubject(clean);

  if (!subject) return SUBJECTLESS[category];

  const pool = h % 100 < EDGE_THRESHOLD ? EDGE_FRAMES : FRAMES[category];
  const line = fit(pool[h % pool.length].split("{S}").join(subject));

  // Guard the contract itself. A very short headline can be its own subject
  // ("Bitcoin"), and the frame would then technically contain the source. Fall
  // back to a subjectless frame rather than ship a line that embeds the input.
  if (line.toLowerCase().includes(clean.toLowerCase())) return SUBJECTLESS[category];

  return line;
}
