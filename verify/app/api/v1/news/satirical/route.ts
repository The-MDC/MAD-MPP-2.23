import { NextResponse } from "next/server";
import { fetchAllFeeds, FEED_SOURCES } from "@/lib/rss-feeds";
import { satirizeHeadline, type NewsCategory } from "@/lib/satire-headline";
import { satireMetrics } from "@/lib/satire-metrics";
import { computeHeatForPool, type HeatInput, type HeatSignals } from "@/lib/heat-score";

/**
 * GET /api/v1/news/satirical — the rotating satirical-news feed, bucketed into
 * the 6 canonical hub categories from the top publishers. Each item
 * carries the REAL headline, OUR satirical rewrite, the source image (when the feed
 * provides one), and Z-Liar/GossipCop satire metrics. Live RSS when reachable;
 * otherwise demo rows through the SAME real satirizer + scorer.
 */
export const revalidate = 300;

// The 6 canonical hub categories (founder marketing taxonomy), in left-rail order.
const CATEGORIES: NewsCategory[] = [
  "headlines", "entertainment", "sports", "viraltech", "crypto", "tabloid",
];

// sourceId → display bucket. Onion/Bee are already satire, so they feed the
// Tabloids & Gossip bucket rather than being excluded. Sources without a live
// feed (sports) are backfilled from DEMO below so every category still shows
// cards.
const BUCKET: Record<string, NewsCategory> = {
  eonline: "entertainment", variety: "entertainment",
  tmz: "entertainment", pagesix: "entertainment", people: "entertainment", usweekly: "entertainment",
  dailymail: "tabloid", thesun: "tabloid", mirror: "tabloid",
  coindesk: "crypto", cointelegraph: "crypto", decrypt: "crypto", theblock: "crypto", bankless: "crypto",
  reuters: "headlines", politico: "headlines", thehill: "headlines", bbcpolitics: "headlines", axios: "headlines",
  redditviral: "viraltech", buzzfeed: "viraltech",
  theonion: "tabloid", babylonbee: "tabloid",
};

export interface SatiricalNewsItem {
  source: string;
  category: NewsCategory;
  image: string | null;
  realHeadline: string;
  satiricalHeadline: string;
  satireScore: number;
  verdict: string;
  entertainmentGrade: boolean;
  assertionRisk: number;
  needsReview: boolean;
  link: string;
  heat: number;            // 0–100 composite traffic-value score (drives the ordering)
  heatSignals: HeatSignals; // per-signal breakdown for the explainer popup
}

// Publisher metadata by id, for heat scoring of live items.
const SOURCE_META = new Map(FEED_SOURCES.map((s) => [s.id, s]));

// Default per-category publisher metadata for DEMO rows (no live feed metadata).
const DEMO_META: Record<NewsCategory, { trust: number; virality: number }> = {
  headlines: { trust: 7, virality: 1.4 }, entertainment: { trust: 7, virality: 1.8 },
  sports: { trust: 6, virality: 2.0 }, viraltech: { trust: 5, virality: 2.7 },
  crypto: { trust: 8, virality: 1.2 }, tabloid: { trust: 3, virality: 2.7 },
};

// A working record carries the satirized item plus the raw signals heat needs.
interface Raw extends Omit<SatiricalNewsItem, "heat" | "heatSignals"> {
  sourceId: string;
  publishedMs: number | null;
  trustScore: number;
  viralityWeight: number;
}

function toRaw(
  source: string, sourceId: string, category: NewsCategory, title: string,
  meta: { trust: number; virality: number }, publishedMs: number | null, image?: string, link = "",
): Raw {
  const m = satireMetrics(title);
  return {
    source, sourceId, category, image: image ?? null, realHeadline: title,
    satiricalHeadline: satirizeHeadline(title, category),
    satireScore: m.satireScore, verdict: m.verdict,
    entertainmentGrade: m.entertainmentGrade,
    assertionRisk: m.assertionRisk, needsReview: !m.lowAssertionRisk, link,
    publishedMs, trustScore: meta.trust, viralityWeight: meta.virality,
  };
}

function parseDate(s: string | undefined): number | null {
  if (!s) return null;
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : null;
}

const DEMO: { source: string; category: NewsCategory; title: string }[] = [
  { source: "Page Six", category: "entertainment", title: "Pop couple spotted arguing over a single shared dessert" },
  { source: "TMZ", category: "entertainment", title: "Reality star launches feud, then a candle line, in the same afternoon" },
  { source: "People", category: "entertainment", title: "A-lister's cryptic post sends fans into a 3 a.m. spiral" },
  { source: "Variety", category: "entertainment", title: "Streaming giant greenlights a fourth cinematic universe nobody asked for" },
  { source: "E!", category: "entertainment", title: "Awards show run-time officially longer than some marriages" },
  { source: "The Feed", category: "viraltech", title: "Mega-influencer apologizes for the apology about the first apology" },
  { source: "CreatorWire", category: "viraltech", title: "Top KOL pivots from skincare to geopolitics in a single reel" },
  { source: "ClipHouse", category: "viraltech", title: "Podcaster's 'unfiltered' take turns out to be a brand partnership" },
  { source: "Politico", category: "headlines", title: "Bipartisan committee agrees only on the catering order" },
  { source: "The Hill", category: "headlines", title: "Official denies rumor no one had actually reported yet" },
  { source: "BBC Politics", category: "headlines", title: "Landmark bill passes, immediately scheduled for repeal" },
  { source: "SidelineDesk", category: "sports", title: "Star athlete requests trade, then requests to un-request it" },
  { source: "The Booth", category: "sports", title: "Coach blames the loss on 'the vibes' during live presser" },
  { source: "OvertimeWire", category: "sports", title: "Fantasy league feud escalates into an actual group-chat exit" },
  { source: "Daily Mail", category: "tabloid", title: "Mystery yacht photos spark three separate feuds" },
  { source: "The Sun", category: "tabloid", title: "Soap star's parking ticket becomes front-page saga" },
  { source: "The Mirror", category: "tabloid", title: "Royal corgi's diet 'leaked' by palace insider" },
  { source: "TV Line", category: "entertainment", title: "Beloved series renewed for a season the writers openly dread" },
  { source: "ScreenBeat", category: "entertainment", title: "Reality finale reunion cancelled after cast reunites early, chaotically" },
  { source: "The Guide", category: "entertainment", title: "Streaming algorithm recommends the show it just cancelled" },
  { source: "Reddit Viral", category: "viraltech", title: "Cat interrupts live parliament feed, becomes national icon" },
  { source: "BuzzFeed", category: "viraltech", title: "Quiz determining which scandal you are crashes from traffic" },
  { source: "CoinDesk", category: "crypto", title: "Token rallies 40% on a roadmap that is mostly vibes" },
  { source: "Decrypt", category: "crypto", title: "Anonymous developer promises the airdrop is 'basically done'" },
  { source: "The Block", category: "crypto", title: "Exchange adds a coin, then quietly adds a disclaimer" },
  { source: "The Onion", category: "tabloid", title: "Official at podium slowly realizes the mic was on the entire time" },
  { source: "Babylon Bee", category: "tabloid", title: "Ribbon-cutting ceremony ruined by ceremonial scissors that don't cut" },
  { source: "Gaffe Desk", category: "tabloid", title: "Keynote demo works flawlessly in rehearsal, combusts on stage" },
];

// Deterministic pseudo-age for a demo row (0–36h) so velocity varies without a feed.
function demoAgeMs(title: string): number {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) | 0;
  return (Math.abs(h) % 36) * 3_600_000;
}

function demoRaw(now: number): Raw[] {
  return DEMO.map((d) =>
    toRaw(d.source, d.source, d.category, d.title, DEMO_META[d.category], now - demoAgeMs(d.title)),
  );
}

export async function GET() {
  const now = Date.now();
  let items: Raw[] = [];
  try {
    const feeds = await fetchAllFeeds();
    for (const f of feeds) {
      const cat = BUCKET[f.sourceId];
      if (!cat) continue;
      const meta = SOURCE_META.get(f.sourceId);
      items.push(
        toRaw(f.source, f.sourceId, cat, f.title,
          { trust: meta?.trust_score ?? 5, virality: meta?.virality_weight ?? 1.5 },
          parseDate(f.published), f.image, f.link),
      );
    }
  } catch {
    items = [];
  }

  const live = items.length > 0;
  if (!live) items = demoRaw(now);

  // Backfill any empty bucket so all 6 categories always show hub-style cards
  // (categories without a live feed yet: sports — and any feed that was
  // unreachable this fetch). Demo rows join the SAME pool so heat is scored
  // against everything shown.
  const present = new Set(items.map((r) => r.category));
  if (live) {
    for (const c of CATEGORIES) {
      if (!present.has(c)) items.push(...demoRaw(now).filter((r) => r.category === c));
    }
  }

  // Score the whole pool together so cross-publisher pickup is measured across
  // every source, then attach heat + signals to each item.
  const heat = computeHeatForPool(
    items.map<HeatInput>((r) => ({
      id: r.link || r.realHeadline, sourceId: r.sourceId, title: r.realHeadline,
      publishedMs: r.publishedMs, trustScore: r.trustScore, viralityWeight: r.viralityWeight,
      satireScore: r.satireScore,
    })),
    now,
  );
  const scored: SatiricalNewsItem[] = items.map((r, i) => {
    const { sourceId, publishedMs, trustScore, viralityWeight, ...pub } = r;
    void sourceId; void publishedMs; void trustScore; void viralityWeight;
    return { ...pub, heat: heat[i].heat, heatSignals: heat[i].signals };
  });

  const byCategory: Record<NewsCategory, SatiricalNewsItem[]> = {
    headlines: [], entertainment: [], sports: [], viraltech: [], crypto: [], tabloid: [],
  };
  for (const it of scored) byCategory[it.category].push(it);
  // Auto-surface the hottest first: sort each bucket by heat desc, cap at 10.
  for (const c of CATEGORIES) {
    byCategory[c].sort((a, b) => b.heat - a.heat);
    byCategory[c] = byCategory[c].slice(0, 10);
  }

  // Top headlines across all categories, hottest first — powers the automated carousel.
  const top = [...scored].sort((a, b) => b.heat - a.heat).slice(0, 20);

  return NextResponse.json({ success: true, source: live ? "live" : "demo", byCategory, top });
}
