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
  category: "crypto" | "macro" | "news" | "thesis" | "entertainment" | "satire";
  trust_score: number;       // 1 to 10
  satire_flag: boolean;
  virality_weight: number;   // multiplier
}

export const FEED_SOURCES: FeedSource[] = [
  { id: "reuters",      name: "Global Headlines (Reuters)", url: "https://www.reutersagency.com/feed/?best-regions=global&best-sectors=top-news", category: "news", trust_score: 10, satire_flag: false, virality_weight: 1.0 },
  { id: "eonline",      name: "Entertainment Headlines (E!)", url: "https://www.eonline.com/syndication/feeds/rssfeeds/topstories.xml", category: "entertainment", trust_score: 7, satire_flag: false, virality_weight: 1.5 },
  { id: "tmz",          name: "Celebrity News (TMZ)", url: "https://www.tmz.com/rss.xml", category: "entertainment", trust_score: 6, satire_flag: false, virality_weight: 2.0 },
  { id: "dailymail",    name: "Tabloids (Daily Mail)", url: "https://www.dailymail.co.uk/articles.rss", category: "news", trust_score: 4, satire_flag: false, virality_weight: 2.5 },
  { id: "coindesk",     name: "Crypto News (CoinDesk)", url: "https://www.coindesk.com/arc/outboundfeeds/rss/", category: "crypto", trust_score: 8, satire_flag: false, virality_weight: 1.2 },
  { id: "cointelegraph",name: "Crypto News (Cointelegraph)", url: "https://cointelegraph.com/rss", category: "crypto", trust_score: 8, satire_flag: false, virality_weight: 1.2 },
  { id: "theonion",     name: "The Onion", url: "https://www.theonion.com/rss", category: "satire", trust_score: 1, satire_flag: true, virality_weight: 3.0 },
  { id: "babylonbee",   name: "The Potato (Babylon Bee)", url: "https://babylonbee.com/feed", category: "satire", trust_score: 1, satire_flag: true, virality_weight: 3.0 },
  { id: "redditviral",  name: "Social Viral Media (Reddit)", url: "https://www.reddit.com/r/ViralNews/.rss", category: "news", trust_score: 5, satire_flag: false, virality_weight: 2.5 },
];

export interface FeedItem {
  source: string;
  category: FeedSource["category"];
  title: string;
  link: string;
  published: string;
  trust_score: number;
  satire_flag: boolean;
  virality_weight: number;
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
        trust_score: source.trust_score,
        satire_flag: source.satire_flag,
        virality_weight: source.virality_weight,
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
