/**
 * Trade guard — anti-bot and anti-quant limits on every route that moves a price or a balance.
 * ───────────────────────────────────────────────────────────────────────────────────────────
 * Rate limits cap volume per IP. They do not stop what quant-style abuse actually looks like: one wallet firing
 * orders at machine speed to snipe a thin book, flipping sides to wash volume or spoof the price, or hammering in a
 * metronome rhythm no person has. This guard works per WALLET (the authenticated identity) and checks:
 *
 *   velocity   at most MAX_PER_MIN orders a minute
 *   spacing    at least MIN_GAP_MS between orders (sub-second repeat orders are a script, not a hand)
 *   flip       an opposite-side order on the same market within FLIP_MS is a wash/spoof pattern
 *   metronome  eight orders with near-identical gaps
 *   size       a single order above MAX_ORDER (default 10,000 $MADx; env TRADE_MAX_ORDER) is refused outright
 *
 * It refuses with a reason and a retry hint; repeated trips put the wallet in a short cool-off. In-memory per
 * instance, like the rate limiter: a first wall, with the real balance and book checks still done in the database.
 */
import { noteThreat } from "@/lib/threat-status";

export const MAX_PER_MIN = 20;
export const MIN_GAP_MS = 800;
export const FLIP_MS = 10_000;
export const COOLOFF_MS = 60_000;

interface W { times: number[]; gaps: number[]; last: Map<string, { side: string; at: number }>; trips: number; coolUntil: number }
const wallets = new Map<string, W>();

export interface TradeVerdict { ok: boolean; reason?: "cool-off" | "too-fast" | "velocity" | "flip" | "metronome" | "size"; retryAfterS?: number }

export const maxOrder = (env: Record<string, string | undefined> = process.env): number => {
  const n = Number(env.TRADE_MAX_ORDER);
  return Number.isFinite(n) && n > 0 ? n : 10_000;
};

export function checkTrade(wallet: string, marketId: string, side: string, amount: number, now = Date.now(), cap = maxOrder()): TradeVerdict {
  const key = wallet.toLowerCase();
  let w = wallets.get(key);
  if (!w) {
    if (wallets.size > 50_000) for (const [k, v] of wallets) if (v.coolUntil < now && !v.times.some((t) => now - t < 60_000)) wallets.delete(k);
    w = { times: [], gaps: [], last: new Map(), trips: 0, coolUntil: 0 };
    wallets.set(key, w);
  }
  const trip = (reason: NonNullable<TradeVerdict["reason"]>, retryS: number): TradeVerdict => {
    w!.trips += 1;
    noteThreat(reason === "flip" || reason === "metronome" ? "attack" : "scan", `trade-${reason}`, now);
    if (w!.trips >= 3) { w!.coolUntil = now + COOLOFF_MS * Math.min(8, w!.trips - 2); }
    return { ok: false, reason, retryAfterS: retryS };
  };

  if (w.coolUntil > now) return { ok: false, reason: "cool-off", retryAfterS: Math.ceil((w.coolUntil - now) / 1000) };
  if (!(amount > 0) || amount > cap) return trip("size", 1);

  w.times = w.times.filter((t) => now - t < 60_000);
  const lastAt = w.times[w.times.length - 1];
  if (lastAt !== undefined && now - lastAt < MIN_GAP_MS) return trip("too-fast", 1);
  if (w.times.length >= MAX_PER_MIN) return trip("velocity", Math.ceil((60_000 - (now - w.times[0])) / 1000));

  const prev = w.last.get(marketId);
  if (prev && prev.side !== side && now - prev.at < FLIP_MS) return trip("flip", Math.ceil((FLIP_MS - (now - prev.at)) / 1000));

  if (lastAt !== undefined) {
    w.gaps.push(now - lastAt);
    if (w.gaps.length > 8) w.gaps.shift();
    if (w.gaps.length >= 8) {
      const mean = w.gaps.reduce((a, b) => a + b, 0) / w.gaps.length;
      const sd = Math.sqrt(w.gaps.reduce((a, b) => a + (b - mean) ** 2, 0) / w.gaps.length);
      if (mean < 15_000 && sd / Math.max(1, mean) < 0.03) { w.gaps = []; return trip("metronome", 30); }
    }
  }

  w.times.push(now);
  w.last.set(marketId, { side, at: now });
  if (w.last.size > 200) w.last.delete(w.last.keys().next().value as string);
  return { ok: true };
}

export const resetTradeGuard = () => wallets.clear();

export const tradeRefusal = (v: TradeVerdict): Response =>
  new Response(JSON.stringify({ success: false, error: v.reason === "size" ? "order size is outside the allowed range" : "trading too fast: slow down and retry", reason: v.reason }), {
    status: 429,
    headers: { "content-type": "application/json", "retry-after": String(v.retryAfterS ?? 5), "cache-control": "no-store" },
  });
