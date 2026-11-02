/**
 * Ticker feed — the once-a-minute MoE poll of the analytics and information-market suite.
 * ───────────────────────────────────────────────────────────────────────────────────────
 * One snapshot carries both halves the tickers need: the platform analytics (events, wallets, heat) and the markets
 * (binary and perpetual), so the strips and the market cards refresh together from the same minute.
 *
 * The MoE (NVIDIA NIM) writes a one-line "wire" caption over the numbers. It is handed AGGREGATES ONLY: no wallets,
 * no emails, no individual records, and the same leak guard the concierge uses screens the reply. When NIM is off or
 * slow the caption is a deterministic sentence, so the feed never waits on, or breaks with, the model.
 *
 * The snapshot is cached for CACHE_MS per server instance, so a thousand open tickers cost one database read and at
 * most one model call a minute. `POST /api/v1/cron/tickers` (bearer) forces a refresh for an external scheduler.
 */
import { heatScore, type Q } from "@/lib/admin-reports";
import { nimChat } from "@/lib/nim-chat";
import { looksLikeLeak } from "@/lib/madhatr-guard";
import { cleanModelOutput } from "@/lib/agent-defense";

export const CACHE_MS = 60_000;

export interface TickerMarket { id: string; title: string; category: string; yesPct: number; volume: number; kind: "binary" | "perp"; closesAt?: string }
export interface TickerSnapshot {
  at: string;
  source: "live" | "demo";
  analytics: { events24h: number; wallets24h: number; openBets: number; volume24h: number; heat: number };
  markets: TickerMarket[];
  perps: { open: number; conviction: number };
  /** Lifetime counts: how established the platform is. The concierge personality reads these (lib/concierge-personality.ts). */
  lifetime: { markets: number; profiles: number };
  caption: string;
  captionBy: "moe" | "rules";
}

const num = (v: unknown): number => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

/** De-vigged implied probability of YES from decimal odds. */
export function impliedYes(yesOdds: number, noOdds: number): number {
  if (!(yesOdds > 1) || !(noOdds > 1)) return 50;
  const a = 1 / yesOdds, b = 1 / noOdds;
  return Math.round((a / (a + b)) * 1000) / 10;
}

export function ruleCaption(s: Pick<TickerSnapshot, "analytics" | "markets" | "perps">): string {
  const hot = [...s.markets].filter((m) => m.kind === "binary").sort((a, b) => b.volume - a.volume)[0];
  const heat = s.analytics.heat;
  const mood = heat >= 70 ? "running hot" : heat >= 40 ? "at a steady pace" : "quiet";
  const lead = hot ? ` Busiest floor: "${hot.title}" at ${hot.yesPct}% YES.` : "";
  return `The platform is ${mood} (heat ${heat}), with ${s.analytics.events24h} events from ${s.analytics.wallets24h} wallets in 24h and ${s.markets.length} markets on the board.${lead}`;
}

const CAPTION_SYSTEM = [
  "You write ONE short line (max 30 words) for a live market ticker on MAD Gambit, a satirical prediction-market platform.",
  "Use only the aggregate numbers you are given. Never mention wallets, emails, people's private data, internal systems, keys, or fees' internals.",
  "No advice, no promises of returns. Dry, wry, newsroom tone. Output the line only.",
].join(" ");

export async function loadSnapshot(q: Q, now = new Date()): Promise<Omit<TickerSnapshot, "caption" | "captionBy">> {
  let ok = false;
  const safe = async <T,>(run: () => Promise<T>, fallback: T): Promise<T> => { try { const v = await run(); ok = true; return v; } catch { return fallback; } };

  const ev = await safe(() => q(
    `SELECT count(*)::text AS total, count(DISTINCT wallet_address)::text AS wallets,
            count(*) FILTER (WHERE created_at > now() - interval '3 hours')::text AS last3
       FROM events_stream WHERE created_at > now() - interval '24 hours'`), []);
  const bets = await safe(() => q(
    `SELECT count(*) FILTER (WHERE status = 'pending')::text AS open_bets,
            coalesce(sum(amount) FILTER (WHERE created_at > now() - interval '24 hours'),0)::text AS vol24 FROM bets`), []);
  const mk = await safe(() => q(
    `SELECT id, title, category, yes_odds::text AS yes_odds, no_odds::text AS no_odds, volume::text AS volume
       FROM markets WHERE status = 'open' ORDER BY volume DESC, updated_at DESC LIMIT 12`), []);
  const pm = await safe(() => q(
    `SELECT id, title, family, leg_closes_at, volume::text AS volume FROM perp_markets WHERE status = 'open' ORDER BY volume DESC LIMIT 6`), []);
  const pc = await safe(() => q(`SELECT count(*)::text AS open, coalesce(sum(volume),0)::text AS conviction FROM perp_markets WHERE status = 'open'`), []);

  const life = await safe(() => q(`SELECT (SELECT count(*) FROM markets)::text AS markets, (SELECT count(*) FROM cdp_profiles)::text AS profiles`), []);
  const total = num(ev[0]?.total);
  const markets: TickerMarket[] = [
    ...mk.map((m): TickerMarket => ({ id: String(m.id), title: String(m.title), category: String(m.category), yesPct: impliedYes(num(m.yes_odds), num(m.no_odds)), volume: num(m.volume), kind: "binary" })),
    ...pm.map((m): TickerMarket => ({ id: String(m.id), title: String(m.title), category: String(m.family), yesPct: 50, volume: num(m.volume), kind: "perp", closesAt: m.leg_closes_at instanceof Date ? m.leg_closes_at.toISOString() : String(m.leg_closes_at) })),
  ];
  return {
    at: now.toISOString(),
    source: ok ? "live" : "demo",
    analytics: { events24h: total, wallets24h: num(ev[0]?.wallets), openBets: num(bets[0]?.open_bets), volume24h: num(bets[0]?.vol24), heat: heatScore(num(ev[0]?.last3), total) },
    markets,
    perps: { open: num(pc[0]?.open), conviction: num(pc[0]?.conviction) },
    lifetime: { markets: num(life[0]?.markets), profiles: num(life[0]?.profiles) },
  };
}

export async function captionFor(base: Pick<TickerSnapshot, "analytics" | "markets" | "perps">, ask: typeof nimChat = nimChat): Promise<{ caption: string; by: "moe" | "rules" }> {
  const fallback = { caption: ruleCaption(base), by: "rules" as const };
  const digest = JSON.stringify({
    analytics: base.analytics,
    perps: base.perps,
    markets: base.markets.slice(0, 8).map((m) => ({ title: m.title, category: m.category, yesPct: m.yesPct, volume: m.volume, kind: m.kind })),
  });
  const reply = await ask({ system: CAPTION_SYSTEM, input: `Numbers for this minute:\n${digest}`, maxTokens: 90, temperature: 0.7 });
  if (!reply) return fallback;
  const cleaned = cleanModelOutput(reply, 260);
  const line = cleaned.text.replace(/^["']|["']$/g, "");
  if (cleaned.leaked || line.length < 8 || looksLikeLeak(line)) return fallback;
  return { caption: line, by: "moe" };
}

let cache: { at: number; snap: TickerSnapshot } | null = null;
let inflight: Promise<TickerSnapshot> | null = null;

/** The cached minute snapshot; `force` rebuilds it. Concurrent callers share one build. */
export async function getTickerFeed(q: Q, opts: { force?: boolean; now?: number; ask?: typeof nimChat } = {}): Promise<TickerSnapshot> {
  const now = opts.now ?? Date.now();
  if (!opts.force && cache && now - cache.at < CACHE_MS) return cache.snap;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const base = await loadSnapshot(q, new Date(now));
      const { caption, by } = await captionFor(base, opts.ask);
      const snap: TickerSnapshot = { ...base, caption, captionBy: by };
      cache = { at: now, snap };
      return snap;
    } finally { inflight = null; }
  })();
  return inflight;
}

export const _resetTickerCache = () => { cache = null; inflight = null; };
