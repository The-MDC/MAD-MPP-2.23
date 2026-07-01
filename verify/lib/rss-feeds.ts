/**
 * MAD Gambit — Live RSS Feed Engine
 * ------------------------------------------------------------------
 * Server-side fetch + parse of REAL RSS feeds. Feed list is exactly the
 * set named in HANDOFF_MAD_GAMBIT.md §5 (RssFeedFetcher): CoinDesk,
 * CoinTelegraph, CNBC, BBC, Yahoo Finance, Outlier Ventures, Jamie Burke.
 * Runs in Next.js server runtime (route handler). No API key required.
 *
 * Expansion targets (Top-10 news/entertainment/exchanges, influencer
 * social feeds, Jamie Burke Twitter/LinkedIn) are PLACEHOLDER-listed in
 * docs/BACKEND_PLACEHOLDERS.md → FEED_EXPANSION.
 */

export interface FeedSource {
  id: string;
  name: string;
  url: string;
  category: "crypto" | "macro" | "news" | "thesis";
}

export const FEED_SOURCES: FeedSource[] = [
  { id: "coindesk",     name: "CoinDesk",         url: "https://www.coindesk.com/arc/outboundfeeds/rss/", category: "crypto" },
  { id: "cointelegraph",name: "Cointelegraph",    url: "https://cointelegraph.com/rss",                    category: "crypto" },
  { id: "cnbc",         name: "CNBC",             url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114", category: "macro" },
  { id: "bbc",          name: "BBC",              url: "https://feeds.bbci.co.uk/news/rss.xml",            category: "news" },
  { id: "yahoo",        name: "Yahoo Finance",    url: "https://finance.yahoo.com/news/rssindex",          category: "macro" },
  { id: "outlier",      name: "Outlier Ventures", url: "https://outlierventures.io/feed/",                 category: "thesis" },
  { id: "jamieburke",   name: "Jamie Burke (Medium)", url: "https://medium.com/feed/@jamie247",            category: "thesis" },
];

export interface FeedItem {
  source: string;
  category: FeedSource["category"];
  title: string;
  link: string;
  published: string;
}

// Minimal, dependency-free RSS/Atom extraction (titles + links + dates).
function extractItems(xml: string, source: FeedSource): FeedItem[] {
  const items: FeedItem[] = [];
  const blocks = xml.split(/<item[\s>]|<entry[\s>]/i).slice(1);
  for (const block of blocks.slice(0, 8)) {
    const title = decodeXml(matchTag(block, "title"));
    let link = matchTag(block, "link");
    if (!link) {
      const href = block.match(/<link[^>]*href=["']([^"']+)["']/i);
      if (href) link = href[1];
    }
    const published =
      matchTag(block, "pubDate") || matchTag(block, "published") || matchTag(block, "updated") || "";
    if (title) {
      items.push({
        source: source.name,
        category: source.category,
        title: title.trim(),
        link: (link || "").trim(),
        published: published.trim(),
      });
    }
  }
  return items;
}

function matchTag(block: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = block.match(re);
  if (!m) return "";
  return m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
}

function decodeXml(s: string): string {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'");
}

export async function fetchFeed(source: FeedSource, timeoutMs = 6000): Promise<FeedItem[]> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(source.url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "MADGambit-RSS/2.23 (+https://the-mdc.github.io)" },
      // Next.js: revalidate every 5 min
      next: { revalidate: 300 } as any,
    });
    clearTimeout(t);
    if (!res.ok) return [];
    const xml = await res.text();
    return extractItems(xml, source);
  } catch {
    return [];
  }
}

export async function fetchAllFeeds(): Promise<FeedItem[]> {
  const results = await Promise.allSettled(FEED_SOURCES.map((s) => fetchFeed(s)));
  const items = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  // newest-ish first; fall back to source order when dates are unparseable
  return items.sort((a, b) => {
    const ta = Date.parse(a.published) || 0;
    const tb = Date.parse(b.published) || 0;
    return tb - ta;
  });
}
