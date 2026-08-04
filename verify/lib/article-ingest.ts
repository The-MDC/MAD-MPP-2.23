/**
 * MAD Gambit — article ingest (.txt body + hero images).
 * ------------------------------------------------------------------
 * The satire engine used to see only an RSS <title>. A title is ~10 words of
 * context, which is why LLM roasts came back generic. This module fetches the
 * source article and reduces it to two things the meme engine actually needs:
 *
 *   text   — the article as plain .txt (scripts/styles/nav stripped, entities
 *            decoded, whitespace collapsed, hard-capped so we never blow the
 *            model's context or the route's latency budget)
 *   images — up to N candidate images, og:image / twitter:image first (those
 *            are the publisher's own chosen hero shot, i.e. the most
 *            meme-able frame), then in-article <img> as fallback
 *
 * Dependency-free by design: no cheerio/jsdom. These are hostile, ad-laden
 * pages; a regex reducer that degrades to "no text, use the title" is more
 * robust here than a DOM parser that throws on malformed markup. Every failure
 * path returns a partial result rather than throwing — the caller always has a
 * headline to fall back on.
 *
 * Pure-ish (one fetch) + es5-safe.
 */

export interface IngestedArticle {
  url: string;
  /** Publisher's <title> / og:title when present. */
  title?: string;
  /** Article body as plain text. Empty string when extraction found nothing. */
  text: string;
  /** Absolute image URLs, best-first. May be empty. */
  images: string[];
  /** True when the fetch itself failed — caller should fall back to the headline. */
  failed: boolean;
}

/** Hard caps: keeps one slow publisher from stalling the whole route. */
const FETCH_TIMEOUT_MS = 7000;
const MAX_HTML_BYTES = 1_500_000; // don't reduce a 10MB page
const MAX_TEXT_CHARS = 6000; // ~1.5k tokens of context — plenty for a one-liner

const UA = "MADGambit-Ingest/2.23 (+https://the-mdc.github.io)";

/** Junk image heuristics — tracking pixels, sprites, logos, avatars, icons. */
const IMAGE_DENY = /(?:sprite|logo|avatar|icon|favicon|pixel|1x1|blank|spacer|placeholder|advert|doubleclick|analytics)/i;

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;|&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&(?:ldquo|rdquo);/gi, '"')
    .replace(/&mdash;/gi, "—")
    .replace(/&ndash;/gi, "–")
    .replace(/&hellip;/gi, "…")
    .replace(/&#(\d+);/g, (_m, d) => {
      const n = parseInt(d, 10);
      return Number.isFinite(n) && n > 31 && n < 0x10ffff ? String.fromCharCode(n) : " ";
    });
}

/** Reduce raw HTML to readable plain text. */
export function htmlToText(html: string): string {
  let s = html;
  // Kill non-content elements outright (including their contents).
  s = s.replace(/<(script|style|noscript|svg|iframe|form|nav|aside|footer|header)\b[\s\S]*?<\/\1>/gi, " ");
  s = s.replace(/<!--[\s\S]*?-->/g, " ");
  // Prefer the article body when the publisher marks one.
  const article = s.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
  if (article && article[1].length > 400) s = article[1];
  // Block boundaries become a sentinel, not a raw "\n". Per HTML whitespace
  // semantics a newline *inside* a paragraph is only a space, so we must be able
  // to tell "break I inserted" from "newline that was in the source markup" —
  // otherwise the publisher's source formatting leaks into the .txt as bogus
  // line breaks mid-sentence.
  const BREAK = "\u0000";
  s = s.replace(/<\/(p|div|h[1-6]|li|section|blockquote)\s*>/gi, BREAK);
  s = s.replace(/<br\s*\/?>/gi, BREAK);
  s = s.replace(/<[^>]+>/g, " ");
  s = decodeEntities(s);
  // Every remaining whitespace run is intra-block → collapse to a single space.
  s = s.replace(/\s+/g, " ");
  // Sentinels become real newlines; adjacent runs collapse to one.
  s = s.replace(/[\s\u0000]*\u0000[\s\u0000]*/g, "\n");
  return s.replace(/^\s+|\s+$/g, "");
}

/** Attribute value from a tag, tolerating quoted *and* unquoted HTML syntax. */
function attr(tag: string, name: string): string | undefined {
  const quoted = tag.match(new RegExp('\\b' + name + '=["\']([^"\']+)["\']', "i"));
  if (quoted) return quoted[1];
  const bare = tag.match(new RegExp('\\b' + name + '=([^\\s>"\']+)', "i"));
  return bare ? bare[1] : undefined;
}

function absolutize(src: string, base: string): string | null {
  try {
    if (src.startsWith("data:")) return null;
    return new URL(src, base).toString();
  } catch {
    return null;
  }
}

/**
 * Candidate images, best-first: og:image → twitter:image → in-body <img>.
 * Deduped, absolutized, junk-filtered, capped at `max`.
 */
export function extractArticleImages(html: string, baseUrl: string, max = 2): string[] {
  const out: string[] = [];
  const seen: Record<string, boolean> = {};

  const push = (raw: string | undefined) => {
    if (!raw || out.length >= max) return;
    const abs = absolutize(raw.trim(), baseUrl);
    if (!abs || seen[abs] || IMAGE_DENY.test(abs)) return;
    seen[abs] = true;
    out.push(abs);
  };

  // Meta hero images — property/name order varies by publisher, so match both.
  const metaRe = /<meta[^>]+(?:property|name)=["'](og:image(?::url)?|twitter:image(?::src)?)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = metaRe.exec(html)) !== null && out.length < max) {
    push(attr(m[0], "content"));
  }

  // In-article <img>. Honour lazy-loading attrs, which many publishers use.
  if (out.length < max) {
    const scope = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
    const body = scope ? scope[1] : html;
    const imgRe = /<img\b[^>]*>/gi;
    let im: RegExpExecArray | null;
    while ((im = imgRe.exec(body)) !== null && out.length < max) {
      const tag = im[0];
      // Lazy-loading attrs first: many publishers put a placeholder in src and
      // the real asset in data-src, so preferring src would collect junk.
      push(attr(tag, "data-src") ?? attr(tag, "data-lazy-src") ?? attr(tag, "src"));
    }
  }

  return out;
}

function extractTitle(html: string): string | undefined {
  const og = html.match(/<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  if (og) return decodeEntities(og[1]).trim();
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return t ? decodeEntities(t[1]).replace(/\s+/g, " ").trim() : undefined;
}

/**
 * Fetch one article and reduce it to text + images. Never throws; on any
 * failure returns `{ failed: true, text: "", images: [] }` so the caller can
 * proceed on the RSS headline alone.
 */
export async function ingestArticle(
  url: string,
  opts: { maxImages?: number; maxChars?: number; timeoutMs?: number } = {},
): Promise<IngestedArticle> {
  const maxImages = opts.maxImages ?? 2;
  const maxChars = opts.maxChars ?? MAX_TEXT_CHARS;
  const empty: IngestedArticle = { url, text: "", images: [], failed: true };
  if (!url || !/^https?:\/\//i.test(url)) return empty;

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
      // Next.js RequestInit extension (same cast as lib/rss-feeds.ts)
      next: { revalidate: 300 } as any,
    });
    clearTimeout(timer);
    if (!res.ok) return empty;

    const ctype = res.headers.get("content-type") || "";
    if (ctype && !/html|xml|text/i.test(ctype)) return empty;

    let html = await res.text();
    if (html.length > MAX_HTML_BYTES) html = html.slice(0, MAX_HTML_BYTES);

    const text = htmlToText(html).slice(0, maxChars);
    return {
      url,
      title: extractTitle(html),
      text,
      images: extractArticleImages(html, url, maxImages),
      failed: false,
    };
  } catch {
    return empty;
  }
}
