import { NextResponse } from "next/server";
import { fetchAllFeeds } from "@/lib/rss-feeds";
import { satirizeHeadline, type NewsCategory } from "@/lib/satire-headline";
import { satireMetrics } from "@/lib/satire-metrics";

/**
 * GET /api/v1/news/satirical — the rotating satirical-news feed, bucketed into
 * Entertainment / Celebrity / Crypto / Political from the top publishers. Each item
 * carries the REAL headline, OUR satirical rewrite, the source image (when the feed
 * provides one), and Z-Liar/GossipCop satire metrics. Live RSS when reachable;
 * otherwise demo rows through the SAME real satirizer + scorer.
 */
export const revalidate = 300;

const CATEGORIES: NewsCategory[] = ["entertainment", "celebrity", "tabloid", "crypto", "political", "viral"];

// sourceId → display bucket (satire sources like Onion/Bee are style refs, excluded).
const BUCKET: Record<string, NewsCategory> = {
  eonline: "entertainment", variety: "entertainment",
  tmz: "celebrity", pagesix: "celebrity", people: "celebrity", usweekly: "celebrity",
  dailymail: "tabloid", thesun: "tabloid", mirror: "tabloid",
  coindesk: "crypto", cointelegraph: "crypto", decrypt: "crypto", theblock: "crypto", bankless: "crypto",
  reuters: "political", politico: "political", thehill: "political", bbcpolitics: "political", axios: "political",
  redditviral: "viral", buzzfeed: "viral",
};

export interface SatiricalNewsItem {
  source: string;
  category: NewsCategory;
  image: string | null;
  realHeadline: string;
  satiricalHeadline: string;
  satireScore: number;
  verdict: string;
  brandSafe: boolean;
  link: string;
}

function toItem(source: string, category: NewsCategory, title: string, image?: string, link = ""): SatiricalNewsItem {
  const m = satireMetrics(title);
  return {
    source,
    category,
    image: image ?? null,
    realHeadline: title,
    satiricalHeadline: satirizeHeadline(title, category),
    satireScore: m.satireScore,
    verdict: m.verdict,
    brandSafe: m.brandSafe,
    link,
  };
}

const DEMO: { source: string; category: NewsCategory; title: string }[] = [
  { source: "Variety", category: "entertainment", title: "Streaming giant greenlights a fourth cinematic universe nobody asked for" },
  { source: "E!", category: "entertainment", title: "Awards show run-time officially longer than some marriages" },
  { source: "Page Six", category: "celebrity", title: "Pop couple spotted arguing over a single shared dessert" },
  { source: "TMZ", category: "celebrity", title: "Reality star launches feud, then a candle line, in the same afternoon" },
  { source: "People", category: "celebrity", title: "A-lister's cryptic post sends fans into a 3 a.m. spiral" },
  { source: "CoinDesk", category: "crypto", title: "Token rallies 40% on a roadmap that is mostly vibes" },
  { source: "Decrypt", category: "crypto", title: "Anonymous developer promises the airdrop is 'basically done'" },
  { source: "The Block", category: "crypto", title: "Exchange adds a coin, then quietly adds a disclaimer" },
  { source: "Politico", category: "political", title: "Bipartisan committee agrees only on the catering order" },
  { source: "The Hill", category: "political", title: "Official denies rumor no one had actually reported yet" },
  { source: "BBC Politics", category: "political", title: "Landmark bill passes, immediately scheduled for repeal" },
  { source: "Daily Mail", category: "tabloid", title: "Mystery yacht photos spark three separate feuds" },
  { source: "The Sun", category: "tabloid", title: "Soap star's parking ticket becomes front-page saga" },
  { source: "The Mirror", category: "tabloid", title: "Royal corgi's diet 'leaked' by palace insider" },
  { source: "Reddit Viral", category: "viral", title: "Cat interrupts live parliament feed, becomes national icon" },
  { source: "BuzzFeed", category: "viral", title: "Quiz determining which scandal you are crashes from traffic" },
];

export async function GET() {
  let items: SatiricalNewsItem[] = [];
  try {
    const feeds = await fetchAllFeeds();
    for (const f of feeds) {
      const cat = BUCKET[f.sourceId];
      if (cat) items.push(toItem(f.source, cat, f.title, f.image, f.link));
    }
  } catch {
    items = [];
  }

  const live = items.length > 0;
  if (!live) items = DEMO.map((d) => toItem(d.source, d.category, d.title));

  const byCategory: Record<NewsCategory, SatiricalNewsItem[]> = { entertainment: [], celebrity: [], tabloid: [], crypto: [], political: [], viral: [] };
  for (const it of items) byCategory[it.category].push(it);
  for (const c of CATEGORIES) byCategory[c] = byCategory[c].slice(0, 10); // top 10 per bucket

  return NextResponse.json({ success: true, source: live ? "live" : "demo", byCategory });
}
